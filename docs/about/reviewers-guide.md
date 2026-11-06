---
title: "Reviewers' Guide"
subtitle: "What the review gate is, what we ask outside reviewers to check, and how to agree or disagree with a decision"
description: "A guide for outside reviewers of the Federal Modernization Workbook: the review gate that holds the developer workbooks, guides and training until the workbook's editor approves them, what draft and approved mean, the decision register, what to check (facts against their cited sources, and whether each design choice is reasonable), how to send feedback on a decision, and why approval stays with the workbook's editor."
doc-type: section-landing
---

# Reviewers' Guide {.unnumbered}

The workbook is written by a small team, and the same people write and check most pages. Outside review is how it catches what they miss. This guide is for anyone willing to do some: a federal identity engineer, an ISSO, an assessor, a project manager, or a reader who has found something wrong.

You don't need to review everything. One chapter, one lab, or one decision you know well is worth checking. The two things we most want to hear are a fact that doesn't match its source and a design choice you think is wrong.

## What the review gate is {#review-gate}

Some pages publish before they are finished, so readers can use them and comment, but they are held behind a **review gate** until the workbook's editor has read them. The gate is a script, [`scripts/source_watch/review_gate.py`](https://github.com/WhalerMike/modernization-workbook/blob/main/scripts/source_watch/review_gate.py), and a few fields in each gated page's front matter:

| Field | What it records |
|---|---|
| `review-status` | `approved`, or `pending` while the page waits for review |
| `reviewed-sha256` | A fingerprint (SHA-256) of the page's text as it was when it was approved |
| `last-reviewed` | The date of that approval |

: Review fields in a gated page {.striped}

A page **waits for review** when it isn't approved, or when its text no longer matches the fingerprint. Any change to an approved page, even one word, sends it back. The only parts left out of the fingerprint are blocks the build writes from other sources: a chapter's narrated-tour links, the captured output of a kit command, the generated lab links, and the version history. The edition number in a deck link is ignored too, since every new edition updates it; the rest of the link still counts. The weekly source watch lists every waiting page in its GitHub issue until each one is approved, and work that builds on a page, such as its narrated tour, waits for its approval too.

**Which pages are gated.** The script lists them in `GATED`. Today they are:

- every developer workbook under [Projects](../project-plans/developer-workbooks/index.md) (`docs/project-plans/developer-workbooks/`);
- [Building the Attribute-Driven Migration](../books/b19-developer-workbook/index.md) (`docs/books/b19-developer-workbook/`);
- every implementation guide, such as the [Non-Person Identity implementation guide](../books/guides/non-person-identity-implementation.md) (`docs/books/guides/`);
- every [training](../training/index.md) page (`docs/training/`).

Files and folders whose names start with an underscore, such as the claims logs, aren't gated. The guides and training were added on 2026-11-03 ([WD-129](decision-register.md#wd-129)), so most of their pages are still waiting for their first review. If this list and `GATED` ever differ, the script is right.

## Draft and approved {#draft-and-approved}

Two different labels appear on these pages, and they answer different questions.

- **Draft** is the page's status label: how finished and tested the work is. A draft page is complete enough to read and use, but its labs may not yet have been run against a live tenant, and its conclusions may change. The [status labels](sources-and-verification.md#status-labels) go from Draft to In review, Proved and Published, and a page with a status label carries it in a banner until it is Published.
- **Approved** is the review gate's record that the workbook's editor has read this exact text. It isn't a claim that the page is correct, tested, or endorsed by anyone. It means the editor has accepted it as the workbook's current position.

So a page can be *approved* and still *draft*: the editor has read it, and it hasn't been proved in practice yet. A page that is *pending* may say something the editor hasn't accepted.

## What we ask you to check {#what-to-check}

### 1. Facts against their cited sources

Every external fact carries an endnote to a primary source: Microsoft Learn or another vendor's own documentation for products; OMB, NIST, CISA, FedRAMP, the statute or the *Federal Register* for federal requirements. Open the source and check that:

- the sentence says what the source says, no more, with its conditions kept;
- the source is the original, not a summary of it;
- the source is still current, and its link still goes where it should.

Each chapter's claims log, in the `_verification` folder beside it on GitHub, lists the chapter's external claims with a verdict for each. A claim marked *verified* that you think is wrong is exactly what we want to hear about. [How This Workbook Knows What It Says](sources-and-verification.md) explains the method and where it stops.

### 2. Whether each design choice is reasonable

Much of the workbook is design: a rule, an order of work, a threshold, a tool. Some choices follow a federal requirement, some follow Microsoft Learn, and some are the workbook's own judgment. The [Decision Register](decision-register.md) lists them all, from the repository's first pull request on, with the question, the options considered, the choice, the reason, the sources and the pages each one shaped. Each entry's **basis** says which kind it is:

- **External requirement:** check that the workbook reads the requirement correctly. The requirement itself isn't ours to change.
- **Microsoft Learn:** check that the choice matches Learn, and tell us if Learn has changed or says something different for the government clouds.
- **Workbook design:** no source makes this choice, so these are the ones most open to argument. Tell us if a better option was missed, the reason doesn't hold, or the choice wouldn't work in an agency you know.

The register also lists the decision points the sample project plans leave to the agency that adopts them. Those are the agency's to make, but their options can be challenged like anything else.

### 3. Anything else

If a lab step doesn't run as written, a page contradicts another, or something reads as naming a specific agency, tell us. Labs are meant to be copied and run exactly as written.

## How to give feedback {#feedback}

**On a decision.** Open a [decision feedback issue](https://github.com/WhalerMike/modernization-workbook/issues/new?template=decision-feedback.yml) on GitHub. Each entry in the register has a link that opens one with its ID filled in. The form asks for:

- the decision's ID, for example `WD-131`; for a project plan's decision point, the plan and its ID, for example *Non-Person Identity Modernization, D-N2*;
- whether you **agree**, **disagree**, or think it **needs evidence**;
- the source or evidence behind your view, ideally a primary source with a link;
- the pages affected, if you know them.

Agreement is worth sending too. A decision that outside reviewers have checked and agreed with is stronger than one nobody has looked at.

**On a fact or a page.** Follow [Reporting an error](sources-and-verification.md#reporting-an-error): open an [issue](https://github.com/WhalerMike/modernization-workbook/issues), name the page and the sentence or footnote, and link the source that shows the problem.

**Please don't** include anything that isn't public: no agency's internal documents, configuration, names or system details. The repository is public, and the workbook stays agency-neutral. If your evidence is internal, describe what it shows in general terms.

## What happens to your feedback {#what-happens}

1. A **disagree** or **needs evidence** issue on a decision sets that entry's status to **challenged**, with a link to your issue. The pages keep following the decision while it is challenged.
2. The workbook's editor reads the issue and the evidence and rules on it in the issue.
3. If the decision stands, the entry goes back to **settled** and the issue records why. If it changes, a new entry records the new decision, the old one is marked **superseded** and points to it, and the pages change to match. Changed gated pages go back through the review gate.
4. A corrected fact is re-checked against its source, fixed, and recorded in the chapter's claims log.

Nothing in the register is deleted. A superseded decision stays, so you can see what was decided, when, and what replaced it.

## Approval stays with the workbook's editor {#approval}

Only the workbook's editor approves a gated page, by running `review_gate.py --approve` after reading it, in a reviewed pull request. Only the editor settles a challenged decision. Outside reviewers advise: your review can change what the editor approves, but it isn't an approval, and agreeing with a decision doesn't sign you up to it.

None of this is a federal review. The workbook is independent analysis, not reviewed or endorsed by any federal agency, and an approved page is the workbook's position, not an agency's.

## How the register stays current {#keeping-current}

Each decision is one entry in [`data/decisions.yml`](https://github.com/WhalerMike/modernization-workbook/blob/main/data/decisions.yml), and [`scripts/decisions/build.py`](https://github.com/WhalerMike/modernization-workbook/blob/main/scripts/decisions/build.py) writes the register from it and from the project plans. A new decision gets the next WD number in the pull request that makes it, and the pull request checks fail if the register is out of date. The entries before November 2026 were collected from the pull requests that made each decision. Where a pull request gave no reason, the entry says so instead of supplying one.
