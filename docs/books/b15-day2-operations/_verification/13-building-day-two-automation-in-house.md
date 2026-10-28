# Verification — Chapter 13, Building Day-Two Automation In-House

New chapter; no source pages. It extends [Chapter 11](../11-attestation-and-the-compliance-app.md)'s compliance application to the case where the native compliance modules and a commercial identity-governance product can't be funded. Primary sources opened October 28, 2026: OMB M-25-21, M-25-22 and M-26-05 (PDFs from whitehouse.gov, text extracted with `pdftotext`); OMB's memoranda index page; NIST SP 800-218 and SP 800-218A (PDFs from nvlpubs.nist.gov, text extracted); CSRC's SSDF publications page; the SP 800-53 Rev. 5 release 5.2.0 OSCAL catalog and the Low, Moderate and High baseline profiles (JSON from usnistgov/oscal-content, parsed with a script); ServiceNow documentation pages for Policy and Compliance Management, Continuous Authorization and Monitoring, Understanding PDIs, source control integration, update sets and the Automated Test Framework; ServiceNow's developer blog post on PDI reclamation; SailPoint's Certifications Overview and Discovering Roles pages. No personal data was sent in any request.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Policy and Compliance Management plugin is a separate subscription requiring activation | No-funding path | verified | ServiceNow docs, PCM (Zurich), `com.sn_compliance` |
| 2 | Continuous Authorization and Monitoring plugin is a separate subscription | No-funding path | verified | ServiceNow docs, CAM (Zurich), `com.sn_irm_cont_auth_monitor` |
| 3 | Entra ID Governance licensing for access reviews and lifecycle workflows | No-funding path | verified (by cross-reference) | Book 04 Ch09 "Licensing: what needs Entra ID Governance" (already sourced there) |
| 4 | What staff can build: scoped app using platform features that come with the instance | No-funding path | restated-as-design | Chapter 11 design; example kit README |
| 5 | Custom table extending Task inherits number, state, assignment, approvals | No-funding path | restated-as-design (by cross-reference) | `examples/servicenow-sailpoint/README.md` table definition |
| 6 | SailPoint certifications: designated people such as managers or system owners review access and decide appropriate or revoke | Doesn't replace | verified | SailPoint Certifications Overview |
| 7 | SailPoint role discovery: "patented network graph analysis" | Doesn't replace | verified | SailPoint Discovering Roles |
| 8 | Commercial products maintain connector libraries, SoD engines, vendor support | Doesn't replace | restated-as-design (program assessment; table captioned as such) | General product category; not stated as any one product's fact |
| 9 | Sister infrastructure team as a staffing model | Sister team | restated-as-design | Program position; described generically, no agency facts |
| 10 | M-25-21 dated April 3, 2025; rescinds and replaces M-24-10 | Policy | verified | M-25-21 p. 1 |
| 11 | M-25-21 is the current OMB memo on agency AI use as of October 2026 | Policy | verified | OMB memoranda index through M-26-19 (Sept 10, 2026): the only later AI memo is M-26-04, *Increasing Public Trust in Artificial Intelligence Through Unbiased AI Principles* (Dec 11, 2025), whose title is not about agency AI use governance; its text was not opened, so the chapter doesn't characterize it |
| 12 | §3(b)(iv): within 270 days agencies should develop a generative AI acceptable-use policy (quote) | Policy | verified | M-25-21 §3(b)(iv) |
| 13 | §3(a)(i): designate a CAIO within 60 days; CAIO promotes adoption "through a governance and oversight process" and maintains the use case inventory | Policy / Staffing | verified | M-25-21 §3(a)(i)(A), (E) |
| 14 | §3(b)(v): inventory AI use cases at least annually | Policy | verified | M-25-21 §3(b)(v) |
| 15 | §4(a): high-impact definition (quote) | Policy | verified | M-25-21 §4(a) |
| 16 | A reviewed coding assistant isn't the principal basis for a high-impact decision | Policy | restated-as-design | Program reading; CAIO decides (stated in text) |
| 17 | M-25-22 covers AI acquisition, April 3, 2025 | Policy | verified | M-25-22 p. 1 (rescinds and replaces M-24-18) |
| 18 | M-26-05, Jan 23, 2026, rescinds M-22-18 and M-23-16; agencies develop assurance policies matching risk; names SP 800-218 as a reference | Policy | verified | M-26-05 pp. 1–2 |
| 19 | The seven AI rules (approved tools, line review, no data in prompts, no secrets, API checks, dependencies, record AI use) | Rules | restated-as-design | Program design; rules 2 and 6 supported by 800-218A and SSDF PW.4.4 |
| 20 | 800-218A: practices don't distinguish human-written and AI-generated code (quote) | Rules; SSDF section | verified | SP 800-218A "Scope" |
| 21 | SSDF PW.4.4 text (quote) | Rules | verified | SP 800-218 v1.1 |
| 22 | SA-3 text: acquire, develop and manage using a defined SDLC; define roles | SDLC | verified | 800-53 r5 5.2.0 catalog |
| 23 | PDI: developer program free; PDIs can't be clone sources/targets for customer instances because they belong to ServiceNow | Environments | verified | ServiceNow "Understanding PDIs" (Yokohama) |
| 24 | PDI reclamation: 90 days or older and no explicit login in 10 days; back up update sets, connect to source control (July 2026) | Environments | verified | ServiceNow Developer Blog, July 10, 2026. The older docs page still says ten days unused; the blog is newer and is cited |
| 25 | Source control integration: manage versions from a non-production instance; not supported on production (quotes) | Source control | verified | ServiceNow docs (Zurich) |
| 26 | SSDF PS.1.1: store all forms of code under least privilege | Source control | verified | SP 800-218 v1.1 |
| 27 | Update sets: dev → test → prod; never migrate the same update set from multiple sources; set Ignore on production (quotes) | Update sets | verified | ServiceNow "Get started with update sets" (Zurich) |
| 28 | Fix defects in a new update set, never in place | Update sets | restated-as-design | Program design, consistent with ServiceNow's dev → test process |
| 29 | ATF: confirm the instance works after a change; execution property disabled by default; run only on non-production (quotes) | Tests | verified | ServiceNow "Test your apps with the ATF" (Xanadu) |
| 30 | SSDF PW.7.1, PW.7.2: decide on review/analysis; "record and triage all discovered issues" | Gates | verified | SP 800-218 v1.1 |
| 31 | Approval-rule, routing and integration-permission changes are changes to controls, never standard | Gates | restated-as-design (by cross-reference) | Chapter 10 |
| 32 | CM-3, CM-3(2), CM-4, CM-4(1), CM-5, AC-5, SA-10, SA-11, SA-15 text | Controls table | verified | 800-53 r5 5.2.0 catalog |
| 33 | Baselines: CM-4, CM-5 L/M/H; AC-5, CM-3, CM-3(2), SA-10, SA-11, SA-15 M/H; CM-4(1) High only | Controls table | verified | 800-53B 5.2.0 profiles (parsed) |
| 34 | SA-10/11/15 apply to the agency when its staff are the developer | Controls table | restated-as-design | Program reading, labeled in text |
| 35 | SSDF v1.1 final Feb 2022; SP 800-218 Rev. 1 (v1.2) draft released Dec 17, 2025, still draft Oct 2026 | SSDF | verified | CSRC SSDF publications page (updated Oct 6, 2026) |
| 36 | SSDF task text in the mapping table (PO.1.1, PO.1.2, PO.2.1, PO.2.2, PO.3.2, PO.5.1, PS.1.1, PW.4.4, PW.7.x, PW.8.x, RV.1.1) | SSDF | verified | SP 800-218 v1.1 |
| 37 | 800-218A July 2024; adds AI-specific practices to SSDF 1.1; scope is AI model development; three audiences incl. AI system acquirers | SSDF | verified | SP 800-218A Abstract, Audience, Scope |
| 38 | 800-218A considerations: human-in-the-loop review beyond thresholds (PO.4); AI model not in a critical security path without a human (PW.1) | SSDF | verified | SP 800-218A profile table |
| 39 | Responsibility rows added to Chapter 10's matrix | Staffing | restated-as-design | Program design, using Chapter 10's codes |
| 40 | M-25-21 §2(e)(i): leverage AI training to upskill existing staff (quote) | Training | verified | M-25-21 §2(e)(i) |
| 41 | SSDF PO.2.2: role-based training and periodic proficiency review | Training | verified | SP 800-218 v1.1 |
| 42 | Training sequence; reviewer qualification; two maintainers per component | Training | restated-as-design | Program design |
| 43 | Evidence records map to AC-5, CM-3, CM-3(2), CM-4, CM-5, SA-10, SA-11 | Evidence | verified (control text) / restated-as-design (mapping) | 800-53 r5 catalog; program design |
| 44 | SA-11(c) quote: produce evidence of the execution of the assessment plan and results | Evidence | verified | 800-53 r5 catalog |
| 45 | Ticket-to-machine evidence model (owner, clock, approval, result) | Evidence | verified (by cross-reference) | Book 13 Ch10, App B |
| 46 | A Copilot agent built in Agent Builder carries standing instructions (8,000-character limit) and starter prompts; the agency can't retrain the model | Copilot section | verified | Microsoft Learn, Build agents in Agent Builder; declarative agent manifest (accessed Oct 28, 2026) |
| 47 | Agent Builder available in GCC and GCC High, not DoD | Copilot section | verified | Microsoft Learn, Agent Builder regional availability; Copilot service description |
| 48 | Embedded (uploaded) files not supported as knowledge in GCC | Copilot section | verified | Microsoft Learn, Add knowledge sources in Agent Builder |
| 49 | SharePoint/OneDrive knowledge needs a Microsoft 365 Copilot license or usage-based billing; usage-based billing not supported in GCC/GCC High | Copilot section (pack README) | verified | Microsoft Learn, Agent capabilities and licensing models |
| 50 | The pack's agent drafts only; every gate in the chapter still applies | Copilot section | restated-as-design | Program design; examples/copilot-agent-pack |

## Not carried, and why

| Considered | Why not |
|---|---|
| Any AI coding assistant's FedRAMP status, or recommending one | Product status changes; the chapter requires approval under the agency's policy and authorization like any cloud service. The Copilot section names Microsoft 365 Copilot only as the case where it is the assistant an agency has already approved |
| ServiceNow's own generative-AI coding features | Separately licensed add-ons, which the no-funding premise excludes; licensing terms not verified |
| Exact license prices for the GRC modules or identity-governance products | Not verified from a primary source; the chapter states only that the modules are separate subscriptions |
| M-26-04 (unbiased AI principles) | Text not opened; mentioned only in this log. Worth reading before an agency acquires an assistant |
| ServiceNow release cadence | Not verified; the chapter says "every platform upgrade" instead |
| SA-11(1) static code analysis | In no NIST baseline; left out to keep the table to baseline controls and CM-4(1) |

## Footnotes

19 definitions, all prefixed `c13-`; checked unique across the book (see the PR description for the bundle build).
