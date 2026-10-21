# Verification — Appendix A, What to Ask a Cloud Provider For

Writer W2. All sources opened October 21, 2026, as for Chapters 03 and 04.

Source: `docs/whitepapers/fedramp-20x-and-the-commercial-feature-gap.md`, §7 (five asks), with the ExpressRoute template from §4.2 used as the model for how to ask.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | ExpressRoute for Microsoft 365 authorized only where a regulatory requirement mandates direct connectivity; Microsoft asks for the text excerpt and web link | How to make the ask; A2 | verified | Learn, "Assessing Enterprise network last mile" note |
| 2 | FedRAMP certification and FISMA don't by themselves supply the ExpressRoute hook | A2 | restated-as-design | Program reading of Microsoft's criterion; the playbook detail is in Ch09 |
| 3 | CDS-CSO-SVC and CDS-CSO-PUB requirements | A1 | verified | CDS page and ruleset |
| 4 | Network connectivity not in GCC Moderate, GCC High, DoD | A3 | verified | Learn network connectivity overview |
| 5 | Provider types ISP, Overlay, Corporate; Overlay = VPN, Cloud Proxy, SD-WAN, SASE | A3 | verified | Learn network provider details page |
| 6 | MSO365MT Class C Certified; MSO365MTA Class D In Process; same name | A4 | verified | products.json |
| 7 | A class change requires a new assessment | A4 | verified | SCN-CSO-EVA |
| 8 | Microsoft's GCC service description says FedRAMP High | A4 | verified | Learn GCC service description |
| 9 | Agents and clients outside FedRAMP scope | A5 | verified | MAS-CSO-IIR note |
| 10 | Trust center MUST; programmatic access, uninterrupted sharing, six-month logs | A6 | verified | CDS-CSO-UTC; CDS-TRC-PAC, -USH, -ACL |
| 11 | 110 of 781 listings carry a trust_center value; none for the three Microsoft 365 government packages | A6 | verified | products.json, computed |
| 12 | SCN JSON, 12-month history, documented mechanism | A7 | verified | SCN-CSO-HRM, -HIS, -NOM |
| 13 | Agencies review ongoing certification reports | A7 | verified | CCM-AGM-ROR |
| 14 | CMU documentation; validated modules SHOULD at Class C, MUST at Class D; tenant defaults | A8 | verified | CMU-CSO-CMD, -UVM, -CAT |
| 15 | FIPS 140-2 certificates moved to the Historical List on September 22, 2026 | A8 | verified (settled) | Linked to Book 09 Ch03, which footnotes CMVP |
| 16 | "Three of [the asks] are strengthened rather than weakened by 20x" | Summary | corrected | Restated against the rules: A1, A5, A6, A7 and A8 rest on obligations the 2026 rules already place on providers |
| 17 | Review fix, Oct 21, 2026: "the largest single documented loss for network decisions" | A3 Basis | corrected (wording-only) | "Largest" implied a measured ranking the book doesn't have; now "the broadest documented loss," which the capability list that follows supports. No new claim. |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| §7 ask 1 (machine-readable exclusion list) | A1 | Tied to CDS-CSO-SVC |
| §7 ask 2 (exception path per feature) | A2 | — |
| §7 ask 3 (restore network observability or publish the obstacle) | A3 | — |
| §7 ask 4 (FedRAMP-compatible trust center) | A6 | — |
| §7 ask 5 (MSO365MT and MSO365MTA) | A4 | — |
| §7 closing paragraph | Summary | Corrected (#16) |
| (new) | A5, A7, A8 | Added from the rule families covered in Ch03 |
| §4.2 ExpressRoute | "How to make the ask" (as the model) | Full treatment in Ch09 (W4) |
