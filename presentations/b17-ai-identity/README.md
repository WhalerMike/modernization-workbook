# Book 17 — AI Identity Governance: presentation

The 15-minute Why / What / Who / How briefing for [Book 17](../../docs/books/b17-ai-identity/index.md), built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it. The audience is Chief AI Officers, CIOs and CISOs, identity and security operations teams, ISSOs, and authorizing officials.

| File | Use |
|---|---|
| `B17_AI_Identity.pptx` | The deck: fourteen narrated slides (the title and thirteen content slides), then a backup section with the full source list |
| `B17_AI_Identity_Narration_Script.md` | The narration text, for practice (written by `../_build/narrate.py`) |
| `narration_B17_AI_Identity/` | Per-slide audio, durations, sentence timings and WebVTT caption tracks |
| `B17_AI_Identity_Narrated.vtt` | One caption track for the whole narration (written by `../_build/captions.py`), for an MP4 |
| `build.js` | Slide content and speaker notes; rebuild with the commands in `../_build/README.md` |

The self-running `B17_AI_Identity_Narrated.pptx` (and an MP4) is built from these files by `../_build/build_narrated.ps1` on a machine with PowerPoint.

Every fact on the slides comes from a footnoted chapter of Book 17; each slide's notes name the chapter, and the last slide lists the primary sources. Federal, NIST, CISA, FedRAMP and Microsoft facts were checked by the book's chapters against their sources on October 21–22, 2026. Release stages and government-cloud availability change by the month: Microsoft Entra Agent ID was announced generally available in April 2026, agent targeting in Conditional Access is still labeled preview, agent identities support only Block, and no availability is published for GCC High or DoD, so recheck each before a plan rests on it. There is no AI-specific authorization to operate; AI systems go through the agency's existing authorization. The deck, like the book, keeps the term "AI" while noting that Executive Order 14434 asks agencies to say "Super Intelligence" in their own non-statutory documents. Inventory counts are the book's own computations on OMB's published 2025 files: answers to reconcile, not findings against any agency. Sponsors, grace periods, severities and the scan are the program's design, as the book labels them, not federal requirements. The timing cue at the start of each slide's notes is worked out by `build.js` from the spoken words at about 142 words a minute, so it stays right when the notes are edited.
