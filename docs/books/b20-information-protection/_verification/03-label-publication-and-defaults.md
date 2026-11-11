# Verification — Chapter 03, Label Publication and Defaults

Writer: Book 20 build (Nov 11, 2026). All sources opened Nov 11, 2026. Claims sourced to Microsoft Learn: 12.

## Claims log

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | Default label for five item types; users can change it | Defaults | verified | Learn, "Learn about sensitivity labels," What label policies can do | Nov 11, 2026 |
| 2 | Auto-labeling doesn't override a manual label but can override a default | Defaults | verified | Learn, "Manage sensitivity labels in Office apps," Require users to apply a label | Nov 11, 2026 |
| 3 | Outlook-specific default and mandatory options | Defaults | verified | Learn, "Manage sensitivity labels in Office apps," Outlook-specific options | Nov 11, 2026 |
| 4 | Meeting default independent of email; Teams applies it to new events only; Teams Premium for some options | Defaults | verified | Learn, "Use sensitivity labels to protect calendar items, Teams meetings, and chat" | Nov 11, 2026 |
| 5 | Power BI default not retroactive; not for service principals, APIs or B2B | Defaults | verified | Learn (Fabric), "Default label policy for Fabric and Power BI"; Power BI implementation planning | Nov 11, 2026 |
| 6 | Mandatory labeling: can't remove labels; print to PDF unavailable | Mandatory labeling | verified | Learn, "Manage sensitivity labels in Office apps" | Nov 11, 2026 |
| 7 | Licensing: manual from E3/G3; Power BI with E3 or EMS E3; library default with E5/G5 | Authority block | verified | Learn, "Microsoft Purview service description" | Nov 11, 2026 |
| 8 | Library default label in development in GCC, GCC High and DoD | Prerequisites | verified | Learn, "Plan for Microsoft Purview compliance and risk management solutions" for GCC, GCC High and DoD deployments, Step 4 | Nov 11, 2026 |
| 9 | Set-LabelPolicy -Settings reserved for internal use; -WhatIf doesn't work | Enforcement | verified | Learn, "Set-LabelPolicy" | Nov 11, 2026 |
| 10 | Supported AdvancedSettings for built-in labeling; a null string removes a setting | Enforcement | verified | Learn, "Set-LabelPolicy," -AdvancedSettings | Nov 11, 2026 |
| 11 | Portal path for publishing policies; use GUIDs; allow 24 hours | Enforcement | verified | Learn, "Create and configure sensitivity labels and their policies" | Nov 11, 2026 |
| 12 | Outlook versions for a separate default (Current Channel 2105+, SAEC 2108+) | Prerequisites | verified | Learn, "Minimum versions for sensitivity labels in Office apps" | Nov 11, 2026 |
| 13 | Pilot size, thresholds, rings | Pilot; Change safety | restated-as-design | Program design | Nov 11, 2026 |
| 14 | Search-UnifiedAuditLog -RecordType SensitivityLabelAction | Validate | unverifiable | Record type name as used in Chapter 10; the chapter gives a fallback search | Nov 11, 2026 |

## Government-cloud gaps

- Meeting labels, Teams Premium protections and Power BI default and mandatory labeling aren't listed on the government Purview pages: not yet specified.
