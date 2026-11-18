# Building Global Secure Access — One Pilot Ring, Decision to Go: narrated story deck

**Deck name: GSA_Story_One_Pilot_Ring.** A narrated story deck for the developer workbook [*Building Global Secure Access*](../../docs/project-plans/developer-workbooks/global-secure-access/index.md). Instead of one chapter at a time, it teaches the whole workbook through one case followed end to end: the pilot ring of the fictional tenant `contoso.example`, on November 16, 2026, and the same tenant two weeks later at ring 1. It is built with the shared helpers in [`../attribute-driven-migration-technical-part-1/slides.js`](../attribute-driven-migration-technical-part-1/slides.js) and the code-panel and scene helpers of the Provider Notices story deck, on the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

## The case

Every value on the slides comes from [`examples/global-secure-access/tests/fixtures`](../../examples/global-secure-access/tests/fixtures) (`pilot` and `ring1`, fictional), and every terminal panel is a workbook chapter's Lab 1 command with the output it printed, read at build time from [`data/kit-captures/gsa/`](../../data/kit-captures/gsa) (trimmed where the slide says so). The workbook targets Microsoft 365 GCC (Moderate) with commercial Azure.

| Scene | What happens to the pilot | Chapter | Try it (Lab 1 captures) |
|---|---|---|---|
| Opening | The case and its path through the nine chapters, in the guide's run order | Index | — |
| 1 The decision | Internet Access decided on a preview whose GCC availability isn't stated; the interim path | 01 | `01-4`, `01-5` |
| 2 Export and logs | The collection and its manifest; a category the diagnostic setting leaves out | 02 | `02-4`, `02-6` |
| 3 The client | 83.3% coverage; one device behind the rest | 03 | `03-4` |
| 4 Microsoft traffic | The sign-in share under target; the first plan, approved by its hash | 04 | `04-3`, `04-5` |
| 5 Compliant network | Three report-only failures the service carried; the plan holds enforcement | 05 | `05-3`, `05-4`, `05-6` |
| 6 Private apps | A Finance app that is a VPN again; plain MFA on RDP | 06 | `06-4` |
| 7 Web and TLS | An expired bypass; QUIC by the interim path; a certificate near expiry | 07 | `07-4`, `07-6` |
| 8 Rings and evidence | No-go for the pilot, Go for ring 1; the rollback and the evidence | 08 | `08-3`, `08-4` |
| 9 Test, then production | The runbook's preflight, smoke test, evidence and production preflight, as the page prints them | 09 | The page's fixture output (Chapter 09 has no Lab 1) |
| Close | Lab 2 in your own test tenant; the workbook, the tours, the learning path and the guide | 01–09 | — |

Each scene has a story slide (the beat, the code that handles it, and the controls the guide maps to the step), a **Try it** slide and a one-question **check** slide. The check's answer opens the next slide's narration and is in the check slide's notes.

## Files

| File | Use |
|---|---|
| `GSA_Story_One_Pilot_Ring.pptx` | The deck: 30 narrated slides (the title, one opening slide, three per scene, one extra Try it for Scene 9's runbook output and a closing slide), then a backup section with two source lists |
| `GSA_Story_One_Pilot_Ring_Narrated.pptx` | The self-running edition: narration audio and a caption track on every slide, backup section dropped (built by the export step) |
| `GSA_Story_One_Pilot_Ring_Narrated.mp4` | The video, for the videos release (not uploaded yet) |
| `GSA_Story_One_Pilot_Ring_Narration_Script.md` | The spoken narration, slide by slide |
| `narration.json` | One `{slide, title, say}` entry per narrated slide, which `narrate.py` speaks |
| `build.js` | The slides, the spoken narration and the presenter detail |

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/gsa-story-one-pilot-ring/build.js presentations/gsa-story-one-pilot-ring/GSA_Story_One_Pilot_Ring.pptx`. Then `narrate.py`, `captions.py`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README.

## Notes and sourcing

Facts come only from the workbook's chapters, their footnotes and the captures; the deck adds none. Narration names the original sources (Microsoft Learn, CISA, NIST, FedRAMP), never a book by number. The workbook has been reviewed and approved, and the deck says so. The example code is illustrative and tested against fixtures, not proven against a live tenant; no Lab 2 and no runbook step has been run by the authors.
