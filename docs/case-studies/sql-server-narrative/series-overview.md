# SQL Server Identity Transformation

**From Windows Authentication to cloud identity — a ten-book reading sequence on transforming the SQL Server estate, from twenty years of forest sprawl to cloud-only authentication**

![Series cover](../../images/sql-server/series-cover-original.png)

## Status

This is a cleaned multi-chapter narrative. It is written as an engineering argument, not a runbook. Treat the patterns as guidance that must be validated against the specific estate.

## The destination

Windows Authentication and SQL Authentication are eliminated and replaced with cloud identity authentication for SQL Server 2022 and later. Authentication is enforced through OAuth 2.0 tokens, a managed identity for the engine process, and multi-factor authentication for every human principal. This series documents the path to that destination and provides the analytical foundation for the engine-layer decision.

The series is written in continuous narrative voice. It avoids the bullet-point shorthand of a runbook, because the transformation it describes is not a checklist — it is an engineering argument, and engineering arguments require sentences.

## Reading sequence shape

Book 01 names the inheritance: SQL Server’s Windows Authentication was good engineering for its world, not negligence. Book 02 confronts the precondition that most authentication narratives skip: you cannot migrate the authentication of an estate you have not first assessed and consolidated, and after twenty years across an Active Directory forest, the estate is larger and more tangled than any team’s mental model of it. Books 03 through 06 trace the migration itself — the authentication audit, the identity bridge, the login migration, and NTLM elimination at the SQL layer. Books 07 and 08 follow the transformation outward, into access control and the upstream application chain. Book 09 describes the transformed steady-state and the milestone, and Book 10 addresses the certificate-authority dependency that the other nine books depend on but rarely name.

## The transformation in diagrams

### Before — Kerberos overview

![Before: Kerberos overview](../../images/sql-server/before-kerberos.png)

Every party is domain-joined. The domain controller is the authentication authority. Kerberos is the protocol. NTLM is the silent fallback when the service principal name is missing. The cloud identity plane is not in the path.

### Kerberos session lifecycle

![Kerberos session lifecycle](../../images/sql-server/kerberos-lifecycle.png)

The three-party exchange: AS-REQ, TGT, TGS-REQ with SPN, service ticket, AP-REQ to SQL, validation, AP-REP. NTLM is the silent fallback when the SPN is missing.

### During — two paths overview

![During: two paths overview](../../images/sql-server/during-overview.png)

Legacy clients still use Kerberos or fall back to NTLM. Migrated clients authenticate to the cloud identity platform and present a token. The SQL Server accepts both during the parallel-run window.

### During — parallel-run pattern

![During: parallel-run pattern](../../images/sql-server/during-parallel.png)

Three phases: add the cloud-identity login alongside the Windows login, run both in parallel and validate against real traffic, then disable, observe, and drop the Windows login.

### Migration state

![Migration state](../../images/sql-server/migration-state.png)

Both authentication paths live simultaneously. Legacy clients use Kerberos or NTLM. Migrated clients present an OAuth token. The SQL Server accepts both type-U and type-E logins.

### After — application-aware token authentication

![After: application-aware token](../../images/sql-server/after-token.png)

No domain controller in the authentication path. The client authenticates to the cloud identity platform with multi-factor authentication. Conditional Access evaluates identity and device. An OAuth 2.0 token is issued. The SQL Server validates the token. The token carries context — how you authenticated, which groups you belong to, whether your device is compliant.

### Token session lifecycle

![Token session lifecycle](../../images/sql-server/token-lifecycle.png)

Auth + MFA to the cloud identity platform, Conditional Access evaluation, signed token issued, token presented to SQL, validation, connection open, and silent token refresh.

## The decision, in one page

The platform vendor is moving the SQL Server identity floor — version end-of-support, Extended Security Updates gated behind hybrid management, and NTLM deprecation — on a timeline the agency does not set. The choices that remain (stay on SQL Server, or consolidate onto another engine) and a profile-driven recommendation matrix should be summarized for leadership in a single reference page.

## Division of labor

The organizing principle of the series — what the platform vendor provides versus what only the program can solve — should be captured for every topic in a single reference page.

## Reading sequence

| Book | Title | Focus |
|------|-------|-------|
| [01](book-01-the-inheritance.md) | The Authentication Inheritance Problem | What Windows Authentication actually is, and why it must end |
| [02](book-02-the-estate.md) | The Estate Itself | Assess and consolidate before you touch authentication |
| [03](book-03-authentication-audit.md) | The Authentication Audit | What is actually using Windows Authentication, SQL Authentication, and NTLM |
| [04](book-04-identity-bridge.md) | The Identity Bridge | Hybrid-management attachment and managed identity for the engine |
| [05](book-05-login-migration.md) | Login Migration | Parallel-run of Windows and cloud-identity logins |
| [06](book-06-ntlm-elimination.md) | NTLM Elimination | Silent fallback, service principal name repair, and protocol restriction |
| [07](book-07-access-control.md) | Access Control | Dynamic groups and administrative-unit delegation |
| [08](book-08-upstream-chain.md) | The Upstream Application Chain | Applications that depend on Windows Authentication or LDAP |
| [09](book-09-steady-state.md) | Transformed Steady State | The destination and the milestone |
| [10](book-10-certificate-authority.md) | Certificate-Authority Dependency | The layer the other steps depend on but rarely name |
| [11](book-11-platform-question.md) | The Platform Question | Database consolidation toward SSOT |

## Relationship to attribute-driven structure

This series consumes the organizational-attribute model. Dynamic security groups whose membership rules reference organizational attributes drive SQL Server access without manual database-administrator provisioning. The attribute infrastructure must precede the dynamic-group access work described here.

## Audience

Database engineers who execute the login migrations, infrastructure architects responsible for estate consolidation and hybrid-management sequencing, security engineers who own the Conditional Access design and continuous monitoring, and program leadership who must understand the scope of the engine-layer decision and the consolidation program that precedes it. The series assumes familiarity with SQL Server administration and Active Directory security concepts; familiarity with cloud identity is built progressively across the ten books.

---

*Cleaned extraction for project use. Original diagrams from the source bundle.*
