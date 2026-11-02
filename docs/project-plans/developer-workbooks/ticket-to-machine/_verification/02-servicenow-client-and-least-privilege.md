# Verification — Chapter 02, The ServiceNow Client and Least Privilege

New material. Code: `config/calls.json` (new), `clients/python/kit_calls.py` (new), `tests/python/test_kit_calls.py` (new, 9 tests); the kit README's least-privilege table gains the evidence export row. Tests on November 1, 2026: as Chapter 01's log.

Vendor pages opened on November 1, 2026: ServiceNow, Client credentials grant workflow (Zurich, updated October 8, 2026); Table API (Zurich); Attachment API (Zurich); Scripted REST APIs (Zurich); FedRAMP Marketplace; NIST SP 800-53B Moderate profile 5.2.0.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Token: `POST /oauth_token.do`; `grant_type`, `client_id`, `client_secret` required; `scope` optional | What exists; facts | verified | ServiceNow, Client credentials grant workflow |
| 2 | Table API parameters and defaults (`sysparm_limit` 10,000; `sysparm_offset` 0; `sysparm_exclude_reference_link` false); the caller needs roles for the table | What exists; facts | verified | ServiceNow, Table API |
| 3 | Attachment upload parameters; `Content-Type` mandatory; no single role allows attachments by default | Call table; facts | verified | ServiceNow, Attachment API |
| 4 | Custom roles split by task | Call table | restated-as-design (labeled) | — |
| 5 | `test_kit_calls.py` fails on any undeclared call | What this chapter adds | verified by test | local run |
| 6 | AC-2, AC-5, AC-6, CM-3 in the Moderate baseline | Federal requirements | verified | OSCAL Moderate profile 5.2.0 |
| 7 | Lab 1 outputs (9 passed; the listing; `itil` extra; the evidence reader; 7 passed, 12 deselected) | Lab 1 | verified by running the commands | local run, November 1, 2026 |
| 8 | Machine Identity Console on Zurich; a system property on older releases | Lab 2; not verified | carried forward from the implementation example (read October 24, 2026), not reopened | implementation example |
| 9 | Lab 2 refusals | Lab 2 | not run | — |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| Kit README, least-privilege permissions | `config/calls.json` | — |
| Kit verify list, items 10 and 13 | What couldn't be verified | — |
| Implementation example, shared client pieces | Linked | — |

## Requirements and KSI pass, November 2, 2026

The federal requirements table gained a KSI column and a row for every Lab 1 and Lab 2 step and every file the kit's code writes for this chapter. Every row names the command or file that is the evidence.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| K1 | KSI IDs used: KSI-IAM-ELP, KSI-IAM-SNU, KSI-IAM-JIT, KSI-CMT-LMC, KSI-CMT-RVP, KSI-CMT-VTD, KSI-SCR-MIT, KSI-SCR-MON. Each row's KSI is an indicator whose "Related SP 800-53 Controls" include that row's control | Federal requirements table | verified: FedRAMP's Key Security Indicators page read November 2, 2026 (46 indicators; the related-controls lists match Book 13, Appendix A and Book 14, Chapter 03, read October 21, 2026). No ID is new to the repository | FedRAMP, Key Security Indicators |
| K2 | AC-3, CM-3(2), IA-5, SA-9 and SA-11 added to the Moderate footnote's list | Federal requirements footnote | verified against the SP 800-53B Moderate OSCAL profile, release 5.2.0, read November 2, 2026; the footnote keeps its November 1 date for the controls first listed | NIST OSCAL Moderate profile |
| K3 | KSIs are FedRAMP 20x indicators for cloud providers; the agency lines its evidence up with them and doesn't report them | Sentence under the table | restated from Book 00, Appendix B | Book 00, Appendix B |
| K4 | RA-7, CA-5, AU-14 and CM-4 (base control) are cited by no indicator; rows that rest on them, on the program's tempo or on lab clean-up say "None" | Federal requirements table | verified | FedRAMP, Key Security Indicators |
