# Book 09's SD-WAN Design on Cisco Catalyst SD-WAN: narrated research deck

A narrated walk through the research implementation guide [Building Book 09's SD-WAN Design on Cisco Catalyst SD-WAN](../../docs/research/cisco-sdwan-implementation.md), for network engineers. It shows how to build [Book 09 — Network & Transport](../../docs/books/b09-network/index.md)'s vendor-neutral design on the program's platform, and starts where the guide starts: Emergency Directive 26-03 and the Known Exploited Vulnerabilities floor as the gate before the fabric carries traffic. Why the program builds on this platform is in the product deep dive [SD-WAN and SASE Platforms Against Book 09's Requirements](../../docs/research/sdwan-platform-deep-dive.md). It's an example, not an endorsement by any agency. It's built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `Research_Cisco_SDWAN.pptx` | The deck: 20 narrated slides (the title, 18 content slides and a closing slide), then a backup section with what couldn't be verified and the full source list (two slides) |
| `narration.js` | What the voice says on each narrated slide, keyed by the slide's exact title: the slide's intent and one or two highpoints, with a lead-in to the next slide (about 2,300 words, about 15–16 minutes). `build.js` stops if a slide has no narration or a narration entry has no slide |
| `build.js` | Slide content and speaker notes |

The narrated slides cover why the guide starts with a directive; ED 26-03's required actions and deadlines; the nine KEV entries as a standing posture; the fixed-release floor per software train; CISA's hunt and hardening guidance and the gate checklist; the hosted (Catalyst SD-WAN for Government) or on-premises decision, and why hosting doesn't remove the gate; the 12-hub fabric, its components and on-premises sizing; path classes and lane discipline; segmentation and network access control; certificates and onboarding from the agency PKI; FIPS 140-3, Common Criteria and STIG status; TIC 3.0 patterns on Catalyst; Secure Access for Government, Global Secure Access and Microsoft 365 in GCC; evidence and telemetry; the phased build mapped to Book 09's gates; where the findings change Book 09's planning inputs; risks and vendor asks; the read-only example collector; and what to verify, decide and read next.

Each slide's speaker notes start with a timing cue and the spoken narration, then a `Detail:` block with the full content for a live presenter, and end with the section of the page they draw on. Each content slide carries a short Sources line naming the page's footnote sources (CISA, Cisco, FedRAMP Marketplace, NIST CMVP, NIAP, DISA and Microsoft Learn, all opened October 24, 2026). The page's labels are kept: *(design guidance)* for the program's recommendations, *(inference)* for conclusions the sources support but don't state, the phase windows as program design, and "not an endorsement by any agency." The narration doesn't read tables, CVE numbers or version strings aloud; the slides and notes carry them.

Four diagrams are reused from the committed set in `docs/images/diagrams/b09-network/png/` (`ch05-governor-attack-surface`, `ch11-hub-content-tier`, `ch08-branch-architectures`, `ch11-retirement-gates`, with the chapters' full alt text), placed at their PNG aspect ratio. No new diagram sources were made.

## Build

```bash
cd presentations/research-cisco-sdwan
source /c/tmp/deckenv.sh          # NODE_PATH, APPLY_THEME, VALIDATE
node build.js Research_Cisco_SDWAN.pptx
python "$VALIDATE" Research_Cisco_SDWAN.pptx
python ../_build/a11y_check.py Research_Cisco_SDWAN.pptx
```

`build.js` enforces titles of at most 58 characters, unique across the deck, and Sources lines of at most 185 characters. It prints the spoken words per slide and warns (lines starting with `!`) when a table, panel, flow or callout is likely to overflow, or when a panel or callout has more slack than its content needs; panels passed a null height size themselves to their content. Run it with `FIT=1` to print each element's estimated fit. The narrated edition (audio, captions, self-running deck) is made separately with `../_build/narrate.py`, `captions.py` and `build_narrated.ps1`.
