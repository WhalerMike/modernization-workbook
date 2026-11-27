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
    param([Parameter(Mandatory)][ValidateSet('typed-changes', 'consent-review', 'calls', 'requirements')][string]$Name,
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
    param([Parameter(Mandatory)][ValidateSet('typed-change-plan', 'typed-change-apply', 'consent-requests')][string]$Task)
    $t = (Get-HtConfig calls).tasks[$Task]
    [pscustomobject]@{ Task = $Task; Mode = $t.mode; GraphPermissions = @($t.graphPermissions) }
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
    if (-not (Get-Command Invoke-MgGraphRequest -ErrorAction SilentlyContinue)) {
        throw 'Microsoft.Graph.Authentication is needed: Connect-MgGraph first, with the permissions Get-HtRequiredPermission lists.'
    }
    $params = @{ Method = $Method; Uri = "$script:GraphBase/v1.0$Uri"; OutputType = 'Hashtable' }
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
    $store = @{ Users = $users; Consent = $consent }
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

Export-ModuleMember -Function Get-HtConfig, Get-HtRequiredPermission, Get-HtSha256, New-HtFixtureStore,
    New-HtTypedChangePlan, Invoke-HtTypedChange, Get-HtPendingConsentRequest
