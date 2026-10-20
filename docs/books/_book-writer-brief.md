# B02 Identity & Directory — chapter-writer brief (shared by every writer)

Repo worktree: `C:\Users\whale\git\mwb-b02` (branch `book/b02-identity`). Book folder:
`docs/books/b02-identity/`. Files and folders starting with `_` are not rendered by Quarto.

You are consolidating existing workbook pages into one chapter (or a few) of **Book 02 — Identity &
Directory: Active Directory to Entra ID**, part of the Modernization Workbook (public site
<https://whalermike.github.io/modernization-workbook/>). Each book answers **Why / What / Who / How**.
B02's opening question is **"Why does identity matter?"**

## The book's chapter list (use these exact file names for cross-links)

| File | Part | Title |
|---|---|---|
| `index.md` | — | Book 02 — Identity & Directory (written by the editor) |
| `01-why-identity-matters.md` | Why | Chapter 01 — Why Identity Matters |
| `02-the-structural-problem.md` | Why | Chapter 02 — The Structural Problem |
| `03-ad-and-entra-side-by-side.md` | What | Chapter 03 — Active Directory and Entra ID, Side by Side |
| `04-the-hidden-migration-surface.md` | What | Chapter 04 — The Hidden Migration Surface |
| `05-delegation-without-ous.md` | What | Chapter 05 — Delegation Without OUs |
| `06-who-owns-the-migration.md` | Who | Chapter 06 — Who Owns the Migration |
| `07-read-only-discovery.md` | How | Chapter 07 — Read-Only Discovery |
| `08-assessing-the-forest.md` | How | Chapter 08 — Assessing the Forest |
| `09-building-the-entra-target.md` | How | Chapter 09 — Building the Entra ID Target |
| `10-migrating-and-governing.md` | How | Chapter 10 — Migrating and Governing |
| `11-reference-deployment.md` | How | Chapter 11 — Reference Deployment |
| `appendix-a-federal-requirements-crosswalk.md` | — | Appendix A — Federal Requirements Crosswalk |
| `07-read-only-discovery.md` | — | Appendix B — Read-Only Assessment Module |
| `appendix-b-forest-assessment-module.md` | — | Appendix B — Forest Assessment Module |
| `appendix-c-identity-assessment-module.md` | — | Appendix C — Identity Assessment Module |

## Page template

```markdown
---
title: "Chapter NN — Title"
description: "One sentence saying what the chapter covers."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b02-identity
book: B02
part: Why            # Why | What | Who | How | Appendix
series-order: NN     # chapter number; appendices 90, 91, 92, 93
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Chapter NN — Title

*One-line italic thesis in your own words (not a quotation).*

::: {.callout-note}
## In this chapter
Two to four sentences listing what the chapter covers.
:::

...body...

::: {.callout-tip}
## Continue the book
[← Previous: Chapter NN — Title](file.md) · [Book index](index.md) · [Next: Chapter NN — Title →](file.md)
:::

[^cNN-key]: footnote definitions go here, at the very bottom, after the callout.
```

Appendices use `title: "Appendix A — …"` and `[^aA-key]`-style keys.

## Style rules

- Plain, direct, active voice. No marketing, no hype words, no "Draft" or classification stamps.
  American spelling. Sentence-case `##`/`###` headings. **Never** use a bold paragraph as a fake
  heading. Pipe tables only. Lists for parallel items, prose for argument.
- Program name: "the Federal Modernization Program" in prose; the `FMP` prefix in code, file names,
  IDs (`Invoke-FMPADAssessment`). Never write "UIAO".
- **Never name a specific agency** as the subject; the workbook is agency-agnostic.
  Agency-specific facts appear only as generic examples ("many agencies…"). `SSN` is fine.
- Case studies in the sources are *framing patterns, not real engagements*; keep that honesty.
- The sources were converted from Word and are damaged in places: collapsed tables, PowerShell
  flattened onto one line with backslash escapes (`\$`, `\"`, `\#`). Restore code into properly
  indented, fenced ```` ```powershell ```` blocks (remove the escapes, restore line breaks). Put a
  `::: {.callout-warning}` before the first code block in a chapter: illustrative, not tested against
  a production forest; review before running. Do not invent new cmdlets or parameters; check any
  you're unsure of on Microsoft Learn and fix or flag them.

## Verification and footnotes (the core requirement)

Every external factual claim must be **verified on the internet and footnoted**: Microsoft product
behavior, feature names, licensing tiers, limits, deprecation/retirement dates, protocol facts,
federal policy (OMB memos, NIST SPs, CISA BODs and directives, FedRAMP), statistics, dates.

- Microsoft claims: use the Microsoft Learn MCP tools (`microsoft_docs_search`, `microsoft_docs_fetch`)
  first; they're loaded as deferred tools (`ToolSearch` with `select:` + the tool name). Federal
  claims: primary sources (whitehouse.gov, nist.gov / csrc.nist.gov, cisa.gov, fedramp.gov,
  opm.gov, gsa.gov). Use `WebSearch`/`WebFetch` (also deferred tools) for the rest.
- Footnote format, one definition per source, reused where cited again:
  `[^c03-kerberos]: Microsoft Learn, "Kerberos authentication overview," <https://learn.microsoft.com/...> (accessed Oct 20, 2026).`
  For documents: `Office of Management and Budget, M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022, <URL> (accessed Oct 20, 2026).`
- Names change (Azure AD → Microsoft Entra ID; Azure AD Connect → Microsoft Entra Connect; MIM
  status; AD FS guidance; Entra ID P1/P2/Governance). State current names and facts as of today,
  2026-10-20; correct the source where it's stale and footnote the correction.
- If a claim is wrong: fix it and footnote the correct source. If you can't verify it: remove it or
  restate it as the program's own design position (program design choices need no footnote, but must
  not be presented as external fact). Never footnote a URL you did not actually open or get from a
  search result. Avoid exact prices unless verified; prefer license tiers.
- Aim for roughly one footnote per 150–300 words of factual prose; design argument needs fewer.

## Diagrams (house style, committed SVG)

1–3 diagrams per chapter (appendices usually none). Place the first one early, right after the
opening prose. Write **sources only**; the editor renders them.

- Read `docs/images/diagrams/README.md` and copy syntax from the sources in
  `docs/images/diagrams/hr-driven-iam/src/` (e.g. `ch03-authority-map.flow.yaml`).
- Your sources go in `docs/images/diagrams/b02-identity/src/chNN-short-name.flow.yaml` (or `.seq.yaml`).
  Tone meanings: blue = Entra ID/target, slate = Active Directory/neutral, green = done/recommended,
  amber = interim/decision, red = legacy risk/blocked, violet = governance/monitoring. White
  background, no title inside the image. Keep the width under ~800 px (`width` per node ~240–300,
  at most 3 nodes per rank in LR layouts).
- Reference from the chapter as:
  `![Caption sentence.](../../images/diagrams/b02-identity/svg/chNN-short-name.svg){#fig-chNN-short-name fig-alt="Full description of the diagram for screen readers."}`
- Do **not** reuse the old PNGs under `docs/images/operational-guides/` etc.; replace them with
  house-style diagrams where they carried meaning.

## Content rules

- Preserve the substantive technical content of your sources (procedures, decision matrices,
  tables, scripts) unless it's duplicated in another chapter, wrong, or vendor-positioning fluff.
  Consolidate duplicates across your sources.
- Link other B02 chapters by file name. Link workbook pages outside B02 relative to
  `docs/books/b02-identity/` (e.g. `../../hr-driven-iam/index.md`). **Never link to the B02 source
  pages** you were given; they're being archived.

## Required side file: `docs/books/b02-identity/_verification/<your-file-stem>.md`

1. **Claims log** — table: `| # | Claim (short) | Where | Verdict | Source |` with verdict one of
   verified / corrected / removed / restated-as-design / unverifiable.
2. **Carry-forward ledger** — table: `| Source page § | Went to | Or why not carried |` covering every
   section of every source page you were given.

## Boundaries

Write only your assigned chapter files, their diagram sources, and your verification files. Don't edit
anything else, don't render, don't run git commands that change state, don't commit.

## Your final report (short)

Files written; word count per file; footnote count; diagrams; the most important corrections you made
to source claims; anything you couldn't verify.
