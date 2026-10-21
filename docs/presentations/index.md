---
title: "Presentations"
subtitle: "The 15-minute Why / What / Who / How decks for every workbook book, with their narrated editions"
description: "Download the PowerPoint decks for the Modernization Workbook books: each book's 15-minute Why / What / Who / How briefing, its narrated self-running edition and its narration script."
doc-type: section-landing
audience: [Executive, Technical, Customer]
family: presentations
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

Every workbook book has a 15-minute briefing that follows the book's four questions: **Why** the topic matters, **What** changes, **Who** owns it, and **How** to do it. Each deck carries full speaker notes, and every slide names the chapter and the primary sources behind it.

- **Deck**: the editable PowerPoint file, for presenting live.
- **Narrated**: the same deck with recorded narration on every slide, set to play by itself.
- **Script**: the narration as text, for practice or for reading instead of watching.

Narrated editions of Books 07 and 08 are being recorded; their decks and speaker notes are ready now.

## Book presentations

| Book | Question | Deck | Narrated | Script |
|---|---|---|---|---|
| [Book 02 — Identity & Directory](../books/b02-identity/index.md) []{#book-02} | Why does identity matter? | [Deck](../../presentations/b02-identity/B02_Identity.pptx) | [Narrated](../../presentations/b02-identity/B02_Identity_Narrated.pptx) (about 13 min) | [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/b02-identity/B02_Identity_Narration_Script.md) |
| [Book 03 — HR-Driven Identity](../books/b03-hr-identity/index.md) []{#book-03} | Why should HR, not IT, decide who exists? | [Deck](../../presentations/b03-hr-identity/B03_HR_Identity.pptx) | [Narrated](../../presentations/b03-hr-identity/B03_HR_Identity_Narrated.pptx) (about 12 min) | [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/b03-hr-identity/B03_HR_Identity_Narration_Script.md) |
| [Book 04 — Access & Privilege](../books/b04-access/index.md) []{#book-04} | Why is every access decision a policy decision? | [Deck](../../presentations/b04-access/B04_Access.pptx) | [Narrated](../../presentations/b04-access/B04_Access_Narrated.pptx) (about 10 min) | [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/b04-access/B04_Access_Narration_Script.md) |
| [Book 05 — Devices & Endpoints](../books/b05-devices/index.md) []{#book-05} | Why can't Group Policy come to the cloud? | [Deck](../../presentations/b05-devices/B05_Devices.pptx) | [Narrated](../../presentations/b05-devices/B05_Devices_Narrated.pptx) (about 12 min) | [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/b05-devices/B05_Devices_Narration_Script.md) |
| [Book 06 — Data Platform: SQL Server Identity](../books/b06-data-platform/index.md) []{#book-06} | Why is the database where legacy authentication hides? | [Deck](../../presentations/b06-data-platform/B06_Data_Platform.pptx) | [Narrated](../../presentations/b06-data-platform/B06_Data_Platform_Narrated.pptx) (about 12 min) | [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/b06-data-platform/B06_Data_Platform_Narration_Script.md) |
| [Book 07 — PKI & Certificates](../books/b07-pki/index.md) []{#book-07} | Why do certificates outlive every migration? | [Deck](../../presentations/b07-pki/B07_PKI.pptx) | Being recorded | In the deck's speaker notes |
| [Book 08 — DNS, DHCP & IPAM](../books/b08-ddi/index.md) []{#book-08} | Why is DNS now the control plane? | [Deck](../../presentations/b08-ddi/B08_DDI.pptx) | Being recorded | In the deck's speaker notes |

## HR-driven identity talk set

A presentation set built from [Book 03 — HR-Driven Identity](../books/b03-hr-identity/index.md) for a 15-minute enterprise data architecture talk. It's the agency-neutral edition: the examples are generic, so any agency can adapt it. The narrated videos (MP4, with captions) are attached to the repository release [hr-identity-interview-2026-10-20](https://github.com/WhalerMike/modernization-workbook/releases/tag/hr-identity-interview-2026-10-20).

| Presentation | Deck | Narrated | Script |
|---|---|---|---|
| Executive cut: Why / What / Who / How in 9 slides, with the full deck as backup | [Deck](../../presentations/hr-driven-identity-interview/HR_Driven_Identity_Exec_AnyAgency.pptx) | [Narrated](../../presentations/hr-driven-identity-interview/HR_Driven_Identity_Exec_AnyAgency_Narrated.pptx) (about 12 min) | [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/hr-driven-identity-interview/HR_Driven_Identity_Exec_AnyAgency_Narration_Script.md) |
| Detailed 16-slide deck | [Deck](../../presentations/hr-driven-identity-interview/HR_Driven_Identity_AnyAgency.pptx) | [Narrated](../../presentations/hr-driven-identity-interview/HR_Driven_Identity_AnyAgency_Narrated.pptx) (about 15 min) | [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/hr-driven-identity-interview/HR_Driven_Identity_AnyAgency_Narration_Script.md) |
| Contractor identity source: who is authoritative for a contractor (Q&A backup) | [Deck](../../presentations/hr-driven-identity-interview/HR_Driven_Identity_Contractor_Source_AnyAgency.pptx) | [Narrated](../../presentations/hr-driven-identity-interview/HR_Driven_Identity_Contractor_Source_AnyAgency_Narrated.pptx) (about 9 min) | [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/hr-driven-identity-interview/HR_Driven_Identity_Contractor_Source_AnyAgency_Narration_Script.md) |

## How the decks are built

The decks are generated from each book's chapters by small scripts in the repository's [`presentations/`](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations) folder, using a shared theme and narration kit in [`presentations/_build/`](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/_build). When a chapter changes, its deck is rebuilt from the same source.
