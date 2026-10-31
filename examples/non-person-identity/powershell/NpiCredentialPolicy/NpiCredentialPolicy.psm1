#Requires -Version 7.1
<#
    NpiCredentialPolicy: Chapter 04 of the developer workbook "Building Non-Person Identity".

    The tenant's app management policy as reviewed data (config/app-management-policy.json):
    new client secrets and symmetric keys blocked and certificates capped at 180 days for apps
    created after the effective date, exceptions as app management policies with a record and an
    end date, and the app instance property lock on every app registration the register lists.
    The tenant is read, compared with the file, and the difference written as a plan that never
    weakens or drops a restriction. Then certificate rotation in Key Vault: credentials near
    expiry found from Chapter 01's register and a fresh read, a request raised before expiry, the
    owner's approval, the new certificate created in Key Vault and added beside the old one, the
    owner's verification, and the old one removed only after the overlap.

    Reads go through a reader for the app-policy or rotation task; writes only through
    Invoke-NpiCredentialPlan with -Apply and an approved plan hash, through a writer whose calls
    are declared for policy-apply or rotation-apply in config/calls-ch04.json. Nothing here
    deletes: a DELETE is never built, and an expired exception or an unreviewed policy is a
    finding for a person.

    Illustrative: tested against fixtures and fakes, not against a production tenant or vault.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot '../NpiCore/NpiCore.psm1') -Force -Global

$script:ConfigRoot = Join-Path $PSScriptRoot '../../config'
$script:VaultSuffix = @{ global = 'vault.azure.net'; gcc = 'vault.azure.net'; gcchigh = 'vault.usgovcloudapi.net'; dod = 'vault.usgovcloudapi.net' }
$script:VaultResource = @{ global = 'https://vault.azure.net'; gcc = 'https://vault.azure.net'; gcchigh = 'https://vault.usgovcloudapi.net'; dod = 'https://vault.usgovcloudapi.net' }
$script:Guid = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
# Learn, v1.0: the restriction types each collection takes. Beta adds more (trustedCertificateAuthority, audiences, redirect URI rules).
$script:V1Types = @{
    passwordCredentials = @('passwordAddition', 'passwordLifetime', 'symmetricKeyAddition', 'symmetricKeyLifetime', 'customPasswordAddition')
    keyCredentials      = @('asymmetricKeyLifetime')
}
$script:LifetimeTypes = @('passwordLifetime', 'symmetricKeyLifetime', 'asymmetricKeyLifetime')

# ----------------------------------------------------------------------------- small helpers

function ConvertTo-NpiUtc {
    param($Value)
    if ($null -eq $Value -or "$Value" -eq '') { return $null }
    if ($Value -is [datetime]) { return $Value.ToUniversalTime() }
    [datetime]::Parse("$Value", [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal)
}

function ConvertFrom-NpiIsoDuration {
    <#
    .SYNOPSIS
        Converts an ISO 8601 duration in days and time only (such as P180D or P4DT12H30M5S)
        to a TimeSpan. Throws for years or months, whose length varies.
    .EXAMPLE
        # A TimeSpan of 180 days: the certificate lifetime cap.
        ConvertFrom-NpiIsoDuration -Duration 'P180D'
    #>

    <# An ISO 8601 duration in days and time only (P180D, P4DT12H30M5S). Years and months are refused: their length varies. #>
    param([Parameter(Mandatory)][string]$Duration)
    if ($Duration -notmatch '^P(?!$)(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$') { throw "Unsupported duration '$Duration': use days and time only, such as P180D." }
    [Xml.XmlConvert]::ToTimeSpan($Duration)
}

function Format-NpiDate {
    <#
    .SYNOPSIS
        Formats a date or date string as ISO 8601 UTC (yyyy-MM-ddTHH:mm:ssZ), or as yyyy-MM-dd
        with -DateOnly. Returns an empty string for an empty value.
    .EXAMPLE
        # Returns 2026-10-30.
        Format-NpiDate -Value '2026-10-30T00:00:00Z' -DateOnly
    #>

    # A date for people and plans: ConvertFrom-Json turns ISO strings into DateTime, so print them back the same way.
    param($Value, [switch]$DateOnly)
    if ($null -eq $Value -or "$Value" -eq '') { return '' }
    $d = ConvertTo-NpiUtc $Value
    if ($DateOnly) { $d.ToString('yyyy-MM-dd') } else { $d.ToString('yyyy-MM-ddTHH:mm:ssZ') }
}

function ConvertTo-NpiSortedNode {
    <#
    .SYNOPSIS
        Returns a copy of a value with the keys of every dictionary and object sorted (as
        ordered hashtables) and dates as ISO 8601 UTC strings, so its JSON is the same on every run.
    .EXAMPLE
        $config = Get-Content -LiteralPath config/app-management-policy.json -Raw | ConvertFrom-Json -AsHashtable
        ConvertTo-NpiSortedNode -Value $config | ConvertTo-Json -Depth 20
    #>

    <# The same data with keys sorted at every level and dates as ISO strings, so the JSON is the same on every run. #>
    param($Value)
    $v = $Value
    if ($null -eq $v) { return $null }
    if ($v -is [Collections.IDictionary]) {
        $o = [ordered]@{}; foreach ($k in (@($v.Keys) | ForEach-Object { "$_" } | Sort-Object -CaseSensitive)) { $o[$k] = ConvertTo-NpiSortedNode $v[$k] }; return $o
    }
    if ($v -is [Management.Automation.PSCustomObject]) {
        $o = [ordered]@{}; foreach ($k in ($v.PSObject.Properties.Name | Sort-Object -CaseSensitive)) { $o[$k] = ConvertTo-NpiSortedNode $v.$k }; return $o
    }
    if ($v -is [string]) { return $v }
    if ($v -is [datetime]) { return $v.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ') }
    if ($v -is [Collections.IEnumerable]) { return , @(@($v) | ForEach-Object { ConvertTo-NpiSortedNode $_ }) }
    $v
}

function ConvertTo-NpiCanonicalJson {
    <#
    .SYNOPSIS
        Returns compact JSON for a value, with keys sorted at every level and dates as ISO
        strings, so two reads of the same object give the same text and the same hash.
    .EXAMPLE
        # Returns {"displayName":"Default","isEnabled":true} whatever the key order.
        ConvertTo-NpiCanonicalJson -Value @{ isEnabled = $true; displayName = 'Default' }
    #>

    <# Compact JSON with keys sorted at every level, so two reads of the same object hash the same. #>
    param($Value)
    ConvertTo-Json -InputObject (ConvertTo-NpiSortedNode $Value) -Depth 30 -Compress
}

function Write-NpiSortedJson {
    <#
    .SYNOPSIS
        Writes a value to a JSON file whose bytes depend only on its data: keys sorted, dates
        as ISO strings, LF line endings, UTF-8 without a BOM. Returns nothing.
    .EXAMPLE
        # $out comes from New-NpiPolicyPlan.
        Write-NpiSortedJson -Path out/policy/policy-plan.json -Value $out.Plan
    #>

    <# A file whose bytes depend only on its data: keys sorted, dates as ISO strings, LF, no BOM. #>
    param([string]$Path, $Value)
    $json = (ConvertTo-Json -InputObject (ConvertTo-NpiSortedNode $Value) -Depth 30) -replace "`r`n", "`n"
    [IO.File]::WriteAllText($Path, $json + "`n", [Text.UTF8Encoding]::new($false))
}

function Get-NpiTextSha256 {
    param([string]$Text)
    $b = [Text.Encoding]::UTF8.GetBytes($Text)
    ([Security.Cryptography.SHA256]::HashData($b) | ForEach-Object { $_.ToString('x2') }) -join ''
}

function ConvertTo-NpiHashtable {
    # A deep copy as hashtables and arrays, whatever the input (pscustomobject from a plan file, or hashtable).
    param($Value)
    if ($null -eq $Value) { return $null }
    (ConvertTo-Json -InputObject $Value -Depth 30 -Compress) | ConvertFrom-Json -AsHashtable -Depth 30
}

function ConvertFrom-NpiX5t {
    <#
    .SYNOPSIS
        Converts Key Vault's x5t value (the base64url SHA-1 thumbprint of a certificate) to an
        upper-case hex thumbprint. Returns $null for an empty value.
    .EXAMPLE
        $fake = New-NpiCh04FixtureInvoker -Path tests/fixtures/ch04/tenant.json
        $kv = & $fake.Invoke 'GET' 'https://kv-npi-contoso.vault.azure.net/certificates/vendor-portal?api-version=2025-07-01' $null $null
        ConvertFrom-NpiX5t -X5t $kv.x5t
    #>

    <# Key Vault's x5t (base64url SHA-1 thumbprint) as upper-case hex. #>
    param([string]$X5t)
    if (-not $X5t) { return $null }
    $s = $X5t.Replace('-', '+').Replace('_', '/'); while ($s.Length % 4) { $s += '=' }
    ([Convert]::FromBase64String($s) | ForEach-Object { $_.ToString('X2') }) -join ''
}

function ConvertFrom-NpiCustomKeyIdentifier {
    <#
    .SYNOPSIS
        Converts Graph's customKeyIdentifier on a keyCredential (base64 of the thumbprint
        bytes) to an upper-case hex thumbprint. Returns $null if the value is empty or isn't base64.
    .EXAMPLE
        $fake = New-NpiCh04FixtureInvoker -Path tests/fixtures/ch04/tenant.json
        $app = & $fake.Invoke 'GET' 'https://graph.microsoft.com/v1.0/applications/0a000000-0000-4000-8000-000000000007?$select=keyCredentials' $null $null
        $app.keyCredentials | ForEach-Object { ConvertFrom-NpiCustomKeyIdentifier -Value $_.customKeyIdentifier }
    #>

    <# Graph's customKeyIdentifier (base64 of the thumbprint bytes) as upper-case hex (Design guidance; research gaps, row 36). #>
    param([string]$Value)
    if (-not $Value) { return $null }
    try { ([Convert]::FromBase64String($Value) | ForEach-Object { $_.ToString('X2') }) -join '' } catch { $null }
}

# ----------------------------------------------------------------------------- the call list

function Get-NpiCh04CallList {
    <#
    .SYNOPSIS
        Reads the Chapter 04 call list (config/calls-ch04.json unless -Path is given) and
        returns it as a hashtable of tasks and calls.
    .EXAMPLE
        (Get-NpiCh04CallList).calls | ForEach-Object { '{0} {1}' -f $_.method, $_.id }
    #>
    [CmdletBinding()]
    param([string]$Path = (Join-Path $script:ConfigRoot 'calls-ch04.json'))
    Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
}

function Get-NpiCh04Task {
    <#
    .SYNOPSIS
        Returns one Chapter 04 task's declaration from the call list (app-policy, policy-apply,
        rotation or rotation-apply), including its mode. Throws for an unknown task.
    .EXAMPLE
        # 'read' or 'write'.
        (Get-NpiCh04Task -Task rotation).mode
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Task)
    $t = (Get-NpiCh04CallList).tasks
    if (-not $t.ContainsKey($Task)) { throw "Unknown task '$Task'." }
    $t[$Task]
}

function Get-NpiCh04Call {
    <#
    .SYNOPSIS
        Returns the declared Chapter 04 calls as an array, narrowed to one task with -Task and
        to one call with -Id.
    .EXAMPLE
        Get-NpiCh04Call -Task policy-apply | ForEach-Object { '{0} {1}' -f $_.method, $_.path }
    #>
    [CmdletBinding()]
    param([string]$Task, [string]$Id)
    $calls = @((Get-NpiCh04CallList).calls)
    if ($Task) { $calls = @($calls | Where-Object { $_.tasks -contains $Task }) }
    if ($Id) { $calls = @($calls | Where-Object { $_.id -eq $Id }) }
    , $calls
}

function Get-NpiCh04RequiredPermission {
    <#
    .SYNOPSIS
        Returns what a Chapter 04 task needs: the union of its calls' Graph permissions, Azure
        roles (Resource Manager and Key Vault data plane), AD rights and methods, with the task's mode
        and delegated role.
    .EXAMPLE
        Get-NpiCh04RequiredPermission -Task rotation-apply
    #>

    <# The union of a task's calls: Graph permissions and Azure roles (Resource Manager and Key Vault data plane). #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Task)
    $decl = Get-NpiCh04Task -Task $Task
    $calls = Get-NpiCh04Call -Task $Task
    [pscustomobject]@{
        Task             = $Task
        Mode             = $decl.mode
        GraphPermissions = @($calls | Where-Object api -EQ 'graph' | ForEach-Object { $_.permissions } | Sort-Object -Unique)
        AzureRoles       = @($calls | Where-Object { $_.api -in 'arm', 'keyvault' } | ForEach-Object { $_.azureRole } | Sort-Object -Unique)
        AdRights         = @($calls | Where-Object api -EQ 'ad' | ForEach-Object { $_.adRight } | Sort-Object -Unique)
        Methods          = @($calls | ForEach-Object { $_.method } | Sort-Object -Unique)
        DelegatedRole    = if ($decl.ContainsKey('delegatedRole')) { $decl.delegatedRole } else { $null }
    }
}

function Get-NpiVaultHost {
    <#
    .SYNOPSIS
        Returns the Key Vault data-plane URL for a vault in a cloud: https://<vault>.vault.azure.net
        for commercial and GCC, .vault.usgovcloudapi.net for Azure Government. Throws for an unknown
        cloud or a name that isn't a key vault name.
    .EXAMPLE
        # Returns https://kv-npi-contoso.vault.azure.net
        Get-NpiVaultHost -Cloud gcc -Vault 'kv-npi-contoso'
    #>

    <# https://<vault>.vault.azure.net (commercial, and GCC's commercial Azure) or .vault.usgovcloudapi.net (Azure Government). #>
    param([Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][string]$Vault)
    $null = Get-NpiCloud -Cloud $Cloud
    if ($Vault -notmatch '^[a-zA-Z][a-zA-Z0-9-]{1,22}[a-zA-Z0-9]$') { throw "'$Vault' isn't a key vault name." }
    "https://$Vault.$($script:VaultSuffix[$Cloud])"
}

# ----------------------------------------------------------------------------- the client (reader or writer)

function New-NpiCh04Client {
    <#
    .SYNOPSIS
        A client for one Chapter 04 task in one cloud. A read task's client sends only its declared
        GETs; a write task's client is the only object that can send this chapter's PATCHes and
        POSTs, and only through Invoke-NpiCredentialPlan. -Invoke is { param($Method, $Uri, $Body, $Headers) }.
    .EXAMPLE
        # A reader for the app-policy task, against the fake tenant.
        $register = Import-NpiCh04Register -RunPath out/inventory
        $fake = New-NpiCh04FixtureInvoker -Path tests/fixtures/ch04/tenant.json
        $reader = New-NpiCh04Client -Cloud gcc -Task app-policy -Invoke $fake.Invoke -TenantId $register.Manifest.tenantId
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][string]$Task, [Parameter(Mandatory)][scriptblock]$Invoke, [string]$TenantId)
    $decl = Get-NpiCh04Task -Task $Task
    [pscustomobject]@{
        Cloud    = Get-NpiCloud -Cloud $Cloud
        Task     = $Task
        Mode     = $decl.mode
        TenantId = $TenantId
        Calls    = Get-NpiCh04Call -Task $Task
        Invoke   = $Invoke
        Evidence = [Collections.Generic.List[object]]::new()
    }
}

function Resolve-NpiCh04Uri {
    <#
    .SYNOPSIS
        Builds the request URL for a declared Chapter 04 call: binds the path placeholders, adds
        the query, and uses the cloud's Graph host or the vault's host. Returns the call, the URI and
        the host; throws for an undeclared call or an unbound placeholder.
    .EXAMPLE
        $fake = New-NpiCh04FixtureInvoker -Path tests/fixtures/ch04/tenant.json
        $reader = New-NpiCh04Client -Cloud gcc -Task rotation -Invoke $fake.Invoke
        (Resolve-NpiCh04Uri -Client $reader -CallId 'kv-ch04-certificate-get' -Bind @{ name = 'vendor-portal' } -Vault 'kv-npi-contoso').Uri
    #>
    param($Client, [string]$CallId, [hashtable]$Bind = @{}, [string]$Query, [string]$Vault)
    $call = $Client.Calls | Where-Object { $_.id -eq $CallId }
    if (-not $call) { throw "Undeclared call '$CallId' for task '$($Client.Task)'; add it to config/calls-ch04.json with its permission." }
    $path = $call.path
    foreach ($k in $Bind.Keys) { $path = $path.Replace("{$k}", [Uri]::EscapeDataString([string]$Bind[$k])) }
    if ($path -match '\{[A-Za-z]+\}') { throw "Unbound placeholder in $path" }
    switch ($call.api) {
        'graph' { $hostName = $Client.Cloud.Graph; $uri = "$hostName/$($call.version)$path"; if ($Query) { $uri += "?$Query" } }
        'keyvault' {
            if (-not $Vault) { throw "'$CallId' needs -Vault." }
            $hostName = Get-NpiVaultHost -Cloud $Client.Cloud.Name -Vault $Vault
            $uri = "$hostName$path`?api-version=$($call.apiVersion)"; if ($Query) { $uri += "&$Query" }
        }
        default { throw "'$CallId' has api '$($call.api)', which this chapter doesn't call." }
    }
    [pscustomobject]@{ Call = $call; Uri = $uri; Host = $hostName }
}

function Invoke-NpiCh04Get {
    <#
    .SYNOPSIS
        GET a declared call and follow @odata.nextLink pages on the same host. Returns the items of
        a collection, or the object itself. Every request is recorded in the client's evidence.
    .EXAMPLE
        # The tenant default app management policy, as one object.
        Invoke-NpiCh04Get -Client $reader -CallId 'graph-ch04-default-policy-get' -Single
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client, [Parameter(Mandatory)][string]$CallId, [hashtable]$Bind = @{}, [string]$Query, [string]$Vault, [hashtable]$Headers, [switch]$Single)
    $r = Resolve-NpiCh04Uri -Client $Client -CallId $CallId -Bind $Bind -Query $Query -Vault $Vault
    if ($r.Call.method -ne 'GET') { throw "Refusing $($r.Call.method) for '$CallId' in a read." }
    $uri = $r.Uri; $items = [Collections.Generic.List[object]]::new()
    while ($uri) {
        Assert-NpiHost -Uri $uri -ExpectedHost $r.Host
        $Client.Evidence.Add([pscustomobject]@{ Call = $CallId; Method = 'GET'; Target = $uri; At = [DateTime]::UtcNow.ToString('o') })
        $body = & $Client.Invoke 'GET' $uri $null $Headers
        if ($null -eq $body) { throw "No response for $uri" }
        if ($Single -or -not $body.ContainsKey('value')) { return $body }
        foreach ($v in @($body['value'])) { if ($null -ne $v) { $items.Add($v) } }
        $uri = if ($body.ContainsKey('@odata.nextLink')) { $body['@odata.nextLink'] } else { $null }
    }
    $items.ToArray()
}

# ----------------------------------------------------------------------------- live invoker

function New-NpiCh04LiveInvoker {
    <#
    .SYNOPSIS
        Graph through Invoke-MgGraphRequest; Key Vault's data plane through Invoke-AzRestMethod
        with -ResourceId set to the vault audience of this cloud (research gaps, row 38). Refuses to
        start if either session is in another cloud or tenant. -AllowWrite for the writer only.
    .EXAMPLE
        # After Connect-MgGraph to the GCC tenant; -SkipAzure because the policy task makes no Key Vault calls.
        $invoke = New-NpiCh04LiveInvoker -Cloud gcc -TenantId $register.Manifest.tenantId -SkipAzure
        $reader = New-NpiCh04Client -Cloud gcc -Task app-policy -Invoke $invoke -TenantId $register.Manifest.tenantId
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][string]$TenantId, [switch]$SkipAzure, [switch]$AllowWrite)
    $c = Get-NpiCloud -Cloud $Cloud
    $mg = Get-MgContext
    if (-not $mg) { throw 'Not signed in to Microsoft Graph.' }
    if ($mg.Environment -ne $c.GraphEnvironment) { throw "Graph session is in '$($mg.Environment)', not '$($c.GraphEnvironment)'." }
    if ($mg.TenantId -ne $TenantId) { throw "Graph session is signed in to tenant '$($mg.TenantId)', not '$TenantId'." }
    if (-not $SkipAzure) {
        $az = Get-AzContext
        if (-not $az) { throw 'Not signed in to Azure.' }
        if ($az.Environment.Name -ne $c.AzureEnvironment) { throw "Azure session is in '$($az.Environment.Name)', not '$($c.AzureEnvironment)'." }
        if ($az.Tenant.Id -ne $TenantId) { throw "Azure session is signed in to tenant '$($az.Tenant.Id)', not '$TenantId'." }
    }
    $graph = $c.Graph; $vaultSuffix = $script:VaultSuffix[$Cloud]; $vaultResource = $script:VaultResource[$Cloud]; $write = [bool]$AllowWrite
    {
        param($Method, $Uri, $Body, $Headers)
        if ($Method -notin 'GET', 'PATCH', 'POST') { throw "Refusing $Method" }
        if ($Method -ne 'GET' -and -not $write) { throw "Refusing $Method" }
        $json = if ($null -ne $Body) { ConvertTo-Json -InputObject $Body -Depth 30 -Compress } else { $null }
        if ($Uri.StartsWith("$graph/")) {
            $p = @{ Method = $Method; Uri = $Uri; OutputType = 'Hashtable' }
            if ($Headers) { $p.Headers = $Headers }
            if ($json) { $p.Body = $json; $p.ContentType = 'application/json' }
            $resp = Invoke-MgGraphRequest @p
            if ($null -eq $resp) { @{} } else { $resp }
        } elseif (([Uri]$Uri).Host.EndsWith(".$vaultSuffix")) {
            $p = @{ Method = $Method; Uri = $Uri; ResourceId = $vaultResource }
            if ($json) { $p.Payload = $json }
            $resp = Invoke-AzRestMethod @p
            if ($resp.StatusCode -ge 400) { throw "Key Vault returned $($resp.StatusCode) for $Uri" }
            if ($resp.Content) { $resp.Content | ConvertFrom-Json -AsHashtable -Depth 50 } else { @{} }
        } else { throw "Refusing host of $Uri" }
    }.GetNewClosure()
}

# ----------------------------------------------------------------------------- the fake

function New-NpiCh04FixtureInvoker {
    <#
    .SYNOPSIS
        A fake Microsoft Graph (the app management policy routes, applications, owners, users) and a
        fake Key Vault data plane, served from tests/fixtures/ch04/tenant.json and the shared estate.
        GET only unless -AllowWrite. It evaluates the restriction types Learn lists for v1.0 (beta
        adds more), replaces a restriction collection as a PATCH does, enforces one app management
        policy per app and the certificate lifetime cap on a new keyCredential, and completes a Key
        Vault create on the first poll. Every call is recorded in .Calls; writes change .Tenant.
    .EXAMPLE
        $fake = New-NpiCh04FixtureInvoker -Path tests/fixtures/ch04/tenant.json -Cloud gcc
        $reader = New-NpiCh04Client -Cloud gcc -Task app-policy -Invoke $fake.Invoke
        $fake.Calls | Select-Object Method, Uri
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [string]$Cloud = 'gcc', [int]$PageSize = 2, [switch]$AllowWrite)
    $Path = (Resolve-Path -LiteralPath $Path).Path
    $t = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 50
    $estatePath = Join-Path (Split-Path $Path -Parent) $t.estate
    $e = Get-Content -LiteralPath $estatePath -Raw | ConvertFrom-Json -AsHashtable -Depth 50
    $c = Get-NpiCloud -Cloud $Cloud
    $state = [pscustomobject]@{
        Tenant = $t; Estate = $e; Calls = [Collections.Generic.List[object]]::new(); PageSize = $PageSize; Graph = $c.Graph
        VaultSuffix = $script:VaultSuffix[$Cloud]; AllowWrite = [bool]$AllowWrite; AsOf = (ConvertTo-NpiUtc $t.asOf); Counter = 0; Invoke = $null
    }
    $s = $state
    $state.Invoke = { param($Method, $Uri, $Body, $Headers) Invoke-NpiCh04Fake -State $s -Method $Method -Uri $Uri -Body $Body -Headers $Headers }.GetNewClosure()
    $state
}

function Test-NpiFakeRestriction {
    # Throws 400 as Graph would for a restriction the version doesn't know, a repeated type or a missing lifetime.
    param([string]$Collection, [object[]]$Items, [string]$Version)
    $known = if ($Version -eq 'beta') { @{ passwordCredentials = $script:V1Types.passwordCredentials; keyCredentials = @($script:V1Types.keyCredentials) + 'trustedCertificateAuthority' } } else { $script:V1Types }
    if (-not $known.ContainsKey($Collection)) { return }
    $seen = @{}
    foreach ($r in @($Items)) {
        if ($null -eq $r) { continue }
        $type = $r['restrictionType']
        if ($type -notin $known[$Collection]) { throw "400 Bad Request: '$type' isn't a $Collection restriction type in $Version" }
        if ($seen.ContainsKey($type)) { throw "400 Bad Request: each restrictionType can be used only once per policy ($type)" }
        $seen[$type] = $true
        if ($type -in $script:LifetimeTypes) {
            if (-not $r['maxLifetime']) { throw "400 Bad Request: maxLifetime is required for $type" }
            $null = ConvertFrom-NpiIsoDuration $r['maxLifetime']
        }
        if ($r.ContainsKey('state') -and $null -ne $r['state'] -and $r['state'] -notin 'enabled', 'disabled', $(if ($Version -eq 'beta') { 'audit' })) { throw "400 Bad Request: state '$($r['state'])'" }
    }
}

function Get-NpiFakeEffectiveCertCap {
    # The asymmetricKeyLifetime restriction that applies to an app: its own policy's, else the tenant default's (if enabled).
    param($State, [string]$AppId)
    $app = $State.Tenant.applications[$AppId]
    $created = ConvertTo-NpiUtc $app.createdDateTime
    $own = @($State.Tenant.appManagementPolicies | Where-Object { $_.isEnabled -and @($_.appliesTo) -contains $AppId })
    $r = $null
    if ($own.Count) { $r = @($own[0].restrictions.keyCredentials | Where-Object { $_ -and $_.restrictionType -eq 'asymmetricKeyLifetime' }) | Select-Object -First 1 }
    if (-not $r -and $State.Tenant.defaultAppManagementPolicy.isEnabled) {
        $r = @($State.Tenant.defaultAppManagementPolicy.applicationRestrictions.keyCredentials | Where-Object { $_ -and $_.restrictionType -eq 'asymmetricKeyLifetime' }) | Select-Object -First 1
    }
    if (-not $r) { return $null }
    if ($r.ContainsKey('state') -and $r['state'] -eq 'disabled') { return $null }
    $after = ConvertTo-NpiUtc $r['restrictForAppsCreatedAfterDateTime']
    if ($after -and $created -and $created -le $after) { return $null }
    ConvertFrom-NpiIsoDuration $r['maxLifetime']
}

function ConvertFrom-NpiFakeCert {
    <#
    .SYNOPSIS
        Decodes a test certificate blob made by New-NpiFakeCertBlob and returns its thumbprint,
        validity dates and subject. Throws if the blob isn't one. Used by the fake only.
    .EXAMPLE
        $blob = New-NpiFakeCertBlob -Thumbprint ('AB' * 20) -Nbf ([datetime]'2026-10-30Z').ToUniversalTime() -Exp ([datetime]'2027-04-28Z').ToUniversalTime() -Subject 'CN=deploy-bot'
        ConvertFrom-NpiFakeCert -Blob $blob
    #>

    # The fixtures' fake certificate: base64 of "NPI-FAKE-CERT;thumbprint=..;nbf=..;exp=..;subject=..".
    param([string]$Blob)
    $text = try { [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($Blob)) } catch { '' }
    if ($text -notmatch '^NPI-FAKE-CERT;') { throw '400 Bad Request: the key is not a certificate the fake can read' }
    $h = @{}; foreach ($part in $text.Split(';') | Select-Object -Skip 1) { $kv = $part.Split('=', 2); $h[$kv[0]] = $kv[1] }
    [pscustomobject]@{ Thumbprint = $h.thumbprint; Nbf = (ConvertTo-NpiUtc $h.nbf); Exp = (ConvertTo-NpiUtc $h.exp); Subject = $h.subject }
}

function New-NpiFakeCertBlob {
    <#
    .SYNOPSIS
        Builds a test certificate blob, the base64 text the fake Graph and Key Vault accept as a
        certificate key, from a thumbprint, validity dates and subject. Not a real certificate.
    .EXAMPLE
        # A 180-day certificate for the fake, to test the lifetime cap.
        New-NpiFakeCertBlob -Thumbprint ('AB' * 20) -Nbf ([datetime]'2026-10-30Z').ToUniversalTime() -Exp ([datetime]'2027-04-28Z').ToUniversalTime() -Subject 'CN=deploy-bot'
    #>
    param([string]$Thumbprint, [datetime]$Nbf, [datetime]$Exp, [string]$Subject)
    [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("NPI-FAKE-CERT;thumbprint=$Thumbprint;nbf=$($Nbf.ToString('yyyy-MM-ddTHH:mm:ssZ'));exp=$($Exp.ToString('yyyy-MM-ddTHH:mm:ssZ'));subject=$Subject"))
}

function ConvertTo-NpiFakeKvCertificate {
    param([string]$Base, [string]$Name, $Cert)
    $v = @($Cert.versions)[-1]
    @{
        id = "$Base/certificates/$Name/$($v.version)"; x5t = $v.x5t; cer = $v.cer
        attributes = @{ enabled = $true; nbf = ([DateTimeOffset](ConvertTo-NpiUtc $v.nbf)).ToUnixTimeSeconds(); exp = ([DateTimeOffset](ConvertTo-NpiUtc $v.exp)).ToUnixTimeSeconds() }
        policy = (ConvertTo-NpiHashtable $Cert.policy)
    }
}

function Invoke-NpiCh04Fake {
    <#
    .SYNOPSIS
        The request handler behind New-NpiCh04FixtureInvoker: answers one request from the fake
        Graph and Key Vault state, records it in State.Calls, and throws as the service would for a
        request it refuses. Normally called through the invoker's .Invoke script block.
    .EXAMPLE
        $fake = New-NpiCh04FixtureInvoker -Path tests/fixtures/ch04/tenant.json
        Invoke-NpiCh04Fake -State $fake -Method GET -Uri 'https://graph.microsoft.com/v1.0/policies/defaultAppManagementPolicy'
    #>
    param($State, [string]$Method, [string]$Uri, $Body, $Headers)
    $State.Calls.Add([pscustomobject]@{ Method = $Method; Uri = $Uri; Body = (ConvertTo-NpiHashtable $Body); Headers = $Headers })
    if ($Method -eq 'DELETE') { throw 'The fake refuses DELETE' }
    $u = [Uri]$Uri
    $path = [Uri]::UnescapeDataString($u.AbsolutePath)
    $q = @{}; foreach ($pair in $u.Query.TrimStart('?').Split('&', [StringSplitOptions]::RemoveEmptyEntries)) { $kv = $pair.Split('=', 2); $q[[Uri]::UnescapeDataString($kv[0])] = if ($kv.Count -gt 1) { [Uri]::UnescapeDataString($kv[1]) } else { '' } }
    $base = "$($u.Scheme)://$($u.Host)"
    $t = $State.Tenant; $g = $State.Estate.graph
    if ($Method -ne 'GET' -and -not $State.AllowWrite) { throw "The fake refuses $Method" }
    $b = if ($null -ne $Body) { ConvertTo-NpiHashtable $Body } else { $null }

    if ($base -eq $State.Graph) {
        if ($path -notmatch '^/(v1\.0|beta)(/.*)$') { throw "The fake has no Graph route for $path" }
        $ver = $Matches[1]; $p = $Matches[2]
        switch -Regex ($p) {
            '^/policies/defaultAppManagementPolicy$' {
                if ($Method -eq 'GET') { return (ConvertTo-NpiHashtable $t.defaultAppManagementPolicy) }
                if ($Method -ne 'PATCH') { break }
                foreach ($scope in 'applicationRestrictions', 'servicePrincipalRestrictions') {
                    if (-not $b.ContainsKey($scope)) { continue }
                    foreach ($col in @($b[$scope].Keys)) { Test-NpiFakeRestriction -Collection $col -Items @($b[$scope][$col]) -Version $ver }
                }
                foreach ($k in $b.Keys) {
                    if ($k -in 'applicationRestrictions', 'servicePrincipalRestrictions') {
                        if (-not $t.defaultAppManagementPolicy[$k]) { $t.defaultAppManagementPolicy[$k] = @{} }
                        # A PATCH keeps properties it doesn't name; a collection it names is replaced whole.
                        foreach ($col in $b[$k].Keys) { $t.defaultAppManagementPolicy[$k][$col] = @($b[$k][$col] | Where-Object { $null -ne $_ }) }
                    } elseif ($k -in 'isEnabled', 'displayName', 'description') { $t.defaultAppManagementPolicy[$k] = $b[$k] }
                }
                return @{}
            }
            '^/policies/appManagementPolicies$' {
                if ($Method -eq 'GET') {
                    $rows = @($t.appManagementPolicies | ForEach-Object { $x = ConvertTo-NpiHashtable $_; $x.Remove('appliesTo'); $x })
                    # Pages of PageSize, with a next link on the same host, as Graph pages a collection.
                    $skip = if ($q.ContainsKey('$skiptoken')) { [int]$q['$skiptoken'] } else { 0 }
                    $resp = @{ value = @($rows | Select-Object -Skip $skip -First $State.PageSize) }
                    if ($skip + $State.PageSize -lt $rows.Count) { $resp['@odata.nextLink'] = "$base$($u.AbsolutePath)?`$skiptoken=$($skip + $State.PageSize)" }
                    return $resp
                }
                if ($Method -ne 'POST') { break }
                if (-not $b['displayName'] -or -not $b['description']) { throw '400 Bad Request: displayName and description are required' }
                foreach ($col in 'passwordCredentials', 'keyCredentials') { if ($b['restrictions'] -and $b['restrictions'].ContainsKey($col)) { Test-NpiFakeRestriction -Collection $col -Items @($b['restrictions'][$col]) -Version $ver } }
                $State.Counter++
                $new = @{ id = ('7e000000-0000-4000-8000-{0:d12}' -f (100 + $State.Counter)); displayName = $b.displayName; description = $b.description; isEnabled = [bool]$b['isEnabled']; restrictions = $b['restrictions']; appliesTo = @() }
                $t.appManagementPolicies = @($t.appManagementPolicies) + @($new)
                $out = ConvertTo-NpiHashtable $new; $out.Remove('appliesTo'); return $out
            }
            '^/policies/appManagementPolicies/([^/]+)/appliesTo$' {
                $id = $Matches[1]; $pol = @($t.appManagementPolicies | Where-Object { $_.id -eq $id })
                if ($pol.Count -ne 1) { throw "404 appManagementPolicy $id" }
                return @{ value = @(@($pol[0].appliesTo) | Where-Object { $_ } | ForEach-Object { @{ '@odata.type' = '#microsoft.graph.application'; id = $_; displayName = $t.applications[$_].displayName } }) }
            }
            '^/(applications|servicePrincipals)/([^/]+)/appManagementPolicies/\$ref$' {
                if ($Method -ne 'POST') { break }
                $target = $Matches[2]
                if ("$($b['@odata.id'])" -notmatch "^$([regex]::Escape($State.Graph))/(v1\.0|beta)/policies/appManagementPolicies/($script:Guid)$") { throw "400 Bad Request: @odata.id must reference an appManagementPolicy, not '$($b['@odata.id'])'" }
                $pid2 = $Matches[2]
                $pol = @($t.appManagementPolicies | Where-Object { $_.id -eq $pid2 })
                if ($pol.Count -ne 1) { throw "404 appManagementPolicy $pid2" }
                if ($target -notmatch "^$script:Guid$") { throw "404 object $target" }
                if (@($t.appManagementPolicies | Where-Object { @($_.appliesTo) -contains $target }).Count) { throw '400 Bad Request: this application already has an app management policy assigned' }
                $pol[0].appliesTo = @($pol[0].appliesTo) + @($target)
                return @{}
            }
            '^/applications/([^/]+)/owners$' {
                $id = $Matches[1]
                return @{ value = @($(if ($g.applicationOwners.ContainsKey($id)) { $g.applicationOwners[$id] })) }
            }
            '^/users/([^/]+)$' {
                $key = $Matches[1]
                $user = @($g.users | Where-Object { $_.id -eq $key -or $_.userPrincipalName -eq $key })
                if ($user.Count -ne 1) { throw "404 user $key" }
                return $user[0]
            }
            '^/applications/([^/]+)$' {
                $id = $Matches[1]
                if (-not $t.applications.ContainsKey($id)) { throw "404 application $id" }
                $app = $t.applications[$id]
                if ($Method -eq 'GET') {
                    $shared = @($g.applications | Where-Object { $_.id -eq $id }) | Select-Object -First 1
                    $full = ConvertTo-NpiHashtable $app; $full.id = $id; if ($shared) { $full.appId = $shared.appId }
                    $select = if ($q.ContainsKey('$select')) { @($q['$select'].Split(',')) } else { @() }
                    # Learn: a keyCredential's key comes back only on a single-object read that selects keyCredentials.
                    if ($select -notcontains 'keyCredentials') { foreach ($k in @($full.keyCredentials)) { $k.key = $null } }
                    if ($select.Count) { $o = @{ id = $id }; foreach ($s in $select) { if ($full.ContainsKey($s)) { $o[$s] = $full[$s] } }; return $o }
                    return $full
                }
                if ($Method -ne 'PATCH') { break }
                foreach ($k in $b.Keys) {
                    switch ($k) {
                        'servicePrincipalLockConfiguration' { $app.servicePrincipalLockConfiguration = $b[$k] }
                        'keyCredentials' {
                            $cap = Get-NpiFakeEffectiveCertCap -State $State -AppId $id
                            $kept = [Collections.Generic.List[object]]::new()
                            foreach ($kc in @($b[$k])) {
                                if (-not $kc['key']) { throw '400 Bad Request: each keyCredential in the collection needs its key' }
                                $old = if ($kc['keyId']) { @($app.keyCredentials | Where-Object { $_.keyId -eq $kc['keyId'] }) | Select-Object -First 1 } else { $null }
                                if ($old) { $kept.Add($old); continue }
                                $cert = ConvertFrom-NpiFakeCert $kc['key']
                                $life = $cert.Exp - $cert.Nbf
                                if ($cap -and $life -gt $cap) { throw "400 Bad Request: the certificate's lifetime ($([int]$life.TotalDays) days) exceeds the maximum the app management policy allows ($([int]$cap.TotalDays) days)" }
                                $hex = $cert.Thumbprint
                                $kid = '9c{0}-{1}-4{2}-8{3}-{4}' -f $hex.Substring(0, 6).ToLower(), $hex.Substring(6, 4).ToLower(), $hex.Substring(10, 3).ToLower(), $hex.Substring(13, 3).ToLower(), $hex.Substring(16, 12).ToLower()
                                $kept.Add(@{ keyId = $kid; displayName = $cert.Subject; type = $kc['type']; usage = $kc['usage']; startDateTime = $cert.Nbf.ToString('yyyy-MM-ddTHH:mm:ssZ'); endDateTime = $cert.Exp.ToString('yyyy-MM-ddTHH:mm:ssZ')
                                        customKeyIdentifier = [Convert]::ToBase64String([Convert]::FromHexString($hex)); key = $kc['key'] })
                            }
                            $app.keyCredentials = $kept.ToArray()
                        }
                        'passwordCredentials' { throw '400 Bad Request: PATCH of passwordCredentials isn''t supported; use addPassword' }
                        default { throw "The fake doesn't update $k" }
                    }
                }
                return @{}
            }
        }
        throw "The fake has no Graph route for $Method $path"
    }

    if ($u.Host.EndsWith(".$($State.VaultSuffix)")) {
        # Vault names aren't case-sensitive, and a URI's host comes back in lower case.
        $vault = @($t.keyVaults.Keys | Where-Object { $_ -ieq $u.Host.Split('.')[0] }) | Select-Object -First 1
        if (-not $vault) { throw "404 vault $($u.Host)" }
        if ($q['api-version'] -ne '2025-07-01') { throw "Unexpected api-version $($q['api-version'])" }
        $kv = $t.keyVaults[$vault]
        if ($path -notmatch '^/certificates/([0-9a-zA-Z-]+)(/create|/pending)?$') { throw "The fake has no Key Vault route for $path" }
        $name = $Matches[1]; $op = if ($Matches.ContainsKey(2)) { $Matches[2] } else { '' }
        if (-not $kv.certificates.ContainsKey($name)) { throw "404 certificate $name" }
        $cert = $kv.certificates[$name]
        switch ("$Method $op") {
            'GET ' { return ConvertTo-NpiFakeKvCertificate -Base $base -Name $name -Cert $cert }
            'POST /create' {
                if ($cert.ContainsKey('pending') -and $cert.pending) { throw '409 Conflict: a new key vault certificate can''t be created while a pending certificate is inProgress' }
                if ($b -and $b.ContainsKey('policy')) { $cert.policy = $b.policy }
                $cert.pending = $true
                return @{ id = "$base/certificates/$name/pending"; status = 'inProgress'; issuer = @{ name = $cert.policy.issuer.name } }
            }
            'GET /pending' {
                if (-not ($cert.ContainsKey('pending') -and $cert.pending)) { throw "404 no pending operation for $name" }
                $n = @($cert.versions).Count + 1
                $thumb = ([Security.Cryptography.SHA1]::HashData([Text.Encoding]::UTF8.GetBytes("$vault/$name/$n")) | ForEach-Object { $_.ToString('X2') }) -join ''
                $nbf = $State.AsOf; $exp = $nbf.AddMonths([int]$cert.policy.x509_props.validity_months)
                $verId = ('{0:x32}' -f $n).PadLeft(32, '0').Substring(0, 32)
                $blob = New-NpiFakeCertBlob -Thumbprint $thumb -Nbf $nbf -Exp $exp -Subject $cert.policy.x509_props.subject
                $x5t = [Convert]::ToBase64String([Convert]::FromHexString($thumb)).TrimEnd('=').Replace('+', '-').Replace('/', '_')
                $cert.versions = @($cert.versions) + @(@{ version = $verId; x5t = $x5t; cer = $blob; nbf = $nbf.ToString('yyyy-MM-ddTHH:mm:ssZ'); exp = $exp.ToString('yyyy-MM-ddTHH:mm:ssZ'); subject = $cert.policy.x509_props.subject })
                $cert.pending = $false
                return @{ id = "$base/certificates/$name/pending"; status = 'completed'; target = "$base/certificates/$name/$verId" }
            }
        }
        throw "The fake has no Key Vault route for $Method $path"
    }
    throw "The fake refuses host $base"
}

# ----------------------------------------------------------------------------- inputs and outputs

function Import-NpiCh04Register {
    <#
    .SYNOPSIS
        Reads Chapter 01's register.json from an inventory run and checks it against the run's
        manifest. Returns the rows, the manifest and the register's SHA-256; throws if a file is
        missing, the run isn't an inventory run, or the register has changed.
    .EXAMPLE
        # out/inventory was written by ./Invoke-NpiInventory.ps1 -Cloud gcc -FixturePath tests/fixtures/estate.json -OutputPath out/inventory
        $register = Import-NpiCh04Register -RunPath out/inventory
    #>

    <# Chapter 01's register, checked against its run manifest, as Chapter 02 does. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$RunPath)
    $reg = Join-Path $RunPath 'register.json'; $man = Join-Path $RunPath 'manifest.json'
    foreach ($p in $reg, $man) { if (-not (Test-Path -LiteralPath $p)) { throw "Missing $p; run Chapter 01's Invoke-NpiInventory.ps1 first." } }
    $manifest = Get-Content -LiteralPath $man -Raw | ConvertFrom-Json -AsHashtable
    if ($manifest.task -ne 'inventory') { throw "$man isn't an inventory run." }
    $hash = Get-NpiFileHash -Path $reg
    if ($hash -ne $manifest.files['register.json']) { throw "register.json doesn't match its manifest (SHA-256 $hash); refusing to use a changed register." }
    [pscustomobject]@{ Rows = @(Get-Content -LiteralPath $reg -Raw | ConvertFrom-Json); Manifest = $manifest; Sha256 = $hash }
}

function Import-NpiCh04Input {
    <#
    .SYNOPSIS
        Reads one reviewed CSV input (certificate bindings, rotation approvals or verifications)
        and returns its rows. Returns an empty array if the path is empty or the file doesn't exist.
    .EXAMPLE
        Import-NpiCh04Input -Path tests/fixtures/ch04/inputs/rotation-approvals.csv
    #>
    param([string]$Path)
    if (-not $Path -or -not (Test-Path -LiteralPath $Path)) { return @() }
    @(Import-Csv -LiteralPath $Path)
}

function Export-NpiCh04Run {
    <#
    .SYNOPSIS
        Writes each of a run's files as sorted JSON under -OutputPath, then manifest.json with
        the task, mode, cloud, tenant, the permissions the task needs, every request made and a
        SHA-256 per file. Returns the manifest file.
    .EXAMPLE
        # $reader, $state and $out come from New-NpiCh04Client, Get-NpiAppPolicyState and New-NpiPolicyPlan.
        Export-NpiCh04Run -OutputPath out/policy -Task app-policy -Cloud gcc -Mode Fixture -TenantId $register.Manifest.tenantId -AsOf '2026-10-30' -Evidence $reader.Evidence -Files @{ 'policy-plan.json' = $out.Plan; 'policy-diff.json' = @($out.Diff) }
    #>

    <# Write a run's files and a manifest (task, mode, cloud, tenant, permissions held, every request, a SHA-256 per file). #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$Task, [Parameter(Mandatory)][hashtable]$Files, [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][string]$TenantId, [string]$AsOf, [object[]]$Evidence = @(), [string]$Mode = 'Fixture', [hashtable]$Extra = @{})
    $OutputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $hashes = [ordered]@{}
    foreach ($name in ($Files.Keys | Sort-Object)) { $p = Join-Path $OutputPath $name; Write-NpiSortedJson -Path $p -Value $Files[$name]; $hashes[$name] = Get-NpiFileHash -Path $p }
    $perm = Get-NpiCh04RequiredPermission -Task $Task
    $manifest = [ordered]@{
        task = $Task; mode = $Mode; cloud = $Cloud; tenantId = $TenantId; asOf = $AsOf; generated = [DateTime]::UtcNow.ToString('o')
        graphPermissions = $perm.GraphPermissions; azureRoles = $perm.AzureRoles; delegatedRole = $perm.DelegatedRole
        requests = @($Evidence | ForEach-Object { [ordered]@{ call = $_.Call; method = $_.Method; target = $_.Target; at = $_.At } })
        files = $hashes
    }
    foreach ($k in $Extra.Keys) { $manifest[$k] = $Extra[$k] }
    Write-NpiJson -Path (Join-Path $OutputPath 'manifest.json') -Value $manifest
    Get-Item -LiteralPath (Join-Path $OutputPath 'manifest.json')
}

# ----------------------------------------------------------------------------- the policy: read, compare, plan

function ConvertTo-NpiAction {
    # One plan action, always with the same fields in the same order.
    param([hashtable]$A)
    $o = [ordered]@{}
    foreach ($k in 'ActionId', 'Action', 'Name', 'Object', 'Write', 'Call', 'Method', 'Target', 'Body', 'Precheck', 'Detail') { $o[$k] = if ($A.ContainsKey($k)) { $A[$k] } else { $null } }
    if ($null -eq $o.Write) { $o.Write = $false }
    [pscustomobject]$o
}

function Get-NpiAppPolicyState {
    <#
    .SYNOPSIS
        Read the tenant default policy, every app management policy with what it applies to, and,
        for each app registration in the register, its creation date and app instance lock.
    .EXAMPLE
        $register = Import-NpiCh04Register -RunPath out/inventory
        $reader = New-NpiCh04Client -Cloud gcc -Task app-policy -Invoke (New-NpiCh04FixtureInvoker -Path tests/fixtures/ch04/tenant.json).Invoke -TenantId $register.Manifest.tenantId
        $state = Get-NpiAppPolicyState -Client $reader -Rows $register.Rows
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client, [Parameter(Mandatory)][object[]]$Rows)
    $default = Invoke-NpiCh04Get -Client $Client -CallId 'graph-ch04-default-policy-get' -Single
    $policies = @(Invoke-NpiCh04Get -Client $Client -CallId 'graph-ch04-app-policies-list') | ForEach-Object {
        $applies = @(Invoke-NpiCh04Get -Client $Client -CallId 'graph-ch04-app-policy-applies-to' -Bind @{ id = $_.id } -Query '$select=id,displayName')
        $x = ConvertTo-NpiHashtable $_; $x.appliesTo = @($applies | ForEach-Object { $_.id }); $x
    }
    $apps = foreach ($r in @($Rows | Where-Object Type -EQ 'AppRegistration')) {
        $a = Invoke-NpiCh04Get -Client $Client -CallId 'graph-ch04-application-get' -Bind @{ id = $r.ObjectId } -Query '$select=id,displayName,createdDateTime,servicePrincipalLockConfiguration' -Single
        [pscustomobject]@{ Id = $r.ObjectId; Name = $r.Name; Created = $a['createdDateTime']; Lock = $a['servicePrincipalLockConfiguration'] }
    }
    [pscustomobject]@{ Default = $default; Policies = @($policies); Apps = @($apps); Sha256 = (Get-NpiTextSha256 (ConvertTo-NpiCanonicalJson (Select-NpiPolicyCore $default))) }
}

function Select-NpiPolicyCore {
    # The parts of the default policy the plan changes, for the precheck hash.
    param($Default)
    $d = ConvertTo-NpiHashtable $Default
    [ordered]@{ isEnabled = [bool]$d['isEnabled']; applicationRestrictions = $d['applicationRestrictions']; servicePrincipalRestrictions = $d['servicePrincipalRestrictions'] }
}

function Test-NpiStricter {
    <# True when restriction A is at least as strict as B: enabled, an earlier or equal start date, and (for a lifetime) a shorter or equal maximum. #>
    param($A, $B)
    if (-not $A) { return $false }
    $A = ConvertTo-NpiHashtable $A; $B = ConvertTo-NpiHashtable $B
    $aOn = -not ($A.ContainsKey('state') -and $A['state'] -eq 'disabled')
    if (-not $aOn) { return $false }
    $aAfter = ConvertTo-NpiUtc $A['restrictForAppsCreatedAfterDateTime']; $bAfter = ConvertTo-NpiUtc $B['restrictForAppsCreatedAfterDateTime']
    if ($bAfter -and $aAfter -and $aAfter -gt $bAfter) { return $false }
    if ($bAfter -and -not $aAfter) { return $false }
    if ($A['restrictionType'] -in $script:LifetimeTypes) { return (ConvertFrom-NpiIsoDuration $A['maxLifetime']) -le (ConvertFrom-NpiIsoDuration $B['maxLifetime']) }
    $true
}

function Compare-NpiAppPolicy {
    <#
    .SYNOPSIS
        Compare the tenant default policy with the reviewed file. Returns the rows of the diff and the
        merged PATCH body: every restriction the tenant already has is carried, the program's are added
        or tightened, and none is ever loosened or dropped (Design guidance).
    .EXAMPLE
        # $state comes from Get-NpiAppPolicyState.
        $config = Get-Content -LiteralPath config/app-management-policy.json -Raw | ConvertFrom-Json -AsHashtable
        (Compare-NpiAppPolicy -State $state -Config $config).Rows | Format-Table Scope, RestrictionType, Change
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$State, [Parameter(Mandatory)]$Config)
    $cfg = ConvertTo-NpiHashtable $Config
    $cur = ConvertTo-NpiHashtable $State.Default
    $rows = [Collections.Generic.List[object]]::new()
    $body = [ordered]@{ isEnabled = $true }
    if (-not [bool]$cur['isEnabled']) { $rows.Add([pscustomobject]@{ Scope = 'policy'; Collection = ''; RestrictionType = 'isEnabled'; Current = 'false'; Desired = 'true'; Change = 'Change' }) }
    foreach ($scope in $cfg.tenantDefault.scopes) {
        $curScope = if ($cur.ContainsKey($scope) -and $cur[$scope]) { $cur[$scope] } else { @{} }
        $scopeBody = [ordered]@{}
        foreach ($col in 'passwordCredentials', 'keyCredentials') {
            $current = @($(if ($curScope.ContainsKey($col)) { $curScope[$col] }) | Where-Object { $_ })
            $desired = @($cfg.tenantDefault.restrictions | Where-Object { $_.collection -eq $col })
            $merged = [Collections.Generic.List[object]]::new()
            foreach ($d in $desired) {
                $want = [ordered]@{ restrictionType = $d.restrictionType; state = $d.state; maxLifetime = $d.maxLifetime; restrictForAppsCreatedAfterDateTime = (Format-NpiDate $cfg.effectiveDate) }
                $have = @($current | Where-Object { $_['restrictionType'] -eq $d.restrictionType }) | Select-Object -First 1
                $fmt = { param($r) $r = ConvertTo-NpiHashtable $r; if (-not $r) { '(none)' } else { "$(if ($r.ContainsKey('state') -and $r['state']) { $r['state'] } else { '(no state)' }) $(if ($r['maxLifetime']) { $r['maxLifetime'] + ' ' })for apps created after $(Format-NpiDate $r['restrictForAppsCreatedAfterDateTime'] -DateOnly)" } }
                if ($have -and (Test-NpiStricter -A $have -B $want)) {
                    $keep = [ordered]@{}; foreach ($k in 'restrictionType', 'state', 'maxLifetime', 'restrictForAppsCreatedAfterDateTime') { $keep[$k] = $have[$k] }
                    if (-not $keep.state) { $keep.state = 'enabled' }
                    $keep.restrictForAppsCreatedAfterDateTime = Format-NpiDate $keep.restrictForAppsCreatedAfterDateTime
                    $merged.Add($keep)
                    $same = ((ConvertTo-NpiCanonicalJson $keep) -eq (ConvertTo-NpiCanonicalJson $want))
                    $rows.Add([pscustomobject]@{ Scope = $scope; Collection = $col; RestrictionType = $d.restrictionType; Current = (& $fmt $have); Desired = (& $fmt $want); Change = $(if ($same) { 'Same' } else { 'KeepStricter' }) })
                } else {
                    $merged.Add($want)
                    $rows.Add([pscustomobject]@{ Scope = $scope; Collection = $col; RestrictionType = $d.restrictionType; Current = (& $fmt $have); Desired = (& $fmt $want); Change = $(if ($have) { 'Change' } else { 'Add' }) })
                }
            }
            foreach ($c in $current) {
                if (@($desired | Where-Object { $_.restrictionType -eq $c['restrictionType'] }).Count) { continue }
                $keep = [ordered]@{}; foreach ($k in 'restrictionType', 'state', 'maxLifetime', 'restrictForAppsCreatedAfterDateTime') { if ($c.ContainsKey($k)) { $keep[$k] = $c[$k] } }
                if ($c.ContainsKey('excludeActors')) { $keep.excludeActors = $c['excludeActors'] }
                $merged.Add($keep)
                $rows.Add([pscustomobject]@{ Scope = $scope; Collection = $col; RestrictionType = $c['restrictionType']; Current = 'kept as it is'; Desired = '(not in the reviewed file)'; Change = 'KeepExisting' })
            }
            $scopeBody[$col] = $merged.ToArray()
        }
        $body[$scope] = $scopeBody
    }
    $changes = @($rows | Where-Object Change -In 'Add', 'Change')
    [pscustomobject]@{ Rows = $rows.ToArray(); Body = $body; HasChanges = ($changes.Count -gt 0) }
}

function New-NpiPolicyPlan {
    <#
    .SYNOPSIS
        The policy plan: PATCH the tenant default when it differs, create and assign each exception
        that's in force, and lock every app registration that isn't fully locked. No write weakens
        a restriction, drops one, or deletes anything. Same inputs, same plan, byte for byte.
    .EXAMPLE
        # $state from Get-NpiAppPolicyState, $config from config/app-management-policy.json.
        $out = New-NpiPolicyPlan -State $state -Config $config -AsOf ([datetime]'2026-10-30') -Cloud gcc -TenantId $register.Manifest.tenantId -RegisterSha256 $register.Sha256
        $out.Plan.actions | Format-Table ActionId, Action, Name, Write
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$State, [Parameter(Mandatory)]$Config, [Parameter(Mandatory)][datetime]$AsOf, [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][string]$TenantId, [string]$RegisterSha256, [string]$ConfigSha256)
    $g = (Get-NpiCloud -Cloud $Cloud).Graph
    $cfg = ConvertTo-NpiHashtable $Config
    $diff = Compare-NpiAppPolicy -State $State -Config $Config
    $actions = [Collections.Generic.List[object]]::new(); $findings = [Collections.Generic.List[object]]::new()
    $script:__n = 0
    $add = { param([hashtable]$a) $script:__n++; $a.ActionId = 'POL-{0:d3}' -f $script:__n; $actions.Add((ConvertTo-NpiAction $a)) }

    if ($diff.HasChanges) {
        & $add @{ Action = 'PatchDefaultPolicy'; Name = 'Tenant default app management policy'; Object = 'defaultAppManagementPolicy'; Write = $true; Call = 'graph-ch04-default-policy-update'; Method = 'PATCH'
            Target = "$g/v1.0/policies/defaultAppManagementPolicy"; Body = $diff.Body; Precheck = [ordered]@{ call = 'graph-ch04-default-policy-get'; sha256 = $State.Sha256 }
            Detail = (@($diff.Rows | Where-Object Change -In 'Add', 'Change' | ForEach-Object { "$($_.Change) $($_.Scope).$($_.RestrictionType)" }) -join '; ') }
        foreach ($r in @($diff.Rows | Where-Object Change -In 'Add', 'Change')) {
            $findings.Add((New-NpiFinding -Rule 'NPI-POL-01' -Severity Finding -ObjectKey "default:$($r.Scope):$($r.RestrictionType)" -Object 'Tenant default policy' -Issue "$($r.Scope) $($r.RestrictionType): $($r.Current), the reviewed file says $($r.Desired)"))
        }
    } else {
        & $add @{ Action = 'DefaultPolicyInPlace'; Name = 'Tenant default app management policy'; Object = 'defaultAppManagementPolicy'; Write = $false; Detail = 'The tenant default already holds the reviewed restrictions' }
    }
    foreach ($r in @($diff.Rows | Where-Object Change -In 'KeepStricter', 'KeepExisting')) {
        $findings.Add((New-NpiFinding -Rule 'NPI-POL-05' -Severity Info -ObjectKey "default:$($r.Scope):$($r.RestrictionType)" -Object 'Tenant default policy' -Issue "$($r.Scope) $($r.RestrictionType) kept ($($r.Change)): the plan never loosens or drops a restriction"))
    }

    $reviewed = @($cfg.exceptions | ForEach-Object { $_.displayName })
    foreach ($p in @($State.Policies | Where-Object { $_.displayName -notin $reviewed })) {
        $names = @($p.appliesTo | ForEach-Object { $id = $_; $hit = @($State.Apps | Where-Object Id -EQ $id); if ($hit) { $hit[0].Name } else { $id } }) -join ', '
        $findings.Add((New-NpiFinding -Rule 'NPI-POL-02' -Severity Warn -ObjectKey "policy:$($p.id)" -Object $p.displayName -Issue "An app management policy that isn't in the reviewed file, applied to: $(if ($names) { $names } else { 'nothing' }). Review it; this code never changes or deletes it"))
    }

    foreach ($x in @($cfg.exceptions)) {
        $ends = ConvertTo-NpiUtc $x.endsOn
        $existing = @($State.Policies | Where-Object { $_.displayName -eq $x.displayName }) | Select-Object -First 1
        if ($ends -lt $AsOf) {
            & $add @{ Action = 'ExceptionExpired'; Name = $x.name; Object = $x.application; Write = $false; Detail = "Record $($x.record) ended $(Format-NpiDate $x.endsOn -DateOnly); a person removes the assignment through the reviewed process" }
            if ($existing -and @($existing.appliesTo) -contains $x.application) { $findings.Add((New-NpiFinding -Rule 'NPI-POL-03' -Severity Finding -ObjectKey "exception:$($x.record)" -Object $x.name -Issue "Exception $($x.record) ended $(Format-NpiDate $x.endsOn -DateOnly) and its policy is still assigned")) }
            continue
        }
        $policyBody = [ordered]@{ displayName = $x.displayName; description = $x.description; isEnabled = $true; restrictions = $x.restrictions }
        $holder = @($State.Policies | Where-Object { @($_.appliesTo) -contains $x.application }) | Select-Object -First 1
        if ($holder -and $holder.displayName -ne $x.displayName) {
            & $add @{ Action = 'ForeignPolicyAssigned'; Name = $x.name; Object = $x.application; Write = $false; Detail = "The app already has '$($holder.displayName)'; only one app management policy can be assigned" }
            $findings.Add((New-NpiFinding -Rule 'NPI-POL-04' -Severity Finding -ObjectKey "exception:$($x.record)" -Object $x.name -Issue "Exception $($x.record) can't be assigned: the app already has '$($holder.displayName)'"))
            continue
        }
        if (-not $existing) {
            & $add @{ Action = 'CreateAppPolicy'; Name = $x.name; Object = $x.displayName; Write = $true; Call = 'graph-ch04-app-policy-create'; Method = 'POST'; Target = "$g/v1.0/policies/appManagementPolicies"
                Body = $policyBody; Precheck = [ordered]@{ call = 'graph-ch04-app-policies-list'; absent = $x.displayName }; Detail = "Exception $($x.record), ends $(Format-NpiDate $x.endsOn -DateOnly)" }
        } else {
            $same = (ConvertTo-NpiCanonicalJson $existing.restrictions) -eq (ConvertTo-NpiCanonicalJson $x.restrictions)
            & $add @{ Action = $(if ($same) { 'AppPolicyInPlace' } else { 'AppPolicyDrift' }); Name = $x.name; Object = $existing.id; Write = $false; Detail = $(if ($same) { "Exception $($x.record) exists" } else { "Exception $($x.record) exists but its restrictions differ from the reviewed file; a person updates it" }) }
        }
        if ($holder) {
            & $add @{ Action = 'AssignmentInPlace'; Name = $x.name; Object = $x.application; Write = $false; Detail = "Assigned to '$($holder.displayName)'" }
        } else {
            $ref = if ($existing) { "$g/v1.0/policies/appManagementPolicies/$($existing.id)" } else { "{created:$($x.displayName)}" }
            & $add @{ Action = 'AssignAppPolicy'; Name = $x.name; Object = $x.application; Write = $true; Call = 'graph-ch04-app-policy-assign'; Method = 'POST'
                Target = "$g/v1.0/applications/$($x.application)/appManagementPolicies/`$ref"; Body = [ordered]@{ '@odata.id' = $ref }
                Precheck = [ordered]@{ call = 'graph-ch04-app-policy-applies-to'; unassigned = $x.application; policy = $x.displayName }; Detail = "Exception $($x.record)" }
        }
    }

    $lock = [ordered]@{ isEnabled = $true; allProperties = $true }
    foreach ($a in @($State.Apps)) {
        $l = $a.Lock
        $full = $l -and $l['isEnabled'] -and $l['allProperties']
        if ($full) { & $add @{ Action = 'AlreadyLocked'; Name = $a.Name; Object = $a.Id; Write = $false; Detail = 'All sensitive properties locked' }; continue }
        $now = if (-not $l) { 'no lock configured' } elseif (-not $l['isEnabled']) { 'lock disabled' } else { 'only some properties locked' }
        & $add @{ Action = 'LockApp'; Name = $a.Name; Object = $a.Id; Write = $true; Call = 'graph-ch04-app-lock'; Method = 'PATCH'; Target = "$g/v1.0/applications/$($a.Id)"
            Body = [ordered]@{ servicePrincipalLockConfiguration = $lock }; Precheck = [ordered]@{ call = 'graph-ch04-application-get'; notLocked = $a.Id }; Detail = $now }
        $findings.Add((New-NpiFinding -Rule 'NPI-POL-06' -Severity Finding -ObjectKey "lock:$($a.Id)" -Object "$($a.Name) (AppRegistration)" -Issue "App instance property lock: $now"))
    }

    $plan = [ordered]@{
        planVersion = 1; task = 'policy-apply'; generated = $AsOf.ToString('o'); asOf = $AsOf.ToString('yyyy-MM-dd'); cloud = $Cloud; tenantId = $TenantId
        registerSha256 = $RegisterSha256; configSha256 = $ConfigSha256; effectiveDate = $cfg.effectiveDate; actions = $actions.ToArray()
    }
    [pscustomobject]@{ Plan = $plan; Diff = $diff.Rows; Findings = $findings.ToArray() }
}

# ----------------------------------------------------------------------------- rotation: plan

function Get-NpiCertCap {
    param($Created, $Config, $EffectiveDate)
    $c = ConvertTo-NpiUtc $Created; $e = ConvertTo-NpiUtc $EffectiveDate
    if ($c -and $e -and $c -gt $e) { [int]$Config.maxLifetimeDays } else { [int]$Config.legacyMaxLifetimeDays }
}

function New-NpiRotationPlan {
    <#
    .SYNOPSIS
        For every app registration in the register: secrets reported for replacement; each
        certificate checked against its Key Vault binding, the owner's approval and verification,
        and given one step: wait, renew in Key Vault, attach the new certificate, wait out the
        overlap, or remove the old one. Same inputs, same plan, byte for byte.
    .EXAMPLE
        $reader = New-NpiCh04Client -Cloud gcc -Task rotation -Invoke (New-NpiCh04FixtureInvoker -Path tests/fixtures/ch04/tenant.json).Invoke -TenantId $register.Manifest.tenantId
        $config = Get-Content -LiteralPath config/rotation.json -Raw | ConvertFrom-Json -AsHashtable
        $policy = Get-Content -LiteralPath config/app-management-policy.json -Raw | ConvertFrom-Json -AsHashtable
        New-NpiRotationPlan -Client $reader -Rows $register.Rows -Bindings (Import-NpiCh04Input tests/fixtures/ch04/inputs/certificate-bindings.csv) `
            -Approvals (Import-NpiCh04Input tests/fixtures/ch04/inputs/rotation-approvals.csv) -Config $config -EffectiveDate (Format-NpiDate $policy.effectiveDate) `
            -AsOf ([datetime]'2026-10-30') -Cloud gcc -TenantId $register.Manifest.tenantId
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client, [Parameter(Mandatory)][object[]]$Rows, [object[]]$Bindings = @(), [object[]]$Approvals = @(), [object[]]$Verifications = @(),
        [Parameter(Mandatory)]$Config, [Parameter(Mandatory)][string]$EffectiveDate, [Parameter(Mandatory)][datetime]$AsOf, [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][string]$TenantId, [string]$RegisterSha256, [hashtable]$InputSha256 = @{})
    $g = (Get-NpiCloud -Cloud $Cloud).Graph
    $actions = [Collections.Generic.List[object]]::new(); $findings = [Collections.Generic.List[object]]::new(); $requests = [Collections.Generic.List[object]]::new()
    $script:__r = 0
    $add = { param([hashtable]$a) $script:__r++; $a.ActionId = 'ROT-{0:d3}' -f $script:__r; $actions.Add((ConvertTo-NpiAction $a)) }
    $people = @{}
    $person = { param([string]$Key) if (-not $people.ContainsKey($Key)) { $people[$Key] = try { Invoke-NpiCh04Get -Client $Client -CallId 'graph-ch04-user' -Bind @{ id = $Key } -Query '$select=id,userPrincipalName,userType,accountEnabled' -Single } catch { $null } }; $people[$Key] }

    foreach ($r in @($Rows | Where-Object Type -EQ 'AppRegistration' | Sort-Object Name)) {
        $app = Invoke-NpiCh04Get -Client $Client -CallId 'graph-ch04-application-get' -Bind @{ id = $r.ObjectId } -Query '$select=id,appId,displayName,createdDateTime,keyCredentials,passwordCredentials' -Single
        foreach ($p in @($app['passwordCredentials'] | Where-Object { $_ })) {
            $end = ConvertTo-NpiUtc $p['endDateTime']
            & $add @{ Action = 'ReplaceSecret'; Name = $r.Name; Object = $p['keyId']; Write = $false; Detail = "A client secret ($(if ($end -lt $AsOf) { 'expired ' + $end.ToString('yyyy-MM-dd') } else { 'ends ' + $end.ToString('yyyy-MM-dd') })): replace it with a certificate or a federated credential (Chapter 05); rotation in place covers certificates" }
            $findings.Add((New-NpiFinding -Rule 'NPI-ROT-06' -Severity Info -ObjectKey "secret:$($r.ObjectId):$($p['keyId'])" -Object "$($r.Name) (AppRegistration)" -Issue 'A client secret: replace, don''t rotate'))
        }
        $certs = @($app['keyCredentials'] | Where-Object { $_ -and $_['type'] -eq 'AsymmetricX509Cert' -and $_['usage'] -eq 'Verify' })
        if (-not $certs.Count) { continue }
        $cap = Get-NpiCertCap -Created $app['createdDateTime'] -Config $Config -EffectiveDate $EffectiveDate
        foreach ($c in $certs) {
            $life = ((ConvertTo-NpiUtc $c['endDateTime']) - (ConvertTo-NpiUtc $c['startDateTime'])).TotalDays
            if ($life -gt $cap) { $findings.Add((New-NpiFinding -Rule 'NPI-ROT-05' -Severity Finding -ObjectKey "lifetime:$($r.ObjectId):$($c['keyId'])" -Object "$($r.Name) (AppRegistration)" -Issue "A certificate valid for $([int]$life) days; the cap for this app is $cap")) }
        }
        $bind = @($Bindings | Where-Object AppObjectId -EQ $r.ObjectId) | Select-Object -First 1
        if (-not $bind) {
            & $add @{ Action = 'NoKeyVaultBinding'; Name = $r.Name; Object = $r.ObjectId; Write = $false; Detail = 'No Key Vault certificate is bound to this app: put the certificate in Key Vault and add a row to certificate-bindings.csv' }
            $findings.Add((New-NpiFinding -Rule 'NPI-ROT-02' -Severity Finding -ObjectKey "binding:$($r.ObjectId)" -Object "$($r.Name) (AppRegistration)" -Issue 'A certificate credential with no Key Vault binding'))
            continue
        }
        $kv = Invoke-NpiCh04Get -Client $Client -CallId 'kv-ch04-certificate-get' -Bind @{ name = $bind.CertificateName } -Vault $bind.Vault -Single
        $kvThumb = ConvertFrom-NpiX5t $kv['x5t']
        $kvNbf = [DateTimeOffset]::FromUnixTimeSeconds([int64]$kv['attributes']['nbf']).UtcDateTime
        $kvExp = [DateTimeOffset]::FromUnixTimeSeconds([int64]$kv['attributes']['exp']).UtcDateTime
        $withThumb = @($certs | ForEach-Object { [pscustomobject]@{ KeyId = $_['keyId']; Thumb = (ConvertFrom-NpiCustomKeyIdentifier $_['customKeyIdentifier']); Start = (ConvertTo-NpiUtc $_['startDateTime']); End = (ConvertTo-NpiUtc $_['endDateTime']); Raw = $_ } })
        $current = @($withThumb | Where-Object Thumb -EQ $kvThumb) | Select-Object -First 1
        $older = @($withThumb | Where-Object { $_.Thumb -ne $kvThumb } | Sort-Object End)
        $keyIds = @($withThumb.KeyId | Sort-Object)
        $kvRef = "$($bind.Vault)/$($bind.CertificateName)"

        # The certificate being replaced: the oldest one on the app that isn't Key Vault's current version.
        $old = if ($older.Count) { $older[0] } else { $current }
        $reqId = "ROT:$($r.ObjectId):$($old.KeyId)"
        $approval = @($Approvals | Where-Object RequestId -EQ $reqId) | Select-Object -Last 1
        $approved = $false; $refusal = $null
        if ($approval) {
            $owners = @(Invoke-NpiCh04Get -Client $Client -CallId 'graph-ch04-application-owners' -Bind @{ id = $r.ObjectId } -Query '$select=id')
            $who = & $person $approval.ApprovedBy
            $on = ConvertTo-NpiUtc $approval.ApprovedOn
            if (-not $who) { $refusal = "approver $($approval.ApprovedBy) not found" }
            elseif ($who['userType'] -ne 'Member' -or -not $who['accountEnabled']) { $refusal = "approver $($approval.ApprovedBy) isn't an enabled member" }
            elseif (@($owners | Where-Object { $_.id -eq $who['id'] }).Count -eq 0) { $refusal = "approver $($approval.ApprovedBy) isn't an owner of the app" }
            elseif (-not $on -or ($AsOf - $on).TotalDays -gt [int]$Config.approvalValidDays) { $refusal = "the approval of $($approval.ApprovedOn) is older than $($Config.approvalValidDays) days" }
            else { $approved = $true }
        }
        $needApproval = {
            param([string]$why)
            if ($refusal) {
                & $add @{ Action = 'ApprovalRefused'; Name = $r.Name; Object = $reqId; Write = $false; Detail = "$why; $refusal" }
                $findings.Add((New-NpiFinding -Rule 'NPI-ROT-04' -Severity Warn -ObjectKey $reqId -Object "$($r.Name) (AppRegistration)" -Issue "Rotation approval refused: $refusal"))
            } else {
                & $add @{ Action = 'AwaitOwnerApproval'; Name = $r.Name; Object = $reqId; Write = $false; Detail = "$why; an owner who is an enabled member approves request $reqId" }
                $findings.Add((New-NpiFinding -Rule 'NPI-ROT-01' -Severity Finding -ObjectKey $reqId -Object "$($r.Name) (AppRegistration)" -Issue "$why; no owner has approved the rotation"))
            }
            $requests.Add([pscustomobject][ordered]@{ RequestId = $reqId; Application = $r.Name; ApplicationId = $r.ObjectId; KeyId = $old.KeyId; Expires = $old.End.ToString('yyyy-MM-dd'); KeyVault = $kvRef; Owners = @($r.OwnerIds) -join '; '; Status = $(if ($refusal) { 'Refused' } else { 'AwaitingApproval' }) })
        }

        if ($current -and $older.Count) {
            # The new certificate is on the app beside the old one: verify, then wait out the overlap.
            $verify = @($Verifications | Where-Object { $_.RequestId -eq $reqId -and $_.NewThumbprint -eq $kvThumb }) | Select-Object -Last 1
            $overlapEnds = $current.Start.AddDays([int]$Config.overlapDays)
            if (-not $verify) {
                & $add @{ Action = 'AwaitVerification'; Name = $r.Name; Object = $reqId; Write = $false; Detail = "The new certificate ($kvThumb) is on the app; its owner records that the workload signs in with it" }
                $findings.Add((New-NpiFinding -Rule 'NPI-ROT-07' -Severity Info -ObjectKey "verify:$reqId" -Object "$($r.Name) (AppRegistration)" -Issue 'New certificate added; awaiting the owner''s verification'))
            } elseif ($AsOf -lt $overlapEnds) {
                & $add @{ Action = 'OverlapRunning'; Name = $r.Name; Object = $reqId; Write = $false; Detail = "Verified by $($verify.VerifiedBy) on $($verify.VerifiedOn); the overlap ends $($overlapEnds.ToString('yyyy-MM-dd'))" }
            } else {
                $keep = @($withThumb | Where-Object { $_.KeyId -notin @($older.KeyId) } | ForEach-Object { $_.Raw })
                $bodyCreds = @($keep | ForEach-Object { [ordered]@{ keyId = $_['keyId']; type = $_['type']; usage = $_['usage']; key = $_['key']; displayName = $_['displayName'] } })
                & $add @{ Action = 'RemoveOldCertificate'; Name = $r.Name; Object = $reqId; Write = $true; Call = 'graph-ch04-app-keys-update'; Method = 'PATCH'; Target = "$g/v1.0/applications/$($r.ObjectId)"
                    Body = [ordered]@{ keyCredentials = $bodyCreds }; Precheck = [ordered]@{ call = 'graph-ch04-application-get'; keyIds = $keyIds; remove = @($older.KeyId | Sort-Object); keep = $current.KeyId }
                    Detail = "Verified by $($verify.VerifiedBy) on $($verify.VerifiedOn); the $($Config.overlapDays)-day overlap ended $($overlapEnds.ToString('yyyy-MM-dd')); removes $(@($older.KeyId) -join ', ')" }
            }
            continue
        }

        if (-not $current) {
            # Key Vault already holds a newer certificate that isn't on the app: attach it, once approved.
            $kvLife = ($kvExp - $kvNbf).TotalDays
            if ($kvExp -le $AsOf) {
                & $add @{ Action = 'KeyVaultCertificateExpired'; Name = $r.Name; Object = $kvRef; Write = $false; Detail = "Key Vault's current certificate expired $($kvExp.ToString('yyyy-MM-dd'))" }
                $findings.Add((New-NpiFinding -Rule 'NPI-ROT-03' -Severity Finding -ObjectKey "kvexpired:$($r.ObjectId)" -Object "$($r.Name) (AppRegistration)" -Issue 'Key Vault''s current certificate is expired'))
                continue
            }
            if ($kvLife -gt $cap) {
                & $add @{ Action = 'LifetimeOverCap'; Name = $r.Name; Object = $kvRef; Write = $false; Detail = "Key Vault's new certificate lasts $([int]$kvLife) days; the cap for this app is $cap. Shorten the certificate policy and renew again" }
                $findings.Add((New-NpiFinding -Rule 'NPI-ROT-05' -Severity Finding -ObjectKey "kvlifetime:$($r.ObjectId)" -Object "$($r.Name) (AppRegistration)" -Issue "Key Vault's new certificate lasts $([int]$kvLife) days; the cap is $cap"))
                continue
            }
            if (-not $approved) { & $needApproval "Key Vault holds a new certificate ($kvThumb) that isn't on the app"; continue }
            $existing = @($withThumb | ForEach-Object { [ordered]@{ keyId = $_.Raw['keyId']; type = $_.Raw['type']; usage = $_.Raw['usage']; key = $_.Raw['key']; displayName = $_.Raw['displayName'] } })
            $newCred = [ordered]@{ type = 'AsymmetricX509Cert'; usage = 'Verify'; key = $kv['cer']; displayName = $kv['policy']['x509_props']['subject'] }
            & $add @{ Action = 'AttachNewCertificate'; Name = $r.Name; Object = $reqId; Write = $true; Call = 'graph-ch04-app-keys-update'; Method = 'PATCH'; Target = "$g/v1.0/applications/$($r.ObjectId)"
                Body = [ordered]@{ keyCredentials = @($existing) + @($newCred) }; Precheck = [ordered]@{ call = 'graph-ch04-application-get'; keyIds = $keyIds; add = $kvThumb; vault = $bind.Vault; certificate = $bind.CertificateName }
                Detail = "Approved by $($approval.ApprovedBy) on $($approval.ApprovedOn); adds $kvThumb ($($kvNbf.ToString('yyyy-MM-dd')) to $($kvExp.ToString('yyyy-MM-dd')), $([int]$kvLife) days) beside $($old.KeyId)" }
            continue
        }

        # Only Key Vault's current certificate is on the app.
        $daysLeft = ($current.End - $AsOf).TotalDays
        if ($current.End -le $AsOf) {
            & $add @{ Action = 'Expired'; Name = $r.Name; Object = $reqId; Write = $false; Detail = "The certificate expired $($current.End.ToString('yyyy-MM-dd')) with no replacement" }
            $findings.Add((New-NpiFinding -Rule 'NPI-ROT-03' -Severity Finding -ObjectKey $reqId -Object "$($r.Name) (AppRegistration)" -Issue 'A certificate expired with no replacement'))
        }
        if ($daysLeft -gt [int]$Config.raiseDays) { & $add @{ Action = 'NotDue'; Name = $r.Name; Object = $reqId; Write = $false; Detail = "Expires $($current.End.ToString('yyyy-MM-dd')), $([int][Math]::Floor($daysLeft)) days away; raised at $($Config.raiseDays)" }; continue }
        $months = [int]$kv['policy']['x509_props']['validity_months']
        if ($months * 31 -gt $cap) {
            & $add @{ Action = 'KeyVaultPolicyOverCap'; Name = $r.Name; Object = $kvRef; Write = $false; Detail = "The certificate policy's validity is $months months, which can exceed $cap days; set it to $([Math]::Floor($cap / 31)) months or less before renewing" }
            $findings.Add((New-NpiFinding -Rule 'NPI-ROT-05' -Severity Finding -ObjectKey "kvpolicy:$($r.ObjectId)" -Object "$($r.Name) (AppRegistration)" -Issue "Key Vault's certificate policy ($months months) can exceed the $cap-day cap"))
            continue
        }
        if (-not $approved) { & $needApproval "Expires $($current.End.ToString('yyyy-MM-dd')), $([int][Math]::Floor($daysLeft)) days away"; continue }
        $vh = Get-NpiVaultHost -Cloud $Cloud -Vault $bind.Vault
        & $add @{ Action = 'RenewInKeyVault'; Name = $r.Name; Object = $reqId; Write = $true; Call = 'kv-ch04-certificate-create'; Method = 'POST'; Target = "$vh/certificates/$($bind.CertificateName)/create?api-version=2025-07-01"
            Body = [ordered]@{}; Precheck = [ordered]@{ call = 'kv-ch04-certificate-get'; x5t = $kv['x5t']; vault = $bind.Vault; certificate = $bind.CertificateName }
            Detail = "Approved by $($approval.ApprovedBy) on $($approval.ApprovedOn); expires $($current.End.ToString('yyyy-MM-dd')); Key Vault's policy makes the next version ($months months)" }
    }

    $plan = [ordered]@{
        planVersion = 1; task = 'rotation-apply'; generated = $AsOf.ToString('o'); asOf = $AsOf.ToString('yyyy-MM-dd'); cloud = $Cloud; tenantId = $TenantId
        registerSha256 = $RegisterSha256; inputs = $InputSha256; overlapDays = [int]$Config.overlapDays; actions = $actions.ToArray()
    }
    [pscustomobject]@{ Plan = $plan; Requests = $requests.ToArray(); Findings = $findings.ToArray() }
}

# ----------------------------------------------------------------------------- the write path

function Assert-NpiCh04Body {
    param($Action, [string[]]$Keys)
    $b = ConvertTo-NpiHashtable $Action.Body
    $have = @($(if ($b) { $b.Keys }) | Sort-Object)
    if (@(Compare-Object $have @($Keys | Sort-Object)).Count) { throw "Action $($Action.ActionId): the body may hold only $($Keys -join ', '), not $($have -join ', ')." }
    $b
}

function Assert-NpiCh04PlannedWrite {
    <#
    .SYNOPSIS
        Every write must be a declared call of the writer's task, with the declared method, on this
        cloud's host, with a body this function allows. DELETE and PUT are never sent.
    .EXAMPLE
        # Throws on the first write in the plan that the policy-apply task doesn't allow.
        $writer = New-NpiCh04Client -Cloud gcc -Task policy-apply -Invoke (New-NpiCh04FixtureInvoker -Path tests/fixtures/ch04/tenant.json -AllowWrite).Invoke -TenantId $register.Manifest.tenantId
        foreach ($a in @($out.Plan.actions | Where-Object Write)) { Assert-NpiCh04PlannedWrite -Writer $writer -Action $a }
    #>
    param($Writer, $Action)
    $call = $Writer.Calls | Where-Object { $_.id -eq $Action.Call }
    if (-not $call) { throw "Action $($Action.ActionId): '$($Action.Call)' isn't declared for $($Writer.Task)." }
    if ($Action.Method -in 'DELETE', 'PUT') { throw "Action $($Action.ActionId): $($Action.Method) is never sent." }
    if ($call.method -ne $Action.Method) { throw "Action $($Action.ActionId): $($Action.Method) doesn't match the declared $($call.method)." }
    $g = [regex]::Escape($Writer.Cloud.Graph)
    switch ($call.id) {
        'graph-ch04-default-policy-update' {
            if ($Action.Target -notmatch "^$g/v1\.0/policies/defaultAppManagementPolicy$") { throw "Action $($Action.ActionId): unexpected target $($Action.Target)" }
            $b = ConvertTo-NpiHashtable $Action.Body
            foreach ($k in $b.Keys) { if ($k -notin 'isEnabled', 'applicationRestrictions', 'servicePrincipalRestrictions') { throw "Action $($Action.ActionId): the body may not set $k." } }
            if ($b['isEnabled'] -ne $true) { throw "Action $($Action.ActionId): the default policy is only ever enabled by this code." }
            foreach ($scope in 'applicationRestrictions', 'servicePrincipalRestrictions') {
                if (-not $b.ContainsKey($scope)) { continue }
                foreach ($col in $b[$scope].Keys) {
                    if ($col -notin 'passwordCredentials', 'keyCredentials') { throw "Action $($Action.ActionId): $scope.$col isn't a collection this code sets." }
                    foreach ($r in @($b[$scope][$col])) { if ($r['restrictionType'] -notin $script:V1Types[$col]) { throw "Action $($Action.ActionId): '$($r['restrictionType'])' isn't a v1.0 $col restriction." } }
                }
            }
        }
        'graph-ch04-app-policy-create' {
            if ($Action.Target -notmatch "^$g/v1\.0/policies/appManagementPolicies$") { throw "Action $($Action.ActionId): unexpected target $($Action.Target)" }
            $b = Assert-NpiCh04Body -Action $Action -Keys 'displayName', 'description', 'isEnabled', 'restrictions'
            if (-not $b.displayName -or -not $b.description) { throw "Action $($Action.ActionId): displayName and description are required." }
        }
        'graph-ch04-app-policy-assign' {
            if ($Action.Target -notmatch "^$g/v1\.0/applications/$script:Guid/appManagementPolicies/\`$ref$") { throw "Action $($Action.ActionId): unexpected target $($Action.Target)" }
            $b = Assert-NpiCh04Body -Action $Action -Keys '@odata.id'
            if ($b['@odata.id'] -notmatch "^($g/v1\.0/policies/appManagementPolicies/$script:Guid|\{created:.+\})$") { throw "Action $($Action.ActionId): @odata.id must be an app management policy on $($Writer.Cloud.Graph)." }
        }
        'graph-ch04-app-lock' {
            if ($Action.Target -notmatch "^$g/v1\.0/applications/$script:Guid$") { throw "Action $($Action.ActionId): unexpected target $($Action.Target)" }
            $b = Assert-NpiCh04Body -Action $Action -Keys 'servicePrincipalLockConfiguration'
            if ((ConvertTo-NpiCanonicalJson $b.servicePrincipalLockConfiguration) -ne (ConvertTo-NpiCanonicalJson ([ordered]@{ allProperties = $true; isEnabled = $true }))) { throw "Action $($Action.ActionId): the only lock body allowed is {""isEnabled"": true, ""allProperties"": true}." }
        }
        'graph-ch04-app-keys-update' {
            if ($Action.Target -notmatch "^$g/v1\.0/applications/$script:Guid$") { throw "Action $($Action.ActionId): unexpected target $($Action.Target)" }
            $b = Assert-NpiCh04Body -Action $Action -Keys 'keyCredentials'
            $creds = @($b.keyCredentials)
            $pre = $Action.Precheck
            $planned = @($pre.keyIds)
            foreach ($c in $creds) {
                if ($c['type'] -ne 'AsymmetricX509Cert' -or $c['usage'] -ne 'Verify' -or -not $c['key']) { throw "Action $($Action.ActionId): each credential must be an AsymmetricX509Cert for Verify, with its public key." }
            }
            $ids = @($creds | Where-Object { $_['keyId'] } | ForEach-Object { $_['keyId'] } | Sort-Object)
            $newOnes = @($creds | Where-Object { -not $_['keyId'] })
            switch ($Action.Action) {
                'AttachNewCertificate' {
                    if (@(Compare-Object $ids $planned).Count -or $newOnes.Count -ne 1) { throw "Action $($Action.ActionId): an attach keeps every existing certificate and adds exactly one." }
                }
                'RemoveOldCertificate' {
                    $remove = @($pre.remove)
                    $expect = @($planned | Where-Object { $_ -notin $remove } | Sort-Object)
                    if ($newOnes.Count -or -not $remove.Count -or @(Compare-Object $ids $expect).Count -or $ids -notcontains $pre.keep) { throw "Action $($Action.ActionId): a removal drops only the planned old certificates and keeps the new one." }
                }
                default { throw "Action $($Action.ActionId): no rule for $($Action.Action)." }
            }
        }
        'kv-ch04-certificate-create' {
            $vh = Get-NpiVaultHost -Cloud $Writer.Cloud.Name -Vault $Action.Precheck.vault
            if ($Action.Target -ne "$vh/certificates/$($Action.Precheck.certificate)/create?api-version=2025-07-01") { throw "Action $($Action.ActionId): unexpected target $($Action.Target)" }
            $b = ConvertTo-NpiHashtable $Action.Body
            if ($b -and $b.Count) { throw "Action $($Action.ActionId): the create body must be empty; the rotation never changes a certificate policy." }
        }
        default { throw "Action $($Action.ActionId): no rule for $($call.id)." }
    }
}

function Test-NpiNoWeakening {
    <#
    .SYNOPSIS
        Checks a PATCH body for the tenant default policy against the live policy. Returns the
        first restriction the body would drop or loosen (as scope.restrictionType), or $null when
        every enabled restriction is kept at least as strict.
    .EXAMPLE
        $live = Invoke-NpiCh04Get -Client $reader -CallId 'graph-ch04-default-policy-get' -Single
        $patch = @($out.Plan.actions | Where-Object Action -EQ 'PatchDefaultPolicy')[0]
        Test-NpiNoWeakening -Live $live -Body $patch.Body
    #>

    # Every restriction live now must still be in the body, enabled, and at least as strict.
    param($Live, $Body)
    $l = ConvertTo-NpiHashtable $Live; $b = ConvertTo-NpiHashtable $Body
    foreach ($scope in 'applicationRestrictions', 'servicePrincipalRestrictions') {
        if (-not $l[$scope]) { continue }
        foreach ($col in 'passwordCredentials', 'keyCredentials') {
            foreach ($r in @($l[$scope][$col] | Where-Object { $_ })) {
                if ($r.ContainsKey('state') -and $r['state'] -eq 'disabled') { continue }
                $mine = @($(if ($b[$scope] -and $b[$scope][$col]) { $b[$scope][$col] }) | Where-Object { $_ -and $_['restrictionType'] -eq $r['restrictionType'] }) | Select-Object -First 1
                if (-not $mine -or -not (Test-NpiStricter -A $mine -B $r)) { return "$scope.$($r['restrictionType'])" }
            }
        }
    }
    $null
}

function Invoke-NpiCredentialPlan {
    <#
    .SYNOPSIS
        Apply a reviewed policy or rotation plan. Without -Apply it's a dry run: it checks the plan
        and runs every precheck, and sends nothing. With -Apply it sends only the plan's writes, only
        if the plan file's SHA-256 is the one approved, the plan is for this tenant, cloud and task,
        no older than seven days, and each precheck still holds.
    .EXAMPLE
        # A dry run of a reviewed policy plan against the fake: no -Apply, so nothing is sent.
        $sha = Get-NpiFileHash -Path out/policy/policy-plan.json
        $writer = New-NpiCh04Client -Cloud gcc -Task policy-apply -Invoke (New-NpiCh04FixtureInvoker -Path tests/fixtures/ch04/tenant.json -AllowWrite).Invoke -TenantId $register.Manifest.tenantId
        Invoke-NpiCredentialPlan -PlanPath out/policy/policy-plan.json -ApprovedSha256 $sha -Writer $writer -AsOf ([datetime]'2026-10-30')
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$PlanPath, [Parameter(Mandatory)][string]$ApprovedSha256, [Parameter(Mandatory)]$Writer, [Parameter(Mandatory)][datetime]$AsOf, [int]$MaxPlanAgeDays = 7, [switch]$Apply)
    if ($Writer.Mode -ne 'write') { throw "Task '$($Writer.Task)' doesn't write." }
    $hash = Get-NpiFileHash -Path $PlanPath
    if ($hash -ne $ApprovedSha256.ToLowerInvariant()) { throw "The plan's SHA-256 is $hash, not the approved $ApprovedSha256; refusing to run a plan nobody reviewed." }
    $plan = Get-Content -LiteralPath $PlanPath -Raw | ConvertFrom-Json
    if ($plan.task -ne $Writer.Task) { throw "The plan is for task '$($plan.task)', not '$($Writer.Task)'." }
    if ($plan.tenantId -ne $Writer.TenantId) { throw "The plan is for tenant $($plan.tenantId), not $($Writer.TenantId)." }
    if ($plan.cloud -ne $Writer.Cloud.Name) { throw "The plan is for cloud $($plan.cloud), not $($Writer.Cloud.Name)." }
    $age = ($AsOf - (ConvertTo-NpiUtc $plan.generated)).TotalDays
    if ($age -gt $MaxPlanAgeDays) { throw "The plan is $([int]$age) days old; build and review a new one (the limit is $MaxPlanAgeDays)." }
    $g = $Writer.Cloud.Graph
    $results = [Collections.Generic.List[object]]::new(); $created = @{}
    $get = { param([string]$CallId, [hashtable]$Bind, [string]$Query, [string]$Vault, [switch]$Single) Invoke-NpiCh04Get -Client $Writer -CallId $CallId -Bind $Bind -Query $Query -Vault $Vault -Single:$Single }

    foreach ($a in @($plan.actions | Where-Object Write)) {
        Assert-NpiCh04PlannedWrite -Writer $Writer -Action $a
        $outcome = $null; $detail = ''; $target = $a.Target
        $body = ConvertTo-NpiHashtable $a.Body; if ($null -eq $body) { $body = @{} }
        switch ($a.Call) {
            'graph-ch04-default-policy-update' {
                $live = & $get 'graph-ch04-default-policy-get' @{} $null $null -Single
                $now = Get-NpiTextSha256 (ConvertTo-NpiCanonicalJson (Select-NpiPolicyCore $live))
                if ($now -ne $a.Precheck.sha256) { $outcome = 'Skipped'; $detail = 'The tenant default policy changed since the diff was reviewed; build a new plan' }
                elseif ($weak = Test-NpiNoWeakening -Live $live -Body $body) { throw "Action $($a.ActionId): the body would loosen or drop $weak; refusing." }
            }
            'graph-ch04-app-policy-create' {
                $existing = @(& $get 'graph-ch04-app-policies-list' @{} '$select=id,displayName' $null)
                $hit = @($existing | Where-Object { $_.displayName -eq $a.Precheck.absent })
                if ($hit.Count) { $outcome = 'Skipped'; $detail = 'A policy with this name exists'; $created[$a.Precheck.absent] = $hit[0].id }
            }
            'graph-ch04-app-policy-assign' {
                $ref = "$($body['@odata.id'])"
                if ($ref -match '^\{created:(.+)\}$') {
                    $name = $Matches[1]
                    if ($created.ContainsKey($name)) { $body['@odata.id'] = "$g/v1.0/policies/appManagementPolicies/$($created[$name])" }
                    elseif (-not $Apply) { $outcome = 'WouldSend'; $detail = "After the policy '$name' is created" }
                    else { $outcome = 'Skipped'; $detail = "The policy '$name' wasn't created in this run" }
                }
                if (-not $outcome) {
                    foreach ($p in @(& $get 'graph-ch04-app-policies-list' @{} '$select=id,displayName' $null)) {
                        $applies = @(& $get 'graph-ch04-app-policy-applies-to' @{ id = $p.id } '$select=id' $null)
                        if (@($applies | Where-Object { $_.id -eq $a.Precheck.unassigned }).Count) { $outcome = 'Skipped'; $detail = "The app already has '$($p.displayName)'"; break }
                    }
                }
            }
            'graph-ch04-app-lock' {
                $app = & $get 'graph-ch04-application-get' @{ id = $a.Precheck.notLocked } '$select=id,servicePrincipalLockConfiguration' $null -Single
                $l = $app['servicePrincipalLockConfiguration']
                if ($l -and $l['isEnabled'] -and $l['allProperties']) { $outcome = 'Skipped'; $detail = 'Already locked' }
            }
            'graph-ch04-app-keys-update' {
                $appId = ($a.Target -split '/')[-1]
                $app = & $get 'graph-ch04-application-get' @{ id = $appId } '$select=id,keyCredentials' $null -Single
                $ids = @($app['keyCredentials'] | Where-Object { $_ } | ForEach-Object { $_['keyId'] } | Sort-Object)
                if (@(Compare-Object $ids @($a.Precheck.keyIds)).Count) { $outcome = 'Skipped'; $detail = 'The app''s certificates changed since the plan was reviewed' }
                elseif ($a.Action -eq 'AttachNewCertificate') {
                    $kv = & $get 'kv-ch04-certificate-get' @{ name = $a.Precheck.certificate } $null $a.Precheck.vault -Single
                    if ((ConvertFrom-NpiX5t $kv['x5t']) -ne $a.Precheck.add) { $outcome = 'Skipped'; $detail = 'Key Vault''s current certificate changed since the plan was reviewed' }
                }
            }
            'kv-ch04-certificate-create' {
                $kv = & $get 'kv-ch04-certificate-get' @{ name = $a.Precheck.certificate } $null $a.Precheck.vault -Single
                if ($kv['x5t'] -ne $a.Precheck.x5t) { $outcome = 'Skipped'; $detail = 'Key Vault already has a newer version; plan again to attach it' }
            }
        }
        if (-not $outcome) {
            if (-not $Apply) { $outcome = 'WouldSend' }
            else {
                $host2 = if ($a.Call -like 'kv-*') { Get-NpiVaultHost -Cloud $Writer.Cloud.Name -Vault $a.Precheck.vault } else { $g }
                Assert-NpiHost -Uri $target -ExpectedHost $host2
                $Writer.Evidence.Add([pscustomobject]@{ Call = $a.Call; Method = $a.Method; Target = $target; At = [DateTime]::UtcNow.ToString('o') })
                $resp = & $Writer.Invoke $a.Method $target $body $null
                $outcome = 'Sent'
                switch ($a.Action) {
                    'CreateAppPolicy' { $created[$a.Precheck.absent] = $resp['id']; $detail = "Created $($resp['id'])" }
                    'RenewInKeyVault' {
                        $status = $resp['status']
                        for ($i = 0; $i -lt 10 -and $status -eq 'inProgress'; $i++) {
                            $op = & $get 'kv-ch04-certificate-pending' @{ name = $a.Precheck.certificate } $null $a.Precheck.vault -Single
                            $status = $op['status']
                        }
                        $detail = if ($status -eq 'completed') { 'Key Vault created the next version; plan again to attach it after review' } else { "The create operation is $status; poll it again before planning" }
                    }
                    'AttachNewCertificate' { $detail = "Record the verification when the workload signs in with $($a.Precheck.add)" }
                    'RemoveOldCertificate' { $detail = 'Old certificate removed after the overlap' }
                }
            }
        }
        $results.Add([pscustomobject]@{ ActionId = $a.ActionId; Action = $a.Action; Name = $a.Name; Method = $a.Method; Target = $target; Outcome = $outcome; Detail = $detail })
    }
    [pscustomobject]@{ PlanSha256 = $hash; Task = $plan.task; Mode = $(if ($Apply) { 'Apply' } else { 'DryRun' }); Results = $results.ToArray(); Evidence = $Writer.Evidence.ToArray() }
}

Export-ModuleMember -Function ConvertFrom-NpiIsoDuration, ConvertTo-NpiCanonicalJson, ConvertTo-NpiSortedNode, Write-NpiSortedJson, Format-NpiDate, ConvertFrom-NpiX5t, ConvertFrom-NpiCustomKeyIdentifier, Get-NpiCh04CallList, Get-NpiCh04Task,
    Get-NpiCh04Call, Get-NpiCh04RequiredPermission, Get-NpiVaultHost, New-NpiCh04Client, Resolve-NpiCh04Uri, Invoke-NpiCh04Get, New-NpiCh04LiveInvoker,
    New-NpiCh04FixtureInvoker, Invoke-NpiCh04Fake, ConvertFrom-NpiFakeCert, New-NpiFakeCertBlob, Import-NpiCh04Register, Import-NpiCh04Input, Export-NpiCh04Run,
    Get-NpiAppPolicyState, Compare-NpiAppPolicy, New-NpiPolicyPlan, New-NpiRotationPlan, Assert-NpiCh04PlannedWrite, Test-NpiNoWeakening, Invoke-NpiCredentialPlan
