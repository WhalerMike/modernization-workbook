---
title: "Module 3: DHCP, encrypted DNS and the edge"
description: "Book 08, Chapter 05 and Chapter 04's DHCP settings: why the resolver a client uses is decided by DHCP option 6, why encrypted DNS must end at the agency's resolvers or Protective DNS, what Windows DHCP authorization does and doesn't stop, and the options and registration settings to govern. Lab 1 runs the Start Kit's Test-FMPDhcpEdge on a fictional domain's DHCP file and a DHCP snooping export; Lab 2 adds a guest scope to your test domain, collects it and checks it, and reads the server's encrypted DNS client list. About 55 minutes, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 08"
series-order: 3
review-status: pending
---
# Module 3: DHCP, encrypted DNS and the edge {.unnumbered}

*Part of the [DNS, DHCP and IPAM learning path](index.md). Book 08, [Chapter 05](../../books/b08-ddi/05-edge-interception-and-bypass.md) and [Chapter 04, Secure dynamic updates and the DHCP server](../../books/b08-ddi/04-active-directory-dns-departure.md#secure-dynamic-updates-and-the-dhcp-server). About 55 minutes.*

## Introduction (3 minutes) {#ddi-m3-introduction}

Every policy the agency puts on its resolvers, from Protective DNS to response policy zones, applies only to queries that reach them. Two things decide that before a query is ever sent: the resolvers DHCP hands the client in option 6, and whether the client or its browser sends its queries somewhere else over encrypted DNS. A rogue DHCP server can move a whole subnet to an attacker's resolver in one lease; a browser set to a public DNS over HTTPS service never asks the agency at all.

In this module you check a fictional domain's DHCP servers the way Chapter 05 asks: the resolvers each scope hands out, the other options that move traffic, failover, the DNS registration settings Module 2 introduced, and the DHCP servers the network saw that nobody authorized. In Lab 2 you check your test domain the same way and read what its DNS client knows about encrypted DNS.

**The federal requirement.** Chapter 05 ties option 6 and encrypted DNS to M-22-09's agency-designated encrypted resolvers and CISA's Protective DNS; [Appendix B](../../books/b08-ddi/appendix-b-requirements-mapping.md#requirements-mapping) maps them.

| Requirement | KSI | Evidence |
|---|---|---|
| OMB M-22-09: encrypted DNS, to agency-designated resolvers | None in the workbook's verified pairings | Option 6 on every scope against the approved list; the endpoint and browser DoH policy exports |
| CISA Protective DNS: egress resolution through CISA's resolver | None in the workbook's verified pairings | No scope hands out a resolver that bypasses the agency's |
| CM-8: unauthorized components found and dealt with | KSI-PIY-GIV | The DHCP servers seen answering that aren't authorized, each with its outcome |
| CM-3: option and scope changes controlled | KSI-CMT-LMC, KSI-CMT-RVP | `DhcpEdge.csv` before and after each change, with its approval |
| SC-22: fault-tolerant resolution | None in the workbook's verified pairings | The scopes in no failover relationship |

KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its own evidence up with them. The steps *support* these controls; the assessor decides whether each is satisfied.

## Learning objectives (1 minute) {#ddi-m3-objectives}

After this module, you'll be able to:

- explain how option 6 and rogue DHCP decide which resolver a client uses, and why AD authorization doesn't stop a rogue server;
- name the DHCP options Chapter 05 says to govern, and what goes wrong with each;
- say what the network can and can't block for plain DNS, DNS over TLS, DNS over QUIC and DNS over HTTPS, and where endpoint policy has to take over;
- check a domain's DHCP servers for unapproved resolvers, options, failover gaps, registration settings and unauthorized servers, and read the result.

## Prerequisites (1 minute) {#ddi-m3-prerequisites}

- [Module 2](02-the-active-directory-dns-departure.md), Unit 2: the DHCP registration settings.
- Windows PowerShell 5.1 or PowerShell 7, and the Start Kit's folder `examples/start-kit`.

## Unit 1: Option 6 and rogue DHCP (8 minutes) {#ddi-m3-unit-1}

Read Book 08, [Chapter 05, DHCP option 6 and rogue DHCP](../../books/b08-ddi/05-edge-interception-and-bypass.md#dhcp-option-6-and-rogue-dhcp), with its two subsections. Three points to take away:

- **One lease moves a subnet.** A rogue DHCP server that hands out its own resolver in option 6 puts every client that takes its lease past the agency's resolvers. In IPv6, a rogue router advertisement carrying a resolver does the same, and networks often govern it less.
- **Option 6 isn't the only option that moves traffic.** Option 15 sets the domain short names resolve in, option 119 the search list, option 81 who registers the client's name, and option 252 (by convention, WPAD) the web proxy configuration. Each should be set once, centrally, and be the same on every server that serves a scope.
- **AD authorization stops Windows servers only.** A Windows DHCP server checks itself against the authorized list and stops leasing if it's missing; a home router in a wall port, a rogue appliance or malware answering DHCP never checks. DHCP snooping and RA Guard on the access switches stop those, and IPAM shows an unexpected lease.

## Unit 2: Encrypted DNS ends at the agency's resolvers (10 minutes) {#ddi-m3-unit-2}

Read [Chapter 05, Encrypted DNS and bypass controls](../../books/b08-ddi/05-edge-interception-and-bypass.md#encrypted-dns-and-bypass-controls), through *Control the endpoint: browsers*.

| Transport | What the network can do | What has to do the rest |
|---|---|---|
| Plain DNS, UDP and TCP 53 | Intercept, redirect, and block outbound except from authorized servers | Nothing more |
| DNS over TLS (TCP 853) and DNS over QUIC (UDP 853) | Block port 853 except to approved resolvers; it can't redirect them | Nothing more, once blocked |
| DNS over HTTPS (TCP 443) | Not see or redirect it; RPZ and firewall rules against known public DoH services help | Endpoint policy: the Windows DNS client's DoH settings and each browser's DoH policy, or TLS inspection |

: What each DNS transport leaves the network, from Book 08's Chapter 05 {.striped .hover}

Two points from the chapter shape Lab 2. Windows adds DoH only for servers on its list of known DoH servers, and the list ships with public resolvers on it, so the agency adds its own. And a Windows DNS server that accepts DoH from clients still forwards upstream in plain text, so M-22-09's encrypted-upstream expectation calls for a resolver that can, or an encrypting proxy in front of Protective DNS; CISA doesn't accept IPsec as a substitute.

None of this is visible in a DHCP file. The kit checks the DHCP half; the endpoint half is policy, and its evidence is the policy exports Chapter 05's checklist lists.

## Unit 3: What the edge check reads (5 minutes) {#ddi-m3-unit-3}

`Get-FMPDHCPInventory` now reads each scope's own options as well as the server's, and each server's DNS registration settings and the name of the account it registers with (never a password). The Start Kit's `Test-FMPDhcpEdge` reads that file and applies Chapter 05's and Chapter 04's rules:

| Check | Finds |
|---|---|
| Option 6 | A scope that hands out a resolver not on `-ApprovedResolver`, or no resolver; the servers of one scope handing out different resolvers |
| Option 15 | A domain that isn't a zone on the agency's DNS servers |
| Option 252 | WPAD set by DHCP, to confirm or remove |
| Failover | A scope only one server can lease from |
| Registration | No dedicated registration account; failover partners with different accounts; name protection off |
| Rogue DHCP | With `-ObservedDhcpServerPath`, an address the network saw answering DHCP that isn't an authorized server's |

: What Test-FMPDhcpEdge checks {.striped .hover}

A scope's own option wins over the server's, as it does on a Windows DHCP server, and each finding says which one set the value. The observed list comes from the network team: a DHCP snooping export, or a DHCP discovery scan.

## Exercise: Lab 1, fixtures, no server (20 minutes) {#ddi-m3-lab-1}

You check the DHCP servers of Module 1's fictional domain against its approved resolvers, `10.0.0.10`, `10.0.0.11` and `10.1.0.10`, and against what the access switches saw. Work in `examples/start-kit`, in Windows PowerShell 5.1 or PowerShell 7. The run is the same: `tests/fixtures/ddi/run-2026-11-20/contoso.example`; the switches' export is `tests/fixtures/ddi/observed-dhcp-servers.csv`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/start-kit`. Each step below says what it does and what to look for.

```powershell
# Step 1: Run the edge check
Import-Module ./powershell/FMPDdiReadiness/FMPDdiReadiness.psd1
$edge = Test-FMPDhcpEdge -Path tests/fixtures/ddi/run-2026-11-20/contoso.example -ApprovedResolver 10.0.0.10, 10.0.0.11, 10.1.0.10 -ObservedDhcpServerPath tests/fixtures/ddi/observed-dhcp-servers.csv
$edge.Scopes | Format-Table Server, ScopeId, DnsServers, Domain

# Step 2: Count the findings by area
$edge.Findings | Group-Object Area -NoElement | Sort-Object Name | Format-Table Name, Count

# Step 3: Read the option findings
$edge.Findings | Where-Object Area -like 'Option*' | ForEach-Object { '{0,-10} {1,-9} {2}' -f $_.Area, $_.Scope, $_.Finding }

# Step 4: Read the failover and registration findings
$edge.Findings | Where-Object Area -in 'Failover', 'Registration' | ForEach-Object { '{0,-12} {1,-46} {2,-9} {3}' -f $_.Area, $_.Server, $_.Scope, $_.Finding }

# Step 5: Read what the switches saw
Import-Csv tests/fixtures/ddi/observed-dhcp-servers.csv | Format-Table
$edge.Findings | Where-Object Area -eq 'Rogue DHCP' | Format-List Server, Finding, Book08

# Step 6: Write the findings, as the evidence for this check
$w = Test-FMPDhcpEdge -Path tests/fixtures/ddi/run-2026-11-20/contoso.example -ApprovedResolver 10.0.0.10, 10.0.0.11, 10.1.0.10 -ObservedDhcpServerPath tests/fixtures/ddi/observed-dhcp-servers.csv -OutputPath out
$w.Written | Resolve-Path -Relative
Import-Csv out/contoso.example/DDI/DhcpEdge.csv | Measure-Object | Select-Object Count

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Run the edge check,** and read what each scope hands out.

    ```powershell
    Import-Module ./powershell/FMPDdiReadiness/FMPDdiReadiness.psd1
    $edge = Test-FMPDhcpEdge -Path tests/fixtures/ddi/run-2026-11-20/contoso.example -ApprovedResolver 10.0.0.10, 10.0.0.11, 10.1.0.10 -ObservedDhcpServerPath tests/fixtures/ddi/observed-dhcp-servers.csv
    $edge.Scopes | Format-Table Server, ScopeId, DnsServers, Domain
    ```

    Expected output:

    ```text
    Server                 ScopeId  DnsServers              Domain
    ------                 -------  ----------              ------
    dhcp01.contoso.example 10.0.5.0 10.0.0.10, 10.0.0.11    contoso.example
    dhcp01.contoso.example 10.0.6.0 10.0.0.11               contoso.example
    dhcp01.contoso.example 10.1.5.0 10.0.0.10, 10.0.0.11    contoso.example
    dhcp02.contoso.example 10.1.5.0 10.1.0.10, 203.0.113.53 branch.contoso.example
    dhcp02.contoso.example 10.1.7.0 10.1.0.10, 203.0.113.53 contoso.example
    ```

    The printers' scope sets its own option 6, so it gives one resolver where the server gives two. The branch scope `10.1.5.0` is served by both servers, and they disagree on both its resolvers and its domain.

2. **Count the findings by area.**

    ```powershell
    $edge.Findings | Group-Object Area -NoElement | Sort-Object Name | Format-Table Name, Count
    ```

    Expected output:

    ```text
    Name         Count
    ----         -----
    Failover         3
    Option 15        1
    Option 252       1
    Option 6         3
    Registration     3
    Rogue DHCP       1
    ```

3. **Read the option findings.**

    ```powershell
    $edge.Findings | Where-Object Area -like 'Option*' | ForEach-Object { '{0,-10} {1,-9} {2}' -f $_.Area, $_.Scope, $_.Finding }
    ```

    Expected output:

    ```text
    Option 6   10.1.5.0  Hands out resolvers that aren't approved: 203.0.113.53 (set on the server)
    Option 15  10.1.5.0  Domain branch.contoso.example is not a zone on the agency's DNS servers
    Option 6   10.1.7.0  Hands out resolvers that aren't approved: 203.0.113.53 (set on the server)
    Option 252 10.1.7.0  WPAD set by DHCP: http://wpad.oldvendor.example/wpad.dat; confirm or remove
    Option 6   10.1.5.0  The servers of one scope hand out different resolvers
    ```

    The unapproved resolver is set on `dhcp02` itself, so it reaches every scope there: one change fixes both. Half the branch's clients get it, depending on which failover partner answers, which is why Chapter 05 asks for the same values on every server. And the guest scope's WPAD URL points at a vendor Module 2 found the agency no longer uses.

4. **Read the failover and registration findings.**

    ```powershell
    $edge.Findings | Where-Object Area -in 'Failover', 'Registration' | ForEach-Object { '{0,-12} {1,-46} {2,-9} {3}' -f $_.Area, $_.Server, $_.Scope, $_.Finding }
    ```

    Expected output:

    ```text
    Registration dhcp02.contoso.example                                   No dedicated DNS registration account: it registers with its own computer account
    Registration dhcp02.contoso.example                                   Name protection off: an update can overwrite a name another client holds
    Failover     dhcp01.contoso.example                         10.0.5.0  In no failover relationship: one server leases it
    Failover     dhcp01.contoso.example                         10.0.6.0  In no failover relationship: one server leases it
    Registration dhcp01.contoso.example, dhcp02.contoso.example 10.1.5.0  Failover partners register with different accounts, so one can't update the names the other registered
    Failover     dhcp02.contoso.example                         10.1.7.0  In no failover relationship: one server leases it
    ```

    `dhcp01` registers with `CONTOSO\svc-dhcp-dns`, `dhcp02` with its own computer account. When `dhcp01` fails, `dhcp02` takes over its branch leases but can't update the names `dhcp01` registered: [Chapter 04](../../books/b08-ddi/04-active-directory-dns-departure.md#secure-dynamic-updates-and-the-dhcp-server)'s case, and the reason both partners must use the same account.

5. **Read what the switches saw,** and the server nobody authorized.

    ```powershell
    Import-Csv tests/fixtures/ddi/observed-dhcp-servers.csv | Format-Table
    $edge.Findings | Where-Object Area -eq 'Rogue DHCP' | Format-List Server, Finding, Book08
    ```

    Expected output:

    ```text
    Address    SeenOn     Where
    -------    ------     -----
    10.0.0.30  2026-11-19 hq-dist-01 DHCP snooping bindings
    10.1.0.30  2026-11-19 br-dist-01 DHCP snooping bindings
    10.0.5.254 2026-11-19 hq-acc-03 Gi1/0/14 DHCP snooping drop

    Server  : 10.0.5.254
    Finding : Answers DHCP but isn't authorized: hq-acc-03 Gi1/0/14 DHCP snooping drop
    Book08  : Chapter 05, What the Windows controls do and don't cover
    ```

    Something on a headquarters wall port answers DHCP. DHCP snooping dropped it, which is the control working; the finding is for the network team to find the device. Without snooping on that switch, it would have leased addresses and handed out its own resolver.

6. **Write the findings, as the evidence for this check.**

    ```powershell
    $w = Test-FMPDhcpEdge -Path tests/fixtures/ddi/run-2026-11-20/contoso.example -ApprovedResolver 10.0.0.10, 10.0.0.11, 10.1.0.10 -ObservedDhcpServerPath tests/fixtures/ddi/observed-dhcp-servers.csv -OutputPath out
    $w.Written | Resolve-Path -Relative
    Import-Csv out/contoso.example/DDI/DhcpEdge.csv | Measure-Object | Select-Object Count
    ```

    Expected output (on Linux or macOS the path uses `/`):

    ```text
    .\out\contoso.example\DDI\DhcpEdge.csv

    Count
    -----
       12
    ```

Clean up:

```powershell
Remove-Item -Recurse -Force out
```

## Exercise: Lab 2, your test domain (25 minutes) {#ddi-m3-lab-2}

You add a guest scope that hands out a resolver the agency doesn't run, collect the DHCP server again, and check it; then you read the server's encrypted DNS client list. You need the test domain of [Module 1](01-read-the-naming-plane.md)'s Lab 2: `fmp-lab-dc01` in `lab.contoso.example`, with the kit in `C:\fmp-lab\start-kit`. Work there, in Windows PowerShell, signed in as `LAB\Administrator`. *The authors didn't run these steps.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
# Step 1: Add a guest scope that hands out an unapproved resolver
Add-DhcpServerv4Scope -Name 'Lab guest' -StartRange 10.50.1.100 -EndRange 10.50.1.200 -SubnetMask 255.255.255.0 -State Active
Set-DhcpServerv4OptionValue -ScopeId 10.50.1.0 -DnsServer 203.0.113.53 -Force

# Step 2: Collect the DNS and DHCP files again
Set-Location C:\fmp-lab\start-kit
Import-Module .\powershell\FMPADAssessment\FMPADAssessment.psd1
Get-FMPDNSAssessment -OutputPath C:\fmp-lab\run2
Get-FMPDHCPInventory -OutputPath C:\fmp-lab\run2 | Format-List ServerCount, ScopeCount

# Step 3: Run the edge check
Import-Module .\powershell\FMPDdiReadiness\FMPDdiReadiness.psd1
$edge = Test-FMPDhcpEdge -Path C:\fmp-lab\run2\lab.contoso.example -ApprovedResolver 10.50.0.10
$edge.Scopes | Format-Table Server, ScopeId, DnsServers, Domain
$edge.Findings | Format-Table Area, Scope, Finding -Wrap

# Step 4: Read the server's encrypted DNS client list
Get-DnsClientDohServerAddress | Format-Table ServerAddress, DohTemplate, AllowFallbackToUdp, AutoUpgrade

# After the steps
Remove-DhcpServerv4Scope -ScopeId 10.50.1.0 -Force
Remove-Item -Recurse -Force C:\fmp-lab\run2
```

:::

<!-- labs:end -->

1. **Add a guest scope that hands out an unapproved resolver.** `-Force` skips the check that the resolver answers, because `203.0.113.53` is a documentation address that never will.

    ```powershell
    Add-DhcpServerv4Scope -Name 'Lab guest' -StartRange 10.50.1.100 -EndRange 10.50.1.200 -SubnetMask 255.255.255.0 -State Active
    Set-DhcpServerv4OptionValue -ScopeId 10.50.1.0 -DnsServer 203.0.113.53 -Force
    ```

2. **Collect the DNS and DHCP files again,** into a new run.

    ```powershell
    Set-Location C:\fmp-lab\start-kit
    Import-Module .\powershell\FMPADAssessment\FMPADAssessment.psd1
    Get-FMPDNSAssessment -OutputPath C:\fmp-lab\run2
    Get-FMPDHCPInventory -OutputPath C:\fmp-lab\run2 | Format-List ServerCount, ScopeCount
    ```

    Expected result: one server, two scopes.

3. **Run the edge check,** with the test domain's one resolver as the only approved one.

    ```powershell
    Import-Module .\powershell\FMPDdiReadiness\FMPDdiReadiness.psd1
    $edge = Test-FMPDhcpEdge -Path C:\fmp-lab\run2\lab.contoso.example -ApprovedResolver 10.50.0.10
    $edge.Scopes | Format-Table Server, ScopeId, DnsServers, Domain
    $edge.Findings | Format-Table Area, Scope, Finding -Wrap
    ```

    Expected result: the guest scope `10.50.1.0` hands out `203.0.113.53`, set on the scope; both scopes are in no failover relationship; the server has no dedicated registration account, and name protection is off. Those last two are Windows Server's defaults, which is why Chapter 04 asks for a decision on each.

4. **Read the server's encrypted DNS client list.** On Windows Server 2022 or later:

    ```powershell
    Get-DnsClientDohServerAddress | Format-Table ServerAddress, DohTemplate, AllowFallbackToUdp, AutoUpgrade
    ```

    Expected result: the public resolvers Windows ships with, and not `10.50.0.10`. A Windows client uses DoH only with a server on this list, so until the agency adds its own resolvers, DoH can only go to a public one. On Windows Server 2019 the command isn't found: that DNS client has no DoH.

**Back it out.** Remove the guest scope and the second run:

```powershell
Remove-DhcpServerv4Scope -ScopeId 10.50.1.0 -Force
Remove-Item -Recurse -Force C:\fmp-lab\run2
```

## Knowledge check (5 minutes) {#ddi-m3-check}

1. A Windows DHCP server is authorized in AD. Does that stop a rogue DHCP server on the same subnet?
    a. Yes: unauthorized DHCP servers can't lease in a domain.
    b. No: authorization is a check a Windows DHCP server makes on itself; a rogue appliance, a home router or malware never checks. DHCP snooping on the access switches stops those.
    c. Only if name protection is on.

2. Which DNS transport can the network neither see nor redirect, so that endpoint and browser policy have to govern it?
    a. Plain DNS on UDP 53.
    b. DNS over TLS on TCP 853.
    c. DNS over HTTPS on TCP 443.

3. Two failover partners serve one scope. One hands out the approved resolvers; the other adds a public one. Why does Chapter 05 treat that as a finding even though half the clients are fine?
    a. Because which resolver a client gets depends on which partner answered, so policy applies unevenly; options should be set once and be the same on every server.
    b. Because failover doesn't work with two resolvers.
    c. It isn't a finding.

4. In Lab 1, the unapproved resolver is "set on the server". What does that tell the DHCP team?
    a. Only the branch scope needs fixing.
    b. The value is a server option, so it reaches every scope on that server that doesn't set its own: one change fixes both findings.
    c. The scope options can't be read.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See Unit 1 and [Chapter 05, What the Windows controls do and don't cover](../../books/b08-ddi/05-edge-interception-and-bypass.md#what-the-windows-controls-do-and-dont-cover).
2. **c.** See Unit 2 and [Chapter 05](../../books/b08-ddi/05-edge-interception-and-bypass.md#what-the-network-can-and-cant-block).
3. **a.** See Unit 1 and Lab 1, step 3.
4. **b.** See Unit 3 and Lab 1, step 3.
:::

## Summary (2 minutes) {#ddi-m3-summary}

You saw how option 6 and rogue DHCP decide which resolver a client uses, what AD authorization doesn't stop, and why encrypted DNS has to end at the agency's resolvers through endpoint and browser policy; then you checked a domain's DHCP servers for unapproved resolvers, options, failover, registration settings and a server nobody authorized. **Evidence an ISSO keeps from this module:** `DhcpEdge.csv` with the run and the approved resolver list it was checked against, the network team's snooping export, and Chapter 05's endpoint and browser policy exports.

::: {.callout-tip}
## Continue the path
[Learning path](index.md) · [← Module 2, The Active Directory DNS departure](02-the-active-directory-dns-departure.md) · [Next: Module 4, Cloud private DNS and one address plan →](04-cloud-private-dns-and-one-address-plan.md)
:::
