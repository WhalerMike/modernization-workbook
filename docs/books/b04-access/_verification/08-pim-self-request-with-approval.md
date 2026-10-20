# Verification — Chapter 08, PIM Self-Request with Approval

Checked 2026-10-20 against Microsoft Learn (Learn MCP search and fetch), NIST CSRC and the NIST OSCAL content repository. Footnote keys are `c08-*` in the chapter.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | DoD ZT user pillar: approval in entitlement management, PIM, or both | Opening | verified | c08-dod-zt |
| 2 | PIM license P2 or ID Governance; who needs licenses (eligible, approvers, reviewers) | Prerequisites | verified | c08-licensing |
| 3 | License lapse: PIM stops serving; in-flight Entra role reviews end; settings removed | Prerequisites callout | corrected: also **eligible Entra role assignments are removed** and PIM stops sending email; permanent assignments unaffected | c08-licensing |
| 4 | PRA least-privileged to configure PIM and assign roles | Prerequisites | verified | c08-settings, c08-by-task |
| 5 | Alert readers (GA, PRA, Global Reader, Security Admin, Security Reader); Security Reader for audit | Prerequisites | verified | c08-alerts, c08-by-task |
| 6 | `RoleManagementPolicy.ReadWrite.Directory` to update rules | Prerequisites | verified | c08-update-rules |
| 7 | `RoleManagement.ReadWrite.Directory` to create eligible assignments | Prerequisites; Step 5 | corrected: least-privileged is `RoleEligibilitySchedule.ReadWrite.Directory`; delegated caller must hold PRA | c08-elig-request |
| 8 | ID Governance available in GCC, GCC High, DoD | Prerequisites | verified | c08-feature-availability |
| 9 | Active vs eligible definitions | Target design | verified | c08-pim-overview |
| 10 | Settings per role, independent; aka PIM policies | Activation controls | verified | c08-settings |
| 11 | Activation max 1–24 h | Activation controls | verified (note: the Graph PIM API overview page says "maximum of 8 hours" by default; the role-settings page states 1–24 h; the chapter follows the settings page) | c08-settings |
| 12 | MFA on activation may not prompt within session | Activation controls | verified | c08-settings |
| 13 | Ticket info is information-only | Activation controls | verified | c08-settings |
| 14 | Approvers users or groups "of all types" | Activation controls; Step 1 | corrected: "one or more users or groups"; "all types" dropped | c08-settings |
| 15 | At least one approver; recommend two | Activation controls | verified | c08-settings |
| 16 | Admin center offers MFA and auth context as either-or | Activation controls | removed; restated as Microsoft's recommendation (auth context + strength for activation-time proof) and the program's choice | c08-settings |
| 17 | Six assignment settings by name | Assignment controls | verified | c08-settings |
| 18 | Drop-down expiry values (15 days, 1/3/6 months, 1 year) | — | unverifiable on Learn; not used; chapter uses ISO durations P90D/P180D/P365D via Graph | — |
| 19 | Tier values table | Settings by tier | restated-as-design | — |
| 20 | Lockout condition (all PRA/GA eligible, approval required, no approvers) and both-halves fix | Step 0 | verified | c08-settings |
| 21 | Emergency accounts standard | Step 0 | verified (see Ch04 log) | c08-emergency |
| 22 | Approvers need no role; can't self-approve; SPs can't approve | Step 1 | verified | c08-settings, c08-approval |
| 23 | Approvers need P2/Governance license | Step 1 | verified (added) | c08-licensing |
| 24 | CA policy must be created and enabled before configuring context in PIM | Step 2 | verified | c08-settings |
| 25 | Sign-in frequency Every time forces reauth per activation | Step 2 | verified | c08-settings |
| 26 | Don't scope CA policy to both auth context and directory role | Step 2 | verified | c08-settings |
| 27 | MFA backup when no policy targets context; not triggered for off/report-only/excluded | Step 2 | verified | c08-settings |
| 28 | 10-minute window across Entra roles, Azure roles, PIM for Groups | Step 2 | verified | c08-settings |
| 29 | Context governs activation only; second policy option | Step 2 | verified; program closes via Ch07 CA003/CA004/CA025 (design) | c08-settings |
| 30 | "Publish to apps" must be checked for the context to be selectable | Step 2, Step 6 | removed (not confirmed on pages opened) | — |
| 31 | Auth context names `c1` (PIM) / `c2` (protected actions), policy `PIM-Activation-c1` | Steps 2, 6 | restated-as-design; flagged that Ch07 has no numbered entry | — |
| 32 | Portal path ID Governance > PIM > Microsoft Entra roles > Roles > Role settings > Edit | Step 3 | verified | c08-settings |
| 33 | Empty approver list → active PRA/GA default approvers | Step 3 | verified | c08-settings |
| 34 | Policy lookup GET on roleManagementPolicyAssignments with filter | Step 4 | verified | c08-update-rules |
| 35 | 17 rules per policy; rule IDs incl. AuthenticationContext and nine Notification rules | Step 4 | verified (AuthenticationContext and Notification rules added to source table) | c08-rules |
| 36 | `@odata.type` required; PATCH returns 204 | Step 4 | verified | c08-update-rules |
| 37 | Auth context rule shape `isEnabled`, `claimValue` | Step 4 | verified (added) | c08-authctx-rule |
| 38 | Multi-step approval not supported; SingleStage | Step 4; constraints | verified | c08-approval |
| 39 | Cmdlets in Microsoft.Graph.Identity.SignIns (policy) and Identity.Governance (eligibility request) | Step 4 script; Step 5 | corrected: source `#Requires` named Identity.Governance for the policy cmdlets; changed to Identity.SignIns | c08-update-rules, c08-elig-request |
| 40 | Script syntax | Step 4 script | corrected: source had `@` for empty arrays (broken); restored `@()`; added auth context rule; MFA dropped in favor of context | — |
| 41 | 5-minute minimum and no removal within 5 minutes | Step 5 | verified | c08-assign |
| 42 | Last time-bound GA not removed at expiry | Step 5 | verified and refined: active vs eligible cases distinguished | c08-assign |
| 43 | Last active GA *and PRA* can't be removed | Step 5; constraints | corrected in scope: assignment page covers GA only; PRA protection appears only in the PIM overview feature list, cited as such | c08-assign, c08-pim-overview |
| 44 | Protected actions: CA create/update/delete, deletedItems, authenticationContext update, cross-tenant, named locations; P1; Azure PowerShell fails; ToU/custom controls blocked; don't use to block by identity | Step 6 | verified | c08-protected-actions |
| 45 | Recovery `aka.ms/MSALProtectedActions`; off/report-only policy can't satisfy | Step 6 | verified (search excerpt of add page) | c08-protected-actions-add |
| 46 | Protected actions preview status | Step 6 | conflict noted: overview has no preview label; privileged-roles page says preview | c08-protected-actions, c08-privileged-roles |
| 47 | Notification options (off, named only, default + named, critical only); 1,000 recipients/event | Step 7 | verified | c08-settings, c08-email |
| 48 | Default recipients for pending approval and activation completed; two approver emails, 3–10 (up to 15) min; sender MSSecurity-noreply | Step 7 | verified (added) | c08-email |
| 49 | Alert names | Step 7 | corrected: exact current names ("...outside of Privileged Identity Management", "...multifactor authentication...", "...doesn't have Microsoft Entra ID P2 or Microsoft Entra ID Governance") | c08-alerts |
| 50 | Alert severities and thresholds (High; Medium stale 1–365; GA count 2–100 and % 0–100; activations 2–100; unused 0–100 days) | Step 7 | verified (severities added) | c08-alerts |
| 51 | PIM alerts Graph API beta only | Step 7 | verified (added) | c08-apis |
| 52 | Access reviews: PRA to create; one review per role; reviewer options; auto-apply; no-response options | Step 8 | verified | c08-review |
| 53 | Role-assignable groups shown by group name; denial removes group assignment; self-review excludes role-assignable groups | Step 8 | verified (added; drives correction of Book 02 Ch10 self-attestation) | c08-review |
| 54 | PIM resource audit 30 days; Entra audit/sign-in logs 7 (Free) / 30 (P1, P2) days | Step 9 | verified | c08-audit, c08-retention |
| 55 | Retention changes not retroactive; export via diagnostic settings | Step 9 | verified | c08-retention |
| 56 | Correlate by role assignment request ID | Step 9 | verified (added) | c08-audit |
| 57 | UAL separate, managed in Purview | Step 9 | restated-as-design (not re-verified; kept as a program caution without footnote) | — |
| 58 | Requester path; aka.ms/pim; banner text | Requester's path | verified (activate page via search excerpt; banner from settings page) | c08-activate, c08-settings |
| 59 | Approver path; first approver resolves | Approver's path | verified | c08-approval |
| 60 | List pending via v1.0 filterByCurrentUser(on='approver') | Approver's path | verified | c08-approval |
| 61 | Approve via PATCH roleAssignmentApprovals steps | Approver's path | verified with correction: beta only; body includes justification; GET approval first for step ID | c08-apis, c08-approval |
| 62 | `/beta/privilegedAccess` stops returning data Oct 28, 2026 | Callout | verified (added) | c08-apis |
| 63 | 24 h approval window, not configurable | 24-hour window | verified | c08-approval |
| 64 | Extend/renew by GA/PRA only; user requests approved by GA/PRA; not supported via Graph; 14-day window | Extending and renewing | verified | c08-renew, c08-approval |
| 65 | Separation-of-duties rules | Approver design | restated-as-design (two-approver recommendation verified) | c08-settings |
| 66 | All mapped controls in Moderate baseline 5.2.0 | Control mapping | verified (OSCAL profile checked by script: AC-2, AC-2(1), AC-2(13), AC-3, AC-5, AC-6, AC-6(1),(2),(5),(7),(9),(10), AC-17(4), AU-2, AU-6, AU-11, AU-12, CM-5, IA-2(1), PS-4, PS-5) | c08-nist-moderate |
| 67 | AC-6, AC-6(7), (9), (10) text | Control mapping | verified | c08-nist |
| 68 | Mapping rows | Control mapping | restated-as-design (design-intent mapping, as in the source) | — |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| access-plane/pim-self-request-approval.md — front matter, series/boundary/classification line | — | Classification stamps not carried (workbook rule) |
| — "What this guide is" callout | Ch08 opening and links | — |
| — Purpose and scope: in scope / out of scope | Ch08 opening; Ch04 covers PIM for Groups and Azure roles | Out-of-scope list folded into links |
| — "Self-request has two layers" callout | Ch08 opening paragraph; Ch04 Layer 1 | — |
| — Reading order | Ch08 "Build" intro | — |
| — Prerequisites table | Ch08 Prerequisites (corrected Graph permission; licensing detail) | — |
| — License dependency callout | Ch08 callout (corrected) | — |
| — Target design: eligible not active | Ch08 "Eligible, not active" | — |
| — Six activation controls table | Ch08 "The activation controls" | — |
| — Assignment-side controls | Ch08 "The assignment controls" | — |
| — Role tiering table and tip | Ch04 tiers; Ch08 settings by tier; Appendix B | — |
| — Step 0 emergency access | Ch08 Step 0; Ch04 Emergency access | — |
| — Step 1 approver groups | Ch08 Step 1 | — |
| — Step 2 portal configuration | Ch08 Step 3 | Reordered after the auth-context step, which must exist first |
| — Step 3 Graph: find policy, template IDs, rules, PATCH examples, script | Ch08 Step 4; template IDs to Appendix B | MFA PATCH replaced by auth context + enablement pair; script fixed |
| — Step 4 convert standing assignments | Ch08 Step 5 | Example principal changed to the role-assignable group (Ch04 design) |
| — Step 5 authentication context | Ch08 Step 2 | Moved earlier; "second CA policy on directory roles" replaced by Ch07 persona policies (with Microsoft's option noted) |
| — Step 5a protected actions (table, build order, PowerShell warning, lockout callout, design rule) | Ch08 Step 6 | Note about bare-host link formatting dropped (editorial) |
| — Step 6 notifications and alerts | Ch08 Step 7 (alert names corrected, severities added) | — |
| — Step 7 access reviews; groups note | Ch08 Step 8 | Help Desk guide link replaced by Ch04/Ch09 links |
| — Step 8 export audit records | Ch08 Step 9 | — |
| — Operating: requester's path, approver's path, Graph | Ch08 Operating the workflow | Approval API corrected to beta with justification |
| — The 24-hour window | Ch08 "The 24-hour window" | — |
| — Approver design and SoD table | Ch08 Approver design | — |
| — Assessment evidence table; keep tenant artifacts out callout | Ch08 Assessment evidence | `evidence/` tree convention reference dropped (repo-internal) |
| — Validation test plan | Ch08 Validation test plan (tests 13, 14 added) | — |
| — Control mapping and how-to-read callout; gaps | Ch08 Control mapping; "Where this build alone isn't sufficient" | — |
| — Known constraints table | Ch08 Known constraints (legacy API deadline added) | — |
| — Sources list | Footnotes | Replaced by per-claim footnotes |
| — Related documents | Links in text | "Entra ID Governance adapter spec" not linked (no workbook page) |
| pim-self-request-approval.md (short twin) — Purpose, Pattern (6 steps) | Ch08 opening and diagram | Duplicate of main guide |
| — Requirements table | Ch08 activation controls, settings by tier, evidence | — |
| — Residual risk (approver fatigue, unreviewed eligibility, break-glass bypass) | Ch08 Step 7 (alert "activated too frequently"), Step 8 reviews, Step 0 / constraints | Approver fatigue addressed through small approver groups and frequency alert |

## 3. Notes for the editor

- **Chapter 07 has no numbered policy** for the PIM activation authentication context (`PIM-Activation-c1`) or the protected-actions context (`c2`). Suggest adding them to Wave 2.
- **Book 02 Ch10 access-review row** ("assignees self-attest") conflicts with Microsoft's behavior that self-review excludes role-assignable groups; Ch08 and Appendix B use selected reviewers.
- **Diagram source:** `docs/images/diagrams/b04-access/src/ch08-activation-sequence.seq.yaml` (4 participants, column 165, gap 22 → ~786 px; not rendered; YAML parses).
