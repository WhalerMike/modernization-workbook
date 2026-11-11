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

## Additions, October 23, 2026 (federal framework crosswalk follow-up)

Every claim was checked against the primary source on October 23, 2026. Sources: research briefs on investment and acquisition, and on service, accessibility and records (program working files).

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Section 508: comparable access for federal employees | Request portal and 508 | verified (quoted) | 29 U.S.C. §794d(a)(1)(A)(i) |
| 2 | Revised 508 Standards scope E201.1; WCAG 2.0 A and AA (E207.2); best meets with written market research (E202.7, E202.7.1) | Request portal and 508 | verified | 36 CFR 1194 App. A |
| 3 | Validate vendor conformance documentation before purchase and after change | Request portal and 508 | verified | OMB M-24-08 §III.B |
| 4 | Test the whole flow with assistive technology; record the ACR | Request portal and 508 | restated-as-design | — |

## Privacy section, November 2, 2026

A short "Privacy" section was added (additive; no existing text changed). Every source was opened on November 2, 2026. SP 800-53 control titles and privacy-baseline membership were read from NIST's OSCAL Release 5.2.0 catalog and privacy baseline profile; the SP 800-53B abstract states the privacy baseline applies irrespective of impact level. The "Who signs off" column and every "program's design" sentence are design guidance, not external fact. The fuller treatment is Book 03, Chapter 14, whose verification file logs the same sources in more detail.

| # | Claim (short) | Verdict | Source |
|---|---|---|---|
| 1 | Disclosure to employees who need the record is permitted; records used in decisions must be accurate enough for fairness | verified | 5 U.S.C. §552a(b)(1), (e)(5) |
| 2 | Minimization principle | verified | A-130 Appendix II §3 |
| 3 | PT-3, SI-12, SI-12(1), SI-18 titles; in the privacy baseline at every impact level | verified | OSCAL catalog and privacy profile 5.2.0; SP 800-53B abstract |
| 4 | Review history and request records are system access records under GRS 3.2 | verified | GRS 3.2 items 030, 031 |
| 5 | Guests and connected organizations are outside the government, relevant to the PIA | restated-as-design | - |
| 6 | Obligations table | restated-as-design | - |

## Additions, November 2, 2026 (Section 508 follow-up)

Opened November 2, 2026: Microsoft Learn, "Change approval and requestor information settings for an access package in entitlement management" and "Create an access package in entitlement management" (MCP search), section on requestor questions.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 5 | Access package policies can ask requestor questions: short text, long text or multiple choice; required or optional; optional regex pattern check on text answers | Request portal and 508 | verified | Learn, requestor information settings |
| 6 | Each question states the expected answer and its format | Request portal and 508 | restated-as-design | — |
| 7 | Book 18 Ch 06 sets the test method and the form rules | Request portal and 508 | cross-reference; sources logged in Book 18's Chapter 06 verification file | — |

## Revision 2026-11-08 — consistency read before the baseline edition

| # | Claim | Where | Verdict | Source |
|---|---|---|---|---|
| C1 | memberOf operator preview ended Nov 3, 2026; rules that use it stopped updating | §Automatic assignment | corrected (Old: "time-sensitive caution ... preview". New: past tense) | Book 02 Chapter 09 §Dynamic group rule syntax; Microsoft Learn memberOf page |

## Learn coverage pass, November 9, 2026

Citations added from the Learn coverage map (covered-uncited pages). No content removed or changed in meaning. Pages were read with the Microsoft Learn MCP search (excerpts) or fetch on Nov 9, 2026.

| Learn page | Where cited | Date read | Supports |
|---|---|---|---|
| [Request an access package](https://learn.microsoft.com/entra/id-governance/entitlement-management-request-access) | Intro, mechanism 1 | Nov 9, 2026 | users request access packages in My Access |
| [What is the My Access portal?](https://learn.microsoft.com/entra/id-governance/my-access-portal-overview) | Intro, mechanism 1 | Nov 9, 2026 | My Access is where requests, approvals and reviews happen |
| [Trigger Logic Apps with custom extensions](https://learn.microsoft.com/entra/id-governance/entitlement-management-logic-apps-integration) | Licensing table | Nov 9, 2026 | custom extensions in access package workflow |
| [Externally determine approval requirements using custom extensions](https://learn.microsoft.com/entra/id-governance/entitlement-management-dynamic-approval) | Licensing table | Nov 9, 2026 | custom extensions used for approval |
| [Request access packages on-behalf-of other identities](https://learn.microsoft.com/entra/id-governance/entitlement-management-request-behalf) | Licensing table | Nov 9, 2026 | managers request on behalf of direct reports |
| [ID Governance licensing for guest users](https://learn.microsoft.com/entra/id-governance/microsoft-entra-id-governance-licensing-for-guest-users) | Licensing, guest bullet | Nov 9, 2026 | MAU billing for guests; linked Azure subscription |
| [Manage access to apps](https://learn.microsoft.com/entra/identity/enterprise-apps/what-is-access-management) | Group-based substrate | Nov 9, 2026 | group-based assignment needs P1/P2; nested groups not supported |
| [Understand how users are assigned to apps](https://learn.microsoft.com/entra/identity/enterprise-apps/ways-users-get-assigned-to-applications) | Group-based substrate | Nov 9, 2026 | assignment through groups |
| [Create and manage a catalog of resources](https://learn.microsoft.com/entra/id-governance/entitlement-management-catalog-create) | Catalogs and delegation | Nov 9, 2026 | catalog is a container; nonadministrator catalog owner and owned resources |
| [Delegate access governance to catalog creators](https://learn.microsoft.com/entra/id-governance/entitlement-management-delegate-catalog) | Catalogs and delegation | Nov 9, 2026 | catalog creators add resources they own |
| [Delegation and roles in entitlement management](https://learn.microsoft.com/entra/id-governance/entitlement-management-delegate) | Catalogs and delegation | Nov 9, 2026 | catalog owner, reader, access package manager, assignment manager rights |
| [Change resource roles for an access package](https://learn.microsoft.com/entra/id-governance/entitlement-management-access-package-resources) | Access packages | Nov 9, 2026 | group, Teams, application and site resource roles |
| [Using groups managed by PIM with access packages](https://learn.microsoft.com/entra/id-governance/entitlement-management-access-package-pim-reference) | Access packages | Nov 9, 2026 | eligible PIM for Groups membership through packages |
| [Manage the lifecycle of group-based licenses](https://learn.microsoft.com/entra/id-governance/entitlement-management-group-licenses) | Access packages | Nov 9, 2026 | licensed group as a package resource |
| [Assign Azure RBAC roles - Entitlement management](https://learn.microsoft.com/entra/id-governance/entitlement-management-azure-role-assignments) | Access packages | Nov 9, 2026 | Azure role assignments through packages |
| [Troubleshoot entitlement management](https://learn.microsoft.com/entra/id-governance/entitlement-management-troubleshoot) | Policies, approval bullets | Nov 9, 2026 | a user can't approve their own request |
| [Request process & notifications](https://learn.microsoft.com/entra/id-governance/entitlement-management-process) | Policies, approval bullets | Nov 9, 2026 | undecided request expires; user resubmits |
| [Approve or deny access requests](https://learn.microsoft.com/entra/id-governance/entitlement-management-request-approve) | Policies, approval bullets | Nov 9, 2026 | one approver per stage decides; request expires if none does |
| [Govern access with an organizational role model](https://learn.microsoft.com/entra/id-governance/identity-governance-organizational-roles) | Automatic assignment | Nov 9, 2026 | role model as packages with automatic assignment |
| [Manage user access with access reviews](https://learn.microsoft.com/entra/id-governance/manage-user-access-with-access-reviews) | Access reviews intro | Nov 9, 2026 | recurring review of user access |
| [Manage access with access reviews](https://learn.microsoft.com/entra/id-governance/manage-access-review) | Access reviews intro | Nov 9, 2026 | recurring review of user and guest access |
| [Review access of an access package](https://learn.microsoft.com/entra/id-governance/entitlement-management-access-reviews-review-access) | What can be reviewed table | Nov 9, 2026 | reviews of package assignments |
| [Self-review of an access package](https://learn.microsoft.com/entra/id-governance/entitlement-management-access-reviews-self-review) | What can be reviewed table | Nov 9, 2026 | self-review of package assignments |
| [Deploying policies for governing access to applications](https://learn.microsoft.com/entra/id-governance/identity-governance-applications-deploy) | What can be reviewed | Nov 9, 2026 | review the groups the application uses |
| [Complete an access review of Azure resource and Entra roles in PIM](https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-complete-roles-and-resource-roles-review) | What can be reviewed | Nov 9, 2026 | privileged-role reviews run in PIM |
| [Review your access to groups & apps](https://learn.microsoft.com/entra/id-governance/review-your-access) | Reviewers and fallback reviewers | Nov 9, 2026 | self-review |
| [Review your access to resources](https://learn.microsoft.com/entra/id-governance/self-access-review) | Reviewers and fallback reviewers | Nov 9, 2026 | self-review |
| [Using multi-stage reviews](https://learn.microsoft.com/entra/id-governance/using-multi-stage-reviews) | Reviewers and fallback reviewers | Nov 9, 2026 | up to three stages; reviewees to next stage; show earlier decisions |
| [Manage users excluded from Conditional Access policies](https://learn.microsoft.com/entra/id-governance/conditional-access-exclusion) | Cadence table, CA-Exclude row | Nov 9, 2026 | access reviews of CA exclusion groups |
| [Review recommendations for Access reviews](https://learn.microsoft.com/entra/id-governance/review-recommendations-access-reviews) | Upon completion, decision helpers | Nov 9, 2026 | 30-day inactivity and user-to-group affiliation recommendations |
| [Manage guest access with access reviews](https://learn.microsoft.com/entra/id-governance/manage-guest-access-with-access-reviews) | Upon completion, guest reviews | Nov 9, 2026 | block 30 days then remove denied guests |
| [Review and remove external users](https://learn.microsoft.com/entra/id-governance/access-reviews-external-users) | Upon completion, guest reviews | Nov 9, 2026 | disable and delete external identities after 30 days |
| [Review access to groups & applications](https://learn.microsoft.com/entra/id-governance/perform-access-review) | Manual procedure table | Nov 9, 2026 | reviewers decide in My Access; accept recommendations |
| [Manage inactive users using Lifecycle Workflows](https://learn.microsoft.com/entra/id-governance/lifecycle-workflow-inactive-users) | Lifecycle Workflows, inactivity | Nov 9, 2026 | sign-in inactivity trigger on lastSuccessfulSignInDateTime |
| [How to manage inactive user accounts](https://learn.microsoft.com/entra/identity/monitoring-health/howto-manage-inactive-user-accounts) | Lifecycle Workflows, inactivity | Nov 9, 2026 | lastSuccessfulSignInDateTime for inactive accounts |
| [Allow or block invitations](https://learn.microsoft.com/entra/external-id/allow-deny-list) | Guest access governance | Nov 9, 2026 | B2B allow and block lists |
| [Deployment guide to govern guest and partner access](https://learn.microsoft.com/entra/architecture/governance-deployment-guest-access) | Guest access governance | Nov 9, 2026 | onboard external users through packages and connected organizations |
| [Plan new governance scenarios for business partners](https://learn.microsoft.com/entra/id-governance/scenarios/govern-guest-lifecycle-new-project) | Guest access governance | Nov 9, 2026 | package policy with approval, reviews and expiry for partners |
| [Add sponsors to a guest user](https://learn.microsoft.com/entra/external-id/b2b-sponsors) | Guest access governance | Nov 9, 2026 | sponsor field on guest users |
| [Manage sponsored guests in My Account](https://learn.microsoft.com/entra/id-governance/manage-sponsored-guests-my-access) | Guest access governance | Nov 9, 2026 | sponsor attestation under guest lifecycle policies (preview) |
| [Manage unsponsored guests using Lifecycle Workflows](https://learn.microsoft.com/entra/id-governance/how-to-lifecycle-workflow-unsponsored-guest-removal) | Guest access governance | Nov 9, 2026 | unsponsored guest cleanup (preview) |
| [Monitor and clean up stale guest accounts](https://learn.microsoft.com/entra/identity/users/clean-up-stale-guest-accounts) | Guest access governance | Nov 9, 2026 | inactive guest review and removal |
| [Govern access for applications in your environment](https://learn.microsoft.com/entra/id-governance/identity-governance-applications-prepare) | Retention | Nov 9, 2026 | audit events kept up to 30 days; send to Azure Monitor |
| [ID Governance operations reference guide](https://learn.microsoft.com/entra/architecture/ops-guide-govern) | Governance alerts | Nov 9, 2026 | archive audit logs in the SIEM; owners of key tasks |
| [Deployment guide to assign employee access](https://learn.microsoft.com/entra/architecture/governance-deployment-employee-access) | Records Entra ID produces | Nov 9, 2026 | downloadable review history reports |

## Additions, November 9, 2026 (Learn gaps)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| A1 | ID Protection-based approvals (preview): user risk level vs admin threshold adds a first stage routed to Security Administrator | Policies, risk-based approval stages | verified | [Learn](https://learn.microsoft.com/entra/id-governance/entitlement-management-configure-id-protection-approvals) |
| A2 | Insider Risk Management-based approvals (preview): Purview risk level adds a first stage routed to Compliance Administrator; needs Purview licensing and an IRM policy | Policies, risk-based approval stages | verified | [Learn](https://learn.microsoft.com/entra/id-governance/entitlement-management-configure-insider-risk-management-approvals) |
| A3 | Both on: ID Protection approver, then Insider Risk approver, then policy approvers; denial closes request; actions audited; Governance or Suite license | Policies, risk-based approval stages | verified | both pages above |
| A4 | Government-cloud availability of risk-based approvals | Policies, risk-based approval stages | not yet specified (neither page states it) | — |
| A5 | Program evaluates for R1 packages at GA | Policies, risk-based approval stages | design position | — |
| A6 | My Access delegation (preview): delegate answers approvals and multi-resource reviews; admin restrictions (manager, groups, unrestricted, max duration); direct assignments only, after-set items only, one level; original approver can still respond; Governance or Suite license | Policies, approval delegation | verified | [Learn](https://learn.microsoft.com/entra/id-governance/delegate-approvals-my-access) |
| A7 | Government-cloud availability of approval delegation | Policies, approval delegation | not yet specified | — |
| A8 | Delegates limited to backup-owner group, 30-day cap | Policies, approval delegation | design position | — |
| A9 | Quarantine unsanctioned tenants: inventory first, reversible friction, cross-tenant access settings, TRv2 with Global Secure Access, multitenant app service principals, subscription cancellation; license per lever; HTTP query by appOwnerOrganizationId | Tenant hygiene, unsanctioned tenants | verified | [Learn](https://learn.microsoft.com/entra/fundamentals/quarantine-unsanctioned-tenants) |
| A10 | Quarantine decided by governance office and recorded with partner tenant list | Tenant hygiene, unsanctioned tenants | design position | — |
| A11 | M365 group expiration: one policy, 30+ days, All/Selected (500)/None, activity auto-renew ~35 days before, owner emails 30/15/1 days, deletion one day after expiry, 30-day restore not customizable, P1/P2 for members, Groups Administrator or User Administrator | Tenant hygiene, expiration | verified | [Learn](https://learn.microsoft.com/entra/identity/users/groups-lifecycle) |
| A12 | Get-MgGroupLifecyclePolicy with Directory.Read.All (read-only) | Tenant hygiene, expiration | verified (cmdlet permissions table lists Directory.Read.All as least privileged; Learn's example connects with Directory.ReadWrite.All because it also writes) | [Learn cmdlet](https://learn.microsoft.com/powershell/module/microsoft.graph.groups/get-mggrouplifecyclepolicy?view=graph-powershell-1.0) |
| A13 | Naming policy: prefix-suffix and up to 5,000 blocked words; M365 groups only, not distribution groups; Global Administrator and User Administrator exempt; view with Get-MgBetaDirectorySetting Group.Unified | Tenant hygiene, naming | verified | [Learn](https://learn.microsoft.com/entra/identity/users/groups-naming-policy) |
| A14 | Naming policy license: P1 for each unique member (guests included) of M365 groups | Tenant hygiene, naming | verified | [Learn M365](https://learn.microsoft.com/microsoft-365/enterprise/groups-naming-policy) |
| A15 | Connect scope Directory.Read.All for the view commands | Tenant hygiene, naming | restated: Learn's example uses Directory.ReadWrite.All because it then updates; read-only scope chosen for a view-only step | — |
| A16 | A tenant with no Group.Unified settings object has no naming policy configured | Tenant hygiene, naming | inference from Learn's instruction to create group settings first | [Learn](https://learn.microsoft.com/entra/identity/users/groups-naming-policy) |
| A17 | Naming policy can't enforce the APP- convention on security groups | Tenant hygiene, naming | design position (follows from M365-groups-only scope) | — |
| A18 | Restore: M365 and cloud security groups 30 days; security group soft delete preview, public clouds only; Groups Administrator; owners; list with Get-MgBetaDirectoryDeletedGroup | Tenant hygiene, restore | verified | [Learn](https://learn.microsoft.com/entra/identity/users/groups-restore-deleted) |
| A19 | Restoring role-assignable groups needs Privileged Role Administrator | Tenant hygiene, restore | verified | [Learn cmdlet](https://learn.microsoft.com/powershell/module/microsoft.entra.directorymanagement/restore-entradeleteddirectoryobject?view=entra-powershell) |
| A20 | Listing with Group.Read.All | Tenant hygiene, restore | restated: Learn connects with Group.ReadWrite.All for the restore; listing scope narrowed | — |
| A21 | Restored dynamic group repopulated, up to 24 hours | Tenant hygiene, restore | verified | [Learn](https://learn.microsoft.com/entra/identity/users/groups-lifecycle) |
| A22 | Advanced group management (dynamic groups, naming policies, expiration) available in Azure Government; GCC pairs with Entra ID in commercial Azure, GCC High and DoD with Azure Government | Tenant hygiene, government cloud | verified | [Entra feature availability](https://learn.microsoft.com/entra/identity/authentication/feature-availability); [Azure feature availability](https://learn.microsoft.com/azure/security/fundamentals/feature-availability) |
| A23 | Government-cloud availability for quarantine levers and M365 group restore | Tenant hygiene | not yet specified | — |

## Additions, November 11, 2026 (Zero Trust Assessment closure, B04-08)

New subsection "Tenant creation" under Tenant hygiene.

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| Z1 | By default users can create tenants and become Global Administrator; shadow identity platform; restrict, assign Tenant Creator, review Create Company events | Tenant creation | verified | https://learn.microsoft.com/entra/fundamentals/zero-trust-protect-tenants | Nov 11, 2026 |
| Z2 | Setting Yes restricts creation to Tenant Creator; audit category DirectoryManagement, activity Create Company; creator becomes Global Administrator; new tenant inherits no settings | Same | verified | https://learn.microsoft.com/entra/fundamentals/users-default-permissions | Nov 11, 2026 |
| Z3 | Graph property allowedToCreateTenants; false means the restriction is on; Tenant Creator can still create | Same, Enforcement | verified | https://learn.microsoft.com/graph/api/resources/defaultuserrolepermissions?view=graph-rest-1.0 | Nov 11, 2026 |
| Z4 | Update permission Policy.ReadWrite.Authorization | Prerequisites | verified | https://learn.microsoft.com/graph/api/authorizationpolicy-update?view=graph-rest-1.0 | Nov 11, 2026 |
| Z5 | Governed workforce tenant flow requires Tenant Creator; default template sets the governance relationship | Workflow | verified | https://learn.microsoft.com/entra/id-governance/tenant-governance/how-to-create-tenant | Nov 11, 2026 |
| Z6 | Government-cloud availability of the setting and the Tenant Creator role | Applies | not yet specified | not stated on Learn | Nov 11, 2026 |
| Z7 | Tenant Creator eligible in PIM at Tier 2 with approval; request fields; inventory | Workflow | restated-as-design | program position | Nov 11, 2026 |
