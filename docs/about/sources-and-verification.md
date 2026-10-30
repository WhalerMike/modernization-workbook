---
title: "How This Workbook Knows What It Says"
subtitle: "Primary sources, endnotes, claims logs, labels, review dates and the research ladder: what each one proves, and what none of them can"
description: "How the Federal Modernization Workbook checks its claims: primary sources only, an endnote for every external fact, a claims log per chapter with a verdict per claim, the inference and design-guidance labels, what-couldn't-be-verified sections, access dates, the weekly source watch, the research status ladder from draft to published, agency-neutral books, independent verification passes, and how to report an error."
doc-type: section-landing
---

# How This Workbook Knows What It Says {.unnumbered}

Every external fact in the workbook carries an endnote to a primary source. That is the visible part of the method, and it is easy to over-read. An endnote shows that a source exists and that someone pointed to it. It doesn't show that the sentence says what the source says, that the conclusion follows from it, or that the source still says it today. The rest of the method exists to close those gaps, and this page describes each part as it is actually practiced, including where it stops.

## Primary sources only

A claim about a product is checked against the vendor's own documentation: Microsoft Learn, Oracle's documentation, the product's admin guide. A claim about federal policy is checked against the issuing body: OMB memoranda, NIST publications, CISA directives, FedRAMP's rules, the Federal Acquisition Regulation, the *Federal Register*, an agency's own published privacy assessment or inspector general report. Press coverage, blog posts, analyst summaries and other secondary accounts aren't cited. When the only source for a fact is secondary, the fact is left out and, on research pages, listed as not verified.

## What an endnote does and doesn't prove

Each endnote names the publisher, the title, the date or version where there is one, the section or page, the URL, and the date the source was opened. Many also say in a few words what the source was cited for, and quote it where the wording matters. Quotes are kept short, under 25 words, and verbatim.

An endnote proves less than it appears to:

- **It proves the source exists and was opened** on the access date.
- **It doesn't prove the sentence matches the source.** A sentence can overstate, generalize or drop a condition the source attaches. That is checked in the claims log, not by the endnote.
- **It doesn't prove the reasoning.** Two true sources can support a wrong conclusion. Conclusions the sources don't state are labelled, below.
- **It doesn't prove the source is current.** Products and policies change after the access date. The source watch and the review dates, below, are how the workbook notices.

## Claims logs

Each chapter and each research page has a claims log in a `_verification` folder beside it: `docs/books/<book>/_verification/<chapter>.md` and `docs/research/_verification/<page>.md`. These aren't published on the site; they are in the [repository on GitHub](https://github.com/WhalerMike/modernization-workbook), where anyone can read them.

A log lists the external claims in the page, one row each, with where the claim appears, the source, and a verdict:

| Verdict | Meaning |
|---|---|
| **verified** | The source says it. |
| **corrected** | The draft said something the source doesn't; the text was changed to match the source. |
| **removed** | The claim couldn't be supported and was taken out. |
| **restated-as-design** (research logs: **design**) | The claim couldn't be supported as fact, or is the program's own recommendation, so it is stated as design, with no endnote. |
| **inference** | A conclusion the sources support but don't state; labelled on the page. |
| **not verified** (some book logs: **unverifiable**) | Couldn't be checked; listed on the page as not verified, and not stated as fact. |

Research logs also record their method: which sources were downloaded and searched in full text, which were read through tools that summarize a page, and which quotes were re-checked against the raw page. Later additions to a chapter get their own dated section in the same log, so the log shows when each claim was checked.

## Labels in the text

Two labels mark statements that aren't external fact:

- ***(inference)*** marks a conclusion the cited sources support but don't say.
- ***(design guidance)*** marks the program's own recommendation: how it suggests building something, not what a vendor or a rule requires.

A design position needs no endnote, but it must never read as external fact. When a sentence is labelled once, the same claim shouldn't appear unlabelled elsewhere; checking that is part of each verification pass.

## What couldn't be verified

Most research pages end with a section called **What couldn't be verified**. It lists what the authors looked for and didn't find: a contract that isn't public, a page that refused automated access, a number that appears only in press coverage, a product behavior no documentation describes. Saying so is the honest alternative to a guess, and it tells a reader what to confirm before relying on the page.

## Access dates and the 90-day review

Every endnote carries the date the source was opened. Research pages also carry a `last-reviewed` date: the last time someone checked the page against its sources. The status box at the top of a research page shows that date, and once it is more than 90 days old the box says the page is overdue for review and its sources should be checked before relying on it. The Research page lists each page's review date.

## The weekly source watch

Once a week, every Monday, an automated job fetches every URL cited in a footnote in the books and the research pages (about three thousand of them) and compares each with the previous week. When a source has changed, moved or disappeared, it opens a GitHub issue that lists the source under the chapter or research page that cites it, quoting what was added. The same issue lists new publications from federal and vendor feeds that touch a book's topics, and every research page overdue for its 90-day review. The issues stay open until the chapters they name have been checked. How the watch works and what it can't see is described in [`scripts/source_watch/README.md`](https://github.com/WhalerMike/modernization-workbook/blob/main/scripts/source_watch/README.md).

## Research: from draft to published

New work doesn't start in a book. It starts on the [Research](../research/index.md) page and moves through four statuses:

1. **Draft:** being written. Expect gaps and changes.
2. **In review:** complete and sourced, open for comment. Its conclusions may still change.
3. **Proved:** reviewed, and validated in practice, for example in a lab, a pilot or a test tenant, with the evidence recorded on the page.
4. **Published:** moved into the books. The research page stays as the record of its sources, review and evidence.

Every research page carries its status in a banner at the top, so it can't be mistaken for production guidance. Each page's **Status and review** section says what would move it to Proved.

Until research is Proved, a book takes it only as a link: a line pointing the reader to the research page, with no new claims in the book. Where a book already carries design that rests on research still in review, the book says so. The contractor PIV path in Books 03, 04 and 07 is the current example: each place it appears carries a **Pending proof** note pointing to the research page's Proved criteria.

## Agency-neutral books

The books never name a specific agency as their subject, and the workbook is independent analysis, not an official publication of any agency. Research pages may name an agency only as a cited public source for its documented practice, for example its privacy impact assessment or an inspector general report about it. Any recommendation stays agency-neutral, and nothing in the workbook is endorsed by any agency. Products are named because the workbook's examples use them; naming one isn't an endorsement.

## Independent verification passes

A claims log is written by whoever wrote the page, so it can share the page's blind spots. From time to time, a separate pass re-checks a set of pages without relying on their logs: it re-opens each cited source, fetching the raw page or the PDF's full text rather than a summary, and records one verdict per footnoted sentence (supported, partly supported, not supported, source changed, or couldn't open). It fixes mechanical errors directly (a wrong page number, a quote that isn't verbatim, a dead URL with an obvious replacement) and lists every substantive finding as a proposed fix for the author, so a claim isn't changed without review. The first such pass, in October 2026, covered the contractor-source and HR 2.0 shared-governance research and the contractor PIV path in the books. Its ledger is [`docs/research/_verification/verification-pass-2026-10.md`](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/research/_verification/verification-pass-2026-10.md).

## The limits

None of this makes the workbook right. In particular:

- **Checks are point-in-time.** A claim verified on its access date can be wrong a week later. The source watch notices changed pages, not changed meaning, and it can't see text a page draws with JavaScript or sources that block automated requests.
- **Some sources can't be read in full.** Contracts, agency configuration and vendor pricing are often not public, and some pages refuse automated access. Those gaps are listed, not filled.
- **Summaries can drift from the page.** Some checks were made with tools that summarize a page rather than return its exact text. A quote checked that way is weaker evidence until it is checked against the raw page, which is what the independent passes do.
- **Absence is a search, not a proof.** "The source doesn't mention contractors" means a full-text search found nothing, which depends on the search.
- **Design guidance is judgment.** Labelled or not, it is the program's view of how to build something, and it can be wrong in ways no source will reveal. That is why research has a Proved step.
- **The same people write and check most pages.** Independent passes and readers' reports are the counterweight.

## Reporting an error

If a sentence says more than its source, a source has changed, or a link is dead, please open an [issue on GitHub](https://github.com/WhalerMike/modernization-workbook/issues). Name the page and the sentence or footnote, and, if you can, link the source that shows the problem. Corrections go through the same process as everything else: the claim is re-checked, the text is fixed, and the change is recorded in that page's claims log.
