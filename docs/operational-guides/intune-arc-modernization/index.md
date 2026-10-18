---
title: "Intune + Azure Arc Modernization"
subtitle: "Endpoint and server modernization on a Hybrid AD → Entra ID estate — runnable two ways: a manual path, and a Federal Modernization Program/the organizational-attribute model-governed path"
doc-type: operational-guide
audience: [Customer, Operator, Technical]
author: Michael Stratton
date: "June 2026"
status: Active
repo-path: docs/customer-documents/operational-guides/intune-arc-modernization/index.qmd
created-at: 2026-06-08
updated-at: 2026-06-08
format:
  html:
    toc: true
    toc-depth: 2
lifecycle: adopted
tiers_adopted: [1]
lifecycle_review: 2026-12-08
---

# Intune + Azure Arc Modernization {.unnumbered}

This kit is the device- and server-plane workstream of **OrgMod**, the
modernization expression of the Federal Modernization Program substrate (see the
OrgMod hub).

This kit modernizes a Hybrid Active Directory estate onto **Microsoft Intune**
(workstations) and **Azure Arc** (servers), and closes out the identity work
that rides alongside it — NTLM elimination, SPN hygiene, SQL Server hardening,
and a Conditional Access baseline. It names only platforms the agency already
runs: Entra ID, Intune, Azure Arc, Azure Policy, Defender, and Active Directory.

It is runnable **two ways from the same scripts**:

- a **[manual path](manual-path.md)** — you preview each change with `-WhatIf`
  and own the decision under local change control; and
- a **[the Federal Modernization Program / the organizational-attribute model-governed path](governed-path.md)** — every change is
  bound to an organizational path, an actuation rung, and a recorded approval.

If you build the manual path now and want governance later, you do **not** redo
the work — see **Add the organizational-attribute model later (retrofit)**.

::: {.callout-tip title="Download the runnable kit"}
The companion **Intune + Azure Arc Modernization Kit**
ships these pages alongside an implementation-path guide, a shared PowerShell
module, and twelve Microsoft Graph / Az scripts (Arc onboarding + baseline,
Intune auto-enrollment + posture, NTLM audit + restriction, SPN repair, SQL
hardening audit, CA baseline + drift, a cross-domain status roll-up, and an
the organizational-attribute model survey helper for the retrofit). Every state-changing script honors
`-WhatIf`.
:::

## The pages

| Page | What it covers |
|---|---|
| [Manual path](manual-path.md) | The end-to-end technical runbook with no governance control plane — Arc onboarding, Intune enrollment, NTLM/SPN/SQL hardening, Conditional Access, monitoring, and rollback. Each operator owns the decision. |
| [Governed path (the Federal Modernization Program / the organizational-attribute model)](governed-path.md) | The same end state, bound to canon governance — control-plane-governs-data-plane, the organizational-attribute model scoping, the L0–L4 actuation ladder, the drift-detection loop, and evidence. |
| Add the organizational-attribute model later (retrofit) | For estates already built the manual way: how to layer the organizational-attribute model governance on top **without** re-doing the Intune/Arc work. |

## How the two paths relate

The manual path and the governed path produce the **same configuration** on the
Microsoft surface. The governed path adds the binding from organizational intent
to technical change: who owns it, what authorizes it, and how drift is caught.

![Two ways to run the same kit: the manual path executes directly under local change control; the governed path binds every change to an the organizational-attribute model, an actuation rung, and an approval before the same script runs. Both converge on the same end state.](images/intune-arc-diagram-01-two-paths.png){#fig-two-paths fig-alt="Side-by-side flow comparing the manual path and the governed path converging on the same Intune/Arc end state"}

## A note on terminology {#terminology}

In this repository, **the Federal Modernization Program** is the *Unified Identity-Addressing-Overlay
Architecture* — an **active reconciliation control plane** that *governs*
provider data planes (Entra, Intune, Azure Policy, AD) per
the program decision. It holds desired state,
observes actual state, classifies drift, and reconciles toward intent; it is
**not** an inline runtime component and does not replace the providers.
**the organizational-attribute model** is the organizational path carried by every governed object so its
state is addressable in the same terms across every plane. The governed path
below is written to that definition.
