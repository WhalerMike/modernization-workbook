# Detailed Migration Plan — Remaining P1/P2 Candidates

**Target repository:** WhalerMike/modernization-workbook  
**Source:** https://whalermike.github.io/uiao/  
**Date:** 2026-10-16

## Guiding Rules
- Remove all UIAO, OrgPath, OrgComp, OrgMod, and ADR references
- Preserve technical substance; rewrite internal framing as external guidance
- Place documents in logical workbook sections
- Update indexes after each batch
- Prefer Markdown; extract images where they add value

---

## Tier 1 — Highest Leverage

### 1. GPO-to-Cloud Governance Gaps
| Field | Value |
|-------|-------|
| Source | `/customer-documents/reference-architecture/gpo-cloud-governance-gaps.html` |
| Target | `docs/architecture/gpo-to-cloud-governance-gaps.md` |
| Cleaning | Remove OrgPath framing; present as general GPO-to-cloud gap analysis |
| Dependencies | Complements existing policy transformation chapter |
| Effort | Low–Medium |

### 2. GPO Sunset Program
| Field | Value |
|-------|-------|
| Source | `/customer-documents/operational-guides/target-surface/intune-policy-templates.html` |
| Target | `docs/operational-guides/gpo-sunset-program.md` |
| Cleaning | Remove UIAO-specific templates; keep phase structure and decision points |
| Dependencies | Pairs with #1 |
| Effort | Medium |

### 3. Conditional Access Policy Library
| Field | Value |
|-------|-------|
| Source | `/customer-documents/operational-guides/access-plane/conditional-access-library.html` |
| Target | `docs/operational-guides/conditional-access-policy-library.md` |
| Cleaning | Strip UIAO policy naming; retain evaluation patterns and additive model |
| Dependencies | Supports access plane chapter |
| Effort | Medium |

### 4. Intune + Azure Arc (Manual / Governed / Retrofit)
| Field | Value |
|-------|-------|
| Source | `/customer-documents/operational-guides/intune-arc-modernization/` (index + 3 paths) |
| Target | `docs/operational-guides/intune-arc-modernization/` (README + 3 path files) |
| Cleaning | Remove OrgPath as required path; present governed path as optional attribute-driven approach |
| Dependencies | Device and server transformation content |
| Effort | Medium–High |

### 5. DNS Modernization Guide
| Field | Value |
|-------|-------|
| Source | `/customer-documents/operational-guides/network-transformation/dns-modernization.html` |
| Target | `docs/operational-guides/dns-modernization.md` |
| Cleaning | Remove OrgPath/DDI product lock-in; keep resolution path and split-brain patterns |
| Dependencies | Complements Next Generation DDI whitepaper |
| Effort | Medium |

### 6. PKI Modernization Guide
| Field | Value |
|-------|-------|
| Source | `/customer-documents/operational-guides/pki-modernization.html` |
| Target | `docs/operational-guides/pki-modernization.md` |
| Cleaning | Remove UIAO-specific certificate flows; retain ADCS-to-cloud and OCSP/CRL consistency |
| Dependencies | Complements SQL Server CA book and identity content |
| Effort | Medium |

---

## Tier 2 — High Value, Clear Placement

### 7. Drift Detection Walk-through
| Field | Value |
|-------|-------|
| Source | `/customer-documents/reference-architecture/drift-walkthrough.html` |
| Target | `docs/architecture/drift-detection-walkthrough.md` |
| Cleaning | Remove OrgPath-specific examples; keep detection loop and evidence steps |
| Dependencies | Extends existing drift engine and drift detection docs |
| Effort | Low |

### 8. Read-Only AD Assessment Guide
| Field | Value |
|-------|-------|
| Source | `/customer-documents/operational-guides/read-only-ad-assessment.html` |
| Target | `docs/operational-guides/read-only-ad-assessment.md` |
| Cleaning | Remove UIAO tooling references; keep assessment categories and safety constraints |
| Dependencies | Supports Client-Server estate analysis chapter |
| Effort | Low–Medium |

### 9. Intune-First Asset Onboarding
| Field | Value |
|-------|-------|
| Source | `/customer-documents/reference-architecture/intune-first.html` |
| Target | `docs/architecture/intune-first-onboarding.md` |
| Cleaning | Remove OrgPath as prerequisite; present as day-zero governance pattern |
| Dependencies | Device modernization content |
| Effort | Low–Medium |

### 10. Dynamic Group Library
| Field | Value |
|-------|-------|
| Source | `/customer-documents/reference-architecture/dynamic-groups.html` |
| Target | `docs/architecture/dynamic-group-library.md` |
| Cleaning | Remove OrgPath attribute names; keep rule patterns and evaluation model |
| Dependencies | Supports attribute-driven structure document |
| Effort | Low–Medium |

### 11. Where Data Lives (Devices and Azure Resources)
| Field | Value |
|-------|-------|
| Source | `/customer-documents/reference-architecture/where-data-lives-devices-and-azure.html` |
| Target | `docs/architecture/where-data-lives-devices-azure.md` |
| Cleaning | Remove OrgPath/OrgTree; keep data-location taxonomy for devices and Azure resources |
| Dependencies | Extends existing Where Data Lives document |
| Effort | Low |

### 12. Identity & Directory Transformation Inventory
| Field | Value |
|-------|-------|
| Source | `/canon/UIAO_135_identity-directory-transformation-inventory.html` |
| Target | `docs/architecture/identity-directory-transformation-inventory.md` |
| Cleaning | Remove UIAO branding; keep inventory categories and transformation mapping |
| Dependencies | Supports identity transformation chapter |
| Effort | Medium |

---

## Tier 3 — Useful but Lower Urgency

### 13. PIM Self-Request with Approval
| Field | Value |
|-------|-------|
| Source | `/customer-documents/operational-guides/access-plane/pim-self-request-approval.html` |
| Target | `docs/operational-guides/pim-self-request-approval.md` |
| Cleaning | Remove UIAO workflow specifics; keep approval pattern and evidence requirements |
| Effort | Low |

### 14. Zero Trust Assessment Dashboard
| Field | Value |
|-------|-------|
| Source | `/customer-documents/operational-guides/zero-trust-assessment/index.html` |
| Target | `docs/operational-guides/zero-trust-assessment.md` |
| Cleaning | Remove UIAO dashboard implementation; keep maturity dimensions and evidence sources |
| Effort | Medium |

### 15. Master Project Plan
| Field | Value |
|-------|-------|
| Source | `/customer-documents/operational-guides/program-management/master-project-plan.html` |
| Target | `docs/project-management/master-project-plan.md` |
| Cleaning | Remove UIAO phase names; keep structure, gates, and deliverables |
| Effort | Medium |

### 16. Delegation Matrix
| Field | Value |
|-------|-------|
| Source | `/customer-documents/reference-architecture/delegation.html` |
| Target | `docs/architecture/delegation-matrix.md` |
| Cleaning | Remove OrgPath roles; keep delegation principles and scope model |
| Effort | Low |

### 17. Gap Closure Register
| Field | Value |
|-------|-------|
| Source | `/canon/UIAO_184_Gap_Closure_Register.html` |
| Target | `docs/architecture/gap-closure-register.md` |
| Cleaning | Remove UIAO-specific gaps; keep register structure and residual-risk framing |
| Effort | Low–Medium |

### 18. Continuous Monitoring Strategy
| Field | Value |
|-------|-------|
| Source | `/canon/UIAO_190_Continuous_Monitoring_Strategy.html` |
| Target | `docs/compliance/continuous-monitoring-strategy.md` |
| Cleaning | Remove UIAO telemetry specifics; keep monitoring objectives and evidence cadence |
| Effort | Medium |

### 19. Governance Platform Coverage & Gap Doctrine
| Field | Value |
|-------|-------|
| Source | `/canon/UIAO_015_Governance_Platform_Coverage_And_Gap_Doctrine_v1.0.html` |
| Target | `docs/architecture/governance-platform-coverage-gap-doctrine.md` |
| Cleaning | Remove UIAO positioning; keep coverage model and gap classification |
| Effort | Medium |

### 20. GPO Modernization — Parse, Crosswalk, Join
| Field | Value |
|-------|-------|
| Source | `/canon/UIAO_014_GPO_Modernization_Parse_Crosswalk_OrgPath_Join_v1.0.html` |
| Target | `docs/operational-guides/gpo-modernization-parse-crosswalk.md` |
| Cleaning | Remove OrgPath join step; keep parse and crosswalk method |
| Effort | Medium |

---

## Tier 4 — Assess Before Committing

### 21. Remaining Whitepapers
- Inventory full whitepaper list from `/customer-documents/whitepapers/`
- Compare against already-migrated set
- Migrate only those with unique external value
- Target: `docs/whitepapers/`

### 22. Additional Executive Briefs
- Inventory full executive brief list from `/customer-documents/executive-briefs/`
- Migrate only those not already covered
- Target: `docs/executive-briefs/`

### 23. Full 60-Book Compliance Series Detail
- Volume overviews already migrated
- Extract individual books only when a specific control area or implementation pattern is needed
- Target: `docs/compliance/federal-compliance-series-moderate/` (subfolders by volume)

---

## Execution Sequence

| Batch | Items | Estimated Effort | Output |
|-------|-------|------------------|--------|
| Batch A | 1, 2, 7 | Low–Medium | Policy and drift foundation |
| Batch B | 3, 4, 9 | Medium–High | Access and device paths |
| Batch C | 5, 6 | Medium | Network and PKI |
| Batch D | 8, 10, 11, 12 | Low–Medium | Assessment and structure |
| Batch E | 13–20 | Medium | Supporting operational and compliance content |
| Batch F | 21–23 | Variable | Inventory-driven selective migration |

## Post-Migration Checklist
- [ ] Update relevant section README indexes
- [ ] Remove residual UIAO/OrgPath/ADR language
- [ ] Verify internal links point to workbook paths
- [ ] Update MIGRATION-CHECKLIST-FULL.md status
- [ ] Confirm no broken image references

---

*Plan covers all remaining P1/P2 candidates from the sitemap assessment. Execute in batches; reassess after Batch C.*
