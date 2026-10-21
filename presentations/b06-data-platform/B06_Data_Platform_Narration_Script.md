# Book 06 — Data Platform: SQL Server Identity — narration script (practice copy)

## Slide 1 — Why Is the Database Where Legacy Authentication Hides?

This briefing comes from Book 06 of the Federal Modernization Workbook: the SQL Server estate's move from Windows Authentication to cloud identity.

Every identity program eventually reaches the database, and the database is where it finds the most Windows authentication still in use. I'll take it through why that is, what replaces it, who owns the work, and how to do it, from the estate inventory to a closure condition you can keep proving.

## Slide 2 — SQL Server trusts whatever Windows tells it

Why is the database where legacy authentication hides? Because SQL Server trusts whatever Windows tells it.

A connection reaches the engine in one of four ways. Kerberos, when the service principal name is right. NTLM, silently, when the SPN is missing. A SQL login, where the engine checks a password itself. Or Microsoft Entra authentication, which is the only one Conditional Access ever sees.

Three facts make the inheritance hard to see. Windows Authentication can't be turned off in SQL Server, because the engine delegates it to the Windows security subsystem. Which protocol a connection used isn't written to any log; it shows only in a dynamic management view, sys.dm_exec_connections. And local connections use NTLM even when the SPN is right, while an SPN registered on the wrong account makes the login fail outright.

The book is careful about one thing: Windows Authentication was good engineering for a domain-joined estate. The case for replacing it rests on that world no longer existing, not on calling it a mistake.

## Slide 3 — Three drivers, and what is really due in 2027

Three drivers make the inheritance end.

First, NTLM elimination. Microsoft deprecated all versions of NTLM in June 2024 and plans to disable it by default in a future Windows release. The program sets its own backstop, April 1, 2027, for the domain-wide block.

Second, Zero Trust in the authentication path. OMB M-22-09 puts phishing-resistant MFA and the Entra identity plane in front of human access, and Windows Authentication bypasses both.

Third, service-account credentials. The directory modernization in Book 02 ends the domain-joined world those service accounts depend on.

The book is precise about 2027. There's no external NTLM deadline; Microsoft hasn't dated the disable-by-default step. The dates that are real are support dates: SQL Server 2016 went out of support in July 2026, Windows Server 2016 follows in January 2027, the last SQL Server 2014 extended-security year ends in July 2027, and SQL Server 2017 goes out of support in October 2027. SQL Server 2014 and 2017 can't use Entra authentication at all, so they reach the closed state only by upgrade or retirement.

## Slide 4 — Rationalize the estate before migrating it

What changes starts with the estate itself. Before touching authentication, every instance gets one of three verdicts.

Retain: it's supported or can be upgraded in place to SQL Server 2022 or later, it carries load-bearing work, and nothing argues for collapsing it. Consolidate: its workload moves into a target platform and the old instance retires. Retire: there's no live workload, so it's decommissioned instead of migrated.

The inventory has to cover the whole forest. The setspn tool needs its -F switch to search beyond a single domain. Usage, versions and dependencies are read together, and the book warns that index-usage counters reset when SQL Server restarts, so they can't prove disuse on their own. And the assessment uses the migration component in SQL Server Management Studio, because Microsoft retired the Data Migration Assistant in July 2025.

This is the gate for the whole program. Migrating an instance that should have been retired is the most expensive mistake it can make.

## Slide 5 — Azure Arc gives each instance an Entra identity

What replaces the domain join? Azure Arc gives each instance an Entra identity.

On SQL Server 2025, that's the Arc managed identity. On SQL Server 2022, it's an app registration with a certificate. The Azure extension for SQL Server installs automatically when the host connects to Arc, and Entra connections are always encrypted.

The limits matter, and the old documents missed several. Failover cluster instances can't use Entra authentication on any version. Entra authentication through Arc isn't available in the US Government Virginia region, so a GCC tenant uses a commercial subscription in the same tenant; the old runbook's Azure Government setup would never have produced Entra logins. FIDO2 isn't supported for SQL Server on Arc. And granting the instance identity its Graph permissions needs a Privileged Role Administrator, so that step can't sit with the DBAs.

Arc is the program's chosen path, not the only one: Microsoft documents a manual setup for SQL Server 2022 and later on Windows. Arc wins because it also carries inventory, policy, updates and Defender for the host, which is Book 05.

## Slide 6 — Logins move to Entra principals, in parallel

The logins themselves move to Entra principals, in parallel.

People become Entra users, ideally granted through groups, and they get phishing-resistant MFA and Conditional Access. Groups become Entra group logins, which SQL Server records as type X, with membership driven by HR attributes from Book 03. Applications become service principals and managed identities, and the book is clear that Conditional Access doesn't cover managed identities.

The migration is a parallel run. Create the Entra user beside the Windows user and copy its roles and permissions. Keep both until the audit shows no remaining Windows sessions, then disable the old one. Never convert in one step; and the old runbook's shortcut, ALTER USER with LOGIN, only converts on Azure SQL Managed Instance, not on SQL Server.

One trap: the instance's Entra administrator becomes sysadmin, and changing that administrator leaves the old login as sysadmin until a DBA drops it.

## Slide 7 — Who decides, who does the work for the data platform

Who owns it? The book's new Chapter 13 separates deciding from doing.

Deciding: the CIO and data leadership decide retain, consolidate or retire. The CISO, the ISSO and the authorizing official decide NTLM and SQL-login exceptions and sign off closure. Application and data owners decide the cutover window for each application.

Doing: the data platform team runs logins, roles, the audit and the parallel run. The identity team creates Entra logins and groups and grants the Graph consent the DBAs can't. The server team onboards hosts to Arc.

Supporting: developers change connection strings and drivers, the help desk handles sign-in issues during cutover, and security operations watches Defender for SQL alerts.

And there are hidden administrators. Azure Contributor on an Arc server is an indirect administrator of SQL Server on that host, and Owner or Contributor on the SQL resource can switch SQL authentication back on. Azure role assignments need the same care as sysadmin.

## Slide 8 — Eliminate NTLM in three phases

How. NTLM is eliminated in three phases.

Phase A discovers: the authentication audit, together with Windows NTLM logging and auditing events. Phase B restricts: fix SPNs, convert connections to Kerberos or Entra, and migrate the remaining patterns. Phase C eliminates: the domain-wide Restrict NTLM block, on the program's April 2027 backstop.

The details matter. LAN Manager authentication level five refuses LM and NTLM version one but still accepts version two, so it isn't an NTLM block; the block is the Restrict NTLM policies. Their exceptions are lists of server names on clients and domain controllers, not the program's exception registry. And Microsoft's October 2026 change blocks NTLM-version-one-derived single sign-on credentials for Wi-Fi and VPN; it doesn't touch SQL Server traffic.

The fastest exit is migration itself. An instance whose logins have moved to Entra ID isn't affected by the block, so login migration and NTLM elimination are the same work.

## Slide 9 — Access by attribute, applications by driver

With the logins moved, access is granted by attribute and applications move by driver.

Access control: dynamic Entra groups, driven by HR attributes, grant database access, so no DBA provisions it by hand. Administrative units delegate group management, privileged database roles go through PIM from Book 04, and reviews cover the groups, not just the logins.

The application chain: the book sorts SQL-consuming applications into four classes, each with its own migration path. Connection strings name a specific Entra authentication mode in production rather than the catch-all default. Microsoft.Data.SqlClient, ODBC, OLE DB and JDBC all support Entra modes, and the book has a driver table with the minimum versions. Managed identities on Arc hosts get their tokens from the local agent service.

The last mile is the connection string. Every application that still says Integrated Security keeps the Windows path alive, so the application inventory is part of closure, not a follow-up.

## Slide 10 — Closure is a posture you keep proving

The book's last idea is that a transformation doesn't complete; it achieves a posture, and a posture is something you keep proving.

The closed state has five conditions that hold together: every in-scope instance on Entra-only authentication; no SQL logins outside approved exceptions; no NTLM sessions in the continuous audit, counting remote sessions, because local ones always show NTLM; any drift, such as an administrator switching back to mixed mode, detected and treated as a violation; and evidence regenerated from SQL Server Audit and the auth_scheme field, not assembled into a binder.

One correction matters for assessors. Entra sign-in logs can't prove per-instance access or the absence of NTLM, because every SQL resource shares one token audience. The proof has to come from the instance itself.

And there's a certificate layer underneath. SQL Server's TLS certificates still come from Active Directory Certificate Services in most estates. Microsoft Cloud PKI issues only to Intune-managed devices, and Intune doesn't manage Windows Server, so the server-certificate issuer is its own decision.

## Slide 11 — What we need

So, four asks.

Run the inventory and the gate: a retain, consolidate or retire verdict for every instance before any authentication work starts.

Fund the Arc bridge: a commercial subscription in the GCC tenant, with SQL Server 2022 or later as the target.

Plan the support dates: upgrade or retire the 2014, 2016 and 2017 instances on their real dates, because they can't use Entra authentication.

And decide the certificate issuer: the Active Directory Certificate Services dependency for server TLS needs its own answer.

The database is where legacy authentication hides longest. Bringing it into Entra ID is what lets Conditional Access, phishing-resistant authentication and continuous evidence finally reach the data.

Book 06 has the narrative and ten runbooks, with every external claim footnoted. Book 05 covers Arc on servers, and Book 04 the access policy it plugs into. Thank you.
