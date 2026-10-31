# Building Non-Person Identity, Chapter 05 — Workload Federation and Managed Identities — narration script (practice copy)

## Slide 1 — Chapter 05: Workload Federation and Managed Identities

Welcome to the Federal Modernization Workbook's developer workbook, Building Non-Person Identity. This is Chapter 5: workload identity federation and managed identities. It's where service accounts actually get converted: a managed identity first, then a federated credential, then a certificate, with a thirty-day parallel run before the old account is disabled. We'll start from Microsoft's own samples, see what they accept in silence, then walk the checks, the token exchange test, the plan and its write path, two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — Why the token exchange test comes first

Why does this chapter exist? Because of one quiet failure. A federated credential with the wrong subject is created without any error. Nothing complains until the day the workload tries to exchange its token, and for GitHub, Learn says even that fails without an error. The plan's risk register names exactly this, and its answer is to test every exchange before the parallel run starts. That test is the center of the chapter. The order of conversion comes from Book 2: managed identities where the host is in Azure, federated credentials where the host speaks O I D C, certificates only where neither works.

## Slide 3 — Which cloud: Graph, Resource Manager, sign-in

Next, which cloud. This chapter talks to three hosts: Microsoft Graph for app registrations and sign-ins, Resource Manager for managed identities, and the sign-in host for tokens. The estate is a G C C tenant with commercial Azure, so all three are the worldwide endpoints. G C C High and the Defense Department clouds have their own hosts, and the code switches only for those. One gap worth knowing: the managed identity pages the chapter read don't say whether they're available in Azure Government, which is fine here because this estate's Azure is commercial.

## Slide 4 — What a federated credential is, and its rules

So what is a federated credential? It's a trust you put on an app registration or a user-assigned managed identity. The workload, say a GitHub workflow or a Kubernetes pod, presents a token from its own issuer, and Microsoft Entra swaps it for an access token, but only if three values match: the issuer, the subject and the audience. The match is exact, down to the letter case, with no wildcards. A system-assigned identity can't hold one at all. And managed identities, the first choice in the order, get their access from Azure role assignments, which this chapter records.

## Slide 5 — Learn's samples, pinned and sent to fakes

Here's what Microsoft gives you. Two Learn pages walk through creating a federated credential, one for an app registration and one for a user-assigned managed identity, with samples in the command line, PowerShell, a template and raw requests. Graph's reference has its own create request, and the managed identity reference has worked examples. All of that lives only inside web pages, so the repository pins the sources unmodified, with hashes a test checks, and a weekly watch that reports upstream changes. A harness then runs every sample against fakes, so you can see what each one really does.

## Slide 6 — What the samples accept in silence

This is the heart of the chapter. Run against the fakes, Microsoft's samples show the risk on their own terms. Graph happily creates a credential with any subject. Learn's samples don't even agree on the GitHub issuer: one has a trailing slash and the others don't, and the match is exact. One template defaults the audience with a stray leading space, so it can never match. And two Learn pages give two different pull request subjects. So the code checks each credential against what the workload will really present, and derives a subject only when the format is certain.

## Slide 7 — What the samples leave to you

The rest of the gap table is about everything around the write. The samples hard-code worldwide hosts, use a preview version, and in one case send a request with no version at all. They create one credential at a time by hand, so nothing notices a credential someone added in the portal. They don't check the limits Learn itself states. And they stop at creation: no record of the identity's roles, no parallel run, no disable. The verdict: use the samples as the model for the three writes, but not as the conversion, because they accept the wrong subject in silence.

## Slide 8 — The code: one module, a reviewed file, a cutover log

So what does the code add? A single new module and one entry script, which builds a plan by default and only writes when you hand it an approved plan. It reuses the shared cloud table and hashing from the earlier chapters but keeps its own client and fakes, so nothing earlier changes. Two files drive it. The conversion file, kept by identity engineering and reviewed with the application owners, says what each legacy credential becomes and which workload will present the token. And the cutover log, kept by the owner, records when each workload switched and who approved the disable.

## Slide 9 — The checks: nine rules, NPI-WIF-01 to NPI-WIF-09

Here are the nine rules the planner applies. Before any of them, it reads each app registration, identity, role assignment and legacy account, plus sign-ins once a cutover is recorded. Most rules come straight from Learn: the subject, issuer and audience must match exactly, names must follow the rules, and no parent may go past twenty credentials. Three are the program's own and labeled that way: the conversion order, a warning for credentials nobody reviewed, and the thresholds for a clean parallel run. And the failed exchange test is its own finding.

## Slide 10 — What the workload presents, and the exchange test

Two pieces make the check real. First, the code works out what the workload's issuer will actually put in its token. For GitHub it uses Learn's three formats, for environments, branches and tags, and for Kubernetes the service account format. Anything it can't be sure of, like a pull request, or GitHub's newer immutable format, has to be captured from a real test run. Second, it builds the real token request and sends it to a fake endpoint that matches the way Learn describes. It doesn't check signatures, so it proves the credential matches what you recorded, not what the issuer sends.

## Slide 11 — The plan: actions, and the evidence for a clean run

Nothing in the plan writes. Each conversion gets actions, and only three of them ever write: create an identity, create a credential, and disable the legacy account, all after review. Everything else is a record or a status, from awaiting cutover to day fifteen of thirty. A changed credential is never edited in place; it gets a new name and its own parallel run. The evidence for a clean run comes from the beta sign-in log, the only place that shows managed identity and service principal sign-ins and which credential was used. The plan is hashed, so the same inputs give the same plan, byte for byte.

## Slide 12 — The separate write path: an approved hash, one at a time

Writing is a separate path, and it's deliberately hard to misuse. It runs only against a plan whose hash a reviewer approved, for this tenant and cloud, and no older than a week. Every credential is checked again against the plan's recorded claims, so a hand-edited plan can't sneak through, and it never deletes anything. It runs as a person, not an unattended app. Before each write it looks again, and it sends one write at a time, identity first, because Learn says parallel creates under one identity fail. A new credential also needs a few minutes to propagate before it works.

## Slide 13 — Who builds it, who runs it, what it may touch

Who is this for? Developers build it. Identity engineers run the waves and keep the conversion file. And the application owners switch each workload, keep the cutover log, and approve every disable. The access is split in two. The read path is an app with read-only permissions and the Reader role. The write path is only ever a person, signed in with their own roles, because a standing app with the right to add credentials to any application is exactly what this program is trying to remove. For the identity's credential, the code picks the narrower built-in role over Contributor.

## Slide 14 — Lab 1: Microsoft's samples, then the plan

Lab 1 needs only a laptop with PowerShell 7 and Pester; no tenant, no network. First you run Microsoft's own samples against the fakes. Find the test that creates a credential with Graph's sample and then exchanges a token with a different subject: the create succeeds and the exchange fails. That's the whole risk, in one test. Then you list what each task needs, and build the plan from the fixtures: eight conversions in two waves, two failed exchange tests, and twenty actions, of which only four would write. The plan's hash is the same on every run.

## Slide 15 — Lab 1: findings, conversions, dry run and apply

Now the fixtures tell their stories. One credential copies the sample's trailing slash and gets the environment's letter case wrong, so it fails three ways, including the exchange. Another copies the template's stray space in the audience. A credential someone added in the portal shows up as a warning. One conversion has run forty clean days with the owner's approval, so it's the single disable in the plan, while another's old secret was still signing in weeks after cutover. Then you dry-run with the approved hash, apply to the fake in order, and watch a hash nobody approved get refused.

## Slide 16 — Lab 2: a test tenant, a real token, a real disable

Lab 2 moves to a test tenant, never production. You set up one small conversion: a test app with a secret, a test service account, and a test repository whose workflow signs in to Azure. The key step is capturing the claims: have the workflow print the decoded issuer and subject of its token, never the token itself, because that's the truth the check compares against. Then plan, get a second person to approve the hash, apply, and watch a real exchange land in the sign-in log. Try a wrong subject on purpose, run the parallel run forward, and back it all out by hand.

## Slide 17 — Dangers, and the guard for each

Each of these dangers has a guard in the code. The headline one is still the wrong subject, caught by the claims check and the exchange test before any cutover. Others are small: a trailing slash, a stray space, a subject guessed instead of captured. Some are about timing, like creating credentials in parallel, or using one before it's propagated. And some are about keeping your way back: the code never deletes, so the rollback, re-enabling the old account, always remains. Notice that writes stay with a person, never a standing app.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. Every conversion followed the order or says why. Every federated credential was checked against claims captured from a real run, and passed its exchange test, before cutover. Nothing sits in the tenant that nobody reviewed. The plan was approved by someone other than the person who applied it. Every parallel run had thirty clean days, every disable has the owner's approval, and nothing was deleted, so the way back is still open. Next, Chapter 6 turns to group managed service accounts, delegated managed service accounts, and the Kerberos island. Thanks for watching.
