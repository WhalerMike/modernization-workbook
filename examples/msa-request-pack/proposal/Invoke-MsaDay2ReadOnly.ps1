#Requires -Modules ActiveDirectory
<#
.SYNOPSIS
    Day 2, part R: the read-only production checks behind the managed service account production proposal.
    Reads the forest and domain and writes one evidence file per step, plus manifest.json with each file's
    SHA-256. It writes nothing to Active Directory, any host, SailPoint or ServiceNow.

.DESCRIPTION
    Steps, each with the evidence file it saves and the proposal placeholder it fills:
      R0  00-context.json                 who ran it, where, when                       <domain-fqdn>
      R1  01-kds-root-keys.json           KDS root keys: count, created, age in hours   <kds-key-count>, <kds-key-created>
      R2  02-domain-controllers.csv       domain controllers by operating system        <dc-os-summary>, <ws2025-dc-count>
      R3  03-functional-levels.json       forest and domain functional levels           <forest-functional-level>, <domain-functional-level>
      R4  04-user-service-accounts.csv    user accounts with an SPN or delegation       <user-service-account-count>, <spn-count>, <privileged-service-account-count>
      R5  05-duplicate-spns.txt           setspn -X -F                                  <duplicate-spn-count>
      R6  06-managed-service-accounts.csv the sMSAs, gMSAs and dMSAs already there      <existing-gmsa-count>
      R7  07-service-account-ou-acl.csv   who may create objects in the service-account OU   <service-account-ou-status>
      R8  08-ou-create-child-rights.csv   create-child rights on every OU (dMSA exposure)    <create-child-holders>
          summary.json                    every placeholder value in one file

    R1 reads only the KDS root keys' start and creation times (msKds-UseStartTime, msKds-CreateTime), never the key
    value. By default only Domain Admins, Enterprise Admins and SYSTEM can read those objects; with no right, R1 records
    'not readable' and the script goes on. Don't use Get-KdsRootKey for this: it returns the key value as well.

    Runs in Windows PowerShell 5.1 or PowerShell 7 with the RSAT Active Directory module, as a domain user. Results stay
    at work: they name the agency's servers and accounts.

.EXAMPLE
    .\Invoke-MsaDay2ReadOnly.ps1 -ServiceAccountOu "OU=Service Accounts,DC=corp,DC=contoso,DC=example" -OutputPath C:\MsaDay2
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$ServiceAccountOu,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$Server
)
$ErrorActionPreference = 'Stop'
Import-Module ActiveDirectory
$srv = @{}
if ($Server) { $srv.Server = $Server }
$stamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHHmmssZ')
$Run = Join-Path $OutputPath $stamp
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$summary = [ordered]@{}
function Save-Json($Name, $Value) { $Value | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $Run $Name) -Encoding UTF8 }
function Save-Csv($Name, $Rows) { @($Rows) | Export-Csv -LiteralPath (Join-Path $Run $Name) -NoTypeInformation -Encoding UTF8 }

# R0: context
$domain = Get-ADDomain @srv
$forest = Get-ADForest @srv
$root = Get-ADRootDSE @srv
Save-Json '00-context.json' ([ordered]@{ ranAtUtc = $stamp; ranBy = "$env:USERDOMAIN\$env:USERNAME"; computer = $env:COMPUTERNAME;
    psEdition = "$($PSVersionTable.PSEdition) $($PSVersionTable.PSVersion)"; domain = $domain.DNSRoot; forest = $forest.Name; readOnly = $true })
$summary['domain-fqdn'] = $domain.DNSRoot
Write-Output "R0  $($domain.DNSRoot): results in $Run"

# R1: KDS root keys, times only
$kdsBase = "CN=Master Root Keys,CN=Group Key Distribution Service,CN=Services,$($root.configurationNamingContext)"
$keys = @()
try {
    $keys = @(Get-ADObject @srv -SearchBase $kdsBase -LDAPFilter '(objectClass=msKds-ProvRootKey)' -Properties 'msKds-UseStartTime', 'msKds-CreateTime' | ForEach-Object {
        $use = if ($_.'msKds-UseStartTime') { [datetime]::FromFileTimeUtc([int64]$_.'msKds-UseStartTime') } else { $null }
        $made = if ($_.'msKds-CreateTime') { [datetime]::FromFileTimeUtc([int64]$_.'msKds-CreateTime') } else { $null }
        [ordered]@{ keyId = $_.Name; createdUtc = $(if ($made) { $made.ToString('o') }); usableFromUtc = $(if ($use) { $use.ToString('o') });
            ageHours = $(if ($made) { [math]::Round(((Get-Date).ToUniversalTime() - $made).TotalHours, 1) }) }
    })
    $kdsState = if ($keys.Count -eq 0) { 'none found, or not readable by this account' } elseif ($keys.Count -eq 1) { 'one key' } else { "$($keys.Count) keys: more than one" }
} catch {
    $kdsState = "not readable: $($_.Exception.Message)"
}
Save-Json '01-kds-root-keys.json' ([ordered]@{ state = $kdsState; keys = $keys; note = 'Times only; the key value was not read.' })
$summary['kds-key-count'] = $keys.Count
$summary['kds-key-created'] = (@($keys | ForEach-Object { "$($_.createdUtc) ($($_.ageHours) hours)" }) -join '; ')
Write-Output "R1  KDS root key: $kdsState"

# R2: domain controllers
$dcs = @(Get-ADDomainController @srv -Filter * | Sort-Object Name | Select-Object Name, Site, OperatingSystem, OperatingSystemVersion, IsReadOnly, IsGlobalCatalog)
Save-Csv '02-domain-controllers.csv' $dcs
$summary['dc-os-summary'] = (@($dcs | Group-Object OperatingSystem | Sort-Object Name | ForEach-Object { "$($_.Count) x $($_.Name)" }) -join '; ')
$summary['ws2025-dc-count'] = @($dcs | Where-Object { $_.OperatingSystem -match '2025' }).Count
Write-Output "R2  Domain controllers: $($summary['dc-os-summary'])"

# R3: functional levels
Save-Json '03-functional-levels.json' ([ordered]@{ forestMode = "$($forest.ForestMode)"; domainMode = "$($domain.DomainMode)" })
$summary['forest-functional-level'] = "$($forest.ForestMode)"
$summary['domain-functional-level'] = "$($domain.DomainMode)"
Write-Output "R3  Forest $($forest.ForestMode); domain $($domain.DomainMode)"

# R4: user accounts used as services (Learn's criteria: an SPN, or trusted for delegation), krbtgt left out
$ldap = '(&(objectCategory=person)(objectClass=user)(!(sAMAccountName=krbtgt))(|(servicePrincipalName=*)(userAccountControl:1.2.840.113556.1.4.803:=524288)(userAccountControl:1.2.840.113556.1.4.803:=16777216)))'
$users = @(Get-ADUser @srv -LDAPFilter $ldap -Properties ServicePrincipalName, PasswordNeverExpires, PasswordLastSet, LastLogonDate, Enabled, TrustedForDelegation, TrustedToAuthForDelegation, 'msDS-AllowedToDelegateTo', 'msDS-SupportedEncryptionTypes', AdminCount |
    Sort-Object SamAccountName | Select-Object SamAccountName, Enabled, PasswordNeverExpires, PasswordLastSet, LastLogonDate, AdminCount,
        TrustedForDelegation, TrustedToAuthForDelegation, @{ n = 'SpnCount'; e = { @($_.ServicePrincipalName).Count } },
        @{ n = 'Spns'; e = { @($_.ServicePrincipalName) -join ';' } }, @{ n = 'AllowedToDelegateTo'; e = { @($_.'msDS-AllowedToDelegateTo') -join ';' } },
        @{ n = 'SupportedEncryptionTypes'; e = { $_.'msDS-SupportedEncryptionTypes' } })
Save-Csv '04-user-service-accounts.csv' $users
$summary['user-service-account-count'] = $users.Count
$summary['spn-count'] = ($users | Measure-Object SpnCount -Sum).Sum
$summary['privileged-service-account-count'] = @($users | Where-Object { $_.AdminCount -eq 1 }).Count
Write-Output "R4  User accounts used as services: $($users.Count), $($summary['spn-count']) SPNs, $($summary['privileged-service-account-count']) with adminCount 1"

# R5: duplicate SPNs across the forest
$dup = & setspn.exe -X -F 2>&1 | Out-String
Set-Content -LiteralPath (Join-Path $Run '05-duplicate-spns.txt') -Value $dup -Encoding UTF8
$m = [regex]::Match($dup, 'found (\d+) group')
$summary['duplicate-spn-count'] = $(if ($m.Success) { [int]$m.Groups[1].Value } else { 'see 05-duplicate-spns.txt' })
Write-Output "R5  Duplicate SPNs: $($summary['duplicate-spn-count'])"

# R6: managed service accounts already in the domain
$msas = @(Get-ADServiceAccount @srv -Filter * -Properties ObjectClass, DistinguishedName, ServicePrincipalNames, PrincipalsAllowedToRetrieveManagedPassword, KerberosEncryptionType, 'msDS-ManagedPasswordInterval', whenCreated, Description |
    Sort-Object Name | Select-Object Name, ObjectClass, DistinguishedName, whenCreated, @{ n = 'Spns'; e = { @($_.ServicePrincipalNames) -join ';' } },
        @{ n = 'Retrievers'; e = { @($_.PrincipalsAllowedToRetrieveManagedPassword) -join ';' } }, @{ n = 'Encryption'; e = { "$($_.KerberosEncryptionType)" } },
        @{ n = 'PasswordIntervalDays'; e = { $_.'msDS-ManagedPasswordInterval' } }, Description)
Save-Csv '06-managed-service-accounts.csv' $msas
$byClass = @($msas | Group-Object ObjectClass | ForEach-Object { "$($_.Count) $($_.Name)" }) -join '; '
$summary['existing-gmsa-count'] = $(if ($byClass) { $byClass } else { 'none' })
Write-Output "R6  Managed service accounts: $($summary['existing-gmsa-count'])"

# Class GUIDs for R7 and R8, read from the schema
$schema = $root.schemaNamingContext
$guid = @{}
foreach ($c in 'msDS-GroupManagedServiceAccount', 'msDS-DelegatedManagedServiceAccount') {
    $o = Get-ADObject @srv -SearchBase $schema -LDAPFilter "(lDAPDisplayName=$c)" -Properties schemaIDGUID
    if ($o) { $guid[[guid]$o.schemaIDGUID] = $c }
}
$all = [guid]::Empty
function Get-CreateRight($Dn) {
    $acl = Get-Acl -Path "AD:\$Dn"
    foreach ($ace in $acl.Access) {
        if ("$($ace.ActiveDirectoryRights)" -notmatch 'CreateChild|GenericAll' -or "$($ace.AccessControlType)" -ne 'Allow') { continue }
        $what = if ($ace.ObjectType -eq $all) { 'all child objects' } elseif ($guid.ContainsKey($ace.ObjectType)) { $guid[$ace.ObjectType] } else { $null }
        if (-not $what) { continue }
        [pscustomobject]@{ Ou = $Dn; Identity = "$($ace.IdentityReference)"; Rights = "$($ace.ActiveDirectoryRights)"; Creates = $what; Inherited = $ace.IsInherited }
    }
}

# R7: who may create objects in the service-account OU
$ouExists = $true
try { $null = Get-ADOrganizationalUnit @srv -Identity $ServiceAccountOu } catch { $ouExists = $false }
if ($ouExists) {
    $r7 = @(Get-CreateRight $ServiceAccountOu)
    Save-Csv '07-service-account-ou-acl.csv' $r7
    $summary['service-account-ou-status'] = "exists; create rights: " + ((@($r7 | ForEach-Object { "$($_.Identity) ($($_.Creates))" }) | Sort-Object -Unique) -join '; ')
} else {
    Save-Csv '07-service-account-ou-acl.csv' @([pscustomobject]@{ Ou = $ServiceAccountOu; Identity = ''; Rights = ''; Creates = 'the OU does not exist yet'; Inherited = '' })
    $summary['service-account-ou-status'] = 'does not exist yet: part of the one-time setup'
}
Write-Output "R7  Service-account OU: $($summary['service-account-ou-status'])"

# R8: create-child rights on every OU that could create a dMSA (all child objects, or the dMSA class)
$r8 = @(Get-ADOrganizationalUnit @srv -Filter * | ForEach-Object { Get-CreateRight $_.DistinguishedName } | Where-Object { $_.Creates -ne 'msDS-GroupManagedServiceAccount' -and -not $_.Inherited })
Save-Csv '08-ou-create-child-rights.csv' $r8
$summary['create-child-holders'] = (@($r8 | Group-Object Identity | Sort-Object Count -Descending | ForEach-Object { "$($_.Name) on $($_.Count) OU(s)" }) -join '; ')
Write-Output "R8  Explicit create-child rights that would also create a dMSA: $(@($r8).Count) ACE(s)"

Save-Json 'summary.json' $summary
$files = Get-ChildItem -LiteralPath $Run -File | Sort-Object Name
Save-Json 'manifest.json' ([ordered]@{ ranAtUtc = $stamp; readOnly = $true; files = @($files | ForEach-Object { [ordered]@{ name = $_.Name; sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLower() } }) })
Write-Output "Done: $Run (summary.json holds every placeholder value; manifest.json the SHA-256 of each file)"
