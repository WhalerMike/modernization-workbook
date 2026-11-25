---
title: "Module 2: Gate 0: the ED 26-03 and KEV floor"
description: "The guide's Gate 0: what Emergency Directive 26-03 requires and in what order, the nine Catalyst SD-WAN entries in CISA's Known Exploited Vulnerabilities catalog and the fixed-release floor they set for each software train, the release rule behind every pass, fail and confirm, and the gate's exit code as the stop a pipeline obeys, re-run on every KEV addition and Cisco publication day. Lab 1 replays the fictional fabric before and after its upgrade and reads the gate; Lab 2 runs the gate against a test fabric. About 50 minutes, plus Lab 2, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 09"
series-order: 2
---
# Module 2: Gate 0: the ED 26-03 and KEV floor {.unnumbered}

*Part of the [SD-WAN governor learning path](index.md). The guide's [Gate 0](../../books/guides/cisco-sdwan-implementation.md#gate-0-emergency-directive-26-03-and-the-kev-floor), and [Book 09, Chapter 13](../../books/b09-network/13-sequencing-cost-and-evidence.md#the-decision-sequence)'s step zero. About 50 minutes, plus Lab 2.*

## Introduction (3 minutes)

Book 09's step zero says the governor is secured before it carries production traffic. On Catalyst SD-WAN, CISA wrote the definition: Emergency Directive 26-03 and its supplemental hunt and hardening guidance, and, by October 2026, nine Catalyst SD-WAN vulnerabilities in the Known Exploited Vulnerabilities catalog. In this module you learn the directive's order of actions, how the advisories' fixed-release tables become one floor per software train, and how the kit turns that floor into a gate with an exit code. The project plan's [Gate 2](../../project-plans/network-access.md), *Governor secured before it carries traffic*, is the same gate at program scale.

**The federal requirement.** The guide's [Gate 0](../../books/guides/cisco-sdwan-implementation.md#the-gate-as-a-checklist) and [Book 09, Appendix B](../../books/b09-network/appendix-b-requirements-mapping.md) carry the full mapping.

| Requirement | KSI | Evidence |
|---|---|---|
| SI-2: every control component at or above the fixed release for its train | KSI-CMT-VTD | `ed-26-03-gate.csv` with no `fail` or `confirm` rows |
| RA-5: re-checked when new vulnerabilities are reported | KSI-SCR-MON | A gate run dated after each KEV addition and Cisco publication day |
| CA-7: the gate as part of continuous monitoring | KSI-MLA-EVC | The schedule, its owner, and the last run |
| CM-8: the gate reads the same inventory | KSI-PIY-GIV | The run's `fleet_inventory` records |

## Learning objectives (1 minute)

After this module, you'll be able to:

- list the directive's six actions in their required order;
- read a fixed-release table and apply the rule: the same maintenance branch, migrate off a train with no fix, confirm a train the advisory doesn't list;
- explain why the floor file is a transcription, not an authority;
- use the gate's exit code to stop a cutover;
- say when the gate is re-run.

## Prerequisites (1 minute)

- [Module 1](01-the-governor-before-the-traffic.md), and its Lab 1's `out` folder (Lab 1 below re-creates it if you don't have it).

## Unit 1: What the directive requires (10 minutes)

Read the guide's [What the directive requires](../../books/guides/cisco-sdwan-implementation.md#what-the-directive-requires). The actions must be taken in the identified order:

1. **Identify** every in-scope system.
2. **Collect** logs off the SD-WAN and the forensic artifacts, and send Cisco SD-WAN syslog to CISA through CLAW.
3. **Update** to Cisco's fixed releases.
4. **Hunt**, using the supplemental guidance; a compromised root account means a rebuild from patched images.
5. **Harden**, using the same guidance.
6. **Report** to CISA.

The deadlines are past. The program's position is that a new deployment performs the same sequence anyway, because it's the best published definition of a clean control plane. The guide turns it into [six gate lines](../../books/guides/cisco-sdwan-implementation.md#the-gate-as-a-checklist); this module covers lines 1 and 2, the inventory and the floor, and Module 3 covers the hunt, the logs and the hardening.

## Unit 2: The floor, and the rule behind it (12 minutes)

Read the guide's [The nine KEV entries and their fixes](../../books/guides/cisco-sdwan-implementation.md#the-nine-kev-entries-and-their-fixes). Each advisory lists first fixed releases per software train. Reading them together gives a floor per train, and the kit applies it per advisory:

- **On a listed train,** a release passes if it is at or above the fix on its own maintenance branch, the first three numbers, or newer than every listed fix. `20.12.6.0` fails against a `20.12.6.1` fix, even though it is above `20.12.5.3`.
- **A train with no fix of its own,** or one past End of Software Maintenance, fails: migrate.
- **A train the advisory doesn't list** returns `confirm`. Ask Cisco; don't assume.

The kit's `data/ed-26-03-fixed-releases.json` is a transcription of the advisories on October 24, 2026, not an authority. Cisco revises its tables, and new advisories arrive. Re-read every advisory, and the KEV catalog, before a gate run you rely on.

## Unit 3: A gate a pipeline can stop on (6 minutes)

The kit exits `0` when every gate row passes, `2` when any row fails or needs confirmation, and `1` on an error. A cutover pipeline stops on anything but `0` *(design guidance)*. Re-run the gate:

- on every KEV addition for the product;
- on each Cisco publication day: since July 2026, the first and third Wednesday of each month, with seven days' notice, and out of cycle for active exploitation;
- after every upgrade, as the post-change validation.

That cadence feeds BOD 26-04's remediation windows ([Book 09, Chapter 05](../../books/b09-network/05-sd-wan-sase-and-governed-transport.md)). Cisco's Live Protect shields can cover the gap until an upgrade, but Cisco calls them temporary partial protection: the gate still reads the running release.

## Exercise: Lab 1, fixtures, no fabric (15 minutes) {#nsw-m2-lab-1}
You read the floor, the gate's findings, and the rule behind them, then replay the same fabric a week later, after its upgrade. Work in `examples/cisco-sdwan`, with Python 3.10 or later and PowerShell 5.1 or 7. The second capture is `tests/fixtures/after-upgrade`, dated November 2, 2026.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/cisco-sdwan`. Each step below says what it does and what to look for.

```powershell
# Step 1: Read the floor file's provenance
$f = Get-Content -Raw data/ed-26-03-fixed-releases.json | ConvertFrom-Json
$f | Select-Object as_of, kev_catalog_version, @{ n = 'Advisories'; e = { $_.advisories.Count } }, @{ n = 'KEV CVEs'; e = { ($_.advisories.kev_cves | Sort-Object -Unique).Count } } | Format-List
$f.advisories | Format-Table id, @{ n = 'kev_cves'; e = { $_.kev_cves -join ', ' } }, @{ n = 'products'; e = { $_.products -join ', ' } }

# Step 2: Replay the October capture and count the gate's rows
python python/sdwan_evidence.py --config config/config.example.json --replay tests/fixtures --out out
"exit code: $LASTEXITCODE"
Import-Csv out/ed-26-03-gate.csv | Group-Object status -NoElement | Sort-Object Name | Format-Table Name, Count

# Step 3: Read the rows that stop the gate
Import-Csv out/ed-26-03-gate.csv | Where-Object status -ne 'pass' | Format-List host_name, role, software_version, advisory_id, status, reason

# Step 4: Apply the release rule yourself
python -c "import json, sys; sys.path.insert(0, 'python'); import sdwan_evidence as se; f = json.load(open('data/ed-26-03-fixed-releases.json')); a = {x['id']: x for x in f['advisories']}['cisco-sa-sdwan-rpa-EHchtZk']; [print(f'{v:<10}', *se.check_release(v, a, f['end_of_maintenance_trains'])) for v in ('20.12.5.3', '20.12.6.0', '20.12.6.1', '20.11.1.0', '26.1.1.0')]"

# Step 5: Replay the fabric a week later, after the upgrade
python python/sdwan_evidence.py --config config/config.example.json --replay tests/fixtures/after-upgrade --out out-after
"exit code: $LASTEXITCODE"
Import-Csv out-after/ed-26-03-gate.csv | Group-Object role, status -NoElement | Sort-Object Name | Format-Table Name, Count
```

:::

<!-- labs:end -->

1. **Read the floor file's provenance.**

    ```powershell
    $f = Get-Content -Raw data/ed-26-03-fixed-releases.json | ConvertFrom-Json
    $f | Select-Object as_of, kev_catalog_version, @{ n = 'Advisories'; e = { $_.advisories.Count } }, @{ n = 'KEV CVEs'; e = { ($_.advisories.kev_cves | Sort-Object -Unique).Count } } | Format-List
    $f.advisories | Format-Table id, @{ n = 'kev_cves'; e = { $_.kev_cves -join ', ' } }, @{ n = 'products'; e = { $_.products -join ', ' } }
    ```

    Expected output:

    ```text
    as_of               : 2026-10-24
    kev_catalog_version : 2026.10.23
    Advisories          : 7
    KEV CVEs            : 9

    id                              kev_cves                                       products
    --                              --------                                       --------
    cisco-sa-sdwan-rpa-EHchtZk      CVE-2026-20127                                 manager, controller, validator
    cisco-sa-sdwan-authbp-qwCX8D4v  CVE-2026-20122, CVE-2026-20128, CVE-2026-20133 manager
    cisco-sa-sdwan-rpa2-v69WY2SW    CVE-2026-20182                                 manager, controller, validator
    cisco-sa-sdwan-privesc-4uxFrdzx CVE-2026-20245                                 manager, controller, validator
    cisco-sa-sdwan-arbfw-c2rZvQ     CVE-2026-20262                                 manager
    cisco-sa-sdwan-webauth-xr8beuuU CVE-2026-76504                                 manager
    cisco-sa-sd-wan-priv-E6e8tEdF   CVE-2022-20775                                 manager, controller, validator
    ```

    Seven advisories cover the nine catalog entries. Three apply only to Manager, so a Controller or Validator is checked against four.

2. **Replay the October capture and count the gate's rows.**

    ```powershell
    python python/sdwan_evidence.py --config config/config.example.json --replay tests/fixtures --out out
    "exit code: $LASTEXITCODE"
    Import-Csv out/ed-26-03-gate.csv | Group-Object status -NoElement | Sort-Object Name | Format-Table Name, Count
    ```

    Expected output:

    ```text
    gate: fail  evidence: out/sdwan-evidence.json  findings: out/ed-26-03-gate.csv
    exit code: 2

    Name Count
    ---- -----
    fail     2
    pass    32
    ```

    One row per control component per advisory that applies to it, plus one row for each component nobody expected.

3. **Read the rows that stop the gate.**

    ```powershell
    Import-Csv out/ed-26-03-gate.csv | Where-Object status -ne 'pass' | Format-List host_name, role, software_version, advisory_id, status, reason
    ```

    Expected output:

    ```text
    host_name        : sdwan-validator-01
    role             : validator
    software_version : 20.15.5.2
    advisory_id      : cisco-sa-sdwan-privesc-4uxFrdzx
    status           : fail
    reason           : 20.15.5.2 is below fixed release 20.15.5.3 (CVE-2026-20245)

    host_name        : unknown-peer
    role             : controller
    software_version :
    advisory_id      :
    status           : fail
    reason           : control component not in the expected inventory; validate it (ED 26-03 hunt guidance)
    ```

    The Validator is one build short of the CVE-2026-20245 fix. `unknown-peer` passes every advisory, yet still fails: a patched component isn't a legitimate one. Module 3 validates it.

4. **Apply the release rule yourself,** with the kit's own function, to five releases against the CVE-2026-20127 advisory.

    ```powershell
    python -c "import json, sys; sys.path.insert(0, 'python'); import sdwan_evidence as se; f = json.load(open('data/ed-26-03-fixed-releases.json')); a = {x['id']: x for x in f['advisories']}['cisco-sa-sdwan-rpa-EHchtZk']; [print(f'{v:<10}', *se.check_release(v, a, f['end_of_maintenance_trains'])) for v in ('20.12.5.3', '20.12.6.0', '20.12.6.1', '20.11.1.0', '26.1.1.0')]"
    ```

    Expected output:

    ```text
    20.12.5.3  pass 20.12.5.3 is at or above fixed release 20.12.5.3
    20.12.6.0  fail 20.12.6.0 is below fixed release 20.12.6.1 (CVE-2026-20127)
    20.12.6.1  pass 20.12.6.1 is at or above fixed release 20.12.6.1
    20.11.1.0  fail train 20.11 has no fix in cisco-sa-sdwan-rpa-EHchtZk; migrate to 20.12.6.1 or later
    26.1.1.0   confirm train 26.1 is newer than the trains listed in cisco-sa-sdwan-rpa-EHchtZk; confirm with Cisco
    ```

    `20.12.6.0` is above one fix and below the fix on its own branch, so it fails. The 26.1 train is newer than anything this advisory lists, so the kit won't guess.

5. **Replay the fabric a week later, after the upgrade.** The Validators moved to 20.18.3.1, a second Controller and Validator joined, and `unknown-peer` was validated and removed.

    ```powershell
    python python/sdwan_evidence.py --config config/config.example.json --replay tests/fixtures/after-upgrade --out out-after
    "exit code: $LASTEXITCODE"
    Import-Csv out-after/ed-26-03-gate.csv | Group-Object role, status -NoElement | Sort-Object Name | Format-Table Name, Count
    ```

    Expected output:

    ```text
    gate: pass  evidence: out-after/sdwan-evidence.json  findings: out-after/ed-26-03-gate.csv
    exit code: 0

    Name             Count
    ----             -----
    controller, pass     8
    manager, pass       21
    validator, pass      8
    ```

    Every row passes and the exit code is `0`: gate lines 1 and 2 are evidenced for this capture. Lines 3 to 6 aren't the kit's to close.

## Exercise: Lab 2, a test fabric {#nsw-m2-lab-2}
*Not timed. Not run by the authors. Never production.* You need Module 1's Lab 2 config, `config/config.json`, and the read-only Manager account. Work in `examples/cisco-sdwan`.

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/cisco-sdwan`. Each step below says what it does and what to look for.

```powershell
# Step 1: Re-read the advisories before you rely on the floor
$f = Get-Content -Raw data/ed-26-03-fixed-releases.json | ConvertFrom-Json
$f.advisories | Format-Table id, advisory_version
$f.advisories.url | ForEach-Object { Start-Process $_ }
Start-Process 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog'

# Step 2: Run the gate against the test fabric
$cred = Get-Credential -Message 'Read-only Manager account'
$env:SDWAN_API_USERNAME = $cred.UserName
$env:SDWAN_API_PASSWORD = $cred.GetNetworkCredential().Password
python python/sdwan_evidence.py --config config/config.json --out out-test
"exit code: $LASTEXITCODE"

# Step 3: Read what stops the gate
Import-Csv out-test/ed-26-03-gate.csv | Group-Object status -NoElement | Sort-Object Name | Format-Table Name, Count
Import-Csv out-test/ed-26-03-gate.csv | Where-Object status -ne 'pass' | Format-List host_name, role, software_version, advisory_id, status, reason

# Step 4: Use the exit code the way a cutover pipeline does
python python/sdwan_evidence.py --config config/config.json --out out-test
if ($LASTEXITCODE -ne 0) { "STOP: gate exit code $LASTEXITCODE; no cutover" } else { "Gate passed: the cutover may proceed to its next check" }

# Step 5: Clear the credentials
Remove-Item Env:SDWAN_API_USERNAME, Env:SDWAN_API_PASSWORD
Remove-Variable cred
```

:::

<!-- labs:end -->

1. **Re-read the advisories before you rely on the floor.** Each opens in your browser; compare its fixed-release table and version with the file's.

    ```powershell
    $f = Get-Content -Raw data/ed-26-03-fixed-releases.json | ConvertFrom-Json
    $f.advisories | Format-Table id, advisory_version
    $f.advisories.url | ForEach-Object { Start-Process $_ }
    Start-Process 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog'
    ```

    If an advisory has a newer version or a new fixed release, or the catalog has a new Catalyst SD-WAN entry, the floor file is stale: record the gap, and treat the run below as provisional until the file is corrected.

2. **Run the gate against the test fabric.**

    ```powershell
    $cred = Get-Credential -Message 'Read-only Manager account'
    $env:SDWAN_API_USERNAME = $cred.UserName
    $env:SDWAN_API_PASSWORD = $cred.GetNetworkCredential().Password
    python python/sdwan_evidence.py --config config/config.json --out out-test
    "exit code: $LASTEXITCODE"
    ```

3. **Read what stops the gate,** as in Lab 1.

    ```powershell
    Import-Csv out-test/ed-26-03-gate.csv | Group-Object status -NoElement | Sort-Object Name | Format-Table Name, Count
    Import-Csv out-test/ed-26-03-gate.csv | Where-Object status -ne 'pass' | Format-List host_name, role, software_version, advisory_id, status, reason
    ```

    Each `fail` row names the release to reach or the train to migrate to; each `confirm` row is a question for Cisco. A test fabric that fails is the point of the lab: it shows the gate working.

4. **Use the exit code the way a cutover pipeline does.**

    ```powershell
    python python/sdwan_evidence.py --config config/config.json --out out-test
    if ($LASTEXITCODE -ne 0) { "STOP: gate exit code $LASTEXITCODE; no cutover" } else { "Gate passed: the cutover may proceed to its next check" }
    ```

5. **Clear the credentials.**

    ```powershell
    Remove-Item Env:SDWAN_API_USERNAME, Env:SDWAN_API_PASSWORD
    Remove-Variable cred
    ```

**What it leaves behind.** Two sign-ins in Manager's audit log, and `out-test` with the fabric's gate findings: keep it where only the lab's operators can read it.

## Knowledge check (5 minutes)

1. A Manager runs 20.12.6.0. The advisory's fixed releases on its train are 20.12.5.3 and 20.12.6.1. What does the gate say?
    a. Pass: it is above 20.12.5.3.
    b. Fail: the fix on its own maintenance branch, 20.12.6, is 20.12.6.1.
    c. Confirm: two fixes are listed.

2. A Controller runs a train the advisory doesn't list at all. What should the operator do?
    a. Treat it as passing: the advisory doesn't name it.
    b. Treat it as failing and migrate at once.
    c. Ask Cisco, and keep the gate closed until the answer is recorded.

3. The gate run shows a Controller at the right release that isn't in the build record. Is the gate open?
    a. Yes: every advisory passes.
    b. No: a component nobody expected is validated before the fabric carries traffic.
    c. Yes, once the Controller is added to the build record.

4. When is the gate re-run?
    a. Once, before the pilot.
    b. On every KEV addition for the product, each Cisco publication day, and after every upgrade.
    c. At each annual assessment.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See Unit 2 and Lab 1's Step 4.
2. **c.** `confirm` is a question, not an answer (Unit 2; the guide's [floor](../../books/guides/cisco-sdwan-implementation.md#the-nine-kev-entries-and-their-fixes) lists the open vendor asks).
3. **b.** Adding it to the record without validating it would hide exactly what the hunt guidance looks for. See Lab 1's Step 3, and Module 3.
4. **b.** See Unit 3 and the guide's [gate checklist](../../books/guides/cisco-sdwan-implementation.md#the-gate-as-a-checklist).
:::

## Summary (2 minutes)

You read the directive's order of actions, turned the advisories' tables into a floor, applied the release rule, and saw the same fabric fail its gate and then pass it. **Evidence an ISSO keeps from this module:** each dated `ed-26-03-gate.csv`, with no `fail` or `confirm` rows before cutover; the floor file's `as_of` date and the record of the advisories re-read for that run; and the re-run schedule with its owner.

::: {.callout-tip}
## Continue the path
[Learning path](index.md) · [Previous: Module 1](01-the-governor-before-the-traffic.md) · [Next: Module 3, The hunt, hardening and logs off the box →](03-the-hunt-hardening-and-logs-off-the-box.md)
:::
