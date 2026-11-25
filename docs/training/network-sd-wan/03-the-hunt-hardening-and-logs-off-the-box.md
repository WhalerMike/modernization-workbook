---
title: "Module 3: The hunt, hardening and logs off the box"
description: "Gate 0's lines 3 to 5: the supplemental guidance's six-part hunt and why a patched component isn't a legitimate one, validating every control component Manager knows about against the build record, reviewing Manager's audit log for sign-ins and administrative sources outside the management network, the hardening checklist keyed to the controls owed to the governor, and getting the fabric's logs off the box to the SIEM and to CISA through CLAW. Lab 1 reads the fictional fabric's unexpected Controller and its audit records; Lab 2 reviews a test fabric's audit log against the authorized administrators and checks that its syslog reaches the workspace. About 45 minutes, plus Lab 2, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 09"
series-order: 3
review-status: approved
reviewed-sha256: 099604260eea5e0c883c1ff70143188603a28aa1b250c8e40593612b51630cd6
last-reviewed: 2026-11-25
---
# Module 3: The hunt, hardening and logs off the box {.unnumbered}

*Part of the [SD-WAN governor learning path](index.md). The guide's [Gate 0](../../books/guides/cisco-sdwan-implementation.md#what-the-directive-requires) hunt checklist, [Hardening](../../books/guides/cisco-sdwan-implementation.md#hardening) and [Getting logs off the box](../../books/guides/cisco-sdwan-implementation.md#getting-logs-off-the-box). About 45 minutes, plus Lab 2.*

## Introduction (3 minutes)

A control plane at the right release can still hold an attacker who arrived before the patch. CISA's supplemental guidance says the attacker's rogue device appears as a new, temporary and legitimate SD-WAN component, that partners saw logs and shell histories cleared, and that activity likely began in 2023. So Gate 0 doesn't close on releases alone: it closes when every peer is validated, the hunt's artifacts are kept, the hardening checklist is done, and the fabric's logs live somewhere the fabric can't erase them. In this module you validate a peer nobody expected, review Manager's audit records the way the kit flags them, and follow the logs off the box.

**The federal requirement.** The guide's [hardening table](../../books/guides/cisco-sdwan-implementation.md#hardening) keys each setting to its control.

| Requirement | KSI | Evidence |
|---|---|---|
| CM-8: every control component Manager knows about is in the build record | KSI-PIY-GIV | The gate run's `unexpected_control_component` rows, each validated or removed |
| AU-6: Manager's audit records reviewed for unusual activity | KSI-MLA-RVL | `management_audit` records with their review flags, and the reviewer's notes |
| AU-9: audit information held off the box, where the fabric can't change it | KSI-MLA-OSM | Syslog in the SIEM, and the CLAW delivery confirmation |
| AC-6(9): privileged functions logged | KSI-MLA-LET | The same audit records, for the administrator's actions |
| SC-7(5): management reachable only from jump hosts | KSI-CNA-RNT | Records flagged `source_outside_management_network`, each explained |

## Learning objectives (1 minute)

After this module, you'll be able to:

- name the hunt checklist's six parts, and say why a patched component may still be a rogue one;
- validate the control components Manager reports against the build record;
- read the kit's audit records and their review flags, and say what each flag asks of the reviewer;
- name the hardening areas keyed to the governor's controls;
- trace the fabric's logs off the box to the SIEM and to CISA.

## Prerequisites (1 minute)

- [Module 2](02-gate-0-the-ed-26-03-and-kev-floor.md).

## Unit 1: The hunt, and validating every peer (10 minutes)

Read the guide's [What the directive requires](../../books/guides/cisco-sdwan-implementation.md#what-the-directive-requires), from *The supplemental hunt and hardening guidance* to the end of the section. The hunt has six parts:

- **A.** Software downgrades and unexpected reboots.
- **B.** Application reversion within 15 minutes of a downgrade.
- **C.** Rogue peering: by peer type, by peer-system-IP outliers, by an odd remote color, and by validating every peered edge.
- **D.** SSH abuse through `vmanage-admin`'s authorized keys.
- **E.** Root sign-ins and new accounts.
- **F.** Cleared logs and shell histories.

The kit covers a narrow, API-side slice of part C: it flags any Manager, Controller or Validator that Manager reports and the build record doesn't list. It isn't a hunt. Parts A, B and D to F read logs, the admin-tech dump and the hosts themselves, and the hunt's artifacts are kept as Gate 0's evidence. If a root account was compromised, the directive's answer is a rebuild from patched images, with new administrator accounts and unique credentials.

## Unit 2: Hardening, keyed to the controls (8 minutes)

Read the guide's [Hardening](../../books/guides/cisco-sdwan-implementation.md#hardening) table. It joins CISA's supplemental guidance to Cisco's hardening guide, and keys each area to a control: the perimeter and control-plane ports to SC-7(5), administrative access to IA-2(1) and AC-6(9), sessions to AC-12, the control and data plane to SC-8, credentials to IA-5, Manager's web certificate to SC-17, and logging to AU-6 and AU-9. Two rows matter most for this module:

- **Administrative access** through jump hosts, with single sign-on to Manager and phishing-resistant MFA, and `netadmin` held to a named few. A sign-in from outside the management network is the first thing to explain.
- **Logging**: syslog over TLS to the SIEM, with alerts on Manager or Controller peering from an unknown address, and on every successful sign-in matched against authorized users. Any root sign-in is treated as compromise.

## Unit 3: Logs off the box (6 minutes)

Read the guide's [Getting logs off the box](../../books/guides/cisco-sdwan-implementation.md#getting-logs-off-the-box). The edges and control components send syslog, preferably over TLS; all Cisco SD-WAN syslog goes to CISA through CLAW under the directive. In Microsoft Sentinel, the Cisco SD-WAN connector lands syslog in the `Syslog` table through the Azure Monitor Agent on a Linux forwarder; its NetFlow path is legacy. The kit reads Manager's audit log through the API, which is a second view, not a substitute: an attacker who controls Manager controls what its API returns, and the copy in the SIEM is the one the fabric can't change.

## Exercise: Lab 1, fixtures, no fabric (12 minutes) {#nsw-m3-lab-1}
You validate the Controller nobody expected and review the fictional fabric's audit records. Work in `examples/cisco-sdwan`, with Python 3.10 or later and PowerShell 5.1 or 7. The first step re-creates the two runs from Module 2.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/cisco-sdwan`. Each step below says what it does and what to look for.

```powershell
# Step 1: Replay both captures
python python/sdwan_evidence.py --config config/config.example.json --replay tests/fixtures --out out
python python/sdwan_evidence.py --config config/config.example.json --replay tests/fixtures/after-upgrade --out out-after

# Step 2: Look at every gate row for the unexpected Controller
Import-Csv out/ed-26-03-gate.csv | Where-Object system_ip -eq '10.255.0.99' | Group-Object record_kind, status -NoElement | Sort-Object Name | Format-Table Name, Count

# Step 3: Read what Manager says about it
$d = Get-Content -Raw tests/fixtures/devices.json | ConvertFrom-Json
$d.data | Where-Object 'system-ip' -eq '10.255.0.99' | Format-List 'host-name', 'system-ip', 'device-type', 'site-id', 'device-model', 'board-serial', version

# Step 4: Review the October audit records
$r = Get-Content -Raw out/sdwan-evidence.json | ConvertFrom-Json
$r.records | Where-Object record_kind -eq 'management_audit' | Format-List actor, source_ip, module, feature, message, @{ n = 'review_flags'; e = { $_.review_flags -join ', ' } }, @{ n = 'controls'; e = { $_.control_refs -join ', ' } }

# Step 5: Read the management network the flag is judged against
(Get-Content -Raw config/config.example.json | ConvertFrom-Json).management_source_cidrs

# Step 6: Review the November audit records
$a = Get-Content -Raw out-after/sdwan-evidence.json | ConvertFrom-Json
$a.records | Where-Object record_kind -eq 'management_audit' | Format-Table actor, source_ip, feature, @{ n = 'review_flags'; e = { $_.review_flags -join ', ' } } -Wrap
```

:::

<!-- labs:end -->

1. **Replay both captures.**

    ```powershell
    python python/sdwan_evidence.py --config config/config.example.json --replay tests/fixtures --out out
    python python/sdwan_evidence.py --config config/config.example.json --replay tests/fixtures/after-upgrade --out out-after
    ```

    Expected output:

    ```text
    gate: fail  evidence: out/sdwan-evidence.json  findings: out/ed-26-03-gate.csv
    gate: pass  evidence: out-after/sdwan-evidence.json  findings: out-after/ed-26-03-gate.csv
    ```

2. **Look at every gate row for the unexpected Controller.**

    ```powershell
    Import-Csv out/ed-26-03-gate.csv | Where-Object system_ip -eq '10.255.0.99' | Group-Object record_kind, status -NoElement | Sort-Object Name | Format-Table Name, Count
    ```

    Expected output:

    ```text
    Name                               Count
    ----                               -----
    ed_26_03_kev_gate, pass                4
    unexpected_control_component, fail     1
    ```

    It passes all four advisories that apply to a Controller. That is what the hunt guidance warns about: a rogue component can look current and legitimate.

3. **Read what Manager says about it.**

    ```powershell
    $d = Get-Content -Raw tests/fixtures/devices.json | ConvertFrom-Json
    $d.data | Where-Object 'system-ip' -eq '10.255.0.99' | Format-List 'host-name', 'system-ip', 'device-type', 'site-id', 'device-model', 'board-serial', version
    ```

    Expected output:

    ```text
    host-name    : unknown-peer
    system-ip    : 10.255.0.99
    device-type  : vsmart
    site-id      : 0
    device-model : vsmart
    board-serial :
    version      : 20.18.3.1
    ```

    A Controller at site 0, outside the build record's addresses. Validating it is a person's job: who built it, when, from which image, and does the build record or the change record know it. Until someone answers, the gate stays closed. In the November capture it's gone: removed after validation.

4. **Review the October audit records.** Each is one Manager audit-log entry, with the kit's review flags.

    ```powershell
    $r = Get-Content -Raw out/sdwan-evidence.json | ConvertFrom-Json
    $r.records | Where-Object record_kind -eq 'management_audit' | Format-List actor, source_ip, module, feature, message, @{ n = 'review_flags'; e = { $_.review_flags -join ', ' } }, @{ n = 'controls'; e = { $_.control_refs -join ', ' } }
    ```

    Expected output:

    ```text
    actor        : netops-admin@contoso.example
    source_ip    : 10.250.10.25
    module       : user
    feature      : login
    message      : Authentication succeeded for user netops-admin@contoso.example
    review_flags : successful_sign_in_review_against_authorized_users
    controls     : AU-6, AU-9, AC-6(9)

    actor        : admin
    source_ip    : 203.0.113.50
    module       : template
    feature      : device template
    message      : Template attached to device fo-0101-edge
    review_flags : source_outside_management_network
    controls     : AU-6, AU-9, AC-6(9)
    ```

    The sign-in is flagged for the reviewer to match against the authorized users, as CISA asks. The second entry is worse: the shared `admin` account attached a template to an edge from an address outside the management network.

5. **Read the management network the flag is judged against.**

    ```powershell
    (Get-Content -Raw config/config.example.json | ConvertFrom-Json).management_source_cidrs
    ```

    Expected output:

    ```text
    10.250.10.0/24
    ```

    `203.0.113.50` isn't in it, so the change didn't come through a jump host. The hardening table puts management behind jump hosts only; this record is the evidence that one change didn't.

6. **Review the November audit records.**

    ```powershell
    $a = Get-Content -Raw out-after/sdwan-evidence.json | ConvertFrom-Json
    $a.records | Where-Object record_kind -eq 'management_audit' | Format-Table actor, source_ip, feature, @{ n = 'review_flags'; e = { $_.review_flags -join ', ' } } -Wrap
    ```

    Expected output:

    ```text
    actor                        source_ip    feature          review_flags
    -----                        ---------    -------          ------------
    netops-admin@contoso.example 10.250.10.25 login            successful_sign_in_review_against_authorized_users
    netops-admin@contoso.example 10.250.10.25 software upgrade
    ```

    A named administrator, from the management network, signing in and running the upgrade. The sign-in still carries its flag: every successful sign-in is reviewed, not only the strange ones.

## Exercise: Lab 2, a test fabric {#nsw-m3-lab-2}
*Not timed. Not run by the authors. Never production.* You need Module 1's Lab 2 config, `config/config.json`, and the read-only Manager account. Steps 3 and 4 also need the test fabric's syslog flowing to a Log Analytics workspace through the Cisco SD-WAN connector, PowerShell 7 with the `Az.Accounts` and `Az.OperationalInsights` modules, and Log Analytics Reader on the workspace. Work in `examples/cisco-sdwan`. The values you supply:

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/cisco-sdwan`. Each step below says what it does and what to look for.

```powershell
# Step 1: Collect the test fabric's audit records
$cred = Get-Credential -Message 'Read-only Manager account'
$env:SDWAN_API_USERNAME = $cred.UserName
$env:SDWAN_API_PASSWORD = $cred.GetNetworkCredential().Password
python python/sdwan_evidence.py --config config/config.json --out out-test
Remove-Item Env:SDWAN_API_USERNAME, Env:SDWAN_API_PASSWORD
$t = Get-Content -Raw out-test/sdwan-evidence.json | ConvertFrom-Json
$t.records | Where-Object record_kind -eq 'management_audit' | Format-Table actor, source_ip, feature, @{ n = 'review_flags'; e = { $_.review_flags -join ', ' } } -Wrap

# Step 2: Match every successful sign-in against the authorized administrators
$allowed = Import-Csv '<authorized-admins-csv>' | ForEach-Object user
$t.records | Where-Object { $_.review_flags -contains 'successful_sign_in_review_against_authorized_users' -and $_.actor -notin $allowed } | Format-Table actor, source_ip, message -Wrap
$t.records | Where-Object { $_.review_flags -contains 'source_outside_management_network' } | Format-Table actor, source_ip, feature, message -Wrap

# Step 3: Confirm the test Manager's syslog reaches the workspace
Connect-AzAccount
$q = "Syslog | where TimeGenerated > ago(24h) | where Computer has '<test-manager-hostname>' | summarize Events = count(), Last = max(TimeGenerated) by Computer, Facility"
(Invoke-AzOperationalInsightsQuery -WorkspaceId '<workspace-id>' -Query $q).Results | Format-Table

# Step 4: Run the peering check the hardening table asks the SIEM to alert on
$q = "Syslog | where TimeGenerated > ago(7d) | where SyslogMessage has 'new-state:up' and (SyslogMessage has 'peer-type:vmanage' or SyslogMessage has 'peer-type:vsmart') | project TimeGenerated, Computer, SyslogMessage"
(Invoke-AzOperationalInsightsQuery -WorkspaceId '<workspace-id>' -Query $q).Results | Format-Table -Wrap
```

:::

<!-- labs:end -->

- `<authorized-admins-csv>`: a CSV file with one column, `user`, listing every account allowed to sign in to the test Manager.
- `<workspace-id>`: the workspace's ID.
- `<test-manager-hostname>`: the name the test Manager's syslog carries.

1. **Collect the test fabric's audit records.**

    ```powershell
    $cred = Get-Credential -Message 'Read-only Manager account'
    $env:SDWAN_API_USERNAME = $cred.UserName
    $env:SDWAN_API_PASSWORD = $cred.GetNetworkCredential().Password
    python python/sdwan_evidence.py --config config/config.json --out out-test
    Remove-Item Env:SDWAN_API_USERNAME, Env:SDWAN_API_PASSWORD
    $t = Get-Content -Raw out-test/sdwan-evidence.json | ConvertFrom-Json
    $t.records | Where-Object record_kind -eq 'management_audit' | Format-Table actor, source_ip, feature, @{ n = 'review_flags'; e = { $_.review_flags -join ', ' } } -Wrap
    ```

    Your own read-only sign-ins from Module 1 and 2 appear here, from your host's address.

2. **Match every successful sign-in against the authorized administrators.**

    ```powershell
    $allowed = Import-Csv '<authorized-admins-csv>' | ForEach-Object user
    $t.records | Where-Object { $_.review_flags -contains 'successful_sign_in_review_against_authorized_users' -and $_.actor -notin $allowed } | Format-Table actor, source_ip, message -Wrap
    $t.records | Where-Object { $_.review_flags -contains 'source_outside_management_network' } | Format-Table actor, source_ip, feature, message -Wrap
    ```

    Both lists should be empty. Any row is a finding for the reviewer to explain in writing, and a sign-in by `root` is treated as compromise.

3. **Confirm the test Manager's syslog reaches the workspace.** This step runs in PowerShell 7.

    ```powershell
    Connect-AzAccount
    $q = "Syslog | where TimeGenerated > ago(24h) | where Computer has '<test-manager-hostname>' | summarize Events = count(), Last = max(TimeGenerated) by Computer, Facility"
    (Invoke-AzOperationalInsightsQuery -WorkspaceId '<workspace-id>' -Query $q).Results | Format-Table
    ```

    The cmdlet is Microsoft's [Invoke-AzOperationalInsightsQuery](https://learn.microsoft.com/powershell/module/az.operationalinsights/invoke-azoperationalinsightsquery). Look for rows for the test Manager with a recent `Last`. No rows means the logs aren't off the box yet, and Gate 0's line 4 isn't closed.

4. **Run the peering check the hardening table asks the SIEM to alert on.**

    ```powershell
    $q = "Syslog | where TimeGenerated > ago(7d) | where SyslogMessage has 'new-state:up' and (SyslogMessage has 'peer-type:vmanage' or SyslogMessage has 'peer-type:vsmart') | project TimeGenerated, Computer, SyslogMessage"
    (Invoke-AzOperationalInsightsQuery -WorkspaceId '<workspace-id>' -Query $q).Results | Format-Table -Wrap
    ```

    Each row is a Manager or Controller peering coming up. Check every source address against the build record; one you can't account for is part C of the hunt, and the rule behind an alert.

**What it leaves behind.** A sign-in in Manager's audit log, `out-test` with the test fabric's audit records, and an Azure sign-in in the PowerShell session: run `Disconnect-AzAccount` when you finish.

## Knowledge check (5 minutes)

1. Every control component passes every advisory, but the run flags a Controller nobody expected. What does the operator do?
    a. Add its address to the build record, so the next run passes.
    b. Keep the gate closed, validate it, and remove it unless someone can account for it.
    c. Nothing: it's at a fixed release.

2. Why keep Manager's logs in the SIEM when the kit already reads Manager's audit log through the API?
    a. The API is slower.
    b. The SIEM's copy is off the box: an attacker who controls Manager controls what its API returns, and the guidance saw logs cleared.
    c. The kit can't read the audit log in hosted fabrics.

3. A successful sign-in by a named administrator, from a jump host, is flagged. Why?
    a. Every successful sign-in is matched against the authorized users, not only the strange ones.
    b. Named administrators shouldn't sign in to Manager.
    c. The kit flags every audit record.

4. Which part of the hunt does the kit cover?
    a. All six.
    b. A narrow, API-side slice of part C, rogue peering: components Manager reports that the build record doesn't list.
    c. Part F, cleared logs.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See Unit 1 and Lab 1's Steps 2 and 3.
2. **b.** See Unit 3 and the guide's [Hardening](../../books/guides/cisco-sdwan-implementation.md#hardening) logging row.
3. **a.** See Unit 2 and Lab 1's Step 6.
4. **b.** See Unit 1.
:::

## Summary (2 minutes)

You validated a component that passed every advisory and still failed the gate, reviewed Manager's audit records with the kit's flags, and followed the logs off the box. **Evidence an ISSO keeps from this module:** the hunt's artifacts and the reviewer's notes; each unexpected component's validation or removal; the dated `management_audit` records with every flag explained; the hardening record; the SIEM query results; and the CLAW delivery confirmation.

::: {.callout-tip}
## Continue the path
[Learning path](index.md) · [Previous: Module 2](02-gate-0-the-ed-26-03-and-kev-floor.md) · [Next: Module 4, Path classes, change rings and the evidence →](04-path-classes-change-rings-and-the-evidence.md)
:::
