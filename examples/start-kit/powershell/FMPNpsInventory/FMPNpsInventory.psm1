#Requires -Version 5.1
<#
.SYNOPSIS
    Read-only RADIUS and NPS inventory for the Start Kit: every NPS server, RADIUS client,
    network policy and connection request policy, with the AD groups and certificates each
    policy authorizes against (Book 00 Chapter 08's M-009 checklist item; Book 02 Chapter
    04's DM_030; Book 09 Chapter 07).

.DESCRIPTION
    Where the servers come from:
      Directory    Members of each domain's RAS and IAS Servers group (RID 553). Registering
                   an NPS server in a domain adds it there; so does Routing and Remote Access.
      Named        -NpsServers, for servers registered nowhere or in another forest.
      Config file  -ConfigPath, for NPS configuration exports already on disk (Book 09 keeps
                   the paired servers in step by export and import, so the files exist).

    What it reads from each server, all read-only:
      - The NPS configuration store, %windir%\System32\ias\ias.xml, over the admin share.
        It is the store Export-NpsConfiguration exports, in the same XML shape. Shared secrets are in it in
        clear text; they are replaced in memory, before anything is kept, by a length and a
        per-run label that shows which clients share a secret. No secret, and no hash of
        one, is written.
      - The computer certificate store, for the server certificates the EAP settings name.
      - The System log: NPS events 4418-4421 from KB5040268 (Message-Authenticator).
      - HKLM\SYSTEM\CurrentControlSet\Services\AuthSrv\Parameters, for extension DLLs such
        as the Microsoft Entra multifactor authentication NPS extension.
    The admin share, the remote certificate store and the remote registry need local
    administrator rights on the NPS server (Tier B). Without them the server is still
    listed, with the reason each read failed.

    Element names in ias.xml aren't documented as a file format. The kit looks for the
    collections Microsoft names in the NPS Server Data Objects API (IASPROPERTIES) and reads
    the profile attributes by their documented LDAP names (msNPAuthenticationType2,
    msNPAllowedEapType, msAuthProviderType, msAuthProviderName). A file in which it finds
    none of the collections is reported as 'NoKnownSections' with the element names it did
    find, never as an empty server.

    Illustrative: unit-tested against fixtures, not proven against a live estate.
#>

. (Join-Path (Split-Path -Parent $PSScriptRoot) 'StartKit.Common.ps1')

# The collections to read, by the element names NPS writes; alternates are tried in order.
$script:FMPNpsContainers = [ordered]@{
    Clients                   = @('Clients')
    NetworkPolicies           = @('NetworkPolicy', 'Policies')
    NetworkProfiles           = @('RadiusProfiles', 'Profiles')
    ConnectionRequestPolicies = @('Proxy_Policies')
    ConnectionRequestProfiles = @('Proxy_Profiles')
    RemoteServerGroups        = @('RADIUS_Server_Groups')
}

# msNPAuthenticationType2: the AUTHENTICATION_TYPE enumeration in sdoias.h.
$script:FMPNpsAuthTypes = @{
    0 = 'Invalid'; 1 = 'PAP'; 2 = 'MD5-CHAP'; 3 = 'MS-CHAP'; 4 = 'MS-CHAPv2'; 5 = 'EAP'; 6 = 'ARAP'
    7 = 'Unauthenticated'; 8 = 'Custom'; 9 = 'MS-CHAP (password change)'; 10 = 'MS-CHAPv2 (password change)'; 11 = 'PEAP'
}
# The methods Blast-RADIUS (CVE-2024-3596) and the program's rules treat as weak.
$script:FMPNpsWeakAuth = 'PAP', 'MD5-CHAP', 'MS-CHAP', 'MS-CHAP (password change)', 'Unauthenticated'
# msNPAllowedEapType: IANA EAP method types.
$script:FMPNpsEapTypes = @{ 4 = 'MD5-Challenge'; 13 = 'EAP-TLS'; 25 = 'PEAP'; 26 = 'EAP-MSCHAPv2' }
# NAS-Port-Type values in policy conditions (RFC 2865, IANA RADIUS Types).
$script:FMPNpsPortTypes = @{ 0 = 'Async (modem)'; 5 = 'Virtual (VPN)'; 15 = 'Ethernet (wired 802.1X)'; 19 = 'Wireless 802.11' }
# msAuthProviderType.
$script:FMPNpsProviderTypes = @{ 0 = 'None'; 1 = 'Windows'; 2 = 'RADIUS proxy' }
# Client-Vendor (NAS_Manufacturer): the common values; others are kept as their number.
$script:FMPNpsVendors = @{ 0 = 'RADIUS Standard'; 9 = 'Cisco'; 311 = 'Microsoft'; 14823 = 'Aruba' }

function Get-FMPNpsProperty {
    # First value of the first property present, from an item's property map.
    param($Item, [string[]]$Name)
    foreach ($n in $Name) {
        if ($Item.Properties.Contains($n) -and $Item.Properties[$n].Count -gt 0) { return $Item.Properties[$n][0] }
    }
    $null
}

function ConvertTo-FMPNpsBool {
    param($Value)
    if ($null -eq $Value -or "$Value" -eq '') { return $null }
    "$Value" -match '^(?i)(1|true|yes)$'
}

function ConvertTo-FMPNpsInt {
    # Integer from a decimal value, or from the first byte of a bin.hex value.
    param($Value)
    $s = "$Value".Trim()
    if ($s -match '^\d+$') { return [int]$s }
    if ($s -match '^[0-9A-Fa-f]{2,}$') { return [Convert]::ToInt32($s.Substring(0, 2), 16) }
    $null
}

function Get-FMPNpsSecretFingerprint {
    # HMAC-SHA256 of a secret under the run's random key. Kept in memory only, to group
    # clients that share a secret; the key is never written, so neither is anything that
    # could be tested against a guessed secret.
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Secret, [Parameter(Mandatory)][byte[]]$Key)
    $h = [System.Security.Cryptography.HMACSHA256]::new($Key)
    try { [BitConverter]::ToString($h.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($Secret))) -replace '-', '' }
    finally { $h.Dispose() }
}

function Get-FMPNpsItem {
    # The named items of one collection: name, element, and properties (name -> values),
    # with every *Secret* property replaced by its length and in-memory fingerprint.
    param([Parameter(Mandatory)][xml]$Document, [Parameter(Mandatory)][string[]]$Container, [Parameter(Mandatory)][byte[]]$Key, $Parent)
    $nodes = @()
    if ($Parent) { $nodes = @($Parent.SelectNodes("*[local-name()='Children']/*")) }
    else {
        foreach ($c in $Container) {
            $nodes = @($Document.SelectNodes("//*[local-name()='$c']/*[local-name()='Children']/*"))
            if ($nodes.Count -gt 0) { break }
        }
    }
    foreach ($node in $nodes) {
        $props = [ordered]@{}
        $secrets = [ordered]@{}
        $pn = $node.SelectSingleNode("*[local-name()='Properties']")
        if ($pn) {
            foreach ($child in @($pn.ChildNodes)) {
                if ($child.NodeType -ne [System.Xml.XmlNodeType]::Element) { continue }
                $n = $child.LocalName
                if ($n -match '(?i)secret') {
                    $v = $child.InnerText
                    if ($v -ne '') { $secrets[$n] = [pscustomobject]@{ Length = $v.Length; Fingerprint = Get-FMPNpsSecretFingerprint -Secret $v -Key $Key } }
                    continue
                }
                if (-not $props.Contains($n)) { $props[$n] = [System.Collections.Generic.List[string]]::new() }
                $props[$n].Add($child.InnerText)
            }
        }
        $name = $node.GetAttribute('name')
        if (-not $name) { $name = $node.LocalName }
        [pscustomobject]@{ Name = $name; Node = $node; Properties = $props; Secrets = $secrets }
    }
}

function ConvertFrom-FMPNpsConstraint {
    <#
    .SYNOPSIS
        Returns the group SIDs and NAS port types named in a network policy's conditions
        (its msNPConstraint values).
    .EXAMPLE
        (ConvertFrom-FMPNpsConstraint -Constraint 'MATCH("NAS-Port-Type=^17$")').PortTypes
    .DESCRIPTION
    #>
    # Group SIDs and NAS port types from a policy's conditions (msNPConstraint values).
    param([string[]]$Constraint)
    $sids = [System.Collections.Generic.List[string]]::new()
    $ports = [System.Collections.Generic.List[string]]::new()
    foreach ($c in @($Constraint)) {
        foreach ($m in [regex]::Matches("$c", 'S-1-5-21-\d+-\d+-\d+-\d+')) { if (-not $sids.Contains($m.Value)) { $sids.Add($m.Value) } }
        if ("$c" -match 'NAS-Port-Type=([^"\)]*)') {
            foreach ($m in [regex]::Matches($Matches[1], '\d+')) {
                $n = [int]$m.Value
                $label = $(if ($script:FMPNpsPortTypes.ContainsKey($n)) { $script:FMPNpsPortTypes[$n] } else { "NAS-Port-Type $n" })
                if (-not $ports.Contains($label)) { $ports.Add($label) }
            }
        }
    }
    [pscustomobject]@{ GroupSids = @($sids); PortTypes = @($ports) }
}

function ConvertFrom-FMPNpsConfig {
    <#
    .SYNOPSIS
        Parses an NPS configuration (ias.xml or an Export-NpsConfiguration file) into clients,
        policies and remote RADIUS servers. Shared secrets never leave this function.
    .PARAMETER Key
        The run's random HMAC key, for grouping clients that share a secret.
    .PARAMETER Thumbprints
        Thumbprints of the server's certificates; a policy whose EAP settings contain one
        is reported as using that certificate.
    .EXAMPLE
        $key = [byte[]]::new(32); [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($key)
        $p = ConvertFrom-FMPNpsConfig -Xml (Get-Content -Raw D:\Exports\nps01.xml) -Server nps01.contoso.example -Key $key
        $p.Clients | Format-Table Name, Address, SecretLength, RequireMessageAuthenticator

        Parses an Export-NpsConfiguration file. Each client shows its secret's length, never the secret.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Xml,
        [Parameter(Mandatory)][string]$Server,
        [Parameter(Mandatory)][byte[]]$Key,
        [string[]]$Thumbprints = @()
    )
    $doc = [xml]$Xml
    $items = [ordered]@{}
    foreach ($k in @($script:FMPNpsContainers.Keys)) { $items[$k] = @(Get-FMPNpsItem -Document $doc -Container $script:FMPNpsContainers[$k] -Key $Key) }

    $clients = foreach ($c in $items.Clients) {
        $secret = @($c.Secrets.Values) | Select-Object -First 1
        $vendor = ConvertTo-FMPNpsInt (Get-FMPNpsProperty $c 'NAS_Manufacturer', 'Client_Vendor')
        [pscustomobject]@{
            Server                      = $Server
            Name                        = $c.Name
            Address                     = Get-FMPNpsProperty $c 'IP_Address', 'Address'
            Enabled                     = ConvertTo-FMPNpsBool (Get-FMPNpsProperty $c 'Radius_Client_Enabled', 'Enabled')
            RequireMessageAuthenticator = ConvertTo-FMPNpsBool (Get-FMPNpsProperty $c 'Require_Signature')
            Vendor                      = $(if ($null -eq $vendor) { $null } elseif ($script:FMPNpsVendors.ContainsKey($vendor)) { $script:FMPNpsVendors[$vendor] } else { "$vendor" })
            SecretLength                = $(if ($secret) { $secret.Length } else { $null })
            SecretFingerprint           = $(if ($secret) { $secret.Fingerprint } else { $null })
        }
    }

    $policyRows = {
        param($Policies, $Profiles, $Kind)
        foreach ($p in $Policies) {
            $profileName = Get-FMPNpsProperty $p 'msNPAction'
            $prof = @($Profiles | Where-Object { $_.Name -eq $profileName }) | Select-Object -First 1
            $constraints = $(if ($p.Properties.Contains('msNPConstraint')) { @($p.Properties['msNPConstraint']) } else { @() })
            $parsed = ConvertFrom-FMPNpsConstraint -Constraint $constraints
            $auth = @(); $eap = @(); $certs = @(); $access = $null; $provider = $null; $forward = $null
            if ($prof) {
                if ($prof.Properties.Contains('msNPAuthenticationType2')) {
                    $auth = @($prof.Properties['msNPAuthenticationType2'] | ForEach-Object { $n = ConvertTo-FMPNpsInt $_; if ($script:FMPNpsAuthTypes.ContainsKey($n)) { $script:FMPNpsAuthTypes[$n] } else { "Type $_" } })
                }
                if ($prof.Properties.Contains('msNPAllowedEapType')) {
                    $eap = @($prof.Properties['msNPAllowedEapType'] | ForEach-Object { $n = ConvertTo-FMPNpsInt $_; if ($script:FMPNpsEapTypes.ContainsKey($n)) { $script:FMPNpsEapTypes[$n] } else { "EAP type $n" } })
                }
                $grant = ConvertTo-FMPNpsBool (Get-FMPNpsProperty $prof 'msNPAllowDialin')
                $access = $(if ($null -eq $grant) { $null } elseif ($grant) { 'Grant' } else { 'Deny' })
                $pt = ConvertTo-FMPNpsInt (Get-FMPNpsProperty $prof 'msAuthProviderType')
                $provider = $(if ($null -ne $pt -and $script:FMPNpsProviderTypes.ContainsKey($pt)) { $script:FMPNpsProviderTypes[$pt] } else { $null })
                $forward = Get-FMPNpsProperty $prof 'msAuthProviderName'
                $eapHex = ((@($prof.Properties['msEAPConfiguration']) -join '') -replace '[^0-9A-Fa-f]', '').ToUpperInvariant()
                if ($eapHex) { $certs = @($Thumbprints | Where-Object { $_ -and $eapHex.Contains($_.ToUpperInvariant()) }) }
            }
            [pscustomobject]@{
                Server             = $Server
                Kind               = $Kind
                Name               = $p.Name
                Order              = ConvertTo-FMPNpsInt (Get-FMPNpsProperty $p 'msNPSequence')
                Enabled            = ConvertTo-FMPNpsBool (Get-FMPNpsProperty $p 'Policy_Enabled')
                Access             = $access
                ConnectionTypes    = @($parsed.PortTypes)
                GroupSids          = @($parsed.GroupSids)
                AuthMethods        = @($auth)
                EapTypes           = @($eap)
                WeakAuthMethods    = @($auth | Where-Object { $script:FMPNpsWeakAuth -contains $_ })
                ServerCertificates = @($certs)
                AuthProvider       = $provider
                ForwardTo          = $forward
                Conditions         = @($constraints)
            }
        }
    }
    $network = @(& $policyRows $items.NetworkPolicies $items.NetworkProfiles 'Network')
    $crp = @(& $policyRows $items.ConnectionRequestPolicies $items.ConnectionRequestProfiles 'ConnectionRequest')

    $remote = foreach ($g in $items.RemoteServerGroups) {
        foreach ($s in @(Get-FMPNpsItem -Document $doc -Container 'x' -Key $Key -Parent $g.Node)) {
            $secret = @($s.Secrets.Values) | Select-Object -First 1
            [pscustomobject]@{
                Server                      = $Server
                Group                       = $g.Name
                Name                        = $s.Name
                Address                     = $(if (Get-FMPNpsProperty $s 'Address') { Get-FMPNpsProperty $s 'Address' } else { $s.Name })
                AuthenticationPort          = ConvertTo-FMPNpsInt (Get-FMPNpsProperty $s 'Authentication_Port')
                AccountingPort              = ConvertTo-FMPNpsInt (Get-FMPNpsProperty $s 'Accounting_Port')
                RequireMessageAuthenticator = ConvertTo-FMPNpsBool (Get-FMPNpsProperty $s 'Require_Signature')
                SecretLength                = $(if ($secret) { $secret.Length } else { $null })
                SecretFingerprint           = $(if ($secret) { $secret.Fingerprint } else { $null })
            }
        }
    }

    $found = @($items.Keys | Where-Object { @($items[$_]).Count -gt 0 })
    $status = 'Read'
    $elements = @()
    if ($found.Count -eq 0) {
        $status = 'NoKnownSections'
        $elements = @($doc.SelectNodes('//*') | ForEach-Object { $_.LocalName } | Where-Object { $_ -notin 'Children', 'Properties' } | Sort-Object -Unique | Select-Object -First 25)
    }
    [pscustomobject]@{
        Server                    = $Server
        ParseStatus               = $status
        ElementsFound             = $elements
        Clients                   = @($clients)
        NetworkPolicies           = $network
        ConnectionRequestPolicies = $crp
        RemoteServers             = @($remote)
    }
}

function Get-FMPNpsServer {
    <#
    .SYNOPSIS
        NPS servers from the directory: computer members of each domain's RAS and IAS Servers
        group (RID 553). Default read rights.
    .DESCRIPTION
        The group holds Routing and Remote Access servers too, so membership marks a
        candidate; reading its configuration confirms NPS.
    .EXAMPLE
        Get-FMPNpsServer -Forest contoso.example
    .EXAMPLE
        Get-FMPNpsServer -Domain contoso.example, child.contoso.example
    #>
    [CmdletBinding()]
    param([string[]]$Domain, [string]$Forest)
    Assert-FMPCommand -Name 'Get-ADGroupMember' -Module 'ActiveDirectory'
    foreach ($d in (Get-FMPNpsDomainList -Domain $Domain -Forest $Forest)) {
        $sid = (Get-ADDomain -Server $d -ErrorAction Stop).DomainSID
        $members = @(Get-ADGroupMember -Identity "$sid-553" -Server $d -ErrorAction Stop)
        foreach ($m in @($members | Where-Object { "$($_.objectClass)" -eq 'computer' })) {
            $c = Get-ADComputer -Identity "$($m.SID)" -Server $d -Properties DNSHostName, OperatingSystem, Enabled -ErrorAction Stop
            [pscustomobject]@{
                Server          = $(if ($c.DNSHostName) { "$($c.DNSHostName)".ToLowerInvariant() } else { "$($c.Name)".ToLowerInvariant() })
                Domain          = $d
                OperatingSystem = $c.OperatingSystem
                Enabled         = $c.Enabled
                Source          = 'RAS and IAS Servers'
            }
        }
    }
}

function Get-FMPNpsDomainList {
    param([string[]]$Domain, [string]$Forest)
    if ($Domain) { return $Domain }
    if ($Forest) { return @((Get-ADForest -Server $Forest -ErrorAction Stop).Domains) }
    @((Get-ADForest -ErrorAction Stop).Domains)
}

function Read-FMPNpsConfigFile {
    # The live configuration store over the admin share; read-only.
    param([Parameter(Mandatory)][string]$ComputerName)
    [System.IO.File]::ReadAllText("\\$ComputerName\admin$\System32\ias\ias.xml")
}

function Get-FMPNpsCertificate {
    # The computer's personal certificates, read from its remote store. Read-only open.
    param([Parameter(Mandatory)][string]$ComputerName)
    $store = [System.Security.Cryptography.X509Certificates.X509Store]::new("\\$ComputerName\My", [System.Security.Cryptography.X509Certificates.StoreLocation]::LocalMachine)
    try {
        $store.Open([System.Security.Cryptography.X509Certificates.OpenFlags]'ReadOnly, OpenExistingOnly')
        foreach ($c in @($store.Certificates)) {
            $template = @($c.Extensions | Where-Object { $_.Oid.Value -in '1.3.6.1.4.1.311.21.7', '1.3.6.1.4.1.311.20.2' }) | Select-Object -First 1
            [pscustomobject]@{
                Subject      = $c.Subject
                Issuer       = $c.Issuer
                Thumbprint   = $c.Thumbprint
                NotAfter     = $c.NotAfter
                DnsNames     = @($c.DnsNameList | ForEach-Object { "$_" })
                ServerAuth   = [bool](@($c.Extensions | Where-Object { $_.Oid.Value -eq '2.5.29.37' } | ForEach-Object { @($_.EnhancedKeyUsages | ForEach-Object { $_.Value }) }) -contains '1.3.6.1.5.5.7.3.1')
                Template     = $(if ($template) { $template.Format($false) } else { $null })
            }
        }
    } finally { $store.Close() }
}

function Get-FMPNpsExtensionDll {
    # ExtensionDLLs and AuthorizationDLLs from the remote registry; read-only.
    param([Parameter(Mandatory)][string]$ComputerName)
    $hklm = [Microsoft.Win32.RegistryKey]::OpenRemoteBaseKey([Microsoft.Win32.RegistryHive]::LocalMachine, $ComputerName)
    try {
        $k = $hklm.OpenSubKey('SYSTEM\CurrentControlSet\Services\AuthSrv\Parameters')
        if (-not $k) { return @() }
        try { @($k.GetValue('ExtensionDLLs')) + @($k.GetValue('AuthorizationDLLs')) | Where-Object { $_ } }
        finally { $k.Close() }
    } finally { $hklm.Close() }
}

function Get-FMPNpsHardeningEvent {
    <#
    .SYNOPSIS
        KB5040268's NPS events from the System log: 4418 (request dropped), 4419 (would be
        dropped by limitProxyState), 4420 (response would be dropped by requireMsgAuth) and
        4421 (the settings are in Disable or Audit mode, logged at service start).
    .EXAMPLE
        Get-FMPNpsHardeningEvent -ComputerName nps01.contoso.example -Since (Get-Date).AddDays(-30)
    #>
    param([Parameter(Mandatory)][string]$ComputerName, [Parameter(Mandatory)][datetime]$Since)
    $events = @()
    try {
        $events = @(Get-WinEvent -ComputerName $ComputerName -FilterHashtable @{ LogName = 'System'; ProviderName = 'NPS'; Id = 4418, 4419, 4420, 4421; StartTime = $Since } -ErrorAction Stop)
    } catch {
        if ($_.Exception.Message -notmatch 'No events were found') { throw }
    }
    $last4421 = @($events | Where-Object Id -eq 4421 | Sort-Object TimeCreated -Descending) | Select-Object -First 1
    $mode = $null
    if ($last4421 -and "$($last4421.Message)" -match 'is in (\w+) mode') { $mode = $Matches[1] }
    [pscustomobject]@{
        Event4418 = @($events | Where-Object Id -eq 4418).Count
        Event4419 = @($events | Where-Object Id -eq 4419).Count
        Event4420 = @($events | Where-Object Id -eq 4420).Count
        Event4421 = @($events | Where-Object Id -eq 4421).Count
        Mode      = $mode
    }
}

function Resolve-FMPNpsGroup {
    # A policy's group SIDs to names, through the domain whose SID prefixes them.
    param([string[]]$Sid, [hashtable]$DomainSids)
    foreach ($s in @($Sid)) {
        $prefix = $s.Substring(0, $s.LastIndexOf('-'))
        $domain = @($DomainSids.Keys | Where-Object { $DomainSids[$_] -eq $prefix }) | Select-Object -First 1
        $name = $null; $status = 'Resolved'
        if ($domain) {
            try { $g = Get-ADGroup -Identity $s -Server $domain -ErrorAction Stop; $name = $g.SamAccountName }
            catch { $status = "Not found: $($_.Exception.Message)" }
        } else { $status = 'Domain outside the assessed forest' }
        [pscustomobject]@{ Sid = $s; Domain = $domain; Group = $name; Status = $status }
    }
}

function Get-FMPNpsFinding {
    <#
    .SYNOPSIS
        The findings Book 09 Chapter 07 asks the inventory to surface, from parsed results.
    .EXAMPLE
        $p = ConvertFrom-FMPNpsConfig -Xml (Get-Content -Raw D:\Exports\nps01.xml) -Server nps01.contoso.example -Key $key
        Get-FMPNpsFinding -Clients $p.Clients -Policies (@($p.NetworkPolicies) + @($p.ConnectionRequestPolicies)) -RemoteServers $p.RemoteServers

        Checks one parsed configuration for short secrets, clients that don't require
        Message-Authenticator and policies that allow weak methods. Invoke-FMPNpsInventory calls
        it with every server's results.
    #>
    param(
        [object[]]$Servers = @(), [object[]]$Clients = @(), [object[]]$Policies = @(), [object[]]$RemoteServers = @(),
        [object[]]$Certificates = @(), [int]$SecretMinLength = 32, [int]$CertificateWarningDays = 60, [datetime]$AsOf = (Get-Date)
    )
    $row = { param($Server, $Severity, $Finding, $Object, $Detail) [pscustomobject]@{ Server = $Server; Severity = $Severity; Finding = $Finding; Object = $Object; Detail = $Detail } }
    foreach ($c in @($Clients) + @($RemoteServers)) {
        $what = $(if ($c.PSObject.Properties['Group']) { "remote RADIUS server $($c.Address)" } else { "RADIUS client $($c.Name) ($($c.Address))" })
        if ($null -ne $c.SecretLength -and $c.SecretLength -lt $SecretMinLength) {
            & $row $c.Server 'High' 'Shared secret shorter than the program minimum' $what "$($c.SecretLength) characters; the rule is $SecretMinLength or more."
        }
        if ($c.RequireMessageAuthenticator -eq $false) {
            & $row $c.Server 'Medium' 'Message-Authenticator not required' $what 'KB5040268 and Blast-RADIUS (CVE-2024-3596): require it on every client and remote server.'
        }
    }
    # One secret per authenticator: the same secret on two different addresses is a finding.
    foreach ($g in @(@($Clients) | Where-Object SecretGroup | Group-Object SecretGroup)) {
        $addresses = @($g.Group | ForEach-Object { "$($_.Address)" } | Sort-Object -Unique)
        if ($addresses.Count -gt 1) {
            & $row (@($g.Group | ForEach-Object { $_.Server } | Sort-Object -Unique) -join ';') 'High' 'Shared secret used by more than one RADIUS client' $g.Name ("Clients: " + ((@($g.Group | ForEach-Object { "$($_.Name) ($($_.Address))" } | Sort-Object -Unique)) -join ', '))
        }
    }
    foreach ($p in @($Policies | Where-Object { $_.Kind -eq 'Network' -and $_.Enabled -ne $false -and $_.Access -ne 'Deny' -and @($_.WeakAuthMethods).Count -gt 0 })) {
        & $row $p.Server 'High' 'Policy allows a weak authentication method' "network policy $($p.Name)" ((@($p.WeakAuthMethods) -join ', ') + ' allowed; non-EAP methods are the Blast-RADIUS exposure.')
    }
    foreach ($s in $Servers) {
        if ($null -ne $s.Event4421 -and $s.Event4421 -gt 0) {
            & $row $s.Server 'Medium' 'KB5040268 protections not enabled' 'requireMsgAuth / limitProxyState' "Event 4421 at service start reports $($s.Kb5040268Mode) mode."
        }
        if (($s.Event4419 + $s.Event4420) -gt 0) {
            & $row $s.Server 'Info' 'Traffic that enforcement would drop' 'events 4419 and 4420' "$($s.Event4419) requests and $($s.Event4420) responses lacked Message-Authenticator in the window; fix those devices before enabling."
        }
        if ($s.MfaExtension) { & $row $s.Server 'Info' 'Entra multifactor authentication NPS extension installed' 'AuthSrv\Parameters' 'NPS still authenticates against AD first; Book 02 Chapter 04 and Book 09 Chapter 07 cover the retirement path.' }
    }
    foreach ($c in @($Certificates | Where-Object UsedByPolicy)) {
        $days = [math]::Floor(([datetime]$c.NotAfter - $AsOf).TotalDays)
        if ($days -lt 0) { & $row $c.Server 'High' 'Policy certificate expired' $c.Subject "Expired $(-$days) days ago ($($c.Thumbprint))." }
        elseif ($days -le $CertificateWarningDays) { & $row $c.Server 'High' 'Policy certificate expires soon' $c.Subject "Expires in $days days ($($c.Thumbprint))." }
    }
    $readable = @($Servers | Where-Object { $_.ConfigStatus -eq 'Read' })
    if ($Servers.Count -gt 0 -and $readable.Count -lt 2) {
        & $row '' 'Medium' 'Fewer than two NPS servers read' 'resilience' "$($readable.Count) configuration read; Book 09 calls for two servers in each region, every client configured with both."
    }
}

function Invoke-FMPNpsInventory {
    <#
    .SYNOPSIS
        Inventories RADIUS and NPS. Read-only; writes only under -OutputPath.
    .DESCRIPTION
        Finds NPS servers (directory, -NpsServers, -ConfigPath), reads each one, and writes,
        under <OutputPath>\NPS:
          NpsServers.csv                 one row per server, with what could be read
          RadiusClients.csv              one row per client per server; secret length and label only
          NetworkPolicies.csv            network and connection request policies, in order
          PolicyGroups.csv               policy -> AD group, the dependency to remap
          RemoteRadiusServers.csv        where connection request policies forward
          NpsCertificates.csv            server certificates, and which policies use them
          NpsFindings.csv                what Book 09 Chapter 07's rules flag
          NpsInventory.json              all of the above, with each policy's raw conditions
          NpsSummary.json                the counts
    .EXAMPLE
        Invoke-FMPNpsInventory -OutputPath D:\Assessment\run1
    .EXAMPLE
        Invoke-FMPNpsInventory -OutputPath D:\Assessment\run1 -ConfigPath D:\Exports\nps01.xml -SkipDirectory
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [string[]]$Domain,
        [string]$Forest,
        [string[]]$NpsServers = @(),
        [string[]]$ConfigPath = @(),
        [switch]$SkipDirectory,
        [int]$SecretMinLength = 32,
        [int]$EventDays = 30,
        [int]$CertificateWarningDays = 60,
        [datetime]$AsOf = (Get-Date)
    )
    $root = Resolve-FMPOutputRoot -OutputPath $OutputPath
    $npsPath = Initialize-FMPPath -Path (Join-Path $root 'NPS')
    $key = [byte[]]::new(32)
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($key) } finally { $rng.Dispose() }

    $domains = @()
    $domainSids = @{}
    $servers = [ordered]@{}
    if (-not $SkipDirectory) {
        $domains = @(Get-FMPNpsDomainList -Domain $Domain -Forest $Forest)
        foreach ($d in $domains) { $domainSids[$d] = "$((Get-ADDomain -Server $d -ErrorAction Stop).DomainSID)" }
        foreach ($s in @(Get-FMPNpsServer -Domain $domains)) { $servers[$s.Server] = $s }
    }
    foreach ($n in @($NpsServers | Where-Object { $_ })) {
        $k = "$n".ToLowerInvariant()
        if (-not $servers.Contains($k)) { $servers[$k] = [pscustomobject]@{ Server = $k; Domain = $null; OperatingSystem = $null; Enabled = $null; Source = 'Named' } }
    }

    $clients = @(); $policies = @(); $remote = @(); $certs = @(); $rows = @()
    foreach ($s in @($servers.Values)) {
        $row = [ordered]@{
            Server = $s.Server; Domain = $s.Domain; OperatingSystem = $s.OperatingSystem; Enabled = $s.Enabled; Source = $s.Source
            ConfigStatus = $null; Clients = $null; NetworkPolicies = $null; ConnectionRequestPolicies = $null; RemoteServers = $null
            CertificateStatus = $null; Certificates = $null; ExtensionStatus = $null; ExtensionDlls = $null; MfaExtension = $null
            EventStatus = $null; Event4418 = $null; Event4419 = $null; Event4420 = $null; Event4421 = $null; Kb5040268Mode = $null
        }
        $serverCerts = @()
        try {
            $serverCerts = @(Get-FMPNpsCertificate -ComputerName $s.Server)
            $row.CertificateStatus = 'Read'; $row.Certificates = $serverCerts.Count
        } catch { $row.CertificateStatus = "NotReadable: $($_.Exception.Message)" }
        try {
            $p = ConvertFrom-FMPNpsConfig -Xml (Read-FMPNpsConfigFile -ComputerName $s.Server) -Server $s.Server -Key $key -Thumbprints @($serverCerts | ForEach-Object { $_.Thumbprint })
            $row.ConfigStatus = $p.ParseStatus
            if ($p.ParseStatus -ne 'Read') { $row.ConfigStatus = "NoKnownSections: $(@($p.ElementsFound) -join ', ')" }
            $row.Clients = @($p.Clients).Count; $row.NetworkPolicies = @($p.NetworkPolicies).Count
            $row.ConnectionRequestPolicies = @($p.ConnectionRequestPolicies).Count; $row.RemoteServers = @($p.RemoteServers).Count
            $clients += $p.Clients; $policies += $p.NetworkPolicies + $p.ConnectionRequestPolicies; $remote += $p.RemoteServers
        } catch { $row.ConfigStatus = "NotReadable: $($_.Exception.Message)" }
        try {
            $dlls = @(Get-FMPNpsExtensionDll -ComputerName $s.Server)
            $row.ExtensionStatus = 'Read'; $row.ExtensionDlls = ($dlls -join ';')
            $row.MfaExtension = [bool](@($dlls | Where-Object { "$_" -match '(?i)MfaNps' }).Count)
        } catch { $row.ExtensionStatus = "NotReadable: $($_.Exception.Message)" }
        try {
            $e = Get-FMPNpsHardeningEvent -ComputerName $s.Server -Since $AsOf.AddDays(-$EventDays)
            $row.EventStatus = 'Read'; $row.Event4418 = $e.Event4418; $row.Event4419 = $e.Event4419; $row.Event4420 = $e.Event4420; $row.Event4421 = $e.Event4421
            $row.Kb5040268Mode = $(if ($e.Mode) { $e.Mode } elseif ($e.Event4421 -eq 0) { 'No event 4421 in the window' } else { 'Unknown' })
        } catch { $row.EventStatus = "NotReadable: $($_.Exception.Message)" }
        foreach ($c in $serverCerts) { $certs += $c | Select-Object @{ N = 'Server'; E = { $s.Server } }, * }
        $rows += [pscustomobject]$row
    }
    foreach ($f in @($ConfigPath | Where-Object { $_ })) {
        $name = [System.IO.Path]::GetFileNameWithoutExtension($f).ToLowerInvariant()
        $row = [ordered]@{ Server = $name; Domain = $null; OperatingSystem = $null; Enabled = $null; Source = "Config file $f"; ConfigStatus = $null
            Clients = $null; NetworkPolicies = $null; ConnectionRequestPolicies = $null; RemoteServers = $null; CertificateStatus = 'Not read (offline file)'; Certificates = $null
            ExtensionStatus = 'Not read (offline file)'; ExtensionDlls = $null; MfaExtension = $null; EventStatus = 'Not read (offline file)'
            Event4418 = $null; Event4419 = $null; Event4420 = $null; Event4421 = $null; Kb5040268Mode = $null }
        try {
            $p = ConvertFrom-FMPNpsConfig -Xml (Get-Content -LiteralPath $f -Raw -ErrorAction Stop) -Server $name -Key $key
            $row.ConfigStatus = $(if ($p.ParseStatus -eq 'Read') { 'Read' } else { "NoKnownSections: $(@($p.ElementsFound) -join ', ')" })
            $row.Clients = @($p.Clients).Count; $row.NetworkPolicies = @($p.NetworkPolicies).Count
            $row.ConnectionRequestPolicies = @($p.ConnectionRequestPolicies).Count; $row.RemoteServers = @($p.RemoteServers).Count
            $clients += $p.Clients; $policies += $p.NetworkPolicies + $p.ConnectionRequestPolicies; $remote += $p.RemoteServers
        } catch { $row.ConfigStatus = "NotReadable: $($_.Exception.Message)" }
        $rows += [pscustomobject]$row
    }

    # Secret labels: one per distinct secret in this run, by first appearance. The
    # fingerprints themselves stay in memory.
    $labels = @{}
    $labelOf = {
        param($Fingerprint)
        if (-not $Fingerprint) { return $null }
        if (-not $labels.ContainsKey($Fingerprint)) { $labels[$Fingerprint] = 'secret-{0}' -f ($labels.Count + 1) }
        $labels[$Fingerprint]
    }
    $clients = @($clients | ForEach-Object { ConvertTo-FMPNpsRecord $_ -Drop 'SecretFingerprint' -Set @{ SecretGroup = (& $labelOf $_.SecretFingerprint) } })
    $remote = @($remote | ForEach-Object { ConvertTo-FMPNpsRecord $_ -Drop 'SecretFingerprint' -Set @{ SecretGroup = (& $labelOf $_.SecretFingerprint) } })

    # Group names for every SID a policy authorizes against.
    $sidMap = @{}
    foreach ($r in @(Resolve-FMPNpsGroup -Sid @($policies | ForEach-Object { $_.GroupSids } | Where-Object { $_ } | Sort-Object -Unique) -DomainSids $domainSids)) { $sidMap[$r.Sid] = $r }
    $policyGroups = foreach ($p in $policies) {
        foreach ($sid in @($p.GroupSids)) {
            $r = $sidMap[$sid]
            [pscustomobject]@{ Server = $p.Server; Kind = $p.Kind; Policy = $p.Name; Access = $p.Access; GroupSid = $sid; Domain = $r.Domain; Group = $r.Group; Status = $r.Status }
        }
    }
    $policies = @($policies | ForEach-Object {
            $names = @($_.GroupSids | ForEach-Object { $r = $sidMap[$_]; if ($r -and $r.Group) { "$($r.Domain)\$($r.Group)" } else { $_ } })
            ConvertTo-FMPNpsRecord $_ -Set @{ Groups = $names }
        })
    $certs = @($certs | ForEach-Object {
            $c = $_
            $users = @($policies | Where-Object { $_.Server -eq $c.Server -and @($_.ServerCertificates) -contains $c.Thumbprint } | ForEach-Object { $_.Name })
            ConvertTo-FMPNpsRecord $c -Set @{ UsedByPolicy = ($users -join ';') }
        })

    $findings = @(Get-FMPNpsFinding -Servers $rows -Clients $clients -Policies $policies -RemoteServers $remote -Certificates $certs `
            -SecretMinLength $SecretMinLength -CertificateWarningDays $CertificateWarningDays -AsOf $AsOf)

    $confirmed = @($rows | Where-Object { $_.ConfigStatus -eq 'Read' })
    $summary = [ordered]@{
        NpsServers                = @($rows).Count
        NpsServersRead            = $confirmed.Count
        RadiusClients             = @($clients).Count
        UniqueRadiusClientAddresses = @($clients | ForEach-Object { "$($_.Address)" } | Where-Object { $_ } | Sort-Object -Unique).Count
        NetworkPolicies           = @($policies | Where-Object Kind -eq 'Network').Count
        ConnectionRequestPolicies = @($policies | Where-Object Kind -eq 'ConnectionRequest').Count
        RemoteRadiusServers       = @($remote).Count
        AdGroupsReferenced        = @($sidMap.Keys).Count
        PolicyCertificates        = @($certs | Where-Object UsedByPolicy).Count
        FindingsBySeverity        = Get-FMPNpsCountTable -Rows $findings -Property Severity
    }
    $flat = {
        param($Rows)
        foreach ($r in @($Rows)) {
            $o = [ordered]@{}
            foreach ($p in $r.PSObject.Properties) { $o[$p.Name] = $(if ($p.Value -is [array]) { @($p.Value) -join ';' } else { $p.Value }) }
            [pscustomobject]$o
        }
    }
    Write-FMPCsv -InputObject $rows -Path (Join-Path $npsPath 'NpsServers.csv')
    Write-FMPCsv -InputObject @(& $flat $clients) -Path (Join-Path $npsPath 'RadiusClients.csv')
    Write-FMPCsv -InputObject @(& $flat ($policies | Sort-Object Server, Kind, Order | Select-Object * -ExcludeProperty Conditions)) -Path (Join-Path $npsPath 'NetworkPolicies.csv')
    Write-FMPCsv -InputObject @($policyGroups) -Path (Join-Path $npsPath 'PolicyGroups.csv')
    Write-FMPCsv -InputObject @(& $flat $remote) -Path (Join-Path $npsPath 'RemoteRadiusServers.csv')
    Write-FMPCsv -InputObject @(& $flat $certs) -Path (Join-Path $npsPath 'NpsCertificates.csv')
    Write-FMPCsv -InputObject $findings -Path (Join-Path $npsPath 'NpsFindings.csv')
    $doc = [ordered]@{
        Metadata = [ordered]@{
            Schema = 'fmp-start-kit/nps-inventory/1'; KitVersion = $script:FMPKitVersion; GeneratedUtc = $AsOf.ToUniversalTime().ToString('o')
            Domains = @($domains); SecretMinLength = $SecretMinLength; EventDays = $EventDays
            Secrets = 'Never written. SecretLength and a per-run SecretGroup label only.'
        }
        Summary = $summary; Servers = @($rows); Clients = @($clients); Policies = @($policies); PolicyGroups = @($policyGroups)
        RemoteServers = @($remote); Certificates = @($certs); Findings = $findings
    }
    Write-FMPJson -InputObject $doc -Path (Join-Path $npsPath 'NpsInventory.json') -Depth 6
    Write-FMPJson -InputObject $summary -Path (Join-Path $npsPath 'NpsSummary.json') -Depth 4
    Write-Verbose "NPS: $($summary.NpsServers) servers ($($summary.NpsServersRead) read), $($summary.RadiusClients) clients, $($summary.NetworkPolicies) network policies."
    [pscustomobject]@{ Servers = $rows; Clients = $clients; Policies = $policies; RemoteServers = $remote; Certificates = $certs; Findings = $findings; Summary = $summary }
}

function ConvertTo-FMPNpsRecord {
    # A copy of an object with properties dropped and set, in the original order.
    param($InputObject, [string[]]$Drop = @(), [hashtable]$Set = @{})
    $o = [ordered]@{}
    foreach ($p in $InputObject.PSObject.Properties) { if ($Drop -notcontains $p.Name) { $o[$p.Name] = $p.Value } }
    foreach ($k in $Set.Keys) { $o[$k] = $Set[$k] }
    [pscustomobject]$o
}

function Get-FMPNpsCountTable {
    param([object[]]$Rows, [string]$Property)
    $o = [ordered]@{}
    foreach ($g in (@($Rows) | Group-Object -Property $Property | Sort-Object Name)) { $o["$($g.Name)"] = $g.Count }
    $o
}

Export-ModuleMember -Function @(
    'ConvertFrom-FMPNpsConfig', 'ConvertFrom-FMPNpsConstraint', 'Get-FMPNpsServer', 'Get-FMPNpsHardeningEvent',
    'Get-FMPNpsFinding', 'Invoke-FMPNpsInventory'
)
