# Verification — Appendix A, Optimize Exemption Decision Instruments

File: `docs/books/b09-network/appendix-a-optimize-exemption-instruments.md`
Diagrams: none (Chapter 12 carries both).
Sources: `docs/operational-guides/m365-optimize-exemption/index.md`, `attachment-a-site-register.md`, `attachment-b-architecture-review.md`.
Checked 2026-10-21 against the same primary sources as Chapter 12 (see `_verification/12-microsoft-365-traffic.md`), plus RFC 5737 and RFC 3849 at rfc-editor.org. Footnote keys below drop the `aA-` prefix. Tables were already intact in the sources (no Word-conversion damage); bracketed fields, RFC 5737 example rows and the templates warning are kept.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 reserved for documentation (RFC 5737) | Warnings; Table A2 | verified | rfc5737 |
| 2 | 2001:db8::/32 reserved for documentation (RFC 3849) | Warnings; Table A2 IPv6 example | verified (added so R5 has an example row) | rfc3849 |
| 3 | Memo skeleton (clauses 1–9) | Memo skeleton | restated-as-design: the source set references the memo (clauses 4 and 6) but doesn't include it; skeleton built only from what the attachments cite and SC-7(4)(d)–(e) require | sp80053 |
| 4 | Source: register carries "SC-7(4)(c) and (d)" fields; derived-from "SC-7(4)(c)-(d)" | Attachment A intro; Table A1 | corrected to (d) and (e) | sp80053 |
| 5 | SC-7(4)(d) mission need and duration; (e) review at organization-defined frequency and removal | Attachment A intro | verified | sp80053 |
| 6 | Source R1: "The address Microsoft and your probe endpoints observe" identifies the circuit; derived-from cites INR egress-range guidance | R1 | corrected: in GCC-Moderate neither network connectivity in the admin center nor INR is available, so ranges aren't registered with Microsoft; they serve agency steering, probes and scope | netconn; inr |
| 7 | Optimize endpoint sets include IPv6 prefixes | R5 | verified (added) | ww |
| 8 | Source A3 columns "Router / DRAM", "UTD co-resident", "TE agent", example 16 GB | Table A3 | restated vendor-neutral (Cisco UTD and ThousandEyes as bracketed examples); 16 GB example replaced by a bracketed field (memory figure not verified) | — |
| 9 | ThousandEyes for Government: FedRAMP Certified, Class C (Moderate) | Table A3 note | verified (FR2523656707) | fr |
| 10 | Source: "Bypassing the proxy removes the header-injection path" so site is cut over with TRv2 silently unenforced | Table A3 note | corrected: proxy signaling only ever covered sign-in; the unprotected element is the data plane, reachable only by Windows device signaling | trv2 |
| 11 | Group Policy path reaches Office apps, UWP .NET apps, Edge "and nothing else" | Table A3 note | refined: Microsoft says it doesn't protect the .NET stack, Chrome or Firefox; App Control for Business added | trv2 |
| 12 | Feed is Worldwide instance, including GCC | Admission checklist | verified | ww |
| 13 | Monthly updates; 30-day notice; key to endpoint set IDs | Admission checklist (new line) | verified (added) | ww |
| 14 | Teams media set 11: UDP 3478–3481, IP ranges only | Admission checklist (new line) | verified (added) | ww |
| 15 | DNS local to egress; central forwarding defeats local egress silently | Admission checklist | restated-as-design (Microsoft principle verified in Ch12) | — |
| 16 | Source: "ThousandEyes agent registered to the government instance" | Admission checklist | restated vendor-neutral ("monitoring agent", "government instance of the monitoring service") | — |
| 17 | Source: "Branch telemetry reaching CLAW under the reporting pattern named in the memo" | Admission checklist | restated: "reaching CISA services under the arrangement named in the memo" (CLAW named in B3) | branch |
| 18 | SCC v3.3: cover September 2026; revision dated July 2025; 2026 changes footnote links only | Attachment B header and sourcing note | verified; source said "v3.3 (July 2025)" — refined | scc |
| 19 | Twelve PEP groups = Tables 4–15, matching §4.2 list; universal capabilities in Table 3 | Sourcing note; B2 | verified | scc |
| 20 | "the PEP security capability groups listing is not exhaustive" | Sourcing note | verified | scc §4.2 |
| 21 | Catalog maps capabilities to NIST CSF, not SP 800-53 | Sourcing note | verified (every table has a "NIST CSF Mapping" column) | scc |
| 22 | Branch Office Use Case: three patterns; agency may implement a subset; pattern 1 parity condition | B1 | verified | branch |
| 23 | Source: "TIC 3.0 permits policy enforcement points to sit between, before, or within a trust zone" | B1 trust zone | corrected to RA §4.2 "may occur at any point between endpoints" | ra |
| 24 | B2 control references (SI-3, SI-8, AC-4, SC-5, SC-6, CP-8, SC-20/21/22, SI-4, SI-4(4), IA-2, AC-2, AC-6, SC-8, SC-8(1), SC-28) | B2 | restated-as-design (board's proposal, as source says); control IDs and titles checked in OSCAL catalog; DNS row narrowed to SC-21/SC-22 (SC-20 is authoritative-source); Data Protection row qualifies SC-28 (at-rest control) | sp80053 (catalog, not footnoted per row) |
| 25 | Source Enterprise row: "Windows Group Policy is the only available path... Global Secure Access... is non-FIPS in GCC Moderate and unavailable in GCC High and DoD" | B2 Enterprise | corrected: GSA available in GCC, data plane Graph only, not supported in GCC High/DoD; FIPS statement not confirmed on Microsoft Learn and removed | trv2; gsa |
| 26 | Services (Table 14) and Identity (Table 15) capability names | B2 | corrected: source listed five Identity capabilities; Table 15 has eight (EIAMA, MAUTH and CAUTH added) | scc; branch |
| 27 | Services and Identity added in v3.0 (April 2023); v3.1 removed E3A email; v3.2 CSF 2.0 remap and Govern; v3.3 removed NCPS reference | Warning callout | verified (row assignment confirmed from PDF text coordinates; source's v3.0/v3.3 statements were right; v3.1/v3.2 rows added) | scc Table 1 |
| 28 | Universal vs PEP: PEP capabilities "may or may not be applicable based on the use case scope" | Universal capabilities | verified | scc §4.2 |
| 29 | CLMAN, AACCO, PEPAR identifiers; PEPAR definition quote | Universal capabilities | verified | scc Table 3 |
| 30 | Source B3: "NCPS Cloud Interface RA pattern reference" | B3 | corrected: Branch Office Use Case v3.0 (July 2025) replaced NCPS references with CISA services; quote "must preserve CISA visibility through information sharing"; CLAW, CDM, Protective DNS named | branch §8 |
| 31 | Re-assessment triggers | Callout | restated-as-design; added Allow widening and Microsoft re-categorization as triggers | — |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| index.md — warning callout | Appendix A warning callout | — |
| index.md — The set (table) | "How the set fits together" (with a "Binds to" column) | — |
| index.md — remaining sections | Chapter 12 | See Chapter 12 ledger |
| attachment-a — front matter (derived-from) | Not carried | Metadata; its INR derivation corrected in R1 |
| attachment-a — Template warning (RFC 5737) | Attachment A warning (IPv6 RFC 3849 added) | — |
| attachment-a — header table | Attachment A header table (endpoint list version row added) | — |
| attachment-a — scope/controlled-document paragraph; "register is the exception record" | Attachment A intro | Lettering corrected |
| attachment-a — Table A1 and field guidance | Table A1 | — |
| attachment-a — Table A2 and per-circuit note | Table A2 (IPv6 example added) | — |
| attachment-a — Completion rules R1–R5 | Completion rules R1–R5 (bulleted, R1 corrected, R5 fact added) | — |
| attachment-a — Table A3 and dates-not-ticks; TRv2 device signaling | Table A3 (vendor-neutral columns), notes | Corrected per claims 8, 10, 11 |
| attachment-a — Admission checklist | Admission checklist (three lines added: endpoint set IDs and automation; Teams by IP; generalized monitoring line) | — |
| attachment-a — Handling callout | Handling callout | — |
| attachment-a — Change log | Change log (example row turned into a table) | — |
| attachment-b — front matter (derived-from) | Not carried | Metadata |
| attachment-b — Template warning | Attachment B warning | — |
| attachment-b — header table | Attachment B header table (RA and use case versions added) | — |
| attachment-b — Sourcing note | Sourcing note (dates refined) | — |
| attachment-b — "What this determination is, and is not" | Important callout | — |
| attachment-b — B1 patterns; board rationale | B1 | Pattern 1 quote added |
| attachment-b — Trust zone and enforcement point | B1 trust zone table | "between, before, within" corrected |
| attachment-b — B2 capability transfer register (12 rows) | B2 | Enterprise, DNS and Data Protection rows corrected |
| attachment-b — "group list is a property of the catalog version" warning | Warning callout (v3.1, v3.2 rows added) | — |
| attachment-b — Universal Security Capabilities (3 rows + enumerate instruction) | Universal security capabilities | — |
| attachment-b — Status values | Status values | — |
| attachment-b — B3 Telemetry | B3 | NCPS reference corrected |
| attachment-b — Architecture review determination, signing assertion, signature block | Determination section | — |
| attachment-b — Re-assessment triggers | Re-assessment triggers callout (two triggers added) | — |

## Review fixes, 2026-10-21

Applied from the verified review findings (critique claims re-checked against primary sources on 2026-10-21). Every factual change was re-researched and carries its own footnote; wording-only changes are marked as such.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| RF-1 | "per memo clause 6" and "See memo clause 4" now read "the SC-7(4) exception memo, clause 6/4" | Attachment rows Web (line 225) and Enterprise (line 230) | wording only, no new factual claim; no new footnote | — |
