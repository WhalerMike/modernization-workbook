# Verification — Chapter 10, Evidence, Not Verdicts: From Findings to a Program

Writer W4. Sources: `docs/whitepapers/zero-trust-governance-whitepaper.md` (v1.3), `docs/whitepapers/zero-trust-governance-principles.md` (shared with Ch02, W1), `docs/operational-guides/zero-trust-assessment/index.md` (reading the dashboard, Power BI) and `docs/operational-guides/zero-trust-assessment.md` (short twin), plus §7 of the ScubaGear integration paper. All external sources opened October 21, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | ScubaGear result values and criticality variants | Read the result | verified | ScubaGear tooloutputschema.md, Control object |
| 2 | Summary counts: Failures = failed SHALL, Warnings = failed SHOULD, Manual = not automatically assessed | Read the result | verified | tooloutputschema.md, Summary object |
| 3 | ZTA statuses Passed/Failed/Investigate/Skipped/Planned/Error; Skipped reasons (not connected, not licensed, not supported, not applicable, timeout); Planned = UnderConstruction | Read the result | verified | ZTA source `Get-ZtTestResultStatus.ps1`, `Get-ZtTestStatus.ps1`, `Add-ZtTestResultDetail.ps1` |
| 4 | Report summary block doesn't reconcile | Read the result | restated-as-design | Program's observation from its testing |
| 5 | Skipped ≠ evidence; investigate permission errors | Absence of evidence | verified | ZTA PowerShell guide |
| 6 | Gov-cloud feature availability defined as differences from commercial | Absence of evidence | verified | Learn Office 365 GCC service description |
| 7 | Source: "A skipped check is not evidence that a CR26 indicator fails" (FedRAMP 20x) | Absence of evidence | restated-as-design (generalized) | FedRAMP 20x/CR26 wording dropped; principle kept for any authorization package |
| 8 | Severity 0–100, priority = severity ÷ effort, P1 ≥50, P2 ≥30, P3 ≥15, P4 >0 | Score and rank | restated-as-design | Program method |
| 9 | ZTA Risk Level, User Impact, Implementation Cost definitions | Score and rank | verified (new) | Learn ZTA glossary |
| 10 | Dashboard sheets and charts; Power BI steps | Score and rank | restated-as-design | Program toolkit |
| 11 | Different IDs and severity models; reconcile on NIST 800-53 | Reconcile | verified (IDs/models); design (spine) | Settled in Ch05; CISA mapping to 800-53 r5 FedRAMP High (mappings.md) |
| 12 | Config file annotate (comment, remediation date, warning for undocumented fails), incorrect result, omit (rationale, optional expiration); blind-spot warning | Exceptions | verified | ScubaGear v1.8.0 configuration.md |
| 13 | Omitted with rationale; approved within risk management process; coordinate with CISA | Exceptions | verified | BOD 25-01 implementation guidance |
| 14 | AOs may accept risk for deviations; explain deviations when reporting | Exceptions | verified | BOD 25-01 |
| 15 | Source: "move exceptions out of Word into canon exception declarations" | Exceptions | corrected | ScubaGear's own configuration file is the federal mechanism; the program keeps that file as canon rather than a separate declaration |
| 16 | CA-5 POA&M content; RA-7 respond per risk tolerance | POA&M | verified | SP 800-53r5 OSCAL catalog 5.2.0 |
| 17 | AO approves POA&Ms; determines significant change | POA&M; drift | verified | SP 800-37r2 App. D |
| 18 | ActionPlan.csv = failing SHALL with reason/timeline fields | POA&M | verified | ScubaGear v1.8.0 reports.md |
| 19 | OSCAL POA&M model purpose | POA&M | verified | NIST OSCAL layers reference |
| 20 | ZeroTrustWorkshop.json: experimental, skipped omitted, tasks start not-reviewed | POA&M | verified (new) | ZTA PowerShell guide |
| 21 | ZTMM: five pillars, three cross-cutting capabilities; capabilities mature per pillar and independently | Worklist to program | verified | ZTMM v2.0 §5, §5.6 |
| 22 | Three stall patterns | Worklist to program | restated-as-design | Governance principles; full treatment Ch02 |
| 23 | Pillar contribution table and "in practice" examples; pillar posture table | Worklist to program | restated-as-design | Governance whitepaper §2, §7 (program status) |
| 24 | ZTMM Optimal: fully automated, dynamic policies on automated/observed triggers, cross-pillar interoperability with continuous monitoring, centralized visibility | Advanced/Optimal evidence | verified (source paraphrase "continuous verification" replaced with CISA's wording) | ZTMM v2.0 §5 |
| 25 | Three evidence properties; two delivered, one target | Advanced/Optimal evidence | restated-as-design | Governance whitepaper §5 |
| 26 | ZTMM a general guide; no stage mandated | Advanced/Optimal evidence | verified | ZTMM v2.0 §5 (settled fact, Book 01) |
| 27 | Six drift classes; schema/provenance in CI | Drift | restated-as-design | Governance whitepaper §4 |
| 28 | Session continuity is CAE/token protection, not drift; CAE fidelity "inferred degraded" in GCC-Moderate (FINDING-006) | Drift | restated (finding reference removed) | Internal finding not verifiable externally; pointed to Book 04 and Book 09 Ch06 |
| 29 | BOD 25-01 reporting at least quarterly (manual, agency-hosted) | Re-assess | verified | Implementation guidance |
| 30 | New tenants: mandatory baselines and continuous monitoring before ATO | Re-assess | verified | BOD 25-01 required action 5 |
| 31 | CA-7 elements | Re-assess | verified | SP 800-53r5 OSCAL catalog 5.2.0 |
| 32 | `Invoke-SCuBADiff` on main, not in v1.8.0 | Re-assess | verified (new) | main diff.md; file absent at v1.8.0 tag (HTTP 404) |
| 33 | Source: GCC-Moderate silently lacks Endpoint Analytics, Device Health Attestation, Network Fence, ARC Server Monitoring | Boundary | removed (specifics) | Not re-verified in this chapter; boundary detail belongs to Book 10; generic statement kept |
| 34 | Boundary probe, derived telemetry adapters, compensating enforcement, ATO treatment | Boundary | restated-as-design | Governance whitepaper §6 |
| 35 | Named Commercial exceptions (Amazon Connect, SailPoint NERM), commercial-general and state-local boundaries | Boundary | not carried | Program boundary-registry detail; belongs to Book 10 |
| 36 | Eight governance decisions + four quarter steps | This quarter | restated-as-design | Principles Ask; whitepaper §8 (merged, de-duplicated) |
| 37 | Honest limits | Honest limits | restated-as-design | Whitepaper §9 plus program |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Governance whitepaper: Problem/solution/ask | Ch10 "this quarter" (four steps merged) | — |
| Governance whitepaper: Executive summary | Ch10 "From a worklist to a pillar program" | ZTMM pillar/stage summary is Ch02/Ch03 |
| §1 Why programs stall at Initial | Ch10 one-paragraph summary | Full argument in Ch02 (W1) |
| §2 Substrate contribution per pillar, and "in practice" (identity, devices, data) | Ch10 pillar table | KSI-IA-02 / KSI-IAM-APM naming note not carried (internal rule IDs) |
| §3 Identity as root namespace | Not carried here | Ch02 (W1) |
| §4 Continuous verification through drift | Ch10 "Drift is continuous verification" | — |
| §5 Evidence at Advanced/Optimal | Ch10 "What Advanced and Optimal evidence looks like" | — |
| §6 The boundary problem (GCC-Moderate) | Ch10 "The boundary as a governed finding" | Feature list and named exceptions to Book 10 (see claims 33, 35) |
| §7 Pillar-by-pillar maturity outlook | Ch10 pillar posture table | — |
| §8 What an agency can do this quarter | Ch10 "What an agency can do this quarter" | — |
| §9 Honest limits | Ch10 "Honest limits"; CAE point to drift section | FINDING-006 reference removed |
| §10 Conclusion | Ch10 epigraph and closing limit | — |
| Governance principles: Problem/solution/ask | Ask list merged into Ch10 "this quarter"; ownership asks in Ch07 | Problem/solution in Ch02 |
| Governance principles: Why programs stall; five principles; leadership takeaway | Ch10 summary paragraph; Ch07 | Full text in Ch02 (W1) |
| ZTA guide: Reading the dashboard (recompute, findings, severity, priority, buckets, worklist, quadrant) | Ch10 "Read the result" and "Score and rank" | — |
| ZTA guide: Verify boundary scope warning | Ch10 "Absence of evidence is a different claim" | FedRAMP 20x/CR26 wording generalized |
| ZTA guide: Power BI quickstart | Ch10 "Score and rank" | — |
| Short twin: Purpose | Ch10 opening | — |
| Short twin: Dimensions table (evidence sources per pillar) | Not carried as a table | Overlaps Ch05's coverage and Ch10 pillar table; the per-dimension signals are covered by Books 04, 05, 09 |
| Short twin: Assessment method (five steps) | Ch10 opening list | — |
| Short twin: Output ("value is in the evidence trail") | Ch10 opening | — |
| ScubaGear paper §7 Adoption posture (exceptions in canon, enforcement pairing, drift to AO) | Ch10 exceptions and drift sections | — |
| ScubaGear paper §6 windowed conformance | Ch10 "Re-assess on a cadence" (also Ch09) | — |

## Re-base on ScubaGear 2.0.0, October 26, 2026

Follows the weekly source watch (issue #160). Sources: ScubaGear tag `v2.0.0` (baselines, docs and `mappings/scuba-baseline-policy-migrations.csv`, raw files from GitHub), the v2.0.0 release notes (`gh release view v2.0.0 --repo cisagov/ScubaGear`), the same files at tag `v1.8.0` for comparison, and CISA's BOD 25-01 Required Configurations page, all read October 26, 2026. Policy counts are distinct `#### MS.<PRODUCT>.n.mvN` headings; indicator counts are policies whose entry carries the "BOD 25-01 Requirement" badge. No personal data was sent to any site; downloads used a generic User-Agent.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | `Invoke-SCuBADiff` shipped in 2.0.0: offline, no tenant contact, DiffResults.json/.csv and DiffReport.html | Re-assess on a cadence | verified (was dev-branch only) | v2.0.0 diff.md; release notes |
| 2 | Mappings, configuration and reports docs re-pointed to v2.0.0; content unchanged for the cited sections | Footnotes | verified | v1.8.0 vs v2.0.0 diffs |

## Moderate-civilian sweep, October 29, 2026

The workbook targets FedRAMP Moderate civilian agencies. Framing that read as High-only or Defense-specific was checked.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | CISA's SCuBA mapping is limited to FedRAMP High baseline controls; added: the High baseline contains every Moderate control, so the mapping serves a Moderate system too | Mapping sentence | fact unchanged; added sentence is inference (NIST SP 800-53B baselines are cumulative) | ScubaGear v2.0.0 mappings.md; NIST SP 800-53B |
