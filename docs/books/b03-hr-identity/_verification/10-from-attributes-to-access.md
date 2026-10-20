# Verification — Chapter 10, From Attributes to Access

Editor pass, 2026-10-20. All Microsoft Learn pages re-opened on this date; every kept footnote was re-checked against the sentence it supports. Footnote keys renamed `c08-*` → `c10-*` (the chapter was renumbered from 08).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Dynamic group members are added/removed automatically; can't be added or removed manually | Derivation chain; Governance of the rules | verified (footnote added) | c10-dyn-rules |
| 2 | Conditional Access can target any user group, dynamic or assigned | Derivation chain | verified (new footnote) | c10-ca-users |
| 3 | "Token evaluated against these groups on every session" | Derivation chain, Zero Trust paragraph | corrected — restated as: Conditional Access evaluates its policies, including group assignments, before granting access | c10-ca-users |
| 4 | AC-2 asks for specified group/role membership and authorization on attributes | Derivation chain, *because* bullet | verified (new footnote; AC-2 d, i) | c10-nist-80053 |
| 5 | Review attribute write permissions in Entra and source directory before using in security-sensitive rules | Derivation chain | verified | c10-dyn-rules |
| 6 | Rule syntax in all eight patterns (`accountEnabled`, `userType`, `extensionAttribute10–12`, `companyName`, `-in [..]`, `-ne`, Direct Reports, `device.deviceOSType`, `device.deviceOwnership -eq "Company"`) | Rule patterns table | verified | c10-dyn-rules |
| 7 | extensionAttribute1–15 supported as string properties | Rule patterns | verified (added) | c10-dyn-rules |
| 8 | Direct reports rule: manager's object ID; manager also added | Rule patterns | verified; expanded — direct reports only, can't combine with other rules | c10-dyn-rules |
| 9 | Rules can't read `employeeType`, `employeeOrgData`, `manager` | Rule patterns | verified (not in supported user properties list); reworded to say so | c10-dyn-rules |
| 10 | Agent user accounts are evaluated by user rules unless excluded | Rule patterns | added (new, verified) | c10-dyn-rules |
| 11 | Rule body ≤ 3,072 characters; ≤ 15,000 dynamic groups per tenant | Limits | verified | c10-dyn-rules |
| 12 | Dynamic groups and dynamic AUs together ≤ 15,000 | Limits | added (consistent with Book 02 Ch 05) | c10-au-faq |
| 13 | Prefer `-eq`, then `-startsWith`/`-endsWith`; `-in` over `-or` chains; minimize `-match`/`-contains` | Limits | verified | c10-dyn-efficient |
| 14 | P1 for each unique user in one or more dynamic groups | Limits | verified; added that licenses needn't be assigned and devices need none | c10-dyn-rules |
| 15 | AUs scope delegated administration (help desk example) | Administrative units | verified (new footnote) | c10-au-overview |
| 16 | AUs can't be nested | Administrative units | added for consistency with Book 02 Ch 05 | c10-au-overview |
| 17 | Dynamic AU holds users or devices, not both, and not groups | Administrative units | verified | c10-au-dynamic |
| 18 | "Each AU administrator and member needs P1" | Administrative units | corrected — true for dynamic AUs; assigned AUs need P1 for administrators only (members Free) | c10-au-overview, c10-au-dynamic |
| 19 | Dynamic AUs available in global Azure cloud "which is where GCC tenants run" | Administrative units | verified; corrected framing — dynamic AUs aren't available in specialized clouds such as Azure Government; GCC uses Entra ID in the global cloud, GCC High/DoD use Azure Government; replaced the indirect CBA-CRL footnote with the Azure Government identity-planning FAQ | c10-au-dynamic, c10-gov-identity |
| 20 | Restricted management set at creation, can't be changed | Administrative units | verified | c10-au-restricted |
| 21 | Restricted AU users/groups can't be managed by PIM, entitlement management, Lifecycle Workflows, access reviews | Administrative units | added (material omission; consistent with Book 02 Ch 05) | c10-au-restricted |
| 22 | Manager as approver for users in the directory; resolves to `manager` attribute | Access packages | verified; added fallback-approver behavior | c10-ap-approval |
| 23 | Access reviews can be assigned to managers | Access reviews | verified; re-sourced to "Create an access review" (the overview table doesn't list managers for groups/apps); added fallback reviewer | c10-ar-create |
| 24 | Built-in separation-of-duties capability in entitlement management | Separation of duties | added (verified); person-level and reporting-chain checks restated as program design | c10-gov-licensing |
| 25 | Entitlement management and access reviews require ID Governance for member users; P2-era capabilities (incl. manager approvers) still run on P2; no new IGA features in P2 | Licensing (new subsection) | added (verified) | c10-gov-licensing |
| 26 | Lifecycle Workflows, auto-assignment policies, manager request-on-behalf, PIM for Groups eligibility in access packages require ID Governance or Entra Suite | Licensing | added (verified) | c10-gov-licensing |
| 27 | ID Governance needs a P1/P2-plan prerequisite; ID Governance for Government offered in GCC, GCC High, DoD | Licensing | added (verified) | c10-gov-licensing |
| 28 | Role-assignable groups require assigned membership (removes attribute-write risk) | Where dynamic membership stops | verified | c10-dyn-rules |
| 29 | ≤ 500 role-assignable groups per tenant | Where dynamic membership stops | added (verified; consistent with Book 02 Ch 05) | c10-pim-groups |
| 30 | PIM for Groups: any security/M365 group except dynamic and on-prem-synced | Where dynamic membership stops | verified | c10-pim-groups |
| 31 | Microsoft recommends approval for eligible member assignments of role-elevating groups | Where dynamic membership stops | added (verified) | c10-pim-groups |
| 32 | Enterprise person key as SIEM/DB/badge join key; separated-person authentication is an alert | Where dynamic membership stops | restated-as-design (unchanged; program position) | — |
| 33 | Break-glass accounts cloud-only, excluded, monitored | Where dynamic membership stops | verified and expanded (`*.onmicrosoft.com`, not federated/synced, not tied to an individual, excluded from blocking CA, alert on every sign-in); exclusion from HR rules/LCW stated as program design | c10-emergency |
| 34 | Rule validation, shadow run, pilot gating; HR-owned code lists | Governance of the rules | restated-as-design (unchanged) | — |
| 35 | The choice of `extensionAttribute10–12` | Rule patterns | restated-as-design (owned by Chapter 06, unchanged) | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | Front matter | edited — added `part: How`; `lifecycle_review` 2027-01-01 → 2027-04-01 |
| Thesis line, "In this chapter" | Same | edited — callout mentions licensing |
| The derivation chain | Same | edited — the bold-paragraph chain line became a plain sentence (style rule: no bold paragraph as fake heading); added `#fig-ch10-derivation-chain` id; footnotes for CA and AC-2; Zero Trust sentence corrected (claim 3) |
| Rule patterns (table and notes) | Same | edited — footnote keys; direct-reports and supported-property wording; agent-account exclusion added |
| Limits and efficiency | Same | edited — combined 15,000 limit with AUs; license-count detail |
| Governance of the rules themselves | Same | kept (footnote added to the manual-addition bullet) |
| Administrative units | Same | edited — corrected licensing and cloud availability; added no-nesting, restricted-management governance exclusion, and link to `../b02-identity/05-delegation-without-ous.md` |
| Access packages and access reviews | Same | edited — fallback approver/reviewer; reviewer source changed; SoD split into product capability vs. program design; new Licensing subsection |
| Where dynamic membership stops | Same | edited — 500 limit, approval recommendation, emergency-access details |
| SQL Server workbook pointer | Same | kept (link target exists) |
| Continue the series callout | "Continue the book" callout | edited — Book 02 styling; full Chapter 09 title |
| Diagram `ch10-derivation-chain.flow.yaml` | Unchanged | kept — no wrong facts (its comment line still says "Chapter 08"; cosmetic, not edited) |
