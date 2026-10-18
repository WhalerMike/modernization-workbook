---
title: "Chapter 00 — Overview and Applicability"
description: "The problem, the HR-agnostic architecture in one paragraph, where the series applies (commercial cloud, GCC-Moderate, FedRAMP Moderate, Federal HR 2.0 agencies) and where it doesn't, and what federal guidance does and does not require."
doc-type: hr-driven-iam-chapter
audience: [Executive, Technical, Customer]
family: hr-driven-iam
series-order: 0
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
aliases:
  - /docs/whitepapers/federal-hrit-productization.html
---

# Chapter 00 — Overview and Applicability

*The facts that decide who should have access are recorded in the HR system of record before any administrator hears about them.*

::: {.callout-note}
## In this chapter
The problem the series solves, the architecture in one paragraph, the environment it's written for, what it doesn't cover, and the one caution that governs every chapter: no OPM document mandates Entra ID integration.
:::

## The problem

Hire, transfer, and separation are recorded as business events in the HR system before any administrator hears about them. In most estates the directory learns about those events by ticket, by email, by quarterly review or by audit finding — days to months late, or never. Bespoke, vendor-specific HR-to-directory pipelines make account management, identifier management, and authenticator management hard to verify continuously. And Federal HR 2.0 is consolidating Core HCM systems, which changes the feed shapes agencies integrate against today.

## The architecture in one paragraph

An HR-agnostic architecture: any HR source feeds a per-source adapter, which produces one canonical schema, which flows through middleware to Microsoft Entra ID's API-driven inbound provisioning endpoint. Joiner, mover, and leaver workflows, governance-attribute population, drift detection, and evidence are produced as byproducts. The integration path works with any HR source, not only the awarded platform; joiner/mover/leaver workflows are driven by HR events, not by directory-side changes; and the attributes policy depends on are populated from the HR feed so that targeting stays deterministic.

## The ask

Build the HR-to-directory path against a canonical schema and a single provisioning interface, not against a vendor-specific connector. Treat the HR system as the source of truth for joiner, mover, and leaver events.

## Where this series applies

- **Cloud:** the commercial Microsoft cloud — Microsoft 365 GCC (GCC-Moderate) and Entra ID in the commercial cloud, with commercial Azure services where the middleware needs them — under a FedRAMP Moderate authorization.
- **HR source:** an Executive Branch civilian agency onboarding to the Federal HR 2.0 Core HCM platform (Oracle Fusion Cloud HCM). The architecture also works for any HR source that can produce an extract or an event feed.
- **Directories:** hybrid estates where accounts are still mastered in on-premises Active Directory, and cloud-native populations mastered in Entra ID. Both are covered, because most agencies run both during coexistence.

## Where it doesn't apply as written

- GCC High and DoD tenants, which use different endpoints and service availability.
- Military personnel and Intelligence Community agencies, which the Federal HR 2.0 memo initially excludes.
- Directory migration itself (moving objects from AD to Entra ID), which is the companion [AD → Entra ID Identity Modernization Guide](../operational-guides/identity/identity-modernization.md).

## One caution, stated up front

**No OPM document mandates or specifies Entra ID integration.** Federal guidance is deliberately product-neutral: OMB M-19-17 makes HR systems authoritative for identity, and the GSA/FICAM Identity Lifecycle Management Playbook — best practice, explicitly not policy — supplies the joiner-mover-leaver doctrine. The Entra specifics in this series come from Microsoft's own integration guidance and from the agency's implementation decisions. Don't cite this series as OPM guidance for the Entra leg.

::: {.callout-tip}
## Continue the series
[Index](index.md) · [Next: Chapter 01 — Why HR Is the Source of Authority →](01-why-hr-is-the-source-of-authority.md)
:::
