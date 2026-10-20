# B05 Devices & Endpoints — chapter-writer brief

Repo worktree: `C:\Users\whale\git\mwb-b05` (branch `book/b05-devices`). Book folder: `docs/books/b05-devices/`.

**Read the general workbook book rules first and follow them exactly:** `docs/books/_book-writer-brief.md` (style,
program name, agency-neutral rule, footnote format and verification, diagram house style, verification side file,
boundaries, final report). Replace its B02 specifics with this book's: front matter `family: b05-devices`,
`book: B05`; diagram sources go in `docs/images/diagrams/b05-devices/src/` and are referenced as
`../../images/diagrams/b05-devices/svg/<name>.svg`.

Book 05 answers **"Why can't Group Policy come to the cloud?"** It consolidates the workbook's device and server
modernization pages — Group Policy sunset, Intune, Intune-first onboarding, Azure Arc for servers, hybrid join —
into one book.

## Relation to the other books — don't duplicate, link

- **Book 02** (`../b02-identity/index.md`) covers the identity migration; its Chapter 04
  (`../b02-identity/04-the-hidden-migration-surface.md`) lists devices as one adapter, and Chapter 10 covers
  Windows Hello for Business and phishing-resistant sign-in. Link, stay consistent.
- **Book 04** (Access & Privilege, `../b04-access/index.md`, on another branch — link by that path) owns
  Conditional Access and device-compliance-based access; link to it for the access policy side.
- Pages that stay in place and are linked (never archived): `../../projects/endpoint-device-charter.md` and
  `../../projects/endpoint-device-plan.md`; the Client-Server to Hybrid-Cloud chapters
  `../../client-server-to-hybrid-cloud/05-policy-transformation.md` and `07-compute-transformation.md`.
- Pages being consolidated and archived (never link to them): everything under
  `docs/operational-guides/intune-arc-modernization/`, `docs/guides/device-and-server-modernization/`,
  `docs/operational-guides/target-surface/`; `docs/reference-architecture/intune-first.md`,
  `docs/reference-architecture/gpo-cloud-governance-gaps.md`, `docs/architecture/intune-first-onboarding.md`,
  `docs/architecture/gpo-to-cloud-governance-gaps.md`, `docs/architecture/where-data-lives-devices-azure.md`,
  `docs/operational-guides/gpo-sunset-program.md`, `docs/operational-guides/gpo-modernization-parse-crosswalk.md`,
  `docs/libraries/gpo-sunset-principles.md`, `docs/whitepapers/hybrid-join-without-governance.md`. Their substance
  must be carried into the book (consolidate the short twins into their fuller pages).

## Chapter list (exact file names)

| File | Part | Title |
|---|---|---|
| `index.md` | — | Book 05 — Devices & Endpoints (editor) |
| `01-why-group-policy-cant-come-to-the-cloud.md` | Why | Chapter 01 — Why Group Policy Can't Come to the Cloud |
| `02-the-hybrid-join-trap.md` | Why | Chapter 02 — The Hybrid Join Trap |
| `03-where-device-and-server-data-lives.md` | What | Chapter 03 — Where Device and Server Data Lives |
| `04-intune-first-onboarding.md` | What | Chapter 04 — Intune-First Onboarding |
| `05-the-governed-manual-and-retrofit-paths.md` | What | Chapter 05 — The Governed, Manual and Retrofit Paths |
| `06-who-owns-the-endpoint.md` | Who | Chapter 06 — Who Owns the Endpoint |
| `07-the-gpo-sunset-program.md` | How | Chapter 07 — The GPO Sunset Program |
| `08-gpo-to-intune-policy-migration.md` | How | Chapter 08 — GPO to Intune Policy Migration |
| `09-servers-under-azure-arc.md` | How | Chapter 09 — Servers Under Azure Arc |
| `10-operating-and-evidencing-the-fleet.md` | How | Chapter 10 — Operating and Evidencing the Fleet |
| `appendix-a-gpo-to-intune-crosswalk.md` | Appendix | Appendix A — GPO to Intune Crosswalk |

Appendix series-order is 90.
