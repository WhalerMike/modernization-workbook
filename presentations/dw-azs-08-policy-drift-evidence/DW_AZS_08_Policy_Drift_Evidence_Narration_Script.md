# Building Azure Security, Chapter 08 — Policy, Drift and Evidence — narration script (practice copy)

## Slide 1 — Chapter 08: Policy, Drift and Evidence

Welcome to the Federal Modernization Workbook's developer workbook, Building Azure Security. This is Chapter 8: policy, drift and evidence. An exemption without an expiry is a decision nobody has to make again, and a finding without last week's run beside it is a number nobody can explain. We'll start from Microsoft Learn's policy samples for Resource Graph, see what they leave to you, read the kit's policy check, its comparison of two runs, its metrics and its evidence records, and walk two labs. The chapter has been reviewed and approved, and the code is illustrative, tested against a fictional estate.

## Slide 2 — Why exemptions expire and runs are compared

Why this chapter? Because policy holds everything the earlier chapters checked, and evidence is what an assessor reads. By the end you can check the security initiative and its exemptions every week, say what changed since last week in every area, report the guide's metrics with the numbers behind them, and hand the security officer an evidence folder whose every file is hashed, whose records form a chain, and whose records name the controls and indicators each run supports. It's for policy owners and security officers, for the platform owners who run the weekly job, and for the developers who keep the comparison and the records honest.

## Slide 3 — What Microsoft Learn gives you

Here's Microsoft's starting point. Learn's Resource Graph samples for Azure Policy read assignments, exemptions and compliance states from one table. Its compliance-by-assignment query gives each assignment's state, percentage and counts, and the kit uses it exactly as published. Another sample lists the exemptions due to expire within ninety days. Learn's exemption structure says an exemption is either mitigated or a waiver, can carry an expiry, and once expired is kept for the record but no longer honored. And DoNotEnforce evaluates without enforcing, which is where the guide's Step 9 starts before switching to enforcement after the compliance review.

## Slide 4 — What it leaves to you

What do Learn and the guide leave to you? The ninety-day list misses an exemption with no expiry, and one already expired. "Switch to enforcement after the review" is a sentence, so an assignment can sit in audit for months. So is "no excluded scopes for convenience". One month's compliance export alone can't show whether anything got better. The guide's metrics each need numbers from a different step. And a folder of exports doesn't show that nothing changed after it was filed, or which control a file supports. The kit answers each, and a test pins each answer.

## Slide 5 — The policy check: six rules

The policy check reads the assignments, the exemptions and Learn's compliance query, and reports six rules. The security initiative must be assigned at the intermediate root. It's a warning if it's still in DoNotEnforce after the enforce-by date the settings give. Every exemption needs an expiry; one past its expiry is a finding, because Learn says it's kept but no longer honored; one due within thirty days is a warning. And an assignment that excludes scopes with notScopes is a finding. Most of these are the program's design guidance; the expiry rule is Learn's.

## Slide 6 — Drift, metrics and evidence

Three more tools. The comparison takes two runs and, per area, compares findings and warnings by fingerprint, the rule and the resource. Only in the later run is new; only in the earlier is fixed; in both, still open. The metrics tool computes eight of the guide's twelve metrics from one run, with the numbers behind each; private PaaS reports a count, because Resource Graph's list has no denominator; and three come from exercise records and the workspace, and say so. And the evidence tool records any run: every file's hash, the hash of the record before it, and the controls and indicators of the steps it covers. A fixture run never counts toward a stage.

## Slide 7 — Who owns policy, drift and the evidence

Who's involved? The policy owner owns the initiative and its exemptions, and reads the drift report at the weekly review with the security officer. The platform owner runs the weekly job and answers for new rows. And the security officer keeps the evidence folder, on agency storage, and runs its check. Every read is still Reader. Findings from a Zero Trust assessment enter the workbook's closure chain, and the Zero Trust Assessment results kit files them under its DDoS, WAF and public exposure family, whose ready-for-closure evidence is this kit's register, DDoS and WAF runs.

## Slide 8 — Lab 1: every area, week one, and the policy

Lab 1 needs only PowerShell 7 with Pester, in the kit's folder. Between the two weeks, Contoso's platform team switched the WAF to prevention, moved the firewall to deny, routed a subnet to the firewall, added a missing header, turned on purge protection, enforced the security initiative and required authorization for new management groups; a new public IP appeared and an orphan went away. Step 1 runs every area on week one: forty-eight findings in all. Step 2 reads the policy findings: an assignment with excluded scopes, an exemption expired on October 31, one with no expiry, one due within thirty days, and the initiative still in audit after its November 1 enforce-by date.

## Slide 9 — Lab 1: week two, and what changed

Step 3 runs every area on the second week, with the first week's register: forty findings now. Step 4 compares the two weeks. Thirteen fixed, four new, and all four new rows come from the two public IPs that changed: the new one has no log, no owner and no DDoS protection, and the one that went away leaves a reminder to remove any DNS record still pointing at its address. Among the fixed: the hierarchy setting, the WAF in detection, the firewall's threat intelligence and intrusion detection, and the security initiative's enforcement.

## Slide 10 — Lab 1: the metrics and the evidence records

Step 5 computes the metrics for the second week. DDoS coverage is fifty-seven percent, WAF prevention coverage sixty-seven, egress inspection sixty, vault posture thirty-three, and one exemption has expired. The rows that come from exercise records say so instead of inventing a number. Step 6 records the run, the comparison and the metrics as evidence, then checks the folder. The first record covers all nine area steps and lists sixteen controls. The comparison and the metrics each get their own record, and the chain of three records is unbroken.

## Slide 11 — Lab 1: fixture evidence can't pass a stage

Step 7 asks whether this evidence could pass the test stage's go or no-go. Every step fails, with the same reason: no passing live record. That's on purpose. Lab evidence can't promote anything, so nobody can take a fixture run to production by mistake. Step 8 runs this chapter's tests: ten pass, covering the policy check, the run folders, the comparison, the metrics and the evidence. When you're done, delete the output folder.

## Slide 12 — Lab 2: a test management group

Lab 2 moves to a test management group with at least one policy assignment and one exemption, never production. Sign in, write the settings file, and run every area twice, a few minutes apart. With nothing changed between them, the comparison should show no new and no fixed rows. Then compare the policy rows with the guide's compliance export and Learn's exemption list: every exemption should appear, in the state the kit gave it. Record the second run: its mode is live, but the stage check still lacks the preflight and the scheduled run, which Chapter 9 adds. Nothing changed in Azure, so backing out is deleting what the lab wrote. The authors haven't run this lab.

## Slide 13 — Federal requirements and the evidence

Each output supports specific controls from NIST's catalog, as the guide's requirements table maps them. The policy folder supports baseline configuration, configuration settings and continuous monitoring. The drift report supports configuration settings and continuous monitoring. The metrics support continuous monitoring and audit record review. And the chained, hashed records support continuous monitoring and the protection of audit information. The kit's output supports those controls; the assessor decides. The key security indicators are FedRAMP's indicators for cloud providers: the agency lines its own evidence up with them and doesn't report them. The exercise and after-action records the guide's Step 10 asks for are people's work, filed beside the runs.

## Slide 14 — Dangers, and the guard for each

What breaks, and what guards against it? An exemption with no expiry accepts non-compliance forever, so the kit flags it every week. An expired exemption can look current in an old report, so the kit names it, because Learn says it's no longer honored. A changed query can make rows look fixed when they only disappeared; that shows as many fixed rows at once, which the reviewer reads in the drift report. Lab evidence can't promote anything, because fixture records never count toward a stage. And evidence edited after filing fails the check, because the hashes and the chain no longer match.

## Slide 15 — Done when: the chapter's checklist

Here's what done looks like. The security initiative is enforcing, or its enforce-by date is still in the future. Every exemption has an expiry, and none is past it without a renewal decision. The drift report is read at the weekly review, and every new row has an owner. The metrics report carries the numbers behind each value. And the evidence check passes on a folder that lives on agency storage. Next, Chapter 9 is the runbook that takes all of this to a test subscription, then to production.
