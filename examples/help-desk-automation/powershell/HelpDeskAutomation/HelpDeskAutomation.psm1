#Requires -Version 7.1
# Help desk automation: a typed change to a user, planned and then applied only with the approved plan's
# hash, and a read-only review of pending admin consent requests. Book 15, Chapter 12, tasks 3 and 5.
# Every Graph call is declared in config/calls.json; Invoke-HtGraph refuses any other.
Set-StrictMode -Version Latest

$script:Root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$script:GraphBase = 'https://graph.microsoft.com'
# WD-184: extra entropy for the pipeline's DPAPI-protected secret files, so another program's DPAPI blob isn't taken for one.
$script:SecretEntropy = [Text.Encoding]::UTF8.GetBytes('FMW help desk request pipeline (WD-184)')

function Get-HtConfig {
    <#
    .SYNOPSIS
        Reads one of the pack's configuration files (typed-changes, consent-review, calls, requirements).
    .EXAMPLE
        (Get-HtConfig typed-changes).changes.id
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][ValidateSet('typed-changes', 'consent-review', 'calls', 'requirements', 'sync-check', 'role-register', 'log-forwarding', 'request-items')][string]$Name,
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
    param([Parameter(Mandatory)][ValidateSet('typed-change-plan', 'typed-change-apply', 'consent-requests', 'sync-check', 'role-review', 'log-forwarding-check', 'request-queue', 'password-reset', 'authenticator-reset', 'account-create')][string]$Task)
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

function Resolve-HtPath([string]$Path) {
    # .NET resolves a relative path against the process's directory, which Set-Location doesn't change;
    # PowerShell's own location is what a reader means by out/plan.
    $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Path)
}

function Write-HtText([string]$Path, [string]$Text) {
    $full = Resolve-HtPath $Path
    $dir = Split-Path -Parent $full
    if ($dir) { New-Item -ItemType Directory -Force $dir | Out-Null }
    [IO.File]::WriteAllText($full, $Text)
}

function Write-HtJson([object]$Value, [string]$Path) {
    Write-HtText $Path ((($Value | ConvertTo-Json -Depth 8) -replace "`r`n", "`n") + "`n")
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
    if ($call.api -in 'servicenow', 'isc') {
        if (-not $script:Systems -or -not $script:Systems[$call.api]) { throw "Connect-HtRequestSystems first: no $($call.api) session." }
        $sys = $script:Systems[$call.api]
        $params = @{ Method = $Method; Uri = "$($sys.Base)$Uri"; Headers = $sys.Headers; ContentType = 'application/json' }
        if ($Body) { $params.Body = ($Body | ConvertTo-Json -Depth 6) }
        return Invoke-RestMethod @params
    }
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
    foreach ($n in 'organization', 'provisioning-errors', 'health', 'roles', 'arc', 'law', 'requests') {
        $f = Join-Path $Path "$n.json"
        if (Test-Path $f) { $extra[$n] = Get-Content $f -Raw | ConvertFrom-Json -AsHashtable }
    }
    $store = @{ Users = $users; Consent = $consent; Extra = $extra; Updates = [Collections.Generic.List[object]]::new(); Actions = [Collections.Generic.List[object]]::new() }
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
            'sn-ritm-list' { return @{ result = @($store.Extra['requests'].ritms | Where-Object { $_.u_automation_state -eq 'ready' -and $_.u_isc_access_request_id }) } }
            'sn-ritm-variables' {
                $id = [regex]::Match([uri]::UnescapeDataString($Uri), 'request_item=([0-9a-f]+)').Groups[1].Value
                $vars = $store.Extra['requests'].variables[$id]
                return @{ result = @($vars.Keys | ForEach-Object { @{ 'sc_item_option.item_option_new.name' = $_; 'sc_item_option.value' = $vars[$_] } }) }
            }
            'sn-ritm-update' { $store.Updates.Add(@{ uri = $Uri; body = $Body }); return @{ result = @{} } }
            'sn-attach' { $store.Updates.Add(@{ uri = $Uri; attachment = $Body }); return @{ result = @{} } }
            'isc-access-request-status' {
                $id = [regex]::Match([uri]::UnescapeDataString($Uri), 'accessRequestId eq "([^"]+)"').Groups[1].Value
                return @($store.Extra['requests'].isc[$id])
            }
            'role-assignments-for-user' {
                $principalKey = [regex]::Match([uri]::UnescapeDataString($Uri), "principalId eq '([^']+)'").Groups[1].Value
                return @{ value = @($store.Extra['requests'].roleAssignments[$principalKey]) }
            }
            'user-get-queue' {
                $segment = (($Uri -split '/')[2]) -replace '\?.*$', ''
                $key = [uri]::UnescapeDataString($segment)
                if (-not $store.Users.ContainsKey($key)) { throw "404: no user '$key' in the fixtures" }
                return $store.Users[$key]
            }
            'user-password-reset' { $store.Actions.Add(@{ call = $CallId; uri = $Uri; forceChange = $Body.passwordProfile.forceChangePasswordNextSignIn }); return $null }
            'auth-methods-list' {
                $uid = ($Uri -split '/')[2]
                return @{ value = @($store.Extra['requests'].authMethods[$uid]) }
            }
            'authenticator-method-delete' { $store.Actions.Add(@{ call = $CallId; uri = $Uri }); return $null }
            'phone-method-delete' { $store.Actions.Add(@{ call = $CallId; uri = $Uri }); return $null }
            'tap-create' { $store.Actions.Add(@{ call = $CallId; uri = $Uri; body = $Body }); return @{ id = 'tap1'; temporaryAccessPass = 'FIXTURE-TAP'; lifetimeInMinutes = $Body.lifetimeInMinutes; isUsableOnce = $Body.isUsableOnce } }
            'user-create' {
                $new = @{ id = 'a1000000-0000-4000-8000-000000000199'; userPrincipalName = $Body.userPrincipalName; accountEnabled = $true; onPremisesSyncEnabled = $null; onPremisesExtensionAttributes = @{} }
                $store.Users[$new.id] = $new; $store.Users[$new.userPrincipalName] = $new
                $store.Actions.Add(@{ call = $CallId; body = $Body }); return $new
            }
            'group-member-add' { $store.Actions.Add(@{ call = $CallId; uri = $Uri; body = $Body }); return $null }
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

    if ($RequestId -notmatch '^([A-Z]{2,6}-\d{4}-\d{3,7}|[A-Z]{3,6}\d{7,10})$') { Add-Finding 'HT-06' "Request id '$RequestId' isn't a ticket number (for example REQ-2026-0501 or RITM0010001)" }
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
        before = $before; after = $Value; plannedUtc = $AsOf.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
        controls = $req.controls; ksis = $req.ksis
        note = 'Applies only with this file''s SHA-256 as -ApprovedPlanSha256, and only if the value is still the one recorded in before.'
    }
    $planPath = Join-Path $dir 'plan.json'
    Write-HtJson $plan $planPath
    $sha = Get-HtSha256 $planPath
    Write-HtText (Join-Path $dir 'plan.sha256') "$sha  plan.json`n"
    [pscustomobject]@{ RequestId = $RequestId; Ready = $true; Findings = 0; PlanPath = ($planPath -replace '\\', '/'); PlanSha256 = $sha }
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
        runUtc = $AsOf.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'); controls = $plan.controls; ksis = $plan.ksis
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
    if ($rows.Count) { $rows | Export-Csv -LiteralPath $csv -NoTypeInformation -UseQuotes AsNeeded } else { Write-HtText $csv "AppId,Application,Permissions,Requesters,OldestUtc,AgeDays,Broad`n" }
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
        if ($name -like '*.md') { Write-HtText $path (($Files[$name] -join "`n") + "`n") } else { Write-HtJson $Files[$name] $path }
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


function Test-HtSecretFileAccess {
    <#
    .SYNOPSIS
        WD-184: the identities, other than the ones allowed, that an access rule lets read a pipeline secret file.
    .DESCRIPTION
        Takes the file's access rules as rows (Identity, Rights, Type), so the rule is tested without a host.
        Allowed are the account the pipeline runs as, SYSTEM, the local Administrators and the settings'
        credentialAdmins group. A Deny rule never counts. Returns the identities that shouldn't read the file.
    #>
    param([Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Rules, [Parameter(Mandatory)][AllowEmptyCollection()][string[]]$Allowed)
    $ok = @(@($Allowed) + 'NT AUTHORITY\SYSTEM', 'BUILTIN\Administrators' | Where-Object { $_ } | ForEach-Object { $_.ToLowerInvariant() })
    @($Rules | Where-Object { "$($_.Type)" -ne 'Deny' -and "$($_.Rights)" -match 'Read|FullControl|Modify' -and "$($_.Identity)".ToLowerInvariant() -notin $ok } |
        ForEach-Object { "$($_.Identity)" } | Sort-Object -Unique)
}

function Protect-HtSecretFile {
    <#
    .SYNOPSIS
        WD-184: writes a secret to a file with DPAPI in the current user's scope, so only this account on this host can decrypt it.
    .DESCRIPTION
        On the platform host the account is the pipeline's gMSA, through deploy/Protect-HtPipelineSecret.ps1;
        in a lab it is you. Windows only: DPAPI keeps its key in the user's profile.
    .EXAMPLE
        Protect-HtSecretFile -Path out/servicenow.secret -Secret (Read-Host -AsSecureString 'ServiceNow client secret')
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][securestring]$Secret)
    if (-not $IsWindows) { throw 'A DPAPI-protected secret file needs Windows (WD-184).' }
    $plain = [Text.Encoding]::UTF8.GetBytes([Net.NetworkCredential]::new('', $Secret).Password)
    try {
        $blob = [Security.Cryptography.ProtectedData]::Protect($plain, $script:SecretEntropy, [Security.Cryptography.DataProtectionScope]::CurrentUser)
    } finally { [Array]::Clear($plain, 0, $plain.Length) }
    $full = Resolve-HtPath $Path
    $dir = Split-Path -Parent $full
    if ($dir) { New-Item -ItemType Directory -Force $dir | Out-Null }
    [IO.File]::WriteAllBytes($full, $blob)
    [pscustomobject]@{ Path = $Path; Protection = 'DPAPI, current user'; Account = [Security.Principal.WindowsIdentity]::GetCurrent().Name }
}

function Read-HtSecretFile {
    # WD-184: a secret file is read only if no one beyond the allowed identities can read it, and only by the
    # account that protected it (DPAPI, current user's scope). Never logged, never written back out.
    param([Parameter(Mandatory)][string]$Path, [string[]]$Allowed = @())
    if (-not $IsWindows) { throw 'A DPAPI-protected secret file needs Windows (WD-184).' }
    $full = Resolve-HtPath $Path
    if (-not (Test-Path -LiteralPath $full -PathType Leaf)) { throw "HT-RQ-06: no secret file at $Path; protect it first (deploy/Protect-HtPipelineSecret.ps1, WD-184)." }
    $me = [Security.Principal.WindowsIdentity]::GetCurrent().Name
    $rules = @((Get-Acl -LiteralPath $full).Access | ForEach-Object { [pscustomobject]@{ Identity = $_.IdentityReference.Value; Rights = "$($_.FileSystemRights)"; Type = "$($_.AccessControlType)" } })
    $others = @(Test-HtSecretFileAccess -Rules $rules -Allowed (@($me) + @($Allowed)))
    if ($others) { throw "HT-RQ-06: $Path is readable by $($others -join ', '); only the pipeline's account, SYSTEM, Administrators and the credential administrators may read it (WD-184)." }
    $plain = [Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($full), $script:SecretEntropy, [Security.Cryptography.DataProtectionScope]::CurrentUser)
    try { [Text.Encoding]::UTF8.GetString($plain) } finally { [Array]::Clear($plain, 0, $plain.Length) }
}

function Connect-HtRequestSystems {
    <#
    .SYNOPSIS
        Signs the request pipeline in to ServiceNow and SailPoint Identity Security Cloud, with secrets from DPAPI-protected files only its gMSA can decrypt, and proves the SailPoint token can read the access request status.
    .DESCRIPTION
        WD-182 as amended by WD-184. Each secret is a file the settings name (serviceNowSecretFile,
        iscSecretFile), protected with DPAPI in the gMSA's own scope and readable only by it, SYSTEM,
        Administrators and the credentialAdmins group; never an environment variable or the settings file.
        SailPoint signs in with the client-credentials grant either way: iscCredential is 'api-client' (an
        API client, no user context) or 'personal-access-token' (the PAT of the pipeline's dedicated SailPoint
        identity; SailPoint gives PATs the client-credentials grant). Then one status read
        (GET /v3/access-request-status?limit=1) proves the token: a 403 stops the run with HT-RQ-06 and says
        what to change, instead of refusing every item with HT-RQ-02. Microsoft Graph is signed in separately,
        as the request worker app with its certificate (Connect-MgGraph -Certificate).
    .EXAMPLE
        Connect-HtRequestSystems -Settings (Get-Content D:\HelpDeskRequests\settings.json -Raw | ConvertFrom-Json -AsHashtable)
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings)
    $kind = $Settings.iscCredential
    if ($kind -notin 'api-client', 'personal-access-token') { throw "iscCredential must be 'api-client' or 'personal-access-token' (WD-184), not '$kind'." }
    $admins = @($Settings.credentialAdmins | Where-Object { $_ })
    $script:Systems = @{}
    $sn = Invoke-RestMethod -Method POST -Uri "$($Settings.serviceNowUrl)/oauth_token.do" -ContentType 'application/x-www-form-urlencoded' -Body @{
        grant_type = 'client_credentials'; client_id = $Settings.serviceNowClientId; client_secret = (Read-HtSecretFile -Path $Settings.serviceNowSecretFile -Allowed $admins) }
    $script:Systems.servicenow = @{ Base = $Settings.serviceNowUrl; Headers = @{ Authorization = "Bearer $($sn.access_token)"; Accept = 'application/json' } }
    $isc = Invoke-RestMethod -Method POST -Uri "$($Settings.iscApiUrl)/oauth/token" -ContentType 'application/x-www-form-urlencoded' -Body @{
        grant_type = 'client_credentials'; client_id = $Settings.iscClientId; client_secret = (Read-HtSecretFile -Path $Settings.iscSecretFile -Allowed $admins) }
    $script:Systems.isc = @{ Base = $Settings.iscApiUrl; Headers = @{ Authorization = "Bearer $($isc.access_token)"; Accept = 'application/json' } }
    try {
        Invoke-HtGraph -Task request-queue -CallId isc-access-request-status -Method GET -Uri '/v3/access-request-status?limit=1' | Out-Null
    } catch {
        $code = 0
        $resp = $_.Exception.PSObject.Properties['Response']
        if ($resp -and $resp.Value) { $code = [int]$resp.Value.StatusCode }
        if ($code -ne 403) { throw }
        $script:Systems.Remove('isc')
        if ($kind -eq 'api-client') {
            throw "HT-RQ-06: SailPoint refused the access request status (403) to the API client's token, which has no user context. Use the personal access token of the pipeline's dedicated SailPoint identity, scoped to idn:access-request-status:read, and set iscCredential to personal-access-token (WD-184)."
        }
        throw "HT-RQ-06: SailPoint refused the access request status (403) to the personal access token. Check that the token holds idn:access-request-status:read and its identity's user level; SailPoint's specification names ORG_ADMIN for other users' requests (WD-184)."
    }
    [pscustomobject]@{ ServiceNow = 'signed in'; SailPoint = $kind; StatusRead = 'allowed' }
}

function New-HtOneTimeSecret {
    # A strong temporary password: 20 characters from four classes, from the system's cryptographic generator.
    $sets = 'ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%*-_=+?'
    $all = -join $sets
    $chars = foreach ($s in $sets) { $s[[Security.Cryptography.RandomNumberGenerator]::GetInt32($s.Length)] }
    $chars += 1..16 | ForEach-Object { $all[[Security.Cryptography.RandomNumberGenerator]::GetInt32($all.Length)] }
    -join ($chars | Sort-Object { [Security.Cryptography.RandomNumberGenerator]::GetInt32([int]::MaxValue) })
}

function Test-HtApproval([object[]]$Statuses) {
    # The approval re-read from SailPoint, never the ticket's own field: every approval APPROVED, the request
    # not rejected, cancelled, terminated or in error, and no approval owned by the person who asked.
    if (-not $Statuses) { return 'HT-RQ-02: SailPoint has no access request with this id' }
    $s = $Statuses[0]
    if ($s.state -in 'REJECTED', 'CANCELLED', 'TERMINATED', 'ERROR') { return "HT-RQ-02: SailPoint shows the request $($s.state)" }
    $approvals = @($s.approvalDetails)
    if (-not $approvals) { return 'HT-RQ-02: SailPoint shows no approval for the request' }
    if (@($approvals | Where-Object { $_.status -eq 'PENDING' }) -and -not @($approvals | Where-Object { $_.status -in 'REJECTED', 'EXPIRED', 'CANCELLED' })) { return 'WAIT' }
    $notYet = @($approvals | Where-Object { $_.status -ne 'APPROVED' })
    if ($notYet) { return "HT-RQ-02: an approval is $(($notYet | ForEach-Object status) -join ', ')" }
    $requesterId = if ($s.requester) { $s.requester.id } else { $null }
    $self = @($approvals | Where-Object { $_.currentOwner.id -and $_.currentOwner.id -eq $requesterId })
    if ($self) { return 'HT-RQ-03: the requester approved their own request' }
    $null
}

function Invoke-HtRequestQueue {
    <#
    .SYNOPSIS
        The approved-request pipeline (WD-182): works the ServiceNow requested items SailPoint has approved, runs each one's pre-approved script, and writes the result and evidence back to the ticket. A dry run unless -Apply.
    .DESCRIPTION
        For each requested item marked ready: reads its variables (only those its catalog item declares), re-reads
        the approval from SailPoint by its access request id (HT-RQ-02 not approved; HT-RQ-03 self-approved),
        checks the identity verification a reset needs (HT-RQ-01), refuses a user who holds a directory role
        (HT-RQ-04: a Privileged Authentication Administrator acts by hand), and refuses anything else invalid
        (HT-RQ-05). Then, with -Apply:
          Typed user change     the typed change's own checks, plan and apply (New-HtTypedChangePlan, Invoke-HtTypedChange)
          Password reset        a strong temporary password the user must change at next sign-in
          Authenticator reset   removes the Authenticator app and phone methods, then a single-use Temporary Access Pass
          Cloud account         creates the user from the item's profile and adds the profile's groups
        A one-time secret goes only to the item's restricted field for the verified agent to read to the person on a
        separate channel; it is never in the evidence, the work notes or an email. Each item gets work notes, an
        automation state (done, failed or manual) and evidence.json as an attachment, with the controls and KSIs.
    .EXAMPLE
        Invoke-HtRequestQueue -OutputPath out/queue -FixturePath tests/fixtures
    .EXAMPLE
        Invoke-HtRequestQueue -OutputPath D:\HelpDeskRequests\runs\2026-11-27T1200Z -Apply
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$OutputPath, [switch]$Apply, [string]$FixturePath, [string]$ItemsPath,
          [datetime]$AsOf = (Get-Date).ToUniversalTime())
    $fixture = if ($FixturePath) { New-HtFixtureStore -Path $FixturePath } else { $null }
    $cfg = Get-HtConfig request-items -Path $ItemsPath
    $f = $cfg.servicenow.fields; $st = $cfg.servicenow.states
    $q = [uri]::EscapeDataString($cfg.servicenow.readyQuery)
    $ritms = @((Invoke-HtGraph -Task request-queue -CallId sn-ritm-list -Method GET -Uri "/api/now/table/$($cfg.servicenow.table)?sysparm_query=$q&sysparm_fields=sys_id,number,cat_item,requested_for,opened_by,$($f.accessRequestId),$($f.verifiedBy),$($f.verificationMethod),$($f.automationState)&sysparm_display_value=false" -Fixture $fixture).result)
    $results = [Collections.Generic.List[object]]::new()
    foreach ($r in $ritms) {
        $itemName = if ($r.cat_item -is [hashtable] -or $r.cat_item -is [Collections.IDictionary]) { $r.cat_item.display_value } else { [string]$r.cat_item }
        $item = $cfg.items[$itemName]
        $vq = [uri]::EscapeDataString("request_item=$($r.sys_id)")
        $vars = @{}
        foreach ($v in @((Invoke-HtGraph -Task request-queue -CallId sn-ritm-variables -Method GET -Uri "/api/now/table/sc_item_option_mtom?sysparm_query=$vq&sysparm_fields=sc_item_option.item_option_new.name,sc_item_option.value" -Fixture $fixture).result)) {
            $vars[$v.'sc_item_option.item_option_new.name'] = [string]$v.'sc_item_option.value'
        }
        $outcome = [ordered]@{ number = $r.number; item = $itemName; task = $(if ($item) { $item.task } else { $null }); state = $null; reason = $null; secret = $null; evidence = $null }
        $refuse = {
            param($state, $why)
            $outcome.state = $state; $outcome.reason = $why
        }
        $requester = if ($r.opened_by -is [Collections.IDictionary]) { $r.opened_by.value } else { [string]$r.opened_by }
        if (-not $item) { & $refuse $st.manual "HT-RQ-05: '$itemName' isn't one of the pipeline's catalog items" }
        else {
            $missing = @($item.variables | Where-Object { -not $vars[$_] }); $extra = @($vars.Keys | Where-Object { $_ -notin $item.variables })
            if ($missing -or $extra) { & $refuse $st.failed "HT-RQ-05: variables missing ($($missing -join ', ')) or not declared ($($extra -join ', '))" }
            elseif ($item.verification -and (-not $r[$f.verifiedBy] -or -not $r[$f.verificationMethod])) { & $refuse $st.failed 'HT-RQ-01: no identity verification recorded (who verified, and how)' }
            elseif ($item.verification -and $r[$f.verifiedBy] -eq $requester) { & $refuse $st.failed 'HT-RQ-01: the person who asked recorded their own verification' }
            else {
                $iq = [uri]::EscapeDataString("accessRequestId eq `"$($r[$f.accessRequestId])`"")
                $statuses = @(Invoke-HtGraph -Task request-queue -CallId isc-access-request-status -Method GET -Uri "/v3/access-request-status?filters=$iq" -Fixture $fixture)
                $why = Test-HtApproval $statuses
                if ($why -eq 'WAIT') { $results.Add([pscustomobject]@{ Number = $r.number; Task = $item.task; State = 'waiting'; Reason = 'An approval is still pending in SailPoint'; SecretIssued = $false; EvidenceSha256 = $null }); continue }
                if ($why) { & $refuse $st.failed $why }
            }
        }
        if (-not $outcome.state) {
            $upn = $vars['user_principal_name']
            $target = $null
            if ($item.task -ne 'account-create') {
                try { $target = Invoke-HtGraph -Task request-queue -CallId user-get-queue -Method GET -Uri "/users/$([uri]::EscapeDataString($upn))?`$select=id,userPrincipalName,accountEnabled,onPremisesSyncEnabled" -Fixture $fixture }
                catch { & $refuse $st.failed "HT-RQ-05: no user '$upn'" }
            }
            if ($target) {
                $rq = [uri]::EscapeDataString("principalId eq '$($target.id)'")
                $roles = @((Invoke-HtGraph -Task request-queue -CallId role-assignments-for-user -Method GET -Uri "/roleManagement/directory/roleAssignments?`$filter=$rq" -Fixture $fixture).value)
                if ($roles) { & $refuse $st.manual 'HT-RQ-04: the user holds a directory role; a Privileged Authentication Administrator acts by hand' }
                elseif (-not $target.accountEnabled) { & $refuse $st.manual 'HT-RQ-05: the account is disabled; it goes to the security office' }
            }
        }
        $evidence = [ordered]@{ number = $r.number; item = $itemName; task = $outcome.task; accessRequestId = $r[$f.accessRequestId]; mode = $(if ($Apply) { 'apply' } else { 'dry-run' }); runUtc = $AsOf.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'); result = $null }
        if (-not $outcome.state) {
            try {
                switch ($item.task) {
                    'typed-change' {
                        $plan = New-HtTypedChangePlan -RequestId $r.number -User $upn -ChangeId $vars.change_id -Value $vars.value -OutputPath (Join-Path $OutputPath 'plans') -FixturePath $FixturePath -AsOf $AsOf -WarningAction SilentlyContinue
                        if (-not $plan.Ready) { throw "the typed change's checks refused it: $((Get-Content (Join-Path $OutputPath 'plans' $r.number 'findings.json') -Raw | ConvertFrom-Json).Issue -join '; ')" }
                        $applied = Invoke-HtTypedChange -PlanPath $plan.PlanPath -ApprovedPlanSha256 $plan.PlanSha256 -OutputPath (Join-Path $OutputPath 'applied') -FixturePath $FixturePath -Apply:$Apply -AsOf $AsOf
                        $evidence.result = [ordered]@{ planSha256 = $plan.PlanSha256; before = $applied.Before; after = $applied.After; verified = $applied.Verified }
                    }
                    'password-reset' {
                        if ($Apply) {
                            $secret = New-HtOneTimeSecret
                            Invoke-HtGraph -Task password-reset -CallId user-password-reset -Method PATCH -Uri "/users/$($target.id)" -Body @{ passwordProfile = @{ password = $secret; forceChangePasswordNextSignIn = $true } } -Fixture $fixture | Out-Null
                            $outcome.secret = $secret
                        }
                        $evidence.result = [ordered]@{ userId = $target.id; forceChangePasswordNextSignIn = $true; delivered = 'restricted field, read to the person by the verified agent' }
                    }
                    'authenticator-reset' {
                        $methods = @((Invoke-HtGraph -Task authenticator-reset -CallId auth-methods-list -Method GET -Uri "/users/$($target.id)/authentication/methods" -Fixture $fixture).value)
                        $removed = [Collections.Generic.List[string]]::new()
                        foreach ($m in $methods) {
                            $type = $m.'@odata.type'
                            if ($type -eq '#microsoft.graph.microsoftAuthenticatorAuthenticationMethod') { if ($Apply) { Invoke-HtGraph -Task authenticator-reset -CallId authenticator-method-delete -Method DELETE -Uri "/users/$($target.id)/authentication/microsoftAuthenticatorMethods/$($m.id)" -Fixture $fixture | Out-Null }; $removed.Add("authenticator:$($m.id)") }
                            elseif ($type -eq '#microsoft.graph.phoneAuthenticationMethod') { if ($Apply) { Invoke-HtGraph -Task authenticator-reset -CallId phone-method-delete -Method DELETE -Uri "/users/$($target.id)/authentication/phoneMethods/$($m.id)" -Fixture $fixture | Out-Null }; $removed.Add("phone:$($m.id)") }
                        }
                        if ($Apply) {
                            $tap = Invoke-HtGraph -Task authenticator-reset -CallId tap-create -Method POST -Uri "/users/$($target.id)/authentication/temporaryAccessPassMethods" -Body @{ lifetimeInMinutes = $cfg.temporaryAccessPass.lifetimeInMinutes; isUsableOnce = $cfg.temporaryAccessPass.isUsableOnce } -Fixture $fixture
                            $outcome.secret = $tap.temporaryAccessPass
                        }
                        $evidence.result = [ordered]@{ userId = $target.id; removed = @($removed); temporaryAccessPass = [ordered]@{ lifetimeInMinutes = $cfg.temporaryAccessPass.lifetimeInMinutes; isUsableOnce = $cfg.temporaryAccessPass.isUsableOnce }; delivered = 'restricted field, read to the person by the verified agent' }
                    }
                    'account-create' {
                        $acctProfile = $cfg.accountProfiles[$vars.profile]
                        if (-not $acctProfile) { throw "no account profile '$($vars.profile)'" }
                        if ($vars.usage_location -notin $cfg.usageLocations) { throw "usage location '$($vars.usage_location)' isn't allowed" }
                        if ($upn -notmatch '^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+$') { throw "'$upn' isn't a user principal name" }
                        $exists = $true
                        try { Invoke-HtGraph -Task account-create -CallId user-get-queue -Method GET -Uri "/users/$([uri]::EscapeDataString($upn))?`$select=id" -Fixture $fixture | Out-Null } catch { $exists = $false }
                        if ($exists) { throw "a user '$upn' already exists" }
                        $created = $null
                        if ($Apply) {
                            $secret = New-HtOneTimeSecret
                            $created = Invoke-HtGraph -Task account-create -CallId user-create -Method POST -Uri '/users' -Fixture $fixture -Body @{
                                accountEnabled = $true; displayName = "$($vars.given_name) $($vars.surname)"; givenName = $vars.given_name; surname = $vars.surname
                                mailNickname = ($upn -split '@')[0]; userPrincipalName = $upn; usageLocation = $vars.usage_location
                                passwordProfile = @{ password = $secret; forceChangePasswordNextSignIn = $true } }
                            foreach ($g in $acctProfile.groups) { Invoke-HtGraph -Task account-create -CallId group-member-add -Method POST -Uri "/groups/$g/members/`$ref" -Body @{ '@odata.id' = "https://graph.microsoft.com/v1.0/directoryObjects/$($created.id)" } -Fixture $fixture | Out-Null }
                            $outcome.secret = $secret
                        }
                        $evidence.result = [ordered]@{ userPrincipalName = $upn; userId = $(if ($created) { $created.id } else { $null }); profile = $vars.profile; groups = @($acctProfile.groups); usageLocation = $vars.usage_location }
                    }
                }
                $outcome.state = if ($Apply) { $st.done } else { 'dry-run' }
            } catch { $outcome.state = $st.failed; $outcome.reason = "HT-RQ-05: $($_.Exception.Message)" }
        }
        $req = if ($item) { (Get-HtConfig requirements).steps[$item.task] } else { $null }
        $evidence.state = $outcome.state; $evidence.reason = $outcome.reason
        $evidence.controls = @(if ($req) { $req.controls }); $evidence.ksis = @(if ($req) { $req.ksis })
        $evPath = Join-Path $OutputPath $r.number 'evidence.json'
        Write-HtJson $evidence $evPath
        $sha = Get-HtSha256 $evPath
        if ($Apply -or $outcome.state -ne 'dry-run') {
            $note = "Help desk automation pipeline: $($outcome.state)$(if ($outcome.reason) { " ($($outcome.reason))" }). Evidence SHA-256 $sha."
            $body = @{ $f.automationState = $outcome.state; $f.workNotes = $note }
            if ($outcome.secret) { $body[$f.oneTimeSecret] = $outcome.secret }
            if ($Apply) {
                Invoke-HtGraph -Task request-queue -CallId sn-ritm-update -Method PATCH -Uri "/api/now/table/$($cfg.servicenow.table)/$($r.sys_id)" -Body $body -Fixture $fixture | Out-Null
                Invoke-HtGraph -Task request-queue -CallId sn-attach -Method POST -Uri "/api/now/attachment/file?table_name=$($cfg.servicenow.table)&table_sys_id=$($r.sys_id)&file_name=evidence.json" -Body (Get-Content $evPath -Raw | ConvertFrom-Json -AsHashtable) -Fixture $fixture | Out-Null
            }
        }
        $results.Add([pscustomobject]@{ Number = $r.number; Task = $outcome.task; State = $outcome.state; Reason = $outcome.reason; SecretIssued = [bool]$outcome.secret; EvidenceSha256 = $sha })
    }
    Write-HtJson @($results | Select-Object Number, Task, State, Reason, SecretIssued, EvidenceSha256) (Join-Path $OutputPath 'queue.json')
    if ($fixture) { $script:LastFixture = $fixture }
    $results
}

Export-ModuleMember -Function Get-HtConfig, Get-HtRequiredPermission, Get-HtSha256, New-HtFixtureStore,
    New-HtTypedChangePlan, Invoke-HtTypedChange, Get-HtPendingConsentRequest, Invoke-HtSyncCheck, Invoke-HtRoleReview, Test-HtLogForwarding, Connect-HtRequestSystems, Invoke-HtRequestQueue,
    Test-HtSecretFileAccess, Protect-HtSecretFile
