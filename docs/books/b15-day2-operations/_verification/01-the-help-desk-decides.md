# Verification — Chapter 01, Modernization Succeeds or Fails at the Help Desk

Writer W1. Sources: `docs/operational-guides/helpdesk-entra-operations/index.md` (all sections) and `docs/compliance/Vol_IX_Book_00_Day2_Operations_Overview.md` (all sections; the discipline and necessity sections are shared with Ch02). Primary sources opened October 21, 2026: Microsoft Learn pages "Microsoft Entra built-in roles," "Privileged roles and permissions in Microsoft Entra ID," "Manage user authentication methods for Microsoft Entra multifactor authentication," "Configure Temporary Access Pass," "How it works: Microsoft Entra self-service password reset," "How does self-service password reset writeback work," "What is Microsoft Entra Privileged Identity Management?," "Require phishing-resistant multifactor authentication for administrators"; CISA AA23-320A; OMB M-22-09 PDF (text extracted and read); NIST SP 800-63B-4 HTML (pages.nist.gov, §4.2 read) and its CSRC publication record; SP 800-53 release 5.2.0 OSCAL catalog and moderate profile (statements and baseline membership extracted locally); ServiceNow "Microsoft Entra ID Spoke release notes."

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Day-two operations (onboard, reset, group, license, subscription, app registration, phone number) are the highest-volume changes and touch controlled surfaces | Day two is most of the work | restated-as-design | Vol IX Book 00 "What This Volume Addresses" |
| 2 | Ungoverned day-two requests are the largest continuous source of control erosion | Day two is most of the work | restated-as-design | Vol IX Book 00 necessity box |
| 3 | Helpdesk Administrator is a privileged role; can change passwords and invalidate refresh tokens; "changing the password of a user may mean the ability to assume that user's identity and permissions"; examples list | The help desk holds the keys | verified | MS Learn built-in roles |
| 4 | Authentication Administrator can set/reset any auth method for non-admins and some roles and require re-registration | The help desk holds the keys | verified | MS Learn built-in roles |
| 5 | Neither Helpdesk Admin nor Auth Admin can reset Global Admin or role-assignable-group members; only PAA and GA | The help desk holds the keys | verified | MS Learn "Who can reset passwords" table |
| 6 | Require re-register MFA deletes phone numbers, Authenticator apps and software OATH tokens, deactivates hardware OATH; user sets up new method at next sign-in | The help desk holds the keys | verified | MS Learn howto-mfa-userdevicesettings |
| 7 | "Whoever signs in next ... controls the account" (account-takeover primitive) | The help desk holds the keys | restated-as-design (inference from #6, from the runbook's warning) | Runbook Task 2 framing |
| 8 | CISA AA23-320A (Nov 16, 2023; rev. July 29, 2025): calls to help desks to reset passwords / transfer MFA tokens; probing reset steps; defenses are phishing-resistant MFA and training; no help-desk procedure | Attackers know | verified | CISA AA23-320A |
| 9 | Book 01 Ch09: help-desk roles scoped narrowly, verification procedure a CISO decision, ticket volume and registration rates go/no-go | Attackers know | verified (settled fact, read in Book 01 Ch09) | Book 01 Ch09 |
| 10 | M-22-09: phishing-resistant MFA required for staff, contractors, partners; recovery "a potential bypass ... significant threat vector"; "high-friction methods ... in-person verification, live video interaction" | Federal guidance | verified | M-22-09 PDF |
| 11 | SP 800-63-4 published July 2025; 800-63B-4 §4.2 four recovery classes; application-specific method (CSP agent) on documented risk analysis; repeated proofing "consistent with the level of initial identity proofing"; confirm consistency with account; notification SHALL | Federal guidance | verified | pages.nist.gov 800-63B-4; CSRC record (final 07/31/25) |
| 12 | IA-5 (verify identity at distribution; procedures for lost/compromised), IA-5(1) (immediate new password upon recovery), IA-12 (proofing to assurance level) in moderate baseline | Federal guidance | verified | SP 800-53 5.2.0 OSCAL |
| 13 | SSPR writes password changes back through Entra Connect or cloud sync; optional unlock without reset | Task table | verified | MS Learn concept-sspr-howitworks |
| 14 | Writeback works for PHS, PTA and federated synced users; enforces on-prem policy | Task table | verified | MS Learn concept-sspr-writeback |
| 15 | TAP: time-limited, single or multi-use; "makes recovery easier when a user loses or forgets a strong authentication method"; Auth Admin for members, PAA for admins | Task table | verified | MS Learn TAP |
| 16 | AC-2 (approvals, alignment with termination/transfer), AC-2(3), AC-7, PS-4, PS-5 statements; moderate baseline | Task table | verified | SP 800-53 5.2.0 OSCAL |
| 17 | Task table "what safe looks like" column | Task table | restated-as-design | Runbook; admin responsibilities guide framing |
| 18 | Three-platform throughline: governance approves, ITSM routes, Entra executes; help desk residual only | Three questions | restated-as-design | index.md throughline |
| 19 | Source names the IGA platform as "SAM (SailPoint IGA)" | Three questions | restated generically ("identity governance tool"); product not named, consistent with Book 04 Ch06 | — |
| 20 | Admin consent approval reserved to the identity governance authority, non-delegable | Three questions | restated-as-design; linked Book 04 Ch06 | index.md "one control" |
| 21 | ServiceNow Microsoft Entra ID Spoke: renamed from Microsoft Azure Active Directory Spoke in 4.2.1 (Dec 2023); user, group, application, license, password, device management; revoke sessions | Integrate what platforms ship | verified (latest 4.8.2, Sept 2026) | ServiceNow release notes |
| 22 | PIM: JIT, time-bound, approval, MFA, justification, notifications, audit history | Integrate what platforms ship | verified | MS Learn PIM |
| 23 | Microsoft recommends phishing-resistant MFA for Helpdesk Admin, Auth Admin, PAA among others | Integrate what platforms ship | verified | MS Learn policy-admin-phish-resistant-mfa |
| 24 | Governance-only exemption (no manual path) | No manual path | restated-as-design; internal decision reference removed | index.md kit-conformance callout |
| 25 | Scripts: reference implementation, Graph PowerShell, not run on a live tenant, honor `-WhatIf` | No manual path | restated-as-design (program's own description; scripts themselves carried by Ch03/Ch04/App A) | index.md "runnable scripts" |
| 26 | Reversion patterns (standing admin, email as request, temp password to same inbox, old console, pasted script) | How modernization reverts | restated-as-design | Runbook as-found shapes; Vol IX framing |
| 27 | Source: ServiceNow "Government Cloud" with FedRAMP High | — | moved to Ch02 and corrected there (Marketplace name Government Community Cloud) | FedRAMP Marketplace |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| helpdesk index: front matter, title, subtitle | Ch01 opening and description | Author/date/status metadata not carried |
| helpdesk index: intro (three documents; move routine work without moving governance authority) | Ch01 "Every request answers three questions" | Platform names generalized except Entra ID |
| helpdesk index: "Download the runnable kit" callout | Ch01 "No manual path, by design" (reference-implementation framing) | Download link and kit packaging not carried (archived source; kit owned elsewhere) |
| helpdesk index: The three documents (table) | Ch04, Appendix A (admin responsibilities); Book 04 Ch06 (approval model) | Navigation table to archived pages; not linked per brief |
| helpdesk index: The operations flow | Ch01 "Integrate what the platforms already ship"; detail to Ch03 | Task-to-Spoke crosswalk is Ch03's |
| helpdesk index: The runnable scripts (table) | Ch01 summary only | Script-by-script table owned by Ch03 (triage) and Ch04/App A (W2/W3) |
| helpdesk index: Kit conformance callout | Ch01 "No manual path, by design" | Internal decision identifier and section reference removed |
| helpdesk index: The one control that ties them together | Ch01 "Every request answers three questions" (admin consent) | "Layer 4"/"IGO" layer numbering translated to "identity governance authority" |
| Vol IX Book 00: draft-proposal and internal banners, Date Code | — | Classification/draft stamps not carried (house style) |
| Vol IX Book 00: Series Context | Ch01 "Day two is most of the work"; Ch02 opening | Volume numbering not carried |
| Vol IX Book 00: Scope (FedRAMP Moderate, GCC Moderate, MID, High-on-Moderate, platform optionality) | Ch02 "The boundary question" and "ServiceNow as the reference platform" | Inherited cross-volume references removed |
| Vol IX Book 00: What This Volume Addresses | Ch01 "Day two is most of the work"; Ch02 opening | — |
| Vol IX Book 00: The Day-2 Discipline (four rules) | Ch02 "The day-two operating rules" (rule 2 wording on gates; rules 3–4 merged into the five clauses) | — |
| Vol IX Book 00: Books in This Volume (table) | Ch02 operating-model table (Ch03–Ch12) | Landing-zone front door and app-registration rows covered by Book 10 Ch07 and Ch06; identity-governance row by Book 03/04; roadmap lanes and issue numbers not carried |
| Vol IX Book 00: Closure Necessity box | Ch01 "Day two is most of the work"; Ch02 "Compliance decays through routine work" | Capitalized doctrine name removed |
| Vol IX Book 00: How This Volume Fits | Ch02 "Where the evidence goes" | KSI-feed claim corrected (KSIs bind providers) |
| Vol IX Book 00: Cross-References | Ch02 links to Book 13 Ch10, Book 03, Book 10 Ch07 | Internal file names (control map JSON, spine YAML, orchestrator JS) not carried |
| Vol IX Book 00: Provenance | — | Authoring-process note |
| Vol IX Book 00: Where This Volume's Evidence Lands (optional binding) | — | Internal engine-binding section; not carried per vocabulary rules |
