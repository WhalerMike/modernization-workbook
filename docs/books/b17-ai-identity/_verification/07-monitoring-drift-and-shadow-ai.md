# Verification — Chapter 07, Monitoring, Drift and Shadow AI

Writer W4. Source page: `docs/operational-guides/ai-identity-governance/governed-path.md` (drift integration, reciprocity cross-walk, annual refresh, OSCAL evidence). Most of the chapter is new research. Kept consistent with Book 04 Ch03 (agent CA targets preview, Block only), Book 04 Ch05/Ch06 (consent, credentials, IGO), Book 12 Ch02 (evidence contract, eight fields, join key, disposition), Book 12 Ch03 (log categories and tables, agent risk tables), Book 13 Ch06 (five drift classes, severity rule, pinned severities, ladder ceiling, engine never accepts risk), Book 13 Ch09 (who reviews drift, exceptions) and Book 15 Ch06 (SaaS authorization verdict, app governance in gov clouds). Microsoft pages read through the Microsoft Learn MCP tools or fetched directly; federal PDFs downloaded from whitehouse.gov and nvlpubs.nist.gov with a generic user agent and read as text; SP 800-53 text checked against the release 5.2.0 OSCAL catalog. All accessed October 21–22, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | M-25-21 ongoing monitoring practice: performance and security; detect changes after deployment and to context of use | What policy asks | verified | M-25-21 §4(b)(iii) |
| 2 | Practice binds high-impact use cases | What policy asks | verified | M-25-21 §4 intro, §4(b) |
| 3 | AI RMF GOVERN 1.6 inventory; MEASURE 2.4 monitoring in production; MANAGE 4.1 post-deployment monitoring plans | What policy asks | verified | NIST AI 100-1 |
| 4 | Four sign-in log types | Where AI sign-ins land | verified | MS Learn, concept-sign-ins |
| 5 | `agentSignIn` type; agent sign-ins may appear across all four log types; Agent type and Is Agent filters; Graph beta | Where AI sign-ins land | verified | MS Learn, Agent ID logs |
| 6 | Agent ID platform GA April 2026 | Where AI sign-ins land; release table | verified | Entra What's new, April 2026 |
| 7 | Audit: blueprint = application events, agent identity = service principal events, agent user = user events; `agentType` values | Audit log | verified | MS Learn, Agent ID logs |
| 8 | Audit logs and Graph activity logs don't distinguish agents by default; join with sign-in logs | Audit log | verified | Agent ID FAQ |
| 9 | OBO token represents the user and identifies the calling agent | Table | verified | MS Learn, Conditional Access for agents |
| 10 | Retention 7 days Free / 30 days P1, P2; Graph activity logs not retained unless exported | Audit log | verified | MS Learn, data retention |
| 11 | Graph request for agent identity sign-ins | Code block | verified (copied from Microsoft's page) | MS Learn, Agent ID logs |
| 12 | GCC High / DoD Graph hosts graph.microsoft.us / dod-graph.microsoft.us | Code note | verified | MS Learn, Agent 365 CLI for US Government clouds |
| 13 | Microsoft's alert list for agents | What to alert on | verified | Agent ID best practices |
| 14 | CloudTrail `userIdentity`, `sessionIssuer`, `sourceIdentity` | What to alert on | verified | AWS CloudTrail User Guide |
| 15 | Google Agent Identity: audit logs show agent and user; page gives no release stage or government availability | What to alert on | verified | Google Cloud, Agent Identity overview |
| 16 | ID Protection workload identity detections; offline; scope (managed identities out); Workload ID Premium for full details and risk CA; CA only single-tenant SPs; remediation steps | Workload identities | verified | MS Learn, Securing workload identities |
| 17 | Workload ID Premium available in Azure Government | Workload identities; table | verified | Entra feature availability (US Gov), updated Feb 13, 2026 |
| 18 | ID Protection for agents: eight detections, offline, learning mode, OBO attributed to user, report actions, confirm compromise triggers CA | Agents | verified | MS Learn, ID Protection for agents |
| 19 | ID Protection for agents needs P2 during preview; Agent risk condition preview; Agent 365 license "starting soon" | Agents; table | verified | Manage agent identities; Target agent identities; Secure autonomous agents; ID Protection for agents |
| 20 | CA agents assignment labeled preview; agent identities only Block | Agents | verified | Target agent identities; CA Grant page |
| 21 | Program doesn't build on preview signals | Agents | restated-as-design | Consistent with Book 04 Ch03 |
| 22 | MDCA Generative AI catalog category, "more than a thousand" apps, sanction/unsanction, discovery policies | Shadow AI | verified | MS Learn, Discover AI apps and data |
| 23 | Unsanctioned app blocked on MDE-onboarded devices, or warn | Findings comment | verified | MS Learn, Manage generative AI apps |
| 24 | GSA shadow AI discovery: traffic, catalog match, users, bytes | Shadow AI | verified | MS Learn, Shadow AI discovery in GSA |
| 25 | Admin consent workflow doesn't work for agent permission requests; high-risk Graph permissions blocked for agents | Shadow AI | verified | Agent ID FAQ |
| 26 | MDE local AI agent discovery: types, MCP servers, macOS preview, listed only after observed activity, not a complete inventory | Shadow AI; table | verified | MS Learn, local agent discovery |
| 27 | Defender AI agent inventory covers Copilot Studio, Foundry, M365, supported non-Microsoft, local agents | Shadow AI | verified | MS Learn, AI agent inventory |
| 28 | GSA AI agent discovery preview; managed vs shadow by Agent ID registration; needs client and TLS inspection | Shadow AI; table | verified | MS Learn, AI agent discovery in GSA |
| 29 | Defender CSPM AI-SPM discovers Azure OpenAI, Azure ML, Bedrock; GA in Azure and Azure Government; Defender for AI Services not in Azure Gov | Shadow AI; table | verified | Defender for Cloud support matrix (updated Jul 1, 2026); Discover AI apps and data |
| 30 | CA doesn't apply when an agent uses an API key | Shadow AI | verified | MS Learn, CA for agents, boundaries |
| 31 | MDCA US Gov parity except listed app governance features | Table | verified | MDCA for US Government offerings |
| 32 | GSA available in GCC, not GCC High, DoD | Table | verified | GSA known limitations |
| 33 | Agent 365 GCC availability rows (registry, lifecycle, Entra CA/IDP for delegated agents Yes; shadow endpoint agent sync, block unsanctioned local agents No); FedRAMP High controls met, authorization pending (Oct 1, 2026) | Table; FedRAMP note | verified | Agent 365 service description |
| 34 | Agent ID not listed on the Entra Azure Government availability page | Table | verified (absence) | Entra feature availability (US Gov) |
| 35 | 2025 inventory fields and Agentic AI definition; `pia_url` optional | Declared side | verified | ombegov 2025 inventory data dictionary |
| 36 | Inventory at least annually, DoD and IC excepted | Declared side | verified | M-25-21 §3(b)(v) |
| 37 | 13-month staleness | Declared side | restated-as-design | Source's design; presented as program design |
| 38 | AI findings mapped to Book 13 classes and pinned severities | Findings table | restated-as-design | Book 13 Ch06 rules; source drift-class table translated |
| 39 | AI system operated as information system needs ATO prior to deployment | Findings comment | verified | M-25-22 §4(e)(i) |
| 40 | Lifecycle Workflows sponsor transfer to manager GA May 2026 | Findings comment | verified | Entra What's new, May 2026 |
| 41 | Agent ID sponsor required on create; guests allowed as sponsors; sponsors and owners can disable | Findings comment; engine | verified | Agent ID owners, sponsors and managers |
| 42 | Sponsor must be an agency employee | Findings comment | restated-as-design | Ch08 |
| 43 | Join key = identity record key; display names rejected | Evidence | restated-as-design | Extends Book 12 Ch02 |
| 44 | SP 800-53 control titles: AC-2, AC-2(12), CA-6, CM-8, CM-8(3), CM-8(4), IA-4, IA-5, IA-9, RA-8 | Evidence | verified | SP 800-53 5.2.0 OSCAL |
| 45 | Source mapped PIA to PT-2 and AR-2; PT-2 is Authority to Process PII, RA-8 is PIA, AR family absent in Rev. 5 | Evidence | corrected | SP 800-53 5.2.0 OSCAL (no `ar` group) |
| 46 | Source's CA-8 and SI-7 mappings dropped | Evidence | removed | Don't describe the gap measured |
| 47 | Control mapping table overall | Evidence | restated-as-design | Program mapping |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Intro (extends manual path with drift engine and reciprocity) | Ch07 opening, "Drift" | Internal vocabulary ("substrate", "the program decision") dropped |
| Prerequisites (adapter activation, SailPoint machine-identity slot) | — | Product and adapter mechanics; internal slot names not carried. Ch09 covers how the scan runs |
| What the governed path adds (table) | Ch07 "The findings" and "What the engine does and doesn't do" | Restated as findings routed to owners; owner-assignment workflow → Ch08 sponsor rules |
| Activation, Option A (adapter, CLI) | — | Internal adapter registry and CLI not in the repository; not carried. Ch09 describes the scan as method |
| Activation, Option B (Python package) | — | Code for an internal package not in the repository; not carried |
| Drift engine integration (P1 HALT, P2 per-policy) | Ch07 "The findings", "What the engine does and doesn't do" | Mapped to Book 13's severity and ladder rules |
| Six AI drift classes (table) | Ch07 findings table | Translated into plain-language findings, mapped to Book 13's five classes; routing kept (AO/ISSO, security, IGO, privacy); added credential-outside-pipeline and unsanctioned-service findings |
| ATO reciprocity cross-walk | Ch07 "no recorded authorization" finding | Internal registry IDs dropped; the platform-ATO inheritance point is left to Ch10 and Book 13 Ch11 (reciprocity). The agency-specific HR-platform example is not carried (names an agency program) |
| Annual inventory refresh cycle | Ch07 "What the engine does and doesn't do" | Delta rules kept; 13-month staleness kept as design; internal spec ID dropped |
| OSCAL evidence output and control map | Ch07 "From finding to evidence" | Mapped to Book 12's eight-field record; control map corrected (PT-2/AR-2 → RA-8; CA-8, SI-7 dropped). OSCAL assembly is Ch10's |
| Callout: offering the script to OMB; schema-extension letter | — | Solicitation/advocacy framing and an inbox draft; not carried |
| Normative references (internal specs) | — | Internal IDs; not carried |
