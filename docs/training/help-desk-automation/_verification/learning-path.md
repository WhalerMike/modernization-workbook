# Verification — Learning path: Help Desk Automation

New material, written November 27, 2026: the index and six modules. Every fact is carried by link from *Building Help Desk Automation* and Book 15, Chapter 12; the modules make no claim of their own about Microsoft, ServiceNow or SailPoint. Each module's controls and KSIs are the chapter's, from the kit's `config/requirements.json`.

## Lab 1 outputs

Each module's Lab 1 commands were run on November 27, 2026 on Windows 11, PowerShell 7.6 with Pester 5, in a scratch copy of `examples/help-desk-automation`, with `C:\FMWLabs\help-desk-automation` and `C:\FMWLabs\results` mapped to scratch folders and each statement run in turn in one session, as a reader pasting the blocks would. The printed output, with the scratch paths mapped back and the run folder's name shown as `<run>`, is what each "Expected output" block holds. Run again after any change to the kit.

| Module | Chapter steps it runs | Tests |
|---|---|---|
| 1 | Chapter 01, steps 1 to 5, 7, 10 and 11 | 17 passed |
| 2 | Chapter 02, steps 1, 3 to 6 and 9 | 5 passed |
| 3 | Chapter 03, steps 1 to 3, 5, 6, 8 (one job) and 10 | 22 passed |
| 4 | Chapter 04, steps 1 to 3, 5 to 7 | 1 passed |
| 5 | Chapter 05, steps 2 to 6, 9 and 11 | 20 passed |
| 6 | Chapter 06, the dry run on the fixtures | — |

## Lab 2

Each module's Lab 2 links its chapter's Lab 2, or Chapter 06's Stage 1, and `scripts/generate_labs.py` lists that lab's commands under it. Not run by the authors.

## Overlap search (origin/main, November 27, 2026)

Searched `docs/training` for "help desk", "typed change", "consent request", "Temporary Access Pass", "catalog item", "re-read". Found: the Ticket-to-Machine path (Modules 2 and 6 teach the clients and the re-read rule; linked as prerequisites, not repeated); the Provider Notices path (the same module form; no shared content). No conflict.
