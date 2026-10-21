# Verification — Chapter 03, One Authoritative Record

Checked October 21, 2026 by writer W2. Sources: `docs/architecture/single-source-of-truth.md` (581 words), `docs/architecture/architecture-series/six-plane-architecture.md` (587), `docs/architecture/index.md` (230, a deprecated section landing) and `docs/reference-architecture/index.md` (1,747, the framework landing). Most of the chapter is program design, labeled as such. External claims were checked as follows. SP 800-53 Rev. 5.2.0 control text and baselines came from the csrc.nist.gov Cybersecurity and Privacy Reference Tool JSON export for SP_800_53_5_2_0, cross-checked against NIST's OSCAL catalog linked from the csrc publication page. FedRAMP classes came from the fedramp.gov Full Rev5 Control Reference family page. The SP 800-207 PDF was downloaded from nvlpubs.nist.gov and its text extracted. Microsoft Graph was checked with the Microsoft Learn MCP fetch tool, and Pro Git was read on git-scm.com. No personal data was sent to any site.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Active Directory's OU tree acted as the implicit governance model (delegation, GPO scope, membership, audit boundary; DNS, DHCP, PKI, RADIUS, LDAP leaned on it) | The governance nobody wrote down | verified (in workbook) | Book 01 Ch02, linked; not re-footnoted |
| 2 | Entra ID, Intune and Conditional Access replace the directory, Group Policy and perimeter enforcement | Same | restated | Book 01 Ch02 and Book 05 carry this; the source's "Microsoft is deprecating the entire Client/Server stack" was dropped as overstated |
| 3 | Record = authoritative origin; everything else is a provenance-anchored pointer; foundation, provenance root, drift baseline | What the record is | restated-as-design | Program design |
| 4 | Logical, not physical, single source; one copy accepts authoritative writes | What the record is | verified (in workbook) | Book 09 Ch04, linked |
| 5 | CM-2 statement "develop, document, and maintain under configuration control, a current baseline configuration"; NIST Low, Moderate, High | What the record is | verified (new) | csrc CPRT SP 800-53 5.2.0 (CST-CM-02; SB-Low/Moderate/High relationships) |
| 6 | CM-2 in FedRAMP Rev5 Classes B, C, D | What the record is | verified (new) | fedramp.gov CM family page |
| 7 | Repository topology (documents, schemas, rules); runtime read-only; writes only through reviewed PR or designated tooling | Where the record lives | restated-as-design | Program design |
| 8 | Consumer rule: stable package-relative resolution; no hardcoded absolute paths or sibling-checkout fallbacks outside tests | The consumer rule | restated-as-design | Program design. The source's `importlib.resources` mention (reference-architecture landing) was generalized |
| 9 | Provenance block fields: source, version, derived_at, derived_by; content hash over claim content | The provenance chain | restated-as-design | Program design; illustrative YAML added with warning callout |
| 10 | Git is a content-addressable store; object keys are SHA-1 checksums of content plus a header | The provenance chain | verified (new) | Pro Git §10.2 |
| 11 | Six planes, their roles, the "why six" reasons, one-directional authority flow, runtime cycles mediated by artifacts | The six control planes | restated-as-design | Program design |
| 12 | SP 800-207: access granted through a PDP and corresponding PEP; control and data planes logically separate | Six planes | verified | SP 800-207 §2 and §3.4.1 item 5 (PDF text) |
| 13 | Book 12's six telemetry planes are identity, cloud platform, Microsoft 365, endpoints, network, data | "Two different sixes" callout | verified (in workbook) | Book 12 Ch01 key-takeaway list. The callout was added to prevent a cross-book contradiction |
| 14 | Authority table: HR owns personnel facts; identity platform owns credentials and access decisions; asset registry owns devices; IaC owns declared infrastructure | Who is authoritative for what | verified (in workbook) / restated-as-design | Book 03 Ch04 and Ch06; change-control source (device and IaC sources of truth) |
| 15 | Synced users' extension attributes: source of authority on-premises AD and read-only; cloud-only users can set them; device attributes managed only in Entra ID | Who is authoritative for what | verified | Microsoft Graph, onPremisesExtensionAttributes resource type |
| 16 | Corrections flow upstream; one writer per attribute slot | Same | verified (in workbook) | Book 03 Ch04, Ch06 |
| 17 | Four-layer stack (governance, policy, structure, identity) and its artifacts | Four layers | restated-as-design | Program design. Internal document IDs dropped, artifacts described generically, each layer linked to its book |
| 18 | Three always-applicable principles plus three that bind later; retired seven-principle names fold in | Platform principles | restated-as-design | Program design. Conformance-tier numbers (Tiers 1–5) replaced with plain conditions (platform writes, runs as a service, ships to others) |
| 19 | Boundary enforcement at "the M365 GCC-Moderate SaaS boundary" | Platform principles | restated-as-design | Generalized to "the declared authorization boundary" and linked to Book 10. The program's specific boundary is Book 10's subject |
| 20 | Core is not federal-specific; federal compliance is a layer on top | Platform principles | restated-as-design | Program design; source's product-name framing dropped |
| 21 | Change process: registry update, decision record for doctrinal change, review before merge; direct commit is a drift signal | Changing the record | restated-as-design | Program design; full mechanics in Ch04 |
| 22 | Drift classes are measured against the record. "SSOT contention" is treated as an authorization finding in Ch06's model | Changing the record | restated-as-design | The source's sixth class was mapped onto Ch06's five-class model, not presented as a separate taxonomy. **Editor: confirm Ch06 (W3) agrees with this mapping** |
| 23 | CI gate fails on critical findings against record content | Same | restated-as-design | Program design |
| 24 | AO gets per-plane narratives, citations, per-plane drift trails, a machine-readable answer on the authoritative value at a date | What an authorizing official gets | restated-as-design | Program design |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| SSOT: title and subtitle | Ch03 "What the record is" | — |
| SSOT § Scope (what, where, how consumed; inventory lives in registry) | "What the record is"; "Where the record lives" (registry paragraph) | — |
| SSOT § Topology table | "Where the record lives" table | Examples column added |
| SSOT § Consumer rule | "The consumer rule" | `importlib.resources` generalized |
| SSOT § Provenance chain | "The provenance chain" with illustrative YAML | — |
| SSOT § Drift baseline (six classes, severities, CI gate) | "Changing the record, and measuring against it" | The class table was not repeated. Ch06 presents the drift model once; contention mapped to authorization (claim 22) |
| SSOT § Change process | "Changing the record"; Ch04 "Changing the record: pull requests" | — |
| SSOT § Why it matters | Closing paragraph of "What an authorizing official gets"; provenance-chain paragraph | — |
| SSOT closing "Cleaned extraction" note | — | Source plumbing |
| Six-plane: intro and figure | "The six control planes", new figure ch03-six-planes | The old series SVG was replaced with a house-style source |
| Six-plane § The six planes table | Planes table (expanded with consumes and workbook home) | Table order changed to authority-flow order, since the source table listed network before addressing |
| Six-plane § Why six planes | "Why six" | — |
| Six-plane § Plane-by-plane summary | Planes table rows; SP 800-207 paragraph | — |
| Six-plane § How the planes interact | "How the planes interact" | Example of a runtime cycle added |
| Six-plane § What this means for an authorization package | "What an authorizing official gets" | — |
| architecture/index.md: deprecation callout, download bundle tip | — | Site plumbing for a deprecated page |
| architecture/index.md: series description, pages table (slugs, statuses, internal anchors) | — | Internal navigation and document IDs. The topics are covered by Ch03 (six planes), Ch05 (rule model), Ch06 (drift engine) and Ch07 (evidence chain); boundary impact is Book 10 |
| reference-architecture: front matter, download tip | — | Site plumbing |
| reference-architecture: figure 1 (AD-to-Entra journey) | — | AI-prompt illustration; meaning carried in prose; links to Book 01 Ch02, which has a house-style diagram |
| reference-architecture § The Problem, figure 2 | "The governance nobody wrote down" | Condensed; the "frozen in 2003" and "deprecating the entire stack" phrasing dropped. Figure 2's meaning is in Book 01 Ch02's diagram |
| reference-architecture § The Solution (two document families table, namespaces, file counts) | "Four layers" (in substance) | Internal namespaces, document IDs and file counts dropped |
| reference-architecture "Canon Rule" callout (universal, not government-specific) | "The governance platform's own principles", last paragraph | Product name dropped |
| reference-architecture § Four-Layer Governance Stack table and figure 3 | "Four layers inside the identity plane" table | Document IDs replaced with artifact descriptions and book links; the figure was not redrawn (the table carries it) |
| reference-architecture § Governance Principles 3 + 3 | "The governance platform's own principles" | Manifest file path, decision IDs, tier numbers and the assistant-product name in "Two-Brain Execution" dropped. Renamed "separation of governance and execution" |
| reference-architecture § Historical names | Same section, paragraph on the earlier seven | — |
| reference-architecture § Who This Is For | — | Audience table not carried; the chapter's audience is set by the book. Its points appear in "What an authorizing official gets" |
| reference-architecture § Navigation (entry points, explainers) | Links throughout to Book 02 Ch04/Ch05 and Book 05 | Navigation tables not carried |
| reference-architecture § Source Files (monorepo path) | — | Internal path |
