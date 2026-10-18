# SQL Server Identity Transformation — Neutralized


Source identifiers have been replaced with plain-language equivalents while preserving surrounding context.

---

Book_01 — The Authentication Inheritance Problem

What Microsoft Provides at the Authentication Layer — and the Environmental Problem Only You Can Solve

Book_01 — The Authentication Inheritance Problem

 

 

 

 

 

Chapters



What Windows Authentication Actually Is

Chapter 1 — What Windows Authentication Actually Is

The inheritance, named precisely, before the case for replacing it.

The Kerberos Foundation

SQL Server in Windows Authentication mode delegates authentication entirely to the Windows security subsystem. It does not implement its own password verification, its own cryptographic challenge-response, or its own session token model. When a client opens a connection with Integrated Security=True, the driver passes control to the Security Support Provider Interface — SSPI.

The SSPI layer examines the available authentication protocols and determines whether Kerberos is negotiable for the target server. If it is, SSPI requests a Kerberos service ticket from the Key Distribution Center — the domain controller’s Kerberos service — scoped to the SQL Server’s Service Principal Name. That ticket is presented to the SQL Server engine.

The engine validates the ticket’s cryptographic signature using the session key derived from the service account’s credentials, extracts the Kerberos principal, and maps it to a SQL Server login. No password has traversed the network. No credential has been stored in any application configuration file. The authentication is mutual: the client proves its identity to the server, and the server to the client, both through the shared authority of the domain’s KDC. This is genuinely good security architecture, and it is important to say so plainly before explaining why it must be replaced.

The SPN must be registered against the service account running the SQL Server engine process. The format for a SQL Server instance is MSSQLSvc/hostname.domain.com:port, and the registration binds the service account’s long-term key — its password hash in the AD domain — to the service name, so the KDC can generate a valid ticket when a client requests one.

Without a correctly registered SPN, the KDC cannot issue a service ticket for the SQL Server endpoint. The SSPI layer on the client, having failed to negotiate Kerberos, silently falls back to the next available protocol. In most Windows environments, that next protocol is NTLM.

This silent fallback is the first and most consequential fault in the inheritance. It is invisible at the application layer, it produces no error in the SQL Server error log under default configuration, and it means that environments which believe with complete confidence that they are running Kerberos for their SQL Server connections are, in a significant fraction of those connections, running NTLM. The fraction can be measured — the SQL Server authentication audit instrument (Get-SQLServerAuthAudit.ps1) is the instrument — but it cannot be known without measurement, and most federal environments have not measured it.

The NTLM Fallback

NTLM is not a failure state that was tolerated by accident. In the early history of Windows networking, NTLM was the primary authentication protocol for all Windows workgroup and domain connections. When Kerberos was introduced in Windows 2000 as the preferred domain protocol, NTLM was retained as a compatibility fallback for scenarios where Kerberos was not negotiable — cross-domain connections without trust, connections from non-domain-joined clients, connections to servers the KDC could not locate.

SQL Server inherited this behavior without modification: SSPI negotiates the best available protocol, Kerberos first and NTLM second. For most workloads in most federal environments of the early 2000s and 2010s, this was perfectly adequate. NTLM provided authentication that was sufficient for the threat model of a perimeter-defended network where every client and server was a domain member.

The problem with NTLM is not that it was wrong for its time. The problem is that it does not scale to a modern zero-trust posture, and that posture is now a requirement of this program’s FedRAMP-Moderate boundary, not an aspiration.

NTLM is a challenge-response protocol that embeds the entire authentication exchange within the connection negotiation itself. The server sends a challenge; the client responds with a hash of its credential and the challenge; the server validates the response. There is no token issued at the conclusion of this exchange, and no session assertion that can be presented to a third party for validation.

There is, therefore, no mechanism by which a Conditional Access policy engine — which lives in the Azure identity plane, outside the SQL Server connection path entirely — can observe the NTLM exchange, evaluate it against policy conditions such as device compliance or sign-in risk, and either permit or deny it. NTLM authentication succeeds or fails at the protocol layer, between client and server, and produces no artifact the Azure identity plane can observe, record, or control. (the Kerberos/NTLM elimination decision)

The Service Account

The SQL Server engine process runs under a service account. That account is the identity the engine presents when it makes network connections — when it accesses file shares, communicates with other instances via linked servers, or forwards log data to a monitoring sink. In federal environments, that account has historically taken one of three forms.

The first is a domain service account: a named Active Directory user with a non-expiring password, typically named something like svc-sqlengine-prod, with a password set at installation and changed infrequently or not at all. The second is a Group Managed Service Account (gMSA): a domain account whose password is managed automatically by Active Directory, rotated every 30 days, and never known to any human. The gMSA pattern is strictly better than the named account from a credential-hygiene perspective, but it is still AD-anchored — when the domain is removed from the architecture, the gMSA loses its governance foundation.

The third form is the NT SERVICE\MSSQLSERVER virtual account, a Windows-local account that uses the computer’s domain account for network authentication. This pattern is also AD-anchored, because it is the domain-joined computer account that provides the Kerberos credential for network connections.

In every one of these patterns, Active Directory is the identity authority for the engine process. The engine’s ability to authenticate to any network resource depends on AD. When the directory modernization program removes AD as the authoritative identity source, the service account pattern loses its foundation, and the engine must acquire a new identity — the system-assigned Managed Identity that Arc provides for the host. That transition is the subject of Book 04.

The sa Account

Alongside Windows Authentication, SQL Server has always supported a second mode: SQL Authentication, which uses credentials stored in SQL Server’s own master database rather than in Active Directory. The sa account — system administrator — is the built-in SQL Authentication login present on every instance at installation.

In a well-governed environment, sa is disabled, renamed, or both; its password is long and random; and it is never used for routine operations. In practice, many federal environments carry active sa accounts as emergency-access mechanisms, often with passwords set at installation and never rotated, on the logic that if AD becomes unavailable, sa provides a path back into the instance.

This is understandable logic, but it produces a serious posture problem. SQL Authentication, unlike Windows Authentication, produces no Entra ID sign-in events. A connection using SQL Authentication is invisible to the Azure identity plane: there is no Conditional Access policy that can intercept it, no Defender for Identity signal, no sign-in risk assessment. SQL Authentication is a completely opaque path from the perspective of the modern identity plane, and the sa account, if active, is the most dangerous entry point on the instance. Its handling is one of the decisions the SQL Server authentication transformation decision formalizes.

Why This Was Correct

The full picture — Kerberos negotiation via SSPI, SPN registration against the service account, NTLM fallback, domain service accounts and gMSAs, SQL Authentication as a local fallback — is a coherent and defensible architecture.

In a fully domain-joined world with a working KDC, correctly registered SPNs, and a client population consisting entirely of domain members, Windows Authentication was centrally managed through Active Directory, non-repudiable at the Kerberos ticket level, and resistant to credential theft in the network path. It required no infrastructure beyond the domain controller that already existed for every other authentication purpose in the environment.

It was not a security compromise. It was the application of the existing, well-understood Windows security substrate to the SQL Server authentication problem, and for the world that substrate was designed for, it was the right answer. The problem is not the design. The problem is that the world it was designed for — every client domain-joined, every server domain-joined, the perimeter as the security boundary, no cloud identity plane — no longer exists and cannot be made to exist again. (the identity and directory transformation inventory)

 



Why the Inheritance Must End

Chapter 2 — Why the Inheritance Must End

Three drivers, each as well-reasoned as the original design, and their dependency structure.

That replacement is now necessary, and the reasons are as well-reasoned as the original design choices were. The NTLM elimination the program has committed to, the zero-trust requirement that Conditional Access policies sit in the authentication path for all human access, and the collapse of the domain-joined world as the universal substrate for federal computing are not organizational preferences. They are architectural inevitabilities driven by Microsoft’s progressive NTLM defaults, the identity and directory transformation inventory, and the federal zero-trust mandate that governs this program’s boundary — OMB M-22-09 (the Federal Zero Trust Strategy), operationalized in this boundary as phishing-resistant MFA and Conditional Access (AC-17, IA-2).

Driver One — The NTLM Elimination Commitment

The first driver is a decision this program has made and recorded: the Kerberos/NTLM elimination decision (Kerberos / NTLM Elimination), accepted 2026-05-13, commits the program to eliminating NTLM. The external driver is real but gradual: Microsoft formally deprecated NTLM in June 2024 and is disabling it by default — not removing it — across successive Windows releases, from enhanced auditing in Windows Server 2025 / Windows 11 24H2, to the BlockNTLMv1SSO enforcement default arriving via Windows Update in October 2026, to network NTLM off by default in the next major Windows Server release (~2027/2028). Microsoft has not published a fixed calendar date for that final step. The program treats these milestones as risk indicators and eliminates NTLM as operational readiness allows, staying ahead of vendor defaults rather than chasing a fixed date. the Kerberos/NTLM elimination decision distinguishes NTLMv1 from NTLMv2 because they present different risk profiles and require different timelines, but both are eliminated.

NTLMv1 is the first to go. Under the Kerberos/NTLM elimination decision’s phased plan it is disabled in Phase B — the “block-where-safe” phase — by default immediately upon completion of the Phase A assessment, with the implementation plan targeting 2026-Q3, well ahead of the NTLMv2 deadline. The block is implemented through the “Network Security: LAN Manager Authentication Level” Group Policy, set to “Send NTLMv2 response only; refuse LM and NTLM.” Once that policy is in force, any connection attempt that still requires LM or NTLMv1 is refused inside the Windows security subsystem — the Local Security Authority (LSA) negotiates only NTLMv2 and rejects the weaker protocols. A SQL Server connection that generates NTLMv1 traffic — which would require a very old client or a misconfigured application — fails at that point, before the engine ever evaluates the login. (the Kerberos/NTLM elimination decision)

NTLMv2 carries a longer runway, but the Kerberos/NTLM elimination decision Phase C disables NTLM at the LSA layer across the estate as operational readiness allows — the program’s own elimination step, timed to complete ahead of Microsoft’s progressive NTLM defaults. Any SQL Server connection that relies on NTLMv2 — because an SPN is missing, because the client cannot negotiate Kerberos, because the connection crosses a trust boundary, or because the host has already been migrated to a non-domain-joined state — will face increasing friction as Microsoft tightens defaults, and will fail once Phase C is applied.

The migration itself must occur before Phase C is applied. The timeline needed to execute the consolidation, the Arc deployment, the login migration, and the application connection-string migration must maintain forward momentum to keep pace with the vendor default-disable trajectory. (the Kerberos/NTLM elimination decision)

Driver Two — The Zero-Trust Requirement

The second driver is architectural: the zero-trust posture mandated for this program’s FedRAMP-Moderate boundary by OMB M-22-09 (the Federal Zero Trust Strategy), and operationalized through AC-17 and IA-2, cannot be implemented without the Azure identity plane in the authentication path for SQL Server connections.

Conditional Access policies enforce device compliance, network-location restrictions, MFA completion, and sign-in risk thresholds by intercepting the token issuance request that occurs when a principal authenticates to Entra ID. If the authentication protocol is Kerberos or NTLM, there is no token issuance request. The authentication completes entirely within the Windows security subsystem, and the Azure identity plane is not in the path at any point.

A database administrator connecting to a production SQL Server from an unmanaged personal device, from a network outside the program’s named locations, or with an elevated sign-in risk signal cannot be blocked by a Conditional Access policy if the authentication protocol is Kerberos or NTLM. The policy has no visibility and no leverage point.

Entra ID authentication for SQL Server changes this entirely. When a principal authenticates using an Entra ID-issued OAuth 2.0 access token, the token issuance request passes through the Entra ID authentication service, which evaluates all applicable Conditional Access policies before the token is issued.

If a policy requires MFA and the principal has not completed it, the token is denied and the connection never opens. If a policy requires a compliant device and the client is not registered or is out of compliance, the token is denied. If the sign-in risk level is elevated — an anonymous IP, or an account flagged by Entra ID Protection — the token is denied or a remediation challenge is triggered. In every case, the Conditional Access policy has real enforcement leverage, because the token it controls is the credential SQL Server accepts. This is the zero-trust identity anchoring the program requires — the phishing-resistant, Conditional-Access-conditioned access that OMB M-22-09 mandates and that AC-17 / IA-2 operationalize for this boundary. (OMB M-22-09; AC-17, IA-2; the zero-trust identity decision, the Kerberos/NTLM elimination decision)

Driver Three — The Service Account Credential Problem

The third driver is a consequence of the broader directory modernization this series is embedded within. The the organizational-attribute model substrate and the identity and directory transformation inventory collectively describe a transformation in which Active Directory is removed as the authoritative identity source for this program’s environment.

When that transformation completes, the AD service accounts and gMSAs that currently authorize the SQL Server engine process for network access lose their governance foundation. They are objects in a directory that no longer exists as an authoritative identity source. The engine must acquire a new identity before that removal occurs.

The only credential-free, cloud-native identity available for an on-premises server in this architecture is the system-assigned Managed Identity that the Azure Arc Connected Machine agent provides. Arc deployment is therefore not an optional enhancement for SQL Server hosts; it is a prerequisite for the service-account migration the engine requires before the directory modernization can complete.

The sequencing implication follows directly from the dependency structure of these three drivers — and, before any of them, from the consolidation decision of Book 02. You assess and consolidate the estate first, so effort is spent only on instances that survive; then Arc enablement; then the login migration; then NTLM elimination. That order is the architecture of this series. (the hybrid-management non-domain-joined decision, the identity and directory transformation inventory Transformation #7)

 



Book_02 — The Estate Itself

What Microsoft Discovers About Your Estate — and What Only a Full Inventory Reveals

Book_02 — The Estate Itself

 

Chapters



The Shape of Twenty Years

Chapter 1 — The Shape of Twenty Years

Why the estate you must transform is not the estate anyone remembers building.

The previous book named the inheritance and the three drivers that require ending it. This book confronts a precondition that most authentication narratives skip entirely: you cannot migrate the authentication of an estate you have not first measured and rationalized. After twenty years across an Active Directory forest, the SQL Server estate is larger, older, and more entangled than any single team’s mental model of it — and a meaningful fraction of it should not survive the transformation in its current shape.

The order matters because effort is finite and each release narrows the window. Migrating the logins of an instance to Entra ID, only to retire that instance three months later, is wasted work that also delays the instances that most need attention. the SQL Server authentication transformation decision §1 makes the sequencing normative: the consolidation assessment classifies every instance retain, consolidate, or retire before any login is touched.

Instance Sprawl

A SQL Server estate does not grow by design. It grows by accretion. A development instance becomes a production instance because a project shipped and nobody rebuilt it on the production tier. A test instance set up for a vendor evaluation is never decommissioned. An application installer silently provisions a SQL Server Express instance on an application server, and that instance accumulates real data for years without ever appearing on a DBA team’s inventory.

The result, in a mature federal environment, is a population of instances spanning every SQL Server version released across two decades — 2008, 2012, 2014, 2016, 2017, 2019, and 2022 — in every edition, from Express on a workstation to Enterprise on a clustered host. Several of those versions are out of support and receive no security updates. The licensing posture is equally heterogeneous: a mix of Standard and Enterprise cores, some covered by Software Assurance and some not, with no single authority that can state how many cores the estate actually consumes.

Instance sprawl is the first thing the assessment must quantify, because the count of instances — and especially the count of unknown instances — determines the true scope of the transformation. An estate that the DBA team believes contains forty instances and the discovery sweep reveals to contain a hundred and ten is not forty instances behind schedule; it is operating on a scope estimate that is wrong by a factor of nearly three.

Database Sprawl

Beneath the instances lies a second layer of accretion: the databases themselves. An instance that has run for fifteen years carries databases nobody can confidently account for. Some are orphaned — the application that created them has been decommissioned, but the database was never dropped because no one was certain it was safe to do so. Some are zombies — they have received no connection in over a year, yet they consume storage, appear in backup jobs, and lengthen every maintenance window. Some are near-duplicates, the residue of a migration that copied a database to a new name and never removed the original.

Database sprawl matters to the authentication transformation for a specific reason. Every database is a potential source of logins, and every login is a unit of migration work. A zombie database may map a long-forgotten SQL Authentication service account that still has a valid password and still appears, to a discovery script, as an active credential requiring migration. The fastest way to reduce the migration surface is not to migrate faster — it is to retire the databases and instances that should not be migrated at all.

Zombie detection is therefore not a housekeeping nicety; it is migration-scope reduction. A database with no connections in four hundred days, no recent backups consumed for a restore, and an owning application that the application portfolio lists as retired is a database whose logins should never enter the migration pipeline.

Forest Entanglement

The third form of sprawl is the one that makes the SQL Server transformation genuinely harder than a single-domain migration: the estate is entangled with the Active Directory forest it grew up in. Instances are spread across multiple domains connected by trusts. Logins on one instance resolve to security principals in a different domain. Linked-server definitions form a web of cross-instance dependencies that crosses domain boundaries, and the service accounts running the engine processes are drawn from several domains with no consistent naming or governance.

This entanglement is precisely what the directory modernization removes the foundation for. When Active Directory ceases to be the authoritative identity source, every cross-domain login, every SPN registered in a domain that is being collapsed, and every shared service account becomes a dependency that must be resolved — not merely re-pointed. Consolidation is the moment when that resolution is cheapest, because collapsing many instances into fewer modern targets is also the moment to collapse the cross-domain identity sprawl into Entra-backed identity.

The shape of twenty years, then, is three overlapping problems: too many instances, too many databases, and too many forest-spanning dependencies between them. The chapters that follow describe how to measure each, and how to turn the measurement into the retain / consolidate / retire decision that gates everything in Books 03 through 10.

 



The Estate Inventory

Chapter 2 — The Estate Inventory

Finding the instances and databases that no inventory already records.

A consolidation assessment begins with an inventory, and the defining characteristic of a twenty-year estate is that the inventory does not already exist in complete form. The instances a DBA team manages deliberately are known. The instances that matter most to the assessment are the ones nobody is managing — and those must be discovered, not retrieved from a list.

This is the point at which estate discovery diverges from the authentication audit of Book 03. The the SQL Server authentication audit instrument audit measures the authentication posture of instances that are already known: their login types, their authentication mode, their SPN status, their Arc eligibility. Estate discovery runs earlier and casts wider. Its job is to establish the denominator — the complete set of instances and databases that exist — so that the authentication audit has something complete to measure.

What the Inventory Must Capture

An estate inventory sufficient to drive a consolidation decision captures, for every instance it can find, a consistent set of facts. The version, edition, and build number establish the support and licensing posture. The host operating system version establishes the Arc and upgrade envelope. The domain-join state and the owning domain establish the forest-entanglement picture. The service-account identity and its source domain establish the credential dependencies. And, for every database on the instance, the size, the last-access timestamp, the recovery model, and the owning application establish the utilization and zombie picture that Chapter 3 turns into a rationalization decision.

The inventory is not a point-in-time spreadsheet. Like the authentication audit it precedes, it is designed to be re-run, because instances appear and disappear across a multi-month assessment, and the consolidation plan must track a moving estate rather than a single snapshot.

Discovery Instruments

No single instrument finds every instance, because instances hide in different ways. A complete sweep combines several, each blind to what the others surface.

A network and directory sweep finds instances by listening for them. The SQL Server Browser service responds on UDP 1434, instances listen on TCP 1433 and dynamic ports, and Active Directory itself records instances indirectly. The open-source PowerShell module dbatools provides Find-DbaInstance, which combines these signals — service-principal-name lookups, SQL Browser responses, port scans, and Windows service enumeration — into a single discovery pass across a network range or an Active Directory domain. It is the most direct way to surface instances that no inventory records.

The SPN registration trail is a second, independent signal. Because every instance that successfully negotiates Kerberos must register an MSSQLSvc service principal name, a forest-wide query for those SPNs (setspn -Q MSSQLSvc/*, or the equivalent directory query) enumerates every instance that was ever configured for Kerberos — including instances on hosts that are otherwise off the radar. The SPN trail also feeds directly into the authentication audit, because a registered SPN that points at a decommissioned host, or an instance generating Kerberos traffic with no corresponding SPN, are both findings the later books act on.

Microsoft’s migration-assessment tooling is the third instrument, and it captures what the first two cannot: workload and dependency data. Azure Migrate, with its dependency-analysis capability, and the Microsoft Assessment and Planning (MAP) Toolkit, enumerate instances and their resource consumption at fleet scale. The Data Migration Assistant (DMA) assesses individual databases for compatibility and feature blockers against a target version. These instruments are pedagogically useful here for what they reveal about the estate, independent of any decision to use Azure as a migration target — the dependency map and the version-compatibility findings are inputs to the consolidation decision regardless of where the consolidated estate ultimately lands.

Why a Canonical Estate-Discovery Spec Does Not Yet Exist

The discovery instruments named above are real and well-understood, but they are not yet bound into a canonical the Federal Modernization Program discovery specification the way the SQL Server authentication audit instrument, the application chain audit instrument, and the certificate discovery instrument bind the authentication, application, and certificate audits. the SQL Server authentication transformation decision §1 names this as an explicit gap: the estate-consolidation inventory that produces the retain / consolidate / retire classification has no Spec3-D1.x instrument of its own. Authoring that instrument — a discovery script whose output feeds the same the continuous compliance monitoring baseline ingestion pipeline as the authentication audit — is identified in the the SQL Server authentication transformation decision implementation plan as Phase 0, the prerequisite to everything the later books describe.

Until that specification exists, the consolidation assessment is conducted with the general-purpose instruments above and recorded as a deliberate program artifact rather than a canonical telemetry record. Naming the gap is itself part of the assessment’s value: an estate transformation that proceeds on an incomplete inventory will discover its missing instances at the worst possible moment, which is exactly the failure mode the discipline of this book exists to prevent.

 



Rationalization — Utilization, Versions, and Dependencies

Chapter 3 — Rationalization: Utilization, Versions, and Dependencies

Turning a complete inventory into a defensible judgment about what each instance is worth.

An inventory establishes what exists. Rationalization establishes what each item is worth keeping. The assessment applies three lenses to every instance and every database the inventory surfaced, and the combined picture drives the retain / consolidate / retire decision that Chapter 4 formalizes.

Utilization and Zombie Detection

The first lens is utilization. An instance consumes CPU, memory, storage, and a licensing entitlement whether or not anyone is using it, and a twenty-year estate contains instances that consume all four while serving no current workload.

Utilization analysis rightsizes the survivors and identifies the candidates for retirement. For each instance, the assessment captures sustained and peak resource consumption, connection counts, and the workload profile — read-heavy reporting, transactional, batch, or idle. For each database, it captures the last-access timestamp, the recent query workload, and the backup-restore history.

A database with no connections in over a year, no restores consumed, and a retired owning application is a zombie, and zombies are the cleanest retirement candidates in the estate. Retiring them is the single most effective way to reduce the authentication migration surface, because every login they carry — including long-forgotten SQL Authentication service accounts with still-valid passwords — is removed from the migration pipeline before it ever enters it.

Utilization data also rightsizes the consolidation targets. An instance running at four percent of a sixteen-core Enterprise license is not a retain candidate at its current size; it is a consolidation source whose workload belongs on a shared modern target, freeing the license and the host.

Version and End-of-Life Posture

The second lens is version posture, and it interacts directly with the authentication transformation. The FROM EXTERNAL PROVIDER login syntax that the entire transformation depends upon requires SQL Server 2022. An instance on any earlier version — 2019, 2017, 2016, or the out-of-support 2012 and 2008 — cannot accept Entra ID logins regardless of any other change, a constraint Book 03 formalizes as the Category 3 classification.

This makes version posture a primary input to the consolidation decision rather than a secondary one. An out-of-support instance on SQL Server 2012 is simultaneously a security-update liability, a licensing question, and an instance that cannot be migrated to Entra ID authentication without an engine upgrade. For most such instances, the right answer is not “upgrade in place to 2022 and then migrate” — it is “consolidate the surviving workload onto a modern target and retire the old engine.” The version lens and the utilization lens converge on the same conclusion for the bulk of the aged estate: collapse it onto fewer modern instances rather than carrying each old engine forward.

The licensing posture rides alongside the version posture. Consolidation that reduces the instance count also reduces the core-license consumption, and an estate that can state its true core count before consolidation can quantify the licensing dividend that consolidation produces.

Dependency Mapping

The third lens is the one that most often overturns a naive consolidation plan: dependency mapping. An instance that appears idle by connection count may be the silent target of a linked-server chain, a replication topology, an SSIS package, or a cross-database query that runs once a quarter and matters enormously when it runs.

Dependency mapping traces these relationships before any instance is moved. Linked-server definitions (sys.servers, sys.linked_logins) reveal the cross-instance — and frequently cross-domain — web that forest entanglement produced. Application-to-database mapping, drawn from connection telemetry and the application portfolio, reveals which databases are load-bearing for which systems. The SQL Server Agent job inventory, the replication configuration, and the SSIS/SSRS/SSAS footprint reveal the integration surface that a consolidation must preserve. Azure Migrate’s dependency analysis and the Data Migration Assistant’s compatibility findings supplement the in-engine views with workload-level dependency and feature-blocker data.

The dependency map is also the bridge to Book 08. The upstream applications that consume SQL Server — many of them LDAP-bound — are precisely the systems whose dependencies the map records, and the application-chain migration of Book 08 acts on the same relationships the rationalization lens surfaces here. An instance cannot be classified retire if a load-bearing application still depends on it, and the dependency map is what makes that judgment defensible rather than hopeful.

The Combined Picture

No single lens produces the rationalization decision. An instance that is lightly utilized but load-bearing for a quarterly process is not a retirement candidate. An out-of-support instance with heavy utilization is an urgent consolidation target, not a leave-alone. A zombie database on an otherwise healthy instance is a local retirement that shrinks the migration surface without touching the host. The three lenses together produce, for each instance and each database, a defensible judgment — and that judgment is the input to the decision Chapter 4 records.

 



The Retain, Consolidate, Retire Decision

Chapter 4 — The Retain, Consolidate, Retire Decision

The gate that determines which instances enter the authentication migration at all.

The assessment now resolves to a decision. Every instance the inventory surfaced and the rationalization lenses evaluated is assigned one of three classifications, and that classification governs whether the instance enters the authentication migration that Books 03 through 10 describe. the SQL Server authentication transformation decision §1 makes the classification a normative prerequisite: engine-layer authentication migration is performed only on instances classified retain or on the consolidation targets that absorb consolidated workloads. Instances classified retire or consolidate-into-target (source) are not migrated — they are decommissioned or collapsed.

The Three Classifications

A retain instance survives the transformation roughly in place. It carries current, load-bearing workload; it is on a supported version or has a clear in-place upgrade path to SQL Server 2022; and its dependencies do not argue for collapsing it into something larger. A retain instance proceeds directly into the Book 03 authentication audit and the Arc-eligibility classification.

A consolidate-into-target instance does not survive as an instance, but its workload does. The databases it carries are migrated onto a modern consolidation target, and the source instance is then retired. This is the classification for the large middle of an aged estate: lightly utilized instances, out-of-support engines whose workload is still needed, and instances whose only real function is to host one or two databases that belong on a shared platform. The migration work for these instances happens at the database-and-workload level; the authentication migration is performed on the target, not the source.

A retire instance does not survive at all, and neither does its workload. Zombie instances, instances whose every database is a zombie, and instances whose owning applications are decommissioned are retired outright. No login on a retire instance ever enters the migration pipeline — which is the entire point of running this assessment before the migration rather than after it.

Target-State Options

A consolidation target is the platform that absorbs consolidated workloads, and the assessment chooses among a small set of options based on the workload profile and the program’s boundary posture. Collapsing many instances onto fewer modern SQL Server 2022 instances — through instance stacking or database consolidation onto a shared engine — is the most direct path and keeps the workload on infrastructure the program already operates. Azure SQL Managed Instance offers a near-full-compatibility platform-as-a-service target for workloads that can move to a managed surface, eliminating the host and much of the patching burden. Azure SQL Database and elastic pools suit workloads that have been modernized to the database-scoped feature set.

The target choice interacts with the rest of the series. A consolidation onto SQL Server 2022 on an Arc-enabled host is exactly the Category 1 starting position that Book 03 describes and Book 05 migrates. A consolidation onto Azure SQL Managed Instance changes the authentication story in detail — the Managed Instance is natively Entra-integrated — but not in principle, because the destination is still Entra ID-only authentication. The point of naming the target during the assessment is that the authentication migration is then performed once, on the target, in its final shape, rather than twice.

What Cannot Be Consolidated

Not every instance that looks like a consolidation candidate can actually be consolidated, and the assessment must record the constraints honestly. Collation conflicts between databases that must coexist on a shared instance can block stacking. Version-locked vendor applications that certify only against a specific SQL Server version cannot be moved to a newer engine without losing vendor support. Compliance-isolation requirements — a database whose data classification mandates physical or logical separation — can prevent co-residency regardless of technical compatibility. And cross-database or cross-instance dependencies that the dependency map surfaced can make two instances a single indivisible unit that must move together or not at all.

Each of these constraints converts an apparent consolidate candidate into either a constrained-consolidation case (move it, but onto a dedicated rather than shared target) or a retain case (leave it in place and migrate its authentication where it sits). Recording the constraint is what makes the consolidation plan executable rather than aspirational.

The Identity Dividend

Consolidation and the authentication transformation are mutually reinforcing, and the assessment is the moment to realize the connection. Collapsing many instances across multiple domains into fewer modern targets is also the moment to collapse the forest-spanning identity sprawl that Chapter 1 described. The cross-domain logins, the orphaned SPNs registered in domains being decommissioned, and the shared service accounts drawn from several domains do not need to be re-pointed instance by instance if the instances carrying them are being retired or consolidated. They are resolved once, at the target, into Entra-backed identity.

This is why the consolidation decision gates the authentication migration rather than running alongside it. The retain instances and the consolidation targets are the surface on which Books 03 through 10 operate; everything classified retire or consolidate-source falls away before that work begins, and the forest entanglement falls away with it. the SQL Server authentication transformation decision §1 records this ordering as canon: assess and consolidate first, so the authentication transformation is spent only on the estate that survives.

 



Book_03 — Discovery: The Authentication Audit

What Microsoft’s Tools Measure — and the Cross-Estate Classification Only You Can Produce

Book_03 — Discovery: The Authentication Audit

 

Chapters



Get-SQLServerAuthAudit.ps1 — What It Measures and Why

Chapter 1 — Get-SQLServerAuthAudit.ps1: What It Measures and Why

The instrument that turns the surviving estate into a structured, drift-aware authentication record.

This audit runs only on the instances Book 02 classified as retain or consolidation-target — the rationalization decision has already removed the zombies and retirees from scope before a single line of enumeration runs.

Scope of the Enumeration

Get-SQLServerAuthAudit.ps1 performs a structured enumeration of the SQL Server estate across all hosts in the program’s management scope. For each host it identifies every SQL Server instance — named instances and the default instance — along with the version, edition, and build number.

The host operating system version is captured because it determines the Arc capability envelope. Windows Server 2019 and 2022 support the Connected Machine agent, and therefore support Arc-based Managed Identity for the SQL Server engine process. They do not, however, support the AADLoginForWindows OS-level Entra login extension, which requires Windows Server 2025. Windows Server 2025 supports both capabilities.

That distinction matters for migration sequencing, and the audit captures it explicitly. The domain-join status of the host is recorded alongside it: a host already migrated to a non-domain-joined state under the the hybrid-management non-domain-joined decision server transformation occupies a different starting position than a domain-joined host, and the per-instance output must reflect that.

Arc-enablement status — whether the Connected Machine agent is installed and the system-assigned Managed Identity is available — is the single most consequential classification output for migration prioritization. (the SQL Server authentication audit instrument)

Authentication Mode Configuration

For each instance the script reads the authentication-mode configuration. SQL Server supports two modes: Windows Authentication Only and Mixed Mode. In Windows Authentication Only mode, SQL Authentication logins are rejected at the connection level — no SQL Authentication credential is accepted regardless of whether a matching login exists in master. In Mixed Mode, both Windows Authentication and SQL Authentication are accepted.

The mode is stored in the Windows registry at HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\[InstanceName]\MSSQLServer\LoginMode: a value of 1 indicates Windows Authentication Only, and a value of 2 indicates Mixed Mode.

The audit reads this value directly and also cross-references it against the sys.configurations view within the instance. Discrepancies between the registry value and the running configuration can occur after a manual reconfiguration without a service restart. Any discrepancy is flagged as an anomaly requiring resolution before the migration can proceed.

Login Type Classification

The script connects to each instance and queries the sys.server_principals system view to enumerate all logins. Each login is classified by type: Windows logins derived from individual AD user accounts (type W, mapped by SID to an AD user object); Windows logins derived from AD security groups (type G, mapped by SID to an AD group object); SQL Authentication logins with credentials stored in master (type S); certificate-mapped logins (type C); and asymmetric key-mapped logins (type K).

The count and identity of each type is reported per instance. The presence of active SQL Authentication logins — type S — is a critical finding, because these logins are invisible to the Azure identity plane.

Such logins must be either migrated to Entra ID equivalents — type E, FROM EXTERNAL PROVIDER logins created in Book 04 — or formally excepted with documented justification before Transformation #7 can be declared closed.

The sa account’s status is separately flagged: enabled, disabled, or renamed. An enabled sa account with a non-rotated password is the highest-priority remediation finding in the audit output.

Service Account Identity and SPN Registration

The script captures the identity of the Windows service account running the SQL Server engine process — the MSSQLSERVER service or its named-instance equivalent — by querying the service configuration. This identifies whether the engine runs as a domain service account, a gMSA, the NT SERVICE\MSSQLSERVER virtual account, or another identity.

It then queries Active Directory — using the Get-ADServiceAccount and setspn equivalents — to determine whether the correct SPN is registered for the service account and the instance endpoint.

The SPN check is one of the most operationally valuable outputs of the audit. SPN misconfiguration is the primary cause of NTLM fallback, and it is not visible without deliberately querying AD for it.

An instance with a missing or incorrect SPN is generating NTLM traffic for every connection that expects Kerberos — and in most cases, the application teams generating those connections do not know it. (the SQL Server authentication audit instrument, the Kerberos/NTLM elimination decision)

The Arc-Eligibility Output

The most consequential output of the audit is the Arc-eligibility classification it assigns to every instance. Every instance falls into one of three categories.

Category 1 is Arc-eligible and Entra-auth-ready today: the server is already running the Connected Machine agent, the Azure extension for SQL Server has been deployed, the system-assigned Managed Identity is available for the engine process, and the SQL Server version is 2022 or later. A Category 1 instance can have its Entra ID logins created and its login migration begun immediately — it requires no further infrastructure work before Book 04’s migration pattern can be applied.

Category 2 is Arc-eligible but not yet enabled: the host meets all the prerequisites for Arc enablement — Windows Server 2019 or later, network connectivity to the Azure Arc endpoint, SQL Server 2022 — but the Connected Machine agent has not been installed. A Category 2 instance requires Arc deployment as the prerequisite action before login migration can begin.

Category 3 is not yet Arc-eligible. Either the SQL Server version is pre-2022 — 2019, 2017, or earlier — which means the engine cannot accept FROM EXTERNAL PROVIDER logins regardless of Arc status, or the host has a configuration that prevents Arc enrollment.

A Category 3 instance requires a SQL Server version upgrade as the gate before any Entra-auth migration can occur, and that upgrade timeline must be factored into the overall program sequencing ahead of Microsoft’s progressive NTLM defaults.

The the continuous compliance monitoring baseline Telemetry Sink

The audit script’s output is not a standalone deliverable — it is the input to the the continuous compliance monitoring baseline ingestion pipeline. This is the architectural characteristic that distinguishes the SQL Server authentication audit instrument from a conventional discovery script.

The the continuous compliance monitoring baseline — Continuous Compliance Monitoring, Boundary Identity Record — is the program-level tracking system for SQL Server authentication state at the instance level. Each time the audit runs — and it is designed to run continuously, on a schedule, against the full estate — it produces a structured record per instance that the the continuous compliance monitoring baseline pipeline ingests.

That pipeline computes the current authentication posture of the instance, compares it to the previous record, and flags any drift: a new SQL Authentication login that appeared since the last scan, an instance that has reverted from Entra-only authentication back to Mixed Mode, a new linked-server definition that uses NTLM passthrough.

Drift events in the the continuous compliance monitoring baseline are not informational — they are compliance violations that trigger the program’s remediation workflow. The output mandated by the Kerberos/NTLM elimination decision is a the continuous compliance monitoring baseline record per instance, not a spreadsheet delivered to a program manager. (the Kerberos/NTLM elimination decision, the SQL Server authentication audit instrument)

 



Reading the Audit — Classification and Triage

Chapter 2 — Reading the Audit: Classification and Triage

From a per-instance category to a defensible migration order — and the one distinction that prevents the program’s most common mistake.

Interpreting Category 1: Entra-Auth-Ready

A Category 1 classification is the program’s best starting position. It means the infrastructure prerequisites for Entra ID authentication are already in place — the Arc agent is running, the Azure extension for SQL Server is deployed, and the engine is running on SQL Server 2022.

The Managed Identity for the server is available, and the SQL Server extension has registered the instance with the Arc data services plane. Nothing in the infrastructure stack remains to be built.

The migration work for a Category 1 instance therefore begins with the login inventory from the audit: how many Windows logins exist, what AD groups are mapped to SQL Server roles, and whether any SQL Authentication logins need to be addressed before or alongside the Windows login migration. The specific migration steps are documented in Book 04.

The point here is that the audit has done its job for a Category 1 instance when it delivers a precise login inventory. The infrastructure work is already done, and the migration can proceed without any further prerequisites.

Interpreting Category 2: Arc-Eligible but Not Enabled

A Category 2 instance requires an Arc deployment action before login migration can begin. The audit output for such an instance should be used to prioritize that deployment.

Instances with a large number of Windows logins, active SQL Authentication logins, or missing SPN registrations — and therefore NTLM-generating connections — are higher priority for Arc deployment than instances with simple, well-configured Windows Authentication.

The Arc deployment itself is not a SQL Server change. It is a server-level action that installs the Connected Machine agent and the SQL Server extension. Book 03 describes the Arc deployment sequence in detail.

Once Arc deployment is complete and the SQL Server extension confirms the Managed Identity is available, the instance re-classifies from Category 2 to Category 1 on the next audit run, and the login migration can begin.

Interpreting Category 3: Version Upgrade Required

A Category 3 instance is the most operationally complex. A pre-2022 instance cannot accept FROM EXTERNAL PROVIDER logins regardless of any other configuration change.

The CREATE LOGIN [user@tenant] FROM EXTERNAL PROVIDER syntax was introduced in SQL Server 2022 as part of the Azure extension for SQL Server integration. Earlier versions do not support the syntax at all — it produces a parse error.

A Category 3 instance therefore has two possible paths: upgrade the SQL Server engine to 2022 and then proceed through the Category 2 pathway, or document a formal exception with a sunset date for the instance.

A Category 3 instance that cannot be upgraded to SQL Server 2022 as dependencies are remediated will face increasing friction as Microsoft tightens NTLM defaults, regardless of exception status. The NTLM block, when applied, is network-level and does not distinguish between instances that are excepted from the transformation and instances that are not.

The version-upgrade timeline for Category 3 instances must be integrated into the the SQL Server authentication transformation decision migration plan as an explicit dependency.

The SQL Engine vs. OS Entra Auth Distinction

One of the most important clarifications the audit output must carry — and that the teams reading it must internalize — is the architectural distinction between SQL Server engine Entra authentication and server OS Entra ID login capability. These are two separate capabilities with separate prerequisites, and confusing them is the most common misunderstanding this program will encounter.

SQL Server engine Entra authentication — Layer 1, the capability described in this series — requires the Arc Connected Machine agent, the Azure extension for SQL Server, and SQL Server 2022. It does not require the server to be domain-unjoined, and it does not require Windows Server 2025.

A domain-joined Windows Server 2019 host running SQL Server 2022 with Arc installed can have Entra ID-backed SQL Server logins today, while the server itself remains domain-joined and continues to authenticate OS-level users via Kerberos to the domain controller.

Server OS Entra ID login capability — Layer 2, the ability for administrators to RDP into the server using Entra ID credentials instead of domain credentials — is a separate transformation governed by the hybrid-management non-domain-joined decision. It requires domain unjoin and Windows Server 2025 with Desktop Experience.

The two capabilities are related — both are part of the identity and directory transformation inventory Transformation #7 — but they are sequenced independently, and the SQL Server engine migration can and should proceed first.

This sequencing point must be explicit in every instance of audit output that classifies a server as “not yet domain-unjoined.” The correct interpretation is not “SQL Server migration blocked” but “OS-level Entra login not yet available; SQL engine migration can proceed.” (the hybrid-management non-domain-joined decision)

 



Book_04 — Arc as the Identity Bridge

What Arc Provides to the SQL Server Engine — and the Deployment Sequence Only You Can Build

Book_04 — Arc as the Identity Bridge

 

Chapters



What Arc Provides to SQL Server

Chapter 1 — What Arc Provides to SQL Server

Arc is not an end state — it is the bridge that gives the SQL Server engine a cloud-native identity.

When most people encounter Microsoft Azure Arc in a cloud modernization program, they encounter it as a management capability. Arc lets you see on-premises servers in the Azure portal, apply Azure Policy to them, and manage them through Azure Resource Manager. That is accurate, but it understates the architectural significance of Arc for this specific transformation.

Arc does something more fundamental for SQL Server on-premises: it gives the server — and by extension, the SQL Server engine process — a cloud-native identity. Without that identity, the SQL Server engine has no credential that the Azure identity plane can issue, validate, or condition.

Without that identity, there is no Managed Identity to replace the AD service account, and no mechanism for the engine to authenticate to Azure Key Vault, forward logs to Azure Monitor, or accept Entra ID-issued OAuth 2.0 tokens from clients. Arc is the enablement layer for everything that follows in this series. (the hybrid-management non-domain-joined decision, the identity and directory transformation inventory Transformation #7)

The Arc Agent and the ARM Resource Identity

When the Microsoft Azure Connected Machine agent is installed on a server, that server acquires a resource identity in Azure Resource Manager. This is not a figurative identity or a management label. It is a first-class ARM resource, of type Microsoft.HybridCompute/machines, with a resource ID, a subscription scope, a resource group, and a set of ARM resource properties.

The ARM resource identity is what makes the server visible in the Azure portal, manageable through Azure Policy, and addressable by Azure Resource Manager API calls. More importantly for this series, it is the basis for the system-assigned Managed Identity.

The system-assigned Managed Identity is automatically created when the Arc agent is installed and the server resource is registered in ARM. The Managed Identity is an Entra ID service principal whose lifecycle is bound to the server resource. When the server resource exists in ARM, the Managed Identity exists in Entra ID; when the server is deregistered from Arc, the Managed Identity is deleted.

The Managed Identity’s credential — the private key for the identity’s certificate — is stored in the Arc agent’s local certificate store on the server and is rotated automatically by the Arc agent every 90 days. No human administrator ever sees the private key. No process has access to it except the Arc agent itself and the Windows security subsystem components the Arc agent uses to request tokens.

When any process on the server requests a token from the Arc agent’s local IMDS endpoint — http://localhost:40342/metadata/identity/oauth2/token — the Arc agent uses the Managed Identity certificate to authenticate to Entra ID and return a token. The token can be scoped to any Azure resource for which the Managed Identity has been granted access: Azure Key Vault, Azure SQL, Azure Storage, Azure Monitor, or any other service that accepts Entra ID-issued OAuth 2.0 tokens.

The Two-Layer Distinction

Arc enables two distinct Entra ID capabilities for SQL Server, and they are architecturally independent. This is the most commonly misunderstood aspect of the SQL Server identity transformation, and it must be stated precisely before any migration planning begins.

Failure to understand the distinction leads to incorrect sequencing assumptions — either blocking SQL engine migration on OS-level work that is not a prerequisite, or attempting OS-level Entra login without the domain unjoin it requires.

Layer 1 is SQL Server engine Entra authentication, which is the subject of this series. When the Azure extension for SQL Server is deployed on an Arc-enabled server running SQL Server 2022, the engine can be configured to accept Entra ID-issued OAuth 2.0 access tokens as the authentication credential for SQL Server logins.

Clients connect using CREATE LOGIN [user@tenant.onmicrosoft.com] FROM EXTERNAL PROVIDER logins, present an Entra ID access token scoped to the SQL Server’s Azure resource audience, and the engine validates the token against Entra ID’s public key infrastructure. This capability does not require the server to be domain-unjoined. It does not require Windows Server 2025.

It requires three things: the Arc Connected Machine agent installed and registered, the SQL Server 2022 engine, and the Azure extension for SQL Server deployed. A domain-joined Windows Server 2019 host with Arc installed and SQL Server 2022 running is fully capable of Layer 1 today.

Layer 2 is server OS Entra ID login capability, implemented via the AADLoginForWindows extension. This capability allows administrators to authenticate to the server’s operating system using Entra ID credentials — to RDP into the server using their Entra credentials instead of domain credentials. It is governed by the hybrid-management non-domain-joined decision and is part of the server infrastructure transformation, not the SQL Server authentication transformation.

It requires domain unjoin — the server must be removed from the Active Directory domain — and it requires Windows Server 2025 with Desktop Experience. This is a more disruptive change than Layer 1: domain unjoin affects every service on the server that depends on AD membership, requires coordination with every team that manages the server, and has implications for DNS, Group Policy, and certificate enrollment that must be planned carefully.

The sequencing guidance is clear. Layer 1 can and should be completed before Layer 2 begins. SQL Server engine authentication can be migrated to Entra ID while the server remains domain-joined, providing transformation progress and security improvement without incurring the operational risk of domain unjoin. (the hybrid-management non-domain-joined decision)

The Managed Identity as Service Account Replacement

The SQL Server engine process typically runs as NT SERVICE\MSSQLSERVER on most standard installations, or as a domain service account or gMSA on installations where the default virtual account was changed. When the Arc agent is installed and the Azure extension for SQL Server is configured, the engine can use the server’s system-assigned Managed Identity to authenticate to Azure services.

The SQL Server extension registers the Managed Identity with the Azure SQL Arc resource plane and configures the engine’s use of the Managed Identity for specific Azure-service interactions. Key Vault secrets, Azure Monitor log forwarding via the Azure Monitor agent, and Azure Arc data services all authenticate via the Managed Identity rather than via stored credentials.

This does not immediately change how the SQL Server engine authenticates to the Windows operating system. The engine still runs as NT SERVICE\MSSQLSERVER for local process purposes. What changes is the engine’s Azure-plane identity: Azure resources see the Managed Identity rather than a service account credential.

The service account migration for SQL Server is thus Arc-first. Deploy Arc, deploy the SQL Server extension, and the engine’s Azure identity is established without any credential management or credential rotation risk.

Why Arc and Not the Alternatives

A skeptical reviewer will ask the fair question directly: why Arc, and not one of the identity mechanisms the organization already operates? The answer is not that Arc is fashionable — it is that every alternative either re-anchors on the very directory the program is retiring, or reintroduces the stored credential the transformation exists to eliminate.

A group Managed Service Account or domain service account is the incumbent, and it works — for as long as Active Directory remains the authoritative identity source. It does not. Driver Three of Book 01 is precisely that AD is removed as the authority for this boundary; binding the engine’s new identity to a gMSA would anchor it to the thing being decommissioned, which is circular. A service principal with a client secret — whether the secret sits on disk or in Azure Key Vault — solves the AD-anchoring problem but reintroduces a stored, rotatable credential, and a bootstrapping one: the engine must authenticate to the vault before it can read the secret, so a root credential lands on the server regardless. That is the credential-management and rotation risk the program is trying to retire, not relocate.

Certificate-based authentication is viable, and is in fact the program’s chosen posture — but as the interim one. the Kerberos/NTLM elimination decision and the SQL Server authentication transformation decision §4 authorize Certificate-Based Authentication specifically for the pre-2022 exception long-tail that cannot reach Kerberos or Entra OAuth as dependencies are remediated; it still requires certificate lifecycle management, which is why it carries the ADCS-to-Cloud-PKI dependency (the identity and directory transformation inventory, “Not Yet Defined”). It is a bridge, not a destination.

The Arc system-assigned Managed Identity is the only option that is simultaneously cloud-native and credential-free from the operator’s perspective: the certificate lives in the Arc agent’s local store, rotates automatically every 90 days, is never visible to any human, and its lifecycle is bound to the ARM resource rather than to a directory the program is removing. No secret to vault, no rotation to schedule, no AD object to preserve. That is why Arc wins — not by assertion, but because it is the one mechanism that survives the removal of AD without recreating a managed secret. (the hybrid-management non-domain-joined decision, the Kerberos/NTLM elimination decision, the SQL Server authentication transformation decision)

What Arc Does Not Do

It is equally important to be precise about what Arc does not change, because the scope of Arc’s effect on SQL Server is frequently overstated in both directions. Arc does not change how SQL Server authenticates connections from domain-joined clients.

A domain-joined Windows client connecting to a SQL Server instance on an Arc-enabled server using Integrated Security=True still uses Kerberos or NTLM — the same protocol negotiation described in Book 01. The Arc agent has no effect on the SQL Server engine’s SSPI-based authentication of Windows-integrated connections, and Arc installation alone produces no Entra ID sign-in events for SQL Server connections.

Arc does not move any login from the Windows type to the External Provider type. Arc does not disable Windows Authentication or Mixed Mode. Arc does not affect the SPN registration status for the instance. Arc is the enablement layer; it provides the capability for Entra ID authentication without activating it.

The login migration described in Book 04 is what actually changes the authentication behavior for SQL Server connections — Arc merely makes that migration possible. Understanding this distinction is essential for communicating the transformation scope to stakeholders: Arc deployment is a necessary prerequisite, but it is not the transformation itself.

 



Arc Deployment Sequencing for SQL Server Hosts

Chapter 2 — Arc Deployment Sequencing for SQL Server Hosts

The ordered prerequisites that turn a domain-joined SQL Server host into an Arc-enabled, identity-ready instance.

Arc deployment is a sequence, not a single act. Each step has a prerequisite that the prior step satisfies, and skipping ahead produces failures that are easy to misdiagnose as migration problems when they are in fact enrollment problems. The order is connectivity first, then the SQL Server extension, then a verification that the Managed Identity is actually present and answering.

Prerequisites for Arc Enrollment

The Connected Machine agent requires outbound HTTPS connectivity from the server to the Azure Arc endpoints — management.azure.com, login.microsoftonline.com, and the Arc-specific regional endpoints. In a GCC-Moderate boundary, this connectivity must be routed through the program’s approved network egress path.

Direct internet egress from a production SQL Server host is not acceptable under the boundary’s network posture. The Arc agent supports proxy configuration for HTTPS traffic, and the proxy address must be provided at installation time.

Connectivity verification — confirming that the server can reach all required Arc endpoints through the approved proxy — is the first prerequisite check before Arc deployment begins. An agent that cannot reach its endpoints will fail to register its ARM resource, and without that resource there is no Managed Identity to verify later.

The Azure Extension for SQL Server

The Azure extension for SQL Server is a distinct installation from the Connected Machine agent and must be deployed after the agent is enrolled. It is installed via Azure Policy assignment — the recommended approach for fleet-wide deployment — or via the Azure portal or CLI for individual servers.

The extension performs additional validation at installation time. It verifies the SQL Server version, where 2022 or later is required for Entra auth capability; it registers the SQL Server instance with the Arc SQL resource plane; and it configures the Managed Identity access for the engine process.

The the SQL Server authentication audit instrument audit’s Arc-eligibility classification — Category 1 versus Category 2 versus Category 3 — is the primary input for prioritizing Arc deployment across the estate. Category 2 instances are the immediate deployment targets, and the audit’s login inventory and NTLM risk signals within Category 2 are used to order those deployments by remediation urgency. (the SQL Server authentication audit instrument, the hybrid-management non-domain-joined decision)

Verification of Managed Identity Availability

After the Connected Machine agent is installed and the Azure extension for SQL Server is deployed, the program must verify that the system-assigned Managed Identity is available before proceeding to the login migration. This verification is not optional — it is the gate between enrollment and migration.

The verification check calls the local IMDS endpoint on the server — http://localhost:40342/metadata/identity/oauth2/token?api-version=2019-11-01&resource=https://management.azure.com/ — and confirms that the Arc agent returns a valid access token.

A successful token response confirms three things at once: that the Managed Identity is enrolled in Entra ID, that the Arc agent is functioning, and that the server’s ARM resource is in a healthy state. A failed token response at this stage requires Arc troubleshooting before the SQL Server migration can proceed.

The the SQL Server authentication audit instrument audit’s Arc-eligibility classification is updated on each run to reflect the current Managed Identity availability state, so the the continuous compliance monitoring baseline record for the instance reflects this verification outcome in near-real-time.

 



Book_05 — The Login Migration: Windows Principals to Entra Logins

What Microsoft’s Login Syntax Enables — and the Principal Mapping Only You Can Resolve

Book_05 — The Login Migration: Windows Principals to Entra Logins

 

 

 

 

 

 

Chapters



Three Principal Types — User, Group, Service Principal

Chapter 1 — Three Principal Types — User, Group, Service Principal

The moment the engine stops accepting Kerberos and NTLM and starts accepting Entra-issued tokens.

This is the technical heart of the series. The login migration is the moment where the SQL Server engine stops accepting the authentication artifacts of the old world — AD-issued Kerberos service tickets, NTLM challenge-response exchanges, Windows Integrated Security — and starts accepting the artifacts of the new world: Entra ID-issued OAuth 2.0 access tokens, validated against Entra’s public key infrastructure.

Those tokens carry claims about the principal’s identity, group memberships, device compliance state, and MFA completion. Everything in Books 01 through 04 is prerequisite; everything in Books 06 through 10 is consequence. This chapter is the migration itself, and the SQL Server authentication transformation decision §2 records the canonical sequence it follows.

The FROM EXTERNAL PROVIDER Syntax

SQL Server 2022 introduces a new login creation syntax that is the foundation for the entire migration: CREATE LOGIN [principal] FROM EXTERNAL PROVIDER. This statement maps an Entra ID principal — identified by its user principal name for users, its display name for groups, or its application ID for service principals — to a SQL Server login without any Active Directory involvement at login creation time.

The login is stored in the master database as a type-E login, an external principal. It has no password stored in SQL Server. Authentication for a type-E login is performed by the client presenting a valid Entra ID OAuth 2.0 access token, scoped to the SQL Server’s Azure resource audience, at connection time.

The engine validates the token’s cryptographic signature against Entra ID’s public key infrastructure, extracts the claims from the token payload, and maps the principal identity in those claims to the corresponding FROM EXTERNAL PROVIDER login in master. If the mapping succeeds and the login is enabled, the connection is accepted, and the principal is granted the permissions associated with the login and any database user roles.

The syntax requires that the Azure extension for SQL Server is installed on the host — which provides the Managed Identity and the Entra ID token validation infrastructure — and that the instance has been registered with the Azure Arc SQL resource plane (the hybrid-management non-domain-joined decision). The CREATE LOGIN statement itself does not call out to Entra ID at execution time. It stores the principal identifier in master and relies on token validation at connection time.

This means the login can be created even if the principal does not yet exist in Entra ID, though a connection attempt with a non-existent principal will fail at token issuance — Entra will not issue a token for a principal that does not exist. The best practice is to verify that the Entra principal exists before creating the SQL Server login, to avoid orphaned type-E logins in master that map to deleted or renamed Entra principals.

Type 1 — Entra User Login

The Entra user login is for human database administrators and developers. The migration pattern for a Windows login derived from an individual AD user account — CREATE LOGIN [DOMAIN\username] FROM WINDOWS — is to create a corresponding type-E login for the same principal’s Entra UPN: CREATE LOGIN [username@tenant.onmicrosoft.com] FROM EXTERNAL PROVIDER.

The user’s UPN in Entra ID may differ from their SAM account name in AD, particularly in environments where UPN synchronization has not been standardized. The audit must capture the UPN-to-SAMAccountName mapping for all Windows logins before the migration begins, so that the Entra principal is correctly identified for each type-E login. After the login is created, the user authenticates to Entra ID using their normal credentials — password plus MFA, FIDO2, or Windows Hello for Business depending on the Conditional Access policy targeting. Entra issues an access token scoped to the SQL Server resource audience, carrying the user’s UPN and object ID as claims; the engine validates the token and maps the UPN to the type-E login.

Multi-factor authentication enforcement is handled entirely by the Conditional Access policy targeting the user and the SQL Server application registration. The SQL Server engine itself does not implement MFA logic and has no awareness of whether MFA was completed. This is the correct architectural division of responsibility: the Conditional Access policy in the Entra ID plane enforces the MFA requirement before the token is issued, and the engine trusts the token because it was issued by the Entra ID service the engine trusts (the zero-trust identity decision).

If MFA was not completed, the Conditional Access policy denies the token request, and the SQL Server connection never opens. There is no SQL Server-level MFA prompt and no SQL Server-level MFA bypass. The Conditional Access policy also evaluates device compliance, network location through Named Locations, and sign-in risk level before issuing the token. All of these controls apply to SQL Server connections using type-E logins, and none of them apply to connections using Windows Authentication or NTLM. (the zero-trust identity decision)

Type 2 — Entra Group Login

A SQL Server login can be created for an Entra ID security group rather than an individual user: CREATE LOGIN [GroupDisplayName] FROM EXTERNAL PROVIDER. When a user whose Entra access token includes a claim asserting membership in the named group connects to SQL Server, the engine maps the group claim to the group login and grants the user the permissions associated with that login.

This is the group-based access control pattern familiar from AD group-based SQL Server access, but it operates entirely through Entra ID group membership and OAuth 2.0 claims rather than through AD SID resolution and Kerberos PAC group membership. The shift from SID-and-PAC to claim is the whole difference between the old plane and the new one.

The significance of group-based type-E logins for this program is substantial. An Entra dynamic security group — a group whose membership is defined by a membership rule rather than by manual assignment — whose rule references the organizational-attribute model extensionAttributes can drive SQL Server access without any manual DBA provisioning action. The DBA team for an organizational boundary is the set of users whose the organizational-attribute model attributes match the dynamic group’s membership rule, and that set is computed continuously by Entra ID’s group membership engine as the organizational-attribute model values change with HR data (the dynamic group provisioning decision).

A user who joins the DBA team gains SQL Server access when their the organizational-attribute model attributes are updated to reflect the new role — without any DBA issuing a CREATE USER statement. A user who leaves loses access when those attributes are updated — without any DBA issuing a DROP USER. The dynamic group is the policy; the organizational-attribute model is the data; Entra ID is the engine; and SQL Server consumes the result. This is the architectural connection between the the organizational-attribute model Narrative and this series, now expressed at the SQL Server engineering layer. (the dynamic group provisioning decision)

Type 3 — Entra Service Principal Login

For application service accounts and automated processes that connect to SQL Server — ETL pipelines, reporting services, API backends, monitoring agents — the migration pattern replaces the SQL Authentication service account, a type-S login with a stored password, with an Entra service principal login: CREATE LOGIN [ApplicationDisplayName] FROM EXTERNAL PROVIDER, where the display name corresponds to the Entra ID application registration for the connecting application.

The application authenticates to Entra ID using its client credentials — which should be a client certificate rather than a client secret, or preferably no credential at all if the application runs on an Azure resource or an Arc-enabled server with a Managed Identity. The Managed Identity authenticates to Entra ID without any credential, obtains an access token scoped to the SQL Server resource audience, and presents that token at connection time.

The service principal pattern eliminates the SQL Authentication service account entirely: no username and password in connection strings, no credential rotation process, no risk of credential exposure in configuration files, log outputs, or code repositories. For applications running on Arc-enabled servers, the Managed Identity is available at the IMDS endpoint, and the Azure.Identity SDK’s DefaultAzureCredential chain will automatically use it (the workload identity decision).

For applications running in Azure virtual machines, Azure Container Instances, or Azure App Service, the platform-provided Managed Identity is used. For applications that cannot use a Managed Identity and must use a service principal with a credential, a client certificate is preferred over a client secret, and the certificate must be stored in Azure Key Vault rather than in any file system location. (the workload identity decision)

The Parallel-Run Migration Pattern

Existing Windows logins must not be dropped until their Entra equivalents have been validated. The migration follows the three-phase parallel-run pattern that the SQL Server authentication transformation decision §2 makes required for production instances, ensuring no access is disrupted during the transition. In Phase 1, type-E equivalents are created for every migrating login. For each Windows login — whether derived from an individual AD user account or an AD security group — a corresponding FROM EXTERNAL PROVIDER login is created using the Entra principal that corresponds to the AD principal.

The Entra-to-AD principal mapping must be verified before each login creation, and any principal for which no Entra equivalent can be confirmed is flagged as a blocking finding requiring resolution before the login can be created. This mapping verification is the most operationally intensive part of the migration: the the SQL Server authentication audit instrument audit output provides the AD principal inventory, and the Entra ID directory provides the UPN and group display name data needed for the mapping.

In Phase 2, each type-E login is validated by executing a test authentication using the real Entra credential for the corresponding principal. The test authentication must succeed before any legacy login is modified. In Phase 3, legacy Windows and SQL Authentication logins are disabled — not dropped — after successful validation of their Entra equivalents. The disabled logins are retained for a 30-day observation window during which connection monitoring confirms that no application or user still depends on them.

After the 30-day window, the disabled logins are dropped, and the type-E logins become the sole authentication mechanism for those principals. the SQL Server authentication transformation decision §2 permits non-production instances to compress the observation window with documented owner sign-off, but the create-validate-disable-observe-drop sequence itself is the canonical pattern, and the next chapter records the four further decisions the SQL Server authentication transformation decision makes around it.

 



What the SQL Server authentication transformation decision Decides

Chapter 2 — What the SQL Server authentication transformation decision Decides

The five governance positions that turn the migration pattern into enforceable canon.

The migration pattern in Chapter 1 covers the core engineering case — Windows logins migrated to type-E logins through FROM EXTERNAL PROVIDER — but a pattern alone leaves a set of governance positions that a narrative is not the instrument to settle. Those positions require an architecture decision record, and that record is the SQL Server authentication transformation decision, accepted in PROPOSED status on 2026-06-02 as the engine-layer companion to the Kerberos/NTLM elimination decision (protocol layer) and the hybrid-management non-domain-joined decision (server and OS layer).

An early draft of this series referred to a “forthcoming the high-availability decision.” That number was independently taken by an unrelated substrate high-availability decision on the same date, so the engine-layer SQL Server authentication decision is recorded as the SQL Server authentication transformation decision. It does not defer these questions: it answers all five, in operational sequence, and this chapter presents each as the SQL Server authentication transformation decision records it.

Decision 1 — Consolidation Precedes and Gates Auth Migration

the SQL Server authentication transformation decision §1 records the first and ordering decision: the estate consolidation assessment precedes and gates the engine-layer authentication migration. The SQL Server estate that has accumulated across an Active Directory forest over twenty years is not migrated in the shape it is discovered in. Before any instance is migrated to Entra ID authentication, the consolidation assessment must classify it as retain, consolidate-into-target, or retire.

Engine-layer auth migration is performed only on instances classified retain or on the consolidation targets that absorb consolidated workloads. Instances classified retire or consolidate-into-target as a source are not migrated — they are decommissioned or collapsed, and migrating their logins to Entra ID first would be wasted effort. This is the decision Book 02 established at the assessment layer; the SQL Server authentication transformation decision §1 makes it the normative prerequisite to everything in this book.

The Arc-eligibility classification from the SQL Server authentication audit instrument — Category 1, 2, or 3 — is layered on top of the consolidation classification, not before it. Consolidation and auth transformation are mutually reinforcing: collapsing many instances across multiple domains into fewer modern SQL Server 2022 targets, or into Azure SQL Managed Instance or Arc-enabled SQL, is the natural moment to retire cross-domain login sprawl, orphaned SPNs, and shared service accounts into Entra-backed identity.

Decision 2 — The Parallel-Run Sequence Is Required

the SQL Server authentication transformation decision §2 records that the canonical login migration is a three-phase parallel run, and that it is required for production instances. For every instance classified retain or target, Windows logins — type-U users and type-G groups — and SQL Authentication service-account logins, type-S, are migrated to Entra ID external-provider logins across the three principal types Chapter 1 described. The letters are the values of sys.server_principals.type, not mnemonics: S SQL login, U Windows login, G Windows group, E external (Entra) login. There is no type W — a discovery query written against one returns zero rows and reports a clean instance, which is how a typo becomes a false attestation of closure.

Phase 1 creates a type-E equivalent for every migrating login, with the Entra-to-AD principal mapping verified before each CREATE LOGIN and any unconfirmable principal raised as a blocking finding. Phase 2 exercises each type-E login with a real Entra-credentialed test authentication, which must succeed before the corresponding legacy login is touched. Phase 3 disables the legacy logins — not drops them — after their Entra equivalents validate, retains them for a 30-day observation window during which monitoring confirms no residual dependency, then drops them.

The earlier draft framed this sequence as something a governance record “must decide” between required, recommended, and discretionary. the SQL Server authentication transformation decision §2 settles it: the parallel run is required for production, and non-production instances may compress the observation window only with documented owner sign-off. Disable-and-observe makes every cutover reversible inside the window, so no principal is locked out by a mapping that turned out wrong.

Decision 3 — SQL Authentication Eliminated; sa Disabled and Renamed

the SQL Server authentication transformation decision §3 records the disposition of SQL Authentication. Every active type-S login on a retain or target instance is migrated to a type-E service-principal or Managed-Identity login, or carries a documented exception under §4 with a named compensating control and a sunset date. SQL Authentication produces no Entra ID sign-in events and is invisible to Conditional Access and Defender for Identity; it is not an acceptable steady-state credential.

This is the position the earlier draft left open — whether every SQL Authentication login must migrate, or whether some type-S logins could be retained with justification. the SQL Server authentication transformation decision §3 closes it toward elimination, allowing only the §4 documented-exception path rather than open-ended retention.

The built-in sa account is disabled and renamed on every production instance. Emergency-access recovery, if retained, is documented as a break-glass procedure with its own monitoring, not as an active sa login. An enabled sa account with a non-rotated password is the highest-priority remediation finding in the the SQL Server authentication audit instrument audit. A single active sa or type-S login defeats the entire Conditional Access perimeter, because it authenticates outside the Entra ID plane — the perimeter is binary, covering all connections or none.

Decision 4 — Pre-2022 Instances Are Upgrade-or-Except

the SQL Server authentication transformation decision §4 records the exception path for instances that cannot accept type-E logins. CREATE LOGIN ... FROM EXTERNAL PROVIDER requires SQL Server 2022 plus the Azure extension for SQL Server on an Arc-enabled host, so a pre-2022 Category 3 instance cannot accept external-provider logins regardless of Arc status.

A Category 3 instance classified retain has two paths: upgrade the engine to SQL Server 2022 and then proceed through the Category 2-to-Category 1 pathway, or file a documented exception with a sunset date. the SQL Server authentication transformation decision §4 notes that most Category 3 instances should be consolidation retire or consolidate-into-target candidates under §1 rather than upgrade candidates. The exception process requires the inability-to-migrate reason, the compensating control, the maximum exception duration, and explicit acknowledgement that the NTLM block, when applied, is network-level and does not honor engine-layer exception status.

Where a connection cannot reach Kerberos or Entra OAuth before that deadline, Certificate-Based Authentication is the authorized interim posture per the Kerberos/NTLM elimination decision. That makes the certificate-authority dependency — the ADCS-to-Cloud-PKI transformation, classified Not Yet Defined in the identity and directory transformation inventory — a hard dependency for the exception long-tail. The earlier draft asked what evidence an exception requires, what its maximum duration is, and what happens if an instance is still excepted at the deadline; §4 records all three, with the CBA interim posture as the answer for connections that physically cannot reach the modern planes in time.

Decision 5 — The the continuous compliance monitoring baseline Record Is the Closure Artifact

the SQL Server authentication transformation decision §5 records the closure condition. Transformation #7 is closed for an instance when its the continuous compliance monitoring baseline record simultaneously shows LoginMode = 1 (Windows Authentication Only), zero active type-S logins outside the exception registry, zero active type-U or type-G logins, sa disabled and renamed, the Arc Connected Machine agent enrolled and healthy, the Azure extension for SQL Server deployed with the Managed Identity active, and — for human principals — Conditional Access MFA enforcement satisfied for SQL Server resource sign-ins over a defined validation period.

The earlier draft observed that without a defined evidence artifact there was no enforceable completion criterion. the SQL Server authentication transformation decision §5 supplies exactly that field set: the specific values that, populated correctly, constitute proof that the instance has completed the transformation. “Done” stops being a subjective claim and becomes a queryable posture.

Closure is continuously verified, not a point-in-time claim. the SQL Server authentication audit instrument runs on a recurring schedule, and the continuous compliance monitoring baseline drift events — LoginMode reverting to Mixed Mode, a new type-S, type-U, or type-G login appearing, the Arc agent going offline — are compliance violations that trigger the remediation workflow. With all five positions recorded, the migration pattern of Chapter 1 becomes enforceable canon rather than operational best practice, and the books that follow operate against a defined closure artifact rather than a moving target.

 



Book_06 — Eliminating NTLM at the SQL Layer

What Microsoft’s Enforcement Controls Block — and the Pattern Classification Only You Can Apply

Book_06 — Eliminating NTLM at the SQL Layer

 

Chapters



NTLMv1, NTLMv2, and the Patterns That Generate NTLM

Chapter 1 — NTLMv1, NTLMv2, and the Patterns That Generate NTLM

NTLM is a protocol, not a setting — so eliminating it means naming every connection pattern that produces it.

NTLM is a protocol, not a configuration setting, and that distinction governs everything in this book. There is no single switch to flip and no single Group Policy change that removes NTLM from SQL Server connections. Eliminating NTLM at the SQL layer requires identifying every connection pattern that generates NTLM traffic, and there are more such patterns than most database teams expect.

The most obvious is the missing-SPN case described in Book 01, where Kerberos negotiation fails because no SPN is registered and SSPI falls back to NTLM. But other patterns exist: cross-site connections, linked-server definitions using passthrough authentication, and application connections from hosts that have already been migrated to a non-domain-joined state. Each pattern has a different root cause and a different remediation path, and none of them can be addressed until it has been detected. (the Kerberos/NTLM elimination decision)

 

NTLMv1: Blocked First, in Phase B

NTLMv1 is the older of the two NTLM variants, and it carries well-documented cryptographic weaknesses that make it unsuitable for any authenticated environment. The NTLMv1 challenge-response uses an MD4 hash of the user’s password as the response key, which is vulnerable to pass-the-hash attacks.

An attacker who captures the NTLMv1 response can mount an offline dictionary attack against the MD4 hash, and can replay the captured hash to authenticate as the victim without ever learning the plaintext password. NTLMv1 also provides no session signing, so a network attacker positioned between the client and the server can modify data in transit without detection.

the Kerberos/NTLM elimination decision blocks NTLMv1 in its Phase B “block-where-safe” stage — by default immediately upon completion of the Phase A assessment, with the implementation plan targeting 2026-Q3 — implemented through Group Policy. The “Network Security: LAN Manager Authentication Level” policy is set to “Send NTLMv2 response only; refuse LM and NTLM.” Once that policy is in force, any connection attempt that generates LM or NTLMv1 authentication traffic is refused inside the Windows security subsystem — the Local Security Authority (LSA) negotiates only NTLMv2, and the server rejects the weaker protocols. This puts the program slightly ahead of Microsoft’s own NTLMv1 enforcement, which flips the BlockNTLMv1SSO default from Audit to Enforce via Windows Update in October 2026 for devices without an explicit policy; the program’s Group Policy makes the block deterministic rather than waiting for the platform default. (the Kerberos/NTLM elimination decision)

In a modern SQL Server environment, NTLMv1 should not appear in any connection. SQL Server clients and servers running on Windows Server 2016 or later, with default security configuration, do not generate NTLMv1 traffic. It surfaces only in environments with very old clients — Windows 7 and earlier — or with applications that have explicitly configured LM or NTLM rather than NTLMv2 as the authentication protocol.

If the the SQL Server authentication audit instrument audit or the Phase A network-traffic analysis reveals NTLMv1 in SQL Server connection traffic, it is a critical finding that requires immediate remediation regardless of the broader migration timeline. NTLMv1 in a production SQL Server connection stream is a significant security vulnerability and a compliance violation under the Kerberos/NTLM elimination decision, and it cannot be treated as a routine migration item.

NTLMv2: The Elimination Phase

NTLMv2 is the current NTLM variant, and it addresses the cryptographic weaknesses of its predecessor. It uses HMAC-MD5 rather than MD4, incorporates a client challenge in addition to the server challenge to prevent replay attacks, and supports session signing. NTLMv2 is the variant that most SQL Server NTLM traffic in a modern federal environment will be generating.

Unlike NTLMv1, NTLMv2 is not removed in Phase B. the Kerberos/NTLM elimination decision restricts it via Group Policy to documented exception groups during Phase B, but full disablement waits for the elimination phase — Phase C — which is applied as operational readiness allows. The phased timeline exists to give programs the operational space to identify and remediate NTLMv2-generating connection patterns before the block is applied.

That space narrows with each release as Microsoft tightens defaults, and the program must maintain forward momentum. the Kerberos/NTLM elimination decision’s elimination phase applies domain-wide NTLM restrictions program-wide — the program’s own NTLM-elimination step, timed to complete ahead of Microsoft’s progressive default-disable. SQL Server NTLMv2 connections must be migrated either to Kerberos as an interim posture — using Cloud Kerberos trust per the Kerberos/NTLM elimination decision (Cloud Kerberos trust) — or to Entra ID OAuth 2.0 authentication as the final destination. (the Kerberos/NTLM elimination decision)

Pattern One: Missing or Incorrect SPN

The most common cause of NTLM fallback in SQL Server connections is a missing or incorrect SPN registration. When a client opens a connection using Windows Integrated Security, SSPI checks whether a valid SPN exists for the SQL Server endpoint. If the SPN is missing from the service account’s AD object, SSPI cannot negotiate Kerberos and falls back to NTLM.

The SPN must take the form MSSQLSvc/hostname.domain.com:port and must be registered on the service account that the SQL Server engine process runs under. Named instances use the named-instance format, MSSQLSvc/hostname.domain.com:instancename, in addition to the port format.

If the service account has been changed without updating the SPN registration — a common occurrence during service-account migration — the SPN may exist but be registered on the wrong account, which produces the same NTLM fallback. SPN remediation is straightforward: setspn -S MSSQLSvc/hostname.domain.com:port serviceaccount. The the SQL Server authentication audit instrument audit captures SPN registration status for every instance, and any instance with a missing or incorrect SPN is a discovery-phase finding that can be remediated independently of the broader login migration.

Pattern Two: Cross-Site Connections

SQL Server connections that originate from a client in one Active Directory site and target a server in a different AD site can generate NTLM traffic if the client cannot reach the KDC in the server’s site. Kerberos requires the client to obtain a service ticket from the KDC that is authoritative for the server’s service-account domain.

If the client’s network path to the server-site KDC is blocked or unreliable, SSPI falls back to NTLM. In a distributed federal environment with multiple AD sites across geographic locations and network boundaries, this pattern is not uncommon.

Cross-site NTLM is detectable from the Phase A audit output by correlating connection source and destination network topology. If the source host and the destination SQL Server host are in different AD sites, and the connection is generating NTLM traffic, the likely cause is KDC accessibility from the source site. The remediation is either to ensure KDC reachability from all client sites — adjusting firewall rules for Kerberos traffic on UDP and TCP port 88 — or to implement Cloud Kerberos trust, which satisfies Kerberos authentication through the Azure cloud KDC rather than the on-premises AD site KDC, per the Kerberos/NTLM elimination decision (Cloud Kerberos trust).

Pattern Three: Linked-Server Passthrough Authentication

Linked-server definitions in SQL Server — which allow one instance to query another using OPENQUERY or four-part name syntax — frequently use Windows passthrough authentication as the mechanism for the linked-server connection. In the passthrough model, the originating instance impersonates the connecting client’s Windows identity and presents that identity to the target SQL Server using NTLM.

This happens because the originating server, acting as an intermediary, typically cannot negotiate Kerberos for the impersonated identity without Kerberos delegation configured. Kerberos constrained delegation for linked-server passthrough is a known pattern but requires specific AD configuration; in its absence, linked-server passthrough generates NTLM traffic.

Linked-server NTLM is particularly insidious because it often appears in monitoring as “internal” database traffic and is not always visible in standard SQL Server connection audits. It requires examination of the sys.linked_logins and sys.servers views as well as network-traffic analysis between instances. Any linked-server definition that uses passthrough authentication must be identified during discovery and migrated to a defined security context — a specific login or Managed Identity — during the restriction phase.

Pattern Four: Non-Domain-Joined Application Hosts

Any application running on a host that has been migrated to a non-domain-joined state — as part of the the hybrid-management non-domain-joined decision server transformation — but still connecting to SQL Server using Windows Integrated Security will generate NTLM traffic. A non-domain-joined host has no Kerberos TGT from the KDC and cannot negotiate Kerberos for SQL Server connections. SSPI falls back to NTLM using local credentials when the application host is in a workgroup.

This pattern becomes more prevalent as the the hybrid-management non-domain-joined decision server migration progresses. As more application servers are domain-unjoined, the applications running on them that still use Windows Integrated Security become new NTLM sources. This is a strong operational argument for completing the SQL Server connection-string migration in parallel with, or before, the domain unjoin of application hosts.

An application host that has been domain-unjoined and whose connection string uses Managed Identity authentication generates no NTLM traffic and is fully compliant with both the hybrid-management non-domain-joined decision and the Kerberos/NTLM elimination decision. An application host that has been domain-unjoined but whose connection string still uses Windows Integrated Security is now an NTLM source that did not exist before the domain unjoin. (the hybrid-management non-domain-joined decision, the Kerberos/NTLM elimination decision)

 



The Three Phases of NTLM Elimination for SQL Server

Chapter 2 — The Three Phases of NTLM Elimination for SQL Server

Discover, restrict, eliminate — the same phase structure the Kerberos/NTLM elimination decision applies program-wide, applied specifically to SQL Server workloads.

the Kerberos/NTLM elimination decision structures NTLM elimination into three phases — discover, restrict, eliminate — and this chapter applies that structure specifically to SQL Server workloads. The phases are sequential, and the elimination phase is applied as operational readiness allows — ahead of Microsoft’s progressive NTLM default-disable, not waiting for a fixed calendar date.

Once the elimination phase is applied, any SQL Server connection that requires NTLM will fail at the LSA layer — inside the host’s Windows security subsystem, where the Local Security Authority (LSA) enforces the policy. The SQL Server engine will not receive an authenticated connection; the NTLM exchange is rejected by the LSA before the engine evaluates the login. SQL Server NTLM elimination is therefore not decoupled from the broader the Kerberos/NTLM elimination decision posture. Every NTLM-generating connection pattern must be resolved before the elimination phase, not after. (the Kerberos/NTLM elimination decision)

Phase A — Discovery

The discovery phase is the Kerberos/NTLM elimination decision’s first phase, and for SQL Server its primary instrument is the SQL Server authentication audit instrument. The Phase A output for SQL Server includes the full instance inventory with Arc-eligibility classifications, the login-type inventory, the SPN registration status for every instance, and the service-account identity for each engine process.

Network-traffic analysis supplements the script output by capturing actual NTLM authentication events in the Windows event log. The relevant events are Event IDs 4624 and 4625 — logon success and failure — with logon type 3, the network logon type, and authentication package NTLM, filtered to events where the target server is a SQL Server host.

The combination of the audit-script output and the event-log analysis produces a complete picture of NTLM-generating SQL Server connection patterns across the estate. That Phase A output is ingested by the continuous compliance monitoring baseline as the baseline record from which all subsequent phases measure progress.

Phase B — Restriction

The restriction phase applies controls that reduce NTLM traffic without eliminating it entirely. The restrictions create pressure on connection patterns to migrate while preserving operational continuity. The primary Phase B control for SQL Server is NTLMv1 blocking, combined with Kerberos remediation for the missing-SPN cases.

SPN registration is corrected for all instances with missing or incorrect SPNs, converting those connections from NTLM to Kerberos. Cloud Kerberos trust is deployed per the Kerberos/NTLM elimination decision (Cloud Kerberos trust) for cross-site connection patterns where on-premises KDC reachability cannot be guaranteed. Linked-server definitions using passthrough authentication are migrated to defined security contexts. Application connection strings on recently domain-unjoined hosts are migrated to Managed Identity or service-principal authentication.

After Phase B, the only remaining NTLM-generating SQL Server connections should be those that require the elimination phase’s block to remove. These are typically applications that cannot be modified before Phase C is applied, which become exception cases requiring formal exception documentation per the Kerberos/NTLM elimination decision. (the Kerberos/NTLM elimination decision)

Phase C — Elimination

The elimination phase disables NTLM across the estate. Group Policy pushed domain-wide restricts NTLM authentication at the LSA layer on every host, and any connection that cannot negotiate an alternative protocol fails. For SQL Server, Phase C is only safe to implement after the login migration of Book 04 has been completed for every instance in the estate.

An instance whose connections have been migrated to Entra ID OAuth 2.0 tokens generates no NTLM traffic at all. The SQL Server engine does not use NTLM or Kerberos for type-E login connections. An instance that has completed the login migration is therefore immune to Phase C — it was not generating NTLM before the block, and it is not affected by the block after.

The sequencing imperative is clear: complete the SQL Server login migration before Phase C is applied. Phase C applies as dependencies are remediated, and the SQL Server login migration must be complete for every production instance in the estate before that step is taken. (the Kerberos/NTLM elimination decision)

 



Book_07 — Access Control: Groups, Roles, and the Entra Perimeter

What Microsoft’s Group Model Provides — and the Access Classification Only You Can Design

Book_07 — Access Control: Groups, Roles, and the Entra Perimeter

 

Chapters



AD Group Types and the Entra Perimeter

Chapter 1 — AD Group Types and the Entra Perimeter

The group-based access model survives the migration; its lifecycle and its outer boundary do not.

The access control model for SQL Server has historically lived entirely inside SQL Server: server-level roles, database-level roles, and the AD security groups mapped to them. The migration from AD-backed Windows logins to Entra-backed type-E logins changes the identity authority for those groups from Active Directory to Microsoft Entra ID, but it does not eliminate the group-based pattern itself.

What changes is the group lifecycle. Where an AD security group required a helpdesk ticket to add or remove a member, an Entra dynamic security group whose membership rule references the organizational-attribute model attributes updates itself continuously as HR data changes. The DBA manual cycle — grant access, verify access, revoke access — is replaced by an attribute-driven policy that requires no DBA action for routine changes.

the group rationalization decision classifies every migrating AD security group into exactly one of four canonical types, each with a defined Entra target and transformation pattern. The remainder of this chapter walks those four types, maps each to its SQL Server consequence, and then turns to the perimeter the completed migration enables. (the dynamic group provisioning decision, the group rationalization decision, the administrative unit provisioning decision)

Type 1 — OU-Derived Security Groups Become the organizational-attribute model Dynamic Groups

The first the group rationalization decision type is the security group used for OU-derived access: groups that exist because users in a given organizational unit needed access to a SQL Server database or server role. In the AD world these are typically named for the unit they serve — OU-DEPT-DBA-PROD — and members are added by organizational position.

the group rationalization decision maps this type to the dynamic-group pattern that the dynamic group provisioning decision defines. In Entra ID these become dynamic security groups whose membership rule references the organizational-attribute model attributes, expressing the organizational logic that was previously encoded in the group name and maintained by hand. A rule such as (user.extensionAttribute5 -eq "ORG/DEPT/TEAM") -and (user.jobTitle -contains "DBA") admits any principal whose the organizational-attribute model attribute matches and whose title contains “DBA,” automatically and continuously.

the organizational-attribute model attribute values are populated by the the organizational-attribute model Narrative’s HR-data synchronization pipeline; they are not manually managed. Migrating a Type 1 group therefore requires two things: confirming the the organizational-attribute model attribute infrastructure is in place — a dependency on the the organizational-attribute model Narrative — and authoring the dynamic membership rule that correctly expresses the original group’s organizational logic. (the dynamic group provisioning decision)

Type 2 — Explicit Role-Assignment Groups

Type 2 groups exist specifically to grant a named role or permission on SQL Server — PROD-SQL-SYSADMIN, DB-REPORTING-READONLY. They carry no organizational-derivation logic; members are added explicitly because they need the specific permission. In Entra ID these become flat assigned security groups: no dynamic rule, membership managed by direct assignment, and — per the group rationalization decision — flattened, with no nested transitive groups carried over.

The difference from the AD equivalent is in the maintenance model. Modifying membership of an assigned Entra security group requires an Entra role assignment — User Administrator scope, or a delegated role within an Administrative Unit per the administrative unit provisioning decision — rather than a helpdesk ticket to an AD administrator. That is the governance improvement.

The migration itself is operationally straightforward: create the Entra security group, populate it with the AD group’s members, create the SQL Server type-E login for the Entra group, and validate. The process is simple; the improvement is in the ongoing model, which Chapter 2 shows depends on the Administrative Unit being provisioned first. (the administrative unit provisioning decision)

Type 3 — Distribution Lists for SQL Server Agent Notifications

Type 3 groups are not access control groups at all — they are routing artifacts. SQL Server Agent jobs can send completion and failure notifications to an email address, and many environments have used AD distribution lists, mail-enabled groups with security disabled, as the target.

In Entra ID, the group rationalization decision maps a distribution list to a Microsoft 365 Group with securityEnabled: false — mail-only, and explicitly never used for access control. Migrating a Type 3 group is an email-routing migration, not a SQL Server access control migration. The SQL Server Agent operator definition that holds the notification address must be updated to reference the new M365 Group’s email.

No SQL Server login is created for a Type 3 group, because it carries no access role. The the group rationalization decision classification makes this exclusion explicit: distribution lists are removed from the login migration and handled on the mail-routing path instead. (the group rationalization decision)

Type 4 — Mail-Enabled Security Groups Split in Two

Type 4 is the most complex case: a single group that is both a security group, used for SQL Server access, and mail-enabled, used for Agent notifications. the group rationalization decision specifies a two-object pattern. The one mail-enabled security group is split into an M365 Group for mail routing — taking the email address and the distribution membership — and an assigned Entra security group for access — taking the security membership and the SQL Server role.

The two objects are correlated by an the organizational-attribute model extension attribute so the organizational relationship between them is preserved and a future engagement can re-correlate them. The SQL Server login is created against the security group; the Agent operator is pointed at the M365 Group’s email.

The operational result is identical to the original — the right people get access, the right people get job notifications — but the model is cleaner, because the access group and the mail group now have independent lifecycles. the group rationalization decision accepts the cost: the split doubles the migration object count for this class, and every split is recorded in the migration audit with its correlation attribute. (the group rationalization decision)

Conditional Access as the Outer Perimeter

The architectural dividend of completing the access control migration is that Conditional Access — a Microsoft Entra capability, not a SQL Server feature — becomes the outer perimeter for all SQL Server access. When every login is a type-E login backed by an Entra principal, every connection attempt requires an Entra access token, and every token request passes through Conditional Access evaluation before the token is issued.

A DBA connecting from a device that is not registered in Entra ID, or registered but out of compliance with the device policy, receives a token denial; the connection never opens. A DBA connecting from a network address outside the program’s Named Locations is denied. A DBA whose sign-in risk is elevated to “high” by Entra ID Protection — an unusual location, or a credential flagged in a breach report — is denied or challenged for remediation.

None of these controls exist in the Windows Authentication model, and none apply to a type-U or type-G login backed by an AD principal. The perimeter is binary: it covers all connections or it covers none, because a single Windows-backed login is a bypass path around every Conditional Access control. This is the zero-trust posture the program’s boundary requires, with continuous verification replacing the perimeter trust of the domain-joined world. (the SQL Server authentication transformation decision)

The Binary Perimeter Is Not a False Binary

A reviewer is right to interrogate the word binary, and the claim deserves a precise defense. The assertion is not that no other control can touch a surviving Windows or SQL-Authentication login — it is that no other control delivers the same assurance, which is why the SQL Server authentication transformation decision §4 treats every such login as a time-bound exception rather than a co-equal steady state.

The compensating controls a skeptical panel will raise are real and worth naming. A privileged-access workstation (PAW) or Azure Bastion constrains where an administrative connection originates. Network segmentation and host firewalls constrain which hosts can reach the instance. Just-in-time elevation through Privileged Identity Management, and credential vaulting through a privileged-access-management (PAM) system, constrain when a standing credential is live and who can check it out. Each reduces the exposure of a Windows-backed login, and each is appropriate during the migration window.

What none of them provides is identity-conditioned, continuous, per-connection evaluation. A bastion host authorizes the jump, but the SQL connection that leaves it still authenticates with Kerberos or NTLM beneath the Entra plane — the device-compliance state, the sign-in-risk signal, and the MFA freshness that Conditional Access evaluates at token issuance, on every connection are invisible to it. Network controls are perimeter controls: they do not travel with the identity, they do not re-evaluate as risk changes mid-session, and the credential itself stays outside the Entra plane, where Defender for Identity cannot correlate it. A PAM vault still hands out a credential that, once retrieved, authenticates without any of those checks.

This is why the SQL Server authentication transformation decision §4 does not forbid the compensating-control posture — it governs it. A login that cannot yet move to the Entra plane is permitted only as a documented exception carrying the inability-to-migrate reason, a named compensating control, and a sunset date; where a connection genuinely cannot reach Kerberos or Entra OAuth as dependencies are remediated, Certificate-Based Authentication is the authorized interim posture per the Kerberos/NTLM elimination decision. Compensating controls are the governed bridge across the migration window, not an equivalent destination. The steady state remains binary because the assurance the program’s boundary requires — OMB M-22-09 phishing-resistant, Conditional-Access-conditioned access, operationalized through AC-17 and IA-2 — is achievable only when the credential SQL Server accepts is the Entra token the policy controls. (the SQL Server authentication transformation decision, the Kerberos/NTLM elimination decision)

 



Administrative Unit Delegation for SQL Server DBA Teams

Chapter 2 — Administrative Unit Delegation for SQL Server DBA Teams

Scoped authority over the groups that control SQL access, without tenant-wide rights.

Chapter 1 left an open question. The explicit role-assignment groups — the Type 2 groups that grant named SQL Server roles — move their maintenance model from a helpdesk ticket against Active Directory to an Entra role assignment. But granting a DBA team lead tenant-wide User Administrator rights to manage a handful of SQL access groups would trade one governance problem for a worse one. The Administrative Unit is the mechanism that resolves it.

The Entra Administrative Unit, governed by the administrative unit provisioning decision, is a management boundary that scopes a role assignment to a subset of Entra objects rather than the whole tenant. A DBA team’s AU contains the Entra security groups mapped to the SQL Server roles within that team’s scope of ownership, and a role assignment — User Administrator scoped to that AU — lets the team lead add and remove members of those groups and nothing else. (the administrative unit provisioning decision)

The value of the AU is precisely that it confers no other power. The role-eligible assignment scoped to the DBA AU carries no ability to modify groups outside the AU and no ability to perform any tenant-level identity action. Least privilege stops being an aspiration the DBA team is trusted to honor and becomes a boundary the directory enforces.

Aligning the AU Boundary to the organizational-attribute model

The SQL Server DBA AU boundary should be aligned to the organizational-attribute model. The AU contains the groups whose dynamic membership rules or explicit assignments correspond to the organizational boundary the DBA team owns, so the delegation boundary and the access boundary describe the same scope rather than drifting apart.

If a DBA team owns a specific application portfolio, its AU contains the groups governing access to the SQL Server instances that support that portfolio. If the team is organized geographically, the AU corresponds to the geographic the organizational-attribute model dimension. Either way, the AU is drawn from the same the organizational-attribute model model that drives the dynamic groups of Chapter 1, not invented as a separate management construct.

This alignment is what keeps the model coherent. The DBA team that manages access to a set of SQL Server instances also manages the Entra groups that control that access, and those groups are scoped to the AU that matches the team’s organizational position. The authority a team holds and the systems it is responsible for are, by construction, the same set. the administrative unit provisioning decision enforces this through its cross-canon integrity checks, which reject an AU whose referenced groups or the organizational-attribute model values do not resolve to live canon. (the administrative unit provisioning decision)

AU Provisioning as a Migration Prerequisite

Administrative Unit provisioning for DBA teams is not an optional refinement layered on after the group migration; it is a prerequisite for the Type 2 explicit role-assignment migration described in Chapter 1. A Type 2 group can only be managed under appropriate delegation after the AU is provisioned and the scoped role assignment is in place.

The sequencing follows from that dependency. The AU is created and confirmed restricted — the administrative unit provisioning decision pins the restricted-management invariant so the AU cannot be created in a form that lets a Global Admin bypass the division-level delegation. The scoped role assignment is then established for the DBA team lead. Only then can the explicit role-assignment groups be created, populated, and bound to their SQL Server type-E logins under the delegated authority rather than under tenant-wide rights.

Provisioning the AU before the groups it will hold also avoids a transitional window in which the new Entra groups exist but can only be managed by a tenant-wide administrator — the precise concentration of privilege the whole exercise is meant to remove. The AU comes first; the Type 2 groups land inside an already-scoped boundary. (the administrative unit provisioning decision)

 



Book_08 — The Application Chain: LDAP-Bound and SQL-Consuming Applications

What Microsoft’s Application Identity Model Provides — and the Chain Inventory Only You Can Build

Book_08 — The Application Chain: LDAP-Bound and SQL-Consuming Applications

 

Chapters



The Four-Class Pattern Applied to SQL-Consuming Applications

Chapter 1 — The Four-Class Pattern Applied to SQL-Consuming Applications

The application is the other half of the authentication chain — and it has its own AD dependency to remove.

SQL Server does not exist in isolation. In every federal environment of meaningful size, it is the data layer downstream of a middleware tier — web application servers, API backends, reporting services, ETL pipelines, and legacy integration systems. Those middleware applications carry their own authentication architecture, and in many federal environments that architecture includes LDAP binding: the application binds to Active Directory as a directory authority, queries group membership or user attributes, and treats AD as its authorization source.

The same AD dependency that must be removed from SQL Server’s authentication layer must also be removed from those upstream applications, and the removal must be coordinated. An application that has migrated its user authentication to Entra ID OIDC but still uses a SQL Authentication service account to reach SQL Server has not completed its transformation. The application chain must be addressed as a complete authentication path — user to application to database — not as independent layers.

the LDAP-dependent application migration decision (LDAP-Dependent Application Migration), accepted 2026-05-13, provides the four-class taxonomy for categorizing upstream applications by modernization capability, in a strict preference order: Class 3 (OIDC) preferred, then Class 2 (SAML), then Class 1 (App Proxy), then Class 4 (Entra Domain Services) as the last resort. the application chain audit instrument (Get-LDAPBindAccountInventory.ps1) is the discovery instrument that produces the per-application classification data this chapter depends on. (the LDAP-dependent application migration decision, the application chain audit instrument)

Class 1 — App Proxy: Cannot Be Modernized Directly

Class 1 applications cannot modify their authentication mechanism. They bind to LDAP for user authentication, and the dependency is architectural — embedded in unmaintainable code, supplied by a vendor with no modern auth option, or frozen by a regulatory certification that prevents code modification. For SQL Server, Class 1 applications typically connect using an AD service-account credential stored in a connection string or configuration file.

The Class 1 migration pattern has two independent tracks. The user-authentication track deploys Entra Application Proxy in front of the application: the App Proxy connector fronts the application’s user authentication behavior without modifying the application itself. The SQL-connection track migrates the application’s database credential from a SQL Authentication service account to a service principal or Managed Identity — a change made in the connection string or configuration, not in code, and independent of the user-authentication track. Both tracks must complete before the application’s contribution to the SQL Server transformation is fulfilled. (the LDAP-dependent application migration decision)

Class 2 — SAML: Federated Identity but Not OIDC

Class 2 applications support SAML federation but not OIDC. SAML 2.0 is an XML-based federation protocol that predates OIDC and is common in federal environments because many enterprise applications implemented SAML support before OIDC was standardized. For Class 2 applications, Entra ID becomes the SAML Identity Provider per the SAML trust decision. The user’s authentication is modernized — they authenticate to Entra ID using their Entra credentials, Entra issues a SAML assertion, and the application validates the assertion and grants access — but the protocol is SAML, not OIDC.

The SQL-connection track for Class 2 follows the same pattern as Class 1: the connection string migrates from SQL Authentication or Windows Integrated Security to Managed Identity or service-principal authentication. The user-authentication modernization and the SQL-connection migration are separate tracks and can be sequenced independently. the LDAP-dependent application migration decision places Class 2 second to Class 3 because SAML eliminates the LDAP dependency rather than proxying through it, yet ranks below OIDC because it does not provide the full capability set of a modern identity protocol. (the LDAP-dependent application migration decision, the SAML trust decision)

Class 3 — OIDC: The Preferred Destination

Class 3 is the preferred migration destination in the LDAP-dependent application migration decision’s ordering. An OIDC-capable application can migrate fully to Entra ID as its identity provider, eliminating the LDAP dependency entirely. The application redirects the user to the Entra ID authorization endpoint, the user authenticates with Entra credentials, Entra issues an ID token and an access token, and the application uses the claims in those tokens for identity and authorization. No LDAP bind occurs, and no AD query occurs.

The application’s SQL Server connection also uses Managed Identity or service-principal authentication, with no stored credential. The end-to-end chain for a Class 3 application reaching SQL Server is direct: the user authenticates to Entra ID via OIDC, the application uses its Managed Identity to authenticate the SQL connection, SQL Server validates the Managed Identity token through the Arc-provided token-validation infrastructure, and the connection is established. There is no AD in this path, no LDAP, no NTLM or Kerberos, and no stored credential. This is the target architecture. (the LDAP-dependent application migration decision)

Class 4 — Entra Domain Services: Last Resort

Class 4 applications cannot be modernized to any modern authentication protocol. They require actual LDAP and Kerberos from a domain controller — not a proxy, not a federation, but a real AD-compatible domain with DNS SRV records, LDAP on port 389, and Kerberos on port 88. For these applications, Entra Domain Services provides a Microsoft-managed PaaS domain that presents an AD-compatible interface — LDAP, Kerberos, NTLM — while being backed by Entra ID rather than a customer-managed domain controller. the LDAP-dependent application migration decision places Class 4 last because it preserves the AD dependency rather than eliminating it.

For SQL Server, Class 4 carries a specific implication. An instance hosting databases for a Class 4 application cannot complete the full authentication transformation until that application is upgraded to a higher class or sunset. An instance that still accepts Windows Authentication logins because a Class 4 application cannot use Entra ID authentication is blocked from the Entra-only posture that the identity and directory transformation inventory Transformation #7 requires. Class 4 applications must be inventoried against their SQL Server dependencies, and each instance with a Class 4 upstream application must carry a documented exception with a sunset date. (the LDAP-dependent application migration decision)

the application chain audit instrument as the Classification Triage Tool

The Get-LDAPBindAccountInventory.ps1 script (the application chain audit instrument) is the instrument that produces the per-application classification data needed to execute the four-class triage. For each application in its enumeration scope, the script captures the LDAP bind account — the AD service account used for directory queries — and the SQL Server connection target, meaning the instance and database the application connects to.

It also captures the authentication mechanism for that SQL connection (Windows Integrated Security, SQL Authentication, or already-migrated Managed Identity or service principal) and the signals that map to each class: SAML metadata URLs, OIDC discovery-endpoint registration, or vendor documentation indicating modernization capability. The output is a per-application record with a recommended class assignment and the detection signals that support it.

That record is the input to the the LDAP-dependent application migration decision migration triage and to the instance-level migration planning in Book 04. The two audit scripts must be correlated to produce a complete picture: the SQL Server authentication audit instrument enumerates SQL Server instances, and the application chain audit instrument enumerates the upstream applications. Only when both are joined does each SQL Server instance reveal its full authentication chain — every application that depends on it, and the class each one falls into. (the application chain audit instrument, the LDAP-dependent application migration decision)

 



Connection String Migration — The Last Mile

Chapter 2 — Connection String Migration: The Last Mile

The simplest change in the entire program, and the most gate-controlled.

The final step in the application-chain migration is the SQL Server connection-string change. It is the moment the engine sees the Entra ID identity plane in the application connection rather than a SQL Authentication credential or a Windows Integrated Security token. Technically it is the simplest step in the entire migration. Operationally it is the most gate-controlled, and the two facts together are why it is treated as a distinct step rather than folded into the work that precedes it.

The Connection String Change

For an application using Windows Integrated Security — Data Source=sqlserver;Initial Catalog=database;Integrated Security=True — the connection string changes to use Entra ID authentication. For an application running on an Arc-enabled server with a system-assigned Managed Identity, it becomes Data Source=sqlserver;Initial Catalog=database;Authentication=Active Directory Managed Identity. The keyword tells the driver to acquire a token from the local Managed Identity rather than negotiate a Windows credential.

For an application using a service principal with a client credential, the string uses Authentication=Active Directory Service Principal, with the client ID and credential supplied through an Azure Key Vault reference rather than inline. For SQL Authentication connections — User ID=serviceaccount;Password=storedpassword — migrating to Managed Identity or service principal eliminates the credential from the connection string entirely. In every case the stored secret is removed, which is the point: the connection no longer carries a credential the identity plane cannot see.

The Gate Conditions

The change is the simplest step technically, but it cannot be executed on demand. Three conditions must hold first. The Entra ID login must already exist on the target SQL Server instance — the FROM EXTERNAL PROVIDER login created in the work Book 04 covers — because a connection string that names an Entra identity with no corresponding login on the instance fails at connection time.

The application’s service principal or Managed Identity must have been granted the appropriate SQL Server database role, so that authentication succeeds and authorization follows. And the change must have been tested in a non-production environment whose Arc and SQL Server extension configuration matches production, because token acquisition and validation depend on that infrastructure being present and correctly configured. A connection-string change that works against a developer’s laptop but has never been exercised against a production-equivalent Arc and extension stack is not a tested change. Only when all three gates are satisfied is the production cutover safe to perform.

The Azure.Identity SDK and DefaultAzureCredential

For .NET applications — a large fraction of the federal application estate — the Azure.Identity SDK provides the DefaultAzureCredential class, which implements an ordered credential chain. It attempts Managed Identity first, using the local IMDS endpoint when running on an Arc-enabled server, an Azure VM, or another Azure-hosted platform, then falls back to Azure CLI credentials, then Visual Studio credentials, then environment-variable-based service-principal credentials.

The value of the chain is that a single credential code path works unchanged across environments. In production the application resolves its Managed Identity; in a developer’s local environment it resolves Azure CLI credentials; no code differs between them. The SQL connection uses a SqlConnection with the Authentication=Active Directory Default keyword — available in Microsoft.Data.SqlClient 2.0 and later — or sets the AccessToken property from the DefaultAzureCredential token directly.

The Authentication=Active Directory Default keyword is the preferred approach for new connection-string configurations, because it delegates credential resolution to the DefaultAzureCredential chain automatically. The result is that the connection-string change is a net reduction in complexity for .NET applications: one keyword replaces an entire credential-management system. This is the workload-identity model the workload identity decision establishes — the application authenticates as itself through a Managed Identity, with no human credential and no stored secret anywhere in the path. (the workload identity decision)

 



Book_09 — The Transformed Posture: Continuous Governance and the 2027 Milestone

The Transformed Posture and What Keeps It — Continuous Verification in a World of Progressive Vendor Constraints

Book_09 — The Transformed Posture: Continuous Governance and the 2027 Milestone

 

 

 

 

 

 

Chapters



The Closure Condition for the identity and directory transformation inventory Transformation #7

Chapter 1 — The Closure Condition for the identity and directory transformation inventory Transformation #7

Transformations do not complete — they achieve a posture, and a posture is something you keep proving.

A transformation that achieves a completed state and then stops monitoring is a transformation that will regress. A SQL Server instance migrated to Entra ID-only authentication can be reconfigured to Mixed Mode by any administrator with sufficient permission. New SQL Authentication logins can be created. New Windows logins can be created if the instance remains domain-joined. The transformed posture is not a permanent state achieved through a one-time action — it is an ongoing condition maintained by continuous monitoring, automated drift detection, and a governance process that treats regression as a compliance violation rather than an operational preference. (the Kerberos/NTLM elimination decision Phase C, the identity and directory transformation inventory Transformation #7)

The Five Closure Conditions

the identity and directory transformation inventory defines Transformation #7 as complete when five conditions are simultaneously satisfied across all production SQL Server instances in the estate. The first is that Windows Authentication is eliminated as an accepted login mechanism. No production instance is configured for Mixed Mode — all instances run in Windows Authentication Only mode, but with no active Windows-backed logins in master. The operational verification is the authentication mode registry value (LoginMode = 1) together with a query of sys.server_principals confirming zero type-U and type-G logins that are not in a disabled state.

The second condition is that SQL Authentication is eliminated. No SQL Authentication logins — type-S logins — exist on any production instance other than those carrying documented exception status, and the sa account is disabled on every instance. The operational verification is a sys.server_principals query for type-S logins, cross-referenced against the exception registry the program maintains. The third condition is that Entra ID authentication is the sole accepted mechanism. This is the positive statement of the first two: all active logins on all instances are type-E logins, and every connection produces an Entra ID sign-in event.

The fourth condition is that the engine process runs with a Managed Identity. The Arc Connected Machine agent is installed, the system-assigned Managed Identity is active, and the Azure extension for SQL Server is deployed on every production host. The fifth condition is that every human principal authenticates with MFA enforced by Conditional Access. This is verified through Entra ID sign-in logs and Conditional Access policy reports — every sign-in event for a SQL Server resource should show MFA satisfied and Conditional Access grant controls met. (the identity and directory transformation inventory, the SQL Server authentication transformation decision §5)

The Continuous Audit as the Verification Instrument

the SQL Server authentication audit instrument in continuous monitoring mode — running on a recurring schedule against the full estate rather than as a point-in-time scan — is the primary instrument for verifying that all five closure conditions remain satisfied over time. The the continuous compliance monitoring baseline record per instance, updated on each audit run, is the structured evidence artifact that captures the current state of each condition for each instance. the SQL Server authentication transformation decision §5 defines the field set that record carries. (the SQL Server authentication audit instrument, the SQL Server authentication transformation decision §5)

A the continuous compliance monitoring baseline record that shows LoginMode = 1, zero active type-S logins, zero active type-U logins, zero active type-G logins, the sa account disabled and renamed, the Arc agent enrolled, the SQL extension deployed, and the Managed Identity active is a record that satisfies all five closure conditions for that instance. When all production instances carry satisfying the continuous compliance monitoring baseline records, Transformation #7 is verifiably closed for the estate. The continuous audit ensures closure is not a point-in-time claim — it is an ongoing verification. (the SQL Server authentication transformation decision §5)

Drift Detection

Drift detection in the the continuous compliance monitoring baseline pipeline identifies conditions that would constitute regression before they become compliance violations. A drift event for SQL Server authentication takes one of several forms. An instance whose LoginMode value changes from 1 to 2 — Windows Authentication Only to Mixed Mode — indicates that someone has enabled Mixed Mode without authorization. A new type-S login appearing in sys.server_principals that was not present on the previous audit run indicates that a SQL Authentication login has been created.

A new type-U or type-G login appearing on an instance that was previously in the Entra-only posture is the same class of regression for Windows-backed identity. And an Arc agent going offline, or the SQL extension becoming unavailable, would interrupt the Managed Identity-based engine authentication. Each drift event triggers the program’s remediation workflow. the SQL Server authentication transformation decision §5 records these same events — LoginMode reverting to Mixed Mode, a new type-S/U/G login appearing, the Arc agent going offline — as compliance violations, not advisory signals.

The program’s NTLM elimination strategy is not about hitting a fixed block date — it is about driving all production instance the continuous compliance monitoring baseline records to the satisfied state and keeping them there continuously. Migration activity should conclude with enough margin for the continuous audit to confirm the satisfying posture across a full validation period before Phase C is applied. (the Kerberos/NTLM elimination decision Phase C and the SQL Server authentication transformation decision §5)

Defender for SQL as the Behavioral Telemetry Layer

Microsoft Defender for SQL provides the behavioral anomaly detection layer that complements the the continuous compliance monitoring baseline structural compliance monitoring. the continuous compliance monitoring baseline monitors the configuration state of each instance — is the LoginMode correct, are the login types correct. Defender for SQL monitors the behavioral patterns of connections to each instance: who is connecting, from where, at what times, using what authentication mechanisms, and whether those patterns deviate from the established baseline.

In the transformed posture, Defender for SQL operates against a baseline of Entra ID-only connections. Every connection produces an Entra ID sign-in event; every anomalous connection — from an unusual source IP, at an unusual time, with an elevated sign-in risk signal — is surfaced by Defender for SQL and by Entra ID Protection. Any NTLM or Kerberos authentication event in Defender for SQL telemetry, which should be zero in the transformed posture, is an immediate alert.

An NTLM event means one of three things: an instance has regressed to Mixed Mode, which the continuous compliance monitoring baseline should already have detected; an instance was not included in the original audit scope, a discovery gap; or a novel connection pattern has appeared that the migration plan did not anticipate. All three require investigation. The combination of the continuous compliance monitoring baseline structural monitoring and Defender for SQL behavioral monitoring is the two-layer governance instrument that maintains the transformed posture continuously after the migration is complete.

 



The 2027 Milestone — What Done Looks Like

Chapter 2 — The 2027 Milestone: What Done Looks Like

The evidence is not a binder you assemble — it is the live output of the monitoring you never turn off.

The evidence artifacts required to close Transformation #7 in the identity and directory transformation inventory are not a collection of documents produced at a single point in time — they are the live outputs of the continuous monitoring infrastructure described in Chapter 1. A closure claim is only as strong as the monitoring that keeps producing the evidence after the claim is made. This chapter names the artifacts, then places the program’s NTLM elimination strategy in its proper operational context: continuous verification ahead of Microsoft’s progressive NTLM defaults, not a fixed cutover date. (the identity and directory transformation inventory, the Kerberos/NTLM elimination decision Phase C)

The Evidence Artifacts as Live Outputs

The closure claim for Transformation #7 must be supported by six artifact sets, and each is a continuously regenerated output rather than a static deliverable. The first is the the continuous compliance monitoring baseline record set: a record for every production SQL Server instance in the estate, each showing Entra-only authentication mode, zero active SQL Authentication logins, zero active Windows-backed logins, the Arc agent enrolled and healthy, and the SQL extension deployed. the SQL Server authentication transformation decision §5 defines the field set these records carry, and the continuous audit keeps them current rather than freezing them at the moment of the claim. (the SQL Server authentication transformation decision §5)

The second is the Entra ID sign-in log set, showing zero failed token requests attributable to NTLM or Kerberos fallback for SQL Server resource audience tokens over a defined validation period preceding the closure claim. The third is the Defender for SQL telemetry, showing zero NTLM authentication events over that same validation period — the behavioral confirmation that complements the structural the continuous compliance monitoring baseline view. These two artifacts together demonstrate that the transformed posture holds not only in configuration but in observed connection behavior.

The fourth is the sa account status report, showing the sa account disabled on all instances. The fifth is the Conditional Access policy compliance report, showing MFA enforcement satisfied for one hundred percent of SQL Server resource sign-ins by human principals over the validation period. The sixth is the exception registry, showing every currently excepted instance with documented justification, a sunset date, and its own the continuous compliance monitoring baseline tracking record. When all six artifact sets are simultaneously satisfying, and the monitoring infrastructure confirms they have been satisfying for the validation period, Transformation #7 is closed. That is what done looks like — not a checkbox, but a demonstrated, continuously verified, evidence-backed posture. (the identity and directory transformation inventory, the SQL Server authentication transformation decision §5)

Vendor Defaults: Progressive Warnings, Not a Hard Cutover

The program’s NTLM elimination strategy is sometimes misread as a race to a single fixed date. It is not. Microsoft’s progressive NTLM defaults — enhanced auditing in Windows Server 2025 / Windows 11 24H2, the BlockNTLMv1SSO enforcement default arriving via Windows Update in October 2026, and network NTLM off by default in the next major Windows Server release — raise the cost of delay with each release. The program’s elimination posture is designed to stay ahead of that vendor default-disable trajectory, not to wait for a hard cutover.

Read as progressive vendor pressure rather than a single deadline, the schedule organizes differently. Migration activity — the three-phase parallel-run, the cutover, the sa disablement, the type-S elimination — should conclude with enough margin for the continuous audit to confirm the satisfying posture across a full validation period before Phase C is applied. The final months of the migration program are reserved for validation, not for last-minute migration, because a posture confirmed only at the edge of the window is a posture nobody has had time to prove.

This framing also gives the exception long-tail its proper weight. An instance that cannot reach Kerberos or Entra OAuth as dependencies are remediated must carry a documented exception with Certificate-Based Authentication as the authorized interim posture, and that exception’s sunset date must be reconciled against the vendor default-disable trajectory rather than against any internal milestone. When the migration is complete, the audit has validated the posture continuously, and the six artifact sets are live and satisfying, the Phase C block arrives as a non-event — which is exactly what done is supposed to feel like. (the Kerberos/NTLM elimination decision Phase C and the SQL Server authentication transformation decision §5)

 



Book_10 — Certificate Authority: From ADCS to Cloud PKI

What Microsoft’s Cloud PKI Provides — and the Certificate Migration Only You Can Sequence

Book_10 — Certificate Authority: From ADCS to Cloud PKI

 

Chapters



Where SQL Server Touches ADCS

Chapter 1 — Where SQL Server Touches ADCS

The certificate dependencies a decommission plan cannot see, named before any decommission plan exists.

the identity and directory transformation inventory identifies the Active Directory Certificate Services to Cloud PKI transformation as “Not Yet Defined.” As the series opening established, that label means the destination may be known but the normative canon governing how to reach it has not been authored. For most of this series, the missing record has been the substrate ADR; for Book 10, the gap is more fundamental still. No architecture decision record governs the certificate authority transformation at all.

There is no ADR equivalent to point to. The transformation is identified as necessary in the identity and directory transformation inventory, the discovery instrument exists, but the normative decision about the replacement CA, the enrollment mechanism, and the sequencing of ADCS decommission has not been made. This book is therefore analytical and motivational rather than prescriptive. It documents why the certificate gap matters specifically for SQL Server, and it cites no normative ADCS-migration ADR because none exists. (the identity and directory transformation inventory)

It matters specifically because SQL Server has certificate dependencies that are not visible to most of the teams that will plan the ADCS decommission. Three distinct capabilities depend on ADCS-issued certificates: TLS encryption of client connections, certificate-mapped SQL Server logins, and Certificate-Based Authentication as the authorized NTLM replacement for connections that cannot reach Kerberos or Entra OAuth before the deadline. the certificate discovery instrument (Get-CertBasedAuthAudit.ps1) is the instrument for discovering them. (the certificate discovery instrument)

SQL Server TLS/SSL Certificates

The first and most commonly recognized SQL Server certificate dependency is the TLS certificate the engine presents for encryption of client connections. When SQL Server is configured to use TLS encryption — which is required under this program’s FedRAMP-Moderate posture — it presents a server certificate to connecting clients as part of the TLS handshake.

In most federal environments, that certificate is issued by the organization’s ADCS infrastructure. The administrator submitted a request to the ADCS Certificate Authority, the CA issued a certificate carrying the SQL Server’s hostname as the Subject Alternative Name, and the certificate was installed in the instance’s certificate store and bound through SQL Server Configuration Manager. The certificate has an expiration date.

When ADCS is decommissioned, that certificate will not be renewed automatically — there is no CA left to issue the renewal. If the TLS certificate expires after ADCS decommission, clients configured to validate the server certificate, which is the correct security posture, will reject the connection with a certificate validation error. The encryption that FedRAMP-Moderate requires becomes the thing that breaks the connection.

The the certificate discovery instrument audit captures the TLS certificate for every instance in scope: the subject, the SAN, the issuing CA, and the expiration date. Any instance whose TLS certificate is ADCS-issued is a dependency the migration plan must address. The replacement certificate must come from the new CA — whether Microsoft Cloud PKI or an alternative — and must be installed and bound before the ADCS-issued certificate expires or before ADCS goes offline, whichever comes first. (the certificate discovery instrument)

Certificate-Mapped SQL Server Logins

The second dependency is less commonly known. SQL Server supports a login type — the type-C login — that maps an X.509 certificate to a SQL Server login using the CREATE LOGIN [name] FROM CERTIFICATE [cert_name] syntax. When a client connects with a certificate-mapped login, it presents its certificate as the authentication credential. SQL Server validates the certificate’s signature against the certificate object stored in master, and on success accepts the connection with the associated login’s permissions.

Certificate-mapped logins are uncommon in standard deployments, but they appear in specific scenarios: service accounts using certificate-based rather than password-based authentication, SQL Server integration with PKI-based authentication systems, and legacy configurations for Service Broker endpoints. Each is the kind of arrangement that survives quietly across an estate for years without anyone documenting it.

If a certificate-mapped login exists on a production instance and the certificate backing it was issued by ADCS, that login will fail when ADCS is decommissioned and the certificate expires. The preferred migration path is to replace certificate-mapped logins with type-E service-principal logins backed by Entra ID authentication, as described in Book 05. The the certificate discovery instrument audit captures every certificate-mapped login and the issuing CA of its associated certificate, providing the inventory the migration needs. (the certificate discovery instrument)

CBA as the NTLM Replacement Interim Posture

The third dependency is the most consequential for the NTLM elimination timeline. the Kerberos/NTLM elimination decision (Certificate-Based Authentication) designates CBA as the authorized replacement for NTLM connections that cannot be migrated to Kerberos or Entra ID OAuth 2.0 tokens within the required timeline. CBA allows a client to authenticate with an X.509 client certificate rather than a password or Kerberos ticket — a strong mechanism that is not subject to the NTLM protocol weaknesses Book 01 described. (the Kerberos/NTLM elimination decision)

For connections that cannot reach Entra ID auth as dependencies are remediated — Category 3 instances still pre-2022, or applications still in the deferred class — CBA is the authorized interim posture. The connection authenticates by certificate rather than NTLM, satisfying the program’s NTLM-elimination commitment (recorded in the Kerberos/NTLM elimination decision) without requiring the full Entra ID migration that pre-2022 instances cannot complete. It is the bridge that keeps an un-migratable connection compliant.

The problem is that CBA certificates must be issued by a CA. If the plan is to deploy CBA as the NTLM-replacement posture for connections that cannot yet reach Entra auth, and ADCS is being decommissioned, the replacement CA must already be in place and issuing CBA certificates before ADCS goes offline. The interim posture has its own certificate dependency, and that dependency points at the same authority the program intends to remove.

The Sequencing Dependency

The three dependencies converge on a single sequencing question. TLS certificates must be re-issued before they expire; certificate-mapped logins must be migrated to type-E before their backing certificates lapse; and CBA, the very mechanism the Kerberos/NTLM elimination decision relies on to cover connections that cannot meet the deadline, must have a CA issuing its certificates before ADCS is retired.

If the ADCS decommission timeline runs earlier than the replacement-CA and CBA-deployment timeline, the program loses the interim posture the Kerberos/NTLM elimination decision depends on at precisely the moment it is most needed — connections that could not migrate to Entra auth in time would have no compliant fallback. The sequencing of ADCS decommission against the program’s NTLM elimination strategy is therefore a critical dependency, and it is one the as-yet-unwritten ADCS-migration ADR must explicitly address before any decommission date is set. (the identity and directory transformation inventory, the Kerberos/NTLM elimination decision)

 



Book_11 — The Platform Question: Database Consolidation Toward SSOT

What the Authentication Transformation Reveals About the Database Platform Layer

Book_11 — The Platform Question: Database Consolidation Toward SSOT

 

 

Chapters



The Fragmentation Cost — SQL Server Sprawl as an Anti-SSOT Pattern

Chapter 1 — The Fragmentation Cost: SQL Server Sprawl as an Anti-SSOT Pattern

The authentication migration re-authenticates the silos. It does not dissolve them. Dissolving them is the platform question.

The Authentication Transformation Reveals What It Does Not Fix

Books 01 through 10 described one transformation: moving the SQL Server estate from Windows Authentication to Microsoft Entra ID. At the end of that transformation, every retained instance is re-authenticated. The Kerberos ticket is gone, the NTLM fallback is gone, the service account tied to the domain is gone, and in its place is an OAuth 2.0 token validated by the Conditional Access Engine before it reaches the engine. That transformation is real and significant.

What it does not change is the topology. The estate that emerged from Windows Authentication mode with forty instances enters Entra ID authentication mode with forty instances. Each instance is an independently provisioned server, an independently administered schema, an independently held copy of data that overlaps — in ways nobody has fully mapped — with data held by the other thirty-nine. The authentication transformation made each of those forty instances more secure. It did not reduce the number. (the identity and directory transformation inventory)

SSOT — Single Source of Truth — is not a security posture. It is an architectural property. A system has SSOT for a given data domain when there is exactly one authoritative origin for that data, and every consumer reads from it. An estate with forty SQL Server instances almost certainly does not have SSOT for any significant data domain, because each instance is a candidate source for the data it holds, and the question of which instance is authoritative when they disagree is either unresolved or resolved informally. Informal resolution of data authority is the administrative expression of the absence of SSOT.

What Sprawl Does to Data Authority

SQL Server sprawl accumulated through a mechanism that was sensible at each step and disastrous in aggregate. A new application needed a database. The application team provisioned a SQL Server instance — or shared one that was already running. They loaded their schema. They populated the data. If the data overlapped with data held by another instance, the overlap was noted and deferred, because resolving it would have required coordinating with another team, and the application needed to ship. Over two decades, that deferred coordination accumulated into an estate where the same concept — an employee, a contractor, an asset, an authorization — is represented in multiple databases, with no formally designated authority between them.

The result is that data consumers who need the authoritative version of any frequently-represented concept cannot find it by reading the database topology. They must either know which instance is authoritative by institutional knowledge, or make a judgment about which version to use, or query multiple instances and reconcile. All three of these are fragile. Institutional knowledge does not survive staff turnover. Judgment introduces inconsistency. Multi-instance reconciliation is expensive and still does not resolve authority — it only surfaces the disagreement.

The Federal Modernization Program’s architecture pursues SSOT as an organizing principle because fragmented authority is the administrative precondition for the governance failures the architecture is designed to prevent. the organizational-attribute model establishes SSOT for identity and organizational relationships. HRIT establishes SSOT for workforce position records. KYC establishes SSOT for citizen verification. These SSOT constructs are meaningful only if the data they govern is actually held in one authoritative place. An the organizational-attribute model-driven access model that derives group membership from an authoritative directory loses its authority the moment a shadow copy of that directory data is held in a separate SQL Server instance that is administered independently and may diverge. (the attribute binding decision, the SAML trust decision)

The SSOT Case Against SQL Server Sprawl

The case against SQL Server sprawl is not a case against SQL Server. SQL Server 2022 is a technically capable platform. The case is against multiplicty. Each additional SQL Server instance in the estate:

First, subdivides data authority. Every instance that holds data overlapping with another instance creates a potential authority conflict. The authentication transformation identifies which instances to retain; it does not resolve which of the retained instances holds the authoritative copy of any given data element.

Second, multiplies administrative surface. Each instance requires licensing, patching, backup, monitoring, and access administration. The authentication transformation reduces the per-instance credential surface by eliminating Windows logins and SQL logins. It does not reduce the instance count, and the administrative surface of a large estate remains proportional to the instance count regardless of the authentication mode.

Third, resists SSOT architecture. An the organizational-attribute model-derived access model that reads group membership from Entra ID can drive SQL Server security through FROM EXTERNAL PROVIDER logins. But if forty SQL Server instances each independently implement access control, the governance model for all forty must be designed, deployed, and kept synchronized. One authoritative database that all forty applications read reduces that problem from a forty-instance governance problem to a one-instance governance problem.

Fourth, accumulates licensing cost. SQL Server’s per-core licensing model charges for each instance independently. An estate with forty instances running at low average utilization pays forty instance-worth of licensing for work that could, in many cases, be consolidated onto far fewer instances — or onto an open-source platform without per-core licensing cost.

The Consolidation Decision Framework

The authentication transformation produced a classification for each SQL Server instance: retire, consolidate, or retain. The consolidation path — instances that were collapsed onto a target — was handled within the SQL Server estate. The retain path — instances that were individually migrated — produced a set of instances that are now properly authenticated but individually administered.

The platform question asks a further question about the retain group: should these instances remain on SQL Server, or should they migrate to a different database platform as part of a consolidation toward a single authoritative database? This is not a question the authentication transformation resolves. It is a question that the authentication transformation makes possible to ask clearly, because for the first time the estate is inventoried, rationalized, and documented.

Two federal consolidation targets have meaningful vendor support, FedRAMP-authorized paths, and relevance to the Red Hat/OpenShift environment that characterizes this agency’s AWS footprint.

The first is PostgreSQL. PostgreSQL is an open-source relational database with a feature set that closely parallels SQL Server in the areas most relevant to federal agency workloads: transactional integrity, schema-based access control, stored procedures (PL/pgSQL), replication, partitioning, and JSON document storage. It has multiple FedRAMP-authorized hosting paths — Amazon RDS for PostgreSQL, Amazon Aurora PostgreSQL, Azure Database for PostgreSQL, Crunchy Data PostgreSQL on OpenShift — and it is the primary database target for agencies operating on Red Hat OpenShift in AWS GovCloud. Microsoft, AWS, and Red Hat each publish official SQL Server-to-PostgreSQL migration documentation. Book 12 covers the PostgreSQL path in detail.

The second is Oracle Database. Oracle is a commercially licensed relational database with the deepest federal government footprint of any enterprise database platform. Agencies that have significant PL/SQL-based application logic, multi-tier partitioning, or Oracle-specific workloads — Exadata performance profiles, Oracle Text, Spatial, or Real Application Clusters — have a different consolidation calculus than agencies whose SQL Server workloads are schema-and-procedure applications. Oracle Database 19c runs on Red Hat OpenShift Virtualization, Oracle Cloud Infrastructure has FedRAMP High JAB authorization, and Oracle’s US Government Cloud provides an authorized consolidation target for agencies that choose Oracle as their single platform. Book 13 covers the Oracle path in detail.

The choice between PostgreSQL and Oracle is not a universal recommendation — it is an agency-specific decision that depends on the application inventory, the existing Oracle footprint if any, the licensing position, and the operational model. What both paths share is the destination: one authoritative database platform, as close to SSOT as the agency’s data governance work can bring it, rather than forty independently licensed, independently administered instances that re-authenticate cleanly but fragment authority as completely as they did before.

 



PostgreSQL in the Federal Stack — The Primary Consolidation Target

Chapter 2 — PostgreSQL in the Federal Stack: The Primary Consolidation Target

PostgreSQL is not the smallest database; it is the one the federal ecosystem has converged on. The FedRAMP paths, the Red Hat partnership, and three vendor migration toolchains all point the same direction.

Why the Federal Ecosystem Converged on PostgreSQL

PostgreSQL did not become the dominant federal open-source database by being the most marketed. It became the dominant choice because it is the one that solved the right set of problems for federal workloads: transactional correctness with SQL standard compliance, a privilege model that maps cleanly to schema-based access control, stored procedure support in PL/pgSQL that handles the majority of PL/T-SQL logic with manageable translation effort, and an extension architecture that has produced FedRAMP-relevant capabilities including PostGIS (geospatial), pgaudit (comprehensive audit logging), and pg_cron (scheduled jobs without external schedulers).

More relevant to this agency’s environment, PostgreSQL has the strongest certified operator presence on Red Hat OpenShift of any enterprise database. The Crunchy Data PostgreSQL Operator is listed in the Red Hat Ecosystem Catalog, certified for OpenShift, and available through OperatorHub. The Crunchy PostgreSQL for OpenShift product provides a Kubernetes-native PostgreSQL deployment with high availability, point-in-time recovery, connection pooling via pgBouncer, and automated backup — all managed through Kubernetes custom resources rather than manual DBA procedures. This is the PostgreSQL deployment model for OpenShift-first agencies, and it is the one that aligns with ROSA GovCloud for federally compliant hosting.

The second reason is licensing. SQL Server’s per-core licensing model is among the most expensive in the enterprise database market. An agency consolidating forty SQL Server instances onto one PostgreSQL cluster eliminates per-core licensing cost across the retired and consolidated instances. PostgreSQL is open source under the PostgreSQL License, and the commercial support models from Crunchy Data, EDB (EnterpriseDB), and Amazon eliminate the common objection that open-source databases lack enterprise support in federal procurement contexts. EDB Postgres Advanced Server in particular offers Oracle compatibility extensions — a feature relevant to agencies with legacy Oracle-derived stored procedures.

The Four FedRAMP-Authorized Hosting Paths

Federal agencies do not deploy software; they deploy authorized software on authorized infrastructure. PostgreSQL has four meaningful FedRAMP-authorized hosting paths for federal agencies, each with different operational models.

Amazon RDS for PostgreSQL is the managed PostgreSQL service on AWS and is available in AWS GovCloud (US). RDS handles engine patching, automated backups, Multi-AZ high availability, and read replicas through the AWS Console or IaC tooling. For agencies whose workloads do not require Kubernetes-native database management, RDS provides the lowest administrative overhead PostgreSQL path in AWS GovCloud. Amazon RDS for PostgreSQL is included in the AWS FedRAMP-authorized boundary. (AWS GovCloud User Guide)

Amazon Aurora PostgreSQL is AWS’s cloud-native PostgreSQL-compatible database engine. Aurora is PostgreSQL-compatible at the protocol level but uses a purpose-built distributed storage layer that provides faster crash recovery, up to fifteen read replicas, and a serverless capacity mode. Aurora PostgreSQL is the target platform for the AWS SQL Server to Aurora PostgreSQL Migration Playbook — the most detailed SQL Server migration guide AWS publishes, covering the AWS Database Migration Service and AWS Schema Conversion Tool end-to-end. Aurora is FedRAMP-authorized in AWS GovCloud.

Babelfish for Aurora PostgreSQL is a separate option worth naming. Babelfish is an AWS extension for Aurora PostgreSQL that allows Aurora to accept T-SQL queries and TDS protocol connections — the wire protocol that SQL Server clients use. This means that applications connecting to SQL Server with SQL Server connection strings can connect to Babelfish for Aurora PostgreSQL with minimal or no application code changes. Babelfish does not support every T-SQL feature, and complex stored procedures may require refactoring, but for agencies with a large inventory of T-SQL client applications, Babelfish provides a migration path that minimizes application-layer changes while moving off SQL Server licensing. AWS published official guidance for migrating SQL Server to Babelfish for Aurora PostgreSQL with minimal downtime using AWS DMS. (AWS Blog, Database category)

Crunchy Data PostgreSQL on Red Hat OpenShift / ROSA GovCloud is the fourth path and the one most aligned with this agency’s Red Hat/OpenShift footprint. ROSA — Red Hat OpenShift Service on AWS — is available in AWS GovCloud and received FedRAMP In-Process designation. The Crunchy PostgreSQL Operator deployed on ROSA GovCloud provides a Kubernetes-native PostgreSQL instance with the same operational model as all other OpenShift workloads: Helm or Operator Lifecycle Manager deployment, Kubernetes-native backup/restore through pgBackRest, and declarative configuration through custom resources. This is the consolidation target that aligns database operations with the existing OpenShift platform model rather than introducing a second operational paradigm for database management alongside the Kubernetes workload paradigm.

Azure Database for PostgreSQL is Microsoft’s managed PostgreSQL service. For agencies in a GCC Moderate Microsoft environment who are already using Azure services, Azure Database for PostgreSQL — Flexible Server provides PostgreSQL as a managed PaaS within the Microsoft boundary. This path is relevant for agencies where the database must remain co-located with other Azure workloads for data sovereignty or network topology reasons.

The Three Migration Toolchains

Three vendors publish official SQL Server-to-PostgreSQL migration documentation relevant to this agency’s environment. Each covers the same conceptual migration — schema conversion, data migration, and application update — with different tooling.

Microsoft’s SQL Server Migration Assistant (SSMA) for PostgreSQL is the official Microsoft tool for migrating SQL Server databases to PostgreSQL. SSMA performs schema conversion — translating SQL Server DDL (table definitions, indexes, constraints) and stored procedure logic (T-SQL to PL/pgSQL) — with an assessment report that categorizes conversion items by automated vs. manual effort. Microsoft publishes SSMA as a free download with official documentation on Microsoft Learn. SSMA is the right tool to run first in any SQL Server-to-PostgreSQL migration because it produces the assessment that scopes the manual conversion work. The SSMA assessment output is the input to the migration planning phase. (Microsoft Learn: Azure Database Migration Guide — learn.microsoft.com/en-us/data-migration/)

AWS Database Migration Service (DMS) and Schema Conversion Tool (SCT) are the AWS tools for heterogeneous database migration. AWS SCT converts the database schema — tables, indexes, stored procedures — with an automatic conversion rating and a list of items requiring manual remediation. AWS DMS performs the data migration from the source SQL Server to the target PostgreSQL instance, supporting both one-time full-load migration and ongoing replication using Change Data Capture (CDC) for minimal-downtime migrations. AWS publishes the SQL Server to Aurora PostgreSQL Migration Playbook — a dedicated migration guide covering both tools from initial assessment through cutover — as well as a step-by-step guide for DMS Schema Conversion. The DMS CDC approach enables a parallel-run migration pattern analogous to the Book 05 login migration parallel run: the source SQL Server remains live while DMS continuously replicates changes to the PostgreSQL target, and cutover happens as a planned application-layer switch. (AWS Documentation: docs.aws.amazon.com/dms/latest/sql-server-to-aurora-postgresql-migration-playbook/)

Red Hat Migration Toolkit for Applications (MTA) addresses the application modernization side of the migration rather than the database schema side. MTA analyzes application code to identify dependencies on platform-specific APIs — including SQL Server-specific JDBC drivers, connection strings, and T-SQL client patterns — and produces a remediation report with refactoring guidance. For agencies migrating to PostgreSQL on OpenShift, MTA is the companion to SSMA or SCT: SSMA/SCT migrates the database; MTA migrates the application code that talked to the old database. Red Hat publishes MTA documentation at docs.redhat.com. (Red Hat Documentation: Migration Toolkit for Applications 7.1)

The three tools are not mutually exclusive. A full migration engagement on the OpenShift/ROSA GovCloud path would typically run SSMA (for the schema assessment), SCT (for the schema conversion targeting Aurora PostgreSQL or Crunchy PostgreSQL), DMS CDC (for the data replication), and MTA (for the application code analysis) in combination.

SSOT-Relevant PostgreSQL Capabilities

PostgreSQL’s value for the SSOT argument rests on specific capabilities that SQL Server also provides in some form but that PostgreSQL exposes in ways more compatible with a consolidation architecture.

Logical Replication allows a PostgreSQL instance to publish changes to specific tables as a logical stream that other PostgreSQL instances — or Kafka, or application consumers — can subscribe to. For agencies consolidating data from multiple source databases into one authoritative PostgreSQL instance, logical replication provides the mechanism: each source database replicates its authoritative data domain to the consolidated instance without requiring the source to be taken offline. The consolidated instance accumulates the authoritative views from all contributing sources into a single schema. Logical replication is built into PostgreSQL and requires no additional licensing.

Row-Level Security (RLS) allows PostgreSQL to enforce access policies at the row level based on session variables — the same mechanism the Federal Modernization Program’s the organizational-attribute model model uses to drive access at the group level, but applied to individual rows within a table. An the organizational-attribute model-derived security group assigned to a database role, combined with RLS policies that filter rows based on that role’s organizational scope, produces a single database table that returns different row sets to different principals based on their organizational position — without requiring separate tables or separate instances for each organizational unit. RLS eliminates one of the most common justifications for running separate database instances per organizational unit.

JSONB is PostgreSQL’s binary JSON column type with full indexing support. Agencies that have accumulated semi-structured data — configuration records, audit events, notification payloads — in separate NoSQL stores alongside their SQL Server instances can consolidate that data into PostgreSQL JSONB columns without losing query capability. A JSONB column with a GIN index supports full-text search, existence checks, and path-expression queries that compete with dedicated document stores for the semi-structured workloads most federal agencies run. JSONB reduces the argument for maintaining separate MongoDB or Elasticsearch instances alongside the primary database.

Foreign Data Wrappers (FDW) allow a PostgreSQL instance to query external data sources — including other PostgreSQL instances, Oracle databases, SQL Server instances, and flat files — through a standard SQL interface as if those sources were local tables. FDW is not a replacement for data migration; a row read through FDW is not authoritatively held in the PostgreSQL instance. But FDW provides the mechanism to expose consolidated views of partially migrated estates — presenting data from multiple sources through one SQL endpoint while migration proceeds in phases. The postgres_fdw extension connects PostgreSQL to PostgreSQL; oracle_fdw connects to Oracle; tds_fdw connects to SQL Server through the TDS protocol.

Schema-Based Tenancy is not a single PostgreSQL feature but a pattern that PostgreSQL’s role and schema model supports more naturally than SQL Server’s database-per-tenant model. A single PostgreSQL instance can host hundreds of schemas, each with independent table definitions, owned by dedicated roles, accessed through connection strings that specify the schema search path. This is the architectural basis for running many logical databases through one physical PostgreSQL instance — the database consolidation that Chapter 1 described as the SSOT destination.

The Parallel Run Pattern for Platform Migration

The parallel-run pattern that Book 05 described for login migration applies at the platform level too. A SQL Server instance does not need to be decommissioned before the PostgreSQL target is serving production traffic. The migration proceeds in three phases analogous to the login migration three phases.

Phase 1 establishes the PostgreSQL target: schema converted via SSMA or SCT, data loaded via DMS full-load, and DMS CDC started to keep the PostgreSQL instance current with changes on the SQL Server source. The PostgreSQL instance is brought up and tested against real SQL traffic in a read-only or validation role before any application is redirected.

Phase 2 runs both databases in parallel. Applications are redirected one by one to the PostgreSQL target, with the SQL Server instance remaining live as the rollback path. DMS CDC continues to replicate changes from SQL Server to PostgreSQL so the PostgreSQL instance does not lag behind. Each redirected application is observed over a defined validation period — analogous to the thirty-day validation window in the login migration — before the redirect is considered settled.

Phase 3 cuts over when all applications have been redirected and the validation period has elapsed for each. The SQL Server instance’s DMS CDC feed is stopped. The SQL Server instance is placed in read-only mode. After a final validation that the PostgreSQL instance is receiving all production write traffic, the SQL Server instance is decommissioned.

This pattern keeps the SQL Server instance alive as a rollback path throughout the migration, which is the same discipline Book 05 applied to the login migration. The old path survives until the new path is validated, then it is removed. Never drop before you observe.

 



Oracle as the Enterprise Alternative — When the Calculus Is Different

Chapter 3 — Oracle as the Enterprise Alternative: When the Calculus Is Different

PostgreSQL is the right answer for most SQL Server consolidations. Oracle is the right answer when the estate already has Oracle in it, when the PL/SQL corpus is too large to translate, or when the federal procurement path runs through an OCI GovCloud boundary.

The Decision Is Not Universal

Chapter 2 made the case for PostgreSQL as the primary federal consolidation target. That case is strong for agencies whose database estate is SQL Server and whose operating environment is Red Hat OpenShift on AWS GovCloud. But the case rests on an assumption: that the agency does not already have a significant Oracle footprint.

Many federal agencies do. Oracle has been the dominant enterprise database in federal government for decades. Agencies that standardized on Oracle for their financial management systems, human resources systems, or case management platforms did so with vendor support, GSA schedule contracts, and FedRAMP-authorized Oracle Cloud paths. For those agencies, the consolidation question is not “should we add PostgreSQL” — it is “should we consolidate the SQL Server instances onto Oracle, which we already operate, rather than introducing a third platform.”

This is the condition under which Oracle is the correct answer: when Oracle is already present and the consolidation goal is reducing the number of platforms, not selecting the theoretically optimal platform. An agency that consolidates forty SQL Server instances onto one PostgreSQL cluster and still runs an Oracle estate has not consolidated — it has added a PostgreSQL cluster to an already-mixed environment. The platform consolidation goal requires honest accounting of what is already running.

The PL/SQL Translation Asymmetry

PostgreSQL’s PL/pgSQL is functionally similar to T-SQL in most respects, and the AWS Schema Conversion Tool and Microsoft SSMA both automate a significant portion of the T-SQL-to-PL/pgSQL conversion. But T-SQL-to-PL/SQL conversion — SQL Server stored procedure logic translated to Oracle’s PL/SQL — can in some cases be less laborious than T-SQL-to-PL/pgSQL, because Oracle’s PL/SQL and SQL Server’s T-SQL share historical lineage in ways that PostgreSQL’s PL/pgSQL does not fully inherit.

More relevantly: if the agency has existing Oracle Database Administrators with PL/SQL expertise, migrating SQL Server workloads to Oracle adds those workloads to an environment the DBA team already operates. Migrating to PostgreSQL adds those workloads to a new environment the DBA team must learn to operate. The learning cost is real, particularly in a federal agency where DBA staff are full-time-equivalent positions with defined hiring and training timelines rather than contractors who can be retooled quickly.

This is not a knock on PostgreSQL. It is an acknowledgment that the total cost of platform consolidation includes operational continuity, not just licensing and tooling. An agency whose Oracle DBA team has thirty years of collective PL/SQL expertise has a consolidation cost that PostgreSQL will not eliminate by being technically superior.

Oracle Database 19c on Red Hat OpenShift Virtualization

The intersection of Oracle and Red Hat OpenShift is not theoretical. Red Hat published a reference architecture — Oracle Database 19c on Red Hat OpenShift Virtualization: Performance Validation — documenting the deployment of Oracle Database 19c workloads on OpenShift Virtualization with comprehensive performance benchmarks. OpenShift Virtualization is the KubeVirt-based virtual machine capability in OpenShift that allows traditional VM workloads — including Oracle, which cannot run in a standard Linux container due to its dependency on kernel parameters and file system layout — to run alongside containerized workloads on the same OpenShift cluster.

This matters for this agency’s footprint because it means Oracle Database can run on OpenShift without requiring a separate VMware or bare-metal environment outside the OpenShift platform. An agency that has migrated to ROSA GovCloud does not have to maintain a separate Oracle VM fleet outside OpenShift; it can run Oracle 19c as an OpenShift Virtualization VM, managed through the same Kubernetes control plane that manages its containerized workloads.

The Oracle Database Operator for Kubernetes — the Kubernetes operator that Oracle maintains for deploying and managing Oracle databases — supports both Oracle Database in containers (Oracle Database Free and XE) and Oracle Database in VMs via OpenShift Virtualization. For production Oracle workloads that require the full Oracle Database Enterprise Edition feature set, the OpenShift Virtualization path with Oracle 19c is the supported deployment model on OpenShift.

Oracle has announced support for Red Hat OpenShift 4.21 on Oracle Database Appliance (ODA) — Oracle’s engineered system for Oracle Database. This extends the Red Hat/Oracle integration to Oracle’s purpose-built hardware, enabling agencies that operate ODA to run OpenShift workloads on the same appliance that runs their Oracle database. (Oracle Blog: Announcing Red Hat OpenShift services on Oracle Database Appliance)

Oracle Cloud Infrastructure FedRAMP Authorization

Oracle Cloud Infrastructure (OCI) — Oracle’s public cloud platform — holds FedRAMP High JAB authorization for its US Government Cloud. OCI US Government Cloud provides Oracle Database as a managed cloud service in a FedRAMP High boundary, which covers agencies operating at the Moderate and High impact levels. Oracle’s US Government Cloud is distinct from Oracle’s commercial cloud; it is operated in geographically separate facilities with dedicated infrastructure for federal workloads.

Oracle Autonomous Database is available in OCI US Government Cloud with FedRAMP authorization. Autonomous Database is Oracle’s fully managed, self-tuning, self-patching database service that removes DBA administrative burden from patching, backup, performance tuning, and high availability configuration — performing those operations autonomously. For agencies that want Oracle’s SQL and PL/SQL compatibility combined with a managed operational model comparable to Amazon RDS, Autonomous Database in OCI US Government Cloud provides that path. Oracle’s Database Migration service is also available in OCI US Government Cloud, providing the migration toolchain for moving workloads from SQL Server or other sources into Oracle on OCI.

Agencies whose existing Oracle contracts run through the Oracle US Government Cloud already have the procurement vehicle for Autonomous Database consolidation. The consolidation case is straightforward: move SQL Server workloads whose data is logically related to existing Oracle workloads into Oracle Autonomous Database, reducing the instance count and eliminating SQL Server licensing for those workloads.

The SQL Server-to-Oracle Migration Path

Microsoft’s migration documentation hub at learn.microsoft.com/en-us/data-migration/ covers SQL Server migration to Azure SQL targets but not directly to Oracle. For SQL Server-to-Oracle migrations, the relevant tools come from Oracle and from AWS.

Oracle’s SQL Developer Migration Workbench provides schema conversion from SQL Server to Oracle — translating SQL Server DDL and T-SQL stored procedures to Oracle DDL and PL/SQL. Oracle SQL Developer is a free tool; the Migration Workbench is included. For data migration, Oracle offers Oracle Data Pump (for Oracle-to-Oracle) and Oracle Database Migration Service in OCI for cloud-hosted migrations.

AWS Database Migration Service supports SQL Server as a source and Oracle as a target, providing the same CDC-based minimal-downtime migration approach that the SQL Server-to-PostgreSQL playbook uses. For agencies migrating SQL Server workloads to Oracle on OCI, AWS DMS can serve as the data migration engine for the SQL Server source even if the Oracle target is not on AWS — using DMS with a source endpoint pointing to the on-premises or GovCloud SQL Server instance.

Red Hat’s Migration Toolkit for Applications (MTA) applies to the application code layer regardless of the target database — it identifies SQL Server-specific connection patterns, JDBC driver dependencies, and T-SQL client assumptions in application code that must be updated whether the target is PostgreSQL or Oracle.

Comparing the Two Paths

Both PostgreSQL and Oracle satisfy the fundamental consolidation goal: reducing the number of database instances, concentrating data authority, and moving toward SSOT. The choice between them is agency-specific. A few considerations organize the decision:

Existing Oracle footprint. Agencies with a significant Oracle estate should seriously evaluate Oracle as the consolidation target before committing to PostgreSQL, because consolidation onto Oracle reduces the total number of platforms while PostgreSQL introduces a new one.

PL/SQL complexity and DBA expertise. Agencies whose SQL Server stored procedure logic is complex and whose DBA teams have Oracle experience should favor Oracle. Agencies whose SQL Server logic is CRUD-heavy with moderate stored procedure use and whose teams are cloud-native rather than Oracle-credentialed should favor PostgreSQL.

Licensing philosophy. Agencies with Oracle site licenses that cover Autonomous Database workloads have already paid for Oracle; the incremental cost of adding SQL Server workloads to Oracle is low. Agencies without Oracle licensing will find PostgreSQL’s open-source model significantly less expensive, even accounting for Crunchy Data or EDB commercial support costs.

OpenShift deployment model. Both Oracle 19c on OpenShift Virtualization and Crunchy PostgreSQL Operator on OpenShift run on the same ROSA GovCloud environment. The deployment model is different — VMs for Oracle, Kubernetes pods for PostgreSQL — but both are manageable within the OpenShift platform. The operational preference for Kubernetes-native vs. VM-based workloads is an organizational decision.

Migration toolchain availability. The PostgreSQL migration toolchain — Microsoft SSMA, AWS SCT, AWS DMS — is more mature, more thoroughly documented, and more widely used for SQL Server-to-PostgreSQL migrations than the SQL Server-to-Oracle toolchain. This is a practical advantage for agencies that need to move quickly through migration planning.

Neither path is wrong. Both are correct for different agencies. The SSOT goal is the same either way: one authoritative database platform, one data authority model, one operational team with one set of skills, one licensing position — instead of forty SQL Server instances that re-authenticate cleanly but fragment authority as completely as they did before.

 



The Decision Under a Forcing Function — Choices and Recommendations

Chapter 4 — The Decision Under a Forcing Function: Choices and Recommendations

Microsoft is not asking whether the estate changes. Three pressures decide the timing. What remains genuinely the agency’s to decide is the destination — and that decision is profile-specific, not universal.

Microsoft Is Not Asking

The first three chapters of this book presented the platform question as if it were a discretionary architectural improvement — a thing a well-run agency could pursue once the authentication transformation exposed the sprawl underneath. That framing is incomplete. The platform question has a clock on it, and the clock is set by Microsoft, not by the agency.

This does not mean Microsoft is forcing a specific destination. It is not. What Microsoft is forcing is the obsolescence of the starting point — the fully domain-joined, Active-Directory-anchored, Windows-Authentication SQL Server estate that Book 01 described as good engineering for a world that no longer exists. Three independent pressures are retiring that starting point on overlapping timelines, and an agency that does not decide where it is going will find the decision made for it by attrition: instances falling out of support, patches no longer flowing, and connections breaking as protocol defaults tighten.

The honest framing for leadership is therefore neither “Microsoft is forcing us onto Azure” nor “we can take our time.” It is this: the floor is moving on a schedule we do not control, the direction of travel off that floor is genuinely ours to choose, and the cost of choosing nothing is to be carried by the current rather than to navigate it.

The Three Forcing Functions

The first pressure is version end-of-support. Each SQL Server version carries roughly a decade of support — five years mainstream, five years extended — after which security updates stop entirely. An out-of-support engine is not merely unfashionable; it is an instance that receives no fixes for newly discovered vulnerabilities, fails the security-update controls that every federal authorization-to-operate depends on, and accrues audit findings that compound until the instance is remediated or excepted. End-of-support forces a version decision: upgrade the engine, or leave the version behind. It does not, by itself, force Arc or a re-platform — but it starts the clock that the other two pressures run on.

The second pressure is Extended Security Updates gated behind Azure Arc. When a version passes end-of-support but cannot yet be upgraded, Extended Security Updates keep critical patches flowing for a bounded additional window. The decisive detail is the delivery mechanism: the streamlined, pay-as-you-go ESU path is delivered and billed through Azure Arc. The agency enables the instance with Arc, and the updates attach and bill through that Arc resource; Microsoft has further made ESUs free for instances migrated to or enabled by Azure. A traditional volume-license ESU path still exists for agencies that do not want Arc, but it is the narrower, time-boxed, upfront-purchase option. The practical effect is that the longer an agency stays on an out-of-support version, the more Arc enablement becomes the path of least resistance to staying patched — a soft force toward the cloud-management plane, applied through the patch-delivery channel rather than through any single mandate.

The third pressure is NTLM deprecation, and it is the one most likely to surprise an agency that believes it is already secure. Microsoft is actively deprecating NTLM and hardening Windows defaults toward Kerberos. SQL Server’s silent NTLM fallback — the behavior Book 01 named as the first and most consequential fault in the inheritance, where a missing SPN drops a connection from Kerberos to NTLM with no error in the SQL log — becomes a liability the moment NTLM is blocked network-wide. A network-level NTLM block does not distinguish between instances that are excepted from the transformation and instances that are not; it breaks the connection regardless. This pressure forces a move off Windows Authentication’s NTLM fallback toward Kerberos and, ultimately, Microsoft Entra token authentication. It is independent of version and independent of Arc — it lands on the authentication layer directly, on the schedule of the progressive NTLM elimination strategy. (the Kerberos/NTLM elimination decision)

None of the three is a single flag-day switch. Together they converge into a posture where “stay fully on-premises, AD-anchored, never touch Arc, keep Windows Authentication” is not impossible but progressively untenable — more expensive, less supported, and more exposed with every passing support window.

What Is Forced and What Is Chosen

The most important clarification this chapter can offer is the line between the part of the decision that Microsoft has made and the part that remains the agency’s. Conflating the two produces either fatalism — “we have no choice, Microsoft is dictating our architecture” — or denial — “we can wait this out.” Both are wrong, and both are expensive.

What is forced is the authentication-layer change. The estate must move off NTLM and off Windows Authentication’s silent fallback; it must move off end-of-support engine versions, by upgrade or by departure; and if it stays on an out-of-support version, Arc enablement becomes the practical mechanism for continued Extended Security Updates. These are not architectural preferences. They are the consequences of the three forcing functions, and they arrive whether or not the agency has a platform strategy.

What is chosen is the platform-layer destination. Whether a re-authenticated instance remains on SQL Server, consolidates onto PostgreSQL, or consolidates onto Oracle is not dictated by any of the three pressures. How far the agency pushes toward Single Source of Truth — re-authenticating the silos in place versus dissolving them into one authoritative database — is a governance decision the forcing functions make possible to ask clearly but do not answer. And the sequencing of which instances move first, within the forced windows, is the agency’s program to run.

The forced part is sequenced before the chosen part, and this ordering is not negotiable in the other direction. The authentication audit and estate rationalization (Books 02 and 03) come first because they produce the inventory — which instances exist, which are authoritative, which silently fall back to NTLM — that every platform choice depends on. An agency cannot intelligently decide whether to re-platform an instance it has not yet inventoried and classified. The forcing functions, in this sense, do the agency a backhanded favor: they compel the assessment that the platform decision was always going to require.

The Three Destinations

Every retained instance lands at one of three destinations, and all three satisfy the forced requirement — authentication that is observable and conditionable in the identity plane. They differ in effort, in licensing, and in how far they advance the consolidation goal.

The first destination is to stay on SQL Server. The instance is upgraded to SQL Server 2022 if it is not already, Arc-enabled, and migrated from Windows Authentication to Microsoft Entra token authentication through the FROM EXTERNAL PROVIDER login path that Books 04 through 06 describe. This is the lowest-effort destination: the forced work is the whole job, and no schema conversion or application rewrite is required. It does not advance the SSOT goal — forty re-authenticated instances are still forty silos — and it continues SQL Server’s per-core licensing. It is the right destination when sprawl is low, the timeline is tight, and the workloads depend on SQL-specific features.

The second destination is to consolidate onto PostgreSQL, the primary federal re-platform target that Chapter 2 detailed. For an agency operating on Red Hat OpenShift in AWS GovCloud, this means the Crunchy Data PostgreSQL Operator on ROSA GovCloud, with Amazon RDS, Aurora (optionally with Babelfish for T-SQL compatibility), and Azure Database for PostgreSQL as the other authorized paths. This destination is high-effort — it requires schema and T-SQL-to-PL/pgSQL conversion via SSMA or the AWS Schema Conversion Tool, data migration via AWS DMS, and application-code remediation via Red Hat’s Migration Toolkit for Applications — but it eliminates SQL Server licensing and brings the consolidation primitives (logical replication, Row-Level Security, JSONB, Foreign Data Wrappers, schema-based tenancy) that make a one-authoritative-database SSOT architecture achievable. On Azure Database for PostgreSQL the authentication is Entra-native; on self-managed Crunchy/ROSA the governance hook is the organizational-attribute model-derived database roles combined with Row-Level Security.

The third destination is to consolidate onto Oracle, the enterprise alternative that Chapter 3 examined. Oracle Database 19c runs on Red Hat OpenShift Virtualization as a KubeVirt VM alongside containerized workloads, and Oracle Autonomous Database runs in OCI US Government Cloud under FedRAMP High authorization. This destination is high-effort in the same way PostgreSQL is, but its calculus is different: it is the correct answer specifically when the agency already operates a significant Oracle estate, carries a large or complex PL/SQL corpus, or fields an Oracle-credentialed DBA team. For such an agency, consolidating SQL Server workloads onto Oracle reduces the number of platforms, whereas introducing PostgreSQL alongside an existing Oracle estate would add one.

The Decision Matrix

The choice among the three is profile-specific. There is no destination that is correct for every agency, and a recommendation that pretended otherwise would be worse than useless — it would be wrong for some fraction of the agencies that followed it. The matrix below maps an estate profile to a recommended path; the reasoning behind each is drawn from the criteria Chapters 2 and 3 established.

An agency with a low instance count, well-configured Windows Authentication, a tight timeline, and SQL-specific feature dependencies should stay on SQL Server 2022 with Entra. The forced work — upgrade, Arc-enable, migrate logins — is the entirety of the job, and the sprawl does not justify the cost and risk of a re-platform.

An agency that is OpenShift-first on ROSA GovCloud, has no significant Oracle estate, has stated a licensing-exit goal, and runs predominantly CRUD-heavy workloads should consolidate onto PostgreSQL. Crunchy on ROSA aligns database operations with the existing OpenShift platform model rather than introducing a second operational paradigm, eliminates per-core licensing, and rides the most mature SQL-Server-to-target migration toolchain available.

An agency with a significant existing Oracle estate, a large and complex PL/SQL corpus, an Oracle-credentialed DBA team, and an Oracle site license already paid for should consolidate onto Oracle. Here the consolidation goal — fewer platforms — points to Oracle precisely because Oracle is already present; PL/SQL translation effort and DBA operational continuity reinforce the choice.

An agency facing high sprawl with SSOT consolidation as an explicit goal and an uncertain Oracle position should treat PostgreSQL as the default re-platform target, evaluating Oracle only if an Oracle estate already exists. PostgreSQL’s consolidation primitives and toolchain maturity make it the lower-risk path to one authoritative database when no incumbent enterprise platform tips the scale.

And an agency whose data must remain co-located with Azure workloads for data-sovereignty or network-topology reasons should choose either to stay on SQL Server or to consolidate onto Azure Database for PostgreSQL, both of which keep the data inside the Microsoft GCC-Moderate boundary while still meeting the forced authentication requirement.

The matrix applies per data domain, not per agency. The realistic outcome for a large estate is a blend: a handful of SQL Server 2022 instances retained on Entra for SQL-specific workloads, the long tail consolidated onto PostgreSQL, and Oracle-adjacent data folded into the existing Oracle estate. The goal is not a single vendor — it is fewer authoritative platforms than the forty-instance sprawl the agency started with.

 

 



the organizational-attribute model × SQL Server — The Integration Bridge

How the the organizational-attribute model governance substrate powers the SQL Server identity transformation, and the order in which to read the two series

the organizational-attribute model × SQL Server — The Integration Bridge

The two reading sequences on this portal that most often get read in isolation are siblings. The Federal Modernization Program the organizational-attribute model series builds a governance substrate; the SQL Server Identity Transformation series consumes it. Read apart, each is complete. Read together, they describe a single movement: an Active Directory forest’s organizational structure becomes a set of Entra ID attributes, and those attributes become the access-control authority for a SQL Server estate that no longer trusts the domain. This page names the seams where the two meet, corrects the one place the relationship is most often described wrongly, and proposes the order to read them in.

The substrate and the consumer

the organizational-attribute model is the organizational coordinate system Microsoft’s identity stack does not supply on its own. The the organizational-attribute model series develops it across seventeen documents, beginning with what the native stack provides and ending with the synthesis; the implementation itself — populating the Entra ID attribute lineage from HR data — is the subject of the organizational-attribute model Book 04, “Implementing OrgTree and the organizational-attribute model.” Everything downstream depends on Book 04 being done.

The SQL Server series consumes that coordinate system at exactly one structural point: access control. SQL Book 07, “AD Group Types and the Entra Perimeter,” is where a migrated SQL Server stops being governed by AD security groups maintained through helpdesk tickets and starts being governed by Entra dynamic security groups whose membership is computed from the organizational-attribute model attributes. The dependency direction is therefore fixed: the the organizational-attribute model attribute infrastructure must precede the SQL dynamic-group access work, not the reverse.

The five seams

Seam 1 — Dynamic-group access (the one most often described wrongly)

This is the load-bearing seam, and it is worth stating its mechanism precisely, because it is easy to get wrong. the organizational-attribute model is not a single packed string stored in one attribute. It is a multi-facet schema (the attribute schema decision) materialized across several Entra extensionAttribute slots — region, department, division, clearance, account-type, and the rest — and a dynamic-group rule is composed from per-facet predicates, not from a string comparison against a whole path. The canonical rules are not hand-authored New-MgGroup calls; they are rendered by the dynamic-group library from the organizational-attribute dynamic group library against the active per-facet Codebook (the related specification), under the dynamic group provisioning decision and the consumer architecture decision. SQL Book 07’s worked example — a single-facet rule that admits a principal whose the organizational-attribute model attribute matches and whose title contains “DBA” — is an illustrative slice of that general model, not the whole of it. Any integration artifact that hardcodes a single extensionAttribute holding a path=... string is describing a shortcut the substrate does not take.

Seam 2 — DBA delegation

Once SQL access rides on Entra groups, the people who manage those groups need a scope. SQL Book 07 Chapter 2 puts DBA-team membership management inside an Administrative Unit so a DBA can manage the SQL groups for their branch and nothing else. That Administrative Unit is the the organizational-attribute model-shaped delegation surface the administrative unit provisioning decision provisions — the same branch structure that drives the dynamic-group rules also bounds who may edit them.

Seam 3 — Migration sequencing

the SQL Server authentication transformation decision §1 makes estate consolidation a gate in front of engine-layer auth migration: an instance is migrated only after it is classified retain or consolidation-target (SQL Book 02). the organizational-attribute model coverage is the second gate on the same instances. A business unit whose the organizational-attribute model attributes are not yet populated cannot have its SQL access expressed as dynamic groups, so migration waves follow both the consolidation classification and the organizational-attribute model coverage maturity. The series do not assert calendar dates for this; the SQL Server authentication transformation decision’s own plan is anchored to the program’s progressive NTLM elimination strategy, not to fixed quarters.

Seam 4 — Conditional Access perimeter

Book 07 closes on the architectural dividend: once every SQL login is a type-E login backed by an Entra principal, Conditional Access becomes a binary outer perimeter — device compliance, Named Locations, sign-in risk — that a single surviving Windows login would bypass entirely. The principals that perimeter evaluates are the the organizational-attribute model-derived groups; the CA design that governs them is the same one the the organizational-attribute model series develops as the cloud successor to GPO logon restrictions (the organizational-attribute model Book 15). The two series describe one perimeter from two sides.

Seam 5 — Closure and drift

the SQL Server authentication transformation decision §5 defines the the continuous compliance monitoring baseline per-instance record as the closure artifact for Transformation #7 — LoginMode = 1, zero type-S/W/G logins, sa disabled, Arc + Managed Identity healthy, CA-MFA satisfied — and makes closure continuously verified, not a point-in-time claim. That continuous posture is where the substrate’s own drift discipline (the drift engine decision, the drift engine specification) closes the loop: an the organizational-attribute model drift on a SQL-governing dynamic group is not a cosmetic event, it is a change in who can reach the database, and it surfaces as a Transformation #7 compliance signal rather than disappearing into manual group management.

Recommended reading order

The two series interleave; reading either straight through leaves the seam implicit. This order makes the dependency explicit.

What this bridge deliberately does not claim

For the avoidance of doubt, and because earlier external syntheses of this relationship got these details wrong:

It does not claim the organizational-attribute model lives in a single extensionAttribute as a packed path string. the organizational-attribute model is a per-facet schema (the attribute schema decision) across multiple attributes, and rules are composed from per-facet predicates (the dynamic group provisioning decision).

It does not prescribe hand-authored New-MgGroup commands as the way to create SQL access groups. The canonical groups are rendered from dynamic-groups.yaml against the Codebook and extended by governed PR.

It does not assign fixed calendar-quarter milestones to the integration. Sequencing is gated by consolidation classification and the organizational-attribute model coverage, aligned to the program’s NTLM elimination strategy as dependencies are remediated.

Companion canon

the SQL Server authentication transformation decision — SQL Server Engine Authentication Transformation (the engine-layer decision the SQL series motivates; PROPOSED).

the dynamic group provisioning decision — Dynamic Group Provisioning (the the organizational-attribute model-driven Entra security-group model SQL Book 07 consumes).

the administrative unit provisioning decision — Administrative Unit Provisioning (the delegation surface for DBA group management).

the attribute schema decision — the organizational-attribute model Attribute Schema (the multi-facet attribute model).

the drift engine decision / the drift engine specification — the drift engine that makes the organizational-attribute model-on-SQL changes a compliance signal.

the identity and directory transformation inventory — Transformation #7 (the gap the SQL Server authentication transformation decision closes).



The Forcing Function — Agency Choices & Recommendations

Microsoft is changing the SQL Server identity floor on a timeline you do not control. This page names the three pressures forcing the change, the three destinations available, and a profile-driven recommendation matrix — no universal winner.

The Forcing Function — Agency Choices & Recommendations

The question is no longer whether the SQL Server estate changes. Microsoft is moving the identity floor underneath it — retiring the protocols and versions the estate was built on — on a timeline the agency does not set. This page is the decision layer over the eleven-book series: it names the pressures forcing the change, separates what is forced from what is a choice, lays the three destinations side by side, and maps an agency profile to a recommended path.

It is deliberately neutral. There is no universal winner — only a destination that fits a given estate, licensing position, and operating model. The reasoning behind each cell lives in the books; this page names the decision.

Why now — the three forcing functions

Three independent pressures are converging. None of them, on its own, is a flag-day switch; together they make “stay fully on-premises, Active-Directory- anchored, never touch Arc, keep Windows Authentication” progressively untenable rather than impossible.

 

What is forced — and what is a choice

The single most important distinction on this page. Conflating the two is what makes the program feel like a Microsoft mandate with no agency. It is not.

The forced part is an authentication-layer change; the chosen part is a platform-layer change. They are sequenced, not simultaneous — and the authentication work comes first regardless of the destination, because it is what produces the rationalized estate inventory that scopes any platform move (Book 03, Book 11 Chapter 1).

Your three destinations

Every retained instance ends up at one of three destinations. All three satisfy the forced requirement — auth that is observable and conditionable in the identity plane. They differ in effort, licensing, and how far they advance the SSOT goal.

 

The recommendation matrix

There is no universal recommendation — the right destination is a function of the estate. Read down to the first profile that matches; the criteria are drawn from Book 11 Chapters 2 and 3.

 

Decision sequence

Audit & rationalize first (Book 02–03). Inventory every instance, surface silent NTLM fallback, and classify each instance retire / consolidate / retain. This is forced work and it produces the inventory every later choice depends on.

Do the forced authentication move on the retain set (Books 04–06): Arc- enable, stand up Entra logins alongside Windows logins, cut over, retire the old logins. The two auth modes coexist during the parallel run.

Then make the platform choice per data domain using the matrix above. Re-platform (B/C) follows the same parallel-run discipline — establish the target, validate in parallel, cut over only after the validation window. Never drop before you observe.

Read next

Book 11 — The Platform Question — the full platform analysis.

Chapter 1 — The Fragmentation Cost (the SSOT case)

Chapter 2 — PostgreSQL in the Federal Stack (destination B)

Chapter 3 — Oracle as the Enterprise Alternative (destination C)

Chapter 4 — The Decision Under a Forcing Function (the narrative form of this brief)

Division of Labor — Microsoft vs. You — what the platform provides vs. what only the program can solve, across all eleven books.

Series index — the full reading sequence.



Division of Labor — Microsoft vs. You

What the platform provides across all ten books, and what only the program can solve

Division of Labor

The organizing principle of this series is a clean separation: Microsoft has built an exceptional cloud identity platform, and it solves the engine problem precisely. What it does not — and cannot — solve is the environmental problem: the twenty-year estate you built on a foundation it is now asking you to replace.

Every book in the series returns to this division. This page puts it in one place.

The Matrix

The Through-Line

Reading the What only you can provide column top to bottom produces a program:

Build the true inventory — not the Arc-discovered one, the complete one.

Decide what survives — retire the zombies, consolidate the stragglers, only then migrate what remains.

Measure the authentication posture of what survives — classify every instance, classify every NTLM finding by pattern.

Deploy Arc in dependency order — verify the IMDS token before declaring a host ready for login migration.

Map every AD principal to its Entra equivalent — users, groups, service accounts, each with a different migration path.

Migrate logins in parallel — create, validate, disable, observe, drop. Never drop before you observe.

Eliminate NTLM by pattern — SPN fixes first, connection-string updates second, domain-topology fixes last (they wait on the consolidation program).

Classify every AD group and every application in the chain — both have four types, each type has a different path.

Inventory every connection string — the last mile is also the most operationally intensive.

Verify the closure conditions continuously — the posture is not declared, it is measured. Phase C must arrive as a non-event.

Migrate the PKI before you retire ADCS — the certificate dependencies are invisible until they break.

Microsoft provides a platform capable of all of this. The program is what drives the estate through it.