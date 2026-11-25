# Verification — Chapter 07, The Post-Change Test and the Evidence Pack

New material, written November 24, 2026. Code: `examples/app-modernization` as on main at 57843f00, plus this change's additions (the WP6 and evidence-record functions in the `AppModernization` module, `config/requirements.json`). Facts carried from Book 18 keep that page's access date and say so; facts read for this chapter say "read November 24, 2026".

Lab 1 was run with `python scripts/kit_captures.py am` on Windows 11, PowerShell 7.6, Java 21.0.10 (Microsoft Build of OpenJDK) and Node.js 24.14.1, on November 24, 2026; the captured output is in `data/kit-captures/am/`. Lab 2 has not been run.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Sign-in fields; Graph beta; P1 or P2 | Start with; Verified facts | carried (Book 18, Appendix A) | `am07-signin` |
| 2 | Sign-in logs through Graph in GCC: not yet specified | Verified facts | carried (Book 18, Appendix A's GCC table) | Book 18 |
| 3 | SHA-256 in FIPS 180-4 | Verified facts | verified November 24 | `am07-fips180` |
| 4 | The after snapshot, the trigger and its explanation, the seal, the edit found, the chain | Lab 1 | verified by running the lab | `data/kit-captures/am/07-*.txt` |
| 5 | The step table | Federal requirements and evidence | read from `config/requirements.json` | kit |

## Federal requirements and evidence

Controls and KSIs are only the kit's `config/requirements.json`, step `WP6`. Every control-to-KSI pair there is one another kit in the repository already uses (provider notices, Azure security, the drift pipeline, Non-Person Identity Chapter 11): no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Review gate

`review-status: pending`. Not approved here.
