# Verification — Chapter 03, Intake, Triage and Routing

Writer W2. Sources: `docs/operational-guides/helpdesk-entra-operations/helpdesk-flow.md` (whole page) and the routing parts of `docs/operational-guides/helpdesk-entra-operations/help-desk-administrative-responsibilities.md` (the three-platform model, IGA actors, auto-routing preconditions, automation-vs-manual table, incoming request types, OneDrive auto-routing and approval matrix, escalation matrix, audit and compliance requirements, ServiceNow automation alignment). W3 owns the rest of that page (Ch04 and Appendix A). Kept consistent with Book 04 Ch06 (A0–A3 split, approvers don't execute, Microsoft-mail rule and its clocks, one-hour closure, enterprise-application tiers), Book 13 Ch10 (ticket to machine, service desk as front door, closure as re-read), Book 01 Ch09 (verification procedure is a CISO decision), Book 12 Ch02/Ch03 (evidence contract, log retention) and Book 14 Ch08 (minimization). All sources opened October 21, 2026; Microsoft pages via the Microsoft Learn MCP tools; ServiceNow, NIST and CISA pages via WebFetch; SP 800-53 text from NIST's OSCAL 5.2.0 catalog fetched with curl (no identifying headers). No personal data sent anywhere.

Internal vocabulary translated: "SAM (Systems Access Management)" → "the identity governance and administration (IGA) platform" (the source's platform name is agency-specific and is dropped; SailPoint is not named because the chapter makes no product claim about it); "Cloud Services" → "cloud services"; "the kit", "`$RequestRoutingTable`", "Invoke-RequestTriage" → "the triage classifier"; "IGO" kept as Book 04 uses it; RITM/SCTASK → "request item and task".

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Nothing handled as ad hoc email; triage first; cloud services is escalation, not intake | One front door | restated-as-design | Source "one rule"; matches Book 04 Ch06 |
| 2 | Four intake sources (catalog, email, IGA-generated, monitoring webhook) | One front door | restated-as-design | Source OneDrive auto-routing triggers and IGA RITM types |
| 3 | `BlindCopyTo` adds Bcc recipients (original still delivered); `RedirectMessageTo` redirects | Redirecting the mailbox | corrected | Source used `-BlindCopyTo` for a "redirect"; Microsoft Learn New-TransportRule parameter text. Chapter uses `RedirectMessageTo` and explains the difference |
| 4 | `-Mode Audit` writes would-be actions to message tracking log, no delivery effect; `Enforce` default | Same | verified | Microsoft Learn New-TransportRule `-Mode` |
| 5 | Illustrative `Get-TransportRule` / `New-TransportRule` with `-SentTo`, `-RedirectMessageTo`, `-Mode` | Code block | verified | Parameters exist on New-TransportRule page; read-only command added first; warning callout added |
| 6 | ServiceNow classifies inbound mail as forward, reply or new; actions create/update records like business rules; default no-watermark creates incident | Same | verified | ServiceNow "Inbound email actions" (Australia) |
| 7 | Inbound email flows take priority over inbound email actions | Same | verified | Same page |
| 8 | "*New*-type Inbound Email Action" | Same | corrected | "New" is an email classification, not an action type (action types are record action and reply email); reworded |
| 9 | Email filters ignore (saved, not processed) or move to Junk; defaults include sender-equals-recipient to Junk | Same | verified | ServiceNow "Email filters" (Brazil) |
| 10 | Reroute business rule for tickets assigned straight to cloud services | Same | restated-as-design | Source |
| 11 | Configuration reference table | Same | restated-as-design | Source, generalized |
| 12 | Authority classes and triage tests | Triage | verified (against workbook) | Book 04 Ch06 table |
| 13 | Fixed triage order (Microsoft mail, privileged target/out of scope, A3, A2, A1, A0) | Same | restated-as-design | New ordering synthesized from source rules; labeled program design |
| 14 | PIM notifications sent from `MSSecurity-noreply@microsoft.com` | Notifications | verified | Microsoft Learn "Email notifications in PIM" |
| 15 | Source: "confirm sender is exactly MSSecurity-noreply@microsoft.com" as legitimacy check | Same | corrected | Microsoft also uses `azure-noreply@microsoft.com` (ops guide) and SSPR-specific and US Government addresses (SSPR how-it-works); sender check reframed as a filter, audit-log match as the real check |
| 16 | Notification-type action/escalation table; unauthorized grant → IGO + SOC | Same | restated-as-design | Source tables |
| 17 | Four-business-hour verify / one-hour escalate clocks | Same | verified (against workbook) | Book 04 Ch06 |
| 18 | ServiceNow Ask for Approval sends sign-off request and tracks result; due date auto-approves/rejects/cancels | Routing | verified | ServiceNow "Ask for Approval action" (Yokohama) |
| 19 | Due-date outcome set to reject or cancel, never approve | Same | restated-as-design | Program rule added |
| 20 | IGA pipeline actors (requester, business approver, application owner, IGO, IGA connector, help desk operator) | Same | restated-as-design | Source actor table, condensed; agency platform name dropped |
| 21 | Entra ID spoke, formerly Microsoft Azure Active Directory spoke; ten categories | Prefer the connector | verified | ServiceNow Entra ID spoke page (Zurich) |
| 22 | Spoke requires Integration Hub subscription; custom app, OAuth 2.0; delegated with authorization code, application with client credentials | Same | verified | Same |
| 23 | Reset Password resets Entra-created users only, not federated | Same | verified | Same |
| 24 | Source: Reset/Change Password/Revoke Sessions "not supported as application permissions" | Same | corrected | Reset Password lists Application `User-PasswordProfile.ReadWrite.All`; Change Password and user-management Revoke User SignIn Sessions are delegated-only |
| 25 | Source crosswalk: MFA/auth-method reset = Spoke | Same | corrected | User Authentication category lists only Revoke User SignIn Sessions; no method-reset action. Chapter makes MFA reset a help desk task |
| 26 | Source crosswalk: device enable/disable/delete = Spoke | Same | corrected | Device Management lists only device group-membership and lookup actions |
| 27 | Source crosswalk: enterprise app access via spoke for membership | Same | verified with caveat | Group actions exist; Create/Delete Application Assignment exist but the page doesn't say they handle group-to-app-role; chapter keeps the binding as a help desk task until piloted |
| 28 | License, user enable/disable/update, group create/owners actions exist | Same | verified | Spoke action lists |
| 29 | Synced user reset requires writeback and a managed domain; federated domains reset on premises | Same | verified | Microsoft Learn "Reset a user's password" |
| 30 | Entra admin center reset writes back for federated/PHS users; Microsoft 365 admin center doesn't | Same | verified | Microsoft Learn SSPR writeback concept; M365 admin center troubleshooting article |
| 31 | Team executes, manager or owner approves; no approval authority at help desk | Who executes | verified (against workbook) | Book 04 Ch06 |
| 32 | AC-5 text | Same | verified | SP 800-53r5 OSCAL 5.2.0 |
| 33 | PIM approvers can't approve their own activation requests | Same | verified | Microsoft Learn PIM approval workflow |
| 34 | Approval-by-resolution table | Same | restated-as-design | Source OneDrive approval table, generalized |
| 35 | Source: MFA reset approved by Help Desk Supervisor | Same | corrected | Aligned with Book 04 Ch06 (manager, after identity verification) |
| 36 | Three preconditions; on hold; don't chase approvers; emergency change through ITSM; ad hoc = violation | Before acting | restated-as-design | Source |
| 37 | Scattered Spider posed as employees to get help desk to reset passwords and move MFA (July 2025 update); posed as IT to get OTPs; recommends phishing-resistant MFA (FIDO/WebAuthn, PKI) | Verify the person | verified | CISA AA23-320A |
| 38 | SP 800-63B-4 final July 2025 (July 31, 2025), supersedes 2020 SP 800-63B | Same | verified | CSRC publication record |
| 39 | Human-assisted recovery social engineering risk; CSR collusion and admin-impersonation examples; mitigation to avoid authenticators with social engineering risk to customer service agents | Same | verified | 800-63B-4 threats and security considerations |
| 40 | Forgotten-password replacement with other authenticators = binding, at max AAL available (4.1.2.1, 4.2) | Same | verified | 800-63B-4 events page |
| 41 | Recovery methods; AAL2 recovery options; AAL3 IAL3 biometric comparison | Same | verified | 800-63B-4 Sec. 4.2.1, 4.2.2.2, 4.2.2.3 |
| 42 | Recovery SHALL cause notification (4.2.3), with instructions and contact info (4.6) | Same | verified | Same |
| 43 | Phishing resistance definition; cryptographic auth required; OTP/out-of-band not phishing-resistant; "verifier impersonation" was the earlier term | Same | verified | 800-63B-4 Sec. 3.2.5 (heading is "Phishing Resistance") |
| 44 | Federal agencies SHALL require phishing-resistant auth for staff, contractors, partners; AAL2 verifiers SHALL offer a phishing-resistant option | Same | verified | 800-63B-4 AAL2 "Authenticator and Verifier Requirements" (2.2.2; number inferred from cross-references) |
| 45 | IA-5 a and d text | Same | verified | SP 800-53r5 OSCAL 5.2.0 |
| 46 | Microsoft verified help desk: PII/KBA no match vs phishing, social engineering, AI voice cloning; strong-auth and total-loss patterns; TAP after Verified ID | Same | verified | Microsoft Learn "Verified helpdesk with Microsoft Entra Verified ID" |
| 47 | Entra account recovery: third-party IDV, government ID + liveness, Verified ID, name match by default, custom extension, TAP | Same | verified | Microsoft Learn "Account recovery overview" |
| 48 | Account recovery GA May 2026 | Same | verified | Verified ID what's new, May 2026 (public preview was November 2025 per Entra what's-new archive) |
| 49 | Requires Entra ID P1 and Face Check license | Same | verified | Account recovery FAQ |
| 50 | Verified ID supported in GCC, not GCC High, since September 2025 | Same | verified | Verified ID what's new, September 2025 |
| 51 | Account recovery availability in GCC | Same | unverifiable | No Microsoft page found stating it; chapter tells reader to confirm |
| 52 | TAP: Authentication Admins for members, Privileged Authentication Admins for admins; lifetime 10 min–30 days; one-time-use policy; value shown once | Same | verified | Microsoft Learn TAP how-to |
| 53 | Verification ladder; CISO owns it | Same | restated-as-design | Program design; Book 01 Ch09 for CISO ownership |
| 54 | Ticket records rung, never evidence data | Same | restated-as-design | Program design; minimization per Book 14 Ch08 |
| 55 | Three records (ticket, PIM activation, audit log) must agree; ticket field list | Evidence | restated-as-design | Source "Enterprise Application change documentation" and RITM metadata, extended |
| 56 | CM-3 a–e text | Same | verified | SP 800-53r5 OSCAL 5.2.0 |
| 57 | Close within an hour of change | Same | verified (against workbook) | Book 04 Ch06 |
| 58 | PIM can require justification, ticket info, approval; ticket field information-only, correlation not enforced | Same | verified | Microsoft Learn PIM role settings |
| 59 | Source: justification without valid RITM "automatically flagged ... within 24 hours" | Same | corrected | Not native (see 58); restated as a SIEM detection the program must build |
| 60 | Source: PIM audit events "automatically exported to the agency's SIEM" | Same | corrected | Export is configured, not automatic; chapter says logs are forwarded per Book 12 Ch03 |
| 61 | Audit and sign-in logs 30 days P1/P2, 7 days Free | Same | verified | Microsoft Learn data retention |
| 62 | Help desk log access read-only within a ticket; non-compliance reporting list, one business day | Same | restated-as-design | Source |
| 63 | SLA table | Service levels | restated-as-design | Source "SAM-originated RITM SLA requirements", generalized |
| 64 | Flow definition row and create/modify steps | Describing request types | restated-as-design | Source, with verification, evidence and due-date fields added |
| 65 | Worked example (payroll app, A2) | Same | restated-as-design | Source example; Tier 1 approver and hold window aligned with Book 04 Ch06 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| helpdesk-flow: intro, "The one rule" callout | Ch03 opening; One front door | — |
| helpdesk-flow: "Integrating ServiceNow's shipped functions" callout | Prefer the connector | Spoke quotation replaced by verified paraphrase |
| helpdesk-flow: recommended target architecture, four recommendations | One front door; Triage; Routing; Who executes | — |
| helpdesk-flow: task ↔ spoke crosswalk | Prefer the connector (corrected table) | Rows for MFA reset, device actions corrected; OneDrive rows folded into the approval-by-resolution table |
| helpdesk-flow: what the spoke ships | Prefer the connector | Application Administrator quote dropped: role scope is Ch04 (W3) and Book 04 Ch06 |
| helpdesk-flow: two limits callout | Prefer the connector | Corrected (claim 24) |
| helpdesk-flow: coverage is release-dependent | Prefer the connector | — |
| helpdesk-flow: Mechanism A | Redirecting the mailbox | Corrected to RedirectMessageTo, audit mode, read-only first |
| helpdesk-flow: triage decision | Triage; Notifications | — |
| helpdesk-flow: two approval pipelines; Admin Consent never auto-executes | Routing; Notifications table | Admin consent procedure itself is Book 04 Ch06 and Ch04 |
| helpdesk-flow: describe/modify/create a flow | Describing, changing and adding a request type | — |
| helpdesk-flow: worked example | A worked example | — |
| helpdesk-flow: configuration reference | One front door table | — |
| helpdesk-flow: companion kit note | Not carried | Internal kit reference; pilot advice kept in the warning callout |
| helpdesk-flow: references and footnotes | Endnotes, re-verified | Community article on Flow Designer approvals replaced by ServiceNow product doc |
| admin-resp: three-platform model, key principle | Ch03 opening; Routing | Platform names generalized |
| admin-resp: SAM actors | Routing (IGA pipeline) | Condensed to prose |
| admin-resp: how SAM auto-routes to ServiceNow | Before acting | — |
| admin-resp: SAM automation vs Help Desk manual action | Prefer the connector table; Who executes | Role-by-role PIM detail is Ch04 (W3) |
| admin-resp: Microsoft Security notifications (what, triage steps, table, Admin Consent warning) | Notifications | Sender check corrected (claim 15) |
| admin-resp: ServiceNow request types (six RITM types) | Routing; approval-by-resolution table; Verify the person (MFA) | Per-task resolution steps are Appendix A (W3) |
| admin-resp: OneDrive auto-routing triggers | One front door source table | — |
| admin-resp: OneDrive approval requirements by resolution | Who executes (approval-by-resolution table) | — |
| admin-resp: full OneDrive resolution workflow | Who executes (pending approval loop); Evidence (update IGA, end PIM session) | OneDrive diagnostics are Ch04/App A (W3) |
| admin-resp: CA, UPN change, password sync, ad hoc fix callouts | Before acting (ad hoc fix rule) | UPN/password-sync tips are task detail for App A (W3) |
| admin-resp: escalation matrix | Triage order; Notifications table; Routing escalation lane | Full matrix is App A (W3) |
| admin-resp: PIM elevation logging | Evidence (PIM correlation) | Corrected (claims 59, 60) |
| admin-resp: Enterprise App change documentation | Evidence field table | — |
| admin-resp: SLA requirements | Service levels | — |
| admin-resp: quarterly PAG access reviews | Not carried | PAG design and reviews are Ch04 (W3) and Book 04 |
| admin-resp: audit log retention | Evidence | — |
| admin-resp: non-compliance reporting | Evidence | — |
| admin-resp: ServiceNow automation alignment | Prefer the connector | — |
| admin-resp: all other sections (purpose, authority boundaries, PAG/PIM design, roles, Admin Consent workflow, Enterprise App procedures, hybrid identity, OneDrive diagnostics, document control) | Not carried here | Owned by W3 (Ch04, Appendix A) |

## Diagrams

- `docs/images/diagrams/b15-day2-operations/src/ch03-one-front-door.flow.yaml` — intake sources to one queue, triage, three lanes. Distinct from Book 04's `ch06-authority-split` (which shows approval and execution); this one shows intake mechanics.
- `docs/images/diagrams/b15-day2-operations/src/ch03-verify-before-acting.flow.yaml` — preconditions, verification gate, PIM, execute/re-read/notify, evidence.

Both validated as YAML only; not rendered (editor renders).

## Additions, October 23, 2026 (federal framework crosswalk follow-up)

Every claim was checked against the primary source on October 23, 2026. Sources: research briefs on investment and acquisition, and on service, accessibility and records (program working files).

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Help desks and self-service support conform to 603; accommodate communication needs; forms are covered | One front door | verified (quoted) | 36 CFR 1194 App. C 603.1, 603.3; App. A E205.3(G), E208.1 |
| 2 | IDEA §3(c) for post-2018 intranets | One front door | verified (quoted) | Pub. L. 115-336 §3(c) |
| 3 | Train help-desk staff on assistive technology | One front door | verified (quoted) | OMB M-24-08 §III.F |
