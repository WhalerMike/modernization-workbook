---
title: "Keeping Identity Correct After HR Becomes the Source"
subtitle: "A rough draft: what maintaining identity looks like once ICAM is HR-driven: which fixes still happen, who makes each one, where, and how fast"
description: "Research draft: the day-two operating model for HR-driven identity. A catalog of the fixes that still happen after HR becomes the source of authority, the owner and lane for each, the roles and measures that keep it running, and the open questions."
research-status: draft
research-type: explainer
research-book: "Books 03, 13, 15"
date-modified: 2026-10-24
---

# Keeping Identity Correct After HR Becomes the Source {.unnumbered}

::: {.callout-warning}
## Draft
This is a rough draft, written to think the problem through. It pulls together what Books 03, 13 and 15 already say, and lists what they don't say yet. The service windows and some of the routing are **proposals** (program design guidance), not settled positions. Expect it to change.
:::

HR-driven identity doesn't end identity maintenance. It moves it. In a ticket-driven estate, whoever can change the directory ends up owning the data, so fixes happen at the console. Once HR is the source of authority, the same fixes still come up: a wrong department, a late separation, a duplicate person, a contractor nobody owns. But they have to be made somewhere else, by someone else, and carried back by the pipeline. [Book 03, Chapter 11](../books/b03-hr-identity/11-drift-metrics-and-evidence.md) puts the rule in five words: **fix the record or the rule, never the copy.**

This draft asks what that means day to day. What still breaks, who fixes each kind of break, where the fix is made, how fast, and what happens when the source can't move fast enough.

## The maintenance loop

![The maintenance loop: detect the difference, classify the fix, route it to the owner of the fact, correct the record or the rule at the source, let the pipeline carry it back, then re-read and record. When the source can't move fast enough, a declared, time-boxed exception bridges the gap and is removed when the source catches up.](../images/diagrams/b03-hr-identity/svg/maintenance-loop.svg){fig-alt="Diagram. Six steps: 1 detect, find the difference through drift comparison, quarantine, a help desk call or the audit log; 2 classify what kind of fix, whether fact, rule, pipeline, match, credential or exception; 3 route to the owner of the fact, such as HR, the contractor source, the data architect, security or the PKI office; 4 fix at the source, correcting the record or the rule and never the copy in the directory; 5 carry back, the pipeline re-applies it through provisioning and workflows rather than a console edit; 6 prove, re-read and record, so the difference is gone and the evidence stays. A dashed red path from routing goes to a declared, time-boxed exception, approved by the owner with an expiry and removed when the source catches up, which also ends at prove."}

Every fix follows the same six steps. It's [Book 13's coordination loop](../books/b13-governance/appendix-b-ticket-to-machine-reference.md#the-coordination-loop) applied to identity, with one difference that matters: the step that changes things is usually a person correcting a record in the HR system or the contractor source, not a machine changing the directory. The machine's job is to notice the difference, carry the corrected value back, and prove the result.

## The fixes that still happen

These are the kinds of break the books already name, grouped by what has to change. The lanes are [Book 13's five lanes](../books/b13-governance/appendix-b-ticket-to-machine-reference.md#change-classes-and-their-lanes): machine (autonomous or gated), human decision, protocol-enforced, and declared exception. The severities are Book 03's defaults; the windows follow Book 13's tempo and are proposals for identity.

| Kind of fix | Example | How it's found | Fixed by, and where | Lane | Severity, window (proposed) |
|---|---|---|---|---|---|
| **A wrong fact in HR** | Wrong department, duty station or supervisor | Attribute drift: field-by-field comparison with the HR record (B03 Ch 11); a user or manager reports it | HR, as a correction in the HR system; the pipeline carries it back (B03 Ch 07) | Human decision (HR), then machine | Medium; HR's correction window (open question 1) |
| **A late or retroactive personnel action** | A separation entered days after the person left | Stale access: terminated in HR, still enabled (B03 Ch 11) | Security owns the leaver path end to end; HR enters the action (B03 Ch 07, 09) | Emergency termination: act first, record after (B03 Ch 08) | High; immediate |
| **An urgent leaver HR hasn't entered yet** | A termination for cause, effective now | A manager or security calls it in | The on-demand termination workflow runs the *same* sequence as the scheduled leaver (B03 Ch 08); HR enters the action after | Emergency change: act, then record (B13 App B) | High; immediate, then reconcile |
| **A record the pipeline couldn't apply** | A record fails validation; an action fails permanently | The quarantine (B03 App A) | A person decides and records the decision; the entry is re-injected through the normal path, never applied by hand (B03 App A) | Human decision, then machine | By failure class; separation-related first (B03 App A) |
| **A write outside the pipeline** | Someone edits an HR-mastered attribute in the directory | Unauthorized write in the audit log (B03 Ch 11) | The pipeline restores the HR value; the writer's access is reviewed | Provenance drift: halt and alert if the claim is in use, else a human decision (B13 App B) | High |
| **An account that matches nobody** | An enabled account with no worker record | Orphan account (B03 Ch 11); Account Discovery for applications | The owner of the account decides: tie it to a person, or disable it | Identity drift: human decision, then gated (B13 App B) | High |
| **A person with no account** | A new hire whose account wasn't created | Missing identity (B03 Ch 11) | Usually a scoping rule or a quarantined record: fix the rule or the record | Human decision, then machine | High before the start date |
| **The same person twice, or a broken link** | A rehire, a contractor converting to employee, a duplicate | Match failures; duplicate person keys | The enterprise person key decides; conversion is an attribute change on the same person, not a leaver and a joiner (B03 Ch 04, Ch 08, App A) | Human decision (data architect, governance body) | Medium |
| **A manager link that points nowhere** | A supervisor separates; reports point at them | Manager-link finding (B03 App A) | HR reassigns the reports; IT doesn't write the new supervisor (B03 App A) | Human decision (HR) | Medium |
| **A fact HR doesn't own** | A contractor's end date, sponsor or suitability | The contractor register or sponsor check | The contractor source of authority, one authority per fact (B03 Ch 06) | Human decision by that source | High at contract end |
| **A rule that derives the wrong access** | A dynamic group rule picks up the wrong people | Access review; a user reports missing or extra access | A reviewed change to the rule, shadowed before it acts (B03 Ch 10, Ch 12 Phase 6) | Change to the authoritative record: human decision (B13 App B) | Medium |
| **A reorganization** | Organization codes change for thousands of people | Planned; announced by HR | HR changes the codes; rules and dynamic groups re-evaluate; the bulk change is dry-run first | High blast radius: gated, with a dry run and rollback (B13 App B) | Planned, not reactive |
| **A credential that outlives the person** | A PIV binding or device certificate for someone who left | Credential drift: card system and Intune reports joined on the person (B03 Ch 11) | The credentialing office revokes; the leaver sequence reconciles to the end (B03 Ch 09) | Human decision, then gated | High |
| **Residual access after a move** | Old access from an access package or direct assignment survives a mover event | The mover review the attribute-change workflow starts (B03 Ch 08) | The entitlement owner decides | Human decision, then gated removal (B13 App B) | Medium |
| **Access needed before HR catches up** | A new assignment starts Monday; HR's correction lands Wednesday | A request in the catalog | **Proposal:** a time-boxed access package with a named approver and an expiry, removed when the HR value arrives | Declared exception | Expires automatically |
| **Privacy and records holds** | A legal hold on a separated person's records; a protected name change | Privacy office or counsel | Deletion only under the disposition rule and holds (B03 Ch 08); the privacy basis and minimization rules govern what the feed carries (B03 App B) | Human decision (privacy, records) | As the hold requires |

: The fixes that still happen in HR-driven identity, and where each is made (draft) {.striped .hover}

Two patterns stand out. Most fixes are **human decisions at the source** followed by **machine work in the directory**, the reverse of the ticket-driven estate. And every fix has to reach the pipeline. A correction made only in the directory is, by Book 03's definition, drift.

## Who does the work

The books name most of these roles already. What they don't yet describe is identity maintenance as one service.

| Role | Day-two job | Where the books say so |
|---|---|---|
| HR operations | Data quality at the source: corrections, retroactive actions, supervisor reassignment, reorganizations | B03 Ch 07 (HR owns personnel data and its quality) |
| Contractor source (COR, sponsor, register) | End dates, sponsors and suitability for people HR doesn't cover | B03 Ch 06, Ch 07 |
| Identity operations (proposal: an **identity data steward** function) | Triage drift findings and the quarantine; route each to its owner; chase it to closure; run the reconciliation | B03 App A (quarantine contract); B13 App B (escalation roles must exist) |
| Help desk | Route data errors to the owner; never edit HR-mastered attributes; recover access, not facts | B03 Ch 07; B15 Ch 03, Ch 04 |
| Security | Owns the leaver path end to end, including emergency terminations | B03 Ch 07, Ch 09 |
| Credentialing office | Card issuance, reissue, revocation and the binding | B03 Ch 09 |
| Data architect and governance body | The person key, the schema, the rules, and any change to which source is authoritative | B03 Ch 07; B13 App B |
| Entitlement owners | Decide residual and idle access | B03 Ch 08, Ch 10 |
| Privacy office | The privacy basis, minimization, holds | B03 Ch 07, App B |

The weakest point in that table is the third row. A tempo, Book 13 says, needs the escalation roles to exist, and "a program without a steward has to designate one; the tooling can't create authority." For identity, that means a named function that owns the quarantine and the drift queue. It doesn't fix the data; it makes sure the person who owns each fact fixes it.

## The help desk's new script

Most day-two fixes start as a call. In a ticket-driven estate the help desk edits the department and closes the ticket. In HR-driven identity, that edit is drift and the next sync overwrites it, or doesn't. Book 15 already routes requests by the authority the task needs, and Book 03 Chapter 07 gives the help desk no role that can write user properties. The draft adds one catalog item to the script:

- **"My information is wrong"** opens a case with the owner of the fact: HR for employees, the contractor source for contractors. It is not a directory change. The caller is told when the correction is expected, and the case closes when the pipeline has carried it back and the drift finding clears.
- **"I need access before the correction lands"** goes to the time-boxed access package in the table above, with an approver and an expiry.

## Measuring it

Book 03 Chapter 11's six lifecycle measures already cover the outcomes: separation-to-block, separation-to-revocation, transfer-to-review, joiner readiness, correlation coverage and derivation purity. Book 13's tempo measures cover the process. Applied to identity, the useful ones are:

- **Window adherence:** what share of identity findings close inside their window.
- **Escalation rate:** what share of findings need a person.
- **Source correction time:** how long HR and the contractor source take to correct a fact once it's routed. This one is new. It's the measure that decides whether the time-boxed exception stays rare.
- **Declared-exception count:** how many temporary access packages are open because the source hasn't caught up.

## Open questions

1. **How fast can HR correct a fact?** Correction speed decides everything downstream. Book 03 Chapter 07 has each owner accept a quality expectation per attribute; the draft proposes adding a correction window per attribute to the authority map. What the Core HCM platform supports for corrections and retroactive actions needs research.
2. **Who staffs the identity data steward function?** And is it in HR, in identity operations, or shared?
3. **The contractor source** is still an open decision (B03 Ch 06): Core HCM contingent workers, the PIV sponsorship system, or a separate register. Every contractor fix depends on it.
4. **Legal names, preferred names and protected identities.** How a name change flows, and which name each system shows, isn't covered yet.
5. **Reorganizations at scale.** A dry run is required, but the books don't yet give a reorg runbook (announce, stage codes, shadow the rules, cut over, review residual access).
6. **After AD, who writes the PIV binding?** The design guidance is the card system's issuance event through Microsoft Graph; it's untested ([Certificates, Tokens and Keys Across the Hybrid Estate](hybrid-credentials.md); issue [#130](https://github.com/WhalerMike/modernization-workbook/issues/130)).
7. **Where should this live?** Possibly a new Book 03 chapter ("Operating HR-driven identity") or a Book 15 chapter on identity operations, with the fix catalog as an appendix.

## Status

**Draft.** Built from Books 03, 13 and 15 on October 24, 2026; no new external sources yet. Each row in the fix catalog cites the chapter it comes from; the windows, the steward function, the help desk catalog items, the time-boxed access package and the source-correction measure are proposals. Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

A vendor-named companion works this catalog through ServiceNow and SailPoint: [Ticket-to-Machine on ServiceNow and SailPoint: An Example](ttm-servicenow-sailpoint.md).

Related: [Book 03 — HR-Driven Identity](../books/b03-hr-identity/index.md), [Book 13, Appendix B — Ticket-to-Machine Reference](../books/b13-governance/appendix-b-ticket-to-machine-reference.md), [Book 15 — Compliance Automation & Day-2 Operations](../books/b15-day2-operations/index.md), and the [Start Here](../start-here.md) series.
