# Book 07 — PKI & Certificates — narration script (practice copy)

## Slide 1 — PKI & Certificates: the executive briefing

Welcome. This is the executive briefing for Book 07 of the Federal Modernization Workbook, PKI and certificates. It's for the people who decide: the CIO, the CISO, the PKI owner and authorizing officials. The argument is short. Certificates prove who's who in every other migration, and they keep working until the day they expire, so they fail on their own clock, not the directory's. There's no single replacement for the old certificate authority; the target is four issuers and one lifecycle platform. And the move runs as its own program, with the old authority retired last. Each decision slide names the decision, its owner and when it's needed. Let's start with why.

## Slide 2 — A certificate keeps working after its directory moves

Every other migration changes which system answers the question, who is this? Certificates are how the answer gets proved. And a certificate isn't a record you move with the directory. It's a signed statement that's already been handed out, sitting in devices, smart cards, servers and trust stores nobody remembers configuring. It keeps working, unchanged, until it expires, and then whatever relied on it stops. Domain controllers, Wi-Fi, VPN, server encryption and PIV sign-in all lean on it. Each book in this workbook migrates its own consumers. None of them owns the issuer underneath all of them. That's the problem, and it runs on a different clock.

## Slide 3 — Two clocks: cutover dates and expiry dates

There are two clocks here. Directory work fails at cutover, where someone is watching. Certificate work fails at expiry, months later and far from its cause. So a program that measures progress by cutover dates reports success right up to the outage. And the cloud options only cover part of the estate. Cloud PKI issues only to Intune-managed devices, which don't include servers, and domain controllers need certificates for as long as they exist. The decision for the sponsor and the CIO: run the move off the old certificate authority as its own program, with its own owner, sequenced by expiry dates. And those dates are getting closer together.

## Slide 4 — Lifetimes are shrinking on a fixed public schedule

The rules are moving under certificates already issued. Public TLS lifetimes are falling on a fixed schedule: 200 days now, 100 days from March 2027, and 47 days from March 2029. On the book's arithmetic, a thousand certificates means about seven renewals every working day today, and about thirty-one at the end. The mapping rules for sign-in certificates already changed, with no way back. And the algorithms have a horizon, with federal post-quantum deadlines in 2030. So the decision for the CISO: set lifetimes by policy, and require automated renewal for every class before they shorten. No certificate should depend on a person remembering a date. First, we need to know what we have.

## Slide 5 — First, inventory what AD CS actually holds up

Before any certificate moves, the program establishes what the old certificate authority actually holds up: every authority, every template, every certificate issued, and every system that trusts them. Then each template gets one of four verdicts. Retire it if its consumer is going away. Migrate it if Intune or Entra can replace it. Bridge it if it depends on Active Directory itself, like domain controllers. And retain it only if nothing else can serve it, with an owner and a review date. The decision for the PKI administrators: every template classified, with a named owner, in the plan's first four weeks. And before any of it moves, what stays has to be safe.

## Slide 6 — Harden what stays before anything migrates

A certificate authority can mint credentials the whole estate trusts. So one over-privileged account or a single misconfigured template can undo every other identity control. And the new cloud issuer will chain to this same hierarchy, inheriting whatever's wrong with it. That's why hardening is the first technical workstream, not cleanup at the end. Eight well-known misconfiguration classes get checked, four of them rated critical, and auditing gets turned on, because by default there's no evidence at all. The decision for the PKI owner and the security team: hold the gate. Nothing migrates until every critical and high finding is fixed and re-tested. Then, the target.

## Slide 7 — The target is four issuers, not one replacement

There's no single replacement for the old certificate authority. The target is four issuers, each serving what only it can. Cloud PKI for devices Intune manages. A smaller, hardened internal authority for domain controllers, servers and network gear. The Federal PKI for PIV cards, which the migration doesn't touch. And a public authority for names the internet has to trust. Entra ID sits beside them all, checking certificates, never issuing them. The decision for the sponsor and the CIO: adopt this four-issuer target, anchoring the cloud issuer to the root you already have. That choice of root carries a cost of its own.

## Slide 8 — Anchor to the existing root, and keep its CRL alive

Here's the root decision. A brand-new cloud root means every server, gateway and device has to learn to trust a new chain. Anchoring the cloud issuer under the root you already have keeps that trust intact, uses one of the tenant's three cloud authorities, and leaves an easy way back. That's the program's recommendation for an established hierarchy. But it carries one lasting cost. The offline root's revocation list now has to stay published at a plain web address that Entra ID can reach, or sign-ins fail. So the decision for the PKI administrators, inside the security office's window: run that list as a production service, with every ceremony dated. Servers still need an issuer.

## Slide 9 — Servers renew through one lifecycle platform

Microsoft's issuers don't renew server certificates, public certificates or appliances. Something has to find those and renew them on time, and that's the lifecycle platform. The program uses CyberArk Certificate Manager, from a vendor it already has, and adds no second tool. Server certificates for internal names come from the retained internal authority, requested and renewed through the platform instead of by hand. One fact shaped the deployment. As of October 2026 the platform's cloud edition had no FedRAMP listing, so the program runs the self-hosted edition inside its own boundary. The decision for the sponsor and CIO: confirm that, and revisit it when the Marketplace changes. Then there's PIV.

## Slide 10 — PIV and certificate sign-in: trust, not issue

PIV is the one part the migration doesn't re-issue. Those certificates still come from the Federal PKI through the card system. What changes is who trusts them: the federal root has to reach devices and servers, and Entra ID has to check each card against its revocation list. Two choices matter. Every authority Entra trusts can sign in any user it's bound to, so bindings have to be strong. And a PIN-protected card counts as multifactor, while a software certificate doesn't, so derived credentials need their own rule. The decision for the CISO: require high-affinity bindings in production, and send any weaker binding kept to the authorizing official. So who owns all of this?

## Slide 11 — No one decided who owns the CA; now name one per row

In most estates, the certificate authority belongs to whoever installed it, and by default the domain's top administrators run it. Nobody decided that. In the target, the estate spreads across more systems, not fewer, each with administrators holding a piece of what the agency trusts. So the program separates who decides from who does the work. The CISO sets issuance policy, trust anchors and binding strength. The authorizing official accepts every standing exception. The sponsor and CIO decide the hierarchy and when old authorities retire. And their decision here: name one renewal owner for every certificate class, recorded in the lifecycle platform. Because an expiry is almost always an ownership failure first.

## Slide 12 — Four permission systems, one access model

Certificate power is granted in four separate places: the old authority's own permissions, Intune, Entra ID, and the lifecycle platform. That's where hidden risk sits. Several everyday console clicks are really risk decisions. Leaving a template published just in case. Trusting an authority in Entra without a revocation list, so revoked certificates still sign in. Leaving bindings at the weak default. And the platform's own account can approve certificates for every template it reaches. The decision for the CISO: map every team in all four systems, keep privileged roles eligible rather than permanent, and make sure no one can both change and approve what an authority issues. Then the migration itself.

## Slide 13 — Six gated waves, each with a tested rollback

The migration runs as six waves: assess, build the foundation, pilot, scale, cut over, and decommission. Each wave's exit gate is the next one's entry gate, and the durations, about forty-four weeks for a single forest, are planning figures, not promises. The rule that matters most is about going back. No wave starts until its rollback has been rehearsed, and no rollback depends on something that same wave retired. That's why the old automatic enrollment stays on through the pilot, and federation stays restorable for thirty days after cutover. The decision for the sponsor and CIO: approve each gate before the next wave starts. During all of this, both systems are live.

## Slide 14 — Coexistence: both PKIs are production

For most of the migration, both systems are production. Devices carry certificates from both, servers trust both chains, and two sets of revocation lists have to stay reachable. Five rules keep that safe. Each use case gets one issuer at a time. Trust goes up before issuance moves. Revocation is reachable wherever validation happens. Nothing is revoked early to force a move. And every move has a tested way back. The book's warning is worth remembering: most coexistence outages are revocation outages. A list Entra ID can't reach within ten seconds fails the sign-in. After the migration, the work becomes keeping it all renewed.

## Slide 15 — Monitoring turns expiries into signals, not outages

Migration ends on a date. Certificates don't. Every one reaches its expiry, and every authority must keep publishing a revocation list until then. So the program watches for trouble while it can still be fixed: any certificate close to expiry with no renewal path, anything issued outside policy, a trust store holding something unapproved, a list about to go stale. The evidence is kept weekly, because an assessor asks how long a finding stayed open, not just whether it's open. One choice needs care. Making a valid certificate a condition of access turns a failed renewal into a locked-out user. So the CISO decides the grace period first. Then the old authority can retire.

## Slide 16 — Retire AD CS last, CA by CA, with evidence

Retirement is the last wave, and it happens one authority at a time. The gate is strict: cutover done, thirty days with no incidents, and everything that stays documented and running. Even then, the addresses where certificates check their status keep serving until the last certificate they cover has expired. Under the recommended design, the root that signed the cloud issuer stays. And the authority's records carry their own federal retention, measured in years, so the records officer signs off before any archive is destroyed. The decision for the sponsor and CIO: retire each authority only after its gate passes, keeping one for domain controllers until the last of them is gone. Now, the risks.

## Slide 17 — Risks that turn into outages or findings

The risks fall into three groups. Expiry: a certificate nobody owned, one that was never inventoried, or the enrollment server's own certificates lapsing. Revocation: a list Entra can't reach fails every sign-in for that authority, while an authority trusted with no list at all lets revoked certificates keep working. And trust: weak bindings let a look-alike certificate sign in, and the new cloud issuer inherits any weakness in the old hierarchy. Temporary exceptions are the CISO's to grant. Standing ones, with no end date, are risk acceptances. So the decision for the authorizing official: accept each standing exception explicitly, or don't. Let's pull the decisions together.

## Slide 18 — Decisions to make, owners and timing

So, the decisions. The sponsor and CIO run this as its own program, adopt the four-issuer target anchored to the existing root, confirm the self-hosted lifecycle platform, name a renewal owner for every class, approve each wave's gate, and retire each authority only after its gate passes. The CISO sets lifetimes and automated renewal, requires strong bindings, owns one access model, and sets the compliance grace period. The PKI team classifies every template and runs the root's revocation list as a production service, and with the security team holds the hardening gate. The authorizing official accepts each standing exception. It starts with the inventory. Book 07 has the detail, every claim footnoted. Thank you.
