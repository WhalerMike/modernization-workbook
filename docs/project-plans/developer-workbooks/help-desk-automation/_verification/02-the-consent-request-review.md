# Verification — Chapter 02, The Consent Request Review

New material, written November 27, 2026. Code: `Get-HtPendingConsentRequest`, `config/consent-review.json`, `deploy/Invoke-HtScheduledRun.ps1 -Job consent`. Learn pages read November 27, 2026 with WebFetch: *List appConsentRequests*, *Configure the admin consent workflow*. Lab 1 was run with `python scripts/kit_captures.py ht` on November 27, 2026; the output is `data/kit-captures/ht/02-*.txt`. No kit change for this chapter beyond Chapter 01's path fix, which the review's files also use.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | `GET /identityGovernance/appConsent/appConsentRequests`; `ConsentRequest.Read.All` least privileged, `ConsentRequest.ReadWrite.All` higher | Start with; Verified facts | verified Nov 27 | `ht02-list` |
| 2 | `$filter` (`eq`) on `userConsentRequests`; Example 2's filter; the response doesn't expand the relationship (quoted) | Start with; Verified facts | verified Nov 27 | `ht02-list` |
| 3 | List userConsentRequests, same permission | Start with | carried (kit `config/calls.json`) | `ht02-user-list` |
| 4 | The workflow: Global Administrator turns it on; requests emailed to reviewers; "Consent request expires after (days)" | Start with; Lab 2 | verified Nov 27 | `ht02-workflow` |
| 5 | HT-CR-01, HT-CR-02, the register's columns, the manifest | The code | read in the module and tests | kit |
| 6 | Lab 1 outputs (2 pending, 1 finding, 1 warning; Fabrikam 15 days, 2 requesters; manifest hash matches; strict limit 2 findings; job exit 2; 5 tests) | Lab 1 | verified by running the commands | `data/kit-captures/ht/02-*.txt` |
| 7 | Lab 2 behavior | Lab 2 | not run | — |

## Not yet specified

N1 whether the URL-encoded filter the kit sends behaves as Learn's unencoded example.

## Federal requirements and evidence

Four rows; `config/requirements.json` for `consent-requests` (AC-6, AC-20, CA-7, SA-9; KSI-IAM-ELP). No new pair.

## Overlap search (origin/main, November 27, 2026)

Searched for "admin consent", "consent request", `ConsentRequest.Read.All`, `appConsentRequests`. Found: Book 15, Chapter 12, task 3 (the verdict before configuration; linked), Book 04, Chapter 06 (who approves admin consent; linked), Book 15, Chapter 06 (SaaS integration governance; not repeated). Other workbooks read consent grants, not pending requests. No conflict: every page puts the decision with the identity governance approver, never the help desk.
