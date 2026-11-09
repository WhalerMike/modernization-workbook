---
title: "Canonical the Federal Modernization Program Specifications"
subtitle: "The SSOT Specification Layer — Stub Pages"
date: 2026-06-26
format:
  html:
    toc: true
    toc-depth: 3
  docx:
    toc: true
lifecycle: aspirational
lifecycle_review: 2026-12-26
aliases:
  - /canon/
  - /canon/index.html
---


## What this section is

These pages are the **canonical the Federal Modernization Program specifications** — the single-source-of-truth
(SSOT) layer of the substrate. Each page here is a **stub**: a wrapper that
shows the spec's identifier, status and version in a callout, with no body
and no link to the authoritative source. The authoritative text is not
published in this repository, so read each page as a registry entry, not as
the specification itself.

A spec carries a `FMP_NNN` identifier allocated in
[`document-registry.yaml`],
a `status` (Draft / Active), and a decision record (one or more ADRs) that
ratified it. Where a spec states an **external** fact (a statutory mandate,
vendor behavior, a standard's requirement), that fact is authoritative only
at the source the spec links to — the spec is SSOT for the *decision*, not the
cited fact (see [the program decision]).

## Core architecture & SCuBA

| Spec | Title |
|---|---|
| [FMP_002](002_SCuBA_Technical_Specification_v1.0.md) | SCuBA Technical Specification |
| [FMP_003](003_Adapter_Segmentation_Overview_v1.0.md) | Adapter Segmentation Overview |
| [FMP_015](015_Governance_Platform_Coverage_And_Gap_Doctrine_v1.0.md) | Governance-Platform Coverage And Gap Doctrine |
| [FMP_005](005_SCuBA_Value_Proposition_v1.0.md) | Value Proposition — Two-Way Governance for SCuBA & BOD 25-01 |

## Identity & addressing planes, and vendor contract pins

| Spec | Title |
|---|---|
| [FMP_195](schemas/195_Addressing_Plane_Drift_Taxonomy.md) | Addressing-Plane Drift Taxonomy — DNS & Namespace Governance |
| [FMP_210](schemas/210_identityiq-api-contract-pin.md) | SailPoint IdentityIQ REST API — Vendor Contract Pin |
| [FMP_211](schemas/211_servicenow-deployment-contract-pin.md) | ServiceNow Deployment Contract — Schema Pin |

## PowerShell module specifications

| Spec | Title |
|---|---|
| [FMP_181](schemas/181_FMPIdentityAssessment_Module_Specification.md) | FMPIdentityAssessment Module Specification |
| [FMP_182](schemas/182_FMPImportAdapters_Module_Specification.md) | FMPImportAdapters Module Specification |
| [FMP_183](schemas/183_FMPPlanGenerators_Module_Specification.md) | FMPPlanGenerators Module Specification |

## Governance, compliance & FedRAMP program documents

| Spec | Title |
|---|---|
| [FMP_184](184_Gap_Closure_Register.md) | Gap Closure Register — The Gap That Remains |
| [FMP_185](185_System_Security_Plan_Template.md) | System Security Plan (SSP) Template |
| [FMP_186](186_Incident_Response_Plan.md) | Incident Response Plan |
| [FMP_187](187_Security_Awareness_and_Training_Program.md) | Security Awareness and Training Program |
| [FMP_188](188_Personnel_Security_Program.md) | Personnel Security Program |
| [FMP_189](189_POAM_Template.md) | Plan of Action and Milestones (POA&M) Template |
| [FMP_190](190_Continuous_Monitoring_Strategy.md) | Continuous Monitoring Strategy |
| [FMP_191](191_Supply_Chain_Risk_Management_Plan.md) | Supply Chain Risk Management Plan |
| [FMP_192](192_Privacy_Impact_Assessment.md) | Privacy Impact Assessment |
| [FMP_198](198_Risk_Assessment_Methodology.md) | Risk Assessment Methodology (NIST SP 800-30 Rev 1) |
| [FMP_206](206_FedRAMP_KSI_Continuous_Reporting_Runbook.md) | FedRAMP KSI Evidence Platform — Continuous Reporting Runbook |

## Provenance

Every page in this section is a stub wrapper. A new spec takes an `FMP_NNN`
identifier and an index row here; a doctrinal change takes a decision record
and governance review.
