# HR-Driven Identity Modernization: interview presentation set

The presentation built from the [HR-Driven Identity](../../docs/hr-driven-iam/) workbook series, delivered as a 15-minute Enterprise Data Architect interview talk. It comes in two editions:

- **SSA edition.** The version given internally at SSA. It names SSA, its systems (Mainframe PIN, HR Operational Data Store) and SSA OIG reports.
- **Any Agency edition.** The same talk, made agency-agnostic for other agencies.

This folder sits outside `docs/`, so the Quarto site doesn't render it.

## What to use

| Purpose | SSA edition | Any Agency edition |
|---|---|---|
| **Executive cut (current).** Why / What / Who / How in 7 slides, then the full deck and a Sources slide as backup | `HR_Driven_Identity_Exec_SSA.pptx` | `HR_Driven_Identity_Exec_AnyAgency.pptx` |
| Self-running narrated version of the 7 slides | `HR_Driven_Identity_Exec_SSA_Narrated.pptx` | `HR_Driven_Identity_Exec_AnyAgency_Narrated.pptx` |
| Practice script (the narration text) | `HR_Driven_Identity_Exec_SSA_Narration_Script.md` | `HR_Driven_Identity_Exec_AnyAgency_Narration_Script.md` |
| Earlier 16-slide detailed deck | `HR_Driven_Identity_SSA.pptx` | `HR_Driven_Identity_AnyAgency.pptx` |

The narrated videos (MP4, 105–165 MB each) exceed GitHub's 100 MB file limit, so they're attached to the release
[hr-identity-interview-2026-10-20](https://github.com/WhalerMike/modernization-workbook/releases/tag/hr-identity-interview-2026-10-20)
rather than committed here.

Other contents:
- `superseded/`: earlier drafts.
- `narration_*/`: the per-slide audio clips and their durations.
- `HRIT_Loss_Assessment.md`: what the HR-driven-identity framing kept and dropped from the earlier HRIT corpus.
- The top-level `*.js` and `*.py` files: the build and patch history of the decks.

## Rebuilding

`build/` holds the deck kit. It uses pptxgenjs, with react-icons rendered to PNG via sharp for the icons.

```bash
cd build
npm install pptxgenjs react react-dom react-icons sharp
node icons.js                                  # renders icons/ (already committed)
python exec_build.py                           # writes build_Exec_SSA.js and build_Exec_AnyAgency.js
SKILL=<pptx-skill-dir> node build_Exec_SSA.js HR_Driven_Identity_Exec_SSA.pptx
```

- `exec.js`: the seven executive slides. One source serves both editions.
- `slides4.js`, `personal.js`, `teaser.js`: the detailed deck.
- `editions.py`: derives the Any Agency edition and fails if SSA-specific terms remain.
- `narrate.py`: speaker notes to neural-voice MP3s (edge-tts). It stops at the Backup divider and retries truncated clips.
- `build_narrated.ps1`: embeds the audio and timings and exports the MP4. It needs PowerPoint on Windows.

## Sources

The executive slides cite primary sources only. The backup deck's "Sources behind the executive slides" slide lists them:
- SSA OIG reports 142302 (Insider Threat Program), 142603 (FY 2026 FISMA) and 042512 (AWS Connect), all September 2026.
- SSA's data.gov entry US-GOV-SSA-469 (HR Operational Data Store Core Services).
- NIST FIPS 201-3 and SP 800-53 Rev. 5 PS-4.
- The OMB/OPM "Federal HR 2.0" memo of December 10, 2025.
