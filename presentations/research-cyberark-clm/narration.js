// Spoken narration for the CyberArk CLM implementation guide, one entry per narrated slide, keyed by title.
// This is what the voice says: the slide's intent and its one or two highpoints, in plain language, with a
// lead-in to the next slide. The full detail stays in each slide's notes as the "Detail:" block, which
// narrate.py never speaks. (Pilot of the narration style the workbook's other decks will move to.)
module.exports = {
"Certificate Lifecycle on CyberArk Certificate Manager":
`Welcome. This is an implementation guide from the Federal Modernization Workbook, and it's about one product: CyberArk Certificate Manager. Book 07 of the workbook chose it as the program's certificate lifecycle platform, so whenever you hear me say "the platform," that's what I mean. Its job is simple to say and hard to do: keep track of every certificate nobody else is renewing, and renew it before it expires. We'll start with what the platform is and what it's made of, then build it, connect it to the certificate authorities, automate it, and finally fit it into Book 07's migration waves. The slides and notes carry every detail and source; I'll stick to what matters.`,

"What this guide implements: Book 07's issuer map":
`Before we build anything, here's the idea that frames this whole guide. Book 07 doesn't use one certificate authority for everything. It gives each kind of certificate its own source and its own way of renewing. Intune looks after device certificates. PIV cards have their own card system. Domain controllers keep renewing themselves the way they always have. What's left — servers, VPN and RADIUS, SQL, internal websites, appliances, and anything public-facing — has nobody renewing it today except a person with a calendar reminder. That's the gap the platform fills. It becomes the system of record for every certificate Intune and PIV don't already manage.`,

"Prerequisites and decisions before you build":
`Two things to settle before you build. First, where it runs. There's no FedRAMP package for CyberArk's cloud edition, so the program runs the self-hosted edition inside the agency's own boundary, next to the certificate authorities it manages. Second, what it runs on: Windows servers, English-language builds, all on the same version, with a SQL Server database that lives on its own server. Plan for an upgrade roughly every six months, because that's CyberArk's release rhythm. The full requirements are on the slide. Next, let's open the box and see what the platform is actually made of.`,

"Inside the platform: what it is made of":
`This short section answers the question people ask first: what actually is the platform? Not a box, and not one server. It's a set of Windows servers running the same CyberArk software against one shared database, with different jobs switched on in different places. We'll look at those server roles, the web tier you sign in to, the back end that does the work, the components, the drivers that reach other systems, what it all connects to, a reference layout for two sites, and finally one certificate's journey from start to finish.`,

"Inside the platform: the server roles":
`Here's the whole platform on one page. Every server runs the same software and talks to the same database; what makes a server a "web server" or a "back-end server" is which components you switch on. The web servers sit behind a load balancer and give people and automation a way in. The ACME servers are kept separate, because CyberArk doesn't allow FIPS mode on a server that handles ACME. The back-end servers do the real work — issuing, renewing and installing certificates. The log servers keep the audit trail and send events to the SIEM. And underneath: one SQL Server database, the keys that protect it, and a message bus that keeps every server in step.`,

"The web tier: consoles, API and sign-in":
`The web tier is how anyone gets in. People use the web console for daily work and the Policy Tree, which is also a web page, for the deeper configuration. Automation uses the REST API, and sign-ins for both go through the platform's authentication service. There's one more console, the Configuration Console, that administrators run on each server to switch components on and off. The thing to remember for the build is the load balancer: every web service sits behind one name, and that name has to match the certificate the servers present, or single sign-on breaks.`,

"The back end: engines, log servers and message bus":
`Behind the scenes, three things matter. Processing engines decide which server does which work, so you can keep, say, public certificate requests on one server that's allowed out to the internet. The log servers record every event and are the only servers that need a path to the SIEM and email. And the message bus keeps every server informed about changes, which means one firewall rule people miss: port 8883 has to be open between every server, across sites too. Watch distance as well — every server works against one active database, and at a thirty-millisecond delay a single renewal takes about fifteen seconds.`,

"Components: switched on server by server":
`This table is the platform's parts list. Each component is a job you switch on per server: the lifecycle engine that issues and renews, CA Import that pulls in what your CAs already issued, discovery that finds certificates on the network, validation and revocation monitoring that keep checking, and the enrollment services — ACME, EST and SCEP — that devices and scripts use to ask for certificates. You don't need to memorize the list. The point is that the design is modular, so you place each job where its network access and its security rules fit.`,

"Drivers, agents, the database and the keys":
`Drivers are how the platform reaches the outside world. CA drivers request certificates from AD CS, public CAs or AWS. Application drivers install certificates on IIS, F5, NetScaler, Key Vault and the rest, usually without any agent. Where a driver can't reach, a small Server Agent checks in and does the work locally. Everything is stored in one SQL Server database, and that database's secrets are protected by a key — either a software key you must back up, or a hardware security module. Lose that key and you lose the data, which is why it's treated as Tier 0.`,

"What the platform connects to":
`Now the bigger picture: everything the platform touches. On the left, the certificate authorities it asks for certificates. On the right, the systems it installs them on. Above, Entra ID for signing in to the console, and CyberArk's own vault for the passwords its drivers need. Below, the SIEM for events and ServiceNow for owners and tickets. Two lines are dashed on purpose: Kubernetes and ServiceNow both need extra care, because one depends on a cloud service outside the boundary and the other is a third-party app. We'll come back to both.`,

"A two-site reference topology":
`Here's how those pieces could be laid out across two sites. This is the program's design, built only from CyberArk's documented rules, not a vendor blueprint. Each site has a web server, a separate ACME server, a back-end server and a log server. One database runs in an availability group across both sites, with one listener everyone uses, and the HSMs are paired the same way. Two cautions. CyberArk doesn't say whether FIPS and non-FIPS servers can share one cluster, so get that in writing. And keep the sites close, because the remote site pays for every round trip to the database.`,

"One certificate's journey through the platform":
`Let's follow one certificate through all of that. First the platform finds it, by scanning the network or importing from a CA. Then it gives it a home in a policy folder and a named owner. When it's time, the lifecycle engine asks the CA for a new one, and a driver installs it on the server. Validation keeps checking that it's really there and still trusted. Before it expires, the cycle repeats — no one has to remember a date. And when the system it belongs to is retired, the certificate is revoked. Every step leaves a log entry, and that trail is what an assessor reads. With that picture in mind, let's build it.`,

"Part 1: Build the platform":
`Part 1 is the build. We'll size the cluster and make it highly available, be careful about what we claim for FIPS, set up how administrators sign in, harden it, and make sure it can be recovered.`,

"Architecture: cluster, components and availability":
`Sizing is refreshingly simple. Two servers handle up to about fifty thousand certificates. Past that, CyberArk's guide splits the work across six — two each for web, back end and logging — and beyond a million certificates CyberArk designs it with you. For availability, the rules are what you'd expect: at least two servers per role, a load balancer in front of the web services, and an availability group for the database. One nice touch for the certificate authorities: a CA pool lets the platform fail over to a second CA if the first one stops answering.`,

"FIPS posture: what you can and can't claim":
`FIPS is where it's easy to overclaim, so let's be precise. The platform runs on Windows servers that can be in FIPS mode, and that's documented. What isn't documented is a FIPS certificate for the platform itself — none of CyberArk's validated modules names this product. So the honest evidence is FIPS-mode Windows, plus the HSM's own certificate for the database secrets. And remember the catch from earlier: the ACME servers can't be in FIPS mode at all, which is why they're kept separate.`,

"Console sign-in: Entra SSO with certificate-based auth":
`Next, how administrators sign in. The platform supports single sign-on with Entra ID, so the program's approach is to put the console behind Entra and let administrators use their PIV card through Entra's certificate-based authentication. That way there's one trust store and one set of Conditional Access rules, instead of a second login system to maintain. Keep the platform's own certificate login as a fallback, keep a local break-glass account, and shorten the default token lifetimes for automation — ninety days is too long.`,

"Hardening and least-privilege service accounts":
`Hardening comes down to one uncomfortable fact: this platform concentrates privilege. It holds rights on your certificate authorities, administrator access on the servers it installs certificates on, and private keys in its database. So apply CyberArk's web server hardening, replace the self-signed certificate every server ships with, switch outbound certificate checking from its default of "none" to strict, and keep driver passwords in the CyberArk vault. Then treat the admins, the key and the database backups as Tier 0.`,

"Backup and disaster recovery: database and keys":
`Recovery hinges on a pair: the database and the key that protects it. Back up both, store them separately, and if an HSM holds the key, run the HSMs as a pair, because the platform shuts down when it can't reach one. CyberArk's recovery steps are on the slide; the one people forget is re-enabling SQL Service Broker after a restore, which quietly stops everything. The program's rule is to rehearse a full restore before the second migration wave ends. That's the build. Now let's connect it to the certificate authorities.`,

"Part 2: Connect the issuers":
`Part 2 connects the platform to the places certificates come from: the agency's own AD CS, public certificate authorities, the cloud, and how it lives alongside Intune.`,

"The AD CS driver: permissions, templates, versions":
`The most important connection is to AD CS, the agency's own certificate authority. The platform talks to it over DCOM, using an account with the right to issue and manage certificates. The cleanest pattern is one platform template for each AD CS template it issues from, so policy is easy to read. After Active Directory retires, Book 07 moves server certificates to a standalone CA, and the platform handles that fine. One open item: CyberArk's support table stops at Windows Server 2022, so if your CA runs 2025, get that confirmed in writing.`,

"Scoping the CLM's CA account under ESC7":
`This slide is about one dangerous permission. To issue certificates on the agency's CAs, the platform needs a right called Issue and Manage Certificates, and with it an account can approve, deny or revoke certificates. Attackers know this; it's a known attack path called ESC7. Here's the honest part: Microsoft doesn't give you a switch that limits that right to a few templates, so we don't pretend it does. We limit what the account can request, prove in the lab that a request outside those templates fails, and alert if one ever succeeds.`,

"Public and cloud CA drivers in 26.1":
`For public certificates, the platform has drivers for the major public CAs, and two changes in this release matter before you upgrade. Entrust is no longer supported as a public CA, so if that's your provider, plan the path first. And DigiCert client certificates now need an email address, or renewals fail. On the cloud side, the platform can issue through AWS and install into Azure Key Vault. What I couldn't confirm is Key Vault support in Azure Government, so test it or ask before you rely on it.`,

"Intune coexistence: who owns device certificates":
`The rule with Intune is simple: Intune owns device certificates, and the platform stays out of its way. If some Intune certificates still come from AD CS during the transition, the platform will see them, and it just watches — it doesn't renew them. CyberArk can also act as Intune's certificate authority, but the program says no, because that would create a second issuer for devices that are mid-migration. And there's no built-in way to pull in Cloud PKI's inventory; it would take a custom job, so Intune's own report stays the record.`,

"Part 3: Discover, own and automate":
`Part 3 is where the platform earns its keep: finding every certificate, giving each one an owner, and automating renewal so nobody has to remember a date.`,

"Discovery scans and CA import":
`You can't manage what you can't see, and a CA's database only shows what that CA issued. So the platform finds certificates two ways: it scans the network for anything presenting a certificate, and it imports what your CAs already issued. Agents and API feeds fill in the rest. The program's rule is blunt: any certificate found with no record and no owner is a finding. In the first wave, run read-only scans and imports, and log every surprise.`,

"Ownership: policy folders, owners and the CMDB":
`An expired certificate is almost always an ownership problem before it's a technical one. So every certificate gets a home and a named owner. The platform's policy folders mirror Book 07's certificate classes, so where a certificate lives tells you how it renews. Owners come from Entra groups, and, if the agency uses it, the ServiceNow app can tie certificates to the same configuration items as the CMDB. And one alert matters most: a certificate nearing expiry with no renewal path is an incident while there's still time to fix it.`,

"Enrollment automation: ACME, EST, SCEP, REST, agents":
`Automation is how renewals stop depending on people. Web servers can renew themselves using ACME, the same protocol public certificate sites use. Network devices can use EST or SCEP. Scripts and pipelines use the REST API or CyberArk's command-line tool. And for everything else, the drivers renew the certificate and install it for you. The one design rule to carry forward is the one we've seen twice: ACME runs on its own servers, outside FIPS mode.`,

"Kubernetes, ServiceNow and SIEM inside the boundary":
`Three integrations, each with a boundary question. Kubernetes discovery only works through CyberArk's cloud service, which isn't authorized, so inside the boundary we use cert-manager, which talks straight to the self-hosted platform. ServiceNow has no CyberArk-built app, only a third-party one, so assess it like any supply-chain component. And the SIEM gets the platform's events over syslog with TLS — with one gotcha: the SIEM collector's certificate needs its IP address in it, even if you connect by name.`,

"Part 4: Migrate and operate":
`Part 4 puts it all on a timeline and keeps it running: the build mapped to Book 07's six waves, renewal as certificate lifetimes shrink, monitoring, and retiring the old CAs.`,

"Build sequence mapped to Book 07's six waves":
`Here's the build laid onto Book 07's six waves. Wave one is a small test cluster and read-only discovery, so you learn what you have. Wave two builds production properly — two of everything, keys backed up, sign-in and logging done — and doesn't close until a restore has been rehearsed. Wave three pilots automatic renewal on a handful of servers, with the old method left on as a safety net. Then you scale ring by ring, move public certificates over, and finally retire CAs using the platform's inventory as proof.`,

"Renewal as public TLS lifetimes shrink":
`Here's why this can't wait. Public certificate lifetimes are shrinking fast: two hundred days today, a hundred next year, and forty-seven days by 2029. For a thousand certificates, that's roughly seven renewals every working day now, and over thirty in 2029. No team can keep that up by hand. That's why Book 07's rule is that no certificate may depend on a person remembering a date — every one runs through Intune, autoenrollment, or this platform.`,

"Monitoring and drift on the CLM platform":
`Monitoring is where the inventory pays off. The platform sends its events to the SIEM and watches for four kinds of drift: a certificate close to expiry with no way to renew it, a certificate issued outside policy, a revocation list that's going stale, and trust stores that have picked up roots they shouldn't have. The checks run at least weekly, and the results are kept, because an assessor will ask how long a problem stayed open, not just whether it's open today.`,

"Decommissioning AD CS with the CLM inventory":
`Eventually the old certificate authorities retire, and the platform is the evidence that it's safe. Before a CA goes, its inventory has to show that nothing still depends on it. Then you stop new issuance — after pointing the platform's templates at a CA that's staying — publish the last revocation list, and remove the service. The records and endpoints stay up until the last certificate expires. After Active Directory, server certificates come from a standalone CA under the same root, still driven by the platform.`,

"Decisions, vendor asks and next steps":
`To wrap up. The decisions are yours: which servers run in FIPS mode, HSM or software key, and a handful of integration choices. There are a few questions to put to CyberArk in writing, mainly around FIPS, Windows Server 2025, and Azure Government. And the next steps are concrete: stand up the test cluster, create the CA account under the ESC7 controls, and prove in the lab that it can't do more than it should. The program's view is clear — this is the right platform for Book 07's design, and its risks are known and manageable. This is the program's research, under review, and not an endorsement by any federal agency. Thanks for watching.`,
};
