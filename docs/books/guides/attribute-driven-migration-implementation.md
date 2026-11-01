---
title: "Attribute-Driven Migration: An Implementation Guide"
description: "A step-by-step guide to the cross-track foundation of the attribute-driven migration from Active Directory to Microsoft Entra ID, in the order the two technical deep-dive decks present it: read the OU tree, fix the attribute schema and the AD-to-Entra mapping, publish the coded slot register with one writer per slot, prove the attributes, map them through sync, build the dynamic group library and administrative units, set the Conditional Access personas and the device, server and non-person targeting conventions, bind PIV and CAC certificates, prove a mover across the tracks, cut over by attribute query and retire the OU tree, then keep the attributes true. Each gate has prerequisites, steps, a Validate step naming the validation kit check that proves it, rollback and evidence, and hands each track's own work to its implementation guide. One worked identifier, an enterprise person key such as a Mainframe PIN, runs through every gate."
doc-type: workbook-guide
audience: [Technical, Customer]
family: guides
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
aliases:
  - /docs/project-plans/developer-workbooks/attribute-driven-migration/implementation-guide.html
review-status: approved
reviewed-sha256: ec75481b8f65d65ccda06225e05ae40b2f2d1a1701059e232a6b8976e87052b0
last-reviewed: 2026-11-01
---
# Attribute-Driven Migration: An Implementation Guide

*The four tracks each have their own guide; this one builds what they all read: one schema, one writer per attribute, attributes proven before anything trusts them, and an OU tree that controls nothing by the time AD goes.*

::: {.callout-note}
## In this guide
The shared foundation of the [Attribute-Driven Migration guide](attribute-driven-migration.md), as gated steps you can run, in the order the two technical deep-dive decks present them. First, how to use the guide, a worked identifier that runs through every gate, the path on one page and the prerequisites. Then ten gates. Gate 0 reads the OU tree. Gate 1 fixes the schema and the coded slots. Gate 2 proves the attributes, and Gate 3 maps them through sync. Gate 4 builds the dynamic group library and administrative units. Gate 5 sets the Conditional Access personas and the conventions the device, server and non-person tracks build on. Gate 6 binds PIV and CAC certificates. Gate 7 proves a mover across the tracks. Gate 8 cuts over by attribute query and retires the OU tree, and Gate 9 keeps the attributes true. Each gate has prerequisites, steps, a **Validate** step, rollback and evidence. Where a track has its own implementation guide, this guide hands off to it rather than repeating it. Then where the kits stop, rollback, and a checklist.
:::

::: {.callout-tip}
## Download, present and schedule
**[attribute-driven-migration-implementation-guide.docx](../../../downloads/attribute-driven-migration-implementation-guide.docx)**: this guide as a Word document, regenerated on every site deploy.

**The decks it follows (about 18 minutes narrated each).** [Part 1, the model and the HR track](../../presentations/index.md#technical-attribute-driven-migration) ([▶ watch](../../presentations/watch.html?v=Attribute_Driven_Migration_Technical_Part_1_Narrated)) and [Part 2, devices, servers, non-person identities and running the migration](../../presentations/index.md#technical-attribute-driven-migration-part-2) ([▶ watch](../../presentations/watch.html?v=Attribute_Driven_Migration_Technical_Part_2_Narrated)).

**Deeper Dive Implementation.** Below the two overview decks, the three-part **Deeper Dive Implementation** series (about 15 minutes narrated each) walks the ten gates at working level: [Part 1, Gates 0–3](../../presentations/index.md#deeper-dive-attribute-driven-migration-part-1), [Part 2, Gates 4–6](../../presentations/index.md#deeper-dive-attribute-driven-migration-part-2) and [Part 3, Gates 7–9](../../presentations/index.md#deeper-dive-attribute-driven-migration-part-3).

**The schedule.** The [Attribute-Driven Migration project plan](../../project-plans/attribute-driven-migration.md) schedules these gates, with owners, decide-by weeks and the margin against each track plan and program gate it hands to. Each section below names the plan tasks it carries out.
:::

::: {.callout-note}
## This guide or the developer workbook?
This guide is for the people who **run** the migration: what has to be true at each gate, and how to prove it. Its companion, [Book 19 — Building the Attribute-Driven Migration](../b19-developer-workbook/index.md), is a developer workbook for the people who **build the software** the gates rely on: the HR middleware, Graph clients, validation kit checks, rule libraries, workflow extensions and drift pipelines, each with labs and tests. [This workbook or the implementation guide?](../b19-developer-workbook/index.md#workbook-or-guide) compares the two.
:::

## How to use this guide {#how-to-use-this-guide}

**What this guide owns, and what it hands off.** One OU tree holds four populations, and the companion guide moves them on [four tracks](attribute-driven-migration.md#four-tracks), each with its own source of truth. Each track already has its implementation guide and project plan:

| Track | Its implementation guide | Its project plan |
|---|---|---|
| HR: people | [Building Book 03's HR Pipeline](hcm-entra-implementation.md) (under review) builds the pipeline; [HR-Driven Identity: An Implementation Guide](hr-driven-identity-implementation.md) (draft) runs the lifecycle on it | [Identity Lifecycle & Provisioning](../../project-plans/identity-lifecycle.md) |
| Intune: end-user devices | [Intune Track Implementation](intune-track-implementation.md) | [Endpoint & Device Modernization](../../project-plans/endpoint-device.md), Phases 0 to 3 and 5 |
| Azure Arc: servers | [Azure Arc Track: Implementation Guide](arc-track-implementation.md) | [Endpoint & Device Modernization](../../project-plans/endpoint-device.md#phase-4-servers-under-azure-arc), Phase 4 |
| Non-person identities | [Non-Person Identity: An Implementation Guide](non-person-identity-implementation.md) | [Non-Person Identity Modernization](../../project-plans/non-person-identity.md) |

: The four tracks and where each is run {.striped .hover}

This guide owns what those four don't. It owns the attribute schema and the AD-to-Entra mapping, the coded slots, and the proof that the values are true. It owns sync, the dynamic group library with its guards, and the administrative units. It owns the Conditional Access personas and the targeting conventions the device, server and non-person tracks build on. It also owns the PIV binding, the mover proof, the cross-track cut-over, the retirement of the OU tree, and drift. Where a step belongs to a track, the step says which guide carries it and stops there.

**Where the facts come from.** Facts come from the linked chapters and from the companion guide, which rely on their own verification logs; this guide adds no new external facts (the validation kit's checks rest on the Microsoft Learn pages its README cites), and its [verification log](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/books/guides/_verification/attribute-driven-migration-implementation.md) traces each claim to its section. Statements marked *(design guidance)* are the program's recommendations. Preview features carry their stage. The audience is a civilian agency at FedRAMP Moderate, usually in Microsoft 365 GCC, where Entra ID runs in Microsoft's commercial cloud ([Book 14, Chapter 03](../b14-compliance/03-the-baseline-and-the-crosswalk.md#two-facts-not-one)). Codes such as `FIN-LED` stand in for the agency's own code lists, and attribute slots follow the [program attribute map](../b03-hr-identity/06-canonical-attribute-schema.md#program-attribute-map).

**The validation kit.** Each gate's **Validate** step names the read-only [validation kit](../../../downloads/validation-kit.zip) checks that prove it ([source](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/validation-kit)). The checks read Microsoft Graph, Azure Resource Graph or an export and report; none of them changes the tenant or the forest. This guide uses the HR, dynamic group, sync, Conditional Access and PIV checks directly. It also points to the Intune, Arc and non-person checks the track guides run.

| ID | What it reports |
|---|---|
| VK-HR-01 | Enabled member users with no `employeeId`, excluding listed exceptions with an owner |
| VK-HR-02 | Empty coded slots: organization code (`extensionAttribute10`), worker type (`11`) or position category (`12`) |
| VK-HR-03 | Counts per organization code, reconciled with an HR export |
| VK-HR-04 | Duplicate `employeeId` values |
| VK-HR-05 | Lifecycle Workflows: a hire or leave date in the past with no processing record (late HR data) |
| VK-HR-06 | Lifecycle Workflows execution limits set; workflow count against the 100 ceiling |
| VK-HR-07 | Attribute survey in Entra ID: fill rate of the key, worker type, department, mail, manager and coded slots against a threshold, and values that break the survey's rules |
| VK-DG-01 | Dynamic user groups whose rule lacks the `accountEnabled` and `userType` guards |
| VK-DG-02 | Rules that read display-name attributes instead of coded slots |
| VK-DG-03 | A rule tested against named users before a change (*Graph beta*) |
| VK-DG-04 | Shadow diff: a proposed dynamic group against the group it replaces |
| VK-DG-05 | Membership change over a threshold since the last snapshot |
| VK-DG-06 | Paused dynamic processing, and rules using the `memberOf` preview |
| VK-DG-07 | Administrative units whose dynamic rule doesn't mirror its group; restricted units listed with their reason |
| VK-SYNC-01 | Coded slots in an AD export compared with Entra ID for a sample, joined on `employeeId` |
| VK-SYNC-03 | Sync parity for the estate: the Start Kit's AD export against Entra ID, joined on the on-premises SID |
| VK-CA-01 | Conditional Access personas: the emergency-access group not excluded, a group outside the governed list, a group grant with no paired block |
| VK-PIV-01 | Pilot card holders with no `certificateUserIds` value, or only low-affinity values, by account, never by value |

: Validation kit checks this guide runs {.striped .hover}

Run them as the kit's README shows: for example `.\Invoke-ValidationKit.ps1 -OutputPath D:\Validation -Track HR, DG, SYNC, CA, PIV -InputPath D:\Inputs` with delegated sign-in and only the read scopes those checks need. A missing input makes a check *NotApplicable*, never *Pass*. The checks are illustrative and fixture-tested, not proven against a live tenant: run each one first in a test tenant. Three gates that had no kit check now have one that covers part of the gate: VK-SYNC-01 for sync (Gate 3), VK-CA-01 for the personas (Gate 5) and VK-PIV-01 for the PIV binding (Gate 6). Each needs an input the program keeps: a sample AD export, the governed-group and emergency-access lists, and the pilot card holder list. Their **Validate** steps name the report that still covers the rest, and [Where the kits stop](#where-the-kits-stop) lists what no check reads yet.

## One identifier through every gate {#one-identifier-through-every-gate}

The decks follow one budget analyst through a reassignment. This guide follows the same person's **enterprise person key** through every gate, because the key is what the whole foundation hangs on. The example is an agency that already has a long-standing enterprise identifier, a **Mainframe PIN**, which serves as both the person ID and the employee ID. Book 03 names it as the natural candidate for the enterprise person key ([Book 03, Chapter 04](../b03-hr-identity/04-attribute-authority.md#one-person-layered-identifiers)). The value used below, `MP0042137`, is a placeholder.

| Gate | What happens to the analyst's Mainframe PIN |
|---|---|
| 0 Read the tree | Found in AD in `employeeID` on most accounts, with gaps and a few hand-typed duplicates; the OU path still says where the analyst sits |
| 1 Schema and slots | Confirmed as the enterprise person key (the HR plan's decision), carried in `employeeId` in both directories; Core HCM's `PersonNumber` maps to it |
| 2 Prove | The analyst's enabled account matches exactly one worker record on `MP0042137`; no other account carries it |
| 3 Sync | The key flows unchanged from AD to Entra ID; it's the anchor for matching, never retyped |
| 4 Groups and units | Nothing reads the key in a rule; rules read the codes the key's record carries (`FIN-LED` in slot 10) |
| 5 Targeting | The device's record names its primary user by key, but no device rule reads it; a service principal the analyst sponsors records the sponsor as `MP0042137` |
| 6 PIV binding | The card management system ties the analyst's PIV certificate to the account holding `MP0042137`; the binding value itself is the certificate's, not the key |
| 7 Mover | A personnel action on `MP0042137` changes the organization code; every mechanism follows; the key itself never changes |
| 8 Cut-over | The analyst's population cuts over by attribute query; the account becomes cloud-mastered and still carries `MP0042137` |
| 9 Drift | The nightly comparison joins HR and the directory on `MP0042137`; any second account with that key is a finding |

: One enterprise person key through the gates (design guidance; the identifier decision is the agency's) {.striped .hover}

Where the key is already issued to contractors with their PIV credential, contractors are keyed exactly like employees, and a contractor who becomes an employee keeps the same key ([Book 03, Chapter 06](../b03-hr-identity/06-canonical-attribute-schema.md#one-fact-one-authority)). Whatever key is chosen has to fit `employeeId`, which holds at most 16 characters ([Book 03, Chapter 04](../b03-hr-identity/04-attribute-authority.md#one-person-layered-identifiers)).

## The path on one page {#the-path-on-one-page}

| Gate | Stage in the companion guide | Done when | Validate with | Plan tasks |
|---|---|---|---|---|
| [0 The tree read](#gate-0-read-the-ou-tree) | 0 | The tree's encoding is in Git, split by track, with a decision for every group | Start Kit counts and attribute survey; VK-INT-07 (beta, Intune track); VK-NPI-06 (handed to the non-person track) | A0.1–A0.4, AG0 |
| [1 Schema and slots signed](#gate-1-schema-and-slots) | 1 | Every attribute that drives access has one store, one writer and one owner | Start Kit attribute survey; VK-HR-01, VK-HR-04, VK-HR-07 | A1.1–A1.4, D-A1, D-A2, AG1 |
| [2 Attributes proven](#gate-2-prove-the-attributes) | 2 | The correlation threshold is met on the pilot; other writers removed; logs leaving Entra ID | VK-HR-01 to 04, VK-HR-07; the HCM correlation report | A2.1–A2.3, D-A3, AG2 |
| [3 Attributes flowing](#gate-3-map-the-attributes-through-sync) | 3 | Every slot arrives in Entra ID as HR sent it; shadow differences explained | VK-SYNC-01, VK-SYNC-03, with the sync reconciliation report | A3.1, AG3 |
| [4 Group library and units](#gate-4-the-dynamic-group-library-and-administrative-units) | 4, 5 | Every rule on codes with guards, tested and shadowed; every unit mirrors its group | VK-DG-01 to 07 | A4.1–A4.4, D-A4, AG4 |
| [5 Targeting conventions](#gate-5-personas-and-targeting-conventions) | 6 | Personas from codes, grants paired with blocks; device, server and non-person conventions handed off | VK-CA-01 for personas; VK-INT-01, VK-ARC-01, VK-NPI-01 in the track guides | A5.1–A5.4, D-A5, AG5 |
| [6 PIV binding](#gate-6-piv-and-cac-binding) | PIV | Every pilot card holder bound; high affinity piloted | VK-PIV-01 | A6.1, A6.2, D-A6, D-A7, AG6 |
| [7 Mover proven](#gate-7-prove-a-mover-across-the-tracks) | Worked example | One personnel action changes access only through the attributes | VK-DG-05, VK-HR-03; the workflow's run history | A7.1, AG7 |
| [8 OU tree retired](#gate-8-cut-over-and-retire-the-ou-tree) | 7 | Every population cut over by query; nothing reads OU placement | Start Kit wave lists; VK-HR-01 to 04 and VK-HR-07 per wave; VK-HR-05, 06, VK-DG-04, VK-DG-05 | A8.1–A8.4, AG8 |
| [9 Attributes kept true](#gate-9-keep-the-attributes-true) | 8 | Drift scans running, findings closed at the source, zero-action plan | VK-HR-03, VK-DG-05, VK-DG-06, VK-DG-07, and each track's standing checks | A9.1–A9.3, D-A8, AG9 |

: The ten gates of the attribute foundation {.striped .hover}

The gates are this guide's numbering. The companion guide numbers [stages](attribute-driven-migration.md#the-path-on-one-page), each book numbers its own phases, and the companion guide's [phase alignment](attribute-driven-migration.md#how-the-books-phase-numbers-line-up) lines them up.

## Prerequisites {#prerequisites}

**People, one decider per row.** The deciders are the ones the decks name, taken from the two responsibility matrices ([Book 02, Chapter 06](../b02-identity/06-who-owns-the-migration.md#the-responsibility-matrix); [Book 03, Chapter 07](../b03-hr-identity/07-who-owns-workforce-identity.md#the-responsibility-matrix)):

| Role | Decides here |
|---|---|
| Identity engineering | Sync engine and sign-in method, the delegation model, unit restriction, each wave's go or no-go |
| ICAM governance body | The authority map, the person key, the binding writer after AD |
| HR | The code lists, and every correction to a wrong value |
| Data architect | The schema and the slot register |
| Application owners | Their own access rules, and their service accounts' conversion |
| CISO | Control requirements, the persona set, PIV affinity, drift severity and every drift finding |
| Authorizing official | The correlation threshold, through the agency's risk governance |

: Who decides what in this guide {.striped .hover}

**Licenses and cloud.** API-driven inbound provisioning comes with Entra ID P1, P2 and ID Governance. Lifecycle Workflows need ID Governance or Entra Suite. Dynamic administrative units are documented for the global cloud, which GCC uses, and not for GCC High or DoD ([companion guide, licensing and GCC](attribute-driven-migration.md#building-the-attributes-from-federal-hr-2.0); [administrative unit limits](attribute-driven-migration.md#administrative-units)).

**Tools, all read-only until a gate says otherwise.**

- The [Start Kit](../../../downloads/start-kit.zip) for the forest: OUs and their delegations, GPOs with their domain, OU and site links, users, groups, computers and service accounts ([Book 00, Chapter 08](../b00-orientation/08-pre-flight-and-assessment.md)). Its [attribute survey](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/start-kit#how-it-surveys-attributes-and-builds-waves) reads the key, the coded slots and the other attributes this guide depends on across every domain tree, through the Global Catalog, and its wave lists turn them into Gate 8's waves.
- The [validation kit](../../../downloads/validation-kit.zip) for the tenant.
- The [HCM-to-Entra example code](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/hcm-entra), which applies the attribute map and code lists and refuses bad records ([research guide, the example code](hcm-entra-implementation.md#the-example-code)), and whose [correlation tool](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/hcm-entra#correlate-hr-with-the-directories) matches the HR extract to both directories, record by record, for Gate 2.
- The [Microsoft automation reference](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/ms-automation), whose `ca-export` task exports the Conditional Access policies for Gate 5.

**Before Gate 0.** The program's Phase 0 is approved, the read-only assessment identities exist, and logs can leave Entra ID from the first change (Gate 2 makes that a gate item, but start now) ([Book 03, Chapter 11](../b03-hr-identity/11-drift-metrics-and-evidence.md#the-evidence-each-event-leaves)).

## Gate 0: read the OU tree {#gate-0-read-the-ou-tree}

*Plan tasks A0.1 to A0.4 and AG0. Companion guide [Stage 0](attribute-driven-migration.md#stage-0-read-what-the-ou-tree-encodes); deck Part 1, slide 12.*

The target has to reproduce intent, not structure, and you can't reproduce what you haven't read. The OU tree did four jobs at once: delegation, policy scope, accountability and security scope ([Book 01, Chapter 04](../b01-transformation-arc/04-identity-transformation.md#the-identity-claim)). This gate is entirely read-only.

**Prerequisites.** Tier A read access to the forest, as the Start Kit's README sets out; a Git repository for the inventory.

**Steps.**

1. **Export the tree (A0.1).** Run the Start Kit. Keep the OU hierarchy with each OU's size and its non-inherited access-control entries, the delegations someone made by hand ([Book 02, Chapter 08](../b02-identity/08-assessing-the-forest.md#ou-hierarchy-and-delegation)). Keep the GPO inventory with links at domain, OU **and site**: a site-linked GPO looks unlinked to an OU-only search ([what to collect](../b02-identity/08-assessing-the-forest.md#what-to-collect)). Record what read-only discovery couldn't see ([Book 02, Chapter 07](../b02-identity/07-read-only-discovery.md#recording-what-read-only-discovery-couldnt-see)).
2. **Tag every OU and every GPO half with its track (A0.1).** User OUs to HR, computer OUs to Intune or Arc, service accounts to the non-person track. A GPO's user-configuration and computer-configuration halves can belong to different tracks ([companion guide, Stage 0](attribute-driven-migration.md#stage-0-read-what-the-ou-tree-encodes)).
3. **Decide every group (A0.2).** Keep synced, convert to cloud-only, convert to dynamic, or retire ([Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md#the-per-group-decision)). Convert only groups whose membership really follows department, location or role ([converting static groups](../b02-identity/09-building-the-entra-target.md#converting-static-groups-to-dynamic-groups)).
4. **Draft the OU-to-unit mapping (A0.3).** Each OU function goes somewhere: GPO scoping to Conditional Access and Intune, delegation to administrative units, logical organization to attributes and dynamic groups ([Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md#organizational-units)). Delegation over servers becomes Azure RBAC scopes instead ([Arc track](attribute-driven-migration.md#arc-track)).
5. **Split Group Policy by track and hand it off (A0.4).** User halves go to the HR track's policy design (Gate 5). Computer halves go to the Endpoint plan, which analyses them in the [Intune guide's Gate 3](intune-track-implementation.md#gate-3-the-computer-half-of-group-policy) and the [Arc guide's Step 4](arc-track-implementation.md#step-4-policy-and-configuration).
6. **Hand the service accounts over.** The tree's service accounts, MSAs and gMSAs go to the [non-person guide's Step 1](non-person-identity-implementation.md#step-1-inventory-every-non-person-identity) with their OU placement and delegations. That guide inventories and classifies them; this one doesn't.

*The running example.* The export shows `MP0042137` in `employeeID` on the analyst's account, and shows that the finance OU's help desk was delegated password reset by hand. That delegation is what Gate 4's division unit has to reproduce.

::: {.callout-important}
## Validate (Gate 0: the tree read)
- The Start Kit's summary counts OUs and their delegations, GPOs (empty, unlinked, conflicting, site-linked), users, groups, computers and service accounts, each traced to its source file. A count that couldn't be collected says *not collected*, never zero.
- The Start Kit's **attribute survey** (`Get-FMPAttributeSurvey`, part of the run) shows where the key and the codes live today: `FillRate.csv` per domain, and in `ValueQuality.csv` the keys held twice, display strings in coded slots and managers that can't be resolved. `GcCoverage.csv` records which attributes the Global Catalog held and which were read from each domain's controllers. Its `ad-user-export.csv` is the AD export Gates 2 and 3 read.
- **VK-INT-07** (*Graph beta*, with `-IncludeBeta`; run by the Intune track) lists each GPO imported into Intune's Group Policy analytics with its migration readiness. It flags those targeted in AD that aren't *complete*, and, with `gpo-scope.csv`, every in-scope GPO that was never imported. Its rows feed the computer half of the GPO split.
- **VK-NPI-06** (run by the non-person track) lists the AD service accounts with passwords that never expire, old passwords, SPNs or a type other than gMSA. Its rows are the ones step 6 hands over.
- No kit check reads the per-group decision or the track tagging: the evidence is the decision record in Git, one row per group and per GPO half.
- Gate owner: identity engineering lead. Gate 0 lands before the program's G0, and before the Endpoint and Non-Person plans' own Gate 0s, which use its export.
:::

**Rollback.** Nothing to roll back: nothing was written.

**Evidence.** The inventory and its run log in Git; the group decision record; the OU-to-unit mapping; the track tag for every OU and GPO half. Two traps to note in the record: site-linked GPOs, and `adminCount`, which overstates current privilege because it stays set after an account leaves a protected group ([Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md#adminsdholder-and-protected-groups)).

## Gate 1: schema and slots {#gate-1-schema-and-slots}

*Plan tasks A1.1 to A1.4, decisions D-A1 and D-A2, gate AG1. Companion guide [Attributes](attribute-driven-migration.md#attributes) and [Stage 1](attribute-driven-migration.md#stage-1-source-the-attributes); deck Part 1, slides 8 to 10 and 14 to 18.*

Every later mechanism reads these values, so this gate decides where each attribute lives, what it's called, what it holds and who may write it. One HR-sourced stamp drives group membership, delegation, policy, licensing and drift detection; if it's wrong, all five are wrong at once ([Book 01, Chapter 04](../b01-transformation-arc/04-identity-transformation.md#what-the-attributes-drive)).

**Prerequisites.** Gate 0; from the [Identity Lifecycle plan](../../project-plans/identity-lifecycle.md), the enterprise person key (D-I1) and the signed attribute authority map (I1.2). The HR plan owns both. This gate builds on them and doesn't re-decide them.

**Steps.**

1. **Inventory AD's attributes (A1.1).** For each attribute that drives access today: how fully it's populated, who writes it, and which `extensionAttribute` slots are free. The carriers have to be free before they can carry codes ([Book 03, Chapter 12](../b03-hr-identity/12-execution-plan.md#phase-1-attribute-authority-and-schema)).
2. **Map AD to Entra ID, per object type (A1.2).** Use the companion guide's [comparison with AD](attribute-driven-migration.md#compared-with-active-directory). `distinguishedName` comes across but must never drive policy, because it is the placement being left behind. Rules can't read `manager` or `employeeType`, which is why the schema carries coded copies. The disabled bit becomes `accountEnabled`, which every access rule requires. Kerberos SPNs stay in AD until their workloads move, and `adminCount` gives way to roles and PIM.
3. **Pick a store for each attribute (D-A1).** Use the [store table](attribute-driven-migration.md#the-attribute-stores-in-the-order-to-reach-for-them), in its order. Native properties come first, then extension attributes 1 to 15 for what rules read, then directory extensions when more slots are needed. Custom security attributes hold sensitive values that rules don't need. Devices use device properties, servers Azure tags, and the PIV binding `certificateUserIds`. Pick the store by who has to read it. The data architect decides.
4. **Fix the coded slots (D-A2, A1.3).** Use the [program attribute map](../b03-hr-identity/06-canonical-attribute-schema.md#program-attribute-map): organization code, worker type code and position category in `extensionAttribute10` to `12`, with region, cost center, division, account type, clearance and `DoNotSync` in their own slots. On devices, tier, role and environment go in the device's own extension attributes ([Book 05, Chapter 08](../b05-devices/08-gpo-to-intune-policy-migration.md#the-device-attribute-schema)). Codes, never display strings, go in anything a rule reads ([Book 03, Chapter 06](../b03-hr-identity/06-canonical-attribute-schema.md#design-rules)). Publish the register with one row per slot: the writer, the owner of the code list, and what reads it. HR owns the code lists.
5. **Name the single writer for every slot (A1.3).** The provisioning service is the only writer of every schema field. List the help desk, self-service and Exchange-admin write paths to the access slots for removal at Gate 2 ([Book 03, Chapter 06](../b03-hr-identity/06-canonical-attribute-schema.md#writers)).
6. **Name the other tracks' authorities (A1.4).** Devices: the procurement record, through the Autopilot group tag and the device provisioning service. Servers: the asset record, through Arc onboarding tags. Non-person identities: the owning system's record. None of them is HR ([companion guide, Stage 1](attribute-driven-migration.md#stage-1-source-the-attributes)). The tracks build on these in their own guides: the [Intune guide's Gate 1](intune-track-implementation.md#gate-1-device-sources-and-the-single-writer), the [Arc guide's Step 2](arc-track-implementation.md#step-2-the-tag-taxonomy-and-resource-groups) and the [non-person guide's prerequisites](non-person-identity-implementation.md#prerequisites).
7. **Fix the facts HR doesn't supply.** Contractors aren't in the HR system, so each of their facts gets its own authority ([Book 03, Chapter 06](../b03-hr-identity/06-canonical-attribute-schema.md#one-fact-one-authority)). Where someone signs in from is a sign-in signal, not an HR fact. The table in the companion guide's [Building the attributes from Federal HR 2.0](attribute-driven-migration.md#building-the-attributes-from-federal-hr-2.0) lists each one and its writer.

**Build for the HR source to change.** Federal HR 2.0 will supply most federal employees' attributes. No OPM document specifies how the platform feeds the agency's directory, so the Entra design is the agency's own ([Book 03, Chapter 03](../b03-hr-identity/03-federal-hr-2-0.md#what-opm-requires-and-what-it-leaves-to-the-agency)). Four choices make the switch a source swap rather than a redesign. Key on the agency's own key, such as the Mainframe PIN, not on the source's person number. Map to OPM's standard data elements and codes. Keep one door into the directory. Don't build against feed shapes the memo expects to retire ([companion guide](attribute-driven-migration.md#building-the-attributes-from-federal-hr-2.0)). The pipeline itself is the HR track's: [Building Book 03's HR Pipeline](hcm-entra-implementation.md#part-3-the-mapping).

*The running example.* `MP0042137` is the analyst's key in `employeeId` in both directories. Core HCM's `PersonNumber` maps to it in the middleware. Slot 10 will carry `FIN-LED`, and slot 11 the worker type code for an employee.

::: {.callout-important}
## Validate (Gate 1: schema and slots signed)
- **VK-HR-04** reports zero duplicate `employeeId` values in the tenant, and **VK-HR-01** lists every enabled account without one. Together they measure the key's carrier before anything depends on it. Expect findings here: Gate 2 closes them.
- The A1.1 inventory comes from the Start Kit's attribute survey: `FillRate.csv` for how fully each attribute is populated, per domain tree, and `SlotUsage.csv` for which of `extensionAttribute1` to `15` are free, in use by something else, or already coded. **VK-HR-07** gives the same fill rates and value rules for Entra ID, so the two sides compare. The survey reads values, not writers: who writes each attribute still comes from the delegation export and the audit log.
- No kit check reads the schema itself. The evidence is the signed schema and slot register: for every attribute that drives access, its store, its one writer, its owner and its readers, in all four tracks.
- Gate owner: the ICAM governance body. Gate 1 lands before the program finalizes its attribute taxonomy (P1.1).
:::

**Rollback.** A slot assignment can be changed until a rule reads it; after that, a change means rewriting every rule, filter and policy that reads the slot. That's why the register is signed before Gate 4.

**Evidence.** The authority map (from the HR plan), the schema, the slot register and the AD-to-Entra mapping, each signed and in Git. The privacy basis and the minimized attribute set are Book 03's Phase 1 gate items as well ([Book 03, Chapter 07](../b03-hr-identity/07-who-owns-workforce-identity.md#the-privacy-office)).

## Gate 2: prove the attributes {#gate-2-prove-the-attributes}

*Plan tasks A2.1 to A2.3, decision D-A3, gate AG2. Companion guide [Stage 2](attribute-driven-migration.md#stage-2-prove-the-attributes-are-true-before-anything-depends-on-them); deck Part 1, slide 19.*

A bad HR record becomes bad access faster than any ticket queue. Everything downstream trusts these values, so they're proved true before any rule reads them ([Book 03, Chapter 12](../b03-hr-identity/12-execution-plan.md#sequencing-principle)).

**Prerequisites.** Gate 1. From the HR plan: HR data baselined, `employeeId` populated and orphan candidates owned (I1.5). This gate measures the result across the tracks; correcting HR data is the HR plan's job.

**Steps.**

1. **Baseline coverage (A2.1).** Run VK-HR-01 to 04 against the pilot cohort and then the estate. Run the device and server coverage checks the track guides use too: VK-INT-01 for device slots and VK-ARC-01 for tags. They show how far each track's writer has to go. Fix every wrong value at the source, never in the copy ([Book 03, Chapter 04](../b03-hr-identity/04-attribute-authority.md#authoritative-versus-derived-attributes)).
2. **Match every enabled account to a worker record before the first full sync.** The match is what prevents duplicate identities at go-live ([Book 03, Chapter 05](../b03-hr-identity/05-the-provisioning-pipeline.md#the-source-oracle-fusion-cloud-hcm)). An unmatched enabled account is an orphan candidate with an owner, or it goes on a dated exception list. The HCM example's [correlation tool](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/hcm-entra#correlate-hr-with-the-directories) does the match: the HR extract against the Start Kit's AD export and an Entra ID export, on the key.
3. **Decide the threshold (D-A3).** The agency sets it through its risk governance. 99% of the pilot cohort is a proposed starting point, not a rule, and a risk-tiered threshold is usually better ([Book 03, Chapter 12](../b03-hr-identity/12-execution-plan.md#sequencing-principle)).
4. **Remove the other writers (A2.2).** In AD, remove write rights on the target OUs and Exchange's custom-attribute cmdlets. In Entra ID, remove the help desk and self-service paths to the access slots. From here on, any other write is drift ([Book 03, Chapter 06](../b03-hr-identity/06-canonical-attribute-schema.md#writers)).
5. **Route logs out (A2.3).** Send Entra ID's sign-in, audit and provisioning logs outside Entra ID before the pilot's first change. Their retention is far shorter than federal records schedules, and it isn't retroactive ([Book 03, Chapter 11](../b03-hr-identity/11-drift-metrics-and-evidence.md#the-evidence-each-event-leaves)).

The non-person equivalent of this gate, correlating every service account and service principal to an owner and a reason, runs in the [non-person guide's Step 1](non-person-identity-implementation.md#step-1-inventory-every-non-person-identity). The device equivalent, the read-only correlation pass across the device records, is in [Book 05, Chapter 03](../b05-devices/03-where-device-and-server-data-lives.md#a-read-only-correlation-pass).

*The running example.* VK-HR-01 finds the analyst's account correlated. VK-HR-04 finds one other account with `MP0042137`, an old test account. HR confirms which record is real, and the second account is disabled and listed. It isn't deleted.

::: {.callout-important}
## Validate (Gate 2: attributes proven for the pilot)
- **VK-HR-01** reports every enabled member account correlated or on the exception list, and every exception has an owner (an exception with no owner doesn't count).
- **VK-HR-02** reports the coded slots populated for the pilot cohort at the agreed threshold.
- **VK-HR-03** reconciles the counts per organization code with an HR export.
- **VK-HR-04** reports zero duplicate keys.
- **VK-HR-07** reports the survey attributes populated at the threshold, and no value that breaks a rule: whitespace, a key outside the agency's format, a code off the list, a display string in a coded slot, a manager disabled or without a key.
- The **correlation report** (`correlation-report.json`) shows every key matched, or quarantined with a decision. Its rates, active workers matched and enabled accounts matched, are what the threshold (D-A3) is measured against. Every `matched_with_conflicts` row is closed in the HR record, and every `directory_only` account has an owner or a dated exception. The report holds keys and statuses only; the quarantine file holds the personal data and stays in the audit store.
- Expect a burst of high-severity findings in the first month of a new pipeline: that's the measurement working ([Book 03, Chapter 11](../b03-hr-identity/11-drift-metrics-and-evidence.md#drift-between-hr-and-the-directory)).
- Gate owner: the CISO.
:::

**Rollback.** Restore a removed write permission through a recorded change, for a named reason and an end date. A corrected HR value is corrected again at the source, never in the directory.

**Evidence.** The validation kit's run folder (results, summary and per-check details); the correlation report; the threshold decision; the exception list with owners and dates; the change records that removed the other writers; the log routing configuration.

## Gate 3: map the attributes through sync {#gate-3-map-the-attributes-through-sync}

*Plan task A3.1, gate AG3. Companion guide [Stage 3](attribute-driven-migration.md#stage-3-map-the-attributes-through-sync); deck Part 1, slides 16 and 20.*

This gate covers the plumbing between HR, AD and Entra ID while they coexist. Its failures are quiet.

**Prerequisites.** Gate 1 for the slot register. The HR plan's pipeline and its HR feed live for the foundation scope (its Gate 3). The middleware, the provisioning apps and shadow mode are the HR track's, built through the [implementation guide's Part 1](hcm-entra-implementation.md#part-1-the-entra-side).

**Steps.**

1. **Know the two landing zones.** For most users today, HR writes into AD through the provisioning agent and sync carries the values up, so the Entra copies are read-only. For cloud-mastered users, HR writes Entra ID directly. The two converge population by population ([companion guide](attribute-driven-migration.md#building-the-attributes-from-federal-hr-2.0); [Book 03, Chapter 05](../b03-hr-identity/05-the-provisioning-pipeline.md#two-landing-zones)). Use the same carrier in both, so a rule never has to know which zone a user came from.
2. **Choose the engine.** Cloud Sync unless a Connect-only requirement applies, with password hash sync everywhere. Identity engineering decides ([Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md#choosing-and-configuring-the-sync-engine)).
3. **Map the slot register through sync (A3.1).** Put every carrier in the provisioning apps' target lists. Map the dates for AD-landed users (slots 2 and 3 to `employeeHireDate` and `employeeLeaveDateTime`). Add the transitional rule that derives account type (slot 7) from OU placement, and record that Gate 8 removes it. Add the `DoNotSync` scoping filter on slot 15 ([Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md#attribute-flow-and-transformations); [filtering](../b02-identity/09-building-the-entra-target.md#filtering)).
4. **Block soft and hard match outside a planned window.** A match can overwrite cloud values with stale on-premises ones, so clean AD first ([Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md#soft-match-and-hard-match)).
5. **Send the whole record every time.** An omitted attribute in a `/bulkUpload` record can clear the target value if clearing is enabled ([Book 03, Chapter 05](../b03-hr-identity/05-the-provisioning-pipeline.md#the-middleware-five-duties-per-event)).
6. **Check the Connect Sync deadline.** A Connect Sync server that isn't on 2.6.84.0 with application-based authentication stops synchronizing on April 7, 2027 ([Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md#cloud-sync-or-connect-sync)).

*The running example.* The analyst's record arrives in AD with `FIN-LED` in slot 10 and the hire date in slot 2. Sync carries both up, and the Entra copy matches what HR sent.

::: {.callout-important}
## Validate (Gate 3: attributes flowing)
- **VK-SYNC-01** compares the coded slots for a sample, exported from AD (`ad-slot-export.csv`), with the same slots in Entra ID, joined on `employeeId`. It reports zero sample rows with no Entra user, zero keys held twice, and zero slots that differ. It reads values, not the sync configuration, so the rest of the evidence still comes from the reconciliation report ([Where the kits stop](#where-the-kits-stop)). That's Book 02's Phase 1 gate: object counts within ±1%, no sync errors, and an attribute spot check ([Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md#phase-1-sync-deployment-and-initial-sync)). Add Book 03's Phase 3 gate: the initial full sync reconciled before deltas, shadow mode with every difference between the pipeline and the directory explained, and zero unmatched-record creations ([Book 03, Chapter 12](../b03-hr-identity/12-execution-plan.md#phase-3-hybrid-go-live-pilot)).
- **VK-SYNC-03** does the same for the whole estate. It joins the Start Kit's `ad-user-export.csv` to Entra ID on the on-premises SID and reports zero users in sync scope missing from Entra ID, zero marked `DoNotSync` that synced anyway, zero matched users that no longer sync, zero synced users with no AD object, and zero attributes that differ. Name the domains the sync engine reads in `SyncScopeDomains`: the check doesn't read the engine's OU or group filters.
- **VK-HR-02** and **VK-HR-03**, re-run after the first full sync, show the slots arrived: the coverage and the counts per organization code should match Gate 2's.
- Gate owner: identity engineering lead.
:::

**Rollback.** Turn the scoping filter back to exclude the population and let the next cycle remove the values from scope. Don't delete synced users in Entra ID; the next sync restores them ([Book 03, Chapter 08](../b03-hr-identity/08-joiner-mover-leaver.md#deletion)).

**Evidence.** The sync configuration export, the reconciliation report, the shadow-mode difference log with each difference explained, VK-SYNC-01's result for the sample, VK-SYNC-03's for the estate, and the before and after VK-HR-02 and VK-HR-03 results.

## Gate 4: the dynamic group library and administrative units {#gate-4-the-dynamic-group-library-and-administrative-units}

*Plan tasks A4.1 to A4.4, decision D-A4, gate AG4. Companion guide [Stage 4](attribute-driven-migration.md#stage-4-materialize-ou-subtrees-as-dynamic-groups), [Stage 5](attribute-driven-migration.md#stage-5-delegate-with-administrative-units) and [dynamic user group dangers](attribute-driven-migration.md#dynamic-user-groups-hr-track); deck Part 1, slides 21 to 26.*

Instead of asking who sits under the Finance branch, you ask who carries the Finance code. Whoever can write an attribute controls the access it grants, so this gate comes after Gate 2's removal of the other writers.

**Prerequisites.** Gate 1 (the slot register), Gate 0's per-group decision and OU-to-unit mapping. For the shadow comparison, live pilot data: Gate 3 and the program's pilot sync (P2.1).

**Steps: the group library.**

1. **Write every governed rule on one of two patterns (A4.1).** A node query on one organization code, with `-in` for a roll-up, or a functional query that crosses organization with another coded attribute such as position category ([Book 01, Chapter 04](../b01-transformation-arc/04-identity-transformation.md#the-two-query-patterns)).
2. **Guard every access rule.** Every rule requires `accountEnabled` and excludes guests and agents' user accounts explicitly ([Book 03, Chapter 10](../b03-hr-identity/10-from-attributes-to-access.md#rule-patterns)). Rules read codes, never display names. A rule written on a display string breaks the next time someone retypes it ([Book 06, Chapter 17](../b06-data-platform/17-dynamic-membership-delegation-and-privilege.md#choosing-the-attributes)).
3. **Flatten nesting, and don't use `memberOf`.** Flatten nested chains instead of rebuilding them ([Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md#nested-groups)). The `memberOf` rule preview ends on November 3, 2026, and groups that use it freeze ([companion guide, limits](attribute-driven-migration.md#limits)).
4. **Keep privileged groups assigned.** Privileged groups can't be dynamic. Privilege stays assigned and time-bound, and HR decides only eligibility ([companion guide, limits](attribute-driven-migration.md#limits)).
5. **Test before production (A4.2).** Test each rule against named users who should and shouldn't match. Put rule changes under change control, because one edit can remove hundreds of people at once ([Book 06, Chapter 17](../b06-data-platform/17-dynamic-membership-delegation-and-privilege.md#writing-naming-and-testing-rules)).
6. **Shadow on the pilot (A4.4).** Compare each dynamic group with the group it replaces and explain every add and remove before any rule grants production access. Turn on membership-delta alerts ([companion guide, dangers](attribute-driven-migration.md#dynamic-user-groups-hr-track)).

**Steps: administrative units.**

7. **Decide restriction before each unit exists (D-A4).** The default is no. Restriction can't be changed afterward, and it takes the unit's members out of PIM, entitlement management, Lifecycle Workflows and access reviews ([Book 02, Chapter 05](../b02-identity/05-delegation-without-ous.md#restricted-management-a-per-au-decision)).
8. **Build the unit registry (A4.3).** Use three tiers: readers across the tenant, then department units, then division units, each with a dynamic rule that mirrors its group's rule. Division units read the division code in slot 6 ([Book 02, Chapter 05](../b02-identity/05-delegation-without-ous.md#division-aus-tier-3-created-on-demand)). Assign scoped roles to role-assignable groups whose members are PIM-eligible ([role assignment matrix](../b02-identity/05-delegation-without-ous.md#role-assignment-matrix)). Create each unit and its scoped assignment before the groups it holds ([Book 06, Runbook R07](../b06-data-platform/r07-groups-aus-and-the-conditional-access-perimeter.md#sequencing-the-administrative-unit-comes-first)).
9. **Know what a unit doesn't do.** Units don't nest, so the tree becomes a flat set. They limit who can change members, not who can see them. Only some roles can be scoped to a unit. In GCC High and DoD, where dynamic units aren't available, an automation job has to keep membership current ([companion guide, administrative units](attribute-driven-migration.md#administrative-units)).

Dynamic **device** groups are the Intune track's, on the device's own attributes. They're designed in the [Intune guide's Gate 2](intune-track-implementation.md#gate-2-the-targeting-design), under the conventions Gate 5 sets.

*The running example.* The analyst lands in the finance node group through `FIN-LED` and in a database reader group through a functional rule. The analyst also lands in the finance division unit, whose help desk can reset the analyst's password. That reproduces the hand delegation Gate 0 found.

::: {.callout-important}
## Validate (Gate 4: group library and units designed)
- **VK-DG-01** reports zero dynamic user groups without the `accountEnabled` and `userType` guards.
- **VK-DG-02** reports zero rules that read `department`, `jobTitle` or `companyName` instead of coded slots.
- **VK-DG-03** passes every named-user test in `rule-tests.json` (*Graph beta*; delegated only, as Groups Administrator).
- **VK-DG-04** reports, for each pair in `shadow-pairs.csv`, every add and remove, each with its explanation in the record.
- **VK-DG-06** reports no paused processing and no rule using `memberOf`.
- **VK-DG-07** reports every unit's rule mirroring its group's rule, and every restricted unit listed with its reason and decision reference.
- **VK-DG-05** has taken its first snapshot, so later runs can alert on membership change.
- Gate owner: identity engineering lead. The design lands before the program's group design (P1.2). The shadow comparison closes before the program assigns the pilot's policies (P2.2).
:::

**Rollback.** A new dynamic group grants nothing until it's assigned, so roll back by unassigning it and leaving the group it replaces in place. A rule change is reverted through change control from the rule history in Git. Restriction can't be rolled back, which is why it's decided first.

**Evidence.** The rule library and unit registry in Git; the kit's results for VK-DG-01 to 07; the shadow diff with every difference explained; the restriction decision per unit.

## Gate 5: personas and targeting conventions {#gate-5-personas-and-targeting-conventions}

*Plan tasks A5.1 to A5.4, decision D-A5, gate AG5. Companion guide [Stage 6](attribute-driven-migration.md#stage-6-replace-gpo-inheritance-with-conditional-access-and-intune-targeting), [Beyond users](attribute-driven-migration.md#beyond-users) and the [crosswalk](attribute-driven-migration.md#object-types-stores-writers-and-consumers); deck Part 1, slide 24, and Part 2, slides 2 to 15.*

Group Policy inheritance retires here. The risk is policies that look strict but restrict nothing. This gate sets the personas for people and the conventions the other three tracks build their targeting on. Those tracks run the targeting itself in their own guides.

**Prerequisites.** Gate 1's slot register. Gate 0's split of Group Policy by track.

**Steps: people.**

1. **Build personas from coded attributes (A5.1).** For example, internals and externals come from the worker type code in slot 11 ([Book 04, Chapter 03](../b04-access/03-the-conditional-access-model.md#personas)).
2. **Pair every grant with a block.** A grant policy on its own restricts nothing for anyone outside its group ([Book 04, Chapter 03](../b04-access/03-the-conditional-access-model.md#policies-come-in-pairs)).
3. **Report empty slots before enforcement.** A policy that includes a dynamic group silently misses every user whose attribute is empty ([exclusions](../b04-access/03-the-conditional-access-model.md#exclusions)). Target administrators by group, because role targeting doesn't reach roles scoped to a unit ([users, groups and roles](../b04-access/03-the-conditional-access-model.md#users-groups-roles-and-workload-identities)).
4. **Decide the persona set (D-A5).** The CISO decides. Run report-only for two to four weeks, then enforce in waves behind a monitoring gate, with the emergency-access group excluded ([Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md#testing-and-rollout)).
5. **Move each user-configuration GPO setting to exactly one owner.** That's user-targeted Intune policy or Conditional Access. Settings such as account lockout aren't Conditional Access controls ([Book 01, Chapter 04](../b01-transformation-arc/04-identity-transformation.md#conditional-access-the-policy-inheritance-replacement)).

**Steps: the conventions the other tracks build on.**

6. **Devices (A5.2).** Device attributes come from device provisioning, never from the user's record, and a device rule can never read its owner's attributes ([companion guide, Intune track](attribute-driven-migration.md#intune-track)). The convention: tier, role and environment are written to the device's own slots at registration by the device provisioning service. Use dynamic device groups only where a rule must read those slots, and assignment filters otherwise. Never use a dynamic device group as an exclusion. The [Intune guide's Gates 1 and 2](intune-track-implementation.md#gate-1-device-sources-and-the-single-writer) carry it out, and the Endpoint plan's policy library (E1.2) is built on it.
7. **Servers (A5.3).** Once connected, an Arc server is an Azure resource whose tags are its attributes, drawn from the asset record at onboarding. Delegation is Azure RBAC at the right scope, not tag-based conditions ([companion guide, Arc track](attribute-driven-migration.md#arc-track)). The convention: the tag taxonomy uses the same codes as the device slots where the fact is the same (environment, owning team), and resource groups are the delegation scope. The [Arc guide's Step 2](arc-track-implementation.md#step-2-the-tag-taxonomy-and-resource-groups) fixes the taxonomy, as the Endpoint plan's E4.2.
8. **Non-person identities (A5.4).** Microsoft documents no dynamic groups of service principals, and workload Conditional Access only blocks, applies only to direct assignment and needs Workload ID Premium ([companion guide](attribute-driven-migration.md#what-microsoft-documents-for-targeting-service-principals-by-attribute-partly)). The convention: owners and sponsors are recorded by the enterprise person key, so a sponsor's move or departure matches on the key. Custom security attributes for service principals (system, environment, tier) are defined once. The [non-person guide's Step 1](non-person-identity-implementation.md#step-1-inventory-every-non-person-identity) and [Step 4](non-person-identity-implementation.md#step-4-cut-privilege) use them.
9. **Place what neither tool reaches.** Put it in one of the four tiers ([companion guide](attribute-driven-migration.md#what-neither-tool-reaches)). The tracks' coverage steps do the placing: [Intune Step 0.4](intune-track-implementation.md#step-0.4-the-coverage-matrix-and-the-tiers) and [Arc 1.4](arc-track-implementation.md#step-1-prerequisites).

*The running example.* The analyst is in the internal-employee persona through slot 11. The analyst's laptop is governed by its own tier and role slots, not by `FIN-LED`. A reporting service principal the analyst sponsors records its sponsor as `MP0042137`.

::: {.callout-important}
## Validate (Gate 5: targeting conventions set)
- **VK-CA-01** reads every enabled and report-only policy that targets users and reports zero of three things. A policy that doesn't exclude the emergency-access group (`emergency-access-groups.csv`). A policy that targets a group outside the governed list (`governed-groups.csv`; [Book 01, Chapter 04](../b01-transformation-arc/04-identity-transformation.md#verification)). A grant on groups with no paired block: a block on all users, for the same application, that excludes those groups. It reads the users condition only, so keep the policy export from the automation reference's `ca-export` task as the record, and read it for blocks narrower than their grants ([Where the kits stop](#where-the-kits-stop)). Add the report-only results reviewed, and **VK-HR-02**'s list of users with an empty slot 11, who sit outside every persona built from it.
- For the conventions handed off, the track guides' own checks measure them: **VK-INT-01** (managed devices missing provisioning-written slots) and **VK-INT-04** (dynamic device groups against filters, and no dynamic device group used as an exclusion); **VK-ARC-01** (servers missing required tags); **VK-NPI-01** and **VK-NPI-08** (owners and sponsors present).
- Gate owner: the CISO. The persona set lands before the program's Conditional Access design runs in report-only (P1.5).
:::

**Rollback.** A policy goes back to report-only. A wave's GPO links are re-enabled, never re-created, because they were disabled rather than deleted ([Book 05, Chapter 08](../b05-devices/08-gpo-to-intune-policy-migration.md#rollback)).

**Evidence.** The persona definitions, the policy export, VK-CA-01's result, the report-only review, the enforcement waves, and the published device, server and non-person conventions with the track guides' check results.

## Gate 6: PIV and CAC binding {#gate-6-piv-and-cac-binding}

*Plan tasks A6.1 and A6.2, decisions D-A6 and D-A7, gate AG6. Companion guide [PIV and CAC certificates as attributes](attribute-driven-migration.md#pki-binding); deck Part 2, slides 16 and 17.*

PIV sign-in is attribute-driven too. Entra ID finds the user by matching a field of the certificate to a field of the account, so who writes that field matters as much as any HR field.

**Prerequisites.** Gate 3, so bindings sync. The HR plan's check of the issuing CAs' CRLs against Entra's limits (I1.6).

**Steps.**

1. **Measure binding coverage (A6.1).** For every pilot card holder, read `certificateUserIds` in Entra ID and `altSecurityIdentities` in AD. During hybrid, the binding is written to `altSecurityIdentities` and synced. For synced users, only Entra Connect can update `certificateUserIds`, and Microsoft's page doesn't document Cloud Sync for it ([companion guide](attribute-driven-migration.md#pki-binding)).
2. **Name the binding's writer.** The card management system writes the binding, not HR, because a reissued card changes it. HR supplies the person ([Book 03, Chapter 09](../b03-hr-identity/09-credentials-and-certificates.md#binding-the-piv-certificate-to-the-entra-user)).
3. **Decide the required affinity (D-A6).** Sign-in is only as strong as the weakest binding allowed. The program's position is high affinity in production ([Book 07, Chapter 06](../b07-pki/06-device-and-user-certificates.md#username-bindings-and-affinity)).
4. **Pilot high affinity before changing the tenant (A6.2).** Switching the tenant to high affinity before every account's value is right locks people out ([companion guide](attribute-driven-migration.md#pki-binding)). Raise the card's certificates to multifactor with a binding rule by issuer or policy OID, and require the phishing-resistant strength for CBA users ([Book 04, Chapter 03](../b04-access/03-the-conditional-access-model.md#authentication-strengths)).
5. **Add the binding to the leaver.** The leaver removes the binding as well as revoking the card ([Book 03, Chapter 09](../b03-hr-identity/09-credentials-and-certificates.md#the-canonical-leaver-sequence)).
6. **Decide the writer after AD (D-A7).** *(design guidance, unverified)* After AD, the card management system writes `certificateUserIds` through Microsoft Graph at issuance. That's an open pilot, [issue #130](https://github.com/WhalerMike/modernization-workbook/issues/130), and Microsoft documents neither the permission a workload needs nor how the write behaves for cloud-mastered users. Decide before the program moves issuance off AD CS (P4.5).

The contractor path, where a contractor source supplies what HR supplies for employees, is [Book 03, Chapter 09](../b03-hr-identity/09-credentials-and-certificates.md#the-contractor-piv-path). It is pending proof.

*The running example.* The analyst's card certificate is bound to the account that holds `MP0042137`. The binding value identifies the certificate. The key identifies the person. A reissued card changes the first and never the second.

::: {.callout-important}
## Validate (Gate 6: PIV binding proven on the pilot)
- **VK-PIV-01** reads `certificateUserIds` for every holder in `pilot-card-holders.csv` and reports zero holders not found, zero with no value and zero with only low-affinity values, by account and binding type, never by certificate value. For a synced holder with no value, the row points at `altSecurityIdentities` in AD. The check can't tell whether a value belongs to a current card, so reconcile its rows with the card management system ([Where the kits stop](#where-the-kits-stop)).
- The pilot's sign-in logs show CBA sign-ins succeeding under the high-affinity rule, with no lockouts.
- Gate owner: the CISO. Gate 6 lands before the program turns on PIV sign-in for the pilot (P2.8).
:::

**Rollback.** Set the tenant's required affinity back to its previous value, or remove the per-issuer high-affinity rule. Rolling back a binding value means restoring it from the card management system, not editing it in the directory.

**Evidence.** VK-PIV-01's coverage result, the affinity decision, the pilot's sign-in results, the leaver sequence with the binding removal, and the decision record for the writer after AD.

## Gate 7: prove a mover across the tracks {#gate-7-prove-a-mover-across-the-tracks}

*Plan task A7.1, gate AG7. Companion guide [Worked example: one user and one mover event](attribute-driven-migration.md#worked-example-one-user-and-one-mover-event); deck Part 2, slides 19 and 20.*

This gate is the test of the whole model. It runs before any population cuts over. One personnel action, no ticket, and every mechanism follows the attributes.

**Prerequisites.** Gates 4 to 6 on the pilot. The HR plan's joiner and mover automation (I4.3). The program's pilot policies assigned (P2.2).

**Steps (A7.1).**

1. Pick a test user in the pilot who sponsors a non-person identity and has a managed laptop.
2. Record the starting state: groups, unit, persona, access packages, the device's groups and the sponsorship. Take a VK-DG-05 snapshot.
3. HR records the move as a personnel action in the HR system: a new organization code, say `FIN-AP`. Nobody opens a ticket.
4. Follow it through. The middleware validates the event and writes provenance, then sends the complete record. In AD-landed populations sync carries it up ([Book 03, Chapter 05](../b03-hr-identity/05-the-provisioning-pipeline.md#the-middleware-five-duties-per-event)). Groups and units recompute, usually within hours, though it can take more than a day ([companion guide, limits](attribute-driven-migration.md#limits)). The mover workflow swaps access packages and starts a review of what's left ([Book 03, Chapter 08](../b03-hr-identity/08-joiner-mover-leaver.md)).
5. Check what must not change. The device's groups stay put, because device rules can't see the user. The service principal's sponsor is still `MP0042137`; a sponsor's mover event goes to the non-person track ([non-person guide, Step 6](non-person-identity-implementation.md#step-6-run-the-lifecycle)).
6. Run the drift scan. It should find nothing to fix.

*The running example.* This is the analyst. The personnel action moves `MP0042137` from `FIN-LED` to `FIN-AP`, with the new division code. The analyst leaves the ledger groups and the old division unit, joins accounts payable's groups and its division unit, and stays in the same persona ([companion guide, worked example](attribute-driven-migration.md#worked-example-one-user-and-one-mover-event)). The laptop doesn't move.

::: {.callout-important}
## Validate (Gate 7: mover proven across the tracks)
- **VK-DG-05**, against the step-2 snapshot, shows exactly the expected membership changes and no others.
- **VK-HR-03** reconciles the counts per organization code with the HR export after the move.
- The mover workflow's own run history shows it ran for the test user and what it did. **VK-HR-05** doesn't cover this: it reads hire and leave triggers only.
- The evidence chain runs from the personnel action to the provisioning log entry, the group change and the drift report, joined on the key.
- Gate owner: the CISO. Gate 7 closes before the program's G2.
:::

**Rollback.** Reverse the personnel action in HR and let the same path reverse the access. Don't fix the directory by hand. A hand fix is exactly what this gate is meant to show isn't needed.

**Evidence.** The before and after states, the run folders, the provisioning log entry, the workflow record and the drift report, joined on the key.

## Gate 8: cut over and retire the OU tree {#gate-8-cut-over-and-retire-the-ou-tree}

*Plan tasks A8.1 to A8.4, gate AG8. Companion guide [Stage 7](attribute-driven-migration.md#stage-7-cut-over-in-phases), [Lifecycle Workflows at scale](attribute-driven-migration.md#lifecycle-workflows-at-scale) and [What still needs AD during hybrid](attribute-driven-migration.md#what-still-needs-ad-during-hybrid); deck Part 2, slides 21 and 24 to 26.*

Cut-over is a runbook, not a flag day, which keeps rollback possible. Retiring the OU tree means clearing a list of named dependencies, not reaching a date.

**Prerequisites.** Gate 7. The program's wave plan (D07). Each track's wave runbook: the [Intune guide's Gate 5](intune-track-implementation.md#gate-5-cut-over-waves-and-rollback), the [Arc guide's Step 3](arc-track-implementation.md#step-3-onboarding-at-scale) and the [non-person guide's Step 5](non-person-identity-implementation.md#step-5-convert-with-a-parallel-run).

**Steps: cut-over.**

1. **Write each wave as an attribute query (A8.1).** Users and devices by attribute value, servers by resource group and tag, non-person identities by the application that owns them. Each wave's groups already exist ([Book 00, Chapter 09](../b00-orientation/09-design-pilot-and-rollout.md#waves-defined-by-attribute-values)). The Start Kit's `Get-FMPWaveList` writes the waves from a wave plan (`WaveId`, attribute, value) or one per organization code, sends devices and servers with their owners, and lists everything it leaves out with the reason ([how it builds waves](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/start-kit#how-it-surveys-attributes-and-builds-waves)). Start with the pilot division, two or three divisions at a time after that, each drift-clean before the next ([Book 01, Chapter 04](../b01-transformation-arc/04-identity-transformation.md#migration-phases)).
2. **Put leaver automation first in every wave.** Revocation is where the risk and the evidence are ([Book 03, Chapter 12](../b03-hr-identity/12-execution-plan.md#phase-4-lifecycle-automation-and-attribute-derived-access)).
3. **Run the per-wave attribute gate (A8.2).** A signed validation report, then a dry run on production data with writes disabled. Then seven days after cut-over in which every change for the population traces to an HR event. Only then does the ticket path for account creation close ([Book 03, Appendix C](../b03-hr-identity/appendix-c-acceptance-and-cutover.md#proving-hr-is-the-sole-source)).
4. **Retarget provisioning per population.** As a population becomes cloud-mastered, move it from the HR-to-AD provisioning scope to the HR-to-Entra configuration, with the AD leg dormant but intact ([companion guide, Stage 7](attribute-driven-migration.md#stage-7-cut-over-in-phases)). The populations themselves move in the HR plan (I5.1, I5.2). Whether moving a population's source of authority works in GCC is still unverified ([what still needs AD](attribute-driven-migration.md#what-still-needs-ad-during-hybrid)).
5. **Size Lifecycle Workflows for the agency.** A workflow per organization runs out of the 100-workflow ceiling fast, so build a few general workflows that branch on codes. Treat every on-demand run as a change with a second person, because it skips the execution limits and the workflow's own conditions. Set the execution limits so a reorganization is quarantined until someone approves it. For urgent terminations, disable and revoke rather than wait ([companion guide](attribute-driven-migration.md#lifecycle-workflows-at-scale)).

**Steps: retire the OU tree.**

6. **Remove the transitional rules (A8.3).** This happens after the program's G3, once every population is cut over. Remove the account-type sync rule that reads OU placement, the OU-based scoping filters, and the provisioning OU computation for cloud-mastered populations ([Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md#attribute-flow-and-transformations)).
7. **Freeze the tree (A8.4).** This happens after the program retires the OU-based security groups (P4.2). Remove the hand-made delegations Gate 0 found, confirm that no OU drives access, scoping or policy, and archive the tree's final export in Git as the record. The GPOs are retired in the Endpoint plan (its Gate 5). The OUs themselves go with the domain, at the program's G5. Legacy retirement is the only destructive phase, and it needs approval item by item ([Book 01, Chapter 04](../b01-transformation-arc/04-identity-transformation.md#phase-4-legacy-retirement)).
8. **Clear the named dependencies.** Synced users' attributes, Kerberos group writeback, DNS, DHCP, legacy applications and hybrid-joined devices each keep AD alive until they move ([companion guide](attribute-driven-migration.md#what-still-needs-ad-during-hybrid)). The program schedules them in Phase 4.

*The running example.* The analyst's division is in wave 2, selected by its division code. Seven days after cut-over, every change to `MP0042137`'s account traces to an HR event. When the analyst's population is cloud-mastered, HR writes Entra ID directly, and the AD account it no longer needs is disabled, not deleted.

::: {.callout-important}
## Validate (Gate 8: OU tree retired as a control)
- For each wave: **VK-HR-01** to **04** and **VK-HR-07** on the wave's query, run with the `WaveId` option and the Start Kit's `waves.csv` ([one wave at a time](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/validation-kit#one-wave-at-a-time)); `wave-exclusions.csv` with every left-out user and asset decided; **VK-DG-04** for any group the wave replaces, and **VK-DG-05** for the wave's membership change against the threshold. **VK-HR-05** and **VK-HR-06** show the leaver path on time and the execution limits set. Each track's own wave checks run in its guide.
- For the tree: the sync configuration export shows no rule or scoping filter reading OU placement. The final OU export shows no delegation that grants access, and no GPO link left that the Endpoint plan hasn't retired.
- Gate owner: the CISO. Gate 8 lands before the program freezes AD (P5.1).
:::

**Rollback.** A wave rolls back by re-enabling, never by re-creating. Re-enable the disabled AD accounts and the disabled GPO links, put the population back in the HR-to-AD provisioning scope, and reopen the ticket path. Don't delete a GPO instead of disabling its links, because that removes the one-command rollback ([Book 05, Chapter 08](../b05-devices/08-gpo-to-intune-policy-migration.md#rollback)).

**Evidence.** Each wave's list and exclusions, signed validation report, dry run and seven-day sole-source report. The provisioning retargeting record. The removed transitional rules. The final OU export. The approval for each destructive item.

## Gate 9: keep the attributes true {#gate-9-keep-the-attributes-true}

*Plan tasks A9.1 to A9.3, decision D-A8, gate AG9. Companion guide [Stage 8](attribute-driven-migration.md#stage-8-detect-and-correct-drift), [Limits](attribute-driven-migration.md#limits) and [Monitoring both](attribute-driven-migration.md#monitoring-both); deck Part 1, slide 26, and Part 2, slides 22 and 23.*

Without this gate, everything slowly decays. It starts with the pilot, not after cut-over, and it's the plan's last gate.

**Prerequisites.** Gates 2 to 4. Logs leaving Entra ID (Gate 2).

**Steps.**

1. **Decide severity and response times (D-A8).** The CISO decides. HR-side drift classes are missing identity, stale access, orphan account, attribute drift, unauthorized write, credential drift and schema drift ([Book 03, Chapter 11](../b03-hr-identity/11-drift-metrics-and-evidence.md#drift-between-hr-and-the-directory)).
2. **Schedule the two comparisons (A9.1).** HR against the directory, and the unit and role registry against the tenant. The directory side catches unit rule drift, paused processing, unmatched role assignments and restriction mismatches ([Book 02, Chapter 05](../b02-identity/05-delegation-without-ous.md#drift-detection)). Send findings from each track's own reconciliation to the same queue. Those are the [Intune guide's Step 6.2](intune-track-implementation.md#step-6.2-drift), the [Arc guide's Step 8](arc-track-implementation.md#step-8-operating-it) and the [non-person guide's Step 6](non-person-identity-implementation.md#step-6-run-the-lifecycle).
3. **Fix at the source.** Close every finding in the HR record or the rule, never in the copy, because the next cycle overwrites the copy ([Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md#the-assessment-pipeline)). Access reviews don't change dynamic membership, so review the rule and its inputs instead ([Book 06, Chapter 17](../b06-data-platform/17-dynamic-membership-delegation-and-privilege.md#access-reviews)).
4. **Keep a limits register (A9.2).** Dynamic group and rule limits, the 100-workflow and 100-extension Lifecycle Workflows budgets, administrative unit limits, and dynamic units' cloud availability ([companion guide, limits](attribute-driven-migration.md#limits)). Review it with every design change.
5. **Run a full cycle on the whole estate (A9.3).** After cut-over, close the findings at the source until the nightly plan is zero-action.

*The running example.* The nightly comparison joins HR and the directory on `MP0042137`. A second account carrying the key, a slot written by anything but the provisioning service, or an organization code HR doesn't hold is a finding in the queue, fixed at the source.

::: {.callout-important}
## Validate (Gate 9: attributes kept true)
- On the drift cadence: **VK-HR-03** (counts per organization code against HR), **VK-HR-01** and **VK-HR-04** (uncorrelated accounts and duplicate keys), the HCM correlation report (record by record: missing identities, orphan accounts, attribute drift), **VK-SYNC-03** (AD and Entra ID apart while they coexist), **VK-DG-05** (membership change over the threshold), **VK-DG-06** (paused processing) and **VK-DG-07** (unit rules against the registry).
- Each track's standing checks, run in its guide: VK-INT-01 and VK-INT-02, VK-ARC-01 to VK-ARC-07, and VK-NPI-01, VK-NPI-02 and VK-NPI-08.
- Book 01's verification list holds. Every HR-listed worker has valid attributes, every group is on one of the two patterns, and every unit rule mirrors its group with processing on. Every policy targets only governed groups, drift findings are zero, and the nightly plan is zero-action ([Book 01, Chapter 04](../b01-transformation-arc/04-identity-transformation.md#verification)). Book 03's six lifecycle metrics are within thresholds on the ConMon cadence ([Book 03, Chapter 12](../b03-hr-identity/12-execution-plan.md#phase-6-sustained-posture)).
- Gate owner: the CISO.
:::

**Rollback.** None. This gate is the standing loop. A finding is fixed at the source, and a bad fix is reverted the same way.

**Evidence.** The scan schedule, each cycle's run folder and summary, the findings queue with closure at the source, the limits register, and the metrics for continuous monitoring. The companion guide's [federal requirements table](attribute-driven-migration.md#federal-requirements) maps each track's evidence to the controls and mandates it supports.

## Where the kits stop {#where-the-kits-stop}

The kits cover most gates, but not all of them. Where no check exists, the gate's **Validate** step names the evidence that stands in for one.

| Gate | What a kit covers | What no kit covers yet | Stand-in evidence |
|---|---|---|---|
| 0 | The Start Kit's forest, OU, delegation and GPO counts (site links included) and its attribute survey; VK-INT-07 for Group Policy analytics readiness (beta) | The per-group decision; the track tag for each OU and GPO half | The decision record in Git |
| 1 | The Start Kit's attribute survey (fill rate, value quality, free slots); VK-HR-01, VK-HR-04 and VK-HR-07 | The schema and slot register themselves; who writes each attribute | The signed register; the delegation export and the audit log |
| 2 | VK-HR-01 to 04 and VK-HR-07; the HCM correlation tool, record by record and field by field | Correcting the HR data itself | The HR plan's baseline (I1.5) |
| 3 | VK-SYNC-01 on a sample; VK-SYNC-03 for the estate; VK-HR-02 and VK-HR-03 before and after; VK-SYNC-02 (optional) for match blocking | Sync configuration and its OU and group filters, shadow differences | The sync reconciliation report |
| 4 | VK-DG-01 to 07 | — | — |
| 5 | VK-CA-01 (emergency-access exclusion, governed groups, grant and block pairs on the users condition); VK-HR-02 for empty slots; the track checks for devices, servers and non-person identities | Conditions other than users and applications in a pair; the report-only results | The `ca-export` policy export and the report-only review, read against the persona design |
| 6 | VK-PIV-01 (coverage and affinity, by account) | Whether each value belongs to a current card; the tenant's affinity setting | The card management system's issuance record; the sign-in logs |
| 7 | VK-DG-05, VK-HR-03 | Proof that the mover workflow ran (VK-HR-05 reads hire and leave triggers only) | The workflow's run history |
| 8 | The Start Kit's wave lists; VK-HR-01 to 04 and VK-HR-07 on each wave; VK-HR-05, VK-HR-06, VK-DG-04, VK-DG-05 | The seven-day sole-source report | The provisioning logs, joined on the key |
| 9 | VK-HR, VK-DG and each track's standing checks | The registry-to-tenant comparison of role assignments | The registry diff in Git |

: Where the kits stop, by gate {.striped .hover}

## Rollback at a glance {#rollback}

| Gate | Rollback |
|---|---|
| 0 Read the tree | Nothing to roll back: read-only |
| 1 Schema and slots | Change a slot only before a rule reads it |
| 2 Prove | Restore a removed write permission by recorded change, with an end date |
| 3 Sync | Scope the population back out; never delete synced users in Entra ID |
| 4 Groups and units | Unassign the new group, keep the old one; revert a rule from Git; restriction can't be undone |
| 5 Targeting | Policy back to report-only; GPO links re-enabled |
| 6 PIV binding | Required affinity back; binding restored from the card management system |
| 7 Mover | Reverse the personnel action in HR |
| 8 Cut-over | Re-enable accounts and GPO links; population back in the AD provisioning scope; ticket path reopened |
| 9 Drift | Standing loop: fix at the source |

: Rollback by gate {.striped .hover}

## Checklist

- [ ] OU tree exported read-only with site links; every OU and GPO half tagged with its track; a decision for every group (Gate 0)
- [ ] Enterprise person key, such as a Mainframe PIN, carried in `employeeId` in both directories; schema and slot register signed with one writer per slot (Gate 1; attribute survey; VK-HR-01, 04, 07)
- [ ] Correlation threshold met on the pilot; other write paths removed; logs leaving Entra ID (Gate 2; VK-HR-01 to 04, 07; correlation report)
- [ ] Slots mapped through sync; match blocked outside a window; shadow differences explained (Gate 3; VK-SYNC-01, 03)
- [ ] Every rule on codes with guards, tested and shadowed; no `memberOf`; restriction decided per unit before creation; unit rules mirror group rules (Gate 4; VK-DG-01 to 07)
- [ ] Personas from codes, grants paired with blocks, empty slots reported; device, server and non-person conventions handed to their guides (Gate 5; VK-CA-01)
- [ ] PIV binding coverage measured; high affinity piloted before the tenant changes; leaver removes the binding; writer after AD decided (Gate 6; VK-PIV-01)
- [ ] One mover proved across the tracks with no ticket (Gate 7; VK-DG-05, VK-HR-03)
- [ ] Waves by attribute query, leaver first, seven days of sole-source proof; transitional rules removed; OU tree frozen and archived (Gate 8; wave lists, HR checks per wave)
- [ ] Drift scans scheduled for HR, units and roles; findings closed at the source; limits register kept (Gate 9)

## Back to the books

[Attribute-Driven Migration guide](attribute-driven-migration.md) · [the project plan](../../project-plans/attribute-driven-migration.md) · [Intune track](intune-track-implementation.md) · [Arc track](arc-track-implementation.md) · [Non-person identities](non-person-identity-implementation.md) · [HR pipeline](hcm-entra-implementation.md) · [Book 01, Chapter 04](../b01-transformation-arc/04-identity-transformation.md) · [Book 02](../b02-identity/index.md) · [Book 03](../b03-hr-identity/index.md) · [Book 04, Chapter 03](../b04-access/03-the-conditional-access-model.md) · [Book 05, Chapter 08](../b05-devices/08-gpo-to-intune-policy-migration.md) · [Book 07, Chapter 06](../b07-pki/06-device-and-user-certificates.md)

::: {.callout-tip}
## Back to the books
This is a companion guide, not part of a numbered book. [← The Workbook Books](../index.md)
:::

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

**Version 1.0**, in [edition 2026.10](../../about/archive.md#edition-2026-10) (October 31, 2026). Every edition is kept on the [Archive](../../about/archive.md) page; every change between editions is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/guides/attribute-driven-migration-implementation.md).

| Version | Edition | Date | Changes |
|---|---|---|---|
| 1.0 | [2026.10](../../about/archive.md#edition-2026-10) | 2026-10-31 | First edition (7 merged changes since the guide began) |

: Versions of this guide, newest first {.striped .hover}

<!-- revisions:end -->
