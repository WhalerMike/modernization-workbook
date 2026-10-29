# Book 08 — DNS, DHCP & IPAM: what a federal DDI platform must do

**Deck name: B08_DDI_Requirements.** A 25-minute companion briefing to [Book 08](../../docs/books/b08-ddi/index.md), built with the shared kit in [`../_build/`](../_build/README.md). It's for the CIOs, CISOs, network and DDI leads and acquisition teams who will buy or build a platform for the name and address layer. It answers three questions: what federal rules actually require of DNS, DHCP and IPAM; what to check before buying any DDI product; and how divisions can run their own DNS, DHCP and IPAM under central governance. The [15-minute deck](../b08-ddi/README.md) and the [technical deep dive](../b08-ddi-technical/README.md) carry the architecture and migration detail. This folder sits outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `B08_DDI_Requirements.pptx` | The deck: sixteen narrated slides, then a backup section with the full source lists, what couldn't be verified, and a slide-to-source map |
| `build.js` | Slide content and speaker notes; rebuild with the commands in `../_build/README.md` |

The narration script, per-slide audio, captions and the self-running `B08_DDI_Requirements_Narrated.pptx` haven't been generated yet. Build them with `../_build/narrate.py`, `../_build/captions.py` and `../_build/build_narrated.ps1 -Base B08_DDI_Requirements`.

## What the briefing covers

| Part | Slides | Source |
|---|---|---|
| **Why** | Title; DNS, DHCP and IPAM as a control plane; no rule names a vendor, the rules name capabilities (SP 800-53 SC-20/21/22 and CM-8, M-08-23, M-22-09, EO 14144 §4(c), CISA Protective DNS, TIC 3.0 v3.3, M-26-14 with CISA's Logging Reference Architecture, BOD 23-01 and BOD 26-04, M-21-07, SP 800-81 Rev. 3) | Chapters 01, 03, 11 |
| **What** | Seven capabilities, each tied to a requirement: authoritative multi-cloud DNS and DNSSEC with central key custody; DNS security and Protective DNS forwarding; IPAM as authority and DHCP resilience; automation and SIEM logging with capacity sizing. Then the evidence to check before buying, and a dated status table for four DDI products | Chapters 03, 05–08, 10–12 |
| **Who** | Divisions: deny-by-default scopes and strong admin authentication; overlapping address space, DNS views and ownership tags; approval workflows and their bypasses; what stays central; four delegation patterns; a worked example with four generic divisions; who decides, per Chapter 09's responsibility matrix | Chapters 09, 11 |
| **How** | Five decisions, their owners and the next step | Chapters 01, 09, 11, 12 |

## Sources and neutrality

Every fact on the slides comes from a footnoted chapter of Book 08 or from primary sources checked on October 22, 2026: the FedRAMP Marketplace data, NIST's CMVP certificate and Modules In Process pages, the NIAP Product Compliant List, the DISA STIG file store (a High only reference), CISA's directive, CDM and KEV pages, OMB memoranda, the Federal Register, and vendor documentation; the CIS Benchmarks list, NIST's National Checklist Program and NIST SP 800-53 CM-6 were read on October 29, 2026. *High only* marks material that applies to FedRAMP High or Defense environments, such as DISA STIGs and DoD Impact Levels, not to the Moderate civilian baseline this workbook targets. It's kept as an optional reference. Each slide carries a short Sources line, each slide's notes end with the Book 08 chapter and any research beyond the book, and the backup section lists the sources in full.

Vendors appear only as examples of a requirement or as dated status facts. The deck doesn't recommend or rank any product, and the status table is a snapshot to confirm on the day of any decision. The delegation slides use Infoblox's public documentation for product terms (network views, IP spaces, extensible attributes, approval workflows) because that's where the verified research is; the book's Chapter 11 notes that other platforms offer comparable models under different names. The worked example is an illustrative design, not a validated configuration. No federal agency is named as a customer or authorizer of any product.

`build.js` works out each slide's timing cue from its spoken words at about 142 words a minute (about 3,620 words, 25.5 minutes), warns when a title runs over 58 characters, and warns when a table, panel or text box is likely to overflow.
