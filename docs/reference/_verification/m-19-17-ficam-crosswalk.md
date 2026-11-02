# Verification — M-19-17 and FICAM Crosswalk (reference)

File: `docs/reference/m-19-17-ficam-crosswalk.md`
Verified: 2026-11-02

Method:
- M-19-17 read from the White House PDF (text layer extracted locally), November 2, 2026: the six sections, the numbered items in §III, the Governance, Architecture and Acquisition items in §IV, the five items in §V, §VI's government-wide responsibilities, and the rescissions.
- FICAM Architecture read at idmanagement.gov/arch/ the same day: version 3.3 (header June 30, 2023; version table June 20, 2023); five service areas and their services; the page's own description of the architecture as "a framework for an agency to use in the ICAM program and solution roadmap planning". The older URL idmanagement.gov/architecture/ returned 404.
- Workbook locations found by searching docs/books for M-19-17, FICAM, ICAM governance, derived PIV, federation, Federal PKI, device certificates, workload identities, access reviews, joiner/leaver, PIM, Login.gov, 800-63, identity proofing, continuous vetting, digital signature, S/MIME, FAR 4.13 and 52.204-9, Approved Products List, Best in Class and PACS, and reading each hit.
- No personal data was sent to any site.

| # | Claim (short) | Verdict | Source |
|---|---|---|---|
| 1 | Section structure and item wording | verified | M-19-17 PDF |
| 2 | §II: agencies "must implement" SP 800-63-3 and successive versions | verified | M-19-17 PDF, §II |
| 3 | §III.6 is a "should" | verified | M-19-17 PDF |
| 4 | FICAM services as listed; architecture is a planning framework | verified | idmanagement.gov/arch/ |
| 5 | No page covers continuous vetting, PACS, the APL, Best in Class vehicles, or acceptance of other agencies' PIV | verified (repository search) | — |
| 6 | Cross-agency federation "designed, not built" | verified | Book 13, Ch 12 |
| 7 | Each Strong / Partial / Gap mark | inference from reading the linked pages | — |
