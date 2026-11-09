# Verification — Chapter 11, Deploying to Test and Production

New material; it replaces no workbook page. Code: `examples/non-person-identity` (extended, additively): `deploy/NpiDeploy.psm1` (the settings reader and checker, the call list and client, the fake and live invokers, `Invoke-NpiDeployPreflight`, `Invoke-NpiDeploySmokeTest`, `New-NpiDeployRollbackPlan`, `Invoke-NpiDeployRollbackPlan`, `Export-NpiDeployRun`), `deploy/Test-NpiDeployPreflight.ps1`, `deploy/Invoke-NpiDeploySmokeTest.ps1`, `deploy/Invoke-NpiDeployRollback.ps1`, `deploy/settings.template.json`, `deploy/Write-NpiDeployEvidence.ps1`, `deploy/Test-NpiDeployEvidence.ps1`, `config/requirements-ch11.json` (the requirements and KSI catalog), `config/calls-ch11.json` (tasks `deploy-preflight`, `deploy-smoke`, `deploy-rollback`), `tests/fixtures/deploy/` (test and production settings, tenants and register runs, a VK-NPI baseline) and `deploy/tests/NpiDeploy.Tests.ps1`. The kit README gained Chapter 11's bullet, layout entries and permission rows. NpiCore, the other chapters' modules, scripts, call lists and tests are untouched.

No Microsoft sample is pinned: this chapter runs the earlier chapters' code (each of which starts from its own pinned sample) and Learn's own commands, and Learn has no sample for a deployment preflight, a smoke test or a rollback plan. Searched on November 2, 2026 with the Learn MCP tools (`microsoft_docs_search`, `microsoft_docs_fetch`).

Test results on November 2, 2026, Windows 11, PowerShell 7.6 with Pester 5.9.0. The Pester file was moved from `tests/` to `deploy/tests/` so that the chapters' Lab 1 count (`Invoke-Pester -Path tests`, 513, which `scripts/kit_captures.py` checks) is unchanged; `tests/test_deploy.py` runs it in the kit's pytest suite (1 passed, 55 Pester tests inside). Before the move: `python scripts/run_example_tests.py non-person-identity` passed (Pester, the whole kit: 558 passed before `-Wave` and the Prepare-step test were added; `deploy/tests/NpiDeploy.Tests.ps1` alone: 55 passed after the evidence records were added; pytest for `examples/drift-pipeline`: 142 passed). The dry-run output in the chapter is the scripts' real output on the kit's fixtures, captured on November 2, 2026. Nothing signed in and no request left the machine.

Microsoft Learn pages opened on November 2, 2026 through the Microsoft Learn MCP tools: Conditional Access for workload identities (full page); Configure restrictions on how applications can be configured (full page); Microsoft Entra application management policies API overview, v1.0 (search excerpt); Update appManagementPolicy (full page); Update conditionalaccesspolicy (full page); appliedConditionalAccessPolicy resource type, beta (full page); application: addPassword (full page); application: removePassword (search excerpt); List roleEligibilityScheduleInstances (full page); Microsoft Entra built-in roles (search excerpts: template IDs); Product names and service plan identifiers for licensing (search excerpts: AAD_PREMIUM, AAD_PREMIUM_P2); Create a KDS root key (full page); Manage group Managed Service Accounts (full page); Activate a Microsoft Entra role in PIM (search excerpt); Connect-MgGraph (search excerpts); Sign into Azure with a service principal using the Azure CLI (full page); az identity federated-credential (search excerpt); Configure a user-assigned managed identity to trust an external identity provider (search excerpts); Configure an application to trust a managed identity (search excerpt: audience values by cloud); Use the Azure Login action with OpenID Connect (search excerpts); New-ADUser (search excerpts).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Workload ID Premium is required to create or modify workload Conditional Access; existing policies keep working without it | PF-03; Verified facts | verified | Learn, Conditional Access for workload identities |
| 2 | Workload policies: single-tenant service principals only; not SaaS, multitenant or managed identities; group assignment not enforced; Block only; report-only or On; roll back by delete or disable; sign-in logs and the report-only tab; object ID from Enterprise apps | Safe order; Step 1.5; ST-05; Step 1.8 | verified | Learn, Conditional Access for workload identities |
| 3 | The blocked-sign-in message, "Access has been blocked due to Conditional Access policies" | Step 2.4 | verified (short quote) | same |
| 4 | App management policy roles: Security Administrator plus Cloud Application Administrator or Application Administrator, or Global Administrator | Roles; Verified facts | verified | Learn, Configure restrictions |
| 5 | A restriction applied to specific applications through a custom policy and `appManagementPolicies/$ref`; the admin center path; an app already holding a custom policy refuses another | Step 1.2 | verified | Learn, Configure restrictions |
| 6 | No report-only mode is documented for app management policies | Safe order; Step 1.2; Dangers | verified by absence on the configure page and the API overview read; recorded as "Learn documents none" | Learn, Configure restrictions; API overview |
| 7 | A policy blocks only a create or update that violates it, never token issuance for existing apps; one custom policy per app; the custom policy's restriction takes precedence | Safe order; Step 1.2; ST-03 | verified | Learn, API overview (v1.0) |
| 8 | Update appManagementPolicy: `PATCH`, `Policy.ReadWrite.ApplicationConfiguration`, Cloud Application Administrator or Application Administrator, L4 and L5 | Rollback; Verified facts | verified | Learn, Update appManagementPolicy |
| 9 | Update a Conditional Access policy: `Policy.Read.All` and `Policy.ReadWrite.ConditionalAccess`, Security Administrator or Conditional Access Administrator, L4 and L5 | Rollback; Verified facts | verified | Learn, Update conditionalaccesspolicy |
| 10 | Report-only result values and the `Prefer: include-unknown-enum-members` header | ST-06; Verified facts | verified | Learn, appliedConditionalAccessPolicy (beta) |
| 11 | addPassword and removePassword: delegated `Application.ReadWrite.All`, application `Application.ReadWrite.OwnedBy`, L4 and L5; `secretText` can't be retrieved later | ST-03; call list | verified | Learn, addPassword; removePassword |
| 12 | List roleEligibilityScheduleInstances: `RoleEligibilitySchedule.Read.Directory`, `$filter` supported, L4 and L5 | PF-06; call list | verified | Learn |
| 13 | Built-in role template IDs for the four roles the preflight checks | PF-06 code; Verified facts | verified | Learn, Microsoft Entra built-in roles |
| 14 | Service plan IDs for Entra ID P1 and P2 | PF-04 code; Verified facts | verified | Learn, licensing service plan reference |
| 15 | Workload ID service plan IDs | PF-03 code | carried forward from Chapter 03 (`config/migration-matrix.json`), not re-read | Chapter 03's log |
| 16 | KDS root key: up to 10 hours; `-EffectiveImmediately` usable at once on the target DC only; backdated key for a one-DC test environment; restart the KDC if re-created; Domain Admins or Enterprise Admins | Pre-flight checks, step 3; Step 1.4; Dangers | verified | Learn, Create a KDS root key |
| 17 | gMSA: prerequisites, a security group of retrieving hosts, `New-ADServiceAccount`, `Test-ADServiceAccount`, `Install-ADServiceAccount`, `Uninstall-ADServiceAccount`; name unique in the forest; interval only at creation | Prepare, step 2; Step 1.4; Step 1.8 | verified | Learn, Manage group Managed Service Accounts |
| 18 | PIM activation path in the admin center | Roles | verified | Learn, Activate a Microsoft Entra role in PIM |
| 19 | `Connect-MgGraph` app-only with `-ClientId`, `-TenantId`, `-CertificateThumbprint`; `-Environment` | Sign-ins | verified | Learn, Connect-MgGraph |
| 20 | `az login --service-principal --certificate <pem>`; the certificate appended to the private key | Sign-ins | verified | Learn, Sign into Azure with a service principal |
| 21 | `az identity federated-credential create` parameters and the default audience | Verified facts | verified | Learn, Azure CLI reference |
| 22 | `az identity create --name --resource-group --location` | Step 1.3 | partly verified: the trust page's CLI section and the CLI reference name the group; the exact `create` flags weren't on a page opened today (research gaps, row 105) | Learn, user-assigned identity trust page |
| 23 | Audience `api://AzureADTokenExchangeUSGov` for Entra ID for US Government | Which cloud; Verified facts | verified | Learn, Configure an application to trust a managed identity |
| 24 | Azure Login action: audience default, `environment` for Azure Government | Step 1.6; Verified facts | verified | Learn, Use the Azure Login action with OpenID Connect |
| 25 | `allow-no-subscriptions` on the Azure Login action | Step 1.6 workflow | not verified on Learn: the action's own input (research gaps, row 105) | — |
| 26 | `New-ADUser -AccountPassword -Enabled -PasswordNeverExpires`; not on a read-only DC | Prepare, step 4 | verified | Learn, New-ADUser |
| 27 | Federated credential rules, case-sensitive match, `AADSTS70021` propagation | Step 1.3; ST-04 | carried forward from Chapter 05 | Chapter 05's log |
| 28 | Sign-in logs need Entra ID P1 or P2 | PF-04 | carried forward from Chapter 05 | Chapter 05's log |
| 29 | Create appManagementPolicy request | Prepare, step 5 | carried forward from Chapter 04 (`[^np11-amp-post]`, Oct 30) | Chapter 04's log |
| 30 | Guide gates, rollback table, evidence mapping, deactivation and token lifetime, SQL Server and AI agent sections | Throughout | carried forward from the implementation guide | Implementation guide |
| 31 | The safe order, the go/no-go criteria, PIM-eligible over standing roles, the settings file's no-secret rule, the 15-minute wait, the 14-day report-only window per wave, AU-6, CA-7, CM-3 and CP-10 for the smoke test, drift and rollback | Throughout | *Design guidance*; the 14 days follow Chapter 08's second lab | program |
| 32 | Dry-run output, including the evidence lines, the go/no-go evidence check and the smoke test's record | Dry run section | real output on the fixtures, November 2, 2026 | local run |
| 33 | FedRAMP 20x KSIs: 46 indicators in ten themes; the eleven IDs used exist with the names given; their related controls (KSI-IAM-SNU: AC-2, AC-6(5), IA-5(2), AU-10 among others; KSI-CMT-VTD: CM-3, CM-3(2), CM-4(2); KSI-MLA-EVC: CA-7, CM-2, CM-6; KSI-MLA-OSM: AU-9 among others; KSI-RPL-ABO: CP-10 among others); changelog last dated October 13, 2026 | Requirements, KSIs and evidence; every requirements table; Verified facts | verified | FedRAMP, Key Security Indicators, read Nov 2, 2026 |
| 34 | KSIs are provider indicators; the agency authorizes its own system and lines its evidence up with them | Requirements, KSIs and evidence | carried forward | Book 00, Appendix B |
| 35 | Control-to-KSI pairings (AC-2 to KSI-IAM-SNU and KSI-PIY-GIV, AC-6 to KSI-IAM-ELP and KSI-IAM-JIT, IA-5 non-user to KSI-IAM-SNU, AU-2 to KSI-MLA-LET, CM-3 and CM-4(2) to KSI-CMT-LMC and KSI-CMT-VTD, CM-8 to KSI-PIY-GIV, CA-7 to KSI-MLA-EVC, AU-9 to KSI-MLA-OSM, CP-10 to KSI-RPL-ABO) | Every requirements table; `config/requirements-ch11.json` | carried forward from Book 02, Chapter 10 and Book 13, Appendix A; IA-9 (tailored in) and the PF-03/PF-04 license rows have no FedRAMP related-control match and are the program's reading | Book 02; Book 13; FedRAMP |
| 36 | OMB M-22-09 §III.A (enterprise-managed identities); BOD 25-01 and which SCuBA policies it requires | Requirements tables for 1.1, 1.2, the smoke test | carried forward (footnotes accessed Oct 21, 2026, not re-read); MS.AAD.5.5v1 to 5.7v1 are SHOULD, not BOD 25-01 required, as the guide records | Attribute-Driven Migration guide; Book 11; implementation guide |
| 37 | The evidence records: per-step JSON with time, environment, command, result, controls and KSIs; run folders re-hashed against their manifests; SHA256SUMS; the go/no-go check | The code; Step 1.7; go/no-go row 9 | *Design guidance*; tested in `deploy/tests/NpiDeploy.Tests.ps1` | program |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| Implementation guide: prerequisites (roles, licenses), the six gates, Step 5's parallel run, the rollback table, evidence, dangers, SQL Server, AI agents | Before you start; each step's gate; Step 1.8; Step 2.6; Evidence; Dangers | The guide's SQL Server work goes to the Data Platform plan (Step 1.1 lists the handoff file); AI agents stay with Chapter 09 (Step 1.5) |
| Chapter 01, inventory | Step 1.1, Step 1.6 | — |
| Chapter 02, ownership | Step 1.1 | The orphan plan isn't applied in this runbook |
| Chapter 03, Workload ID plan IDs and D-NP4 | PF-03; the scope file's licensing record | — |
| Chapter 04, the policy file, plan and write path | Step 1.2 (plan), Step 2.2 (apply); the pilot policy's restrictions | Rotation is Chapter 04's own process, not a deployment step |
| Chapter 05, conversions, exchange test, parallel run and day-31 disable | Step 1.3, Step 2.2 | — |
| Chapter 06, the Kerberos island plan | Named as the production path for existing accounts | The runbook installs one new gMSA with Learn's commands |
| Chapter 07, least privilege | — | Not a deployment step; the reader app's permissions are checked by PF-05 |
| Chapter 08, scope file, plan, report-only creation, sign-in summary, enforcement | Step 1.5, Step 2.3, go/no-go row 4 | — |
| Chapter 09, AI agents | Named as out of scope for this runbook | Agent Conditional Access is preview |
| Chapter 10, drift run and packages | Step 2.5 | — |
| Validation kit, NPI track | Pre-flight checks, step 1; Step 1.8 | — |

## Held items after the baseline (November 9, 2026)

Test results on November 9, 2026, Windows 11, PowerShell 7 with Pester 5.9.0: `deploy/tests/NpiDeploy.Tests.ps1` 55 passed; the kit 513 passed.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| H1 | Conditional Access is enabled ring by ring, Chapter 08's word; wave stays for a conversion wave (the pilot's `wave = 1`, ST-02, Chapter 04's fixes). The kit renamed with it: the settings file's `rings` and each policy's `ring`, `-Ring` on the smoke test and the rollback (`-Wave` kept as an alias), the manifests' `rings`, and Step 2.3's record, now `S2.3-staged-enable-by-ring.json`. Step 2.3's heading keeps its old anchor, `#step-23-staged-enable-by-wave`, as an explicit id | Throughout; Step 2.3 | restated-as-design (labeled) | Chapter 08; the project plan's NP5.3 |
| H2 | The pilot's application owner is a settings value, `pilot.ownerUpn`, which records the cutover and approves the day-31 disable; the settings check refuses a file without one or one that names an operator | Approvals; the settings file's rules; Steps 1.3 and 2.2 | restated-as-design (labeled): the Approvals table's owner, now separate from the operators in the file | Chapter 05, the cutover log |
