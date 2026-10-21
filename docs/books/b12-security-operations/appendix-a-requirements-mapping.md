---
title: "Appendix A — Requirements Mapping: Controls, Mandates and Books"
description: "A compliance-enabling map, not a compliance claim: the NIST SP 800-53 Rev. 5 controls security operations asserts (AU, CA-7, CM-6/7/8, RA-5, SI-2/3/4, IR-4/5, SC-7), with their NIST and FedRAMP baselines, and the mandates behind them (OMB M-26-14, BOD 26-04 and the KEV catalog, BOD 23-01, BOD 25-01, TIC 3.0, CISA incident notification, FedRAMP's 2026 rules, NIST's RMF and continuous monitoring guidance), each mapped to the Book 12 chapter that carries it and to the other workbook books; then the requirements that are cited but don't say what is claimed, and the sources."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b12-security-operations
book: B12
part: Appendix
series-order: 90
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix A — Requirements Mapping: Controls, Mandates and Books

*A control says what an assessor will look for, a mandate says when, and neither says who; a map is useful only if it keeps all three apart.*

::: {.callout-note}
## In this appendix
The NIST SP 800-53 Rev. 5 controls that security operations asserts, with their titles, what each asks, their baselines in NIST SP 800-53B and in FedRAMP's 2026 Rev5 classes, the Book 12 chapter that carries each and the other workbook books that close part of it. Then the federal mandates: OMB M-26-14, BOD 26-04 and the KEV catalog, BOD 23-01, BOD 25-01, TIC 3.0, CISA's incident notification guidelines, FedRAMP's Consolidated Rules for 2026 and NIST's RMF and continuous monitoring guidance. Then the requirements that are often cited for this book's subject but don't say what is claimed, and the source list.
:::

::: {.callout-important}
## Compliance-enabling, not a compliance claim
This appendix helps an agency reuse the workbook's design and evidence in its own Agency Logging Plan, continuous monitoring strategy and system security plans. It doesn't claim that following the workbook satisfies any requirement or control. Control selection, implementation statements and assessment belong to the agency and its assessors, and the authorizing official alone accepts residual risk. Requirement wording is summarized; the cited documents govern. Every source in this appendix was checked on October 21, 2026.
:::

## How to read the tables

- **Baselines** gives two values. The first is the NIST SP 800-53B baseline that includes the control (L, M, H, or none), checked against NIST's OSCAL baseline profiles.[^aA-53b] The second is the FedRAMP 2026 Rev5 classes whose baselines include it (B, C, D, or none), from FedRAMP's control reference; [Book 10](../b10-cloud-boundary/index.md) records Microsoft 365 GCC's certification as Class C, Moderate.[^aA-fedramp-controls] The agency's own systems use the baseline its categorization selects.
- **Carried in** names the Book 12 chapters that design or evidence the control.
- **Other books** names the workbook books that build part of it. Planned books without pages yet are named and linked to the [workbook index](../index.md).
- Control identifiers and titles are from SP 800-53 Rev. 5, release 5.2.0, checked against the OSCAL catalog and the CSRC publication page.[^aA-53]

## NIST SP 800-53 Rev. 5 controls

### Audit and Accountability (AU)

| Control | Title | What it asks, in short | Baselines | Carried in | Other books |
|---|---|---|---|---|---|
| AU-2 | Event Logging | Identify the event types the system can log, coordinate with others who need audit information, select the event types to log with a rationale, and review the selection at a defined frequency | L M H; B C D | [Ch 02](02-the-evidence-contract.md), [03](03-identity-telemetry.md), [04](04-platform-and-m365-telemetry.md), [10](10-who-runs-security-operations.md) | [Book 02](../b02-identity/index.md), [Book 05](../b05-devices/10-operating-and-evidencing-the-fleet.md), [Book 08](../b08-ddi/11-operating-the-control-plane.md) |
| AU-3 | Content of Audit Records | Records establish what happened, when, where, the source, the outcome and the identity involved | L M H; B C D | [Ch 02](02-the-evidence-contract.md) | [Book 01, Chapter 11](../b01-transformation-arc/11-analysis-plan-delivery.md) |
| AU-3(1) | Additional Audit Information | Generate defined additional information in audit records | M H; C D | [Ch 02](02-the-evidence-contract.md), [03](03-identity-telemetry.md) | — |
| AU-4 | Audit Log Storage Capacity | Allocate storage capacity to accommodate retention requirements | L M H; B C D | [Ch 04](04-platform-and-m365-telemetry.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | — |
| AU-5 | Response to Audit Logging Process Failures | Alert defined people within a defined time when logging fails, and take defined actions | L M H; B C D | [Ch 05](05-from-log-warehouse-to-detection.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | — |
| AU-6 | Audit Record Review, Analysis, and Reporting | Review and analyze records at a defined frequency for unusual activity, report findings, adjust review when risk changes | L M H; B C D | [Ch 05](05-from-log-warehouse-to-detection.md), [10](10-who-runs-security-operations.md), [11](11-detection-engineering-and-response.md) | [Book 06, R09](../b06-data-platform/r09-continuous-monitoring-and-closure.md) |
| AU-6(1) | Automated Process Integration | Integrate review, analysis and reporting with automated mechanisms | M H; C D | [Ch 05](05-from-log-warehouse-to-detection.md), [11](11-detection-engineering-and-response.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | — |
| AU-6(3) | Correlate Audit Record Repositories | Analyze and correlate records across repositories for organization-wide awareness | M H; C D | [Ch 02](02-the-evidence-contract.md), [05](05-from-log-warehouse-to-detection.md) | [Book 08](../b08-ddi/index.md) for the naming plane |
| AU-6(4) | Central Review and Analysis | Centrally review and analyze records from multiple components | none; D | [Ch 05](05-from-log-warehouse-to-detection.md) | — |
| AU-6(5) | Integrated Analysis of Audit Records | Integrate audit analysis with vulnerability scanning, performance and monitoring information | H; D | [Ch 02](02-the-evidence-contract.md), [06](06-vulnerability-management.md) | — |
| AU-7 | Audit Record Reduction and Report Generation | Provide on-demand review, analysis and reporting without altering original records | M H; C D | [Ch 05](05-from-log-warehouse-to-detection.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | — |
| AU-8 | Time Stamps | Use internal clocks for timestamps that meet a defined granularity and use UTC or a fixed or recorded offset | L M H; B C D | [Ch 02](02-the-evidence-contract.md), [05](05-from-log-warehouse-to-detection.md) | [Book 08](../b08-ddi/index.md) for time services |
| AU-9 | Protection of Audit Information | Protect audit information and tools from unauthorized access, modification and deletion, and alert defined roles when that is detected | L M H; B C D | [Ch 10](10-who-runs-security-operations.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | — |
| AU-10 | Non-repudiation | Provide irrefutable evidence that an individual performed defined actions | H; D | [Ch 09](09-data-protection-and-classification.md) | [Book 07](../b07-pki/index.md) |
| AU-11 | Audit Record Retention | Retain records for a defined period for investigations and retention requirements | L M H; B C D | [Ch 05](05-from-log-warehouse-to-detection.md) (in part), [10](10-who-runs-security-operations.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | [Book 01, Chapter 09](../b01-transformation-arc/09-who-leads-the-transformation.md#records-management-and-privacy) |
| AU-12 | Audit Record Generation | Generate the selected records on defined components, with defined people able to select what is logged | L M H; B C D | [Ch 03](03-identity-telemetry.md), [04](04-platform-and-m365-telemetry.md) | [Book 05](../b05-devices/index.md), [Book 09](../b09-network/index.md) |
| AU-12(1) | System-wide and Time-correlated Audit Trail | Compile records into a system-wide trail time-correlated to a defined tolerance | H; D | [Ch 02](02-the-evidence-contract.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | [Book 10, Chapter 06](../b10-cloud-boundary/06-ipam-and-network-as-code.md) for the join key |

### Assessment, Authorization, and Monitoring (CA) and Program Management (PM)

| Control | Title | What it asks, in short | Baselines | Carried in | Other books |
|---|---|---|---|---|---|
| CA-2 | Control Assessments | Plan and conduct assessments of control effectiveness and report results | L M H; B C D | [Ch 11](11-detection-engineering-and-response.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | [Book 11](../b11-zero-trust/index.md) |
| CA-5 | Plan of Action and Milestones | Document planned remediation of weaknesses; update from assessments, audits and continuous monitoring | L M H; not listed in FedRAMP's 2026 Rev5 control reference[^aA-fedramp-controls] | [Ch 10](10-who-runs-security-operations.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | [Book 10, Chapter 11](../b10-cloud-boundary/11-the-authorization-package.md), [Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md) |
| CA-7 | Continuous Monitoring | A system-level strategy with metrics, frequencies, ongoing assessment and monitoring, correlation, response actions and status reporting | L M H; B C D | [Ch 12](12-evidence-metrics-and-continuous-monitoring.md) | [Book 05, Chapter 10](../b05-devices/10-operating-and-evidencing-the-fleet.md), [Book 06, R09](../b06-data-platform/r09-continuous-monitoring-and-closure.md), [Book 11](../b11-zero-trust/index.md) |
| CA-7(1) | Independent Assessment | Use independent assessors for ongoing monitoring | M H; C D | [Ch 10](10-who-runs-security-operations.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | — |
| CA-7(3) | Trend Analyses | Use trend analysis to decide whether controls or monitoring need to change | none; none | [Ch 11](11-detection-engineering-and-response.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | — |
| CA-7(4) | Risk Monitoring | Include effectiveness, compliance and change monitoring in the strategy | L M H; B C D | [Ch 12](12-evidence-metrics-and-continuous-monitoring.md) | [Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md) for drift |
| PM-31 | Continuous Monitoring Strategy | The organization-wide strategy, with metrics, frequencies, correlation, response and reporting | none (program management); none | [Ch 10](10-who-runs-security-operations.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | — |
| RA-7 | Risk Response | Respond to findings from assessments, monitoring and audits in line with risk tolerance | L M H; B C D | [Ch 10](10-who-runs-security-operations.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | [Book 00, Chapter 07](../b00-orientation/07-who-runs-the-program.md) |

### Configuration Management (CM)

| Control | Title | What it asks, in short | Baselines | Carried in | Other books |
|---|---|---|---|---|---|
| CM-2 | Baseline Configuration | Develop, document and maintain a current baseline configuration | L M H; B C D | [Ch 07](07-patch-configuration-and-baselines.md) | [Book 05](../b05-devices/index.md) |
| CM-6 | Configuration Settings | Establish restrictive settings from common secure configurations, implement them, approve deviations, monitor changes | L M H; B C D | [Ch 07](07-patch-configuration-and-baselines.md), [08](08-cloud-native-posture.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | [Book 05](../b05-devices/index.md), [Book 11](../b11-zero-trust/index.md) for SCuBA |
| CM-7 | Least Functionality | Configure only essential capabilities; prohibit or restrict the rest | L M H; B C D | [Ch 07](07-patch-configuration-and-baselines.md), [08](08-cloud-native-posture.md) | [Book 05](../b05-devices/index.md), [Book 11](../b11-zero-trust/index.md) |
| CM-8 | System Component Inventory | An accurate, complete inventory without duplicate accounting, reviewed at a defined frequency | L M H; B C D | [Ch 02](02-the-evidence-contract.md), [06](06-vulnerability-management.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | [Book 08](../b08-ddi/index.md), [Book 10, Chapter 06](../b10-cloud-boundary/06-ipam-and-network-as-code.md) |

### Risk Assessment (RA) and System and Information Integrity (SI)

| Control | Title | What it asks, in short | Baselines | Carried in | Other books |
|---|---|---|---|---|---|
| RA-5 | Vulnerability Monitoring and Scanning | Scan at a defined frequency and when new vulnerabilities are reported, analyze results, remediate within defined response times | L M H; B C D | [Ch 06](06-vulnerability-management.md) | [Book 05](../b05-devices/index.md) |
| RA-5(2) | Update Vulnerabilities to Be Scanned | Update the vulnerabilities scanned at a defined frequency, before a new scan or when new ones are identified | L M H; B C D | [Ch 06](06-vulnerability-management.md) | — |
| RA-5(5) | Privileged Access | Implement privileged access authorization to defined components for defined scanning activities | M H; C D | [Ch 06](06-vulnerability-management.md) | [Book 04](../b04-access/index.md) |
| SI-2 | Flaw Remediation | Identify, report and correct flaws; test updates; install security updates within a defined period; fold remediation into configuration management | L M H; B C D | [Ch 06](06-vulnerability-management.md), [07](07-patch-configuration-and-baselines.md) | [Book 05](../b05-devices/index.md) |
| SI-2(2) | Automated Flaw Remediation Status | Determine whether components have applicable security updates installed, with automated mechanisms | M H; C D | [Ch 07](07-patch-configuration-and-baselines.md) | — |
| SI-2(3) | Time to Remediate Flaws and Benchmarks for Corrective Actions | Measure time from identification to remediation; set benchmarks | none; C D | [Ch 06](06-vulnerability-management.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | — |
| SI-3 | Malicious Code Protection | Signature- or non-signature-based malicious code protection at entry and exit points, updated and configured to respond | L M H; B C D | [Ch 05](05-from-log-warehouse-to-detection.md), [08](08-cloud-native-posture.md) | [Book 05](../b05-devices/index.md) |
| SI-4 | System Monitoring | Monitor for attacks and unauthorized connections, analyze detected events, adjust with risk, obtain legal opinion, provide monitoring information to defined roles | L M H; B C D | [Ch 05](05-from-log-warehouse-to-detection.md), [10](10-who-runs-security-operations.md), [11](11-detection-engineering-and-response.md) | [Book 09](../b09-network/index.md) |
| SI-4(2) | Automated Tools and Mechanisms for Real-time Analysis | Automated tools for near real-time event analysis | M H; C D | [Ch 05](05-from-log-warehouse-to-detection.md) | — |
| SI-4(4) | Inbound and Outbound Communications Traffic | Monitor inbound and outbound traffic for unusual or unauthorized activity | M H; C D | [Ch 05](05-from-log-warehouse-to-detection.md) | [Book 08](../b08-ddi/index.md), [Book 09](../b09-network/index.md) |
| SI-4(5) | System-generated Alerts | Alert defined people when defined indications of compromise occur | M H; C D | [Ch 11](11-detection-engineering-and-response.md) | — |
| SI-4(16) | Correlate Monitoring Information | Correlate information from monitoring tools across the system | none; C D | [Ch 02](02-the-evidence-contract.md), [05](05-from-log-warehouse-to-detection.md) | — |
| SI-5 | Security Alerts, Advisories, and Directives | Receive, generate and disseminate alerts and directives; implement directives within their time frames or notify the issuer of noncompliance | L M H; B C D | [Ch 06](06-vulnerability-management.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | — |

### Incident Response (IR) and System and Communications Protection (SC)

| Control | Title | What it asks, in short | Baselines | Carried in | Other books |
|---|---|---|---|---|---|
| IR-4 | Incident Handling | A handling capability covering preparation, detection and analysis, containment, eradication and recovery; lessons learned; consistent rigor | L M H; B C D | [Ch 10](10-who-runs-security-operations.md), [11](11-detection-engineering-and-response.md) | — |
| IR-4(1) | Automated Incident Handling Processes | Support handling with automated mechanisms | M H; C D | [Ch 11](11-detection-engineering-and-response.md) | — |
| IR-5 | Incident Monitoring | Track and document incidents | L M H; B C D | [Ch 11](11-detection-engineering-and-response.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | — |
| IR-6 | Incident Reporting | Personnel report suspected incidents within a defined time; report incident information to defined authorities | L M H; B C D | [Ch 10](10-who-runs-security-operations.md), [11](11-detection-engineering-and-response.md) | — |
| IR-8 | Incident Response Plan | A plan that provides a roadmap, defines reportable incidents, provides metrics for the capability, explicitly designates responsibility, and is reviewed, distributed and protected | L M H; B C D | [Ch 10](10-who-runs-security-operations.md), [11](11-detection-engineering-and-response.md) | — |
| SC-7 | Boundary Protection | Monitor and control communications at external and key internal managed interfaces; separate public components; connect only through managed interfaces | L M H; B C D | [Ch 05](05-from-log-warehouse-to-detection.md) for boundary-device telemetry | [Book 09](../b09-network/index.md), [Book 10, Chapter 07](../b10-cloud-boundary/07-the-front-door.md) |

SC-7 is the one control in the list whose substance belongs to another book. Its telemetry, the logs boundary protection devices emit, is what Book 12 carries: SASE, firewall and DNS records landing in the SIEM and feeding SI-4(4) ([Chapter 05](05-from-log-warehouse-to-detection.md)). The boundary design is [Book 09](../b09-network/index.md)'s, and the cloud front door is [Book 10](../b10-cloud-boundary/index.md)'s.

## Federal mandates

| Mandate | What it asks | Carried in | Other books | Evidence |
|---|---|---|---|---|
| OMB M-26-14 (May 22, 2026), prioritization | Organize logging around continuous event monitoring and around threat hunting, investigation, response and forensics, for all systems owned or operated by or for the agency, including IoT and OT; rescinds M-21-31[^aA-m2614] | [Ch 01](01-you-cant-defend-what-you-cant-see.md), [10](10-who-runs-security-operations.md) | [Book 00, Chapter 01](../b00-orientation/01-why-modernize-now.md), [Book 02](../b02-identity/index.md), [Book 08](../b08-ddi/index.md) | The Agency Logging Plan |
| M-26-14, Agency Logging Plan | Submit to OMB and CISA within 90 days of CISA's Logging Reference Architecture; update it as needed[^aA-m2614] | [Ch 10](10-who-runs-security-operations.md) | [Book 11, Chapter 07](../b11-zero-trust/07-who-owns-zero-trust.md) for Zero Trust coverage | The plan, its owner and its revision history |
| M-26-14, Appendix B item 1 | Logs actively searchable for 6 months after creation and retrievable for 1 year; records schedules still apply[^aA-m2614] | [Ch 05](05-from-log-warehouse-to-detection.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | [Book 08](../b08-ddi/index.md) | Per-table retention export; tier assignments |
| M-26-14, Appendix B items 2–4 | Logs readily available to the top-level SOC; accurate timestamps from a traceable time source; CDM, HWAM and SWAM data used to confirm log coverage[^aA-m2614] | [Ch 02](02-the-evidence-contract.md), [10](10-who-runs-security-operations.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | [Book 08](../b08-ddi/index.md), [Book 09](../b09-network/index.md) | Collection coverage metric; time-source configuration |
| M-26-14, Appendix B item 5 | Logs supporting eleven activities, from the identity behind each operation to attack vectors, with automated alerts for all of them[^aA-m2614] | [Ch 03](03-identity-telemetry.md), [04](04-platform-and-m365-telemetry.md), [05](05-from-log-warehouse-to-detection.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | [Book 01, Chapter 03](../b01-transformation-arc/03-platform-foundation.md) | Detection coverage metric against items a–k |
| M-26-14, Appendix C | Maturity per system across inventory visibility, collection coverage, collection operations, data retention and log management, scored at the lowest watermark; Levels 1, 2 and 3 due 120, 180 and 320 days after the reference architecture[^aA-m2614] | [Ch 12](12-evidence-metrics-and-continuous-monitoring.md) | [Book 00, Chapter 01](../b00-orientation/01-why-modernize-now.md) for the dates | Percentage of systems at each level |
| M-26-14, log access | Provide logs to CISA and the FBI on request after a known or suspected compromise, in an agreed format and timeframe[^aA-m2614] | [Ch 10](10-who-runs-security-operations.md) | — | Documented procedure and its owner |
| CISA BOD 26-04 (June 10, 2026) | Revokes BOD 22-01 and BOD 19-02. Phase I: update vulnerability management policy, assign roles, monitor the KEV catalog, automate KEV status reporting through the CDM Dashboard or report manually every two weeks. Phase II (60 days): update processes for CVE and KEV data. Phase III (180 days): remediate within Table 1's timelines; tag internet-reachable assets[^aA-bod2604] | [Ch 06](06-vulnerability-management.md), [10](10-who-runs-security-operations.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | [Book 05](../b05-devices/index.md) | Policy and role assignment; KEV remediation-within-timeline metric; asset tags |
| CISA KEV catalog | Maintained under BOD 26-04 with unchanged inclusion criteria; each entry carries a due date and a forensic triage flag; JSON and CSV feeds[^aA-bod2604][^aA-kev] | [Ch 06](06-vulnerability-management.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | — | Daily cross-reference of findings to the catalog |
| CISA BOD 23-01 (October 3, 2022) | Automated asset discovery every 7 days; vulnerability enumeration of discovered assets every 14 days; results into the CDM Agency Dashboard within 72 hours[^aA-bod2301] | [Ch 01](01-you-cant-defend-what-you-cant-see.md), [06](06-vulnerability-management.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | [Book 08](../b08-ddi/index.md) | Discovery and enumeration cadence records; inventory coverage metric |
| CISA BOD 25-01 (December 17, 2024) | Implement mandatory SCuBA configurations for in-scope cloud tenants; deploy the assessment tools and report results, continuously or at least quarterly[^aA-bod2501-guide] | [Ch 12](12-evidence-metrics-and-continuous-monitoring.md) | [Book 11, Chapters 04](../b11-zero-trust/04-scuba-and-bod-25-01.md), [09](../b11-zero-trust/09-running-the-assessment.md), [10](../b11-zero-trust/10-evidence-not-verdicts.md) | Interval ScubaGear evidence; configuration conformance metric |
| TIC 3.0 Program Guidebook, v1.2 (September 2026) | Agencies are responsible for TIC capabilities (M-19-26); TIC doesn't replace telemetry requirements, including telemetry to CISA; automated, continuous validation through CDM replaces manual TIC Compliance Validation; TIC delegates represent the agency; cloud telemetry to CLAW per C-CIRA[^aA-tic] | [Ch 10](10-who-runs-security-operations.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | [Book 09, Chapter 03](../b09-network/03-what-tic-3-requires.md) | TIC delegate designation; CLAW telemetry route |
| CISA Federal Incident Notification Guidelines | Notify CISA within one hour of identification by the agency's top-level CSIRT, SOC or IT department; major-incident criteria from the most recent OMB guidance[^aA-notify] | [Ch 10](10-who-runs-security-operations.md), [11](11-detection-engineering-and-response.md) | — | Notification timestamps against identification |
| FedRAMP Consolidated Rules for 2026 | Mandatory January 1, 2027. 46 Key Security Indicators in ten themes bind cloud service providers; agencies must review each provider's Ongoing Certification Report, issued every 3 months; provider vulnerability timeframes are graded by potential agency impact[^aA-fedramp-ksi][^aA-fedramp-ccm][^aA-fedramp-vdr] | [Ch 12](12-evidence-metrics-and-continuous-monitoring.md) | [Book 10, Chapters 03](../b10-cloud-boundary/03-what-changed-at-fedramp.md) and [11](../b10-cloud-boundary/11-the-authorization-package.md) | Record of each OCR review against the agency's ATO |
| NARA GRS 3.2 | System access records kept 6 years after password change or account termination where special accountability applies; cybersecurity logging items 035 and 036 cite the rescinded M-21-31 and are under revision[^aA-grs32][^aA-grs-status] | [Ch 10](10-who-runs-security-operations.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | [Book 01, Chapter 09](../b01-transformation-arc/09-who-leads-the-transformation.md#records-management-and-privacy) | The records officer's disposition decision per log class |
| NIST SP 800-37 Rev. 2, Monitor step | Tasks M-1 to M-7 assign monitoring, ongoing assessment, risk response, package updates, posture reporting and ongoing authorization[^aA-sp80037] | [Ch 10](10-who-runs-security-operations.md), [12](12-evidence-metrics-and-continuous-monitoring.md) | [Book 01, Chapter 09](../b01-transformation-arc/09-who-leads-the-transformation.md) | Posture reports; ongoing authorization decisions |
| NIST SP 800-137 | Continuous monitoring as ongoing awareness to support risk decisions, with organization-defined metrics[^aA-sp800137] | [Ch 12](12-evidence-metrics-and-continuous-monitoring.md) | — | The continuous monitoring strategy |
| NIST SP 800-61 Rev. 3 (April 2025) | Incident response recommendations as a CSF 2.0 community profile; supersedes Rev. 2[^aA-sp80061] | [Ch 11](11-detection-engineering-and-response.md) | — | IR plan mapped to the CSF 2.0 functions |
| NIST SP 800-53A Rev. 5 | Assessment by examine, interview and test, with objects listed per control[^aA-sp80053a] | [Ch 12](12-evidence-metrics-and-continuous-monitoring.md) | Book 14, Federal Compliance & Authorization (planned, see the [workbook index](../index.md)) | The artifact list in Chapter 12 |

## Requirements that are cited but don't say what is claimed

The source volumes behind this book were drafted during a year of rescissions and new directives. These are the claims most worth checking before they reach a plan.

| Claimed requirement | What the record shows |
|---|---|
| BOD 22-01 requires agencies to remediate KEV entries by their catalog due dates | BOD 22-01 was revoked by BOD 26-04 on June 10, 2026, along with BOD 19-02. The KEV catalog continues under BOD 26-04, whose timelines depend on exposure, KEV status, automatability and technical impact.[^aA-bod2604] |
| A 14-day remediation tier for KEV vulnerabilities on internet-facing systems is "at least as tight as" the federal deadline | Under BOD 26-04, a KEV-listed vulnerability on a publicly exposed asset has 3 days in three of four cases and 14 days only when exploitation is neither automatable nor gives total control.[^aA-bod2604] A 14-day tier for all of them is looser than the directive. |
| M-26-14 sets 12 months of active storage plus 18 months of cold storage, in EL0–EL3 tiers | Those were M-21-31's figures and tiers. M-26-14 sets 6 months searchable and 1 year retrievable, and a five-level maturity model.[^aA-m2614] |
| AU-12(1), AU-6(4) and SI-4(16) close at the FedRAMP Moderate gate | In NIST SP 800-53B, AU-12(1) is High only and AU-6(4) and SI-4(16) are in no baseline. In FedRAMP's 2026 Rev5 reference, AU-12(1) and AU-6(4) are Class D only; SI-4(16) is Classes C and D.[^aA-53b][^aA-fedramp-controls] |
| FedRAMP 20x KSI automation queries an agency's Sentinel tables and fails a workspace with no enabled rules | FedRAMP's indicators state outcomes, such as a SIEM "used and persistently reviewed," and bind cloud service providers seeking certification. They specify no query and no agency pipeline.[^aA-fedramp-ksi] |
| The SOC is an RMF role with its own risk authority | SP 800-37 defines no SOC role; only the authorizing official accepts risk. M-26-14 names the top-level SOC as the place logs must be available, not as a decision maker.[^aA-sp80037][^aA-m2614] |
| A data lake or archive tier satisfies the 6-month "searchable" requirement for detection sources | M-26-14 defines searchable as usable for detections without preparation. Microsoft says logs ingested only into the Sentinel data lake tier don't generate alerts.[^aA-m2614][^aA-sentinel-tiers] The program keeps detection sources in the analytics tier ([Chapter 12](12-evidence-metrics-and-continuous-monitoring.md#retention-tiers-and-tamper-protected-copies)). |

## Sources

Every URL below was opened on October 21, 2026. Chapters cite product sources specific to their subject in their own footnotes; those are not repeated here unless a requirement depends on them.

### Primary sources: OMB, CISA and NARA

- OMB M-26-14, *Ensuring Effective and Efficient Agency Logging and Network Visibility to Defend Against Evolving Cyber Threats*, May 22, 2026. <https://www.whitehouse.gov/wp-content/uploads/2026/05/M-26-14-Ensuring-Effective-and-Efficient-Agency-Logging-and-Network-Visibility-to-Defend-Against-Evolving-Cyber-Threats.pdf>
- CISA BOD 26-04, *Prioritizing Security Updates Based on Risk*, June 10, 2026. <https://www.cisa.gov/news-events/directives/bod-26-04-prioritizing-security-updates-based-risk>
- CISA, Known Exploited Vulnerabilities Catalog. <https://www.cisa.gov/known-exploited-vulnerabilities-catalog>
- CISA BOD 23-01, *Improving Asset Visibility and Vulnerability Detection on Federal Networks*, October 3, 2022. <https://www.cisa.gov/news-events/directives/bod-23-01-improving-asset-visibility-and-vulnerability-detection-federal-networks>
- CISA, *BOD 25-01 Implementation Guidance: Implementing Secure Practices for Cloud Services*. <https://www.cisa.gov/news-events/directives/bod-25-01-implementation-guidance-implementing-secure-practices-cloud-services>
- CISA, *TIC 3.0 Core Guidance Volume 1: Program Guidebook*, Version 1.2, September 2026. <https://www.cisa.gov/sites/default/files/2026-09/TIC_3.0_Program_Guidebook_September_2026_47.pdf>
- CISA, "Federal Incident Notification Guidelines." <https://www.cisa.gov/federal-incident-notification-guidelines>
- NARA, General Records Schedule 3.2, Transmittal No. 33, January 2023. <https://www.archives.gov/files/records-mgmt/grs/grs03-2.pdf>; and "GRS Status Updates." <https://www.archives.gov/records-mgmt/grs/grs-status-updates>

### Primary sources: NIST

- SP 800-53 Rev. 5, release 5.2.0. <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>; OSCAL catalog <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json>
- SP 800-53B baselines, OSCAL profiles. <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5/json>
- SP 800-53A Rev. 5, January 2022. <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53Ar5.pdf>
- SP 800-37 Rev. 2, December 2018. <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-37r2.pdf>
- SP 800-137, September 2011. <https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-137.pdf>
- SP 800-61 Rev. 3, April 2025. <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r3.pdf>

### Primary sources: FedRAMP and Microsoft

- FedRAMP, Consolidated Rules for 2026: Key Security Indicators <https://www.fedramp.gov/2026/reference/key-security-indicators/>; Collaborative Continuous Monitoring <https://www.fedramp.gov/2026/reference/collaborative-continuous-monitoring/>; Vulnerability Detection and Response <https://www.fedramp.gov/2026/reference/vulnerability-detection-and-response/>; Full Rev5 Control Reference <https://www.fedramp.gov/2026/reference/controls/>; Important Dates <https://www.fedramp.gov/2026/timeline/>
- Microsoft Learn, "Manage data tiers and retention in Microsoft Sentinel." <https://learn.microsoft.com/azure/sentinel/manage-data-overview>

### Federal Compliance volumes (control-level depth)

- [Vol III Book 00 — Security Operations Overview](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_III_Book_00_Security_Operations_Overview.md)
- [Vol III Book 02 — Vulnerability Management](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_III_Book_02_Vulnerability_Management.md)
- [Vol III Book 03 — Patch and Systems Management](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_III_Book_03_Patch_Systems_Management.md)
- [Vol III Book 04 — Cloud-Native Posture](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_III_Book_04_Cloud_Native_Posture.md)
- [Vol III Book 05 — Data Protection (Purview)](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_III_Book_05_Data_Protection_Purview.md)
- [Vol III Book 06 — SIEM and XDR Detection](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_III_Book_06_SIEM_XDR_Detection.md)
- [Vol III Book 07 — Multi-Cloud Evidence Fabric](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_III_Book_07_Multi_Cloud_Evidence_Fabric.md)
- [Vol VI Book 07 — Evidence and ConMon Pipeline](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_VI_Book_07_Evidence_ConMon_Pipeline.md)

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 12 — Evidence, Metrics and Continuous Monitoring](12-evidence-metrics-and-continuous-monitoring.md) · [Book index](index.md)
:::

[^aA-53]: National Institute of Standards and Technology, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, release 5.2.0 (CSRC planning note of August 27, 2025), <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>; control identifiers, titles and statements checked against the OSCAL catalog (version 5.2.0, last modified May 11, 2026), <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (both accessed Oct 21, 2026).
[^aA-53b]: National Institute of Standards and Technology, SP 800-53B control baselines, OSCAL Low, Moderate and High baseline profiles, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5/json> (accessed Oct 21, 2026).
[^aA-fedramp-controls]: FedRAMP, "Full Rev5 Control Reference," *FedRAMP Consolidated Rules for 2026*, family pages for AU, CA, CM, IR, RA, SC and SI ("FedRAMP Rev5 Baselines" per control; CA-05 shows no class listing), <https://www.fedramp.gov/2026/reference/controls/> (accessed Oct 21, 2026).
[^aA-m2614]: Office of Management and Budget, M-26-14, *Ensuring Effective and Efficient Agency Logging and Network Visibility to Defend Against Evolving Cyber Threats*, May 22, 2026, "Prioritization," "Agency Logging Plan," "Measuring Maturity," "Log Access Requirements," "Agency Actions," and Appendices B and C, <https://www.whitehouse.gov/wp-content/uploads/2026/05/M-26-14-Ensuring-Effective-and-Efficient-Agency-Logging-and-Network-Visibility-to-Defend-Against-Evolving-Cyber-Threats.pdf> (accessed Oct 21, 2026).
[^aA-bod2604]: Cybersecurity and Infrastructure Security Agency, BOD 26-04, *Prioritizing Security Updates Based on Risk*, June 10, 2026, Background, Required Actions and Appendix A, Table 1: Remediation Timelines, <https://www.cisa.gov/news-events/directives/bod-26-04-prioritizing-security-updates-based-risk> (accessed Oct 21, 2026).
[^aA-kev]: Cybersecurity and Infrastructure Security Agency, "Known Exploited Vulnerabilities Catalog," <https://www.cisa.gov/known-exploited-vulnerabilities-catalog> (accessed Oct 21, 2026).
[^aA-bod2301]: Cybersecurity and Infrastructure Security Agency, BOD 23-01, *Improving Asset Visibility and Vulnerability Detection on Federal Networks*, October 3, 2022, Required Actions, <https://www.cisa.gov/news-events/directives/bod-23-01-improving-asset-visibility-and-vulnerability-detection-federal-networks> (accessed Oct 21, 2026).
[^aA-bod2501-guide]: Cybersecurity and Infrastructure Security Agency, *BOD 25-01 Implementation Guidance: Implementing Secure Practices for Cloud Services*, reporting options, <https://www.cisa.gov/news-events/directives/bod-25-01-implementation-guidance-implementing-secure-practices-cloud-services> (accessed Oct 21, 2026).
[^aA-tic]: Cybersecurity and Infrastructure Security Agency, *TIC 3.0 Core Guidance Volume 1: Program Guidebook*, Version 1.2, September 2026, §4, §9, §10, §11 and §13, <https://www.cisa.gov/sites/default/files/2026-09/TIC_3.0_Program_Guidebook_September_2026_47.pdf> (accessed Oct 21, 2026).
[^aA-notify]: Cybersecurity and Infrastructure Security Agency, "Federal Incident Notification Guidelines," effective April 1, 2017, <https://www.cisa.gov/federal-incident-notification-guidelines> (accessed Oct 21, 2026).
[^aA-fedramp-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/reference/key-security-indicators/>; and "Important Dates for the Consolidated Rules for 2026," <https://www.fedramp.gov/2026/timeline/> (both accessed Oct 21, 2026).
[^aA-fedramp-ccm]: FedRAMP, "Collaborative Continuous Monitoring," *FedRAMP Consolidated Rules for 2026*, CCM-AGM-ROR and the Ongoing Certification Report rule, <https://www.fedramp.gov/2026/reference/collaborative-continuous-monitoring/> (accessed Oct 21, 2026).
[^aA-fedramp-vdr]: FedRAMP, "Vulnerability Detection and Response," *FedRAMP Consolidated Rules for 2026*, VDR-TFR-PVR, <https://www.fedramp.gov/2026/reference/vulnerability-detection-and-response/> (accessed Oct 21, 2026).
[^aA-grs32]: National Archives and Records Administration, General Records Schedule 3.2, *Information Systems Security Records*, Transmittal No. 33, January 2023, items 030, 031, 035 and 036, <https://www.archives.gov/files/records-mgmt/grs/grs03-2.pdf> (accessed Oct 21, 2026).
[^aA-grs-status]: National Archives and Records Administration, "GRS Status Updates," GRS Transmittal 38 (GRS 3.2 items 035–036, Drafting, as of October 2026), <https://www.archives.gov/records-mgmt/grs/grs-status-updates> (accessed Oct 21, 2026).
[^aA-sp80037]: National Institute of Standards and Technology, SP 800-37 Rev. 2, December 2018, §3.7 (Monitor step) and Appendix D (Roles and Responsibilities), <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-37r2.pdf> (accessed Oct 21, 2026).
[^aA-sp800137]: National Institute of Standards and Technology, SP 800-137, *Information Security Continuous Monitoring (ISCM) for Federal Information Systems and Organizations*, September 2011, <https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-137.pdf> (accessed Oct 21, 2026).
[^aA-sp80061]: National Institute of Standards and Technology, SP 800-61 Rev. 3, *Incident Response Recommendations and Considerations for Cybersecurity Risk Management: A CSF 2.0 Community Profile*, April 2025, <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r3.pdf> (accessed Oct 21, 2026).
[^aA-sp80053a]: National Institute of Standards and Technology, SP 800-53A Rev. 5, *Assessing Security and Privacy Controls in Information Systems and Organizations*, January 2022, <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53Ar5.pdf> (accessed Oct 21, 2026).
[^aA-sentinel-tiers]: Microsoft Learn, "Manage data tiers and retention in Microsoft Sentinel," section "Compare the analytics and data lake tiers," <https://learn.microsoft.com/azure/sentinel/manage-data-overview>; and "Microsoft Sentinel data lake direct ingestion guidance," <https://learn.microsoft.com/azure/sentinel/datalake/sentinel-lake-log-ingestion-guidance> (both accessed Oct 21, 2026).
