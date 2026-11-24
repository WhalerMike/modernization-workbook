# Companion guide — Non-Person Identity: Zero Trust, SASE and Other Clouds

**Deck name: Guide_NPI_Zero_Trust_SASE.** The narrated deck for the companion guide [Non-Person Identity: Zero Trust, SASE and Other Clouds](../../docs/books/guides/non-person-identity-zero-trust-sase.md), built with the shared kit in [`../_build/`](../_build/README.md) and the companion-guide slide helpers in [`../attribute-driven-migration-technical-part-1/slides.js`](../attribute-driven-migration-technical-part-1/slides.js). It's for identity, network and cloud engineers, application owners and the ISSOs who score the program's Zero Trust maturity. It's the *why* of the Non-Person Identity track, beside the [implementation guide](../../docs/books/guides/non-person-identity-implementation.md) and the [Service Accounts](../../docs/books/guides/service-account-migration.md) guide (whose deck is [`../guide-service-account-migration/`](../guide-service-account-migration/README.md)). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Slides | Guide sections |
|---|---|---|
| Why | Title; a gMSA fixes the password, not the protocol (the answer in brief, five points) | Which guide?; In this guide; The answer in brief |
| What | The Zero Trust scorecard in two slides (CISA ZTMM Identity pillar: authentication and identity stores; risk assessments and access management, with what it means for the program's scores, WD-165); what SASE does and doesn't do for a service account | The Zero Trust scorecard; What this means for the program's scores; What SASE does and doesn't do for a service account |
| Who | The workloads one by one in two slides (SQL Server, its callers and IIS; scheduled tasks and services, RHEL and Linux, AWS GovCloud (US) and OCI, WD-171); RHEL and Linux sign-in | The workloads, one by one; RHEL and Linux sign-in |
| How | The certificate map in two slides; NTLM (WD-027); extending Microsoft Entra ID across clouds, for people and for workloads; dangers; the checklist and back to the track | The certificate map; NTLM; Should agencies extend Microsoft Entra ID across clouds?; Dangers; Checklist; Back to the track |

| File | Use |
|---|---|
| `Guide_NPI_Zero_Trust_SASE.pptx` | The deck: 15 narrated slides (the title and 14 content slides in Why, What, Who and How order), then a backup section with the sources |
| `build.js` | The slides and their notes |

The plain and narrated decks join the next edition's Release; until then, build them from this folder. The video runs about 20 minutes. The narration was recorded on November 24, 2026, from the guide as approved on November 24, 2026. If the guide changes, the deck is rebuilt and re-recorded.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/guide-npi-zero-trust-sase/build.js presentations/guide-npi-zero-trust-sase/Guide_NPI_Zero_Trust_SASE.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the guide's sections, which isn't spoken. The narration names each source by its original publisher (CISA, Microsoft Learn, Red Hat, OMB, AWS, Oracle) and spells out the acronyms the voice would misread (G M S A, D M S A, S P N, N T L M, R H E L, O C I, I A M, S S H, T L S). Every fact on a slide comes from the guide, which footnotes each one to the source it was read from on November 24, 2026, or from the program decisions it names (WD-027, WD-165, WD-171); the deck adds none. The guide's labels carry over: where each kind of service identity lands on the Zero Trust scorecard, Entra sign-in for Arc-onboarded Linux in other clouds, and the split between people (one identity provider) and workloads (each platform's own identity, one record) are design guidance. Two things the guide leaves open stay open on the slides: a federated credential from AWS GovCloud (US) to Microsoft Entra ID is the target only once tested (WD-171), and the program's OC2 tenancy has to confirm it has identity domains.
