# Data Platform Identity Transformation — Project Charter

## 1. Purpose

Extend identity modernization from the directory and endpoint to the data platform: eliminate stored credentials, remove NTLM fallback, and produce continuous evidence of database and application-tier authentication.

## 2. Problem Statement

The data platform still relies on stored passwords, NTLM fallback, and manual credential rotation. The SQL Server narrative demonstrates the pattern, but other engines and the application tier remain unaddressed. The result is:

- Crown-jewel systems authenticated by long-lived secrets.
- No continuous evidence of who or what authenticated to the data tier.
- Credential rotation that is manual and unverifiable.
- Application-tier service principals that hold broad, standing permissions.

## 3. Objectives

1. Assess the data-platform estate: engines, authentication methods, stored credentials, and NTLM usage.
2. Migrate at least one engine (beyond or in addition to the SQL Server worked example) to token-based or managed-identity authentication.
3. Eliminate NTLM fallback for the migrated scope after audit.
4. Move application-tier access to managed identity or scoped, short-lived credentials where feasible.
5. Emit continuous evidence of data-platform authentication and access.
6. Document network-physics and consistency constraints that limit consolidation.

## 4. Scope

### In Scope
- Database authentication modernization (token-based, managed identity).
- NTLM elimination for the data tier after audit.
- Application-tier identity (service principals, managed identities) that access data platforms.
- Secrets and certificate lifecycle for data services.
- Continuous evidence of authentication and access.
- Network-physics and consistency-class constraints on consolidation.

### Out of Scope (Initial Phase)
- Full database consolidation or platform replacement.
- Application code changes beyond authentication configuration.
- Non-relational data platforms beyond inventory.

## 5. Guiding Principles

- **Assess before you migrate.** You cannot modernize the authentication of an estate you have not inventoried.
- **Token-based destination.** Short-lived tokens or managed identity replace stored passwords.
- **NTLM is eliminated only after audit.** Premature blocking breaks legacy clients.
- **Evidence is continuous.** Authentication events emit into the evidence stream.
- **Physics constrains consolidation.** Speed-of-light and consistency-class limits are explicit.

## 6. Success Criteria

- Data-platform estate assessed: engines, authentication methods, and stored credentials inventoried.
- At least one engine migrated to token-based or managed-identity authentication for a pilot scope.
- NTLM usage for that scope audited; restriction plan documented.
- Application-tier access for the pilot uses managed identity or scoped credentials.
- Authentication evidence available for the pilot.
- Network-physics constraints documented for any consolidation under consideration.

## 7. High-Level Approach

1. **Assess** — Inventory engines, authentication methods, stored credentials, and NTLM usage.
2. **Bridge** — Introduce token-based or managed-identity authentication alongside existing methods.
3. **Migrate** — Move pilot workloads; retire stored credentials for the migrated scope.
4. **Eliminate NTLM** — Restrict after audit confirms dependencies are resolved.
5. **Evidence** — Emit authentication events continuously.

## 8. Risks and Assumptions

### Key Risks
- Legacy clients require NTLM and cannot be updated in the initial phase.
- Application code embeds connection strings or secrets.
- Managed identity is unavailable for some engines or hosting models.
- Consolidation plans ignore network-physics limits.

### Assumptions
- At least one data-platform engine supports token-based or managed-identity authentication.
- Stakeholders accept a phased approach with residual legacy authentication documented.

## 9. Governance and Ownership

- Project sponsor: (to be named)
- Project lead: (to be named)
- Domain leads: Database Authentication, Application-Tier Identity, Secrets Lifecycle, Evidence

## 10. Next Steps

- Inventory data-platform engines and current authentication methods.
- Identify the pilot engine and scope.
- Confirm managed-identity or token-based support.
- Document NTLM dependencies.
- Establish evidence expectations for authentication events.

---

*This charter describes a data platform identity transformation project. It deliberately omits internal architectural decision records and document identifiers.*
