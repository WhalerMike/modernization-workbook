# Verification — Chapter 01, Data Inventory and Classification

Writer: Book 20 build (Nov 11, 2026). All sources opened Nov 11, 2026. Claims sourced to Microsoft Learn: 11.

## Claims log

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | CISA ZTMM Data pillar functions | Introduction | verified | CISA ZTMM v2.0 §5.5 | Nov 11, 2026 |
| 2 | Label stored in clear text in metadata; persistent | Why protection has to travel | verified | Learn, "Learn about sensitivity labels" (learn.microsoft.com/purview/sensitivity-labels) | Nov 11, 2026 |
| 3 | Keep labels few; effectiveness drops beyond five main labels or five sublabels | The authoritative data classes | verified | Learn, "Learn about sensitivity labels," Sensitivity label limitations per tenant | Nov 11, 2026 |
| 4 | AC-16, MP-3, CM-12, PM-5(1), RA-2 control intent | Why protection has to travel | verified | NIST SP 800-53 Rev. 5 OSCAL catalog 5.2.0 | Nov 11, 2026 |
| 5 | Class register fields and small starting set | The authoritative data classes | restated-as-design | Program design, building on Book 12 Ch09 | Nov 11, 2026 |
| 6 | CUI is the only lawful category; no other controls | The federal overlay decisions | verified | 32 CFR 2002.1(c), 2002.12(a) (eCFR versioner, as of Oct 1, 2026) | Nov 11, 2026 |
| 7 | CUI Basic / Specified definitions | The federal overlay decisions | verified | 32 CFR 2002.4(j), (r) | Nov 11, 2026 |
| 8 | CUI Basic at no less than moderate confidentiality | The federal overlay decisions | corrected | 32 CFR 2002.14(g); the first draft cited §2002.14(c) | Nov 11, 2026 |
| 9 | No alternative markings; category markings mandatory for Specified | The federal overlay decisions | verified | 32 CFR 2002.20(b) | Nov 11, 2026 |
| 10 | FIPS 199 and SP 800-60 for categorization | The federal overlay decisions | verified | FIPS 199; SP 800-60 Vol. 1 Rev. 1 | Nov 11, 2026 |
| 11 | Content explorer roles: List viewer and Content viewer, independent, supersede item permissions | Inventory | verified | Learn, "Get started with Content Explorer (classic)"; "Get started with data explorer" | Nov 11, 2026 |
| 12 | Counts update in up to 7 days, 14 for SharePoint | Inventory | verified | Learn, "Get started with Content Explorer (classic)," Export | Nov 11, 2026 |
| 13 | Content explorer access audited (LabelContentExplorerAccessedItem) | Inventory | verified | Learn, "Audit log activities," Content explorer activities | Nov 11, 2026 |
| 14 | Export-ContentExplorerData output; one SIT per script; reconnect after about an hour; page cookie | Inventory | verified | Learn, "Export-ContentExplorerData" | Nov 11, 2026 |
| 15 | Workload values EXO, ODB, SharePoint | Inventory | verified | Learn, "Export-ContentExplorerData," examples (the page lists no accepted values) | Nov 11, 2026 |
| 16 | TagType value Sensitivity for labels | Inventory | unverifiable | Not listed on the Learn page; the chapter tells the reader to confirm it on a test tenant | Nov 11, 2026 |
| 18 | Explorer interfaces need E5/A5/G5; aggregation continues for E3; scanner discovery with E3 | Inventory | verified | Learn, "Microsoft Purview service description" | Nov 11, 2026 |
| 19 | Government availability rows (content explorer, Teams data, activity explorer, EDM, named entities, scanner) | Inventory | verified | Learn, "Plan for Microsoft Purview compliance and risk management solutions – GCC deployments", Step 4 | Nov 11, 2026 |
| 20 | Decision record template fields | Decision record template | restated-as-design | Program design from the closure instructions' required fields | Nov 11, 2026 |

## Government-cloud gaps

- Commercial status of "Content explorer includes Teams data" and of named entity SITs: not yet specified (the government pages describe differences from enterprise plans).
