# Verification — Chapter 11, AI Data Security

Writer: Book 20 build (Nov 11, 2026). Learn pages read: 14. Sources opened Nov 11, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | Copilot: permissions first; encrypted content needs VIEW and EXTRACT; VIEW without EXTRACT returns a link; highest-priority label shown and inherited; protection applies to files open from outside the tenant | Why AI changes the problem | verified | "Data protection and auditing for Microsoft Copilot," https://learn.microsoft.com/copilot/plan/architecture-data-protection-auditing | Nov 11, 2026 |
| 2 | DKE content inaccessible to Copilot; user-defined permissions exception; Teams meeting and chat labels not recognized | Why AI changes the problem | verified | Same page | Nov 11, 2026 |
| 3 | EXTRACT common name Copy; Rights Management owner always has EXTRACT | Why AI changes the problem | verified | "Considerations to manage Microsoft 365 Copilot…," https://learn.microsoft.com/purview/ai-m365-copilot-considerations | Nov 11, 2026 |
| 4 | S/MIME email not returned by Copilot; without labels enabled for SPO/ODB, encrypted files limited to data in use in Office on Windows | Why AI changes; Prerequisites | verified | "Use Microsoft Purview to manage data security & compliance for Entra-registered AI apps," https://learn.microsoft.com/purview/ai-entra-registered | Nov 11, 2026 |
| 5 | CUI Basic sublabel grants EXTRACT tenant-wide; CUI Specified example rights omit EXTRACT | Why AI changes the problem | verified (in-workbook) | Book 12 Ch09 code block (`$tenantRights`, CUI-SP-TAX rights) | Nov 11, 2026 |
| 6 | Generative AI amplifies oversharing; weekly default assessment of top 100 sites; 4-day first delay; item-level scan limits (10 sites, no OneDrive, 200,000 items); Protect actions incl. Restricted Content Discovery; export formats | DSPM; data risk assessments | verified | "Prevent oversharing with data risk assessments from DSPM," https://learn.microsoft.com/purview/data-security-posture-management-oversharing | Nov 11, 2026 |
| 7 | New DSPM replaces DSPM for AI (classic); objectives; AI observability; Compliance Administrator role; Security Copilot integrations | DSPM | verified | "Learn about Data Security Posture Management," https://learn.microsoft.com/purview/data-security-posture-management-learn-about | Nov 11, 2026 |
| 8 | Prerequisites by monitored target (audit, Copilot license, Edge policy, device onboarding, browser extension, SDK, pay-as-you-go); admin units restriction | Prerequisites Purview names | verified | "Considerations for DSPM for AI… (classic)," https://learn.microsoft.com/purview/dspm-for-ai-considerations | Nov 11, 2026 |
| 9 | One-click policy names, solutions, modes; Adaptive Protection auto-on; unmanaged-app blocking | One-click policies | verified | Same page | Nov 11, 2026 |
| 10 | Item-level scan app permissions (Files.ReadWrite.All, Sites.ReadWrite.All, client secret) | Data risk assessments | verified | Same page | Nov 11, 2026 |
| 11 | Activity explorer AI events and known issues | Activity explorer | verified | Same page | Nov 11, 2026 |
| 12 | `CopilotInteraction` operation; prompt text via Content Search or activity explorer | Activity explorer | verified | "Audit log activities," https://learn.microsoft.com/purview/audit-log-activities | Nov 11, 2026 |
| 13 | DLP for Copilot: four protections; external email preview; email from Jan 1, 2025; no calendar; one condition type per rule; Custom template only; simulation; up to 4 hours; evaluated at file open | DLP for Microsoft 365 Copilot | verified | "Learn about using Microsoft Purview DLP to protect interactions with Microsoft 365 Copilot…," https://learn.microsoft.com/purview/dlp-microsoft365-copilot-location-learn-about | Nov 11, 2026 |
| 14 | Licensing: DLP restricting files/emails in E5/Purview suites not E3; DLP for prompts to all Copilot users | DLP for Microsoft 365 Copilot; Prerequisites | verified | "Microsoft Purview service description," DLP for Microsoft Copilot section | Nov 11, 2026 |
| 15 | PowerShell for the Copilot DLP policy (location ID, EnforcementPlanes, AdvancedRule, RestrictAccess ExcludeContentProcessing) | Step 4 | verified; `-Mode TestWithoutNotifications` added (valid Mode value of New-DlpCompliancePolicy); label GUID replaced with placeholder | "New-DlpCompliancePolicy," Example 4 | Nov 11, 2026 |
| 16 | Copilot availability by cloud (Teams and SharePoint not in GCCH; declarative agents not in DoD; web grounding off by default; Purview controls Yes ×4; IRM not in GCCH per footnote; Purview license G3/G5) | Prerequisites table | verified | "Microsoft Copilot" service description, Feature availability | Nov 11, 2026 |
| 17 | DSPM for AI availability with "browse to URL" footnotes per cloud | Prerequisites table | verified | Purview GCC, GCC High, DoD planning pages, Step 4 note 2 | Nov 11, 2026 |
| 18 | Auditing verify/turn on commands; value always False in SCC PowerShell; Audit Logs role | Step 1 | verified | "Turn auditing on or off," https://learn.microsoft.com/purview/audit-log-enable-disable | Nov 11, 2026 |
| 19 | GCC High / DoD connection parameters | Steps | verified | "Connect to Security & Compliance PowerShell"; "Connect to Exchange Online PowerShell" | Nov 11, 2026 |
| 20 | `Search-UnifiedAuditLog -RecordType DLPEndpoint` for endpoint DLP events | Step 6 | unverifiable on the pages read (record type name from the audit schema, not re-read today); the activity explorer step is the primary check | — | Nov 11, 2026 |
| 21 | AI data decisions, rings, exclusions, backout triggers | Decisions; How | restated-as-design | Program design | Nov 11, 2026 |

## Government-cloud gaps
- Current (non-classic) Data Security Posture Management, AI observability and data risk assessments: Learn's government planning pages list only "DSPM for AI"; written "not yet specified" for GCC, GCC High and DoD.
- DLP for Microsoft 365 Copilot location: no row of its own on the government pages; covered only by the Copilot service description's "Microsoft Purview controls" row. Written "not yet specified as its own row".
- DLP to restrict Copilot from processing external email (commercial preview): not yet specified in any government cloud.
- SharePoint Restricted Content Discovery: not yet specified for GCC, GCC High, DoD (not read on a government page).
- **Source conflict:** Insider Risk Management in GCC High — Purview GCC High planning page lists core IRM features Available; Microsoft Copilot service description note 11 says "Insider Risk Management isn't currently available for GCC-High." Chapter tells GCC High tenants to treat IRM as unavailable until reconciled. Needs Mike's attention / Microsoft confirmation.
- Minor: Learn's app-only authentication page gives a different DoD `ConnectionUri` (`https://compliance.dod.microsoft.com/powershell-liveid`) from the interactive connection page (`https://l5.ps.compliance.protection.office365.us/powershell-liveid/`); the chapter uses the interactive page's value.
