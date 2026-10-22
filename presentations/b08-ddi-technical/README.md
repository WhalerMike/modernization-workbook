# Book 08 — DNS, DHCP & IPAM: technical deep dive

The 50-minute technical presentation for [Book 08](../../docs/books/b08-ddi/index.md), built with the shared kit in [`../_build/`](../_build/README.md). It's the companion to the 15-minute briefing in [`../b08-ddi/`](../b08-ddi/README.md), for the network and DDI engineers who design the resolution paths, move authority off Active Directory DNS and run the result. This folder sits outside `docs/`, so the site doesn't render it.

The deck has two parts of about 22 minutes each after a 5-minute orientation, split into four modules of 10 to 12 minutes, each opened by a divider slide so it can be watched in parts:

| Part | Module | Chapters |
|---|---|---|
| Orientation | Title; why DNS is the control plane; what the mandates require and the canonical sequence | 01, 03, index (recap) |
| 1 — The hard surfaces | 1. Split-brain DNS and the AD DNS departure | 02, 04 |
| | 2. Edge interception, DNS identity and DNSSEC | 05, 06 |
| 2 — Building and running the control plane | 3. Private endpoints, IPAM and the reference architecture | 07, 08, Appendix C |
| | 4. Migration sequence and operating the control plane | 10, 11, Appendices A–B |

| File | Use |
|---|---|
| `B08_DDI_Technical.pptx` | The deck: 29 narrated slides (title, two orientation slides, four module dividers, 22 content slides), then a backup section with the full source lists |
| `B08_DDI_Technical_Narration_Script.md` | The narration text, for practice |
| `B08_DDI_Technical_Narrated.pptx` | Self-running version with the narration embedded and slide timings set (built by `build_narrated.ps1`; not yet generated) |
| `narration_B08_DDI_Technical/` | Per-slide audio, durations and captions (built by `narrate.py` and `captions.py`; not yet generated) |
| `build.js` | Slide content and speaker notes; rebuild with the commands in `../_build/README.md` |

Every fact on the slides comes from a footnoted chapter of Book 08; each slide's notes name the chapter, each slide carries a short Sources line, and the three backup slides list the primary sources in full. Vendors and products (Cisco, Infoblox and others) appear only as the book's examples of a requirement, never as endorsements, and release-stage, FedRAMP and government-cloud caveats are stated as the book states them. The slides show tables, flows and checks; the commands stay in the chapters, which mark them as illustrative.

`build.js` computes each slide's timing cue from its word count (142 words a minute; about 6,960 spoken words, 49 minutes) and warns when a table, panel or text box is likely to overflow.
