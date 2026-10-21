# Verification — Chapter 09, Access Governance: Packages, Reviews and Lifecycle

Sources: `docs/compliance/Vol_IX_Book_06_Identity_Access_Governance.md` (whole page);
`docs/operational-guides/helpdesk-entra-operations/enterprise-application-access-governance.md`
(risk-tier review cadence, group-based access governance model, audit/monitoring/compliance, exceptions);
`docs/compliance/Vol_VI_Book_02_Identity_Access_as_Code.md` is carried in Chapter 10. All sources accessed Oct 20, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | AC-2 requires periodic account review and alignment with termination/transfer; AC-6(7) requires periodic privilege review | Opening | verified (source paraphrased AC-2(5) as the "review-and-recertification" enhancement; corrected: AC-2(5) is Inactivity Logout, the review requirement is AC-2 j and AC-6(7)) | FedRAMP Access Control catalog page |
| 2 | Entitlement management and access reviews need Governance for member users incl. reviewers/reviewees; some P2 capabilities remain | Licensing | verified | id-governance/licensing-fundamentals |
| 3 | No new IGA features will be added to P2 | Licensing | verified (added) | licensing-fundamentals FAQ |
| 4 | Feature-by-license table rows (packages, multi-stage approval, expiry, SoD on P2; auto-assignment, custom extensions, on-behalf, PIM for Groups and roles in packages, mark governed, inactive-only reviews, ML recommendations, PIM for Groups reviews, LCW, inactive guest insights on Governance) | Licensing | verified (added) | licensing-fundamentals |
| 5 | Licenses needn't be assigned; enough to cover in-scope users | Licensing | verified (added) | licensing-fundamentals FAQ |
| 6 | Guests billed MAU, requires Azure subscription | Licensing | verified (added) | licensing-fundamentals |
| 7 | Governance for Government SKUs in GCC, GCC High, DoD | Licensing | verified (added) | licensing-fundamentals |
| 8 | Group-based assignment mandatory; direct user assignment prohibited | Group substrate | restated-as-design | program design (source policy) |
| 9 | Group-based app assignment needs P1/P2; nested groups not supported | Group substrate | verified | assign-user-or-group-access-portal |
| 10 | Group review flattens nested groups; removal only from direct membership | Group substrate | verified (added) | create-access-review |
| 11 | Naming convention `APP-<App>-<Role>-<Tier>` | Naming | restated-as-design | source policy |
| 12 | Dynamic vs assigned by tier | Naming | restated-as-design | source policy |
| 13 | Three-party separation of duties | Three parties | restated-as-design | source policy |
| 14 | AC-5 statement | Three parties | verified | FedRAMP Access Control |
| 15 | Group governance reference table (cadence, nesting, PIM) | Three parties | restated-as-design | source policy |
| 16 | Entitlement management scope (groups, apps, SharePoint; internal and external) | Entitlement management | verified | entitlement-management-overview |
| 17 | Catalog delegation: admins add any resource; non-admins only owned; co-owners, package managers | Catalogs | verified | entitlement-management-overview |
| 18 | Package manager, catalog reader, assignment manager roles | Catalogs | verified (added) | entitlement-management-delegate-managers |
| 19 | Can't move a package between catalogs | Catalogs | verified (added) | entitlement-management-access-package-create |
| 20 | Built-in `General` catalog | Catalogs | verified (added) | accessPackageCatalog resource type |
| 21 | Package resource types; group-based licensing and Azure roles via groups | Access packages | verified | entitlement-management-overview |
| 22 | PIM for Groups eligibility and Entra roles (preview) in packages need Governance | Access packages | verified (added) | licensing-fundamentals |
| 23 | Every package needs at least one policy | Policies | verified | approval-policy page |
| 24 | Multiple policies per package (employees vs guests) | Policies | verified | incompatible (SoD) page intro |
| 25 | 1–3 stages; one approver per stage; deny/no decision ends request; fallback for manager; can't self-approve; decision deadline auto-denies; alternate approvers ≥1 day, timeout ≥4 days; justification; questions | Policies | verified (added) | entitlement-management-access-package-approval-policy |
| 26 | Approval chain by tier | Policies | restated-as-design (source had Tier 1 "App Owner + IGO notification"; program makes IGO an approval stage) | program design |
| 27 | Microsoft's three-stage pattern for confidential resources | Policies | verified | approval-policy page |
| 28 | Expiry options; 0–3660 days; extension emails 14 days and 1 day; extension approval; policy change doesn't alter pending/approved | Expiration | verified (added) | entitlement-management-access-package-lifecycle-policy |
| 29 | Expiry defaults by package type | Expiration | restated-as-design | program design |
| 30 | External packages ≤365 days; packages without expiry need reviews | Expiration | verified (added) | 6-secure-access-entitlement-managment |
| 31 | SoD incompatible packages/groups; blocks admin assignment; one-way; AD groups; P2 | SoD | verified (added) | entitlement-management-access-package-incompatible |
| 32 | Override via combined package; download existing incompatible; Graph additional access; app role assignment workbook | SoD | verified (added) | incompatible page |
| 33 | Auto-assignment by attributes, Governance | Automatic assignment | verified (added) | overview; licensing-fundamentals |
| 34 | `memberOf` preview caution | Automatic assignment | linked to Book 02 (already verified there) | Book 02 Ch 10 |
| 35 | Review snapshot at start | Access reviews | verified (added) | create-access-review |
| 36 | Reviewable targets and license notes | What can be reviewed | verified (added) | create-access-review; licensing-fundamentals |
| 37 | All-M365-groups-with-guests: guests only, excludes dynamic and role-assignable groups; inactive scope up to 730 days, recently created users excluded | What can be reviewed | verified (added) | create-access-review |
| 38 | Application review doesn't remove members of assigned groups | What can be reviewed | verified (added) | access-reviews-faqs |
| 39 | Reviewer types; fallback for manager/owner; PIM for Groups fallback mandatory, active owners only; owners fixed at start | Reviewers | verified (added) | create-access-review |
| 40 | Multi-stage reviews: 2–3 stages, reviewee progression, reveal prior decisions | Reviewers | verified (added) | create-access-review |
| 41 | Recurrence ≥ duration; weekly max 7 days; monthly/quarterly/semiannual/annual | Cadence | verified | create-access-review; 6-secure-access-entitlement-managment |
| 42 | Quarterly or more for external packages | Cadence | verified (added) | 6-secure-access-entitlement-managment |
| 43 | Review schedule by target (Tier 1 quarterly, Tier 2 semiannual Jan/Jul, Tier 3 annual Jan) | Cadence | restated-as-design (source tier cadence kept; see editor note) | source policy |
| 44 | Auto-apply; no-response options; Microsoft warning on remove + auto-apply | Upon completion | verified (added) | create-access-review |
| 45 | Denied guests: remove membership or block 30 days then delete | Upon completion | verified (added) | create-access-review |
| 46 | Decision helpers (30-day sign-in; user-to-group affiliation); ML needs Governance | Upon completion | verified (added) | create-access-review; licensing-fundamentals |
| 47 | Justification required; reminders at midpoint | Upon completion | verified (added) | create-access-review |
| 48 | Privileged reviews: no bulk approval | Upon completion | restated-as-design (source: "privileged-access campaigns exclude bulk approval entirely" — the service can't enforce it; restated as a rule plus a detective check) | program design |
| 49 | Manual review procedure (10 business days, 5 business days) | Manual to service | restated-as-design | source policy |
| 50 | LCW triggers: time-based, attribute change, group membership change, sign-in inactivity; on-demand | LCW | verified | lifecycle-workflow-execution-conditions |
| 51 | Access-related built-in tasks and categories | LCW | verified (added) | lifecycle-workflow-tasks |
| 52 | Employee job profile change template; remove-all-assignments scheduled removal defaults to 15 days | LCW | verified (added) | lifecycle-workflow-templates |
| 53 | Inactive-user templates key on `lastSuccessfulSignInDateTime`; 90 and 120 days | LCW | verified (added) | lifecycle-workflow-templates |
| 54 | 50 workflows, 100 custom task extensions | LCW | verified (added) | licensing-fundamentals |
| 55 | Mover = re-derivation plus residual review; the leaver SLA matters most | LCW | restated-as-design | Vol IX Book 06 Honest Limits |
| 56 | Package request from connected org creates guest; allow/block lists apply | Guests | verified (added) | entitlement-management-external-users |
| 57 | Default: block on last assignment loss, remove after 30 days; configurable; 0 = immediate; blocked can't re-request | Guests | verified (added) | entitlement-management-external-users |
| 58 | Only EM-invited or governed guests; ungoverned stay indefinitely | Guests | verified (added) | entitlement-management-access-package-manage-lifecycle |
| 59 | Unaccepted guest reviewers get no email | Guests | verified (added) | create-access-review |
| 60 | Guest lifecycle policies (preview): defaults and ranges | Guests | verified (added) | guest-lifecycle-policies (search result) |
| 61 | Review results CSV; recurring history; Graph decisions; cmdlet; page size 100 | Evidence | verified (added) | complete-access-review |
| 62 | Review history report content; downloadable 30 days | Evidence | verified (added) | access-reviews-downloadable-review-history |
| 63 | Access review audit activities | Evidence | verified (added) | deploy-access-reviews |
| 64 | EntitlementManagement audit category and activities; current-state reports | Evidence | verified (added) | entitlement-management-reports |
| 65 | Native retention "30 days (free) / 90 days (P1/P2)" | Retention | corrected: 7 days Free, 30 days P1/P2 for audit and sign-in | reference-reports-data-retention |
| 66 | Upgrading doesn't recover older data | Retention | verified (added) | reference-reports-data-retention |
| 67 | Program retention requirements (1 year; 3 years consent/break-glass; ITSM 3/7 years; registry snapshots) | Retention | restated-as-design | source policy |
| 68 | SIEM forwarding health quarterly; gap = incident reported within 24 hours | Retention | restated-as-design | source policy |
| 69 | Governance-specific alerts | Governance alerts | restated-as-design | program design |
| 70 | Exception approval authority (Tier 3: IGO; Tier 1/2: IGO + CISO); quarterly register review | Exceptions | restated-as-design | source policy |
| 71 | Vol IX Book 06: OMB M-26-14 as AU-2 authority driver | — | removed (not verified; not needed) | — |
| 72 | Vol IX Book 06: "Phase 2 gates", "HRIT Org SSOT", kit Draft v0.9 | — | removed (program-internal project status, not chapter content; linked to the compliance book) | — |

## Editor note

Book 02 Chapter 10's access review table lists "Application assignments (Tier 1 apps) — Semi-annually." The Help Desk
governance guide (this chapter's source) sets Tier 1 quarterly, Tier 2 semiannual, Tier 3 annual. This chapter follows the
guide's tiered cadence and says it refines Book 02's schedule by tier; Book 02's Tier 1 row should be aligned to
quarterly (or this chapter changed) so the two books agree.

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Vol IX Book 06 — banner, draft notice, series context | — | Page furniture and internal review status; not chapter content |
| Vol IX Book 06 — Phase 2 gates | — | Internal kit-delivery status; the compliance book stays in place and is linked from Ch 10 |
| Vol IX Book 06 — What This Document Addresses (JML, campaigns, IAM evidence) | Ch 09 opening (three mechanisms); Ch 09 evidence; Ch 10 control mapping | — |
| Vol IX Book 06 — Configuration Is Not Compliance | Ch 09 opening paragraph | Restated; AC-2(5) attribution corrected |
| Vol IX Book 06 — The Governance Loop table | Ch 09 opening; Ch 10 control mapping (AC-2, AC-5, AC-6, AU-2) | — |
| Vol IX Book 06 — truth planes do not move | Ch 09 LCW section (Book 03 owns the HR record) | IPAM/CMDB detail out of scope |
| Vol IX Book 06 — Governance, Not Requests (Book 01 seam) | Ch 09 opening ("the seam with the request queue") | — |
| Vol IX Book 06 — Closure Necessity | Ch 09 opening; Ch 10 opening | Restated |
| Vol IX Book 06 — Authorities Closed Here table | Ch 10 control mapping | Generated spine table not reproduced; linked |
| Vol IX Book 06 — Honest Limits | Ch 09 (bulk approval; mover; attribute quality); Ch 10 Honest limits | Kit-gating bullet dropped (internal status) |
| Vol IX Book 06 — Cross-References, Provenance | Ch 10 links to Vol IX Book 06, Vol VII Book 04 | Provenance is page furniture |
| Help Desk guide — Purpose, scope, authority; Definitions; Roles and RACI | — | Another writer (approval model / who decides, Ch 06) |
| Help Desk guide — Application risk classification framework (Tiers 1–3, matrix, reclassification) | Ch 09 uses tier review cadence and approver rows; tier definitions linked to Ch 06 | Tier definitions belong to Ch 05/06 writers |
| Help Desk guide — Application ownership model | — | Another writer (Ch 05/06) |
| Help Desk guide — Access request and approval workflows A, B, C | Ch 09 approval-chain table (Workflow A approvers by tier, as packages) | Workflow mechanics, admin consent (B) and break-glass (C) belong to other writers |
| Help Desk guide — Group-based access governance model: mandate, naming, lifecycle, nested groups, dynamic vs assigned, SoD three-party, reference table | Ch 09 "The group-based substrate" (all subsections) | Group creation/population via ticket restated as packages; nested-group claim verified and extended |
| Help Desk guide — Admin Consent governance | — | Another writer (Ch 05) |
| Help Desk guide — ServiceNow integration model | — | Another writer; ITSM ticket retention kept in Ch 09 retention table |
| Help Desk guide — Audit log retention requirements | Ch 09 retention | Native retention corrected |
| Help Desk guide — Mandatory audit events | Ch 09 evidence (access review and entitlement audit records); Ch 10 AC-2(4) | Consent/app events belong to Ch 05 |
| Help Desk guide — Scheduled access reviews (quarterly, semiannual, annual, admin consent annual) | Ch 09 cadence table; "From a manual procedure to the service" | Admin consent annual review belongs to Ch 05 |
| Help Desk guide — Annual governance review | — | Program-management cadence for the governance office; Ch 06 (who decides) owns it |
| Help Desk guide — Required SIEM alerts | Ch 09 governance alerts (new access-specific alerts); others linked to Book 02 Ch 10 and Ch 05 | Consent/app alerts belong to Ch 05 |
| Help Desk guide — Compliance mapping table | Ch 10 control mapping | Consolidated |
| Help Desk guide — Policy exceptions and waivers | Ch 09 "Exceptions" (approval authority, register) | Exception request process detail belongs to Ch 06 |
| Help Desk guide — Document control and governance | — | Page furniture |
| Help Desk guide — ServiceNow automation alignment | — | Another writer (ITSM integration) |

## Revision 2026-10-21 — review fixes

Applied from the verified review of Books 02–05. Sources were opened again on Oct 21, 2026.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| R1 | Privileged-role review cadence aligned across Books 02 and 04: Tier 0 monthly, other privileged roles quarterly, never self-review alone. The cadence is the program's design; AC-2(j) and AC-6(7) leave the frequency organization-defined; PIM role and privileged-group rows split into Tier 0 (monthly) and others (quarterly); "plus self-attestation" removed | Cadence table | corrected | c09-fedramp-ac <https://fedramp.gov/2026/reference/controls/access-control/>; c09-pim-review <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-create-roles-and-resource-roles-review#create-access-reviews> |
| R2 | Retention paragraph states current values directly | Retention | restated | c09-retention (unchanged) |

### Revision history moved out of the chapter body

The body now states the guidance directly. These were the earlier positions it used to narrate:

- The program's older guidance put native Entra retention at 30 days for Free and 90 days for P1 and P2.
