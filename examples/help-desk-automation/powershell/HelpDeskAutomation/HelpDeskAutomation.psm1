#Requires -Version 7.1
# Help desk automation: a typed change to a user, planned and then applied only with the approved plan's
# hash, and a read-only review of pending admin consent requests. Book 15, Chapter 12, tasks 3 and 5.
# Every Graph call is declared in config/calls.json; Invoke-HtGraph refuses any other.
Set-StrictMode -Version Latest

$script:Root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$script:GraphBase = 'https://graph.microsoft.com'

function Get-HtConfig {
    <#
    .SYNOPSIS
        Reads one of the pack's configuration files (typed-changes, consent-review, calls, requirements).
    .EXAMPLE
        (Get-HtConfig typed-changes).changes.id
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][ValidateSet('typed-changes', 'consent-review', 'calls', 'requirements', 'sync-check', 'role-register', 'log-forwarding')][string]$Name,
          [string]$Path)
    $file = if ($Path) { $Path } else { Join-Path $script:Root "config/$Name.json" }
    Get-Content -LiteralPath $file -Raw | ConvertFrom-Json -AsHashtable
}

function Get-HtRequiredPermission {
    <#
    .SYNOPSIS
        Lists the Microsoft Graph permissions a task needs, from config/calls.json.
    .EXAMPLE
        (Get-HtRequiredPermission -Task consent-requests).GraphPermissions
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][ValidateSet('typed-change-plan', 'typed-change-apply', 'consent-requests', 'sync-check', 'role-review', 'log-forwarding-check')][string]$Task)
    $t = (Get-HtConfig calls).tasks[$Task]
    [pscustomobject]@{ Task = $Task; Mode = $t.mode; GraphPermissions = @($t.graphPermissions); AzureRoles = @($t.azureRoles) }
}

function Get-HtSha256 {
    <#
    .SYNOPSIS
        The SHA-256 of a file, hashed with LF line endings so a hash approved on one platform matches on another.
    .EXAMPLE
        Get-HtSha256 out/plan/REQ-2026-0501/plan.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $text = (Get-Content -LiteralPath $Path -Raw) -replace "`r`n", "`n"
    $bytes = [Text.Encoding]::UTF8.GetBytes($text)
    -join ([Security.Cryptography.SHA256]::HashData($bytes) | ForEach-Object { $_.ToString('x2') })
}

function Write-HtJson([object]$Value, [string]$Path) {
    $dir = Split-Path -Parent $Path
    if ($dir) { New-Item -ItemType Directory -Force $dir | Out-Null }
    [IO.File]::WriteAllText($Path, (($Value | ConvertTo-Json -Depth 8) -replace "`r`n", "`n") + "`n")
}

function Invoke-HtGraph {
    # The one way the module reaches Graph: the call must be declared for the task in config/calls.json.
    # With a fixture store, the call is answered from it instead (Lab 1, no tenant).
    param([Parameter(Mandatory)][string]$Task, [Parameter(Mandatory)][string]$CallId, [Parameter(Mandatory)][string]$Method,
          [Parameter(Mandatory)][string]$Uri, [hashtable]$Body, [hashtable]$Fixture)
    $call = (Get-HtConfig calls).calls | Where-Object { $_.id -eq $CallId }
    if (-not $call -or $Task -notin $call.tasks -or $call.method -ne $Method) {
        throw "Graph call '$CallId' ($Method) isn't declared for task '$Task' in config/calls.json."
    }
    if ($Fixture) { return & $Fixture.Answer $CallId $Uri $Body }
    if ($call.api -eq 'arm') {
        $r = Invoke-AzRestMethod -Method $Method -Path "$Uri?api-version=2022-10-01" -Payload ($Body | ConvertTo-Json -Depth 5)
        return ($r.Content | ConvertFrom-Json -AsHashtable)
    }
    if ($call.api -eq 'loganalytics') {
        $ws = ($Uri -split '/')[3]
        $rows = (Invoke-AzOperationalInsightsQuery -WorkspaceId $ws -Query $Body.query).Results
        return @{ rows = @($rows | ForEach-Object { $h = @{}; foreach ($pr in $_.PSObject.Properties) { $h[$pr.Name] = $pr.Value }; $h }) }
    }
    if (-not (Get-Command Invoke-MgGraphRequest -ErrorAction SilentlyContinue)) {
        throw 'Microsoft.Graph.Authentication is needed: Connect-MgGraph first, with the permissions Get-HtRequiredPermission lists.'
    }
    $params = @{ Method = $Method; Uri = "$script:GraphBase/v1.0$Uri"; OutputType = 'Hashtable' }
    if ($Uri -match '\$count=true') { $params.Headers = @{ ConsistencyLevel = 'eventual' } }
    if ($Body) { $params.Body = ($Body | ConvertTo-Json -Depth 5); $params.ContentType = 'application/json' }
    Invoke-MgGraphRequest @params
}

function New-HtFixtureStore {
    <#
    .SYNOPSIS
        Loads the fictional tenant in a fixture folder (users.json, consent-requests.json), so the pack runs with no tenant.
    .EXAMPLE
        $f = New-HtFixtureStore -Path tests/fixtures
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $users = @{}
    $usersFile = Join-Path $Path 'users.json'
    if (Test-Path $usersFile) { foreach ($u in (Get-Content $usersFile -Raw | ConvertFrom-Json -AsHashtable)) { $users[$u.id] = $u; $users[$u.userPrincipalName] = $u } }
    $consentFile = Join-Path $Path 'consent-requests.json'
    $consent = if (Test-Path $consentFile) { Get-Content $consentFile -Raw | ConvertFrom-Json -AsHashtable } else { @{ appConsentRequests = @(); userConsentRequests = @{} } }
    $extra = @{}
    foreach ($n in 'organization', 'provisioning-errors', 'health', 'roles', 'arc', 'law') {
        $f = Join-Path $Path "$n.json"
        if (Test-Path $f) { $extra[$n] = Get-Content $f -Raw | ConvertFrom-Json -AsHashtable }
    }
    $store = @{ Users = $users; Consent = $consent; Extra = $extra }
    $store.Answer = {
        param($CallId, $Uri, $Body)
        switch ($CallId) {
            'user-get' {
                $segment = (($Uri -split '/')[2]) -replace '\?.*$', ''
                $key = [uri]::UnescapeDataString($segment)
                if (-not $store.Users.ContainsKey($key)) { throw "404: no user '$key' in the fixtures" }
                return $store.Users[$key]
            }
            'user-update' {
                $key = ($Uri -split '/')[2]
                $u = $store.Users[$key]
                foreach ($k in $Body.Keys) {
                    if ($k -eq 'onPremisesExtensionAttributes') { foreach ($e in $Body[$k].Keys) { $u[$k][$e] = $Body[$k][$e] } } else { $u[$k] = $Body[$k] }
                }
                return $null
            }
            'consent-requests-list' { return @{ value = @($store.Consent.appConsentRequests) } }
            'user-consent-requests-list' {
                $id = ($Uri -split '/')[4]
                return @{ value = @($store.Consent.userConsentRequests[$id]) }
            }
            'organization-get' { return @{ value = @($store.Extra['organization']) } }
            'users-provisioning-errors' { $v = @($store.Extra['provisioning-errors']); return @{ value = $v; '@odata.count' = $v.Count } }
            'health-overviews' { return @{ value = @($store.Extra['health']) } }
            'directory-role-definitions' { return @{ value = @($store.Extra['roles'].directoryDefinitions) } }
            'directory-role-assignments' {
                $def = [regex]::Match([uri]::UnescapeDataString($Uri), "roleDefinitionId eq '([^']+)'").Groups[1].Value
                return @{ value = @($store.Extra['roles'].directoryAssignments | Where-Object { $_.roleDefinitionId -eq $def }) }
            }
            'intune-role-definitions' { return @{ value = @($store.Extra['roles'].intuneDefinitions) } }
            'arg-dcr-associations' { return @{ data = @($store.Extra['arc']) } }
            'law-query' { return @{ rows = @($store.Extra['law']) } }
        }
    }.GetNewClosure()
    $store
}

function Get-HtCurrentValue([hashtable]$User, [hashtable]$Change) {
    if ($Change.ContainsKey('extension')) {
        $ext = $User['onPremisesExtensionAttributes']
        if ($ext -and $ext.ContainsKey($Change.extension)) { return [string]$ext[$Change.extension] }
        return ''
    }
    if ($User.ContainsKey($Change.property) -and $null -ne $User[$Change.property]) { return [string]$User[$Change.property] }
    ''
}

function New-HtTypedChangePlan {
    <#
    .SYNOPSIS
        Plans one typed change to a user: checks the request, reads the user and writes plan.json with its SHA-256. Changes nothing.
    .DESCRIPTION
        The request supplies only a change id from config/typed-changes.json, a user and a value. The plan
        records the value before and after; the approver approves the plan's SHA-256, and
        Invoke-HtTypedChange applies only a plan with that hash. Checks: HT-01 unknown change, HT-02 a user
        synchronized from on-premises (the change belongs at the source), HT-03 a value the change doesn't
        accept, HT-04 a disabled or missing user, HT-05 nothing to change, HT-06 a request id that isn't a
        ticket number.
    .EXAMPLE
        New-HtTypedChangePlan -RequestId REQ-2026-0501 -User avery.lane@contoso.example -ChangeId set-records-flag -Value RetainAll -OutputPath out/plan -FixturePath tests/fixtures
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$RequestId, [Parameter(Mandatory)][string]$User, [Parameter(Mandatory)][string]$ChangeId,
          [Parameter(Mandatory)][AllowEmptyString()][string]$Value, [Parameter(Mandatory)][string]$OutputPath,
          [string]$FixturePath, [string]$ChangesPath, [datetime]$AsOf = (Get-Date).ToUniversalTime())
    $fixture = if ($FixturePath) { New-HtFixtureStore -Path $FixturePath } else { $null }
    $changes = (Get-HtConfig typed-changes -Path $ChangesPath).changes
    $findings = [Collections.Generic.List[object]]::new()
    function Add-Finding($Rule, $Issue) { $findings.Add([pscustomobject]@{ RequestId = $RequestId; Rule = $Rule; Severity = 'Finding'; Issue = $Issue }) }

    if ($RequestId -notmatch '^[A-Z]{2,6}-\d{4}-\d{3,7}$') { Add-Finding 'HT-06' "Request id '$RequestId' isn't a ticket number (for example REQ-2026-0501)" }
    $change = $changes | Where-Object { $_.id -eq $ChangeId }
    if (-not $change) { Add-Finding 'HT-01' "No typed change '$ChangeId' in config/typed-changes.json; only those may run" }
    $u = $null
    try {
        $select = 'id,userPrincipalName,accountEnabled,onPremisesSyncEnabled,department,jobTitle,officeLocation,employeeType,onPremisesExtensionAttributes'
        $u = Invoke-HtGraph -Task typed-change-plan -CallId user-get -Method GET -Uri "/users/$([uri]::EscapeDataString($User))?`$select=$select" -Fixture $fixture
    } catch { Add-Finding 'HT-04' "User '$User' wasn't found: $($_.Exception.Message)" }
    if ($u) {
        if (-not $u.accountEnabled) { Add-Finding 'HT-04' "User '$User' is disabled; a disabled account goes to the security office, not a change" }
        if ($u.onPremisesSyncEnabled) { Add-Finding 'HT-02' "User '$User' is synchronized from on-premises; change it at the source (the on-premises directory or the HR record)" }
    }
    if ($change) {
        if ($change.ContainsKey('allowed') -and $Value -notin $change.allowed) { Add-Finding 'HT-03' "'$Value' isn't one of: $($change.allowed -join ', ')" }
        elseif ($change.ContainsKey('pattern') -and $Value -notmatch $change.pattern) { Add-Finding 'HT-03' "'$Value' doesn't match the pattern for $ChangeId" }
    }
    $before = if ($u -and $change) { Get-HtCurrentValue $u $change } else { $null }
    if ($u -and $change -and $before -ceq $Value) { Add-Finding 'HT-05' "The user already has that value; nothing to change" }

    $dir = Join-Path $OutputPath $RequestId
    New-Item -ItemType Directory -Force $dir | Out-Null
    Write-HtJson @($findings) (Join-Path $dir 'findings.json')
    if ($findings.Count) {
        $findings | ForEach-Object { Write-Warning "$($_.Rule): $($_.Issue)" }
        return [pscustomobject]@{ RequestId = $RequestId; Ready = $false; Findings = $findings.Count; PlanPath = $null; PlanSha256 = $null }
    }
    $req = (Get-HtConfig requirements).steps['typed-change-apply']
    $plan = [ordered]@{
        requestId = $RequestId; changeId = $ChangeId; userId = $u.id; userPrincipalName = $u.userPrincipalName
        property = $change.property; extension = $(if ($change.ContainsKey('extension')) { $change.extension } else { $null })
        before = $before; after = $Value; plannedUtc = $AsOf.ToString('yyyy-MM-ddTHH:mm:ssZ')
        controls = $req.controls; ksis = $req.ksis
        note = 'Applies only with this file''s SHA-256 as -ApprovedPlanSha256, and only if the value is still the one recorded in before.'
    }
    $planPath = Join-Path $dir 'plan.json'
    Write-HtJson $plan $planPath
    $sha = Get-HtSha256 $planPath
    [IO.File]::WriteAllText((Join-Path $dir 'plan.sha256'), "$sha  plan.json`n")
    [pscustomobject]@{ RequestId = $RequestId; Ready = $true; Findings = 0; PlanPath = $planPath; PlanSha256 = $sha }
}

function Invoke-HtTypedChange {
    <#
    .SYNOPSIS
        Applies an approved typed-change plan: a dry run unless -Apply, and only with the plan's approved SHA-256.
    .DESCRIPTION
        Re-reads the user and refuses when the value is no longer the plan's "before" (HT-07, someone changed
        it since), when the hash doesn't match (HT-08), or when the plan names a change the configuration no
        longer allows (HT-01). With -Apply it sends one PATCH, re-reads the user and records the value before
        and after in evidence.json with the plan's hash, the controls and the KSIs.
    .EXAMPLE
        Invoke-HtTypedChange -PlanPath out/plan/REQ-2026-0501/plan.json -ApprovedPlanSha256 $sha -OutputPath out/apply -FixturePath tests/fixtures
    .EXAMPLE
        Invoke-HtTypedChange -PlanPath out/plan/REQ-2026-0501/plan.json -ApprovedPlanSha256 $sha -OutputPath out/apply -Apply
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$PlanPath, [Parameter(Mandatory)][string]$ApprovedPlanSha256,
          [Parameter(Mandatory)][string]$OutputPath, [switch]$Apply, [string]$FixturePath, [string]$ChangesPath,
          [datetime]$AsOf = (Get-Date).ToUniversalTime())
    $fixture = if ($FixturePath) { New-HtFixtureStore -Path $FixturePath } else { $null }
    $sha = Get-HtSha256 $PlanPath
    if ($sha -ne $ApprovedPlanSha256.ToLowerInvariant()) { throw "HT-08: the plan's SHA-256 is $sha, not the approved $ApprovedPlanSha256. Nothing was changed." }
    $plan = Get-Content -LiteralPath $PlanPath -Raw | ConvertFrom-Json -AsHashtable
    $change = (Get-HtConfig typed-changes -Path $ChangesPath).changes | Where-Object { $_.id -eq $plan.changeId }
    if (-not $change) { throw "HT-01: '$($plan.changeId)' is no longer a typed change in config/typed-changes.json. Nothing was changed." }
    $select = 'id,userPrincipalName,accountEnabled,onPremisesSyncEnabled,department,jobTitle,officeLocation,employeeType,onPremisesExtensionAttributes'
    $u = Invoke-HtGraph -Task typed-change-apply -CallId user-get -Method GET -Uri "/users/$($plan.userId)?`$select=$select" -Fixture $fixture
    $now = Get-HtCurrentValue $u $change
    if ($now -cne [string]$plan.before) { throw "HT-07: the value is now '$now', not the plan's '$($plan.before)'. Plan again. Nothing was changed." }
    if ($u.onPremisesSyncEnabled) { throw "HT-02: the user is now synchronized from on-premises. Nothing was changed." }

    $body = if ($plan.extension) { @{ onPremisesExtensionAttributes = @{ $plan.extension = $(if ($plan.after -eq '') { $null } else { $plan.after }) } } } else { @{ $plan.property = $plan.after } }
    $after = $now
    if ($Apply) {
        Invoke-HtGraph -Task typed-change-apply -CallId user-update -Method PATCH -Uri "/users/$($plan.userId)" -Body $body -Fixture $fixture | Out-Null
        $u2 = Invoke-HtGraph -Task typed-change-apply -CallId user-get -Method GET -Uri "/users/$($plan.userId)?`$select=$select" -Fixture $fixture
        $after = Get-HtCurrentValue $u2 $change
    }
    $evidence = [ordered]@{
        requestId = $plan.requestId; mode = $(if ($Apply) { 'apply' } else { 'dry-run' }); planSha256 = $sha
        userId = $plan.userId; changeId = $plan.changeId; before = $now; requested = $plan.after; after = $after
        verified = [bool]($Apply -and $after -ceq [string]$plan.after); body = $body
        runUtc = $AsOf.ToString('yyyy-MM-ddTHH:mm:ssZ'); controls = $plan.controls; ksis = $plan.ksis
    }
    $path = Join-Path $OutputPath $plan.requestId 'evidence.json'
    Write-HtJson $evidence $path
    [pscustomobject]@{ RequestId = $plan.requestId; Mode = $evidence.mode; Before = $now; After = $after; Verified = $evidence.verified; EvidenceSha256 = (Get-HtSha256 $path) }
}

function Test-HtScopeIsBroad([string]$Scope, [string[]]$Patterns) {
    foreach ($p in $Patterns) { if ($Scope -like $p) { return $true } }
    $false
}

function Get-HtPendingConsentRequest {
    <#
    .SYNOPSIS
        Reads the pending admin consent requests and writes a register with findings. Read only; the verdict stays with a person.
    .DESCRIPTION
        Lists the app consent requests that have a user request still in progress, and each one's user requests.
        Writes register.json and register.csv (one row per application: its permissions, how many people asked,
        the oldest request and its age), findings.json (HT-CR-01 a request older than maxAgeDays; HT-CR-02, a
        warning, a requested permission broad enough that the identity governance approver must decide it) and
        manifest.json with the SHA-256 of each file, the controls and the KSIs.
    .EXAMPLE
        Get-HtPendingConsentRequest -OutputPath out/consent -FixturePath tests/fixtures -AsOf 2026-11-27
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$OutputPath, [string]$FixturePath, [string]$ReviewPath,
          [datetime]$AsOf = (Get-Date).ToUniversalTime())
    $fixture = if ($FixturePath) { New-HtFixtureStore -Path $FixturePath } else { $null }
    $cfg = Get-HtConfig consent-review -Path $ReviewPath
    $filter = [uri]::EscapeDataString("userConsentRequests/any (u:u/status eq 'InProgress')")
    $apps = @((Invoke-HtGraph -Task consent-requests -CallId consent-requests-list -Method GET -Uri "/identityGovernance/appConsent/appConsentRequests?`$filter=$filter" -Fixture $fixture).value)
    $rows = [Collections.Generic.List[object]]::new()
    $findings = [Collections.Generic.List[object]]::new()
    foreach ($a in $apps) {
        $userFilter = [uri]::EscapeDataString("status eq 'InProgress'")
        $reqs = @((Invoke-HtGraph -Task consent-requests -CallId user-consent-requests-list -Method GET -Uri "/identityGovernance/appConsent/appConsentRequests/$($a.id)/userConsentRequests?`$filter=$userFilter" -Fixture $fixture).value |
            Where-Object { $_.status -eq 'InProgress' })
        if (-not $reqs) { continue }
        $oldest = ($reqs | ForEach-Object { [datetime]::Parse($_.createdDateTime, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal) } | Sort-Object | Select-Object -First 1)
        $age = [int][math]::Floor(($AsOf.ToUniversalTime() - $oldest).TotalDays)
        $scopes = @($a.pendingScopes | ForEach-Object { $_.displayName })
        $broad = @($scopes | Where-Object { Test-HtScopeIsBroad $_ $cfg.broadScopes })
        $rows.Add([pscustomobject]@{
            AppId = $a.appId; Application = $a.appDisplayName; Permissions = ($scopes -join ' '); Requesters = $reqs.Count
            OldestUtc = $oldest.ToString('yyyy-MM-ddTHH:mm:ssZ'); AgeDays = $age; Broad = ($broad -join ' ')
        })
        if ($age -gt $cfg.maxAgeDays) { $findings.Add([pscustomobject]@{ Rule = 'HT-CR-01'; Severity = 'Finding'; AppId = $a.appId; Issue = "Waiting $age days, more than $($cfg.maxAgeDays): decide it or decline it" }) }
        if ($broad) { $findings.Add([pscustomobject]@{ Rule = 'HT-CR-02'; Severity = 'Warn'; AppId = $a.appId; Issue = "Broad permissions requested ($($broad -join ', ')): the identity governance approver decides, after the service's authorization is recorded" }) }
    }
    New-Item -ItemType Directory -Force $OutputPath | Out-Null
    Write-HtJson @($rows) (Join-Path $OutputPath 'register.json')
    $csv = Join-Path $OutputPath 'register.csv'
    if ($rows.Count) { $rows | Export-Csv -LiteralPath $csv -NoTypeInformation -UseQuotes AsNeeded } else { [IO.File]::WriteAllText($csv, "AppId,Application,Permissions,Requesters,OldestUtc,AgeDays,Broad`n") }
    Write-HtJson @($findings) (Join-Path $OutputPath 'findings.json')
    $req = (Get-HtConfig requirements).steps['consent-requests']
    $files = foreach ($f in 'register.json', 'register.csv', 'findings.json') { [ordered]@{ path = $f; sha256 = Get-HtSha256 (Join-Path $OutputPath $f) } }
    Write-HtJson ([ordered]@{ step = 'consent-requests'; mode = 'read'; asOfUtc = $AsOf.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'); controls = $req.controls; ksis = $req.ksis; files = @($files) }) (Join-Path $OutputPath 'manifest.json')
    [pscustomobject]@{ Pending = $rows.Count; Findings = @($findings | Where-Object Severity -eq 'Finding').Count; Warnings = @($findings | Where-Object Severity -eq 'Warn').Count; OutputPath = $OutputPath }
}


function Write-HtRun([string]$Step, [string]$OutputPath, [hashtable]$Files, [datetime]$AsOf) {
    # Each scheduled job writes its files, then manifest.json with each file's SHA-256, the controls and the KSIs.
    New-Item -ItemType Directory -Force $OutputPath | Out-Null
    foreach ($name in $Files.Keys) {
        $path = Join-Path $OutputPath $name
        if ($name -like '*.md') { [IO.File]::WriteAllText($path, (($Files[$name] -join "`n") + "`n")) } else { Write-HtJson $Files[$name] $path }
    }
    $req = (Get-HtConfig requirements).steps[$Step]
    $list = foreach ($name in ($Files.Keys | Sort-Object)) { [ordered]@{ path = $name; sha256 = Get-HtSha256 (Join-Path $OutputPath $name) } }
    Write-HtJson ([ordered]@{ step = $Step; mode = 'read'; asOfUtc = $AsOf.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'); controls = $req.controls; ksis = $req.ksis; files = @($list) }) (Join-Path $OutputPath 'manifest.json')
}

function Invoke-HtSyncCheck {
    <#
    .SYNOPSIS
        The morning synchronization check, run as a scheduled read-only job: last sync, provisioning errors and service health, with what changed since the last run.
    .DESCRIPTION
        Replaces the interactive morning logon to the synchronization servers (Book 15, Chapter 12, task 6).
        Reads the tenant's last synchronization time, the users with a provisioning error and the Microsoft 365
        service health, and writes status.json, findings.json, report.md and manifest.json. HT-SY-01: no
        synchronization for more than lateMinutes; HT-SY-02: users with a provisioning error (object ids only);
        HT-SY-03: a service whose status is in notOperational. With -PreviousPath (the last run's folder), the
        report marks what changed, a computed difference rather than bold text. Each finding becomes a ticket.
    .EXAMPLE
        Invoke-HtSyncCheck -OutputPath out/sync/day2 -FixturePath tests/fixtures -PreviousPath tests/fixtures/previous-sync -AsOf 2026-11-27T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$OutputPath, [string]$FixturePath, [string]$PreviousPath, [string]$SettingsPath,
          [datetime]$AsOf = (Get-Date).ToUniversalTime())
    $fixture = if ($FixturePath) { New-HtFixtureStore -Path $FixturePath } else { $null }
    $cfg = Get-HtConfig sync-check -Path $SettingsPath
    $org = @((Invoke-HtGraph -Task sync-check -CallId organization-get -Method GET -Uri '/organization?$select=id,onPremisesSyncEnabled,onPremisesLastSyncDateTime' -Fixture $fixture).value)[0]
    $filter = [uri]::EscapeDataString("onPremisesProvisioningErrors/any(o:o/category eq 'PropertyConflict')")
    $errs = Invoke-HtGraph -Task sync-check -CallId users-provisioning-errors -Method GET -Uri "/users?`$filter=$filter&`$count=true&`$select=id,onPremisesProvisioningErrors" -Fixture $fixture
    $health = @((Invoke-HtGraph -Task sync-check -CallId health-overviews -Method GET -Uri '/admin/serviceAnnouncement/healthOverviews?$expand=issues' -Fixture $fixture).value)
    $last = if ($org.onPremisesLastSyncDateTime) { [datetime]::Parse([string]$org.onPremisesLastSyncDateTime, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal) } else { $null }
    $age = if ($last) { [int]($AsOf.ToUniversalTime() - $last).TotalMinutes } else { $null }
    $errIds = @($errs.value | ForEach-Object { $_.id } | Sort-Object)
    $services = @($health | Where-Object { -not $cfg.services -or $_.service -in $cfg.services } | Sort-Object service)
    $down = @($services | Where-Object { $_.status -in $cfg.notOperational })
    $findings = [Collections.Generic.List[object]]::new()
    if ($org.onPremisesSyncEnabled -and ($null -eq $age -or $age -gt $cfg.lateMinutes)) { $findings.Add([pscustomobject]@{ Rule = 'HT-SY-01'; Severity = 'Finding'; Object = $org.id; Issue = "No synchronization for $age minutes (limit $($cfg.lateMinutes))" }) }
    foreach ($id in $errIds) { $findings.Add([pscustomobject]@{ Rule = 'HT-SY-02'; Severity = 'Finding'; Object = $id; Issue = 'A provisioning error (PropertyConflict) on this user' }) }
    foreach ($s in $down) { $findings.Add([pscustomobject]@{ Rule = 'HT-SY-03'; Severity = 'Finding'; Object = $s.service; Issue = "Service status $($s.status)" }) }
    $status = [ordered]@{ syncEnabled = [bool]$org.onPremisesSyncEnabled; lastSyncUtc = $(if ($last) { $last.ToString('yyyy-MM-ddTHH:mm:ssZ') } else { $null }); ageMinutes = $age
                          provisioningErrors = $errIds.Count; errorObjects = $errIds; services = @($services | ForEach-Object { [ordered]@{ service = $_.service; status = $_.status } }) }
    $prev = if ($PreviousPath -and (Test-Path (Join-Path $PreviousPath 'status.json'))) { Get-Content (Join-Path $PreviousPath 'status.json') -Raw | ConvertFrom-Json -AsHashtable } else { $null }
    $changes = [Collections.Generic.List[string]]::new()
    if ($prev) {
        if ($prev.provisioningErrors -ne $status.provisioningErrors) { $changes.Add("Provisioning errors: $($prev.provisioningErrors) -> $($status.provisioningErrors)") }
        $new = @($errIds | Where-Object { $_ -notin @($prev.errorObjects) }); if ($new) { $changes.Add("New error objects: $($new -join ', ')") }
        $fixed = @(@($prev.errorObjects) | Where-Object { $_ -notin $errIds }); if ($fixed) { $changes.Add("Cleared since the last run: $($fixed -join ', ')") }
        $was = @{}; foreach ($s in @($prev.services)) { $was[$s.service] = $s.status }
        foreach ($s in $status.services) { if ($was.ContainsKey($s.service) -and $was[$s.service] -ne $s.status) { $changes.Add("$($s.service): $($was[$s.service]) -> $($s.status)") } }
    }
    $report = @("# Morning synchronization report, $($AsOf.ToUniversalTime().ToString('yyyy-MM-dd'))", '',
        "- Last synchronization: $($status.lastSyncUtc) ($age minutes ago)",
        "- Provisioning errors: $($status.provisioningErrors)",
        "- Services not operational: $(if ($down) { ($down | ForEach-Object { "$($_.service) ($($_.status))" }) -join '; ' } else { 'none' })", '',
        '## Changed since the last run', '')
    $report += $(if (-not $prev) { '- No previous run to compare with.' } elseif ($changes.Count) { $changes | ForEach-Object { "- $_" } } else { '- Nothing changed.' })
    $report += @('', '## Findings (each becomes a ticket)', '')
    $report += $(if ($findings.Count) { $findings | ForEach-Object { "- $($_.Rule) $($_.Object): $($_.Issue)" } } else { '- None.' })
    Write-HtRun -Step sync-check -OutputPath $OutputPath -AsOf $AsOf -Files @{ 'status.json' = $status; 'findings.json' = @($findings); 'report.md' = $report }
    [pscustomobject]@{ LastSyncAgeMinutes = $age; ProvisioningErrors = $errIds.Count; ServicesDown = $down.Count; Findings = $findings.Count; Changed = $changes.Count; OutputPath = $OutputPath }
}

function Invoke-HtRoleReview {
    <#
    .SYNOPSIS
        Compares the tenant's custom roles (directory and Intune) with the approved role register, as a scheduled read-only job.
    .DESCRIPTION
        Book 15, Chapter 12, task 8: each custom role is a governed record. Reads the custom directory role
        definitions and their assignments and the custom Intune role definitions, and compares them with
        config/role-register.json. HT-RR-01 a custom role not in the register; HT-RR-02 permissions that differ
        from the register's; HT-RR-03 a review older than reviewEveryDays; HT-RR-04 (a warning) a directory role
        assigned to a person directly rather than through its group. Writes roles.json, findings.json and manifest.json.
    .EXAMPLE
        Invoke-HtRoleReview -OutputPath out/roles -FixturePath tests/fixtures -AsOf 2026-11-27
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$OutputPath, [string]$FixturePath, [string]$RegisterPath, [datetime]$AsOf = (Get-Date).ToUniversalTime())
    $fixture = if ($FixturePath) { New-HtFixtureStore -Path $FixturePath } else { $null }
    $register = Get-HtConfig role-register -Path $RegisterPath
    $found = [Collections.Generic.List[object]]::new()
    $dir = @((Invoke-HtGraph -Task role-review -CallId directory-role-definitions -Method GET -Uri "/roleManagement/directory/roleDefinitions?`$filter=$([uri]::EscapeDataString('isBuiltIn eq false'))" -Fixture $fixture).value)
    foreach ($d in $dir) {
        $assign = @((Invoke-HtGraph -Task role-review -CallId directory-role-assignments -Method GET -Uri "/roleManagement/directory/roleAssignments?`$filter=$([uri]::EscapeDataString("roleDefinitionId eq '$($d.id)'"))&`$expand=principal" -Fixture $fixture).value)
        $perms = @($d.rolePermissions | ForEach-Object { $_.allowedResourceActions } | Sort-Object -Unique)
        $found.Add([pscustomobject]@{ Provider = 'directory'; Id = $d.id; DisplayName = $d.displayName; Permissions = $perms
            Assignees = @($assign | ForEach-Object { [ordered]@{ principalId = $_.principalId; type = $_.principal.'@odata.type' } }) })
    }
    $intune = @((Invoke-HtGraph -Task role-review -CallId intune-role-definitions -Method GET -Uri '/deviceManagement/roleDefinitions' -Fixture $fixture).value | Where-Object { -not $_.isBuiltIn })
    foreach ($d in $intune) {
        $perms = @($d.rolePermissions | ForEach-Object { $_.resourceActions } | ForEach-Object { $_.allowedResourceActions } | Sort-Object -Unique)
        $found.Add([pscustomobject]@{ Provider = 'intune'; Id = $d.id; DisplayName = $d.displayName; Permissions = $perms; Assignees = @() })
    }
    $findings = [Collections.Generic.List[object]]::new()
    foreach ($r in $found) {
        $entry = $register.roles | Where-Object { $_.provider -eq $r.Provider -and $_.displayName -eq $r.DisplayName }
        if (-not $entry) { $findings.Add([pscustomobject]@{ Rule = 'HT-RR-01'; Severity = 'Finding'; Object = $r.Id; Issue = "Custom $($r.Provider) role '$($r.DisplayName)' isn't in the register" }); continue }
        $want = @($entry.permissions | Sort-Object -Unique)
        $extra = @($r.Permissions | Where-Object { $_ -notin $want }); $missing = @($want | Where-Object { $_ -notin $r.Permissions })
        if ($extra -or $missing) { $findings.Add([pscustomobject]@{ Rule = 'HT-RR-02'; Severity = 'Finding'; Object = $r.Id; Issue = "Permissions differ from the register: added $($extra -join ', '); missing $($missing -join ', ')" }) }
        $reviewed = [datetime]::Parse($entry.lastReviewed, [Globalization.CultureInfo]::InvariantCulture)
        if (($AsOf - $reviewed).TotalDays -gt $register.reviewEveryDays) { $findings.Add([pscustomobject]@{ Rule = 'HT-RR-03'; Severity = 'Finding'; Object = $r.Id; Issue = "Last reviewed $($entry.lastReviewed), more than $($register.reviewEveryDays) days ago" }) }
        foreach ($a in $r.Assignees) { if ($a.type -eq '#microsoft.graph.user') { $findings.Add([pscustomobject]@{ Rule = 'HT-RR-04'; Severity = 'Warn'; Object = $a.principalId; Issue = "Holds '$($r.DisplayName)' directly, not through $($entry.group)" }) } }
    }
    Write-HtRun -Step role-review -OutputPath $OutputPath -AsOf $AsOf -Files @{ 'roles.json' = @($found); 'findings.json' = @($findings) }
    [pscustomobject]@{ CustomRoles = $found.Count; Findings = @($findings | Where-Object Severity -eq 'Finding').Count; Warnings = @($findings | Where-Object Severity -eq 'Warn').Count; OutputPath = $OutputPath }
}

function Test-HtLogForwarding {
    <#
    .SYNOPSIS
        Checks that each listed server forwards its Windows event logs through Azure Monitor Agent: associated with the data collection rule, and recently heard from.
    .DESCRIPTION
        Book 15, Chapter 12, task 7: event logs go to the central log platform, not an administrative share.
        Reads the Arc-enabled machines and their data collection rule associations through Azure Resource Graph
        (Reader), and the newest Event record per computer in the workspace (Log Analytics Reader).
        HT-LF-01 a listed server that isn't an Arc machine; HT-LF-02 one not associated with the rule;
        HT-LF-03 one with no event for more than maxSilenceHours. Writes servers.json, findings.json and manifest.json.
    .EXAMPLE
        Test-HtLogForwarding -OutputPath out/logs -FixturePath tests/fixtures -AsOf 2026-11-27T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$OutputPath, [string]$FixturePath, [string]$SettingsPath, [datetime]$AsOf = (Get-Date).ToUniversalTime())
    $fixture = if ($FixturePath) { New-HtFixtureStore -Path $FixturePath } else { $null }
    $cfg = Get-HtConfig log-forwarding -Path $SettingsPath
    $kql = "resources | where type =~ 'microsoft.hybridcompute/machines' | project machineId = tolower(id), name | join kind=leftouter (insightsresources | where type =~ 'microsoft.insights/datacollectionruleassociations' | extend machineId = tolower(tostring(split(id, '/providers/Microsoft.Insights/')[0])), rule = tostring(properties.dataCollectionRuleId) | project machineId, rule) on machineId | project name, rule"
    $arc = @((Invoke-HtGraph -Task log-forwarding-check -CallId arg-dcr-associations -Method POST -Uri '/providers/Microsoft.ResourceGraph/resources' -Body @{ query = $kql } -Fixture $fixture).data)
    $law = @((Invoke-HtGraph -Task log-forwarding-check -CallId law-query -Method POST -Uri "/v1/workspaces/$($cfg.workspaceId)/query" -Body @{ query = 'Event | summarize last = max(TimeGenerated) by Computer' } -Fixture $fixture).rows)
    $rows = [Collections.Generic.List[object]]::new(); $findings = [Collections.Generic.List[object]]::new()
    foreach ($s in $cfg.servers) {
        $m = @($arc | Where-Object { $_.name -eq $s })
        $rules = @($m | ForEach-Object { $_.rule } | Where-Object { $_ })
        $hasRule = [bool]($rules | Where-Object { $_ -like "*/dataCollectionRules/$($cfg.dataCollectionRuleName)" })
        $ev = $law | Where-Object { ($_.Computer -split '\.')[0] -eq $s } | Select-Object -First 1
        $lastUtc = if ($ev) { [datetime]::Parse([string]$ev.last, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal) } else { $null }
        $silent = if ($lastUtc) { [math]::Round(($AsOf.ToUniversalTime() - $lastUtc).TotalHours, 1) } else { $null }
        if (-not $m) { $findings.Add([pscustomobject]@{ Rule = 'HT-LF-01'; Severity = 'Finding'; Object = $s; Issue = 'Not an Azure Arc-enabled machine: Azure Monitor Agent needs Arc on an on-premises server' }) }
        elseif (-not $hasRule) { $findings.Add([pscustomobject]@{ Rule = 'HT-LF-02'; Severity = 'Finding'; Object = $s; Issue = "Not associated with the data collection rule $($cfg.dataCollectionRuleName)" }) }
        if ($m -and ($null -eq $silent -or $silent -gt $cfg.maxSilenceHours)) { $findings.Add([pscustomobject]@{ Rule = 'HT-LF-03'; Severity = 'Finding'; Object = $s; Issue = "No event in the workspace for $(if ($null -eq $silent) { 'the whole retention period' } else { "$silent hours" }) (limit $($cfg.maxSilenceHours))" }) }
        $rows.Add([ordered]@{ server = $s; arc = [bool]$m; associated = $hasRule; lastEventUtc = $(if ($lastUtc) { $lastUtc.ToString('yyyy-MM-ddTHH:mm:ssZ') } else { $null }); silentHours = $silent })
    }
    Write-HtRun -Step log-forwarding-check -OutputPath $OutputPath -AsOf $AsOf -Files @{ 'servers.json' = @($rows); 'findings.json' = @($findings) }
    [pscustomobject]@{ Servers = $rows.Count; Findings = $findings.Count; OutputPath = $OutputPath }
}

Export-ModuleMember -Function Get-HtConfig, Get-HtRequiredPermission, Get-HtSha256, New-HtFixtureStore,
    New-HtTypedChangePlan, Invoke-HtTypedChange, Get-HtPendingConsentRequest, Invoke-HtSyncCheck, Invoke-HtRoleReview, Test-HtLogForwarding
