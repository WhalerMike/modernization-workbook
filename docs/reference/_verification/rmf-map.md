# Verification — RMF Map (reference)

File: `docs/reference/rmf-map.md`
Verified: 2026-11-02

Method:
- SP 800-37 Rev. 2 read on csrc.nist.gov (publication page and the PDF), November 2, 2026. Task identifiers and long task statements taken from Chapter 3; short task names (for example "Impact-Level Prioritization", "Documentation of Planned Control Implementations") from the Chapter 3 task headings and the Appendix D summary table. The publication page lists no newer revision.
- Step purposes quoted from NIST's "About the RMF" page, read the same day.
- FIPS 199, FIPS 200, SP 800-60 Vol. 1 Rev. 1 publication pages and 44 U.S.C. §3554 read the same day. A-130 Appendix I §4.a read from the 2016 PDF.
- Workbook locations found by searching docs/books for each task's terms (FIPS 199, 800-60, categoriz, tailor, common control, hybrid, implementation statement, SAP, SAR, POA&M, risk acceptance, authorization decision, ongoing authorization, significant change, 800-137, PM-5, PM-9, P-6, information life cycle) and reading each hit in context. Kits' outputs read from each examples/*/README.md.
- No personal data was sent to any site.

| # | Claim (short) | Verdict | Source |
|---|---|---|---|
| 1 | Seven steps; 47 tasks (P-1 to P-18, C-1 to C-3, S-1 to S-6, I-1 and I-2, A-1 to A-6, R-1 to R-5, M-1 to M-7) and their names | verified | SP 800-37 Rev. 2, Ch 3 and App D |
| 2 | Step purposes as quoted | verified | NIST "About the RMF" |
| 3 | FISMA defines no impact levels; testing "no less than annually" | verified | 44 U.S.C. §3554(b) |
| 4 | SP 800-60 Vol. 1 Rev. 1 (Aug 2008) is the current final; no newer revision listed | verified | csrc publication page |
| 5 | A-130 App I §4.a requires categorization under FIPS 199 and SP 800-60 | verified | A-130 PDF |
| 6 | P-6 not treated in any book | verified (repository search) | — |
| 7 | No kit writes OSCAL | verified (search of examples/ for "oscal", none outside third_party) | — |
| 8 | Each coverage mark | inference from reading the linked chapters | — |
