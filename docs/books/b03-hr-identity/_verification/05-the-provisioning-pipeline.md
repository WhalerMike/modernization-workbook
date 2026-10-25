# Verification — Chapter 05, Provisioning Services

File: `docs/books/b03-hr-identity/05-the-provisioning-pipeline.md`
Diagram sources: `docs/images/diagrams/b03-hr-identity/src/ch05-provisioning-services.flow.yaml`, `ch05-two-patterns.flow.yaml`
Verified: 2026-10-20

Footnote keys renamed `c04-*` → `c05-*` (they carried the pre-renumbering chapter number). Every kept footnote was re-opened on 2026-10-20; access dates updated.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | API client doesn't compare source/target; service decides create/update/enable/disable; writes to AD (hybrid) or Entra (cloud-only) | Logical architecture | verified | learn.microsoft.com …/inbound-provisioning-api-concepts |
| 2 | `/bulkUpload` returns 202 Accepted, async; client reads provisioning logs and resubmits failures | Logical architecture | verified | concepts page; Graph "Perform bulkUpload" |
| 3 | No native Entra connector for Oracle Fusion Cloud HCM; prebuilt HR connectors are Workday and SuccessFactors | Why API-driven | verified (footnote added) | …/plan-cloud-hr-provision; Oracle HCM tutorial |
| 4 | Microsoft's Oracle guidance: CSV for initial, ATOM or HCM Extracts for delta, optional SCIM writeback | Why API-driven | verified; Oracle Integration Cloud option added (Microsoft lists it) | …/saas-apps/oracle-hcm-provisioning-tutorial |
| 5 | Core HCM solicitation checklist asks for SCIM 2.0 near-real-time provisioning | Why API-driven | unverifiable here (solicitation text not reachable); reworded to attribute the fact to Chapter 03, which carries the source | Chapter 03 |
| 6 | HCM Extracts / BI Publisher to CSV | Source table | verified (Oracle footnote added) | Oracle "Introduction to HCM Extracts" |
| 7 | ATOM collections newhire, empassignment, empupdate, termination, cancelworkrelship, workrelshipupdate | Source table | verified (Oracle footnote added) | Oracle "Employee Feeds"; Microsoft tutorial |
| 8 | Turn ATOM on immediately after initial sync; a delay loses changes | Source table | verified | Microsoft Oracle HCM tutorial |
| 9 | Enrichment via `workers` / `employees` REST endpoints | Source table | corrected: Oracle marks the `emps` (employees) resource for future deprecation and advises `workers` for new integrations | Oracle "Employees REST Endpoints"; "Workers REST Endpoints" |
| 10 | Default matching PersonNumber → employeeId; populate employeeId before first full sync | Source | verified | Oracle HCM tutorial; API FAQs |
| 11 | Middleware duties (validate, sequence, normalize, provenance, reconcile) | Middleware | restated-as-design; Microsoft lists validation, unique ID, sequencing, conversion, error handling for the custom module | Oracle HCM tutorial |
| 12 | SCIM BulkRequest URN; core + enterprise user schemas; extensions for other attributes | Middleware | verified (RFC footnote added) | concepts page; RFC 7644 §3.7; RFC 7643 §4.3 |
| 13 | Send complete record; omitted/null mapped attribute can clear target when clearing is enabled | Middleware | verified; noted that clear attribute values is a preview feature | concepts page |
| 14 | Endpoint graph.microsoft.com; GCC uses worldwide endpoints | bulkUpload table | verified | learn.microsoft.com/graph/deployments |
| 15 | Up to 50 operations per call | bulkUpload table | verified | concepts page; Graph reference |
| 16 | Throttling: 40 calls / 5 s (concepts) vs 40 requests/s (Graph reference); pages disagree | bulkUpload table | verified (both pages still say so on 2026-10-20) | concepts page; Graph reference |
| 17 | Tenant cap 2,000/24 h P1/P2; 6,000 Governance | bulkUpload table | verified | concepts page |
| 18 | Permissions Upload / Upload.OwnedBy (least privileged application permission) / ProvisioningLog.Read.All | bulkUpload table | verified | Graph reference permissions table; grant-access page |
| 19 | Licensing floor P1; Governance for Lifecycle Workflows | bulkUpload table | verified | concepts page (license requirements); Oracle HCM tutorial prerequisites |
| 20 | One app per source; badging app with update-only | bulkUpload | verified | concepts page; API FAQs scenario 2 |
| 21 | AD landing via provisioning agent; then sync to cloud | Landing zones | verified; "Entra Connect" made "Entra Connect Sync or Cloud Sync" (Microsoft names both) | concepts page; Oracle HCM tutorial worksheet 5 |
| 22 | OU computed via `parentDistinguishedName` expression | Landing in AD | verified | plan-cloud-hr-provision |
| 23 | Cross-domain managers: Microsoft recommends a separate manager-only app | Landing in AD | corrected: that is one topology (one app per domain); the single-app topology uses referral chasing on the agent | plan-cloud-hr-provision topologies 4 and 5 |
| 24 | At least two agents, line of sight to DCs | Landing in AD | verified; added that the Cloud Sync prerequisites now recommend three active agents and Tier 0 hardening | plan-cloud-hr-provision; cloud-sync how-to-prerequisites |
| 25 | Agent runs as gMSA; Domain/Enterprise Admin needed to create it | Landing in AD | verified | cloud-sync how-to-prerequisites |
| 26 | SCIM `active` → AD `accountDisabled` | Landing in AD | verified | Oracle HCM tutorial worksheet 4; API FAQs |
| 27 | Entra has no OUs; manager drives org chart in Teams and Outlook | Landing in Entra | verified (footnote added) | Viva "Introducing Org Explorer" |
| 28 | employeeType, employeeHireDate, employeeLeaveDateTime, employeeOrgData (division, costCenter) | Landing in Entra | verified (footnote added) | Graph user resource type; employeeOrgData |
| 29 | Delegated admin via administrative units | Comparison table | verified; added that AUs can't be nested | administrative-units page |
| 30 | SOA transfer; Entra-to-AD provisioning keeps AD account while Entra stays SOA | Migration | verified | user-source-of-authority-overview |
| 31 | Cloud HR provisioning: cloud-only for Entra-only users, hybrid where apps depend on AD | Migration | verified | road-to-the-cloud-migrate |
| 32 | "HR is the start of authority" | Migration | corrected typo to "source of authority" | — |
| 33 | Native connectors bypass the middleware | Native connectors | restated-as-design | — |
| 34 | Writeback of username, email, phone through Oracle SCIM APIs | Writeback | verified; added Microsoft's method (Oracle Fusion ERP gallery connector, Update action only, unwanted attributes removed) and an Oracle SCIM Users footnote | Oracle HCM tutorial; Oracle "Get all users" `/hcmRestApi/scim/Users` |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | kept | edited: `part: What`; `lifecycle_review` → 2027-04-01 |
| Thesis, "In this chapter" | kept | unchanged |
| Logical architecture and Microsoft realization (incl. diagram) | kept | unchanged text; footnotes renamed |
| Why API-driven inbound provisioning | kept | edited: plan-hr footnote; OIC option; solicitation claim attributed to Chapter 03 |
| The source: Oracle Fusion Cloud HCM (table) | kept | edited: Oracle footnotes; `employees` resource deprecation correction |
| The middleware: five duties per event | kept | edited: RFC footnote; "preview" on clear attribute values |
| The `/bulkUpload` contract | kept | unchanged |
| Two landing zones (incl. diagram) | kept | unchanged |
| Landing in Active Directory | kept | edited: cross-domain manager topologies; three-agent recommendation and Tier 0; sync-client wording |
| Landing in Entra ID (incl. comparison table) | kept | edited: Org Explorer, user resource, administrative-unit footnotes |
| Over the Entra ID migration | kept | edited: "start" → "source" of authority |
| Native connectors | kept | unchanged |
| Writeback: optional and one-way per attribute | kept | edited: Microsoft's connector method and Oracle SCIM footnote |
| Continue the series | kept as "Continue the book" | edited to Book 02 callout style |

## Revision 2026-10-21 — review fixes

Applied from the verified review of Books 02–05. Sources were opened again on Oct 21, 2026.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| R1 | Microsoft's directory-level SOA labelled *object SOA* in the diagram caption, fig-alt and the migration paragraph; HR remains the source of authority for the person | Two landing patterns figure; Over the Entra ID migration | restated | c05-soa <https://learn.microsoft.com/en-us/entra/identity/hybrid/user-source-of-authority-overview> |

## Addition, October 25, 2026: Oracle Core HCM to Entra implementation research

Applied from the research page `docs/research/hcm-entra-implementation.md`; every source below was opened on Oct 25, 2026.

| # | Claim | Where | Verdict | Source note |
|---|---|---|---|---|
| 1 | Key on PersonNumber, never PersonId (PersonId varies across environments) | Source correlation key | added | c05-ora-ems |
| 2 | Oracle advises against REST for change detection and bulk; don't use REST to sync from HCM | Oracle HCM source surfaces (Enrichment row) | added; enrichment-only use confirmed consistent | c05-ora-rest; c05-ora-ems |
| 3 | Future-dated events not returned by default; appear early only by published-date reads; consumer chooses when to process | What the feeds do (new subsection) | added | c05-ora-dated; c05-ora-read; c05-ora-poll |
| 4 | Lifecycle Workflows catch up only three days | What the feeds do | added | c05-lcw-exec |
| 5 | Recommendation: published-min polling for newhire/termination/cancelworkrelship; middleware holds effective date; daily changes-only reconcile | What the feeds do | added (design guidance) | c05-ora-poll; c05-ora-read |
| 6 | Feed entries archived at 60 days, purged at 90; reconcile with full extract after a gap | What the feeds do | added (retention sourced; reconcile rule is design guidance) | c05-ora-purge; c05-ora-read |
| 7 | Oracle OAuth for Fusion REST paths: no client credentials; named integration user with a signing key | What the feeds do | added | c05-ora-oauth |
| 8 | OPM-hosted API management gateway for persistent connections; whether mandatory for the agency feed unverified | What the feeds do | added; unverified part stated as such | c05-pws-appb |
| 9 | Provisioning-log read permission: ProvisioningLog.Read.All (Entra pages) vs AuditLog.Read.All + Directory.Read.All (Graph v1.0 list page) | /bulkUpload contract table | added second permission set; separate-identity fallback is design guidance | c05-grant-access; c05-provlist |
| 10 | Oracle FedRAMP status | — | not stated in this chapter; no change | — |
| 11 | Diagram ch05-provisioning-services (Core HCM: extracts, ATOM feeds, REST, SCIM) | Figure | not changed; no wrong fact | — |
