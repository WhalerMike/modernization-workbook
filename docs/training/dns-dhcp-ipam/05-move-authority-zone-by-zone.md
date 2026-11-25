---
title: "Module 5: Move authority zone by zone"
description: "Book 08, Chapter 10's Phases 2 to 5, Chapter 08's five decisions and the signed-zone rule: the cutover loop every move repeats, the three cutover patterns and their rollbacks, why decommissioning is gated rather than scheduled, and the five gates it must pass. Lab 1 runs the Start Kit's Test-FMPDdiDecommissionGate on a fictional domain's target inventory, a month of locator record checks from three places, a failover record and a legacy query summary; Lab 2 schedules Test-FMPLocatorResolution in your test domain, breaks and restores a locator record, and reads the gate. About 60 minutes, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 08"
series-order: 5
review-status: approved
reviewed-sha256: 50921849d31d017dbcb55bb23c8749da2ef6d240ba236f892e621c59c64d5bba
last-reviewed: 2026-11-25
---
# Module 5: Move authority zone by zone {.unnumbered}

*Part of the [DNS, DHCP and IPAM learning path](index.md). Book 08, [Chapter 10](../../books/b08-ddi/10-migration-sequence.md), Phases 2 to 5, and [Chapter 08](../../books/b08-ddi/08-reference-architecture.md)'s five decisions. About 60 minutes.*

## Introduction (3 minutes) {#ddi-m5-introduction}

Moving DNS authority is a long series of small, reversible changes: one zone, one forwarder, one DHCP scope, one wave of clients, each with the old authority still answering until the new one is proven. The one step that can't be cheaply reversed is the last: decommissioning AD DNS and DHCP. Book 08 gates it rather than scheduling it, with five gates that must all pass.

In this module you learn the loop every move repeats and the checks that keep each move reversible, then you run the five gates on a fictional domain's evidence and see why it isn't ready. In Lab 2 you build the evidence for one gate in your test domain: a locator record check every 15 minutes, a failure you cause, and the clock that restarts after it.

**The federal requirement.** Every move is a planned, tested change with a way back; the gates are the test before the change that can't be undone.

| Requirement | KSI | Evidence |
|---|---|---|
| CM-3: changes tested, approved and documented before they're made | KSI-CMT-LMC, KSI-CMT-RVP | Each move's change record with its validation from every origin; `DecommissionGate.csv` before the decommissioning change is approved |
| CP-2: a contingency plan | KSI-RPL-ARP | The rollback point for each move, and the failover tests of gate 4 |
| SC-22: fault-tolerant name resolution | None in the workbook's verified pairings | The locator record checks from every location, for 30 days |
| SC-20, SC-21: signed answers, validated | None in the workbook's verified pairings | Each signed zone's new chain of trust validating before it counts as moved |

KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its own evidence up with them. The steps *support* these controls; the assessor decides whether each is satisfied.

## Learning objectives (1 minute) {#ddi-m5-objectives}

After this module, you'll be able to:

- run the cutover loop for one zone, and say where its rollback point is;
- choose between split horizon, subdomain delegation and progressive migration with forwarding, and say how each rolls back;
- explain the signed-zone rule and the locator zone's rule, and why both hold the decommissioning gate;
- name Chapter 10's five Phase 5 gates, read each one's result from the evidence, and say when the SRV clock restarts.

## Prerequisites (1 minute) {#ddi-m5-prerequisites}

- [Module 2](02-the-active-directory-dns-departure.md): the departure register.
- Windows PowerShell 5.1 or PowerShell 7, and the Start Kit's folder `examples/start-kit`.

## Unit 1: The cutover loop (10 minutes) {#ddi-m5-unit-1}

Read Book 08, [Chapter 10](../../books/b08-ddi/10-migration-sequence.md), sections *The six phases*, *The cutover loop every phase repeats* and *Phase 3 — Migrate authority* up to *GlobalNames and reverse zones*. Every move of authority runs the same six steps: lower the TTL ahead of the change; export, transform and import with a dry run first (never the SOA, the apex NS or the locator records); validate from every origin, forward and reverse; switch authority; hold and observe; restore the TTL and close the change with its evidence. A failed check at validation or while observing sends the change back to the rollback point, where the old authority, still intact, answers again.

| Pattern | Use it when | Rollback |
|---|---|---|
| Split horizon | A name must answer privately inside and publicly outside | Withdraw the private view |
| Subdomain delegation | A new namespace moves while its parent stays | Remove the delegation and the child zone |
| Progressive migration with conditional forwarding | Whole zones move one at a time | Point the forwarders back at the old copy |

: Chapter 10's three cutover patterns {.striped .hover}

One warning from the chapter changes a rollback plan: removing a virtual network's link to an Azure Private DNS zone, or turning autoregistration off, deletes that link's autoregistered records, and they can't be restored.

## Unit 2: Signed zones and the five decisions (8 minutes) {#ddi-m5-unit-2}

Read [Chapter 08, The end-to-end resolution flow and five decisions](../../books/b08-ddi/08-reference-architecture.md#the-end-to-end-resolution-flow-and-five-decisions). Each decision fails silently, so each has a check against the running configuration:

| Decision | The check |
|---|---|
| 1, the redirect-dns destination | Every branch's redirect-dns target is an agency resolver address |
| 2, the forwarding chain order | The agency resolver is the first hop; any SASE resolver is its forwarding target |
| 3, per-cloud conditional forwarding | One name per private namespace resolves the same from on-premises, each cloud and a branch |
| 4, AD DNS inventory before retirement | The inventory exists, is dated and reconciles before a decommissioning change is approved |
| 5, OCSP and CRL reachability | Every OCSP responder and CRL point resolves, and answers, from every origin |

: Chapter 08's five decisions and their checks {.striped .hover}

Decision 4 is this module's gate 1. Two rules from Chapter 10 apply to it. A signed zone moves by its own sequence: finish any key rollover first, start none while zones move, and keep the old signing until the new chain of trust validates ([Chapter 06](../../books/b08-ddi/06-dns-identity-and-dnssec.md)). And the `_msdcs` zone stays where domain controllers can register in it until the last one goes ([Module 2](02-the-active-directory-dns-departure.md)).

## Unit 3: The five gates (7 minutes) {#ddi-m5-unit-3}

Read [Chapter 10, Phase 5 — Decommission AD DNS and DHCP](../../books/b08-ddi/10-migration-sequence.md#phase-5-decommission-ad-dns-and-dhcp). The Start Kit's `Test-FMPDdiDecommissionGate` reads one input per gate and marks each Pass, Fail, or Not evidenced, which holds the gate like a failure:

| Gate | It reads | It passes when |
|---|---|---|
| 1 The inventory reconciles | The Phase 1 run, and the target inventory (each zone's disposition) | Every zone is moved, retired or stays on AD DNS; nothing in the target is unexplained; signed zones validate; `_msdcs` stays |
| 2 SRV resolution holds | The locator record checks (`Test-FMPLocatorResolution`'s files) | Every location has passed every check for 30 days, with no gap longer than two intervals |
| 3 Parallel operation | The date parallel operation started | It started at least 90 days ago (the program's gate) |
| 4 Failover tested | The failover test record | A passing test for the DNS resolvers and for DHCP, and no failing test |
| 5 The old servers are idle | The legacy query summary | No direct queries in the last 7 days |

: The Phase 5 gates as Test-FMPDdiDecommissionGate reads them {.striped .hover}

Gate 2 is a clock. A failed check or a gap in the checks restarts it, so the result says how many clean days each location has, and since when.

## Exercise: Lab 1, fixtures, no server (25 minutes) {#ddi-m5-lab-1}

You run the five gates for Module 1's fictional domain on November 20, 2026, from its evidence in `tests/fixtures/ddi/gate`: the target inventory, a month of locator record checks from three places (`hq-dc`, `branch` and `azure-hub`), the failover tests and the legacy DNS server's query counts. The fixture's checks are hourly to keep it small, so the lab passes `-IntervalMinutes 60`; the program's interval is 15 minutes, the default.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\start-kit

$Run = "C:\FMWLabs\results\dns-dhcp-ipam-05-move-authority-zone-by-zone\lab1\$((Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHHmmssZ'))"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Read the target inventory
Import-Csv tests/fixtures/ddi/gate/target-inventory.csv | Format-Table Zone, Disposition, ChainValidates

# Step 2: Run the five gates
Import-Module ./powershell/FMPDdiReadiness/FMPDdiReadiness.psd1
$gate = Test-FMPDdiDecommissionGate -Path tests/fixtures/ddi/run-2026-11-20/contoso.example -TargetInventoryPath tests/fixtures/ddi/gate/target-inventory.csv -SrvCheckPath tests/fixtures/ddi/gate/srv-checks -IntervalMinutes 60 -ParallelStart 2026-08-01 -FailoverTestPath tests/fixtures/ddi/gate/failover-tests.csv -LegacyQueryPath tests/fixtures/ddi/gate/legacy-queries.csv -AsOf 2026-11-20
$gate.Passed
$gate.Gates | Format-Table Gate, Name, Status

# Step 3: Read gate 1
($gate.Gates | Where-Object Gate -eq 1).Detail -split '; '

# Step 4: Read gate 2
Import-Csv tests/fixtures/ddi/gate/srv-checks/azure-hub.csv | Where-Object Result -ne 'PASS' | Format-Table Timestamp, Location, Failed
($gate.Gates | Where-Object Gate -eq 2).Detail -split '; '

# Step 5: Read gates 3 to 5
$gate.Gates | Where-Object Gate -ge 3 | ForEach-Object { '{0} {1,-18} {2,-5} {3}' -f $_.Gate, $_.Name, $_.Status, $_.Detail }

# Step 6: Run gate 2 at the program's 15-minute interval
(Test-FMPDdiDecommissionGate -Path tests/fixtures/ddi/run-2026-11-20/contoso.example -SrvCheckPath tests/fixtures/ddi/gate/srv-checks -AsOf 2026-11-20).Gates | Where-Object Gate -eq 2 | ForEach-Object { $_.Detail -split '; ' }

# Step 7: Write the gates, as the evidence for the decommissioning change
$null = Test-FMPDdiDecommissionGate -Path tests/fixtures/ddi/run-2026-11-20/contoso.example -TargetInventoryPath tests/fixtures/ddi/gate/target-inventory.csv -SrvCheckPath tests/fixtures/ddi/gate/srv-checks -IntervalMinutes 60 -ParallelStart 2026-08-01 -FailoverTestPath tests/fixtures/ddi/gate/failover-tests.csv -LegacyQueryPath tests/fixtures/ddi/gate/legacy-queries.csv -AsOf 2026-11-20 -OutputPath "$Run"
Import-Csv "$Run\contoso.example\DDI\DecommissionGate.csv" | Format-Table Gate, Status

# Step 7: Write the gates, as the evidence for the decommissioning change
Get-ChildItem C:\FMWLabs\results\dns-dhcp-ipam-05-move-authority-zone-by-zone\lab1 -Name
```

:::

<!-- labs:end -->

Every step runs in Windows PowerShell 5.1, so you can follow it top to bottom in one window. PowerShell 7 runs the same commands and prints the same results, but with fewer blank lines between them than the output shown here. Open **Windows PowerShell** from the Start menu, then go to the kit's folder, where you unzipped it under [Get the code](index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\start-kit
```

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\dns-dhcp-ipam-05-move-authority-zone-by-zone\lab1\$((Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHHmmssZ'))"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\dns-dhcp-ipam-05-move-authority-zone-by-zone\lab1\<run>
```

The run's date is only the folder's name. The data's date is `-AsOf 2026-11-20`, which stays the same, so every run's output matches this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it.

In Git Bash, `cd /c/FMWLabs/start-kit` reaches the same folder, but every step is a PowerShell command (type `powershell` to start Windows PowerShell there). In a clone of the repository, use the `examples` folder of the same name.

1. **Read the target inventory:** where each zone of the Phase 1 run went.

    ```powershell
    Import-Csv tests/fixtures/ddi/gate/target-inventory.csv | Format-Table Zone, Disposition, ChainValidates
    ```

    Expected output:

    ```text
    Zone                   Disposition  ChainValidates
    ----                   -----------  --------------
    contoso.example        Moved
    _msdcs.contoso.example StaysOnAdDns
    10.in-addr.arpa        Moved
    16.172.in-addr.arpa    Moved
    apps.contoso.example   Moved
    legacy.contoso.example Retired
    partner.example        Moved
    oldvendor.example      Retired
    blob.core.windows.net  Moved
    hr.contoso.example     Moved
    secure.contoso.example Moved        No
    cloud.contoso.example  New
    ```

2. **Run the five gates.**

    ```powershell
    Import-Module ./powershell/FMPDdiReadiness/FMPDdiReadiness.psd1
    $gate = Test-FMPDdiDecommissionGate -Path tests/fixtures/ddi/run-2026-11-20/contoso.example -TargetInventoryPath tests/fixtures/ddi/gate/target-inventory.csv -SrvCheckPath tests/fixtures/ddi/gate/srv-checks -IntervalMinutes 60 -ParallelStart 2026-08-01 -FailoverTestPath tests/fixtures/ddi/gate/failover-tests.csv -LegacyQueryPath tests/fixtures/ddi/gate/legacy-queries.csv -AsOf 2026-11-20
    $gate.Passed
    $gate.Gates | Format-Table Gate, Name, Status
    ```

    Expected output:

    ```text
    False

    Gate Name                 Status
    ---- ----                 ------
       1 Inventory reconciles Fail
       2 SRV resolution holds Fail
       3 Parallel operation   Pass
       4 Failover tested      Pass
       5 Old servers idle     Fail
    ```

    Three gates fail, so AD DNS stays.

3. **Read gate 1.**

    ```powershell
    ($gate.Gates | Where-Object Gate -eq 1).Detail -split '; '
    ```

    Expected output:

    ```text
    GlobalNames: missing from the target
    secure.contoso.example: signed, and the new chain of trust doesn't validate yet
    cloud.contoso.example: in the target, not in the Phase 1 inventory, and not explained
    ```

    Reconciliation runs both ways. A zone nobody accounted for (GlobalNames) would be lost at decommissioning; a zone in the target nobody can explain is drift that started during the migration. The signed zone has moved but still holds the gate until its new chain validates. The `_msdcs` zone isn't here: staying on AD DNS is its correct disposition.

4. **Read gate 2,** and the failure that restarted one location's clock.

    ```powershell
    Import-Csv tests/fixtures/ddi/gate/srv-checks/azure-hub.csv | Where-Object Result -ne 'PASS' | Format-Table Timestamp, Location, Failed
    ($gate.Gates | Where-Object Gate -eq 2).Detail -split '; '
    ```

    Expected output:

    ```text
    Timestamp            Location  Failed
    ---------            --------  ------
    2026-11-02T08:00:00Z azure-hub _kpasswd._tcp.contoso.example


    azure-hub: 17 clean days since a failure at 2026-11-02 08:00Z (_kpasswd._tcp.contoso.example)
    branch: 9 clean days since a 6-hour gap ending 2026-11-10 07:00Z
    hq-dc: clean for 30 days
    ```

    One failed check in 31 days, from Azure, restarts that location's clock: the gate counts consecutive clean days, not a pass rate. The branch's clock restarted after six hours with no checks at all, because a gap is not evidence of success.

5. **Read gates 3 to 5.**

    ```powershell
    $gate.Gates | Where-Object Gate -ge 3 | ForEach-Object { '{0} {1,-18} {2,-5} {3}' -f $_.Gate, $_.Name, $_.Status, $_.Detail }
    ```

    Expected output:

    ```text
    3 Parallel operation Pass  111 days of 90, since 2026-08-01
    4 Failover tested    Pass  2 tests passed
    5 Old servers idle   Fail  dns01.contoso.example: 3 direct queries in the last 7 days
    ```

    Something still queries `dns01` directly, two days ago: a client or an application with a hard-coded resolver. Decommissioning `dns01` now would break it; finding it is the work.

6. **Run gate 2 at the program's 15-minute interval.** The same hourly history, without `-IntervalMinutes`:

    ```powershell
    (Test-FMPDdiDecommissionGate -Path tests/fixtures/ddi/run-2026-11-20/contoso.example -SrvCheckPath tests/fixtures/ddi/gate/srv-checks -AsOf 2026-11-20).Gates | Where-Object Gate -eq 2 | ForEach-Object { $_.Detail -split '; ' }
    ```

    Expected output:

    ```text
    azure-hub: 0 clean days since a 1-hour gap ending 2026-11-20 00:00Z
    branch: 0 clean days since a 1-hour gap ending 2026-11-20 00:00Z
    hq-dc: 0 clean days since a 1-hour gap ending 2026-11-20 00:00Z
    ```

    Checked hourly, every hour is a gap at a 15-minute interval: the history has to be collected at the rate the gate measures.

7. **Write the gates, as the evidence for the decommissioning change.**

    ```powershell
    $null = Test-FMPDdiDecommissionGate -Path tests/fixtures/ddi/run-2026-11-20/contoso.example -TargetInventoryPath tests/fixtures/ddi/gate/target-inventory.csv -SrvCheckPath tests/fixtures/ddi/gate/srv-checks -IntervalMinutes 60 -ParallelStart 2026-08-01 -FailoverTestPath tests/fixtures/ddi/gate/failover-tests.csv -LegacyQueryPath tests/fixtures/ddi/gate/legacy-queries.csv -AsOf 2026-11-20 -OutputPath "$Run"
    Import-Csv "$Run\contoso.example\DDI\DecommissionGate.csv" | Format-Table Gate, Status
    ```

    Expected output:

    ```text
    Gate Status
    ---- ------
    1    Fail
    2    Fail
    3    Pass
    4    Pass
    5    Fail
    ```

    Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

    ```powershell
    Get-ChildItem C:\FMWLabs\results\dns-dhcp-ipam-05-move-authority-zone-by-zone\lab1 -Name
    ```

    Expected output: one line per run, oldest first, the last one this run:

    ```text
    <run>
    ```

## Exercise: Lab 2, your test domain (25 minutes, plus an hour of checks) {#ddi-m5-lab-2}

You schedule the locator record check every 15 minutes on your test domain controller, break one locator record and let the domain controller restore it, and read gate 2. You need the test domain of [Module 1](01-read-the-naming-plane.md)'s Lab 2: `fmp-lab-dc01` in `lab.contoso.example`, with the kit in `C:\fmp-lab\start-kit` and the run in `C:\fmp-lab\run1`. Work in an elevated Windows PowerShell, signed in as `LAB\Administrator`. *The authors didn't run these steps.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
# Step 1: Run one check by hand
Set-Location C:\fmp-lab\start-kit
Import-Module .\powershell\FMPDdiReadiness\FMPDdiReadiness.psd1
Test-FMPLocatorResolution -Domain lab.contoso.example -Resolver 10.50.0.10 -Location lab-dc -Site Default-First-Site-Name -OutputPath C:\fmp-lab\gate | Format-List

# Step 2: Schedule it every 15 minutes
$cmd = 'Import-Module C:\fmp-lab\start-kit\powershell\FMPDdiReadiness\FMPDdiReadiness.psd1; Test-FMPLocatorResolution -Domain lab.contoso.example -Resolver 10.50.0.10 -Location lab-dc -Site Default-First-Site-Name -OutputPath C:\fmp-lab\gate'
$action = New-ScheduledTaskAction -Execute powershell.exe -Argument "-NoProfile -ExecutionPolicy RemoteSigned -Command $cmd"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 15)
Register-ScheduledTask -TaskName 'FMP locator check' -Action $action -Trigger $trigger -User 'NT AUTHORITY\SYSTEM' -RunLevel Highest

# Step 3: Break a locator record
Remove-DnsServerResourceRecord -ZoneName lab.contoso.example -Name _kpasswd._tcp -RRType Srv -Force

# Step 3: Break a locator record
Restart-Service Netlogon
Resolve-DnsName -Name _kpasswd._tcp.lab.contoso.example -Type SRV -Server 10.50.0.10 -DnsOnly

# Step 4: Read gate 2
Import-Csv (Get-ChildItem C:\fmp-lab\gate\srv-checks\*.csv).FullName | Format-Table Timestamp, Result, Failed
$gate = Test-FMPDdiDecommissionGate -Path C:\fmp-lab\run1\lab.contoso.example -SrvCheckPath C:\fmp-lab\gate\srv-checks -AsOf (Get-Date)
$gate.Gates | Format-Table Gate, Status, Detail -Wrap

# After the steps
Unregister-ScheduledTask -TaskName 'FMP locator check' -Confirm:$false
Remove-Item -Recurse -Force C:\fmp-lab\gate
```

:::

<!-- labs:end -->

1. **Run one check by hand.**

    ```powershell
    Set-Location C:\fmp-lab\start-kit
    Import-Module .\powershell\FMPDdiReadiness\FMPDdiReadiness.psd1
    Test-FMPLocatorResolution -Domain lab.contoso.example -Resolver 10.50.0.10 -Location lab-dc -Site Default-First-Site-Name -OutputPath C:\fmp-lab\gate | Format-List
    ```

    Expected result: `Records` 8, `Result` `PASS`, and one file under `C:\fmp-lab\gate\srv-checks`.

2. **Schedule it every 15 minutes.**

    ```powershell
    $cmd = 'Import-Module C:\fmp-lab\start-kit\powershell\FMPDdiReadiness\FMPDdiReadiness.psd1; Test-FMPLocatorResolution -Domain lab.contoso.example -Resolver 10.50.0.10 -Location lab-dc -Site Default-First-Site-Name -OutputPath C:\fmp-lab\gate'
    $action = New-ScheduledTaskAction -Execute powershell.exe -Argument "-NoProfile -ExecutionPolicy RemoteSigned -Command $cmd"
    $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 15)
    Register-ScheduledTask -TaskName 'FMP locator check' -Action $action -Trigger $trigger -User 'NT AUTHORITY\SYSTEM' -RunLevel Highest
    ```

3. **Break a locator record,** after the task has run at least twice.

    ```powershell
    Remove-DnsServerResourceRecord -ZoneName lab.contoso.example -Name _kpasswd._tcp -RRType Srv -Force
    ```

    Wait for the next check (up to 15 minutes), then let Netlogon register the record again, as it does for every locator record it owns:

    ```powershell
    Restart-Service Netlogon
    Resolve-DnsName -Name _kpasswd._tcp.lab.contoso.example -Type SRV -Server 10.50.0.10 -DnsOnly
    ```

    Expected result: the SRV record is back, pointing at `fmp-lab-dc01.lab.contoso.example`.

4. **Read gate 2** an hour or more later.

    ```powershell
    Import-Csv (Get-ChildItem C:\fmp-lab\gate\srv-checks\*.csv).FullName | Format-Table Timestamp, Result, Failed
    $gate = Test-FMPDdiDecommissionGate -Path C:\fmp-lab\run1\lab.contoso.example -SrvCheckPath C:\fmp-lab\gate\srv-checks -AsOf (Get-Date)
    $gate.Gates | Format-Table Gate, Status, Detail -Wrap
    ```

    Expected result: one `FAIL` row naming `_kpasswd._tcp.lab.contoso.example`; gate 2 failing with `lab-dc: 0 clean days since a failure`; the other four gates `Not evidenced`. In production the gate passes only after 30 days without a row like that one, from every location.

**Back it out.** Remove the task and the checks:

```powershell
Unregister-ScheduledTask -TaskName 'FMP locator check' -Confirm:$false
Remove-Item -Recurse -Force C:\fmp-lab\gate
```

## Knowledge check (5 minutes) {#ddi-m5-check}

1. In the cutover loop, where is a zone's rollback point?
    a. The backup taken after decommissioning.
    b. The old authority, left intact and still answering, until Phase 5: reverting the switch puts it back in charge.
    c. There isn't one; DNS changes can't be undone.

2. A signed zone has been imported on the new platform and answers correctly. Does it count as moved for gate 1?
    a. Yes, if the answers are right.
    b. Only once its new chain of trust validates and the old signing has stopped; until then it holds the gate.
    c. Signed zones never move.

3. One location's locator record check failed once, 17 days ago, out of over 700 checks. Why does gate 2 fail?
    a. It doesn't: the pass rate is over 99%.
    b. The gate needs 30 consecutive days of clean checks from every location; the failure restarted that location's clock.
    c. Because the failure was in Azure.

4. What should the team do with gate 5's three direct queries to `dns01`?
    a. Decommission `dns01` anyway; three queries are noise.
    b. Find what still queries `dns01` directly and move it to the governed resolvers before decommissioning; the gate stays closed until a 7-day window is clean.
    c. Raise the threshold.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See Unit 1 and [Chapter 10, The cutover loop every phase repeats](../../books/b08-ddi/10-migration-sequence.md#the-cutover-loop-every-phase-repeats).
2. **b.** See Unit 2 and Chapter 10's Phase 5 gate 1.
3. **b.** See Unit 3 and Lab 1, step 4.
4. **b.** See Lab 1, step 5, and [Chapter 10, Phase 5](../../books/b08-ddi/10-migration-sequence.md#phase-5-decommission-ad-dns-and-dhcp).
:::

## Summary (2 minutes) {#ddi-m5-summary}

You saw the cutover loop every move repeats, the three patterns and their rollbacks, the five decisions and their checks, and the signed-zone and locator-zone rules; then you ran the five decommissioning gates on a fictional domain's evidence and saw three of them hold it. **Evidence an ISSO keeps from this module:** each move's change record with its validation and rollback point, the locator record check history, and `DecommissionGate.csv` attached to the decommissioning change.

::: {.callout-tip}
## Continue the path
[Learning path](index.md) · [← Module 4, Cloud private DNS and one address plan](04-cloud-private-dns-and-one-address-plan.md) · [Next: Module 6, Operate the control plane with evidence →](06-operate-the-control-plane-with-evidence.md)
:::
