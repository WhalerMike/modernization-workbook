# Book 13 — Governance, Drift & Evidence — narration script (practice copy)

## Slide 1 — Why Does Compliance Decay After the Audit?

This briefing comes from Book 13 of the Federal Modernization Workbook, Governance, Drift and Evidence: why compliance decays the day after the audit, and the governance that doesn't.

I'll take four questions: why a signed package starts aging at once, what keeps governance true between assessments, who governs it, and how to run it at machine tempo, reuse it across agencies and scale it.

The short version: keep one authoritative record, let the systems prove they still match it, and keep people on the decisions only people can make.

## Slide 2 — A package is true on the day it's signed

Picture the week an authorization package is signed. On that day the package is true. The next morning an administrator changes a firewall rule to fix an outage, a contractor's account outlives the contract, a cloud provider ships a new default. None of it reaches the package.

Federal guidance already points away from the snapshot. FISMA sets a floor: test at least annually, with automated tools. There's no federal three-year rule; the authorization's term is the agency's to set. NIST defines continuous monitoring as ongoing awareness, not a calendar. The Risk Management Framework calls reauthorization the static, single point-in-time decision, and asks agencies to make ongoing authorization a priority. OMB's Circular A-130 tells them to make that transition when eligible.

So why do so few systems get there? NIST answers it: without substantial automation, ongoing authorization isn't feasible or practical. And adding checkboxes makes reporting heavier while leaving the change untouched. That's the compliance paradox.

## Slide 3 — Drift is the primary threat

The mechanism has a name: drift. Drift is any difference between what the authoritative record says should be true and what the running estate does. A setting changed and never recorded, an account that outlived its owner, a rule that quietly stopped evaluating.

NIST names the sources: unauthorized change, from attackers or from honest errors by authorized staff; changes made outside change control; provider changes that are hard to detect; staff turnover; and upgrades.

The program ranks drift first among governance threats for three reasons. It's continuous, a gradient rather than an event. It's silent: the directory reports the rule as configured and the console reports the policy as assigned, because each reports what it was told. And it's the opening other threats use. NSA and CISA called the most common misconfigurations their teams find systemic weaknesses.

NIST's controls describe drift detection without the word: a baseline, controlled change, approved deviations, and someone who keeps checking.

## Slide 4 — One authoritative record; every copy is a pointer

Drift can only be measured against something. For twenty years many enterprises kept their governance, unwritten, in the Active Directory tree. A flat cloud directory doesn't carry it, so the program writes the governance down, in one authoritative record.

The record is a version-controlled repository of policies, plans, evidence, schemas and rules. It doesn't master every fact. HR owns who a worker is; the identity platform issues credentials. The record holds the authority: which system owns each fact, and who may write it.

Runtime systems read it and never write it. Private copies are forbidden, because a local copy someone reads because the repository was slow is a second source of truth. Every derived report carries its source, version, time and producer.

The record covers six control planes, each authoritative for one domain, so every finding has one owning team. NIST's CM-2 baseline is this record, kept in a form machines can compare.

## Slide 5 — Every change travels one path, and leaves its proof

A record is only as good as the path into it. Most drift isn't malicious; it's a hotfix during an outage. So the program allows one path for every operational change, whether it moves, adds, changes, deletes or resets something, and no second path for urgent work.

The path has five clauses. Originate from the source of truth. Authorize from the authority model, not from whoever is nearby. Execute under least privilege, elevated just in time. Close with the verification that justified it. And emit the evidence automatically. Skip a clause and the operation isn't a change with a missing form; it's a drift finding.

Changes to the record travel as reviewed pull requests: two people, a signed merge, and branch protection that binds administrators too. Emergencies are back-ported within one business day, and reported as drift until then.

The identity that decides never acts, and the one that acts never decides. And no closure counts unless it carries its proof.

## Slide 6 — Deterministic rules: same inputs, same evidence

When the program says a control is satisfied, how does anyone know it's right? The usual answer is trust. The program's answer is determinism: given the same version of the record and the same collected inputs, the platform produces the same evidence, byte for byte. Then an assessor doesn't have to trust the run. They repeat it and compare the hashes.

Automation isn't the same thing. Automation makes the answer arrive faster; determinism makes it the same answer no matter who asks.

The rules live in three layers, each with its own reviewer. Rules say what exists and what it means, and change only through governance review. Mappings say which rules apply to which controls. Runtime code evaluates them, and is the only layer allowed to change state.

One limit: determinism is faithful to the record, not a check on it. A wrong rule gives the same wrong answer every time.

## Slide 7 — The drift engine: one model, computed severity

The drift engine compares observed state with a versioned record, not a last-known-good snapshot. An approved change updates the record first, so it isn't drift.

There's one drift model, with five classes, each a question. Schema: is the shape still valid? Semantic: is the value still true? Provenance: does every change trace to an authorized source? Authorization: did anything act outside what it was authorized to do? Identity: does every object resolve to the record? The drift checks in the other books are instances of these five, not separate lists.

Severity is computed, not argued, from the class and whether the claim is in active use. P1 halts and alerts a named role, and is never fixed automatically. P2 has an hour, P3 a day, P4 three days. Severity sets the clock; the actuation ladder decides who may act.

And be precise with an assessor about what's built: schema and provenance detection are built, semantic is partial, and authorization and identity are still design.

## Slide 8 — Evidence over attestation

An attestation is a person signing that a system was in a stated condition. It answers who is accountable, and federal authorization needs that answer. Evidence answers a different question: is the claim true, and can I check it? 

The program inverts the usual package. Evidence is the substance, and attestation is the accountability wrapper: people sign for the rules, the exceptions and the acceptance of risk.

NIST's assessment guide says that when the intended state is expressed as data and compared automatically with the actual state, the output is equivalent to control assessment results. The Risk Management Framework lets a tool's report serve as the assessment report. And FedRAMP's 2026 rules tell assessors: don't simply review documentation or screenshots.

Be careful what you claim. A hash shows that something changed. A hash chain shows removal or reordering. Only a signature shows who produced it. And some controls, like a training record or a contract clause, stay attestations.

## Slide 9 — Adapters: every platform, one record

The program doesn't replace the platforms an agency runs. It reaches each one through an adapter: a translator that reads the platform's native state through its own interface and writes it into the program's common record, with provenance. The rules, the drift engine and the evidence chain see one record, whichever vendor produced it. Adapters hold no rules and make no decisions.

Adapters come in two kinds, kept in separate lists. Conformance adapters are read-only and sit at L1. Modernization adapters change state, only on authorized plans, at L3 by default. Each declares one of five missions, and every one inherits four invariants.

Read-only comes first, and it has to be verified. CISA's ScubaGear is read-only in purpose, yet its documentation notes that a Global Administrator always has the permissions it needs. So the program compares what an identity is actually granted with what it declares.

Lock-in doesn't disappear. It moves to small, replaceable adapters and to a record the agency owns.

## Slide 10 — Who keeps the record, and who decides

None of this machinery decides anything. A drift finding asks: change the estate, change the record, or carry the difference? Only people can answer the last two, so the program names one decider for each.

The steward keeps the record: its protections, merge rights, checks and backups. The steward doesn't decide what the facts mean; HR, application and data owners do. The CISO decides control requirements, even when they're written as code, and decides on drift evidence. The governance board is the change control element NIST's CM-3 calls for. It meets every two weeks and reviews rather than votes, so every decision has one accountable owner.

The authorizing official, the only official who can accept risk, signs every open-ended gap and every class of change allowed to run at L4. A bounded exception, with an end date and a compensating control, is the CISO's, and none renews automatically.

And the repository is a federal record: the records officer decides retention, and history is never rewritten without that decision.

## Slide 11 — Ticket to machine, within the actuation ladder

A platform that detects perfectly and closes slowly produces an accurate list of things nobody fixed. Tempo keeps that list short. The program declares a response window for each severity: immediate for P1, then an hour, a day and three days. External clocks win: a known exploited vulnerability runs on BOD 26-04, and an incident runs on CISA's one-hour notice.

The usual ticket sends a person to a console, and their reply of done is an assertion. The program's rule is that wherever a machine can reach the surface, the ticket authorizes a machine. A person approves; the platform executes from a versioned plan under a service identity, after a dry run, and re-reads the object to verify.

A class qualifies when it passes six tests. At L3, the default, a named approver releases each instance. At L4 the authorizing official accepts the whole class in advance. Conditional Access and tenant-wide role changes stay at L3 permanently. Where no machine can reach, the fallback is a declared, recorded privileged session, never a quiet trip to the console.

## Slide 12 — Reciprocity: shared evidence, each agency's decision

A platform that twenty agencies use is examined by twenty assessment teams, producing twenty snapshots at twenty different times. Reciprocity is the alternative. NIST defines it as accepting each other's assessments. Nothing in it lets one authorizing official accept risk for another agency.

NIST gives three mechanisms. An authorization to use accepts another federal entity's package, and the customer's official carries the same responsibility as one issuing an authorization to operate. A joint authorization has several officials accept one system's risk together.

For cloud services, OMB's M-24-15 makes reuse the default: agencies presume a FedRAMP package adequate, but only while continuous monitoring maintains it, and asking for more needs a documented need. FedRAMP is plain that each agency still authorizes its own systems. Its 46 Key Security Indicators bind providers, not agencies; agencies review each provider's quarterly report.

So the program's old single-authorization wording is corrected: one package, many decisions, each agency signing for its own risk.

## Slide 13 — Governance at scale: small definitions, honest coverage

A real agency doesn't have one estate. It has hundreds of systems and several boundaries. NIST draws the line: each system's monitoring strategy follows an organization-wide one, approved by the senior accountable official for risk management, with minimum frequencies.

The program's scaling rule is to hold the definitions small and let the uses grow. The record's core, the five drift classes and the four severities stay fixed, so a P1 means the same thing in every program. Adapters, mappings and evidence grow, each validated on entry. Boundaries are recorded as governed objects, so findings cite the boundary they crossed.

Coverage is reported honestly. Every control is covered, partial, a gap, or out of scope. Every partial or gap enters a register with an owner, the evidence that will prove closure, and a date. It closes by configuration, by a compensating control, or by the authorizing official's acceptance, and closed items stay for audit.

## Slide 14 — Decisions to make, and next steps

So, four decisions.

Charter the governance board in writing and name the steward, with one decider for every kind of decision.

Settle the record before the next migration: which system owns each fact, the rules, and the provenance each value carries, so the migration changes who supplies a fact, not what it means.

Set the tempo: response windows by severity, gated actuation at L3 by default, and the authorizing official's signature on every class that runs at L4.

And plan the move to ongoing authorization, on evidence the systems produce rather than attestations people assemble.

The next step needs no procurement. Classify every control's coverage, open the gap register, and record every drift finding in the same contract shape, however it was found.

A package describes one day. Governance that doesn't decay keeps proving itself every day after. The Federal Modernization Workbook's Book 13 has the detail, every claim footnoted. Thank you.
