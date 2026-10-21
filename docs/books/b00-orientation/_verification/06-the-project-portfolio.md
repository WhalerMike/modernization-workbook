# Verification — Chapter 06 (The Complementary Projects)

File covered: `06-the-project-portfolio.md`.
Diagram source: `docs/images/diagrams/b00-orientation/src/ch06-project-portfolio.flow.yaml`.
All sources opened on October 21, 2026. The M-26-05 PDF was downloaded from whitehouse.gov and read as extracted text; NIST, FedRAMP and Gitea pages through WebFetch; Microsoft Learn pages through the Microsoft Learn MCP tools. Charters are linked on GitHub as the brief requires (`https://github.com/WhalerMike/modernization-workbook/blob/main/docs/projects/<file>.md`).

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Seven projects, each with a charter and a plan, in the suggested order | §At a glance; §Why this order | verified (source-internal) | Projects README |
| 2 | Charter shape (ten sections) and "to be named" roles; no decision-record identifiers | §Why the program has projects; §What the charters leave | verified (source-internal) | All seven charters §1–§10 and footers |
| 3 | Five-clause change path | §Why the program has projects | verified (source-internal) | Identity charter §1 |
| 4 | Reasons for the sequence | §Why this order | restated-as-design | Chapter's synthesis from charters' dependencies and assumptions |
| 5 | Privileged access starts early: G1 requires emergency access vaulted and tested and Tier 0 FIDO2 registration | §Why this order (5) | verified | Book 01 Ch12 Phase 1 |
| 6 | Book that carries each project | Table; per-project sections | verified | docs/books/index.md and book folders (B12–B17 planned, link to book list) |
| 7 | NTLM: all versions deprecated June 2024; NTLMv1 removed in Windows 11 24H2 and Windows Server 2025; use Negotiate; NTLMv2 still works | §2 Endpoint | verified | Learn, "Deprecated features for Windows client"; "Features removed or no longer developed in Windows Server" |
| 8 | ISCM purpose: visibility into assets, awareness of threats and vulnerabilities, visibility into control effectiveness | §4 Continuous monitoring | verified | NIST SP 800-137 abstract |
| 9 | KSIs provide measurable validation that protections function; evidence collected continuously | §4 Continuous monitoring | verified | FedRAMP, "Key Security Indicators" |
| 10 | PIM licenses needed for eligible/time-bound assignees and approvers (P2 or Governance) | §5 Privileged | verified | Learn, "Microsoft Entra licensing," PIM section |
| 11 | Emergency access: at least two cloud-only accounts, GA permanent active (not eligible), phishing-resistant, excluded from blocking CA, monitored, validated at least every 90 days | §5 Privileged | verified | Learn, "Manage emergency access accounts in Microsoft Entra ID" |
| 12 | "Zero permanent Global Administrators" (master plan M-026 and cutover check 2) must exempt emergency accounts | §5 Privileged; takeaways | corrected | Same Learn page (permanent active GA for emergency accounts) |
| 13 | OMB M-26-05 (Jan 23, 2026) rescinded M-22-18 and M-23-16; agencies keep a complete software/hardware inventory and risk-matched assurance policies; attestation form optional; SBOM on request via contract; CISA 2025 draft SBOM minimum elements cited | §7 Supply chain | verified (charter's implied mandate context corrected) | OMB M-26-05 (PDF text) |
| 14 | FedRAMP certifies a cloud service offering; agency AO authorizes the agency's own system; don't ATO the cloud service itself | §7 Supply chain | verified; charter's "vendor authorization status" restated as certification status plus agency authorization | FedRAMP, "Using a FedRAMP Certified Cloud Service" |
| 15 | HR, not the directory, is source of organizational truth; contractors need their own source | §1 Identity | verified by link | Book 03; Book 01 Ch09 (HR and contractor sources) |
| 16 | Per-project purpose, problem, success criteria, out-of-scope, principles | §Projects one by one | verified (source-internal) | Each charter §1–§8 |
| 17 | Projects run inside program phases; no second authoritative source; shared evidence contract | §How the projects fit | restated-as-design | Chapter's synthesis |
| 18 | Identity charter alone states decision rights; attribute meaning is HR's decision in the program model | §What the charters leave | verified | Identity charter §9; Book 01 Ch09 decision matrix |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Projects README: title and intro | Ch06 §Why the program has projects | "Modernization workbook" renamed to the Federal Modernization Workbook |
| Projects README: Available table | Ch06 §At a glance (with charter links on GitHub) | Plan links not repeated; each charter links its plan |
| Projects README: Suggested sequence | Ch06 §Why this order; diagram | — |
| Projects README footer | — | No content |
| Identity charter §1–§2 | Ch06 §1 Purpose, Problem | — |
| Identity charter §3–§4 (objectives, scope) | Ch06 §1 Success, Out of scope; table | Objectives folded into success criteria |
| Identity charter §5 principles | Ch06 §1 Where it lives (HR as source of truth); §Why the program has projects | Other principles duplicate Ch04 |
| Identity charter §6–§10 | Ch06 §1; §What the charters leave (decision rights) | Next steps and approach steps duplicate success criteria |
| Endpoint charter §1–§10 | Ch06 §2 | Risks (premature NTLM restriction, overlap, secrets in startup scripts, attribute gaps) folded into §2 problem and principles |
| Network & Access charter §1–§10 | Ch06 §3 | Risk "vendor maturity varies inside government-cloud boundaries" left to Book 10 Ch04 |
| Continuous Monitoring charter §1–§10 | Ch06 §4 | Risk "findings exceed remediation capacity" left to Book 01 Ch11 / planned Book 13 |
| Privileged Access charter §1–§10 | Ch06 §5 | — |
| Data Platform charter §1–§10 | Ch06 §6 | — |
| Supply Chain charter §1–§10 | Ch06 §7 (context corrected) | — |
| All charters §9 governance (sponsor, lead, domain leads) | Ch06 §What the charters leave; Ch07 §The complementary projects | Domain-lead lists per project not tabulated |
| All charters footers | Ch06 §Why the program has projects | — |
| Project plans (`*-plan.md`) | — | Not in the assignment beyond the charters' first sections; linked from each charter |
