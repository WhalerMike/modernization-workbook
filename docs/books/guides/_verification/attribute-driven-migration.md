# Verification — Guide: Attribute-Driven Migration from Active Directory to Microsoft Entra ID

New guide, first pass of 2026-10-29. The guide is a map over Book 01 Ch 04, Book 02 Ch 05–10 and Appendix C, Book 03 Ch 03–08 and 10–13 and Appendix C, Book 04 Ch 03, Book 05 Ch 08, Book 06 Ch 16–17 and R07, Book 07 Ch 06–07, Book 03 Ch 09, Book 05 Ch 09, Book 00 Ch 09 and the research page `docs/research/hcm-entra-implementation.md`. Facts carried from those pages are cited by link to the section that states them and rely on those chapters' own verification logs. Every Microsoft Learn page footnoted in the guide was opened on 2026-10-29 through the Microsoft Learn documentation service. No personal name or email address was sent in any request.

## Claims log: new external claims (footnoted)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | API-driven inbound provisioning lands users in on-premises AD (hybrid) or Entra ID (cloud-only), depending on the app; one endpoint per provisioning app | Stage 1, landing zones | verified | `adm-api-concepts` (inbound-provisioning-api-concepts, steps 8 and key features) |
| 2 | API-driven inbound provisioning is available with Entra ID P1, P2 and ID Governance | Stage 1, licensing | verified | `adm-api-concepts` (License requirements) |
| 3 | `/bulkUpload` daily cap 2,000 calls (P1/P2), 6,000 (ID Governance), up to 50 operations per call | Stage 1, licensing | verified (also in Book 03 Ch 05 and Ch 12) | `adm-api-concepts` |
| 4 | API-driven provisioning GA in US Gov cloud, June 2025 | Stage 1, licensing | verified | `adm-whatsnew` (whats-new-archive, June 2025) |
| 5 | Feature-availability table lists API-driven inbound provisioning and provisioning-agent registration for US Government tenants; ID Governance available in GCC, GCC High, DoD | Stage 1, licensing | verified | `adm-feature-avail` |
| 6 | Lifecycle Workflows require ID Governance or Entra Suite | Stage 1, licensing | verified | `adm-lcw` |
| 7 | Intune policies are assigned to user or device groups; user-owned settings to user groups, device-bound settings to device groups | Stage 6 | verified | `adm-intune-assign` ("User groups vs. device groups") |
| 8 | Device membership rules reference only device attributes; can't use the device owner's user attributes | Stage 6; worked example step 5 | verified | `adm-dyn-rules` (Considerations, limitations) |
| 9 | Rules can't read `employeeType`, `employeeOrgData`, `manager`; multi-value extension properties unsupported | Limits | verified (still true; none appears in the supported-properties tables) | `adm-dyn-rules` |
| 10 | `memberOf` preview ends November 3, 2026; dependent groups, units and auto-assignment policies freeze | Limits | verified (date unchanged on the page) | `adm-memberof` |
| 11 | Dynamic membership usually processed within a few hours, can exceed 24; pause nonessential groups for >500 groups or >20,000 membership changes, wait ≥24 hours | Limits, latency | verified | `adm-dyn-processing` |
| 12 | Dynamic device groups add processing delay; for time-sensitive assignment Microsoft recommends assignment filters on user groups or All devices | Limits, latency | verified | `adm-intune-assign` ("Principles of including and excluding groups") |
| 13 | Dynamic administrative units only in the global Azure cloud; P1 for each unit administrator and member | Limits, administrative units | verified (prerequisite unchanged) | `adm-dynau` |
| 14 | Lifecycle Workflows: up to 100 workflows and 100 custom task extensions per tenant | Limits, Lifecycle Workflows | verified; Book 02 Ch 10 reconciled to 100 on 2026-10-29 (D1) | `adm-lcw`; `adm-lcw-deploy` |
| 15 | On-demand workflow run: at most 10 users | Limits, Lifecycle Workflows | verified | `adm-lcw-deploy` |
| 16 | User SOA transfer prerequisites: HR integrated so changes go directly to Entra ID; no on-premises Exchange; not supported with AD FS federation; no password-based apps (LDAP bind, Kerberos with password) | Limits, what still needs AD | verified | `adm-soa` |
| 17 | SOA guidance: after the sync cycle completes, remove users from HR-to-AD scope and add them to HR-to-Entra configuration | Stage 7 | verified | `adm-soa-guidance` ("Transition user management") |

## Claims log: beyond users, and PIV/CAC binding (footnoted; all opened 2026-10-29)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 51 | Device rules can use `deviceOSType`, `deviceOwnership`, `deviceTrustType`, `enrollmentProfileName`, `devicePhysicalIds`, `extensionAttribute1`–`15`; device rules reference only device attributes | Beyond users, Intune | verified | `adm-dyn-rules` (Rules for devices; Considerations) |
| 52 | `[ZTDid]` rule selects all Autopilot devices; group tag maps to `OrderID` | Beyond users, Intune | verified | `adm-autopilot` |
| 53 | Device extension attributes written by `PATCH /devices/{id}`; application permission `Device.ReadWrite.All`; delegated least-privileged `Directory.AccessAsUser.All`, Intune Administrator least role; app-only and non-Windows calls update only `extensionAttributes` | Beyond users, Intune | verified; Book 05 Ch08 sample reconciled 2026-10-29 (D5); guide now states the sample's delegated permission plainly | `adm-device-update` |
| 54 | Assignment filter device properties (deviceName, deviceOwnership, deviceTrustType, enrollmentProfileName, manufacturer, model, operatingSystemSKU, deviceCategory, cpuArchitecture; operatingSystemVersion preview); no extension attributes | Beyond users, Intune | corrected 2026-10-29: `operatingSystemVersion` is generally available (Intune service release 2608, week of Aug 25, 2026; the property page no longer carries a preview note); guide's "in preview" removed | `adm-filter-props`; `adm-intune-whatsnew` |
| 55 | Intune RBAC: permissions + scope groups + scope tags; ≤100 scope tags per object or role; Intune RBAC doesn't apply to Entra roles | Beyond users, Intune | verified | `adm-scope-tags` |
| 56 | Arc-enabled servers get an Azure resource ID; organized, governed and tagged like Azure VMs | Beyond users, Arc | verified | `adm-arc-cloud-native` |
| 57 | Tags set at onboarding or later through portal, CLI, PowerShell, ARM or Policy; Resource Graph queries at scale | Beyond users, Arc | verified | `adm-arc-organize` |
| 58 | `azcmagent connect --tags` takes `Name=Value` comma-delimited list | Beyond users, Arc | verified | `adm-azcmagent` |
| 59 | Built-in *Inherit a tag from the resource group if missing*, modify effect, remediation for existing resources | Beyond users, Arc | verified | `adm-tag-policies` |
| 60 | Azure ABAC conditions only on role assignments with blob or queue storage data actions; `@Principal` = custom security attribute on user or service principal | Beyond users, Arc and service principals | verified; the guide states plainly that Microsoft doesn't document ABAC for Arc server management | `adm-abac` |
| 61 | Custom security attributes on users and service principals; Attribute Definition / Assignment Administrator; Global Administrator can't read by default; 500 definitions, 50 values per object; reads restricted vs. extensions | Beyond users, service principals; store table | verified | `adm-csa` |
| 62 | Custom security attributes on users aren't supported in dynamic membership rules | Store table | verified | `adm-csa-users` (FAQ) |
| 63 | CA application filters use custom security attributes on service principals, string only, evaluated at token issuance | Beyond users, service principals | verified | `adm-ca-app-filter` |
| 64 | App role assignment; group-based assignment needs P1/P2; no cascade to nested groups | Beyond users, service principals | verified | `adm-app-assign` |
| 65 | CA for workload identities: single-tenant SPs, direct assignment only, block only, managed identities not covered, Workload ID Premium | Beyond users, service principals | verified (consistent with Book 04 Ch03) | `adm-ca-workload` |
| 66 | Dynamic groups: user and device rules only; agent identities (service principals) not supported as members; no SP rule type documented | Beyond users, service principals | verified; stated as "not documented" rather than inferred | `adm-dyn-rules` |
| 67 | Custom security attributes can be provisioned from HR sources including API-driven provisioning (GA June 2025); LCW scope by custom security attributes (GA August 2024) | Store table; object table | verified | `adm-whatsnew` |
| 68 | Default CBA username binding: SAN Principal Name → `userPrincipalName`; binding table of fields, user attributes and affinity | PIV section | verified; see D6 on Microsoft's own wording | `adm-cba-concepts` |
| 69 | Required affinity binding default low; custom rules by issuer/OID; high drops low bindings; only as secure as lowest binding; tenant-wide change can lock users out | PIV section | verified | `adm-cba-concepts`; `adm-cba-howto` |
| 70 | `certificateUserIds`: 10 values, 1,024 chars, unique, case-sensitive prefixes; cloud-only: Privileged Authentication Administrator, admin center (4 × 120) or Graph `authorizationInfo`; synced: Hybrid Identity Administrator, only Entra Connect; AD admins can change synced values; hygiene | PIV section | verified (consistent with Book 03 Ch09); the page doesn't mention Cloud Sync, and the guide says so | `adm-cuid` |
| 71 | Built-in Phishing-resistant MFA strength = WHfB/platform credential, FIDO2, CBA (multifactor); single-factor CBA in no built-in strength | PIV section | verified | `adm-auth-strengths` |
| 72 | CBA authentication binding default single-factor; issuer/OID rules raise to multifactor | PIV section | verified | `adm-cba-howto` |
| 73 | Microsoft's M-22-09 guidance lists Entra CBA including CAC, PIV and derived PIV among phishing-resistant options | PIV section | verified | `adm-m2209` |
| 74 | CMS writes `certificateUserIds` through Graph after AD retires | PIV section | **unverified; design guidance**; open pilot, workbook issue #130 (read 2026-10-29, state OPEN) | — |

## Claims log: carried from the chapters (linked, not footnoted)

| # | Claim (short) | Where in guide | Verdict | Chapter section |
|---|---|---|---|---|
| 18 | OU tree encoded delegation, policy, accountability and security scope; Entra ID is flat | Stage 0 | carried | B01 Ch04 The identity claim |
| 19 | OU assessment extracts placement, GPO links, non-inherited ACEs; site-linked GPOs look unlinked | Stage 0 | carried | B02 Ch08 OU hierarchy and delegation; What to collect |
| 20 | `adminCount` stays set after leaving a protected group | Stage 0 | carried | B02 Ch09 AdminSDHolder |
| 21 | Five outcomes of one attribute stamp | Stage 1 | carried | B01 Ch04 What the attributes drive |
| 22 | `employeeId` ≤ 16 characters; enterprise person key decision | Stage 1 | carried | B03 Ch04 One person, layered identifiers |
| 23 | Federal HR 2.0 memo Dec 10, 2025; Oracle award Jun 10, 2026; waves; FY 2028 goal; eOPF/EHRI redundant; ~8-month onboarding, interconnection ~month 5 | Stage 1, Federal HR 2.0 | carried (Book 03 Ch03's facts are dated Oct 20, 2026) | B03 Ch03 The program facts |
| 24 | No OPM document mandates directory integration; solicitation identity requirements point into the platform; Appendix B sample "Identity Management Solution"; Steering Committee approves agency integrations | Stage 1, Federal HR 2.0 | carried; no OPM or OMB Entra mandate asserted | B03 Ch03 What OPM requires |
| 25 | No native Oracle HCM Entra connector; Extracts plus Atom feeds; middleware five duties; read feeds by published date | Stage 1, Federal HR 2.0 | carried | B03 Ch05 |
| 26 | AD landing: provisioning agent, computed OU, `manager` DN; synced users' Entra extension attributes read-only; dates via `extensionAttribute2`/`3` and a sync rule | Stage 1, landing table | carried | B03 Ch05 Landing in AD; B03 Ch06 The schema, Design rules |
| 27 | What HR supplies and which slots have other writers (7, 9, 15; device slots) | Stage 1, sources table | carried | B03 Ch06 Program attribute map, Writers; B05 Ch08 Device attribute schema |
| 28 | Duty location is for scoping; sign-in signals enforce network-location policy | Stage 1, sources table | carried | B03 Ch04 Authority map |
| 29 | SCIM `externalId` matches `employeeId` by default | Stage 1 | carried | research page, The provisioning apps |
| 30 | Reference deployment builds against current HR and Core HCM sandbox; only source contract and transformation differ | Stage 1, before the wave | carried | B03 Ch13 Phase by phase |
| 31 | Manual attribute stewardship as a temporary source contract | Stage 1, before the wave | restated-as-design (labeled design guidance in the guide; extends B03 Ch06's contractor sequence) | — |
| 32 | 99% correlation is a proposed starting criterion; risk-tiered thresholds | Stage 2 | carried | B03 Ch12 Sequencing principle |
| 33 | Cloud Sync unless Connect-only requirement; PHS everywhere; soft/hard match blocks; Connect Sync April 7, 2027 deadline | Stage 3 | carried | B02 Ch09 |
| 34 | Complete record every time; omitted attribute can clear the target | Stage 3 | carried (also confirmed on `adm-api-concepts`) | B03 Ch05 Middleware |
| 35 | Two query patterns; `-in`; exclude disabled, guests, agents | Stage 4 | carried | B01 Ch04; B03 Ch10 Rule patterns |
| 36 | Rollout gate: validate, shadow, pilot; rule change removes members | Stage 4 | carried | B06 Ch17 Writing, naming and testing rules |
| 37 | AU properties, three-tier model, division rule on `extensionAttribute6`, restriction default no, role-assignable assigned principals | Stage 5 | carried | B01 Ch04; B02 Ch05 |
| 38 | Create the AU before the groups it holds | Stage 5 | carried | B06 R07 Sequencing |
| 39 | Personas from `extensionAttribute11`; grant/block pairs; empty-attribute exclusion; role targeting misses AU-scoped roles | Stage 6 | carried | B04 Ch03 |
| 40 | Intune device groups on device attributes; filters can't read extension attributes; one owning policy per setting; disable links, don't delete | Stage 6 | carried | B05 Ch08 |
| 41 | Waves by attribute value; division-by-division; leaver first; retarget AD app to Entra app per population | Stage 7 | carried | B00 Ch09; B01 Ch04; B03 Ch12 |
| 42 | Seven-day sole-source proof; dry run; ticket path closes | Stage 7 | carried | B03 App C |
| 43 | Drift classes and evidence retention | Stage 8 | carried | B03 Ch11; B02 Ch05 |
| 44 | Access-review decisions don't change dynamic membership | Stage 8 | carried | B06 Ch17 Access reviews |
| 45 | Worked example: NOA 721 is a mover; `empassignment` feed; attribute-change triggers after sync; residual review; SQL latency chain | Worked example | carried | B03 Ch08; research page sequences; B02 Ch10; B06 Ch16 |
| 46 | 500 role-assignable groups; PIM for Groups excludes dynamic and synced groups; 3,072 chars; 15,000 groups incl. dynamic AUs | Limits | carried | B03 Ch10 |
| 47 | Token lifetime 60–90 minutes; LCW schedule 3 h default (1–24), three-day catch-up | Limits | carried (schedule also confirmed on `adm-lcw-deploy`) | B06 Ch16; B03 Ch08 |
| 48 | What still needs AD during hybrid (attribute writes, Kerberos group provisioning, synced-user disposition, DNS/DHCP/Kerberos apps, SQL Windows logins, domain GPOs) | Limits | carried | B03 Ch06, Ch08; B02 Ch09; B01 Ch04; B06 Ch16; B05 Ch08 |
| 49 | Stage deciders | Stage table | carried | B02 Ch06 and B03 Ch07 responsibility matrices |
| 50 | Phase alignment table | Phase alignment | restated-as-design (the guide's own mapping, labeled approximate) | — |

## Disagreements and internal inconsistencies found

| # | Item | Chapter says | Primary source / other chapter says | Disposition |
|---|---|---|---|---|
| D1 | Lifecycle Workflows per-tenant workflow limit | B02 Ch10, Lifecycle Workflows: "up to 50 workflows and 100 custom task extensions" | Learn (`adm-lcw`, `adm-lcw-deploy`), 2026-10-29: 100 workflows | **Reconciled 2026-10-29**: chapter now says 100 workflows, 100 custom task extensions, 25 tasks per workflow, 10 users per on-demand run (`c10-lcw-limits`, governance service limits). Learn's "licensing fundamentals" page still says 50; the service-limits, overview and deployment pages say 100 |
| D2 | Intune targeting | B05 Ch08: every policy assigned to dynamic device groups built from device attributes, with filters as a second layer | Learn (`adm-intune-assign`; `adm-dyn-rules`, Rules for devices): use assignment filters where they meet the need; for time-sensitive assignment, filters on user groups or All devices rather than dynamic device groups | **Reconciled 2026-10-29**: B05 Ch08 Assignment strategy now states the guidance (filters on user groups or All devices for time-sensitive assignment; dynamic device groups kept for extension-attribute rules; avoid dynamic exclusions), footnote `c08-intune-assign`; guide Stage 6 states the same |
| D3 | Access-rule inputs | B03 Ch06, B01 Ch04, B06 Ch17: rules read codes (`extensionAttribute10`–`12`), never display strings | B02 Ch05 AU registry rules use `user.department -eq "Finance"`; B06 Ch16/R07 examples use `department` and `jobTitle -contains` | **Reconciled 2026-10-29**: B02 Ch05 department AUs read `extensionAttribute10` (roll-up with `-in`), division AUs read `extensionAttribute6`; B06 Ch16 and R07 rule inputs on codes. `AU-Enterprise` keeps `department -ne null` as a population predicate. Not in scope and still on display names: B01 Ch04 Pattern 2 example, B01 Ch11 YAML example, B02 Ch09 rule-syntax example, B06 Ch17 opening paragraph |
| D4 | Restricted management default | B02 Ch05: per-unit decision, default no; B06 Ch17: reserve it where tamper-resistance outweighs reviewability | B06 R07: provisions the DBA AU with restricted management on, as a program invariant | **Reconciled 2026-10-29**: R07 gave no unit-specific reason (it cited the superseded every-AU invariant), so R07 now follows B02 Ch05: decided before creation, default unrestricted, restrict only by recorded decision |

| D5 | Permission to write device extension attributes | B05 Ch08, Writing a device attribute: sample comment "Requires Device.ReadWrite.All" with `Connect-MgGraph -Scopes 'Device.ReadWrite.All'` (delegated) | Learn (`adm-device-update`): `Device.ReadWrite.All` is the application permission; the least-privileged delegated permission is `Directory.AccessAsUser.All`, with Intune Administrator as the least role | **Reconciled 2026-10-29**: B05 Ch08 sample is now delegated with `Directory.AccessAsUser.All` and Intune Administrator, prose names `Device.ReadWrite.All` as the app-only permission (`c08-device-update`); guide's "check the sample" sentence removed |
| D6 | Count of low-affinity CBA bindings | B03 Ch09 and B07 Ch06: four low-affinity bindings (PrincipalName, RFC822Name, Subject, IssuerAndSubject) | Learn (`adm-cba-concepts`) prose says Entra "implements three mappings that are considered low-affinity," while its own table marks four as low | Microsoft's page is internally inconsistent; guide and chapters follow the table; noted, nothing changed |

## Reconciliation, 2026-10-29

The chapters that disagreed with the guide (D1–D5) were edited the same day, each re-checked against Microsoft Learn on 2026-10-29 and logged in its own `_verification/` file under "Revision 2026-10-29 — companion-guide reconciliation": Book 02 Ch 05 and Ch 10, Book 05 Ch 08, Book 06 Ch 16 and R07. The guide's sentences that named a disagreement were rewritten to state the fact:

| Where in guide | Old text | New text |
|---|---|---|
| Beyond users, Intune: writing device extension attributes | "[Book 05, Chapter 08] carries the program's device slots. Its sample connects with `Device.ReadWrite.All` as a delegated scope, which isn't the delegated permission Microsoft lists, so check the sample against the Graph reference before using it." | "[Book 05, Chapter 08] carries the program's device slots and a delegated sample that connects with `Directory.AccessAsUser.All`." |
| Beyond users, Intune: assignment filters | "… `deviceCategory` and `cpuArchitecture`, with `operatingSystemVersion` in preview. … Extension attributes aren't on the list, which matches Book 05." | "… `deviceCategory`, `cpuArchitecture` and `operatingSystemVersion`, which became generally available in August 2026.[^adm-filter-props][^adm-intune-whatsnew] Extension attributes aren't on the list." |
| Object types table, Device row | "Graph, `Device.ReadWrite.All`" | "Graph: `Device.ReadWrite.All` app-only, or `Directory.AccessAsUser.All` delegated as at least Intune Administrator" |
| Stage 6 | "… with assignment filters as a second layer for hardware, ownership, join type and OS ([Book 05, Chapter 08])." | "… with assignment filters as a second layer for hardware, ownership, join type and OS, and for time-sensitive assignment uses a filter on a user group or on All devices instead, keeping dynamic device groups where a rule must read extension attributes ([Book 05, Chapter 08])." |
| Crosswalk, organization code row | "Node and roll-up groups ([B01 Ch04])" | "Node and roll-up groups ([B01 Ch04]); department units ([B02 Ch05])" |

The Limits section's Lifecycle Workflows sentence (100 workflows) and Stage 5's restriction sentence (per unit, default no) already stated the facts and needed no change. One finding went the other way: the guide's "`operatingSystemVersion` in preview" was itself stale (D7).

| # | Item | Was | Now | Source |
|---|---|---|---|---|
| D7 | `operatingSystemVersion` assignment-filter property | Guide: preview | Generally available since Intune service release 2608 (week of Aug 25, 2026); Book 05 Ch08 already listed it without a label and is unchanged | `adm-intune-whatsnew`; `adm-filter-props` (live page has no preview note) |

## Could not verify

| Item | Status |
|---|---|
| Whether user source-of-authority transfer is available in GCC | Not stated on the Learn pages opened 2026-10-29; left open, pointing to Book 03 Ch12's open verification register |
| Whether an agency's identity middleware reaches Core HCM directly or through OPM's API gateway | Unverified in Book 03 Ch05 and the research page; not restated in the guide |
| Re-render of figure `ch05-au-assignment` (Book 02 Ch 05) | Source and fig-alt updated to the organization code; SVG/PNG not regenerated (Graphviz and rsvg-convert unavailable on the editing machine) |
| Whether Cloud Sync can populate `certificateUserIds` for synced users | Not documented on the Learn page opened 2026-10-29, which names Entra Connect only; the guide says so |
| Federal HR 2.0 schedule after Oct 20, 2026 | Not re-checked; the guide carries Book 03 Ch03's dated facts and its instruction to confirm with the HR 2.0 program office |
