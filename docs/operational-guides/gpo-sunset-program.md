# GPO Sunset Program

Existing-fleet GPO replacement — a phased migration to Intune.

## Purpose

This document describes a structured program for replacing Active Directory Group Policy Objects with Microsoft Intune policies on currently deployed endpoints. The goal is formal GPO retirement after coexistence and verification, not a literal copy of every legacy setting.

## Scope distinction

Three related but distinct activities touch Intune during modernization:

1. **Intune-First Asset Onboarding** — Net-new devices receive governance at procurement time.
2. **GPO Sunset Program** (this document) — Existing fleet. Phased replacement of GPOs on currently deployed endpoints, ending in formal GPO retirement.
3. **Policy Transformation Pattern** — The philosophy that governs how replacement policies are authored: regenerate, do not copy.

The setting-level mapping that accompanies this program is a semantic translation reference. It is not a prescription to reproduce every GPO setting one-for-one.

## Seven-phase sequence

| Phase | Focus | Exit condition |
|-------|-------|----------------|
| 1 | Inventory and classify | Complete GPO and setting inventory; high-risk and obsolete settings identified |
| 2 | Coexistence planning | Workload authority (SCCM vs Intune) decided per category; dual-write risks documented |
| 3 | Baseline policy authoring | Compliance, configuration, and endpoint security baselines defined for the target state |
| 4 | Pilot deployment | Representative devices receive Intune policies; GPO still present; conflicts measured |
| 5 | Workload cutover | Authority for each workload moves to Intune; GPO links disabled for those workloads |
| 6 | Verification and residual cleanup | Residual GPO settings confirmed absent or intentionally retained; evidence collected |
| 7 | Formal retirement | GPO objects retired or retained only for documented exceptions; program close |

Typical duration for a large fleet is measured in months, not weeks. The exact timeline depends on inventory size, co-management state, and exception volume.

## Policy families

Replacement policies fall into three families:

- **Compliance policies** — Minimum device posture required before Conditional Access grants resource access.
- **Configuration profiles** — Settings Catalog and administrative template equivalents.
- **Endpoint security policies** — Defender, firewall, disk encryption, and related controls.

Each policy should include:

- Target population (expressed as dynamic groups or filters derived from a canonical attribute model)
- Setting table with intended values
- Mapping to the GPO setting(s) it replaces
- Verification method

## Coexistence caution

When SCCM and Intune both manage the same workload, devices can receive conflicting settings. The workload slider (or equivalent authority control) must designate a single authority before Intune policies for that workload are deployed. Deploying Intune policies while the workload remains under SCCM causes the Intune policy to be ignored.

## Translation philosophy

Use the GPO-to-Intune mapping as a lookup, not a copy list. For each setting ask:

- Is this still required in the target operating model?
- Does a native Intune or Endpoint Security equivalent exist?
- Should the control be expressed as a compliance requirement, a configuration setting, or both?
- What evidence will prove the control is in effect?

Obsolete, redundant, or high-risk settings should be retired rather than translated.

## Bottom line

GPO sunset is a multi-phase program that ends in formal retirement of the legacy policy surface. Success depends on inventory, authority decisions, coexistence discipline, and a regenerate-not-copy authoring approach — not on volume of settings migrated.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
