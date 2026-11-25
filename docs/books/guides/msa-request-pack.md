---
title: "Requesting a Managed Service Account"
subtitle: "The forms, the CSV template and the checker an owner uses to ask for a gMSA or dMSA, and the tags every account carries for its move to Microsoft Entra"
description: "A guide to the managed service account request pack: six Word forms (new account, migration, owner change, retirement, the SailPoint approver checklist and the ServiceNow change template), a CSV template with five fictional worked examples, and Test-MsaRequest.ps1, which runs Chapter 12's request check before submission and writes each account's AD description tags and the Entra custom security attributes it will carry. Download it at work; nothing comes back."
doc-type: workbook-guide
audience: [Technical, Customer]
family: guides
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
research-status: draft
research-type: implementation guide
research-book: "Books 02, 04, 13"
review-status: approved
reviewed-sha256: 9a1cb64b021bfaa762a82527f7344aa0e88c884542a04984399a87402d78d3fd
last-reviewed: 2026-11-25
---
# Requesting a Managed Service Account {.unnumbered}

*An owner shouldn't have to know the naming rule, the role list or the tag keys to ask for an account: the form builds the name, the checker finds what's missing, and the approver decides only what a person has to.*

::: {.callout-note}
## In this guide
What the request pack holds and the one-way split between this public workbook and your agency. Which form to use when, and how a request moves through SailPoint and ServiceNow. How to fill in and check the CSV. The tags every account carries, in AD now and in Entra later, and how its name lines up with Entra's. Then how to use Copilot, and what couldn't be verified.
:::

::: {.callout-important}
## Program design, with fictional examples
The rules are the [managed service account standard](service-account-migration.md#msa-standard) in the service accounts guide, decided as [WD-159 to WD-175](../../about/decision-register.md#wd-159). They are the program's design, not federal requirements. Every example in the pack is invented and set at contoso.example.
:::

## Download

**[msa-request-pack.zip](../../../downloads/msa-request-pack.zip)**: six Word forms in `forms/`, `request_template.csv`, five worked examples in `examples.csv`, the checker `Test-MsaRequest.ps1` with its `standard.json`, the Copilot prompt sheet `copilot-prompts.md`, and the tests. It also carries the Non-Person Identity kit's Chapter 12 module, because the checker runs that chapter's request check. The same files are in the repository's [`examples/msa-request-pack`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/msa-request-pack) folder.

## Two sides, one direction

| This public workbook | Your agency |
|---|---|
| The forms, the template, the checker and fictional examples | Your filled requests, your systems, servers and people |
| Updated through reviewed pull requests | Kept where your access management tool and ServiceNow keep requests |
| Nothing from your agency | Nothing goes back: no issues, pull requests or pasted rows |

## Which form, and where it goes

| You want to | Form | Then |
|---|---|---|
| A new account for a new workload | `01-new-account-request.docx`, and a row in the CSV with `RequestKind` `New` | The request goes to SailPoint, through the agency's system access management tool; its form and pre-approval workflow apply the same checks as the checker ([how it's enforced](service-account-migration.md#msa-standard-enforcement)) |
| Replace an existing service account with a gMSA or dMSA | `02-migration-request.docx`, and a CSV row with `RequestKind` `Migrate` and `Supersedes` | The same; the [decision path](service-account-migration.md#decision-path) decides gMSA or dMSA |
| Change an owner or the sponsor | `03-owner-change-request.docx` | SailPoint approves; the pipeline rewrites the account's tags; Chapter 12 flags any tag that still disagrees |
| Retire an account | `04-retirement-request.docx` | The standard's [S10](service-account-migration.md#msa-standard-steps): disabled, then deleted after 90 days, never an account a dMSA superseded |
| Approve a request | `05-approver-checklist.docx` | Purpose, risk, hosts, people and any end date: nothing a rule can check |
| Record the change | `06-servicenow-change-template.docx` | The fields ServiceNow's change model requires before Implement. Requiring them makes the record complete; ServiceNow never approves ([WD-162](../../about/decision-register.md#wd-162)) |

: The forms {.striped .hover}

## Fill in and check a request

1. Copy `request_template.csv` and add one row per new or migration request. The column list and the rules are in `copilot-prompts.md`; the five rows in `examples.csv` show a new IIS application pool, a payroll service with an SPN, a SQL Server engine and Agent pair with role suffixes, and a dMSA migration.
2. Copy `standard.json` and put your domain and OUs in it.
3. From the `msa-request-pack` folder, in PowerShell 7.1 or later, run the checker on your copy:

    ```powershell
    ./Test-MsaRequest.ps1 -Path my-requests.csv -OutputPath out/check -StandardPath my-standard.json
    ```

    On the examples it prints:

    ```text
    RequestId     Account        Ready Rules
    ---------     -------        ----- -----
    REQ-2026-0401 gmsa-visitor$   True
    REQ-2026-0402 gmsa-payroll$   True
    REQ-2026-0403 gmsa-hrdb-sql$  True
    REQ-2026-0404 gmsa-hrdb-agt$  True
    REQ-2026-0405 dmsa-billing$   True
    ```

4. Fix every row that isn't `Ready`, then fill in the form and submit the request.

The checker runs [Chapter 12](../../project-plans/developer-workbooks/non-person-identity/12-the-managed-service-account-standard.md)'s request check, NPI-STD-03 to -09, the same check SailPoint's pre-approval workflow runs. The approval and the change record (NPI-STD-01 and -02) don't exist before submission, so it skips them. Its own checks are MSA-REQ-01 to -06: `Migrate` without `Supersedes`, a role that doesn't fit the workload, the same person as both owners, `KeepKerberos` with no end date, a new dMSA, and a tag that can't be written. It writes nothing to any system.

## Tags: one set, from AD to Entra {#tags}

Every account carries the same seven tags, from the day it's created to the day it moves to Entra ([WD-175](../../about/decision-register.md#wd-175)):

| Tag | Value | From |
|---|---|---|
| `SystemId` | The system's ID in the system inventory | The request |
| `Owner1`, `Owner2` | The two technical owners, by user principal name | SailPoint, the source for owners ([WD-164](../../about/decision-register.md#wd-164)) |
| `Sponsor` | The federal sponsor | SailPoint |
| `Environment` | `prod`, `test` or `dev` | The request |
| `Tier` | `R1`, `R2` or `R3`, the risk tier that sets the certification cadence ([WD-166](../../about/decision-register.md#wd-166)) | The request |
| `EntraTarget` | Where the workload goes when it moves: `ManagedIdentity`, `AppRegistrationFederated`, `AppRegistrationCertificate`, `GmsaPlusAppRegistration`, `KeepKerberos`, `Retire` or `Undecided` | [Chapter 03](../../project-plans/developer-workbooks/non-person-identity/03-the-migration-path-matrix-as-code.md)'s targets |

: The tags (WD-175) {.striped .hover}

| Where | How the tags are held | Written by |
|---|---|---|
| The AD account | `key=value` pairs in its description, with the request and change numbers: `SystemId=SYS-0233; Owner1=…; Owner2=…; Sponsor=…; Environment=prod; Tier=R1; EntraTarget=KeepKerberos; Request=REQ-2026-0403; Change=CHG…` | The pipeline, from the approved request: Chapter 06's plan passes them as `-Description` when it creates the account, and won't create one without them |
| The Entra identity it moves to, until a tenant check confirms custom security attributes in GCC ([WD-176](../../about/decision-register.md#wd-176)) | A service principal's `tags`, one `npi:<Key>=<Value>` string per key, which Microsoft Graph can filter, and its `notes`, the whole tag string with the request and change (at most 1,024 characters).[^mrp-sp-props] A managed identity's service principal can't be modified directly, so a managed identity carries them as Azure resource tags (next two rows) | Migration C's step that creates the identity ([service accounts guide](service-account-migration.md#migration-c)); the checker writes them as `entra-tags.json` |
| The Entra identity it moves to, once the tenant check confirms them | Custom security attributes in the `NonPersonIdentity` attribute set, on the service principal or managed identity. They're free in every edition of Entra ID, can be assigned to service principals, and Attribute Assignment Administrator can set them on managed identities; a value is at most 64 characters[^mrp-csa] [^mrp-csa-role] | The same step, copying the values from the fallback; the checker writes the body as `entra-custom-security-attributes.json` |
| A user-assigned managed identity's Azure resource | Azure resource tags with the same keys, which aren't inherited from the resource group[^mrp-azure-tags] | The same step |
| A system-assigned managed identity | Azure resource tags on the resource it belongs to: the identity type takes no tags of its own[^mrp-az-support] | The same step |
| AWS GovCloud (US) and OCI identities | The tags WD-172 set, with `Environment`, `Tier` and `EntraTarget` added | Their owners, checked by VK-NPI-10 *(the two new keys are not yet in the check)* |

: Where the tags live {.striped .hover}

Entra Connect's default rules don't sync gMSAs,[^mrp-sync] so the AD tags don't flow to Entra by themselves: the step that creates the Entra identity copies them, which is why they're kept in the same keys. The AD description is readable by any authenticated user in the domain, so it holds only names already in the directory. The checker writes each request's Entra tags in both forms. `entra-tags.json` is the fallback, the service principal's `tags` and `notes` as `Update-MgServicePrincipal -Tags -Notes` takes them, and the Azure resource tags:

```json
{
  "servicePrincipal": {
    "tags": ["npi:SystemId=SYS-0233", "npi:Owner1=hrdb.dba@contoso.example", "npi:Owner2=hrdb.backup@contoso.example", "npi:Sponsor=hr.sponsor@contoso.example", "npi:Environment=prod", "npi:Tier=R1", "npi:EntraTarget=KeepKerberos"],
    "notes": "SystemId=SYS-0233; Owner1=hrdb.dba@contoso.example; Owner2=hrdb.backup@contoso.example; Sponsor=hr.sponsor@contoso.example; Environment=prod; Tier=R1; EntraTarget=KeepKerberos; Request=REQ-2026-0403; Change=PENDING"
  },
  "azureResourceTags": { "SystemId": "SYS-0233", "Owner1": "hrdb.dba@contoso.example", "Owner2": "hrdb.backup@contoso.example", "Sponsor": "hr.sponsor@contoso.example", "Environment": "prod", "Tier": "R1", "EntraTarget": "KeepKerberos" }
}
```

`entra-custom-security-attributes.json` is the target, in Microsoft Graph's shape for a custom security attribute,[^mrp-graph] which `Update-MgServicePrincipal -CustomSecurityAttributes` takes as a hashtable:

```json
{
  "customSecurityAttributes": {
    "NonPersonIdentity": {
      "@odata.type": "#Microsoft.DirectoryServices.CustomSecurityAttributeValue",
      "SystemId": "SYS-0233",
      "Owner1": "hrdb.dba@contoso.example",
      "Owner2": "hrdb.backup@contoso.example",
      "Sponsor": "hr.sponsor@contoso.example",
      "Environment": "prod",
      "Tier": "R1",
      "EntraTarget": "KeepKerberos"
    }
  }
}
```

The [Non-Person Identity guide's Step 1f](non-person-identity-implementation.md#step-1f-owner) puts the same tags on every service principal and managed identity, not only the ones that move from AD, in the same two forms.

## Names that line up with Entra {#names}

Entra has no naming policy for app registrations, service principals or managed identities: its naming policy covers Microsoft 365 groups ([Book 04, Chapter 09](../b04-access/09-access-governance.md#microsoft-365-group-naming-policy)). Learn's governance page for Entra service accounts says to create a naming convention so they can be searched, sorted and filtered.[^mrp-govern] Azure's Cloud Adoption Framework names a user-assigned managed identity `id-<app>-<environment>-<region>-<###>`, and says to put only what stays constant in a name and the rest in tags.[^mrp-caf]

So the program keeps one short name for a system everywhere *(design guidance, [WD-175](../../about/decision-register.md#wd-175))*:

| The system `payroll` | Name |
|---|---|
| Its gMSA today | `gmsa-payroll` ([WD-159](../../about/decision-register.md#wd-159), [WD-173](../../about/decision-register.md#wd-173)) |
| The managed identity it moves to | `id-payroll-prod-<region>-001`, the Cloud Adoption Framework's form |
| Its app registration, if the target is one | The same short name; the workbook sets no prefix for app registrations, and the Cloud Adoption Framework gives none |

: One short name (design guidance) {.striped .hover}

The AD name doesn't carry the environment or the region: 15 characters leave no room, and the forest already says which environment an account is in. The tags carry them.

## Using Copilot at work

`copilot-prompts.md` has four prompts: draft a row from what you know, find the SPNs a workload needs, check a row against the rules, and explain a finding. Use Microsoft 365 Copilot Chat signed in with your work account, follow your agency's AI-use policy on what you may paste, and run the checker on every row Copilot drafts: a suggestion isn't an approval, and it isn't evidence.

## What couldn't be verified {#what-couldnt-be-verified}

- Whether custom security attributes are available in Microsoft 365 GCC tenants: Learn's Graph pages list their APIs for the worldwide service, which GCC tenants use, but the feature-availability page for US Government has no row for them and no page confirms them for GCC. The program treats them as unavailable until a tenant check confirms them ([WD-176](../../about/decision-register.md#wd-176)).
- Whether a managed identity's service principal takes `tags` or `notes`: Learn says it can't be modified directly ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#two-objects-for-one-application)), so the program uses Azure resource tags, and custom security attributes once confirmed.
- Whether AD's cloud extension attributes can be set on a gMSA: Learn's class pages don't list them, so the program uses the description.

## Questions for the program owner

1. Who in the agency holds Attribute Definition Administrator for the `NonPersonIdentity` set, and who holds Attribute Assignment Administrator for the pipeline?

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

This guide has not been published in an edition yet. Each edition is kept, with its Word editions, decks and videos, on the [Archive](../../about/archive.md) page. Every change so far is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/guides/msa-request-pack.md).

<!-- revisions:end -->

[^mrp-csa]: Microsoft Learn, "What are custom security attributes in Microsoft Entra ID?" (users and service principals; free in all editions; limits: 64-character values, 50 values per object, 100 predefined values), <https://learn.microsoft.com/entra/fundamentals/custom-security-attributes-overview> (accessed Nov 25, 2026).
[^mrp-csa-role]: Microsoft Learn, "Microsoft Entra built-in roles," Attribute Assignment Administrator (`microsoft.directory/azureManagedIdentities/customSecurityAttributes/update`), <https://learn.microsoft.com/entra/identity/role-based-access-control/permissions-reference> (accessed Nov 25, 2026).
[^mrp-azure-tags]: Microsoft Learn, "Use tags to organize your Azure resources and management hierarchy" (50 tag pairs per resource; tags aren't inherited from a resource group or subscription), <https://learn.microsoft.com/azure/azure-resource-manager/management/tag-resources> (accessed Nov 25, 2026).
[^mrp-sync]: Microsoft Learn, "Understanding the default configuration" of Microsoft Entra Connect Sync (the object types the default rules synchronize), <https://learn.microsoft.com/entra/identity/hybrid/connect/concept-azure-ad-connect-sync-default-configuration> (accessed Nov 25, 2026).
[^mrp-graph]: Microsoft Learn, "Assign, update, list, or remove custom security attributes using the Microsoft Graph API" (the `customSecurityAttributes` body with `#Microsoft.DirectoryServices.CustomSecurityAttributeValue`), <https://learn.microsoft.com/graph/custom-security-attributes-examples>, and "Manage custom security attributes for an application" (`Update-MgServicePrincipal -CustomSecurityAttributes`), <https://learn.microsoft.com/entra/identity/enterprise-apps/custom-security-attributes-apps> (accessed Nov 25, 2026).
[^mrp-sp-props]: Microsoft Learn, "servicePrincipal resource type" (Microsoft Graph v1.0: `tags`, custom strings to categorize and identify the service principal, filterable; `notes`, free text for operational purposes, at most 1,024 characters) and "Update servicePrincipal" (available in the global service, which Microsoft 365 GCC tenants use), <https://learn.microsoft.com/graph/api/resources/serviceprincipal>; "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments>, both accessed November 25, 2026.
[^mrp-az-support]: Microsoft Learn, "Tag support for Azure resources," Microsoft.ManagedIdentity (`userAssignedIdentities` supports tags; `Identities` doesn't), <https://learn.microsoft.com/azure/azure-resource-manager/management/tag-support>, accessed November 25, 2026.
[^mrp-govern]: Microsoft Learn, "Governing Microsoft Entra service accounts" (create a naming convention for service accounts to search, sort and filter them), <https://learn.microsoft.com/entra/architecture/govern-service-accounts> (accessed Nov 25, 2026).
[^mrp-caf]: Microsoft Learn, Cloud Adoption Framework, "Define your naming convention" (resource type, workload, environment, region, instance; only constant information in the name, tags for the rest) and "Abbreviation recommendations for Azure resources" (`id` for a user-assigned managed identity), <https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/resource-naming>, <https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/resource-abbreviations> (accessed Nov 25, 2026).
