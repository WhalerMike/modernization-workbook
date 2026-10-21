# Modernization Workbook

> **Provenance:** This workbook is a cleaned derivative of prior internal work. The migration from the source material is complete; the remaining status file (STATUS.md) is excluded from the public site build.

**A clean, standalone modernization project focused on identity, addressing, policy, and governance patterns.**

This repository extracts practical modernization concepts — single source of truth, attribute-driven structure, explicit drift detection, evidence-driven change, and no-rip-and-replace migration — and presents them as a usable project plan and workbook.

![Modernization Principles Overview](docs/images/principles-overview.jpg)

## Start here

| Step | Document | Why |
|------|----------|-----|
| 1 | [How to Use This Repo](docs/books/b00-orientation/02-how-to-use-this-workbook.md) | Orientation for new readers. |
| 2 | [Principles](docs/books/b00-orientation/04-the-principles.md) | The rules. Read this first. |
| 3 | [Project Charter](PROJECT-CHARTER.md) | Purpose, scope, and success criteria. |
| 4 | [Project Plan](PROJECT-PLAN.md) | Phased roadmap and domain workstreams. |
| 5 | [Why Modernization Is Hard](docs/books/b01-transformation-arc/01-why-modernization-is-hard.md) | Leadership framing of the problem. |
| 6 | [Client-Server to Hybrid-Cloud series](docs/books/b01-transformation-arc/index.md) | The eleven-chapter technical narrative. |

## Contents

### Architecture
- [Architecture Series](docs/books/b13-governance/03-one-authoritative-record.md) — six-plane, three-layer rules, drift engine, evidence chain
- [Single Source of Truth](docs/books/b13-governance/03-one-authoritative-record.md)
- [Change Control and Provenance](docs/books/b13-governance/04-change-control-and-provenance.md)
- [Directory Migration Bridge](docs/books/b02-identity/04-the-hidden-migration-surface.md)
- [GPO-to-Cloud Governance Gaps](docs/books/b05-devices/01-why-group-policy-cant-come-to-the-cloud.md)
- [From Attributes to Access (dynamic groups)](docs/books/b03-hr-identity/10-from-attributes-to-access.md)
- [Delegation Matrix](docs/books/b02-identity/05-delegation-without-ous.md)

### Operational Guides
- [Operational Guides index](docs/operational-guides/README.md)
- [GPO Sunset Program](docs/books/b05-devices/07-the-gpo-sunset-program.md)
- [Conditional Access Policy Library](docs/books/b04-access/07-the-conditional-access-policy-library.md)
- [Intune + Azure Arc paths](docs/operational-guides/intune-arc-modernization/)
- [Book 08 — DNS, DHCP & IPAM](docs/books/b08-ddi/index.md)
- [Book 07 — PKI & Certificates](docs/books/b07-pki/index.md)
- [Read-Only AD Assessment](docs/books/b02-identity/07-read-only-discovery.md)

### Case Studies
- [SQL Server Identity Transformation (overview)](docs/books/b06-data-platform/index.md)
- [SQL Server Narrative Series (Books 01–10)](docs/books/b06-data-platform/index.md)
- [HR-Driven Identity: From the HR System of Record to Entra ID](docs/books/b03-hr-identity/index.md)

### Whitepapers
- [Whitepapers index](docs/whitepapers/README.md)

### Compliance
- [Federal Compliance Series – Moderate](docs/compliance/federal-compliance-series-moderate/)

### Program
- [Education, Training, and Test Plans](docs/program/)
- [Executive Briefs](docs/executive-briefs/)
- [Executive Governance Series](docs/executive-governance/)

### Libraries
- [Principles extracts](docs/books/index.md)

## Governance

See [CONTRIBUTING.md](CONTRIBUTING.md) for the quality bar and how to propose changes.

## Status

High-value content extraction and cleaning is complete. Operational guides and architecture items from the remaining-candidate list have been migrated. Full compliance books and large catalogs remain deferred by design.

## Origin

Concepts derived from public modernization materials and restructured for independent use.

---

*For project use. Cleaned for external use.*
