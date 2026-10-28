# Verification — Chapter 05, Generative and Agentic AI in the Architecture

## Sources opened

All opened October 28, 2026: OMB M-25-21 and M-25-22 PDFs (whitehouse.gov, text extracted locally); NIST AI 600-1 PDF (text extracted locally); OWASP GenAI Security Project pages for the 2025 LLM Top 10 list, LLM01 Prompt Injection, LLM05 Improper Output Handling, LLM06 Excessive Agency and LLM10 Unbounded Consumption, and the resource page for the Top 10 for Agentic Applications for 2026; Model Context Protocol specification (`/specification/latest`, schema 2026-07-28) and Governance and Stewardship pages; Spring AI reference index (docs.spring.io); Microsoft Learn (MCP tools) pages for GitHub Copilot modernization (Java upgrade quickstart and Copilot CLI); AWS Transform User Guide, "Modernization of mainframe applications"; CISA "Careful Adoption of Agentic AI Services" resource page; CSRC SSDF publications page; arXiv abstract 2005.11401. Manual check: the OWASP agentic resource page doesn't list the ten ASI risk names (they're in the downloadable document, not opened), so the chapter gives only the numbering ASI01–ASI10. A third-party list of names from search results was not used. Federal AI rules are Book 17's settled facts and are linked, not re-derived; the two quotations used here were checked against the memo text. Reference-implementation behavior is from the editor's description and stated only as what it does.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | M-25-21 fn 22: risk-acceptance process "is separate from, and does not supersede," system authorization | Opening | verified (quote) | M-25-21 |
| 2 | M-25-22 §4(e)(i): AI systems operated as information systems need an ATO before deployment | Opening | verified | M-25-22 |
| 3 | EO 14434 terminology and workbook's choice to keep "AI" | Opening | linked to Book 17 Ch02 settled fact; not re-cited | Book 17 Ch02 |
| 4 | NIST AI 600-1 confabulation definition | Patterns table; material | verified (quote) | AI 600-1 §2 |
| 5 | RAG introduced by Lewis et al., arXiv May 22, 2020, NeurIPS 2020 | Patterns table | verified | arXiv 2005.11401 |
| 6 | RAG risks: disclosure, poisoning, vector store weaknesses | Patterns table | verified against LLM02/LLM04/LLM08 names | OWASP 2025 list |
| 7 | Retrieval runs with caller's permissions | Patterns | restated-as-design | — |
| 8 | OWASP LLM06: execute extensions in the user's context, not a generic high-privilege account | Patterns; guardrails | verified | OWASP LLM06 |
| 9 | SSMA Oracle and DMS SC offer AI-assisted conversion | Code modernization | verified in Ch04 sources | Ch04 log rows 19, 22 |
| 10 | GitHub Copilot modernization: plan, code changes with build validation; Java 11/17/21/25; Spring Boot up to 4.0 | Code modernization | verified | Microsoft Learn quickstart |
| 11 | `--allow-all` flag for unattended execution | Code modernization | verified | Microsoft Learn, Copilot CLI page |
| 12 | Program doesn't use unattended mode on production repositories | Code modernization | restated-as-design | — |
| 13 | AWS Transform for mainframe: COBOL, PL/I, JCL, CICS, BMS, Db2, VSAM; COBOL→Java; human approval of decomposition and wave planning | Code modernization | verified | AWS Transform User Guide |
| 14 | Spring AI 2.0.2 current stable; "portable API support across AI providers"; tool calling and MCP | Model interface | verified (quote) | Spring AI reference |
| 15 | Four interface requirements | Model interface | restated-as-design | — |
| 16 | OWASP LLM10 mitigations: rate limiting, timeouts, limit queued and total actions | Model interface; guardrails | verified | OWASP LLM10 |
| 17 | Reference implementation: `ModelClient` interface and deterministic stub | Model interface | restated as reference implementation behavior; linked to Ch08 | — |
| 18 | LLM06 three causes: excessive functionality, permissions, autonomy | Guardrails | verified | OWASP LLM06 |
| 19 | LLM01: "it is unclear if there are fool-proof methods of prevention" | Guardrails | verified (quote) | OWASP LLM01 |
| 20 | Guardrail table mitigations: minimize extensions; avoid open-ended; minimize permissions; complete mediation; human approval; logging and monitoring | Guardrails table | verified | OWASP LLM06 |
| 21 | LLM05: treat the model "as any other user, adopting a zero-trust approach" | Guardrails table | verified (quote) | OWASP LLM05 |
| 22 | LLM01: segregate and mark external content | Guardrails table | verified | OWASP LLM01 |
| 23 | M-25-21 §4(b)(v): human oversight and fail-safe for high-impact AI | Guardrails table | verified | M-25-21 |
| 24 | Agents get no write tool; proposals approved by people and applied by services | Guardrails | restated-as-design | — |
| 25 | Reference implementation: agent ID, sponsor, allowed tools; allow-list with denied calls audited; hard step limit; `propose_action` PENDING | Guardrails | restated as reference implementation behavior; linked to Ch08 | — |
| 26 | MCP spec version 2026-07-28; JSON-RPC 2.0; hosts, clients, servers; resources, prompts, tools ("functions for the AI model to execute") | MCP | verified (quote); consistent with Book 17 Ch06 | MCP specification |
| 27 | MCP governance: Model Context Protocol a Series of LF Projects, LLC; Apache 2.0 for specifications; maintainer hierarchy; SEPs | MCP | verified | MCP Governance page |
| 28 | Agentic AI Foundation as MCP's home (seen only in secondary search results) | — | not carried; the chapter cites only the governance page's own wording | — |
| 29 | MCP: hosts "must obtain explicit user consent before invoking any tool"; tool descriptions untrusted unless from a trusted server; protocol "cannot enforce these security principles" | MCP | verified (quotes) | MCP specification |
| 30 | OWASP LLM Top 10 2025 item names | Material | verified | OWASP 2025 list |
| 31 | OWASP Top 10 for Agentic Applications for 2026 published Dec 9, 2025; ASI01–ASI10 | Material | verified (date and numbering only; names not shown on page) | OWASP resource page |
| 32 | AI 600-1 July 2024; twelve risks; data privacy, information security, value chain ("improper supplier vetting across the AI lifecycle") | Material | verified (quote) | AI 600-1 §2 |
| 33 | SP 800-218A final July 26, 2024 | Material | verified | CSRC SSDF publications |
| 34 | CISA agentic guidance May 1, 2026 with ASD's ACSC and partners; advisory; page uses "SI" | Material | verified | CISA resource page |
