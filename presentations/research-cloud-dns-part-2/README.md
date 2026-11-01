# Research: Cloud DNS, Part 2 — BIND and the Federal Fit

**Deck name: Research_Cloud_DNS_Part_2.** Part 2 of the two-part narrated deck on the evaluation [Cloud DNS on AWS, Azure and Oracle Cloud: Native Resolvers, Infoblox and BIND](../../docs/evaluations/cloud-dns-resolvers-infoblox-bind.md) (in review). It covers the page's Parts 2 to 5: when to run your own DNS servers in a cloud, vNIOS or BIND, BIND on AWS, Azure and Oracle Cloud (roles, placement, forwarding, DNSSEC, response policy zones and CISA Protective DNS, logging, patching, configuration from Git), the seven-question alignment checklist for self-managed BIND in AWS, and the federal mapping. [Part 1](../research-cloud-dns-part-1/README.md) covers the native resolvers. It is built with the shared kit in [`../_build/`](../_build/README.md) and Part 1's [`helpers.js`](../research-cloud-dns-part-1/helpers.js). This folder sits outside `docs/`, so the site doesn't render it.

It belongs to the workbook's [Evaluations](../../docs/evaluations/index.md) section. It is not part of the vendor-neutral books. The title slide says "Research — in review"; the closing narration says this is research under review, not an endorsement by any federal agency. No specific federal agency is named.

| # | Part | Slide | Minutes |
|---|---|---|---|
| 1 | Why | Title and session map | 0.8 |
| 2 | Why | BIND in AWS: aligned, or a new silo? | 0.7 |
| 3 | Why | When to run your own DNS servers in a cloud | 0.9 |
| 4 | What | vNIOS or BIND, and which BIND to run | 0.9 |
| 5 | What | Three roles, kept apart | 0.7 |
| 6 | What | Placement and high availability in each cloud | 0.9 |
| 7 | What | Forwarding to and from the native resolver | 0.9 |
| 8 | What | An illustrative forwarder configuration (code) | 1.0 |
| 9 | What | DNSSEC validation and signing in the cloud | 1.0 |
| 10 | What | Response policy zones and CISA Protective DNS | 1.0 |
| 11 | What | Query and response logging into the SOC | 1.0 |
| 12 | What | Patching, settings and hardening baselines | 1.0 |
| 13 | Who | Who owns the configuration: Git and Ansible | 0.9 |
| 14 | How | The alignment checklist: seven questions | 1.1 |
| 15 | How | Federal mapping: configuration and inventory | 1.1 |
| 16 | How | Federal mapping: resolution, logging and Protective DNS | 1.2 |
| 17 | How | Where Infoblox fits, and what to confirm | 0.9 |
| | Backup | Not narrated: labels, scope and open points; sources for ISC, NIST and CIS; AWS, Microsoft and Oracle; OMB, CISA and the workbook | — |

Narrated total: about 2,220 words, about 16 minutes of audio.

| File | Use |
|---|---|
| `Research_Cloud_DNS_Part_2.pptx` | The deck: 17 narrated slides, then a backup section with the labels and open points and three source lists. Not in git: it goes on the next edition's Release |
| `Research_Cloud_DNS_Part_2_Narrated.pptx` | The self-running edition with each slide's audio and captions (`build_narrated.ps1`). Not in git: next edition |
| `Research_Cloud_DNS_Part_2_Narrated.mp4` | The 1080p video (`export_mp4.ps1`). Not in git: it goes on the videos release with its `_Narrated.vtt` caption track |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per slide before "Backup". `build.js` writes it from the same text as the speaker notes |
| `Research_Cloud_DNS_Part_2_Narration_Script.md` | The narration as a transcript (written by `narrate.py`) |
| `narration_Research_Cloud_DNS_Part_2/` | `durations.json`, `sentences.json` and the per-slide caption tracks `slideNN.vtt` (the MP3s are not in git) |
| `build.js` | Slide content and speaker notes, with the helpers from [`../research-cloud-dns-part-1/helpers.js`](../research-cloud-dns-part-1/helpers.js) |

## Build

```bash
source /c/tmp/deckenv.sh
cd presentations/research-cloud-dns-part-2
node build.js Research_Cloud_DNS_Part_2.pptx          # FIT=1 prints each table's and the code panel's bottom edge
cd ../..
python presentations/_build/narrate.py presentations/research-cloud-dns-part-2/Research_Cloud_DNS_Part_2.pptx
python presentations/_build/captions.py presentations/research-cloud-dns-part-2/Research_Cloud_DNS_Part_2.pptx
```

Then, with PowerPoint closed, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1` from `../_build/`, and `python presentations/_build/a11y_check.py` on both decks.

## Sourcing rules

- Every fact comes from the evaluation page (Parts 2 to 5, "The answer in brief", "Status and review") and the sources it footnotes, checked on October 29, 2026 (ISC, NIST, CISA, OMB, CIS, AWS, Microsoft Learn) and October 30–31, 2026 (Oracle), with each claim in the page's [verification log](../../docs/evaluations/_verification/cloud-dns-resolvers-infoblox-bind.md), or from the workbook pages the page links: Book 08, Book 12, the Ansible guide, the Infoblox NIOS implementation guide and the Trinzic explainer. The deck adds no external facts.
- The illustrative `named.conf` is the page's, shortened by one comment line (the panel label says so). It passed `named-checkconf` from BIND 9.18.39 but hasn't run in a VPC or been checked on 9.20, as the slide says.
- The page's labels are kept: *(design guidance)*, *(inference)* and *confirm*. Every comparison covers AWS, Azure and Oracle Cloud Infrastructure. Scope is FedRAMP Moderate civilian agencies: the configuration authority is CISA, NIST SP 800-53 at Moderate and CIS benchmarks; the page's High-only hardening source is left out.
