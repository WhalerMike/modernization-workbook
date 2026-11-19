# Building the Daily Checks Workbook, Chapter 02 — The Workbook Template and Its Validator — narration script (practice copy)

## Slide 1 — Chapter 02: The Workbook Template and Its Validator

Welcome back to Building the Daily Checks Workbook. This is Chapter 2: the workbook's template, and its validator. A workbook edited in the portal is a change nobody reviewed, so the kit keeps it as a file and checks every copy against the manifest. We'll start from Microsoft Learn's page on workbooks as Resource Manager templates, see what it leaves to you, read how the template is built and the ten checks the validator runs, and walk two labs. The chapter has been reviewed and approved.

## Slide 2 — Why keep the workbook as a file

Why keep a dashboard as a file? Because a workbook edited in the portal is a change nobody reviewed, and an export of it can carry the subscription, resource group and workspace into a repository. By the end of this chapter you can rebuild the workbook's template from reviewed files, prove it has one tab per daily check and no embedded I D's, and catch the portal edits that would otherwise drift into production unreviewed. It's for the developers and for the security operations engineer who edits the workbook.

## Slide 3 — What Microsoft Learn gives you

Here's what Microsoft Learn gives you. Two ways to manage a workbook as a template: copy the Gallery Template from the Advanced Editor, or copy the Resource Manager template. The instance is a Microsoft dot Insights workbooks resource, kind shared, with a display name, a source I D, a category, and serialized data, which holds the workbook's content. And Learn warns that an exported template often embeds the subscription I D and resource group: its advice is to mask them. The resource reference gives API version 2023-06-01. Queries use the Logs data source, with K Q L.

## Slide 4 — What it leaves to you

What does it leave to you? Learn's way is to export from the portal and paste, so the template is whatever someone last saved; the kit builds it from the manifest and the K Q L files, and a test keeps the committed file equal to the build. Masking I D's by hand misses one sooner or later, so a check fails any G U I D, subscription path, address or secret. A query is free text, so the kit checks each tab's tables and each query's look-back. It checks that every query reads the workspace parameter. And because nothing says what a tab means, every tab must carry the banner.

## Slide 5 — The template, and the ten checks

Here's the code. The template has a header with the banner, then the parameters: a workspace picker and nine text values, from the emergency access accounts to the synchronization servers and the domain controllers, all left empty in the template. Then one tab per daily check, and one group per tab that shows when its tab is selected, holding the banner, the daily check, what to do, the link-outs with click paths, the G C C note, and its queries, each one a Logs query on the workspace parameter. The validator runs ten checks: the format, one tab per check, tables, look-backs, the workspace, the banner, link-outs and hosts, queries per tab kind, the telemetry list, and no I D's or secrets.

## Slide 6 — Who edits, who reviews, who deploys

Who does what? The security operations engineer edits a test copy in the portal, exports it and validates the export. A second person reviews the change before it replaces the template. Developers keep the manifest and the queries. Lab 1 needs only files. Lab 2 saves one test workbook, so it needs Workbook Contributor on the test resource group, for the lab only, and it deletes the copy at the end. A reviewer checks that no export with I D's in it was committed.

## Slide 7 — Lab 1: the build, and all 89 checks

Lab 1, in the kit's folder, with no tenant. Step 1 confirms the committed template matches the build of the manifest and the queries. Step 2 validates it: ten checks, eighty-nine results across the twelve tabs, and all of them pass.

## Slide 8 — Lab 1: four edits in a portal export

Step 3 is the one to remember. A copy was exported after someone edited the workbook in the portal. Four edits, four failures: one risk query reads a workspace path instead of the parameter; the devices query looks back seven hundred and twenty hours; the grants tab lost its banner; and the file carries a G U I D and a subscription path. Step 4 shows what the export carried: the workspace's full resource path, exactly what Microsoft Learn says to mask.

## Slide 9 — Lab 1: record the validation

Step 5 records a validation of the kit's template: the same eighty-nine checks pass, and the results go to a folder with a hashed manifest, ready for Chapter 4's evidence record. Step 6 runs this chapter's tests: ten passed, none failed. Then delete the output folder.

## Slide 10 — Lab 2: round-trip through the portal

Lab 2 runs in a test subscription, never production, and the authors haven't run it. Open the template in the portal through the Advanced Editor, pick the test workspace, and open all twelve tabs. Save a test copy, change one look-back, and copy the Gallery Template back out. Validate the export: your edit fails, and so does the workspace the portal saved into it. Record any other difference the portal introduced; that confirms the item format, which Learn doesn't document field by field. Then delete the test copy and the export.

## Slide 11 — Evidence, dangers and the checklist

What does this support? The build check shows the template is the reviewed baseline, configuration management C M two. The validation record supports C M two and change control, C M three, and catching a portal edit before it replaces the template supports C M three. The dangers are the four edits you just saw: an export committed as is, a widened look-back, a query on another workspace, and a missing banner. Each has its check. Next, Chapter 3 shows what each tab would display, without a tenant.
