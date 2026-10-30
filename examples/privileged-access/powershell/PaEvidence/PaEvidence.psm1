#Requires -Version 7.1
<#
    PaEvidence: Chapter 08 of the developer workbook "Building Privileged Access".

    The scheduled evidence run: Chapter 01's inventory and Chapter 02's emergency access check, run
    together, plus the PIM activation and audit evidence for a window of time, read from Microsoft
    Graph's directory audit log. Each run is one folder with a run.json that names the cloud, the
    tenant, the window and the SHA-256 of each task's manifest. examples/drift-pipeline compares
    runs, packages them for the ISSO and chains the packages.

    It uses the PrivilegedAccess module's reader, so the same four rules hold: declared calls only
    (config/calls-ch08.json for this chapter's call), GET only, the cloud's own host, every page.
    The audit evidence keeps object IDs, never names. Illustrative: tested against fixtures and a
    fake, not a production tenant. Nothing here writes to a tenant.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot '../PrivilegedAccess/PrivilegedAccess.psm1') -Force -Global

$script:ConfigRoot = Join-Path $PSScriptRoot '../../config'
$script:RunSchema = 'fmp-pa-run/1'
# Learn: Microsoft Entra audit logs are kept 30 days with P1 or P2, and PIM's resource audit shows
# the past 30 days. A window that starts earlier can't be read in full.
$script:MaxWindowAgeDays = 30
# PIM's loggedByService value. Learn's directoryAudit resource page gives 'Privileged Identity
# Management'; Learn's security operations guide for PIM filters on 'Service = PIM'. The pages
# differ, so the read asks for both (research gaps).
$script:PimService = @('Privileged Identity Management', 'PIM')

# Activity names from Learn's "Microsoft Entra audit log categories and activities", PIM section.
$script:Activity = @{
    'Add member to role requested (PIM activation)'          = 'Requested'
    'Add member to role approval requested (PIM activation)' = 'ApprovalRequested'
    'Add member to role request approved (PIM activation)'   = 'Approved'
    'Add member to role request denied (PIM activation)'     = 'Denied'
    'Add member to role completed (PIM activation)'          = 'Activated'
    'Add member to role canceled (PIM activation)'           = 'Canceled'
    'PIM activation request expired'                         = 'RequestExpired'
    'Remove member from role requested (PIM deactivate)'     = 'DeactivationRequested'
    'Remove member from role (PIM activation expired)'       = 'Deactivated'
    'Remove member from role completed (PIM deactivate)'     = 'Deactivated'
    'Add member to role outside of PIM (permanent)'          = 'OutsidePim'
    'Update role setting in PIM'                             = 'SettingChanged'
}

# ----------------------------------------------------------------------------- calls and permissions

function Get-PaEvidenceCall {
    <# This chapter's declared calls, from config/calls-ch08.json. #>
    [CmdletBinding()]
    param([string]$Id)
    $calls = @((Get-Content -LiteralPath (Join-Path $script:ConfigRoot 'calls-ch08.json') -Raw | ConvertFrom-Json -AsHashtable).calls)
    if ($Id) { $calls = @($calls | Where-Object { $_.id -eq $Id }) }
    , $calls
}

function Get-PaEvidencePermission {
    <#
    .SYNOPSIS
        The Graph permissions and Azure roles a task needs: pim-audit (this chapter's call), or
        evidence-run, the union of the inventory, emergency-access and pim-audit tasks.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][ValidateSet('pim-audit', 'evidence-run')][string]$Task)
    $own = @(Get-PaEvidenceCall | Where-Object { $_.tasks -contains 'pim-audit' })
    $graph = [Collections.Generic.List[string]]::new()
    $azure = [Collections.Generic.List[string]]::new()
    foreach ($c in $own) { foreach ($p in $c.permissions) { $graph.Add($p) } }
    if ($Task -eq 'evidence-run') {
        foreach ($t in 'inventory', 'emergency-access') {
            $p = Get-PaRequiredPermission -Task $t
            foreach ($g in $p.GraphPermissions) { $graph.Add($g) }
            foreach ($a in $p.AzureRoles) { $azure.Add($a) }
        }
    }
    [pscustomobject]@{
        Task             = $Task
        GraphPermissions = @($graph | Sort-Object -Unique)
        AzureRoles       = @($azure | Sort-Object -Unique)
    }
}

function New-PaAuditReader {
    <#
    .SYNOPSIS
        A read-only client for the pim-audit task: the PrivilegedAccess reader's shape with this
        chapter's call list, so Invoke-PaList enforces the same rules.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][scriptblock]$Invoke)
    [pscustomobject]@{
        Cloud    = Get-PaCloud -Cloud $Cloud
        Task     = 'pim-audit'
        Calls    = @(Get-PaEvidenceCall | Where-Object { $_.tasks -contains 'pim-audit' })
        Invoke   = $Invoke
        Evidence = [Collections.Generic.List[object]]::new()
    }
}

# ----------------------------------------------------------------------------- the fake

function New-PaEvidenceFixtureInvoker {
    <#
    .SYNOPSIS
        The PrivilegedAccess fake, plus a fake directory audit log served from -AuditPath (a JSON
        file with a 'directoryAudits' array in Graph's shape). It filters by the four terms the
        example sends and refuses any other, serves pages of -PageSize, and records every call.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][string]$AuditPath, [int]$PageSize = 2, [string]$Cloud = 'gcc')
    $state = New-PaFixtureInvoker -Path $Path -PageSize $PageSize -Cloud $Cloud
    $audits = @((Get-Content -LiteralPath $AuditPath -Raw | ConvertFrom-Json -AsHashtable -Depth 50).directoryAudits)
    $state | Add-Member -NotePropertyName Audits -NotePropertyValue $audits
    $s = $state
    $state.Invoke = {
        param($Method, $Uri)
        if (([Uri]$Uri).AbsolutePath -eq '/v1.0/auditLogs/directoryAudits') { Invoke-PaAuditFake -State $s -Method $Method -Uri $Uri }
        else { Invoke-PaFake -State $s -Method $Method -Uri $Uri }
    }.GetNewClosure()
    $state
}

function ConvertTo-PaUtc {
    # ConvertFrom-Json turns ISO 8601 strings into DateTime; a string round trip would apply the local offset.
    param($Value)
    if ($Value -is [datetime]) {
        if ($Value.Kind -eq [DateTimeKind]::Unspecified) { return [datetime]::SpecifyKind($Value, [DateTimeKind]::Utc) }
        return $Value.ToUniversalTime()
    }
    if ($Value -is [DateTimeOffset]) { return $Value.UtcDateTime }
    [DateTimeOffset]::Parse([string]$Value, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AssumeUniversal).UtcDateTime
}

function Invoke-PaAuditFake {
    param($State, [string]$Method, [string]$Uri)
    $State.Calls.Add([pscustomobject]@{ Method = $Method; Uri = $Uri })
    if ($Method -ne 'GET') { throw "The fake refuses $Method" }
    $u = [Uri]$Uri
    if ("$($u.Scheme)://$($u.Host)" -ne $State.Graph) { throw "The fake refuses host $($u.Host)" }
    $q = @{}
    foreach ($pair in $u.Query.TrimStart('?').Split('&', [StringSplitOptions]::RemoveEmptyEntries)) {
        $kv = $pair.Split('=', 2); $q[[Uri]::UnescapeDataString($kv[0])] = if ($kv.Count -gt 1) { [Uri]::UnescapeDataString($kv[1]) } else { '' }
    }
    $rows = @($State.Audits)
    if ($q.ContainsKey('$filter')) {
        foreach ($term in ($q['$filter'] -split ' and ')) {
            switch -Regex ($term.Trim()) {
                "^activityDateTime ge (\S+)$" { $t = ConvertTo-PaUtc $Matches[1]; $rows = @($rows | Where-Object { (ConvertTo-PaUtc $_.activityDateTime) -ge $t }); break }
                "^activityDateTime le (\S+)$" { $t = ConvertTo-PaUtc $Matches[1]; $rows = @($rows | Where-Object { (ConvertTo-PaUtc $_.activityDateTime) -le $t }); break }
                "^loggedByService eq '([^']+)'$" { $v = $Matches[1]; $rows = @($rows | Where-Object { $_.loggedByService -eq $v }); break }
                "^activityDisplayName eq '([^']+)'$" { $v = $Matches[1]; $rows = @($rows | Where-Object { $_.activityDisplayName -eq $v }); break }
                default { throw "The fake doesn't support the filter term '$term'" }
            }
        }
    }
    $skip = if ($q.ContainsKey('$skiptoken')) { [int]$q['$skiptoken'] } else { 0 }
    $resp = @{ value = @($rows | Select-Object -Skip $skip -First $State.PageSize) }
    if ($skip + $State.PageSize -lt $rows.Count) {
        $rest = ($q.GetEnumerator() | Where-Object Key -NE '$skiptoken' | Sort-Object Key | ForEach-Object { "$($_.Key)=$([Uri]::EscapeDataString($_.Value))" }) -join '&'
        $resp['@odata.nextLink'] = "$($State.Graph)$($u.AbsolutePath)?" + $(if ($rest) { "$rest&" } else { '' }) + "`$skiptoken=$($skip + $State.PageSize)"
    }
    $resp
}

# ----------------------------------------------------------------------------- the audit read

function Get-PaHashValue { param($Hash, [string]$Key) if ($Hash -is [System.Collections.IDictionary] -and $Hash.Contains($Key)) { $Hash[$Key] } else { $null } }

function ConvertTo-PaAuditEvent {
    <#
    .SYNOPSIS
        One directoryAudit item as an evidence row: IDs, the activity and its class, the role and
        the principal it targets, and the PIM request ID from additionalDetails. No names.
    #>
    param([Parameter(Mandatory)]$Item)
    $init = Get-PaHashValue $Item 'initiatedBy'
    $user = Get-PaHashValue $init 'user'
    $app = Get-PaHashValue $init 'app'
    $initType = $null; $initId = $null
    if ($user -and (Get-PaHashValue $user 'id')) { $initType = 'user'; $initId = $user.id }
    elseif ($app -and (Get-PaHashValue $app 'servicePrincipalId')) { $initType = 'app'; $initId = $app.servicePrincipalId }
    elseif ($app -and (Get-PaHashValue $app 'appId')) { $initType = 'app'; $initId = $app.appId }
    $role = $null; $principal = $null
    foreach ($t in @(Get-PaHashValue $Item 'targetResources')) {
        if (-not $t) { continue }
        $type = [string](Get-PaHashValue $t 'type')
        if (-not $role -and $type -eq 'Role') { $role = $t }
        elseif (-not $principal -and $type -in 'User', 'Group', 'ServicePrincipal') { $principal = $t }
    }
    $requestId = $null
    foreach ($d in @(Get-PaHashValue $Item 'additionalDetails')) {
        if ($d -and ([string](Get-PaHashValue $d 'key')) -ieq 'roleAssignmentRequestId') { $requestId = [string]$d.value; break }
    }
    $activity = [string]$Item.activityDisplayName
    $class = if ($script:Activity.ContainsKey($activity)) { $script:Activity[$activity] }
    elseif ($activity -eq 'Add member to role' -and $Item.loggedByService -eq 'Core Directory') { 'OutsidePim' }
    else { 'Other' }
    [pscustomobject][ordered]@{
        Id               = [string]$Item.id
        ActivityDateTime = (ConvertTo-PaUtc $Item.activityDateTime).ToString('yyyy-MM-ddTHH:mm:ssZ')
        Activity         = $activity
        Class            = $class
        Category         = [string](Get-PaHashValue $Item 'category')
        Service          = [string](Get-PaHashValue $Item 'loggedByService')
        Result           = [string](Get-PaHashValue $Item 'result')
        CorrelationId    = [string](Get-PaHashValue $Item 'correlationId')
        RequestId        = $requestId
        InitiatorType    = $initType
        InitiatorId      = $initId
        RoleId           = if ($role) { [string]$role.id } else { $null }
        PrincipalId      = if ($principal) { [string]$principal.id } else { $null }
        PrincipalType    = if ($principal) { ([string]$principal.type).ToLowerInvariant() } else { $null }
    }
}

function Get-PaPimAuditEvent {
    <#
    .SYNOPSIS
        Read the directory audit log for one window: everything PIM logged (under either service
        name Learn gives), and the role assignments Core Directory logged outside PIM. Three
        filtered, paged GETs; events are
        de-duplicated by ID and sorted by time. Refuses a window that starts more than 30 days
        before -AsOf, because the log no longer holds all of it.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Reader,
        [Parameter(Mandatory)][datetime]$Since,
        [Parameter(Mandatory)][datetime]$Until,
        [datetime]$AsOf = $Until,
        [string[]]$PimService = $script:PimService
    )
    $s = $Since.ToUniversalTime(); $u = $Until.ToUniversalTime()
    if ($u -le $s) { throw "The window ends ($($u.ToString('o'))) before it starts ($($s.ToString('o')))." }
    if (($AsOf.ToUniversalTime() - $s).TotalDays -gt $script:MaxWindowAgeDays) {
        throw "The window starts more than $script:MaxWindowAgeDays days before $($AsOf.ToString('yyyy-MM-dd')): the audit log keeps 30 days, so the read can't be complete. Use the Log Analytics workspace for older events."
    }
    $win = "activityDateTime ge $($s.ToString('yyyy-MM-ddTHH:mm:ssZ')) and activityDateTime le $($u.ToString('yyyy-MM-ddTHH:mm:ssZ'))"
    $items = @()
    foreach ($svc in $PimService) { $items += @(Invoke-PaList -Reader $Reader -CallId 'directory-audits' -Query "`$filter=$win and loggedByService eq '$svc'") }
    $items += @(Invoke-PaList -Reader $Reader -CallId 'directory-audits' -Query "`$filter=$win and activityDisplayName eq 'Add member to role'")
    $seen = @{}
    $events = foreach ($i in $items) {
        if ($seen.ContainsKey($i.id)) { continue }
        $seen[$i.id] = $true
        ConvertTo-PaAuditEvent -Item $i
    }
    @($events | Sort-Object ActivityDateTime, Id)
}

# ----------------------------------------------------------------------------- the evidence and findings

function Get-PaTierOfRole {
    param([string]$RoleId, $TierMap)
    if ($RoleId -and $TierMap.entra.ContainsKey($RoleId)) { $TierMap.entra[$RoleId].tier } else { 'Unclassified' }
}

function Get-PaRoleName {
    param([string]$RoleId, $TierMap)
    if ($RoleId -and $TierMap.entra.ContainsKey($RoleId)) { $TierMap.entra[$RoleId].name } elseif ($RoleId) { $RoleId } else { '(no role in the event)' }
}

function Get-PaActivationRequest {
    <#
    .SYNOPSIS
        Group the events into activation requests by roleAssignmentRequestId, as Learn's page
        advises. An event without the request ID joins the request of another event that shares
        its correlation ID, as Learn's full-cycle query does.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Events, $TierMap = (Get-PaTierMap))
    $byCorr = @{}
    foreach ($e in $Events) { if ($e.RequestId -and $e.CorrelationId -and -not $byCorr.ContainsKey($e.CorrelationId)) { $byCorr[$e.CorrelationId] = $e.RequestId } }
    $req = [ordered]@{}
    foreach ($e in $Events) {
        if ($e.Class -notin 'Requested', 'ApprovalRequested', 'Approved', 'Denied', 'Activated', 'Canceled', 'RequestExpired', 'DeactivationRequested', 'Deactivated') { continue }
        $rid = if ($e.RequestId) { $e.RequestId } elseif ($e.CorrelationId -and $byCorr.ContainsKey($e.CorrelationId)) { $byCorr[$e.CorrelationId] } else { "unlinked:$($e.Id)" }
        if (-not $req.Contains($rid)) {
            $req[$rid] = [ordered]@{ RequestId = $rid; RoleId = $null; Tier = $null; PrincipalId = $null; RequesterId = $null; ApproverIds = @(); States = @(); First = $e.ActivityDateTime; Last = $e.ActivityDateTime; Events = @() }
        }
        $r = $req[$rid]
        if (-not $r.RoleId -and $e.RoleId) { $r.RoleId = $e.RoleId }
        if (-not $r.PrincipalId -and $e.PrincipalId) { $r.PrincipalId = $e.PrincipalId }
        if ($e.Class -eq 'Requested' -and $e.InitiatorId) { $r.RequesterId = $e.InitiatorId }
        if ($e.Class -eq 'Approved' -and $e.InitiatorId) { $r.ApproverIds = @($r.ApproverIds + $e.InitiatorId | Select-Object -Unique) }
        if ($r.States -notcontains $e.Class) { $r.States = @($r.States + $e.Class) }
        if ($e.ActivityDateTime -lt $r.First) { $r.First = $e.ActivityDateTime }
        if ($e.ActivityDateTime -gt $r.Last) { $r.Last = $e.ActivityDateTime }
        $r.Events = @($r.Events + $e.Id)
    }
    foreach ($r in $req.Values) {
        if (-not $r.RequesterId) { $r.RequesterId = $r.PrincipalId }
        $r.Tier = Get-PaTierOfRole -RoleId $r.RoleId -TierMap $TierMap
        [pscustomobject]$r
    }
}

function New-PaAuditFinding {
    param([string]$Rule, [string]$Severity, [string]$Tier, [string]$ObjectId, [string]$Issue)
    # Object carries the ID too: the audit evidence names no one.
    [pscustomobject][ordered]@{ Rule = $Rule; Severity = $Severity; Tier = $Tier; Object = $ObjectId; ObjectId = $ObjectId; Issue = $Issue }
}

function Test-PaPimAudit {
    <#
    .SYNOPSIS
        The audit evidence's findings, PA-AUD-01 to PA-AUD-04, and its summary for the window.
        PA-AUD-01: a role assigned outside PIM. PA-AUD-02: a T0 or T1 activation completed with no
        approval in the window. PA-AUD-03: an approver who is the requester. PA-AUD-04: a role
        setting changed in PIM. Issues carry role names and object IDs, never people's names.
    .OUTPUTS
        @{ Findings; Requests; Summary }
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Events,
        [Parameter(Mandatory)][datetime]$Since,
        [Parameter(Mandatory)][datetime]$Until,
        $TierMap = (Get-PaTierMap)
    )
    $f = [Collections.Generic.List[object]]::new()
    $requests = @(Get-PaActivationRequest -Events $Events -TierMap $TierMap)

    $outside = @{}
    foreach ($e in @($Events | Where-Object Class -EQ 'OutsidePim')) {
        $key = "$($e.RoleId)|$($e.PrincipalId)"
        if ($outside.ContainsKey($key)) { continue }
        $outside[$key] = $true
        $tier = Get-PaTierOfRole -RoleId $e.RoleId -TierMap $TierMap
        $sev = if ($tier -in 'T0', 'T1') { 'Finding' } else { 'Warn' }
        $f.Add((New-PaAuditFinding 'PA-AUD-01' $sev $tier $e.PrincipalId "$(Get-PaRoleName $e.RoleId $TierMap) ($tier) assigned outside PIM ('$($e.Activity)', $($e.Service)) by $($e.InitiatorType) $($e.InitiatorId)"))
    }
    foreach ($r in $requests) {
        if ($r.States -contains 'Activated' -and $r.Tier -in 'T0', 'T1' -and $r.States -notcontains 'Approved') {
            $f.Add((New-PaAuditFinding 'PA-AUD-02' 'Finding' $r.Tier $r.PrincipalId "$(Get-PaRoleName $r.RoleId $TierMap) ($($r.Tier)) activated with no approval record in the window (request $($r.RequestId)); Appendix B requires approval for T0 and T1"))
        }
        if ($r.RequesterId -and @($r.ApproverIds) -contains $r.RequesterId) {
            $f.Add((New-PaAuditFinding 'PA-AUD-03' 'Finding' $r.Tier $r.PrincipalId "$(Get-PaRoleName $r.RoleId $TierMap) ($($r.Tier)) request $($r.RequestId) approved by its own requester"))
        }
    }
    foreach ($e in @($Events | Where-Object Class -EQ 'SettingChanged')) {
        $tier = Get-PaTierOfRole -RoleId $e.RoleId -TierMap $TierMap
        $sev = if ($tier -eq 'T0') { 'Finding' } else { 'Warn' }
        $f.Add((New-PaAuditFinding 'PA-AUD-04' $sev $tier $e.RoleId "Role setting for $(Get-PaRoleName $e.RoleId $TierMap) ($tier) changed in PIM by $($e.InitiatorType) $($e.InitiatorId) at $($e.ActivityDateTime); reconcile it with a reviewed settings change"))
    }

    $count = { param($cls) @($Events | Where-Object Class -EQ $cls).Count }
    $activated = @($requests | Where-Object { $_.States -contains 'Activated' })
    $byTier = [ordered]@{}
    foreach ($t in 'T0', 'T1', 'T2', 'RO', 'Unclassified') { $byTier[$t] = @($activated | Where-Object Tier -EQ $t).Count }
    $byActivity = [ordered]@{}
    foreach ($g in ($Events | Group-Object Activity | Sort-Object Name)) { $byActivity[$g.Name] = $g.Count }
    $summary = [ordered]@{
        window          = [ordered]@{ since = $Since.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'); until = $Until.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ') }
        eventsRead      = @($Events).Count
        byActivity      = $byActivity
        requests        = $requests.Count
        activations     = $activated.Count
        activationsByTier = $byTier
        approved        = @($requests | Where-Object { $_.States -contains 'Approved' }).Count
        denied          = @($requests | Where-Object { $_.States -contains 'Denied' }).Count
        requestsExpired = & $count 'RequestExpired'
        deactivations   = & $count 'Deactivated'
        outsidePim      = & $count 'OutsidePim'
        settingChanges  = & $count 'SettingChanged'
        unclassifiedEvents = & $count 'Other'
    }
    [pscustomobject]@{ Findings = $f.ToArray(); Requests = $requests; Summary = $summary }
}

# ----------------------------------------------------------------------------- writing the run

function Write-PaEvidenceJson {
    param([string]$Path, $Value)
    # LF on every platform: ConvertTo-Json uses the platform newline.
    [IO.File]::WriteAllText($Path, (ConvertTo-Json -InputObject $Value -Depth 20).Replace("`r`n", "`n") + "`n", [Text.UTF8Encoding]::new($false))
}

function Export-PaAuditRun {
    <#
    .SYNOPSIS
        Write the audit evidence (events.json, requests.json, summary.json, findings.json) and a
        manifest in the same shape as Export-PaRun's: task, mode, cloud, tenant, permissions, every
        request sent, and the SHA-256 of each file.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Events,
        [Parameter(Mandatory)]$Audit,
        [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][string]$TenantId,
        [object[]]$Evidence = @(),
        [string]$Mode = 'Fixture'
    )
    $OutputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $files = [ordered]@{
        'events.json'   = @($Events)
        'findings.json' = @($Audit.Findings)
        'requests.json' = @($Audit.Requests)
        'summary.json'  = $Audit.Summary
    }
    $hashes = [ordered]@{}
    foreach ($name in $files.Keys) {
        $p = Join-Path $OutputPath $name
        Write-PaEvidenceJson -Path $p -Value $files[$name]
        $hashes[$name] = (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    $perm = Get-PaEvidencePermission -Task pim-audit
    $manifest = [ordered]@{
        task = 'pim-audit'; mode = $Mode; cloud = $Cloud; tenantId = $TenantId
        generated = [DateTime]::UtcNow.ToString('o')
        graphPermissions = $perm.GraphPermissions; azureRoles = $perm.AzureRoles
        requests = @($Evidence | ForEach-Object { [ordered]@{ call = $_.Call; method = $_.Method; uri = $_.Uri; at = $_.At } })
        files = $hashes
    }
    Write-PaEvidenceJson -Path (Join-Path $OutputPath 'manifest.json') -Value $manifest
}

function Get-PaRunId {
    <# A sortable run ID from the as-of time and the mode, for example 2026-10-29T0600Z-fixture. #>
    param([Parameter(Mandatory)][datetime]$AsOf, [Parameter(Mandatory)][string]$Mode)
    "$($AsOf.ToUniversalTime().ToString('yyyy-MM-ddTHHmm'))Z-$($Mode.ToLowerInvariant())"
}

function Write-PaRunIndex {
    <#
    .SYNOPSIS
        run.json: the run's ID, as-of time, cloud, tenant, mode, audit window, and for each task its
        status (OK or Error, with the message) and the SHA-256 of its manifest. A task that failed
        has no folder: the comparison treats its findings as unverified, never as resolved.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$RunPath,
        [Parameter(Mandatory)][string]$RunId,
        [Parameter(Mandatory)][datetime]$AsOf,
        [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][string]$TenantId,
        [Parameter(Mandatory)][string]$Mode,
        [Parameter(Mandatory)][datetime]$Since,
        [Parameter(Mandatory)][datetime]$Until,
        [Parameter(Mandatory)][System.Collections.IDictionary]$Tasks
    )
    $taskRows = [ordered]@{}
    foreach ($name in $Tasks.Keys) {
        $t = $Tasks[$name]
        $row = [ordered]@{ folder = $t.Folder; status = $t.Status }
        if ($t.Status -eq 'OK') {
            $row.manifestSha256 = (Get-FileHash -LiteralPath (Join-Path $RunPath "$($t.Folder)/manifest.json") -Algorithm SHA256).Hash.ToLowerInvariant()
        } else { $row.message = $t.Message }
        $taskRows[$name] = $row
    }
    $index = [ordered]@{
        schema   = $script:RunSchema
        runId    = $RunId
        asOf     = $AsOf.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
        cloud    = $Cloud
        tenantId = $TenantId
        mode     = $Mode
        readOnly = $true
        auditWindow = [ordered]@{ since = $Since.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'); until = $Until.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ') }
        permissions = (Get-PaEvidencePermission -Task evidence-run)
        tasks    = $taskRows
    }
    Write-PaEvidenceJson -Path (Join-Path $RunPath 'run.json') -Value $index
    $index
}

Export-ModuleMember -Function Get-PaEvidenceCall, Get-PaEvidencePermission, New-PaAuditReader, New-PaEvidenceFixtureInvoker, Invoke-PaAuditFake,
    ConvertTo-PaAuditEvent, Get-PaPimAuditEvent, Get-PaActivationRequest, Test-PaPimAudit, Export-PaAuditRun, Get-PaRunId, Write-PaRunIndex
