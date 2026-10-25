# Book 14 — Federal Compliance & Authorization: executive briefing — narration script (practice copy)

## Slide 1 — Federal Compliance & Authorization: executive briefing

Welcome. This is the executive briefing for Book 14 of the Federal Modernization Workbook, Federal Compliance and Authorization. It's for the people who sign for a system or answer for it: authorizing officials, the CISO and CIO, ISSOs, the privacy officer and program managers. The book's argument fits in one line. A control described in a plan but never shown working is a promise, and an authorization built on promises decays the day after the assessment. I'll take four questions: why every control needs proof, what each control family needs, who owns compliance, and how to build and keep the package. Each decision slide names the decision, its owner, and when it's needed. Let's start with who owes which proof.

## Slide 2 — A promise ages; proof can be checked again

An authorizing official doesn't need to know a control is supposed to be in place. They need to know it is, today, and how they know. A promise is a statement in the security plan, backed by evidence someone gathered by hand. It's been aging since the day it was signed. Proof is a record the system produces, which another reviewer can check again and get the same answer. The proof is owed by different parties, too. The provider proves its service; the agency proves its own system. So the decision for the authorizing official: reuse the provider's certification as evidence, and authorize the agency's own system that uses it. Next, what Moderate commits you to.

## Slide 3 — “Moderate” is a commitment of a known size

Most civilian cloud systems are authorized at Moderate, and the word is a commitment of a known size. The agency rates each kind of information it holds; one moderate rating and none high makes a moderate system. Then it tailors NIST's Moderate baseline: 287 controls and enhancements, every one of which the authorizing official accepts on the evidence. FedRAMP's Class C is a separate fact. It lists 322, and 36 of them sit outside NIST Moderate. So cite the two separately. The decision: the authorizing official, with the privacy official for any system holding personal information, approves each categorization before a single control is selected. Next, why annual is only the floor.

## Slide 4 — Annual is the floor, and tools only confirm a design

Some programs still plan around a three-year authorization. There's no such rule. FISMA requires testing at least annually, and OMB's Circular A-130 points agencies to ongoing authorization once a system is eligible. Only proof can keep up with that, because only proof can be regenerated without rebuilding it by hand. It's also why assessment tools come last. A tool like ScubaGear measures drift from an intended design; it can't author one. Run first, it hands you an accurate list of findings and nothing that keeps them closed. So the decision for the CIO and executive sponsor: fund the mechanisms that produce records before the tools that measure them, and run the tools as confirmation. Next, the federal clock.

## Slide 5 — The federal clock: the dates ahead, and whom they bind

The dates that drive this work belong to FedRAMP, CISA and OMB, and each one binds a different party. As the book checked on October 21, the post-quantum migration plan was due the next day. The Agency Logging Plan falls on November 18. On December 7, BOD 26-04's remediation timelines bind agencies, while FedRAMP's vulnerability rules bind providers. And FedRAMP's 2026 rules become mandatory on January 1. And dates move: several in the program's own sources had drifted. So the decision: keep one dated register, with the source, the exact wording, whom it binds, and the day it was last checked, and re-verify it at every gate. A date in a package is evidence. Next, what the directives leave behind.

## Slide 6 — Directives leave standing work; support dates bind too

Most directive deadlines have passed, but their requirements haven't. BOD 26-04 replaced the old remediation directives with timelines set by risk, and its third phase lands on December 7. BOD 25-01's dates are done, yet every new cloud tenant still needs its baselines in place before it's authorized. And a job that must run every seven days is only proven by records showing it did. Vendor support dates become compliance dates too: through the baseline, through directives like the one on end-of-support edge devices, and through the authorization itself. So the decision for the authorizing official: retire each unsupported component by its date, or explicitly accept the risk of keeping it, as an open item. Next, what each control needs.

## Slide 7 — Two facts and one index: the baseline and the crosswalk

“Is this required at Moderate?” sounds like one question. It's two: NIST's baseline for the agency's system, and FedRAMP's class for the provider's service. The series crosswalk indexes 149 controls, but it's a pointer to where each one is treated, not proof it's closed or inherited. It covers fewer than half the Moderate baseline, so it can't stand in for the security plan. The decision: fill the product inventory questionnaire against the estate as it is, verify each FedRAMP status on the day you record it, and decide every flag before the security plan is written. An uncertified service inside the boundary goes to the authorizing official. Next, when a control is closed.

## Slide 8 — A control closes only with its proof

Is a control closed? Too often the answer is that the product was bought or the ticket was marked complete. None of those is the control operating. The book applies two tests. The mechanism exists and reaches what the control covers. And its proof is recorded: a machine-readable check, a time, and what did the checking. A control that passes the first and fails the second is worse than open: it looks closed and can't be shown to be. And a vendor roadmap isn't a commitment; date every claim and confirm it first. The decision: count a control closed only on both tests, and keep roadmap items in the plan of action. Next, what no provider can close.

## Slide 9 — Program management: the agency's, never the provider's

Some control families no cloud provider can close for you, and program management is the first. NIST marks the whole family organization-wide, outside every system baseline, and FedRAMP certifies none of it. The obligation comes from FISMA and Circular A-130, and it binds the agency whether or not it uses a single cloud service. No product can write a risk tolerance or appoint a senior official. These controls close when the artifact exists, a named official approved it, and the agency can show it's still followed. The decision belongs to the head of agency: approve the risk strategy and its tolerance, because every later plan-of-action date and every risk acceptance will cite it. Next, contingency.

## Slide 10 — Contingency: a plan, not a capability

An agency can have tested failover, two circuits and good backups, and still carry an open contingency plan finding. The control asks for a plan, not a capability: who declares a contingency, who's told, what comes back first, and when operations are back to normal. The runbooks are its appendices. For a Moderate system, NIST recommends a functional exercise that includes a restore from backup, not just a tabletop. And a replica isn't a backup; it copies ransomware as faithfully as a good transaction. The most important number isn't technical. So the decision: each mission owner signs the maximum tolerable downtime, and it's never lowered to fit a convenient technical answer. Next, supply chain.

## Slide 11 — Supply chain: know what you run; contract for the rest

Most of the code an agency runs was written by someone else, and federal policy on it moved this year. In January, OMB's M-26-05 rescinded the secure-development attestation mandate. The complete software and hardware inventory is still required. Attestations and software bills of materials became agency choices, made through contract terms. Even so, a supply chain policy, plan, acquisition terms and notification agreements sit in every NIST baseline, and they close through governance, not technology. From December 7, FedRAMP's vulnerability rules bind providers, and the agency folds their reports into its own plan of action. The decision for the contracting officer: acquisition by acquisition, decide whether to require an SBOM on request. Next, privacy.

## Slide 12 — Privacy: a public promise the agency keeps true

Privacy compliance is a public promise: why the agency holds each kind of personal information, and under what authority. NIST's privacy baseline applies whatever the impact level, and FedRAMP certifies none of it, so the agency closes these controls end to end, through documents the public can read. One timeline catches programs out. A new or significantly changed system of records is reported to OMB and Congress at least thirty days before its notice goes to the Federal Register, and new routine uses then wait out a thirty-day comment period. So the decision for counsel and the privacy official: start that notice at least sixty days before the first collection. Next, training.

## Slide 13 — Training: a record with a denominator

Training is the one family no configuration can close. It closes when the right people were trained for the roles they actually hold, and the record proves it. A dashboard showing ninety-eight percent completion is a number with no denominator. Measured against which roster? And are the people in high-risk roles in the two percent who haven't finished? The rules are simpler than most programs think: training before access, and awareness at least annually. Social engineering awareness is required at Moderate; phishing exercises are optional. The decision is the CISO's: set the completion threshold, and treat every overdue person in a privileged role as a finding, whatever the percentage says. Next, who owns all this.

## Slide 14 — Who owns compliance: one decider per row

Ask who owns compliance, and the answer is often the security office, which means nobody in particular. The failures happen between the jobs: a plan of action nobody updates, a privacy plan nobody approved, a risk acceptance signed by someone who couldn't sign it. The Risk Management Framework names an owner for every task. The system owner owns more of them than anyone. The authorizing official is the only one who can accept risk. And six roles are government-only, so a contractor-heavy team can prepare every package but sign none of those decisions. The decision for the head of agency and CIO: make every role a signed appointment with a name, not an organization chart. Next, the authorization path.

## Slide 15 — The authorization path, and what keeps it honest

The authorization path is where ownership gaps show first, because each step hands off to the next. The system owner and ISSO categorize and plan. The authorizing official approves, picks the assessor, and approves the assessment plan, before testing starts. The assessor reports. The system owner fixes what was found and assembles the package. And the authorizing official alone decides. The handoffs fail in predictable ways, like a system owner who picks and pays the assessor. So keep the roles apart: nobody assesses their own work, and the authorizing official isn't the system owner. The decision: the authorizing official selects the assessor and sets its independence before the assessment starts. Next, the package.

## Slide 16 — The package: four linked, machine-readable records

The authorizing official doesn't read the evidence directly. They read a package that summarizes it: the plans, the assessment, the report, and the plan of action. NIST says the package may be generated by a tool, and FedRAMP's agency rules expect machine-readable records. Generated, the package describes the system today, not the day someone assembled it. Every failing item gets one disposition: open, with an owner and a deadline; an exception with an expiry date; or a lapsed acceptance that falls back to open. Nothing is permanently satisfied. The decision for the authorizing official: before accepting a clean result or an empty plan of action, ask what the assessment didn't look at. Next, keeping it current.

## Slide 17 — Continuous monitoring keeps the package current

A package describes the system on the day it was generated. Continuous monitoring keeps that day recent. The program's rhythm, as its own design: every month, regenerate the results and the plan of action, and report posture to the authorizing official. Every quarter, review each provider's certification report; FedRAMP's rule says agencies must. Every year, an independent assessor re-assesses every control. Once monitoring is mature, a review frequency can replace the end date. And vendor posture scores stay signals, not assessment evidence. The decision for the CISO: name the federal senior official who reviews each provider's report, and keep a record of every review, before FedRAMP's rules become mandatory on January 1. Next, what remains.

## Slide 18 — What remains: the residual risk the AO must see

Build everything the book describes, and risk still remains. Self-assessment, until an independent assessor confirms it. What automation can't see, like policies and whether training worked. Risk inherited from providers. Evidence that quietly stops arriving. Risks outside control testing, like mission and insider risk. And design not yet built, or vendor features not yet shipped. None of this argues against the program. It argues for writing the remainder down. One green score hides the same risk and makes it the official's anyway. So the decision: from the next update, every package lists what's proven, asserted, inherited and accepted, and the authorizing official accepts it, or doesn't. Finally, the decisions together.

## Slide 19 — Decisions to make, owners and timing

So, the decisions and their owners. None is a procurement. The authorizing official authorizes the agency's own system, approves each categorization first, selects the assessor, and decides on every unsupported component. The head of agency approves the risk tolerance and, with the CIO, signs named appointments. The CIO funds the mechanisms that produce records before the tools that measure them. The CISO sets the training threshold and names who reviews each provider's report. Mission owners sign their downtime limits, counsel and the privacy official start notices early, and system owners show what's proven, asserted, inherited and accepted. A promise is true on the day it's signed. Proof keeps showing itself. Thank you.
