# B08 DNS, DHCP & IPAM — chapter-editor brief

Repo worktree: `C:\Users\whale\git\mwb-b08` (branch `book/b08-ddi`). Book folder: `docs/books/b08-ddi/`.

**Read the general workbook book rules first and follow them:** `docs/books/_book-writer-brief.md` (style, program
name, agency-neutral rule, footnote format and verification, diagram house style, verification side file, boundaries,
final report). This brief states what is different for Book 08.

Book 08 answers **"Why is DNS now the control plane?"**

## What's different

Book 08 is the former **Next Generation DDI** series, already copied into this folder and renumbered (old 01–08 keep
their numbers; old 00 is now Appendix C; old 09–11 are now 10–12; Chapter 09 is new). It also **absorbs two large
overlapping documents that are being archived** (never link to them):

- `docs/whitepapers/infoblox-hybrid-dns-unified-ddi.md` — whitepaper "Next Generation DNS", about 14,400 words (its
  short twin `docs/whitepapers/next-generation-dns.md` too).
- `docs/operational-guides/network-transformation/dns-modernization.md` — the DNS Modernization Guide, about 10,900
  words (its short twin `docs/operational-guides/dns-modernization.md` too).
- `docs/whitepapers/infoblox-dns-reference.md` — the DNS record-type and ecosystem reference (Appendix A absorbs it).

Your job, as for Books 03 and 06:

1. **Verify and upgrade the series chapters in place.** Verify every external factual claim on the internet and
   footnote it (Microsoft Learn MCP tools for Windows DNS/DHCP, Azure DNS, Private Resolver, Private Link; primary
   sources for NIST SP 800-81 Rev. 3, OMB M-22-09 (encrypted DNS), CISA Protective DNS, TIC 3.0, FedRAMP; vendor
   documentation for Infoblox, Cisco and others). Keep correct existing footnotes, re-open each, fix broken ones.
   Correct wrong or stale claims and log every change.
2. **Absorb the overlapping documents.** Read the whitepaper and the guide sections that match your chapters, carry
   their substantive, non-duplicated content into your chapters (verified), and record in your carry-forward ledger
   which of their sections you absorbed. Don't duplicate what another chapter covers — link it.
3. **Keep the author's argument, structure and terms.** Don't cut series sections; log anything removed.
4. **Vendor neutrality.** The series and whitepaper discuss Infoblox (NIOS, Universal DDI, Infoblox Government Cloud)
   and Cisco SD-WAN DNS interception. Keep vendor material where the argument needs it, verified, and framed as
   examples; state product authorization status precisely (Book 02 Chapter 04 verified: the FedRAMP-listed Infoblox
   offering is the Infoblox Government Cloud service, not on-premises NIOS — check the FedRAMP Marketplace).
5. **Consistent styling with Books 02–07**: front matter (`doc-type: workbook-chapter`, `family: b08-ddi`,
   `book: B08`, `part:` and `series-order:` already set — keep them; `lifecycle_review: 2027-04-01`), titles of the
   form `Chapter NN — Title` (appendices `Appendix X — Title`) in `title:` and the H1, italic thesis line, "In this
   chapter" callout, closing "Continue the book" callout following the reading order, footnotes at the very bottom
   with `[^cNN-key]` keys (`[^aX-key]` in appendices). Remove "Status — Draft" banners inside pages and per-page Word
   download callouts.
6. **Diagrams** were copied to `docs/images/diagrams/b08-ddi/src/` and renamed to the new chapter numbers (pages
   already reference `../../images/diagrams/b08-ddi/svg/…`). Fix a source only if a fact is wrong or a chapter number
   in it is stale; a chapter with no diagram gets one new source.
7. Verification file per page under `_verification/` (claims log + carry-forward ledger, covering series sections
   and any absorbed whitepaper/guide sections).

Related books (link by these paths): Book 02 `../b02-identity/04-the-hidden-migration-surface.md` (DNS/DHCP/IPAM as
an AD dependency adapter); Book 05 `../b05-devices/index.md`; Book 07 `../b07-pki/index.md` (certificates; on another
branch). Pages that stay in place: Federal Compliance Vol VIII (`../../compliance/Vol_VIII_Book_00_DDI_Automation_Overview.md`),
Vol I Book 01 landing zone/IPAM (`../../compliance/Vol_I_Book_01_Cloud_Landing_Zone_IPAM_FedRAMP.md`), and
Client-Server to Hybrid-Cloud Chapter 06 (`../../client-server-to-hybrid-cloud/06-network-services.md`).

## Reading order and titles

index → 01 → … → 08 → 09 → 10 → 11 → 12 → Appendix A → B → C.

| File | Part | Title |
|---|---|---|
| `01-dns-is-the-control-plane.md` | Why | Chapter 01 — DNS Is Now the Control Plane |
| `02-split-brain-dns.md` | Why | Chapter 02 — Split-Brain DNS: The Structural Problem |
| `03-federal-requirements.md` | Why | Chapter 03 — Federal Requirements: NIST SP 800-81, FedRAMP and Zero Trust |
| `04-active-directory-dns-departure.md` | What | Chapter 04 — The Active Directory DNS Departure |
| `05-edge-interception-and-bypass.md` | What | Chapter 05 — Edge Interception, Encrypted DNS and Rogue DHCP |
| `06-dns-identity-and-dnssec.md` | What | Chapter 06 — DNS Identity, Certificates and DNSSEC |
| `07-cloud-private-endpoints-and-ipam.md` | What | Chapter 07 — Cloud Private Endpoints, SDN and IPAM Consistency |
| `08-reference-architecture.md` | What | Chapter 08 — Reference Architecture and the Five Critical Decisions |
| `09-who-owns-dns.md` | Who | Chapter 09 — Who Owns DNS, DHCP and IPAM (**new**) |
| `10-migration-sequence.md` | How | Chapter 10 — The Migration Sequence |
| `11-operating-the-control-plane.md` | How | Chapter 11 — Operating the Control Plane: Delegation, Automation and Evidence |
| `12-selection-cost-and-residual-risk.md` | How | Chapter 12 — Platform Selection, Cost and Residual Risk |
| `appendix-a-dns-record-types.md` | Appendix | Appendix A — DNS Record Types and Ecosystem Integrations |
| `appendix-b-requirements-mapping.md` | Appendix | Appendix B — Requirements Mapping and Sources |
| `appendix-c-applicability.md` | Appendix | Appendix C — Applicability |
