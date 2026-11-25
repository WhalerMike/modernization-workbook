# Verification — Chapter 05, The Front End, Its Accessibility Check and the Containers

New material, written November 24, 2026. Code: `examples/app-modernization` as on main at 57843f00, plus this change's additions (`a11y.test.jsx`, `fakeService.js`, axe-core 4.14.1, the async timeout in `setupTests.js`). Facts carried from Book 18 keep that page's access date and say so; facts read for this chapter say "read November 24, 2026".

Lab 1 was run with `python scripts/kit_captures.py am` on Windows 11, PowerShell 7.6, Java 21.0.10 (Microsoft Build of OpenJDK) and Node.js 24.14.1, on November 24, 2026; the captured output is in `data/kit-captures/am/`. Lab 2 has not been run.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Section 508's comparable access | Start with; Verified facts | carried (Book 18, Chapter 06) | `am05-794d` |
| 2 | Revised 508 Standards: WCAG 2.0 A and AA; alteration | Start with; Verified facts | carried (Book 18, Chapter 06) | `am05-1194` |
| 3 | M-24-08: automated tools with targeted manual testing | Start with; Verified facts | carried (Book 18, Chapter 06) | `am05-m2408` |
| 4 | axe-core rules tagged `wcag2a`, `wcag2aa`; `button-name` and `label` tagged `wcag412`; `color-contrast` `wcag2aa` | Start with; Lab 1 step 3 | verified November 24 on axe-core's rule descriptions | `am05-axe` |
| 5 | axe-core 4.14.1 published 2026-11-16 | The code; Verified facts | verified November 24 on the npm registry | `am05-axe-version` |
| 6 | Ten web tests pass; the probe fails `button-name` and `label` | Lab 1 steps 2 and 3 | verified by running the lab | `data/kit-captures/am/05-*.txt` |
| 7 | The containers | Lab 2 | not run; Docker unavailable where the kit was built (Book 18, Chapter 08) | — |

## Federal requirements and evidence

Controls and KSIs are only the kit's `config/requirements.json`, step `A11Y`. Every control-to-KSI pair there is one another kit in the repository already uses (provider notices, Azure security, the drift pipeline, Non-Person Identity Chapter 11): no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Review gate

`review-status: pending`. Not approved here.
