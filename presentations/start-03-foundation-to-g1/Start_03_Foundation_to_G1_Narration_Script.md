# Start 03 — Foundation to Gate G1 — narration script (practice copy)

## Slide 1 — Foundation to Gate G1: Weeks Five to Eight

Welcome to Episode 3 of the Start series from the Federal Modernization Workbook. Episode 2 ended at gate G zero, with the estate inventoried and the plans about to be generated. Now the work reaches the live environment. Over roughly four weeks, Phase one puts the identity building blocks in place: groups and scoped administration, a sign-in baseline, emergency accounts, the first HR feed, address management, and the first servers under cloud management. Then gate G one checks all of it from data. Let's see how the pieces fit.

## Slide 2 — Five workstreams, one foundation

Phase one has one goal: put the identity basics in place before anything else moves. It opens with the plans approved, and then five workstreams move together, not one after another. Identity builds groups, scoped administration and the HR feed. Policy sets the sign-in baseline. Services brings the core infrastructure under address management. Compute connects the first servers. And access opens strong sign-in for the most privileged administrators. Running them in parallel is the point. First, groups and scope.

## Slide 3 — Groups and administrative units: scope from attributes

In the old directory, where an account sat in the tree decided who could manage it. The cloud directory is flat, so scope has to be declared on purpose. Phase one does that with dynamic groups and administrative units (AUs), whose membership comes from attributes like department, fed by HR. Two things to know. AUs limit who can change an account, not who can see it. And membership updates take hours, sometimes more than a day, so plan in hours, not minutes. Next, the baseline every sign-in has to meet.

## Slide 4 — The Conditional Access baseline, report-only first

The sign-in baseline is short: multifactor authentication for everyone, legacy sign-in methods blocked, and emergency accounts excluded from anything that could lock them out. Blocking legacy authentication is also a mandatory federal cloud baseline. What matters most is how it's switched on. Every policy runs in report-only mode first, for at least a week, so you can see who would be blocked before anyone is. Then it's enforced ring by ring, and rolled back by turning it off, never by deleting it. That makes the emergency accounts critical.

## Slide 5 — Emergency access: the one standing exception

Emergency access accounts are how you get back in when everything else fails: sign-in, multifactor, or a policy mistake. They're the only standing administrator rights the program accepts by design, so they're governed tightly. At least two cloud-only accounts, with phishing-resistant sign-in, excluded from blocking policies through one group, and an alert on every use. They're tested at least every ninety days. And they must work before any administrator role becomes just-in-time, or the agency can lock itself out of its own tenant. Next, the first HR feed.

## Slide 6 — The first HR feed, for a foundation scope

This is where HR starts to drive identity, for a first, limited group of people. The order matters. The feed is named as one of the agency's HR integration points. The attribute authority map is signed, and HR data is checked against reality and fixed at the source, because a drifted feed produces drifted access faster than any ticket queue. Joiner, mover and leaver are proven end to end in a test tenant. Then the pilot group runs in shadow mode, where the feed shows what it would do, before it's allowed to act.

## Slide 7 — Address management for Tier 0, Arc for pilot servers

Two infrastructure pieces join the foundation. First, address management. Many agencies track IP ranges in a spreadsheet, and that's where conflicts and ghost records come from. Phase one puts the platform host and the most critical infrastructure under one governed address authority, so DNS and DHCP can later derive from it. Second, servers. Intune doesn't manage Windows Server, so the platform host and a few pilot servers connect through Azure Arc. Each gets a cloud identity, a security baseline, patching and protection, without changing its domain membership.

## Slide 8 — Gate G1 is measured from data, not signature

Gate G one has a short list, and each line is a query, not an opinion. Groups and administrative units match their registry, with no drift. The sign-in logs show no one outside multifactor except the emergency accounts. The emergency accounts have recent, logged tests. The address inventory covers the critical infrastructure. The provisioning logs show the HR feed running for the foundation group. And high findings are fixed and re-scanned. The steward decides, but only after the data says green. So what can go wrong?

## Slide 9 — What can go wrong in weeks five to eight

Most foundation failures are predictable. A broad multifactor policy blocks an unusual but critical sign-in, which is why everything runs report-only first. An administrator role goes just-in-time before the emergency accounts work, and the tenant locks itself out. A policy aimed at a group silently misses everyone whose attribute is empty. The HR feed automates on data nobody checked. And if the HR connector breaks mid-rollout, the program stalls, which is why the gate requires the feed first. Rollback triggers halt the work before a problem spreads.

## Slide 10 — What leadership sees at Gate G1

When gate G one passes, leadership can see a foundation that holds. Everyone signs in with multifactor. Administration is scoped by attributes instead of a tree nobody wrote down. Emergency access is governed and tested. HR is driving identity for a first group of people, and the core servers and addresses are under management, all with zero drift. That's what the pilot division builds on next. The last episode steps back from the mechanics to the meeting itself. Episode 4, Making the Case at Your Agency, turns all of this into a one-page ask.
