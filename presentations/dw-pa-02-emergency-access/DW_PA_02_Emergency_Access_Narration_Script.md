# Building Privileged Access, Chapter 02 — Emergency Access Accounts as Code — narration script (practice copy)

## Slide 1 — Chapter 02: Emergency Access Accounts as Code

Welcome to the Federal Modernization Workbook's developer workbook, Building Privileged Access. This is Chapter 2: emergency access accounts as code. These accounts are the one standing privilege the program keeps on purpose, so the chapter checks them on every run and watches them every minute, with code someone reviewed. We'll start from Microsoft's own emergency access page, see what its sample alert misses, then walk the check, the alert, two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures rather than a live tenant.

## Slide 2 — Why the emergency accounts come first

Why start here? Because the order matters. If approval for privileged roles is switched on before working emergency accounts exist, you can lock everyone out: every administrator role is eligible, approval is required, and nobody is left to approve. That's the documented lockout, and it's why Book 04 makes this step the one that can't move. The emergency accounts are also the program's main exception to zero standing access. The inventory in Chapter 1 lets them through only because they're listed as exceptions. This chapter makes sure that exception is real.

## Slide 3 — Which cloud: Graph host, alert subscription, methods

Next, which cloud. The check reads Microsoft Graph, and the host depends on the tenant. For a GCC tenant like this estate's, that's the worldwide Graph endpoint, and the alert sits in Azure Monitor in a commercial subscription. The template the code writes names no host, so the same file could deploy in Azure Government for GCC High, although the chapter flags that full availability there wasn't confirmed. And the two sign-in methods Learn wants for these accounts, passkeys and certificate-based authentication, are available in every one of these clouds.

## Slide 4 — Microsoft's standard for emergency access accounts

Here's what Microsoft gives you. Learn's emergency access page is the standard: at least two cloud-only accounts on the onmicrosoft domain, strong phishing-resistant sign-in that's different from your everyday admins, Global Administrator held permanently, and exclusion from blocking policies through one dedicated group. Then you have to run them: watch their logs, and test them at least every ninety days. Book 04 adopts the same standard and adds two things of its own: dual custody, and a review after every use.

## Slide 5 — Learn's sample alert, pinned and run offline

Learn also gives you a sample alert: three short queries over the sign-in logs, and portal steps to turn them into an alert rule where any result fires. Those queries only exist inside the web page, so the repository pins the page's source, unmodified, with a hash a test checks, and a weekly watch that reports when Microsoft changes it. A small harness then runs the sample's filters over a handful of fictional log rows, so you can see exactly what the sample catches and what it misses. It's a test, not a query engine.

## Slide 6 — What the sample misses, and what the code adds

This is the heart of the chapter. Run as published, the sample watches only one of the three places an emergency account shows up. It misses the non-interactive sign-in, which is exactly what a stolen session looks like, and Learn notes that passkey sign-ins now land there too. It misses the audit events, like a new method quietly registered on the account. And if you copy it with its placeholders, it alerts on nothing. So the verdict is: keep Learn's object-ID query and its alert settings as the core, and let the code add the rest.

## Slide 7 — The code: four commands and two input files

So what does the code add? Four commands and an entry script, added to the module from Chapter 1. One checks the accounts against the standard. One writes the alert query from the account IDs. One wraps that query in a deployable template, without deploying it. And one runs the same match over exported rows, so you can review a drill offline. Two small files drive it: one names the accounts and their exclusion group by object ID, and one records every drill. It reuses Chapter 1's reader, so it only ever reads.

## Slide 8 — The check: ten rules, PA-EA-01 to PA-EA-10

Here are the ten rules the check applies on every run. Most come straight from Learn's standard: enough accounts, the right domain, cloud-only, Global Administrator held permanently and directly, the right sign-in methods, membership in the exclusion group, and a passing drill in the last ninety days. Two are the program's own design, and they're labeled that way: a disabled emergency account is a finding, and so is anyone in the exclusion group who isn't an emergency account, because everyone in that group skips every policy. The full wording is on the slide.

## Slide 9 — Every enforced policy, and where the sources differ

One rule needs a closer look. Learn says to exclude the emergency accounts from policies that block or restrict sign-in. Deciding which policies do that is a judgment, and the code shouldn't make judgments, so it checks every enforced policy instead. The sources also disagree in two places, and the chapter records both so nobody quietly loosens the code later. Report-only policies are reported as information, not failures. And whether the accounts belong to individuals is something Graph can't see, so the program's position stays Book 04's.

## Slide 10 — The alert: three legs and a reviewed template

Now the alert. The query has three legs: interactive sign-ins, non-interactive sign-ins, and audit events where an emergency account is the actor or the target. It deliberately doesn't use a fuzzy union, because if a table never arrives, a fuzzy union returns nothing, and silence looks like safety. The template keeps Learn's settings, severity zero and any result fires, and checks that it points at a real workspace and action group. It deploys nothing; that's the reviewed pipeline's job. And remember the two prerequisites: the logs have to be sent, and the license has to be there.

## Slide 11 — Who builds it, who runs it, what it may read

Who is this for? Three groups. Developers build it. The identity engineers own the accounts, the exclusion group and the record of every drill. And security operations receive the alert, and hear about each drill before it happens. The reader app gets six Graph permissions, each the least privileged for its call, and nothing more. Two of those choices are worth noticing: reading whether an account is enabled or synchronized needs the full user read permission, because those properties aren't in the basic profile.

## Slide 12 — Lab 1: run Learn's queries and the check offline

Lab 1 needs nothing but a laptop: PowerShell 7 and Pester, no tenant and no network. First you run Learn's own queries over the fictional export, and the tests show what you'd otherwise have to take on trust: of five emergency events, the sample finds two. Then you list the six permissions, and run the check against a fictional tenant. It reports nine findings, no warnings and one informational item, and it writes the alert template for review. Next, let's read those findings.

## Slide 13 — Lab 1: reading the findings and the guards

Reading the findings is where the rules become real. One fictional account passes. The other fails five different ways, from the wrong domain to an expiring Global Administrator assignment. Three enforced policies don't exclude the accounts, and someone who shouldn't be there is sitting in the exclusion group. Then the offline match finds all five emergency events, where the sample found two, and ignores an ordinary user's sign-in. Finally you try to feed it a user name instead of an ID, and it refuses. Run the whole suite, and three hundred thirty tests pass.

## Slide 14 — Lab 2: a test tenant, a real query, a drill

Lab 2 moves to a test tenant, never production. You send the three log categories to a test workspace, register a reader app with exactly the six permissions, and run the check for real. Then the important step: paste the query into the workspace and run it by hand, because an error that names a table tells you the logs aren't arriving. After that you deploy the reviewed template, sign in once with a test emergency account, and watch the alert land. Record the drill, and the ninety-day finding clears. Then back everything out.

## Slide 15 — Dangers, and the guard for each

Every one of these dangers has happened somewhere, and each has a guard in the code. The worst is the lockout, and the guard is simply that this check is the gate's test, on every run. The quietest is a fuzzy query over a table that never arrives: nothing fires, and silence looks like safety. Others are slower: an assignment that expires, a phone method tied to one person, an exclusion group that grows, or a drill nobody wrote down. Notice the pattern. Each guard is a rule that runs every time, not a person remembering.

## Slide 16 — Done when: the chapter's checklist

Here's what done looks like. On the account side: at least two accounts named by ID, no findings, every enforced policy excluding a group that holds only those accounts, and a recorded drill in the last ninety days. On the alert side: the logs arrive, the query runs cleanly, the deployed rule matches the reviewed template, the reader holds exactly six permissions, and the pinned Learn page is still the one you reviewed. With the emergency accounts proven, Chapter 3 can safely build Conditional Access for administrators. Thanks for watching.
