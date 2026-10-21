# Verification — Chapter 17, Dynamic Membership, Delegation and Privileged Access

Checked October 20, 2026. Source: the existing page (former Book 07, Chapter 2) verified and upgraded in place. Facts kept consistent with Book 03 Chapter 10 (dynamic rules, AUs, PIM for Groups) and Book 04 (PIM licensing).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Review who can write an attribute in Entra and source directory (SELF write) | Attribute | verified | Learn, Manage rules for dynamic membership groups (security consideration) |
| 2 | AD-mastered: HR provisioning to AD then Connect/Cloud Sync | Attribute | verified | Learn, Cloud HR application to Entra user provisioning; What is Microsoft Entra Connect? |
| 3 | Cloud-mastered: built-in HR connectors; API-driven inbound for any system of record | Attribute | verified | Same; Learn, API-driven inbound provisioning concepts |
| 4 | Supported properties list incl. `employeeHireDate` (preview); extensionAttribute1–15; custom extension properties | Choosing | verified | Learn, Manage rules for dynamic membership groups |
| 5 | `employeeType` not in supported list | Choosing | verified | Same (absent from property tables) |
| 6 | Multi-value extension properties unsupported | Choosing | verified | Same |
| 7 | 3,072-character rule limit; 15,000 dynamic groups | Choosing | verified | Same |
| 8 | Prefer `-eq`/`-startsWith`/`-in` over `-match`/`-contains`/`-or` chains | Choosing | verified | Learn, Understand and manage dynamic group processing (best practices) |
| 9 | P1 per unique dynamic-group member | Choosing | verified; "licenses needn't be assigned" added | Learn, Manage rules for dynamic membership groups |
| 10 | Source: "Most federal tenants have it through Microsoft 365 or EMS" | Choosing | restated | "Most agency tenants" — program expectation, not a statistic |
| 11 | Naming policy covers only Microsoft 365 groups | Naming | verified | Learn, Enforce a naming policy on Microsoft 365 groups |
| 12 | Validate Rules: up to 20 users | Testing | verified; "or devices" and per-expression detail added | Learn, Validate rules for dynamic membership groups |
| 13 | Processing status / audit log; rule change removes non-matching members | Testing | verified (new detail) | Learn, Create or update a dynamic membership group; Troubleshoot and resolve groups issues |
| 14 | Pause non-essential groups for bulk changes, resume in phases | Testing | verified; thresholds (500 groups / 20,000 changes) and 24-hour wait added | Learn, Understand and manage dynamic group processing |
| 15 | Groups Administrator at AU scope; scoped admin needs P1; members nothing extra | AUs | verified; "members need Free" | Learn, Administrative units (Groups; License requirements) |
| 16 | Source: restricted AU — "even Global Administrators can't" | AUs | corrected | Learn, Restricted management AUs: GA can't unless they assign themselves at AU scope (an audited event) |
| 17 | Restricted AU blocks PIM, access reviews, entitlement management, lifecycle workflows | AUs | verified | Same |
| 18 | Source: "Restricted management AUs accept only plain security groups" | AUs | corrected | Same: users and devices allowed; among groups only security groups |
| 19 | Setting can't change after creation | AUs | verified; 100-unit limit added | Same |
| 20 | Dynamic AU membership in commercial cloud, not Azure Government; users/devices not groups | AUs | verified; "specialized clouds" wording and P1-per-member added | Learn, Manage users or devices for an AU with dynamic rules |
| 21 | Role-assignable groups require assigned membership | PIM | verified | Learn, Manage rules (note); Use Entra groups to manage role assignments |
| 22 | PIM for Groups: eligible, time-bound, MFA/approval/justification | PIM | verified | Learn, PIM for Groups |
| 23 | PIM for Groups can't manage dynamic or on-prem-synced groups | PIM | verified | Same |
| 24 | Role-assignable blocks credential changes by lower-tier admins | PIM | verified; specified as Privileged Authentication Administrator; 500-group limit added | Learn, Use Entra groups to manage role assignments |
| 25 | PIM for Groups needs P2 or Entra ID Governance | PIM | verified | Learn, Assign eligibility for a group in PIM; Entra ID Governance licensing fundamentals |
| 26 | Source: access reviews need P2 or ID Governance | PIM | corrected | Licensing fundamentals: access reviews need Entra ID Governance for member users; P2-era capabilities still operate under P2; no new IGA features in P2 |
| 27 | Access-review decisions don't change dynamic-group membership | Access reviews | verified (new) | Learn, Complete an access review |
| 28 | Recurring review can remove access when reviewers don't respond | Access reviews | verified; auto-apply warning added | Learn, Create an access review of groups and applications |
| 29 | AC-2 evidence | Access reviews | restated-as-design | Program mapping (Appendix A) |
| 30 | Emergency access: ≥2 cloud-only, phishing-resistant, excluded from blocking CA, alerting, tested | Break-glass | verified; `.onmicrosoft.com`, different credentials, 90-day validation added | Learn, Manage emergency access accounts |
| 31 | Source: "Book 05's position stands" (sa disabled and renamed) | Break-glass | corrected | → Chapter 12 |
| 32 | Entra audit logs record rule/membership/PIM/AU changes | Monitoring | verified (RMAU audit events) | Learn, Restricted management AUs (audit logs) |
| 33 | Sign-in logs show CA result | Monitoring | verified | Learn, View applied Conditional Access details |
| 34 | SQL Server Audit login and role-membership groups | Monitoring | verified; action-group names and Application-log caution added | Learn, SQL Server Audit action groups and actions; SQL Server Audit (Database Engine) |
| 35 | Source: "Book 09" continuous audit | Monitoring | corrected | → Chapter 20 |
| 36 | Azure public cloud FedRAMP High P-ATO, US regions | FedRAMP | verified | Learn, Azure FedRAMP offering |
| 37 | Source: Moderate 325 controls, High 421 | FedRAMP | removed | Counts are from Microsoft's page (Rev. 4-era figures); not needed for the argument and not checked against fedramp.gov; "Moderate is a subset of High" kept |
| 38 | Audit-scope list: Entra ID Free/P1/P2, ID Governance, provisioning service, MFA, Graph, Arc servers, Arc SQL, Azure Monitor/Log Analytics, Sentinel | FedRAMP | verified | Learn, services compliance scope (Azure public) |
| 39 | Source list included Key Vault | FedRAMP | removed | Not confirmed in the scope rows retrieved; not needed by this chapter |
| 40 | Package requested via FedRAMP Marketplace | FedRAMP | verified; .gov/.mil requirement added | Learn, Azure FedRAMP offering |
| 41 | Customer configuration responsibility | FedRAMP | verified | Learn, Configure Entra ID to meet FedRAMP High |
| 42 | Source: DPA quote, previews "may employ lesser or different privacy and security measures" (May 2026 edition) | Previews | removed (unverifiable) | Couldn't retrieve the DPA text; replaced with Learn, Entra ID preview program information (Product Terms; SLAs don't apply; previews can be cancelled) and the memberOf page ("not intended for production use") |
| 43 | Entra auth on Arc needs Azure public cloud access | In scope | verified | Learn, Managed identity for SQL Server enabled by Azure Arc (limitations) |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, H1 "Chapter 2 — …" | Front matter, H1 | edited |
| Thesis, "In this chapter" | Same | kept |
| Opening paragraph | Opening | edited ("Chapter 1" → Chapter 16; links to Books 03 and 04 added) |
| "The Attribute Is the Access Control" + principle callout + diagram | Same | edited (sources) |
| "Choosing the Attributes" + rule block | Same | edited (warning callout before code; claims 4–10) |
| "Writing, Naming, and Testing Rules" | Same | edited (claims 11–14) |
| "Scoped Delegation with Administrative Units" | Same | edited (claims 15–20) |
| "Privileged Access Belongs in PIM, Not in a Rule" + diagram | Same | edited (claims 21–26) |
| "Access Reviews" | Same | edited (claims 27–28) |
| "Break-Glass" | Same | edited (claims 30–31) |
| "Monitoring" | Same | edited (claims 32–35) |
| "FedRAMP Moderate in the Commercial Cloud" (three sub-parts) | Same | edited (claims 36–43) |
| "What Book 07 establishes — Chapter 2" | "What this chapter establishes" | kept |
| "Authoritative references" list (11 bullets) | Footnotes | converted: each link re-opened and cited at its claim; DPA link removed (claim 42) |
| Footnotes (connect, ca, signins, sqlaudit) | Footnotes | re-keyed `c17-`; CA overview footnote replaced by emergency-access guidance |
| — | Continue the book | added |

Diagram source edited: `book-07-ch02-attribute-pipeline.flow.yaml` ("Chapter 1" → "Chapter 16"). Needs re-render. `book-07-ch02-privileged-access.flow.yaml` checked, no change.

## Change log

| Date | Change |
|---|---|
| 2026-10-21 | Extension attribute reconciliation: example rule moved from directory extension properties (`extension_<appId>_orgCode`/`positionCategory`) to the program carriers `extensionAttribute10`/`12`, value `ANALYST` as in Book 03 Ch 10; added the program attribute map link; callout no longer mentions `<appId>`. |
