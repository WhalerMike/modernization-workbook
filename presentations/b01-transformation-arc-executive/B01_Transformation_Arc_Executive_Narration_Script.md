# Book 01 — The Transformation Arc — Executive Briefing — narration script (practice copy)

## Slide 1 — Who Leads the Governance Rebuild?

This is the executive briefing for Book 01 of the Federal Modernization Workbook, The Transformation Arc. It runs about thirty minutes, and it's for the people who sponsor, fund, secure and authorize the move from a domain-joined client and server estate to cloud identity, cloud device management and governed hybrid operations: executive sponsors, CIOs, CISOs and authorizing officials.

The book's argument fits in three sentences. For twenty years Active Directory quietly did governance that nobody wrote down, so modernization is a governance rebuild, not a platform swap. The estate has to be analyzed before anything moves, and the work delivered in gated phases with a rollback at every step. And leadership's job is to conduct the orchestra, not to play the instruments.

I'll take four questions in order. Why modernization is so hard. What changes across the platform, identity, policy, network services, compute and access. Who leads the transformation. And how to analyze the estate, turn the analysis into delivered change, and follow a gated roadmap to the retirement of Active Directory.

There's no configuration on these slides. Each decision slide names the decision, who owns it, and when it's needed.

## Slide 2 — Every new mandate assumes a foundation never built

Start with how the estate got here. Federal IT reached its current shape in four eras, and each solved a real problem.

The mainframe held all the data and also enforced access to it: one truth, in one box. Distributed systems put a database and a directory in every region, and nobody replaced that single source of truth. From 2010, OMB set a target of closing at least eight hundred data centers, and agencies stacked inspection devices between field offices and the systems they depended on. Then email moved to Microsoft 365 and workloads spread across clouds, while identity stayed in regional domains. Now the same person can appear as several records, and no one can say which one is authoritative.

That's why modernization stalls. Each step assumes the one before it is finished. Zero Trust assumes authoritative cloud identity. Cloud identity assumes a clean directory. A clean directory assumes governed groups. And governed groups assume someone owns them, which is where many agencies are stuck.

Meanwhile the mandates arrive with dates: M-22-09's Zero Trust goals for fiscal 2024, BOD 25-01's baselines by June 20, 2025, and M-26-14's logging reset in May 2026. Each assumes a foundation the estate never built.

So the first decision is about ownership, not technology. Before anything is planned, name the executive sponsor, the steward who runs the program office, and the authorizing official. The roadmap makes that the entry condition for its first phase.

## Slide 3 — Active Directory was the governance nobody wrote down

Chapter 02 states the problem precisely. Active Directory shipped with Windows 2000 as an identity directory. Over twenty-five years every Windows-era service wired itself into it, because it was the only enterprise-wide, governed, replicated namespace available. Nobody wrote down how much governance it carried.

The organizational unit (OU) tree wasn't a folder system. Placing one user in a branch handed the account to that branch's delegated administrators, applied every Group Policy linked along the path, fed the tools that built groups from position, bound the account to the branch's delegation, and drew an audit boundary. One act, five effects. Entra ID has no OU tree, so each effect has to be rebuilt on purpose.

Most migration plans count users, computers, groups and Group Policy. The program's inventory counts eleven categories, adding service accounts and service principal names, DNS and DHCP, certificate services, RADIUS, LDAP-bound applications and trust relationships. Those fail silently: a certificate that doesn't renew, an application whose bind account was deleted with the domain. No log line says governance has failed.

Microsoft hasn't deprecated Active Directory. It still supports and enhances it, while pointing customers toward a cloud-first model reached in phases. So there's no vendor deadline; retiring it is the agency's decision.

That makes scope a decision for the sponsor and the CIO: fund this as a governance transformation across all eleven categories, not a users-and-groups project, when scope and funding are set.

## Slide 4 — Five things must be true before the target holds

What has to be true? The workbook reads federal Zero Trust guidance as requiring five things. No single document publishes this list; it's the program's synthesis of SP 800-207, M-22-09, CISA's maturity model and M-26-14.

One: a single authoritative source of identity, one record per user, device and account. Two: a governed directory, rationalized before the move to a flat cloud directory, not after. Three: continuous verification, not one-time sign-in. Four: telemetry used for management, feeding governance and not only incident response. And five: governance that runs automatically, because manual review can't keep up with a hybrid estate.

The third is where the old world and the new differ most. In Active Directory a user signs in once and gets a ticket that lasts ten hours, renewable for seven days. Entra ID checks tokens against Conditional Access: an access token lasts one hour by default, or up to twenty-eight hours under continuous access evaluation, which revokes it within about fifteen minutes of an event such as a disabled account.

Distance matters, but narrowly. What it hurts is the operations that need a domain controller: hybrid-joined devices need line of sight for sign-in, password changes and policy. Light in fiber from Portland, Oregon to Washington takes about forty-five milliseconds round trip, and bandwidth doesn't change that. The durable answer is to remove the dependency.

## Slide 5 — Platform: one governed host, one authoritative writer

Now what changes, starting with the platform: one place where every decision is written down, signed and replayable.

The book's reference design runs every analysis, plan, delivery and evidence step on one Windows Server 2025 host, with a standby for recovery. The property that matters is a single authoritative writer: two writers would diverge. Every change is a signed commit, never a portal click. It's built from standard components; it isn't a product.

Two design rules matter at this level. First, governance and execution never mix. The governance layer validates plans, signs them and writes the audit trail, but never touches a target. The execution layer runs authorized plans and decides nothing. They run under separate identities, because a component that both decides and acts can cover its tracks.

Second, the host is a control-plane asset. It reads the forest and writes to cloud identity, so it's treated as Tier 0: hardened, and logged centrally under M-26-14. The program's target posture for federal production is gated actuation. The host proposes a correction, and a person approves it before it runs.

The decision belongs to the program office, under the steward: stand up the host as the only authoritative writer, protected as Tier 0, and record the standby model and the actuation stage in the decision log. Gate G0 needs it operational by the end of Phase 0.

## Slide 6 — Identity: the attributes have to be true first

Identity comes first in the chain, because policy, devices and access all target identity groups.

The OU tree carried delegation, policy scope and accountability in one structure. A flat cloud directory has none of that until the program writes it down. The book rebuilds it with four Microsoft mechanisms bound into one model: attributes, dynamic groups, administrative units and Conditional Access. Setting a user's attributes from the HR record produces every downstream effect: group membership, delegated scope, policy targeting, licenses and drift visibility. One stamp, five outcomes.

That only works if the attributes are true. M-22-09 requires centralized identity management for agency users. For the workforce, the authoritative source is the HR system of record. HR owns who works for the agency, where they sit and who they report to. A dynamic rule is only as trustworthy as whoever can write the attribute it reads, so the help-desk and self-service write paths are removed, and HR provisioning is the only writer.

Then joiner, mover and leaver run on their own. Tokens don't fix a wrong model; they sign broken authorizations efficiently.

So HR decides what the authoritative attributes mean, and identity engineering decides how they flow. Contractors need an authoritative source of their own. Gate G1 requires the HR feed working before any rollout.

## Slide 7 — Policy: regenerate Group Policy; don't copy it

Policy is next. Group Policy was Active Directory's most ambitious delivery system, and its most network-bound: a client applies it only when it can reach a domain controller. A cloud-native endpoint gets its configuration from the cloud instead.

The replacement is several surfaces: Intune for devices, Conditional Access for access control, and Azure machine configuration, through Arc, for servers, because Intune doesn't manage Windows Server.

The program's pattern is regenerate, not copy. Porting a fifty-setting policy as fifty modern settings carries forward dead weight and old conflicts. Microsoft's own recommendation is to start new rather than migrate.

Four rules govern every change. Each setting has exactly one owning layer. Require is preferred to block, because a bad block locks users out and a bad require adds a step you can fix; blocks are kept for cases such as legacy authentication, which the federal baseline demands. Every change passes plan validation, a simulated tenant, a report-only pilot, and only then production. And the emergency access accounts are excluded from every blocking policy.

The decision is the CISO's: the control requirements every surface must meet, meaning the Conditional Access baseline, MFA strength and logging. Gate G1 needs that baseline enforced, with no user outside the MFA requirement except the documented emergency accounts.

## Slide 8 — Network services: DNS, DHCP and IPAM move together

Network services are the part organizations most often defer, because DNS, DHCP and address management still work. That's exactly how they keep the old directory alive.

The three form one surface. DNS usually lives in zones integrated with Active Directory, so every domain controller sits in the name-resolution path, and Active Directory can't retire until DNS moves. DHCP servers are authorized in the forest, but that check is Windows policing itself: it stops an unauthorized Windows server, not a rogue device. And address management, in many organizations, is a spreadsheet one person maintains. Without it, DNS and DHCP drift.

So the program moves them together. One governed IPAM authority covers the whole address surface, on-premises and cloud, and DNS and DHCP derive their records from it. Disagreement between them is drift, and there's no DNS-only run. Federal controls point the same way: SP 800-53 treats secure name resolution and the component inventory as controls of their own.

The common failure is to modernize identity and policy and leave these for a Phase 2 that rarely happens. A forest that still hosts DNS has not been retired.

That makes it a scope and funding decision for the sponsor and the CIO: put DNS, DHCP and IPAM in the core program now, with one IPAM authority. The pilot division's zones move in Phase 2.

## Slide 9 — Compute: the domain join is the last thing to go

Compute. Once identity, policy and network services have moved, domain-joined machines are the largest remaining dependency. A machine leaves only when its identity, its policy and its trust have each been replaced, so the domain join is the last thing to go, not the first.

User PCs end Entra joined and managed in Intune, and every hardware refresh should arrive that way. Hybrid join is a transition: there's no supported way to convert a hybrid-joined PC without resetting it, so time that reset to a refresh. A program that leaves devices hybrid joined hasn't finished.

Servers take a different road. Azure Arc projects them into Azure for policy and posture while they stay where they are, and leaving the domain is a separate decision for each workload.

What holds servers in the domain is applications. Every Kerberos service principal name is an application, and each gets one of three answers: migrate to modern authentication, retire it, or, as a last resort, keep it on a small documented island with an end-of-life date. NTLM is resolved in the same pass. And an application's compute stays with its data until its round trips are reduced, because distance multiplies with every call.

Only an application's owner can make that call and sign off its cutover. Keeping legacy authentication open is a risk acceptance, so the authorizing official sets every island and NTLM end date, and every name is resolved by Gate G4.

## Slide 10 — Access: log in to applications, not networks

The access plane. When Active Directory retires, being inside the network stops meaning anything. M-22-09 says users should log in to applications rather than networks, every application should be treated as internet-accessible, and multifactor authentication belongs at the application layer, not in a VPN.

The replacement has four surfaces: Zero Trust as the model, Conditional Access deciding each request, a secure access service edge replacing the VPN, and phishing-resistant authentication as the proof. M-22-09 requires it for staff, contractors and partners, and BOD 25-01 makes blocking legacy authentication, and phishing-resistant MFA for all users, mandatory. FIDO2 keys, passkeys, Windows Hello, and PIV or CAC cards through certificate-based authentication qualify; SMS and voice don't.

Two consequences need an executive eye. First, smart-card sign-in is anchored in Active Directory today. The card and PIN stay, and validation moves to Entra ID. But issuance is a separate decision: an enterprise certificate authority depends on AD DS, and Microsoft's cloud PKI covers only Intune-managed devices, so issuance needs a successor before Active Directory retires. Second, privilege: every human admin assignment becomes eligible and time-bound, standing credentials go through a vault, and emergency accounts are tested at least every 90 days.

The CISO decides: phishing-resistant MFA as the end state for everyone, with FIDO2 or certificate-based authentication for Tier 0 administrators first, opening in Phase 1, and certificate issuance moved off AD DS by Gate G4.

## Slide 11 — Microsoft supplies the instruments, not the orchestra

Who leads? The book's framing is simple. Microsoft provides the instruments; the program provides the orchestra.

Cloud identity, device management, Conditional Access, privileged identity management and the assessment tools are each excellent. But look at what each one doesn't decide. Cloud identity doesn't decide what your organizational structure should become. Hybrid management doesn't decide which servers retire. The assessment tools don't decide what to do with the findings. Every entry in that column is a decision someone has to own.

And no vendor deadline forces it, so without leadership organizations migrate in pieces and finish with a surface that can't answer last year's audit questions. And the program isn't a product: it needs no license of its own, but the services it orchestrates do, from Entra ID P1 for Conditional Access to Entra ID Governance for lifecycle workflows.

Federal policy already says this belongs to more than the IT shop. M-22-09 says the whole C-suite must be aligned and committed, and it required each agency to designate a zero trust implementation lead within 30 days. M-19-17 requires an agency-wide identity governance structure that includes HR, general counsel, privacy and acquisition.

So the first Who decision, for the sponsor and the CIO before Phase 0: confirm who already holds those roles, and decide whether one of them becomes the program's steward.

## Slide 12 — One decider per decision; the AO signs for risk

The book's decision matrix runs on one rule: one decider per row. The single deliberate exception is the pilot gate, G2, which the steward and the sponsor co-sign.

The sponsor and the CIO own scope, funding and sequence, break ties, and decide when Active Directory components retire, because each retirement ends a fallback. They clear gate G3 with the steering committee, and G5, the retirement of Active Directory itself. Their job is to keep it a program, not five projects that finish one at a time.

The CISO decides the control requirements every surface must meet. The authorizing official is the only official who can accept risk on the agency's behalf, so every place the program carries risk instead of removing it reaches that desk: a deferred legacy-authentication cutoff, a Kerberos island with no end date, a deviation from a mandatory baseline.

The program office, led by the steward, runs the orchestra. It holds the repository, turns assessments into authorized plans and evaluates the gates, but it doesn't decide risk or scope. The platform teams do the work inside each domain. Application owners decide for their own applications. HR decides what the worker attributes mean.

The sponsor's decision, before the program starts: fill in the matrix with names, one decider per row, and get the authorizing official's agreement to every risk-acceptance row.

## Slide 13 — Three decisions that land on the wrong desk

Three decisions often land on the wrong desk, and the book moves each one on purpose.

First, end dates for legacy authentication and NTLM. They sit with the authorizing official, not with the engineers who'd like more time, because keeping legacy authentication open is a risk acceptance, and BOD 25-01 makes blocking it a mandatory baseline. Authorizing officials may accept risk for deviations from those policies, under agency policy.

Second, the help desk's identity-verification procedure. The help desk supports users through every wave, and that makes it a target. CISA's advisory on the Scattered Spider group describes attackers phoning help desks to get passwords reset and MFA tokens transferred. So the procedure for resets and temporary access passes is a CISO decision. The help desk carries it out with narrowly scoped roles.

Third, records. Retiring Active Directory retires the systems that hold years of access records. NARA's General Records Schedule 3.2 keeps some system access records for six years after the account is terminated, and once a domain controller is gone, its logs can't be recovered for an audit or a legal hold.

So the records officer decides retention before anything is decommissioned: any domain controller, federation farm, sync server or SIEM connector. And the privacy office is consulted before any new attribute flow carries personal data.

## Slide 14 — Analyze the estate first: read-only, with provenance

Now how to deliver it, starting with the estate. You can't modernize what you haven't enumerated, and nothing can be retired until someone has written down everything it was quietly doing.

Ask what's in a long-lived forest and the honest answer is usually more than anyone on the current team knows: trusts no one can fully map, Group Policy whose authors left a decade ago, certificate templates whose permissions open privilege-escalation paths, and servers past support, each of which needs a disposition in the plan.

The assessment follows three rules. It's read-only, enforced in the account, the code and the audit trail. It's least-privilege: never a domain or enterprise admin, starting from default read rights and adding only narrow, recorded additions, never secrets. And every run carries provenance: who ran it, when, against what, with which rights, and a hash of every file. The engine rejects a run without it. The output maps privileged groups and service accounts, so it's stored encrypted and handled as sensitive. And because broad enumeration looks like reconnaissance, security operations is told first.

One more input decides whether an application may move: how many round trips it makes to its data, measured, not estimated.

The steward commissions it in Phase 0. In the program's experience a first pass takes days to a few weeks, and Gate G0 needs it committed.

## Slide 15 — Analyze, plan, deliver: nothing moves without a plan

Then the cycle that turns analysis into delivered change. Nothing touches the target without a plan, and no plan touches it without someone of record having read it first.

Analyze compares the current state with the target and produces a diff and a blast-radius score. Plan turns the diff into a sequence of actions, each bounded to a single object, ordered by dependency and paired with its own inverse, so the plan can run backwards. Then two gates. Validation rejects any plan that breaks naming, scope or safety rules, such as deleting too many objects at once. Authorization needs a review and at least one approver of record who isn't the author. Only then does the execution layer, under a separate identity, deliver each action, verify it and record the result.

When something fails, the default is to halt, and rollback is explicit. Every run ends in a signed evidence packet, and when nothing has drifted, the next run is a zero-action plan.

A separate rule caps how far automation may go: record, observe, advise, gated actuation, and autonomy only for named low-risk classes. Tenant-wide role changes, Conditional Access enforcement and bulk device changes stay gated permanently. No federal document requires that ceiling. The book chooses it because it's a posture an authorizing official can sign.

So before the first production delivery, the authorizing official agrees the ceiling for each class of change, with its dry run, its approver and its rollback on record.

## Slide 16 — The roadmap: seven phases, six gates, five workstreams

The roadmap sequences all of this as an illustrative fifty-two-week program. The weeks are a sequencing model, not a commitment; large federal estates typically run multi-year.

There are seven phases and six gates. Phase 0, pre-flight, stands up the platform host and runs the assessment; G0 is Ready to Plan. Phase 1, foundation, puts the identity primitives in place, including the access baseline and the HR feed; G1 is Foundation Complete. Phase 2 proves the whole pattern on one pilot division, typically IT; G2, Pilot Clean, needs zero drift for a hold period. Phase 3, the longest, rolls out division by division, two or three at a time. Phase 4 retires legacy policy, groups, DNS, DHCP and the last service principal names; G4 is Legacy Quiet. Phase 5, the shortest, retires AD DS. And Phase 6 is steady state.

Two properties define it. The five workstreams, identity, policy, services, compute and access, run in parallel, each with a named lead; finishing one before starting the next doubles the duration. And it's gated: a phase opens only when the previous gate clears.

The decision closes the loop on ownership. Put the gate dates on the sponsor's calendar, and the end date of every exception on the authorizing official's. Gate G0 gets its date in Phase 0.

## Slide 17 — Gates go green on data, and rollback has an end

Two things make the gates trustworthy. First, every gate criterion is evaluated from the repository and the drift reports, not from a signature. Zero drift for fourteen days is a query; so is every PC cloud-joined. The engine reports green, the steward concurs, and the record that merges the decision shows who made it. A gate the engine can't evaluate needs a better criterion.

Second, rollback triggers are thresholds, not judgment calls, and the values are the agency's to set. Drift above the threshold for more than a day halts the phase. Conditional Access blocking more than a set share of legitimate sign-ins means the policy is reverted. If drift detection stops reporting, all phase work halts.

Authority is fixed in advance. The steward clears G0, G1 and G4. The steward and the sponsor co-sign G2. The sponsor and the steering committee clear G3. And the sponsor and the CIO clear G5, Active Directory retired.

And be clear about the end. A forest in backup isn't a lasting fallback: a backup is valid only within the tombstone lifetime, 180 days by default. The real rollback point is the last moment a domain controller still runs.

So G5 is the sponsor's and the CIO's decision, made on evidence: no live production dependency on Active Directory authentication, or a documented Kerberos island with an end-of-life date.

## Slide 18 — The clocks: FedRAMP's dates don't set the agency's

Two external clocks bear on the schedule, and they're easy to conflate.

FedRAMP's Consolidated Rules for 2026, announced on June 25, 2026, govern how cloud services are certified. They become mandatory for everyone on January 1, 2027, and FedRAMP stops accepting new Rev5 certification applications on June 11, 2027. None of that certifies the agency's own estate. FedRAMP is explicit that each agency still authorizes its own federal information systems, and should never create a standalone authorization for a cloud service. What the 2027 date changes is the evidence your providers publish and you inherit.

The deadlines that bind the agency directly come from OMB and CISA: M-26-14's logging plan and maturity levels, and BOD 25-01's secure configuration baselines for in-scope Microsoft 365 tenants. The estate has its own dates too. Windows 10 reached end of support on October 14, 2025. Extended security updates for Windows Server 2012 and 2012 R2 ended on October 13, 2026, and Windows Server 2016 reaches end of support on January 12, 2027.

Mainframes have a place in the sequence. Token-based access joins the access workstream late, discrete read-mostly transactions first, and M-22-09 notes that mainframes may need other zero trust mechanisms where endpoint detection tools don't fit.

So the sponsor and the CIO sequence the program against the agency's own deadlines and end-of-support dates, starting now, not against FedRAMP's 2027 date.

## Slide 19 — Decisions, owners, and where to start

So, the decisions, with their owners.

Agency leadership and the CIO name the sponsor, the steward and the authorizing official, and the sponsor fills the matrix with one decider per row. The sponsor and the CIO scope all eleven categories, with DNS, DHCP and address management in the core program, and at the end retire Active Directory on evidence.

The steward stands up the platform host as the one authoritative writer, protected as Tier 0, and commissions the read-only assessment, both in Phase 0.

The CISO sets the control requirements, enforced at Gate G1. HR defines what the worker attributes mean. The authorizing official agrees the actuation ceiling and every exception's end date. And the records officer settles retention before anything is decommissioned.

None of this requires a vendor decision on day one. It requires an inventory, an owner and a date: the read-only assessment, a named sponsor and steward, and Gate G0 on the calendar.

Microsoft has supplied the instruments. The program is the orchestra, and the people named in this briefing are the ones who have to play it. Retiring Active Directory is a governance transformation, and it should be led as one. Book 01 has the detail, with every claim footnoted. Thank you.
