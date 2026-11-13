# Verification — Guide: Provider Notices, an Implementation Guide

New guide, first pass of 2026-11-09, with the kit `examples/provider-notices`. Owner approval of the capability: Nov 9, 2026. Every provider fact was read on the provider's own documentation on 2026-11-09: Microsoft Learn (through the Microsoft Learn documentation service) for Azure and Microsoft 365; docs.oracle.com for OCI; docs.aws.amazon.com for AWS Health; docs.cloud.google.com for Google Cloud. Control statements were read from NIST's OSCAL catalog (release 5.2.0, last modified 2026-10-22) and the KSIs' "Related SP 800-53 Controls" from fedramp.gov's ten 2026 KSI theme pages (46 indicators; per-indicator changelogs show 2026-10-13 "Updated control mappings"). No personal name, email address or agency detail was sent in any request.

Facts carried from the books are cited by link and rely on those pages' own verification logs. The kit's fixtures are fictional (`contoso.example`, AWS's documentation account `111122223333`), shaped from the providers' sample responses.

## Claims log: provider facts (footnoted)

| # | Claim (short) | Where in the guide | Verdict | Source |
|---|---|---|---|---|
| 1 | `ServiceHealthResources` all-active-events KQL, as published; the CLI form `az graph query -q` | G1 steps, interim path | verified; quoted verbatim | `pn-arg-samples` |
| 2 | Upcoming retirements are health advisories with `EventSubType` `Retirement`; a health advisory's mitigation time is its end time | Track at a glance, G1 | verified | `pn-arg-samples` |
| 3 | Learn's health advisory and retirement samples convert times with `todatetime(tolong(...))` | G1 step 3; kit query | verified | `pn-arg-samples` |
| 4 | Emerging issues aren't tied to subscriptions and can't be queried through Resource Graph | Verification only | verified; not used | `pn-arg-samples` |
| 5 | Impacted-resources query (TrackingId split, `parse_json`, projection), as published | G1; kit query | verified; the kit adds `order by id asc` for paging | `pn-arg-impacted` |
| 6 | Reader on a subscription to view Service Health events | Prerequisites, G1 | verified | `pn-sub-tenant` |
| 7 | Sensitive security-advisory fields need Service Health Security Reader (or the three actions); Reader and Monitoring Reader can't view them; impacted resources always sensitive | Prerequisites, G1, Dangers | verified | `pn-sec-elevated` |
| 8 | Built-in definition 98903777-a9f6-47f5-90a9-acaf62ab01a8 "Configure subscriptions to enable Service Health Monitoring Alert Rules"; MG or subscription scope, not resource group; remediation needed for existing subscriptions; default resources; manual edits may be overwritten; effects Disabled, AuditIfNotExists, DeployIfNotExists | G1 step 4, Dangers | verified (the ID from the page's portal link) | `pn-policy` |
| 9 | `az policy assignment create` `--mi-system-assigned`, `--location`, `--role`, `--identity-scope`, `--params`; roles granted automatically only through the portal; `az policy remediation create --name --policy-assignment --management-group` | G1 step 4; kit plan | verified | `pn-remediate` |
| 10 | `az cloud set --name AzureUSGovernment`; resource manager `management.usgovcloudapi.net` | G1 | verified | `pn-gov-cli` |
| 11 | `az extension add --name resource-graph`; `--first` 1 to 1,000; `--skip-token`; `--subscriptions`, `--management-groups` | G1 step 2; kit | verified (Resource Graph CLI quickstart; `az graph` reference; paging guidance) | Learn, linked in `config/calls.json` |
| 12 | Graph service communications: `ServiceMessage.Read.All` (messages), `ServiceHealth.Read.All` (issues, health overviews); no higher-privileged permission; granted only by an administrator; delegated user needs an admin role; national clouds with L4 `graph.microsoft.us` and L5 `dod-graph.microsoft.us` | Prerequisites, G2 | verified | `pn-graph-overview`, `pn-graph-messages`, `pn-graph-issues` |
| 13 | GCC uses the worldwide endpoint `graph.microsoft.com` | G2, comparison | verified | `pn-graph-deployments` |
| 14 | serviceUpdateMessage and serviceHealthIssue fields and enumerations; Learn's samples use PascalCase values | Track at a glance; kit normalizer | verified | `pn-graph-messages`, `pn-graph-issues` |
| 15 | Data privacy messages: Global Administrator and Message Center Privacy Reader | Prerequisites | verified | `pn-m365-roles` |
| 16 | `Microsoft.Graph.Devices.ServiceAnnouncement`, `Get-MgServiceAnnouncementMessage` | G2 interim path | verified | `pn-graph-messages` |
| 17 | OCI `announce announcements list` with `--compartment-id` (required), `--all`, `--should-show-only-latest-in-chain`; `get --announcement-id` | G3 | verified | `pn-oci-cli`, `pn-oci-get` |
| 18 | OCI Announcement fields and enumerations (`announcementType`, `timeOneType`, `timeTwoType`, `lifecycleState`, `chainId`; details: `affectedResources`) | Track at a glance; kit | verified on the Python SDK model and source (the API reference page renders only in a browser) | `pn-oci-cli` |
| 19 | `Allow group ... to read announcements in tenancy`; `inspect` lists only | Prerequisites, G3 | verified | `pn-oci-policy` |
| 20 | OC2 endpoints `announcements.us-langley-1.oraclegovcloud.com`, `announcements.us-luke-1.oraclegovcloud.com` | G3, comparison | verified | `pn-oci-gov` |
| 21 | AWS Health Event fields; `eventTypeCategory` values; `actionability`, `personas`; `statusCode` | Track at a glance; kit | verified | `pn-aws-events` |
| 22 | DescribeEventDetails 1 to 10 ARNs; `successfulSet[].eventDescription.latestDescription`; AffectedEntity fields | G4; kit | verified | `pn-aws-details` |
| 23 | Business, Enterprise On-Ramp or Enterprise Support; otherwise `SubscriptionRequiredException` | Prerequisites, G4, Dangers | verified; no 2025–2026 change found | `pn-aws-plan` |
| 24 | No read-only Health managed policy; `health:Describe*` example | Prerequisites, G4 | verified | `pn-aws-iam` |
| 25 | Active endpoint us-east-1 | G4 | verified | `pn-aws-endpoints` |
| 26 | GovCloud: single endpoint in us-gov-west-1; EventBridge doesn't send public Service Health events | G4, comparison | verified | `pn-aws-gov` |
| 27 | EventBridge `aws.health`, `AWS Health Event` | G4 interim path | verified | `pn-aws-eb` |
| 28 | Personalized Service Health: `projects.locations.events.list`; organization events; category `INCIDENT` only; no planned maintenance | G5, comparison, Dangers | verified | `pn-gcp-events`, `pn-gcp-event` |
| 29 | `gcloud service-health events list --project --location=global` (GA) | G5 | verified | `pn-gcp-gcloud` |
| 30 | `roles/servicehealth.viewer` "Personalized Service Health Viewer" | Prerequisites, G5 | verified | `pn-gcp-iam` |
| 31 | Enable `servicehealth.googleapis.com` | G5 | verified | `pn-gcp-list` |
| 32 | Assured Workloads: Personalized Service Health not in FedRAMP Moderate, High, IL2, IL4, IL5, CJIS, ITAR | G5, comparison | verified (supported-products page parsed) | `pn-gcp-aw` |

## Claims log: controls and KSIs

| # | Claim | Verdict | Source |
|---|---|---|---|
| 33 | SA-9 c, SI-5 a/c/d, CM-3 b/f, CM-4, CP-2 e, SR-8, RA-3 f, CA-7 d–f: statement parts as the guide paraphrases them | verified on the OSCAL catalog | `pn-oscal` |
| 34 | KSI-SCR-MON cites SA-9, SI-5, SR-8, RA-3; KSI-SCR-MIT cites SA-9 and RA-3; KSI-SVC-ACM also cites SI-5 (not used: the kit's mapping is SCR-MON) | verified | `pn-ksi` |
| 35 | KSI-CMT-LMC, CMT-RMV, CMT-RVP, CMT-VTD cite CM-3; no KSI cites base CM-4 (CMT-LMC and CMT-VTD cite CM-4(2)) | verified; CM-3 rows match Book 13, Appendix A | `pn-ksi` |
| 36 | KSI-RPL-ARP is the only KSI citing base CP-2 | verified | `pn-ksi` |
| 37 | KSI-MLA-EVC cites CA-7 and RA-3 | verified; CA-7 row matches Book 13, Appendix A | `pn-ksi` |
| 38 | AU-9 to KSI-MLA-OSM | carried from the privileged access guide's mapping (Gate 1 table) | privileged-access-implementation.md |
| 39 | Baselines: SI-5, SA-9, CA-7, CP-2 in L M H and B C D; CM-3 in M H and C D | carried | Book 12 App A, Book 13 App A, Book 14 Ch 06 |

## Claims log: carried from the books (linked, not footnoted)

| # | Claim | Source |
|---|---|---|
| 40 | Microsoft's service health email routed to the help desk supervisor; nothing approved on the strength of an email | Book 15, Chapter 03 |
| 41 | `ServiceHealth` activity log category to the workspace | Book 12, Chapter 04 |
| 42 | Ticket-to-Machine lanes, the five clauses, P1–P4 windows (program design) | Book 13, Chapter 10 and Appendix B; `finding_contract.py` |
| 43 | KSIs bind providers; the agency aligns its evidence | Book 00, Appendix B |

## Not yet specified

| # | Item | Why | What the kit does |
|---|---|---|---|
| N1 | Resource Graph `ServiceHealthResources` column schema and `LastUpdateTime` format | Learn gives no column list or sample row | Projects Learn's columns; accepts ISO, epoch seconds or milliseconds, or ticks |
| N2 | Whether Resource Graph redacts sensitive security-advisory fields | Not stated | Recommends Service Health Security Reader |
| N3 | Resource Graph Service Health in Azure Government (explicit statement) | Only the samples' portal links | Supports `AzureUSGovernment`; guide says so |
| N4 | `az graph query` JSON keys (`data`, `skip_token`) | Learn documents the REST response | Reads `skip_token`, `skipToken` or `$skipToken` |
| N5 | The alert resource type and the parameter names of the Service Health policy | Not on the page | Plan has no parameters file by default; read the definition first |
| N6 | Message center tag values | Not enumerated on Learn | `Retirement` tag means retirement |
| N7 | Admin roles accepted for delegated Graph reads | Not named | Guide says "an admin role" |
| N8 | OCI CLI output key casing | Not shown | Accepts camelCase and kebab-case |
| N10 | gcloud `organization-events` flags | Not read | Call marked unverified; runs only with `-AllowUnverified` |
| N11 | The ServiceNow endpoint's shape | The agency's own resource | Posts the payload JSON with a bearer token from an environment variable |
| N12 | The scheduler | Agency choice | Not registered; rollback assumes a Windows scheduled task name |

## Review gate

`review-status: pending`. The guide waits for the owner's review; it isn't approved here.

## AWS support plan wording, November 9, 2026

AWS's pages name the plans the Health API needs differently. The CLI reference names Business, Enterprise On-Ramp or Enterprise Support; the AWS Health User Guide's "Concepts for AWS Health" (read Nov 9, 2026) names Business Support+, Enterprise Support or Unified Operations; the GovCloud (US) guide names Business or Enterprise. The guide now says "a qualifying AWS Support plan" and cites all three, as Book 15 Chapter 14 does. Footnote `pn-aws-plan-ug` added.

## Zero Trust closure, Phase 4 (November 11, 2026)

Applied the conventions of Book 00, Appendix D to the guide's procedure gates, as the trimmed plan asks (conventions on procedure sections; a "must" relabeled only where it is a recommendation).

- **Added** `#pn-control-states`: the five control states mapped to G1 to G7 (Enforced not applicable for the notices, a detective loop; G1's alert policy named as the one setting applied at scope), a How-template coverage table that points at existing sections, and a change-safety block (rings: test stage, production read-only, production with the alert policy and sending), marked design guidance. No assessment-mapping block: the guide addresses no Zero Trust Assessment test family; that is stated in the section.
- **Added** the five-kind evidence checklist to `#evidence`.
- **Authority labels:** no "must", "shall" or "required" in the guide's own voice is a recommendation; the matches are provider field names (`ACTION_REQUIRED`, `actionRequiredByDateTime`) and "action required" as a notice state. None relabeled.
- **Sources:** the additions make no new product, licensing or government-cloud claim; they restate the guide's gates. Every product claim above already carries its read date (November 9, 2026), so nothing was re-read.
