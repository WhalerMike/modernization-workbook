# Verification — Chapter 03, Proving the Move

New material, written November 24, 2026. Code: `examples/app-modernization` as on main at 57843f00, plus this change's additions (`LabReportsTest`). Facts carried from Book 18 keep that page's access date and say so; facts read for this chapter say "read November 24, 2026".

Lab 1 was run with `python scripts/kit_captures.py am` on Windows 11, PowerShell 7.6, Java 21.0.10 (Microsoft Build of OpenJDK) and Node.js 24.14.1, on November 24, 2026; the captured output is in `data/kit-captures/am/`. Lab 2 has not been run.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | FIPS 180-4 specifies SHA-256; August 2015 | Start with; Verified facts | verified November 24: the CSRC page (date) and the PDF's Explanation (algorithm list) | `am03-fips180` |
| 2 | The three checks, what each proves, the canonical form | The code | read in `Validator.java`, `Canonical.java` and the README | kit |
| 3 | Each kind of damage fails exactly the checks shown, with the key | Lab 1 steps 3 to 5 | verified by running the lab | `data/kit-captures/am/03-*.txt` |
| 4 | The delta loads four cases (inclusive bound) | Lab 1 step 6 | verified by running the lab; matches `MigrationTest` | kit |
| 5 | Reports hold no row contents | Lab 1 step 7 | verified by running the lab | kit |
| 6 | Delta limits: no applicant timestamp; deletes need change data capture | The code | carried from the kit's README and Book 18, Chapter 04 | kit |

## Federal requirements and evidence

Controls and KSIs are only the kit's `config/requirements.json`, step `PROVE`. Every control-to-KSI pair there is one another kit in the repository already uses (provider notices, Azure security, the drift pipeline, Non-Person Identity Chapter 11): no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Review gate

`review-status: pending`. Not approved here.
