# Verification — 13-reference-deployment.md

Editor pass 2026-10-20. The chapter is an illustrative pattern; the "Illustrative, not an engagement record" callout is kept unchanged. Numbers and findings in the phase narrative are representative by design and carry no footnotes.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Federal HR 2.0 Wave 2 | The agency | verified; added that Wave 2 is the agencies transitioning in FY 2027, pointer to the memo's Appendix A for membership (no agency named) | OMB/OPM memo, Dec 10, 2025 (`[^c13-hr20memo]`) |
| 2 | "Entra ID in the commercial cloud under a FedRAMP Moderate authorization" | The agency | corrected: the FedRAMP Moderate statement belongs to the Microsoft 365 GCC environment (Microsoft documents GCC as meeting FedRAMP Moderate); GCC is paired with Entra ID in Azure's commercial cloud. Entra ID's own authorization level is no longer asserted (Microsoft pages disagree on GCC's level; the GCC planning page is cited) | MS Learn, Plan for Microsoft 365 Government - GCC deployments; Cloud feature availability for US Government customers |
| 3 | USA Staffing is the upstream hire trigger feeding the HR system | The agency | verified (USA Staffing is OPM's talent acquisition and onboarding system and shares onboarding data with subscribing agencies); the flow into the HR system of record is the illustrative estate | OPM, PIA for USA Staffing, Aug 12, 2026 (`[^c13-usas-pia]`) |
| 4 | Lifecycle Workflows keeps run history usable as evidence | Evidence package | verified | MS Learn, What are lifecycle workflows? |
| 5 | Shared-service HR provider, PIV issuer, COR spreadsheets, two-thirds AD-mastered | The agency | restated-as-design (illustrative estate) | — |
| 6 | Phase findings (a few percent missing `employeeId`, 30-day shadow mode, drift burst) | Phase by phase | restated-as-design (representative, per the callout) | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | kept; added `part: How`; `lifecycle_review` → 2027-04-01; description "series" → "book" | — |
| Thesis | edited ("series" → "book") | — |
| In this chapter; Illustrative callout | kept | — |
| The agency | edited (Wave 2 gloss; GCC/FedRAMP correction; USA Staffing footnote) | — |
| Diagram ch13-reference-estate | kept; source unchanged (its header comment still says "Chapter 11"; comment only, not rendered) | — |
| Phase by phase | kept | — |
| The evidence package | edited (footnote) | — |
| What survives the engagement | kept | — |
| Companion | edited: link now points to Book 02 (`../b02-identity/index.md`) and its Chapter 09; old guide name replaced | — |
| Continue callout | edited to "Continue the book" / "Book index"; Next stays Appendix A | — |
