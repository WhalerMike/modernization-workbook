# Verification — Chapter 05, Applications and Workload Identities

Checked October 20, 2026. Sources: `docs/compliance/Vol_IX_Book_03_App_Registration_Governance.md` (all sections),
and the app-registration, definitions, permission-type, permission-scope, consent and ownership sections of
`docs/operational-guides/helpdesk-entra-operations/enterprise-application-access-governance.md` (the rest of that
guide is carried in Chapter 06 or belongs to Chapter 09). Book 02 Chapter 09 read for consistency on managed
identities, workload identity federation and Conditional Access for workload identities.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Application object is the global representation/template; service principal is the local instance per tenant | Two objects | verified | Learn, Application and service principal objects |
| 2 | Portal registration creates both objects; Graph creation makes the SP a separate step | Two objects | verified | Same |
| 3 | Multitenant app gets an SP in each consenting tenant | Two objects; diagram | verified | Same |
| 4 | App object changes reach only the home-tenant SP; deleting the app object deletes that SP | Two objects | verified | Same |
| 5 | Apps can be deactivated: no new tokens, objects preserved | Two objects; Ch 06 orphan policy | verified | Same |
| 6 | Three SP types: application, managed identity (no app object, can't be modified directly), legacy | Two objects | verified | Same |
| 7 | First consenting user creates a third-party SP; Microsoft services create SPs just in time, sometimes with Directory Readers | Two objects | verified | Learn, How and why applications are added |
| 8 | By default all users can register apps and consent; set Users can register applications = No; Application Developer role | Who can create | verified | Learn, Delegate app registration permissions |
| 9 | Application Developer limited to 250 created objects; custom role lifts it | Who can create | verified | Learn, custom role for unlimited app registrations |
| 10 | Source: Enterprise Application = SP; App Registration = definition object (definitions table) | Two objects | verified | Learn, Application and service principal objects |
| 11 | Delegated vs application permission behavior | Permissions | verified | Learn, Overview of user and admin consent; security best practices |
| 12 | Prefer least privilege and delegated over app-only; remove unused permissions | Permissions | verified | Learn, Security best practices for application properties |
| 13 | Removing a permission from the registration doesn't revoke an existing grant | Permissions | verified | Learn, Update an app's requested permissions |
| 14 | Source permission table lists `Mail.ReadWrite.All` (application) | Permission table | corrected | Learn, Graph permissions reference: no `Mail.ReadWrite.All`; the application permission is `Mail.ReadWrite` ("Read and write mail in all mailboxes") |
| 15 | `Mail.Send` application = send mail as any user; `Mail.Read` application = read all mailboxes | Permission table | verified | Learn, Graph permissions reference |
| 16 | Exchange application access policy can limit mail app permissions to specific mailboxes | Permissions | verified | Learn, Graph permissions reference (notes under Mail.ReadWrite / Mail.Send) |
| 17 | Risk levels for each Graph permission | Permission table | restated-as-design | Program classification (source guide), labeled as not a Microsoft rating |
| 18 | openid, profile, email, offline_access are the minimum delegated sign-in permissions | Permissions | verified | Learn, Configure permission classifications |
| 19 | Three built-in user consent options and their behavior | User consent | verified | Learn, Overview of user and admin consent |
| 20 | Policy IDs `microsoft-user-default-low` and `microsoft-user-default-legacy` | User consent | verified | Learn, Configure how users consent to applications |
| 21 | Default: all users can consent to permissions not needing admin consent; Microsoft recommends verified publishers only | User consent | verified | Same |
| 22 | Changing the setting affects only future consent | User consent | verified | Same |
| 23 | Configuring requires Privileged Role Administrator (Graph) or Global Administrator (admin center) | User consent | verified | Same, Prerequisites |
| 24 | Built-in consent policies can't be edited; `microsoft-user-default-recommended` and `-allow-consent-apps` are Microsoft-managed | User consent | verified | Learn, Manage app consent policies |
| 25 | Apps requiring user assignment always need admin consent | User consent | verified | Learn, Configure how users consent (note); Manage users and groups assignment |
| 26 | Classifications Low, Medium (preview), High (preview); only delegated permissions not requiring admin consent; App Admin or Cloud App Admin | Classifications | verified | Learn, Configure permission classifications |
| 27 | Admin consent is sensitive; examples of role management, all mailboxes, impersonation; don't grant if unsure | Admin consent | verified | Learn, Overview of user and admin consent |
| 28 | Roles that can grant admin consent (PRA any; App Admin/Cloud App Admin/AI Administrator except Graph app roles; custom role) | Admin consent | verified | Learn, Grant tenant-wide admin consent, Prerequisites |
| 29 | App Admin / Cloud App Admin can still consent to app permissions for non-Graph APIs | Admin consent | verified | Learn, Entra built-in roles |
| 30 | Source: "Admin Consent grants are permanent until revoked — they do not expire" | Admin consent | verified | Learn, New-MgBetaOauth2PermissionGrant: start/end times currently ignored |
| 31 | Granting tenant-wide consent can revoke existing tenant-wide grants; user grants unaffected | Admin consent | verified | Learn, Grant tenant-wide admin consent (Important note) |
| 32 | Deleting a delegated grant leaves existing tokens valid for their lifetime | Admin consent | verified | Learn, Graph, Delete oAuth2PermissionGrant |
| 33 | Revoking doesn't stop users re-consenting | Admin consent | verified | Learn, Review permissions granted to enterprise applications |
| 34 | Programmatic grants take effect immediately without confirmation | Admin consent | verified | Learn, Grant tenant-wide admin consent (Caution) |
| 35 | Workflow: Approval required, justification, only first request submitted, user notified | Workflow | verified | Learn, Overview of user and admin consent |
| 36 | Global Administrator needed to turn workflow on; up to an hour to apply; reviewer designation doesn't elevate; only GA approves Graph app-role requests; expiry and reviewer-change limitations | Workflow | verified | Learn, Configure the admin consent workflow |
| 37 | Program: grant Graph app permissions via Enterprise apps pane as PRA through PIM | Workflow | restated-as-design | Program design, consistent with claim 28 |
| 38 | Owners can manage SSO, provisioning, user assignment, add owners; same as app admins scoped to app | Ownership | verified | Learn, Overview of enterprise application ownership |
| 39 | Owners can add credentials and impersonate the app (elevation of privilege) | Ownership | verified | Same; Learn, Delegate app registration permissions |
| 40 | Registrant becomes app owner; enterprise app ownership only when registrant has no admin role; App Admins not added as owners | Ownership | verified | Learn, ownership overview; Entra built-in roles |
| 41 | Groups can't own enterprise applications | Ownership | verified | Learn, ownership overview |
| 42 | At least two owners; `serviceManagementReference`; minimal owners; review every few months; find ownerless via Graph | Ownership | verified | Learn, ownership overview; security best practices |
| 43 | Source (help desk guide): Owners tab "does not confer any Entra administrative role ... metadata designation" | Ownership (Ch 06 too) | corrected | Learn, ownership overview: owners hold app-admin-equivalent rights over the app |
| 44 | Credential order: managed identity, federated credential, certificate (Key Vault, trusted CA), never secrets; plus hygiene items | Credentials | verified | Learn, Security best practices for application properties |
| 45 | App management policy restrictions (passwordAddition, customPasswordAddition, passwordLifetime, symmetricKey*, asymmetricKeyLifetime, nonDefaultUriAddition); date-scoped | Credentials | verified | Learn, Configure restrictions; Graph app management policies API overview |
| 46 | Microsoft recommends blocking secrets and symmetric keys and capping certificates at 180 days | Credentials | verified | Learn, Tutorial: enforce secret and certificate standards |
| 47 | App management policies are free (not Premium) | Credentials | verified | Learn, Workload ID FAQ (table) |
| 48 | Source: "short-lived certificate (ACME)" | Credentials | restated-as-design | Program's choice; CA selection deferred to Vol I Book 03 |
| 49 | 180-day cap for new apps vs Book 02's annual rotation for migrated accounts | Credentials | restated-as-design | Program reconciliation; flagged to editor |
| 50 | Workload identities = applications, SPs, managed identities | Managed identities | verified | Learn, Workload ID FAQ / service description |
| 51 | System- vs user-assigned managed identities | Managed identities | verified | Learn, What are managed identities |
| 52 | User-assigned recommended for most scenarios; system-assigned for per-resource audit and lifecycle-bound permissions | Managed identities | verified | Learn, Managed identity best practice recommendations |
| 53 | Use a managed identity when in Azure, no user sign-in, not a web API, single tenant | Managed identities | verified | Learn, Security best practices for application properties |
| 54 | Managed identities not covered by CA for workload identities; use access reviews | Managed identities; CA | verified | Learn, Conditional Access for workload identities |
| 55 | WIF trusts external IdP tokens for app registration or user-assigned MI; supported scenarios | WIF | verified | Learn, Workload identity federation concepts |
| 56 | MI and WIF are free | WIF | verified | Learn, Workload ID FAQ |
| 57 | CA for workload identities: why needed; block from IP ranges, on risk, with auth contexts; block-only grant; report-only; SP sign-in logs | CA | verified | Learn, Conditional Access for workload identities |
| 58 | Workload Identities Premium needed to create/modify; single-tenant SPs only; groups not enforced | CA | verified | Same |
| 59 | Workload ID Premium is standalone; one license unlocks features; free vs premium feature table | Premium | verified | Learn, Workload ID FAQ |
| 60 | SP access reviews need P2 for reviewers; Gov cloud availability via account manager; no Gov trial | Premium | verified | Same |
| 61 | Workload ID Premium price ($3/identity/month on Learn) | Premium | removed | Not stated, per the brief's guidance to avoid prices |
| 62 | Tenant admins can add credentials to an SP; app instance property lock locks verify/sign credentials and token encryption key ID | Property lock | verified | Learn, Security best practices; How to configure app instance property lock |
| 63 | Lock enabled by default for new applications since June 2026 | Property lock | verified | Learn, How to configure app instance property lock (note) |
| 64 | Lock all sensitive properties; especially critical for multitenant apps | Property lock | verified | Learn, Security best practices |
| 65 | Lifecycle stages and control mappings (AC-2, AC-6, IA-5(2), SC-17, CA-7) | Governing | restated-as-design | Vol IX Book 03 program mapping |
| 66 | AC-6 applies least privilege to processes acting on behalf of users | Governing | verified | NIST SP 800-53 Rev. 5, AC-6 (PDF text extracted) |
| 67 | Inventory script cmdlets: Connect-MgGraph -NoWelcome, Get-MgPolicyAuthorizationPolicy, Get-MgApplication, Get-MgApplicationOwner, Get-MgServicePrincipal, Get-MgOauth2PermissionGrant, Get-MgServicePrincipalAppRoleAssignment | Script | unverifiable | Real Microsoft Graph PowerShell cmdlets and properties; script not executed against a tenant (callout says so) |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Vol IX Book 03 — front matter, banners, Series Context | — | Draft/classification banners and series framing not carried (style rules); context restated in chapter opening |
| Vol IX Book 03 — What This Document Addresses | Ch 05 opening; Governing app registrations | |
| Vol IX Book 03 — The Lifecycle (table) | Ch 05 Governing app registrations (table + diagram ch05-app-lifecycle), with a Retire stage added | |
| Vol IX Book 03 — No long-lived secrets callout | Ch 05 Credentials; Enforcing the order with app management policies | |
| Vol IX Book 03 — App Registrations Are Machine JML | Ch 05 Governing app registrations (lead paragraph, link to Book 03) | |
| Vol IX Book 03 — Closure Necessity | — | Linked to Vol IX Book 03 for the closure argument rather than reproduced |
| Vol IX Book 03 — Authorities Closed Here (generated table) | Ch 05 lifecycle table control column | Full generated authority table stays in Vol IX Book 03 (linked) |
| Vol IX Book 03 — Honest Limits | Ch 05 Governing app registrations (three limits) | |
| Vol IX Book 03 — Cross-References | Ch 05 links to Vol I Book 03, Vol VI Book 02, Vol IX Book 03, Book 03 | Vol VII Book 04 attestation link left to Chapter 10 |
| Vol IX Book 03 — Provenance | — | Draft/provenance note not carried (style rules) |
| EAAG — Definitions: Enterprise Application, Service Principal, App Registration | Ch 05 Two objects for one application | |
| EAAG — Definitions: Admin Consent, Delegated/Application Permission, Consent Grant | Ch 05 Permissions; Consent | |
| EAAG — Definitions: Managed Identity | Ch 05 Managed identities | |
| EAAG — Definitions: PAG, PIM, ImmutableID, Group-Based Access, App Owner, IGO, Risk Tier, RITM, Break-Glass, Ownership Hierarchy, Help Desk PAG, Least Privilege, Application Registry | Ch 06 | Role and process terms belong to Chapter 06 |
| EAAG — Admin Consent governance: What Admin Consent is and why high risk | Ch 05 Admin consent | |
| EAAG — Permission types (delegated vs application table) | Ch 05 Permissions table | |
| EAAG — Permission scope risk reference table | Ch 05 permission table (corrected `Mail.ReadWrite.All`) | Approval column moved to Ch 06 consent chain |
| EAAG — Consent grant audit requirements | Ch 06 Evidence and monitoring | |
| EAAG — Revoking Admin Consent | Ch 06 Who approves admin consent (revocation paragraph); Ch 05 Admin consent behaviors | |
| EAAG — Application ownership: requirement, owners tab note | Ch 05 Ownership (corrected) | Owner duties, backup, registry, transfer, orphan policy in Ch 06 |
| EAAG — Assigning and updating Application Owners in Entra ID (portal steps) | — | Click-path runbook stays in the linked Help Desk guide |
