# Verification — Chapter 08, Shutting Down a Retired or Replaced Application

New material, written November 27, 2026. Code: `examples/app-retirement` as on main at c5884c25, plus this change's two fixes, each with a test: `New-ArtDecommissionPlan` reads an `-AsOf` date given with no time zone as UTC, so the manifest's `asOfUtc` is the same on every machine (it was the date at local midnight converted to UTC); and a relative `-OutputPath` is written under PowerShell's current location (the plan's files went to the process's working folder after a `Set-Location`, so the write failed). The kit now has 15 Pester tests. Facts carried from Book 18 or Book 14 keep that page's access date and say so; facts read for this chapter say "read November 27, 2026".

Lab 1 was run with `python scripts/kit_captures.py am --ci --images` (which leaves out Chapters 01 to 05, marked local-only, and reran 06 and 07 unchanged) on Windows 11 and PowerShell 7.6, on November 27, 2026; the captured output is in `data/kit-captures/am/08-*.txt`, placed on the page with `--pages --saved`. Lab 2 has not been run.

## Overlap search (origin/main at c5884c25)

Searched by topic and by the terms retire, retirement, decommission, shut down, sunset, `accountEnabled`, and the 30-day restore, across `docs/books/guides/`, the books, the developer workbooks, the training paths, the topics and the kits.

| Existing content | What it holds | How this chapter uses it |
|---|---|---|
| Book 18, Appendix B | The six gates, who signs, the footprint, the commands, the kit | Linked for the procedure; not restated |
| Book 14, Appendix I | The authorization closure: ten steps, the closing decision | Linked for R6 |
| `examples/app-retirement` README | The kit's gates, labs and outputs | The chapter runs it; Lab 2 here is a scripted version of the README's |
| Book 18, Chapters 02 and 06 | The retire disposition; records at decommissioning | Linked from Appendix B; Chapter 02's dependency edges linked from Dangers |
| `examples/ad-retirement-evidence`, Book 00 Chapter 10 | Retiring Active Directory (gate G5) and legacy servers | A different subject; not linked |
| Topics page, Application Modernization | Lists the kit and its zip | Picks the chapter up from the workbook |

No guide covers application retirement. Facts that recur elsewhere agree: the 30-day restore of a deleted application or service principal (Book 04, Chapter 09; Book 01, Chapter 11 for users and groups).

**One pairing held, not resolved.** The kit's `config/requirements.json` names KSI-CMT-LMC but none of the controls the other pages pair it with: Book 18, Appendix B pairs it with CM-3 ("each change"), which the config doesn't list; Book 14, Appendix I pairs it with CA-5 and CA-7, which the config doesn't list either. The chapter lists the KSI as the manifest does and pairs it with no control until the owner decides.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | `accountEnabled` false disables sign-in, prevents tokens, shows *Deactivated*; true restores; the roles | Start with; Verified facts; Lab 2 | verified November 27 | `am08-disable` |
| 2 | A deleted application is restorable within 30 days, then permanently deleted; `Application.ReadWrite.All` | Start with; Verified facts; Lab 2 | verified November 27 | `am08-delete` |
| 3 | Restoring an enterprise application | Verified facts | carried (Book 18, Appendix B) | `am08-restore` |
| 4 | `GET /servicePrincipals(appId='{appId}')`, `Application.Read.All` | Verified facts | verified November 27 | `am08-spget` |
| 5 | `New-MgServicePrincipal` needs `appId`; Cloud Application Administrator | Lab 2 | verified November 27 | `am08-spcreate` |
| 6 | `servicePrincipalSignInActivities`: beta, `appId` filter, `AuditLog.Read.All`, Reports Reader, Security Reader or Security Administrator; global service only in its availability table; beta not supported in production | Start with; Verified facts; Dangers; Lab 2 | verified November 27 | `am08-spsignin` |
| 7 | GCC uses the worldwide Graph endpoints | Verified facts | carried (Book 18, Appendix A) | `am08-graph-clouds` |
| 8 | Last sign-in may include partial sign-ins during the preview | Verified facts; Dangers | verified November 27 | `am08-spsignin-resource` |
| 9 | `Remove-DnsServerResourceRecord`, `Disable-ADAccount` | Verified facts | carried (Book 18, Appendix B) | `am08-dns`, `am08-disable-ad` |
| 10 | The plan, the findings, the gates before the switch-off, ART-04 and ART-05, the manifest and the edit found, 15 tests | Lab 1 | verified by running the lab | `data/kit-captures/am/08-*.txt` |
| 11 | The 30-day window and the gate order | Start with | design (Book 18, Appendix B) | Book 18 |

## Federal requirements and evidence

Controls and KSIs are only the kit's `config/requirements.json`, step `retirement-plan`. The pairs shown, CM-8 with KSI-PIY-GIV and AC-2 with KSI-IAM-AAM, are the ones Book 18 Appendix B, Book 14 Appendix I and this workbook's Chapter 07 already use; CA-3, SR-12 and SI-12 have no KSI, as in Appendix B. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Review gate

`review-status: pending`. Not approved here.
