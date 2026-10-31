# Chapter 04: runs Microsoft's pinned samples offline and unmodified.
#   examples/third_party/graph-app-credential-policy-pages  (Graph v1.0: the tenant default policy, an app management policy and its assignment; adding a certificate)
#   examples/third_party/entra-app-management-policies-page (Learn's procedure: configure app management policies)
#   examples/third_party/graph-applications-tutorial-page   (pinned by Chapter 02: the lock and default policy samples)
#   examples/third_party/az-keyvault-certificate-help        (Az.KeyVault: Add-AzKeyVaultCertificate and Set-AzKeyVaultCertificatePolicy, example 1)
# HTTP samples are parsed and sent to Chapter 04's fake Graph; the PowerShell examples run against
# stand-ins for the Az.KeyVault cmdlets that call the fake Key Vault. Nothing signs in, and nothing
# leaves the machine.

$script:Ch04ThirdParty = Join-Path $PSScriptRoot '../../third_party'
$script:Ch04Pages = @{
    TenantUpdate = Join-Path $script:Ch04ThirdParty 'graph-app-credential-policy-pages/tenantappmanagementpolicy-update.md'
    PolicyPost   = Join-Path $script:Ch04ThirdParty 'graph-app-credential-policy-pages/appmanagementpolicy-post.md'
    PolicyAssign = Join-Path $script:Ch04ThirdParty 'graph-app-credential-policy-pages/appmanagementpolicy-post-appliesto.md'
    AddCert      = Join-Path $script:Ch04ThirdParty 'graph-app-credential-policy-pages/applications-how-to-add-certificate.md'
    Configure    = Join-Path $script:Ch04ThirdParty 'entra-app-management-policies-page/configure-app-management-policies.md'
    Tutorial     = Join-Path $script:Ch04ThirdParty 'graph-applications-tutorial-page/tutorial-applications-basics.md'
    AzAdd        = Join-Path $script:Ch04ThirdParty 'az-keyvault-certificate-help/Add-AzKeyVaultCertificate.md'
    AzSet        = Join-Path $script:Ch04ThirdParty 'az-keyvault-certificate-help/Set-AzKeyVaultCertificatePolicy.md'
}

function ConvertFrom-Ch04Request {
    param([string[]]$Lines, [string]$Name)
    $req = @($Lines | ForEach-Object { $_.TrimEnd() })
    if ($req[0].Trim() -notmatch '^(GET|POST|PATCH|DELETE) (\S+)') { throw "Unexpected request line: $($req[0])" }
    $method = $Matches[1]; $uri = $Matches[2]
    $headers = @{}; $j = 1
    while ($j -lt $req.Count -and $req[$j].Trim()) { if ($req[$j].Trim() -match '^([A-Za-z-]+):\s*(.+)$') { $headers[$Matches[1]] = $Matches[2].Trim() }; $j++ }
    $bodyText = (($req | Select-Object -Skip ($j + 1)) -join "`n").Trim()
    $body = $null; $err = $null
    if ($bodyText) { try { $body = $bodyText | ConvertFrom-Json -AsHashtable -Depth 30 } catch { $err = $_.Exception.Message } }
    [pscustomobject]@{ Name = $Name; Method = $method; Uri = $uri; Headers = $headers; BodyText = $bodyText; Body = $body; ParseError = $err }
}

function Get-Ch04HttpSample {
    <#
    One request sample from a pinned page: by the name in its blockType comment (-Name), or the
    -Index-th fenced http block whose first line is a request (Learn's procedure pages indent theirs).
    #>
    param([Parameter(Mandatory)][string]$Page, [string]$Name, [int]$Index = -1)
    $lines = [IO.File]::ReadAllLines((Resolve-Path -LiteralPath $Page).Path)
    if ($Name) {
        $at = -1
        for ($i = 0; $i -lt $lines.Count; $i++) { if ($lines[$i] -match "^\s*`"name`": `"$([regex]::Escape($Name))`"") { $at = $i; break } }
        if ($at -lt 0) { throw "No request named '$Name' on $Page" }
        $i = $at; while ($lines[$i] -notmatch '^\s*```(http|msgraph-interactive)\s*$') { $i++ }
        $i++; $req = [Collections.Generic.List[string]]::new()
        while ($lines[$i] -notmatch '^\s*```\s*$') { $req.Add($lines[$i]); $i++ }
        return ConvertFrom-Ch04Request -Lines $req -Name $Name
    }
    $all = Get-Ch04HttpSamples -Page $Page
    if ($Index -lt 0 -or $Index -ge $all.Count) { throw "No request $Index on $Page" }
    $all[$Index]
}

function Get-Ch04HttpSamples {
    <# Every fenced http request on a page, in page order. #>
    param([Parameter(Mandatory)][string]$Page)
    $lines = [IO.File]::ReadAllLines((Resolve-Path -LiteralPath $Page).Path)
    $out = [Collections.Generic.List[object]]::new(); $in = $false; $buf = $null
    foreach ($l in $lines) {
        if (-not $in -and $l -match '^\s*```(http|msgraph-interactive)\s*$') { $in = $true; $buf = [Collections.Generic.List[string]]::new(); continue }
        if ($in -and $l -match '^\s*```') { $in = $false; if ($buf.Count -and $buf[0].Trim() -match '^(GET|POST|PATCH|DELETE) https://') { $out.Add((ConvertFrom-Ch04Request -Lines $buf -Name "#$($out.Count)")) }; continue }
        if ($in) { $buf.Add($l) }
    }
    $out.ToArray()
}

function Test-Ch04StrictJson {
    <# True when the text is strict JSON (System.Text.Json), which a JSON client library expects; ConvertFrom-Json is more forgiving. #>
    param([string]$Text)
    try { $null = [Text.Json.JsonDocument]::Parse($Text); $true } catch { $false }
}

function Send-Ch04HttpSample {
    <# Send a parsed sample to the fake, as published or with -Replace @{ old = new } applied to the URI and body text. #>
    param([Parameter(Mandatory)]$Sample, [Parameter(Mandatory)]$Fake, [hashtable]$Replace = @{})
    $uri = $Sample.Uri; $text = $Sample.BodyText
    foreach ($k in $Replace.Keys) { $uri = $uri.Replace($k, $Replace[$k]); if ($text) { $text = $text.Replace($k, $Replace[$k]) } }
    $body = if ($text) { $text | ConvertFrom-Json -AsHashtable -Depth 30 } else { $null }
    & $Fake.Invoke $Sample.Method $uri $body $Sample.Headers
}

function Get-Ch04AzExample {
    <# Example 1's code block from a pinned Az.KeyVault help page. #>
    param([Parameter(Mandatory)][ValidateSet('AzAdd', 'AzSet')][string]$Page)
    $text = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $script:Ch04Pages[$Page]).Path)
    $m = [regex]::Match($text, '### Example 1[^\n]*\n(?s:.*?)```powershell\r?\n(?<code>(?s:.*?))\r?\n```')
    if (-not $m.Success) { throw "No example 1 on $Page" }
    $m.Groups['code'].Value
}

function Invoke-Ch04AzAddExample {
    <#
    Run Add-AzKeyVaultCertificate's example 1 against stand-ins for New-AzKeyVaultCertificatePolicy,
    Add-AzKeyVaultCertificate, Get-AzKeyVaultCertificateOperation and Get-AzKeyVaultCertificate that
    call the fake Key Vault. The example's code shares a block with its output, so the harness runs
    the block's command lines, unmodified, and skips the output lines. Returns @{ Commands; Cert; Calls }.
    #>
    param([Parameter(Mandatory)]$Fake, [string]$Cloud = 'gcc')
    $code = Get-Ch04AzExample -Page AzAdd
    $commands = @($code -split "\r?\n" | Where-Object { $_ -match '^(\$Policy = |Add-AzKeyVaultCertificate |Get-AzKeyVaultCertificate)' })
    $global:Ch04Az = [pscustomobject]@{ Fake = $Fake; Suffix = $(if ($Cloud -in 'gcchigh', 'dod') { 'vault.usgovcloudapi.net' } else { 'vault.azure.net' }); Calls = [Collections.Generic.List[object]]::new(); Cert = $null }
    try {
        function global:New-AzKeyVaultCertificatePolicy {
            [CmdletBinding()] param($SecretContentType, $SubjectName, $IssuerName, [int]$ValidityInMonths, [switch]$ReuseKeyOnRenewal, $RenewAtNumberOfDaysBeforeExpiry, $RenewAtPercentageLifetime, $EmailAtNumberOfDaysBeforeExpiry)
            $global:Ch04Az.Calls.Add([pscustomobject]@{ Cmdlet = 'New-AzKeyVaultCertificatePolicy'; Bound = @($PSBoundParameters.Keys) })
            $p = @{ x509_props = @{ subject = $SubjectName; validity_months = $ValidityInMonths }; issuer = @{ name = $IssuerName }; key_props = @{ reuse_key = [bool]$ReuseKeyOnRenewal }; secret_props = @{ contentType = $SecretContentType } }
            if ($RenewAtNumberOfDaysBeforeExpiry) { $p.lifetime_actions = @(@{ trigger = @{ days_before_expiry = $RenewAtNumberOfDaysBeforeExpiry }; action = @{ action_type = 'AutoRenew' } }) }
            [pscustomobject]@{ Rest = $p; ValidityInMonths = $ValidityInMonths }
        }
        function global:Add-AzKeyVaultCertificate {
            [CmdletBinding()] param($VaultName, $Name, $CertificatePolicy)
            $global:Ch04Az.Calls.Add([pscustomobject]@{ Cmdlet = 'Add-AzKeyVaultCertificate'; Bound = @($PSBoundParameters.Keys) })
            $kvs = $global:Ch04Az.Fake.Tenant.keyVaults
            if (-not $kvs.ContainsKey($VaultName)) { $kvs[$VaultName] = @{ certificates = @{} } }
            if (-not $kvs[$VaultName].certificates.ContainsKey($Name)) { $kvs[$VaultName].certificates[$Name] = @{ policy = $CertificatePolicy.Rest; versions = @() } }
            $r = & $global:Ch04Az.Fake.Invoke 'POST' "https://$VaultName.$($global:Ch04Az.Suffix)/certificates/$Name/create?api-version=2025-07-01" @{ policy = $CertificatePolicy.Rest } $null
            [pscustomobject]@{ Status = $r.status }
        }
        function global:Get-AzKeyVaultCertificateOperation {
            [CmdletBinding()] param($VaultName, $Name)
            $r = & $global:Ch04Az.Fake.Invoke 'GET' "https://$VaultName.$($global:Ch04Az.Suffix)/certificates/$Name/pending?api-version=2025-07-01" $null $null
            [pscustomobject]@{ Status = $r.status }
        }
        function global:Get-AzKeyVaultCertificate {
            [CmdletBinding()] param($VaultName, $Name)
            $r = & $global:Ch04Az.Fake.Invoke 'GET' "https://$VaultName.$($global:Ch04Az.Suffix)/certificates/$Name`?api-version=2025-07-01" $null $null
            $global:Ch04Az.Cert = $r
            [pscustomobject]@{ Name = $Name; NotBefore = [DateTimeOffset]::FromUnixTimeSeconds([int64]$r.attributes.nbf).UtcDateTime; Expires = [DateTimeOffset]::FromUnixTimeSeconds([int64]$r.attributes.exp).UtcDateTime; Cer = $r.cer }
        }
        $outputs = & ([scriptblock]::Create(($commands -join "`n")))
        [pscustomobject]@{ Commands = $commands; Outputs = @($outputs); Cert = $global:Ch04Az.Cert; Calls = $global:Ch04Az.Calls }
    } finally {
        foreach ($f in 'New-AzKeyVaultCertificatePolicy', 'Add-AzKeyVaultCertificate', 'Get-AzKeyVaultCertificateOperation', 'Get-AzKeyVaultCertificate') { Remove-Item "function:global:$f" -ErrorAction SilentlyContinue }
        Remove-Variable -Name Ch04Az -Scope Global -ErrorAction SilentlyContinue
    }
}

function Invoke-Ch04AzSetExample {
    <# Run Set-AzKeyVaultCertificatePolicy's example 1, unmodified, against a stand-in that records what it was asked to set. #>
    $global:Ch04AzSet = [Collections.Generic.List[object]]::new()
    try {
        function global:Set-AzKeyVaultCertificatePolicy {
            [CmdletBinding()] param($VaultName, $Name, $SecretContentType, $SubjectName, $IssuerName, [int]$ValidityInMonths, $ReuseKeyOnRenewal, [switch]$PassThru,
                $RenewAtNumberOfDaysBeforeExpiry, $RenewAtPercentageLifetime, $EmailAtNumberOfDaysBeforeExpiry, $EmailAtPercentageLifetime)
            $global:Ch04AzSet.Add([pscustomobject]@{ Bound = @($PSBoundParameters.Keys); ValidityInMonths = $ValidityInMonths })
        }
        & ([scriptblock]::Create((Get-Ch04AzExample -Page AzSet)))
        , $global:Ch04AzSet.ToArray()
    } finally {
        Remove-Item 'function:global:Set-AzKeyVaultCertificatePolicy' -ErrorAction SilentlyContinue
        Remove-Variable -Name Ch04AzSet -Scope Global -ErrorAction SilentlyContinue
    }
}
