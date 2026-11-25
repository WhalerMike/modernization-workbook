---
title: "Module 1: Read the naming plane"
description: "Book 08, Chapters 01 to 03 and Chapter 10's Phase 1: why DNS, DHCP and IPAM are now a control plane, how split-brain DNS fails without a DNS error, what the federal requirements ask of the name layer, and what an inventory must collect before anything moves. Lab 1 reads a fictional domain's zones, DNS servers, locator records, zone health and DHCP scopes from the Start Kit's files; Lab 2 builds a test domain and collects the same files from it. About 50 minutes, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 08"
series-order: 1
review-status: approved
reviewed-sha256: b624f2dd8ab2ff0463a189748a3949446cc5e6201c5d8a1d4c4c839f8b784da2
last-reviewed: 2026-11-25
---
# Module 1: Read the naming plane {.unnumbered}

*Part of the [DNS, DHCP and IPAM learning path](index.md). Book 08, [Chapters 01](../../books/b08-ddi/01-dns-is-the-control-plane.md) to [03](../../books/b08-ddi/03-federal-requirements.md) and [Chapter 10's Phase 1](../../books/b08-ddi/10-migration-sequence.md#phase-1-inventory-and-baseline). About 50 minutes.*

## Introduction (3 minutes) {#ddi-m1-introduction}

A domain's DNS is spread across its domain controllers, its DHCP servers, a few file-backed zones on a member server, and forwarders someone added years ago. No one screen shows all of it, so most programs plan from what people remember. Book 08's migration starts instead from an inventory: every zone on every DNS server, every record, the locator records the domain controllers register, the zone health, and every DHCP scope with the DNS servers it hands out. Records that AD DNS maintains can't be recovered from a domain controller once it is gone, so this is the step whose omission can't be repaired later.

In this module you read the files the Start Kit's DNS and DHCP collectors write, for a fictional domain, and see what each one tells you. In Lab 2 you collect the same files from a test domain you build.

**The federal requirement.** The inventory supports NIST SP 800-53 CM-8 (system component inventory) and gives the evidence for SC-22 (architecture and provisioning for name and address resolution). [Appendix B](../../books/b08-ddi/appendix-b-requirements-mapping.md) maps each requirement that touches the name layer.

| Requirement | KSI | Evidence |
|---|---|---|
| CM-8: an inventory of system components that accurately reflects the system | KSI-PIY-GIV | The run's DNS and DHCP files, dated, kept unchanged |
| SC-22: name resolution that is fault tolerant, with internal and external role separation | None in the workbook's verified pairings | The zones each DNS server holds, and the servers the run couldn't read |
| CM-2: a current baseline configuration | None in the workbook's verified pairings | The Phase 1 run, kept as the baseline that later runs are compared with |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines its own evidence up with them; it doesn't report KSIs itself ([Book 00, Appendix B](../../books/b00-orientation/appendix-b-engagement-archetype.md)). The steps *support* these controls; the assessor decides whether each is satisfied.

## Learning objectives (1 minute) {#ddi-m1-objectives}

After this module, you'll be able to:

- explain why Book 08 treats DNS, DHCP and IPAM as one control plane, and how split-brain DNS breaks things without a DNS error;
- name what M-22-09, SP 800-81 Rev. 3 and SP 800-53's SC-20, SC-21 and SC-22 ask of the name layer;
- list what Chapter 10's Phase 1 collects, and which of it the Start Kit collects;
- read a run's zones, the DNS servers that hold them, the locator record checks, the zone health and the DHCP scopes, and say what to clear before anything moves.

## Prerequisites (1 minute) {#ddi-m1-prerequisites}

- Book 08, [Chapter 01](../../books/b08-ddi/01-dns-is-the-control-plane.md). Unit 1 reads it with you.
- Windows PowerShell 5.1 or PowerShell 7, and the Start Kit's folder `examples/start-kit` ([Get the code](index.md#get-the-code)).

## Unit 1: One control plane, and the split-brain problem (8 minutes) {#ddi-m1-unit-1}

Read Book 08, [Chapter 01](../../books/b08-ddi/01-dns-is-the-control-plane.md), sections *What DNS has become* and *Three DNS perspectives under one control plane*, then [Chapter 02](../../books/b08-ddi/02-split-brain-dns.md), sections *What split-brain DNS is* and *Why process discipline can't fix a structural problem*. Three points to take away:

- **DNS now carries policy.** A private endpoint, a SaaS tenant's government-cloud endpoint and a security control all depend on a name resolving to the right address from where the client sits. When it doesn't, the failure shows up as an identity, certificate or connectivity problem, not as a DNS error.
- **Split-brain is structural.** When the on-premises servers, each cloud and the SD-WAN edge each hold their own copy of a namespace, the copies drift, and no checklist keeps them in step. Book 08's answer is one authoritative policy plane, which this path works toward.
- **DHCP and IPAM are part of it.** DHCP decides which resolver a client asks, and the address plan decides whether a name's answer is reachable. An inventory of DNS alone misses half the plane.

## Unit 2: What the federal requirements ask (6 minutes) {#ddi-m1-unit-2}

Read Book 08, [Chapter 03](../../books/b08-ddi/03-federal-requirements.md), sections *What the mandates say* and *NIST SP 800-81 Rev. 3*, and skim [Appendix B's requirements mapping](../../books/b08-ddi/appendix-b-requirements-mapping.md#requirements-mapping). The requirements the rest of this path comes back to:

| Source | What it asks of the name layer | Where this path takes it up |
|---|---|---|
| OMB M-22-09 | Encrypted DNS wherever technically supported, and agency-designated resolvers | Lab 1's DHCP step: the resolvers each server hands out |
| CISA Protective DNS | Egress resolution through CISA's resolver | Lab 1's server-level forwarders |
| SP 800-53 SC-20, SC-21 | Signed authoritative answers, and resolvers that validate them | Lab 1's signed zone; [Module 2](02-the-active-directory-dns-departure.md)'s signed-zone row |
| SP 800-53 SC-22 | Fault-tolerant resolution, with internal and external role separation | Lab 1's zones by DNS server |
| SP 800-53 CM-8 | An accurate, complete and reviewed component inventory | This module's run |

: The requirements this path returns to, from Book 08's Appendix B {.striped .hover}

SP 800-81 Rev. 3 is guidance rather than a mandate: it calls an organization's DNS service both a source of information for policy decisions and a policy enforcement point, which is Unit 1's point in NIST's words.

## Unit 3: What Phase 1 collects, and what the kit reads (7 minutes) {#ddi-m1-unit-3}

Read Book 08, [Chapter 10, Phase 1 — Inventory and baseline](../../books/b08-ddi/10-migration-sequence.md#phase-1-inventory-and-baseline). Its table lists nine things to collect. The Start Kit's two collectors, which Lab 2 runs, read most of them with default rights or a narrow read delegation, and say so when they can't:

| Phase 1 collects | The Start Kit's file |
|---|---|
| Every zone on every DNS server, with type, AD integration, replication scope, dynamic updates and signing | `DNS\DNSInventory.json` (the PDC emulator's zones) and `DNS\DNSHealthReport.json` (each server's list, and the servers it couldn't read) |
| Every record, with type and timestamp | `DNS\DNSRecordInventory.json`: counts by type, and the records older than the threshold |
| Zone health: aging and scavenging, stale records, duplicate host names | `DNSInventory.json` (scavenging) and `DNSRecordInventory.json` (stale records) |
| The critical locator records | `DNSHealthReport.json`: four SRV records, resolved against the PDC emulator's DNS server |
| Conditional and server-level forwarders | `DNSInventory.json` |
| DNSSEC state | `DNSInventory.json`: the signed zones' key master and denial-of-existence settings |
| DHCP scopes, reservations, options and failover | `DHCP\DHCPInventory.json` |

: Chapter 10's Phase 1 and the Start Kit's files {.striped .hover}

Three things Phase 1 asks for aren't in the kit's files: each locator record resolved from *every* DNS server and site, the DHCP servers' dynamic-update credentials, and the resolution paths in the clouds and at the SD-WAN edge. [Module 2](02-the-active-directory-dns-departure.md)'s Lab 2 reads the first two by hand with Chapter 04's read-only commands.

## Exercise: Lab 1, fixtures, no server (20 minutes) {#ddi-m1-lab-1}

You read a fictional domain's DNS and DHCP files the way Phase 1 asks. The run is `tests/fixtures/ddi/run-2026-11-20/contoso.example`: the domain `contoso.example`, with three domain controllers that run DNS (`dc01` is the PDC emulator) and two DHCP servers, in the shape the collectors write.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\start-kit

$Run = "C:\FMWLabs\results\dns-dhcp-ipam-01-read-the-naming-plane\lab1\$((Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHHmmssZ'))"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Open the DNS inventory
$inv = Get-Content -Raw tests/fixtures/ddi/run-2026-11-20/contoso.example/DNS/DNSInventory.json | ConvertFrom-Json
$inv.DnsServer, $inv.Zones.Count

# Step 2: List the zones
$inv.Zones | Format-Table ZoneName, ZoneType, IsDsIntegrated, IsReverseLookupZone, IsSigned

# Step 3: See which DNS servers hold them
$health = Get-Content -Raw tests/fixtures/ddi/run-2026-11-20/contoso.example/DNS/DNSHealthReport.json | ConvertFrom-Json
$health.ZonesByServer | Group-Object DnsServer | Sort-Object Name | Format-Table Name, Count, @{ n = 'Error'; e = { $_.Group[0].Error } }

# Step 4: Check the locator records
$health.SRVChecks | Format-Table SRVRecord, RecordCount, Status

# Step 5: Read the zone health
$inv.Scavenging | Format-List ScavengingState, NoRefreshInterval, RefreshInterval
$records = Get-Content -Raw tests/fixtures/ddi/run-2026-11-20/contoso.example/DNS/DNSRecordInventory.json | ConvertFrom-Json
$records.StaleRecords | Sort-Object HostName, Data | Format-Table HostName, RecordType, Data, AgeDays

# Step 6: Read the DHCP scopes, and the resolvers they hand out
$dhcp = Get-Content -Raw tests/fixtures/ddi/run-2026-11-20/contoso.example/DHCP/DHCPInventory.json | ConvertFrom-Json
$dhcp.Servers.Scopes | Format-Table Server, ScopeId, Name, LeaseDuration, ReservationCount
$dhcp.Servers | Format-Table Server, @{ n = 'Option 6 (DNS servers)'; e = { ($_.ServerOptions | Where-Object OptionId -eq 6).Value -join ', ' } }, @{ n = 'Failover'; e = { $_.Failover.ScopeId -join ', ' } }

# Step 6: Read the DHCP scopes, and the resolvers they hand out
Get-ChildItem C:\FMWLabs\results\dns-dhcp-ipam-01-read-the-naming-plane\lab1 -Name
```

:::

<!-- labs:end -->

Every step runs in Windows PowerShell 5.1, so you can follow it top to bottom in one window. PowerShell 7 runs the same commands and prints the same results, but with fewer blank lines between them than the output shown here. Open **Windows PowerShell** from the Start menu, then go to the kit's folder, where you unzipped it under [Get the code](index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\start-kit
```

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\dns-dhcp-ipam-01-read-the-naming-plane\lab1\$((Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHHmmssZ'))"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\dns-dhcp-ipam-01-read-the-naming-plane\lab1\<run>
```

The run's date is only the folder's name. The data's date is the fixtures', November 20, 2026, which stays the same, so every run's output matches this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it.

In Git Bash, `cd /c/FMWLabs/start-kit` reaches the same folder, but every step is a PowerShell command (type `powershell` to start Windows PowerShell there). In a clone of the repository, use the `examples` folder of the same name.

1. **Open the DNS inventory.** It holds the PDC emulator's zones and the server settings.

    ```powershell
    $inv = Get-Content -Raw tests/fixtures/ddi/run-2026-11-20/contoso.example/DNS/DNSInventory.json | ConvertFrom-Json
    $inv.DnsServer, $inv.Zones.Count
    ```

    Expected output:

    ```text
    dc01.contoso.example
    12
    ```

2. **List the zones.**

    ```powershell
    $inv.Zones | Format-Table ZoneName, ZoneType, IsDsIntegrated, IsReverseLookupZone, IsSigned
    ```

    Expected output:

    ```text
    ZoneName               ZoneType  IsDsIntegrated IsReverseLookupZone IsSigned
    --------               --------  -------------- ------------------- --------
    contoso.example        Primary             True               False    False
    _msdcs.contoso.example Primary             True               False    False
    10.in-addr.arpa        Primary             True                True    False
    16.172.in-addr.arpa    Primary             True                True    False
    GlobalNames            Primary             True               False    False
    apps.contoso.example   Primary            False               False    False
    legacy.contoso.example Secondary          False               False    False
    partner.example        Forwarder           True               False    False
    oldvendor.example      Forwarder          False               False    False
    blob.core.windows.net  Forwarder           True               False    False
    hr.contoso.example     Stub                True               False    False
    secure.contoso.example Primary             True               False     True
    ```

    Twelve zones, of every kind [Chapter 04](../../books/b08-ddi/04-active-directory-dns-departure.md#what-ad-integrated-dns-actually-is) lists: the domain's own zone and its `_msdcs` subzone, two reverse zones, GlobalNames, a file-backed zone, a secondary, three conditional forwarders, a stub zone and a signed zone. Each one moves by a different method; [Module 2](02-the-active-directory-dns-departure.md) sorts them.

3. **See which DNS servers hold them.** The health report has each server's own zone list.

    ```powershell
    $health = Get-Content -Raw tests/fixtures/ddi/run-2026-11-20/contoso.example/DNS/DNSHealthReport.json | ConvertFrom-Json
    $health.ZonesByServer | Group-Object DnsServer | Sort-Object Name | Format-Table Name, Count, @{ n = 'Error'; e = { $_.Group[0].Error } }
    ```

    Expected output:

    ```text
    Name                 Count Error
    ----                 ----- -----
    dc01.contoso.example    12
    dc02.contoso.example     1 The RPC server is unavailable.
    dc03.contoso.example     8
    ```

    `dc02` couldn't be read at all, so the inventory is incomplete until someone finds out why. `dc03` holds eight: the three zones stored only on `dc01` (a file-backed primary, the secondary and one forwarder) are expected to be missing, but so is `16.172.in-addr.arpa`, an AD-integrated zone every DNS server in the domain should hold. Either it hasn't replicated, or it isn't stored where people think.

4. **Check the locator records.** The collector resolves four of the SRV records domain controllers register.

    ```powershell
    $health.SRVChecks | Format-Table SRVRecord, RecordCount, Status
    ```

    Expected output:

    ```text
    SRVRecord                      RecordCount Status
    ---------                      ----------- ------
    _ldap._tcp.contoso.example               3 PASS
    _kerberos._tcp.contoso.example           3 PASS
    _gc._tcp.contoso.example                 2 PASS
    _kpasswd._tcp.contoso.example            0 FAIL
    ```

    Without `_kpasswd`, Kerberos password changes fail. Chapter 10 makes 30 days of clean resolution of these records a gate for decommissioning AD DNS, so a failure here is the first thing to fix, and this run is its baseline.

5. **Read the zone health.** Scavenging is a server setting; stale records are per zone.

    ```powershell
    $inv.Scavenging | Format-List ScavengingState, NoRefreshInterval, RefreshInterval
    $records = Get-Content -Raw tests/fixtures/ddi/run-2026-11-20/contoso.example/DNS/DNSRecordInventory.json | ConvertFrom-Json
    $records.StaleRecords | Sort-Object HostName, Data | Format-Table HostName, RecordType, Data, AgeDays
    ```

    Expected output:

    ```text
    ScavengingState   : False
    NoRefreshInterval : 7.00:00:00
    RefreshInterval   : 7.00:00:00




    HostName RecordType Data                      AgeDays
    -------- ---------- ----                      -------
    114.5.0  PTR        ws114.contoso.example.        263
    207.5.0  PTR        kiosk-07.contoso.example.     354
    kiosk-07 A          10.0.5.207                    354
    ws114    A          10.0.5.114                    263
    ws131    A          10.0.5.131                    186
    ws131    A          10.0.5.140                    113
    ```

    Scavenging is off, so these records stay until someone deletes them, and they would migrate as faithfully as good ones. `ws131` has two addresses: [Chapter 04](../../books/b08-ddi/04-active-directory-dns-departure.md#what-kerberos-needs-from-dns-on-the-way-out) explains how that delivers a Kerberos ticket for one computer to another.

6. **Read the DHCP scopes, and the resolvers they hand out.**

    ```powershell
    $dhcp = Get-Content -Raw tests/fixtures/ddi/run-2026-11-20/contoso.example/DHCP/DHCPInventory.json | ConvertFrom-Json
    $dhcp.Servers.Scopes | Format-Table Server, ScopeId, Name, LeaseDuration, ReservationCount
    $dhcp.Servers | Format-Table Server, @{ n = 'Option 6 (DNS servers)'; e = { ($_.ServerOptions | Where-Object OptionId -eq 6).Value -join ', ' } }, @{ n = 'Failover'; e = { $_.Failover.ScopeId -join ', ' } }
    ```

    Expected output:

    ```text
    Server                 ScopeId  Name           LeaseDuration ReservationCount
    ------                 -------  ----           ------------- ----------------
    dhcp01.contoso.example 10.0.5.0 HQ clients     8.00:00:00                   0
    dhcp01.contoso.example 10.0.6.0 HQ printers    8.00:00:00                   2
    dhcp01.contoso.example 10.1.5.0 Branch clients 1.00:00:00                   0
    dhcp02.contoso.example 10.1.5.0 Branch clients 1.00:00:00                   0
    dhcp02.contoso.example 10.1.7.0 Branch guest   04:00:00                     0



    Server                 Option 6 (DNS servers)  Failover
    ------                 ----------------------  --------
    dhcp01.contoso.example 10.0.0.10, 10.0.0.11    10.1.5.0
    dhcp02.contoso.example 10.1.0.10, 203.0.113.53 10.1.5.0
    ```

    Only the branch scope is in a failover relationship; the headquarters scopes have one server. And `dhcp02` tells its clients to use `203.0.113.53`, an address outside the agency's ranges: a resolver that isn't the agency's, which M-22-09 and Protective DNS rule out. Either is a finding for the DNS team before any migration.

    Nothing to clean up: this lab only reads the kit's files, so the kit's folder is as you unzipped it, and `$Run` stays empty. List every run you've made of this lab:

    ```powershell
    Get-ChildItem C:\FMWLabs\results\dns-dhcp-ipam-01-read-the-naming-plane\lab1 -Name
    ```

    Expected output: one line per run, oldest first, the last one this run:

    ```text
    <run>
    ```

## Exercise: Lab 2, your test domain (40 minutes, plus the build) {#ddi-m1-lab-2}

You build a one-server test forest with DNS and DHCP and run the Start Kit's two collectors against it. You need a Hyper-V host and a Windows Server 2019 or later virtual machine named `fmp-lab-dc01`, not joined to any domain, with the static address `10.50.0.10/24` on an isolated virtual switch; change the names and addresses in the commands if yours differ. The build commands are Microsoft Learn's: [Install-ADDSForest](https://learn.microsoft.com/powershell/module/addsdeployment/install-addsforest), [Deploy DHCP using Windows PowerShell](https://learn.microsoft.com/windows-server/networking/technologies/dhcp/dhcp-deploy-wps) and the [DnsServer](https://learn.microsoft.com/powershell/module/dnsserver/) module. Never run them on a production server: they create a forest. *The authors didn't run these steps.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
# Step 1: Checkpoint the virtual machine, and copy the kit to it
Checkpoint-VM -Name fmp-lab-dc01 -SnapshotName before-ddi-lab
Enable-VMIntegrationService -VMName fmp-lab-dc01 -Name 'Guest Service Interface'
Copy-VMFile -Name fmp-lab-dc01 -SourcePath $HOME\Downloads\start-kit.zip -DestinationPath C:\fmp-lab\start-kit.zip -CreateFullPath -FileSource Host

# Step 2: Install the roles
Install-WindowsFeature -Name AD-Domain-Services, DNS, DHCP -IncludeManagementTools

# Step 3: Create the forest
Install-ADDSForest -DomainName lab.contoso.example -DomainNetbiosName LAB -InstallDns

# Step 4: Authorize DHCP, add a scope, and give the DNS server something to inventory
Add-DhcpServerSecurityGroup
Restart-Service DHCPServer
Add-DhcpServerInDC -DnsName fmp-lab-dc01.lab.contoso.example -IPAddress 10.50.0.10
Add-DhcpServerv4Scope -Name 'Lab clients' -StartRange 10.50.0.100 -EndRange 10.50.0.200 -SubnetMask 255.255.255.0 -State Active
Set-DhcpServerv4OptionValue -DnsDomain lab.contoso.example -DnsServer 10.50.0.10
Add-DnsServerPrimaryZone -NetworkId 10.50.0.0/24 -ReplicationScope Domain
Add-DnsServerConditionalForwarderZone -Name partner.example -MasterServers 192.0.2.53 -ReplicationScope Forest

# Step 5: Unzip the kit and run the pre-flight
Expand-Archive -Path C:\fmp-lab\start-kit.zip -DestinationPath C:\fmp-lab\start-kit -Force
Set-Location C:\fmp-lab\start-kit
Import-Module .\powershell\FMPADAssessment\FMPADAssessment.psd1
Test-FMPPrerequisites -OutputPath C:\fmp-lab\run1 | Format-Table Check, Status, Detail -AutoSize

# Step 6: Run the two collectors
Get-FMPDNSAssessment -OutputPath C:\fmp-lab\run1
Get-FMPDHCPInventory -OutputPath C:\fmp-lab\run1 | Format-List ServerCount, ReadableServerCount, ScopeCount
Get-ChildItem -Recurse -File C:\fmp-lab\run1 | Select-Object -ExpandProperty FullName

# Step 7: Read your run as you read the fixture
$run = 'C:\fmp-lab\run1\lab.contoso.example'
$inv = Get-Content -Raw "$run\DNS\DNSInventory.json" | ConvertFrom-Json
$inv.Zones | Format-Table ZoneName, ZoneType, IsDsIntegrated, IsReverseLookupZone, IsSigned
$health = Get-Content -Raw "$run\DNS\DNSHealthReport.json" | ConvertFrom-Json
$health.SRVChecks | Format-Table SRVRecord, RecordCount, Status
$inv.Scavenging | Format-List ScavengingState, NoRefreshInterval, RefreshInterval
$dhcp = Get-Content -Raw "$run\DHCP\DHCPInventory.json" | ConvertFrom-Json
$dhcp.Servers | Format-Table Server, @{ n = 'Option 6 (DNS servers)'; e = { ($_.ServerOptions | Where-Object OptionId -eq 6).Value -join ', ' } }

# After the steps
Restore-VMSnapshot -VMName fmp-lab-dc01 -Name before-ddi-lab -Confirm:$false
```

:::

<!-- labs:end -->

1. **Checkpoint the virtual machine, and copy the kit to it.** On the Hyper-V host, in an elevated PowerShell:

    ```powershell
    Checkpoint-VM -Name fmp-lab-dc01 -SnapshotName before-ddi-lab
    Enable-VMIntegrationService -VMName fmp-lab-dc01 -Name 'Guest Service Interface'
    Copy-VMFile -Name fmp-lab-dc01 -SourcePath $HOME\Downloads\start-kit.zip -DestinationPath C:\fmp-lab\start-kit.zip -CreateFullPath -FileSource Host
    ```

2. **Install the roles.** In the virtual machine, in an elevated Windows PowerShell:

    ```powershell
    Install-WindowsFeature -Name AD-Domain-Services, DNS, DHCP -IncludeManagementTools
    ```

3. **Create the forest.** It asks for a Directory Services Restore Mode password, then restarts the server.

    ```powershell
    Install-ADDSForest -DomainName lab.contoso.example -DomainNetbiosName LAB -InstallDns
    ```

4. **Authorize DHCP, add a scope, and give the DNS server something to inventory.** After the restart, signed in as `LAB\Administrator`:

    ```powershell
    Add-DhcpServerSecurityGroup
    Restart-Service DHCPServer
    Add-DhcpServerInDC -DnsName fmp-lab-dc01.lab.contoso.example -IPAddress 10.50.0.10
    Add-DhcpServerv4Scope -Name 'Lab clients' -StartRange 10.50.0.100 -EndRange 10.50.0.200 -SubnetMask 255.255.255.0 -State Active
    Set-DhcpServerv4OptionValue -DnsDomain lab.contoso.example -DnsServer 10.50.0.10
    Add-DnsServerPrimaryZone -NetworkId 10.50.0.0/24 -ReplicationScope Domain
    Add-DnsServerConditionalForwarderZone -Name partner.example -MasterServers 192.0.2.53 -ReplicationScope Forest
    ```

    The virtual machine's name must be `fmp-lab-dc01` for `-DnsName`; check it with `hostname`. `192.0.2.53` is a documentation address that answers nothing, like a forwarder to a partner that has gone.

5. **Unzip the kit and run the pre-flight.**

    ```powershell
    Expand-Archive -Path C:\fmp-lab\start-kit.zip -DestinationPath C:\fmp-lab\start-kit -Force
    Set-Location C:\fmp-lab\start-kit
    Import-Module .\powershell\FMPADAssessment\FMPADAssessment.psd1
    Test-FMPPrerequisites -OutputPath C:\fmp-lab\run1 | Format-Table Check, Status, Detail -AutoSize
    ```

    Look for `PASS` on `Module: ActiveDirectory`, `Module: DnsServer`, `Module: DhcpServer` and `Forest connectivity`.

6. **Run the two collectors.**

    ```powershell
    Get-FMPDNSAssessment -OutputPath C:\fmp-lab\run1
    Get-FMPDHCPInventory -OutputPath C:\fmp-lab\run1 | Format-List ServerCount, ReadableServerCount, ScopeCount
    Get-ChildItem -Recurse -File C:\fmp-lab\run1 | Select-Object -ExpandProperty FullName
    ```

    Expected result: one server, one readable, one scope, and the files of Lab 1 under `C:\fmp-lab\run1\lab.contoso.example`, with a `DHCPScopes.csv` and a `DHCPReservations.csv` beside the DHCP file.

7. **Read your run as you read the fixture.** The same commands as Lab 1's steps 2 to 6, pointed at your run:

    ```powershell
    $run = 'C:\fmp-lab\run1\lab.contoso.example'
    $inv = Get-Content -Raw "$run\DNS\DNSInventory.json" | ConvertFrom-Json
    $inv.Zones | Format-Table ZoneName, ZoneType, IsDsIntegrated, IsReverseLookupZone, IsSigned
    $health = Get-Content -Raw "$run\DNS\DNSHealthReport.json" | ConvertFrom-Json
    $health.SRVChecks | Format-Table SRVRecord, RecordCount, Status
    $inv.Scavenging | Format-List ScavengingState, NoRefreshInterval, RefreshInterval
    $dhcp = Get-Content -Raw "$run\DHCP\DHCPInventory.json" | ConvertFrom-Json
    $dhcp.Servers | Format-Table Server, @{ n = 'Option 6 (DNS servers)'; e = { ($_.ServerOptions | Where-Object OptionId -eq 6).Value -join ', ' } }
    ```

    Expected result: the domain zone, its `_msdcs` zone, the reverse zone `0.50.10.in-addr.arpa` and the forwarder `partner.example`; four SRV checks that pass; scavenging off, Windows Server's default; option 6 set to `10.50.0.10`.

**Back it out.** The collectors changed nothing on the server. Keep the virtual machine and `C:\fmp-lab\run1` for [Module 2](02-the-active-directory-dns-departure.md)'s Lab 2. When you finish the path, on the Hyper-V host:

```powershell
Restore-VMSnapshot -VMName fmp-lab-dc01 -Name before-ddi-lab -Confirm:$false
```

## Knowledge check (5 minutes) {#ddi-m1-check}

1. A cloud application can't reach its private database endpoint from a branch office, and works from headquarters. The DNS servers log no errors. What does Book 08 suspect first?
    a. A failed DNS server at the branch.
    b. Split-brain DNS: the branch resolves the name from a copy of the namespace that gives the public answer, which is a valid answer, just the wrong one for that client.
    c. An expired certificate on the endpoint.

2. Why does Chapter 10 call the inventory the one step whose omission can't be repaired later?
    a. Because the inventory is the step with the most rollback risk.
    b. Because records AD DNS maintains, such as the locator records and dynamically registered hosts, can't be recovered from a domain controller once it has been decommissioned.
    c. Because the inventory must be submitted to CISA.

3. In Lab 1, `dc03` lacks the AD-integrated zone `16.172.in-addr.arpa`. What should the team do before planning that zone's move?
    a. Nothing: reverse zones don't matter.
    b. Find out why: the zone hasn't replicated to `dc03`, or isn't stored in the partition people think, and either changes how it moves.
    c. Delete it from `dc01` so the servers agree.

4. Lab 1's `dhcp02` hands its clients `203.0.113.53` as a DNS server. Which requirement does that run against?
    a. M-22-09's agency-designated resolvers, and the Protective DNS path for egress.
    b. BOD 18-01, because it concerns email.
    c. None: option 6 is a client setting, not a requirement.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See Unit 1 and [Chapter 02](../../books/b08-ddi/02-split-brain-dns.md#private-ip-split-brain-the-cross-cloud-case).
2. **b.** See [Chapter 10, Phase 1](../../books/b08-ddi/10-migration-sequence.md#phase-1-inventory-and-baseline). The inventory is read-only, so it carries no rollback risk at all.
3. **b.** See Lab 1, step 3.
4. **a.** See Unit 2 and [Appendix B](../../books/b08-ddi/appendix-b-requirements-mapping.md#requirements-mapping).
:::

## Summary (2 minutes) {#ddi-m1-summary}

You saw why Book 08 treats the naming plane as a control plane and what the federal requirements ask of it, compared Chapter 10's Phase 1 with what the Start Kit collects, and read a fictional domain's run: an unreadable DNS server, a zone missing from another, a locator record that doesn't resolve, scavenging off with a duplicate host, and a DHCP server handing out a resolver that isn't the agency's. **Evidence an ISSO keeps from this module:** the dated run folder, unchanged, as the Phase 1 baseline.

::: {.callout-tip}
## Continue the path
[Learning path](index.md) · [Next: Module 2, The Active Directory DNS departure →](02-the-active-directory-dns-departure.md)
:::
