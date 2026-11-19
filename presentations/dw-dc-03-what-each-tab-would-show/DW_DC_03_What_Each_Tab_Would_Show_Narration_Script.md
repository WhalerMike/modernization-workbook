# Building the Daily Checks Workbook, Chapter 03 — What Each Tab Would Show — narration script (practice copy)

## Slide 1 — Chapter 03: What Each Tab Would Show

Welcome back to Building the Daily Checks Workbook. This is Chapter 3: what each tab would show. An empty queue over a source that stopped arriving looks exactly like a quiet night, and the renderer in this chapter says which one it is. We'll see what Microsoft Learn and the operator runbook give you, the renderer's rules, and the read-only reachability check, then walk two mornings in the fictional workspace. The chapter has been reviewed and approved, and the code is illustrative, tested against fixtures.

## Slide 2 — Why an empty queue proves nothing

Why this chapter? A dashboard's most dangerous state isn't red. It's green over a source that stopped arriving. A risk queue with no rows can mean nobody is at risk, or that the sign-in logs stopped coming in last night. By the end of the chapter you can show, without a tenant, what each tab would display on a given morning; tell an operator which tabs can't be trusted because their source went quiet; and prove each tab's tables answer in a real workspace. It's for developers, security operations, and the operators who read the workbook each morning.

## Slide 3 — What Learn and the runbook give you

Here's what you start with. The operator runbook's completeness check lists each expected table past its freshness limit, and it uses a fuzzy union, so a missing table shows up as a null instead of failing the query. Sentinel's health page gives the query for each connector's latest failure, and recommends Azure Monitor alert rules for health drifts. Microsoft's Intune page says compliance is exported once a day and can take up to forty-eight hours, and not to rely on a fixed completion time. And the Azure command line can run a query against a workspace, from its log analytics extension.

## Slide 4 — The render rules, in order

Here are the renderer's rules, in order. A link-out tab shows LINK-OUT. No query result at all shows NO DATA. If any source the tab depends on is past its freshness limit, the tab shows STALE, and says the rows it does show may be incomplete. Otherwise, any row the tab's rule flags shows ATTENTION. No rows where a row is expected, like the morning probe, shows NO DATA. And only then, CLEAR. So a stale source never renders clear. The render carries the banner, and the kit refuses to record it as evidence.

## Slide 5 — What it leaves to you, and reachability

What does it leave to you? The completeness query lists dark tables, but the other tabs don't know their table is dark, so each tab names its own sources and limits. A query result is just rows or no rows, so each tab says what empty means. Intune's timing is variable, so the devices tab allows forty-eight hours. A screenshot is easy to file as evidence, so the render carries the banner and the kit refuses it. And nothing proves each tab's tables answer, so the kit asks the workspace for each table's newest record and count: delivering, late or missing.

## Slide 6 — Who reads it, and who fixes the source

Who does what? Operators read the telemetry tab first, then their own family's tabs, and each finding becomes a task. Security operations treats each dark source as a high-severity task. And the security officer keeps the reachability record, never the render. Lab 1 needs only saved results. Lab 2 needs Log Analytics Reader on a test workspace, which can view and search the monitoring data, and the check sends only queries.

## Slide 7 — Lab 1: the morning the logs stopped

Lab 1. Step 1 renders the morning of November sixteenth in the fictional workspace. The Entra diagnostic setting stopped at ten past five the evening before, and the sync probe didn't run. Telemetry flags four rows: sign-in and audit logs are dark, the probe's table is dark, and the Office 365 connector's latest health event is a failure. The sync, risk, emergency access and grants tabs are all STALE. Step 2 shows why the risk tab isn't clear: its query returned no rows, but its source stopped fourteen hours ago.

## Slide 8 — Lab 1: the next morning

Step 3 renders the next morning. The setting is back, and telemetry is clear. Now the queues show what they were hiding: one user at high risk, one emergency access sign-in, which turns out to be the quarterly validation drill, and the review records it as a drill, and one synchronization conflict. Grants and D L P alerts are clear, and this time clear means something, because their sources are fresh.

## Slide 9 — Lab 1: reachability, and a refused render

Step 4 checks each table's reachability on the first morning, from saved answers. Sign-in logs, audit logs and the probe's table are late, and the Sentinel health table is missing altogether: health monitoring was never turned on in this workspace. The script exits with an error. Step 5 tries to record the first morning's render as evidence. The kit refuses: a rendered view is not evidence.

## Slide 10 — Lab 1: record what the check found

Step 6 records the reachability check instead. Record one, with result Fail: the record keeps what the check found, with continuous monitoring and system monitoring, and their indicators. A failing record is still evidence; it's evidence of the gap. Step 7 runs this chapter's tests and the evidence tests: sixteen passed, none failed.

## Slide 11 — Lab 2, evidence and dangers

Lab 2 runs the same reachability check against a test workspace, never production; the authors haven't run it. Sign in to commercial Azure, add the log analytics extension, run the check, and sign out. Every table should be delivering; each late or missing one becomes a task. The reachability record supports continuous monitoring and system monitoring. The dangers you saw: a missing connector that looks healthy, a missed probe showing yesterday's green, and a render filed as evidence. Next, Chapter 4 deploys the workbook.
