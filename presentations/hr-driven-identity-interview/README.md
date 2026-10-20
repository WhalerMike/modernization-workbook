# HR-Driven Identity Modernization: interview presentation set

The presentation built from the [Book 03 — HR-Driven Identity](../../docs/books/b03-hr-identity/index.md) workbook series, delivered as a 15-minute Enterprise Data Architect interview talk. This is the agency-agnostic edition: the examples are generic, and any agency can adapt it.

This folder sits outside `docs/`, so the Quarto site doesn't render it.

## What to use

| Purpose | File |
|---|---|
| **Executive cut (current).** Why / What / Who / How in 9 slides, including a logical-to-physical data model slide and a closing slide of related modernizations, then the full deck and a Sources slide as backup | `HR_Driven_Identity_Exec_AnyAgency.pptx` |
| Self-running narrated version of the 9 slides (11:43) | `HR_Driven_Identity_Exec_AnyAgency_Narrated.pptx` |
| Practice script (the narration text) | `HR_Driven_Identity_Exec_AnyAgency_Narration_Script.md` |
| Earlier 16-slide detailed deck | `HR_Driven_Identity_AnyAgency.pptx` |
| Narrated 16-slide deck (15:24) and its script | `HR_Driven_Identity_AnyAgency_Narrated.pptx`, `HR_Driven_Identity_AnyAgency_Narration_Script.md` |
| **Contractor Identity Source**: companion deck on who is authoritative for a contractor (Q&A backup, not part of the talk), with its narrated version (8:04) and script | `HR_Driven_Identity_Contractor_Source_AnyAgency.pptx`, `HR_Driven_Identity_Contractor_Source_AnyAgency_Narrated.pptx`, `HR_Driven_Identity_Contractor_Source_AnyAgency_Narration_Script.md` |
| Closed captions (WebVTT) for the three narrated videos | `HR_Driven_Identity_Exec_AnyAgency_Narrated.vtt`, `HR_Driven_Identity_AnyAgency_Narrated.vtt`, `HR_Driven_Identity_Contractor_Source_AnyAgency_Narrated.vtt` |

The narrated videos (MP4, over 100 MB each) exceed GitHub's file limit, so they're attached to the release
[hr-identity-interview-2026-10-20](https://github.com/WhalerMike/modernization-workbook/releases/tag/hr-identity-interview-2026-10-20)
rather than committed here. Each `.vtt` file is the caption track for the video of the same name.

The decks label each claim: verified public information, the presenter's observations, proposed architecture, and planning assumptions to validate with the responsible data owners. The backup slide "Sources behind the executive slides" carries the assumptions note.

Other contents:
- `narration_*/`: the per-slide audio clips and their durations.
- `HRIT_Loss_Assessment.md`: what the HR-driven-identity framing kept and dropped from the earlier HRIT corpus.

## Sources

The executive slides cite primary sources only. The backup deck's "Sources behind the executive slides" slide lists them, including:
- NIST FIPS 201-3 and SP 800-53 Rev. 5 PS-4.
- The OMB/OPM "Federal HR 2.0" memo of December 10, 2025.
