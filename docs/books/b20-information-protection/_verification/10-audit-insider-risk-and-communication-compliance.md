# Verification — Chapter 10, Audit, Insider Risk and Communication Compliance

Writer: Book 20 build (Nov 11, 2026). Learn pages read: 24. Sources opened Nov 11, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | Audit Standard vs Premium capabilities; 180-day default; one-year and 10-year; non-user records fixed one year; ~2x API bandwidth; MailItemsAccessed SensitivityLabel | Audit is the floor | verified | Learn about auditing solutions in Microsoft Purview, <https://learn.microsoft.com/purview/audit-solutions-overview> | Nov 11, 2026 |
| 2 | Default Premium policy one year for Entra, Exchange, OneDrive, SharePoint for E5/add-on users; up to 50 policies; priority 1–10,000; licensing follows acting user; custom policy outranks default | Audit is the floor | verified | Manage audit log retention policies, <https://learn.microsoft.com/purview/audit-log-retention-policies> | Nov 11, 2026 |
| 3 | Search latency typically 60–90 minutes, not guaranteed | Audit is the floor; synthetic test | verified | Search the audit log, <https://learn.microsoft.com/purview/audit-search> | Nov 11, 2026 |
| 4 | Auditing off blinds API, Sentinel and search; status changes are audited; verify in Exchange Online PowerShell (False in SCC); up to 60 minutes | Audit is the floor; How | verified | Turn auditing on or off, <https://learn.microsoft.com/purview/audit-log-enable-disable> | Nov 11, 2026 |
| 5 | Management Activity API returns last seven days; no SLA; needs auditing on | Routing | verified | Management Activity API FAQs | Nov 11, 2026 |
| 6 | API endpoints per cloud | Routing; Prerequisites | verified | Management Activity API reference | Nov 11, 2026 |
| 7 | Tenant one year + log platform for full period | Audit is the floor | restated-as-design | Program position; logging mandates owned by Book 12 Ch02 | Nov 11, 2026 |
| 8 | IRM correlates signals; CC channels and actions; privacy-by-design principles; pseudonyms default for analyst/investigator roles | The charter comes first | verified | Learn about IRM; Purview service description; IRM and CC privacy guide | Nov 11, 2026 |
| 9 | Charter questions and decision owners | The charter comes first | restated-as-design | Program design; PM-12 checked in SP 800-53 Rev. 5 OSCAL 5.2.0 | Nov 11, 2026 |
| 10 | Six IRM role groups and permissions; keep at least one admin; 30 minutes to apply | Role separation; Pilot | verified | Assign permissions in Insider Risk Management, <https://learn.microsoft.com/purview/insider-risk-management-permissions> | Nov 11, 2026 |
| 11 | CC role groups (Administrators, Analysts, Investigators, Viewers) | Role separation | verified | Roles and role groups in Defender for Office 365 and Microsoft Purview | Nov 11, 2026 |
| 12 | Security groups in Purview role groups supported only in commercial cloud organizations | Role separation; Prerequisites | verified (GCC interpretation not settled: not yet specified) | Permissions in the Microsoft Purview portal | Nov 11, 2026 |
| 13 | Anonymization behavior, exceptions, exports; portal path | Pseudonymization; Pilot | verified | Manage username privacy in IRM | Nov 11, 2026 |
| 14 | Data risk graph retires Nov 24, 2026; unavailable with anonymization | Pseudonymization | verified | Data risk graph in IRM | Nov 11, 2026 |
| 15 | Triage stages and roles | Triage | restated-as-design | Program design | Nov 11, 2026 |
| 16 | CC retention period setting on engineering backlog in GCC, GCC High, DoD | Triage; Prerequisites | verified | Learn Purview government planning pages, Step 4 | Nov 11, 2026 |
| 17 | Audit Logs role (Exchange) to turn on/off; Organization Configuration for retention; View-Only Audit Logs to search | Prerequisites | verified | Turn auditing on or off; Manage audit log retention policies; Best practices using Search-UnifiedAuditLog | Nov 11, 2026 |
| 18 | Government availability for Audit and IRM/CC rows | Prerequisites | verified | Learn Purview GCC / GCC High / DoD planning pages, Step 4 | Nov 11, 2026 |
| 19 | Connection parameters per cloud | Prerequisites | verified | Connect to Security & Compliance PowerShell; App-only authentication connection examples | Nov 11, 2026 |
| 20 | RetentionDuration accepted values; TwelveMonths example; noisy-event example | Enforcement; Exclusions | verified | New-UnifiedAuditLogRetentionPolicy | Nov 11, 2026 |
| 21 | Record type names used in the retention policy | Enforcement | verified | Microsoft services that support auditing; Purview Information Protection connector reference | Nov 11, 2026 |
| 22 | Label operations differ by client (FileSensitivityLabelApplied vs SensitivityLabelApplied) | Synthetic-event test | verified | Audit log activities, Sensitivity label activities | Nov 11, 2026 |
| 23 | Retention change alters expiry of later-committed items | Rollback | verified | Learn about auditing solutions (licensing and policy changes) | Nov 11, 2026 |
| 24 | IRM and CC licensing (included plans) | Prerequisites (IRM) | verified | Microsoft Purview service description | Nov 11, 2026 |
| 25 | IRM template prerequisites; Azure dependency availability | Prerequisites (IRM) | verified | Plan for Insider Risk Management | Nov 11, 2026 |
| 26 | Device onboarding applies to IRM | Prerequisites (IRM) | verified | Onboard Windows devices into Microsoft 365 overview | Nov 11, 2026 |
| 27 | Add-RoleGroupMember in Security & Compliance PowerShell | Pilot (IRM) | verified | Assign permissions in eDiscovery | Nov 11, 2026 |
| 28 | Priority user group review restriction | Exclusions (IRM) | verified | Prioritize user groups for IRM policies | Nov 11, 2026 |
| 29 | Sharing IRM data with SIEM and Defender XDR | Telemetry (IRM) | verified | Share Insider Risk Management data with other solutions | Nov 11, 2026 |
| 30 | Control requirement rows (AU-2, AU-6, AU-11, AU-12, PM-12, AC-5) | Requirements | restated-as-design | Mapping is the program's; titles checked against SP 800-53 Rev. 5 OSCAL 5.2.0 | Nov 11, 2026 |

## Government-cloud gaps

- Security groups as members of Purview role groups: Learn says commercial cloud organizations only; GCC isn't named either way (written as not yet specified); GCC High and DoD written as not supported.
- Communication Compliance policy retention period: on engineering backlog in GCC, GCC High and DoD; commercial status not confirmed on a feature page (not yet specified).
- Insider Risk Management portal procedures (privacy setting, policy on/off) aren't documented separately for government portals; the government portal URLs differ (for example `purview.microsoft.us` for GCC High), which the chapter doesn't spell out.
- No Learn page reviewed gives a PowerShell interface for turning IRM or CC policies on and off; the rollback is a portal procedure.
- DoD Security & Compliance PowerShell URI: Learn's interactive page uses `l5.ps.compliance.protection.office365.us`; its app-only page uses `compliance.dod.microsoft.com`. The chapter uses the interactive form.
