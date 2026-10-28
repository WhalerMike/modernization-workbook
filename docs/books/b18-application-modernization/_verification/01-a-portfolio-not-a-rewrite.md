# Verification — Chapter 01, A Portfolio, Not a Rewrite

## Sources opened

Opened October 28, 2026: GAO-25-107795 product page (gao.gov) and the full public report PDF (text extracted locally and read: Highlights, pages 1–12 and 17–22); GAO-19-471 product page; OMB Circular A-130 (2016 revision) PDF on whitehouse.gov (§5.a(1)–(3), §5.d(1)); FAR 39.103 on acquisition.gov (FAC 2026-01, effective March 13, 2026); Martin Fowler, "Strangler Fig" (martinfowler.com, August 22, 2024); AWS Cloud Enterprise Strategy Blog, "6 Strategies for Migrating Applications to the Cloud" (2016); AWS Prescriptive Guidance, "About the migration strategies"; Microsoft Learn, Cloud Adoption Framework, "Select your cloud migration strategies" (MCP search and fetch). Manual checks: Gartner's original research note on the five migration options is paywalled (HTTP 403) and was not consulted; the chapter dates the options from AWS's statement ("outlined by Gartner in 2011") and says "early 2010s". The brief's "Gartner's 2010" is not confirmed on a primary source: AWS gives 2011.

Agency-neutrality: GAO's examples name specific departments and programs; none is carried. The chapter uses only government-wide GAO figures. One GAO example detail was removed in drafting because it pointed to a single program.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Federal IT and cyber spending more than $100 billion a year; agencies typically report about 80 percent on O&M of existing IT | Opening | verified | GAO-25-107795 Highlights, p. 1 |
| 2 | FY 2025: about $83 billion (79 percent) of planned IT spending for O&M, 24 CFO Act agencies, per IT Dashboard | Opening; table | verified | GAO-25-107795 p. 4 |
| 3 | 2019: about 80 percent of more than $90 billion planned for FY 2019 | Opening; table | verified | GAO-19-471 product page |
| 4 | Extent of legacy IT unknown; OMB doesn't require agencies to say whether investments are legacy | Opening | verified | GAO-25-107795 p. 4 |
| 5 | 2019: 65 systems from 24 agencies reviewed; 10 most critical at 10 agencies; 8 to 51 years old | Table | verified | GAO-19-471 product page |
| 6 | 2019: 8 of 10 agencies lacked complete plans; 3 had no documented plan | Table | verified | GAO-19-471 product page |
| 7 | 2025: 69 systems reviewed; 11 most in need at 10 agencies; about 23 to 60 years; about $754 million a year to operate and maintain | Table | verified | GAO-25-107795 Highlights, p. 18 |
| 8 | 2025: 3 of 11 systems had plans with all three key elements; 2 systems had no plan | Table | verified (9 of 11 had plans; 3 complete) | GAO-25-107795 pp. 21–22; product page |
| 9 | 8 of 11 use outdated languages such as COBOL and assembly; 4 unsupported hardware or software; 7 known vulnerabilities not remediable without modernization | Scale | verified | GAO-25-107795 Highlights, p. 20 |
| 10 | 2019 list: 3 of 10 completed by February 2025; 4 within a few years, 2 in five or more, 1 no date | Scale | verified | GAO-25-107795 Highlights |
| 11 | Matter for Congress: require modernization plans; no legislative action as of February 2026 | Scale | verified | GAO-25-107795 product page |
| 12 | Four risks: security, unmet mission needs, staff shortage (COBOL), increased cost; premium for specialized staff | Scale | verified | GAO-25-107795 p. 7 |
| 13 | Three key plan elements: milestones, description of the work, disposition of the legacy system | Scale | verified | GAO-25-107795 pp. 2, 21 |
| 14 | GAO examples include efforts abandoned over planning, cost and time to deliver, and investments taking over a decade partly for lack of manageable segments, counter to OMB policy | Big-bang | verified, stated without naming the agencies | GAO-25-107795 pp. 8–10 |
| 15 | Fowler: smaller pieces less risk, earlier value, existing behavior hard to specify and partly unwanted, transitional code worth it | Big-bang | verified (paraphrased) | Fowler 2024 |
| 16 | A-130: useful segments, narrow scope, brief duration; award within 180 days; deliver within 18 months | Big-bang | verified (quoted under 15 words) | A-130 §5.d(1)(f)–(g) |
| 17 | FAR 39.103 implements 41 U.S.C. 2308; modular contracting for major IT to maximum extent practicable; increments workable and not dependent on later ones | Big-bang | verified | FAR 39.103(a)–(b) |
| 18 | A-130: inventory of major information systems | Unit of decision | verified | A-130 §5.a(1)(a)(i) |
| 19 | A-130: EA with baseline, target, transition plan; should incorporate plans for upgrades, replacements and disposition (quoted) | Unit of decision | verified | A-130 §5.a(2) |
| 20 | A-130: unsupported systems "phased out as rapidly as possible" with migration planning in budgeting | Unit of decision | verified | A-130 §5.a(3)(f) |
| 21 | Gartner five options, AWS dates to 2011; AWS seven and Microsoft eight options | Unit of decision | verified for AWS and Microsoft; Gartner date from AWS (manual check above) | AWS blog; AWS PG; Microsoft CAF |
| 22 | The six dispositions, the decision record, the four-part argument | Unit of decision; argument | restated-as-design | Program design |
| 23 | Most applications need no engineering; retire and retain cheapest | Unit of decision | restated-as-design | Program design |
| 24 | Eleven systems at $754 million are a small share of $83 billion | Scale | verified arithmetic on cited figures | GAO-25-107795 |

## Diagrams

- `docs/images/diagrams/b18-application-modernization/src/ch01-portfolio-not-rewrite.flow.yaml` — the book's argument (program design). Not rendered.
