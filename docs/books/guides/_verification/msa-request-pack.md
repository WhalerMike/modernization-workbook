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
| MR-11 | Custom security attributes' availability in Microsoft 365 GCC tenants | What couldn't be verified | open: Learn's US Government feature page has no row. Treated as unavailable until a tenant check confirms them (WD-176, MR-13) | — |
| MR-12 | AD cloud extension attributes on a gMSA | What couldn't be verified | open: Learn's class pages don't list them | — |

## Revision 2026-11-25 — custom security attributes in GCC (WD-176)

Mike, November 25, 2026: "Lets say no until we can confirm yes." Sources read November 25, 2026.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| MR-13 | Where the tags live in Entra: the service principal's `tags` and `notes` until the tenant check, custom security attributes after; a system-assigned managed identity's tags on its resource | Tags | changed *(design guidance)* | WD-176 |
| MR-14 | `tags` filterable, `notes` at most 1,024 characters; Update servicePrincipal in the global service, which GCC tenants use | Tags | supported by the source | `mrp-sp-props` |
| MR-15 | The checker writes `entra-tags.json` (seven `npi:` tags, the notes string, the Azure resource tags) as well as the custom security attribute body, and refuses notes over 1,024 characters (MSA-REQ-06) | Tags | confirmed by running it (`tests/MsaRequestPack.Tests.ps1`, 10 passed) | — |

## Change requests and the name suggester (November 28, 2026)

Mike asked for a change request type and a name suggester for the managed service account standard and answered "Proceed with all recommendations".

**What the search of current content found (origin/main, November 28, 2026).** No change request existed: the pack had forms for an owner change (03) and a retirement (04) only, and the guide's standard had no step for a host, SPN, tier or end date change to an existing account. No name suggester existed; the rules were in WD-159, WD-173 and WD-175, `pack_schema.py` and Chapter 12's NPI-STD-03, which the suggester and the checker now share. One reading to settle, not a contradiction in a fact: WD-163 says the pipeline writes the accounts' retriever groups, while Chapter 06's `calls-ch06.json` and the service accounts guide say the pipeline never writes group membership and list no such right. The new writes follow the kit (a person sends them), and WD-184, a draft, asks Mike to decide. The pack guide already said "the pipeline rewrites the account's tags" for an owner change, which no call or right supported; it now says a person does while WD-184 is a draft.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| MR-16 | `setspn -S` adds an SPN after verifying that no duplicates exist; `-D` deletes the specified SPN; the right can be delegated as *Validated write to service principal name* | Changes | supported by the source | `mrp-setspn`, read November 28, 2026 |
| MR-17 | The validated write permits an SPN compliant with the account's DNS host name, and applies to the Computer and ms-DS-Managed-Service-Account classes | Changes | supported by the source; that a service SPN such as `HTTP/payroll.corp.contoso.example` on `gmsa-payroll$` falls outside it is the program's reading | `mrp-validated-spn` |
| MR-18 | SailPoint's HTTP Request workflow action calls an external system with DELETE, GET, PATCH, POST or PUT, by basic, custom, OAuth 2.0 client credentials or no authentication, and needs a JSON response | SailPoint calling the same rules | supported by the source | `mrp-sp-actions` |
| MR-19 | The checker passes the twelve examples, refuses each MSA-REQ-07 and -08 case and reports the expected name on an NPI-STD-03 finding | Fill in and check | confirmed by running it (`tests/MsaRequestPack.Tests.ps1`, 15 passed, PowerShell 7) | — |
| MR-20 | The suggester prints the same text in Windows PowerShell 5.1 and PowerShell 7, and its outputs on this page are its real output | Suggest the names | confirmed by running it in both (`tests/MsaNameSuggestion.Tests.ps1`, 10 passed in each) | — |
| MR-21 | Chapter 06 plans each change type and a person's run sends it and re-reads it | Changes | confirmed by running it (`tests-msa-change/NpiMsaChange.Tests.ps1`, 22 passed) | — |
