# Companion guide: The Daily Checks on One Dashboard (draft) — The Daily Checks on One Dashboard — narration script (practice copy)

## Slide 1 — The daily checks on one dashboard

Welcome. This is the narrated briefing for a companion guide in the Federal Modernization Workbook: The Daily Checks on One Dashboard. One thing first: the guide is a draft, awaiting the owner's review. It answers a question the operator runbook leaves open: can the operator see all of the daily checks in one place each morning? Mostly yes, on one Azure Monitor workbook in the Sentinel workspace, with a link out to the portal that holds the data for the checks a workbook can't read. Its facts come from Microsoft Learn, read on November eighteenth, 2026. We'll go in four parts: why, what, who, and how.

## Slide 2 — A dashboard is a picture of the evidence

Here's the rule the guide keeps. The Security Operations book says it plainly: a dashboard is a picture of the evidence; what an assessor relies on is regenerating the numbers from the stored records. The Compliance Automation book says the same of tests: one that reads a dashboard tile is a screenshot with a schedule. So the workbook in this guide is a view. Every tab says so, and the kit refuses to record a rendered view as evidence. The evidence stays where it already lives: in the record each check writes, and the task each finding opens.

## Slide 3 — Dashboards in Azure and Microsoft 365

What does Azure offer? Microsoft's guidance compares the options. Workbooks are a flexible canvas over the most complete set of Azure data sources, and they can be managed as Resource Manager templates. Portal dashboards give a single pane of glass, but a workbook is richer. Dashboards with Grafana is a free preview; Azure Managed Grafana is for external sources and private networking; Power BI suits long-term trends. Microsoft 365 has no single custom dashboard: each admin center has its own built-in views. So the design is one workbook in the Sentinel workspace, and a link out where the data stays elsewhere.

## Slide 4 — Ten daily checks, ten tabs

Here are the ten tabs, one per daily check. Telemetry completeness, the synchronization probe, risky users and sign-ins, and emergency access sign-ins fit strongly. Noncompliant devices and D L P alerts fit well. Grants and the log review queue are partial: the grants tab lists them, but matching each to a ticket stays in the I T S M tool, and the log review tab shows the queue while the review stays a recorded procedure. Entra Health is a link-out, because its alerts aren't in Log Analytics. And the catalog tasks live in the I T S M tool's own dashboards.

## Slide 5 — GCC availability, source by source

What's available in G C C? G C C Moderate uses the commercial Entra service and pairs with commercial Azure, so the workspace, the workbook and the Logs Ingestion API are all in commercial Azure. Sentinel workbooks are generally available there. Entra and Intune both send their logs to the workspace; Microsoft says Intune in G C C is the same instance as the commercial service. Defender X D R alerts and incidents are generally available for G C C. The Defender portal's connector overview is a commercial-cloud preview, so it isn't assumed. And Entra Health monitoring and Connect Health are not yet specified, so their tabs are link-outs.

## Slide 6 — Who does what: the RACI

Who does what? Security operations is accountable for the sources, the template and the deployment, and for the telemetry tab each morning. Identity engineering connects the Entra logs and the probe, and supplies the emergency access object I D's. The endpoint platform owner connects Intune and supplies the compliance state value. The operators read their own family's tabs. And the security officer is consulted on each plan, approving its hash in the change record, and is accountable for the evidence.

## Slide 7 — Step 1: connect the sources

Now the six steps. Step 1 connects the sources. An Entra diagnostic setting sends sign-in, audit and risk logs to the workspace. Intune's diagnostic settings send the compliance export, once a day, up to forty-eight hours late. The Defender X D R connector brings incidents and alerts, including those it collects from Purview D L P. Health monitoring is turned on for Sentinel. And the morning synchronization probe gets its own custom table, written through the Logs Ingestion API. The check: a read-only reachability test reports each table as delivering, late or missing.

## Slide 8 — Steps 2 and 3: validate, then preview

Step 2 fills one settings file per environment, and checks the two values the kit can't know: the compliance state your workspace records, and the product names of D L P alerts. Those values, and every I D, go into the deployed workbook's parameters, never into the template. Then the validator runs ten checks on the template, which matters because Microsoft says an exported template embeds sensitive values that should be masked. Step 3 plans the deployment of one workbook resource and previews it with what-if, which changes nothing. A second person approves the plan's hash, and the kit refuses any plan that would delete.

## Slide 9 — Step 4: deploy to test, then production

Step 4 deploys. Saving a shared workbook needs the workbooks write permission, which Workbook Contributor grants, and deploying through Resource Manager also needs deployment rights. Grant both on the workbook's resource group only, for the deployment window. Readers need Workbook Reader and their own access to the data. The test stage runs preflight, plans with what-if, deploys the approved plan, and checks reachability. It's a go when each of those has a passing live record. Production runs the same commands, and the preflight refuses it until the test stage's evidence passes. Rolling back deletes a view only.

## Slide 10 — Steps 5 and 6: read it, and keep the evidence

Step 5 is the morning read. Telemetry completeness comes first, because a dark source makes every tab over it unreliable. Then each tab in turn: each row that needs work becomes, or is matched to, a task with an owner. Entra Health and the I T S M queue are worked where they live. The workbook never closes a task, pages anyone, or proves a check happened. Step 6 keeps the evidence: the kit records the validation, preflight, plan, deployment, reachability check and rollback plan, each hashed and chained. A rendered view is never recorded. And a portal edit comes back as an export, is validated, and replaces the template through review.

## Slide 11 — Requirements, dangers and what's unverified

The workbook supports the monitoring the daily checks already do; it doesn't add a control. Its records support configuration and change control for the template and the deployment, and continuous monitoring for the reachability check; the assessor decides. The biggest dangers are a dashboard taken as evidence, and a missing connector that looks healthy. The guards are the banner, the refused render, and stale shown as stale. Some things couldn't be verified on Microsoft Learn: the workbook's item format field by field, G C C for Entra Health and Connect Health, and the values your own workspace records. The developer workbook and the learning path take it from here.
