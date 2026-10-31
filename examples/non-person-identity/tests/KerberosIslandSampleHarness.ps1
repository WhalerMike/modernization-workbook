# Chapter 06: runs Microsoft Learn's pinned gMSA and dMSA procedures offline and unmodified:
#   examples/third_party/windows-server-msa-pages (Setting up delegated Managed Service Accounts;
#   Delegated Managed Service Accounts overview; Manage group Managed Service Accounts; Create a Key
#   Distribution Service (KDS) root key), from MicrosoftDocs/windowsserverdocs.
# Each PowerShell block is found by its content in the page's source, its Markdown quote and list
# indentation stripped, and run against stand-ins for the cmdlets it calls. The stand-ins take the
# parameters the cmdlet reference pages list, so a parameter a cmdlet doesn't have fails here as it
# would on a domain controller. Nothing is installed, nothing touches the registry or a service, and
# nothing leaves the machine.

$script:MsaPages = Join-Path $PSScriptRoot '../../third_party/windows-server-msa-pages'
$script:DmsaSetupPage = Join-Path $script:MsaPages 'delegated-managed-service-accounts-set-up-dmsa.md'
$script:DmsaOverviewPage = Join-Path $script:MsaPages 'delegated-managed-service-accounts-overview.md'
$script:GmsaManagePage = Join-Path $script:MsaPages 'manage-group-managed-service-accounts.md'
$script:KdsPage = Join-Path $script:MsaPages 'create-the-key-distribution-services-kds-root-key.md'
$script:EntraGmsaPage = Join-Path $PSScriptRoot '../../third_party/entra-service-account-pages/service-accounts-group-managed.md'

function Get-KrbLearnBlock {
    <# Fenced PowerShell blocks from a pinned page, in page order, with '>' quote markers and indentation removed. #>
    param([Parameter(Mandatory)][string]$Page)
    $lines = [IO.File]::ReadAllLines((Resolve-Path -LiteralPath $Page).Path)
    $blocks = [Collections.Generic.List[string]]::new()
    $in = $false; $buf = $null
    foreach ($raw in $lines) {
        $l = $raw -replace '^\s*>\s?', ''
        if (-not $in -and $l -match '^\s*```powershell\s*$') { $in = $true; $buf = [Collections.Generic.List[string]]::new(); continue }
        if ($in -and $l -match '^\s*```\s*$') { $in = $false; $blocks.Add((($buf | ForEach-Object { $_.TrimStart() }) -join "`n").Trim()); continue }
        if ($in) { $buf.Add($l) }
    }
    , $blocks.ToArray()
}

$script:DmsaSamples = [ordered]@{
    RegistryNote      = 'Set-ItemProperty @params'
    CreateDmsa        = 'CreateDelegatedServiceAccount = \$true'
    GrantRetriever    = 'PrincipalsAllowedToRetrieveManagedPassword = "Machine\$"'
    ViewState         = 'Get-ADServiceAccount @params'
    SetState3         = '"msDS-DelegatedMSAState" = 3'
    StartMigration    = 'Start-ADServiceAccountMigration @params'
    RegistryMigration = 'New-ItemProperty @params'
    RestartServices   = 'Restart-Service'
    CompleteMigration = 'Complete-ADServiceAccountMigration @params'
    UndoMigration     = 'Undo-ADServiceAccountMigration @params'
    ResetMigration    = 'Reset-ADServiceAccountMigration @params'
}

function Get-KrbDmsaSample {
    <# One named block from Learn's dMSA set-up page; exactly one block must match. #>
    param([Parameter(Mandatory)][string]$Name)
    if (-not $script:DmsaSamples.Contains($Name)) { throw "Unknown sample '$Name'" }
    $all = Get-KrbLearnBlock -Page $script:DmsaSetupPage
    $hit = @($all | Where-Object { $_ -match $script:DmsaSamples[$Name] })
    if ($hit.Count -ne 1) { throw "Expected one '$Name' block on the pinned dMSA page, found $($hit.Count)" }
    $hit[0]
}

function Get-KrbInlineCode {
    <# Inline code spans from a pinned page that match a pattern. #>
    param([Parameter(Mandatory)][string]$Page, [Parameter(Mandatory)][string]$Pattern)
    $text = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $Page).Path)
    , @([regex]::Matches($text, '`([^`]+)`') | ForEach-Object { $_.Groups[1].Value } | Where-Object { $_ -match $Pattern })
}

$script:StandIns = @('New-ADServiceAccount', 'Set-ADServiceAccount', 'Get-ADServiceAccount', 'Start-ADServiceAccountMigration', 'Complete-ADServiceAccountMigration',
    'Undo-ADServiceAccountMigration', 'Reset-ADServiceAccountMigration', 'Set-ItemProperty', 'New-ItemProperty', 'Get-Service', 'Restart-Service', 'Get-KdsRootKey', 'Add-KdsRootKey')

function Invoke-KrbLearnCode {
    <#
    Run PowerShell from a pinned page against stand-ins. Returns @{ Output; Calls; Error }: Calls lists
    each stand-in call with its bound parameters; Error holds the message if the code failed, as it
    would on a server. Get-Service returns three running services, one of them the migrated account's.
    #>
    param([Parameter(Mandatory)][string]$Code)
    $global:KrbLearnRun = [pscustomobject]@{ Calls = [Collections.Generic.List[object]]::new(); Output = $null; Error = $null }
    try {
        function global:New-ADServiceAccount { [CmdletBinding()] param($Name, $DNSHostName, [switch]$CreateDelegatedServiceAccount, $KerberosEncryptionType, $PrincipalsAllowedToRetrieveManagedPassword, [switch]$RestrictToOutboundAuthenticationOnly, [switch]$RestrictToSingleComputer, $ManagedPasswordIntervalInDays, $Enabled, $Path, $SamAccountName, $Server)
            $global:KrbLearnRun.Calls.Add([pscustomobject]@{ Cmdlet = 'New-ADServiceAccount'; Bound = @{} + $PSBoundParameters }) }
        # The Identity parameter set from Learn's Set-ADServiceAccount reference (windowsserver2025-ps): there is no -Properties.
        function global:Set-ADServiceAccount { [CmdletBinding()] param([Parameter(Position = 0)]$Identity, $AccountExpirationDate, $AccountNotDelegated, [hashtable]$Add, $AuthenticationPolicy, $AuthenticationPolicySilo, $AuthType, $Certificates, [string[]]$Clear,
                $CompoundIdentitySupported, $Credential, $Description, $DisplayName, $DNSHostName, $Enabled, $HomePage, $KerberosEncryptionType, $Partition, [switch]$PassThru, $PrincipalsAllowedToDelegateToAccount,
                $PrincipalsAllowedToRetrieveManagedPassword, [hashtable]$Remove, [hashtable]$Replace, $SamAccountName, $Server, $ServicePrincipalNames, $TrustedForDelegation, $Instance)
            $global:KrbLearnRun.Calls.Add([pscustomobject]@{ Cmdlet = 'Set-ADServiceAccount'; Bound = @{} + $PSBoundParameters }) }
        function global:Get-ADServiceAccount { [CmdletBinding()] param([Parameter(Position = 0)]$Identity, $Filter, [string[]]$Properties, $Server)
            $global:KrbLearnRun.Calls.Add([pscustomobject]@{ Cmdlet = 'Get-ADServiceAccount'; Bound = @{} + $PSBoundParameters })
            [pscustomobject]@{ SamAccountName = "$Identity`$"; 'msDS-DelegatedMSAState' = 0 } }
        foreach ($m in 'Start', 'Complete', 'Undo', 'Reset') {
            $fn = "$m-ADServiceAccountMigration"
            Set-Item "function:global:$fn" -Value ([scriptblock]::Create("[CmdletBinding()] param([Parameter(Position = 0)]`$Identity, `$SupersededAccount, `$Server, `$Credential, `$AuthType) `$global:KrbLearnRun.Calls.Add([pscustomobject]@{ Cmdlet = '$fn'; Bound = @{} + `$PSBoundParameters })"))
        }
        function global:Set-ItemProperty { [CmdletBinding()] param($Path, $Name, $Value, $Type, [switch]$Force)
            $global:KrbLearnRun.Calls.Add([pscustomobject]@{ Cmdlet = 'Set-ItemProperty'; Bound = @{} + $PSBoundParameters }) }
        function global:New-ItemProperty { [CmdletBinding()] param($Path, $Name, $Value, $PropertyType, [switch]$Force)
            $global:KrbLearnRun.Calls.Add([pscustomobject]@{ Cmdlet = 'New-ItemProperty'; Bound = @{} + $PSBoundParameters }) }
        function global:Get-Service { [CmdletBinding()] param()
            $global:KrbLearnRun.Calls.Add([pscustomobject]@{ Cmdlet = 'Get-Service'; Bound = @{} })
            [pscustomobject]@{ Name = 'HRSync'; Status = 'Running'; StartName = 'CORP\svc-hrsync' }
            [pscustomobject]@{ Name = 'W3SVC'; Status = 'Running'; StartName = 'LocalSystem' }
            [pscustomobject]@{ Name = 'Spooler'; Status = 'Running'; StartName = 'LocalSystem' }
            [pscustomobject]@{ Name = 'Backup'; Status = 'Stopped'; StartName = 'CORP\svc-backup' } }
        function global:Restart-Service { [CmdletBinding()] param([Parameter(ValueFromPipeline)]$InputObject)
            process { $global:KrbLearnRun.Calls.Add([pscustomobject]@{ Cmdlet = 'Restart-Service'; Bound = @{ Name = $InputObject.Name } }) } }
        function global:Get-KdsRootKey { [CmdletBinding()] param()
            $global:KrbLearnRun.Calls.Add([pscustomobject]@{ Cmdlet = 'Get-KdsRootKey'; Bound = @{} })
            # Learn: returns, for each root key, its identifier and its value.
            [pscustomobject]@{ KeyId = [guid]'c0ffee00-0000-4000-8000-0000000000d1'; KeyValue = [byte[]](1..64); EffectiveTime = [datetime]'2024-03-01T02:00:00Z'; CreationTime = [datetime]'2024-03-01T12:00:00Z'; IsFormatValid = $true } }
        function global:Add-KdsRootKey { [CmdletBinding()] param($EffectiveTime, [switch]$EffectiveImmediately)
            $global:KrbLearnRun.Calls.Add([pscustomobject]@{ Cmdlet = 'Add-KdsRootKey'; Bound = @{} + $PSBoundParameters }) }
        try { $global:KrbLearnRun.Output = @(& ([scriptblock]::Create($Code))) }
        catch { $global:KrbLearnRun.Error = "$_" }
    } finally {
        foreach ($f in $script:StandIns) { Remove-Item "function:global:$f" -ErrorAction SilentlyContinue }
    }
    $global:KrbLearnRun
}

function Test-KrbParses {
    <# Whether a block parses as PowerShell; Learn's gMSA templates use <placeholders>, which don't. #>
    param([Parameter(Mandatory)][string]$Code)
    $tokens = $null; $errors = $null
    $null = [Management.Automation.Language.Parser]::ParseInput($Code, [ref]$tokens, [ref]$errors)
    @($errors).Count -eq 0
}
