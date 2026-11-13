# Verification — Chapter 08, One Writer per Attribute

New material. Code: `clients/python/writer_check.py` (new); `tests/python/test_writer_check.py` (new, 6 tests); `tests/fixtures/writers/` (two fictional exports, new); the `isc-provisioning-policies` and `graph-sync-schema` rows in `config/calls.json`. Tests on November 1, 2026: as Chapter 01's log.

Vendor pages opened on November 1, 2026: Microsoft Learn, through the Learn MCP tools: Get synchronizationSchema; attributeMapping resource type; objectMapping resource type; Microsoft Entra ID synchronization API overview; Configure synchronization with directory extension attributes; national cloud deployments. SailPoint's OpenAPI specification v3 at commit `7f6741e`: `paths/provisioning-policies.yaml`, `schemas/ProvisioningPolicyDto.yaml`, `schemas/UsageType.yaml`, `schemas/FieldDetailsDto.yaml`, and the root `sailpoint-api.v3.yaml` for the path. FedRAMP Marketplace; NIST SP 800-53B Moderate profile 5.2.0.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Gap 4 and its design guidance | Why this is a build | carried forward | example guide |
| 2 | The one-writer check is planned for Pass 2 | Why this is a build | verified | implementation example |
| 3 | The schema read: endpoint, permissions (application least `CustomSecAttributeProvisioning.Read.All`), roles | Lab 2; facts | verified; the least-privileged entry is surprising (research gaps, row 71) | Learn, Get synchronizationSchema |
| 4 | `flowType` values and default; AD-to-Entra jobs ignore it | What this chapter adds; facts | verified | Learn, attributeMapping |
| 5 | objectMapping `enabled` and `flowTypes` | Facts | verified | Learn, objectMapping |
| 6 | Learn's examples name the directory "Azure Active Directory"; one page says "Microsoft Entra ID" | What couldn't be verified | verified (both seen) | Learn, Get synchronizationSchema; directory extension attributes |
| 7 | Provisioning policies: path, scopes, user level `ORG_ADMIN`, DTO fields | Facts | verified | SailPoint specification |
| 8 | `CREATE` and `UPDATE` meanings | What this chapter adds; facts | verified | `UsageType.yaml` |
| 9 | Pass 2's other items need a live instance or unverified internals | Why this is a build | inference from the example guide's unverified list | example guide |
| 10 | CA-7, CM-3, CM-4, CM-6, SI-4 at Moderate | Federal requirements | verified | OSCAL Moderate profile 5.2.0 |
| 11 | Lab 1 outputs | Lab 1 | verified by running the commands | local run |
| 12 | Lab 2 | Lab 2 | not run | — |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| Implementation example, Pass 2 list | Why this is a build | One approver per class, change records, SailPoint events and email intake aren't built; the reasons are given |
| Book 03, one writer into the directory | Why this is a build | — |

## Requirements and KSI pass, November 2, 2026

The federal requirements table gained a KSI column and a row for every Lab 1 and Lab 2 step and every file the kit's code writes for this chapter. Every row names the command or file that is the evidence.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| K1 | KSI IDs used: KSI-MLA-EVC, KSI-MLA-RVL, KSI-CMT-LMC, KSI-CMT-VTD, KSI-SCR-MIT, KSI-IAM-ELP, KSI-IAM-SNU. Each row's KSI is an indicator whose "Related SP 800-53 Controls" include that row's control | Federal requirements table | verified: FedRAMP's Key Security Indicators page read November 2, 2026 (46 indicators; the related-controls lists match Book 13, Appendix A and Book 14, Chapter 03, read October 21, 2026). No ID is new to the repository | FedRAMP, Key Security Indicators |
| K2 | AC-2, AC-6 and SA-11 added to the Moderate footnote's list | Federal requirements footnote | verified against the SP 800-53B Moderate OSCAL profile, release 5.2.0, read November 2, 2026; the footnote keeps its November 1 date for the controls first listed | NIST OSCAL Moderate profile |
| K3 | KSIs are FedRAMP 20x indicators for cloud providers; the agency lines its evidence up with them and doesn't report them | Sentence under the table | restated from Book 00, Appendix B | Book 00, Appendix B |
| K4 | RA-7, CA-5, AU-14 and CM-4 (base control) are cited by no indicator; rows that rest on them, on the program's tempo or on lab clean-up say "None" | Federal requirements table | verified | FedRAMP, Key Security Indicators |
