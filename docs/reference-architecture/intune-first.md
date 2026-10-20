---
title: "Intune-First Asset Onboarding — Net-New Devices into Governance from Day Zero"
subtitle: "The Inverse of the AD Migration Path: Refuse the Existence of Any Ungoverned Device"
date: 2026-05-15
format:
  html:
    toc: true
    toc-depth: 3
  docx:
    toc: true
lifecycle: aspirational
lifecycle_review: 2026-11-22
aliases:
  - /customer-documents/reference-architecture/intune-first.html
---


::: {.callout-important}
## Scope: net-new devices only (per the program decision)

This page is the canon for **Intune-First Asset Onboarding** — the doctrine for devices that have *never* been on the network. For replacing GPOs on the **existing** fleet, see the [GPO Sunset Program](../operational-guides/target-surface/intune-policy-templates.md) (a different program, different stakeholders, different timeline). For the policy-authoring philosophy that governs how GPO Sunset Program authors replacement policies, see the [Policy Transformation Pattern](../client-server-to-hybrid-cloud/05-policy-transformation.md) ("regenerate, not copy"). Per [the program decision], "Intune-First" by itself is reserved for *this* page's net-new doctrine and should not be used to refer to the GPO replacement program.
:::

## What "Intune-First" Means

A net-new asset (laptop just unboxed, server just racked, phone just
issued) is governed by Intune — or, for servers, Azure Arc into the
same governance plane — from the moment it first powers on. There is
**no intermediate state** where the device:

- joins on-prem Active Directory and waits for a future migration,
- is provisioned by SCCM and later co-managed,
- runs without an organizational assignment,
- enters production without a compliance evaluation,
- or skips the procurement-side organizational positioning step.

This is the inverse of the [Directory Migration](../books/b02-identity/04-the-hidden-migration-surface.md)
path. Migration takes a device that already exists and brings it under
governance. Intune-First refuses the existence of any ungoverned device
in the first place.

## Why This Canon Exists

The Federal Modernization Program already had a mature canon for **migrating** AD-joined endpoints
into Entra ID + Intune (covered by the [Directory Migration](../books/b02-identity/04-the-hidden-migration-surface.md)
adapter family). What did not exist: the operational doctrine and
procurement-to-validation process for net-new assets.

The `intune-native/` sub-adapter slot
under `device-management/` had been registered but never authored.
Operationally, this meant net-new asset acquisition followed an
implicit pattern with three failure modes:

1. **Procurement-time organizational assignment was missed.** Devices ended
   up wherever the runtime user-derivation script placed them — not
   where procurement intended.
2. **Cross-platform inconsistency.** Windows had Autopilot; macOS,
   iOS, Android, and Arc-managed servers each had bespoke handling.
3. **Co-management drift.** Net-new Windows endpoints occasionally
   entered SCCM co-management because it was operationally convenient
   — each one a future migration ticket and a present compliance gap.

The Intune-First canon closes all three.

## The Five Doctrine Pillars

Per the program decision
and the full doctrine at `src/fmp/modernization/intune-first-onboarding/doctrine.md`:

| # | Pillar | What it asserts |
|---|---|---|
| 1 | **No ungoverned device, ever** | Every asset must be governance-enrolled before transitioning to production use. Quarantine (`/UNPOSITIONED`) is the safety valve, not the steady state. |
| 2 | **Procurement is the first governance step** | Asset organizational assignment is determined when the PO is issued, not when the device arrives. Procurement systems integrate with the governance pipeline as a peer of HR systems for user provisioning. |
| 3 | **Zero-touch only** | Manual enrollment is a controlled exception requiring written justification, compensating controls, a finite duration, and an audit entry. |
| 4 | **One management plane per asset; no co-management for new assets** | Intune for endpoints; Arc + Intune Settings Catalog for servers. No greenfield SCCM, no greenfield GPO, no greenfield HAADJ. |
| 5 | **Quarantine on failure; never silently degrade** | Onboarding failures produce a quarantine entry and a governance ticket — never a silently-degraded production device. |

## The Three Documented Exception Paths

Doctrine carve-outs for unavoidable cases. Each requires written
justification, compensating control, and an audit entry:

| Path | Applies to | Why it's permissible |
|---|---|---|
| **A — User-driven enrollment for BYOD** | Personally-owned devices being enrolled to a corporate work profile or partition (iOS user-enrolled, Android work-profile, Windows registered) | Refusing to govern BYOD at all would push users to entirely-unmanaged access via personal browsers. Governed at a lower assurance level is better than ungoverned. |
| **B — Linux endpoint with Arc fallback** | Linux endpoints that cannot use Microsoft Intune's Linux MDM surface (developer workstations requiring root, embedded Linux, air-gapped) | Microsoft's Intune Linux MDM is GA but limited; Arc + Azure Policy Guest Configuration is the substitute governance plane. |
| **C — Pre-Server-2025 Windows servers** | Windows Server 2019 and 2022 hosts whose OS upgrade is not yet feasible | the program decision explicitly notes Server 2019/2022 cannot use AADLoginForWindows. Arc-managed-only is acceptable as an interim state. |

Full text in `src/fmp/modernization/intune-first-onboarding/doctrine.md` §4.

## The Five-Phase Onboarding Process

Every net-new asset, regardless of platform, follows the same five
phases. What changes per platform is the vendor program used in
Phase 2 and the enrollment vector used in Phase 4.

| Phase | Owner | Trigger | Output | Gate to next phase |
|---|---|---|---|---|
| **1. Procure** | Procurement | Business request for an asset | Approved PO with organizational assignment | Assignment validated against the organizational registry |
| **2. Pre-stage** | Procurement + Vendor | PO submitted to vendor | Vendor program record (Autopilot device profile, ABM device assignment, etc.) | Vendor program record carries the organizational assignment |
| **3. Position** | Governance pipeline | Vendor confirms hardware-hash registration | Pre-staged Entra ID device object placeholder OR procurement-side mapping table entry | Mapping committed to governance repo and reviewed |
| **4. Provision** | End user (zero-touch) or IT (assisted zero-touch) | Asset arrives at recipient location | Enrolled, assigned, compliant device | Compliance policy returns Compliant; CA grants access |
| **5. Validate** | Governance pipeline | Device first compliance evaluation completes | Validation record in the governance audit log | All Phase 5 checks pass; device removed from quarantine if applicable |

Full process spec in `src/fmp/modernization/intune-first-onboarding/process.md`.
Reference latency target: **PO issuance to production-governed within
14 calendar days** for standard hardware, **5 calendar days** for
expedited orders.

## Procurement is the First Governance Step

Phase 1 — Procure is where the doctrine departs most sharply from
historical practice. Asset organizational assignment is captured **at PO time** in a
structured field, not inferred downstream from whoever provisions the
device.

Required intake fields, per `procurement-handoff.md` §2:

- `recipient_upn`, `recipient_org_attributes` (resolved from Entra ID)
- `asset_class` (windows-endpoint / macos-endpoint / ios-tablet / etc.)
- `asset_assignment_type` (personal / shared / kiosk / lab / service)
- `asset_org_attributes` and `asset_orgnodeid` (validated against the organizational registry)
- `vendor`, `vendor_program` (autopilot-direct, apple-abm, android-zerotouch, samsung-knox-me, arc-direct)

The procurement system commits a JSON procurement record to
`governance/procurement/orders/{PO-number}.json` and writes the
organizational assignment to the appropriate vendor program at Phase 2.

## Per-Platform Onboarding Annexes

The five-phase process is platform-neutral. Per-platform mechanics
live in dedicated annexes:

| Platform | Vendor program | Assignment carrier | Trust elevation state | Annex |
|---|---|---|---|---|
| **Windows endpoint** | Windows Autopilot Device Preparation (v2) | Group Tag | Microsoft Entra Join (per the program decision) | `platforms/windows-autopilot.md` |
| **Microsoft Surface** *(sub-pattern of Windows endpoint)* | Surface direct via Microsoft CSP, or authorized reseller (CDW, Insight, Connection) | Group Tag + DFCI profile applied at ESP Device Setup | Entra Join + DFCI firmware lockdown + Pluton attestation (Pro 11 / Laptop 6+) | `platforms/windows-surface.md` |
| **macOS endpoint** | Apple Business Manager (ABM) or Apple School Manager (ASM) ADE | ABM device note | Supervised + ADE-enrolled | `platforms/macos-abm-ade.md` |
| **iOS / iPadOS** | Apple ABM/ASM ADE | ABM device note | Supervised | `platforms/mobile-ios-android.md` Part A |
| **Android Enterprise** | Android Zero-Touch (Google) or Knox Mobile Enrollment (Samsung) | Custom JSON managed config | Device Owner mode | `platforms/mobile-ios-android.md` Part B |
| **Server (Windows 2025+ / Linux)** | Azure Arc onboarding | Azure resource tag on Arc machine | WORKGROUP + Arc-onboarded; Entra-joined via AADLoginForWindows for Server 2025+ | `platforms/arc-managed-servers.md` |

## Validation, Drift Classes, and Evidence

Phase 5 validation runs a checklist of platform-neutral and platform-
specific checks (`validation-and-evidence.md` §1).
Failures quarantine the device per Pillar 5.

The doctrine introduces **five new drift classes**:

| Drift class | What it detects |
|---|---|
| `DRIFT-PROCUREMENT-MISMATCH` | Organizational assignment on the device differs from the procurement-record value |
| `DRIFT-VENDOR-PROGRAM-CARRIER` | Organizational assignment in the vendor program record (Autopilot Group Tag, ABM device note, etc.) differs from the procurement record |
| `DRIFT-ENROLLMENT-VECTOR` | Device enrolled via a non-zero-touch path without an exception path grant |
| `DRIFT-CO-MANAGEMENT-NEW` | Net-new Windows endpoint landed in SCCM co-management instead of Intune-first |
| `DRIFT-PROCUREMENT-RECORD-ABSENT` | Device enrolled in Intune with no corresponding procurement record |

Each detection produces an HMAC-signed evidence artifact under
`governance/evidence/intune-first/` and supports FedRAMP Moderate
control families AC-2, AC-19, CM-2, CM-7, CM-8, IA-3, MA-2, SC-15.

## Source Files

All Intune-First Asset Onboarding canon lives in the monorepo at
`src/fmp/modernization/intune-first-onboarding/`.
The doctrinal anchor is `src/fmp/canon/adr/adr-071-intune-first-asset-onboarding.md`.

## Related

- [Directory Migration](../books/b02-identity/04-the-hidden-migration-surface.md) — the sibling track
  that handles existing AD-joined fleet (where Intune-First applies
  to net-new acquisition, Directory Migration handles the legacy
  estate)
- the program decision
  — controlling precedent for Windows endpoint join target (Entra
  Join only; HAADJ deprecated)
- the program decision
  — controlling precedent for server identity (Arc + Entra Join,
  WORKGROUP state required)
- the program decision
  — establishes the Intune-First doctrine
