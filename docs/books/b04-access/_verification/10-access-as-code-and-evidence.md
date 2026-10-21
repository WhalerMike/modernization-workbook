# Verification — Chapter 10, Access as Code, and the Evidence It Produces

Sources: `docs/compliance/Vol_VI_Book_02_Identity_Access_as_Code.md` (whole page); compliance-mapping and audit
sections of `docs/operational-guides/helpdesk-entra-operations/enterprise-application-access-governance.md`;
control closures of `docs/compliance/Vol_IX_Book_06_Identity_Access_Governance.md`. All sources accessed Oct 20, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | "Every access decision has a reviewable source of truth" invariant | Opening | restated-as-design | Vol VI Book 02 |
| 2 | Safety rules: break-glass exclusion in every blocking policy; no standing global admin; activation needs approval, justification, MFA | Repository table | restated-as-design (linked to Ch 07, Ch 08) | Vol VI Book 02 |
| 3 | Port authentication and certificate automation | Repository | not carried (network/PKI scope); linked | Vol I Book 02/03 |
| 4 | CA create needs Policy.Read.All + Policy.ReadWrite.ConditionalAccess; known consent issue | Graph | verified (added) | conditionalaccessroot-post-policies |
| 5 | PIM settings are unifiedRoleManagementPolicy rules; RoleManagementPolicy.ReadWrite.Directory; Privileged Role Administrator least privilege | Graph | verified (added) | how-to-pim-update-rules; pim-how-to-change-default-settings |
| 6 | EntitlementManagement.ReadWrite.All; AccessReview.ReadWrite.All | Graph | verified (added) | entitlement-management-access-package-request-policy; create-access-review |
| 7 | azuread provider v3.10.0, Sept 24, 2026 | Terraform | verified (added) | GitHub releases API |
| 8 | azuread resource coverage; no access review, LCW, or directory-role management policy resources | Terraform | verified (added; full resource list read) | provider docs/resources index |
| 9 | CA resource permissions; auth-strength ID prefix `/policies/authenticationStrengthPolicies/`; state values | Terraform | verified (added) | conditional_access_policy.md |
| 10 | `plan -detailed-exitcode` 0/1/2; `-refresh-only` | Terraform | verified (added) | developer.hashicorp.com plan command |
| 11 | Microsoft365DSC repo in Microsoft365DSC org, active, 2.26.1015.1 on Oct 14, 2026 | Microsoft365DSC | verified (added) | GitHub repo and releases API |
| 12 | M365DSC Entra resources (CA, auth strength, role settings, PIM group settings, eligibility, EM, access reviews, LCW) | Microsoft365DSC | verified (added; DscResources directory listing) | GitHub |
| 13 | M365DSC 2.x requires PowerShell 7.6 except compile/apply | Microsoft365DSC | verified (added) | Show-PwshWarning.ps1 |
| 14 | Tenant Governance configuration management built on TCM APIs, GA | TCM | verified (added) | tenant-governance/configuration-management |
| 15 | Baseline ≤200 resource instances; drift lists differing properties | TCM | verified (added) | deployment-guide; configuration-management |
| 16 | TCM Entra resource types; access reviews and LCW not listed | TCM | verified (added; full section list read) | graph/utcm-entra-resources |
| 17 | 30 monitors; 6-hour fixed; 800 resources/day; snapshots 20,000/month, 12 jobs, 7 days; fixed drift deleted after 30 days; baseline update deletes results | TCM | verified (added) | TCM API overview |
| 18 | Governance licenses add 10 resources/day and 35/month each; P1/P2 base | TCM | verified (added) | tenant-governance/licensing |
| 19 | Monitors report; fix with any tool; next run marks fixed | TCM | verified (added) | tenant-governance/faq |
| 20 | Recoverability guidance: versioned repo, TCM snapshots + Graph/Entra Exporter, don't merge extracts | Entra Exporter | verified (added) | architecture/recoverability-overview |
| 21 | Entra Exporter v3.0.1, Nov 2025 | Entra Exporter | verified (added) | GitHub API |
| 22 | Coverage table | Coverage | verified (compiled from rows 8, 12, 16) | as above |
| 23 | Tool choice (M365DSC write path; TCM drift; Exporter backup) | Coverage | restated-as-design | program design |
| 24 | Source JSON used `"authenticationStrength": {"id": "phishing-resistant"}` | Illustrative code | corrected: built-in ID is `00000000-0000-0000-0000-000000000004` | authenticationstrengthroot-list-policies |
| 25 | Source JSON excluded group by name `grp-breakglass` | Illustrative code | corrected: Graph takes object IDs (placeholder) | conditionalaccessroot-post-policies |
| 26 | Source JSON `state: enabled` | Illustrative code | corrected to report-only per the source's own deployment step 1 | Vol VI Book 02 Deployment §1 |
| 27 | Source comment "BOD 25-01 / M-22-09 alignment" | Illustrative code | removed (attribution not needed; IA-2 phishing-resistant requirement cited from FedRAMP guidance instead) | FedRAMP IA page |
| 28 | Access review definition shape; transitiveMembers scope; `/groups/{id}/owners` reviewers | Illustrative code | verified (added) | New-MgIdentityGovernanceAccessReviewDefinition; tutorial-accessreviews-securitygroup; accessreviews-reviewers-concept |
| 29 | Pre-merge check script | Illustrative code | restated-as-design (uses only core PowerShell cmdlets) | — |
| 30 | KSI-CMT-LMC, RMV, RVP, VTD statements | Change control; KSI table | verified (added) | FedRAMP 20x Change Management KSIs |
| 31 | Two-person rule, checks, report-only week, pipeline identity, emergency change back-port, rollback by revert | Change control | restated-as-design | program design (source Deployment steps 1–2) |
| 32 | A Global Administrator can still change policy out of band; drift catches it | Drift | restated-as-design | Vol VI Book 02 Honest Limits |
| 33 | Close findings at the source | Drift | linked (HR-Driven Identity Ch 9) | — |
| 34 | SP 800-53 Rev. 5 publication and release 5.2.0 (Aug 27, 2025) | Control mapping | verified (added) | csrc.nist.gov SP 800-53 r5 |
| 35 | AC-2 items a–l; AC-2(4); AC-3; AC-5; AC-6; AC-6(7) statements | Control mapping | verified | FedRAMP Access Control catalog page |
| 36 | No FedRAMP parameter for AC-2 j or AC-6(7) frequency | Control mapping | verified (added) | FedRAMP Access Control |
| 37 | IA-2, IA-2(1), IA-2(2) statements; FedRAMP guidance: phishing-resistant per CISA | Control mapping | verified (added) | FedRAMP Identification and Authentication |
| 38 | CA-7 items a–g; FedRAMP guidance | Control mapping | verified (added) | FedRAMP Assessment, Authorization, and Monitoring |
| 39 | Source mapped IA-2(1)/(2), AC-2/5/6, IA-11 | Control mapping | verified mapping kept; IA-11 omitted (session re-auth sits with Ch 07/08) | — |
| 40 | Help Desk guide compliance mapping (AC-2, AC-2(7), AC-3, AC-5, AC-6, AC-6(5), AU-2, AU-9, AU-12, IA-4, IA-5, CM-5, IR-6) | Control mapping | consolidated into the five requested controls plus AC-2(4), AC-5, AC-6(7); others restated in Ch 09 or out of scope | source |
| 41 | KSI-IAM-AAM, ELP, JIT, APM titles and statements | KSI table | verified (added) | FedRAMP 20x IAM KSIs |
| 42 | Monthly evidence package and metrics | Evidence package | restated-as-design | program design |
| 43 | Vol VI Book 02 "Deployed example: Keyfactor/Sectigo + ACME; Venafi/AppViewX"; "Okta/Ping"; "CyberArk/BeyondTrust" substitutions | — | not carried (vendor substitution columns; out of scope for an Entra access book) | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Vol VI Book 02 — banner, draft notice, series context | — | Page furniture |
| Vol VI Book 02 — What This Document Addresses | Ch 10 opening | — |
| Vol VI Book 02 — The Policy-as-Code Model table (CA, PIM rows) | Ch 10 "What goes in the repository" | Port-auth and certificate rows: linked to Vol I Book 02/03 |
| Vol VI Book 02 — Deployable Artifacts table | Ch 10 repository table and tools section (CA via Graph/Terraform; PIM as code) | Multi-CSP substitution column and 802.1X/cert rows not carried (scope) |
| Vol VI Book 02 — Illustrative CA policy as code | Ch 10 "A Conditional Access policy as Graph JSON" (corrected) and Terraform equivalent | — |
| Vol VI Book 02 — PIM configuration paragraph | Ch 10 repository table (PIM row); linked to Ch 08 and Appendix B | — |
| Vol VI Book 02 — Deployment steps 1–4 | Ch 10 change control (report-only first; break-glass check before enable; migrate standing to eligible via Ch 08) | Steps 3–4 (802.1X, ACME) out of scope |
| Vol VI Book 02 — Closure Necessity | Ch 10 opening (thesis) | Restated |
| Vol VI Book 02 — Controls Operationalized | Ch 10 control mapping | IA-3, IA-5(2), SC-17 out of scope |
| Vol VI Book 02 — Honest Limits | Ch 10 drift section; Honest limits | IdP-substitution bullet not carried |
| Vol VI Book 02 — Cross-References | Ch 10 links (Vol VI Book 02, Vol VI Book 07, Vol VII Book 04, Vol I Books 02/03) | VI-03/VI-04/VI-08 detection and SOAR linked indirectly via the compliance book |
| Vol VI Book 02 — Provenance | — | Page furniture; its caveat ("illustrative, validate against current Graph schema") carried into the code warning |
| Vol IX Book 06 — Authorities Closed Here | Ch 10 control mapping (AC-2, AC-5, AC-6) | AU-2/IA-4/IA-5 closures summarized via AC-2(4) and Ch 09 evidence |
| Help Desk guide — Compliance mapping table | Ch 10 control mapping | See claim 40 |
| Help Desk guide — Mandatory audit events (Policy changes: CA created/modified/deleted) | Ch 10 drift and evidence (audit records); AC-2(4) row | — |

## Revision 2026-10-21 — review fixes

Applied from the verified review of Books 02–05. Sources were opened again on Oct 21, 2026.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| R1 | Privileged-role review cadence aligned across Books 02 and 04: Tier 0 monthly, other privileged roles quarterly, never self-review alone. The cadence is the program's design; AC-2(j) and AC-6(7) leave the frequency organization-defined; AC-6(7) row and KSI-IAM-JIT row now say monthly (Tier 0) and quarterly | Control and KSI tables | corrected | c10-fedramp-ac <https://fedramp.gov/2026/reference/controls/access-control/> |

## Revision 2026-10-21 — consistency round 2

Book-internal consistency fixes. Factual changes were checked against sources opened on Oct 21, 2026; design-consistency changes carry no new note.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| C1 | Illustrative policy renamed from "CA001 - Require phishing-resistant MFA for all resources" to the library's `CA022-Members-RequirePhishResistantMFA` (CA001 is Block Legacy Auth in Ch07); Graph JSON and Terraform now carry CA022's Members scope (`excludeGuestsOrExternalUsers` / `excluded_guests_or_external_users`, all external tenants) and the `CA-Exclude-PhishResistantNotReady` exclusion; Terraform resource `ca001` renamed `ca022`, new variable for the not-ready group | Illustrative code: Graph JSON, Terraform | design-consistency (name and scope from Ch07 and Appendix A); schema shape verified | c10-ca-guests <https://learn.microsoft.com/graph/api/resources/conditionalaccessguestsorexternalusers?view=graph-rest-1.0>; c10-ca-alltenants <https://learn.microsoft.com/graph/api/resources/conditionalaccessallexternaltenants?view=graph-rest-1.0>; c10-tf-guests <https://github.com/hashicorp/terraform-provider-azuread/blob/main/docs/resources/conditional_access_policy.md> |
| C2 | PIM pre-merge rule: was "MFA or an authentication context … approval for Tier 0 roles"; now authentication context `c1` and justification for every role, approval by the tier's approver group for Tier 0 and Tier 1, Tier 2 without approval cites its risk acceptance | Repository table, PIM row | design-consistency (Ch08 settings-by-tier table; Appendix B Tier 1 table) | — |
| C3 | Sweep: every `CA0nn` reference in Book 04 (chapters, appendices, logs) checked against the Ch07 library numbers and full names; the two Ch10 code examples above were the only mismatches | Whole book | verified | Ch07 library |

## Source watch follow-up (2026-10-21)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| SW1 | Microsoft365DSC resource modules cover the listed Entra/PIM/entitlement/access-review/Lifecycle Workflows classes | §tooling | re-verified; link fixed (branch `dev` → `Dev`, old URL 404) | https://github.com/Microsoft365DSC/Microsoft365DSC/tree/Dev/Modules/Microsoft365DSC/DscResources (opened Oct 21, 2026) |
| SW2 | 2.x expects PowerShell 7.6+, Windows PowerShell only for compiling and applying configurations | §tooling | re-verified against the file's text; link fixed | https://github.com/Microsoft365DSC/Microsoft365DSC/blob/Dev/Modules/Microsoft365DSC/Show-PwshWarning.ps1 (opened Oct 21, 2026) |
