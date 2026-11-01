# Research: Cloud DNS, Part 1 — The Native Resolvers

**Deck name: Research_Cloud_DNS_Part_1.** Part 1 of the two-part narrated deck on the evaluation [Cloud DNS on AWS, Azure and Oracle Cloud: Native Resolvers, Infoblox and BIND](../../docs/evaluations/cloud-dns-resolvers-infoblox-bind.md) (in review). It covers the page's "The answer in brief" and Part 1: the Route 53 VPC Resolver, the Azure DNS Private Resolver and the Oracle Cloud VCN resolver, their endpoints, rules, query logging and DNS-layer filters, what the providers state for AWS GovCloud (US), Azure Government and Oracle's US Government Cloud, and how all three meet on-premises DNS. [Part 2](../research-cloud-dns-part-2/README.md) covers when to run your own DNS servers, BIND, the alignment checklist and the federal mapping. It is built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

It belongs to the workbook's [Evaluations](../../docs/evaluations/index.md) section, next to the [Trinzic explainer](../research-trinzic-multicloud/README.md) and the [Infoblox DDI deep dive](../research-infoblox-ddi/README.md). It is not part of the vendor-neutral books. The title slide says "Research — in review"; the closing narration says this is research under review, not an endorsement by any federal agency. No specific federal agency is named.

| # | Part | Slide | Minutes |
|---|---|---|---|
| 1 | Why | Title and session map | 0.8 |
| 2 | Why | Why cloud DNS belongs to one policy plane | 0.8 |
| 3 | Why | The answer in brief: native resolvers as the bridge | 0.9 |
| 4 | What | AWS: what the Route 53 VPC Resolver answers | 1.0 |
| 5 | What | AWS: inbound and outbound endpoints (diagram) | 1.0 |
| 6 | What | AWS: rules, sharing, Profiles and private zones | 0.9 |
| 7 | What | AWS: DNS Firewall, query logging and DNSSEC | 1.0 |
| 8 | What | AWS GovCloud (US) beside the commercial Regions | 1.0 |
| 9 | What | Azure: the DNS Private Resolver | 0.8 |
| 10 | What | Azure: DNS resolver policy, logging and DNSSEC | 1.0 |
| 11 | What | Oracle Cloud: how the VCN resolver answers (diagram) | 0.9 |
| 12 | What | Oracle Cloud: endpoints, rules and what's missing | 1.0 |
| 13 | Who | Who authorizes it: AWS and Azure FedRAMP scope | 0.9 |
| 14 | Who | Who authorizes it: Oracle US Government Cloud | 1.0 |
| 15 | How | How the three resolvers meet on-premises DNS (diagram) | 0.9 |
| 16 | How | How Protective DNS, policy and logs reach each cloud | 1.1 |
| 17 | How | What to confirm, and what Part 2 covers | 0.9 |
| | Backup | Not narrated: labels, scope and open points; sources for AWS, Microsoft and Oracle, CISA and the workbook | — |

Narrated total: about 2,260 words, about 16 minutes of audio.

| File | Use |
|---|---|
| `Research_Cloud_DNS_Part_1.pptx` | The deck: 17 narrated slides, then a backup section with the labels and open points and three source lists. Not in git: it goes on the next edition's Release |
| `Research_Cloud_DNS_Part_1_Narrated.pptx` | The self-running edition with each slide's audio and captions (`build_narrated.ps1`). Not in git: next edition |
| `Research_Cloud_DNS_Part_1_Narrated.mp4` | The 1080p video (`export_mp4.ps1`). Not in git: it goes on the videos release with its `_Narrated.vtt` caption track |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per slide before "Backup". `build.js` writes it from the same text as the speaker notes |
| `Research_Cloud_DNS_Part_1_Narration_Script.md` | The narration as a transcript (written by `narrate.py`) |
| `narration_Research_Cloud_DNS_Part_1/` | `durations.json`, `sentences.json` and the per-slide caption tracks `slideNN.vtt` (the MP3s are not in git) |
| `build.js` | Slide content and speaker notes |
| `helpers.js` | The slide helpers both parts use: the Trinzic explainer's (title and Sources checks, tables, panels, diagram nodes and arrows) plus `say()` (notes with a timing cue at 142 words a minute, a `Sources:` line and a `Workbook:` reference, and the `narration.json` entry), the ADM deeper dive's code panel, and `finish()` (title length and uniqueness, word count, save) |

## Build

```bash
source /c/tmp/deckenv.sh
cd presentations/research-cloud-dns-part-1
node build.js Research_Cloud_DNS_Part_1.pptx          # FIT=1 prints each table's bottom edge
cd ../..
python presentations/_build/narrate.py presentations/research-cloud-dns-part-1/Research_Cloud_DNS_Part_1.pptx
python presentations/_build/captions.py presentations/research-cloud-dns-part-1/Research_Cloud_DNS_Part_1.pptx
```

Then, with PowerPoint closed, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1` from `../_build/`, and `python presentations/_build/a11y_check.py` on both decks.

## Sourcing rules

- Every fact comes from the evaluation page ("The answer in brief", Part 1, "Status and review") and the sources it footnotes, checked on October 29, 2026 (AWS, Microsoft Learn, CISA, FedRAMP Marketplace) and October 30–31, 2026 (Oracle), with each claim in the page's [verification log](../../docs/evaluations/_verification/cloud-dns-resolvers-infoblox-bind.md), or from Book 08 and Book 12 pages the page links. The deck adds no external facts.
- The page's labels are kept: *(design guidance)* for the program's recommendations, *(inference)* for conclusions the sources support but don't state, and *confirm* for points the providers don't document. The government-cloud rows are the page's tables, including the GovCloud delegation conflict and the Azure Government availability that only the price list shows.
- Every comparison covers AWS, Azure and Oracle Cloud Infrastructure, as the page does. Scope is FedRAMP Moderate civilian agencies.
