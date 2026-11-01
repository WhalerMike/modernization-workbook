# Verification — Chapter 01, The Loop and the Typed Task

New material; it replaces no workbook page. Code: `examples/servicenow-sailpoint/clients/python/finding_contract.py` (new), `tests/python/test_finding_contract.py` (new, 22 tests), `tests/fixtures/payloads/valid_finding.json` and `samples.json` (new). Test results on November 1, 2026, Windows 11, Python 3.14 with pytest, Node.js 24.14.1, PowerShell 7 with Pester 5: the kit's pytest suite 107 passed (45 before this workbook), node:test 15 passed (13 before), Pester 40 passed (unchanged).

Vendor pages opened on November 1, 2026: ServiceNow, Scripted REST APIs (Zurich); ServiceNow, Understanding PDIs (Yokohama, updated January 30, 2025); SailPoint Developer, Triggers; FedRAMP Marketplace `products.json` (last change November 1, 2026); NIST SP 800-53B Moderate baseline OSCAL profile 5.2.0. A web search on November 1, 2026 found ServiceNow community posts from July 2026 describing a newer developer-instance reclamation rule; not used as a source (research gaps, row 1).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Loop steps and which kit file performs each | The loop table | verified against the kit and Book 13, Appendix B | kit files; Book 13 |
| 2 | The script validates, maps severity to priority and due date, defaults by class, de-duplicates, derives the intended state | What exists | verified by reading the script and running its tests | `scripted-rest-identity-finding.js` |
| 3 | Tempo P1 0, P2 1 h, P3 24 h, P4 72 h is program design | What exists | restated-as-design (Book 13) | Book 13, Chapter 10 |
| 4 | Python constants equal the script's | What this chapter adds | verified by test | `test_constants_match_the_scripted_rest_script` |
| 5 | A vacuous intended state compares equal to anything | What this chapter adds | verified by reading `reread_verification.compare`, and by Chapter 05's test | kit code |
| 6 | Scripted REST URL format, API access policies, `REST_Endpoint` ACLs, `web_service_admin` to create only | Lab 2; verified facts | verified | ServiceNow, Scripted REST APIs |
| 7 | `idn:identity-attributes-changed` and `idn:post-provisioning`, fire-and-forget | Verified facts | verified | SailPoint, Triggers |
| 8 | ServiceNow GCC: High, JAB; SailPoint ISC: Moderate, agency | Verified facts | verified | FedRAMP Marketplace |
| 9 | PDIs free to Developer Program members; ten days unused; hibernation | Lab 2; verified facts | verified (page dated January 30, 2025); a newer rule unconfirmed | ServiceNow, Understanding PDIs |
| 10 | CM-3 and CA-7 in the Moderate baseline | Federal requirements | verified | OSCAL Moderate profile 5.2.0 |
| 11 | Lab 1 outputs (22 passed; the five-sample output; node 15; drift 12 accepted, 0 de-duplicate) | Lab 1 | verified by running the commands as written | local run, November 1, 2026 |
| 12 | Lab 2 behavior (201, 200 de-duplicated, 400) | Lab 2 | not run; follows the script and its tests | — |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| Kit README, data contract | Linked, not repeated | Link, don't repeat |
| Implementation example, evidence-record mapping | Linked | — |
| Book 13, Appendix B, the loop | The loop table | — |
| Kit verify list, item 10 | What couldn't be verified | — |
