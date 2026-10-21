# Verification — Chapter 08, Who Owns the Boundary

Writer: W4. Verified 2026-10-21. New chapter, following the pattern of Book 09 Ch09 and Book 07 Ch05. Built from the roles implied by the *Boundary Impact Model* (enforcement-responsibility dimension, ATO section) and *What Changed at FedRAMP* (§1, §4.2, §4.4, §6), plus NIST SP 800-37 Rev. 2 (PDF text extracted and read), the FedRAMP 2026 agency pages, Microsoft Learn (MCP tools) and the FedRAMP Marketplace `products.json` dataset (downloaded and parsed; `meta.last_change` 2026-10-21). The roles, matrix, three-party split, dimension owners and role map are the program's recommended model and carry no footnotes.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | FedRAMP certifies the offering; the agency AO accepts risk of the agency's use; agency "should never create a standalone authorization to operate for a cloud service offering" | Opening | verified | fedramp.gov/2026/agencies/use (c08-fedramp-use) |
| 2 | AO has primary responsibility for the authorization boundary (Task P-11); supporting roles CIO, system owner, mission owner, SAISO, enterprise architect; boundaries "determined by authorizing officials with input from the system owner" | Where the roles come from; AO role | verified | SP 800-37 Rev. 2, Task P-11 (c08-sp80037). Book 09's "system owner owns the boundary" is made more precise: AO decides, system owner keeps the record |
| 3 | Explicit acceptance of risk is the AO's and cannot be delegated | Where the roles come from | verified | SP 800-37 Task R-4 |
| 4 | AO approves POA&Ms and determines whether significant changes require reauthorization | Decision rights; AO role | verified | SP 800-37 Appendix D |
| 5 | AODR can do everything except the authorization decision and signature; AO is inherently governmental, government personnel only | Decision rights | verified | SP 800-37 Appendix D |
| 6 | System owner responsibilities: procurement through disposal; plans with system security officer; assembles and submits package | System owner role | verified | SP 800-37 Appendix D |
| 7 | ISSO maintains posture, principal advisor on controls, day-to-day operations | CISO/ISSO role | verified | SP 800-37 Appendix D ("System Security or Privacy Officer") |
| 8 | Agency must complete ATO process (AGU-USE-ABU), review secure configuration guides (AGU-USE-RSG), notify FedRAMP with ATO letter (AGU-AGC-NAA), GRC tools produce/ingest OSCAL and JSON (AGU-AGC-GRC) | Where the roles come from | verified | fedramp.gov/2026/agencies/rules/agency-use (c08-fedramp-agu) |
| 9 | Agency SSP "should only contain information that the agency is responsible for" | Where the roles come from | verified | fedramp.gov/2026/responsibilities/agencies (c08-fedramp-resp) |
| 10 | Shared responsibility matrix: data, configuration, identities customer in all models; physical layers Microsoft in cloud models; applications, network controls, client devices vary | Where the roles come from; three-party table | verified | MS Learn "Shared responsibility in the cloud" (c08-shared) |
| 11 | FedRAMP recommends designating a federal senior information security official to review Ongoing Certification Reports and attend Quarterly Reviews (SHOULD) | CISO role | verified | AGU-USE-DSO (c08-fedramp-agu) |
| 12 | Platform landing zone = management group hierarchy, centralized resources, workload landing zone distribution; most organizations one per Entra tenant; "the platform team remains responsible for subscription governance" | Platform team role | verified | MS Learn CAF landing zone and subscription vending (c08-caf-vending) |
| 13 | Only contracting officers can enter into, administer or terminate contracts | Decision rights | verified | FAR 1.602-1 (c08-far) |
| 14 | Marketplace: customers must purchase a GCC SKU to be covered by the GCC FedRAMP authorization | Acquisition role | verified | products.json, MSO365MT `fedramp_msg` (c08-fr-mso365) |
| 15 | Agencies must not require extra materials (AGU-AGC-NAR) or a specific certification type/path (AGU-AGC-TPP) without agency head or delegate determination and FedRAMP notice | Acquisition role; matrix comment | verified | c08-fedramp-agu |
| 16 | Agencies must avoid contract terms that prevent the provider meeting FedRAMP obligations | Acquisition role | verified | c08-fedramp-resp; also stated on the use page |
| 17 | SA-4 includes "allocation of responsibility or identification of parties responsible for information security, privacy, and supply chain risk management" | Acquisition role | verified | SP 800-53 Rev. 5, OSCAL 5.2.0 catalog (c08-sp80053) |
| 18 | When controls are implemented by external providers, the organization ensures needed information is made available by the provider | Cloud provider role | verified | SP 800-37 Task R-1 discussion |
| 19 | Agencies must collaborate with FedRAMP on package conflicts (AGU-USE-RCF) and notify FedRAMP of serious concerns in ongoing reports (AGU-USE-NFC) | FedRAMP role | verified | c08-fedramp-agu |
| 20 | "Do not copy and paste provider controls into the agency System Security Plan" | Three parties | verified | fedramp.gov/2026/agencies/use/packages/rev5 (c08-fedramp-rev5) |
| 21 | USDA Connect package access request signed by AO; .gov/.mil address; trust-center providers must offer certification data via APIs | Roles in each system | verified | fedramp.gov/2026/agencies/use/packages (c08-fedramp-packages) |
| 22 | Four impact dimensions and drift classes | Dimension owners | restated-as-design | Program's Boundary Impact Model and drift taxonomy (linked by GitHub URL) |
| 23 | Owner per dimension; matrix; three-party split between platform and workload teams; role map | Throughout | restated-as-design | Program model |
| 24 | A certification class or second listing isn't a commitment that excluded features arrive | Sponsor role | verified (by reference) | Chapter 04 and Chapter 09 own it (MSO365MTA; admin-center network connectivity also unavailable in GCC High) |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| *Boundary Impact Model* — "What the model captures" (enforcement responsibility changes) | "Where the roles come from" (fourth source); "An owner for each impact dimension" | Full model is Chapter 02's |
| *Boundary Impact Model* — "The four impact dimensions" table | "An owner for each impact dimension" (owners and drift classes added) | — |
| *Boundary Impact Model* — invisible-boundary worked example | Not carried | Chapter 02 owns and corrects it |
| *Boundary Impact Model* — "How FMP compensates" | Pointers to Chapter 09 (probe owned by platform team) | Chapter 09 owns it |
| *Boundary Impact Model* — "Why this is an architectural concern" | Not carried | Chapter 02 |
| *Boundary Impact Model* — "What this means for an ATO package" | System owner role (boundary record); Chapter 11 | Chapter 11 owns it |
| *What Changed at FedRAMP* — §1 (CR26; agency's boundary is the system that includes the CSO) | Opening paragraph (agency authorizes its own system) | Detail is Chapter 03's |
| *What Changed at FedRAMP* — §4.2 ExpressRoute exception | Matrix row (provider-side exception request) | Chapter 09 owns the detail |
| *What Changed at FedRAMP* — §4.4 buy the capability, not the badge | Acquisition role (pointer) | Chapter 09 owns it |
| *What Changed at FedRAMP* — §5 MSO365MT / MSO365MTA | Sponsor role (one sentence) | Chapters 04 and 09 own it |
| *What Changed at FedRAMP* — other sections (§2, §3, §6, §7) | Not carried here | Chapters 03, 04, 09, 11 and Appendix A |
| Book 09 Ch09 / Book 07 Ch05 pattern (roles, matrix, role map, "what changes" table) | Whole chapter structure | — |
