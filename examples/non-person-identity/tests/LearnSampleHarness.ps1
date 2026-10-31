# Runs Microsoft Learn's pinned samples offline and unmodified:
#   examples/third_party/entra-service-account-pages       (Chapter 01: Get-ADObject, Get-ADUser, Get-ADServiceAccount, Get-MgServicePrincipal)
#   examples/third_party/entra-app-credentials-export-page (Chapter 01: the app registration secrets and certificates export script)
#   examples/third_party/graph-applications-tutorial-page  (Chapter 02: owners and serviceManagementReference over HTTP)
# The PowerShell samples run against stand-ins for the cmdlets they call, served from the fixture
# estate; the HTTP samples are parsed and sent to the fake Graph. Nothing is installed, nothing
# signs in, and nothing leaves the machine.

$script:ThirdParty = Join-Path $PSScriptRoot '../../third_party'
$script:UserPage = Join-Path $script:ThirdParty 'entra-service-account-pages/service-accounts-user-on-premises.md'
$script:GmsaPage = Join-Path $script:ThirdParty 'entra-service-account-pages/service-accounts-group-managed.md'
$script:SpPage = Join-Path $script:ThirdParty 'entra-service-account-pages/service-accounts-principal.md'
$script:ExportPage = Join-Path $script:ThirdParty 'entra-app-credentials-export-page/powershell-export-all-app-registrations-secrets-and-certs.md'
$script:TutorialPage = Join-Path $script:ThirdParty 'graph-applications-tutorial-page/tutorial-applications-basics.md'

function Get-LearnBlock {
    <# Fenced code blocks of one language (case-insensitive) from a pinned Learn page, in page order. #>
    param([Parameter(Mandatory)][string]$Page, [Parameter(Mandatory)][string[]]$Language)
    $lines = [IO.File]::ReadAllLines((Resolve-Path -LiteralPath $Page).Path)
    $blocks = [Collections.Generic.List[string]]::new()
    $in = $false; $buf = $null
    $langs = ($Language | ForEach-Object { [regex]::Escape($_) }) -join '|'
    foreach ($l in $lines) {
        if (-not $in -and $l -match "^\s*``````(?i:$langs)\s*$") { $in = $true; $buf = [Collections.Generic.List[string]]::new(); continue }
        if ($in -and $l -match '^\s*```\s*$') { $in = $false; $blocks.Add((($buf -join "`n").Trim())); continue }
        if ($in) { $buf.Add($l) }
    }
    , $blocks.ToArray()
}

function Get-LearnInlineCode {
    <# Inline code spans from a pinned page that contain a pattern (the service principal page puts its commands in tables). #>
    param([Parameter(Mandatory)][string]$Page, [Parameter(Mandatory)][string]$Pattern)
    $text = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $Page).Path)
    , @([regex]::Matches($text, '`([^`]+)`') | ForEach-Object { $_.Groups[1].Value } | Where-Object { $_ -match $Pattern })
}

function Get-LearnAdSample {
    <# The named Active Directory sample from the two pinned AD pages. #>
    param([Parameter(Mandatory)][ValidateSet('Delegation', 'Spn', 'PasswordNeverExpires', 'ServiceAccounts')][string]$Name)
    if ($Name -eq 'ServiceAccounts') { $blocks = Get-LearnBlock -Page $script:GmsaPage -Language 'powershell' }
    else { $blocks = Get-LearnBlock -Page $script:UserPage -Language 'powershell' }
    $match = @(switch ($Name) {
            'Delegation' { $blocks | Where-Object { $_ -match '^Get-ADObject' } }
            'Spn' { $blocks | Where-Object { $_ -match 'servicePrincipalName -ne \$null' } }
            'PasswordNeverExpires' { $blocks | Where-Object { $_ -match 'PasswordNeverExpires -eq \$true' } }
            'ServiceAccounts' { $blocks | Where-Object { $_ -match 'Get-ADServiceAccount' } }
        })
    if ($match.Count -ne 1) { throw "Expected one '$Name' sample on the pinned page, found $($match.Count)" }
    $match[0]
}

function Invoke-LearnAdSample {
    <#
    Run one AD sample against stand-ins for Get-ADObject, Get-ADUser and Get-ADServiceAccount served
    from the fixture estate. The Get-ADObject stand-in evaluates only the delegation filter Learn's
    sample passes and throws on any other, so a new upstream filter fails the tests instead of being
    half-read. Returns @{ Output; Calls }.
    #>
    param([Parameter(Mandatory)][string]$Name, [Parameter(Mandatory)][string]$Fixture)
    Import-Module (Join-Path $PSScriptRoot '../powershell/NpiCore/NpiCore.psm1') -Force -Global
    $t = Get-Content -LiteralPath $Fixture -Raw | ConvertFrom-Json -AsHashtable
    $global:LearnRun = [pscustomobject]@{ Estate = $t; Calls = [Collections.Generic.List[object]]::new(); Output = $null }
    try {
        function global:Get-ADObject {
            [CmdletBinding()] param($Filter, [string[]]$Properties)
            $global:LearnRun.Calls.Add([pscustomobject]@{ Cmdlet = 'Get-ADObject'; Filter = "$Filter"; Properties = $Properties })
            $norm = ("$Filter" -replace '\s+', ' ').Trim()
            if ($norm -ne "(msDS-AllowedToDelegateTo -like '*') -or (UserAccountControl -band 0x0080000) -or (UserAccountControl -band 0x1000000)") { throw "The stand-in evaluates only Learn's delegation filter, not: $norm" }
            foreach ($o in $global:LearnRun.Estate.ad.objects) {
                $uac = [int64]$o.UserAccountControl
                if (@($o.AllowedToDelegateTo).Count -or ($uac -band 0x80000) -or ($uac -band 0x1000000)) {
                    [pscustomobject]@{ DistinguishedName = $o.DistinguishedName; ObjectClass = $o.ObjectClass; samAccountName = $o.SamAccountName; servicePrincipalName = @($o.ServicePrincipalName); userAccountControl = $uac; 'msDS-AllowedToDelegateTo' = @($o.AllowedToDelegateTo) }
                }
            }
        }
        # Get-ADUser and Get-ADServiceAccount answer from the shared fake AD, which shapes objects as the cmdlets do.
        $global:LearnAd = New-NpiFixtureAdInvoker -Path $Fixture
        function global:Get-ADUser {
            [CmdletBinding()] param($Filter, [string[]]$Properties)
            $global:LearnRun.Calls.Add([pscustomobject]@{ Cmdlet = 'Get-ADUser'; Filter = "$Filter"; Properties = $Properties })
            if ("$Filter" -ne '*') { throw 'The stand-in serves -Filter * only' }
            & $global:LearnAd.Invoke 'Get-ADUser' @{ LDAPFilter = '(objectClass=user)' }
        }
        function global:Get-ADServiceAccount {
            [CmdletBinding()] param($Filter, [string[]]$Properties)
            $global:LearnRun.Calls.Add([pscustomobject]@{ Cmdlet = 'Get-ADServiceAccount'; Filter = "$Filter"; Properties = $Properties })
            if ("$Filter" -ne '*') { throw 'The stand-in serves -Filter * only' }
            & $global:LearnAd.Invoke 'Get-ADServiceAccount' @{ Filter = '*' }
        }
        $code = Get-LearnAdSample -Name $Name
        $global:LearnRun.Output = @(& ([scriptblock]::Create($code)))
    } finally {
        foreach ($f in 'Get-ADObject', 'Get-ADUser', 'Get-ADServiceAccount') { Remove-Item "function:global:$f" -ErrorAction SilentlyContinue }
        Remove-Variable -Name LearnAd -Scope Global -ErrorAction SilentlyContinue
    }
    $global:LearnRun
}

function ConvertTo-LearnSdkServicePrincipal {
    param([hashtable]$Sp)
    [pscustomobject]@{
        Id = $Sp.id; AppId = $Sp.appId; DisplayName = $Sp.displayName; ServicePrincipalType = $Sp.servicePrincipalType
        AppOwnerOrganizationId = $Sp.appOwnerOrganizationId; SignInAudience = $Sp.signInAudience; Tags = @($Sp.tags)
    }
}

function Invoke-LearnSpSample {
    <# Run one of the service principal page's inline commands against a stand-in for Get-MgServicePrincipal. #>
    param([Parameter(Mandatory)][ValidateSet('All', 'Tagged')][string]$Name, [Parameter(Mandatory)][string]$Fixture)
    $t = Get-Content -LiteralPath $Fixture -Raw | ConvertFrom-Json -AsHashtable
    $global:LearnRun = [pscustomobject]@{ Estate = $t; Calls = [Collections.Generic.List[object]]::new(); Output = $null }
    $codes = Get-LearnInlineCode -Page $script:SpPage -Pattern '^Get-MgServicePrincipal'
    $code = @(switch ($Name) { 'All' { $codes | Where-Object { $_ -notmatch '\|' } } 'Tagged' { $codes | Where-Object { $_ -match 'WindowsAzureActiveDirectoryIntegratedApp' } } })
    if ($code.Count -ne 1) { throw "Expected one '$Name' command on the pinned page, found $($code.Count)" }
    try {
        function global:Get-MgServicePrincipal {
            [CmdletBinding()] param([switch]$All, [string]$Filter)
            $global:LearnRun.Calls.Add([pscustomobject]@{ Cmdlet = 'Get-MgServicePrincipal'; Bound = @($PSBoundParameters.Keys) })
            $global:LearnRun.Estate.graph.servicePrincipals | ForEach-Object { ConvertTo-LearnSdkServicePrincipal $_ }
        }
        $global:LearnRun.Output = @(& ([scriptblock]::Create($code[0])))
    } finally { Remove-Item 'function:global:Get-MgServicePrincipal' -ErrorAction SilentlyContinue }
    $global:LearnRun
}

function Get-LearnExportScript {
    $blocks = @(Get-LearnBlock -Page $script:ExportPage -Language 'powershell')
    if ($blocks.Count -ne 1) { throw "Expected one script on the export page, found $($blocks.Count)" }
    $blocks[0]
}

function Invoke-LearnExportScript {
    <#
    Run the export script, unmodified, against stand-ins for Connect-MgGraph, Get-MgApplication and
    Get-MgApplicationOwner (shaped like the SDK's objects, owners' properties in AdditionalProperties),
    Read-Host (answers with a temporary CSV path) and Write-Host (silenced). Export-Csv is real.
    Returns @{ Output (the CSV rows); Calls; Connected; Prompts }.
    #>
    param([Parameter(Mandatory)][string]$Fixture)
    $t = Get-Content -LiteralPath $Fixture -Raw | ConvertFrom-Json -AsHashtable
    $csv = Join-Path ([IO.Path]::GetTempPath()) ("npi-learn-export-{0}.csv" -f [guid]::NewGuid())
    $global:LearnRun = [pscustomobject]@{ Estate = $t; Calls = [Collections.Generic.List[object]]::new(); Connected = $null; Prompts = [Collections.Generic.List[string]]::new(); Csv = $csv; Output = $null }
    try {
        function global:Connect-MgGraph { [CmdletBinding()] param($Scopes, $Environment, $TenantId, $ClientId) $global:LearnRun.Connected = [pscustomobject]@{ Bound = @($PSBoundParameters.Keys); Scopes = @($Scopes) } }
        function global:Write-Host { param([Parameter(ValueFromRemainingArguments)]$Rest) }
        function global:Read-Host { param($Prompt) $global:LearnRun.Prompts.Add("$Prompt"); $global:LearnRun.Csv }
        function global:Get-MgApplication {
            [CmdletBinding()] param([string]$ApplicationId, [switch]$All, [string[]]$Property)
            $global:LearnRun.Calls.Add([pscustomobject]@{ Cmdlet = 'Get-MgApplication'; Bound = @($PSBoundParameters.Keys) })
            $cred = { param($c) [pscustomobject]@{ DisplayName = $c.displayName; StartDateTime = [datetime]$c.startDateTime; EndDateTime = [datetime]$c.endDateTime } }
            $apps = @($global:LearnRun.Estate.graph.applications | ForEach-Object {
                    [pscustomobject]@{ Id = $_.id; AppId = $_.appId; DisplayName = $_.displayName
                        PasswordCredentials = @($_.passwordCredentials | ForEach-Object { & $cred $_ }); KeyCredentials = @($_.keyCredentials | ForEach-Object { & $cred $_ }) }
                })
            if ($ApplicationId) { $apps | Where-Object Id -EQ $ApplicationId } else { $apps }
        }
        function global:Get-MgApplicationOwner {
            [CmdletBinding()] param([string]$ApplicationId, [switch]$All)
            $global:LearnRun.Calls.Add([pscustomobject]@{ Cmdlet = 'Get-MgApplicationOwner'; Bound = @($PSBoundParameters.Keys); ApplicationId = $ApplicationId })
            $map = $global:LearnRun.Estate.graph.applicationOwners
            foreach ($o in @($(if ($map.ContainsKey($ApplicationId)) { $map[$ApplicationId] }))) {
                $props = @{ '@odata.type' = $o['@odata.type'] }
                $u = @($global:LearnRun.Estate.graph.users | Where-Object { $_.id -eq $o.id })
                $s = @($global:LearnRun.Estate.graph.servicePrincipals | Where-Object { $_.id -eq $o.id })
                if ($u.Count) { $props.userPrincipalName = $u[0].userPrincipalName; $props.displayName = $u[0].displayName }
                elseif ($s.Count) { $props.displayName = $s[0].displayName }
                [pscustomobject]@{ Id = $o.id; AdditionalProperties = $props }
            }
        }
        & ([scriptblock]::Create((Get-LearnExportScript)))
        $global:LearnRun.Output = @(Import-Csv -LiteralPath $csv)
    } finally {
        foreach ($f in 'Connect-MgGraph', 'Write-Host', 'Read-Host', 'Get-MgApplication', 'Get-MgApplicationOwner') { Remove-Item "function:global:$f" -ErrorAction SilentlyContinue }
        Remove-Item -LiteralPath $csv -ErrorAction SilentlyContinue
    }
    $global:LearnRun
}

function Get-LearnHttpSample {
    <#
    One HTTP request sample from the Graph tutorial, found by the name in its blockType comment:
    @{ Method; Uri; Headers; Body (hashtable or $null) }.
    #>
    param([Parameter(Mandatory)][string]$Name)
    $lines = [IO.File]::ReadAllLines((Resolve-Path -LiteralPath $script:TutorialPage).Path)
    $at = -1
    for ($i = 0; $i -lt $lines.Count; $i++) { if ($lines[$i] -match "^\s*`"name`": `"$([regex]::Escape($Name))`"") { $at = $i; break } }
    if ($at -lt 0) { throw "No request named '$Name' on the pinned page" }
    $i = $at; while ($lines[$i] -notmatch '^```(http|msgraph-interactive)\s*$') { $i++ }
    $i++; $req = [Collections.Generic.List[string]]::new()
    while ($lines[$i] -notmatch '^```\s*$') { $req.Add($lines[$i]); $i++ }
    if ($req[0] -notmatch '^(GET|POST|PATCH|DELETE) (.+)$') { throw "Unexpected request line: $($req[0])" }
    $method = $Matches[1]; $uri = $Matches[2]
    $headers = @{}; $j = 1
    while ($j -lt $req.Count -and $req[$j].Trim()) { if ($req[$j] -match '^([A-Za-z-]+):\s*(.+)$') { $headers[$Matches[1]] = $Matches[2].Trim() }; $j++ }
    $bodyText = (($req | Select-Object -Skip ($j + 1)) -join "`n").Trim()
    [pscustomobject]@{ Name = $Name; Method = $method; Uri = $uri; Headers = $headers; Body = if ($bodyText) { $bodyText | ConvertFrom-Json -AsHashtable } else { $null } }
}

function Send-LearnHttpSample {
    <# Send a parsed sample to the fake Graph, as published or with -Replace @{ old = new } applied to the URI and body. #>
    param([Parameter(Mandatory)]$Sample, [Parameter(Mandatory)]$Fake, [hashtable]$Replace = @{}, [switch]$NoHeaders)
    $uri = $Sample.Uri; $bodyJson = if ($Sample.Body) { $Sample.Body | ConvertTo-Json -Depth 10 } else { $null }
    foreach ($k in $Replace.Keys) { $uri = $uri.Replace($k, $Replace[$k]); if ($bodyJson) { $bodyJson = $bodyJson.Replace($k, $Replace[$k]) } }
    $body = if ($bodyJson) { $bodyJson | ConvertFrom-Json -AsHashtable } else { $null }
    $headers = if ($NoHeaders) { $null } else { $Sample.Headers }
    # The fake reads $count=true from the query; the sample's URI carries it.
    & $Fake.Invoke $Sample.Method $uri $body $headers
}
