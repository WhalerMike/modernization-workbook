# Verification — Learning path: Information Protection with Microsoft Purview

Files: `docs/training/information-protection/index.md` and its five modules, `01-classes-access-and-the-baseline.md` to `05-audit-drift-and-evidence.md`.
Example code: `examples/information-protection`, the kit of the developer workbook *Building Information Protection*.
Verified: 2026-11-24, phase 3 of filling the Information Protection topic's gaps (owner's instruction of Nov 24, 2026).

Method:
- **No new facts.** Every fact a module states is carried by link from the information protection implementation guide (`docs/books/guides/information-protection-implementation.md`, draft of Nov 24, 2026, review pending), Book 20 or the developer workbook. Their verification logs hold the sources. No Learn page was read again for the path beyond what those logs record (the guide's GCC table and shells were read on Nov 24, 2026).
- **Knowledge checks.** Each answer links the section that teaches it; the answer was checked against that section's text.
- **Lab 1** in every module links the developer workbook's chapter labs. Those were run as printed on the kit's fixtures (`data/kit-captures/ip/`); the modules restate only what the captures show.
- **Lab 2** in every module uses the guide's Validate commands with only their placeholders. Every step reads; `Test-IRMConfiguration` (Module 3) sends a test message between two test mailboxes, as Learn and Book 20, Chapter 06 give it. None was run by the authors, and the pages say so. The expected result each step states is the guide's pass line.
- **GCC.** GCC only, as the guide gives it: no extra connection parameters; the six features not available in GCC and their interim paths; the three not yet specified.
- **Time estimates** are the program's planning figures (design guidance), not measurements.
- **Claim wording.** The gates support the controls; the assessor decides them. KSIs are written as indicators for cloud service providers that the agency lines its evidence up with. Only the guide's *Requirements and KSIs* pairs appear.
- **Search before writing.** No information protection learning path existed on `origin/main` at 57843f00. Book 16 covers user training on labels and encrypted mail; this path is for the people who build and run the controls, and doesn't repeat it.
