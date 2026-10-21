# Verification — Chapter 10, Who Runs Security Operations

Writer W6. New chapter (no direct source page). Built on the pattern of Book 10 Chapter 08 and Book 11 Chapter 07, kept consistent with Book 01 Chapter 09's program-wide matrix and Book 00 Chapter 07's corrections (AO alone accepts risk; one decider per row; CISO decides logging and continuous-monitoring evidence; records officer decides retention before decommission). Role content incidentally drawn from Vol III Book 06 (IR contact list roles, the four-part incident record) and Vol VI Books 03, 04 and 08 (rule ownership, response ladder, telemetry-completeness harness). All sources opened October 21, 2026. Federal PDFs downloaded with curl (no identifying headers) and read with pdftotext; HTML pages read with WebFetch or curl; Microsoft claims checked with the Microsoft Learn MCP tools.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | AO is the only official who can accept risk; inherent government function; AODR can do all but sign the authorization decision | Where the roles come from; AO; separations | verified | SP 800-37r2 App. D |
| 2 | Monitor-step primary responsibilities: M-1 SO/CCP + SAISO + SAOP; M-2 control assessor; M-3 AO, SO, CCP; M-4 SO, CCP; M-5 SO, CCP, SAISO, SAOP; M-6 AO | Where the roles come from | verified | SP 800-37r2 §3.7 task headers |
| 3 | S-5 system-level ConMon strategy: SO and CCP primary | System owners role | verified | SP 800-37r2 Task S-5 |
| 4 | Conflicts of interest when one person holds several roles | Where the roles come from; separations | verified | SP 800-37r2 App. D fn. 113 |
| 5 | M-26-14: CEM and THIRF; CEM logs "typically ingested and monitored by a SOC" | Where the roles come from | verified | M-26-14 p. 2 |
| 6 | M-26-14: logs "must be readily available to the top-level agency SOC" | Same | verified | M-26-14 App. B item 2 |
| 7 | Agency Logging Plan within 90 days of LRA; logs to CISA/FBI on request after compromise | Same; CISO role | verified | M-26-14 pp. 3 |
| 8 | Logging Plan describes operational steps for CEM/THIRF considering threat environment, risk profile, mission | CISO role | verified | M-26-14 "Agency Logging Plan" |
| 9 | CISA: notify within one hour of identification by top-level CSIRT; major-incident criteria from most recent OMB guidance | Where the roles come from; SOC; matrix comment | verified | CISA Federal Incident Notification Guidelines (effective April 1, 2017) |
| 10 | BOD 26-04 issued June 10, 2026; revokes BOD 22-01 and BOD 19-02; policies must "assign roles and responsibilities" and set tracking/validation | Where the roles come from | verified | BOD 26-04 web text |
| 11 | TIC: M-19-26 shifted responsibility for TIC capabilities to the agency, replacing TCV; agencies maintain responsibility for use cases/overlays | Where the roles come from | verified | TIC 3.0 Guidebook v1.2 §9 |
| 12 | TIC delegates: primary point of contact; represent agency, coordinate CIO/CISO/risk views; liaison CIO office–CISA; understand network, email, security, cloud architecture | Where the roles come from; security engineering | verified | TIC 3.0 Guidebook v1.2 §11 |
| 13 | TIC delegate sits in security engineering | Security engineering | restated-as-design | — |
| 14 | SP 800-37 has no SOC role; common control provider definition (implement, assess, monitor inherited controls; qualified assessors; POA&Ms for deficient controls) | The SOC is a CCP | verified | SP 800-37r2 App. D (searched: no "security operations center" role) |
| 15 | SOC treated as common control provider | Same | restated-as-design | — |
| 16 | AU-6: review "for indications of" defined activity, report to defined personnel | Same | verified | SP 800-53r5 AU-6, OSCAL 5.2.0 |
| 17 | CIO designates SAISO, maintains policy, oversees personnel, reports to agency head; with AOs allocates resources | CIO role | verified | SP 800-37r2 App. D |
| 18 | SAISO carries out CIO's FISMA security responsibilities; liaison to AOs, SOs, CCPs, SSOs | CISO role | verified | SP 800-37r2 App. D |
| 19 | AO approves POA&Ms | AO role | verified | SP 800-37r2 App. D |
| 20 | System owner responsible for procurement through disposal and security/privacy plans | System owners | verified | SP 800-37r2 App. D |
| 21 | SSO maintains posture, principal advisor, often day-to-day operations, may include incident handling; manages changes and assesses impact | System owners/ISSOs | verified | SP 800-37r2 App. D |
| 22 | M-26-14 minimums don't relieve records schedule obligations | Records role; retention | verified | M-26-14 App. B item 1 note |
| 23 | GRS 3.2 items 030/031: special accountability systems kept 6 years after password altered or account terminated; includes log-in and audit trail files | Records role | verified | GRS 3.2 Transmittal 33 |
| 24 | GRS 3.2 items 035 (PCAP) and 036 (cybersecurity event logs) cite M-21-31 | Records role | verified | GRS 3.2 Transmittal 33 |
| 25 | NARA: GRS 3.2 items 035–036 revision (M-21-31 rescission, M-26-14) in drafting, Transmittal 38, as of October 2026 | Records role | verified | NARA GRS Status Updates |
| 26 | M-26-14 directs LRA to include guidance that logs not capture/expose data in contravention of law | Privacy role | verified | M-26-14 App. A |
| 27 | SI-4 f: obtain legal opinion on monitoring | Counsel role | verified | SP 800-53r5 SI-4, OSCAL 5.2.0 |
| 28 | Assessor determines whether controls implemented correctly, operating as intended, producing desired outcome; independence set by AO | Assessors | verified | SP 800-37r2 App. D; Task M-2 |
| 29 | M-26-14 baseline event types incl. identity behind operations, privilege changes, infrastructure changes | Collection question | verified | M-26-14 App. B item 5 |
| 30 | Retention floor 6 months searchable, 1 year retrievable | Retention question | verified | M-26-14 App. B item 1 |
| 31 | Split of what/how/where; retention reduction needs records concurrence; acting playbooks need CISO approval; suppression time split | Three questions; matrix | restated-as-design | — |
| 32 | Sentinel built-in roles (Reader, Responder, Contributor, Playbook Operator; Logic App Contributor to create/edit playbooks); assign at resource group; cumulative | Roles in each system | verified | Learn "Roles and permissions in the Microsoft Sentinel platform" |
| 33 | Automation service account needs explicit permissions on playbook RG; then any automation rule can run any playbook there | Roles in each system | verified | Same, "Additional roles for specific tasks" |
| 34 | Sentinel unsupported in Azure portal after March 31, 2027 | Roles in each system | verified | Same, Important note |
| 35 | Retention change needs `tables/write`, e.g., Log Analytics Contributor | Roles in each system | verified | Learn "Manage data retention in a Log Analytics workspace" |
| 36 | AU-9 protects audit information and tools; alerting on unauthorized access/modification | Separations | verified | SP 800-53r5 AU-9, OSCAL 5.2.0 |
| 37 | Team-to-role mapping table | Roles in each system | restated-as-design | — |
| 38 | Matrix rows and comments | Responsibility matrix | restated-as-design (consistent with Book 01 Ch09, Book 00 Ch07, Book 10 Ch08, Book 11 Ch07) | — |

## Consistency check against Book 01 Ch09 and Book 00 Ch07

| Book 01 / Book 00 rule | This chapter |
|---|---|
| CISO decides control requirements including logging | CISO decides what each plane emits, security retention floor, Agency Logging Plan |
| AO alone accepts residual risk; "accepted" means accepted by the AO in writing | Telemetry gaps, missed remediation, no-end-date suppressions go to the AO |
| Records officer decides retention of AD-era logs before decommission | Records officer decides disposition and any shortening of retention |
| CISO decides on continuous monitoring evidence and drift findings | CISO owns organization-level security metrics and evidence standard; drift to AO stays per Book 11 Ch07 |
| One decider per row; deciding and doing are separate | Kept; no row has two D entries |
| AO is a government official outside the program office | Separation 5 |

## Carry-forward ledger

This chapter is new; the brief assigns it no source page. Material drawn from the source volumes is listed for completeness.

| Source page § | Went to | Or why not carried |
|---|---|---|
| Vol III Book 06, "Artifact 2 — Incident Response Contact List" (SOC escalation chain, system owner, ISSO, ISSM, CISO, legal, public affairs, CISA, FBI) | The roles (SOC, ISSO, CISO, counsel) | Contact-list mechanics belong to Chapter 11 (IR-8 artifacts) |
| Vol III Book 06, "The FedRAMP Assessor Evidence Standard" (four-part incident record) | Referenced via Chapter 05; evidence-owner section | Carried in full by Chapter 05 |
| Vol III Book 06, "CISA Reporting Threshold" (1-hour, M-24-04) | Notification row and comment, re-sourced to CISA's notification guidelines | M-24-04 attribution not used: the one-hour rule is in CISA's guidelines; major-incident criteria deferred to "most recent OMB guidance" as CISA does |
| Vol VI Book 03, rule library ownership | Ownership record for rules and playbooks | Rule shape belongs to Chapter 11 |
| Vol VI Book 04, response ladder (gated actions) | Acting-playbook row; gated actuation reference | Ladder detail belongs to Chapter 11 |
| Vol VI Book 08, telemetry-completeness harness | Separation 2; Chapter 12 metric | Harness KQL belongs to Chapters 05/12 |
| Vol III Book 07, "Realizations" (Sentinel/Splunk dual SIEM, ServiceNow hub) | Not carried | Vendor selection is agency-specific; the chapter is tool-neutral on SIEM count |
