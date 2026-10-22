# Book 05 — Devices & Endpoints: technical deep dive

The 50-minute technical presentation for [Book 05](../../docs/books/b05-devices/index.md), built with the shared kit in [`../_build/`](../_build/README.md). It's the companion to the 15-minute briefing in [`../b05-devices/`](../b05-devices/README.md), for the architects and engineers who move the fleet to Intune and the servers to Azure Arc. This folder sits outside `docs/`, so the site doesn't render it.

The deck has two parts of about 25 minutes each, split into four modules of 10 to 12 minutes, each opened by a divider slide so it can be watched in parts:

| Part | Module | Chapters |
|---|---|---|
| Orientation | Title; why Group Policy can't come to the cloud; the hybrid-join trap and where device data lives | 01–03 (recap) |
| 1 — Endpoints: onboarding and the GPO sunset | 1. Intune-first onboarding and the paths | 04, 05 |
| | 2. The GPO sunset and policy migration | 07, 08, Appendix A |
| 2 — Servers and the run state | 3. Servers under Azure Arc | 09 |
| | 4. Operating and evidencing the fleet | 10 |

| File | Use |
|---|---|
| `B05_Devices_Technical.pptx` | The deck: 29 narrated slides, then a backup section with the full source lists |
| `B05_Devices_Technical_Narrated.pptx` | Self-running version with the narration embedded and slide timings set (built by `build_narrated.ps1`; not yet generated) |
| `B05_Devices_Technical_Narration_Script.md` | The narration text, for practice (written by `narrate.py`; not yet generated) |
| `narration_B05_Devices_Technical/` | Per-slide audio, durations and captions (written by `narrate.py` and `captions.py`; not yet generated) |
| `build.js` | Slide content and speaker notes; rebuild with the commands in `../_build/README.md` |

Every fact on the slides comes from a footnoted chapter of Book 05; each slide's notes name the chapter, each slide carries a short Sources line, and the two backup slides list the primary sources in full. The release-stage and government-cloud caveats (public preview, GCC versus GCC High and DoD, Azure Government) are kept as the book states them. The slides show tables, flows and decision matrices; the scripts and policy payloads stay in the chapters and Appendix A, where they're marked as illustrative and untested against a production tenant.

`build.js` computes each slide's timing cue from its word count (142 words a minute), prints the minutes per module, and warns when a table, panel or flow step is likely to overflow.
