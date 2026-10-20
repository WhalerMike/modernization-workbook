# Verification — Chapter 02 (Why Standing Privilege Fails)

File covered: `02-why-standing-privilege-fails.md`.
Diagram sources: `docs/images/diagrams/b04-access/src/ch02-standing-vs-eligible.flow.yaml`, `ch02-privilege-maturity.flow.yaml`.
All sources opened on October 20, 2026. SP 800-53 control text and the moderate baseline were read from NIST's OSCAL catalog and profile (usnistgov/oscal-content); M-22-09, SP 800-207 and CISA ZTMM v2.0 were read as extracted PDF text.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Standing = persistent, always active, no activation/justification/approval/time limit | §Root of the root | verified | Definition consistent with Learn PIM terminology ("permanent active") |
| 2 | 8,760 hours a year of exposure | §Root of the root | verified | Arithmetic (365 × 24) |
| 3 | PRA can grant any role; Security Administrator can change CA | §Root of the root | verified | Learn, PIM overview ("only PRA or GA can manage assignments"); CA overview / Book 02 Ch09 |
| 4 | Source: "CISA AA23-278A (Scattered Spider) and Storm-0558 targeted standing Global Admin accounts" | §Root of the root | corrected | AA23-278A is the NSA/CISA "Top Ten Cybersecurity Misconfigurations" advisory (Oct 5, 2023), not Scattered Spider (that's AA23-320A). Storm-0558 used a stolen signing key, not standing GA accounts; removed. Chapter cites AA23-278A for what it says (#5) and Midnight Blizzard (#6) |
| 5 | AA23-278A lists improper separation of user/admin privilege 2nd; excessive privileges, elevated service accounts, non-essential use of elevated accounts; mitigation: time-based access such as JIT | §Root of the root | verified | CISA AA23-278A |
| 6 | Midnight Blizzard: password spray on legacy non-production test tenant account without MFA; took over legacy test OAuth app with elevated access; granted `full_access_as_app` | §Root of the root | verified | Microsoft Security Blog, Jan 25, 2024 |
| 7 | Strong authentication doesn't reduce authorization scope | §Strong authentication | restated-as-design | Carried from Vol III Book 01 argument |
| 8 | Least privilege = specific permissions, specific scope, specific time | §Strong authentication | verified | Learn, "Best practices for Microsoft Entra roles," §1 |
| 9 | AC-6 statement text | §AC-6 | verified | SP 800-53 Rev. 5 (OSCAL catalog) |
| 10 | AC-6(1), (2), (5), (7), (9), (10) statements | §AC-6 table | verified | SP 800-53 Rev. 5 (OSCAL catalog) |
| 11 | AC-6(1),(2),(5),(7),(9),(10), AC-5, AC-2(2) in the moderate baseline | §AC-6 | verified | NIST SP 800-53B moderate baseline profile (OSCAL) |
| 12 | AC-5 statement; AC-2(2) auto-remove/disable temporary and emergency accounts | §AC-6, §Break-glass | verified | SP 800-53 Rev. 5 (OSCAL catalog) |
| 13 | Source (Vol III): "CMMC 2.0 Level 2 and FedRAMP Moderate both require AC-6 and AC-6(5)" | Not used | removed | CMMC is out of scope for this book; the FedRAMP baseline file couldn't be retrieved, so the chapter cites the NIST moderate baseline it was checked against |
| 14 | JIT is the practical way to limit time for cloud admin roles | §AC-6 | restated-as-design | Program position, labeled as such |
| 15 | Source (Vol III): "M-22-09 requires least-privilege access controls and time-bound privilege" | §Federal policy | corrected | M-22-09 doesn't mandate time-bound privilege; it requires evaluating every request and asks for granular, dynamic permissions beyond static RBAC |
| 16 | M-22-09: PAM tools issuing ephemeral single-factor credentials not a substitute for MFA; still important for hard-to-modernize high-privilege systems | §Federal policy | verified | M-22-09 §A.2 |
| 17 | Source (Vol III): "SP 800-207 Tenet 2 sets out per-session access" | §Federal policy | corrected | Per-session access is tenet 3; tenet 2 is network location |
| 18 | ZTMM v2.0 Access Management function (new): traditional → initial → advanced → optimal stage text | §Federal policy, diagram | verified | CISA ZTMM v2.0 §5.1 Table 2 |
| 19 | Microsoft privileged access strategy: JEA + JIT (often with approval) + elevated protections | §JIT and just enough | verified | Learn, "Establish a privileged access strategy" |
| 20 | Fewer than five Global Administrators; fewer than ten privileged role assignments | §JIT and just enough | verified | Learn, "Best practices for Microsoft Entra roles," §5–6 |
| 21 | PIM features: JIT, time-bound, approval, MFA, justification, notifications, reviews, audit history; covers Entra roles, Azure resource roles, PIM for Groups | §JIT and just enough | verified | Learn, PIM overview |
| 22 | No difference in access between permanent and eligible assignments; only the time | §JIT and just enough | verified | Learn, PIM overview (Terminology) |
| 23 | Role deactivates automatically at expiry | §JIT and just enough | verified | Learn, Best practices §2 ("automatically removed when the timeframe expires") |
| 24 | Source (Vol III): "CA requires a fresh MFA proof at activation regardless of earlier MFA (IA-11)" | §JIT details | corrected | PIM's MFA is required only once per session (Learn, "Activate a Microsoft Entra role in PIM"); fresh phishing-resistant auth needs a CA authentication context — consistent with Book 02 Ch09 |
| 25 | Approvers can't approve their own requests; 24-hour approval window, not configurable | §JIT details | verified | Learn, "Approve or deny requests for Microsoft Entra roles in PIM" |
| 26 | Source (Vol III): "approval window default 24 hours; configure 1–4 hours for sensitive roles" | §JIT details | corrected | The 24-hour window isn't configurable (#25) |
| 27 | Source (Vol III): "requested duration 1–8 hours" | Not repeated | corrected | PIM allows up to 24 hours (Book 02 Ch09, footnoted there); chapter links Book 02 Ch09 and Appendix B instead of restating |
| 28 | PIM requires Entra ID P2 or Entra ID Governance | §JIT details | verified | Learn, Best practices §10 note |
| 29 | Emergency access scenarios incl. all-eligible + approval + no approvers → lockout | §Break-glass | verified | Learn, "Manage emergency access accounts" |
| 30 | Source: "two cloud-only accounts with long unique passwords" | §Break-glass table | corrected | Two or more cloud-only `onmicrosoft.com` accounts with passwordless phishing-resistant auth (FIDO2 recommended, or CBA) to satisfy mandatory MFA |
| 31 | Source: "exclude break-glass group from all CA policies" | §Break-glass table | corrected | Exclude from policies that block or restrict sign-in; report-only policies need no exclusion |
| 32 | GA as permanent active in PIM for emergency accounts | §Break-glass table | verified | Learn, "Manage emergency access accounts" |
| 33 | Validate at least every 90 days and after staff changes; alert on all sign-in/audit activity; post-use review | §Break-glass table | verified | Learn, "Manage emergency access accounts" |
| 34 | Don't share auth methods with normal admin accounts | §Break-glass | verified | Learn, "Manage emergency access accounts" |
| 35 | Non-identifying names; SSP records permanent break-glass as documented deviation from AC-2(2) with compensating controls | §Break-glass | restated-as-design | Program rule; AC-2(2) text verified (#12) |
| 36 | Charter problem statement, objectives, scope, principles, risks, assumptions | §Project | restated-as-design | Program's own project charter |
| 37 | Plan phases 0–4 and success measures | §Project phases | restated-as-design | Program's own project plan; "Done when" column derived from the plan's success measures |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| `docs/projects/privileged-access-charter.md` §1 Purpose | Ch02 §Root of the root, §Project intro | — |
| charter §2 Problem Statement | Ch02 §Project — the problem it addresses | — |
| charter §3 Objectives | Ch02 §Project — goals | — |
| charter §4 Scope (in / out) | Ch02 §Project — goals (out-of-scope sentence); in-scope items are the goals | — |
| charter §5 Guiding Principles | Ch02 §Project — principles ("root of the root" in §Root of the root) | — |
| charter §6 Success Criteria | Ch02 §Project — phases ("Done when" column) | — |
| charter §7 High-Level Approach | Ch02 §Project — phases | — |
| charter §8 Risks and Assumptions | Ch02 §Project — risks to plan for | — |
| charter §9 Governance and Ownership | Ch02 §Project — phase 0 row | Names are "to be named"; Chapter 06 covers who decides |
| charter §10 Next Steps | Ch02 §Project — phases 1–3 | — |
| `docs/projects/privileged-access-plan.md` §1 Overview | Ch02 §Project | — |
| plan §2 Phases 0–4 | Ch02 §Project — phases table | — |
| plan §3 Success Measures | Ch02 §Project — phases table | — |
| plan §4 Immediate Next Actions | Ch02 §Project — phases 1–3 | — |
| `Vol_III_Book_01_Privileged_Access_Management.md` — What This Document Addresses | Ch02 §Root of the root, §Strong authentication | Document stays in place; linked |
| Vol III — Authentication vs. Authorization Scope note | Ch02 §Strong authentication | — |
| Vol III — The Standing Privilege Problem: what standing means; attack bullets | Ch02 §Root of the root | Threat-intel citations corrected (claims #4) |
| Vol III — Why standing privilege survives after Entra token adoption | Ch02 §Strong authentication | — |
| Vol III — Before and after comparison | Ch02 §JIT and diagram ch02-standing-vs-eligible | — |
| Vol III — Compliance Dependency warning (M-22-09, SP 800-207, CMMC, FedRAMP) | Ch02 §AC-6, §Federal policy | Corrected (#13, #15, #17) |
| Vol III — Eligible vs active; activation flow; roles to protect | Ch02 §JIT (summary, corrected #24, #26, #27) | Detail stays in Vol III and goes to Chapters 04 and 08; linked |
| Vol III — Emergency access accounts: why break-glass must exist | Ch02 §Break-glass | — |
| Vol III — Break-glass design, alert, quarterly testing | Ch02 §Break-glass (summary, corrected) | Procedure stays in Vol III; linked |
| Vol III — JIT server access, PAW baseline, session management, code | Not carried | Beyond the Why chapter's opening/argument scope; Vol III linked for depth |
| `docs/libraries/conditional-access-principles.md` — Break-glass procedure | Ch02 §Break-glass (corrected #30, #31) | Remaining sections logged in the Chapter 01 verification file |
