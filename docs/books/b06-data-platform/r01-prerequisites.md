---
title: "Runbook R01 — Prerequisites & Using This Companion"
description: "Where to start with the runbooks: the program's toolchain (the read-only discovery Spec scripts and the FMPSqlServerMigration, FMPIdentityAssessment and FMPPlanGenerators PowerShell modules), the provenance-sealed evidence envelope every function emits, the read-only versus review-required safety model, the offline snapshot pattern, and the run order that chains Runbooks R02 to R10. It changes nothing."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b06-data-platform
book: B06
part: How
series-order: 101
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Runbook R01 — Prerequisites & Using This Companion

*The narrative says why; the runbooks say what you install, what the evidence looks like, what is safe to run, and in what order.*

::: {.callout-note}
## In this runbook
The toolchain the later runbooks assume, the evidence envelope every function emits, the bright line between read-only functions and review-required ones, how to run the whole chain offline against captured snapshots, and the order in which Runbooks R02 to R10 run. Everything here is setup or orientation. It provisions nothing and changes no production state.
:::

**Pairs with:** [Chapter 01 — What Windows Authentication Actually Is](01-what-windows-authentication-actually-is.md) and [Chapter 02 — Why the Inheritance Must End](02-why-the-inheritance-must-end.md). Those chapters open with the inheritance: why a twenty-year Windows-authentication estate exists and why it has to change. This runbook is their executable counterpart.

## What the runbooks automate

The narrative chapters stay conceptual; the runbooks are the executable layer. Each later runbook documents the program's real script behind its step, not a paraphrase. The automation lives in two places in the program's repository: the read-only discovery **Spec family** under `tools/discovery/`, and the derivation and validation **PowerShell modules** under `tools/powershell/`. The tooling isn't published with this workbook; the paths in the runbooks are relative to the root of the program's repository, and the names follow the program's `FMP` prefix.

| Runbook | Program automation | Tier |
|---|---|---|
| [R02 — Estate discovery](r02-estate-discovery-and-consolidation-gate.md) | `Spec3-D1.8` / `Spec1-D1.5` / `Find-DbaInstance`, fused by `New-FMPEstateInventory` | read-only |
| [R03 — Authentication audit](r03-the-authentication-audit.md) | `Spec3-D1.8-Get-SQLServerAuthAudit` (plus the `Spec*-D1.*` family) | read-only |
| [R04 — Arc and managed identity](r04-arc-deployment-and-managed-identity.md) | `Test-FMPArcAgentStatus`, `Test-FMPArcManagedIdentityToken`, `Test-FMPArcSqlExtension`, `Invoke-FMPArcOnboarding` | validation read-only; onboarding review-required |
| [R05 — Login migration](r05-login-migration-and-parallel-run.md) | `New-FMPEntraLoginMapping`, `New-FMPEntraLoginScript`, `Test-FMPLoginParallelRun` | derive / dry-run |
| [R06 — NTLM remediation](r06-ntlm-detection-and-remediation.md) | `Spec3-D1.7` / `Spec1-D1.5`, `New-FMPSpnRemediationPlan`, `Get-FMPNtlmGpoReport` | audit-first |
| [R07 — Groups and AUs](r07-groups-aus-and-the-conditional-access-perimeter.md) | `Export-FMPEntraGroups`, `New-FMPEntraGroupClassification`, `New-FMPGroupLoginScript` | derive / dry-run |
| [R08 — Application chain](r08-application-chain-and-connection-strings.md) | `Spec3-D1.9`, `New-FMPAppConnectionPlan` | derive (connection-string change made in configuration) |
| [R09 — Continuous monitoring](r09-continuous-monitoring-and-closure.md) | `Spec3-D1.8` (scheduled), `New-FMPClosureRecord`, `Compare-FMPClosureRun` | read-only |
| [R10 — Certificates](r10-certificate-discovery-for-adcs.md) | `Spec3-D1.10`, `New-FMPSqlCertificatePlan`, `New-FMPPKIMigrationPlan` | read-only / analytical |

R01 has no script of its own: the conceptual opening has no executable layer. This runbook is the setup and orientation that the executable runbooks assume.

## Step 1 — Install the toolchain

- **PowerShell 7 or later** is the runtime the modules target; the program's Pester tests run under PowerShell 7.
- **A Python interpreter with only the standard library** (`python3` on `PATH`) is the one external dependency. The modules call it to compute the canonical integrity seal with `json` and `hashlib`, byte-for-byte identical to the program's canonical hash. The program's Python package isn't imported, so no editable install is needed to produce sealed evidence.
- **The discovery Specs** are plain PowerShell scripts under `tools/discovery/`; run them directly.
- **The modules** are imported from the repository root:

::: {.callout-warning}
## Illustrative, not tested against your estate
The commands in the runbooks are illustrative. They haven't been tested against a production forest, tenant or SQL Server estate. Review every command and script, run it first in a test environment, and route anything that changes state through change control.
:::

```powershell
Import-Module ./tools/powershell/FMPSqlServerMigration     # Runbooks R02, R04, R05, R06, R07, R08, R09, R10
Import-Module ./tools/powershell/FMPIdentityAssessment     # Runbook R07 group and Conditional Access export
Import-Module ./tools/powershell/FMPPlanGenerators         # Runbook R10 PKI sequencing
```

Live Azure and Microsoft Graph operations (Arc onboarding, Graph or Azure Resource Manager writes) also need the relevant command-line tools, `azcmagent` and the Azure CLI (`az`), and run only behind an explicit opt-in switch. Every function can be exercised offline without them.

## Step 2 — The evidence model

Every derivation and validation function emits a **provenance-sealed envelope**, not loose output:

- `schema` and `artifact_type` name the artifact; `data.records` holds the rows; `data` also carries per-artifact summary counts.
- `provenance` records the producing module and version, a UTC `timestamp`, and a `content_hash`.
- The **sealed data omits the timestamp**, so identical inputs yield an identical `content_hash`. Artifacts are reproducible, and a broken or unattributed envelope is a `DRIFT-PROVENANCE` finding by definition.

Write each step's envelope under a dated output directory and keep it under version control. That is what makes the scheduled runs in [Runbook R09](r09-continuous-monitoring-and-closure.md) comparable from one run to the next, and the whole chain auditable.

## Step 3 — The safety model

The runbooks draw one bright line, and the code enforces it:

- **Read-only and derivation functions run directly**: discovery, audits, classifications, plans, closure records, comparisons. They read captured or live-read inputs and change nothing.
- **State-changing functions are gated.** They either declare `SupportsShouldProcess` and default to planning only (`Invoke-FMPArcOnboarding` plans the `azcmagent connect` command unless you pass `-Execute` and confirm), or they generate a reviewable script or plan and execute nothing (`New-FMPEntraLoginScript`, `New-FMPGroupLoginScript`). The login and group script generators have no `-Server` or `-Execute` parameter at all; they never open a SQL connection.
- **No secrets are embedded.** Tenant, subscription, cloud, endpoints and credentials are all parameters. The cloud-aware functions accept the two Azure cloud names the Arc agent uses for US workloads, `AzureCloud` and `AzureUSGovernment`,[^r01-azcm-connect] resolve the matching audience, and fail closed on an unknown cloud. A GCC-Moderate tenant is a Microsoft Entra tenant in the public (commercial) cloud, and an Azure Government subscription can't be associated with a directory there,[^r01-gcc-identity] so the Arc resources that serve a GCC-Moderate tenant use `AzureCloud`; [Runbook R04](r04-arc-deployment-and-managed-identity.md) explains why that matters for SQL Server.

::: {.callout-warning}
## Production safety
Anything that touches **service accounts, SQL logins, SPNs, GPOs or the domain** changes a production security posture. Run discovery and the audit first (they are safe), generate the plan or script, capture it, and route it through change control and security review before any enforcement. The discovery scripts are read-only; the remediation steps are not.
:::

## Step 4 — The offline snapshot pattern

Every function accepts captured input, a JSON or CSV snapshot of a live read, so the entire chain can be exercised and tested without touching a live estate. Capture once (the `Spec*` audits, the `Export-FMP*` exports, `azcmagent show -j` for the agent's status as JSON,[^r01-azcm-show] a captured managed-identity token response), then run the derivations against the captured files. The program's Pester suite validates the modules the same way, fully offline.

## Step 5 — The run order

The runbooks chain; later runbooks operate on the surviving set the earlier ones define:

1. **[Runbook R02](r02-estate-discovery-and-consolidation-gate.md)** establishes the denominator and the retain / consolidate / retire **gate**. Only retain instances and consolidation targets go on.
2. **[Runbook R03](r03-the-authentication-audit.md)** audits the surviving set's authentication posture.
3. **[Runbook R04](r04-arc-deployment-and-managed-identity.md)** connects each retained host to Azure Arc and its Microsoft Entra identity; **[Runbook R05](r05-login-migration-and-parallel-run.md)** migrates its logins to Entra ID with a parallel-run window.
4. **[Runbook R06](r06-ntlm-detection-and-remediation.md)** eliminates the patterns that generate NTLM; **[Runbook R07](r07-groups-aus-and-the-conditional-access-perimeter.md)** transforms the group and access layer and the Conditional Access perimeter.
5. **[Runbook R08](r08-application-chain-and-connection-strings.md)** removes the stored credential in the application chain, the last mile.
6. **[Runbook R09](r09-continuous-monitoring-and-closure.md)** proves the posture and keeps it continuously; **[Runbook R10](r10-certificate-discovery-for-adcs.md)** discovers and sequences the certificate and AD CS dependencies that must not be decommissioned out from under SQL Server.

## Provenance

The runbooks introduce no new doctrine. They are the operational rendering of decisions the narrative chapters already make, chiefly the consolidation gate before any login migration ([Chapter 06](06-retain-consolidate-retire.md)) and Arc as the identity bridge for on-premises SQL Server ([Chapter 09](09-what-arc-provides-to-sql-server.md)). Each runbook names the specific Spec script or function it documents.

## Safety

This runbook installs and orients; it runs nothing against a live estate. The first action against production identity is in [Runbook R04](r04-arc-deployment-and-managed-identity.md) (Arc) and [Runbook R05](r05-login-migration-and-parallel-run.md) (logins), and only on the retain and target set that [Runbook R02](r02-estate-discovery-and-consolidation-gate.md) defines.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 23 — Epilogue: The Platform Question](23-epilogue-the-platform-question.md) · [Book index](index.md) · [Next: Runbook R02 — Estate Discovery & the Consolidation Gate →](r02-estate-discovery-and-consolidation-gate.md)
:::

[^r01-azcm-connect]: Microsoft Learn, "`azcmagent connect`," `--cloud` flag, <https://learn.microsoft.com/azure/azure-arc/servers/azcmagent-connect> (accessed Oct 20, 2026).

[^r01-gcc-identity]: Microsoft Learn, "Planning identity for Azure Government applications," frequently asked questions, <https://learn.microsoft.com/azure/azure-government/documentation-government-plan-identity#frequently-asked-questions> (accessed Oct 20, 2026).

[^r01-azcm-show]: Microsoft Learn, "`azcmagent show`," <https://learn.microsoft.com/azure/azure-arc/servers/azcmagent-show> (accessed Oct 20, 2026).
