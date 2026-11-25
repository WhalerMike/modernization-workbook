#Requires -Version 7.4
<#
    AppModernization: the PowerShell half of the application modernization kit.

    - Lab helpers that read what the Java and web builds wrote (test results, the migration's
      validation report, the contract's operations), so a reader sees the same lines everywhere.
    - Book 18, Appendix A's identity remediation work packages for one application's own Microsoft
      Entra identity: the before and after snapshot, WP4 redirect URI cleanup with DNS proof and an
      OAuth regression test, WP5 assignment enforcement, and WP6's post-change sign-in check and
      sealed evidence pack. WP1 to WP3 (owners, permissions, secrets) are built by the Non-Person
      Identity kit; Get-AmWorkPackage says which apply and where each is built.
    - An evidence record per step, with the NIST SP 800-53 controls it supports and the FedRAMP 20x
      KSIs it aligns to, from config/requirements.json, hashed and chained.

    Every function reads files in fixture mode. The Graph reads and writes run only when no fixture
    is given, and the writes only through Invoke-AmIdentityApply.ps1 with -Apply and the plan's
    approved SHA-256. PowerShell 7.4 or later (7.5 or later keeps date-like JSON strings as strings).
#>

Set-StrictMode -Version 3.0
$script:KitRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$script:Inv = [Globalization.CultureInfo]::InvariantCulture
$script:SnapshotFiles = [ordered]@{
    application      = 'application.json'
    serviceprincipal = 'serviceprincipal.json'
    owners           = 'owners.json'
    'app-permissions'  = 'app-permissions.json'
    'delegated-grants' = 'delegated-grants.json'
    assignments      = 'assignments.json'
}

# ---------------------------------------------------------------------------------------------
# Reading files
# ---------------------------------------------------------------------------------------------

function Read-AmJson {
    <#
    .SYNOPSIS
        Reads a JSON file as objects. On PowerShell 7.5 or later, date-like strings stay strings.
    .EXAMPLE
        Read-AmJson -Path migration/target/lab/load-full.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $text = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $Path).Path)
    $p = @{ Depth = 100; NoEnumerate = $true }
    if ((Get-Command ConvertFrom-Json).Parameters.ContainsKey('DateKind')) { $p.DateKind = 'String' }
    $text | ConvertFrom-Json @p
}

function Get-AmSha256 {
    <#
    .SYNOPSIS
        A file's SHA-256, in lower case.
    .EXAMPLE
        Get-AmSha256 -Path out/pack/SHA256SUMS.txt
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Get-AmTextSha256 {
    param([Parameter(Mandatory)][string]$Text)
    $bytes = [Text.Encoding]::UTF8.GetBytes($Text)
    ([Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes))).ToLowerInvariant()
}

function Write-AmJson {
    param([Parameter(Mandatory)]$Value, [Parameter(Mandatory)][string]$Path)
    $dir = Split-Path -Parent $Path
    if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $json = ($Value | ConvertTo-Json -Depth 20) -replace "`r`n", "`n"
    $full = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Path)
    [IO.File]::WriteAllText($full, $json + "`n", [Text.UTF8Encoding]::new($false))
}

# ---------------------------------------------------------------------------------------------
# Lab helpers for the Java and web builds
# ---------------------------------------------------------------------------------------------

function Get-AmTestResult {
    <#
    .SYNOPSIS
        One row per test class from Maven Surefire's XML reports: tests, failures, errors, skipped.
    .EXAMPLE
        Get-AmTestResult -Path service/target/surefire-reports
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [string]$Class = '*')
    foreach ($f in Get-ChildItem -LiteralPath $Path -Filter 'TEST-*.xml' | Sort-Object Name) {
        [xml]$x = Get-Content -LiteralPath $f.FullName -Raw
        $s = $x.testsuite
        $name = ($s.name -split '\.')[-1]
        if ($name -notlike $Class) { continue }
        [pscustomobject]@{ Class = $name; Tests = [int]$s.tests; Failures = [int]$s.failures; Errors = [int]$s.errors; Skipped = [int]$s.skipped }
    }
}

function Get-AmVitestResult {
    <#
    .SYNOPSIS
        One row per test file from Vitest's JSON reporter (npx vitest run --reporter=json --outputFile=...).
    .EXAMPLE
        Get-AmVitestResult -Path web/out/vitest.json | Format-Table
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $r = Read-AmJson -Path $Path
    foreach ($t in $r.testResults | Sort-Object name) {
        [pscustomobject]@{
            File   = Split-Path -Leaf $t.name
            Tests  = @($t.assertionResults).Count
            Passed = @($t.assertionResults | Where-Object status -eq 'passed').Count
            Failed = @($t.assertionResults | Where-Object status -eq 'failed').Count
        }
    }
}

function Get-AmContractOperation {
    <#
    .SYNOPSIS
        The operations an OpenAPI file documents: method, path and operationId, read line by line
        (the kit's contract is plain block YAML; this is not a general YAML parser).
    .EXAMPLE
        Get-AmContractOperation -Path service/src/main/resources/static/openapi.yaml | Format-Table
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $inPaths = $false; $route = $null; $method = $null
    foreach ($line in Get-Content -LiteralPath $Path) {
        if ($line -match '^paths:\s*$') { $inPaths = $true; continue }
        if ($inPaths -and $line -match '^\S') { break }
        if (-not $inPaths) { continue }
        if ($line -match '^  (/\S*):\s*$') { $route = $Matches[1]; continue }
        if ($line -match '^    (get|put|post|delete|patch|head|options):\s*$') { $method = $Matches[1].ToUpperInvariant(); continue }
        if ($method -and $line -match '^      operationId:\s*(\S+)') {
            [pscustomobject]@{ Method = $method; Path = $route; OperationId = $Matches[1] }
            $method = $null
        }
    }
}

function Get-AmValidationSummary {
    <#
    .SYNOPSIS
        A migration validation report as one row per table and check: passed, and the detail a failure carries.
    .EXAMPLE
        Get-AmValidationSummary -Path migration/target/lab/load-full.json | Format-Table
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $r = Read-AmJson -Path $Path
    foreach ($t in $r.tables) {
        foreach ($c in $t.checks) {
            $detail = if ($c.PSObject.Properties['detail']) { $c.detail } else { '' }
            if ($c.check -eq 'row_count') { $detail = "source $($c.source.rows), target $($c.target.rows)" }
            [pscustomobject]@{ Mode = $r.mode; Table = $t.table; Check = $c.check; Passed = $c.passed; Detail = $detail }
        }
    }
}

# ---------------------------------------------------------------------------------------------
# Appendix A: the snapshot (report-only phase) and which work packages apply
# ---------------------------------------------------------------------------------------------

function Get-AmAppSnapshot {
    <#
    .SYNOPSIS
        Appendix A's read-only snapshot of one application: the application, its service principal,
        owners, application permissions, delegated grants and assignments, as <stage>-*.json files.
    .DESCRIPTION
        With -FixturePath, copies <FixturePath>/<Stage>/*.json. Without it, reads Microsoft Graph with
        the signed-in context (Connect-MgGraph first; GCC uses the worldwide endpoint). Writes nothing
        to the tenant.
    .EXAMPLE
        Get-AmAppSnapshot -AppId 00001111-aaaa-2222-bbbb-3333cccc4444 -OutDir out/pack -Stage before -FixturePath tests/fixtures/identity
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$AppId,
        [Parameter(Mandatory)][string]$OutDir,
        [ValidateSet('before', 'after')][string]$Stage = 'before',
        [string]$FixturePath
    )
    New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
    if ($FixturePath) {
        foreach ($k in $script:SnapshotFiles.Keys) {
            Copy-Item -LiteralPath (Join-Path $FixturePath $Stage $script:SnapshotFiles[$k]) -Destination (Join-Path $OutDir "$Stage-$($script:SnapshotFiles[$k])")
        }
        $app = Read-AmJson -Path (Join-Path $OutDir "$Stage-application.json")
        if ($app.appId -ne $AppId) { throw "The fixture's application is $($app.appId), not $AppId." }
    } else {
        if (-not (Get-Command Get-MgContext -ErrorAction SilentlyContinue) -or -not (Get-MgContext)) {
            throw 'Not signed in to Microsoft Graph: run Connect-MgGraph first, or give -FixturePath.'
        }
        $app = Get-MgApplication -Filter "appId eq '$AppId'"
        $sp = Get-MgServicePrincipal -Filter "appId eq '$AppId'"
        if (-not $app -or -not $sp) { throw "No application and service principal for $AppId in this tenant." }
        $w = { param($v, $n) $v | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $OutDir "$Stage-$n") -Encoding utf8NoBOM }
        & $w (Get-MgApplication -ApplicationId $app.Id) 'application.json'
        & $w (Get-MgServicePrincipal -ServicePrincipalId $sp.Id) 'serviceprincipal.json'
        & $w @(Get-MgApplicationOwner -ApplicationId $app.Id -All | Select-Object Id, AdditionalProperties) 'owners.json'
        & $w @(Get-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $sp.Id -All) 'app-permissions.json'
        & $w @(Get-MgOauth2PermissionGrant -Filter "clientId eq '$($sp.Id)'" -All) 'delegated-grants.json'
        & $w @(Get-MgServicePrincipalAppRoleAssignedTo -ServicePrincipalId $sp.Id -All) 'assignments.json'
    }
    Get-AmSnapshotSummary -SnapshotDir $OutDir -Stage $Stage
}

function Get-AmSnapshotSummary {
    <#
    .SYNOPSIS
        One line per snapshot: owners, permissions, grants, assignments, redirect URIs, secrets and the assignment switch.
    .EXAMPLE
        Get-AmSnapshotSummary -SnapshotDir out/pack -Stage after
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$SnapshotDir, [ValidateSet('before', 'after')][string]$Stage = 'before')
    $s = Read-AmSnapshot -SnapshotDir $SnapshotDir -Stage $Stage
    [pscustomobject]@{
        Stage              = $Stage
        App                = $s.application.displayName
        Owners             = @($s.owners).Count
        AppPermissions     = @($s.'app-permissions').Count
        DelegatedGrants    = @($s.'delegated-grants').Count
        Assignments        = @($s.assignments).Count
        RedirectUris       = @(Get-AmRedirectUriList -Application $s.application).Count
        Secrets            = @($s.application.passwordCredentials).Count
        AssignmentRequired = [bool]$s.serviceprincipal.appRoleAssignmentRequired
    }
}

function Read-AmSnapshot {
    param([Parameter(Mandatory)][string]$SnapshotDir, [Parameter(Mandatory)][string]$Stage)
    $o = [ordered]@{}
    foreach ($k in $script:SnapshotFiles.Keys) {
        $p = Join-Path $SnapshotDir "$Stage-$($script:SnapshotFiles[$k])"
        if (-not (Test-Path -LiteralPath $p)) { throw "Missing $($p): take the $Stage snapshot first (Get-AmAppSnapshot)." }
        $o[$k] = Read-AmJson -Path $p
    }
    [pscustomobject]$o
}

function Get-AmProperty {
    param($Object, [string[]]$Names)
    $v = $Object
    foreach ($n in $Names) {
        if ($null -eq $v) { return $null }
        $p = $v.PSObject.Properties | Where-Object { $_.Name -ieq $n } | Select-Object -First 1
        $v = if ($p) { $p.Value } else { $null }
    }
    $v
}

function Get-AmRedirectUriList {
    param([Parameter(Mandatory)]$Application)
    foreach ($pl in @(@('web', 'web'), @('spa', 'spa'), @('publicClient', 'publicClient'))) {
        foreach ($u in @(Get-AmProperty $Application @($pl[1], 'redirectUris'))) {
            if ($u) { [pscustomobject]@{ Platform = $pl[0]; Uri = [string]$u } }
        }
    }
}

function Get-AmWorkPackage {
    <#
    .SYNOPSIS
        Which of Appendix A's six work packages the before snapshot says this application needs, and
        where each is built: WP1 to WP3 in the Non-Person Identity kit, WP4 to WP6 here.
    .EXAMPLE
        Get-AmWorkPackage -SnapshotDir out/pack -OwnedDomainsPath tests/fixtures/identity/owned-domains.txt -DnsPath tests/fixtures/identity/dns.json | Format-Table
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$SnapshotDir, [Parameter(Mandatory)][string]$OwnedDomainsPath, [string]$DnsPath)
    $s = Read-AmSnapshot -SnapshotDir $SnapshotDir -Stage before
    $owners = @($s.owners).Count
    $smr = Get-AmProperty $s.application @('serviceManagementReference')
    $tenantWide = @($s.'delegated-grants' | Where-Object { (Get-AmProperty $_ @('consentType')) -eq 'AllPrincipals' }).Count
    $userConsent = @($s.'delegated-grants' | Where-Object { (Get-AmProperty $_ @('consentType')) -eq 'Principal' }).Count
    $redirect = @(Test-AmRedirectUri -SnapshotDir $SnapshotDir -OwnedDomainsPath $OwnedDomainsPath -DnsPath $DnsPath | Where-Object Findings)
    $rows = @(
        @('WP1', 'Owner assignment', ($owners -lt 2 -or -not $smr), ("owners $owners; service record " + $(if ($smr) { $smr } else { 'none' })), 'Non-Person Identity workbook, Chapter 02'),
        @('WP2', 'Permission reduction', (@($s.'app-permissions').Count + $tenantWide -gt 0), "application permissions $(@($s.'app-permissions').Count); tenant-wide grants $tenantWide", 'Non-Person Identity workbook, Chapter 07'),
        @('WP3', 'Secret to managed identity', (@($s.application.passwordCredentials).Count -gt 0), "secrets $(@($s.application.passwordCredentials).Count)", 'Non-Person Identity workbook, Chapter 05'),
        @('WP4', 'Redirect URI cleanup', ($redirect.Count -gt 0), "URIs with findings $($redirect.Count)", 'This kit: Test-AmRedirectUri, New-AmRedirectPlan'),
        @('WP5', 'Assignment enforcement', (-not [bool]$s.serviceprincipal.appRoleAssignmentRequired), "assignment required $([bool]$s.serviceprincipal.appRoleAssignmentRequired); user consent grants $userConsent", 'This kit: New-AmAssignmentPlan'),
        @('WP6', 'Post-change test and evidence pack', $true, 'every application', 'This kit: Get-AmSignInCheck, Protect-AmEvidencePack')
    )
    foreach ($r in $rows) { [pscustomobject]@{ WorkPackage = $r[0]; Name = $r[1]; Needed = [bool]$r[2]; Why = $r[3]; BuiltIn = $r[4] } }
}

# ---------------------------------------------------------------------------------------------
# WP4: redirect URIs
# ---------------------------------------------------------------------------------------------

function Resolve-AmHost {
    <# Addresses and CNAME for a host: from the DNS fixture, or from the resolver. #>
    param([Parameter(Mandatory)][string]$HostName, $Dns)
    if ($Dns) {
        $e = Get-AmProperty $Dns @($HostName)
        if (-not $e) { return [pscustomobject]@{ Addresses = @(); Cname = $null } }
        $cname = Get-AmProperty $e @('cname')
        $addr = @(Get-AmProperty $e @('addresses'))
        if ($cname -and -not $addr) {
            $t = Get-AmProperty $Dns @($cname)
            $addr = if ($t) { @(Get-AmProperty $t @('addresses')) } else { @() }
        }
        return [pscustomobject]@{ Addresses = @($addr | Where-Object { $_ }); Cname = $cname }
    }
    $cname = $null
    if (Get-Command Resolve-DnsName -ErrorAction SilentlyContinue) {
        $cname = (Resolve-DnsName $HostName -Type CNAME -ErrorAction SilentlyContinue | Where-Object Type -eq 'CNAME' | Select-Object -First 1).NameHost
    }
    $addr = try { @([Net.Dns]::GetHostAddresses($HostName) | ForEach-Object { $_.ToString() }) } catch { @() }
    [pscustomobject]@{ Addresses = $addr; Cname = $cname }
}

function Test-AmRedirectUri {
    <#
    .SYNOPSIS
        WP4, step 1: every redirect URI on the application, tested against Appendix A's rules.
    .DESCRIPTION
        Findings: AM-RU-01 wildcard; AM-RU-02 http on a host that isn't loopback; AM-RU-03 host not on
        a domain the agency owns; AM-RU-04 host doesn't resolve; AM-RU-05 a CNAME whose target doesn't
        resolve (a possible dangling record: the domain owner checks it before anything else);
        AM-RU-06 loopback, a development URI that belongs on a separate registration (advisory).
        The owned-domain rule is Book 18 Chapter 02's: the host is the domain or ends with "." and it.
        Writes wp4-redirect-check.csv when -OutDir is given.
    .EXAMPLE
        Test-AmRedirectUri -SnapshotDir out/pack -OwnedDomainsPath tests/fixtures/identity/owned-domains.txt -DnsPath tests/fixtures/identity/dns.json -OutDir out/pack
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$SnapshotDir,
        [Parameter(Mandatory)][string]$OwnedDomainsPath,
        [ValidateSet('before', 'after')][string]$Stage = 'before',
        [string]$DnsPath,
        [string]$OutDir
    )
    $owned = @(Get-Content -LiteralPath $OwnedDomainsPath | ForEach-Object { $_.Trim().ToLowerInvariant() } | Where-Object { $_ -and -not $_.StartsWith('#') })
    $dns = if ($DnsPath) { Read-AmJson -Path $DnsPath } else { $null }
    $app = Read-AmJson -Path (Join-Path $SnapshotDir "$Stage-application.json")
    $rows = foreach ($u in Get-AmRedirectUriList -Application $app) {
        $h = if ($u.Uri -match '^[A-Za-z][A-Za-z0-9+.-]*://(?:[^@/]*@)?(\[[^\]]+\]|[^/:?#]+)') { $Matches[1].ToLowerInvariant() } else { '' }
        $loop = $h -in 'localhost', '127.0.0.1', '[::1]'
        $wild = $u.Uri.Contains('*')
        $http = $u.Uri -like 'http://*' -and -not $loop
        $own = $loop -or [bool]($owned | Where-Object { $h -eq $_ -or $h.EndsWith(".$_") })
        $r = if ($loop -or $wild -or -not $h) { [pscustomobject]@{ Addresses = @(); Cname = $null } } else { Resolve-AmHost -HostName $h -Dns $dns }
        $resolves = $loop -or @($r.Addresses).Count -gt 0
        $f = @()
        if ($wild) { $f += 'AM-RU-01' }
        if ($http) { $f += 'AM-RU-02' }
        if (-not $own) { $f += 'AM-RU-03' }
        if (-not $wild -and -not $resolves) { $f += 'AM-RU-04' }
        if ($r.Cname -and -not $resolves) { $f += 'AM-RU-05' }
        if ($loop) { $f += 'AM-RU-06' }
        [pscustomobject]@{
            Platform = $u.Platform; Uri = $u.Uri; Host = $h; Wildcard = $wild; InsecureHttp = $http
            OwnedDomain = $own; Resolves = $resolves; CnameTarget = [string]$r.Cname; Findings = ($f -join ' ')
        }
    }
    if ($OutDir) { @($rows) | Export-Csv -LiteralPath (Join-Path $OutDir 'wp4-redirect-check.csv') -NoTypeInformation -Encoding utf8NoBOM }
    $rows
}

function Get-AmPlanHash {
    <#
    .SYNOPSIS
        The SHA-256 of a plan file: the value the approver records, and Invoke-AmIdentityApply.ps1 checks.
    .EXAMPLE
        Get-AmPlanHash -Path out/pack/wp4-redirect-plan.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    Get-AmSha256 -Path $Path
}

function Save-AmPlan {
    param([Parameter(Mandatory)][System.Collections.Specialized.OrderedDictionary]$Plan, [Parameter(Mandatory)][string]$Path)
    Write-AmJson -Value ([pscustomobject]$Plan) -Path $Path
    [pscustomobject]@{ Plan = (Split-Path -Leaf $Path); Kind = $Plan.kind; Commands = @(Get-AmPlanCommand -PlanPath $Path).Count; PlanSha256 = Get-AmSha256 -Path $Path }
}

function New-AmRedirectPlan {
    <#
    .SYNOPSIS
        WP4, step 3, as a plan: the URIs to keep on each platform, the ones removed, and the plan's
        SHA-256. Refuses to keep a URI with a blocking finding (AM-RU-01 to -05). Changes nothing.
    .EXAMPLE
        New-AmRedirectPlan -SnapshotDir out/pack -CheckPath out/pack/wp4-redirect-check.csv -Keep 'https://cases.contoso.example/signin-oidc' -ChangeId CHG-0001 -OutDir out/pack
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$SnapshotDir,
        [Parameter(Mandatory)][string]$CheckPath,
        [Parameter(Mandatory)][AllowEmptyCollection()][string[]]$Keep,
        [Parameter(Mandatory)][string]$ChangeId,
        [Parameter(Mandatory)][string]$OutDir
    )
    $app = Read-AmJson -Path (Join-Path $SnapshotDir 'before-application.json')
    $sp = Read-AmJson -Path (Join-Path $SnapshotDir 'before-serviceprincipal.json')
    $check = @(Import-Csv -LiteralPath $CheckPath)
    foreach ($k in $Keep) {
        $row = $check | Where-Object Uri -ceq $k | Select-Object -First 1
        if (-not $row) { throw "AM-RU-PLAN: $k isn't on the application." }
        $blocking = @($row.Findings -split ' ' | Where-Object { $_ -and $_ -ne 'AM-RU-06' })
        if ($blocking) { throw "AM-RU-PLAN: $k can't be kept: $($blocking -join ', '). Fix the host, or remove the URI." }
    }
    $after = [ordered]@{ web = @(); spa = @(); publicClient = @() }
    foreach ($row in $check) { if ($row.Uri -cin $Keep) { $after[$row.Platform] += $row.Uri } }
    $plan = [ordered]@{
        kind = 'wp4-redirect-uris'; appId = $app.appId; applicationObjectId = $app.id; servicePrincipalObjectId = $sp.id
        changeId = $ChangeId
        before = [ordered]@{ web = @(Get-AmProperty $app @('web', 'redirectUris')); spa = @(Get-AmProperty $app @('spa', 'redirectUris')); publicClient = @(Get-AmProperty $app @('publicClient', 'redirectUris')) }
        after = $after
        removed = @($check | Where-Object { $_.Uri -cnotin $Keep } | ForEach-Object Uri)
    }
    Save-AmPlan -Plan $plan -Path (Join-Path $OutDir 'wp4-redirect-plan.json')
}

function Test-AmOAuthRegression {
    <#
    .SYNOPSIS
        WP4, step 4: start a sign-in with each kept web or SPA URI and expect it accepted; with each
        removed one and expect AADSTS50011. Writes wp4-oauth-regression.csv.
    .DESCRIPTION
        With -FixturePath, reads the identity platform's answer for each URI from that JSON file.
        Without it, requests https://login.microsoftonline.com/<tenant>/oauth2/v2.0/authorize (GCC uses
        the worldwide sign-in endpoint) and follows no redirect. This proves registration only; the
        technical owner still completes one real sign-in through each kept URI.
    .EXAMPLE
        Test-AmOAuthRegression -PlanPath out/pack/wp4-redirect-plan.json -TenantId aaaabbbb-0000-cccc-1111-dddd2222eeee -FixturePath tests/fixtures/identity/oauth-responses.json -OutDir out/pack
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$PlanPath,
        [Parameter(Mandatory)][string]$TenantId,
        [string]$FixturePath,
        [Parameter(Mandatory)][string]$OutDir
    )
    $plan = Read-AmJson -Path $PlanPath
    $fx = if ($FixturePath) { Read-AmJson -Path $FixturePath } else { $null }
    $tests = @()
    foreach ($u in @($plan.after.web) + @($plan.after.spa)) { if ($u) { $tests += [pscustomobject]@{ Uri = $u; Expected = 'accepted' } } }
    foreach ($u in @($plan.removed)) { if ($u -and $u -notmatch '\*') { $tests += [pscustomobject]@{ Uri = $u; Expected = 'AADSTS50011' } } }
    $rows = foreach ($t in $tests) {
        $body = if ($fx) {
            [string](Get-AmProperty $fx @($t.Uri))
        } else {
            $url = "https://login.microsoftonline.com/$TenantId/oauth2/v2.0/authorize?client_id=$($plan.appId)&response_type=code&scope=openid&redirect_uri=$([uri]::EscapeDataString($t.Uri))&state=regression"
            (Invoke-WebRequest -Uri $url -MaximumRedirection 0 -SkipHttpErrorCheck -ErrorAction SilentlyContinue).Content
        }
        $observed = if ($body -match 'AADSTS50011') { 'AADSTS50011' } else { 'accepted' }
        [pscustomobject]@{ Uri = $t.Uri; Expected = $t.Expected; Observed = $observed; Pass = ($observed -eq $t.Expected) }
    }
    @($rows) | Export-Csv -LiteralPath (Join-Path $OutDir 'wp4-oauth-regression.csv') -NoTypeInformation -Encoding utf8NoBOM
    $rows
}

# ---------------------------------------------------------------------------------------------
# WP5: assignment
# ---------------------------------------------------------------------------------------------

function New-AmAssignmentPlan {
    <#
    .SYNOPSIS
        WP5 as a plan: assign the reviewed groups and client applications first, then require assignment.
    .DESCRIPTION
        -AssignmentsPath is a reviewed JSON list of { principalId, principalType (Group or
        ServicePrincipal), appRoleId, reason }. Refuses (AM-AS-01) when the plan would require
        assignment with nobody assigned; refuses (AM-AS-02) while user consent grants exist, because
        user consent isn't allowed once assignment is required: grant admin consent for what WP2
        kept first. AM-AS-03 notes that assignment is already required. Changes nothing.
    .EXAMPLE
        New-AmAssignmentPlan -SnapshotDir out/pack -AssignmentsPath tests/fixtures/identity/reviewed-assignments.json -ChangeId CHG-0001 -OutDir out/pack
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$SnapshotDir,
        [Parameter(Mandatory)][string]$AssignmentsPath,
        [Parameter(Mandatory)][string]$ChangeId,
        [Parameter(Mandatory)][string]$OutDir
    )
    $s = Read-AmSnapshot -SnapshotDir $SnapshotDir -Stage before
    $planned = Read-AmJson -Path $AssignmentsPath; $planned = @($planned)
    $existing = @($s.assignments | ForEach-Object { "$(Get-AmProperty $_ @('principalId'))|$(Get-AmProperty $_ @('appRoleId'))" })
    $new = @($planned | Where-Object { "$($_.principalId)|$($_.appRoleId)" -notin $existing })
    foreach ($a in $planned) {
        if ($a.principalType -notin 'Group', 'ServicePrincipal') { throw "AM-AS-PLAN: $($a.principalId) is a $($a.principalType); assign groups or client applications, not single users." }
        if (-not $a.reason) { throw "AM-AS-PLAN: $($a.principalId) has no reason." }
    }
    if (@($s.assignments).Count + $new.Count -eq 0) { throw 'AM-AS-01: nobody would be assigned. Requiring assignment now would refuse every user and client.' }
    $user = @($s.'delegated-grants' | Where-Object { (Get-AmProperty $_ @('consentType')) -eq 'Principal' })
    if ($user) { throw "AM-AS-02: $($user.Count) user consent grant(s) exist. Grant tenant-wide admin consent for the permissions WP2 kept, then plan again." }
    $plan = [ordered]@{
        kind = 'wp5-assignment'; appId = $s.application.appId; servicePrincipalObjectId = $s.serviceprincipal.id; changeId = $ChangeId
        alreadyRequired = [bool]$s.serviceprincipal.appRoleAssignmentRequired
        assign = @($new | ForEach-Object { [ordered]@{ principalId = $_.principalId; principalType = $_.principalType; appRoleId = $_.appRoleId; reason = $_.reason } })
        requireAssignment = $true
        notes = @(if ($s.serviceprincipal.appRoleAssignmentRequired) { 'AM-AS-03: assignment is already required; the plan only adds assignments.' })
    }
    Save-AmPlan -Plan $plan -Path (Join-Path $OutDir 'wp5-assignment-plan.json')
}

function New-AmRollbackPlan {
    <#
    .SYNOPSIS
        Appendix A's rollback for WP4 and WP5, from the before snapshot: the redirect URI lists as they
        were, and assignment as it was. Never restored: a URI on a domain that failed the ownership check
        (AM-RU-03, Appendix A's rule), or one whose CNAME target doesn't resolve (AM-RU-05, the kit's
        rule: a possible dangling record someone else could claim).
    .EXAMPLE
        New-AmRollbackPlan -SnapshotDir out/pack -CheckPath out/pack/wp4-redirect-check.csv -ChangeId CHG-0001 -OutDir out/pack
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$SnapshotDir, [Parameter(Mandatory)][string]$CheckPath,
          [Parameter(Mandatory)][string]$ChangeId, [Parameter(Mandatory)][string]$OutDir)
    $app = Read-AmJson -Path (Join-Path $SnapshotDir 'before-application.json')
    $sp = Read-AmJson -Path (Join-Path $SnapshotDir 'before-serviceprincipal.json')
    $notOwned = @(Import-Csv -LiteralPath $CheckPath | Where-Object { $_.Findings -match 'AM-RU-03|AM-RU-05' } | ForEach-Object Uri)
    $lists = [ordered]@{}
    foreach ($pl in 'web', 'spa', 'publicClient') { $lists[$pl] = @(@(Get-AmProperty $app @($pl, 'redirectUris')) | Where-Object { $_ -and $_ -cnotin $notOwned }) }
    $plan = [ordered]@{
        kind = 'rollback'; appId = $app.appId; applicationObjectId = $app.id; servicePrincipalObjectId = $sp.id; changeId = $ChangeId
        restoreRedirectUris = $lists; notRestored = $notOwned
        appRoleAssignmentRequired = [bool]$sp.appRoleAssignmentRequired
    }
    Save-AmPlan -Plan $plan -Path (Join-Path $OutDir 'rollback-plan.json')
}

function Get-AmPlanCommand {
    <#
    .SYNOPSIS
        The Microsoft Graph PowerShell commands a plan runs, in order: each as a cmdlet name and its
        parameters (what Invoke-AmIdentityApply.ps1 runs), and as text (what the dry run prints).
    .EXAMPLE
        (Get-AmPlanCommand -PlanPath out/pack/wp5-assignment-plan.json).Text
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$PlanPath)
    $p = Read-AmJson -Path $PlanPath
    $q = { param($v) "'" + ([string]$v).Replace("'", "''") + "'" }
    $list = { param($v) '@(' + ((@($v) | Where-Object { $_ } | ForEach-Object { & $q $_ }) -join ', ') + ')' }
    $uris = { param($v) [string[]]@(@($v) | Where-Object { $_ }) }
    $cmd = { param($name, $params, $text) [pscustomobject]@{ Cmdlet = $name; Parameters = $params; Text = $text } }
    $redirect = {
        param($appObjectId, $lists)
        $params = @{ ApplicationId = $appObjectId; Web = @{ RedirectUris = (& $uris $lists.web) }; Spa = @{ RedirectUris = (& $uris $lists.spa) }; PublicClient = @{ RedirectUris = (& $uris $lists.publicClient) } }
        $text = "Update-MgApplication -ApplicationId $(& $q $appObjectId) -Web @{ RedirectUris = $(& $list $lists.web) } -Spa @{ RedirectUris = $(& $list $lists.spa) } -PublicClient @{ RedirectUris = $(& $list $lists.publicClient) }"
        & $cmd 'Update-MgApplication' $params $text
    }
    switch ($p.kind) {
        'wp4-redirect-uris' { & $redirect $p.applicationObjectId $p.after }
        'wp5-assignment' {
            foreach ($a in @($p.assign)) {
                $params = @{ ServicePrincipalId = $p.servicePrincipalObjectId; BodyParameter = @{ principalId = $a.principalId; resourceId = $p.servicePrincipalObjectId; appRoleId = $a.appRoleId } }
                $text = "New-MgServicePrincipalAppRoleAssignedTo -ServicePrincipalId $(& $q $p.servicePrincipalObjectId) -BodyParameter @{ principalId = $(& $q $a.principalId); resourceId = $(& $q $p.servicePrincipalObjectId); appRoleId = $(& $q $a.appRoleId) }"
                & $cmd 'New-MgServicePrincipalAppRoleAssignedTo' $params $text
            }
            if ($p.requireAssignment -and -not $p.alreadyRequired) {
                $params = @{ ServicePrincipalId = $p.servicePrincipalObjectId; AppRoleAssignmentRequired = $true }
                & $cmd 'Update-MgServicePrincipal' $params "Update-MgServicePrincipal -ServicePrincipalId $(& $q $p.servicePrincipalObjectId) -AppRoleAssignmentRequired:`$true"
            }
        }
        'rollback' {
            & $redirect $p.applicationObjectId $p.restoreRedirectUris
            $v = [bool]$p.appRoleAssignmentRequired
            $params = @{ ServicePrincipalId = $p.servicePrincipalObjectId; AppRoleAssignmentRequired = $v }
            & $cmd 'Update-MgServicePrincipal' $params "Update-MgServicePrincipal -ServicePrincipalId $(& $q $p.servicePrincipalObjectId) -AppRoleAssignmentRequired:`$$($v.ToString().ToLowerInvariant())"
        }
        default { throw "Unknown plan kind '$($p.kind)'." }
    }
}

# ---------------------------------------------------------------------------------------------
# WP6: post-change test and the evidence pack
# ---------------------------------------------------------------------------------------------

function Get-AmSignInCheck {
    <#
    .SYNOPSIS
        WP6, step 1: the application's sign-ins since the change, and any error code that began with it.
    .DESCRIPTION
        An error code seen after -ChangeTime but not in the same length of time before it is a backout
        trigger until explained. -Explained lists codes the change was meant to produce (AADSTS50105
        for an unassigned test user after WP5). With -FixturePath, reads a JSON list of sign-ins;
        without it, reads Graph beta (Get-MgBetaAuditLogSignIn; Entra ID P1 or P2). Writes
        wp6-signins-after.csv and wp6-backout-triggers.csv.
    .EXAMPLE
        Get-AmSignInCheck -AppId 00001111-aaaa-2222-bbbb-3333cccc4444 -ChangeTime 2026-11-18T14:00:00Z -OutDir out/pack -FixturePath tests/fixtures/identity/signins.json -Explained 50105
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$AppId,
        [Parameter(Mandatory)][string]$ChangeTime,
        [Parameter(Mandatory)][string]$OutDir,
        [string]$FixturePath,
        [int[]]$Explained = @()
    )
    $change = [DateTimeOffset]::Parse($ChangeTime, $script:Inv)
    if ($FixturePath) {
        $fxRows = Read-AmJson -Path $FixturePath; $all = @(@($fxRows) | Where-Object { $_.appId -eq $AppId })
    } else {
        $since = $change.AddDays(-7).UtcDateTime.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", $script:Inv)
        $all = @(Get-MgBetaAuditLogSignIn -Filter "appId eq '$AppId' and createdDateTime ge $since" -All | ForEach-Object {
            [pscustomobject]@{ createdDateTime = $_.CreatedDateTime.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", $script:Inv)
                appId = $AppId; errorCode = [int]$_.Status.ErrorCode; clientCredentialType = $_.ClientCredentialType; principal = $_.UserId } })
    }
    $rows = foreach ($s in $all) {
        $t = [DateTimeOffset]::Parse([string]$s.createdDateTime, $script:Inv)
        [pscustomobject]@{ CreatedDateTime = [string]$s.createdDateTime; After = ($t -ge $change); Error = [int]$s.errorCode
            ClientCredentialType = [string]$s.clientCredentialType; Principal = [string]$s.principal }
    }
    $after = @($rows | Where-Object After)
    $before = @($rows | Where-Object { -not $_.After })
    $after | Select-Object CreatedDateTime, Error, ClientCredentialType, Principal |
        Export-Csv -LiteralPath (Join-Path $OutDir 'wp6-signins-after.csv') -NoTypeInformation -Encoding utf8NoBOM
    $beforeCodes = @($before | ForEach-Object Error | Sort-Object -Unique)
    $triggers = foreach ($g in $after | Where-Object { $_.Error -ne 0 } | Group-Object Error) {
        $code = [int]$g.Name
        $new = $code -notin $beforeCodes
        [pscustomobject]@{
            Error = $code; SignIns = $g.Count; NewSinceChange = $new; Explained = ($code -in $Explained)
            BackoutTrigger = ($new -and $code -notin $Explained)
        }
    }
    @($triggers) | Export-Csv -LiteralPath (Join-Path $OutDir 'wp6-backout-triggers.csv') -NoTypeInformation -Encoding utf8NoBOM
    [pscustomobject]@{ SignInsAfter = $after.Count; Failures = @($after | Where-Object { $_.Error -ne 0 }).Count
        Triggers = @($triggers | Where-Object BackoutTrigger | ForEach-Object Error) -join ' ' }
}

function New-AmTestRecord {
    <#
    .SYNOPSIS
        WP6, step 4: the regression test record, with the change, the work packages, expected and observed outcomes.
    .EXAMPLE
        New-AmTestRecord -AppId 00001111-aaaa-2222-bbbb-3333cccc4444 -ChangeId CHG-0001 -WorkPackages WP4, WP5, WP6 -Expected 'as planned' -Observed 'as planned' -Tester 'technical owner' -Date 2026-11-19 -OutDir out/pack
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$AppId, [Parameter(Mandatory)][string]$ChangeId,
        [Parameter(Mandatory)][string[]]$WorkPackages, [Parameter(Mandatory)][string]$Expected,
        [Parameter(Mandatory)][string]$Observed, [Parameter(Mandatory)][string]$Tester,
        [Parameter(Mandatory)][string]$Date, [Parameter(Mandatory)][string]$OutDir
    )
    $r = [pscustomobject]@{ AppId = $AppId; Change = $ChangeId; WorkPackages = ($WorkPackages -join ' '); Expected = $Expected; Observed = $Observed; Tester = $Tester; Date = $Date }
    $r | Export-Csv -LiteralPath (Join-Path $OutDir 'test-record.csv') -NoTypeInformation -Encoding utf8NoBOM
    $r
}

function Protect-AmEvidencePack {
    <#
    .SYNOPSIS
        WP6, step 4: seal the pack. Writes SHA256SUMS.txt over every other file in the folder, sorted by name.
        Refuses a pack missing a before or after snapshot file or the test record.
    .EXAMPLE
        Protect-AmEvidencePack -OutDir out/pack
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$OutDir)
    $need = @('test-record.csv') + @(foreach ($st in 'before', 'after') { foreach ($f in $script:SnapshotFiles.Values) { "$st-$f" } })
    $missing = @($need | Where-Object { -not (Test-Path -LiteralPath (Join-Path $OutDir $_)) })
    if ($missing) { throw "AM-PACK-01: the pack is missing $($missing -join ', ')." }
    $lines = Get-ChildItem -LiteralPath $OutDir -File | Where-Object Name -ne 'SHA256SUMS.txt' | Sort-Object Name |
        ForEach-Object { '{0}  {1}' -f (Get-AmSha256 -Path $_.FullName), $_.Name }
    [IO.File]::WriteAllText($ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath((Join-Path $OutDir "SHA256SUMS.txt")), (($lines -join "`n") + "`n"), [Text.UTF8Encoding]::new($false))
    [pscustomobject]@{ Files = @($lines).Count; Manifest = 'SHA256SUMS.txt'; ManifestSha256 = Get-AmSha256 -Path (Join-Path $OutDir 'SHA256SUMS.txt') }
}

function Test-AmEvidencePack {
    <#
    .SYNOPSIS
        Re-hashes every file a sealed pack lists, and reports any changed, missing or unlisted file.
    .EXAMPLE
        Test-AmEvidencePack -OutDir out/pack | Where-Object State -ne 'ok'
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$OutDir)
    $listed = @{}
    foreach ($l in Get-Content -LiteralPath (Join-Path $OutDir 'SHA256SUMS.txt')) {
        if ($l -match '^([0-9a-f]{64})  (.+)$') { $listed[$Matches[2]] = $Matches[1] }
    }
    $files = @(Get-ChildItem -LiteralPath $OutDir -File | Where-Object Name -ne 'SHA256SUMS.txt' | ForEach-Object Name)
    foreach ($n in @($listed.Keys) + $files | Sort-Object -Unique) {
        $state = if ($n -notin $files) { 'missing' } elseif (-not $listed.ContainsKey($n)) { 'unlisted' }
                 elseif ((Get-AmSha256 -Path (Join-Path $OutDir $n)) -ne $listed[$n]) { 'changed' } else { 'ok' }
        [pscustomobject]@{ File = $n; State = $state }
    }
}

# ---------------------------------------------------------------------------------------------
# Evidence records for every step of the kit
# ---------------------------------------------------------------------------------------------

function Get-AmRequirement {
    <#
    .SYNOPSIS
        A kit step's federal requirements: the SP 800-53 controls it supports, the FedRAMP 20x KSIs it
        aligns to, and other federal requirements, from config/requirements.json.
    .EXAMPLE
        Get-AmRequirement -Step WP6
    #>
    [CmdletBinding()]
    param([string]$Step, [string]$ConfigPath = (Join-Path $script:KitRoot 'config/requirements.json'))
    $c = Read-AmJson -Path $ConfigPath
    foreach ($p in $c.steps.PSObject.Properties) {
        if ($Step -and $p.Name -ne $Step) { continue }
        [pscustomobject]@{ Step = $p.Name; Title = $p.Value.title; Controls = ($p.Value.controls -join ' '); KSIs = ($p.Value.ksis -join ' '); Other = ($p.Value.other -join '; ') }
    }
}

function Write-AmEvidenceRecord {
    <#
    .SYNOPSIS
        One evidence record for one run of one kit step: the step's controls and KSIs, every output
        file with its SHA-256, and the SHA-256 of the record before it in the folder (a hash chain).
    .EXAMPLE
        Write-AmEvidenceRecord -Step WP6 -Path out/pack/SHA256SUMS.txt -OutputPath out/evidence
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Step,
        [Parameter(Mandatory)][string[]]$Path,
        [Parameter(Mandatory)][string]$OutputPath,
        [string]$AsOf = ([DateTime]::UtcNow.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", [Globalization.CultureInfo]::InvariantCulture)),
        [string]$ConfigPath = (Join-Path $script:KitRoot 'config/requirements.json')
    )
    $req = Get-AmRequirement -Step $Step -ConfigPath $ConfigPath
    if (-not $req) { throw "AM-EV-01: no step '$Step' in $ConfigPath." }
    $cfg = (Read-AmJson -Path $ConfigPath).steps.$Step
    $files = foreach ($p in $Path) {
        if (-not (Test-Path -LiteralPath $p -PathType Leaf)) { throw "AM-EV-02: $p doesn't exist; run the step first." }
        [ordered]@{ path = ($p -replace '\\', '/'); sha256 = Get-AmSha256 -Path $p; bytes = (Get-Item -LiteralPath $p).Length }
    }
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $prior = @(Get-ChildItem -LiteralPath $OutputPath -Filter 'record-*.json' | Sort-Object Name)
    $seq = $prior.Count + 1
    $record = [ordered]@{
        record = $seq; step = $Step; title = $cfg.title; asOf = $AsOf
        controls = @($cfg.controls); ksis = @($cfg.ksis); other = @($cfg.other)
        files = @($files)
        previous = if ($prior) { Get-AmSha256 -Path $prior[-1].FullName } else { $null }
        note = 'The files support these controls; the agency''s assessor decides them. KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its own evidence up with them.'
    }
    $out = Join-Path $OutputPath ('record-{0:D3}-{1}.json' -f $seq, $Step)
    Write-AmJson -Value ([pscustomobject]$record) -Path $out
    [pscustomobject]@{ Record = (Split-Path -Leaf $out); Step = $Step; Files = @($files).Count; Controls = ($cfg.controls -join ' '); KSIs = ($cfg.ksis -join ' '); Other = (@($cfg.other) -join '; '); Sha256 = Get-AmSha256 -Path $out }
}

function Test-AmEvidenceChain {
    <#
    .SYNOPSIS
        Checks every record in a folder: each file it lists still has its hash, and each record names the one before it.
    .EXAMPLE
        Test-AmEvidenceChain -Path out/evidence
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [string]$BasePath = '.')
    $prev = $null
    foreach ($f in Get-ChildItem -LiteralPath $Path -Filter 'record-*.json' | Sort-Object Name) {
        $r = Read-AmJson -Path $f.FullName
        $chain = ($r.previous -eq $prev)
        $changed = @($r.files | Where-Object { $p = Join-Path $BasePath $_.path; -not (Test-Path -LiteralPath $p) -or (Get-AmSha256 -Path $p) -ne $_.sha256 } | ForEach-Object path)
        [pscustomobject]@{ Record = $f.Name; Step = $r.step; ChainOk = $chain; FilesOk = ($changed.Count -eq 0); Changed = ($changed -join ' ') }
        $prev = Get-AmSha256 -Path $f.FullName
    }
}

Export-ModuleMember -Function Read-AmJson, Get-AmSha256, Get-AmTestResult, Get-AmVitestResult, Get-AmContractOperation,
    Get-AmValidationSummary, Get-AmAppSnapshot, Get-AmSnapshotSummary, Get-AmWorkPackage, Test-AmRedirectUri,
    Get-AmPlanHash, New-AmRedirectPlan, Test-AmOAuthRegression, New-AmAssignmentPlan, New-AmRollbackPlan,
    Get-AmPlanCommand, Get-AmSignInCheck, New-AmTestRecord, Protect-AmEvidencePack, Test-AmEvidencePack,
    Get-AmRequirement, Write-AmEvidenceRecord, Test-AmEvidenceChain
