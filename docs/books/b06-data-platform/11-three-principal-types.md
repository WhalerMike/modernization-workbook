---
title: "Chapter 11 — Three Principal Types: User, Group, Service Principal"
description: "The FROM EXTERNAL PROVIDER syntax that creates token-validated logins, the three Entra principal types those logins map to, and the three-phase parallel run that creates and validates new logins before disabling the old ones."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b06-data-platform
book: B06
part: What
series-order: 11
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Chapter 11 — Three Principal Types: User, Group, Service Principal

*This is the moment the engine stops accepting Kerberos and NTLM and starts accepting Entra-issued tokens.*

::: {.callout-note}
## In this chapter
The `FROM EXTERNAL PROVIDER` syntax that creates type-E and type-X logins validated by token at connect time, the three principal types those logins map to (Entra user, Entra security group and Entra service principal), and the three-phase parallel-run pattern that creates and validates the new logins before disabling the old ones.[^c11-create-login]
:::

Everything in Chapters 01 through 10 is prerequisite; everything in Chapters 14 through 22 is consequence. This chapter and the next are the migration itself, performed only on the instances [Chapter 06](06-retain-consolidate-retire.md) classified **retain** or **consolidation target**, using the three-phase parallel-run pattern that the SQL Server engine-authentication decision makes normative. In the program's dependency chain they are steps 5 and 7: introduce Entra principals, then remove legacy principals. The hands-on procedure is in [Runbook R05](r05-login-migration-and-parallel-run.md).

![Every legacy login type maps to an Entra principal.](../../images/sql-server/diagrams/svg/book-05-principal-mapping.svg){fig-alt="Type U Windows users map to type E Entra users, type G Windows groups to type X Entra groups, type S SQL logins to Entra applications (a managed identity or service principal), and sa is disabled and renamed rather than migrated."}

This is the technical heart of the book: the engine stops accepting Kerberos tickets and NTLM exchanges and starts accepting Entra ID OAuth 2.0 access tokens, which Entra ID issues only after its sign-in conditions (identity, group membership, device compliance, MFA) are met. The SQL Server engine-authentication decision records the canonical sequence this chapter follows.

## The FROM EXTERNAL PROVIDER syntax

![A connection with an Entra login: the client gets a token for the SQL audience and the engine validates it.](../../images/sql-server/diagrams/svg/book-05-ch01-token-authentication-flow.svg){fig-alt="Sequence diagram between client, Microsoft Entra ID and SQL Server: the client signs in, Conditional Access is evaluated, a token for https://database.windows.net/ is issued, and SQL Server validates it and maps it to a type E or X login."}

SQL Server 2022's `CREATE LOGIN [principal] FROM EXTERNAL PROVIDER` maps an Entra principal to a login with no Active Directory involvement. For a user the name is the user principal name (UPN); for a group or an application it's the object's display name, and it must match an existing principal in the tenant the instance is enabled with.[^c11-create-login][^c11-appreg-2022] The login is stored in `master` as a passwordless external principal whose SID is the binary form of the Entra object ID (or, for an application, its client ID).[^c11-principals] At connection time the client presents an access token whose audience is `https://database.windows.net/`; the engine validates it, maps the identity to the login, and, if the login is enabled, applies its permissions and database roles.[^c11-entra-sql]

The syntax requires Entra authentication to be configured on the instance (an app registration on 2022, the primary managed identity on 2025), which on the program's path the Azure extension for SQL Server does.[^c11-arc-sql][^c11-entra-sql][^c11-mi-2025] `CREATE LOGIN` looks the principal up through Microsoft Graph, which is why the instance's identity needs Graph read permissions; without admin consent for them, login creation fails.[^c11-automation] Verify that each principal exists before creating its login, to avoid orphaned logins that map to deleted or renamed principals. On SQL Server 2025, `WITH OBJECT_ID` pins a login to a specific object ID, which resolves display names that aren't unique.[^c11-create-login]

Two client-side facts shape everything after this. Connections authenticated by Entra ID are always encrypted, so clients must trust the instance's TLS certificate.[^c11-appreg-2022] And the drivers and tools must support the Entra authentication methods: default, password, integrated, interactive with MFA, service principal, managed identity and access token.[^c11-entra-sql]

## Type 1: Entra user login

For human DBAs and developers, a `CREATE LOGIN [DOMAIN\username] FROM WINDOWS` login gets a type-E counterpart for the same person's UPN: `CREATE LOGIN [username@tenant.onmicrosoft.com] FROM EXTERNAL PROVIDER`. UPNs can differ from SAM account names where UPN synchronization was never standardized, so the audit captures the UPN-to-SAMAccountName mapping for every Windows login first. The user then signs in with whatever Entra authentication method Conditional Access requires, with one exception: FIDO2 security keys aren't currently supported for Entra authentication to SQL Server on Arc-enabled machines.[^c11-mi-2025][^c11-ca]

The engine has no MFA logic. Conditional Access enforces MFA, device compliance, named locations and sign-in risk before the token is issued;[^c11-ca][^c11-idp] if they fail, no token is issued and the connection never opens. There's no SQL-level MFA prompt and no SQL-level bypass. Microsoft's guidance for Azure SQL targets these policies at the **Azure SQL Database** enterprise application, the resource behind the `https://database.windows.net/` audience; Conditional Access needs at least Microsoft Entra ID P1 (sign-in risk conditions need ID Protection, a P2 feature), and these policies apply to users, not to programmatic connections by service principals or managed identities.[^c11-ca-sql][^c11-ca] Service principals can be targeted only through Conditional Access for workload identities, a separately licensed capability.[^c11-ca] None of these controls apply to Windows Authentication or NTLM connections.

## Type 2: Entra group login

A SQL Server login can be created for an Entra ID security group rather than an individual user: `CREATE LOGIN [GroupDisplayName] FROM EXTERNAL PROVIDER`. When a member of that group connects with an Entra token, the engine maps the user to the group login and grants the permissions associated with it.[^c11-appreg-2022]

It's the familiar AD group pattern, with Entra group membership in place of SID resolution and Kerberos PAC membership. Group logins appear in `sys.server_principals` as type `X` (`EXTERNAL_GROUP`), distinct from type `E`.[^c11-principals] When the group is a dynamic membership group whose rule reads HR-sourced attributes, Entra ID adds and removes members as those attributes change, so users gain and lose SQL Server access with no `CREATE USER` or `DROP USER`.[^c11-dyn] Dynamic membership needs Microsoft Entra ID P1 for each unique member, and the access is only as strong as the write controls on the attributes the rule reads.[^c11-dyn] [Chapter 16](16-groups-roles-and-membership.md) and [Chapter 17](17-dynamic-membership-delegation-and-privilege.md) cover designing and governing those groups.

## Type 3: Entra service principal login

ETL pipelines, reporting services, API backends and monitoring agents replace their SQL Authentication account (a type-S login with a stored password) with a login for an Entra application: `CREATE LOGIN [ApplicationDisplayName] FROM EXTERNAL PROVIDER`. This removes passwords from connection strings, configuration files, logs and repositories, along with their rotation.

Preferably the application uses a managed identity and holds no credential. On an Arc-enabled server, `ManagedIdentityCredential` in the Azure Identity library supports the server's managed identity at the agent's local endpoint (`localhost:40342`); `DefaultAzureCredential` tries it too, but Microsoft recommends a specific credential rather than `DefaultAzureCredential` in production.[^c11-azure-identity][^c11-dac] The process account must be in the local Hybrid Agent Extension Applications group (or Administrators) to obtain the token.[^c11-arc-mi-endpoint] Remember what that identity is: the Arc identity belongs to the server, so every process permitted to read it presents the same principal. One login per server is the honest unit of attribution, not one per application. Azure VMs, Container Instances and App Service use their platform managed identity. Where a credential is unavoidable, use a client certificate stored in Key Vault, never a client secret or a file.

## The parallel-run migration pattern

![The required three-phase parallel run for production.](../../images/sql-server/diagrams/svg/book-05-ch01-parallel-run.svg){fig-alt="Phase 1 creates an E or X login for every migrating login, phase 2 validates a real Entra sign-in for each, phase 3 disables but doesn't drop the old login, and after 30 days with no residual use the old login is dropped."}

No Windows login is dropped until its Entra equivalent is validated. The engine-authentication decision makes this three-phase parallel run required for production:

1. **Create.** For every migrating Windows login, user or group, create the `FROM EXTERNAL PROVIDER` login for the corresponding Entra principal. Verify each mapping first; a principal with no confirmed Entra equivalent is a blocking finding. This mapping, built from the authentication audit's AD inventory and Entra's UPN and group data, is the most labor-intensive step.
2. **Validate.** Test each new login with the principal's real Entra credential before any legacy login is touched.
3. **Disable, observe, drop.** Disable (don't drop) the legacy Windows and SQL Authentication logins, monitor for 30 days to confirm nothing depends on them, then drop them.

Observation needs evidence, not silence. Login metadata tells you what exists; only auditing tells you what's used. Microsoft's own migration sequence for retiring SQL authentication uses SQL Server Audit with the `SUCCESSFUL_LOGIN_GROUP` action group to see which logins still connect, and checks for password-based contained database users too.[^c11-disable-sql] On SQL Server 2025 enabled by Azure Arc, the end state can then be enforced: the Disable SQL Authentication setting blocks new SQL-authentication logins (including `sa`) without a restart, is reversible from the portal, and requires the primary managed identity.[^c11-disable-sql]

Non-production instances may shorten the observation window with documented owner sign-off, but create→validate→disable→observe→drop is the canonical sequence. Other platforms document the same side-by-side premise: Google's Cloud SQL for SQL Server lets Entra ID authentication be enabled without disabling existing Active Directory authentication during a phased migration.[^c11-gcp] [Chapter 12](12-the-engine-authentication-decision.md) records the decisions around it.

::: {.callout-note title="What this chapter establishes"}
1. `FROM EXTERNAL PROVIDER` creates passwordless logins for Entra users and applications (type E) and groups (type X), authenticated by Entra-issued tokens.
2. MFA and other sign-in conditions are enforced by Conditional Access in the Entra plane, for users only, not by the engine; FIDO2 isn't yet supported for SQL Server on Arc.
3. Migration is the parallel run: create, validate, disable (not drop) the legacy login, observe for 30 days with audit evidence, then drop.
:::

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 10 — Arc Deployment Sequencing for SQL Server Hosts](10-arc-deployment-sequencing.md) · [Book index](index.md) · [Next: Chapter 12 — What the Engine-Authentication Decision Settles →](12-the-engine-authentication-decision.md)
:::

[^c11-create-login]: Microsoft Learn, "CREATE LOGIN (Transact-SQL)," <https://learn.microsoft.com/sql/t-sql/statements/create-login-transact-sql> (accessed Oct 20, 2026).
[^c11-appreg-2022]: Microsoft Learn, "Tutorial: Set up Microsoft Entra authentication for SQL Server enabled by Azure Arc," create logins and users, <https://learn.microsoft.com/sql/sql-server/azure-arc/entra-authentication-setup-tutorial> (accessed Oct 20, 2026).
[^c11-principals]: Microsoft Learn, "sys.server_principals (Transact-SQL)," <https://learn.microsoft.com/sql/relational-databases/system-catalog-views/sys-server-principals-transact-sql> (accessed Oct 20, 2026).
[^c11-entra-sql]: Microsoft Learn, "Microsoft Entra authentication for SQL Server," <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview> (accessed Oct 20, 2026).
[^c11-arc-sql]: Microsoft Learn, "SQL Server enabled by Azure Arc" (overview), <https://learn.microsoft.com/sql/sql-server/azure-arc/overview> (accessed Oct 20, 2026).
[^c11-mi-2025]: Microsoft Learn, "Managed identity for SQL Server enabled by Azure Arc," limitations, <https://learn.microsoft.com/sql/sql-server/azure-arc/managed-identity> (accessed Oct 20, 2026).
[^c11-automation]: Microsoft Learn, "Tutorial: Using automation to set up the Microsoft Entra admin for SQL Server," grant admin consent, <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-automation-setup-tutorial> (accessed Oct 20, 2026).
[^c11-ca]: Microsoft Learn, "What is Conditional Access?," <https://learn.microsoft.com/entra/identity/conditional-access/overview> (accessed Oct 20, 2026).
[^c11-idp]: Microsoft Learn, "What is Microsoft Entra ID Protection?," <https://learn.microsoft.com/entra/id-protection/overview-identity-protection> (accessed Oct 20, 2026).
[^c11-ca-sql]: Microsoft Learn, "Conditional access" (Azure SQL Database, Azure SQL Managed Instance and Azure Synapse Analytics), <https://learn.microsoft.com/azure/azure-sql/database/conditional-access-configure> (accessed Oct 20, 2026).
[^c11-dyn]: Microsoft Learn, "Manage rules for dynamic membership groups in Microsoft Entra ID," considerations and license requirements, <https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership> (accessed Oct 20, 2026).
[^c11-azure-identity]: Microsoft Learn, "Azure Identity client library for .NET," managed identity support, <https://learn.microsoft.com/dotnet/api/overview/azure/identity-readme> (accessed Oct 20, 2026).
[^c11-dac]: Microsoft Learn, "DefaultAzureCredential Class," <https://learn.microsoft.com/dotnet/api/azure.identity.defaultazurecredential> (accessed Oct 20, 2026).
[^c11-arc-mi-endpoint]: Microsoft Learn, "Access Azure resources by using managed identity on Azure Arc-enabled servers," <https://learn.microsoft.com/azure/azure-arc/servers/managed-identity-authentication> (accessed Oct 20, 2026).
[^c11-disable-sql]: Microsoft Learn, "Disable SQL authentication for SQL Server enabled by Azure Arc," <https://learn.microsoft.com/sql/sql-server/azure-arc/disable-sql-authentication> (accessed Oct 20, 2026).
[^c11-gcp]: Third-party source (Google Cloud documentation), "Integration with Microsoft Entra ID — Cloud SQL for SQL Server," migration from Microsoft Active Directory, <https://docs.cloud.google.com/sql/docs/sqlserver/integration-with-microsoft-entra-id> (accessed Oct 20, 2026).
