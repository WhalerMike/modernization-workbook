---
title: "Chapter 09 — Deploying to Test and Production"
description: "The runbook that takes the Defender XDR kit from the labs to a live test tenant and then production, with the same commands and one settings file per environment: a read-only pre-flight (settings and inputs, the Graph module, the session's cloud, tenant and granted scopes, a first read, the output root, and in production the test stage's go/no-go); Stage 1 in the test tenant (the scheduled run, the detection plan published through Microsoft Graph as a dry run and then with the approved SHA-256, a synthetic event as the smoke test, an ASR ring moved from the kit's values by a person in Intune, and a planned rollback); the go/no-go from the evidence; Stage 2 in production; and the monthly schedule. Every step is a command; fixture-mode output is shown with its date. Not run against a live tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-defender-xdr
part: How
series-order: 9
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
last-reviewed: 2026-11-17
---
# Chapter 09 — Deploying to Test and Production

*The same commands in both stages; only the settings file changes. Production waits until the test stage's own evidence says go.*

::: {.callout-note}
## In this chapter
A runbook, not a gate, so it has no labs of its own. It runs the kit's `deploy/` scripts and the earlier chapters' entry scripts in order: settings, pre-flight, Stage 1 in a live test tenant, the go/no-go, Stage 2 in production, and the monthly schedule. Each step is a command block. The output under each is from fixture mode on November 17, 2026, using `deploy/tests/fixtures`, so you can follow it on a laptop first. **Nothing in this chapter has been run against a live tenant.**
:::

## Goal and audience

**Goal.** By the end of this chapter you can take the kit to a test tenant, prove it there with evidence, and take it to production under a change record, with a rollback that is planned before anything is applied.

**Audience.** Whoever runs the change: the platform owner with the operator, the detection engineer for the publish step, and the ISSO for the go/no-go. You should have run every earlier chapter's Lab 1, and Chapter 08's.

## What changes, and what doesn't

| The kit does | A person does, under the change record |
|---|---|
| Reads incidents, hunting results and detection rules through Graph | Assigns PIM roles and signs in (Chapter 01) |
| Compares every input with its plan and writes the evidence | Moves an ASR or prevention ring in Intune from the kit's values (Chapters 03 and 04) |
| Publishes custom detections from an approved plan, through `detectionRules`, only with `-Apply` and the plan's SHA-256 | Approves the plan's SHA-256; enables a rule by changing its file (Chapter 06) |
| Plans the rollback | Changes a device group's level or an exclusion in the portal (Chapter 07) |

Only one write is automated: custom detections. Learn doesn't state the `detectionRules` API's GCC availability; if a test-tenant call fails, set `detections.deployVia` to `portal` and make the same changes from the plan's portal sheet (Chapter 06).

## The settings, one per environment

Copy `deploy/settings.template.json` to `settings.test.json` and `settings.production.json` on agency storage, and fill every `<placeholder>`: the tenant, the output root, the PIM-governed groups, the emergency access groups and accounts, and every input file (Chapters 01 to 08). No secret goes in a settings file; the run signs in with `Connect-MgGraph` through PIM, or a managed identity. Read the fictional test settings to see a filled one:

```powershell
Get-Content deploy/tests/fixtures/settings.test.json
```

Work in `examples/defender-xdr` for every step. Each step that names `-EnvironmentFixture` is the fixture-mode form; for the live run, leave `-EnvironmentFixture` out and use your own settings file. You'll replace: `<tenant-id>`, `<settings-test>` and `<settings-production>` (your two settings files), `<test-evidence>` (the test stage's evidence folder, `outputRoot/evidence` from `<settings-test>`), `<plan-sha256>` (the hash the approver signs) and `<run-name>` (the month, such as `2026-11`).

## Stage 1: the test tenant

### Step 1: Sign in and run the pre-flight

```powershell
Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes SecurityIncident.Read.All,ThreatHunting.Read.All,CustomDetection.ReadWrite.All
./deploy/Test-XdrPreflight.ps1 -SettingsPath <settings-test> -Stage test -OutputPath out/test/preflight
```

In fixture mode:

```powershell
./deploy/Test-XdrPreflight.ps1 -SettingsPath deploy/tests/fixtures/settings.test.json -Stage test -EnvironmentFixture deploy/tests/fixtures/environment-test.json -OutputPath out/test/preflight -AsOf 2026-11-16T12:00:00Z
```

```text
PF-01  Pass  settings for test read; cloud gcc; detections deploy via graph
PF-02  Pass  Microsoft.Graph.Authentication installed
PF-03  Pass  Graph session in Global, tenant 00000000-0000-0000-0000-00000000c0de
PF-04  Pass  granted: CustomDetection.Read.All, SecurityIncident.Read.All, ThreatHunting.Read.All, CustomDetection.ReadWrite.All
PF-05  Pass  incidents-list answered with the reader's permissions
PF-06  Pass  output root writable
```

Any `Fail` stops the stage. Record the pre-flight:

```powershell
./Invoke-XdrEvidence.ps1 -EvidencePath out/test/evidence -RunPath out/test/preflight -ChangeRecord CHG-TEST-0001
```

### Step 2: The first scheduled run

```powershell
./deploy/Invoke-XdrScheduledRun.ps1 -SettingsPath <settings-test> -RunName <run-name>
```

In fixture mode:

```powershell
./deploy/Invoke-XdrScheduledRun.ps1 -SettingsPath deploy/tests/fixtures/settings.test.json -RunName 2026-11 -EnvironmentFixture deploy/tests/fixtures/environment-test.json -AsOf 2026-11-16T12:00:00Z
```

```text
Task       Result Record
access     Fail   0002
coverage   Fail   0003
prevention Fail   0004
asr        Fail   0005
exposure   Fail   0006
incidents  Fail   0007
detections Fail   0008
signals    Pass   0009
automation Fail   0010
metrics    Pass   0011
```

The fixtures carry each chapter's faults, so most checks fail. In a test tenant, each `Fail` is a list of findings in its run folder; close them (tickets, plan corrections, role changes) before the go/no-go.

### Step 3: Publish the detections, dry run first

```powershell
./deploy/Publish-XdrDetections.ps1 -SettingsPath <settings-test> -PlanPath out/test/<run-name>/detections/plan.json -OutputPath out/test/publish-dry-run
Get-Content out/test/<run-name>/detections/plan.sha256
```

In fixture mode:

```text
Rule                              Action Method Status
contoso-lsass-dump-tool           create POST   planned (dry run)
contoso-office-encoded-powershell update PATCH  planned (dry run)

03c9e3fc5de4b2694f88ebd9166cfc41c0a667f27c3a05ee44320f3e26ca03c8  plan.json
```

The detection engineer and the approver read `plan.json` and record the SHA-256 in the change record. Then apply it, with that hash:

```powershell
./deploy/Publish-XdrDetections.ps1 -SettingsPath <settings-test> -PlanPath out/test/<run-name>/detections/plan.json -OutputPath out/test/publish -Apply -ApprovedSha256 <plan-sha256>
./Invoke-XdrEvidence.ps1 -EvidencePath <test-evidence> -RunPath out/test/publish -ChangeRecord CHG-TEST-0001
```

A plan changed after approval is refused. Live, the script pauses after every 10 creates, Learn's quota of 10 a minute per application.

### Step 4: The smoke test

Run one synthetic event from the guide's [synthetic events](../../../books/guides/defender-xdr-implementation.md#synthetic-events) table on a ring 0 device, under the change record: the replay behind a newly published rule's known-bad window. Within the rule's schedule, an alert with detection source *Custom detection* appears. Then re-run the detection check to confirm the deployed rules match the repository:

```powershell
./Invoke-XdrDetections.ps1 -SettingsPath <settings-test> -OutputPath out/test/detections-after
```

The plan should now hold no `create` or `update` for the published rules.

### Step 5: Move one ASR ring, by hand, from the kit's value

The change board takes `out/test/<run-name>/asr/oma-uri/ring1-next.txt` (Chapter 04) and the operator puts it in the ring 1 policy in Intune: **Endpoint security** > **Attack surface reduction**, the ring's policy, or the custom profile's OMA-URI. Then the plan file is updated with the change record's date, and, after the devices check in, the ASR check is run again:

```powershell
./Invoke-XdrAsr.ps1 -SettingsPath <settings-test> -OutputPath out/test/asr-after
```

`device-checks.csv` should show the new modes on ring 1's devices.

### Step 6: Plan the rollback before you need it

```powershell
./deploy/Invoke-XdrRollback.ps1 -SettingsPath <settings-test> -PublishPath out/test/publish -AsrRunPath out/test/<run-name>/asr -OutputPath out/test/rollback-plan
```

In fixture mode:

```text
Rule                              Action  Request
contoso-lsass-dump-tool           disable PATCH /security/rules/detectionRules/contoso-lsass-dump-tool
contoso-office-encoded-powershell disable PATCH /security/rules/detectionRules/contoso-office-encoded-powershell

Rollback plan 31020e32845c02c47cba708abe5debfed25194be170c495976f74013aa97d34a: 2 detection(s) to disable; ASR values as they were for ring0, ring1, ring2, ring3, servers.
```

The plan disables every rule the stage created or enabled (the guide's G7 rollback), and keeps each ring's ASR value from the run before the change in `oma-uri/<ring>-back.txt` (the guide's G4 rollback: one stage back). Applying it is the same two-step as publishing: a dry run, then `-Apply` with the plan's approved SHA-256:

```powershell
./deploy/Invoke-XdrRollback.ps1 -SettingsPath <settings-test> -PlanPath out/test/rollback-plan/plan.json -OutputPath out/test/rollback
```

The ASR values go back into Intune by hand. Microsoft prefers an exclusion to a step back; a rollback is for a broken change, not one noisy rule.

## The go/no-go

```powershell
./Invoke-XdrEvidence.ps1 -EvidencePath <test-evidence> -Check -Stage test
```

In fixture mode, after steps 1 to 3:

```text
SUMS               Pass  96 files match SHA256SUMS
CHAIN              Pass  13 records, chain unbroken
STEP-PRE           Pass  a passing record covers it
STEP-ACCESS        Fail  recorded, but the run's own check failed: close its findings and run it again
STEP-COVERAGE      Fail  recorded, but the run's own check failed: close its findings and run it again
STEP-PREVENTION    Fail  recorded, but the run's own check failed: close its findings and run it again
STEP-ASR           Fail  recorded, but the run's own check failed: close its findings and run it again
STEP-DETECTIONS    Fail  recorded, but the run's own check failed: close its findings and run it again
STEP-PUBLISH       Pass  a passing record covers it
STEP-RUN           Pass  a passing record covers it
```

**No-go** in fixture mode, as it should be. Go needs every row `Pass`: the test stage's findings closed and the checks run again, the smoke test's alert, the rollback plan filed, and the ISSO's signature on the change record *(design guidance)*.

## Stage 2: production

The production pre-flight adds PF-07: the test stage's go/no-go must pass.

```powershell
./deploy/Test-XdrPreflight.ps1 -SettingsPath <settings-production> -Stage production -TestEvidencePath <test-evidence> -OutputPath out/production/preflight
```

In fixture mode, PF-07 refuses:

```text
PF-07  Fail  the test stage's go/no-go fails: STEP-ACCESS, STEP-COVERAGE, STEP-PREVENTION, STEP-ASR, STEP-DETECTIONS
```

Once it passes, repeat Steps 2 to 6 with `<settings-production>`, one ring at a time for any ASR or prevention change, in the endpoint change board's window, with the backout triggers the guide's G3 sets. The production go/no-go is the same command with `-Stage production`, which also needs exposure, incidents, signals, automation and the metrics.

## The monthly schedule

Register the scheduled run inside the boundary, every four weeks (without `-RunName`, each run is named for its month), under an account that signs in through PIM or a managed identity, for example with Task Scheduler:

```powershell
$a = New-ScheduledTaskAction -Execute pwsh -Argument "-NoProfile -File $PWD/deploy/Invoke-XdrScheduledRun.ps1 -SettingsPath <settings-production>"
$t = New-ScheduledTaskTrigger -Weekly -WeeksInterval 4 -DaysOfWeek Monday -At 6am
Register-ScheduledTask -TaskName DefenderXdr-Monthly -Action $a -Trigger $t
```

The month's `metrics.md`, `records.csv` and `SHA256SUMS` go to the ISSO (Chapter 08).

## Federal requirements and evidence

| Step | What it supports | KSI | What the ISSO keeps |
|---|---|---|---|
| Pre-flight (PF-01 to PF-07) | AC-6 (the session holds only the needed scopes), CM-3 (the change is checked before it runs) | KSI-IAM-ELP, KSI-CMT-LMC | `preflight/results.json`, its record |
| Scheduled run | CA-7 | KSI-MLA-EVC | Each run's folder and record; the `scheduled-run` record |
| Publish | CM-3, SI-4 | KSI-CMT-LMC, KSI-MLA-OSM | `publish/results.json`, the approved plan and its SHA-256 |
| Rollback | CM-3, IR-4 | KSI-CMT-LMC, KSI-INR-RIR | `rollback-plan/plan.json`, `rollback/results.json` |
| Go/no-go | CA-7, AU-9 | KSI-MLA-EVC, KSI-MLA-OSM | The `-Check -Stage` output with the change record |

The pairs are `config/requirements.json`'s, from the guide's rows. KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its evidence up with them and doesn't report them. The kit's records support these controls; the assessor decides them *(design guidance)*.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| Production before the test stage passes | Untested detections and rings in production | PF-07 |
| A plan edited after approval | Something nobody approved is deployed | `-ApprovedSha256` |
| A session in the wrong tenant | Production changes from a test run, or the reverse | PF-03 and the plan's tenant check |
| The `detectionRules` API unavailable in GCC | Publish fails part way | `deployVia: portal` from the same files |
| A rollback written during the outage | Guesswork under pressure | Step 6 plans it before go |
| A detection that isolates on its own | A server or emergency account contained | Chapter 06 holds any rule with automated actions |

## Checklist

- [ ] Two settings files, filled, filed with the change record; no secret in either.
- [ ] The test pre-flight passes and is recorded.
- [ ] The detection plan's SHA-256 is approved before `-Apply`.
- [ ] The smoke test's alert appears.
- [ ] The rollback plan exists before go.
- [ ] `-Check -Stage test` passes every row before production.
- [ ] The production pre-flight's PF-07 passes.
- [ ] The monthly run is scheduled and its first package reached the ISSO.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 08 — The Monthly Evidence Run](08-the-monthly-evidence-run.md) · [Workbook index](index.md)
:::
