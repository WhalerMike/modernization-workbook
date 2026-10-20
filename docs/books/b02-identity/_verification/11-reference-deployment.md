# Verification — 11-reference-deployment.md

Source page: `docs/case-studies/reference-deployment-fedciv-ad-to-entra.md`. All sources accessed Oct 20, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | M-22-09 (Jan 26, 2022) directs agencies to consolidate identity systems and use enterprise-managed, phishing-resistant accounts | The archetype | verified | whitehouse.gov M-22-09 PDF (read pp. 1–2) |
| 2 | Source: BOD 25-01 is about "logging and visibility" | The archetype | corrected (BOD 25-01 = SCuBA secure configuration baselines, tenant inventory, ScubaGear reporting; logging is M-21-31) | cisa.gov BOD 25-01 implementation guidance |
| 3 | M-21-31 (Aug 27, 2021) sets event-logging tiers EL0–EL3 | The archetype | verified (added to replace the misattributed logging claim) | whitehouse.gov M-21-31 PDF (read pp. 1–2) |
| 4 | Source: "forthcoming FedRAMP 20x continuous-monitoring expectation" on the agency | The archetype; evidence bundle | corrected (20x is in Phase 3, aimed primarily at CSPs; KSIs validated continuously; agencies are consumers) | fedramp.gov/20x |
| 5 | In GCC, Microsoft 365 pairs with Entra ID in Azure commercial | The archetype | verified | Learn, Cloud feature availability for US Government |
| 6 | "Purview Premium" as the agency's tool | The archetype | removed (not a product name; replaced with "Purview") | n/a |
| 7 | Credential Guard blocks unconstrained delegation; use constrained delegation | Phase 1 | verified | Learn, Kerberos unconstrained delegation article |
| 8 | SQL Server Kerberos needs an SPN mapped to the service account; else NTLM fallback | Phase 1 | verified | Learn, Register a SPN for Kerberos connections |
| 9 | Eleven AD object types inventoried by a specific repo survey adapter at a `src/` path | Phase 1 | restated-as-design (repo paths do not exist in the workbook; linked to Ch 04/07/B instead) | n/a |
| 10 | Four hundred SPN accounts / sixty critical / eighty of ninety resolve, etc. | Phases 1–5 | restated-as-design (illustrative archetype figures, flagged as such up front) | n/a |
| 11 | HMAC-signed readiness bundles, provenance chain, `ssot-mutation: never`, `certificate-anchored` | Phases 1, 4 | restated-as-design | n/a |
| 12 | Cloud Sync is Microsoft's development direction and will replace Connect Sync at parity | Phase 3 | verified (added) | Learn, Connect Sync overview |
| 13 | Cloud Sync: 150K objects per domain; no cross-forest references | Phase 3 | verified (added) | Learn, Connect→Cloud Sync decision guide |
| 14 | ADCS auto-enrollment moves to Intune SCEP | Phase 3 | verified/expanded (SCEP with ADCS needs NDES + Certificate Connector) | Learn, Configure infrastructure to support SCEP |
| 15 | Microsoft Cloud PKI replaces on-prem CA/NDES/connector for Intune devices; availability varies by cloud | Phase 3 | verified (Learn notes GCC High available, DoD not; GCC not stated, so text says confirm) | Learn, Cloud PKI overview |
| 16 | Entra auth for SQL Server needs SQL Server 2022+ and is configured through Arc | Phase 3 | corrected (Arc is the usual path; a no-Arc configuration also exists for 2022+) | Learn, SQL Server enabled by Azure Arc; Learn, Entra auth without Arc |
| 17 | Entra auth not supported for failover cluster instances | Phase 3 | verified (added caveat) | Learn, Entra authentication for SQL Server (Remarks) |
| 18 | Eight adapter interfaces / `migration-adapter-registry.yaml` schema-validated in CI; PR #395/#397 | Phase 3 | restated-as-design (repo internals and PR numbers removed) | n/a |
| 19 | Five drift classes and P1–P4 severity model | Phase 4 | verified against workbook page; added maturity caveat (AUTHZ and IDENTITY design-only) | `docs/architecture/drift-engine.md` |
| 20 | NIST SP 800-63 AAL; 800-63-4 supersedes -3 (July 2025) | Phase 4 | verified/updated | csrc.nist.gov SP 800-63-4 |
| 21 | SPN-drift condition 4: "no Entra Kerberos delegation / workload-identity federation" | Phase 5 | corrected (Entra ID does not assume Kerberos delegation for on-prem SQL SPNs; restated as "no decided authentication path") | Learn SPN article (Kerberos stays in AD); design restatement |
| 22 | SPNs remain on old account after service-account change; one owner per MSSQLSvc SPN; setspn -L/-Q, klist purge, auth_scheme query | Phase 5 | verified | Learn, Troubleshoot SQL Server Kerberos failures with gMSAs |
| 23 | Adaptive policy scopes target "labels, DLP rules, retention schedules, eDiscovery custodian queries" | Azure SSOT bridge | corrected (Learn lists retention, retention label, auto-labeling, communication compliance policies; DLP and eDiscovery claims dropped) | Learn, Adaptive scopes |
| 24 | Purview Data Map registers Arc-enabled SQL Server into collections (SQL 2012+, SHIR) | Azure SSOT bridge | verified | Learn, Connect to and manage Arc-enabled SQL Server in Purview |
| 25 | Fabric domains; workspaces assigned to domains, items inherit | Azure SSOT bridge | verified | Learn, Fabric domains |
| 26 | SQL Server mirrored into OneLake | Azure SSOT bridge | verified with conditions (2016–2025; 2025 requires Arc) | Learn, Mirroring SQL Server |
| 27 | Fabric available for the GCC tenant | Azure SSOT bridge | corrected/qualified (GCC High: only Azure SQL DB mirroring; GCC: F SKUs unsupported; Fabric GCC parity not confirmed on Learn) | Learn, Fabric for GCC High; Learn, Power BI for US government |
| 28 | Purview label telemetry verification gap at the GCC boundary (B.1.1) | Azure SSOT bridge | restated-as-design (internal boundary finding; no external citation; finding ID dropped) | n/a |
| 29 | The 3PAO consumes the bundle "during the next FedRAMP cycle" | Evidence bundle | corrected (agency systems authorized by agency AO under RMF SP 800-37 Rev. 2 with ongoing authorization; 3PAOs assess CSPs) | csrc.nist.gov SP 800-37 Rev. 2; fedramp.gov/20x |
| 30 | Cost-shape inversion: re-engagement consumes canon | What survives | restated-as-design (linked to workbook whitepaper) | `docs/whitepapers/federal-ssot-alignment.md` |
| 31 | Any "2027" deadline | n/a | none in source; none added | n/a |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, `canon-reference` list | — | Repo-internal canon paths; not workbook pages |
| Callout "Framing pattern, not a fabricated engagement" | Callout "A framing pattern, not a real engagement" | Status-badge sentence dropped (no stamps) |
| Engagement archetype (two paragraphs) | The archetype | Mandates corrected (BOD 25-01, 20x) and footnoted; M-21-31 added; GCC pairing added; "Purview Premium" removed |
| Phase 1 — Discover | Phase 1 — Discover | `src/` paths, Spec3-D1.1/FMP_139 IDs and PR #395 removed; linked to Ch 04, 07, 08 and appendices B, C |
| Phase 2 — Normalize | Phase 2 — Normalize | Linked to Ch 05 and the B03 HR-driven series |
| Phase 3 — Map | Phase 3 — Map | Adapter list kept; repo paths, registry YAML and PR #397 removed; sync-engine decision, SCEP/Cloud PKI, Entra-for-SQL caveats added; SQL procedure pointed to the SQL series |
| Phase 4 — Migrate (provenance contracts) | Phase 4 — Migrate | Contract names restated as program design rules; linked to Ch 10 |
| Phase 4 — drift taxonomy list | Phase 4 table | Linked to workbook Drift Engine page; maturity caveat added |
| Phase 4 — representative P1 example | Phase 4, last paragraph | Kept |
| Phase 5 — Validate, SPN-drift table | Phase 5 table | Row 4 corrected; verified setspn / auth_scheme checks added |
| Phase 5 — P1 remediation paragraph | Phase 5, last paragraph | Kept; cross-reference to SQL series NTLM book |
| The Azure SSOT bridge | The Azure SSOT bridge | Adaptive-scope targets corrected; Purview/Fabric/mirroring verified; government-cloud availability caveat added; B.1.1 restated |
| The Evidence Bundle the assessor consumes | The evidence bundle the assessor consumes | Finding ID `GCC-BOUNDARY-3WAY-001` and §4 reference dropped; 3PAO/FedRAMP-cycle claim corrected to AO/SCA under RMF |
| What survives the engagement | What survives the engagement | Kept, including the metrics list; whitepaper link retargeted |
| Cross-references | Inline links throughout; Where to go next | Internal canon docs (B.1, B.1.1, Drift Standard, Directory Migration README, SQL adapter interface) have no workbook pages except the Drift Engine page, which is linked; the two companion case studies (identity-modernization, cloud-boundary) are not linked, because their content belongs to other B02 chapters and the case-studies pages may be archived |
