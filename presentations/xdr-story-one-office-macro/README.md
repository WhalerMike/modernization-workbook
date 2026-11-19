# Building Defender XDR — One Office Macro, End to End: narrated story deck

**Deck name: XDR_Story_One_Office_Macro.** A narrated story deck for the developer workbook [*Building Defender XDR*](../../docs/project-plans/developer-workbooks/defender-xdr/index.md). Instead of one chapter at a time, it teaches the whole workbook through one case followed end to end: a macro document, `invoice.docm`, opened on the ring 0 workstation `WKS-R0-01`, tries to start encoded PowerShell. It is built with the shared helpers in [`../attribute-driven-migration-technical-part-1/slides.js`](../attribute-driven-migration-technical-part-1/slides.js) and the deeper dive's code-panel helper, on the shared kit in [`../_build/`](../_build/README.md), in the same shape as the provider notices story deck. This folder sits outside `docs/`, so the site doesn't render it.

## The case

Every value on the slides comes from [`examples/defender-xdr/tests/fixtures`](../../examples/defender-xdr/tests/fixtures) (fictional), and every terminal panel for Scenes 1 to 8 is a workbook chapter's Lab 1 command with the output it printed, read at build time from [`data/kit-captures/xdr/`](../../data/kit-captures/xdr) (trimmed where the slide says so). Tying the fixture items into one story is the deck's own framing (design guidance): the ASR event `AsrOfficeChildProcessBlocked` on `WKS-R0-01` for `invoice.docm`, incident 1001 and the custom detection `contoso-office-encoded-powershell`.

| Scene | What happens | Chapter | Try it |
|---|---|---|---|
| Opening | The case and its path through the nine chapters | Index | — |
| 1 Who may respond | Roles through PIM, the read path in the tenant's own cloud | 01 | `01-1` |
| 2 Is it seen | Coverage against the inventory; ring 0 protected | 02 | `02-1` |
| 3 Prevention | Network protection by ring; a ring 2 device with it off | 03 | `03-2` |
| 4 The rule | The Office child-process rule, ring by ring; ring 1's next value | 04 | `04-2`, `04-4` |
| 5 The incident | Incident 1001 against the severity table; Exposure Management's GCC disposition | 05 | `05-3`, `05-4` |
| 6 The detection | The rule as code: tested, planned, its hash | 06 | `06-2`, `06-3` |
| 7 Signals and automation | The cross-source query; device groups against the ladder | 07 | `07-2` |
| 8 The month's evidence | The monthly run, the metrics, a tampered file caught | 08 | `08-1`, `08-2`, `08-6` |
| 9 Test, then production | The runbook publishes the rule, dry run first; the go/no-go | 09 | The page's fixture-mode output (Chapter 09 has no Lab 1) |
| Close | Lab 2 in your own test tenant; the workbook, the tours, the learning path and the guide | 01–09 | — |

Each scene has a story slide (the beat, the code that handles it, and the federal requirement from the guide's gate) and a **Try it** slide; Scenes 1 to 8 end with a one-question **check** whose answer opens the next slide's narration and is in the check slide's notes.

## Files

| File | Use |
|---|---|
| `XDR_Story_One_Office_Macro.pptx` | The deck: 29 narrated slides, then a backup section with two source lists |
| `XDR_Story_One_Office_Macro_Narrated.pptx` | The self-running edition: narration audio and a caption track on every slide, backup section dropped (built by the export run) |
| `XDR_Story_One_Office_Macro_Narrated.mp4` | The video, for the videos release (not uploaded yet) |
| `XDR_Story_One_Office_Macro_Narration_Script.md` | The spoken narration, slide by slide |
| `narration.json` | One `{slide, title, say}` per narrated slide, written by the build, which `narrate.py` speaks |
| `build.js` | The slides, the narration and the presenter detail |

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/xdr-story-one-office-macro/build.js presentations/xdr-story-one-office-macro/XDR_Story_One_Office_Macro.pptx`. Then `narrate.py`, `captions.py`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README.

## Notes and sourcing

Narration names the original sources (Microsoft Learn, NIST, FedRAMP) or this workbook's guidance, and says "supports", never more. The workbook has been reviewed and approved; the code is illustrative, tested against fixtures, and Chapter 09's runbook hasn't been run against a live tenant.
