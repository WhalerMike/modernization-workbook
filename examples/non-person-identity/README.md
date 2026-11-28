# Non-person identity as code

Code for the [developer workbook *Building Non-Person Identity*](../../docs/project-plans/developer-workbooks/non-person-identity/index.md), the code-first companion to the [Non-Person Identity Modernization project plan](../../docs/project-plans/non-person-identity.md).

- **Chapter 01, the register:** Active Directory user accounts used as service accounts, MSAs, gMSAs and dMSAs; app registrations, service principals, managed identities and federated credentials; Microsoft Graph application permissions and delegated consent grants. Each row gets an owner count, its credential kind, a risk (HIGH = password never expires or over-privileged), a candidate target and, for SQL Server accounts, a hand-off to the Data Platform plan. Findings NPI-INV-01 to NPI-INV-09. Read only.
- **Chapter 02, ownership and the orphan rule:** the register checked against the ownership rule (two enabled human members as owners, a service-management reference that names an active record, an application owner for every AD account), findings NPI-OWN-01 to NPI-OWN-09, and the orphan rule (D-NP2) as a dry-run plan. The plan is applied only by `Invoke-NpiOrphanAction.ps1 -Apply`, a separate, delegated write path that checks the plan's approved SHA-256.
- **Chapter 03, the migration path matrix:** a proposed target per account from Book 02's matrix (`config/migration-matrix.json`), the owner's disposition checked, waves with HIGH-risk accounts first and a rollback per wave, the Workload ID Premium decision (D-NP4) checked against the tenant's licenses, and Gate 2. Findings NPI-MAT-01 to NPI-MAT-09. Read only.
- **Chapter 04, app management policies and certificate rotation:** the tenant default and app-specific policies and the app instance property lock compared with `config/app-management-policy.json`, a plan that never loosens or drops a restriction, and one rotation step per certificate in Key Vault (`config/rotation.json`). Applied only by `Invoke-NpiCredentialAction.ps1 -Apply`.
- **Chapter 05, workload identity federation and managed identities:** conversions in the plan's order (managed identity, then federated credential, then certificate), each credential's issuer, subject and audience checked before cutover, a token exchange test against a fake endpoint, and the 30-day parallel run before the legacy account is disabled, never deleted.
- **Chapter 06, gMSAs, dMSAs and the Kerberos island:** the KDS root key and gMSA hosts read, MSA, gMSA and dMSA moves as a reviewed plan, the island list with SPN owners and end dates for the program's SPN retirement, and the reconciliation with the provisional end state. New gMSAs follow the reviewed AD standard in `ad-standard.json` (WD-159 to WD-161): named `gmsa-<app>` or `dmsa-<app>`, created in the service-account OU with the password interval and, where the old account had no SPN, outbound-only; a gMSA's retriever is one `DL-gMSA-<app>-Hosts` group, never a computer. Every write carries its SailPoint request and ServiceNow change, or it's blocked (NPI-KRB-10). Applied only by `Invoke-NpiKerberosIslandAction.ps1 -Apply -RunAs Pipeline|Person`: the pipeline's gMSA (`gmsa-msapipe$`) sends the gMSA creations, retriever changes, disables and moves to the holding OU; a person sends the dMSA steps (WD-163). A change to an existing account (the request pack's change request: a host, an SPN, the tier or the end date) is planned one approved request at a time by `Invoke-NpiKerberosChange.ps1` and applied the same way; a person sends those writes while WD-185, a draft, is undecided. No account is deleted.
- **Chapter 07, least privilege for service principals:** every service principal's application permissions, delegated grants and directory roles, and each managed identity's Azure role assignments, checked against `config/least-privilege.json`, privileged principals handed to the Privileged Access plan, the quarterly owner review, and a plan that only removes one app role assignment or narrows one grant. Applied only by `Invoke-NpiLeastPrivilegeAction.ps1 -Apply`.
- **Chapter 08, Conditional Access for workload identities:** the scope file, CA015 and CA037 per ring created report-only, a pre-merge check (NPI-WCA-01 to NPI-WCA-09), a summary of service principal sign-ins (Graph beta), and enforcement only with `-AllowEnforce`, a D-NP5 record and a reviewed summary.
- **Chapter 09, AI agent identities (preview):** agent identity blueprints and agent identities checked against the production handshake, credentials, least privilege, sponsors and drift rules, the D-NP6 mode (`config/agent-id-capabilities-ch09.json`), and the two agent block policies created report-only by `Invoke-NpiAgentCaAction.ps1`.
- **Chapter 10, drift and evidence:** Chapters 01 and 02 run again and compared with an approved baseline (NPI-DRF-01 to NPI-DRF-09), the review records from Chapters 07 and 09 (NPI-REV-01 to NPI-REV-04), the annual vintage comparison (`Invoke-NpiVintage.ps1`), and the input contract for the other chapters' findings (`docs/ch10-contract.md`). The evidence package is written by `examples/drift-pipeline`.
- **Chapter 11, deploying to test and production:** the runbook's own code in `deploy/`: one environment settings file per stage (`deploy/settings.template.json`; names and IDs only, never a secret), a read-only preflight (`deploy/Test-NpiDeployPreflight.ps1`: licenses, the deployment identity's credential, the reader's permissions, the operators' roles, the pilot and synthetic objects, the VK-NPI baseline, and in production the test stage's evidence), a smoke test with a synthetic service principal and service account (`deploy/Invoke-NpiDeploySmokeTest.ps1`), and a rollback plan applied only with an approved SHA-256 and `-Apply` (`deploy/Invoke-NpiDeployRollback.ps1`; PATCH and enable or disable only, never a delete). Each writes an evidence record per step (time, environment, command, result, and the SP 800-53 controls and FedRAMP 20x KSIs from `config/requirements-ch11.json`) to an `evidence` folder with a `SHA256SUMS`; `deploy/Write-NpiDeployEvidence.ps1` records the steps that run earlier chapters' scripts, and `deploy/Test-NpiDeployEvidence.ps1` checks a stage's coverage before promotion. The smoke-test gMSA (`gmsa-npismoke`) is created through a one-account Chapter 06 plan (`deploy/New-NpiDeploySmokeGmsaPlan.ps1`), applied with Chapter 06's write path, not by hand (WD-168). Each has a fixture mode (`-FixturePath`) that sends nothing; `deploy/tests/NpiDeploy.Tests.ps1` runs them against a fictional test and production tenant.
- **Chapter 12, the managed service account standard:** approved requests exported from SailPoint (reached through the agency's system access management tool) checked against the naming, owner, retriever-group and outbound-only rules, with Chapter 06's `kerberos-replatform.csv` rows and `password-retrievers.json` entries written for those that pass; SailPoint's aggregated AD accounts reconciled with a read of every gMSA and dMSA; certifications due by risk tier, each REVOKE turned into a typed ServiceNow finding; Defender for Identity's service account list compared with the register; and the 90-day retirement list for a person to act on. Findings NPI-STD-01 to NPI-STD-29, and an `evidence.json` row per step and control (`config/requirements-ch12.json`). Read only; nothing is deleted.
- **Chapter 13, workload identity across AWS GovCloud (US) and OCI:** the files the implementation guide's Steps 1g and 1h write (the IAM credential report, access keys, service-specific credentials, roles and their trust policies, instance profiles, OIDC providers and IAM Roles Anywhere trust anchors and profiles; OCI users with their API signing keys, auth tokens and customer secret keys, dynamic groups and policies), two of which (`iam-tags.json`, `roles-anywhere-crls.json`) the kit treats as optional, warning without them. The tag keys are `SystemId`, `Owner1`, `Owner2` and `Sponsor` (WD-172); the validation kit's VK-NPI-10 checks the gate criteria from the same files. Long-lived credentials with their age, last use and exception; identities without a system ID, two owners and a sponsor; roles trusting OIDC providers, other accounts or `*`; trust anchors with no imported CRL; dynamic groups and broad policy statements. Findings NPI-AWS-01 to NPI-AWS-16 and NPI-OCI-01 to NPI-OCI-10, and an `evidence.json` row per step and control (`config/requirements-ch13.json`). Read only and offline: it never runs the AWS CLI or the OCI CLI and calls no AWS or OCI API; `config/calls-ch13.json` lists the read-only export commands an operator runs.

Illustrative: tested against fixtures and fakes of Microsoft Graph, Resource Manager and Active Directory, not against a production tenant or domain. Nobody has run Chapter 11's deployment code against a live tenant, subscription or forest.

## Start with Microsoft's samples

The chapters start from Learn's own procedures and scripts, pinned unmodified in [`../third_party/entra-service-account-pages`](../third_party/entra-service-account-pages/SNAPSHOT.md), [`../third_party/entra-app-credentials-export-page`](../third_party/entra-app-credentials-export-page/SNAPSHOT.md) and [`../third_party/graph-applications-tutorial-page`](../third_party/graph-applications-tutorial-page/SNAPSHOT.md). `tests/MicrosoftSamples.Tests.ps1` runs them offline against stand-ins and pins what they do and leave out. The chapters' gap tables cite those tests.

## Layout

```
Invoke-NpiAgentCaAction.ps1
Invoke-NpiAgentId.ps1
Invoke-NpiCloudWorkload.ps1
Invoke-NpiCredentialAction.ps1
Invoke-NpiCredentialPolicy.ps1
Invoke-NpiDriftRun.ps1
Invoke-NpiFederation.ps1
Invoke-NpiGmsaStandard.ps1
Invoke-NpiInventory.ps1
Invoke-NpiKerberosIsland.ps1
Invoke-NpiKerberosIslandAction.ps1
Invoke-NpiKerberosChange.ps1
Invoke-NpiLeastPrivilege.ps1
Invoke-NpiLeastPrivilegeAction.ps1
Invoke-NpiMatrix.ps1
Invoke-NpiOrphanAction.ps1
Invoke-NpiOwnership.ps1
Invoke-NpiRotation.ps1
Invoke-NpiVintage.ps1
Invoke-NpiWorkloadCa.ps1
config/calls.json                       Chapters 01 and 02: every call and task, with its least-privileged permission, Azure role or AD right and Learn page
config/calls-chNN.json                  the same for Chapters 03 to 12, one file per chapter
config/                                 the reviewed data each chapter reads (register rules, matrix, policies, rotation, least privilege, agent rules, drift)
deploy/NpiDeploy.psm1                   Chapter 11: settings, preflight, smoke test and rollback
deploy/Test-NpiDeployPreflight.ps1
deploy/Invoke-NpiDeploySmokeTest.ps1
deploy/Invoke-NpiDeployRollback.ps1
deploy/New-NpiDeploySmokeGmsaPlan.ps1    the smoke-test gMSA as a one-account Chapter 06 plan
deploy/settings.template.json           the environment settings file, with a placeholder for every value
deploy/Write-NpiDeployEvidence.ps1
deploy/Test-NpiDeployEvidence.ps1
deploy/tests/NpiDeploy.Tests.ps1        Chapter 11's Pester tests, run by tests/test_deploy.py (kept out of tests/ so the chapters' Lab 1 count holds)
config/requirements-ch11.json           Chapter 11: controls, other requirements and KSIs per check and step
config/calls-ch12.json                  Chapter 12: its one AD read, std-managed-accounts (Get-ADServiceAccount)
config/requirements-ch12.json           Chapter 12: controls and KSIs per step
config/calls-ch13.json                  Chapter 13: the read-only AWS CLI and OCI CLI export commands an operator runs; the module runs none
config/requirements-ch13.json           Chapter 13: controls and KSIs per step
powershell/NpiAgentId/
powershell/NpiCloudWorkload/
powershell/NpiCore/
powershell/NpiCredentialPolicy/
powershell/NpiDrift/
powershell/NpiFederation/
powershell/NpiGmsaStandard/
powershell/NpiInventory/
powershell/NpiKerberosIsland/
powershell/NpiLeastPrivilege/
powershell/NpiMatrix/
powershell/NpiOwnership/
powershell/NpiWorkloadCa/
tests/AgentIdSampleHarness.ps1
tests/CredentialPolicySampleHarness.ps1
tests/FederationSampleHarness.ps1
tests/KerberosIslandSampleHarness.ps1
tests/KerberosIslandSamples.Tests.ps1
tests/LearnSampleHarness.ps1
tests/LeastPrivilegeSampleHarness.ps1
tests/MicrosoftSamples.Tests.ps1
tests/NpiAgentId.Tests.ps1
tests/NpiCredentialPolicy.Tests.ps1
tests/NpiDrift.Tests.ps1
tests/NpiFederation.Tests.ps1
tests/NpiFederationSamples.Tests.ps1
tests/NpiGmsaStandard.Tests.ps1
tests/NpiInventory.Tests.ps1
tests/NpiKerberosIsland.Tests.ps1
tests/NpiLeastPrivilege.Tests.ps1
tests/NpiLeastPrivilegeSamples.Tests.ps1
tests/NpiMatrix.Tests.ps1
tests/NpiMatrixSampleHarness.ps1
tests/NpiOwnership.Tests.ps1
tests/NpiWorkloadCa.Tests.ps1
tests/SentinelRuleHarness.ps1
tests/test_deploy.py
tests/test_cloud_workload.py            runs tests-ch13/NpiCloudWorkload.Tests.ps1 (kept out of tests/ for the same reason)
tests-ch13/NpiCloudWorkload.Tests.ps1   Chapter 13's Pester tests
tests/test_first_gmsa.py                runs tests-m15/NpiFirstGmsa.Tests.ps1 (kept out of tests/ for the same reason)
tests-m15/NpiFirstGmsa.Tests.ps1        the learning path's Module 15: a new gMSA for a new workload (fixtures in tests/fixtures/m15)
tests/test_msa_change.py                runs tests-msa-change/NpiMsaChange.Tests.ps1 (kept out of tests/ for the same reason)
tests-msa-change/NpiMsaChange.Tests.ps1 a change to an existing account: Chapter 12's check and Chapter 06's change plan (fixtures in tests/fixtures/ch06/change)
tests/fixtures/                         a fictional estate (contoso.example, corp.contoso.example); one folder per chapter from 03
```

## Permissions

`Get-NpiRequiredPermission -Task <task>` prints a task's needs. Each chapter's tests keep every task's declaration equal to the union of its calls, and each call names the Learn page that states its permission; the pages were read on October 30, 2026 (Chapter 11's on November 2, 2026). This table is generated from the call lists.

| Task | Chapter | Mode | Microsoft Graph | Azure | Active Directory |
|---|---|---|---|---|---|
| `inventory` | 01 | read | `Application.Read.All`, `Directory.Read.All` | `Reader` | Read (default for authenticated domain users) |
| `ownership` | 02 | read | `User.Read.All` | none | none |
| `orphan-apply` | 02 | write, delegated only (Cloud Application Administrator) | `Application.Read.All`, `Application.ReadWrite.All`, `Directory.Read.All`, `User.Read.All` | none | Delegated right to disable accounts in the account's OU; Read (default for authenticated domain users) |
| `migration-matrix` | 03 | read | `LicenseAssignment.Read.All`, `User.Read.All` | none | none |
| `app-policy` | 04 | read | `Application.Read.All`, `Policy.Read.All` | none | none |
| `policy-apply` | 04 | write, delegated only (Cloud Application Administrator) | `Application.Read.All`, `Application.ReadWrite.All`, `Policy.Read.All`, `Policy.ReadWrite.ApplicationConfiguration` | none | none |
| `rotation` | 04 | read | `Application.Read.All`, `User.Read.All` | `Key Vault Reader` | none |
| `rotation-apply` | 04 | write, delegated only (Cloud Application Administrator) | `Application.Read.All`, `Application.ReadWrite.All` | `Key Vault Certificates Officer`, `Key Vault Reader` | none |
| `federation` | 05 | read | `Application.Read.All`, `AuditLog.Read.All` | `Reader` | Read (default for authenticated domain users) |
| `federation-apply` | 05 | write, delegated only (Cloud Application Administrator) | `Application.Read.All`, `Application.ReadWrite.All` | `Managed Identity Contributor`, `Reader` | Delegated right to disable accounts in the account's OU; Read (default for authenticated domain users) |
| `kerberos-island` | 06 | read | none | none | Delegated read of msKds-ProvRootKey objects in CN=Master Root Keys (List Contents; Read msKds-UseStartTime and msKds-CreateTime, never msKds-RootKeyData): the class's default security descriptor grants Enterprise Admins, Domain Admins and SYSTEM only; Read (default for authenticated domain users) |
| `kerberos-apply` | 06 | write, per call: `runBy` pipeline (the pipeline's gMSA `gmsa-msapipe$`, with only the delegated rights on the service-account OUs: create gMSAs, retrievers, disable, move) or person (the dMSA steps, Domain Admins); `-RunAs Pipeline` or `-RunAs Person`, a person sending a pipeline step only with `-TestDomain` | none | none | Create msDS-GroupManagedServiceAccount objects in the service-account OU: the right delegated there to DL-gMSA-Creators (the pipeline's gMSA is a member), or Domain Admins; Delegated right to disable accounts in the account's OU; Delegated right to move objects from the account's OU into the holding OU; Delegated read of msKds-ProvRootKey objects in CN=Master Root Keys (List Contents; Read msKds-UseStartTime and msKds-CreateTime, never msKds-RootKeyData): the class's default security descriptor grants Enterprise Admins, Domain Admins and SYSTEM only; Domain Admins or Enterprise Admins, or equivalent permissions, to create or migrate to a dMSA, against a read-write domain controller; Read (default for authenticated domain users); Write msDS-GroupMSAMembership on the managed service account |
| `least-privilege` | 07 | read | `Application.Read.All`, `Directory.Read.All`, `RoleManagement.Read.Directory` | `Reader` | none |
| `least-privilege-apply` | 07 | write, delegated only (Privileged Role Administrator) | `AppRoleAssignment.ReadWrite.All`, `Application.Read.All`, `DelegatedPermissionGrant.ReadWrite.All`, `Directory.Read.All` | none | none |
| `wca-read` | 08 | read | `Application.Read.All`, `Policy.Read.All` | none | none |
| `wca-signins` | 08 | read | `AuditLog.Read.All`, `Policy.Read.ConditionalAccess` | none | none |
| `wca-apply` | 08 | write | `Application.Read.All`, `Policy.Read.All`, `Policy.ReadWrite.ConditionalAccess` | none | none |
| `agent-id` | 09 | read | `AgentIdentity.Read.All`, `AgentIdentityBlueprint.Read.All`, `Application.Read.All`, `AuditLog.Read.All`, `CustomSecAttributeAssignment.Read.All`, `LifecycleWorkflows-Workflow.Read.All`, `LifecycleWorkflows-Workflow.ReadBasic.All`, `Policy.Read.All`, `RoleManagement.Read.Directory`, `User.Read.All` | none | none |
| `agent-ca-apply` | 09 | write, delegated only (Conditional Access Administrator) | `Policy.Read.All`, `Policy.ReadWrite.ConditionalAccess` | none | none |
| `drift` | 10 | read | `AuditLog.Read.All` | none | none |
| `deploy-preflight` | 11 | read | `Application.Read.All`, `LicenseAssignment.Read.All`, `Policy.Read.All`, `RoleEligibilitySchedule.Read.Directory`, `RoleManagement.Read.Directory` | none | Read (default for authenticated domain users) |
| `deploy-smoke` | 11 | write, delegated only (Cloud Application Administrator): one probe expected to be refused | `Application.Read.All`, `Application.ReadWrite.All`, `AuditLog.Read.All`, `Policy.Read.All` | none | Read (default for authenticated domain users); Run on a host allowed to retrieve the gMSA's password (PrincipalsAllowedToRetrieveManagedPassword) |
| `deploy-rollback` | 11 | write, delegated only (Conditional Access Administrator and Cloud Application Administrator) | `Application.ReadWrite.All`, `Policy.Read.All`, `Policy.ReadWrite.ApplicationConfiguration`, `Policy.ReadWrite.ConditionalAccess` | none | Delegated right to enable and disable accounts in the account's OU |
| `msa-standard` | 12 | read | none | none | Read (default for authenticated domain users) |
| `cloud-workload` | 13 | read, from files only: the operator's read-only AWS and OCI exports | none | none | none |

## Clouds

`-Cloud` is required: `gcc` (and `global`) use the worldwide endpoints, `graph.microsoft.com`, `login.microsoftonline.com` and commercial `management.azure.com`, as Microsoft 365 GCC with commercial Azure does. Any other name throws. The live invoker refuses to run if the Graph or Azure session is in another cloud or another tenant.

## Run the tests

```powershell
Invoke-Pester -Path tests
Invoke-Pester -Path deploy/tests
Invoke-Pester -Path tests-ch13
Invoke-Pester -Path tests-m15
Invoke-Pester -Path tests-msa-change
```

The second line is Chapter 11's suite; `python -m pytest tests` runs it too, as `scripts/run_example_tests.py` does in CI.

PowerShell 7.1 or later and Pester 5. No module, tenant, domain or network is needed.
