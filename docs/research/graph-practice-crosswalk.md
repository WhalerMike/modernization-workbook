---
title: "Microsoft Practice Crosswalk: Entra, Intune, National Clouds, Arc and SQL"
subtitle: "An explainer: each practice the books recommend, the Microsoft page that defines it, the ScubaGear policy or Azure Policy built-in that checks it, and when the row was last reviewed"
description: "Research draft: a crosswalk from the Entra ID, Intune, national-cloud endpoint, Azure Arc and SQL practices in Books 02, 04, 05, 06, 10 and 15 to the canonical Microsoft Learn page, the CISA ScubaGear policy ID or Azure Policy built-in definition that checks each one, and the date each row was last reviewed."
research-status: draft
research-type: explainer
research-book: "Books 02, 04, 05, 06, 10, 15"
date-modified: 2026-10-25
last-reviewed: 2026-10-25
---

# Microsoft Practice Crosswalk: Entra, Intune, National Clouds, Arc and SQL {.unnumbered}

The books recommend Microsoft practices chapter by chapter: block legacy authentication, require phishing-resistant MFA, put privileged roles behind PIM, make device compliance the access signal, connect servers through Azure Arc, and move SQL Server to Entra authentication. This page puts those practices in one table, so that a reviewer can see for each one where Microsoft defines it, which automated check confirms it, and how fresh the row is.

Each row gives four things:

- **The practice and the book chapter** that recommends it.
- **The canonical Microsoft page:** the Microsoft Learn article that defines the setting, with the date Microsoft last updated it.
- **The check:** a CISA ScubaGear policy ID for Entra ID, which ScubaGear assesses automatically or manually,[^gpc-scuba] or the display name of an Azure Policy built-in definition for Arc and Azure SQL. Where no check exists, the row says so instead of inventing one.
- **Last reviewed:** the date someone last confirmed the row against the source.

::: {.callout-note}
## Why the review date matters
Microsoft pages, ScubaGear policy IDs and Azure Policy names all change. ScubaGear released version 2.0.0 on October 22, 2026, and one policy the books cite now has a different version number in ScubaGear than in CISA's BOD 25-01 list (see [What this found](#what-this-found)). A crosswalk row is only as good as its last review, so every row carries one, and the page's `last-reviewed` date drives the Reviewed column on the [Research](index.md) page and the weekly source-watch issue.
:::

## Entra ID

The ScubaGear Entra ID baseline (`aad.md`) is the source for every ID below, as of the version published with ScubaGear 2.0.0.[^gpc-scuba] The IDs match the ones the books already cite, apart from the one listed under [What this found](#what-this-found). Where the BOD 25-01 Required Configurations list, which binds federal civilian agencies, still uses an older ID, the row gives both.[^gpc-bodlist]

| Practice | Book | Microsoft page | ScubaGear policy | Reviewed |
|---|---|---|---|---|
| Block legacy authentication | [Book 04, Ch 07](../books/b04-access/07-the-conditional-access-policy-library.md) | Block legacy authentication with Conditional Access[^gpc-legacy] | MS.AAD.1.1v1 (SHALL) | 2026-10-25 |
| Block high-risk users and high-risk sign-ins; notify administrators of high-risk users | [Book 04, Ch 03](../books/b04-access/03-the-conditional-access-model.md) | Risk policies, Microsoft Entra ID Protection[^gpc-risk] | MS.AAD.2.1v1, MS.AAD.2.3v1 (SHALL); MS.AAD.2.2v1 (SHOULD) | 2026-10-25 |
| Phishing-resistant MFA for all users, with MFA for everyone until then | [Book 04, Ch 07](../books/b04-access/07-the-conditional-access-policy-library.md) | Conditional Access authentication strengths[^gpc-strength] | MS.AAD.3.1v1, MS.AAD.3.2v2 (SHALL); BOD 25-01 list: MS.AAD.3.2v1 | 2026-10-25 |
| Phishing-resistant MFA for highly privileged roles | [Book 04, Ch 04](../books/b04-access/04-privileged-roles-and-tiers.md) | Conditional Access authentication strengths[^gpc-strength] | MS.AAD.3.6v1 (SHALL) | 2026-10-25 |
| Finish the move to the Authentication methods policy; turn off SMS, voice and email one-time passcodes; show sign-in context in Authenticator | [Book 02, Ch 09](../books/b02-identity/09-building-the-entra-target.md) | How to migrate to the Authentication methods policy[^gpc-methods] | MS.AAD.3.4v1, MS.AAD.3.5v2, MS.AAD.3.3v2 (SHALL) | 2026-10-25 |
| Require managed devices to sign in and to register MFA | [Book 04, Ch 07](../books/b04-access/07-the-conditional-access-policy-library.md) | Device compliance policies in Microsoft Intune[^gpc-compliance] | MS.AAD.3.7v1, MS.AAD.3.8v1 (SHOULD) | 2026-10-25 |
| Block the device code flow | [Book 04, Ch 07](../books/b04-access/07-the-conditional-access-policy-library.md) | Block authentication flows with Conditional Access[^gpc-flows] | MS.AAD.3.9v1 (SHOULD) | 2026-10-25 |
| Send Entra logs to the security operations center | [Book 15, Ch 08](../books/b15-day2-operations/08-control-automation-m365-and-azure.md) | Stream Microsoft Entra logs to an event hub[^gpc-logs] | MS.AAD.4.1v1 (SHALL, manual check) | 2026-10-25 |
| Only administrators register applications; restrict user consent; run an admin consent workflow | [Book 04, Ch 05](../books/b04-access/05-applications-and-workload-identities.md) | Configure how users consent to applications[^gpc-consent]; Configure the admin consent workflow[^gpc-adminconsent] | MS.AAD.5.1v1, MS.AAD.5.2v1, MS.AAD.5.3v1 (SHALL) | 2026-10-25 |
| Block application passwords; cap password lifetime at 180 days and certificate lifetime at 365 days | [Book 04, Ch 05](../books/b04-access/05-applications-and-workload-identities.md) | Configure restrictions on how applications can be configured[^gpc-appmgmt] | MS.AAD.5.5v1, MS.AAD.5.6v1, MS.AAD.5.7v1 (SHOULD) | 2026-10-25 |
| Two to eight Global Administrators; finer-grained roles instead; cloud-only privileged accounts | [Book 04, Ch 04](../books/b04-access/04-privileged-roles-and-tiers.md) | Best practices for Microsoft Entra roles[^gpc-roles] | MS.AAD.7.1v1, MS.AAD.7.2v1, MS.AAD.7.3v1 (SHALL) | 2026-10-25 |
| No permanent active assignments to highly privileged roles; assign them only through PIM; approve Global Administrator activation; alert on assignments and activations | [Book 04, Ch 08](../books/b04-access/08-pim-self-request-with-approval.md) | What is Privileged Identity Management?[^gpc-pim] | MS.AAD.7.4v1 to MS.AAD.7.8v1 (SHALL); MS.AAD.7.9v1 (SHOULD) | 2026-10-25 |
| Limit guest access, guest invitations and invitation domains | [Book 04, Ch 09](../books/b04-access/09-access-governance.md) | Configure external collaboration[^gpc-guests] | MS.AAD.8.1v1, MS.AAD.8.2v1, MS.AAD.8.3v1 (SHOULD) | 2026-10-25 |

## Intune

**ScubaGear has no Intune baseline.** Its baselines cover Entra ID, Defender, Exchange Online, Power Platform, SharePoint and OneDrive, and Teams.[^gpc-scubarepo] Intune practices are therefore checked by reading Intune's own configuration through Microsoft Graph, as [Book 15, Chapter 08](../books/b15-day2-operations/08-control-automation-m365-and-azure.md) describes. The one ScubaGear tie is indirect: MS.AAD.3.7v1 and 3.8v1 require managed devices in Conditional Access, and Intune compliance is what makes a device count as managed.

| Practice | Book | Microsoft page | Check | Reviewed |
|---|---|---|---|---|
| Device compliance policies as the Conditional Access signal | [Book 05, Ch 10](../books/b05-devices/10-operating-and-evidencing-the-fleet.md) | Device compliance policies in Microsoft Intune[^gpc-compliance] | No ScubaGear policy; supports MS.AAD.3.7v1 | 2026-10-25 |
| Security baselines in place of Group Policy | [Book 05, Ch 08](../books/b05-devices/08-gpo-to-intune-policy-migration.md) | Intune security baselines for Windows devices[^gpc-baselines] | No ScubaGear policy; read through Graph | 2026-10-25 |
| Windows Autopilot onboarding | [Book 05, Ch 04](../books/b05-devices/04-intune-first-onboarding.md) | Overview of Windows Autopilot[^gpc-autopilot] | No ScubaGear policy | 2026-10-25 |
| Intune role-based access control and Multi Admin Approval | [Book 05, Ch 06](../books/b05-devices/06-who-owns-the-endpoint.md) | Role-based access control with Microsoft Intune[^gpc-irbac]; Use Multi Admin Approval in Intune[^gpc-maa] | No ScubaGear policy | 2026-10-25 |
| Read and evidence Intune configuration through Microsoft Graph | [Book 15, Ch 08](../books/b15-day2-operations/08-control-automation-m365-and-azure.md) | Working with Intune in Microsoft Graph[^gpc-igraph] | No ScubaGear policy | 2026-10-25 |

## National-cloud endpoints

These rows aren't settings, so there's no check to map. They decide which endpoints every script and collector in the books has to call, so they're reviewed on the same schedule.

| Practice | Book | Microsoft page | What the page says | Reviewed |
|---|---|---|---|---|
| A Microsoft 365 GCC tenant uses the worldwide endpoints | [Book 10, Ch 04](../books/b10-cloud-boundary/04-gcc-and-the-feature-gap.md) | Microsoft Graph national cloud deployments[^gpc-deploy] | `https://graph.microsoft.com` and `https://portal.azure.com` | 2026-10-25 |
| A GCC High tenant uses the US Government L4 endpoints | [Book 10, Ch 04](../books/b10-cloud-boundary/04-gcc-and-the-feature-gap.md) | Microsoft Graph national cloud deployments[^gpc-deploy] | `https://graph.microsoft.us`, `https://portal.azure.us`, sign-in at `https://login.microsoftonline.us` | 2026-10-25 |
| A DoD tenant uses the US Government L5 endpoints | [Book 10, Ch 04](../books/b10-cloud-boundary/04-gcc-and-the-feature-gap.md) | Microsoft Graph national cloud deployments[^gpc-deploy] | `https://dod-graph.microsoft.us` and `https://portal.azure.us` | 2026-10-25 |
| Intune GCC is the commercial instance; GCC High and DoD are a separate government instance, with no built-in migration between them | [Book 05, Ch 04](../books/b05-devices/04-intune-first-onboarding.md) | Microsoft Intune Government Service overview[^gpc-igov] | Devices moving between the two must unenroll and re-enroll | 2026-10-25 |

Graph Explorer isn't supported on the GCC High, DoD or China endpoints,[^gpc-deploy] so a query written and tested in Graph Explorer has to be retested against the government endpoint before a GCC High or DoD collector uses it *(design guidance)*.

## Azure Arc

The Azure Policy names below are the display names in Microsoft's built-in reference for Arc-enabled servers.[^gpc-arcpol]

| Practice | Book | Microsoft page | Azure Policy built-in | Reviewed |
|---|---|---|---|---|
| Connect servers to Arc over Private Link, not the public internet | [Book 05, Ch 09](../books/b05-devices/09-servers-under-azure-arc.md) | Use Azure Private Link to connect servers to Azure Arc[^gpc-arcpl] | "Azure Arc-enabled servers should be configured with an Azure Arc Private Link Scope"; "Azure Arc Private Link Scopes should disable public network access" | 2026-10-25 |
| Keep the agent's network path to the documented endpoints | [Book 05, Ch 09](../books/b05-devices/09-servers-under-azure-arc.md) | Connected Machine agent network requirements[^gpc-arcnet] | None; review the endpoint list for the cloud in use | 2026-10-25 |
| Use the Arc managed identity, not stored secrets, for access to Azure resources | [Book 06, R04](../books/b06-data-platform/r04-arc-deployment-and-managed-identity.md) | Access Azure resources with managed identity on Azure Arc-enabled servers[^gpc-arcmi] | None that fits. The "[Preview]: A managed identity should be enabled on your machines" built-in applies only to resources managed by Automanage | 2026-10-25 |
| Assess and install updates through Azure Update Manager | [Book 05, Ch 09](../books/b05-devices/09-servers-under-azure-arc.md) | Azure Update Manager overview[^gpc-aum] | "Machines should be configured to periodically check for missing system updates"; "System updates should be installed on your machines (powered by Update Center)" | 2026-10-25 |
| Keep extensions current | [Book 05, Ch 09](../books/b05-devices/09-servers-under-azure-arc.md) | Automatic extension upgrade for Azure Arc-enabled servers[^gpc-arcext] | "Configure Azure Arc-enabled Servers to enable automatic upgrades" | 2026-10-25 |
| Collect server telemetry with the Azure Monitor Agent | [Book 15, Ch 08](../books/b15-day2-operations/08-control-automation-m365-and-azure.md) | Azure Monitor Agent overview[^gpc-ama] | "Windows Arc-enabled machines should have Azure Monitor Agent installed"; "Linux Arc-enabled machines should have Azure Monitor Agent installed" | 2026-10-25 |

## SQL Server and Azure SQL

The Arc rows come from the Arc built-in reference;[^gpc-arcpol] the Azure SQL rows come from Microsoft's built-in reference for Azure SQL and the definitions themselves in the Azure Policy repository.[^gpc-sqlpol]

| Practice | Book | Microsoft page | Azure Policy built-in | Reviewed |
|---|---|---|---|---|
| SQL Server 2022 and later on premises authenticates with Entra ID through Arc | [Book 06, Ch 12](../books/b06-data-platform/12-the-engine-authentication-decision.md) | Microsoft Entra authentication for SQL Server overview[^gpc-sqlentra] | None found. Neither built-in reference has a definition that audits Entra authentication on Arc-enabled SQL Server | 2026-10-25 |
| Protect Arc-enabled SQL Server with Defender for SQL and resolve its findings | [Book 06, Ch 09](../books/b06-data-platform/09-what-arc-provides-to-sql-server.md) | Azure Policy built-ins for Arc-enabled servers[^gpc-arcpol] | "Configure Arc-enabled SQL Servers to automatically install Microsoft Defender for SQL"; "SQL servers on machines should have vulnerability findings resolved" | 2026-10-25 |
| Azure SQL: set an Entra administrator, then turn on Entra-only authentication | [Book 06, Ch 12](../books/b06-data-platform/12-the-engine-authentication-decision.md) | Configure Microsoft Entra authentication[^gpc-sqlcfg]; Microsoft Entra-only authentication[^gpc-sqlonly] | "An Azure Active Directory administrator should be provisioned for SQL servers"; "Azure SQL Database should have Microsoft Entra-only authentication enabled" (and "... enabled during creation"); "Azure SQL Managed Instance should have Microsoft Entra-only authentication enabled" | 2026-10-25 |
| Azure SQL: TLS 1.2 or newer and no public network access | [Book 06, Ch 19](../books/b06-data-platform/19-connection-string-migration.md) | Connectivity settings[^gpc-sqlconn] | "Azure SQL Database should be running TLS version 1.2 or newer"; "Public network access on Azure SQL Database should be disabled" | 2026-10-25 |
| Azure SQL: auditing on | [Book 06, R09](../books/b06-data-platform/r09-continuous-monitoring-and-closure.md) | Auditing for Azure SQL Database[^gpc-sqlaudit] | "Auditing on SQL server should be enabled" | 2026-10-25 |

Two notes on the SQL names. The Entra administrator built-in still carries its Azure Active Directory name, at version 1.0.0, even though Microsoft's documentation now says Microsoft Entra;[^gpc-sqlpol] search for it under the old name. And Azure Policy can only stop a server from being *created* without Entra-only authentication: an authorized user can turn it off afterwards, and the server then shows as non-compliant rather than being blocked.[^gpc-sqlonlypol]

## What this found

- **One policy has two version numbers.** [Book 02, Appendix A](../books/b02-identity/appendix-a-federal-requirements-crosswalk.md) and [Book 04, Chapter 07](../books/b04-access/07-the-conditional-access-policy-library.md) cite **MS.AAD.3.2v1**, "if phishing-resistant MFA isn't enforced yet, enforce an alternative MFA method", as CISA's BOD 25-01 Required Configurations list still gives it.[^gpc-bodlist] The ScubaGear 2.0.0 baseline has **MS.AAD.3.2v2**, "MFA SHALL be enforced for all users", last modified February 2026,[^gpc-scuba] so a ScubaGear report shows 3.2v2. Both books now keep the directive's ID and note ScubaGear's. Every other MS.AAD ID cited in the books and decks matches both.
- **Intune has no ScubaGear coverage**, so the Intune rows depend on the Graph evidence approach in Book 15.
- **Arc-enabled SQL Server has no built-in policy for Entra authentication.** Proving it needs a custom check, for example a query of the instance's logins, which is the authentication audit in [Book 06, Chapter 07](../books/b06-data-platform/07-the-authentication-audit.md) *(inference)*.

## Status and review

**Draft.** Every row was checked against its source on October 25, 2026: the ScubaGear 2.0.0 Entra baseline, Microsoft Learn, and Microsoft's built-in Azure Policy references and definitions. To move this page to **In review**, a reviewer should confirm each row and check the book links. To move it to **Proved**, run ScubaGear and an Azure Policy compliance scan in a test tenant and subscription, record which rows pass, and add the evidence here.

**Keeping it fresh.** The page's `last-reviewed` date shows in the status box above and in the Reviewed column on the [Research](index.md) page. Any research page not reviewed for more than 90 days is flagged in the box, and listed in the weekly source-watch issue until someone reviews it. When you review a row, update its date; when you review the whole page, update `last-reviewed`. Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

Related: the Microsoft automation reference, [Module 1: Foundations](ms-automation-foundations.md) and [Module 2: Microsoft Entra ID](ms-automation-entra.md); [Book 04 — Access & Privilege](../books/b04-access/index.md), [Book 05 — Devices & Endpoints](../books/b05-devices/index.md), [Book 06 — Data Platform](../books/b06-data-platform/index.md), [Book 10 — Cloud Boundary](../books/b10-cloud-boundary/index.md) and [Book 15 — Day-2 Operations](../books/b15-day2-operations/index.md).

[^gpc-scuba]: CISA, ScubaGear, "Microsoft Entra ID" secure configuration baseline (`aad.md`, policies MS.AAD.1.1v1 to MS.AAD.9.1v1; file last changed October 22, 2026, with release v2.0.0), <https://github.com/cisagov/ScubaGear/blob/main/PowerShell/ScubaGear/baselines/aad.md>, accessed October 25, 2026.
[^gpc-bodlist]: Cybersecurity and Infrastructure Security Agency, "BOD 25-01: Implementing Secure Practices for Cloud Services, Required Configurations" (lists MS.AAD.3.2v1), <https://www.cisa.gov/resources-tools/services/bod-25-01-implementing-secure-practices-cloud-services-required-configurations>, accessed October 25, 2026.
[^gpc-scubarepo]: CISA, ScubaGear repository, baselines folder, <https://github.com/cisagov/ScubaGear/tree/main/PowerShell/ScubaGear/baselines>, accessed October 25, 2026.
[^gpc-legacy]: Microsoft Learn, "Block legacy authentication with Conditional Access" (updated March 24, 2026), <https://learn.microsoft.com/en-us/entra/identity/conditional-access/policy-block-legacy-authentication>, accessed October 25, 2026.
[^gpc-risk]: Microsoft Learn, "Risk policies" (updated October 30, 2025), <https://learn.microsoft.com/en-us/entra/id-protection/howto-identity-protection-configure-risk-policies>, accessed October 25, 2026.
[^gpc-strength]: Microsoft Learn, "Overview of Conditional Access authentication strengths" (updated March 4, 2025), <https://learn.microsoft.com/en-us/entra/identity/authentication/concept-authentication-strengths>, accessed October 25, 2026.
[^gpc-methods]: Microsoft Learn, "How to migrate to the Authentication methods policy" (updated January 15, 2026), <https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-authentication-methods-manage>, accessed October 25, 2026.
[^gpc-flows]: Microsoft Learn, "Block authentication flows with Conditional Access policy" (updated March 24, 2026), <https://learn.microsoft.com/en-us/entra/identity/conditional-access/policy-block-authentication-flows>, accessed October 25, 2026.
[^gpc-logs]: Microsoft Learn, "Stream Microsoft Entra logs to an event hub" (updated September 27, 2024), <https://learn.microsoft.com/en-us/entra/identity/monitoring-health/howto-stream-logs-to-event-hub>, accessed October 25, 2026.
[^gpc-consent]: Microsoft Learn, "Configure how users consent to applications" (updated June 15, 2025), <https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/configure-user-consent>, accessed October 25, 2026.
[^gpc-adminconsent]: Microsoft Learn, "Configure the admin consent workflow" (updated December 29, 2024), <https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/configure-admin-consent-workflow>, accessed October 25, 2026.
[^gpc-appmgmt]: Microsoft Learn, "Configure restrictions on how applications can be configured" (app management policies; updated July 23, 2025), <https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/configure-app-management-policies>, accessed October 25, 2026.
[^gpc-roles]: Microsoft Learn, "Best practices for Microsoft Entra roles" (updated June 1, 2026), <https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/best-practices>, accessed October 25, 2026.
[^gpc-pim]: Microsoft Learn, "What is Privileged Identity Management?" (updated April 23, 2026), <https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-configure>, accessed October 25, 2026.
[^gpc-guests]: Microsoft Learn, "Configure external collaboration" (updated April 24, 2026), <https://learn.microsoft.com/en-us/entra/external-id/external-collaboration-settings-configure>, accessed October 25, 2026.
[^gpc-compliance]: Microsoft Learn, "Device compliance policies in Microsoft Intune" (updated July 2, 2026), <https://learn.microsoft.com/en-us/intune/device-security/compliance/overview>, accessed October 25, 2026.
[^gpc-baselines]: Microsoft Learn, "Learn about Intune security baselines for Windows devices" (updated September 30, 2026), <https://learn.microsoft.com/en-us/intune/device-security/security-baselines/overview>, accessed October 25, 2026.
[^gpc-autopilot]: Microsoft Learn, "Overview of Windows Autopilot" (updated June 13, 2025), <https://learn.microsoft.com/en-us/autopilot/overview>, accessed October 25, 2026.
[^gpc-irbac]: Microsoft Learn, "Role-based access control (RBAC) with Microsoft Intune" (updated March 24, 2026), <https://learn.microsoft.com/en-us/intune/fundamentals/role-based-access-control/overview>, accessed October 25, 2026.
[^gpc-maa]: Microsoft Learn, "Use Multi Admin Approval in Intune" (updated July 30, 2026), <https://learn.microsoft.com/en-us/intune/fundamentals/role-based-access-control/multi-admin-approval>, accessed October 25, 2026.
[^gpc-igraph]: Microsoft Learn, "Working with Intune in Microsoft Graph" (updated September 25, 2024), <https://learn.microsoft.com/en-us/graph/api/resources/intune-graph-overview>, accessed October 25, 2026.
[^gpc-deploy]: Microsoft Learn, "Microsoft Graph national cloud deployments" (updated January 30, 2025): GCC tenants "continue using the worldwide endpoints"; GCC High uses `graph.microsoft.us` and `portal.azure.us`; DoD uses `dod-graph.microsoft.us`; Graph Explorer is not supported on the national clouds, <https://learn.microsoft.com/en-us/graph/deployments>, accessed October 25, 2026.
[^gpc-igov]: Microsoft Learn, "Microsoft Intune Government Service overview" (updated October 2, 2026): Intune has no separate GCC instance, GCC High and DoD share the government instance, and there's no built-in migration between the commercial service and the government cloud, <https://learn.microsoft.com/en-us/intune/fundamentals/government-service>, accessed October 25, 2026.
[^gpc-arcpol]: Microsoft Learn, "Azure Policy built-in definitions for Azure Arc-enabled servers" (updated February 12, 2026), <https://learn.microsoft.com/en-us/azure/azure-arc/servers/policy-reference>, accessed October 25, 2026.
[^gpc-arcpl]: Microsoft Learn, "Use Azure Private Link to connect servers to Azure Arc by using a private endpoint" (updated May 4, 2026), <https://learn.microsoft.com/en-us/azure/azure-arc/servers/private-link-security>, accessed October 25, 2026.
[^gpc-arcnet]: Microsoft Learn, "Connected Machine agent network requirements" (updated April 1, 2026), <https://learn.microsoft.com/en-us/azure/azure-arc/servers/network-requirements>, accessed October 25, 2026.
[^gpc-arcmi]: Microsoft Learn, "Access Azure resources with managed identity on Azure Arc-enabled servers" (updated February 5, 2026), <https://learn.microsoft.com/en-us/azure/azure-arc/servers/managed-identity-authentication>, accessed October 25, 2026.
[^gpc-aum]: Microsoft Learn, "Azure Update Manager overview" (updated February 3, 2025), <https://learn.microsoft.com/en-us/azure/update-manager/overview>, accessed October 25, 2026.
[^gpc-arcext]: Microsoft Learn, "Automatic extension upgrade for Azure Arc-enabled servers" (updated November 11, 2025), <https://learn.microsoft.com/en-us/azure/azure-arc/servers/manage-automatic-vm-extension-upgrade>, accessed October 25, 2026.
[^gpc-ama]: Microsoft Learn, "Azure Monitor Agent overview" (updated April 9, 2026), <https://learn.microsoft.com/en-us/azure/azure-monitor/agents/azure-monitor-agent-overview>, accessed October 25, 2026.
[^gpc-sqlpol]: Microsoft Learn, "Built-in policy definitions for Azure SQL Database", <https://learn.microsoft.com/en-us/azure/azure-sql/database/policy-reference>; and the definitions in the Azure Policy repository, e.g. `SQL_DB_AuditServerADAdmins_Audit.json` (display name "An Azure Active Directory administrator should be provisioned for SQL servers", version 1.0.0), <https://github.com/Azure/azure-policy/tree/master/built-in-policies/policyDefinitions/SQL>, both accessed October 25, 2026.
[^gpc-sqlentra]: Microsoft Learn, "Microsoft Entra authentication for SQL Server overview" (updated November 4, 2025), <https://learn.microsoft.com/en-us/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview>, accessed October 25, 2026.
[^gpc-sqlcfg]: Microsoft Learn, "Configure Microsoft Entra authentication" for Azure SQL Database and SQL Managed Instance (updated October 7, 2026), <https://learn.microsoft.com/en-us/azure/azure-sql/database/authentication-aad-configure>, accessed October 25, 2026.
[^gpc-sqlonly]: Microsoft Learn, "Microsoft Entra-only authentication" for Azure SQL Database and SQL Managed Instance (updated October 7, 2026): the Entra administrator must be set first, <https://learn.microsoft.com/en-us/azure/azure-sql/database/authentication-azure-ad-only-authentication>, accessed October 25, 2026.
[^gpc-sqlonlypol]: Microsoft Learn, "Azure Policy for Microsoft Entra-only authentication with Azure SQL" (limitations), <https://learn.microsoft.com/en-us/azure/azure-sql/database/authentication-azure-ad-only-authentication-policy>, accessed October 25, 2026.
[^gpc-sqlconn]: Microsoft Learn, "Connectivity settings" for Azure SQL Database (updated October 20, 2026), <https://learn.microsoft.com/en-us/azure/azure-sql/database/connectivity-settings>, accessed October 25, 2026.
[^gpc-sqlaudit]: Microsoft Learn, "Auditing for Azure SQL Database" (updated October 5, 2026), <https://learn.microsoft.com/en-us/azure/azure-sql/database/auditing-overview>, accessed October 25, 2026.
