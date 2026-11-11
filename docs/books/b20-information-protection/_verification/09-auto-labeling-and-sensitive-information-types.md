# Verification — Chapter 09, Auto-Labeling and Sensitive Information Types

Writer: Book 20 build (Nov 11, 2026). Learn pages read: 17. Sources opened Nov 11, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | Classifier ladder and register | The classifier ladder | restated-as-design | Program design | Nov 11, 2026 |
| 2 | EDM values hashed with a salt; match must be a real value; services EDM supports | The classifier ladder; Exact data match | verified | Learn about EDM-based SITs, <https://learn.microsoft.com/purview/sit-learn-about-exact-data-match-based-sits> | Nov 11, 2026 |
| 3 | Primary/supporting elements, proximity; confidence 65/75/85; count pairing (5-10 high, 20+ low) | Confidence, count and proximity | verified | Learn about sensitive information types, <https://learn.microsoft.com/purview/sit-sensitive-information-type-learn-about> | Nov 11, 2026 |
| 4 | confidenceLevel per pattern; recommendedConfidence mandatory per entity | Confidence, count and proximity | verified | Create a custom SIT using PowerShell, <https://learn.microsoft.com/purview/sit-create-a-custom-sensitive-information-type-in-scc-powershell> | Nov 11, 2026 |
| 5 | 300-character proximity for new custom SITs; avoid unlimited proximity | Confidence, count and proximity | verified | Step 1: Configure pattern-based sensitive data detection, <https://learn.microsoft.com/purview/deploymentmodels/depmod-reduce-false-positives-step1> | Nov 11, 2026 |
| 6 | Starting confidence and count table | Confidence, count and proximity | restated-as-design | Program design | Nov 11, 2026 |
| 7 | Unicode XML; New-DlpSensitiveInformationTypeRulePackage -FileData ReadAllBytes; 10 rule packages; ~770 KB; validation failures (capturing groups, lookaround, generic quantifiers) | Custom types as code | verified | Create a custom SIT using PowerShell | Nov 11, 2026 |
| 8 | Rule package XML structure (RulePackage, RulePack, Version, Publisher, Details, Rules, Entity, Pattern, Regex, Keyword, LocalizedStrings) | Custom types as code | verified | Same (schema and examples) | Nov 11, 2026 |
| 9 | Test-DataClassification usage | Custom types as code | verified | Create an EDM SIT schema and rule package (new experience), Recommendations | Nov 11, 2026 |
| 10 | Set-DlpSensitiveInformationTypeRulePackage to update | Custom types as code | verified | Modify a custom SIT using PowerShell | Nov 11, 2026 |
| 11 | New/changed SIT doesn't reclassify unchanged content; on-demand classification | Custom types as code | verified | Create a custom SIT using PowerShell, "Recrawl your content" | Nov 11, 2026 |
| 12 | Two-computer method; same agent version; EDM_DataUploaders; Groups Administrator least privilege; per-cloud agents; command syntax | Exact data match | verified | Hash and upload the sensitive information source table, <https://learn.microsoft.com/purview/sit-get-started-exact-data-match-hash-upload> | Nov 11, 2026 |
| 13 | Wait one hour after schema change; wait 24 hours before DLP test | Exact data match | verified | Create an EDM SIT schema and rule package | Nov 11, 2026 |
| 14 | EDM refresh signed off by data owner; delete clear-text export | Exact data match | restated-as-design | Program position | Nov 11, 2026 |
| 15 | ML classifiers client-side Available ×3; trainable-classifier record policies In development ×3; custom classifier creation not listed | Trainable classifiers | verified | Learn Purview GCC / GCC High / DoD planning pages, Step 4 | Nov 11, 2026 |
| 16 | Service-side contextual conditions; batch rollout | Client-side and service-side | verified | Step 3: Expand to your entire Microsoft 365 data estate, <https://learn.microsoft.com/purview/deploymentmodels/depmod-secure-by-default-step3> | Nov 11, 2026 |
| 17 | Limits (500,000/day ceiling, 100 policies, 1,000 sites, 20,000,000 matched files); 12-hour target; single-policy simulation caveat; auto turn-on after 7 days; prerequisites and roles; removal policies remove encryption; coverage report 30 days | Client-side and service-side; How | verified | Automatically apply a sensitivity label to Microsoft 365 data, <https://learn.microsoft.com/purview/apply-sensitivity-label-automatically> | Nov 11, 2026 |
| 18 | Partial results; Not available isn't zero; export before rerun | Report-only or audit phase | verified | Review simulation results for auto-labeling policies, <https://learn.microsoft.com/purview/auto-label-simulation-results> | Nov 11, 2026 |
| 19 | Mode values; simulation example; -RemoveLabel with empty GUID | Report-only; Rollback | verified | New-AutoSensitivityLabelPolicy | Nov 11, 2026 |
| 20 | StartSimulation, AddSharePointLocation, AutoEnableAfter parameters | Report-only; Enforcement | verified | Set-AutoSensitivityLabelPolicy | Nov 11, 2026 |
| 21 | Standard (Plan 1) must be assigned with premium for labeling | Prerequisites | verified | Microsoft Purview service description | Nov 11, 2026 |
| 22 | Government availability rows | Prerequisites | verified | Learn Purview GCC / GCC High / DoD planning pages, Step 4 | Nov 11, 2026 |
| 23 | Label audit operations and FailureReason | Telemetry | verified | Audit log activities, Sensitivity label activities | Nov 11, 2026 |
| 24 | Control requirement rows (RA-2, AC-16, CM-3) | Requirements | restated-as-design | Mapping is the program's; titles checked against SP 800-53 Rev. 5 OSCAL 5.2.0 | Nov 11, 2026 |

## Government-cloud gaps

- Custom trainable-classifier creation: not listed on the GCC, GCC High or DoD pages; not yet specified.
- Commercial availability of "new conditions for auto-labeling in Exchange" and "Content explorer including Teams data": the government pages list them as in development; the commercial status wasn't confirmed on a Learn feature page; written as not yet specified.
- Whether the portal's seven-day auto-turn-on behaves the same in the government clouds isn't stated; the chapter's control (leave it unselected, check Mode) works either way.
- Licensing differences by cloud for auto-labeling and EDM: not separated in the service description; not yet specified.
