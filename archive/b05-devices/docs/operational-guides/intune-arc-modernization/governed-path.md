---
title: "Intune + Azure Arc — Governed Path (the Federal Modernization Program)"
subtitle: "The same modernization end state, bound to canon governance: control-plane-governs-data-plane, the L0–L4 actuation ladder, and the drift-detection loop"
doc-type: operational-guide
audience: [Customer, Operator, Technical]
author: Michael Stratton
date: "June 2026"
status: Active
repo-path: docs/customer-documents/operational-guides/intune-arc-modernization/governed-path.qmd
created-at: 2026-06-08
updated-at: 2026-06-08
format:
  html:
    toc: true
    toc-depth: 3
lifecycle: adopted
tiers_adopted: [1]
lifecycle_review: 2026-12-08
---

# Intune + Azure Arc — Governed Path (the Federal Modernization Program) {.unnumbered}

The governed path reaches the **same end state** as the
[manual path](manual-path.md) — Arc-onboarded servers, Intune-enrolled
endpoints, NTLM eliminated, SPNs clean, SQL hardened, Conditional Access
enforced — but binds every change to organizational intent. The
[same scripts](manual-path.md) run; you add an actuation rung and a recorded
approval.

::: {.callout-important title="What the Federal Modernization Program is (and what these docs do not invent)"}
**The Federal Modernization Program** is the *Unified Identity-Addressing-Overlay Architecture* — an **active
reconciliation control plane** that *governs* provider data planes, per
the program decision. It is **not** "Unified IT
Architecture Oversight" or "Universal Identity and Access Operations," and it is
not a five-product suite layered over Azure. It holds desired state, observes
actual state, classifies drift, and reconciles toward intent. The providers
(Entra, Intune, Azure Policy, AD) remain the runtime data planes; the Federal Modernization Program is on the
truth-and-reconciliation side of that line.
:::

## 1. The one rule: control plane governs, data plane executes

Active Directory conflated the directory (truth) with the domain controller (the
in-path enforcer). The modern split keeps them separate, and the Federal Modernization Program is deliberately
on the truth side:

> The Federal Modernization Program **governs** — it holds desired state, observes actual state, classifies
> drift, and reconciles toward intent. The provider **executes** at runtime — it
> authenticates, authorizes, routes, resolves, or stores. A modernization
> adapter MAY make change-making calls into a provider's *management* surface; it
> MUST NOT sit inline in the authentication or request path.

Every script in this kit obeys that line: `Invoke-ArcOnboarding` calls the Azure
management plane; `Deploy-ConditionalAccessBaseline` calls the Graph policy API;
none of them sit in a runtime auth path.

## 2. Providers are incorporated, not replaced

Each provider in this kit is a **seat-holder** governed through the
provider-incorporation contract, not displaced:

| Provider (data plane) | Role at runtime | How the Federal Modernization Program governs it |
|---|---|---|
| Microsoft Entra ID | authenticates, enforces CA | desired CA + identity state; drift vs canon |
| Microsoft Intune | enrolls, enforces device policy | desired profile/compliance state; posture observe |
| Azure Policy / Arc | evaluates Guest Configuration | desired baseline; compliance reconcile |
| Active Directory | issues Kerberos tickets, holds SPNs | NTLM/SPN desired state; audit + repair plan |

The Federal Modernization Program does not reimplement any of these functions. It reconciles their state
against canon and emits evidence.

## 3. The actuation maturity ladder

Every governed operation declares a rung. The rung is a property of the
operation, not a global switch. **The federal default write ceiling is L3** —
autonomous (L4) actuation is refused in-boundary.

| Rung | Name | Meaning | In this kit |
|---|---|---|---|
| L0 | Record | desired state in canon only | the modernization spine table |
| L1 | Observe | collect actual state, detect drift (read-only) | NTLM/SPN/SQL/Intune audits, drift report |
| L2 | Advise | generate the corrective change-set, surface it | the `-WhatIf` previews |
| L3 | Gated | a human approves; the Federal Modernization Program executes via the provider API | every state-changing script with `-ApprovalRef` |
| L4 | Auto | the loop closes without a human | **above the ceiling — refused** |

`Assert-GovernanceApproval` enforces this: it refuses any write above the
ceiling, refuses a gated write with no approval reference, and logs every
decision.

## 4. The reconciliation loop

The governed path runs the modernization domains through the drift-detection
loop rather than as one-shot scripts. The loop is six phases —
**Snapshot → Compare → Classify → Alert → Remediate → Verify** — `dry_run` by
default, with high-blast-radius operations gated for governance review.

The kit's read-only scripts are the **Snapshot/Compare/Classify** steps for each
domain:

- `Compare-ConditionalAccessDrift.ps1` — CA domain (Snapshot + Compare).
- `Get-ModernizationDriftReport.ps1` — whole-estate observe across domains.
- the per-domain audits (`Get-NtlmAudit`, `Repair-Spn` audit mode,
  `Invoke-SqlHardeningAudit`, `Get-IntuneEnrollmentStatus`) — per-domain Compare.

**Remediate/Verify** is the gated (L3) write: the same script, re-run with
`-ApprovalRef` once a human approves the surfaced change-set.

## 5. Mapping the draft's model to canon

The source "WITH-GOVERNANCE" draft described the Federal Modernization Program as five products. Those concepts
exist in canon — but as machinery already named, not new components:

| Draft term | Canon equivalent |
|---|---|
| "Policy Engine" | desired state in canon + `plan / apply / reconcile` adapters (the program decision–039) |
| "Identity Registry" | the identity control-plane slot |
| "Attestation Service" | the Drift Detection Engine (the program decision), six-phase, dry-run default |
| "Audit Ledger" | the provenance-anchored evidence pipeline (every artifact cites the canon id + version it derives from) |
| "Access Orchestrator" | enforcement adapters bound to a control-plane slot (provider-incorporation contract) |

Use the canon terms. The shape the draft reached for is right; the names and the
acronym were not.

## 6. Running the governed path

Identical run order to the [manual path](manual-path.md#0-phases-and-run-order),
with two additions on every state-changing call:

```powershell
Import-Module .\lib\IntuneArcModernization.psm1
# observe (L1) — same as manual
.\scripts\Get-NtlmAudit.ps1 -DaysBack 30 -OutputPath .\artifacts\ntlm-audit.csv

# gated actuation (L3) — approval required; a write without approval is refused
.\scripts\Invoke-ArcOnboarding.ps1 -SubscriptionId $sub -ResourceGroup rg-arc-servers -Location eastus `
    -ApprovalRef 'CR0012345' -WhatIf
.\scripts\Set-NtlmRestriction.ps1 -Level 5 -ApprovalRef 'CR0012346' -WhatIf

# verify (L1)
.\scripts\Get-ModernizationDriftReport.ps1 -ArtifactPath .\artifacts
```

To forbid autonomous actuation explicitly in a tightened boundary, lower the
ceiling in `Assert-GovernanceApproval` (`-ActuationCeiling`). The default is L3.

## 7. Outcomes the governed path adds

Over the manual end state, the governed path delivers:

- every modernized resource traceable to a recorded approval;
- no Conditional Access change outside a gated, logged workflow;
- continuous, exportable **evidence** (provenance-anchored, not assembled at audit time);
- drift caught and classified by the loop rather than discovered by incident.

If you have not yet stood up a control plane, build the [manual path](manual-path.md)
now and adopt the governed path later — the work you do now carries forward.

## 8. Rollback

The governed path layers governance on top of the same operational back-outs as the
manual path. Roll back in two layers if needed.

**Operational back-out (same as [manual path §9](manual-path.md#9-rollback)):**

- **Intune:** un-enroll devices and re-apply the GPO baseline.
- **Arc:** `azcmagent disconnect` then uninstall the agent.
- **Conditional Access:** keep policies report-only until validated; the
  break-glass accounts are the emergency exclusion.
- **NTLM:** revert `LmCompatibilityLevel` to 3 if a missed dependency surfaces —
  this is exactly why the audit gate exists.

**Governance-seam back-out:**

- **Approval enforcement:** lower `Assert-GovernanceApproval` to record-only
  (`-ActuationCeiling L1`) to halt gated writes without disrupting the observers.
- **Loop suspension:** stop the scheduled `Compare-*` and `Get-ModernizationDriftReport`
  runs; the underlying provider state is unaffected.

Rolling back the governance seam does **not** require re-onboarding, re-enrollment,
or undoing any Intune / Arc / CA work. The operational state is always owned by
the provider.

## 9. Boundary impact

::: {.callout-important title="Federal boundary ceiling: L3 (Gated)"}
The **federal default write ceiling is L3** — `Assert-GovernanceApproval` refuses
any write declared at L4 (Autonomous). No script in this kit closes the loop
without a human-supplied `-ApprovalRef`. The L3 ceiling is the default; it can
only be raised by deliberate configuration outside this kit.
:::

::: {.callout-note title="FedRAMP Moderate scope"}
This kit targets **FedRAMP Moderate** baseline controls: Conditional Access
policies enforce compliant device and MFA (Entra P1); Defender for Servers Plan 2
and Defender for SQL are included at Moderate. Risk-based Conditional Access
(Entra P2), PIV-only enforcement, FIPS-validated cryptography, and extended
logging retention are **not** in scope here — those belong to a FedRAMP High
posture and are handled through separate controls.
:::

::: {.callout-note title="What this kit evidences under FedRAMP 20x"}
Under FedRAMP 20x the assessed artifact is Key Security Indicator evidence
against the **CR26** catalog (46 indicators, 10 themes), mandatory for all
FedRAMP stakeholders from **2027-01-01**. This kit's governed path produces
evidence for a bounded slice of that catalog:

| CR26 indicator | Evidenced by |
|---|---|
| **KSI-IAM-APM** | `Deploy-ConditionalAccessBaseline.ps1` — MFA and compliant-device enforcement |
| **KSI-IAM-ELP** | Scoped assignment rather than tenant-wide |
| **KSI-SVC-ACM** | `Set-ArcPolicyBaseline.ps1` — automated configuration management on Arc-enrolled servers |
| **KSI-CNA-EIS** | `Compare-ConditionalAccessDrift.ps1` — enforcing intended state, continuously |
| **KSI-CMT-LMC** | `-ApprovalRef` provenance on every state-changing run — changes logged and attributable |
| **KSI-MLA-EVC** | `Get-ModernizationDriftReport.ps1` — evaluating configurations against a baseline |

Indicators this kit does **not** evidence, and should not be cited for:
recovery planning (KSI-RPL), supply chain risk (KSI-SCR), cybersecurity
education (KSI-CED), and incident-response process (KSI-INR). The Federal Modernization Program
substrate does carry rules for these themes, but their evidence comes from
sources outside this kit's Intune/Arc surface — contingency-plan review
records, SBOM/VDR tooling, training records, SOAR playbooks.
The **manual path** produces the same Microsoft-surface end state but no
`-ApprovalRef` provenance chain, so it does not evidence KSI-CMT-LMC — that
is the governance seam, and it is the reason the governed path exists.
:::
