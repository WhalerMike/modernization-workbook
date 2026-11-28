# Verification — Chapter 05, The Request Pipeline and the One-Time Secret

New material, written November 27, 2026. Code: `Connect-HtRequestSystems`, `Test-HtApproval`, `New-HtOneTimeSecret`, `Invoke-HtRequestQueue`, `deploy/Invoke-HtRequestPipeline.ps1`, `deploy/Register-HtRequestPipeline.ps1`, `servicenow/scheduled-job-clear-one-time-secret.js`. Learn pages read November 27, 2026 with WebFetch: *Update user*, *Create temporaryAccessPassMethod*, *Delete microsoftAuthenticatorAuthenticationMethod*, *Delete phoneAuthenticationMethod*. SailPoint's v3 specification read November 27, 2026. Lab 1 was run with `python scripts/kit_captures.py ht` on November 27, 2026; the output is `data/kit-captures/ht/05-*.txt`.

**One kit change with this chapter.** A task with one KSI wrote `"ksis": "KSI-IAM-JIT"` (a string) in `evidence.json`, because a PowerShell subexpression unrolled the one-item list; it now writes a list. Test added: "the evidence keeps its KSIs as a list, even when the task has one".

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Password reset: `User-PasswordProfile.ReadWrite.All`; app-only also at least User Administrator; User Administrator for nonadmin users; `forceChangePasswordNextSignIn` best practice; not for federated users (quoted) | Start with; Verified facts | verified Nov 27 | `ht05-update` |
| 2 | List methods `UserAuthenticationMethod.Read.All` | Start with | carried (kit) | `ht05-methods` |
| 3 | Delete Authenticator app: application `UserAuthenticationMethod.ReadWrite.All` | Start with | verified Nov 27 | `ht05-authapp` |
| 4 | Delete phone: application `UserAuthenticationMethod.ReadWrite.All`; default MFA phone can't be deleted (quoted) | Start with | verified Nov 27 | `ht05-phone` |
| 5 | TAP: table's least privileged `UserAuthMethod-TAP.Read.All`; 10 to 43200 minutes; `isUsableOnce`; one usable pass | Start with; Not yet specified | verified Nov 27 | `ht05-tap` |
| 6 | Create user `User.Create`; add members `GroupMember.ReadWrite.All`; role assignments `RoleManagement.Read.Directory` | Start with | carried (kit) | `ht05-create`, `ht05-members`, `ht05-roles` |
| 7 | App-only `Connect-MgGraph` with a certificate | Start with | carried (PN Ch08) | `ht05-connect` |
| 8 | Access request status: `userAuth` only, `ORG_ADMIN`; states (nine); approval statuses (six); `currentOwner` | Start with; Not yet specified | verified Nov 27 | `ht05-status`, `ht05-states` |
| 9 | Client-credentials tokens have no user context; most admin APIs often 403 | Not yet specified | carried (TTM Ch03, Nov 1) | `ht05-isc-auth` |
| 10 | The checks, states, task actions, the secret's path, 120 minutes, the task's settings | The code | read in the module, scripts, templates and tests | kit |
| 11 | Lab 1 outputs (4 dry-run, 1 waiting, 5 refused; 4 done, 3 secrets; 0 files with the pass; two methods removed; 120 and 120; exit 2; refusals; 20 tests) | Lab 1 | verified by running the commands | `data/kit-captures/ht/05-*.txt` |
| 12 | Lab 2 behavior | Lab 2 | not run | — |

## Not yet specified

N1 **the SailPoint token for the status read** (see below); N2 the pass's write permission (WD-182 already records it); N3 any directory role an app needs for the method deletes and the pass in app-only use; N4 the `sys_attachment` table read in Lab 2 step 4.

## A disagreement, stopped on rather than settled

SailPoint's v3 specification lists `listAccessRequestStatus` under `userAuth` only (scope `idn:access-request-status:read`, user level `ORG_ADMIN`), with no `applicationAuth`. *Building Ticket-to-Machine*, Chapter 03 records SailPoint's statement that a client-credentials token has no user context and that most admin APIs often return 403 with one. The kit's README, `Connect-HtRequestSystems` and WD-182 sign the pipeline in to SailPoint with client credentials. The chapter states both and recommends neither; the owner decides, or the test stage proves it (Chapter 06, Step 1.8).

## Federal requirements and evidence

Five rows, using only `config/requirements.json`'s controls and KSIs for `typed-change`, `password-reset`, `authenticator-reset` and `account-create`. No new pair.

## Overlap search (origin/main, November 27, 2026)

Searched for "Temporary Access Pass", "temporaryAccessPass", "passwordProfile", "one-time secret", "separate channel", "re-read", "gmsa-fmphelpdesk", "request worker". Found: Book 15, Chapter 12, tasks 1, 2 and 4 (the separate channel rule; linked), Book 15, Chapter 04 (TAP and re-registration, high-risk tasks; not repeated), *Building Ticket-to-Machine*, Chapter 05 (the re-read rule for results; linked), Permissions by Run (generated from the same file; it lists `UserAuthenticationMethod.Read.All` for `authenticator-reset` from the list call's row, which WD-182's app list covers with the ReadWrite permission). Book 15, Chapter 12 says the operator holds no standing role; WD-182 gives the worker app the User Administrator role, which is the decision the chapter follows (the app, not a person, holds it). No conflicting fact beyond the SailPoint token question.
