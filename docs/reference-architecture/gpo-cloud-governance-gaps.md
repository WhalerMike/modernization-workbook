---
title: "GPO-to-Cloud Governance Gaps"
subtitle: "What Enterprises Lose in Control and Governance When Group Policy Moves to Intune/Entra"
date: 2026-06-10
format:
  html:
    toc: true
    toc-depth: 3
  docx:
    toc: true
lifecycle: aspirational
lifecycle_review: 2026-12-10
aliases:
  - /customer-documents/reference-architecture/gpo-cloud-governance-gaps.html
---


::: {.callout-note}
## Why this page exists

Most large customers understand the *benefits* of moving from Group
Policy to Intune/Entra — cloud scale, remote device management, modern
security baselines, less on-prem infrastructure. Far fewer internalize
the **governance and control trade-offs** until they are deep in the
migration or already living with the post-migration operating model.

This page names the capabilities that are commonly **lost or
significantly weakened** in the GPO-to-cloud shift, and describes how the
migration is actually progressing in large and regulated environments.
It is a framing document, not a how-to: the per-capability mechanics
live in the linked canon and reference pages.

This page takes the **GPO device-policy plane** lens specifically. For
the broader structural argument that the AD→Entra gap is structural
rather than technical, see
[AD to Entra ID — The Structural Migration Problem](../whitepapers/ad-to-entraid-migration-problem.md);
for the tool-by-tool comparison (including Group Policy Analytics), see
The Federal Modernization Program vs Microsoft Native Tools.
This page does not restate their claims — it focuses on *what is lost in
the policy plane*.
:::

## The short answer: do customers know what they're going to lose?

**Partially, at best.** The benefits of Intune/Entra are well
advertised and well understood. The governance cost is not — it tends
to surface unevenly, and usually *after* the targeting model has
already changed underneath the organization.

The net effect is a shift from **hierarchical, structure-driven
governance** (OU tree + GPO links + inheritance) to **attribute-driven,
intent-based governance** (dynamic groups, assignment filters, Settings
Catalog). That shift is more flexible on paper and much harder to
govern consistently at scale without a strong canonical model
underneath it. The organizations that feel the loss earliest and most
acutely are exactly the ones trying to *maintain or improve* strong,
deterministic, auditable governance through the transition.

The rest of this page breaks that down: first what is lost, then how
the migration is actually going.

## What is lost or significantly weakened

The losses cluster into five areas. None of them is a reason to stay on
Active Directory — they are the governance surface that has to be
*re-created intentionally* on the cloud side rather than assumed.

| Lost / weakened capability | On-prem GPO model | Cloud (Intune/Entra) default | Where it bites |
|---|---|---|---|
| Granular, deterministic targeting + inheritance | OU hierarchy, block inheritance, enforcement, loopback | Dynamic groups, assignment filters, Settings Catalog | "Single source of truth" for *why* a device gets a policy is lost |
| Fine-grained control over legacy/complex settings | Full ADM/ADMX + GP Preferences surface | ~30–60% direct Intune equivalents (varies widely) | Functionality gaps, workarounds, extended hybrid |
| Visibility, troubleshooting, drift detection | `gpresult`, RSOP, centralized, near-immediate | Asynchronous check-in, cloud-dependent, cross-plane gaps | Drift becomes harder to see and remediate |
| Delegation, auditing, change management | OU-scoped GPO create/edit/link delegation | Intune RBAC, policy ownership, scope tags | Traditional GPO teams find the model less familiar/granular |
| Predictable, low-latency enforcement | Known refresh cycles, cached, works offline | Device check-in + connectivity dependent | Operational timing assumptions change |

### Granular, deterministic targeting and inheritance

Traditional GPO plus an OU structure gave powerful, predictable control
rooted in organizational hierarchy — block inheritance, enforcement,
loopback processing, link order. The cloud model shifts that weight onto
**attribute-based dynamic groups, assignment filters, and Settings
Catalog policies**. That is more flexible, but the determinism is no
longer free: it has to be *manufactured* by a canonical attribute model.
Without one, organizations lose the "single source of truth" feeling for
why a given device or user receives a particular policy, and group
membership quietly becomes a manual spreadsheet exercise.

### Fine-grained control over legacy and complex settings

Microsoft's **Group Policy Analytics** is the standard starting point:
export GPOs as XML, import them, and read the MDM-support percentage.
In practice it typically reports that only **30–60%** of settings (often
lower) have a direct Intune equivalent. The remainder — many Group Policy
Preferences, certain custom/legacy ADM/ADMX settings, complex security
configurations, and app-specific tweaks — has no one-to-one mapping.
Organizations either lose the functionality, accept a workaround
(Administrative Templates, Settings Catalog, PowerShell, custom
profiles), or carry hybrid/co-management longer than planned.

::: {.callout-tip}
## Triage the surface before you assume the gap

The exact percentage is environment-specific. Measure it rather than
guessing: `Invoke-GpoMigrationTriage`
classifies every live GPO onto a target plane (Intune for workstation
scope, Azure Arc for server scope) and sizes each setting against its
most-likely Settings Catalog / Guest Configuration destination, so the
genuinely unmappable surface is named explicitly instead of discovered
late.
:::

### Visibility, troubleshooting, and drift detection

On-prem GPO had mature, near-immediate tooling — `gpresult`, RSOP,
centralized reporting. Intune policy application is more asynchronous and
cloud-dependent, and **cross-plane** visibility (how an identity change
ripples into device policy, server workloads, applications, and data
access) is weak natively. Drift becomes harder to *detect*, let alone
remediate. This is precisely the gap a drift engine fills, surfacing
drift as explicit `DRIFT-*` findings rather than silent
divergence.

### Delegation, auditing, and change management

On-prem delegation was well understood: who can create, edit, or link a
GPO, at which OU level. The cloud equivalent — Intune roles, RBAC,
policy ownership, scope tags — is a different shape, and to traditional
GPO teams it can feel less granular or less auditable. The
[Delegation](delegation.md) reference covers how a
delegation boundary is carried forward so scope is canonical rather than
reconstructed per-admin.

### Predictable, low-latency policy enforcement

GPO refresh cycles were well known and worked offline/cached. Cloud
policies depend more on device check-in and internet connectivity, which
changes operational assumptions about *when* a policy is actually in
force. This is rarely a blocker, but it is an assumption that has to be
re-set with the operations team during cutover.

## How the GPO migration is actually going

**Progress is real but slow and uneven**, especially for large, complex,
or regulated enterprises.

- **Tooling exists and is improving.** Group Policy Analytics is the
  standard on-ramp, and the "Migrate" feature translates the supported
  subset into Settings Catalog policies.
- **Typical outcomes.** 30–60%+ of settings migrate with reasonable
  effort (highly environment-dependent); the rest require manual
  recreation, an alternative approach, or accepted reduced functionality.
  Many organizations land in long-term **hybrid / co-management** rather
  than a clean cloud-native end state.
- **Large-enterprise reality (2025–2026).** Migration is phased and
  multi-year for estates with hundreds or thousands of GPOs, legacy
  applications, intricate OU structures, and regulatory requirements.
  Common blockers: testing burden, policy conflicts during transition,
  the skills shift (GPO admins learning endpoint management), and the
  targeting-model change above. Practitioner feedback shows ongoing
  weekly/monthly migration work rather than big-bang cutovers — often
  with GPO rationalization and cleanup happening *before* migration.
- **Federal / regulated environments.** Slower still — compliance
  validation, GCC/GCC-High considerations, and the need for auditable
  governance throughout the transition. Many are deliberately building a
  governance layer *on top of* the Microsoft surfaces because the native
  capabilities feel insufficient for their risk posture.

::: {.callout-note}
## Sourcing note

The "30–60%" figure and the "Migrate" feature behavior are properties of
Microsoft's **Group Policy Analytics**, not the Federal Modernization Program canon — treat the exact
percentage as environment-specific and confirm it against your own
analytics export. The provenance discipline here follows the substrate
SSOT rule: external facts are authoritative only at their source.
:::

## Bottom line

Large customers are **not uniformly aware** of the full governance and
control implications until they are deep in migration or already
post-migration. The migration itself is progressing, but it is rarely a
clean lift-and-shift — it is a multi-year transformation that changes the
fundamental nature of policy governance from hierarchical/on-prem to
dynamic/cloud-native. Many organizations discover that they need
**additional governance architecture** — not just more licenses or a
basic IGA tool — to avoid losing critical control and visibility.

## Where to go next

- **Triage the legacy GPO surface:** Invoke-GpoMigrationTriage
- **Whole-of-transition framing:** [Modernization Canon (section index)](index.md)
- **Structural-gap argument:** [AD to Entra ID — The Structural Migration Problem](../whitepapers/ad-to-entraid-migration-problem.md)
- **Tool-by-tool comparison:** the Federal Modernization Program vs Microsoft Native Tools
