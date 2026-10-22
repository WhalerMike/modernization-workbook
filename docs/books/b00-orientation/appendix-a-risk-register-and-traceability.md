---
title: "Appendix A — Risk Register and Control Traceability"
description: "The program's risk register, re-keyed to Book 01's phases and gates and corrected, and the traceability from each phase's milestones to the NIST SP 800-53 Rev. 5 control families it advances."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b00-orientation
book: B00
part: Appendix
series-order: 90
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix A — Risk Register and Control Traceability

*A program plan doesn't satisfy a control, but it can show which controls each milestone moves forward and which risks each gate has to look at.*

::: {.callout-note}
## In this appendix
What the plan's two compliance hooks, SP 800-53 controls PL-2 and RA-3, actually ask for and how the program's artifacts feed them. Then the milestone-to-control-family traceability, phase by phase in Book 01's terms. Then the risk register: the master plan's twenty-two risks and the project plan's five program risks, re-keyed to Book 01's phases, corrected where the published books have overtaken them, and joined to the controls they bear on.
:::

::: {.callout-important}
## Compliance-enabling, not a compliance claim
This appendix helps an agency reuse the program's plan and register in its own security documentation. It doesn't claim that following the program satisfies any control. Whether a control is satisfied depends on the agency's system boundary, implementation and assessor, and the agency authorizes its own systems. Control identifiers and titles are from SP 800-53 Rev. 5, release 5.2.0, checked on October 21, 2026.[^aA-53] [Book 01, Appendix A](../b01-transformation-arc/appendix-a-requirements-mapping.md) maps the program's design to federal requirements; this appendix maps its plan.
:::

## What PL-2 and RA-3 ask for

The master plan's compliance amendment tied its milestone traceability to PL-2 and its risk register to RA-3. Both controls are about the system, not the project, and it helps to be exact about what each asks.

- **PL-2, System Security and Privacy Plans**, asks for security and privacy plans for the system that, among other things, define its components, describe its dependencies and connections, describe the controls in place or planned with the rationale for any tailoring, and are reviewed and approved by the authorizing official before implementation. It also asks that the plans be reviewed on a defined frequency and updated when the system or its environment changes.[^aA-53]
- **RA-3, Risk Assessment**, asks the organization to identify threats and vulnerabilities, determine the likelihood and magnitude of harm, document and review the results, and update the assessment on a defined frequency or when there are significant changes to the system or its environment.[^aA-53]

So the program plan isn't the PL-2 plan and the program's register isn't the RA-3 assessment. What they are is the record of planned change that both must keep up with. A modernization changes the system's components, dependencies and controls at every gate; each gate is therefore a point where the agency's system security plan needs updating (PL-2) and its risk assessment re-reviewing (RA-3). Security risks that carry residual exposure past a gate become plan of action and milestones items under CA-5, which asks for remediation actions to be planned and the plan kept current from assessments and continuous monitoring.[^aA-53] The program's evidence, assessment output and drift reports are inputs to all three.

The amendment pointed to a system security plan and a POA&M by internal document number. Neither belongs to this workbook; the documents that count are the agency's own.

## The control families

SP 800-53 Rev. 5 groups its controls into twenty families. The program's milestones touch most of them; the table below names them so the traceability can use the two-letter identifiers.[^aA-53]

| ID | Family | ID | Family |
|---|---|---|---|
| AC | Access Control | PE | Physical and Environmental Protection |
| AT | Awareness and Training | PL | Planning |
| AU | Audit and Accountability | PM | Program Management |
| CA | Assessment, Authorization, and Monitoring | PS | Personnel Security |
| CM | Configuration Management | PT | Personally Identifiable Information Processing and Transparency |
| CP | Contingency Planning | RA | Risk Assessment |
| IA | Identification and Authentication | SA | System and Services Acquisition |
| IR | Incident Response | SC | System and Communications Protection |
| MA | Maintenance | SI | System and Information Integrity |
| MP | Media Protection | SR | Supply Chain Risk Management |

Every control named in this appendix is in the Moderate baseline; the ones that aren't also in the Low baseline are noted below the traceability table.[^aA-53b]

## Milestone-to-control-family traceability (PL-2)

Each row reads one of Book 01's phases ([Chapter 05](05-the-program-plan.md#mapping-the-master-plan-onto-the-gates)), the master-plan milestones that fall in it, and the control families those milestones advance, with example controls. "Advance" means the milestone produces an implementation or evidence the agency can cite for that control in its plan; it doesn't mean the control is satisfied. The mapping is the program's, made at the family level as the master plan intended; the agency's system security plan holds the per-control disposition.

| Book 01 phase and gate | Master-plan milestones | What they produce | Families advanced (example controls) | Evidence the agency can cite |
|---|---|---|---|---|
| 0 — Pre-flight; G0 Ready to Plan | M-001 to M-007 (platform host); M-008 to M-010 (read-only, delegated and security assessments) | The platform host and repository; the read-only and full assessments; the security assessment | CM (CM-2, CM-3, CM-8); RA (RA-3, RA-5); PL (PL-2 component and dependency inputs); AC (AC-6 for the assessment and service principals) | Committed assessment with provenance; security findings and remediation plan; repository branch protections and review history ([Chapter 08](08-pre-flight-and-assessment.md)) |
| 1 — Foundation; G1 Foundation Complete | M-011 to M-013 (plan generation and approval, pre-pilot preparation), the first work after G0; M-014 to M-021 (attribute taxonomy, dynamic groups, Intune policy, Conditional Access, sync, hybrid DNS and Cloud PKI designs; design approval) | The eight approved modernization plans; approved designs; the identity primitives and Conditional Access baseline that Book 01 builds in this phase | AC (AC-2, AC-3, AC-6); IA (IA-2, IA-2(1), IA-2(2), IA-5); CM (CM-2, CM-6); SC (SC-17, SC-20, SC-21, SC-22); PL (PL-8) | Design records and their approvals; Conditional Access policy set; emergency access account records |
| 2 — Pilot division; G2 Pilot Clean | M-022 to M-031 (sync deployed, pilot devices joined, Intune policies, Conditional Access enforced, PIM, DNS, Cloud PKI, Entra certificate-based authentication, Arc servers, pilot success) | The whole pattern working on one scope, held drift-clean | IA (IA-2(12), IA-5(2)); AC (AC-6(5)); CM (CM-3, CM-6); SC (SC-17); CA (CA-7) | Pilot evidence packets; PIM role settings; certificate-based authentication configuration; drift-hold results |
| 3 — General rollout; G3 Rollout Complete | M-032 to M-037 (four waves; GPOs disabled for migrated OUs; dynamic groups fully populated) | Every division migrated; attribute coverage complete | AC (AC-2); CM (CM-6, CM-8); SI (SI-4); CA (CA-7) | Wave exit records; device and server inventories reconciled with the assessment; drift reports |
| 4 — Legacy retirement; G4 Legacy Quiet | M-038 to M-044 (AD FS, AD CS issuance, DNS forwarders, GPO links, trusts, legacy servers; cutover validation) | Legacy components retired, each with its rollback | CM (CM-3, CM-7, CM-8); IA (IA-5(2)); SC (SC-17); SA (SA-22) | Cutover validation checklist ([Chapter 10](10-retirement-steady-state-and-success.md)); retirement plans and rollback records |
| 5 — AD DS retirement; G5 AD Retired | None: the master plan stops before this phase | Domain controllers retired or islanded; records retained; storage sanitized | CM (CM-8); AU (AU-11); SI (SI-12); MP (MP-6); SA (SA-22); CA (CA-5) | Final assessment and evidence packet; records disposition; sanitization records |
| 6 — Steady state | M-045 to M-048 (drift assessment: daily drift detection and a weekly reassessment; monthly compliance report, quarterly access review, annual architecture review) | Continuous governance | CA (CA-5, CA-7); RA (RA-3, RA-5); AC (AC-2, AC-6(7)); AU (AU-6); SI (SI-4); PL (PL-2 review and update) | Drift reports and SLA adherence; compliance reports; access review results; architecture review record |
| Every gate | Gate review | The gate decision and the updated register | PL (PL-2 update); RA (RA-3 review); CA (CA-5) | Gate review record; risk register as of the gate; POA&M items opened or closed |

Three notes on reading it:

- **SA-22, Unsupported System Components**, asks that components be replaced when vendor support ends, or that alternative support be arranged.[^aA-53] It's where the program's retirement milestones meet the end-of-support dates in [Chapter 01](01-why-modernize-now.md).
- **Some controls start at Moderate.** CM-3, AC-6, AC-6(5), AC-6(7), IA-5(2), SC-17, SC-28 and PL-8 are in the Moderate baseline but not the Low.[^aA-53b] An agency authorizing a Low system can still use the evidence, but shouldn't cite those controls as baseline requirements.
- **Phase 5 has no master-plan milestones**, which is why its row cites Book 01 ([Chapter 10](10-retirement-steady-state-and-success.md#phase-5-ad-ds-retirement)). Its controls are the ones a decommission most often skips: retention of audit records (AU-11) and information (SI-12) before hardware goes, and media sanitization (MP-6) after.[^aA-53]

## The risk register (RA-3 input)

The register below is the program's starting register. Every risk opens as Open; the live status, the review date and the residual rating belong in the agency's own register, which is reviewed at every gate review. Likelihood and impact use the master plan's scale (likelihood Low, Medium or High; impact Low to Critical); an agency can re-rate them on whatever scale its risk assessment uses, and NIST's guide for conducting risk assessments is SP 800-30 Rev. 1.[^aA-30]

Two decision rights apply to every row. Risk acceptance belongs to the authorizing official, not to the program: the master plan gave it jointly to the security lead and the steward, but in the program's decision matrix the authorizing official accepts residual risk ([Book 01, Chapter 09](../b01-transformation-arc/09-who-leads-the-transformation.md#decision-rights-across-the-program)). And a security risk that stays open past a gate with residual exposure becomes a POA&M item (CA-5).

### Program-level risks

These come from the project plan and shape the whole program rather than one phase. [Chapter 05](05-the-program-plan.md#risks-that-shape-the-plan) explains how the plan answers each.

| ID | Risk | Mitigation | Owner | Controls |
|---|---|---|---|---|
| P-1 | Hidden dependencies are missed in discovery | Structured assessment; a pilot designed to surface unknowns early | Program office | RA-3, CM-8 |
| P-2 | Competing sources of truth persist | One authoritative origin designated per object class; contention on the authoritative source tracked as its own drift class | Program office | CM-2, AC-2 |
| P-3 | The organization resists making authority explicit | Early stakeholder alignment; a pilot that shows controlled rather than disruptive change | Executive sponsor | PL-2 (roles and responsibilities) |
| P-4 | Tooling leads the design | Target architecture and change-control pattern defined before any tool is chosen or configured | Program office | PL-8, SA-8 |
| P-5 | Physics or data residency limits centralization | Truth centralized logically; only subordinate copies distributed physically ([Book 09](../b09-network/index.md)) | Program office | PL-8 |

### Delivery risks

The master plan's twenty-two risks, re-keyed to the Book 01 phase where each bites, with the corrections noted.

| ID | Risk | L | I | Phase | Mitigation (corrected where noted) | Owner | Controls |
|---|---|---|---|---|---|---|---|
| R-001 | The assessment finds undocumented trusts that block migration | M | H | 0 | The read-only assessment maps every trust before anything moves; the trust map drives the trust decommission plan | Identity lead | CM-8, RA-3 |
| R-002 | Critical AD CS misconfiguration findings force emergency PKI remediation | H | Crit | 0 | The security assessment scans for the current list of certificate escalation patterns, not a fixed range: SpecterOps's 2021 research named ESC1 to ESC8,[^aA-esc] and Microsoft Defender for Identity now also assesses later ones such as ESC15 ([Chapter 08](08-pre-flight-and-assessment.md#five-steps-from-default-read-to-approved-plans));[^aA-mdi-certs] Critical findings are closed before G0 (no open priority-one findings) and High findings before the pilot. Detection and remediation: [Book 07, Chapter 03](../b07-pki/03-hardening-what-stays.md) | PKI lead | RA-5, SC-17 |
| R-003 | Legacy applications depend on NTLM | H | H | 0, 4 | Inventory during assessment; NTLM auditing from Phase 1. *Corrected:* the source's "exception policies in Conditional Access" can't work, because Conditional Access can't evaluate NTLM ([Book 01, Chapter 08](../b01-transformation-arc/08-access-plane.md)); each NTLM dependency is a finding with an owner and a dated exception ([Book 06, Chapter 15](../b06-data-platform/15-the-three-phases-of-ntlm-elimination.md)) | Security lead | IA-2, CM-7 |
| R-004 | Directory synchronization fails during the pilot | M | H | 2 | Cloud Sync by default, Connect Sync where a Connect-only requirement applies, with a staging server; validate before enabling the schedule; monitor sync health ([Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md)) | Identity lead | AC-2, CM-3 |
| R-005 | Cloud PKI licensing is delayed | M | M | 1 | Confirm entitlement before the pilot. *Updated:* Cloud PKI needs an add-on to Intune Plan 1 or 2 (the Intune Suite or the standalone add-on), and from July 2026 Microsoft 365 E5 and E7 include it;[^aA-cloudpki] confirm availability in the agency's cloud, since Microsoft says Intune add-ons aren't supported in sovereign clouds[^aA-addons] | Project manager | SA-2 |
| R-006 | Name resolution fails during hybrid coexistence | M | H | 2, 3 | Two-way resolution tested at pilot sites; synthetic probes; AD DNS kept as fallback ([Book 08, Chapter 10](../b08-ddi/10-migration-sequence.md)) | DNS lead | SC-20, SC-21, SC-22 |
| R-007 | Users resist passwordless sign-in | M | M | 2, 3 | Willing early adopters first; training; departmental champions; phased enforcement | Identity lead | AT-2 |
| R-008 | The platform host fails (single point of failure) | L | H | 0 on | Daily backup; a standby replica that never becomes a second writer ([Book 01, Chapter 03](../b01-transformation-arc/03-platform-foundation.md)); restore tested | Infrastructure lead | CP-9, CP-10 |
| R-009 | Endpoint security blocks the Azure Arc agent | M | M | 1, 2 | Pre-approve the Connected Machine agent in endpoint protection policy; test on pilot servers first | Infrastructure lead | CM-7 |
| R-010 | GPO settings have no Intune equivalent | H | H | 1–3 | Gap analysis names unsupported settings; custom OMA-URI or ADMX ingestion where possible; accepted gaps documented ([Book 05, Chapter 08](../b05-devices/08-gpo-to-intune-policy-migration.md)) | Endpoint lead | CM-6 |
| R-011 | Certificates without strong mapping fail authentication against AD | M | Crit | 0 on | *Corrected:* this is no longer a future risk. Domain controllers moved to Full Enforcement with the February 2025 Windows update, and the option to fall back to Compatibility mode ended with the September 9, 2025 update;[^aA-kb5014754] certificates without a strong mapping already fail certificate-based authentication against domain controllers. Audit templates and Intune certificate profiles for the SID mapping. Entra certificate-based authentication uses its own username bindings and is a separate check ([Book 07](../b07-pki/index.md)) | PKI lead | IA-5(2), SC-17 |
| R-012 | Budget constraints delay license procurement | M | M | 0 | License business case submitted in Phase 0; budget approved before design begins | Project manager | SA-2 |
| R-013 | Key people leave during a critical phase | L | H | Any | Two people cross-trained per workstream; procedures in the repository; no single-person dependencies | Project manager | AT-3 |
| R-014 | A regulatory audit falls in a migration window | L | M | Any | Full audit trail in the repository; change freeze during the audit if required | Security lead | CA-2 |
| R-015 | Split-brain DNS causes a production outage | L | Crit | 2–4 | Split-brain patterns designed deliberately; tested at each wave; AD DNS authoritative until its zones move ([Book 08, Chapter 10](../b08-ddi/10-migration-sequence.md)) | DNS lead | SC-20, SC-22 |
| R-016 | Dynamic group rules produce the wrong scope | M | M | 1–3 | Rules validated in non-production first; membership changes monitored; workflows designed around processing that can take more than 24 hours ([Book 01, Chapter 04](../b01-transformation-arc/04-identity-transformation.md)) | Endpoint lead | AC-2, AC-3 |
| R-017 | Certificate-to-user binding breaks for Entra certificate-based authentication | M | H | 2, 3 | Staged rollout; sign-in logs monitored for binding failures; a documented, time-limited fallback method during the transition | PKI lead | IA-2(12), IA-5(2) |
| R-018 | The repository mirror stops syncing without warning | L | L | 0 on | *Corrected:* a hook can't watch a pull mirror, because mirrored commits never pass through the receive hooks; the drift reporter checks the mirror's last sync and alerts if it is stale for more than 24 hours ([Chapter 08](08-pre-flight-and-assessment.md#repository-conventions)) | Infrastructure lead | SI-4 |
| R-019 | Schema conflicts block the organizational attributes | L | M | 1 | The assessment lists attributes already in use; the program uses the canonical attribute map ([Book 03, Chapter 06](../b03-hr-identity/06-canonical-attribute-schema.md)) | Identity lead | CM-2 |
| R-020 | Retiring AD FS breaks legacy application sign-in | M | H | 4 | Every relying party trust inventoried and moved to Entra ID first. *Corrected:* the source's 72-hour rollback window is shorter than Microsoft's one-week observation before decommissioning; the program keeps the farm restorable for the windows in [Chapter 10](10-retirement-steady-state-and-success.md#phase-4-legacy-retirement) | Identity lead | CM-3, IA-2 |
| R-021 | The assessment workstation is compromised with sensitive AD data | L | M | 0 | Privileged access workstation with restricted network access; assessment output encrypted at rest; *updated:* the workstation is sanitized, not just "destroyed," after the assessment, under SP 800-88 Rev. 2[^aA-88] | Security lead | AC-6, SC-28, MP-6 |
| R-022 | Pilot users report a poor experience | L | L | 2 | Mid-pilot check-in; concerns addressed before the end-of-pilot survey | Project manager | AT-2 |

### Risks the corrections add

The published books surfaced three risks the master plan didn't list. They're the program's additions.

| ID | Risk | L | I | Phase | Mitigation | Owner | Controls |
|---|---|---|---|---|---|---|---|
| R-023 | The AD domain's own DNS zones or domain controller certificates are retired before the domain | M | Crit | 4 | Locator zones and domain controller and LDAPS certificates stay until Phase 5; G4 criteria exclude them explicitly ([Chapter 10](10-retirement-steady-state-and-success.md)) | DNS lead; PKI lead | SC-22, SC-17 |
| R-024 | Access records are lost when domain controllers, AD FS or sync servers are decommissioned | M | H | 4, 5 | Records officer consulted before any decommission; retention completed first ([Book 01, Chapter 09](../b01-transformation-arc/09-who-leads-the-transformation.md#records-management-and-privacy)) | Program office | AU-11, SI-12 |
| R-025 | Steady-state governance decays after the project team leaves | M | H | 6 | Handover recorded in the repository with an owner per drift class, severity and review; annual architecture review | Steward | CA-7, PL-2 |

## Key takeaways

1. PL-2 and RA-3 are system controls. The program plan and register don't satisfy them; they tell the agency when its security plan and risk assessment have to be updated, which is at every gate.
2. Traceability is kept at the family level, per Book 01 phase; the agency's system security plan holds the per-control disposition.
3. Risk acceptance belongs to the authorizing official; residual security risk past a gate becomes a POA&M item.
4. Two of the source's risks were stale: certificate strong mapping is already enforced, and the AD FS rollback window was too short.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 10 — Retirement, Steady State and Measuring Success](10-retirement-steady-state-and-success.md) · [Book index](index.md) · [Next: Appendix B — The Engagement Archetype (Illustrative) →](appendix-b-engagement-archetype.md)
:::

[^aA-53]: NIST, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, release 5.2.0 (August 27, 2025), control families and controls PL-2, RA-3, CA-5, SA-22, AU-11, SI-12 and MP-6, <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>; control titles and statements read from NIST's OSCAL Rev. 5 catalog, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5> (both accessed Oct 21, 2026).
[^aA-53b]: NIST, SP 800-53 Rev. 5 Low and Moderate baseline profiles (OSCAL), `NIST_SP-800-53_rev5_LOW-baseline_profile.json` and `NIST_SP-800-53_rev5_MODERATE-baseline_profile.json`, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5> (accessed Oct 21, 2026). Every control cited in this appendix is in the Moderate profile; CM-3, AC-6, AC-6(5), AC-6(7), IA-5(2), SC-17, SC-28 and PL-8 are absent from the Low profile.
[^aA-30]: NIST, SP 800-30 Rev. 1, *Guide for Conducting Risk Assessments*, September 2012, <https://csrc.nist.gov/pubs/sp/800/30/r1/final> (accessed Oct 21, 2026).
[^aA-esc]: Will Schroeder and Lee Christensen, "Certified Pre-Owned," SpecterOps, June 17, 2021 (escalation classes ESC1 through ESC8), <https://specterops.io/blog/2021/06/17/certified-pre-owned/> (accessed Oct 21, 2026).
[^aA-cloudpki]: Microsoft Learn, "Overview of Microsoft Cloud PKI for Microsoft Intune," Prerequisites, <https://learn.microsoft.com/intune/cloud-pki/>, and "Microsoft Intune planning guide," Step 3 (from July 2026, Microsoft 365 E5 and E7 include Microsoft Cloud PKI), <https://learn.microsoft.com/intune/fundamentals/planning-guide> (both accessed Oct 21, 2026).
[^aA-addons]: Microsoft Learn, "Use Microsoft Intune Suite add-on capabilities" ("Intune add-ons are currently not supported in Sovereign clouds"), <https://learn.microsoft.com/intune/fundamentals/add-ons> (accessed Oct 21, 2026).
[^aA-kb5014754]: Microsoft Support, "KB5014754: Certificate-based authentication changes on Windows domain controllers," Timeline for Windows updates, <https://support.microsoft.com/topic/kb5014754-certificate-based-authentication-changes-on-windows-domain-controllers-ad2c23b0-15d8-4340-a468-4d4f3b188f16> (accessed Oct 21, 2026).
[^aA-88]: NIST, SP 800-88 Rev. 2, *Guidelines for Media Sanitization*, September 2025 (final September 26, 2025; supersedes Rev. 1, December 2014; no withdrawal or later revision listed), <https://csrc.nist.gov/pubs/sp/800/88/r2/final> (accessed Oct 21, 2026).
[^aA-mdi-certs]: Microsoft Learn, "Security assessment: Certificates" (includes "Prevent Certificate Enrollment with arbitrary Application Policies (ESC15)," CVE-2024-49019), <https://learn.microsoft.com/defender-for-identity/security-posture-assessments/certificates> (accessed Oct 21, 2026).
