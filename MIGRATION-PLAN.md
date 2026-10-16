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
| Whitepapers (structural problem, modernization journey, hybrid join) | `docs/whitepapers/` | Done |
| Directory Migration Bridge overview + eight core concepts | `docs/architecture/directory-migration/` | Done |
| MACD-R / Change Control and Provenance Doctrine | `docs/architecture/change-control-and-provenance.md` | Done |
| Attribute-Driven Structure reference | `docs/architecture/attribute-driven-structure.md` | Done |
| Drift Detection walkthrough | `docs/architecture/drift-detection.md` | Done |
| Device and Server Modernization (overview + manual path) | `docs/guides/device-and-server-modernization/` | Done |
| Single Source of Truth definition | `docs/architecture/single-source-of-truth.md` | Done |
| Where data lives (three-layer storage model) | `docs/architecture/where-data-lives.md` | Done |
| SQL Server Identity Transformation case study overview | `docs/case-studies/sql-server-identity.md` | Done |

---

## Priority 3 — Selective or lower priority

| Item | Source | Target | Notes |
|------|--------|--------|-------|
| HR-driven identity pipeline | OrgComp HRIT execution plan | `docs/guides/hr-driven-lifecycle.md` | Significant rewrite required |
| Target surface libraries | Intune policy templates, CA library, modernization specs | `docs/libraries/` | Mine selectively; avoid full copy |
| Program education / training / test plans | `docs/narrative/program-*.qmd` | `docs/program/` | Short supporting pages |

---

## Suggested Order of Work

All Priority 1, Priority 2, and the foundational / high-value case-study items are complete.

Next options (Priority 3, selective):
- HR-driven lifecycle
- Program education / training / test plans
- Target surface libraries (selective)

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
