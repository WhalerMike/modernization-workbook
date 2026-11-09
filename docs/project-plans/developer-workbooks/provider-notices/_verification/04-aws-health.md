# Verification — Chapter 04, AWS Health

New material, written November 9, 2026. Code: `examples/provider-notices` as built in phase 1 (PR #523): `ConvertTo-PnAwsNotice`, the `aws-*` calls, the partition table. Provider facts are the guide's, read on the provider's own documentation on November 9, 2026 (`docs/books/guides/_verification/provider-notices-implementation.md`); this chapter cites the same pages. New facts read on AWS's documentation on November 9, 2026 (through the AWS documentation tools): the IAM CLI examples (`create-policy`, `attach-role-policy`, `detach-role-policy`, `delete-policy`) and `sts get-caller-identity`.

Lab 1 was run with `python scripts/kit_captures.py pn` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 9, 2026; the captured output is in `data/kit-captures/pn/` and the images are in `captures/`. No code changed for this chapter.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Event fields, categories, `actionability`, `personas`, `statusCode` | Start with; The code | carried (guide row 21) | `pn04-events` |
| 2 | DescribeEventDetails takes 1 to 10 ARNs; AffectedEntity | Start with; Lab 1 step 7 | carried (guide row 22) | `pn04-details` |
| 3 | A qualifying AWS Support plan; `SubscriptionRequiredException` | Start with; Lab 2; Verified facts; Dangers | re-read November 9 after the coordinator's note: AWS's pages disagree. The concepts page names Business Support+, Enterprise Support or Unified Operations; the API reference's Welcome page names Business, Enterprise On-Ramp or Enterprise Support; the GovCloud (US) page names Business or Enterprise. The chapter says "a qualifying AWS Support plan", cites both, and names no plan as settled. (The guide's wording is being fixed separately.) | `pn04-plan`, `pn04-gov` |
| 4 | No read-only managed policy; `health:Describe*` example | Start with; Lab 2 step 1 | carried (guide row 24) | `pn04-iam` |
| 5 | Active endpoint `us-east-1`; GovCloud single endpoint `us-gov-west-1`; EventBridge doesn't send public events there | Start with; Verified facts | carried (guide rows 25 and 26) | `pn04-endpoint`, `pn04-gov` |
| 6 | EventBridge `aws.health` | Verified facts | carried (guide row 27) | `pn04-eb` |
| 7 | IAM CLI commands; `sts get-caller-identity` | Lab 2 | verified November 9 | `pn04-cli` |
| 8 | `--query "length(events)"` on `describe-events` | Lab 2 step 3 | JMESPath on the documented `events` key; not run | `pn04-events` |
| 9 | Batching, kind mapping, the retirement rule, the partition guard | The code; gap table | read in the kit's source and tests | kit |
| 10 | Lab 1 outputs (permissions, partitions, 5 notices, the table, the bases, the GovCloud command, the 11-ARN refusal, 11 tests) | Lab 1 | verified by running the commands as written | `data/kit-captures/pn/04-*.txt` |
| 11 | Lab 2 behavior | Lab 2 | not run against an account | — |

## Federal requirements and evidence

Each row is a Lab step or a file the kit writes. Controls and KSIs are only the pairs in `config/requirements.json` (the guide's claims log, rows 33 to 38); no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers (Book 00, Appendix B).

## Review gate

`review-status: pending`. Not approved here.
