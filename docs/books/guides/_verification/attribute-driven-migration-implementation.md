# Verification — Guide: Attribute-Driven Migration, an Implementation Guide

New guide, first pass of 2026-10-30. The guide is a step-by-step layer over the companion guide `attribute-driven-migration.md` and the two technical deep-dive decks (`presentations/attribute-driven-migration-technical-part-1/` and `-part-2/`, narration scripts and `slides.js`), whose order it follows. It hands each track's own work to `intune-track-implementation.md`, `arc-track-implementation.md`, `non-person-identity-implementation.md` and the research page `hcm-entra-implementation.md`, and its gates map to the project plan `data/project-plans/attribute-driven-migration.yaml`.

**No new external claims.** Every fact in the guide is carried from a workbook chapter, the companion guide or a track guide, and is cited by a link to the section that states it. Those pages rely on their own verification logs; the companion guide's Microsoft Learn facts were checked on 2026-10-29 (`_verification/attribute-driven-migration.md`). The guide has no footnotes, so it adds no names to the guides bundle's footnote namespace. No web request was made for this page, and no personal name or email address was sent anywhere.

## Checks run on 2026-10-30

| Check | Result |
|---|---|
| Every `VK-*` ID in the guide exists in `examples/validation-kit/powershell/ValidationKit/Private/Catalog.ps1` (VK-HR-01..06, VK-DG-01..07, VK-INT-01..06, VK-ARC-01..07, VK-NPI-01..09, and, from the second pass, VK-INT-07, VK-SYNC-01, VK-CA-01, VK-PIV-01) | pass; the guide uses no other IDs |
| Each check's described behaviour matches its catalog title (for example VK-DG-03 is Graph beta and delegated-only; VK-INT-04 covers dynamic device groups used as exclusions; a missing input makes a check *NotApplicable*) | pass, against the catalog and the kit README |
| 155 links with a `#fragment` resolve to a heading or explicit ID in the target page; 14 in-page links resolve | pass (local script, Pandoc-style IDs) |
| Plan task IDs named in each section exist in the plan YAML and `python scripts/project_plans/build.py --check` passes | pass |
| `scripts/check_neutrality.py` | pass (see the PR) |

## Claims log: carried from the chapters and the companion guide (linked, not footnoted)

| # | Claim (short) | Where in guide | Source section |
|---|---|---|---|
| 1 | Four tracks, four sources of truth; track guides and plans | How to use this guide | Companion guide, Four tracks; each track guide's header |
| 2 | GCC tenants run Entra ID in Microsoft's commercial cloud | How to use this guide | B14 Ch03, Two facts, not one |
| 3 | Mainframe PIN as a generic example of an enterprise person key; `employeeId` at most 16 characters; contractors keyed alike where the key is issued to them | One identifier; Gate 1 | B03 Ch04, One person, layered identifiers (its log, row 11: generic example, no agency named); B03 Ch06, One fact, one authority |
| 4 | One decider per row; the role list | Prerequisites | B02 Ch06 and B03 Ch07 responsibility matrices; deck Part 1 slide 27, Part 2 slide 28 |
| 5 | API-driven provisioning licensing; Lifecycle Workflows licensing; dynamic units in the global cloud only | Prerequisites | Companion guide, Stage 1 licensing paragraph; Limits, Administrative units |
| 6 | Start Kit counts, site-linked GPOs, *not collected* never zero | Prerequisites; Gate 0 | `examples/start-kit/README.md`; B00 Ch08 |
| 7 | OU tree's four jobs; non-inherited ACEs; site-linked GPO trap; `adminCount` overstates privilege | Gate 0 | B01 Ch04, The identity claim; B02 Ch08; B02 Ch09, AdminSDHolder |
| 8 | Per-group decision; convert only groups that follow department, location or role | Gate 0 | B02 Ch09, The per-group decision; Converting static groups |
| 9 | AD-to-Entra attribute comparison (`distinguishedName`, `manager`, `employeeType`, `accountEnabled`, SPNs, `adminCount`) | Gate 1 | Companion guide, Compared with Active Directory; deck Part 1 slide 9 |
| 10 | Store table and its order | Gate 1 | Companion guide, The attribute stores; deck Part 1 slide 10 |
| 11 | Program attribute map slots 10–12 and the others; device slots on the device object | Gate 1 | B03 Ch06, Program attribute map; B05 Ch08, The device attribute schema |
| 12 | Provisioning service the only writer; help desk, self-service and Exchange paths removed | Gates 1, 2 | B03 Ch06, Writers |
| 13 | No OPM document specifies the directory integration; four choices make the switch a source swap | Gate 1 | B03 Ch03; companion guide, Building the attributes from Federal HR 2.0 |
| 14 | Correlation threshold: 99% on the pilot a proposal, not a rule; burst of findings in month one | Gate 2 | B03 Ch12, Sequencing principle; B03 Ch11 |
| 15 | Match accounts before the first full sync to prevent duplicates | Gate 2 | B03 Ch05, The source |
| 16 | Entra log retention short and not retroactive; route out from day one | Gate 2; prerequisites | B03 Ch11, The evidence each event leaves |
| 17 | Two landing zones; Entra copies read-only for synced users | Gate 3 | B03 Ch05, Two landing zones; companion guide Stage 1 table |
| 18 | Cloud Sync unless Connect-only; PHS everywhere; soft/hard match overwrite; complete record to `/bulkUpload`; Connect Sync deadline April 7, 2027 | Gate 3 | B02 Ch09 (sync engine; soft and hard match; Cloud Sync or Connect Sync); B03 Ch05, The middleware |
| 19 | Book 02 Phase 1 gate (±1%, no errors, spot check); Book 03 Phase 3 gate | Gate 3 | B02 Ch10, Phase 1; B03 Ch12, Phase 3 |
| 20 | Two query patterns; guards; codes not names; flatten nesting | Gate 4 | B01 Ch04; B03 Ch10, Rule patterns; B06 Ch17; B02 Ch09, Nested groups |
| 21 | `memberOf` preview ends November 3, 2026; privileged groups can't be dynamic; membership can lag more than a day | Gates 4, 7 | Companion guide, Limits (footnoted there, checked 2026-10-29) |
| 22 | Restriction decided before the unit exists, default no, can't be changed; restricted units leave governance automation | Gate 4 | B02 Ch05, Restricted management |
| 23 | Three-tier units; division code in slot 6; role-assignable PIM-eligible groups; unit before groups | Gate 4 | B01 Ch04; B02 Ch05; B06 R07 |
| 24 | Units don't nest, scope writes not reads, limited roles; GCC High and DoD need an automation job | Gate 4 | Companion guide, Administrative units; deck Part 2 slide 23 |
| 25 | Personas from the worker type code; grant and block in pairs; empty attributes missed; role targeting doesn't reach unit-scoped roles; report-only two to four weeks | Gate 5 | B04 Ch03 (Personas; Policies come in pairs; Exclusions; Users, groups, roles); B02 Ch09, Testing and rollout |
| 26 | Device rules can't read the owner; device attributes from provisioning; filters preferred where they meet the need; no dynamic device group as an exclusion | Gate 5 | Companion guide, Intune track and dynamic device group dangers; deck Part 2 slides 5 to 7 |
| 27 | Arc tags as attributes; RBAC, not tag ABAC, for server management | Gate 5 | Companion guide, Arc track; deck Part 2 slide 9 |
| 28 | No dynamic groups of service principals; workload CA blocks only, direct assignment, Workload ID Premium | Gate 5 | Companion guide, What Microsoft documents for targeting service principals; deck Part 2 slide 14 |
| 29 | CBA binding: Connect-only for synced users, Cloud Sync not documented; card management system as the writer; high affinity piloted first; leaver removes the binding; post-AD writer an open pilot (issue #130) | Gate 6 | Companion guide, PIV and CAC certificates as attributes; B03 Ch09; B07 Ch06 |
| 30 | Mover sequence: personnel action, middleware, sync, recompute, access packages, device unchanged, drift scan | Gate 7 | Companion guide, Worked example; deck Part 2 slides 19 and 20 |
| 31 | Waves as attribute queries; pilot then two or three divisions, each drift-clean; leaver first; validation report, dry run, seven days of sole-source proof | Gate 8 | B00 Ch09; B01 Ch04; B03 Ch12; B03 Appendix C |
| 32 | Provisioning retargeted per population; SOA move in GCC unverified | Gate 8 | Companion guide, Stage 7 and What still needs AD |
| 33 | Lifecycle Workflows at scale: 100 workflows, general workflows on codes, on-demand runs skip limits and conditions, quarantine sizing, disable and revoke for urgent cases | Gate 8 | Companion guide, Lifecycle Workflows at scale |
| 34 | GPO links disabled not deleted; legacy retirement approved per item | Gates 5, 8 | B05 Ch08, Rollback; B01 Ch04, Phase 4 |
| 35 | Drift classes; directory-side checks; fix at the source; access reviews don't change dynamic membership | Gate 9 | B03 Ch11; B02 Ch05; B02 Ch10; B06 Ch17 |
| 36 | Book 01 verification list; Book 03 six metrics on the ConMon cadence | Gate 9 | B01 Ch04, Verification; B03 Ch12, Phase 6 |

## Second pass, 2026-10-30: three kit checks for Gates 3, 5 and 6

The validation kit gained VK-SYNC-01, VK-CA-01 and VK-PIV-01 for the gates the first pass listed as having no check, and VK-INT-07 (Group Policy analytics, beta), which Gate 0 now names for the GPO split. The guide's Validate steps for Gates 3, 5 and 6, its kit table, its path table, its evidence lines, its checklist and its "Where the kits stop" table now name them. What each check does is stated in the kit's README and catalog, which the guide summarizes. The Microsoft Learn facts behind them were read on 2026-10-30 with the Microsoft Learn documentation tools; only Learn pages were fetched, and no personal data was sent.

| # | Fact | Where in guide | Source (read 2026-10-30) |
|---|---|---|---|
| 37 | List Conditional Access policies: `GET /identity/conditionalAccess/policies`; least privileged permission `Policy.Read.All`, delegated and application; delegated roles include Global Reader, Security Reader, Security Administrator and Conditional Access Administrator; available in the global service and US Government L4 and L5 | Gate 5 Validate (VK-CA-01) | [List policies](https://learn.microsoft.com/graph/api/conditionalaccessroot-list-policies?view=graph-rest-1.0) |
| 38 | A policy's `conditions.users` holds `includeUsers`, `includeGroups` and `excludeGroups`; `grantControls.builtInControls` holds `block`, `mfa` and the rest; a policy's `state` is `enabled`, `disabled` or `enabledForReportingButNotEnforced` | Gate 5 Validate (VK-CA-01) | Same page, example response; the kit reads report-only policies as part of the persona set |
| 39 | `certificateUserIds` is read from the user's `authorizationInfo` with `GET /v1.0/users/{id}?$select=authorizationInfo` and `ConsistencyLevel: eventual`; Learn's Entra PowerShell examples sign in with `User.Read.All` | Gate 6 Validate (VK-PIV-01) | [Mapping to the certificateUserIds attribute](https://learn.microsoft.com/entra/identity/authentication/concept-certificate-based-authentication-certificateuserids) |
| 40 | Synced users' `certificateUserIds` can be updated only by Entra Connect, from on-premises (the `altSecurityIdentities` mapping) | Gate 6 Validate (VK-PIV-01's row for a synced holder) | Same page, Roles to update certificateUserIds; already carried in the guide from the companion guide (row 29) |
| 41 | Affinity by mapping type: `PrincipalName`, `RFC822Name`, `IssuerAndSubject` and `Subject` are low affinity; `SKI`, `SHA1PublicKey` and `IssuerAndSerialNumber` are high affinity; the `X509:<...>` prefixes are case-sensitive | Gate 6 Validate (VK-PIV-01) | [CBA technical concepts, username binding policy](https://learn.microsoft.com/entra/identity/authentication/concept-certificate-based-authentication-technical-deep-dive#username-binding-policy); certificateUserIds page, supported patterns |
| 42 | Group Policy analytics: `GET /beta/deviceManagement/groupPolicyMigrationReports`, `DeviceManagementConfiguration.Read.All` (delegated and application), global service and US Government L4 and L5. Each report has `displayName`, `ouDistinguishedName`, `migrationReadiness` (`none`, `partial`, `complete`, `error`, `notApplicable`), `targetedInActiveDirectory` and the settings counts. `unsupportedGroupPolicyExtensions` is a relationship read per report with the same permission | Gate 0 Validate (VK-INT-07) | [List groupPolicyMigrationReports](https://learn.microsoft.com/graph/api/intune-gpanalyticsservice-grouppolicymigrationreport-list?view=graph-rest-beta); [resource](https://learn.microsoft.com/graph/api/resources/intune-gpanalyticsservice-grouppolicymigrationreport?view=graph-rest-beta); [List unsupportedGroupPolicyExtensions](https://learn.microsoft.com/graph/api/intune-gpanalyticsservice-unsupportedgrouppolicyextension-list?view=graph-rest-beta) |

**Pending proof (recorded in the kit README, not stated in the guide).** The v1.0 user resource page doesn't list `authorizationInfo`; only the beta `authorizationInfo` type page describes it, so the v1.0 read rests on the certificateUserIds page's example. Learn's page for `Get-EntraUserCBAAuthorizationInfo` names Privileged Authentication Administrator (cloud-only users) and Hybrid Identity Administrator (synced users) as the least privileged delegated roles, not Global Reader. Whether Global Reader returns the property is unconfirmed until a test-tenant run.

**Checks run for the second pass.** Pester on PowerShell 7: 265 passed, 0 failed (`examples/validation-kit/tests/powershell`), including `Safety.Tests.ps1` (GET only; the new checks add no beta path and no non-GET call). Windows PowerShell 5.1: the four new checks give Pass on the pass fixture and the expected Fail and count on the fail fixture (Pester 5 isn't installed for 5.1 on the machine that ran this pass). `PYTHONUTF8=1 python scripts/check_neutrality.py`: pass. `python scripts/project_plans/build.py --check`: pass, after the plan's risk note was updated to name the three checks.

## Design guidance in the guide

Labelled *(design guidance)* or stated as the program's position: the Mainframe PIN running example and its per-gate table (the identifier decision itself is the agency's); the device, server and non-person targeting conventions in Gate 5, including recording owners and sponsors by the enterprise person key; the mover proof as a gate before cut-over; and the post-AD binding writer (also marked unverified, an open pilot).

## Gaps recorded in the guide

The guide's "Where the kits stop" table states what no validation kit check reads and what stands in for it. After the second pass: the sync configuration, scoping and shadow differences (Gate 3, beside VK-SYNC-01's sample comparison), conditions other than users and applications in a grant and block pair and the report-only results (Gate 5, beside VK-CA-01), whether a binding value belongs to a current card and the tenant's affinity setting (Gate 6, beside VK-PIV-01), the field-by-field HR comparison (Gate 2), the seven-day sole-source report (Gate 8) and the registry-to-tenant role comparison (Gate 9).
