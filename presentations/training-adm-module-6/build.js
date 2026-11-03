// Attribute-Driven Migration learning path, Module 6: Onboard servers with Ansible beside Arc — the module's narrated deck.
// Teaches docs/training/attribute-driven-migration/06-ansible-beside-arc.md, Learn-style: objectives, the concepts, "Try it"
// slides with the Lab 1 commands and their expected results, Lab 2, the federal requirement and evidence, a two-question
// check, and the summary. Lab 1 needs a Linux control node and Ansible collections from Galaxy, so its results are
// Chapter 08's Lab 1 text, not re-run, as the learning path's verification log records; the two checks that run on
// Windows (the pytest suite and the 'updatemanager' copy) were re-run November 3, 2026 in a scratch copy of examples.
// Every fact comes from the module page, the learning path's verification log, Book 19 Chapter 08, or the kit
// (examples/ansible); the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-adm-module-6/build.js \
//                      presentations/training-adm-module-6/Training_ADM_Module_6.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 6: Onboard servers with Ansible beside Arc",
  footer: "Federal Modernization Workbook  ·  Attribute-Driven Migration learning path, Module 6: Ansible beside Arc",
});
const { D, HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
D.pres.title = "Attribute-Driven Migration learning path — Module 6: Onboard servers with Ansible beside Arc";
const OUT = process.argv[2] || "Training_ADM_Module_6.pptx";
const M = "Training, Attribute-Driven Migration, Module 6";

// The title slide, as shared.js draws it, with this path's name over the units.
const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "ATTRIBUTE-DRIVEN MIGRATION LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...units.map((u, k) => ({ text: u, options: { color: k % 2 ? HEX.teal : HEX.navy, bold: true, fontSize: 15, breakLine: k < units.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.65, paraSpaceAfter: 2 });
  return s;
};

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";
const LAB = "TRY IT  ·  LAB 1, EXPECTED RESULTS FROM CHAPTER 08'S LAB 1 TEXT (NOT RE-RUN)";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 6: Onboard servers with Ansible beside Arc", "Attribute-Driven Migration learning path · Guide Gates 5 and 8, with Book 19 Chapter 08",
    ["One owner for configuration, one for patching  ·  What Microsoft's role leaves to you", "The inventory  ·  The wave plan  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 6 of the Attribute-Driven Migration learning path: onboard servers with Ansible beside Arc. This module serves Gates 5 and 8 of the implementation guide, and takes Chapter 08 of Building the Attribute-Driven Migration. You'll onboard one wave of servers to Azure Arc with Microsoft's role, from a CMDB export, with every server tagged with the tool that owns its settings and the tool that patches it. And you'll write a plan a reviewer reads before anything runs. The lab reads the CMDB into groups and tags, runs Microsoft's role in check mode, plans a wave, dry-runs it, and breaks the CMDB on purpose, all offline. The code is illustrative: tested against fixtures, not against a production estate.`,
  `${M} — Unit 1 "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why the onboarding run is where owners are read");
  tag(s, "Why");
  const b = table(s, "Gates", 1.45, [3.0, 9.15], ["Where", "What it says about a server"], [
    ["Gate 5", "An Arc server's tags are its attributes, drawn from the asset record at onboarding"],
    ["Gate 8", "Each wave is a query: servers by resource group and tag"],
    ["Microsoft's azure_arc role", "Connects whatever hosts the inventory names, with no waves and no dry run without the agent"],
  ], { fontSize: 13.5, limit: 4.0 });
  callout(s, "Point", b + 0.35, 0.95, "FaUserShield", HEX.red, "The gap: ",
    "the tags are written once, at the connect. A server connected without them is open to whichever tool reaches it first.");
  sources(s, "Sources: Module 6, Unit 1; the implementation guide's Gates 5 and 8; Microsoft Learn, \"Connect machines to Azure Arc at scale with Ansible.\"");
  notes(s,
`Why does this matter? In this workbook's implementation guide, Gate 5's server convention says an Arc server's tags are its attributes, drawn from the asset record at onboarding. Gate 8 writes each wave as a query: servers by resource group and tag. Microsoft's azure arc role, which Microsoft Learn documents in Connect machines to Azure Arc at scale with Ansible, connects whatever hosts the inventory names, with no waves, and with no dry run on a server that doesn't have the agent. And the tags are written once, at the connect, from the CMDB. In this workbook's reading, that makes the onboarding run the place where owners are read, checked and carried. A server connected without them is open to whichever tool reaches it first. In this module you read the CMDB into groups and tags, plan a wave, and see what each server would get before anything is contacted.`,
  `${M} — Unit 1 "Introduction"; Book 19, Chapter 08 — "Where Ansible sits beside Arc."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 6", [
    "Explain why each server records one configuration owner and one patch owner, and where each tag is read",
    "Describe what Microsoft's azure_arc role leaves to you",
    "Run the CMDB inventory, and say what makes it stop",
    "Plan a wave and read the plan, before anything runs",
    "Explain why the role can't dry-run a server without the agent, and what the playbook does instead",
  ], [
    "Module 5: its enforcing definitions filter on the ConfigOwner tag",
    "A disposable Linux control node or WSL: Python 3.10+, ansible-core, ansible-lint, yamllint, pytest",
    "Step 3 runs Microsoft's role as root against the control node",
  ], 45);
  sources(s, "Sources: Module 6, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about forty-five minutes with the lab. You'll explain why each server records one configuration owner and one patch owner, and where each tag is read. You'll describe what Microsoft's azure arc role leaves to you. You'll run the CMDB inventory, and say what makes it stop. You'll plan a wave and read the plan, before anything runs. And you'll explain why the role can't dry-run a server without the agent, and what the playbook does instead. Before you start, finish Module 5: its enforcing definitions filter on the Config Owner tag this module writes. Lab 1 needs a disposable Linux control node, or WSL, with Python 3.10 or later, ansible core, ansible lint, yamllint and pytest. Step three runs Microsoft's role as root against the control node itself.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites"; learning path index — "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 Owners
{
  const s = content(SC, "One owner for configuration, one for patching");
  tag(s, "What");
  const b = table(s, "Own", 1.45, [2.6, 2.6, 6.95], ["CMDB column", "Arc tag", "Who reads it"], [
    ["config_owner", "ConfigOwner", "Machine configuration's enforcing definitions: it changes only the servers it owns"],
    ["patch_owner", "PatchOwner", "Update Manager's dynamic scopes, evaluated at each scheduled run, so a scope follows the tag"],
  ], { fontSize: 13, limit: 3.3 });
  panel(s, "Aws", 0.6, b + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "THE GUIDE'S CASE: AWS01", "A Red Hat server on AWS that Ansible configures and patches", [
    "It still goes to Arc, for inventory, assessment and Defender, with PatchOwner=Ansible",
    "So Update Manager assesses it and schedules nothing (design guidance)",
    "After the fact, VK-ARC-07 reports an enforcing assignment on a server machine configuration doesn't own",
  ], 13);
  sources(s, "Sources: Module 6, Unit 2; Microsoft Learn, \"About dynamic scoping\" (Azure Update Manager); this workbook's Arc track and Ansible guides (design guidance).");
  notes(s,
`This workbook's guidance gives every setting one owning tool. The CMDB records it for each asset as config owner, and the workbook's Arc track guide mirrors it to the Config Owner tag. Patching has one owner too: a patch owner column, mirrored to the Patch Owner tag. Arc doesn't change who owns what. It makes the server an Azure resource, and the tags tell the Azure tools which servers are theirs. The kit's enforcing machine configuration definitions filter on Config Owner, so machine configuration changes only the servers it owns. Microsoft Learn's page, About dynamic scoping, for Azure Update Manager, says dynamic scopes group machines by tags and are evaluated at each scheduled run, so a scope on Patch Owner follows the tag. Take aws oh one, a Red Hat server on AWS that Ansible configures and patches. It still goes to Arc, with Patch Owner set to Ansible, so, in this workbook's guidance, Update Manager assesses it and schedules nothing. And afterward, the kit's check V K ARC oh seven reports any server machine configuration doesn't own that carries its enforcing assignment.`,
  `${M} — Unit 2 "One owner for configuration, one for patching"; Book 19, Chapter 08 — "Where Ansible sits beside Arc," "First, the patch_owner column."`);
}

// ================================================================== 5 Which Azure
{
  const s = content(SC, "Which Azure a GCC estate's servers go to");
  tag(s, "What");
  const l = panel(s, "Gcc", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "A MICROSOFT 365 GCC ESTATE", "Commercial Azure", [
    "Office 365 GCC uses Microsoft Entra Public",
    "An Azure Government subscription can't be associated with a directory there",
    "So the agent connects with --cloud AzureCloud, the default",
  ], 13);
  const r = panel(s, "High", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "GCC HIGH AND DOD", "Azure Government", [
    "Microsoft Entra Government and AzureUSGovernment",
    "US Gov regions, and the .us endpoints",
    "02_arc_onboarding.yml handles Azure Government",
  ], 13);
  callout(s, "Cloud", Math.max(l, r) + 0.3, 0.95, "FaTriangleExclamation", HEX.amber, "Guarded both ways: ",
    "the wave plan stops a region from the other cloud, and the role's playbook refuses any cloud but AzureCloud.");
  sources(s, "Sources: Module 6, Unit 2; Microsoft Learn: \"Planning identity for Azure Government applications,\" \"azcmagent connect,\" \"Connected Machine agent network requirements.\"");
  notes(s,
`One more piece of the setting: which Azure. The estate this workbook plans for is a Microsoft 365 GCC tenant. Microsoft Learn's page, Planning identity for Azure Government applications, says Office 365 GCC uses Microsoft Entra Public, and an Azure Government subscription can't be associated with a directory there. So a GCC estate's Arc servers go to a commercial subscription, and, as Learn's azcmagent connect reference shows, the agent connects with the AzureCloud cloud, which is the default. GCC High and DoD tenants are different: the same Learn pages, with the Connected Machine agent network requirements, give Microsoft Entra Government and Azure Government, with US Gov regions and the dot us endpoints. The kit guards this both ways. The wave plan stops a server whose region belongs to the other cloud, and the playbook that uses Microsoft's role refuses any cloud but AzureCloud. For Azure Government, the kit's other onboarding playbook, oh two, spells the steps out.`,
  `${M} — Unit 2; Book 19, Chapter 08 — "Where Ansible sits beside Arc" (Which Azure); "What it leaves to you."`);
}

// ================================================================== 6 What the role leaves
{
  const s = content(SC, "What Microsoft's azure_arc role leaves to you");
  tag(s, "What");
  const b = table(s, "Gaps", 1.45, [4.6, 7.55], ["Microsoft's role, on its own", "What examples/ansible adds"], [
    ["Connects whatever hosts the inventory names", "Reads both owners, refuses an unknown tool, writes ConfigOwner and PatchOwner"],
    ["No waves or batches", "arc_wave; one canary, then 5, then 25 percent; waves 0 and 1 refuse production"],
    ["Can't run in check mode without the agent", "Doesn't call the role without confirm_change=true; prints what each server would get"],
    ["Sends a signal with subscription, group, tenant, region", "arc_role_log_enabled: false (design guidance)"],
    ["Leaves no record of what was planned or connected", "A plan (JSON and CSV) before the run; a result with each resource ID after"],
    ["Learn's requirements.yml installs the latest", "Pins azure.azcollection 4.2.0; the installed role must match the pinned copy"],
  ], { fontSize: 12, limit: 5.4 });
  callout(s, "Verdict", b + 0.25, 0.95, "FaListCheck", HEX.navy, "The verdict: ",
    "use Microsoft's role. The kit calls it unchanged, and adds what goes in, the dry run, the batch size and the record.");
  sources(s, "Sources: Module 6, Unit 2; Microsoft Learn, \"Connect machines to Azure Arc at scale with Ansible\"; the azure_arc role, ansible-collections/azure v4.2.0 (pinned).");
  notes(s,
`Microsoft Learn's page, Connect machines to Azure Arc at scale with Ansible, documents onboarding through the Azure Arc onboarding role in the azure az collection. It installs the Connected Machine agent and registers each host. The repository keeps a pinned copy of the role's code, from the ansible collections azure repository at the four point two point oh release. Running it offline, and reading its code, shows what it leaves to you. It connects whatever hosts the inventory names; the kit reads both owners and writes them into the tags. It has no waves; the kit adds a wave column, one canary server, then five, then twenty-five percent, and keeps production out of waves zero and one. It can't run in check mode on a server without the agent; the kit's playbook doesn't call it without a confirm flag. The role's code sends a signal with the subscription and tenant by default, which Learn's page doesn't mention; the kit turns that off. And it leaves no record, and the requirements file on Learn's page installs the latest version. The verdict, which is this workbook's: use Microsoft's role, unchanged, and add what sits around it.`,
  `${M} — Unit 2; Book 19, Chapter 08 — "What Learn gives you," "The pinned copy," "What it leaves to you."`);
}

// ================================================================== 7 Inventory
{
  const s = content(SC, "The inventory: owners become groups and tags");
  tag(s, "What");
  const b = table(s, "Inv", 1.45, [4.0, 3.1, 5.05], ["CMDB value", "Group", "Tag"], [
    ["config_owner = arc_machine_configuration, ansible, ...", "config_owner_<value>", "ConfigOwner = ArcMachineConfiguration, Ansible, ..."],
    ["patch_owner = update_manager, ansible, ...", "patch_owner_<value>", "PatchOwner = UpdateManager, Ansible, ..."],
    ["Either empty, or none, on tier 1 or 2", "config_owner_missing, ...", "None: a CM-8 finding, never a target"],
    ["arc_wave = 0, 1, ...", "arc_wave_<n>", "None"],
  ], { fontSize: 12, limit: 4.3 });
  panel(s, "Closed", 0.6, b + 0.25, 12.15, null, HEX.red, HEX.redTint, "THREE RULES FAIL CLOSED", null, [
    "An owner value it doesn't know stops it: updatemanager would make a group nothing reads",
    "A wave that isn't a number stops it",
    "A candidate needs both owners, a group, a region, a wave and valid tags, or goes to arc_onboarding_blocked",
  ], 13);
  sources(s, "Sources: Module 6, Unit 3; the kit's examples/ansible/inventory/cmdb_inventory.py; NIST SP 800-53 CM-8; Microsoft Learn, \"azcmagent connect.\"");
  notes(s,
`The kit's CMDB inventory script turns each owner into a group and a tag. A config owner of arc machine configuration, Ansible, Intune and so on becomes a group, and a Config Owner tag in the spelling of this workbook's Arc track guide. The patch owner works the same way. An empty owner on a tier one or two record goes to a missing group, which is a finding under NIST special publication eight hundred fifty-three control CM-8, inventory, never a target. And the wave becomes a wave group. Three rules fail closed. An owner value the script doesn't know stops it. A typo like update manager written as one word would otherwise create a group nothing reads, and drop the server out of the group that protects it. A wave that isn't a number stops it. And a server is a candidate only if its record has both owners, a resource group, a region, a wave, and tag values Arc accepts; Learn's azcmagent connect reference takes the tags as one comma-delimited list. Otherwise it's blocked, with the reasons recorded. All three are the kit's design.`,
  `${M} — Unit 3 "The inventory and the wave plan"; Knowledge check answer 1; Book 19, Chapter 08 — "The inventory."`);
}

// ================================================================== 8 Wave plan
{
  const s = content(SC, "The wave plan, and onboarding in check mode");
  tag(s, "What");
  const l = panel(s, "Plan", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "05_ARC_WAVE_PLAN.YML", "Runs only on the control node; it stops on", [
    "No wave given, or a wave with no ready server",
    "A cloud that isn't AzureCloud or AzureUSGovernment, or a region from the other cloud",
    "A production server in wave 0 or 1",
    "A server with no config_owner or patch_owner",
  ], 13);
  const r = panel(s, "Role", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "06_ARC_ONBOARDING_ROLE.YML", "Imports the plan first", [
    "Without confirm_change=true: check mode, and the role isn't called",
    "Each server prints what it would get",
    "With it: the role runs with the CMDB's values, auth_source msi",
  ], 13);
  callout(s, "Stop", Math.max(l, r) + 0.3, 0.85, "FaFileShield", HEX.navy, "If the plan stops, ",
    "no server is contacted. It writes arc-wave-N-plan-<time>.json and .csv under reports/.");
  sources(s, "Sources: Module 6, Unit 3; the kit's playbooks 05 and 06; Ansible documentation, \"Controlling playbook execution: strategies and more.\"");
  notes(s,
`The kit's wave plan playbook runs only on the control node. You give it a wave number. It lists the wave's ready servers and the ones the CMDB blocked, and writes a JSON and a CSV plan under reports: host, configuration item, environment, resource group, region, cloud, both owners, the exact tag string and a state. It stops when no wave is given or the wave has no ready server, when the cloud is wrong or a region belongs to the other cloud, when a production server is planned in wave zero or one, which this workbook's Arc track keeps for non-production, and when a server has no owner. Both onboarding playbooks import it as their first play, so if the plan stops, no server is contacted. The playbook that uses Microsoft's role runs in batches, one canary server, then five, then twenty-five percent, with the batch keywords the Ansible documentation describes. It's in check mode unless you set confirm change to true. Then the role isn't called, and each server prints what it would get. With the flag, the role runs with the CMDB's values, authenticating with the managed identity.`,
  `${M} — Unit 3; Book 19, Chapter 08 — "The wave plan," "Onboarding with Microsoft's role."`);
}
endModule(SC);

// ================================================================== 9 Try it: inventory and role
{
  const s = content(SL, "Try it: see what the CMDB becomes, then run the role");
  tag(s, "How");
  const c = code(s, "Inv", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 to 3, in examples/ansible on a disposable Linux control node",
    "$ ansible-galaxy collection install -r requirements.yml   # from a reviewed source; azure.azcollection 4.2.0",
    "$ export HTTPS_PROXY=http://127.0.0.1:9 HTTP_PROXY=http://127.0.0.1:9 ...   # every request to a dead proxy",
    "$ ansible-inventory --graph arc_onboarding_candidates",
    "-> Four candidates: app02, aws01, web01, win01",
    "$ ansible-inventory --graph patch_owner_ansible",
    "-> aix01, aws01, lab01, rtr01 and sol01",
    "$ ansible-inventory --host aws01.contoso.example",
    "-> arc_tags carry ConfigOwner: Ansible and PatchOwner: Ansible",
    "$ ansible-playbook -i localhost, -c local --check tests/fixtures/microsoft_role_check.yml",
    "-> Fails at Get azcmagent status: No such file or directory: b'azcmagent' (ok=8, failed=1, skipped=19, exit 2)",
    "$ ansible-playbook -i localhost, -c local --check -v tests/fixtures/microsoft_role_check.yml",
    "-> Set azcmagent installed fact shows azure_arc_azcmagent_installed: true",
  ], { label: LAB, pt: 10 });
  line(s, "Read", "Check mode skipped the version check, so the role decided the agent is installed: the dry run it can't do.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 6, \"Exercise: Lab 1,\" steps 1 to 3; Book 19, Ch 08, Lab 1; verification log, claim 6.");
  notes(s,
`Try it. Lab 1 runs in the ansible folder of the examples, on a disposable Linux control node. Nothing signs in to Azure or contacts a server. Step one installs the pinned collections from a reviewed source, and then points every outbound request at a dead local proxy. The results on these slides are the chapter's Lab 1 text: the authors didn't re-run the Ansible steps for this path, because they download from Galaxy and need a Linux control node. Step two shows what the CMDB becomes: four candidates, app oh two, aws oh one, web oh one and win oh one, and five servers Ansible patches. Aws oh one's tags carry both owners as Ansible. Step three runs Microsoft's role, unchanged, in check mode. It fails at Get azcmagent status, because there's no agent. Run it again verbose, and it shows the agent installed fact as true, because check mode skipped the version check. That's the dry run the role can't do.`,
  `${M} — Unit 4 "Exercise: Lab 1 (offline, no subscription)," steps 1 to 3; Book 19, Chapter 08 — "Lab 1"; verification log, claim 6.`);
}

// ================================================================== 10 Try it: plan and dry run
{
  const s = content(SL, "Try it: plan wave 0, then dry-run it");
  tag(s, "How");
  const c = code(s, "Plan", 0.6, 1.45, 12.15, [
    "# Step 4: plan wave 0, and show the newest plan",
    "$ ansible-playbook playbooks/05_arc_wave_plan.yml -e onboarding_wave=0",
    "-> Wave 0 is ready: 1 to connect, 0 blocked in the CMDB.",
    "$ cat \"$(ls -t reports/arc-wave-0-plan-*.csv | head -n 1)\"",
    "-> One row: web01.contoso.example, rg-arc-portal-dev, westus2, AzureCloud, state ready, with the tags",
    "   CmdbCi=CI0001003,ConfigOwner=ArcMachineConfiguration,Environment=nonproduction,Location=dc-west,",
    "   Owner=team-portal,PatchGroup=PG-TUE-2200,PatchOwner=UpdateManager",
    "# Step 5: dry-run the wave with Microsoft's role",
    "$ ansible-playbook playbooks/06_arc_onboarding_role.yml -e onboarding_wave=0",
    "-> Exit 0. Would connect web01.contoso.example to AzureCloud, resource group rg-arc-portal-dev,",
    "   region westus2, authenticating with msi; Connect with Microsoft's role is skipped",
  ], { label: LAB, pt: 10.5 });
  line(s, "Read", "web01 doesn't exist, and nothing tried to reach it. The plan is what a reviewer reads before anything runs.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 6, \"Exercise: Lab 1,\" steps 4 and 5; Book 19, Ch 08, Lab 1; examples/ansible/inventory/sample/cmdb_export.csv.");
  notes(s,
`Step four plans wave zero. The playbook says wave zero is ready: one server to connect, none blocked in the CMDB. Show the newest wave zero plan, and it has one row: web oh one, in the portal dev resource group, in West US 2, in AzureCloud, state ready, with the exact tag string the connect would write. Look at the tags: the configuration item, Config Owner set to machine configuration, the environment, the location, the owning team, the patch group, and Patch Owner set to Update Manager. That's the plan a reviewer reads and files before anything runs. Step five dry-runs the wave with Microsoft's role. It exits zero. Web oh one reports that it would connect to AzureCloud, in that resource group and region, authenticating with the managed identity, and the connect task is skipped. Web oh one doesn't exist, and nothing tried to reach it.`,
  `${M} — Unit 4 "Exercise: Lab 1 (offline, no subscription)," steps 4 and 5; Book 19, Chapter 08 — "Lab 1."`);
}

// ================================================================== 11 Try it: break
{
  const s = content(SL, "Try it: break the CMDB on purpose, run the tests");
  tag(s, "How");
  const c = code(s, "Break", 0.6, 1.45, 12.15, [
    "# Step 6, in copies of the export: production in the pilot",
    "$ CMDB_CSV=/tmp/prod-in-pilot.csv ansible-playbook playbooks/05_arc_wave_plan.yml -e onboarding_wave=0",
    "-> Wave 0 isn't ready: web01.contoso.example. (exit 2; production server in non-production wave 0)",
    "# An owner typo: re-run on Windows, November 3, 2026",
    "$ CMDB_CSV=/tmp/typo.csv python3 inventory/cmdb_inventory.py --list",
    "cmdb_inventory: line 3: unknown patch_owner 'updatemanager' (known: ansible, configuration_manager, ...)",
    "(exit code 1)",
    "# app02 with no patch_owner, in wave 2",
    "$ CMDB_CSV=/tmp/no-owner.csv ansible-playbook playbooks/05_arc_wave_plan.yml -e onboarding_wave=2",
    "-> Wave 2 is ready: 1 to connect, 1 blocked in the CMDB. (win01 ready; app02 blocked, no patch_owner)",
    "# Step 7: the tests; on Windows, re-run November 3, 2026",
    "$ python -m pytest examples/ansible/tests",
    "74 passed, 16 skipped",
  ], { label: "TRY IT  ·  LAB 1: \"->\" LINES FROM CHAPTER 08'S TEXT; THE TYPO AND PYTEST RE-RUN TODAY", pt: 10 });
  line(s, "Root", "On the control node, bash tests/run_all.sh: yamllint, ansible-lint, six playbooks' syntax, and 90 tests as root.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 6, \"Exercise: Lab 1,\" steps 6 and 7; verification log, claim 6; Book 19, Ch 08, Lab 1.");
  notes(s,
`Step six breaks the CMDB on purpose, in copies of the export. First, mark web oh one as production. Wave zero stops: it isn't ready, with exit code two, and the plan says production server in non-production wave zero. Second, write update manager as one word in a server's patch owner. The inventory exits one: line three, unknown patch owner. We re-ran that one on Windows today, and it printed exactly that, with the list of known owners. Third, clear app oh two's patch owner and plan wave two. The wave is still ready, with one to connect and one blocked: win oh one is ready, and app oh two is blocked, with no patch owner. Step seven runs the tests. On the control node, the test script runs yamllint, ansible lint, a syntax check of six playbooks, and ninety tests as root. On Windows, the Python suite gave seventy-four passed and sixteen skipped, re-run today.`,
  `${M} — Unit 4 "Exercise: Lab 1 (offline, no subscription)," steps 6 and 7; verification log, claim 6.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: connect one disposable server");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A commercial test subscription in the GCC tenant, a Linux server you can rebuild, never production"],
    ["The control node", "A managed identity, with Azure Connected Machine Onboarding on the test resource group and nothing else"],
    ["The CMDB", "Write a one-server CMDB export for the disposable server"],
    ["Run and check", "Plan, dry-run and connect it; check that its tags equal the CMDB's"],
    ["Back it out", "In Learn's order: remove extensions, disconnect, uninstall the agent, remove the role assignment"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "NotRun", b + 0.3, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "follow Book 19, Chapter 08, Lab 2, step by step.");
  sources(s, "Sources: Module 6, Unit 5; Microsoft Learn: \"Connect machines to Azure Arc at scale with Ansible,\" \"azcmagent disconnect,\" \"Uninstall the Azure Connected Machine agent.\"");
  notes(s,
`Lab 2 connects one real server. You need a commercial test subscription in the GCC tenant, a Linux server you can rebuild, never production, and a control node with a managed identity. Create a test resource group, and grant the control node's managed identity the Azure Connected Machine Onboarding role on it, and nothing else; that's the role Microsoft Learn's Ansible onboarding page names. Write a one-server CMDB export for the disposable server. Then plan, dry-run and connect it, and check that its tags equal the CMDB's. To back it out, follow the order in Learn's pages on azcmagent disconnect and on uninstalling the agent: remove any extensions, disconnect with an identity that may delete the resource, because the onboarding role can't, uninstall the agent, and remove the role assignment. The authors haven't run Lab 2. Follow Chapter 08's Lab 2, step by step.`,
  `${M} — Unit 5 "Exercise: Lab 2 (your test subscription)"; Book 19, Chapter 08 — "Lab 2."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 6");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [4.3, 2.6, 5.25], ["Requirement", "KSI", "Evidence the ISSO keeps"], [
    ["CM-8 Inventory: both owners become groups and tags", "KSI-PIY-GIV", "The CMDB export"],
    ["CM-3; CM-4: the wave is planned before it runs", "KSI-CMT-LMC", "The wave plan JSON and CSV, with the change record"],
    ["CM-3(2): the dry run contacts nothing", "KSI-CMT-VTD", "The change record"],
    ["CM-8; CM-3: production in the pilot, bad owners stop", "KSI-PIY-GIV; KSI-CMT-VTD", "The plan, and the CMDB ticket for the missing owner"],
    ["SR-3; SA-10: the pinned collections", "KSI-SCR-MIT", "requirements.yml and snapshot.json"],
    ["AC-6; IA-5: one role, one group, managed identity (Lab 2)", "KSI-IAM-ELP; KSI-IAM-SNU", "The Azure role assignment record"],
    ["CM-8(1); CA-7: connected, tags equal (Lab 2)", "KSI-PIY-GIV; KSI-MLA-EVC", "The result file, VK-ARC-01 and VK-ARC-07"],
  ], { fontSize: 11.5, limit: 5.9 });
  line(s, "KSI", "KSIs are FedRAMP 20x indicators for providers; the agency lines its evidence up with them (design guidance).", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 6, Unit 1; NIST SP 800-53 (the SP 800-53B Moderate baseline); FedRAMP, \"Key Security Indicators.\"");
  notes(s,
`The federal requirement. Onboarding to Arc writes each server's owners into Azure from the CMDB, so the plan, the result and the tags are inventory and change evidence. The controls are NIST special publication eight hundred fifty-three's. The CMDB export supports system component inventory, CM-8. The wave plan, filed with the change record, supports change control and impact analysis. The dry run that contacts nothing supports testing a change before it's made. The stops for production in the pilot and for unknown or missing owners leave the plan, and a CMDB ticket for the missing owner. The pinned collections leave the requirements file and the snapshot. And Lab 2 adds the role assignment record, for least privilege, and the result file with V K ARC oh one and oh seven, showing the server is connected and its tags equal the CMDB's. The KSI column is FedRAMP's Key Security Indicators, the FedRAMP 20x indicators for cloud service providers. Which output supports which control is this workbook's reading.`,
  `${M} — Unit 1 "Introduction" (Chapter 08's requirements, KSIs and evidence); Unit 7 "Summary."`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on onboarding", [
    { q: "Microsoft's role runs in check mode on a host without the agent. What happens?", options: ["a. It reports exactly what it would change", "b. It fails at Get azcmagent status, and with the version check skipped it decides the agent is installed", "c. It installs the agent"] },
    { q: "The wave 0 plan finds a production server. What happens?", options: ["a. The server is connected with a warning", "b. The plan stops, and no server is contacted: waves 0 and 1 are for non-production", "c. The server moves to wave 2"] },
  ], "1 b: the dry run the role can't do (step 3 of the lab). 2 b: the plan stops before any server is contacted (step 6).");
  sources(s, "Sources: Module 6, Unit 6 \"Knowledge check,\" questions 2 and 3, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: Microsoft's role runs in check mode on a host without the agent. What happens? The answer is b: it fails at Get azcmagent status, and with the version check skipped, it decides the agent is installed. That's why the kit's playbook doesn't call the role at all without the confirm flag, and prints what each server would get instead. Second: the wave zero plan finds a production server. What happens? The answer is b: the plan stops, and no server is contacted, because waves zero and one are for non-production. You saw that in step six of the lab. The module page has two more questions, on the owner typo and on the confirm flag, each linked to the section that answers it.`,
  `${M} — Unit 6 "Knowledge check," questions 2 and 3; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary, and next: Module 7, Lifecycle Workflows");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Read the CMDB into groups and tags with both owners",
    "Planned a wave a reviewer can read before anything runs",
    "Saw the dry run Microsoft's role can't do",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 7: Extend Lifecycle Workflows", [
    "A custom task extension",
    "A callback in the right cloud",
    "Block before revoke",
  ], 13.5);
  callout(s, "Before", Math.max(l, r) + 0.3, 0.85, "FaListCheck", HEX.teal, "Before shipping: ",
    "work through the Chapter 08 checklist in Book 19.");
  sources(s, "Sources: Module 6, Unit 7 \"Summary\"; Module 7, \"Unit 1: Introduction.\"");
  notes(s,
`To sum up. You read the CMDB into groups and tags with both owners, planned a wave a reviewer can read before anything runs, and saw the dry run Microsoft's role can't do. The evidence an ISSO keeps: the CMDB export, each wave's plan and result files with the change record, the requirements file and the snapshot, and, from Lab 2, the role assignment record, V K ARC oh one and oh seven, and the back-out record. Gate 8's per-wave evidence is in the guide. Before shipping, work through the Chapter 08 checklist. Next is Module 7: extend Lifecycle Workflows. You'll see why Learn's Logic App definition costs a GCC High leaver, and run the definition that calls back in the right cloud, reports honestly, and checks that the leaver blocks before the custom task runs.`,
  `${M} — Unit 7 "Summary"; Module 7 — "Unit 1: Introduction."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 6 deck", [
  "Module page: docs/training/attribute-driven-migration/06-ansible-beside-arc.md (Attribute-Driven Migration learning path, Module 6): Units 1 to 7, Lab 1, Lab 2, knowledge check and summary. The learning path index: prerequisites and what you need for the labs.",
  "What the module links for the design: Book 19, Chapter 08 \"Where Ansible sits beside Arc,\" \"What it leaves to you,\" \"First, the patch_owner column,\" \"The inventory,\" \"The wave plan,\" \"Onboarding with Microsoft's role,\" Lab 1, Lab 2, Checklist; the implementation guide's Gates 5 and 8.",
  "Kit: examples/ansible (inventory/cmdb_inventory.py; inventory/sample/cmdb_export.csv; playbooks/05_arc_wave_plan.yml, 06_arc_onboarding_role.yml; requirements.yml; tests). Fictional servers. Illustrative: tested against fixtures, not against a production estate.",
  "Lab results: Chapter 08's Lab 1 text, not re-run (it installs collections from Galaxy and needs a Linux control node), as the verification log's claim 6 records. Re-run November 3, 2026 on Windows with Python 3.14.3 in a scratch copy: the 'updatemanager' copy (exit 1) and pytest (74 passed, 16 skipped). Lab 2 not run by the authors.",
]);

finish(OUT);
