---
title: "Non-Person Identity: An Implementation Guide"
description: "A step-by-step guide to governing service accounts and workload identities in the non-person identity track: inventory AD service accounts, MSAs and gMSAs, app registrations and service principals, managed identities, federated credentials and AI agent identities, each joined to an owner and sponsor in the system inventory or CMDB; decide each one's target (retire, gMSA, managed identity, certificate or federated credential); enforce credential rules with application management policies and a vault; cut privilege across Graph permissions, directory roles, Azure RBAC and Conditional Access for workload identities; run the lifecycle from owner change to disable-then-delete; and produce the evidence for AC-2, AC-6(5), IA-4, IA-5, IA-9, AU and the SCuBA application policies. Every gate names the validation kit check that proves it."
doc-type: workbook-guide
audience: [Technical, Customer]
family: guides
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Non-Person Identity: An Implementation Guide

*A person leaves and HR tells you; a service account's owner leaves and nothing tells you, so this track has to build the record that HR provides for everyone else.*

::: {.callout-note}
## In this guide
The non-person identity track of the [Attribute-Driven Migration guide](attribute-driven-migration.md#non-person-identity-track), as steps you can run. Prerequisites: roles, licenses and the system inventory as the source of truth. Then six gated steps: inventory every service account and workload identity and give each an owner and a sponsor; decide each one's target; set the credential rules; cut privilege; convert with a parallel run; and run the lifecycle through owner changes, orphans, reviews and decommissioning. Then SQL Server's service and application principals, AI agents, the dangers and how to avoid them, the evidence an assessor reads, rollback and a checklist. Every gate ends with a **Validate** step that names the read-only validation kit check (`VK-NPI-nn`) that proves it.
:::

## How to read this guide

This guide is the working layer under [Book 02, Chapters 09](../b02-identity/09-building-the-entra-target.md#modernizing-service-accounts) and [10](../b02-identity/10-migrating-and-governing.md#phase-4-service-account-modernization) (service accounts), [Book 04, Chapters 05](../b04-access/05-applications-and-workload-identities.md) and [06](../b04-access/06-who-decides-access.md) (applications and workload identities), [Book 17](../b17-ai-identity/index.md) (AI) and [Book 06](../b06-data-platform/index.md) (SQL Server). The chapters hold the depth; this guide gives the order of work, the gates and the checks.

Facts come from the linked chapters, which rely on their own verification logs. Facts the chapters don't carry were checked against Microsoft Learn on October 29, 2026, and are footnoted; the [verification log](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/books/guides/_verification/non-person-identity-implementation.md) lists them. Statements marked *(design guidance)* are the program's recommendations. Preview features carry their stage. The audience is a civilian agency at FedRAMP Moderate, usually in Microsoft 365 GCC, where Entra ID runs in Microsoft's commercial cloud ([Book 14, Chapter 03](../b14-compliance/03-the-baseline-and-the-crosswalk.md#two-facts-not-one)).

**The validation kit.** Each gate cites checks by ID. They're read-only: they read Microsoft Graph, Azure Resource Graph or an export, and report. None of them changes the tenant or the forest.

| ID | What it reports |
|---|---|
| VK-NPI-01 | Service principals and app registrations with no owner, or fewer than two |
| VK-NPI-02 | Secrets and certificates expiring within N days, and those valid longer than the policy maximum |
| VK-NPI-03 | Apps using client secrets where a certificate or federated credential is possible |
| VK-NPI-04 | Single-tenant service principals not covered by Conditional Access for workload identities |
| VK-NPI-05 | Service principals with high-privilege Graph app roles or directory roles |
| VK-NPI-06 | AD service accounts: password never expires, old passwords, SPNs, not a gMSA (from a fixture or an optional read-only AD query) |
| VK-NPI-07 | Managed identities and their role assignments |
| VK-NPI-08 | AI agent identities, where the tenant exposes them, with a sponsor present |
| VK-NPI-09 | Service principals with no sign-in activity in N days (*optional, preview*: reads a beta API, off by default, runs only with `-IncludePreview`; see [Step 6](#step-6-run-the-lifecycle)) |

: Validation kit checks for this track {.striped .hover}

## The track at a glance

**Source of truth.** The source of truth for this track is the owning system's record: the system inventory or CMDB entry, the app registration and, for AI, the AI use-case inventory. HR isn't. Book 03 deliberately leaves non-person identities out of the human-worker pattern ([Book 03, Chapter 01](../b03-hr-identity/01-overview-and-applicability.md#where-it-doesnt-apply-as-written)). Accountability means a named owner and a named sponsor. The lifecycle runs on the owning system's record and on credential expiry, not on hire and leave dates. HR contributes only one thing: the sponsor's own lifecycle. When a sponsor moves or leaves, every identity they sponsor has an event ([companion guide](attribute-driven-migration.md#four-tracks)).

**Done when** *(design guidance, from the companion guide's end state)*:

- every service account and service principal has an owner and a sponsor, a reason and a target;
- each one is retired, re-platformed to a managed identity or gMSA, or made a certificate or federated-credential workload identity;
- none holds a password that never expires, and none is orphaned.

[Book 02's Phase 4](../b02-identity/10-migrating-and-governing.md#phase-4-service-account-modernization) is the books' gate for service accounts.

## Prerequisites {#prerequisites}

### The record each identity joins to

The system inventory or CMDB is the master for this track *(design guidance)*. Before Step 1, agree the fields that every non-person identity's record carries:

| Field | Why |
|---|---|
| System or application ID | The join key. Entra applications point at it through `serviceManagementReference`, which Microsoft recommends for a team contact that survives one person leaving ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#ownership)) |
| Technical owner (two named people) | Manages configuration and credentials |
| Sponsor (a federal employee) | Answers for purpose and retirement; their HR lifecycle drives the identity's events ([Book 17, Chapter 05](../b17-ai-identity/05-owners-sponsors-and-lifecycle.md#the-programs-rule-two-named-humans-and-a-record)) |
| Identity type and object ID | sAMAccountName, application ID, service principal object ID, managed identity resource ID, or agent identity ID |
| Target and decision date | The Step 2 outcome |
| Credential type, expiry and vault location | Step 3 |
| Risk tier | Sets the approver and review cadence ([Book 04, Chapter 06](../b04-access/06-who-decides-access.md#risk-tiers-set-the-approval-chain)) |

: The non-person identity record (design guidance) {.striped .hover}

### Roles

Collection needs reader roles only. The checks sign in as an app registration with a certificate or a managed identity, never a secret, and follow the house Graph pattern of paging, `Retry-After` and `$select` ([Microsoft Automation, Module 1](../../training/ms-automation-foundations.md#four-request-patterns)). The permission set is `Application.Read.All`, `Directory.Read.All`, `RoleManagement.Read.Directory`, `AuditLog.Read.All` and `Policy.Read.All`, plus Azure Reader on the subscriptions in scope for managed identities. Grant only what you run ([Module 2](../../training/ms-automation-entra.md#the-five-checks)).

The roles that change configuration come in later steps and are activated through PIM:

- application management policies need Security Administrator plus Cloud Application Administrator or Application Administrator;[^npi-amp]
- Conditional Access needs Conditional Access Administrator;
- custom security attributes need Attribute Definition Administrator and Attribute Assignment Administrator ([companion guide](attribute-driven-migration.md#what-microsoft-documents-for-targeting-service-principals-by-attribute-partly));
- deactivating an app registration needs Cloud Application Administrator or Application Administrator.[^npi-deactivate]

### Licenses

| Capability | License | Source |
|---|---|---|
| Managed identities, workload identity federation, application management policies, sign-in and audit logs | Free | [Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#what-workload-id-premium-adds) |
| Conditional Access and ID Protection for workload identities; app health recommendations for unused identities | Workload ID Premium | Same |
| Access reviews of service principals in privileged roles, including managed identities | Workload ID Premium for the reviewed service principals, plus Entra ID P2 or ID Governance for reviewers | [^npi-wid-faq][^npi-pim-review] |
| Agent identities (Agent ID) | Available to all Entra customers | [Book 17, Chapter 04](../b17-ai-identity/04-kinds-of-ai-identity.md#release-stage-licensing-and-government-clouds) |
| Conditional Access, ID Protection and governance for agents | Microsoft 365 E7, or Agent 365 with Entra ID P1 or Microsoft 365 E3; agent risk also needs P2 | Same; [Book 17, Chapter 05](../b17-ai-identity/05-owners-sponsors-and-lifecycle.md#release-stage-and-government-cloud-availability) |

: What each step needs, by license {.striped .hover}

Workload ID Premium is available in Azure Government clouds through the account manager, and its free trial isn't.[^npi-wid-faq] The program licenses it for Tier 1 single-tenant service principals ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#what-workload-id-premium-adds)).

## The path on one page

| Gate | Done when | Validate with |
|---|---|---|
| [G1 Inventory](#step-1-inventory-every-non-person-identity) | Every non-person identity is listed, typed and joined to a record with an owner and a sponsor | VK-NPI-01, 06, 07, 08 |
| [G2 Decision](#step-2-decide-each-identitys-target) | Every identity has a target and a date; high-risk accounts are first | VK-NPI-03, 06 |
| [G3 Credential rules](#step-3-set-the-credential-rules) | The tenant blocks new secrets and caps lifetimes; existing credentials are on a rotation calendar in a vault | VK-NPI-02, 03 |
| [G4 Least privilege](#step-4-cut-privilege) | High-privilege grants are justified or removed; Tier 1 single-tenant service principals have a workload identity policy | VK-NPI-04, 05, 07 |
| [G5 Conversion](#step-5-convert-with-a-parallel-run) | Converted identities authenticate without stored secrets; legacy accounts are disabled after a clean parallel run | VK-NPI-03, 06 |
| [G6 Lifecycle](#step-6-run-the-lifecycle) | Owner change, orphan, review and decommission paths run and leave records | VK-NPI-01, 02, 08, 09 |

: The six gates of the non-person identity track {.striped .hover}

The [non-person identity project plan](../../project-plans/non-person-identity.md) schedules this work with owners and decide-by dates. The [program master schedule](../../project-plans/program-master-schedule.md) times its AD side as P4.6: AD-bound service principal names migrated, retired or islanded, app by app.

## Step 1: Inventory every non-person identity {#step-1-inventory-every-non-person-identity}

Consent creates service principals and Microsoft services provision their own, so the inventory is always larger than the list of apps anyone asked for ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#two-objects-for-one-application)). Inventory first; decide later.

### 1a. AD service accounts, MSAs, gMSAs and dMSAs

1. Run the read-only discovery function `Get-FMPServiceAccountInventory` from [Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md#discovering-service-accounts), maintained in the [identity assessment module](../b02-identity/appendix-c-identity-assessment-module.md). It finds user objects with SPNs, `svc-` and similar prefixes, or "service account" descriptions. It records `PasswordNeverExpires`, the days since the password last changed, the SPN count, last logon and group count. It lists MSAs and gMSAs separately and gives each a risk level and a suggested target.
2. Add dMSAs if any domain runs at the Windows Server 2025 level. They supersede a traditional account, bind authentication to mapped machine identities and disable the original account's password ([Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md#service-accounts)).
3. Treat "stale" as a lead, not a verdict. Confirm it against domain controller and Entra sign-in logs before anything is retired (same section).
4. Record which hosts can retrieve each gMSA's password (`PrincipalsAllowedToRetrieveManagedPassword`). That list is the gMSA's real blast radius.

### 1b. App registrations and service principals

1. Run the read-only inventory script in [Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#a-read-only-inventory-to-start-from). It reads the tenant's consent settings, and for every app registration its owner count, its credentials, and the delegated and application permissions granted to its service principal.
2. Record each service principal's `servicePrincipalType`: `Application`, `ManagedIdentity`, `Legacy`, or `ServiceIdentity`, which Microsoft's schema uses for an agent identity.[^npi-sptype] A legacy service principal can hold credentials but has no app registration, so it never shows up in an app-registration-only review.
3. Mark multitenant and Microsoft first-party service principals: workload identity Conditional Access can't reach them ([Book 17, Chapter 04](../b17-ai-identity/04-kinds-of-ai-identity.md#policy-on-workload-identities)).
4. Record app instance property lock, which stops a holder of Application Administrator, or an owner of the service principal, from adding a credential and acting as the app ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#app-instance-property-lock)).

### 1c. Managed identities

1. List them: Microsoft documents `GET /v1.0/servicePrincipals?$filter=servicePrincipalType eq 'ManagedIdentity'`.[^npi-mi-find]
2. For each one, read its Azure role assignments from Azure Resource Graph and its Graph app role assignments from the service principal. Managed identities have no application object, so Graph permissions are granted directly to the service principal.[^npi-mi-faq]
3. Separate system-assigned identities from user-assigned ones. A user-assigned identity outlives the resources it's attached to and must be deleted explicitly ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#managed-identities)), so it's the type that orphans.

### 1d. Workload identity federation

For every app registration and user-assigned managed identity, export its federated identity credentials: issuer, subject and audience. Approving a federated credential is approving every workload that issuer will vouch for under that subject, so the program records the issuer and subject in the application registry ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#workload-identity-federation)). An incorrect subject is accepted when it's created and fails only at token exchange. An object holds at most 20 of these credentials ([Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md#workload-identity-federation)).

### 1e. AI agent identities

1. Where the tenant exposes Agent ID, list blueprints, blueprint principals, agent identities and agents' user accounts, with their sponsors and owners. The read-only listing in [Book 17, Chapter 05](../b17-ai-identity/05-owners-sponsors-and-lifecycle.md#a-read-only-check-to-start-from) is the starting point.
2. List agents that aren't agent identities too. Earlier Copilot Studio and Azure AI Foundry agents, and many custom agents, run as ordinary service principals and are governed as applications ([Book 17, Chapter 05](../b17-ai-identity/05-owners-sponsors-and-lifecycle.md#agents-that-arent-agent-identities)).
3. Join each one to the AI use-case inventory ([Book 17, Chapter 03](../b17-ai-identity/03-the-inventory-as-an-identity-source.md)).

### 1f. Join to the record and name the owner and sponsor

1. Join every identity from 1a to 1e to a record in the system inventory. For an app registration, use `serviceManagementReference` where it's set. Otherwise search by name and owner, then interview.
2. Identify the application owner before the account is touched ([Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md#phase-4-service-account-modernization)). An account nobody will own is a retirement candidate ([companion guide](attribute-driven-migration.md#service-accounts-msas-gmsas-and-dmsas)).
3. Name two human owners for every app registration and service principal, never service accounts ([Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md#governing-service-principals)). The Owners list holds only the people who configure the app. The business approver goes in the registry and in `serviceManagementReference`, because an owner can add a credential and act as the app ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#ownership)).
4. Record a sponsor who is a federal employee mastered in HR. A contractor can build or run a workload but can't be its only sponsor ([Book 17, Chapter 05](../b17-ai-identity/05-owners-sponsors-and-lifecycle.md#the-programs-rule-two-named-humans-and-a-record); the program applies the rule to all non-person identities, *design guidance*).
5. Optionally tag service principals with custom security attributes such as `SystemId`, `Environment` and `Tier`. Microsoft suggests it for a filterable inventory and for ABAC decisions.[^npi-rbac-wid] [Step 4](#step-4-cut-privilege) uses the same attributes for Conditional Access filters.

::: {.callout-important}
## Validate (G1 Inventory)
- **VK-NPI-06** reports every AD account with password never expires, a password older than the program threshold (Book 02's script treats more than 365 days as high risk), an SPN, or a type other than gMSA or dMSA. Every row is joined to a record or listed as unowned.
- **VK-NPI-01** reports zero service principals and app registrations with no owner. Those with one owner each carry a dated finding.
- **VK-NPI-07** lists every managed identity with its role assignments, and every user-assigned identity is joined to a record.
- **VK-NPI-08** lists every agent identity with a sponsor, where the tenant exposes Agent ID. State the availability: Agent ID is generally available in commercial and, with documented gaps, in GCC ([Book 17, Chapter 04](../b17-ai-identity/04-kinds-of-ai-identity.md#release-stage-licensing-and-government-clouds)).
- Gate owner: the identity governance office, with the CMDB owner signing that the join is complete *(design guidance)*.
:::

## Step 2: Decide each identity's target {#step-2-decide-each-identitys-target}

Each identity ends in one of five places: retire it, convert it to a gMSA (or a dMSA on a Windows Server 2025 domain), or move it to a managed identity, a federated credential or a certificate credential. [Book 02's matrix](../b02-identity/09-building-the-entra-target.md#the-migration-path-matrix) decides by account type and by where the workload runs. Its rule: no stored secrets; managed identities for Azure-hosted workloads; federation where the workload already has a trusted issuer; certificates only where neither applies.

| What you found | Where the workload runs | Target |
|---|---|---|
| Disabled, unused, or no owner after Step 1 | Anywhere | **Retire** ([Step 6](#step-6-run-the-lifecycle)) |
| Traditional account | Azure resource | **Managed identity**, user-assigned preferred |
| Traditional account calling Microsoft 365 or Entra-protected APIs | A host with an OIDC issuer (GitHub Actions, Kubernetes, Google Cloud, AWS, another OIDC platform) | **App registration with a federated credential** |
| Traditional account calling Entra-protected APIs | No issuer and not in Azure, such as an on-premises scheduler | **App registration with a certificate**, or a managed identity if the host is Arc-enabled |
| Traditional account, Kerberos only | On premises | **gMSA**, or a **dMSA** on a Windows Server 2025 domain |
| MSA | On premises | **gMSA**: upgrade first, because an MSA or gMSA can't be migrated to a dMSA |
| gMSA or dMSA | Staying on premises | **Keep** |
| gMSA | Hybrid | **Keep the gMSA**, plus an app registration for the cloud calls |
| gMSA | Moving to the cloud | **Managed identity** or **federated credential** |
| IIS application pool or scheduled task identity | On premises, moving later | **gMSA now**; a managed identity or an Azure Automation runbook with one once moved |
| App registration with a client secret | Any | Re-credential to a **managed identity**, then **federation**, then a **certificate** |

: The decision for each identity, condensed from Book 02, Chapter 09 {.striped .hover}

Microsoft suggests a managed identity instead of an app registration when the service runs in Azure, doesn't sign users in, isn't a web API and doesn't work across tenants ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#managed-identities)). An Arc-enabled server has one too ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#credentials)).

**Order of work.** High-risk accounts go first: password never expires, or over-privileged ([Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md#phase-4-service-account-modernization)).

**Prerequisites for a gMSA.** A gMSA needs a KDS root key, created once per domain. Domain controllers wait up to 10 hours after it's created before they allow a gMSA to be created.[^npi-kds] Microsoft recommends gMSAs as the account type for on-premises services unless a service doesn't support them, and tells you to test the service with a gMSA before production.[^npi-gmsa-secure]

::: {.callout-important}
## Validate (G2 Decision)
- Every row in the Step 1 record has a target and a decide-by date.
- **VK-NPI-06**: every high-risk AD account (password never expires, or password older than the threshold) is scheduled in the first conversion wave or retired.
- **VK-NPI-03** lists apps that hold secrets. Each one has a credential target, or an exception record naming why it can't move.
- Gate owner: the application owner, with the identity governance office.
:::

## Step 3: Set the credential rules {#step-3-set-the-credential-rules}

The program's rules *(design guidance, from the books)*:

- no long-lived secrets;
- managed identities first, then federated credentials, then certificates, with client secrets only by documented exception;
- every certificate in a vault and on a rotation calendar.

[Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#credentials) gives Microsoft's order and its reasons.

### Steps

1. **Turn on the application management policy.** Create a tenant-wide default policy that blocks new password secrets and symmetric keys, and caps new certificates at 180 days. These are Microsoft's recommended settings and the program's choice ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#enforcing-the-order-with-app-management-policies)). Each restriction can apply only to apps created after a chosen date. Set that date to the policy's effective date, so the rule binds new registrations while the old ones are fixed in Step 5. The policy covers agent identity blueprints too, which are application objects ([Book 17, Chapter 06](../b17-ai-identity/06-credentials-and-least-privilege.md#enforcing-the-order)).
2. **Reconcile the two rotation numbers.** Book 02 allows annual rotation for certificates on accounts being migrated, and Book 04 caps new certificates at 180 days. They fit together: an existing workload moves onto a certificate and is rotated at least yearly while it's being fixed, and every new registration starts under the 180-day cap (Book 04, same section).
3. **Map the policy to SCuBA.** ScubaGear 2.0.0 checks three SHOULD policies: application password addition blocked (MS.AAD.5.5v1), password lifetime at most 180 days (MS.AAD.5.6v1), and certificate lifetime at most 365 days (MS.AAD.5.7v1). None is a BOD 25-01 required configuration. The 180-day certificate cap meets MS.AAD.5.7v1 ([Book 17, Chapter 06](../b17-ai-identity/06-credentials-and-least-privilege.md#enforcing-the-order)).
4. **Put certificates in a vault.** Keep private keys in Azure Key Vault or an HSM, never on a file share. Key Vault renews certificates automatically only when they're self-signed or come from a CA partnered with Key Vault (DigiCert and GlobalSign). Certificates from other CAs, including an agency PKI, aren't renewed automatically; their lifetime action can still send email alerts before expiry.[^npi-kv-rotate] Which CA signs workload certificates is the cryptographic architecture's decision ([Book 07](../b07-pki/index.md)).
5. **Close the loop between vault and directory.** A renewed certificate in Key Vault doesn't by itself change the credential on the app registration. Microsoft's own procedure for SQL Server on Arc uploads the new certificate to the app registration as a separate step and removes the old one after 24 hours.[^npi-sql-rotate] Automate that upload in the pipeline, or treat it as a named owner's task with a date.
6. **Secrets by exception only.** A client secret instead of a certificate needs the identity governance office and the CISO to approve it, lasts at most six months and is never renewed automatically ([Book 04, Chapter 06](../b04-access/06-who-decides-access.md#exceptions)). While it exists, keep it in Key Vault with the shortest lifetime the app tolerates and automated rotation.
7. **AD-side credentials.** A gMSA's password is 240 bytes, randomly generated, and changed by Windows every 30 days by default. The interval can be set only when the account is created.[^npi-gmsa-secure][^npi-svc-pw] A traditional account that has to stay for now gets a long random password in the vault, a rotation owner and a date. Password never expires is removed or carries a dated exception *(design guidance)*.
8. **Federated credentials.** A new federated credential is a credential change. It needs the owner's and the governance office's approval, and its issuer and subject are recorded ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#workload-identity-federation)). Use `api://AzureADTokenExchange` as the audience ([Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md#workload-identity-federation)).

::: {.callout-important}
## Validate (G3 Credential rules)
- **VK-NPI-02** reports, for every app registration and service principal, each secret and certificate with its lifetime and days to expiry. Pass: no credential issued after the policy's effective date runs longer than the cap (180 days for certificates; no new secrets). Every credential that expires within N days (the program uses 60, *design guidance*) has an owner and a renewal date.
- **VK-NPI-03** reports apps that still use secrets. Each one is either in a Step 5 wave or has an exception with an end date.
- The ScubaGear result for MS.AAD.5.5v1 to 5.7v1 is filed with the gate ([evidence](#evidence)).
:::

## Step 4: Cut privilege {#step-4-cut-privilege}

NIST's least privilege applies to processes acting on behalf of users, not only to users ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#governing-app-registrations)). A workload can use its access faster and more widely than any person.

### 4a. Graph: application versus delegated permissions

1. For each service principal, list its application permissions (app role assignments) and its delegated grants (`oauth2PermissionGrants`), the reads in [Module 2](../../training/ms-automation-entra.md#applications-and-their-credentials).
2. Prefer delegated permissions where a user is present. A delegated grant gives the app the intersection of the user's rights and the scope. An application permission gives everything the scope allows, across the tenant ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#permissions-what-an-application-can-be-granted)).
3. Classify each grant against the program's risk table, and judge it by type, not by name. `Mail.ReadWrite` and `Mail.Send` are critical application permissions with the same names as their delegated versions. Any mail application permission the program approves needs an Exchange application access policy that narrows it to named mailboxes (same section).
4. Remove grants that aren't used. Removing a permission from the app registration doesn't revoke an existing grant: revoke it on the enterprise application too. Tokens already issued stay valid for their lifetime ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#admin-consent)).
5. Route new grants through the tiered approval. Microsoft Graph application permissions are granted by Privileged Role Administrator, activated through PIM against an approved ticket ([Book 04, Chapter 06](../b04-access/06-who-decides-access.md#who-approves-admin-consent)). Microsoft's least-privileged-roles page adds a caution: in practice, consenting to Graph application permissions typically requires Global Administrator, and Privileged Role Administrator may not be enough, depending on consent policies and permission scopes.[^npi-delegate-task] Test the path in the pilot before writing it into the runbook.

### 4b. Directory roles {#directory-roles}

1. List every directory role held by a service principal. Microsoft labels privileged roles and permissions (`isPrivileged` in the beta Graph API, a feature Microsoft marks as preview). It also says service principals and applications that hold highly privileged roles are control-plane (Tier 0) assets, to be administered only from systems equally trusted.[^npi-privileged]
2. No standing privileged role for a non-person identity unless the record justifies it. Where one is needed, prefer a time-bound active assignment approved through the ticket, never a permanent one. PIM can assign roles to service principals and managed identities ([Book 17, Chapter 06](../b17-ai-identity/06-credentials-and-least-privilege.md#privileged-roles-for-ai-none-standing); the program extends the rule beyond AI, *design guidance*).
3. Review service principals in privileged Entra and Azure resource roles with PIM access reviews. Creating a review of Entra roles takes at least Privileged Role Administrator, and reviewing service principals needs Workload ID Premium.[^npi-pim-review] These reviews cover managed identities too.[^npi-wid-faq]

### 4c. Azure RBAC

Scope each managed identity's and service principal's Azure role to the resource it uses, such as Key Vault Reader on one vault, never Owner or Contributor at a subscription or management group ([Book 17, Chapter 06](../b17-ai-identity/06-credentials-and-least-privilege.md#azure-resources-and-other-apis)). Azure ABAC conditions can read a custom security attribute on the principal, but only on role assignments with blob or queue storage data actions ([companion guide](attribute-driven-migration.md#what-microsoft-documents-for-targeting-service-principals-by-attribute-partly)). The Arc onboarding role belongs only to the onboarding service principal ([Ansible guide](ansible-configuration-automation.md#arc-onboarding-at-scale)).

### 4d. Custom security attributes and Conditional Access app filters

Define an attribute set for applications, such as `Environment` and `DataClass`, and assign the values to service principals. A Conditional Access policy can then select target applications by attribute. Only string attributes work, and they're evaluated at token issuance. Global Administrator can't read or assign them by default ([companion guide](attribute-driven-migration.md#what-microsoft-documents-for-targeting-service-principals-by-attribute-partly); [Book 04, Chapter 03](../b04-access/03-the-conditional-access-model.md#target-resources)). Service principals can't be dynamic group members, so attributes are how this track targets by fact ([companion guide](attribute-driven-migration.md#dynamic-group-dangers)).

### 4e. Conditional Access for workload identities, and its limits

A policy can block a service principal from outside known IP ranges, when ID Protection flags it as risky, or with authentication contexts. Start it in report-only mode; results appear in the service principal sign-in logs ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#conditional-access-for-workload-identities)). The limits, as the books state them:

- **Block is the only grant control.**
- **Single-tenant service principals only**, registered in your tenant. Microsoft and third-party SaaS apps, multitenant apps and managed identities aren't covered.
- **Assign directly.** A policy assigned to a group that contains a service principal isn't enforced for it.
- **Workload ID Premium** is needed to create or change these policies. Without it, existing policies keep working but can't be edited.

Steps: for each Tier 1 single-tenant service principal, assign it directly to a location block that allows only the networks it runs from, plus a high-risk block, both report-only first ([Book 04, Chapter 07](../b04-access/07-the-conditional-access-policy-library.md)). Govern managed identities through role assignments and access reviews instead.

::: {.callout-important}
## Validate (G4 Least privilege)
- **VK-NPI-05** lists every service principal holding a critical or high Graph application permission, or a privileged directory role. Each row is justified in its record with an approver and a review date, or removed. Read the permission type, not the suffix.
- **VK-NPI-04** lists single-tenant service principals not assigned directly to a workload identity policy. Pass: no Tier 1 service principal is on the list, and the report-only results have been reviewed before switching to On.
- **VK-NPI-07**: no managed identity holds Owner, Contributor or User Access Administrator above resource-group scope without a recorded reason.
:::

## Step 5: Convert with a parallel run {#step-5-convert-with-a-parallel-run}

This is [Book 02's Phase 4](../b02-identity/10-migrating-and-governing.md#phase-4-service-account-modernization). It needs Phase 3 to be complete and the inventory classified, and it takes six to eight weeks.

1. **Build the target:**
   - a managed identity, with its role assignments;
   - a federated credential on the app registration, tested by an actual token exchange;
   - a certificate credential from the vault;
   - or a gMSA installed on the hosts allowed to retrieve it.
2. **Give it two human owners and a rotation schedule.**
3. **Run old and new in parallel for 30 days.** The application uses the new identity, and the legacy account stays enabled. Watch both: the new identity's sign-ins in the Entra service principal sign-in logs, and the legacy account's logons on domain controllers.
4. **Disable the legacy account.** Don't delete it. For an AD account, disable it and move it to a holding OU. For an app registration losing a secret, remove the secret only after the new credential has carried production traffic.
5. **Record the result** in the record: the target achieved, the date, and the disabled object's ID.

::: {.callout-important}
## Validate (G5 Conversion)
- Every high-risk account is converted or retired: **VK-NPI-06** shows none still enabled with password never expires, outside a dated exception.
- **VK-NPI-03** shows the converted apps no longer hold secrets.
- New identities authenticate without stored secrets where possible, there was no service disruption during the parallel run, and workload identity policies are enforced. These are Book 02's validation criteria.
- Rollback: re-enable the legacy account and revert the application's configuration (Book 02, same phase). Rollback stays possible until Step 6 deletes the account.
:::

## Step 6: Run the lifecycle {#step-6-run-the-lifecycle}

A non-person identity's events come from its owning system and from credential expiry, not from HR. The one exception is the sponsor's own mover and leaver events.

### Owner change

An owner who leaves or changes roles starts a transfer at least ten business days ahead; the business approver nominates a successor and the identity governance office approves ([Book 04, Chapter 06](../b04-access/06-who-decides-access.md#ownership-changes-and-orphaned-apps)). Add the step to the departing person's HR-driven mover and leaver workflows, so the trigger is HR's and nobody has to remember it ([Book 17, Chapter 05](../b17-ai-identity/05-owners-sponsors-and-lifecycle.md#when-the-sponsor-moves-or-leaves)). Lifecycle Workflows supports custom task extensions for that under Entra ID Governance (same chapter, [where the agent features aren't available](../b17-ai-identity/05-owners-sponsors-and-lifecycle.md#where-the-agent-features-arent-available)).

### Orphans

An application is orphaned when it has no named owner in the registry or the Owners list. Book 04's policy ([Chapter 06](../b04-access/06-who-decides-access.md#ownership-changes-and-orphaned-apps)):

1. it's reclassified as Tier 1;
2. the identity governance office takes interim ownership and a ticket opens;
3. there are 30 days to assign an owner or start decommissioning;
4. at day 31, access is suspended, preferably by deactivating the app.

For AD service accounts, an account with no owner after Step 1 is a retirement candidate. For an AI agent, a person disables it once the finding is confirmed, without waiting 30 days, because an agent can act ([Book 17, Chapter 05](../b17-ai-identity/05-owners-sponsors-and-lifecycle.md#the-orphaned-agent)).

**Inactivity is a second orphan signal.** Microsoft's service principal sign-in activity report gives the last time each service principal was used, as client or resource, app-only or delegated. The report is in preview and its Graph API is in beta. The API page lists it for the global service and not for the US Government L4 or L5 clouds, so in a GCC tenant, which uses the commercial service, it's available.[^npi-sp-activity] Workload ID Premium adds app health recommendations for unused and inactive workload identities ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#what-workload-id-premium-adds)).

### Access reviews of owners

- App owners review their delegated and application permissions on a recurring cadence; the program's standard is quarterly ([Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md#governing-service-principals)).
- Microsoft recommends reviewing owners every few months, and monitoring so that every app has at least two owners where possible ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#ownership)).
- Each attestation covers four things: the owners are still valid, the permissions are still needed, unused credentials are removed, and the record matches ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#governing-app-registrations)).
- Service principals in privileged roles also get the PIM access reviews from [Step 4b](#directory-roles).

### Decommissioning: disable first, then delete

The books' rule is to deactivate first so that nothing breaks silently, then revoke grants, remove credentials and delete ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#governing-app-registrations)). The mechanics, per type:

| Identity | Disable | Then delete |
|---|---|---|
| AD account or gMSA | Disable; remove SPNs only after the observation period; log the decision | Delete after the observation window. Check for SPN dependencies first ([Book 06, R08](../b06-data-platform/r08-application-chain-and-connection-strings.md)) |
| App registration (all tenants) | **Deactivate.** New tokens stop at once; existing tokens stay valid until they expire; configuration is kept. Remove other owners first, so only an administrator can reactivate it[^npi-deactivate] | Delete: soft-deleted and restorable for 30 days.[^npi-restore-app] Multitenant app objects aren't hard-deleted automatically after 30 days and must be removed by hand[^npi-recover] |
| Service principal (this tenant) | Set **Enabled for users to sign-in?** to No (`accountEnabled=false`), which blocks tokens in this tenant only[^npi-deactivate] | Delete. A restore brings the configuration back except its policies, such as Conditional Access[^npi-restore-sp] |
| User-assigned managed identity | Remove its role assignments | Delete the Azure resource. Soft-deleted managed identity service principals can't be recovered by customers[^npi-restore-sp] |
| Agent identity or blueprint | Disable (a sponsor can, but can't re-enable) | Delete: a blueprint deletion cascades to its agent identities asynchronously, restorable for 30 days ([Book 17, Chapter 05](../b17-ai-identity/05-owners-sponsors-and-lifecycle.md#retirement)) |

: Disable first, then delete {.striped .hover}

In the Entra audit log, a deactivation or reactivation appears as **Update application** with the `isDisabled` property's old and new values.[^npi-deactivate] File that entry with the decision record.

::: {.callout-important}
## Validate (G6 Lifecycle)
- **VK-NPI-01** runs weekly. A new zero-owner or single-owner app opens a ticket the same week ([Book 04, Chapter 06](../b04-access/06-who-decides-access.md#ownership-changes-and-orphaned-apps)).
- **VK-NPI-02** runs weekly. No production credential expires unplanned.
- **VK-NPI-08**: no agent identity without a confirmed sponsor beyond the ten-business-day grace period ([Book 17, Chapter 05](../b17-ai-identity/05-owners-sponsors-and-lifecycle.md#when-the-sponsor-moves-or-leaves)).
- **VK-NPI-09** (*optional, preview*; off by default, run it with `-IncludePreview`): every service principal with no sign-in in N days (the program uses 90, *design guidance*) is in an orphan or decommission ticket. The check is preview because its API is.
- One test owner change and one test decommission have run end to end and left their records.
:::

## SQL Server service and application principals {#sql-server}

SQL Server follows the same logic, and [Book 06](../b06-data-platform/index.md) carries it:

- **The engine's service account.** A gMSA or domain service account works only while AD is authoritative ([Book 06, Chapter 02](../b06-data-platform/02-why-the-inheritance-must-end.md#driver-three-the-service-account-credential-problem)). Arc doesn't replace the Windows account the service runs as. It changes the identity Entra ID and Azure see ([Book 06, Chapter 09](../b06-data-platform/09-what-arc-provides-to-sql-server.md#the-managed-identity-and-the-service-account)).
- **The instance's Entra identity.** On SQL Server 2025 it's the Arc server's system-assigned managed identity, with no credential to manage. On SQL Server 2022 it's an app registration whose Key Vault certificate needs a named renewal owner and isn't rotated automatically (same section). [Runbook R04](../b06-data-platform/r04-arc-deployment-and-managed-identity.md) deploys it.
- **Application principals.** ETL, reporting and API back ends replace SQL Authentication logins with `FROM EXTERNAL PROVIDER` logins for Entra applications: a managed identity first, a certificate in Key Vault where a credential is unavoidable, and a client secret only as a documented exception ([Book 06, Chapter 11](../b06-data-platform/11-three-principal-types.md#type-3-entra-service-principal-login)).
- **The same parallel run.** Create, validate, disable, observe for 30 days with audit evidence, then drop ([Book 06, Chapter 11](../b06-data-platform/11-three-principal-types.md#the-parallel-run-migration-pattern)). [Chapter 19](../b06-data-platform/19-connection-string-migration.md) covers connection strings.

Join every SQL application principal to its record in Step 1, and run VK-NPI-02 and VK-NPI-05 over them like any other service principal.

## AI agents {#ai-agents}

AI agents are non-person identities and follow this guide, with these additions from [Book 17](../b17-ai-identity/index.md):

- **Sponsors and blueprints.** A sponsor is required when an agent identity or blueprint is created. The blueprint holds the credentials and is the credential boundary: one disable, grant revocation or Conditional Access policy on it reaches every agent created from it ([Book 17, Chapter 04](../b17-ai-identity/04-kinds-of-ai-identity.md#the-object-model)). The program's rule: an HR-mastered federal sponsor, a small dynamic sponsoring group, a technical owner who isn't the sponsor, and an inventory record that names the same sponsor ([Book 17, Chapter 05](../b17-ai-identity/05-owners-sponsors-and-lifecycle.md#the-programs-rule-two-named-humans-and-a-record)).
- **Creation is gated.** Set **Users can create agent blueprints** to No, the agent analog of MS.AAD.5.1v1. Run a production handshake before any agent goes live ([Book 17, Chapter 05](../b17-ai-identity/05-owners-sponsors-and-lifecycle.md#creation)).
- **Credentials.** Blueprint credentials in the Step 3 order, with no secret on a production blueprint ([Book 17, Chapter 06](../b17-ai-identity/06-credentials-and-least-privilege.md#no-stored-secrets)). An agent that calls a tool with an API key bypasses Entra ID entirely. Record each key as an exception, with an owner, a vault and a rotation date ([Book 17, Chapter 06](../b17-ai-identity/06-credentials-and-least-privilege.md#when-the-agent-reaches-something-entra-doesnt-protect)).
- **Recertification by expiry.** Access through access packages with end dates, so a sponsor who does nothing removes access ([Book 17, Chapter 05](../b17-ai-identity/05-owners-sponsors-and-lifecycle.md#recertification-expiry-is-the-review)).
- **Availability, as Book 17 states it** ([Chapter 04](../b17-ai-identity/04-kinds-of-ai-identity.md#release-stage-licensing-and-government-clouds); [Chapter 05](../b17-ai-identity/05-owners-sponsors-and-lifecycle.md#release-stage-and-government-cloud-availability)):

  | Capability | Stage | GCC |
  |---|---|---|
  | Agent ID platform: blueprints, agent identities, sponsors | Generally available since April 2026 | A documented partial subset |
  | Sponsor lifecycle workflows | Generally available since May 2026 | Available |
  | Agent targeting in Conditional Access; the agent risk condition | Preview | Available for agents with delegated access |
  | Agent's user account | Preview, Frontier program tenants only | — |
  | Agent 365 FedRAMP High authorization | Pending as of October 1, 2026 | — |

  For GCC High and DoD (High only), Microsoft has published no availability, so treat the agent features as unavailable there. Where they aren't available, run this guide's lifecycle on the service principals the agents run as.

## Dangers and how to avoid them {#dangers}

| Danger | What goes wrong | Mitigation |
|---|---|---|
| **The owner is a credential holder** | Every name in Owners can add a credential and act as the app ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#ownership)) | Owners hold only the two people who configure the app; business approvers go in the registry; lock sensitive properties |
| **"Disabled" isn't revoked** | Tokens already issued stay valid after deactivation or grant removal[^npi-deactivate] ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#admin-consent)) | For an incident, deactivate and also rotate or remove credentials; plan for the token lifetime |
| **Deleting too soon** | A deleted service principal's restore doesn't bring back its Conditional Access policies; managed identity service principals can't be restored by customers[^npi-restore-sp] | Disable first; delete after the observation period with the decision recorded |
| **A renewed certificate nobody uploaded** | The vault renews; the app registration keeps the old certificate and fails at expiry[^npi-sql-rotate] | Automate the upload; VK-NPI-02 at 60 days |
| **Federation trusts too much** | A broad subject lets every workload on that issuer in; a wrong subject fails only at runtime ([Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md#workload-identity-federation)) | Exact subjects per branch or environment; approve each credential as a change; test the exchange |
| **One managed identity, many processes** | On an Arc server every permitted process presents the same principal ([Book 06, Chapter 11](../b06-data-platform/11-three-principal-types.md#type-3-entra-service-principal-login)) | Treat one login per server as the unit of attribution; keep the local group small |
| **Workload Conditional Access assumed to cover everything** | Group-assigned, multitenant and managed identity principals are silently out of scope ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#conditional-access-for-workload-identities)) | Assign directly; VK-NPI-04; govern the rest through permissions and reviews |
| **Privileged service principals treated as ordinary apps** | A service principal with a highly privileged role is a control-plane asset[^npi-privileged] | VK-NPI-05; time-bound assignments; administer from Tier 0 systems only |
| **The agent built by whoever was there** | By default the creator becomes sponsor and blueprint owner ([Book 17, Chapter 05](../b17-ai-identity/05-owners-sponsors-and-lifecycle.md#what-creation-sets-automatically)) | Blueprint creation set to No; production handshake sets the sponsor and owner explicitly |

: Dangers in the non-person identity track {.striped .hover}

## Evidence {#evidence}

The mapping is the program's, from the books cited. Where a book maps a control, that book governs.

| Requirement | What this track does | Evidence to file | Book |
|---|---|---|---|
| AC-2 Account Management; AC-2(3) Disable Accounts | Non-person identities are a defined account type with an owner and a sponsor; orphaned and retired identities are disabled | The Step 1 record; owner-change and decommission tickets; VK-NPI-01 and VK-NPI-08 runs | [Book 17, App. A](../b17-ai-identity/appendix-a-requirements-mapping.md#account-management-and-access-ac); [Book 02, Ch. 10](../b02-identity/10-migrating-and-governing.md#compliance-manager-and-the-fedramp-20x-indicators) |
| AC-6 Least Privilege; AC-6(5) Privileged Accounts; AC-6(7) Review | Scoped grants; no standing privileged roles; reviews of privileged service principals | VK-NPI-05 and VK-NPI-07 runs with justifications; PIM access review results | [Book 17, App. A](../b17-ai-identity/appendix-a-requirements-mapping.md#account-management-and-access-ac); [Book 02, App. A](../b02-identity/appendix-a-federal-requirements-crosswalk.md#nist-sp-800-53-rev.-5-control-mapping) |
| IA-4 Identifier Management | Each identity has its own identifier, joined to its record and never reused | The record, keyed by object ID and system ID | [Book 17, App. A](../b17-ai-identity/appendix-a-requirements-mapping.md#identification-and-authentication-ia) |
| IA-5 Authenticator Management; IA-5(2) | Managed identities and federation first; certificates in a vault and rotated; no new secrets | The application management policy export; VK-NPI-02 and VK-NPI-03 runs; the rotation calendar | Same; [Book 04, Ch. 05](../b04-access/05-applications-and-workload-identities.md#governing-app-registrations) |
| IA-9 Service Identification and Authentication (in no baseline, so tailored in) | Services and workloads authenticate as themselves to Entra ID | Graph permission grants per workload identity; the service principal sign-in log | [Book 17, App. A](../b17-ai-identity/appendix-a-requirements-mapping.md#identification-and-authentication-ia); [companion guide](attribute-driven-migration.md#federal-requirements) |
| AU-2, AU-6, AU-12 | Service principal sign-ins, credential changes and deactivations are logged and reviewed | Logs routed out of Entra ID to the SIEM; audit entries for credential adds and `isDisabled` changes | [Book 17, App. A](../b17-ai-identity/appendix-a-requirements-mapping.md#audit-monitoring-and-assessment-au-ca-si); [Book 12, Ch. 03](../b12-security-operations/03-identity-telemetry.md) |
| CISA SCuBA MS.AAD.5.1v1 to 5.3v1 (BOD 25-01 required): app registration limited to administrators, user consent restricted, admin consent workflow configured | Users can't register apps or consent beyond low-classified permissions; the workflow is the intake | ScubaGear report | [Book 02, App. A](../b02-identity/appendix-a-federal-requirements-crosswalk.md#the-crosswalk-identity-controls); [Book 04, Ch. 05](../b04-access/05-applications-and-workload-identities.md#consent) |
| CISA SCuBA MS.AAD.5.5v1 to 5.7v1 (SHOULD, ScubaGear 2.0.0): no app passwords, password and certificate lifetimes capped | The application management policy | ScubaGear report; VK-NPI-02 | [Book 17, Ch. 06](../b17-ai-identity/06-credentials-and-least-privilege.md#enforcing-the-order) |
| CISA SCuBA MS.AAD.9.1v1, risky AI agents blocked: marked as a BOD 25-01 requirement in ScubaGear but not on CISA's Required Configurations page on October 26, 2026 | Recorded per tenant now; enforced when the agent risk condition is generally available in the agency's cloud | ScubaGear result | [Book 17, Ch. 06](../b17-ai-identity/06-credentials-and-least-privilege.md#enforcing-the-order) |

: Evidence for the non-person identity track {.striped .hover}

Run the checks on the continuous monitoring cadence and file their output with the date, the tenant and the check version. The scheduled drift comparison in [Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md#git-based-drift-detection) is where a regression shows up as an issue.

## Rollback

| Step | Rollback |
|---|---|
| 1 Inventory | Nothing to roll back: read-only |
| 2 Decision | Re-decide; the record keeps the history |
| 3 Credential rules | Per-application policy exception with an end date, in the exception register |
| 4 Least privilege | Workload identity policy back to report-only; a removed grant restored through approval from the Step 1 export |
| 5 Conversion | Re-enable the legacy account and revert the application's configuration (Book 02 Phase 4) |
| 6 Decommission | Reactivate the app registration or re-enable the service principal; restore a deleted object within 30 days, then re-create its Conditional Access assignments |

: Rollback by step {.striped .hover}

## Checklist

- [ ] CMDB named as this track's source of truth; record fields agreed
- [ ] Every non-person identity inventoried and joined to a record with two owners and a federal sponsor (VK-NPI-01, 06, 07, 08)
- [ ] A target and date for each; high-risk accounts in the first wave
- [ ] Application management policy on: no new secrets, certificates capped at 180 days; certificates in a vault with renewal uploaded (VK-NPI-02, 03)
- [ ] High-privilege grants justified or removed; Tier 1 single-tenant service principals assigned directly to workload identity policies (VK-NPI-04, 05)
- [ ] Parallel run complete; legacy accounts disabled, not deleted
- [ ] Owner change in the HR mover and leaver workflows; orphan check weekly; disable before delete
- [ ] ScubaGear MS.AAD.5.x results filed with the evidence

## Back to the books

[Attribute-Driven Migration guide](attribute-driven-migration.md#non-person-identity-track) · [Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md#modernizing-service-accounts) · [Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md#phase-4-service-account-modernization) · [Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md) · [Book 04, Chapter 06](../b04-access/06-who-decides-access.md) · [Book 06](../b06-data-platform/index.md) · [Book 17](../b17-ai-identity/index.md) · [Ansible guide: the controller as a non-person identity](ansible-configuration-automation.md#credentials-and-the-controllers-identity)

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

**Version 1.2**, in [edition 2026.11.1](../../about/archive.md#edition-2026-11-1) (November 1, 2026). Every edition is kept on the [Archive](../../about/archive.md) page; every change between editions is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/guides/non-person-identity-implementation.md).

| Version | Edition | Date | Changes |
|---|---|---|---|
| 1.2 | [2026.11.1](../../about/archive.md#edition-2026-11-1) | 2026-11-01 | Edition 2026.11: record the edition, and publish the four gate-level decks and videos ([#282](https://github.com/WhalerMike/modernization-workbook/pull/282)) |
| 1.1 | [2026.11](../../about/archive.md#edition-2026-11) | 2026-11-01 | Move the decks and narration audio out of git, onto edition 2026.10 ([#260](https://github.com/WhalerMike/modernization-workbook/pull/260)); Retire Research: move each page to a home by type (guides, training, reference, evaluations, explainers) ([#269](https://github.com/WhalerMike/modernization-workbook/pull/269)) |
| 1.0 | [2026.10](../../about/archive.md#edition-2026-10) | 2026-10-31 | First edition (2 merged changes since the guide began) |

: Versions of this guide, newest first {.striped .hover}

<!-- revisions:end -->

[^npi-amp]: Microsoft Learn, "Configure restrictions on how applications can be configured" (application management policies; Security Administrator plus Cloud Application Administrator or Application Administrator), <https://learn.microsoft.com/entra/identity/enterprise-apps/configure-app-management-policies> (accessed Oct 29, 2026, as verified for the [companion guide](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/books/guides/_verification/attribute-driven-migration.md)).
[^npi-wid-faq]: Microsoft Learn, "Frequently asked questions about Microsoft Entra Workload ID," sections "What are Workload ID Premium features, and which are free?," "How many licenses do I need?" and "Can I get a free trial of Workload ID Premium?," <https://learn.microsoft.com/entra/workload-id/workload-identities-faqs> (accessed Oct 29, 2026).
[^npi-pim-review]: Microsoft Learn, "Create an access review of Azure resource and Microsoft Entra roles in PIM," Prerequisites (Privileged Role Administrator to create reviews of Entra roles; service principal reviews need Workload ID Premium plus Entra ID P2 or ID Governance), <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-create-roles-and-resource-roles-review> (accessed Oct 29, 2026).
[^npi-sptype]: Microsoft Learn, Microsoft Graph `servicePrincipal` properties, `servicePrincipalType` (Application, ManagedIdentity, Legacy, ServiceIdentity for an agent identity, SocialIdp), <https://learn.microsoft.com/graph/templates/bicep/reference/serviceprincipals?view=graph-bicep-1.0> (accessed Oct 29, 2026).
[^npi-mi-find]: Microsoft Learn, "Securing managed identities in Microsoft Entra ID," "Find managed identity service principals in Microsoft Entra ID," <https://learn.microsoft.com/entra/architecture/service-accounts-managed-identities> (accessed Oct 29, 2026).
[^npi-mi-faq]: Microsoft Learn, "Managed identities for Azure resources frequently asked questions," "Do managed identities have a backing app object?," <https://learn.microsoft.com/entra/identity/managed-identities-azure-resources/managed-identities-faq> (accessed Oct 29, 2026).
[^npi-rbac-wid]: Microsoft Learn, "Overview of role-based access control in Microsoft Entra ID," "Govern access for workload identities" (custom security attributes for a filterable inventory and ABAC; PIM access reviews of service principals; app instance property lock), <https://learn.microsoft.com/entra/identity/role-based-access-control/custom-overview> (accessed Oct 29, 2026).
[^npi-kds]: Microsoft Learn, "Create a Key Distribution Service (KDS) root key" (domain controllers wait up to 10 hours before allowing gMSA creation), <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/create-the-key-distribution-services-kds-root-key> (accessed Oct 29, 2026).
[^npi-gmsa-secure]: Microsoft Learn, "Secure group managed service accounts" (240-byte random passwords changed every 30 days; use gMSAs for on-premises services unless unsupported; test before production), <https://learn.microsoft.com/entra/architecture/service-accounts-group-managed> (accessed Oct 29, 2026).
[^npi-svc-pw]: Microsoft Learn, "Service accounts," "Password policy for service accounts" (default 30-day interval, settable only at creation through `ManagedPasswordIntervalInDays`; dMSA secret derived from the machine account), <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/understand-service-accounts> (accessed Oct 29, 2026).
[^npi-kv-rotate]: Microsoft Learn, "Tutorial: Configure certificate autorotation in Key Vault," "Update certificate lifecycle attributes" (autorotation through partnered CAs DigiCert and GlobalSign; doesn't apply to non-partnered CAs; email-only lifetime action; default 12-month validity, renewal at 80 percent), <https://learn.microsoft.com/azure/key-vault/certificates/tutorial-rotate-certificates> (accessed Oct 29, 2026).
[^npi-sql-rotate]: Microsoft Learn, "Rotate certificates" (SQL Server enabled by Azure Arc: upload the new certificate to the app registration; delete the old one after 24 hours), <https://learn.microsoft.com/sql/sql-server/azure-arc/rotate-certificates?view=sql-server-ver17> (accessed Oct 29, 2026).
[^npi-delegate-task]: Microsoft Learn, "Least privileged roles by task in Microsoft Entra ID," "Enterprise applications least privileged roles," note on consenting to Microsoft Graph application permissions, <https://learn.microsoft.com/entra/identity/role-based-access-control/delegate-by-task> (accessed Oct 29, 2026).
[^npi-privileged]: Microsoft Learn, "Privileged roles and permissions in Microsoft Entra ID (preview)," "Which roles and permissions are privileged?" and "Isolate privileged intermediaries as control plane assets," <https://learn.microsoft.com/entra/identity/role-based-access-control/privileged-roles-permissions> (accessed Oct 29, 2026).
[^npi-sp-activity]: Microsoft Learn, "What is the Usage and insights report in Microsoft Entra ID?," "Service principal sign-in activity (preview)," <https://learn.microsoft.com/entra/identity/monitoring-health/concept-usage-insights-report>; and "List servicePrincipalSignInActivities" (beta; national cloud table; `AuditLog.Read.All`), <https://learn.microsoft.com/graph/api/reportroot-list-serviceprincipalsigninactivities?view=graph-rest-beta> (both accessed Oct 29, 2026).
[^npi-deactivate]: Microsoft Learn, "Deactivate an app registration" (prerequisites; immediate effects; existing tokens remain valid; remove owners to prevent reactivation; comparison with disable sign-in and delete; audit entry), <https://learn.microsoft.com/entra/identity/enterprise-apps/deactivate-app-registration> (accessed Oct 29, 2026).
[^npi-restore-app]: Microsoft Learn, "Restore or remove a recently deleted application with the Microsoft identity platform," <https://learn.microsoft.com/entra/identity-platform/howto-restore-app> (accessed Oct 29, 2026).
[^npi-recover]: Microsoft Learn, "Recover from deletions," "Hard deletions" (multitenant application objects not hard-deleted automatically after 30 days), <https://learn.microsoft.com/entra/architecture/recover-from-deletions> (accessed Oct 29, 2026).
[^npi-restore-sp]: Microsoft Learn, "Restore a soft deleted enterprise application" (30-day window; previous policies such as Conditional Access not restored; soft-deleted managed identity service principals can't be recovered by customers), <https://learn.microsoft.com/entra/identity/enterprise-apps/restore-application> (accessed Oct 29, 2026).
