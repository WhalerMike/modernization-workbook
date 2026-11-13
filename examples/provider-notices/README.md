# Provider notices as code

Cloud providers send each tenant, account, tenancy or project its own notices: scheduled maintenance, retirements, health and security advisories, upcoming changes and incidents. This kit collects them from five providers, normalizes each into one record, routes the ones that need action to an owner as a Ticket-to-Machine typed task, writes a weekly digest, and records every run as hashed, chained evidence. It is the code behind the [Provider Notices implementation guide](../../docs/books/guides/provider-notices-implementation.md).

- **Collect, read only.** Azure Service Health through Azure Resource Graph, Microsoft 365 Message center and service health through the Microsoft Graph service communications API, Oracle Cloud Infrastructure Announcements, AWS Health, and Google Cloud Personalized Service Health. One collector per provider, each with a fixture mode (Lab 1, no tenant) and a live mode (Lab 2, a test tenant). An agency whose HR platform runs on Oracle Cloud Infrastructure reads that tenancy's announcements here too.
- **Normalize.** One record per notice ([`schema/notice.schema.json`](schema/notice.schema.json)): provider, notice ID, kind (maintenance, retirement, advisory, security, change, incident), title, summary, window, affected services, regions and resources, whether action is required and by when (and whether the provider said so or a kit rule inferred it), the source, first seen and last updated, and a fingerprint.
- **Route.** A routing file the agency writes decides which notices become a task, for which assignment group, at which severity. A task is a ServiceNow-shaped payload with the Ticket-to-Machine finding contract's priorities and response windows and the five clauses of the request chain. Dry run by default. State de-duplicates across runs: a re-run with nothing new writes nothing.
- **Digest.** Markdown and CSV, weekly: open notices by provider and kind, action required by due date, maintenance starting soon, what's new and what closed.
- **Evidence.** Each run is recorded with its NIST SP 800-53 Rev 5 controls and FedRAMP 20x KSIs, the SHA-256 of every file and the hash of the record before it.

Illustrative: tested against fictional fixtures and stand-in tools, not against a live tenant, account, tenancy or project. Every collector call is a read. The only writes are in `deploy/` (the Azure Policy assignment for Service Health alerts, and rollback), and they run only with `-Apply` and the plan's approved SHA-256.

## Layout

```
Invoke-PnCollect.ps1                    collect every enabled provider (or -Provider), normalize, write notices.json/.csv, raw/, manifest
Invoke-PnRoute.ps1                      route a collection against the state; write task payloads (dry run), routing.csv, state
Invoke-PnDigest.ps1                     the weekly digest: digest.md, digest.csv
Invoke-PnEvidence.ps1                   record a run folder as evidence; -Check verifies the folder and a stage's coverage
config/calls.json                       every call: tool, operation, least-privileged role or permission, documentation page, verified or not
config/requirements.json                each step's SP 800-53 controls and KSIs, and the steps each stage's evidence must hold
config/routing.json                     the lab's routing (fictional teams)
schema/notice.schema.json               the common notice record (JSON Schema 2020-12)
templates/routing.template.json         your routing, with a placeholder for every agency value
templates/routing-worksheet.csv         the same as a worksheet to fill at work
copilot-prompts.md                      prompts for Microsoft 365 Copilot Chat to draft and review your routing
powershell/ProviderNotices/             the module: clouds, calls, invokers, the five normalizers, routing, digest, evidence
deploy/                                 the runbook's scripts for test and production (see Deploy)
tests/                                  Pester 5: the collectors, the normalizer, the router, the digest and evidence, live mode
tests/fixtures/day1, day2               fictional notices from every provider, a week apart (make_fixtures.py writes them)
tests/fixtures/settings.lab.json        Lab 1's settings: every provider, fictional IDs
```

## Providers, permissions and clouds

`Get-PnRequiredPermission -Provider <provider>` prints a provider's needs; `config/calls.json` names each call's documentation page. The pages were read on November 9, 2026.

| Provider | What the kit reads | Least privilege | Government cloud |
|---|---|---|---|
| Azure | Resource Graph `ServiceHealthResources`: `microsoft.resourcehealth/events` (service issues, planned maintenance, health advisories including retirements, security advisories) and `.../events/impactedresources`, with `az graph query` | Reader on each subscription. The sensitive fields and impacted resources of a security advisory need Service Health Security Reader (Reader and Monitoring Reader can't see them) | Azure Government: `az cloud set --name AzureUSGovernment`, Resource Manager `management.usgovcloudapi.net`. Learn's samples link the Azure Government portal; an explicit availability statement for Resource Graph's Service Health table is not yet specified |
| Microsoft 365 | Graph v1.0 `/admin/serviceAnnouncement/messages`, `/issues`, `/healthOverviews` | `ServiceMessage.Read.All` (messages), `ServiceHealth.Read.All` (issues, overviews); delegated sign-in also needs an admin role | GCC uses `graph.microsoft.com` |
| Oracle Cloud Infrastructure | Announcements: `oci announce announcements list` (latest in each chain), then `get` for affected resources | `Allow group <group> to read announcements in tenancy` (`inspect` lists summaries only) | US Government Cloud (OC2): `announcements.us-langley-1.oraclegovcloud.com`, `announcements.us-luke-1.oraclegovcloud.com` |
| AWS | AWS Health `describe-events` (open and upcoming), `describe-event-details`, `describe-affected-entities` | A customer managed policy with `health:DescribeEvents`, `health:DescribeEventDetails`, `health:DescribeAffectedEntities` (AWS publishes no read-only Health policy). The account needs a qualifying AWS Support plan (AWS's pages name the plans differently; see the guide's G4) | Commercial: `health.us-east-1.amazonaws.com`. GovCloud (US): one endpoint, `health.us-gov-west-1.amazonaws.com`; EventBridge there doesn't carry public Service Health events |
| Google Cloud | Personalized Service Health `events` (project) or `organizationEvents` (organization) | `roles/servicehealth.viewer` on the project or organization; the API enabled once on the project | Personalized Service Health isn't in Assured Workloads' FedRAMP Moderate or High packages. Its API has incidents only: no planned maintenance |

The settings file names each provider's cloud (`AzureCloud` or `AzureUSGovernment`; `global` or `gcc`; `oc1` or `oc2`; `aws` or `aws-us-gov`). Any other name throws; there is no default. The live invoker refuses to run if a session is signed in to another cloud, tenant, partition or realm.

## Lab 1: fixtures, no tenant

From `examples/provider-notices`, in PowerShell 7:

```powershell
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -AsOf 2026-11-09T12:00:00Z -OutputPath out/day1
./Invoke-PnRoute.ps1 -NoticesPath out/day1/notices.json -RoutingPath config/routing.json -StatePath out/state.json -OutputPath out/day1-route -AsOf 2026-11-09T12:00:00Z
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day2 -AsOf 2026-11-16T12:00:00Z -OutputPath out/day2
./Invoke-PnRoute.ps1 -NoticesPath out/day2/notices.json -RoutingPath config/routing.json -StatePath out/state.json -OutputPath out/day2-route -AsOf 2026-11-16T12:00:00Z
./Invoke-PnDigest.ps1 -NoticesPath out/day2/notices.json -StatePath out/state.json -OutputPath out/digest -AsOf 2026-11-16T12:00:00Z
./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -RunPath out/day2 -AsOf 2026-11-16T12:00:00Z
./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -RunPath out/day2-route -AsOf 2026-11-16T12:00:00Z
./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -Check
```

Day 1 finds 22 notices and writes 13 task payloads. Day 2, a week later, finds 2 new and 6 changed notices, and one the provider no longer lists; it writes 1 create, 4 updates and 2 closes, and nothing for the 15 unchanged.

## Lab 2: a test tenant

Sign in to each provider you enable, in the cloud the settings file names, with the read-only role above. Then run the same collector without `-FixturePath`:

```powershell
az cloud set --name AzureCloud
az login
Connect-MgGraph -Environment Global -Scopes ServiceMessage.Read.All,ServiceHealth.Read.All
./Invoke-PnCollect.ps1 -SettingsPath <settings-file> -Provider azure, m365 -OutputPath out/live
```

`<settings-file>` is your copy of `deploy/settings.template.json` with every placeholder filled for the enabled providers. Use `AzureUSGovernment` for Azure Government. OCI, AWS and Google use their own CLIs' sign-in (`oci`, `aws`, `gcloud`); the collector calls them with the region, partition or project from the settings file.

## Deploy

The runbook takes the kit to a test environment, then production, with the same commands and one settings file per environment. Nothing in it has been run against a live tenant.

```
deploy/settings.template.json        the settings file: copy it per environment, fill every <placeholder>; no secrets
deploy/Test-PnPreflight.ps1          settings and routing, tools, signed-in clouds, the reader's first call, notice contacts (SR-8), output root, and in production the test stage's evidence (PF-01 to PF-07)
deploy/Invoke-PnScheduledRun.ps1     the weekly run: collect, route, digest, and an evidence record for each
deploy/New-PnAlertPolicy.ps1         plans Azure Service Health alerts at scale with the built-in policy and a remediation task; applies only with -Apply and the approved SHA-256
deploy/Invoke-PnRollback.ps1         plans the rollback in reverse order; applies only with -Apply and the approved SHA-256
deploy/PnDeploy.psm1                 the module behind them
deploy/tests/                        Pester 5 and fixtures (fictional contoso.example test and production environments)
```

Each script has a fixture mode. Each writes a run folder with a manifest; `Invoke-PnEvidence.ps1` records it, and `Invoke-PnEvidence.ps1 -Check -Stage test` is the evidence half of the go/no-go: the stage's steps (PRE, RUN, ROUTE, DIGEST; production adds ALERTS) each have a passing record, the chain is unbroken and `SHA256SUMS` matches.

The router sends payloads only from `deploy/Invoke-PnScheduledRun.ps1 -Send`, when the settings file's `routing.send` is true, to the settings' `https` endpoint with a token read from the environment variable it names. The endpoint is the agency's own ServiceNow resource; its shape on the ServiceNow side is not yet specified here.

## Federal requirements and evidence

| Step | NIST SP 800-53 Rev 5 | KSIs | What the ISSO keeps |
|---|---|---|---|
| Collect (each provider) | SA-9 (c, monitor external service providers), SI-5 (a, receive alerts and advisories) | KSI-SCR-MIT, KSI-SCR-MON | `raw/`, `notices.json`, `notices.csv`, `manifest.json` |
| Normalize | SI-5, CA-7 | KSI-SCR-MON, KSI-MLA-EVC | `notices.json` validated against the schema |
| Route | SI-5 (c, d), CM-3, CM-4 | KSI-SCR-MON, KSI-CMT-LMC, KSI-CMT-RVP | `tasks/`, `tasks.json`, `routing.csv`, `state.json` |
| Contingency review (retirements, maintenance) | CP-2 (e, update the plan for changes in the environment of operation) | KSI-RPL-ARP | Payloads with `contingency_review: true` |
| Digest | SI-5 (c), SA-9, RA-3 | KSI-SCR-MON, KSI-SCR-MIT | `digest.md`, `digest.csv` |
| Evidence | CA-7, AU-9 | KSI-MLA-EVC, KSI-MLA-OSM | `records/`, `records.csv`, `SHA256SUMS` |
| Preflight | SA-9, SR-8 (notification agreements) | KSI-SCR-MON | `results.json` |
| Service Health alerts | SI-5, CA-7 | KSI-SCR-MON, KSI-MLA-EVC | `plan.json`, `results.json` |
| Rollback | CM-3, CP-2 | KSI-CMT-LMC, KSI-RPL-ARP | `plan.json`, `results.json` |

The kit's evidence supports these controls; the agency's assessor decides whether a control is satisfied. KSIs are FedRAMP 20x indicators for cloud service providers: the agency lines its own evidence up with what its providers report against them and doesn't report KSIs itself. The control text was read from NIST's OSCAL catalog (release 5.2.0) and the KSIs' related controls from fedramp.gov's 2026 pages on November 9, 2026 ([`config/requirements.json`](config/requirements.json)).

## Your routing stays at work

The kit ships neutral templates and fictional examples. Your routing (owners, assignment groups, which notices matter), your settings files, your notices, digests and evidence stay inside your agency: write them at work, with [`copilot-prompts.md`](copilot-prompts.md) in Microsoft 365 Copilot Chat if that helps, and keep them on agency storage. Never put them in a public or personal repository.

## Run the tests

```powershell
Invoke-Pester -Path tests
Invoke-Pester -Path deploy/tests
```

PowerShell 7.1 or later and Pester 5. No module, tenant, account or network is needed. The schema test with `Test-Json` runs on PowerShell 7.4 and later. One router test reads the Ticket-to-Machine finding contract at `../servicenow-sailpoint/clients/python/finding_contract.py`, which the download includes, and fails if its priorities or windows drift from the kit's.
