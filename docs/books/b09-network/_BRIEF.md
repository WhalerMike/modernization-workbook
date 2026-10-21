# B09 Network & Transport — chapter-writer brief

Repo worktree: `C:\Users\whale\git\mwb-b09` (branch `book/b09-network`). Book folder: `docs/books/b09-network/`.

**Read the general workbook book rules first and follow them exactly:** `docs/books/_book-writer-brief.md` (style,
program name, agency-neutral rule, footnote format and verification, diagram house style, verification side file,
boundaries, final report). Replace its B02 specifics with this book's: front matter `family: b09-network`, `book: B09`;
diagram sources go in `docs/images/diagrams/b09-network/src/chNN-short-name.flow.yaml`, referenced as
`../../images/diagrams/b09-network/svg/chNN-short-name.svg`. Use footnote keys `[^cNN-key]` (`[^aX-key]` in appendices).

Book 09 answers **"Why does physics decide the architecture?"** Its argument: latency is a physics constraint that no
product removes; transport (fiber, MPLS, LEO, 5G, direct internet access) is a physics decision, while control (SD-WAN,
SASE, TIC 3.0 policy enforcement) is a compliance decision; logical centralization of the source of truth is right, but
it means needing less global synchronization, not faster synchronization; and the order of operations (governor before
traffic, boundary change before cutover) decides whether modernization is a gain or a compliance regression.

## Sources (read them in this worktree; they are archived after the book is built — never link to them)

| Source | Words | Feeds |
|---|---|---|
| `docs/ssot-network-physics/index.md`, `00-` … `07-*.md` (*The Physics of a Single Source of Truth*) | 11,600 | Ch01, 04, 05, 06, 08 |
| `docs/whitepapers/branch-edge-gap.md` (*The Branch Edge Gap*, v2, with §10 verification table and Appendix A change log) | 8,800 | Ch02, 03, 06, 13, App C |
| `docs/whitepapers/the-long-interim.md` (*The Long Interim*) | 10,700 | Ch03, 06, 10, 13 |
| `docs/whitepapers/field-office-wan-transformation-dp-consolidation.md` | 9,500 | Ch11 (and Ch03 for §4.5, 4.8, 4.9, A.2) |
| `docs/whitepapers/tic3-sdwan-vs-dia.md` and its near-twin `docs/whitepapers/network-transport-and-governance.md` | 1,200 | Ch01, 02, 05, 13 |
| `docs/operational-guides/m365-optimize-exemption/index.md`, `attachment-a-site-register.md`, `attachment-b-architecture-review.md` | 4,600 | Ch12, App A |
| `docs/operational-guides/network-transformation/radius-802-1x-modernization.md` | 440 | Ch07 |
| `docs/modernization-specs/sdwan.md`, `docs/modernization-specs/sase.md` | 700 | Ch05 |
| `docs/projects/network-access-charter.md`, `network-access-plan.md` (stay in place, unpublished) | 900 | Ch07, 09 |

Pages that **stay in place** (unpublished; link them by their GitHub URL
`https://github.com/WhalerMike/modernization-workbook/blob/main/<path>`), read for facts and link for depth:
Federal Compliance Vol I Book 02 (802.1X, `docs/compliance/Vol_I_Book_02_Network_Access_Control_802_1X.md`),
Book 05 (Network Modernization), Book 06 (Federal Telecommunications Modernization), Book 07 (Network Enforcement
Substrate), all under `docs/compliance/`.

Book 09 is **not** a copy of the sources. Write each chapter fresh from them: keep the author's argument, structure and
terms, carry every substantive non-duplicated point, verify every external claim, and record in your carry-forward
ledger where each source section went (or why it wasn't carried). Don't duplicate what another chapter owns — link it.
The two short twin papers and the long papers repeat the same core argument; state it once, in the chapter that owns it.

Diagram sources from the physics series are staged as `docs/images/diagrams/b09-network/src/src-*.flow.yaml`. Reuse one
by copying it to your `chNN-…` name (fix facts and stale chapter numbers in it), then delete the `src-` copy you used.

## Rules specific to this book

- **Physics numbers** (speed of light in fiber, ITU-T G.114's 150 ms one-way budget, measured hairpin and local-breakout
  latencies, round-trip counts) must be footnoted to a primary source or shown as worked arithmetic from stated inputs.
  Distinguish measurements, estimates and design assumptions, as *The Long Interim* §10 does.
- **Policy currency.** TIC 3.0 documents (the current Security Capabilities Catalog is v3.3, September 2026, per Book 08
  Chapter 03), OMB M-21-31, M-22-09, FedRAMP's 2026 rules, CISA BODs (the sources cite BOD 26-02 — verify it), MTIPS/EIS
  and CLAW, NIST SP 800-53 SC-7 and its enhancements. Verify as of 2026-10-20 and footnote. *The Branch Edge Gap* §2.5
  and §10 already record corrections; re-check them rather than trust them.
- **Vendor neutrality.** Cisco, Palo Alto, Zscaler, Netskope, Microsoft and carriers appear only as examples; state
  FedRAMP authorization status precisely from the FedRAMP Marketplace (`https://www.fedramp.gov/marketplace/products.json`).
- **Cost figures.** The field-office paper's cost model is the author's analysis: keep it, label inputs as assumptions,
  verify any vendor list price you keep, and don't present program estimates as external fact.
- **Consistency with published books** (read and link; don't contradict):
  - Book 08 Chapter 05 `../b08-ddi/05-edge-interception-and-bypass.md` — SD-WAN DNS interception, encrypted DNS, the
    redirect-dns target; and Book 08 Appendix C `../b08-ddi/appendix-c-applicability.md` — Microsoft 365 informed network
    routing (INR) is **not** available to GCC Moderate tenants.
  - Book 08 Chapter 03 — TIC 3.0 v3.3, M-22-09 names DoH/DoT only; the Protective DNS egress requirement comes from CISA.
  - Book 07 Chapter 06 / Chapter 02 — 802.1X and NPS/RADIUS certificates (`../b07-pki/06-device-and-user-certificates.md`).
  - Book 04 — Conditional Access and token protection (`../b04-access/03-the-conditional-access-model.md`).
  - Book 05 Chapter 09 and Chapter 04 — Configuration Manager distribution points vs Intune, Arc (`../b05-devices/index.md`).
  - Book 06 — SQL Server and NTLM on re-routed paths (`../b06-data-platform/index.md`).

## Chapter list (exact file names)

| File | Part | Title | Writer |
|---|---|---|---|
| `index.md` | — | Book 09 — Network & Transport (editor) | editor |
| `01-why-physics-decides-the-architecture.md` | Why | Chapter 01 — Why Physics Decides the Architecture | W1 |
| `02-transport-is-physics-control-is-compliance.md` | Why | Chapter 02 — Transport Is Physics, Control Is Compliance | W1 |
| `03-what-tic-3-requires.md` | What | Chapter 03 — What TIC 3.0 and Federal Policy Actually Require | W2 |
| `04-logical-centralization-and-token-security.md` | What | Chapter 04 — Logical Centralization and Token-Based Security | W3 |
| `05-sd-wan-sase-and-governed-transport.md` | What | Chapter 05 — SD-WAN, SASE and Governed-Path Transport | W4 |
| `06-legacy-protocols-on-re-routed-paths.md` | What | Chapter 06 — Legacy Protocols on Re-Routed Paths | W3 |
| `07-network-access-control.md` | What | Chapter 07 — Network Access Control: 802.1X and RADIUS | W5 |
| `08-reference-architecture.md` | What | Chapter 08 — Reference Architecture: Consistency Classes Meet Network Classes | W4 |
| `09-who-owns-the-network.md` | Who | Chapter 09 — Who Owns the Network and Its Transport (**new**) | W5 |
| `10-the-long-interim.md` | How | Chapter 10 — The Long Interim | W6 |
| `11-field-office-wan-transformation.md` | How | Chapter 11 — Field Office WAN Transformation | W7 |
| `12-microsoft-365-traffic.md` | How | Chapter 12 — Microsoft 365 Traffic and the Optimize Inspection Exemption | W8 |
| `13-sequencing-cost-and-evidence.md` | How | Chapter 13 — Sequencing, Cost and Evidence | W6 |
| `appendix-a-optimize-exemption-instruments.md` | Appendix | Appendix A — Optimize Exemption Decision Instruments | W8 |
| `appendix-b-requirements-mapping.md` | Appendix | Appendix B — Requirements Mapping and Sources | W2 |
| `appendix-c-glossary.md` | Appendix | Appendix C — Glossary | W6 |

Appendix series-orders are 90, 91 and 92. Reading order: index → 01 → … → 13 → A → B → C. The "Continue the book"
callout on Chapter 01 links back to `index.md`; Appendix C has no Next link.

Who covers what, in brief (so you don't overlap):
- **Ch01**: the pendulum and the three forces; the speed-of-light floor and the 150 ms budget; "need less global sync";
  why no product shortens a fiber path. **Ch02**: the false "SD-WAN vs DIA" versus; what DIA solves and doesn't; the
  transport menu (fiber, MPLS, LEO, 5G) and the one control family transport closes (telecom diversity); the governor is
  itself attack surface.
- **Ch03**: TIC 3.0 use cases and the Security Capabilities Catalog stated precisely; policy currency; FedRAMP doesn't
  constrain routing; the encryption requirement that is and isn't there; M-21-31 telemetry; CLAW and Protective DNS
  replacing MTIPS for telemetry continuity; the DoD contrast.
- **Ch04**: logical centralization vs fragmentation; token-based security as the enabler; consistency classes.
- **Ch05**: SD-WAN differentiated transport (path classes, FEC, what it can't do below the floor); governed-path / token-
  bound transport; SASE above SD-WAN; securing the controller and edges.
- **Ch06**: what breaks on proxied and re-routed paths; Kerberos and its real dependencies; round trips dominate;
  where transport matters for token-based access and continuous verification.
- **Ch07**: 802.1X/RADIUS/NPS modernization (cloud RADIUS options, certificate-based EAP-TLS, NAC posture); link Book 07
  for certificates and Book 04 for Conditional Access.
- **Ch08**: the reference architecture: consistency classes mapped to network classes; the SaaS data-plane worked
  example; branch architectures (hairpin, governed local breakout, SASE); the five or so design decisions.
- **Ch09**: who decides and who does the work (network engineering, security architecture, telecom acquisition and EIS
  task orders, AO and boundary owner, SOC/CISA reporting, field-office facilities, application owners); a RACI.
- **Ch10**: the posture when neither SD-WAN nor a TIC 3.0 use case is close; why each alternative has closed; what's
  scarce; the interim architecture and its engineering realities.
- **Ch11**: the field-office WAN and distribution-point consolidation case: proposal under review, why per-office DPs
  aren't the model, target hub/content tier, branch network, sizing, cost model, roadmap, risks, assumptions. Agency-
  neutral (keep it as "a large field-office estate").
- **Ch12**: Microsoft 365 Optimize/Allow/Default categories; why bypass-inspection guidance meets an inspect-everything
  boundary; the SC-7(4) documented traffic-flow exception; the three instruments (summarize; App A carries them).
- **Ch13**: decision sequence and phase inversion; measuring cost in your own estate; what to stop doing; evidence
  for the boundary change; how to confirm or refute the case.
- **App A**: the exemption instruments as usable templates (Attachments A and B, restored tables, bracketed fields,
  RFC 5737 example addresses). **App B**: every requirement mapped to chapters and evidence, with the source list.
  **App C**: the glossary (from *The Branch Edge Gap* §9 plus terms the book uses).
