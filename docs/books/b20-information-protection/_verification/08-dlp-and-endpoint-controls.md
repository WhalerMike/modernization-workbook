# Verification — Chapter 08, DLP and Endpoint Controls

Writer: Book 20 build (Nov 11, 2026). Learn pages read: 18. Sources opened Nov 11, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | Microsoft's DLP planning stages: simulation without tips, simulation with tips, full enforcement | Design from data outcomes | verified | Plan for data loss prevention, <https://learn.microsoft.com/purview/dlp-overview-plan-for-dlp> | Nov 11, 2026 |
| 2 | Outcome statements, label-first and one-owner rules | Design from data outcomes | restated-as-design | Program position | Nov 11, 2026 |
| 3 | Simulation runs as if enforced, separate dashboard, replaces Test states | Simulation is the pilot | verified | Learn about DLP simulation mode, <https://learn.microsoft.com/purview/dlp-simulation-mode-learn> | Nov 11, 2026 |
| 4 | Up to 15 days; SPO/ODB existing and new items, Exchange/Teams/devices new only; data kept 30 days | Simulation is the pilot | verified | Same | Nov 11, 2026 |
| 5 | Copy-tune-simulate-switch example | Simulation is the pilot | verified | Same | Nov 11, 2026 |
| 6 | Mode values Enable, Disable, TestWithNotifications, TestWithoutNotifications | Simulation is the pilot | verified | New-DlpCompliancePolicy, <https://learn.microsoft.com/powershell/module/exchangepowershell/new-dlpcompliancepolicy> | Nov 11, 2026 |
| 7 | Only the most restrictive, highest-priority tip is shown, including simulation-mode policies | Simulation is the pilot | verified | Send email notifications and show policy tips, <https://learn.microsoft.com/purview/dlp-use-notifications-and-policy-tips> | Nov 11, 2026 |
| 8 | Overrides with justification or false positive are logged; override is per rule; NotifyAllowOverride needs BlockAccess and BlockAccessScope | Policy tips, overrides | verified | Same | Nov 11, 2026 |
| 9 | msip_justification header order and 500-character limit | Policy tips, overrides | verified | DLP policy reference, <https://learn.microsoft.com/purview/dlp-policy-reference> | Nov 11, 2026 |
| 10 | Override positions per data class | Policy tips, overrides | restated-as-design | Program position; Microsoft example of internal override vs. no external override cited | Nov 11, 2026 |
| 11 | Tuning loop and ring exit criterion owned by the policy owner | False positives | restated-as-design | Program method | Nov 11, 2026 |
| 12 | Scope exception parameters; can't combine inclusions and exclusions; no Microsoft 365 Groups for sender/OneDrive group parameters | Exceptions | verified | New-DlpCompliancePolicy | Nov 11, 2026 |
| 13 | ExceptIf* rule parameters including ExceptIfRecipientDomainIs | Exceptions | verified | New-DlpComplianceRule, <https://learn.microsoft.com/powershell/module/exchangepowershell/new-dlpcompliancerule> | Nov 11, 2026 |
| 14 | Endpoint DLP: Windows 10/11, Windows Server 2019+, servers off until enabled, classification disabled by server updates, onboarding shared with Defender for Endpoint | Endpoint DLP on Windows | verified | Onboard Windows devices into Microsoft 365 overview, <https://learn.microsoft.com/purview/device-onboarding-overview> | Nov 11, 2026 |
| 15 | Intune is the preferred onboarding method; other methods in order | Endpoint DLP on Windows | verified | Manage devices with Intune overview, <https://learn.microsoft.com/security/zero-trust/manage-devices-with-intune-overview> | Nov 11, 2026 |
| 16 | Endpoint business-justification display options, up to five custom options | Endpoint DLP on Windows | verified | Configure endpoint DLP settings, <https://learn.microsoft.com/purview/dlp-configure-endpoint-settings> | Nov 11, 2026 |
| 17 | Action ladder Allow (devices only), Audit only, Block with override, Block | Endpoint DLP on Windows | verified | Create and deploy DLP policies, <https://learn.microsoft.com/purview/dlp-create-deploy-policy> | Nov 11, 2026 |
| 18 | Alerts go to the DLP Alerts dashboard and Defender XDR; incident severity High feeds Insider Risk Management | DLP incidents | verified | DLP policy reference | Nov 11, 2026 |
| 19 | Incident handling steps and roles | DLP incidents | restated-as-design | Program design | Nov 11, 2026 |
| 20 | Trial adds Teams and devices; after trial these locations can't be edited or added | Prerequisites | verified | Learn about the Microsoft Purview Suite trial, <https://learn.microsoft.com/purview/purview-trial> | Nov 11, 2026 |
| 21 | Endpoint DLP included plans | Prerequisites (endpoint) | verified | Microsoft Purview service description | Nov 11, 2026 |
| 22 | GCC availability: DLP files/email, Teams, endpoint, alerts, Activity Explorer, MDCA integration, on-premises scanner Available in GCC | Prerequisites | verified | Learn Purview GCC planning page, Step 4 | Nov 11, 2026 |
| 24 | ExchangeEnvironmentName values | Telemetry | verified | App-only authentication page, Connection examples | Nov 11, 2026 |
| 25 | DLP audit record types | Telemetry | verified | Microsoft services that support auditing, <https://learn.microsoft.com/purview/audit-supported-services> | Nov 11, 2026 |
| 26 | Set-DlpCompliancePolicy has ExchangeSenderMemberOf and Mode; Disable example | Enforcement, Rollback | verified | Set-DlpCompliancePolicy, <https://learn.microsoft.com/powershell/module/exchangepowershell/set-dlpcompliancepolicy> | Nov 11, 2026 |
| 27 | EndpointDlpLocation requires Compliance Administrator or Compliance Data Administrator in Entra ID | Prerequisites (endpoint) | verified | New-DlpCompliancePolicy | Nov 11, 2026 |
| 28 | Control requirement rows (AC-4, SI-4, MP-7, CM-3) | Requirements | restated-as-design | Mapping is the program's; control titles checked against SP 800-53 Rev. 5 OSCAL 5.2.0 | Nov 11, 2026 |

## GCC gaps

- DLP simulation mode (the dashboard experience) isn't listed separately on the GCC planning page: "not yet specified".
- Licensing differences between commercial and GCC plans for Teams and endpoint DLP: the service description doesn't separate them by cloud; not yet specified.
