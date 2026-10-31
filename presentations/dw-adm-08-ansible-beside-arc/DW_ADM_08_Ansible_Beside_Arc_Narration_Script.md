# Building the Attribute-Driven Migration, Chapter 08 — Ansible Beside Arc — narration script (practice copy)

## Slide 1 — Chapter 08: Ansible Beside Arc

Welcome to the Federal Modernization Workbook's developer workbook, Building the Attribute-Driven Migration. This is Chapter 8: Ansible beside Arc. Microsoft's role connects a server to Azure Arc, but it doesn't know which tool owns the server's settings, which tool patches it, or which wave it belongs to. The configuration database knows, and the inventory has to carry that to every connect. We'll start from Microsoft's own role, see what it leaves out, then walk the inventory, the wave plan, the onboarding playbook, two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — Why the owners travel with every connect

Why does this chapter matter? Because the program gives every setting one owning tool, and every server one patching tool, and both are recorded in the configuration database. Arc doesn't change any of that. What it does is turn the server into an Azure resource, and from then on, tags tell Azure's tools which servers are theirs. Those tags are written once, at the moment of connection. So the onboarding run is the one place owners get read, checked and carried. Connect a server without them, and it belongs to whichever tool reaches it first.

## Slide 3 — Who reads the tags after the connect

Here's who reads those tags once a server is connected. Machine configuration, from the last chapter, only enforces on servers whose configuration owner tag names it. Update Manager's dynamic scopes can group machines by tag, and they're evaluated at every scheduled run, so a scope on the patch owner tag follows the tag. The built-in assessment policy can be scoped by tag too. And the validation kit checks afterward for a server carrying enforcement it shouldn't. Every one of them depends on the tag being right from the start. Next, which Azure.

## Slide 4 — Which Azure: a GCC estate goes to commercial

Which Azure? This is easy to get wrong. The estate is a Microsoft 365 GCC tenant, and Learn says GCC uses the public directory, which can't be associated with an Azure Government subscription. So the estate's Arc servers go to a commercial subscription, using the agent's default cloud and the commercial endpoints on the slide. GCC High and Defense tenants are different: they use the government directory, Azure Government, and the dot U S endpoints. The code guards both directions, as we'll see.

## Slide 5 — What Learn gives you: the azure_arc role

Here's what Microsoft gives you. Learn documents Arc onboarding with Ansible through one role in the Azure collection. It installs the agent and registers each host, and it's idempotent, so a connected machine is simply skipped. Learn's page covers the onboarding role, the variables, and authentication, recommending the control node's managed identity in production because it removes stored secrets. It also suggests scheduling the job nightly. But Learn's planning page adds something the role page doesn't: pilot first, on non-critical machines, for at least thirty days, with a rollback plan.

## Slide 6 — The pinned role, and what Learn's page doesn't say

The repository keeps an unmodified copy of the role, from the released version, with every file's hash checked against upstream and against the published package. The collection is pinned to that version, and a test fails if the installed role isn't the pinned copy. Reading the code turned up two things Learn's page doesn't say. The role's default tag is different from the one Learn's table gives. And unless you turn it off, it sends a signal about your subscription, resource group, tenant and region back to Microsoft. The chapter follows the code, because that's what runs.

## Slide 7 — What the role leaves to you: owners and waves

Running the role offline, and reading it, shows what it leaves to you, starting with owners and waves. It connects whatever the inventory names, with no owner tags. It has no waves or batches, so one mistake reaches everything at once. It can't do a real dry run on a server without the agent; it wrongly decides the agent is installed, then fails. Passing your own tags silently drops its default that keeps database servers from auto-onboarding. And it sends that signal by default. Each gap gets a fix, and each is pinned by a test.

## Slide 8 — What the role leaves to you: cloud and record

The rest of the gaps are about the cloud and the record. The role's token is for commercial Resource Manager, which is right for this estate, so the role-based playbook refuses any other cloud, and a separate playbook handles Azure Government. The token is briefly visible on the server's command line; the chapter accepts that, since tokens are short-lived. Nothing checks the region against the cloud, nothing is written down, and Learn's setup installs whatever's newest. The verdict: use Microsoft's role, unchanged, and put the checks around it.

## Slide 9 — First, the patch_owner column

The first change is small but essential: a patch owner column in the configuration database export, right beside the configuration owner, with the onboarding wave after the region. The guide had named that field, but the sample export never carried it. Look at the server on Amazon's cloud: Ansible configures it and patches it, but it still goes to Arc, for inventory, assessment and Defender. Its patch owner tag says Ansible, so Update Manager assesses it and schedules nothing. And because this is a GCC estate, the sample now uses commercial regions.

## Slide 10 — The inventory: owners to groups and tags

The inventory script turns each owner into an Ansible group and an Azure tag, using the Arc track's spellings; the validation kit compares them without caring about case or punctuation. Three rules fail closed. An owner name it doesn't recognize stops the run, because a typo would quietly drop a server out of the group that protects it. A wave that isn't a number stops it. And a server is only a candidate if its record is complete and its tags are values Arc will accept. Otherwise it's blocked, with the reason written down.

## Slide 11 — The wave plan, written before anything runs

Before anything touches a server, the wave plan runs on the control node alone. You give it a wave number, and it writes down exactly what it intends: every ready server, every blocked one, the resource group, region, cloud, both owners and the exact tag string. It refuses to go on if there's no wave, if a region belongs to the other cloud, if a production server has slipped into a pilot wave, or if an owner is missing. Both onboarding playbooks start with this plan, so if the plan stops, no server is contacted at all.

## Slide 12 — Onboarding with Microsoft's role, gated

Now the onboarding itself. The role-based playbook works one wave at a time: a single canary server, then five percent, then a quarter, and it stops at the first failure. Each server is checked again before anything happens. Without an explicit confirmation flag, it never calls the role; it just prints what each server would get, which is the dry run the role can't do. With confirmation, it calls Microsoft's role unchanged, with the database's values and no stored secret, and writes a result file. The older step-by-step playbook stays for Azure Government.

## Slide 13 — Who runs it, and the least role that onboards

Who's involved? Platform engineers who run Ansible beside Arc, the developers who keep the inventory and playbooks, and the reviewers who read the plan before and the result after. The onboarding identity gets one narrow role: it can read and create Arc servers, but it can't delete them. There's a wrinkle: one Learn page says it can't manage extensions, another lists an add-extensions permission in it, so the chapter takes the stricter reading and removes the assignment when the wave closes. Disconnecting needs a different, stronger role.

## Slide 14 — Lab 1: the inventory, and the role's failed dry run

Lab 1 runs on a Linux control node with no subscription, and after setup every outbound request goes to a dead local proxy, so nothing can leave. Use a disposable node, because one step runs Microsoft's role as root against the node itself. First, look at what the database export becomes: four candidates, and the Amazon-hosted server tagged with Ansible for both owners. Then run Microsoft's role, unchanged, in check mode. It fails, and the verbose output shows why: check mode skipped the version check, so the role concluded the agent was already installed.

## Slide 15 — Lab 1: plan, dry-run and break the CMDB

Now the kit's own path. Plan wave zero, and it's ready: one server, with its exact tag string written to a file you can review. Dry-run the wave with the role-based playbook, and it prints what that server would get, including the restored database default, while the connect itself is skipped. Then break the export on purpose. Put a production server into the pilot wave, and the plan stops. Misspell a patch owner, and the inventory refuses. Clear one owner, and that server is blocked with its reason. Run the suite, and ninety tests pass.

## Slide 16 — Lab 2: one disposable server, connected for real

Lab 2 connects one disposable server for real, in a commercial test subscription in the GCC tenant, never production. The control node runs somewhere with a managed identity, so no secret is stored. Prepare a resource group, grant the onboarding role to that identity and nothing else, and describe the one server in a tiny export. Then the same three commands every wave uses: plan, dry run, connect. Check the agent says connected, the tags match the database, and the validation kit agrees. Then back it out in Learn's order, and file the records.

## Slide 17 — Dangers, and the guard for each

Each danger has a guard, and the theme is that the connect is irreversible enough to deserve care. Owners must be present and spelled right, or the server isn't a candidate. Patching has one owner, so Update Manager schedules only what it owns. Waves, a canary and a pilot that refuses production keep one mistake from reaching everything. The dry run must really be dry. The cloud must match the tenant. And defaults that send data or onboard databases become decisions on record. Finally, a managed identity means there's no stored secret to steal.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. Every tier one server in the export has both owners and a wave, or a ticket explaining why not. The cloud matches the tenant. The wave plan was reviewed and filed before the run, and the dry run matched it. The onboarding identity holds one narrow role, and the two risky defaults are decisions on record. The pilot ran on non-production servers for at least thirty days. Afterward, the tags in Azure match the database and the validation kit is clean. Next, Chapter 9: drift pipelines and evidence for the security officer. Thanks for watching.
