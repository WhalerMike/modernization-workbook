# Verification — Building Book 03's HR Pipeline: Oracle Fusion Cloud HCM to Microsoft Entra ID (research)

File: `docs/books/guides/hcm-entra-implementation.md`

The page's claims were checked on 2026-10-25 and are footnoted on the page. This log records later re-checks.

## Source watch, November 9, 2026

Re-checked after the weekly source watch (issue #499) reported a change in a cited source. Checked November 9, 2026; no personal data sent to any site.

| Finding | Change |
|---|---|
| FedRAMP Marketplace `products.json` (`last_change` 2026-11-09T05:06:48Z): Fusion Cloud (F1603257882) now shows 9 authorizations, not 10; it is still FedRAMP Certified, Class C, agency path, SaaS, Government Community Cloud, certified January 13, 2020 (event log). The data now reports `impact_level` as `Unknown` and `cert_date` as empty for every listing | Count updated in the body and footnote `he-fr`, dated; Moderate kept, as Class C is the former Moderate baseline |
| Microsoft Graph user resource type (distribution lists added) and permissions reference (new `HardDeletionSetting` permissions) | No effect: the property limits and `ProvisioningLog.Read.All` the page cites are unchanged |

## November 9, 2026: Learn citations

| Learn page | URL | Date read | Supports |
|---|---|---|---|
| Index the employeeId attribute in Active Directory to improve provisioning performance | https://learn.microsoft.com/entra/identity/app-provisioning/index-employeeid-attribute-entra-id-to-active-directory | November 9, 2026 | Part 1, setup table, Matching: `employeeId` is the default matching property for inbound provisioning to AD |
| Clear attribute values | https://learn.microsoft.com/entra/identity/app-provisioning/clear-attribute-values | November 9, 2026 | Part 1, setup table, Clearing values: a preview; an omitted attribute can clear the target; send the complete record |
| Configure provisioning using Microsoft Graph APIs | https://learn.microsoft.com/entra/identity/app-provisioning/application-provisioning-configuration-api | November 9, 2026 | Job quarantine: polling the job's status through the synchronization job |
| Microsoft Entra Connect Provisioning Agent: Version release history | https://learn.microsoft.com/entra/identity/app-provisioning/provisioning-agent-release-version-history | November 9, 2026 | Lifecycle Workflows table, Synced AD users: agent version 1.1.1586.0 (May 13, 2024) |
| Troubleshoot HR manager update issues with HR user provisioning | https://learn.microsoft.com/entra/identity/app-provisioning/hr-manager-update-issues | November 9, 2026 | Mapping table, Manager row: AD `manager` holds the manager's distinguished name (page written for Workday and SAP SuccessFactors) |
| Reference for writing expressions for attribute mappings in Microsoft Entra ID | https://learn.microsoft.com/entra/identity/app-provisioning/functions-for-customizing-application-data | November 9, 2026 | Mapping notes: `FormatDateTime` converts the ISO dates in the AD app's mapping expression |

## Zero Trust closure, Phase 4 (November 11, 2026)

Added the section `#hcm-control-states` under Book 00, Appendix D's conventions: control states (G-01), How-template coverage (G-02), change safety (G-07), the evidence checklist (G-06) and the assessment-mapping block (G-08), drawn from HCM pipeline: phases 0–6, Parts 1–4, Testing and cutover, Gate G1. The section makes no new product, licensing or availability claim: every row points to text already on the page and footnoted, with the access dates in this log; rings, backout triggers and the emergency-access rule are labelled *(design guidance)*.

Authority labels (G-05): every "must", "shall" and "required" on the page was read. None was relabelled: each is a product constraint from its cited source, a quoted passage, a condition, or a mandate that names its authority (for the SD-WAN guide, CISA ED 26-03). No fact was re-verified, because none was added or changed.
