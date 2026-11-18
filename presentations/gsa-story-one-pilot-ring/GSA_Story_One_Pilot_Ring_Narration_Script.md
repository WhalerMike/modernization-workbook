# Companion guide — Building Global Secure Access — One Pilot Ring, Decision to Go — narration script (practice copy)

## Slide 1 — One Pilot Ring, Decision to Go

Welcome to the story deck for Building Global Secure Access, a developer workbook in the Federal Modernization Workbook. Instead of nine chapters one at a time, we'll follow one pilot ring all the way through: a fictional agency tenant, contoso dot example, on November 16, 2026, and the same tenant two weeks later. Every value comes from the kit's own test fixtures, and every output on a slide is what the kit really printed. One note before we begin: the workbook has been reviewed and approved, and the code is illustrative, tested against fixtures, not against a live tenant.

## Slide 2 — The pilot's path through nine chapters

Here's the route, in the guide's run order. Scene one: the pilot decides Internet Access on a feature whose GCC availability isn't stated. Scene two: the logs leave a category out. Scene three: one device is behind the rest. Scene four: sign-ins are short of the target, and the first change goes through a plan. Scene five: the compliant network policy isn't ready, and a partner tenant isn't registered. Scene six: a Finance app that's really a VPN again. Scene seven: an expired bypass and a certificate near expiry. Scene eight: the ring says no-go, then go. And scene nine runs the same commands in test, then production.

## Slide 3 — Scene 1: Internet Access, decided on a preview

Scene one. The pilot's Internet Access decision record looks fine at a glance: adopted, approved. But its quote of Learn's availability sentence is forty-six days old, its SKU has twenty-five units for sixty users, and it counts on the cloud firewall for clients to handle QUIC. That's a preview. Learn says Global Secure Access is available in GCC for the product as a whole, so a preview's GCC availability is not yet specified. The kit doesn't assume it. Its availability table carries the guide's interim path, and the check that catches the preview names it: block QUIC with a Windows Firewall rule delivered by Intune.

## Slide 4 — Try it: check the decision records

Try it. From the kit's folder, check the pilot's four decision records. Four failures: the internet decision's stale quote, its short licenses and its preview feature, and the branch decision, which defers remote networks without naming what protects branches meanwhile. Then read the preview finding in full. Look at the fix. It isn't "enable the preview": it's the guide's interim path, piloted first and recorded in the architecture record.

## Slide 5 — Check 1: a preview in GCC

Check one. Learn says Global Secure Access is available in GCC. So what does the guide's table say about the cloud firewall for clients, a preview, in GCC? Available, because the product is? Not yet specified? Not available? Or available after onboarding? The answer opens the next scene.

## Slide 6 — Scene 2: a category the logs leave out

The answer to check one: not yet specified, because Learn's sentence covers the product, not the preview. Scene two. The guide runs logging before the client, so the logs exist before anything is enforced. The kit's collector reads the whole tenant in one read-only run: seventeen calls, twenty-four reads, every file hashed, and later steps refuse a collection that changed. The pilot's diagnostic setting looks right but sends only three of the four network categories. Remote network health is off. No branch is on a remote network yet, but when one is, its health would never reach the workspace.

## Slide 7 — Try it: the baseline, and a changed file

Try it. Run the baseline checks on the pilot collection. Both connector groups are in the architecture record with two hosts, the forest is in the DNS suffixes, the workspace is named, the export is complete, and the one failure is the missing category. Then copy the collection, add one space to one file, and try to read it. The read is refused: the licenses file changed since its manifest. Every later chapter reads the collection through that check.

## Slide 8 — Check 2: when the logs come

Check two. In the guide's run order, when is the network diagnostic setting turned on? After the pilot, once there's traffic? Before the client, so the logs exist before anything is enforced? At ring 3, with the CISA agreement? Or only when a finding needs it?

## Slide 9 — Scene 3: one device behind the rest

The answer to check two: before the client, so the logs exist before anything is enforced. Scene three. Every later policy assumes the client is on the device, connected, current and hard to turn off. The service sees fifteen active devices, but Intune says eighteen are in scope, so coverage is eighty-three percent against a target of ninety-eight. One device, pilot 3, runs an old client, prefers IPv6, and Chrome still uses DNS over HTTPS. Pilot 4 is disconnected. The kit's device script records each device's values without changing anything, and hardening waits for ring 2, as Learn advises.

## Slide 10 — Try it: coverage and the four devices

Try it. Run the client checks. Coverage fails at eighty-three point three percent. Pilot 3 fails three checks: the old client, IPv6 preferred, and DNS over HTTPS left on in Chrome. Pilot 4 fails on health: disconnected. And the one client exclusion, a lab machine with a Hyper-V external switch, passes, because it has an owner, an approver and an expiry. The pilot isn't ready to exit, and Scene eight will say so.

## Slide 11 — Check 3: hardening in the pilot

Check three. Learn advises letting users run the client unrestricted first, and restricting later. So what does the kit do with the four hardening values during the pilot? Fail every device without them? Report them as information, and check them from ring 2? Apply them automatically? Or ignore them in every ring?

## Slide 12 — Scene 4: sign-ins short of target; the first plan

The answer to check three: information in the pilot, a check from ring 2. Scene four. The Microsoft traffic profile and signaling are on. Signaling is source IP restoration and the signal Conditional Access needs. But only ninety-one percent of the week's sign-ins went through the service, against ninety-five. And the internet profile is on, though the pilot's desired state hasn't adopted Internet Access yet. Fixing that is the first write, so it goes through a plan: a file listing each request and its reason, with a hash a second person approves before anything is sent.

## Slide 13 — Try it: the traffic checks and the pilot's plan

Try it. Run the traffic checks: the profile passes, signaling passes, and the sign-in share fails at ninety-one point two percent. Then plan the pilot from its desired state. Two Graph steps: the internet profile goes off, and the administrator RDP policy goes back to its reviewed file, which Scene six explains. The plan's hash is printed, and it's a dry run: nothing changed. In fixture mode, applying it is refused outright.

## Slide 14 — Check 4: applying a plan

Check four. What does the plan script need before it sends anything with the apply switch? Only the switch? The approved hash, a live collection and a delegated session in the right tenant? A Global Administrator? Or a fixture folder?

## Slide 15 — Scene 5: three failures the service carried

The answer to check four: the approved hash, a live collection, and a delegated session in the right tenant. Scene five. The compliant network policy is built right, and it has been in report-only for ten business days. In that time, forty-one sign-ins would have been blocked from users off the service, which is exactly what the policy is for. But three would have been blocked for users on the service. Those are defects, and the policy isn't ready to enforce. The plan won't enforce it without an explicit switch the policy owner passes. And one partner tenant is allowed by the tenant restrictions policy with nobody's name on it.

## Slide 16 — Try it: not ready, and the plan holds it

Try it. Check the compliant network policy: built right, ten business days in report-only, and three failures carried by the service, so not ready. Read the guide's report-only query: eighteen hundred thirty successes, forty-one failures off the service, three on it. Then plan ring 1, whose desired state wants the policy enforced. The plan leaves it report-only and says why on a manual line: enforcing needs the switch, after the results are clean.

## Slide 17 — Check 5: which failures matter

Check five. In report-only, which compliant network failures are defects to fix before enforcing? Every failure? Failures with through false, users off the service? Failures with through true, users the service carried? Or none, because report-only can't fail?

## Slide 18 — Scene 6: a Finance app that is a VPN again

The answer to check five: failures the service carried. Scene six. Private Access is meant to give a group one application on its ports. The pilot's Finance app is a slash sixteen on every port, assigned to one person, under an enforced policy that doesn't exclude emergency access. Every port includes RDP, so it's also an administrative path with plain MFA. That's the VPN again, under a new name. The RDP app asks only for MFA too, and one cloud connector group has a single active connector. The plan from Scene four brings the RDP policy back to its reviewed file: the phishing-resistant strength and a compliant device.

## Slide 19 — Try it: the private access checks

Try it. Run the private access checks. The cloud connector group has one of two connectors active, and the active one is old. Finance fails four ways: the wide segment, the direct assignment, the missing emergency exclusion, and an administrative path without the phishing-resistant strength. The RDP app fails the same strength check. And Quick Access still holds two segments. Two weeks later, in the workbook, every one of these passes.

## Slide 20 — Check 6: an administrative path

Check six. An application's segment covers port 3389, RDP. What does the kit require of its Conditional Access policy? MFA? The phishing-resistant authentication strength and a compliant device? A trusted location? Or nothing extra?

## Slide 21 — Scene 7: a bypass that expired

The answer to check six: the phishing-resistant strength and a compliant device. Scene seven. The pilot's web filtering works: the acceptable-use categories and threat intelligence are blocked, and QUIC is blocked by the guide's interim path, an Intune firewall rule, because the preview firewall's GCC availability isn't stated. But two exceptions slipped. One bypass expired on November first, and another has no approver. And TLS inspection is in trouble: the certificate has seventy-four days left, inside the ninety-day renewal window, and one and a half percent of sessions failed. The issuer, at least, is a dedicated inspection authority.

## Slide 22 — Try it: bypasses and the TLS checks

Try it. Run the Internet Access checks: the two bypasses fail, and the QUIC check passes on the interim block, with the preview's GCC state written into the finding. Then the TLS checks: the certificate fails on both counts, the pinned payroll site's bypass is the expired one, and the failure share is one and a half percent against a threshold of one. Two weeks later the certificate has been rolled, the bypasses renewed and approved, and all thirteen checks pass.

## Slide 23 — Check 7: the inspection certificate

Check seven. Learn says an expired inspection certificate disables all TLS inspection across the tenant. When does the kit fail the certificate? On the day it expires? With ninety days or fewer left, or less than six months' validity? Only after inspection stops? Or never, because renewal is manual?

## Slide 24 — Scene 8: No-go, then Go

The answer to check seven: with ninety days or fewer left, or less than six months' validity. Scene eight. On November sixteenth, the pilot is measured against the guide's exit criteria. Five business days in, one severity-two ticket open, eighty-three percent coverage, three report-only defects, and one and a half percent TLS failures: no-go. Two weeks later, ring 1 has every fix from the last seven scenes in place. Every metric is met, every criterion passes, and the ring says go. Before it moves on, its rollback is planned in the guide's order, and every run is recorded as evidence that the Zero Trust Assessment's closure register can point to.

## Slide 25 — Try it: the pilot's exit, then ring 1's

Try it. Compute the pilot's metrics and exit. The failing criteria are on the slide: time in the ring, the open severity-two, coverage, the report-only defects, and the TLS failures. Pilot: no-go. Then the same for ring 1, two weeks later: time in the ring passes at ten business days, coverage is a hundred percent, report-only is clean, the emergency exclusion was tested on the ring's start date, and the ring says go.

## Slide 26 — Check 8: signaling in a rollback

Check eight. A ring is being rolled back. Where does turning signaling off come in the guide's order? First, to stop the policies? Last, only after no policy depends on it? Never? Or together with tagging?

## Slide 27 — Scene 9: the same commands, test then production

The answer to check eight: last, only after no policy depends on it. Scene nine. Ring 1 goes live, in a test tenant first and then production, with one settings file per environment and the same commands. Before any change, a read-only preflight checks the stage, the collection, the emergency group's exclusion from every network policy, the logs, and the approved decisions. The ring is enabled from a plan approved by its hash, smoke-tested after its exit period, and rolled back from a plan written before it started if a trigger fires. Production starts only when the test stage's evidence passes. The runbook hasn't been run against a live tenant.

## Slide 28 — Try it: the runbook's fixture run

Try it. The runbook's own fixture run, the fictional tenant at ring 1. The test preflight passes, including the emergency exclusion from all five network policies and the diagnostic setting. The smoke test runs a hundred checks, none fail, and the ring says go. The test stage's evidence forms an unbroken chain, with a passing record for every step the stage needs. And so the production preflight's last check, which reads that evidence, passes too.

## Slide 29 — Check 9: production before test passes

Check nine, the last one. An operator runs the production preflight before the test stage's evidence passes. Does it pass anyway, fail on the check that reads the test evidence, warn and let the operator decide, or apply the plan regardless?

## Slide 30 — Your turn: Lab 2, and where to go next

The answer to check nine: the production preflight fails, because production needs the test stage's evidence first. That's the pilot ring, end to end: decided honestly about what GCC does and doesn't state, logged before anything was enforced, measured device by device, changed only through plans a second person approved, enforced only when report-only was clean, and recorded as evidence an assessor can check. Now it's your turn. Each chapter has a second lab in your own test tenant, never production. Then go deeper: the workbook's chapters and their narrated tours, the learning path, and the implementation guide. Thanks for watching.
