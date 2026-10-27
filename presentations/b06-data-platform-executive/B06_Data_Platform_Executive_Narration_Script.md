# Book 06 — Data Platform: SQL Server Identity — narration script (practice copy)

## Slide 1 — SQL Server Identity: the executive briefing

Welcome. This is the executive briefing for Book 06 of the Federal Modernization Workbook, SQL Server identity. It's for the people who make the calls: the CIO, the CISO, the data platform owner, application owners and sponsors. The argument is short. Every domain-joined SQL Server inherited Windows Authentication, and none of it is visible to the identity plane that enforces multifactor sign-in. The estate has to be counted and shrunk before any login moves. And the destination is an Entra token on every connection, finished well before the program's own NTLM block date. Each decision slide names the decision, its owner and when it's needed. Let's start with why the database is where this hides.

## Slide 2 — The database is where legacy authentication hides

Why does legacy authentication hide in the database? Because SQL Server doesn't check a Windows user's password itself. It trusts whatever Windows tells it, and you can't switch that off. Which protocol a connection actually used is visible only from inside the engine, one session at a time. The dependencies sit in connection strings, service accounts and linked servers, and none of them reaches an identity dashboard. Of the four ways a connection can authenticate today, only an Entra token passes through multifactor and device checks. So when NTLM goes and Conditional Access arrives, the database breaks last and hardest. It needs its own plan. And the worst of it is silent.

## Slide 3 — Silent NTLM fallback is invisible until measured

Here's the part nobody sees. When an instance's service principal name is missing, Kerberos quietly gives way to NTLM, and the application still connects. The engine doesn't log which protocol each session used, so an estate that believes it runs Kerberos can be running NTLM on a large share of its connections. Only measurement tells you. Meanwhile the identities themselves are anchored in Active Directory, or in a password the instance checks on its own, like the built-in sa account. None of this was a mistake. It was good engineering for a world where everything was domain-joined. That world is ending, and three drivers are ending it.

## Slide 4 — Three drivers end it; 2027-04-01 is the program's date

Three forces end this inheritance. NTLM is going: Microsoft has deprecated it, and the program has committed to eliminating it. Zero trust needs the Entra identity plane in front of every human sign-in. And when Active Directory stops being the source, the engine needs an identity that outlives it. April first, 2027 is the program's own NTLM block date, not a Microsoft or federal deadline. The outside dates in 2027 are support dates for older Windows Server and SQL Server, and none of those versions can take Entra logins. So the decision is to hold the order: count and consolidate, enable Arc, move logins, then block NTLM. Counting comes first.

## Slide 5 — Count the estate before deciding anything

Before anyone decides anything, count. Twenty years of growth leave three kinds of sprawl: more instances than anyone remembers, databases nobody can account for, and dependencies that cross domains. No single tool finds them all, so the program combines a network sweep, the Kerberos registration trail and Microsoft's assessment tools into one inventory it can re-run. The book's illustration makes the point. A team that believes it has forty instances, when discovery finds a hundred and ten, isn't behind schedule. Its whole estimate is wrong by nearly three times. Missing instances surface at the worst possible moment unless you look first. Then each one needs a verdict.

## Slide 6 — Retain, consolidate or retire gates everything

Every instance gets one of three verdicts: retain it, consolidate its workload into a target, or retire it. Three lenses make the call defensible. How busy is it? A database untouched for over a year is a zombie, and retiring it removes every forgotten login it carries. What version is it? Entra logins need SQL Server 2022 or later, so most old engines are better consolidated than upgraded. And what depends on it? A job that runs once a quarter can make an idle instance load-bearing. The decision for the CIO and data leadership: a verdict for every instance and a named target, so authentication migrates once, in its final shape. Then the audit.

## Slide 7 — The audit sorts survivors into three categories

The audit asks one question of every surviving instance: what is actually authenticating here? It records the logins, the mode, the service account and the Kerberos registration, and it flags the worst first: an enabled sa, active SQL logins, missing registrations. Each instance then lands in one of three categories. Ready for Entra now. Ready once Azure Arc is installed. Or blocked, because the version is older than 2022 or it's a failover cluster. The decision: data leadership upgrades or retires each blocked instance it's keeping, and anything that can't move in time goes to the authorizing official as a dated exception. Here's the destination.

## Slide 8 — The target: every connection carries an Entra token

The destination is simple to say. Every connection carries an Entra token. Azure Arc gives each instance an identity in Entra. People, groups and applications get Entra logins, and sa is disabled rather than migrated. Multifactor is enforced by Conditional Access before a token is ever issued; the engine itself has no multifactor logic. One point saves months. The engine can move to Entra while the server is still domain-joined. Waiting for Windows sign-in to move first is the most common cause of needless delay. So the decision for server infrastructure: onboard Arc now, starting with the instances that need it most. Five positions govern that work.

## Slide 9 — Five positions the engine decision settles

The engine-authentication decision, still formally proposed, settles five positions. Consolidation comes first. Every production cutover runs in parallel: create the Entra login, prove it works, disable the old one, watch for thirty days, then drop it. SQL logins are eliminated, and sa is disabled and renamed, with an empty break-glass group for emergencies. Older versions upgrade or carry a dated exception. And a per-instance record is the proof of closure. The decision belongs to the CISO: set the standard once, SQL authentication refused and sa disabled everywhere in production. An instance that can't meet it doesn't stay in mixed mode quietly; it goes to the authorizing official. Now, where all this runs.

## Slide 10 — Where it runs, and what it costs

Two facts shape where this runs. Entra authentication for Arc-connected SQL Server isn't offered in the US Government Virginia region today, so the design uses a commercial Azure subscription in the same directory as the government tenant, and the hosts need a path to the public cloud. The services it leans on are each listed in scope for FedRAMP High, but a listing isn't an authorization. On cost, Entra authentication itself works under a plain SQL Server license; the extras are Conditional Access, privileged access management and Defender plans. So the authorizing official decides: accept these leveraged services, after reviewing each package, before production onboarding. Now, who decides what.

## Slide 11 — Access is now decided in five places

Under Windows authentication, the DBA team owned database access almost by default. In the target, one connection depends on a group the identity team built, a rule the data owner approved, a permission only a privileged role can grant, a login the DBAs created, and a connection string the application team changed. Miss any owner and the gap shows up as drift, or as a help desk call nobody can close. So the model is one decider per row. Data leadership decides verdicts and closure; the authorizing official decides every exception; the CISO sets the standard. The first step is filling the project's open sponsor and lead roles. So what does each team actually do?

## Slide 12 — DBAs run the engine; application owners own the chain

So who does the work? The DBAs run the engine: the inventory, the audit, the logins, the thirty-day parallel run, and the Kerberos repairs. What they no longer decide is who gets in. Membership of the group that holds sysadmin becomes a privileged access decision. Application owners own their side of the chain: connection strings, test sign-off and cutover windows. And data owners, even when they're the same person, answer a different question: does this access rule still describe the right people? The decision for application and data owners: confirm every rule before its group grants access. Some steps sit outside the DBA team on purpose.

## Slide 13 — Privileged steps sit outside the DBA team on purpose

Some of the most powerful steps don't belong to DBAs at all, by design. Granting the instance identity its directory permissions takes a role that can manage every other role in the tenant, so it stays with a small identity group, eligible only on request. And the Azure roles around the server now matter as much as sysadmin. Contributor on the server can run privileged extensions. Contributor on the SQL resource can switch SQL logins back on. Whoever holds those roles holds a database privilege. So the CISO's decision: review those Azure assignments on the same cadence as sysadmin, from the first Arc onboarding. Next, the applications upstream.

## Slide 14 — Applications are the other half of the chain

The database isn't finished until the applications in front of it are. Each application gets placed on two axes: how its users sign in, and what its database driver can actually do, from a simple configuration change to no Entra path at all. An application stuck on legacy domain services holds its whole instance back. The change itself is one line in a connection string, but it waits for three gates: the login exists, the role is granted, and it's been tested somewhere that looks like production. Application owners approve each cutover against those gates. Then, the protocol itself.

## Slide 15 — NTLM: discover, restrict, then block on 2027-04-01

NTLM isn't a setting you switch off. It's a protocol that four connection patterns keep producing, and each has to be found and fixed. The program does it in three phases. Discover every source. Restrict: block the oldest version first, repair Kerberos registrations, move linked servers and applications. Then eliminate, with a domain-wide block on April first, 2027. Any instance already on Entra logins doesn't notice. The block lives in Windows, so it ignores engine-level exceptions. That leaves one open question for the NTLM program, with each exception going to the authorizing official: does the date hold for the long tail, or does it get dated, isolated exceptions? Certificates are the next dependency.

## Slide 16 — Certificates the AD CS retirement plan can't see

SQL Server leans on certificates in three places most retirement plans can't see. The TLS certificate every Entra connection now requires, since those connections are always encrypted. Certificates behind signed code and endpoints. And certificate sign-in, the stopgap for connections that can't reach Entra in time, which quietly depends on the domain controllers' own certificates. Cloud PKI can't help here; it doesn't issue to servers. Book 07 settles the issuer: a retained internal hierarchy, renewed through the lifecycle platform, with domain controller certificates kept until the last one retires. The decision for data leadership: set no retirement date for the old certificate authority until every SQL Server dependency has moved. Then, what done means.

## Slide 17 — Done means five conditions, proven continuously

Done isn't a date. It's a posture you keep proving. An instance is closed when five things hold at once: no usable Windows logins, SQL authentication refused, Entra sign-ins observed working, an Entra identity for the engine, and multifactor for every person. Live evidence shows it over a validation period, and any drift is a violation. That's why April first, 2027 is a consequence, not a finish line. Migration ends well before it, and the last months are for proving. The decision for data leadership, as system owner: declare closure only on the security officer's evidence, with every exception already accepted. What could still go wrong?

## Slide 18 — Risks that can still derail the schedule

Here are the risks the book names, in three groups. Scope: instances found late, cluster instances that can't take Entra logins, and applications that hold their instance back. Sequence: engine work held up waiting for Windows sign-in, the old certificate authority retired before its replacement, and migration still running when the block lands. Control: Azure roles that can quietly turn SQL logins back on, and one server identity shared by every application on the host. The decision: every residual risk goes in the exception registry, with a control, an owner and an end date, and the authorizing official accepts it. One last question.

## Slide 19 — The platform question comes after, per data domain

Once authentication has moved, a different question opens up: which platform should each data domain live on? That choice isn't forced, so it comes after, one domain at a time. Stay on SQL Server, or move to PostgreSQL or Oracle; each can meet the identity requirement. The book scores them on ten dimensions with evidence, from migration effort and skills to licensing and exit cost, and two domains reaching different answers is normal. The goal is fewer authoritative platforms, not one vendor. So the decision for the CIO and data leadership: choose per domain, after closure, as its own funded decision, with the same parallel-run discipline. Let's pull the decisions together.

## Slide 20 — Decisions to make, owners and timing

So, the decisions. The CIO and data leadership hold the order, give every instance a verdict and a target, upgrade or retire old engines, set no retirement date for the old certificate authority until SQL Server's certificates have moved, and declare closure on evidence. The CISO sets the standard and reviews Azure roles like sysadmin. Server infrastructure onboards Arc now, on domain-joined hosts. Application and data owners approve their access rules and their cutovers. The authorizing official accepts the leveraged services and every exception. And the NTLM program decides the long tail. None of this waits on a purchase. Count the estate first. Book 06 has the detail, every claim footnoted. Thank you.
