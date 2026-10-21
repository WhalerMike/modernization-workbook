# Book 04 — Access & Privilege — narration script (practice copy)

## Slide 1 — Why Is Every Access Decision a Policy Decision?

This briefing comes from Book 04 of the Federal Modernization Workbook, Access and Privilege.

Book 02 moved the identity. Book 03 made its facts trustworthy. This book is about what happens with them on every sign-in: who gets access to what, under which conditions, and how administrator power is kept from becoming an open door.

I'll take it through why, what, who and how. The short version: in Zero Trust, every access decision is a policy decision, and the policy library is the agency's access control in practice.

## Slide 2 — Access is decided per request, by policy

Why is every access decision a policy decision? Because federal Zero Trust policy says so, and the platform works that way.

OMB M-22-09 requires that every access request be evaluated and that network location confer no trust. NIST Special Publication 800-207 describes the architecture: a policy decision point, separate from the places where access is enforced. In Microsoft Entra ID, that decision point is Conditional Access. It decides by rule: every applicable policy must be satisfied, a block wins, and exclusions override everything.

What it replaces is access decided once and trusted afterward. Inside the network, therefore trusted. In the group, therefore allowed, forever. Those assumptions survive a migration unless someone deliberately replaces them with policy.

Two consequences run through the book. Every exclusion is a standing hole, so each one needs an owner and a review. And policy is only as good as the attributes it reads, which is why Book 03 matters here.

## Slide 3 — Standing privilege is an open door

The same logic applies to administrators, and this is where most breaches go.

A standing administrator is always on, at any hour, so any stolen credential or session that reaches the role yields all of it. Stronger authentication helps, but it doesn't narrow what the role can do, where, or when. An eligible administrator is different: the role is activated only when needed, for a set time, with approval from someone other than the requester, a fresh strong sign-in, and a log of every elevation.

NSA and CISA rank poor separation of user and administrator privilege among the most common misconfigurations they find, and NIST control AC-6 requires least privilege, recurring reviews and logged privileged functions.

There's one standing exception: two break-glass accounts stay permanently active, so the tenant can be recovered if everything else fails. They're safe only when they're governed: phishing-resistant, monitored, tested every ninety days, and documented as a deviation in the system security plan.

## Slide 4 — What Conditional Access evaluates

What does the policy engine actually evaluate?

Signals first: the user, their groups and roles; the device; the application; the location; and sign-in and user risk. Conditions decide which policies apply to this particular request. Then controls: block, or grant with requirements such as multifactor authentication, a specific authentication strength, a compliant device, an app protection policy, or acceptance of terms. And session controls, like how often to re-authenticate.

Three operating rules run through the library. Every policy runs in report-only mode first, so its impact is visible before it enforces. Policies target personas, admins, internal staff, guests and workload identities, not individuals. And deletion isn't final: deleted policies are recoverable for thirty days, and a tenant can hold up to two hundred and forty policies.

One recent platform change matters: the approved client app grant became read-only on June 30, 2026, so mobile access now relies on app protection policies.

## Slide 5 — Privilege and applications, structured

What's the structure underneath? Two parts: privilege and applications.

For privilege: use the least-privileged built-in role for each task; keep fewer than five Global Administrators, as Microsoft recommends; use role-assignable groups, which take assigned membership only and are limited to five hundred per tenant; and tier everything along Microsoft's enterprise access model, which builds on the old Active Directory tier model rather than replacing it.

For applications: application owners actually hold administrator rights over their app, including adding a credential, so keep them few. Admin consent goes through a governed workflow. Applications authenticate with certificates or federated credentials rather than secrets, and Azure workloads use managed identities.

What people get wrong: consent grants never expire, and revoking one leaves already-issued tokens valid. So application access needs the same review discipline as people.

## Slide 6 — Who decides access, and who executes it

Who decides access, and who executes it? The book keeps those apart.

Deciding: business and application owners decide who should have access and why. The CISO owns the policy baseline and its exceptions. And an identity governance office owns approval chains and reviews.

Executing: identity engineering builds the policies, the PIM settings, consent and access packages. The help desk handles assignments under a scoped role. Security operations handles alerts, risky sign-ins and response.

Assuring: the ISSO owns the evidence and findings, the authorizing official owns accepted risk, and reviewers recertify access on schedule.

The rule that holds it together: the people who execute access changes never approve them. That's why the help desk works under a custom role that manages assignments only, while consent and administrator roles stay with identity engineering. The old guide gave the help desk Application Administrator, which can grant consent and act as any app, so that rule existed only on paper.

## Slide 7 — The policy library, rolled out in waves

How. The policy library is rolled out in five waves.

Wave one is the foundation, starting with blocking legacy authentication. Wave two is administrators: phishing-resistant authentication and sign-in only from privileged access workstations. Wave three is everyone: an MFA baseline plus device and app controls. Wave four is risk: blocking high-risk users and sign-ins. And wave five covers the remaining segments, guests and workload identities, and the end state.

Every policy passes the same gates: two to four weeks in report-only, then a pilot ring, then expanding rings, then enforced and monitored. A wave starts only after the previous one has run a week without incident. And rollback means switching a policy off or back to report-only, never deleting it.

The library is built to CISA's baseline. It keeps Book 02's policies CA001 to CA017 and adds CA018 to CA038 for the BOD 25-01 Entra ID requirements, including blocking high-risk users and requiring phishing-resistant MFA for all members.

## Slide 8 — PIM: eligible, requested, approved, logged

For administrators, Privileged Identity Management turns privilege into a governed request.

An administrator holds an eligible assignment, not an active one. To use it, they request activation with a justification and a ticket; step up through an authentication context; get approval from someone else; and receive a time-boxed activation that's logged, alerted and later reviewed.

The details matter, and the old guides had several wrong. Activation can run from one to twenty-four hours, and the approval window is a fixed twenty-four hours with a single stage. PIM's built-in MFA can be satisfied by an earlier sign-in in the same session, so the book uses an authentication context to force a fresh step-up. Approvers can't approve their own requests, and if a role has no approvers configured, active Privileged Role Administrators become the approvers by default. And licensing: PIM needs Entra ID P2 or ID Governance, and if those licenses lapse, eligible assignments are removed.

Appendix B sets every role's activation time, approvers, context and notifications, tighter for Tier 0 and Tier 1 than Book 02's first table.

## Slide 9 — Govern access, manage it as code, prove it

Finally, governance, code and evidence.

Governance: access is requested through access packages with approval and expiry; reviews run on a tiered cadence; and the book reviews groups, not just applications. Guests have sponsors and are reviewed too.

As code: Conditional Access, PIM settings and access packages live in version control. Changes go through review rather than the portal, drift is monitored against a baseline, and results are exported before a baseline is changed, because changing it erases that monitor's history.

Evidence: the book maps all of this to the access-control, identification and continuous-monitoring controls, AC-2, AC-3, AC-6, IA-2 and CA-7, with every elevation and every review on record.

Two traps in the tooling. Reviewing an application doesn't remove members of the groups assigned to it, so the groups themselves have to be reviewed. And Entra keeps sign-in and audit logs only thirty days with P1 or P2, so the evidence has to be exported from day one.

## Slide 10 — What we need

So, four asks.

Adopt the library: Book 04's Conditional Access library and wave plan as the agency's access baseline.

End standing privilege: every administrator role eligible through PIM, with two governed break-glass accounts as the only standing exception.

Separate deciding from executing: name the owners, scope the help desk role, and stand up the identity governance office.

And manage access as code: version control, review and drift monitoring, with the evidence kept from day one.

In Zero Trust, every access decision is a policy decision. Writing that policy down, testing it, and proving it ran is how an agency knows who can reach what, and why.

Book 04 has the full library and settings, with every external claim footnoted. Book 05 covers the device compliance that Conditional Access reads. Thank you.
