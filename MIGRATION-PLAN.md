# Migration Plan and Checklist

**Purpose:** Extract and clean high-value modernization content from the original repository into this project so it can be used as standalone project guidance. No UIAO, OrgPath, OrgComp, OrgMod, ADR numbers, or internal document identifiers in the finished artifacts.

**Source repository:** `WhalerMike/uiao`  
**Target repository:** `WhalerMike/modernization-workbook`  
**Public reference site:** https://whalermike.github.io/uiao/orgmod/

---

## Guiding Rules

- Preserve technical and programmatic substance.
- Remove all branding (UIAO, Org*, substrate, canon document IDs).
- Remove internal cross-references and promotional sections.
- Generalize platform-specific language only where it does not lose meaning.
- Place cleaned material under `docs/` in a clear structure.
- Prefer one cleaned document per original major topic unless splitting improves usability.

---

## Already Completed

| Item | Destination | Status |
|------|-------------|--------|
| Client-Server to Hybrid-Cloud series (Chapters 00–10) | `docs/client-server-to-hybrid-cloud/` | Done |
| Project Charter | `PROJECT-CHARTER.md` | Done |
| Project Plan | `PROJECT-PLAN.md` | Done |
| Why Modernization Is Hard narrative | `docs/narratives/why-modernization-is-hard.md` | Done |

---

## Priority 1 — High-leverage, relatively self-contained

### 1.1 Whitepapers
**Sources:**
- `docs/customer-documents/whitepapers/ad-to-entraid-migration-problem.qmd`
- `docs/customer-documents/whitepapers/modernization-journey.qmd`
- `docs/customer-documents/whitepapers/hybrid-join-without-governance.qmd`
- `docs/customer-documents/whitepapers/reading-guide.qmd` (selectively)

**Target:** `docs/whitepapers/`

**Checklist:**
- [ ] Pull each source file
- [ ] Strip frontmatter branding and internal IDs
- [ ] Remove Org* / UIAO references; rephrase as “framework” or “governed approach”
- [ ] Preserve argument, diagrams (Mermaid), and tables
- [ ] Commit cleaned versions
- [ ] Add short index in `docs/whitepapers/README.md`

### 1.2 Directory Migration Bridge
**Sources:**
- `docs/customer-documents/reference-architecture/directory-migration.qmd`
- Supporting files under `src/uiao/modernization/directory-migration/` (eight core concepts, AD dependency inventory)
- Operational guides under `docs/customer-documents/operational-guides/directory-migration/`

**Target:** `docs/architecture/directory-migration/`

**Checklist:**
- [ ] Pull reference-architecture page and supporting markdown
- [ ] Extract eight core concepts into a clean document
- [ ] Extract AD dependency inventory (eleven categories)
- [ ] Strip adapter document IDs (DM_*) and replace with descriptive names
- [ ] Commit under `docs/architecture/directory-migration/`
- [ ] Cross-link from series Chapter 00 and Chapter 02 where appropriate

### 1.3 MACD-R / Change Control and Provenance Doctrine
**Source:** OrgComp Vol 0 Book 00 sections on MACD-R lifecycle and SSOT Registry (referenced from OrgMod hub)

**Target:** `docs/architecture/change-control-and-provenance.md`

**Checklist:**
- [ ] Locate the five-clause path (originate from SSOT → authorize → least-privilege execution → provenance closure → evidence)
- [ ] Extract and rewrite without OrgComp / UIAO framing
- [ ] Include non-human class SSOTs (devices, infrastructure, human owner requirement)
- [ ] Commit as a standalone doctrine page
- [ ] Reference from Project Plan and series Chapter 03

---

## Priority 2 — Valuable but more tightly coupled

### 2.1 Attribute-Driven Structure Reference Set
**Sources:**
- `docs/customer-documents/reference-architecture/orgtree.qmd`
- `codebook.qmd`
- `dynamic-groups.qmd`
- `delegation.qmd`
- `hybrid-orgpath-model.qmd` (selectively)

**Target:** `docs/architecture/attribute-driven-structure/`

**Checklist:**
- [ ] Clean and combine into a coherent reference (or keep as separate short pages)
- [ ] Replace OrgPath / OrgTree with “coded organizational attributes” / “attribute-driven structure”
- [ ] Preserve the three query patterns, administrative-unit model, and HR lifecycle
- [ ] Commit and link from series Chapter 04

### 2.2 Intune + Azure Arc Modernization
**Source:** `docs/customer-documents/operational-guides/intune-arc-modernization/`

**Target:** `docs/guides/device-and-server-modernization/`

**Checklist:**
- [ ] Inventory chapters / pages
- [ ] Strip OrgPath-governed framing; keep runnable patterns
- [ ] Commit cleaned set
- [ ] Link from series Chapters 05 and 07

### 2.3 Drift Detection Walkthrough
**Source:** `docs/customer-documents/reference-architecture/drift-walkthrough.qmd`

**Target:** `docs/architecture/drift-detection.md`

**Checklist:**
- [ ] Extract categories and examples
- [ ] Remove internal identifiers
- [ ] Commit and link from series Chapter 03 and Project Plan

---

## Priority 3 — Selective or lower priority

| Item | Source | Target | Notes |
|------|--------|--------|-------|
| HR-driven identity pipeline | OrgComp HRIT execution plan | `docs/guides/hr-driven-lifecycle.md` | Significant rewrite required |
| SQL Server Identity Transformation | `docs/customer-documents/sql-server-narrative/` | `docs/case-studies/sql-server-identity.md` | Useful worked example after cleaning |
| Target surface libraries | Intune policy templates, CA library, modernization specs | `docs/libraries/` | Mine selectively; avoid full copy |
| Program education / training / test plans | `docs/narrative/program-*.qmd` | `docs/program/` | Short supporting pages |
| Single Source of Truth definition | `src/uiao/canon/UIAO-SSOT.md` | `docs/architecture/single-source-of-truth.md` | Foundational; high value once cleaned |
| Where data lives | `where-data-lives.qmd` (+ devices) | `docs/architecture/where-data-lives.md` | Provenance and location map |

---

## Suggested Order of Work

1. Whitepapers (structural problem + modernization journey)
2. Directory migration bridge (concepts + inventory)
3. MACD-R / change-control doctrine
4. Attribute-driven structure reference set
5. Drift detection
6. Device and server modernization guide
7. Remaining selective items as needed

---

## Quality Checklist (apply to every migrated document)

- [ ] No occurrence of “UIAO”, “OrgPath”, “OrgTree”, “OrgComp”, “OrgMod”, or “OrgLink”
- [ ] No ADR numbers or UIAO_NNN / DM_NNN identifiers
- [ ] No internal “Posted” or “Canon” cross-references
- [ ] Diagrams and tables preserved or cleanly rewritten
- [ ] Language usable by an external program team or leadership audience
- [ ] File placed under a logical `docs/` path
- [ ] Short note at the bottom: “Cleaned extraction for project use.”

---

## Tracking

Update this file as items are completed. When a document is finished, move it from its priority section to the “Already Completed” table and note the destination path and commit date.

**Last updated:** 2026-10-16
