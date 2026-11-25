# Verification — Guide: Requesting a Managed Service Account

New page, November 25, 2026. Mike asked to "Create document set for requesting", said "For future integration, when they move to EntraID, we tag everything", and asked "Should we use standards from EntraID to inform MSA naming?" Shown one tag set, owners in AD (a change to WD-173, approved earlier the same day) and a request pack built like the Ticket-to-Machine task catalog pack, he answered "Yes to all three". Settled as WD-175.

## What the search of current content found (origin/main, November 25, 2026)

- No request forms, approver checklist or change template for managed service accounts existed. The pattern for a work-side pack is the Ticket-to-Machine task catalog pack (`examples/ttm-task-catalog`, `ttm-task-catalog.md`): neutral templates, fictional examples, a checker and Copilot prompts, downloaded at work and never sent back. This pack follows it.
- The request's fields already existed as Chapter 12's request import format and the standard's S1 step; the pack reuses Chapter 12's check rather than a second copy of the rules.
- Tags: the Non-Person Identity guide's Step 1f made custom security attributes optional (`SystemId`, `Environment`, `Tier`); WD-172 set `SystemId`, `Owner1`, `Owner2`, `Sponsor` for AWS and OCI; Step 4 uses an attribute set with `Environment` and `DataClass` for Conditional Access. WD-175 unifies the first two and keeps Step 4's use.
- Conflict raised with Mike before writing: WD-173 kept owners out of AD; "tag everything" puts them in. He chose owners in AD, with SailPoint as the source and NPI-STD-30 as the check.
- Naming: the workbook covered only the Microsoft 365 group naming policy (Book 04, Chapter 09; Book 06, Chapter 17). Nothing covered the Cloud Adoption Framework's naming or Entra workload identity names.

## Claims and sources

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| MR-01 | Custom security attributes: users and service principals; free in all editions; 64-character values, 50 values per object | Tags | supported by the source | Learn, "What are custom security attributes in Microsoft Entra ID?" |
| MR-02 | Attribute Assignment Administrator can update custom security attributes on managed identities | Tags | supported by the source (the role's permission list; the apps how-to page doesn't mention managed identities) | Learn, "Microsoft Entra built-in roles" |
| MR-03 | Graph body `customSecurityAttributes` with `#Microsoft.DirectoryServices.CustomSecurityAttributeValue`; `Update-MgServicePrincipal -CustomSecurityAttributes` | Tags | supported by the source | Learn, Graph custom security attribute examples (Example 2); "Manage custom security attributes for an application" |
| MR-04 | Azure resource tags: 50 pairs; not inherited from a resource group or subscription | Tags | supported by the source | Learn, "Use tags to organize your Azure resources" |
| MR-05 | Entra Connect's default rules don't sync gMSAs | Tags | supported by the source for the default rules' object types; a Microsoft Q&A answer (not documentation) says Connect doesn't sync gMSAs | Learn, Connect Sync default configuration |
| MR-06 | Entra's naming policy covers Microsoft 365 groups only | Names | supported (Book 04, Chapter 09's verified rows A13 to A17) | Book 04, Chapter 09 |
| MR-07 | Create a naming convention for service accounts to search, sort and filter them | Names | supported by the source | Learn, "Governing Microsoft Entra service accounts" |
| MR-08 | CAF: `id-<app>-<environment>-<region>-<###>`; `id` for a user-assigned managed identity; constant information in names, tags for the rest; no abbreviation for app registrations | Names | supported by the source | Learn, CAF "Define your naming convention" and "Abbreviation recommendations" |
| MR-09 | The checker runs Chapter 12's NPI-STD-03 to -09 and MSA-REQ-01 to -06; the five examples pass; each check fires | Fill in and check | confirmed by running the pack (`tests/MsaRequestPack.Tests.ps1`, 10 passed) | examples/msa-request-pack |
| MR-10 | NPI-STD-30 flags AD tags that disagree with the register, only on a tagged account | Tags | confirmed by running the kit (`tests/NpiGmsaStandard.Tests.ps1`) | examples/non-person-identity |
| MR-11 | Custom security attributes' availability in Microsoft 365 GCC tenants | What couldn't be verified | open: Learn's US Government feature page has no row | — |
| MR-12 | AD cloud extension attributes on a gMSA | What couldn't be verified | open: Learn's class pages don't list them | — |
