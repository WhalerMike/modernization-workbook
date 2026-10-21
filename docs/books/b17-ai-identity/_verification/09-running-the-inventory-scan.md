# Verification log — Chapter 09, Running the Inventory Scan, Agency and Central

Writer W5, October 21, 2026. Method: OMB M-25-21 PDF from whitehouse.gov (pdftotext); the `ombegov/2025-Federal-Agency-AI-Use-Case-Inventory` repository (README, reporting guidance PDF, data dictionary, standardization report, consolidated CSV), downloaded with a generic User-Agent; the 2024 repository's consolidated CSV for the column check; CISA's CDM program page, CDM dashboards page and the January 2022 CDM overview fact sheet; BOD 23-01 on cisa.gov and the CISA directives index (BOD 23-01 not marked revoked). All counts were computed locally with Python from the public CSV, and the chapter's illustrative PowerShell script was run against the same CSV under PowerShell 7: it reproduced every count in the table (799, 488, 338, 248, 58, 25, 14). The comparison path was exercised against a synthetic prior file built from the same CSV. No personal data was sent anywhere; contact addresses in the CSV were counted, never printed.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | M-25-21 requires the inventory, not a scan of it | Intro | verified | M-25-21 §3(b)(v) |
| 2 | Inventory at least annually, submit to OMB, post publicly; DoD and IC excepted; public version encouraged to be updated continuously | What the scan reads | verified | M-25-21 §3(b)(v) |
| 3 | 2025 cycle: submissions December 22, 2025; public CSV at `/ai` by January 28, 2026 | What the scan reads | verified | 2025 reporting guidance §1(a), §1(b) |
| 4 | 3,611 individually reported, 41 agency submissions with individual use cases, 1,818 deployed or piloted, 445 high-impact, as of April 13, 2026 | What the scan reads | verified | Repository README Summary |
| 5 | Use case ID required; may be removed from public version; email may be replaced with public inquiry address; withheld use cases and fields removed | Two-files table | verified | Data dictionary cols 3, 6; guidance §1(b)(i) |
| 6 | 704 of 3,611 rows have no ID | Two-files table; vintage section | verified (computed) | Consolidated CSV |
| 7 | 338 rows (three agencies) have no stage and no stage-dependent answers; README counts those agencies' use cases as deployed/piloted | Step 1 | verified (computed; README table cross-checked) | CSV; README |
| 8 | 13 IDs appear more than once (28 rows) | Step 1 | verified (computed) | CSV |
| 9 | 13-month staleness; hash and run record; unreadable rows as a finding | Step 1 | restated-as-design | Program design (consistent with Ch07) |
| 10 | Retired use cases reported once in the following inventory; IDs never reused | Step 1 | verified | README "Major Changes"; guidance |
| 11 | File is UTF-8 with BOM; multi-select stored as lists | Step 1 | verified | Data dictionary encoding and list notices |
| 12 | Authorization, PII and contracting questions required only for pilot and deployed | Step 2 | verified | Data dictionary cols 17, 19, 23 |
| 13 | `have_ato` covers AI that is part of another system with an ATO | Step 2 table | verified | Data dictionary col 19 |
| 14 | `pia_url` optional, asks only for a public link | Step 2 table | verified | Data dictionary col 24 |
| 15 | Counts: 1,480 live with stage; 38 agentic of which 14 without Yes (10 No, 4 blank); 799 no ATO answer (596 No, 203 blank); 58 Yes with no system name; 488 no contact; 25 blank bureau; 337 PII, 248 without PIA link; 1,064 with at least one | Step 2 results table | verified (computed) | CSV |
| 16 | Source's 14/596/488/248 and "1,480 live systems" reproduce; 596 omits 203 blanks; use cases not systems | Step 2 | corrected | CSV; Ch03 |
| 17 | Order of work, report columns, remediation table | Steps 3–5 | restated-as-design | Program design; severities from Ch07 and Book 13 Ch06 |
| 18 | `is_high_impact` identifies high-impact use cases | Step 3 | verified | Data dictionary col 9 |
| 19 | 2024 consolidated public file has no use-case ID column (62 columns, 2,133 rows) | Annual refresh | verified (inspected) | 2024 repository `data/2024_consolidated_ai_inventory_raw_v2.csv` |
| 20 | CDM "provides cybersecurity tools, integration services, and dashboards to participating agencies"; four capability areas | Central model | verified | CISA CDM program page; CDM overview fact sheet (Jan 2022) |
| 21 | Agency Dashboard "displays data about devices, users, privileges, and vulnerabilities"; object-level view; pushes summary to Federal Dashboard for CISA and OMB | Central model | verified | CISA "CDM Agency and Federal Dashboards" |
| 22 | Shared Services Platform for non-CFO Act agencies | Central model | verified | CISA CDM program page |
| 23 | CDM IAM capability: PRIV, TRUST, CRED, BEHAVE | Central model | verified | CDM overview fact sheet (Jan 2022) |
| 24 | Source: CDM "ran discovery centrally against agency-provided data" | Central model | corrected | CISA pages above: tools deployed to agencies, summaries flow up |
| 25 | BOD 23-01: discovery every 7 days, enumeration every 14 days, ingestion to CDM Agency Dashboard; scope excludes ephemeral assets and third-party SaaS; October 3, 2022 | Central model | verified | BOD 23-01 page |
| 26 | No directive or memo requires checking AI credentials against the inventory | Central model | verified (absence, by reading M-25-21 and BOD 23-01; OMB memoranda index through M-26-19 shows no newer AI memo) | M-25-21; BOD 23-01; OMB memoranda index |
| 27 | Four tiers; 72-hour/30-day windows recast as acknowledgment windows | Four tiers | restated-as-design | Source proposal; reconciled with Book 13 Ch06 response targets |
| 28 | Source: central scan "under two minutes for all 1,480 live systems" | — | removed | Unverifiable performance claim |
| 29 | Source: OFCIO runs the scan "for all 56 agencies" | — | restated-as-design | No federal program runs it; 56 is agency submissions, 41 with individual use cases (README) |
| 30 | Excluded categories: NSS, IC, DoD (Department of War) use cases, most research, withheld | Central limits | verified | README Exclusion Criteria |
| 31 | Common COTS AI reported in aggregate | Central limits | verified | Guidance §1(a)(i) |
| 32 | Source finding codes (`DRIFT-COMPLIANCE::…`) | — | removed (translated to plain finding names per brief) | Brief |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| index.md — opening ("over 1,800 AI systems … almost none governed") | Ch09 "What the scan reads" (real counts) | Count corrected: 1,818 deployed or piloted use cases; "almost none governed" unverifiable, not carried; Ch01/Ch03 own the framing |
| index.md — "runnable two ways" (manual and governed paths) | Ch09 intro: agency and central forms | Governed-path product framing dropped |
| index.md — download-the-kit callout | Ch09 intro and warning callout | Script not in repository; described as method |
| index.md — "The problem this kit solves" (no identity fields) | Ch03 (W2); Ch09 Step 2 caveats | — |
| index.md — "What the kit does" phase table | Ch09 Steps 1–5 and figure | Phase 4 "registry" product step generalized to agency remediation |
| index.md — "Who this is for" | Ch09 roles in remediation table; Ch08 | OMB schema-extension audience not carried (advocacy) |
| index.md — Background reading, normative specs | — | Internal IDs and links; never linked per brief |
| index.md — Deployment options (standalone vs governed adapter) | Ch09 agency/central split | Adapter-slot product mechanics dropped |
| central-deployment.md — intro (public CSV, central run, CDM pattern) | Ch09 "The central model" | "56 agencies" and OFCIO operator restated as program proposal |
| central-deployment.md — "The CDM analogy" and table | Ch09 "What CDM actually does" and comparison table | Corrected: CDM delivers tools to agencies; summaries flow up |
| central-deployment.md — "The four-tier model" | Ch09 four-tier table and figure | — |
| central-deployment.md — Tier 0 (input, scanner commands, output files, finding types, 2025 results) | Ch09 Steps 2 and 4, results table, illustrative script | Kit commands and Python module path not carried (not in repo); per-agency file names named agencies, not carried; results re-computed and corrected |
| central-deployment.md — Tier 1 (P1 72-hour, P2 30-day windows; contents of each P2 finding) | Ch09 four tiers (windows as acknowledgment windows); report columns | "Post the April 15, 2026 compliance deadline … documented failures" removed: the high-impact deadline was April 3, 2026, and an inventory answer isn't a documented failure |
| central-deployment.md — Tier 2 (four remediation steps; loop closure via inventory update) | Ch09 Step 5 table; "close only on observation" | "L1–L3 governance mode" internal vocabulary dropped |
| central-deployment.md — "What is not required at Tiers 0–2" | Ch09 four-tier table "What it needs" and the derived-not-asserted paragraph | SailPoint mention dropped (vendor) |
| central-deployment.md — "The gap the central scan cannot close" | Ch09 "What a central scan can't close" and figure | Adapter name and "Book 21" reference dropped |
| central-deployment.md — "The missing enforcement mechanism" | Ch09 CDM section, last paragraph | BOD concept paper and GitHub issue not carried (internal) |
| central-deployment.md — "Running the central scan" (commands, output tree) | Ch09 illustrative script | Agency-named output files not carried |
| governed-path.md — annual inventory refresh cycle | Ch09 "The annual refresh"; Ch10 cadence | Adapter automation restated as method |
| governed-path.md — drift engine integration table | Ch07 (W4); Ch09 Step 3 references it | Not duplicated |

## Notes for the editor

- The OMB README's "1,818 deployed and piloted" and the CSV's 1,480 with a recorded stage differ by the 338 stage-less rows from three agencies; Ch03 (W2) and Ch09 both state this. The chapter doesn't name the agencies.
- Book 13 Ch06 response targets (P1 immediate, P2 one hour) are not contradicted: the source's 72-hour/30-day windows are carried only as acknowledgment windows for central delivery.
