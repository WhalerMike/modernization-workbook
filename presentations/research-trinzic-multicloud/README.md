# Research: Trinzic Alone, or Trinzic Plus Cloud DDI? — explainer

A 15-minute plain-language explainer on one question: can an agency's on-premises Infoblox Trinzic (NIOS) Grid handle DNS, DHCP and IPAM for AWS, Azure and Google Cloud by itself, or should it work with cloud-based DDI? It's for a federal architect who is still learning DDI, so every term is defined the first time it's used. It is built with the shared deck kit in [`../_build/`](../_build/README.md).

It belongs to the workbook's **Research — under review** section, next to the [Infoblox DDI for Federal Agencies](../../docs/research/infoblox-ddi-federal.md) deep dive. It is not part of the vendor-neutral workbook books. The title slide says "Research — under review". Recommendations are labeled design guidance, not endorsements. The closing notes say this is research under review, not an endorsement by any federal agency. No specific federal agency is named. This folder sits outside `docs/`, so the site doesn't render it.

| # | Slide | Minutes |
|---|---|---|
| 1 | Title and session map | 1.0 |
| 2 | The words you need before we start (glossary) | 2.0 |
| 3 | What Trinzic is, and what it does well on premises | 1.5 |
| 4 | What Trinzic alone sees in the clouds, and can't control | 1.6 |
| 5 | Option A: vNIOS members inside each cloud (diagram) | 1.6 |
| 6 | Option B: the Grid joined to Universal DDI (diagram) | 1.7 |
| 7 | Option C: Trinzic alongside native cloud DNS (diagram) | 1.6 |
| 8 | The rules that prevent split-brain (diagram) | 1.5 |
| 9 | Which option fits your agency? Design guidance | 1.5 |
| 10 | Where this fits the workbook, and next steps | 1.1 |
| | Backup (not narrated): full glossary, open questions, three source lists | — |

Narrated total: about 2,180 words, roughly 15 minutes at 142 words per minute.

| File | Use |
|---|---|
| `Research_Trinzic_MultiCloud.pptx` | The deck: 10 narrated slides, then a backup section with the full glossary, what couldn't be verified, and the full source lists |
| `build.js` | Slide content and speaker notes. It stops if a slide title is over 58 characters or duplicated |

Narration isn't built yet. When it is, `../_build/narrate.py`, `captions.py` and `build_narrated.ps1` add the `_Narrated.pptx`, the narration script, the per-slide audio folder and the `.vtt` caption track, as in the Infoblox research deck.

## Build

```bash
source /c/tmp/deckenv.sh
node build.js Research_Trinzic_MultiCloud.pptx
python "$VALIDATE" Research_Trinzic_MultiCloud.pptx
python ../_build/a11y_check.py Research_Trinzic_MultiCloud.pptx
```

## Sourcing rules

- Every fact comes from research briefs checked against primary sources on October 22, 2026. The main brief covers multi-cloud DDI. The others cover the Infoblox platform, federal requirements and validations, and the competitor comparison. Book 08 (Chapters 02, 07, 08 and 12) supplies the architecture context. Each slide's notes end with a short "Sources:" line, and the backup slides list every source by ID.
- Release-stage and government-cloud caveats are kept exactly as found:
  - Route 53 Resolver has been renamed Route 53 VPC Resolver, and its delegation feature isn't available in GovCloud.
  - The AWS VPC IPAM–Infoblox integration isn't available in GovCloud and works only with the Advanced Tier and private scopes.
  - Infoblox Government Cloud is FedRAMP Moderate, hosted in AWS GovCloud, with limited cloud discovery.
  - Universal DDI cloud forwarding runs on NIOS-X servers, not classic Trinzic.
  - Azure Government availability of DNS Private Resolver and AVNM IPAM is unverified. The deck says "confirm".
- Inferences are labeled as inferences, and the one Infoblox marketing source (the Government Cloud blog) is labeled vendor. Items that couldn't be verified are listed on a backup slide instead of being stated as fact.
