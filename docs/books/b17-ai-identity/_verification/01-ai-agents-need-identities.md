# Verification — Chapter 01, Why AI Agents Need Identities and Owners

Writer W1. Sources: `docs/operational-guides/ai-identity-governance/index.md` (all sections; feeds Ch01, Ch03, Ch09) and the framing of `docs/whitepapers/federal-ai-governance-submission-readiness.md` (Problem/Solution; "M-25-21 obligations are IAM obligations"; agentic AI as a system that can act). Most of the chapter is new research. Primary sources opened October 21, 2026: OMB M-25-21 PDF (whitehouse.gov); OMB 2025 AI Use Case Inventory repository (README, `Validation/data_dictionary.md`, `Data/2025_individually_reported_AI_use_cases.csv`, `Reporting Instructions/Guidance on 2025 Agency Artificial Intelligence Reporting (FINAL).pdf`); NIST AI 100-1 and AI 600-1 PDFs (nvlpubs.nist.gov); SP 800-53 Rev. 5 release 5.2.0 OSCAL catalog (usnistgov/oscal-content); Executive Order 14409 (Federal Register raw text); CISA resource page "Careful Adoption of Agentic AI Services"; Microsoft Learn: "Conditional Access for agents," "Target agent identities in Microsoft Entra Conditional Access policies," "Administrative relationships in Microsoft Entra Agent ID," "Microsoft Entra releases and announcements," "What's new in Microsoft Entra Agent ID," "Microsoft Agent 365" service description.

Manual check: the full ACSC/CISA guide *Careful Adoption of Agentic AI Services* on cyber.gov.au timed out twice (curl and WebFetch); not circumvented. The chapter cites only CISA's resource page (title, May 1, 2026 date, partners and summary sentence).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | An agent that acts is an identity; most AI arrived outside the identity program | Opening | restated-as-design | Source index "problem" framing, rewritten |
| 2 | M-25-21 AI definition "includes systems that are fully autonomous, partially autonomous, and not autonomous" | From answering to acting | verified | M-25-21 §5, technical context item 4 |
| 3 | Inventory classification "Agentic AI" definition quoted | From answering to acting | verified | OMB data dictionary, column 12 |
| 4 | 3,611 individually reported use cases, 445 high-impact, as of April 13, 2026 | From answering to acting | verified | OMB repo README |
| 5 | Source: "over 1,800 AI systems … almost none governed at the identity layer" | — | corrected/removed: 1,818 is OMB's "deployed and piloted" use-case total, not systems (see Ch03); "almost none governed" unverifiable, dropped | OMB repo README; Ch03 |
| 6 | 117 agentic use cases; 79 pre-deployment, 18 pilot, 20 deployed | From answering to acting | verified (program count of the CSV) | OMB CSV |
| 7 | Three access patterns (OBO, app-only, agent user account) and subject/actor | Three ways in | verified | MS Learn "Conditional Access for agents" |
| 8 | API key access "bypasses the Microsoft Entra ID authentication and token issuance pipeline entirely"; CA doesn't apply | Three ways in | verified | Same page, Boundaries and limitations |
| 9 | How AI arrived (pilots, API keys, product features, low-code agents) and the "typically lacks" table | How AI arrived | restated-as-design ("in the program's experience") | — |
| 10 | Inventory fields describe a use case; only a contact email; public version may replace it with a public-inquiry address; no account/credential/permission/owner field | How AI arrived | verified | OMB 2025 guidance §1(b)(i), §5 |
| 11 | Prompt injection, indirect prompt injection, data theft and remote code execution demonstrated | Why the risk is identity-shaped | verified | NIST AI 600-1 §2.9 |
| 12 | CISA with ASD's ACSC released "Careful Adoption of Agentic AI Services," May 1, 2026; summary quote | Why the risk is identity-shaped | verified (landing page only; full guide manual check) | CISA resource page |
| 13 | EO 14409 §4: prosecute AI-enabled unauthorized access incl. "employing AI agents to unlawfully access data" | Why the risk is identity-shaped | verified | EO 14409, 91 FR 34565 |
| 14 | AC-2 statement items and discussion listing "system" and "service" account types; AC-6 "processes acting on behalf of users"; IA-4/IA-5 "individual, group, role, service, or device"; IA-9 statement | The controls already apply | verified | SP 800-53 5.2.0 OSCAL catalog |
| 15 | AI RMF GOVERN 1.6 (inventory), 1.7 (decommissioning), 2.1 (roles) | The controls already apply | verified | NIST AI 100-1 Table 1 |
| 16 | Gap is coverage, not catalog | The controls already apply | restated-as-design | — |
| 17 | Entra Agent ID: agent identities, blueprints, at least one sponsor required; sponsor definition quoted | The platforms are catching up | verified | MS Learn "Administrative relationships" |
| 18 | Agent ID platform GA April 2026 | The platforms are catching up | verified | MS Learn Entra "What's new," April 2026 |
| 19 | CA for agent identities: Block only; agent-user targets and agent risk condition preview | The platforms are catching up | verified | MS Learn "Target agent identities in CA" |
| 20 | Microsoft publishes migration guidance for custom app registrations and Copilot Studio agents to Agent ID | The platforms are catching up | verified | MS Learn "What's new in Microsoft Entra Agent ID" |
| 21 | Agent 365 service description: availability column for GCC only; "meets all FedRAMP High controls" reviewed by assessor as of Oct 1, 2026, final authorization pending | The platforms are catching up | verified | MS Learn Agent 365 service description |
| 22 | Program builds on GA only, preview as watch items | The platforms are catching up | verified (settled fact) | Book 04 Ch03 |
| 23 | Seven things every AI identity needs | What every AI identity needs | restated-as-design | Source "six gaps" and brief's model; internal record/spec IDs removed |
| 24 | Credential order: managed identity, federation, certificates only where neither applies | What every AI identity needs | verified (settled fact) | Book 02 Ch09; Book 04 Ch05 |
| 25 | Non-human items anchor to a human owner | What every AI identity needs | verified (settled fact) | Book 14 Ch04 |
| 26 | Source: drift class `DRIFT-COMPLIANCE::ai-agentic-ungoverned` P1 | What every AI identity needs, item 5 | restated: "an agentic AI system with no governed identity is a high-priority finding" | Vocabulary rule |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| index.md: front matter, subtitle | — | Replaced by workbook front matter |
| index.md: opening ("over 1,800 AI systems"; no placement, credential, lifecycle) | Ch01 "From answering to acting" (verified counts) and "How AI arrived" table | Count corrected to use cases; "almost none governed" dropped as unverifiable |
| index.md: two paths (manual vs governed) | — (to Ch09) | Kit delivery modes belong to Ch09; engine-bound governed path not carried per vocabulary rules |
| index.md: "Download the runnable kit" callout (`Invoke-AIInventoryScan.ps1`) | — (to Ch09) | Script isn't in the repository; Ch09 describes the scan as method |
| index.md: "The problem this kit solves" (inventory has no identity fields) | Ch01 "How AI arrived outside the identity program" | Re-verified against the 2025 field list |
| index.md: What the kit does (four phases) | — (to Ch09) | Scan procedure |
| index.md: Who this is for | Ch01 audience implied; roles to Ch08 | — |
| index.md: Background reading (drift-class finding, internal spec IDs) | Ch01 item 5 in plain words | Internal IDs and links not carried |
| index.md: Deployment options (standalone, governed adapter slot) | — (to Ch09) | Adapter/engine names not carried |
| Whitepaper: Problem/Solution box (M-25-21 obligations as IAM obligations; agentic AI as an actor) | Ch01 thesis and "From answering to acting" | Competitive and product framing dropped |
| Whitepaper: remaining sections | Ch02 (see its ledger) | — |
