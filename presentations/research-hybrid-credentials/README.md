# Research: Certificates, Tokens and Keys Across the Hybrid Estate — explainer

A short plain-language explainer on what happens to the credential work Active Directory does today (PIV trust and mapping, Kerberos for SQL Server, certificate autoenrollment, NPS for RADIUS) as the estate moves to Entra ID, Intune and Azure Arc. It follows four paths through three stages (today, coexistence, after AD): SQL Server with Entra ID, the clouds' key vaults, PIV from AD to Entra, and RADIUS, 802.1X and NAC. It then sums up who issues and who renews each credential. It's built with the shared deck kit in [`../_build/`](../_build/README.md).

It belongs to the workbook's [Explainers](../../docs/books/explainers/index.md) section (under review), with its page at [`docs/books/explainers/hybrid-credentials.md`](../../docs/books/explainers/hybrid-credentials.md). It is not part of the vendor-neutral workbook books. The title slide says "Explainer · Research — under review". Recommendations are labeled program design guidance, and inferences are labeled as inferences. The closing notes say this is research under review, not an endorsement by any federal agency. No specific federal agency is named.

| # | Slide |
|---|---|
| 1–3 | Title; what AD does for credentials today; three stages, five paths |
| 4–6 | SQL Server: one server, three credentials (diagram); the TLS certificate becomes mandatory; the three stages |
| 7–8 | The clouds' key vaults: one renewer per certificate (diagram); Azure, AWS and Google |
| 9–12 | PIV: the card stays, AD's side goes (diagram); strong mapping today; Entra CBA in coexistence; who writes the binding after AD |
| 13–15 | RADIUS: there is no Entra RADIUS (diagram); 802.1X with Intune (diagram); the three stages |
| 16–17 | Who issues and who renews; what changed in the books, and next steps |
| | Backup (not narrated): couldn't verify, two source lists |

The five diagrams are committed SVG sources shared with the research page, in `docs/images/diagrams/b07-pki/src/hybrid-*.flow.yaml`.

| File | Use |
|---|---|
| `Research_Hybrid_Credentials.pptx` | The deck |
| `build.js` | Slide content and speaker notes (a `Detail:` block that is not spoken). It stops if a slide title is over 58 characters, duplicated, or has no narration |
| `narration.js` | The spoken narration for each slide, keyed by title: the slide's intent and highpoints, in the workbook's conversational style |

## Build

```bash
source /c/tmp/deckenv.sh
node build.js Research_Hybrid_Credentials.pptx
python "$VALIDATE" Research_Hybrid_Credentials.pptx
python ../_build/a11y_check.py Research_Hybrid_Credentials.pptx
```

Then run `narrate.py`, `captions.py` and `build_narrated.ps1` from `../_build/`.

## Sourcing rules

Every fact comes from the research brief *Certificates, Tokens and Keys Across the Hybrid Estate*, checked against primary sources on October 23, 2026: Microsoft Learn and Microsoft Support, CyberArk Certificate Manager 26.1 documentation, AWS and Google Cloud documentation, IDManagement.gov, Cisco, and FedRAMP Marketplace data. The research corrected Books 04, 06, 07 and 09; the last slide lists the changes.
