# B15 Compliance Automation & Day-2 Operations — chapter-writer brief

Repo worktree: `C:\Users\whale\git\mwb-b15` (branch `book/b15-day2-operations`). Book folder: `docs/books/b15-day2-operations/`.

**Read the general workbook book rules first and follow them exactly:** `docs/books/_book-writer-brief.md`. Replace its B02
specifics with this book's: front matter `family: b15-day2-operations`, `book: B15`; diagram sources go in
`docs/images/diagrams/b15-day2-operations/src/chNN-short-name.flow.yaml`, referenced as
`../../images/diagrams/b15-day2-operations/svg/chNN-short-name.svg`. Footnote keys `[^cNN-key]` (`[^aX-key]` in
appendices), rendered as chapter endnotes. The site is the **Federal Modernization Workbook**; the program is "the Federal
Modernization Program". Today is 2026-10-21.

**Hard rules:** never write "UIAO" or any other engine/product name for the program; never name a specific agency (never
carry Quarto shortcodes like `{{< meta agency.short >}}`; write "the agency"); every external claim independently
researched against a primary source you actually opened and endnoted; never send personal data (email addresses, names)
to any website, including in HTTP headers; guidance, not policy — "requires" only with a cited requirement, program
design labeled as design; keep line endings as found (Python byte counts); defensive content only; no tenant-changing
"run this in production" instructions — scripts are illustrative, read-only first, with the warning callout.
**Translate internal vocabulary** as in Books 13–14: no "canon", "substrate", internal IDs (ADR-nnn, volume/book numbers
as identifiers in prose), capitalized doctrine names, or internal counts. Commercial products (ServiceNow, Microsoft,
AWS, VMware/Broadcom) may be named as the platforms the sources describe, never endorsed; verify every product claim on
the vendor's own documentation, and check FedRAMP status on the FedRAMP Marketplace data before stating it.

Book 15 answers **"Why does modernization succeed or fail at the help desk?"** Its argument: a modernized estate is judged
on day two — whether the help desk can reset, unlock, provision and recover safely under the new model; whether every
request is routed, authorized and evidenced; whether the CMDB knows what exists; and whether control evidence is
produced continuously by automation rather than assembled before an audit. Operations is where modernization either
becomes routine or quietly reverts.

## Settled facts in published books (read, link, don't contradict)

- **Authority and tempo:** routine remediation as a ticket to a machine, approval gates, change classes
  ([Book 13 Ch10, App B](../b13-governance/10-ticket-to-machine.md)); the actuation ladder L0–L4 with L3 gated actuation as
  the default ceiling ([Book 01 Ch11](../b01-transformation-arc/11-analysis-plan-delivery.md)); decision rights
  ([Book 01 Ch09](../b01-transformation-arc/09-who-leads-the-transformation.md), [Book 00 Ch07](../b00-orientation/07-who-runs-the-program.md),
  [Book 13 Ch09](../b13-governance/09-who-governs.md), [Book 14 Ch10](../b14-compliance/10-who-owns-compliance.md)).
- **Privileged access:** PIM tiers, approval, Tier 0 reviewed monthly and others quarterly, never self-review only
  (program design) — [Book 04](../b04-access/index.md); help-desk roles and administrative units — [Book 02 Ch05](../b02-identity/05-delegation-without-ous.md),
  [Book 04 Ch04, Ch08](../b04-access/index.md). Identity proofing for resets: verify against NIST SP 800-63-4 (July 2025).
- **Evidence:** the evidence contract (asset identity plus time) — [Book 12 Ch02](../b12-security-operations/02-the-evidence-contract.md);
  evidence over attestation, adapters, drift — [Book 13](../b13-governance/index.md); the authorization package, POA&M,
  OSCAL (current release 1.2.3) — [Book 14 Ch11](../b14-compliance/11-the-authorization-package.md); the asset inventory
  (CM-8) as the precondition for patching (SI-2) — [Book 12 Ch07](../b12-security-operations/07-patch-configuration-and-baselines.md).
- **FedRAMP 2026:** classes A–D; KSIs (46 in 10 themes) bind providers, not agencies; the Consolidated Rules launched
  June 25, 2026. **Directives:** BOD 26-04 (June 10, 2026); M-26-14 logging; M-26-05 SBOM change; M-26-15 PQC.
- Book links: `../bNN-folder/index.md` for B00–B14 (… b13-governance, b14-compliance). Planned B16 and B17: name them,
  link `../index.md`.

## Sources (archived after the book is built — never link to them)

| Source | Words | Feeds |
|---|---|---|
| `docs/operational-guides/helpdesk-entra-operations/index.md`, `docs/compliance/Vol_IX_Book_00_Day2_Operations_Overview.md` | 2,170 | Ch01 |
| `docs/compliance/Vol_VI_Book_00_Implementation_Overview.md`, `Vol_VII_Book_00_ServiceNow_Automation_Overview.md`, the framing of `docs/compliance/Operator_Runbook_Day2_Compliant.md` | 3,820 | Ch02 |
| `docs/operational-guides/helpdesk-entra-operations/helpdesk-flow.md` | 1,880 | Ch03 |
| `docs/operational-guides/helpdesk-entra-operations/help-desk-administrative-responsibilities.md` (10,430 words) | 10,430 | Ch04 (the model and the high-risk tasks), App A (the task reference) |
| `docs/compliance/Vol_IX_Book_01_Helpdesk_ITSM_Catalog.md`, `Vol_IX_Book_04_Teams_Telephony_Catalog.md` | 2,630 | Ch05 |
| `docs/compliance/Vol_IX_Book_05_SaaS_Integration_Governance.md` | 5,700 | Ch06 |
| `docs/compliance/Vol_VII_Book_01_CMDB_Reconciliation_Asset_Identity.md` | 1,370 | Ch07 |
| `docs/compliance/Vol_VII_Book_02_M365_Control_Compliance_Automation.md`, `Vol_VII_Book_03_Azure_Control_Compliance_Automation.md` | 3,920 | Ch08 |
| `docs/compliance/Vol_VII_Book_06_AWS_Control_Compliance_Automation.md`, `Vol_VII_Book_07_VMware_Control_Compliance_Automation.md` | 8,970 | Ch09 |
| `docs/compliance/Vol_VII_Book_04_Control_Attestation_Evidence_KSI.md`, `Vol_VII_Book_05_ServiceNow_Compliance_App.md`, `Vol_VI_Book_07_Evidence_ConMon_Pipeline.md`, `docs/compliance/Compliance_ServiceNow_Kit_Expansion_Roadmap.md` | 5,640 | Ch11 |
| `docs/compliance/Operator_Runbook_Day2_Compliant.md`, `Vol_VI_Book_08_Validation_Test_Harnesses.md` | 3,870 | Ch12 |

Write each chapter fresh from the sources, keeping the author's argument. Note honestly where a platform's own native
products already cover part of the design (for example ServiceNow's own compliance and continuous-monitoring
applications): verify on ServiceNow's documentation and present the program's design as one option.

## Chapter list (exact file names)

| File | Part | Title | Writer |
|---|---|---|---|
| `index.md` | — | Book 15 — Compliance Automation & Day-2 Operations (editor) | editor |
| `01-the-help-desk-decides.md` | Why | Chapter 01 — Modernization Succeeds or Fails at the Help Desk | W1 |
| `02-day-two-is-where-compliance-lives.md` | Why | Chapter 02 — Day Two Is Where Compliance Lives or Dies | W1 |
| `03-intake-triage-and-routing.md` | What | Chapter 03 — Intake, Triage and Routing | W2 |
| `04-help-desk-authority-in-entra.md` | What | Chapter 04 — Help Desk Authority in Entra ID | W3 |
| `05-the-service-catalogs.md` | What | Chapter 05 — The Service Catalogs: ITSM and Teams Telephony | W4 |
| `06-saas-integration-governance.md` | What | Chapter 06 — SaaS Integration Governance | W4 |
| `07-the-cmdb-and-asset-identity.md` | What | Chapter 07 — The CMDB and Asset Identity | W5 |
| `08-control-automation-m365-and-azure.md` | What | Chapter 08 — Control Compliance Automation: Microsoft 365 and Azure | W6 |
| `09-control-automation-aws-and-vmware.md` | What | Chapter 09 — Control Compliance Automation: AWS and VMware | W6 |
| `10-who-runs-day-two.md` | Who | Chapter 10 — Who Runs Day Two (**new**) | W5 |
| `11-attestation-and-the-compliance-app.md` | How | Chapter 11 — Attestation, Evidence and the Compliance Application | W7 |
| `12-the-day-two-runbook.md` | How | Chapter 12 — The Day-Two Operator Runbook and Validation | W7 |
| `appendix-a-help-desk-task-reference.md` | Appendix | Appendix A — Help Desk Task Reference | W3 |

Appendix series-order 90. Reading order: index → 01 … 12 → A.
