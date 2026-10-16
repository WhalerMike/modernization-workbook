# SQL Server Identity Transformation — Case Study

**From Windows Authentication to cloud identity — transforming a twenty-year SQL Server estate**

## Status

This is a cleaned overview of a multi-chapter narrative. It is written as an engineering argument, not a runbook. Treat the patterns as guidance that must be validated against the specific estate.

## The destination

Windows Authentication and SQL Authentication are eliminated and replaced with cloud identity authentication for SQL Server 2022 and later. Authentication is enforced through OAuth 2.0 tokens, a managed identity for the engine process, and multi-factor authentication for every human principal.

## The inheritance

SQL Server’s Windows Authentication was good engineering for its world, not negligence. The problem is that the world changed. Session-based authentication that assumes a domain controller is reachable and that a service principal name is correctly registered does not survive long-distance, heavily inspected networks or Zero Trust requirements.

## The precondition most narratives skip

You cannot migrate the authentication of an estate you have not first **assessed and consolidated**. After twenty years across an Active Directory forest, the estate is larger and more tangled than any team’s mental model of it. Consolidation and inventory precede authentication migration.

## The journey in three states

### Before — the domain is the trust boundary

Every party is domain-joined. The domain controller is the authentication authority. Kerberos is the protocol. NTLM is the silent fallback when the service principal name is missing. The cloud identity plane is not in the path.

What this architecture cannot provide: Conditional Access, phishing-resistant multi-factor authentication, and cloud identity plane visibility.

### During — both paths live simultaneously

Legacy clients still use Kerberos or fall back to NTLM through the domain controller. Migrated clients authenticate to the cloud identity platform and present a token. The SQL Server accepts both Windows logins and cloud-identity logins during the parallel-run window.

This hybrid state is a controlled risk. Progress is measured across estate consolidation, hybrid-management enrollment, login migration, NTLM elimination, and connection-string migration.

### After — no domain controller in the authentication path

The client authenticates to the cloud identity platform with multi-factor authentication. Conditional Access evaluates identity and device. An OAuth 2.0 token is issued. The SQL Server validates the token signature against the cloud identity platform’s public key infrastructure. The token carries context — how you authenticated, which groups you belong to, whether your device is compliant — making the database application-aware.

Windows Authentication, SQL Authentication, Kerberos, NTLM, and domain-controller dependency are eliminated.

## Chapter substance

### Book 01 — The inheritance

Windows Authentication was good engineering for its world. Kerberos tickets, service principal names, and the assumption of domain-controller proximity worked when everything was local. The failure mode is silent NTLM fallback when the service principal name is missing or when the domain controller is unreachable.

### Book 02 — Assess and consolidate first

Three forms of sprawl: orphaned instances, duplicate databases, and service accounts that no one owns. Discovery instruments must inventory what is actually running before any authentication change is attempted. Rationalization lenses decide retain, consolidate, or retire. The gate is evidence, not opinion.

### Book 03 — Authentication audit

What is actually using Windows Authentication, SQL Authentication, and NTLM. The audit produces a principal-type inventory and a connection-string inventory. No migration plan is valid without this baseline.

### Book 04 — Hybrid-management identity bridge

Attach the management plane so the server can receive policy and telemetry without requiring domain membership for authentication. Managed identity for the engine process is the destination for the service account.

### Book 05 — Login migration

Introduce cloud-identity logins alongside Windows logins. Parallel-run is the controlled risk period. Type-U (Windows) and type-E (cloud identity) logins coexist until the connection-string migration is complete.

### Book 06 — NTLM elimination at the SQL layer

NTLM is the silent fallback. Eliminating it requires first repairing service principal names, then restricting the protocol, then verifying that no application falls back. Premature restriction breaks legacy clients.

### Book 07 — Access control

Dynamic groups driven by organizational attributes replace manual database-administrator provisioning. Administrative-unit delegation scopes who can manage which databases. The attribute infrastructure must precede the dynamic-group work.

### Book 08 — Upstream application chain

Applications that depend on Windows Authentication or LDAP bind must be migrated or wrapped. Four classes of applications: those that can use tokens natively, those that need a proxy, those that need a code change, and those that must be retired.

### Book 09 — Transformed steady state

The 2027 milestone: no domain controller in the authentication path, no NTLM, no SQL Authentication for human principals, managed identity for the engine, Conditional Access for every human connection.

### Book 10 — Certificate-authority dependency

The layer the other steps depend on but rarely name. Certificate services, auto-enrollment, and the trust relationships that Kerberos and token validation both rely on. Certificate-authority failure is a silent failure that surfaces only when tickets or tokens cannot be validated.

## Relationship to attribute-driven structure

This transformation consumes the organizational-attribute substrate. Dynamic security groups whose membership rules reference organizational attributes drive SQL Server access without manual database-administrator provisioning. The attribute infrastructure must precede the dynamic-group access work.

## Audience

Database engineers who execute the login migrations, infrastructure architects responsible for estate consolidation and hybrid-management sequencing, security engineers who own the Conditional Access design, and program leadership who must understand the scope of the consolidation program that precedes authentication migration.

---

*Cleaned extraction for project use. No internal branding or document identifiers. Full multi-chapter narrative and implementation companion remain in the source repository if deeper detail is required.*
