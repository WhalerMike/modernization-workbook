---
title: "The One-Page Ask"
subtitle: "A fill-in page for the meeting where leadership approves the pre-flight"
description: "A one-page, fill-in template for asking leadership to approve the four-week pre-flight: the decision in one sentence, four local numbers, the external clocks, the sponsor's questions and the recorded outcome. Word download included."
doc-type: workbook-guide
audience: [Executive, Customer]
family: guides
status: baseline
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
review-status: approved
reviewed-sha256: 70fcc6d5790c8be9496d6f8bcc3d47f704b8a3e7533b31c1ac70cf920c7df667
last-reviewed: 2026-11-07
---
# The One-Page Ask {.unnumbered}

[Making the Case at Your Agency](../../start-here.md#the-start-series), Episode 4 of the Start series, tells you to bring a one-page ask to the meeting. This is that page. Copy it, fill it in and leave the room with one decision recorded, whatever it is.

| Download | Use |
|---|---|
| [The_One_Page_Ask.docx](files/The_One_Page_Ask.docx) | The form below, one page, ready to fill in |

::: {.callout-note}
## Design guidance
The one-page framing and the four local numbers are this workbook's design guidance, so adapt them freely. The dates and rules come from the chapters linked below, where each is footnoted to its primary source. Check them again before the meeting.
:::

## How to fill it in

| Field | Where it comes from | Read this first |
|---|---|---|
| The decision | Name a real sponsor, steward and start date. Put Gate G0 about four weeks after the start. | [Book 01, Chapter 12: Where to start](../b01-transformation-arc/12-migration-roadmap.md#where-to-start) |
| Windows Server 2019 count | Your server inventory. Confirm no 2016 server remains. An estimate is fine if you label it; the read-only assessment replaces it. | [Book 00, Chapter 01](../b00-orientation/01-why-modernize-now.md#the-workbooks-server-standard) |
| Contractors outside HR | Your contract and sponsorship records, compared with the HR system. | [Book 03, Chapter 03](../b03-hr-identity/03-federal-hr-2-0.md) |
| Time for a leaver to lose access | A recent set of separations: the days from the HR record to the last account disabled. Say how many you checked. | [Book 03, Chapter 02](../b03-hr-identity/02-why-hr-is-the-source-of-authority.md) |
| Federal HR 2.0 wave and dates | Your agency's HR office. | [Book 03, Chapter 03](../b03-hr-identity/03-federal-hr-2-0.md) |
| The clocks | Keep the ones that apply to your estate and add your own. | [Book 00, Chapter 01](../b00-orientation/01-why-modernize-now.md) |
| Before saying yes | Answer honestly. A hesitation in the room is useful too. | [Book 01, Chapter 09](../b01-transformation-arc/09-who-leads-the-transformation.md#how-a-sponsor-evaluates-the-program) |

Name the wider set of roles on the [Charter Sign-Off Sheet](charter-sign-off-sheet.md).

## The form

<!-- form-start -->
**Organization:** \[name\]    **Meeting date:** \[date\]    **Prepared by:** \[name\]

**The decision**

Approve the four-week pre-flight, sponsored by \[executive\], run by \[steward\], starting \[date\], with Gate G0 on \[date\].

**Why now**

The dates are set outside the agency, and access, devices, data and certificates all decide on who or what is asking, so identity has to be authoritative first. This first step needs no vendor decision. It produces an inventory, an owner and a date.

**Our four numbers**

| Number | Ours | Why it matters |
|:------------|:---|:--------------|
| Windows Server 2019 servers, with no 2016 server left | | Server 2019 support ends January 9, 2029 |
| Contractors outside the HR system | | Federal HR 2.0 covers federal employees only |
| Days for a leaver to lose access, from the HR record to the last account disabled | | Accounts should follow separation, and this number is the before and after |
| Our Federal HR 2.0 wave and dates | | The chance to design identity in closes when HR connections go live |

**The clocks that apply to us**

| Clock | Date | Our exposure |
|:------------|:-----|:----------|
| Windows Server 2016 end of support | January 12, 2027 | |
| FedRAMP Consolidated Rules for 2026 mandatory | January 1, 2027 | |
| Windows Server 2019 end of support | January 9, 2029 | |
| \[Another clock\] | \[date\] | |

**Before saying yes**

- ☐ The authoritative source is in version control, not a vendor portal or shared drive.
- ☐ Every production change can be traced to a signed commit.
- ☐ Drift detection is continuous, not quarterly.
- ☐ The target surface comes from plan artifacts, so every change has a rollback.
- ☐ The platform host is one hardened Tier-0 box.
- ☐ Every row of the decision matrix has one named decider, and the authorizing official has agreed to the risk-acceptance rows.

**The outcome**

☐ Approved    ☐ Approved with changes    ☐ Not now, because \[reason\]

**Decided by:** \[name\]    **Date:** \[date\]    **Next step:** \[step, owner, date\]
<!-- form-end -->

::: {.callout-tip}
## Continue
[Charter Sign-Off Sheet →](charter-sign-off-sheet.md) · [Start Here](../../start-here.md)
:::

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

**Version 2.0**, in [edition 2026.11.5](../../about/archive.md#edition-2026-11-5) (November 8, 2026). Every edition is kept on the [Archive](../../about/archive.md) page; every change between editions is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/guides/one-page-ask.md).

| Version | Edition | Date | Changes |
|---|---|---|---|
| 2.0 | [2026.11.5](../../about/archive.md#edition-2026-11-5) | 2026-11-08 | Release 2.0, the baseline: checked against every other book; Draft becomes Baseline; Meeting pack: The One-Page Ask, Charter Sign-Off Sheet and four reader briefs ([#390](https://github.com/WhalerMike/modernization-workbook/pull/390)); Approve 116 gated pages (Nov 7); fix RMF map stale-review test ([#457](https://github.com/WhalerMike/modernization-workbook/pull/457)); Release 2.0: Draft becomes Baseline ([#491](https://github.com/WhalerMike/modernization-workbook/pull/491)) |

: Versions of this guide, newest first {.striped .hover}

<!-- revisions:end -->
