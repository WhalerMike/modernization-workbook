#Requires -Version 7.1
<#
    NpiGmsaStandard: Chapter 12 of the developer workbook "Building Non-Person Identity".

    The managed service account standard, checked from files: an approved request exported from
    SailPoint (reached through the agency's system access management tool) checked against the
    naming, ownership, retriever-group and outbound-only rules (WD-154, WD-159, WD-160, WD-162,
    WD-164) and turned into Chapter 06's reviewed inputs; SailPoint's aggregated Active Directory
    accounts reconciled with an Active Directory read of every gMSA and dMSA; certifications due
    by risk tier (WD-166) and each REVOKE turned into a typed ServiceNow finding; Defender for
    Identity's service account list compared with the register; and the 90-day retirement window
    for disabled accounts (WD-167). Findings NPI-STD-01 to NPI-STD-30.

    Read only. Its one Active Directory read is declared in config/calls-ch12.json; it writes
    nothing to any system. A run folder holds findings.json, the generated files, evidence.json
    (one row per step and control, from config/requirements-ch12.json) and manifest.json with the
    SHA-256 of every input and output.

    The request, register, SailPoint, certification and Defender for Identity files are the kit's
    import format: the products' own export fields are not yet specified.

    Illustrative: tested against fixtures, not against a production domain or tenant.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot '../NpiCore/NpiCore.psm1') -Force -Global

$script:ModuleVersion = '1.0.0'
$script:CallsPath = Join-Path $PSScriptRoot '../../config/calls-ch12.json'
$script:RequirementsPath = Join-Path $PSScriptRoot '../../config/requirements-ch12.json'
$script:Task = 'msa-standard'
# WD-159: 15 characters or fewer before the trailing $ (Learn's New-ADServiceAccount recommends a
# SAM account name of 15 characters or less for older operating systems).
$script:MaxNameLength = 15
# WD-173: lowercase letters and digits, starting with a letter, and a role suffix only from this list.
$script:RoleSuffixes = @('sql', 'agt', 'rs', 'is', 'web', 'svc', 'task')
# WD-175: the program's tag keys, written as key=value pairs in each account's AD description,
# and the values the closed keys take. SailPoint is the source for owners; AD carries a copy.
$script:TagKeys = @('SystemId', 'Owner1', 'Owner2', 'Sponsor', 'Environment', 'Tier', 'EntraTarget', 'Request', 'Change')
$script:TagValues = @{
    Environment = @('prod', 'test', 'dev')
    Tier        = @('R1', 'R2', 'R3')
    EntraTarget = @('ManagedIdentity', 'AppRegistrationFederated', 'AppRegistrationCertificate', 'GmsaPlusAppRegistration', 'KeepKerberos', 'Retire', 'Undecided')
}
$script:AccountTypes = @('gMSA', 'dMSA')
$script:Workloads = @('Service', 'IisAppPool', 'ScheduledTask')
$script:RiskTiers = [ordered]@{ R1 = 3; R2 = 6; R3 = 12 }   # WD-166: months between certifications
$script:DueSoonDays = 30
$script:PasswordIntervalDays = 30                           # the guide's stated default, set only at creation (Learn)
$script:RetirementDays = 90                                 # WD-167
$script:PrivilegedGroups = @('Domain Admins', 'Enterprise Admins', 'Administrators', 'Schema Admins', 'Account Operators', 'Backup Operators', 'Server Operators', 'Print Operators')
$script:ReplatformHeader = @('SamAccountName', 'NewAccount', 'Workload', 'Hosts', 'SpnOwnerUpn', 'EndDate', 'Reference', 'HostChangedOn', 'MigrationStartedOn', 'OutboundOnlyReason', 'RequestId', 'ChangeRecord')
$script:FindingSource = 'npi-msa-standard'

# ----------------------------------------------------------------------------- helpers

function Get-NpiStdProp {
    # A property of a parsed JSON object, CSV row or hashtable, or $Default when it's missing (StrictMode-safe).
    param($Object, [string]$Name, $Default = $null)
    if ($null -eq $Object) { return $Default }
    if ($Object -is [Collections.IDictionary]) { if ($Object.Contains($Name)) { return $Object[$Name] } else { return $Default } }
    $p = $Object.PSObject.Properties[$Name]
    if ($p) { $p.Value } else { $Default }
}

function ConvertTo-NpiStdDate {
    <#
    .SYNOPSIS
        Parses an ISO 8601 date or date-time as UTC and returns a [datetime], or $null for an
        empty value. Throws on text that isn't a date.
    .EXAMPLE
        # 2026-11-20 00:00:00 UTC.
        ConvertTo-NpiStdDate '2026-11-20'
    #>
    param($Text)
    if ($null -eq $Text -or "$Text" -eq '') { return $null }
    # ConvertFrom-Json turns ISO strings into [datetime]: a Local one is converted, an Unspecified one taken as UTC.
    if ($Text -is [datetime]) { if ($Text.Kind -eq [DateTimeKind]::Local) { return $Text.ToUniversalTime() } return [datetime]::SpecifyKind($Text, [DateTimeKind]::Utc) }
    [datetime]::Parse("$Text", [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal)
}

function Get-NpiStdCn {
    # The first RDN's value of a distinguished name: 'CN=Domain Admins,CN=Users,...' -> 'Domain Admins'.
    param([string]$Dn)
    if ($Dn -match '^(?i:CN)=((?:\\,|[^,])+)') { $Matches[1].Replace('\,', ',') } else { $Dn }
}

function Get-NpiStdRetrieverGroupDn {
    <#
    .SYNOPSIS
        The distinguished name of an account's retriever group under WD-160:
        CN=DL-gMSA-<app>-Hosts,<GroupOu>.
    .EXAMPLE
        # CN=DL-gMSA-payroll-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example
        Get-NpiStdRetrieverGroupDn -AppShortName payroll -GroupOu 'OU=Groups,DC=corp,DC=contoso,DC=example'
    #>
    param([Parameter(Mandatory)][string]$AppShortName, [Parameter(Mandatory)][string]$GroupOu)
    "CN=DL-gMSA-$AppShortName-Hosts,$GroupOu"
}

function Get-NpiStdSortedFinding {
    param([object[]]$Findings)
    @($Findings | Where-Object { $_ } | Sort-Object Rule, ObjectKey, Issue)
}

# ----------------------------------------------------------------------------- the call list

function Get-NpiStdCallList {
    <#
    .SYNOPSIS
        Reads Chapter 12's call list (config/calls-ch12.json unless -Path names another file) and
        returns it as a hashtable of tasks and calls.
    .EXAMPLE
        # The tasks Chapter 12 declares.
        (Get-NpiStdCallList).tasks.Keys
    #>
    [CmdletBinding()]
    param([string]$Path = $script:CallsPath)
    Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
}

function Get-NpiStdRequiredRight {
    <#
    .SYNOPSIS
        Returns the Active Directory rights, cmdlets and methods the msa-standard task's declared
        calls need, combined into one object.
    .EXAMPLE
        # What a live Lab 2 read needs in the domain.
        Get-NpiStdRequiredRight
    #>
    [CmdletBinding()]
    param([string]$Task = $script:Task)
    $list = Get-NpiStdCallList
    if (-not $list.tasks.ContainsKey($Task)) { throw "Unknown task '$Task' in calls-ch12.json." }
    $calls = @($list.calls | Where-Object { $_.tasks -contains $Task })
    [pscustomobject]@{
        Task     = $Task
        AdRights = @($calls | ForEach-Object { $_.adRight } | Sort-Object -Unique)
        Cmdlets  = @($calls | ForEach-Object { $_.cmdlet } | Sort-Object -Unique)
        Methods  = @($calls | ForEach-Object { $_.method } | Sort-Object -Unique)
    }
}

function Get-NpiStdRequirement {
    <#
    .SYNOPSIS
        Reads config/requirements-ch12.json (or -Path) and returns it as a hashtable: the KSIs per
        control and the controls and evidence files per step.
    .EXAMPLE
        # The KSIs the program aligns AC-2 with.
        (Get-NpiStdRequirement).controls['AC-2'].ksis
    #>
    [CmdletBinding()]
    param([string]$Path = $script:RequirementsPath)
    Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
}

# ----------------------------------------------------------------------------- inputs

function Import-NpiStdStandard {
    <#
    .SYNOPSIS
        Reads the reviewed standard settings (domain, serviceAccountOu, groupOu) and returns them
        with the file's SHA-256. A missing value throws: there is no default OU.
    .EXAMPLE
        $std = Import-NpiStdStandard -Path tests/fixtures/ch12/standard.json
        $std.ServiceAccountOu
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { throw "Missing standard settings $Path." }
    $s = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
    foreach ($k in 'domain', 'serviceAccountOu', 'groupOu') { if (-not $s.ContainsKey($k) -or -not "$($s[$k])") { throw "$Path`: '$k' is required." } }
    [pscustomobject]@{ Domain = "$($s.domain)"; ServiceAccountOu = "$($s.serviceAccountOu)"; GroupOu = "$($s.groupOu)"; Path = $Path; Sha256 = Get-NpiFileHash -Path $Path }
}

function Import-NpiStdInput {
    <#
    .SYNOPSIS
        Reads Chapter 12's input folder, each file with its SHA-256: requests/*.json (approved
        requests exported from SailPoint), sailpoint-accounts.csv, ad-managed-accounts.json,
        msa-register.csv, certification-decisions.csv and mdi-service-accounts.csv. All are the
        kit's import format. A missing file throws. -AdManagedAccountsPath replaces the folder's
        AD read (Lab 2 with a live read). Returns @{ Requests; SailPoint; Ad; Register; Decisions; Mdi; Hashes }.
    .EXAMPLE
        $in = Import-NpiStdInput -InputPath tests/fixtures/ch12/inputs
        $in.Requests.Count
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$InputPath, [string]$AdManagedAccountsPath)
    $files = [ordered]@{
        'sailpoint-accounts.csv'      = Join-Path $InputPath 'sailpoint-accounts.csv'
        'ad-managed-accounts.json'    = $(if ($AdManagedAccountsPath) { $AdManagedAccountsPath } else { Join-Path $InputPath 'ad-managed-accounts.json' })
        'msa-register.csv'            = Join-Path $InputPath 'msa-register.csv'
        'certification-decisions.csv' = Join-Path $InputPath 'certification-decisions.csv'
        'mdi-service-accounts.csv'    = Join-Path $InputPath 'mdi-service-accounts.csv'
    }
    foreach ($k in $files.Keys) { if (-not (Test-Path -LiteralPath $files[$k])) { throw "Missing input $($files[$k])." } }
    $reqDir = Join-Path $InputPath 'requests'
    if (-not (Test-Path -LiteralPath $reqDir)) { throw "Missing $reqDir (one JSON file per approved request)." }
    $hashes = [ordered]@{}
    $requests = [Collections.Generic.List[object]]::new()
    foreach ($f in @(Get-ChildItem -LiteralPath $reqDir -Filter '*.json' -File | Sort-Object Name)) {
        $requests.Add([pscustomobject]@{ File = "requests/$($f.Name)"; Request = (Get-Content -LiteralPath $f.FullName -Raw | ConvertFrom-Json -AsHashtable) })
        $hashes["requests/$($f.Name)"] = Get-NpiFileHash -Path $f.FullName
    }
    foreach ($k in $files.Keys) { $hashes[$k] = Get-NpiFileHash -Path $files[$k] }
    $ad = Get-Content -LiteralPath $files['ad-managed-accounts.json'] -Raw | ConvertFrom-Json -AsHashtable
    [pscustomobject]@{
        Requests  = $requests.ToArray()
        SailPoint = @(Import-Csv -LiteralPath $files['sailpoint-accounts.csv'])
        Ad        = @($ad.accounts)
        Register  = @(Import-Csv -LiteralPath $files['msa-register.csv'])
        Decisions = @(Import-Csv -LiteralPath $files['certification-decisions.csv'])
        Mdi       = @(Import-Csv -LiteralPath $files['mdi-service-accounts.csv'])
        Hashes    = $hashes
    }
}

# ----------------------------------------------------------------------------- 1. the request check

function Test-NpiStdRequest {
    <#
    .SYNOPSIS
        Checks approved requests against the standard and returns @{ Findings; Results; Replatform;
        Retrievers; RetrieverRequests }. Findings NPI-STD-01 to NPI-STD-09, keyed by request ID. A
        request with no Finding-severity result passes and gets one kerberos-replatform.csv row
        (Chapter 06's columns, with OutboundOnlyReason, RequestId and ChangeRecord); a passing gMSA
        also gets a password-retrievers.json entry naming its DL-gMSA-<app>-Hosts group and the
        SailPoint request that approved it and the ServiceNow change that records it (Chapter 06's
        'requests' section; ServiceNow never approves, WD-162).
    .EXAMPLE
        $in = Import-NpiStdInput -InputPath tests/fixtures/ch12/inputs
        $std = Import-NpiStdStandard -Path tests/fixtures/ch12/standard.json
        $r = Test-NpiStdRequest -Requests $in.Requests -Standard $std -AsOf 2026-11-20
        $r.Results | Format-Table RequestId, Passed
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Requests, [Parameter(Mandatory)]$Standard, [Parameter(Mandatory)][datetime]$AsOf)
    $f = [Collections.Generic.List[object]]::new()
    $results = [Collections.Generic.List[object]]::new()
    $rows = [Collections.Generic.List[object]]::new()
    $retrievers = [ordered]@{}
    $retrieverRequests = [ordered]@{}
    $names = @{}
    foreach ($w in $Requests) { $n = "$(Get-NpiStdProp $w.Request 'proposedName' '')".ToLowerInvariant(); if ($n) { $names[$n] = 1 + $(if ($names.ContainsKey($n)) { $names[$n] } else { 0 }) } }

    foreach ($w in $Requests) {
        $q = $w.Request
        $id = "$(Get-NpiStdProp $q 'requestId' '')"; if (-not $id) { $id = $w.File }
        $name = "$(Get-NpiStdProp $q 'proposedName' '')"; $type = "$(Get-NpiStdProp $q 'accountType' '')"; $app = "$(Get-NpiStdProp $q 'appShortName' '')"
        $label = "$id ($name)"
        $mine = [Collections.Generic.List[object]]::new()
        $add = { param($rule, $sev, $issue) $mine.Add((New-NpiFinding $rule $sev $id $label $issue)) }

        # NPI-STD-01: approved in SailPoint (WD-162).
        $status = "$(Get-NpiStdProp $q 'status' '')"; $approvedOn = ConvertTo-NpiStdDate (Get-NpiStdProp $q 'approvedOn'); $requestedOn = ConvertTo-NpiStdDate (Get-NpiStdProp $q 'requestedOn')
        $approvers = @(Get-NpiStdProp $q 'approvers' @() | Where-Object { $_ })
        if ($status -ne 'APPROVED') { & $add 'NPI-STD-01' 'Finding' "Status '$status' in SailPoint, not APPROVED: SailPoint approves every managed service account request (WD-162)" }
        elseif (-not $approvedOn -or -not $approvers.Count) { & $add 'NPI-STD-01' 'Finding' 'APPROVED with no approvedOn date or no approvers: the export doesn''t show who approved it in SailPoint' }
        elseif ($approvedOn -gt $AsOf -or ($requestedOn -and $approvedOn -lt $requestedOn)) { & $add 'NPI-STD-01' 'Finding' "approvedOn $($approvedOn.ToString('yyyy-MM-dd')) is before the request or after the run's as-of date" }

        # NPI-STD-02: the ServiceNow change record.
        $chg = "$(Get-NpiStdProp $q 'changeRecord' '')"
        if ($chg -notmatch '^CHG\d{7}$') { & $add 'NPI-STD-02' 'Finding' "No ServiceNow change record (CHG and seven digits): '$chg'" }

        # NPI-STD-03: the name (WD-159).
        $why = [Collections.Generic.List[string]]::new()
        if ($app -cnotmatch '^[a-z][a-z0-9]*$') { $why.Add("appShortName '$app' must be lowercase letters and digits, starting with a letter (WD-173)") }
        $prefix = if ($type -eq 'dMSA') { 'dmsa' } else { 'gmsa' }
        if ($name -notmatch '\$$') { $why.Add('the name must end in $') }
        $bare = $name.TrimEnd('$')
        if ($bare.Length -gt $script:MaxNameLength) { $why.Add("$($bare.Length) characters before the `$; the standard allows $($script:MaxNameLength)") }
        $roles = ($script:RoleSuffixes | ForEach-Object { [regex]::Escape($_) }) -join '|'
        if ($app -and $bare -notmatch "^(?i)$prefix-$([regex]::Escape($app))(-[a-z0-9]+)?$") { $why.Add("expected $prefix-$app (with a role suffix only where the system needs more than one account)") }
        elseif ($bare -cnotmatch '^[a-z0-9-]+$') { $why.Add('lowercase letters, digits and hyphens only (WD-173)') }
        elseif ($bare -match "^(?i)$prefix-$([regex]::Escape($app))-(.+)$" -and $Matches[1] -notmatch "^($roles)$") { $why.Add("role suffix '-$($Matches[1])' isn't one of $(($script:RoleSuffixes | ForEach-Object { "-$_" }) -join ', ') (WD-173)") }
        if ($names.ContainsKey($name.ToLowerInvariant()) -and $names[$name.ToLowerInvariant()] -gt 1) { $why.Add('another request names the same account') }
        if ($why.Count) { & $add 'NPI-STD-03' 'Finding' "Name '$name' isn't to the standard (WD-159): $($why -join '; ')" }

        # NPI-STD-04 and 05: two owners and a federal-employee sponsor who isn't one of them (WD-164).
        $owners = @(Get-NpiStdProp $q 'owners' @() | Where-Object { $_ } | ForEach-Object { "$_".ToLowerInvariant() } | Sort-Object -Unique)
        if ($owners.Count -ne 2) { & $add 'NPI-STD-04' 'Finding' "$($owners.Count) distinct owner(s); the standard needs exactly two named technical owners (WD-164)" }
        $sponsor = "$(Get-NpiStdProp $q 'sponsor' '')".ToLowerInvariant()
        $sp = [Collections.Generic.List[string]]::new()
        if (-not $sponsor) { $sp.Add('no sponsor') }
        if ((Get-NpiStdProp $q 'sponsorIsFederalEmployee' $false) -ne $true) { $sp.Add('the sponsor isn''t recorded as a federal employee') }
        if ($sponsor -and $owners -contains $sponsor) { $sp.Add('the sponsor is also an owner') }
        if ($sp.Count) { & $add 'NPI-STD-05' 'Finding' "Sponsor: $($sp -join '; ') (WD-164)" }

        # NPI-STD-06: the retriever group (WD-160).
        $hosts = @(Get-NpiStdProp $q 'hosts' @() | Where-Object { $_ })
        $groupName = "DL-gMSA-$app-Hosts"
        $asked = "$(Get-NpiStdProp $q 'retrieverGroup' '')"
        if (-not $hosts.Count) { & $add 'NPI-STD-06' 'Finding' "No hosts: ${groupName} would have no members and no host could retrieve the password" }
        elseif ($type -eq 'gMSA' -and $asked -and $asked -ne $groupName) { & $add 'NPI-STD-06' 'Finding' "Retriever group '$asked' isn't ${groupName}: always a domain local group of the hosts, never a computer account (WD-160)" }

        # NPI-STD-07: SPNs and outbound-only (WD-154).
        $needsSpn = (Get-NpiStdProp $q 'needsSpn' $false) -eq $true
        $spns = @(Get-NpiStdProp $q 'spns' @() | Where-Object { $_ })
        $outReason = "$(Get-NpiStdProp $q 'outboundOnlyReason' '')"
        if ($needsSpn -and -not $spns.Count) { & $add 'NPI-STD-07' 'Finding' 'needsSpn is true but no SPN is named' }
        elseif (-not $needsSpn -and $spns.Count) { & $add 'NPI-STD-07' 'Finding' "needsSpn is false but SPNs are named ($($spns -join ', '))" }
        elseif ($needsSpn -and $outReason) { & $add 'NPI-STD-07' 'Warn' 'outboundOnlyReason is set on an account with SPNs: it only records why a no-SPN gMSA isn''t outbound-only' }

        # NPI-STD-08: a dMSA's steps need Domain Admins and are run by a person (WD-163), and a dMSA supersedes an account.
        if ($type -eq 'dMSA') {
            $d = [Collections.Generic.List[string]]::new()
            if ((Get-NpiStdProp $q 'runByPerson' $false) -ne $true) { $d.Add('runByPerson isn''t true: the dMSA steps need Domain Admins and a person runs them (WD-163)') }
            if (-not "$(Get-NpiStdProp $q 'supersedes' '')") { $d.Add('no supersedes: a dMSA migrates an existing account (Learn)') }
            if ($d.Count) { & $add 'NPI-STD-08' 'Finding' ($d -join '; ') }
        }

        # NPI-STD-09: the other fields.
        $v = [Collections.Generic.List[string]]::new()
        if ($type -notin $script:AccountTypes) { $v.Add("accountType '$type' isn't gMSA or dMSA") }
        if ("$(Get-NpiStdProp $q 'workload' '')" -notin $script:Workloads) { $v.Add("workload '$(Get-NpiStdProp $q 'workload' '')' isn't Service, IisAppPool or ScheduledTask") }
        if ("$(Get-NpiStdProp $q 'riskTier' '')" -notin @($script:RiskTiers.Keys)) { $v.Add("riskTier '$(Get-NpiStdProp $q 'riskTier' '')' isn't R1, R2 or R3") }
        if (-not "$(Get-NpiStdProp $q 'systemId' '')") { $v.Add('no systemId') }
        $end = "$(Get-NpiStdProp $q 'endDate' '')"
        if ($end) { try { if ((ConvertTo-NpiStdDate $end) -le $AsOf) { $v.Add("endDate $end is already past") } } catch { $v.Add("endDate '$end' isn't a date") } }
        if ($v.Count) { & $add 'NPI-STD-09' 'Finding' ($v -join '; ') }

        foreach ($x in $mine) { $f.Add($x) }
        $passed = -not @($mine | Where-Object Severity -EQ 'Finding').Count
        $results.Add([pscustomobject][ordered]@{ RequestId = $id; File = $w.File; ProposedName = $name; AccountType = $type; Passed = $passed; Rules = @($mine | ForEach-Object Rule | Sort-Object -Unique) })
        if (-not $passed) { continue }
        $super = "$(Get-NpiStdProp $q 'supersedes' '')"
        $rows.Add([pscustomobject][ordered]@{
                SamAccountName     = $(if ($super) { $super } else { $name })
                NewAccount         = $name
                Workload           = "$(Get-NpiStdProp $q 'workload' '')"
                Hosts              = ($hosts -join ';')
                SpnOwnerUpn        = $(if ($spns.Count) { "$(@(Get-NpiStdProp $q 'owners' @())[0])" } else { '' })   # the first owner the request names
                EndDate            = $end
                Reference          = ''
                HostChangedOn      = ''
                MigrationStartedOn = ''
                OutboundOnlyReason = $(if ($spns.Count) { '' } else { $outReason })
                RequestId          = $id
                ChangeRecord       = $chg
            })
        # A gMSA's retriever is its DL group (WD-160). A dMSA learns its hosts during the migration (Learn), so it gets no entry.
        if ($type -eq 'gMSA') {
            $retrievers[$name] = @(Get-NpiStdRetrieverGroupDn -AppShortName $app -GroupOu $Standard.GroupOu)
            $retrieverRequests[$name] = [ordered]@{ requestId = $id; changeRecord = $chg }
        }
    }
    [pscustomobject]@{
        Findings   = Get-NpiStdSortedFinding $f.ToArray()
        Results    = @($results | Sort-Object RequestId)
        Replatform = @($rows | Sort-Object NewAccount)
        Retrievers = $retrievers
        RetrieverRequests = $retrieverRequests
    }
}

function ConvertTo-NpiStdReplatformCsv {
    <#
    .SYNOPSIS
        Returns kerberos-replatform.csv's text for -Rows, with exactly Chapter 06's header
        (SamAccountName,...,MigrationStartedOn,OutboundOnlyReason,RequestId,ChangeRecord) even
        when there are no rows, LF line endings.
    .EXAMPLE
        ConvertTo-NpiStdReplatformCsv -Rows $r.Replatform
    #>
    param([AllowEmptyCollection()][object[]]$Rows = @())
    $lines = [Collections.Generic.List[string]]::new()
    $lines.Add((($script:ReplatformHeader | ForEach-Object { '"' + $_ + '"' }) -join ','))
    foreach ($r in $Rows) { $lines.Add((($script:ReplatformHeader | ForEach-Object { '"' + "$(Get-NpiStdProp $r $_ '')".Replace('"', '""') + '"' }) -join ',')) }
    ($lines -join "`n") + "`n"
}

# ----------------------------------------------------------------------------- 2. SailPoint and Active Directory

function Test-NpiStdEncryptionAes256Only {
    param($Value)
    $v = @(@($Value) | Where-Object { $_ } | ForEach-Object { "$_" -split '\s*,\s*' } | Where-Object { $_ })
    $v.Count -eq 1 -and $v[0] -eq 'AES256'
}

function ConvertTo-NpiStdTagString {
    <#
    .SYNOPSIS
        Writes the program's tags (WD-175) as the AD description: key=value pairs in the fixed key
        order, joined by '; '. Throws on a missing key, a value outside a closed list, or a value with
        '=' or ';' in it.
    .EXAMPLE
        ConvertTo-NpiStdTagString @{ SystemId = 'SYS-0412'; Owner1 = 'a@contoso.example'; Owner2 = 'b@contoso.example'; Sponsor = 'c@contoso.example'; Environment = 'prod'; Tier = 'R2'; EntraTarget = 'ManagedIdentity'; Request = 'REQ-2026-0201'; Change = 'CHG0041201' }
    #>
    param([Parameter(Mandatory)][System.Collections.IDictionary]$Tags)
    $parts = foreach ($k in $script:TagKeys) {
        $v = "$($Tags[$k])".Trim()
        if (-not $v) { throw "Tag $k has no value (WD-175)." }
        if ($v -match '[=;]') { throw "Tag $k's value '$v' contains '=' or ';'." }
        if ($script:TagValues.ContainsKey($k) -and $v -cnotin $script:TagValues[$k]) { throw "Tag $k's value '$v' isn't one of $($script:TagValues[$k] -join ', ') (WD-175)." }
        "$k=$v"
    }
    $parts -join '; '
}

function ConvertFrom-NpiStdTagString {
    <#
    .SYNOPSIS
        Reads the program's tags back from an AD description. Returns an ordered dictionary, empty
        when the description carries no SystemId= pair (an account Chapter 06 hasn't tagged yet).
    .EXAMPLE
        ConvertFrom-NpiStdTagString 'SystemId=SYS-0412; Owner1=a@contoso.example; Tier=R2'
    #>
    param([AllowEmptyString()][string]$Description)
    $t = [ordered]@{}
    if ("$Description" -notmatch '(^|;\s*)SystemId=') { return $t }
    foreach ($pair in ("$Description" -split ';')) {
        if ($pair -match '^\s*([A-Za-z0-9]+)=(.*?)\s*$') { $t[$Matches[1]] = $Matches[2] }
    }
    $t
}

function Test-NpiStdReconciliation {
    <#
    .SYNOPSIS
        Reconciles SailPoint's aggregated AD accounts and the register with an Active Directory read
        of every gMSA and dMSA. Returns @{ Findings; Rows; Orphans }. Findings NPI-STD-10 to
        NPI-STD-19: not aggregated, no owner correlated, retrievers not one DL group, password
        interval not 30 days, not AES256 only, no SPN and not outbound-only without a recorded
        reason, a privileged group, outside the service-account OU, unexplained (no request in the
        register: drift), and an aggregated account that isn't in AD; NPI-STD-30, AD tags (WD-175)
        that disagree with the register. The retriever rule applies to
        gMSAs only: a dMSA learns its hosts during its migration (Learn).
    .EXAMPLE
        $r = Test-NpiStdReconciliation -Ad $in.Ad -SailPoint $in.SailPoint -Register $in.Register -Standard $std -OutboundOnlyReasons @{}
        $r.Rows | Format-Table Account, Aggregated, Owner, InServiceAccountOu
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Ad, [Parameter(Mandatory)][AllowEmptyCollection()][object[]]$SailPoint,
        [Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Register, [Parameter(Mandatory)]$Standard, [hashtable]$OutboundOnlyReasons = @{})
    $f = [Collections.Generic.List[object]]::new()
    $rows = [Collections.Generic.List[object]]::new()
    $orphans = [Collections.Generic.List[object]]::new()
    $sp = @{}; foreach ($s in $SailPoint) { $sp["$($s.name)".ToLowerInvariant()] = $s }
    $reg = @{}; foreach ($r in $Register) { $reg["$($r.SamAccountName)".ToLowerInvariant()] = $r }
    $adNames = @{}
    $ouSuffix = ",$($Standard.ServiceAccountOu)"
    $groupSuffix = ",$($Standard.GroupOu)"
    foreach ($a in @($Ad | Sort-Object { "$(Get-NpiStdProp $_ 'name' '')" })) {
        $name = "$(Get-NpiStdProp $a 'name' '')"; $key = $name.ToLowerInvariant(); $adNames[$key] = $true
        $cls = "$(Get-NpiStdProp $a 'objectClass' '')"
        $type = if ($cls -eq 'msDS-DelegatedManagedServiceAccount') { 'dMSA' } elseif ($cls -eq 'msDS-GroupManagedServiceAccount') { 'gMSA' } else { $cls }
        $lbl = "$name ($type)"
        $s = if ($sp.ContainsKey($key)) { $sp[$key] } else { $null }
        $r = if ($reg.ContainsKey($key)) { $reg[$key] } else { $null }
        $dn = "$(Get-NpiStdProp $a 'distinguishedName' '')"
        $owner = ''
        if (-not $s) { $f.Add((New-NpiFinding 'NPI-STD-10' 'Finding' $name $lbl 'In Active Directory but not aggregated by SailPoint''s AD source: it can''t be correlated, certified or reported (check the source''s search scope covers the service-account OU)')) }
        else {
            $owner = "$(Get-NpiStdProp $s 'identityName' '')"
            if ("$(Get-NpiStdProp $s 'uncorrelated' '')" -eq 'true' -or -not $owner) {
                $owner = ''
                $f.Add((New-NpiFinding 'NPI-STD-11' 'Finding' $name $lbl 'No owner correlated in SailPoint (uncorrelated; SailPoint assigns no owner when its correlation matches no identity or several): no one can certify it'))
                $orphans.Add([pscustomobject]@{ Account = $name; SailPointId = "$(Get-NpiStdProp $s 'id' '')"; Dn = $dn; FindingId = "NPI-STD-11:$name" })
            }
        }

        $ret = @(Get-NpiStdProp $a 'PrincipalsAllowedToRetrieveManagedPassword' @() | Where-Object { $_ } | ForEach-Object { "$_" })
        $wantGroup = if ($r -and "$($r.AppShortName)") { Get-NpiStdRetrieverGroupDn -AppShortName "$($r.AppShortName)" -GroupOu $Standard.GroupOu } else { '' }
        $retOk = $ret.Count -eq 1 -and (Get-NpiStdCn $ret[0]) -like 'DL-gMSA-*-Hosts' -and $ret[0].EndsWith($groupSuffix, [StringComparison]::OrdinalIgnoreCase) -and (-not $wantGroup -or $ret[0] -ieq $wantGroup)
        # WD-160 is a gMSA rule: a dMSA learns its hosts during the migration (Learn), as Chapter 06 says.
        if ($type -eq 'gMSA' -and -not $retOk) { $f.Add((New-NpiFinding 'NPI-STD-12' 'Finding' $name $lbl "Retrievers ($(if ($ret.Count) { $ret -join '; ' } else { 'none' })) aren't the one domain local group $(if ($wantGroup) { $wantGroup } else { 'DL-gMSA-<app>-Hosts' }) (WD-160)")) }

        $interval = Get-NpiStdProp $a 'msDS-ManagedPasswordInterval'
        if ("$interval" -ne "$($script:PasswordIntervalDays)") { $f.Add((New-NpiFinding 'NPI-STD-13' 'Warn' $name $lbl "Password interval $(if ($null -ne $interval) { "$interval days" } else { 'not read' }), not $($script:PasswordIntervalDays): it can be set only at creation (Learn), so recreating the account is the fix")) }

        $encType = Get-NpiStdProp $a 'KerberosEncryptionType'
        if (-not (Test-NpiStdEncryptionAes256Only $encType)) { $f.Add((New-NpiFinding 'NPI-STD-14' 'Finding' $name $lbl "Kerberos encryption types $(@($encType) -join ', '), not AES256 only")) }

        $spns = @(Get-NpiStdProp $a 'ServicePrincipalNames' @() | Where-Object { $_ })
        $outbound = Get-NpiStdProp $a 'RestrictToOutboundAuthenticationOnly'
        if ($type -eq 'gMSA' -and -not $spns.Count) {
            $reason = if ($OutboundOnlyReasons.ContainsKey($name)) { "$($OutboundOnlyReasons[$name])" } else { '' }
            if ($null -eq $outbound) { $f.Add((New-NpiFinding 'NPI-STD-15' 'Warn' $name $lbl 'No SPN, and the read doesn''t say whether it''s outbound-only (the attribute is not yet specified): check it by hand')) }
            elseif ($outbound -ne $true -and -not $reason) { $f.Add((New-NpiFinding 'NPI-STD-15' 'Finding' $name $lbl 'No SPN but not outbound-only, and no recorded reason: WD-154 makes outbound-only the default for a gMSA whose workload holds no SPN')) }
        }

        $priv = @(@(Get-NpiStdProp $a 'memberOf' @()) | Where-Object { $_ } | ForEach-Object { Get-NpiStdCn "$_" } | Where-Object { $_ -in $script:PrivilegedGroups } | Sort-Object -Unique)
        if ($priv.Count) { $f.Add((New-NpiFinding 'NPI-STD-16' 'Finding' $name $lbl "Member of $($priv -join ', '): remove it and grant only the rights its service needs (Learn); Chapter 07's privileged hand-off")) }

        $inOu = $dn.EndsWith($ouSuffix, [StringComparison]::OrdinalIgnoreCase)
        if (-not $inOu) { $f.Add((New-NpiFinding 'NPI-STD-17' 'Finding' $name $lbl "Not in the service-account OU ($($Standard.ServiceAccountOu)): $dn (WD-161)")) }

        $requestId = if ($r) { "$($r.RequestId)" } else { '' }
        if (-not $requestId) { $f.Add((New-NpiFinding 'NPI-STD-18' 'Finding' $name $lbl 'Unexplained: no approved request in the register for an account that exists in AD. Drift (Book 13, Chapter 04): find the change that made it, or open a request')) }

        # NPI-STD-30: the AD tags (WD-175) disagree with the register, which follows SailPoint. An
        # account with no tags yet isn't a finding here: Chapter 06's plan doesn't write them yet.
        $tags = ConvertFrom-NpiStdTagString "$(Get-NpiStdProp $a 'description' '')"
        if ($tags.Count -and $r) {
            $d = [Collections.Generic.List[string]]::new()
            $regOwners = @("$($r.Owners)" -split ';' | ForEach-Object { $_.Trim().ToLowerInvariant() } | Where-Object { $_ } | Sort-Object)
            $tagOwners = @(@($tags['Owner1'], $tags['Owner2']) | ForEach-Object { "$_".Trim().ToLowerInvariant() } | Where-Object { $_ } | Sort-Object)
            if (($regOwners -join ';') -ne ($tagOwners -join ';')) { $d.Add("Owner1/Owner2 '$($tagOwners -join ', ')' but the register says '$($regOwners -join ', ')'") }
            if ("$($tags['Sponsor'])".ToLowerInvariant() -ne "$($r.Sponsor)".ToLowerInvariant()) { $d.Add("Sponsor '$($tags['Sponsor'])' but the register says '$($r.Sponsor)'") }
            if ("$($tags['Tier'])" -ne "$($r.RiskTier)") { $d.Add("Tier '$($tags['Tier'])' but the register says '$($r.RiskTier)'") }
            if ("$($tags['Request'])" -ne "$($r.RequestId)") { $d.Add("Request '$($tags['Request'])' but the register says '$($r.RequestId)'") }
            foreach ($k in $script:TagKeys) { if (-not "$($tags[$k])") { $d.Add("no $k tag") } }
            foreach ($k in $script:TagValues.Keys | Sort-Object) { if ("$($tags[$k])" -and "$($tags[$k])" -cnotin $script:TagValues[$k]) { $d.Add("$k '$($tags[$k])' isn't one of $($script:TagValues[$k] -join ', ')") } }
            if ($d.Count) { $f.Add((New-NpiFinding 'NPI-STD-30' 'Finding' $name $lbl "AD tags disagree with the register, which follows SailPoint (WD-175): $($d -join '; '). Rewrite the description through an approved Chapter 06 plan")) }
        }

        $rows.Add([pscustomobject][ordered]@{
                Account = $name; Type = $type; Enabled = (Get-NpiStdProp $a 'enabled' $null); RequestId = $requestId; Aggregated = [bool]$s; Owner = $owner
                Retrievers = $ret; Spns = $spns; OutboundOnly = $outbound; PrivilegedGroups = $priv; InServiceAccountOu = $inOu
            })
    }
    foreach ($s in @($SailPoint | Sort-Object name)) {
        if ($adNames.ContainsKey("$($s.name)".ToLowerInvariant())) { continue }
        if ("$($s.name)" -notmatch '^(?i)(gmsa|dmsa)-') { continue }
        $f.Add((New-NpiFinding 'NPI-STD-19' 'Warn' "$($s.name)" "$($s.name) (SailPoint)" "Aggregated by SailPoint ($($s.nativeIdentity)) but not in the Active Directory read: deleted since the last aggregation, or outside the read's scope"))
    }
    [pscustomobject]@{ Findings = Get-NpiStdSortedFinding $f.ToArray(); Rows = $rows.ToArray(); Orphans = $orphans.ToArray() }
}

# ----------------------------------------------------------------------------- 3. certification

function New-NpiStdServiceNowFinding {
    <#
    .SYNOPSIS
        A typed finding for ServiceNow in the integration kit's payload shape
        (examples/servicenow-sailpoint, finding_contract.py): kind, source, drift_class, severity,
        system, account_id or subject_id, attribute, observed_value, intended_state and origin.
        Nothing is posted.
    .EXAMPLE
        New-NpiStdServiceNowFinding -DriftClass stale_access -Account 'gmsa-print$' -SailPointId 2c91 -FindingId 'NPI-STD-22:gmsa-print$' -Attribute certificationDecision -ObservedValue REVOKE -IntendedState @{ disabled = $true }
    #>
    param([Parameter(Mandatory)][ValidateSet('stale_access', 'orphan_account')][string]$DriftClass, [Parameter(Mandatory)][string]$Account, [string]$SailPointId,
        [Parameter(Mandatory)][string]$FindingId, [string]$Attribute, $ObservedValue, [hashtable]$IntendedState = @{}, [hashtable]$Detail = @{})
    $p = [ordered]@{ kind = 'finding'; source = $script:FindingSource; drift_class = $DriftClass; severity = 'P2'; system = 'isc_account' }
    if ($SailPointId) { $p.account_id = $SailPointId } else { $p.subject_id = $Account }
    $p.account_name = $Account
    if ($Attribute) { $p.attribute = $Attribute; $p.observed_value = $ObservedValue }
    $p.intended_state = $IntendedState
    $origin = [ordered]@{ type = 'npi-msa-standard'; finding_id = $FindingId; checker = "NpiGmsaStandard/$($script:ModuleVersion)" }
    foreach ($k in ($Detail.Keys | Sort-Object)) { $origin[$k] = $Detail[$k] }
    $p.origin = $origin
    [pscustomobject]$p
}

function Test-NpiStdCertification {
    <#
    .SYNOPSIS
        Certification by risk tier (WD-166: R1 every 3 months, R2 every 6, R3 every 12) for every
        enabled account in the register, from its last certification (the later of the register's
        LastCertifiedOn and the latest APPROVE by one of its owners; CreatedOn when never certified),
        and each campaign decision. Returns @{ Findings; Rows; ServiceNow }. Findings NPI-STD-20
        overdue, NPI-STD-21 due within 30 days (Info), NPI-STD-22 REVOKE (a stale_access finding
        for ServiceNow), NPI-STD-23 a decision by someone who isn't one of the account's owners.
    .EXAMPLE
        $c = Test-NpiStdCertification -Register $in.Register -Decisions $in.Decisions -SailPoint $in.SailPoint -AsOf 2026-11-20
        $c.Rows | Format-Table Account, RiskTier, DueOn, Status
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Register, [Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Decisions,
        [Parameter(Mandatory)][AllowEmptyCollection()][object[]]$SailPoint, [Parameter(Mandatory)][datetime]$AsOf)
    $f = [Collections.Generic.List[object]]::new()
    $rows = [Collections.Generic.List[object]]::new()
    $snow = [Collections.Generic.List[object]]::new()
    $sp = @{}; foreach ($s in $SailPoint) { $sp["$($s.name)".ToLowerInvariant()] = $s }
    $reg = @{}; foreach ($r in $Register) { $reg["$($r.SamAccountName)".ToLowerInvariant()] = $r }
    $ownersOf = { param($r) @("$($r.Owners)" -split ';' | Where-Object { $_ } | ForEach-Object { $_.Trim().ToLowerInvariant() }) }

    foreach ($d in @($Decisions | Sort-Object Account, DecidedOn, Reviewer)) {
        $acct = "$($d.Account)"; $key = $acct.ToLowerInvariant()
        $r = if ($reg.ContainsKey($key)) { $reg[$key] } else { $null }
        $reviewer = "$($d.Reviewer)".ToLowerInvariant()
        if (-not $r -or (& $ownersOf $r) -notcontains $reviewer) {
            $f.Add((New-NpiFinding 'NPI-STD-23' 'Warn' "$acct|$($d.Campaign)|$reviewer" "$acct ($($d.Campaign))" "Decided ($($d.Decision)) by $($d.Reviewer), who isn't one of the account's two owners in the register: the owners certify it (WD-166), and this decision doesn't count"))
            continue
        }
        if ("$($d.Decision)" -eq 'REVOKE') {
            $fid = "NPI-STD-22:$acct|$($d.Campaign)"
            $f.Add((New-NpiFinding 'NPI-STD-22' 'Finding' "$acct|$($d.Campaign)" "$acct ($($d.Campaign))" "Revoked by $($d.Reviewer) on $($d.DecidedOn): a ServiceNow task to disable it through the approved Chapter 06 plan, then retire it after $($script:RetirementDays) days (WD-167)"))
            $s = if ($sp.ContainsKey($key)) { $sp[$key] } else { $null }
            $snow.Add((New-NpiStdServiceNowFinding -DriftClass stale_access -Account $acct -SailPointId $(if ($s) { "$($s.id)" } else { '' }) -FindingId $fid -Attribute 'certificationDecision' -ObservedValue 'REVOKE' -IntendedState @{ disabled = $true } -Detail @{ campaign = "$($d.Campaign)"; reviewer = "$($d.Reviewer)"; decided_on = "$($d.DecidedOn)" }))
        }
    }

    foreach ($r in @($Register | Sort-Object SamAccountName)) {
        $acct = "$($r.SamAccountName)"; $tier = "$($r.RiskTier)"
        if ("$($r.DisabledOn)") { continue }   # disabled: in the retirement window, not certified
        $owners = & $ownersOf $r
        $approves = @($Decisions | Where-Object { "$($_.Account)" -ieq $acct -and "$($_.Decision)" -eq 'APPROVE' -and $owners -contains "$($_.Reviewer)".ToLowerInvariant() } | ForEach-Object { ConvertTo-NpiStdDate $_.DecidedOn })
        $last = @(@(ConvertTo-NpiStdDate $r.LastCertifiedOn) + $approves | Where-Object { $_ } | Sort-Object -Descending)
        $from = if ($last.Count) { $last[0] } else { ConvertTo-NpiStdDate $r.CreatedOn }
        if (-not $script:RiskTiers.Contains($tier)) {
            $f.Add((New-NpiFinding 'NPI-STD-20' 'Finding' $acct $acct "Risk tier '$tier' isn't R1, R2 or R3: no certification cadence (WD-166)"))
            $rows.Add([pscustomobject][ordered]@{ Account = $acct; RiskTier = $tier; Owners = ($owners -join ';'); LastCertifiedOn = ''; DueOn = ''; Status = 'NoCadence' }); continue
        }
        if (-not $from) {
            $f.Add((New-NpiFinding 'NPI-STD-20' 'Finding' $acct $acct 'Never certified, and the register has no CreatedOn to count from'))
            $rows.Add([pscustomobject][ordered]@{ Account = $acct; RiskTier = $tier; Owners = ($owners -join ';'); LastCertifiedOn = ''; DueOn = ''; Status = 'Overdue' }); continue
        }
        $due = $from.AddMonths($script:RiskTiers[$tier])
        $status = if ($due -lt $AsOf) { 'Overdue' } elseif (($due - $AsOf).TotalDays -le $script:DueSoonDays) { 'DueSoon' } else { 'Current' }
        $lastText = if ($last.Count) { $last[0].ToString('yyyy-MM-dd') } else { '' }
        if ($status -eq 'Overdue') { $f.Add((New-NpiFinding 'NPI-STD-20' 'Finding' $acct $acct "$tier certification was due $($due.ToString('yyyy-MM-dd')) ($(if ($lastText) { "last certified $lastText" } else { 'never certified; created ' + $from.ToString('yyyy-MM-dd') })): every $($script:RiskTiers[$tier]) months (WD-166)")) }
        elseif ($status -eq 'DueSoon') { $f.Add((New-NpiFinding 'NPI-STD-21' 'Info' $acct $acct "$tier certification due $($due.ToString('yyyy-MM-dd')): include it in the next campaign")) }
        $rows.Add([pscustomobject][ordered]@{ Account = $acct; RiskTier = $tier; Owners = ($owners -join ';'); LastCertifiedOn = $lastText; DueOn = $due.ToString('yyyy-MM-dd'); Status = $status })
    }
    [pscustomobject]@{ Findings = Get-NpiStdSortedFinding $f.ToArray(); Rows = $rows.ToArray(); ServiceNow = $snow.ToArray() }
}

# ----------------------------------------------------------------------------- 4. Defender for Identity

function Test-NpiStdMdi {
    <#
    .SYNOPSIS
        Compares Defender for Identity's service account list (the kit's import format: AccountName,
        DomainName, Type gMSA|sMSA|User, Tags) with the register. Returns @{ Findings; Rows }.
        Findings NPI-STD-24 a User-type service account (convert it: Chapters 03 and 06), NPI-STD-25
        an sMSA (upgrade it to a gMSA: Chapter 06), NPI-STD-26 an account the register doesn't hold.
        An account tagged Honey Token is a decoy and is only listed.
    .EXAMPLE
        $m = Test-NpiStdMdi -Mdi $in.Mdi -Register $in.Register
        $m.Rows | Format-Table AccountName, Type, InRegister
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Mdi, [Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Register)
    $f = [Collections.Generic.List[object]]::new()
    $rows = [Collections.Generic.List[object]]::new()
    $reg = @{}; foreach ($r in $Register) { $reg["$($r.SamAccountName)".TrimEnd('$').ToLowerInvariant()] = $r }
    foreach ($m in @($Mdi | Sort-Object AccountName)) {
        $name = "$($m.AccountName)"; $type = "$($m.Type)"
        $tags = @("$($m.Tags)" -split ';' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
        $lbl = "$name ($type, Defender for Identity)"
        $inReg = $reg.ContainsKey($name.TrimEnd('$').ToLowerInvariant())
        $honey = $tags -contains 'Honey Token'
        if (-not $honey) {
            if ($type -eq 'User') { $f.Add((New-NpiFinding 'NPI-STD-24' 'Finding' $name $lbl 'A user account still used as a service account: convert it to a gMSA or dMSA (Chapter 03''s disposition, Chapter 06''s plan) or retire it')) }
            elseif ($type -eq 'sMSA') { $f.Add((New-NpiFinding 'NPI-STD-25' 'Warn' $name $lbl 'A standalone MSA: upgrade it to a gMSA (Chapter 06)')) }
            if (-not $inReg) { $f.Add((New-NpiFinding 'NPI-STD-26' 'Finding' $name $lbl "Defender for Identity lists it, the managed-account register doesn't$(if ($tags -contains 'Sensitive') { ' (tagged Sensitive)' }): register it with its owners, or explain it")) }
        }
        $rows.Add([pscustomobject][ordered]@{ AccountName = $name; DomainName = "$($m.DomainName)"; Type = $type; Tags = $tags; InRegister = $inReg; HoneyToken = $honey })
    }
    [pscustomobject]@{ Findings = Get-NpiStdSortedFinding $f.ToArray(); Rows = $rows.ToArray() }
}

# ----------------------------------------------------------------------------- 5. retirement

function Get-NpiStdRetirementList {
    <#
    .SYNOPSIS
        The retirement window (WD-167) for every account the register or AD shows disabled: a
        DeleteCandidate only when it has been disabled for 90 days or more with no sign-in seen
        since it was disabled. Returns @{ Findings; Rows }: a list for a person to act on through
        the decommission ticket. This code never deletes. Findings NPI-STD-27 DeleteCandidate (Info),
        NPI-STD-28 a sign-in after it was disabled, NPI-STD-29 the register and AD disagree.
        An account a dMSA superseded is never a DeleteCandidate: Learn's "Setting up delegated
        Managed Service Accounts" says not to delete it, because deleting it causes issues if you
        need to revert. It's listed as SupersededByDmsa, stays disabled, and is retired only with
        its dMSA. It's found from the dMSA's msDS-ManagedAccountPrecededByLink, or from the account's
        own msDS-SupersededManagedServiceAccountLink, or its state (Learn's overview spells it
        msDS-SupersededAccountState at the start and msDS-SupersededServiceAccountState at completion).
        lastLogonTimestamp replicates late (Learn: up to 14 days), so a person checks the domain
        controllers' lastLogon before deleting.
    .EXAMPLE
        $ret = Get-NpiStdRetirementList -Register $in.Register -Ad $in.Ad -AsOf 2026-11-20
        $ret.Rows | Format-Table SamAccountName, DaysDisabled, Status
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Register, [Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Ad, [Parameter(Mandatory)][datetime]$AsOf)
    $f = [Collections.Generic.List[object]]::new()
    $rows = [Collections.Generic.List[object]]::new()
    $byAd = @{}; foreach ($a in $Ad) { $byAd["$(Get-NpiStdProp $a 'name' '')".ToLowerInvariant()] = $a }
    $reg = @{}; foreach ($r in $Register) { $reg["$($r.SamAccountName)".ToLowerInvariant()] = $r }
    # The accounts a dMSA superseded (Learn: the dMSA's msDS-ManagedAccountPrecededByLink names the account it
    # supersedes; the superseded account's msDS-SupersededManagedServiceAccountLink names the dMSA). Keyed without the '$'.
    $cn = { param($dn) if ("$dn" -match '^CN=((?:\\.|[^,])+)') { ($Matches[1] -replace '\\(.)', '$1').TrimEnd('$').ToLowerInvariant() } else { '' } }
    $superseded = @{}
    foreach ($a in $Ad) {
        $self = "$(Get-NpiStdProp $a 'name' '')"
        $link = "$(Get-NpiStdProp $a 'msDS-ManagedAccountPrecededByLink' '')"
        if ($link) { $k = & $cn $link; if ($k) { $superseded[$k] = $self } }
        $back = "$(Get-NpiStdProp $a 'msDS-SupersededManagedServiceAccountLink' '')"
        $state = @("$(Get-NpiStdProp $a 'msDS-SupersededServiceAccountState' '')", "$(Get-NpiStdProp $a 'msDS-SupersededAccountState' '')")
        if ($back -or $state -contains '1' -or $state -contains '2') { $superseded[$self.TrimEnd('$').ToLowerInvariant()] = $(if ($back) { "$(& $cn $back)$" } else { 'a dMSA' }) }
    }
    $names = @(@($Register | Where-Object { "$($_.DisabledOn)" } | ForEach-Object { "$($_.SamAccountName)" }) + @($Ad | Where-Object { (Get-NpiStdProp $_ 'enabled' $true) -eq $false } | ForEach-Object { "$(Get-NpiStdProp $_ 'name' '')" }) | Sort-Object -Unique)
    foreach ($name in $names) {
        $key = $name.ToLowerInvariant()
        $r = if ($reg.ContainsKey($key)) { $reg[$key] } else { $null }
        $a = if ($byAd.ContainsKey($key)) { $byAd[$key] } else { $null }
        $disabledOn = if ($r) { ConvertTo-NpiStdDate $r.DisabledOn } else { $null }
        $last = if ($a) { ConvertTo-NpiStdDate (Get-NpiStdProp $a 'lastLogonTimestamp') } else { $null }
        $enabled = if ($a) { Get-NpiStdProp $a 'enabled' $null } else { $null }
        $days = if ($disabledOn) { [int][Math]::Floor(($AsOf - $disabledOn).TotalDays) } else { $null }
        $by = $superseded[$key.TrimEnd('$')]
        $status =
        if ($by) { 'SupersededByDmsa' }
        elseif (-not $a) { 'NotInAd' }
        elseif ($enabled -eq $true) { 'EnabledInAd' }
        elseif (-not $disabledOn) { 'NoDisabledDate' }
        elseif ($last -and $last -gt $disabledOn) { 'SignInSinceDisable' }
        elseif ($days -ge $script:RetirementDays) { 'DeleteCandidate' }
        else { 'Wait' }
        switch ($status) {
            'EnabledInAd' { $f.Add((New-NpiFinding 'NPI-STD-29' 'Finding' $name $name "The register says disabled on $($r.DisabledOn), but AD shows it enabled: disable it through the approved Chapter 06 plan, or correct the register")) }
            'NoDisabledDate' { $f.Add((New-NpiFinding 'NPI-STD-29' 'Warn' $name $name 'Disabled in AD with no DisabledOn in the register: the 90 days can''t be counted until the date is recorded')) }
            'NotInAd' { $f.Add((New-NpiFinding 'NPI-STD-29' 'Warn' $name $name 'The register says disabled, but it isn''t in the AD read: deleted already, or outside the read''s scope; close the register row through the decommission ticket')) }
            'SignInSinceDisable' { $f.Add((New-NpiFinding 'NPI-STD-28' 'Finding' $name $name "Signed in $($last.ToString('yyyy-MM-dd')), after it was disabled on $($r.DisabledOn): something still uses it; the 90 days start again once that's explained")) }
            'DeleteCandidate' { $f.Add((New-NpiFinding 'NPI-STD-27' 'Info' $name $name "Disabled $days days with no sign-in since: a person may delete it through the decommission ticket after checking each domain controller's lastLogon")) }
        }
        $rows.Add([pscustomobject][ordered]@{
                SamAccountName   = $name
                DisabledOn       = $(if ($disabledOn) { $disabledOn.ToString('yyyy-MM-dd') } else { '' })
                LastLogon        = $(if ($last) { $last.ToString('yyyy-MM-dd') } else { '' })
                DaysDisabled     = $(if ($null -ne $days) { "$days" } else { '' })
                EarliestDeleteOn = $(if ($disabledOn -and -not $by) { $disabledOn.AddDays($script:RetirementDays).ToString('yyyy-MM-dd') } else { '' })
                Status           = $status
                RunBy            = $(if ($by) { "Nobody: superseded by $by, it stays disabled and isn't deleted (Learn); this code never deletes" } else { 'A person, through the decommission ticket; this code never deletes' })
            })
    }
    [pscustomobject]@{ Findings = Get-NpiStdSortedFinding $f.ToArray(); Rows = $rows.ToArray() }
}

# ----------------------------------------------------------------------------- the AD read (Lab 2)

function ConvertTo-NpiStdAdRecord {
    <#
    .SYNOPSIS
        Shapes one Get-ADServiceAccount result as a row of ad-managed-accounts.json (the kit's
        import format). lastLogonTimestamp (a FILETIME) becomes an ISO date; the outbound-only
        field is null because its attribute is not yet specified.
    .EXAMPLE
        Get-ADServiceAccount -Identity gmsa-web -Properties * | ForEach-Object { ConvertTo-NpiStdAdRecord $_ }
    #>
    param([Parameter(Mandatory)]$Account)
    $ll = Get-NpiStdProp $Account 'lastLogonTimestamp'
    $llText = if ($null -eq $ll -or "$ll" -eq '' -or "$ll" -eq '0') { $null } elseif ($ll -is [datetime]) { $ll.ToUniversalTime().ToString('o') } else { [DateTime]::FromFileTimeUtc([int64]$ll).ToString('o') }
    $wc = Get-NpiStdProp $Account 'whenCreated'
    [ordered]@{
        name                                       = "$(Get-NpiStdProp $Account 'SamAccountName' '')"
        objectClass                                = "$(Get-NpiStdProp $Account 'ObjectClass' '')"
        enabled                                    = [bool](Get-NpiStdProp $Account 'Enabled' $false)
        whenCreated                                = $(if ($wc -is [datetime]) { $wc.ToUniversalTime().ToString('o') } elseif ($wc) { "$wc" } else { $null })
        'msDS-ManagedPasswordInterval'             = Get-NpiStdProp $Account 'msDS-ManagedPasswordInterval'
        KerberosEncryptionType                     = @(@(Get-NpiStdProp $Account 'KerberosEncryptionType' @()) | ForEach-Object { "$_" -split '\s*,\s*' } | Where-Object { $_ })
        PrincipalsAllowedToRetrieveManagedPassword = @(@(Get-NpiStdProp $Account 'PrincipalsAllowedToRetrieveManagedPassword' @()) | Where-Object { $_ } | ForEach-Object { "$_" })
        ServicePrincipalNames                      = @(@(Get-NpiStdProp $Account 'ServicePrincipalNames' @()) | Where-Object { $_ } | ForEach-Object { "$_" })
        memberOf                                   = @(@(Get-NpiStdProp $Account 'MemberOf' @()) | Where-Object { $_ } | ForEach-Object { "$_" })
        distinguishedName                          = "$(Get-NpiStdProp $Account 'DistinguishedName' '')"
        'msDS-ManagedAccountPrecededByLink'        = $(if ("$(Get-NpiStdProp $Account 'msDS-ManagedAccountPrecededByLink' '')") { "$(Get-NpiStdProp $Account 'msDS-ManagedAccountPrecededByLink')" } else { $null })
        lastLogonTimestamp                         = $llText
        description                                = "$(Get-NpiStdProp $Account 'Description' '')"
        RestrictToOutboundAuthenticationOnly       = $null
    }
}

function Export-NpiStdAdManagedAccount {
    <#
    .SYNOPSIS
        Lab 2's one Active Directory read: the declared std-managed-accounts call
        (Get-ADServiceAccount -Filter *) through -AdInvoke, written to -Path as
        ad-managed-accounts.json. Returns @{ Path; Evidence } with the read recorded for the manifest.
    .EXAMPLE
        # Live: needs the ActiveDirectory module and a domain account.
        $ad = New-NpiStdLiveAdInvoker -Server corp.contoso.example
        Export-NpiStdAdManagedAccount -AdInvoke $ad -Path out/ad-managed-accounts.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][scriptblock]$AdInvoke, [Parameter(Mandatory)][string]$Path)
    $call = @((Get-NpiStdCallList).calls | Where-Object { $_.id -eq 'std-managed-accounts' })[0]
    if ($call.method -ne 'READ' -or $call.cmdlet -notmatch '^Get-AD[A-Za-z]+$') { throw 'std-managed-accounts must be a declared Get-AD* read.' }
    $params = @{ Filter = '*'; Properties = @('msDS-ManagedPasswordInterval', 'KerberosEncryptionType', 'PrincipalsAllowedToRetrieveManagedPassword', 'ServicePrincipalNames', 'MemberOf', 'whenCreated', 'lastLogonTimestamp', 'msDS-ManagedAccountPrecededByLink') }
    $shown = ($params.Keys | Sort-Object | ForEach-Object { "-$_ $(@($params[$_]) -join ',')" }) -join ' '
    $ev = [pscustomobject]@{ Call = $call.id; Method = 'READ'; Target = "$($call.cmdlet) $shown"; At = [DateTime]::UtcNow.ToString('o') }
    $rows = @(& $AdInvoke $call.cmdlet $params | Where-Object { "$(Get-NpiStdProp $_ 'ObjectClass' '')" -in 'msDS-GroupManagedServiceAccount', 'msDS-DelegatedManagedServiceAccount' } | ForEach-Object { ConvertTo-NpiStdAdRecord $_ } | Sort-Object { $_.name })
    $full = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Path)
    New-Item -ItemType Directory -Force -Path (Split-Path $full -Parent) | Out-Null
    Write-NpiJson -Path $full -Value ([ordered]@{ _comment = 'Read by Export-NpiStdAdManagedAccount (Get-ADServiceAccount). RestrictToOutboundAuthenticationOnly: attribute not yet specified, left null.'; accounts = $rows })
    [pscustomobject]@{ Path = $full; Evidence = @($ev) }
}

function New-NpiStdLiveAdInvoker {
    <#
    .SYNOPSIS
        The live Active Directory invoker for Chapter 12: only the cmdlets calls-ch12.json declares
        (Get-ADServiceAccount), against -Server, with the ActiveDirectory module.
    .EXAMPLE
        $ad = New-NpiStdLiveAdInvoker -Server corp.contoso.example
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Server)
    Import-Module ActiveDirectory -ErrorAction Stop
    $allowed = @((Get-NpiStdRequiredRight).Cmdlets)
    $srv = $Server
    {
        param($Cmdlet, [hashtable]$Params)
        if ($Cmdlet -notin $allowed -or $Cmdlet -notmatch '^Get-AD') { throw "Refusing $Cmdlet" }
        $p = @{} + $Params; $p.Server = $srv
        & $Cmdlet @p
    }.GetNewClosure()
}

# ----------------------------------------------------------------------------- the run

function Invoke-NpiStdRun {
    <#
    .SYNOPSIS
        Runs the five checks on one input folder and returns @{ Findings; Requests; Reconciliation;
        Certification; Mdi; Retirement }. Nothing is written; Export-NpiStdRun writes the run folder.
    .EXAMPLE
        $in = Import-NpiStdInput -InputPath tests/fixtures/ch12/inputs
        $std = Import-NpiStdStandard -Path tests/fixtures/ch12/standard.json
        $r = Invoke-NpiStdRun -Inputs $in -Standard $std -AsOf 2026-11-20
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Inputs, [Parameter(Mandatory)]$Standard, [Parameter(Mandatory)][datetime]$AsOf)
    $asOf = [datetime]::SpecifyKind($AsOf.Date, [DateTimeKind]::Utc)
    $req = Test-NpiStdRequest -Requests $Inputs.Requests -Standard $Standard -AsOf $asOf
    # A no-SPN gMSA's recorded reason for not being outbound-only travels with its request.
    $reasons = @{}
    foreach ($w in $Inputs.Requests) { $n = "$(Get-NpiStdProp $w.Request 'proposedName' '')"; $o = "$(Get-NpiStdProp $w.Request 'outboundOnlyReason' '')"; if ($n -and $o) { $reasons[$n] = $o } }
    $rec = Test-NpiStdReconciliation -Ad $Inputs.Ad -SailPoint $Inputs.SailPoint -Register $Inputs.Register -Standard $Standard -OutboundOnlyReasons $reasons
    $cert = Test-NpiStdCertification -Register $Inputs.Register -Decisions $Inputs.Decisions -SailPoint $Inputs.SailPoint -AsOf $asOf
    foreach ($o in $rec.Orphans) {
        $cert.ServiceNow += New-NpiStdServiceNowFinding -DriftClass orphan_account -Account $o.Account -SailPointId $o.SailPointId -FindingId $o.FindingId -Detail @{ distinguished_name = $o.Dn }
    }
    $mdi = Test-NpiStdMdi -Mdi $Inputs.Mdi -Register $Inputs.Register
    $ret = Get-NpiStdRetirementList -Register $Inputs.Register -Ad $Inputs.Ad -AsOf $asOf
    [pscustomobject]@{
        AsOf           = $asOf
        Findings       = Get-NpiStdSortedFinding (@($req.Findings) + @($rec.Findings) + @($cert.Findings) + @($mdi.Findings) + @($ret.Findings))
        Requests       = $req
        Reconciliation = $rec
        Certification  = $cert
        Mdi            = $mdi
        Retirement     = $ret
    }
}

function Export-NpiStdRun {
    <#
    .SYNOPSIS
        Writes a run folder: findings.json, request-check.json, kerberos-replatform.csv (Chapter 06's
        header), password-retrievers.json (Chapter 06's shape), reconciliation.json,
        certification.json, servicenow-findings.json, mdi.json, retirement-list.csv, evidence.json
        (one row per step and control: step, control, ksi, evidence, sha256) and manifest.json (input
        and output SHA-256s, as-of date, module version, the task's AD rights and reads). Every byte
        depends only on the inputs and -AsOf. Returns the manifest file.
    .EXAMPLE
        Export-NpiStdRun -Run $r -Inputs $in -Standard $std -OutputPath out/msa-standard
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Run, [Parameter(Mandatory)]$Inputs, [Parameter(Mandatory)]$Standard, [Parameter(Mandatory)][string]$OutputPath,
        [string]$Mode = 'Files', [object[]]$Evidence = @())
    $out = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
    New-Item -ItemType Directory -Force -Path $out | Out-Null
    $enc = [Text.UTF8Encoding]::new($false)
    $csv = { param($rows) (((@($rows) | ConvertTo-Csv -NoTypeInformation) -join "`n") + "`n") }
    $retrieverDoc = [ordered]@{
        _comment = "Generated by Chapter 12 from approved requests (the kit's import format), for review before Chapter 06's plan reads it: each gMSA's retriever is its DL-gMSA-<app>-Hosts group (WD-160), and 'requests' names the SailPoint request and ServiceNow change that approved it; a dMSA learns its hosts during its migration and gets no entry. Merge into Chapter 06's reviewed password-retrievers.json in a reviewed pull request."
        accounts = $Run.Requests.Retrievers
        requests = $Run.Requests.RetrieverRequests
    }
    $files = [ordered]@{
        'findings.json'            = @{ json = @($Run.Findings) }
        'request-check.json'       = @{ json = @($Run.Requests.Results) }
        'kerberos-replatform.csv'  = @{ text = (ConvertTo-NpiStdReplatformCsv -Rows @($Run.Requests.Replatform)) }
        'password-retrievers.json' = @{ json = $retrieverDoc }
        'reconciliation.json'      = @{ json = @($Run.Reconciliation.Rows) }
        'certification.json'       = @{ json = @($Run.Certification.Rows) }
        'servicenow-findings.json' = @{ json = @($Run.Certification.ServiceNow) }
        'mdi.json'                 = @{ json = @($Run.Mdi.Rows) }
        'retirement-list.csv'      = @{ text = $(if (@($Run.Retirement.Rows).Count) { & $csv $Run.Retirement.Rows } else { '"SamAccountName","DisabledOn","LastLogon","DaysDisabled","EarliestDeleteOn","Status","RunBy"' + "`n" }) }
    }
    $hashes = [ordered]@{}
    foreach ($name in $files.Keys) {
        $p = Join-Path $out $name
        if ($files[$name].ContainsKey('text')) { [IO.File]::WriteAllText($p, $files[$name].text, $enc) } else { Write-NpiJson -Path $p -Value $files[$name].json }
        $hashes[$name] = Get-NpiFileHash -Path $p
    }
    # evidence.json: one row per step, control and evidence file, with that file's SHA-256.
    $req = Get-NpiStdRequirement
    $rows = [Collections.Generic.List[object]]::new()
    foreach ($step in $req.steps.Keys) {
        foreach ($control in $req.steps[$step].controls) {
            $c = $req.controls[$control]
            foreach ($file in $req.steps[$step].evidence) {
                $row = [ordered]@{ step = $step; control = $control; ksi = @($c.ksis); evidence = $file; sha256 = $hashes[$file] }
                if ($c.ContainsKey('primaryKsi')) { $row.primaryKsi = $c.primaryKsi }
                $rows.Add([pscustomobject]$row)
            }
        }
    }
    $evPath = Join-Path $out 'evidence.json'
    Write-NpiJson -Path $evPath -Value ([ordered]@{ note = "The controls each output provides evidence for and the KSIs aligned with them (config/requirements-ch12.json; FedRAMP's KSI page accessed $($req.source.accessed)). Evidence for, not proof that a control is met."; rows = $rows.ToArray() })
    $hashes['evidence.json'] = Get-NpiFileHash -Path $evPath

    $inputHashes = [ordered]@{}
    foreach ($k in $Inputs.Hashes.Keys) { $inputHashes[$k] = $Inputs.Hashes[$k] }
    $inputHashes['standard.json'] = $Standard.Sha256
    $inputHashes['calls-ch12.json'] = Get-NpiFileHash -Path $script:CallsPath
    $inputHashes['requirements-ch12.json'] = Get-NpiFileHash -Path $script:RequirementsPath
    $rights = Get-NpiStdRequiredRight
    $fs = @($Run.Findings)
    $m = [ordered]@{
        task = $script:Task; chapter = '12'; mode = $Mode; domain = $Standard.Domain; asOf = $Run.AsOf.ToString('yyyy-MM-dd'); generated = $Run.AsOf.ToString('o')
        module = 'NpiGmsaStandard'; moduleVersion = $script:ModuleVersion; adRights = $rights.AdRights
        requests = @($Evidence | ForEach-Object { [ordered]@{ call = $_.Call; method = $_.Method; target = $_.Target; at = $_.At } })
        counts = [ordered]@{ Finding = @($fs | Where-Object Severity -EQ 'Finding').Count; Warn = @($fs | Where-Object Severity -EQ 'Warn').Count; Info = @($fs | Where-Object Severity -EQ 'Info').Count }
        inputs = $inputHashes; files = $hashes
    }
    Write-NpiJson -Path (Join-Path $out 'manifest.json') -Value $m
    Get-Item -LiteralPath (Join-Path $out 'manifest.json')
}

Export-ModuleMember -Function ConvertTo-NpiStdDate, ConvertTo-NpiStdTagString, ConvertFrom-NpiStdTagString, Get-NpiStdRetrieverGroupDn, Get-NpiStdCallList, Get-NpiStdRequiredRight, Get-NpiStdRequirement,
    Import-NpiStdStandard, Import-NpiStdInput, Test-NpiStdRequest, ConvertTo-NpiStdReplatformCsv, Test-NpiStdReconciliation, New-NpiStdServiceNowFinding,
    Test-NpiStdCertification, Test-NpiStdMdi, Get-NpiStdRetirementList, ConvertTo-NpiStdAdRecord, Export-NpiStdAdManagedAccount, New-NpiStdLiveAdInvoker,
    Invoke-NpiStdRun, Export-NpiStdRun
