---
title: "Learning path: The Zero Trust Assessment as Evidence"
subtitle: "Four modules: what the assessment is and isn't, running it safely, turning its results into a closure register, and reconciling and re-running it, with labs on fixtures and in your own test tenant"
description: "A learning path in four modules for assessment operators, pillar owners, the Zero Trust program lead and ISSO reviewers, built from the Zero Trust Assessment implementation guide: what Microsoft's Zero Trust Assessment checks and why a result is evidence, not a verdict; preparing the host, consenting with least privilege and connecting in Commercial, GCC, GCC High and DoD; normalizing every result so a skipped test never counts as a failed control, and opening a closure register routed to the pages that remediate each finding; and comparing runs, reconciling with ScubaGear and AWS Security Hub CSPM, and sealing the evidence. Each module has a knowledge check; Lab 1 runs on the results kit's fictional fixtures with no tenant, and Lab 2 runs in your own test tenant."
doc-type: training-path
research-status: draft
research-type: training module
research-book: "Book 11"
series-order: 0
listing:
  - id: zta-modules
    contents:
      - "[0-9][0-9]-*.md"
    type: table
    fields: [title, description]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
review-status: pending
last-reviewed: 2026-11-11
---
# Learning path: The Zero Trust Assessment as Evidence {.unnumbered}

Microsoft's Zero Trust Assessment tests hundreds of configuration items in a tenant and writes a report. The report is accurate on the day it runs; what it doesn't do is tell you what a skipped test means, what to fix first, or when a finding is closed. This learning path teaches you to run the assessment safely, to read its results as evidence rather than a score, and to turn them into a closure register an assessor can check. You work through the ten steps of [Zero Trust Assessment: An Implementation Guide](../../books/guides/zero-trust-assessment-implementation.md) in four modules, with the [results kit](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/zta-results) on your laptop.

**Watch first.** The guide's narrated deck, about 15 minutes with captions, covers the ten steps in one sitting: [▶ watch it in the browser](../../presentations/watch.html?v=Guide_Zero_Trust_Assessment_Narrated), or find it on the [Presentations](../../presentations/index.md#guide-zero-trust-assessment) page.

Like a [Microsoft Learn learning path](https://learn.microsoft.com/training/), it is a short series of modules, each built on the one before. The modules don't repeat the guide or [Book 11](../../books/b11-zero-trust/index.md). They tell you what to read, in what order, what to run, and what to check you understood.

## Who this path is for

| Role | What you get from the path |
|---|---|
| Assessment operator | The host, the pinned version, consent and the run account, the connection in each cloud, the run and its hashes, and the kit's commands |
| Pillar owner | How to read your pillar's tab, review an Investigate result, and work your entries in the closure register |
| Zero Trust program lead | Routing findings to the page that remediates them, weighing them, and the cadence |
| ISSO reviewer | The normalized counts, the exceptions and their approvers, the comparison between runs, and the evidence check you can run yourself |

**Level:** intermediate. **Products:** Microsoft's Zero Trust Assessment (release 3.1.0), Microsoft Graph PowerShell, Exchange Online and Security & Compliance PowerShell, Azure PowerShell; AWS Security Hub CSPM for the reconciliation. **Scope:** a civilian agency at FedRAMP Moderate in Microsoft 365 GCC with commercial Azure, and agencies in GCC High or DoD.

## Prerequisites

- [Book 11, Chapter 05](../../books/b11-zero-trust/05-two-assessment-tools.md): what the Zero Trust Assessment and ScubaGear each check. Module 1 reads it with you.
- [Book 11, Chapter 10's taxonomy](../../books/b11-zero-trust/10-evidence-not-verdicts.md#a-normalized-result-taxonomy): ten minutes, and every module refers back to it.
- PowerShell 7.1 or later and Pester 5 on your laptop for Lab 1; the kit's zip, [zta-results.zip](../../../downloads/zta-results.zip), extracted, or this repository cloned.
- For Lab 2: a test tenant, never production, where you can get consent granted and a reader account with the roles of the guide's [Step 3](../../books/guides/zero-trust-assessment-implementation.md#zta-step-3).

## What you'll be able to do

When you finish the path, you'll be able to:

- explain what the Zero Trust Assessment checks, why it isn't a substitute for ScubaGear, and why its result is evidence, not a verdict;
- prepare a host, consent once with least privilege, review what the consent left behind, and connect in Commercial, GCC, GCC High or DoD;
- run the assessment, hash its output before anyone opens it, and keep it inside the boundary;
- normalize every result to Book 11's seven results, so a skipped test is neither a failure nor a pass;
- open a closure register that routes each finding to the page that remediates it, and check each exception's approver;
- compare two runs, recognize a finding that is no longer evaluated rather than fixed, reconcile with ScubaGear and Security Hub CSPM through the control, and seal and check the evidence.

## Modules

Work through them in order.

| # | Module | Guide steps | Labs | Time |
|---|---|---|---|---|
| 1 | [Evidence, not a verdict](01-evidence-not-a-verdict.md) | 1 and 6 | Lab 1 | 40 min |
| 2 | [Running the assessment safely](02-running-the-assessment-safely.md) | 2 to 5 | Lab 2 | 35 min, plus Lab 2 |
| 3 | [From results to a closure register](03-from-results-to-a-closure-register.md) | 7 and 8 | Lab 1, Lab 2 | 55 min |
| 4 | [Reconcile, re-run and keep the evidence](04-reconcile-re-run-and-keep-the-evidence.md) | 9 and 10 | Lab 1, Lab 2 | 50 min |

: The modules of the Zero Trust Assessment learning path {.striped .hover}

**Total time:** about 3 hours with each module's Lab 1. Lab 2, in your own test tenant, isn't counted: a full run on a large tenant can take more than 24 hours.

**Labs.** Lab 1 runs the kit against two fictional Contoso exports, two weeks apart, built from the 3.1.0 export's shape; nothing signs in and nothing leaves your laptop. The output shown in each Lab 1 is what the commands printed on November 11, 2026. Lab 2 runs the real tool in a test tenant; the authors haven't run it, and each Lab 2 says how to back out what it did. [The Labs page](../labs.md#zta) lists every lab in the path.

::: {#zta-modules}
:::
