# Verification — Chapter 10, Operational Tempo: Ticket to Machine, Not Ticket to Human

Writer W5. Sources: `docs/executive-governance/ch07-operational-tempo/index.md` and `docs/whitepapers/ticket-to-machine-not-ticket-to-human.md`. `docs/whitepapers/ticket-to-machine-appendices.md` feeds Appendix B (W7); this chapter reads it for consistency and links Appendix B rather than carrying it. Kept consistent with Book 01 Ch11 (Analyze/Plan/Deliver, L0–L4, L3 default ceiling, permanent-L3 list), Book 01 Ch12 (rollback triggers), Book 00 Ch04 (principle 2 closure rule; principle 11 drift categories), Book 04 Ch06 (approvers don't execute; A0–A3 authority split), Book 12 Ch07 (platform-native actuation, unified record), Ch11 (response ladder) and Ch12 (metric rules), Book 10 Ch07 (front door), and this book's Ch06 (P1–P4 with immediate/1h/24h/72h, labeled as program defaults). All primary sources opened October 21, 2026; PDFs via curl with no identifying headers; SP 800-53 text and baselines from NIST's release 5.2.0 OSCAL catalog and profiles; web pages via WebFetch.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Severity → auto-remediate → SLA table (P1 halt/immediate; P2 1 h; P3 24 h; P4 72 h) | The program's tempo | restated-as-design | Source chapter table; matches Ch06 |
| 2 | P3/P4 "auto-remediate: yes" unconditionally | Same | corrected | Conflicts with Book 01 Ch11 L3 default ceiling; restated: machine executes, human approves each instance unless the class is enumerated at L4. Correction stated in the chapter |
| 3 | External clocks override program windows: BOD 26-04 issued June 10, 2026, revoked BOD 22-01 and 19-02, sets KEV timelines | Same | verified | CISA BOD 26-04 web page |
| 4 | CISA notification within one hour of identification by the top-level CSIRT | Same | verified | CISA Federal Incident Notification Guidelines |
| 5 | Escalation paths named "Canon Steward / Architecture Lead / CISO" | Same (commitment 3) | corrected | Internal role names translated to the workbook's roles: steward, responsible workstream lead, CISO (Book 00 Ch07 has no architecture-lead role) |
| 6 | "`fmp substrate walk` runs in CI" | Same (commitment 1) | restated-as-design | Internal command dropped; "the record's own checks run on every change" |
| 7 | Chronic backlog signals tempo out of step; missed P1 window is a rollback trigger to steward and sponsor | Same | verified (against workbook) | Book 01 Ch12 rollback triggers |
| 8 | Native tools detect drift and change state; dashboards show own-boundary posture | Native tools section | verified (against workbook) | Book 12 Ch07 actuation table and its footnotes |
| 9 | Native dashboard alone can't be the AO's evidence; "CM-6 not tool-attestable on any platform surveyed" | Same | restated-as-design | The whitepaper's finding is an internal survey; stated as "in the program's assessment" and the "any platform surveyed" claim dropped |
| 10 | CM-3 asks for approval with security/privacy impact consideration, documented decisions, retained records | Same | verified | SP 800-53r5 CM-3 a–e |
| 11 | SP 800-37 M-1: monitor for unauthorized changes and determine root cause | Same | verified | SP 800-37r2 Task M-1 discussion |
| 12 | Five-step coordination pattern; actuation stays native; coordination layer never writes | Same | restated-as-design | Whitepaper; aligns with Book 12 Ch07 and Book 00 principle 2 |
| 13 | Closure by clicking "complete" is prose, not evidence | Ticket to machine | verified (against workbook) | Book 00 Ch04 principle 2 |
| 14 | Machine execution yields traceable approval, version-controlled artifact, attributable log, re-testable result | Same | restated-as-design | Whitepaper |
| 15 | CM-3(1), CM-3(3), CM-6(1), SI-2(5) control statements | Same | verified | SP 800-53r5, OSCAL 5.2.0 |
| 16 | Moderate baseline includes CM-3(2) and SI-2(2) but not CM-3(1) or CM-6(1); High includes CM-3(1) and CM-6(1) | Same | verified | SP 800-53B Moderate and High profiles, OSCAL 5.2.0. Note for W7: the appendices source says CM-5(1) and CM-6(1) are Moderate-baseline mandates "checked against FedRAMP's profile"; NIST's Moderate baseline doesn't include them (FedRAMP's own baseline not checked here) |
| 17 | SP 800-137 encourages automation; many aspects not easily automated; not possible to fully automate; tools need human analysis | Same | verified | SP 800-137 §1, §2.1, §2.3 |
| 18 | Humans tune classifier, review escalations, decide exceptions; no ticket triage of routine drift | Same | restated-as-design | Source chapter |
| 19 | Six qualifying tests | Which classes qualify | restated-as-design | Synthesized from source ("deterministic fixes"), Book 01 Ch11 (scoped, rollback-paired, verify), whitepaper (machine-reachable) |
| 20 | Permanent-L3 list (tenant-wide roles, CA enforcement, bulk device state, network policy touching thousands of endpoints) | Same | verified (against workbook) | Book 01 Ch11 |
| 21 | Example class table and ceilings | Same | restated-as-design | Labeled illustrative; Format halt from Book 00 Ch04 |
| 22 | Leaver deprovisioning is rollback-never | Same | verified (against workbook) | Book 01 Ch11 failure modes |
| 23 | Certificates as volume-driven exception; protocol automation; exceptions still use the front door | Same | restated-as-design | Appendices source App. C; detail left to Appendix B and Book 07 |
| 24 | CA/B Forum SC-081v3 adopted April 2025; 398 → 47 days, March 2026–March 2029 | Same | verified | cabforum.org ballot page (passed 25 issuer yes, 4 consumer yes) |
| 25 | Original "30–90 day validity… thousands of events a week" | Same | removed | Not verifiable as a general fact; replaced with the CA/B Forum schedule |
| 26 | L3 approval per instance, L4 per class accepted by the AO, quarterly review | Approval gates | restated-as-design | Ch09 matrix; Book 12 Ch11 (AO accepts L4) |
| 27 | Separate governance and execution identities | Same | verified (against workbook) | Book 01 Ch11 Stage 3 |
| 28 | PIM: time-bound and approval-based activation, justification, notifications, access reviews, audit history; assignable to users, groups, service principals, managed identities | Same | verified | Microsoft Learn, PIM overview (updated 2026-04-24) |
| 29 | AC-5 separation of duties | Same | verified | SP 800-53r5 AC-5 |
| 30 | 2xx isn't closure; re-read required | Same | restated-as-design | Appendices source App. A; Book 01 Ch11 verify step |
| 31 | ZTMM is a general guide, not strict requirements | Same | verified (against workbook) | Book 01 Ch11 footnote c11-ztmm; not re-footnoted |
| 32 | Declared exception: time-boxed, proxied, recorded privileged session, approved first, recording as evidence | No machine | restated-as-design | Whitepaper |
| 33 | AU-14: record/view/hear/log session content; in consultation with legal counsel | Same | verified | SP 800-53r5 AU-14 |
| 34 | One front door; detection engines feed it | Service desk | restated-as-design | Whitepaper; appendices source App. D (SailPoint routes into ServiceNow) not carried as a vendor claim |
| 35 | Routing by authority A0–A3; help desk executes only approved assigned tickets; connector automation | Same | verified (against workbook) | Book 04 Ch06 |
| 36 | Help desk as high-value target; verification procedure is a CISO decision | Same | verified (against workbook) | Book 01 Ch09 (cites CISA AA23-320A) |
| 37 | Book 15 is Compliance Automation & Day-2 Operations, planned | Same | verified (against workbook) | Book 00 Ch02 book list |
| 38 | Operations view (queue, contracts, dashboard, channels) | Operations view | restated-as-design | Source chapter |
| 39 | Leadership measures: detection coverage, SLA adherence (renamed window adherence), escalation rate | Leadership | restated-as-design | Source chapter; adherence measured on closures plus overdue items, per Book 12 Ch12 |
| 40 | "Today: schema/provenance fully via CI; semantic/authz/identity via adapters with runtime conformance" | Leadership / honest limits | restated-as-design | Kept only as the honest limit that semantic, authorization and identity drift escalate more often; status claim about the program's own implementation dropped |
| 41 | Machine-closure share; declared-exception count | Leadership | restated-as-design | Added; follows from the whitepaper's argument |
| 42 | Doesn't require 24/7 staffing, eliminating drift, or a vendor SaaS | What it doesn't require | restated-as-design | Source chapter; "vendor SaaS" reworded to "a particular vendor" |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| `ch07-operational-tempo` — front matter (canon-source etc.) | — | Internal metadata |
| Same — In this chapter callout | Opening section and callout | Rewritten without "substrate" |
| Same — "The tempo declared in canon" (SLA table) | "The program's tempo" | Reframed as program design; P3/P4 auto-remediation corrected to the ladder |
| Same — "What the tempo requires of the program" (three commitments; quote on SLAs not honored) | "The program's tempo" (three commitments and backlog paragraph) | Internal command and role names translated |
| Same — "Auto-remediation versus escalation" (three reasons) | "Ticket to machine, not ticket to human" (what people do); "Approval gates…"; Ch09 (authority to change the record belongs to the rule-change review) | Merged |
| Same — "The operations team's view" | "The operations team's view" | Carried, with L3/L4 wording |
| Same — "The leadership view" | "What the tempo shows leadership" | Carried; two measures added; status claim dropped (claim 40) |
| Same — "What the tempo does not require" | "What the tempo doesn't require" | Carried |
| Same — "Honest limits" | "Honest limits" | Carried; "Canon Steward role" generalized to named roles and linked to Ch09 |
| Same — Key takeaways | Key takeaways | Rewritten |
| Same — Continue the series / Related documents | — | Replaced by book navigation; related documents are internal |
| `ticket-to-machine-not-ticket-to-human` — Problem, solution, ask | Opening; "Native tools…"; "When no machine…"; "How the service desk fits" | The "ask" (confirm, row by row, whether the coordination-layer contract entitles each integration; license or book an exception) is restated as the declared-exception path and the service-desk section; contract-specific wording dropped |
| Same — "The question, precisely" | "Native tools change state; they don't close findings" | Carried |
| Same — "One coordination pattern" | Same section | Carried, linked to Book 10 Ch07 and Book 00 principle 2 |
| Same — "Ticket-to-machine, not ticket-to-human" | "Ticket to machine, not ticket to human"; "When no machine can reach the surface" | Carried and expanded with controls |
| Same — "Leadership takeaway" | Key takeaways 2–3 | Carried |
| Same — closing note ("cleaned extraction") | — | Source housekeeping |
| `ticket-to-machine-appendices` — Appendices A–E | Appendix B (W7) | Linked, not carried; certificate exception summarized in "Which change classes qualify" |
