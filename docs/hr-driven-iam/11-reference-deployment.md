---
title: "Chapter 11 — Reference Deployment (Illustrative)"
description: "An illustrative walk-through of the series for a mid-size federal civilian agency in Wave 2: the starting estate, what each phase does and finds, the evidence package an assessor receives, and what the agency keeps afterward. A pattern, not an attested engagement."
doc-type: hr-driven-iam-chapter
audience: [Executive, Technical, Customer]
family: hr-driven-iam
series-order: 11
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
aliases:
  - /docs/case-studies/reference-deployment-opm-hrit-to-entra.html
  - /docs/case-studies/hrit-to-entra-reference-deployment.html
  - /docs/case-studies/hrit-to-cloud-identity-reference.html
---

# Chapter 11 — Reference Deployment (Illustrative)

*What the series looks like when one agency runs it end to end.*

::: {.callout-note}
## In this chapter
The agency archetype and its starting estate. What each phase of Chapter 10 does and typically finds. The evidence package. What survives the engagement.
:::

::: {.callout-important}
## Illustrative, not an engagement record
This chapter is a pattern. The agency, the numbers and the findings are representative, not drawn from a specific engagement, and there are no agency identifiers, contractor names or dates in it. Replace the prose with measured values when real, releasable engagement material exists.
:::

## The agency

A federal civilian agency of about fifty thousand employees and several thousand active contractors, in Federal HR 2.0 Wave 2, with a Microsoft 365 GCC tenant and Entra ID in the commercial cloud under a FedRAMP Moderate authorization.

Its HR data exchange today is typical:

- The HR system of record is run by a legacy HR shared service provider, under that provider's interconnection agreements. The agency is the data steward but doesn't own the exchange contract. That system is scheduled to be replaced by the Core HCM platform during the agency's wave (Chapter 02).
- USA Staffing is the upstream hire trigger; new-hire data flows from USA Staffing to the HR system of record.
- PIV cards are issued through a shared-service PIV issuer and its card management system.
- A bespoke HR-to-AD connector built for an earlier modernization creates accounts; organizational assignments are handled by hand; there's no drift detection between HR and Entra ID and no provisioning evidence.
- About two-thirds of users are still mastered in on-premises AD.

## Phase by phase

**Phase 0 — Program alignment.** The integrated project team inventories integration points. The identity provisioning feed is listed alongside payroll and benefits, with the Core HCM interconnection go-live as its deadline.

**Phase 1 — Attribute authority and schema.** The authority map and the canonical schema (Chapter 05) are signed. Code lists for organization, worker type and position category are agreed with HR. The correlation baseline finds the usual problems: a few percent of enabled accounts with no `employeeId`, duplicate identities from contractor-to-employee conversions, and service accounts sitting in user OUs. Each gets an owner and a date.

**Phase 2 — Pipeline build and test.** The middleware is built against extracts from the current HR system *and* sandbox extracts from Core HCM, because the source will change mid-program. Only the source contract and boundary transformation differ; the governed identity model and downstream lifecycle policy remain stable. The leaver workflow's custom task extensions retire a test device and revoke a test certificate in the test tenant.

**Phase 3 — Hybrid go-live (pilot).** Two provisioning agents go in; the old connector is switched off for the pilot population. Thirty days of shadow mode surface the differences between what HR says and what AD holds: stale departments, managers who left years ago, and accounts the old connector created for records HR had already cancelled.

**Phase 4 — Lifecycle automation and derived access.** Leaver automation goes first. In the first month the drift report shows a burst of high-severity findings: separated workers whose accounts the manual process hadn't reached, and orphan accounts from the old connector that the canonical pipeline can now see (Chapter 09). Each high-severity finding blocks the dependent provisioning action until it's resolved. Dynamic groups replace hand-maintained ones application by application; a test reorganization in HR moves a division's access with no directory edits.

**Phase 5 — Cutover to cloud-mastered.** As the agency's Core HCM interconnection goes live, the source contract and boundary transformation switch source. New hires land cloud-mastered in Entra ID directly; existing AD-mastered populations follow per population as their dependencies on AD retire.

**Phase 6 — Sustained posture.** The six lifecycle metrics go into the monthly ConMon report. The separation-to-revocation interval, measured for the first time, becomes a number the agency can defend.

## The evidence package

At any point after Phase 2, the agency can hand an assessor:

- the signed attribute authority map, canonical schema and code lists;
- the source-contract, transformation, and workforce identity service configuration, under change control;
- the provenance records and provisioning logs for every HR event in the period;
- Lifecycle Workflows run history, including the device and CMS steps for every leaver;
- drift findings with severity, class and remediation;
- the six lifecycle metrics for the period.

It's produced by operating the pipeline, not assembled before the assessment.

## What survives the engagement

The schema, the code lists, the workflows, the rules and the evidence belong to the agency, not to whichever integrator delivered the work. The next assessment reads the same records; the Core HCM cutover connects a new source contract to the same governed identity model; the next reorganization is a set of mover events against the same pipeline.

## Companion

The [AD → Entra ID Identity Modernization Guide](../operational-guides/identity/identity-modernization.md) covers directory migration, the companion dimension to inbound provisioning. An agency usually runs both programs at once.

::: {.callout-tip}
## Continue the series
[← Previous: Chapter 10 — Execution Plan](10-execution-plan.md) · [Index](index.md)
:::
