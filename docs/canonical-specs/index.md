---
title: "Canonical the modernization program Specifications"
subtitle: "The SSOT Specification Layer — Published Verbatim from `src/uiao/canon/`"
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

{{< lifecycle-banner >}}

::: {.callout-tip}
## Download the full section
**[canon-bundle.docx]** — every canonical specification in
this section concatenated into one Word document, figures embedded.
Regenerated on every site deploy. Each spec below is also downloadable
individually as its own `.docx` from its page.
:::

## What this section is

These pages are the **canonical the modernization program specifications** — the single-source-of-truth
(SSOT) layer of the substrate. Each page renders its authoritative source
**verbatim** from `src/uiao/canon/` through an
the program decision include-style wrapper:
the published page is generated, the `.md` under `src/uiao/canon/` is the
authority, and every downstream document traces its provenance back here.

A spec carries a `the modernization program_NNN` identifier allocated in
[`document-registry.yaml`],
a `status` (Draft / Active), and a decision record (one or more ADRs) that
ratified it. Where a spec states an **external** fact (a statutory mandate,
vendor behavior, a standard's requirement), that fact is authoritative only
at the source the spec links to — the spec is SSOT for the *decision*, not the
cited fact (see [the program decision]).

## Core architecture & SCuBA

| Spec | Title |
|---|---|
| [the modernization program_002](the modernization program_002_SCuBA_Technical_Specification_v1.0.qmd) | SCuBA Technical Specification |
| [the modernization program_003](the modernization program_003_Adapter_Segmentation_Overview_v1.0.qmd) | Adapter Segmentation Overview |
| [the modernization program_005](the modernization program_005_SCuBA_Value_Proposition_v1.0.qmd) | Value Proposition — Two-Way Governance for SCuBA & BOD 25-01 |

## Identity, the organizational-attribute model & addressing planes

| Spec | Title |
|---|---|
| [the modernization program_012](the modernization program_012_the organizational-attribute model_in_NAC_and_8021X.qmd) | the organizational-attribute model in NAC / 802.1X & Cert-Based Network Admission |
| [the modernization program_014](the modernization program_014_GPO_Modernization_Parse_Crosswalk_the organizational-attribute model_Join_v1.0.qmd) | GPO Modernization — Parse, Crosswalk, the organizational-attribute model Join |
| [the directory modernization program | Identity & Directory Transformation Inventory — AD to Entra ID |
| [the modernization program_193](the modernization program_193_the organizational-attribute model_MultiCloud_Binding.qmd) | the organizational-attribute model Multi-Cloud Binding Profiles — Vendor-Neutral Storage Contract |
| [the modernization program_194](the modernization program_194_LocPath_Codebook.qmd) | LocPath Codebook — Canonical Physical-Location Addressing |
| [the modernization program_195](the modernization program_195_Addressing_Plane_Drift_Taxonomy.qmd) | Addressing-Plane Drift Taxonomy — DNS & Namespace Governance |

## PowerShell module specifications

| Spec | Title |
|---|---|
| [the modernization program_181](the modernization program_181_the modernization programIdentityAssessment_Module_Specification.qmd) | the modernization programIdentityAssessment Module Specification |
| [the modernization program_182](the modernization program_182_the modernization programImportAdapters_Module_Specification.qmd) | the modernization programImportAdapters Module Specification |
| [the modernization program_183](the modernization program_183_the modernization programPlanGenerators_Module_Specification.qmd) | the modernization programPlanGenerators Module Specification |

## Governance, compliance & FedRAMP program documents

| Spec | Title |
|---|---|
| [the modernization program_184](the modernization program_184_Gap_Closure_Register.qmd) | Gap Closure Register — The Gap That Remains |
| [the modernization program_185](the modernization program_185_System_Security_Plan_Template.qmd) | System Security Plan (SSP) Template |
| [the modernization program_186](the modernization program_186_Incident_Response_Plan.qmd) | Incident Response Plan |
| [the modernization program_187](the modernization program_187_Security_Awareness_and_Training_Program.qmd) | Security Awareness and Training Program |
| [the modernization program_188](the modernization program_188_Personnel_Security_Program.qmd) | Personnel Security Program |
| [the modernization program_189](the modernization program_189_POAM_Template.qmd) | Plan of Action and Milestones (POA&M) Template |
| [the modernization program_190](the modernization program_190_Continuous_Monitoring_Strategy.qmd) | Continuous Monitoring Strategy |
| [the modernization program_191](the modernization program_191_Supply_Chain_Risk_Management_Plan.qmd) | Supply Chain Risk Management Plan |
| [the modernization program_192](the modernization program_192_Privacy_Impact_Assessment.qmd) | Privacy Impact Assessment |
| [the modernization program_198](the modernization program_198_Risk_Assessment_Methodology.qmd) | Risk Assessment Methodology (NIST SP 800-30 Rev 1) |
| [the modernization program_206](the modernization program_206_FedRAMP_KSI_Continuous_Reporting_Runbook.qmd) | FedRAMP KSI Evidence Platform — Continuous Reporting Runbook |

## Provenance

Every page in this section is generated; do not edit the published `.qmd`
wrappers directly. To change a spec, edit its source under
[`src/uiao/canon/`]
and follow the canon-change process (a `the modernization program_NNN` allocation for a new doc, an
ADR for a doctrinal change, governance review). The wrapper and this index then
re-render on the next site deploy.
