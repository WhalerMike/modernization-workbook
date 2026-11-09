# Verification — Chapter 03, Oracle Cloud Infrastructure Announcements

New material, written November 9, 2026. Code: `examples/provider-notices` as built in phase 1 (PR #523): `ConvertTo-PnOciNotice`, the `oci-*` calls, the realm table in `Get-PnCloud`. Provider facts are the guide's, read on the provider's own documentation on November 9, 2026 (`docs/books/guides/_verification/provider-notices-implementation.md`); this chapter cites the same pages. New facts read on Oracle's documentation on November 9, 2026: `oci setup config` and `oci --version` (Installing the CLI); `oci iam policy create` (required `--compartment-id`, `--name`, `--description`, and `--statements` as a JSON array, inline or `file://`) and `oci iam policy delete --policy-id ... --force`.

Lab 1 was run with `python scripts/kit_captures.py pn` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 9, 2026; the captured output is in `data/kit-captures/pn/` and the images are in `captures/`. No code changed for this chapter.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | `list` with `--compartment-id`, `--all`, `--should-show-only-latest-in-chain`; `get --announcement-id` | Start with; Verified facts | carried (guide row 17) | `pn03-cli`, `pn03-get` |
| 2 | Announcement fields and enumerations | Start with; The code | carried (guide row 18) | `pn03-cli` |
| 3 | `read announcements` policy; `inspect` lists only | Start with; Lab 2 step 1 | carried (guide row 19) | `pn03-policy` |
| 4 | OC2 endpoints | Start with; Verified facts | carried (guide row 20) | `pn03-gov` |
| 5 | `oci setup config`; `oci --version` | Lab 2 step 2 | verified November 9 | `pn03-install` |
| 6 | `oci iam policy create`; `oci iam policy delete --force` | Lab 2 steps 1 and 4 | verified November 9 | `pn03-iam-cli` |
| 7 | The create command's JSON has `data.id`, and the list's `data.items` (Lab 2 steps 1 and 3) | Lab 2 | assumption, consistent with the kit's parser; the key casing is not yet specified (N8) | — |
| 8 | Chain handling, time-field mapping, realm guard | The code; gap table | read in the kit's source and tests | kit |
| 9 | Lab 1 outputs (permissions, realms, 4 notices, the table, the rescheduled window, the live command, 9 tests) | Lab 1 | verified by running the commands as written | `data/kit-captures/pn/03-*.txt` |
| 10 | An HR platform on OCI, said generically | In this chapter; Dangers | program fact, stated without naming a system or agency | — |
| 11 | Lab 2 behavior | Lab 2 | not run against a tenancy | — |

## Not yet specified (carried from the guide)

N8 the CLI's output key casing; N9 the OC3 endpoint.

## Federal requirements and evidence

Each row is a Lab step or a file the kit writes. Controls and KSIs are only the pairs in `config/requirements.json` (the guide's claims log, rows 33 to 38); no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers (Book 00, Appendix B).

## Review gate

`review-status: pending`. Not approved here.
