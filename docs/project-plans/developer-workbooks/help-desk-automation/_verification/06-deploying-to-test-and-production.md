# Verification — Chapter 06, Deploying to Test and Production

New material, written November 27, 2026. Code: `deploy/` (both settings templates, `Invoke-HtScheduledRun.ps1`, `Register-HtScheduledJobs.ps1`, `Invoke-HtRequestPipeline.ps1`, `Register-HtRequestPipeline.ps1`, `eventlog-dcr.json`). Learn pages read November 27, 2026 with WebFetch: *New-AzResourceGroupDeployment*, *Remove-AzDataCollectionRuleAssociation*, *Remove-AzDataCollectionRule*, *Update user*. The others are carried from *Building Provider Notices*, Chapter 08 and *Building Non-Person Identity*. This chapter is a runbook with no Lab headings, so `kit_captures.py` doesn't capture it; the "Dry run on the kit's fixtures" outputs were printed by the kit's scripts on November 27, 2026 on Windows 11, PowerShell 7.6, in a scratch copy of the kit. Every live result is labeled **Expected** and has not been seen.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | GCC uses `graph.microsoft.com` | Depends on | carried | `ht06-deployments` |
| 2 | `Install-ADServiceAccount`, `Test-ADServiceAccount`; Task Scheduler with a gMSA | Step 1.1 | carried (PN Ch08, Nov 25) | `ht06-gmsa` |
| 3 | `New-ScheduledTaskPrincipal -LogonType` | Step 1.7 | carried (PN Ch08) | `ht06-principal` |
| 4 | `Register-ScheduledTask`, `Unregister-ScheduledTask -Confirm:$false` | Steps 1.7, 1.10 | carried (PN Ch08) | `ht06-tasks` |
| 5 | List a service principal's appRoleAssignments | Step 1.2 | carried (NPI, Oct 30) | `ht06-approles` |
| 6 | App-only password reset needs at least User Administrator | Step 1.2 | verified Nov 27 | `ht06-update` |
| 7 | `New-AzResourceGroupDeployment -TemplateParameterObject`, `-WhatIf` | Step 1.6 | verified Nov 27 | `ht06-deploy` |
| 8 | `Remove-AzDataCollectionRuleAssociation -AssociationName -ResourceUri`; `Remove-AzDataCollectionRule -Name -ResourceGroupName`; Learn's example deletes a rule with no association | Step 1.10 | verified Nov 27 | `ht06-dcr` |
| 9 | `icacls` grants | Step 1.3 | carried; design guidance | `ht06-icacls` |
| 10 | Dry-run outputs | Dry run | printed by the kit Nov 27 | kit |
| 11 | The association's name, `<rule>-association` | Step 1.10 | read in `eventlog-dcr.json` | kit |

## Not yet specified

N1 how to set an environment variable visible only to a gMSA (WD-182 says the secrets are environment variables "for its gMSA"; a gMSA never signs in interactively, and a machine-level variable is readable by every process); N2 *Log on as a batch job* for the gMSAs; N3 registering a task under a gMSA with `-LogonType Password` (carried from PN Ch08's same gap); N4 the Azure role for the rule's deployment; N5 the SailPoint token question (Chapter 05).

## Gaps reported to the owner

- Book 10, Appendix B lists the estate inventory's identities but not yet the help desk jobs, the pipeline, `gmsa-fmphelpdesk$` or the two apps, which WD-181 and WD-182 require before the first run. The runbook makes it an approval before Step 1.7; it doesn't edit Appendix B.
- N1 above may need a decision: a machine-level variable, a DPAPI-protected file only the gMSA can read, or a vault.

## Overlap search (origin/main, November 27, 2026)

Searched for "platform host", "gmsa-fmpassess", "gmsa-fmphelpdesk", "Register-ScheduledTask", "credential folder", "WD-181", "WD-182", "WD-183". Found: the platform host guide (the host itself; linked), Book 10, Appendix B (the host's interfaces; linked; see the gap above), *Building Provider Notices*, Chapter 08 (the same scheduled-task pattern; facts carried), the estate inventory's README (the same assessment gMSA; consistent). No conflicting fact.
