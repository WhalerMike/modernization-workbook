# Book 05 — Login Migration

**Parallel-run of Windows and cloud-identity logins**

## The parallel-run pattern

Login migration does not flip a switch. It runs both authentication paths simultaneously until the new path is proven, then retires the old path. The SQL Server accepts both type-U (Windows) and type-E (Entra) logins during the window. Legacy clients continue to present Kerberos or fall back to NTLM. Migrated clients authenticate to the cloud identity platform and present an OAuth 2.0 token.

![The required three-phase parallel run for production.](../../images/sql-server/diagrams/svg/book-05-ch01-parallel-run.svg){fig-alt="Phase 1 creates an E or X login for every migrating login, phase 2 validates a real Entra sign-in for each, phase 3 disables but doesn't drop the old login, and after 30 days with no residual use the old login is dropped."}

![Every legacy login type maps to an Entra principal.](../../images/sql-server/diagrams/svg/book-05-principal-mapping.svg){fig-alt="Type U Windows users map to type E Entra users, type G Windows groups to type X Entra groups, type S SQL logins to Entra applications (a managed identity or service principal), and sa is disabled and renamed rather than migrated."}

## Principal type mappings

SQL Server 2022 supports three principal types for Entra authentication via the FROM EXTERNAL PROVIDER syntax:

- **User** — an individual Entra ID user. The login maps to a specific principal.
- **Group** — an Entra ID security group. Membership is dynamic; access follows group membership without manual DBA action.
- **Service principal** — an application or managed identity. Used for application connections and the engine process itself.

The Azure.Identity SDK DefaultAzureCredential chain handles token acquisition. Conditional Access evaluates the token issuance request before the token reaches SQL Server. If the policy requires MFA and the principal has not completed it, the token is denied. If the device is non-compliant, the token is denied. The policy has leverage because the token is the credential SQL Server accepts.

## The parallel-run sequence

1. **Create** the Entra login alongside the existing Windows login. Both exist. Both can authenticate.
2. **Validate** against real traffic. Confirm that migrated clients connect successfully and that the token carries the expected claims.
3. **Disable** the Windows login. Observe for a defined window. Confirm that no legitimate traffic is blocked.
4. **Drop** the Windows login only after the observation window confirms the new path is stable.

Never drop before you observe. The parallel-run window is the safety margin that prevents access disruption.

## What Book 05 establishes

Login migration is a parallel-run, not a cutover. The SQL Server accepts both Windows and Entra logins during the window. Principal types map to users, groups, and service principals. Conditional Access evaluates the token before it reaches the engine. The sequence is create, validate, disable, observe, drop — never drop before you observe.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
