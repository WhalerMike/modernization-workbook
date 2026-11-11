---
title: "Chapter 09 — Access Governance: Packages, Reviews and Lifecycle"
description: "How the program grants, re-confirms, and removes access over time: entitlement management catalogs, access packages and policies, access reviews, Lifecycle Workflows access tasks, guest access governance, and the evidence each produces."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b04-access
book: B04
part: How
series-order: 9
status: baseline
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Chapter 09 — Access Governance: Packages, Reviews and Lifecycle

*A grant that nobody ever re-confirms is a decision made once and trusted forever; governance is what makes every grant expire, get re-decided, or get removed.*

::: {.callout-note}
## In this chapter
How access is requested and granted through entitlement management (catalogs, access packages, policies, approval stages, separation of duties, and expiration), how it is re-confirmed through access reviews (scope, reviewers, cadence, auto-apply, and fallback reviewers), how Lifecycle Workflows act on access when a person's job changes, how guest access is governed from invitation to removal, and what evidence each of these leaves for an assessor.
:::

A well-configured tenant can still fail an account-management audit. Conditional Access ([Chapter 07](07-the-conditional-access-policy-library.md)) decides whether a session may proceed, and PIM ([Chapter 08](08-pim-self-request-with-approval.md)) decides whether a privileged role may be active. Neither decides whether a person should still hold the access they were given last year. NIST SP 800-53 keeps those questions in separate requirements: AC-2 requires the organization to review accounts for compliance with account-management requirements at a defined frequency and to align account management with personnel termination and transfer processes, and AC-6(7) requires a periodic review of the privileges assigned to roles and classes of users, with reassignment or removal where needed.[^c09-fedramp-ac] A tenant with perfect policies and no reviews has automated its grants and abandoned the reviews.

The program closes that gap with three mechanisms that run without anyone opening a ticket:

1. **Requests through access packages.** People ask for a bundle of access, named approvers decide, and the assignment carries an expiry from the moment it is granted.[^c09-em-request]
2. **Reviews on a calendar.** Owners, managers, or sponsors re-confirm each grant at a cadence set by its risk, and denied access is removed automatically.
3. **Lifecycle events.** When the HR record says someone moved or left, Lifecycle Workflows remove the old access and request the new. The HR-driven lifecycle itself, from attributes to joiner, mover, and leaver design, belongs to [Book 03](../b03-hr-identity/index.md); this chapter covers only the access tasks.

The seam with the request queue is simple. Tickets govern things people ask for. This chapter governs grants that expire, decisions that recur, and changes that follow an event. [Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md#identity-governance-and-lifecycle) introduced the loop during the migration; this chapter is the operating detail.

![An access package lives in a catalog, bundles resource roles, and is governed by policies that set who can request, who approves, and when the assignment expires; reviews and expiry remove what is no longer justified.](../../images/diagrams/b04-access/svg/ch09-access-package-anatomy.svg){#fig-ch09-access-package-anatomy fig-alt="Left to right. A violet box, catalog, owned by a catalog owner, contains resources the owner added. It feeds a blue box, access package, which bundles resource roles: group membership, application role, SharePoint site role. The package feeds a blue box, assignment policy, listing who can request, approval stages one to three, requestor questions, expiration and extension, and separation-of-duties checks. The policy feeds a green box, assignment, with an expiry date. Two dashed violet arrows return from the assignment: one labeled access review, deny removes; one labeled expiry removes."}

## Licensing: what needs Entra ID Governance

Book 02 sets out the license tiers ([Chapter 09](../b02-identity/09-building-the-entra-target.md#licensing-for-governance-features)); the access-governance specifics are below. As of October 2026, Microsoft licenses entitlement management and access reviews by Microsoft Entra ID Governance for the member users involved, including everyone who reviews access or has their access reviewed, while some capabilities that were generally available in P2 still operate under P2.[^c09-licensing] Microsoft has also said it will add no new identity governance features to the P2 SKU, so anything newer than the original P2 feature set is a Governance feature.[^c09-licensing]

| Capability | P2 | Entra ID Governance |
|---|---|---|
| Access packages with groups, applications, and SharePoint sites; self-request; admin direct assignment | Yes | Yes |
| Multi-stage approval with alternate approvers; manager, sponsor, and specific approvers | Yes | Yes |
| Assignment expiration; separation-of-duties checks | Yes | Yes |
| Automatic assignment policies; custom extensions[^c09-em-extensions]; managers requesting on behalf of reports[^c09-em-behalf] | | Yes |
| PIM for Groups eligibility and Entra roles (preview) as access package resources | | Yes |
| Marking existing guests as governed | | Yes |
| Access reviews of groups, applications, and roles (the original P2 set) | Yes | Yes |
| Reviews scoped only to inactive users; machine-learning recommendations; reviews of PIM for Groups (preview) | | Yes |
| Lifecycle Workflows, including custom task extensions | | Yes |
| Inactive guest account insights | | Yes |

The table summarizes Microsoft's feature-by-license reference.[^c09-licensing] Three licensing facts shape the design:

- Users don't need a Governance license assigned to them, but the tenant needs enough licenses to cover every member user in scope of, or configuring, the governance features.[^c09-licensing]
- Guests are billed differently: Governance uses monthly-active-user billing for guests, which requires an Azure subscription linked for guest billing.[^c09-licensing][^c09-guest-billing]
- Microsoft Entra ID Governance for Government, and a Governance add-on for P2 for Government, are available in GCC, GCC High, and DoD.[^c09-licensing]

Plan on Governance licensing for the whole workforce. Partial licensing produces a governance program that covers some people and leaves the rest ungoverned.

## The group-based substrate

Access packages and reviews work best when the thing being granted is a group. The program's rule is that user access to enterprise applications is assigned through security groups, never to individual users directly. That rule is a design position, and it does three jobs: reviews run against group membership instead of scattered assignments, onboarding and offboarding become membership changes, and the policy (who is in the group) stays separate from the enforcement (the group's assignment to the application).

Two platform facts back the rule. Group-based assignment to applications requires Entra ID P1 or P2, and nested group memberships aren't supported for it: when a group is assigned to an application, only its direct members get access.[^c09-group-assign][^c09-app-access] An access review of a group, on the other hand, flattens nested groups and shows their users individually, but a denied user is removed only from direct membership, not from the nested group that gave them access.[^c09-create-review] Nesting therefore creates access that reviews can see but can't remove. The program prohibits nested groups in application access assignments, and any nesting found during a review is remediated as a finding.

### Naming and membership type

Every application access group follows one naming convention, `APP-<AppShortName>-<AccessRole>-<RiskTier>`, so that the group's purpose and the application's risk tier can be read from the name:

| Token | Meaning | Example |
|---|---|---|
| `APP` | Fixed prefix for application access groups | `APP` |
| `<AppShortName>` | The application's short name in the application registry (no spaces) | `PAYROLL`, `HRPORTAL` |
| `<AccessRole>` | The role the group grants in the application | `USERS`, `ADMINS`, `READONLY` |
| `<RiskTier>` | The application's risk tier ([Chapter 06](06-who-decides-access.md#risk-tiers-set-the-approval-chain)), written `R1`, `R2` or `R3` so it can't be read as a privilege tier | `R1`, `R2`, `R3` |

So `APP-PAYROLL-ADMINS-R1` is the administrators of an R1 (highest application risk tier) payroll application. Names that don't follow the convention are flagged during reviews and corrected.

Membership type follows the tier:

| Membership type | Appropriate when | Not appropriate when | Tier rule |
|---|---|---|---|
| Dynamic (rule on user attributes) | Broad role-based access that matches attributes the HR feed keeps accurate | Each member needs individual approval, or the attributes aren't reliably maintained | R3 preferred; R2 only with governance-office approval; never R1 |
| Assigned (members added through approved requests or access packages) | Individual approval of each grant; small or specialized populations | Very large populations with reliable attributes | Required for R1 and R2; acceptable for R3 |

A dynamic group is only as good as the attributes behind it. The attribute standard and the HR feed that maintains it are [Book 03](../b03-hr-identity/index.md)'s subject; here the rule is that the application owner validates the membership rule at every review, and a change to a rule is an access change that goes through change control ([Chapter 10](10-access-as-code-and-evidence.md)).

### Three parties, three duties

To keep any one person from both deciding and doing, each access group has three distinct roles:

| Role | Duty | May also be | May not be |
|---|---|---|---|
| Group owner | Accountable for membership accuracy; reviews membership | The application owner | The person who created the group or executes changes to it |
| Group creator | Creates the group in Entra ID from an approved request | A help desk operator (for other groups) | Owner of a group they created, or owner of its application |
| Application owner | Authorizes grants and the group's assignment to the application | Owner of the application's access groups | The operator who executes changes to their own application's groups |

Who holds these roles, and how the decision rights are allocated, is [Chapter 06](06-who-decides-access.md)'s subject. The NIST hook is AC-5, which requires the organization to identify and document duties of individuals and define access authorizations to support separation of duties.[^c09-fedramp-ac]

| Group class | Owner | Review cadence | Nesting | Changes need PIM |
|---|---|---|---|---|
| Assigned, R1 application access | Application owner | Quarterly | No | Yes |
| Assigned, R2 application access | Application owner | Semiannual | No | Yes |
| Assigned, R3 application access | Application owner or department owner | Annual | No | Yes |
| Dynamic, R3, or R2 with approval | Application owner | Annual (rule validation) | No | Yes, for rule changes |
| Role-assignable privileged group (`PRV-*`) | Governance office or Privileged Role Administrator | Quarterly; `PRV-T0-*` monthly | No | An approved membership request; the member activates the role in PIM, not the group |

## Entitlement management

Entitlement management automates access requests, assignments, reviews, and expiration for groups, applications, and SharePoint Online sites, for both internal users and people outside the organization.[^c09-em-overview] Its three building blocks are catalogs, access packages, and policies.

### Catalogs and delegation

A catalog is a container of resources and the access packages built from them. Catalogs are how the program delegates: an administrator can add any resource to any catalog, but a non-administrator catalog owner can add only resources they own, and a catalog owner can make others co-owners or access package managers.[^c09-em-overview][^c09-em-catalog] Access package managers can create packages and policies inside the catalog but can't add resources; catalog readers have view-only access; access package assignment managers can change assignments but not packages or policies.[^c09-delegate][^c09-em-roles] An access package can't be moved to a different catalog after it is created, so choose the catalog first.[^c09-ap-create]

The program creates one catalog per business domain that owns resources (for example, finance applications, HR applications, collaboration sites), with the domain's business owner as catalog owner and application owners as access package managers. R1 resources go into catalogs whose owners are approved by the governance office. The `General` catalog, which entitlement management creates automatically, is not used for program resources.[^c09-catalog-resource]

### Access packages

An access package bundles resource roles: membership or ownership of security groups and Microsoft 365 groups (including Teams), assignment to enterprise applications and their app roles, and membership of SharePoint Online sites.[^c09-em-overview][^c09-ap-resources] With Entra ID Governance, a package can also grant eligible PIM for Groups membership, and Entra roles in preview.[^c09-licensing][^c09-ap-pim] Anything that keys on a security group comes along too: a group in a package can carry group-based licensing or an Azure role assignment.[^c09-em-overview][^c09-ap-licenses-azure]

The program uses the four package categories Book 02 defines (onboarding, department, project, and cross-tenant; see [Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md#entitlement-management-and-access-packages)), plus one rule from this book: privileged access arrives through PIM eligibility, never through a package that grants an active role ([Chapter 04](04-privileged-roles-and-tiers.md)).

### Policies: who may request, who approves, how long

Every package needs at least one assignment policy before anyone can be assigned.[^c09-approval] A policy states who may request (users in the directory, specific connected organizations, or administrator direct assignment only), who approves, and when the assignment ends.[^c09-em-overview] A package can carry several policies, for example one for employees and a second for partner users with a stricter approval chain.[^c09-sod]

Approval works like this as of October 2026:[^c09-approval]

- A policy can require one, two, or three approval stages. In each stage, one approver's decision is enough; a denial in any stage, or no decision, ends the request.
- Approvers can be specific users or groups, the requestor's manager, or an internal or external sponsor. If the manager is the first-stage approver, add a fallback approver for requestors with no manager in the directory.
- Approvers can't approve their own requests.[^c09-em-troubleshoot]
- Each stage has a decision deadline in days. A request that isn't decided in time is denied, and the user has to request again.[^c09-em-process]
- Alternate approvers receive a pending request on a forwarding schedule. Forwarding can start only a day after the request, and the request timeout must be at least four days to use it.
- The policy can require justification from the requestor and from approvers, and can ask the requestor custom questions whose answers approvers see.

The program's approval chains follow the application's risk tier, which [Chapter 06](06-who-decides-access.md#risk-tiers-set-the-approval-chain) defines along with the people behind each role. The chains below are design positions:

| Risk tier | Stage 1 | Stage 2 | Decision deadline per stage | Justification |
|---|---|---|---|---|
| R3 | Department owner (the requestor's manager, with a fallback approver) | | 7 days | Requestor |
| R2 | Application owner (alternate: backup application owner) | | 5 days | Requestor and approver |
| R1 | Application owner (alternate: backup application owner) | Identity governance office | 5 days | Requestor and approvers |

The program's earlier request procedure only notified the governance office of R1 grants. Making the office a second approval stage costs a few hours and leaves an approval record instead of an email. For resources more sensitive still, Microsoft describes a three-stage pattern: the manager confirms the business need, the resource owner confirms the access, and a security reviewer can reject on risk criteria the owner doesn't see.[^c09-approval]

**Risk-based approval stages.** Entitlement management can also add that security stage automatically, from risk signals, in preview as of November 2026. With ID Protection-based approvals, it reads the requestor's current user risk level from Microsoft Entra ID Protection, and if the level matches a threshold the administrator selected (for example Medium or High), it inserts a first approval stage routed to users in the Security Administrator role. Insider Risk Management-based approvals do the same with the user risk level from Microsoft Purview Insider Risk Management, routed to users in the Compliance Administrator role. When both are on, the request goes to the ID Protection approver first, then the Insider Risk approver, then the policy's own approvers. A denial at a risk stage closes the request, and every approval and denial is written to the entitlement management audit log.[^c09-em-idp-approvals][^c09-em-irm-approvals] Both need Microsoft Entra ID Governance or Microsoft Entra Suite licenses; the Insider Risk option also needs Purview licensing and an Insider Risk Management policy in place first.[^c09-em-idp-approvals][^c09-em-irm-approvals] Neither page states availability in GCC, GCC High or DoD, so government-cloud availability is not yet specified. As a design position, the program evaluates both in a test tenant and considers them for R1 packages once they reach general availability; until then the R1 chain above, with the governance office as a named stage, carries the security review.

**Approval delegation in My Access.** Also in preview, an approver can name a delegate in My Access who answers access package approval requests and multi-resource (catalog) access reviews on the approver's behalf, for a set period or with no end date. An Identity Governance Administrator turns the preview on under entitlement management's preview features and can restrict delegates to the user's direct manager, to members of named groups, or leave them unrestricted, and can cap how long a delegation lasts. The limits matter for an approval chain: delegation covers only approvals assigned to the approver directly, not through a group; it covers only items assigned after it is set; it is one level deep, so a delegate can't redelegate; and the original approver can still respond. It needs Microsoft Entra ID Governance or Microsoft Entra Suite licenses.[^c09-myaccess-delegate] Learn doesn't state government-cloud availability for it, so that is not yet specified. As a design position, the program restricts delegates to members of each application's backup-owner group and caps delegations at 30 days, so a delegated R1 or R2 approval still lands with someone the chain already names; the governance office stage is assigned through a group and isn't affected.

### Expiration and extension

On the policy's lifecycle tab, assignments expire on a fixed date, after a number of days (0 to 3660), after a number of hours, or never.[^c09-lifecycle] If the policy allows extension, the user gets an email 14 days and again one day before expiry, must still be in the policy's scope to extend, and can be required to get approval for the extension through the same approval settings.[^c09-lifecycle] Changing a policy's expiration doesn't change the expiry of requests already pending or approved.[^c09-lifecycle]

The program never uses "never." Its defaults, as design positions:

| Package type | Expiry | Extension |
|---|---|---|
| R1 application access | 90 days | Allowed, with approval |
| R2 application access | 180 days | Allowed, with approval |
| R3 application access and department packages | 365 days | Allowed without approval while in scope |
| Project packages | On the project end date | Allowed, with approval, up to the end date |
| Packages for external users | No more than 365 days | Allowed, with sponsor approval |

Microsoft recommends that external users' packages expire within 365 days unless the project runs longer, and that any package without expiration get regular access reviews.[^c09-ext-arch]

### Separation of duties

A package can list other access packages, and security groups, as incompatible. A user who already holds an incompatible assignment or membership can't request the package, and an access package manager can't assign it to them either.[^c09-sod] The relationship is one-way: to keep users from holding both the "western territory" and "eastern territory" packages, each package must list the other.[^c09-sod] Incompatible groups can be on-premises AD groups synchronized to Entra ID, which lets the check respect access granted in systems outside the cloud.[^c09-sod] The check works with P2.[^c09-sod]

When the business needs an exception, Microsoft's pattern is to create a separate combined package for the people who legitimately need both, with a shorter expiry and more frequent reviews, so that the exception is visible to approvers, reviewers, and assessors.[^c09-sod] The program uses that pattern and records each combined package in the exception register. When incompatibility is added to a package that already has assignments, the portal can download the list of users who already hold both, and Microsoft Graph can list that "additional access" too; resolve those before relying on the check.[^c09-sod]

The *Application role assignment activity* workbook, with entitlement activity omitted, shows app role assignments made outside entitlement management, for example a direct assignment by an administrator.[^c09-sod] The program runs it monthly as a detective check on the group-based rule.

### Automatic assignment

With Entra ID Governance, an automatic assignment policy assigns a package to everyone who matches a rule on user attributes (such as department or cost center) and removes the assignment when they stop matching.[^c09-em-overview][^c09-licensing] This is the mechanism for department packages,[^c09-org-roles] and it depends on the attributes the HR feed maintains ([Book 03](../b03-hr-identity/index.md)). Book 02 notes one caution: don't build automatic assignment rules on the `memberOf` operator, whose preview Microsoft ended on November 3, 2026, so rules that still use it have stopped updating ([Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md#entitlement-management-and-access-packages)).

### The request portal is covered by Section 508

The people who request access, approve it and review it are federal employees, and Section 508 requires that the technology agencies use give employees with disabilities access to information and data "comparable to the access to and use of the information and data by Federal employees who are not individuals with disabilities."[^c09-794d] The Revised 508 Standards apply to "ICT that is procured, developed, maintained, or used by agencies," and require user interfaces and content to conform to WCAG 2.0 Level A and AA.[^c09-1194] As the workbook's practice, the program tests the whole request, approval and review flow with assistive technology, not just its first page, and records the vendor's Accessibility Conformance Report for the portal it uses. OMB asks agencies to validate vendor conformance documentation before purchase and after a product changes.[^c09-m2408] Where a conforming product isn't commercially available, the agency buys what best meets the standard and documents the market research in writing.[^c09-1194] The parts of the flow the agency writes are its own content too. An access package policy can ask requestors questions, answered as short text, long text or multiple choice, required or optional, with an optional pattern check on text answers;[^c09-em-questions] each question should state the expected answer and its format, because an answer the pattern rejects is only as easy to fix as the question was to read. [Book 18, Chapter 06](../b18-application-modernization/06-compliance-by-design.md#section-508-gate) sets the testing method and the rules for forms and error messages.

## Access reviews

Access reviews are recurring attestation that each person still needs what they hold.[^c09-ar-manage] A review captures a snapshot of access when each instance starts; changes made during a review show up in the next cycle.[^c09-create-review]

![One review instance: a snapshot of access goes to reviewers, unanswered items fall to the fallback reviewer and then to the no-response default, auto-apply removes denials, and the decisions become evidence.](../../images/diagrams/b04-access/svg/ch09-review-instance.svg){#fig-ch09-review-instance fig-alt="Left to right. A slate box, instance starts, takes a snapshot of who holds the access. It feeds a violet box, reviewers decide, listing owner, manager, sponsor or self, with justification and recommendations. An amber box, fallback reviewer, receives items where there is no manager or owner, and feeds back into the reviewers box. The reviewers box feeds an amber box, no-response default, listing no change, remove, approve, or take recommendations. That feeds a green box, auto-apply, which removes denied access at the end of the instance. A dashed arrow from auto-apply leads to a slate box, evidence: results CSV, review history, audit records."}

### What can be reviewed

| Review target | Where it's configured | License note |
|---|---|---|
| Group and Teams membership | Access reviews | P2 set; inactive-only scope needs Governance |
| Application assignments | Access reviews | P2 set |
| Access package assignments | The package's policy (lifecycle tab) or access reviews[^c09-ar-package] | P2 set |
| Entra roles and Azure resource roles | PIM | P2 or Governance |
| PIM for Groups membership | Access reviews (preview) | Governance |
| Guests across all Microsoft 365 groups | Access reviews, "All Microsoft 365 groups with guest users" | Guest billing applies |

The table draws on Microsoft's review-creation guidance and licensing reference.[^c09-create-review][^c09-licensing] Note two scoping details. A review of all Microsoft 365 groups with guests covers guests only and excludes dynamic and role-assignable groups.[^c09-create-review] A group membership review can be scoped to users inactive for up to 730 days, and users created more recently than the inactivity window are left out so that a new user gets a chance to sign in.[^c09-create-review]

Because the program assigns application access through groups, it reviews the groups, not the applications.[^c09-apps-deploy] Microsoft notes that a review of an application that uses group assignment doesn't remove the members of those groups, so they keep their access through the group.[^c09-ar-faq]

Reviews of privileged roles happen in PIM;[^c09-pim-complete] the role settings that pair with them are in [Chapter 08](08-pim-self-request-with-approval.md) and [Appendix B](appendix-b-pim-role-settings.md).

### Reviewers and fallback reviewers

Reviewers can be group owners (for group reviews), selected users or groups, the users themselves (self-review), or the users' managers.[^c09-create-review][^c09-ar-self] When the reviewer is a manager or a group owner, add a fallback reviewer: fallback reviewers are asked when a user has no manager in the directory or the group has no owner.[^c09-create-review] For reviews of PIM for Groups with owners as reviewers, a fallback reviewer is mandatory, and only active (not eligible) owners count as reviewers.[^c09-create-review] Owners are fixed when an instance starts; ownership changes take effect at the next recurrence.[^c09-create-review]

A multi-stage review runs two or three sets of reviewers in sequence, each in its own stage duration, and you choose which reviewees go on to the next stage (approved, denied, not reviewed, marked "don't know," or all) and whether later stages see earlier decisions.[^c09-create-review][^c09-ar-multistage] The program uses two stages for R1 applications: the manager first, then the application owner for everyone the manager approved or marked "don't know." That replaces the manual "escalate to department owner" step in the program's older review procedure.

### Cadence

A review's recurrence sets how often it runs, and its duration sets how long reviewers have; the recurrence must be at least as long as the duration.[^c09-create-review] Recurrences run from weekly (where the duration can be at most seven days) to monthly, quarterly, semiannual, and annual, and Microsoft recommends quarterly or more frequent reviews of packages that grant external access.[^c09-create-review][^c09-ext-arch]

The program's schedule, by target. It refines the review schedule in [Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md#access-reviews) by application tier; the cadences, reviewers, and no-response defaults are design positions. SP 800-53 leaves the frequency to the organization (AC-2(j) and AC-6(7) each take an organization-defined frequency).[^c09-fedramp-ac] Reviewers of privileged roles are never the assignees alone: with Microsoft's **Members (self)** reviewer option, role-assignable groups aren't part of a review of Microsoft Entra roles.[^c09-pim-review]

| Review target | Cadence | Duration | Reviewers | Fallback | If reviewers don't respond | Auto-apply |
|---|---|---|---|---|---|---|
| PIM-eligible Tier 0 roles, including Tier 0 Azure roles | Monthly | 14 days | `PIM-Approvers-T0` | Governance office | Remove access | Yes |
| PIM-eligible Tier 1, Tier 2 and read-only roles, and Azure roles below Tier 0 | Quarterly | 14 days | Role owner and the tier's approver group, or the security office ([Appendix B](appendix-b-pim-role-settings.md#review-cadence-by-tier)) | Governance office | Remove access | Yes |
| `PRV-T0-*` role-assignable groups | Monthly | 14 days | Governance office | Privileged Role Administrator | Remove access | Yes |
| Other `PRV-*` role-assignable groups | Quarterly | 14 days | Governance office | Privileged Role Administrator | Remove access | Yes |
| R1 application access groups | Quarterly | 14 days (two stages of 7) | Manager, then application owner | Backup application owner | No change; escalate to the governance office | Yes |
| R2 application access groups | Semiannual (January and July) | 14 days | Application owner | Backup application owner | No change; escalate | Yes |
| R3 application access groups | Annual (January) | 21 days | Application or department owner | Department owner | No change | Yes |
| Packages and groups with guests | Quarterly | 14 days | Sponsors | Governance office | Remove access | Yes |
| Microsoft 365 group membership | Semiannual | 21 days | Group owners | Governance office | No change | No (recommendations only) |
| `CA-Exclude-*` conditional access exclusion groups[^c09-ca-exclusion] | Quarterly | 14 days | Group owner | Governance office | Remove access | Yes |
| `PIM-Approvers-*` approver groups | Quarterly (`PIM-Approvers-T0` monthly, with the Tier 0 row) | 14 days | Governance office | Privileged Role Administrator | Remove access | Yes |

One exception to "Remove access" in the privileged rows: a review whose scope covers the emergency access accounts' permanent Global Administrator assignment uses **No change** when reviewers don't respond, and each unreviewed item is followed up as a finding. Removing access on silence there could remove the accounts kept for the day everything else fails ([Chapter 08](08-pim-self-request-with-approval.md#step-8-access-reviews-of-eligibility)). Every other privileged review removes access.

### Upon completion: auto-apply and the no-response default

When a review ends, *auto apply results to resource* removes denied users automatically; without it, someone has to apply the results by hand.[^c09-create-review] The *if reviewers don't respond* setting decides what happens to users nobody reviewed: no change, remove access, approve access, or take the system's recommendations.[^c09-create-review] Microsoft warns that combining "remove access" or "take recommendations" with auto-apply can revoke all access to a resource if reviewers don't respond.[^c09-create-review] That is why the program sets "remove access" only where an unreviewed grant is riskier than a lost one (privileged roles and guests), and "no change, escalate" for business applications, where a mass removal would stop work.

For guest-only reviews, a denied guest can either lose only the reviewed membership, or be blocked from signing in for 30 days and then deleted from the tenant; within those 30 days an administrator can re-enable the account.[^c09-create-review][^c09-ar-guests] The program blocks and removes denied guests.

Two review-quality settings matter as much as the cadence:

- **Decision helpers.** "No sign-in within 30 days" recommends denial for users who haven't signed in during the previous 30 days (for application reviews, sign-in to the application), and "user-to-group affiliation" recommends denial for users far from the rest of the group in the reporting structure.[^c09-create-review][^c09-ar-recs] The machine-learning affiliation recommendation needs Governance.[^c09-licensing]
- **Justification and reminders.** "Justification required" makes reviewers state a reason for each decision; reminders go to all reviewers halfway through the review.[^c09-create-review]

Bulk approval is the efficient and dangerous part of any review. The program requires justification on every review, and for privileged-role reviews it requires a decision per assignment: reviewers don't accept recommendations in bulk. The service can't prevent a bulk action, so the review history (below) is checked for privileged reviews where one reviewer recorded many identical decisions within minutes.

### From a manual procedure to the service

The program's earlier review procedure was a distributed spreadsheet: the governance office sent each owner a membership report on the first business day of the quarter, owners certified approve, remove, or escalate within 10 business days, and the help desk executed removals through tickets within 5 business days. The service replaces each step:

| Manual step | In Entra ID |
|---|---|
| Distribute the membership report | The review instance starts on schedule and emails reviewers |
| Owner certifies each member | Reviewers decide in My Access, with recommendations[^c09-ar-perform] |
| "Escalate" when unsure | "Don't know" decisions go to a second stage |
| Help desk removes within 5 business days | Auto-apply removes denied users when the instance ends |
| Owner confirms removals; office archives | Review history and audit records are exported (below) |

The service-level targets survive as measures. A review is complete when every decision is recorded and applied before the instance closes; denied access still present five business days after close is a finding.

## Lifecycle Workflows at the access level

The HR-driven lifecycle (inbound provisioning, joiner, mover, and leaver design, and the attributes that trigger them) is [Book 03](../b03-hr-identity/index.md)'s. What this chapter needs is the set of Lifecycle Workflows tasks that change access, because those tasks are where the mover and leaver problems turn into access decisions.

Lifecycle Workflows run on a schedule when a user meets a workflow's execution conditions, a trigger plus a scope, or on demand. The scheduled triggers are a time-based attribute, an attribute change, a group membership change, and sign-in inactivity.[^c09-lcw-conditions] The access-related built-in tasks as of October 2026:[^c09-lcw-tasks]

| Task | Category |
|---|---|
| Request user access package assignment | Joiner, mover |
| Remove access package assignment for user | Leaver, mover |
| Remove all access package assignments for user | Leaver, mover |
| Cancel all pending access package assignment requests for user | Leaver |
| Add user to groups; add user to teams | Joiner, mover, leaver |
| Remove user from selected groups; remove user from all groups | Joiner, mover, leaver; leaver |
| Remove user from selected teams; remove user from all teams | Leaver |
| Revoke all refresh tokens for user | Leaver, mover |
| Assign licenses; remove selected or all license assignments | Joiner, mover; leaver, mover; leaver |
| Run a custom task extension | Joiner, mover, leaver |

The program's access rules for each event, as design positions:

- **Joiner.** Request the onboarding package and the department package. Never add a new hire directly to an application group.
- **Mover.** A move is a re-derivation, not an additional grant. Remove the previous department's package assignments, request the new department's package, and send everything the person still holds outside packages to a review. Microsoft's built-in *Employee job profile change* template does the first two steps, and its *remove all access package assignments* task defaults to a scheduled removal 15 days after the trigger, a grace period for handover.[^c09-lcw-templates] The program keeps the grace period for standard access and sets it to zero for R1 and privileged access.
- **Leaver.** Cancel pending requests, remove all package assignments, remove the user from all groups and teams, and revoke refresh tokens. The account disable and deletion steps are Book 03's.
- **Inactivity.** The *Offboard inactive users* template keys on `lastSuccessfulSignInDateTime`; Microsoft's inactive-user templates default to 90 days of inactivity for the pre-offboarding workflow and 120 days for offboarding.[^c09-lcw-templates][^c09-inactive] The program uses it as a backstop for accounts whose HR record didn't produce a leaver event.

Learn gives two different tenant ceilings for workflows: the licensing page says up to 50 workflows, and the service limits page says 100 per tenant, with 25 tasks per workflow and up to 100 custom task extensions.[^c09-licensing][^c09-gov-limits] The program budgets to 50 until Microsoft reconciles the two pages. Spend workflows on events, not on individual applications; per-application cleanup belongs in the packages that a single "remove all assignments" task clears.

## Guest access governance

Guests are where unreviewed access accumulates fastest, because nobody's HR record ends when a partner project does. Book 02 covers the collaboration model, cross-tenant access settings, and B2B direct connect ([Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md#cross-tenant-and-b2b-collaboration)). Governance of the guest's access works in four layers.

- **Invite through a package.** When a policy allows users from a connected organization to request a package, an approved request creates the guest account automatically and assigns the access; the B2B allow and block lists still apply.[^c09-ext-users][^c09-b2b-allowdeny] Inviting through a package means every guest arrives with an approver, a sponsor, and an expiry.[^c09-guest-deploy]
- **End the account with the last assignment.** By default, when a guest who was invited through entitlement management loses their last package assignment (by expiry or by giving it up), they are blocked from signing in and their account is removed after 30 days; the block, the removal, and the number of days are configurable, and setting the days to zero removes the account immediately.[^c09-ext-users] This applies only to guests entitlement management invited, or to existing guests an administrator has marked as governed; ungoverned guests stay in the tenant indefinitely after losing their last assignment.[^c09-guest-lifecycle] Blocked guests can't request access again, so don't block guests who will return.[^c09-ext-users] Marking guests as governed needs Entra ID Governance.[^c09-licensing] The program marks every existing guest who holds a package assignment as governed, and keeps the default 30-day block before removal.
- **Review on a quarterly cadence.** Packages and groups with guests are reviewed quarterly by sponsors, with denied guests blocked and removed (see the schedule above). Where guests review their own access, remember that a guest who hasn't accepted their invitation receives no review email, so unredeemed guests fall to the no-response default.[^c09-create-review]
- **Policy for the guest population.** Guest lifecycle policies in Lifecycle Workflows, in preview as of October 2026, add tenant-wide rules: sponsor attestation (default 90 days, configurable 30 to 365), an activity requirement (default 90 days, 30 to 730), a minimum number of sponsors (1 to 5), and deletion of invitations not redeemed within a set number of days (default 30, 1 to 30).[^c09-guest-policies][^c09-sponsors] The program will adopt them when they reach general availability; until then the quarterly sponsor review and the inactive-guest insights (a Governance feature) do the same job.[^c09-licensing][^c09-stale-guests]

## Tenant hygiene: unsanctioned tenants and Microsoft 365 groups

Access governance assumes the program knows which tenants and groups exist. Two kinds of sprawl break that assumption: tenants nobody in central IT administers, and Microsoft 365 groups that outlive their purpose.

### Unsanctioned tenants

Microsoft's guidance is to inventory the organization's tenants first and then quarantine the ones that look unsanctioned, using settings in the primary tenant only, since the program has no administrative control of the suspect tenant. Quarantine adds friction (a "scream test") that prompts the suspect tenant's administrators to make contact, and every step should be easy to reverse. The levers Learn lists are: block inbound and outbound B2B sign-in for that tenant in cross-tenant access settings (P1); block sign-in to it from managed devices and networks with Tenant Restrictions v2 applied through Global Secure Access (P1); review and revoke permissions of, or delete, service principals for multitenant applications registered in that tenant (P1; a deleted service principal can be restored for 30 days); and cancel subscriptions provisioned in it.[^c09-quarantine] Learn gives a read-only query to find the service principals whose applications were registered in a suspect tenant:[^c09-quarantine]

```http
GET https://graph.microsoft.com/v1.0/servicePrincipals?$count=true&$filter=appOwnerOrganizationId eq {tenantId}
ConsistencyLevel: eventual
```

The quarantine page doesn't state government-cloud availability for these steps, so it is not yet specified there. As a design position, the governance office decides each quarantine, records it with the partner tenant list ([Book 03, Chapter 15](../b03-hr-identity/15-external-partner-identity.md)), and lifts it only when an administrator of the other tenant proves ownership or hands control to the program.

### Tenant creation {#tenant-creation}

Quarantine deals with tenants that already exist. The cheaper control stops the next one. By default any user can create a new Microsoft Entra tenant and is made its Global Administrator; the new tenant inherits none of the agency's settings, and Microsoft's Zero Trust guidance describes it as a shadow identity platform outside the organization's governance and monitoring.[^c09-zt-tenants] A Zero Trust assessment reports the open setting as a finding. The conventions are [Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md)'s, and [Book 11, Chapter 06](../b11-zero-trust/06-beyond-microsoft-365.md) explains why an unmanaged tenant belongs in the program's inventory.

**Authority:** Microsoft-recommended: restrict non-admin users from creating tenants, assign the Tenant Creator role to those who need it, and review tenant-creation events in the audit log (Learn, "Configure Microsoft Entra for Zero Trust: Protect tenants and isolate production systems," read Nov 11, 2026).[^c09-zt-tenants] The approval workflow is risk-based recommended, the program's.
**Applies:** all tenants; no license beyond Microsoft Entra ID. Environment-dependent: Learn doesn't state the setting's or the Tenant Creator role's availability in GCC High or DoD, so it is not yet specified; Learn's government feature table lists user and group management and built-in roles as available in Azure for US Government.[^c09-feature-availability]

**What the setting does.** **Restrict non-admin users from creating tenants**, under **Entra ID** > **Users** > **User settings**, set to **Yes**, limits tenant creation to holders of at least the Tenant Creator role. Creation is still recorded in the audit log, as category `DirectoryManagement` and activity `Create Company`, and the creator is still made Global Administrator of the new tenant.[^c09-default-perms] In Microsoft Graph the setting is the `allowedToCreateTenants` property of the authorization policy's default user role permissions; `false` corresponds to **Yes** in the admin center, and Tenant Creator holders can still create tenants.[^c09-authz-tenants]

**The approved Tenant Creator workflow** (program design). Tenant Creator is an eligible assignment in PIM, never active, requested through the Tier 2 settings with approval required ([Chapter 08](08-pim-self-request-with-approval.md#settings-by-tier)). The request names the purpose (test, development, partner sandbox or a governed workforce tenant), the owner, the end date and the cost center. The governance office approves it and records the new tenant, with its tenant ID, in the tenant inventory that the [tenant strategy](appendix-c-partner-access-profile-entra.md#tenant-strategy-multitenant-organizations-and-tenant-governance) keeps. Where Tenant Governance is adopted, Microsoft's governed workforce tenant flow also requires Tenant Creator and can establish a governance relationship with the home tenant from its default policy template.[^c09-governed-tenant]

#### Prerequisites

A role that can change user settings, and the `Policy.ReadWrite.Authorization` permission for the Graph command;[^c09-authz-tenants] the workspace receiving `AuditLogs`; PIM configured for the Tenant Creator role.

#### Pilot

Not applicable: the setting is tenant-wide. Before turning it on, read 90 days of `Create Company` events to find who creates tenants today, and give each legitimate creator an eligible Tenant Creator assignment first.

#### Report-only or audit phase

The audit read above is the audit phase; the setting has no report-only mode.

#### Enforcement

Read the current value, then set it. The second command writes; the third reads the result.

```powershell
# READ, WRITE, READ. Needs Policy.ReadWrite.Authorization.
Connect-MgGraph -Scopes 'Policy.ReadWrite.Authorization' -NoWelcome
(Get-MgPolicyAuthorizationPolicy).DefaultUserRolePermissions.AllowedToCreateTenants   # True means anyone can create tenants

Update-MgPolicyAuthorizationPolicy -BodyParameter @{ defaultUserRolePermissions = @{ allowedToCreateTenants = $false } }

(Get-MgPolicyAuthorizationPolicy).DefaultUserRolePermissions.AllowedToCreateTenants   # expected: False
```

#### Rollback

The same command with `$true`, through an emergency change. Rollback isn't expected; a blocked creator requests Tenant Creator instead.

#### Exclusions

None. Eligible Tenant Creator holders are the governed route, not an exclusion.

#### Telemetry

Alert on every tenant-creation event; each one should match an approved request. The query is illustrative and hasn't been run against a production workspace.

```kusto
AuditLogs
| where TimeGenerated > ago(1d)
| where Category == "DirectoryManagement" and OperationName == "Create Company"
| project TimeGenerated, Initiator = tostring(InitiatedBy.user.userPrincipalName),
          InitiatorId = tostring(InitiatedBy.user.id), Result, CorrelationId
```

#### Evidence

The monitored test event: a Tenant Creator holder, after an approved PIM activation, creates a test tenant; the alert fires with the creator's identity and the time, and the governance office records the tenant and deletes it when the test ends. A second test: a user without the role tries to create a tenant and can't.

**Evidence checklist**

- [ ] **Configuration:** the authorization policy export showing `allowedToCreateTenants` false, and the Tenant Creator role settings in PIM
- [ ] **Operational:** `Create Company` events and alerts for the period, each matched to an approved request
- [ ] **Test:** the monitored test event and the blocked attempt, with expected and observed results
- [ ] **Exception:** the eligible Tenant Creator assignments and their approvals
- [ ] **Assessor-ready artifact:** the tenant inventory with each created tenant's approval

#### Day-two ownership

The IGO owns the setting, the approvals and the tenant inventory; security operations owns the alert. Cadence: every `Create Company` event reviewed when it fires; Tenant Creator eligibility reviewed with the Tier 2 roles ([Appendix B](appendix-b-pim-role-settings.md#review-cadence-by-tier)). Drift is the setting returned to allow, or a tenant created with no approved request.

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | The approved Tenant Creator workflow | The workflow and its owner |
| Configured | Tenant Creator eligible in PIM; the alert rule | PIM role settings and the rule definition |
| Enforced | The setting at **Yes** (`allowedToCreateTenants` false) | The authorization policy export |
| Evidenced | The monitored test event and the blocked attempt | Test records and the `Create Company` event |
| Operated | Day-two ownership above | The tenant inventory and the alert history |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** Identity
- **CISA ZTMM pillar:** Identity
- **Depends on:** SecOps (the audit alert, [Book 12](../b12-security-operations/index.md)); Identity (PIM for the Tenant Creator role, [Chapter 08](08-pim-self-request-with-approval.md))
- **Attack chain interrupted:** Resource Development and Persistence: an attacker or an unaware user can't stand up an identity platform outside the agency's governance for token issuance, impersonation or consent phishing, and any tenant that is created is seen
:::

### Microsoft 365 group expiration

An expiration policy gives Microsoft 365 groups a lifetime of 30 days or more; it applies to all, selected (up to 500), or no Microsoft 365 groups, and a tenant can have only one. Groups with user activity in Outlook, SharePoint, Teams or Viva Engage renew automatically about 35 days before they expire; otherwise owners are emailed 30 days, 15 days and 1 day before expiry, and a group nobody renews is deleted one day after it expires. A deleted group can be restored for 30 days, and that window can't be changed. The policy needs Entra ID P1 or P2 licenses for the members of every group it applies to (held, not necessarily assigned), and Groups Administrator or User Administrator to configure it.[^c09-groups-lifecycle] To view the current policy without changing it:[^c09-groups-lifecycle][^c09-get-lifecycle]

```powershell
Connect-MgGraph -Scopes "Directory.Read.All"
Get-MgGroupLifecyclePolicy
```

The output shows the policy ID, the alternate notification address used for groups with no owner, `GroupLifetimeInDays`, and `ManagedGroupTypes` (`All`, `Selected` or `None`).[^c09-groups-lifecycle] Expiration covers Microsoft 365 groups only, so it doesn't touch the security groups the program uses for application access; those stay governed by owners and reviews.

### Microsoft 365 group naming policy

A naming policy enforces a prefix-suffix convention (fixed strings or the creator's attributes such as `[Department]`) and a custom blocked-words list of up to 5,000 entries on Microsoft 365 groups created in any workload. It doesn't apply to distribution groups, and Global Administrator and User Administrator are exempt from it.[^c09-groups-naming] It needs an Entra ID P1 license for each unique user, guests included, who is a member of one or more Microsoft 365 groups.[^c09-groups-naming-m365] To view the current settings (the Microsoft Graph beta module is required):[^c09-groups-naming]

```powershell
Connect-MgGraph -Scopes "Directory.Read.All"
$Setting = Get-MgBetaDirectorySetting -DirectorySettingId (Get-MgBetaDirectorySetting | where -Property DisplayName -Value "Group.Unified" -EQ).id
$Setting.Values
```

`PrefixSuffixNamingRequirement` and `CustomBlockedWordsList` hold the policy.[^c09-groups-settings] Learn has administrators create the `Group.Unified` settings object before setting a naming policy, so a tenant with no `Group.Unified` object has no naming policy configured.[^c09-groups-naming] Because the policy covers Microsoft 365 groups only, it can't enforce the program's `APP-` convention on security groups; that convention stays a pre-merge check ([Chapter 10](10-access-as-code-and-evidence.md#what-goes-in-the-repository)) and a review finding.

### Restoring a deleted group

A deleted Microsoft 365 group or cloud security group is kept, hidden, for 30 days and can be restored with its contents in that time; the window can't be changed. Soft delete for cloud security groups is in preview and available only in public clouds, and distribution groups aren't covered. Groups Administrator can restore any of them, and an owner can restore a group they own.[^c09-groups-restore] Restoring a role-assignable group needs Privileged Role Administrator, which matters for the program's `PRV-*` groups.[^c09-restore-object] To list deleted groups that can still be restored, without restoring anything:[^c09-groups-restore]

```powershell
Connect-MgGraph -Scopes "Group.Read.All"
Get-MgBetaDirectoryDeletedGroup
```

Learn's restore page connects with `Group.ReadWrite.All`, which the restore itself (`Restore-MgBetaDirectoryDeletedItem`) needs; the listing above only reads.[^c09-groups-restore] A restored dynamic group is treated as a new group and repopulated from its rule, which can take up to 24 hours.[^c09-groups-lifecycle]

**Government cloud.** Learn's Microsoft Entra feature availability page lists advanced group management (dynamic groups, naming policies, expiration, default classification) as available in Azure Government, which serves GCC High and DoD tenants; GCC tenants use Microsoft Entra ID in commercial Azure.[^c09-feature-availability][^c09-azure-gov-pairing] Soft delete and restore for cloud security groups is public-cloud only while in preview, as above; availability of Microsoft 365 group restore in government clouds is not yet specified.

## How the program evidences reviews

An assessor reads governance as records, not as settings. For each mechanism, the program keeps four kinds of evidence: the definition (what was configured), the instance records (what happened), the applied results (what changed), and the exceptions (what was allowed and why). The control mapping that ties these to SP 800-53 is in [Chapter 10](10-access-as-code-and-evidence.md#what-the-assessor-reads).

### The records Entra ID produces

- **Review results.** Results of any review, in progress or completed, can be downloaded as a CSV, and recurring reviews keep a history of completed instances.[^c09-complete-review] Microsoft Graph lists the decisions of each instance (one decision per reviewed identity) through the access reviews API, and the Microsoft Graph PowerShell cmdlet `Get-MgIdentityGovernanceAccessReviewDefinitionInstanceDecision` does the same; the default page size is 100 decisions.[^c09-complete-review]
- **Review history reports.** A review history report pulls the decisions across reviews for a date range, filtered by review type and result, and records per user the reviewer, decision, justification, recommendation, who applied the result, and when.[^c09-review-history] Reports stay downloadable for 30 days, so the program downloads each one into the evidence store when it is generated.[^c09-review-history][^c09-deploy-employee]
- **Audit log entries.** Access review activity is recorded in the Entra audit log, including creating and ending a review and approving, denying, resetting, and applying decisions.[^c09-deploy-reviews] Entitlement management writes audit records in the `EntitlementManagement` category for each step of a request, from "User requests access package assignment" through approval to "Fulfill access package assignment."[^c09-em-reports]
- **Assignment reports.** Each package's current assignments can be downloaded, and historical analysis of objects and assignments over time needs an export to Azure Data Explorer or a log workspace, because the reports show current state.[^c09-em-reports]

### Retention: the logs don't keep themselves

Native retention is shorter than is often assumed: as of October 2026, Entra ID keeps audit and sign-in logs for 7 days on Free and 30 days on P1 and P2, and upgrading doesn't recover older data.[^c09-retention][^c09-apps-prepare] Evidence that has to outlast a 30-day window has to leave the service first: Book 02's monitoring design streams every log category to a Log Analytics workspace with 365-day retention ([Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md#monitoring-audit-and-compliance)).

The program's retention requirements, as design positions:

| Record | Retention | Where |
|---|---|---|
| Entra audit and sign-in logs, including PIM activations and access review activity | At least 1 year | Log Analytics workspace and the SIEM |
| Admin consent grants and emergency access account activity | At least 3 years | SIEM plus long-term archive |
| Review history reports and per-instance results | 3 years | Evidence store |
| Access request tickets (where a ticket exists alongside the package request) | 3 years active, 7 years archived | ITSM system and archive |
| Application registry snapshots | Annual snapshot, kept 3 years | Evidence store |

A gap in log forwarding is a gap in evidence. The governance office confirms forwarding health quarterly, and a forwarding gap is reported to the CISO as a security incident within 24 hours of discovery.

### Governance alerts

Detections that guard the governance process itself run in the SIEM;[^c09-ops-guide] the detection queries for privileged activity and sign-in coverage are in [Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md#detection-rules) and the consent and application alerts are in [Chapter 06, Evidence and monitoring](06-who-decides-access.md#evidence-and-monitoring). Three are specific to this chapter:

| Alert | Trigger | Priority |
|---|---|---|
| Access granted outside entitlement management | An app role assignment to an R1 or R2 application not made by entitlement management | High |
| Review closed with unapplied denials | A review instance ended with "Deny" decisions not applied | High |
| Bulk privileged decisions | One reviewer records many identical decisions in a privileged-role review within minutes | Medium |

### Exceptions

Every deviation (a combined package that overrides separation of duties, a review schedule moved, a package without expiry) is recorded in the exception register with its approver, its justification, and an end date. Deviations from the R3 review schedule need the governance office's approval; deviations for R1 or R2 also need the CISO's concurrence. The register is reviewed quarterly and is part of the evidence for each cycle.

## Privacy

Access governance runs on personnel data and produces more of it. Automatic assignment policies and dynamic groups read HR attributes such as organization code, worker type and manager; every request, approval, review decision and justification is a record about a named person; and reviewers see the reviewee's attributes and, where recommendations are on, sign-in activity. Inside the agency, showing a reviewer what the review needs is a disclosure to an employee who needs the record for their duties, which the Privacy Act permits, and the Act also requires records used in decisions about people to be accurate enough to be fair.[^c09-pa] The privacy risk is drift: an attribute added to a policy without a purpose, a justification field that collects a medical or disciplinary detail, or review records kept with no end date.

The program's design treats access governance as one more consumer of [Book 03, Chapter 14](../b03-hr-identity/14-privacy-for-workforce-identity.md)'s attribute purpose register, and runs that chapter's checklist before a policy reads a new attribute. A-130's minimization principle and SP 800-53 controls PT-3 (processing purposes), SI-12(1) (limit PII elements) and SI-18 (PII quality), all in the privacy baseline that applies at every impact level, are the requirements behind it.[^c09-a130][^c09-sp80053-priv] A wrong manager produces a wrong reviewer, and the fix is in HR, not in the review. Guests and connected organizations in a review are people outside the government, which the system's privacy impact assessment has to reflect. Review history and request records are system access records, which General Records Schedule 3.2 covers.[^c09-grs32]

| Obligation | What the engineer does | Who signs off |
|---|---|---|
| Purpose limitation (PT-3) | Lists every attribute an assignment policy or dynamic group reads in the attribute purpose register; adds none without a row | Privacy office |
| Minimization (SI-12(1)) | Keeps justification fields short, and tells reviewers and approvers not to record health, disciplinary or other sensitive details | Governance office; privacy office for the wording |
| Accuracy (Privacy Act (e)(5); SI-18) | Routes a wrong manager or organization to HR; reruns the affected review once HR corrects it | HR; governance office |
| PIA scope | Tells the privacy office when packages, catalogs or reviews extend to guests or connected organizations | Privacy office |
| Retention (SI-12; GRS 3.2) | Maps review history, request records and their evidence-store copies to a schedule item, and disposes of them on schedule | Records officer |

: Privacy obligations in access governance {.striped .hover}

External Partner Persons are guests by default and arrive through a package, so these four layers govern them. The business owner of the partner relationship decides the access, the sponsor is a named role who answers the quarterly review, and at partner exit the packages are removed, the guests follow under the removal rule above, and the IGO removes the partner from the partner tenant list ([Book 03, Chapter 15](../b03-hr-identity/15-external-partner-identity.md); [Appendix C](appendix-c-partner-access-profile-entra.md#validation-tests), test T10).

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 08 — PIM Self-Request with Approval](08-pim-self-request-with-approval.md) · [Book index](index.md) · [Next: Chapter 10 — Access as Code, and the Evidence It Produces →](10-access-as-code-and-evidence.md)
:::

[^c09-fedramp-ac]: FedRAMP, "Access Control" (NIST SP 800-53 Rev. 5 controls, catalog release 5.2.0), <https://fedramp.gov/2026/reference/controls/access-control/> (accessed Oct 21, 2026).
[^c09-pim-review]: Microsoft Learn, "Create an access review of Azure resource and Microsoft Entra roles in PIM," section "Create access reviews," <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-create-roles-and-resource-roles-review#create-access-reviews> (accessed Oct 21, 2026).
[^c09-licensing]: Microsoft Learn, "Microsoft Entra ID Governance licensing fundamentals," <https://learn.microsoft.com/entra/id-governance/licensing-fundamentals> (accessed Oct 20, 2026).
[^c09-group-assign]: Microsoft Learn, "Manage users and groups assignment to an application," <https://learn.microsoft.com/entra/identity/enterprise-apps/assign-user-or-group-access-portal> (accessed Oct 20, 2026).
[^c09-create-review]: Microsoft Learn, "Create an access review of groups and applications in Microsoft Entra ID," <https://learn.microsoft.com/entra/id-governance/create-access-review> (accessed Oct 20, 2026).
[^c09-em-overview]: Microsoft Learn, "What is entitlement management?," <https://learn.microsoft.com/entra/id-governance/entitlement-management-overview> (accessed Oct 20, 2026).
[^c09-delegate]: Microsoft Learn, "Delegate access governance to access package managers in entitlement management," <https://learn.microsoft.com/entra/id-governance/entitlement-management-delegate-managers> (accessed Oct 20, 2026).
[^c09-ap-create]: Microsoft Learn, "Create an access package in entitlement management," <https://learn.microsoft.com/entra/id-governance/entitlement-management-access-package-create> (accessed Oct 20, 2026).
[^c09-catalog-resource]: Microsoft Learn, "accessPackageCatalog resource type," <https://learn.microsoft.com/graph/api/resources/accesspackagecatalog?view=graph-rest-1.0> (accessed Oct 20, 2026).
[^c09-approval]: Microsoft Learn, "Change approval and requestor information settings for an access package in entitlement management," <https://learn.microsoft.com/entra/id-governance/entitlement-management-access-package-approval-policy> (accessed Oct 20, 2026).
[^c09-lifecycle]: Microsoft Learn, "Change lifecycle settings for an access package in entitlement management," <https://learn.microsoft.com/entra/id-governance/entitlement-management-access-package-lifecycle-policy> (accessed Oct 20, 2026).
[^c09-ext-arch]: Microsoft Learn, "Manage external access with Microsoft Entra entitlement management," <https://learn.microsoft.com/entra/architecture/6-secure-access-entitlement-managment> (accessed Oct 20, 2026).
[^c09-sod]: Microsoft Learn, "Configure separation of duties checks for an access package in entitlement management," <https://learn.microsoft.com/entra/id-governance/entitlement-management-access-package-incompatible> (accessed Oct 20, 2026).
[^c09-lcw-conditions]: Microsoft Learn, "Lifecycle workflows execution conditions and scheduling," <https://learn.microsoft.com/entra/id-governance/lifecycle-workflow-execution-conditions> (accessed Oct 20, 2026).
[^c09-lcw-tasks]: Microsoft Learn, "Lifecycle Workflow built-in tasks," <https://learn.microsoft.com/entra/id-governance/lifecycle-workflow-tasks> (accessed Oct 20, 2026).
[^c09-lcw-templates]: Microsoft Learn, "Lifecycle Workflows templates and categories," <https://learn.microsoft.com/entra/id-governance/lifecycle-workflow-templates> (accessed Oct 20, 2026).
[^c09-ext-users]: Microsoft Learn, "Govern access for external users in entitlement management," <https://learn.microsoft.com/entra/id-governance/entitlement-management-external-users> (accessed Oct 20, 2026).
[^c09-guest-lifecycle]: Microsoft Learn, "Manage guest user lifecycle," <https://learn.microsoft.com/entra/id-governance/entitlement-management-access-package-manage-lifecycle> (accessed Oct 20, 2026).
[^c09-guest-policies]: Microsoft Learn, "Guest lifecycle policies in Lifecycle Workflows (preview)," <https://learn.microsoft.com/entra/id-governance/guest-lifecycle-policies> (accessed Oct 20, 2026).
[^c09-complete-review]: Microsoft Learn, "Complete an access review of groups and applications in access reviews," <https://learn.microsoft.com/entra/id-governance/complete-access-review> (accessed Oct 20, 2026).
[^c09-review-history]: Microsoft Learn, "Create and manage downloadable access review history report in Microsoft Entra access reviews," <https://learn.microsoft.com/entra/id-governance/access-reviews-downloadable-review-history> (accessed Oct 20, 2026).
[^c09-ar-faq]: Microsoft Learn, "Access reviews - FAQs," <https://learn.microsoft.com/entra/id-governance/access-reviews-faqs> (accessed Oct 20, 2026).
[^c09-deploy-reviews]: Microsoft Learn, "Plan a Microsoft Entra access reviews deployment," <https://learn.microsoft.com/entra/id-governance/deploy-access-reviews> (accessed Oct 20, 2026).
[^c09-em-reports]: Microsoft Learn, "View reports and logs in entitlement management," <https://learn.microsoft.com/entra/id-governance/entitlement-management-reports> (accessed Oct 20, 2026).
[^c09-retention]: Microsoft Learn, "Microsoft Entra data retention," <https://learn.microsoft.com/entra/identity/monitoring-health/reference-reports-data-retention> (accessed Oct 20, 2026).
[^c09-794d]: 29 U.S.C. §794d(a)(1)(A)(i) (2023 edition), <https://www.govinfo.gov/content/pkg/USCODE-2023-title29/html/USCODE-2023-title29-chap16-subchapV-sec794d.htm> (accessed Oct 23, 2026).
[^c09-1194]: U.S. Access Board, Revised 508 Standards, 36 CFR part 1194, Appendix A, E201.1, E202.7 and E202.7.1 (best meets), and E207.2, <https://www.ecfr.gov/current/title-36/chapter-XI/part-1194> (accessed Oct 23, 2026).
[^c09-m2408]: Office of Management and Budget, M-24-08, *Strengthening Digital Accessibility and the Management of Section 508 of the Rehabilitation Act*, December 21, 2023, §III.B, <https://www.whitehouse.gov/wp-content/uploads/2023/12/M-24-08-Strengthening-Digital-Accessibility-and-the-Management-of-Section-508-of-the-Rehabilitation-Act.pdf> (accessed Oct 23, 2026).
[^c09-pa]: Privacy Act of 1974, 5 U.S.C. §552a (2023 edition), subsections (b)(1), disclosure to the agency's officers and employees who need the record, and (e)(5), accuracy, <https://www.govinfo.gov/content/pkg/USCODE-2023-title5/html/USCODE-2023-title5-partI-chap5-subchapII-sec552a.htm> (accessed Nov 2, 2026).
[^c09-a130]: Office of Management and Budget, Circular A-130, *Managing Information as a Strategic Resource*, July 28, 2016 (Appendix II §3, Fair Information Practice Principles, Minimization), <https://www.whitehouse.gov/wp-content/uploads/legacy_drupal_files/omb/circulars/A130/a130revised.pdf> (accessed Nov 2, 2026).
[^c09-sp80053-priv]: National Institute of Standards and Technology, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, Release 5.2.0 (controls PT-3, SI-12, SI-12(1) and SI-18), <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>; and SP 800-53B, *Control Baselines for Information Systems and Organizations* (the privacy baseline, "applied to systems irrespective of impact level"), <https://csrc.nist.gov/pubs/sp/800/53/b/upd1/final>; control text and privacy-baseline membership read from NIST's OSCAL Release 5.2.0 catalog and privacy baseline profile, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5> (accessed Nov 2, 2026).
[^c09-grs32]: National Archives, General Records Schedule 3.2, *Information Systems Security Records*, Transmittal 33, items 030 and 031 (system access records, including user profiles, log-in files and audit trails), <https://www.archives.gov/files/records-mgmt/grs/grs03-2.pdf> (accessed Nov 2, 2026).
[^c09-gov-limits]: Microsoft Learn, "Microsoft Entra ID Governance service limits," section "Lifecycle Workflows," <https://learn.microsoft.com/entra/id-governance/governance-service-limits#lifecycle-workflows> (accessed Nov 7, 2026).
[^c09-em-questions]: Microsoft Learn, "Change approval and requestor information settings for an access package in entitlement management," section "Collect additional requestor information for approval," <https://learn.microsoft.com/entra/id-governance/entitlement-management-access-package-approval-policy> (accessed Nov 2, 2026).
[^c09-em-request]: Microsoft Learn, "Request an access package - entitlement management," <https://learn.microsoft.com/entra/id-governance/entitlement-management-request-access>; and "What is the My Access portal?," <https://learn.microsoft.com/entra/id-governance/my-access-portal-overview> (accessed Nov 9, 2026).
[^c09-em-extensions]: Microsoft Learn, "Trigger Logic Apps with custom extensions in entitlement management," <https://learn.microsoft.com/entra/id-governance/entitlement-management-logic-apps-integration>; and "Externally determine the approval requirements for an access package using custom extensions," <https://learn.microsoft.com/entra/id-governance/entitlement-management-dynamic-approval> (accessed Nov 9, 2026).
[^c09-em-behalf]: Microsoft Learn, "Request access packages on-behalf-of other identities," <https://learn.microsoft.com/entra/id-governance/entitlement-management-request-behalf> (accessed Nov 9, 2026).
[^c09-guest-billing]: Microsoft Learn, "Microsoft Entra ID Governance licensing for guest users," <https://learn.microsoft.com/entra/id-governance/microsoft-entra-id-governance-licensing-for-guest-users> (accessed Nov 9, 2026).
[^c09-app-access]: Microsoft Learn, "Manage access to apps," <https://learn.microsoft.com/entra/identity/enterprise-apps/what-is-access-management>; and "Understand how users are assigned to apps," <https://learn.microsoft.com/entra/identity/enterprise-apps/ways-users-get-assigned-to-applications> (accessed Nov 9, 2026).
[^c09-em-catalog]: Microsoft Learn, "Create and manage a catalog of resources in entitlement management," <https://learn.microsoft.com/entra/id-governance/entitlement-management-catalog-create>; and "Delegate access governance to catalog creators in entitlement management," <https://learn.microsoft.com/entra/id-governance/entitlement-management-delegate-catalog> (accessed Nov 9, 2026).
[^c09-em-roles]: Microsoft Learn, "Delegation and roles in entitlement management," <https://learn.microsoft.com/entra/id-governance/entitlement-management-delegate> (accessed Nov 9, 2026).
[^c09-ap-resources]: Microsoft Learn, "Change resource roles for an access package in entitlement management," <https://learn.microsoft.com/entra/id-governance/entitlement-management-access-package-resources> (accessed Nov 9, 2026).
[^c09-ap-pim]: Microsoft Learn, "Using groups managed by Privileged Identity Management with access packages," <https://learn.microsoft.com/entra/id-governance/entitlement-management-access-package-pim-reference> (accessed Nov 9, 2026).
[^c09-ap-licenses-azure]: Microsoft Learn, "Manage the lifecycle of group-based licenses in Microsoft Entra ID," <https://learn.microsoft.com/entra/id-governance/entitlement-management-group-licenses>; and "Assign Azure Role-based access control (RBAC) Roles - Entitlement management," <https://learn.microsoft.com/entra/id-governance/entitlement-management-azure-role-assignments> (accessed Nov 9, 2026).
[^c09-em-troubleshoot]: Microsoft Learn, "Troubleshoot entitlement management," section "Requests," <https://learn.microsoft.com/entra/id-governance/entitlement-management-troubleshoot> (accessed Nov 9, 2026).
[^c09-em-process]: Microsoft Learn, "Request process & notifications - Microsoft Entra entitlement management," <https://learn.microsoft.com/entra/id-governance/entitlement-management-process>; and "Approve or deny access requests - entitlement management," <https://learn.microsoft.com/entra/id-governance/entitlement-management-request-approve> (accessed Nov 9, 2026).
[^c09-em-idp-approvals]: Microsoft Learn, "Configure ID Protection-based approvals for access package requests in Entitlement Management (Preview)," <https://learn.microsoft.com/entra/id-governance/entitlement-management-configure-id-protection-approvals> (accessed Nov 9, 2026).
[^c09-em-irm-approvals]: Microsoft Learn, "Configure Insider risk management-based approvals for access package requests in Entitlement Management (Preview)," <https://learn.microsoft.com/entra/id-governance/entitlement-management-configure-insider-risk-management-approvals> (accessed Nov 9, 2026).
[^c09-myaccess-delegate]: Microsoft Learn, "Delegate approvals and access reviews in My Access (Preview)," <https://learn.microsoft.com/entra/id-governance/delegate-approvals-my-access> (accessed Nov 9, 2026).
[^c09-org-roles]: Microsoft Learn, "Govern access with an organizational role model," <https://learn.microsoft.com/entra/id-governance/identity-governance-organizational-roles> (accessed Nov 9, 2026).
[^c09-ar-manage]: Microsoft Learn, "Manage user access with access reviews," <https://learn.microsoft.com/entra/id-governance/manage-user-access-with-access-reviews>; and "Manage access with access reviews," <https://learn.microsoft.com/entra/id-governance/manage-access-review> (accessed Nov 9, 2026).
[^c09-ar-package]: Microsoft Learn, "Review access of an access package in entitlement management," <https://learn.microsoft.com/entra/id-governance/entitlement-management-access-reviews-review-access>; and "Self-review of an access package in entitlement management," <https://learn.microsoft.com/entra/id-governance/entitlement-management-access-reviews-self-review> (accessed Nov 9, 2026).
[^c09-apps-deploy]: Microsoft Learn, "Deploying policies for governing access to applications integrated with Microsoft Entra ID," section "Deploy entitlement management policies for automating access assignment," <https://learn.microsoft.com/entra/id-governance/identity-governance-applications-deploy> (accessed Nov 9, 2026).
[^c09-pim-complete]: Microsoft Learn, "Complete an access review of Azure resource and Microsoft Entra roles in PIM," <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-complete-roles-and-resource-roles-review> (accessed Nov 9, 2026).
[^c09-ar-self]: Microsoft Learn, "Review your access to groups & apps in access reviews," <https://learn.microsoft.com/entra/id-governance/review-your-access>; and "Review your access to resources in access reviews," <https://learn.microsoft.com/entra/id-governance/self-access-review> (accessed Nov 9, 2026).
[^c09-ar-multistage]: Microsoft Learn, "Using multi-stage reviews to meet your attestation and certification needs," <https://learn.microsoft.com/entra/id-governance/using-multi-stage-reviews> (accessed Nov 9, 2026).
[^c09-ca-exclusion]: Microsoft Learn, "Manage users excluded from Conditional Access policies," <https://learn.microsoft.com/entra/id-governance/conditional-access-exclusion> (accessed Nov 9, 2026).
[^c09-ar-recs]: Microsoft Learn, "Review recommendations for Access reviews," <https://learn.microsoft.com/entra/id-governance/review-recommendations-access-reviews> (accessed Nov 9, 2026).
[^c09-ar-guests]: Microsoft Learn, "Manage guest access with access reviews," <https://learn.microsoft.com/entra/id-governance/manage-guest-access-with-access-reviews>; and "Use Microsoft Entra ID Governance to review and remove external users who no longer have resource access," <https://learn.microsoft.com/entra/id-governance/access-reviews-external-users> (accessed Nov 9, 2026).
[^c09-ar-perform]: Microsoft Learn, "Review access to groups & applications in access reviews," <https://learn.microsoft.com/entra/id-governance/perform-access-review> (accessed Nov 9, 2026).
[^c09-inactive]: Microsoft Learn, "Manage inactive users using Lifecycle Workflows," <https://learn.microsoft.com/entra/id-governance/lifecycle-workflow-inactive-users>; and "How to manage inactive user accounts," <https://learn.microsoft.com/entra/identity/monitoring-health/howto-manage-inactive-user-accounts> (accessed Nov 9, 2026).
[^c09-b2b-allowdeny]: Microsoft Learn, "Allow or block invitations," <https://learn.microsoft.com/entra/external-id/allow-deny-list> (accessed Nov 9, 2026).
[^c09-guest-deploy]: Microsoft Learn, "Microsoft Entra ID Governance deployment guide to govern guest and partner access," <https://learn.microsoft.com/entra/architecture/governance-deployment-guest-access>; and "Plan new governance scenarios for business partners and external users with Microsoft ID Governance," <https://learn.microsoft.com/entra/id-governance/scenarios/govern-guest-lifecycle-new-project> (accessed Nov 9, 2026).
[^c09-sponsors]: Microsoft Learn, "Add sponsors to a guest user in the Microsoft Entra admin center - External ID," <https://learn.microsoft.com/entra/external-id/b2b-sponsors>; "Manage sponsored guests in My Account," <https://learn.microsoft.com/entra/id-governance/manage-sponsored-guests-my-access>; and "Manage unsponsored guests using Lifecycle Workflows (Preview)," <https://learn.microsoft.com/entra/id-governance/how-to-lifecycle-workflow-unsponsored-guest-removal> (accessed Nov 9, 2026).
[^c09-stale-guests]: Microsoft Learn, "Monitor and clean up stale guest accounts," <https://learn.microsoft.com/entra/identity/users/clean-up-stale-guest-accounts> (accessed Nov 9, 2026).
[^c09-apps-prepare]: Microsoft Learn, "Govern access for applications in your environment," section "Prerequisites before configuring Microsoft Entra ID and Microsoft Entra ID Governance for identity governance," <https://learn.microsoft.com/entra/id-governance/identity-governance-applications-prepare> (accessed Nov 9, 2026).
[^c09-ops-guide]: Microsoft Learn, "Microsoft Entra ID Governance operations reference guide," section "Assign owners to key tasks," <https://learn.microsoft.com/entra/architecture/ops-guide-govern> (accessed Nov 9, 2026).
[^c09-deploy-employee]: Microsoft Learn, "Microsoft Entra ID Governance deployment guide to assign employee access," section "Access review history report," <https://learn.microsoft.com/entra/architecture/governance-deployment-employee-access> (accessed Nov 9, 2026).
[^c09-quarantine]: Microsoft Learn, "Quarantine unsanctioned tenants," <https://learn.microsoft.com/entra/fundamentals/quarantine-unsanctioned-tenants> (accessed Nov 9, 2026).
[^c09-groups-lifecycle]: Microsoft Learn, "Configure the expiration policy for Microsoft 365 groups," <https://learn.microsoft.com/entra/identity/users/groups-lifecycle> (accessed Nov 9, 2026).
[^c09-get-lifecycle]: Microsoft Learn, "Get-MgGroupLifecyclePolicy" (permissions: Directory.Read.All, least privileged), <https://learn.microsoft.com/powershell/module/microsoft.graph.groups/get-mggrouplifecyclepolicy?view=graph-powershell-1.0> (accessed Nov 9, 2026).
[^c09-groups-naming]: Microsoft Learn, "Enforce a naming policy on Microsoft 365 groups in Microsoft Entra ID," <https://learn.microsoft.com/entra/identity/users/groups-naming-policy> (accessed Nov 9, 2026).
[^c09-groups-naming-m365]: Microsoft Learn, "Microsoft 365 Groups and Microsoft Teams naming policy," section "Licensing requirements," <https://learn.microsoft.com/microsoft-365/enterprise/groups-naming-policy> (accessed Nov 9, 2026).
[^c09-groups-settings]: Microsoft Learn, "Microsoft Entra cmdlets for configuring group settings," section "Template settings," <https://learn.microsoft.com/entra/identity/users/groups-settings-cmdlets> (accessed Nov 9, 2026).
[^c09-groups-restore]: Microsoft Learn, "Restore a deleted Microsoft 365 group or cloud security group in Microsoft Entra ID," <https://learn.microsoft.com/entra/identity/users/groups-restore-deleted> (accessed Nov 9, 2026).
[^c09-restore-object]: Microsoft Learn, "Restore-EntraDeletedDirectoryObject" (roles needed to restore deleted groups, including role-assignable groups), <https://learn.microsoft.com/powershell/module/microsoft.entra.directorymanagement/restore-entradeleteddirectoryobject?view=entra-powershell> (accessed Nov 9, 2026).
[^c09-feature-availability]: Microsoft Learn, "Microsoft Entra feature availability," section "Microsoft Entra ID" (Administration and hybrid identity: advanced group management), <https://learn.microsoft.com/entra/identity/authentication/feature-availability> (accessed Nov 9, 2026).
[^c09-azure-gov-pairing]: Microsoft Learn, "Cloud feature availability for US Government customers," section "Microsoft 365 integration," <https://learn.microsoft.com/azure/security/fundamentals/feature-availability> (accessed Nov 9, 2026).
[^c09-zt-tenants]: Microsoft Learn, "Configure Microsoft Entra for Zero Trust: Protect tenants and isolate production systems," recommendation "Permissions to create new tenants are limited to the Tenant Creator role" (the creator is assigned Global Administrator; a shadow identity platform outside governance; remediation: enable the restriction, assign Tenant Creator, review `Create Company` events in category `DirectoryManagement`), <https://learn.microsoft.com/entra/fundamentals/zero-trust-protect-tenants> (accessed Nov 11, 2026).
[^c09-default-perms]: Microsoft Learn, "What are the default user permissions in Microsoft Entra ID?," section "Restrict member users' default permissions," row "Restrict non-admin users from creating tenants," <https://learn.microsoft.com/entra/fundamentals/users-default-permissions> (accessed Nov 11, 2026).
[^c09-authz-tenants]: Microsoft Learn, "defaultUserRolePermissions resource type" (Microsoft Graph v1.0), property `allowedToCreateTenants`, <https://learn.microsoft.com/graph/api/resources/defaultuserrolepermissions?view=graph-rest-1.0>, and "Update authorizationPolicy" (permission `Policy.ReadWrite.Authorization`), <https://learn.microsoft.com/graph/api/authorizationpolicy-update?view=graph-rest-1.0> (both accessed Nov 11, 2026).
[^c09-governed-tenant]: Microsoft Learn, "Create a governed workforce tenant," section "Prerequisites" (Tenant Creator required regardless of the restriction setting; the default governance policy template establishes the governance relationship), <https://learn.microsoft.com/entra/id-governance/tenant-governance/how-to-create-tenant> (accessed Nov 11, 2026).
