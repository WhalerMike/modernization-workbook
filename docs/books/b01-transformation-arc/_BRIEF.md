# B01 The Transformation Arc — chapter-editor brief

Repo worktree: `C:\Users\whale\git\mwb-b01` (branch `book/b01-transformation-arc`). Book folder:
`docs/books/b01-transformation-arc/`.

**Read the general workbook book rules first and follow them:** `docs/books/_book-writer-brief.md` (style, program
name, agency-neutral rule, footnote format and verification, diagram house style, verification side file, boundaries,
final report). This brief states what is different for Book 01. The site is now the **Federal Modernization
Workbook**: use that name wherever the workbook is named.

Book 01 answers **"Why is modernization so hard?"** It is the workbook's overview: the end-to-end move from a
domain-joined client/server estate to cloud identity, cloud device management and governed hybrid operations. Its
thesis: Active Directory quietly did governance nobody wrote down, so modernization is a governance rebuild, not a
platform swap; analyze the estate, plan, then deliver in gated phases with rollback; and leadership owns the
orchestra, not the instruments.

## What's different

1. **The series is already copied in and renumbered** (Why / What / Who / How order). Verify and upgrade each chapter
   **in place**, as Books 03, 06 and 08 did: verify every external factual claim on the internet and footnote it
   (Microsoft Learn MCP tools first for Microsoft facts; primary federal sources for policy), correct wrong or stale
   claims, and log every change. Keep the author's argument, structure and terms; don't cut sections (log anything
   removed and why).
2. **Book 01 is the map of the workbook.** Books 02–09 are published and carry the depth. Each Book 01 chapter keeps
   its arc-level argument and **links the book that owns the detail** instead of repeating it, and must not
   contradict it. Read the linked book's index (and the chapters you cite) before writing:
   - identity → Book 02 `../b02-identity/index.md`, Book 03 `../b03-hr-identity/index.md`
   - access → Book 04 `../b04-access/index.md`; devices and Group Policy → Book 05 `../b05-devices/index.md`
   - SQL Server → Book 06 `../b06-data-platform/index.md`; PKI → Book 07 `../b07-pki/index.md`
   - DNS/DHCP/IPAM → Book 08 `../b08-ddi/index.md`; network, TIC 3.0, SD-WAN → Book 09 `../b09-network/index.md`
     (Book 09 is on another branch; link by that path).
   Facts already settled elsewhere: OMB M-26-14 (May 22, 2026) rescinded M-21-31 — cite M-26-14 for logging; Intune
   doesn't manage Windows Server (servers go under Azure Arc); hybrid join is a waypoint, not the end state; Infoblox
   Government Cloud is FedRAMP Moderate (since Dec 15, 2022); Microsoft 365 INR isn't available to GCC Moderate.
3. **Absorb the overlapping documents** (they're archived after the book is built — never link to them), carrying
   their substantive, non-duplicated content into your chapters (verified) and recording in your carry-forward ledger
   which sections you absorbed:
   - `docs/whitepapers/modernization-journey.md` — the flagship whitepaper (7,400 words; its images are Word extracts in
     `docs/images/whitepapers/rId*.png` — replace them with house-style diagram sources where a figure is needed).
   - `docs/modernization/index.md` — the modernization overview page.
   - `docs/operational-guides/client-server-to-hybrid-cloud/00-introduction.md`, `01-platform-foundation.md`,
     `02-legacy-ingestion.md` — an earlier copy of the series' opening chapters; carry anything not in the series.
4. **Styling as in Books 02–09:** front matter is set (fill in `description:`; keep `part:`/`series-order:`), titles of
   the form `Chapter NN — Title` in `title:` and the H1 (the H1s still carry the old numbers and titles — fix them),
   italic thesis line, "In this chapter" callout, closing "Continue the book" callout in reading order (Chapter 01's
   Previous is `index.md`; Appendix B has no Next), footnotes at the very bottom with `[^cNN-key]` keys (`[^aX-key]`
   in appendices). Remove "Status — Draft" banners and per-page Word download callouts. Chapter numbers in prose
   changed — fix every "Chapter N" reference to the new numbering below.
5. **Diagrams.** The series' figures are hand-drawn SVGs in `docs/images/cshc/` (now referenced as
   `../../images/cshc/…`). Replace each with a house-style source in
   `docs/images/diagrams/b01-transformation-arc/src/chNN-short-name.flow.yaml`, referenced as
   `../../images/diagrams/b01-transformation-arc/svg/chNN-short-name.svg`, carrying the same content (fix any wrong
   fact). One to three diagrams per chapter; appendices usually none.
6. Verification file per page under `_verification/` (claims log + carry-forward ledger).

## Reading order, files and writers

| File | Part | Title | Writer |
|---|---|---|---|
| `index.md` | — | Book 01 — The Transformation Arc (editor) | editor |
| `01-why-modernization-is-hard.md` | Why | Chapter 01 — Why Modernization Is Hard | W1 |
| `02-the-problem.md` | Why | Chapter 02 — The Problem: Governance Hidden in the Directory | W1 |
| `03-platform-foundation.md` | What | Chapter 03 — The Platform Foundation | W2 |
| `04-identity-transformation.md` | What | Chapter 04 — Identity Transformation | W2 |
| `05-policy-transformation.md` | What | Chapter 05 — Policy Transformation | W3 |
| `06-network-services.md` | What | Chapter 06 — Network Services: DNS, DHCP and IPAM | W3 |
| `07-compute-transformation.md` | What | Chapter 07 — Compute Transformation | W3 |
| `08-access-plane.md` | What | Chapter 08 — The Access Plane | W4 |
| `09-who-leads-the-transformation.md` | Who | Chapter 09 — Who Leads the Transformation | W4 |
| `10-analyzing-the-estate.md` | How | Chapter 10 — Analyzing the Estate | W5 |
| `11-analysis-plan-delivery.md` | How | Chapter 11 — Analysis, Plan, Delivery | W5 |
| `12-migration-roadmap.md` | How | Chapter 12 — The Migration Roadmap | W5 |
| `appendix-a-requirements-mapping.md` | Appendix | Appendix A — Requirements Mapping | W5 |
| `appendix-b-applicability.md` | Appendix | Appendix B — Applicability | W5 |

Old → new numbers: 00 prologue → 01; 00 problem → 02; 01 → 03; 04–08 keep their numbers; 10 → 09; 02 → 10; 03 → 11;
09 → 12; 00a → Appendix B. Chapter 09 (Who) was the leadership takeaway: reframe it as who leads, decides and does the
work across the program (sponsor, CIO, CISO/AO, program office, platform teams, help desk, HR and records), keeping
the "instruments vs orchestra" argument and linking each book's own Who chapter.

Absorption owners: W1 takes the whitepaper's why-it's-hard and problem parts, `docs/modernization/index.md` and the
earlier `00-introduction.md`; W2 the earlier `01-platform-foundation.md` and `02-legacy-ingestion.md`; W5 the
whitepaper's journey, phases and roadmap parts. W3 and W4 take whatever of the whitepaper falls in their chapters.
