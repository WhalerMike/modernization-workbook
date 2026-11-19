# Daily Checks Dashboard learning path, Module 1 — Module 1: One workbook, one tab per daily check — narration script (practice copy)

## Slide 1 — Module 1: One workbook, one tab per check

Welcome to Module 1 of the learning path The Daily Checks on One Dashboard: one workbook, one tab per daily check. In about forty minutes, plus a lab in a test workspace, you'll see which daily checks a workbook can show and from which table, which ones it can only link to, and how the workbook is kept as a reviewed file rather than something edited in the portal. The module is a draft awaiting the owner's review.

## Slide 2 — Objectives: what you'll be able to do

Here's what you'll be able to do. Name the dashboard options in Azure, and say why the design is one workbook. Say, for each daily check, its table or its link-out, and how well it fits. Give each source's availability in G C C. And build the workbook's template from the manifest, then validate an export from the portal. You'll need the operator runbook's chapter on the daily checks as a prerequisite, and PowerShell 7 with Pester for the lab.

## Slide 3 — Unit 1: dashboards in Azure and Microsoft 365

Unit 1. Microsoft's guidance compares workbooks, portal dashboards, Dashboards with Grafana, which is a preview, Azure Managed Grafana and Power BI. Workbooks read the widest set of Azure data and can be managed as Resource Manager templates. Microsoft 365 has built-in views in each admin center, but no single custom dashboard: a view across them needs their logs in Log Analytics. So the design is one workbook in the Sentinel workspace, and a link out where a check's data stays in another portal.

## Slide 4 — Unit 2: ten tabs, and their GCC availability

Unit 2. Eight tabs query tables; two link out: Entra Health, and the I T S M task queue. Two of the eight are partial: the grants tab lists grants, but the match to a ticket stays in the I T S M tool, and the log review tab shows the queue while the review stays a recorded procedure. On availability: workbooks, Entra and Intune logs, Defender X D R alerts and the Logs Ingestion API are all available with a G C C tenant and commercial Azure. The Defender portal's connector overview is a commercial-cloud preview, so it isn't assumed. And Entra Health monitoring and Connect Health are not yet specified.

## Slide 5 — Unit 3: the template as code

Unit 3. The template is built from the manifest and one K Q L file per query, and a validator runs ten checks on it, or on any export from the portal. Four matter most in practice. A widened look-back makes a month of data look like today's. One query on another workspace mixes environments. Without the banner, a tab reads as proof. And an export embeds I D's: Microsoft says to mask them, and the kit simply fails them.

## Slide 6 — Who this module is for

Who is this for? Security operations takes the sources, the template and its validator. Operators learn which tab shows their family's check, and which ones link out. An I S S O reviewer can read the introduction and summary and skip the labs. Two federal requirements: the reachability record supports continuous and system monitoring, and the validation record supports the baseline and change control. The steps support these controls; the assessor decides.

## Slide 7 — Lab 1: the tabs, and the edited export

Lab 1 runs on a laptop with no tenant, in the developer workbook's Chapters 1 and 2. You'll list the ten tabs and open the Entra Health tab: a link-out, with no table, to the Entra admin center. Then you'll validate a copy someone exported after editing the workbook in the portal. Four edits, four failures: a query on a workspace path, a thirty-day look-back, a missing banner, and a subscription path in the file.

## Slide 8 — Lab 2: a test workspace

Lab 2 runs in a test workspace, never production, and the authors haven't run it. From Chapter 1, list which of the manifest's tables the test workspace has; each missing table is a source still to connect. From Chapter 2, open the template in the portal through the Advanced Editor, save a test copy, edit it, export it, and validate the export. Then delete the copy.

## Slide 9 — Knowledge check

Two questions. First: Entra Health's alerts are a daily check, so what does their tab show? A query over the sign-in logs, a link out to the Entra admin center, or nothing? It's a link out, because the alerts aren't in Log Analytics and their G C C availability is not yet specified. Second: an export has the workspace's path saved in it; which check fails? Check ten, because the deployment plan fills I D's per environment, never the template. In summary: every daily check now has a tab or a link-out, every source its availability, and the workbook is a reviewed template. Module 2 reads it, deploys it, and keeps the evidence.
