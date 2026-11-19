# Building Defender XDR, Chapter 05 — Exposure and Incidents — narration script (practice copy)

## Slide 1 — Chapter 05: Exposure and Incidents

Welcome to Building Defender XDR, a developer workbook in the Federal Modernization Workbook. This is Chapter 5: exposure and incidents. A vulnerability without an owner is an inventory finding, and an incident without an owner is a clock running. Both checks in this chapter ask the same question: who has this? We'll start from the guide's queries and Learn's incident list, and the government-cloud fact that shapes the exposure gate, then read both checks and walk two labs. The chapter has been reviewed and approved; the code is illustrative, tested against fixtures.

## Slide 2 — Why both checks ask who has it

Why put these two together? Because both ask who has this. A vulnerability with no owner isn't just unpatched; it's a gap in the inventory. And an incident with no owner is a clock running against the severity table. By the end of this chapter you can route every exposed device to an owner, record Security Exposure Management correctly for a GCC tenant, and list every incident that broke the severity table. It's for the developers, the vulnerability manager who owns the exposure gate, and the security operations lead who owns incidents.

## Slide 3 — The government-cloud fact that shapes G5

One government-cloud fact shapes the exposure gate. Learn says Microsoft Security Exposure Management, with its attack paths, exposure graph and critical asset management, is available in Public Cloud only, not in US Government clouds. Defender Vulnerability Management is available in GCC, core and premium, without two features. DeviceInfo still carries exposure level, internet facing, and asset value. And the vulnerability tables stay in Defender; they aren't ingested into Sentinel. So the guide's interim path prioritizes by those columns and Vulnerability Management's recommendations, with the Tier 0 inventory as the critical-asset list.

## Slide 4 — What the guide and Learn leave to you

What's left to you? The exposure query returns rows, not owners, so the kit matches each device's group to an owner, and no owner is a finding. Not available is a fact, but a Zero Trust Assessment test that needs Exposure Management would read as a failure, so the kit writes a disposition: skipped, not applicable, with the interim path. An incident export is a list, so each incident is read against the severity table. One filter misses an old incident that's still open, so the kit reads two and merges them. And Graph doesn't record when an incident was first assigned, so the kit reports unowned past its window, and invents no duration.

## Slide 5 — The exposure check and its disposition

The exposure check runs the guide's two queries: high and critical vulnerabilities by software and recommended update, and exposed or internet-facing devices. It matches each exposed device's group to a remediation owner from the agency's owners file. A device with no owner is an inventory finding, not just a vulnerability finding. And it writes the disposition for the settings file's cloud. For GCC: not available, skipped, not applicable, with the interim path and the Learn page. That result name is one of the seven the Zero Trust Assessment results kit uses, so the same disposition lands in the closure register.

## Slide 6 — The incident check: five findings

The incident check reads incidents created in the last thirty days, and every incident still active, with their alerts, using Learn's list call with expand alerts. Each one gets a finding. Triaged: open, with an owner. Untriaged: open, no owner, but inside its window. Overdue triage: no owner, past its window, which fails. Closed: resolved with a classification and a determination. And closed without classification, which also fails. The windows come from the guide's severity table: one hour for high, twenty-four for medium, seventy-two for low and informational. Containment stays on the response ladder; the kit only prints each incident's rung.

## Slide 7 — Who owns the exposure, who owns the queue

Who's involved? The vulnerability manager owns the exposure gate: an owner for every exposed device, and the weekly queue. The security operations lead owns the incident gate: a daily queue review, and every overdue incident owned today. The security officer files the Exposure Management disposition in the closure register, and the inventory gaps. One caution: the incident check only reads. It never assigns, comments on or closes an incident. And the severity strings the exposure query filters on are as the portal shows them; check them in the test tenant.

## Slide 8 — Lab 1: the exposure check and its record

Lab 1, in the kit's folder. Step 1 runs the exposure check. Three software rows with nine CVEs between them, and three exposed devices. Two have owners. The third sits in a group no owner covers: the same device Chapter 2 found missing from the inventory. Two findings, one cause. Step 2 reads the Exposure Management record: not available in GCC, skipped, not applicable, and the interim path in one sentence. That's what goes in the closure register, not a failed control.

## Slide 9 — Lab 1: the incident check and its findings

Step 3 runs the incident check. Seven incidents. Incident 1002, high severity, has waited three and a half hours with no owner, against a one-hour window: overdue. Incident 1005 was resolved with its classification still unknown. And incident 1003, medium, has no owner yet, but it's inside its twenty-four hours. Step 4 reads the findings as the security operations lead gets them, each with its containment rung. The high one is the gated rung: the playbook prepares, and a named approver releases.

## Slide 10 — Lab 2: both checks in a test tenant

Lab 2 uses a test tenant, never production, with Vulnerability Management data on at least one device and at least one incident; the guide's detection test makes one. Sign in with both read scopes, and run both checks without the fixture path. Then look at the raw vulnerability file. If it's empty in a tenant you know has high vulnerabilities, the severity strings differ from the portal's, and that goes in the verification log. Nothing changed, so you just sign out.

## Slide 11 — Federal requirements and the evidence

Here's what these two gates prove, against NIST's catalog. Vulnerabilities by software and update support vulnerability monitoring and flaw remediation. Every exposed device owned, or a finding, supports the component inventory. The Exposure Management disposition supports vulnerability monitoring, honestly recorded. Incidents owned inside their windows and closed with a classification support incident handling, incident monitoring, and audit review. And the incident record with its alerts supports the reporting decision. The indicators are FedRAMP's, as the guide maps them. The records support these controls; the assessor decides them.

## Slide 12 — Dangers, and the guard for each

What breaks in production? Assuming Exposure Management in GCC stalls attack-path work, and makes a Zero Trust Assessment test look failed; the disposition and the interim path guard it. An exposed device with no owner never gets patched; it's a finding. Sentinel queries on the vulnerability tables return nothing, so the kit queries Defender's own advanced hunting. Reading only last month's incidents misses an old one still open, so the active filter is read too. And a time to triage computed from the wrong field is a precise-looking, wrong number, so the kit reports past-window instead.

## Slide 13 — Done when: the chapter's checklist

Here's what done looks like. Every device group has an owner in the owners file. The Exposure Management disposition is filed with the closure register. Every overdue incident has an owner today. Every incident closed without a classification is reopened and classified. And both run folders are recorded as evidence. Next, Chapter 6 keeps the rules that raise these incidents as files: tested, and deployed through Microsoft Graph. Thanks for watching.
