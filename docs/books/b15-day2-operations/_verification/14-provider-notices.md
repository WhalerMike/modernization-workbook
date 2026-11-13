# Verification — Chapter 14, Provider Notices in Day-Two Operations

New chapter, first pass of 2026-11-09, written after Release 2.0 for phase 2b of provider notices (owner approval of the capability: Nov 9, 2026). It is the operating model for the [Provider Notices implementation guide](../../guides/provider-notices-implementation.md) and the kit `examples/provider-notices` (phase 1, #523); it links the guide for procedures and doesn't repeat them. Status `draft`: Book 15 is a baseline book, but `status: baseline` is set only by `scripts/set_baseline_status.py` at a baseline cut, after the editor's approval (CONTRIBUTING.md, "Baseline status"); a chapter added after Release 2.0 stays draft until then.

Primary sources opened on 2026-11-09: Microsoft Learn through the Microsoft Learn documentation service (Azure Service Health portal, FAQ and notifications pages; Microsoft 365 Message center; Microsoft Graph service communications overview); docs.oracle.com (Console Announcements; the Python SDK `Announcement` model; Oracle US Government Cloud); docs.aws.amazon.com (AWS Health concepts; alternate contacts; AWS Health in GovCloud (US)); docs.cloud.google.com (Personalized Service Health overview and Event REST reference; Essential Contacts; Assured Workloads supported products, the full HTML parsed with a script); NIST's SP 800-53 release 5.2.0 OSCAL catalog (JSON, last modified 2026-10-22, parsed with a script); fedramp.gov's 2026 KSI theme pages for supply chain risk, change management, recovery planning, and monitoring, logging and auditing. No personal name, email address or agency detail was sent in any request.

## Claims log: provider facts (footnoted)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Azure Service Health's five event types; health advisories include deprecations and upgrade requirements; Health History keeps events up to 90 days after inactive | Why unread; six kinds | verified | `c14-ash-portal` |
| 2 | An alert fires only for the subscriptions, services and regions the rule names; a rule missing the subscription is a reason an alert never arrived | Why unread | verified | `c14-ash-faq` |
| 3 | Azure notification types include action required; incident notifications, labeled informational, may mean activating contingency plans | Six kinds | verified | `c14-ash-notify` |
| 4 | Message center: archiving affects only that admin's view; weekly digest on by default to each admin's primary email; major updates at least 30 days ahead when action is required; Act by rare; Retirement tag; categories Prevent or fix issues, Plan for change, Stay informed (including planned maintenance) | Why unread; six kinds | verified | `c14-m365-mc` |
| 5 | Graph service communications: service health and Message center posts; national cloud URLs for L4 and L5 | Six kinds; government clouds | verified | `c14-graph-sc` |
| 6 | GCC uses the worldwide Graph endpoint | Government clouds | carried from the guide (its claim 13, `pn-graph-deployments`) | Guide's verification log |
| 7 | OCI contacts the tenancy administrator by email; other delivery through email preferences or announcement subscriptions | Why unread | verified | `c14-oci-console` |
| 8 | OCI `announcement_type` values (ACTION_RECOMMENDED, ACTION_REQUIRED, INFORMATION, PLANNED_CHANGE*, SCHEDULED_MAINTENANCE, EMERGENCY_*, PRODUCTION_EVENT_NOTIFICATION); "An announcement's type signals its severity" | Six kinds | verified | `c14-oci-model` |
| 9 | Oracle US Government Cloud: FedRAMP High and DISA IL4; Announcements endpoints us-langley-1, us-luke-1 | Government clouds | verified | `c14-oci-gov` |
| 11 | AWS: root email plus up to three alternate contacts (billing, operations, security) | Why unread | verified | `c14-aws-contacts` |
| 12 | AWS Health categories (account notification, issue, scheduled change incl. planned lifecycle and end of support); 90 days; actionability values; personas; API needs a support plan, else `SubscriptionRequiredException` | Why unread; six kinds; limits | verified | `c14-aws-concepts` |
| 13 | GovCloud: single endpoint us-gov-west-1; EventBridge doesn't send public Service Health view events | Government clouds | verified | `c14-aws-gov` |
| 14 | Google Cloud Essential Contacts categories; fallback by IAM role | Why unread; six kinds | verified | `c14-gcp-contacts` |
| 15 | Personalized Service Health tracks incidents; `EventCategory` has only `INCIDENT` (besides unspecified) | Six kinds; limits | verified | `c14-gcp-psh`, `c14-gcp-event` |
| 16 | Personalized Service Health not in Assured Workloads' FedRAMP Moderate, FedRAMP High, IL2, IL4, IL5, CJIS, ITAR or IRS 1075 packages; listed for regional data boundary packages (including US Data Boundary) | Government clouds | verified (each package's rows parsed from the page's HTML) | `c14-gcp-aw` |

## Claims log: controls and KSIs

| # | Claim | Verdict | Source |
|---|---|---|---|
| 17 | SA-9 c; SI-5 a, c, d; CM-3 b, f; CM-4; CP-2 e; RA-3 f; SR-8; CA-7; AU-9 statements as paraphrased; SI-5's organization-defined parameters (external organizations; personnel or roles) | verified on the OSCAL catalog | `c14-sp80053` |
| 18 | KSI-SCR-MON related controls include SA-9, SI-5, RA-3, SR-8; KSI-SCR-MIT includes SA-9, RA-3 | verified | `c14-ksi` (supply chain risk page) |
| 19 | KSI-CMT-LMC and KSI-CMT-RVP cite CM-3; no KSI cites base CM-4 (CMT-LMC cites CM-4(2)) | verified (change management page); "no KSI cites base CM-4" carried from the guide's check of all ten pages | `c14-ksi`; guide claim 35 |
| 20 | KSI-RPL-ARP cites CP-2 | verified | `c14-ksi` (recovery planning page) |
| 21 | KSI-MLA-EVC cites CA-7 and RA-3; KSI-MLA-OSM cites AU-9 | verified | `c14-ksi` (monitoring, logging and auditing page) |
| 22 | KSIs bind providers; the agency uses them as vocabulary | carried | Chapter 11, "A correction about FedRAMP's indicators" |

## Claims log: carried from the books and the guide (linked, not footnoted)

| # | Claim | Source |
|---|---|---|
| 23 | Service health email to the help desk supervisor; nothing approved from email | Chapter 03 |
| 24 | `ServiceHealth` category to the workspace | Book 12, Chapter 04 |
| 25 | Roles: service desk supervisor and manager, platform owners (cloud platform, collaboration), system owner, ISSO, security operations (decides alert triage), change advisory board (normal change after security impact analysis), ITSM platform team, identity engineering, CISO for privileged scopes; routing and assignment rules owned by the service desk manager | Chapter 10 (roles, catalog and runbook ownership, responsibility matrix) |
| 26 | One front door; typed tasks; closure on re-read | Book 13, Chapter 10, "How the service desk fits"; Appendix B, five-clause request chain (clause 4) |
| 27 | P1 to P4 windows (program design) | Book 13, Appendix B, "Severity and tempo" |
| 28 | Routing order (security, retirement, maintenance naming resources, open incidents, action required), de-duplication by provider and provider ID, close payload asks for re-read, digest sections (open by provider, action required, next 30 days, new and closed in the last 7 days) | The kit: `config/routing.json`, `ProviderNotices.psm1` `New-PnDigest`; guide G6 and G7 |
| 29 | Kit refuses a session in another cloud, partition or realm; preflight checks named contacts (PF-05) | Guide, Dangers and G7 |
| 30 | Azure Resource Graph's Service Health in Azure Government not explicitly stated | Guide, "What couldn't be verified" (N3) |
| 31 | Contingency plan and its roles | Book 14, Chapter 06 |

## Discrepancy found (reported, not fixed here)

| # | Item | Detail |
|---|---|---|
| D1 | AWS Health API support plan names | The guide (claim 23, from the AWS CLI `health` reference) says Business, Enterprise On-Ramp or Enterprise Support. On 2026-11-09 AWS Health's "Concepts for AWS Health" page names "AWS Business Support+, AWS Enterprise Support, or AWS Unified Operations," and the GovCloud page says "Business or Enterprise support plan." The chapter says "a qualifying AWS Support plan" and tells readers to check the current AWS Health documentation. The guide isn't changed by this pull request (its page is gated and pending review); flagged for the guide's next revision. |

## Program design (labeled in the chapter)

The six-kind ownership table, the digest's place on the supervisor's weekly review and the CAB agenda, the two measures from the digest, and treating email as an early warning only.

## Not yet specified

| # | Item | Why |
|---|---|---|
| N1 | Who keeps each provider's notice contacts current | Book 15 has no owner for provider contacts; the chapter says so |
| N2 | Who reviews the contingency plan when a notice names a system's resources | Book 15 doesn't name one; Book 14, Chapter 06 sets contingency roles |

## Figure

`ch14-notice-to-closure` (source `docs/images/diagrams/b15-day2-operations/src/ch14-notice-to-closure.flow.yaml`), rendered with `scripts/diagrams/render.py --only ch14-notice-to-closure` under WSL; program design, matching the kit's routing order and the request chain's clause 4.
