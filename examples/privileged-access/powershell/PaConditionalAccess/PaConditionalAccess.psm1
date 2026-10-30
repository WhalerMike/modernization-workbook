#Requires -Version 7.1
<#
    PaConditionalAccess: Chapter 03 of the developer workbook "Building Privileged Access".

    Conditional Access for administrators and the PIM activation gate, held as reviewed JSON in
    ca-policies/: the authentication contexts, the privileged authentication strength and the
    administrator policies. A pre-merge check (PA-CA-01 to PA-CA-09) reads the files only. A plan
    compares the files with the tenant. The plan is a dry run unless the client was made with
    -Apply, and a new policy is always created report-only; enforcing one needs -AllowEnforce too.
    Nothing is ever deleted.

    Every call is declared in config/calls-ch03.json with its least-privileged permission, sent
    only to the cloud's own Graph host. Clouds come from the PrivilegedAccess module (Chapter 01).
    Illustrative: tested against fixtures and a fake, not a production tenant.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot '../PrivilegedAccess/PrivilegedAccess.psm1') -Function Get-PaCloud

$script:CallsPath = Join-Path $PSScriptRoot '../../config/calls-ch03.json'
$script:ReportOnly = 'enabledForReportingButNotEnforced'
$script:Guid = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'

# The fourteen roles Learn recommends at a minimum for phishing-resistant MFA, by role template ID
# (Learn, "Require phishing-resistant multifactor authentication for administrators").
$script:LearnAdminRoles = [ordered]@{
    '62e90394-69f5-4237-9190-012177145e10' = 'Global Administrator'
    '9b895d92-2cd3-44c7-9d02-a6ac2d5ea5c3' = 'Application Administrator'
    'c4e39bd9-1100-46d3-8c65-fb160da0071f' = 'Authentication Administrator'
    'b0f54661-2d74-4c50-afa3-1ec803f12efe' = 'Billing Administrator'
    '158c047a-c907-4556-b7ef-446551a6b5f7' = 'Cloud Application Administrator'
    'b1be1c3e-b65d-4f19-8427-f6fa0d97feb9' = 'Conditional Access Administrator'
    '29232cdf-9323-42fd-ade2-1d097af3e4de' = 'Exchange Administrator'
    '729827e3-9c14-49f7-bb1b-9608f156bbb8' = 'Helpdesk Administrator'
    '966707d0-3269-4727-9be2-8c3a10f19b9d' = 'Password Administrator'
    '7be44c8a-adaf-4e2a-84d6-ab2649e08a13' = 'Privileged Authentication Administrator'
    'e8611ab8-c189-46e8-94e1-60213ab1f814' = 'Privileged Role Administrator'
    '194ae4cb-b126-40b2-bd5b-6091b380977d' = 'Security Administrator'
    'f28a1f50-f6e7-4571-818b-6a12f2af6b6c' = 'SharePoint Administrator'
    'fe930be7-5e62-47db-91af-98c3a49a38b1' = 'User Administrator'
}

# ----------------------------------------------------------------------------- calls and the client

function Get-PaCaCall {
    <# The declared Chapter 03 calls, optionally for one task. #>
    [CmdletBinding()]
    param([ValidateSet('ca-read', 'ca-apply')][string]$Task)
    $all = @((Get-Content -LiteralPath $script:CallsPath -Raw | ConvertFrom-Json -AsHashtable).calls)
    if ($Task) { $all = @($all | Where-Object { $_.tasks -contains $Task }) }
    $all
}

function Get-PaCaRequiredPermission {
    <# The union of a task's Graph permissions: ca-read (GET only) or ca-apply (adds the writes). #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][ValidateSet('ca-read', 'ca-apply')][string]$Task)
    [pscustomobject]@{
        Task             = $Task
        GraphPermissions = @(Get-PaCaCall -Task $Task | ForEach-Object { $_.permissions } | Sort-Object -Unique)
    }
}

function New-PaCaClient {
    <#
    .SYNOPSIS
        A Graph client for Chapter 03 in one cloud. -Invoke is { param($Method, $Uri, $Body) } and
        returns the parsed body as a hashtable. Without -Apply the client is task ca-read and
        refuses every write; with -Apply it is task ca-apply.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][scriptblock]$Invoke,
        [switch]$Apply
    )
    $c = Get-PaCloud -Cloud $Cloud
    $task = if ($Apply) { 'ca-apply' } else { 'ca-read' }
    [pscustomobject]@{
        Cloud    = $c
        Task     = $task
        Apply    = [bool]$Apply
        Calls    = @(Get-PaCaCall -Task $task)
        Invoke   = $Invoke
        Evidence = [Collections.Generic.List[object]]::new()
    }
}

function Resolve-PaCaRequest {
    # The URL for a declared call. Refuses an undeclared call, and a write on a client without -Apply.
    param($Client, [string]$CallId, [hashtable]$Bind = @{})
    $call = $Client.Calls | Where-Object { $_.id -eq $CallId }
    if (-not $call) { throw "Undeclared call '$CallId' for task '$($Client.Task)'; add it to config/calls-ch03.json with its permission." }
    if ($call.method -ne 'GET' -and -not $Client.Apply) { throw "Refusing $($call.method): this client is a dry run. Use -Apply." }
    $path = $call.path
    foreach ($k in $Bind.Keys) { $path = $path.Replace("{$k}", [Uri]::EscapeDataString([string]$Bind[$k])) }
    if ($path -match '\{[a-z]+\}') { throw "Unbound placeholder in $path" }
    [pscustomobject]@{ Call = $call; Method = $call.method; Uri = "$($Client.Cloud.Graph)/$($call.version)$path" }
}

function Assert-PaCaHost {
    param([string]$Uri, [string]$ExpectedHost)
    if (-not $Uri.StartsWith("$ExpectedHost/", [StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to send the token to $Uri`: not $ExpectedHost"
    }
}

function Invoke-PaCaList {
    <# GET a declared collection, following every @odata.nextLink on the cloud's own host. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client, [Parameter(Mandatory)][string]$CallId)
    $r = Resolve-PaCaRequest -Client $Client -CallId $CallId
    if ($r.Method -ne 'GET') { throw "$CallId isn't a read" }
    $items = [Collections.Generic.List[object]]::new()
    $uri = $r.Uri
    while ($uri) {
        Assert-PaCaHost -Uri $uri -ExpectedHost $Client.Cloud.Graph
        $Client.Evidence.Add([pscustomobject]@{ Call = $CallId; Method = 'GET'; Uri = $uri; At = [DateTime]::UtcNow.ToString('o') })
        $body = & $Client.Invoke 'GET' $uri $null
        if ($null -eq $body) { throw "No response for $uri" }
        foreach ($v in @($body['value'])) { if ($null -ne $v) { $items.Add($v) } }
        $uri = if ($body.ContainsKey('@odata.nextLink')) { $body['@odata.nextLink'] } else { $null }
    }
    $items.ToArray()
}

function Send-PaCaWrite {
    # One declared write. Only reachable from Invoke-PaCaPlan with -Apply.
    param($Client, [string]$CallId, [hashtable]$Bind = @{}, $Body)
    $r = Resolve-PaCaRequest -Client $Client -CallId $CallId -Bind $Bind
    Assert-PaCaHost -Uri $r.Uri -ExpectedHost $Client.Cloud.Graph
    $Client.Evidence.Add([pscustomobject]@{ Call = $CallId; Method = $r.Method; Uri = $r.Uri; At = [DateTime]::UtcNow.ToString('o') })
    & $Client.Invoke $r.Method $r.Uri $Body
}

function New-PaCaLiveInvoker {
    <#
    .SYNOPSIS
        The live invoker, through Invoke-MgGraphRequest. Refuses to run if the Graph session is in
        another cloud. Writes are allowed only with -AllowWrite. Sign in first with
        Connect-MgGraph -Environment <GraphEnvironment> and only the task's permissions.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud, [switch]$AllowWrite)
    $c = Get-PaCloud -Cloud $Cloud
    $mg = Get-MgContext
    if (-not $mg) { throw 'Not signed in to Microsoft Graph.' }
    if ($mg.Environment -ne $c.GraphEnvironment) { throw "Graph session is in '$($mg.Environment)', not '$($c.GraphEnvironment)'." }
    $write = [bool]$AllowWrite
    {
        param($Method, $Uri, $Body)
        if ($Method -ne 'GET' -and -not $write) { throw "Refusing $Method" }
        if ($Method -eq 'GET') { return Invoke-MgGraphRequest -Method GET -Uri $Uri -OutputType Hashtable }
        Invoke-MgGraphRequest -Method $Method -Uri $Uri -Body ($Body | ConvertTo-Json -Depth 20) -ContentType 'application/json' -OutputType Hashtable
    }.GetNewClosure()
}

# ----------------------------------------------------------------------------- the fake

function New-PaCaFixtureInvoker {
    <#
    .SYNOPSIS
        A fake Graph for Chapter 03, served from a fixture file: the three collections and the
        templates, paged with a next link, and the four writes applied in memory so a test can
        read the tenant back. DELETE throws. Every call is recorded in .Calls.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][string]$Cloud, [int]$PageSize = 2)
    $t = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 50
    foreach ($k in 'policies', 'authenticationContextClassReferences', 'authenticationStrengthPolicies', 'templates') {
        $t[$k] = [Collections.Generic.List[object]]::new([object[]]@($t[$k] | Where-Object { $null -ne $_ }))
    }
    $state = [pscustomobject]@{ Tenant = $t; Calls = [Collections.Generic.List[object]]::new(); PageSize = $PageSize; Graph = (Get-PaCloud -Cloud $Cloud).Graph; Next = 100; Invoke = $null }
    $s = $state
    $fake = ${function:Invoke-PaCaFake}   # the closure loses the module's scope, so it carries the function
    $state.Invoke = { param($Method, $Uri, $Body) & $fake -State $s -Method $Method -Uri $Uri -Body $Body }.GetNewClosure()
    $state
}

function Invoke-PaCaFake {
    param($State, [string]$Method, [string]$Uri, $Body)
    $State.Calls.Add([pscustomobject]@{ Method = $Method; Uri = $Uri; Body = $Body })
    $u = [Uri]$Uri
    if ("$($u.Scheme)://$($u.Host)" -ne $State.Graph) { throw "The fake serves only $($State.Graph)" }
    $path = [Uri]::UnescapeDataString($u.AbsolutePath)
    $skip = 0
    if ($u.Query -match '\$skiptoken=(\d+)') { $skip = [int]$Matches[1] }
    $t = $State.Tenant
    $page = {
        param($All)
        $slice = @($All | Select-Object -Skip $skip -First $State.PageSize)
        $resp = @{ value = $slice }
        if ($skip + $State.PageSize -lt @($All).Count) { $resp['@odata.nextLink'] = "$($State.Graph)$($u.AbsolutePath)?`$skiptoken=$($skip + $State.PageSize)" }
        $resp
    }
    $copy = { param($o) $o | ConvertTo-Json -Depth 30 | ConvertFrom-Json -AsHashtable -Depth 30 }
    switch ($Method) {
        'GET' {
            switch -Regex ($path) {
                '^/v1\.0/identity/conditionalAccess/policies$' { return & $page $t.policies }
                '^/v1\.0/identity/conditionalAccess/authenticationContextClassReferences$' { return & $page $t.authenticationContextClassReferences }
                '^/v1\.0/policies/authenticationStrengthPolicies$' { return & $page $t.authenticationStrengthPolicies }
                '^/v1\.0/identity/conditionalAccess/templates$' { return & $page $t.templates }
            }
        }
        'POST' {
            switch -Regex ($path) {
                '^/v1\.0/identity/conditionalAccess/policies$' {
                    $new = & $copy $Body; $State.Next++
                    $new['id'] = 'ca000000-0000-4000-8000-{0:d12}' -f $State.Next
                    $t.policies.Add($new); return $new
                }
                '^/v1\.0/policies/authenticationStrengthPolicies$' {
                    $new = & $copy $Body; $State.Next++
                    $new['id'] = 'a5000000-0000-4000-8000-{0:d12}' -f $State.Next
                    $new['policyType'] = 'custom'
                    $t.authenticationStrengthPolicies.Add($new); return $new
                }
            }
        }
        'PATCH' {
            switch -Regex ($path) {
                '^/v1\.0/identity/conditionalAccess/policies/([^/]+)$' {
                    $id = $Matches[1]; $p = $t.policies | Where-Object { $_.id -eq $id }
                    if (-not $p) { throw "404 policy $id" }
                    foreach ($k in $Body.Keys) { $p[$k] = & $copy $Body[$k] }
                    return $null
                }
                '^/v1\.0/identity/conditionalAccess/authenticationContextClassReferences/([^/]+)$' {
                    $id = $Matches[1]; $c = $t.authenticationContextClassReferences | Where-Object { $_.id -eq $id }
                    if (-not $c) { $c = @{ id = $id }; $t.authenticationContextClassReferences.Add($c) }
                    foreach ($k in $Body.Keys) { if ($k -ne 'id') { $c[$k] = $Body[$k] } }
                    return $null
                }
            }
        }
    }
    throw "The fake has no route for $Method $path"
}

# ----------------------------------------------------------------------------- the repository

function Read-PaCaJson {
    param([string]$Path, [hashtable]$Map)
    $text = Get-Content -LiteralPath $Path -Raw
    foreach ($k in $Map.Keys) { if ($k -like '{*}') { $text = $text.Replace($k, [string]$Map[$k]) } }
    [pscustomobject]@{ Text = $text; Body = ($text | ConvertFrom-Json -AsHashtable -Depth 30) }
}

function Read-PaCaRepository {
    <#
    .SYNOPSIS
        Read ca-policies/: the contexts, strengths and policies, with every placeholder resolved
        from the tenant map except {strength:...}, which the plan resolves from the tenant. Returns
        the objects and the configuration; unresolved placeholders are left for PA-CA-03.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][string]$MapPath)
    $map = Get-Content -LiteralPath $MapPath -Raw | ConvertFrom-Json -AsHashtable
    $cfg = (Read-PaCaJson -Path (Join-Path $Path 'ca-config.json') -Map $map).Body
    $kinds = [ordered]@{ contexts = 'context'; strengths = 'strength'; policies = 'policy' }
    $objects = foreach ($kind in $kinds.Keys) {
        $dir = Join-Path $Path $kind
        if (-not (Test-Path -LiteralPath $dir)) { continue }
        foreach ($f in Get-ChildItem -LiteralPath $dir -Filter '*.json' | Sort-Object Name) {
            $j = Read-PaCaJson -Path $f.FullName -Map $map
            $name = if ($kind -eq 'contexts') { $j.Body.id } else { $j.Body.displayName }
            [pscustomobject]@{ Kind = $kinds[$kind]; Name = $name; File = "$kind/$($f.Name)"; Text = $j.Text; Body = $j.Body }
        }
    }
    [pscustomobject]@{
        EmergencyGroupId      = [string]$cfg.emergencyGroup
        ReportOnlyInstruments = @($cfg.reportOnlyInstruments)
        Objects               = @($objects)
    }
}

function ConvertFrom-PaCaTemplate {
    <#
    .SYNOPSIS
        Microsoft's Conditional Access template (a conditionalAccessTemplate, from Graph or from
        the pinned Learn page) as a policy body, unchanged except for a name and report-only
        state. The pre-merge check then says what it lacks; this function fixes nothing.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Template)
    $d = $Template['details']
    $body = [ordered]@{ displayName = $Template['name']; state = $script:ReportOnly }
    foreach ($k in 'conditions', 'grantControls', 'sessionControls') { if ($null -ne $d[$k]) { $body[$k] = $d[$k] } }
    $body
}

function Read-PaCaTemplatePage {
    <#
    .SYNOPSIS
        The example response from the pinned Learn page "Get conditionalAccessTemplate", unmodified:
        the first HTTP 200 block. Throws if the page no longer has it in that shape.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $text = Get-Content -LiteralPath $Path -Raw
    $m = [regex]::Match($text, '``` http\r?\nHTTP/1\.1 200 OK\r?\nContent-Type: application/json\r?\n\r?\n(\{.*?\})\r?\n```', 'Singleline')
    if (-not $m.Success) { throw 'The page has no example response in the shape this reader knows.' }
    $m.Groups[1].Value | ConvertFrom-Json -AsHashtable -Depth 30
}

function Test-PaCaPolicyBody {
    <# Check one policy body (a converted template, say) as if it were a file in the repository. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][Collections.IDictionary]$Body, [Parameter(Mandatory)]$Repository, [string]$Name = 'candidate')
    $text = $Body | ConvertTo-Json -Depth 30
    $o = [pscustomobject]@{ Kind = 'policy'; Name = $Name; File = "candidate/$Name.json"; Text = $text; Body = ($text | ConvertFrom-Json -AsHashtable -Depth 30) }
    $r = [pscustomobject]@{ EmergencyGroupId = $Repository.EmergencyGroupId; ReportOnlyInstruments = $Repository.ReportOnlyInstruments; Objects = @($Repository.Objects) + $o }
    @(Test-PaCaRepository -Repository $r | Where-Object Object -EQ $Name)
}

# ----------------------------------------------------------------------------- the pre-merge check

function New-PaCaFinding {
    param([string]$Rule, [string]$Severity, [string]$Object, [string]$File, [string]$Message)
    [pscustomobject]@{ Rule = $Rule; Severity = $Severity; Object = $Object; File = $File; Message = $Message }
}

function Get-PaCaList {
    param($Hash, [string[]]$Path)
    $v = $Hash
    foreach ($p in $Path) { if ($v -is [Collections.IDictionary] -and $v.Contains($p)) { $v = $v[$p] } else { return @() } }
    @($v | Where-Object { $null -ne $_ } | ForEach-Object { [string]$_ })
}

function Test-PaCaRepository {
    <#
    .SYNOPSIS
        The pre-merge check: PA-CA-01 to PA-CA-09 over the repository's objects. Reads files only.
        Findings stop -Apply; Warn and Info don't.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Repository)
    $f = [Collections.Generic.List[object]]::new()
    $ea = $Repository.EmergencyGroupId
    $contexts = @($Repository.Objects | Where-Object Kind -EQ 'context' | ForEach-Object { $_.Name })
    if ($ea -notmatch $script:Guid) { $f.Add((New-PaCaFinding 'PA-CA-03' 'Finding' 'ca-config.json' 'ca-config.json' "The emergency access group isn't resolved to an object ID: '$ea'")) }

    foreach ($o in $Repository.Objects) {
        $left = @([regex]::Matches($o.Text, '\{(group|location|aaguid|tenant|app|terms|sp|rule):[^}]+\}') | ForEach-Object Value | Sort-Object -Unique)
        if ($left.Count -gt 0) { $f.Add((New-PaCaFinding 'PA-CA-03' 'Finding' $o.Name $o.File "Unresolved placeholder: $($left -join ', ')")) }
        if ($o.Kind -eq 'context' -and $o.Name -notmatch '^c([1-9]|1[0-9]|2[0-5])$') {
            $f.Add((New-PaCaFinding 'PA-CA-08' 'Finding' $o.Name $o.File 'Authentication context ID outside c1 to c25, the range the Graph create method allows'))
        }
        if ($o.Kind -ne 'policy') { continue }

        $b = $o.Body; $state = [string]$b['state']
        $instrument = $Repository.ReportOnlyInstruments -contains $o.Name
        $exG = @(Get-PaCaList $b 'conditions', 'users', 'excludeGroups')
        $inR = @(Get-PaCaList $b 'conditions', 'users', 'includeRoles')
        $ctx = @(Get-PaCaList $b 'conditions', 'applications', 'includeAuthenticationContextClassReferences')
        $built = @(Get-PaCaList $b 'grantControls', 'builtInControls')
        $hasStrength = $b['grantControls'] -is [Collections.IDictionary] -and $null -ne $b['grantControls']['authenticationStrength']

        # PA-CA-01 and PA-CA-02: the emergency access exclusion.
        if ($state -ne 'disabled' -and $exG -notcontains $ea) {
            if ($instrument) { $f.Add((New-PaCaFinding 'PA-CA-01' 'Info' $o.Name $o.File 'Report-only instrument without the emergency exclusion: allowed, because report-only policies need no exclusion')) }
            else { $f.Add((New-PaCaFinding 'PA-CA-01' 'Finding' $o.Name $o.File "Doesn't exclude the emergency access group. The file is what gets enforced later, so it carries the exclusion now, report-only or not")) }
        }
        if ($instrument -and $state -eq 'enabled') { $f.Add((New-PaCaFinding 'PA-CA-02' 'Finding' $o.Name $o.File 'A report-only instrument is set to enabled; it leaves the emergency accounts in scope')) }

        # PA-CA-03: user targets that aren't IDs or Graph keywords (a template's display text, for example).
        foreach ($key in 'includeUsers', 'excludeUsers', 'includeGroups', 'excludeGroups', 'includeRoles', 'excludeRoles') {
            $bad = @(Get-PaCaList $b 'conditions', 'users', $key | Where-Object { $_ -notmatch $script:Guid -and $_ -notin 'All', 'None', 'GuestsOrExternalUsers' -and $_ -notmatch '^\{' })
            if ($bad.Count -gt 0) { $f.Add((New-PaCaFinding 'PA-CA-03' 'Finding' $o.Name $o.File "$key holds a value that isn't an object ID: $($bad -join ', ')")) }
        }

        if ($ctx.Count -gt 0) {
            # PA-CA-04: an activation gate that isn't On doesn't gate anything, and doesn't trigger PIM's MFA fallback.
            if ($state -ne 'enabled') { $f.Add((New-PaCaFinding 'PA-CA-04' 'Warn' $o.Name $o.File "Authentication context policy is $state. It must be On before its context is selected in PIM or for a protected action; report-only doesn't count")) }
            # PA-CA-05: a context policy scoped to a role never applies at activation.
            if ($inR.Count -gt 0) { $f.Add((New-PaCaFinding 'PA-CA-05' 'Finding' $o.Name $o.File 'Targets an authentication context and directory roles: at activation the user holds no role yet, so it never applies')) }
            # PA-CA-08: the context must be defined in the repository.
            $missing = @($ctx | Where-Object { $contexts -notcontains $_ })
            if ($missing.Count -gt 0) { $f.Add((New-PaCaFinding 'PA-CA-08' 'Finding' $o.Name $o.File "References an authentication context not defined in contexts/: $($missing -join ', ')")) }
        }

        # PA-CA-06: authentication strength, not plain MFA, and never both.
        if ($hasStrength -and $built -contains 'mfa') { $f.Add((New-PaCaFinding 'PA-CA-06' 'Finding' $o.Name $o.File "Uses 'Require multifactor authentication' and an authentication strength together, which Conditional Access doesn't allow")) }
        elseif ($inR.Count -gt 0 -and $built -contains 'mfa' -and -not $hasStrength) { $f.Add((New-PaCaFinding 'PA-CA-06' 'Warn' $o.Name $o.File 'Targets administrator roles with plain MFA; Learn recommends the phishing-resistant authentication strength')) }

        # PA-CA-07: Learn's minimum role list.
        if ($inR.Count -gt 0) {
            $short = @($script:LearnAdminRoles.Keys | Where-Object { $inR -notcontains $_ } | ForEach-Object { $script:LearnAdminRoles[$_] })
            if ($short.Count -gt 0) { $f.Add((New-PaCaFinding 'PA-CA-07' 'Warn' $o.Name $o.File "Targets roles but leaves out $($short.Count) of the 14 Learn recommends: $($short -join ', ')")) }
        }

        # PA-CA-09: report-only compliant-device checks prompt Mac, iOS and Android users for a certificate.
        if ($state -eq $script:ReportOnly -and $built -contains 'compliantDevice') {
            $exP = @(Get-PaCaList $b 'conditions', 'platforms', 'excludePlatforms')
            $need = @('android', 'iOS', 'macOS' | Where-Object { $exP -notcontains $_ })
            if ($need.Count -gt 0) { $f.Add((New-PaCaFinding 'PA-CA-09' 'Warn' $o.Name $o.File "Report-only with a compliant-device grant and $($need -join ', ') not excluded: those users can be prompted for a device certificate")) }
        }
    }
    $f.ToArray()
}

# ----------------------------------------------------------------------------- the plan

function Compare-PaCaValue {
    # Paths where the repository's value differs from the tenant's. Driven by the repository: a
    # property the file doesn't set isn't compared. Arrays compare as sets.
    param($Repo, $Tenant, [string]$Path)
    if ($Repo -is [Collections.IDictionary]) {
        foreach ($k in $Repo.Keys) {
            $t = if ($Tenant -is [Collections.IDictionary] -and $Tenant.Contains($k)) { $Tenant[$k] } else { $null }
            Compare-PaCaValue -Repo $Repo[$k] -Tenant $t -Path ($(if ($Path) { "$Path.$k" } else { $k }))
        }
        return
    }
    if ($Repo -is [Collections.IList] -and $Repo -isnot [string]) {
        $norm = { param($a) @($a | Where-Object { $null -ne $_ } | ForEach-Object { if ($_ -is [string]) { $_ } else { $_ | ConvertTo-Json -Depth 20 -Compress } } | Sort-Object) -join "`n" }
        if ((& $norm $Repo) -cne (& $norm $Tenant)) { $Path }
        return
    }
    if ("$Repo" -cne "$Tenant") { $Path }
}

function Get-PaCaTenant {
    <# Read the tenant's policies, authentication contexts and strengths: three GETs, every page. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client)
    [pscustomobject]@{
        Policies  = @(Invoke-PaCaList -Client $Client -CallId 'ca-policies')
        Contexts  = @(Invoke-PaCaList -Client $Client -CallId 'ca-auth-contexts')
        Strengths = @(Invoke-PaCaList -Client $Client -CallId 'auth-strengths')
    }
}

function New-PaCaPlanRow {
    param($Kind, $Name, $Action, [string[]]$Changes = @(), $CallId, $Bind = @{}, $Body, $Note = '')
    [pscustomobject]@{ Kind = $Kind; Name = $Name; Action = $Action; Changes = @($Changes); CallId = $CallId; Bind = $Bind; Body = $Body; Note = $Note }
}

function Get-PaCaPlan {
    <#
    .SYNOPSIS
        Compare the repository with the tenant and say what would change, in order: contexts,
        strengths, policies. Create, Update, NoChange, Blocked (a strength or context it needs
        doesn't exist yet), Held (an enforcement without -AllowEnforce), Differs (a strength,
        which this code doesn't update) and NotInRepository (never deleted). Sends nothing.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Repository, [Parameter(Mandatory)]$Tenant, [switch]$AllowEnforce)
    $rows = [Collections.Generic.List[object]]::new()
    $tenantContextIds = @($Tenant.Contexts | ForEach-Object { $_.id })

    foreach ($o in @($Repository.Objects | Where-Object Kind -EQ 'context')) {
        $t = $Tenant.Contexts | Where-Object { $_.id -eq $o.Name } | Select-Object -First 1
        $body = [ordered]@{}; foreach ($k in $o.Body.Keys) { if ($k -ne 'id') { $body[$k] = $o.Body[$k] } }
        if (-not $t) { $rows.Add((New-PaCaPlanRow 'context' $o.Name 'Create' @() 'auth-context-upsert' @{ id = $o.Name } $body)); continue }
        $d = @(Compare-PaCaValue -Repo $body -Tenant $t -Path '')
        if ($d.Count -eq 0) { $rows.Add((New-PaCaPlanRow 'context' $o.Name 'NoChange')) }
        else { $rows.Add((New-PaCaPlanRow 'context' $o.Name 'Update' $d 'auth-context-upsert' @{ id = $o.Name } $body)) }
    }

    $strengthIds = @{}
    foreach ($s in @($Tenant.Strengths)) { $strengthIds[[string]$s.displayName] = [string]$s.id }
    foreach ($o in @($Repository.Objects | Where-Object Kind -EQ 'strength')) {
        $t = $Tenant.Strengths | Where-Object { $_.displayName -eq $o.Name -and $_.policyType -ne 'builtIn' } | Select-Object -First 1
        if (-not $t) { $rows.Add((New-PaCaPlanRow 'strength' $o.Name 'Create' @() 'auth-strength-create' @{} $o.Body)); continue }
        $d = @(Compare-PaCaValue -Repo $o.Body -Tenant $t -Path '')
        if ($d.Count -eq 0) { $rows.Add((New-PaCaPlanRow 'strength' $o.Name 'NoChange')) }
        else { $rows.Add((New-PaCaPlanRow 'strength' $o.Name 'Differs' $d -Note 'Not written: change a strength in its own reviewed change (updateAllowedCombinations)')) }
    }

    foreach ($o in @($Repository.Objects | Where-Object Kind -EQ 'policy')) {
        $text = $o.Body | ConvertTo-Json -Depth 30; $blocked = @()   # the body, so a reviewed in-memory change is planned too
        foreach ($m in [regex]::Matches($text, '\{strength:([^}]+)\}')) {
            $n = $m.Groups[1].Value
            if ($strengthIds.ContainsKey($n)) { $text = $text.Replace($m.Value, $strengthIds[$n]) } else { $blocked += "authentication strength $n" }
        }
        foreach ($c in Get-PaCaList $o.Body 'conditions', 'applications', 'includeAuthenticationContextClassReferences') {
            if ($tenantContextIds -notcontains $c) { $blocked += "authentication context $c" }
        }
        if ($blocked.Count -gt 0) { $rows.Add((New-PaCaPlanRow 'policy' $o.Name 'Blocked' -Note "Needs $(($blocked | Sort-Object -Unique) -join ' and ') in the tenant first; rerun after they're created")); continue }

        $body = $text | ConvertFrom-Json -AsHashtable -Depth 30
        $t = $Tenant.Policies | Where-Object { $_.displayName -eq $o.Name } | Select-Object -First 1
        if (-not $t) {
            $note = if ($body['state'] -ne $script:ReportOnly) { "Created report-only, not $($body['state']); enforce it in a later run with -AllowEnforce" } else { 'Created report-only' }
            $body['state'] = $script:ReportOnly
            $rows.Add((New-PaCaPlanRow 'policy' $o.Name 'Create' @() 'ca-policy-create' @{} $body $note)); continue
        }
        $cmp = [ordered]@{}; foreach ($k in $body.Keys) { if ($k -ne 'state') { $cmp[$k] = $body[$k] } }
        $d = @(Compare-PaCaValue -Repo $cmp -Tenant $t -Path '')
        $patch = [ordered]@{}
        foreach ($top in @($d | ForEach-Object { $_.Split('.')[0] } | Sort-Object -Unique)) { $patch[$top] = $body[$top] }
        $note = ''
        if ($body['state'] -ne $t.state) {
            if ($body['state'] -eq 'enabled' -and -not $AllowEnforce) { $note = "Enforcement held: the tenant is $($t.state); rerun with -AllowEnforce in the change that enforces it" }
            else { $patch['state'] = $body['state']; $d += 'state'; $note = "State $($t.state) to $($body['state'])" }
        }
        if ($patch.Count -eq 0) {
            $rows.Add((New-PaCaPlanRow 'policy' $o.Name $(if ($note) { 'Held' } else { 'NoChange' }) -Note $note))
        } else {
            $rows.Add((New-PaCaPlanRow 'policy' $o.Name 'Update' $d 'ca-policy-update' @{ id = $t.id } $patch $note))
        }
    }

    $repoNames = @($Repository.Objects | Where-Object Kind -EQ 'policy' | ForEach-Object { $_.Name })
    foreach ($t in @($Tenant.Policies | Where-Object { $repoNames -notcontains $_.displayName })) {
        $rows.Add((New-PaCaPlanRow 'policy' $t.displayName 'NotInRepository' -Note "In the tenant ($($t.state)) but not in the repository: reported, never deleted"))
    }
    $rows.ToArray()
}

function Invoke-PaCaPlan {
    <#
    .SYNOPSIS
        Carry out a plan. A dry run unless the client was made with -Apply: it returns each request
        it would send with Sent = $false. With -Apply it refuses to start if the pre-merge check has
        a Finding, or if any policy it would write leaves out the emergency access group.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Client,
        [Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Plan,
        [Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Findings,
        [Parameter(Mandatory)][string]$EmergencyGroupId,
        [string[]]$ReportOnlyInstrument = @()
    )
    $writes = @($Plan | Where-Object { $_.Action -in 'Create', 'Update' })
    if ($Client.Apply) {
        $bad = @($Findings | Where-Object Severity -EQ 'Finding')
        if ($bad.Count -gt 0) { throw "Refusing -Apply: the pre-merge check has $($bad.Count) Finding(s). Fix the files first." }
        foreach ($w in @($writes | Where-Object Kind -EQ 'policy')) {
            $state = if ($w.Body.Contains('state')) { $w.Body['state'] } else { 'unchanged' }
            $users = if ($w.Body.Contains('conditions')) { $w.Body['conditions']['users'] } else { $null }
            $instrument = $ReportOnlyInstrument -contains $w.Name -and $state -eq $script:ReportOnly
            if (-not $instrument -and $state -ne 'disabled' -and $null -ne $users -and @(Get-PaCaList $users 'excludeGroups') -notcontains $EmergencyGroupId) {
                throw "Refusing -Apply: $($w.Name) would be written without the emergency access exclusion."
            }
        }
    }
    foreach ($w in $writes) {
        $r = Resolve-PaCaRequest -Client ([pscustomobject]@{ Calls = @(Get-PaCaCall -Task 'ca-apply'); Task = 'ca-apply'; Apply = $true; Cloud = $Client.Cloud }) -CallId $w.CallId -Bind $w.Bind
        $sent = $false
        if ($Client.Apply) { $null = Send-PaCaWrite -Client $Client -CallId $w.CallId -Bind $w.Bind -Body $w.Body; $sent = $true }
        [pscustomobject]@{ Kind = $w.Kind; Name = $w.Name; Action = $w.Action; Method = $r.Method; Uri = $r.Uri; Body = $w.Body; Sent = $sent }
    }
}

function Export-PaCaRun {
    <# Write a run's files and a manifest with each file's SHA-256, the cloud, the mode and every request. #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][hashtable]$Files,
        [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][string]$Task,
        [Parameter(Mandatory)][string]$Mode,
        [object[]]$Evidence = @(),
        [string]$TenantId
    )
    $OutputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $utf8 = [Text.UTF8Encoding]::new($false)
    $hashes = [ordered]@{}
    foreach ($name in ($Files.Keys | Sort-Object)) {
        $p = Join-Path $OutputPath $name
        [IO.File]::WriteAllText($p, ((ConvertTo-Json -InputObject @($Files[$name]) -Depth 30) + "`n"), $utf8)
        $hashes[$name] = (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    $manifest = [ordered]@{
        task = $Task; mode = $Mode; cloud = $Cloud; tenantId = $TenantId
        generated = [DateTime]::UtcNow.ToString('o')
        graphPermissions = (Get-PaCaRequiredPermission -Task $Task).GraphPermissions
        requests = @($Evidence | ForEach-Object { [ordered]@{ call = $_.Call; method = $_.Method; uri = $_.Uri; at = $_.At } })
        files = $hashes
    }
    [IO.File]::WriteAllText((Join-Path $OutputPath 'manifest.json'), ((ConvertTo-Json -InputObject $manifest -Depth 10) + "`n"), $utf8)
    Get-Item -LiteralPath (Join-Path $OutputPath 'manifest.json')
}

Export-ModuleMember -Function Get-PaCaCall, Get-PaCaRequiredPermission, New-PaCaClient, Invoke-PaCaList, New-PaCaLiveInvoker,
    New-PaCaFixtureInvoker, Read-PaCaRepository, ConvertFrom-PaCaTemplate, Read-PaCaTemplatePage, Test-PaCaPolicyBody, Test-PaCaRepository, Compare-PaCaValue, Get-PaCaTenant,
    Get-PaCaPlan, Invoke-PaCaPlan, Export-PaCaRun
