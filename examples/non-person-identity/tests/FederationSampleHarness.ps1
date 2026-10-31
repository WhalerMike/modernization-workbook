# Chapter 05: runs Microsoft's pinned samples offline and unmodified:
#   examples/third_party/entra-wif-create-trust-pages  (Learn's "Configure an app to trust an external identity provider"
#                                                       and "Configure a user-assigned managed identity to trust an external identity provider")
#   examples/third_party/graph-fic-create-page         (Learn's Graph reference "Create federatedIdentityCredential")
#   examples/third_party/msi-fic-rest-examples         (the Managed Identity REST examples Learn's REST reference renders, 2024-11-30)
# The HTTP and az rest samples are parsed and sent to NpiFederation's fake Graph and Resource Manager; the Azure
# PowerShell sample runs against a stand-in for New-AzADAppFederatedCredential; the JSON samples are read as published.
# Nothing is installed, nothing signs in, and nothing leaves the machine. Reuses Get-LearnBlock from LearnSampleHarness.ps1.

. (Join-Path $PSScriptRoot 'LearnSampleHarness.ps1')
$script:WifThirdParty = Join-Path $PSScriptRoot '../../third_party'
$script:AppTrustPage = Join-Path $script:WifThirdParty 'entra-wif-create-trust-pages/workload-identity-federation-create-trust.md'
$script:MiTrustPage = Join-Path $script:WifThirdParty 'entra-wif-create-trust-pages/workload-identity-federation-create-trust-user-assigned-managed-identity.md'
$script:GraphFicPage = Join-Path $script:WifThirdParty 'graph-fic-create-page/federatedidentitycredential-post.md'
$script:MsiExamples = Join-Path $script:WifThirdParty 'msi-fic-rest-examples'

function Get-WifGraphSample {
    <# The named HTTP request sample from the Graph reference page: @{ Method; Uri; Body }. #>
    param([string]$Name = 'create_federatedidentitycredential_from_')
    $lines = [IO.File]::ReadAllLines((Resolve-Path -LiteralPath $script:GraphFicPage).Path)
    $at = -1
    for ($i = 0; $i -lt $lines.Count; $i++) { if ($lines[$i] -match "^\s*`"name`": `"$([regex]::Escape($Name))`"") { $at = $i; break } }
    if ($at -lt 0) { throw "No request named '$Name' on the pinned page" }
    $i = $at; while ($lines[$i] -notmatch '^```(http|msgraph-interactive)\s*$') { $i++ }
    $i++; $req = [Collections.Generic.List[string]]::new()
    while ($lines[$i] -notmatch '^```\s*$') { $req.Add($lines[$i]); $i++ }
    if ($req[0] -notmatch '^(GET|POST|PATCH|PUT|DELETE) (\S+)') { throw "Unexpected request line: $($req[0])" }
    $method = $Matches[1]; $uri = $Matches[2]
    $j = 1; while ($j -lt $req.Count -and $req[$j].Trim()) { $j++ }
    $bodyText = (($req | Select-Object -Skip ($j + 1)) -join "`n").Trim()
    [pscustomobject]@{ Method = $method; Uri = $uri; Body = if ($bodyText) { $bodyText | ConvertFrom-Json -AsHashtable } else { $null } }
}

function Get-WifCliCredentialJson {
    <# The credential.json bodies from the az ad app federated-credential create samples, in page order. #>
    $blocks = Get-LearnBlock -Page $script:AppTrustPage -Language 'azurecli-interactive'
    @($blocks | Where-Object { $_ -match '^az ad app federated-credential create' } | ForEach-Object {
            ($_ -split '\(\"credential\.json\" contains the following content\)', 2)[1].Trim() | ConvertFrom-Json -AsHashtable })
}

function Get-WifAzRestSample {
    <# The az rest samples on the app page: @{ Method; Uri; Body }. #>
    param([ValidateSet('POST', 'GET', 'DELETE')][string]$Method = 'POST')
    $blocks = Get-LearnBlock -Page $script:AppTrustPage -Language 'azurecli'
    @($blocks | Where-Object { $_ -match '^az rest ' } | ForEach-Object {
            $m = if ($_ -match '(--method|-m) (\w+)') { $Matches[2].ToUpperInvariant() } else { 'GET' }
            $u = if ($_ -match "(--uri|-u) '([^']+)'") { $Matches[2] } else { $null }
            $b = if ($_ -match "--body '([^']+)'") { $Matches[1] | ConvertFrom-Json -AsHashtable } else { $null }
            [pscustomobject]@{ Method = $m; Uri = $u; Body = $b }
        } | Where-Object Method -EQ $Method)
}

function Invoke-WifAzPowerShellSample {
    <# Run the GitHub Actions New-AzADAppFederatedCredential sample, unmodified, against a stand-in that records its parameters. #>
    $blocks = Get-LearnBlock -Page $script:AppTrustPage -Language 'azurepowershell-interactive'
    $code = @($blocks | Where-Object { $_ -match '^New-AzADAppFederatedCredential' -and $_ -match 'token\.actions\.githubusercontent\.com' })
    if ($code.Count -ne 1) { throw "Expected one GitHub New-AzADAppFederatedCredential sample, found $($code.Count)" }
    $global:WifRun = [pscustomobject]@{ Bound = $null }
    try {
        function global:New-AzADAppFederatedCredential {
            [CmdletBinding()] param([string]$ApplicationObjectId, [string[]]$Audience, [string]$Issuer, [string]$Name, [string]$Subject)
            $global:WifRun.Bound = [pscustomobject]@{ ApplicationObjectId = $ApplicationObjectId; Audience = @($Audience); Issuer = $Issuer; Name = $Name; Subject = $Subject }
        }
        $appObjectId = '0a000000-0000-4000-8000-000000000004'
        & ([scriptblock]::Create("`$appObjectId = '$appObjectId'`n" + $code[0]))
    } finally { Remove-Item 'function:global:New-AzADAppFederatedCredential' -ErrorAction SilentlyContinue }
    $global:WifRun.Bound
}

function Get-WifMiTemplate {
    <# The ARM template on the managed identity page that creates an identity and a federated credential. #>
    $blocks = Get-LearnBlock -Page $script:MiTrustPage -Language 'json'
    $t = @($blocks | Where-Object { $_ -match 'federatedIdentityCredentialAudience' })
    if ($t.Count -ne 1) { throw "Expected one template, found $($t.Count)" }
    $t[0] | ConvertFrom-Json -AsHashtable
}

function Get-WifMiRestSample {
    <# The managed identity page's REST create sample: the http block (@{ Uri; Body }) and the curl command's -d payload (raw text). #>
    $httpBlocks = Get-LearnBlock -Page $script:MiTrustPage -Language 'http'
    $bashBlocks = Get-LearnBlock -Page $script:MiTrustPage -Language 'bash'
    $http = @($httpBlocks | Where-Object { $_ -match '^PUT ' })
    if ($http.Count -ne 1) { throw "Expected one PUT sample, found $($http.Count)" }
    $lines = $http[0] -split "`n"
    $uri = ($lines[0] -replace '^PUT\s+', '').Trim()
    $body = (($lines | Select-Object -Skip 1) -join "`n").Trim()
    $curl = @($bashBlocks | Where-Object { $_ -match '-X PUT' })
    $payload = if ($curl.Count -and ($curl[0] -match "-d '(.+?)' -H")) { $Matches[1] } else { $null }
    [pscustomobject]@{ Uri = $uri; BodyText = $body; CurlPayload = $payload; CurlText = $(if ($curl.Count) { $curl[0] } else { $null }) }
}

function Get-WifRestExample {
    <# One of the pinned Managed Identity REST examples, as parsed JSON. #>
    param([Parameter(Mandatory)][ValidateSet('FederatedIdentityCredentialCreate', 'IdentityCreate', 'IdentityGet')][string]$Name)
    Get-Content -LiteralPath (Join-Path $script:MsiExamples "$Name.json") -Raw | ConvertFrom-Json -AsHashtable
}

function Send-WifRestExample {
    <#
    Build the request a REST example describes and send it to the fake Resource Manager: its subscription,
    resource group and identity name replaced by -Identity's (a fixture identity), everything else as published.
    #>
    param([Parameter(Mandatory)][string]$Name, [Parameter(Mandatory)]$Fake, [Parameter(Mandatory)][string]$Subscription, [Parameter(Mandatory)][string]$ResourceGroup, [Parameter(Mandatory)][string]$Identity)
    $ex = Get-WifRestExample -Name $Name
    $p = $ex.parameters
    $rid = "/subscriptions/$Subscription/resourceGroups/$ResourceGroup/providers/Microsoft.ManagedIdentity/userAssignedIdentities/$Identity"
    $path = switch ($Name) { 'FederatedIdentityCredentialCreate' { "$rid/federatedIdentityCredentials/$($p.federatedIdentityCredentialResourceName)" } default { $rid } }
    $method = if ($Name -eq 'IdentityGet') { 'GET' } else { 'PUT' }
    $body = if ($p.ContainsKey('parameters')) { $p.parameters } else { $null }
    & $Fake.Invoke $method "https://management.azure.com$path`?api-version=$($p['api-version'])" $body $null
}
