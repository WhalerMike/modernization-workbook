# Building Provider Notices, Chapter 02 — Microsoft 365 Message Center, Service Health — narration script (practice copy)

## Slide 1 — Chapter 02: Microsoft 365 Message Center, Service Health

Welcome to the Federal Modernization Workbook's developer workbook, Building Provider Notices. This is Chapter 2: Microsoft 365 Message center and service health. Message center already tells a tenant what will change and when. The work is reading it from the API, on the right cloud, and saying who decided a post needs action. We'll start from Microsoft Learn's service communications API, see what it leaves to you, then read how the kit fills the record from Chapter 1, and walk two labs, the evidence and the dangers. Two notes before we begin. This chapter is a draft, awaiting the owner's review. And the code is illustrative, tested against fixtures.

## Slide 2 — Why read Message center from the API

Why this chapter? Message center is where Microsoft tells a tenant about retirements and changes, often months ahead. But a post that nobody reads, or that only arrives by email, doesn't become anyone's task. So the goal is precise. By the end you can read a tenant's Message center posts and service health issues with just two read permissions, on the host for the tenant's own cloud, into records that say which posts need action and whether Microsoft or the kit said so. This is for the developers, the Microsoft 365 service owner, and the change manager who receives the tasks.

## Slide 3 — Which cloud: GCC on the worldwide Graph host

First, which cloud. A GCC tenant keeps the worldwide Microsoft Graph endpoint, so this workbook's baseline reads graph dot microsoft dot com. Microsoft Learn's national cloud page gives GCC High and the Defense Department their own hosts, a short side note here. Why does it matter? Because a wrong cloud fails silently. A GCC High tenant read on the worldwide host simply returns nothing, and the gate passes on an empty list. So the kit has one row per cloud and no default, and the live run refuses a Graph session in another environment or another tenant.

## Slide 4 — What Microsoft Learn gives you

Here's Microsoft's starting point. Microsoft Learn's service communications API overview names the resources and the two permissions: one to read Message center posts, one to read service health. Both are granted only by an administrator, and a delegated sign-in also needs an admin role. There are three list methods on version one point oh: messages, issues and health overviews, each with its permission and its national-cloud availability. One caveat from Learn's admin roles page: data privacy messages are visible only to Global Administrators and Message Center Privacy Readers. And Learn's own cmdlet for posts is the one we'll cross-check against in Lab 2.

## Slide 5 — What it leaves to you, and the verdict

What does Learn leave to you? No post category says retirement, so the kit treats a post tagged Retirement as one; Learn doesn't list the tags, so that's marked not yet specified. The action-required date is the only field where Microsoft says it wants action, so the kit keeps it as Microsoft's. Samples show enum values in a different case, post bodies are HTML, a next link is a URL the response chose, and a post past its end still lists. Each gap is pinned by a test. The verdict: use Learn's calls and permissions as they are, and build the kinds, the action basis and the host guard.

## Slide 6 — The collector: three declared calls

Now the code. The Microsoft 365 collector makes three declared calls: messages, issues and health overviews. In a live run each is a GET through the Graph PowerShell request cmdlet; in fixture mode it's a file. The posts and the issues become notices. The health overviews don't; they're kept in the raw folder, for the run's record. And the source link of every record points to the post or issue on the same host the kit read it from, so a task always links back to what Microsoft actually published.

## Slide 7 — Posts and issues to kinds, and who decided

Here's how the normalizer maps them. A post tagged Retirement is a retirement. Plan-for-change and prevent-or-fix posts are changes, and stay-informed posts are advisories. For all of them, if Microsoft set an action-required date, the record keeps it, and says the provider decided. There's one kit rule: a prevent-or-fix post with no date is still action required, labeled as the kit's rule, with no date invented. Service health issues become incidents or advisories, never action required, and a resolved issue is closed.

## Slide 8 — The host guard: the request, the next link, the session

Because a wrong cloud fails silently, the kit guards the host three ways. First, it can build each live request from the settings without running it, so a reviewer sees the exact URL. Second, before the first call it compares the Graph session's environment and tenant with the settings, and refuses a mismatch. Third, it follows a next link only if it's on the cloud's own Graph host, so the token never goes anywhere else. Tests cover the collector and each guard. And remember, the live reader was tested against stand-in responses, not a live tenant.

## Slide 9 — Who owns it, and what the reader may hold

Who's involved? Developers maintain the collector. The Microsoft 365 service owner owns this gate. The change manager receives the change and retirement tasks, and the security officer keeps the consent record and the run folder. What the reader may hold is just two read permissions, and nothing that writes. Learn says both are granted only by an administrator, and a delegated reader also needs an admin role; which roles Graph accepts isn't specified. One gap to plan for: data privacy posts need a Global Administrator or a Message Center Privacy Reader, so name one where they matter.

## Slide 10 — Lab 1: what Microsoft 365 needs, each cloud's host

Lab 1 needs PowerShell 7 with Pester, working in the kit's folder. The lab settings name a fictional tenant in GCC; nothing signs in. Step 1 lists what Microsoft 365 needs: two permissions across three calls, and nothing that writes. Step 2 prints each cloud's Graph host: GCC on the worldwide host with the Global environment, then GCC High and DoD on their own. There's one row per cloud and no default. Step 3 collects Microsoft 365 from the day-one fixtures: six notices, five open, two needing action, all valid against the schema.

## Slide 11 — Lab 1: the records, and who said they need action

Step 4 reads the records. The post tagged Retirement, about basic authentication for client submission, is a retirement due January 31, 2027. The SharePoint Framework post is a change that needs action with no date. And the resolved Teams issue is closed. Step 5 shows who said each one needs action. The retirement's date is Microsoft's: the basis names the provider's action-required field. The change's basis is the kit's rule for a prevent-or-fix post. Everything else says none. That line is what keeps a kit rule from being mistaken for Microsoft's deadline.

## Slide 12 — Lab 1: the second week, and a refused next link

Step 6 collects the second week and reads what changed. Seven notices now. A new post arrives with its own action date from Microsoft, February 28, 2027. The SharePoint post is updated, and its title says so. The email incident from week one is now closed. Step 7 builds the live request without sending it: the first line is the exact URL a live run would call, on the worldwide Graph host. Then it tries a next link on another host, and the kit refuses it, because it isn't on the GCC Graph host.

## Slide 13 — Lab 1: the chapter's tests pass

Step 8 runs this chapter's tests: the Microsoft 365 collector block and every Graph test in the live tests. Fifteen pass, none fail. The manifest lists the three calls with their permissions. So, in one short lab, you've seen two read permissions and nothing that writes, one Graph host per cloud with no default, Microsoft's date kept as Microsoft's and the kit's rule labeled as a rule, and a next link on another host refused. Delete the output folder when you're done, so no fixture output is mistaken for a real run.

## Slide 14 — Lab 2: a Microsoft 365 test tenant

Lab 2 uses a Microsoft 365 test tenant in the worldwide or GCC cloud, never production, signed in as a test administrator. Sign in delegated, in the Global environment, with only the two read scopes; an administrator consents once. Cross-check with Learn's own cmdlet: its count of posts and the kit's should agree. Then look at the posts that need action, confirm each has Microsoft's basis or the kit's rule, and record the tags you see on retirement posts, because Learn doesn't list them. Finally, sign out, delete the run, and remove any consent granted only for this lab.

## Slide 15 — Federal requirements and the evidence

Each output is evidence for something specific, against NIST's control catalog. Two read permissions and nothing that writes support monitoring an external service provider. Reads that went only to the tenant's own Graph host, and a run folder showing every post and issue was read, support that and receiving security alerts and advisories. And each change or retirement post, marked with who said it needs action, supports configuration change control, through the tasks Chapter 6 routes. The indicators are FedRAMP's key security indicators; the mapping is the program's. The kit's records support these controls; the assessor decides them.

## Slide 16 — Dangers, and the guard for each

What breaks in production? Read a GCC High or DoD tenant on the worldwide host and nothing comes back, so the gate passes on an empty list. Follow a next link to another host and the token goes somewhere you didn't choose. Grant a broad Graph scope for convenience and the reader can change the tenant. Mistake the kit's rule for Microsoft's deadline and a post gets an invented date. Data privacy posts go unseen without the right role. And trusting the email over the API means look-alike email gets acted on, so the task always links the post the kit read from Graph.

## Slide 17 — Done when: the chapter's checklist

Here's what done looks like. The settings name the tenant's cloud and tenant ID, and the session guard passed. The reader holds the two read permissions and nothing else from this kit. Learn's cmdlet and the kit's collection agree in the test tenant. Every action-required post says whether Microsoft or the kit's rule decided it. The retirement tags you saw are recorded in the verification log. And consent granted only for the lab has been removed. Next, Chapter 3 fills the same record from Oracle Cloud Infrastructure's announcements. Thanks for watching.
