# Verification — Chapter 12, Operations and Evidence

Writer: Book 20 build (Nov 11, 2026). Learn pages read: 10. Sources opened Nov 11, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | CM-3 and CM-4 are in the SP 800-53B Moderate baseline | Change control | verified (in-workbook) | Book 00 Appendix D note aD-53-cm; SP 800-53B Moderate profile | Nov 11, 2026 |
| 2 | Labels shouldn't be deleted to undo a change; unpublish instead | Change control | restated-as-design | Program design, consistent with Chapters 02–03 | Nov 11, 2026 |
| 3 | Export cmdlets exist: Get-Label, Get-LabelPolicy, Get-AutoSensitivityLabelPolicy, Get-AutoSensitivityLabelRule, Get-DlpCompliancePolicy, Get-DlpComplianceRule (Security & Compliance PowerShell) | Configuration baseline | verified | Exchange PowerShell module reference ("Get-AutoSensitivityLabelRule," "New-DlpCompliancePolicy") | Nov 11, 2026 |
| 4 | Get-IRMConfiguration and Get-AdminAuditLogConfig run in Exchange Online PowerShell; UnifiedAuditLogIngestionEnabled only reliable there | Configuration baseline | verified | "Turn auditing on or off"; "Get-AdminAuditLogConfig" | Nov 11, 2026 |
| 5 | Get-AipServiceConfiguration returns full protection config incl. SuperUsersEnabled/SuperUsers; only via PowerShell | Configuration baseline | verified | "Get-AipServiceConfiguration"; "Connect-AipService" | Nov 11, 2026 |
| 7 | App-only certificate authentication for unattended scripts | Configuration baseline | verified | "App-only authentication for unattended scripts…" | Nov 11, 2026 |
| 8 | Auditing-status changes are audited; `Search-UnifiedAuditLog -Operations Set-AdminAuditLogConfig` | Drift detection | verified | "Turn auditing on or off" | Nov 11, 2026 |
| 9 | FMP-DET-05 and FMP-DET-06 exist in Book 12 Ch11 | Incident response | verified (in-workbook) | Book 12 Ch11 rule table | Nov 11, 2026 |
| 10 | Audit Standard 180 days; Premium one year default (Entra, Exchange, OneDrive, SharePoint) for E5-level users; up to 10 years with add-on; non-user records one year | Evidence catalog | verified | "Learn about auditing solutions in Microsoft Purview"; "Manage audit log retention policies" | Nov 11, 2026 |
| 11 | Audit Premium incl. 1-year and 10-year retention available in GCC | Evidence catalog | verified | Purview GCC planning page, Step 4 | Nov 11, 2026 |
| 12 | Implementation checklist, RACI, cadence, evidence retention (3 years), metrics formulas | Artifacts | restated-as-design | Program design | Nov 11, 2026 |

## GCC gaps
- None new beyond Chapter 11's; every feature this chapter relies on (audit, labels, DLP, auto-labeling, IRM configuration, AIPService) is listed on the GCC page or is PowerShell that GCC reaches with the commercial connection values.
