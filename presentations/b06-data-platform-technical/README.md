# Book 06 — Data Platform: SQL Server Identity: technical deep dive

Deck name: **B06_Data_Platform_Technical**. A 50-minute technical session for [Book 06](../../docs/books/b06-data-platform/index.md), built with the shared kit in [`../_build/`](../_build/README.md). The 15-minute Why / What / Who / How briefing is in [`../b06-data-platform/`](../b06-data-platform/README.md). This folder sits outside `docs/`, so the site doesn't render it.

It has two parts of about 25 minutes each, split into five modules. Each module opens with a section-divider slide that carries a map of all five.

| Module | Part | Slides | Source |
|---|---|---|---|
| 1 — The inheritance and the estate | Strategy | Windows Authentication, the three drivers and the 2027 dates, inventory and the gate | Chapters 01–06 |
| 2 — The audit, the principals and the decision | Strategy | Authentication audit, Arc-eligibility categories and layers, three principal types, parallel run and the five decisions | Chapters 07–08, 11–12 |
| 3 — NTLM, applications and closure | Strategy | Four NTLM patterns, three phases, the four-class pattern on two axes, the closure condition | Chapters 14–15, 18, 20 |
| 4 — Runbooks R01–R05 | The runbooks for DBAs | Prerequisites, discovery and the gate, the audit, Arc and the managed identity, login migration | Runbooks R01–R05 |
| 5 — Runbooks R06–R10 | The runbooks for DBAs | NTLM, groups and the CA perimeter, connection strings, continuous monitoring, AD CS certificates; closing slide | Runbooks R06–R10 |

Every runbook slide uses the same layout: the steps on the left, then the gate, the evidence and the rollback or safety notes on the right, with a badge saying whether the runbook is read-only or review-required.

| File | Use |
|---|---|
| `B06_Data_Platform_Technical.pptx` | The deck: 28 narrated slides (title, five module dividers, 22 content slides), then a backup section with the full source list |
| `B06_Data_Platform_Technical_Narration_Script.md` | The narration text, for practice |
| `narration_B06_Data_Platform_Technical/` | Per-slide audio, durations, sentence timings and per-slide WebVTT captions |
| `B06_Data_Platform_Technical_Narrated.vtt` | Whole-video caption track |
| `build.js` | Slide content and speaker notes; rebuild with the commands in `../_build/README.md` |

Every fact on the slides comes from a footnoted chapter or runbook of Book 06. Each slide carries a short `Sources:` line, each slide's notes end with the chapter or runbook they come from, and the backup slides list the primary sources. The notes open with a timing cue at 142 words per minute (about 7,100 spoken words in all). `build.js` also prints a rough text-fit estimate for every text box and table, and warns if one looks too full.
