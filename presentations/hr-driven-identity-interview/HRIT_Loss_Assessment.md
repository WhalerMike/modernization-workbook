# What the HR-Driven Identity bundle lost from the HRIT corpus

**Thesis being tested:** *implement HR-driven Entra ID, AD and ICAM on HRIT standard attributes*, not "implement HRIT".

**Compared:**
- **The bundle.** `hr-driven-iam-bundle.docx`: 12 chapters, as published 2026-10-19.
- **The full corpus.** This has four parts:
  - the whitepaper `federal-hrit-productization.docx`;
  - the 34 Spec 2 deliverables in `src/uiao/canon/specs/Spec2-*`;
  - ADRs 051–054 and 065, Doc 22 and the NIST/FICAM crosswalk;
  - the nine workbook pages that modernization-workbook PR #33 merged into the bundle (recovered from git).

Four independent read-throughs produced the findings. I re-checked the headline claims myself.

---

## Bottom line

1. **The thesis itself was lost.** Only two sources ever said it outright. A pre-consolidation page called a single Core HCM "an opportunity to treat the HR system as the authoritative source", and ADR-052 calls HRIT "the inflection point". Neither reached the bundle. The bundle presents Federal HR 2.0 only as a deadline, five times, and as feed churn. "Opportunity" appears zero times.
2. **The ICAM half was lost.** The corpus framed this as an identity-plane program governed by federal mandates. The bundle has no Privacy Act, no SORN or routine-use basis, no OMB M-22-09, and no IAL, AAL or FAL. It has no PIV trust chain or federation, no three-pattern model of how ICAM touches HR, and no "AD before and after" complementarity table. What's left is a provisioning pipeline.
3. **Most of the assurance material was lost.** That includes:
   - the security assessment;
   - acceptance criteria;
   - the cutover runbook;
   - decommissioning the old HR-to-AD connector;
   - the quarantine contract;
   - scope filters, including the rule that leave and suspension are not leavers;
   - which event wins when two events arrive together.

   The bundle keeps the shape of the pipeline but not the rules that make it safe.
4. **"HRIT standard attributes" was never in the corpus.** This is the most important finding, and it isn't a loss. No canon file defines OPM data-standard elements: no Guide to Data Standards element list, nature-of-action codes, pay plan, occupational series, supervisory status, agency/subelement or POI. The canonical schema (Spec2-D1.1) is vendor-neutral, and every source field in the bundle is named after an Oracle field. The only pointer to the standards is a citation list in `inbox/HRIT Modernization/HRIT-IAM-Findings.md` §6.3: the solicitation requires compliance with the GPPA, the Guide to Data Standards and EHRI standards. **Your thesis rests on a layer that has to be written, not restored.**

---

## Critical losses (to support the thesis)

| # | What was lost | Source | What the bundle has now |
|---|---|---|---|
| C1 | HRIT as the opportunity: about 100 agency HCMs collapse to one platform with one interface, moving from "file and mainframe handoffs to a federated API surface" | wb-pre33 `hrit-identity-organizational-ssot.md` §Purpose; Vol I Book 04 "Why the agency touches it"; ADR-052 | Deadline and churn framing (Ch 00, Ch 02, Ch 10) |
| C2 | Privacy Act frame: HR is the system of records; identity is a routine-use consumer under SORN GOVT-1 / GOVT-7. Pushing HR attributes into AD and Entra ID is a disclosure that needs that basis | whitepaper §1, §5, §7; Spec2-D6.1 §5–6, §8 | Nothing |
| C3 | AD and Entra ID complementarity: the directory moves, but the identity owner is HR "before and after" | whitepaper §6 table | A one-line pointer to the AD → Entra guide |
| C4 | OMB M-22-09 (phishing-resistant MFA, continuous verification) as an ICAM driver | whitepaper §1, §5; ADR-052 | Nothing |
| C5 | Security assessment of the data flow: encryption on every leg, PII at rest, no PII off-boundary, threat model, how the middleware authenticates (certificate or managed identity, no secrets) | Spec2-D3.8, D3.1 §4.1 | One phrase. Ch 10 cites an **"Appendix B" that does not exist** |
| C6 | Decommissioning the old connector: 7-day proof that the new path is the sole writer, credential revocation, irreversible step signed off | Spec2-D5.2 | One sentence |
| C7 | Acceptance criteria (UAT in business terms, four-role sign-off) and a validation report that gates cutover | Spec2-D4.4, D4.5 | Nothing |
| C8 | Scope filters, and leave, suspension, furlough and reservist duty treated as **not** leavers; detail and secondment treated as movers | Spec2-D2.8 §3–8 | One Phase 1 bullet |
| C9 | Event precedence: leaver wins, a worker-type change is a conversion and is handled before a mover | Spec2-D2.3 §3; D2.2; D2.5 §2.2 | "An out-of-order pair is a bug". The problem is named, but no rule is given |
| C10 | Rescinded offer: clean up the account that was created before the start date | Spec2-D2.7 §6.1 | Nothing (Ch 04 lists the `cancelworkrelship` feed only) |
| C11 | Partial leaver (disabled, but sessions not revoked) treated as an incident; resume from the first incomplete step | Spec2-D2.3 §10–11; D2.6 | "Escalate through an alternate path" |
| C12 | employmentStatus enum and its effect on the account (on leave → stays active; rescinded → cleanup); locationCode required; seven worker types, each with a profile (pre-hire window, license, retention) | Spec2-D1.1, D1.3, D1.6 | A single "Employment active" row; worker type with no codes |

## Important losses

- **Federal HR ecosystem roles.** USA Staffing's RPI hire trigger, USAJobs pre-hire, GRB, eOPF and EHRI as downstream consumers, and USAccess (whitepaper §2–3; D6.1).
- **The three integration patterns.** (A) an HR system of record, (B) OPM lifecycle services, (C) trust anchor and federation (whitepaper §3).
- **The PIV trust chain and IAL/AAL recorded per person.** "No proofing evidence is itself a finding" (NIST/FICAM crosswalk §4; ADR-051, ADR-052).
- **SaaS integration surfaces.** A SaaS HR system integrates only through identity-plane surfaces (Book 04).
- **Downstream ICAM consumers.** Position-based privileged eligibility, `employeeId` as the SIEM join key, and activity from a separated worker treated as an alert (Book 04).
- **Joint governance.** Data governance and identity run as one program, with the CDO and the identity team sharing one designation register (`hrit-to-cloud-identity-reference.md`).
- **Single-ATO reciprocity.** The platform is authorized once and agencies own only their identity leg (ADR-054). This was pre-award; re-verify.
- **The quarantine contract.** Failure reasons, an HR snapshot, never auto-resolved, per-class SLAs (D2.6).
- **Manager-link rules.** An unresolved manager never blocks a joiner; a leaver's direct reports are handed back to HR for reassignment (D2.1, D2.3).
- **Rehire and conversion details.** The match window, manual groups not restored, a mandatory access review, and employee → contractor as a risk case (D2.4, D2.5).
- **Data quality.** A closed schema, cross-field rules, freshness SLA and rate targets (D1.1 §4, D1.8).
- **AD-side rules.** sAMAccountName and OU derivation, agent host hardening, blocking AD-side writes by ACL, and the agent retirement runbook (D1.4, D3.3, D3.6).
- **Operations.** Mapping config version-controlled and checked in CI; a pause switch for mass mis-provisioning; health dashboard and alert tiers (D3.4, D3.1 §10.3, D5.6, D3.7).
- **The HR-source onboarding playbook.** Includes which source wins on conflict (D5.4).

## Conflicts: where the bundle is right and the corpus is wrong

- `/bulkUpload`: the corpus has the middleware choose POST or PATCH and send only changed fields. Microsoft's contract is the opposite: send the full record and let the service decide. **The bundle is right.**
- The corpus has HCM writing to AD through Cloud Sync writeback, and claims a native Oracle connector exists. **The bundle matches Microsoft.**
- The corpus says "Azure Government". GCC-Moderate uses the worldwide endpoints. **The bundle is right.**
- Rehire with a new HR ID: the corpus makes it a new identity. The bundle's enterprise person key is the stronger IA-4 position.
- **Unresolved, check before presenting:**
  - Leave of absence: inactive (D3.1) or active with a flag (D4.4, D2.8)?
  - Leaver SLA: minutes (D4.4, D5.5) or the workflow schedule (bundle)?
  - "No OPM document mandates Entra ID integration" (bundle) vs solicitation §5.1.1 #3, which the corpus cites. That clause concerns federation for *users of the HR platform*, not provisioning into the agency's directory. Probably compatible, but read the clause.
  - The extension-attribute slots collide between the corpus and the bundle.

## Correctly dropped (keep out of the public workbook)

UIAO, OrgPath, ADR numbers, Spec numbers, "substrate", `DRIFT-*` labels, productization and bid-window posture, named shared-service providers as targets, and OPM Entra and OPM APIM stated as facts (pre-award). The bundle also rightly softened four overclaims:
- "the Evidence Act requires one system of record";
- "M-19-17 makes HR authoritative";
- "no alternate closure path";
- "HR is where identity proofing happens" (under FIPS 201, HR sponsors proofing; it doesn't perform it).

Bring these ideas back in neutral wording:
- the identity side never writes HR-mastered facts;
- privileged operations are anchored to PIV;
- assurance level is recorded per person;
- an organization code missing from HR's controlled list stops the action;
- one authorized HR platform, many agencies, each owning its own identity leg (pending verification).

---

## What the thesis needs that never existed: the standard-attribute layer

To make this "HR-driven Entra ID **on HRIT standard attributes**", add an OPM data-standards layer between Core HCM and the canonical model:

| OPM standard element (verify against the current Guide to Data Standards) | Identity use |
|---|---|
| Agency / subelement | Legal employer and component scope (`companyName`, top-level org code) |
| Personnel office identifier (POI) | Servicing HR office: routing and delegated administration |
| Duty station | Location of record: usage location, physical-access and location-based policy scoping |
| Occupational series, pay plan and grade | Position category: role-eligible access packages |
| Supervisory status | Approver and reviewer eligibility; manager-chain integrity |
| Tenure, type of appointment, work schedule | Worker-type and lifecycle profile (pre-hire window, retention, license) |
| Nature of action (NOA) code families | **Lifecycle trigger classification.** Accessions → joiner; position changes → mover; conversions → conversion; non-pay or non-duty status (leave, suspension) → *not* a leaver; return to duty → reinstate; separations → leaver |

Why this is the thesis rather than a detail: OPM standard data elements are **the same at every agency on the platform**. One crosswalk from those standards to Entra ID and AD can serve all of SSA's populations and is portable across agencies. A crosswalk from Oracle field names is one vendor's implementation. Personnel-action codes also settle the questions the corpus left open: what counts as a leaver, what counts as leave, and which event wins.

**Caveats.**
- I listed these elements and NOA families from general knowledge of OPM's Guide to Data Standards and the Guide to Processing Personnel Actions (GPPA). Check them against OPM's current publications before you cite them.
- How Oracle Fusion Cloud HCM exposes these elements (its federal personnel-action features) needs confirming for the Core HCM award.

## Suggested order of work

1. **Before Wednesday:** reframe the deck around the opportunity and the standard-attribute layer (C1, C3, C2, C4 and the table above). Present C5–C12 as the governance you would bring, not as built work.
2. **After:**
   - a bundle PR that reframes Ch 00/02 and adds a standard-attributes chapter;
   - a privacy and security appendix (fixes C2, C5 and the dangling Appendix B);
   - an operations appendix covering acceptance, cutover and old-connector decommissioning (C6, C7);
   - lifecycle rules for scope, leave, precedence and rescission (C8–C11).
