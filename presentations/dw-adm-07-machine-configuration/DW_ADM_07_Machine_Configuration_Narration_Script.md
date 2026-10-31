# Building the Attribute-Driven Migration, Chapter 07 — Machine Configuration Packages — narration script (practice copy)

## Slide 1 — Chapter 07: Machine Configuration Packages

Welcome to the Federal Modernization Workbook's developer workbook, Building the Attribute-Driven Migration. This is Chapter 7: machine configuration packages. Learn's cmdlets will build you a package and a policy definition, but nothing in them says whether this is the package you reviewed, whether it leaks details of the machine that built it, or whether it will reach servers another tool owns. That check is the pipeline's job. We'll follow Learn's procedure and Microsoft's sample, see what they leave out, then walk the build, two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — Why the build needs checks between Learn's steps

Why does a package need a pipeline around it? Because three questions go unanswered by Microsoft's tools. Is the package going out the one somebody reviewed? Does it carry details of the person and machine that built it, into a file every server can read? And will an enforcing policy reach servers that another tool is supposed to own? On the Arc track, every setting has exactly one owning tool, recorded in the configuration database and mirrored in a tag. For the settings machine configuration owns, the code is a desired state configuration, and Azure Policy delivers it.

## Slide 3 — Learn's model: package, definition, guest assignment

Here's Learn's model, in three parts. A package says what the machine should look like. A policy definition points at that package by its address and its hash. And when the definition is assigned, every machine in scope gets a guest assignment: the agent downloads the package, evaluates it and reports back. Each assignment is one of three types: audit only, apply once and report drift, or apply and keep correcting. The spelling is case sensitive, which will matter later. Custom content for audit and apply is generally available, with minimum agent versions on the slide.

## Slide 4 — Which cloud: endpoints, package access and cost

Which cloud matters here in three ways. The endpoints differ: servers in Azure Government reach a government machine configuration host, with regional endpoints in the US Gov regions. The way machines read the package matters: the build uses each machine's own system identity, because Learn says a user-assigned identity doesn't work for Arc-enabled servers. And cost: for Arc-enabled Windows servers with the right licensing, it's included, but that activation isn't offered in two of the US Gov regions, so plan to buy it there. This estate's servers report to commercial Azure.

## Slide 5 — What Learn gives you: the procedure, step by step

Learn documents the whole procedure, one page per step, and the build follows it exactly. You set up an authoring environment, write a desired state configuration and compile it. You package it, and test it with the same agent the servers run. You publish the package to storage, optionally sign it, and generate a policy definition that records the package's hash. Then you publish the definition to Azure. That's eight steps and eight commands, all on the slide. The build replaces none of them. What it adds goes between them.

## Slide 6 — Learn's three don'ts, and the pinned sample

Learn is clear about three things you must not do. Don't put secrets in a package. Don't exceed a hundred megabytes. And when you release a new version, give the package a new name but keep the same policy identifier, raise the version, and let the hash be recomputed; change only the address and the agent rejects it. The repository also pins Microsoft's sample project, with hashes a test checks. It's five years older than the module the chapter uses, and two things in it no longer hold, including a renamed cmdlet. Its compiled file still packages.

## Slide 7 — What the cmdlets leave to you: the package

Running Learn's commands offline shows what they don't do, and the first set of gaps is about the package itself. The compiled file records who built it, on which machine, and where, and that file goes to storage the whole fleet can read. Compiling twice gives different bytes, and so does packaging twice, so a reviewer can't tell a real change from noise, and a rebuilt package won't match the reviewed hash. Nothing scans for secrets. And module versions float. Each gap has a fix in the example, pinned by a test.

## Slide 8 — What the cmdlets leave to you: the definition

The second set of gaps is in the policy definition. The cmdlet accepts whatever identifier and version you give it, so a fresh identifier quietly creates a second definition instead of updating the first. An enforcing definition reaches every machine in scope, whoever owns the setting. The switch that includes Arc-enabled servers defaults to off, and nothing tells you. And Learn's storage token example lasts three years. The verdict is simple: Learn's procedure is the procedure, and the build replaces none of it. It cleans, checks and records in between the steps.

## Slide 9 — Where 4.12.0 differs from Learn's text

Running the current module also turned up a few places where it differs from Learn's text. The file names, a parameter's shape and the package contents aren't quite what Learn describes. The package works either way, and the test pins what the module actually does. The bigger one is a role. An enforcing definition grants its remediation identity a role named only by an identifier that Learn's built-in roles reference doesn't list. Microsoft's own role tables name it. So before relying on it, read the role in a test subscription and record what it can do.

## Slide 10 — The code and the release registry

So what does the example add? One configuration, which audits that old protocol versions are explicitly switched off on servers. It's audit only, and a server with no explicit setting counts as non-compliant, on purpose, because the baseline wants the setting on record. A module of checks, and a build script that runs the whole thing offline. The heart of it is the release registry: the reviewed record of what's in production. It fixes the policy identifier forever, the mode, the published version, the identity, and the owner tag that keeps other tools' servers out.

## Slide 11 — Clean the MOF, then check the package

The first thing the build adds is a cleaner. It rewrites the compiled file into one canonical form: it strips out who built it and when, keeps source references in the short form Microsoft's own sample uses, and sorts everything. Compile three times and you get three different files, but one cleaned file. A test confirms the cleaned file means the same thing to the desired state engine. Then the package check opens the zip in memory and applies seven rules, from its layout and size to secrets and module versions.

## Slide 12 — Check the definition, and record what shipped

Next the build checks the definition against the package and the registry, with nine rules. The one that catches the most is the hash check: an enforcing definition carries the package hash in four places, and every copy must match this exact package. So a hand edit or a rebuild fails here, not on a server. Then the build writes a provenance record. Notice there are two kinds of hash. The cleaned file's hash is reproducible, so a reviewer can rebuild and match it. The package hash identifies the bytes that shipped, so the security officer can match the published file.

## Slide 13 — Who writes baselines, who reviews, which roles

Who's this for? The developers and platform engineers who write server baselines for the Arc track, and the engineers and security officers who review them. You'll want to be comfortable in PowerShell and know what a desired state configuration is; the chapter covers the parts of Azure Policy you need. The roles are few and narrow. Publishing a definition needs the policy contributor role. Machines read the package with their own identity and a read-only storage role, never a token. And the remediation role is the one to confirm before you rely on it.

## Slide 14 — Lab 1: follow Learn by hand, and see the gaps

Lab 1 runs on a Windows laptop and never signs in, uploads or installs the agent. You save the pinned modules to a folder rather than installing them. Then you follow Learn's steps by hand: compile once, package twice, and you get two different hashes from the same file. Open the compiled file and you'll find your own user name, computer name and folder path. The checks catch exactly that. Then you run Microsoft's old sample with the current module: it still packages, its cmdlet has been renamed, and its published file is already clean.

## Slide 15 — Lab 1: the checked build, and breaking it

Now the checked build. It runs offline, passes, and gives one reminder: the switch for Arc-enabled servers defaults to off. Build it a second time and compare the two provenance records. The cleaned file's hash matches across builds; the package hashes don't. That's exactly why you publish the bytes you checked, and never rebuild. Then break it on purpose: reuse a version, mistype the mode's capital letter, or enforce without the owner tag, and each one fails for its own reason. Run the tests, and sixty-five pass.

## Slide 16 — Lab 2: a test subscription and a disposable server

Lab 2 needs a test subscription and a server you can throw away, because local testing changes the machine it runs on. First you test the package on that server: it should fail on a default build and pass once both settings are off. That's what proves the agent accepts the cleaned file. Then you upload the exact package from Lab 1, never a rebuild, and check its hash. Machines read it with their own identity. Publish, assign with Arc servers included, read the result, and back it all out, including any leftover guest assignments.

## Slide 17 — Dangers, and the guard for each

Every danger here has a guard, and they cluster around a few ideas. One owning tool per setting, enforced by a tag filter at build time and checked again after assignment. Never rebuild at release time: publish the bytes you checked, and match their hash. Keep build-host details and secrets out of the package. Use the machine's own identity rather than a long-lived token. Remember the Arc switch is off by default. And if signing is required, sign first, then generate the definition from the signed file, so the hash is the one that ships.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. The configuration and its registry entry arrive in the same pull request. The build used the pinned modules and found nothing. Anyone can rebuild the commit and match the cleaned file's hash. The package was tested on a throwaway server, and the published file's hash matches the record and the definition everywhere. No long-lived token, the owner tag filter on anything that enforces, Arc servers included where they belong, and the records filed as evidence. Next, Chapter 8 puts Ansible beside Arc. Thanks for watching.
