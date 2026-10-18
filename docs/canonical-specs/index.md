---
title: "Canonical the Federal Modernization Program Specifications"
subtitle: "The SSOT Specification Layer — Published Verbatim from `src/fmp/canon/`"
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


::: {.callout-tip}
## Download the full section
**[canon-bundle.docx]** — every canonical specification in
this section concatenated into one Word document, figures embedded.
Regenerated on every site deploy. Each spec below is also downloadable
individually as its own `.docx` from its page.
:::

## What this section is

These pages are the **canonical the Federal Modernization Program specifications** — the single-source-of-truth
(SSOT) layer of the substrate. Each page renders its authoritative source
**verbatim** from `src/fmp/canon/` through an
the program decision include-style wrapper:
the published page is generated, the `.md` under `src/fmp/canon/` is the
authority, and every downstream document traces its provenance back here.

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
| [FMP_005](005_SCuBA_Value_Proposition_v1.0.md) | Value Proposition — Two-Way Governance for SCuBA & BOD 25-01 |

## Identity, the organizational-attribute model & addressing planes

| Spec | Title |
|---|---|
| [FMP_012](schemas/012_OrgPath_in_NAC_and_8021X.md) | the organizational-attribute model in NAC / 802.1X & Cert-Based Network Admission |
| [FMP_014](schemas/014_GPO_Modernization_Parse_Crosswalk_OrgPath_Join_v1.0.md) | GPO Modernization — Parse, Crosswalk, the organizational-attribute model Join |
| [the directory modernization program | Identity & Directory Transformation Inventory — AD to Entra ID |
| [FMP_193](schemas/193_OrgPath_MultiCloud_Binding.md) | the organizational-attribute model Multi-Cloud Binding Profiles — Vendor-Neutral Storage Contract |
| [FMP_194](schemas/194_LocPath_Codebook.md) | LocPath Codebook — Canonical Physical-Location Addressing |
| [FMP_195](schemas/195_Addressing_Plane_Drift_Taxonomy.md) | Addressing-Plane Drift Taxonomy — DNS & Namespace Governance |

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

Every page in this section is generated; do not edit the published `.qmd`
wrappers directly. To change a spec, edit its source under
[`src/fmp/canon/`]
and follow the canon-change process (a `FMP_NNN` allocation for a new doc, an
ADR for a doctrinal change, governance review). The wrapper and this index then
re-render on the next site deploy.
