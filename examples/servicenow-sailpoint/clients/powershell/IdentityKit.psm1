# IdentityKit.psm1 - shared pieces for the ServiceNow + SailPoint ISC example clients.
#
# Illustrative code: unit-tested with Pester against mocked responses, not yet
# proven against live tenants. PowerShell 7.2 or later.
#
# Config from environment variables or a JSON file (never secrets in the file);
# token acquisition for SailPoint ISC, ServiceNow and Microsoft Graph; one REST
# wrapper that retries 429/503 honoring Retry-After; paging for Graph
# (@odata.nextLink), ISC Search (searchAfter), ISC lists (limit/offset) and the
# ServiceNow Table API (sysparm_limit/sysparm_offset); the drift reconciliation
# and the re-read verification logic that the two scripts call.

$script:KitVersion = '0.1.0-pass1'

$script:SecretKeys = @(
    'SAILPOINT_CLIENT_SECRET', 'SAILPOINT_ACCESS_TOKEN', 'SN_CLIENT_SECRET', 'SN_PASSWORD',
    'SN_ACCESS_TOKEN', 'GRAPH_CLIENT_SECRET', 'GRAPH_ACCESS_TOKEN'
)
$script:ConfigKeys = @(
    'SAILPOINT_TENANT', 'SAILPOINT_API_BASE', 'SAILPOINT_CLIENT_ID', 'SN_INSTANCE', 'SN_BASE_URL',
    'SN_CLIENT_ID', 'SN_USERNAME', 'SN_FINDING_API_PATH', 'SN_FINDING_TABLE',
    'SN_STATE_AWAITING_VERIFICATION', 'SN_STATE_CLOSED', 'SN_STATE_REOPENED', 'GRAPH_TENANT_ID',
    'GRAPH_CLIENT_ID', 'GRAPH_CERT_PATH', 'GRAPH_CERT_THUMBPRINT', 'GRAPH_CLOUD',
    'ISC_EMPLOYEE_ID_ATTRIBUTE', 'ISC_AUTHORITATIVE_SOURCES', 'ALLOWED_WRITER_APP_IDS'
) + $script:SecretKeys
$script:Defaults = [ordered]@{
    SN_FINDING_API_PATH            = '/api/x_example_idkit/identity_findings/finding'
    SN_FINDING_TABLE               = 'u_identity_finding'
    SN_STATE_AWAITING_VERIFICATION = '18'   # program design: a custom state value
    SN_STATE_CLOSED                = '3'
    SN_STATE_REOPENED              = '1'
    GRAPH_CLOUD                    = 'Global'
    ISC_EMPLOYEE_ID_ATTRIBUTE      = 'employeeNumber'
}
# Microsoft Learn, "Microsoft Graph national cloud deployments". GCC uses Global.
$script:GraphClouds = @{
    Global   = @('https://login.microsoftonline.com', 'https://graph.microsoft.com')
    USGov    = @('https://login.microsoftonline.us', 'https://graph.microsoft.us')
    USGovDoD = @('https://login.microsoftonline.us', 'https://dod-graph.microsoft.us')
}
$script:ClassSeverity = @{
    missing_identity = 'High'; stale_access = 'High'; orphan_account = 'High'; attribute_drift = 'Medium'
    unauthorized_write = 'High'; credential_drift = 'High'; schema_drift = 'Medium'
}
$script:SeverityToPriority = @{ High = 'P2'; Medium = 'P3' }   # design guidance
$script:ActiveStatuses = @('active', 'leave', 'on leave', 'loa')
$script:TerminatedStatuses = @('terminated', 'separated', 'inactive', 'retired', 'deceased')
$script:WatchedAuditProperties = @('Department', 'EmployeeId', 'JobTitle', 'Manager', 'CompanyName',
    'EmployeeType', 'OfficeLocation')
$script:CsvFields = @('finding_id', 'drift_class', 'severity', 'priority', 'system', 'employee_id',
    'object_id', 'object_name', 'attribute', 'expected', 'observed', 'detected_at', 'evidence')
$script:RecordFields = @('sys_id', 'number', 'state', 'u_system', 'u_account_id', 'u_identity_id',
    'u_subject_id', 'u_intended_state', 'u_awaiting_since', 'u_drift_class')

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

function Get-KitEnvValue {
    <#
    .SYNOPSIS
    Return a named setting from the -Environment hashtable when one is given, otherwise
    from the process environment variable of that name.
    .EXAMPLE
    Get-KitEnvValue -Name 'SAILPOINT_ACCESS_TOKEN' -Environment @{ SAILPOINT_ACCESS_TOKEN = 'token-from-vault' }
    #>
    [OutputType([string])]
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Name, [hashtable]$Environment)
    if ($null -ne $Environment) { return $Environment[$Name] }
    return [Environment]::GetEnvironmentVariable($Name)
}

function Get-KitConfig {
    <#
    .SYNOPSIS
    Merge defaults, an optional JSON config file, then environment variables (env wins).
    A secret key found in the file is refused.
    .EXAMPLE
    # From the kit root: the example file supplies the non-secret settings.
    $cfg = Get-KitConfig -Path ./config/config.example.json
    #>
    [OutputType([hashtable])]
    [CmdletBinding()]
    param([string]$Path, [hashtable]$Environment)
    $cfg = @{}
    foreach ($k in $script:Defaults.Keys) { $cfg[$k] = $script:Defaults[$k] }
    if ($Path) {
        $data = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
        $bad = @($data.Keys | Where-Object { $script:SecretKeys -contains $_ } | Sort-Object)
        if ($bad.Count -gt 0) {
            throw "Config file must not contain secrets: $($bad -join ', '). Set them as environment variables or fetch a token from your vault."
        }
        foreach ($k in $data.Keys) {
            if ($script:ConfigKeys -contains $k -and $null -ne $data[$k]) { $cfg[$k] = [string]$data[$k] }
        }
    }
    foreach ($k in $script:ConfigKeys) {
        $v = Get-KitEnvValue -Name $k -Environment $Environment
        if ($v) { $cfg[$k] = $v }
    }
    return $cfg
}

function Get-KitIscBaseUrl {
    <#
    .SYNOPSIS
    Return the SailPoint ISC API base URL: SAILPOINT_API_BASE when set, otherwise
    https://{SAILPOINT_TENANT}.api.identitynow.com.
    .EXAMPLE
    Get-KitIscBaseUrl -Config @{ SAILPOINT_TENANT = 'example' }   # https://example.api.identitynow.com
    #>
    [OutputType([string])]
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Config)
    if ($Config.SAILPOINT_API_BASE) { return $Config.SAILPOINT_API_BASE.TrimEnd('/') }
    if (-not $Config.SAILPOINT_TENANT) { throw 'Set SAILPOINT_TENANT (or SAILPOINT_API_BASE).' }
    return "https://$($Config.SAILPOINT_TENANT).api.identitynow.com"
}

function Get-KitSnBaseUrl {
    <#
    .SYNOPSIS
    Return the ServiceNow instance base URL: SN_BASE_URL when set, otherwise
    https://{SN_INSTANCE}.service-now.com.
    .EXAMPLE
    Get-KitSnBaseUrl -Config @{ SN_INSTANCE = 'contoso' }   # https://contoso.service-now.com
    #>
    [OutputType([string])]
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Config)
    if ($Config.SN_BASE_URL) { return $Config.SN_BASE_URL.TrimEnd('/') }
    if (-not $Config.SN_INSTANCE) { throw 'Set SN_INSTANCE (or SN_BASE_URL).' }
    return "https://$($Config.SN_INSTANCE).service-now.com"
}

function Get-KitGraphEndpoint {
    <#
    .SYNOPSIS
    Returns @(loginRoot, graphRoot) for GRAPH_CLOUD (Global, USGov, USGovDoD).
    .EXAMPLE
    (Get-KitGraphEndpoint -Config @{ GRAPH_CLOUD = 'USGov' })[1]   # https://graph.microsoft.us
    #>
    [OutputType([string[]])]
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Config)
    $cloud = if ($Config.GRAPH_CLOUD) { $Config.GRAPH_CLOUD } else { 'Global' }
    if (-not $script:GraphClouds.ContainsKey($cloud)) {
        throw "GRAPH_CLOUD must be one of Global, USGov, USGovDoD; got '$cloud'."
    }
    return $script:GraphClouds[$cloud]
}

# ---------------------------------------------------------------------------
# REST with retries
# ---------------------------------------------------------------------------

function Get-KitStatusCode {
    <#
    .SYNOPSIS
    Return the HTTP status code from a failed web request's error record, or 0 when the
    error carries no response.
    .EXAMPLE
    try { Invoke-RestMethod -Uri 'https://example.api.identitynow.com/v3/accounts/missing' } catch { Get-KitStatusCode -ErrorRecord $_ }
    #>
    [OutputType([int])]
    [CmdletBinding()]
    param([Parameter(Mandatory)]$ErrorRecord)
    $resp = $ErrorRecord.Exception.Response
    if ($null -eq $resp) { return 0 }
    return [int]$resp.StatusCode
}

function ConvertFrom-KitRetryAfter {
    <#
    .SYNOPSIS
    Seconds to wait from a Retry-After header (delta seconds or HTTP date).
    .EXAMPLE
    try { Invoke-RestMethod -Uri 'https://graph.microsoft.com/v1.0/users' } catch { ConvertFrom-KitRetryAfter -Response $_.Exception.Response -Default 2 }
    #>
    [OutputType([double])]
    [CmdletBinding()]
    param($Response, [double]$Default = 5)
    $ra = $null
    if ($null -ne $Response -and $null -ne $Response.Headers) { $ra = $Response.Headers.RetryAfter }
    if ($null -eq $ra) { return [double]$Default }
    if ($null -ne $ra.Delta) { return [double]$ra.Delta.TotalSeconds }
    if ($null -ne $ra.Date) { return [math]::Max(0, ($ra.Date - [DateTimeOffset]::UtcNow).TotalSeconds) }
    return [double]$Default
}

function Invoke-KitRequest {
    <#
    .SYNOPSIS
    Invoke-RestMethod with retries on 429 and 503 that honor Retry-After.
    .EXAMPLE
    $cfg = Get-KitConfig -Path ./config/config.example.json
    Invoke-KitRequest -Method GET -Uri 'https://contoso.service-now.com/api/now/table/u_identity_finding?sysparm_limit=1' -Headers (Get-KitSnHeader -Config $cfg)
    #>
    [OutputType([object])]
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Method,
        [Parameter(Mandatory)][string]$Uri,
        [hashtable]$Headers = @{},
        $Body,
        [string]$ContentType,
        [int]$MaxRetries = 5
    )
    $attempt = 0
    while ($true) {
        $params = @{ Method = $Method; Uri = $Uri; Headers = $Headers; ErrorAction = 'Stop' }
        if ($null -ne $Body) { $params.Body = $Body }
        if ($ContentType) { $params.ContentType = $ContentType }
        try {
            return Invoke-RestMethod @params
        }
        catch {
            $status = Get-KitStatusCode -ErrorRecord $_
            if (($status -eq 429 -or $status -eq 503) -and $attempt -lt $MaxRetries) {
                $delay = ConvertFrom-KitRetryAfter -Response $_.Exception.Response -Default ([math]::Min([math]::Pow(2, $attempt), 60))
                Start-Sleep -Milliseconds ([int]($delay * 1000))
                $attempt++
                continue
            }
            throw
        }
    }
}

function ConvertTo-KitJsonBody {
    <#
    .SYNOPSIS
    Convert an object to compact JSON (depth 20) for a request body.
    .EXAMPLE
    ConvertTo-KitJsonBody -InputObject @{ indices = @('identities'); query = @{ query = '*' } }
    #>
    [OutputType([string])]
    [CmdletBinding()]
    param([Parameter(Mandatory)]$InputObject)
    return ($InputObject | ConvertTo-Json -Depth 20 -Compress)
}

# ---------------------------------------------------------------------------
# Tokens
# ---------------------------------------------------------------------------

function Get-KitIscHeader {
    <#
    .SYNOPSIS
    Bearer header for ISC: SAILPOINT_ACCESS_TOKEN (from a vault), else client credentials
    at https://{tenant}.api.identitynow.com/oauth/token.
    .EXAMPLE
    # Reads SAILPOINT_ACCESS_TOKEN, or SAILPOINT_CLIENT_SECRET, from the environment.
    $ih = Get-KitIscHeader -Config (Get-KitConfig -Path ./config/config.example.json)
    #>
    [OutputType([hashtable])]
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Config, [hashtable]$Environment)
    $token = Get-KitEnvValue -Name 'SAILPOINT_ACCESS_TOKEN' -Environment $Environment
    if (-not $token) {
        $secret = Get-KitEnvValue -Name 'SAILPOINT_CLIENT_SECRET' -Environment $Environment
        if (-not $Config.SAILPOINT_CLIENT_ID -or -not $secret) {
            throw 'Set SAILPOINT_ACCESS_TOKEN, or SAILPOINT_CLIENT_ID and SAILPOINT_CLIENT_SECRET.'
        }
        $form = @{ grant_type = 'client_credentials'; client_id = $Config.SAILPOINT_CLIENT_ID; client_secret = $secret }
        $resp = Invoke-KitRequest -Method POST -Uri ((Get-KitIscBaseUrl -Config $Config) + '/oauth/token') -Body $form -ContentType 'application/x-www-form-urlencoded'
        $token = $resp.access_token
    }
    return @{ Authorization = "Bearer $token"; Accept = 'application/json' }
}

function Get-KitSnHeader {
    <#
    .SYNOPSIS
    Auth header for ServiceNow: SN_ACCESS_TOKEN, OAuth client credentials at
    /oauth_token.do, or basic (SN_USERNAME + SN_PASSWORD).
    .EXAMPLE
    # Reads SN_ACCESS_TOKEN, SN_CLIENT_SECRET or SN_PASSWORD from the environment.
    $sn = Get-KitSnHeader -Config (Get-KitConfig -Path ./config/config.example.json)
    #>
    [OutputType([hashtable])]
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Config, [hashtable]$Environment)
    $headers = @{ Accept = 'application/json' }
    $token = Get-KitEnvValue -Name 'SN_ACCESS_TOKEN' -Environment $Environment
    $secret = Get-KitEnvValue -Name 'SN_CLIENT_SECRET' -Environment $Environment
    if (-not $token -and $Config.SN_CLIENT_ID -and $secret) {
        $form = @{ grant_type = 'client_credentials'; client_id = $Config.SN_CLIENT_ID; client_secret = $secret }
        $token = (Invoke-KitRequest -Method POST -Uri ((Get-KitSnBaseUrl -Config $Config) + '/oauth_token.do') -Body $form -ContentType 'application/x-www-form-urlencoded').access_token
    }
    if ($token) { $headers.Authorization = "Bearer $token"; return $headers }
    $pw = Get-KitEnvValue -Name 'SN_PASSWORD' -Environment $Environment
    if ($Config.SN_USERNAME -and $pw) {
        $raw = [Text.Encoding]::UTF8.GetBytes("$($Config.SN_USERNAME):$pw")
        $headers.Authorization = 'Basic ' + [Convert]::ToBase64String($raw)
        return $headers
    }
    throw 'Set SN_ACCESS_TOKEN, SN_CLIENT_ID+SN_CLIENT_SECRET, or SN_USERNAME+SN_PASSWORD.'
}

function ConvertTo-KitBase64Url {
    <#
    .SYNOPSIS
    Encode bytes as base64url without padding, the encoding a JWT uses.
    .EXAMPLE
    ConvertTo-KitBase64Url -Bytes ([Text.Encoding]::UTF8.GetBytes('{"alg":"PS256"}'))
    #>
    [OutputType([string])]
    [CmdletBinding()]
    param([Parameter(Mandatory)][byte[]]$Bytes)
    return [Convert]::ToBase64String($Bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

function ConvertTo-KitClientAssertion {
    <#
    .SYNOPSIS
    Certificate-signed JWT client assertion for the Microsoft identity platform:
    PS256, x5t#S256 header, aud/iss/sub/jti/nbf/exp claims.
    .EXAMPLE
    $cert = Get-KitGraphCertificate -Config @{ GRAPH_CERT_PATH = './graph-client.pem' }
    ConvertTo-KitClientAssertion -Certificate $cert -ClientId '00000000-0000-0000-0000-000000000000' -Audience 'https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token'
    #>
    [OutputType([string])]
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][System.Security.Cryptography.X509Certificates.X509Certificate2]$Certificate,
        [Parameter(Mandatory)][string]$ClientId,
        [Parameter(Mandatory)][string]$Audience,
        [long]$Now = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    )
    $sha = [System.Security.Cryptography.SHA256]::Create()
    $x5t = ConvertTo-KitBase64Url -Bytes $sha.ComputeHash($Certificate.RawData)
    $header = [ordered]@{ alg = 'PS256'; typ = 'JWT'; 'x5t#S256' = $x5t } | ConvertTo-Json -Compress
    $claims = [ordered]@{ aud = $Audience; iss = $ClientId; sub = $ClientId; jti = [guid]::NewGuid().ToString()
        nbf = $Now; iat = $Now; exp = $Now + 600 } | ConvertTo-Json -Compress
    $signingInput = (ConvertTo-KitBase64Url -Bytes ([Text.Encoding]::UTF8.GetBytes($header))) + '.' +
        (ConvertTo-KitBase64Url -Bytes ([Text.Encoding]::UTF8.GetBytes($claims)))
    $rsa = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($Certificate)
    if ($null -eq $rsa) { throw 'The certificate has no accessible RSA private key.' }
    $sig = $rsa.SignData([Text.Encoding]::UTF8.GetBytes($signingInput),
        [System.Security.Cryptography.HashAlgorithmName]::SHA256,
        [System.Security.Cryptography.RSASignaturePadding]::Pss)
    return $signingInput + '.' + (ConvertTo-KitBase64Url -Bytes $sig)
}

function Get-KitGraphCertificate {
    <#
    .SYNOPSIS
    Return the Microsoft Graph client certificate: from Cert:\CurrentUser\My by
    GRAPH_CERT_THUMBPRINT, else from the PEM file (certificate and key) at GRAPH_CERT_PATH,
    else $null.
    .EXAMPLE
    $cert = Get-KitGraphCertificate -Config @{ GRAPH_CERT_PATH = './graph-client.pem' }
    #>
    [OutputType([System.Security.Cryptography.X509Certificates.X509Certificate2])]
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Config)
    if ($Config.GRAPH_CERT_THUMBPRINT -and (Test-Path -LiteralPath "Cert:\CurrentUser\My\$($Config.GRAPH_CERT_THUMBPRINT)")) {
        return Get-Item -LiteralPath "Cert:\CurrentUser\My\$($Config.GRAPH_CERT_THUMBPRINT)"
    }
    if ($Config.GRAPH_CERT_PATH) {
        return [System.Security.Cryptography.X509Certificates.X509Certificate2]::CreateFromPemFile($Config.GRAPH_CERT_PATH)
    }
    return $null
}

function Get-KitGraphHeader {
    <#
    .SYNOPSIS
    Bearer header for Microsoft Graph via client credentials. Certificate preferred
    (GRAPH_CERT_THUMBPRINT in CurrentUser\My, or GRAPH_CERT_PATH PEM); GRAPH_CLIENT_SECRET
    is the fallback; GRAPH_ACCESS_TOKEN skips acquisition.
    .EXAMPLE
    # Set GRAPH_TENANT_ID and GRAPH_CLIENT_ID, plus GRAPH_CERT_PATH or GRAPH_CERT_THUMBPRINT.
    $gh = Get-KitGraphHeader -Config (Get-KitConfig -Path ./config/config.example.json)
    #>
    [OutputType([hashtable])]
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Config, [hashtable]$Environment)
    $token = Get-KitEnvValue -Name 'GRAPH_ACCESS_TOKEN' -Environment $Environment
    if (-not $token) {
        $endpoints = Get-KitGraphEndpoint -Config $Config
        if (-not $Config.GRAPH_TENANT_ID -or -not $Config.GRAPH_CLIENT_ID) {
            throw 'Set GRAPH_TENANT_ID and GRAPH_CLIENT_ID (or GRAPH_ACCESS_TOKEN).'
        }
        $tokenUrl = "$($endpoints[0])/$($Config.GRAPH_TENANT_ID)/oauth2/v2.0/token"
        $form = @{ grant_type = 'client_credentials'; client_id = $Config.GRAPH_CLIENT_ID; scope = "$($endpoints[1])/.default" }
        $cert = Get-KitGraphCertificate -Config $Config
        $secret = Get-KitEnvValue -Name 'GRAPH_CLIENT_SECRET' -Environment $Environment
        if ($null -ne $cert) {
            $form.client_assertion_type = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'
            $form.client_assertion = ConvertTo-KitClientAssertion -Certificate $cert -ClientId $Config.GRAPH_CLIENT_ID -Audience $tokenUrl
        }
        elseif ($secret) {
            $form.client_secret = $secret
        }
        else {
            throw 'Set GRAPH_CERT_THUMBPRINT or GRAPH_CERT_PATH (preferred) or GRAPH_CLIENT_SECRET, or GRAPH_ACCESS_TOKEN.'
        }
        $token = (Invoke-KitRequest -Method POST -Uri $tokenUrl -Body $form -ContentType 'application/x-www-form-urlencoded').access_token
    }
    return @{ Authorization = "Bearer $token"; Accept = 'application/json' }
}

# ---------------------------------------------------------------------------
# Paging
# ---------------------------------------------------------------------------

function Get-KitGraphPaged {
    <#
    .SYNOPSIS
    Follow @odata.nextLink as an opaque URL until the last page.
    .EXAMPLE
    $users = @(Get-KitGraphPaged -Uri 'https://graph.microsoft.com/v1.0/users?$select=id,employeeId,accountEnabled&$top=999' -Headers $gh)
    #>
    [OutputType([object])]
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Uri, [hashtable]$Headers = @{})
    $next = $Uri
    while ($next) {
        $page = Invoke-KitRequest -Method GET -Uri $next -Headers $Headers
        foreach ($item in @($page.value)) { if ($null -ne $item) { $item } }
        $next = $page.'@odata.nextLink'
    }
}

function Get-KitIscSearchPaged {
    <#
    .SYNOPSIS
    POST /v3/search with searchAfter paging, sorted on id.
    .EXAMPLE
    $ids = @(Get-KitIscSearchPaged -BaseUrl 'https://example.api.identitynow.com' -Headers $ih -Body @{ indices = @('identities'); query = @{ query = '*' } })
    #>
    [OutputType([object], [object[]])]
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$BaseUrl, [hashtable]$Headers = @{},
        [Parameter(Mandatory)][hashtable]$Body, [int]$PageSize = 250)
    $query = @{} + $Body
    if (-not $query.ContainsKey('sort')) { $query.sort = @('id') }
    while ($true) {
        $page = @(Invoke-KitRequest -Method POST -Uri "$BaseUrl/v3/search?limit=$PageSize" -Headers $Headers -Body (ConvertTo-KitJsonBody $query) -ContentType 'application/json')
        $page = @($page | Where-Object { $null -ne $_ })
        $page
        if ($page.Count -lt $PageSize) { return }
        $query.searchAfter = @([string]$page[-1].id)
    }
}

function Get-KitIscListPaged {
    <#
    .SYNOPSIS
    GET list APIs such as /v3/accounts with limit/offset paging.
    .EXAMPLE
    $orphans = @(Get-KitIscListPaged -Uri 'https://example.api.identitynow.com/v3/accounts' -Headers $ih -Filters 'uncorrelated eq true')
    #>
    [OutputType([object], [object[]])]
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Uri, [hashtable]$Headers = @{}, [string]$Filters, [int]$Limit = 250)
    $offset = 0
    while ($true) {
        $q = "limit=$Limit&offset=$offset"
        if ($Filters) { $q += '&filters=' + [uri]::EscapeDataString($Filters) }
        $page = @(Invoke-KitRequest -Method GET -Uri "$Uri`?$q" -Headers $Headers | Where-Object { $null -ne $_ })
        $page
        if ($page.Count -lt $Limit) { return }
        $offset += $Limit
    }
}

function Get-KitSnTablePaged {
    <#
    .SYNOPSIS
    GET /api/now/table/{table} with sysparm_offset and sysparm_limit.
    .EXAMPLE
    Get-KitSnTablePaged -BaseUrl 'https://contoso.service-now.com' -Table 'u_identity_finding' -Headers $sn -Query 'active=true' -Fields 'sys_id', 'number', 'state'
    #>
    [OutputType([object], [object[]])]
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$BaseUrl, [Parameter(Mandatory)][string]$Table, [hashtable]$Headers = @{},
        [string]$Query, [string[]]$Fields, [int]$Limit = 100)
    $offset = 0
    while ($true) {
        $q = 'sysparm_query=' + [uri]::EscapeDataString($Query) + "&sysparm_limit=$Limit&sysparm_offset=$offset&sysparm_exclude_reference_link=true"
        if ($Fields) { $q += '&sysparm_fields=' + ($Fields -join ',') }
        $resp = Invoke-KitRequest -Method GET -Uri "$BaseUrl/api/now/table/$Table`?$q" -Headers $Headers
        $page = @($resp.result | Where-Object { $null -ne $_ })
        $page
        if ($page.Count -lt $Limit) { return }
        $offset += $Limit
    }
}

# ---------------------------------------------------------------------------
# Evidence helpers
# ---------------------------------------------------------------------------

function ConvertTo-KitCanonicalJson {
    <#
    .SYNOPSIS
    Compact JSON with object keys sorted, for hashing.
    .EXAMPLE
    ConvertTo-KitCanonicalJson -InputObject ([ordered]@{ b = 2; a = 1 })   # {"a":1,"b":2}
    #>
    [OutputType([string])]
    [CmdletBinding()]
    param([AllowNull()]$InputObject)
    if ($null -eq $InputObject) { return 'null' }
    if ($InputObject -is [string]) { return ($InputObject | ConvertTo-Json -Compress) }
    if ($InputObject -is [bool]) { return $InputObject.ToString().ToLowerInvariant() }
    if ($InputObject -is [datetime]) { return ($InputObject.ToUniversalTime().ToString('o') | ConvertTo-Json -Compress) }
    if ($InputObject -is [ValueType]) { return ($InputObject | ConvertTo-Json -Compress) }
    if ($InputObject -is [System.Collections.IDictionary]) {
        [string[]]$keys = @($InputObject.Keys | ForEach-Object { [string]$_ })
        [Array]::Sort($keys, [StringComparer]::Ordinal)
        $parts = foreach ($k in $keys) {
            ($k | ConvertTo-Json -Compress) + ':' + (ConvertTo-KitCanonicalJson $InputObject[$k])
        }
        return '{' + ($parts -join ',') + '}'
    }
    if ($InputObject -is [System.Management.Automation.PSCustomObject]) {
        $h = [ordered]@{}
        foreach ($p in $InputObject.PSObject.Properties) { $h[$p.Name] = $p.Value }
        return ConvertTo-KitCanonicalJson $h
    }
    if ($InputObject -is [System.Collections.IEnumerable]) {
        $items = foreach ($i in $InputObject) { ConvertTo-KitCanonicalJson $i }
        return '[' + (@($items) -join ',') + ']'
    }
    return ([string]$InputObject | ConvertTo-Json -Compress)
}

function Get-KitSha256 {
    <#
    .SYNOPSIS
    Return the lowercase hex SHA-256 of an object's canonical JSON, so the same content
    hashes the same whatever its key order.
    .EXAMPLE
    Get-KitSha256 -InputObject ([ordered]@{ a = 1; b = 2 })
    #>
    [OutputType([string])]
    [CmdletBinding()]
    param([AllowNull()]$InputObject)
    $bytes = [Text.Encoding]::UTF8.GetBytes((ConvertTo-KitCanonicalJson $InputObject))
    $hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
    return -join ($hash | ForEach-Object { $_.ToString('x2') })
}

function Get-KitUtcNow {
    <#
    .SYNOPSIS
    Return the current UTC time as an ISO 8601 string to the second, such as 2026-10-24T12:00:00Z.
    .EXAMPLE
    $detectedAt = Get-KitUtcNow
    #>
    [OutputType([string])]
    [CmdletBinding()]
    param()
    return [DateTime]::UtcNow.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'")
}

# ---------------------------------------------------------------------------
# Drift reconciliation (read-only)
# ---------------------------------------------------------------------------

function Import-KitHrCsv {
    <#
    .SYNOPSIS
    HR extract keyed on employeeId. Required columns: employeeId, status.
    .EXAMPLE
    $hr = Import-KitHrCsv -Path ./tests/fixtures/hr_extract.csv
    #>
    [OutputType([System.Collections.Specialized.OrderedDictionary])]
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $rows = @(Import-Csv -LiteralPath $Path -Encoding utf8)
    $cols = if ($rows.Count) { $rows[0].PSObject.Properties.Name } else { @((Get-Content -LiteralPath $Path -TotalCount 1) -split ',') }
    foreach ($c in 'employeeId', 'status') {
        if ($cols -notcontains $c) { throw "HR CSV is missing column: $c" }
    }
    $hr = [ordered]@{}
    foreach ($r in $rows) {
        $key = ([string]$r.employeeId).Trim()
        if ($key) { $hr[$key] = $r }
    }
    return $hr
}

function Get-KitHrState {
    <#
    .SYNOPSIS
    Map an HR record's status to 'active' (active, leave, on leave, loa), 'terminated'
    (terminated, separated, inactive, retired, deceased) or 'unknown'.
    .EXAMPLE
    $hr = Import-KitHrCsv -Path ./tests/fixtures/hr_extract.csv
    Get-KitHrState -Record $hr['E1002']   # terminated
    #>
    [OutputType([string])]
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Record)
    $s = ([string]$Record.status).Trim().ToLowerInvariant()
    if ($script:ActiveStatuses -contains $s) { return 'active' }
    if ($script:TerminatedStatuses -contains $s) { return 'terminated' }
    return 'unknown'
}

function New-KitFindingObject {
    <#
    .SYNOPSIS
    Build one drift finding as an ordered dictionary, with severity and priority from the
    drift class and a 16-character finding_id hashed from class, system, employee id, object
    id and attribute.
    .EXAMPLE
    New-KitFindingObject -DriftClass 'attribute_drift' -System 'entra' -EmployeeId 'E1001' -ObjectId '00000000-0000-0000-0000-000000001001' -ObjectName 'alice@contoso.example' -Attribute 'department' -Expected 'Finance' -Observed 'Sales' -Evidence @{} -DetectedAt (Get-KitUtcNow)
    #>

    # Builds an in-memory object only; it changes no system state.
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
        Justification = 'Constructs an in-memory object; no state outside the process changes.')]
    [OutputType([System.Collections.Specialized.OrderedDictionary])]
    [CmdletBinding()]
    param($DriftClass, $System, $EmployeeId, $ObjectId, $ObjectName, $Attribute, $Expected, $Observed,
        [System.Collections.IDictionary]$Evidence, $DetectedAt)
    $sev = $script:ClassSeverity[$DriftClass]
    $idSource = @($DriftClass, $System, $EmployeeId, $ObjectId, $Attribute) | ForEach-Object {
        if ($null -eq $_ -or $_ -eq '') { $null } else { [string]$_ }
    }
    [ordered]@{
        drift_class = $DriftClass
        severity    = $sev
        priority    = $script:SeverityToPriority[$sev]
        system      = $System
        employee_id = if ($EmployeeId) { [string]$EmployeeId } else { '' }
        object_id   = if ($ObjectId) { [string]$ObjectId } else { '' }
        object_name = if ($ObjectName) { [string]$ObjectName } else { '' }
        attribute   = if ($Attribute) { [string]$Attribute } else { '' }
        expected    = $Expected
        observed    = $Observed
        detected_at = $DetectedAt
        evidence    = $Evidence
        finding_id  = (Get-KitSha256 -InputObject @($idSource)).Substring(0, 16)
    }
}

function Test-KitHasProperty {
    <#
    .SYNOPSIS
    Return $true when a dictionary has the key, or an object has the property, named -Name.
    .EXAMPLE
    Test-KitHasProperty -Object @{ department = 'Finance' } -Name 'department'   # True
    #>
    [OutputType([bool])]
    [CmdletBinding()]
    param($Object, [string]$Name)
    if ($null -eq $Object) { return $false }
    if ($Object -is [System.Collections.IDictionary]) { return $Object.Contains($Name) }
    return @($Object.PSObject.Properties.Name) -contains $Name
}

function Get-KitIscEmployeeId {
    <#
    .SYNOPSIS
    Return an ISC identity's HR key: the named attribute at the top level, else under
    .attributes, else an empty string.
    .EXAMPLE
    $ids = Get-Content -LiteralPath ./tests/fixtures/isc_identities.json -Raw | ConvertFrom-Json
    Get-KitIscEmployeeId -Identity $ids[0] -Attribute 'employeeNumber'   # E1000
    #>
    [OutputType([string])]
    [CmdletBinding()]
    param($Identity, [string]$Attribute)
    if ($null -eq $Identity) { return '' }
    if ((Test-KitHasProperty $Identity $Attribute) -and $Identity.$Attribute) { return [string]$Identity.$Attribute }
    if ($null -ne $Identity.attributes -and (Test-KitHasProperty $Identity.attributes $Attribute)) {
        return [string]$Identity.attributes.$Attribute
    }
    return ''
}

function Copy-KitDictionary {
    <#
    .SYNOPSIS
    Return a shallow ordered copy of a dictionary (empty for $null), so a finding's evidence
    can be extended without changing the original.
    .EXAMPLE
    $ev = Copy-KitDictionary -Source (Get-KitHrEvidence -Record $hr['E1001'])
    $ev.query = 'GET /v1.0/users (employeeId join)'
    #>
    [OutputType([System.Collections.Specialized.OrderedDictionary])]
    [CmdletBinding()]
    param([System.Collections.IDictionary]$Source)
    $copy = [ordered]@{}
    if ($null -ne $Source) { foreach ($k in $Source.Keys) { $copy[$k] = $Source[$k] } }
    return $copy
}

function Get-KitHrEvidence {
    <#
    .SYNOPSIS
    Return @{ hr_record = ... } with the HR columns a finding cites as evidence:
    employeeId, status, department, managerEmployeeId, displayName and email, when present.
    .EXAMPLE
    $hr = Import-KitHrCsv -Path ./tests/fixtures/hr_extract.csv
    Get-KitHrEvidence -Record $hr['E1001']
    #>
    [OutputType([System.Collections.Specialized.OrderedDictionary])]
    [CmdletBinding()]
    param($Record)
    $h = [ordered]@{}
    foreach ($c in 'employeeId', 'status', 'department', 'managerEmployeeId', 'displayName', 'email') {
        if (Test-KitHasProperty $Record $c) { $h[$c] = [string]$Record.$c }
    }
    return [ordered]@{ hr_record = $h }
}

function Get-KitIdentityDriftFinding {
    <#
    .SYNOPSIS
    Compute Book 03 drift findings. Returns @{ findings; computed; not_computed }.
    Pass $null for an input to skip the classes that need it.
    .EXAMPLE
    $hr = Import-KitHrCsv -Path ./tests/fixtures/hr_extract.csv
    $users = (Get-Content -LiteralPath ./tests/fixtures/graph_users.json -Raw | ConvertFrom-Json).value
    $opt = Get-Content -LiteralPath ./tests/fixtures/drift_options.json -Raw | ConvertFrom-Json -AsHashtable
    $result = Get-KitIdentityDriftFinding -Hr $hr -GraphUsers $users -Options $opt
    #>
    [OutputType([System.Collections.Specialized.OrderedDictionary])]
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][System.Collections.IDictionary]$Hr,
        [object[]]$GraphUsers,
        [object[]]$IscIdentities,
        [object[]]$IscUncorrelated,
        [object[]]$EntraAudit,
        [hashtable]$Options = @{},
        [string]$DetectedAt = (Get-KitUtcNow)
    )
    $empAttr = if ($Options.isc_employee_id_attribute) { $Options.isc_employee_id_attribute } else { 'employeeNumber' }
    $authoritative = @($Options.isc_authoritative_sources | Where-Object { $_ } | ForEach-Object { $_.ToLowerInvariant() })
    $allowedWriters = @($Options.allowed_writer_app_ids | Where-Object { $_ })
    $orphanExclude = @($Options.orphan_exclude_upn_prefixes | Where-Object { $_ } | ForEach-Object { $_.ToLowerInvariant() })
    $findings = [System.Collections.Generic.List[object]]::new()
    $computed = [System.Collections.Generic.HashSet[string]]::new()
    $notComputed = [ordered]@{
        credential_drift = 'needs the card management system and Intune certificate reports'
        schema_drift     = "needs the provisioning middleware's validation output"
    }

    if ($PSBoundParameters.ContainsKey('GraphUsers') -and $null -ne $GraphUsers) {
        foreach ($c in 'missing_identity', 'stale_access', 'orphan_account', 'attribute_drift') { [void]$computed.Add($c) }
        $users = @($GraphUsers | Where-Object { $null -ne $_ -and (-not $_.userType -or $_.userType -eq 'Member') })
        $byEmp = @{}
        foreach ($u in $users) {
            $e = ([string]$u.employeeId).Trim()
            if ($e) { if (-not $byEmp.ContainsKey($e)) { $byEmp[$e] = @() }; $byEmp[$e] += $u }
        }
        foreach ($emp in $Hr.Keys) {
            $rec = $Hr[$emp]; $state = Get-KitHrState $rec
            $matched = @($byEmp[$emp] | Where-Object { $null -ne $_ })
            $evHr = Get-KitHrEvidence $rec
            if ($state -eq 'active' -and $matched.Count -eq 0) {
                $ev = Copy-KitDictionary $evHr; $ev.query = 'GET /v1.0/users (employeeId join)'
                $findings.Add((New-KitFindingObject -DriftClass 'missing_identity' -System 'entra' -EmployeeId $emp -ObjectId $null -ObjectName $rec.displayName -Attribute $null -Expected 'account exists' -Observed 'no Entra user with this employeeId' -Evidence $ev -DetectedAt $DetectedAt))
            }
            foreach ($u in $matched) {
                $ev = Copy-KitDictionary $evHr
                $ev.graph_user = [ordered]@{ id = $u.id; userPrincipalName = $u.userPrincipalName; accountEnabled = $u.accountEnabled; department = $u.department }
                if ($state -eq 'terminated' -and $u.accountEnabled) {
                    $findings.Add((New-KitFindingObject -DriftClass 'stale_access' -System 'entra' -EmployeeId $emp -ObjectId $u.id -ObjectName $u.userPrincipalName -Attribute 'accountEnabled' -Expected $false -Observed $true -Evidence $ev -DetectedAt $DetectedAt))
                }
                if ($state -ne 'active') { continue }
                $hrDept = [string]$rec.department; $dept = [string]$u.department
                if ($hrDept -and $hrDept -cne $dept) {
                    $findings.Add((New-KitFindingObject -DriftClass 'attribute_drift' -System 'entra' -EmployeeId $emp -ObjectId $u.id -ObjectName $u.userPrincipalName -Attribute 'department' -Expected $hrDept -Observed $dept -Evidence $ev -DetectedAt $DetectedAt))
                }
                $hrMgr = [string]$rec.managerEmployeeId
                $mgr = if ($null -ne $u.manager) { [string]$u.manager.employeeId } else { '' }
                if ($hrMgr -and $hrMgr -cne $mgr) {
                    $obs = if ($mgr) { $mgr } else { $null }
                    $findings.Add((New-KitFindingObject -DriftClass 'attribute_drift' -System 'entra' -EmployeeId $emp -ObjectId $u.id -ObjectName $u.userPrincipalName -Attribute 'manager' -Expected $hrMgr -Observed $obs -Evidence $ev -DetectedAt $DetectedAt))
                }
            }
        }
        foreach ($u in $users) {
            $e = ([string]$u.employeeId).Trim()
            $upn = ([string]$u.userPrincipalName).ToLowerInvariant()
            if (-not $u.accountEnabled -or $Hr.Contains($e)) { continue }
            if (@($orphanExclude | Where-Object { $upn.StartsWith($_) }).Count) { continue }
            $ev = [ordered]@{ graph_user = [ordered]@{ id = $u.id; userPrincipalName = $u.userPrincipalName; employeeId = $u.employeeId; accountEnabled = $u.accountEnabled } }
            $obs = if ($e) { $e } else { $null }
            $findings.Add((New-KitFindingObject -DriftClass 'orphan_account' -System 'entra' -EmployeeId $obs -ObjectId $u.id -ObjectName $u.userPrincipalName -Attribute 'employeeId' -Expected 'a current HR record' -Observed $obs -Evidence $ev -DetectedAt $DetectedAt))
        }
    }

    if ($PSBoundParameters.ContainsKey('IscIdentities') -and $null -ne $IscIdentities) {
        foreach ($c in 'missing_identity', 'stale_access', 'attribute_drift') { [void]$computed.Add($c) }
        $byId = @{}; $byEmpIsc = @{}
        foreach ($i in @($IscIdentities | Where-Object { $null -ne $_ })) {
            $byId[[string]$i.id] = $i
            $e = Get-KitIscEmployeeId $i $empAttr
            if ($e) { if (-not $byEmpIsc.ContainsKey($e)) { $byEmpIsc[$e] = @() }; $byEmpIsc[$e] += $i }
        }
        foreach ($emp in $Hr.Keys) {
            $rec = $Hr[$emp]; $state = Get-KitHrState $rec
            $matched = @($byEmpIsc[$emp] | Where-Object { $null -ne $_ })
            $evHr = Get-KitHrEvidence $rec
            if ($state -eq 'active' -and $matched.Count -eq 0) {
                $ev = Copy-KitDictionary $evHr; $ev.query = 'POST /v3/search indices=identities'
                $findings.Add((New-KitFindingObject -DriftClass 'missing_identity' -System 'isc' -EmployeeId $emp -ObjectId $null -ObjectName $rec.displayName -Attribute $null -Expected 'identity exists' -Observed 'no ISC identity with this employee id' -Evidence $ev -DetectedAt $DetectedAt))
            }
            foreach ($i in $matched) {
                if ($state -eq 'terminated') {
                    foreach ($a in @($i.accounts | Where-Object { $null -ne $_ })) {
                        $src = [string]$a.source.name
                        if ($authoritative -contains $src.ToLowerInvariant() -or $a.disabled) { continue }
                        $ev = Copy-KitDictionary $evHr
                        $ev.isc_identity_id = $i.id
                        $ev.isc_account = [ordered]@{ id = $a.id; accountId = $a.accountId; name = $a.name; disabled = $a.disabled }
                        $ev.source = $src
                        $name = if ($a.accountId) { $a.accountId } else { $a.name }
                        $findings.Add((New-KitFindingObject -DriftClass 'stale_access' -System 'isc' -EmployeeId $emp -ObjectId $a.id -ObjectName "$($src):$name" -Attribute 'disabled' -Expected $true -Observed $false -Evidence $ev -DetectedAt $DetectedAt))
                    }
                }
                if ($state -ne 'active') { continue }
                $attrs = $i.attributes
                $hrDept = [string]$rec.department
                if ($hrDept -and (Test-KitHasProperty $attrs 'department') -and [string]$attrs.department -cne $hrDept) {
                    $ev = Copy-KitDictionary $evHr; $ev.isc_identity_id = $i.id
                    $findings.Add((New-KitFindingObject -DriftClass 'attribute_drift' -System 'isc' -EmployeeId $emp -ObjectId $i.id -ObjectName $i.name -Attribute 'department' -Expected $hrDept -Observed $attrs.department -Evidence $ev -DetectedAt $DetectedAt))
                }
                $hrMgr = [string]$rec.managerEmployeeId
                if ($hrMgr -and $null -ne $i.manager) {
                    $mgrIdent = $byId[[string]$i.manager.id]
                    $mgrEmp = Get-KitIscEmployeeId $mgrIdent $empAttr
                    if ($mgrEmp -and $mgrEmp -cne $hrMgr) {
                        $ev = Copy-KitDictionary $evHr; $ev.isc_identity_id = $i.id; $ev.isc_manager_id = $i.manager.id
                        $findings.Add((New-KitFindingObject -DriftClass 'attribute_drift' -System 'isc' -EmployeeId $emp -ObjectId $i.id -ObjectName $i.name -Attribute 'manager' -Expected $hrMgr -Observed $mgrEmp -Evidence $ev -DetectedAt $DetectedAt))
                    }
                }
            }
        }
    }

    if ($PSBoundParameters.ContainsKey('IscUncorrelated') -and $null -ne $IscUncorrelated) {
        [void]$computed.Add('orphan_account')
        foreach ($a in @($IscUncorrelated | Where-Object { $null -ne $_ })) {
            if ($a.disabled) { continue }
            if ((Test-KitHasProperty $a 'uncorrelated') -and -not $a.uncorrelated) { continue }
            $src = [string]$a.sourceName
            if ($authoritative -contains $src.ToLowerInvariant()) { continue }
            $ev = [ordered]@{
                isc_account = [ordered]@{ id = $a.id; name = $a.name; nativeIdentity = $a.nativeIdentity; sourceId = $a.sourceId; sourceName = $a.sourceName; uncorrelated = $a.uncorrelated; disabled = $a.disabled }
                query       = 'GET /v3/accounts?filters=uncorrelated eq true'
            }
            $name = if ($a.nativeIdentity) { $a.nativeIdentity } else { $a.name }
            $findings.Add((New-KitFindingObject -DriftClass 'orphan_account' -System 'isc' -EmployeeId $null -ObjectId $a.id -ObjectName "$($src):$name" -Attribute 'identity' -Expected 'correlated to a person' -Observed 'uncorrelated' -Evidence $ev -DetectedAt $DetectedAt))
        }
    }

    if ($PSBoundParameters.ContainsKey('EntraAudit') -and $null -ne $EntraAudit) {
        [void]$computed.Add('unauthorized_write')
        $empByObject = @{}
        foreach ($u in @($GraphUsers | Where-Object { $null -ne $_ })) { $empByObject[[string]$u.id] = [string]$u.employeeId }
        foreach ($entry in @($EntraAudit | Where-Object { $null -ne $_ })) {
            if ([string]$entry.activityDisplayName -ne 'Update user') { continue }
            $app = $entry.initiatedBy.app
            if ($null -ne $app -and $app.appId -and $allowedWriters -contains $app.appId) { continue }
            $actor = if ($null -ne $entry.initiatedBy.user -and $entry.initiatedBy.user.userPrincipalName) { $entry.initiatedBy.user.userPrincipalName }
            elseif ($null -ne $app -and $app.displayName) { $app.displayName } else { 'unknown' }
            foreach ($t in @($entry.targetResources | Where-Object { $null -ne $_ })) {
                foreach ($p in @($t.modifiedProperties | Where-Object { $null -ne $_ })) {
                    if ($script:WatchedAuditProperties -cnotcontains $p.displayName) { continue }
                    $ev = [ordered]@{ audit_id = $entry.id; activityDateTime = $entry.activityDateTime; initiated_by = $actor }
                    $findings.Add((New-KitFindingObject -DriftClass 'unauthorized_write' -System 'entra' -EmployeeId $empByObject[[string]$t.id] -ObjectId $t.id -ObjectName $t.userPrincipalName -Attribute $p.displayName -Expected $p.oldValue -Observed $p.newValue -Evidence $ev -DetectedAt $DetectedAt))
                }
            }
        }
    }
    else {
        $notComputed.unauthorized_write = 'no Entra audit extract supplied (-EntraAuditJson or -IncludeAuditSince)'
    }

    $sorted = @($findings | Sort-Object -Property @{ e = { $_.drift_class } }, @{ e = { $_.system } }, @{ e = { $_.employee_id } }, @{ e = { $_.object_id } }, @{ e = { $_.attribute } })
    return [ordered]@{ findings = $sorted; computed = @($computed | Sort-Object); not_computed = $notComputed }
}

function Export-KitDriftResult {
    <#
    .SYNOPSIS
    Write the result as JSON and the findings as CSV.
    .EXAMPLE
    Export-KitDriftResult -Result $result -JsonPath ./identity-drift.json -CsvPath ./identity-drift.csv
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][System.Collections.IDictionary]$Result, [Parameter(Mandatory)][string]$JsonPath,
        [Parameter(Mandatory)][string]$CsvPath)
    $Result | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $JsonPath -Encoding utf8NoBOM
    $rows = foreach ($f in $Result.findings) {
        $row = [ordered]@{}
        foreach ($k in $script:CsvFields) {
            $v = $f[$k]
            $row[$k] = if ($k -in 'expected', 'observed', 'evidence' -and $v -isnot [string]) { ConvertTo-KitCanonicalJson $v } else { $v }
        }
        [pscustomobject]$row
    }
    if ($rows) { $rows | Export-Csv -LiteralPath $CsvPath -NoTypeInformation -Encoding utf8NoBOM }
    else { ($script:CsvFields | ForEach-Object { '"' + $_ + '"' }) -join ',' | Set-Content -LiteralPath $CsvPath -Encoding utf8NoBOM }
}

function ConvertTo-KitServiceNowPayload {
    <#
    .SYNOPSIS
    The identity-finding data contract the Scripted REST resource accepts.
    .EXAMPLE
    ConvertTo-KitServiceNowPayload -Finding $result.findings[0] | ConvertTo-Json -Depth 10
    #>
    [OutputType([System.Collections.Specialized.OrderedDictionary])]
    [CmdletBinding()]
    param([Parameter(Mandatory)][System.Collections.IDictionary]$Finding)
    $intended = @{}
    if ($Finding.drift_class -in 'stale_access', 'orphan_account') {
        $intended = if ($Finding.system -eq 'isc') { @{ disabled = $true } } else { @{ accountEnabled = $false } }
    }
    elseif ($Finding.drift_class -eq 'attribute_drift' -and $Finding.attribute) {
        $intended = @{ attributes = @{ $Finding.attribute = $Finding.expected } }
    }
    $system = switch ($Finding.system) { 'entra' { 'entra_user' } 'isc' { 'isc_account' } default { $Finding.system } }
    $subject = if ($Finding.object_id) { $Finding.object_id } else { $Finding.employee_id }
    return [ordered]@{
        kind = 'finding'; source = 'drift-reconciliation'; drift_class = $Finding.drift_class
        severity = $Finding.priority; system = $system; subject_id = $subject; account_id = $Finding.object_id
        employee_id = $Finding.employee_id; object_name = $Finding.object_name; attribute = $Finding.attribute
        expected_value = $Finding.expected; observed_value = $Finding.observed; intended_state = $intended
        origin = [ordered]@{ type = 'drift-reconciliation'; finding_id = $Finding.finding_id; checker = "Get-IdentityDrift.ps1/$script:KitVersion" }
        detected_at = $Finding.detected_at; evidence = $Finding.evidence
    }
}

function Send-KitFindingToServiceNow {
    <#
    .SYNOPSIS
    POST findings to the Scripted REST endpoint. Dry run unless -Apply.
    .EXAMPLE
    # Lists what it would send; add -Apply to POST.
    Send-KitFindingToServiceNow -Finding $result.findings -Config $cfg -Headers (Get-KitSnHeader -Config $cfg)
    #>
    [OutputType([pscustomobject])]
    [CmdletBinding(SupportsShouldProcess)]
    param([Parameter(Mandatory)][object[]]$Finding, [Parameter(Mandatory)][hashtable]$Config,
        [hashtable]$Headers = @{}, [switch]$Apply)
    $uri = (Get-KitSnBaseUrl -Config $Config) + $Config.SN_FINDING_API_PATH
    foreach ($f in $Finding) {
        if (-not $Apply) {
            Write-Information "[dry-run] would POST $($f.drift_class) $($f.finding_id) to $uri" -InformationAction Continue
            [pscustomobject]@{ finding_id = $f.finding_id; action = 'dry-run' }
            continue
        }
        if ($PSCmdlet.ShouldProcess($uri, "POST finding $($f.finding_id)")) {
            $resp = Invoke-KitRequest -Method POST -Uri $uri -Headers $Headers -Body (ConvertTo-KitJsonBody (ConvertTo-KitServiceNowPayload $f)) -ContentType 'application/json'
            $r = if ($null -ne $resp.result) { $resp.result } else { $resp }
            [pscustomobject]@{ finding_id = $f.finding_id; action = 'posted'; sys_id = $r.sys_id; deduplicated = $r.deduplicated }
        }
    }
}

# ---------------------------------------------------------------------------
# Re-read before close
# ---------------------------------------------------------------------------

function ConvertFrom-KitTimestamp {
    <#
    .SYNOPSIS
    Parse a ServiceNow 'yyyy-MM-dd HH:mm:ss' value or an ISO 8601 string as UTC; returns
    $null when the value is empty or can't be parsed.
    .EXAMPLE
    ConvertFrom-KitTimestamp -Value '2026-10-24 12:00:00'
    #>
    [OutputType([datetime])]
    [CmdletBinding()]
    param([string]$Value)
    if (-not $Value) { return $null }
    $styles = [Globalization.DateTimeStyles]::AssumeUniversal -bor [Globalization.DateTimeStyles]::AdjustToUniversal
    $out = [datetime]::MinValue
    if ([datetime]::TryParseExact($Value, 'yyyy-MM-dd HH:mm:ss', [Globalization.CultureInfo]::InvariantCulture, $styles, [ref]$out)) { return $out }
    if ([datetime]::TryParse($Value, [Globalization.CultureInfo]::InvariantCulture, $styles, [ref]$out)) { return $out }
    return $null
}

function Get-KitAwaitingRecord {
    <#
    .SYNOPSIS
    List the records in a ServiceNow table whose state is SN_STATE_AWAITING_VERIFICATION,
    ordered by last update, with the fields the re-read needs.
    .EXAMPLE
    $records = @(Get-KitAwaitingRecord -Config $cfg -Headers $sn -Table $cfg.SN_FINDING_TABLE)
    #>
    [OutputType([object])]
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Config, [hashtable]$Headers = @{}, [Parameter(Mandatory)][string]$Table)
    $q = "state=$($Config.SN_STATE_AWAITING_VERIFICATION)^ORDERBYsys_updated_on"
    Get-KitSnTablePaged -BaseUrl (Get-KitSnBaseUrl -Config $Config) -Table $Table -Headers $Headers -Query $q -Fields $script:RecordFields
}

function Get-KitSubjectState {
    <#
    .SYNOPSIS
    Re-read the record's subject from its system of record.
    .EXAMPLE
    $obs = Get-KitSubjectState -Record $records[0] -Config $cfg -IscHeaders $ih -GraphHeaders $gh
    #>
    [OutputType([System.Collections.Specialized.OrderedDictionary])]
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Record, [Parameter(Mandatory)][hashtable]$Config, [hashtable]$IscHeaders, [hashtable]$GraphHeaders)
    $system = if ($Record.u_system) { $Record.u_system } elseif ($Record.u_account_id) { 'isc_account' } else { 'isc_identity' }
    switch ($system) {
        'isc_account' {
            $id = if ($Record.u_account_id) { $Record.u_account_id } else { $Record.u_subject_id }
            $query = "GET /v3/accounts/$id"
            try {
                $obs = Invoke-KitRequest -Method GET -Uri ((Get-KitIscBaseUrl -Config $Config) + "/v3/accounts/$id") -Headers $IscHeaders
                return [ordered]@{ system = $system; query = $query; observed = $obs; exists = $true }
            }
            catch {
                if ((Get-KitStatusCode -ErrorRecord $_) -eq 404) { return [ordered]@{ system = $system; query = $query; observed = $null; exists = $false } }
                throw
            }
        }
        'isc_identity' {
            $id = if ($Record.u_identity_id) { $Record.u_identity_id } else { $Record.u_subject_id }
            $body = [ordered]@{ indices = @('identities'); query = [ordered]@{ query = "id:`"$id`"" } }
            $hits = @(Invoke-KitRequest -Method POST -Uri ((Get-KitIscBaseUrl -Config $Config) + '/v3/search?limit=1') -Headers $IscHeaders -Body (ConvertTo-KitJsonBody $body) -ContentType 'application/json' | Where-Object { $null -ne $_ })
            $obs = if ($hits.Count) { $hits[0] } else { $null }
            return [ordered]@{ system = $system; query = 'POST /v3/search ' + (ConvertTo-KitCanonicalJson $body); observed = $obs; exists = ($hits.Count -gt 0) }
        }
        'entra_user' {
            $id = if ($Record.u_subject_id) { $Record.u_subject_id } else { $Record.u_account_id }
            $graph = (Get-KitGraphEndpoint -Config $Config)[1]
            $uri = "$graph/v1.0/users/$id`?`$select=id,accountEnabled,department,employeeId,jobTitle"
            try {
                $obs = Invoke-KitRequest -Method GET -Uri $uri -Headers $GraphHeaders
                return [ordered]@{ system = $system; query = "GET $uri"; observed = $obs; exists = $true }
            }
            catch {
                if ((Get-KitStatusCode -ErrorRecord $_) -eq 404) { return [ordered]@{ system = $system; query = "GET $uri"; observed = $null; exists = $false } }
                throw
            }
        }
        default { throw "Unsupported u_system '$system' on $($Record.number)" }
    }
}

function Get-KitValueList {
    <#
    .SYNOPSIS
    Return a value as an array of strings, or an empty array for $null.
    .EXAMPLE
    Get-KitValueList -Value @('CN=Finance', 'CN=Staff')
    #>
    [OutputType([object[]])]
    [CmdletBinding()]
    param($Value)
    if ($null -eq $Value) { return @() }
    return @($Value | ForEach-Object { [string]$_ })
}

function Compare-KitIntendedState {
    <#
    .SYNOPSIS
    Returns the differences; an empty array means the intended state holds.
    .EXAMPLE
    Compare-KitIntendedState -Intended @{ disabled = $true } -Observation @{ exists = $true; observed = [pscustomobject]@{ disabled = $false } }
    # disabled: intended True, observed False
    #>
    [OutputType([string[]])]
    [CmdletBinding()]
    param([Parameter(Mandatory)][System.Collections.IDictionary]$Intended, [Parameter(Mandatory)][System.Collections.IDictionary]$Observation)
    $diffs = [System.Collections.Generic.List[string]]::new()
    $obs = $Observation.observed
    if ($Intended.Contains('exists')) {
        if ([bool]$Intended.exists -ne [bool]$Observation.exists) { $diffs.Add("exists: intended $($Intended.exists), observed $($Observation.exists)") }
        if (-not $Intended.exists) { return $diffs.ToArray() }
    }
    if (-not $Observation.exists -or $null -eq $obs) { $diffs.Add('subject not found'); return $diffs.ToArray() }
    $attrs = $obs.attributes
    foreach ($k in 'disabled', 'accountEnabled', 'locked') {
        if ($Intended.Contains($k) -and $obs.$k -ne $Intended[$k]) { $diffs.Add("${k}: intended $($Intended[$k]), observed $($obs.$k)") }
    }
    if ($Intended.Contains('attributes')) {
        foreach ($name in $Intended.attributes.Keys) {
            $want = $Intended.attributes[$name]
            $actual = if (Test-KitHasProperty $attrs $name) { $attrs.$name } else { $obs.$name }
            if ($actual -cne $want) { $diffs.Add("attribute ${name}: intended '$want', observed '$actual'") }
        }
    }
    foreach ($item in @($Intended.entitlements_absent | Where-Object { $null -ne $_ })) {
        if ((Get-KitValueList $attrs.($item.attribute)) -contains [string]$item.value) { $diffs.Add("entitlement $($item.value) still present in $($item.attribute)") }
    }
    foreach ($item in @($Intended.entitlements_present | Where-Object { $null -ne $_ })) {
        if ((Get-KitValueList $attrs.($item.attribute)) -notcontains [string]$item.value) { $diffs.Add("entitlement $($item.value) missing from $($item.attribute)") }
    }
    return $diffs.ToArray()
}

function Test-KitStaleRead {
    <#
    .SYNOPSIS
    True when the ISC copy predates the start of waiting and the grace period has not ended.
    .EXAMPLE
    Test-KitStaleRead -Record $records[0] -Observation $obs -Now ([datetime]::UtcNow) -Grace ([timespan]::FromHours(24))
    #>
    [OutputType([bool])]
    [CmdletBinding()]
    param($Record, [System.Collections.IDictionary]$Observation, [datetime]$Now, [timespan]$Grace)
    if (-not ([string]$Observation.system).StartsWith('isc') -or $null -eq $Observation.observed) { return $false }
    $since = ConvertFrom-KitTimestamp ([string]$Record.u_awaiting_since)
    $modRaw = $Observation.observed.modified
    $modified = if ($modRaw -is [datetime]) { $modRaw.ToUniversalTime() } else { ConvertFrom-KitTimestamp ([string]$modRaw) }
    if ($null -eq $since -or $null -eq $modified) { return $false }
    return ($modified -lt $since -and ($Now - $since) -lt $Grace)
}

function ConvertTo-KitEvidence {
    <#
    .SYNOPSIS
    Build the re-read evidence record: record number, system and query, check time, intended
    state, SHA-256 of what was observed, whether it matched, the differences and the checker.
    .EXAMPLE
    ConvertTo-KitEvidence -Record $records[0] -Intended @{ disabled = $true } -Observation $obs -Differences @() -CheckedAt (Get-KitUtcNow) -CheckerIdentity 'reread-client'
    #>
    [OutputType([System.Collections.Specialized.OrderedDictionary])]
    [CmdletBinding()]
    param($Record, $Intended, $Observation, [string[]]$Differences, [string]$CheckedAt, [string]$CheckerIdentity)
    return [ordered]@{
        record = $Record.number; record_sys_id = $Record.sys_id; system = $Observation.system; query = $Observation.query
        checked_at = $CheckedAt; intended_state = $Intended; result_sha256 = (Get-KitSha256 $Observation.observed)
        match = (@($Differences).Count -eq 0); differences = @($Differences)
        checker = "Invoke-ReReadVerification.ps1/$script:KitVersion"; checker_identity = $CheckerIdentity
    }
}

function Invoke-KitReReadVerification {
    <#
    .SYNOPSIS
    Re-read each record awaiting verification; close on match (with evidence), reopen on
    mismatch, leave alone when the ISC copy is stale. Dry run unless -Apply.
    .EXAMPLE
    # Prints what it would do; add -Apply to close or reopen records.
    Invoke-KitReReadVerification -Record $records -Config $cfg -SnHeaders $sn -IscHeaders $ih -GraphHeaders $gh -Table 'u_identity_finding'
    #>
    [OutputType([pscustomobject])]
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Record,
        [Parameter(Mandatory)][hashtable]$Config,
        [hashtable]$SnHeaders = @{}, [hashtable]$IscHeaders = @{}, [hashtable]$GraphHeaders = @{},
        [Parameter(Mandatory)][string]$Table,
        [switch]$Apply,
        [double]$GraceHours = 24,
        [datetime]$Now = [DateTime]::UtcNow
    )
    $checkedAt = $Now.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss'Z'")
    $base = Get-KitSnBaseUrl -Config $Config
    $checker = if ($Config.SAILPOINT_CLIENT_ID) { $Config.SAILPOINT_CLIENT_ID } else { 'unknown' }
    foreach ($rec in $Record) {
        $intended = $null
        if ($rec.u_intended_state) { try { $intended = $rec.u_intended_state | ConvertFrom-Json -AsHashtable } catch { $intended = $null } }
        if ($null -eq $intended -or $intended.Count -eq 0) {
            Write-Information "$($rec.number): skipped, no intended state recorded" -InformationAction Continue
            [pscustomobject]@{ record = $rec.number; outcome = 'skipped'; reason = 'no u_intended_state' }
            continue
        }
        $obs = Get-KitSubjectState -Record $rec -Config $Config -IscHeaders $IscHeaders -GraphHeaders $GraphHeaders
        if (Test-KitStaleRead -Record $rec -Observation $obs -Now $Now.ToUniversalTime() -Grace ([timespan]::FromHours($GraceHours))) {
            Write-Information "$($rec.number): pending, the ISC copy predates the change; re-run after the next aggregation" -InformationAction Continue
            [pscustomobject]@{ record = $rec.number; outcome = 'pending'; reason = 'not aggregated since waiting began' }
            continue
        }
        $diffs = @(Compare-KitIntendedState -Intended $intended -Observation $obs)
        $evidence = ConvertTo-KitEvidence -Record $rec -Intended $intended -Observation $obs -Differences $diffs -CheckedAt $checkedAt -CheckerIdentity $checker
        $evidenceJson = ConvertTo-KitCanonicalJson $evidence
        $evidenceHash = Get-KitSha256 $evidence
        $outcome = if ($diffs.Count -eq 0) { 'verified' } else { 'mismatch' }
        $uri = "$base/api/now/table/$Table/$($rec.sys_id)"
        if ($outcome -eq 'verified') {
            $patch = [ordered]@{ state = $Config.SN_STATE_CLOSED; u_evidence = $evidenceJson; u_evidence_hash = $evidenceHash; u_verified_at = $checkedAt
                close_notes = "Closed on re-read: $($obs.query) at $checkedAt; result sha256 $($evidence.result_sha256)." }
        }
        else {
            $patch = [ordered]@{ state = $Config.SN_STATE_REOPENED; u_evidence = $evidenceJson
                work_notes = 'Re-read did not show the intended state; reopened. ' + ($diffs -join '; ') }
        }
        $applied = $false
        if ($Apply -and $PSCmdlet.ShouldProcess("$Table/$($rec.number)", "set state $($patch.state) ($outcome)")) {
            [void](Invoke-KitRequest -Method PATCH -Uri $uri -Headers $SnHeaders -Body (ConvertTo-KitJsonBody $patch) -ContentType 'application/json')
            if ($outcome -eq 'verified') {
                $q = 'table_name=' + [uri]::EscapeDataString($Table) + '&table_sys_id=' + $rec.sys_id + '&file_name=' + [uri]::EscapeDataString("reread-evidence-$($rec.number).json")
                [void](Invoke-KitRequest -Method POST -Uri "$base/api/now/attachment/file?$q" -Headers $SnHeaders -Body ([Text.Encoding]::UTF8.GetBytes($evidenceJson)) -ContentType 'application/json')
            }
            $applied = $true
            Write-Information "$($rec.number): $outcome, record updated" -InformationAction Continue
        }
        else {
            $detail = if ($outcome -eq 'verified') { '' } else { " ($($diffs -join '; '))" }
            Write-Information "[dry-run] $($rec.number): $outcome; would PATCH state=$($patch.state)$detail" -InformationAction Continue
        }
        [pscustomobject]@{ record = $rec.number; outcome = $outcome; differences = $diffs; evidence_sha256 = $evidenceHash; applied = $applied }
    }
}

Export-ModuleMember -Function *-Kit*
