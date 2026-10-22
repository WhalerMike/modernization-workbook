# Book 06 — Data Platform: SQL Server Identity, Technical Deep Dive — narration script (practice copy)

## Slide 1 — SQL Server Identity: Strategy and the DBA Runbooks

This is the technical deep dive for Book 06 of the Federal Modernization Workbook: Data Platform, SQL Server Identity. The book moves the SQL Server estate off Windows Authentication and onto Microsoft Entra ID, and this session is for the people who do that work: database administrators, the identity and server teams beside them, and the security staff who sign off.

It runs about fifty minutes, in two parts. Part 1 is the strategy, in three modules: why the inheritance must end and how the estate is rationalized; the authentication audit, the three principal types and the engine-authentication decision; and NTLM elimination, applications and the closure condition. Part 2 walks the ten runbooks in the order a DBA runs them. For each one: what it does, the gate it must pass, and the evidence it leaves.

One convention throughout. April 1, 2027 is the program's own NTLM backstop, not a Microsoft deadline, and I'll say which dates are external.

## Slide 2 — Module 1 — The inheritance and the estate

Module 1: the inheritance and the estate. Three slides. First, what Windows Authentication in SQL Server actually is, precisely enough to see where NTLM hides. Second, the three drivers that end it, and the 2027 dates that are real. Third, the inventory, the rationalization lenses and the retain, consolidate or retire gate, which decides which instances enter the migration at all. The book's whole order, assess and consolidate, enable Arc, migrate logins, then eliminate NTLM, comes out of this module.

## Slide 3 — Windows Authentication, precisely

Start with what the engine actually does. SQL Server doesn't check the password for a Windows login. It trusts the Windows principal token, and Windows Authentication is always available; it can't be disabled.

With Integrated Security, the driver hands off to SSPI, the Security Support Provider Interface, and its Negotiate package picks Kerberos unless one of the systems can't use it. The client asks the KDC on a domain controller for a service ticket to the instance's SPN, which for TCP names the SQL Server service class, the host's fully qualified name and the port. The engine validates the ticket with the service account's key. No password crosses the network, and Kerberos authenticates both ends.

The table is Microsoft's authentication defaults, and it's the one to remember. When the SPN maps to the correct account, remote connections use Kerberos, but local connections use NTLM. When the SPN is missing or the lookup fails, both use NTLM. When it's on the wrong account, authentication fails outright.

That silent fallback is the most consequential fault in the inheritance. The engine logs a failed SPN registration at startup, but not which protocol each connection used; only the auth scheme column of the connections DMV shows that. And none of these paths produces an Entra sign-in, so Conditional Access has nothing to evaluate.

The identities are anchored in Active Directory too: a domain account with a hand-rotated password, a group managed service account the domain controller rotates every thirty days by default, or the virtual account, which reaches the network as the computer account. And the SA login, created disabled in Windows mode, is often left enabled as an emergency way in.

None of this was a mistake. It was correct engineering for a domain-joined world that no longer exists.

## Slide 4 — Three drivers end it; four 2027 dates are real

Three drivers end the inheritance, and each is as well reasoned as the original design.

The first is NTLM. Microsoft deprecated every version, LAN Manager and NTLM versions 1 and 2, in June 2024. Version 1 is already removed from Windows Server 2025 and Windows 11 version 24H2; version 2 still works there. Microsoft's next step is to disable network NTLM by default in the next major Windows release, subject to change and with no calendar date. So the program set its own backstop: on April 1, 2027 its enforcement phase blocks NTLM across the estate. That isn't the completion date. It's the date by which consolidation, Arc, login migration and connection strings must already be done.

The second is zero trust. M-22-09 requires phishing-resistant MFA enforced at the application layer, with a device-level signal. Conditional Access can act only on an Entra token request; a Kerberos or NTLM exchange never asks it. Risk-based policies need Entra ID P2.

The third is the engine's own identity. When Active Directory stops being the identity source, the engine's service accounts lose their governance foundation, so the engine needs an Entra identity first, which on premises comes through Azure Arc.

What's actually due in 2027 are lifecycle dates. Windows Server 2016 leaves extended support on January 12. SQL Server 2014's final extended-security-update year ends on July 12, and SQL Server 2016's first on July 13. SQL Server 2017 leaves support on October 12. None of those versions can take Entra logins, so they're consolidation candidates, not in-place migrations.

The dependencies set the order: assess and consolidate, enable Arc, migrate logins, then eliminate NTLM.

## Slide 5 — Inventory, rationalize, then gate

Before any authentication work, the estate has to be counted, because a twenty-year estate doesn't know what it has. The instances that matter most are the ones nobody manages, so they're discovered, not retrieved from a list, with three instruments that are each blind to what the others find.

A network and directory sweep listens: the default instance on TCP 1433, named instances on dynamic ports, and the Browser service on UDP 1434. The community dbatools module's Find-DbaInstance combines those signals, after the program's software approval. The SPN trail is independent: a forest-wide SetSPN query lists every instance ever registered for Kerberos, though not the ones whose registration failed. And Microsoft's assessment tooling adds workload and dependency data: Azure Migrate, the MAP Toolkit, and the migration component in Management Studio, since the Data Migration Assistant was retired on July 16, 2025.

Then three lenses. Utilization finds zombies: no connections in over a year, no restores, a retired owning application. Retiring them is the fastest way to shrink the migration surface. Version is a primary input, because Entra logins need SQL Server 2022 or later, and 2008 and 2008 R2 can't upgrade in place. Dependencies most often overturn a naive plan: linked servers, replication, SSIS packages and the quarterly cross-database query.

The lenses resolve into one verdict per instance. Retain goes straight to the audit. Consolidate moves the workload and retires the source. Retire removes the instance and every login it carries. Targets are chosen during the assessment, standalone or availability-group SQL Server on Arc hosts, since failover cluster instances can't use Entra authentication, or Azure SQL, so authentication is migrated once, in its final shape. And record the constraints honestly.

## Slide 6 — Module 2 — The audit, the principals and the decision

Module 2: the audit, the principals and the decision. Four slides. What the authentication audit reads on every surviving instance, and why its output is a compliance record rather than a spreadsheet. The three Arc-eligibility categories, and the distinction between the engine and the operating system moving to Entra ID. The three principal types that replace Windows and SQL logins. And the parallel run, with the five decisions that turn the migration pattern into enforceable policy.

## Slide 7 — What the authentication audit reads

The audit runs only on what the gate kept, retain instances and consolidation targets, and its deliverable is a per-instance compliance record.

For each host it records every instance, with version, edition and build, and the host operating system, which sets the Arc envelope. The Connected Machine agent runs on Windows Server 2012 through 2025, SQL Server enabled by Arc needs 2016 or later, and the program sets its own floor at Windows Server 2019, because 2016 leaves support in January 2027. It records domain-join state and whether the Arc agent and managed identity are present.

Then the authentication mode. The registry value LoginMode is one for Windows Authentication mode and two for mixed. The audit cross-checks it against the running instance with the Is Integrated Security Only server property, because a mode change takes effect only after a restart, and any disagreement is an anomaly to resolve before migrating. On SQL Server 2025 enabled by Arc it also reads Is External Authentication Only, which shows the Disable SQL Authentication setting.

Every login is classified by its type in sys.server_principals: U, a Windows user; G, a Windows group; S, a SQL login; C and K, certificate- and key-mapped; and E and X, Entra logins already present. The letters are the view's values, not mnemonics. There's no type W, and a query written against one returns zero rows and reports a clean instance. Active SQL logins are a critical finding, and an enabled SA with a non-rotated password is the highest-priority finding of all.

The audit captures the engine's service account and checks its SPN. And each run is compared with the last: a new SQL login, a revert to mixed mode, or a new passthrough linked server is drift, and drift is a compliance violation.

## Slide 8 — Arc eligibility: three categories, two layers

The audit's most consequential output is a category for every instance, framed around Arc because Arc is the program's path to Entra authentication.

Category 1 is Entra-auth-ready: the Connected Machine agent is running, the Azure extension for SQL Server is deployed, Entra authentication is configured and the engine is SQL Server 2022 or later. There the audit's job is a precise login inventory, and migration starts now.

Category 2 is Arc-eligible but not enabled. Prioritize by the audit: instances with many Windows logins, active SQL logins or missing SPNs go first. The deployment is a server action, not a SQL Server change; when the agent connects a server with SQL Server installed, Arc installs the extension automatically. Once Entra authentication is configured, the instance becomes Category 1 on the next run.

Category 3 isn't yet eligible. An engine older than 2022 can't accept Entra logins, with or without Arc, so it upgrades and follows the Category 2 path, or carries an exception with a sunset date. Failover cluster instances belong here on any version, because Entra authentication isn't supported on them. And an exception doesn't save an instance from the program's NTLM block, which is applied in the operating system's security layer, not in the engine.

Then the distinction the book calls the most common misunderstanding. Layer 1 is the engine accepting Entra tokens: SQL Server 2022 or later, not a cluster instance, plus Arc and the extension. It doesn't need the server unjoined or Windows Server 2025; a domain-joined Windows Server 2019 host can have Entra logins today. Layer 2 is administrators signing in to the server itself with Entra ID. That needs Windows Server 2025 with Desktop Experience and Entra-joins the server, so it's a separate program, sequenced on its own.

## Slide 9 — Three principal types replace Windows logins

This is where the engine stops accepting Kerberos tickets and NTLM exchanges and starts accepting Entra-issued OAuth 2.0 access tokens.

The mechanism is CREATE LOGIN FROM EXTERNAL PROVIDER, on SQL Server 2022 and later. The login is a passwordless external principal in master. At connection time the client presents a token whose audience is database.windows.net, and the engine validates it and maps it to the login. CREATE LOGIN looks the principal up through Microsoft Graph, so the instance's identity needs Graph read permissions with admin consent, or login creation fails. On SQL Server 2025, WITH OBJECT_ID pins a login when display names aren't unique. And Entra connections are always encrypted, so clients must trust the instance's certificate.

Three types. An Entra user login, type E, named by the user principal name; UPNs can differ from SAM account names, so the audit captures that mapping first. The engine has no MFA logic. Conditional Access enforces MFA, device compliance and sign-in risk before the token is issued, with no SQL-level prompt and no SQL-level bypass. One limit: FIDO2 security keys aren't yet supported for Entra authentication to SQL Server on Arc.

An Entra group login, type X, is the familiar AD group pattern. With a dynamic group driven by HR attributes, people gain and lose access as their attributes change, with no CREATE USER or DROP USER. That needs a P1 license per member, and access is only as strong as the write controls on those attributes.

And an application login, also type E, for a managed identity or service principal, replacing a SQL login and its stored password. Conditional Access doesn't cover these; service principals are reachable only through separately licensed workload-identity policies. On an Arc server the managed identity belongs to the server, so one login per server is the honest unit of attribution.

## Slide 10 — The parallel run and the five decisions

No Windows login is dropped until its Entra replacement is validated. The engine-authentication decision makes a three-phase parallel run required in production.

Create: for every migrating user or group login, create the external-provider login for its Entra principal. Verify each mapping first; a principal with no confirmed Entra equivalent is a blocking finding, and building that mapping is the most labor-intensive step. Validate: test each new login with the principal's real Entra credential before any legacy login is touched. Then disable, don't drop, the legacy Windows and SQL logins, observe for thirty days, and only then drop them.

Observation needs evidence, not silence. Login metadata says what exists; only auditing says what's used, and Microsoft's own sequence uses SQL Server Audit with the successful-login action group. Disable-and-observe keeps every cutover reversible, so a wrong mapping locks no one out.

Around the pattern sit five decisions. One, consolidation gates migration. Two, the parallel run is required; non-production may shorten the window only with documented owner sign-off. Three, SQL Authentication is eliminated: every active SQL login migrates to a service principal or managed identity, or carries an exception with a compensating control and a sunset date, and SA is disabled and renamed, with emergency access as a monitored break-glass procedure. On SQL Server 2025 with Arc, the Disable SQL Authentication setting closes the door for every SQL login at once, without a restart. Four, pre-2022 instances and failover cluster instances upgrade, re-platform or carry a sunset-dated exception; connections that can't reach Kerberos or Entra by the backstop use certificate-based authentication as the interim posture. Five, the per-instance compliance record is the closure artifact, so done becomes a queryable posture instead of a claim.

## Slide 11 — Module 3 — NTLM, applications and closure

Module 3: NTLM, applications and closure, the last of the strategy. Four slides. The four connection patterns that generate NTLM at the SQL layer, because NTLM is a protocol, not a setting, and no single switch removes it. The three phases that do remove it: discover, restrict, eliminate. The four-class pattern for the applications upstream of the database, read on two axes. And the closure condition: five conditions that must hold at once, and keep holding.

## Slide 12 — Four patterns that generate NTLM

Microsoft has deprecated every version of NTLM and removed version 1 from current Windows, but nothing in its timeline is a deadline for SQL Server. Eliminating NTLM means naming every connection pattern that produces it, and the book finds four.

Pattern one, a missing or incorrect SPN, the most common cause. If the driver can't get a ticket for the SPN it builds, it falls back to NTLM. The fix is SetSPN with the dash S switch, which checks for duplicates before adding. Two neighbors behave differently: an SPN on the wrong account doesn't fall back, it fails, typically with "Cannot generate SSPI context", and a duplicate SPN breaks Kerberos with a principal-not-unique error.

Pattern two, cross-site connections. The client needs a domain controller of the domain that holds the server's service account. If port 88 is blocked or DNS doesn't resolve it, Negotiate falls back to NTLM where a trust lets the server validate the account, and fails where it doesn't. Confirm with klist before changing firewall rules. Cloud Kerberos trust isn't a fix, because its partial ticket is still exchanged with an on-premises domain controller.

Pattern three, linked-server passthrough. Presenting the caller's identity to a second instance is a double hop, and NTLM can't make it; the symptom is a failed login for anonymous logon. Move each definition to a mapped login, an Entra identity on 2022 and later, a managed identity on 2025, or Kerberos constrained delegation.

Pattern four, clients with no domain ticket. An application on an unjoined host still using Integrated Security falls back to NTLM or fails, so its connection string moves to managed identity first. Connections on the instance's own host always use NTLM, and legacy providers over named pipes force it.

And NTLM version 1 found anywhere is a critical finding, not a migration item.

## Slide 13 — Discover, restrict, eliminate

The program's three phases apply to SQL Server unchanged. After the April 2027 block, any connection that needs NTLM fails in the Windows security subsystem, where the Local Security Authority enforces the policy, so the engine never sees it. Every pattern has to be resolved before Phase C, not after.

Phase A discovers. The authentication audit is the primary instrument, and Windows logging records what actually happened: events 4624 and 4625 with logon type 3 and the NTLM package on SQL Server hosts; the auth scheme column for per-connection proof; the Restrict NTLM audit policies, which log what a later deny would block, with event 8004 on domain controllers naming the server; and enhanced NTLM logging, which says who used NTLM and why Kerberos wasn't used.

Phase B restricts. First, the LAN Manager authentication level set to five. Be precise: domain controllers then refuse LM and version 1 but still accept version 2, so level five is the version-1 block, targeted for the third quarter of 2026, not an NTLM block. Microsoft's October 2026 update is a different control again; it blocks only NTLM version 1 derived single sign-on credentials, on devices without Credential Guard. Then the pattern work: SPNs, domain-controller reachability, linked servers and connection strings. Version 2 is restricted with the Restrict NTLM deny settings, whose exceptions are lists of server names on clients and domain controllers only. There's no list for the server role, so an instance that must keep accepting NTLM can't deny incoming NTLM.

Phase C eliminates: Restrict NTLM set to deny on every host. It's safe only after login migration is complete, and an instance on Entra logins is immune, because it isn't using NTLM. The book leaves one decision open: whether the date holds for the pre-2022 long tail.

## Slide 14 — Applications: four classes, two axes

The database is only half of the authentication path. An application that moved its user sign-in to Entra ID but still reaches SQL Server with a SQL login hasn't finished. The chain runs from user to application to database, and both legs have to leave Active Directory.

The program's LDAP-dependent-application plan sorts applications into four classes, in strict preference order; the numbers are identifiers, not ranks. Class 3, OpenID Connect, is the destination: Entra ID issues the tokens, there's no LDAP bind and no AD query, and the application reaches SQL Server with its managed identity. Class 2, SAML, removes the LDAP dependency but ranks below OIDC, because Microsoft recommends OIDC for new development. Class 1, Application Proxy, fronts an application that can't change; Entra preauthenticates users, so Conditional Access applies, but the application's own AD dependency stays behind the proxy. Class 4, Entra Domain Services, is the last resort: a managed domain with LDAP, Kerberos and NTLM. Its NTLM is still NTLM, and an instance serving a Class 4 application can't reach the Entra-exclusive posture, so it carries a sunset-dated exception.

The class describes only the user axis. The database connection is a second axis, set by evidence: does the deployed driver support the Entra mode, can the application use a managed identity or must its code refresh tokens, does pooling survive per-identity tokens, does the vendor support it, and does the platform have an Entra-capable driver. That places each application in column A, configuration only; B, code change; C, vendor-dependent; or D, no Entra path. OIDC or SAML in column A moves now; B is scheduled; C gets a dated exception; D means exception or retirement.

The application audit supplies the user axis, and it has to be joined to the authentication audit before an instance shows its full chain.

## Slide 15 — Closure: five conditions, held continuously

A transformation that reaches its end state and stops monitoring will regress. Any administrator with permission can switch an instance back to mixed mode or create a new login, so closure is a posture, kept by continuous audit, drift detection and governance that treats regression as a violation.

The transformation is closed when five conditions hold at the same time on every production instance. One: no usable Windows-backed principal, meaning zero enabled user or group logins with CONNECT SQL, apart from a documented break-glass group. Two: SQL Authentication eliminated: no SQL logins outside the exception registry, SA disabled, LoginMode one, and on SQL Server 2025 Is External Authentication Only as well. Disabling SQL authentication doesn't remove logins or end live sessions, so the census still matters. Three: Entra authentication observed working, and nothing else: every usable login is type E or X, the sign-in logs and SQL Server Audit show the expected principals, and the auth scheme column shows no NTLM or Kerberos over the validation period. Four: the engine has a cloud identity, with the Arc agent connected, the extension deployed and Entra authentication configured; a failover cluster instance can't meet this as built. Five: every human authenticates with MFA through Conditional Access.

No single setting does this. SQL Server can't turn Windows Authentication off, so LoginMode one proves only that SQL logins are refused. The book calls the combined state the Entra-exclusive operational posture.

Two details govern how evidence is read. Every SQL resource shares one token audience, so a sign-in log can't say which instance a principal reached; the per-instance proof is the instance's own audit. And local connections always report NTLM, so separate them from remote ones.

Drift is a violation: LoginMode moving from one to two, a new SQL, user or group login, or the Arc agent going offline. And the final months before April 2027 are for validation, not migration.

## Slide 16 — Module 4 — Runbooks R01–R05: inventory to Entra logins

Part 2: the runbooks for DBAs. Module 4 covers the first five: prerequisites, discovery and the consolidation gate, the authentication audit, Arc and the managed identity, and login migration with its parallel run. For each, the steps, the gate that has to hold before the next runbook starts, and the evidence it leaves. One rule runs through all ten: read-only and derivation functions run directly, and anything that changes state plans by default or writes a reviewable script, then goes through change control. The commands are illustrative and untested against a production estate, so each runs first in a test environment.

## Slide 17 — R01 — Prerequisites and the evidence model

Runbook R01 provisions nothing and changes no production state. It sets up what the other nine assume.

Step one, the toolchain. PowerShell 7 or later is the runtime. The one external dependency is a Python interpreter with only the standard library, which the modules call to compute the canonical integrity seal. The discovery Spec scripts are plain PowerShell, and three modules are imported from the repository root: SQL Server migration, identity assessment and plan generators. Live Azure and Graph operations need the Arc agent's command-line tool and the Azure CLI, and run only behind an explicit opt-in switch.

Step two, the evidence model. Every derivation and validation function emits a provenance-sealed envelope: the schema and artifact type, the records and summary counts, and provenance with the module, version, a UTC timestamp and a content hash. The seal leaves out the timestamp, so identical inputs give an identical hash. Artifacts are reproducible, and a broken or unattributed envelope is a provenance-drift finding by definition. Write each step's envelope to a dated folder under version control; that's what makes Runbook R09's runs comparable.

Step three, the safety model. Read-only and derivation functions run directly. State-changing functions either plan by default and execute only with an execute switch and confirmation, or generate a script and execute nothing; the login and group script generators have no server parameter at all. No secrets are embedded. A GCC-Moderate tenant is an Entra tenant in the commercial cloud, so its Arc resources use the AzureCloud name.

Step four, offline snapshots: every function accepts captured input, so the chain can be tested without touching a live estate. The run order is on the right, and nothing touches production until R02 has defined the retain and target set.

## Slide 18 — R02 — Estate discovery and the consolidation gate

Runbook R02 is Phase 0: count everything first, decide what survives second. Discovery is read-only; the consolidation it leads to is review-required and belongs to the migration plan.

The inventory starts from the program's scripts. The D1.8 audit script, run in discovery-only form, finds instances from their SQL Server SPNs and an explicit target list and reads each host's services over CIM; without a connection, version and authentication mode read Unknown. The D1.5 SPN inventory gives the domain's SPN trail, with duplicates and orphans: SPNs on disabled objects, or on objects with no logon in 180 days. Those scripts miss what has no SPN, like an Express instance an installer dropped on an application server, so cast wider with Find-DbaInstance, a forest-wide SetSPN query, and Azure Migrate or the Arc migration assessment.

Then the program's estate-inventory function fuses the sources. It keys every instance on host and instance name, so duplicates collapse, records which instruments found each one, and applies a first pass on two signals: last access at or above 400 days means retire, a pre-2022 engine means consolidate, and 2022 or later means retain. Anything without enough signal lands in review, never silently in retain.

The lenses come next, with one caution. The index-usage DMV resets whenever the engine starts, so it can't prove 400 days of disuse unless the instance has run that long. Read the start time beside it, and take long-horizon evidence from login auditing, backup history and the application portfolio. For dependencies, read sys.servers and the linked logins, plus the Agent, replication and SSIS footprint.

Finally the architects confirm or override each verdict, with the reason recorded. The evidence is the sealed inventory, with its classification counts and its denominator. And schedule network sweeps with security operations, because intrusion detection can flag them.

## Slide 19 — R03 — The authentication audit

Runbook R03 is the audit script itself. It changes nothing, so run it first and run it often.

The prerequisites are the ActiveDirectory module for the live SPN query and the orphaned-login check, remote CIM to each host, and SQL Server permissions only for the deep audit, which connects with Windows integrated authentication. Watch one trap. Catalog views show only what the caller has permission on, so an under-privileged audit account returns a partial login list with no error. Grant the narrowest read that sees every login, and confirm the count against a known instance.

There are three passes, in order: discovery only, which opens no SQL connection; then adding target servers for hosts without an SPN; then the deep audit with query instances and test connectivity.

The output is a JSON file per run, an instances CSV and a logins CSV, and the script computes the readiness verdict. Major version sixteen and later gets "enable Entra ID auth via Azure Arc". 2019 and earlier gets "upgrade to 2022 plus Arc", which is Category 3. The blockers it flags are mixed mode, an enabled SA, orphaned logins and linked servers. It doesn't detect failover cluster instances, so flag those from the cluster inventory and treat them as Category 3.

Two input defects to work around. The SPN-inventory input file doesn't match what D1.5 writes, so passing it yields no instances and suppresses the live query; run without it. And the service-account input expects a script that isn't published yet. The run order for SQL Server is D1.5 and D1.7, then D1.8, then the owner matrix.

The script degrades rather than crashing: a failed connection is recorded as Query Failed, a slow port as Timeout. Keep every run under version control, because the audit JSON is the raw input to continuous monitoring in Runbook R09.

## Slide 20 — R04 — Arc deployment and the managed identity

Runbook R04 gives the host its cloud identity. Connecting a server to Arc creates a system-assigned managed identity with no secret anyone manages, and without it there's no Entra login. SQL Server 2025 uses that identity directly as its primary managed identity. SQL Server 2022 authenticates with an app registration and a certificate in Key Vault, and the machine identity is what downloads the certificate.

The prerequisites carry the traps. A GCC-Moderate tenant's Entra ID is in the commercial cloud, so the Arc resources live in a commercial subscription in the same tenant, and Entra authentication isn't available for SQL Server on Arc in US Government Virginia. The instance can't be a failover cluster instance, NT AUTHORITY SYSTEM must be able to connect or the extension can't provision, and clients must trust the TLS certificate. The agent and extension need outbound 443, and the engine contacts Entra ID directly, without the agent's proxy. That's the one to miss: the agent shows Connected while Entra logins fail.

Then four steps. Enroll with a certificate-based onboarding service principal; the SQL extension installs automatically unless a tag disables it. Validate the token from the local identity endpoint, a two-call challenge: the audience must be database.windows.net, the expiry in the future, and the object ID the machine's principal ID. Never log the token. Confirm the extension shows Succeeded. Then turn on Entra authentication, on a pilot first; a Privileged Role Administrator grants the Graph permissions, and setting the Entra admin creates the first sysadmin login.

Two program functions need correcting before you execute with them: the onboarding wrapper adds a proxy flag the agent doesn't have and falls back to interactive sign-in, and the token validator's live mode queries the Azure VM address.

Rollback runs in order: remove extensions, disconnect, uninstall. Reconnecting creates a new identity, so permissions are granted again. On SQL Server 2025, treat Entra authentication as one-way.

## Slide 21 — R05 — Login migration and the parallel run

Runbook R05 adds the Entra login beside the Windows one, watches both for thirty days, and disables rather than drops. Every step that runs T-SQL against an instance is review-required.

Don't start until the instance is on SQL Server 2022 or later, Arc-connected with a validated token and an Entra admin set; until the estate is consolidated; until you have the R03 logins file; and until clients trust the certificate.

Step one generates the statements, dry run first. The mapping from each Windows login to an Entra principal is the one piece of real judgment. The program's mapping function builds it from the identity reconciliation, not a spreadsheet: it maps only cleanly matched principals, prefers an Entra group, and flags every unresolved login. The script generator then writes an idempotent CREATE LOGIN file, with unresolved entries as commented-out to-do lines, and never opens a connection.

Step two creates an Entra database user beside each Windows user, with CREATE USER FROM LOGIN and the same roles, permissions, schemas and ownership. Don't convert with ALTER USER WITH LOGIN; on SQL Server it can't change a user's type, and the exception applies only to Azure SQL Managed Instance.

Step three is the thirty-day parallel run. Capture successful logins for the whole window with SQL Server Audit, because a point-in-time query misses short connections. The exit criteria: every application and job also appears on its Entra login, no remote NTLM remains, and nothing arrives only on the legacy login. Two cautions: local connections always report NTLM, and Microsoft doesn't document what an Entra connection reports in the auth scheme column, so confirm it on the pilot, and pre-filter local sessions before the readiness check.

Step four cuts over by disabling, including any group logins a principal also arrives through, and rollback is re-enabling. And close an enabled SA here: confirm another sysadmin can sign in, then disable it.

## Slide 22 — Module 5 — Runbooks R06–R10: NTLM to certificates

Module 5 covers the last five runbooks: NTLM detection and remediation; groups, administrative units and the Conditional Access perimeter; the application chain and connection strings; continuous monitoring and the closure record; and certificate discovery for AD CS. The pattern holds. Detection and inventory are read-only and script-backed, and every remediation, provisioning or configuration change is review-required, dry run first, through change control. By the end of this module the posture isn't just reached; it's provable on every scheduled run.

## Slide 23 — R06 — NTLM detection and remediation

Runbook R06 is detect, then remediate, and most of what you find is a missing or misplaced name rather than a protocol choice.

Detection is three read-only audits. The D1.5 SPN inventory maps every SQL Server SPN. In the program's experience a missing one is the most common cause of silent NTLM and a duplicate the second, and an instance under a domain account with no SPN usually means registration failed at startup. The D1.7 collision report classifies five collision types and marks as critical any SPN held by two or more enabled accounts, or by both a computer and a user object. Run it against Active Directory directly, because its input-file handoff has the same defect as R03's. And D1.4 finds delegation settings and NTLM-dependency indicators.

Remediation changes production, and the program's SPN plan and GPO report enforce nothing; they emit reviewable plans. Register a missing SPN with SetSPN dash S, in the fully qualified form. Repair a collision by removing the SPN from the disabled or wrong account, leaving exactly one enabled owner. For linked-server passthrough, the order of preference is Entra authentication on the linked server, then Kerberos with constrained delegation, then a mapped remote login only as a documented exception, because it brings back a stored password.

Then the Group Policy phases: level five refuses LM and version 1; the Restrict NTLM policies restrict version 2, with server-name exceptions at the domain controller and the client; and the full block comes on the program's April 2027 backstop. The GPO report classifies each policy's posture and never sets anything.

Verify with klist purge, reconnect and klist, and check that the auth scheme reads KERBEROS from a remote client. Rollback is SetSPN dash D and the prior policy values, and because the block is last, the Kerberos fixes are proven long before anything is refused.

## Slide 24 — R07 — Groups, admin units and the CA perimeter

Runbook R07 moves the access-control layer. The group model survives; what changes is who maintains membership, who may administer it, and the boundary every sign-in has to cross.

Phase 1 is read-only. The program's group export reads Entra groups through Microsoft Graph or replays a snapshot, and the dynamic switch captures membership rules. A GCC tenant keeps the worldwide Graph endpoint. The Conditional Access export confirms the perimeter, but a policy's state only says on, off or report-only; whether it covers SQL Server sign-ins depends on its users and target resources.

The classification function gives every group one of four types. Type 1, organizational unit (OU)-derived, becomes a dynamic security group and a group login. Type 2, explicit role assignment, becomes an assigned group and a group login. Type 3, a distribution list, becomes a Microsoft 365 group with no SQL Server login at all. Type 4, mail-enabled security, splits into a mail group and an access group, and only the access half gets a login. Group logins are type X, not type E.

Phase 2 is review-required, and its order is fixed. First the DBA administrative unit, with restricted management turned on at creation, because it can't be changed later. Second, Groups Administrator scoped to that unit for the DBA lead, eligible through PIM rather than standing. Third, the groups inside it, added explicitly, with logins generated by the group-login script, which can never turn a distribution list into a login. Know the costs: tenant administrators can still assign themselves over the unit, though it's audited; its members can't be covered by PIM, access reviews or entitlement management; and a tenant gets at most 100 such units.

The dividend: once every login is an Entra principal, Conditional Access is the perimeter for human access. Microsoft documents targeting the Azure SQL Database application; that it governs Arc-enabled SQL Server is the program's working assumption, to confirm in the pilot. It reaches users only, and risk conditions need P2.

## Slide 25 — R08 — Application chain and connection strings

Runbook R08 is the last mile. An application that signs users in with Entra ID but reaches the database with a stored password has moved its front door and left the back door where it was.

Phase 1 inventories the LDAP-bind dependency with the read-only D1.9 script. It combines account heuristics with domain controller evidence: event 4624 with logon type 8, a clear-text bind, and events 2887 and 2889 in the Directory Service log. Event 2889 names each client, but only after the LDAP interface diagnostic setting is raised to two, and nothing is logged retroactively, so start the window after the change and set it back afterward. D1.9 doesn't say which instance an application uses, so the program's connection-plan function joins it to the D1.8 audit, assigns each application a class from observable signals, and emits the connection-string change.

Phase 2 is the simplest change and the most gated, and it's made in application configuration, never by a script. In production, name a specific mode, such as Active Directory Managed Identity. The Default mode tries credential providers in sequence, which slows the first connection and can switch identity when the host changes. Service principal mode takes its secret from protected configuration, never from source. Setting the mode turns on encryption, so the server certificate must be trusted. On an Arc host the driver gets the machine's token from the local metadata service, and the process must be in the hybrid agent extension applications group. Every application on that host is then the same principal, so give each its own service principal where grants differ.

Three gates before cutover: the Entra login exists, the identity holds the right database role, and the change was tested on a production-equivalent Arc stack. The audience is database.windows.net, not the Azure Government one, and pooled applications use the access-token callback. Rollback is the prior connection string, with the legacy login disabled, not dropped.

## Slide 26 — R09 — Continuous monitoring and closure

Runbook R09 keeps proving the posture. Closure isn't a day on the calendar; it's a record that keeps coming back clean, and everything here is read-only.

Step one runs the D1.8 deep audit on a schedule against the retain and target estate, keeping every run's JSON under version control. It's the same script as R03, on a different cadence.

Step two projects each run onto the per-instance closure record. The fields are Windows Authentication mode, which proves only that SQL logins are refused; zero active SQL logins outside the exception registry; zero active user and group logins; every Entra login reconciled to a known principal; SA disabled and renamed; the Arc agent connected; Entra authentication configured, through the managed identity on 2025 or an app registration on 2022; and MFA through Conditional Access, joined from the sign-in logs rather than copied. The program's closure-record function returns closed, closed-excepted or open, with the failing fields.

Step three turns the difference between two runs into drift events: mixed mode enabled, a new SQL login, a new Windows login or the Arc agent offline, each a violation, plus instances that appear or disappear, which may be a discovery gap. One caution: the audit reads the running mode, so a registry change is invisible until the service restarts. Add a registry check if earlier warning matters.

Step four is the behavioral layer, three sources with distinct jobs. Defender for SQL raises threat alerts but isn't an authentication log. Entra sign-in logs record each token issued, and a token can be reused across connections. The instance and host record the protocol itself, and any NTLM or Kerberos connection is an immediate alert.

The transformation is closed when six evidence sets hold together across the validation period: closure records, sign-in logs, protocol telemetry, the SA report, the MFA report and the exception registry. Then April 1, 2027 arrives as a non-event.

## Slide 27 — R10 — Certificate discovery for AD CS

Runbook R10 is discovery and analysis, not provisioning. Before anyone sets a date to switch off the certificate authority, someone has to find out what it still signs. The program has no decision yet on the move from AD CS to a cloud PKI, so this runbook produces the evidence that decision will need.

Step one runs the read-only D1.10 certificate audit across Active Directory: the PKI inventory, machine and user certificates, smart-card-required accounts, and service dependencies, including LDAP over TLS on domain controllers. It records the issuing CA on every certificate, which is exactly the signal for what depends on AD CS. It doesn't reach into an instance, so three in-engine reads supplement it. Join certificates to their logins on the SID, not the principal ID, and read the issuer name. An empty certificate setting doesn't mean no certificate, because SQL Server picks one from the machine store or generates its own; check the error log at startup. And check mirroring and availability-group endpoints; one reporting NTLM is also an R06 finding.

Step two maps the results to three dependencies. The engine's TLS certificate: every Entra connection requires encryption, so if the CA is gone when the certificate expires, encryption becomes what breaks the connection. Certificate-mapped logins and endpoints carry less risk than the source claimed, because certificate logins are used only for code signing and can't connect, and most are self-signed. And certificate-based sign-in, the interim posture for the NTLM long tail, needs a replacement CA issuing before AD CS retires.

Step three orders the CA migration, roots before issuing CAs, with cycles and cross-domain dependencies flagged as blockers. One fact for the decision: Microsoft Cloud PKI issues to Intune-managed devices, and Intune doesn't support Windows Server, so SQL Server hosts would need another enrollment path.

The finding is one question: does the AD CS decommission run earlier than its replacement? If it does, the interim posture is lost exactly when it's needed.

## Slide 28 — What to take back to the estate

To close, five things to take back to the estate.

First, count before you migrate. The inventory and the retain, consolidate or retire gate decide where every hour of authentication work goes; migrating an instance you should have retired is waste against a fixed date.

Second, measure, don't assume. A missing SPN turns Kerberos into NTLM silently, and only the auth scheme column, the Windows logs and SQL Server Audit show it.

Third, keep it reversible. Create, validate, disable, observe for thirty days, then drop. A disabled login is an instant rollback.

Fourth, finish the chain. An instance isn't closed while any application still reaches it with Integrated Security or a stored password, or while a Class 4 application holds it on Windows Authentication.

Fifth, prove it continuously. The closure record, drift detection and the six evidence sets make done a queryable posture rather than a claim, and the certificate layer underneath needs its own decision before AD CS goes away.

April 1, 2027 is the program's backstop. If the work is finished well before it and the evidence has been clean for months, the block arrives as a non-event. Book 06 has the narrative chapters and the ten runbooks, with every external claim footnoted. Thank you.
