# Data Platform and SQL Server Identity learning path, Module 6: NTLM and the SPNs

**Deck name: Training_DP_Module_6.** The narrated deck for [Module 6: NTLM and the SPNs](../../docs/training/data-platform/06-ntlm-and-the-spns.md), in the [Data Platform and SQL Server Identity learning path](../../docs/training/data-platform/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the module page's own Lab 1 commands and expected output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why most NTLM is a missing or misplaced name; learning objectives and prerequisites |
| Concepts | What Microsoft gives you: the SPN formats and the table of SPN states; the patterns that generate NTLM at the SQL layer (missing or incorrect SPN, cross-site connections, linked-server passthrough, non-domain-joined clients); discovery first: the kit's NTLM audit, the fix it writes for each pattern, and the two patterns it doesn't detect; the chapter's dangers and the guard against each |
| Lab | Try it: Lab 1 steps 1 to 7, the NTLM audit on the kit's fixtures: the day-1 run, the fix file, every fix including those that aren't `setspn`, the day-30 run, the manifest, the tests and the run list; Lab 2, the audit and one SPN fix on a test domain and instance (not run by the authors) |
| Check and summary | The federal requirement (CM-6 with KSI-SVC-ACM; IA-2, no KSI pairing in the kit) and evidence; two knowledge-check questions with answers; the summary and the next step |

| File | Use |
|---|---|
| `Training_DP_Module_6.pptx` | The deck: 16 narrated slides (the title and 15 content slides), then a backup section with the sources |
| `Training_DP_Module_6_Narrated.vtt` | The video's caption track; the Watch page and the module page read it from here, and `scripts/generate_video_manifest.py` lists the video because it is here |
| `Training_DP_Module_6_Narration_Script.md` | The spoken narration, slide by slide (about 2,100 words) |
| `narration_Training_DP_Module_6/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narration was recorded on November 25, 2026. The MP4 is on the videos Release; the narrated deck and the plain deck join the next edition's Release. The video runs about 12 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-dp-module-6/build.js presentations/training-dp-module-6/Training_DP_Module_6.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. The narration names each source by its original publisher (Microsoft Learn, NIST, FedRAMP) or by its title (*Data Platform: SQL Server Identity*, *Building SQL Server Identity*), and spells out the acronyms the voice would misread (N T L M, S P N, K S I, I S S O, C M six, I A two, U T C). Every fact on a slide comes from the module page, workbook [Chapter 06](../../docs/project-plans/developer-workbooks/sql-server-identity/06-ntlm-and-the-spns.md), the Book 06 chapters it links ([Chapter 14](../../docs/books/b06-data-platform/14-ntlm-and-the-patterns-that-generate-it.md) and [Chapter 15](../../docs/books/b06-data-platform/15-the-three-phases-of-ntlm-elimination.md)) and [Runbook R06](../../docs/books/b06-data-platform/r06-ntlm-detection-and-remediation.md) that the module sends the learner to, or the code, configuration and fixtures in [`examples/sql-server-identity`](../../examples/sql-server-identity/README.md) (`Invoke-SqlNtlmAudit.ps1`, `tests/fixtures`); the deck adds none. The **Try it** output is the module page's Lab 1 expected output, recorded on November 25, 2026 by running the lab against the kit unzipped into `C:\FMWLabs`. Long commands and output are trimmed, wrapped and reflowed, with "..." marking each cut and long `C:/FMWLabs/results/...` paths shortened to `$Run`, as the slides say. Two of the source book's patterns aren't detected by the kit (cross-site connections, SPN forms other than TCP), and the slides say so; Lab 2 hasn't been run by the authors.
