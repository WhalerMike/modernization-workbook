# Complete Migration Checklist — UIAO Sitemap to Modernization Workbook

**Source:** https://whalermike.github.io/uiao/sitemap.html  
**Target:** WhalerMike/modernization-workbook  
**Assessment date:** 2026-10-16

## Priority Key
- **P1 — Critical:** Core concepts, executive content, or high-value standalone documents
- **P2 — High:** Supporting architecture, operational patterns, or compliance content
- **P3 — Medium:** Detailed how-to, case studies, or domain-specific content
- **P4 — Low:** Platform-specific, adapter-specific, or UIAO-internal content
- **SKIP:** OrgPath-specific, UIAO-internal, or not suitable for external workbook

## Status Key
- ✅ **Migrated** — Already in modernization-workbook
- ⬜ **Not migrated** — Candidate for migration
- 🚫 **Skip** — Explicitly excluded (OrgPath, UIAO-internal)

---

## 1. Getting Started / Learning
| Item | Priority | Status | Notes |
|------|----------|--------|-------|
| Old AD vs New EntraID — Foundational Reference | P1 | ✅ | docs/learning/ |
| Entra Security Baseline — Federal Crosswalk | P1 | ✅ | docs/learning/ |
| 10-minute quickstart | P4 | 🚫 | UIAO-specific |
| OrgPath governance golden path | P4 | 🚫 | OrgPath |
| Adapter authoring tutorial | P4 | 🚫 | UIAO-internal |
| Substrate status | P4 | 🚫 | UIAO-internal |

## 2. Executive Briefs
| Item | Priority | Status | Notes |
|------|----------|--------|-------|
| Modernization Overview | P1 | ✅ | docs/executive-briefs/ |
| Zero Trust Overview | P1 | ✅ | docs/executive-briefs/ |
| Drift Engine Overview | P1 | ✅ | docs/executive-briefs/ |
| Additional executive briefs | P2 | ⬜ | Assess remaining |

## 3. Whitepapers
| Item | Priority | Status | Notes |
|------|----------|--------|-------|
| AD to Entra ID Migration Problem | P1 | ✅ | docs/whitepapers/ |
| Modernization Journey | P1 | ✅ | docs/whitepapers/ |
| Hybrid Join Without Governance | P1 | ✅ | docs/whitepapers/ |
| Session vs Telemetry | P1 | ✅ | docs/whitepapers/ |
| Network Transport and Governance | P1 | ✅ | docs/whitepapers/ |
| Federal Compliance for Moderate Agencies | P1 | ✅ | docs/whitepapers/ |
| Zero Trust Governance Principles | P1 | ✅ | docs/whitepapers/ |
| Federal SSOT Alignment | P1 | ✅ | docs/whitepapers/ |
| TIC 3.0 SD-WAN vs DIA | P1 | ✅ | docs/whitepapers/ |
| Ticket-to-Machine | P1 | ✅ | docs/whitepapers/ |
| AODIM Executive Whitepaper | P1 | ✅ | docs/whitepapers/ |
| Next Generation DNS | P1 | ✅ | docs/whitepapers/ |
| Next Generation DDI (full) | P1 | ✅ | docs/whitepapers/next-generation-ddi.md |
| Remaining whitepapers | P2 | ⬜ | Assess full list |

## 4. Architecture Series
| Item | Priority | Status | Notes |
|------|----------|--------|-------|
| Six-Plane Architecture | P1 | ✅ | docs/architecture/architecture-series/ |
| Three-Layer Rule Model | P1 | ✅ | docs/architecture/architecture-series/ |
| Drift Engine | P1 | ✅ | docs/architecture/architecture-series/ |
| Evidence Chain | P1 | ✅ | docs/architecture/architecture-series/ |
| Attribute-Driven Structure | P1 | ✅ | docs/architecture/ |
| Single Source of Truth | P1 | ✅ | docs/architecture/ |
| Where Data Lives | P1 | ✅ | docs/architecture/ |
| Drift Detection | P1 | ✅ | docs/architecture/ |
| Directory Migration (8 concepts) | P1 | ✅ | docs/architecture/directory-migration/ |

## 5. Client-Server to Hybrid-Cloud Narrative
| Item | Priority | Status | Notes |
|------|----------|--------|-------|
| Full series (Chapters 00–10) | P1 | ✅ | docs/client-server-to-hybrid-cloud/ |
| Why Modernization is Hard | P1 | ✅ | docs/narratives/ |

## 6. Executive Governance Series
| Item | Priority | Status | Notes |
|------|----------|--------|-------|
| Full 9-chapter series | P1 | ✅ | docs/executive-governance-series/ |

## 7. Federal Compliance Series — Moderate
| Item | Priority | Status | Notes |
|------|----------|--------|-------|
| Series overview + executive brief/summary | P1 | ✅ | docs/compliance/federal-compliance-series-moderate/ |
| Volumes I–X (overviews) | P1 | ✅ | Volume overviews migrated |
| Full 60-book detail | P3 | ⬜ | High volume; selective migration |
| OrgComp legacy paths | — | ✅ | Redirects created |

## 8. Case Studies
| Item | Priority | Status | Notes |
|------|----------|--------|-------|
| SQL Server Identity Transformation (10 books) | P1 | ✅ | docs/case-studies/sql-server-narrative/ |
| SQL Server Identity (summary) | P1 | ✅ | docs/case-studies/ |
| AD to Cloud Identity Reference | P2 | ✅ | docs/case-studies/ |
| HRIT to Cloud Identity Reference | P2 | ✅ | docs/case-studies/ |
| Cloud Boundary | P2 | ✅ | docs/case-studies/ |
| Federal Modernization | P2 | ✅ | docs/case-studies/ |
| Identity Modernization | P2 | ✅ | docs/case-studies/ |
| Remaining case studies | P3 | ⬜ | Assess |

## 9. Modernization Specs
| Item | Priority | Status | Notes |
|------|----------|--------|-------|
| Identity, Zero Trust, Telemetry, Cloud, SASE, SD-WAN | P1 | ✅ | docs/modernization-specs/ |

## 10. Principles
| Item | Priority | Status | Notes |
|------|----------|--------|-------|
| PRINCIPLES.md (16 principles) | P1 | ✅ | docs/PRINCIPLES.md |

## 11. Operational Guides — Candidates
| Item | Priority | Status | Notes |
|------|----------|--------|-------|
| DNS Modernization Guide | P2 | ⬜ | Network services content |
| PKI Modernization Guide | P2 | ⬜ | Certificate/identity |
| GPO Sunset Program | P2 | ⬜ | Policy transformation |
| Intune + Azure Arc (Manual/Governed/Retrofit) | P2 | ⬜ | Device/server paths |
| Conditional Access Policy Library | P2 | ⬜ | Access plane |
| PIM Self-Request patterns | P2 | ⬜ | Privileged access |
| Read-Only AD Assessment Guide | P2 | ⬜ | Estate analysis |
| Master Project Plan | P2 | ⬜ | Program management |
| Zero Trust Assessment Dashboard | P2 | ⬜ | Continuous monitoring |
| M365 Optimize Inspection Exemption | P3 | ⬜ | TIC/network decision |
| Federal AI Identity Governance | P3 | ⬜ | Emerging domain |
| Help Desk / Entra Operations | P3 | ⬜ | Operational |
| Active Governance Directory Guide | P3 | ⬜ | |
| End User Training Guide | P3 | ⬜ | |
| OrgPath Implementation Guides (1–7) | P4 | 🚫 | OrgPath-specific |

## 12. Reference Architecture — Candidates
| Item | Priority | Status | Notes |
|------|----------|--------|-------|
| GPO-to-Cloud Governance Gaps | P2 | ⬜ | Policy transformation |
| Drift Detection Walk-through | P2 | ⬜ | |
| Intune-First Asset Onboarding | P2 | ⬜ | |
| Dynamic Group Library | P2 | ⬜ | Attribute model |
| Delegation Matrix | P2 | ⬜ | |
| Where Data Lives (Devices/Azure) | P2 | ⬜ | |
| OrgTree / LocPath / OrgPath FAQ | P4 | 🚫 | OrgPath |
| Hybrid OrgPath Model | P4 | 🚫 | OrgPath |
| OrgPath Portability | P4 | 🚫 | OrgPath |
| OrgPath Codebook | P4 | 🚫 | OrgPath |
| OrgPath Minimal Implementation | P4 | 🚫 | OrgPath |

## 13. Canonical Specs — Candidates
| Item | Priority | Status | Notes |
|------|----------|--------|-------|
| Identity & Directory Transformation Inventory | P2 | ⬜ | |
| Gap Closure Register | P2 | ⬜ | |
| Continuous Monitoring Strategy | P2 | ⬜ | |
| Governance Platform Coverage & Gap Doctrine | P2 | ⬜ | |
| GPO Modernization (Parse/Crosswalk) | P2 | ⬜ | |
| System Security Plan Template | P3 | ⬜ | Compliance artifact |
| Incident Response Plan | P3 | ⬜ | |
| POA&M Template | P3 | ⬜ | |
| Supply Chain Risk Management Plan | P3 | ⬜ | |
| Privacy Impact Assessment | P3 | ⬜ | |
| Security Awareness & Training | P3 | ⬜ | |
| Personnel Security Program | P3 | ⬜ | |
| SCuBA Technical Specification | P4 | 🚫 | UIAO-specific |
| Adapter Segmentation Overview | P4 | 🚫 | UIAO-internal |
| Module Specifications (IdentityAssessment, etc.) | P4 | 🚫 | UIAO-internal |
| OrgPath in NAC/802.1X | P4 | 🚫 | OrgPath |

## 14. OrgPath Narrative (Books 12–29+)
| Item | Priority | Status | Notes |
|------|----------|--------|-------|
| All OrgPath Narrative books | P4 | 🚫 | Explicitly skipped per user direction |
| Book 14 (DDI platforms) | P3 | ⬜ | Extract DDI concepts only if non-OrgPath |

## 15. SQL Server Narrative
| Item | Priority | Status | Notes |
|------|----------|--------|-------|
| Full 10-book series | P1 | ✅ | Migrated |

## 16. Academy / Contributor Paths
| Item | Priority | Status | Notes |
|------|----------|--------|-------|
| All Academy tracks | P4 | 🚫 | UIAO-internal training |

## 17. Platform / Substrate / Adapters
| Item | Priority | Status | Notes |
|------|----------|--------|-------|
| Platform runbooks | P4 | 🚫 | UIAO-internal |
| Substrate docs | P4 | 🚫 | UIAO-internal |
| Adapter specs | P4 | 🚫 | UIAO-internal |
| Validation suites | P4 | 🚫 | UIAO-internal |

## 18. Findings / Security Findings
| Item | Priority | Status | Notes |
|------|----------|--------|-------|
| Governance Findings | P4 | 🚫 | UIAO-specific |

---

## Summary Counts

| Category | Migrated | Remaining Candidates | Skip |
|----------|----------|----------------------|------|
| Learning / Getting Started | 2 | 0 | 4 |
| Executive Briefs | 3 | TBD | 0 |
| Whitepapers | 13 | TBD | 0 |
| Architecture | 12+ | 0 | 0 |
| Client-Server Series | 11 | 0 | 0 |
| Executive Governance | 9 | 0 | 0 |
| Compliance Series | 13 | High-volume detail | 0 |
| Case Studies | 8+ | TBD | 0 |
| Modernization Specs | 6 | 0 | 0 |
| Principles | 1 | 0 | 0 |
| Operational Guides | 0 | ~15 | ~7 |
| Reference Architecture | 0 | ~6 | ~5 |
| Canonical Specs | 0 | ~10 | ~6 |
| OrgPath Narrative | 0 | 0 | All |
| Academy / Platform / Adapters | 0 | 0 | All |

**Total high-priority items already migrated:** ~70+  
**Remaining P1/P2 candidates:** ~30–40 (mostly operational guides and reference architecture)  
**Explicitly skipped:** All OrgPath, UIAO-internal, Academy, Platform, Adapter content

---

*Checklist generated from full sitemap assessment. Priority reflects external usability and alignment with modernization workbook goals (SSOT, drift, attribute models, no-rip-and-replace, governed modernization).*
