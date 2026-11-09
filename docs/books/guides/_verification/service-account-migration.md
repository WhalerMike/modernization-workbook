# Verification — Guide: Service Accounts, from User Accounts to gMSAs to Microsoft Entra Workload Identities

New guide, first pass of 2026-11-09, at the program owner's request of November 9, 2026 for a comparison and migration guide from service accounts to gMSAs and then to their Microsoft Entra equivalents. No kit change: the scripted versions are the Non-Person Identity kit's Chapters 03, 05, 06 and 07, linked rather than repeated.

Every Microsoft fact and command was read on Microsoft Learn on November 9, 2026, through the Microsoft Learn documentation service (search, fetch and code-sample search). The Windows Server pages were also read from their source in MicrosoftDocs/windowsserverdocs at commit `2205ce8e55001a9b5e8e0de43981baa8ad782562` (the same commit Chapter 06 pins), and every page's `ms.date` was read from its published HTML the same day. Facts the books already verified are cited by link and rely on those pages' own verification logs. No command was run against a domain or a tenant for this guide; Chapter 06's harness runs Learn's gMSA, KDS and dMSA procedures against stand-ins.

## Learn pages read

| Page | URL | ms.date |
|---|---|---|
| Manage group Managed Service Accounts | learn.microsoft.com/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/manage-group-managed-service-accounts | 2026-04-16 |
| Group Managed Service Accounts overview | …/group-managed-service-accounts-overview | 2025-07-01 |
| Create a Key Distribution Service (KDS) root key | …/create-the-key-distribution-services-kds-root-key | 2025-07-09 |
| Configuring Kerberos delegation for group Managed Service Accounts | …/configure-kerberos-delegation-group-managed-service-accounts | 2025-07-09 |
| Service accounts (AD DS) | learn.microsoft.com/windows-server/identity/ad-ds/manage/understand-service-accounts | 2026-09-14 |
| Delegated Managed Service Accounts overview | …/delegated-managed-service-accounts/delegated-managed-service-accounts-overview | 2025-05-30 |
| Setting up delegated Managed Service Accounts | …/delegated-managed-service-accounts-set-up-dmsa | 2025-05-30 |
| Delegated Managed Service Accounts FAQ | …/delegated-managed-service-accounts-faq | 2024-08-15 |
| Secure group managed service accounts | learn.microsoft.com/entra/architecture/service-accounts-group-managed | 2023-02-09 |
| Securing on-premises service accounts | learn.microsoft.com/entra/architecture/service-accounts-on-premises | 2022-08-26 |
| Secure user-based service accounts in Active Directory | learn.microsoft.com/entra/architecture/service-accounts-user-on-premises | 2023-02-09 |
| Secure standalone managed service accounts | learn.microsoft.com/entra/architecture/service-accounts-standalone-managed | 2023-02-08 |
| Govern on-premises service accounts | learn.microsoft.com/entra/architecture/service-accounts-govern-on-premises | 2023-02-10 |
| Create a gMSA in Microsoft Entra Domain Services | learn.microsoft.com/entra/identity/domain-services/create-gmsa | 2025-01-21 |
| Create gMSAs for Windows containers | learn.microsoft.com/virtualization/windowscontainers/manage-containers/manage-serviceaccounts | 2025-01-23 |
| Troubleshoot gMSAs for Windows containers (scope only) | learn.microsoft.com/virtualization/windowscontainers/manage-containers/gmsa-troubleshooting | 2025-01-23 |
| Prerequisites for Microsoft Entra Cloud Sync | learn.microsoft.com/entra/identity/hybrid/cloud-sync/how-to-prerequisites | 2026-10-22 |
| Group Managed Service Accounts (Cloud Sync) | learn.microsoft.com/entra/identity/hybrid/cloud-sync/gmsa-cloud-sync | 2025-09-29 |
| Microsoft Entra provisioning agent gMSA PowerShell cmdlets | learn.microsoft.com/entra/identity/hybrid/cloud-sync/how-to-gmsa-cmdlets | 2025-04-09 |
| Microsoft Entra Connect: Accounts and permissions | learn.microsoft.com/entra/identity/hybrid/connect/reference-connect-accounts-permissions | 2025-04-09 |
| ADSync service account | learn.microsoft.com/entra/identity/hybrid/connect/concept-adsync-service-account | 2025-04-09 |
| Configure Windows service accounts and permissions (SQL Server) | learn.microsoft.com/sql/database-engine/configure-windows/configure-windows-service-accounts-and-permissions | 2025-10-14 |
| Troubleshoot SQL Server setup, startup, and authentication failures with gMSAs | learn.microsoft.com/troubleshoot/sql/database-engine/startup-shutdown/sql-server-setup-startup-authentication-issues-with-gmsas | 2026-09-29 |
| Troubleshoot SQL Server Kerberos and authentication failures with gMSAs | learn.microsoft.com/troubleshoot/sql/database-engine/startup-shutdown/gmsa-kerberos-authentication-failures | 2026-09-29 |
| AD FS requirements | learn.microsoft.com/windows-server/identity/ad-fs/overview/ad-fs-requirements | 2025-04-08 |
| Configure a federation server (AD FS) | learn.microsoft.com/windows-server/identity/ad-fs/deployment/configure-a-federation-server | 2024-02-13 |
| What are managed identities for Azure resources? | learn.microsoft.com/entra/identity/managed-identities-azure-resources/overview | 2025-08-19 |
| Managed identity and access control (Arc-enabled servers) | learn.microsoft.com/azure/azure-arc/servers/security-identity-authorization | 2025-03-06 |
| Access Azure resources by using managed identity on Arc-enabled servers | learn.microsoft.com/azure/azure-arc/servers/managed-identity-authentication | 2026-02-05 |
| Managed identity for SQL Server enabled by Azure Arc | learn.microsoft.com/sql/sql-server/azure-arc/managed-identity | 2025-11-18 |
| Security best practices for application properties | learn.microsoft.com/entra/identity-platform/security-best-practices-for-app-registration | 2026-10-01 |
| Add and manage application credentials | learn.microsoft.com/entra/identity-platform/how-to-add-credentials | 2025-03-26 |
| Use certificates with Microsoft.Identity.Web | learn.microsoft.com/entra/msidweb/authentication/certificates | 2026-04-19 |
| az ad app; az ad sp (Azure CLI reference) | learn.microsoft.com/cli/azure/ad/app; …/ad/sp | 2026-06-26 |
| Workload identity federation | learn.microsoft.com/entra/workload-id/workload-identity-federation | 2025-04-09 |
| Configure an app to trust an external identity provider | learn.microsoft.com/entra/workload-id/workload-identity-federation-create-trust | 2024-12-13 |
| Agent identities; Agent ID key concepts | learn.microsoft.com/entra/agent-id/agent-identities; …/key-concepts | 2026-03-30; 2026-04-03 |
| Create an Azure Functions app in Azure Container Apps (CLI sample) | learn.microsoft.com/azure/container-apps/functions-container-apps | 2026-03-25 |
| Modify and remove assessment tasks (scheduled task with a gMSA) | learn.microsoft.com/services-hub/microsoft-engage-center/health/modify-and-remove-assessment-tasks | 2026-08-20 |
| PowerShell snap-in: changing application pool settings (IIS) | learn.microsoft.com/iis/manage/powershell/powershell-snap-in-making-simple-configuration-changes-to-web-sites-and-application-pools | 2008-04-14 |
| sc.exe config; ChangeServiceConfigA | learn.microsoft.com/windows-server/administration/windows-commands/sc-config; learn.microsoft.com/windows/win32/api/winsvc/nf-winsvc-changeserviceconfiga | 2018-06-05; 2018-12-05 |
| Set-ADUser | learn.microsoft.com/powershell/module/activedirectory/set-aduser | 2016-12-27 |

## Learn coverage of gMSAs across the workbook (before and after November 9, 2026)

"Before" is origin/main at `253d18eb`; "after" is this change.

| Learn fact or procedure | Workbook home | Before | After |
|---|---|---|---|
| gMSA: password managed by DCs, retrieved by hosts; SCM, IIS, Task Scheduler; not failover clusters | NPI Ch06; Book 10 App. B | covered and cited | unchanged |
| gMSA prerequisites (Domain/Enterprise Admins, functional level 2012, KDS root key) | NPI Ch06 verified facts | covered and cited | unchanged |
| KDS root key: 10-hour wait | NPI guide Step 2; NPI Ch06 | covered and cited | unchanged |
| KDS root key: backdated key only for a single-DC test domain | NPI Ch06 gap table, Lab 2 | covered and cited | cited also from containers, dMSA set-up and AD FS where they differ (Ch06) |
| KDS root key: one per forest; more than one fails gMSAs after rotation | — | missing | NPI guide Step 2; NPI Ch06; this guide A2 |
| KDS root key: re-created key cached, restart the KDC; Event ID 4004 | — | missing | NPI Ch06 verified facts; this guide A2 |
| KDS root key "once per domain" | NPI guide Step 2 | covered, imprecise | corrected to "once for the forest" |
| gMSA names unique in the forest | — | missing | NPI guide Step 2; NPI Ch06; this guide A3 |
| Password interval set only at creation (`ManagedPasswordIntervalInDays`) | NPI guide Step 3; Book 06 Ch01 | covered and cited | also NPI Ch06; this guide A3 |
| Outbound-only gMSA (`-RestrictToOutboundAuthenticationOnly`) | — | missing | NPI Ch06; this guide A3; question for the program owner |
| Delegated right to create `msDS-GroupManagedServiceAccount` objects; Account Operators lack it | NPI Ch06 write task ("a delegated right to create gMSAs") | covered and cited, partly | NPI guide Step 2; NPI Ch06 verified facts; this guide A3; question for the program owner |
| `Test-ADServiceAccount` after `Install-ADServiceAccount` | Book 02 Ch08 (install); NPI Ch11; Book 10 App. B | covered and cited (install; test in Ch11 and App. B) | NPI guide Step 2; NPI Ch06 plan table; this guide A4 |
| Always configure AES | NPI Ch06 | covered and cited | unchanged |
| gMSA in a privileged group is a finding | NPI Ch06 NPI-KRB-08 | covered and cited (kit check exists) | unchanged; no kit change needed |
| Seven-step move to a gMSA; blank password; delete old (differs from dMSA page) | NPI Ch06 | covered and cited | hand procedure with commands in this guide, Migration A |
| Kerberos delegation on a gMSA (`Set-ADAccountControl`) | — | missing | NPI Ch06 verified facts; this guide, special cases |
| dMSA overview, set-up, FAQ, migration limits, events 307–309 | NPI Ch06; Book 02 Ch08/Ch09 | covered and cited | hand procedure in this guide, Migration B |
| Four kinds of on-premises service account (gMSA, sMSA, computer, user); virtual accounts | Book 02 Ch08 (user, sMSA, gMSA, dMSA); Book 06 Ch01 (virtual) | covered, partly | Book 02 Ch08 sentence added; this guide's comparison |
| Find user accounts used as services (SPN, delegation, password never expires) | Book 02 Ch09 discovery script | covered uncited | cited in Book 02 Ch08 and NPI guide Step 1a |
| Govern on-premises service accounts (lifecycle, deprovision) | NPI guide Step 6 | covered in the program's own words | cited in this guide A7 |
| Microsoft Entra Domain Services: custom OU, pre-created KDS root key | — | missing | NPI guide Step 2; this guide, special cases |
| gMSAs for Windows containers (credential spec; per-environment gMSAs; non-domain-joined hosts) | — | missing | this guide, special cases; question for the program owner |
| Cloud Sync agent gMSA (`provAgentgMSA$`, custom gMSA, schema 2012, restricted permissions) | Book 03 Ch05; Book 02 Ch06 verification | covered, partly | Book 03 Ch05 extended; this guide, special cases |
| Entra Connect Sync ADSync account (VSA default, gMSA with remote SQL, set only at install) | — | missing | this guide, special cases |
| SQL Server gMSA support (2014 standalone, 2016 FCI and AG); quick validation checklist | Book 06 Ch01, Ch11 (SPN) | covered, partly | Book 06 Ch01 extended; this guide A1, A4, A5, special cases |
| AD FS farm gMSA (default container, HOST SPN) | — | missing | this guide, special cases |
| Scheduled task with a gMSA (`New-ScheduledTaskPrincipal -LogonType Password`) | Book 02 Ch08; Book 10 App. B | covered (that tasks support gMSAs) | command in this guide A5 |
| Comparison with Entra workload identities; migration to them | Book 02 Ch09 matrix; NPI guide Step 2; NPI Ch05 | covered and cited | one comparison table and Migration C in this guide |

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Four kinds of on-premises service account (gMSA, sMSA, computer, user); deprovision order ends in delete after a business-policy wait | Comparison; A7 | verified | `sam-govern` |
| 2 | sMSA, gMSA, dMSA and virtual accounts; who manages each password; gMSA interval set only at creation through `ManagedPasswordIntervalInDays`; dMSA secret derived from the machine account | Comparison; A3 | verified | `sam-understand` |
| 3 | Service accounts shouldn't be in privileged groups; one account per service; computer accounts can't be audited per service; a gMSA can serve one server | Comparison; Rules; Decision path | verified | `sam-onprem` |
| 4 | User accounts used as services: find by delegation, SPN, password never expires (commands); not recommended; consider moving to Azure | A1; Decision path | verified | `sam-user` |
| 5 | sMSA: one server, not across domains; 240-byte password; 30-day default, tuned by machine account password age policy | Comparison | verified | `sam-smsa` |
| 6 | gMSA: 240-byte random, 30-day rotation; use unless unsupported (failover clustering), then sMSA, then user; test before production; privileged groups a security issue; seven-step move ending in delete; blank password | Comparison; Decision path; A5–A7; Rules | verified | `sam-entra-gmsa` |
| 7 | gMSA prerequisites; Event ID 4004; forest-unique names; outbound-only variant; interval only at creation; `Test-ADServiceAccount`; delegated create right; Account Operators lack it by default; install; uninstall; failover clusters | A2–A5; C5; Special cases | verified | `sam-gmsa-manage` |
| 8 | Always configure AES for managed service accounts | A3 | verified | `sam-gmsa-overview` |
| 9 | KDS: up to 10-hour wait; `Add-KdsRootKey -EffectiveImmediately`; re-created key cached, restart KDC; backdated key for single-DC test environments | A2; Dangers | verified | `sam-kds` |
| 10 | One KDS root key per forest, more than one makes gMSAs fail after rotation; backdated key not for production; delegated create right; separate gMSAs per environment; hosts' group; restart for membership; non-domain-joined hosts with `ccg.exe` and a portable user account; credential spec; containers register no SPNs | A2–A4; Special cases; Questions | verified | `sam-containers` |
| 11 | gMSA delegation set with `Set-ADAccountControl` and `msDS-AllowedToDelegateTo`; no Delegation tab | Special cases | verified | `sam-kcd` |
| 12 | dMSA: machine-bound; gMSA password not machine-bound and can be stolen; helps prevent Kerberoasting; limits (no MSA/gMSA; 14/28 days; 10-hour renewal sites; RWDC; unconstrained delegation; every machine must support); what Start- and Complete- change; state 1 and 2 | Comparison; B | verified | `sam-dmsa-overview` |
| 13 | dMSA set-up: Domain or Enterprise Admins or equivalent; create with `-CreateDelegatedServiceAccount` AES256; start; registry value; restart services; complete; never delete; update retrievers by hand for multi-device; undo; reset; events 307–309 | B | verified; the guide restarts only the one service, as Chapter 06 does | `sam-dmsa-setup` |
| 14 | `Set-ADUser` and `Set-ADServiceAccount` `-ServicePrincipalNames` with `@{Add=…}` / `@{Remove=…}` | A5 | verified (cmdlet references) | `sam-set-aduser`, `sam-set-adsa` |
| 15 | `setspn -L DOMAIN\gMSA$`; each SPN one owner | A5 | verified | `sam-sql-spn`; Book 02 Ch11 |
| 16 | SQL quick validation: `sc.exe qc`, `Get-ADServiceAccount -Properties PrincipalsAllowedToRetrieveManagedPassword`, `Test-ADServiceAccount` True, `sc.exe qmanagedaccount` TRUE | A1; A4; A5; Special cases | verified | `sam-sql-gmsa` |
| 17 | `sc.exe config obj= password=`; the API's password must be NULL for a managed service account | A5; What couldn't be verified | verified; the two pages differ, recorded | `sam-sc-config` |
| 18 | Scheduled task principal: `New-ScheduledTaskPrincipal -UserId DOMAIN\gmsa$ -LogonType Password`; `Set-ScheduledTask -Principal` | A5 | verified (Learn sample) | `sam-task` |
| 19 | IIS application pool: `processModel.userName`, `password`, `identityType = 3`, `Set-Item` | A5 | verified (Learn sample, user and password); the gMSA end to end isn't on Learn, recorded | `sam-iis` |
| 20 | Entra DS: custom OU, not AADDC Users/Computers; KDS root key pre-created, can't create or view | Special cases | verified | `sam-aadds` |
| 21 | Cloud Sync agent: `provAgentgMSA$` or custom gMSA; Domain/Enterprise Admin to create; schema 2012; `Set-AADCloudSyncRestrictedPermissions` | Special cases | verified | `sam-cloudsync`, `sam-cloudsync-cmdlets` |
| 22 | Entra Connect: VSA default; gMSA recommended with remote SQL; service account set only at first installation | Special cases | verified | `sam-connect` |
| 23 | SQL Server: gMSA for standalone from 2014; FCI and AG from 2016 | Special cases | verified | `sam-sql-accounts` |
| 24 | AD FS: gMSA supported; default `CN=Managed Service Accounts` container; `HOST/<adfs_service_name>` SPN | Special cases | verified | `sam-adfs` |
| 25 | Managed identities: system- vs user-assigned; lifecycle; no extra cost; MSAL/Azure.Identity; managed identity as a federated credential | Comparison; C1 | verified | `sam-mi-overview` |
| 26 | `az identity create`, `az identity show --query principalId`, `az role assignment create --assignee-object-id --assignee-principal-type ServicePrincipal` | C1 | verified (Learn CLI sample) | `sam-mi-cli` |
| 27 | Arc: system-assigned identity named like the server; 90-day certificate renewed at 45 days; *Hybrid agent extension applications* group; reconnect to replace a compromised identity | Comparison; C2 | verified | `sam-arc-identity` |
| 28 | Graph app role to an Arc host's identity with `New-MgServicePrincipalAppRoleAssignment` | C2 | verified (Learn sample, shortened to one permission) | `sam-arc-graph` |
| 29 | Credential order: managed identity, platform identity, certificate from a trusted CA in a vault; don't use secrets | Comparison; Rules; C | verified | `sam-app-cred` |
| 30 | Certificate in production from a well-known CA, managed in Key Vault; `az ad app credential reset --cert @file --append`; `az ad app create`; `az ad sp create --id` | C3 | verified | `sam-app-cert`, `sam-az-ad` |
| 31 | Federated credential with `az ad app federated-credential create --parameters credential.json`; fields | C4 | verified | `sam-wif-create`; Chapter 05 |
| 32 | Agent identity: special service principal from a blueprint; no credentials of its own | Comparison | verified | `sam-agent` |

## Restated from the books (by link)

| # | Claim | Where | Book |
|---|---|---|---|
| R1 | Server standard: 2016 gone by January 12, 2027, 2019 minimum, as the workbook's planning assumption | How to read | Book 00, Chapter 01 |
| R2 | Two owners, a federal-employee sponsor; 30-day parallel run; disable, then delete through decommission | Rules; A6–A7 | Non-Person Identity guide, Steps 1f, 5 and 6 |
| R3 | Dispositions `Retire`, `Replatform`, `Keep`, `KeepKerberos`; end-date bounds D08 and program G5 | Decision path | Developer workbook, Chapters 03 and 06 |
| R4 | Federated credential and managed identity facts, government clouds L4 and L5 for Graph | Comparison; C4 | Developer workbook, Chapter 05 |
| R5 | Workload ID Premium licensing and Azure Government availability | Comparison; What couldn't be verified | Book 04, Chapter 05 |
| R6 | Agent ID licensing and government clouds | Comparison | Book 17, Chapter 04 |
| R7 | KSI mapping and control rows | Evidence | Non-Person Identity guide, Evidence; Chapter 06 |

## Where Learn's pages differ

- **Deleting the old account.** The Entra page's move to a gMSA ends by deleting it; the dMSA set-up page says never to. The guide disables and leaves deletion to the decommission process (Chapter 06, research gaps row 55).
- **The backdated KDS root key.** The KDS page reserves it for a single-DC test environment and the containers page says not to use it in production, while the dMSA set-up prerequisites and AD FS's *Configure a federation server* offer it without that caveat. The guide never uses it in production.
- **`msDS-DelegatedMSAState` = 3** is set on the dMSA set-up page with a parameter `Set-ADServiceAccount` doesn't have (Chapter 06, research gaps row 51); the migration path doesn't need it.
- **`sc.exe config` password.** The reference says a password is required for accounts other than LocalSystem; the SCM API says it must be NULL for a managed service account. The guide checks the outcome with `sc.exe qmanagedaccount`.

## Review

`review-status: pending`. The guide waits for the owner's review; it isn't approved here.
