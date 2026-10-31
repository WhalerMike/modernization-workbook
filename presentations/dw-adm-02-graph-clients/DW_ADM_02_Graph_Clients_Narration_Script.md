# Building the Attribute-Driven Migration, Chapter 02 — Graph Clients for the Government Clouds — narration script (practice copy)

## Slide 1 — Chapter 02: Graph Clients for the Government Clouds

Welcome to the Federal Modernization Workbook's developer workbook, Building the Attribute-Driven Migration. This is Chapter 2: Graph clients for the government clouds. Every piece of code in this workbook that calls Microsoft Graph should follow one pattern: know which cloud it's in, send its token nowhere else, ask for no more than each call needs, and keep working when Graph says slow down or a beta API changes. We'll sort out which cloud is which, run Microsoft's own snippets to see what they leave out, walk the client's rules, then two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — Why one client pattern, and why it comes first

Why does this chapter matter so much? Because every other chapter's code talks to Graph or to Azure, and a client that gets the cloud wrong, or asks for too much, carries that mistake into everything built on it. So the goal is a client that reaches the right cloud, asks for the right token, makes only the calls it declares, and pages and retries the way Microsoft says to. Just as important, for each rule in the code you should be able to say whether it's Microsoft's contract, Microsoft's sample, or the program's own design. Let's start with the clouds.

## Slide 3 — Which cloud is which: four clouds, two sets of hosts

Get this right first, because every other rule depends on it. A GCC Moderate tenant uses the worldwide endpoints, the same as a commercial tenant: Learn says so plainly. GCC was built when Microsoft had one cloud directory, and it still uses that commercial directory. It's GCC High and the Department of Defense cloud that have their own hosts, for tokens, for Graph and for Resource Manager. And a token from one cloud simply doesn't work in another. The slide maps all four clouds, including the PowerShell environment names you'll pass.

## Slide 4 — What GCC with commercial Azure means for the code

The target estate for this migration is Microsoft 365 GCC with commercial Azure, so let's make that concrete. Nothing in its configuration is a dot-u-s host. A run that reads both Graph and Resource Manager needs two tokens, because one token request can only name one resource. The code still calls the cloud "gcc" by name, even though it resolves to the worldwide endpoints, so the evidence says what was intended. And watch for a second tenant: if a workload ever lands in an Azure Government subscription, it has its own hosts, and the run has to be told, never guess.

## Slide 5 — The clients this chapter is the reference for

This chapter is the reference for clients that already exist. Chapters 1, 3 and 4 were written first, and each has its own Graph client that follows part of the pattern. They name the clouds two different ways: the program's short names, and Learn's PowerShell environment names. That's fine, because the table maps one to the other. What isn't fine is a default. A cloud name a client doesn't recognize has to stop the run, because quietly falling back to worldwide is exactly how a government run ends up talking to the wrong service.

## Slide 6 — Microsoft's national cloud snippets, pinned

Here's what Microsoft gives you. Learn's page on national clouds for the Graph SDKs names the three things a client has to change per cloud: where it gets its token, where Graph lives, and any scope that names the Graph host. Its example connects to GCC High. Other Learn pages cover paging and throttling. The Python examples live in Microsoft's snippets repository, so the workbook pins an unmodified copy of the two files it uses, with a hash a test checks. A test then runs them against stand-ins that record exactly what they'd sign in to, without signing in to anything.

## Slide 7 — What the snippets leave to you: cloud and credentials

Running the snippets against the stand-ins shows what they leave to you, and the first half is about cloud and credentials. The surprise is the Python credential: on the same page where the other languages set the government authority, the Python example doesn't, and Python's identity library defaults to the public cloud. Copy it for GCC High and the app signs in to the wrong cloud. There's also nothing for the Department of Defense cloud, a certificate snippet that hard-codes the worldwide scope, and a client secret, which is just a password in a file.

## Slide 8 — What they leave to you: permissions, paging, beta

The second half is about running safely. The snippets have no Resource Manager endpoints at all. Nothing ties a call to the permission it needs, though Learn asks for the least privileged permission for each one. There's no paging in the Python snippets, the SDK won't retry throttled items inside a batch, and there's nothing about beta. So the verdict: use Learn's page as the model for the three things that change per cloud, add the authority, and for background jobs use the hardened client, because a reviewer will ask which calls, with which permissions, in which cloud.

## Slide 9 — One table of endpoints, and every call declared

Now the code itself. Everything about a cloud comes from one table: ask for a cloud by name and you get its token authority, its Graph host and its Resource Manager host, and anything else is an error. The client won't send its token to any other host. Then there's the call list, one entry per Graph call, with the least privileged permission from the API page and the tasks that use it. Two rules follow: a task can make only its own calls, and its permissions are exactly the union of those calls. Add one without the other, and the build fails.

## Slide 10 — The token check before a live run

The third rule is the token check, and it runs before a live job makes a single call. An app-only token lists its application permissions in one claim, so the Python client reads it from its own token. If a permission is missing, the run stops. If there's one the task doesn't use, it warns, because an unused permission is still exposure. PowerShell is trickier, since the Graph SDK signs in for you and never hands over the token. It turns out the session's context reports the same permissions, read from the same claim, so the module checks that instead.

## Slide 11 — Paging and throttling the way Learn documents

Paging and throttling are where clients quietly break. When Graph returns a next link, the client follows it to the end, and it sends the same headers on every page, because Learn says they aren't carried forward by default, and an advanced query changes without them. When Graph says slow down, the client waits as long as it's told. When it isn't told, which really happens for Conditional Access, it backs off, with a cap. It also marks its requests as low priority, so background reads give way to people. And inside a batch, it retries throttled items itself.

## Slide 12 — Beta without depending on it

Beta APIs can change or disappear, and Learn says not to use them in production. But sometimes the only place a property lives is beta, like the Autopilot status this workbook needs. So beta calls must be declared, they're read through a wrapper that turns a missing shape into "not evaluated" rather than a failed run, and the stage is always in the output. The Autopilot case also shows two Learn pages disagreeing about the government clouds. The code follows the stricter one, because an API that answers isn't a feature you can use.

## Slide 13 — Who builds it, who reviews it, and what it may hold

Who is this for? Developers who build any code in this workbook that calls Graph or Resource Manager, and the reviewers who approve it. You'll want to read Python or PowerShell, and know what an access token is; you don't need a tenant until the second lab. The reviewer's question is always the same: which calls, with which permissions, in which cloud. The call list answers it. And the app registration itself is part of the answer: exactly the task's permissions, a certificate or a managed identity, never a secret, registered in the tenant's own cloud.

## Slide 14 — Lab 1: Learn's snippets, the endpoints, the call list

Lab 1 needs only a laptop, with Python and PowerShell, and no tenant. First you run Microsoft's own snippets against the stand-ins, and read the test that proves the Python credential gets no authority. Then you print the endpoints for this estate, and see that nothing for GCC is a dot-u-s host, and that a misspelled cloud name is an error, not a default. Then you list a task's permissions from its calls, and try a call the task never declared. It's refused before anything is sent.

## Slide 15 — Lab 1: beta, PowerShell, and the test suites

The rest of the lab covers beta and PowerShell. Ask for Autopilot in GCC High and the client makes no call at all: it reports not available, with the reason and the stage. Then you run the same rules in PowerShell: an undeclared beta call is refused, and so is a worldwide address from a GCC High session, which won't get the token. Finally you run both suites, seventy Python tests and forty-four in Pester, and you've seen every row of the gap table for yourself, with no module, tenant or network.

## Slide 16 — Lab 2: a test tenant and one permission

Lab 2 moves to a test tenant, never production, with fictional data. It uses the Conditional Access export because it needs just one permission. You register the app in the tenant's own cloud, with a certificate, grant that one permission, and run the task. Then you watch the token check do its job: grant an extra permission and you get a warning, leave one out and the run stops before any call. Finally, point it at the wrong cloud on purpose. Sign-in goes to the government authority, which doesn't hold a GCC tenant, so it fails closed.

## Slide 17 — Dangers, and the guard for each

Each of these dangers has a guard in the code. The two that bite this estate first are treating GCC as a government dot-u-s cloud, and a cloud name that silently defaults to worldwide. The most dangerous is a token sent to the wrong host, so every address, on every page, is checked. Others creep in slowly: permissions the job doesn't need, a call added without its permission, or a beta property renamed overnight. And the subtlest is an API that answers where the feature isn't offered, handing you a clean, empty, and wrong result.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. On the cloud side: an explicit cloud name that fails on anything unknown, no government hosts in the GCC configuration, the right authority and scope for every credential, one token per resource, and the token never leaving the cloud's Graph host. On the run side: every call declared with its least privileged permission, an app that holds exactly those, paging and retries done Microsoft's way, and beta declared and labeled. Next, Chapter 3 uses these rules to write a validation kit check. Thanks for watching.
