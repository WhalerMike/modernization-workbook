# B07 PKI & Certificates — chapter-writer brief

Repo worktree: `C:\Users\whale\git\mwb-b07` (branch `book/b07-pki`). Book folder: `docs/books/b07-pki/`.

**Read the general workbook book rules first and follow them exactly:** `docs/books/_book-writer-brief.md` (style,
program name, agency-neutral rule, footnote format and verification, diagram house style, verification side file,
boundaries, final report). Replace its B02 specifics with this book's: front matter `family: b07-pki`, `book: B07`;
diagram sources go in `docs/images/diagrams/b07-pki/src/`, referenced as `../../images/diagrams/b07-pki/svg/<name>.svg`.

Book 07 answers **"Why do certificates outlive every migration?"** It turns the workbook's PKI Modernization Guide
(`docs/operational-guides/pki-modernization.md`, about 12,900 words, being archived — never link to it) into a book,
drawing on the Federal Compliance book on certificates and tokens
(`docs/compliance/Vol_I_Book_03_Certificates_Tokens_Cryptographic_Identity.md`, stays in place — link it for depth).

## Rules specific to this book

- **Defensive framing only.** The guide's ESC1–ESC8 section describes AD CS misconfigurations. Write them as a
  hardening and detection checklist: what the misconfiguration is in one sentence, how to detect it (audit settings,
  event IDs, template/CA settings to check) and how to fix it, with Microsoft or recognized-vendor sources. Don't
  include exploitation steps, tool commands that abuse a weakness, or attack walkthroughs. Don't reproduce the guide's
  PowerShell assessment module (its Appendix C); it stays in the archive pending a technical review — say so where
  relevant.
- **Vendor position for certificate lifecycle management.** Where the book discusses certificate lifecycle management
  or machine-identity tooling, the program's existing vendor is **CyberArk** (CyberArk Certificate Manager, formerly
  Venafi). Present it as the program's choice for consolidation and don't recommend adding a second CLM vendor such as
  Keyfactor. Verify current CyberArk product names and capabilities on cyberark.com / docs.cyberark.com; keep the rest
  of the book vendor-neutral and Microsoft-native where Microsoft covers the need.
- **Stay consistent with facts already verified in other books** (read the passages, link them):
  - Book 03 Chapter 09 `../b03-hr-identity/09-credentials-and-certificates.md` — PIV issuance and termination
    (18-hour rule), derived PIV, certificate binding, Entra CBA, Cloud PKI facts (licensed separately; available in GCC
    High, not DoD; CRL validity seven days).
  - Book 05 Chapters 04, 08 and 09 — Intune certificate profiles (SCEP/PKCS), BitLocker etc.; **Intune doesn't manage
    Windows Server** and **Cloud PKI issues only to Intune-managed devices**, so server certificates need another issuer.
  - Book 06 Chapter 22 `../b06-data-platform/22-where-sql-server-touches-adcs.md` — SQL Server's AD CS dependencies;
    domain-controller certificates; TLS. (Book 06 is on another branch; link by that path.)
  - Book 02 Chapter 04 `../b02-identity/04-the-hidden-migration-surface.md` — PKI as an AD dependency adapter; Entra
    CBA validates certificates but isn't a CA; its CRL must be at an internet-facing HTTP address.
- **Dates and limits change** (e.g. public TLS certificate maximum lifetimes under the CA/Browser Forum's reductions,
  KB5014754 strong-mapping enforcement phases, Cloud PKI limits and pricing tiers). Verify as of 2026-10-20 and footnote.

## Chapter list (exact file names)

| File | Part | Title |
|---|---|---|
| `index.md` | — | Book 07 — PKI & Certificates (editor) |
| `01-why-certificates-outlive-every-migration.md` | Why | Chapter 01 — Why Certificates Outlive Every Migration |
| `02-what-ad-cs-holds-up.md` | What | Chapter 02 — What AD CS Holds Up |
| `03-hardening-what-stays.md` | What | Chapter 03 — Hardening What Stays |
| `04-the-target-pki.md` | What | Chapter 04 — The Target PKI: Cloud PKI, AD CS and Federal PKI |
| `05-who-owns-the-certificate-estate.md` | Who | Chapter 05 — Who Owns the Certificate Estate |
| `06-device-and-user-certificates.md` | How | Chapter 06 — Device and User Certificates: Intune and Entra CBA |
| `07-coexistence-and-migration.md` | How | Chapter 07 — Coexistence and Migration |
| `08-lifecycle-monitoring-and-decommissioning.md` | How | Chapter 08 — Lifecycle, Monitoring and Decommissioning |
| `appendix-a-deployment-checklists.md` | Appendix | Appendix A — Cloud PKI and CBA Deployment Checklists |
| `appendix-b-template-migration-matrix.md` | Appendix | Appendix B — Certificate Template Migration Matrix |

Appendix series-orders are 90 and 91. Every section of the source guide must land in a chapter or be logged in a
carry-forward ledger as not carried (with the reason).
