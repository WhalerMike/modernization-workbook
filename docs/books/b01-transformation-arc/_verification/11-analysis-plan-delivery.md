# Verification — Chapter 11, Analysis, Plan, Delivery

Editor: W5. Sources: the series chapter in place (old Chapter 03, "Analysis → Plan → Delivery"); the modernization whitepaper's Principle 4 and its actuation table and Figure 13. All checks October 21, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Three stages, two gates, separate governance and execution principals | Throughout | restated-as-design | — |
| 2 | Dynamic membership rules accept `extensionAttribute1`–`15` as string properties | Plan, platform facts | verified | Microsoft Learn, dynamic membership rules |
| 3 | Rule syntax `and` | YAML example | corrected to `-and` (documented operator form; unhyphenated also accepted) | Microsoft Learn, dynamic membership rules |
| 4 | Dynamic-AU members and AU-scoped administrators need Entra ID P1 | Plan, platform facts | verified (added) | Microsoft Learn, Administrative units |
| 5 | Role-assignable groups can't have dynamic membership | Plan, platform facts | verified | Microsoft Learn, Use Entra groups to manage role assignments |
| 6 | Department AU created `restricted: true` | YAML example | corrected to `false`: restricted management AU members can't be managed by PIM, entitlement management, Lifecycle Workflows or access reviews; the setting is fixed at creation; max 100 per tenant; Graph application permissions don't apply, the app needs a role at AU scope; role-assignable groups in one can't have membership modified | Microsoft Learn, Restricted management administrative units |
| 7 | Correlation identifier containing plan, action and run IDs goes in API headers | Correlation | corrected: Graph asks for a unique GUID per request in `client-request-id`, logged by the caller; the engine maps that GUID to plan/action/run | Microsoft Learn, Best practices for working with Microsoft Graph |
| 8 | Transient failures retried with backoff | Failure modes | verified and specified: 429 + `Retry-After`; exponential backoff when absent | Microsoft Learn, Graph throttling guidance |
| 9 | Deprovisioning is rollback-never; "re-hire rather than undelete" | Failure modes | kept as design; added the fact that some deleted objects (users, groups) can be restored within 30 days and why the program doesn't use it as undo | Microsoft Learn, Best practices for working with Microsoft Graph |
| 10 | Whitepaper: actuation stages are the CISA ZTMM stages; FedRAMP ConMon and M-22-09 expect "Advanced" | Actuation section | corrected: stage names verified (Traditional, Initial, Advanced, Optimal); the governance-posture mapping is the program's; neither FedRAMP nor M-22-09 sets a maturity stage; ZTMM is "a general guide," not "a strict set of requirements"; quoted Advanced Automation and Orchestration text | CISA ZTMM v2.0 §5, §5.6 Table 7; OMB M-22-09 §III |
| 11 | Ladder rungs L0–L4 | Actuation section | restated-as-design; aligned with Book 05 Ch 02 (L0–L4) and with this book's Ch 03 (ZTMM-stage naming) in one table so the two don't contradict | Book 05 Ch 02; Ch 03 |
| 12 | High-blast-radius classes permanently gated | Actuation section | restated-as-design | — |
| 13 | Evidence packet "can be mirrored to a SIEM" | Evidence packet | kept; added current logging authority: M-26-14 (May 22, 2026) rescinded M-21-31, Agency Logging Plan, maturity levels | OMB M-26-14 |
| 14 | 312-user worked example and action counts | Worked example | restated-as-design (labeled illustrative) | — |
| 15 | Plan YAML schema and action types | Plan | restated-as-design; warning callout added that it isn't a Microsoft schema | — |
| 16 | Old cross-references "Chapter 02", "Chapter 04 — Identity Transformation" | Throughout | corrected to new numbering (Ch 10, Ch 12 next) | — |
| 17 | Separation of governance and execution | Deliver | linked to Ch 03 rather than re-argued | — |
| 18 | Microsoft Learn "Authoritative references" list | End | removed as a list; source footnoted inline | — |
| 19 | Review fix, Oct 21, 2026: removed "The source said FedRAMP continuous monitoring and OMB M-22-09 expect the 'Advanced' stage as the production standard; neither does." | Actuation ladder, L3 target | wording-only | Revision history kept here. The surrounding sentences already state the position and cite ZTMM and M-22-09. No new factual claim. |
| 20 | Review fix 3, Oct 21, 2026 (revision-history trim): "The source example marked a whole department's administrative unit `restricted: true`" | Plan validation, restricted management | wording-only | Now states the program setting only (`restricted: false` for department units); the limits that justify it stay under [^c11-rmau]. |
| 21 | Review fix 3, Oct 21, 2026 (revision-history trim): "The source said this identifier goes into the API call headers. For Microsoft Graph that needs one adjustment" | Correlation identifier | restated, footnote kept | Now "The run identifier doesn't go into Microsoft Graph request headers as is." Re-opened Microsoft Learn, "Best practices for working with Microsoft Graph," Reliability and support: "On every request to Microsoft Graph, generate a unique GUID, send it in the client-request-id HTTP request header, and also log it in your application's logs," <https://learn.microsoft.com/graph/best-practices-concept> ([^c11-graphbp]). |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Old Ch 03 title and subtitle | H1 "Chapter 11 — Analysis, Plan, Delivery"; italic thesis | — |
| Dependency chain blockquote | Kept | — |
| The pipeline contract | Same | — |
| Why three stages (not one) | "Why three stages, not one" | — |
| Stage 1 — Analyze | Same | — |
| Stage 2 — Plan (action properties, YAML example) | Same; YAML corrected (claims 3, 6); three platform-fact bullets added | — |
| Plan validation | Same; two checks added (restricted-AU list, transaction profile) | — |
| Authorization gate (and the role-assignable parenthesis) | Same; the parenthesis became a platform-fact bullet; link to Book 04 Ch 10 change control | — |
| Stage 3 — Deliver (six steps) | Same | — |
| Correlation identifiers | Same, corrected (claim 7) | — |
| Failure modes and rollback | Same, with throttling detail and the deprovisioning note | — |
| Evidence packet | Same, with M-26-14 | — |
| Concrete example — the end-to-end shape | "A worked example" | — |
| What governed modernization feels like | Same | — |
| Key takeaways | Same, one added | — |
| Authoritative references | Footnotes | List removed |
| Previous/Next links | "Continue the book" callout (Ch 10 → Ch 12) | — |
| Figure `../../images/cshc/analysis-plan-delivery.svg` | `ch11-three-stages.flow.yaml` | — |
| Whitepaper Principle 4 prose (active reconciliation control plane over data planes) | "How far automation may go" | Also carried by Ch 03 (W2); kept short here and linked |
| Whitepaper Principle 4 table (CISA ZT stage / governance posture) | Rung table with a Chapter 03 stage column | Corrected per claim 10 |
| Whitepaper "What this means for authorizing officials" callout | Last paragraph of the actuation section | Federal-expectation claim corrected |
| Whitepaper Figure 13 (`rId94.png`) | `ch11-actuation-ladder.flow.yaml` | The five-data-plane half is carried in prose; the Word extract isn't reused |

## Change log

| Date | Change |
|---|---|
| 2026-10-21 | Extension attribute reconciliation: AU rule moved from `extensionAttribute1` (Book 03's job code) to `extensionAttribute4` (region code); added a sentence linking the program attribute map. |
