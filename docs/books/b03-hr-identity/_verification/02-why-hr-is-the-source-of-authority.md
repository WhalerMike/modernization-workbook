# Verification — Chapter 02, Why HR Is the Source of Authority

Editor pass of 2026-10-20. Every URL below was opened (or, for PDFs, downloaded and text-searched) on that date and returned HTTP 200.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Token claims are projections of upstream facts | What the claims in a token assert | restated-as-design (argument; no change) | — |
| 2 | Identity truth is fragmented across OU trees, app stores, spreadsheets, drawings | Fragmented truth | restated-as-design (illustrative pattern, not a cited statistic; no change) | — |
| 3 | Orphan timeline (day −14 to +180) | Visible symptom | restated-as-design (illustrative; table caption and diagram already frame it as anatomy, not a case) | — |
| 4 | PS-5 exists to stop access accretion on transfer | Visible symptom | verified; named the control and footnoted (PS-5 a: review and confirm need for current access when individuals are reassigned or transferred) | NIST SP 800-53 Rev. 5 |
| 5 | M-22-09: centralized identity management for agency staff, phishing-resistant MFA, per-request authorization | Why HR-driven ICAM now | verified; the third item now quotes the memo ("every request for access should be evaluated"; no network implicitly trusted) | OMB M-22-09, §II and §III.A |
| 6 | SP 800-207: per-session access by policy, client identity and enterprise-assigned attributes | Same | verified; quote "any associated attributes assigned by the enterprise" added | NIST SP 800-207, §2.1 tenets 3–4 |
| 7 | CISA ZTMM: identity is the first pillar; identity = attribute(s) that uniquely describe a user | Same | corrected to the exact definition ("uniquely describes an agency user or entity") | CISA ZTMM v2.0, §5.1 |
| 8 | SASE definition as Zero Trust delivery at the edge | Same | restated-as-design ("In this book's design") | — |
| 9 | TIC 3.0 under M-19-26 opens the path, with remote-user, branch and cloud use cases "that include cloud-delivered security services" | Same | corrected: the use cases are verified (cloud, branch office, remote users); "cloud-delivered security services" isn't in the CISA page or the memo and was replaced by the verified fact that M-19-26 ended the physical TIC access-point requirement | OMB M-19-26; CISA TIC page |
| 10 | Dynamic groups compute membership from attributes | Entra shape | verified | Microsoft Learn, dynamic membership rules |
| 11 | OMB M-19-17 sets the ICAM policy framework | Federal policy frame | verified (footnote added) | OMB M-19-17 |
| 12 | FICAM ILM Playbook (best practice) recommends HR as authoritative source for creation and termination | Same | verified; now quoted | IDManagement.gov ILM Playbook |
| 13 | FICAM Architecture describes identity attributes drawn from authoritative sources | Same | verified; reworded to the architecture's own description of identity management | IDManagement.gov FICAM Architecture |
| 14 | Added: SP 800-53 AC-2 l requires aligning account management with personnel termination and transfer | Same | verified (new supporting sentence) | NIST SP 800-53 Rev. 5 |
| 15 | Evidence Act (2018) | Same | corrected/clarified: Foundations for Evidence-Based Policymaking Act of 2018, Pub. L. 115-435, enacted January 14, 2019 | GovInfo, Pub. L. 115-435 |
| 16 | Federal Data Strategy pushes toward governed data with known provenance | Same | verified (M-19-18 principles on quality, documentation and provenance) | OMB M-19-18 |
| 17 | Quarterly reviews are AC-2(j)'s verification layer | Why this can't be patched | verified (AC-2 j: review accounts for compliance at an organization-defined frequency) | NIST SP 800-53 Rev. 5 |
| 18 | Microsoft HR-driven provisioning: hire creates, change updates, termination disables, rehire reactivates | What HR-driven provisioning means | corrected: Microsoft says a rehire's old account "can be automatically reactivated or reprovisioned"; text now says "reactivates or reprovisions" | Microsoft Learn, What is HR-driven provisioning? |
| 19 | "Single largest change to identity risk available" | Same | restated-as-design (the author's judgment; wording unchanged, not presented as a cited fact) | — |
| 20 | Federal HR 2.0 yields a consistent feed shape across agencies in OPM standard data elements | What HR provides | restated-as-design (inference from one platform for all agencies; Chapter 03 carries the program facts) | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | edited: added `part: Why`; `lifecycle_review` 2027-04-01 | — |
| Thesis line, In this chapter | kept | — |
| What the claims in a token assert | kept | — |
| The fragmented truth problem / Where identity truth lives today | kept | — |
| The visible symptom: orphaned accounts | edited: PS-5 named and footnoted; figure gets `#fig-ch02-orphan-timeline`; table kept | — |
| Why the agency needs HR-driven ICAM now | edited: Zero Trust bullet quotes corrected (items 5–7); SASE restated as design; TIC 3.0 claim corrected (item 9); figure gets `#fig-ch02-zero-trust-dependency`; comparison table kept | — |
| The federal policy frame | edited: footnotes added; ILM quoted; FICAM Architecture reworded; AC-2 l sentence added; Evidence Act identified; "series" → "book" | — |
| Why this can't be patched | edited: AC-2 j footnoted; otherwise kept | — |
| What HR-driven provisioning means | edited: rehire wording (item 18) | — |
| What HR provides, and what identity architecture must add | kept | — |
| Continue the series | edited: "Continue the book"; Book index; full Chapter 03 title | — |
| Footnotes | edited: keys renamed `c01-*` → `c02-*`; access dates updated; old `c01-tic` replaced by `c02-m1926` + `c02-tic`; 7 new footnotes | — |
