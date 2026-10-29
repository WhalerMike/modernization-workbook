# B12 Security Operations & Telemetry — chapter-writer brief

Repo worktree: `C:\Users\whale\git\mwb-b12` (branch `book/b12-security-operations`). Book folder: `docs/books/b12-security-operations/`.

**Read the general workbook book rules first and follow them exactly:** `docs/books/_book-writer-brief.md`. Replace its B02
specifics with this book's: front matter `family: b12-security-operations`, `book: B12`; diagram sources go in
`docs/images/diagrams/b12-security-operations/src/chNN-short-name.flow.yaml`, referenced as
`../../images/diagrams/b12-security-operations/svg/chNN-short-name.svg`. Footnote keys `[^cNN-key]` (`[^aX-key]` in
appendices); the site and Word editions render them as chapter endnotes. The site is the **Federal Modernization
Workbook**; the program is "the Federal Modernization Program". Today is 2026-10-21.

**Hard rules:** never write "UIAO" or any other engine/product name for the program; never name a specific agency (no SSA /
Social Security Administration; "Social Security number" is fine); every external claim independently researched against a
primary source you actually opened and endnoted; **never send personal data (email addresses, names) to any website,
including in HTTP headers or User-Agent strings** — if a site requires that, skip it and use another primary source; the
workbook is guidance, not policy: say "requires" only with a cited requirement, and label program design as design.
Prefer CyberArk where a PAM product example is needed. Defensive content only: detection, response, hardening, evidence —
no offensive or enumeration tooling.

Book 12 answers **"Why can't you defend what you can't see?"** Its argument: detection and response are only as good as
the telemetry that reaches them; a log warehouse is not a detection engine (AU-6 needs analysis, not storage); telemetry
must be emitted deliberately from every plane (identity, cloud platform, Microsoft 365, endpoints, network, data) under one
evidence contract whose join key is authoritative asset identity plus time; vulnerability, patch, configuration, posture and
data-protection findings feed the same queue; detections need rules, rules need response, and both need evidence that an
assessor can verify. Remediation has no substitute: a finding closes only when the thing is fixed, with proof.

## Sources

| Source | Words | Feeds | After the book |
|---|---|---|---|
| `docs/compliance/Vol_III_Book_00_Security_Operations_Overview.md` | 550 | Ch01 | stays (Federal Compliance volume, also B14; link on GitHub) |
| `docs/compliance/Vol_III_Book_07_Multi_Cloud_Evidence_Fabric.md`, `docs/modernization-specs/telemetry.md` | 2,200 | Ch02, Ch12 | volume stays; spec archived |
| `docs/operational-guides/siem-telemetry-emission/01-entra-id.md` | 2,060 | Ch03 | archived |
| `docs/operational-guides/siem-telemetry-emission/02-azure-platform.md`, `03-m365-unified-audit.md` | 3,170 | Ch04 | archived |
| `docs/compliance/Vol_III_Book_06_SIEM_XDR_Detection.md` | 9,520 | Ch05, Ch11 | stays |
| `docs/compliance/Vol_III_Book_02_Vulnerability_Management.md` | 8,590 | Ch06 | stays |
| `docs/compliance/Vol_III_Book_03_Patch_Systems_Management.md`, `Vol_VI_Book_06_Configuration_Baselines_Hardening.md` | 4,380 | Ch07 | stay |
| `docs/compliance/Vol_III_Book_04_Cloud_Native_Posture.md` | 2,220 | Ch08 | stays |
| `docs/compliance/Vol_III_Book_05_Data_Protection_Purview.md`, `Vol_VI_Book_05_Data_Protection_Deployment.md` | 10,050 | Ch09 | stay |
| `docs/compliance/Vol_VI_Book_03_Detection_Engineering.md`, `Vol_VI_Book_04_Response_Automation_SOAR.md` | 2,280 | Ch11 | stay |
| `docs/compliance/Vol_III_Book_01_Privileged_Access_Management.md` | — | reference only (Book 04 carries PAM) | stays |

Write each chapter fresh from the sources, keeping the author's argument and terms. The compliance volumes stay in the
repository (Book 14 will use them too): **link them on GitHub** for control-level depth as
`https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/<file>.md`; never link the two archived
sources. Sources marked "Draft Proposal — Subject to Review", "Date Code" stamps and internal theme/phase labels (Theme F,
"Phase 5 — The RedHat-on-AWS Estate Lands Here") are not carried as-is: carry the substance, drop the stamps. Restore
code into fenced blocks; put the illustrative-code `callout-warning` before the first code block in a chapter; verify every
cmdlet, table and column name on Microsoft Learn. Verify every directive number and date in the sources (for example the
source's "CISA BOD 26-04 and the KEV Catalog" — confirm the directive number and what it requires on cisa.gov; KEV is BOD
22-01 unless a newer directive supersedes it).

## Settled facts in published books (read, link, don't contradict)

- **Logging:** OMB M-26-14 (May 22, 2026) rescinded M-21-31; logs searchable for 6 months and retrievable for 1 year
  ([Book 08](../b08-ddi/index.md), [Book 02](../b02-identity/index.md)). CISA's **Comprehensive** Log Aggregation
  Warehouse (CLAW) — renamed from "Cloud" in the July 2025 TIC Program Guidebook revision; telemetry continuity when
  branches leave MTIPS is [Book 09 Ch03](../b09-network/03-what-tic-3-requires.md). Protective DNS and DNS query logging:
  [Book 08](../b08-ddi/index.md).
- **SCuBA / BOD 25-01** and ScubaGear evidence ingestion: [Book 11 Ch04, Ch09](../b11-zero-trust/index.md). CISA maps
  SCuBA policies to FedRAMP High baseline controls (High contains every Moderate control, so the map serves Moderate
  systems too).
- **Identity and access:** Conditional Access library CA001–CA038, CA090 and PIM in [Book 04](../b04-access/index.md)
  (Tier 0 reviewed monthly, other privileged roles quarterly, never self-review only — program design).
  NTLM detection KQL (SecurityEvent 4624/8004) is in [Book 06 R09](../b06-data-platform/r09-continuous-monitoring-and-closure.md).
- **Devices:** Intune manages client operating systems, not Windows Server; servers are governed through Azure Arc and
  machine configuration (formerly Guest Configuration) ([Book 05](../b05-devices/index.md)). Defender for Servers Plan 1
  and Plan 2 both provide Defender for Endpoint Plan 2 capabilities (Microsoft's FAQ).
- **Boundary:** FedRAMP 2026 — services "certified" in Classes A–D; feature availability differs by cloud; verify each
  Sentinel/Defender/Purview capability's availability in GCC, the Moderate tenant (GCC High only as a comparison) ([Book 10](../b10-cloud-boundary/index.md)).
- **Program:** Book 01's seven phases and six gates G0–G5 ([Book 01 Ch12](../b01-transformation-arc/12-migration-roadmap.md));
  decision rights in [Book 01 Ch09](../b01-transformation-arc/09-who-leads-the-transformation.md) and
  [Book 00 Ch07](../b00-orientation/07-who-runs-the-program.md); the authorizing official alone accepts residual risk.
- Book links: `../bNN-folder/index.md` for B00–B11 (b00-orientation, b01-transformation-arc, b02-identity, b03-hr-identity,
  b04-access, b05-devices, b06-data-platform, b07-pki, b08-ddi, b09-network, b10-cloud-boundary, b11-zero-trust).
  Planned books B13–B17 have no pages yet: name them, link `../index.md`.

## Chapter list (exact file names)

| File | Part | Title | Writer |
|---|---|---|---|
| `index.md` | — | Book 12 — Security Operations & Telemetry (editor) | editor |
| `01-you-cant-defend-what-you-cant-see.md` | Why | Chapter 01 — You Can't Defend What You Can't See | W1 |
| `02-the-evidence-contract.md` | Why | Chapter 02 — Telemetry Is the Precondition: The Evidence Contract | W1 |
| `03-identity-telemetry.md` | What | Chapter 03 — Identity Telemetry from Entra ID | W2 |
| `04-platform-and-m365-telemetry.md` | What | Chapter 04 — Azure Platform and Microsoft 365 Audit Telemetry | W2 |
| `05-from-log-warehouse-to-detection.md` | What | Chapter 05 — From Log Warehouse to Detection: SIEM and XDR | W3 |
| `06-vulnerability-management.md` | What | Chapter 06 — Vulnerability Management | W4 |
| `07-patch-configuration-and-baselines.md` | What | Chapter 07 — Patch, Configuration and Hardening Baselines | W4 |
| `08-cloud-native-posture.md` | What | Chapter 08 — Cloud-Native Posture | W5 |
| `09-data-protection-and-classification.md` | What | Chapter 09 — Data Protection and Classification | W5 |
| `10-who-runs-security-operations.md` | Who | Chapter 10 — Who Runs Security Operations (**new**) | W6 |
| `11-detection-engineering-and-response.md` | How | Chapter 11 — Detection Engineering and Response Automation | W3 |
| `12-evidence-metrics-and-continuous-monitoring.md` | How | Chapter 12 — Evidence, Metrics and Continuous Monitoring | W6 |
| `appendix-a-requirements-mapping.md` | Appendix | Appendix A — Requirements Mapping: Controls, Mandates and Books | W6 |

Appendix series-order 90. Reading order: index → 01 … 12 → A.
