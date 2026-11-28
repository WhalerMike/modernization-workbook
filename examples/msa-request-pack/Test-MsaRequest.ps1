#Requires -Version 7.1
<#
.SYNOPSIS
    Checks filled-in managed service account requests (request_template.csv) before they're submitted,
    and writes each request's AD tags and the same tags for its Entra identity.
.DESCRIPTION
    Runs the Non-Person Identity kit's Chapter 12 request check (NPI-STD-03 to NPI-STD-09: the name
    standard, two owners and a sponsor, the hosts, SPNs and outbound-only, the dMSA rules and the other
    fields) on every row, as SailPoint's pre-approval workflow does (WD-174). The approval and the
    change record (NPI-STD-01 and -02) don't exist yet, so they aren't checked here. It adds the pack's
    own checks, MSA-REQ-01 to MSA-REQ-08 (07 and 08 for a RequestKind Change row: one change to an
    existing account), and builds the tags (WD-175). Where NPI-STD-03 refuses a name, the finding
    gives the name Get-MsaNameSuggestion.ps1 builds from the same fields.

    For each row it writes, under -OutputPath:
      <RequestId>/request.json                         Chapter 12's request import format, status SUBMITTED
      <RequestId>/ad-description.txt                    the tags as the account's AD description
      <RequestId>/entra-tags.json                       the same tags for the Entra identity it moves to, as GCC
                                                        holds them until the tenant check confirms custom security
                                                        attributes (WD-176): the service principal's tags and notes,
                                                        and Azure resource tags for a managed identity
      <RequestId>/entra-custom-security-attributes.json the same tags as custom security attributes, the target
                                                        once the tenant check confirms them
    and findings.json for all rows. It exits 1 when any row has a Finding.

    Read only: it reads the CSV and writes files. It calls no system.
.EXAMPLE
    ./Test-MsaRequest.ps1 -Path examples.csv -OutputPath out/check -AsOf 2026-11-25
.EXAMPLE
    ./Test-MsaRequest.ps1 -Path my-requests.csv -OutputPath out/check -StandardPath my-standard.json
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$Path,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$StandardPath = (Join-Path $PSScriptRoot 'standard.json'),
    [datetime]$AsOf = (Get-Date).Date,
    [string]$AttributeSet = 'NonPersonIdentity'
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot '../non-person-identity/powershell/NpiGmsaStandard/NpiGmsaStandard.psm1') -Force

$Columns = @('RequestId', 'RequestedOn', 'RequestKind', 'SystemId', 'AppShortName', 'AccountType', 'Role', 'Hosts', 'Workload', 'NeedsSpn', 'Spns',
    'OutboundOnlyReason', 'Owner1', 'Owner2', 'Sponsor', 'SponsorIsFederalEmployee', 'RiskTier', 'Environment', 'EntraTarget', 'EndDate', 'Supersedes', 'RunByPerson')
# A Change row's two columns; a CSV copied from the template before they existed is read without them.
$ChangeColumns = @('ChangeType', 'ChangeItems')
$ChangeTypes = @('AddHost', 'RemoveHost', 'AddSpn', 'RemoveSpn', 'Tier', 'EndDate')
$SpnPattern = '^[A-Za-z][A-Za-z0-9.-]*/[A-Za-z0-9][A-Za-z0-9.-]*(:[A-Za-z0-9$_-]+)?$'
$Suggest = Join-Path $PSScriptRoot 'Get-MsaNameSuggestion.ps1'
$RoleForWorkload = @{ web = 'IisAppPool'; task = 'ScheduledTask'; sql = 'Service'; agt = 'Service'; rs = 'Service'; is = 'Service'; svc = 'Service' }

function Split-List([string]$s) { @("$s" -split ';' | ForEach-Object { $_.Trim() } | Where-Object { $_ }) }
function Test-Yes([string]$s) { "$s".Trim().ToLowerInvariant() -eq 'yes' }

$rows = @(Import-Csv -LiteralPath $Path)
if ($rows.Count -and ($missing = @($Columns | Where-Object { $_ -notin $rows[0].PSObject.Properties.Name })).Count) { throw "$Path is missing columns: $($missing -join ', ')." }
$std = Import-NpiStdStandard -Path $StandardPath

$requests = foreach ($r in $rows) {
    $app = "$($r.AppShortName)".Trim()
    $prefix = if ("$($r.AccountType)" -eq 'dMSA') { 'dmsa' } else { 'gmsa' }
    $name = "$prefix-$app$(if ("$($r.Role)".Trim()) { "-$("$($r.Role)".Trim())" })`$"
    $q = [ordered]@{
        requestId = "$($r.RequestId)".Trim(); requestedOn = "$($r.RequestedOn)".Trim(); status = 'SUBMITTED'; approvers = @(); changeRecord = ''
        systemId = "$($r.SystemId)".Trim(); appShortName = $app; accountType = "$($r.AccountType)".Trim(); proposedName = $name
        hosts = @(Split-List $r.Hosts); workload = "$($r.Workload)".Trim(); needsSpn = (Test-Yes $r.NeedsSpn); spns = @(Split-List $r.Spns)
        outboundOnlyReason = "$($r.OutboundOnlyReason)".Trim()
        owners = @(@("$($r.Owner1)".Trim(), "$($r.Owner2)".Trim()) | Where-Object { $_ }); sponsor = "$($r.Sponsor)".Trim()
        sponsorIsFederalEmployee = (Test-Yes $r.SponsorIsFederalEmployee); riskTier = "$($r.RiskTier)".Trim()
        endDate = "$($r.EndDate)".Trim(); supersedes = "$($r.Supersedes)".Trim(); runByPerson = (Test-Yes $r.RunByPerson)
        environment = "$($r.Environment)".Trim(); entraTarget = "$($r.EntraTarget)".Trim()
        requestKind = "$($r.RequestKind)".Trim()
    }
    # A change names its type and what it adds or removes (Chapter 06's New-NpiKrbChangePlan reads them).
    if ($q.requestKind -eq 'Change') {
        $q['changeType'] = "$(if ($r.PSObject.Properties['ChangeType']) { $r.ChangeType })".Trim()
        $q['changeItems'] = @(Split-List $(if ($r.PSObject.Properties['ChangeItems']) { $r.ChangeItems }))
    }
    [pscustomobject]@{ File = "$Path#$($q.requestId)"; Request = $q; Row = $r }
}

$check = Test-NpiStdRequest -Requests @($requests | ForEach-Object { [pscustomobject]@{ File = $_.File; Request = $_.Request } }) -Standard $std -AsOf $AsOf
# NPI-STD-01 (approved in SailPoint) and -02 (the change record) come after submission.
$findings = [Collections.Generic.List[object]]::new()
foreach ($f in $check.Findings) { if ($f.Rule -notin 'NPI-STD-01', 'NPI-STD-02') { $findings.Add($f) } }

New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
foreach ($w in $requests) {
    $q = $w.Request; $r = $w.Row; $id = $q.requestId
    $add = { param($rule, $sev, $issue) $findings.Add((New-NpiFinding $rule $sev $id $id $issue)) }
    $kind = "$($r.RequestKind)".Trim()
    if ($kind -notin 'New', 'Migrate', 'Change') { & $add 'MSA-REQ-01' 'Finding' "RequestKind '$kind' isn't New, Migrate or Change (owner changes and retirements use their own forms)" }
    elseif ($kind -eq 'Migrate' -and -not $q.supersedes) { & $add 'MSA-REQ-01' 'Finding' 'Migrate names no account in Supersedes' }
    elseif ($kind -eq 'New' -and $q.supersedes) { & $add 'MSA-REQ-01' 'Finding' "New names an account it supersedes ('$($q.supersedes)'): use Migrate" }

    # MSA-REQ-07 and -08: a Change names one known change, and what it names fits the row (the account after the change).
    $ct = "$(if ($r.PSObject.Properties['ChangeType']) { $r.ChangeType })".Trim()
    $ci = @(Split-List $(if ($r.PSObject.Properties['ChangeItems']) { $r.ChangeItems }))
    if ($kind -eq 'Change' -and $ct -notin $ChangeTypes) { & $add 'MSA-REQ-07' 'Finding' "ChangeType '$ct' isn't one of $($ChangeTypes -join ', '): an owner or sponsor change uses form 03, a retirement form 04" }
    elseif ($kind -ne 'Change' -and ($ct -or $ci.Count)) { & $add 'MSA-REQ-07' 'Finding' "ChangeType or ChangeItems is filled in on a $kind row: they belong to RequestKind Change" }
    elseif ($kind -eq 'Change') {
        $bad = [Collections.Generic.List[string]]::new()
        if ($ct -in 'AddHost', 'RemoveHost', 'AddSpn', 'RemoveSpn' -and -not $ci.Count) { $bad.Add("$ct names nothing in ChangeItems") }
        if ($ct -in 'Tier', 'EndDate' -and $ci.Count) { $bad.Add("$ct takes its new value from $(if ($ct -eq 'Tier') { 'RiskTier' } else { 'EndDate' }); leave ChangeItems blank") }
        foreach ($i in $ci) {
            $inHosts = @($q.hosts | Where-Object { $_ -ieq $i }).Count; $inSpns = @($q.spns | Where-Object { $_ -ieq $i }).Count
            switch ($ct) {
                'AddHost' { if (-not $inHosts) { $bad.Add("$i isn't in Hosts, which lists the hosts after the change") } }
                'RemoveHost' { if ($inHosts) { $bad.Add("$i is still in Hosts, which lists the hosts after the change") } }
                'AddSpn' { if ($i -notmatch $SpnPattern) { $bad.Add("$i isn't <service-class>/<host>[:<port>]") } elseif (-not $inSpns) { $bad.Add("$i isn't in Spns, which lists the SPNs after the change") } }
                'RemoveSpn' { if ($inSpns) { $bad.Add("$i is still in Spns, which lists the SPNs after the change") } }
            }
        }
        if ($ct -eq 'AddSpn' -and -not $q.needsSpn) { $bad.Add('AddSpn on a row whose NeedsSpn is no') }
        if ($ct -eq 'EndDate' -and ($q.entraTarget -ne 'KeepKerberos' -or -not $q.endDate)) { $bad.Add('an end date belongs to an account that stays on Kerberos: EntraTarget KeepKerberos, with the new EndDate (WD-165)') }
        if ($bad.Count) { & $add 'MSA-REQ-08' 'Finding' ($bad -join '; ') }
    }

    # The name suggester's account name, so a name that breaks the standard is reported with the one it should be.
    if ($q.accountType -in 'gMSA', 'dMSA') {
        $s = & $Suggest -SystemId $q.systemId -AppShortName $q.appShortName -Role "$($r.Role)".Trim() -AccountType $q.accountType -Environment $q.environment -Hosts $q.hosts -StandardPath $StandardPath -AsObject
        foreach ($f in @($findings | Where-Object { $_.Rule -eq 'NPI-STD-03' -and $_.ObjectKey -eq $id })) {
            $why = @($s.Findings | Where-Object { $_.Rule -like 'NAME-*' -and $_.Severity -eq 'Finding' } | ForEach-Object Issue)
            $f.Issue = "$($f.Issue); expected name $($s.AccountName) (Get-MsaNameSuggestion.ps1)$(if ($why.Count) { ": $($why -join '; ')" })"
        }
    }
    $role = "$($r.Role)".Trim()
    if ($role -and $RoleForWorkload.ContainsKey($role) -and $RoleForWorkload[$role] -ne $q.workload) { & $add 'MSA-REQ-02' 'Warn' "Role -$role usually runs as $($RoleForWorkload[$role]), not $($q.workload)" }
    if ($q.owners.Count -eq 2 -and $q.owners[0].ToLowerInvariant() -eq $q.owners[1].ToLowerInvariant()) { & $add 'MSA-REQ-03' 'Finding' 'Owner1 and Owner2 are the same person' }
    if ($q.entraTarget -eq 'KeepKerberos' -and -not $q.endDate) { & $add 'MSA-REQ-04' 'Finding' 'EntraTarget KeepKerberos needs the end date the authorizing official accepts (WD-165)' }
    if ($q.accountType -eq 'dMSA' -and $kind -eq 'New') { & $add 'MSA-REQ-05' 'Finding' 'A dMSA migrates an existing account: use Migrate with Supersedes, or ask for a gMSA' }

    $tags = [ordered]@{ SystemId = $q.systemId; Owner1 = "$($r.Owner1)".Trim(); Owner2 = "$($r.Owner2)".Trim(); Sponsor = $q.sponsor
        Environment = $q.environment; Tier = $q.riskTier; EntraTarget = $q.entraTarget; Request = $id; Change = 'PENDING' }
    $dir = Join-Path $OutputPath $id
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $q | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $dir 'request.json') -Encoding utf8NoBOM
    try {
        $desc = ConvertTo-NpiStdTagString $tags
        Set-Content -LiteralPath (Join-Path $dir 'ad-description.txt') -Value $desc -Encoding utf8NoBOM
        $csa = [ordered]@{ '@odata.type' = '#Microsoft.DirectoryServices.CustomSecurityAttributeValue' }
        foreach ($k in 'SystemId', 'Owner1', 'Owner2', 'Sponsor', 'Environment', 'Tier', 'EntraTarget') { $csa[$k] = $tags[$k] }
        [ordered]@{ customSecurityAttributes = [ordered]@{ $AttributeSet = $csa } } | ConvertTo-Json -Depth 5 |
            Set-Content -LiteralPath (Join-Path $dir 'entra-custom-security-attributes.json') -Encoding utf8NoBOM
        # Until then (WD-176): Graph's servicePrincipal tags (one npi:Key=Value string per key, filterable)
        # and notes (the whole string, at most 1,024 characters); Azure resource tags (values at most 256).
        $keys = 'SystemId', 'Owner1', 'Owner2', 'Sponsor', 'Environment', 'Tier', 'EntraTarget'
        if ($desc.Length -gt 1024) { throw "notes would be $($desc.Length) characters; a service principal's notes hold 1,024" }
        $az = [ordered]@{}; foreach ($k in $keys) { $az[$k] = $tags[$k] }
        [ordered]@{
            servicePrincipal  = [ordered]@{ tags = @(foreach ($k in $keys) { "npi:$k=$($tags[$k])" }); notes = $desc }
            azureResourceTags = $az
        } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $dir 'entra-tags.json') -Encoding utf8NoBOM
    } catch { & $add 'MSA-REQ-06' 'Finding' "The tags can't be written: $($_.Exception.Message)" }
}

$sorted = @($findings | Sort-Object ObjectKey, Rule)
ConvertTo-Json -InputObject $sorted -Depth 5 | Set-Content -LiteralPath (Join-Path $OutputPath 'findings.json') -Encoding utf8NoBOM
$summary = foreach ($w in $requests) {
    $mine = @($sorted | Where-Object ObjectKey -EQ $w.Request.requestId)
    [pscustomobject]@{ RequestId = $w.Request.requestId; Account = $w.Request.proposedName; Ready = -not @($mine | Where-Object Severity -EQ 'Finding').Count; Rules = (@($mine.Rule | Sort-Object -Unique) -join ', ') }
}
$summary | Format-Table -AutoSize | Out-String -Width 200 | Write-Host
foreach ($f in $sorted) { Write-Host ("{0}  {1}  {2}: {3}" -f $f.ObjectKey, $f.Rule, $f.Severity, $f.Issue) }
if (@($sorted | Where-Object Severity -EQ 'Finding').Count) { exit 1 }
