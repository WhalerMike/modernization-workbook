---
title: "Module 6: Operate the control plane with evidence"
description: "Book 08, Chapters 09 and 11 and Appendix B: who decides and who does the work for DNS, DHCP and IPAM, scoped delegation for divisions, the logs M-26-14 asks for, and Chapter 11's evidence checklist in its five kinds, with what the Start Kit produces and what must come from the platform and the SOC. Lab 1 runs every check of the path into one evidence folder and indexes it with Get-FMPDdiEvidenceIndex, hashes and all; Lab 2 indexes your test domain's evidence and reads who holds DnsAdmins. About 50 minutes, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 08"
series-order: 6
review-status: pending
---
# Module 6: Operate the control plane with evidence {.unnumbered}

*Part of the [DNS, DHCP and IPAM learning path](index.md). Book 08, [Chapter 09](../../books/b08-ddi/09-who-owns-dns.md), [Chapter 11](../../books/b08-ddi/11-operating-the-control-plane.md) and [Appendix B](../../books/b08-ddi/appendix-b-requirements-mapping.md). About 50 minutes.*

## Introduction (3 minutes) {#ddi-m6-introduction}

Once authority has moved, the naming plane is run, not migrated: divisions change their own records within their scope, the SOC watches the query logs, and the ISSO needs evidence that the controls hold, every month, not once. Book 08's Chapter 09 says who decides and who does the work; Chapter 11 says what the plane must log and what evidence it must produce.

In this module you learn the roles and the evidence checklist, then you gather every check this path has run into one evidence folder and index it, so an ISSO can trace each file to the requirement it supports and check that it hasn't changed. In Lab 2 you index your test domain's evidence and read one of the privileged memberships Chapter 11 asks to justify.

**The federal requirement.** [Appendix B](../../books/b08-ddi/appendix-b-requirements-mapping.md#requirements-mapping) maps the name layer's requirements; this module is about keeping the evidence for them.

| Requirement | KSI | Evidence |
|---|---|---|
| CA-7: continuous monitoring | KSI-MLA-EVC | The evidence index, run on a schedule, with each file's hash |
| CM-8: the component inventory, reviewed and updated | KSI-PIY-GIV | The inventory, address plan and DHCP files in the index, dated |
| OMB M-26-14: logs that are searchable for six months and retrievable for a year | None in the workbook's verified pairings | The query, lease and change logs, from the platform and the SIEM, not the kit |
| AU-2, AU-6, AU-12, AC-2, AC-6: logged, reviewed, least-privilege administration | None in the workbook's verified pairings | The change and role audit trails; DnsAdmins and each division's scope, justified |

KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its own evidence up with them. The steps *support* these controls; the assessor decides whether each is satisfied.

## Learning objectives (1 minute) {#ddi-m6-objectives}

After this module, you'll be able to:

- say who decides and who does the work for DNS, DHCP and IPAM, and why the difference matters for name changes;
- describe scoped delegation for divisions, and the roles the help desk and automation accounts hold;
- name the logs M-26-14's baseline needs from the naming plane, and their retention;
- sort Chapter 11's evidence checklist into its five kinds, say which items the Start Kit produces, and build and check an evidence index.

## Prerequisites (1 minute) {#ddi-m6-prerequisites}

- Modules [2](02-the-active-directory-dns-departure.md) to [5](05-move-authority-zone-by-zone.md): this module's Lab 1 runs their checks again.
- Windows PowerShell 5.1 or PowerShell 7, and the Start Kit's folder `examples/start-kit`.

## Unit 1: Who decides, who does the work (8 minutes) {#ddi-m6-unit-1}

Read Book 08, [Chapter 09](../../books/b08-ddi/09-who-owns-dns.md), sections *Decision rights and work are different things* and *The roles*, then [Chapter 11, Delegated administration across divisions](../../books/b08-ddi/11-operating-the-control-plane.md#delegated-administration-across-divisions). Three points to take away:

- **Name changes are risk decisions in disguise.** Pointing a branch's redirect-dns at a public resolver turns off Protective DNS for that branch; the person who can make the change in a console usually isn't the person accountable for it. Chapter 09 separates who decides, who does and who is consulted.
- **Each team owns its layer.** Network engineering owns the edge and the switch controls Module 3 relies on; the DNS/DDI team owns the policy plane, its forwarding rules, IPAM and DHCP; Active Directory administrators own AD DNS, and DnsAdmins, until they're retired; cloud platform teams publish what the policy plane holds, not their own copies.
- **Divisions get scopes, not the whole plane.** Corporate administrators see everything; each division's people and automation accounts see and change only their own zones, address blocks and scopes, and the help desk holds a read-only auditor role. One audit trail covers them all.

## Unit 2: What the plane must log (7 minutes) {#ddi-m6-unit-2}

Read [Chapter 11, Monitoring and telemetry](../../books/b08-ddi/11-operating-the-control-plane.md#monitoring-and-telemetry), its first two subsections. M-26-14 rescinded M-21-31 and names neither DNS nor DHCP; its baseline asks for logs that can determine source and destination network addresses and the identity behind each operation, actively searchable for six months and retrievable for a year. For the naming plane that means query logs (with the policy action), DHCP lease history so every query ties to a device, and the change and role audit trail. Each cloud logs in its own format to its own store, and two of them leave cached answers out ([Module 4](04-cloud-private-dns-and-one-address-plan.md)), so each one is collected separately.

None of these logs comes from the Start Kit. They are the platform's and the SIEM's, and the evidence index says so.

## Unit 3: The evidence checklist (8 minutes) {#ddi-m6-unit-3}

Read [Chapter 11, Compliance evidence and Sample evidence checklist](../../books/b08-ddi/11-operating-the-control-plane.md#compliance-evidence). The checklist sorts its items into Book 00's five kinds of evidence. The Start Kit's `Get-FMPDdiEvidenceIndex` walks an evidence folder, recognizes each file this path's checks wrote, and gives each its kind, the requirement it supports, its KSI where the workbook has a verified pairing, the Book 08 section that asks for it, its size and its SHA-256:

| The kit's file | Kind | Supports |
|---|---|---|
| The DNS and DHCP inventory files | Configuration | CM-8, SC-22 |
| `DepartureRegister.csv` and `.json` | Configuration | CM-3, CM-8 |
| `DhcpEdge.csv` | Configuration | M-22-09 and Protective DNS (option 6); CM-8 (unauthorized DHCP servers) |
| `AddressPlan.csv` and `AddressPlanFindings.csv` | Operational | CM-8, BOD 23-01 |
| The `srv-checks` history | Operational | SC-22 |
| `DecommissionGate.csv` | Test | CM-3, CP-2 |

: What Get-FMPDdiEvidenceIndex recognizes {.striped .hover}

A file it doesn't recognize is listed as Unrecognized, never dropped. And it lists, for each kind, what the checklist asks for that the kit can't produce: the running configuration behind the five decisions, the logs, the Phase 4 validation matrix, the exceptions with their approvers, and the control mapping. The platform that holds those is the agency's choice ([Chapter 12](../../books/b08-ddi/12-selection-cost-and-residual-risk.md)); [Implementing Book 08 on Infoblox NIOS](../../books/guides/infoblox-nios-implementation.md) is one build, and [Infoblox Training and Learning Paths](../infoblox-training.md) the vendor's courses for it.

## Exercise: Lab 1, fixtures, no server (20 minutes) {#ddi-m6-lab-1}

You run every check of Modules 2 to 5 again into one evidence folder, index it, and check one file the way an ISSO would. Work in `examples/start-kit`, in Windows PowerShell 5.1 or PowerShell 7. The inputs are the fixtures the earlier labs used.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/start-kit`. Each step below says what it does and what to look for.

```powershell
# Step 1: Start the evidence folder
Import-Module ./powershell/FMPDdiReadiness/FMPDdiReadiness.psd1
New-Item -ItemType Directory -Force out/evidence | Out-Null
Copy-Item -Recurse tests/fixtures/ddi/run-2026-11-20 out/evidence/
Copy-Item -Recurse tests/fixtures/ddi/gate/srv-checks out/evidence/
(Get-ChildItem -Recurse -File out/evidence).Count

# Step 2: Run the four checks into it
$run = 'tests/fixtures/ddi/run-2026-11-20/contoso.example'
$null = Get-FMPDnsDepartureRegister -Path $run -OutputPath out/evidence
$null = Test-FMPDhcpEdge -Path $run -ApprovedResolver 10.0.0.10, 10.0.0.11, 10.1.0.10 -ObservedDhcpServerPath tests/fixtures/ddi/observed-dhcp-servers.csv -OutputPath out/evidence
$null = Test-FMPAddressPlan -IpamPath tests/fixtures/ddi/ipam/ipam-allocations.csv -Path $run -AzureVnetPath tests/fixtures/ddi/ipam/azure-vnets.json -AwsVpcPath tests/fixtures/ddi/ipam/aws-vpcs.json -OciVcnPath tests/fixtures/ddi/ipam/oci-vcns.json -OutputPath out/evidence
$null = Test-FMPDdiDecommissionGate -Path $run -TargetInventoryPath tests/fixtures/ddi/gate/target-inventory.csv -SrvCheckPath tests/fixtures/ddi/gate/srv-checks -IntervalMinutes 60 -ParallelStart 2026-08-01 -FailoverTestPath tests/fixtures/ddi/gate/failover-tests.csv -LegacyQueryPath tests/fixtures/ddi/gate/legacy-queries.csv -AsOf 2026-11-20 -OutputPath out/evidence
(Get-ChildItem -Recurse -File out/evidence).Count

# Step 3: Index the folder
$index = Get-FMPDdiEvidenceIndex -Path out/evidence -OutputPath out/index
$index.Files | Format-Table File, Kind, KSI

# Step 4: Read one entry in full
$index.Files | Where-Object File -like '*DecommissionGate.csv' | Format-List File, Kind, Supports, KSI, Book08

# Step 5: Check a file the way the ISSO would
$row = $index.Files | Where-Object File -like '*DhcpEdge.csv'
(Get-FileHash -Algorithm SHA256 (Join-Path out/evidence $row.File)).Hash.ToLowerInvariant() -eq $row.SHA256

# Step 6: Read what the kit doesn't produce
$index.NotFromTheKit | ForEach-Object { '{0}: {1}' -f $_.Kind, $_.NotFromTheKit }

# Step 7: See what the index wrote
Get-ChildItem -File out/index | Select-Object Name

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Start the evidence folder** with the Phase 1 run and the locator record checks.

    ```powershell
    Import-Module ./powershell/FMPDdiReadiness/FMPDdiReadiness.psd1
    New-Item -ItemType Directory -Force out/evidence | Out-Null
    Copy-Item -Recurse tests/fixtures/ddi/run-2026-11-20 out/evidence/
    Copy-Item -Recurse tests/fixtures/ddi/gate/srv-checks out/evidence/
    (Get-ChildItem -Recurse -File out/evidence).Count
    ```

    Expected output:

    ```text
    7
    ```

2. **Run the four checks into it.**

    ```powershell
    $run = 'tests/fixtures/ddi/run-2026-11-20/contoso.example'
    $null = Get-FMPDnsDepartureRegister -Path $run -OutputPath out/evidence
    $null = Test-FMPDhcpEdge -Path $run -ApprovedResolver 10.0.0.10, 10.0.0.11, 10.1.0.10 -ObservedDhcpServerPath tests/fixtures/ddi/observed-dhcp-servers.csv -OutputPath out/evidence
    $null = Test-FMPAddressPlan -IpamPath tests/fixtures/ddi/ipam/ipam-allocations.csv -Path $run -AzureVnetPath tests/fixtures/ddi/ipam/azure-vnets.json -AwsVpcPath tests/fixtures/ddi/ipam/aws-vpcs.json -OciVcnPath tests/fixtures/ddi/ipam/oci-vcns.json -OutputPath out/evidence
    $null = Test-FMPDdiDecommissionGate -Path $run -TargetInventoryPath tests/fixtures/ddi/gate/target-inventory.csv -SrvCheckPath tests/fixtures/ddi/gate/srv-checks -IntervalMinutes 60 -ParallelStart 2026-08-01 -FailoverTestPath tests/fixtures/ddi/gate/failover-tests.csv -LegacyQueryPath tests/fixtures/ddi/gate/legacy-queries.csv -AsOf 2026-11-20 -OutputPath out/evidence
    (Get-ChildItem -Recurse -File out/evidence).Count
    ```

    Expected output:

    ```text
    13
    ```

3. **Index the folder.**

    ```powershell
    $index = Get-FMPDdiEvidenceIndex -Path out/evidence -OutputPath out/index
    $index.Files | Format-Table File, Kind, KSI
    ```

    Expected output:

    ```text
    File                                                       Kind          KSI
    ----                                                       ----          ---
    address-plan/AddressPlan.csv                               Operational   KSI-PIY-GIV
    address-plan/AddressPlanFindings.csv                       Operational   KSI-PIY-GIV
    contoso.example/DDI/DecommissionGate.csv                   Test          KSI-CMT-LMC, KSI-RPL-ARP
    contoso.example/DDI/DepartureRegister.csv                  Configuration KSI-CMT-LMC, KSI-PIY-GIV
    contoso.example/DDI/DepartureRegister.json                 Configuration KSI-CMT-LMC, KSI-PIY-GIV
    contoso.example/DDI/DhcpEdge.csv                           Configuration KSI-PIY-GIV
    run-2026-11-20/contoso.example/DHCP/DHCPInventory.json     Configuration KSI-PIY-GIV
    run-2026-11-20/contoso.example/DNS/DNSHealthReport.json    Configuration KSI-PIY-GIV
    run-2026-11-20/contoso.example/DNS/DNSInventory.json       Configuration KSI-PIY-GIV
    run-2026-11-20/contoso.example/DNS/DNSRecordInventory.json Configuration KSI-PIY-GIV
    srv-checks/azure-hub.csv                                   Operational   None
    srv-checks/branch.csv                                      Operational   None
    srv-checks/hq-dc.csv                                       Operational   None
    ```

    Every file is recognized. The locator record history supports SC-22, which has no KSI pairing the workbook has verified, so its KSI says None rather than a guess.

4. **Read one entry in full.**

    ```powershell
    $index.Files | Where-Object File -like '*DecommissionGate.csv' | Format-List File, Kind, Supports, KSI, Book08
    ```

    Expected output:

    ```text
    File     : contoso.example/DDI/DecommissionGate.csv
    Kind     : Test
    Supports : CM-3, CP-2: the Phase 5 gates
    KSI      : KSI-CMT-LMC, KSI-RPL-ARP
    Book08   : Chapter 10, Phase 5
    ```

5. **Check a file the way the ISSO would:** hash it again and compare.

    ```powershell
    $row = $index.Files | Where-Object File -like '*DhcpEdge.csv'
    (Get-FileHash -Algorithm SHA256 (Join-Path out/evidence $row.File)).Hash.ToLowerInvariant() -eq $row.SHA256
    ```

    Expected output:

    ```text
    True
    ```

    A file changed after it was indexed prints `False`. The hashes themselves aren't shown here: two of the files record the folder they were made in, so their hashes differ from one machine to the next.

6. **Read what the kit doesn't produce.**

    ```powershell
    $index.NotFromTheKit | ForEach-Object { '{0}: {1}' -f $_.Kind, $_.NotFromTheKit }
    ```

    Expected output:

    ```text
    Configuration: Decisions 1 to 5 as running configuration; Protective DNS and encrypted DNS settings; delegated roles and scopes
    Operational: Query, lease and change logs at M-26-14 retention; anomaly reports with their tickets
    Test: The Phase 4 validation matrix from every origin; the resolution-path consistency test
    Exception: Unsigned internal zones, retired zones and privileged memberships kept by justification, each with its approver
    Assessor-ready artifact: The control mapping in Chapter 03 and Appendix B, each row pointing at the evidence
    ```

    This is the rest of Chapter 11's checklist: the platform's running configuration and logs, the tests from every origin, the exceptions' approvals, and the mapping that ties them together. An evidence package that holds only the kit's files is incomplete, and the index says so.

7. **See what the index wrote.**

    ```powershell
    Get-ChildItem -File out/index | Select-Object Name
    ```

    Expected output:

    ```text
    Name
    ----
    EvidenceIndex.csv
    EvidenceIndex.json
    ```

Clean up:

```powershell
Remove-Item -Recurse -Force out
```

## Exercise: Lab 2, your test domain (15 minutes) {#ddi-m6-lab-2}

You index the evidence your earlier Lab 2s left, and read the DnsAdmins membership Chapter 11's checklist asks to justify. You need the test domain of [Module 1](01-read-the-naming-plane.md)'s Lab 2, `fmp-lab-dc01` in `lab.contoso.example`, with whichever of `C:\fmp-lab\run1`, `C:\fmp-lab\ddi` and `C:\fmp-lab\gate` you kept. Work there, in Windows PowerShell, signed in as `LAB\Administrator`. *The authors didn't run these steps.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
# Step 1: Gather the evidence into one folder
New-Item -ItemType Directory -Force C:\fmp-lab\evidence | Out-Null
'run1', 'ddi', 'gate' | Where-Object { Test-Path "C:\fmp-lab\$_" } | ForEach-Object { Copy-Item -Recurse "C:\fmp-lab\$_" C:\fmp-lab\evidence\ }

# Step 2: Index it
Set-Location C:\fmp-lab\start-kit
Import-Module .\powershell\FMPDdiReadiness\FMPDdiReadiness.psd1
$index = Get-FMPDdiEvidenceIndex -Path C:\fmp-lab\evidence -OutputPath C:\fmp-lab\evidence-index
$index.Files | Format-Table File, Kind, KSI

# Step 3: Read who holds DnsAdmins
Get-ADGroupMember -Identity DnsAdmins | Format-Table Name, objectClass

# After the steps
Remove-Item -Recurse -Force C:\fmp-lab\evidence, C:\fmp-lab\evidence-index
```

:::

<!-- labs:end -->

1. **Gather the evidence into one folder.**

    ```powershell
    New-Item -ItemType Directory -Force C:\fmp-lab\evidence | Out-Null
    'run1', 'ddi', 'gate' | Where-Object { Test-Path "C:\fmp-lab\$_" } | ForEach-Object { Copy-Item -Recurse "C:\fmp-lab\$_" C:\fmp-lab\evidence\ }
    ```

2. **Index it.**

    ```powershell
    Set-Location C:\fmp-lab\start-kit
    Import-Module .\powershell\FMPDdiReadiness\FMPDdiReadiness.psd1
    $index = Get-FMPDdiEvidenceIndex -Path C:\fmp-lab\evidence -OutputPath C:\fmp-lab\evidence-index
    $index.Files | Format-Table File, Kind, KSI
    ```

    Expected result: the inventory files as Configuration, the register as Configuration, the locator checks as Operational. A run folder also holds files this path didn't write, such as `DHCPScopes.csv`, which the index recognizes, and anything else as Unrecognized.

3. **Read who holds DnsAdmins.** Chapter 11's checklist asks for DnsAdmins and its equivalents justified; Chapter 09 gives Active Directory administrators the membership to watch.

    ```powershell
    Get-ADGroupMember -Identity DnsAdmins | Format-Table Name, objectClass
    ```

    Expected result: no members in a new domain. Each member a real domain has is a line in the exception evidence, with its justification and approver.

**Back it out.** Delete the copies and the index:

```powershell
Remove-Item -Recurse -Force C:\fmp-lab\evidence, C:\fmp-lab\evidence-index
```

When you've finished the path, restore the virtual machine's checkpoint as [Module 1](01-read-the-naming-plane.md#ddi-m1-lab-2) describes.

## Knowledge check (5 minutes) {#ddi-m6-check}

1. A network engineer can change a branch's redirect-dns target in the SD-WAN console. Who decides whether it may point at a SASE resolver directly?
    a. The network engineer, because they make the change.
    b. Chapter 09 separates deciding from doing: the change turns off agency policy for the branch, so it is a control decision for the CISO and ISSO, with the DNS/DDI team consulted; Chapter 08's Decision 2 says the SASE resolver is a forwarding target, never the redirect target.
    c. The SASE vendor.

2. Which logs does M-26-14's baseline need from the naming plane, and for how long?
    a. None: M-26-14 doesn't name DNS.
    b. Logs that can determine source and destination addresses and the identity behind each operation, which for the naming plane means query logs, DHCP lease history and the change audit trail, searchable for six months and retrievable for a year.
    c. Only DNSSEC key rollovers, for 30 months.

3. The evidence index lists the locator record history's KSI as None. Why?
    a. It's a bug.
    b. The history supports SC-22, and the workbook has no verified KSI pairing for SC-22, so it says None rather than guess.
    c. KSIs don't apply to DNS.

4. An evidence package holds every file the kit wrote, all recognized and hashed. Is it complete?
    a. Yes.
    b. No: Chapter 11's checklist also asks for the running configuration behind the five decisions, the logs, the Phase 4 validation matrix, the exceptions with approvers and the control mapping, which come from the platform and the SOC, as the index's NotFromTheKit list says.
    c. Only if the hashes match.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See Unit 1, [Chapter 09](../../books/b08-ddi/09-who-owns-dns.md#decision-rights-and-work-are-different-things) and [Chapter 08, Decision 2](../../books/b08-ddi/08-reference-architecture.md#decision-2-forwarding-chain-order).
2. **b.** See Unit 2 and [Chapter 11](../../books/b08-ddi/11-operating-the-control-plane.md#monitoring-and-telemetry).
3. **b.** See Lab 1, step 3.
4. **b.** See Unit 3 and Lab 1, step 6.
:::

## Summary (2 minutes) {#ddi-m6-summary}

You saw who decides and who does the work for the naming plane, how divisions get scopes, what M-26-14's baseline needs logged, and Chapter 11's evidence checklist in its five kinds; then you gathered every check of the path into one folder, indexed and verified it, and read what the platform and the SOC must add. **Evidence an ISSO keeps from this module:** `EvidenceIndex.csv` and `EvidenceIndex.json` with the folder they index, run on a schedule, and the platform's and SIEM's evidence for the items the index lists as not from the kit.

::: {.callout-tip}
## Continue the path
[Learning path](index.md) · [← Module 5, Move authority zone by zone](05-move-authority-zone-by-zone.md)
:::
