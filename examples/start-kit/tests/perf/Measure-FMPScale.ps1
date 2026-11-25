#Requires -Version 5.1
<#
.SYNOPSIS
    Times the directory collectors against a synthetic domain of any size: 500,000 users and
    50,000 computers by default. Nothing is generated on disk except the collectors' output.

.DESCRIPTION
    Defines stand-in Get-AD* functions that make fictional objects in scale.example as they
    are read, partition by partition, the way ADWS pages them back: 20 regional OUs plus
    CN=Users and CN=Computers, 3 group memberships per user, an SPN on 1 user in 100, four
    SPNs per computer, 1 duplicate SPN in 1,000 computers. Then runs the user, computer,
    group, OU and SPN collectors and records each one's time and the process's peak working
    set. Run it in a fresh Windows PowerShell 5.1 (the kit's declared edition) without the
    ActiveDirectory module loaded, so the stand-ins answer.

    -ModulePath can point at another copy of FMPADAssessment (an earlier kit version) to
    compare. -FailEvery makes the stand-ins throw an ADWS timeout once every N partitions,
    to time the retries.

.EXAMPLE
    powershell.exe -NoProfile -File .\tests\perf\Measure-FMPScale.ps1 -Users 500000 -Computers 50000 -OutputPath C:\FMWLabs\scale

.EXAMPLE
    powershell.exe -NoProfile -File .\tests\perf\Measure-FMPScale.ps1 -Users 50000 -Computers 5000 -Collector Users -FailEvery 7
#>
[CmdletBinding()]
param(
    [int]$Users = 500000,
    [int]$Computers = 50000,
    [int]$Groups = 20000,
    [int]$Regions = 20,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$ModulePath,
    [ValidateSet('Users', 'Computers', 'Groups', 'OUs', 'SPNs')][string[]]$Collector = @('Users', 'Computers', 'Groups', 'OUs', 'SPNs'),
    [int]$FailEvery = 0,
    [string]$ResultPath
)
$ErrorActionPreference = 'Stop'
if (-not $ModulePath) { $ModulePath = Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) 'powershell\FMPADAssessment' }
if (Get-Module ActiveDirectory) { throw 'Run this in a session without the ActiveDirectory module: the stand-ins must answer, not a real domain.' }

$global:ScaleSpec = @{ Users = $Users; Computers = $Computers; Groups = $Groups; Regions = $Regions; FailEvery = $FailEvery; Calls = 0 }
$global:ScaleHead = 'DC=scale,DC=example'
$global:ScaleParts = @(@(1..$Regions | ForEach-Object { 'OU=Region{0:D2},{1}' -f $_, $global:ScaleHead }) + "CN=Users,$($global:ScaleHead)" + "CN=Computers,$($global:ScaleHead)")
$global:ScaleEpoch = [datetime]'2026-11-01T00:00:00'

function global:Get-ScaleSlot([string]$SearchBase, [string]$SearchScope) {
    # Which partition a search covers: -1 for the whole domain, -2 for nothing (head, one level).
    if (-not $SearchBase -or ($SearchBase -eq $global:ScaleHead -and $SearchScope -ne 'OneLevel')) { return -1 }
    if ($SearchBase -eq $global:ScaleHead) { return -2 }
    $i = [array]::IndexOf($global:ScaleParts, $SearchBase)
    if ($i -lt 0) { return -2 }
    $i
}
function global:Test-ScaleFailure {
    $global:ScaleSpec.Calls++
    if ($global:ScaleSpec.FailEvery -gt 0 -and ($global:ScaleSpec.Calls % $global:ScaleSpec.FailEvery) -eq 0) {
        throw [System.TimeoutException]::new('The operation returned because the timeout limit was exceeded.')
    }
}
function global:Get-ScaleIndexes([int]$Count, [int]$Slot) {
    $n = $global:ScaleParts.Count
    if ($Slot -eq -2) { return }
    if ($Slot -eq -1) { for ($i = 0; $i -lt $Count; $i++) { $i } ; return }
    for ($i = $Slot; $i -lt $Count; $i += $n) { $i }
}
function global:Get-ScaleUser([int]$i) {
    $part = $global:ScaleParts[$i % $global:ScaleParts.Count]
    [pscustomobject]@{
        SamAccountName = 'u{0:D7}' -f $i; UserPrincipalName = 'u{0:D7}@scale.example' -f $i; DisplayName = "User $i"; Enabled = ($i % 10) -ne 0
        LastLogonDate = $global:ScaleEpoch.AddDays(-($i % 400)); PasswordLastSet = $global:ScaleEpoch.AddDays(-($i % 700)); PasswordNeverExpires = ($i % 50) -eq 0
        PasswordExpired = $false; LockedOut = $false; AccountExpirationDate = $null; AdminCount = if ($i % 5000 -eq 0) { 1 } else { $null }
        TrustedForDelegation = ($i % 100000) -eq 7; TrustedToAuthForDelegation = $false; AccountNotDelegated = $false; 'msDS-AllowedToDelegateTo' = @()
        MemberOf = @(('CN=g{0:D6},{1}' -f ($i % $global:ScaleSpec.Groups), $part), ('CN=g{0:D6},{1}' -f (($i * 7) % $global:ScaleSpec.Groups), $part), "CN=All Staff,CN=Users,$($global:ScaleHead)")
        ServicePrincipalName = if ($i % 100 -eq 0) { @("HTTP/app$i.scale.example") } else { @() }
        Created = $global:ScaleEpoch.AddDays(-1000); Modified = $global:ScaleEpoch; Description = $null; Department = "Dept $($i % 40)"; Title = 'Staff'
        DistinguishedName = 'CN=u{0:D7},{1}' -f $i, $part; SID = 'S-1-5-21-9-9-9-{0}' -f (10000 + $i); ObjectClass = 'user'; Name = 'u{0:D7}' -f $i
    }
}
function global:Get-ScaleComputer([int]$i) {
    $part = $global:ScaleParts[$i % $global:ScaleParts.Count]
    $name = 'C{0:D6}' -f $i
    $os = switch ($i % 5) { 0 { 'Windows Server 2019 Standard' } 1 { 'Windows Server 2022 Standard' } default { 'Windows 11 Enterprise' } }
    [pscustomobject]@{
        Name = $name; DNSHostName = "$name.scale.example".ToLowerInvariant(); OperatingSystem = $os; OperatingSystemVersion = '10.0'; Enabled = ($i % 20) -ne 0
        LastLogonDate = $global:ScaleEpoch.AddDays(-($i % 200)); PasswordLastSet = $global:ScaleEpoch.AddDays(-($i % 200)); Created = $global:ScaleEpoch.AddDays(-900); Modified = $global:ScaleEpoch
        MemberOf = @(); ServicePrincipalName = @("HOST/$name", "HOST/$name.scale.example", "RestrictedKrbHost/$name", "TERMSRV/$name.scale.example")
        TrustedForDelegation = ($i % 10000) -eq 3; TrustedToAuthForDelegation = $false; 'msDS-AllowedToDelegateTo' = @(); PrincipalsAllowedToDelegateToAccount = @()
        'msDS-SupportedEncryptionTypes' = 28; Description = $null; DistinguishedName = 'CN={0},{1}' -f $name, $part; SID = 'S-1-5-21-9-9-9-{0}' -f (2000000 + $i)
        ObjectClass = 'computer'; IPv4Address = $null
    }
}
function global:Get-ScaleGroup([int]$i) {
    $part = $global:ScaleParts[$i % $global:ScaleParts.Count]
    [pscustomobject]@{
        SamAccountName = 'g{0:D6}' -f $i; Name = 'g{0:D6}' -f $i; DisplayName = $null; Description = $null; GroupCategory = 'Security'; GroupScope = 'Global'
        Members = @(1..(1 + $i % 25) | ForEach-Object { 'CN=u{0:D7},{1}' -f $_, $part }); MemberOf = if ($i % 100 -eq 0) { @('CN=g{0:D6},{1}' -f ($i + 1), $part) } else { @() }
        ManagedBy = $null; Created = $global:ScaleEpoch; Modified = $global:ScaleEpoch; AdminCount = $null
        DistinguishedName = 'CN=g{0:D6},{1}' -f $i, $part; SID = 'S-1-5-21-9-9-9-{0}' -f (3000000 + $i); ObjectClass = 'group'
    }
}

function global:Get-ADForest { [pscustomobject]@{ Name = 'scale.example'; RootDomain = 'scale.example'; Domains = @('scale.example') } }
function global:Get-ADDomain { param($Server, $Identity) [pscustomobject]@{ DNSRoot = 'scale.example'; DistinguishedName = $global:ScaleHead; DomainSID = 'S-1-5-21-9-9-9'; PDCEmulator = 'dc1.scale.example' } }
function global:Get-ADDomainController { param($Filter, $Server, $DomainName, [switch]$Discover, $Service) @([pscustomobject]@{ Name = 'DC1'; HostName = 'dc1.scale.example' }) }
function global:Get-ADGroupMember { param($Identity, [switch]$Recursive, $Server) if ("$Identity" -like '*-512') { [pscustomobject]@{ SID = 'S-1-5-21-9-9-9-10000'; objectClass = 'user' } } }
function global:Get-ADServiceAccount { param($Filter, $Server, $Properties, $ResultPageSize, $Identity) @() }
function global:Get-ADOrganizationalUnit {
    param($Filter, $Server, $Properties, $SearchBase, $SearchScope, $ResultPageSize)
    $ous = @($global:ScaleParts | Where-Object { $_ -like 'OU=*' } | ForEach-Object { [pscustomobject]@{ Name = ($_ -split ',')[0].Substring(3); DistinguishedName = $_; ObjectClass = 'organizationalUnit'
                CanonicalName = $null; Description = $null; ManagedBy = $null; Created = $null; Modified = $null; ProtectedFromAccidentalDeletion = $true; LinkedGroupPolicyObjects = @(); gPOptions = 0 } })
    if ($SearchBase -and $SearchScope -eq 'OneLevel') { return @($ous | Where-Object { ($_.DistinguishedName -split ',', 2)[1] -eq $SearchBase }) }
    $ous
}
function global:Get-ADUser {
    param($Filter, $LDAPFilter, $Identity, $Server, $Properties, $SearchBase, $SearchScope, $ResultPageSize, $ResultSetSize)
    if ($Identity) { return Get-ScaleUser ([int]("$Identity" -replace '.*-', '') - 10000) }
    Test-ScaleFailure
    foreach ($i in (Get-ScaleIndexes $global:ScaleSpec.Users (Get-ScaleSlot $SearchBase $SearchScope))) { Get-ScaleUser $i }
}
function global:Get-ADComputer {
    param($Filter, $LDAPFilter, $Identity, $Server, $Properties, $SearchBase, $SearchScope, $ResultPageSize, $ResultSetSize)
    Test-ScaleFailure
    foreach ($i in (Get-ScaleIndexes $global:ScaleSpec.Computers (Get-ScaleSlot $SearchBase $SearchScope))) { Get-ScaleComputer $i }
}
function global:Get-ADGroup {
    param($Filter, $LDAPFilter, $Identity, $Server, $Properties, $SearchBase, $SearchScope, $ResultPageSize, $ResultSetSize)
    Test-ScaleFailure
    foreach ($i in (Get-ScaleIndexes $global:ScaleSpec.Groups (Get-ScaleSlot $SearchBase $SearchScope))) { Get-ScaleGroup $i }
}
function global:Get-ADObject {
    param($Filter, $LDAPFilter, $Identity, $Server, $Properties, $SearchBase, $SearchScope, $ResultPageSize, $ResultSetSize)
    $slot = Get-ScaleSlot $SearchBase $SearchScope
    if ($LDAPFilter -eq '(objectClass=*)' -and $SearchBase -eq $global:ScaleHead -and $SearchScope -eq 'OneLevel') {
        return @($global:ScaleParts | ForEach-Object { [pscustomobject]@{ DistinguishedName = $_; ObjectClass = if ($_ -like 'OU=*') { 'organizationalUnit' } else { 'container' }; ObjectGUID = [guid]::NewGuid() } })
    }
    Test-ScaleFailure
    switch -Wildcard ($LDAPFilter) {
        '*objectClass=user*' { foreach ($i in (Get-ScaleIndexes $global:ScaleSpec.Users $slot)) { [pscustomobject]@{ DistinguishedName = 'CN=u{0:D7},{1}' -f $i, $global:ScaleParts[$i % $global:ScaleParts.Count] } } }
        '*objectCategory=computer*' { foreach ($i in (Get-ScaleIndexes $global:ScaleSpec.Computers $slot)) { [pscustomobject]@{ DistinguishedName = 'CN=C{0:D6},{1}' -f $i, $global:ScaleParts[$i % $global:ScaleParts.Count] } } }
        '*objectCategory=group*' { foreach ($i in (Get-ScaleIndexes $global:ScaleSpec.Groups $slot)) { [pscustomobject]@{ DistinguishedName = 'CN=g{0:D6},{1}' -f $i, $global:ScaleParts[$i % $global:ScaleParts.Count] } } }
        '(servicePrincipalName=*)' {
            foreach ($i in (Get-ScaleIndexes $global:ScaleSpec.Computers $slot)) {
                $c = Get-ScaleComputer $i
                $spns = @($c.ServicePrincipalName)
                if ($i % 1000 -eq 5) { $spns += 'HTTP/shared.scale.example' }
                [pscustomobject]@{ servicePrincipalName = $spns; sAMAccountName = "$($c.Name)`$"; objectClass = @('top', 'computer'); userAccountControl = if ($c.Enabled) { 4096 } else { 4098 }
                    lastLogonTimestamp = $c.LastLogonDate.ToFileTimeUtc(); dNSHostName = $c.DNSHostName; DistinguishedName = $c.DistinguishedName }
            }
            foreach ($i in (Get-ScaleIndexes $global:ScaleSpec.Users $slot)) {
                if ($i % 100 -ne 0) { continue }
                [pscustomobject]@{ servicePrincipalName = @("HTTP/app$i.scale.example"); sAMAccountName = 'u{0:D7}' -f $i; objectClass = @('top', 'person', 'user'); userAccountControl = 512
                    lastLogonTimestamp = $global:ScaleEpoch.AddDays(-($i % 400)).ToFileTimeUtc(); dNSHostName = $null; DistinguishedName = 'CN=u{0:D7},{1}' -f $i, $global:ScaleParts[$i % $global:ScaleParts.Count] }
            }
        }
        default { @() }
    }
}
function global:Get-Acl { param($Path) [pscustomobject]@{ Access = @() } }

Import-Module $ModulePath -Force
$version = (Get-Module FMPADAssessment).Version
$out = [System.IO.Path]::GetFullPath($OutputPath)
$hasContext = & (Get-Module FMPADAssessment) { [bool](Get-Command -Name Initialize-FMPRunContext -ErrorAction SilentlyContinue) }
if ($hasContext) {
    & (Get-Module FMPADAssessment) { param($o) $null = Initialize-FMPRunContext -RunPath $o -Quiet -RetryBaseSeconds 0.1 } $out
}
$results = @()
$plan = [ordered]@{
    Users     = { Get-FMPUserInventory -OutputPath $out -Domain scale.example -AsOf $global:ScaleEpoch }
    Computers = { Get-FMPComputerInventory -OutputPath $out -Domain scale.example -AsOf $global:ScaleEpoch }
    Groups    = { Get-FMPGroupInventory -OutputPath $out -Domain scale.example }
    OUs       = { Get-FMPOUHierarchy -OutputPath $out -Domain scale.example }
    SPNs      = { Get-FMPKerberosSpnMap -OutputPath $out -Domain scale.example -RootDomain scale.example -AsOf $global:ScaleEpoch }
}
foreach ($name in $plan.Keys) {
    if ($Collector -notcontains $name) { continue }
    [GC]::Collect()
    $global:ScaleSpec.Calls = 0
    $sw = [Diagnostics.Stopwatch]::StartNew()
    $err = $null
    try { $null = & $plan[$name] } catch { $err = $_.Exception.Message }
    $sw.Stop()
    $p = [Diagnostics.Process]::GetCurrentProcess(); $p.Refresh()
    $r = [pscustomobject][ordered]@{
        Collector = $name; Seconds = [math]::Round($sw.Elapsed.TotalSeconds, 1); PeakWorkingSetMB = [math]::Round($p.PeakWorkingSet64 / 1MB)
        Error = $err; KitModuleVersion = "$version"; PowerShell = "$($PSVersionTable.PSEdition) $($PSVersionTable.PSVersion)"
        Users = $Users; Computers = $Computers; Groups = $Groups; FailEvery = $FailEvery
    }
    $results += $r
    $r | Format-List | Out-String | Write-Host
}
$results | Format-Table Collector, Seconds, PeakWorkingSetMB, Error -AutoSize | Out-String | Write-Host
if ($ResultPath) { $results | ConvertTo-Json | Out-File -FilePath $ResultPath -Encoding utf8 }
