#Requires -Version 7.1
<#
    PaDeploy: the deployment runbook's own code for the developer workbook "Building Privileged
    Access", Chapter 09. It takes the kit from Lab 2 to a live test tenant, then to production.

    One environment settings file drives every step. This module reads it and refuses secrets
    and unfilled placeholders, writes each earlier chapter's input files from it, runs the
    pre-flight checks (licenses, the emergency access accounts and their exclusion from every
    Conditional Access policy), reads the smoke test's evidence, and plans the rollback.

    Its own calls are GETs declared in deploy/calls-deploy.json. It never writes to a tenant:
    the writes are the earlier chapters' entry scripts, which the rollback plan names and, with
    -Apply, runs. Illustrative: tested against fixtures and a fake, never run against a live
    tenant.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:KitRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Import-Module (Join-Path $script:KitRoot 'powershell/PrivilegedAccess/PrivilegedAccess.psm1')

$script:Guid = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
$script:Placeholder = '<[a-z0-9][a-z0-9-]*>'
# Keys that would hold a secret. The settings file names identities; it never holds a credential.
$script:SecretKey = '(?i)(secret|password|passwd|privatekey|private_key|pfx|apikey|api_key|accesstoken|refreshtoken|clientassertion|connectionstring)'
# Service plans that license PIM (Learn: Microsoft Entra ID P2 or Microsoft Entra ID Governance).
$script:PimPlans = [ordered]@{
    'eec0eb4f-6444-4f95-aba0-50c24d67f998' = 'AAD_PREMIUM_P2'
    'e866a266-3cff-43a3-acca-0c90a7e00c8b' = 'Entra_Identity_Governance'
}
# PIM activity names in the directory audit log (Chapter 08's list, from Learn).
$script:Activity = @{
    Requested   = 'Add member to role requested (PIM activation)'
    Approved    = 'Add member to role request approved (PIM activation)'
    Completed   = 'Add member to role completed (PIM activation)'
    Expired     = 'Remove member from role (PIM activation expired)'
}
$script:PimService = @('Privileged Identity Management', 'PIM')

function Get-PaDeployValue { param($Hash, [string]$Key) if ($Hash -is [Collections.IDictionary] -and $Hash.Contains($Key)) { $Hash[$Key] } else { $null } }

function New-PaDeployFinding {
    param([string]$Rule, [ValidateSet('Finding', 'Warn', 'Info')][string]$Severity, [string]$Object, [string]$Issue)
    [pscustomobject]@{ Rule = $Rule; Severity = $Severity; Object = $Object; Issue = $Issue }
}

function Write-PaDeployJson {
    param([string]$Path, $Value)
    [IO.File]::WriteAllText($Path, (ConvertTo-Json -InputObject $Value -Depth 50) + "`n", [Text.UTF8Encoding]::new($false))
}

function Resolve-PaDeployPath {
    param([string]$Path)
    $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Path)
}

# ----------------------------------------------------------------------------- calls and permissions

function Get-PaDeployCall {
    <#
    .SYNOPSIS
        Returns the calls the runbook's own scripts may send (deploy/calls-deploy.json),
        optionally only those for one task: preflight or smoke. Every one is a GET.
    .EXAMPLE
        # The ids of the calls the smoke test sends.
        Get-PaDeployCall -Task smoke | ForEach-Object { $_.id }
    #>
    [CmdletBinding()]
    param([ValidateSet('preflight', 'smoke')][string]$Task)
    $all = @((Get-Content -LiteralPath (Join-Path $PSScriptRoot 'calls-deploy.json') -Raw | ConvertFrom-Json -AsHashtable).calls)
    if ($Task) { $all = @($all | Where-Object { $_.tasks -contains $Task }) }
    , $all
}

function Get-PaDeployRequiredPermission {
    <#
    .SYNOPSIS
        Returns the Graph application permissions a runbook task needs: preflight (the license
        read plus Chapter 02's emergency access check) or smoke (the activation, audit and access
        review reads). Each is the least-privileged permission for its call.
    .EXAMPLE
        # The permissions to grant the reader app before the pre-flight checks.
        (Get-PaDeployRequiredPermission -Task preflight).GraphPermissions -join ', '
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][ValidateSet('preflight', 'smoke')][string]$Task)
    $perms = @(Get-PaDeployCall -Task $Task | ForEach-Object { $_.permissions })
    if ($Task -eq 'preflight') { $perms += @((Get-PaRequiredPermission -Task emergency-access).GraphPermissions) }
    [pscustomobject]@{ Task = $Task; GraphPermissions = @($perms | Sort-Object -Unique) }
}

# ----------------------------------------------------------------------------- the settings file

function Read-PaDeploySettings {
    <#
    .SYNOPSIS
        Reads one environment settings file (deploy/environment.template.json, filled in) and
        returns it as a hashtable. Throws when a required key is missing or the cloud is not
        named. Use Test-PaDeploySettings for the checks that report rather than throw.
    .EXAMPLE
        # The fixture settings for the fictional test tenant.
        $s = Read-PaDeploySettings -Path deploy/tests/fixtures/environment.test.json
        $s.environment
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $s = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 50
    foreach ($k in 'environment', 'changeRecord', 'cloud', 'tenantId', 'outputRoot', 'identity', 'emergencyAccess', 'conditionalAccess', 'pimRoles', 'pimGroups', 'azure', 'accessReviews', 'smokeTest') {
        if (-not $s.ContainsKey($k) -or $null -eq $s[$k]) { throw "Settings file: '$k' is required" }
    }
    $null = Get-PaCloud -Cloud $s.cloud      # throws for an unknown cloud; there is no default
    $s
}

function Get-PaDeployLeaf {
    # Every (path, key, value) leaf in the settings, for the secret and placeholder checks.
    param($Node, [string]$Path = '$')
    if ($Node -is [Collections.IDictionary]) {
        foreach ($k in $Node.Keys) {
            [pscustomobject]@{ Path = "$Path.$k"; Key = [string]$k; Value = $Node[$k]; IsLeaf = $false }
            Get-PaDeployLeaf -Node $Node[$k] -Path "$Path.$k"
        }
    } elseif ($Node -is [Collections.IList]) {
        for ($i = 0; $i -lt $Node.Count; $i++) { Get-PaDeployLeaf -Node $Node[$i] -Path "$Path[$i]" }
    } else {
        [pscustomobject]@{ Path = $Path; Key = ''; Value = $Node; IsLeaf = $true }
    }
}

function Test-PaDeploySettings {
    <#
    .SYNOPSIS
        Checks a settings file before anything reads the tenant: PA-DEP-01 a key that would hold
        a secret, or a deployment identity without a certificate or federated credential;
        PA-DEP-02 a placeholder left unfilled; PA-DEP-08 no change record for production, or an
        environment other than test or production. Returns findings; never throws for these.
    .EXAMPLE
        # The template itself: every placeholder is reported.
        $s = Read-PaDeploySettings -Path deploy/environment.template.json
        Test-PaDeploySettings -Settings $s | Group-Object Rule | Select-Object Name, Count
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings)
    $f = [Collections.Generic.List[object]]::new()
    foreach ($l in @(Get-PaDeployLeaf -Node $Settings)) {
        if ($l.Path -match '\._comment$' -or $l.Path -match '\._comment\[') { continue }
        if (-not $l.IsLeaf -and $l.Key -match $script:SecretKey) {
            $f.Add((New-PaDeployFinding 'PA-DEP-01' 'Finding' $l.Path 'A key that would hold a secret: the settings file names identities and never holds a credential'))
        }
        if ($l.IsLeaf -and $l.Value -is [string]) {
            if ($l.Value -match '-----BEGIN') { $f.Add((New-PaDeployFinding 'PA-DEP-01' 'Finding' $l.Path 'Key material in the settings file')) }
            if ($l.Value -match $script:Placeholder) { $f.Add((New-PaDeployFinding 'PA-DEP-02' 'Finding' $l.Path "Placeholder not filled in: $($Matches[0])")) }
        }
    }
    $id = $Settings.identity
    $cred = Get-PaDeployValue $id 'credential'
    if ($cred -eq 'certificate') {
        $tp = [string](Get-PaDeployValue $id 'certificateThumbprint')
        if ($tp -notmatch '^[0-9A-Fa-f]{40}$' -and $tp -notmatch $script:Placeholder) {
            $f.Add((New-PaDeployFinding 'PA-DEP-01' 'Finding' '$.identity.certificateThumbprint' 'Not a 40-character certificate thumbprint'))
        }
    } elseif ($cred -ne 'federated') {
        $f.Add((New-PaDeployFinding 'PA-DEP-01' 'Finding' '$.identity.credential' "Use 'certificate' or 'federated'; a client secret isn't accepted"))
    }
    if ($Settings.environment -notin 'test', 'production' -and $Settings.environment -notmatch $script:Placeholder) {
        $f.Add((New-PaDeployFinding 'PA-DEP-08' 'Finding' '$.environment' "Environment must be 'test' or 'production'"))
    }
    if ($Settings.environment -eq 'production' -and (-not $Settings.changeRecord -or $Settings.changeRecord -match $script:Placeholder)) {
        $f.Add((New-PaDeployFinding 'PA-DEP-08' 'Finding' '$.changeRecord' 'Production needs an approved change record before any step runs'))
    }
    $f.ToArray()
}

# ----------------------------------------------------------------------------- the input files

function New-PaDeployInputs {
    <#
    .SYNOPSIS
        Writes every earlier chapter's input files for one environment from its settings file,
        into <outputRoot>/inputs: emergency-access.json, emergency-validations.csv and
        exceptions.csv (Chapter 02 and 04), ca-map.json and a copy of ca-policies (Chapter 03),
        pim-roles, pim-bindings.json and confirmed-activations.csv (Chapter 04), prv-groups.json
        (Chapter 05), azure-desired.json (Chapter 06) and access-reviews.json (Chapter 07), with
        a manifest of their SHA-256. Refuses a settings file with any PA-DEP-01 or PA-DEP-02.
    .EXAMPLE
        # Write the fictional test tenant's inputs to out/deploy-test/inputs.
        $s = Read-PaDeploySettings -Path deploy/tests/fixtures/environment.test.json
        New-PaDeployInputs -Settings $s -OutputPath out/deploy-test/inputs
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$OutputPath)
    $blocking = @(Test-PaDeploySettings -Settings $Settings | Where-Object { $_.Rule -in 'PA-DEP-01', 'PA-DEP-02' })
    if ($blocking.Count) { throw "Settings file isn't ready: $($blocking.Count) finding(s), first $($blocking[0].Rule) at $($blocking[0].Object): $($blocking[0].Issue)" }
    $out = Resolve-PaDeployPath $OutputPath
    if (Test-Path -LiteralPath $out) { Remove-Item -LiteralPath $out -Recurse -Force }
    New-Item -ItemType Directory -Force -Path $out | Out-Null
    $utf8 = [Text.UTF8Encoding]::new($false)
    $ea = $Settings.emergencyAccess

    Write-PaDeployJson (Join-Path $out 'emergency-access.json') ([ordered]@{
            accounts = @($ea.accounts | ForEach-Object { [ordered]@{ id = $_.id; userPrincipalName = $_.userPrincipalName } })
            exclusionGroupId = $ea.exclusionGroupId; minimumAccounts = $ea.minimumAccounts; maxValidationAgeDays = $ea.maxValidationAgeDays
        })
    $val = @('AccountId,Date,Result,Ticket') + @($ea.validations | ForEach-Object { "$($_.accountId),$($_.date),$($_.result),$($_.ticket)" })
    [IO.File]::WriteAllText((Join-Path $out 'emergency-validations.csv'), ($val -join "`n") + "`n", $utf8)
    $exc = @('PrincipalId,Name,Reason,Owner')
    $i = 0
    foreach ($a in $ea.accounts) { $i++; $exc += "$($a.id),Emergency Access $('{0:D2}' -f $i),Emergency access account,$($ea.owner)" }
    foreach ($x in @(Get-PaDeployValue $Settings.pimRoles 'exceptions')) { if ($x) { $exc += "$($x.principalId),$($x.name),$($x.reason),$($x.owner)" } }
    [IO.File]::WriteAllText((Join-Path $out 'exceptions.csv'), ($exc -join "`n") + "`n", $utf8)

    Write-PaDeployJson (Join-Path $out 'ca-map.json') $Settings.conditionalAccess.map
    Copy-Item -Recurse -LiteralPath (Join-Path $script:KitRoot 'ca-policies') -Destination (Join-Path $out 'ca-policies')

    $roles = Join-Path $out 'pim-roles'
    New-Item -ItemType Directory -Path $roles | Out-Null
    $src = Join-Path $script:KitRoot 'config/pim-ch04/roles'
    $files = @($Settings.pimRoles.roleFiles)
    if ($files.Count -eq 1 -and $files[0] -eq '*') { $files = @(Get-ChildItem -LiteralPath $src -Filter *.json | ForEach-Object Name) }
    foreach ($r in $files) {
        $p = Join-Path $src $r
        if (-not (Test-Path -LiteralPath $p)) { throw "pimRoles.roleFiles: no role file '$r' in config/pim-ch04/roles" }
        Copy-Item -LiteralPath $p -Destination $roles
    }
    Write-PaDeployJson (Join-Path $out 'pim-bindings.json') ([ordered]@{ tenantId = $Settings.tenantId; approverGroups = $Settings.pimRoles.approverGroups; eligibility = @($Settings.pimRoles.eligibility) })
    $conf = @('PrincipalId,RoleTemplateId,ConfirmedOn,Ticket') + @(@(Get-PaDeployValue $Settings.pimRoles 'confirmedActivations') | Where-Object { $_ } | ForEach-Object { "$($_.principalId),$($_.roleTemplateId),$($_.confirmedOn),$($_.ticket)" })
    [IO.File]::WriteAllText((Join-Path $out 'confirmed-activations.csv'), ($conf -join "`n") + "`n", $utf8)

    $groups = [ordered]@{ approverGroups = $Settings.pimGroups.approverGroups; groups = @($Settings.pimGroups.groups) }
    Write-PaDeployJson (Join-Path $out 'prv-groups.json') $groups
    $az = [ordered]@{ cloud = $Settings.cloud }
    foreach ($k in $Settings.azure.Keys) { if ($k -ne '_comment') { $az[$k] = $Settings.azure[$k] } }
    Write-PaDeployJson (Join-Path $out 'azure-desired.json') $az
    $ar = [ordered]@{ emergencyAccountIds = @($ea.accounts | ForEach-Object { $_.id }) }
    foreach ($k in $Settings.accessReviews.Keys) { if ($k -notin '_comment', 'previousConfigPath') { $ar[$k] = $Settings.accessReviews[$k] } }
    Write-PaDeployJson (Join-Path $out 'access-reviews.json') $ar

    $hashes = [ordered]@{}
    foreach ($fi in (Get-ChildItem -LiteralPath $out -Recurse -File | Sort-Object FullName)) {
        $rel = [IO.Path]::GetRelativePath($out, $fi.FullName).Replace('\', '/')
        $hashes[$rel] = (Get-FileHash -LiteralPath $fi.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    Write-PaDeployJson (Join-Path $out 'manifest.json') ([ordered]@{ environment = $Settings.environment; changeRecord = $Settings.changeRecord; tenantId = $Settings.tenantId; cloud = $Settings.cloud; files = $hashes })
    [pscustomobject]@{ Path = $out; Files = $hashes.Count; RoleFiles = $files.Count; Groups = @($Settings.pimGroups.groups).Count; Reviews = @($Settings.accessReviews.reviews).Count }
}

# ----------------------------------------------------------------------------- the reader and the fake

function New-PaDeployReader {
    <#
    .SYNOPSIS
        A read-only client for one runbook task (preflight or smoke) in one cloud. It sends only
        the calls deploy/calls-deploy.json declares, GET only, on the cloud's own Graph host, and
        records each request. -Invoke is the fake from New-PaDeployFixtureInvoker or the live one
        from New-PaDeployLiveInvoker.
    .EXAMPLE
        # A smoke-test reader over the fictional tenant.
        $fake = New-PaDeployFixtureInvoker -Path deploy/tests/fixtures/smoke-approve.json
        $reader = New-PaDeployReader -Cloud gcc -Task smoke -Invoke $fake.Invoke
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][ValidateSet('preflight', 'smoke')][string]$Task, [Parameter(Mandatory)][scriptblock]$Invoke)
    [pscustomobject]@{ Cloud = (Get-PaCloud -Cloud $Cloud); Task = $Task; Calls = (Get-PaDeployCall -Task $Task); Invoke = $Invoke; Evidence = [Collections.Generic.List[object]]::new() }
}

function Invoke-PaDeployList {
    <#
    .SYNOPSIS
        GETs a declared collection for the runbook and follows every @odata.nextLink on the same
        host. Refuses a call the task doesn't declare.
    .EXAMPLE
        # The licenses in the fictional tenant.
        $reader = New-PaDeployReader -Cloud gcc -Task preflight -Invoke (New-PaDeployFixtureInvoker -Path deploy/tests/fixtures/tenant.json).Invoke
        Invoke-PaDeployList -Reader $reader -CallId subscribed-skus
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Reader, [Parameter(Mandatory)][string]$CallId, [hashtable]$Bind = @{}, [string]$Query)
    $call = $Reader.Calls | Where-Object { $_.id -eq $CallId }
    if (-not $call) { throw "Undeclared call '$CallId' for task '$($Reader.Task)'; add it to deploy/calls-deploy.json with its permission." }
    if ($call.method -ne 'GET') { throw "Refusing $($call.method): the runbook's scripts only read." }
    $path = $call.path
    foreach ($k in $Bind.Keys) { $path = $path.Replace("{$k}", [string]$Bind[$k]) }
    if ($path -match '\{[A-Za-z]+\}') { throw "Unbound placeholder in $path" }
    $graph = $Reader.Cloud.Graph
    $uri = "$graph/$($call.version)$path"
    if ($Query) { $uri += "?$Query" }
    $items = [Collections.Generic.List[object]]::new()
    while ($uri) {
        if (-not $uri.StartsWith("$graph/", [StringComparison]::OrdinalIgnoreCase)) { throw "Refusing to send the token to $uri`: not $graph" }
        $Reader.Evidence.Add([pscustomobject]@{ Call = $CallId; Method = 'GET'; Uri = $uri; At = [DateTime]::UtcNow.ToString('o') })
        $body = & $Reader.Invoke 'GET' $uri
        if ($null -eq $body) { throw "No response for $uri" }
        if ($body.ContainsKey('value')) { foreach ($v in @($body['value'])) { $items.Add($v) } } else { $items.Add($body) }
        $uri = Get-PaDeployValue $body '@odata.nextLink'
    }
    $items.ToArray()
}

function New-PaDeployFixtureInvoker {
    <#
    .SYNOPSIS
        A fake Graph for the runbook's fixture mode. It serves subscribedSkus, directory audits,
        access reviews and active role assignments from a fixture file, and passes every other
        GET to Chapter 01's fake (users, methods, groups, Conditional Access policies), so the
        pre-flight can run Chapter 02's check unchanged. GET only.
    .EXAMPLE
        # Serve the fictional test tenant, then list what the pre-flight read.
        $fake = New-PaDeployFixtureInvoker -Path deploy/tests/fixtures/tenant.json
        $fake.Calls | Select-Object Method, Uri
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [string]$Cloud = 'gcc')
    $inner = New-PaFixtureInvoker -Path $Path -Cloud $Cloud -PageSize 50
    $t = $inner.Tenant
    $graph = (Get-PaCloud -Cloud $Cloud).Graph
    $fake = Get-Command Invoke-PaFake
    $state = [pscustomobject]@{ Tenant = $t; Calls = $inner.Calls; Inner = $inner; Graph = $graph; Invoke = $null }
    $s = $state
    $state.Invoke = {
        param($Method, $Uri)
        if ($Method -ne 'GET') { throw "The fake refuses $Method" }
        $u = [Uri]$Uri
        $path = [Uri]::UnescapeDataString($u.AbsolutePath)
        $filter = ''
        foreach ($pair in $u.Query.TrimStart('?').Split('&', [StringSplitOptions]::RemoveEmptyEntries)) {
            $kv = $pair.Split('=', 2); if ([Uri]::UnescapeDataString($kv[0]) -eq '$filter') { $filter = [Uri]::UnescapeDataString($kv[1]) }
        }
        $tt = $s.Tenant
        $list = { param($k) if ($tt.ContainsKey($k)) { @($tt[$k]) } else { @() } }
        switch -Regex ($path) {
            '^/v1\.0/subscribedSkus$' { $s.Calls.Add([pscustomobject]@{ Method = $Method; Uri = $Uri }); return @{ value = @(& $list 'subscribedSkus') } }
            '^/v1\.0/auditLogs/directoryAudits$' {
                $s.Calls.Add([pscustomobject]@{ Method = $Method; Uri = $Uri })
                $rows = @(& $list 'directoryAudits')
                if ($filter -match "activityDateTime ge (\S+)") { $ge = [datetime]::Parse($Matches[1], [Globalization.CultureInfo]::InvariantCulture).ToUniversalTime(); $rows = @($rows | Where-Object { ([datetime]$_.activityDateTime).ToUniversalTime() -ge $ge }) }
                if ($filter -match "loggedByService eq '([^']+)'") { $v = $Matches[1]; $rows = @($rows | Where-Object { $_.loggedByService -eq $v }) }
                return @{ value = $rows }
            }
            '^/v1\.0/roleManagement/directory/roleAssignmentScheduleInstances$' {
                if (-not $tt.ContainsKey('roleAssignmentScheduleInstances')) { $s.Calls.Add([pscustomobject]@{ Method = $Method; Uri = $Uri }); return @{ value = @() } }
            }
            '^/v1\.0/identityGovernance/accessReviews/definitions$' { $s.Calls.Add([pscustomobject]@{ Method = $Method; Uri = $Uri }); return @{ value = @(& $list 'accessReviewDefinitions') } }
            '^/v1\.0/identityGovernance/accessReviews/definitions/([^/]+)/instances$' {
                $s.Calls.Add([pscustomobject]@{ Method = $Method; Uri = $Uri }); $d = $Matches[1]
                return @{ value = @(& $list 'accessReviewInstances' | Where-Object { $_.definitionId -eq $d }) }
            }
            '^/v1\.0/identityGovernance/accessReviews/definitions/([^/]+)/instances/([^/]+)/decisions$' {
                $s.Calls.Add([pscustomobject]@{ Method = $Method; Uri = $Uri }); $iid = $Matches[2]
                return @{ value = @(& $list 'accessReviewDecisions' | Where-Object { $_.instanceId -eq $iid }) }
            }
        }
        & $fake -State $s.Inner -Method $Method -Uri $Uri
    }.GetNewClosure()
    $state
}

function New-PaDeployLiveInvoker {
    <#
    .SYNOPSIS
        The live invoker for the runbook's reads: Graph only, through Invoke-MgGraphRequest, after
        checking that the Graph session is in the cloud the settings file names. Sign in first
        with Connect-MgGraph as the reader app.
    .EXAMPLE
        # Live, GCC: the reader app signed in with its certificate.
        Connect-MgGraph -Environment Global -TenantId <tenant-id> -ClientId <reader-app-id> -CertificateThumbprint <thumbprint>
        $invoke = New-PaDeployLiveInvoker -Cloud gcc
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud)
    New-PaLiveInvoker -Cloud $Cloud -SkipAzure
}

# ----------------------------------------------------------------------------- pre-flight

function Test-PaDeployPreflight {
    <#
    .SYNOPSIS
        The pre-flight checks before any stage writes, in the order that prevents a lockout:
        the settings file (PA-DEP-01, -02, -08); licenses for PIM (PA-DEP-03); Chapter 02's
        emergency access check, every Finding carried as PA-DEP-04; every Conditional Access
        policy in the tenant, in any state, excluding every emergency account (PA-DEP-05); every
        policy file the stage will deploy excluding the emergency group (PA-DEP-06); and the
        smoke test's synthetic administrator kept apart from the emergency accounts and their
        group (PA-DEP-09). Any Finding blocks the stage. Reads only.
    .EXAMPLE
        # Pre-flight for the fictional test tenant, as of a fixed date.
        $s = Read-PaDeploySettings -Path deploy/tests/fixtures/environment.test.json
        $null = New-PaDeployInputs -Settings $s -OutputPath out/deploy-test/inputs
        $fake = New-PaDeployFixtureInvoker -Path deploy/tests/fixtures/tenant.json
        Test-PaDeployPreflight -Settings $s -InputsPath out/deploy-test/inputs -Invoke $fake.Invoke -AsOf 2026-11-02
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][hashtable]$Settings,
        [Parameter(Mandatory)][string]$InputsPath,
        [Parameter(Mandatory)][scriptblock]$Invoke,
        [datetime]$AsOf = [datetime]::UtcNow,
        [System.Collections.Generic.List[object]]$Evidence
    )
    $f = [Collections.Generic.List[object]]::new()
    foreach ($x in @(Test-PaDeploySettings -Settings $Settings)) { $f.Add($x) }

    # 1. Licenses: PIM needs Microsoft Entra ID P2 or Microsoft Entra ID Governance (Learn).
    $reader = New-PaDeployReader -Cloud $Settings.cloud -Task preflight -Invoke $Invoke
    $skus = @(Invoke-PaDeployList -Reader $reader -CallId subscribed-skus)
    $licensed = @()
    foreach ($sku in $skus) {
        if ((Get-PaDeployValue $sku 'capabilityStatus') -ne 'Enabled') { continue }
        foreach ($plan in @(Get-PaDeployValue $sku 'servicePlans')) {
            $pid_ = [string](Get-PaDeployValue $plan 'servicePlanId')
            if ($script:PimPlans.Contains($pid_)) {
                $units = Get-PaDeployValue (Get-PaDeployValue $sku 'prepaidUnits') 'enabled'
                $licensed += "$($sku.skuPartNumber) ($($script:PimPlans[$pid_]), $units enabled, $(Get-PaDeployValue $sku 'consumedUnits') consumed)"
            }
        }
    }
    if ($licensed.Count -eq 0) {
        $f.Add((New-PaDeployFinding 'PA-DEP-03' 'Finding' 'subscribedSkus' 'No enabled subscription carries the AAD_PREMIUM_P2 or Entra_Identity_Governance service plan; PIM and access reviews need one'))
    } else {
        $f.Add((New-PaDeployFinding 'PA-DEP-03' 'Info' 'subscribedSkus' "PIM licensed by: $($licensed -join '; '). Count eligible users, approvers and reviewers against the enabled units"))
    }

    # 2. The emergency access accounts, by Chapter 02's check, unchanged.
    $ea = Read-PaEmergencyConfig -Path (Join-Path $InputsPath 'emergency-access.json')
    $val = @(Import-Csv -LiteralPath (Join-Path $InputsPath 'emergency-validations.csv'))
    $eaReader = New-PaReader -Cloud $Settings.cloud -Task emergency-access -Invoke $Invoke
    foreach ($x in @(Test-PaEmergencyAccess -Reader $eaReader -Config $ea -Validations $val -AsOf $AsOf)) {
        if ($x.Severity -eq 'Finding') { $f.Add((New-PaDeployFinding 'PA-DEP-04' 'Finding' $x.Object "$($x.Rule): $($x.Issue)")) }
    }

    # 3. Every policy in the tenant, in any state, excludes every emergency account. Chapter 02
    #    lets report-only policies through, as Learn does; a deployment that will enforce
    #    policies later doesn't (Design guidance), and a disabled policy can be turned on.
    $ids = @($ea.accounts | ForEach-Object { $_.id })
    $members = @(Invoke-PaList -Reader $eaReader -CallId group-members -Bind @{ id = $ea.exclusionGroupId } -Query '$select=id' | ForEach-Object { $_.id })
    foreach ($p in @(Invoke-PaList -Reader $eaReader -CallId ca-policies)) {
        $users = Get-PaDeployValue (Get-PaDeployValue $p 'conditions') 'users'
        $exG = @(Get-PaDeployValue $users 'excludeGroups'); $exU = @(Get-PaDeployValue $users 'excludeUsers')
        $missing = @($ids | Where-Object { $exU -notcontains $_ -and -not ($exG -contains $ea.exclusionGroupId -and $members -contains $_) })
        if ($missing.Count) { $f.Add((New-PaDeployFinding 'PA-DEP-05' 'Finding' $p.displayName "State $($p.state): doesn't exclude $($missing.Count) emergency account(s); add the exclusion group before this stage")) }
    }

    # 4. Every policy file the stage will deploy excludes the emergency group.
    $cfg = Get-Content -LiteralPath (Join-Path $InputsPath 'ca-policies/ca-config.json') -Raw | ConvertFrom-Json -AsHashtable
    foreach ($file in (Get-ChildItem -LiteralPath (Join-Path $InputsPath 'ca-policies/policies') -Filter *.json | Sort-Object Name)) {
        $p = Get-Content -LiteralPath $file.FullName -Raw | ConvertFrom-Json -AsHashtable
        $exG = @(Get-PaDeployValue (Get-PaDeployValue (Get-PaDeployValue $p 'conditions') 'users') 'excludeGroups')
        if ($exG -notcontains $cfg.emergencyGroup -and $exG -notcontains $ea.exclusionGroupId) {
            $f.Add((New-PaDeployFinding 'PA-DEP-06' 'Finding' $file.Name "Policy file doesn't exclude $($cfg.emergencyGroup)"))
        }
    }

    # 5. The smoke test's synthetic administrator is an ordinary account under every policy.
    $syn = [string]$Settings.smokeTest.syntheticAdmin.id
    if ($ids -contains $syn -or $members -contains $syn) {
        $f.Add((New-PaDeployFinding 'PA-DEP-09' 'Finding' $Settings.smokeTest.syntheticAdmin.userPrincipalName 'The synthetic administrator is an emergency account or in the exclusion group: it would skip the policies the smoke test proves'))
    }
    if ($null -ne $Evidence) { foreach ($e in @($reader.Evidence) + @($eaReader.Evidence)) { $Evidence.Add($e) } }
    $f.ToArray()
}

# ----------------------------------------------------------------------------- smoke test

function Get-PaDeployIso8601 {
    param([string]$Duration)
    [Xml.XmlConvert]::ToTimeSpan($Duration)
}

function Get-PaSmokeResult {
    <#
    .SYNOPSIS
        Reads the evidence for one smoke-test phase and compares it with the expected result:
        Activate (the request is in the audit log and no role is active yet: approval holds),
        Approve (the approval is in the audit log and the role is active, activated, for no
        longer than the role file allows), Expire (after the end time no active instance remains)
        or Review (the pilot review's instance has a decision for the synthetic administrator).
        Returns one row per check with Expected, Observed and Pass. Reads only.
    .EXAMPLE
        # The Approve phase against the fictional tenant.
        $s = Read-PaDeploySettings -Path deploy/tests/fixtures/environment.test.json
        $reader = New-PaDeployReader -Cloud gcc -Task smoke -Invoke (New-PaDeployFixtureInvoker -Path deploy/tests/fixtures/smoke-approve.json).Invoke
        Get-PaSmokeResult -Settings $s -Phase Approve -Reader $reader -Since 2026-11-02T14:00:00Z -AsOf 2026-11-02T14:30:00Z | Format-Table Check, Pass
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][hashtable]$Settings,
        [Parameter(Mandatory)][ValidateSet('Activate', 'Approve', 'Expire', 'Review')][string]$Phase,
        [Parameter(Mandatory)]$Reader,
        [Parameter(Mandatory)][datetime]$Since,
        [datetime]$AsOf = [datetime]::UtcNow
    )
    $st = $Settings.smokeTest
    $syn = [string]$st.syntheticAdmin.id
    $role = [string]$st.roleTemplateId
    $roleFile = Get-Content -LiteralPath (Join-Path $script:KitRoot "config/pim-ch04/roles/$($st.roleFile)") -Raw | ConvertFrom-Json -AsHashtable
    $rows = [Collections.Generic.List[object]]::new()
    $add = { param($Check, $Expected, $Observed, [bool]$Pass) $rows.Add([pscustomobject]@{ Phase = $Phase; Check = $Check; Expected = $Expected; Observed = $Observed; Pass = $Pass }) }

    $instances = { @(Invoke-PaDeployList -Reader $Reader -CallId entra-active-assignments -Query "`$filter=principalId eq '$syn'" | Where-Object { $_.roleDefinitionId -eq $role }) }
    $audits = {
        param([string]$Activity)
        $win = "activityDateTime ge $($Since.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'))"
        $all = @(); foreach ($svc in $script:PimService) { $all += @(Invoke-PaDeployList -Reader $Reader -CallId directory-audits -Query "`$filter=$win and loggedByService eq '$svc'") }
        @($all | Where-Object {
                $_.activityDisplayName -eq $Activity -and (
                    @($_.targetResources | Where-Object { $_.id -eq $syn }).Count -gt 0 -or
                    [string](Get-PaDeployValue (Get-PaDeployValue $_.initiatedBy 'user') 'id') -eq $syn)
            } | Sort-Object { $_.id } -Unique)
    }

    switch ($Phase) {
        'Activate' {
            $req = @(& $audits $script:Activity.Requested)
            & $add 'Activation request logged' "'$($script:Activity.Requested)' for $($st.syntheticAdmin.userPrincipalName)" "$($req.Count) event(s)" ($req.Count -ge 1)
            $active = @(& $instances)
            & $add 'Role not active before approval' 'No active instance of the role (approval required)' "$($active.Count) active instance(s)" ($active.Count -eq 0)
        }
        'Approve' {
            $ok = @(& $audits $script:Activity.Approved)
            & $add 'Approval logged' "'$($script:Activity.Approved)'" "$($ok.Count) event(s)" ($ok.Count -ge 1)
            $active = @(& $instances | Where-Object { $_.assignmentType -eq 'Activated' })
            & $add 'Role active by activation' "One instance, assignmentType Activated" "$($active.Count) activated instance(s)" ($active.Count -ge 1)
            if ($active.Count) {
                $a = $active[0]
                $max = Get-PaDeployIso8601 $roleFile.activation.maximumDuration
                $len = ([datetime]$a.endDateTime) - ([datetime]$a.startDateTime)
                & $add 'Activation within the role file' "At most $($roleFile.activation.maximumDuration) ($($max.TotalHours) h)" ("{0:N2} h, ends {1}" -f $len.TotalHours, ([datetime]$a.endDateTime).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')) ($len -le $max)
                & $add 'Direct, not inherited' 'memberType Direct' "memberType $($a.memberType)" ($a.memberType -eq 'Direct')
            }
        }
        'Expire' {
            $active = @(& $instances | Where-Object { -not $_.endDateTime -or ([datetime]$_.endDateTime).ToUniversalTime() -gt $AsOf.ToUniversalTime() })
            & $add 'Role no longer active' "No active instance after $($AsOf.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'))" "$($active.Count) active instance(s)" ($active.Count -eq 0)
            $exp = @(& $audits $script:Activity.Expired)
            & $add 'Expiry logged' "'$($script:Activity.Expired)'" "$($exp.Count) event(s)" ($exp.Count -ge 1)
        }
        'Review' {
            $def = @(Invoke-PaDeployList -Reader $Reader -CallId ar-definitions-list | Where-Object { $_.displayName -eq $st.reviewName })
            & $add 'Pilot review exists' "Definition '$($st.reviewName)'" "$($def.Count) definition(s)" ($def.Count -eq 1)
            if ($def.Count -eq 1) {
                $inst = @(Invoke-PaDeployList -Reader $Reader -CallId ar-instances-list -Bind @{ definitionId = $def[0].id } | Sort-Object { [datetime]$_.startDateTime } -Descending)
                & $add 'Instance started' 'An instance of the series' "$($inst.Count) instance(s); latest $(if ($inst.Count) { $inst[0].status })" ($inst.Count -ge 1)
                if ($inst.Count) {
                    $dec = @(Invoke-PaDeployList -Reader $Reader -CallId ar-decisions-list -Bind @{ definitionId = $def[0].id; instanceId = $inst[0].id } |
                            Where-Object { [string](Get-PaDeployValue (Get-PaDeployValue $_ 'principal') 'id') -eq $syn })
                    $d = if ($dec.Count) { $dec[0] } else { $null }
                    & $add 'Synthetic admin reviewed' 'A decision other than NotReviewed, with a justification' $(if ($d) { "decision $($d.decision), applyResult $($d.applyResult)" } else { 'no decision row' }) ($null -ne $d -and $d.decision -notin 'NotReviewed', $null -and [bool]$d.justification)
                }
            }
        }
    }
    $rows.ToArray()
}

# ----------------------------------------------------------------------------- rollback

function Read-PaDeployJsonFile { param([string]$Path) if (Test-Path -LiteralPath $Path) { Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 50 } else { $null } }

function New-PaRollbackPlan {
    <#
    .SYNOPSIS
        Plans the rollback of one stage from the run folders its commands wrote under the
        settings file's outputRoot, in the reverse of the deployment order so nobody is left
        without access: access reviews (portal), Azure resource roles (standing assignments
        restored before eligibility and policies are put back), PIM for Groups (the previous
        desired file), Microsoft Entra roles (standing assignments restored, then Chapter 04's
        -RestoreFrom), Conditional Access (the stage's new policies and contexts turned off), and
        the emergency access accounts, which are never rolled back. Returns ordered steps, each
        Automatic (an exact command) or Manual (an exact portal path), and Blocked when a step
        can't be planned safely. Sends nothing.
    .EXAMPLE
        # Plan the rollback of the fictional test stage's fixture runs.
        $s = Read-PaDeploySettings -Path deploy/tests/fixtures/environment.test.json
        New-PaRollbackPlan -Settings $s -RunRoot deploy/tests/fixtures/runs | Format-Table Order, Area, Kind, Summary
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$RunRoot, [string]$OutputPath)
    $root = Resolve-PaDeployPath $RunRoot
    $inputs = Join-Path (Resolve-PaDeployPath $Settings.outputRoot) 'inputs'
    $rb = if ($OutputPath) { Resolve-PaDeployPath $OutputPath } else { Join-Path $root 'rollback' }
    $cloud = $Settings.cloud; $tenant = $Settings.tenantId
    $apps = $Settings.identity.apps
    $thumb = Get-PaDeployValue $Settings.identity 'certificateThumbprint'
    $c = Get-PaCloud -Cloud $cloud
    $connect = { param([string]$App) "Connect-MgGraph -Environment $($c.GraphEnvironment) -TenantId $tenant -ClientId $App -CertificateThumbprint $thumb -NoWelcome" }
    $steps = [Collections.Generic.List[object]]::new()
    $step = {
        param([string]$Area, [string]$Kind, [string]$Summary, [string[]]$Commands = @(), [string]$Portal = '', [hashtable]$Files = @{})
        $steps.Add([pscustomobject]@{ Order = $steps.Count + 1; Area = $Area; Kind = $Kind; Summary = $Summary; Commands = @($Commands); Portal = $Portal; Files = $Files })
    }

    # R1. Access reviews: the code never deletes a series; a person deletes what the stage made.
    $rev = Read-PaDeployJsonFile (Join-Path $root 'reviews-apply/results.json')
    $made = @($rev | Where-Object { $_ -and $_.Action -eq 'Create' -and $_.Result -eq 'Sent' } | ForEach-Object { $_.Name })
    if ($made.Count) {
        & $step 'access-reviews' 'Manual' "Export the evidence, then delete $($made.Count) series the stage created: $($made -join ', ')" @() 'ID Governance > Access reviews > select the series > Delete'
    }
    $upd = @($rev | Where-Object { $_ -and $_.Action -eq 'Update' -and $_.Result -eq 'Sent' } | ForEach-Object { $_.Name })
    if ($upd.Count) {
        $prevAr = Get-PaDeployValue $Settings.accessReviews 'previousConfigPath'
        if ($prevAr) {
            & $step 'access-reviews' 'Automatic' "Put back $($upd.Count) updated series ($($upd -join ', ')) by applying the previous reviewed file" @(
                (& $connect $apps.reviewsWriter),
                "./Invoke-PaAccessReviews.ps1 -Cloud $cloud -Mode Plan -ConfigPath $prevAr -OutputPath $(Join-Path $rb 'reviews') -SkipAzure -TenantId $tenant -Apply")
        } else {
            & $step 'access-reviews' 'Blocked' "The stage updated $($upd.Count) series ($($upd -join ', ')): name accessReviews.previousConfigPath (the reviewed file before this change) in the settings file"
        }
    }

    # R2. Azure resource roles: restore standing assignments first, then remove the stage's
    #     eligibility, then put each policy back as the dry run read it.
    $azPlan = Read-PaDeployJsonFile (Join-Path $root 'azure-apply/plan.json')
    $azState = Read-PaDeployJsonFile (Join-Path $root 'azure-dry/state.json')
    if ($azPlan) {
        $sent = @($azPlan | Where-Object { $_.sent })
        $cmds = [Collections.Generic.List[string]]::new()
        $cmds.Add("Connect-AzAccount -ServicePrincipal -Environment $($c.AzureEnvironment) -Tenant $tenant -ApplicationId $($apps.azure) -CertificateThumbprint $thumb")
        $restore = 0; $remove = 0; $policies = 0
        $azBody = { param($o) ($o | ConvertTo-Json -Depth 20 -Compress).Replace("'", "''") }
        foreach ($r in @($sent | Where-Object { $_.call -eq 'azpim-assignment-request' -and $_.body.properties.requestType -eq 'AdminRemove' })) {
            $u = [Uri]$r.uri; $scope = $u.AbsolutePath -replace '/providers/Microsoft\.Authorization/roleAssignmentScheduleRequests/.*$', ''
            $name = [guid]::NewGuid().ToString()
            $body = @{ properties = [ordered]@{ principalId = $r.body.properties.principalId; roleDefinitionId = $r.body.properties.roleDefinitionId; requestType = 'AdminAssign'; justification = "Rollback of $($Settings.changeRecord): standing assignment restored"; scheduleInfo = @{ expiration = @{ type = 'NoExpiration' } } } }
            $cmds.Add("Invoke-AzRestMethod -Method PUT -Path '$scope/providers/Microsoft.Authorization/roleAssignmentScheduleRequests/$name`?api-version=2020-10-01' -Payload '$(& $azBody $body)'")
            $restore++
        }
        foreach ($r in @($sent | Where-Object { $_.call -eq 'azpim-eligibility-request' -and $_.body.properties.requestType -eq 'AdminAssign' })) {
            $u = [Uri]$r.uri; $scope = $u.AbsolutePath -replace '/providers/Microsoft\.Authorization/roleEligibilityScheduleRequests/.*$', ''
            $name = [guid]::NewGuid().ToString()
            $body = @{ properties = [ordered]@{ principalId = $r.body.properties.principalId; roleDefinitionId = $r.body.properties.roleDefinitionId; requestType = 'AdminRemove'; justification = "Rollback of $($Settings.changeRecord)" } }
            $cmds.Add("Invoke-AzRestMethod -Method PUT -Path '$scope/providers/Microsoft.Authorization/roleEligibilityScheduleRequests/$name`?api-version=2020-10-01' -Payload '$(& $azBody $body)'")
            $remove++
        }
        foreach ($r in @($sent | Where-Object { $_.call -eq 'azpim-policy-update' })) {
            $u = [Uri]$r.uri; $path = $u.AbsolutePath
            $before = @($azState.policies | Where-Object { $path -like "*/roleManagementPolicies/$($_.name)" })
            if ($before.Count -ne 1) { continue }
            $ids = @($r.body.properties.rules | ForEach-Object { $_.id })
            $rules = @($before[0].rules | Where-Object { $ids -contains $_.id })
            $cmds.Add("Invoke-AzRestMethod -Method PATCH -Path '$path`?api-version=2020-10-01' -Payload '$(& $azBody @{ properties = @{ rules = $rules } })'")
            $policies++
        }
        if ($restore + $remove + $policies) {
            $kind = if ($azState -or $policies -eq 0) { 'Automatic' } else { 'Blocked' }
            & $step 'azure' $kind "Restore $restore standing assignment(s), then remove $remove eligible assignment(s), then put back $policies policy(ies) from azure-dry/state.json; wait five minutes after the stage's last assignment first" $cmds.ToArray()
        }
    }

    # R3. PIM for Groups: apply the previous desired file. In test, the stage's lab groups are
    #     emptied; in production that would strand people, so the previous file is required.
    if (Test-Path -LiteralPath (Join-Path $root 'groups-apply')) {
        $prev = Get-PaDeployValue $Settings.pimGroups 'previousDesiredPath'
        $files = @{}
        if (-not $prev -and $Settings.environment -eq 'test') {
            $d = Read-PaDeployJsonFile (Join-Path $inputs 'prv-groups.json')
            if ($d) { foreach ($g in @($d.groups)) { $g.member.active = @(); $g.member.eligible = @(); $g.owner.active = @(); $g.owner.eligible = @() } }
            $prev = Join-Path $rb 'prv-groups.previous.json'
            $files[$prev] = $d
        }
        if ($prev) {
            & $step 'pim-groups' 'Automatic' 'Apply the previous PRV groups desired state (test: the lab groups emptied)' @(
                (& $connect $apps.groupsWriter),
                "./Invoke-PaPimGroups.ps1 -Cloud $cloud -DesiredPath $prev -OutputPath $(Join-Path $rb 'groups') -TenantId $tenant -Apply") '' $files
        } else {
            & $step 'pim-groups' 'Blocked' 'Production: name pimGroups.previousDesiredPath (the reviewed file before this change) in the settings file; emptying the groups would strand administrators'
        }
    }

    # R4. Microsoft Entra roles: restore every standing assignment a conversion removed, then
    #     put the rules back and remove the stage's eligibility with Chapter 04's -RestoreFrom.
    $converted = @()
    foreach ($dir in @(Get-ChildItem -LiteralPath $root -Directory -Filter 'pim-convert*' -ErrorAction SilentlyContinue | Sort-Object Name)) {
        $p = Read-PaDeployJsonFile (Join-Path $dir.FullName 'plan.json')
        $converted += @($p.actions | Where-Object { $_.Kind -eq 'RemoveStanding' -and $_.Status -eq 'Sent' })
    }
    if ($converted.Count) {
        $cmds = @((& $connect $apps.pimWriter))
        foreach ($r in $converted) {
            $cmds += "New-MgRoleManagementDirectoryRoleAssignmentScheduleRequest -BodyParameter @{ Action = 'adminAssign'; PrincipalId = '$($r.Body.principalId)'; RoleDefinitionId = '$($r.Body.roleDefinitionId)'; DirectoryScopeId = '/'; Justification = 'Rollback of $($Settings.changeRecord): standing assignment restored'; ScheduleInfo = @{ StartDateTime = (Get-Date).ToUniversalTime(); Expiration = @{ Type = 'noExpiration' } } }"
        }
        & $step 'pim-roles' 'Automatic' "Restore $($converted.Count) standing Microsoft Entra role assignment(s) the conversion removed, before anything else in this area" $cmds
    }
    $pimApplies = @(Get-ChildItem -LiteralPath $root -Directory -Filter 'pim-apply*' -ErrorAction SilentlyContinue | Sort-Object Name -Descending)
    foreach ($dir in $pimApplies) {
        if (-not (Test-Path -LiteralPath (Join-Path $dir.FullName 'before.json'))) { continue }
        $p = Read-PaDeployJsonFile (Join-Path $dir.FullName 'plan.json')
        $wave = if ($p) { $p.wave } else { 1 }
        & $step 'pim-roles' 'Automatic' "Put wave $wave's role rules back from $($dir.Name)/before.json and remove the eligibility it created" @(
            (& $connect $apps.pimWriter),
            "./Invoke-PaPimRoleSettings.ps1 -Cloud $cloud -Wave $wave -RolesPath $(Join-Path $inputs 'pim-roles') -BindingsPath $(Join-Path $inputs 'pim-bindings.json') -EmergencyConfigPath $(Join-Path $inputs 'emergency-access.json') -ExceptionsPath $(Join-Path $inputs 'exceptions.csv') -OutputPath $(Join-Path $rb "pim-restore-w$wave") -TenantId $tenant -Apply -RestoreFrom $($dir.FullName)")
    }

    # R5. Conditional Access: turn off what the stage created and make the contexts unavailable.
    #     The code never deletes a policy. Runs after R4 so no role rule still needs context c1.
    $caPlan = Read-PaDeployJsonFile (Join-Path $root 'ca-plan/plan.json')
    if ($caPlan) {
        $policiesMade = @($caPlan | Where-Object { $_.Kind -eq 'policy' -and $_.Action -in 'Create', 'Blocked' } | ForEach-Object { $_.Name })
        $ctxMade = @($caPlan | Where-Object { $_.Kind -eq 'context' -and $_.Action -eq 'Create' } | ForEach-Object { $_.Name })
        $files = @{}
        $src = Join-Path $inputs 'ca-policies'
        foreach ($name in $policiesMade) {
            $pf = Read-PaDeployJsonFile (Join-Path $src "policies/$name.json")
            if ($pf) { $pf.state = 'disabled'; $files[(Join-Path $rb "ca-policies/policies/$name.json")] = $pf }
        }
        foreach ($name in $ctxMade) {
            $cf = Read-PaDeployJsonFile (Join-Path $src "contexts/$name.json")
            if ($cf) { $cf.isAvailable = $false; $files[(Join-Path $rb "ca-policies/contexts/$name.json")] = $cf }
        }
        & $step 'conditional-access' 'Automatic' "Turn off $($policiesMade.Count) policy(ies) the stage created ($($policiesMade -join ', ')) and make $($ctxMade.Count) context(s) unavailable; the emergency exclusion stays in every policy" @(
            (& $connect $apps.caWriter),
            "./Invoke-PaCaAdmin.ps1 -Cloud $cloud -MapPath $(Join-Path $inputs 'ca-map.json') -PolicyPath $(Join-Path $rb 'ca-policies') -OutputPath $(Join-Path $rb 'ca') -TenantId $tenant -Apply") '' $files
        $steps[-1] | Add-Member -NotePropertyName CopyFrom -NotePropertyValue $src
    }

    # R6. Emergency access accounts and their alert: never rolled back.
    & $step 'emergency-access' 'Keep' 'The emergency access accounts, their exclusion group and their alert stay as they are; run Chapter 02''s check again after the rollback'
    [pscustomobject]@{ Environment = $Settings.environment; ChangeRecord = $Settings.changeRecord; RunRoot = $root; OutputPath = $rb; Steps = $steps.ToArray() }
}

function Invoke-PaRollbackPlan {
    <#
    .SYNOPSIS
        Carries out a rollback plan. A dry run by default: writes rollback-plan.json, the files
        the steps need, and prints each step. With -Apply, refuses a plan with a Blocked step,
        then runs each Automatic step's commands in order and stops at the first error; Manual
        and Keep steps are printed for a person. -Runner replaces the command runner (tests).
    .EXAMPLE
        # Dry run: write the plan and the files, send nothing.
        $s = Read-PaDeploySettings -Path deploy/tests/fixtures/environment.test.json
        $plan = New-PaRollbackPlan -Settings $s -RunRoot deploy/tests/fixtures/runs -OutputPath out/rollback
        Invoke-PaRollbackPlan -Plan $plan
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Plan, [switch]$Apply, [scriptblock]$Runner = { param([string]$Command) Invoke-Expression $Command })
    $out = $Plan.OutputPath
    New-Item -ItemType Directory -Force -Path $out | Out-Null
    foreach ($s in $Plan.Steps) {
        if ($s.PSObject.Properties['CopyFrom'] -and $s.CopyFrom -and (Test-Path -LiteralPath $s.CopyFrom)) {
            $dest = Join-Path $out 'ca-policies'
            if (-not (Test-Path -LiteralPath $dest)) { Copy-Item -Recurse -LiteralPath $s.CopyFrom -Destination $dest }
        }
        foreach ($k in $s.Files.Keys) {
            New-Item -ItemType Directory -Force -Path (Split-Path -Parent $k) | Out-Null
            Write-PaDeployJson $k $s.Files[$k]
        }
    }
    $record = [ordered]@{
        environment = $Plan.Environment; changeRecord = $Plan.ChangeRecord; runRoot = $Plan.RunRoot; applied = $Apply.IsPresent
        steps = @($Plan.Steps | ForEach-Object { [ordered]@{ order = $_.Order; area = $_.Area; kind = $_.Kind; summary = $_.Summary; commands = @($_.Commands); portal = $_.Portal } })
    }
    Write-PaDeployJson (Join-Path $out 'rollback-plan.json') $record
    $blocked = @($Plan.Steps | Where-Object Kind -EQ 'Blocked')
    if ($Apply -and $blocked.Count) { throw "Rollback refused: $($blocked.Count) Blocked step(s). First: $($blocked[0].Summary)" }
    $ran = 0
    foreach ($s in $Plan.Steps) {
        if ($Apply -and $s.Kind -eq 'Automatic') { foreach ($cmd in $s.Commands) { & $Runner $cmd; $ran++ } }
    }
    [pscustomobject]@{ Steps = @($Plan.Steps).Count; Automatic = @($Plan.Steps | Where-Object Kind -EQ 'Automatic').Count; Manual = @($Plan.Steps | Where-Object Kind -EQ 'Manual').Count; Blocked = $blocked.Count; CommandsRun = $ran; Path = (Join-Path $out 'rollback-plan.json') }
}

# ----------------------------------------------------------------------------- evidence

function Export-PaDeployRun {
    <#
    .SYNOPSIS
        Writes a runbook step's outputs and a manifest with each file's SHA-256, the settings
        file's SHA-256, the environment, the change record, the mode and every request sent, for
        the ISSO's evidence folder.
    .EXAMPLE
        # Write a pre-flight run's findings and manifest.
        Export-PaDeployRun -OutputPath out/deploy-test/preflight -Step preflight -Settings $s -SettingsPath deploy/tests/fixtures/environment.test.json -Mode Fixture -Files @{ 'findings.json' = @($findings) }
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$Step, [Parameter(Mandatory)][hashtable]$Settings,
        [Parameter(Mandatory)][string]$SettingsPath, [Parameter(Mandatory)][hashtable]$Files, [string]$Mode = 'Fixture', [object[]]$Evidence = @()
    )
    $out = Resolve-PaDeployPath $OutputPath
    New-Item -ItemType Directory -Force -Path $out | Out-Null
    $hashes = [ordered]@{}
    foreach ($name in ($Files.Keys | Sort-Object)) {
        $p = Join-Path $out $name
        Write-PaDeployJson $p $Files[$name]
        $hashes[$name] = (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    Write-PaDeployJson (Join-Path $out 'manifest.json') ([ordered]@{
            step = $Step; mode = $Mode; environment = $Settings.environment; changeRecord = $Settings.changeRecord
            cloud = $Settings.cloud; tenantId = $Settings.tenantId; generated = [DateTime]::UtcNow.ToString('o')
            settingsSha256 = (Get-FileHash -LiteralPath $SettingsPath -Algorithm SHA256).Hash.ToLowerInvariant()
            requests = @($Evidence | ForEach-Object { [ordered]@{ call = $_.Call; method = $_.Method; uri = $_.Uri } })
            files = $hashes
        })
    Get-Item -LiteralPath (Join-Path $out 'manifest.json')
}

Export-ModuleMember -Function Get-PaDeployCall, Get-PaDeployRequiredPermission, Read-PaDeploySettings, Test-PaDeploySettings, New-PaDeployInputs,
New-PaDeployReader, Invoke-PaDeployList, New-PaDeployFixtureInvoker, New-PaDeployLiveInvoker, Test-PaDeployPreflight, Get-PaSmokeResult,
New-PaRollbackPlan, Invoke-PaRollbackPlan, Export-PaDeployRun
