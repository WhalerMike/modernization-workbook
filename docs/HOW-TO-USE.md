# How to Use This Repository

This workbook is a cleaned, standalone modernization project. It presents patterns for identity, addressing, policy, and governance that can be used without prior context from the source materials.

## Who this is for

- Program managers and architects planning a modernization effort
- Teams that need shared language for single source of truth, drift, and attribute-driven structure
- Readers evaluating whether these patterns apply to their environment

## Start here

1. **[Principles](PRINCIPLES.md)** — The rules. Read this first.
2. **[Project Charter](../PROJECT-CHARTER.md)** — Purpose, scope, and success criteria.
3. **[Project Plan](../PROJECT-PLAN.md)** — Phased roadmap and workstreams.
4. **[Why Modernization Is Hard](narratives/why-modernization-is-hard.md)** — Leadership framing.
5. **[Client-Server to Hybrid-Cloud series](client-server-to-hybrid-cloud/README.md)** — The technical narrative.

## How the material is organized

| Section | Purpose | Start with |
|---------|---------|------------|
| Principles | Core rules that apply across domains | [PRINCIPLES.md](PRINCIPLES.md) |
| Architecture | Models for SSOT, drift, attribute structure, control planes | [Architecture series](architecture/architecture-series/README.md) |
| Client-Server series | End-to-end transformation narrative | [Chapter 00](client-server-to-hybrid-cloud/00-the-problem.md) |
| Operational guides | Practical paths for GPO, Intune, DNS, PKI, access | [Operational guides index](operational-guides/README.md) |
| Case studies | Worked examples (SQL Server identity, HRIT) | [SQL Server overview](case-studies/sql-server-identity.md) |
| Whitepapers | Deeper treatment of specific topics | [Whitepapers index](whitepapers/README.md) |
| Compliance | Federal compliance framing (Moderate) | [Compliance overview](compliance/federal-compliance-series-moderate/) |

## What is intentionally deferred

- Full 60-book compliance series (volume overviews are present; individual books remain in source materials)
- Full policy and access catalogs (short principle extracts are in `docs/libraries/`)

## Diagrams

Key diagrams use a white-background illustrated style and are stored under `docs/images/`. SVG versions are preferred for scalability. If a diagram does not match the preferred style, treat the surrounding prose as authoritative.

## Provenance

This workbook is a cleaned derivative of prior internal work. The migration from the source material is complete; the remaining status file (STATUS.md) is excluded from the public site build.

---

*For project use. Cleaned for external readers.*
