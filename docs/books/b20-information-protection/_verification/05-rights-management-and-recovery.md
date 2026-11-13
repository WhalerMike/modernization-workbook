# Verification — Chapter 05, Rights Management and Recovery

Writer: Book 20 build (Nov 11, 2026). Learn pages read for this chapter: 21. Sources opened Nov 11, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | When the service is active, all users can apply and open encryption | What the service does | verified | Activate the Azure Rights Management service, https://learn.microsoft.com/purview/activate-rights-management-service | Nov 11, 2026 |
| 2 | Automatic activation for subscriptions from late Feb 2018; earlier Exchange Online subscriptions activated by Microsoft | What the service does | verified | Same page, "Automatic activation" | Nov 11, 2026 |
| 3 | Don't activate with AD RMS; Message Encryption incompatible with AD RMS | What the service does | verified | Same page; Set up Message Encryption, https://learn.microsoft.com/purview/set-up-new-message-encryption-capabilities | Nov 11, 2026 |
| 4 | Keep root key and TPD before deactivating if production content encrypted | What the service does; Rollback | verified | Decommission and deactivate the Azure Rights Management service, https://learn.microsoft.com/purview/deactivate-rights-management-service | Nov 11, 2026 |
| 5 | Onboarding controls take a group object ID, not users; everyone can still consume; `-UseRmsUserLicense` | Pilot; Enforcement | verified | Activate page, "Configuring onboarding controls" | Nov 11, 2026 |
| 6 | Super user has Full Control on all tenant-encrypted content; can decrypt even after expiry; time added doesn't matter | Recovery | verified | Configure super users, https://learn.microsoft.com/purview/encryption-super-users; Enable-AipServiceSuperUserFeature | Nov 11, 2026 |
| 7 | Microsoft recommends enabling the feature only as needed and disabling during standard operations, exception for a trusted app | Decide | verified | Enable-AipServiceSuperUserFeature, https://learn.microsoft.com/powershell/module/aipservice/enable-aipservicesuperuserfeature | Nov 11, 2026 |
| 8 | Group membership cached; changes can take up to three hours; subject to change | Why individually | verified | Rights Management users and groups, "Group membership caching", https://learn.microsoft.com/purview/rights-management-users-groups | Nov 11, 2026 |
| 9 | Add super users individually with Add-AipServiceSuperUser for immediate access | Why individually | verified | Configure super users page | Nov 11, 2026 |
| 10 | Disabling the feature doesn't remove super users; remove first | Recovery enforcement | verified | Disable-AipServiceSuperUserFeature, https://learn.microsoft.com/powershell/module/aipservice/disable-aipservicesuperuserfeature | Nov 11, 2026 |
| 11 | PIM for Entra roles rather than PIM for Groups avoids activation delays for Purview admin | Why individually | verified | PIM for Groups concept, https://learn.microsoft.com/entra/id-governance/privileged-identity-management/concept-pim-for-groups | Nov 11, 2026 |
| 12 | At least two approvers recommended; approvers can't approve own requests | Recovery prerequisites; exclusions | verified | Configure PIM for Groups settings; Approve activation requests (groups) | Nov 11, 2026 |
| 13 | Recovery design (eligible role, individual add, remove then disable) | Decide; Recovery | restated-as-design | Program position built on items 6-12 | Nov 11, 2026 |
| 14 | Roles: Compliance Administrator / Compliance Data Administrator; AIP administrator accepted by Connect-AipService | Prerequisites | verified | Activate page; Connect-AipService, https://learn.microsoft.com/powershell/module/aipservice/connect-aipservice | Nov 11, 2026 |
| 15 | AIPService 3.1.0.0+ for PowerShell 7.4; .NET 4.8 for 5.1 | Prerequisites | verified | Install the AIPService module, https://learn.microsoft.com/purview/install-aipservice-powershell | Nov 11, 2026 |
| 16 | Message Encryption licensing (E3/E5, G3/G5; per user) | Prerequisites | verified | Message encryption FAQ, https://learn.microsoft.com/purview/ome-faq | Nov 11, 2026 |
| 18 | Government availability rows (Message Encryption, co-authoring, BYOK, DKE, eDiscovery RMS decryption) | Prerequisites table | verified | Purview GCC planning page, Step 4 table | Nov 11, 2026 |
| 19 | Usage logging on by default; 15 minutes; previous dates only; forensic source; file access/denied events lack file name and aren't in unified audit log | Report-only; Telemetry | verified | Usage logging for the Azure Rights Management service, https://learn.microsoft.com/purview/rights-management-usage-logging | Nov 11, 2026 |
| 20 | Admin log records super user enablement and additions; super user decryptions not marked as such | Telemetry | verified | Configure super users page, "Security best practices" | Nov 11, 2026 |
| 21 | Remove-FileLabel removes template label and protection; -RemoveProtection for custom permissions | Recovery | verified | Remove-FileLabel, https://learn.microsoft.com/powershell/module/purviewinformationprotection/remove-filelabel | Nov 11, 2026 |
| 22 | eDiscovery decrypts on export through super user integration with Exchange Online | Recovery prerequisites; Validate | verified | Configure super users page, "Removing encryption from PST files" | Nov 11, 2026 |
| 23 | Microsoft recommends completing BYOK before setting up Message Encryption | Decide | verified | Set up Message Encryption, "Configure management of your Azure Rights Management tenant key" | Nov 11, 2026 |
| 25 | Decryption-continuity test steps and ring exit criteria | Validate; Enforcement | restated-as-design | Program design | Nov 11, 2026 |

## Government-cloud gaps
- Super user feature: not listed on the GCC Purview planning page (written "not yet specified").
- Rights Management usage logging (`Get-AipServiceUserLog`): not listed on the government pages (not yet specified).
