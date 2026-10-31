# Non-person identity as code

Code for the [developer workbook *Building Non-Person Identity*](../../docs/project-plans/developer-workbooks/non-person-identity/index.md), the code-first companion to the [Non-Person Identity Modernization project plan](../../docs/project-plans/non-person-identity.md).

- **Chapter 01, the register:** Active Directory user accounts used as service accounts, MSAs, gMSAs and dMSAs; app registrations, service principals, managed identities and federated credentials; Microsoft Graph application permissions and delegated consent grants. Each row gets an owner count, its credential kind, a risk (HIGH = password never expires or over-privileged), a candidate target and, for SQL Server accounts, a hand-off to the Data Platform plan. Findings NPI-INV-01 to NPI-INV-09. Read only.
- **Chapter 02, ownership and the orphan rule:** the register checked against the ownership rule (two enabled human members as owners, a service-management reference that names an active record, an application owner for every AD account), findings NPI-OWN-01 to NPI-OWN-09, and the orphan rule (D-N2) as a dry-run plan. The plan is applied only by `Invoke-NpiOrphanAction.ps1 -Apply`, a separate, delegated write path that checks the plan's approved SHA-256.
- **Chapter 03, the migration path matrix:** a proposed target per account from Book 02's matrix (`config/migration-matrix.json`), the owner's disposition checked, waves with HIGH-risk accounts first and a rollback per wave, the Workload ID Premium decision (D-N4) checked against the tenant's licenses, and Gate 2. Findings NPI-MAT-01 to NPI-MAT-09. Read only.
- **Chapter 04, app management policies and certificate rotation:** the tenant default and app-specific policies and the app instance property lock compared with `config/app-management-policy.json`, a plan that never loosens or drops a restriction, and one rotation step per certificate in Key Vault (`config/rotation.json`). Applied only by `Invoke-NpiCredentialAction.ps1 -Apply`.
- **Chapter 05, workload identity federation and managed identities:** conversions in the plan's order (managed identity, then federated credential, then certificate), each credential's issuer, subject and audience checked before cutover, a token exchange test against a fake endpoint, and the 30-day parallel run before the legacy account is disabled, never deleted.
- **Chapter 06, gMSAs, dMSAs and the Kerberos island:** the KDS root key and gMSA hosts read, MSA, gMSA and dMSA moves as a reviewed plan, the island list with SPN owners and end dates for the program's SPN retirement, and the reconciliation with the provisional end state. Applied only by `Invoke-NpiKerberosIslandAction.ps1 -Apply`; no account is deleted.
- **Chapter 07, least privilege for service principals:** every service principal's application permissions, delegated grants and directory roles, and each managed identity's Azure role assignments, checked against `config/least-privilege.json`, privileged principals handed to the Privileged Access plan, the quarterly owner review, and a plan that only removes one app role assignment or narrows one grant. Applied only by `Invoke-NpiLeastPrivilegeAction.ps1 -Apply`.
- **Chapter 08, Conditional Access for workload identities:** the scope file, CA015 and CA037 per ring created report-only, a pre-merge check (NPI-WCA-01 to NPI-WCA-09), a summary of service principal sign-ins (Graph beta), and enforcement only with `-AllowEnforce`, a D-N5 record and a reviewed summary.
- **Chapter 09, AI agent identities (preview):** agent identity blueprints and agent identities checked against the production handshake, credentials, least privilege, sponsors and drift rules, the D-N6 mode (`config/agent-id-capabilities-ch09.json`), and the two agent block policies created report-only by `Invoke-NpiAgentCaAction.ps1`.
- **Chapter 10, drift and evidence:** Chapters 01 and 02 run again and compared with an approved baseline (NPI-DRF-01 to NPI-DRF-09), the review records from Chapters 07 and 09 (NPI-REV-01 to NPI-REV-04), the annual vintage comparison (`Invoke-NpiVintage.ps1`), and the input contract for the other chapters' findings (`docs/ch10-contract.md`). The evidence package is written by `examples/drift-pipeline`.

Illustrative: tested against fixtures and fakes of Microsoft Graph, Resource Manager and Active Directory, not against a production tenant or domain.

## Start with Microsoft's samples

The chapters start from Learn's own procedures and scripts, pinned unmodified in [`../third_party/entra-service-account-pages`](../third_party/entra-service-account-pages/SNAPSHOT.md), [`../third_party/entra-app-credentials-export-page`](../third_party/entra-app-credentials-export-page/SNAPSHOT.md) and [`../third_party/graph-applications-tutorial-page`](../third_party/graph-applications-tutorial-page/SNAPSHOT.md). `tests/MicrosoftSamples.Tests.ps1` runs them offline against stand-ins and pins what they do and leave out. The chapters' gap tables cite those tests.

## Layout

```
Invoke-NpiAgentCaAction.ps1
Invoke-NpiAgentId.ps1
Invoke-NpiCredentialAction.ps1
Invoke-NpiCredentialPolicy.ps1
Invoke-NpiDriftRun.ps1
Invoke-NpiFederation.ps1
Invoke-NpiInventory.ps1
Invoke-NpiKerberosIsland.ps1
Invoke-NpiKerberosIslandAction.ps1
Invoke-NpiLeastPrivilege.ps1
Invoke-NpiLeastPrivilegeAction.ps1
Invoke-NpiMatrix.ps1
Invoke-NpiOrphanAction.ps1
Invoke-NpiOwnership.ps1
Invoke-NpiRotation.ps1
Invoke-NpiVintage.ps1
Invoke-NpiWorkloadCa.ps1
config/calls.json                       Chapters 01 and 02: every call and task, with its least-privileged permission, Azure role or AD right and Learn page
config/calls-chNN.json                  the same for Chapters 03 to 10, one file per chapter
config/                                 the reviewed data each chapter reads (register rules, matrix, policies, rotation, least privilege, agent rules, drift)
powershell/NpiAgentId/
powershell/NpiCore/
powershell/NpiCredentialPolicy/
powershell/NpiDrift/
powershell/NpiFederation/
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
tests/NpiInventory.Tests.ps1
tests/NpiKerberosIsland.Tests.ps1
tests/NpiLeastPrivilege.Tests.ps1
tests/NpiLeastPrivilegeSamples.Tests.ps1
tests/NpiMatrix.Tests.ps1
tests/NpiMatrixSampleHarness.ps1
tests/NpiOwnership.Tests.ps1
tests/NpiWorkloadCa.Tests.ps1
tests/SentinelRuleHarness.ps1
tests/fixtures/                         a fictional estate (contoso.example, corp.contoso.example); one folder per chapter from 03
```

## Permissions

`Get-NpiRequiredPermission -Task <task>` prints a task's needs. Each chapter's tests keep every task's declaration equal to the union of its calls, and each call names the Learn page that states its permission; the pages were read on October 30, 2026. This table is generated from the call lists.

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
| `kerberos-apply` | 06 | write, delegated only (A person signed in to the domain with the rights above, never a scheduled job or a service account) | none | none | Create msDS-GroupManagedServiceAccount objects: Domain Admins or Enterprise Admins, or a delegated create right; Delegated right to disable accounts in the account's OU; Delegated read of msKds-ProvRootKey objects in CN=Master Root Keys (List Contents; Read msKds-UseStartTime and msKds-CreateTime, never msKds-RootKeyData): the class's default security descriptor grants Enterprise Admins, Domain Admins and SYSTEM only; Domain Admins or Enterprise Admins, or equivalent permissions, to create or migrate to a dMSA, against a read-write domain controller; Read (default for authenticated domain users); Write msDS-GroupMSAMembership on the managed service account |
| `least-privilege` | 07 | read | `Application.Read.All`, `Directory.Read.All`, `RoleManagement.Read.Directory` | `Reader` | none |
| `least-privilege-apply` | 07 | write, delegated only (Privileged Role Administrator) | `AppRoleAssignment.ReadWrite.All`, `Application.Read.All`, `DelegatedPermissionGrant.ReadWrite.All`, `Directory.Read.All` | none | none |
| `wca-read` | 08 | read | `Application.Read.All`, `Policy.Read.All` | none | none |
| `wca-signins` | 08 | read | `AuditLog.Read.All`, `Policy.Read.ConditionalAccess` | none | none |
| `wca-apply` | 08 | write | `Application.Read.All`, `Policy.Read.All`, `Policy.ReadWrite.ConditionalAccess` | none | none |
| `agent-id` | 09 | read | `AgentIdentity.Read.All`, `AgentIdentityBlueprint.Read.All`, `Application.Read.All`, `AuditLog.Read.All`, `CustomSecAttributeAssignment.Read.All`, `LifecycleWorkflows-Workflow.Read.All`, `LifecycleWorkflows-Workflow.ReadBasic.All`, `Policy.Read.All`, `RoleManagement.Read.Directory`, `User.Read.All` | none | none |
| `agent-ca-apply` | 09 | write, delegated only (Conditional Access Administrator) | `Policy.Read.All`, `Policy.ReadWrite.ConditionalAccess` | none | none |
| `drift` | 10 | read | `AuditLog.Read.All` | none | none |

## Clouds

`-Cloud` is required: `gcc` (and `global`) use the worldwide endpoints, `graph.microsoft.com`, `login.microsoftonline.com` and commercial `management.azure.com`, as Microsoft 365 GCC with commercial Azure does. `gcchigh` and `dod` use `graph.microsoft.us` and `dod-graph.microsoft.us` with Azure Government's `management.usgovcloudapi.net`. Any other name throws. The live invoker refuses to run if the Graph or Azure session is in another cloud or another tenant.

## Run the tests

```powershell
Invoke-Pester -Path tests
```

PowerShell 7.1 or later and Pester 5. No module, tenant, domain or network is needed.
