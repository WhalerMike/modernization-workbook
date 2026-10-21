# Verification — Chapter 02, Day Two Is Where Compliance Lives or Dies

Writer W1. Sources: `docs/compliance/Vol_VI_Book_00_Implementation_Overview.md` (all sections), `docs/compliance/Vol_VII_Book_00_ServiceNow_Automation_Overview.md` (all sections), and the framing of `docs/compliance/Operator_Runbook_Day2_Compliant.md` ("What this is," "The One Rule Every Task Obeys," "What Changes, in One Table"; the per-task procedures belong to Ch12). Primary sources opened October 21, 2026: SP 800-53 release 5.2.0 OSCAL catalog and the low, moderate and high baseline profiles (usnistgov/oscal-content; statements extracted and baseline membership computed locally); SP 800-137 CSRC record and abstract; FedRAMP Marketplace `products.json` (meta `last_change` 2026-10-21); ServiceNow documentation "Continuous Authorization and Monitoring" (Zurich) and "Exploring MID Server" (Australia); Microsoft Learn "What is Microsoft Entra Privileged Identity Management?".

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Controls erode through routine work; make routine work produce its own evidence | Opening | restated-as-design | Vol IX/VII framing; runbook closing |
| 2 | AC-2, AC-2(4), AC-6, AC-6(9), IA-5, CM-3, CM-8, AU-9 statements; all in moderate baseline | Compliance decays (table) | verified | SP 800-53 5.2.0 OSCAL |
| 3 | AC-2(1), AC-2(4), CM-8(1) in moderate; CM-8(2) high only; CA-7(6) in no baseline | Compliance decays | verified (computed from profiles) | OSCAL baseline profiles |
| 4 | Automation as a design position about volume, not a reading of the moderate baseline | Compliance decays | restated-as-design | — |
| 5 | CA-7 statement (strategy, metrics, frequencies, ongoing assessment, correlation, response, reporting); in every baseline | What continuous monitoring asks for | verified | SP 800-53 5.2.0 OSCAL; low profile |
| 6 | SP 800-137 (Sept 2011) purpose: visibility into assets, threats and vulnerabilities, control effectiveness; ongoing assurance aligned with risk tolerance | What continuous monitoring asks for | verified | CSRC SP 800-137 abstract |
| 7 | Three layers: designed, deployed as code, operated; no double-counting | Designed, deployed, operated | restated-as-design | Vol VI and Vol VII necessity boxes (doctrine name removed) |
| 8 | CM-6 (implement settings; monitor and control changes) and AU-6 (review and analyze audit records) statements | Designed, deployed, operated | verified | SP 800-53 5.2.0 OSCAL |
| 9 | CM-2 asks for a current baseline under configuration control | The deploy model | verified | SP 800-53 5.2.0 OSCAL |
| 10 | Deploy model: everything as code; in-boundary by construction; evidence-emitting | The deploy model | restated-as-design | Vol VI "The Deploy Model" |
| 11 | Actuation platform-native; governance and evidence unified | The coordination contract | restated-as-design | Vol VII coordination doctrine |
| 12 | Four contract properties plus CMDB-reconciles guardrail | The coordination contract | restated-as-design | Vol VII platform-optionality note and guardrail |
| 13 | CM-8: accurately reflects; no duplicate accounting | The coordination contract | verified | SP 800-53 5.2.0 OSCAL |
| 14 | ServiceNow recommended, not mandatory; two substitution routes | ServiceNow as the reference platform | restated-as-design | Vol VII note |
| 15 | Atlassian Government Cloud FedRAMP Certified, Moderate, Class C (FR2412062433) | ServiceNow as the reference platform | verified | Marketplace products.json |
| 16 | Source: "ServiceNow Government Cloud ... FedRAMP High" | The boundary question | corrected: Marketplace lists "Government Community Cloud" (F1305072116), FedRAMP Certified, High, Class D | Marketplace products.json |
| 17 | Moderate baseline is a subset of high (source: "strict superset") | The boundary question | verified (all 287 moderate entries are in the 370-entry high baseline, release 5.2.0) | OSCAL profiles |
| 18 | Agency records the High-on-Moderate treatment or picks a Moderate platform | The boundary question | restated-as-design | Vol VII boundary treatment |
| 19 | Source: platform status pinned in an internal Product Inventory Questionnaire (with an agency-specific section name) | — | removed (internal reference and agency-specific label); replaced by "check the Marketplace at procurement" and link to Book 10 | — |
| 20 | MID Server: intermediary between network and instance; installed on hosts in the network; transfers data securely through the firewall | The boundary question | verified | ServiceNow "Exploring MID Server" (Australia, page served in German; translated) |
| 21 | ServiceNow CAM "employs the seven steps defined by the NIST Risk Management Framework"; workspace for continuous monitoring; separate subscription requiring activation | What the platform already ships | verified | ServiceNow CAM (Zurich) |
| 22 | Five operating rules (originate, authorize, least privilege JIT, provenance, evidence) | The day-two operating rules | restated-as-design; linked to settled Book 13 Ch04 / Book 14 Ch04 | Runbook "One Rule"; Vol IX discipline |
| 23 | PIM eligible assignment, time-limited activation with MFA, justification, approval, audit history | The day-two operating rules | verified | MS Learn PIM |
| 24 | Everyday-task table (8 tasks, as found vs governed) | What changes for everyday tasks | restated-as-design | Runbook summary table (catalog IDs, KSI names and internal volume references removed) |
| 25 | Source: day-two evidence feeds the FedRAMP 20x KSI feed | Where the evidence goes | corrected: KSIs bind providers; agency evidence feeds its own CA-7 strategy, POA&M and package | Settled fact (brief; Book 14 Ch01) |
| 26 | Tempo (ticket to machine), actuation ladder L3 default ceiling, privileged-access model | Operating model in outline | verified (settled facts, linked) | Book 13 Ch10; Book 01 Ch11; Book 04 |
| 27 | Source product lists for M365/Azure actuation (Graph, CA, Azure Policy, Defender for Cloud, Update Manager) | The coordination contract | carried as named examples only; product behavior verified in Ch08 (W6) | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Vol VI Book 00: draft banners, Date Code | — | Draft/classification stamps not carried |
| Vol VI Book 00: Series Context | Ch02 "Designed, deployed, operated" (layer 2) | Volume numbering not carried |
| Vol VI Book 00: What This Document Addresses (design assertion vs operational realization) | Ch02 "Designed, deployed, operated" | — |
| Vol VI Book 00: Architecture vs Implementation note (deployed example plus substitution) | Ch02 "ServiceNow as the reference platform" (mechanism, not product) | — |
| Vol VI Book 00: The Deploy Model (three principles) | Ch02 "The deploy model" | — |
| Vol VI Book 00: How This Volume Maps to the Architecture (table) | Not carried as a table | Implementation-book map belongs to Books 10–12 and 14; Ch02 links Book 10 Ch07 and Book 12 Ch02 |
| Vol VI Book 00: Closure Necessity box | Ch02 "Designed, deployed, operated" (layer 2, CM-6/AU-6/CA-7 examples) | Capitalized doctrine name removed |
| Vol VI Book 00: What This Volume Is and Is Not | Ch02 Honest limits (operate-and-tune cost) and leadership point 2 | — |
| Vol VI Book 00: Cross-References, Provenance | — | Internal references and authoring notes |
| Vol VI Book 00: Where This Volume's Evidence Lands (optional binding) | — | Internal engine-binding section; not carried per vocabulary rules |
| Vol VII Book 00: banners, Date Code | — | Draft stamps not carried |
| Vol VII Book 00: Series Context | Ch02 "The coordination contract" | — |
| Vol VII Book 00: Scope (Moderate, GCC Moderate, AWS GovCloud, VMware; OCI and higher boundaries out of scope) | Ch02 "The coordination contract" (platform list); detailed scope to Ch08–Ch09 | Out-of-scope list not carried |
| Vol VII Book 00: What This Volume Addresses | Ch02 "The coordination contract" opening | — |
| Vol VII Book 00: The Coordination Doctrine (two halves) and CMDB guardrail | Ch02 "The coordination contract" and guardrail row | Capitalized doctrine name removed |
| Vol VII Book 00: Books in This Volume (table) | Ch02 operating-model table (Ch07, Ch08, Ch09, Ch11) | Volume/book numbering not carried |
| Vol VII Book 00: The Boundary Discipline (three constraints) | Ch02 "The boundary question" | — |
| Vol VII Book 00: ServiceNow recommended, not mandatory | Ch02 "ServiceNow as the reference platform" | Atlassian status re-verified on the Marketplace |
| Vol VII Book 00: Authorization Boundary Treatment (High-on-Moderate) | Ch02 "The boundary question" | Offering name corrected; internal questionnaire reference removed |
| Vol VII Book 00: Closure Necessity box | Ch02 "Designed, deployed, operated" (layer 3) | Doctrine name removed |
| Vol VII Book 00: How This Volume Fits | Ch02 "Where the evidence goes" | KSI framing corrected |
| Vol VII Book 00: Cross-References, Provenance (vendor-currency note) | Ch02 Honest limits (dated product statements) | Internal file paths not carried |
| Vol VII Book 00: Where This Volume's Evidence Lands | — | Internal engine-binding section |
| Runbook: banner, "What this is" | Ch02 "What changes for everyday tasks" (intro) | Catalog-item IDs and internal book references not carried |
| Runbook: The One Rule Every Task Obeys | Ch02 "The day-two operating rules" | Internal lifecycle name removed; linked to settled Book 13 Ch04 |
| Runbook: Tasks 1–8 | Ch12 (W7) | Summarized only in Ch02's table; Ch01 uses Task 2's warning and the as-found shapes |
| Runbook: What Changes, in One Table | Ch02 "What changes for everyday tasks" | Columns condensed; KSI language dropped |
| Runbook: Cross-References | — | Internal references |
