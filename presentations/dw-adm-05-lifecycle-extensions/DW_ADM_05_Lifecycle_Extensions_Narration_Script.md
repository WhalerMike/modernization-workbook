# Building the Attribute-Driven Migration, Chapter 05 — Lifecycle Workflows Custom Extensions — narration script (practice copy)

## Slide 1 — Chapter 05: Lifecycle Workflows Custom Extensions

Welcome to the Federal Modernization Workbook's developer workbook, Building the Attribute-Driven Migration. This is Chapter 5: Lifecycle Workflows custom extensions. A custom task extension hands a leaver, a joiner or a mover to code you wrote, and then waits for that code to say what happened. The chapter makes sure it always says, says the truth, and says it to the right cloud. We'll start from the Logic App definition Microsoft publishes, see what it leaves to you, walk the program's Logic App, registry and tools, then two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — Where the extensions sit, and Learn's contract

Why does this chapter matter? Book 03 splits the work: provisioning creates accounts, and Lifecycle Workflows act on accounts that already exist. The built-in tasks handle the account itself, but everything else in a leaver, the PIV credential, the devices, the servers, goes through a custom task extension, which is code you write. Book 03 also sets three rules: one reusable Logic App per integration, block the account first, and make custom tasks safe to repeat. Learn sets the contract on the other side: how the Logic App is started, how long the workflow waits, and how the answer comes back. Let's see where that runs.

## Slide 3 — Which cloud: Graph host, Azure Resource Manager, license

Now, which cloud. The callback goes to Microsoft Graph, and the host depends on the tenant: a GCC tenant like this estate's keeps the worldwide endpoint, while GCC High and DoD each have their own, and a token for one cloud won't work in another. The Logic App's side matters too. Learn documents the proof-of-possession policy only for commercial Azure. For Azure Government it gives nothing, so the builder refuses rather than guess. Licensing and availability are covered in all the US clouds, and the tenant limits are the same everywhere. Next, Microsoft's own sample.

## Slide 4 — Learn's Logic App definition, pinned and run

Here's what Microsoft gives you. The admin center can create an extension and a new Logic App together. For an existing Logic App, Learn publishes one workflow definition to paste in: a trigger that describes what Lifecycle Workflows sends, one callback action, and a gap in the middle labelled "add your logic here". That's Microsoft's only sample; a search found no template anywhere else. Because it lives only inside a web page, the repository pins the page with checked hashes, and a tiny interpreter runs the definition, unchanged, against fakes. So you see what it really does.

## Slide 5 — What it leaves to you: cloud, path and status

Running Learn's definition against the fakes shows what it gets right and what it leaves to you. It gets the identity right: no secret, just the Logic App's managed identity, and the program keeps that. But the callback is hard-wired to the worldwide cloud and the beta endpoint, so in GCC High or DoD it simply never arrives. It trusts whatever path it's handed, which means a forged payload could aim that identity's token anywhere. And it always says the work completed, even when the revocation failed. Each of those has a fix, pinned by a test.

## Slide 6 — What it leaves to you: failure, repeats and secrets

The second half of the gap table is about what happens once you add real work. If your added step fails, Learn's definition sends nothing, so the workflow sits there for the whole wait before it calls the task failed. There's no protection against doing the work twice. The subject's name, email and manager land in run history for anyone who can read it. The retries are implicit, and the authorization policy is typed by hand, with a placeholder value that would block every call. The program's definition closes each one.

## Slide 7 — The appid value, and the verdict

One row needs a word. The page prints a placeholder for the value that identifies Lifecycle Workflows as the caller, and copying it would block every call. The chapter traces the real value: the page's own bearer-token row, the page's history, Microsoft's token claims reference, and the docs repository's list of known values all point to the same identifier. The code uses it, a test pins it, and Lab 2 still checks it in the tenant. That leads to the verdict: keep Learn's shape and trigger, but don't run it as published for a leaver's credential revocation.

## Slide 8 — One Logic App per integration, in four steps

Now the program's code. There's one Logic App definition, and every integration deploys the same one; what changes is data, four parameters: the Graph host for the cloud, the downstream system and its audience, and which workflows it serves. Each run goes in four steps. First it checks the request, and if the callback path isn't the resume path for this very task, it stops and sends nothing at all. Then it looks up the operation, calls the downstream system with bounded retries, and always calls back, telling the truth about whether the work succeeded.

## Slide 9 — Idempotency, the callback path and the registry

Two ideas hold the design together. The first is idempotency. The key isn't a Microsoft feature; it's a promise the downstream system makes to do the work once per key. That matters because the same task can arrive twice: the extension may retry its call, a workflow can be rerun, and Book 03 resumes a partial leaver where it stopped. The second is the registry: one reviewed entry per integration, holding every value the deployment needs. Its extension settings have sensible defaults, and the builder refuses anything outside Learn's ranges.

## Slide 10 — Five commands, and Book 03's leaver order

The tooling is one script with five commands. Lint applies twelve rules to any definition, including Microsoft's, and one of them adds up every possible retry wait so the callback can't arrive after the workflow has given up. Run plays a definition against the fakes, with failures and repeat deliveries on demand. Build refuses to write anything while there's a finding. And the two checks compare what's really in the tenant with the registry, including Book 03's leaver order: block the account and revoke its tokens first, then run the custom task. A failed revocation shouldn't stop the cleanup after it.

## Slide 11 — Authorization, built from the registry and checked

Authorization is where hand-typed settings usually drift, so the builder writes it from the registry. On the Logic App, shared access signatures are switched off and Learn's proof-of-possession policy goes in with Learn's exact claims. On the extension, the code asks for proof-of-possession, following Learn's security guidance even though one example still shows the older bearer type. And the identity stays small: because the Logic App is an authorized app on the extension, it can call back with no Graph permission at all. The tenant-wide alternative is what Learn advises against. Now, who does this work?

## Slide 12 — Where Learn's pages disagree, and what the code does

Learn says several things differently on different pages, and the chapter writes each one down so nobody quietly loosens the code later. The wait range differs between pages, so the code takes the narrower one. The workflow limit differs, so the chapter plans for the lower one. Even the identifier for the custom task differs, within a single page. In each case the code picks the safer or better-supported reading, and where it matters, Lab 2 reads back what the tenant actually does. That's the end of the code. Now, who's involved.

## Slide 13 — Who builds it, approves it, and what it needs

Who is this for? Developers and identity engineers who build the integrations behind joiners, movers and leavers, and the reviewers who approve each one. You'll want to read JSON and Python, and you don't need a tenant until Lab 2. The roles are worth noticing. Creating an extension takes the Lifecycle Workflows administrator role plus a contributor role on the Logic App's resource group; the operator role isn't enough. The Logic App itself needs no Graph permission to call back, and its downstream access should be as narrow as the target allows.

## Slide 14 — Lab 1: Learn's definition, then the program's

Lab 1 needs only Python on a laptop: no tenant, no network. You start with Microsoft's definition. The linter finds eight problems, and when you run it for a GCC High tenant, the callback heads to the worldwide cloud and the task fails at the end of the wait. Switch the cloud to worldwide and it completes, which is exactly why the problem is easy to miss. Then the program's definition: a clean lint, and a GCC High run that survives two transient failures, does the work once, and calls back to the right cloud.

## Slide 15 — Lab 1: failures, the build and the read-backs

The second half of Lab 1 is about watching the guards work. Shorten the wait and the linter warns that retries could outlast it. Make the downstream fail every time, and the task is reported failed straight away instead of an hour later. Deliver the same task twice, and the work still happens once. Then build the deployment files, and watch the builder refuse when you point it at Azure Government. Break the leaver order in a fixture and the workflow check catches it. Finally, fifty-five tests pass. Remember, though: fakes aren't a tenant.

## Slide 16 — Lab 2: a test tenant, a real run, a failure drill

Lab 2 moves to a test tenant, never production. You let the admin center create the extension and Logic App the way Learn describes, then record exactly what it made and compare it with what the builder would have written; any difference is a finding against the builder. Then you swap in the program's definition, build a small leaver workflow in the right order, and run it for one fictional user. That run also confirms the real callback path. Finally, drill the failure: the task should fail within minutes, not an hour. Then back everything out.

## Slide 17 — Dangers, and the guard for each

Each of these dangers ends the same way: a leaver whose access isn't really gone, or a record that says it is. The quietest are the callback problems: no callback on failure, a callback that claims success, or one sent to the wrong cloud. Others are about trust: a forged payload, a broad permission, or a bearer-token extension left behind. And some are about order: doing the work twice, or running the custom task before the account is blocked. Notice the pattern again: each guard is a lint rule or a check that runs every time.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. Each integration has one reviewed registry entry, one Logic App and one identity, and the deployed pieces came from the builder with a clean lint. The extension uses proof-of-possession and waits for an answer; shared access signatures are off; and the callback host matches the tenant's cloud, which for this estate means the worldwide endpoint. Then the proofs: a repeat delivery did the work once, a forced failure reported back within minutes, and every leaver blocks the account first. Next, Chapter 6 moves Group Policy as code. Thanks for watching.
