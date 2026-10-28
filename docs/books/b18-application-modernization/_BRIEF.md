# B18 Application Modernization — chapter-writer brief

Repo worktree: `C:\Users\whale\git\modernization-workbook\.claude\worktrees\b18-app-modernization-afbe5b`
(branch `claude/b18-app-modernization-afbe5b`). Book folder: `docs/books/b18-application-modernization/`.

**Read the general workbook book rules first and follow them exactly:** `docs/books/_book-writer-brief.md`. Replace its
B02 specifics with this book's: front matter `family: b18-application-modernization`, `book: B18`; diagram sources go in
`docs/images/diagrams/b18-application-modernization/src/chNN-short-name.flow.yaml`, referenced as
`../../images/diagrams/b18-application-modernization/svg/chNN-short-name.svg`. Diagrams no wider than 800 px, white
background, house palette (read `docs/images/diagrams/README.md`; copy syntax from
`docs/images/diagrams/b17-ai-identity/src/*.flow.yaml`). For this book, tone meanings are: **blue** = target
architecture, **slate** = legacy/neutral, **green** = recommended/done, **amber** = interim/decision, **red** = legacy
risk/blocked, **violet** = governance/monitoring. Footnote keys `[^cNN-key]` (`[^aX-key]` in appendices), rendered as
chapter endnotes; every key must be unique **across the whole book** (the bundle joins chapters), which the
`cNN-` prefix guarantees as long as you use your own chapter number. Use a recent B17 chapter
(`docs/books/b17-ai-identity/02-what-federal-ai-rules-require.md`) and its `_verification/` file as the model.
Today is 2026-10-28. Use `status: draft`, `lifecycle_review: 2027-04-01`.

**Hard rules:** never write any engine or product name for the program (it is "the Federal Modernization
Program"); never name a specific agency — say "the agency" or "many agencies"; every external factual claim
independently researched against a primary source you actually opened, and endnoted; never send personal data (email
addresses, names) to any website, including in HTTP headers; don't circumvent bot protection or paywalls (record the
block in the verification log as "manual check" and use another primary source); guidance, not policy — "requires"
only with a cited requirement, program design labeled as the program's design; vendors and products may be named as
examples, never endorsed. Don't cut or edit anything outside your assigned files.

**Primary sources by kind:** federal policy on whitehouse.gov (OMB), federalregister.gov, csrc.nist.gov / nvlpubs.nist.gov,
gao.gov, cisa.gov, gsa.gov / fedramp.gov, cio.gov; product facts on the vendor's own documentation (spring.io,
docs.spring.io, react.dev, nodejs.org, openjdk.org / oracle.com Java SE support roadmap, postgresql.org/docs,
learn.microsoft.com — use the Microsoft Learn MCP tools, `ToolSearch` with
`select:mcp__6acc0827-a073-4358-b00d-61f06b2856e8__microsoft_docs_search,mcp__6acc0827-a073-4358-b00d-61f06b2856e8__microsoft_docs_fetch`
— docs.aws.amazon.com, ibm.com/docs, docs.oracle.com, spec.openapis.org, opencontainers.org, kubernetes.io); standards
bodies on their own sites (opengroup.org for TOGAF, zachman.com / zachmaninternational.com for Zachman, owasp.org /
genai.owasp.org, modelcontextprotocol.io). `WebSearch`/`WebFetch` are deferred tools: load them with
`ToolSearch` `select:WebSearch,WebFetch`. State versions, release dates and support windows **as of October 2026** —
check them, don't recall them (Spring Boot, Java LTS, Node.js LTS, React, PostgreSQL major versions all move).

## What the book argues

Book 18 answers **"Why is application modernization a portfolio decision, not a rewrite?"** An agency that runs
thousands of legacy mission applications cannot rewrite them; it must decide, application by application, what to
retire, retain, rehost, replatform, refactor or rebuild, and then build the ones it changes on one target reference
architecture (Java/Spring Boot services, React front ends, Node.js where it fits, API-first contracts, containers),
move their data off DB2 and Oracle with proof that nothing was lost, add generative and agentic AI only with an
identity and an owner for every agent, and govern the whole portfolio through standards, patterns and review gates that
produce the evidence federal compliance needs. The book closes by mapping the work to TOGAF ADM phases and Zachman cells,
and by running the portfolio in waves. A small runnable reference implementation ships with the book in
`examples/app-modernization/` (Chapter 08 describes it; other chapters may link to it as
`[the reference implementation](../../../examples/app-modernization/README.md)`, or better, to Chapter 08).

## The book's chapter list (use these exact file names for cross-links)

| File | Part | Title |
|---|---|---|
| `index.md` | — | Book 18 — Application Modernization (written by the editor) |
| `01-a-portfolio-not-a-rewrite.md` | Why | Chapter 01 — A Portfolio, Not a Rewrite |
| `02-triaging-the-portfolio.md` | What | Chapter 02 — Triaging the Portfolio |
| `03-the-target-reference-architecture.md` | What | Chapter 03 — The Target Reference Architecture |
| `04-moving-the-data.md` | What | Chapter 04 — Moving the Data: DB2 and Oracle to PostgreSQL or SQL Server |
| `05-generative-and-agentic-ai.md` | What | Chapter 05 — Generative and Agentic AI in the Architecture |
| `06-compliance-by-design.md` | What | Chapter 06 — Compliance by Design |
| `07-who-governs-the-architecture.md` | Who | Chapter 07 — Who Governs the Architecture |
| `08-the-reference-implementation.md` | How | Chapter 08 — The Reference Implementation (written by the editor) |
| `09-togaf-and-zachman.md` | How | Chapter 09 — Mapping the Work to TOGAF and Zachman |
| `10-running-the-portfolio-in-waves.md` | How | Chapter 10 — Running the Portfolio in Waves |

No appendices.

## What each chapter must cover

- **01 (Why):** the scale of the legacy problem in federal IT, from primary sources (GAO's work on federal legacy systems
  and the most critical systems needing modernization; the share of IT spending on operations and maintenance — use the
  latest GAO figures you can open, with their year); why big-bang rewrites fail and why the unit of decision is the
  application; the book's argument and the four questions. 1 diagram.
- **02 (What):** portfolio triage — the six dispositions (retire, retain, rehost, replatform, refactor, rebuild), where
  they come from (Gartner's 2010 "5 Rs"; AWS's 7 Rs in its Prescriptive Guidance; Microsoft Cloud Adoption Framework's
  rationalization options — cite the vendor pages you can open, and note naming differences such as "repurchase/replace"
  and "relocate"); the triage criteria (mission criticality, technical condition, data sensitivity, cost, skills such as
  COBOL/PL-SQL, dependencies); how to triage thousands of applications with a scored rubric rather than one-at-a-time
  studies; where TMF and capital planning fit. Link [Book 06 Ch05](../b06-data-platform/05-rationalization.md) and
  [Ch06](../b06-data-platform/06-retain-consolidate-retire.md) for the same discipline applied to SQL Server instances.
  A decision table and 1–2 diagrams.
- **03 (What):** the target reference architecture — Java (current LTS release) and Spring Boot (current supported
  generation and its Java baseline) for services; React for front ends; Node.js where it fits (backend-for-frontend,
  front-end build, event glue) with its LTS schedule; API-first with OpenAPI (current spec version); containers (OCI) and
  orchestration; the strangler-fig pattern for incremental replacement (cite Martin Fowler's article or the Microsoft
  Azure Architecture Center pattern page); twelve-factor-style configuration; NIST SP 800-204 (microservices security) and
  SP 800-190 (container security) as the federal security references. 1–2 diagrams.
- **04 (What):** moving the data off DB2 and Oracle to PostgreSQL or SQL Server — schema conversion (type mapping,
  stored procedures, sequences, packages; tools such as AWS Schema Conversion Tool / DMS Schema Conversion and
  Microsoft SQL Server Migration Assistant for DB2 and for Oracle, Ora2Pg — check each tool's current status and
  supported sources/targets), data validation (row counts, checksums/hashes, aggregate reconciliation; AWS DMS data
  validation is a citable example), cut-over strategies (big-bang, phased, parallel run) and coexistence (change data
  capture, dual-write risks). **Link Book 06 rather than repeating it:** Book 06 is the SQL Server *identity* book
  (Windows Authentication to Entra, connection strings —
  [Ch19](../b06-data-platform/19-connection-string-migration.md), [Ch12](../b06-data-platform/12-the-engine-authentication-decision.md));
  when the target is SQL Server, say the identity and authentication work is in Book 06. 1–2 diagrams.
- **05 (What):** integrating generative and agentic AI into solution architectures — where it fits (assistive features,
  retrieval-augmented generation, code modernization assistance, agents that call tools); a provider-neutral model
  interface; tool allow-lists, human approval for actions that change records, step limits, audit; OWASP Top 10 for LLM
  Applications (current edition); NIST AI 600-1; the Model Context Protocol as an example of a tool protocol (check its
  current spec version and governance). **Identity and ownership for agents: link Book 17** (e.g.
  [Book 17 Ch04](../b17-ai-identity/04-kinds-of-ai-identity.md), [Ch05](../b17-ai-identity/05-owners-sponsors-and-lifecycle.md),
  [Ch06](../b17-ai-identity/06-credentials-and-least-privilege.md), [Ch02](../b17-ai-identity/02-what-federal-ai-rules-require.md))
  rather than repeating the federal AI rules. Read Book 17 Ch02 first: its settled facts (M-25-21, M-25-22, M-26-04,
  EO 14409, EO 14434 and the "Super Intelligence" terminology order) are the workbook's position — don't contradict them.
  1–2 diagrams.
- **06 (What):** compliance by design for modernized applications — NIST SP 800-53 Rev. 5 (current release number)
  control families most touched by application work (SA, SR, AC, AU, CM, SC, SI, PT); SP 800-218 SSDF; privacy (Privacy Act,
  E-Government Act §208 PIAs, the PT family); data governance (the Evidence Act and chief data officers); OMB Circular
  A-130 (enterprise architecture §5.a(2), privacy, records). **Read `docs/research/federal-framework-crosswalk.md`
  "Framework status" first:** M-22-18 and M-23-16 were rescinded by M-26-05 (January 23, 2026); the Federal Data
  Strategy is being retired; FEAF v2 is historical. Link [Book 14](../b14-compliance/index.md) (especially
  [Ch07 supply chain](../b14-compliance/07-supply-chain-risk-management.md) and [Ch08 privacy](../b14-compliance/08-privacy-pii-processing.md))
  rather than repeating authorization detail. A control table and 1 diagram.
- **07 (Who):** who governs the architecture — an architecture review board and its decision rights; standards and
  patterns (an approved-technology list, reference patterns, architecture decision records); design review and code
  review gates; SDLC, Agile and Git practice (trunk-based or short-lived branches, pull requests with required review,
  protected branches, CI that produces evidence, SBOMs); how these gates produce compliance evidence. Link
  [Book 13](../b13-governance/index.md) (change control and provenance, [Ch04](../b13-governance/04-change-control-and-provenance.md))
  and [Book 00 Ch07](../b00-orientation/07-who-runs-the-program.md). A RACI-style table and 1 diagram.
- **09 (How):** mapping the work to TOGAF ADM phases and Zachman cells — the TOGAF Standard (current edition and its
  ADM phases: Preliminary, A Architecture Vision, B Business, C Information Systems (data and application), D Technology,
  E Opportunities and Solutions, F Migration Planning, G Implementation Governance, H Architecture Change Management,
  plus Requirements Management), and the Zachman Framework (current version; its six interrogatives What/How/Where/
  Who/When/Why and six perspectives, with Zachman's own names for rows and columns). Map each B18 chapter and artifact to
  ADM phases and to Zachman cells in two tables. Tie it to the federal requirement: A-130 §5.a(2) enterprise
  architecture and SP 800-53 PM-7; FEAF v2 as historical. Quote nothing longer than 15 words from either standard.
  1 diagram. TOGAF content is free to read on opengroup.org with registration: don't register; use the public pages.
- **10 (How):** running the portfolio in waves — wave planning (pilot wave, factory waves, long tail), a modernization
  factory (repeatable patterns, platform team, reusable pipelines), metrics (applications dispositioned, retired,
  migrated; cost avoided; defects; time to ATO), funding (TMF, working capital), how to keep the triage current. Link
  [Book 01 Ch12](../b01-transformation-arc/12-migration-roadmap.md) for the program's phases and gates G0–G5 and use its
  phase names. 1 diagram.

## Settled facts in published books (read, link, don't contradict)

- Program phases and gates G0–G5: [Book 01 Ch12](../b01-transformation-arc/12-migration-roadmap.md); decision rights:
  [Book 00 Ch07](../b00-orientation/07-who-runs-the-program.md), [Book 13 Ch09](../b13-governance/09-who-governs.md).
- Authorization: no "three-year ATO" rule; FISMA at least annual testing; ongoing authorization; the authorizing official
  alone accepts residual risk ([Book 14](../b14-compliance/index.md)); FedRAMP 2026 Consolidated Rules
  ([Book 10 Ch03](../b10-cloud-boundary/03-what-changed-at-fedramp.md)).
- Framework status (M-26-05, Federal Data Strategy, FEAF v2, A-130, FITARA M-26-10, TMF):
  `docs/research/federal-framework-crosswalk.md`.
- AI rules and AI identity: [Book 17](../b17-ai-identity/index.md).
- Book links: `../bNN-folder/index.md` for B00–B17.

## Required side file: `docs/books/b18-application-modernization/_verification/<your-file-stem>.md`

As in the general brief, but this book has no source pages, so the carry-forward ledger is replaced by a short
**"Sources opened"** paragraph at the top (what you opened, on what date, and any manual checks) followed by the
**Claims log** table `| # | Claim (short) | Where | Verdict | Source |`.

## Your final report (short)

Files written; word count per file; footnote count; diagrams (sources only — the editor renders them); anything you
couldn't verify; and any settled fact in a published book you found stale.
