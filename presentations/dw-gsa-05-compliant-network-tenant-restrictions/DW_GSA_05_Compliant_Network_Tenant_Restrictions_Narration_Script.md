# Building Global Secure Access, Chapter 05 — The Compliant Network and Tenant Restrictions — narration script (practice copy)

## Slide 1 — Chapter 05: The Compliant Network and Tenant Restrictions

Welcome back to Building Global Secure Access. This is Chapter 5: the compliant network, and tenant restrictions. These are two settings only Microsoft Entra can provide, and two of the easiest ways to lock users out. The code's job is to say when each is safe to enforce. We'll start from Learn's example policy and its universal tenant restrictions, see what they leave to you, read eleven checks and the plan's enforcement gate, and walk two labs. The chapter has been reviewed and approved, and the code is illustrative, tested against fixtures.

## Slide 2 — Why these two need a gate

Why a gate? The compliant network check passes only for users who come through the agency's own Global Secure Access, so a replayed token from anywhere else is refused. Tenant restrictions let agency devices sign in only to tenants the policy allows. Both are strong, and both can lock people out if they're enforced too early. So the goal: keep both as reviewed configuration, show when the compliant network policy is ready to enforce, and show that agency devices reach only the tenants the register allows. It's for the developers, the identity engineer, and the policy owner who decides enforcement.

## Slide 3 — What Microsoft Learn gives you

Learn gives a lot here. Its example policy blocks everything outside the All Compliant Network locations named location, excludes the two Intune applications so devices can still enroll, and excludes emergency access. The check isn't supported for Private Access apps, and turning signaling off while policies depend on it can block users. The named location is listed with Policy Read All. Universal tenant restrictions apply the TRv2 policy to traffic the Microsoft profile carries, through one tagging setting. Learn's tests are disabling the client and signing in again, and a four-case matrix for tenants, with a block query for error five million two hundred eleven.

## Slide 4 — What it leaves to you

What does it leave to you? Learn's example policy is on from the start, but the guide begins every policy in report-only, so the kit's file is report-only. Nothing says when report-only is done, so the kit's rule is ten business days and no failure carried by the service, and the plan won't enforce without an explicit switch. Exclusions are prose, so two checks look for them and the plan refuses a file without the emergency one. The tagging toggle enforces nothing with an allowing default, so tagging waits for a blocking default. And every partner allowance needs a register row with an owner.

## Slide 5 — Eleven checks across the two steps

Eleven checks. For the compliant network: the named location exists, which tells you signaling was turned on; the policy blocks everything outside it; the emergency group and both Intune apps are excluded; no Private Access app is in scope; while it's report-only, the business days and the defects are counted, as information until it's ready; and once it's enforced, signaling must be on. For tenant restrictions: the default blocks everyone and everything; each partner allowance is in the register and current; tagging is on only with a blocking default; and each blocked tenant is listed for the weekly review.

## Slide 6 — Who decides enforcement

Who decides? The policy owner decides enforcement, and passes the enforce switch on the record, only after the report-only result is clean. The identity engineer runs the policies and owns the partner list, reviewed with the partner register. The security monitor watches blocks that weren't carried by the service: those are either an attack or a broken client. For permissions: Policy Read All for policies, named locations and the tenant restrictions policy; Network Access Read All and Read Write All for signaling and tagging; and Policy Read Write Conditional Access to create the policy, with the two administrator roles activated just for the window.

## Slide 7 — Lab 1: built right, but not ready

Lab 1, after listing the reads and collecting the pilot tenant. Step 3 checks the compliant network policy. It's built right: the location, the block, both exclusions, no Private Access app. And it has been in report-only for ten business days. But it isn't ready: the service carried three report-only failures. Step 4 reads the guide's query to see why that matters. Forty-one failures came from users off the service, which is exactly what the policy is for. The three with through equal true are defects: users on the service who would have been blocked.

## Slide 8 — Lab 1: a partner nobody registered

Step 5 checks the tenant restrictions. The default blocks, and tagging is on. But one partner tenant is allowed with no register entry, and the block query shows a tenant that isn't a registered partner, listed for the weekly review. Step 6 plans ring 1, whose desired state wants the compliant network policy enforced. Without the enforce switch, the plan leaves it report-only and says so on a manual line. A reviewer passes the switch only once step 3's check is clean, which it isn't yet.

## Slide 9 — Lab 1: two weeks later, enforced and clean

Step 7 checks the same policy two weeks later, after ring 1's collection. It's enforced, and the check that only applies to an enforced policy passes: signaling is on. The unregistered partner is gone, and the blocked tenant is still listed for review, which is its job. Step 8 runs this chapter's tests: five passed, none failed. Then delete the output folder.

## Slide 10 — Lab 2: report-only, then Learn's tests

Lab 2 needs a test tenant with the Microsoft profile on for a pilot group, a test device, an emergency access group, and a second test tenant as the partner. Find the two Intune apps and put their IDs in the settings. Collect, plan and apply the report-only policy with the approved hash. Run Learn's test: sign in, disable the client, open a new browser session, and sign in again; in report-only, that's a recorded failure. Read the tenant restrictions policy, and stop if its default doesn't block. Run Learn's four-case test. Then back it out: delete the lab's policy, and turn tagging off if the lab turned it on. The authors haven't run this lab.

## Slide 11 — Requirements, dangers, done

The reviewed policy file supports access enforcement and session authenticity. Reading report-only results before enforcing supports session termination and impact analysis. A blocking default, registered partners and tagging support the controls on external systems and information flow. The assessor decides them. The dangers: enforcing before the client is everywhere, forgetting the Intune exclusions so new devices can't enroll, and tagging with a default that allows everything. A Global Secure Access outage is a danger too: Microsoft's break-glass scripts are rehearsed, and Chapter 8's ring record holds the date. You're done after a clean report-only period, an enforce decision on the record, and an owned partner list. Next, Chapter 6.
