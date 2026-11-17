# Building Defender XDR, Chapter 07 — Identity Signals and Automation Boundaries — narration script (practice copy)

## Slide 1 — Chapter 07: Identity Signals and Automation Boundaries

Welcome to Building Defender XDR, a developer workbook in the Federal Modernization Workbook. This is Chapter 7: identity signals and automation boundaries. The same account seen by the endpoint, the domain controller and a cloud app is one story. What Defender may do about it on its own is a decision the authorizing official made, and the settings have to match it. We'll start from the guide's cross-source query and Learn's automation levels and exclusions, read both checks, and walk two labs. The chapter is a draft awaiting review; the code is illustrative, tested against fixtures.

## Slide 2 — Why signals and automation share a chapter

Why these two together? Because they keep detection and response joined up. Detection should see one story across the endpoint, identity and cloud apps. And response should stay inside the boundary the authorizing official set. By the end of this chapter you can show that identity and cloud-app sources are feeding incidents, that Defender's automation matches the response ladder, and that every exclusion is approved, with every emergency access account protected. It's for the developers, the security operations lead who owns both gates, and the platform owner.

## Slide 3 — What the guide and Learn give you

Here's what's already there. For signals, the guide's query joins alert evidence to alert info, and keeps the users with alerts from more than one service in seven days. In GCC, Learn lists App Governance's alerts as roadmap items, and Cloud Apps behaviors aren't available in the behavior table. For automation, each device group has one of five levels, from full remediation to no automated response; Microsoft recommends full. User exclusions are for service and emergency admin accounts, and exclusions reduce protection. Contain User needs the sensor at 10.8470 or later. Attack disruption's GCC availability isn't specified, and the portal holds these settings; Learn names no Graph API for them.

## Slide 4 — What it leaves to you, and the verdict

What's left to you? The query returns users in no order, and can't tell you a source has gone quiet, so the kit sorts a priority list, and fails when no row names a source beyond the endpoint. The portal shows five levels but doesn't know the ladder, so the kit's ladder says workstations get full, the pilot gets semi for all folders, and servers get a semi level. Exclusions sit in the portal unreviewed, so each needs an approver and a review date, and every emergency account must be there. And Contain User silently doesn't run on an old sensor, so each device's version is checked.

## Slide 5 — The two checks

Two checks. The signals check runs the guide's cross-source query and writes a priority list. An emergency access account goes first, with one instruction: page the incident response lead, and a human decides any containment. Three or more sources is a priority. The automation check reads three files and calls nothing: the device groups export, the attack disruption exclusions, and the device states. A workstation group below full passes only with a recorded exception. The exports come from two portal pages, copied into the template columns.

## Slide 6 — Who sets the boundary, who keeps it

Who's involved? The authorizing official decides attack disruption as a class on the response ladder, and approves each exclusion. The security operations lead owns both gates: the weekly hunt, and a quarterly review of the exclusions. The platform owner sets the device group levels with the security operations lead. One note: the ladder's mapping is the program's design, and the authorizing official's attack disruption decision comes first. The kit checks the settings against it; it doesn't make the decision.

## Slide 7 — Lab 1: the signals check

Lab 1, in the kit's folder. Step 1 runs the signals check. The first row is an emergency access account, with identity and cloud-app alerts in the same week. Nobody's playbook touches it; the incident response lead decides. Then a user seen by three sources, a priority, and one seen by two. The last line says identity or cloud-app sources are feeding alerts, so the check passes.

## Slide 8 — Lab 1: the automation check, and the ladder

Step 2 runs the automation check, and finds four things. The ring 3 workstation group sits at a semi level with no exception: off the ladder. The scanner subnet's exclusion passed its review date in October. The second emergency access account isn't in the identity exclusions, so attack disruption could contain it. And one device runs a sensor below 10.8470, so Contain User won't act there. Step 3 reads the ladder the groups are checked against: full for workstations, semi for all folders for the pilot, and any semi level for servers.

## Slide 9 — Lab 2: signals live, automation from exports

Lab 2 uses a test tenant, never production, with Defender for Identity on at least one test domain controller. Sign in and run the signals check. In a quiet test tenant the query may return no rows, and the check fails: that says no identity or cloud-app alert met an endpoint alert this week, not that the sensors are broken; check sensor health in the Identities settings. Then copy the two portal pages into the template columns: the device groups, and the automated response exclusions with their approvers and review dates. Run the automation check. Nothing changed, so you just sign out.

## Slide 10 — Federal requirements and the evidence

Here's what these gates prove, against NIST's catalog. Identity and cloud-app alerts correlating with the endpoint's supports system monitoring and correlating audit repositories. Emergency access accounts flagged for a person supports account monitoring. Each device group's level matching the ladder supports automated incident handling and automated response. And exclusions approved and reviewed, with every emergency account excluded, supports automated incident handling done safely. The indicators are FedRAMP's, as the guide maps them. The records support these controls; the assessor decides them.

## Slide 11 — Dangers, and the guard for each

What breaks in production? Attack disruption containing an emergency access account locks you out during the incident; every emergency account must be excluded. A server group at full means a server remediated or isolated without a person; the ladder allows servers only semi levels. An exclusion nobody reviews quietly withdraws protection; a review date ahead is required. An old sensor means Contain User does nothing. And when the identity sensors stop, the query goes quiet and looks calm, so no source beyond the endpoint is a failure.

## Slide 12 — Done when: the chapter's checklist

Here's what done looks like. The cross-source query names at least one identity or cloud-app source each week. Every emergency access account in the settings is an identity exclusion. Every device group is at the ladder's level, or has an exception. Every exclusion has an approver and a review date ahead. And every device runs a sensor at or above the Contain User minimum. Next, Chapter 8 runs every check in one command, computes the guide's metrics, and records it all for the security officer. Thanks for watching.
