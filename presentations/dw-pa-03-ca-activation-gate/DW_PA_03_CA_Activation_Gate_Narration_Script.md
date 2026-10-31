# Building Privileged Access, Chapter 03 — Conditional Access and the Activation Gate — narration script (practice copy)

## Slide 1 — Chapter 03: Conditional Access and the Activation Gate

Welcome to the Federal Modernization Workbook's developer workbook, Building Privileged Access. This is Chapter 3: Conditional Access for administrators, and the activation gate. These policies are the program's first writes to a tenant, so they're files a reviewer reads, and the code that writes them does nothing until it's told to. We'll start from Microsoft's own template for administrators, see what it leaves out, then walk the files, the pre-merge check, the plan and the dry run, two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — The first writes to a tenant: what Book 04 asks

Why does this chapter matter so much? Because it's the first time the program writes to a tenant. Book 04 gives it three things to build: the administrator policy set, the gate that demands a fresh phishing-resistant proof from a compliant device at the moment someone elevates, and the custom authentication strength both rely on. Unlike the first two chapters, this code can change things. So its design is cautious on purpose: it writes only when told, creates every new policy in report-only, enforces only with a separate switch, and never deletes.

## Slide 3 — Learn sets the order: the gate before PIM selects it

Learn sets the order, and getting it wrong leaves no gate at all. You create and switch on the policy for the authentication context first, and only then select that context in PIM. If no policy targets it, PIM falls back to asking for multifactor sign-in, but that fallback doesn't happen when the policy is off or only reporting. And if you also scope the policy to a directory role, it never applies, because at activation the person doesn't hold the role yet. So this chapter builds the gate, and leaves selecting it to Chapter 4.

## Slide 4 — Which cloud: Graph v1.0 on the worldwide host

Next, which cloud. Every call in this chapter is on the stable Graph version, except protected actions, which is beta. For this estate's GCC tenant the host is the worldwide Graph endpoint, and every method used lists the government clouds in its availability table. Conditional Access and PIM are available in the government clouds too. One thing does change there: the two policies about Azure management name a different application, so a GCC High program edits those two files. The code never assumes a cloud; you name it.

## Slide 5 — Microsoft's template for administrators, pinned

Microsoft's starting point is its policy templates. The protect-administrators group includes one requiring phishing-resistant sign-in for administrators, and its Learn page is the procedure: at least fourteen roles, exclude the emergency accounts, use the built-in phishing-resistant strength, and start in report-only. The same templates come back from Graph as policy definitions, and that's the only administrator policy Microsoft publishes on Learn in that form. So the repository pins the page unmodified, checks its hashes, and converts the template without fixing anything, then checks it like any other file.

## Slide 6 — What the template misses: roles, strength, IDs

This is the heart of the chapter: what happens if you create Microsoft's template exactly as published. The targeting is good, so it's kept as the model. But the published example lists only two roles where Learn's own procedure wants fourteen. It grants plain multifactor sign-in instead of the phishing-resistant strength, and the two can't be combined. And it excludes a line of display text where an object identifier belongs, which the admin center would replace for you, but a script won't. Each of these is pinned by a test.

## Slide 7 — What the template misses: exclusion, state, gate

The rest of the gaps are the dangerous ones. The template doesn't exclude the emergency access group, and those accounts must stay out of every policy that blocks or restricts sign-in. It carries no state, so nothing tells you to start in report-only. It has no authentication context, so the activation gate isn't there at all. And it's just a read: nothing compares it with the tenant, so a policy edited in the portal drifts unseen. The verdict: keep the template's targeting as the model, and never create it as published.

## Slide 8 — The code and the policy files

Now the code. This chapter adds its own module, its own call list, an entry script, and the policy files themselves, one file per object, as Book 04 asks. There are the two authentication contexts, the custom strength, the five administrator policies, and the two gate policies, one for activation and one for protected actions. The activation gate demands the strength and a compliant device, every single time. Placeholders resolve from a per-tenant map, except the strength, which is looked up by name in the tenant, so a policy can never point at a strength that isn't there.

## Slide 9 — The pre-merge check: PA-CA-01 to PA-CA-09

Before anything merges, Test-PaCaRepository reads the files, and only the files, in the pull request pipeline. The nine rules are on the slide. Most come from Learn: exclude the emergency group, don't scope the gate to a role, don't mix plain multifactor with a strength, cover the fourteen roles, and keep context identifiers in the stricter range. A few are the program's own design, like refusing display text where an identifier belongs. On the repository as merged, the check passes with five warnings, and they're deliberate: the rollout hasn't switched those policies on yet.

## Slide 10 — Report-only policies and the emergency exclusion

One rule needs a closer look, because the sources don't line up. Learn says report-only policies don't block anyone, so they don't need the emergency exclusion. Book 04's pre-merge check is stricter, and fails any report-only file without it, even the probe that's meant to exclude nobody. The chapter's finding is that the stricter rule isn't wrong, just stricter. So the code puts the exclusion in every file whatever its state, because enforcing a file means changing one word. Only a named report-only instrument may skip it, and it fails the moment someone enables it.

## Slide 11 — The plan, the dry run and the writes

Here's how a change actually reaches the tenant. The code reads the tenant's policies, contexts and strengths, then compares each file with what's there, property by property, but only the properties the file sets, so the noise Graph returns doesn't look like a change. It plans in Learn's order, the contexts and strength before the policies that use them. Every plan line gets an action, and nothing is ever deleted. Without the apply switch, it can't send a write at all. With it, it still refuses if the check found a problem or a policy lacks the emergency exclusion.

## Slide 12 — Where Learn's pages differ, recorded

The chapter keeps a short record of where Learn's pages don't agree, so a later edit doesn't quietly loosen the code. The biggest is the every-time sign-in frequency: the Graph reference doesn't list it for this use, but the PIM pages say to use it, so the file follows PIM and the lab confirms Graph accepts it. Context identifiers follow the stricter of two ranges. And protected actions, called a preview in the outline, carry no preview label on Learn, but their Graph assignment is beta only, so the code defines the context and stops there.

## Slide 13 — Who builds it, who reviews it, what it may do

Who is this for? Developers build it, and identity engineers and the I S S O's review every Conditional Access change it makes. The permissions split cleanly into two tasks. Reading needs three read permissions, and the code picks narrower ones than the obvious broad choice. Applying adds exactly two write permissions, and nothing else. Learn notes a known issue that may ask for more consent on create, and the test-tenant lab records whether it does. A test keeps each task's permissions equal to the calls it makes.

## Slide 14 — Lab 1: check the template and the files offline

Lab 1 needs only a laptop: PowerShell 7 and Pester, no tenant. You run the tests on Microsoft's template as published, list the permissions for reading and for applying, and run the pre-merge check on the repository's own files. It passes with the five expected warnings; a real finding would fail the pipeline. Then the revealing step: run the same check on Microsoft's template. It comes back with two findings and two warnings, the missing emergency exclusion, the display text, the plain multifactor grant, and twelve of the fourteen roles missing.

## Slide 15 — Lab 1: plan, dry run, and three applies to the fake

Next you plan against a fictional tenant without sending anything. The plan explains itself: the context and strength get created, two objects get small updates, one matches, and three policies are blocked, because the strength and context they need don't exist yet. A portal-made policy is reported, never deleted. Then you apply to the fake three times. The first run creates the building blocks, the second creates the three blocked policies in report-only, and the third finds nothing to do. That's what a safe, repeatable write looks like.

## Slide 16 — Lab 2: a test tenant, report-only, then the gate

Lab 2 moves to a test tenant, never production, and it's careful about order. Build Chapter 2's emergency accounts first, and register phishing-resistant methods for your test administrators before anything is enforced, because Learn warns you can lock yourself out. Then write your map, register a read-only app, and read the plan. Add the write permissions and apply: every new policy lands in report-only. Watch the results for at least a week. Then enforce the gate on its own, in a separate change. Backing out means turning policies off, never deleting.

## Slide 17 — Dangers, and the guard for each

Every danger here has a guard, and the theme is that nothing important depends on someone remembering. The worst is enforcing a policy before the emergency accounts work, which is the same lockout as Chapter 2, just by a different route. The quietest is selecting the gate in PIM while its policy is still report-only: you get no gate and no fallback either. Others are about speed and reach: switching policies straight on, a pipeline that deletes, and a write permission left lying on the app after the change is done.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. On the file side: the check runs on every pull request with no findings, every file carries the emergency exclusion, the administrator policy covers all fourteen roles, and the activation gate is switched on before anyone selects it. On the run side: every plan was read as a dry run first, every new policy landed in report-only, each enforcement was its own reviewed change, and only the pipeline holds write access. Next, Chapter 4 builds PIM for Microsoft Entra roles as code, and selects this gate. Thanks for watching.
