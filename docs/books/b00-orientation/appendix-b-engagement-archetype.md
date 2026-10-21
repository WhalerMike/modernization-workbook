---
title: "Appendix B — The Engagement Archetype (Illustrative)"
description: "An illustrative framing pattern for an end-to-end federal modernization engagement: the typical starting state, the five-step intervention mapped onto Book 01's phases and gates, the measures a real engagement would report, and what it would take to publish one."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b00-orientation
book: B00
part: Appendix
series-order: 91
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix B — The Engagement Archetype (Illustrative)

*Before there is a real engagement to report, there can be an honest pattern of one, and a list of what the report would have to prove.*

::: {.callout-note}
## In this appendix
The engagement archetype the program is designed for: the typical starting state, the five-step intervention and how it maps onto Book 01's phases and gates, the measures a real engagement would have to report, why the pattern differs from a tool-by-tool modernization, and what it would take to turn the pattern into a published case study.
:::

::: {.callout-important}
## A framing pattern, not a real engagement
Nothing in this appendix describes a real agency or a completed engagement. It contains no agency identifiers, metrics or timelines, and it shouldn't be read as evidence that the program has been deployed anywhere. It is a pattern for planning and for judging a future case study. Where it states what an engagement would show, that is the program's expectation, to be tested, not a result.
:::

## The archetype

A federal civilian agency runs a multi-quarter modernization spanning identity, the cloud boundary, telemetry and zero trust controls. It carries the concerns the rest of this workbook addresses: identity spread across regional directories, telemetry that no one correlates, evidence assembled at a point in time for each authorization, and a cloud boundary few people can draw. It has tried modernization before as a sequence of independent projects.

The program's intervention is structural. It doesn't replace the tools one by one; it puts a governance layer under the existing tool stack: an authoritative repository, analysis and plans generated from it, governed delivery, and drift detection against it ([Book 01, Chapter 11](../b01-transformation-arc/11-analysis-plan-delivery.md)). The archetype is an agency at the scale where governing each tool separately has stopped being workable.

## The typical starting state

| Area | Typical condition |
|---|---|
| Architecture | Decades of client/server: Active Directory, on-premises SQL Server and a traditional network perimeter ([Chapter 01](01-why-modernize-now.md)) |
| Cloud | A Microsoft 365 government community cloud tenant as the primary cloud, with some workloads elsewhere under named exceptions ([Book 10](../b10-cloud-boundary/index.md)) |
| Identity | Active Directory in active migration to Microsoft Entra ID, with no single authoritative source for organizational attributes |
| Zero trust | A program run pillar by pillar, with little correlation across pillars ([Book 11](../b11-zero-trust/index.md)) |
| Authorization | The authorization package written by hand against a control catalog and re-engineered every cycle |
| Telemetry | Many tools, partly normalized in a SIEM |
| Findings | A compliance findings backlog with a multi-year tail |

## The intervention, mapped onto Book 01's phases

The pattern names five steps. Its shorter companion gives the sequencing rule behind them: identity first, then addressing, overlay, telemetry, management automation and governance at runtime, with governance in place before any identity object moves. Book 01's roadmap is the canonical sequence, so the table reads each step in its terms.

| Archetype step | What happens | Book 01 phase and gate | Where the workbook carries it |
|---|---|---|---|
| 1. Adopt the governance layer | Stand up the platform host and the authoritative repository; walk the estate and record what the repository should govern; put schema validation on every change to the repository, so structural drift becomes visible | Phase 0, Pre-flight; G0 | [Chapter 08](08-pre-flight-and-assessment.md); [Book 01, Chapter 03](../b01-transformation-arc/03-platform-foundation.md) |
| 2. Modernize identity | Attributes defined in the repository first; adapters to the target platforms; drift-driven cleanup; cutover; post-cutover governance | Phases 1 to 3 (G1 to G3), and the identity steps of Phases 4 and 5 (G4, G5) | [Chapter 09](09-design-pilot-and-rollout.md); [Book 02](../b02-identity/index.md); [Book 03](../b03-hr-identity/index.md) |
| 3. Treat the boundary | Probe what the cloud boundary actually contains; bring telemetry inside it; add compensating enforcement where a feature is missing; document it for authorization | Runs alongside Phases 0 to 3 | [Book 10](../b10-cloud-boundary/index.md) |
| 4. Set the drift tempo | Every finding gets a severity and a clock; deterministic findings are remediated automatically within the actuation ceiling; escalations go to named roles | Begins with the pilot's drift-clean hold (G2); becomes the operating cadence of Phase 6 | [Chapter 10](10-retirement-steady-state-and-success.md#phase-6-steady-state); [Book 01, Chapter 11](../b01-transformation-arc/11-analysis-plan-delivery.md) |
| 5. Move the authorization package onto evidence | The system security plan, POA&M and component descriptions generated from the repository and telemetry; attestations stay as the human accountability layer but stop being the main way of verifying | Evidence accumulates from Phase 0; the package moves in Phase 6 | [Book 10, Chapter 11](../b10-cloud-boundary/11-the-authorization-package.md) |

Three corrections keep the pattern accurate:

- **The authorization is the agency's.** Step 5 moves the agency's own package. FedRAMP certifies cloud service offerings, but "each agency still authorizes its own federal information systems," and FedRAMP tells agencies never to create a standalone authorization for a cloud service.[^aB-fedramp-use]
- **Key Security Indicators belong to the providers.** The source put "KSI dashboards" in the agency's package. Key Security Indicators are part of FedRAMP's 20x certification rules for cloud service providers, meant to give "measurable validation" that protections work.[^aB-ksi] An agency can line its own evidence up with what its providers report against them; it doesn't report KSIs itself.
- **Generated documents have a standard form.** The system security plan, the POA&M and the component definition the pattern generates are all models in NIST's Open Security Controls Assessment Language (OSCAL), alongside the catalog, profile, assessment plan and assessment results models.[^aB-oscal] Generating them in OSCAL is what makes them machine-readable for the agency's assessors.

The drift tempo in step 4 used its own tiers: P1 immediate, P2 within an hour, P3 within 24 hours and P4 within 72 hours. The master plan's defaults in [Chapter 10](10-retirement-steady-state-and-success.md#drift-remediation-slas) are different. Both are illustrative. What the pattern needs is one set of values, chosen by the agency for its staffing and risk, written into its continuous monitoring strategy and measured.

## What a real engagement would have to report

A case study that claims the pattern works has to show it in numbers. These are the measures the pattern names, and they extend the outcome measures of the program scorecard in [Chapter 10](10-retirement-steady-state-and-success.md#measuring-success-the-program-scorecard).

| Measure | What it shows |
|---|---|
| Drift findings over time, by class and severity | Whether the estate converges on the repository or keeps diverging |
| SLA adherence by severity | Whether the tempo is realistic for the agency's staffing |
| Repository-change decisions versus operational changes | How often the program has to change its own design, against routine governed work: a sign of how settled the model is |
| Time to regenerate the authorization package | Wall-clock time from deciding to regenerate to a bundle whose hash matches the expected one |
| Independent re-execution | Whether an assessor can re-run the evidence months after it was assembled and get the same result |
| Change in tool count | Whether parallel governance machinery was actually retired. The pattern expects a reduction; a real engagement has to measure it |

## Why the pattern differs from a tool-by-tool modernization

Three properties distinguish it. They are the program's design claims, and a real engagement is how they would be tested.

1. **The authoritative model outlives the tools.** Tools, vendors and platforms change; the repository's model changes only through a governed decision. Work put into the model accumulates instead of being redone at each platform change.
2. **Evidence can be regenerated.** Point-in-time bundles can be rebuilt from the repository and archived inputs. That doesn't remove retention obligations: records schedules still govern what must be kept and for how long ([Book 01, Chapter 09](../b01-transformation-arc/09-who-leads-the-transformation.md#records-management-and-privacy)), so the archived inputs themselves are records. The source's claim that long-term audit retention costs fall is a hypothesis to measure, not a result.
3. **Drift is the operating signal.** Drift findings replace the gap discovery that used to happen once per audit cycle, and security operations and governance work from the same taxonomy of findings.

## What an engagement teaches the program

The pattern expects an end-to-end engagement to produce the widest set of lessons of any case study: refinements to the canonical attributes (identity), updates to what the boundary can and can't do (cloud), new compensating-enforcement adapters (zero trust and Microsoft 365 features), tuning of the severity tempo against staffing, and improvements to how faithfully the authorization package is generated. Each lesson would land as a recorded decision, a repository update or an adapter change, so the case study becomes the provenance for each.

The shorter companion pattern adds three lessons for leadership:

- Fund and govern the program as one sequence, not as independent projects ([Chapter 01](01-why-modernize-now.md)).
- Modernization creates the operating conditions that make continuous authorization credible; it doesn't confer it.
- Treat the roadmap as a governed delivery arc, not as a claim that every workstream is already complete. Hold phase gates on evidence quality and operational determinism, not only on dates.

## From pattern to published case study

The pattern becomes a case study only when three conditions hold: engagement material that has been reviewed and cleared for external release; traceability from each cited lesson to the repository change it produced; and review and approval by the sponsoring agency. End-to-end engagements are the hardest case studies to publish, because the lessons are broad and the material is sensitive. Until then the workbook documents the pattern, and says plainly that it is one. When a real engagement is published, it will name what it measured against the table above, and the workbook will remain agency-agnostic by describing it as an example rather than as its subject.

## Key takeaways

1. This is a framing pattern, not a report of a real engagement; it carries no agency, metric or timeline.
2. Its five steps map onto Book 01's phases: governance layer in Phase 0, identity across Phases 1 to 5, the boundary alongside Phases 0 to 3, and the drift tempo and evidence-based package in steady state.
3. The authorization stays the agency's; Key Security Indicators are a provider-side FedRAMP 20x measure; generated documents should be OSCAL.
4. A real case study has to report convergence, SLA adherence, regeneration time, independent re-execution and tool count, not adjectives.

::: {.callout-tip}
## Continue the book
[← Previous: Appendix A — Risk Register and Control Traceability](appendix-a-risk-register-and-traceability.md) · [Book index](index.md)
:::

[^aB-fedramp-use]: FedRAMP, "Using a FedRAMP Certified Cloud Service," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/agencies/use/> (accessed Oct 21, 2026).
[^aB-ksi]: FedRAMP, "Key Security Indicators," FedRAMP 20x Certification Rules, *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/providers/20x/key-security-indicators/> (accessed Oct 21, 2026).
[^aB-oscal]: NIST, Open Security Controls Assessment Language, "Layers and Models" (control layer: catalog, profile and control mapping; implementation layer: system security plan and component definition; assessment layer: assessment plan, assessment results and POA&M), <https://pages.nist.gov/OSCAL/learn/concepts/layer/> (accessed Oct 21, 2026).
