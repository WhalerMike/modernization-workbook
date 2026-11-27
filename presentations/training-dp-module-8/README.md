# Data Platform and SQL Server Identity learning path, Module 8: AD CS Dependencies

**Deck name: Training_DP_Module_8.** The narrated deck for [Module 8: AD CS Dependencies](../../docs/training/data-platform/08-ad-cs-dependencies.md), in the [Data Platform and SQL Server Identity learning path](../../docs/training/data-platform/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the module page's own Lab 1 commands and expected output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why the certificates nobody sees come first; learning objectives and prerequisites |
| Concepts | Three places SQL Server touches AD CS (the TLS certificate, certificate-mapped type C logins and endpoints, certificate-based sign-in); what Microsoft gives you: the TLS certificate's requirements and why expiry differs by class; the issuer decision from *PKI & Certificates* and the class and action the kit puts on every row; the chapter's dangers and the guard against each |
| Lab | Try it: Lab 1 steps 1 to 6, the certificate dependency list on the kit's five fictional certificates: the list, the action for each, the wider warning window, the manifest, the tests and the run list; Lab 2, Runbook R10's reads on a test instance (not run by the authors) |
| Check and summary | The federal requirement (SC-8, SC-12 and SC-17, with KSI-SVC-SIN and KSI-SVC-ASM) and evidence; two knowledge-check questions with answers; the summary and the next step |

| File | Use |
|---|---|
| `Training_DP_Module_8.pptx` | The deck: 15 narrated slides (the title and 14 content slides), then a backup section with the sources |
| `Training_DP_Module_8_Narrated.vtt` | The video's caption track; the Watch page and the module page read it from here, and `scripts/generate_video_manifest.py` lists the video because it is here |
| `Training_DP_Module_8_Narration_Script.md` | The spoken narration, slide by slide (about 1,900 words) |
| `narration_Training_DP_Module_8/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narration was recorded on November 25, 2026. The MP4 is on the videos Release; the narrated deck and the plain deck join the next edition's Release. The video runs about 11 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-dp-module-8/build.js presentations/training-dp-module-8/Training_DP_Module_8.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. The narration names each source by its original publisher (Microsoft Learn, NIST, FedRAMP) or by its title (*Data Platform: SQL Server Identity*, *Building SQL Server Identity*), and spells out the acronyms the voice would misread (A D C S, T L S, P K I, C A, C L M, K S I, I S S O, S C eight, U T C). Every fact on a slide comes from the module page, workbook [Chapter 08](../../docs/project-plans/developer-workbooks/sql-server-identity/08-ad-cs-dependencies.md), the chapters it links (Book 06 [Chapter 22](../../docs/books/b06-data-platform/22-where-sql-server-touches-adcs.md), Book 07 [Chapter 04](../../docs/books/b07-pki/04-the-target-pki.md)) and [Runbook R10](../../docs/books/b06-data-platform/r10-certificate-discovery-for-adcs.md) that the module sends the learner to, or the code, configuration and fixtures in [`examples/sql-server-identity`](../../examples/sql-server-identity/README.md) (`Invoke-SqlCertDependency.ps1`, `config/thresholds.json`, `tests/fixtures/certs`); the deck adds none. The **Try it** output is the module page's Lab 1 expected output, recorded on November 25, 2026 by running the lab against the kit unzipped into `C:\FMWLabs`. Long commands and output are trimmed, wrapped and reflowed, with "..." marking each cut and long `C:/FMWLabs/results/...` paths shortened to `$Run`, as the slides say. The issuer decision stays with the owners of *PKI & Certificates*; the deck doesn't restate it beyond what the module page says. Lab 2 hasn't been run by the authors.
