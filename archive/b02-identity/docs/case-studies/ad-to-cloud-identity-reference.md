# Active Directory to Cloud Identity — Reference Framing Pattern

**End-to-end through the five-phase posture**

## Starting state

A federal civilian agency operates a 20-year Active Directory forest with twenty years of SQL Server instance and database sprawl. Service principal names, service accounts, and LDAP-dependent applications are uninventoried. Evidence for continuity is assembled retrospectively.

## Intervention

The migration is treated as a governance event. An authoritative origin is designated for every identity claim before any object moves. Dependencies are inventoried. Drift detection is applied continuously. The SQL Server estate is transformed from Windows Authentication to token-based authentication in parallel with the directory migration.

## Observed behavior (intended)

Orphaned accounts and broken dependencies are identified before cutover. Silent authentication failures are converted into explicit findings. Evidence for authorization continuity is a byproduct of the migration.

## Lessons

- A conventional migration moves users. A governance-aware migration moves the entire identity namespace and every dependency attached to it.
- Findings must be reusable; each engagement should not start from scratch.
- The SQL Server estate and the directory estate must be governed together; they share the same authentication boundary.

---

*Cleaned framing pattern for project use. Not a deployed reference. No internal branding or document identifiers.*
