# Verification — Chapter 02, Emergency Access Accounts as Code

New material; it replaces no workbook page. Code: `examples/privileged-access` (Chapter 01's module, extended in the same pull request): `Read-PaEmergencyConfig`, `Test-PaEmergencyAccess`, `Get-PaEmergencyQuery`, `New-PaEmergencyAlertRule`, `Find-PaEmergencyActivity`, `Invoke-PaEmergencyCheck.ps1`, the `emergency-access` calls in `config/calls.json`, the fixture tenant's users, methods, exclusion group and Conditional Access policies, `tests/fixtures/signin-export.json`, `tests/fixtures/inputs/emergency-access.json` and `emergency-validations.csv`, the Chapter 02 block of `tests/MicrosoftSamples.Tests.ps1`, and `tests/EmergencyAccess.Tests.ps1`. Pinned sample: `examples/third_party/entra-emergency-access-page` (new), Learn's page source `docs/identity/role-based-access-control/security-emergency-access.md` from MicrosoftDocs/entra-docs at commit `07cb73d6c6380414eecd040ba5e14c1c94d48b66` (October 30, 2026; MIT), with the repository's `LICENSE` and `LICENSE-CODE`. Every file's git blob hash matched the upstream tree at that commit before `snapshot.json` was written. Source-watch feed added: `entra-emergency-access-page-commits` (path to the page, books `DW`).

Test results on October 30, 2026, Windows 11, PowerShell 7.6.9 with Pester 5.5.0: 78 passed across the example; this chapter's are 7 in `MicrosoftSamples.Tests.ps1` and 29 in `EmergencyAccess.Tests.ps1`. The pinned queries were evaluated only over fictional rows by the harness's evaluator; nothing was sent to a workspace.

**Why this sample.** The Learn page is Microsoft's standard for emergency access accounts and the only Microsoft source found for the alert's query; the page's queries are what Microsoft publishes for this task. Searched on October 30, 2026 with the Learn MCP tools. Microsoft Sentinel content for emergency account sign-ins exists outside Learn; it wasn't used, because Learn's page covers the task and the brief puts Learn first.

Microsoft Learn pages opened on October 30, 2026 through the Microsoft Learn MCP tools: Manage emergency access accounts in Microsoft Entra ID (full page); Plan a Privileged Identity Management deployment; Best practices for Microsoft Entra roles; What are non-interactive user sign-ins in Microsoft Entra?; What are the identity logs you can stream to an endpoint?; AADNonInteractiveUserSignInLogs; AuditLogs; Integrate Microsoft Entra logs with Azure Monitor logs; Analyze Microsoft Entra activity logs with Log Analytics; Microsoft.Insights scheduledQueryRules 2023-12-01; List methods; List fido2AuthenticationMethod; Get a user; Working with users in Microsoft Graph; List roleAssignmentScheduleInstances; List group members; Microsoft Entra feature availability.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | The lockout case: every GA and PRA eligible, approval required, no approvers | Why this comes first | verified | Learn, Manage emergency access accounts |
| 2 | The standard: two or more cloud-only accounts on `*.onmicrosoft.com`; passkey or CBA, different from normal admin methods; GA active permanent; exclusion through a dedicated group from policies that block or restrict; report-only needs none; credentials don't expire; monitor sign-in and audit logs; validate at least every 90 days, including no MFA or SSPR on an individual's device | Sample section; PA-EA rules | verified | same |
| 3 | Sample alert: three `SigninLogs` queries; severity 0; threshold greater than 0; at least Monitoring Contributor | Sample section; the alert; Lab 2 | verified in the pinned page source and the rendered page | same; pinned copy |
| 4 | Learn allows individual emergency accounts for administrators as an alternative | Verified facts, differences | verified | same |
| 5 | Zero permanently active assignments except emergency accounts | Why this comes first | verified | Learn, Plan a PIM deployment |
| 6 | Non-interactive sign-ins (token refresh); separate category `NonInteractiveUserSignInLogs`; table `AADNonInteractiveUserSignInLogs` | Gap table; the alert | verified | Learn, non-interactive sign-ins; identity logs to stream; table reference |
| 7 | `AuditLogs` `InitiatedBy` and `TargetResources` are dynamic | Gap table; the alert | verified | Learn, AuditLogs table reference |
| 8 | Diagnostic setting needs Security Administrator and a workspace | The alert; Lab 2 | verified | Learn, Integrate Entra logs with Azure Monitor logs |
| 9 | Log Analytics analysis of activity logs needs Entra ID P1 or P2 | The alert | verified | Learn, Analyze activity logs with Log Analytics |
| 10 | `scheduledQueryRules` 2023-12-01 criteria properties | The alert; Verified facts | verified (template reference); not confirmed for Azure Government (research gaps, row 7) | Learn, ARM template reference |
| 11 | Get a user: `User.Read.All` application; basic profile list | Permissions table | verified | Learn, Get a user; Working with users |
| 12 | List methods: `UserAuthenticationMethod.Read.All`; roles | Permissions table | verified | Learn, List methods |
| 13 | Passkey methods list L4 and L5 | Verified facts | verified | Learn, List fido2AuthenticationMethod |
| 14 | roleAssignmentScheduleInstances filter on `principalId` | Permissions table | verified | Learn, List roleAssignmentScheduleInstances |
| 15 | List Conditional Access policies: `Policy.Read.All`; Global Reader, Security Reader | Permissions table | carried forward from the validation kit's README (VK-CA-01, Learn read October 30, 2026) | Learn, List policies |
| 16 | Passkeys and CBA available in Azure for US Government | Which cloud | verified | Learn, Microsoft Entra feature availability |
| 17 | Graph hosts per cloud | Which cloud | carried forward from the first workbook's Chapter 02 | Learn, national cloud deployments |
| 18 | Sample behavior: all on `SigninLogs`; placeholders; catches interactive by ID; misses non-interactive and audit; UPN query misses a rename; only `kusto` code blocks | Gap table | verified by evaluating the pinned queries over the export; pinned in `MicrosoftSamples.Tests.ps1` | local run |
| 19 | Book 04, Chapter 10's pre-merge check fails report-only policies; Book 04, Chapter 04 says report-only needs no exclusion | The check; differences | verified by reading both chapters on October 30, 2026; open for the owner (research gaps, row 5) | Book 04 |
| 20 | Every enforced policy must exclude; disabled accounts, extra group members are Findings; 5-minute evaluation; no `isfuzzy` | Rules; the alert | restated-as-design (labeled) | — |
| 21 | Lab 1 outputs (7 passed; permission list; 9/0/1; findings; five matched rows; error text; template type, version, severity; 78 tests) | Lab 1 | verified by running the commands as written | local run, October 30, 2026 |
| 22 | Lab 2 behavior (query runs in a workspace; alert fires in two evaluation periods) | Lab 2 | not run against a tenant; research gaps, rows 7 and 8 | — |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| Project plan tasks A0.4, A1.1, decision D-A2, Gate 1 | In this chapter; dangers | Credentials and custody (D-A2) are the CISO's decision; the code checks the method types, not who holds the keys |
| Book 04, Chapter 04 (emergency standard) | The check; differences | Dual custody and the post-use review are procedure, not readable from Graph |
| Book 04, Chapter 06 (emergency access procedure) | Not carried | The invocation procedure is operator material; this chapter alerts on its use |
| Book 04, Chapter 08, Step 0 | Why this comes first | — |
| Book 04, Chapter 10 (pre-merge exclusion check) | PA-EA-08; differences | The pre-merge check reads the repository's files; PA-EA-08 reads the tenant. Chapter 03 (planned) carries the pre-merge check |
| Book 04, Chapter 07 (CA090 report-only emergency policy) | Fixture policy `CA090-Emergency-accounts-Report-sign-ins` | — |
