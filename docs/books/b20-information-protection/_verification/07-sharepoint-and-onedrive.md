# Verification — Chapter 07, SharePoint and OneDrive

Writer: Book 20 build (Nov 11, 2026). Learn pages read for this chapter: 14. Sources opened Nov 11, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | Until enabled, SPO/ODB can't process encrypted files: no coauthoring, eDiscovery, DLP, search | Intro | verified (quoted) | Enable sensitivity labels for files in SharePoint and OneDrive, https://learn.microsoft.com/purview/sensitivity-labels-sharepoint-onedrive-files | Nov 11, 2026 |
| 2 | What changes after enabling; three audit events | What label integration changes | verified | Same page | Nov 11, 2026 |
| 3 | Limits: existing files need edit/re-upload; expiry and DKE not processed; password-protected; >12 MB copied across sites; Power Query/custom XML/bibliography/Document ID; deleted label; no print/download/export in web | Limits table | verified | Same page, Limitations | Nov 11, 2026 |
| 4 | Set-SPOTenant -EnableAIPIntegration $true; ~15 minutes; per geo; module versions | Enforcement | verified | Same page | Nov 11, 2026 |
| 5 | PDF support may increase auto-labeling volume; EnableSensitivityLabelforPDF; module version | Decide; Enforcement | verified | Same page, "Adding support for PDF" | Nov 11, 2026 |
| 6 | Publishing safeguard: test users, wait an hour, wait a day | Prerequisites | verified | Same page, "Publishing and changing sensitivity labels" | Nov 11, 2026 |
| 7 | Opt-out mixed state and how to restore | Rollback | verified | Same page, opt-out section | Nov 11, 2026 |
| 8 | IRM vs labels coexistence behavior | IRM procedure | verified | Same page, IRM section | Nov 11, 2026 |
| 9 | IRM libraries: no browser editing, one-at-a-time, check-out | IRM procedure | verified | Set up IRM in SharePoint admin center, https://learn.microsoft.com/purview/set-up-irm-in-sp-admin-center | Nov 11, 2026 |
| 10 | Library Settings > IRM > "Restrict permission to documents in this library on download" | IRM enforcement | verified | Apply IRM to a list or library, https://learn.microsoft.com/purview/apply-irm-to-a-list-or-library | Nov 11, 2026 |
| 11 | List.IrmEnabled in CSOM | IRM prerequisites | verified | List.IrmEnabled property reference | Nov 11, 2026 |
| 12 | PnP PowerShell commands (Connect-PnPOnline -Interactive -ClientId; Get-PnPList; Get-PnPProperty) | IRM pilot | unverifiable on Learn | PnP PowerShell is community-maintained; documented outside Learn; labeled as such in the chapter | Nov 11, 2026 |
| 13 | InformationProtectionLabelId managed property; Get-Label GUIDs | IRM enforcement | verified | Enable sensitivity labels for SPO/ODB, search section | Nov 11, 2026 |
| 14 | Default library label In development in GCC | IRM enforcement; table | verified | Purview GCC planning page, Sensitivity labeling rows | Nov 11, 2026 |
| 15 | Co-authoring metadata change, consequences, minimum versions, roles, portal steps, 24 h, PowerShell-only disable with loss | Co-authoring | verified | Enable co-authoring for files encrypted with sensitivity labels, https://learn.microsoft.com/purview/sensitivity-labels-coauthoring | Nov 11, 2026 |
| 16 | Set-PolicyConfig -EnableLabelCoauth; Get-PolicyConfig exists | Co-authoring enforcement | verified (parameter); reading the property from Get-PolicyConfig output is inferred | Set-PolicyConfig, Get-PolicyConfig references | Nov 11, 2026 |
| 17 | Co-authoring Available in GCC | Co-authoring prerequisites | verified | GCC planning page | Nov 11, 2026 |
| 20 | Unlock-SPOSensitivityLabelEncryptedFile removes label and encryption without site access; justification in audit and usage log; admin-defined permissions only | Validate | verified | Enable sensitivity labels for SPO/ODB, "Remove encryption for a labeled document" | Nov 11, 2026 |
| 21 | Container labels don't label files (via Book 12 Ch09) | Intro | verified (cross-reference) | Book 12, Chapter 09 | Nov 11, 2026 |
| 22 | Dispositions, ring criteria, IRM-stays-on in GCC, Unlock held to super-user approval | Decide; procedures | restated-as-design | Program design | Nov 11, 2026 |

## GCC gaps
- `EnableAIPIntegration` (sensitivity labels for Office files in SharePoint and OneDrive) isn't listed separately on the GCC page (not yet specified); dependent features are listed Available.
- Encrypted labeled PDFs searchable/eDiscoverable: row absent on the GCC page (not yet specified).
- SharePoint IRM and `Unlock-SPOSensitivityLabelEncryptedFile`: not on the GCC page (not yet specified).
- Default library label: In development in GCC.
