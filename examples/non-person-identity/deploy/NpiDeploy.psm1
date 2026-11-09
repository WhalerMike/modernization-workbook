#Requires -Version 7.1
<#
    NpiDeploy: Chapter 11 of the developer workbook "Building Non-Person Identity".

    The deployment runbook's own code: one environment settings file read and checked (no secrets,
    no placeholders, the stage it says it is), a preflight before each stage (licenses, the
    deployment identity's credential, the reader's permissions, the operators' roles, the objects
    the runbook touches, the VK-NPI baseline, and a snapshot of what the rollback restores), a smoke
    test with a synthetic service principal and service account, and a rollback plan that is applied
    only with an approved SHA-256 and -Apply. Calls are declared in config/calls-ch11.json and go
    through NpiCore's reader, so a token only ever goes to the cloud's own Graph host.

    Every script has a fixture mode (-FixturePath) that sends nothing anywhere.

    Illustrative: tested against fixtures and fakes. Nobody has run it against a live tenant, an
    Azure subscription or a forest.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot '../powershell/NpiCore/NpiCore.psm1') -Force -Global

$script:ConfigRoot = Join-Path $PSScriptRoot '../config'
# Built-in role template IDs, from Learn's "Microsoft Entra built-in roles" (read November 2, 2026).
$script:Roles = [ordered]@{
    'Cloud Application Administrator'    = '158c047a-c907-4556-b7ef-446551a6b5f7'
    'Application Administrator'          = '9b895d92-2cd3-44c7-9d02-a6ac2d5ea5c3'
    'Conditional Access Administrator'   = 'b1be1c3e-b65d-4f19-8427-f6fa0d97feb9'
    'Security Administrator'             = '194ae4cb-b126-40b2-bd5b-6091b380977d'
}
# Service plan IDs, from Learn's "Product names and service plan identifiers for licensing".
$script:Plans = @{
    WorkloadIdPremium = @('84c289f0-efcb-486f-8581-07f44fc9efad', '7dc0e92d-bf15-401d-907e-0884efe7c760')   # AAD_WRKLDID_P1, AAD_WRKLDID_P2
    EntraP1OrP2       = @('41781fb2-bc02-4b7c-bd55-b576c07bb09d', 'eec0eb4f-6444-4f95-aba0-50c24d67f998')   # AAD_PREMIUM, AAD_PREMIUM_P2
}
$script:Guid = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
# A settings file holds names and IDs, never a credential. Design guidance.
$script:SecretName = '(?i)(secret|password|passwd|pwd|privatekey|pfx|connectionstring|token|sharedaccess|sastoken)'

# ----------------------------------------------------------------------------- the settings file

function Find-NpiDeployValue {
    # Every (path, name, value) leaf in a settings hashtable.
    param($Node, [string]$Path = '')
    if ($Node -is [Collections.IDictionary]) {
        foreach ($k in $Node.Keys) { Find-NpiDeployValue -Node $Node[$k] -Path "$Path.$k".TrimStart('.') }
    } elseif ($Node -is [Collections.IList] -and $Node -isnot [string]) {
        for ($i = 0; $i -lt $Node.Count; $i++) { Find-NpiDeployValue -Node $Node[$i] -Path "$Path[$i]" }
    } else { [pscustomobject]@{ Path = $Path; Name = ($Path -split '[.\[]')[-1]; Value = $Node } }
}

function Test-NpiDeploySettings {
    <#
    .SYNOPSIS
        Checks a settings hashtable and returns the problems found, one string each (none when it's
        good): a secret-like name or value, an unreplaced <placeholder>, a missing or malformed field,
        a stage other than the one expected, or a deployment credential that isn't a certificate or a
        federated credential.
    .EXAMPLE
        # No output: the fixture's test settings are complete.
        $s = Get-Content tests/fixtures/deploy/settings.test.json -Raw | ConvertFrom-Json -AsHashtable
        Test-NpiDeploySettings -Settings $s -Stage test
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [ValidateSet('test', 'production', '')][string]$Stage = '', [switch]$AllowPlaceholders)
    $p = [Collections.Generic.List[string]]::new()
    foreach ($leaf in @(Find-NpiDeployValue -Node $Settings)) {
        if ($leaf.Name -match $script:SecretName -and $leaf.Name -notin '_comment') { $p.Add("$($leaf.Path): a settings file holds no secret; use a certificate thumbprint or a federated credential") }
        $v = "$($leaf.Value)"
        if ($v -match '-----BEGIN' -or $v -match '^[A-Za-z0-9_.\-]{3,5}~[A-Za-z0-9_~.\-]{30,}$') { $p.Add("$($leaf.Path): looks like a key or a client secret") }
        if (-not $AllowPlaceholders -and $leaf.Name -ne '_comment' -and $v -match '<[a-z0-9-]+>') { $p.Add("$($leaf.Path): placeholder $($Matches[0]) not replaced") }
    }
    $need = @('environment', 'cloud', 'tenantId', 'changeRecord', 'deployIdentity', 'readerIdentity', 'operators', 'azure', 'ad', 'pilot', 'smoke', 'conditionalAccess', 'appManagementPolicy', 'rings')
    foreach ($k in $need) { if (-not $Settings.ContainsKey($k)) { $p.Add("$k`: missing") } }
    if ($p.Count -and @($p | Where-Object { $_ -match ': missing$' }).Count) { return $p.ToArray() }
    if ($Stage -and $Settings.environment -ne $Stage) { $p.Add("environment: the file is for '$($Settings.environment)', not '$Stage'") }
    if ($Settings.environment -notin 'test', 'production' -and -not ($AllowPlaceholders -and "$($Settings.environment)" -match '^<')) { $p.Add("environment: '$($Settings.environment)' isn't test or production") }
    if ($Settings.cloud -cnotin 'global', 'gcc', 'gcchigh', 'dod') { $p.Add("cloud: '$($Settings.cloud)' isn't global, gcc, gcchigh or dod") }
    $ids = @(
        @('tenantId', $Settings.tenantId), @('deployIdentity.clientId', $Settings.deployIdentity.clientId), @('readerIdentity.clientId', $Settings.readerIdentity.clientId),
        @('pilot.appObjectId', $Settings.pilot.appObjectId)
    )
    # Filled by the runbook's "Prepare the stage" step: empty until then (the preflight's PF-07 fails), a GUID after.
    $prepared = @(
        @('smoke.appObjectId', $Settings.smoke.appObjectId), @('smoke.appClientId', $Settings.smoke.appClientId),
        @('smoke.spObjectId', $Settings.smoke.spObjectId), @('appManagementPolicy.pilotPolicyId', $Settings.appManagementPolicy.pilotPolicyId)
    )
    if (-not $AllowPlaceholders) {
        foreach ($i in $ids) { if ("$($i[1])" -notmatch $script:Guid) { $p.Add("$($i[0]): '$($i[1])' isn't a GUID") } }
        foreach ($i in $prepared) { if ("$($i[1])" -and "$($i[1])" -notmatch $script:Guid) { $p.Add("$($i[0]): '$($i[1])' isn't a GUID (leave it empty until the Prepare step fills it)") } }
    }
    if ($Settings.deployIdentity.credential -notin 'certificate', 'federated') { $p.Add("deployIdentity.credential: '$($Settings.deployIdentity.credential)'; use certificate or federated, never a secret") }
    if ($Settings.deployIdentity.credential -eq 'certificate' -and -not $Settings.deployIdentity.certificateThumbprint) { $p.Add('deployIdentity.certificateThumbprint: missing') }
    if ($Settings.deployIdentity.credential -eq 'federated' -and -not $Settings.deployIdentity.federatedSubject) { $p.Add('deployIdentity.federatedSubject: missing') }
    if (-not @($Settings.operators).Count) { $p.Add('operators: name at least one person for each write step') }
    # The pilot's application owner approves its parallel run and the legacy account's disable (Chapter 11's Approvals table); an operator applies them.
    $owner = if ($Settings.pilot -is [Collections.IDictionary]) { "$($Settings.pilot['ownerUpn'])" } else { '' }
    if (-not $owner) { $p.Add('pilot.ownerUpn: missing; name the pilot application''s owner, who approves its parallel run and the day-31 disable') }
    elseif (-not $AllowPlaceholders -and $owner -notmatch '^[^@\s]+@[^@\s]+\.[^@\s]+$') { $p.Add("pilot.ownerUpn: '$owner' isn't a user principal name") }
    elseif ($owner -in @(@($Settings.operators) | ForEach-Object { "$($_.upn)" })) { $p.Add("pilot.ownerUpn: $owner is an operator; the application owner approves, an operator applies") }
    $p.ToArray()
}

function Read-NpiDeploySettings {
    <#
    .SYNOPSIS
        Reads the environment settings file, checks it with Test-NpiDeploySettings and returns it as a
        hashtable with its SHA-256 in _sha256. Throws, listing every problem, when the file isn't
        usable. -AllowPlaceholders lets the template itself pass.
    .EXAMPLE
        $s = Read-NpiDeploySettings -Path tests/fixtures/deploy/settings.test.json -Stage test
        $s.tenantId
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [ValidateSet('test', 'production', '')][string]$Stage = '', [switch]$AllowPlaceholders)
    $s = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 20
    $problems = @(Test-NpiDeploySettings -Settings $s -Stage $Stage -AllowPlaceholders:$AllowPlaceholders)
    if ($problems.Count) { throw ("The settings file {0} isn't usable:`n  {1}" -f $Path, ($problems -join "`n  ")) }
    $s['_sha256'] = Get-NpiFileHash -Path $Path
    $s
}

# ----------------------------------------------------------------------------- calls and clients

function Get-NpiDeployCallList {
    <#
    .SYNOPSIS
        Reads Chapter 11's call list (config/calls-ch11.json unless -Path names another file).
    .EXAMPLE
        (Get-NpiDeployCallList).calls | ForEach-Object id
    #>
    [CmdletBinding()]
    param([string]$Path = (Join-Path $script:ConfigRoot 'calls-ch11.json'))
    Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
}

function Get-NpiDeployRequiredPermission {
    <#
    .SYNOPSIS
        The union of a Chapter 11 task's calls: Graph permissions, AD rights and methods.
    .EXAMPLE
        Get-NpiDeployRequiredPermission -Task deploy-preflight
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][ValidateSet('deploy-preflight', 'deploy-smoke', 'deploy-rollback')][string]$Task)
    $calls = @((Get-NpiDeployCallList).calls | Where-Object { $_.tasks -contains $Task })
    [pscustomobject]@{
        Task             = $Task
        GraphPermissions = @($calls | Where-Object api -EQ 'graph' | ForEach-Object { $_.permissions } | Sort-Object -Unique)
        AdRights         = @($calls | Where-Object api -EQ 'ad' | ForEach-Object { $_.adRight } | Sort-Object -Unique)
        Methods          = @($calls | ForEach-Object { $_.method } | Sort-Object -Unique)
    }
}

function New-NpiDeployClient {
    <#
    .SYNOPSIS
        A client for one Chapter 11 task, shaped like NpiCore's reader so Invoke-NpiList and
        Invoke-NpiGetOne work on it. -Invoke is { param($Method, $Uri, $Body, $Headers) }; -AdInvoke is
        { param($Cmdlet, [hashtable]$Params) }.
    .EXAMPLE
        $fake = New-NpiDeployFixtureInvoker -Path tests/fixtures/deploy/tenant-test.json
        $client = New-NpiDeployClient -Cloud gcc -Task deploy-preflight -Invoke $fake.Invoke -AdInvoke $fake.AdInvoke
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][string]$Task, [Parameter(Mandatory)][scriptblock]$Invoke, [scriptblock]$AdInvoke)
    $list = Get-NpiDeployCallList
    if (-not $list.tasks.ContainsKey($Task)) { throw "Unknown task '$Task'." }
    [pscustomobject]@{
        Cloud    = Get-NpiCloud -Cloud $Cloud
        Task     = $Task
        Mode     = $list.tasks[$Task].mode
        Calls    = @($list.calls | Where-Object { $_.tasks -contains $Task })
        Invoke   = $Invoke
        AdInvoke = $AdInvoke
        Evidence = [Collections.Generic.List[object]]::new()
    }
}

function Invoke-NpiDeployWrite {
    <#
    .SYNOPSIS
        Sends one declared POST or PATCH on the cloud's own Graph host and records it. A read task
        can't write, and no call list entry here is a DELETE.
    .EXAMPLE
        Invoke-NpiDeployWrite -Client $client -CallId deploy-ca-policy-update -Bind @{ id = $policyId } -Body @{ state = 'disabled' }
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client, [Parameter(Mandatory)][string]$CallId, [hashtable]$Bind = @{}, $Body)
    if ($Client.Mode -ne 'write') { throw "Task '$($Client.Task)' reads only." }
    $r = Resolve-NpiUri -Reader $Client -CallId $CallId -Bind $Bind -AllowedMethods @('POST', 'PATCH')
    Assert-NpiHost -Uri $r.Uri -ExpectedHost $r.Host
    $Client.Evidence.Add([pscustomobject]@{ Call = $CallId; Method = $r.Call.method; Target = $r.Uri; At = [DateTime]::UtcNow.ToString('o') })
    & $Client.Invoke $r.Call.method $r.Uri $Body $null
}

function Invoke-NpiDeployAd {
    <#
    .SYNOPSIS
        Runs one declared Active Directory call (Get-ADComputer, Get-ADGroup, Get-ADUser,
        Test-ADServiceAccount, and for the rollback Enable-ADAccount and Disable-ADAccount) and records
        it. The cmdlet comes from the call list, never from the caller.
    .EXAMPLE
        Invoke-NpiDeployAd -Client $client -CallId ad-computer -Params @{ Identity = 'APP-TEST-01' }
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client, [Parameter(Mandatory)][string]$CallId, [hashtable]$Params = @{})
    $call = $Client.Calls | Where-Object { $_.id -eq $CallId }
    if (-not $call -or $call.api -ne 'ad') { throw "Undeclared Active Directory call '$CallId' for task '$($Client.Task)'." }
    if ($call.method -eq 'WRITE' -and $Client.Mode -ne 'write') { throw "Task '$($Client.Task)' reads only." }
    if (-not $Client.AdInvoke) { throw 'No Active Directory invoker: run on a domain-joined host, or pass -SkipAd.' }
    $shown = ($Params.Keys | Sort-Object | ForEach-Object { "-$_ $($Params[$_])" }) -join ' '
    $Client.Evidence.Add([pscustomobject]@{ Call = $CallId; Method = $call.method; Target = "$($call.cmdlet) $shown".Trim(); At = [DateTime]::UtcNow.ToString('o') })
    & $Client.AdInvoke $call.cmdlet $Params
}

# ----------------------------------------------------------------------------- invokers

function New-NpiDeployFixtureInvoker {
    <#
    .SYNOPSIS
        A fake Graph and Active Directory served from a fixture file: "graph" maps "METHOD /version/path"
        to a response body (or to { "__status": 400, "error": {...} }, which throws as Graph would);
        "ad" maps "Cmdlet|Identity" to a result. Writes not in the fixture succeed with an empty body.
        Every call is recorded in .Calls; nothing leaves the machine.
    .EXAMPLE
        $fake = New-NpiDeployFixtureInvoker -Path tests/fixtures/deploy/tenant-test.json
        $fake.Calls | Select-Object Method, Uri
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [hashtable]$Override = @{})
    $fx = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 30
    foreach ($k in $Override.Keys) { $fx.graph[$k] = $Override[$k] }
    $calls = [Collections.Generic.List[object]]::new()
    $graph = $fx.graph; $ad = $fx.ad
    $state = [pscustomobject]@{ Calls = $calls; Fixture = $fx; Invoke = $null; AdInvoke = $null }
    $state.Invoke = {
        param($Method, $Uri, $Body, $Headers)
        $calls.Add([pscustomobject]@{ Method = $Method; Uri = $Uri; Body = $Body; Headers = $Headers })
        $u = [Uri]$Uri
        $key = "$Method $([Uri]::UnescapeDataString($u.AbsolutePath))"
        # A route with its query (the operators' role reads) wins over the path alone.
        $withQuery = "$key$([Uri]::UnescapeDataString($u.Query))"
        if ($graph.ContainsKey($withQuery)) { $key = $withQuery }
        if ($graph.ContainsKey($key)) {
            $r = $graph[$key]
            if ($r -is [Collections.IDictionary] -and $r.ContainsKey('__status')) { throw "Graph returned $($r['__status']) ($($r.error.code)): $($r.error.message)" }
            return $r
        }
        if ($Method -in 'PATCH', 'POST') { return @{} }
        throw "Graph returned 404 (Request_ResourceNotFound): the fixture has no $key"
    }.GetNewClosure()
    $state.AdInvoke = {
        param($Cmdlet, [hashtable]$Params)
        $calls.Add([pscustomobject]@{ Method = 'AD'; Uri = "$Cmdlet $($Params.Identity)"; Body = $Params; Headers = $null })
        $key = "$Cmdlet|$($Params.Identity)"
        if ($ad.ContainsKey($key)) { return $ad[$key] }
        if ($Cmdlet -in 'Enable-ADAccount', 'Disable-ADAccount') { return $null }
        throw "Cannot find an object with identity: '$($Params.Identity)'"
    }.GetNewClosure()
    $state
}

function New-NpiDeployLiveInvoker {
    <#
    .SYNOPSIS
        The live Graph invoker, through Invoke-MgGraphRequest. It refuses to start when the Graph
        session is in another cloud or tenant, and, for a write task, when the session isn't a
        person's delegated sign-in. Graph errors throw, as the fake's do.
    .EXAMPLE
        $invoke = New-NpiDeployLiveInvoker -Cloud gcc -TenantId $s.tenantId -Task deploy-smoke
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][string]$TenantId, [Parameter(Mandatory)][string]$Task)
    $c = Get-NpiCloud -Cloud $Cloud
    $mg = Get-MgContext
    if (-not $mg) { throw 'Not signed in to Microsoft Graph.' }
    if ($mg.Environment -ne $c.GraphEnvironment) { throw "Graph session is in '$($mg.Environment)', not '$($c.GraphEnvironment)'." }
    if ($mg.TenantId -ne $TenantId) { throw "Graph session is signed in to tenant '$($mg.TenantId)', not '$TenantId'." }
    $mode = (Get-NpiDeployCallList).tasks[$Task].mode
    if ($mode -eq 'write' -and $mg.AuthType -ne 'Delegated') { throw "Task '$Task' writes, so it runs only as a person, delegated: sign in with Connect-MgGraph -Scopes." }
    $graph = $c.Graph
    {
        param($Method, $Uri, $Body, $Headers)
        if (-not $Uri.StartsWith("$graph/")) { throw "Refusing $Uri" }
        $p = @{ Method = $Method; Uri = $Uri; OutputType = 'Hashtable' }
        if ($Headers) { $p.Headers = $Headers }
        if ($null -ne $Body) { $p.Body = ($Body | ConvertTo-Json -Depth 20 -Compress); $p.ContentType = 'application/json' }
        $resp = Invoke-MgGraphRequest @p
        if ($null -eq $resp) { @{} } else { $resp }
    }.GetNewClosure()
}

function New-NpiDeployLiveAdInvoker {
    <#
    .SYNOPSIS
        The live Active Directory invoker, with the ActiveDirectory module, against -Server. It runs
        only the cmdlets Chapter 11 declares for the task.
    .EXAMPLE
        $adInvoke = New-NpiDeployLiveAdInvoker -Server dc01.corp.contoso.example -Task deploy-preflight
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Server, [Parameter(Mandatory)][string]$Task)
    Import-Module ActiveDirectory -ErrorAction Stop
    $allowed = @((Get-NpiDeployCallList).calls | Where-Object { $_.api -eq 'ad' -and $_.tasks -contains $Task } | ForEach-Object cmdlet)
    $srv = $Server
    {
        param($Cmdlet, [hashtable]$Params)
        if ($Cmdlet -notin $allowed) { throw "Refusing $Cmdlet" }
        $p = @{} + $Params
        # Test-ADServiceAccount tests the local host; it takes no -Server.
        if ($Cmdlet -ne 'Test-ADServiceAccount') { $p.Server = $srv }
        & $Cmdlet @p
    }.GetNewClosure()
}

# ----------------------------------------------------------------------------- results

function New-NpiDeployResult {
    param([string]$Id, [string]$Gate, [string]$Check, [ValidateSet('Pass', 'Fail', 'Warn', 'NotRun')][string]$Status, [string]$Expected, [string]$Actual)
    [pscustomobject][ordered]@{ Id = $Id; Gate = $Gate; Check = $Check; Status = $Status; Expected = $Expected; Actual = $Actual }
}

function Get-NpiDeployPlanIds {
    param($Skus, [string[]]$PlanIds)
    @($Skus | Where-Object { $_['capabilityStatus'] -eq 'Enabled' -and @($_['servicePlans'] | Where-Object { $_['servicePlanId'] -in $PlanIds }).Count })
}

# ----------------------------------------------------------------------------- the preflight

function Invoke-NpiDeployPreflight {
    <#
    .SYNOPSIS
        The checks before a stage starts, each with its gate, what it expects and what it found:
        PF-01 the settings file; PF-02 the deployment identity's credential; PF-03 Workload ID Premium;
        PF-04 Entra ID P1 or P2; PF-05 the reader's permissions are reads; PF-06 each operator holds,
        or is eligible for, the roles their steps need; PF-07 the pilot and synthetic apps exist with no
        secret; PF-08 the workload policies exist and are report-only or off; PF-09 the VK-NPI
        baseline; PF-10 the gMSA test host and retriever group; PF-11 (production only) the test
        stage's smoke test passed in another tenant. Also returns the snapshot the rollback restores.
    .EXAMPLE
        $r = Invoke-NpiDeployPreflight -Client $client -Settings $s -BaselinePath tests/fixtures/deploy/vk-baseline.json
        $r.Results | Format-Table Id, Status, Check
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Client, [Parameter(Mandatory)][hashtable]$Settings,
        [string]$BaselinePath, [string]$PromotionEvidencePath, [switch]$SkipAd
    )
    $out = [Collections.Generic.List[object]]::new()
    $out.Add((New-NpiDeployResult 'PF-01' 'All' 'Settings file: no secret, no placeholder, this stage' 'Pass' 'A complete file for this stage' ("{0}, {1}, sha256 {2}" -f $Settings.environment, $Settings.cloud, "$($Settings._sha256)".Substring(0, [Math]::Min(12, "$($Settings._sha256)".Length)))))

    # PF-02: the deployment identity signs in with a certificate or a federated credential, never a secret.
    $dep = Invoke-NpiGetOne -Reader $Client -CallId 'deploy-app-by-appid' -Bind @{ appId = $Settings.deployIdentity.clientId } -Query '$select=id,appId,displayName,passwordCredentials,keyCredentials'
    $pw = @($dep['passwordCredentials']).Where({ $_ }).Count; $kc = @($dep['keyCredentials']).Where({ $_ }).Count
    $detail = "$pw secret(s), $kc certificate(s)"
    $ok = ($pw -eq 0)
    if ($Settings.deployIdentity.credential -eq 'certificate') {
        # customKeyIdentifier is binary (base64 in JSON); for an uploaded certificate it is expected to
        # hold the SHA-1 thumbprint (research gaps, row 102).
        $thumbs = @($dep['keyCredentials'] | Where-Object { $_ -and $_['customKeyIdentifier'] } | ForEach-Object {
                try { [BitConverter]::ToString([Convert]::FromBase64String("$($_['customKeyIdentifier'])")).Replace('-', '') } catch { "$($_['customKeyIdentifier'])" } })
        if ($Settings.deployIdentity.certificateThumbprint.ToUpperInvariant() -notin $thumbs) { $ok = $false; $detail += '; the settings thumbprint isn''t on the app' }
    } else {
        $fics = @(Invoke-NpiList -Reader $Client -CallId 'deploy-app-fic' -Bind @{ id = $dep['id'] })
        $match = @($fics | Where-Object { $_['subject'] -ceq $Settings.deployIdentity.federatedSubject -and $_['issuer'] -ceq $Settings.deployIdentity.federatedIssuer })
        $detail += "; $($fics.Count) federated credential(s), $($match.Count) matching the settings"
        if (-not $match.Count) { $ok = $false }
    }
    $out.Add((New-NpiDeployResult 'PF-02' 'G3' 'Deployment identity uses a certificate or federated credential, no secret' $(if ($ok) { 'Pass' } else { 'Fail' }) "0 secrets; the $($Settings.deployIdentity.credential) in the settings" $detail))

    # PF-03, PF-04: licenses.
    $skus = @(Invoke-NpiList -Reader $Client -CallId 'deploy-subscribed-skus' -Query '$select=skuId,skuPartNumber,capabilityStatus,prepaidUnits,servicePlans')
    $wid = @(Get-NpiDeployPlanIds -Skus $skus -PlanIds $script:Plans.WorkloadIdPremium)
    $units = 0; foreach ($x in $wid) { $units += [int]$x['prepaidUnits']['enabled'] }
    $inScope = @($Settings.rings | ForEach-Object { $_.servicePrincipals } | Where-Object { $_ }).Count + 1
    $out.Add((New-NpiDeployResult 'PF-03' 'G4' 'Workload ID Premium, to create or change workload Conditional Access' $(if (-not $wid.Count) { 'Fail' } elseif ($units -lt $inScope) { 'Warn' } else { 'Pass' }) "An enabled AAD_WRKLDID_P1 or P2 plan; $inScope workload identities in scope (rings and the synthetic)" $(if ($wid.Count) { "$(@($wid | ForEach-Object { $_['skuPartNumber'] }) -join ', '), $units enabled unit(s)" } else { 'none' })))
    $p1 = @(Get-NpiDeployPlanIds -Skus $skus -PlanIds $script:Plans.EntraP1OrP2)
    $out.Add((New-NpiDeployResult 'PF-04' 'G6' 'Entra ID P1 or P2, for the service principal sign-in logs' $(if ($p1.Count) { 'Pass' } else { 'Fail' }) 'An enabled AAD_PREMIUM or AAD_PREMIUM_P2 plan' $(if ($p1.Count) { (@($p1 | ForEach-Object { $_['skuPartNumber'] }) -join ', ') } else { 'none' })))

    # PF-05: the reader's Graph application permissions are reads only.
    $graphSp = Invoke-NpiGetOne -Reader $Client -CallId 'deploy-graph-sp' -Query '$select=id,appRoles'
    $names = @{}; foreach ($r in @($graphSp['appRoles'])) { $names["$($r['id'])"] = "$($r['value'])" }
    $assigned = @(Invoke-NpiList -Reader $Client -CallId 'deploy-sp-approles' -Bind @{ appId = $Settings.readerIdentity.clientId } | Where-Object { $_['resourceId'] -eq $graphSp['id'] } | ForEach-Object { $n = $names["$($_['appRoleId'])"]; if ($n) { $n } else { "$($_['appRoleId'])" } } | Sort-Object -Unique)
    $writes = @($assigned | Where-Object { $_ -match 'Write|\.Send$|FullControl' })
    $out.Add((New-NpiDeployResult 'PF-05' 'G4' 'Reader identity holds Graph read permissions only' $(if ($writes.Count) { 'Fail' } else { 'Pass' }) 'No ReadWrite application permission' $(if ($assigned.Count) { $assigned -join ', ' } else { 'none' })))

    # PF-06: each operator holds, or is eligible for, the roles their steps need.
    foreach ($op in @($Settings.operators)) {
        $f = "principalId eq '$($op.objectId)'"
        $active = @(Invoke-NpiList -Reader $Client -CallId 'deploy-role-assignments' -Query "`$filter=$f" | ForEach-Object { "$($_['roleDefinitionId'])" })
        $eligible = @(Invoke-NpiList -Reader $Client -CallId 'deploy-role-eligibility' -Query "`$filter=$f" | ForEach-Object { "$($_['roleDefinitionId'])" })
        $missing = @(); $how = @()
        foreach ($role in @($op.roles)) {
            $id = $script:Roles[$role]
            if (-not $id) { $missing += "$role (unknown to this check)"; continue }
            if ($id -in $eligible) { $how += "$role eligible" } elseif ($id -in $active) { $how += "$role active" } else { $missing += $role }
        }
        $standing = @($how | Where-Object { $_ -like '* active' })
        $status = if ($missing.Count) { 'Fail' } elseif ($standing.Count) { 'Warn' } else { 'Pass' }
        $out.Add((New-NpiDeployResult 'PF-06' 'G4' "Operator $($op.name): roles for $(@($op.steps) -join ', ')" $status "$(@($op.roles) -join ', '), eligible through PIM (design guidance: no standing assignment)" $(if ($missing.Count) { "missing $($missing -join ', ')" } else { $how -join '; ' })))
    }

    # PF-07: the pilot and synthetic apps exist and hold no secret.
    foreach ($a in @(@('pilot', $Settings.pilot.appObjectId), @('synthetic', $Settings.smoke.appObjectId))) {
        if (-not "$($a[1])") { $out.Add((New-NpiDeployResult 'PF-07' 'G1' "The $($a[0]) app registration exists, single-tenant" 'Fail' 'Found' 'no object ID in the settings file: run the Prepare step')); continue }
        try {
            $app = Invoke-NpiGetOne -Reader $Client -CallId 'deploy-app' -Bind @{ id = $a[1] } -Query '$select=id,appId,displayName,passwordCredentials,keyCredentials,signInAudience'
            $pw = @($app['passwordCredentials']).Where({ $_ }).Count
            # The pilot keeps its old secret through the parallel run (the guide's Step 5); the synthetic never has one.
            $st = if ($a[0] -eq 'synthetic' -and $pw) { 'Fail' } elseif ($app['signInAudience'] -ne 'AzureADMyOrg') { 'Fail' } else { 'Pass' }
            $out.Add((New-NpiDeployResult 'PF-07' 'G1' "The $($a[0]) app registration exists, single-tenant" $st $(if ($a[0] -eq 'synthetic') { 'AzureADMyOrg, 0 secrets' } else { 'AzureADMyOrg; its old secret stays until the parallel run ends' }) "$($app['displayName']), $($app['signInAudience']), $pw secret(s)"))
        } catch { $out.Add((New-NpiDeployResult 'PF-07' 'G1' "The $($a[0]) app registration exists, single-tenant" 'Fail' 'Found' "$($_.Exception.Message)")) }
    }

    # PF-08: the workload policies exist and aren't enforced yet; snapshot them and the app policies.
    $snapshot = [ordered]@{ tenantId = $Settings.tenantId; environment = $Settings.environment; takenAt = ''; conditionalAccess = @(); tenantAppManagementPolicy = $null; appManagementPolicy = $null }
    if (-not @($Settings.conditionalAccess.policies | Where-Object { $_ }).Count) {
        $out.Add((New-NpiDeployResult 'PF-08' 'G4' 'Workload policies recorded in the settings file' 'Warn' 'Recorded once Chapter 08''s script creates them, report-only, in this stage' 'none recorded yet'))
    }
    foreach ($pol in @($Settings.conditionalAccess.policies | Where-Object { $_ })) {
        try {
            $ca = Invoke-NpiGetOne -Reader $Client -CallId 'deploy-ca-policy' -Bind @{ id = $pol.id } -Query '$select=id,displayName,state,conditions'
            $snapshot.conditionalAccess += [ordered]@{ id = $ca['id']; displayName = $ca['displayName']; state = $ca['state'] }
            $st = if ($ca['state'] -eq 'enabled' -and $Settings.environment -eq 'test') { 'Warn' } else { 'Pass' }
            $out.Add((New-NpiDeployResult 'PF-08' 'G4' "Workload policy $($pol.name)" $st 'Exists; enabledForReportingButNotEnforced or disabled before the stage' "$($ca['state'])"))
        } catch { $out.Add((New-NpiDeployResult 'PF-08' 'G4' "Workload policy $($pol.name)" 'Warn' 'Exists, or is created report-only by Chapter 08''s script in this stage' 'not found')) }
    }
    $snapshot.tenantAppManagementPolicy = Invoke-NpiGetOne -Reader $Client -CallId 'deploy-tenant-app-policy'
    if ($Settings.appManagementPolicy.pilotPolicyId) {
        try { $snapshot.appManagementPolicy = Invoke-NpiGetOne -Reader $Client -CallId 'deploy-app-mgmt-policy' -Bind @{ id = $Settings.appManagementPolicy.pilotPolicyId } } catch { $snapshot.appManagementPolicy = $null }
    }

    # PF-09: the VK-NPI baseline.
    if ($BaselinePath) {
        $vk = @(Get-Content -LiteralPath $BaselinePath -Raw | ConvertFrom-Json)
        $npi = @($vk | Where-Object { "$($_.CheckId)" -like 'VK-NPI-*' })
        $err = @($npi | Where-Object Status -EQ 'Error')
        $summary = ($npi | ForEach-Object { '{0} {1} {2}' -f ("$($_.CheckId)" -replace 'VK-NPI-', ''), $_.Status, $_.Count }) -join '; '
        $out.Add((New-NpiDeployResult 'PF-09' 'G1-G6' 'VK-NPI baseline recorded before the change' $(if (-not $npi.Count -or $err.Count) { 'Fail' } else { 'Pass' }) 'Every VK-NPI check ran (Pass, Fail or Warn are all a baseline; Error is not)' $summary))
    } else { $out.Add((New-NpiDeployResult 'PF-09' 'G1-G6' 'VK-NPI baseline recorded before the change' 'Fail' 'A ValidationResults.json from this tenant' 'no -BaselinePath')) }

    # PF-10: the gMSA test host and the retriever group.
    if ($SkipAd) { $out.Add((New-NpiDeployResult 'PF-10' 'G5' 'gMSA test host and retriever group exist' 'NotRun' 'Both found' '-SkipAd')) }
    else {
        try {
            $h = Invoke-NpiDeployAd -Client $Client -CallId 'ad-computer' -Params @{ Identity = $Settings.ad.gmsaTestHost }
            $g = Invoke-NpiDeployAd -Client $Client -CallId 'ad-group' -Params @{ Identity = $Settings.ad.gmsaRetrieverGroup }
            $out.Add((New-NpiDeployResult 'PF-10' 'G5' 'gMSA test host and retriever group exist' 'Pass' 'Both found' "$($h.DNSHostName); $($g.Name)"))
        } catch { $out.Add((New-NpiDeployResult 'PF-10' 'G5' 'gMSA test host and retriever group exist' 'Fail' 'Both found' "$($_.Exception.Message)")) }
    }

    # PF-11: production only, the test stage passed in another tenant.
    if ($Settings.environment -eq 'production') {
        if (-not $PromotionEvidencePath) { $out.Add((New-NpiDeployResult 'PF-11' 'Promotion' 'Test stage smoke test passed' 'Fail' 'The test stage''s smoke results, all Pass' 'no -PromotionEvidencePath')) }
        else {
            $ev = Get-Content -LiteralPath (Join-Path $PromotionEvidencePath 'manifest.json') -Raw | ConvertFrom-Json
            $res = @(Get-Content -LiteralPath (Join-Path $PromotionEvidencePath 'results.json') -Raw | ConvertFrom-Json)
            $bad = @($res | Where-Object { $_.Status -notin 'Pass' })
            $ok = ($ev.environment -eq 'test' -and $ev.tenantId -ne $Settings.tenantId -and -not $bad.Count -and $res.Count)
            $out.Add((New-NpiDeployResult 'PF-11' 'Promotion' 'Test stage smoke test passed, in another tenant' $(if ($ok) { 'Pass' } else { 'Fail' }) 'environment test, a different tenant, every check Pass' "$($ev.environment), tenant $($ev.tenantId), $($res.Count - $bad.Count)/$($res.Count) Pass"))
        }
    }
    [pscustomobject]@{ Results = $out.ToArray(); Snapshot = $snapshot }
}

# ----------------------------------------------------------------------------- the smoke test

function Invoke-NpiDeploySmokeTest {
    <#
    .SYNOPSIS
        The smoke test with the synthetic service principal and service account, each check with what
        it expects: ST-01 the synthetic app is in the register with two owners and no secret; ST-02 the
        synthetic service account is in the register as HIGH (the detection works); ST-03 the app
        management policy refuses a new secret on the synthetic app (the probe; a secret that gets
        through is removed at once and the check fails); ST-04 its federated credential matches the
        settings exactly; ST-05 each workload policy assigns the synthetic service principal directly,
        in the expected state; ST-06 its sign-ins show the policy's result (Graph beta); ST-07 the gMSA
        test host can retrieve the gMSA's password.
    .EXAMPLE
        $r = Invoke-NpiDeploySmokeTest -Client $client -Settings $s -RegisterRun tests/fixtures/deploy/register-run -ExpectCaState ReportOnly -AsOf ([datetime]'2026-11-02T12:00:00Z')
        # After a production ring is enforced, check only that ring's policies:
        # Invoke-NpiDeploySmokeTest -Client $client -Settings $s -RegisterRun $run -ExpectCaState Enabled -Ring Ring1
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Client, [Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$RegisterRun,
        [ValidateSet('ReportOnly', 'Enabled')][string]$ExpectCaState = 'ReportOnly', [Alias('Wave')][string[]]$Ring, [datetime]$AsOf = [datetime]::UtcNow, [int]$SignInHours = 24, [switch]$SkipAd
    )
    $out = [Collections.Generic.List[object]]::new()
    $sm = $Settings.smoke
    # -Ring checks only the policies of those rings (Chapter 08's): a production ring enforced while the rest stay report-only.
    $policies = @($Settings.conditionalAccess.policies | Where-Object { $_ })
    if ($Ring) { $policies = @($policies | Where-Object { $_.ring -in $Ring }) }
    $register = @(Get-Content -LiteralPath (Join-Path $RegisterRun 'register.json') -Raw | ConvertFrom-Json)
    $man = Get-Content -LiteralPath (Join-Path $RegisterRun 'manifest.json') -Raw | ConvertFrom-Json
    if ($man.tenantId -ne $Settings.tenantId) { throw "The register run is for tenant $($man.tenantId), not $($Settings.tenantId)." }

    $row = @($register | Where-Object { $_.Type -eq 'AppRegistration' -and $_.ObjectId -eq $sm.appObjectId })
    if ($row.Count) {
        $r = $row[0]; $ok = ([int]$r.OwnerCount -ge 2 -and [int]$r.Secrets -eq 0)
        $out.Add((New-NpiDeployResult 'ST-01' 'G1' 'Synthetic app is in the register with two owners and no secret' $(if ($ok) { 'Pass' } else { 'Fail' }) 'OwnerCount 2 or more, Secrets 0, CredentialKind Federated' "OwnerCount $($r.OwnerCount), Secrets $($r.Secrets), CredentialKind $($r.CredentialKind)"))
    } else { $out.Add((New-NpiDeployResult 'ST-01' 'G1' 'Synthetic app is in the register with two owners and no secret' 'Fail' 'A register row' 'not in the register')) }

    $acct = @($register | Where-Object { $_.Source -eq 'AD' -and $_.Name -eq $sm.adAccount })
    if ($acct.Count) {
        $a = $acct[0]
        $out.Add((New-NpiDeployResult 'ST-02' 'G1' 'Synthetic service account is detected and rated HIGH' $(if ($a.Risk -eq 'HIGH') { 'Pass' } else { 'Fail' }) 'Risk HIGH (its password never expires, by design of the synthetic)' "Risk $($a.Risk): $($a.RiskReasons)"))
    } else { $out.Add((New-NpiDeployResult 'ST-02' 'G1' 'Synthetic service account is detected and rated HIGH' 'Fail' 'A register row' 'not in the register')) }

    # ST-03: the probe. The response's secretText is never kept: only the keyId, to remove it.
    try {
        $resp = Invoke-NpiDeployWrite -Client $Client -CallId 'deploy-app-addpassword' -Bind @{ id = $sm.appObjectId } -Body @{ passwordCredential = @{ displayName = 'npi-smoke-probe'; endDateTime = $AsOf.AddHours(1).ToString('o') } }
        $keyId = "$($resp['keyId'])"; $resp = $null
        $null = Invoke-NpiDeployWrite -Client $Client -CallId 'deploy-app-removepassword' -Bind @{ id = $sm.appObjectId } -Body @{ keyId = $keyId }
        $out.Add((New-NpiDeployResult 'ST-03' 'G3' 'App management policy refuses a new secret on the synthetic app' 'Fail' 'The addPassword request refused' "accepted; the secret $keyId was removed at once"))
    } catch {
        $m = "$($_.Exception.Message)"
        $notAuth = $m -match '\b(401|403)\b|Authorization_RequestDenied|Forbidden'
        $out.Add((New-NpiDeployResult 'ST-03' 'G3' 'App management policy refuses a new secret on the synthetic app' $(if ($notAuth) { 'Fail' } else { 'Pass' }) 'The addPassword request refused' $(if ($notAuth) { "not authorized to probe: $($m.Substring(0, [Math]::Min(120, $m.Length)))" } else { "refused: $($m.Substring(0, [Math]::Min(120, $m.Length)))" })))
    }

    $fics = @(Invoke-NpiList -Reader $Client -CallId 'deploy-app-fic' -Bind @{ id = $sm.appObjectId })
    $m = @($fics | Where-Object { $_['issuer'] -ceq $sm.federatedIssuer -and $_['subject'] -ceq $sm.federatedSubject -and @($_['audiences']).Count -eq 1 -and $_['audiences'][0] -ceq 'api://AzureADTokenExchange' })
    $out.Add((New-NpiDeployResult 'ST-04' 'G5' 'Synthetic app''s federated credential matches the settings exactly' $(if ($m.Count -eq 1) { 'Pass' } else { 'Fail' }) "issuer $($sm.federatedIssuer), subject $($sm.federatedSubject), audience api://AzureADTokenExchange" "$($fics.Count) credential(s), $($m.Count) exact match(es)"))

    $want = if ($ExpectCaState -eq 'ReportOnly') { 'enabledForReportingButNotEnforced' } else { 'enabled' }
    if (-not $policies.Count) {
        $out.Add((New-NpiDeployResult 'ST-05' 'G4' 'Workload policies assign the synthetic service principal directly' 'Fail' 'Policies recorded in the settings file' 'none recorded'))
    }
    foreach ($pol in $policies) {
        $ca = Invoke-NpiGetOne -Reader $Client -CallId 'deploy-ca-policy' -Bind @{ id = $pol.id } -Query '$select=id,displayName,state,conditions'
        $incl = @($ca['conditions']['clientApplications']['includeServicePrincipals'])
        $direct = $sm.spObjectId -in $incl
        $out.Add((New-NpiDeployResult 'ST-05' 'G4' "Workload policy $($pol.name) assigns the synthetic service principal directly" $(if ($direct -and $ca['state'] -eq $want) { 'Pass' } else { 'Fail' }) "state $want; the synthetic's object ID in includeServicePrincipals" "state $($ca['state']); assigned directly: $direct"))
    }

    $from = $AsOf.AddHours(-$SignInHours).ToString('yyyy-MM-ddTHH:mm:ssZ')
    $q = "`$filter=appId eq '$($sm.appClientId)' and createdDateTime ge $from and signInEventTypes/any(t: t eq 'servicePrincipal')&`$top=50"
    $signins = @(Invoke-NpiList -Reader $Client -CallId 'deploy-signins' -Query $q -Headers @{ Prefer = 'include-unknown-enum-members' })
    $ids = @($policies | ForEach-Object id)
    $seen = @($signins | ForEach-Object { @($_['appliedConditionalAccessPolicies']) } | Where-Object { $_ -and $_['id'] -in $ids } | ForEach-Object { "$($_['result'])" } | Sort-Object -Unique)
    $expected = if ($ExpectCaState -eq 'ReportOnly') { @('reportOnlySuccess', 'reportOnlyFailure', 'reportOnlyNotApplied') } else { @('success', 'failure', 'notApplied') }
    $st = if (-not $signins.Count) { 'Warn' } elseif (@($seen | Where-Object { $_ -in $expected }).Count) { 'Pass' } else { 'Fail' }
    $out.Add((New-NpiDeployResult 'ST-06' 'G4' 'Synthetic sign-ins show the workload policies'' result (Graph beta)' $st "A $($expected -join ' / ') result for the listed policies" "$($signins.Count) sign-in(s) since $from; results: $(if ($seen.Count) { $seen -join ', ' } else { 'none' })"))

    if ($SkipAd) {
        $out.Add((New-NpiDeployResult 'ST-07' 'G5' 'gMSA test host can retrieve the gMSA''s password' 'NotRun' 'True' '-SkipAd: run Test-ADServiceAccount on the test host'))
    } else {
        try {
            $u = Invoke-NpiDeployAd -Client $Client -CallId 'ad-user' -Params @{ Identity = $sm.adAccount }
            $t = Invoke-NpiDeployAd -Client $Client -CallId 'ad-test-gmsa' -Params @{ Identity = $Settings.ad.gmsaName }
            $out.Add((New-NpiDeployResult 'ST-07' 'G5' 'gMSA test host can retrieve the gMSA''s password' $(if ($t -eq $true -and $u.Enabled) { 'Pass' } else { 'Fail' }) 'Test-ADServiceAccount True; the synthetic account enabled' "Test-ADServiceAccount $t; $($sm.adAccount) enabled $($u.Enabled)"))
        } catch { $out.Add((New-NpiDeployResult 'ST-07' 'G5' 'gMSA test host can retrieve the gMSA''s password' 'Fail' 'True' "$($_.Exception.Message)")) }
    }
    [pscustomobject]@{ Results = $out.ToArray() }
}

# ----------------------------------------------------------------------------- the rollback

function New-NpiDeployRollbackPlan {
    <#
    .SYNOPSIS
        The rollback as a reviewed plan, from the settings and the preflight's snapshot: each workload
        policy back to report-only (-To ReportOnly, a production ring) or off (-To Disabled, the test
        stage); the tenant default app management policy restored from the snapshot; the pilot's
        app-specific policy turned off; each legacy account the conversion disabled re-enabled; and,
        with -IncludeSmokeCleanup, the synthetic service principal and account disabled. Nothing is
        deleted. Returns the plan; the caller writes it and a reviewer approves its SHA-256.
    .EXAMPLE
        $plan = New-NpiDeployRollbackPlan -Settings $s -SnapshotPath out/deploy-test/preflight/snapshot.json -To Disabled -IncludeSmokeCleanup -AsOf ([datetime]'2026-11-02T12:00:00Z')
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$SnapshotPath,
        [Parameter(Mandatory)][ValidateSet('ReportOnly', 'Disabled')][string]$To, [Alias('Wave')][string[]]$Ring, [switch]$IncludeSmokeCleanup, [datetime]$AsOf = [datetime]::UtcNow
    )
    $snap = Get-Content -LiteralPath $SnapshotPath -Raw | ConvertFrom-Json -AsHashtable -Depth 30
    if ($snap.tenantId -ne $Settings.tenantId) { throw "The snapshot is for tenant $($snap.tenantId), not $($Settings.tenantId)." }
    $state = if ($To -eq 'ReportOnly') { 'enabledForReportingButNotEnforced' } else { 'disabled' }
    $actions = [Collections.Generic.List[object]]::new()
    $n = 0
    $policies = @($Settings.conditionalAccess.policies)
    if ($Ring) { $policies = @($policies | Where-Object { $_.ring -in $Ring -or -not $_.ring }) }
    foreach ($p in $policies) {
        $actions.Add([ordered]@{ id = ('RB-{0:00}' -f ++$n); gate = 'G4'; kind = 'ConditionalAccessState'; call = 'deploy-ca-policy-update'; bind = @{ id = $p.id }; body = @{ state = $state }; target = $p.name; why = "Learn's roll back for workload policies: disable (or keep report-only); never deleted" })
    }
    if (-not $Ring) {
        $t = $snap.tenantAppManagementPolicy
        if ($t) {
            $body = [ordered]@{ isEnabled = [bool]$t['isEnabled'] }
            foreach ($k in 'applicationRestrictions', 'servicePrincipalRestrictions') { if ($t.ContainsKey($k) -and $null -ne $t[$k]) { $body[$k] = $t[$k] } }
            $actions.Add([ordered]@{ id = ('RB-{0:00}' -f ++$n); gate = 'G3'; kind = 'TenantAppPolicyRestore'; call = 'deploy-tenant-app-policy-update'; bind = @{}; body = $body; target = 'defaultAppManagementPolicy'; why = 'Restore the tenant default policy exactly as the preflight found it' })
        }
        if ($Settings.appManagementPolicy.pilotPolicyId) {
            $actions.Add([ordered]@{ id = ('RB-{0:00}' -f ++$n); gate = 'G3'; kind = 'AppPolicyOff'; call = 'deploy-app-mgmt-policy-update'; bind = @{ id = $Settings.appManagementPolicy.pilotPolicyId }; body = @{ isEnabled = $false }; target = $Settings.appManagementPolicy.pilotPolicyName; why = 'Turn the pilot''s app-specific policy off; never deleted' })
        }
        foreach ($acct in @($Settings.pilot.legacyAdAccounts | Where-Object { $_ })) {
            $actions.Add([ordered]@{ id = ('RB-{0:00}' -f ++$n); gate = 'G5'; kind = 'AdEnable'; call = 'ad-enable'; params = @{ Identity = $acct }; target = $acct; why = 'The guide''s Step 5 rollback: re-enable the legacy account, then revert the application''s configuration' })
        }
    }
    if ($IncludeSmokeCleanup) {
        $actions.Add([ordered]@{ id = ('RB-{0:00}' -f ++$n); gate = 'Cleanup'; kind = 'SpDisable'; call = 'deploy-sp-update'; bind = @{ id = $Settings.smoke.spObjectId }; body = @{ accountEnabled = $false }; target = 'synthetic service principal'; why = 'Stop the synthetic signing in; deletion is a person''s decision, by hand' })
        $actions.Add([ordered]@{ id = ('RB-{0:00}' -f ++$n); gate = 'Cleanup'; kind = 'AdDisable'; call = 'ad-disable'; params = @{ Identity = $Settings.smoke.adAccount }; target = $Settings.smoke.adAccount; why = 'Disable the synthetic service account; never deleted by code' })
    }
    [ordered]@{
        kind = 'npi-deploy-rollback'; environment = $Settings.environment; cloud = $Settings.cloud; tenantId = $Settings.tenantId
        changeRecord = $Settings.changeRecord; settingsSha256 = $Settings._sha256; snapshotSha256 = (Get-NpiFileHash -Path $SnapshotPath)
        to = $To; rings = @($Ring); created = $AsOf.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'); actions = $actions.ToArray()
    }
}

function Invoke-NpiDeployRollbackPlan {
    <#
    .SYNOPSIS
        Applies a rollback plan only when its SHA-256 is the one a reviewer approved, it's for this
        tenant and it's at most seven days old. A dry run unless -Apply. Each Conditional Access action
        re-reads the policy first and skips it when it's already in the target state.
    .EXAMPLE
        $sha = (Get-FileHash out/rollback/rollback-plan.json -Algorithm SHA256).Hash.ToLower()
        Invoke-NpiDeployRollbackPlan -Client $client -PlanPath out/rollback/rollback-plan.json -ApprovedSha256 $sha -TenantId $s.tenantId
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client, [Parameter(Mandatory)][string]$PlanPath, [Parameter(Mandatory)][string]$ApprovedSha256, [Parameter(Mandatory)][string]$TenantId, [datetime]$AsOf = [datetime]::UtcNow, [switch]$Apply)
    $sha = Get-NpiFileHash -Path $PlanPath
    if ($sha -ne $ApprovedSha256.ToLowerInvariant()) { throw "The plan's SHA-256 is $sha, not the approved $ApprovedSha256. Nothing was sent." }
    $plan = Get-Content -LiteralPath $PlanPath -Raw | ConvertFrom-Json -AsHashtable -Depth 30
    if ($plan.tenantId -ne $TenantId) { throw "The plan is for tenant $($plan.tenantId), not $TenantId. Nothing was sent." }
    $age = $AsOf.ToUniversalTime() - [datetime]::Parse($plan.created, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal)
    if ($age.TotalDays -gt 7) { throw "The plan is $([int]$age.TotalDays) days old; make a new one. Nothing was sent." }
    $results = foreach ($a in @($plan.actions)) {
        $status = if ($Apply) { 'Applied' } else { 'WouldApply' }
        $detail = "$($a.kind) $($a.target)"
        try {
            if ($a.kind -eq 'ConditionalAccessState') {
                $cur = Invoke-NpiGetOne -Reader $Client -CallId 'deploy-ca-policy' -Bind $a.bind -Query '$select=id,state'
                if ($cur['state'] -eq $a.body.state) { $status = 'AlreadyDone'; $detail += " (already $($cur['state']))" }
                else { $detail += " $($cur['state']) -> $($a.body.state)"; if ($Apply) { $null = Invoke-NpiDeployWrite -Client $Client -CallId $a.call -Bind $a.bind -Body $a.body } }
            } elseif ($a.call -like 'ad-*') {
                if ($Apply) { $null = Invoke-NpiDeployAd -Client $Client -CallId $a.call -Params $a.params }
            } else {
                if ($Apply) { $null = Invoke-NpiDeployWrite -Client $Client -CallId $a.call -Bind $a.bind -Body $a.body }
            }
        } catch { $status = 'Error'; $detail += ": $($_.Exception.Message)" }
        [pscustomobject][ordered]@{ ActionId = $a.id; Gate = $a.gate; Status = $status; Detail = $detail }
    }
    [pscustomobject]@{ PlanSha256 = $sha; Results = @($results) }
}

# ----------------------------------------------------------------------------- the run

function Export-NpiDeployRun {
    <#
    .SYNOPSIS
        Writes a run's files and a manifest: task, mode, stage, cloud, tenant, change record, the
        settings file's SHA-256, the permissions the task holds, every request, and each file's SHA-256.
    .EXAMPLE
        Export-NpiDeployRun -OutputPath out/preflight -Task deploy-preflight -Settings $s -Mode Fixture -Evidence $client.Evidence -Files @{ 'results.json' = $r.Results }
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$Task, [Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][hashtable]$Files,
        [string]$Mode = 'Fixture', [object[]]$Evidence = @(), [string]$AsOf, [hashtable]$Extra = @{})
    $OutputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $hashes = [ordered]@{}
    foreach ($name in ($Files.Keys | Sort-Object)) {
        $p = Join-Path $OutputPath $name
        Write-NpiJson -Path $p -Value $Files[$name]
        $hashes[$name] = Get-NpiFileHash -Path $p
    }
    $perm = Get-NpiDeployRequiredPermission -Task $Task
    $m = [ordered]@{
        task = $Task; mode = $Mode; environment = $Settings.environment; cloud = $Settings.cloud; tenantId = $Settings.tenantId
        changeRecord = $Settings.changeRecord; settingsSha256 = $Settings._sha256; asOf = $AsOf; generated = [DateTime]::UtcNow.ToString('o')
        graphPermissions = $perm.GraphPermissions; adRights = $perm.AdRights
        requests = @($Evidence | ForEach-Object { [ordered]@{ call = $_.Call; method = $_.Method; target = $_.Target; at = $_.At } })
        files = $hashes
    }
    foreach ($k in $Extra.Keys) { $m[$k] = $Extra[$k] }
    Write-NpiJson -Path (Join-Path $OutputPath 'manifest.json') -Value $m
    Get-Item -LiteralPath (Join-Path $OutputPath 'manifest.json')
}

function Write-NpiDeploySummary {
    <#
    .SYNOPSIS
        Prints one line of counts and one line per result, the way the other chapters' scripts do.
    .EXAMPLE
        Write-NpiDeploySummary -Title 'Preflight (Fixture, test)' -Results $r.Results
    #>
    param([string]$Title, [object[]]$Results)
    $counts = ($Results | Group-Object Status | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '
    Write-Output "${Title}: $counts"
    foreach ($x in $Results) { Write-Output ('  {0} {1,-6} {2,-9} {3}: {4}' -f $x.Id, $x.Status, $x.Gate, $x.Check, $x.Actual) }
}

# ----------------------------------------------------------------------------- requirements and evidence records

function Get-NpiDeployRequirements {
    <#
    .SYNOPSIS
        Reads Chapter 11's requirements catalog (config/requirements-ch11.json): the SP 800-53 controls,
        other requirements and FedRAMP 20x KSIs for each check and each runbook step, and the steps each
        stage's evidence must cover.
    .EXAMPLE
        (Get-NpiDeployRequirements).stages.test
    #>
    [CmdletBinding()]
    param([string]$Path = (Join-Path $script:ConfigRoot 'requirements-ch11.json'))
    Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 20
}

function Get-NpiDeployEvidenceStatus {
    # One status for a record: Fail on any Fail or Error, DryRun on a dry run, Warn on any Warn, else Pass.
    param([string[]]$Statuses)
    if (@($Statuses | Where-Object { $_ -in 'Fail', 'Error' }).Count) { return 'Fail' }
    if (@($Statuses | Where-Object { $_ -eq 'WouldApply' }).Count) { return 'DryRun' }
    if (-not @($Statuses).Count) { return 'Fail' }
    if (@($Statuses | Where-Object { $_ -in 'Warn', 'NotRun' }).Count) { return 'Warn' }
    'Pass'
}

function Test-NpiDeployRunFolder {
    # Every manifest.json under a run folder, with each file it lists re-hashed. Returns @{ Ok; Detail; Manifests }.
    param([string]$Path, [string]$TenantId)
    $mans = @(Get-ChildItem -LiteralPath $Path -Recurse -Filter manifest.json -File -ErrorAction SilentlyContinue)
    if (-not $mans.Count) { return @{ Ok = $false; Detail = "no manifest.json under $Path"; Manifests = @() } }
    $bad = @(); $list = @()
    foreach ($m in $mans) {
        $j = Get-Content -LiteralPath $m.FullName -Raw | ConvertFrom-Json -AsHashtable -Depth 20
        if ($TenantId -and $j['tenantId'] -and "$($j['tenantId'])" -ne $TenantId) { $bad += "$($m.Name) is for tenant $($j['tenantId']), not $TenantId" }
        $list += [ordered]@{ manifest = $m.Name; sha256 = (Get-NpiFileHash -Path $m.FullName); task = "$($j['task'])"; tenantId = "$($j['tenantId'])" }
        if ($j.ContainsKey('files') -and $j['files']) {
            foreach ($f in $j['files'].Keys) {
                $fp = Join-Path $m.DirectoryName $f
                if (-not (Test-Path -LiteralPath $fp)) { $bad += "$f missing" }
                elseif ((Get-NpiFileHash -Path $fp) -ne "$($j['files'][$f])") { $bad += "$f changed since its manifest" }
            }
        }
    }
    @{ Ok = (-not $bad.Count); Detail = $(if ($bad.Count) { $bad -join '; ' } else { "$($mans.Count) manifest(s), every listed file matches" }); Manifests = $list }
}

function Update-NpiDeployEvidenceSums {
    <#
    .SYNOPSIS
        Rewrites SHA256SUMS in the evidence folder: one "sha256  relative/path" line per file, LF line
        endings, so the ISSO can check the folder with sha256sum -c SHA256SUMS. Returns the line count.
    .EXAMPLE
        Update-NpiDeployEvidenceSums -EvidencePath out/deploy-test/evidence
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$EvidencePath)
    $EvidencePath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($EvidencePath)
    $root = (Resolve-Path -LiteralPath $EvidencePath).Path.TrimEnd('\', '/')
    $lines = @(Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object Name -NE 'SHA256SUMS' | Sort-Object FullName | ForEach-Object {
            '{0}  {1}' -f (Get-NpiFileHash -Path $_.FullName), $_.FullName.Substring($root.Length + 1).Replace('\', '/') })
    [IO.File]::WriteAllText((Join-Path $root 'SHA256SUMS'), ($lines -join "`n") + "`n", [Text.UTF8Encoding]::new($false))
    $lines.Count
}

function Write-NpiDeployEvidence {
    <#
    .SYNOPSIS
        Writes one evidence record for a runbook step to the evidence folder: when, which environment,
        tenant and change record, the command, the result, each check with the SP 800-53 controls, other
        requirements and FedRAMP 20x KSIs it supports (from config/requirements-ch11.json), and each run
        folder it covers (copied under runs/<step>/, with its manifests re-hashed). Then rewrites
        SHA256SUMS. Returns the record's file.
    .EXAMPLE
        Write-NpiDeployEvidence -EvidencePath out/deploy-test/evidence -Step PRE -Settings $s -Mode Fixture -Command './deploy/Test-NpiDeployPreflight.ps1 ...' -Results $r.Results -RunPaths out/deploy-test/preflight
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$EvidencePath, [Parameter(Mandatory)][string]$Step, [Parameter(Mandatory)][hashtable]$Settings,
        [string]$Mode = 'Live', [string]$Command = '', [object[]]$Results = @(), [string[]]$RunPaths = @(), [string]$Note = ''
    )
    $EvidencePath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($EvidencePath)
    $Command = "$Command".Trim()
    $cat = Get-NpiDeployRequirements
    if (-not $cat.steps.ContainsKey($Step)) { throw "Unknown step '$Step'; the catalog has $($cat.steps.Keys -join ', ')." }
    $row = $cat.steps[$Step]
    New-Item -ItemType Directory -Force -Path $EvidencePath | Out-Null
    $checks = [Collections.Generic.List[object]]::new()
    foreach ($r in @($Results)) {
        $id = if ($r.PSObject.Properties['Id']) { "$($r.Id)" } else { "$($r.ActionId)" }
        $key = if ($cat.checks.ContainsKey($id)) { $id } elseif ($id -like 'RB-*') { 'RB' } else { $null }
        $m = if ($key) { $cat.checks[$key] } else { @{ controls = @(); other = @(); ksis = @() } }
        $actual = if ($r.PSObject.Properties['Actual']) { "$($r.Actual)" } else { "$($r.Detail)" }
        $checks.Add([ordered]@{ id = $id; status = "$($r.Status)"; actual = $actual; controls = @($m.controls); other = @($m.other); ksis = @($m.ksis) })
    }
    $runs = [Collections.Generic.List[object]]::new(); $runOk = $true
    foreach ($rp in @($RunPaths | Where-Object { $_ })) {
        $t = Test-NpiDeployRunFolder -Path $rp -TenantId $Settings.tenantId
        if (-not $t.Ok) { $runOk = $false }
        $leaf = Split-Path -Leaf $rp
        $dest = Join-Path (Join-Path $EvidencePath "runs/$Step") $leaf
        if (Test-Path -LiteralPath $rp) {
            if (Test-Path -LiteralPath $dest) { Remove-Item -Recurse -Force -LiteralPath $dest }
            New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
            Copy-Item -Recurse -Force -LiteralPath $rp -Destination $dest
        }
        $runs.Add([ordered]@{ path = "runs/$Step/$leaf"; verified = $t.Ok; detail = $t.Detail; manifests = @($t.Manifests) })
    }
    $statuses = @($checks | ForEach-Object { $_.status })
    if (-not $checks.Count) { $statuses = @($(if ($runs.Count -and $runOk) { 'Pass' } else { 'Fail' })) }
    elseif ($runs.Count -and -not $runOk) { $statuses += 'Fail' }
    $controls = @(@($row.controls) + @($checks | ForEach-Object { $_.controls }) | Where-Object { $_ } | Sort-Object -Unique)
    $other = @(@($row.other) + @($checks | ForEach-Object { $_.other }) | Where-Object { $_ } | Sort-Object -Unique)
    $ksis = @(@($row.ksis) + @($checks | ForEach-Object { $_.ksis }) | Where-Object { $_ } | Sort-Object -Unique)
    $rec = [ordered]@{
        schema = 'fmp-npi-deploy-evidence/1'; step = $Step; title = $row.title; recordedAt = [DateTime]::UtcNow.ToString('o')
        environment = $Settings.environment; cloud = $Settings.cloud; tenantId = $Settings.tenantId; changeRecord = $Settings.changeRecord; settingsSha256 = $Settings._sha256
        mode = $Mode; command = $Command; result = (Get-NpiDeployEvidenceStatus -Statuses $statuses); note = $Note
        controls = $controls; other = $other; ksis = $ksis; checks = $checks.ToArray(); runs = $runs.ToArray()
    }
    $slug = ($row.title.ToLowerInvariant() -replace '[^a-z0-9]+', '-').Trim('-')
    $path = Join-Path $EvidencePath ("{0}-{1}.json" -f $Step, $slug)
    Write-NpiJson -Path $path -Value $rec
    $null = Update-NpiDeployEvidenceSums -EvidencePath $EvidencePath
    Get-Item -LiteralPath $path
}

function Test-NpiDeployEvidence {
    <#
    .SYNOPSIS
        The go/no-go's evidence check: for every step the stage's catalog row lists, an evidence record
        for this environment and tenant whose result is Pass (or Warn, which the go/no-go record must
        explain); and SHA256SUMS present, with every file it lists unchanged and every file listed.
        Returns one row per step, plus EVIDENCE for the folder's integrity.
    .EXAMPLE
        Test-NpiDeployEvidence -EvidencePath out/deploy-test/evidence -Settings $s -Stage test | Format-Table Step, Status, Ksis
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$EvidencePath, [Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][ValidateSet('test', 'production')][string]$Stage)
    $EvidencePath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($EvidencePath)
    $cat = Get-NpiDeployRequirements
    $rows = [Collections.Generic.List[object]]::new()
    foreach ($step in @($cat.stages[$Stage])) {
        $row = $cat.steps[$step]
        $f = @(Get-ChildItem -LiteralPath $EvidencePath -Filter "$step-*.json" -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -match "^$([regex]::Escape($step))-[a-z0-9-]+\.json$" })
        if (-not $f.Count) { $rows.Add([pscustomobject][ordered]@{ Step = $step; Title = $row.title; Status = 'Missing'; Result = ''; Controls = ''; Ksis = ''; Detail = "no $step record: $($row.evidence)" }); continue }
        $rec = Get-Content -LiteralPath $f[0].FullName -Raw | ConvertFrom-Json
        $status = if ($rec.environment -ne $Settings.environment -or $rec.tenantId -ne $Settings.tenantId) { 'WrongEnvironment' } elseif ($rec.result -in 'Pass', 'Warn') { 'Present' } else { 'Failing' }
        $rows.Add([pscustomobject][ordered]@{ Step = $step; Title = $row.title; Status = $status; Result = $rec.result; Controls = (@($rec.controls) -join ', '); Ksis = (@($rec.ksis) -join ', '); Detail = $f[0].Name })
    }
    $sums = Join-Path $EvidencePath 'SHA256SUMS'
    $ev = $cat.steps['EVIDENCE']
    if (-not (Test-Path -LiteralPath $sums)) {
        $rows.Add([pscustomobject][ordered]@{ Step = 'EVIDENCE'; Title = $ev.title; Status = 'Missing'; Result = ''; Controls = ($ev.controls -join ', '); Ksis = ($ev.ksis -join ', '); Detail = 'no SHA256SUMS' })
    } else {
        $root = (Resolve-Path -LiteralPath $EvidencePath).Path.TrimEnd('\', '/')
        $listed = @{}; $bad = @()
        foreach ($l in (Get-Content -LiteralPath $sums | Where-Object { $_ })) {
            $parts = $l -split '  ', 2; $listed[$parts[1]] = $true
            $fp = Join-Path $root $parts[1]
            if (-not (Test-Path -LiteralPath $fp)) { $bad += "$($parts[1]) missing" } elseif ((Get-NpiFileHash -Path $fp) -ne $parts[0]) { $bad += "$($parts[1]) changed" }
        }
        foreach ($x in (Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object Name -NE 'SHA256SUMS')) {
            $rel = $x.FullName.Substring($root.Length + 1).Replace('\', '/'); if (-not $listed.ContainsKey($rel)) { $bad += "$rel not listed" }
        }
        $rows.Add([pscustomobject][ordered]@{ Step = 'EVIDENCE'; Title = $ev.title; Status = $(if ($bad.Count) { 'Failing' } else { 'Present' }); Result = $(if ($bad.Count) { 'Fail' } else { 'Pass' }); Controls = ($ev.controls -join ', '); Ksis = ($ev.ksis -join ', '); Detail = $(if ($bad.Count) { $bad -join '; ' } else { "$($listed.Count) file(s), every hash matches" }) })
    }
    $rows.ToArray()
}

Export-ModuleMember -Function Test-NpiDeploySettings, Read-NpiDeploySettings, Get-NpiDeployCallList, Get-NpiDeployRequiredPermission, New-NpiDeployClient,
    Invoke-NpiDeployWrite, Invoke-NpiDeployAd, New-NpiDeployFixtureInvoker, New-NpiDeployLiveInvoker, New-NpiDeployLiveAdInvoker, Invoke-NpiDeployPreflight,
    Invoke-NpiDeploySmokeTest, New-NpiDeployRollbackPlan, Invoke-NpiDeployRollbackPlan, Export-NpiDeployRun, Write-NpiDeploySummary,
    Get-NpiDeployRequirements, Update-NpiDeployEvidenceSums, Write-NpiDeployEvidence, Test-NpiDeployEvidence
