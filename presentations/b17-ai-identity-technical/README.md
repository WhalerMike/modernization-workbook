# Book 17 — AI Identity Governance: technical deep dive

**Deck name: B17_AI_Identity_Technical.** The 50-minute technical presentation for [Book 17](../../docs/books/b17-ai-identity/index.md), built with the shared kit in [`../_build/`](../_build/README.md). It goes a level deeper than the 15-minute briefing in [`../b17-ai-identity/`](../b17-ai-identity/README.md) and the executive briefing in [`../b17-ai-identity-executive/`](../b17-ai-identity-executive/README.md). It's for identity engineers, security engineers and platform owners: the people who issue the credentials AI systems sign in with, write the policies that can stop them, and collect the logs and evidence that show what they did. This folder sits outside `docs/`, so the site doesn't render it.

The deck runs about 50 to 55 minutes live, in two parts split into four modules of 8 to 17 minutes. Each module opens with a divider slide, so the deck can be watched in parts:

| Part | Module | Chapters |
|---|---|---|
| Orientation | Title; why an agent that acts is an account | 01 |
| 1 — The identity and the inventory | 1. AI agents as identities, and the federal rules | 01, 02 (and 08 on the two decision tracks) |
| | 2. The inventory and the kinds of AI identity | 03, 04 |
| 2 — Governing it and proving it | 3. Owners, lifecycle, credentials and privilege | 05, 06 |
| | 4. Monitoring, the scan and authorization; decisions | 07, 08, 09, 10, Appendix A |

| File | Use |
|---|---|
| `B17_AI_Identity_Technical.pptx` | The deck: 32 narrated slides (title, orientation, four module dividers, 25 content slides and a closing decisions slide), then a backup section with the full source lists, one slide per module |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per slide before "Backup", in the conversational style: each slide's intent and its one or two highpoints, with a lead-in to the next slide (about 3,090 words, about 21 minutes) |
| `build.js` | Slide content and full speaker notes; rebuild with the commands in `../_build/README.md` |

The narrated edition (`B17_AI_Identity_Technical_Narrated.pptx`, its practice script, captions and per-slide audio) is generated separately by `narrate.py`, `captions.py` and `build_narrated.ps1`, and isn't in this folder yet. `narrate.py` speaks `narration.json` rather than the notes, and stops if an entry's title doesn't match its slide.

The speaker notes are the live script: about 7,700 words, each note carrying its timing cue at 142 words a minute and ending with the `Workbook: Book 17, Chapter NN …` reference it draws on. `build.js` prints the words and minutes per module. It also refuses a slide title longer than 58 characters or used twice, and a Sources line longer than 185 characters. It sizes each text panel to its contents when no height is given, and warns when a table, panel, callout or diagram is likely to overflow or a panel is left mostly empty. With `FIT=1` it prints each table's, panel's and diagram's estimated bottom edge.

## How it goes deeper than the other two Book 17 decks

- **The object model and the policy surfaces.** Agent ID's blueprint, blueprint principal, agent identity and agent's user account. The blueprint as the credential boundary. What Conditional Access can target for each token subject, and the boundaries it doesn't reach.
- **The lifecycle mechanics.** Owner, sponsor and manager rights. Creation defaults. Lifecycle Workflows sponsorship transfer. Expiry as the review. Disable before delete, the 30-day soft-delete window and the asynchronous cascade. Orphan criteria, and the fallback where agent features aren't available.
- **The logs and findings.** Where each kind of AI principal lands in the sign-in and audit logs. The four shadow-AI surfaces and the tools that see each one. The eight AI drift findings with their class, severity, auto-fix rule and route.
- **The scan and the package.** The five-step inventory scan and its counts on the 2025 public file. The central model, and how it compares with CDM. The five questions an authorizing official asks. IA-9 tailoring, the OSCAL 1.2.3 mapping and the AI clocks.

## Labels and sourcing

Every fact on the slides comes from a footnoted chapter of Book 17. Each slide's notes end with the chapter they draw on, each content slide carries a short Sources line, and the four backup slides list the primary sources in full. The program's own design is labeled program design or design guidance on the slide, and the federal rules are labeled as rules, as the book does. That design covers the seven-part model, the identity reading of the rules, the inventory join, the six kinds of AI identity, the sponsor and orphan rules, the credential and no-standing-privilege rules, the block-unless-approved policy, the three tool boundaries, the drift findings and severities, the scan, the central model, the evidence areas and the OSCAL mapping.

Product behavior carries its release stage (generally available or preview) and the date it was checked, October 21–22, 2026. Government-cloud availability is stated as Microsoft documents it, and "not published" means the documentation states none. Inventory counts were computed by the program from OMB's consolidated 2025 file, and the slides call them answers to reconcile rather than findings or systems. The chapters' PowerShell, HTTP and OSCAL fragments are illustrative and read-only. The deck describes them and doesn't reproduce them.

The diagrams are the committed PNG renders in `docs/images/diagrams/b17-ai-identity/png/`. Each one's alt text is read at build time from the chapter's own `fig-alt`. The deck draws no new diagrams.
