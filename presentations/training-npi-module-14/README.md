# Non-Person Identity learning path, Module 14: Workload identity across AWS GovCloud (US) and OCI

**Deck name: Training_NPI_Module_14.** The narrated deck for [Module 14: Workload identity across AWS GovCloud (US) and OCI](../../docs/training/non-person-identity/14-workload-identity-across-aws-govcloud-and-oci.md), in the [Non-Person Identity learning path](../../docs/training/non-person-identity/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why an access key is a service account's password (WD-171, WD-172); learning objectives and prerequisites |
| Concepts | What AWS, Oracle and Microsoft say; the guide's Step 1g and 1h exports and the join to the record by the `SystemId`, `Owner1`, `Owner2` and `Sponsor` tags; the checks NPI-AWS-01 to -16 and NPI-OCI-01 to -10, VK-NPI-10, and what's still unknown |
| Lab | Try it: Lab 1 steps 1 to 8, Chapter 13's checks on the kit's fixtures: the run, the findings, the long-lived credentials, who isn't joined and one OIDC trust, the run without the optional files, the evidence, the tests and the cleanup; Lab 2, the same checks on a test account's and tenancy's exports (not run by anyone) |
| Check and summary | The federal requirement (AC-2, CM-8, IA-4, IA-5, IA-5(2), SC-17, AC-6, AC-2(3)) and evidence; two knowledge-check questions with answers; the summary and the next step |

| File | Use |
|---|---|
| `Training_NPI_Module_14.pptx` | The deck: 16 narrated slides (the title and 15 content slides), then a backup section with the sources |
| `Training_NPI_Module_14_Narrated.vtt` | The video's caption track; the Watch page and the module page read it from here, and `scripts/generate_video_manifest.py` lists the video because it is here |
| `Training_NPI_Module_14_Narration_Script.md` | The spoken narration, slide by slide (about 2,100 words) |
| `narration_Training_NPI_Module_14/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narration was recorded on November 24, 2026. The MP4 is on the videos Release; the narrated deck and the plain deck join the next edition's Release. The video runs about 13 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-npi-module-14/build.js presentations/training-npi-module-14/Training_NPI_Module_14.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. The narration names each source by its original publisher (AWS, Oracle, Microsoft Learn, NIST, FedRAMP) and spells out the acronyms the voice would misread (O C I, O C 2, O I D C, C R L, S T S, K S I). Every fact on a slide comes from the module page, the implementation guide's [Steps 1g, 1h](../../docs/books/guides/non-person-identity-implementation.md#step-1g-aws) and [4f](../../docs/books/guides/non-person-identity-implementation.md#step-4f-aws-oci) and workbook [Chapter 13](../../docs/project-plans/developer-workbooks/non-person-identity/13-workload-identity-across-aws-govcloud-and-oci.md) that the module sends the learner to, or the code, configuration and fixtures in [`examples/non-person-identity`](../../examples/non-person-identity/README.md) (`Invoke-NpiCloudWorkload.ps1`, `powershell/NpiCloudWorkload`, `tests/fixtures/ch13`); the deck adds none. The **Try it** output is the kit's captures of Chapter 13's Lab 1, [`data/kit-captures/npi/13-1.txt`](../../data/kit-captures/npi/13-1.txt) to `13-8.txt`, written by `scripts/kit_captures.py` on the fictional fixtures with `-AsOf 2026-11-24`. Long commands and output are trimmed, wrapped and reflowed, with "..." marking each cut, as the slides say. The chapter's labels carry over: the 90-day inactivity window is design guidance, and the open questions stay open (GovCloud and Entra federation, Access Analyzer's unused-access findings in GovCloud, OC2's workload principals, the OCI CLI's output field names); Lab 2 hasn't been run by anyone.
