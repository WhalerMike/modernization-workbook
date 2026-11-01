# Research: DNS for HR-Driven Identity Across Clouds — explainer

A 17-minute plain-language explainer on the DNS side of HR-driven identity. The HR record starts in Oracle Fusion Cloud HCM (the Federal HR 2.0 Core HCM platform, whose program owner is OPM), passes through integration middleware, Microsoft Entra API-driven inbound provisioning, Lifecycle Workflows and the provisioning agent, and ends in Entra ID and, while it exists, Active Directory. Amazon Connect and VMware also sit on the path. The deck asks which names must resolve where, what breaks, and when private DNS or forwarding is needed instead of public DNS. It's for a federal architect who is still learning DNS, so every term is defined the first time it's used. It is built with the shared deck kit in [`../_build/`](../_build/README.md).

It belongs to the workbook's [Explainers](../../docs/books/explainers/index.md) section (under review), next to the [Trinzic Alone, or Trinzic Plus Cloud DDI?](../../docs/evaluations/trinzic-multicloud-ddi.md) explainer, the [Infoblox DDI for Federal Agencies](../../docs/evaluations/infoblox-ddi-federal.md) deep dive and the [Who Names the Device After AD?](../research-device-naming/README.md) explainer. It is not part of the vendor-neutral workbook books. The title slide says "Research — under review". Recommendations are labeled program design guidance, not vendor or standards requirements. The closing notes say this is research under review, not an endorsement by any federal agency. No federal agency is named except OPM, as the Federal HR 2.0 program owner. This folder sits outside `docs/`, so the site doesn't render it.

| # | Slide | Minutes |
|---|---|---|
| 1 | Title and session map | 1.3 |
| 2 | The HR-driven chain, end to end (diagram) | 1.4 |
| 3 | Almost every name is public and vendor-owned | 1.5 |
| 4 | What must resolve where (condensed table) | 1.4 |
| 5 | Government clouds use different names | 1.5 |
| 6 | Oracle: private access is routing, not DNS (diagram) | 1.4 |
| 7 | Amazon Connect and VMware | 1.5 |
| 8 | The clouds disagree on precedence | 1.5 |
| 9 | How it breaks: seven failure modes | 1.5 |
| 10 | Hub, not mesh (diagram; illustrative arithmetic) | 1.5 |
| 11 | What the agency must do (program design guidance) | 1.6 |
| 12 | Decisions, next steps and where this fits | 1.5 |
| | Backup (not narrated): full "what must resolve where" table (two slides), full failure-mode table (two slides), what couldn't be verified, two source lists | — |

Narrated total: about 2,490 words, roughly 17.5 minutes at 142 words per minute.

| File | Use |
|---|---|
| `Research_HR_Identity_DNS.pptx` | The deck: 12 narrated slides, then a backup section with the full tables, what couldn't be verified, and the full source lists |
| `build.js` | Slide content and speaker notes. It stops if a slide title is over 58 characters or duplicated |

Narration isn't built yet. When it is, `../_build/narrate.py`, `captions.py` and `build_narrated.ps1` add the `_Narrated.pptx`, the narration script, the per-slide audio folder and the `.vtt` caption track, as in the Trinzic research deck.

## Build

```bash
source /c/tmp/deckenv.sh
node build.js Research_HR_Identity_DNS.pptx
python "$VALIDATE" Research_HR_Identity_DNS.pptx
python ../_build/a11y_check.py Research_HR_Identity_DNS.pptx
```

## Sourcing rules

- Every fact comes from a research brief checked against primary sources on October 22, 2026: Microsoft Learn, Oracle, AWS, Broadcom and Infoblox NIOS 9.1 documentation, and FedRAMP Marketplace data. Book 03 (Chapters 03 and 05), Book 08 (Chapters 02, 07, 08 and 10) and the earlier multi-cloud DDI research supply the context. Each slide's notes end with a short "Sources:" line, and the backup slides list every source by ID.
- Caveats are kept as the brief states them:
  - Several Microsoft facts come from search excerpts of Microsoft Learn pages, not full pages. They are marked "(excerpt)" on the slides and said as "per Microsoft Learn" in the notes. They include the Windows forwarder timeout above 4 seconds, the agent's CNAME chain and no-TLS-inspection guidance, its default Azure environment, and the Lifecycle Workflow extension's Consumption Logic App.
  - That Oracle Fusion's private access leaves DNS unchanged is an inference: neither Oracle page describes a DNS change. That a middleware outage longer than Oracle's Atom purge window loses events, that the same zone and rule give different answers in each cloud, and that Lifecycle Workflow extensions reach only public names are also labeled inferences.
  - "Use Forwarders Only" as the fix for the Grid's root-hint fallback is labeled an inference.
  - The VMware claim is limited to what the Broadcom knowledge article verifies: changing vCenter's hostname or IP runs forward and reverse DNS lookups and is blocked if the name doesn't fully resolve. The install-guide DNS rules are on the "couldn't verify" slide.
  - The mesh-versus-hub count (up to 20 one-way rule sets for five environments, against about 5 to a hub) is labeled illustrative arithmetic.
- Vendors are described from their own documentation. Recommendations, including the whole checklist on slide 11, are labeled program design guidance. Items that couldn't be verified are kept out of the claims and listed on a backup slide: Oracle's connectivity patterns (HTTP 403), the agency's Core HCM tenant environment, `/bulkUpload` in the U.S. Government Graph cloud, Private Link for Graph, Azure DNS Private Resolver and Lifecycle Workflows in Azure Government, OCI limits and government-realm endpoints, Connect PrivateLink in GovCloud, and AWS or Infoblox loop guidance.
- Microsoft's highest government cloud is written as "the higher government cloud", so no abbreviation can be mistaken for an agency. Its Graph host name appears only as the literal host name.
