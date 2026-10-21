# B10 Cloud Boundary & Landing Zone — chapter-writer brief

Repo worktree: `C:\Users\whale\git\mwb-b10` (branch `book/b10-cloud-boundary`). Book folder: `docs/books/b10-cloud-boundary/`.

**Read the general workbook book rules first and follow them exactly:** `docs/books/_book-writer-brief.md`. Replace its B02
specifics with this book's: front matter `family: b10-cloud-boundary`, `book: B10`; diagram sources go in
`docs/images/diagrams/b10-cloud-boundary/src/chNN-short-name.flow.yaml`, referenced as
`../../images/diagrams/b10-cloud-boundary/svg/chNN-short-name.svg`. Footnote keys `[^cNN-key]` (`[^aX-key]` in appendices).
The site is the **Federal Modernization Workbook**: use that name wherever the workbook is named.

Book 10 answers **"Why does the authorization boundary decide what you can use?"** Its argument: the FedRAMP/GCC
authorization boundary, not the product catalog, decides which features an agency can use; much of what the boundary
removes is invisible until a design depends on it; FedRAMP's 2026 rules changed what "the boundary" means and what an
agency can ask a provider for; the landing zone is where the boundary becomes concrete (management groups,
subscriptions, policy, IPAM, network as code, the front door); and when a capability is outside the boundary, an agency
compensates in-boundary, uses a documented exception, or chooses an alternative path, and evidences the choice in its
own authorization package.

## Sources (archived after the book is built — never link to them)

| Source | Words | Feeds |
|---|---|---|
| `docs/architecture/boundary-impact-model.md` (*Boundary Impact Model*) | 1,140 | Ch02, 09, 11 |
| `docs/case-studies/cloud-boundary-case-study.md`, `docs/case-studies/cloud-boundary.md` | 970 | Ch01 |
| `docs/whitepapers/fedramp-20x-and-the-commercial-feature-gap.md` (*What Changed at FedRAMP*) | 3,480 | Ch01, 03, 04, 09, App A |
| `docs/case-studies/google-workspace-collaboration-path.md` | 1,080 | Ch10 |
| `docs/modernization-specs/cloud.md` | 290 | Ch05, 06 |
| `docs/whitepapers/git-server-interfaces-whitepaper.md` (the program's Git server on Windows Server 2025) | 6,100 | App B |

**Stay in place** (unpublished; read for facts and link by GitHub URL
`https://github.com/WhalerMike/modernization-workbook/blob/main/<path>`; Book 14 will absorb them):
`docs/compliance/Vol_I_Book_01_Cloud_Landing_Zone_IPAM_FedRAMP.md` (12,800 words — the landing-zone core: read it
closely for Ch05–06), `Vol_I_Book_00_Foundation_Transport_Overview.md`, `Vol_IX_Book_02_Landing_Zone_Front_Door.md`
(Ch07), `Vol_VI_Book_01_Landing_Zone_Network_as_Code.md` (Ch06).

Write each chapter fresh from the sources, keeping the author's argument and terms; verify every external claim and
record in your carry-forward ledger where each source section went. Existing figures:
`docs/images/diagrams/architecture/src/boundary-impact-four-dimensions*` and `boundary-impact-invisible-boundary*` —
copy and adapt them into this book's `src/` as `ch02-…` (fix facts).

## Facts already settled in published books (read, link, don't contradict)

- FedRAMP 2026 rules: services are **certified** in **Classes A–D** (Class C includes the former Moderate baseline);
  each agency authorizes its own systems and "should never create a standalone authorization to operate for a cloud
  service offering"; FedRAMP stops accepting new Rev5 certification requests June 11, 2027; the end date for existing
  Rev5 certifications is not final ("likely no later than 2029"). Book 09 Ch03 and App C, Book 08 Ch03.
- Microsoft 365 GCC (MSO365MT) is certified at Class C / Moderate on the Marketplace; a second listing pursues High.
  Read `https://www.fedramp.gov/marketplace/products.json` for any status you state. INR isn't available to GCC
  Moderate (Book 08 App C, Book 09 Ch12).
- OMB M-26-14 rescinded M-21-31 (logging). BOD 25-01 (SCuBA) covers cloud tenant configuration, not on-premises.
- Azure IPAM is Azure Virtual Network Manager IPAM; the enterprise IPAM is the authority and Azure pools mirror it
  (Book 08 Ch07). Private Resolver forwards; it isn't an authority.
- Link: Book 08 `../b08-ddi/index.md` (DNS/IPAM), Book 09 `../b09-network/index.md` (TIC 3.0, transport), Book 04
  `../b04-access/index.md` (Conditional Access), Book 01 `../b01-transformation-arc/03-platform-foundation.md`
  (platform host), Book 05 `../b05-devices/index.md` (Arc, Intune).

## Chapter list (exact file names)

| File | Part | Title | Writer |
|---|---|---|---|
| `index.md` | — | Book 10 — Cloud Boundary & Landing Zone (editor) | editor |
| `01-why-the-boundary-decides.md` | Why | Chapter 01 — Why the Boundary Decides What You Can Use | W1 |
| `02-the-invisible-boundary.md` | Why | Chapter 02 — The Invisible Boundary | W1 |
| `03-what-changed-at-fedramp.md` | What | Chapter 03 — What Changed at FedRAMP | W2 |
| `04-gcc-and-the-feature-gap.md` | What | Chapter 04 — GCC, GCC High and the Commercial Feature Gap | W2 |
| `05-the-landing-zone.md` | What | Chapter 05 — The Landing Zone | W3 |
| `06-ipam-and-network-as-code.md` | What | Chapter 06 — IPAM and Network as Code | W3 |
| `07-the-front-door.md` | What | Chapter 07 — The Landing Zone Front Door | W3 |
| `08-who-owns-the-boundary.md` | Who | Chapter 08 — Who Owns the Boundary (**new**) | W4 |
| `09-equivalents-and-exceptions.md` | How | Chapter 09 — In-Boundary Equivalents and Documented Exceptions | W4 |
| `10-alternative-collaboration-paths.md` | How | Chapter 10 — Alternative Collaboration Paths | W5 |
| `11-the-authorization-package.md` | How | Chapter 11 — Evidencing the Boundary in the Authorization Package | W4 |
| `appendix-a-what-to-ask-for.md` | Appendix | Appendix A — What to Ask a Cloud Provider For | W2 |
| `appendix-b-platform-host-interfaces.md` | Appendix | Appendix B — Platform Host Interface Reference | W5 |

Appendix series-orders 90 and 91. Reading order: index → 01 … 11 → A → B.
