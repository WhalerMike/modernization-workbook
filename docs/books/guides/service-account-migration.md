---
title: "Service Accounts: From User Accounts to gMSAs to Microsoft Entra Workload Identities"
description: "A comparison and migration guide for every kind of service identity, on premises and in the cloud: a user account used as a service, a standalone MSA, a group managed service account (gMSA), a Windows Server 2025 delegated managed service account (dMSA), virtual and computer accounts, a Microsoft Entra app registration with a certificate, system- and user-assigned managed identities (including an Azure Arc-enabled server's), workload identity federation and agent identities. One comparison table, a decision path that lines up with the Non-Person Identity track's dispositions, and three migrations with Microsoft Learn's own commands: a user service account to a gMSA, a user service account to a dMSA, and an on-premises account to a Microsoft Entra workload identity when the workload moves or gains a cloud path. Each step carries its federal requirements and KSIs, the evidence the ISSO keeps, its dangers and its rollback; the scripted versions are the Non-Person Identity kit's."
doc-type: workbook-guide
audience: [Technical, Customer]
family: guides
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
research-status: draft
research-type: implementation guide
research-book: "Book 02"
review-status: pending
last-reviewed: 2026-11-09
---
# Service Accounts: From User Accounts to gMSAs to Microsoft Entra Workload Identities

*A service account's password is the one nobody changes, because changing it breaks something; every step in this guide replaces a password someone has to keep with a credential Windows or Microsoft Entra ID keeps instead.*

::: {.callout-note}
## In this guide
How to compare every kind of service identity the program will meet, choose a target for each workload, and move it there. First, how to read the guide and where its facts come from. Then a comparison of eleven kinds of service identity, on premises and in Microsoft Entra ID, and a decision path that lines up with the Non-Person Identity track's dispositions. Then three migrations, each step with Microsoft Learn's own commands: a user account used as a service to a group managed service account (gMSA), the same account to a Windows Server 2025 delegated managed service account (dMSA), and an on-premises account to a Microsoft Entra workload identity once the workload moves or gains a cloud path. Then how a workload that runs as a gMSA sends mail, on premises and to Exchange Online. Then the special cases Learn documents (containers, Microsoft Entra Domain Services, the sync agents, SQL Server, AD FS), the federal requirements and evidence for each step, dangers, rollback, a checklist and what couldn't be verified. The scripted, reviewed versions of the same work are the Non-Person Identity kit's; this guide points to them rather than repeating them.
:::

::: {.callout-tip}
## Watch, present or train
**Narrated deck (about 16 minutes, captions)**: the problem, the kinds compared, the decision path, the three migrations, what can't move, the requirements and the dangers, as a Why / What / Who / How deck, on the [Presentations](../../presentations/index.md#guide-service-account-migration) page, or [▶ watch it in the browser](../../presentations/watch.html?v=Guide_Service_Account_Migration_Narrated). **Training:** [Module 12: Migrate a service account](../../training/non-person-identity/12-service-account-migration.md) of the Non-Person Identity learning path teaches this guide with a lab on the kit's fixtures and a knowledge check. **Background video:** [Windows 2012 Active Directory Domain Services Videos (2)](https://learn.microsoft.com/en-us/archive/blogs/nepapfe/windows-2012-active-directory-domain-services-videos-2), Part 3 of a Microsoft premier field engineer's video series on Active Directory in Windows Server 2012, covers group managed service accounts. It's an archived 2014 post on Microsoft Learn, recorded on Windows Server 2012, so its screens and versions are older than the program's Windows Server 2019 minimum; where it differs from this guide, the guide's current Learn pages win.
:::

## How to read this guide

**Where this guide sits.** The [Non-Person Identity implementation guide](non-person-identity-implementation.md) runs the whole track as gates, and its developer workbook does the work as reviewed code: [Chapter 03](../../project-plans/developer-workbooks/non-person-identity/03-the-migration-path-matrix-as-code.md) records each account's disposition, [Chapter 05](../../project-plans/developer-workbooks/non-person-identity/05-workload-identity-federation-and-managed-identities.md) moves workloads to managed identities and federated credentials, and [Chapter 06](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md) moves Kerberos accounts to gMSAs and dMSAs. [Book 02, Chapter 08](../b02-identity/08-assessing-the-forest.md#service-accounts) inventories the forest's service accounts and [Chapter 09](../b02-identity/09-building-the-entra-target.md#the-migration-path-matrix) gives the migration path matrix. This guide is the one page that compares the kinds side by side and walks one account through each migration by hand, with Learn's commands, so an engineer can see what the code does before running it. Where the kit does a step, the step says so and links to it.

**Where the facts come from.** Every fact and command was read on Microsoft Learn on November 9, 2026, through the Microsoft Learn documentation service and, for the Windows Server pages, from their source in MicrosoftDocs/windowsserverdocs at commit `2205ce8` (October 30, 2026). The pages and their dates are in the [verification log](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/books/guides/_verification/service-account-migration.md). Facts the books already verified are cited by link to the chapter that holds them. Where Learn's pages differ from each other, the guide says so and follows the stricter reading. Rules that are the program's, not Microsoft's, are marked *(design guidance)*.

**The program's assumptions.** The workbook plans on Windows Server 2016 being gone from production by its January 12, 2027 end of support, with Windows Server 2019 as the minimum; a 2016 server that remains is an exception ([Book 00, Chapter 01](../b00-orientation/01-why-modernize-now.md#the-workbooks-server-standard)). That is the program's assumption, not a fact about any estate: check it against the inventory before relying on it. A dMSA needs Windows Server 2025 on every host that uses it and on at least one domain controller, so the dMSA path is available only where that holds.

**The placeholders.** The commands are exact; replace these values once, everywhere:

| Placeholder | What it is |
|---|---|
| `<DOMAIN>`, `<domain-fqdn>` | The domain's NetBIOS name and DNS name |
| `<old-account>`, `<old-account-dn>` | The user account used as a service: its `sAMAccountName` and its distinguished name |
| `<gmsa-name>` | The new gMSA's name, without the trailing `$`; unique in the forest |
| `<hosts-group>` | The security group whose members may retrieve the gMSA's password |
| `<host>` | A host's computer name, without the trailing `$` |
| `<service>` | The Windows service's name, as `sc.exe` knows it |
| `<task-path>`, `<task-name>` | The scheduled task's folder and name |
| `<app-pool>` | The IIS application pool's name |
| `<spn>` | One service principal name the old account holds, such as `HTTP/app01.contoso.example` |
| `<dmsa-name>` | The new dMSA's name, without the trailing `$` |
| `<tenant-id>`, `<subscription-id>`, `<resource-group>`, `<location>` | The Entra tenant, Azure subscription, resource group and region |
| `<identity-name>`, `<principal-id>` | A user-assigned managed identity's name, and the object ID of a managed identity's service principal |
| `<role>`, `<scope>` | An Azure built-in role and the narrowest resource ID that serves the workload |
| `<graph-permission>` | One Microsoft Graph application permission, such as `User.Read.All` |
| `<arc-server>` | The Azure Arc-enabled server's resource name (its managed identity has the same name) |
| `<app-name>`, `<app-id>`, `<cert-file>` | An app registration's display name, its application (client) ID, and the public certificate file (`.pem`, `.cer` or `.crt`) |
| `<sp-object-id>`, `<thumbprint>` | The object ID of the app's service principal (Enterprise applications, not App registrations), and the thumbprint of its certificate in the host's store |
| `<shared-mailbox>`, `<other-mailbox>` | The shared mailbox the workload sends as, and any mailbox it must not send as (for the negative test) |
| `<connector-name>`, `<exchange-server-ip>`, `<host-ips>` | A dedicated Exchange Server receive connector's name, the Exchange server address it binds to, and the IP addresses of the workload's hosts |
| `<scope-group>`, `<scope-group-dn>`, `<scope-name>` | The mail-enabled security group that holds only `<shared-mailbox>`, its distinguished name from `Get-Group`, and the Exchange Online management scope's name |
| `<subject>`, `<body>`, `<recipient>` | A test message's subject, text and recipient address |

: Placeholders used in this guide {.striped .hover}

## The kinds of service identity compared {#comparison}

Learn's Entra architecture guidance names four kinds of on-premises service account: gMSAs, standalone managed service accounts (sMSAs), computer accounts and user accounts used as service accounts.[^sam-govern] Windows Server adds the dMSA and the virtual account.[^sam-understand] Microsoft Entra ID adds the workload identities: applications, service principals and managed identities,[^sam-mi-overview] with federated credentials as one way to sign them in, and agent identities for AI agents.[^sam-agent]

| Kind | Where it lives | Who manages the credential | Where it can run | What it authenticates to | Rotation | Kerberoasting exposure | License | US Government clouds | Learn source |
|---|---|---|---|---|---|---|---|---|---|
| User account used as a service | AD user object | An administrator sets and rotates the password by hand, under the domain's password policy | Any domain-joined server | Kerberos and NTLM | Manual; none unless someone does it | High when it holds an SPN ([Book 02, Chapter 08](../b02-identity/08-assessing-the-forest.md#service-accounts)); Learn's dMSA overview names Kerberoasting as the common issue with traditional service accounts | None beyond Windows Server | n/a (AD) | [^sam-understand] [^sam-user] |
| Standalone MSA (sMSA) | AD `msDS-ManagedServiceAccount` | Windows; 240-byte random password | One server; can't be shared or used across domains | Kerberos and NTLM | Every 30 days by default (machine account password policy) | Lower: Learn says the 240-byte random password minimizes brute-force and dictionary attacks | None | n/a (AD) | [^sam-smsa] [^sam-understand] |
| Group MSA (gMSA) | AD `msDS-GroupManagedServiceAccount` | The domain controllers compute it from the KDS root key; authorized hosts retrieve it | Any domain-joined Windows Server host allowed to retrieve it; services, IIS application pools, scheduled tasks; not failover clusters themselves | Kerberos and NTLM | Every 30 days by default; the interval is set only at creation | Lower: the same 240-byte random password; but Learn notes the password isn't bound to a machine and can be stolen | None | n/a (AD) | [^sam-gmsa-manage] [^sam-entra-gmsa] [^sam-dmsa-overview] |
| Delegated MSA (dMSA) | AD, Windows Server 2025 | Windows; a randomized secret derived from the machine account and held only by the domain controller | Only the machines mapped to it; Windows Server 2025 | Kerberos | Periodically, like a gMSA | Designed against it: Learn says a dMSA helps prevent credential harvesting (Kerberoasting) | None | n/a (AD) | [^sam-dmsa-overview] [^sam-understand] |
| Virtual account (`NT SERVICE\<name>`) | Local to one machine | Windows | One server; on the network it acts as the computer account | As the computer account | No password to manage | n/a: no password of its own | None | n/a | [^sam-understand] |
| Computer account (LocalSystem, NetworkService) | AD computer object | Windows | The one computer | Kerberos and NTLM, as `<DOMAIN>\<computer>$` | Windows rotates the machine password | n/a; but you can't tell which service on the computer used it, so you can't audit it | None | n/a | [^sam-onprem] |
| App registration and service principal, certificate credential | Microsoft Entra ID | You: a certificate from a trusted CA, kept in a vault such as Azure Key Vault and renewed | Anywhere that can reach Entra ID | OAuth 2.0 and OpenID Connect to Entra-protected APIs; not Kerberos | At the certificate's renewal; Learn says don't use client secrets | None: no Kerberos | Free; Workload ID Premium for Conditional Access and ID Protection on it | [Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#credentials) | [^sam-app-cred] |
| System-assigned managed identity | Entra ID, tied to one Azure resource | Azure; credentials aren't accessible to you | That one Azure resource; deleted with it | OAuth to any resource that supports Entra authentication | Automatic | None | No extra cost | [Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#managed-identities) | [^sam-mi-overview] |
| User-assigned managed identity | Entra ID, a standalone Azure resource | Azure | Any Azure resource it's assigned to; outlives them and must be deleted explicitly | OAuth to Entra-protected resources | Automatic | None | No extra cost | Same | [^sam-mi-overview] |
| Arc-enabled server's system-assigned managed identity | Entra ID, tied to the Arc server resource | The Connected Machine agent; a 90-day certificate it renews at 45 days | The on-premises or other-cloud server; apps in the local *Hybrid agent extension applications* group can request tokens | OAuth to Azure and to Graph | Automatic while the agent stays connected | None | No extra cost for the identity | [Arc track guide](arc-track-implementation.md) | [^sam-arc-identity] |
| App registration or user-assigned managed identity with a federated credential | Entra ID | The external issuer (GitHub Actions, Kubernetes, another cloud) signs a token Entra ID trusts | Wherever that issuer runs | OAuth through token exchange | No secret to rotate | None | Free | L4 and L5 for the Graph API ([Chapter 05](../../project-plans/developer-workbooks/non-person-identity/05-workload-identity-federation-and-managed-identities.md#verified-facts)) | [^sam-wif] |
| Agent identity (Microsoft Entra Agent ID) | Entra ID, a special service principal created from an agent identity blueprint | The blueprint holds the credentials; the agent identity has none of its own | Where the agent runs | OAuth | The blueprint's credential | None | See [Book 17, Chapter 04](../b17-ai-identity/04-kinds-of-ai-identity.md#release-stage-licensing-and-government-clouds) | Same | [^sam-agent] |

: Every kind of service identity, compared {.striped .hover}

Three things the table makes plain:

- **Nothing in Entra ID speaks Kerberos for a service.** A workload that must authenticate with Kerberos or NTLM to an on-premises resource keeps an AD identity until that resource changes. That is why Chapter 06 ends in a dated island list, not in "converted".
- **A gMSA is a better password, not a different protocol.** Its password is long, random and rotated, but it still exists, any host allowed to retrieve it holds it, and it works only while AD does.[^sam-dmsa-overview] A dMSA binds the secret to the machine.
- **Managed identities are the end state only for workloads on Azure or on an Arc-enabled server.** A managed identity can be assigned only to an Azure resource, or used through an Arc-enabled server's agent ([Book 02, Chapter 08](../b02-identity/08-assessing-the-forest.md#service-accounts)).

## The decision path {#decision-path}

Answer the questions in order; the first "yes" is the target. Each target lines up with a disposition in [Chapter 03](../../project-plans/developer-workbooks/non-person-identity/03-the-migration-path-matrix-as-code.md), the D-NP3 decision the application owner records, and with a row of [Book 02's matrix](../b02-identity/09-building-the-entra-target.md#the-migration-path-matrix).

| # | Question | Target | Chapter 03 disposition |
|---|---|---|---|
| 1 | Is the account disabled, unused, or without an owner after inventory? | Retire it through the decommission process | `Retire` |
| 2 | Does the workload run on an Azure resource, or is it moving to one? | A managed identity, user-assigned preferred | `Replatform` (target managed identity; moved in Chapter 05) |
| 3 | Does it run in CI/CD or on a platform with its own OIDC issuer (GitHub Actions, Kubernetes, another cloud)? | An app registration, or a user-assigned managed identity, with a federated credential | `Replatform` (federated credential; Chapter 05) |
| 4 | Does it stay on premises but call Microsoft Graph or Azure APIs? | The Arc-enabled server's system-assigned managed identity if the host is Arc-enabled; otherwise an app registration with a certificate | `Replatform` (managed identity or app registration; Chapter 05) |
| 5 | Does it stay on premises and need Kerberos, on a domain with a Windows Server 2025 domain controller, with every host that uses the account on Windows Server 2025 and no unconstrained delegation? | A dMSA, migrated from the old account | `Replatform` (dMSA; Chapter 06) |
| 6 | Does it stay on premises and need Kerberos, otherwise? | A gMSA; an MSA is upgraded to a gMSA first, because an MSA or gMSA can't be migrated to a dMSA | `Replatform` (gMSA; Chapter 06) |
| 7 | Is it already a gMSA or dMSA and staying on premises? | Keep it, with an SPN owner where it has SPNs and an end date no later than program G5 | `Keep` |
| 8 | Must it stay a traditional account (the service supports no managed account, or it relies on unconstrained delegation)? | Keep it on Kerberos with the authorizing official's acceptance, an SPN owner and an end date no later than D08 | `KeepKerberos` |
| 9 | Does it need Kerberos to a resource with no Entra equivalent? | Stays on the Kerberos island until that resource is retired or replatformed | `Keep` or `KeepKerberos`, on the island list |

: Which target for which workload {.striped .hover}

Where the program's matrix and Learn's guidance line up: Learn says to use gMSAs for on-premises services unless a service, such as failover clustering, doesn't support them, then an sMSA, then a user account,[^sam-entra-gmsa] and to consider moving services to Azure and their accounts to Entra ID.[^sam-user] A gMSA serving a hybrid workload keeps its gMSA for Kerberos and gets a cloud identity for the cloud calls; on an Arc-enabled host the gMSA can request the Arc identity's tokens (step C2). An sMSA has no row of its own in the matrix: Learn says a gMSA can be used on one server too,[^sam-onprem] so the program moves sMSAs to gMSAs *(design guidance, from Book 02's matrix)*.

## The program's rules for every migration {#rules}

These are the track's rules, carried here so a hand migration follows them too:

- **Two named owners and a sponsor.** Every identity has two named technical owners and a sponsor who is a federal employee mastered in HR; a contractor can build or run a workload but can't be its only sponsor ([Non-Person Identity guide, Step 1f](non-person-identity-implementation.md#step-1-inventory-every-non-person-identity)).
- **A reviewed disposition first.** No account moves without its Chapter 03 disposition.
- **A 30-day parallel run, then disable; never delete during the migration.** The old account is disabled, at most, after 30 days, and deleted only later through the decommission process ([Non-Person Identity guide, Step 5](non-person-identity-implementation.md#step-5-convert-with-a-parallel-run) and [Step 6](non-person-identity-implementation.md#step-6-run-the-lifecycle)). Learn's Entra page ends its move to a gMSA by deleting the old account,[^sam-entra-gmsa] and its dMSA page says never to delete the original;[^sam-dmsa-setup] the program follows the stricter reading.
- **No client secrets.** A cloud identity is a managed identity, a federated credential or a certificate, in that order ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#credentials)); Learn says don't use password credentials.[^sam-app-cred]
- **No privileged groups.** Learn says service accounts shouldn't be members of privileged groups, and each service should have its own account.[^sam-onprem] A gMSA in a privileged group is a finding (Chapter 06's NPI-KRB-08).
- **Changes are reviewed.** In production, the AD writes go through Chapter 06's write path and the Entra and Azure writes through Chapter 05's, each a plan approved by its SHA-256. The commands below are what those plans send; run them by hand only in a test domain or under an approved change record.

## Migration A: a user account to a gMSA {#migration-a}

The scripted version is [Chapter 06](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md): it plans `CreateGmsa`, waits for the host change and the 30 days, then plans `DisableSuperseded`. Learn's own order for the move is: KDS root key, create the gMSA, install it on the hosts, change the service identity, specify a blank password, validate, retire the old identity.[^sam-entra-gmsa]

### A1. Inventory the account, its SPNs and where it runs

Learn's criteria for finding user accounts used as services are an SPN, delegation and a password that never expires.[^sam-user] In the program, Book 02's `Get-FMPServiceAccountInventory` and Chapter 01's register do this for the whole forest; for the one account in hand, read it with Learn's commands:

```powershell
Get-ADUser -Identity <old-account> -Properties ServicePrincipalName, PasswordNeverExpires, PasswordLastSet, MemberOf, msDS-AllowedToDelegateTo, TrustedForDelegation, TrustedToAuthForDelegation
```

On each host where the account runs a service, read the service's logon account:

```powershell
sc.exe qc <service>
```

**Expected:** `SERVICE_START_NAME` is `<DOMAIN>\<old-account>`.[^sam-sql-gmsa] Record every host, every service, application pool and task that uses the account, every SPN, and every group it's a member of. A membership in a privileged group is fixed by granting the gMSA only the rights the service needs, never by copying the membership.[^sam-entra-gmsa]

### A2. Make sure there is a KDS root key, and that it's old enough

A gMSA needs one KDS root key in the forest. The domain controllers wait up to 10 hours from its creation before they allow a gMSA to be created, so that the key replicates first.[^sam-kds] Check for one:

```powershell
Get-KdsRootKey
```

`Get-KdsRootKey` returns each root key's value as well as its identifier ([Chapter 06](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md#what-it-leaves-to-you)); run it only as the Domain Admin or Enterprise Admin who would create the key anyway. Chapter 06's check reads the key's start time only, with a delegated read.

If none exists, a Domain Admin or Enterprise Admin creates one, once per forest, on a Windows Server domain controller, then waits 10 hours before creating any gMSA:[^sam-kds]

```powershell
Add-KdsRootKey -EffectiveImmediately
```

Confirm the key with the KDS service's Event ID 4004:[^sam-gmsa-manage]

```powershell
Get-WinEvent -LogName 'Microsoft-Windows-KdsSvc/Operational' | Where-Object Id -eq 4004 | Select-Object -First 1 TimeCreated, Id, Message
```

Learn's KDS page offers a key backdated 10 hours (`Add-KdsRootKey -EffectiveTime ((get-date).addhours(-10))`) for test environments with only one domain controller;[^sam-kds] the containers page says not to use it in production.[^sam-containers] Never use it in production. Create only one root key per forest: Learn's containers page says more than one makes gMSAs start failing after a password rotation,[^sam-containers] and its KDS page says a deleted and re-created key can stay cached, so the KDC has to be restarted on every domain controller.[^sam-kds] Chapter 06's code never creates a key.

### A3. Create the gMSA

Before you create it:

- **The name is unique in the forest,** not just the domain; a duplicate fails even in another domain.[^sam-gmsa-manage]
- **The password interval is set only now.** It defaults to 30 days and can't be changed later; to change it, create a new gMSA.[^sam-gmsa-manage] [^sam-understand]
- **Who creates it.** Domain Admins, or an account delegated the right to create `msDS-GroupManagedServiceAccount` objects; Account Operators can't by default.[^sam-gmsa-manage] [^sam-containers] The program uses the delegated right, not Domain Admins: a program decision, settled as [WD-154](../../about/decision-register.md#wd-154) ([below](#questions)). Chapter 06's write path today still names either; until it names the delegated group, run it under an account that holds only the delegated right.
- **Retrievers are a group.** Learn recommends a security group of the hosts; the hosts in it are the gMSA's blast radius.[^sam-gmsa-manage]

Create the hosts' group and add the hosts, as Learn's containers page does:[^sam-containers]

```powershell
New-ADGroup -Name "<hosts-group>" -SamAccountName "<hosts-group>" -GroupScope DomainLocal
Add-ADGroupMember -Identity "<hosts-group>" -Members "<host>$"
```

For a workload that holds an SPN, create the gMSA with AES only, which the overview says to always configure for managed service accounts:[^sam-gmsa-overview]

```powershell
New-ADServiceAccount -Name <gmsa-name> -DNSHostName <gmsa-name>.<domain-fqdn> -PrincipalsAllowedToRetrieveManagedPassword <hosts-group> -KerberosEncryptionType AES256
```

For a workload that holds no SPN, the program's default is Learn's outbound-only variant, which restricts the gMSA to outbound authentication (here with the default 30 days, stated); record the choice in `kerberos-replatform.csv`. This is a program decision, settled as [WD-154](../../about/decision-register.md#wd-154); a no-SPN gMSA created without the restriction needs a recorded reason, such as a service that something authenticates to without an SPN of its own:[^sam-gmsa-manage]

```powershell
New-ADServiceAccount -Name <gmsa-name> -DNSHostName <gmsa-name>.<domain-fqdn> -RestrictToOutboundAuthenticationOnly -ManagedPasswordIntervalInDays 30 -PrincipalsAllowedToRetrieveManagedPassword <hosts-group> -KerberosEncryptionType AES256
```

Read it back:[^sam-gmsa-manage]

```powershell
Get-ADServiceAccount -Identity "<gmsa-name>" -Properties PrincipalsAllowedToRetrieveManagedPassword, KerberosEncryptionType, msDS-ManagedPasswordInterval | Select-Object Name, ObjectClass, PrincipalsAllowedToRetrieveManagedPassword, KerberosEncryptionType, msDS-ManagedPasswordInterval
```

**Expected:** `ObjectClass` `msDS-GroupManagedServiceAccount`, the hosts' group as the retriever, `AES256`, and `30`.

### A4. Install and test it on each host

A host picks up its new group membership after a restart.[^sam-containers] Then, on each host, in an elevated PowerShell session, install the gMSA and test that the host can retrieve its password:[^sam-gmsa-manage] [^sam-sql-gmsa]

```powershell
Install-ADServiceAccount -Identity <gmsa-name>
Test-ADServiceAccount -Identity <gmsa-name>
```

**Expected:** `True` on every host that will run the service. `False` means the host isn't an allowed retriever, its group membership isn't current, or it doesn't support the account's Kerberos encryption types;[^sam-gmsa-manage] fix that before going on.

### A5. Switch the workload, and move the SPNs

Do this in one change window, because an SPN left on the old account while the service runs as the gMSA breaks Kerberos to the service: each SPN must have exactly one owner ([Book 02, Chapter 11](../b02-identity/11-reference-deployment.md)).

Move each SPN from the old account to the gMSA, removing it first:[^sam-set-adsa] [^sam-set-aduser]

```powershell
Set-ADUser -Identity <old-account> -ServicePrincipalNames @{Remove='<spn>'}
Set-ADServiceAccount -Identity <gmsa-name> -ServicePrincipalNames @{Add='<spn>'}
setspn -L <DOMAIN>\<gmsa-name>$
```

**Expected:** `setspn -L` lists `<spn>` on the gMSA.[^sam-sql-spn]

Then change the workload's identity. A gMSA logs on with a blank password, which Windows fills in.[^sam-entra-gmsa]

A Windows service, through the Service Control Manager:[^sam-sc-config]

```powershell
sc.exe config <service> obj= "<DOMAIN>\<gmsa-name>$" password= ""
sc.exe qmanagedaccount <service>
Restart-Service -Name <service>
```

**Expected:** `qmanagedaccount` reports `TRUE`, and the service starts.[^sam-sql-gmsa]

A scheduled task, as Learn's assessment pages change one:[^sam-task]

```powershell
$Principal = New-ScheduledTaskPrincipal -UserId <DOMAIN>\<gmsa-name>$ -LogonType Password
Set-ScheduledTask -TaskPath <task-path> -TaskName <task-name> -Principal $Principal
```

An IIS application pool, with Learn's IIS PowerShell sample and the blank password:[^sam-iis] [^sam-entra-gmsa]

```powershell
Import-Module WebAdministration
$pool = Get-Item IIS:\AppPools\<app-pool>
$pool.processModel.userName = "<DOMAIN>\<gmsa-name>$"
$pool.processModel.password = ""
$pool.processModel.identityType = 3
$pool | Set-Item
```

Grant the gMSA the rights the old account had on files, databases and shares, and nothing more; Learn says to grant the gMSA the rights its service requires, and to review sensitive access.[^sam-entra-gmsa]

### A6. Verify, and run in parallel for 30 days

Test the application end to end. Learn says to validate that the service works under the gMSA before retiring the old identity, and to test with gMSAs before production.[^sam-entra-gmsa] For 30 days, keep the old account enabled and watch both: the old account's logons on the domain controllers should stop; the gMSA's should carry the work. Record the date the hosts changed (`HostChangedOn` in Chapter 06's `kerberos-replatform.csv`).

### A7. Disable the old account, and retire it later

After a clean 30 days, disable the old account and move it to the holding OU; don't delete it now:

```powershell
Disable-ADAccount -Identity <old-account>
```

Chapter 06 plans this as `DisableSuperseded`. Deletion comes after the decommission process's observation window, with its SPN and LDAP-bind dependencies checked first ([Non-Person Identity guide, Step 6](non-person-identity-implementation.md#step-6-run-the-lifecycle)). Learn's own deprovisioning order is the same shape: remove permissions, check related sign-ins, prevent sign-in, wait under a business policy for how long accounts stay disabled, then delete.[^sam-govern] The program's wait is its decommission rule.

**Rollback (A).** Before A7: switch the workload back to the old account with the old password from the vault, move the SPNs back with the same two commands reversed, and leave the gMSA in place. After A7: `Enable-ADAccount -Identity <old-account>`, then the same.

## Migration B: a user account to a dMSA (Windows Server 2025) {#migration-b}

A dMSA supersedes the old account: once the migration completes, the old account's password can't be used, its SPNs, delegation and authentication policy move to the dMSA, and the old account is disabled.[^sam-dmsa-overview] The scripted version is Chapter 06's `CreateDmsa`, `StartDmsaMigration` and `CompleteDmsaMigration`, with its checks of every limit below (NPI-KRB-04).

**Before you start, check Learn's limits:**[^sam-dmsa-overview] [^sam-dmsa-setup]

- At least one Windows Server 2025 domain controller that the host can discover, a read-write domain controller for the migration, and every machine that uses the account updated to support dMSA; a machine that doesn't fails authentication once the old account is disabled. Extending the schema alone isn't enough.[^sam-dmsa-faq] Learn names no functional level for dMSA, so the domain and forest can stay at Windows Server 2016 while older domain controllers remain ([Book 02, Chapter 08](../b02-identity/08-assessing-the-forest.md#running-old-and-new-domain-controllers-side-by-side)).
- You can't migrate an MSA or a gMSA to a dMSA: those go to a gMSA (Migration A) or stay. Each dMSA supersedes one account.
- Unconstrained delegation stops working once the migration completes, and on a host where Credential Guard protects the dMSA.
- A KDS root key (A2).
- Domain Admins or Enterprise Admins, or equivalent rights, to create or migrate to a dMSA.
- Every Windows Server 2025 domain controller has the August 2025 update or later (see [Who may create a dMSA](#sam-dmsa-create-right)).
- The old account has AES keys (B0).

### Who may create a dMSA {#sam-dmsa-create-right}

In May 2025, researchers published an attack they called BadSuccessor. Anyone who could create a dMSA, or write its attributes, could point it at any account, Domain Admins included, and the KDC would treat the dMSA as that account's successor without a real migration. Any domain with one Windows Server 2025 domain controller was exposed, whether or not it used dMSAs.[^sam-badsuccessor] Microsoft fixed it as CVE-2025-53779 in the August 12, 2025 updates (KB5063878, and the hotpatch KB5064010), for Windows Server 2025 only. Its FAQ says the attacker needs write access to two dMSA attributes, `msDS-groupMSAMembership` and `msDS-ManagedAccountPrecededByLink`, and that success "could gain domain administrator privileges."[^sam-cve-53779]

Learn gives no guidance on delegating the right to create dMSAs beyond its create step's "Domain Admins or Enterprise Admins, or equivalent AD permissions."[^sam-dmsa-setup] The program treats that right as Tier 0 *(design guidance)*:

- Install the August 2025 update or later on every Windows Server 2025 domain controller before the first one is promoted into production.
- dMSAs are created and migrated by Domain Admins only, as the program decided for dMSA steps ([WD-154](../../about/decision-register.md#wd-154)); the delegated create right for gMSAs doesn't extend to dMSAs.
- Review who holds create-child rights on each OU, including generic "create all child objects," because that right also creates a dMSA.[^sam-badsuccessor] The researchers publish a script for this; it isn't Microsoft's, so run it in the test domain first.
- Audit writes to `msDS-ManagedAccountPrecededByLink` and the creation of `msDS-DelegatedManagedServiceAccount` objects with directory service change auditing (events 5136 and 5137). That pairing comes from the researchers, not from Learn.[^sam-badsuccessor]

### B0. Check that the old account has AES keys

Since the April 14, 2026 updates, domain controllers assume AES only for an account with no `msDS-SupportedEncryptionTypes` value, and since the July 2026 updates the rollback setting is gone ([Book 02, Chapter 03](../b02-identity/03-ad-and-entra-side-by-side.md#where-the-old-protocols-stand-in-2026)).[^sam-kb5073381] The accounts a dMSA replaces are the ones most likely to have a password older than their domain's AES keys. Learn doesn't say whether a dMSA migration repairs an account with no AES keys, and it says not to reset the password during the migration.[^sam-dmsa-faq] So check before B1, on each domain controller:

```powershell
Get-WinEvent -FilterHashtable @{ LogName = 'System'; Id = 202, 204, 207, 209 } -MaxEvents 500 |
    Where-Object { $_.ProviderName -match 'Kdc|Key-Distribution' -and $_.Message -match '<old-account>' } |
    Select-Object TimeCreated, Id, Message
```

**Expected:** no events. An event 202 or 207 (warning) or 204 or 209 (error) naming the account means it has no AES keys.[^sam-kb5073381] Microsoft's `List-AccountKeys.ps1` lists the keys each account has.[^sam-rc4-detect] If the account has none, change its password through the service's own change process, which creates the AES keys,[^sam-rc4-detect] then confirm the service gets AES tickets (event 4769 with ticket encryption type 0x12 or 0x11, not 0x17) before you start the migration. Leave the password alone from B2 until the migration completes.

### B1. Create the dMSA

Learn's create step, with AES256:[^sam-dmsa-setup]

```powershell
New-ADServiceAccount -Name <dmsa-name> -DNSHostName <dmsa-name>.<domain-fqdn> -CreateDelegatedServiceAccount -KerberosEncryptionType AES256
```

Learn's standalone set-up then sets `msDS-DelegatedMSAState` to 3 with `Set-ADServiceAccount -Properties`, a parameter the cmdlet doesn't have; for a migration, `Start-ADServiceAccountMigration` sets the state itself, so skip that step ([Chapter 06](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md#what-it-leaves-to-you)).

### B2. Start the migration

```powershell
Start-ADServiceAccountMigration -Identity <dmsa-name> -SupersededAccount "<old-account-dn>"
```

On each host that runs the service, in an elevated session, Learn's registry value, then a restart of the service only (Learn's step restarts every running service on the host; the program restarts only the one that uses the account):[^sam-dmsa-setup]

```powershell
New-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System\Kerberos\Parameters" -Name "DelegatedMSAEnabled" -Value "1" -PropertyType "DWORD" -Force
Restart-Service -Name <service>
```

Read the state:

```powershell
Get-ADServiceAccount -Identity <dmsa-name> -Properties msDS-DelegatedMSAState | Select-Object Name, msDS-DelegatedMSAState
```

**Expected:** `1`, migration started.[^sam-dmsa-overview] Enable the *Microsoft\Windows\Security-Kerberos\Operational* log (disabled by default) and watch events 307 (migration), 308 (a machine adding itself to the retrievers) and 309 (key fetch).[^sam-dmsa-setup]

### B3. Wait, then complete

Learn says to wait at least two ticket lifetimes (14 days) before completing, and recommends four (28 days); delay if domain controllers are partitioned or replication is broken, and watch sites where replication takes longer than the 10-hour ticket renewal.[^sam-dmsa-overview] The program's parallel run is 30 days, which covers four 7-day ticket lifetimes *(design guidance)*. Then:

```powershell
Complete-ADServiceAccountMigration -Identity <dmsa-name> -SupersededAccount "<old-account-dn>"
Get-ADUser -Identity <old-account> -Properties ServicePrincipalName | Select-Object SamAccountName, Enabled, ServicePrincipalName
Get-ADServiceAccount -Identity <dmsa-name> -Properties ServicePrincipalName, msDS-DelegatedMSAState | Select-Object Name, ServicePrincipalName, msDS-DelegatedMSAState
```

**Expected:** the old account `Enabled` `False` with no SPNs; the dMSA holding the SPNs, state `2`.[^sam-dmsa-overview] Never delete the original account: Learn warns that deleting it causes issues if you need to revert.[^sam-dmsa-setup] If the dMSA serves more than one device, update its `PrincipalsAllowedToRetrieveManagedPassword` by hand after the migration ends.[^sam-dmsa-setup]

**Rollback (B).** Before completing, or for the wrong account, Learn's undo; to return the account to an unlinked state, its reset:[^sam-dmsa-setup]

```powershell
Undo-ADServiceAccountMigration -Identity <dmsa-name> -SupersededAccount "<old-account-dn>"
```

```powershell
Reset-ADServiceAccountMigration -Identity <dmsa-name> -SupersededAccount "<old-account-dn>"
```

After an undo, `Enable-ADAccount -Identity <old-account>` if the account was disabled. Chapter 06's code never runs undo or reset; a back-out is a person's step under the change record.

## Migration C: from AD to a Microsoft Entra workload identity {#migration-c}

This step starts when the workload moves to Azure, or gains a call to Graph or an Azure API, and only for what it reaches with OAuth. What it still reaches with Kerberos keeps its gMSA or dMSA until that resource changes. The scripted version is [Chapter 05](../../project-plans/developer-workbooks/non-person-identity/05-workload-identity-federation-and-managed-identities.md) for the identity and its credential, and [Chapter 07](../../project-plans/developer-workbooks/non-person-identity/07-least-privilege-for-service-principals.md) for its permissions.

Learn's order of preference for an app's credential: a managed identity whenever possible; an identity from a platform that manages its own credentials (federation) where the app doesn't run on Azure; otherwise a certificate from a trusted CA, kept in a vault; never a password credential (secret).[^sam-app-cred]

### C1. The workload moves to Azure: a user-assigned managed identity

Create the identity and read its service principal's object ID:[^sam-mi-cli]

```bash
az identity create --resource-group <resource-group> --name <identity-name> --location <location>
az identity show --resource-group <resource-group> --name <identity-name> --query principalId --output tsv
```

Grant it the narrowest Azure role at the narrowest scope:[^sam-mi-cli]

```bash
az role assignment create --assignee-object-id <principal-id> --assignee-principal-type ServicePrincipal --role "<role>" --scope <scope>
```

Assign the identity to the Azure resource that runs the workload, then change the application to acquire tokens with the Azure Identity library or MSAL, which needs no secret.[^sam-mi-overview] A user-assigned identity outlives its resources and must be deleted explicitly, so it needs an owner like any other identity ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#managed-identities)).

### C2. The workload stays on an Arc-enabled server: its system-assigned identity {#sam-c2}

Every Arc-enabled server has a system-assigned managed identity with the server's name.[^sam-arc-identity] Only local Administrators and members of the *Hybrid agent extension applications* group can request its tokens; to let a service that runs as a gMSA use it, add the gMSA to that group on the host (as [Book 10, Appendix B](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md) does):[^sam-arc-identity]

```powershell
Add-LocalGroupMember -Group 'Hybrid agent extension applications' -Member '<DOMAIN>\<gmsa-name>$'
```

Grant a Microsoft Graph application permission to the Arc identity, as Learn's SQL Server enabled by Azure Arc page does (a Privileged Role Administrator signs in):[^sam-arc-graph]

```powershell
Connect-MgGraph -TenantId <tenant-id> -Scopes 'AppRoleAssignment.ReadWrite.All','Application.Read.All'
$graphSP = Get-MgServicePrincipal -Filter "appId eq '00000003-0000-0000-c000-000000000000'"
$mi = Get-MgServicePrincipal -Filter "displayName eq '<arc-server>'"
$appRole = $graphSP.AppRoles | Where-Object { $_.Value -eq '<graph-permission>' -and $_.AllowedMemberTypes -contains 'Application' }
New-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $mi.Id -PrincipalId $mi.Id -ResourceId $graphSP.Id -AppRoleId $appRole.Id
```

For an Azure role, use C1's `az role assignment create` with `$mi.Id` as `<principal-id>`. If the identity's credential is suspected compromised, disconnect and reconnect the agent, which removes the Arc resource and its identity and creates new ones.[^sam-arc-identity]

### C3. The workload stays on a host with no Arc agent: an app registration with a certificate {#sam-c3}

Create the app and its service principal, then add the certificate's public key; the private key stays on the host or in Azure Key Vault:[^sam-az-ad] [^sam-app-cert]

```bash
az ad app create --display-name "<app-name>" --sign-in-audience AzureADMyOrg --query appId --output tsv
az ad sp create --id <app-id>
az ad app credential reset --id <app-id> --cert @<cert-file> --append
```

Give it two named owners and record its sponsor and `serviceManagementReference` ([Non-Person Identity guide, Step 1f](non-person-identity-implementation.md#step-1-inventory-every-non-person-identity)); an owner can add a credential and act as the app ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#ownership)). Grant Graph application permissions with C2's `New-MgServicePrincipalAppRoleAssignment`, using the app's service principal, and only what the workload calls ([Chapter 07](../../project-plans/developer-workbooks/non-person-identity/07-least-privilege-for-service-principals.md)). In production, Learn says to use a certificate from a well-known certificate authority and to manage it in Azure Key Vault.[^sam-app-cert]

### C4. CI/CD and other clouds: workload identity federation

Create a federated credential on the app registration, or on a user-assigned identity, that trusts the platform's issuer for one subject, with Learn's CLI:[^sam-wif-create]

```bash
az ad app federated-credential create --id <app-id> --parameters credential.json
```

`credential.json` holds the `name`, `issuer`, `subject`, `description` and `audiences` (`api://AzureADTokenExchange`). Issuer, subject and audience must match the platform's token exactly and case-sensitively, and a wrong subject is accepted when it's created and fails only at token exchange; Chapter 05 checks each one and tests a real exchange.

### C5. Retire the on-premises account

When the cloud identity has carried production traffic for the 30-day parallel run, retire whatever on-premises identity the cloud path replaced: disable it (A7), or, for a gMSA the workload no longer needs, record its retirement in Chapter 06's reconciliation (`MovesToWorkloadIdentity`) and remove it from its hosts with Learn's `Uninstall-ADServiceAccount -Identity <gmsa-name>` before the decommission process deletes it.[^sam-gmsa-manage] What still needs Kerberos stays, on the island list.

**What can't move.** Learn has no Entra identity that a service can use for Kerberos or NTLM to an on-premises resource; a workload that authenticates that way to a file share, a SQL Server login mapped to a Windows account, or a Kerberos-only application keeps its gMSA or dMSA until that resource changes ([Book 06, Chapter 09](../b06-data-platform/09-what-arc-provides-to-sql-server.md#the-managed-identity-and-the-service-account)). Those accounts carry an end date and, where they hold SPNs, an SPN owner on Chapter 06's island list.

**Rollback (C).** Switch the application's configuration back to the on-premises identity, which stays enabled through the parallel run; remove the new identity's role assignments and Graph grants from the export taken before the change.

## Sending mail from a gMSA workload {#mail-from-gmsa}

A gMSA has no mailbox, and no password an SMTP client could type, so a workload that sent mail as a user account needs another way to send once it runs as a gMSA *(inference: a gMSA is an `msDS-GroupManagedServiceAccount` object, not a mailbox user)*. Learn shows the pattern in its own products: when Microsoft Identity Manager's services run as managed accounts, its setup asks for a different account for Exchange, because the LogonUser function doesn't work for managed accounts.[^sam-mim-gmsa] Basic-authentication SMTP AUTH to Exchange Online isn't an option either: Learn says client SMTP submission with Basic authentication is scheduled for deprecation and isn't compatible with security defaults, and it recommends High Volume Email, Azure Communication Services Email or an on-premises relay instead.[^sam-mfd] The program's [no-secrets rule](#rules) rules out a stored mailbox password in any case.

Choose by where the mail server is:

| Where the mail goes | Path | What authenticates | Step |
|---|---|---|---|
| Exchange Server on premises | A receive connector that offers Integrated Windows authentication (Kerberos), with Send As on a shared mailbox | The gMSA itself | [M1](#sam-m1) |
| Exchange Server on premises, from a client that can't authenticate | IP-restricted anonymous internal relay | Nothing: the hosts' IP addresses | [M2](#sam-m2) |
| Exchange Online | Microsoft Graph `sendMail`, app-only, scoped to one mailbox with RBAC for Applications | An app registration with a certificate ([C3](#sam-c3)), or on an Arc-enabled host the Arc managed identity ([C2](#sam-c2)) | [M3](#sam-m3) |
| Learn's other options | High Volume Email (internal recipients only), Azure Communication Services Email, or hybrid relay through the on-premises servers | An HVE account, an ACS resource, or M1 or M2 | [M4](#sam-m4) |

: Sending mail from a gMSA workload {.striped .hover}

**Government-cloud availability**, as Learn states it (read November 11, 2026):

| Option | Commercial | GCC | GCC High | DoD |
|---|---|---|---|---|
| Graph `sendMail`[^sam-sendmail] | Yes (global service) | Yes (global service, `graph.microsoft.com`) | Yes (US Government L4) | Yes (US Government L5) |
| RBAC for Applications in Exchange Online[^sam-app-rbac] | Yes | Not yet specified | Not yet specified | Not yet specified |
| SMTP relay support in Exchange Online[^sam-exo-gov] | Yes | Yes | Yes | Yes |
| High Volume Email[^sam-hve] | Yes (Microsoft 365 Worldwide) | Not listed: Learn names Worldwide only; other clouds "under evaluation" | Not listed | Not listed |
| Azure Communication Services Email[^sam-acs-gov] | Yes, SDK and SMTP (commercial Azure) | Yes, in commercial Azure | Azure Government: generally available through the SDK; the SMTP endpoint isn't supported | Not yet specified: the page names Azure Government without distinguishing DoD |

: Mail options by cloud {.striped .hover}

RBAC for Applications is the mailbox-scoping step of M3; where the cloud's availability is unconfirmed, test `Test-ServicePrincipalAuthorization` in that tenant before relying on it, and don't fall back to an unscoped `Mail.Send` grant *(risk-based recommended: the program's position, because an unscoped grant can send as any user)*.

### M1. On-premises Exchange: Kerberos and Send As {#sam-m1}

Exchange Server's receive connectors offer Integrated Windows authentication (`Integrated`, NTLM and Kerberos) as an authentication mechanism, and the Client usage type includes it.[^sam-rc] A dedicated connector bound to the workload's hosts keeps the change away from the default connectors. In the Exchange Management Shell, with Learn's custom-connector syntax:[^sam-rc-custom]

```powershell
New-ReceiveConnector -Name "<connector-name>" -TransportRole FrontendTransport -Custom -Bindings <exchange-server-ip>:587 -RemoteIPRanges <host-ips> -AuthMechanism Tls,Integrated -PermissionGroups ExchangeUsers
Get-ReceiveConnector -Identity "<connector-name>" | Format-List Enabled,TransportRole,Bindings,RemoteIPRanges,AuthMechanism,PermissionGroups
```

**Expected:** `AuthMechanism` `Tls, Integrated`, `PermissionGroups` `ExchangeUsers`, and only the workload's hosts in `RemoteIPRanges`.

Send from a shared mailbox, never a person's. Exchange needs Send As to send from another mailbox,[^sam-sendas-ts] granted with Learn's command and read back:[^sam-sendas]

```powershell
Add-ADPermission -Identity "<shared-mailbox>" -User "<DOMAIN>\<gmsa-name>$" -AccessRights ExtendedRight -ExtendedRights "Send As"
Get-ADPermission -Identity "<shared-mailbox>" | where {$_.ExtendedRights -like 'Send*'} | Format-Table -Auto User,Deny,ExtendedRights
```

**Expected:** `<DOMAIN>\<gmsa-name>$` listed with `Send-As`, `Deny` `False`. Point the application's SMTP settings at `<exchange-server-ip>`, port 587, with STARTTLS and the process's own Windows credentials, and `<shared-mailbox>`'s address as the sender. Whether the application's mail library can authenticate with the process's credentials is the application's; check it with its vendor before the switch ([What couldn't be verified](#what-couldnt-be-verified)).

**Rollback (M1).** `Remove-ADPermission -Identity "<shared-mailbox>" -User "<DOMAIN>\<gmsa-name>$" -ExtendedRights "Send As"` and `Remove-ReceiveConnector -Identity "<connector-name>"`, then the application's previous mail settings.

### M2. On-premises Exchange: anonymous internal relay {#sam-m2}

For a workload whose mail client can't authenticate, Learn's pattern is a dedicated Front End Transport connector that accepts anonymous relay only from listed IP addresses, never the default connectors and never open relay.[^sam-relay] Learn gives two ways to grant the permissions; this guide uses the anonymous one, which grants the minimum *(risk-based recommended: the externally secured method treats the hosts as fully trusted internal senders and bypasses antispam)*:[^sam-relay]

```powershell
New-ReceiveConnector -Name "<connector-name>" -TransportRole FrontendTransport -Custom -Bindings <exchange-server-ip>:25 -RemoteIpRanges <host-ips>
Set-ReceiveConnector "<connector-name>" -PermissionGroups AnonymousUsers
Get-ReceiveConnector "<connector-name>" | Add-ADPermission -User "NT AUTHORITY\ANONYMOUS LOGON" -ExtendedRights "Ms-Exch-SMTP-Accept-Any-Recipient"
Get-ADPermission "<connector-name>" -User "NT AUTHORITY\ANONYMOUS LOGON" | where {($_.Deny -eq $false) -and ($_.IsInherited -eq $false)} | Format-Table User,ExtendedRights
```

**Expected:** only the workload's hosts in `RemoteIpRanges`, and `ANONYMOUS LOGON` holding `Ms-Exch-SMTP-Accept-Any-Recipient`. The relay identifies nothing but an IP address, so it is the weakest path here; record each host's address in the identity's record and review the connector's range with the identity *(design guidance)*. Of the two relay methods, this IP-restricted anonymous relay is the program's preferred one, a settled position ([WD-150](../../about/decision-register.md#wd-150)).

**Rollback (M2).** `Remove-ReceiveConnector -Identity "<connector-name>"`.

### M3. Exchange Online: Graph sendMail scoped to one mailbox {#sam-m3}

A gMSA can't sign in to Exchange Online, so the workload sends as a Microsoft Entra workload identity: the app registration with a certificate from [C3](#sam-c3), or on an Arc-enabled host the Arc managed identity from [C2](#sam-c2). Graph `sendMail` sends a message from a mailbox and needs the `Mail.Send` application permission.[^sam-sendmail] RBAC for Applications in Exchange Online grants that permission with a resource scope, so the identity can send only as the mailboxes in scope; it replaces Application Access Policies.[^sam-app-rbac]

Don't consent `Mail.Send` to the identity in Microsoft Entra ID. Learn says the two grants are a union, so an unscoped Entra grant beside a scoped Exchange grant leaves no effective scoping.[^sam-app-rbac] Read the identity's service principal (as a Global Reader or Application Administrator in Microsoft Graph PowerShell):

```powershell
Connect-MgGraph -TenantId <tenant-id> -Scopes 'Application.Read.All'
$sp = Get-MgServicePrincipal -Filter "appId eq '<app-id>'"
$sp | Select-Object DisplayName, AppId, Id
Get-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $sp.Id | Select-Object ResourceDisplayName, AppRoleId
```

**Expected:** no Microsoft Graph app role assignment for `Mail.Send`. For the Arc identity, use `-Filter "displayName eq '<arc-server>'"`; its `AppId` and `Id` go in the commands below.

Then, as a member of Organization Management in Exchange Online (Learn's requirement, with Exchange Administrator in Entra ID), scope the grant to a mail-enabled security group that holds only the sending shared mailbox; Learn's scope filter is `MemberOfGroup` with the group's distinguished name, and nested members are out of scope:[^sam-app-rbac]

```powershell
Connect-ExchangeOnline
New-DistributionGroup -Name "<scope-group>" -Type Security -Members "<shared-mailbox>"
Get-Group -Identity "<scope-group>" | Format-List Name,DistinguishedName
New-ServicePrincipal -AppId <app-id> -ObjectId <sp-object-id> -DisplayName "<app-name>"
New-ManagementScope -Name "<scope-name>" -RecipientRestrictionFilter "MemberOfGroup -eq '<scope-group-dn>'"
New-ManagementRoleAssignment -App <sp-object-id> -Role "Application Mail.Send" -CustomResourceScope "<scope-name>"
Test-ServicePrincipalAuthorization -Identity <sp-object-id> -Resource <shared-mailbox>
Test-ServicePrincipalAuthorization -Identity <sp-object-id> -Resource <other-mailbox>
```

In GCC High, connect with `Connect-ExchangeOnline -ExchangeEnvironmentName O365USGovGCCHigh`, and in DoD with `-ExchangeEnvironmentName O365USGovDoD`.[^sam-exo-connect] `<sp-object-id>` is the `Id` from the read above; Learn warns not to take the IDs from the App registrations page.[^sam-app-rbac]

**Expected:** `Application Mail.Send` with `InScope` `True` for `<shared-mailbox>` and `False` for `<other-mailbox>`. A change can take 30 minutes to 2 hours to reach a running app, though the test cmdlet bypasses that cache.[^sam-app-rbac]

Send, on the host, as the app with its certificate in the machine's store (Learn's `Send-MgUserMail` sample, sending as the shared mailbox):[^sam-sendmail] [^sam-mg-connect]

```powershell
Connect-MgGraph -ClientId <app-id> -TenantId <tenant-id> -CertificateThumbprint <thumbprint>
$params = @{
  message = @{
    subject = "<subject>"
    body = @{ contentType = "Text"; content = "<body>" }
    toRecipients = @( @{ emailAddress = @{ address = "<recipient>" } } )
  }
  saveToSentItems = "false"
}
Send-MgUserMail -UserId <shared-mailbox> -BodyParameter $params
```

In GCC High add `-Environment USGov` to `Connect-MgGraph`, and in DoD `-Environment USGovDoD`.[^sam-mg-connect] **Expected:** no error; Graph returns `202 Accepted`, which means accepted, not delivered, so confirm the message in the recipient's mailbox or in message trace.[^sam-sendmail] The same call with `-UserId <other-mailbox>` must fail.

On an Arc-enabled host, the workload gets its Graph token from the Arc agent's local endpoint as C2 describes (only local Administrators and the *Hybrid agent extension applications* group can request it) and calls `POST /users/<shared-mailbox>/sendMail` with the same body; no certificate is involved.[^sam-arc-identity]

**Rollback (M3).** `Remove-ManagementRoleAssignment` on the assignment `Get-ManagementRoleAssignment -RoleAssignee <sp-object-id>` lists, then `Remove-ManagementScope -Identity "<scope-name>"`; the app stays, with nothing to send as.

### M4. Learn's other options {#sam-m4}

- **High Volume Email** sends from dedicated HVE accounts to internal recipients only, at most 50 recipients a message, with OAuth recommended; Learn lists it for Microsoft 365 Worldwide only.[^sam-hve] It doesn't serve a GCC, GCC High or DoD tenant today.
- **Azure Communication Services Email** sends to internal and external recipients from a verified domain.[^sam-mfd] In Azure Government it is generally available through the SDK, and its SMTP endpoint isn't supported.[^sam-acs-gov] It brings its own resource, connection and identity to govern, and it sends from outside Exchange Online, so its mail isn't in the tenant's message trace.
- **Hybrid relay.** A workload that keeps sending to the on-premises servers (M1 or M2) reaches Exchange Online mailboxes through the hybrid mail flow while the on-premises servers remain; when they retire, the workload moves to M3.

## Special cases Learn documents {#special-cases}

| Case | What Learn says | What it means here |
|---|---|---|
| Kerberos delegation on a gMSA | The *Delegation* tab doesn't appear for managed service accounts; set `userAccountControl` and `msDS-AllowedToDelegateTo` with `Set-ADAccountControl` and `Set-ADServiceAccount`, never both delegation flags together[^sam-kcd] | Constrained delegation only; unconstrained delegation is a finding, and it stops working on a dMSA |
| Windows containers | A container can't be domain-joined but can run as a gMSA through a credential spec (`New-CredentialSpec`); create separate gMSAs for development, test and production; the gMSA's name becomes the container's name on the network; containers register no SPNs, so add at least a host SPN; a non-domain-joined host retrieves the password through a `ccg.exe` plug-in and a standard user account kept in a secret store[^sam-containers] | The non-domain-joined pattern brings back a stored password, for the portable user account; the program allows gMSA containers only on domain-joined hosts ([WD-154](../../about/decision-register.md#wd-154), and the decision below) |
| Microsoft Entra Domain Services | Create gMSAs in a custom OU, not *AADDC Users* or *AADDC Computers*; the KDS root key is pre-created and you can't create or view one[^sam-aadds] | Skip A2; use `New-ADServiceAccount -Path` with the custom OU, from the managed domain's management VM |
| Microsoft Entra Cloud Sync agent | The agent runs as a gMSA, `provAgentgMSA$` by default, or a custom gMSA with listed permissions; Domain or Enterprise Admin credentials create it once; the forest schema must be Windows Server 2012 or later; `Set-AADCloudSyncRestrictedPermissions` hardens the account's own permissions[^sam-cloudsync] [^sam-cloudsync-cmdlets] | A gMSA the program keeps until AD retires; on Chapter 06's island list with the sync servers ([Book 03, Chapter 05](../b03-hr-identity/05-the-provisioning-pipeline.md)) |
| Microsoft Entra Connect Sync | The sync service runs as a virtual service account by default; a gMSA is recommended with a remote SQL Server; the account can be set only at first installation[^sam-connect] | Choose the gMSA at installation if SQL Server is remote; changing it later means reinstalling |
| SQL Server | gMSAs for standalone instances from SQL Server 2014, and for failover cluster instances and availability groups from SQL Server 2016; Learn's quick validation checklist reads `sc.exe qc`, `Get-ADServiceAccount`, `Test-ADServiceAccount` and `sc.exe qmanagedaccount`[^sam-sql-accounts] [^sam-sql-gmsa] | SQL Server accounts go to the Data Platform plan (Chapter 06's NPI-KRB-09); [Book 06](../b06-data-platform/09-what-arc-provides-to-sql-server.md) covers the engine's Entra identity |
| AD FS | A gMSA is supported for the farm; it must live in the default `CN=Managed Service Accounts` container; `HOST/<adfs_service_name>` must be registered on it[^sam-adfs] | AD FS retires with the program's federation exit; its gMSA is on the island list until then |
| Failover clusters | Don't support gMSAs, but services on the Cluster service can use a gMSA or sMSA if they're a Windows service, an app pool or a scheduled task[^sam-gmsa-manage] | Learn's one named exception to "use a gMSA" |

: Special cases {.striped .hover}

## Federal requirements and evidence {#evidence}

The mapping reuses the Non-Person Identity guide's [Evidence](non-person-identity-implementation.md#evidence) table and Chapter 06's verified rows; where those govern, they govern. The controls are in the NIST SP 800-53 Rev. 5 Moderate baseline except IA-9, which is in no baseline and is tailored in.

| Step | What the evidence shows | Requirement it supports | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|---|
| A1 Inventory | Each service account, its SPNs, delegation, groups and hosts, joined to a record with two owners and a sponsor | AC-2 Account Management; CM-8 System Component Inventory | KSI-IAM-SNU; KSI-PIY-GIV | Chapter 01's register and Chapter 02's ownership run, or the A1 output for a single account |
| Decision | Each account's reviewed disposition | AC-2; IA-5 Authenticator Management | KSI-IAM-SNU | Chapter 03's `decisions.json` and its manifest |
| A2 KDS root key | One key, usable for at least 10 hours before the first gMSA | IA-5 | KSI-IAM-SNU | Event 4004 and the key's start time (Chapter 06's NPI-KRB-01) |
| A3, B1 Create | The account was created by a person, on an approved plan, with AES, a forest-unique name and reviewed retrievers | AC-6 Least Privilege; IA-5; CM-3 Configuration Change Control | KSI-IAM-ELP; KSI-IAM-SNU; KSI-CMT-LMC | The approved plan and the apply run's manifest (Chapter 06); `Get-ADServiceAccount` output |
| A4 Install and test | Only the reviewed hosts can retrieve the password | AC-6 | KSI-IAM-ELP | `Test-ADServiceAccount` `True` per host; `password-retrievers.json` (NPI-KRB-03) |
| A5 Switch | The workload runs as the managed account; each SPN has one owner; no privileged group | IA-5; AC-6(5) Privileged Accounts | KSI-IAM-SNU; KSI-IAM-JIT | `sc.exe qc` and `qmanagedaccount`; `setspn -L`; NPI-KRB-08 clear |
| A6, B3 Parallel run and complete | 30 days, then the old account disabled; for a dMSA, its SPNs moved | AC-2(3) Disable Accounts; IA-5 | KSI-IAM-AAM; KSI-IAM-SNU | `HostChangedOn` or `MigrationStartedOn`; the disable or complete in the apply manifest; `Get-ADUser` after it |
| C1 to C4 Cloud identity | The workload authenticates as itself with no secret, with scoped permissions | IA-9 Service Identification and Authentication (tailored in); IA-5; AC-6 | None for IA-9 (no indicator lists it); KSI-IAM-SNU; KSI-IAM-ELP | Chapter 05's plan and apply manifests; Graph grants and role assignments; the service principal sign-in log |
| A7, C5 Retire | The old identity is disabled, then deleted only through the decommission process | AC-2; AC-2(3) | KSI-IAM-SNU; KSI-IAM-AAM | The decommission ticket; Chapter 06's `reconciliation.json` |
| Island | Every account that stays on Kerberos has an end date and, where it has SPNs, an owner | CM-8; AC-2 | KSI-PIY-GIV; KSI-IAM-SNU | Chapter 06's `island-list.csv` |
| M1 to M4 Mail | The workload sends as one shared mailbox, through a connector limited to its hosts or a grant scoped to that mailbox, with no stored password | AC-6; IA-5; IA-9 (tailored in) | KSI-IAM-ELP; KSI-IAM-SNU | `Get-ReceiveConnector` and `Get-ADPermission` output (M1, M2); `Get-ManagementRoleAssignment` and both `Test-ServicePrincipalAuthorization` results (M3); the test message's trace; the service principal sign-in log |

: Federal requirements and KSIs, by step {.striped .hover}

KSIs are FedRAMP 20x indicators for cloud service providers. The KSI column names the indicators whose related controls, as FedRAMP lists them, include the row's control or one of its enhancements; which evidence supports which indicator is the program's mapping (design guidance), as in the Non-Person Identity guide. The agency authorizes its own system and lines this evidence up with what its providers report against KSIs; it doesn't report KSIs itself ([Book 00, Appendix B](../b00-orientation/appendix-b-engagement-archetype.md)).

**Evidence checklist** <!-- Book 00, Appendix D -->

- [ ] **Configuration:** `Get-ADServiceAccount` output for each new gMSA or dMSA; Chapter 06's approved plans and apply manifests; Chapter 05's plans for cloud identities; for mail, the connector, Send As and RBAC for Applications reads (M1 to M3)
- [ ] **Operational:** the old account's logons stopping on the domain controllers during the 30 days (A6); Kerberos events 307 to 309 (B2); the service principal sign-in log (C, M3); message trace for the test message
- [ ] **Test:** `Test-ADServiceAccount` `True` per host (A4); `sc.exe qmanagedaccount` `TRUE` and the end-to-end application test (A5, A6); both `Test-ServicePrincipalAuthorization` results and the refused send as `<other-mailbox>` (M3); each with date and tester
- [ ] **Exception:** Chapter 06's island list with end dates and SPN owners; `KeepKerberos` dispositions with the authorizing official's acceptance; any anonymous relay range (M2) with its owner
- [ ] **Assessor-ready artifact:** the Non-Person Identity guide's [evidence](non-person-identity-implementation.md#evidence) package with this account's rows, and a closure-chain entry for any assessment finding ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#the-closure-chain))

## Control states, change safety and assessment mapping {#sam-control-states}

The workbook's implementation conventions ([Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md)) applied to the migrations. Each row points to the step that already holds it.

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | [The decision path](#decision-path) and the account's Chapter 03 disposition | `decisions.json` and its manifest; the owners and sponsor on the record |
| Configured | A3, B1, C1 to C4 and M1 to M3: the new identity exists with its retrievers, role or grant | `Get-ADServiceAccount` output; Chapter 05 and 06 apply manifests; the RBAC for Applications assignment |
| Enforced | A5 (the workload runs as the gMSA), B3 (migration completed), A7 and C5 (the old identity disabled) | `sc.exe qmanagedaccount` `TRUE`; `Get-ADUser` showing `Enabled` `False`; `msDS-DelegatedMSAState` `2` |
| Evidenced | A4, A6 and M3's tests | `Test-ADServiceAccount` per host; the end-to-end test; `Test-ServicePrincipalAuthorization`; the test message |
| Operated | The track's lifecycle ([Non-Person Identity guide, Step 6](non-person-identity-implementation.md#step-6-run-the-lifecycle)) and Chapter 06's reconciliation and island list | Owner reviews; reconciliation runs; island list end dates |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

**How-template coverage.** <!-- Book 00, Appendix D: How-section template -->

| Subsection | Where this guide covers it |
|---|---|
| Prerequisites | A2 (KDS root key), Migration B's limits, Migration C's order of preference, the [mail availability table](#mail-from-gmsa) |
| Pilot | The first account on each path runs in the test domain, then one low-risk production workload before a wave *(design guidance, from [the program's rules](#rules): hand runs only in a test domain or under an approved change record)* |
| Report-only or audit phase | The 30-day parallel run (A6) with the old account enabled; a dMSA in state `1` (B2); for mail, `Test-ServicePrincipalAuthorization` before any send (M3) |
| Enforcement | A5 in one change window; B3's completion; A7's disable |
| Rollback | Rollback (A), (B), (C) and (M1) to (M3) |
| Exclusions | `Keep` and `KeepKerberos` dispositions on the island list; emergency access: not applicable, because no step restricts interactive sign-in, and the cloud-only emergency accounts are never in a service-account wave |
| Telemetry | The old account's domain controller logons (A6); Kerberos events 307 to 309 (B2); Event 4004 (A2); the service principal sign-in log (C, M3); message trace (M) |
| Evidence | [Federal requirements and evidence](#evidence), ending in the evidence checklist |
| Day-two ownership | The two named owners and the sponsor ([the rules](#rules)); the lifecycle in the Non-Person Identity guide's Step 6; [Book 15](../b15-day2-operations/index.md) for the support path |

: Where each How subsection lives {.striped .hover}

**Change safety** <!-- Book 00, Appendix D -->

| Ring | Scope | Exit criteria |
|---|---|---|
| 0 | The test domain and test tenant | Each path's commands run clean; Chapter 06's Lab 2 |
| 1 | One low-risk production workload per path | A clean 30-day parallel run; the end-to-end test passes |
| 2 | Waves by application owner | Every workload in the wave switched and verified; no old-account logons for 30 days |
| 3 | The remainder, and the island list's end dates | Every account dispositioned; the island list reviewed |

- **Emergency access:** not applicable; no step blocks or restricts an interactive sign-in.
- **Change window:** A5's switch, B3's completion and M1 to M3's grants each go through an approved change record ([the rules](#rules)), with the application owner on hand to run the end-to-end test.
- **Backout triggers:** set before the change *(program decision, settled as [WD-150](../../about/decision-register.md#wd-150))*: the service fails to start or the application's test fails; Kerberos errors to the service after the SPN move; the old account still logging on from a host not on the record; a send refused for `<shared-mailbox>` or allowed for `<other-mailbox>`.
- **Post-change validation:** A4 and A6's tests on every host after each ring; M3's two authorization tests and the test message.

::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** Identity (workload identities)
- **CISA ZTMM pillar:** Identity; Applications and Workloads
- **Depends on:** Infrastructure (the Arc agent for C2, [Arc track guide](arc-track-implementation.md)); the credential rules and least privilege of the [Non-Person Identity guide](non-person-identity-implementation.md#step-3-set-the-credential-rules); privileged groups kept out ([privileged access guide](privileged-access-implementation.md))
- **Attack chain interrupted:** Credential Access (Kerberoasting of service account passwords, passwords kept in configuration files), Persistence and Lateral Movement (a long-lived password usable from any host)
:::

## Dangers and how to avoid them {#dangers}

| Danger | What happens | The guard |
|---|---|---|
| A gMSA created before the KDS root key replicates | Password retrieval fails on hosts that ask another domain controller | Wait 10 hours after `Add-KdsRootKey -EffectiveImmediately`; never the backdated key in production (A2) |
| A second KDS root key | gMSAs fail after their next password rotation | One key per forest; Chapter 06 never creates one |
| An SPN left on the old account | Kerberos to the service fails, or falls back to NTLM | Move SPNs in the switch window; `setspn -L` (A5) |
| A host that can't retrieve the password | The service fails to start after the switch | `Test-ADServiceAccount` `True` on every host first (A4) |
| A password interval you want to change | It can't be changed | Decide it at creation; a new gMSA otherwise (A3) |
| A gMSA in a privileged group | Every host that retrieves its password holds that privilege | Grant only the service's rights; NPI-KRB-08 |
| Retrievers widened by hand | Another host can act as the service | Retrievers are a reviewed group; Chapter 06's NPI-KRB-03 |
| A dMSA completed too early, or with a host not on Windows Server 2025 | The old account is disabled and the service fails on hosts the dMSA hasn't learned | 30 days; every host on 2025; Chapter 06's NPI-KRB-04 |
| The old account deleted during the migration | No way back | Disable only; delete through the decommission process |
| A dMSA migrated from an account with no AES keys | Since the 2026 RC4 change, the service's tickets fail before the migration completes | Check for events 202 to 209 and change the password first; never during the migration (B0) |
| Create-child rights on an OU in a domain with a Windows Server 2025 domain controller | Whoever holds them could create a dMSA and take over another account (BadSuccessor) | The August 2025 update on every Windows Server 2025 domain controller; dMSAs created by Domain Admins only; create-child rights reviewed ([Who may create a dMSA](#sam-dmsa-create-right)) |
| A client secret on the new app registration | A password in a configuration file again | Managed identity, then federation, then a certificate; the application management policy ([Non-Person Identity guide, Step 3](non-person-identity-implementation.md#step-3-set-the-credential-rules)) |
| A non-domain-joined container host's portable user account | A stored domain password reappears | Domain-joined hosts only, a program decision ([WD-154](../../about/decision-register.md#wd-154)); a non-domain-joined host needs a reviewed exception |
| A gMSA left behind at program G5 | The workload loses its credential when the last domain controller is demoted | Chapter 06's reconciliation and island list |
| A mail workload given `Mail.Send` in Microsoft Entra ID | The identity can send as any mailbox in the tenant; a scope in Exchange doesn't narrow it, because the grants are a union | No Entra consent; RBAC for Applications only, with the negative `Test-ServicePrincipalAuthorization` (M3) |
| An anonymous relay connector with a wide IP range | Anything in the range can send as anyone in the organization | The workload's hosts only; reviewed with the identity (M2) |

: Dangers {.striped .hover}

## Checklist

- [ ] Every service account has a Chapter 03 disposition, two named owners and a federal-employee sponsor.
- [ ] The forest has exactly one KDS root key, usable for more than 10 hours, and Event 4004 was seen.
- [ ] Each new gMSA has a forest-unique name, AES256, the password interval decided at creation, and a reviewed group of retrievers, and was created by a person on an approved plan.
- [ ] `Test-ADServiceAccount` returned `True` on every host before the switch.
- [ ] Every SPN moved in the switch window and has one owner.
- [ ] No gMSA or dMSA is in a privileged group.
- [ ] Every dMSA migration ran 30 days before it was completed, on hosts that all run Windows Server 2025.
- [ ] Every Windows Server 2025 domain controller has the August 2025 update or later, and no one but Domain Admins can create a dMSA.
- [ ] Every account migrated to a dMSA had AES keys before the migration started (no events 202 to 209 for it).
- [ ] Every old account was disabled, not deleted, and has a decommission record.
- [ ] Every cloud identity uses a managed identity, a federated credential or a certificate, never a secret, with only the permissions its workload calls.
- [ ] Every account that stays on Kerberos is on Chapter 06's island list with an end date.
- [ ] Every gMSA workload that sends mail sends as one shared mailbox: through Kerberos and Send As or a host-limited relay on premises, or through Graph with an RBAC for Applications scope in Exchange Online, never a stored password or basic-auth SMTP AUTH.

## What couldn't be verified {#what-couldnt-be-verified}

- **The commands weren't run against a domain or a tenant for this guide.** Each is Learn's, or a Learn cmdlet with the parameters its reference lists; Chapter 06's harness runs Learn's gMSA, KDS and dMSA procedures against stand-ins, and its Lab 2 runs the write path in a test domain.
- **The IIS application pool step** combines Learn's IIS PowerShell sample, which sets a user and password, with the blank password of Learn's move-to-gMSA step; Learn has no page that shows a gMSA application pool end to end.
- **`sc.exe config` with `password= ""`.** The `sc.exe config` reference says a password is required for an account other than LocalSystem, while the Service Control Manager's API reference says the password must be NULL for a managed service account. The step verifies the outcome with `sc.exe qmanagedaccount`, which must report `TRUE`.
- **The gMSA name length.** Learn's gMSA pages don't state a maximum name length; keep names short and test the create in the test domain.
- **A gMSA on an Integrated Windows authentication receive connector (M1).** Learn documents the connector's Kerberos mechanism and the Send As permission, but no page shows a gMSA submitting SMTP end to end, and whether a given application's mail library authenticates with its process's credentials is the application's. Test M1 in the test domain before the switch.
- **Graph tokens on an Arc-enabled host (M3).** The Arc page documents the local token endpoint; no page read shows `Connect-MgGraph -Identity` against an Arc agent, so the step calls the endpoint as C2 describes rather than giving a PowerShell connection.
- **RBAC for Applications, High Volume Email and Azure Communication Services Email in the US Government clouds.** The RBAC for Applications page names no cloud; High Volume Email lists Microsoft 365 Worldwide only; ACS Email's government page names Azure Government without distinguishing DoD (read November 11, 2026). The [availability table](#mail-from-gmsa) says "not yet specified" or "not listed" where Learn does.
- **Government-cloud availability of managed identities** isn't stated on the managed identity pages read; the Graph federated credential APIs list L4 and L5 (Chapter 05's verified facts), and Workload ID Premium is available in Azure Government through the account manager ([Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md#what-workload-id-premium-adds)).

## Questions for the program owner {#questions}

These were design choices the guide left to the program owner. All three are now program decisions, taken as recommended on November 11, 2026 and recorded as [WD-154](../../about/decision-register.md#wd-154):

1. **Non-domain-joined container hosts.** Learn's pattern for them keeps a standard user account's password in a secret store for `ccg.exe`. *Decision:* gMSA containers run only on domain-joined hosts; a non-domain-joined host needs a reviewed exception.
2. **Outbound-only gMSAs.** Learn offers `-RestrictToOutboundAuthenticationOnly` for services nothing authenticates to. *Decision:* it is the default for a gMSA whose workload holds no SPN, recorded in `kerberos-replatform.csv` (step A3 of [Migration A](#migration-a)).
3. **Who creates gMSAs.** Learn allows a delegated right to create `msDS-GroupManagedServiceAccount` objects instead of Domain Admins. *Decision:* that right is delegated on the service-account OU to the identity engineers who run Chapter 06's write path, and Domain Admins are kept only for the dMSA steps Learn says need it.

## Back to the books

- [Book 02, Chapter 08: Service accounts](../b02-identity/08-assessing-the-forest.md#service-accounts) and [Chapter 09: The migration path matrix](../b02-identity/09-building-the-entra-target.md#the-migration-path-matrix)
- [Non-Person Identity: An Implementation Guide](non-person-identity-implementation.md)
- Developer workbook: [Chapter 03](../../project-plans/developer-workbooks/non-person-identity/03-the-migration-path-matrix-as-code.md), [Chapter 05](../../project-plans/developer-workbooks/non-person-identity/05-workload-identity-federation-and-managed-identities.md), [Chapter 06](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md)
- [Book 04, Chapter 05: Applications and workload identities](../b04-access/05-applications-and-workload-identities.md)

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

This guide has not been published in an edition yet. Each edition is kept, with its Word editions, decks and videos, on the [Archive](../../about/archive.md) page. Every change so far is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/guides/service-account-migration.md).

<!-- revisions:end -->

[^sam-govern]: Microsoft Learn, "Govern on-premises service accounts," four types; new service account principles; deprovision, <https://learn.microsoft.com/entra/architecture/service-accounts-govern-on-premises> (accessed Nov 9, 2026).
[^sam-understand]: Microsoft Learn, "Service accounts" (Active Directory Domain Services), sMSA, gMSA, dMSA, virtual accounts; password policy for service accounts; choosing your service account, <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/understand-service-accounts> (accessed Nov 9, 2026).
[^sam-onprem]: Microsoft Learn, "Securing on-premises service accounts," types; choose the right type; privileged groups, <https://learn.microsoft.com/entra/architecture/service-accounts-on-premises> (accessed Nov 9, 2026).
[^sam-user]: Microsoft Learn, "Secure user-based service accounts in Active Directory," find accounts trusted for delegation, with SPNs, with passwords that never expire; secure account types, <https://learn.microsoft.com/entra/architecture/service-accounts-user-on-premises> (accessed Nov 9, 2026).
[^sam-smsa]: Microsoft Learn, "Secure standalone managed service accounts," benefits; challenges; find sMSAs, <https://learn.microsoft.com/entra/architecture/service-accounts-standalone-managed> (accessed Nov 9, 2026).
[^sam-entra-gmsa]: Microsoft Learn, "Secure group managed service accounts," benefits; using gMSAs; assess gMSA security posture; move to a gMSA, <https://learn.microsoft.com/entra/architecture/service-accounts-group-managed> (accessed Nov 9, 2026).
[^sam-gmsa-manage]: Microsoft Learn, "Manage group Managed Service Accounts," principals table; prerequisites (Event ID 4004); create a gMSA (forest-unique names, outbound-only, interval only at creation, `Test-ADServiceAccount`, delegated create right); install; uninstall, <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/manage-group-managed-service-accounts> (accessed Nov 9, 2026).
[^sam-gmsa-overview]: Microsoft Learn, "Group Managed Service Accounts overview," software requirements (always configure AES), <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/group-managed-service-accounts-overview> (accessed Nov 9, 2026).
[^sam-kds]: Microsoft Learn, "Create a Key Distribution Service (KDS) root key," the 10-hour wait; re-created keys and the KDC restart; `-EffectiveImmediately`; the test-environment backdated key, <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/create-the-key-distribution-services-kds-root-key> (accessed Nov 9, 2026).
[^sam-kcd]: Microsoft Learn, "Configuring Kerberos delegation for group Managed Service Accounts," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/configure-kerberos-delegation-group-managed-service-accounts> (accessed Nov 9, 2026).
[^sam-dmsa-overview]: Microsoft Learn, "Delegated Managed Service Accounts overview," dMSA and gMSA comparison; migration flow; account attributes, <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/delegated-managed-service-accounts/delegated-managed-service-accounts-overview> (accessed Nov 9, 2026).
[^sam-dmsa-setup]: Microsoft Learn, "Setting up delegated Managed Service Accounts," prerequisites; create; migrate; complete; undo and reset; event logs, <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/delegated-managed-service-accounts/delegated-managed-service-accounts-set-up-dmsa> (accessed Nov 9, 2026).
[^sam-dmsa-faq]: Microsoft Learn, "Delegated Managed Service Accounts frequently asked questions" (at least one discoverable Windows Server 2025 domain controller; schema extension alone isn't enough; don't reset the password during migration), <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/delegated-managed-service-accounts/delegated-managed-service-accounts-faq> (accessed Nov 13, 2026).
[^sam-cve-53779]: Microsoft Security Response Center, "CVE-2025-53779: Windows Kerberos Elevation of Privilege Vulnerability," released August 12, 2025, affected products, KB5063878 and KB5064010, and FAQ, <https://msrc.microsoft.com/update-guide/vulnerability/CVE-2025-53779> (accessed Nov 13, 2026).
[^sam-badsuccessor]: Akamai, "BadSuccessor: Abusing dMSA to Escalate Privileges in Active Directory," May 21, 2025, and "BadSuccessor Is Dead? Analyzing the BadSuccessor Patch," August 27, 2025, <https://www.akamai.com/blog/security-research/abusing-dmsa-for-privilege-escalation-in-active-directory> and <https://www.akamai.com/blog/security-research/2025/aug/badsuccessor-is-dead-analyzing-badsuccessor-patch> (accessed Nov 13, 2026). Not a Microsoft source; used because Learn gives no guidance on the create right.
[^sam-kb5073381]: Microsoft Support, "How to manage Kerberos KDC usage of RC4 for service account ticket issuance changes related to CVE-2026-20833" (KB5073381), timeline and events 201–209, <https://support.microsoft.com/kb/5073381> (accessed Nov 13, 2026).
[^sam-rc4-detect]: Microsoft Learn, "Detect and remediate RC4 usage in Kerberos" (accounts without AES keys; a password change generates them; `List-AccountKeys.ps1`; ticket encryption types), <https://learn.microsoft.com/windows-server/security/kerberos/detect-remediate-rc4-kerberos> (accessed Nov 13, 2026).
[^sam-set-adsa]: Microsoft Learn, "Set-ADServiceAccount," `-ServicePrincipalNames`, <https://learn.microsoft.com/powershell/module/activedirectory/set-adserviceaccount> (accessed Nov 9, 2026).
[^sam-set-aduser]: Microsoft Learn, "Set-ADUser," `-ServicePrincipalNames`, <https://learn.microsoft.com/powershell/module/activedirectory/set-aduser> (accessed Nov 9, 2026).
[^sam-sql-spn]: Microsoft Learn, "Troubleshoot SQL Server Kerberos and authentication failures with gMSAs," `setspn -L` on the gMSA, <https://learn.microsoft.com/troubleshoot/sql/database-engine/startup-shutdown/gmsa-kerberos-authentication-failures> (accessed Nov 9, 2026).
[^sam-sql-gmsa]: Microsoft Learn, "Troubleshoot SQL Server setup, startup, and authentication failures with gMSAs," quick validation checklist (`sc.exe qc`, `Get-ADServiceAccount`, `Test-ADServiceAccount`, `sc.exe qmanagedaccount`), <https://learn.microsoft.com/troubleshoot/sql/database-engine/startup-shutdown/sql-server-setup-startup-authentication-issues-with-gmsas> (accessed Nov 9, 2026).
[^sam-sc-config]: Microsoft Learn, "sc.exe config," `obj=` and `password=`, <https://learn.microsoft.com/windows-server/administration/windows-commands/sc-config>, and "ChangeServiceConfigA function," `lpPassword` for a managed service account, <https://learn.microsoft.com/windows/win32/api/winsvc/nf-winsvc-changeserviceconfiga> (accessed Nov 9, 2026).
[^sam-task]: Microsoft Learn, "Modify and remove assessment tasks," modify existing assessment tasks (`New-ScheduledTaskPrincipal -LogonType Password` with a gMSA), <https://learn.microsoft.com/services-hub/microsoft-engage-center/health/modify-and-remove-assessment-tasks> (accessed Nov 9, 2026).
[^sam-iis]: Microsoft Learn, "PowerShell snap-in: making simple configuration changes to web sites and application pools," changing application pool settings (`processModel.userName`, `password`, `identityType = 3`), <https://learn.microsoft.com/iis/manage/powershell/powershell-snap-in-making-simple-configuration-changes-to-web-sites-and-application-pools> (accessed Nov 9, 2026).
[^sam-containers]: Microsoft Learn, "Create gMSAs for Windows containers," prerequisites (delegated create right); one KDS root key per forest; production and single-DC keys; separate gMSAs per environment; non-domain-joined hosts; credential spec, <https://learn.microsoft.com/virtualization/windowscontainers/manage-containers/manage-serviceaccounts> (accessed Nov 9, 2026).
[^sam-aadds]: Microsoft Learn, "Create a group managed service account (gMSA) in Microsoft Entra Domain Services," <https://learn.microsoft.com/entra/identity/domain-services/create-gmsa> (accessed Nov 9, 2026).
[^sam-cloudsync]: Microsoft Learn, "Prerequisites for Microsoft Entra Cloud Sync," group Managed Service Accounts; custom gMSA, <https://learn.microsoft.com/entra/identity/hybrid/cloud-sync/how-to-prerequisites>, and "Group Managed Service Accounts" (Cloud Sync), <https://learn.microsoft.com/entra/identity/hybrid/cloud-sync/gmsa-cloud-sync> (accessed Nov 9, 2026).
[^sam-cloudsync-cmdlets]: Microsoft Learn, "Microsoft Entra provisioning agent gMSA PowerShell cmdlets," `Set-AADCloudSyncRestrictedPermissions`, <https://learn.microsoft.com/entra/identity/hybrid/cloud-sync/how-to-gmsa-cmdlets> (accessed Nov 9, 2026).
[^sam-connect]: Microsoft Learn, "Microsoft Entra Connect: Accounts and permissions," ADSync service account, <https://learn.microsoft.com/entra/identity/hybrid/connect/reference-connect-accounts-permissions> (accessed Nov 9, 2026).
[^sam-sql-accounts]: Microsoft Learn, "Configure Windows service accounts and permissions" (SQL Server), managed service accounts, group-managed service accounts, and virtual accounts, <https://learn.microsoft.com/sql/database-engine/configure-windows/configure-windows-service-accounts-and-permissions> (accessed Nov 9, 2026).
[^sam-adfs]: Microsoft Learn, "AD FS requirements," service account requirements, <https://learn.microsoft.com/windows-server/identity/ad-fs/overview/ad-fs-requirements> (accessed Nov 9, 2026).
[^sam-mi-overview]: Microsoft Learn, "What are managed identities for Azure resources?," managed identity types; differences; use, <https://learn.microsoft.com/entra/identity/managed-identities-azure-resources/overview> (accessed Nov 9, 2026).
[^sam-mi-cli]: Microsoft Learn, "Create an Azure Functions app in Azure Container Apps," create supporting Azure resources (`az identity create`, `az role assignment create --assignee-object-id --assignee-principal-type ServicePrincipal`), <https://learn.microsoft.com/azure/container-apps/functions-container-apps> (accessed Nov 9, 2026).
[^sam-arc-identity]: Microsoft Learn, "Managed identity and access control" (Azure Arc-enabled servers), Microsoft Entra ID managed identity, <https://learn.microsoft.com/azure/azure-arc/servers/security-identity-authorization>, and "Access Azure resources by using managed identity on Azure Arc-enabled servers," prerequisites, <https://learn.microsoft.com/azure/azure-arc/servers/managed-identity-authentication> (accessed Nov 9, 2026).
[^sam-arc-graph]: Microsoft Learn, "Managed identity for SQL Server enabled by Azure Arc," grant application permissions to the identity, <https://learn.microsoft.com/sql/sql-server/azure-arc/managed-identity> (accessed Nov 9, 2026).
[^sam-app-cred]: Microsoft Learn, "Security best practices for application properties in Microsoft Entra ID," credentials (managed identity, then a platform identity, then certificates; don't use secrets), <https://learn.microsoft.com/entra/identity-platform/security-best-practices-for-app-registration> (accessed Nov 9, 2026).
[^sam-app-cert]: Microsoft Learn, "Add and manage application credentials in Microsoft Entra ID," certificates in production, <https://learn.microsoft.com/entra/identity-platform/how-to-add-credentials>, and "Use certificates with Microsoft.Identity.Web," register the certificate (`az ad app credential reset --cert --append`), <https://learn.microsoft.com/entra/msidweb/authentication/certificates> (accessed Nov 9, 2026).
[^sam-wif]: Microsoft Learn, "Workload identity federation," <https://learn.microsoft.com/entra/workload-id/workload-identity-federation> (accessed Nov 9, 2026).
[^sam-wif-create]: Microsoft Learn, "Configure an app to trust an external identity provider," Azure CLI, <https://learn.microsoft.com/entra/workload-id/workload-identity-federation-create-trust> (accessed Nov 9, 2026).
[^sam-az-ad]: Microsoft Learn, Azure CLI reference, "az ad app" (`create`, `--sign-in-audience`, `credential reset --cert --append`), <https://learn.microsoft.com/cli/azure/ad/app>, and "az ad sp" (`create --id`), <https://learn.microsoft.com/cli/azure/ad/sp> (accessed Nov 9, 2026).
[^sam-mim-gmsa]: Microsoft Learn, "Convert Microsoft Identity Manager-specific services to use group Managed Service Accounts," Microsoft Identity Manager Service (a different user for Exchange for managed accounts; the LogonUser function doesn't work for managed accounts), <https://learn.microsoft.com/microsoft-identity-manager/microsoft-identity-manager-2016-gmsa> (accessed Nov 11, 2026).
[^sam-mfd]: Microsoft Learn, "How to set up a multifunction device or application to send email using Microsoft 365 or Office 365," client SMTP submission (Basic authentication scheduled for deprecation; not compatible with security defaults; High Volume Email, Azure Communication Services Email, or an on-premises server with anonymous relay instead), <https://learn.microsoft.com/exchange/mail-flow-best-practices/how-to-set-up-a-multifunction-device-or-application-to-send-email-using-microsoft-365-or-office-365>, and "Deprecation of Basic authentication in Exchange Online," POP, IMAP, and SMTP AUTH (retirement of Basic authentication for SMTP AUTH announced; Graph as an alternative), <https://learn.microsoft.com/exchange/clients-and-mobile-in-exchange-online/deprecation-of-basic-authentication-exchange-online> (both accessed Nov 11, 2026).
[^sam-sendmail]: Microsoft Learn, "user: sendMail" (Graph v1.0; global service, US Government L4 and L5; `Mail.Send` application permission; `202 Accepted` doesn't mean delivered; PowerShell `Send-MgUserMail` sample), <https://learn.microsoft.com/graph/api/user-sendmail?view=graph-rest-1.0> (accessed Nov 11, 2026).
[^sam-app-rbac]: Microsoft Learn, "Role Based Access Control for Applications in Exchange Online" (replaces Application Access Policies; Organization Management and Exchange Administrator; `New-ServicePrincipal`, `New-ManagementScope`, `New-ManagementRoleAssignment -App -Role "Application Mail.Send" -CustomResourceScope`, `Test-ServicePrincipalAuthorization`; Entra and Exchange grants are a union; `MemberOfGroup` scopes, nested members out of scope; cache of 30 minutes to 2 hours; no cloud availability stated), <https://learn.microsoft.com/exchange/permissions-exo/application-rbac> (accessed Nov 11, 2026).
[^sam-exo-gov]: Microsoft Learn, "Exchange Online for US government environments," Exchange Online features (SMTP relay support: GCC, GCC High, DoD), <https://learn.microsoft.com/office365/servicedescriptions/office-365-platform-service-description/office-365-us-government/exchange-online-for-us-government-environments> (accessed Nov 11, 2026).
[^sam-hve]: Microsoft Learn, "Manage High Volume Email for Microsoft 365" (internal recipients only; 50 recipients per message; OAuth recommended; supported in Microsoft 365 Worldwide, other cloud environments under evaluation), <https://learn.microsoft.com/exchange/mail-flow-best-practices/high-volume-mails-m365> (accessed Nov 11, 2026).
[^sam-acs-gov]: Microsoft Learn, "Azure Communication Services for US Government" (Email generally available in Azure Government through SDK-based integration; SMTP endpoint not supported in Azure US Government cloud), <https://learn.microsoft.com/azure/communication-services/concepts/government> (accessed Nov 11, 2026).
[^sam-rc]: Microsoft Learn, "Receive connectors in Exchange Server," usage types (Client includes `Integrated`), authentication mechanisms (`Integrated`: NTLM and Kerberos), permission groups (`ExchangeUsers`: authenticated users, with submit and relay), <https://learn.microsoft.com/exchange/mail-flow/connectors/receive-connectors> (accessed Nov 11, 2026).
[^sam-rc-custom]: Microsoft Learn, "Scenarios for custom Receive connectors in Exchange Server," scenario 3 (`New-ReceiveConnector -Custom -Bindings -RemoteIPRanges -AuthMechanism -PermissionGroups`), <https://learn.microsoft.com/exchange/mail-flow/connectors/custom-receive-connectors> (accessed Nov 11, 2026).
[^sam-sendas-ts]: Microsoft Learn, "Can't send an email message when Full Access permission is granted to a shared mailbox in Exchange Server" (Exchange requires Send As to send from a shared mailbox), <https://learn.microsoft.com/troubleshoot/exchange/mailflow/cannot-send-email-with-full-access> (accessed Nov 11, 2026).
[^sam-sendas]: Microsoft Learn, "Manage permissions for recipients," use the Exchange Management Shell to assign the Send As permission (`Add-ADPermission -ExtendedRights "Send As"`; verify with `Get-ADPermission`), <https://learn.microsoft.com/exchange/recipients/mailbox-permissions> (accessed Nov 11, 2026).
[^sam-relay]: Microsoft Learn, "Allow anonymous relay on Exchange servers" (Exchange Server 2016, 2019 and Subscription Edition; a dedicated Front End Transport connector limited to listed hosts; the anonymous and externally secured methods compared; commands and verification), <https://learn.microsoft.com/exchange/mail-flow/connectors/allow-anonymous-relay> (accessed Nov 11, 2026).
[^sam-exo-connect]: Microsoft Learn, "Connect to Exchange Online PowerShell," step 2 (`-ExchangeEnvironmentName O365USGovGCCHigh` and `O365USGovDoD`; none needed for GCC), <https://learn.microsoft.com/powershell/exchange/connect-to-exchange-online-powershell> (accessed Nov 11, 2026).
[^sam-mg-connect]: Microsoft Learn, "Connect-MgGraph" (app-only with `-CertificateThumbprint`; `-Environment USGov` and `USGovDoD`), <https://learn.microsoft.com/powershell/module/microsoft.graph.authentication/connect-mggraph>, and "Authentication module cmdlets in Microsoft Graph PowerShell," app-only access (certificate from the current user's or local machine's store), <https://learn.microsoft.com/powershell/microsoftgraph/authentication-commands> (both accessed Nov 11, 2026).
[^sam-agent]: Microsoft Learn, "Agent identities in Microsoft Entra Agent ID," <https://learn.microsoft.com/entra/agent-id/agent-identities>, and "Microsoft Entra Agent ID key concepts," <https://learn.microsoft.com/entra/agent-id/key-concepts> (accessed Nov 9, 2026).
