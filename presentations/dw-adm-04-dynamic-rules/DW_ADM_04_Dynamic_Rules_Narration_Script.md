# Building the Attribute-Driven Migration, Chapter 04 — Dynamic Rules as Code — narration script (practice copy)

## Slide 1 — Chapter 04: Dynamic Rules as Code

Welcome to the Federal Modernization Workbook's developer workbook, Building the Attribute-Driven Migration. This is Chapter 4: dynamic rules as code. A dynamic membership rule is access policy written as one line, so the chapter treats it like code: reviewed, tested against people you can name, and diffed before it ships. We'll look at what Microsoft's engine and samples give you, what they leave out, then the rule library, the linter, the shadow diff, the incident path, two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — Why a dynamic rule is code

Why treat a one-line rule as code? Because in this migration, access follows the HR record. HR values land in a few coded attributes, and dynamic rules read them to decide who gets access, licenses and policy. Every rule that grants access starts with two guards: the account is enabled, and it's a member, not a guest. The validation kit from Chapter 3 already checks the rules live in a tenant. This chapter moves those checks earlier, into the pull request, so a bad rule is caught before the engine starts moving people.

## Slide 3 — What Learn says about the engine sets the stakes

What Learn says about the engine is what makes this worth the trouble. The rule language is small and precise, so a parser can follow it exactly. Comparisons ignore case, so a lower-case code still matches, and the HR side has to keep its codes clean. Processing runs one tenant at a time and can take more than a day, so a mistake doesn't undo itself quickly. The memberOf operator is a preview that ends in November, after which those groups freeze. And agents' user accounts are included unless excluded, with no documented property to exclude them yet.

## Slide 4 — Which cloud: sign-in, evaluator and memberOf

Which cloud you're in matters here in a quiet way. Learn's incident samples ask you for the cloud, but if they don't recognize your answer, they fall back to the worldwide endpoint, so a GCC High tenant could be signed in to as the wrong cloud. The chapter's code uses the same hosts but refuses a cloud name it doesn't know. Graph's own rule evaluator is a beta, delegated-only action, listed for the global service and the US Government clouds. And the memberOf preview is public cloud only, which is one more reason the library doesn't use it.

## Slide 5 — What Learn gives you: syntax, and five samples

So what does Microsoft give you? For writing rules: a syntax page with every property and operator, and a page on writing efficient rules. There's no sample library of rules or tests; the closest thing is Graph's evaluator, which is beta. For running the engine, there's more: five PowerShell samples for an incident, when a rule change starts moving people you didn't intend. You pause processing, then resume it in order, critical groups first. Each script works in two phases, asks before it acts, and asks only for the permissions it needs.

## Slide 6 — The pinned copy, run against a fake tenant

The scripts only exist inside Learn's pages, so the repository pins the pages themselves, unmodified, at a known commit, with hashes a test checks and a weekly watch for changes. Then a small harness pulls each script out of its pinned page at test time and runs it, as published, against a fake tenant. Only the things it calls outside itself are swapped out: the prompts, the screen output, the sleep, and four Graph cmdlets. That way you can watch Microsoft's own scripts behave, instead of taking them on trust. Here's what that showed.

## Slide 7 — What the samples leave to you

This is the heart of the chapter. Learn's pause script does its job well, and the code keeps it as the model. But it records nothing about what it paused. So when you resume, Learn's script turns on every paused group, including one that was deliberately frozen before the incident started. It also falls back to the worldwide cloud on an answer it doesn't know, and nothing makes you wait before resuming. The verdict: during recovery, the questions are what did we pause, and what was already off. Only a record answers them.

## Slide 8 — One file per group, with an owner and tests

Here's what a rule looks like as code. Each group is one small file: a name, whether it holds users or devices, an owner who approves changes, a flag saying whether it's critical in an incident, the rule itself with its two guards at the top, and a few tests. The tests name people in a fictional population built to trip every guard: someone disabled, a guest who copied an organization code, a worker with an empty type, a code in lower case. If the rule ever lets the wrong person in, a test says so.

## Slide 9 — Parse and evaluate offline, as Learn's grammar says

To test rules without a tenant, the code needs to read them. The parser follows the grammar on Learn's syntax page: the operators, lists, collections, nulls, escaped quotes and the order of precedence. It even accepts the en dash that some of Learn's own examples print instead of a hyphen. The evaluator then checks a parsed rule against one fictional person, ignoring case, just as the engine does. It's honest about its limits: anything it can't evaluate faithfully, it refuses. It's a test tool, not the engine, and Lab 2 checks it against Graph's.

## Slide 10 — The linter: guards on the parsed tree

The linter is where the guards become enforceable. Its most important check is that the two guards sit at the top of the rule, ANDed with everything else. A guard tucked inside an "or" protects nothing, yet a simple text search would still find it and call the rule fine. That's why the linter works on the parsed rule, not the text. Another check is subtler: "not equal to contractor" also lets in someone whose worker type is empty. The linter flags it, and the owner decides.

## Slide 11 — What the linter found in Book 03's own table

The best proof a linter is useful is that it finds something real. Run against Book 3's own table of rule patterns, it found three things. One pattern had no guest guard, so a guest with a matching employer name could have qualified; that's now fixed. Another let in a worker with an empty type, and the owner decided that shouldn't count, so it gained a clause. And the direct reports rule can't carry guards at all, because Learn says it can't be combined with anything, so the linter just notes it.

## Slide 12 — The shadow diff, the pause manifest and the tests

Two more pieces finish the code. The shadow diff runs the old rule and the new one over the fictional population and lists exactly who a change adds and who it removes, right in the pull request. The same idea runs live in the validation kit. The pause manifest is the record Learn's samples leave out: before anything is paused, it writes down every group's state, then pauses only what was on, and later resumes only what it paused. Seventy tests cover all of it, with no tenant and no network.

## Slide 13 — Who owns the rules, and what each step may do

Who is this for? Developers build and maintain the library and its checks. Identity engineers own the group library, and every rule file names the owner who approves its changes. Reviewers approve each change, with the shadow diff in front of them. And each step asks for the least it needs. Creating groups needs group write rights with the Groups Administrator role. Testing a rule with Graph needs only read rights when you supply the rule. Pausing administrative units is the heavier one: it needs the Privileged Role Administrator.

## Slide 14 — Lab 1: Learn's samples and the rules, offline

Lab 1 needs only a laptop with PowerShell 7 and Pester. First you run Learn's own pause and resume scripts against a fake tenant with two groups, one of them already paused for review. After the resume, both are on: the held group came back to life. Try an unknown cloud name and you'll see it sign in to worldwide. Then you lint Book 3's table and evaluate a rule over the fictional people. The disabled account and the guest stay out, and the lower-case code gets in, just as Learn says.

## Slide 15 — Lab 1: the pull request check, broken on purpose

Now the part that makes the case for all this. Run the pull request check and it passes cleanly: six rules, no findings. Then break a rule on purpose by deleting the clause that keeps out empty worker types, and run it again. Three things fire at once. The linter flags the empty-slot risk, the membership test for the worker with no type fails, and the shadow diff shows exactly who the change would let in. Put the clause back, run the whole suite, and seventy tests pass.

## Slide 16 — Lab 2: a test tenant, Graph's evaluator, a drill

Lab 2 moves to a test tenant, never production, with fictional users that match the population. You create the groups from the library, paused, so they can't move anyone yet. Then the key step: ask Graph's own evaluator about every test user, and compare its answer with the offline one. Any disagreement is a finding against the offline evaluator. Next you turn processing on and diff two rules live. Finally you drill an incident: take the record, pause, resume the critical groups by name, then back everything out.

## Slide 17 — Dangers, and the guard for each

Each of these dangers has a guard, and most of them are rules that run every time rather than someone remembering. The quietest one is a guard hidden inside an "or": the rule looks right, a text search agrees, and guests get in anyway. The loudest is a change that moves hundreds of people within hours, which is why every change carries tests and a diff. After an incident, resuming everything is its own danger. And one row stays honestly open: agents' accounts, until Learn names the property.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. Every group has a file with an owner and tests for someone in and someone out. The pull request check passes, with its diff in front of the reviewer. Every rule starts with the two guards, avoids memberOf and display-name attributes, and makes a written decision about empty slots. The offline evaluator agrees with Graph's for every test. And the incident runbook takes its record before pausing and resumes from it. Next, Chapter 5 builds Lifecycle Workflows custom extensions. Thanks for watching.
