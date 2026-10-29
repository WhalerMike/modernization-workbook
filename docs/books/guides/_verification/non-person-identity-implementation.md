# Verification — Guide: Non-Person Identity, an Implementation Guide

New guide, first pass of 2026-10-29. The guide is a step-by-step layer over Book 02 Ch 09 (Service accounts; Modernizing service accounts; Discovering service accounts), Ch 10 (Phase 4; Compliance Manager; Git-based drift detection) and Appendix A; Book 04 Ch 03, 05, 06 and 07; Book 06 Ch 02, 09, 11, 19, R04 and R08; Book 17 Ch 03–07 and Appendix A; Book 03 Ch 01; the companion guides `attribute-driven-migration.md` and `ansible-configuration-automation.md`; and the research pages `ms-automation-foundations.md` and `ms-automation-entra.md`. Facts carried from those pages are cited by link to the section that states them and rely on those pages' own verification logs. Every Microsoft Learn page footnoted in the guide was read on 2026-10-29 through the Microsoft Learn documentation service. No personal name or email address was sent in any request.

## Claims log: new external claims (footnoted)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Application management policies need Security Administrator plus Cloud Application Administrator or Application Administrator | Prerequisites, roles | verified (carried from the companion guide's 2026-10-29 check, claim recorded there) | `npi-amp` |
| 2 | Deactivating an app registration needs Cloud Application Administrator or Application Administrator (or a custom role with `microsoft.directory/applications/disablement/update`) | Prerequisites, roles | verified | `npi-deactivate` |
| 3 | Workload ID free vs Premium features; access reviews of SPs in privileged roles include managed identities; P2 for reviewers, Workload ID Premium for reviewed SPs; available in Azure Government via account manager; no free trial in Azure Government | Prerequisites, licenses; Step 4b | verified (FAQ: "Free trial is unavailable in Microsoft Azure Government clouds"; account-manager wording carried from Book 04 Ch05) | `npi-wid-faq` |
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
| 16 | Service principal sign-in activity report: preview; beta Graph API; `AuditLog.Read.All`; national cloud table shows global service only (not US Gov L4, L5, China) | Step 6, orphans; VK-NPI-09 | verified. GCC uses the commercial service, so the guide reads it as available there (inference from the GCC boundary fact in Book 14 Ch03 and the companion guide) | `npi-sp-activity` |
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
