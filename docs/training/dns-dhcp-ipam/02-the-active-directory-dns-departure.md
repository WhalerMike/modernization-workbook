---
title: "Module 2: The Active Directory DNS departure"
description: "Book 08, Chapter 04 and Chapter 10's \"Where each component goes\": what AD-integrated DNS and Windows DHCP actually do for a domain, why the locator records stay with a service domain controllers can register in, and where every other zone, forwarder and registration goes, how, and at what risk. Lab 1 builds the departure register for a fictional domain with the Start Kit's Get-FMPDnsDepartureRegister and reads its findings; Lab 2 builds it for your test domain and checks the DHCP registration settings by hand. About 55 minutes, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 08"
series-order: 2
review-status: approved
reviewed-sha256: 7721210d0fe3795c4721fd7314cd0ff37f3a9e93e4257857e67a01328ba089b3
last-reviewed: 2026-11-25
---
# Module 2: The Active Directory DNS departure {.unnumbered}

*Part of the [DNS, DHCP and IPAM learning path](index.md). Book 08, [Chapter 04](../../books/b08-ddi/04-active-directory-dns-departure.md) and [Chapter 10's "Where each component goes"](../../books/b08-ddi/10-migration-sequence.md#where-each-component-goes). About 55 minutes.*

## Introduction (3 minutes) {#ddi-m2-introduction}

Leaving Active Directory DNS isn't one move. A domain's DNS is a set of components, each with its own job: the zones the directory replicates, the locator records domain controllers register, the secure dynamic updates clients and DHCP servers make, the forwarders to partners and clouds, the signed zones. Each one goes somewhere different, by a different method, at a different risk, and one of them, the locator records, can't leave until the last domain controller does.

In this module you sort every component of a fictional domain into Chapter 10's table with the Start Kit's departure register, and read the findings Chapter 10 says to clear before anything moves. In Lab 2 you build the register for your test domain and read the DHCP registration settings the collectors don't.

**The federal requirement.** The register turns Module 1's inventory into planned changes, each with a method and a way back. [Chapter 10](../../books/b08-ddi/10-migration-sequence.md#b08-10-conventions) maps the migration to the workbook's conventions.

| Requirement | KSI | Evidence |
|---|---|---|
| CM-8: each inventoried component with its disposition | KSI-PIY-GIV | `DepartureRegister.csv`, dated, naming the run it was built from |
| CM-3: configuration changes planned, reviewed and approved before they're made | KSI-CMT-LMC, KSI-CMT-RVP | The register, reviewed row by row and approved before Phase 3 moves a zone |
| CP-2: a contingency plan | KSI-RPL-ARP | The rollback point for each High-risk row |
| SC-20, SC-21: signed answers, and resolvers that validate them | None in the workbook's verified pairings | The signed-zone row, and its own move sequence |

KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its own evidence up with them. The steps *support* these controls; the assessor decides whether each is satisfied.

## Learning objectives (1 minute) {#ddi-m2-objectives}

After this module, you'll be able to:

- name the components of AD DNS that each need a decision, and say what each does for the domain;
- explain why the locator records stay with a service that accepts domain controller registration, and why Azure Private DNS can't host them;
- explain how DHCP name ownership, DnsUpdateProxy, a dedicated credential and name protection decide whether dynamic records stay trustworthy;
- build a departure register from a run, read its target, method and risk for each component, and clear its findings in order.

## Prerequisites (1 minute) {#ddi-m2-prerequisites}

- [Module 1](01-read-the-naming-plane.md), or the same reading of a run.
- Windows PowerShell 5.1 or PowerShell 7, and the Start Kit's folder `examples/start-kit`.

## Unit 1: What AD-integrated DNS actually is (8 minutes) {#ddi-m2-unit-1}

Read Book 08, [Chapter 04](../../books/b08-ddi/04-active-directory-dns-departure.md), sections *What AD-integrated DNS actually is* and *The locator records*. Three points to take away:

- **A zone stored in the directory brings two things a file doesn't:** secure dynamic updates and multi-master operation, both of which leave with the directory. Its replication scope (domain, forest, legacy or a custom partition) decides which domain controllers hold it.
- **Conditional forwarders are easy to find and hard to judge.** Windows stores each one as a zone, so the inventory lists them; what nobody wrote down is why each exists. Forwarders to retired servers are retired, not carried forward.
- **The locator records are registered, not written.** Netlogon on each domain controller registers them, and re-registers them as domain controllers and sites change. So they can only live on a DNS service that accepts secure registration from domain controllers.

## Unit 2: Dynamic registration and the DHCP server (7 minutes) {#ddi-m2-unit-2}

Read [Chapter 04, Secure dynamic updates and the DHCP server](../../books/b08-ddi/04-active-directory-dns-departure.md#secure-dynamic-updates-and-the-dhcp-server). The settings it lists decide whether the records DHCP registers stay trustworthy:

| Setting | What goes wrong without a decision |
|---|---|
| Name ownership | The DHCP server that registered a name owns it; when its failover partner takes over, the partner can't update it unless both use the same credential |
| The DnsUpdateProxy group | Records its members create are unsecured, so the next object to register the name owns it |
| A dedicated credential | A DHCP server on a domain controller otherwise uses the domain controller's own authority over every record |
| Name protection | Without it, an update can overwrite a name another client already holds |
| Aging and scavenging | Stale records stay, and a name can point at two addresses: Module 1's `ws131` |

: The DHCP registration settings Chapter 04 says to decide {.striped .hover}

None of these is in the collectors' files: Lab 2 reads them with Chapter 04's read-only commands.

## Unit 3: Where each component goes (8 minutes) {#ddi-m2-unit-3}

Read [Chapter 10, Where each component goes](../../books/b08-ddi/10-migration-sequence.md#where-each-component-goes), and the two Azure behaviors under its table, then [Chapter 04, What must be reprovisioned before AD leaves](../../books/b08-ddi/04-active-directory-dns-departure.md#what-must-be-reprovisioned-before-ad-leaves). The table gives every component a target under the policy plane, an Azure-native equivalent, a method and a risk. Two rows have no Azure-native home:

- **The locator records: none.** Azure Private DNS fills its autoregistered records from Azure's own DHCP service and ignores the registration messages clients send, so domain controllers can't register there; imported SRV records would go stale the first time a domain controller changes.
- **Dynamic registration: VMs only.** Autoregistration creates an A record for a VM's primary network interface, and no PTR record. Everything else needs IPAM-driven record management.

The Start Kit's `Get-FMPDnsDepartureRegister` writes that table for one domain from a run: one row per zone, plus one for dynamic registration, in the chapter's words, with notes from the run. It decides nothing; the architects confirm or change every row.

## Exercise: Lab 1, fixtures, no server (25 minutes) {#ddi-m2-lab-1}

You build the departure register for Module 1's fictional domain and read it. Work in `examples/start-kit`, in Windows PowerShell 5.1 or PowerShell 7. The run is the same: `tests/fixtures/ddi/run-2026-11-20/contoso.example`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/start-kit`. Each step below says what it does and what to look for.

```powershell
# Step 1: Import the readiness module
Import-Module ./powershell/FMPDdiReadiness/FMPDdiReadiness.psd1
Get-Command -Module FMPDdiReadiness | Format-Table Name, Version

# Step 2: Build the register
$reg = Get-FMPDnsDepartureRegister -Path tests/fixtures/ddi/run-2026-11-20/contoso.example -OutputPath out
$reg.Rows | Group-Object Risk -NoElement | Sort-Object Name | Format-Table Name, Count

# Step 3: Read the High-risk rows
$reg.Rows | Where-Object Risk -eq 'High' | Format-List Zone, Component, Target, AzureEquivalent, Method

# Step 4: Read the Medium-risk rows and their notes
$reg.Rows | Where-Object Risk -eq 'Medium' | ForEach-Object { '{0,-20} {1,-29} {2}' -f $_.Zone, $_.Component, $_.Notes }

# Step 5: Read the Low-risk rows
$reg.Rows | Where-Object Risk -eq 'Low' | ForEach-Object { '{0,-23} {1,-35} {2}' -f $_.Zone, $_.Component, $_.Notes }

# Step 6: Read the findings
$reg.Findings | Format-List Item, Finding, Book08

# Step 7: Name the zone that is also public
(Get-FMPDnsDepartureRegister -Path tests/fixtures/ddi/run-2026-11-20/contoso.example -ExternalZone contoso.example).Rows | Where-Object Zone -eq 'contoso.example' | Format-List Component, Target, Method, Risk

# Step 8: Check what was written
Get-ChildItem -Recurse -File out | Resolve-Path -Relative
Import-Csv out/contoso.example/DDI/DepartureRegister.csv | Measure-Object | Select-Object Count

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Import the readiness module.** It reads the collectors' files and nothing else. This module uses `Get-FMPDnsDepartureRegister` and `Read-FMPDdiRun`; Modules 3 to 6 use the others.

    ```powershell
    Import-Module ./powershell/FMPDdiReadiness/FMPDdiReadiness.psd1
    Get-Command -Module FMPDdiReadiness | Format-Table Name, Version
    ```

    Expected output:

    ```text
    Name                        Version
    ----                        -------
    Get-FMPDdiEvidenceIndex     1.2.0
    Get-FMPDnsDepartureRegister 1.2.0
    Read-FMPDdiRun              1.2.0
    Test-FMPAddressPlan         1.2.0
    Test-FMPDdiDecommissionGate 1.2.0
    Test-FMPDhcpEdge            1.2.0
    Test-FMPLocatorResolution   1.2.0
    ```

2. **Build the register,** and count its rows by risk.

    ```powershell
    $reg = Get-FMPDnsDepartureRegister -Path tests/fixtures/ddi/run-2026-11-20/contoso.example -OutputPath out
    $reg.Rows | Group-Object Risk -NoElement | Sort-Object Name | Format-Table Name, Count
    ```

    Expected output:

    ```text
    Name   Count
    ----   -----
    High       2
    Low        6
    Medium     5
    ```

    Thirteen rows: the twelve zones, and dynamic registration.

3. **Read the High-risk rows.**

    ```powershell
    $reg.Rows | Where-Object Risk -eq 'High' | Format-List Zone, Component, Target, AzureEquivalent, Method
    ```

    Expected output:

    ```text
    Zone            : _msdcs.contoso.example
    Component       : AD locator records
    Target          : Stay with a service that accepts domain controller registration until the last DC goes
    AzureEquivalent : None
    Method          : Forward the AD namespaces to the domain controllers; monitor

    Zone            : secure.contoso.example
    Component       : DNSSEC-signed zone
    Target          : Signed authoritative zone
    AzureEquivalent : Public zones only; Azure Private DNS does not sign
    Method          : Move in Phase 3 by the signed-zone sequence; the new chain validates before the Phase 5 gate
    ```

    The locator records don't move: the new platform forwards the AD namespaces to the domain controllers until the last one goes. The signed zone moves on its own sequence, with the old signing kept until the new chain validates ([Chapter 06](../../books/b08-ddi/06-dns-identity-and-dnssec.md)).

4. **Read the Medium-risk rows and their notes.**

    ```powershell
    $reg.Rows | Where-Object Risk -eq 'Medium' | ForEach-Object { '{0,-20} {1,-29} {2}' -f $_.Zone, $_.Component, $_.Notes }
    ```

    Expected output:

    ```text
    contoso.example      AD-integrated zone, internal  4 stale records; clean up before migrating
    (dynamic updates)    Dynamic registration          Zones that take dynamic updates: contoso.example (Secure), _msdcs.contoso.example (Secure), 10.in-addr.arpa (Secure), 16.172.in-addr.arpa (NonsecureAndSecure)
    GlobalNames          GlobalNames zone
    10.in-addr.arpa      Reverse lookup zone           2 stale records; clean up before migrating
    16.172.in-addr.arpa  Reverse lookup zone           Not on dc03.contoso.example
    ```

    `16.172.in-addr.arpa` takes nonsecure updates, so any client can overwrite its records: a decision to make before it moves, not after. And it is the zone Module 1 found missing from `dc03`.

5. **Read the Low-risk rows.** Most are forwarders and stubs.

    ```powershell
    $reg.Rows | Where-Object Risk -eq 'Low' | ForEach-Object { '{0,-23} {1,-35} {2}' -f $_.Zone, $_.Component, $_.Notes }
    ```

    Expected output:

    ```text
    apps.contoso.example    File-backed primary
    legacy.contoso.example  Secondary zone                      Primary: 10.9.0.53
    blob.core.windows.net   Stub zone or conditional forwarder  Conditional forwarder to 10.2.4.4; test each target over DNS
    hr.contoso.example      Stub zone or conditional forwarder  Stub zone to 10.20.0.10; test each target over DNS
    oldvendor.example       Stub zone or conditional forwarder  Conditional forwarder to 198.51.100.53; test each target over DNS
    partner.example         Stub zone or conditional forwarder  Conditional forwarder to 192.0.2.53; test each target over DNS
    ```

    Low risk doesn't mean keep. Each forwarder becomes a rule on the new platform only once someone has said why it exists and its target has answered a DNS query; one that points at a retired server is retired. `blob.core.windows.net` sends Azure Storage names to `10.2.4.4`, an Azure DNS Private Resolver's inbound endpoint, which is how on-premises clients get a private endpoint's private answer ([Chapter 07](../../books/b08-ddi/07-cloud-private-endpoints-and-ipam.md#azure-dns-and-private-endpoints)).

6. **Read the findings.** They are what Chapter 10's Phase 1 says to clear first.

    ```powershell
    $reg.Findings | Format-List Item, Finding, Book08
    ```

    Expected output:

    ```text
    Item    : _kpasswd._tcp.contoso.example
    Finding : Does not resolve on the PDC emulator's DNS server
    Book08  : Chapter 04, The locator records; Chapter 10, Phase 5 gate

    Item    : dc02.contoso.example
    Finding : Not read: The RPC server is unavailable.
    Book08  : Chapter 10, Phase 1: every zone on every DNS server

    Item    : Aging and scavenging
    Finding : Scavenging is off, so stale records stay
    Book08  : Chapter 04, Secure dynamic updates and the DHCP server; Chapter 10, Phase 1

    Item    : Stale records
    Finding : 6 records older than 90 days
    Book08  : Chapter 10, Phase 1: clean up before migrating

    Item    : Duplicate host name
    Finding : Stale A records for one name, different addresses: ws131.contoso.example (10.0.5.131, 10.0.5.140)
    Book08  : Chapter 04, What Kerberos needs from DNS on the way out

    Item    : Server-level forwarders
    Finding : 192.0.2.1, 192.0.2.2; root hints on; test each over DNS, not just ICMP
    Book08  : Chapter 10, Phase 1
    ```

    Every finding from Module 1's reading is here, with the chapter that explains it.

7. **Name the zone that is also public.** AD can't say which zones the internet sees, so the register treats every AD-integrated zone as internal unless you name it.

    ```powershell
    (Get-FMPDnsDepartureRegister -Path tests/fixtures/ddi/run-2026-11-20/contoso.example -ExternalZone contoso.example).Rows | Where-Object Zone -eq 'contoso.example' | Format-List Component, Target, Method, Risk
    ```

    Expected output:

    ```text
    Component : AD-integrated zone, external
    Target    : Public authoritative zone
    Method    : Export, import, then change NS delegation at the registrar
    Risk      : High
    ```

    A public zone's move changes the delegation at the registrar, so it is High risk.

8. **Check what was written.**

    ```powershell
    Get-ChildItem -Recurse -File out | Resolve-Path -Relative
    Import-Csv out/contoso.example/DDI/DepartureRegister.csv | Measure-Object | Select-Object Count
    ```

    Expected output (on Linux or macOS the paths use `/`):

    ```text
    .\out\contoso.example\DDI\DepartureRegister.csv
    .\out\contoso.example\DDI\DepartureRegister.json

    Count
    -----
       13
    ```

    The CSV is the register the architects review; the JSON adds the findings and the run it came from.

Clean up:

```powershell
Remove-Item -Recurse -Force out
```

## Exercise: Lab 2, your test domain (25 minutes) {#ddi-m2-lab-2}

You build the register for the test domain of [Module 1](01-read-the-naming-plane.md)'s Lab 2, then read the DHCP registration settings and the locator records with [Chapter 04](../../books/b08-ddi/04-active-directory-dns-departure.md#secure-dynamic-updates-and-the-dhcp-server)'s read-only commands. You need that virtual machine, `fmp-lab-dc01` in `lab.contoso.example`, and its run in `C:\fmp-lab\run1`. Work in its `C:\fmp-lab\start-kit\start-kit`, in Windows PowerShell, signed in as `LAB\Administrator`. *The authors didn't run these steps.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
# Step 1: Build the register for your domain
Set-Location C:\fmp-lab\start-kit\start-kit
Import-Module .\powershell\FMPDdiReadiness\FMPDdiReadiness.psd1
$reg = Get-FMPDnsDepartureRegister -Path C:\fmp-lab\run1\lab.contoso.example -OutputPath C:\fmp-lab\ddi
$reg.Rows | Format-Table Zone, Component, Risk, Notes -Wrap
$reg.Findings | Format-List Item, Finding

# Step 2: Read the DHCP server's registration settings
Get-DhcpServerv4DnsSetting -ComputerName fmp-lab-dc01
Get-DhcpServerv4DnsSetting -ComputerName fmp-lab-dc01 -ScopeId 10.50.0.0

# Step 3: Read the credential DHCP registers with, and who is in DnsUpdateProxy
Get-DhcpServerDnsCredential -ComputerName fmp-lab-dc01
Get-ADGroupMember -Identity DnsUpdateProxy

# Step 4: Read the locator records the domain controller intends to register
Get-Content C:\Windows\System32\Config\netlogon.dns | Select-String '_kpasswd|_ldap._tcp.dc._msdcs|_kerberos._tcp.dc._msdcs'
(Get-Content -Raw C:\fmp-lab\run1\lab.contoso.example\DNS\DNSHealthReport.json | ConvertFrom-Json).SRVChecks | Format-Table SRVRecord, Status

# Step 5: Test the forwarder's target over DNS
Resolve-DnsName -Name partner.example -Type SOA -Server 192.0.2.53 -DnsOnly -QuickTimeout

# After the steps
Remove-Item -Recurse -Force C:\fmp-lab\ddi

# After the steps
Restore-VMSnapshot -VMName fmp-lab-dc01 -Name before-ddi-lab -Confirm:$false
```

:::

<!-- labs:end -->

1. **Build the register for your domain.**

    ```powershell
    Set-Location C:\fmp-lab\start-kit\start-kit
    Import-Module .\powershell\FMPDdiReadiness\FMPDdiReadiness.psd1
    $reg = Get-FMPDnsDepartureRegister -Path C:\fmp-lab\run1\lab.contoso.example -OutputPath C:\fmp-lab\ddi
    $reg.Rows | Format-Table Zone, Component, Risk, Notes -Wrap
    $reg.Findings | Format-List Item, Finding
    ```

    Expected result: rows for `lab.contoso.example`, `_msdcs.lab.contoso.example`, `0.50.10.in-addr.arpa`, `partner.example` and dynamic registration; findings for scavenging, which is off by default, and for no server-level forwarders unless your build set some.

2. **Read the DHCP server's registration settings.** At the server and on the lab scope:

    ```powershell
    Get-DhcpServerv4DnsSetting -ComputerName fmp-lab-dc01
    Get-DhcpServerv4DnsSetting -ComputerName fmp-lab-dc01 -ScopeId 10.50.0.0
    ```

    Look at `DynamicUpdates`, `DeleteDnsRROnLeaseExpiry` and `NameProtection`. Name protection is off unless someone turned it on.

3. **Read the credential DHCP registers with, and who is in DnsUpdateProxy.**

    ```powershell
    Get-DhcpServerDnsCredential -ComputerName fmp-lab-dc01
    Get-ADGroupMember -Identity DnsUpdateProxy
    ```

    On a new domain controller there's no credential, and DnsUpdateProxy is empty: so this DHCP server registers with the domain controller's own authority, the case Chapter 04 says to avoid.

4. **Read the locator records the domain controller intends to register,** and compare them with the collector's four checks.

    ```powershell
    Get-Content C:\Windows\System32\Config\netlogon.dns | Select-String '_kpasswd|_ldap._tcp.dc._msdcs|_kerberos._tcp.dc._msdcs'
    (Get-Content -Raw C:\fmp-lab\run1\lab.contoso.example\DNS\DNSHealthReport.json | ConvertFrom-Json).SRVChecks | Format-Table SRVRecord, Status
    ```

    `netlogon.dns` lists every record Netlogon registers, many more than the collector's four. Chapter 04 points to it for agencies that run AD on another DNS platform: it is the list the new platform must keep resolvable.

5. **Test the forwarder's target over DNS,** not with a ping.

    ```powershell
    Resolve-DnsName -Name partner.example -Type SOA -Server 192.0.2.53 -DnsOnly -QuickTimeout
    ```

    Expected result: an error, because `192.0.2.53` is a documentation address and nothing answers. In the register this forwarder becomes a row to retire, not a rule to carry forward.

For each row of the register, the architects then record whether they confirm or change it, and why; for each forwarder, also why it exists. The register can't make those decisions.

**Back it out.** Nothing here changed the server. Delete the register, then restore the checkpoint from Module 1, on the Hyper-V host:

```powershell
Remove-Item -Recurse -Force C:\fmp-lab\ddi
```

```powershell
Restore-VMSnapshot -VMName fmp-lab-dc01 -Name before-ddi-lab -Confirm:$false
```

## Knowledge check (5 minutes) {#ddi-m2-check}

1. Why can't the domain controllers' locator records move into Azure Private DNS?
    a. Azure Private DNS has no SRV record type.
    b. Azure Private DNS ignores client registration messages and fills autoregistered records only from Azure's own DHCP service, so domain controllers can't register their records, and imported ones go stale the first time a domain controller changes.
    c. It would cost too much.

2. Two DHCP servers in a failover relationship each register client names with their own computer account. What fails when one goes down?
    a. Nothing: the partner takes over the names.
    b. The partner can't update the names the failed server registered, because the failed server owns them; both partners should use the same dedicated credential.
    c. Every client loses its lease.

3. The register lists a conditional forwarder as Low risk. What must happen before it becomes a rule on the new platform?
    a. Nothing: Low risk means it can be copied as it is.
    b. Someone records why it exists, and its target answers a DNS query from the new resolver; a forwarder to a retired server is retired instead.
    c. It is converted to a stub zone.

4. Why does the register treat `contoso.example` as internal until it is named with `-ExternalZone`?
    a. Because AD can't tell which zones the internet also sees, and moving a public zone means changing its delegation at the registrar, which is High risk.
    b. Because every AD-integrated zone is internal.
    c. Because external zones can't be AD-integrated.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See Unit 3 and [Chapter 10](../../books/b08-ddi/10-migration-sequence.md#where-each-component-goes).
2. **b.** See Unit 2 and [Chapter 04](../../books/b08-ddi/04-active-directory-dns-departure.md#secure-dynamic-updates-and-the-dhcp-server).
3. **b.** See Lab 1, step 5, and [Chapter 04](../../books/b08-ddi/04-active-directory-dns-departure.md#what-must-be-reprovisioned-before-ad-leaves).
4. **a.** See Lab 1, step 7.
:::

## Summary (2 minutes) {#ddi-m2-summary}

You saw what each component of AD DNS does for a domain, why the locator records stay with a service domain controllers can register in, and which DHCP settings keep dynamic records trustworthy; then you built a departure register from a run and read its targets, methods, risks and findings. **Evidence an ISSO keeps from this module:** `DepartureRegister.csv` and `DepartureRegister.json` with the run they came from, and the architects' signed decision on each row.

::: {.callout-tip}
## Continue the path
[Learning path](index.md) · [← Module 1, Read the naming plane](01-read-the-naming-plane.md) · [Next: Module 3, DHCP, encrypted DNS and the edge →](03-dhcp-encrypted-dns-and-the-edge.md)
:::
