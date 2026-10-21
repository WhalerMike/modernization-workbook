# Verification — Chapter 01, Zero Trust Is a Whole-Agency Property

Checked October 21, 2026 by writer W1. Sources: `docs/whitepapers/zero-trust-whole-agency-unification.md` (v1.1; §2's three architectural facts and the unification-layer argument are developed by Ch06) and `docs/executive-briefs/zero-trust-overview.md` (with its image `zero-trust-overview-image-01-mission-class-placement-for-zero.png`). Federal PDFs (ZTMM v2.0, NIST SP 800-207, OMB M-22-09, the CSRB report) were downloaded and text-extracted; CISA, Microsoft and VMware pages were fetched directly or through the Microsoft Learn MCP tools.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | ZTMM v2.0: five pillars, three cross-cutting capabilities, four stages | Federal guidance | verified | ZTMM §5, pp. 7–10 |
| 2 | ZTMM asks agencies to move stove-piped/siloed IT and staff to a coordinated strategy with agency-wide buy-in for a common architecture and governance | Decision makers; Federal guidance | verified (new) | ZTMM §4, p. 6 |
| 3 | ZTMM Advanced: cross-pillar coordination, centralized visibility and identity control, enterprise-wide awareness incl. externally hosted resources | Federal guidance | verified (new) | ZTMM §5 guiding criteria, p. 9 |
| 4 | ZTMM Visibility and Analytics at Advanced includes virtual environments | Federal guidance | verified (new) | ZTMM Table 7, p. 29 |
| 5 | ZTMM is "a general guide," not "a strict set of requirements"; no stage mandated | Federal guidance | verified | ZTMM p. 12; consistent with Book 01 Ch08/App A |
| 6 | ZTMM generally aligned to a single administrative domain; assess reliance on service providers separately | Federal guidance | verified (new) | ZTMM p. 12 |
| 7 | M-22-09: enterprise-managed identities; centralized identity management; consolidate authentication systems; complete device inventory; strategy implementation lead within 30 days | Decision makers; Federal guidance | verified (new) | M-22-09 pp. 4–6, 10–11 |
| 8 | M-22-09: complete understanding of devices/users/systems is "a necessary foundation for any enterprise-wide zero trust architecture" | Federal guidance | verified (new) | M-22-09 p. 11 |
| 9 | SP 800-207 states the policy decision as "infrastructure-agnostic" | Federal guidance | corrected | NIST doesn't use the phrase. Restated as: no implicit trust from location or ownership (Abstract); tenet 2 (§2.1); scope includes virtual and cloud components (§1) |
| 10 | SP 800-207: PE/PA are key components; stored network/policy information is a target | Three partial assessments | verified (new) | SP 800-207 §5.1, §5.5 — supports the unification-layer-as-target argument |
| 11 | Same workload appears as three objects; stapled reports aren't one score; a scan can confirm but not create unification | Three partial assessments | restated-as-design | Program argument (whitepaper §1–2) |
| 12 | Storm-0558 stole a Microsoft signing key, forged tokens, read mail at "roughly 25 organizations" incl. State and Commerce, "for weeks" | Two incidents | corrected | CSRB: 22 enterprise organizations plus 503 related personal accounts; access for at least six weeks; Microsoft doesn't know how/when the key was obtained ("acquired," not "stole") |
| 13 | CSRB called the breach "preventable" | Two incidents | verified | CSRB executive summary |
| 14 | State detected the intrusion through its own custom alert on purchased mailbox-access logs | Two incidents; Decision makers | verified (new) | CSRB §1.3.1 |
| 15 | ESXiArgs (Feb 2023) exploited CVE-2021-21974; CISA/FBI joint advisory | Two incidents | corrected | AA23-039A (Feb 8, 2023): >3,800 servers; encrypts VM configuration files; "known vulnerabilities"; no CVE named. CVE-2021-21974 is the likely vector per Recorded Future, not officially confirmed |
| 16 | CVE-2024-37085 (July 2024): ESXi trusts AD group "ESX Admins" by name; attacker could "delete and recreate" it | Two incidents; Ch02 P2 | corrected | Microsoft Security Blog, July 29, 2024: membership matched by name not SID; creating the group was the method observed in the wild, renaming another |
| 17 | Hypervisor compromise is invisible to guest EDR/identity/network controls | Two incidents | restated-as-design / verified in part | Microsoft: "many security products have limited visibility and protection for an ESXi hypervisor"; encrypting the hypervisor reaches all VMs. The absolute "without a single alert" is kept as program argument |
| 18 | vCenter SSO domain is frequently its own identity source | Two incidents | verified | vSphere 8.0 Authentication: every SSO instance has internal vsphere.local source; AD/LDAP added as sources |
| 19 | SCuBA vs Zero Trust Assessment table (question, mandate, scope, overlap) | Worked example | corrected (partly) | BOD 25-01 + required-configurations page + SCuBA page + Learn ZTA overview. Corrections: BOD 25-01 reporting is "integrate with CISA's continuous monitoring solution *or* quarterly manual submission," not mandatory feed integration; Power BI removed (not in required configurations); ZTA scope worded from Learn (Entra, Intune, Azure networks, Purview; Identity/Devices/Network/Data tabs) |
| 20 | Google Workspace in scope "since 10 Jul 2026 via ScubaGoggles" | Worked example | corrected | Required-configurations page lists Google Workspace policies with a due date of Dec 1, 2026; the July 10, 2026 date couldn't be verified and was dropped. Detail left to Ch04/Ch05 |
| 21 | "Even Microsoft, which controls both tools, did not converge them" | Worked example | corrected | ScubaGear is CISA's (SCuBA page); only the ZTA is Microsoft's |
| 22 | ZTA evaluates none of Exchange/Defender for Office/Teams/Power Platform | Worked example | removed | The ZTA connects to Exchange and SharePoint (Learn get-started); absolute claim not supportable. Softened to SCuBA being the federal baseline for those workloads; Ch05 owns the comparison |
| 23 | Keep ScubaGear for BOD 25-01; add ZTA for breadth; reconcile at control level (SP 800-53) | Tools are evidence inputs | restated-as-design | Program guidance (whitepaper §3) |
| 24 | GCC-class tenant caps what the ZTA can measure | Tools are evidence inputs | restated-as-design | Generalized to "feature availability differs"; detail in Ch02 P5 and Book 10 |
| 25 | Program anchors claims to verified identity; bindings untrusted by default | What the program adds | restated-as-design | Executive brief (program decision) |
| 26 | Program is an overlay above Entra ID, Cisco ISE, Palo Alto | What the program adds | restated-as-design | Vendor product names generalized to NAC and NGFW (agency- and vendor-neutral) |
| 27 | Five mission classes | What the program adds | restated-as-design | Executive brief table |
| 28 | Leaver revocation target < 120 s | What the program adds | restated-as-design | Kept explicitly as TARGET, not shipped performance |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Whole-agency: front matter, title, subtitle | Ch01 title/description | — |
| Whole-agency: DOCX download callout | — | Site-generation artifact; not carried |
| Whole-agency: "Companion paper" callout | Ch01 opening; Ch02 cross-link | Reframed as book chapters; links to the whitepaper not carried (being archived) |
| Whole-agency: Problem, solution, ask | Ch01 "The case in one paragraph" | Adds close-before-assess (book spine) |
| Whole-agency: Executive summary | Ch01 "The question this book answers" | — |
| Whole-agency §1 Why one system, not three | Ch01 opening and "Three partial assessments" | — |
| Whole-agency §1 incidents (Storm-0558, ESXiArgs, CVE-2024-37085) | Ch01 "Two incidents"; back-referenced in Ch02 P1/P2 | Corrected per claims 12, 15, 16 |
| Whole-agency §2 opening (same naming/identity plane; SP 800-207) | Ch01 "Federal guidance" and "Three partial assessments" | Corrected per claim 9 |
| Whole-agency §2 hypervisor threat class and vCenter SSO | Ch01 "Two incidents" | Ch06 may expand for the virtualization estate |
| Whole-agency §2 facts 1–3 (CM-8/BOD 23-01 inventory; SC-20/21/22 naming; VPN-perimeter thinking) | Ch06 (W2) | Named and linked from Ch01; detailed controls belong to Ch06 |
| Whole-agency §2 fourth fact (unification layer as highest-value target) | Ch01 "Three partial assessments" (summary, with SP 800-207 §5.1/§5.5); Ch06 for the governance detail | — |
| Whole-agency §2 BOD 25-01 scope parenthetical | Ch02 Principle five | — |
| Whole-agency §2 "practical consequence" | Ch01 "Three partial assessments" and the case box | — |
| Whole-agency §3 comparison table | Ch01 "Even one vendor's two tools" | Corrected per claims 19–22; full comparison in Ch05 |
| Whole-agency §3 overlap/gap prose | Ch01 same section | — |
| Whole-agency §3 governance principle (ownership can't be delegated to a CSP tool) | Ch01 "Tools are evidence inputs"; Ch02 P5; Ch07 | — |
| Whole-agency §3 practical guidance bullets | Ch01 "Tools are evidence inputs" | GCC caveat generalized (claim 24) |
| Whole-agency §4 Conclusion | Ch01 "What this chapter establishes" | "Horse before the cart" idiom not carried |
| Whole-agency Sources list | Ch01 footnotes | Each source re-verified; Office 365 GCC service description used in Ch02 instead (Office feature-availability page) |
| Exec brief: title, opening (identity anchoring; bindings untrusted by default) | Ch01 "What the program adds" | — |
| Exec brief: image (mission-class lanes, PNG) | — | Replaced by the mission-class table; old PNG not reused per house rules |
| Exec brief: "What this means for your existing stack" | Ch01 "What the program adds" | Vendor names generalized |
| Exec brief: mission-class table | Ch01 "What the program adds" | — |
| Exec brief: leaver killswitch maturity | Ch01 "What the program adds" | Kept as TARGET |
| Exec brief: executive takeaway | Ch01 "What the program adds" (overlay, no rip-and-replace) | — |
| Exec brief: "Where to go deeper" links | — | Links to archived pages; replaced by book cross-links |
