# Verification — Chapter 06, Routing to Owners and Ticket-to-Machine Tasks

New material, written November 9, 2026. Code: `examples/provider-notices` as built in phase 1 (PR #523): `Invoke-PnRoute.ps1`, `Read-PnRouting`, `Resolve-PnRoute`, `New-PnTaskPayload`, `Test-PnTaskPayload`, `Invoke-PnRouting`, `New-PnServiceNowSender`, `config/routing.json`, `templates/`. Provider facts are the guide's, read on the provider's own documentation on November 9, 2026 (`docs/books/guides/_verification/provider-notices-implementation.md`); this chapter cites the same pages. This chapter adds no provider fact.

Lab 1 was run with `python scripts/kit_captures.py pn` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 9, 2026; the captured output is in `data/kit-captures/pn/` and the images are in `captures/`. No code changed for this chapter.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Ticket-to-Machine lanes, the five clauses, P1 to P4 windows (program design) | Start with; Verified facts | carried (guide row 42) | Book 13, Chapter 10 and Appendix B; `finding_contract.py` |
| 2 | Service health email routed to the help desk supervisor; nothing approved on an email | Verified facts; Dangers | carried (guide row 40) | Book 15, Chapter 03 |
| 3 | Routing checks, first match, payload fields, state, absent handling, sending only with `-Send` and `routing.send` | The code | read in the kit's source and tests | kit |
| 4 | Lab 1 outputs (rules, the template refusal, 22 notices, 12 creates, the payload, 0 on the re-run, day-two counts, the six actions, 31 tests) | Lab 1 | verified by running the commands as written | `data/kit-captures/pn/06-*.txt` |
| 5 | Lab 2: the sender posts JSON with a bearer token and returns `sys_id` | Lab 2 | tested in `deploy/tests/Deploy.Tests.ps1` with a stand-in; not run against an instance | kit |
| 6 | No KSI cites base CM-4; KSI-CMT-LMC and KSI-CMT-VTD cite CM-4(2) | Federal requirements | carried (guide row 35) | `pn06-ksi` |

## Not yet specified (carried from the guide)

N11 the ServiceNow endpoint's shape.

## Federal requirements and evidence

Each row is a Lab step or a file the kit writes. Controls and KSIs are only the pairs in `config/requirements.json` (the guide's claims log, rows 33 to 38); no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers (Book 00, Appendix B).

## Review gate

`review-status: pending`. Not approved here.
