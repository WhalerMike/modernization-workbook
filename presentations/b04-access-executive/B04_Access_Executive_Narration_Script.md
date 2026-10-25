# Book 04 — Access & Privilege — narration script (practice copy)

## Slide 1 — Access & Privilege: the executive briefing

Welcome. This is the executive briefing for Book 04 of the Federal Modernization Workbook, Access and Privilege. It's for the people who make the calls on access. The argument is short. Under Zero Trust, every access request is decided by policy, so your Conditional Access policy set is your access control. Standing administrator rights turn one stolen credential into control of the tenant, and a stronger sign-in doesn't fix that. And the platform won't separate deciding from doing for you. I'll take four questions: why, what, who and how. Each decision slide names the decision, its owner and when it's needed. Let's start with how access gets decided.

## Slide 2 — Every access decision is a policy decision

Access used to be settled once. You joined a group, your desk sat inside the network, and every request after that was approved by default. Federal policy doesn't accept that any more. M-22-09 says every request gets evaluated, and the network earns no trust on its own. In Entra ID, the thing that evaluates is Conditional Access. Its rules are simple. Every policy that applies has to be met. A block always wins. And an exclusion overrides everything. That last one is the dangerous rule, because each exclusion is a standing hole. Only the emergency access accounts are excluded by design; everything else needs an owner, a reason and an expiry. Next, why the old habits survive.

## Slide 3 — Membership and location decide once; policy, every time

Two habits survive almost every migration. Inside the network means trusted. And in the group means allowed, forever. Policy replaces both, but it leans hard on directory data. The program targets policies at groups built from attributes, the way Group Policy once targeted organizational units (OUs). So a user with an empty attribute simply falls outside the policy: an exclusion nobody approved. And group changes can take more than a day, so urgent removals mean disabling the account and revoking sessions. The decision for the CISO: baseline policies cover all users and exclude narrowly, and no attribute-based policy is enforced until its data is verified. HR owns those attributes. Next, administrators.

## Slide 4 — Standing privilege is an open door

Here's where it matters most. A Global Administrator can rewrite the policies that protect everyone else. If that role is always on, it's exposed all 8,760 hours of the year. NSA and CISA rank weak separation of admin privilege second among the misconfigurations they find. And it's not only people; Midnight Blizzard used a forgotten application with standing access to reach mailboxes. A FIDO2 key proves who you are. It doesn't limit what you can do, or for how long. So the decision: every human admin role is eligible and activated just in time through PIM. The CISO sets that model, and the authorizing official accepts whatever has to stay standing. Next, what the rules ask.

## Slide 5 — What least privilege requires, and what policy says

NIST's AC-6 asks for only the access a task needs, with privileges reviewed on a schedule and every privileged action logged, all in the Moderate baseline. M-22-09 doesn't actually mandate time-bound privilege, and it's often quoted as if it did. CISA's maturity model is the clearest: it runs from permanent access with a periodic review, to automated just-in-time, just-enough access. Most estates with standing administrators are still at the first stage. Microsoft's numbers are short: fewer than five Global Administrators. The takeaway is that time is the dimension most estates never limited, and limiting it gives you the review and log evidence as a by-product. Now, the baseline itself.

## Slide 6 — The Conditional Access baseline, built to BOD 25-01

The book's policy library is built to CISA's Binding Operational Directive 25-01, which made a set of cloud configurations mandatory for civilian agencies. Each required Entra item maps to a named policy: block legacy sign-in, block high-risk users and sign-ins, and phishing-resistant MFA for everyone and for privileged roles. One choice needs your attention. Microsoft recommends asking high-risk users to fix their own risk; CISA says block. They can't both win, so in a directive-scoped tenant the program blocks, and the help desk handles recovery. The policies roll out in five gated waves, each clean for a week before the next. The decision for the CISO: adopt the library and its waves before wave one is enforced. Next, the end state.

## Slide 7 — Phishing-resistant MFA is the end state

The end state is phishing-resistant MFA for everyone, and the directive makes it mandatory. Ordinary MFA is allowed only until then, so every policy that accepts it is transitional. The phishing-resistant methods are Windows Hello, FIDO2 passkeys and certificates, and administrators get a stricter version on a separate device. The end-state policy goes in on day one in report-only mode, so the logs build a history of who'd be blocked. Then enforcement follows measured readiness: the program's gates are 95 percent of users registered and 90 percent of devices compliant, and every not-ready exception carries an expiry. The CISO owns that schedule. Next, two platform behaviors that surprise people.

## Slide 8 — Policies come in pairs, and Microsoft adds its own

First, a policy that says Finance must use strong MFA to reach payroll says nothing about anyone else. If no policy applies, the platform issues a token. So restricting an app takes a pair: one policy that grants with conditions, and one that blocks everyone else. Second, Microsoft creates some policies in your tenant itself. They arrive in report-only mode and switch on at least thirty days later, unless someone turns them off. That's a change the agency didn't make. So the decision: the identity team records, for each one, whether to adopt it or supersede it with a library policy, inside that thirty-day window, under the CISO's baseline. Next, how privilege is tiered.

## Slide 9 — Privileged roles are tiered by what they can take over

Privileged roles are tiered by what their holder could take over. Tier 0 is the control plane: Global Administrator and the roles that grant roles, reset admin credentials or change sign-in policy. Tier 1 runs a whole service, like Exchange or Intune. Tier 2 works inside a bounded population, scoped to administrative units (AUs). Conditional Access Administrator is Tier 0, because it can weaken the gate on elevation itself. Exchange Administrator isn't labeled privileged, yet it can reach every mailbox. And readers are tiered, because the security setup is a map for an attacker. The decision for the CISO: approve each role's tier and gate, and keep Global Administrators under five, before any role converts. Next, the gate.

## Slide 10 — Just in time, approved from outside the tier

An eligible administrator asks for the role, gives a reason, proves who they are again with a phishing-resistant sign-in, and waits for approval. The role then lasts only the window: four hours at Tier 0, eight at Tier 1. Eligibility itself expires too, so it has to be re-authorized. The platform stops self-approval, but it won't stop you making the approvers and the requesters the same group. So approvers sit outside the tier they approve, and Tier 0's sit in the security office. And approvers have twenty-four hours, fixed. The decision for the CISO: staff each approver group from outside its tier, at least two people, sized for real hours. Next, what can quietly undo all this.

## Slide 11 — Four things that can quietly undo the gate

A good gate can be undone quietly, in four ways. If your premium licenses lapse, eligible roles are removed and expiring grants become permanent. Whoever can edit Conditional Access can weaken the gate, so those roles sit in Tier 0, and policy changes need a fresh strong sign-in. If approval is on but nobody's named, the default approvers are the very admins you made eligible, and Microsoft documents that as a lockout. And Microsoft retires the older PIM interface on October 28, 2026, so old scripts simply break. The first one is a funding call. The sponsor and CIO treat these licenses as a control dependency, renewed without a gap. Next, the one exception.

## Slide 12 — Break-glass: the one governed exception

Every control that blocks an admin path also creates a way to lock yourself out. So there's one standing exception: emergency access, or break-glass, accounts. Two or more cloud-only accounts, permanently Global Administrator, with phishing-resistant sign-in of their own, excluded only from blocking policies, and alerted on every use. Using them is strict: two senior administrators together, only when PIM is down and the problem can't wait, out within four hours, reviewed within a day, and tested every ninety days. Two decisions. Build and test them before any role goes eligible. And be honest in the security plan: NIST expects emergency accounts to expire, so record these as a deviation. The CISO builds; the authorizing official accepts. Now, who decides.

## Slide 13 — Deciding isn't doing: rules Entra doesn't enforce

The principle is that deciding isn't doing. Approvers don't make changes, the people who make changes don't approve, and nobody approves their own access. Here's the catch: Entra doesn't enforce any of that. Application Administrator can grant most kinds of consent and can even act as any app. So if the help desk holds that role, the rule that it never approves consent exists only on paper. The fix is design. Every request is triaged by the authority it needs, and the help desk gets a custom role that manages app assignments and nothing else. The decision for the identity governance officer: narrow that role before the help desk takes its first access ticket. Next, how apps are tiered.

## Slide 14 — Application risk tiers set the approval chain

For applications, risk sets the chain. Every app gets a risk tier from the identity governance officer before anyone gets access, and one high-risk trait is enough to make it Tier 1: an application permission, sensitive data, an outside operator, or no owner. The tier then decides who approves access, who approves consent, and how often it's reviewed. Consent is the riskiest request you'll see, because a grant covers the whole tenant at once and never expires. So any application permission gets Tier 1 handling, and critical scopes need the governance officer and the CISO together. The decision: tier every app before the first grant, and treat anything untiered or ownerless as Tier 1. Next, apps as identities.

## Slide 15 — Applications are identities, with owners and an end

Applications need the same lifecycle people get, including an end. Three facts drive it. Consent grants don't expire, and revoking one doesn't cancel the tokens already issued. Owners aren't just contacts: an owner can add a credential and become the app, so the list holds two named technical people. And stored secrets are the weak spot, so the order is a managed identity, then federation, then a short-lived certificate. Microsoft's recommended policy blocks new secrets and caps certificates at 180 days, and the program adopts it for every new app. The CISO sets that rule, and any exception for a secret needs the governance officer and the CISO. Next, the whole map of who decides.

## Slide 16 — Who decides what for access

One decider per row. The CISO sets the access baseline and the privilege model. The identity governance officer tiers applications, decides consent above the lowest tier, and rules on exceptions. Application owners decide who gets into their apps. Business approvers confirm the need. Security operations can pull consent during an incident. The sponsor and CIO fund it. And the authorizing official owns residual risk. Exceptions run on a clock: six months at most, never renewed automatically, and one renewed more than twice goes up to the CISO and the authorizing official. The decision: any exception that leaves a control unmet with nothing compensating goes to the authorizing official. Now, how to run it.

## Slide 17 — Govern access with packages, reviews and expiry

Policy decides whether a session goes ahead, not whether someone should still hold last year's access. That's governance. People request access through packages, with named approvers and an end date from day one; the program never uses never. Reviews run on a calendar set by risk: monthly for Tier 0 roles, quarterly for the rest, and guests quarterly by their sponsors. A mover loses the old access, and a leaver loses it all. One trap: reviewing an app doesn't remove the members of its groups, so review the groups. The executive call is licensing. Partial licensing governs some people and leaves the rest alone, so the sponsor and CIO license governance for the whole workforce. Next, evidence.

## Slide 18 — Access as code, and the evidence it leaves

Finally, how decisions are held. Every policy and setting lives as a file in a repository. A change is a reviewed request, and its author can't approve it. New policies run in report-only for at least a week. The pipeline has no stored secret, and it's treated as Tier 0. Emergency edits in the portal are allowed, but they're back in code within a day, and a monitor checks the tenant against the repository every six hours. Then keep the evidence. Entra holds its logs for only thirty days, so the program keeps a year, and three for consent and break-glass. The decision for the CISO: make the repository the only normal path, from the first policy. Let's pull it together.

## Slide 19 — Decisions to make, owners and timing

So, the decisions. The CISO sets the baseline: all users covered, attribute-based policies only on verified data, the library adopted before wave one, and phishing-resistant MFA in report-only from day one. The CISO also owns the privilege model: every admin role eligible, tiers approved, approvers from outside the tier, and break-glass built and tested first, with the authorizing official accepting what stays standing. The sponsor and CIO fund the licenses, without a gap. The identity governance officer narrows the help desk role and tiers every app. Uncompensated exceptions go to the authorizing official. And the repository becomes the only path. Write the policy down, test it, prove it ran. Book 04 has the detail, every claim footnoted. Thank you.
