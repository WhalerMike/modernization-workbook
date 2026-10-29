# Verification — Implementing Book 08 on Infoblox NIOS (research)

File: `docs/research/infoblox-nios-implementation.md`
Verified: 2026-10-29 (Moderate-civilian sweep). The page's earlier claims were checked on October 23, 2026 (see the page's Status and review section); this log covers the claims added or reframed on 2026-10-29.

Method:
- Civilian configuration sources (NIST SP 800-53 Rev. 5 CM-2 and CM-6 from NIST's OSCAL catalog; SP 800-70 Rev. 5 and the NCP page; the CIS Benchmarks list; AWS's FedRAMP and Services in Scope pages) come from the coordinator's fact pack, read 2026-10-29.
- NIST SP 800-81r3 was fetched from csrc.nist.gov (landing page) and nvlpubs.nist.gov (PDF) on 2026-10-29 and its text extracted and searched: section 2.3.2 (hidden primary), 3.1 (zone transfers, TSIG), 3.3 (dynamic updates), 2.1.3 (logging), 3.8.1 Table 1, 3.8.2 (RRSIG validity, "e.g., 5-7 days") and 3.8.3 ("The more prudent approach is to use NSEC").
- Absence claims ("no CIS Benchmark for NIOS") rest on the CIS Benchmarks list as read 2026-10-29.

Verdicts: **verified** (the source says it); **inference** (labelled on the page); **design** (labelled *(design guidance)*); **reframed** (wording changed, no new fact).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | CM-6: the agency documents settings from common secure configurations it chooses and approves deviations | Findings | verified | nimp-cm6 |
| 2 | CIS publishes no NIOS benchmark (only a CIS-formatted Infoblox 8.x DNS STIG) | Findings | verified (absence on the list) | nimp-cis |
| 3 | SP 800-81r3 covers a hidden primary, separate authoritative/recursive policies, TSIG-protected transfers, DNSSEC algorithms and DNS logs in the SIEM | Findings | verified (PDF text: §2.3, §2.3.2, §3.1, §3.3, §2.1.3) | nimp-80081 |
| 4 | SP 800-81r3 authors: S. Rose (NIST), C. Liu and R. Gibson (Infoblox); March 2026 | Footnote | verified (landing page) | nimp-80081 |
| 5 | SP 800-81r3 Table 1 lists RSA/SHA-256 at "2048 bits or greater", ECDSA P-256 and P-384, Ed25519, Ed448; "algorithms like ECDSA and ed448 are preferable to RSA"; RSA/SHA-1 not in the table | Findings | verified (PDF §3.8.1, p. 22) | nimp-80081-t1 |
| 6 | DISA NIOS 9.x STIG V1R1: only published product-specific checklist; DNS only, 45 rules; kept as optional cross-check (High only) | What it covers; Findings | STIG facts carried from Oct 22-23 check; framing per brief | deck sources |
| 7 | "The NIOS DNSSEC defaults fail that STIG" restated as "The NIOS DNSSEC defaults are weak" against SP 800-81r3 | Findings | reframed | nimp-80081-t1 |
| 8 | Cloud HA documentation omits government regions; confirm vNIOS failover in GovCloud and Azure Government | Findings | kept (vendor-ask; GovCloud is a valid Moderate location, so the gap matters at Moderate) | earlier check |
| 9 | Deck: slide 19 retitled "Hardening NIOS: the agency's settings baseline"; DNSSEC slide cites SP 800-81r3 §3.8.1–3.8.3 (signature validity "kept short (e.g., 5-7 days)" by policy; NSEC "more prudent") | Deck | verified (PDF §3.8.2, §3.8.3) | SP 800-81r3 |
