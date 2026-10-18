# Modernization Workbook

> **Provenance:** This workbook is a cleaned derivative of prior internal work. The migration from the source material is complete; the remaining status file (STATUS.md) is excluded from the public site build.

**A clean, standalone modernization project focused on identity, addressing, policy, and governance patterns.**

This repository extracts practical modernization concepts — single source of truth, attribute-driven structure, explicit drift detection, evidence-driven change, and no-rip-and-replace migration — and presents them as a usable project plan and workbook.

![Modernization Principles Overview](docs/images/principles-overview.jpg)

## Start here

| Step | Document | Why |
|------|----------|-----|
| 1 | [How to Use This Repo](docs/HOW-TO-USE.md) | Orientation for new readers. |
| 2 | [Principles](docs/PRINCIPLES.md) | The rules. Read this first. |
| 3 | [Project Charter](PROJECT-CHARTER.md) | Purpose, scope, and success criteria. |
| 4 | [Project Plan](PROJECT-PLAN.md) | Phased roadmap and domain workstreams. |
| 5 | [Why Modernization Is Hard](docs/client-server-to-hybrid-cloud/00-prologue-why-modernization-is-hard.md) | Leadership framing of the problem. |
| 6 | [Client-Server to Hybrid-Cloud series](docs/client-server-to-hybrid-cloud/README.md) | The eleven-chapter technical narrative. |

## Contents

### Architecture
- [Architecture Series](docs/architecture/architecture-series/README.md) — six-plane, three-layer rules, drift engine, evidence chain
- [Single Source of Truth](docs/architecture/single-source-of-truth.md)
- [Change Control and Provenance](docs/architecture/change-control-and-provenance.md)
- [Directory Migration Bridge](docs/reference-architecture/directory-migration.md)
- [GPO-to-Cloud Governance Gaps](docs/architecture/gpo-to-cloud-governance-gaps.md)
- [Dynamic Group Library](docs/architecture/dynamic-group-library.md)
- [Delegation Matrix](docs/architecture/delegation-matrix.md)

### Operational Guides
- [Operational Guides index](docs/operational-guides/README.md)
- [GPO Sunset Program](docs/operational-guides/gpo-sunset-program.md)
- [Conditional Access Policy Library](docs/operational-guides/conditional-access-policy-library.md)
- [Intune + Azure Arc paths](docs/operational-guides/intune-arc-modernization/)
- [DNS Modernization](docs/operational-guides/dns-modernization.md)
- [PKI Modernization](docs/operational-guides/pki-modernization.md)
- [Read-Only AD Assessment](docs/operational-guides/read-only-ad-assessment.md)

### Case Studies
- [SQL Server Identity Transformation (overview)](docs/case-studies/sql-server-identity.md)
- [SQL Server Narrative Series (Books 01–10)](docs/case-studies/sql-server-narrative/README.md)
- [HRIT to Entra reference deployment](docs/case-studies/hrit-to-entra-reference-deployment.md)

### Whitepapers
- [Whitepapers index](docs/whitepapers/README.md)

### Compliance
- [Federal Compliance Series – Moderate](docs/compliance/federal-compliance-series-moderate/)

### Program
- [Education, Training, and Test Plans](docs/program/)
- [Executive Briefs](docs/executive-briefs/)
- [Executive Governance Series](docs/executive-governance/)

### Libraries
- [Principles extracts](docs/libraries/README.md)

## Governance

See [CONTRIBUTING.md](CONTRIBUTING.md) for the quality bar and how to propose changes.

## Status

High-value content extraction and cleaning is complete. Operational guides and architecture items from the remaining-candidate list have been migrated. Full compliance books and large catalogs remain deferred by design.

## Origin

Concepts derived from public modernization materials and restructured for independent use.

---

*For project use. Cleaned for external use.*
