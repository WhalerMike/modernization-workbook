#Requires -Version 7.1
<#
    NpiWorkloadCa: Chapter 08 of the developer workbook "Building Non-Person Identity".

    Conditional Access for workload identities as reviewed data and code. The scope is a reviewed
    file: Tier 1 single-tenant service principals assigned directly by object ID, never through a
    group, each in a ring; the workload egress ranges; and every identity out of scope (managed
    identities, multitenant and SaaS apps, agents, legacy service principals) with the control
    that covers it instead. The program's CA015 (location) and CA037 (high service principal risk)
    are policy templates rendered once per ring. A pre-merge check (NPI-WCA-01 to -09) reads the
    files only; a tenant check confirms each object ID is what the scope says it is. A plan
    compares the files with the tenant: a dry run unless the client is the wca-apply task, every
    new policy created report-only, a ring enforced only with -AllowEnforce, a D-N5 record and a
    reviewed sign-in summary that shows the ring ready. Nothing is ever deleted. A reader for the
    service principal sign-in logs (Graph beta) summarizes the report-only results per principal,
    and an alert definition for block events is rendered from the scope for security operations.

    Every call is declared in config/calls-ch08.json with its least-privileged permission, sent
    only to the cloud's own Graph host. Clouds come from NpiCore (Chapter 01).
    Illustrative: tested against fixtures and a fake, not against a production tenant.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot '../NpiCore/NpiCore.psm1') -Global

$script:CallsPath = Join-Path $PSScriptRoot '../../config/calls-ch08.json'
$script:RepoPath = Join-Path $PSScriptRoot '../../workload-ca'
$script:ReportOnly = 'enabledForReportingButNotEnforced'
$script:States = @('enabled', 'disabled', 'enabledForReportingButNotEnforced')
$script:Guid = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
$script:BlockedCode = 53003
# Design guidance: report-only for at least two weeks before a ring is enforced (Book 04, Chapter 07).
$script:MinReportOnlyDays = 14
# Design guidance: an egress range broader than these prefixes isn't "where the workload runs".
$script:MinPrefix = @{ IPv4 = 16; IPv6 = 32 }

function ConvertTo-NpiWcaDate {
    param([string]$Text)
    if (-not $Text) { return $null }
    [datetime]::Parse($Text, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal)
}

function Get-NpiWcaValue {
    # A nested value from a hashtable, or $null when any step is missing.
    param($Hash, [string[]]$Path)
    $v = $Hash
    foreach ($p in $Path) { if ($v -is [Collections.IDictionary] -and $v.Contains($p)) { $v = $v[$p] } else { return $null } }
    $v
}

function Get-NpiWcaList {
    param($Hash, [string[]]$Path)
    @(Get-NpiWcaValue $Hash $Path | Where-Object { $null -ne $_ } | ForEach-Object { [string]$_ })
}

# ----------------------------------------------------------------------------- calls and the client

function Get-NpiWcaCallList {
    [CmdletBinding()]
    param([string]$Path = $script:CallsPath)
    Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
}

function Get-NpiWcaCall {
    <# The declared Chapter 08 calls, optionally for one task. #>
    [CmdletBinding()]
    param([ValidateSet('wca-read', 'wca-signins', 'wca-apply')][string]$Task)
    $all = @((Get-NpiWcaCallList).calls)
    if ($Task) { $all = @($all | Where-Object { $_.tasks -contains $Task }) }
    , $all
}

function Get-NpiWcaRequiredPermission {
    <# The union of a task's calls: Graph permissions and methods. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][ValidateSet('wca-read', 'wca-signins', 'wca-apply')][string]$Task)
    $calls = Get-NpiWcaCall -Task $Task
    [pscustomobject]@{
        Task             = $Task
        Mode             = (Get-NpiWcaCallList).tasks[$Task].mode
        GraphPermissions = @($calls | ForEach-Object { $_.permissions } | Sort-Object -Unique)
        Methods          = @($calls | ForEach-Object { $_.method } | Sort-Object -Unique)
    }
}

function New-NpiWcaClient {
    <#
    .SYNOPSIS
        A Graph client for one Chapter 08 task in one cloud. -Invoke is
        { param($Method, $Uri, $Body, $Headers) } and returns the parsed body as a hashtable.
        Only the wca-apply task can write.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][ValidateSet('wca-read', 'wca-signins', 'wca-apply')][string]$Task,
        [Parameter(Mandatory)][scriptblock]$Invoke
    )
    $decl = (Get-NpiWcaCallList).tasks[$Task]
    [pscustomobject]@{
        Cloud    = Get-NpiCloud -Cloud $Cloud
        Task     = $Task
        Apply    = $decl.mode -eq 'write'
        Calls    = Get-NpiWcaCall -Task $Task
        Invoke   = $Invoke
        Evidence = [Collections.Generic.List[object]]::new()
    }
}

function Resolve-NpiWcaRequest {
    # The URL for a declared call. Refuses an undeclared call, a write from a read task, DELETE,
    # and a bound value that isn't an object ID.
    param($Client, [string]$CallId, [hashtable]$Bind = @{}, [string]$Query)
    $call = $Client.Calls | Where-Object { $_.id -eq $CallId }
    if (-not $call) { throw "Undeclared call '$CallId' for task '$($Client.Task)'; add it to config/calls-ch08.json with its permission." }
    if ($call.method -eq 'DELETE') { throw 'Refusing DELETE: this code never deletes a policy or a named location.' }
    if ($call.method -ne 'GET' -and -not $Client.Apply) { throw "Refusing $($call.method): task '$($Client.Task)' only reads. Writes are the wca-apply task." }
    $path = $call.path
    foreach ($k in $Bind.Keys) {
        $v = [string]$Bind[$k]
        if ($v -notmatch $script:Guid) { throw "Refusing '$CallId': '$v' isn't an object ID." }
        $path = $path.Replace("{$k}", $v)
    }
    if ($path -match '\{[a-zA-Z]+\}') { throw "Unbound placeholder in $path" }
    $uri = "$($Client.Cloud.Graph)/$($call.version)$path"
    if ($Query) { $uri += "?$Query" }
    [pscustomobject]@{ Call = $call; Method = $call.method; Uri = $uri }
}

function Invoke-NpiWcaGet {
    <# GET a declared call on the cloud's own host, following every @odata.nextLink. -One returns the single body. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client, [Parameter(Mandatory)][string]$CallId, [hashtable]$Bind = @{}, [string]$Query, [hashtable]$Headers, [switch]$One)
    $r = Resolve-NpiWcaRequest -Client $Client -CallId $CallId -Bind $Bind -Query $Query
    if ($r.Method -ne 'GET') { throw "$CallId isn't a read" }
    $items = [Collections.Generic.List[object]]::new()
    $uri = $r.Uri
    while ($uri) {
        Assert-NpiHost -Uri $uri -ExpectedHost $Client.Cloud.Graph
        $Client.Evidence.Add([pscustomobject]@{ Call = $CallId; Method = 'GET'; Target = $uri; At = [DateTime]::UtcNow.ToString('o') })
        $body = & $Client.Invoke 'GET' $uri $null $Headers
        if ($null -eq $body) { throw "No response for $uri" }
        if ($One) { return $body }
        foreach ($v in @($body['value'])) { if ($null -ne $v) { $items.Add($v) } }
        $uri = if ($body.ContainsKey('@odata.nextLink')) { $body['@odata.nextLink'] } else { $null }
    }
    $items.ToArray()
}

function Send-NpiWcaWrite {
    # One declared write, only from a wca-apply client.
    param($Client, [string]$CallId, [hashtable]$Bind = @{}, $Body)
    $r = Resolve-NpiWcaRequest -Client $Client -CallId $CallId -Bind $Bind
    Assert-NpiHost -Uri $r.Uri -ExpectedHost $Client.Cloud.Graph
    $Client.Evidence.Add([pscustomobject]@{ Call = $CallId; Method = $r.Method; Target = $r.Uri; At = [DateTime]::UtcNow.ToString('o') })
    & $Client.Invoke $r.Method $r.Uri $Body $null
}

# ----------------------------------------------------------------------------- the fake

function New-NpiWcaFixtureInvoker {
    <#
    .SYNOPSIS
        A fake Microsoft Graph for Chapter 08, served from a fixture tenant: policies, named
        locations, service principals and the beta sign-in log, paged with a next link on the same
        host. It refuses what Learn documents Graph refuses (a policy state outside the three
        values, a service principal entry that isn't an ID or ServicePrincipalsInMyTenant), serves
        only interactive sign-ins unless the filter asks for service principals, and returns the
        report-only results as unknownFutureValue unless the request carries
        Prefer: include-unknown-enum-members. DELETE throws. Every call is recorded in .Calls.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][string]$Cloud, [int]$PageSize = 2)
    $t = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 50
    foreach ($k in 'policies', 'namedLocations', 'servicePrincipals', 'signIns') {
        $t[$k] = [Collections.Generic.List[object]]::new([object[]]@($t[$k] | Where-Object { $null -ne $_ }))
    }
    $state = [pscustomobject]@{ Tenant = $t; Calls = [Collections.Generic.List[object]]::new(); PageSize = $PageSize; Graph = (Get-NpiCloud -Cloud $Cloud).Graph; Next = 100; Invoke = $null }
    $s = $state
    $fake = ${function:Invoke-NpiWcaFake}
    $state.Invoke = { param($Method, $Uri, $Body, $Headers) & $fake -State $s -Method $Method -Uri $Uri -Body $Body -Headers $Headers }.GetNewClosure()
    $state
}

function Invoke-NpiWcaFake {
    param($State, [string]$Method, [string]$Uri, $Body, $Headers)
    $State.Calls.Add([pscustomobject]@{ Method = $Method; Uri = $Uri; Body = $Body; Headers = $Headers })
    $u = [Uri]$Uri
    if ("$($u.Scheme)://$($u.Host)" -ne $State.Graph) { throw "The fake serves only $($State.Graph)" }
    $path = [Uri]::UnescapeDataString($u.AbsolutePath)
    $q = @{}
    foreach ($pair in $u.Query.TrimStart('?').Split('&', [StringSplitOptions]::RemoveEmptyEntries)) {
        $kv = $pair.Split('=', 2); $q[[Uri]::UnescapeDataString($kv[0])] = if ($kv.Count -gt 1) { [Uri]::UnescapeDataString($kv[1].Replace('+', ' ')) } else { '' }
    }
    $t = $State.Tenant
    $page = {
        param($All)
        $skip = if ($q.ContainsKey('$skiptoken')) { [int]$q['$skiptoken'] } else { 0 }
        $slice = @($All | Select-Object -Skip $skip -First $State.PageSize)
        $resp = @{ value = $slice }
        if ($skip + $State.PageSize -lt @($All).Count) {
            $rest = ($q.GetEnumerator() | Where-Object Key -NE '$skiptoken' | Sort-Object Key | ForEach-Object { "$($_.Key)=$([Uri]::EscapeDataString($_.Value))" }) -join '&'
            $resp['@odata.nextLink'] = "$($State.Graph)$($u.AbsolutePath)?" + $(if ($rest) { "$rest&" } else { '' }) + "`$skiptoken=$($skip + $State.PageSize)"
        }
        $resp
    }
    $copy = { param($o) $o | ConvertTo-Json -Depth 30 | ConvertFrom-Json -AsHashtable -Depth 30 }
    $validate = {
        param($b)
        if ($b.Contains('state') -and $b['state'] -notin $script:States) { throw "400 Bad Request: '$($b['state'])' isn't a conditionalAccessPolicyState" }
        foreach ($sp in @(Get-NpiWcaList $b 'conditions', 'clientApplications', 'includeServicePrincipals') + @(Get-NpiWcaList $b 'conditions', 'clientApplications', 'excludeServicePrincipals')) {
            if ($sp -notmatch $script:Guid -and $sp -ne 'ServicePrincipalsInMyTenant') { throw "400 Bad Request: '$sp' isn't a service principal ID or ServicePrincipalsInMyTenant" }
        }
    }
    switch ($Method) {
        'GET' {
            switch -Regex ($path) {
                '^/v1\.0/identity/conditionalAccess/policies$' { return & $page $t.policies }
                '^/v1\.0/identity/conditionalAccess/namedLocations$' { return & $page $t.namedLocations }
                '^/v1\.0/servicePrincipals$' { return & $page $t.servicePrincipals }
                '^/v1\.0/servicePrincipals/([^/]+)$' {
                    $id = $Matches[1]; $sp = @($t.servicePrincipals | Where-Object { $_.id -eq $id })
                    if ($sp.Count -ne 1) { throw "404 Not Found: Request_ResourceNotFound servicePrincipal $id" }
                    return (& $copy $sp[0])
                }
                '^/beta/auditLogs/signIns$' {
                    $f = "$($q['$filter'])"
                    if ($f -notmatch "^\(createdDateTime ge (\S+) and createdDateTime le (\S+)\)( and signInEventTypes/any\(t: t eq '(\w+)'\))?$") { throw "The fake evaluates only Learn's time-range filter, with or without the event type, not: $f" }
                    $from = ConvertTo-NpiWcaDate $Matches[1]; $to = ConvertTo-NpiWcaDate $Matches[2]
                    # Learn: only interactive sign-ins return unless the filter names an event type.
                    $type = if ($Matches[4]) { $Matches[4] } else { 'interactiveUser' }
                    $prefer = $Headers -and $Headers['Prefer'] -eq 'include-unknown-enum-members'
                    $rows = foreach ($r in $t.signIns) {
                        $at = ConvertTo-NpiWcaDate $r.createdDateTime
                        if ($at -lt $from -or $at -gt $to -or @($r.signInEventTypes) -notcontains $type) { continue }
                        $o = & $copy $r
                        if (-not $prefer) { foreach ($p in @($o.appliedConditionalAccessPolicies)) { if ($p.result -like 'reportOnly*') { $p.result = 'unknownFutureValue' } } }
                        $o
                    }
                    # Learn: descending order of createdDateTime.
                    return & $page @($rows | Sort-Object { $_.createdDateTime } -Descending)
                }
            }
        }
        'POST' {
            switch -Regex ($path) {
                '^/v1\.0/identity/conditionalAccess/policies$' {
                    & $validate $Body
                    $new = & $copy $Body; $State.Next++
                    $new['id'] = 'ca000000-0000-4000-8000-{0:d12}' -f $State.Next
                    $t.policies.Add($new); return $new
                }
                '^/v1\.0/identity/conditionalAccess/namedLocations$' {
                    if ($Body['@odata.type'] -ne '#microsoft.graph.ipNamedLocation') { throw '400 Bad Request: @odata.type of the derived type is required' }
                    $new = & $copy $Body; $State.Next++
                    $new['id'] = '10c00000-0000-4000-8000-{0:d12}' -f $State.Next
                    $t.namedLocations.Add($new); return $new
                }
            }
        }
        'PATCH' {
            switch -Regex ($path) {
                '^/v1\.0/identity/conditionalAccess/policies/([^/]+)$' {
                    $id = $Matches[1]; $p = $t.policies | Where-Object { $_.id -eq $id }
                    if (-not $p) { throw "404 policy $id" }
                    & $validate $Body
                    foreach ($k in $Body.Keys) { $p[$k] = & $copy $Body[$k] }
                    return $null
                }
                '^/v1\.0/identity/conditionalAccess/namedLocations/([^/]+)$' {
                    $id = $Matches[1]; $l = $t.namedLocations | Where-Object { $_.id -eq $id }
                    if (-not $l) { throw "404 namedLocation $id" }
                    foreach ($k in $Body.Keys) { $l[$k] = & $copy $Body[$k] }
                    return $null
                }
            }
        }
    }
    throw "The fake has no route for $Method $path"
}

# ----------------------------------------------------------------------------- the repository and the scope

function Read-NpiWcaScope {
    <# The reviewed scope file, as a hashtable, with its SHA-256. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $s = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 30
    $s['_sha256'] = Get-NpiFileHash -Path $Path
    $s
}

function Read-NpiWcaRepository {
    <# The policy templates, the named location and the alert definition in workload-ca/. #>
    [CmdletBinding()]
    param([string]$Path = $script:RepoPath)
    $read = { param($f, $kind) $text = Get-Content -LiteralPath $f.FullName -Raw; [pscustomobject]@{ Kind = $kind; File = "$kind/$($f.Name)"; Name = $f.BaseName; Text = $text; Body = ($text | ConvertFrom-Json -AsHashtable -Depth 30) } }
    [pscustomobject]@{
        Policies  = @(Get-ChildItem -LiteralPath (Join-Path $Path 'policies') -Filter '*.json' | Sort-Object Name | ForEach-Object { & $read $_ 'policies' })
        Locations = @(Get-ChildItem -LiteralPath (Join-Path $Path 'locations') -Filter '*.json' | Sort-Object Name | ForEach-Object { & $read $_ 'locations' })
        Alerts    = @(Get-ChildItem -LiteralPath (Join-Path $Path 'alerts') -Filter '*.json' | Sort-Object Name | ForEach-Object { & $read $_ 'alerts' })
    }
}

function Read-NpiWcaLearnSample {
    <#
    .SYNOPSIS
        The Graph JSON sample from the pinned Learn page "Conditional Access for workload
        identities", unmodified: its one json block. Throws if the page no longer has exactly one.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $text = Get-Content -LiteralPath $Path -Raw
    $m = @([regex]::Matches($text, '```json\r?\n(.*?)\r?\n```', 'Singleline'))
    if ($m.Count -ne 1) { throw "Expected one json sample on the pinned page, found $($m.Count)" }
    $m[0].Groups[1].Value | ConvertFrom-Json -AsHashtable -Depth 30
}

# ----------------------------------------------------------------------------- addresses

function ConvertTo-NpiWcaCidr {
    <# Parse a CIDR range; $null if it isn't one. #>
    param([string]$Text)
    if ($Text -notmatch '^([0-9a-fA-F:.]+)/(\d{1,3})$') { return $null }
    $ip = $null
    if (-not [Net.IPAddress]::TryParse($Matches[1], [ref]$ip)) { return $null }
    $bits = [int]$Matches[2]
    $family = if ($ip.AddressFamily -eq 'InterNetworkV6') { 'IPv6' } else { 'IPv4' }
    $max = if ($family -eq 'IPv6') { 128 } else { 32 }
    if ($bits -gt $max) { return $null }
    [pscustomobject]@{ Text = $Text; Family = $family; Bytes = $ip.GetAddressBytes(); Prefix = $bits }
}

function Test-NpiWcaIpInRange {
    <# True when an IP address is inside any of the CIDR ranges. #>
    param([string]$Ip, [string[]]$Ranges)
    $a = $null
    if (-not [Net.IPAddress]::TryParse($Ip, [ref]$a)) { return $false }
    $ab = $a.GetAddressBytes()
    foreach ($r in $Ranges) {
        $c = ConvertTo-NpiWcaCidr $r
        if (-not $c -or $c.Bytes.Length -ne $ab.Length) { continue }
        $ok = $true
        for ($i = 0; $i -lt $c.Prefix; $i++) {
            $byte = [math]::Floor($i / 8); $mask = 0x80 -shr ($i % 8)
            if (($ab[$byte] -band $mask) -ne ($c.Bytes[$byte] -band $mask)) { $ok = $false; break }
        }
        if ($ok) { return $true }
    }
    $false
}

# ----------------------------------------------------------------------------- the pre-merge check

function New-NpiWcaFinding {
    param([string]$Rule, [ValidateSet('Finding', 'Warn', 'Info')][string]$Severity, [string]$Object, [string]$Message)
    [pscustomobject]@{ Id = "$Rule`:$Object"; Rule = $Rule; Severity = $Severity; Object = $Object; Message = $Message }
}

function Test-NpiWcaPolicyBody {
    <#
    .SYNOPSIS
        NPI-WCA-01, -07 and -08 on one policy body: a repository template, a rendered policy, or
        Learn's sample. Reads the body only.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][Collections.IDictionary]$Body, [Parameter(Mandatory)][string]$EgressName, [string]$Name, [switch]$Rendered)
    if (-not $Name) { $Name = [string]$Body['displayName'] }
    $f = [Collections.Generic.List[object]]::new()
    $c = $Body['conditions']
    # NPI-WCA-01: assigned directly by object ID, never through users, groups, roles or a keyword.
    $users = Get-NpiWcaValue $Body 'conditions', 'users'
    if ($users -is [Collections.IDictionary] -and @($users.Values | Where-Object { $null -ne $_ -and @($_).Count }).Count) { $f.Add((New-NpiWcaFinding 'NPI-WCA-01' 'Finding' $Name 'Targets users, groups or roles; a workload policy assigns service principals directly, and Learn says a policy assigned to a group that contains a service principal isn''t enforced for it')) }
    $inc = @(Get-NpiWcaList $Body 'conditions', 'clientApplications', 'includeServicePrincipals')
    if ($inc.Count -eq 0) { $f.Add((New-NpiWcaFinding 'NPI-WCA-01' 'Finding' $Name 'No service principals in clientApplications.includeServicePrincipals')) }
    $okInc = @(if ($Rendered) { $inc | Where-Object { $_ -match $script:Guid } } else { $inc | Where-Object { $_ -eq '{scope:ring}' } })
    $bad = @($inc | Where-Object { $okInc -notcontains $_ })
    if ($bad.Count) { $f.Add((New-NpiWcaFinding 'NPI-WCA-01' 'Finding' $Name "includeServicePrincipals holds something other than the ring's object IDs: $($bad -join ', ')")) }
    $badEx = @(Get-NpiWcaList $Body 'conditions', 'clientApplications', 'excludeServicePrincipals' | Where-Object { $_ -notmatch $script:Guid })
    if ($badEx.Count) { $f.Add((New-NpiWcaFinding 'NPI-WCA-01' 'Finding' $Name "excludeServicePrincipals holds something that isn't an object ID: $($badEx -join ', ')")) }
    if ($null -ne (Get-NpiWcaValue $Body 'conditions', 'clientApplications', 'servicePrincipalFilter')) { $f.Add((New-NpiWcaFinding 'NPI-WCA-01' 'Finding' $Name 'Uses a servicePrincipalFilter; scope is the reviewed list of object IDs')) }
    # NPI-WCA-07: report-only in the file, block only, all resources, all client app types.
    if (-not $Rendered -and $Body['state'] -ne $script:ReportOnly) { $f.Add((New-NpiWcaFinding 'NPI-WCA-07' 'Finding' $Name "state is '$($Body['state'])'; a policy file is always $($script:ReportOnly), and enforcement is the ring's decision")) }
    $grant = @(Get-NpiWcaList $Body 'grantControls', 'builtInControls')
    if (($grant -join ',') -ne 'block' -or $null -ne (Get-NpiWcaValue $Body 'grantControls', 'authenticationStrength')) { $f.Add((New-NpiWcaFinding 'NPI-WCA-07' 'Finding' $Name "Grant is '$($grant -join ', ')'; block is the only grant control for workload identities")) }
    if ((@(Get-NpiWcaList $Body 'conditions', 'applications', 'includeApplications') -join ',') -ne 'All') { $f.Add((New-NpiWcaFinding 'NPI-WCA-07' 'Finding' $Name 'Doesn''t target all resources')) }
    if ((@(Get-NpiWcaList $Body 'conditions', 'clientAppTypes') -join ',') -ne 'all') { $f.Add((New-NpiWcaFinding 'NPI-WCA-07' 'Finding' $Name 'clientAppTypes isn''t ["all"]; the v1.0 condition set marks clientAppTypes required')) }
    $risk = @(Get-NpiWcaList $Body 'conditions', 'servicePrincipalRiskLevels')
    $loc = Get-NpiWcaValue $Body 'conditions', 'locations'
    if (-not $risk.Count -and $null -eq $loc) { $f.Add((New-NpiWcaFinding 'NPI-WCA-07' 'Finding' $Name 'Neither a location nor a service principal risk condition: it would block the workload everywhere')) }
    # NPI-WCA-08: the location condition excludes the workload egress location and nothing else.
    if ($null -ne $loc) {
        $ex = @(Get-NpiWcaList $Body 'conditions', 'locations', 'excludeLocations')
        $want = @(if ($Rendered) { $ex | Where-Object { $_ -match $script:Guid } } else { $ex | Where-Object { $_ -eq "{location:$EgressName}" } })
        if ($ex.Count -ne 1 -or $want.Count -ne 1) { $f.Add((New-NpiWcaFinding 'NPI-WCA-08' 'Finding' $Name "excludeLocations should name only the $EgressName named location, not: $($ex -join ', ')")) }
        if ((@(Get-NpiWcaList $Body 'conditions', 'locations', 'includeLocations') -join ',') -ne 'All') { $f.Add((New-NpiWcaFinding 'NPI-WCA-08' 'Finding' $Name 'includeLocations isn''t ["All"]')) }
    }
    $f.ToArray()
}

function Test-NpiWcaRepository {
    <#
    .SYNOPSIS
        The pre-merge check: NPI-WCA-01 to -09 over the policy templates, the named location and the
        scope file. Reads files only, and runs in the pull request pipeline. A Finding stops -Apply.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Repository, [Parameter(Mandatory)][hashtable]$Scope, [Parameter(Mandatory)][datetime]$AsOf)
    $f = [Collections.Generic.List[object]]::new()
    $egressName = [string](Get-NpiWcaValue $Scope 'egress', 'name')
    foreach ($p in $Repository.Policies) { foreach ($x in Test-NpiWcaPolicyBody -Body $p.Body -EgressName $egressName -Name $p.Name) { $f.Add($x) } }

    # NPI-WCA-05: D-N4 licensing, Tier 1 only, one ring each, no duplicates.
    $lic = $Scope['licensing']
    if (-not $lic -or -not $lic['decidedBy'] -or -not $lic['decidedOn']) { $f.Add((New-NpiWcaFinding 'NPI-WCA-05' 'Finding' 'licensing' 'No D-N4 record: Workload ID Premium is required to create or change these policies')) }
    $rings = @($Scope['rings'] | ForEach-Object { $_['name'] })
    $seen = @{}
    foreach ($e in @($Scope['inScope'])) {
        $n = "$($e['name'])"
        if ("$($e['objectId'])" -notmatch $script:Guid) { $f.Add((New-NpiWcaFinding 'NPI-WCA-01' 'Finding' $n "objectId '$($e['objectId'])' isn't an object ID")) }
        if ($seen.ContainsKey("$($e['objectId'])")) { $f.Add((New-NpiWcaFinding 'NPI-WCA-05' 'Finding' $n 'Listed twice in scope')) }
        $seen["$($e['objectId'])"] = $true
        if ($e['tier'] -ne 'Tier1') { $f.Add((New-NpiWcaFinding 'NPI-WCA-05' 'Finding' $n "Tier '$($e['tier'])': D-N4 licenses Tier 1 single-tenant service principals")) }
        if ($rings -notcontains $e['ring']) { $f.Add((New-NpiWcaFinding 'NPI-WCA-05' 'Finding' $n "Ring '$($e['ring'])' isn't one of: $($rings -join ', ')")) }
        # NPI-WCA-02 and -03 on what the scope records; the tenant check confirms them.
        if ($e['servicePrincipalType'] -eq 'ManagedIdentity') { $f.Add((New-NpiWcaFinding 'NPI-WCA-02' 'Finding' $n 'A managed identity: Learn says managed identities aren''t covered by Conditional Access')) }
        elseif ($e['servicePrincipalType'] -ne 'Application') { $f.Add((New-NpiWcaFinding 'NPI-WCA-03' 'Finding' $n "servicePrincipalType '$($e['servicePrincipalType'])'; only an application registered in this tenant is covered")) }
        if ($e['signInAudience'] -ne 'AzureADMyOrg') { $f.Add((New-NpiWcaFinding 'NPI-WCA-03' 'Finding' $n "signInAudience '$($e['signInAudience'])': only single-tenant service principals are covered")) }
    }
    # NPI-WCA-06: every out-of-scope identity names the control that covers it, and who reviewed it.
    foreach ($o in @($Scope['outOfScope'])) {
        if (-not $o['control'] -or -not $o['reviewedBy'] -or -not $o['reviewedOn']) { $f.Add((New-NpiWcaFinding 'NPI-WCA-06' 'Finding' "$($o['name'])" 'Out of scope with no compensating control, reviewer or review date')) }
        if ($seen.ContainsKey("$($o['objectId'])")) { $f.Add((New-NpiWcaFinding 'NPI-WCA-06' 'Finding' "$($o['name'])" 'Both in scope and out of scope')) }
    }
    # NPI-WCA-08: the egress ranges.
    $ranges = @(Get-NpiWcaList $Scope 'egress', 'ranges')
    if (-not $ranges.Count) { $f.Add((New-NpiWcaFinding 'NPI-WCA-08' 'Finding' $egressName 'No workload egress ranges')) }
    foreach ($r in $ranges) {
        $c = ConvertTo-NpiWcaCidr $r
        if (-not $c) { $f.Add((New-NpiWcaFinding 'NPI-WCA-08' 'Finding' $egressName "'$r' isn't a CIDR range")); continue }
        if ($c.Prefix -lt $script:MinPrefix[$c.Family]) { $f.Add((New-NpiWcaFinding 'NPI-WCA-08' 'Finding' $egressName "'$r' is broader than /$($script:MinPrefix[$c.Family]): not where a workload runs")) }
    }
    foreach ($l in $Repository.Locations) {
        if ($l.Body['displayName'] -ne $egressName) { $f.Add((New-NpiWcaFinding 'NPI-WCA-08' 'Finding' $l.Name "The named location file is '$($l.Body['displayName'])', not the scope's $egressName")) }
        if ($l.Body['isTrusted'] -ne $false) { $f.Add((New-NpiWcaFinding 'NPI-WCA-08' 'Warn' $l.Name 'Marked trusted: user policies that exclude trusted locations would then trust the workload ranges too')) }
    }
    # NPI-WCA-09: enforcement only with a D-N5 record, ring by ring, and dated, owned exclusions.
    $enf = $Scope['enforcement']
    $er = @(if ($enf) { $enf['rings'] })
    if ($er.Count) {
        $d = $enf['decision']
        if (-not $d -or $d['id'] -ne 'D-N5' -or $d['outcome'] -notin 'Enforce', 'EnforceWithExclusions' -or -not $d['decidedBy'] -or -not $d['decidedOn']) { $f.Add((New-NpiWcaFinding 'NPI-WCA-09' 'Finding' 'enforcement' 'A ring is marked for enforcement with no D-N5 record (Enforce or EnforceWithExclusions, decided by and on)')) }
    }
    $order = @{}; foreach ($r in @($Scope['rings'])) { $order[$r['name']] = [int]$r['order'] }
    foreach ($r in $er) {
        if (-not $r['enforce']) { continue }
        if ("$($r['signInReview'])" -notmatch '^[0-9a-f]{64}$' -or -not $r['reviewedBy'] -or -not $r['reviewedOn']) { $f.Add((New-NpiWcaFinding 'NPI-WCA-09' 'Finding' "$($r['ring'])" 'Enforced with no reviewed sign-in summary (its SHA-256, reviewer and date)')) }
        $prev = @($Scope['rings'] | Where-Object { [int]$_['order'] -lt $order[$r['ring']] } | ForEach-Object { $_['name'] })
        foreach ($p in $prev) { if (-not @($er | Where-Object { $_['ring'] -eq $p -and $_['enforce'] }).Count) { $f.Add((New-NpiWcaFinding 'NPI-WCA-09' 'Finding' "$($r['ring'])" "Enforced before ${p}: rings go in order")) } }
    }
    foreach ($x in @(if ($enf) { $enf['exclusions'] })) {
        $n = "exclusion:$($x['objectId'])"
        $ends = ConvertTo-NpiWcaDate $x['ends']
        if (-not $x['owner'] -or -not $ends -or -not $x['reason']) { $f.Add((New-NpiWcaFinding 'NPI-WCA-09' 'Finding' $n 'An exclusion needs an owner, a reason and an end date (D-N5, enforce with named exclusions)')) }
        elseif ($ends -le $AsOf) { $f.Add((New-NpiWcaFinding 'NPI-WCA-09' 'Finding' $n "Ended $($x['ends']); remove it or record a new decision")) }
        if (-not @($Scope['inScope'] | Where-Object { $_['objectId'] -eq $x['objectId'] -and $_['ring'] -eq $x['ring'] }).Count) { $f.Add((New-NpiWcaFinding 'NPI-WCA-09' 'Finding' $n "Not an in-scope service principal of ring '$($x['ring'])'")) }
    }
    $f.ToArray()
}

# ----------------------------------------------------------------------------- the tenant check

function Test-NpiWcaTenantScope {
    <#
    .SYNOPSIS
        Confirm the scope against the tenant: each in-scope object ID is a service principal (not
        an app registration's object ID), an Application registered in this tenant, single-tenant
        and enabled (NPI-WCA-02 to -04), and every managed identity, multitenant, SaaS, agent or
        legacy service principal in the tenant is recorded out of scope (NPI-WCA-06). Reads only.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client, [Parameter(Mandatory)][hashtable]$Scope)
    $f = [Collections.Generic.List[object]]::new()
    $tenant = [string]$Scope['tenantId']
    foreach ($e in @($Scope['inScope'])) {
        $n = "$($e['name'])"
        $sp = $null
        try { $sp = Invoke-NpiWcaGet -Client $Client -CallId 'wca-service-principal' -Bind @{ id = $e['objectId'] } -Query '$select=id,appId,displayName,servicePrincipalType,appOwnerOrganizationId,signInAudience,accountEnabled' -One }
        catch { if ("$_" -notmatch '404|NotFound') { throw } }
        if (-not $sp) { $f.Add((New-NpiWcaFinding 'NPI-WCA-04' 'Finding' $n "$($e['objectId']) isn't a service principal in this tenant; Learn says the app registration's object ID can't be used, only the enterprise application's")); continue }
        if ($sp['servicePrincipalType'] -eq 'ManagedIdentity') { $f.Add((New-NpiWcaFinding 'NPI-WCA-02' 'Finding' $n 'The tenant says this is a managed identity, which Conditional Access doesn''t cover')) }
        elseif ($sp['servicePrincipalType'] -ne 'Application' -or $sp['appOwnerOrganizationId'] -ne $tenant -or $sp['signInAudience'] -ne 'AzureADMyOrg') { $f.Add((New-NpiWcaFinding 'NPI-WCA-03' 'Finding' $n "Not a single-tenant application registered here (type $($sp['servicePrincipalType']), owner tenant $($sp['appOwnerOrganizationId']), audience $($sp['signInAudience']))")) }
        if ($sp['appId'] -ne $e['appId']) { $f.Add((New-NpiWcaFinding 'NPI-WCA-04' 'Finding' $n "appId is $($sp['appId']) in the tenant, $($e['appId']) in scope")) }
        if ($sp['accountEnabled'] -eq $false) { $f.Add((New-NpiWcaFinding 'NPI-WCA-04' 'Warn' $n 'Disabled in the tenant: it signs in nowhere, so there is nothing to observe in report-only')) }
    }
    $inIds = @($Scope['inScope'] | ForEach-Object { $_['objectId'] })
    $outIds = @($Scope['outOfScope'] | ForEach-Object { $_['objectId'] })
    $ms = @(Get-NpiWcaList $Scope 'microsoftOwnerTenantIds')
    $classes = [ordered]@{}
    foreach ($sp in @(Invoke-NpiWcaGet -Client $Client -CallId 'wca-service-principals' -Query '$select=id,appId,displayName,servicePrincipalType,appOwnerOrganizationId,signInAudience,accountEnabled')) {
        $class = if ($sp['servicePrincipalType'] -eq 'ManagedIdentity') { 'ManagedIdentity' }
        elseif ($ms -contains $sp['appOwnerOrganizationId']) { 'Microsoft' }
        elseif ($sp['servicePrincipalType'] -eq 'Legacy') { 'Legacy' }
        elseif ($sp['servicePrincipalType'] -ne 'Application') { 'Other' }
        elseif ($sp['appOwnerOrganizationId'] -ne $tenant) { 'SaaS' }
        elseif ($sp['signInAudience'] -ne 'AzureADMyOrg') { 'Multitenant' }
        else { 'Eligible' }
        $classes[$sp['id']] = $class
        if ($inIds -contains $sp['id'] -or $outIds -contains $sp['id'] -or $class -eq 'Microsoft') { continue }
        if ($class -eq 'Eligible') { $f.Add((New-NpiWcaFinding 'NPI-WCA-06' 'Info' "$($sp['displayName'])" 'Single-tenant and eligible, but not Tier 1 in scope: not covered by CA015 or CA037 under D-N4')) }
        else { $f.Add((New-NpiWcaFinding 'NPI-WCA-06' 'Finding' "$($sp['displayName'])" "A $class service principal that Conditional Access can't cover, with no out-of-scope record naming the control that covers it")) }
    }
    [pscustomobject]@{ Findings = $f.ToArray(); Classes = $classes }
}

# ----------------------------------------------------------------------------- enforcement

function Get-NpiWcaEnforcement {
    <#
    .SYNOPSIS
        Which rings may be enforced on this run. A ring is enforced only when the scope marks it,
        D-N5 is recorded, -AllowEnforce was given, the sign-in summary at -SignInSummaryPath has
        the SHA-256 the ring's record cites and shows the ring ready, and every earlier ring is
        enforced too. Anything else holds the ring in report-only, with the reason.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Scope, [switch]$AllowEnforce, [string]$SignInSummaryPath)
    $out = [ordered]@{}
    $enf = $Scope['enforcement']
    $er = @(if ($enf) { $enf['rings'] })
    $d = if ($enf) { $enf['decision'] } else { $null }
    $decided = $d -and $d['id'] -eq 'D-N5' -and $d['outcome'] -in 'Enforce', 'EnforceWithExclusions' -and $d['decidedBy'] -and $d['decidedOn']
    $summary = $null; $summaryHash = $null
    if ($SignInSummaryPath -and (Test-Path -LiteralPath $SignInSummaryPath)) { $summaryHash = Get-NpiFileHash -Path $SignInSummaryPath; $summary = Get-Content -LiteralPath $SignInSummaryPath -Raw | ConvertFrom-Json -AsHashtable -Depth 30 }
    foreach ($ring in @($Scope['rings'] | Sort-Object { [int]$_['order'] })) {
        $name = $ring['name']
        $rec = @($er | Where-Object { $_['ring'] -eq $name -and $_['enforce'] })
        $why = $null
        if (-not $rec.Count) { $out[$name] = [pscustomobject]@{ Enforce = $false; Marked = $false; Note = 'Report-only: not marked for enforcement' }; continue }
        $rec = $rec[0]
        $earlier = @($Scope['rings'] | Where-Object { [int]$_['order'] -lt [int]$ring['order'] } | ForEach-Object { $_['name'] })
        if (-not $decided) { $why = 'no D-N5 record' }
        elseif (-not $AllowEnforce) { $why = 'needs -AllowEnforce in the change that enforces it' }
        elseif (-not $summary) { $why = 'needs -SignInSummaryPath, the reviewed sign-in summary' }
        elseif ($summaryHash -ne "$($rec['signInReview'])".ToLowerInvariant()) { $why = "the sign-in summary's SHA-256 is $summaryHash, not the reviewed $($rec['signInReview'])" }
        elseif (-not @($summary['rings'] | Where-Object { $_['ring'] -eq $name -and $_['ready'] }).Count) { $why = 'the sign-in summary doesn''t show this ring ready' }
        elseif (@($earlier | Where-Object { -not $out.Contains($_) -or -not $out[$_].Enforce }).Count) { $why = 'an earlier ring isn''t enforced' }
        if ($why) { $out[$name] = [pscustomobject]@{ Enforce = $false; Marked = $true; Note = "Enforcement held: $why" } }
        else { $out[$name] = [pscustomobject]@{ Enforce = $true; Marked = $true; Note = "Enforced under D-N5 ($($d['decidedOn']))" } }
    }
    $out
}

# ----------------------------------------------------------------------------- desired state and the plan

function Get-NpiWcaDesiredLocation {
    <# The named location file with the scope's egress ranges in Graph's ipRange shape. #>
    param($Repository, [hashtable]$Scope)
    $l = $Repository.Locations | Where-Object { $_.Body['displayName'] -eq $Scope['egress']['name'] } | Select-Object -First 1
    if (-not $l) { throw "No named location file for $($Scope['egress']['name'])" }
    $b = [ordered]@{}
    foreach ($k in $l.Body.Keys) { $b[$k] = $l.Body[$k] }
    $b['ipRanges'] = @(foreach ($r in @($Scope['egress']['ranges'])) {
            $c = ConvertTo-NpiWcaCidr $r
            [ordered]@{ '@odata.type' = $(if ($c.Family -eq 'IPv6') { '#microsoft.graph.iPv6CidrRange' } else { '#microsoft.graph.iPv4CidrRange' }); cidrAddress = $r }
        })
    $b
}

function Get-NpiWcaDesiredPolicy {
    <#
    .SYNOPSIS
        Each policy template rendered once per ring: '<template>-<ring>', the ring's service
        principals by object ID, its dated exclusions, and the egress location's ID. State is
        report-only, or enabled for a ring Get-NpiWcaEnforcement says may be enforced.
    #>
    param($Repository, [hashtable]$Scope, [string]$LocationId, $Enforcement, [datetime]$AsOf)
    foreach ($ring in @($Scope['rings'] | Sort-Object { [int]$_['order'] })) {
        $rn = $ring['name']
        $ids = @($Scope['inScope'] | Where-Object { $_['ring'] -eq $rn } | ForEach-Object { [string]$_['objectId'] } | Sort-Object)
        if (-not $ids.Count) { continue }
        $exc = @(Get-NpiWcaValue $Scope 'enforcement', 'exclusions' | Where-Object { $_ -and $_['ring'] -eq $rn -and (ConvertTo-NpiWcaDate $_['ends']) -gt $AsOf } | ForEach-Object { [string]$_['objectId'] } | Sort-Object)
        foreach ($p in $Repository.Policies) {
            $body = $p.Text | ConvertFrom-Json -AsHashtable -Depth 30
            $body['displayName'] = "$($body['displayName'])-$rn"
            $body['conditions']['clientApplications']['includeServicePrincipals'] = $ids
            if ($exc.Count) { $body['conditions']['clientApplications']['excludeServicePrincipals'] = $exc }
            $blocked = $null
            if ($body['conditions'].Contains('locations')) {
                if ($LocationId) { $body['conditions']['locations']['excludeLocations'] = @($LocationId) } else { $blocked = "the named location $($Scope['egress']['name'])" }
            }
            $e = $Enforcement[$rn]
            $body['state'] = if ($e.Enforce) { 'enabled' } else { $script:ReportOnly }
            [pscustomobject]@{ Name = $body['displayName']; Ring = $rn; Template = $p.Name; Body = $body; Blocked = $blocked; Enforce = [bool]$e.Enforce; Note = $e.Note }
        }
    }
}

function ConvertTo-NpiWcaCanonical {
    # Compact JSON with dictionary keys sorted, so two objects with the same content compare equal.
    param($Value)
    if ($Value -is [Collections.IDictionary]) {
        $o = [ordered]@{}; foreach ($k in @($Value.Keys | Sort-Object)) { $o[$k] = $Value[$k] }
        return '{' + ((@($o.Keys) | ForEach-Object { (ConvertTo-Json -InputObject ([string]$_) -Compress) + ':' + (ConvertTo-NpiWcaCanonical $o[$_]) }) -join ',') + '}'
    }
    if ($Value -is [Collections.IList] -and $Value -isnot [string]) { return '[' + ((@($Value) | ForEach-Object { ConvertTo-NpiWcaCanonical $_ }) -join ',') + ']' }
    ConvertTo-Json -InputObject $Value -Compress
}

function Compare-NpiWcaValue {
    # Paths where the repository's value differs from the tenant's, driven by the repository.
    # Arrays compare as sets.
    param($Repo, $Tenant, [string]$Path)
    if ($Repo -is [Collections.IDictionary]) {
        foreach ($k in $Repo.Keys) {
            $t = if ($Tenant -is [Collections.IDictionary] -and $Tenant.Contains($k)) { $Tenant[$k] } else { $null }
            Compare-NpiWcaValue -Repo $Repo[$k] -Tenant $t -Path ($(if ($Path) { "$Path.$k" } else { $k }))
        }
        return
    }
    if ($Repo -is [Collections.IList] -and $Repo -isnot [string]) {
        $norm = { param($a) @($a | Where-Object { $null -ne $_ } | ForEach-Object { if ($_ -is [string]) { $_ } else { ConvertTo-NpiWcaCanonical $_ } } | Sort-Object) -join "`n" }
        if ((& $norm $Repo) -cne (& $norm $Tenant)) { $Path }
        return
    }
    if ("$Repo" -cne "$Tenant") { $Path }
}

function Get-NpiWcaTenant {
    <# Read the tenant's Conditional Access policies and named locations: two GETs, every page. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client)
    [pscustomobject]@{
        Policies  = @(Invoke-NpiWcaGet -Client $Client -CallId 'wca-policies')
        Locations = @(Invoke-NpiWcaGet -Client $Client -CallId 'wca-named-locations')
    }
}

function New-NpiWcaPlanRow {
    param($Kind, $Name, $Action, [string[]]$Changes = @(), $CallId, $Bind = @{}, $Body, $Note = '', $Ring, [bool]$Enforce = $false)
    [pscustomobject]@{ Kind = $Kind; Name = $Name; Ring = $Ring; Action = $Action; Changes = @($Changes); CallId = $CallId; Bind = $Bind; Body = $Body; Enforce = $Enforce; Note = $Note }
}

function Get-NpiWcaPlan {
    <#
    .SYNOPSIS
        Compare the repository and scope with the tenant and say what would change: the named
        location first, then each ring's policies. Create (a policy always report-only), Update,
        NoChange, Blocked (its named location doesn't exist yet), Held (an enforcement that isn't
        allowed on this run) and NotInRepository (a workload policy nobody's files name: reported,
        never deleted). Sends nothing.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Repository, [Parameter(Mandatory)][hashtable]$Scope, [Parameter(Mandatory)]$Tenant, [Parameter(Mandatory)]$Enforcement, [Parameter(Mandatory)][datetime]$AsOf)
    $rows = [Collections.Generic.List[object]]::new()
    $want = Get-NpiWcaDesiredLocation -Repository $Repository -Scope $Scope
    $have = $Tenant.Locations | Where-Object { $_['displayName'] -eq $want['displayName'] } | Select-Object -First 1
    $locId = $null
    if (-not $have) { $rows.Add((New-NpiWcaPlanRow 'location' $want['displayName'] 'Create' @() 'wca-location-create' @{} $want 'Created untrusted')) }
    else {
        $locId = [string]$have['id']
        $d = @(Compare-NpiWcaValue -Repo $want -Tenant $have -Path '')
        if ($d.Count) {
            $patch = [ordered]@{ '@odata.type' = $want['@odata.type'] }
            foreach ($top in @($d | ForEach-Object { $_.Split('.')[0] } | Sort-Object -Unique)) { $patch[$top] = $want[$top] }
            $rows.Add((New-NpiWcaPlanRow 'location' $want['displayName'] 'Update' $d 'wca-location-update' @{ id = $locId } $patch))
        } else { $rows.Add((New-NpiWcaPlanRow 'location' $want['displayName'] 'NoChange')) }
    }

    $desired = @(Get-NpiWcaDesiredPolicy -Repository $Repository -Scope $Scope -LocationId $locId -Enforcement $Enforcement -AsOf $AsOf)
    foreach ($p in $desired) {
        if ($p.Blocked) { $rows.Add((New-NpiWcaPlanRow 'policy' $p.Name 'Blocked' -Note "Needs $($p.Blocked) in the tenant first; rerun after it is created" -Ring $p.Ring)); continue }
        $t = $Tenant.Policies | Where-Object { $_['displayName'] -eq $p.Name } | Select-Object -First 1
        if (-not $t) {
            $body = $p.Body; $note = 'Created report-only'
            if ($body['state'] -ne $script:ReportOnly) { $note = 'Created report-only; enforce it in the next run'; $body['state'] = $script:ReportOnly }
            $rows.Add((New-NpiWcaPlanRow 'policy' $p.Name 'Create' @() 'wca-policy-create' @{} $body $note $p.Ring)); continue
        }
        $cmp = [ordered]@{}; foreach ($k in $p.Body.Keys) { if ($k -ne 'state') { $cmp[$k] = $p.Body[$k] } }
        $d = @(Compare-NpiWcaValue -Repo $cmp -Tenant $t -Path '')
        $patch = [ordered]@{}
        foreach ($top in @($d | ForEach-Object { $_.Split('.')[0] } | Sort-Object -Unique)) { $patch[$top] = $p.Body[$top] }
        $note = ''
        $wantState = $p.Body['state']
        if ($wantState -ne $t['state']) {
            if ($t['state'] -eq 'enabled' -and $wantState -eq $script:ReportOnly -and -not @(Get-NpiWcaValue $Scope 'enforcement', 'rings' | Where-Object { $_ -and $_['ring'] -eq $p.Ring -and $_['enforce'] }).Count) {
                $patch['state'] = $wantState; $d += 'state'; $note = 'Back to report-only: the ring is no longer marked for enforcement'
            } elseif ($wantState -eq 'enabled') { $patch['state'] = 'enabled'; $d += 'state'; $note = "State $($t['state']) to enabled. $($p.Note)" }
            elseif ($t['state'] -eq 'enabled') { $note = "Left enabled: $($p.Note)" }
            else { $patch['state'] = $wantState; $d += 'state'; $note = "State $($t['state']) to $wantState" }
        } elseif ($p.Note -like 'Enforcement held*') { $note = $p.Note }
        if ($patch.Count -eq 0) { $rows.Add((New-NpiWcaPlanRow 'policy' $p.Name $(if ($note -like '*held*') { 'Held' } else { 'NoChange' }) -Note $note -Ring $p.Ring)) }
        else { $rows.Add((New-NpiWcaPlanRow 'policy' $p.Name 'Update' $d 'wca-policy-update' @{ id = [string]$t['id'] } $patch $note $p.Ring ($patch['state'] -eq 'enabled'))) }
    }
    $names = @($desired | ForEach-Object { $_.Name })
    foreach ($t in @($Tenant.Policies | Where-Object { $null -ne (Get-NpiWcaValue $_ 'conditions', 'clientApplications') -and $names -notcontains $_['displayName'] })) {
        $rows.Add((New-NpiWcaPlanRow 'policy' $t['displayName'] 'NotInRepository' -Note "A workload identity policy in the tenant ($($t['state'])) that no file names: reported, never deleted"))
    }
    $rows.ToArray()
}

function Invoke-NpiWcaPlan {
    <#
    .SYNOPSIS
        Carry out a plan. A dry run unless the client is the wca-apply task: it returns each request
        it would send with Sent = $false. With wca-apply it refuses to start if the pre-merge or
        tenant check has a Finding, and refuses any policy write that assigns anything but object
        IDs, grants anything but block, creates a policy that isn't report-only, or enables one the
        plan didn't mark as an allowed enforcement.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client, [Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Plan, [Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Findings, [string]$EgressName = 'NL-WorkloadEgress')
    $writes = @($Plan | Where-Object { $_.Action -in 'Create', 'Update' })
    if ($Client.Apply) {
        $bad = @($Findings | Where-Object Severity -EQ 'Finding')
        if ($bad.Count) { throw "Refusing to apply: the checks have $($bad.Count) Finding(s). Fix the scope or the files first." }
        foreach ($w in @($writes | Where-Object Kind -EQ 'policy')) {
            if ($w.Action -eq 'Create') {
                if ($w.Body['state'] -ne $script:ReportOnly) { throw "Refusing to create $($w.Name) as '$($w.Body['state'])': a new policy is always report-only." }
                $x = @(Test-NpiWcaPolicyBody -Body $w.Body -EgressName $EgressName -Rendered | Where-Object Severity -EQ 'Finding')
                if ($x.Count) { throw "Refusing to create $($w.Name): $($x[0].Message)" }
            }
            if ($w.Body.Contains('conditions')) {
                $inc = @(Get-NpiWcaList $w.Body 'conditions', 'clientApplications', 'includeServicePrincipals')
                if (@($inc | Where-Object { $_ -notmatch $script:Guid }).Count -or $null -ne (Get-NpiWcaValue $w.Body 'conditions', 'users')) { throw "Refusing $($w.Name): service principals are assigned directly by object ID." }
            }
            if ($w.Body.Contains('state') -and $w.Body['state'] -eq 'enabled' -and -not $w.Enforce) { throw "Refusing to enable $($w.Name): the plan didn't allow its ring's enforcement." }
        }
    }
    foreach ($w in $writes) {
        $r = Resolve-NpiWcaRequest -Client ([pscustomobject]@{ Calls = (Get-NpiWcaCall -Task 'wca-apply'); Task = 'wca-apply'; Apply = $true; Cloud = $Client.Cloud }) -CallId $w.CallId -Bind $w.Bind
        $sent = $false
        if ($Client.Apply) { $null = Send-NpiWcaWrite -Client $Client -CallId $w.CallId -Bind $w.Bind -Body $w.Body; $sent = $true }
        [pscustomobject]@{ Kind = $w.Kind; Name = $w.Name; Action = $w.Action; Method = $r.Method; Uri = $r.Uri; Body = $w.Body; Sent = $sent }
    }
}

# ----------------------------------------------------------------------------- the sign-in reader

function Get-NpiWcaSignIn {
    <#
    .SYNOPSIS
        Service principal sign-ins between -From and -To, from Graph beta (List signIns), with the
        filter Learn gives for service principal sign-ins and the Prefer header that returns the
        report-only results. Throws if a result still comes back as unknownFutureValue.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client, [Parameter(Mandatory)][datetime]$From, [Parameter(Mandatory)][datetime]$To)
    $f = "(createdDateTime ge $($From.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')) and createdDateTime le $($To.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'))) and signInEventTypes/any(t: t eq 'servicePrincipal')"
    $rows = @(Invoke-NpiWcaGet -Client $Client -CallId 'wca-signins' -Query ('$filter=' + [Uri]::EscapeDataString($f)) -Headers @{ Prefer = 'include-unknown-enum-members' })
    foreach ($r in $rows) {
        foreach ($p in @($r['appliedConditionalAccessPolicies'])) { if ($p -and $p['result'] -eq 'unknownFutureValue') { throw 'A Conditional Access result came back as unknownFutureValue: the report-only results need the Prefer: include-unknown-enum-members header.' } }
    }
    , @($rows | Where-Object { @($_['signInEventTypes']) -contains 'servicePrincipal' })
}

function Get-NpiWcaSignInSummary {
    <#
    .SYNOPSIS
        Summarize report-only evidence per in-scope service principal and per ring. For each
        principal: sign-ins, the results our CA015 and CA037 policies recorded, the addresses
        outside the reviewed egress ranges, and a status: NoSignIns, NotEvaluated (no result from
        our policies yet), WouldBlock (a report-only failure, a block, or an address outside the
        ranges) or Clear. A ring is ready when every principal is Clear and the window is at least
        14 days (Design guidance). Same inputs, same file, byte for byte.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][AllowEmptyCollection()][object[]]$SignIns, [Parameter(Mandatory)][hashtable]$Scope, [Parameter(Mandatory)]$Repository, [Parameter(Mandatory)][datetime]$From, [Parameter(Mandatory)][datetime]$To)
    $prefixes = @($Repository.Policies | ForEach-Object { "$($_.Body['displayName'])-" })
    $ranges = @(Get-NpiWcaList $Scope 'egress', 'ranges')
    $days = [int][math]::Floor(($To.ToUniversalTime() - $From.ToUniversalTime()).TotalDays)
    $ringsOut = foreach ($ring in @($Scope['rings'] | Sort-Object { [int]$_['order'] })) {
        $principals = foreach ($e in @($Scope['inScope'] | Where-Object { $_['ring'] -eq $ring['name'] } | Sort-Object { $_['name'] })) {
            $mine = @($SignIns | Where-Object { $_['servicePrincipalId'] -eq $e['objectId'] })
            $results = [ordered]@{}
            foreach ($s in $mine) {
                foreach ($p in @($s['appliedConditionalAccessPolicies'])) {
                    if (-not $p) { continue }
                    $ours = @($prefixes | Where-Object { "$($p['displayName'])".StartsWith($_) }).Count
                    if (-not $ours) { continue }
                    $key = "$($p['displayName']): $($p['result'])"
                    $results[$key] = 1 + $(if ($results.Contains($key)) { $results[$key] } else { 0 })
                }
            }
            $sorted = [ordered]@{}; foreach ($k in @($results.Keys | Sort-Object)) { $sorted[$k] = $results[$k] }; $results = $sorted
            $outside = @($mine | Where-Object { -not (Test-NpiWcaIpInRange -Ip $_['ipAddress'] -Ranges $ranges) } | ForEach-Object { [string]$_['ipAddress'] } | Sort-Object -Unique)
            $blocked = @($mine | Where-Object { [int](Get-NpiWcaValue $_ 'status', 'errorCode') -eq $script:BlockedCode }).Count
            $wouldBlock = @($results.Keys | Where-Object { $_ -match ': (reportOnlyFailure|failure)$' }).Count
            $evaluated = @($results.Keys | Where-Object { $_ -match ': (reportOnly\w+|success|failure|notApplied)$' }).Count
            $status = if (-not $mine.Count) { 'NoSignIns' } elseif ($wouldBlock -or $blocked -or $outside.Count) { 'WouldBlock' } elseif (-not $evaluated) { 'NotEvaluated' } else { 'Clear' }
            [ordered]@{ name = $e['name']; objectId = $e['objectId']; signIns = $mine.Count; results = $results; outsideEgress = $outside; blocked = $blocked; status = $status }
        }
        $principals = @($principals)
        $ready = $days -ge $script:MinReportOnlyDays -and $principals.Count -gt 0 -and -not @($principals | Where-Object { $_.status -ne 'Clear' }).Count
        [ordered]@{ ring = $ring['name']; ready = $ready; principals = $principals }
    }
    $inIds = @($Scope['inScope'] | ForEach-Object { $_['objectId'] })
    [ordered]@{
        summaryVersion = 1; tenantId = $Scope['tenantId']; scopeSha256 = $Scope['_sha256']
        from = $From.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'); to = $To.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'); days = $days; minimumDays = $script:MinReportOnlyDays
        egressRanges = $ranges
        rings = @($ringsOut)
        otherServicePrincipalSignIns = @($SignIns | Where-Object { $inIds -notcontains $_['servicePrincipalId'] }).Count
    }
}

# ----------------------------------------------------------------------------- the alert definition

function New-NpiWcaAlertRule {
    <#
    .SYNOPSIS
        The block-event alert for security operations, rendered from the reviewed definition in
        workload-ca/alerts with the scope's service principal IDs. A definition for a reviewed
        deployment; this code doesn't write to Azure Monitor.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Repository, [Parameter(Mandatory)][hashtable]$Scope)
    $a = $Repository.Alerts | Select-Object -First 1
    if (-not $a) { throw 'No alert definition in workload-ca/alerts.' }
    $ids = (@($Scope['inScope'] | ForEach-Object { "`"$($_['objectId'])`"" } | Sort-Object) -join ', ')
    $b = $a.Text | ConvertFrom-Json -AsHashtable -Depth 30
    $b['query'] = $b['query'].Replace('{scope:inScope}', $ids)
    $b
}

# ----------------------------------------------------------------------------- the run

function Export-NpiWcaRun {
    <# Write a run's files and a manifest: task, mode, cloud, tenant, the permissions the task holds, every request, a SHA-256 per file. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][hashtable]$Files, [Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][string]$Task,
        [Parameter(Mandatory)][string]$Mode, [string]$TenantId, [object[]]$Evidence = @(), [hashtable]$Extra = @{})
    $OutputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $hashes = [ordered]@{}
    foreach ($name in ($Files.Keys | Sort-Object)) {
        $p = Join-Path $OutputPath $name
        Write-NpiJson -Path $p -Value $Files[$name]
        $hashes[$name] = Get-NpiFileHash -Path $p
    }
    $manifest = [ordered]@{
        task = $Task; mode = $Mode; cloud = $Cloud; tenantId = $TenantId; generated = [DateTime]::UtcNow.ToString('o')
        graphPermissions = (Get-NpiWcaRequiredPermission -Task $Task).GraphPermissions
        requests = @($Evidence | ForEach-Object { [ordered]@{ call = $_.Call; method = $_.Method; target = $_.Target; at = $_.At } })
        files = $hashes
    }
    foreach ($k in $Extra.Keys) { $manifest[$k] = $Extra[$k] }
    Write-NpiJson -Path (Join-Path $OutputPath 'manifest.json') -Value $manifest
    Get-Item -LiteralPath (Join-Path $OutputPath 'manifest.json')
}

Export-ModuleMember -Function Get-NpiWcaCallList, Get-NpiWcaCall, Get-NpiWcaRequiredPermission, New-NpiWcaClient, Resolve-NpiWcaRequest, Invoke-NpiWcaGet,
    New-NpiWcaFixtureInvoker, Invoke-NpiWcaFake, Read-NpiWcaScope, Read-NpiWcaRepository, Read-NpiWcaLearnSample, ConvertTo-NpiWcaCidr, Test-NpiWcaIpInRange,
    Test-NpiWcaPolicyBody, Test-NpiWcaRepository, Test-NpiWcaTenantScope, Get-NpiWcaEnforcement, Get-NpiWcaDesiredLocation, Get-NpiWcaDesiredPolicy,
    Compare-NpiWcaValue, Get-NpiWcaTenant, Get-NpiWcaPlan, Invoke-NpiWcaPlan, Get-NpiWcaSignIn, Get-NpiWcaSignInSummary, New-NpiWcaAlertRule, Export-NpiWcaRun
