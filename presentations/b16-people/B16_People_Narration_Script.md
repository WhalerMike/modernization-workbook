# Book 16 — People: Training & Education — narration script (practice copy)

## Slide 1 — Who Will Run the New Estate?

This briefing comes from Book 16 of the Federal Modernization Workbook, People: Training and Education. It's written for C I Os and CISOs, workforce and training leads, I S S Os, and help desk leads.

I'll take four questions: why people, not tools, close the gap; what the program teaches; who owns workforce readiness; and how to run the curriculum and measure whether it worked.

The short version: every book before this one changes what someone does. Tools enforce the new rules, but people run the estate, and a program that trains last pays twice.

## Slide 2 — Tools enforce; people decide

A Conditional Access policy can require phishing-resistant sign-in for every user. It can't decide what happens when a caller tells the help desk their security key is lost and they need to sign in now. An entitlement review can list everyone with access, but it can't make the owner read the list. A drift check can find a server that left its baseline, but it can't say whether the exception behind it was ever approved.

The program's position is that this technology moves risk from configuration to judgment. What's left is a smaller number of human decisions that carry more weight. And almost every book splits a job into deciding and doing, and moves some decisions to people outside I T, such as HR staff and application owners. A person who doesn't know the new rule falls back on the old habit, which is exactly what the modernization was meant to remove.

## Slide 3 — Training last is paid for twice

Many programs train at the end: build, migrate, then train. The program's observation is that this is paid for twice.

The first payment comes at cutover. Users who weren't taught the new sign-in call the help desk. A help desk that wasn't taught the new verification either refuses legitimate callers or resets accounts without the checks meant to stop impersonation. Administrators ask for standing roles until things settle, and exceptions granted under pressure tend to stay.

The second payment comes afterward. The workarounds have to be found and removed, people retrained, and habits unlearned, which is slower than learning.

Federal rules already put training before the change. OPM's rule requires awareness material before access, and training whenever the system environment or procedures change significantly. NIST's controls ask for training when system changes require it, and OMB Circular A-130 requires role-based training before access is authorized. So training last also puts the agency behind requirements it already has.

## Slide 4 — What federal workforce rules require

FISMA is a staffing requirement as much as a course requirement: the agency head must have trained personnel sufficient to comply, and the C I O trains and oversees people with significant security duties. OPM's rule names five audiences, from every user to I T operations staff. Circular A-130 has the chief human capital officer and the C I O set competency requirements together. And the Federal Cybersecurity Workforce Assessment Act requires every agency to identify its cyber positions and code each one to the NICE Framework, NIST's vocabulary of forty-two work roles.

The codes haven't been reliable. In 2019, GAO found that 22 of 24 agencies had given a non-I T code to about nineteen percent of their I T management positions. So the program treats codes as one roster input, not settled fact.

Just as important is what the rules don't require: no civilian certification mandate, and the Defense Department's eighty-one forty program doesn't apply to civilian agencies.

## Slide 5 — Education first, then training by role

Now what the program teaches. It separates education from training. Education builds the mental model, for everyone, before any tool, and it teaches six ideas in order, because each depends on the one before. Governance is a system that runs continuously. Identity is the starting point. One map replaces many inventories. Every derived record names its source and version. Modernization is a lifecycle under change control, not a project that ends. And drift is the feedback signal.

Someone who holds those ideas understands why the help desk now asks for verification, why a role is activated instead of held, and why a screenshot isn't evidence. Orientation comes as a ninety-minute walkthrough, a self-serve written path, and a forty-five-minute briefing for auditors and assessors.

Training comes after, by role, in four tracks: compliance, for people who evidence controls; implementation, for people who build; vendor training and labs; and end-user training for everyone who signs in.

## Slide 6 — The compliance track teaches tracing

The compliance track is for the people who read evidence rather than build it: I S S Os, compliance staff, control assessors and authorizing officials. It teaches one skill above the others, tracing. Given a control, name the mechanism that closes it, the book that built it, the record it emits and where that record sits in the authorization package. Given a record, work back to its control and say whether it's current.

The orientation module carries four ideas: the Risk Management Framework's seven steps; who owes which proof, with only the authorizing official accepting residual risk; Moderate and FedRAMP's Class C as two facts, not one; and FedRAMP's forty-six key security indicators binding providers, not agencies.

Eight modules then follow the program's evidence areas, from identity to training. Each one teaches a discipline: a policy screenshot can't show that a sign-in was phishing-resistant; only the sign-in record can. The capstone is a continuous-monitoring narrative for one system.

## Slide 7 — Implementation: done means the evidence landed

The implementation track teaches the same estate from the engineer's chair, in ten build modules from D N S and address management to day-two operations. The order is a real dependency chain: address before you identify, identify before you shape transport, transport before you place data, and certificates before the network enforces. Devices, the cloud platform and security operations run in parallel once identity exists. Day two comes last, because it runs what everything else built.

Every module ends the same way. Done means it works and its evidence has landed where an assessor can read it. Every lab teaches three habits: observe before you enforce, with report-only, monitor and shadow modes; keep a way back in, with emergency access accounts created first; and export the record, not a screenshot.

Certifications are examples, not proof, and they change. Microsoft retired AZ-500 on August 31, 2026, and SC-500 replaced it. So the program re-checks its certification table at every gate.

## Slide 8 — Certify what people can show

Federal guidance asks for more than completion. A-130 asks agencies to test users' knowledge, and NIST's learning-program guide recommends practical assessments that mimic the work role. So the program certifies only what a person can show, with an artifact someone else could check.

Every capstone is scored on one four-level scale. Zero is missing. One names the right books but gets the controls or the evidence wrong. Two traces the chain from book to control to evidence source. Three is assessor-ready: a real, dated result, with an honest statement of what isn't evaluated yet. The compliance capstone passes with every area at two or better, at least three at three, and all four whole-submission checks. An after-action report with no findings scores zero, and so does a training percentage with no per-person records behind it.

Two credentials follow: practitioner for builders, assessor for compliance staff. Both expire after twelve months. An industry certification can waive a module, but never a capstone.

## Slide 9 — Vendor training, and labs that can't hurt production

Vendors teach their products, and the book names them as examples, never endorsements. A vendor course earns a place only if it passes four tests: it maps to a book procedure; it's current; the agency can keep its completion record; and the agency knows how the vendor handles learner data. Exam records tied to a work account are lost when the person leaves, so the agency keeps its own record.

Lab environments are harder to get than most programs expect. Microsoft Learn's free sandboxes are gone. The developer sandbox has eligibility limits and isn't offered in any government cloud, and there's no free sandbox in G C C High at all. So the program office arranges lab tenants, and before each gate the team rehearses once in the agency's own non-production government tenant.

Every lab follows the same rules: never production; emergency access first; observe before enforcing; no sync or federation with production; synthetic data only; and tear it down at the end.

## Slide 10 — Every user signs in differently

Every user will sign in differently. Federal policy sets the target. OMB's zero trust memo and NIST's authentication guideline require phishing-resistant sign-in for staff, contractors and partners, and passwords, one-time codes and push approvals don't qualify. So users learn a PIV card, Windows Hello for Business or a passkey, with at least two methods registered.

The course has six short modules: sign-in; reset and recovery; devices; where files now live; reporting; and what the help desk will and won't ask. Password lessons teach length and passphrases, not character classes.

The last module matters most, because the help desk becomes a target the moment users trust it. CISA's Scattered Spider advisory describes attackers posing as I T staff. The real help desk never asks for a password, a PIN or a code, never asks you to approve a prompt for them, and never sends a pass to an address you give on the call.

## Slide 11 — One decider per row; the reporter doesn't decide

Ask who owns training and three offices answer at once. Between them, nobody owns whether people can do the new job on the day it changes. So the program keeps one decider per row.

The sponsor and C I O fund the learning program and decide each wave's readiness plan. The CISO owns the training policy, the completion threshold, and the exact words users are taught about sign-in, reporting and the help desk. The chief human capital officer's office owns workforce strategy, position coding, the facts behind the rosters, and labor relations.

The training lead builds the curriculum and reports the numbers, but never declares a wave ready. The I S S O reviews the training record. The program office puts training into every gate. Supervisors own completion; the help desk manager decides whether the desk is ready; communications owns one sender. Contractors can build and deliver it all, but government officials make the decisions.

## Slide 12 — Run training on the roadmap's calendar

The curriculum runs on the roadmap's calendar. The planning rule is simple: no gate is scheduled without its training dates, and no wave without its training window, so a wave that slips moves its training with it.

Each gate carries a training check beside its technical exit. At the foundation gate, the help desk is trained on verification and administrators on just-in-time activation. Pilot and division users are trained before their waves. And by the last gate, no course still teaches an Active Directory procedure. The help desk goes first: no technician is made eligible for a help desk role until their training and verification check are on record.

Before each wave, champions and managers start sixty to forty-five days out, the help desk is trained by thirty days, users are assigned their modules at thirty, with reminders at fifteen and seven, and then the readiness check.

## Slide 13 — Measure readiness, not attendance

A completion record says someone finished a course. Readiness says they can do the job on the day the change arrives. Following NIST's learning guide, the program measures four levels: reaction, from surveys; learning, from assessments and labs; behavior, from help desk ticket trends, sign-in method registration and verification audits; and results, from gate outcomes.

The rule is completion for everyone, and competence for every role where a mistake is a security event: help desk technicians, privileged administrators, I S S Os, and the people named in incident and contingency plans. For them, completion without a passing assessment doesn't count.

Registration by wave is the most direct end-user measure, and it costs nothing to collect. A wave that isn't ready moves its date, not its threshold, and the pilot sets the baselines. The steering committee gets one page at every meeting, in counts, not names, with privileged gaps as a count, because each one is a finding.

## Slide 14 — Decisions to make, and next steps

So, four decisions.

Put training in every gate, measured against a roster from HR and identity records, not a headcount. A gate passes with a gap only as a named, dated exception.

Train and verify the help desk first, before any new role is assigned and before every wave.

Name the owners and keep them apart: the chief human capital officer and the C I O set competencies, the CISO owns the security words, and the training lead reports while others decide.

And certify with artifacts: capstones and two credentials, renewed every year.

The next step needs no procurement. Build the role roster from HR records, coded positions and eligible-role assignments; name a training lead and an owner for each track; and brief the workforce office, labor relations and the Section 508 program manager before the first gate.

People, not tools, close the gap. The Federal Modernization Workbook's Book 16 has the detail, every claim footnoted. Thank you.
