# Migration Plan and Checklist

**Purpose:** Extract and clean high-value modernization content from the original materials into this project so it can be used as standalone project guidance. No internal branding or document identifiers in the finished artifacts.

**Target repository:** `WhalerMike/modernization-workbook`

---

## Guiding Rules

- Preserve technical and programmatic substance.
- Remove all internal branding and document identifiers.
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
| Whitepapers (structural problem, modernization journey, hybrid join, session vs. telemetry, network transport) | `docs/whitepapers/` | Done |
| Directory Migration Bridge overview + eight core concepts | `docs/architecture/directory-migration/` | Done |
| MACD-R / Change Control and Provenance Doctrine | `docs/architecture/change-control-and-provenance.md` | Done |
| Attribute-Driven Structure reference | `docs/architecture/attribute-driven-structure.md` | Done |
| Drift Detection walkthrough | `docs/architecture/drift-detection.md` | Done |
| Device and Server Modernization (overview + manual path + governed/retrofit paths) | `docs/guides/device-and-server-modernization/` | Done |
| Single Source of Truth definition | `docs/architecture/single-source-of-truth.md` | Done |
| Where data lives (three-layer storage model) | `docs/architecture/where-data-lives.md` | Done |
| SQL Server Identity Transformation case study overview | `docs/case-studies/sql-server-identity.md` | Done |
| SQL Server narrative series (Books 01–10) | `docs/case-studies/sql-server-narrative/` | Done |
| HR-driven identity lifecycle | `docs/guides/hr-driven-lifecycle.md` | Done |
| Education, Training, and Test Plans overviews | `docs/program/` | Done |
| Principles extracts from large libraries | `docs/libraries/` | Done |
| Consolidated principles document with diagram | `docs/PRINCIPLES.md` | Done |
| Learning (AD vs Entra reference + Entra Security Baseline crosswalk) | `docs/learning/` | Done |
| Executive Briefs (modernization, Zero Trust, drift engine) | `docs/executive-briefs/` | Done |

---

## Priority 3 — Selective or lower priority

| Item | Source | Target | Notes |
|------|--------|--------|-------|
| Target surface libraries | Policy templates, access library, modernization specs | `docs/libraries/` | **Deferred** — short principles extracts created; full catalogs remain in source materials |
| Remaining whitepapers | Federal compliance primer, Zero Trust governance principles, federal SSOT alignment, TIC/SD-WAN, Infoblox | `docs/whitepapers/` | Selective — prefer externally-sourced papers |
| Architecture Series | Six-plane model, three-layer rules, boundary-impact, evidence chain | `docs/architecture/` | Conceptual explainers; clean if requested |
| Case Studies | Framing-pattern narratives | `docs/case-studies/` | Lower priority; synthetic framing |
| OrgPath / OrgComp series | Long-form substrate and compliance programs | — | Deferred — heavy branding |

---

## Status

**High-value extraction from the customer-documents portal is underway.**

Learning section and Executive Briefs have been cleaned and migrated. Remaining whitepapers, Architecture Series, and Case Studies are available for selective continuation.

---

## Quality Checklist (apply to every migrated document)

- [ ] No internal branding or product-family names
- [ ] No internal document identifiers
- [ ] No internal cross-references
- [ ] Diagrams and tables preserved or cleanly rewritten
- [ ] Language usable by an external program team or leadership audience
- [ ] File placed under a logical `docs/` path
- [ ] Short note at the bottom: “Cleaned extraction for project use.”

---

## Tracking

Update this file as items are completed. When a document is finished, move it from its priority section to the “Already Completed” table and note the destination path and commit date.

**Last updated:** 2026-10-16  
**Status:** Learning and Executive Briefs migrated from customer-documents portal.
