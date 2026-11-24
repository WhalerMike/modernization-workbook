# Verification — Guide: Non-Person Identity, an Implementation Guide

New guide, first pass of 2026-10-29. The guide is a step-by-step layer over Book 02 Ch 09 (Service accounts; Modernizing service accounts; Discovering service accounts), Ch 10 (Phase 4; Compliance Manager; Git-based drift detection) and Appendix A; Book 04 Ch 03, 05, 06 and 07; Book 06 Ch 02, 09, 11, 19, R04 and R08; Book 17 Ch 03–07 and Appendix A; Book 03 Ch 01; the companion guides `attribute-driven-migration.md` and `ansible-configuration-automation.md`; and the research pages `ms-automation-foundations.md` and `ms-automation-entra.md`. Facts carried from those pages are cited by link to the section that states them and rely on those pages' own verification logs. Every Microsoft Learn page footnoted in the guide was read on 2026-10-29 through the Microsoft Learn documentation service. No personal name or email address was sent in any request.

## Claims log: new external claims (footnoted)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Application management policies need Security Administrator plus Cloud Application Administrator or Application Administrator | Prerequisites, roles | verified (carried from the companion guide's 2026-10-29 check, claim recorded there) | `npi-amp` |
| 2 | Deactivating an app registration needs Cloud Application Administrator or Application Administrator (or a custom role with `microsoft.directory/applications/disablement/update`) | Prerequisites, roles | verified | `npi-deactivate` |
| 3 | Workload ID free vs Premium features; access reviews of SPs in privileged roles include managed identities; P2 for reviewers, Workload ID Premium for reviewed SPs | Prerequisites, licenses; Step 4b | verified (FAQ) | `npi-wid-faq` |
| 4 | PIM access reviews of SPs need Workload ID Premium plus P2 or ID Governance; creating reviews of Entra roles needs at least Privileged Role Administrator | Prerequisites, licenses; Step 4b | verified | `npi-pim-review` |
| 5 | `servicePrincipalType` values Application, ManagedIdentity, Legacy, ServiceIdentity (agent identity), SocialIdp; legacy SP has no app registration | Step 1b | verified (Graph Bicep property reference; Book 04 Ch05 carries the three original types) | `npi-sptype` |
| 6 | Managed identities listed by `servicePrincipals?$filter=servicePrincipalType eq 'ManagedIdentity'` | Step 1c | verified | `npi-mi-find` |
| 7 | Managed identities have no application object; Graph permissions granted directly to the SP | Step 1c | verified | `npi-mi-faq` |
| 8 | Microsoft suggests custom security attributes on SPs for a filterable inventory and ABAC | Step 1f | verified | `npi-rbac-wid` |
| 9 | KDS root key: DCs wait up to 10 hours after creation before allowing gMSA creation | Step 2; dangers (removed in trim, kept in Step 2) | verified | `npi-kds` |
| 10 | gMSA: 240-byte random password, changed every 30 days; use gMSAs for on-prem services unless unsupported; test first | Step 2; Step 3 | verified | `npi-gmsa-secure` |
| 11 | gMSA interval default 30 days, settable only at creation (`ManagedPasswordIntervalInDays`, stored in `msDS-ManagedPasswordInterval`) | Step 3 | verified | `npi-svc-pw` |
| 12 | Key Vault autorotates certificates only for self-signed or partnered-CA (DigiCert, GlobalSign) certificates; not for non-partnered CAs; email-only lifetime action | Step 3 | verified. Note: the tutorial's lead sentence says autorotation is "through its CA partnerships"; the autorotation overview adds self-signed regeneration. The guide states both | `npi-kv-rotate` |
| 13 | SQL Server on Arc rotation: upload the new certificate to the app registration; delete the old one after 24 hours | Step 3; dangers | verified | `npi-sql-rotate` |
| 14 | Least-privileged-roles page note: consenting to Graph application permissions "typically requires" Global Administrator; PRA may not be sufficient | Step 4a | verified (quoted in substance). **Discrepancy D1** below | `npi-delegate-task` |
| 15 | Microsoft labels privileged roles and permissions (`isPrivileged`, beta API); page marked preview; SPs holding highly privileged roles are control-plane (Tier 0) assets | Step 4b; dangers | verified; preview stage stated in the guide | `npi-privileged` |
| 16 | Service principal sign-in activity report: preview; beta Graph API; `AuditLog.Read.All`; national cloud table shows global service only | Step 6, orphans; VK-NPI-09 | verified. GCC uses the commercial service, so the guide reads it as available there (inference from the GCC boundary fact in Book 14 Ch03 and the companion guide) | `npi-sp-activity` |
| 17 | Deactivate: new tokens stop at once, existing tokens valid until expiry, configuration preserved, global scope; remove owners to prevent reactivation; `accountEnabled=false` blocks tokens in one tenant; audit entry "Update application" with `isDisabled` | Step 6 decommission table; dangers | verified. Microsoft's deactivate examples use the beta endpoint and its reactivate examples v1.0; the guide doesn't give Graph calls for these | `npi-deactivate` |
| 18 | Deleted app registrations restorable for 30 days | Step 6 | verified | `npi-restore-app` |
| 19 | Multitenant application objects aren't hard-deleted automatically after 30 days | Step 6 | verified | `npi-recover` |
| 20 | Restoring a deleted SP restores its configuration except policies such as Conditional Access; soft-deleted managed identity SPs can't be recovered or permanently deleted by customers | Step 6; dangers | verified | `npi-restore-sp` |

## Claims log: carried from the chapters (linked, not footnoted)

| # | Claim (short) | Where in guide | Chapter section |
|---|---|---|---|
| 21 | Non-person identities aren't in the HR pattern; owner/sponsor accountability; sponsor's HR lifecycle is the event | Track at a glance | B03 Ch01; companion guide Four tracks; B17 Ch05 |
| 22 | End state and Book 02 Phase 4 as the gate | Track at a glance | Companion guide; B02 Ch10 Phase 4 |
| 23 | `serviceManagementReference`; two owners; owners can add credentials; groups can't own enterprise apps | Prerequisites; Step 1f; dangers | B04 Ch05 Ownership |
| 24 | Discovery function fields and risk logic; stale is a lead | Step 1a | B02 Ch09 Discovering service accounts |
| 25 | dMSA properties; MSA/gMSA can't migrate to dMSA | Step 1a; Step 2 | B02 Ch09 Service accounts; matrix |
| 26 | Read-only app inventory script | Step 1b | B04 Ch05 A read-only inventory |
| 27 | App instance property lock | Step 1b | B04 Ch05 |
| 28 | Federated credential parts; 20 per object; wrong subject fails at exchange | Step 1d; Step 3; dangers | B02 Ch09 Workload identity federation |
| 29 | Agent object model; sponsor required; blueprint as credential boundary; release stages and GCC | Step 1e; AI agents | B17 Ch04, Ch05 |
| 30 | Migration path matrix | Step 2 | B02 Ch09 The migration path matrix |
| 31 | App management policy settings, effective-date scoping, 180-day cap; covers blueprints | Step 3 | B04 Ch05; B17 Ch06 Enforcing the order |
| 32 | Annual rotation (B02) vs 180-day cap (B04) reconciled | Step 3 | B04 Ch05 |
| 33 | ScubaGear 2.0.0 MS.AAD.5.5v1–5.7v1 (SHOULD, not BOD 25-01 required); MS.AAD.9.1v1 status | Step 3; Evidence | B17 Ch06 |
| 34 | Secret exception: IGO and CISO, six months max, no auto-renewal | Step 3 | B04 Ch06 Exceptions |
| 35 | Delegated vs application permissions; risk table; mail permission names; access policy | Step 4a | B04 Ch05 Permissions |
| 36 | Removing a permission doesn't revoke the grant; tokens stay valid | Step 4a; dangers | B04 Ch05 Admin consent |
| 37 | PRA via PIM grants Graph application permissions | Step 4a | B04 Ch06 Who approves admin consent |
| 38 | No standing privileged roles; time-bound active PIM assignment | Step 4b | B17 Ch06 (extended beyond AI as design guidance, labeled) |
| 39 | Azure RBAC scoped to the resource; ABAC limited to storage data actions | Step 4c | B17 Ch06; companion guide |
| 40 | CSA on SPs, CA app filter string only | Step 4d | Companion guide; B04 Ch03 |
| 41 | CA for workload identities limits | Step 4e | B04 Ch05; B02 Ch09; B04 Ch03 |
| 42 | Phase 4 steps, 30-day parallel run, validation, rollback, 6–8 weeks | Step 5 | B02 Ch10 Phase 4 |
| 43 | Owner-change transfer and orphan policy (Tier 1, IGO, 30 days, suspend at day 31) | Step 6 | B04 Ch06 |
| 44 | Agent orphan: disable on confirmation; ten-business-day grace | Step 6; AI agents | B17 Ch05 |
| 45 | Quarterly permission reviews; review owners every few months | Step 6 | B02 Ch09; B04 Ch05 |
| 46 | App lifecycle: deactivate, revoke, remove credentials, delete | Step 6 | B04 Ch05 Governing app registrations |
| 47 | Agent deletion cascade, 30-day restore | Step 6 | B17 Ch05 Retirement |
| 48 | SQL Server 2025 managed identity / 2022 app registration; principal type 3; parallel run | SQL Server | B06 Ch02, Ch09, Ch11 |
| 49 | Control mapping AC-2, AC-6(5), IA-4, IA-5, IA-9 (no baseline), AU | Evidence | B17 App A; B02 App A; companion guide |
| 50 | SCuBA MS.AAD.5.1v1–5.3v1 BOD 25-01 required | Evidence | B02 App A; B17 Ch06 |
| 51 | P4.6 in the program master schedule | Path on one page | `docs/project-plans/program-master-schedule.md` (via data-platform plan's reference) |
| 52 | Stage of access reviews of service principals in privileged roles: PIM review page (create-roles-and-resource-roles-review) carries no preview label, but Learn's "Securing service principals," Challenges and mitigations, says "This functionality is in preview"; the license-table row now carries the stage | Licenses | corrected Nov 8, 2026 (item 1558): stage added to match the non-person identity developer workbook, Chapter 07 | <https://learn.microsoft.com/entra/architecture/service-accounts-principal>; <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-create-roles-and-resource-roles-review> |

## Design guidance introduced here (labeled in the guide)

- The record's field list; CMDB as master.
- A federal-employee sponsor for every non-person identity (Book 17's rule extended beyond AI).
- No standing privileged role for any non-person identity (Book 17's rule extended).
- Thresholds: 60 days to expiry for VK-NPI-02; 90 days of inactivity for VK-NPI-09.
- Owner change added to HR mover and leaver workflows for all non-person identities.

## Discrepancies and open items

- **D1. Who consents to Graph application permissions.** Book 04 Ch05/Ch06 and the research Module 1 say Privileged Role Administrator, which is what Microsoft's "Grant tenant-wide admin consent" page states. Microsoft's "Least privileged roles by task" page now adds a note that in practice Global Administrator is typically required and PRA may not be sufficient, depending on consent policies, permission scopes or Graph protection requirements. The guide reports both and tells the reader to test the path in the pilot. Not changed in the books; flag to the Book 04 owner.
- **D2. VK-NPI-09 is proposed, not in the canonical CHECKS list.** It reads a preview/beta API. Parent session to confirm or drop.
- **D3.** Validation kit location isn't linked from the guide; the parent session wires it.

## Decision of Nov 8, 2026

| Before | After | Check |
|---|---|---|
| The 180-day certificate cap "meets MS.AAD.5.7v1" | "addresses MS.AAD.5.7v1" | Decision of Nov 8, 2026; claim language |

## Learn gMSA coverage pass (November 9, 2026)

Read on Microsoft Learn on November 9, 2026 through the Microsoft Learn documentation service. The coverage table and the pages' `ms.date` values are in the [service account guide's verification log](service-account-migration.md).

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| G1 | One KDS root key per forest; more than one makes gMSAs fail after a rotation | Step 2, prerequisites for a gMSA | verified (ms.date 2025-01-23) | `npi-containers` |
| G2 | gMSA names unique in the forest; interval only at creation; delegated right to create `msDS-GroupManagedServiceAccount` objects; `Test-ADServiceAccount` on each host | Step 2 | verified (ms.date 2026-04-16) | `npi-gmsa-manage` |
| G3 | Entra Domain Services: KDS root key pre-created; gMSAs in a custom OU | Step 2 | verified (ms.date 2025-01-21) | `npi-aadds` |
| G4 | Find user accounts used as services by SPN, delegation and password never expires; privileged group membership a security issue | Step 1a | verified (ms.dates 2023-02-09) | `npi-user-svc`, `npi-gmsa-secure` |
| G5 | Link to the service account comparison and migration guide | Step 2 | link added | — |
| G6 | The KDS root key is created once for the forest (was "once per domain"): a one-time operation in the forest, stored in the Configuration partition | Step 2 | corrected by meaning | `npi-gmsa-secure`, `npi-containers`, `npi-kds` |

## Zero Trust closure, Phase 4 (November 11, 2026)

Applied the conventions of Book 00, Appendix D (`docs/books/b00-orientation/appendix-d-control-states-and-evidence.md`) to this procedure guide, as the smallest coherent addition:

| Convention | Where | What was added |
|---|---|---|
| G-01 control states | `#npi-control-states` | The five states mapped to the guide's gates, with the evidence for each, and the ready-for-closure sentence |
| G-02 How template | `#npi-control-states` | A coverage table pointing each subsection to where the guide already covers it; exclusions name the emergency access accounts |
| G-06 evidence checklist | Rollback by step table unchanged; the five-kind evidence checklist appended to **Evidence** | Five kinds: configuration, operational, test, exception, assessor-ready artifact |
| G-07 change safety | `#npi-control-states` | Rings adapted from the guide's pilot and waves, emergency access, change window, backout triggers *(design guidance)*, post-change validation |
| G-08 assessment mapping | `#npi-assessment-mapping` | Microsoft and CISA pillars, dependencies, attack chain interrupted |

**G-05 musts relabeled.** None. The four uses of *must* left are product constraints (a user-assigned identity must be deleted explicitly; a gMSA name must be unique in the forest; multitenant app objects must be removed by hand) or not directive.

**G-03 re-verification.** None. Every statement in the new section is carried from the guide's own gates (Steps 1 to 6, Evidence, Rollback) or from the privileged access guide's G2; no new product, licensing or government-cloud claim was added, so no Learn page was re-read. The guide's product claims keep their footnoted access dates (October 29 to November 7, 2026) and the rows above.

## Revision 2026-11-13 — Windows Server 2025 retirements

Mike's approval, Nov 13, 2026. The dates and events for each protocol now live in one place, the status table in Book 02, Chapter 03; this page links there. dMSA wording, where present, now says a dMSA needs a Windows Server 2025 domain controller (and Windows Server 2025 hosts), not a functional level (Learn, Delegated Managed Service Accounts FAQ, read Nov 13, 2026). An RC4 date, where present, follows KB5073381 (read Nov 13, 2026): AES only assumed from the April 14, 2026 updates, rollback no longer read from the July 2026 updates.

## Revision 2026-11-20 — managed service account standard

Aligned with the service account guide's [standard](../service-account-migration.md#msa-standard) and decisions WD-159 to WD-170. No new Learn fact: the dMSA prerequisites (every host on Windows Server 2025, a reachable Windows Server 2025 domain controller, no unconstrained delegation) are the service account guide's Migration B, footnoted there.

| Change | Where | Basis |
|---|---|---|
| dMSA prerequisite: was "a Windows Server 2025 domain" | Step 1a, Step 2 (text and table), Step 5 | Service account guide, Migration B; decision path |
| Two named owners for every non-person identity, AD service accounts included; Done when names dMSA and the dated Kerberos island | Step 1f, Done when | WD-164, WD-165 |
| gMSA creator: the delegated right via `DL-gMSA-Creators` and the pipeline, not Domain Admins; retriever is one domain local group | Step 1a, Step 2 prerequisites, Step 5 | WD-154, WD-160, WD-163 (Learn's fact that either may create one stays footnoted) |
| Decommission: a migration moves SPNs at the switch; a retirement keeps them until the 90-day window ends; delete after 90 days disabled | Step 6 table; Dangers | WD-167; service account guide A5 |
| SQL parallel run scoped to SQL logins and database principals, and related to Step 5's account run | SQL Server | Book 06 Ch 11; WD-167 |
| Managed service account certification by risk tier (R1 quarterly, R2 twice a year, R3 annually) in SailPoint | Step 6 access reviews | WD-166 |
| KSIs re-mapped from Book 13 App A's new section (IA-4 → IAM-ELP, IAM-JIT; IA-5 → IAM-APM; AC-2(3) → IAM-AAM, IAM-JIT, IAM-SUS; AC-6(5) → IAM-JIT, IAM-SNU; AC-6(7) → IAM-AAM, IAM-JIT; AU-6 → MLA-RVL; IA-9 → none) | G1–G6 boxes; Evidence table and pointer | WD-169; FedRAMP KSIs re-read Nov 20, 2026 (in Book 13 App A) |
| VK-NPI-06 scope: gMSA and dMSA settings (retrievers, AES256, direct privileged-group membership as findings; name, interval, OU as warnings; outbound-only not checked) | Kit table; G1 and G5 boxes | Validation Kit change (WD-159, WD-160, WD-161) |

## Figures (November 22, 2026)

| Figure | Where | Source |
|---|---|---|
| Figure `service-identity-decision-path`: the service account guide's ordered questions 1 to 9, five targets plus the time-limited `Keep`/`KeepKerberos` exception | Step 2 | Service account guide, decision path; Learn, "Securing on-premises service accounts", "Secure group managed service accounts", "Securing managed identities in Microsoft Entra ID" |

## Revision 2026-11-24 — one track, two guides

Mike, November 24, 2026, agreed that the service accounts guide is part of the Non-Person Identity track and that its decision path wins where Step 2's table differed.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| R-24a | Step 2's table, "gMSA, Hybrid": was "Keep the gMSA, plus an app registration for the cloud calls"; now the Arc-enabled server's managed identity, otherwise an app registration with a certificate, as the decision path's question 4 says. The row for a traditional account calling Entra-protected APIs from a host with no issuer now puts the Arc identity first, in the same order. Step 2's own figure already followed the decision path | Step 2 | corrected to the service accounts guide's decision path (approved in #697) | Service accounts guide, "The decision path" |
| R-24b | A "Which guide?" box in both guides; the gate checklist is this guide's | In this guide | added | — |
| R-24c | Step 3 links to "Passwords, certificates or neither" and "CyberArk across the migration" | Step 3 | added | Service accounts guide |

## Revision 2026-11-24 — AWS GovCloud (US) and OCI (WD-171)

Mike, November 24, 2026: "Yes, extend the track to AWS GovCloud and OCI". The vendors' pages were read on November 24, 2026; each fact is footnoted on the page.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| R-24d | GovCloud: one IAM control plane, no global STS endpoint; no role between a GovCloud and a standard account; Roles Anywhere without CRL distribution points; no Access Analyzer policy generation; root keys only through AWS Support | 1g; 4f | supported by the source | AWS, "IAM in AWS GovCloud (US)" |
| R-24e | The credential report lists all users, not service-specific credentials or keys beyond the first two, at most every four hours; `list-access-keys` lists the caller's keys unless a user is named; `list-roles` doesn't return `RoleLastUsed` | 1g | supported by the sources | AWS, "Generate credential reports"; AWS CLI reference |
| R-24f | AWS: require temporary credentials with roles; Pod Identity recommended over IRSA; last accessed information; Access Analyzer unused-access findings are charged | 1g; Step 2; Step 3; 4f | supported by the sources | AWS, "Security best practices in IAM"; EKS service accounts page; "IAM Access Analyzer findings" |
| R-24g | AWS to Entra: outbound identity federation (`GetWebIdentityToken`, RS256 or ES384); Entra lists AWS workloads and supports RS256-signed tokens only. GovCloud to Entra isn't documented: the Step 2 row says "once tested" | Step 2 | supported by the sources; the GovCloud path is unverified | AWS outbound federation page and CLI; Learn, workload identity federation and considerations |
| R-24h | OCI: three API keys per user; auth tokens and customer secret keys don't expire, two each; instance principal certificates rotated multiple times a day; dynamic groups; OKE workload identity not with dynamic groups; anyone with access to an instance has its principal's rights; rotate API keys every 90 days or less; instance principals recommended | 1h; Step 2; Step 3; 4f | supported by the sources | Oracle pages cited on the page |
| R-24i | OC2: home-region IAM calls; identity domains for tenancies created after January 17, 2023; the page doesn't state instance, resource or workload principal availability | 1h | supported by the source; availability unverified | Oracle, "Oracle US Government Cloud" |
| R-24j | The CLI commands in 1g and 1h exist on the vendors' references; OCI's output fields weren't checked against the API reference | 1g; 1h | commands supported; output fields unverified | AWS and OCI CLI references |
| R-24k | SCP denying access-key creation, owner tags as the join, the orphan rule for AWS and OCI | Step 3; Orphans | design guidance | WD-171 |


## Revision 2026-11-24 — VK-NPI-10 and the tag keys (WD-172)

Mike, November 24, 2026, answering the Chapter 13 change's three questions: "VK-NPI-10 … - Yes", "Step 1g: whether its commands should also export tags. - Yes", "Tag names: the proposed SystemId, Owner1, Owner2 and Sponsor. - Yes"; asked to confirm, he chose "Add VK-NPI-10".

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| R-24l | `ListRoles` and `ListUsers` don't return tags; `ListRoleTags` and `ListUserTags` do; `rolesanywhere list-crls` lists imported CRLs with their trust anchor | 1g (commands and item 6) | supported (AWS API reference, read Nov 24, 2026) | `npi-aws-tags` |
| R-24m | Tag keys `SystemId`, `Owner1`, `Owner2`, `Sponsor`; one key per owner, because AWS tag keys and values allow only letters, numbers, spaces and `_ . : / = + - @` (no comma or semicolon) | 1f note under 1h; VK-NPI-10 | program decision (WD-172); the character set verified on AWS's "Tags for AWS Identity and Access Management resources" page, read Nov 24, 2026 | WD-172; `npi-aws-tagrules` |
| R-24n | VK-NPI-10: what it reads and reports, and its pass criteria at G1 and G3 | Validation kit table; G1 and G3 Validate; checklist; evidence | matches `examples/validation-kit` (`Invoke-VkNpi10`, its tests) | The validation kit |

## Revision 2026-11-24 — a third guide

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| R-24o | The "Which guide?" box names *Non-Person Identity: Zero Trust, SASE and Other Clouds* | Which guide? | added | Mike, November 24, 2026 |
