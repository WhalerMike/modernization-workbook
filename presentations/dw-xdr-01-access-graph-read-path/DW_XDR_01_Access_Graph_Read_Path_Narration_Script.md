# Building Defender XDR, Chapter 01 — Access and the Graph Read Path — narration script (practice copy)

## Slide 1 — Chapter 01: Access and the Graph Read Path

Welcome to the Federal Modernization Workbook's developer workbook, Building Defender XDR. This is Chapter 1: access, and the Graph read path. Every check in this workbook reads through one door. Before anything else, we prove the door is the right one, in the right cloud, and that the people behind it hold only what the design gave them. We'll start from Microsoft Learn's commands, read how the kit declares its calls and checks its roles, and walk two labs, the evidence and the dangers. The chapter has been reviewed and approved, and the code is illustrative, tested against fixtures.

## Slide 2 — Why prove the read path first

Why start here? Because every later chapter reads through Microsoft Graph: incidents, advanced hunting results and custom detection rules. If the session behind those reads is in the wrong tenant, it still answers, and a check that reads an empty list passes. So by the end of this chapter you can run the kit's access check, read its findings, and say which Graph permission and which role each later chapter needs. It's for the developers who maintain the kit, the platform owner who owns this gate, and the security officer who reviews who holds Defender roles.

## Slide 3 — What the guide and Microsoft Learn give you

Start from what the guide and Microsoft Learn already give you. Create the custom roles in Defender's unified role-based access control, in four permission groups, assigned to groups and data sources. Activate it per workload, which needs at least Security Administrator. Connect the read path with Connect M G Graph, the Global environment, and two scopes: security incident read, and threat hunting read. Then validate with Learn's own call: list up to five incidents with no permission error. Learn's national cloud page says GCC uses the worldwide Graph endpoint, so the environment is Global.

## Slide 4 — What it leaves to you, and the verdict

What does that leave to you? A connect line with an environment, but a session left over from another tenant answers too, so the kit refuses a live run in the wrong environment or tenant. Permissions page by page, but nobody sees the whole job's needs, so the kit declares every call with its permission, roles and Learn page. A role design in prose, but a portal role list drifts, so the kit compares the export with the design. And a pass on no permission error, so the kit makes the read one result row and keeps going. The verdict: keep Learn's calls; build the checks around them.

## Slide 5 — Declared calls, and one door for writes

Here's the call list. Three reads: list incidents, run a hunting query, and list custom detection rules, each with the least-privileged read permission Learn names. And two writes, create and update a detection rule, with the read-write permission. Reads go through one function and one of two invokers. The fixture invoker reads a file and sends nothing; that's Lab 1. The live invoker calls Graph on the settings file's cloud, after the session check, and follows next links only on the same host. A write never goes through the read path. Only the runbook's publish and rollback scripts send one, with an approved hash.

## Slide 6 — The role check: six rows

The access check writes six kinds of row. Cloud: the settings name a known cloud, and the Graph host comes from it. Read: the first read of incidents answers. Role: each designed role exists with exactly its permissions, and a role that isn't in the design is a warning. Restricted: advanced live response is held only by the Tier 0 role. P I M: every group a role is assigned to is one that Privileged Identity Management governs. And emergency: no emergency access group holds a Defender role. The input is a role export the operator files from the portal. Learn names no API for those roles on the pages read.

## Slide 7 — Who owns the roles, who reads the result

Who's involved? The platform owner owns this gate: creates and assigns the roles, and changes them under a change record when a row fails. The security officer reviews who holds Defender roles each quarter, alongside the Privileged Identity Management report. And developers maintain the call list, the invokers and the role check, with their tests. One caution: Lab 1 reads fictional fixtures, and the role export is a file someone makes. Treat the result as a review aid for the security officer, not as the authority on who holds what.

## Slide 8 — Lab 1: run the access check on fixtures

Lab 1 needs PowerShell 7 with Pester, in the kit's folder. Step 1 runs the access check on the fixtures. The read passes: five incidents, no permission error. Then three rows fail. The detection engineer role holds advanced live response, which only the Tier 0 role may hold, so both its role row and the restricted row fail. And the responder role is also assigned to a standing group that Privileged Identity Management doesn't govern. The legacy role is a warning: it isn't in the design, so someone records a decision or removes it. Fourteen checks, three failed.

## Slide 9 — Lab 1: the permissions, the manifest, the tests

Step 2 reads what each call needs: three reads, each with a read permission, and two writes with read-write custom detection. Step 3 reads the manifest: the task, the time, fixture mode, the one call the check made with its permission and Learn page, a hash for every file, and the result Chapter 8's evidence record carries. Step 4 runs the chapter's tests. All pass, none fail. Delete the output folder when you're done.

## Slide 10 — Lab 2: the same check in a test tenant

Lab 2 uses a test tenant, never production, licensed for Defender for Endpoint Plan 2, with the four roles created, and an account that holds Security Reader through Privileged Identity Management. Sign in to Graph in the Global environment with the read scopes. Run the access check without the fixture path. The read row should pass with up to five incidents, or none in a new tenant. An error that names a role means the account lacks one of the four roles Learn lists. Every failing role row is a change under a change record. The check changed nothing, so backing out is just signing out.

## Slide 11 — Federal requirements and the evidence

Here's what this gate proves, against NIST's control catalog. Each role holding exactly its designed permissions, with advanced live response only in Tier 0, supports least privilege. Every assignment going to a governed group, and no emergency access group in a Defender role, supports account management. And a working read path in the tenant's own cloud, with its permissions listed, supports restricting access to audit tools. The indicators are FedRAMP's, as the implementation guide maps them. The records support these controls; the assessor decides them.

## Slide 12 — Dangers, and the guard for each

What breaks in production? A Graph session in the wrong tenant: every check reads another estate, or nothing, and passes. The live run refuses it. A permission added to a role in the portal: someone can isolate devices or run live response who shouldn't; the role and restricted rows catch it. A role assigned to a standing group: privilege that never expires; the P I M row. An emergency access account in a Defender role, which turns the break-glass account into a daily account. And a write slipped into the read path: the read function refuses any call marked as a write.

## Slide 13 — Done when: the chapter's checklist

Here's what done looks like. The settings file names GCC and the test tenant's ID, with no secret in it. The read row passes in the test tenant. Every role, restricted, P I M and emergency row passes, or has a change record. The permissions file is filed with the role export. And the run folder is recorded as evidence, which Chapter 8 shows. Next, Chapter 2 uses the same read path to count the fleet against the inventory. Thanks for watching.
