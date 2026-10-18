# Book 02 — The Estate Itself

**Assess and consolidate before you touch authentication**

## The shape of twenty years

You do not migrate the estate in the shape you discover it. After twenty years across an Active Directory forest, the SQL Server estate is larger, older, and more entangled than any single team’s mental model of it — and a meaningful fraction of it should not survive the transformation in its current shape.

The order matters because effort is finite and each release narrows the window. Migrating the logins of an instance to Entra ID, only to retire that instance three months later, is wasted work that also delays the instances that most need attention. The consolidation assessment classifies every instance **retain**, **consolidate**, or **retire** before any login is touched.

![The estate is measured and reduced before any login moves.](../../images/sql-server/diagrams/svg/book-02-assess-before-migrating.svg){fig-alt="Discover the real estate, rationalize it and classify each instance; retained instances and consolidation targets go on to migration, while retired instances and consolidated sources do not."}

## Instance sprawl

A SQL Server estate does not grow by design. It grows by accretion. A development instance becomes a production instance because a project shipped and nobody rebuilt it on the production tier. A test instance set up for a vendor evaluation is never decommissioned. An application installer drops a named instance on an application server and the instance is never inventoried. A linked server created for a one-time data load remains in place for a decade.

The result is an estate that contains instances nobody owns, databases nobody queries, and linked-server chains that cross domain boundaries the directory modernization program intends to remove. An authentication transformation that begins before this sprawl is assessed will migrate the authentication of servers that should not survive the transformation at all.

## The three forcing functions

Three independent pressures are converging. None of them, on its own, is a flag-day switch; together they make “stay fully on-premises, Active-Directory-anchored, never touch Arc, keep Windows Authentication” progressively untenable.

| # | Forcing function | What it is | What it forces |
| --- | --- | --- | --- |
| 1 | Version end-of-support | Each SQL Server version carries roughly five years of mainstream + five years of extended support, after which security updates stop. | A version upgrade — not Arc by itself. An out-of-support engine receives no patches and becomes an audit and ATO liability. |
| 2 | ESU gated behind Azure Arc | Past end-of-support, Extended Security Updates keep critical patches flowing. The streamlined, pay-as-you-go ESU path is delivered and billed through Azure Arc. | Arc enablement as the practical price of staying patched on an out-of-support version. |
| 3 | NTLM deprecation | Microsoft is actively deprecating NTLM and hardening defaults toward Kerberos. SQL Server’s silent NTLM fallback breaks when NTLM is blocked network-wide. | A move off Windows Authentication’s NTLM fallback toward Kerberos and ultimately Entra token authentication. |

## Forced versus chosen

The forced part is an authentication-layer change; the chosen part is a platform-layer change. They are sequenced, not simultaneous — and the authentication work comes first regardless of the destination, because it is what produces the rationalized estate inventory that scopes any platform move.

**Forced (the floor moves regardless of what you decide):**
- Move off NTLM and off Windows Authentication’s silent NTLM fallback.
- Move off end-of-support engine versions — patch or leave the version.
- If you stay on an out-of-support version, Arc enablement becomes the practical path to keep receiving Extended Security Updates.

**Chosen (yours to decide):**
- Where you land — stay on SQL Server, or consolidate onto PostgreSQL or Oracle.
- How far you consolidate — re-authenticate the silos in place, or dissolve them toward a single authoritative database.
- Your timeline within the forced windows — which instances move first.

## What Book 02 establishes

The estate must be measured and rationalized before authentication is touched. Instance sprawl, database sprawl, and forest entanglement accumulate over two decades. The consolidation assessment classifies every instance retain, consolidate, or retire. Effort spent migrating the authentication of an instance that will be retired is wasted effort. The inventory that Book 03 audits is the inventory that Book 02 has already rationalized.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
