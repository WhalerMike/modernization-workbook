# Building Non-Person Identity, Chapter 12 — The Managed Service Account Standard — narration script (practice copy)

## Slide 1 — Chapter 12: The Managed Service Account Standard

Welcome to the Federal Modernization Workbook's developer workbook, Building Non-Person Identity. This is Chapter 12: the managed service account standard. A standard nobody checks is a suggestion, so this chapter checks it every time something changes: a request, an aggregation, a certification, a Defender for Identity scan, a disabled account's ninetieth day. We'll see what the products give the code, the import formats, the five checks, what the code hands to Chapter 6 and what it never does, the evidence, two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — A standard nobody checks is a suggestion

Why does the standard need code? Because every step can drift. Each group or delegated managed service account is asked for in the agency's system access management tool, approved in SailPoint, recorded in ServiceNow, created by the pipeline through Chapter 6's approved plan, watched with Defender for Identity, certified by its owners, and retired after ninety days disabled. Chapter 6 is the only part that writes to Active Directory. This chapter writes nothing anywhere. It checks, compares and lists, and leaves the evidence for each step.

## Slide 3 — Machines run the steps; people decide

The standard's rule is short: machines run, check and record every step they can, and people decide, approve and accept risk. The approvers decide on purpose and risk, and the code then checks every approved request against the standard, so a wrong naming prefix is caught by the code, not by an approver. The code writes the rows Chapter 6's plan reads, so the plan creates exactly what was approved. Every account is compared on every run, so an unrequested one is a finding the same day. Certifications follow risk tiers. And the code never deletes: it says which accounts a person may delete, and why.

## Slide 4 — What the standard and the products give the code

What does the code depend on? First, the standard itself: names, the organizational unit, groups, the password interval, owners and cadences, all decided in the decision register. SailPoint approves every request, and ServiceNow holds the change record and the findings. SailPoint's documentation says its Active Directory connector can aggregate managed service accounts, and that reading who may retrieve the password needs its IQService. On the Microsoft side, Learn says Defender for Identity lists service accounts by type, its stale account check uses ninety days, and the password interval is fixed at creation.

## Slide 5 — The import formats: the kit's own, mapped by hand

The product pages read on November twentieth didn't specify SailPoint's or Defender for Identity's export field names. So the kit reads its own import formats and says so in each file's header. There are six: the approved requests, one file each; SailPoint's aggregated accounts; the Active Directory read, a fixture in Lab 1 and live in Lab 2; the program's register; a certification campaign's decisions; and Defender for Identity's service account list. In Lab 2, you map each product column to the kit's column by hand.

## Slide 6 — The code: one read-only task, msa-standard

So what does the code add? One script and one module, running one read-only task. It makes exactly one Active Directory call, Get A D Service Account, and that call is declared in a config file, as are the controls and K S I's for each step. Every run writes a folder: the findings, the generated inputs for Chapter 6, the certification, Defender for Identity and retirement results, the ServiceNow findings, the evidence rows, and a manifest with each input's hash. The same inputs and date give byte-identical files.

## Slide 7 — The request check: NPI-STD-01 to NPI-STD-09

The first check is the request, findings one to nine. A request has to be approved in SailPoint and carry a ServiceNow change record. The name has to follow the name standard. It needs exactly two owners, and a federal-employee sponsor who isn't one of them. A group managed account needs its hosts group, named for the app. The service principal names have to match the request. A delegated managed account has to be run by a person and supersede an existing account. And the workload, type and risk tier must be known values.

## Slide 8 — The reconciliation: NPI-STD-10 to NPI-STD-19

The second check, findings ten to nineteen, reconciles what SailPoint aggregated with what Active Directory holds and what the register says. Every account must be aggregated by SailPoint with one owner. Its password retrievers must be a single domain local group. The interval must be thirty days and the encryption A E S two fifty-six only; Learn says the interval can be set only at creation and A E S should always be configured. An account with no service principal name must be outbound-only, or have a recorded reason. No privileged groups. The right organizational unit. And every account must be explained by a request, which is the drift rule from the governance book.

## Slide 9 — Certification, Defender for Identity and retirement

Three more checks. Certification is due by risk tier: every three months for the highest tier, every six for the middle, and yearly for the lowest. Each revoke becomes a ServiceNow stale access finding, and a decision by someone who isn't an owner doesn't count. The Defender for Identity check reads its service account list and flags a user account still serving as a service account, a standalone managed service account, and any account Defender for Identity sees that the register doesn't. And retirement: an account becomes a delete candidate only after ninety days disabled with no sign-in since.

## Slide 10 — What it hands to Chapter 06, and what it never does

For each request that passes, the code writes the row Chapter 6's plan reads, with all twelve columns, including the SailPoint request and the ServiceNow change. For a group managed account, it also names the one group allowed to retrieve the password. Those files go into Chapter 6's reviewed inputs through a reviewed pull request, and Chapter 6's plan refuses any write without a request or a change record. And just as important is what this chapter never does. It writes nothing to any of the four products, it deletes nothing, and it builds the ServiceNow findings payload without posting it.

## Slide 11 — The evidence: one row per step and control

Every step leaves evidence. The request check supports A C two and I A four. The generated inputs support C M three, configuration change control. The reconciliation supports inventory and least privilege. Certifications support account management and the review of privileges. The Defender for Identity comparison supports continuous monitoring. The retirement list supports disabling accounts. And the passing tests support testing changes. Each row also names the fed-ramp twenty X K S I's aligned with it, re-read from FedRAMP on November twentieth. Two cautions: a row provides evidence for a control, and the assessor decides. And K S I's are indicators for cloud providers; the agency lines its evidence up with theirs.

## Slide 12 — Who runs it, who exports, who reads the evidence

Who's involved? The identity engineers who run Chapter 6's write path and own the standard. The SailPoint and ServiceNow administrators, who export and import the files. And the security officer, who reads the evidence. Approvers in SailPoint decide on purpose and risk, and the code then checks each approved request before anything is created. The two owners certify on their tier's cadence, and the code schedules it and turns each revoke into a finding. And a person deletes, through the decommission ticket, from the list the code produced.

## Slide 13 — Lab 1: run the standard's checks on the fixtures

Lab 1 needs PowerShell 7 with Pester, and no domain. Step 1 runs the standard's checks on the fixtures: five requests, of which two pass; nine Active Directory accounts; eight register rows; a certification campaign; and a Defender for Identity list, each built to trip one or more rules. The summary says twenty-five findings, four warnings, three for information. Two Chapter 6 rows and one retriever entry. One certification overdue. One account a person may delete, and nothing deleted. Then one line per rule, and the manifest's hash.

## Slide 14 — Lab 1: the findings and the Chapter 06 inputs

Step 2 reads the findings. Look for the account called gmsa ops. It's in Domain Admins, SailPoint never aggregated it, and no request explains it: three findings for one account nobody asked for. Step 3 reads what the code hands to Chapter 6. Two rows, one per approved request, each carrying its SailPoint request and its ServiceNow change. The approved group managed account gets its retriever group, named for the payroll app. The delegated managed account gets no retriever entry, because it learns its hosts during its migration.

## Slide 15 — Lab 1: certifications, retirement, evidence, tests

Step 4 reads the certifications. The account gmsa print is overdue: it's in the lowest risk tier and was last certified in October 2025, and its owner revoked it, so it becomes a ServiceNow stale access finding. Step 5 is the retirement list. Only gmsa legacy may be deleted, and only by a person through the decommission ticket. Another account signed in after it was disabled, and a third is still enabled in Active Directory. Step 6 reads the evidence: one row per step and control, with its K S I's and the file's hash. Step 7 runs the tests: twenty-seven pass.

## Slide 16 — Lab 2: a test domain and the products' exports

Lab 2 uses a test domain, never production, with Chapter 6's second lab already done, a SailPoint sandbox scoped to the service account unit, and Defender for Identity on the domain. The authors haven't run it. Write the test domain's settings. Then put the real exports into the kit's formats, mapping each product column by hand. Run with a live read of the domain; a group managed account you made by hand in Chapter 6 with no request shows up as finding eighteen, which is the drift rule working. Finally, confirm the manifest shows one read of Active Directory, and nothing else.

## Slide 17 — Dangers, and the guard for each

Each danger has a guard. An approver might approve a request that breaks the standard, so the code checks every approved request before anything is created, and Chapter 6 refuses a write without a request. A group managed account created by hand is caught by the drift rule on every run. If SailPoint correlates no owner, or the wrong one, certifications go astray, so that's a finding, and one attribute names one owner. A certification by a non-owner doesn't count. A disabled account is deleted only after ninety quiet days, by a person. And because the import formats could drift from the products' exports, every header is checked.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. Every approved request was checked before anything was created. Every row in Chapter 6's inputs came from an approved request, with its request number and change record. SailPoint aggregates every managed account, each with one owner, and no reconciliation finding is open without a ServiceNow finding and someone to fix it. Every certification is current, every revoke is a finding, and Defender for Identity shows no user account serving as a service account that isn't on a plan. Nothing was deleted except by a person, from the list. And each run's evidence and manifest are filed with the change record.
