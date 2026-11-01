# Verification — Chapter 08, Joiner, Mover, Leaver

File: `docs/books/b03-hr-identity/08-joiner-mover-leaver.md`
Diagram sources: `docs/images/diagrams/b03-hr-identity/src/ch08-personnel-action-lifecycle.flow.yaml`, `ch08-provisioning-and-workflows.flow.yaml`
Verified: 2026-10-20

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | PS-4: on termination, disable access within an org-defined period; terminate or revoke authenticators and credentials | Event-stream table; new paragraph | verified (added explicit statement + footnote) | csrc.nist.gov/pubs/sp/800/53/r5/upd1/final (PDF control text) |
| 2 | PS-5: review and confirm need for logical and physical access on reassignment or transfer; modify access | Event-stream table; new paragraph | verified (added) | same as 1 |
| 3 | IA-4: prevent reuse of identifiers for an org-defined period (rehire resumes an identity) | Event-stream table; new paragraph | verified (added) | same as 1 |
| 4 | Every personnel action carries a NOA code; first digit sets the family; GPPA chapters organized around codes | Personnel actions | verified (series meanings added) | GPPA Oct 2026, Chapter 1 §4.a; chapter list |
| 5 | SF-50 required for every accession, conversion, separation (codes 1/3/5) and their corrections/cancellations; realignment doesn't need one | Personnel actions | verified (new sentence) | GPPA Chapter 1 §3.b |
| 6 | Footnote said "October 2026 edition" | Footnote c08-gppa | verified (cover reads October 2026; latest posted update is Update 112, Oct 7, 2026) | GPPA cover; opm.gov personnel-documentation page |
| 7 | Accessions are GPPA "Ch 11–11, 13" | NOA table | corrected to Ch 9–11, 13 (100/101/130/140/141 Ch 9; 170/171 Ch 11) | GPPA chapter list |
| 8 | Conversions are GPPA "Ch 11–11, 13" | NOA table | corrected to Ch 9–11, 13 (500/501/540 Ch 9; 570/571 Ch 11) | GPPA chapter list |
| 9 | 702, 713, 721 in Ch 14 | NOA table | verified | GPPA chapter list |
| 10 | 780 Ch 20; 790 Ch 21; 792 Ch 23; 781/782 Ch 24 | NOA table | verified | GPPA chapter list |
| 11 | 430, 450–452, 460, 471, 473, 480 in Ch 15 | NOA table | verified | GPPA chapter list |
| 12 | 280, 292 in Ch 16 | NOA table | verified | GPPA chapter list |
| 13 | Retirements "300–308" | NOA table | corrected to 300–304, 307, 308 (no 305/306 in Ch 30) | GPPA chapter list |
| 14 | 312, 317, 330, 350–357, 385, 390 in Ch 31 | NOA table | verified | GPPA chapter list |
| 15 | 001, 002 in Ch 32 | NOA table | verified; labelled 002 correction, 001 cancellation | GPPA Ch 32 list; Ch 4 job aid block 5-A |
| 16 | 880 Ch 26; 800, 803 Ch 28; Ch 17 pay changes | NOA table | verified | GPPA chapter list |
| 17 | Contractors have no SF-50/NOA codes | Personnel actions | verified (GPPA covers federal employment documentation only) | GPPA Chapter 1 §3.b |
| 18 | Leave is not a leaver; precedence rule; cancellations re-enable | Three rules | restated-as-design (program rules) | — |
| 19 | HR provisioning manages creation and attribute updates; LCW provides additional automation | Who does what | verified | learn.microsoft.com/entra/id-governance/lifecycle-workflow-tasks |
| 20 | Inbound provisioning enables/disables account from HR status | Who does what | verified (added second source) | .../id-governance/scenarios/automate-identity-lifecycle |
| 21 | SCIM `active` sets account status by default; `/bulkUpload` doesn't delete users; use LCW Delete user | Who does what | verified (added) | .../app-provisioning/inbound-provisioning-api-faqs |
| 22 | Workflow = tasks + execution conditions (scope + trigger) | Who does what | verified | .../id-governance/what-are-lifecycle-workflows |
| 23 | Licensing: API-driven provisioning from Entra ID P1; LCW needs Entra ID Governance or Entra Suite | Who does what | verified (added) | .../id-governance/licensing-fundamentals; what-are-lifecycle-workflows |
| 24 | Entra ID Governance available in GCC, GCC High, DoD | Who does what | verified (added) | licensing-fundamentals |
| 25 | Four scheduled trigger types plus on-demand only | Triggers | verified | .../id-governance/lifecycle-workflow-execution-conditions |
| 26 | Time-based offset "up to 365 days" | Triggers | corrected: standard trigger 0–180 days; 0–365 only in the relative time-based trigger (preview) | execution-conditions |
| 27 | Time-based attributes employeeHireDate, employeeLeaveDateTime, createdDateTime | Triggers | verified | execution-conditions |
| 28 | Scheduling must be enabled manually | Triggers | verified (added) | execution-conditions |
| 29 | Default every 3 hours; 1–24 hours | Triggers | verified | .../id-governance/customize-workflow-schedule |
| 30 | Source implied the interval is set per workflow ("set the leaver workflow's interval") | Triggers / evidence paragraph | corrected: one tenant-wide Workflow settings interval that every workflow follows; text now says set the tenant interval with the leaver workflow in mind (also flagged by the Ch10–11 editor) | customize-workflow-schedule; lifecycle-workflow-execution-conditions |
| 31 | Engine re-evaluates users just before processing | Triggers | verified | execution-conditions |
| 32 | Workflows don't run earlier than the attribute time; tenant schedule can delay | Evidence paragraph | verified (added) | .../id-governance/how-to-lifecycle-workflow-sync-attributes |
| 33 | Three-day catch-up window; later records not picked up by schedule | Evidence paragraph | verified (added; consequence for late separations stated as design) | execution-conditions |
| 34 | Built-in tasks by stage (table) | Built-in tasks | verified against current task list (selection) | lifecycle-workflow-tasks |
| 35 | No built-in task revokes a certificate/PIV or retires a device | Built-in tasks | verified (no such task in the list) | lifecycle-workflow-tasks |
| 36 | Custom task extension calls an Azure Logic App | Built-in tasks | verified | lifecycle-workflow-tasks; lifecycle-workflow-extensibility |
| 37 | TAP max lifetime 24 hours recommended for new hires (time zones) | Joiner | verified | how-to-lifecycle-workflow-sync-attributes |
| 38 | Set employeeHireDate time early so schedule doesn't delay day one | Joiner | verified (added) | how-to-lifecycle-workflow-sync-attributes |
| 39 | Real-time employee termination template: on-demand; removes groups, Teams, deletes user | Emergency termination | verified | .../id-governance/tutorial-offboard-custom-workflow-portal |
| 40 | HR-driven provisioning can reactivate or reprovision a rehire's old account; matching on employeeId | Rehire | verified (added sources) | automate-identity-lifecycle; inbound-provisioning-api-faqs |
| 41 | Deleted user restorable 30 days, then permanent | Deletion | verified | .../entra/fundamentals/users-restore |
| 42 | Synced user deleted only in Entra may be restored by next sync | Deletion | verified (added) | users-restore |
| 43 | Footnote titles stale ("Lifecycle Workflows tasks and definitions"; "...execution conditions and scheduling"; "Customize a workflow schedule") | Footnotes | corrected to current page titles; access dates updated to Oct 20, 2026 | pages as listed |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | edited | added `part: How`; `lifecycle_review` 2027-01-01 → 2027-04-01 |
| Title, thesis, "In this chapter" | kept | — |
| The lifecycle is an event stream (table + causation paragraph) | edited | added a paragraph stating PS-4, PS-5, IA-4 with an SP 800-53 footnote |
| Personnel actions are the triggers | edited | NOA series meanings and SF-50 sentence added; GPPA chapter refs fixed (9–11, 13); retirement codes corrected; 001/002 labelled; table caption footnoted |
| Figure ch08-personnel-action-lifecycle | kept | source comment header renumbered Chapter 06 → 08; no factual change |
| Contractors paragraph; three rules | kept | — |
| Who does what | edited | added `/bulkUpload` behavior, licensing and GCC availability; extra sources |
| Figure ch08-provisioning-and-workflows | kept | source comment header renumbered Chapter 06 → 08 |
| Triggers and schedule | edited | offset corrected (0–180; 365 preview only); scheduling opt-in; tenant-wide interval; catch-up window |
| Built-in tasks by stage | kept | footnote key renamed |
| Joiner | edited | added hire-time advice from the same source |
| Mover; Leaver | kept | — |
| Emergency termination | kept | — |
| Rehire and conversion | edited | added sources for reactivation and employeeId matching |
| Deletion | edited | added synced-user restore caveat |
| Continue callout | edited | "Continue the book", "Book index"; Previous now Chapter 07 — Who Owns Workforce Identity |
| Footnotes | edited | keys `c06-*` → `c08-*`; four new sources; titles and access dates updated |

## Revision 2026-10-21 — review fixes

Applied from the verified review of Books 02–05. Sources were opened again on Oct 21, 2026.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| R1 | Synchronized user: "Entra ID doesn't hold the object SOA for that account" (was "isn't the source of authority") | Deletion | restated | c08-deleted-users (unchanged) |

## Addition, October 25, 2026: Oracle Core HCM to Entra implementation research

Applied from the research page `docs/books/guides/hcm-entra-implementation.md`; every source below was opened on Oct 25, 2026.

| # | Claim | Where | Verdict | Source note |
|---|---|---|---|---|
| 1 | Joiner: "Account created ahead of the start date by provisioning" | Lifecycle table; Joiner | corrected (qualified): only if the pipeline receives the hire early; Atom feeds don't surface future-dated hires/separations by default | c08-ora-dated |
| 2 | Pre-hire workflow set more than three days ahead never runs if the hire arrives on the start date | Joiner | added (inference from the three-day catch-up) | c08-lcw-exec; c08-ora-dated |
| 3 | Recommendation: read the feed by published date so pre-hire and pre-separation steps run early | Joiner | added (design guidance; detail in Chapter 05) | c08-ora-dated |
| 4 | 365-day (preview) trigger has no three-day catch-up | Triggers and schedule | added | c08-lcw-exec |
| 5 | Enable/Disable/Delete user tasks act on synced AD accounts via the provisioning agent; account state is a two-writer field | Who does what | added | c08-lcw-tasks2; c08-lcw-onprem |
| 6 | Rule: one writer per state transition, recorded; pipeline sends active false no later than the leaver workflow's first run; workflow disable is the backstop | Who does what | added (design guidance) | c08-lcw-tasks2; c08-lcw-onprem |
| 7 | "For a synchronized user, the disposition happens in Active Directory" | Deletion | confirmed; added that Lifecycle Workflows can now carry deletion to AD (agent ≥ 1.1.1586.0 with HR-driven provisioning extension; gMSA permissions; AD Recycle Bin) | c08-lcw-tasks2; c08-lcw-onprem |
| 8 | Diagram ch08-provisioning-and-workflows: provisioning box "enable or disable from HR status" | Figure | not changed; still true, but it doesn't show that Lifecycle Workflows can now also write account state for synced accounts | — |

## Revision 2026-10-29 — four tracks and companion-guide alignment

Added an HR-track signpost, an HR-timeliness sentence after the three-day catch-up (the existing V2 caveat in *Triggers and schedule* already covers "not for Time based attribute V2 (Preview)"), a new *Guardrails at agency scale* subsection, an out-of-band paragraph in *Emergency termination*, and a new *One leaver reaches four tracks* subsection. Six new footnotes: `c08-lcw-quarantine`, `c08-lcw-limits`, `c08-lcw-ondemand`, `c08-lcw-ext`, `c08-lcw-agent-sponsor`, `c08-revoke` (names grepped unique in the book folder). Every Learn page below was opened on Oct 29, 2026.

| # | Claim | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Schedule default every 3 hours, 1–24 hours, tenant-wide | Triggers and schedule (existing); Emergency termination | re-verified, unchanged | understanding-lifecycle-workflows (Scheduling); governance-service-limits |
| 2 | Three-day catch-up; doesn't apply to Time based attribute V2 (Preview) | Triggers and schedule (existing) | re-verified, unchanged | understanding-lifecycle-workflows (Scheduling note) |
| 3 | Execution limits: tenant-wide or per workflow; percentage, number or both, OR logic; scheduled run that exceeds is quarantined and admins notified; approval needed; can't be cleared automatically; updating limits creates a new version | Guardrails | verified | learn.microsoft.com/entra/id-governance/lifecycle-workflow-execution-limits (c08-lcw-quarantine) |
| 4 | Execution limits apply only to scheduled runs; on-demand runs not subject, including on a quarantined workflow | Guardrails | verified ("You can also run a quarantined workflow on demand, which bypasses execution limits") | same as 3 |
| 5 | On-demand: up to 10 users | Guardrails | verified | governance-service-limits#lifecycle-workflows; on-demand-workflow (c08-lcw-limits, c08-lcw-ondemand) |
| 6 | On-demand ignores execution conditions | Guardrails | verified | understanding-lifecycle-workflows, On-demand scheduling (c08-lcw-ondemand) |
| 7 | 100 workflows, 100 custom task extensions per tenant; 25 tasks per workflow | Guardrails | verified | governance-service-limits#lifecycle-workflows (c08-lcw-limits) |
| 8 | Few general workflows, PIM on the LCW admin role, sized thresholds, reorganization as a change event with pre-agreed quarantine release | Guardrails | restated-as-design (LIMITS.md), labelled *(design guidance)* | — |
| 9 | Real-time employee termination template is on demand (no execution condition) | Emergency termination (existing) | re-verified, unchanged | lifecycle-workflow-templates |
| 10 | Hybrid emergency revoke: disable in AD, reset password twice, disable in Entra, revoke refresh tokens, disable registered devices | Emergency termination | verified | learn.microsoft.com/entra/identity/users/users-revoke-access (c08-revoke) |
| 11 | Access tokens last one hour by default; app session tokens last until the app revokes them; CAE shortens it for capable apps | Emergency termination | verified | same as 10 (When access is revoked; Access tokens and refresh tokens; Best practices) |
| 12 | Custom task extension calls an Azure Logic App; launch and continue or launch and wait with a duration; a third-party system can respond | One leaver reaches four tracks | verified | learn.microsoft.com/entra/id-governance/lifecycle-workflow-extensibility (c08-lcw-ext) |
| 13 | Built-in task transfers agent identity sponsorships to the manager (mover/leaver); needs a Microsoft Agent 365 license | One leaver reaches four tracks | verified; GCC availability not confirmed, so the text says "confirm it in the tenant's cloud" | learn.microsoft.com/entra/id-governance/agent-sponsor-tasks (c08-lcw-agent-sponsor) |
| 14 | PIV/certificateUserIds, Intune retire, Arc access, owner reassignment via custom extensions; checklist fallback; chain workflows | One leaver reaches four tracks | restated-as-design (LIMITS.md) | — |

Not published: the custom task extension timeout. The service-limits page says 30 minutes–3 hours (confirmed Oct 29); LIMITS.md notes the deployment page says otherwise. The chapter doesn't state a timeout.

## Additions, October 30, 2026 (the contractor PIV path)

Added at the author's request. The path is set in Chapter 09, "The contractor PIV path", and its sources are logged in `_verification/09-credentials-and-certificates.md` (October 29) and the research page's log.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Contractor joiner sends the sponsorship request; card termination or expiry is a leaver input, reissue isn't | Contractors paragraph after the nature-of-action table | design (labelled); restated from Ch09 and linked | — |
| 2 | The custom task sends the PIV office the termination notice on the end date | After the built-in tasks table | design; restated from Ch09 and linked | — |

## Additions, October 30, 2026 (contractor PIV path marked pending proof)

Added at the author's request during the independent verification pass (`docs/about/_verification/verification-pass-2026-10.md`). No content removed.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | "Pending proof": the contractor PIV path is the program's design and hasn't yet been validated in practice; links to the Proved criteria | Nature-of-action triggers, after the contractors paragraph | restated-as-design (status statement; nothing external claimed) | `docs/evaluations/oracle-contingent-worker-contractor-source.md#status-and-review` |
