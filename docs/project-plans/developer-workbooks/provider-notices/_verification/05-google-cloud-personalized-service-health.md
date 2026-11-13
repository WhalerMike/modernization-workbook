# Verification — Chapter 05, Google Cloud Personalized Service Health

New material, written November 9, 2026. Code: `examples/provider-notices` as built in phase 1 (PR #523): `ConvertTo-PnGoogleNotice`, the `google-*` calls. Provider facts are the guide's, read on the provider's own documentation on November 9, 2026 (`docs/books/guides/_verification/provider-notices-implementation.md`); this chapter cites the same pages. New facts read on Google Cloud's documentation on November 9, 2026: `gcloud auth login`, and `gcloud projects remove-iam-policy-binding` with `--member` and `--role`.

Lab 1 was run with `python scripts/kit_captures.py pn` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 9, 2026; the captured output is in `data/kit-captures/pn/` and the images are in `captures/`. No code changed for this chapter.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Project and organization events; `servicehealth.events.list` | Start with | carried (guide row 28) | `pn05-list` |
| 2 | Category `INCIDENT` only; no planned maintenance | Start with; Dangers | carried (guide row 28) | `pn05-event` |
| 3 | `gcloud service-health events list --project --location=global` | Start with; Lab 2 | carried (guide row 29) | `pn05-gcloud` |
| 4 | `roles/servicehealth.viewer` | Start with; Lab 2 | carried (guide row 30) | `pn05-iam` |
| 5 | Enable `servicehealth.googleapis.com` | Lab 2 | carried (guide row 31) | `pn05-enable` |
| 6 | Not in Assured Workloads FedRAMP Moderate or High, CJIS, ITAR | Start with; Lab 2; Dangers | carried (guide row 32) | `pn05-aw` |
| 7 | `gcloud auth login`; `remove-iam-policy-binding` | Lab 2 | verified November 9 | `pn05-auth` |
| 8 | The unverified organization call is refused without `-AllowUnverified` | Lab 1 step 6 | verified by running the command | `data/kit-captures/pn/05-6.txt` |
| 9 | Lab 1 outputs (permissions, 2 incidents, both closed on day two, one kind, the refusal, the project command, 8 tests) | Lab 1 | verified by running the commands as written | `data/kit-captures/pn/05-*.txt` |
| 10 | Lab 2 behavior | Lab 2 | not run against a project | — |

## Not yet specified (carried from the guide)

N10 the gcloud flags for organization events.

## Federal requirements and evidence

Each row is a Lab step or a file the kit writes. Controls and KSIs are only the pairs in `config/requirements.json` (the guide's claims log, rows 33 to 38); no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers (Book 00, Appendix B).

## Review gate

`review-status: pending`. Not approved here.
