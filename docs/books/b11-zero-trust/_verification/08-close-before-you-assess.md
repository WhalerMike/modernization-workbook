# Verification — Chapter 08, Close Before You Assess

Writer W3. All sources opened October 21, 2026. See the Chapter 04 verification file for the BOD 25-01 page, implementation guidance and Required Configurations page checks; rows below cover claims specific to this chapter.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Early deadlines Feb 21 and Apr 25, 2025 | Opening | verified | BOD 25-01 page |
| 2 | ZTA is read-only | Opening | verified | Learn get-started |
| 3 | Continuous reporting is a BOD 25-01 obligation | Opening | verified | BOD 25-01 Required Action 2 |
| 4 | Assessors can't design CA set, legacy-auth retirement, device/workload identity | Can't do | restated-as-design | Program argument; ZTMM Advanced stage per settled facts (Ch03) |
| 5 | "ScubaGear can tell you DNSSEC is disabled" | Can't do | corrected | No v1.8.0 M365 baseline mentions DNSSEC (searched all seven; also `main` exo.md). Replaced with the SPF/DMARC record checks the EXO baseline actually makes |
| 6 | MS.EXO.2.2v2 SPF for each domain; MS.EXO.4.1v1 DMARC per second-level domain; 4.2v1 p=reject | Can't do; layers | verified | v1.8.0 `exo.md` |
| 7 | GCC-Moderate boundary conflict "documented in B.1.1" | Can't do | restated-as-design | Internal document reference dropped; generalized to conflicts between TIC 3.0, Zero Trust and FedRAMP with links to Books 09 and 10 |
| 8 | BOD background "remediate deviations from the secure configuration baselines" | Can't do | verified | BOD 25-01 page |
| 9 | 10 of 29 rules attestable by SCuBA; 19 need built architecture | Two kinds | restated-as-design | Federal Compliance series Book 00 (internal decomposition, as the source itself says); linked |
| 10 | FedRAMP 2026 KSIs: 46 indicators, ten themes; KSI-SVC-ACM automated config management reviewed for drift; KSI-SCR-MON; Recovery Planning | Two kinds | verified (new) | fedramp.gov 2026 Key Security Indicators page |
| 11 | KSIs apply to cloud service providers | Two kinds; sequence | verified | FedRAMP rule FRR-KSI-01 ("Cloud service providers MUST apply ALL Key Security Indicators...") as returned by a fedramp.gov search result; the 2026 page lists indicators |
| 12 | ILLUSTRATIVE MS.AAD.1.1v1 [N]/[X]/[Y] example | Callout | kept, labelled illustrative | Source callout |
| 13 | Six-phase sequence (Understand … Authorize) with assessment at phase 5 | Sequence | restated-as-design | Program sequence. Phase 1 note softened: a read-only first run may inform the gap list |
| 14 | RMF order Implement → Assess → Authorize → Monitor | Sequence | verified (new) | NIST SP 800-37 Rev. 2 page |
| 15 | New tenants: mandatory baselines + continuous monitoring before ATO | Sequence | verified | BOD 25-01 Required Action 5 |
| 16 | Phase 6 "Submit KSI-ready, machine-readable evidence to FedRAMP 20x evaluators" | Sequence | corrected | An agency's own M365 tenant is authorized by the agency AO; FedRAMP authorizes CSP offerings and KSIs apply to CSPs (rows 10–11) |
| 17 | Layers: DDI/PKI, device/workload identity (NAC, CBA, managed identity), phased legacy-auth elimination, exception governance | Layers | restated-as-design | Program design; cross-links to Books 04–09 |
| 18 | CA001 meets MS.AAD.1.1v1 after legacy clients move | Layers | verified (settled) | Book 04 Ch07 |
| 19 | AOs may accept risk; deviations explained when reporting | Layers | verified | BOD 25-01 page |
| 20 | "Omitted" with rationale; approved via risk management; tracking template | Layers; triage | verified | Implementation guidance |
| 21 | Three responses (config change, architectural work, risk acceptance) | Triage | restated-as-design | Source ask; program rule |
| 22 | "Continuous-reporting obligation is not satisfied by re-running ScubaGear manually before an audit" | Then assess | corrected | The directive allows quarterly manual reporting. Restated: either route satisfies the directive; the program wants run-to-run aging and disposition beyond it |
| 23 | Drift layer: three dispositions, retirable acceptances, run-to-run drift, non-zero exit only when unowned; not an assessor/maturity model/remediator | Then assess | restated-as-design | Program tooling (source named ScubaDrift and ZTTTdrift); names not carried |
| 24 | Vol VII Book 02: SCuBA drift as typed remediation tasks with closure evidence | Then assess | restated-as-design | Linked workbook page |
| 25 | GWS inventory Nov 2, 2026; tools Dec 1, 2026 | Limits | verified (new) | Implementation guidance |
| 26 | ZTA not a BOD 25-01 requirement | Limits | verified | BOD 25-01 page |

## Carry-forward ledger

Source: `docs/whitepapers/bod-25-01-close-before-assess.md` (shared with Chapter 04).

| Source page § | Went to | Or why not carried |
|---|---|---|
| Download DOCX callout | — | Site artifact for the archived page |
| Problem, solution, ask box | Ch08 opening (problem, solution); §Route every finding (ask: three responses); Ch04 §Administrative obligations and substantive work | "Fund the architectural layers in §5 before the next reporting cycle" carried as the layer sequence |
| Executive summary | Ch08 opening; Ch04 §What BOD 25-01 requires | — |
| Figure (six-phase sequence SVG) | `ch08-close-then-assess` (house style) | Old SVG not reused |
| §1 What BOD-25-01 actually requires | Ch04 | Corrected to six required actions |
| §2 What the assessors measure, and what they don't | Ch08 §What the assessors can't do | DNSSEC claim corrected (row 5); B.1.1 reference generalized (row 7) |
| §3 Coverage arithmetic + ILLUSTRATIVE callout | Ch08 §Two kinds of finding | FedRAMP KSI context added (rows 10–11) |
| §4 The correct sequence (table) | Ch08 §The sequence | Phase 6 corrected (row 16); RMF anchor added |
| §5 Closing findings first (four layers) | Ch08 §Closing findings first | — |
| §6 Then assess continuously (ScubaDrift, ZTTTdrift, Vol VII Book 02) | Ch08 §Then assess, continuously | Manual-reporting claim corrected (row 22); tool names generalized (row 23) |
| §7 Honest limits | Ch08 §Where this argument stops | Workspace dates added |
| §8 Conclusion | Ch08 closing paragraph | — |

## Diagrams

| Source | Replaces |
|---|---|
| `ch08-close-then-assess.flow.yaml` | `docs/images/whitepapers/bod-25-01-close-before-assess-diagram-01-six-phase-sequence.svg` |
| `ch08-finding-triage.flow.yaml` | New (three-response routing from the source's ask) |

## Additions, October 23, 2026 (certificates and the CLM platform)

At the user's request, every certificate-dependent book maps its certificates to Book 07 and the CLM platform. Source: the certificate-touchpoints research brief (program working file), Book 07 Ch04/Ch05/Ch07/Ch08 and CyberArk 26.1 documentation (accessed Oct 23, 2026).

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Certificates section: class, issuer and renewal engine per certificate | Certificates in this book and the CLM platform | restated-as-design (Book 07's classes applied); items marked inference are labeled | Book 07 Ch04, Ch05 |
| 2 | CyberArk mechanism (disc) | Same section | verified (noted) | CyberArk 26.1 docs, note clm-disc |
