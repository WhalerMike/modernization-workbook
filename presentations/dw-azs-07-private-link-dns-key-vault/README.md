# Building Azure Security, Chapter 07 — Private Link, DNS and Key Vault: narrated tour

**Deck name: DW_AZS_07_Private_Link_DNS_Key_Vault.** A narrated tour of [Chapter 07 — Private Link, DNS and Key Vault](../../docs/project-plans/developer-workbooks/azure-security/07-private-link-dns-and-key-vault.md) in the developer workbook *Building Azure Security*. It is built with the shared kit in [`../_build/`](../_build/README.md): the slides and notes are data in `build.js`, laid out by [`../_build/devwb.js`](../_build/devwb.js). This folder sits outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `DW_AZS_07_Private_Link_DNS_Key_Vault.pptx` | The deck: 13 narrated slides (the title and content slides in Why, What, Who and How order), then a backup section with the chapter's footnotes in full |
| `DW_AZS_07_Private_Link_DNS_Key_Vault_Narrated.pptx` | The self-running edition: narration audio and a caption track on every slide, backup section dropped (not built yet) |
| `DW_AZS_07_Private_Link_DNS_Key_Vault_Narrated.mp4` | The video, about 8 minutes, for the videos release (not exported yet) |
| `DW_AZS_07_Private_Link_DNS_Key_Vault_Narration_Script.md` | The spoken narration, slide by slide (about 1,480 words) |
| `build.js` | The slides, the spoken narration (`say`), the presenter detail (`detail`) and the chapter footnotes each slide cites (`cite`) |

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `DATECODE="YYYY-MM-DD HH:MM ET" node presentations/dw-azs-07-private-link-dns-key-vault/build.js`, with the Eastern time taken from PowerShell. Then `narrate.py`, `captions.py`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README; `qa_export.ps1` checks the layout through PowerPoint.

## Notes and sourcing

Each slide's speaker notes have three parts: the narration (the only part spoken), a Detail part with the chapter's full content for a presenter, and the chapter footnotes the slide relies on, in full, ending with the chapter sections it draws on. Every fact comes from the chapter; the deck adds none. Lab 1 slides show the kit's real output on its fictional fixtures (`data/kit-captures/azs/`). The chapter is a draft awaiting the owner's review, and the title slide says so; the example code is illustrative and tested against fixtures, not run against a live subscription. If the chapter changes, the tour is rebuilt and re-recorded.
