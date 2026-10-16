# Migration Execution Plan — Remaining P1/P2 Candidates

**Repository:** WhalerMike/modernization-workbook  
**Source:** https://whalermike.github.io/uiao/  
**Plan date:** 2026-10-16

## Objective
Migrate remaining high-value documents from the UIAO site into the modernization workbook as cleaned, externally usable Markdown, preserving technical substance while removing internal branding.

## Execution Principles
1. One batch at a time; verify before starting the next
2. Clean all UIAO, OrgPath, OrgComp, OrgMod, and ADR references before commit
3. Update the relevant section index after each document or small group
4. Mark status in MIGRATION-CHECKLIST-FULL.md after each completed item
5. Prefer structure and decision points over product-specific implementation detail

---

## Batch A — Policy and Drift Foundation
**Goal:** Complete the policy transformation story and give a concrete drift example.

| # | Document | Source | Target | Action |
|---|----------|--------|--------|--------|
| 1 | GPO-to-Cloud Governance Gaps | reference-architecture/gpo-cloud-governance-gaps.html | docs/architecture/gpo-to-cloud-governance-gaps.md | Extract, clean, commit |
| 2 | GPO Sunset Program | operational-guides/target-surface/intune-policy-templates.html | docs/operational-guides/gpo-sunset-program.md | Extract, clean, commit |
| 3 | Drift Detection Walk-through | reference-architecture/drift-walkthrough.html | docs/architecture/drift-detection-walkthrough.md | Extract, clean, commit |

**Exit criteria:** All three files present, indexes updated, no residual branding, checklist marked.

---

## Batch B — Access and Device Paths
**Goal:** Fill the access-plane and device/server modernization gaps.

| # | Document | Source | Target | Action |
|---|----------|--------|--------|--------|
| 4 | Conditional Access Policy Library | operational-guides/access-plane/conditional-access-library.html | docs/operational-guides/conditional-access-policy-library.md | Extract, clean, commit |
| 5 | Intune + Azure Arc (3 paths) | operational-guides/intune-arc-modernization/ | docs/operational-guides/intune-arc-modernization/ | Extract index + 3 paths, clean, commit |
| 6 | Intune-First Asset Onboarding | reference-architecture/intune-first.html | docs/architecture/intune-first-onboarding.md | Extract, clean, commit |

**Exit criteria:** Access and device content available without OrgPath dependency framing.

---

## Batch C — Network and PKI
**Goal:** Complement the DDI whitepaper and SQL Server CA content.

| # | Document | Source | Target | Action |
|---|----------|--------|--------|--------|
| 7 | DNS Modernization Guide | operational-guides/network-transformation/dns-modernization.html | docs/operational-guides/dns-modernization.md | Extract, clean, commit |
| 8 | PKI Modernization Guide | operational-guides/pki-modernization.html | docs/operational-guides/pki-modernization.md | Extract, clean, commit |

**Exit criteria:** Network and PKI operational guidance present and linked from relevant chapters.

---

## Batch D — Assessment and Structure
**Goal:** Add practical assessment and structure artifacts.

| # | Document | Source | Target | Action |
|---|----------|--------|--------|--------|
| 9 | Read-Only AD Assessment Guide | operational-guides/read-only-ad-assessment.html | docs/operational-guides/read-only-ad-assessment.md | Extract, clean, commit |
| 10 | Dynamic Group Library | reference-architecture/dynamic-groups.html | docs/architecture/dynamic-group-library.md | Extract, clean, commit |
| 11 | Where Data Lives (Devices/Azure) | reference-architecture/where-data-lives-devices-and-azure.html | docs/architecture/where-data-lives-devices-azure.md | Extract, clean, commit |
| 12 | Identity & Directory Transformation Inventory | canon/UIAO_135_...html | docs/architecture/identity-directory-transformation-inventory.md | Extract, clean, commit |

**Exit criteria:** Assessment and structure documents available for use alongside existing architecture content.

---

## Batch E — Supporting Content
**Goal:** Add operational and compliance supporting documents.

| # | Document | Target |
|---|----------|--------|
| 13 | PIM Self-Request with Approval | docs/operational-guides/pim-self-request-approval.md |
| 14 | Zero Trust Assessment Dashboard | docs/operational-guides/zero-trust-assessment.md |
| 15 | Master Project Plan | docs/project-management/master-project-plan.md |
| 16 | Delegation Matrix | docs/architecture/delegation-matrix.md |
| 17 | Gap Closure Register | docs/architecture/gap-closure-register.md |
| 18 | Continuous Monitoring Strategy | docs/compliance/continuous-monitoring-strategy.md |
| 19 | Governance Platform Coverage & Gap Doctrine | docs/architecture/governance-platform-coverage-gap-doctrine.md |
| 20 | GPO Modernization — Parse, Crosswalk | docs/operational-guides/gpo-modernization-parse-crosswalk.md |

**Exit criteria:** Supporting documents present; indexes updated.

---

## Batch F — Inventory and Selective Migration
**Goal:** Confirm nothing high-value remains.

1. Inventory remaining whitepapers under `/customer-documents/whitepapers/`
2. Inventory remaining executive briefs under `/customer-documents/executive-briefs/`
3. Migrate only unique, externally valuable items
4. For Compliance Series, extract individual books only on specific request

---

## Per-Document Workflow
1. Fetch source page content
2. Convert to Markdown
3. Remove UIAO / OrgPath / OrgComp / OrgMod / ADR language
4. Adjust framing for external audience
5. Place in target path
6. Update section README or index if one exists
7. Commit with descriptive message
8. Mark complete in MIGRATION-CHECKLIST-FULL.md

## Tracking
- Primary tracker: `MIGRATION-CHECKLIST-FULL.md`
- Detailed source/target map: `MIGRATION-PLAN-REMAINING.md`
- This execution plan: `MIGRATION-EXECUTION-PLAN.md`

## Success Criteria
- All Tier 1 and Tier 2 items migrated and cleaned
- No residual internal branding in migrated files
- Indexes and cross-references updated
- Workbook remains usable as a standalone modernization project

---

*Execute Batch A first. Reassess after Batch C before continuing to Batch E.*
