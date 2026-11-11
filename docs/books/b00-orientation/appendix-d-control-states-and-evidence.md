---
title: "Appendix D — Control States, Authority Labels and Evidence"
description: "The workbook's implementation guidance conventions, defined once: the five control states, the How-section template, sources and last-verified dates, terminology, authority labels, the evidence pattern, change safety and the Zero Trust assessment-mapping block, each with a copy-ready Markdown block for chapters and guides."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b00-orientation
book: B00
part: Appendix
series-order: 93
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix D — Control States, Authority Labels and Evidence

*Reading guidance doesn't put a control in place; configuring it doesn't prove it works; and only an assessor or authorizing official decides that a finding is resolved. These conventions keep the difference visible.*

## In this appendix

- Where the conventions apply, and how they relate to the claim-language rule
- The five control states, Designed, Configured, Enforced, Evidenced and Operated, and when a finding is ready for closure
- The How-section template, sources and last-verified dates, and terminology
- Authority labels, the evidence pattern and change safety
- The Zero Trust assessment-mapping block
- A copy-ready Markdown block for each, for chapters and guides to use

The conventions are the workbook's own editorial design, not federal policy. They turn one lesson from Zero Trust assessments into a writing rule: a finding stays open when guidance describes a control but nobody can show that it was built, enforced, proved and kept running. Where this appendix says a source *requires* something, the note gives the passage.

## Where the conventions apply {#where-the-conventions-apply}

They apply to every chapter or guide section that gives an implementation procedure: a book's How chapters, an implementation guide's gates, a developer workbook's labs where they change a tenant, and a training module that teaches a procedure. A Why or What chapter that argues or explains doesn't need the How-section template, though its recommendations still carry authority labels where they say what an agency should do. New and changed How sections follow these conventions from November 11, 2026; existing pages are brought in line as they are next revised ([CONTRIBUTING](https://github.com/WhalerMike/modernization-workbook/blob/main/CONTRIBUTING.md#implementation-guidance-conventions)).

They sit beside the house rule on claim language: guidance, a kit or a configuration *supports* or *addresses* a control and *provides evidence for* it; it never by itself satisfies one ([Sources and verification](../../about/sources-and-verification.md#claim-language)). The control states below are how a page says how far it takes a control, without claiming to settle it.

## The five control states {#control-states}

A control moves through five states. Each state has its own evidence, and a later state doesn't imply that an earlier one was done well: a policy can be enforced exactly as designed and the design can still be wrong.

| State | What it means | What shows it |
|---|---|---|
| **Designed** | The decision is made and written down: scope, target population, exclusions, owner, and the requirement or risk it addresses | A decision record or design note, approved by the owner the book's Who chapter names |
| **Configured** | The setting, policy or code exists in the tenant or platform as designed, but may not yet act on everyone it is meant to (report-only, audit, pilot scope) | A configuration export or policy-as-code file, matched to the design |
| **Enforced** | The control acts on its full intended scope, with only approved exclusions | The enforcing state in the export (for example a Conditional Access policy **On**, not **Report-only**), the assignment scope, and the exclusion register |
| **Evidenced** | A test shows the control works, and the result is kept where an assessor can inspect it | A test record (expected and observed outcome, date, tester) and the log or event the test produced |
| **Operated** | The control has a named owner, a cadence of review, monitoring that would show it drifting or failing, and a support path | The owner and cadence in the run book, alert or drift-rule definitions, and the last review record |

A finding from an assessment tool is ready for closure only when every applicable state has evidence. Closing it is the call of the authorizing official, or of the assessor for an assessment finding, not the page's and not the tool's. A state can be **not applicable** with a reason (a detective control has nothing to enforce; a one-time decision record isn't operated), but it is never skipped silently. NIST's assessment procedures make the same split between doing and judging: each determination an assessor makes produces a finding of satisfied or other than satisfied, from evidence the assessor examines, obtains in interviews or produces by testing.[^aD-53a-findings] <!-- claims-ok: what an assessor determines, not a claim -->

[Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#the-closure-chain) carries the states into the register a program keeps for each finding.

### Copy-ready block: control states {#block-control-states}

```markdown
**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | <section that records the decision> | <decision record> |
| Configured | <section or step> | <export or policy-as-code file> |
| Enforced | <section or step, or "not applicable: reason"> | <enforcing state and exclusion register> |
| Evidenced | <the Validate step> | <test record and the event it produced> |
| Operated | <day-two section> | <owner, cadence, alert or drift rule> |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.
```

## The How-section template {#how-section-template}

Every implementation procedure has the subsections below, in this order, or says "not applicable" with a one-line reason. The order is the safe order: nothing is enforced before it has been piloted and before the way back is written.

| Subsection | What it says |
|---|---|
| **Prerequisites** | Licenses, roles, platform versions, government-cloud availability ([Sources and last-verified dates](#source-policy)), and what must already be in place, with links |
| **Pilot** | The pilot population or scope, how it is chosen, and what success looks like before going wider |
| **Report-only or audit phase** | How the control is observed without blocking (Conditional Access report-only, audit mode, simulation mode, `-WhatIf`), for how long, and what is read from it |
| **Enforcement** | The rings the control moves through ([Change safety](#change-safety)) and the exact step that turns it on |
| **Rollback** | The step that turns it off or restores the prior state, who can run it, and how long it takes |
| **Exclusions** | Who and what is excluded, why, who approved it, and when it is reviewed; emergency access accounts first |
| **Telemetry** | The logs, events and signals that show the control acting or failing, and where they go |
| **Evidence** | The evidence checklist ([Evidence pattern](#evidence-pattern)) |
| **Day-two ownership** | The owner, the review cadence, the support path and what drift looks like, linking [Book 15](../b15-day2-operations/index.md) for help-desk and operating cadence |

Microsoft documents the report-only step for Conditional Access: a report-only policy is evaluated at sign-in but not enforced, and its result is written to the sign-in log, so its effect can be checked before the policy is turned on.[^aD-ca-report-only] Other products have their own audit or simulation modes, and the subsection names the one the product has.

### Copy-ready block: How-section skeleton {#block-how-section}

```markdown
### Prerequisites
<licenses, roles, versions; government-cloud availability with the Learn page and the date read, or "not yet specified" where Learn is silent>

### Pilot
<pilot scope, how chosen, success criteria>

### Report-only or audit phase
<mode, duration, what to read from it>

### Enforcement
<rings and the step that enforces; see Change safety>

### Rollback
<the step back, who runs it, how long it takes>

### Exclusions
<who and why, approver, review date; emergency access accounts>

### Telemetry
<logs and signals, and where they go>

### Evidence
<the evidence checklist>

### Day-two ownership
<owner, cadence, support path, drift signal>
```

## Sources and last-verified dates {#source-policy}

The workbook's verification method already requires a primary source for every external claim, with the date it was read ([Chapter 02](02-how-to-use-this-workbook.md#how-claims-are-verified)). For implementation guidance it adds three things.

- **Primary sources by kind.** Microsoft Learn for how a Microsoft product behaves and is licensed; NIST, CISA, OMB and FedRAMP for what a federal agency is required to do and prove; the IETF for protocol behavior; a tool's own repository and release for a tool's behavior. Secondary reporting is used to find a source, never cited for the claim.
- **A last-verified date on product behavior and licensing.** Product behavior, licensing and government-cloud availability change without notice, so each such claim carries the date it was checked in its note ("accessed Nov 11, 2026"), and the page's verification file records it.
- **Government-cloud availability.** For each feature a procedure relies on, the prerequisites say whether it is available in GCC, GCC High and DoD, from the Learn page that says so and the date it was read. Where Learn doesn't say, the page says "not yet specified", not "available".

The verification file beside each chapter (`_verification/<page>.md`) records, for each claim, the source URL, the date checked, the claim and its disposition (verified, corrected, removed, restated as design, or unverifiable).

### Copy-ready block: verification-log row {#block-verification-row}

```markdown
| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| <n> | <the claim> | <section> | verified / corrected / removed / restated-as-design / unverifiable | <title and URL> | <Mon D, YYYY> |
```

## Terminology {#terminology}

Pages say "organization", "agency" or "tenant". They never embed a customer or agency name, a tenant domain, a person, an application name, a count from a private assessment, or a private object identifier. Examples use the documented example names and placeholders:

| Kind | Use | Not |
|---|---|---|
| Organization | Contoso, Fabrikam, "the agency" | A real agency, bureau or component |
| Tenant | `contoso.onmicrosoft.com`, `<tenant>.onmicrosoft.com` | A real tenant name |
| Domain | `contoso.example`, `<domain>` | A real domain |
| Object ID | `<object-id>`, or Learn's example format `00001111-aaaa-2222-bbbb-3333cccc4444` | A GUID copied from a tenant |
| People and applications | A role ("the identity engineer"), `<app-name>` | A person's name, a real application's name |
| Counts | "most", "a few", or an illustrative figure labeled as illustrative | A count from a real assessment |

Two checks enforce this on every pull request. `scripts/check_neutrality.py` matches agency names from a salted-hash list, so the list itself names nothing. `scripts/check_identifiers.py` flags a `.onmicrosoft.com` tenant name that isn't a documented example tenant, and a real-looking GUID in prose outside code; it reports the file and line, never the value.

## Authority labels {#authority-labels}

A recommendation states its authority and where it applies. "Must" is kept for what a source actually requires; where a page says "must" and means a recommendation, it says which kind. Each recommendation carries one authority label and, where they apply, one or both applicability labels.

| Label | Kind | Use it when | The page names |
|---|---|---|---|
| **Mandated** | Authority | A law, OMB memorandum, CISA directive, NIST standard adopted by policy, or FedRAMP requirement requires it of the agency | The source and the passage, in a note |
| **Microsoft-recommended** | Authority | Microsoft's documentation recommends it | The Learn page and the date read |
| **Risk-based recommended** | Authority | The workbook recommends it as the program's position, for a stated risk | The risk, and that it is the program's position |
| **Optional** | Authority | It adds value but nothing depends on it | What it adds |
| **License-dependent** | Applicability | It needs a license or add-on the agency may not hold | The license, from Learn |
| **Environment-dependent** | Applicability | It depends on the cloud (commercial, GCC, GCC High, DoD), the platform or the estate | Where it applies, and what to do where it doesn't |

A Microsoft recommendation is never presented as a federal mandate, and a mandated baseline is never softened to a recommendation. A license-dependent control that a tenant isn't licensed for is a licensing decision, not a failed control; an assessment tool that skips it hasn't found a gap ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#a-normalized-result-taxonomy)).

### Copy-ready block: authority label {#block-authority-label}

```markdown
**Authority:** <Mandated | Microsoft-recommended | Risk-based recommended | Optional> (<source and passage, Learn page, or the program's stated risk>).
**Applies:** <all tenants | License-dependent: <license> | Environment-dependent: <cloud, platform or estate; GCC, GCC High, DoD availability or "not yet specified">>.
```

## The evidence pattern {#evidence-pattern}

Every How section ends with an evidence checklist of five kinds. Together they answer what an assessor can inspect and what operations must keep.

| Kind | What it is | Example |
|---|---|---|
| **Configuration evidence** | The setting as it stands, exported or held as code | A policy export, an Intune profile, a policy-as-code file and its commit |
| **Operational evidence** | The control acting over time | Sign-in or audit log entries, alert history, drift-run results |
| **Test evidence** | A deliberate test with an expected and an observed outcome | A test sign-in blocked as designed, a synthetic event that raised its alert |
| **Exception evidence** | Every exclusion and accepted deviation, with its approver and expiry | The exclusion register, a risk acceptance, a ScubaGear omission with its rationale |
| **Assessor-ready artifact** | The package an assessor reads, traceable to the four above | An OSCAL assessment-results observation, a sealed evidence bundle, a plan of action and milestones entry |

The kinds follow the way assessors work. NIST's assessment procedures name three methods, examine, interview and test, applied to specifications, mechanisms, activities and individuals;[^aD-53a-methods] configuration and exception evidence are what an assessor examines, test evidence is what a test produces, and operational evidence shows the activities over time. [Book 11, Chapter 09](../b11-zero-trust/09-running-the-assessment.md) shows how tool output becomes an assessor-ready artifact, and [Book 13](../b13-governance/index.md) how evidence is kept current.

### Copy-ready block: evidence checklist {#block-evidence-checklist}

```markdown
**Evidence checklist**

- [ ] **Configuration:** <export or policy-as-code file, and where it is kept>
- [ ] **Operational:** <logs, alerts or drift results, and their retention>
- [ ] **Test:** <the test, expected and observed outcome, date, tester>
- [ ] **Exception:** <exclusion register or risk acceptance, approver, expiry>
- [ ] **Assessor-ready artifact:** <the package entry, traceable to the four above>
```

## Change safety {#change-safety}

No enforcement step is given without a safe way to deploy it. Each one says:

- **Rings.** The staged scopes it moves through, for example the implementing team, a pilot group, a wider early-adopter ring, then everyone in scope, with the exit criteria for each.
- **Emergency-access exclusions.** Emergency access accounts are excluded from policies that block or restrict sign-in, and their exclusion is tested. Microsoft recommends excluding them from Conditional Access policies that block or restrict sign-in (report-only policies don't block and needn't exclude them) and testing them regularly, for example every quarter.[^aD-emergency] [Book 04](../b04-access/index.md) carries the emergency access design.
- **Change windows.** When the change is made, who approves it, and who is on hand. SP 800-53's configuration change control asks organizations to review, approve and document changes, and its impact analysis control asks them to analyze a change's security and privacy impact before it is made.[^aD-53-cm]
- **Backout triggers.** The observed conditions that send the change back (a sign-in failure rate, a help-desk call volume, a blocked critical application), set before the change, not during it.
- **Post-change validation.** The test that shows the change did what it should and nothing it shouldn't, run after each ring.

### Copy-ready block: change safety {#block-change-safety}

```markdown
**Change safety**

| Ring | Scope | Exit criteria |
|---|---|---|
| 0 | <implementing team> | <criteria> |
| 1 | <pilot group> | <criteria> |
| 2 | <early adopters> | <criteria> |
| 3 | <everyone in scope> | <criteria> |

- **Emergency access:** <excluded group; exclusion tested on <date>>
- **Change window:** <when, approver, who is on hand>
- **Backout triggers:** <conditions set before the change>
- **Post-change validation:** <test run after each ring>
```

## The assessment-mapping block {#assessment-mapping}

Each chapter or guide section that addresses a finding a Zero Trust assessment can raise carries a small mapping block, so the reader can see where it sits and what it protects against.

- **Pillar.** Microsoft's Zero Trust technology pillars are Identity, Devices, Data, Apps, Infrastructure, Networks and SecOps.[^aD-ms-pillars] The Zero Trust Assessment groups its tests by its own pillars (Identity, Devices, Network, Data, Infrastructure, Security Operations and AI in release 3.1.0),[^aD-zta] and CISA's Zero Trust Maturity Model has five pillars, Identity, Devices, Networks, Applications and Workloads, and Data, with three cross-cutting capabilities.[^aD-ztmm] The block names the Microsoft pillar and the CISA pillar; [Book 11, Appendix A](../b11-zero-trust/appendix-a-requirements-mapping.md) maps the CISA pillars to controls and books.
- **Cross-pillar dependencies.** What the control needs from another pillar to work. Device-based Conditional Access needs device identity and compliance; a network control that reads identity needs the identity plane. NIST's Zero Trust architecture makes the dependency explicit: no asset is inherently trusted, and the enterprise evaluates an asset's security posture when it evaluates a request.[^aD-207]
- **Attack chain interrupted.** The stage of an attack the control stops or exposes, in plain words, with the MITRE ATT&CK tactic name where the team uses it (for example Initial Access, Credential Access, Privilege Escalation, Persistence, Lateral Movement, Exfiltration).[^aD-attack]

### Copy-ready block: assessment mapping {#block-assessment-mapping}

```markdown
::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** <Identity | Devices | Data | Apps | Infrastructure | Networks | SecOps>
- **CISA ZTMM pillar:** <Identity | Devices | Networks | Applications and Workloads | Data>
- **Depends on:** <the other pillars' controls this one needs, with links>
- **Attack chain interrupted:** <the stage in plain words; ATT&CK tactic, if used>
:::
```

## Key takeaways

- A control has five states, and a finding is ready for closure only when every applicable state has evidence; the authorizing official or assessor decides.
- Every implementation procedure runs prerequisites, pilot, report-only, enforcement, rollback, exclusions, telemetry, evidence and day-two ownership, or says why a step doesn't apply.
- Every recommendation says whose it is and where it applies, and every How section ends with five kinds of evidence.
- Pages name no real organization, tenant, person, application, private count or object ID, and two checks enforce it.

## Continue the book

::: {.callout-note appearance="minimal"}
[← Previous: Appendix C — Funding and Acquiring the Program](appendix-c-funding-and-acquisition.md) · [Book index](index.md)
:::

[^aD-53a-findings]: NIST SP 800-53A Rev. 5, *Assessing Security and Privacy Controls in Information Systems and Organizations*, January 2022, §3.3 (each determination statement "produces one of the following findings: satisfied (S); or other than satisfied (O)"), <https://doi.org/10.6028/NIST.SP.800-53Ar5> (accessed Nov 11, 2026).
[^aD-53a-methods]: NIST SP 800-53A Rev. 5, January 2022, §2.4.1 (assessment objects: specifications, mechanisms, activities and individuals) and §2.4.2 (assessment methods: examine, interview and test), <https://doi.org/10.6028/NIST.SP.800-53Ar5> (accessed Nov 11, 2026).
[^aD-ca-report-only]: Microsoft Learn, "Analyze Conditional Access policy impact" (report-only policies are evaluated during sign-in but not enforced; results are logged in the sign-in log's Conditional Access and Report-only tabs), <https://learn.microsoft.com/entra/identity/conditional-access/concept-conditional-access-report-only> (accessed Nov 11, 2026).
[^aD-emergency]: Microsoft Learn, "Manage emergency access accounts in Microsoft Entra ID," section "Conditional Access considerations," <https://learn.microsoft.com/entra/identity/role-based-access-control/security-emergency-access> (accessed Nov 11, 2026).
[^aD-53-cm]: NIST SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, controls CM-3 (Configuration Change Control) and CM-4 (Impact Analyses), checked against the release 5.2.0 OSCAL catalog, <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (accessed Nov 11, 2026).
[^aD-ms-pillars]: Microsoft Learn, "Overview — Implement Zero Trust solutions," section "Choose your starting point" (technology pillars Identity, Devices, Data, Apps, Infrastructure, Networks and SecOps), <https://learn.microsoft.com/security/zero-trust/implement-overview> (accessed Nov 11, 2026).
[^aD-zta]: Microsoft Learn, "What is the Zero Trust Assessment?," <https://learn.microsoft.com/security/zero-trust/assessment/overview>; Microsoft, Zero Trust Assessment release 3.1.0, October 20, 2026, still the latest release on Nov 11, 2026, test definitions in `src/powershell/tests/` (`Pillar` attribute), <https://github.com/microsoft/zerotrustassessment/tree/3.1.0/src/powershell> (both accessed Nov 11, 2026).
[^aD-ztmm]: Cybersecurity and Infrastructure Security Agency, *Zero Trust Maturity Model*, Version 2.0, April 2023, §5 (pillars) and §5.6 (Cross-Cutting Capabilities), <https://www.cisa.gov/sites/default/files/2023-04/zero_trust_maturity_model_v2_508.pdf> (accessed Nov 11, 2026).
[^aD-207]: NIST SP 800-207, *Zero Trust Architecture*, August 2020, §2.1, tenet 5 ("No asset is inherently trusted. The enterprise evaluates the security posture of the asset when evaluating a resource request"), <https://doi.org/10.6028/NIST.SP.800-207> (accessed Nov 11, 2026).
[^aD-attack]: The MITRE Corporation, ATT&CK, "Enterprise tactics," ATT&CK content v20.1, <https://attack.mitre.org/tactics/enterprise/> (accessed Nov 11, 2026).
