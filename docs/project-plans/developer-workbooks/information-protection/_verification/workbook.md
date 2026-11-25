# Verification — Building Information Protection (developer workbook, Chapters 01 to 09)

First pass of 2026-11-24, phase 2 of filling the Information Protection topic's gaps (owner's instruction of Nov 24, 2026: "Fill in the gap matrix"). Microsoft facts new to this workbook were read on Microsoft Learn on 2026-11-24; facts carried from Book 20 or the guide rely on their verification logs (`docs/books/b20-information-protection/_verification/`, `docs/books/guides/_verification/information-protection-implementation.md`) and are marked "carried". No personal name, email address or agency detail was sent in any request. Nothing was run in a tenant; every Lab 1 command was run as printed on the fixtures (`data/kit-captures/ip/`).

## Search before writing

Searched `origin/main` at 57843f00 on 2026-11-24 for existing kits and workbooks on Purview (`Get-Label`, `Get-DlpCompliancePolicy`, `Connect-IPPSSession`, `Get-AipService`, `Search-UnifiedAuditLog`, sensitivity label, DLP) across `examples/`, the developer workbooks and `scripts/`.

| Exists | Where | How this workbook uses it |
|---|---|---|
| The baseline export's nine files and the drift signals | Book 20, Chapter 12 | `config/calls.json` keeps the file names; `config/drift.json` encodes the six signals; Chapter 08 links Chapter 12 |
| The label taxonomy as code (New-Label, New-LabelPolicy) | Book 12, Chapter 09 | Not rebuilt: the kit reads, it doesn't deploy labels; Chapter 04 checks the result |
| The drift engine and its severity ladder | Book 13, Chapter 06 | P1 and P2 severities in `config/drift.json`; linked from Chapter 08 |
| Hashed, chained evidence with controls and KSIs | `examples/defender-xdr`, `examples/provider-notices` | The same record shape and `-Check -Stage` go/no-go, written fresh for this kit |
| A DLP and label alerts tab | `examples/daily-checks-workbook` | Not touched: it triages alerts; this kit checks configuration |

No conflict found with Book 20, Book 12 or the guide on any fact this workbook uses.

## Claims log

| # | Claim (short) | Chapter | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | No ConnectionUri needed for Microsoft 365 or Microsoft 365 GCC | 01, 02 | verified | Connect to Security & Compliance PowerShell | Nov 24, 2026 |
| 2 | `Get-ConnectionInformation`: module 3.0.0 or later; output TenantID, State, IsEopSession (True for SCC), Organization only for CBA or managed identity | 01, 02, 09 | verified | Get-ConnectionInformation | Nov 24, 2026 |
| 3 | `Get-RoleGroupMember`: Identity applicable to Security & Compliance; no output properties listed | 01 | verified | Get-RoleGroupMember | Nov 24, 2026 |
| 4 | Security groups in Purview role groups: commercial only per Learn's wording | 01 | carried | Book 20, Chapter 10 | Nov 11, 2026 |
| 5 | Audit status read in Exchange Online PowerShell; always False in SCC | 02, 07 | carried | Turn auditing on or off | Nov 11, 2026 |
| 6 | `Get-AipServiceConfiguration` returns SuperUsersEnabled and SuperUsers; "You must use PowerShell to see a full list of protection configuration values" | 02, 05 | verified | Get-AipServiceConfiguration | Nov 24, 2026 |
| 7 | `Get-Label` SCC only; `-IncludeDetailedLabelActions`; no output section | 02, 04 | verified | Get-Label | Nov 24, 2026 |
| 8 | `Export-ContentExplorerData` output fields | 02, 03 | carried | Export-ContentExplorerData | Nov 11, 2026 |
| 9 | ExchangeOnlineManagement 3.10.0+ needs PowerShell 7.6.0; current 3.10.1 | 02, 09 | verified | About the Exchange Online PowerShell module | Nov 24, 2026 |
| 10 | AIPService: 5.1, or 7.4+ with 3.1.0.0 | 02, 09 | verified | Install the AIPService PowerShell module | Nov 24, 2026 |
| 11 | App-only syntax for both shells; `.onmicrosoft.com` organization; thumbprint Windows only; SCC app-only needs 3.0.0 | 02, 09 | verified | App-only authentication ... | Nov 24, 2026 |
| 12 | `Connect-AipService`: syntax block shows Credential, AccessToken, Environment sets; Example 4 uses certificate and -ServicePrincipal; inconsistent, so the kit keeps the read delegated | 02, 09 | verified (as an inconsistency) | Connect-AipService | Nov 24, 2026 |
| 13 | Content explorer Available in GCC; Teams data in development | 03 | verified | Purview GCC planning page | Nov 24, 2026 |
| 14 | Content explorer roles | 03 | carried | Get started with Content Explorer (classic) | Nov 11, 2026 |
| 15 | `EncryptionRightsDefinitions` identity:rights format | 04 | carried | New-Label (Book 12, Ch 09; Book 20, Ch 02) | Oct 21 and Nov 11, 2026 |
| 16 | Rights go to groups or the domain, never individuals | 04 | carried (program design) | Book 20, Chapter 02 | Nov 11, 2026 |
| 17 | Default labels set by GUID with `-AdvancedSettings` | 04 | carried | Set-LabelPolicy | Nov 11, 2026 |
| 18 | Disabling the super user feature doesn't remove users | 05 | carried | Disable-AipServiceSuperUserFeature | Nov 11, 2026 |
| 19 | Mail flow rule test modes | 05 | carried | Test mail flow rules in Exchange Online | Nov 11, 2026 |
| 20 | DLP and auto-labeling Mode values; the seven-day auto-enable option | 06 | carried | New-DlpCompliancePolicy; New-AutoSensitivityLabelPolicy; Automatically apply a sensitivity label | Nov 11, 2026 |
| 21 | Label and Copilot audit operation names; no guaranteed search latency; search roles | 07 | carried | Audit log activities; Search the audit log; Best practices | Nov 11, 2026 |
| 22 | Audit GCC rows | 07 | verified | Purview GCC planning page | Nov 24, 2026 |

## What the workbook adds (program design, not a Learn claim)

- The stage vocabulary (`simulation`, `notify`, `enforce`, `retired`) and its mapping to `Mode`.
- The drift severities' assignment to Book 20's signals, and "explained" as a ticket approved between two exports.
- The metrics the kit computes, and the rest reported as not computed.
- The fixtures' property names follow the cmdlets' parameter names; Learn lists no output properties for `Get-Label`, `Get-LabelPolicy` or `Get-RoleGroupMember`. Chapter 02's Lab 2 compares a real export.
