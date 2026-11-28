---
title: "Requesting a Managed Service Account"
subtitle: "The forms, the CSV template and the checker an owner uses to ask for a gMSA or dMSA, and the tags every account carries for its move to Microsoft Entra"
description: "A guide to the managed service account request pack: seven Word forms (new account, migration, owner change, retirement, the SailPoint approver checklist, the ServiceNow change template and a change to an existing account), a CSV template with twelve fictional worked examples, Test-MsaRequest.ps1, which runs Chapter 12's request check before submission and writes each account's AD description tags and the Entra tags it will carry, and Get-MsaNameSuggestion.ps1, which builds every name the standard sets from a system's fields. Download it at work; nothing comes back."
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
reviewed-sha256: 8250f867279c5d07fa7a33d9d07c1dbb67726257a32561c3455a38d3e03281bb
last-reviewed: 2026-11-25
---
# Requesting a Managed Service Account {.unnumbered}

*An owner shouldn't have to know the naming rule, the role list or the tag keys to ask for an account: the form builds the name, the checker finds what's missing, and the approver decides only what a person has to.*

::: {.callout-note}
## In this guide
What the request pack holds and the one-way split between this public workbook and your agency. Which form to use when, how a request moves through SailPoint and ServiceNow, and who runs each kind of change. How to fill in and check the CSV. The tags every account carries, in AD now and in Entra later, and how its name lines up with Entra's. How the name suggester builds the names, and how SailPoint's form and workflow can call the same rules. Then how to use Copilot, and what couldn't be verified.
:::

::: {.callout-important}
## Program design, with fictional examples
The rules are the [managed service account standard](service-account-migration.md#msa-standard) in the service accounts guide, decided as [WD-159 to WD-175](../../about/decision-register.md#wd-159). They are the program's design, not federal requirements. Every example in the pack is invented and set at contoso.example.
:::

## Download

**[msa-request-pack.zip](../../../downloads/msa-request-pack.zip)**: seven Word forms in `forms/`, `request_template.csv`, twelve worked examples in `examples.csv`, the checker `Test-MsaRequest.ps1` with its `standard.json`, the name suggester `Get-MsaNameSuggestion.ps1`, the Copilot prompt sheet `copilot-prompts.md`, and the tests. It also carries the Non-Person Identity kit's Chapter 12 module, because the checker runs that chapter's request check, and the [production proposal](#production-proposal) in `proposal/`. The same files are in the repository's [`examples/msa-request-pack`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/msa-request-pack) folder.

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
| Change an existing account: a host, an SPN, the risk tier or the end date | `07-change-request.docx`, and a CSV row with `RequestKind` `Change`, its `ChangeType` and its `ChangeItems` | SailPoint approves; Chapter 06 plans the change, and a reviewer approves the plan by its hash ([who runs each change](#changes)) |
| Change an owner or the sponsor | `03-owner-change-request.docx` | SailPoint approves; the account's tags are rewritten (by a person while [WD-185](../../about/decision-register.md#wd-185), a draft, is undecided); Chapter 12 flags any tag that still disagrees |
| Retire an account | `04-retirement-request.docx` | The standard's [S10](service-account-migration.md#msa-standard-steps): disabled, then deleted after 90 days, never an account a dMSA superseded |
| Approve a request | `05-approver-checklist.docx` | Purpose, risk, hosts, people and any end date: nothing a rule can check |
| Record the change | `06-servicenow-change-template.docx` | The fields ServiceNow's change model requires before Implement. Requiring them makes the record complete; ServiceNow never approves ([WD-162](../../about/decision-register.md#wd-162)) |

: The forms {.striped .hover}

### Changes, and who runs each {#changes}

A change request changes one thing on an account that already exists. Its CSV row is the account as it will be after the change: `Hosts` and `Spns` are the full lists after it, and `ChangeItems` names what's added or removed. Chapter 12 checks it, and [Chapter 06](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md#a-change-to-an-existing-account)'s `New-NpiKrbChangePlan` reads the account in AD, refuses a request that doesn't match it, and plans the change under the same rule as every other write: a reviewer approves the plan's SHA-256, and the write carries the SailPoint request and the ServiceNow change *(design guidance)*.

| `ChangeType` | `ChangeItems` | Chapter 06 plans | Who sends the write | Then |
|---|---|---|---|---|
| `AddHost` | The hosts added | A gMSA: `Set-ADGroup -Replace @{ member = ... }` on its one `DL-gMSA-<app>-Hosts` group, with every host after the change ([WD-160](../../about/decision-register.md#wd-160)). A dMSA: `Set-ADServiceAccount -PrincipalsAllowedToRetrieveManagedPassword`, because a dMSA's retrievers are its hosts ([WD-173](../../about/decision-register.md#wd-173)) | A person; WD-185 proposes the pipeline for a gMSA. A dMSA's is always a person's ([WD-163](../../about/decision-register.md#wd-163)) | On each added host, a person restarts it, then runs `Install-ADServiceAccount` and `Test-ADServiceAccount`[^mrp-gmsa] |
| `RemoveHost` | The hosts removed | The same write, without them. A change never removes the last host: that's a retirement (form 04) | The same | A person runs `Uninstall-ADServiceAccount` on each removed host (WD-163) |
| `AddSpn` | The SPNs added | `setspn -S <spn> <account>`, which adds the SPN after checking that no duplicate exists[^mrp-setspn] | A person; WD-185 proposes the pipeline | Nothing more |
| `RemoveSpn` | The SPNs removed | `setspn -D <spn> <account>`[^mrp-setspn] | The same | An account left with no SPN should be outbound-only (NPI-STD-15) |
| `Tier` | Blank: the new tier is `RiskTier` | The seven tags rewritten as the description, naming this request and change: `Set-ADServiceAccount -Description` | A person; WD-185 proposes the pipeline | The certification cadence follows the new tier ([WD-166](../../about/decision-register.md#wd-166)) |
| `EndDate` | Blank: the new date is `EndDate` | The same rewrite, for an account whose `EntraTarget` is `KeepKerberos`; the date may be no later than program G5, or the island's end of life ([WD-165](../../about/decision-register.md#wd-165)) | The same | Chapter 03's decisions record the date in a reviewed pull request |

: Change requests (design guidance) {.striped .hover}

The pipeline's gMSA, `gmsa-msapipe`, doesn't hold the rights these writes need: write of a retriever group's members, of an account's `servicePrincipalName` and of its description. Learn's *Validated write to service principal name* covers only SPNs that match the account's DNS host name,[^mrp-validated-spn] which a service's SPN doesn't. [WD-185](../../about/decision-register.md#wd-185) proposes the three rights and their scope; it's a draft, so until the program owner decides it, a person signed in with each right sends these writes from the approved plan (`-RunAs Person`). Nothing about the request changes when it's decided: only who sends the write.

## Fill in and check a request

1. Copy `request_template.csv` and add one row per request. The column list and the rules are in `copilot-prompts.md`; the twelve rows in `examples.csv` show a new IIS application pool, a payroll service with an SPN, a SQL Server engine and Agent pair with role suffixes, a dMSA migration, and one change of each type to those accounts.
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
    REQ-2026-0406 gmsa-payroll$   True
    REQ-2026-0407 gmsa-payroll$   True
    REQ-2026-0408 gmsa-payroll$   True
    REQ-2026-0409 gmsa-payroll$   True
    REQ-2026-0410 gmsa-payroll$   True
    REQ-2026-0411 gmsa-hrdb-sql$  True
    REQ-2026-0412 dmsa-billing$   True
    ```

4. Fix every row that isn't `Ready`, then fill in the form and submit the request.

The checker runs [Chapter 12](../../project-plans/developer-workbooks/non-person-identity/12-the-managed-service-account-standard.md)'s request check, NPI-STD-03 to -09, the same check SailPoint's pre-approval workflow runs. The approval and the change record (NPI-STD-01 and -02) don't exist before submission, so it skips them. Its own checks are MSA-REQ-01 to -08: `Migrate` without `Supersedes`, a role that doesn't fit the workload, the same person as both owners, `KeepKerberos` with no end date, a new dMSA, a tag that can't be written, a `Change` row with no known `ChangeType` (or a change type on another row), and change items that don't fit the row (an added host missing from `Hosts`, a removed SPN still in `Spns`, an SPN not in Learn's form, items on a tier change, an end date on an account that isn't kept on Kerberos). When a name breaks the standard (NPI-STD-03), the finding ends with the name the [suggester](#names-suggester) builds from the same fields, for example `expected name gmsa-payroll$`. It writes nothing to any system.

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

## Suggest the names {#names-suggester}

`Get-MsaNameSuggestion.ps1` builds every name the standard sets for an account from a system's fields, so an owner doesn't have to know the rules to get them right: the account ([WD-159](../../about/decision-register.md#wd-159), [WD-173](../../about/decision-register.md#wd-173)), its DNS host name, its retriever group ([WD-160](../../about/decision-register.md#wd-160)), the SPNs for its hosts and service classes, the Entra managed identity it will move to and its seven tags ([WD-175](../../about/decision-register.md#wd-175)). It runs in Windows PowerShell 5.1 and PowerShell 7 and prints the same text in both. It reads nothing but its parameters and `standard.json`, unless you add `-CheckForest`.

From the `msa-request-pack` folder:

```powershell
./Get-MsaNameSuggestion.ps1 -SystemId SYS-0233 -AppShortName hrdb -Role sql -AccountType gMSA -Environment prod -Hosts HRSQL01 -ServiceClass MSSQLSvc -Port 1433 -Region eastus -Owner1 hrdb.dba@contoso.example -Owner2 hrdb.backup@contoso.example -Sponsor hr.sponsor@contoso.example -Tier R1 -EntraTarget KeepKerberos
```

It prints:

```text
AccountName      gmsa-hrdb-sql$
AccountType      gMSA
DnsHostName      gmsa-hrdb-sql.corp.contoso.example
RetrieverGroup   DL-gMSA-hrdb-Hosts
Hosts            HRSQL01
Spns             MSSQLSvc/hrsql01.corp.contoso.example:1433
ManagedIdentity  id-hrdb-prod-eastus-001
Tags             SystemId=SYS-0233; Owner1=hrdb.dba@contoso.example; Owner2=hrdb.backup@contoso.example; Sponsor=hr.sponsor@contoso.example; Environment=prod; Tier=R1; EntraTarget=KeepKerberos
Ready            True
```

A value that breaks a rule is fixed where a rule fixes it, and said so: a capital is lowercased, and a hyphen or another character the short name can't hold is dropped. A name over 15 characters is shortened at `<app>`, never at the prefix or the role, and reported as a finding, because the short name on the system's record has to change first, so the account, its group and its Entra identity share it:

```powershell
./Get-MsaNameSuggestion.ps1 -SystemId SYS-0601 -AppShortName payrollreports -Role rs -Environment prod -Hosts RPT01
```

```text
AccountName      gmsa-payroll-rs$
AccountType      gMSA
DnsHostName      gmsa-payroll-rs.corp.contoso.example
RetrieverGroup   DL-gMSA-payroll-Hosts
Hosts            RPT01
Spns             (none)
ManagedIdentity  id-payroll-prod-<region>-001
Tags             SystemId=SYS-0601; Owner1=<owner1-upn>; Owner2=<owner2-upn>; Sponsor=<sponsor-upn>; Environment=prod; Tier=<R1|R2|R3>; EntraTarget=Undecided
Ready            False
  NAME-LENGTH     Finding gmsa-payrollreports-rs is 22 characters; the standard allows 15 before the $, shortened at <app>, so the short name can have 7 characters here. 'payroll' is only the first 7: choose the short name on the system's record, check it isn't another system's (-CheckForest), and ask again (WD-173, WD-175)
```

The cut-off name here is another system's short name, which is why the suggester doesn't choose it for you. `-CheckForest` looks up, read only, whether the account name, its retriever group and each SPN already exist, with `Get-ADObject` from the ActiveDirectory module; give `-Server` a global catalog (`<dc>:3268`) to search the whole forest, because Learn requires a gMSA's name to be unique in the forest.[^mrp-gmsa] It reports a clash as a finding and never renames: the standard has no numbering rule, and [WD-185](../../about/decision-register.md#wd-185), a draft, proposes one for that case. The pack's fixture shows what it reports:

```powershell
./Get-MsaNameSuggestion.ps1 -SystemId SYS-0412 -AppShortName payroll -Environment prod -Hosts PAY01 -ServiceClass HTTP -SpnHost reports -CheckForest -ForestFixturePath tests/fixtures/forest.json
```

```text
AccountName      gmsa-payroll$
AccountType      gMSA
DnsHostName      gmsa-payroll.corp.contoso.example
RetrieverGroup   DL-gMSA-payroll-Hosts
Hosts            PAY01
Spns             HTTP/reports.corp.contoso.example
ManagedIdentity  id-payroll-prod-<region>-001
Tags             SystemId=SYS-0412; Owner1=<owner1-upn>; Owner2=<owner2-upn>; Sponsor=<sponsor-upn>; Environment=prod; Tier=<R1|R2|R3>; EntraTarget=Undecided
Ready            False
Forest           2 clash(es)
  FOREST-NAME     Finding gmsa-payroll$ already exists (msDS-GroupManagedServiceAccount CN=gmsa-payroll,OU=Service Accounts,DC=corp,DC=contoso,DC=example). The standard has no numbering rule: if it's this system's account, ask for a change, not a new account; if it's another system's, one of the two needs a different short name on its record (WD-173 sets no rule for that case, WD-185 asks for one)
  FOREST-GROUP    Info    DL-gMSA-payroll-Hosts already exists: a second account for the same system uses the same group (WD-159); if the group isn't this system's, its short name is taken
  FOREST-SPN      Finding HTTP/reports.corp.contoso.example is already registered on svc-reports: setspn -S would refuse it. Move it in the switch window (Migration A, step A5) or name a different SPN
```

`-SpnHost` names the host clients connect to when it isn't the server, such as a load-balanced site's name; without it, the SPNs use `-Hosts`. Add `-AsObject` to get the result as an object for a script, which is how the checker calls it. At work, against your forest, from a machine with the ActiveDirectory module:

```powershell
./Get-MsaNameSuggestion.ps1 -SystemId <system-id> -AppShortName <app> -Environment prod -Hosts <host1>,<host2> -ServiceClass HTTP -SpnHost <site-name> -StandardPath my-standard.json -CheckForest -Server <dc>:3268
```

### SailPoint calling the same rules {#sailpoint-rules}

SailPoint can't run the suggester itself, but it can apply the same rules at the two points [WD-174](../../about/decision-register.md#wd-174) sets, so the form, the workflow and the owner's own check agree *(design guidance)*:

1. **The request form.** SailPoint's forms mark fields required, set a maximum length, check a regular expression with its own error message, and show or hide fields by condition.[^mrp-sp-forms] Give the app short name `^[a-z][a-z0-9]*$` and a maximum of 10 characters (15 less `gmsa-`). Make the role, the account type, the environment, the tier, the Entra target and the change type lists to pick from, with the values in `pack_schema.py`, and show the host and SPN item fields only for the change types that use them. The form can't check a short name and a role together against the 15 characters, or a clash in the forest; the workflow does.
2. **The workflow before approval.** An *Access Request Submitted* trigger is request-response: its workflow returns a preliminary approval or denial before an approver sees the request.[^mrp-sp-trigger] The workflow's *HTTP Request* action calls an external system with GET, POST, PATCH, PUT or DELETE, by basic authentication, a custom authorization or OAuth 2.0 client credentials, and expects a JSON response.[^mrp-sp-actions] Point it at an agency-hosted service that runs `Test-MsaRequest.ps1` on the request's fields (which runs the suggester) and the suggester's `-CheckForest` with a read-only account, and returns the findings as JSON; the workflow denies a request with a `Finding` and puts the findings, the expected name among them, in the comment.

The service isn't built yet (WD-174), so it has no interface to document here, and the pages read don't say which field names the trigger passes for a form's values: *not yet specified*. Build the service so it calls the pack's scripts rather than copying their rules, and the rules stay in one place.

## Proposing it for production {#production-proposal}

The pack's `proposal/` folder is a neutral proposal to take the standard into production, for the authorizing official and the change advisory board, with a technical appendix for engineers. It restates nothing new: each part summarizes and links the page that holds it.

| File | What it holds |
|---|---|
| `msa-production-proposal.docx` | The problem; the decided design as one table of decisions ([WD-123 to WD-176](../../about/decision-register.md#wd-159)); the flow from the agency's system access management tool through SailPoint, ServiceNow and the pipeline to certification; the lifecycle; the naming standard and its [five enforcement layers](service-account-migration.md#msa-standard-enforcement); rollout by the guide's [change-safety rings](service-account-migration.md#sam-control-states) with a 30-day parallel run; the controls the evidence supports, from [the standard's steps](service-account-migration.md#msa-standard-steps); the [dangers](service-account-migration.md#dangers) and their guards; the prerequisites; open items; the decisions requested; and one table of placeholders |
| `msa-production-proposal.pptx` | The same story in 12 slides, with speaker notes |
| `day2-test-script.md`, `Invoke-MsaDay2ReadOnly.ps1` | Day 2 at work: read-only production checks (the KDS root key's age, never its value; domain controller versions and functional levels; user accounts used as services and their SPNs; existing managed accounts; who can create in the service-account OU), each saving an evidence file that fills a placeholder; then one gMSA in a test domain, [Module 15](../../training/non-person-identity/15-your-first-gmsa.md)'s steps, installed, tested and backed out |
| `proposal-prompts.md` | Copilot prompts: fill the placeholders from the evidence, review the proposal for gaps, draft the board's summary |

: The production proposal {.striped .hover}

It proposes gMSAs now and dMSAs once the domain controllers reach Windows Server 2025: a dMSA needs at least one Windows Server 2025 domain controller that the hosts can discover, and every host that uses it on Windows Server 2025.[^mrp-dmsa-faq] The workbook assumes a Windows Server 2016 baseline with Windows Server 2019 as the minimum, so the Day 2 read of the domain controllers confirms or corrects that. A test OU inside the production domain is still production: every production write goes through the approved Chapter 06 plan ([WD-168](../../about/decision-register.md#wd-168)), so the script's one write runs only in a test domain. The Change request kind and the name suggester it describes are pending approval.

## Using Copilot at work

`copilot-prompts.md` has six prompts: draft a row from what you know, find the SPNs a workload needs, check a row against the rules, explain a finding, draft a change row, and turn the suggester's output into a request. `proposal/proposal-prompts.md` has four for the [production proposal](#production-proposal). Use Microsoft 365 Copilot Chat signed in with your work account, follow your agency's AI-use policy on what you may paste, and run the checker on every row Copilot drafts: a suggestion isn't an approval, and it isn't evidence.

## What couldn't be verified {#what-couldnt-be-verified}

- Whether custom security attributes are available in Microsoft 365 GCC tenants: Learn's Graph pages list their APIs for the worldwide service, which GCC tenants use, but the feature-availability page for US Government has no row for them and no page confirms them for GCC. The program treats them as unavailable until a tenant check confirms them ([WD-176](../../about/decision-register.md#wd-176)).
- Whether a managed identity's service principal takes `tags` or `notes`: Learn says it can't be modified directly ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#two-objects-for-one-application)), so the program uses Azure resource tags, and custom security attributes once confirmed.
- Whether AD's cloud extension attributes can be set on a gMSA: Learn's class pages don't list them, so the program uses the description.
- Which field names SailPoint's *Access Request Submitted* trigger passes for a form's values, for the *HTTP Request* action to send to the checking service: the trigger's page read doesn't list a form's fields.

## Questions for the program owner

1. Who in the agency holds Attribute Definition Administrator for the `NonPersonIdentity` set, and who holds Attribute Assignment Administrator for the pipeline?
2. [WD-185](../../about/decision-register.md#wd-185), a draft: does the pipeline get the rights to send a change request's writes, and what name does a new account get when the standard's name is taken?

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

This guide has not been published in an edition yet. Each edition is kept, with its Word editions, decks and videos, on the [Archive](../../about/archive.md) page. Every change so far is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/guides/msa-request-pack.md).

<!-- revisions:end -->

[^mrp-gmsa]: Microsoft Learn, "Manage group Managed Service Accounts" (the name is unique in the forest; `Install-ADServiceAccount` and `Test-ADServiceAccount` on each host, and `Uninstall-ADServiceAccount`), <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/manage-group-managed-service-accounts> (accessed Nov 28, 2026).
[^mrp-setspn]: Microsoft Learn, "Setspn" (`-S` adds the specified SPN after verifying that no duplicates exist; `-D` deletes the specified SPN), <https://learn.microsoft.com/windows-server/administration/windows-commands/setspn> (accessed Nov 28, 2026).
[^mrp-validated-spn]: Microsoft Learn, "Validated-SPN validated writes" (validated write to the SPN attribute that is compliant with the computer's DNS host name; applies to the Computer and ms-DS-Managed-Service-Account classes), <https://learn.microsoft.com/windows/win32/adschema/r-validated-spn> (accessed Nov 28, 2026).
[^mrp-sp-forms]: SailPoint, Identity Security Cloud, "Forms" (required fields, lengths, regular expressions with an error message, and conditions), <https://documentation.sailpoint.com/saas/help/forms/index.html> (accessed Nov 25, 2026).
[^mrp-sp-trigger]: SailPoint Developer Community, "Access Request Submitted" event trigger (request-response: a preliminary approval or denial), <https://developer.sailpoint.com/docs/extensibility/event-triggers/triggers/access-request-submitted> (accessed Nov 25, 2026).
[^mrp-sp-actions]: SailPoint, "Workflow Actions," HTTP Request (makes an HTTP request to an external system; DELETE, GET, PATCH, POST or PUT; basic authentication, custom authorization, OAuth 2.0 client credentials or none; a response must be JSON), <https://documentation.sailpoint.com/saas/help/workflows/workflow-actions.html> (accessed Nov 28, 2026).
[^mrp-dmsa-faq]: Microsoft Learn, "Delegated Managed Service Accounts FAQ" (at least one Windows Server 2025 domain controller, discoverable by the client or member server; every client and server on a dMSA-supported operating system), <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/delegated-managed-service-accounts/delegated-managed-service-accounts-faq>, and "Setting up delegated Managed Service Accounts (dMSA) in Windows Server 2025," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/delegated-managed-service-accounts/delegated-managed-service-accounts-set-up-dmsa> (accessed Nov 28, 2026).
[^mrp-csa]: Microsoft Learn, "What are custom security attributes in Microsoft Entra ID?" (users and service principals; free in all editions; limits: 64-character values, 50 values per object, 100 predefined values), <https://learn.microsoft.com/entra/fundamentals/custom-security-attributes-overview> (accessed Nov 25, 2026).
[^mrp-csa-role]: Microsoft Learn, "Microsoft Entra built-in roles," Attribute Assignment Administrator (`microsoft.directory/azureManagedIdentities/customSecurityAttributes/update`), <https://learn.microsoft.com/entra/identity/role-based-access-control/permissions-reference> (accessed Nov 25, 2026).
[^mrp-azure-tags]: Microsoft Learn, "Use tags to organize your Azure resources and management hierarchy" (50 tag pairs per resource; tags aren't inherited from a resource group or subscription), <https://learn.microsoft.com/azure/azure-resource-manager/management/tag-resources> (accessed Nov 25, 2026).
[^mrp-sync]: Microsoft Learn, "Understanding the default configuration" of Microsoft Entra Connect Sync (the object types the default rules synchronize), <https://learn.microsoft.com/entra/identity/hybrid/connect/concept-azure-ad-connect-sync-default-configuration> (accessed Nov 25, 2026).
[^mrp-graph]: Microsoft Learn, "Assign, update, list, or remove custom security attributes using the Microsoft Graph API" (the `customSecurityAttributes` body with `#Microsoft.DirectoryServices.CustomSecurityAttributeValue`), <https://learn.microsoft.com/graph/custom-security-attributes-examples>, and "Manage custom security attributes for an application" (`Update-MgServicePrincipal -CustomSecurityAttributes`), <https://learn.microsoft.com/entra/identity/enterprise-apps/custom-security-attributes-apps> (accessed Nov 25, 2026).
[^mrp-sp-props]: Microsoft Learn, "servicePrincipal resource type" (Microsoft Graph v1.0: `tags`, custom strings to categorize and identify the service principal, filterable; `notes`, free text for operational purposes, at most 1,024 characters) and "Update servicePrincipal" (available in the global service, which Microsoft 365 GCC tenants use), <https://learn.microsoft.com/graph/api/resources/serviceprincipal>; "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments>, both accessed November 25, 2026.
[^mrp-az-support]: Microsoft Learn, "Tag support for Azure resources," Microsoft.ManagedIdentity (`userAssignedIdentities` supports tags; `Identities` doesn't), <https://learn.microsoft.com/azure/azure-resource-manager/management/tag-support>, accessed November 25, 2026.
[^mrp-govern]: Microsoft Learn, "Governing Microsoft Entra service accounts" (create a naming convention for service accounts to search, sort and filter them), <https://learn.microsoft.com/entra/architecture/govern-service-accounts> (accessed Nov 25, 2026).
[^mrp-caf]: Microsoft Learn, Cloud Adoption Framework, "Define your naming convention" (resource type, workload, environment, region, instance; only constant information in the name, tags for the rest) and "Abbreviation recommendations for Azure resources" (`id` for a user-assigned managed identity), <https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/resource-naming>, <https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/resource-abbreviations> (accessed Nov 25, 2026).
