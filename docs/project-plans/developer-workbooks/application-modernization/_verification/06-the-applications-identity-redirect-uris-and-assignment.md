# Verification — Chapter 06, The Application's Identity: Redirect URIs and Assignment

New material, written November 24, 2026. Code: `examples/app-modernization` as on main at 57843f00, plus this change's additions (the `AppModernization` module, `Invoke-AmIdentityApply.ps1`, `tests/Identity.Tests.ps1` and `tests/fixtures/identity`). Facts carried from Book 18 keep that page's access date and say so; facts read for this chapter say "read November 24, 2026".

Lab 1 was run with `python scripts/kit_captures.py am` on Windows 11, PowerShell 7.6, Java 21.0.10 (Microsoft Build of OpenJDK) and Node.js 24.14.1, on November 24, 2026; the captured output is in `data/kit-captures/am/`. Lab 2 has not been run.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Redirect URI practice; `AADSTS50011`; URIs on the application object; separate development registrations; the `state` alternative | Start with; Verified facts | carried (Book 18, Appendix A) | `am06-best`, `am06-reply` |
| 2 | Dangling DNS | Start with; Verified facts | carried (Book 18, Appendix A) | `am06-dangling` |
| 3 | Assignment required: tokens, Global Administrators, user consent, API-only client assignment | Start with; Verified facts | carried (Book 18, Appendix A) | `am06-props`, `am06-assign` |
| 4 | `AADSTS50105`; P1 or P2 for group assignment | Start with; Verified facts | carried (Book 18, Appendix A) | `am06-50105` |
| 5 | The owned-domain rule (host equals the domain or ends with "." and it) | Gap table; Dangers | Book 18, Chapter 02's rule, read in its ranking script | Book 18 |
| 6 | Never restore a URI that failed ownership (Appendix A); nor one that dangles | Gap table | Appendix A's rollback table; the dangling rule is the kit's, labeled so | Book 18; kit |
| 7 | Every Lab 1 output | Lab 1 | verified by running the lab | `data/kit-captures/am/06-*.txt` |
| 8 | Lab 2: `New-MgApplication`, `New-MgServicePrincipal`, `Remove-MgApplication`; My Apps for the user test | Lab 2 | Graph PowerShell SDK cmdlets named in Appendix A and Learn's app registration samples; not run | — |

## Federal requirements and evidence

Controls and KSIs are only the kit's `config/requirements.json`, step `SNAPSHOT, WP4, WP5`. Every control-to-KSI pair there is one another kit in the repository already uses (provider notices, Azure security, the drift pipeline, Non-Person Identity Chapter 11): no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Review gate

`review-status: pending`. Not approved here.
