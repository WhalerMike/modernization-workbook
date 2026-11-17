# Global Secure Access as code

The code behind the [Global Secure Access implementation guide](../../docs/books/guides/global-secure-access-implementation.md) and its developer workbook, [*Building Global Secure Access*](../../docs/project-plans/developer-workbooks/global-secure-access/index.md). It reads a tenant's Global Secure Access configuration, checks it against the guide's twelve steps, plans the changes a ring needs as a file a reviewer approves by its SHA-256, computes the guide's metrics and ring exit criteria, and records every run as hashed, chained evidence tagged with NIST SP 800-53 Rev 5 controls and FedRAMP 20x KSIs.

- **Collect, read only.** The traffic forwarding profiles, security profiles and filtering policies, the signaling and tagging settings, connectors and connector groups, Conditional Access policies and named locations, the tenant restrictions v2 policy, Private Access applications, the device usage summary, licenses and onboarding state through Microsoft Graph; the Entra diagnostic setting through Azure Resource Manager; and the guide's KQL through `az monitor log-analytics query`. Every call is declared in [`config/calls.json`](config/calls.json) with its least-privileged permission and the Learn page that states it. A fixture mode (Lab 1, no tenant) and a live mode (Lab 2, a test tenant).
- **Check.** One check per guide step, `GSA-DEC-*` to `GSA-LOG-*`, each with the guide step it follows and the fix. The agency's own records (decision records, the architecture record, the exception register, client records, the TLS record, the ring record) come from an inputs folder; [`templates/`](templates) has a neutral template for each.
- **GCC.** Microsoft 365 GCC (Moderate) uses the worldwide endpoints, `graph.microsoft.com`, `login.microsoftonline.com` and `management.azure.com`; the settings file names the cloud (`gcc`), and there is no default. [`config/availability.json`](config/availability.json) is the guide's availability table: Learn states that Global Secure Access is available in GCC for the product as a whole, so a preview feature's GCC availability is *not yet specified*. A decision that uses one without an approved exception fails, and the finding names the interim path the guide gives (for QUIC, an Intune-delivered Windows Firewall rule instead of the preview cloud firewall).
- **Plan.** A reviewed desired-state file (the profiles' state, signaling, tagging, and the Conditional Access policies as JSON under [`config/policies`](config/policies)) is compared with a collection; the plan lists the Graph requests in a safe order and the portal-only steps. New policies are created report-only, enforcing one needs `-AllowEnforce`, a policy that doesn't exclude the emergency access group isn't planned, and tagging isn't planned while the TRv2 default doesn't block. Nothing changes without `-Apply`, the plan's SHA-256 and a live, delegated session. The rollback plan follows the guide's order.
- **Metrics and rings.** The guide's metrics table and the Step 11.1 ring exit criteria, with a Go or No-go.
- **Evidence.** Each run folder is recorded with its steps' controls and KSIs, the SHA-256 of every file and of the record before it; `-Check -Stage` says whether a stage's evidence is complete.

The network access API is beta: Learn says beta APIs "are subject to change" and aren't supported in production applications. The kit runs it interactively, signed in as a person (it refuses an app-only Graph session), and never on a schedule. Illustrative: tested against fictional fixtures and stand-in runners, not against a live tenant. It needs PowerShell 7.1 or later and, for the tests, Pester 5; live mode also needs the Microsoft Graph PowerShell SDK and the Azure CLI.

## Layout

```
Invoke-GsaCollect.ps1        read the tenant (or the fixtures): collection.json, raw/, manifest.json
Invoke-GsaCheck.ps1          check a collection for one or more areas: findings.json/.csv, manifest.json
Invoke-GsaPlan.ps1           plan a ring's changes from a desired-state file; -Apply with the approved SHA-256
Invoke-GsaMetrics.ps1        the guide's metrics and the ring exit criteria: metrics.json, ring-exit.json
Invoke-GsaEvidence.ps1       record a run folder as evidence; -Check verifies the folder and a stage
config/calls.json            every call: method, URI, least-privileged permission, roles, Learn page, beta, verified
config/availability.json     the guide's GCC and licensing table, with an interim path for each preview feature
config/queries.json          the guide's KQL, by step
config/requirements.json     each step's SP 800-53 controls and KSIs; what each stage's evidence needs
config/desired.lab.json      the lab's desired state for the pilot; desired.ring1.json for ring 1
config/policies/             the guide's Conditional Access policies as JSON, with placeholders
templates/                   decision record, architecture record, exception register, TLS record, ring record
copilot-prompts.md           prompts for Microsoft 365 Copilot Chat to fill the templates at work
tools/Get-GsaClientState.ps1 run on a device: the client's Step 3 values as a client record
deploy/                      the runbook's scripts: settings template, preflight, smoke test, rollback
powershell/GlobalSecureAccess/  the module
tests/                       Pester 5; fixtures/pilot and fixtures/ring1 are one fictional tenant two weeks apart
```

## Areas and checks

| Area | Guide step | Checks |
|---|---|---|
| `decision` | 1 | GSA-DEC-01 to -09: onboarded; a record per function; availability quote within 30 days; licenses; approver; compensating controls; preview features; exit criteria; review date |
| `baseline` | 2, 12.1 | GSA-ARC-01 to -04: connector groups in the architecture record with two hosts, DNS suffixes include the forest, workspace, export complete; GSA-LOG-01 the diagnostic setting |
| `client` | 3 | GSA-CLI-01 to -07: coverage, version, IPv4 preferred, DNS over HTTPS off, health, hardening from ring 2, exclusions governed |
| `traffic` | 4 | GSA-MS-01 to -04: Microsoft profile, signaling, sign-in share, profiles only with a decision |
| `compliant-network` | 7 | GSA-CN-01 to -07: named location, block outside it, emergency and Intune exclusions, no Private Access app, report-only 10 business days with no failure through the service, signaling while enforced |
| `tenant-restrictions` | 8 | GSA-TR-01 to -04: TRv2 default blocks, partners registered, tagging only with a blocking default, blocked tenants for review |
| `private-access` | 6, 10 | GSA-PA-01 to -09: two active, current connectors per group; narrow, non-overlapping segments; Quick Access residual; group assignment; a policy excluding emergency access; phishing-resistant strength on RDP and SSH |
| `internet-access` | 5 | GSA-IA-01 to -06: profile linked, high-risk categories blocked, threat intelligence, bypasses governed, QUIC interim block, limits |
| `tls` | 9 | GSA-TLS-01 to -06: certificate validity and renewal, dedicated CA, not on the baseline profile before ring 3, privacy approval and notice, bypasses registered, failure share under 1% |
| `telemetry` | 12 | GSA-LOG-01 to -03: setting, freshness per table, CISA telemetry agreed |

## Lab 1: fixtures, no tenant

From `examples/global-secure-access`, in PowerShell 7:

```powershell
Invoke-Pester -Path tests
./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/pilot -OutputPath out/pilot -AsOf 2026-11-16T12:00:00Z
./Invoke-GsaCheck.ps1 -Area decision, baseline -SettingsPath tests/fixtures/settings.lab.json -CollectionPath out/pilot -InputsPath tests/fixtures/pilot/inputs -OutputPath out/check -AsOf 2026-11-16T12:00:00Z
./Invoke-GsaPlan.ps1 -SettingsPath tests/fixtures/settings.lab.json -CollectionPath out/pilot -DesiredPath config/desired.lab.json -OutputPath out/plan -AsOf 2026-11-16T12:00:00Z
./Invoke-GsaMetrics.ps1 -SettingsPath tests/fixtures/settings.lab.json -CollectionPath out/pilot -InputsPath tests/fixtures/pilot/inputs -OutputPath out/metrics -AsOf 2026-11-16T12:00:00Z
./Invoke-GsaEvidence.ps1 -EvidencePath out/evidence -RunPath out/check -AsOf 2026-11-16T12:05:00Z
./Invoke-GsaEvidence.ps1 -EvidencePath out/evidence -Check
```

The pilot fixture has the defects the workbook's labs find: a stale availability quote and a preview feature in the internet decision, a diagnostic setting missing a category, an old client, a connector group with one active connector, a Private Access app with a wide segment and a direct assignment, an administrative app without the phishing-resistant strength, an expired bypass and a TLS certificate near expiry. The ring 1 fixture is the same tenant two weeks later, with them fixed: its metrics are all met and the ring exits.

## Lab 2: a test tenant

Each workbook chapter's Lab 2 gives the exact commands. In short: sign in to Microsoft Graph as a person in the test tenant (`Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes ...`, the scopes `Get-GsaRequiredPermission` lists), `az login`, copy `deploy/settings.template.json` with every placeholder filled, then run the same scripts without `-FixturePath` (with `-AllowUnverified` for the two reads not yet checked against a Learn page). Keep the outputs inside the boundary: they describe the tenant's network controls.
