# Verification — Chapter 04, Teams, Groups and SharePoint Containers

Writer: Book 20 build (Nov 11, 2026). All sources opened Nov 11, 2026. Claims sourced to Microsoft Learn: 10.

## Claims log

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | Container settings; items don't inherit; owners act through the label | What a container label does | verified | Learn, "Use sensitivity labels to protect collaborative workspaces (groups and sites)" | Nov 11, 2026 |
| 2 | Privacy locks; removing the label leaves the privacy setting | What a container label does; Rollback | verified | Same | Nov 11, 2026 |
| 3 | External sharing options; unmanaged devices need app-enforced restrictions and no looser than the tenant; authentication context dependencies | Container classes | verified | Same | Nov 11, 2026 |
| 4 | DefaultSharingScope and DefaultShareLinkPermission values; the more restrictive applies | Container classes; Enforcement | verified | Learn, "Use sensitivity labels to configure the default sharing link type" | Nov 11, 2026 |
| 5 | MembersCanShare values | Container classes; Enforcement | verified | Learn, "Use sensitivity labels to protect collaborative workspaces" | Nov 11, 2026 |
| 6 | Group creation: all users by default (recommended); one group; roles; Entra ID P1; the script; 30 minutes | Who may create containers; Enforcement | verified | Learn, "Manage who can create Microsoft 365 Groups" | Nov 11, 2026 |
| 7 | Authentication context on labeled sites on the engineering backlog in GCC, GCC High and DoD | Prerequisites | verified | Learn, "Plan for Microsoft Purview compliance and risk management solutions" for GCC, GCC High and DoD deployments, Step 4 | Nov 11, 2026 |
| 8 | Authentication context licensing E5/G5-level | Prerequisites | verified | Learn, "Microsoft Purview service description" | Nov 11, 2026 |
| 9 | Connect-MgGraph -Environment USGov and USGovDoD | Enforcement | verified | Learn, "Authentication module cmdlets in Microsoft Graph PowerShell" | Nov 11, 2026 |
| 10 | App-enforced restrictions Conditional Access steps | Enforcement | verified | Learn (SharePoint), "Use app-enforced restrictions" | Nov 11, 2026 |
| 11 | Set-SPOTenant -ConditionalAccessPolicy AllowLimitedAccess | Enforcement | unverifiable | Value from SharePoint "Control access from unmanaged devices", linked from the container page but not fetched in this session | Nov 11, 2026 |
| 12 | Connect-SPOService -Region ITAR with sharepoint.us for GCC High and DoD | Enforcement | unverifiable | Combined from SharePoint Online PowerShell connection guidance, as in Chapter 07; confirm in a GCC High or DoD tenant | Nov 11, 2026 |
| 13 | LabelMismatchEmailHelpLink and the mismatch email | Enforcement | verified | Learn, "Use sensitivity labels to protect collaborative workspaces," Auditing | Nov 11, 2026 |
| 14 | Set-SPOSite and Set-SPOTenant -SensitivityLabel; module 16.0.19418.12000+ | Enforcement | verified | Same, Use PowerShell to apply a sensitivity label to multiple sites | Nov 11, 2026 |
| 15 | Get-SPOSite properties SensitivityLabel, ConditionalAccessPolicy, SharingCapability | Enforcement | unverifiable | Property names not re-read on Learn today; confirm in a test tenant | Nov 11, 2026 |
| 16 | Don't change published container settings; 24 hours; clearing External user access doesn't remove guests | Rollback | verified | Same, Sensitivity label management | Nov 11, 2026 |
| 17 | Disabling container labels reverts to the Classification property | Rollback | verified | Same, How to disable | Nov 11, 2026 |
| 18 | Design values per container class | Container classes | restated-as-design | Program design | Nov 11, 2026 |

## Government-cloud gaps

- Default sharing link and MembersCanShare advanced settings, app-enforced restrictions and the group-creation restriction aren't listed on the government Purview pages: not yet specified.
