# Building Non-Person Identity, Chapter 04 — App Policies and Certificate Rotation — narration script (practice copy)

## Slide 1 — Chapter 04: App Policies and Certificate Rotation

Welcome to the Federal Modernization Workbook's developer workbook, Building Non-Person Identity. This is Chapter 4: app management policies and certificate rotation. The chapter does two jobs. It holds the tenant's rules for app credentials in a reviewed file that can be compared and applied without ever loosening, and it rotates app certificates through Key Vault, with an owner's approval and an overlap. We'll start from Microsoft's own samples, see what they leave out, then walk the code, the labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — Why a reviewed policy and a planned rotation

Why does this chapter matter? Because both of its subjects fail quietly. A tenant policy that someone set once in the portal can't be reviewed or compared, so nobody notices when it drifts. And a certificate that nobody rotates is simply an outage waiting for its date. So the chapter turns the policy into a reviewed file, compared with the tenant and applied through a path that can only tighten it. And it turns rotation into a plan: raised early, approved by an owner, renewed, overlapped, and only then cleaned up. Let's see where it runs.

## Slide 3 — Which cloud: Graph and Key Vault hosts

Next, which cloud. This chapter talks to two services, so it needs two hosts. The policy and application calls go to Microsoft Graph, and for a GCC tenant like this estate's, that's the worldwide Graph endpoint. The certificates live in Key Vault, and because GCC's estate uses commercial Azure, the vault sits on the commercial vault domain. GCC High and DoD have their own hosts for both, and every policy page the chapter calls lists the US Government clouds. The code never guesses: you pass the cloud, and it builds both hosts from it.

## Slide 4 — What an app management policy is

Before the code, the model. Learn describes two kinds of policy. There's one tenant default, which always exists and starts switched off, with separate restrictions for apps that live in the tenant and apps provisioned from elsewhere. And there are app-specific policies, one per app at most, which override the default for whatever they define. Restrictions only bite on apps created after a date you choose, and they never stop an existing app from getting tokens. They just refuse the change that breaks them. Beta adds more restriction types, but this chapter stays on version one.

## Slide 5 — The program's rules: policy, lock, license, rotation

Here are the program's own rules, and most of them are labeled design guidance. New apps can't use secrets, and their certificates are capped at a hundred and eighty days, set on both object types because the admin center expects them to match. An app that truly can't use a certificate gets a time-limited exception with a record. Older apps get a year while they're fixed. Every registered app gets the property lock. No extra license is needed. And rotation joins Key Vault, which can renew a certificate, to the app registration, which renews nothing on its own.

## Slide 6 — Microsoft's samples, pinned and sent to fakes

Here's what Microsoft gives you: five Learn sources that, between them, hold the whole procedure. There's the request that turns on the tenant default, the pair that create and assign an app policy, Learn's configuration walkthrough, the request that adds a certificate to an app, and the Key Vault examples. Those samples only live inside web pages, so the repository pins their sources, unmodified and hashed, with a weekly watch for changes. Then a harness sends each request, exactly as written, to a fake Graph. That's how you find out what each one really does.

## Slide 7 — What the policy samples leave to you

This is where the samples get interesting, because run as published, several of them would hurt you. The tenant update's start dates reach back years, so it would refuse the next normal certificate on an old app. Its body isn't even strict. Learn's own procedure updates only two restrictions, and since an update replaces the whole collection, anything it forgets is silently switched off. The assignment sample sends a placeholder, and the tutorial uses a property version one refuses. The code keeps the good shape and fixes each of these, and a test pins every row.

## Slide 8 — What the certificate and Key Vault samples leave

The certificate samples have a sharper problem. Learn's first example for adding a certificate replaces every certificate the app had, so the old one vanishes the instant the new one lands, with no overlap at all. The Key Vault example asks for six months, which is just over the cap. And none of the samples ever puts the renewed certificate on the app, asks the owner, or removes the old one. So the verdict is: keep the version one requests as models for the writes, and don't run any of them as published.

## Slide 9 — The code and the inputs it reads

So what does the code add? One module, two scripts that only read, and a single separate script that can write. What drives it is a handful of small files, each with a clear keeper. Identity engineering owns the reviewed policy file and the rotation settings, like how early to raise and how long to overlap. Application owners keep three simple records: which vault holds each app's certificate, who approved each rotation, and who confirmed the workload signs in with the new one. Every rotation carries one request ID from start to finish.

## Slide 10 — The policy: compare, merge, plan

Here's how the policy side works. The code reads the tenant's default, every app policy and what it's assigned to, and each app's lock. Then it compares, restriction by restriction, on both object types. Where the tenant is weaker, it adds the program's rule. Where the tenant is already stricter, or holds something the file doesn't mention, it keeps the tenant's. That merged body is the key: an update can never drop or loosen anything. The plan then turns the diff, the exceptions and the locks into actions, and nothing in it writes.

## Slide 11 — Rotation: one step per certificate

Rotation works the same way: read everything, then give each certificate exactly one next step. A certificate far from expiry is left alone. One that's due waits for an owner's approval, and an approval only counts if it's recent and from an enabled owner. Approved, it's renewed in Key Vault using the vault's own policy. The new certificate is attached beside the old one, the owner confirms the workload uses it, a week of overlap runs, and only then does the old one go. Secrets aren't rotated at all. They're flagged for replacement.

## Slide 12 — The separate write path, and what it refuses

Only one script in this chapter can write, and it's built to say no. It won't run a plan unless the plan's hash matches the one a reviewer approved, and the plan is for this tenant, this cloud, and less than a week old. Every request body is checked against what's allowed: the policy can't loosen, an attach adds exactly one certificate, and the Key Vault request can't change the vault's policy. Just before each write, it re-reads the target and skips anything that changed. And a live run is always a signed-in person, never an unattended app.

## Slide 13 — Who builds, runs, approves and reviews

Who is this for? Four groups. Developers build it. Identity engineers run it and keep the reviewed files. Application owners approve each rotation and confirm their workloads still sign in. And the I S S Os review the evidence. The permissions are split cleanly: the reads hold only read permissions, and anything that writes is delegated to a signed-in person. That matters, because an unattended app with permission to update every application could add a credential to all of them. Microsoft does offer a self-rolling key option, but it skips the owner's approval.

## Slide 14 — Lab 1: the samples, then the policy plan

Lab 1 needs only a laptop, PowerShell 7 and Pester. First you send Microsoft's samples to the fakes, and the tests show what you'd otherwise take on trust, including Learn's own update quietly dropping a restriction. Then you compare the policy and build its plan. It finds six restrictions to add, one to change, and one to keep exactly as the tenant has it. You dry-run the plan, apply it to the fake, and then try a hash nobody approved. The script refuses. Next, the rotation half.

## Slide 15 — Lab 1: the rotation plan, applied to the fake

The rotation plan is where the design becomes concrete. Each fictional app is at a different point in its life. One is due and freshly approved, so it's renewed in Key Vault. One was already renewed by the vault, so the new certificate is attached beside the old. One has been verified and has finished its overlap, so its old certificate goes. And three apps still use secrets, which are flagged for replacement. Apply it to the fake, run the full suite, and five hundred thirteen tests pass.

## Slide 16 — Lab 2: a test tenant and a test key vault

Lab 2 moves to a test tenant and a test vault, never production, and it's built to answer the open questions the chapter couldn't settle from documentation alone. You read and plan with read-only rights, keep the policy as it was before, then apply as a signed-in administrator and check the admin center agrees. You try to break the policy on purpose. Then you carry one certificate through a full rotation, recording what Graph and Key Vault actually return. Finally, because this code never loosens a policy, a person backs it out.

## Slide 17 — Dangers, and the guard for each

Each of these dangers has a guard in the code, not a reminder in a runbook. The most dangerous is the quiet one: an update that forgets a restriction and switches it off, so the writer re-reads the live policy and refuses anything looser. A retroactive start date breaks rotations on the very day they're due. A certificate that replaces the old one takes the workload down. And an unattended app that can update every application is a standing risk, so writes are always a signed-in person. Notice the pattern: each guard runs every time.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. On the policy side: a reviewed file with an approved effective date, the tenant default matching it on both object types with no warning in the admin center, every app policy accounted for, every exception dated, and every registered app locked. On the rotation side: every certificate bound to a vault, every rotation approved and overlapped, every plan approved by someone other than the person who applied it, and the pinned samples still the ones you reviewed. Next, Chapter 5 replaces those flagged secrets with federation and managed identities. Thanks for watching.
