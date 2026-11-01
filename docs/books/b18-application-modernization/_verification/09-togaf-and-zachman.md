# Verification — Chapter 09, Mapping the Work to TOGAF and Zachman

Writer for Chapters 07, 09 and 10. New chapter; no source pages.

## Sources opened

Opened October 28, 2026: The Open Group's TOGAF landing page (opengroup.org/togaf); the April 25, 2022 press release announcing the 10th Edition; the C220 publication page on publications.opengroup.org (publication date May 19, 2025; "May 2025: Technical Corrigendum 1 has been applied"; Fundamental Content parts and Series Guides list); the TOGAF Licensed Downloads page; the TOGAF certification portfolio page and the TOGAF Enterprise Architecture Foundation and Practitioner data sheets (PDF); The Open Group white paper W055, *Guide to Security Architecture in TOGAF ADM* (November 2005, public PDF on pubs.opengroup.org/onlinepubs), for ADM phase names and objectives. Zachman International: "About the Zachman Framework" and "The Zachman Framework Evolution" pages on zachman-feac.com, and the Version 3.0 framework graphic (ZF3.jpg, linked from the About page; © 1987–2011, image metadata dated September 9, 2011). Federal: OMB Circular A-130 PDF; SP 800-53 5.2.0 OSCAL catalog (PM-7, PL-8 statements and discussion); archived OMB Federal Enterprise Architecture page.

Manual checks:

- **TOGAF online text requires sign-in.** Every page under pubs.opengroup.org/togaf-standard/, the 9.2 and 9.1 online editions, the TOGAF pocket guide and www.opengroup.org/togaf/10thedition redirect to identity.opengroup.org. Not circumvented and no account created. Current chapter titles ("Phase A: Architecture Vision," "Phase E: Opportunities & Solutions," "Phase G: Implementation Governance," "Phase H: Architecture Change Management," "ADM Architecture Requirements Management") were confirmed from search-result titles for the publisher's own pages; phase objectives in the chapter are paraphrased from the 2005 public white paper and those search-result excerpts. Note the 2005 paper writes "Phase C: Information System Architectures" and "Preliminary Phase: Framework and Principles"; the chapter uses the current names "Information Systems Architectures" and "Preliminary" as given in the brief and in the publisher's current index. An editor with an Open Group account could confirm the Phase C title in the 10th Edition text.
- **zachman.com** fails TLS (certificate issued for another host). Zachman International's current site is zachman-feac.com ("Zachman International - FEAC Institute"), which the evolution page itself points to; used that instead.
- Nothing from either standard is quoted at more than 15 words. Quotes: "is divided into the TOGAF Fundamental Content and the TOGAF Series Guides" (Open Group C220 page, 12 words); "will usually mean using it inside your organization" (licensed downloads page); "IS NOT a methodology" (Zachman); A-130 quotes are federal text.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | A-130 §5.a(2) quote: baseline, target, transition plan; align with IRM strategic plan; disposition plans | Federal policy | verified | A-130 |
| 2 | A-130 Appendix I §4.b(5) incorporate security and privacy requirements into the EA | Federal policy | verified | A-130 Appendix I |
| 3 | A-130 names no framework | Federal policy | verified (searched the PDF for TOGAF, Zachman, FEAF, "Federal Enterprise Architecture", "reference model": no hits) | A-130 |
| 4 | PM-7 statement; PM-7 discussion: system-of-systems level vs PL-8 system level | Federal policy | verified | SP 800-53 5.2.0 PM-7, PL-8 discussion |
| 5 | FEAF v2 dated January 29, 2013, on an archived page no longer updated; historical | Federal policy | verified; consistent with crosswalk "Framework status" | Archived OMB FEA page |
| 6 | TOGAF Standard, 10th Edition announced April 25, 2022 by The Open Group | TOGAF | verified | Press release |
| 7 | Document C220; page dated May 19, 2025; TC1 applied May 2025 | TOGAF | verified | C220 page |
| 8 | Succeeds Version 9.2, still offered | TOGAF | verified | opengroup.org/togaf ("Version 9.2" read-online and licensed-downloads links) |
| 9 | Fundamental Content's six parts; Series Guides include Government Reference Model, Microservices Architecture, business capabilities, value streams, integrating risk and security | TOGAF | verified | C220 page |
| 10 | Split lets new guidance be released more often while core stays stable | TOGAF | verified | Press release |
| 11 | Free download for non-commercial use after registration; commercial license; online edition needs sign-in | TOGAF | verified | Licensed downloads page; C220 page (register to download); redirects observed |
| 12 | ADM phase names and Requirements Management at the center | TOGAF | verified with manual check (see above) | W055 white paper; publisher index titles |
| 13 | Phase summaries (B–D baseline vs target and gaps; C data and application in either order; E options, work packages, dependencies, costs, benefits; F priority order and plan; G oversight and conformance; H change procedures and next cycle; RM feeds requirements into and out of phases) | TOGAF | verified as paraphrase | W055 objectives; search-result excerpts of the 10th Edition Phase E, G and H chapters |
| 14 | Zachman Framework Version 3.0, "The Enterprise Ontology," Zachman International, © 1987–2011 | Zachman | verified | ZF3 graphic; evolution page (2011 version 3.0) |
| 15 | Schema of two classifications; 6×6 matrix, interrogatives as columns, transformations as rows; cells are intersections | Zachman | verified | About page |
| 16 | "IS NOT a methodology"; doesn't prescribe where to start or how much to formalize | Zachman | verified | About page |
| 17 | Column names: Inventory Sets, Process Flows, Distribution Networks, Responsibility Assignments, Timing Cycles, Motivation Intentions | Zachman | verified | ZF3 graphic (bottom row "Enterprise Names") |
| 18 | Row names, audiences and model names: Executive/Business Context Planners/Scope Contexts; Business Mgmt/Business Concept Owners/Business Concepts; Architect/Business Logic Designers/System Logic; Engineer/Business Physics Builders/Technology Physics; Technician/Business Component Implementers/Tool Components; Enterprise/Users/Operations Instances | Zachman | verified | ZF3 graphic (left "Audience Perspectives", right "Model Names") |
| 19 | Stage names Identification, Definition, Representation, Specification, Configuration, Instantiation; cell naming (e.g. Process Representation) | Zachman | verified | About page; ZF3 graphic cell headers |
| 20 | Graphic labels row 2 "Business Mgmt Perspective"; chapter spells out "Business Management Perspective" | Zachman | restated (abbreviation expanded) | ZF3 graphic |
| 21 | Both mapping tables (chapter and artifact to ADM phase and Zachman cell) | Mappings | restated-as-design | Program's reading, labeled in the chapter as not reviewed by either publisher |
| 22 | No federal rule requires TOGAF or Zachman | Using the mappings | verified for A-130 and SP 800-53 (no framework named); stated as the program's reading for federal policy generally | A-130; PM-7, PL-8 |

## For the crosswalk

Ready for the editor to add TOGAF and Zachman rows to `docs/reference/federal-framework-crosswalk.md`.

### TOGAF

- **Current edition and date:** The TOGAF® Standard, 10th Edition (document C220). Announced April 25, 2022; publication page dated May 19, 2025, with Technical Corrigendum 1 applied in May 2025. Succeeds Version 9.2.
- **Publisher:** The Open Group.
- **Access:** Free download for non-commercial (internal) use after registration; commercial license otherwise; online edition behind sign-in. Not a federal requirement; A-130 names no framework.
- **Footnote-ready source lines (verified Oct 28, 2026):**
  - The Open Group, *The TOGAF® Standard, 10th Edition* (document C220), publication page, May 19, 2025, with Technical Corrigendum 1 applied, <https://publications.opengroup.org/c220> (accessed Oct 28, 2026).
  - The Open Group, "The Open Group Announces Launch of the TOGAF® Standard, 10th Edition," April 25, 2022, <https://www.opengroup.org/open-group-announces-launch-togaf-standard-10th-edition> (accessed Oct 28, 2026).
  - The Open Group, "TOGAF Licensed Downloads," <https://www.opengroup.org/togaf-licensed-downloads> (accessed Oct 28, 2026).

### Zachman

- **Current version and date:** The Zachman Framework for Enterprise Architecture: The Enterprise Ontology, Version 3.0, 2011 (graphic © 1987–2011, John A. Zachman).
- **Publisher:** Zachman International, Inc. (site branded "Zachman International - FEAC Institute"; zachman.com fails TLS as of Oct 28, 2026).
- **Nature:** An ontology (six interrogative columns by six reification rows), explicitly not a methodology. Not a federal requirement.
- **Footnote-ready source lines (verified Oct 28, 2026):**
  - John A. Zachman, *The Zachman Framework for Enterprise Architecture: The Enterprise Ontology*, Version 3.0, © 1987–2011, Zachman International, <https://zachman-feac.com/images/ZI_PIcs/ZF3.jpg> (accessed Oct 28, 2026).
  - Zachman International, "About the Zachman Framework," <https://zachman-feac.com/zachman/about-the-zachman-framework> (accessed Oct 28, 2026).
  - Zachman International, "The Zachman Framework Evolution," <https://zachman-feac.com/the-zachman-framework-evolution> (accessed Oct 28, 2026).

Suggested crosswalk status for both: **Current, voluntary.** What the workbook should cite for the requirement: A-130 §5.a(2) and SP 800-53 PM-7 (as for FEAF v2).
