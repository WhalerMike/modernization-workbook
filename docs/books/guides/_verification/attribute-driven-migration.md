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

## Additions, October 29, 2026

- **Stage 1:** a one-line link to the contractor-source research page. No new claims.
- **PIV and CAC certificates as attributes:** a new paragraph, "Contractors", added at the author's request. The three links (sponsorship from the contractor joiner, card-system events back to the pipeline, the end date as the notification) are design guidance, restated from Book 03 Ch09 and linked. The 18-hour clock is verified against FIPS 201-3 §2.9.4, and footnote adm-fips201 was added. The Temporary Access Pass to FIDO2 bridge is restated from Book 04 Ch03 and linked.
- Research page: `docs/research/oracle-contingent-worker-contractor-source.md` (its log: `docs/research/_verification/oracle-contingent-worker-contractor-source.md`).

## Revision 2026-10-29 — four tracks, end state, attributes, dynamic group dangers, coverage, limits and federal requirements

Same day, second pass. The guide gained: "What this migration accomplishes" (goal and per-track criteria, labeled design guidance, with a federal-requirement column); "Four tracks, each with its own source of truth" (table, Group Policy split, reach rules, signposts and links); "Attributes: what you know from AD, and what Entra ID gives you" (the stores in order of use, the store-by-consumer table moved here from "Beyond users", the AD comparison and attribute mapping); a **Tracks** line on every stage and a Tracks column on the stage table; "Beyond users" reorganized as the home of the Intune, Arc and non-person identity tracks, with platform-coverage matrices and a tiered strategy for what neither tool reaches; "Limits" expanded into limit → implication → response tables plus "Lifecycle Workflows at scale"; "Dynamic group dangers and how to avoid them" (user and device tables, monitoring); "The federal requirements each track satisfies"; and per-track checklist rows. The framing wording follows the series' shared framing file. Every Microsoft Learn page footnoted below was opened on 2026-10-29 through the Microsoft Learn documentation service, either in this pass or in the same-day Book 02, 03 and 05 revisions logged in those chapters' `_verification/` files (noted per row). No personal name or email address was sent in any request.

### Claims log: new Microsoft facts (footnoted)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 75 | `employeeId` at most 16 characters; `usageLocation` required for licensed users; `userType` Member or Guest; extension attributes up to 1,024 characters each, read-only for synced users and read-only in Graph for cloud-only users previously synced (managed through Exchange); `onPremisesSamAccountName`, `onPremisesDistinguishedName`, `onPremisesSecurityIdentifier` read-only; `signInActivity` read-only, P1/P2 and AuditLog.Read.All | Attributes | verified | `adm-user-res` |
| 76 | 15 extension attributes on users and devices, originally AD and Exchange custom attributes; directory-extension naming `extension_<appId-without-hyphens>_<name>`; schema and open extensions not usable in dynamic rules and not synced from AD; 100 extension values per resource | Attributes | verified | `adm-ext-ref` |
| 77 | Directory extensions: up to 100 values per object; synced strings over 256 characters truncated | Attributes | verified | `adm-dirext-connect` |
| 78 | Cloud Sync directory extensions only through `CloudSyncCustomExtensionsApp` or the Connect-created app | Attributes | verified | `adm-cloudsync-dirext` |
| 79 | Dynamic rules read single-valued extension attributes and custom extension properties (multi-value not supported); device `accountEnabled`; `deviceOwnership` Personal, Company or Unknown (Intune: Corporate); `deviceTrustType` AzureAD, ServerAD or Workplace; agents' user accounts included unless excluded; agent identities can't be members; the write-permission security consideration; minimize `-match` and `-contains` | Attributes; dangers | verified | `adm-dyn-rules` |
| 80 | Conditional Access device filters read extensionAttribute1–15 only for Intune-managed, compliant or hybrid-joined devices | Attributes | verified | `adm-ca-device-filter` |
| 81 | AD schema additions are forest-wide and can't be removed, only disabled | AD comparison | verified | `adm-ad-schema` |
| 82 | Filters on extension attributes are advanced queries | AD comparison | verified | `adm-adv-query` |
| 83 | Source anchor: Connect uses ms-DS-ConsistencyGuid from 1.1.524.0; Cloud Sync uses ms-DS-ConsistencyGuid with objectGUID fallback, not changeable | AD comparison | verified | `adm-sourceanchor`; `adm-cloudsync-faq` |
| 84 | Connect syncs `c`, `co`, `l`, `st` and `physicalDeliveryOfficeName`; `pwdLastSet` is a mechanical property used to invalidate tokens; Entra `country` pairs with AD `co` | Attribute mapping | verified (the `co` pairing from Microsoft's Domain Services mapping) | `adm-connect-attrs` |
| 85 | `certificateUserIds` up to 10 values of up to 1,024 characters, unique; `altSecurityIdentities` isn't in the default attribute set and needs added sync rules | Attributes | verified (re-read; see D9) | `adm-cuid` |
| 86 | Application management policies block password addition and cap secret and certificate lifetimes, tenant default with exceptions; Security Administrator plus Cloud Application or Application Administrator | Non-person track | verified | `adm-app-mgmt-policy` |
| 87 | Workload ID FAQ: application management policies free; access reviews of service principals in privileged roles (including managed identities) need P2 reviewers and Workload ID Premium; app health recommendations Premium | Non-person track | verified | `adm-wid-faq` |
| 88 | Validate rules: at least Groups Administrator; 20 users or devices at a time | Dangers | verified | `adm-dyn-validate` |
| 89 | Group-based licensing: remove-before-add leaves the user unlicensed until processing; the gap can be longer in large tenants | Dangers | verified | `adm-gbl` |
| 90 | Exchange Online data held 30 days after license removal; re-adding restores | Dangers | verified | `adm-exo-license` |
| 91 | Exchange Online Delicensing Resiliency is documented as an optional delay | Dangers | verified that the feature is documented; government-cloud availability **not verified** (the guide says to confirm) | `adm-exo-resiliency` |
| 92 | Stale-device guidance: 21-day caution, disable before delete, retire MDM first, hybrid devices cleaned up in AD, don't delete system-managed Autopilot devices, BitLocker keys | Dangers | verified (consistent with Book 05 Ch10) | `adm-stale-devices` |
| 93 | Dual state can evaluate nondeterministically; 1803 and later clean it up; `BlockAADWorkplaceJoin` | Dangers | verified | `adm-hybrid-faq`; `adm-hybrid-plan` |
| 94 | Intune cleanup rules hide devices after 30–270 days, take no action, don't remove the Entra object | Dangers | verified (consistent with Book 05 Ch10) | `adm-intune-cleanup` |
| 95 | Lifecycle Workflows limits: 100 workflows, 25 tasks, 100 custom task extensions, offset −180 to 180, schedule 1–24 hours, 10 on-demand users, 5 administrative scopes, extension timeout 30 minutes–3 hours; limits can be raised through Microsoft Support | Limits | verified (this pass) | `adm-gov-limits` |
| 96 | Scheduling switched on per workflow; on-demand ignores execution conditions; three-day catch-up, not for Time based attribute V2 | Limits | verified (Book 02 Ch10 and Book 03 Ch08 revisions, same day) | `adm-lcw-understand` |
| 97 | Execution limits as a percentage, a count or both; quarantine pending approval; on-demand not subject | Limits | verified (same) | `adm-lcw-exec` |
| 98 | Custom task extensions call Logic Apps, launch-and-continue or launch-and-wait | Limits | verified (same) | `adm-lcw-ext` |
| 99 | Changing tasks or execution conditions creates a new version | Limits | verified (Book 02 Ch10 revision) | `adm-lcw-versioning` |
| 100 | Default schedule every 3 hours; real-time leaver and mover can't be scheduled; extension callback 3 minutes–5 hours | Limits | verified (Book 02 Ch10 revision); see D8 | `adm-lcw-deploy` |
| 101 | Intune platform matrix: Windows editions, Windows 10 allowed, UWF excluded, macOS 15+ (13+ without user affinity), iOS 18+ (16+), Android Enterprise modes and versions, device administrator end, Linux Ubuntu 24.04/26.04 and RHEL 9/10, Windows Server not supported | Intune coverage | verified (Book 05 Ch03 revision, same day) | `adm-intune-platforms` |
| 102 | Windows enrollment methods; Windows 365; AVD multi-session limits and GCC support; Apple and Android enrollment; AOSP device list; Linux capabilities; ChromeOS connector scope; specialty-device licensing; frontline shared device mode; Defender device discovery | Intune coverage | verified (same) | `adm-intune-enroll`, `adm-w365`, `adm-intune-avd`, `adm-intune-apple`, `adm-intune-android`, `adm-aosp`, `adm-linux-guide`, `adm-intune-chromeos`, `adm-intune-specialty`, `adm-intune-flw`, `adm-mde-discovery` |
| 103 | Arc OS matrix: Windows Server 2016–2025; 2012 and 2012 R2 get no new agents after November 2026, ESUs ended October 13, 2026 and Arc doesn't extend them; unlisted OS unsupported; no 32-bit; machine configuration not on Arm64; Linux distributions and end dates; not tested on CIS-hardened systems; clients only in server-like roles; don't install on Azure VMs | Arc coverage | verified (this pass re-read the OS table and the ESU note; the rest in the Book 05 Ch09 revision) | `adm-arc-prereq` |
| 104 | Arc-enabled VMware vSphere (vCenter 8, 9,500 VMs per bridge, lifecycle operations, ESXi inventory); SCVMM retirement (no new onboardings by October 2026, service ends September 2029); multicloud connector (AWS, GCP preview, not in Azure Government); Azure Local; Arc-enabled Kubernetes | Arc coverage | verified (Book 05 Ch09 revision) | `adm-arc-vmware`, `adm-arc-scvmm`, `adm-mcc`, `adm-arc-choose`, `adm-arc-k8s` |

### Claims log: carried, restated as design, or federal (linked or footnoted)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 105 | Four tracks, the Group Policy split, the reach rules, the end state and how you know | What this migration accomplishes; Four tracks | restated-as-design (labeled design guidance), per the series framing | — |
| 106 | Stage Tracks lines | Stages 0–8 | restated-as-design; links carry the chapter facts | B02 Ch09–10; B05 Ch03, 04, 08–10; B17 Ch03, 05, 07 |
| 107 | Service-account targets, owners, credentials, lifecycle | Non-person track | carried | B02 Ch09; B02 Ch10 Phase 4; B06 Ch02, Ch09 |
| 108 | AI agents: sponsor required, two humans and a record, no stored secrets, lifecycle events | Non-person track | carried | B17 Ch04–06 |
| 109 | Tiered strategy for devices and servers outside Intune and Arc; the CM-8 tie | Beyond users | restated-as-design (labeled) | B05 Ch03; B09 Ch07, Ch09; B12 Ch01; B01 Ch04 |
| 110 | Lifecycle Workflows at-scale risks; administrative-unit and what-still-needs-AD responses | Limits | restated-as-design (labeled); the estate described as one forest, twelve trees, GCC, synced users, with no headcount | B03 Ch05; B02 Ch05; B02 Ch10; B00 Ch10 |
| 111 | Dynamic group danger responses | Dangers | restated-as-design except where a chapter states the rule | B03 Ch06, Ch10; B06 Ch16–17; B04 Ch03; B05 Ch04, Ch08, Ch10 |
| 112 | Federal requirement rows: AC-2, AC-2(1), AC-2(3), PS-4, PS-5, IA-4, IA-4(4), AC-3, AC-3(13), AC-6, AC-6(5), AC-6(7), IA-2 and enhancements, IA-3, IA-5, IA-9, CM-2, CM-3, CM-6, CM-7, CM-8, AU-2, AU-6, AU-12, SI-4, CA-7; M-22-09, M-19-17, the FICAM ILM Playbook (not policy), the Federal HR 2.0 memo, FIPS 201-3, SP 800-63-4, BOD 25-01 SCuBA, M-25-21, M-26-14, GCC at FedRAMP Moderate | Federal requirements | carried; each mapping is one a book already makes, and the mapping is labeled the program's reading | B02 App A; B03 Ch02, 03, 08, 09, 11; B05 Ch04, Ch10; B01 App A; B06 App A; B11 App A; B12 App A; B14 Ch03; B17 App A |
| 113 | Federal primary sources | Federal requirements endnotes | carried from the books' verified footnotes (accessed October 20–21, 2026, as each note says); not re-fetched, because each is already logged as verified in the named book | `adm-sp80053`, `adm-omb-m2209`, `adm-m1917`, `adm-ilm`, `adm-hr20`, `adm-fips201`, `adm-sp80063`, `adm-bod2501`, `adm-m2521`, `adm-m2614`, `adm-gcc` |
| 114 | Mappings left out: PS-7 (no book support), AC-2(13) to the lifecycle, IA-8 for contractors, M-21-31 (rescinded by M-26-14), a direct control mapping from B05 Ch09 | Federal requirements | stated as omissions | — |

### Disagreements and corrections found in this pass

| # | Item | Was | Now | Source |
|---|---|---|---|---|
| D8 | Custom task extension timeout | One figure per page in the shared limits note | **Microsoft pages disagree**: the governance service limits page says 30 minutes–3 hours; the deployment-planning page says 3 minutes–5 hours. The guide states both and picks neither; its design guidance is to finish well inside 30 minutes | `adm-gov-limits`; `adm-lcw-deploy` |
| D9 | `certificateUserIds` value cap | The Book 02 Ch09 revision reported that Learn states "10 or fewer" only for `altSecurityIdentities` | The certificateUserIds page also says the attribute "can hold up to 10 values" (re-read in this pass), so the guide keeps "up to 10 values"; Book 02 Ch09's wording is consistent and unchanged | `adm-cuid` |
| D10 | Shared attribute content: AD `c` to `country` | `physicalDeliveryOfficeName / l / st / c` | `... / co`; Connect also syncs `c` | `adm-connect-attrs` |
| D11 | Shared attribute content: `pwdLastSet` and `lastLogonTimestamp` to `lastPasswordChangeDateTime` and `signInActivity` | Presented as a mapping | Nearest equivalents, not synced copies | `adm-connect-attrs`; `adm-user-res` |
| D12 | Shared attribute content: `altSecurityIdentities` "synced to" `certificateUserIds` | Implied default | Only through sync rules the administrator adds | `adm-cuid` |
| D13 | Shared attribute content: Azure tags read by "RBAC scope" | Listed as a reader | Tags aren't a role-assignment scope; RBAC attaches to management group, subscription, resource group or resource | `adm-arc-cloud-native` |
| D14 | M-22-09 citation | The guide's `adm-m2209` is Microsoft's M-22-09 guidance page | The requirement table cites OMB's memo through a new note, `adm-omb-m2209`; `adm-m2209` is unchanged | — |

### Could not verify (added in this pass)

| Item | Status |
|---|---|
| Exchange Online Delicensing Resiliency in GCC | Not checked; the guide says to confirm before relying on it |
| Arc-enabled VMware vSphere and SCVMM in Azure Government | Not stated on the pages opened; not claimed |
| ESXi hosts taking no agent; vendor appliances not covered | The program's reading, labeled in the Arc coverage table |
| Thin clients and printers in Intune | Placed by absence from Microsoft's supported list |
| User source-of-authority transfer in GCC | Still open (Book 03 Ch12 register); the guide asks for an owner and a decide-by date |

## Additions, October 30, 2026 (contractor PIV path marked pending proof)

Added at the author's request during the independent verification pass (`docs/research/_verification/verification-pass-2026-10.md`). No content removed.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | "Pending proof": the contractor PIV path is the program's design and hasn't yet been validated in practice; links to the Proved criteria | PKI binding, after the "Contractors" paragraph | restated-as-design (status statement; nothing external claimed) | `docs/research/oracle-contingent-worker-contractor-source.md#status-and-review` |
