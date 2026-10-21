# Verification — Chapter 09, Who Leads the Transformation

Editor W4. Verified October 21, 2026. Sources: the series chapter as copied in (old "Chapter 10 — Leadership Takeaway: Instruments vs. Orchestra") and the leadership parts of `docs/whitepapers/modernization-journey.md`. Reframed per the Book 01 brief as the program's Who chapter.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Microsoft steers toward a cloud-first, AD-minimized identity model via phased source-of-authority transfer | The framing | verified (wording sharpened) | Learn, cloud-first identity guidance for IT architects |
| 2 | AD DS remains supported and gets new features in Windows Server 2025 (new functional level, 32k pages, LDAP signing default for new deployments) | The framing | verified (specifics added) | Learn, What's new in Windows Server 2025 |
| 3 | Old chapter: "framework needs no license, the services do (for example Entra ID P1/P2 or ID Governance, and Intune)" | What the program is | verified and specified: CA needs P1; PIM needs P2 or ID Governance; Lifecycle Workflows and member access reviews need ID Governance | Learn, Microsoft Entra licensing |
| 4 | Old chapter: platform host = "version control, a reverse proxy, a Kerberos bridge and enterprise PKI" | What the program is | restated-as-design to match Chapter 03's five roles (canonical source, reverse proxy/client-cert terminator, auth bridge, engine host, adapter dispatcher); "enterprise PKI" dropped to avoid contradicting Chapter 08 and Book 07 (an enterprise CA depends on AD DS) | Book 01 Ch03 (internal consistency) |
| 5 | Old chapter: "running without it tends to produce the Chapter 09 failure modes" | What the program is | restated-as-design; chapter reference corrected to Chapter 12 | — |
| 6 | PIM provides time-bound, approval-based activation | Instruments table | verified | Learn PIM overview |
| 7 | DNS Private Resolver does hybrid resolution via conditional forwarding and isn't authoritative | Instruments table | verified (detail added; supports "doesn't decide which zones are authoritative") | Azure Architecture Center, DNS Private Resolver |
| 8 | Instruments table "Which servers retire versus hybrid-project" | Instruments table | restated: "move under Azure Arc" (servers aren't managed by Intune; brief's settled fact) | — |
| 9 | M-22-09: C-suite alignment; CFO, CAO, SAOP etc. work with IT/security; zero trust implementation lead within 30 days | Who leads | verified (new) | OMB M-22-09 (PDF read) |
| 10 | M-19-17: integrated agency-wide ICAM governance structure and its membership | Who leads; records | verified (new) | OMB M-19-17 (PDF read) |
| 11 | RMF CIO duties (designate SAISO, policy, oversee personnel, report to head of agency) | Sponsor/CIO | verified (new) | NIST SP 800-37 Rev. 2, App. D (PDF read) |
| 12 | System owner definition | Sponsor/CIO | verified (new) | SP 800-37 Rev. 2, App. D |
| 13 | SAISO carries out CIO security responsibilities; liaison to AOs, system owners, SSOs | CISO/AO | verified (new) | SP 800-37 Rev. 2, App. D |
| 14 | AO is the only official who can accept security and privacy risk; approves POA&Ms | CISO/AO | verified (new) | SP 800-37 Rev. 2, App. D |
| 15 | M-26-14 (May 22, 2026) rescinded M-21-31; risk-based, prioritized logging; maturity model | CISO | verified (new; brief's settled fact, PDF read) | OMB M-26-14 |
| 16 | BOD 25-01: AOs may accept risk for deviations from mandatory SCuBA policies; deviations reported | CISO/AO; matrix note | verified (new) | BOD 25-01 page |
| 17 | MS.AAD.1.1v1 (block legacy auth) is mandatory | Matrix note | verified | BOD 25-01 Required Configurations |
| 18 | Whitepaper: "FedRAMP continuous monitoring and OMB M-22-09 expect agencies to operate at Advanced maturity as the production standard"; "Advanced = federal ConMon standard posture" | CISO/AO (gated actuation) | corrected: no such requirement found; ZTMM says it is a general guide, not strict requirements; gated actuation restated as the program's design choice | CISA ZTMM v2.0 §4; M-22-09 |
| 19 | Gated actuation; high-blast-radius operations stay gated permanently | CISO/AO | restated-as-design | — |
| 20 | Steward and sponsor gate authorities (G0–G5) | Program office; matrix | verified against Chapter 12's gate table (internal) | Book 01 Ch12 |
| 21 | Application inventory first before moving users off AD | Application owners | verified | Learn cloud-first guidance (Note and Step 1) |
| 22 | Help desk social engineering: actors call help desks to reset passwords and transfer MFA tokens; phishing-resistant MFA recommended | Help desk | verified (new) | CISA AA23-320A (revised July 29, 2025) |
| 23 | GRS 3.2 items 030/031: system access records; special-accountability systems kept 6 years after password change or account termination | Records | verified (new) | NARA GRS 3.2, Transmittal 33 (PDF read) |
| 24 | 36 CFR 1220.34(a), (e): assign records responsibility; integrate records requirements into system design | Records | verified (new) | 36 CFR 1220.34 (Cornell LII) |
| 25 | Old chapter: "A first pass typically takes days to a few weeks" | What to do next | restated-as-design ("in the program's experience") | — |
| 26 | Monthly questions; 95% threshold; 180 days hybrid join | How a sponsor evaluates | restated-as-design (thresholds labeled illustrative); "hybrid join is a waypoint" aligned with brief's settled fact | — |
| 27 | Governance properties 1–5 | Governance properties | restated-as-design (unchanged) | — |
| 28 | Whitepaper Call to Action: "an inventory, an owner, and a date"; "no vendor decision on day one" | What to do next | carried as design | — |
| 29 | Whitepaper Call to Action: "a federal compliance deadline that is no longer negotiable" | (not carried) | removed from this chapter: the FedRAMP 20x deadline claim belongs to W5's roadmap material and isn't needed for the Who argument | — |
| 30 | Old closing: "Read Chapters 00–10 in order"; "End of series" | (not carried) | removed: wrong numbering; this is no longer the last chapter | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Series Ch10: title, bold subtitle, dependency chain | Title/H1 now "Chapter 09 — Who Leads the Transformation"; subtitle became the italic thesis; dependency chain kept | — |
| Series Ch10: The framing that matters (+ `cshc/leadership-takeaway.svg`) | The framing that matters; figure replaced by `ch09-instruments-and-orchestra.flow.yaml` (instruments → governed orchestra that decides the target and keeps it right) | — |
| Series Ch10: What the framework is — and is not | What the program is — and is not (chapter refs renumbered: 01→03, 02–03→10–11, 09→12) | — |
| Series Ch10: The instruments, revisited (table) | Kept, two rows tightened | — |
| Series Ch10: The governance properties that matter | Kept unchanged | — |
| Series Ch10: How to evaluate an engagement | How a sponsor evaluates the program (one pre-start check and one monthly question added) | — |
| Series Ch10: What to do next | What to do next (merged with whitepaper Call to Action; steps "name the owners" and "set the dates" added; refs renumbered) | — |
| Series Ch10: Key takeaways | Kept; two takeaways added for the Who framing | — |
| Series Ch10: Authoritative references list | Removed | All entries now footnotes |
| Series Ch10: Previous/Next/End of series | Replaced by "Continue the book" callout (Prev Ch08, Next Ch10) | Old links pointed to the roadmap and Appendix A |
| New per brief: Who leads, decides and does the work (sponsor, CIO, CISO/AO, program office, platform teams, application owners, help desk, HR, records and privacy) | New section with diagram `ch09-who-leads.flow.yaml` | — |
| New per brief: decision matrix; links to each book's Who chapter | "Decision rights across the program"; "Where each book assigns ownership" (B02 Ch06, B03 Ch07, B04 Ch06, B05 Ch06, B06 Ch13, B07 Ch05, B08 Ch09, B09 Ch09) | — |
| Whitepaper §Principle 4: "What this means for authorizing officials" callout | CISO and AO subsection (gated actuation, permanently gated high-blast-radius ops) | Claim that M-22-09/FedRAMP require Advanced maturity corrected (claim 18); L0–L4 ladder table not carried (W5/Chapter 11–12 territory) |
| Whitepaper §Call to Action | What to do next | Deadline framing not carried (claim 29) |
| Whitepaper other sections | Not carried here | Owned by W1, W3, W5, and Chapter 08 (access parts) |
