# Building Azure Security — One Portal, End to End: narrated story deck

**Deck name: AZS_Story_One_Portal.** A narrated story deck for the developer workbook [*Building Azure Security*](../../docs/project-plans/developer-workbooks/azure-security/index.md). Instead of one chapter at a time, it teaches the whole workbook through one case followed end to end: the fictional Contoso portal in the kit's fixtures (the online subscription and the hub that serves it), from the landing-zone baseline to the deployment runbook. It is built with the shared helpers in [`../attribute-driven-migration-technical-part-1/slides.js`](../attribute-driven-migration-technical-part-1/slides.js) on the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

Every value comes from [`examples/azure-security/tests/fixtures`](../../examples/azure-security/tests/fixtures) (`week1` and `week2`, fictional), and every terminal panel is a chapter's Lab 1 command with the output it printed, read at build time from [`data/kit-captures/azs/`](../../data/kit-captures/azs) (trimmed where the slide says so). Chapter 09 has no Lab 1; its slide quotes the page's dated fixture-mode output. Nine scenes, one per chapter, each with a story slide, a **Try it** slide and a one-question **check** slide whose answer opens the next slide's narration and sits in the check's notes.

| File | Use |
|---|---|
| `AZS_Story_One_Portal.pptx` | The deck: 30 narrated slides, then a backup section with the source lists |
| `AZS_Story_One_Portal_Narrated.pptx` | The self-running edition (not built yet) |
| `AZS_Story_One_Portal_Narrated.mp4` | The video, about 16 minutes, for the videos release (not exported yet) |
| `AZS_Story_One_Portal_Narration_Script.md` | The spoken narration, slide by slide |
| `narration.json` | The spoken narration per slide, which `narrate.py` reads |
| `build.js` | The slides, the narration and the notes |

Build (Git Bash): `source /c/tmp/deckenv.sh && node presentations/azs-story-one-portal/build.js presentations/azs-story-one-portal/AZS_Story_One_Portal.pptx`, then `narrate.py`, `captions.py`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The workbook's chapters are drafts awaiting the owner's review, and the deck says so.
