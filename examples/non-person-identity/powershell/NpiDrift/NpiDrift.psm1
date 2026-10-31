#Requires -Version 7.1
<#
    NpiDrift: Chapter 10 of the developer workbook "Building Non-Person Identity".

    The scheduled drift run: Chapter 01's register and Chapter 02's ownership check, run together,
    compared by fingerprint with the last approved baseline, plus the credential and consent events
    in Microsoft Graph's directory audit log for the run's window and, where the cloud has it, the
    service principal sign-in activity report (beta). It raises the register drift findings
    NPI-DRF-01 to NPI-DRF-09, reads the review cycle's records (Chapters 07 and 09 write them) into
    NPI-REV-01 to NPI-REV-04, takes Chapters 03 to 09's findings through a small documented
    contract, and compares one AI use-case inventory vintage with the last (NPI-VIN-01 to -05).

    It uses NpiCore's reader, so the same rules hold: declared calls only (config/calls-ch10.json
    for this chapter's two), GET only, the cloud's own host, every page. Events are kept as IDs,
    never names. Illustrative: tested against fixtures and fakes, not a production tenant. Nothing
    here writes to a tenant or a domain.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot '../NpiInventory/NpiInventory.psm1') -Force -Global
Import-Module (Join-Path $PSScriptRoot '../NpiOwnership/NpiOwnership.psm1') -Force -Global

$script:ConfigRoot = Join-Path $PSScriptRoot '../../config'
$script:RunSchema = 'fmp-npi-run/1'
$script:BaselineSchema = 'fmp-npi-baseline/1'
$script:FindingsSchema = 'fmp-npi-findings/1'
$script:ReviewSchema = 'fmp-npi-review/1'
$script:CredentialLogSchema = 'fmp-npi-credential-log/1'
$script:Severities = @('Finding', 'Warn', 'Info')
# The register columns the fingerprint covers: what an owner, a credential or a permission changes.
# Last logon, password age and the stale lead move every day and aren't drift.
$script:FingerprintColumns = @(
    'IdentityId', 'Type', 'Enabled', 'OwnerIds', 'OwnerTypes', 'ServiceManagementReference', 'PasswordNeverExpires',
    'Secrets', 'Certificates', 'NextCredentialExpiry', 'CredentialKind', 'FederatedCredentials', 'FederatedSubjects',
    'GraphAppRoles', 'HighPrivilegeAppRoles', 'DelegatedGrants', 'TenantWideConsent', 'PrivilegedGroups', 'Delegation', 'Spns'
)

# ----------------------------------------------------------------------------- calls, policy, permissions

function Get-NpiDriftCallList {
    <# Chapter 10's call list, config/calls-ch10.json, in calls.json's schema. #>
    [CmdletBinding()]
    param([string]$Path = (Join-Path $script:ConfigRoot 'calls-ch10.json'))
    Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
}

function Get-NpiDriftPolicy {
    <# Thresholds and Learn's activity names, config/drift-ch10.json. #>
    [CmdletBinding()]
    param([string]$Path = (Join-Path $script:ConfigRoot 'drift-ch10.json'))
    $p = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
    $p['_path'] = (Resolve-Path -LiteralPath $Path).Path
    $p
}

function Get-NpiDriftPermission {
    <#
    .SYNOPSIS
        What a task needs: drift (this chapter's calls), or drift-run, the union of Chapter 01's
        inventory, Chapter 02's ownership and this chapter's drift task.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][ValidateSet('drift', 'drift-run')][string]$Task)
    $list = Get-NpiDriftCallList
    $own = @($list.calls | Where-Object { $_.tasks -contains 'drift' })
    $graph = [Collections.Generic.List[string]]::new(); $azure = [Collections.Generic.List[string]]::new(); $ad = [Collections.Generic.List[string]]::new()
    foreach ($c in $own) { foreach ($p in $c.permissions) { $graph.Add($p) } }
    if ($Task -eq 'drift-run') {
        foreach ($t in @($list.runs['drift-run'] | Where-Object { $_ -ne 'drift' })) {
            $p = Get-NpiRequiredPermission -Task $t
            foreach ($g in $p.GraphPermissions) { $graph.Add($g) }
            foreach ($a in $p.AzureRoles) { $azure.Add($a) }
            foreach ($r in $p.AdRights) { $ad.Add($r) }
        }
    }
    [pscustomobject]@{
        Task             = $Task
        GraphPermissions = @($graph | Sort-Object -Unique)
        AzureRoles       = @($azure | Sort-Object -Unique)
        AdRights         = @($ad | Sort-Object -Unique)
        DelegatedRoles   = @($list.tasks['drift'].delegatedRoles)
    }
}

function New-NpiDriftReader {
    <#
    .SYNOPSIS
        A read-only client for the drift task: NpiCore's reader shape with this chapter's call list,
        so Invoke-NpiList sends only declared GETs to the cloud's own host and follows every page.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][scriptblock]$Invoke)
    $list = Get-NpiDriftCallList
    if ($list.tasks['drift'].mode -ne 'read') { throw 'The drift task must be read-only.' }
    $calls = @($list.calls | Where-Object { $_.tasks -contains 'drift' })
    foreach ($c in $calls) { if ($c.method -ne 'GET') { throw "Refusing $($c.method) in the drift task's call list ($($c.id))." } }
    [pscustomobject]@{
        Cloud    = Get-NpiCloud -Cloud $Cloud
        Task     = 'drift'
        Calls    = $calls
        Invoke   = $Invoke
        AdInvoke = $null
        Evidence = [Collections.Generic.List[object]]::new()
    }
}

# ----------------------------------------------------------------------------- the fake

function ConvertTo-NpiUtc {
    # ConvertFrom-Json turns ISO 8601 strings into DateTime; a string round trip would apply the local offset.
    param($Value)
    if ($null -eq $Value -or "$Value" -eq '') { return $null }
    if ($Value -is [datetime]) {
        if ($Value.Kind -eq [DateTimeKind]::Unspecified) { return [datetime]::SpecifyKind($Value, [DateTimeKind]::Utc) }
        return $Value.ToUniversalTime()
    }
    if ($Value -is [DateTimeOffset]) { return $Value.UtcDateTime }
    [DateTimeOffset]::Parse([string]$Value, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AssumeUniversal).UtcDateTime
}

function New-NpiDriftFixtureInvoker {
    <#
    .SYNOPSIS
        A fake Microsoft Graph for the drift task: the directory audit log from -AuditPath (a JSON
        file with a 'directoryAudits' array in Graph's shape) and the service principal sign-in
        activity report from -SignInPath ('servicePrincipalSignInActivities'). It evaluates only the
        filter terms this chapter sends and refuses any other, serves pages of -PageSize with a next
        link on the same host, and records every call.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$AuditPath, [string]$SignInPath, [int]$PageSize = 2, [string]$Cloud = 'gcc')
    $c = Get-NpiCloud -Cloud $Cloud
    $audits = @((Get-Content -LiteralPath $AuditPath -Raw | ConvertFrom-Json -AsHashtable -Depth 50).directoryAudits)
    $signIns = if ($SignInPath) { @((Get-Content -LiteralPath $SignInPath -Raw | ConvertFrom-Json -AsHashtable -Depth 50).servicePrincipalSignInActivities) } else { @() }
    $state = [pscustomobject]@{ Audits = $audits; SignIns = $signIns; Calls = [Collections.Generic.List[object]]::new(); PageSize = $PageSize; Graph = $c.Graph; Invoke = $null }
    $s = $state
    $state.Invoke = { param($Method, $Uri, $Body, $Headers) Invoke-NpiDriftFake -State $s -Method $Method -Uri $Uri }.GetNewClosure()
    $state
}

function Invoke-NpiDriftFake {
    param($State, [string]$Method, [string]$Uri)
    $State.Calls.Add([pscustomobject]@{ Method = $Method; Uri = $Uri })
    if ($Method -ne 'GET') { throw "The fake refuses $Method" }
    $u = [Uri]$Uri
    if ("$($u.Scheme)://$($u.Host)" -ne $State.Graph) { throw "The fake refuses host $($u.Host)" }
    $q = @{}
    foreach ($pair in $u.Query.TrimStart('?').Split('&', [StringSplitOptions]::RemoveEmptyEntries)) {
        $kv = $pair.Split('=', 2); $q[[Uri]::UnescapeDataString($kv[0])] = if ($kv.Count -gt 1) { [Uri]::UnescapeDataString($kv[1]) } else { '' }
    }
    $path = [Uri]::UnescapeDataString($u.AbsolutePath)
    $rows = switch ($path) {
        '/v1.0/auditLogs/directoryAudits' { @($State.Audits) }
        '/beta/reports/servicePrincipalSignInActivities' { @($State.SignIns) }
        default { throw "The fake has no route for GET $path" }
    }
    if ($q.ContainsKey('$filter')) {
        # Split on "and" outside quotes: an activity name such as "... Certificates and secrets management" holds one.
        foreach ($term in ($q['$filter'] -split "\s+and\s+(?=(?:[^']*'[^']*')*[^']*$)")) {
            switch -Regex ($term.Trim()) {
                '^activityDateTime ge (\S+)$' { $t = ConvertTo-NpiUtc $Matches[1]; $rows = @($rows | Where-Object { (ConvertTo-NpiUtc $_.activityDateTime) -ge $t }); break }
                '^activityDateTime le (\S+)$' { $t = ConvertTo-NpiUtc $Matches[1]; $rows = @($rows | Where-Object { (ConvertTo-NpiUtc $_.activityDateTime) -le $t }); break }
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

function Get-NpiHashValue { param($Hash, [string]$Key) if ($Hash -is [System.Collections.IDictionary] -and $Hash.Contains($Key)) { $Hash[$Key] } else { $null } }

function ConvertTo-NpiActivityName {
    # Learn's activity list writes "Update application - Certificates and secrets management" with a
    # hyphen; a dash typed elsewhere is read as the same name (research gaps, row 91).
    param([string]$Name)
    ($Name -replace '[–—]', '-').Trim()
}

function Get-NpiKeyDescription {
    # Credentials in a KeyDescription value, in the format Learn's linked Sentinel rule parses:
    # [KeyIdentifier=<id>,KeyType=<type>,KeyUsage=<usage>,DisplayName=<name>]. The display name is
    # dropped: it is free text that can name a person.
    param($Value)
    if ($null -eq $Value -or "$Value" -eq '') { return @() }
    $items = $Value
    if ($Value -is [string]) { try { $items = $Value | ConvertFrom-Json -NoEnumerate } catch { $items = @($Value) } }
    @(foreach ($i in @($items)) {
            if ("$i" -match 'KeyIdentifier=([^,\]]*),KeyType=([^,\]]*),KeyUsage=([^,\]]*)') {
                [pscustomobject]@{ KeyId = $Matches[1]; KeyType = $Matches[2]; KeyUsage = $Matches[3] }
            }
        })
}

function ConvertTo-NpiAuditEvent {
    <#
    .SYNOPSIS
        One directoryAudit item as an evidence row: the activity and its class, the initiator and the
        target as IDs, and the credentials added or removed (key ID, type, usage). No names.
    #>
    param([Parameter(Mandatory)]$Item, [Parameter(Mandatory)]$Policy)
    $init = Get-NpiHashValue $Item 'initiatedBy'
    $user = Get-NpiHashValue $init 'user'; $app = Get-NpiHashValue $init 'app'
    $initType = $null; $initId = $null
    if ($user -and (Get-NpiHashValue $user 'id')) { $initType = 'user'; $initId = [string]$user.id }
    elseif ($app -and (Get-NpiHashValue $app 'servicePrincipalId')) { $initType = 'app'; $initId = [string]$app.servicePrincipalId }
    elseif ($app -and (Get-NpiHashValue $app 'appId')) { $initType = 'app'; $initId = [string]$app.appId }
    $activity = ConvertTo-NpiActivityName ([string]$Item.activityDisplayName)
    $class = if ($Policy.activities.ContainsKey($activity)) { $Policy.activities[$activity] } else { 'Other' }
    $target = $null; $added = @(); $removed = @()
    foreach ($t in @(Get-NpiHashValue $Item 'targetResources')) {
        if (-not $t) { continue }
        $type = [string](Get-NpiHashValue $t 'type')
        if (-not $type) { $type = [string](Get-NpiHashValue $t 'Type') }
        if (-not $target -and $type -in 'Application', 'ServicePrincipal') { $target = @{ Type = $type; Id = [string]$t.id } }
        foreach ($m in @(Get-NpiHashValue $t 'modifiedProperties')) {
            if (-not $m -or [string](Get-NpiHashValue $m 'displayName') -ne 'KeyDescription') { continue }
            $new = @(Get-NpiKeyDescription (Get-NpiHashValue $m 'newValue')); $old = @(Get-NpiKeyDescription (Get-NpiHashValue $m 'oldValue'))
            $oldIds = @($old | ForEach-Object KeyId); $newIds = @($new | ForEach-Object KeyId)
            $added += @($new | Where-Object { $_.KeyId -notin $oldIds })
            $removed += @($old | Where-Object { $_.KeyId -notin $newIds })
        }
    }
    [pscustomobject][ordered]@{
        Id               = [string]$Item.id
        ActivityDateTime = (ConvertTo-NpiUtc $Item.activityDateTime).ToString('yyyy-MM-ddTHH:mm:ssZ')
        Activity         = $activity
        Class            = $class
        Result           = [string](Get-NpiHashValue $Item 'result')
        CorrelationId    = [string](Get-NpiHashValue $Item 'correlationId')
        InitiatorType    = $initType
        InitiatorId      = $initId
        TargetType       = if ($target) { $target.Type } else { $null }
        TargetId         = if ($target) { $target.Id } else { $null }
        KeysAdded        = @($added)
        KeysRemoved      = @($removed)
    }
}

function Get-NpiAuditEvent {
    <#
    .SYNOPSIS
        Read the directory audit log for one window: one filtered, paged GET for each activity name
        in the policy (credential changes on applications and service principals, consent, delegated
        grants, app role assignments). Events are de-duplicated by ID and sorted by time. Refuses a
        window that starts more than 30 days before -AsOf: the log keeps 30 days with P1 or P2.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Reader,
        [Parameter(Mandatory)][datetime]$Since,
        [Parameter(Mandatory)][datetime]$Until,
        [datetime]$AsOf = $Until,
        $Policy = (Get-NpiDriftPolicy)
    )
    $s = $Since.ToUniversalTime(); $u = $Until.ToUniversalTime()
    if ($u -le $s) { throw "The window ends ($($u.ToString('o'))) before it starts ($($s.ToString('o')))." }
    if (($AsOf.ToUniversalTime() - $s).TotalDays -gt $Policy.maxWindowDays) {
        throw "The window starts more than $($Policy.maxWindowDays) days before $($AsOf.ToString('yyyy-MM-dd')): the audit log keeps 30 days with P1 or P2, so the read can't be complete. Read the gap from the Log Analytics workspace."
    }
    $win = "activityDateTime ge $($s.ToString('yyyy-MM-ddTHH:mm:ssZ')) and activityDateTime le $($u.ToString('yyyy-MM-ddTHH:mm:ssZ'))"
    $items = @()
    foreach ($a in @($Policy.activities.Keys | Sort-Object)) {
        $items += @(Invoke-NpiList -Reader $Reader -CallId 'directory-audits' -Query "`$filter=$win and activityDisplayName eq '$a'")
    }
    $seen = @{}
    $events = foreach ($i in $items) {
        if ($seen.ContainsKey($i.id)) { continue }
        $seen[$i.id] = $true
        ConvertTo-NpiAuditEvent -Item $i -Policy $Policy
    }
    @($events | Sort-Object ActivityDateTime, Id)
}

function Get-NpiSignInActivity {
    <#
    .SYNOPSIS
        The service principal sign-in activity report (beta): the last sign-in per app ID. Learn lists
        it in the global service only, so in gcchigh or dod it isn't sent and Status is NotAvailable.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Reader)
    $call = @($Reader.Calls | Where-Object id -EQ 'sp-signin-activities')[0]
    if ($Reader.Cloud.Name -notin @($call.clouds)) { return [pscustomobject]@{ Status = 'NotAvailable'; ByAppId = @{} } }
    $by = @{}
    foreach ($r in (Invoke-NpiList -Reader $Reader -CallId 'sp-signin-activities')) {
        $last = Get-NpiHashValue (Get-NpiHashValue $r 'lastSignInActivity') 'lastSignInDateTime'
        $by[[string]$r.appId] = if ($last) { (ConvertTo-NpiUtc $last).ToString('yyyy-MM-ddTHH:mm:ssZ') } else { $null }
    }
    [pscustomobject]@{ Status = 'Read'; ByAppId = $by }
}

# ----------------------------------------------------------------------------- fingerprints and the baseline

function Get-NpiFingerprint {
    <#
    .SYNOPSIS
        A finding's fingerprint: the first 16 hex characters of SHA-256("<rule>|<objectKey>|"), the
        first workbook's fingerprint() with an empty issue, so the same finding has the same value
        every run however its text changes. Chapters 03 to 09 compute it the same way.
    #>
    param([Parameter(Mandatory)][string]$Rule, [Parameter(Mandatory)][string]$ObjectKey)
    $b = [Text.Encoding]::UTF8.GetBytes("$Rule|$ObjectKey|")
    ([Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($b))).ToLowerInvariant().Substring(0, 16)
}

function New-NpiDriftFinding {
    param([string]$Rule, [string]$Severity, [string]$ObjectKey, [string]$Object, [string]$Issue)
    $f = New-NpiFinding -Rule $Rule -Severity $Severity -ObjectKey $ObjectKey -Object $Object -Issue $Issue
    [pscustomobject][ordered]@{ Id = $f.Id; Rule = $Rule; Severity = $Severity; Chapter = '10'; ObjectKey = $ObjectKey; Object = $Object; Issue = $Issue; Fingerprint = (Get-NpiFingerprint -Rule $Rule -ObjectKey $ObjectKey) }
}

function Format-NpiValue {
    param($Value)
    if ($null -eq $Value) { return '' }
    if ($Value -is [datetime]) { return $Value.ToString('yyyy-MM-dd') }
    if ($Value -is [bool]) { return $(if ($Value) { 'true' } else { 'false' }) }
    "$Value"
}

function Get-NpiRowValues {
    # The governance columns of one register row, as text, in a fixed order.
    param($Row)
    $v = [ordered]@{}
    foreach ($c in $script:FingerprintColumns) { $v[$c] = Format-NpiValue $(if ($Row.PSObject.Properties[$c]) { $Row.$c } else { $null }) }
    $v
}

function Get-NpiRowFingerprint {
    <# SHA-256 over the row's governance columns, as name=value lines in a fixed order. #>
    param([Parameter(Mandatory)]$Row)
    $v = Get-NpiRowValues $Row
    $text = ($v.Keys | ForEach-Object { "$_=$($v[$_])" }) -join "`n"
    ([Convert]::ToHexString([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($text)))).ToLowerInvariant()
}

function New-NpiDriftBaseline {
    <#
    .SYNOPSIS
        A baseline candidate from one register: each identity's fingerprint and governance columns,
        with the tenant, cloud, run and the register's SHA-256. It becomes the approved baseline when
        a reviewer passes its SHA-256 to the next run as -ApprovedBaselineSha256.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][object[]]$Rows, [Parameter(Mandatory)][string]$TenantId, [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][string]$RunId, [Parameter(Mandatory)][string]$AsOf, [Parameter(Mandatory)][string]$RegisterSha256)
    $ids = [ordered]@{}
    foreach ($r in @($Rows | Sort-Object IdentityId)) { $ids[$r.IdentityId] = [ordered]@{ fingerprint = Get-NpiRowFingerprint $r; values = Get-NpiRowValues $r } }
    [ordered]@{ schema = $script:BaselineSchema; tenantId = $TenantId; cloud = $Cloud; runId = $RunId; asOf = $AsOf; registerSha256 = $RegisterSha256; columns = $script:FingerprintColumns; identities = $ids }
}

function Import-NpiDriftBaseline {
    <#
    .SYNOPSIS
        The approved baseline: its SHA-256 must be the one the reviewer approved, and it must be for
        this tenant and cloud, or the run refuses to compare against it.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][string]$ApprovedSha256, [Parameter(Mandatory)][string]$TenantId, [Parameter(Mandatory)][string]$Cloud)
    $sha = Get-NpiFileHash -Path $Path
    if ($sha -ne $ApprovedSha256.ToLowerInvariant()) { throw "The baseline's SHA-256 is $sha, not the approved $ApprovedSha256; refusing to compare against a baseline nobody approved." }
    $b = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 20
    if ($b.schema -ne $script:BaselineSchema) { throw "$Path isn't a $script:BaselineSchema baseline." }
    if ("$($b.tenantId)".ToLowerInvariant() -ne $TenantId.ToLowerInvariant()) { throw "The baseline is for tenant $($b.tenantId), not $TenantId." }
    if ($b.cloud -ne $Cloud) { throw "The baseline was read in cloud '$($b.cloud)', not '$Cloud'." }
    $b['_sha256'] = $sha
    $b
}

# ----------------------------------------------------------------------------- the contract with Chapters 03 to 09

function Read-NpiContractFile {
    <#
    .SYNOPSIS
        Read and check one file another chapter wrote for this one. Three schemas:
        fmp-npi-findings/1 (findings with id, rule, severity, chapter, objectKey, fingerprint),
        fmp-npi-review/1 (review records) and fmp-npi-credential-log/1 (credentials a pipeline added).
        Returns @{ Schema; Chapter; Data } or throws with the reason.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][string]$TenantId, $Policy = (Get-NpiDriftPolicy))
    $d = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 20
    if ($d -isnot [System.Collections.IDictionary]) { throw "$(Split-Path $Path -Leaf): not a JSON object" }
    $schema = [string](Get-NpiHashValue $d 'schema'); $chapter = [string](Get-NpiHashValue $d 'chapter')
    if ($schema -notin $script:FindingsSchema, $script:ReviewSchema, $script:CredentialLogSchema) { throw "$(Split-Path $Path -Leaf): unknown schema '$schema'" }
    if ($chapter -notin @($Policy.chapterContract)) { throw "$(Split-Path $Path -Leaf): chapter '$chapter' isn't one of $(@($Policy.chapterContract) -join ', ')" }
    if ("$(Get-NpiHashValue $d 'tenantId')".ToLowerInvariant() -ne $TenantId.ToLowerInvariant()) { throw "$(Split-Path $Path -Leaf): tenant $(Get-NpiHashValue $d 'tenantId'), not $TenantId" }
    switch ($schema) {
        $script:FindingsSchema {
            $rows = foreach ($f in @(Get-NpiHashValue $d 'findings')) {
                foreach ($k in 'id', 'rule', 'severity', 'chapter', 'objectKey', 'fingerprint') { if (-not (Get-NpiHashValue $f $k)) { throw "$(Split-Path $Path -Leaf): a finding has no '$k'" } }
                if ($f.rule -notmatch '^NPI-[A-Z]+-\d{2}$') { throw "$(Split-Path $Path -Leaf): rule '$($f.rule)' isn't NPI-<AREA>-<NN>" }
                if ($f.severity -notin $script:Severities) { throw "$(Split-Path $Path -Leaf): severity '$($f.severity)' isn't Finding, Warn or Info" }
                if ($f.chapter -ne $chapter) { throw "$(Split-Path $Path -Leaf): finding $($f.id) is for chapter $($f.chapter), the file for $chapter" }
                if ($f.id -ne "$($f.rule):$($f.objectKey)") { throw "$(Split-Path $Path -Leaf): id '$($f.id)' isn't '<rule>:<objectKey>'" }
                $fp = Get-NpiFingerprint -Rule $f.rule -ObjectKey $f.objectKey
                if ($f.fingerprint -ne $fp) { throw "$(Split-Path $Path -Leaf): finding $($f.id) has fingerprint $($f.fingerprint), not $fp" }
                [pscustomobject][ordered]@{ Id = $f.id; Rule = $f.rule; Severity = $f.severity; Chapter = $f.chapter; ObjectKey = $f.objectKey; Object = $f.objectKey; Issue = [string](Get-NpiHashValue $f 'issue'); Fingerprint = $fp }
            }
            return [pscustomobject]@{ Schema = $schema; Chapter = $chapter; Data = @($rows) }
        }
        $script:ReviewSchema {
            $kind = [string](Get-NpiHashValue $d 'kind')
            if ($kind -notin 'owner-permission-review', 'sponsor-attestation', 'agent-access-recertification') { throw "$(Split-Path $Path -Leaf): review kind '$kind' isn't owner-permission-review, sponsor-attestation or agent-access-recertification" }
            $recs = foreach ($r in @(Get-NpiHashValue $d 'records')) {
                if (-not (Get-NpiHashValue $r 'identityKey')) { throw "$(Split-Path $Path -Leaf): a record has no identityKey" }
                [pscustomobject][ordered]@{
                    IdentityKey = [string]$r.identityKey; ReviewedOn = [string](Get-NpiHashValue $r 'reviewedOn'); Decision = [string](Get-NpiHashValue $r 'decision')
                    ReviewerId = [string](Get-NpiHashValue $r 'reviewerId'); AssignmentId = [string](Get-NpiHashValue $r 'assignmentId'); Expires = (Get-NpiHashValue $r 'expires')
                }
            }
            return [pscustomobject]@{ Schema = $schema; Chapter = $chapter; Kind = $kind; Data = @($recs) }
        }
        $script:CredentialLogSchema {
            $ch = foreach ($c in @(Get-NpiHashValue $d 'changes')) {
                foreach ($k in 'objectId', 'keyId', 'changeId') { if (-not (Get-NpiHashValue $c $k)) { throw "$(Split-Path $Path -Leaf): a change has no '$k'" } }
                [pscustomobject]@{ ObjectId = [string]$c.objectId; KeyId = [string]$c.keyId; ChangeId = [string]$c.changeId }
            }
            return [pscustomobject]@{ Schema = $schema; Chapter = $chapter; Data = @($ch) }
        }
    }
}

function Import-NpiContract {
    <#
    .SYNOPSIS
        Every *.json file in -Path, read through Read-NpiContractFile. A file that fails its check is
        refused and listed with the reason, never half-read. Returns @{ Findings; Reviews; CredentialLog;
        Chapters; Refused; Files }.
    #>
    [CmdletBinding()]
    param([string]$Path, [Parameter(Mandatory)][string]$TenantId, $Policy = (Get-NpiDriftPolicy))
    $out = [pscustomobject]@{ Findings = @(); Reviews = @{}; CredentialLog = @(); Chapters = @(); Refused = @(); Files = [ordered]@{} }
    if (-not $Path -or -not (Test-Path -LiteralPath $Path)) { return $out }
    foreach ($file in @(Get-ChildItem -LiteralPath $Path -Filter *.json -File | Sort-Object Name)) {
        $out.Files[$file.Name] = Get-NpiFileHash -Path $file.FullName
        try { $c = Read-NpiContractFile -Path $file.FullName -TenantId $TenantId -Policy $Policy }
        catch { $out.Refused += [pscustomobject]@{ File = $file.Name; Reason = $_.Exception.Message }; continue }
        if ($c.Schema -eq $script:FindingsSchema) { $out.Findings += $c.Data; $out.Chapters = @($out.Chapters + $c.Chapter | Sort-Object -Unique) }
        elseif ($c.Schema -eq $script:ReviewSchema) { $out.Reviews[$c.Kind] = @($(if ($out.Reviews.ContainsKey($c.Kind)) { $out.Reviews[$c.Kind] }) + $c.Data) }
        else { $out.CredentialLog += $c.Data }
    }
    $out
}

# ----------------------------------------------------------------------------- the register drift findings

function Get-NpiRowIndex {
    # Register rows by IdentityId, by object ID and by app ID, so an audit target or an app ID finds its row.
    param([object[]]$Rows)
    $byId = @{}; $byObject = @{}; $byApp = @{}
    foreach ($r in $Rows) {
        $byId[$r.IdentityId] = $r
        if ($r.ObjectId) { $byObject["$($r.ObjectId)"] = $r }
        if ($r.AppId -and $r.Type -in 'AppRegistration', 'AgentIdentityBlueprint') { $byApp["$($r.AppId)"] = $r }
    }
    [pscustomobject]@{ ById = $byId; ByObject = $byObject; ByApp = $byApp }
}

function Resolve-NpiTargetRow {
    # An audit target as the register row that holds its credentials and permissions: an own
    # service principal resolves to its app registration's row, as Chapter 01 reports it.
    param($Index, [string]$TargetId)
    if (-not $TargetId -or -not $Index.ByObject.ContainsKey($TargetId)) { return $null }
    $r = $Index.ByObject[$TargetId]
    if ($r.Type -eq 'ServicePrincipal' -and $r.AppId -and $Index.ByApp.ContainsKey("$($r.AppId)")) { return $Index.ByApp["$($r.AppId)"] }
    $r
}

function Test-NpiRegisterDrift {
    <#
    .SYNOPSIS
        The register drift findings, NPI-DRF-01 to NPI-DRF-09, each with a stable ID and fingerprint.
        01 new since the approved baseline; 02 changed or removed since it; 03 ownerless (an orphan
        candidate in Chapter 02's run); 04 unused for 90 days by the sign-in activity report; 05 a
        credential expiring within 30 days; 06 a password that never expires; 07 a credential added
        outside the pipeline; 08 a new consent grant or application permission; 09 an evidence gap.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][object[]]$Rows,
        [Parameter(Mandatory)][datetime]$AsOf,
        [AllowEmptyCollection()][object[]]$Ownership = @(),
        [AllowEmptyCollection()][object[]]$Events = @(),
        $SignIn,
        $Baseline,
        [AllowEmptyCollection()][object[]]$CredentialLog = @(),
        [AllowEmptyCollection()][object[]]$PipelineIdentities = @(),
        [string]$Cloud = 'gcc',
        $Policy = (Get-NpiDriftPolicy),
        $RegisterConfig = (Get-NpiRegisterConfig)
    )
    $f = [Collections.Generic.List[object]]::new()
    $idx = Get-NpiRowIndex $Rows
    $label = { param($r) "$($r.Name) ($($r.Type))" }
    $asOfUtc = $AsOf.ToUniversalTime()
    $baseIds = if ($Baseline) { $Baseline.identities } else { @{} }

    # 01 and 02: the approved baseline, by fingerprint.
    if ($Baseline) {
        foreach ($r in $Rows) {
            if (-not $baseIds.Contains($r.IdentityId)) { $f.Add((New-NpiDriftFinding 'NPI-DRF-01' 'Warn' $r.IdentityId (& $label $r) 'New since the approved baseline: confirm its owner, record and reason, then approve the next baseline')); continue }
            $b = $baseIds[$r.IdentityId]
            if ($b.fingerprint -ne (Get-NpiRowFingerprint $r)) {
                $now = Get-NpiRowValues $r
                $cols = @($now.Keys | Where-Object { "$($b.values[$_])" -ne $now[$_] })
                $f.Add((New-NpiDriftFinding 'NPI-DRF-02' 'Warn' $r.IdentityId (& $label $r) "Changed since the approved baseline: $($cols -join ', ')"))
            }
        }
        $now = @{}; foreach ($r in $Rows) { $now[$r.IdentityId] = $true }
        foreach ($k in @($baseIds.Keys | Sort-Object)) {
            if (-not $now.ContainsKey($k)) { $f.Add((New-NpiDriftFinding 'NPI-DRF-02' 'Info' $k $k 'In the approved baseline, not in this register: confirm it was retired through the decommission process')) }
        }
    }

    # 03: ownerless, from Chapter 02's run.
    foreach ($o in @($Ownership | Where-Object { $_.OrphanCandidate })) {
        $f.Add((New-NpiDriftFinding 'NPI-DRF-03' 'Finding' $o.IdentityId "$($o.Name) ($($o.Type))" 'Ownerless: an orphan candidate in Chapter 02''s run; the orphan rule (D-N2) decides, and nothing here disables it'))
    }

    # 04: unused, from the service principal sign-in activity report (beta).
    $ownerTypes = @($Policy.ownerRuleTypes)
    if ($SignIn -and $SignIn.Status -eq 'Read') {
        foreach ($r in @($Rows | Where-Object { $_.Type -in $ownerTypes -and $_.Enabled -ne $false })) {
            if ($Baseline -and -not $baseIds.Contains($r.IdentityId)) { continue }   # new since the baseline: too new to call unused
            $last = if ($r.AppId -and $SignIn.ByAppId.ContainsKey("$($r.AppId)")) { $SignIn.ByAppId["$($r.AppId)"] } else { $null }
            if (-not $last) { $f.Add((New-NpiDriftFinding 'NPI-DRF-04' 'Warn' $r.IdentityId (& $label $r) "No sign-in in the service principal sign-in activity report: unused for over $($Policy.unusedDays) days, or never used; confirm with the owner, then the orphan rule or decommission")); continue }
            $days = [int][Math]::Floor(($asOfUtc - (ConvertTo-NpiUtc $last)).TotalDays)
            if ($days -gt $Policy.unusedDays) { $f.Add((New-NpiDriftFinding 'NPI-DRF-04' 'Warn' $r.IdentityId (& $label $r) "Last sign-in $((ConvertTo-NpiUtc $last).ToString('yyyy-MM-dd')), $days days ago: unused for over $($Policy.unusedDays) days")) }
        }
    } elseif ($SignIn -and $SignIn.Status -eq 'NotAvailable') {
        $f.Add((New-NpiDriftFinding 'NPI-DRF-09' 'Warn' "signin-activity:$Cloud" "sign-in activity ($Cloud)" "The service principal sign-in activity report isn't available in $Cloud (Learn: global service only), so unused registrations weren't checked; use the sign-in logs"))
    }

    # 05: a credential expiring soon.
    foreach ($r in @($Rows | Where-Object { $_.NextCredentialExpiry -and $_.Enabled -ne $false })) {
        $end = ConvertTo-NpiUtc $r.NextCredentialExpiry
        $days = [int][Math]::Floor(($end - $asOfUtc).TotalDays)
        if ($days -le $Policy.expiringDays) { $f.Add((New-NpiDriftFinding 'NPI-DRF-05' 'Warn' $r.IdentityId (& $label $r) "A credential expires $($end.ToString('yyyy-MM-dd')), in $days days: rotate it through the pipeline, approved by the owner")) }
    }

    # 06: a password that never expires, on an enabled AD account (Gate 7: none).
    foreach ($r in @($Rows | Where-Object { $_.Source -eq 'AD' -and $_.Enabled -eq $true -and $_.PasswordNeverExpires -eq $true })) {
        if ("$($r.Note)" -like 'Detected only by a password that never expires*') { continue }   # may be a person: Chapter 02, NPI-OWN-09
        $why = if ($r.Handoff -eq 'DataPlatform') { '; a SQL Server account, handed to the Data Platform plan' } else { '' }
        $f.Add((New-NpiDriftFinding 'NPI-DRF-06' 'Finding' $r.IdentityId (& $label $r) "Password never expires$why. Candidate: $($r.CandidateTarget)"))
    }

    # 07: credentials added outside the pipeline.
    $pipeline = @{}; foreach ($p in $PipelineIdentities) { if ($p.ServicePrincipalId) { $pipeline["$($p.ServicePrincipalId)".ToLowerInvariant()] = $true } }
    $logged = @{}; foreach ($c in $CredentialLog) { $logged["$($c.ObjectId)|$($c.KeyId)".ToLowerInvariant()] = $c.ChangeId }
    foreach ($e in @($Events | Where-Object { $_.Class -in 'CredentialChange', 'CredentialAdded' -and $_.Result -eq 'success' })) {
        foreach ($k in @($e.KeysAdded)) {
            $row = Resolve-NpiTargetRow $idx $e.TargetId
            $key = if ($row) { $row.IdentityId } else { "$($e.TargetType):$($e.TargetId)" }
            $byPipeline = $e.InitiatorType -eq 'app' -and $pipeline.ContainsKey("$($e.InitiatorId)".ToLowerInvariant())
            $inLog = $logged.ContainsKey("$($e.TargetId)|$($k.KeyId)".ToLowerInvariant())
            if ($byPipeline -and $inLog) { continue }
            $why = if ($byPipeline) { 'by the pipeline''s identity but not in its credential log' } elseif ($inLog) { "in the credential log but added by $($e.InitiatorType) $($e.InitiatorId), not the pipeline" } else { "by $($e.InitiatorType) $($e.InitiatorId), not the pipeline" }
            $obj = if ($row) { & $label $row } else { "$($e.TargetType) $($e.TargetId)" }
            $f.Add((New-NpiDriftFinding 'NPI-DRF-07' 'Finding' "$key/key:$($k.KeyId)" $obj "$($k.KeyType) credential $($k.KeyId) added to the $(if ($e.TargetType -eq 'ServicePrincipal') { 'service principal' } else { 'application' }) at $($e.ActivityDateTime) ($($e.Activity)) $why"))
        }
    }

    # 08: new consent grants and application permissions, from the baseline and the audit log.
    $consent = [ordered]@{}
    $note = { param([string]$k, $r, [string]$what, [bool]$high) if (-not $consent.Contains($k)) { $consent[$k] = @{ Row = $r; What = [Collections.Generic.List[string]]::new(); High = $false } }; $consent[$k].What.Add($what); if ($high) { $consent[$k].High = $true } }
    $highRoles = @($RegisterConfig.highPrivilegeGraphAppRoles)
    if ($Baseline) {
        foreach ($r in $Rows) {
            if (-not $baseIds.Contains($r.IdentityId)) { continue }
            $b = $baseIds[$r.IdentityId].values
            $was = @("$($b['GraphAppRoles'])" -split '; ' | Where-Object { $_ }); $now = @("$($r.GraphAppRoles)" -split '; ' | Where-Object { $_ })
            foreach ($role in @($now | Where-Object { $_ -notin $was })) { & $note $r.IdentityId $r "Graph application permission $role" ($role -in $highRoles) }
            if ([int]$r.DelegatedGrants -gt [int]"0$($b['DelegatedGrants'])") { & $note $r.IdentityId $r "delegated grants $($b['DelegatedGrants']) to $($r.DelegatedGrants)" $false }
            if ($r.TenantWideConsent -eq $true -and $b['TenantWideConsent'] -ne 'true') { & $note $r.IdentityId $r 'a delegated grant consented for all users' $true }
        }
    }
    foreach ($e in @($Events | Where-Object { $_.Class -in 'Consent', 'DelegatedGrant', 'AppRoleGrant' -and $_.Result -eq 'success' })) {
        $row = Resolve-NpiTargetRow $idx $e.TargetId
        $k = if ($row) { $row.IdentityId } else { "$($e.TargetType):$($e.TargetId)" }
        & $note $k $row "'$($e.Activity)' by $($e.InitiatorType) $($e.InitiatorId) at $($e.ActivityDateTime)" $false
    }
    foreach ($k in $consent.Keys) {
        $c = $consent[$k]
        $obj = if ($c.Row) { & $label $c.Row } else { $k }
        $f.Add((New-NpiDriftFinding 'NPI-DRF-08' $(if ($c.High) { 'Finding' } else { 'Warn' }) $k $obj "New consent or permission: $($c.What -join '; '). Reconcile with a reviewed request (Chapter 07)"))
    }
    $f.ToArray()
}

# ----------------------------------------------------------------------------- the review cycle

function Test-NpiReviewCycle {
    <#
    .SYNOPSIS
        The review cycle record (plan task N7.2) from the outputs of Chapters 07 and 09, read only.
        NPI-REV-01: an app registration holding Graph permissions with no owners' permission review
        in the last quarter. NPI-REV-02: an agent identity or blueprint with no sponsor attestation
        in the last 12 months. NPI-REV-03: an agent's access assignment with no end date, an end
        past the maximum, or still active after it. NPI-REV-04: a kind of review record not received.
        Returns @{ Findings; Record }.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][object[]]$Rows, [Parameter(Mandatory)][datetime]$AsOf, [hashtable]$Reviews = @{}, $Policy = (Get-NpiDriftPolicy))
    $f = [Collections.Generic.List[object]]::new()
    $asOfUtc = $AsOf.ToUniversalTime()
    $kinds = [ordered]@{ 'owner-permission-review' = '07'; 'sponsor-attestation' = '09'; 'agent-access-recertification' = '09' }
    foreach ($k in $kinds.Keys) {
        if (-not $Reviews.ContainsKey($k)) { $f.Add((New-NpiDriftFinding 'NPI-REV-04' 'Warn' "review:$k" $k "No $k records from Chapter $($kinds[$k]): the review cycle can't be shown for this run")) }
    }
    $latest = {
        param([string]$Kind, [string]$Key)
        if (-not $Reviews.ContainsKey($Kind)) { return $null }
        $d = @($Reviews[$Kind] | Where-Object { $_.IdentityKey -eq $Key -and $_.ReviewedOn } | ForEach-Object { ConvertTo-NpiUtc $_.ReviewedOn } | Sort-Object -Descending)
        if ($d.Count) { $d[0] } else { $null }
    }
    $record = foreach ($r in $Rows) {
        $isOwner = $r.Type -in @($Policy.ownerRuleTypes) -and $r.Enabled -ne $false
        $isAgent = $r.Type -in @($Policy.agentTypes)
        if (-not $isOwner -and -not $isAgent) { continue }
        $holds = [bool]("$($r.GraphAppRoles)" -or [int]"0$($r.DelegatedGrants)" -gt 0)
        $ownerReview = & $latest 'owner-permission-review' $r.IdentityId
        $attest = & $latest 'sponsor-attestation' $r.IdentityId
        $assign = @(if ($Reviews.ContainsKey('agent-access-recertification')) { $Reviews['agent-access-recertification'] | Where-Object IdentityKey -EQ $r.IdentityId })
        if ($isOwner -and $holds -and $Reviews.ContainsKey('owner-permission-review')) {
            if (-not $ownerReview -or ($asOfUtc - $ownerReview).TotalDays -gt $Policy.ownerReviewDays) {
                $f.Add((New-NpiDriftFinding 'NPI-REV-01' 'Finding' $r.IdentityId "$($r.Name) ($($r.Type))" "Holds Graph permissions ($(@($r.GraphAppRoles, $(if ([int]"0$($r.DelegatedGrants)") { "$($r.DelegatedGrants) delegated grant(s)" })) -join ', ' -replace '^, |, $')) with no owners' permission review in the last $($Policy.ownerReviewDays) days$(if ($ownerReview) { "; last $($ownerReview.ToString('yyyy-MM-dd'))" })"))
            }
        }
        if ($isAgent -and $Reviews.ContainsKey('sponsor-attestation')) {
            if (-not $attest -or ($asOfUtc - $attest).TotalDays -gt $Policy.attestationDays) {
                $f.Add((New-NpiDriftFinding 'NPI-REV-02' 'Finding' $r.IdentityId "$($r.Name) ($($r.Type))" "No sponsor attestation in the last $($Policy.attestationDays) days$(if ($attest) { "; last $($attest.ToString('yyyy-MM-dd'))" })"))
            }
        }
        foreach ($a in $assign) {
            $end = ConvertTo-NpiUtc $a.Expires
            $key = "$($r.IdentityId)/assignment:$($a.AssignmentId)"
            if (-not $end) { $f.Add((New-NpiDriftFinding 'NPI-REV-03' 'Finding' $key "$($r.Name) ($($r.Type))" "Access assignment $($a.AssignmentId) has no end date: expiry is the agent's review")); continue }
            if (($end - $asOfUtc).TotalDays -gt $Policy.maxAgentAssignmentDays) { $f.Add((New-NpiDriftFinding 'NPI-REV-03' 'Finding' $key "$($r.Name) ($($r.Type))" "Access assignment $($a.AssignmentId) ends $($end.ToString('yyyy-MM-dd')), more than $($Policy.maxAgentAssignmentDays) days away")) }
            elseif ($end -lt $asOfUtc -and $a.Decision -eq 'Active') { $f.Add((New-NpiDriftFinding 'NPI-REV-03' 'Finding' $key "$($r.Name) ($($r.Type))" "Access assignment $($a.AssignmentId) ended $($end.ToString('yyyy-MM-dd')) but is recorded as still active")) }
        }
        $next = @($assign | Where-Object Expires | ForEach-Object { (ConvertTo-NpiUtc $_.Expires) } | Where-Object { $_ -ge $asOfUtc } | Sort-Object | Select-Object -First 1)
        [pscustomobject][ordered]@{
            IdentityId           = $r.IdentityId
            Type                 = $r.Type
            HoldsPermissions     = $holds
            OwnerReview          = if ($ownerReview) { $ownerReview.ToString('yyyy-MM-dd') } else { $null }
            SponsorAttestation   = if ($attest) { $attest.ToString('yyyy-MM-dd') } else { $null }
            AgentAssignments     = $assign.Count
            NextAssignmentExpiry = if ($next.Count) { $next[0].ToString('yyyy-MM-dd') } else { $null }
        }
    }
    [pscustomobject]@{ Findings = $f.ToArray(); Record = @($record) }
}

# ----------------------------------------------------------------------------- the annual vintage comparison

function Compare-NpiAiVintage {
    <#
    .SYNOPSIS
        Compare this year's AI use-case inventory vintage with last year's by use case ID (Book 17,
        Chapter 09's four changes), joined to the register through the use-case map and the service
        records. NPI-VIN-01 a new piloted or deployed entry with no identity; 02 an entry retired
        whose identities are still enabled; 03 an authorization answer changed; 04 an entry that left
        the inventory without being retired; 05 an AI identity whose record maps to no use case in
        this vintage. Returns @{ Findings; Changes }.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][object[]]$Current,
        [Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Prior,
        [Parameter(Mandatory)][AllowEmptyCollection()][object[]]$UseCaseMap,
        [Parameter(Mandatory)][object[]]$Rows,
        [AllowEmptyCollection()][object[]]$ServiceRecords = @(),
        [Parameter(Mandatory)][string]$Vintage,
        $Policy = (Get-NpiDriftPolicy)
    )
    $f = [Collections.Generic.List[object]]::new()
    $live = @('Deployed', 'Pilot')
    $cur = [ordered]@{}; foreach ($u in $Current) { if ("$($u.id)".Trim()) { $cur["$($u.id)".Trim()] = $u } }
    $pri = [ordered]@{}; foreach ($u in $Prior) { if ("$($u.id)".Trim()) { $pri["$($u.id)".Trim()] = $u } }
    $recordsOf = @{}; foreach ($m in $UseCaseMap) { if (-not $recordsOf.ContainsKey($m.UseCaseId)) { $recordsOf[$m.UseCaseId] = @() }; $recordsOf[$m.UseCaseId] += $m.RecordId }
    $identitiesOf = { param([string]$UseCase) @(foreach ($rec in @($recordsOf[$UseCase])) { $Rows | Where-Object { $_.ServiceManagementReference -and "$($_.ServiceManagementReference)" -eq $rec } }) }
    $changes = [Collections.Generic.List[object]]::new()
    foreach ($id in $cur.Keys) {
        $now = $cur[$id]; $stage = "$($now.development_stage)".Trim()
        $ids = @(& $identitiesOf $id)
        $key = "usecase:$id"
        if (-not $pri.Contains($id)) {
            if ($stage -in $live) {
                $changes.Add([pscustomobject]@{ UseCaseId = $id; Change = 'New'; Stage = $stage; Identities = @($ids | ForEach-Object IdentityId) })
                if (-not $ids.Count) { $f.Add((New-NpiDriftFinding 'NPI-VIN-01' 'Finding' $key $id "New $stage entry in the $Vintage vintage ($($now.classification)) with no identity in the register: issue a governed identity with a sponsor before its next sign-in, or correct the entry")) }
                else { $f.Add((New-NpiDriftFinding 'NPI-VIN-01' 'Info' $key $id "New $stage entry in the $Vintage vintage, matched to $(@($ids | ForEach-Object IdentityId) -join ', ')")) }
            }
            continue
        }
        $was = $pri[$id]
        if ($stage -eq 'Retired' -and "$($was.development_stage)".Trim() -ne 'Retired') {
            $enabled = @($ids | Where-Object { $_.Enabled -ne $false })
            $changes.Add([pscustomobject]@{ UseCaseId = $id; Change = 'Retired'; Stage = $stage; Identities = @($ids | ForEach-Object IdentityId) })
            if ($enabled.Count) { $f.Add((New-NpiDriftFinding 'NPI-VIN-02' 'Finding' $key $id "Retired in the $Vintage vintage, but $(@($enabled | ForEach-Object IdentityId) -join ', ') still enabled: start the leaver process")) }
            continue
        }
        if ("$($was.have_ato)".Trim() -ne "$($now.have_ato)".Trim()) {
            $changes.Add([pscustomobject]@{ UseCaseId = $id; Change = 'AuthorizationChanged'; Stage = $stage; Identities = @($ids | ForEach-Object IdentityId) })
            $f.Add((New-NpiDriftFinding 'NPI-VIN-03' 'Warn' $key $id "Authorization answer changed from '$("$($was.have_ato)".Trim())' to '$("$($now.have_ato)".Trim())': the ISSO re-checks it against the authorization records"))
        }
    }
    foreach ($id in $pri.Keys) {
        if (-not $cur.Contains($id) -and "$($pri[$id].development_stage)".Trim() -ne 'Retired') {
            $changes.Add([pscustomobject]@{ UseCaseId = $id; Change = 'Left'; Stage = "$($pri[$id].development_stage)"; Identities = @(& $identitiesOf $id | ForEach-Object IdentityId) })
            $f.Add((New-NpiDriftFinding 'NPI-VIN-04' 'Finding' "usecase:$id" $id "Left the inventory without being reported as retired: its identities may still hold credentials"))
        }
    }
    $mapped = @{}; foreach ($id in $cur.Keys) { foreach ($rec in @($recordsOf[$id])) { if ($rec) { $mapped[$rec] = $true } } }
    $aiRecords = @{}; foreach ($s in $ServiceRecords) { if ("$($s.IsAI)" -eq 'true') { $aiRecords["$($s.RecordId)"] = $true } }
    foreach ($r in @($Rows | Where-Object { $_.Type -in @($Policy.agentTypes) -or ($_.ServiceManagementReference -and $aiRecords.ContainsKey("$($_.ServiceManagementReference)")) })) {
        $rec = "$($r.ServiceManagementReference)"
        if (-not $rec -or -not $mapped.ContainsKey($rec)) {
            $f.Add((New-NpiDriftFinding 'NPI-VIN-05' 'Warn' $r.IdentityId "$($r.Name) ($($r.Type))" "An AI identity whose record ($(if ($rec) { $rec } else { 'none' })) maps to no use case in the $Vintage vintage: report it, or retire it"))
        }
    }
    [pscustomobject]@{ Findings = $f.ToArray(); Changes = $changes.ToArray() }
}

# ----------------------------------------------------------------------------- writing the run

function Write-NpiDriftJson {
    param([string]$Path, $Value)
    # LF on every platform: ConvertTo-Json uses the platform newline.
    [IO.File]::WriteAllText($Path, (ConvertTo-Json -InputObject $Value -Depth 20).Replace("`r`n", "`n") + "`n", [Text.UTF8Encoding]::new($false))
}

function Export-NpiDriftTask {
    <#
    .SYNOPSIS
        Write one task folder of this chapter (drift or vintage): its files and a manifest in the
        shape Chapters 01 and 02 write (task, mode, cloud, tenant, permissions, every request sent,
        a SHA-256 per file), plus -Extra.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$Task,
        [Parameter(Mandatory)][System.Collections.IDictionary]$Files,
        [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][string]$TenantId,
        [string]$AsOf,
        [object[]]$Evidence = @(),
        [string]$Mode = 'Fixture',
        [System.Collections.IDictionary]$Extra = @{}
    )
    $OutputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $hashes = [ordered]@{}
    foreach ($name in @($Files.Keys | Sort-Object)) {
        $p = Join-Path $OutputPath $name
        Write-NpiDriftJson -Path $p -Value $Files[$name]
        $hashes[$name] = Get-NpiFileHash -Path $p
    }
    $perm = if ($Task -eq 'drift') { Get-NpiDriftPermission -Task drift } else { [pscustomobject]@{ GraphPermissions = @(); AzureRoles = @(); AdRights = @() } }
    $manifest = [ordered]@{
        task = $Task; mode = $Mode; cloud = $Cloud; tenantId = $TenantId; asOf = $AsOf
        generated = [DateTime]::UtcNow.ToString('o')
        graphPermissions = $perm.GraphPermissions; azureRoles = $perm.AzureRoles; adRights = $perm.AdRights
        requests = @($Evidence | ForEach-Object { [ordered]@{ call = $_.Call; method = $_.Method; target = $_.Target; at = $_.At } })
        files = $hashes
    }
    foreach ($k in $Extra.Keys) { $manifest[$k] = $Extra[$k] }
    Write-NpiDriftJson -Path (Join-Path $OutputPath 'manifest.json') -Value $manifest
    Get-Item -LiteralPath (Join-Path $OutputPath 'manifest.json')
}

function Get-NpiRunId {
    <# A sortable run ID from the as-of time and the mode, for example 2026-10-30T0600Z-fixture. #>
    param([Parameter(Mandatory)][datetime]$AsOf, [Parameter(Mandatory)][string]$Mode)
    "$($AsOf.ToUniversalTime().ToString('yyyy-MM-ddTHHmm'))Z-$($Mode.ToLowerInvariant())"
}

function Write-NpiRunIndex {
    <#
    .SYNOPSIS
        run.json: the run's ID, as-of time, cloud, tenant, mode, audit window, approved baseline, the
        permissions, and each task's status (OK or Error, with the message) with the SHA-256 of its
        manifest. A task that failed has no folder: its findings are unverified, never resolved.
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
        [Parameter(Mandatory)][System.Collections.IDictionary]$Tasks,
        $Baseline
    )
    $taskRows = [ordered]@{}
    foreach ($name in $Tasks.Keys) {
        $t = $Tasks[$name]
        $row = [ordered]@{ folder = $t.Folder; status = $t.Status }
        if ($t.Status -eq 'OK') { $row.manifestSha256 = Get-NpiFileHash -Path (Join-Path $RunPath "$($t.Folder)/manifest.json") }
        else { $row.message = $t.Message }
        $taskRows[$name] = $row
    }
    $perm = Get-NpiDriftPermission -Task drift-run
    $index = [ordered]@{
        schema      = $script:RunSchema
        runId       = $RunId
        asOf        = $AsOf.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
        cloud       = $Cloud
        tenantId    = $TenantId
        mode        = $Mode
        readOnly    = $true
        auditWindow = [ordered]@{ since = $Since.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'); until = $Until.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ') }
        baseline    = if ($Baseline) { [ordered]@{ runId = $Baseline.runId; sha256 = $Baseline['_sha256'] } } else { $null }
        permissions = [ordered]@{ graphPermissions = $perm.GraphPermissions; azureRoles = $perm.AzureRoles; adRights = $perm.AdRights }
        tasks       = $taskRows
    }
    Write-NpiDriftJson -Path (Join-Path $RunPath 'run.json') -Value $index
    $index
}

Export-ModuleMember -Function Get-NpiDriftCallList, Get-NpiDriftPolicy, Get-NpiDriftPermission, New-NpiDriftReader, ConvertTo-NpiUtc, New-NpiDriftFixtureInvoker,
    Invoke-NpiDriftFake, ConvertTo-NpiActivityName, Get-NpiKeyDescription, ConvertTo-NpiAuditEvent, Get-NpiAuditEvent, Get-NpiSignInActivity, Get-NpiFingerprint, New-NpiDriftFinding,
    Get-NpiRowFingerprint, New-NpiDriftBaseline, Import-NpiDriftBaseline, Read-NpiContractFile, Import-NpiContract, Test-NpiRegisterDrift, Test-NpiReviewCycle,
    Compare-NpiAiVintage, Export-NpiDriftTask, Write-NpiDriftJson, Get-NpiRunId, Write-NpiRunIndex
