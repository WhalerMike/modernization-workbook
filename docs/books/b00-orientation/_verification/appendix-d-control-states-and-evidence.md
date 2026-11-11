# Verification — Appendix D, Control States, Authority Labels and Evidence

New appendix, written November 11, 2026, from the workbook owner's anonymized "Zero Trust Assessment Closure Update Instructions" (global conventions G-01 to G-08). The instructions contain no agency, tenant, person, application, count or identifier, and none was added. Every external claim was checked against its primary source on November 11, 2026. Two wordings in the instructions were changed to follow the claim-language rule: "a control is not closed until all applicable states are satisfied" became "a finding is ready for closure only when every applicable state has evidence; closing it is the authorizing official's or assessor's call"; and "a finding is closed in the text" was not carried, because guidance never closes a control.

## Claims log

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | Five control states, their meaning and evidence | Control states | restated-as-design (the workbook's convention, from instruction G-01) | — | Nov 11, 2026 |
| 2 | Each determination statement produces a finding of satisfied or other than satisfied | Control states | verified (quoted) | NIST SP 800-53A Rev. 5, §3.3 | Nov 11, 2026 |
| 3 | Assessment methods examine, interview, test; objects specifications, mechanisms, activities, individuals | Evidence pattern | verified | NIST SP 800-53A Rev. 5, §2.4.1, §2.4.2 | Nov 11, 2026 |
| 4 | How-section template and its order | How-section template | restated-as-design (G-02) | — | Nov 11, 2026 |
| 5 | Report-only Conditional Access policies are evaluated at sign-in, not enforced, and logged in the sign-in log | How-section template | verified | Learn, "Analyze Conditional Access policy impact" | Nov 11, 2026 |
| 6 | Source policy, last-verified dates, "not yet specified" where Learn is silent | Sources | restated-as-design (G-03; Chapter 02 and CONTRIBUTING) | — | Nov 11, 2026 |
| 7 | Terminology table; Learn's example GUID format `00001111-aaaa-2222-bbbb-3333cccc4444` | Terminology | restated-as-design; format as cited in Book 19, Chapter 05's log | Learn (format) | Nov 11, 2026 |
| 8 | check_neutrality.py and check_identifiers.py behavior | Terminology | verified against the scripts in this change | `scripts/` | Nov 11, 2026 |
| 9 | Authority and applicability labels | Authority labels | restated-as-design (G-05) | — | Nov 11, 2026 |
| 10 | Evidence kinds | Evidence pattern | restated-as-design (G-06) | — | Nov 11, 2026 |
| 11 | Exclude emergency access accounts from CA policies that block or restrict sign-in; report-only needn't exclude; test regularly, e.g. quarterly | Change safety | verified | Learn, "Manage emergency access accounts in Microsoft Entra ID" | Nov 11, 2026 |
| 12 | CM-3 Configuration Change Control; CM-4 Impact Analyses | Change safety | verified (titles and intent) | SP 800-53 Rev. 5, release 5.2.0 | Nov 11, 2026 |
| 13 | Microsoft technology pillars: Identity, Devices, Data, Apps, Infrastructure, Networks, SecOps | Assessment mapping | verified | Learn, "Overview — Implement Zero Trust solutions" | Nov 11, 2026 |
| 14 | Zero Trust Assessment pillars in 3.1.0; 3.1.0 still the latest release | Assessment mapping | verified (`gh release list`; Book 11 Ch05 count of `Pillar` attributes) | GitHub microsoft/zerotrustassessment | Nov 11, 2026 |
| 15 | CISA ZTMM five pillars and three cross-cutting capabilities | Assessment mapping | verified | CISA ZTMM v2.0 §5, §5.6 | Nov 11, 2026 |
| 16 | SP 800-207 tenet 5: no asset inherently trusted; posture evaluated with each request | Assessment mapping | verified (quoted) | NIST SP 800-207 §2.1 | Nov 11, 2026 |
| 17 | ATT&CK Enterprise tactic names; content v20.1 | Assessment mapping | verified (the tactic list now includes Stealth and Defense Impairment; the page names only tactics on the current list) | attack.mitre.org | Nov 11, 2026 |

## Carry-forward ledger

| Source section | Where it went |
|---|---|
| Instructions, G-01 Control states | Control states; block `#block-control-states` |
| Instructions, G-02 How section template | How-section template; block `#block-how-section` |
| Instructions, G-03 Source policy | Sources and last-verified dates; block `#block-verification-row` |
| Instructions, G-04 Terminology | Terminology; `scripts/check_identifiers.py` |
| Instructions, G-05 Control language | Authority labels; block `#block-authority-label` |
| Instructions, G-06 Evidence pattern | Evidence pattern; block `#block-evidence-checklist` |
| Instructions, G-07 Change safety | Change safety; block `#block-change-safety` |
| Instructions, G-08 Assessment mapping | Assessment mapping; block `#block-assessment-mapping` |
| Instructions, editorial principle (design, implementation, validation, operational evidence, residual-risk acceptance) | Control states, and Book 11 Chapter 10's closure chain |
