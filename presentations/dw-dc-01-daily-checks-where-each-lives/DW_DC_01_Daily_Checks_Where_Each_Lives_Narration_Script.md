# Building the Daily Checks Workbook, Chapter 01 — The Daily Checks and Where Each One Lives — narration script (practice copy)

## Slide 1 — Chapter 01: The Daily Checks and Where Each One Lives

Welcome to Building the Daily Checks Workbook. This is Chapter 1: the daily checks, and where each one lives. Before anything is drawn on a dashboard, each daily check in the operator runbook gets one row: what it reads, where else to look, and whether a workbook can show it at all. We'll start from what Microsoft Learn gives you, see what it leaves to you, read the kit's manifest and its ten tabs, and walk two labs. The chapter is a draft awaiting the owner's review, and the code is illustrative, tested against fixtures.

## Slide 2 — Why one row per daily check

Why start with a list? The operator runbook asks for ten checks every morning, and most of them are done one portal at a time. Some of that data is already in the Sentinel workspace; some of it never will be. So the goal is to say, for every daily check, which table shows it, where the operator looks when Log Analytics doesn't have it, and how much a workbook tab can be trusted to show. It's for the developers who maintain the kit and the security operations lead who owns the workspace, and you don't need a tenant until Lab 2.

## Slide 3 — What Microsoft Learn gives you

Here's what Microsoft Learn gives you. Its guidance on visualizations recommends workbooks for reports across Azure sources, and lists the other options. Its table reference pages give each source table and its columns, from sign-in logs to Intune's compliance export. Sentinel's health table covers only the connectors Learn lists, and only once health monitoring is turned on. The Logs Ingestion API sends your own records to a custom table ending in underscore C L. Entra Health monitoring is a preview in the admin center and by e-mail. And Intune exports compliance once a day, up to forty-eight hours late.

## Slide 4 — What it leaves to you

What does it leave to you? Learn gives a table per source, and the runbook gives the checks in prose, but nobody says which table shows which check. So the kit has one manifest row per daily check. Some checks have no data in Log Analytics at all, and a tab built on missing data looks healthy: those become link-out tabs, with no tables and the click path instead. Freshness is per source, so each expected table gets its own limit. And because availability is spread across pages, each tab carries its GCC note. Every row here is pinned by a test.

## Slide 5 — The manifest: ten tabs, one per check

Here's the manifest. Ten tabs, one per daily check. Eight read tables: telemetry completeness, the synchronization probe, risky users and sign-ins, emergency access sign-ins, noncompliant devices, grants, D L P alerts, and the log review queue. Two are link-outs: Entra Health, because its alerts aren't in Log Analytics, and the catalog tasks, which live in the I T S M tool. Two of the eight are partial. The grants tab lists grants, but matching each to a ticket stays in the I T S M tool. And the log review tab shows the queue, while the review itself stays a recorded procedure.

## Slide 6 — Who keeps the manifest, and the data

Who does what? Security operations owns the workspace, the manifest and the freshness limits. Developers own the kit, its queries and its tests. And the operators read their own family's tabs each morning. Lab 1 needs nothing but PowerShell: it reads the kit's own files. Lab 2 needs Log Analytics Reader on a test workspace; it only reads the table list, then signs out. A reviewer checks that each link-out has its click path and an allowed host.

## Slide 7 — Lab 1: list the tabs

Lab 1, in the kit's folder, with no tenant. Step 1 lists the tabs: ten of them, with the telemetry row left off the slide. Notice that entra health and tasks read no table at all, and that grants and log review are partial. Step 4 counts the tabs by fit: four strong, two good, two partial, one weak, and one link-out.

## Slide 8 — Lab 1: a link-out tab and a partial one

Step 2 opens a link-out tab. Entra Health has no table: the tab sends the operator to the Entra admin center, under Monitoring and health, then Health. Its G C C availability is not yet specified, so nothing is built on its data. Step 3 opens a partial tab. The grants tab reads the Entra audit logs, but its action says it plainly: each row is matched to its ticket in the I T S M tool, and a grant with no ticket opens a finding.

## Slide 9 — Lab 1: the query and the freshness limits

Step 5 reads the emergency access query. It's Microsoft's own sign-in query from its emergency access guidance, with the accounts' object I D's taken from a parameter instead of written into the query. Step 6 lists the eight expected tables and their limits. Sign-in and audit logs: sixty minutes. Intune's compliance export: two thousand eight hundred and eighty minutes, because it arrives once a day and can take up to forty-eight hours.

## Slide 10 — Lab 2: which tables does the workspace have?

Lab 2 runs in a test workspace, never production, and the authors haven't run it. Sign in to commercial Azure, list the workspace's tables, and print every table a tab reads that the workspace doesn't have. It reads and changes nothing. Every name it prints is a source the guide's first step still has to connect: the probe's custom table until it's created, and the Sentinel health table until health monitoring is on. Then sign out.

## Slide 11 — Evidence, dangers and the checklist

Two outputs support federal requirements. Lab 1 shows every daily check has a home, a table or a link-out, which supports continuous monitoring, C A seven. Lab 2 shows the workspace has each table a tab reads, which also supports system monitoring, S I four. The manifest itself is design, not evidence; the kit's records in later chapters are. The dangers: a tab built on data G C C doesn't have, one freshness limit for every source, and a partial tab read as complete. Next, Chapter 2 builds the workbook's template and its validator.
