# Verification — Chapter 02, Microsoft 365 Message Center and Service Health

New material, written November 9, 2026. Code: `examples/provider-notices` as built in phase 1 (PR #523): `ConvertTo-PnM365Notice`, the `m365-*` calls in `config/calls.json`, `Get-PnLiveCommand` and `Assert-PnLiveContext` for Graph. Provider facts are the guide's, read on the provider's own documentation on November 9, 2026 (`docs/books/guides/_verification/provider-notices-implementation.md`); this chapter cites the same pages. New facts read on November 9, 2026: none beyond the guide's. The Entra admin center path for removing a lab's consent (Lab 2, step 4) follows the program's other workbooks and was not re-read.

Lab 1 was run with `python scripts/kit_captures.py pn` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 9, 2026; the captured output is in `data/kit-captures/pn/` and the images are in `captures/`. No code changed for this chapter.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | `ServiceMessage.Read.All`, `ServiceHealth.Read.All`; admin consent only; a delegated user needs an admin role | Start with; Verified facts | carried (guide row 12) | `pn02-overview` |
| 2 | List messages, issues, health overviews on v1.0 | Start with; The code | carried (guide row 12) | `pn02-messages`, `pn02-issues` |
| 3 | GCC on `graph.microsoft.com` | Start with; Lab 1 step 2 | carried (guide rows 12 and 13) | `pn02-deployments` |
| 4 | Data privacy messages: Global Administrator, Message Center Privacy Reader | Start with; Dangers | carried (guide row 15) | `pn02-roles` |
| 5 | `Get-MgServiceAnnouncementMessage` in `Microsoft.Graph.Devices.ServiceAnnouncement` | Lab 2 step 2 | carried (guide row 16); `-All`, the SDK's paging switch, not re-read | `pn02-messages` |
| 6 | Kind mapping, action basis, case-insensitive enums, host guard | The code; gap table | read in the kit's source and tests | kit |
| 7 | Lab 1 outputs (permissions, hosts, 6 notices, the basis table, day-two posts, the live URL, the refused next link, 15 tests) | Lab 1 | verified by running the commands as written | `data/kit-captures/pn/02-*.txt` |
| 8 | Lab 2 behavior | Lab 2 | not run against a tenant | — |

## Not yet specified (carried from the guide)

N6 Message center tag values; N7 the admin roles Graph accepts for a delegated read.

## Federal requirements and evidence

Each row is a Lab step or a file the kit writes. Controls and KSIs are only the pairs in `config/requirements.json` (the guide's claims log, rows 33 to 38); no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers (Book 00, Appendix B).

## Review gate

`review-status: pending`. Not approved here.
