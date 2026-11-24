# Verification — Guide: Information Protection with Microsoft Purview

New guide, first pass of 2026-11-24, written to fill the Information Protection topic's gap matrix (owner's instruction of Nov 24, 2026: "Fill in the gap matrix"). It builds Book 20 as gates and doesn't restate the book's procedures. Every Microsoft fact in the government-cloud table and the shells table was read on Microsoft Learn on 2026-11-24. Every command is one Book 20 already gives; those were checked on Learn on 2026-11-11 and are recorded claim by claim in Book 20's chapter verification logs (`docs/books/b20-information-protection/_verification/`), which this log relies on rather than repeats. No personal name, email address or agency detail was sent in any request. Nothing was run in a tenant.

## Search before writing

Searched `origin/main` at 57843f00 on 2026-11-24 for existing or conflicting content, by topic and by key terms (`purview`, `sensitivity label`, `information protection`, `Get-Label`, `Get-DlpCompliancePolicy`, `Connect-IPPSSession`) across `docs/books/guides/`, the books, the developer workbooks, `docs/training/`, `examples/`, `scripts/`, `presentations/` and `data/topics.yml`.

- **No implementation guide, developer workbook, training path or kit for Purview existed.** The topic's gap matrix said so.
- **Book 20** already holds, per chapter, the How sections, the commands, the GCC tables, the decision record template, and in Chapter 12 the implementation checklist, RACI, operating cadence, evidence catalog, metrics and drift signals. The guide links to all of them and repeats none.
- **Book 12, Chapter 09** holds the CUI framework, the label taxonomy as code and the first DLP baseline. The guide links to it.
- **Partial overlaps, not conflicts:** the Daily Checks dashboard has a DLP and label alerts tab (`examples/daily-checks-workbook`), and the Zero Trust Assessment results kit carries Purview finding families. Neither covers the rollout; the guide doesn't touch them.
- **No conflicting fact was found.** The GCC statuses read on Nov 24 match Book 20's tables read on Nov 11 for every feature both name.

## Claims log

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | GCC page Step 4 statuses; "Identified status is subject to change"; page metadata dated Aug 24, 2026 | GCC table | verified | Plan for Microsoft Purview ... GCC deployments, <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-gcc-deployments> | Nov 24, 2026 |
| 2 | Content explorer and activity explorer Available; Teams data in content explorer In development | GCC table, G1 | verified | same | Nov 24, 2026 |
| 3 | EDM Available; named entity SITs In development | GCC table, G9 | verified | same | Nov 24, 2026 |
| 4 | Manual and mandatory labels Available; library default label In development; "Apply default label policies to ensure documents being edited" In development | GCC table, G2, G3 | verified | same | Nov 24, 2026 |
| 5 | Labels for Teams, groups and sites Available; granular Conditional Access via labels for sites On engineering backlog | GCC table, G4 | verified | same | Nov 24, 2026 |
| 6 | Message Encryption, Advanced Message Encryption and revocation extension, Customer Key, BYOK, DKE Available | GCC table, G5, G6 | verified | same | Nov 24, 2026 |
| 7 | Super user feature, label integration, DLP simulation mode not listed | GCC table, couldn't verify | verified (as absences) | same | Nov 24, 2026 |
| 8 | Co-authoring on encrypted documents Available | GCC table, G7 | verified | same | Nov 24, 2026 |
| 9 | DLP for files, email, Teams; endpoint DLP; alerts dashboard Available | GCC table, G8 | verified | same | Nov 24, 2026 |
| 10 | Service-side auto-labeling Available; Office apps Available; mobile clients On engineering backlog; new Exchange conditions In development | GCC table, G9 | verified | same | Nov 24, 2026 |
| 11 | Audit Standard and Premium, one-year and ten-year retention Available; audit search enhancements On engineering backlog | GCC table, G10 | verified | same | Nov 24, 2026 |
| 12 | IRM departing users and general data leaks Available; disgruntled users, security policy violations, Defender for Endpoint indicators In development | GCC table, G10 | verified | same | Nov 24, 2026 |
| 13 | Communication Compliance retention period On engineering backlog | GCC table, G10 | verified | same | Nov 24, 2026 |
| 14 | DSPM for AI Available with footnote 2: no browse-to-URL policy; only Microsoft Copilot and supported AI sites | GCC table, G11 | verified | same | Nov 24, 2026 |
| 15 | "Disable unlocking of records" and the recycle-bin search appear twice with different statuses | Couldn't verify | verified | same | Nov 24, 2026 |
| 16 | `Connect-IPPSSession` needs no ConnectionUri or AzureADAuthorizationEndpointUri in Microsoft 365 GCC; interactive connection works in 5.1 and 7 | Shells | verified | Connect to Security & Compliance PowerShell, <https://learn.microsoft.com/powershell/exchange/connect-to-scc-powershell> | Nov 24, 2026 |
| 17 | ExchangeOnlineManagement current release 3.10.1; 3.10.0 and later need PowerShell 7.6.0; all versions supported in 5.1 | Shells | verified | About the Exchange Online PowerShell module, <https://learn.microsoft.com/powershell/exchange/exchange-online-powershell-v2> | Nov 24, 2026 |
| 18 | AIPService: Windows PowerShell 5.1, or PowerShell 7.4 and later; PowerShell 7 needs 3.1.0.0 or later | Shells | verified | Install the AIPService PowerShell module, <https://learn.microsoft.com/purview/install-aipservice-powershell> | Nov 24, 2026 |
| 19 | `Connect-AipService -EnvironmentName` values AzureCloud, AzureChinaCloud, AzureUSGovernment; no GCC value named | Shells, couldn't verify | verified | Connect-AipService, <https://learn.microsoft.com/powershell/module/aipservice/connect-aipservice> | Nov 24, 2026 |
| 20 | `Get-AipServiceConfiguration` returns `SuperUsersEnabled` and `SuperUsers`; "You must use PowerShell to see a full list of protection configuration values" | G5 | verified | Get-AipServiceConfiguration, <https://learn.microsoft.com/powershell/module/aipservice/get-aipserviceconfiguration> | Nov 24, 2026 |
| 21 | SharePoint Online Management Shell in a PowerShell 7 console needs `Import-Module ... -UseWindowsPowerShell`; the page names no GCC parameter | Shells, G4, G7 | verified | Get started with SharePoint Online Management Shell, <https://learn.microsoft.com/powershell/sharepoint/sharepoint-online/connect-sharepoint-online> | Nov 24, 2026 |
| 22 | `Get-Label` is Security & Compliance only; `-IncludeDetailedLabelActions` expands label actions into properties; no output section | G2 | verified | Get-Label, <https://learn.microsoft.com/powershell/module/exchangepowershell/get-label> | Nov 24, 2026 |
| 23 | Every Validate command and its expected result | G1 to G12 | carried | Book 20, Chapters 01 to 12, and their verification logs | Nov 11, 2026 |
| 24 | Requirements and KSIs per gate | Each gate; Requirements and KSIs | carried | Book 20, Appendix A (controls, instruments, KSI vocabulary) | Nov 11, 2026 |

## What the guide adds (program design, not a Learn claim)

- The gate order and the three early steps (audit check in week one; recovery before encrypting labels widen; label integration before SharePoint auto-labeling).
- The pass condition of each Validate step.
- The interim path for two GCC gaps (Teams data in content explorer; client-side auto-labeling on mobile), marked risk-based recommended. The other four are the Book 20 chapter's own.
- The one list of synthetic events.
