# Verification — Chapter 06, Exchange Message Encryption

Writer: Book 20 build (Nov 11, 2026). Learn pages read for this chapter: 18. Sources opened Nov 11, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | Only prerequisite is Rights Management active; Message Encryption activated automatically; not compatible with AD RMS | Intro; Prerequisites | verified | Set up Message Encryption, https://learn.microsoft.com/purview/set-up-new-message-encryption-capabilities | Nov 11, 2026 |
| 2 | Rules combine conditions; Message Encryption encrypts replies | Two mechanisms | verified | Message encryption, https://learn.microsoft.com/purview/ome | Nov 11, 2026 |
| 3 | Can't encrypt inbound mail from outside; hybrid needs mail routed through Exchange Online | Two mechanisms; Exclusions; Prerequisites | verified | Define mail flow rules to encrypt email messages, https://learn.microsoft.com/purview/define-mail-flow-rules-to-encrypt-email | Nov 11, 2026 |
| 4 | Encrypt-Only and Do Not Forward options available in rules | Decide | verified | Same page | Nov 11, 2026 |
| 5 | OTPEnabled, SocialIdSignIn, SimplifiedClientAccessEnabled, AllowRMSSupportForUnenlightenedApps (off by default; iOS DNF workaround), DecryptAttachmentForEncryptOnly (off by default) | Decide; Prerequisites | verified | Manage message encryption, https://learn.microsoft.com/purview/manage-office-365-message-encryption | Nov 11, 2026 |
| 6 | New-TransportRule with -ApplyRightsProtectionTemplate Encrypt / Do Not Forward and -ApplyRightsProtectionCustomizationTemplate | Pilot | verified | Same page, "Ensure all external recipients use the encrypted message portal" | Nov 11, 2026 |
| 7 | Message Encryption licensing; per-user | Prerequisites | verified | Message encryption FAQ, https://learn.microsoft.com/purview/ome-faq | Nov 11, 2026 |
| 8 | Advanced Message Encryption licensing (M365 E5/G5, E5/G5 IP&G, O365 E5/G5) | Prerequisites | verified | Microsoft Purview service description, AME section | Nov 11, 2026 |
| 9 | GCC availability: Message Encryption, Advanced Message Encryption and the revocation extension | Prerequisites table | verified | Purview GCC planning page, Encryption rows | Nov 11, 2026 |
| 10 | Mail flow rules available in GCC | Prerequisites table | verified | Exchange Online for US government environments | Nov 11, 2026 |
| 12 | Get-IRMConfiguration AzureRMSLicensingEnabled; Test-IRMConfiguration; licensing-location fix | Prerequisites | verified | Set up Message Encryption | Nov 11, 2026 |
| 13 | Default template can be modified; New-OMEConfiguration needs AME | Prerequisites | verified | Add your organization's brand, https://learn.microsoft.com/purview/add-your-organization-brand-to-encrypted-messages | Nov 11, 2026 |
| 14 | Set-OMEConfiguration -DisclaimerText -EmailText -PortalText parameter names | Prerequisites | verified (named in Learn's branding table and cmdlet reference link; parameter list not opened in full) | Same page | Nov 11, 2026 |
| 15 | Expiry 1–730 days, external only, custom branding required | Prerequisites | verified | Set an expiration date for email encrypted by AME, https://learn.microsoft.com/purview/ome-advanced-expiration | Nov 11, 2026 |
| 16 | Test modes, incident report, wait 30 minutes; rules can take >15 min; rule report needs severity, 24 h to 5 days | Pilot; Report-only; Rollback | verified | Test mail flow rules in Exchange Online | Nov 11, 2026 |
| 17 | Rule Mode values Audit, AuditAndNotify, Enforce | Pilot | verified | Tenant Configuration Management Exchange resources (transportRule), https://learn.microsoft.com/graph/utcm-exchange-resources | Nov 11, 2026 |
| 18 | -GenerateIncidentReport $null and -FromMemberOf $null clear the condition/action | Enforcement | unverifiable on a page read this session | Standard Exchange PowerShell behavior for clearing a parameter; confirm in the test tenant | Nov 11, 2026 |
| 19 | Disable-TransportRule keeps settings | Rollback | verified | Mail flow rules (transport rules) in Exchange Online | Nov 11, 2026 |
| 20 | Audit-log operation names for rule changes; 180-day default retention | Telemetry | verified | Use the audit log to identify Exchange transport rule activities | Nov 11, 2026 |
| 21 | Get-OMEMessageStatus / Set-OMEMessageRevocation; Compliance or Exchange Administrator | Validate | verified | Revoke email encrypted by AME | Nov 11, 2026 |
| 22 | Revocation only for link-based branded messages, not native inline Outlook | Validate | verified | Set-OMEMessageRevocation reference | Nov 11, 2026 |
| 23 | AME portal activity log and encryption report | Telemetry | verified | Advanced Message Encryption, https://learn.microsoft.com/purview/ome-advanced-message-encryption | Nov 11, 2026 |
| 24 | Scenario table, recipient-experience positions, ring exit criteria | Decide; Enforcement | restated-as-design | Program design | Nov 11, 2026 |

## Government-cloud gaps
- One-time passcodes, social ID sign-in and the Encrypt button in Outlook on the web: not listed separately on any government page (not yet specified).
