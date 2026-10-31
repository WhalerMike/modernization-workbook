#Requires -Version 7.2
<#
.SYNOPSIS
    HcmCorrelation: correlate an HCM extract with Active Directory and Entra ID on the person key.

.DESCRIPTION
    ILLUSTRATIVE: unit-tested against fixtures, not proven against live tenants.
    The PowerShell twin of python/hcm_correlate.py: the same statuses, reasons, counts and rates
    for the same input, asserted by both test suites against shared fixtures. Read-only: it reads
    the extract, the Start Kit's ad-user-export.csv and an optional Entra ID users export, and
    returns the result. Invoke-HcmCorrelation.ps1 writes the two files.
#>
Set-StrictMode -Version 3.0

$script:Problem = @('matched_with_conflicts', 'hr_only', 'directory_only', 'duplicate_key', 'no_key', 'hr_no_key')
$script:StatusOrder = @('matched', 'matched_with_conflicts', 'hr_only', 'hr_only_inactive', 'directory_only',
    'directory_only_disabled', 'duplicate_key', 'no_key', 'hr_no_key')
$script:Fields = @(
    @('org_code', 'organization code', 'extensionAttribute10'),
    @('worker_type_code', 'worker type code', 'extensionAttribute11'),
    @('worker_type', 'worker type', 'employeeType'),
    @('position_category', 'position category', 'extensionAttribute12'),
    @('manager', 'manager''s key', 'manager')
)

function Get-Prop($Object, [string]$Name) {
    if ($null -eq $Object) { return $null }
    if ($Object -is [System.Collections.IDictionary]) { if ($Object.Contains($Name)) { return $Object[$Name] }; return $null }
    $p = $Object.PSObject.Properties[$Name]
    if ($p) { return $p.Value }
    $null
}
function Get-Text($Value) { if ($null -eq $Value) { return '' }; "$Value".Trim() }
function Get-NormKey($Value) { (Get-Text $Value).ToUpperInvariant() }
function Test-True($Value) { $Value -is [bool] -and $Value -or (Get-Text $Value).ToLowerInvariant() -eq 'true' }

function Read-HcmEntraExport {
    # A JSON array of Graph users, or a saved {"value": [...]} page. Guests aren't the workforce.
    param([Parameter(Mandatory)][string]$Path)
    $data = Get-Content -LiteralPath $Path -Raw -Encoding utf8 | ConvertFrom-Json -AsHashtable
    if ($data -is [System.Collections.IDictionary]) { $data = @($data['value']) }
    @($data | Where-Object { $t = Get-Prop $_ 'userType'; -not $t -or $t -eq 'Member' })
}

function Get-AdView($Row) {
    [ordered]@{
        enabled           = Test-True (Get-Prop $Row 'Enabled')
        org_code          = Get-Text (Get-Prop $Row 'extensionAttribute10')
        worker_type_code  = Get-Text (Get-Prop $Row 'extensionAttribute11')
        position_category = Get-Text (Get-Prop $Row 'extensionAttribute12')
        worker_type       = Get-Text (Get-Prop $Row 'EmployeeType')
        manager           = Get-NormKey (Get-Prop $Row 'ManagerEmployeeId')
        manager_read      = $true
        service_account   = Test-True (Get-Prop $Row 'HasSpn')
        account           = 'ad:' + (Get-Text (Get-Prop $Row 'SID'))
    }
}

function Get-EntraView($User) {
    $ext = Get-Prop $User 'onPremisesExtensionAttributes'
    $hasManager = ($User -is [System.Collections.IDictionary] -and $User.Contains('manager')) -or ($User -isnot [System.Collections.IDictionary] -and $User.PSObject.Properties['manager'])
    [ordered]@{
        enabled           = (Get-Prop $User 'accountEnabled') -eq $true
        org_code          = Get-Text (Get-Prop $ext 'extensionAttribute10')
        worker_type_code  = Get-Text (Get-Prop $ext 'extensionAttribute11')
        position_category = Get-Text (Get-Prop $ext 'extensionAttribute12')
        worker_type       = Get-Text (Get-Prop $User 'employeeType')
        manager           = Get-NormKey (Get-Prop (Get-Prop $User 'manager') 'employeeId')
        manager_read      = [bool]$hasManager
        service_account   = $false
        account           = 'entra:' + (Get-Text (Get-Prop $User 'id'))
    }
}

function Get-HrExpected($Row, $Mapping) {
    $statusType = (Get-Text (Get-Prop $Row 'AssignmentStatusType')).ToUpperInvariant()
    $status = $Mapping.assignment_status_types[$statusType]
    $worker = $Mapping.worker_types[(Get-Text (Get-Prop $Row 'WorkerType')).ToUpperInvariant()]
    [ordered]@{
        active            = [bool]($status -and $status.active)
        status            = $statusType
        org_code          = Get-Text (Get-Prop $Row 'DepartmentCode')
        worker_type_code  = $(if ($worker) { $worker.code } else { $null })
        worker_type       = $(if ($worker) { $worker.employeeType } else { $null })
        position_category = Get-Text (Get-Prop $Row 'PositionCategory')
        manager           = Get-NormKey (Get-Prop $Row 'ManagerPersonNumber')
    }
}

function Compare-HcmRecord($Hr, [string]$Side, $View) {
    # Field names and reasons where one directory account disagrees with the HR record.
    $fields = [System.Collections.Generic.List[string]]::new()
    $reasons = [System.Collections.Generic.List[string]]::new()
    $label = if ($Side -eq 'ad') { 'AD' } else { 'Entra ID' }
    if (-not $Hr.active -and $View.enabled) {
        $fields.Add("$Side.account_enabled"); $reasons.Add("HR status $($Hr.status), but the $label account is enabled")
    } elseif ($Hr.active -and -not $View.enabled) {
        $fields.Add("$Side.account_enabled"); $reasons.Add("HR status $($Hr.status), but the $label account is disabled")
    }
    foreach ($f in $script:Fields) {
        $want = $Hr[$f[0]]
        if ($null -eq $want -or ($f[0] -eq 'manager' -and -not $View.manager_read)) { continue }
        if ($want -cne $View[$f[0]]) {
            $fields.Add("$Side.$($f[0])"); $reasons.Add("$label $($f[2]) differs from HR's $($f[1])")
        }
    }
    , @($fields.ToArray(), $reasons.ToArray())
}

function Add-ToList([System.Collections.IDictionary]$Map, [string]$Key, $Value) {
    if (-not $Map.Contains($Key)) { $Map[$Key] = [System.Collections.Generic.List[object]]::new() }
    $Map[$Key].Add($Value)
}

function Invoke-HcmCorrelationJoin {
    <#
    .SYNOPSIS
        The join: every key's status, conflicts and reasons, the counts and rates, and the
        quarantine entries. Rows are the extract and the AD export as Import-Csv reads them;
        EntraUsers is $null when no Entra export was given.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][object[]]$HrRows,
        [Parameter(Mandatory)][object[]]$AdRows,
        [object[]]$EntraUsers,
        [Parameter(Mandatory)]$Mapping
    )
    $hr = [ordered]@{}; $hrNoKey = [System.Collections.Generic.List[object]]::new()
    foreach ($row in $HrRows) {
        $k = Get-NormKey (Get-Prop $row 'PersonNumber')
        if ($k) { Add-ToList $hr $k $row } else { $hrNoKey.Add($row) }
    }
    $sides = @{ ad = @{}; entra = @{} }
    $noKey = [System.Collections.Generic.List[object]]::new()
    $skipped = 0
    foreach ($row in $AdRows) {
        $v = Get-AdView $row
        if ($v.service_account) { $skipped++; continue }
        $k = Get-NormKey (Get-Prop $row 'EmployeeId')
        if ($k) { Add-ToList $sides.ad $k @($v, $row) } elseif ($v.enabled) { $noKey.Add(@('ad', $v, $row)) }
    }
    foreach ($u in @($EntraUsers)) {
        if ($null -eq $u) { continue }
        $v = Get-EntraView $u
        $k = Get-NormKey (Get-Prop $u 'employeeId')
        if ($k) { Add-ToList $sides.entra $k @($v, $u) } elseif ($v.enabled) { $noKey.Add(@('entra', $v, $u)) }
    }

    $records = [System.Collections.Generic.List[object]]::new()
    $quarantine = [System.Collections.Generic.List[object]]::new()
    $conflictsByField = @{}
    $keys = @(@($hr.Keys) + @($sides.ad.Keys) + @($sides.entra.Keys) | Sort-Object -Unique -CaseSensitive)
    # Python's sorted(): ordinal order.
    $keys = [string[]]$keys
    [System.Array]::Sort($keys, [System.StringComparer]::Ordinal)
    foreach ($key in $keys) {
        $h = @(if ($hr.Contains($key)) { $hr[$key] })
        $a = @(if ($sides.ad.ContainsKey($key)) { $sides.ad[$key] })
        $e = @(if ($sides.entra.ContainsKey($key)) { $sides.entra[$key] })
        $fields = [System.Collections.Generic.List[string]]::new()
        $reasons = [System.Collections.Generic.List[string]]::new()
        if ($h.Count -gt 1 -or $a.Count -gt 1 -or $e.Count -gt 1) {
            $status = 'duplicate_key'
            foreach ($pair in @(@('HR', $h.Count), @('AD', $a.Count), @('Entra ID', $e.Count))) {
                if ($pair[1] -gt 1) { $reasons.Add("held by $($pair[1]) records in $($pair[0])") }
            }
        } elseif ($h.Count -and ($a.Count -or $e.Count)) {
            $want = Get-HrExpected $h[0] $Mapping
            foreach ($pair in @(@('ad', $a), @('entra', $e))) {
                if (@($pair[1]).Count) {
                    $c = Compare-HcmRecord $want $pair[0] (@($pair[1])[0][0])
                    foreach ($x in $c[0]) { $fields.Add($x) }
                    foreach ($x in $c[1]) { $reasons.Add($x) }
                }
            }
            $status = if ($fields.Count) { 'matched_with_conflicts' } else { 'matched' }
            foreach ($f in $fields) { $conflictsByField[$f] = 1 + [int]$conflictsByField[$f] }
        } elseif ($h.Count) {
            if ((Get-HrExpected $h[0] $Mapping).active) {
                $status = 'hr_only'; $reasons.Add('an active worker with no account in either directory: a missing identity')
            } else { $status = 'hr_only_inactive' }
        } else {
            if (@(@($a) + @($e) | Where-Object { $_[0].enabled }).Count) {
                $status = 'directory_only'; $reasons.Add('an enabled account no worker record holds: an orphan candidate, owned or on a dated exception')
            } else { $status = 'directory_only_disabled' }
        }
        $records.Add([ordered]@{
                person_key = $key; status = $status
                sides      = [ordered]@{ hr = $h.Count; ad = $a.Count; entra = $e.Count }
                conflicts  = @($fields); reasons = @($reasons)
            })
        if ($script:Problem -contains $status) {
            $quarantine.Add([ordered]@{
                    person_key = $key; status = $status; reasons = @($reasons)
                    hr_records = @($h); ad_accounts = @($a | ForEach-Object { $_[1] }); entra_accounts = @($e | ForEach-Object { $_[1] })
                })
        }
    }
    $why = 'an enabled account with no person key: it can''t be correlated'
    foreach ($n in $noKey) {
        $side = $n[0]; $v = $n[1]; $raw = $n[2]
        $records.Add([ordered]@{ person_key = ''; account = $v.account; status = 'no_key'
                sides = [ordered]@{ hr = 0; ad = [int]($side -eq 'ad'); entra = [int]($side -eq 'entra') }; conflicts = @(); reasons = @($why) })
        $quarantine.Add([ordered]@{ person_key = ''; account = $v.account; status = 'no_key'; reasons = @($why); hr_records = @()
                ad_accounts = @(if ($side -eq 'ad') { $raw }); entra_accounts = @(if ($side -eq 'entra') { $raw }) })
    }
    $why = 'an HR record with no person number: it can''t be correlated'
    foreach ($row in $hrNoKey) {
        $records.Add([ordered]@{ person_key = ''; status = 'hr_no_key'; sides = [ordered]@{ hr = 1; ad = 0; entra = 0 }; conflicts = @(); reasons = @($why) })
        $quarantine.Add([ordered]@{ person_key = ''; status = 'hr_no_key'; reasons = @($why); hr_records = @($row); ad_accounts = @(); entra_accounts = @() })
    }

    $counts = [ordered]@{}
    foreach ($s in $script:StatusOrder) { $counts[$s] = 0 }
    foreach ($r in $records) { $counts[$r.status]++ }
    $isMatched = { param($r) $r.status -in @('matched', 'matched_with_conflicts') }
    $active = @($hr.Keys | Where-Object { $hr[$_].Count -eq 1 -and (Get-HrExpected $hr[$_][0] $Mapping).active }).Count
    $activeMatched = @($records | Where-Object { (& $isMatched $_) -and (Get-HrExpected $hr[$_.person_key][0] $Mapping).active }).Count
    $enabled = $noKey.Count
    foreach ($side in $sides.Values) { foreach ($items in $side.Values) { foreach ($i in $items) { if ($i[0].enabled) { $enabled++ } } } }
    $enabledMatched = 0
    foreach ($r in @($records | Where-Object { & $isMatched $_ })) {
        foreach ($side in 'ad', 'entra') {
            if ($sides[$side].ContainsKey($r.person_key)) { foreach ($i in $sides[$side][$r.person_key]) { if ($i[0].enabled) { $enabledMatched++ } } }
        }
    }
    $byField = [ordered]@{}
    foreach ($k in @($conflictsByField.Keys | Sort-Object -CaseSensitive)) { $byField[$k] = $conflictsByField[$k] }
    [ordered]@{
        counts             = $counts
        totals             = [ordered]@{
            hr_records                  = @($HrRows).Count
            ad_accounts                 = @($AdRows).Count - $skipped
            ad_service_accounts_skipped = $skipped
            entra_accounts              = $(if ($null -eq $EntraUsers) { $null } else { @($EntraUsers).Count })
            quarantined                 = $quarantine.Count
        }
        rates              = [ordered]@{
            active_workers_matched_percent   = $(if ($active) { [math]::Round(100 * $activeMatched / $active, 1, [System.MidpointRounding]::ToEven) } else { $null })
            enabled_accounts_matched_percent = $(if ($enabled) { [math]::Round(100 * $enabledMatched / $enabled, 1, [System.MidpointRounding]::ToEven) } else { $null })
        }
        conflicts_by_field = $byField
        records            = @($records)
        quarantine         = @($quarantine)
    }
}

function Get-HcmCorrelationReport {
    # The report file's content: keys, statuses, counts and conflict field names; no names, no values.
    param([Parameter(Mandatory)]$Result, [Parameter(Mandatory)][datetime]$AsOf, [Parameter(Mandatory)]$Inputs)
    [ordered]@{
        schema             = 'fmp-hcm-correlation/1'
        as_of              = $AsOf.ToString('yyyy-MM-dd')
        inputs             = $Inputs
        counts             = $Result.counts
        totals             = $Result.totals
        rates              = $Result.rates
        conflicts_by_field = $Result.conflicts_by_field
        records            = $Result.records
    }
}

Export-ModuleMember -Function Read-HcmEntraExport, Invoke-HcmCorrelationJoin, Get-HcmCorrelationReport
