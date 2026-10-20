---
title: "Appendix B — Security and Privacy Assessment"
description: "The data-flow security and privacy assessment for HR-driven identity: the Privacy Act disclosure basis and the PIA, attribute minimization, protecting every leg, service identities without secrets, least privilege, and what the logs may hold."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b03-hr-identity
book: B03
part: Appendix
series-order: 91
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix B — Security and Privacy Assessment

*Moving personnel data into a directory is a disclosure. Treat it like one.*

::: {.callout-note}
## In this appendix
The privacy basis for the feed. What to minimize. How each leg is protected. How the service authenticates and what it may never hold. What the logs may contain. The ISSO's review checklist.
:::

![Protecting the data flow: Core HCM sends only what identity decisions read, over TLS under a confirmed Privacy Act disclosure basis; the middleware authenticates without secrets and writes with least privilege; operational logs carry the person key and a payload hash, and full payloads go only to an access-controlled audit store.](../../images/diagrams/b03-hr-identity/svg/appb-data-flow-protection.svg){fig-alt="Left to right: an amber Core HCM box (system of records under the Privacy Act) connects with a line labelled TLS and disclosure basis to a blue middleware-in-boundary box (managed identity or certificate; no client secrets), which connects with a line labelled TLS and least privilege to a blue Entra ID and AD box (only the attributes a decision reads). Dashed lines from the middleware go to an operational logs box (person key and payload hash only) and a violet audit store box (full payloads, access-controlled, retained by schedule)."}

## The privacy basis

- **Disclosure basis.** The HR system of record is a Privacy Act system of records. For general personnel records the governing notice is OPM's government-wide system-of-records notice (SORN), OPM/GOVT-1, which places records on current employees with the employing agency; the agency's own SORNs cover the rest.[^aB-govt1][^aB-a108] Sharing the records with the identity platform inside the agency that maintains them normally rests on the Privacy Act's need-to-know condition: disclosure to the agency's own officers and employees who need the record in the performance of their duties.[^aB-privacy-act] A routine use is a disclosure outside the agency that maintains the records, such as to a shared-service provider or another agency, and must be published in the governing SORN.[^aB-privacy-act][^aB-a108] Which basis covers each leg of the feed is the privacy office's determination; get it in writing before any attribute flows.
- **SORN scope.** Copying personnel attributes into the directory can be a SORN change in its own right. OMB Circular A-108 lists a change that substantially increases access to a system's information within the agency, and a new or expanded routine use, among the significant changes that require a revised notice.[^aB-a108] In Entra ID every member user can, by default, enumerate users and read their public properties,[^aB-default-perms] which is one more reason to minimize.
- **Privacy impact assessment.** Update the PIA for the new flow: what moves, where it lands, who can read it, how long it is kept, and which downstream services consume it. The E-Government Act's PIA requirement, as OMB M-03-22 implements it, is written for information about members of the public; M-03-22 exempts systems that hold only information about government personnel and contractors but encourages PIAs for them.[^aB-m0322] OMB Circular A-130 directs PIAs when IT processes PII, absent a statutory exception, and SP 800-53 control RA-8, which is in the privacy baseline applied to every system regardless of impact level, calls for one before developing or procuring IT that processes PII.[^aB-a130][^aB-sp80053][^aB-sp80053b] The program treats the update as required.
- **Interconnection terms.** Where the HR platform is operated by another agency or a provider, the data-exchange terms cover the identity feed explicitly, documented as an information exchange agreement under SP 800-53 control CA-3 and NIST SP 800-47 Rev. 1.[^aB-sp80053][^aB-sp80047]

## Minimization

- Send only the attributes an identity decision reads (Chapter 06). If no rule, workflow or required directory field reads it, it doesn't move. This is A-130's minimization principle and SP 800-53 control SI-12(1), Limit Personally Identifiable Information Elements, applied to the feed.[^aB-a130][^aB-sp80053]
- Prefer codes to narrative: an organization code, not a reorganization memo; a worker-type code, not an appointment description.
- The SSN never moves. The layered identifiers of Chapter 04 exist so that correlation never needs it, in line with A-130's direction to eliminate unnecessary use of Social Security numbers and explore alternatives to them as identifiers.[^aB-a130]
- Writeback to HR, if used, carries only identity-platform values such as work email — never an HR-mastered fact.

## Protecting every leg

| Leg | Protection |
|---|---|
| Core HCM to middleware | TLS; the platform's own authentication; the extract or feed scoped to covered populations |
| Middleware at rest | In the agency's authorization boundary; no PII on workstations, in source repositories or in off-boundary backups |
| Middleware to Entra ID | TLS 1.2 or later to Microsoft Graph, which Entra ID requires;[^aB-tls] a dedicated provisioning app per source |
| Provisioning agent to Active Directory | Outbound-only agent on hardened servers (no inbound firewall ports);[^aB-agent] a group managed service account with rights scoped to the target OUs |
| Logs and evidence | Operational logs hold the person key and a payload hash, the kind of limit SP 800-53 control AU-3(3) sets on PII in audit records;[^aB-sp80053] full payloads go only to an access-controlled audit store, retained by schedule |

: Protecting each leg of the flow {.striped .hover}

## Service identity and privilege

- **No client secrets.** The middleware authenticates with a managed identity (where it runs on Azure resources) or a certificate on its service principal, with rotation owned and scheduled. Microsoft's setup guide uses a client secret in its walkthrough but recommends certificate authentication or managed identities for production.[^aB-grant-access]
- **Least privilege.** Grant only the provisioning upload permission and provisioning-log read (Chapter 05).[^aB-grant-access] The service never holds tenant-wide user or directory write permissions, and it never deletes users: the `/bulkUpload` endpoint doesn't support deletion, and Microsoft points disposal to the Lifecycle Workflows delete-user task in the post-separation workflow.[^aB-api-faqs]
- **Conditional Access** applies to the service principal where supported: block token requests from outside expected locations, and alert on use from anywhere else. Conditional Access for workload identities needs Workload Identities Premium licenses, covers only single-tenant service principals registered in the tenant, offers only a block grant, and doesn't cover managed identities; a managed identity is governed through access reviews and the alerting instead.[^aB-ca-workload]
- **Quarterly review** of the service principal's permissions and credentials, recorded as evidence (SP 800-53 control AC-6(7), Review of User Privileges).[^aB-sp80053]

## A pause switch

Mis-provisioning at scale — a bad mapping, a reorganization file loaded twice — can disable or re-scope thousands of accounts in one cycle. Keep a documented pause: stop the provisioning job, quarantine the batch, and resume only after review. Pausing a job through Microsoft Graph takes a permission the upload client doesn't hold, so the pause belongs to an operator role, not to the middleware.[^aB-pause] Detect it, too: a delta far larger than normal for a cycle is held for confirmation before it applies. On the Entra side, accidental deletions prevention quarantines the provisioning job when a cycle's disables and deletions exceed a set threshold;[^aB-accidental][^aB-api-faqs] the middleware's own large-delta check covers mass re-scoping, which that threshold doesn't count.

## ISSO review checklist

- Disclosure basis confirmed (and any routine use it depends on); SORN coverage checked; PIA updated; interconnection terms cover the feed.
- Attribute set minimized and documented against the crosswalk.
- Every leg encrypted; PII absent from operational logs, repositories and workstations.
- Service identities secretless, least-privileged and reviewed.
- Pause and large-delta controls tested.
- Evidence of all of the above retained with the phase-gate record (Chapter 12).

::: {.callout-tip}
## Continue the book
[← Previous: Appendix A — Lifecycle Rules](appendix-a-lifecycle-rules.md) · [Book index](index.md) · [Next: Appendix C — Acceptance and Cutover →](appendix-c-acceptance-and-cutover.md)
:::

[^aB-govt1]: U.S. Office of Personnel Management, "Privacy Act of 1974; System of Records" (notice of a modified system of records, OPM/GOVT-1, General Personnel Records; records on current employees are located within the employing agency), *Federal Register*, August 17, 2023, Docket OPM-2023-0024, <https://www.govinfo.gov/content/pkg/FR-2023-08-17/html/2023-17651.htm> (accessed Oct 20, 2026).
[^aB-privacy-act]: Privacy Act of 1974, 5 U.S.C. § 552a(a)(7), (b)(1) and (b)(3), <https://www.law.cornell.edu/uscode/text/5/552a> (accessed Oct 20, 2026).
[^aB-a108]: Office of Management and Budget, Circular A-108, *Federal Agency Responsibilities for Review, Reporting, and Publication under the Privacy Act*, 2016 (§6.b, significant changes; §6.i, government-wide systems of records; §6.k, routine uses as disclosures outside the agency maintaining the system), <https://www.whitehouse.gov/wp-content/uploads/legacy_drupal_files/omb/circulars/A108/omb_circular_a-108.pdf> (accessed Oct 20, 2026).
[^aB-default-perms]: Microsoft Learn, "What are the default user permissions in Microsoft Entra ID?" (member users can enumerate all users and read all public properties of users), <https://learn.microsoft.com/en-us/entra/fundamentals/users-default-permissions> (accessed Oct 20, 2026).
[^aB-m0322]: Office of Management and Budget, M-03-22, *OMB Guidance for Implementing the Privacy Provisions of the E-Government Act of 2002*, September 26, 2003 (§II.B, when to conduct and update a PIA, and the note on systems about government personnel), <https://georgewbush-whitehouse.archives.gov/omb/memoranda/m03-22.html> (accessed Oct 20, 2026).
[^aB-a130]: Office of Management and Budget, Circular A-130, *Managing Information as a Strategic Resource*, July 28, 2016 (§5.f.1, privacy, including reducing the use of Social Security numbers; Appendix II, §3, Fair Information Practice Principles, Minimization; Appendix II, §5.e, Privacy Impact Assessments), <https://www.whitehouse.gov/wp-content/uploads/legacy_drupal_files/omb/circulars/A130/a130revised.pdf> (accessed Oct 20, 2026).
[^aB-sp80053]: NIST, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, September 2020, Release 5.2.0 of August 27, 2025 (controls AC-6(7), AU-3(3), CA-3, RA-8, SI-12(1)), <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final> (accessed Oct 20, 2026).
[^aB-sp80053b]: NIST, SP 800-53B, *Control Baselines for Information Systems and Organizations*, September 2020 (the privacy baseline, applied irrespective of impact level), <https://csrc.nist.gov/pubs/sp/800/53/b/upd1/final> (accessed Oct 20, 2026).
[^aB-sp80047]: NIST, SP 800-47 Rev. 1, *Managing the Security of Information Exchanges*, July 2021, <https://csrc.nist.gov/pubs/sp/800/47/r1/final> (accessed Oct 20, 2026).
[^aB-tls]: Microsoft Learn, "Enable TLS 1.2 support in your environment for Microsoft Entra" (TLS 1.0, TLS 1.1 and 3DES deprecated; completed for U.S. government instances March 31, 2021 and public instances January 31, 2022), <https://learn.microsoft.com/en-us/troubleshoot/entra/entra-id/ad-dmn-services/enable-support-tls-environment> (accessed Oct 20, 2026).
[^aB-agent]: Microsoft Learn, "Microsoft Entra on-premises application identity provisioning architecture" (firewall requirements: the provisioning agents use only outbound connections), <https://learn.microsoft.com/en-us/entra/identity/app-provisioning/on-premises-application-provisioning-architecture> (accessed Oct 20, 2026).
[^aB-grant-access]: Microsoft Learn, "Grant access to the inbound provisioning API" (service principal or managed identity; `SynchronizationData-User.Upload` and `ProvisioningLog.Read.All`; certificate authentication or managed identities recommended for production), <https://learn.microsoft.com/en-us/entra/identity/app-provisioning/inbound-provisioning-api-grant-access> (accessed Oct 20, 2026).
[^aB-api-faqs]: Microsoft Learn, "Frequently asked questions about API-driven inbound provisioning" (deletion not supported by `/bulkUpload`; preventing accidental disabling and deletion), <https://learn.microsoft.com/en-us/entra/identity/app-provisioning/inbound-provisioning-api-faqs> (accessed Oct 20, 2026).
[^aB-ca-workload]: Microsoft Learn, "Conditional Access for workload identities," <https://learn.microsoft.com/en-us/entra/identity/conditional-access/workload-identity> (accessed Oct 20, 2026).
[^aB-pause]: Microsoft Learn, "synchronizationJob: pause" (Microsoft Graph v1.0; application permissions `Application.ReadWrite.OwnedBy` or `Synchronization.ReadWrite.All`), <https://learn.microsoft.com/en-us/graph/api/synchronization-synchronizationjob-pause> (accessed Oct 20, 2026).
[^aB-accidental]: Microsoft Learn, "Enable accidental deletions prevention in the Microsoft Entra provisioning service" (threshold evaluated per cycle; counts disables as well as deletions; the job goes into quarantine), <https://learn.microsoft.com/en-us/entra/identity/app-provisioning/accidental-deletions> (accessed Oct 20, 2026).
