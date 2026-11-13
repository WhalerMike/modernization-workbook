# Verification — Chapter 06, SaaS Integration Governance

Checked October 21, 2026 by writer W4. Source: `docs/compliance/Vol_IX_Book_05_SaaS_Integration_Governance.md` (5,780 words), archived after the book is built and not linked. Microsoft facts from Microsoft Learn via the MCP search and fetch tools and a direct download of the Graph permissions reference; Graph permission tables read from each API page. FedRAMP facts from fedramp.gov (the 2026 "Using a FedRAMP Certified Cloud Service" page) and the Marketplace dataset `products.json` (`meta.last_change` 2026-10-21T16:12:00.309Z, 781 listings), downloaded and parsed. CISA required configurations read on cisa.gov. NIST control text from the OSCAL catalog release 5.2.0. The PowerShell example uses only cmdlets shown on the corresponding Graph API pages (`Get-MgServicePrincipal`, `Get-MgServicePrincipalSynchronizationJob`); it wasn't run. No personal data was sent to any site.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Gallery integration creates a synced copy of directory attributes in the vendor cloud | Opening | restated-as-design | Source opening; mechanism verified in #20 |
| 2 | Onboarding closes or skips AC-2, IA-5, CM-8, AC-3 at once | Opening | restated-as-design | Source argument |
| 3 | GCC paired with Entra ID in Azure | Why the gate | verified | Learn, Cloud feature availability for US Government customers |
| 4 | GCC uses public Entra ID for historical reasons | Why the gate | verified (new) | Learn, Planning identity for Azure Government applications, FAQ |
| 5 | GCC uses worldwide Graph endpoints | Why the gate; actuation | verified (new) | Learn, Microsoft Graph national cloud deployments |
| 6 | Source: tutorial corpus 12,940 pages / 1,295 tutorials / 50,172 SSO mentions / zero FedRAMP | Why the gate | removed | Internal point-in-time measurement, not independently reproducible here; replaced by the general observation (restated-as-design) and #7–8 |
| 7 | Gallery risk scores by Defender for Cloud Apps; general/security/compliance/legal; SOC 2, ISO 27001, HIPAA, PCI as examples; need Entra Suite or Internet Access license | Why the gate | verified, corrected | Learn, Overview of the Entra application gallery. Source said scores "name … not FedRAMP"; the page lists examples only, so the chapter doesn't claim FedRAMP is absent |
| 8 | Third-party Teams apps extend the boundary; customer must ensure FedRAMP compliance | Why the gate | verified (new) | Learn, Teams platform "Plan for government clouds" |
| 9 | Agency authorizes its own system; AO accepts risk incl. "the integrations enabled" | Why the gate | verified | fedramp.gov/2026/agencies/use |
| 10 | SA-9, SA-9(2), AC-20, CA-3 statements | Why the gate | verified | OSCAL catalog 5.2.0 |
| 11 | MS.AAD.5.1v1, 5.2v1, 5.3v1 text | Consent | verified | CISA BOD 25-01 required configurations |
| 12 | Consent restriction governs who, not whether | Consent; figure ch06-who-versus-whether | restated-as-design | Source "Closure Necessity" argument, doctrine name dropped |
| 13 | Illicit consent grant mechanics; password reset and MFA ineffective | OAuth risk | verified (new) | Learn, Detect and remediate illicit consent grants |
| 14 | Disable rather than delete a malicious app | OAuth risk | verified (new) | Learn, App consent grant investigation |
| 15 | App governance tracks non-Microsoft OAuth apps to Entra ID | OAuth risk | verified (new) | Learn, App governance FAQ |
| 16 | App governance in government clouds announced May 2024 | OAuth risk | verified (new) | Learn, Defender for Cloud Apps release archive, May 2024 |
| 17 | Listed app governance alerts still on roadmap for GCC | OAuth risk | verified (new) | Learn, Defender for Cloud Apps for US Government offerings |
| 18 | Defender for Cloud Apps in GCC covered by Azure Commercial FedRAMP High ATO; may not meet other GCC attributes | OAuth risk | verified (new) | Learn, EMS for US Government service description |
| 19 | Federation-to-control mapping table | Federation | restated-as-design | Source section; platform rows verified in #20–21 |
| 20 | Provisioning uses SCIM 2.0; disables on unassign/out of scope/disabled; incremental cycles; logs every read/write | Federation; Phase 5 | verified | Learn, How Application Provisioning works |
| 21 | Federation passes identity via SAML/OIDC; apps don't manage credentials | Federation (SC-8 row) | verified, narrowed | Learn, What is single sign-on. Source's "rides TLS with signed assertions" not separately cited; row restated on the documented behavior |
| 22 | SSO without provisioning = manual-closure island | Federation | restated-as-design | Source; doctrine name dropped, links Book 14 Ch04 |
| 23 | Password-based SSO stores credentials encrypted and replays them | Federation; Honest limits | verified | Learn, Add password-based SSO |
| 24 | 24 catalog items in seven phases, approvals, controls | The catalog | restated-as-design | Source catalog; IDs (`saas.*`) replaced by plain item names; controls verified as SP 800-53 identifiers |
| 25 | Source: verdict "at or above the Moderate baseline" | Phase 1 | corrected | FedRAMP 2026 classes (Book 10 Ch03); threshold restated as FedRAMP Certified, Class C or higher (design) |
| 26 | 42 LI-SaaS listings all Class B | Phase 1 | verified (new) | products.json computed |
| 27 | Source honest limit: "Li-SaaS is not distinguished" | Phase 1 | corrected | Class threshold separates it (#26) |
| 28 | Source: "the marketplace has no API; export taken by hand" | Phase 1 | corrected | products.json is a machine-readable dataset with the listed fields |
| 29 | Name matching produces a review queue, never an "unauthorized" verdict | Phase 1 | restated-as-design | Source limit 6 |
| 30 | Interfaces record drives firewall and DNS records | Phase 1 | restated-as-design | Source item |
| 31 | Source: inventory record reconciled to "IPAM/DDI asset identity (CM-8 join key, Book 01)" | Phase 2 | restated-as-design | Linked to Chapter 07 instead of the internal reference |
| 32 | SAML signing cert self-signed, 3 years default; new cert up to 3 years or uploaded; metadata-based rollover; notices at 60/30/7 days to up to five addresses | Phase 3 | verified (new) | Learn, Tutorial: Manage certificates for federated SSO |
| 33 | Assignment required No → all users, apps, invited external users; Global Administrators bypass | Phase 4 | verified (new) | Learn, Properties of an enterprise application |
| 34 | App requiring assignment can't receive user consent | Phase 4 | verified | Learn, Restrict a Microsoft Entra app to a set of users |
| 35 | Disable on next cycle; delete after hard delete at 30 days; quarantine slows to daily and disables after four weeks | Phase 5 | verified (new) | Learn, How Application Provisioning works |
| 36 | Source: separation drives disable "on the effective date" | Phase 5 | restated-as-design, qualified | Bounded by cycle timing (#35); on-demand fallback (#37) |
| 37 | provisionOnDemand exists; 5 requests per 10 seconds; OwnedBy least privilege | Phase 5; actuation | verified (new) | Learn, synchronizationJob: provisionOnDemand |
| 38 | Telemetry bounded by GCC limits | Phase 6 | restated-as-design | Source caveat; links Book 10 Ch04 and Book 12 |
| 39 | Enabled for users to sign in = No stops tokens for users and service principals | Phase 7 | verified (new) | Learn, Properties of an enterprise application |
| 40 | instantiate: OwnedBy least privilege; non-gallery template ID for the global service (GCC) | Actuation | verified | Learn, applicationTemplate: instantiate. Source quoted only the global ID |
| 41 | PATCH servicePrincipal: OwnedBy least privilege | Actuation | verified (new) | Learn, Update servicePrincipal |
| 42 | addTokenSigningCertificate generates a self-signed cert, up to 3 years; global service (GCC uses it) | Actuation | corrected | Learn, addTokenSigningCertificate. Source used it to set an agency-issued certificate |
| 43 | Sync job created disabled; Start is separate; OwnedBy least, Synchronization.ReadWrite.All higher | Actuation | corrected | Learn, Create synchronizationJob. Source granted Synchronization.ReadWrite.All and called the pair owner-scoped |
| 44 | Sync secrets PUT: OwnedBy least, Synchronization.ReadWrite.All higher | Actuation | verified | Learn, Add synchronization secrets |
| 45 | appRoleAssignedTo needs AppRoleAssignment.ReadWrite.All and Application.Read.All | Actuation | corrected | Learn, Grant an appRoleAssignment for a service principal. Source implied OwnedBy suffices |
| 46 | OwnedBy = same as ReadWrite.All on owned objects, can list all; AppRoleAssignment.ReadWrite.All can grant itself anything | Actuation | verified (new) | Learn, Graph permissions reference |
| 47 | Assignment executed by a PIM-activated person, not the connector | Actuation | restated-as-design (new) | Follows from #45; consistent with Book 04 Ch06 |
| 48 | Source: delete sync job / delete service principal for offboarding | Actuation; Phase 7 | corrected | Disable first (#39); job pause/delete left to offboarding item |
| 49 | Read-only inventory script; delegated read scopes Application.Read.All and Synchronization.Read.All | Code | verified (new) | Learn, List synchronization jobs (permissions and PowerShell example); servicePrincipal properties from instantiate response |
| 50 | Negative test list | Tests | restated-as-design | Source ATF table; standing-admin test extended to the two other over-broad permissions (#43, #45) |
| 51 | Entra ID Governance available in GCC | Keeping integrations authorized | verified (new) | Learn, Microsoft Entra feature availability |
| 52 | Source: control map validated by CI against spine; "6 day-2 control maps, 55 catalog items" | — | removed | Internal tooling and counts |
| 53 | Source: placement and "related debt" notes, kit paths, Script Include names | — | removed | Internal repository structure |
| 54 | Source: SA-9 is "closed here first … no other book carries it" | — | removed | Internal cross-volume claim |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, internal banner, draft box, Date Code, agency shortcode | — | Never carried |
| Series Context | Opening (link to Book 04 Ch05–06) | Internal volume, lane and kit references dropped |
| What This Document Addresses | Opening | Carried |
| Why the gate has to be ours (motivating measurement) | Why the gate has to be the agency's | Pairing verified (#3–5); corpus counts removed (#6); risk-score claim corrected (#7) |
| The Implementation — Lane F of the Day-2 Scoped App; placement table; Placement resolved box | — | Internal repository and packaging decisions (#53) |
| The record model | — | Internal file layout (#53); the substance (one control map, connector methods, flow, tests) survives in the catalog, actuation and tests sections |
| The Graph surface Lane F needs | The actuation surface, least privilege first | Operations verified; permissions corrected (#40–48) |
| Least-privilege note | Three corrections list | Corrected (#43, #45) |
| Federation Closes the Controls | Federation closes controls, and what it doesn't close | Carried as a table; SC-8 row narrowed (#21); password SSO added (#23) |
| SCIM is what makes identity MACD-R propagate | SCIM is how identity changes propagate | Doctrine names translated; links Chapter 05 |
| Configuration is not compliance | Same heading in prose | Carried; links Book 04 Ch09 |
| The Catalog — 24 governed items, Phases 1–7 | The catalog: seven phases | All 24 items carried with plain names; corrections #25–28, #32–37, #39 |
| This phase is why the others matter | Phase 5 closing paragraph | Carried |
| Boundary caveat on logs | Phase 6 paragraph | Carried |
| Authorization is not a one-time fact | Phase 7 paragraph | Carried with the disable-first step (#39) |
| The Control Map — data checked against the spine; Why the lane is validated for free | — | Internal CI tooling and counts (#52) |
| Tests — What Would Falsify This | Tests that would prove the design wrong | Carried; extended (#50) |
| Closure Necessity box (consent restriction) | Consent restriction answers who, not whether; figure | Carried without doctrine name |
| What the other 23 closures are, and are not | — | Internal cross-volume closure accounting (#54) |
| Authorities Closed Here table | Control column of every phase table; c06-sp80053 | Mechanism prose merged into the phase tables; slot, KSI, tool-attestable columns dropped |
| Closure-Necessity alternate-path rebuttal | Consent section | Duplicate of the box; merged |
| Honest Limits 1–7 | Honest limits 1–6 | Limit 3 (internal app skeleton) dropped; limit 5 (Li-SaaS) resolved (#27); limit 6 (no API) corrected (#28); others carried |
| Cross-References | Links to Book 03, 04, 07, 10, 12, 14 and Chapters 02, 05, 07, 10, 11 | Internal volume references replaced |
| Provenance | Verification header | Internal; gallery detection constant verified (#40) |

## Additions, October 23, 2026 (federal framework crosswalk follow-up)

Every claim was checked against the primary source on October 23, 2026. Sources: research briefs on investment and acquisition, and on service, accessibility and records (program working files).

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Require a written ACR per ICT item; 'Partially Supports' means non-conformance | Phase 1 | verified (quoted) | Section508.gov request and claims pages |
| 2 | Validate vendor conformance before purchase and after change | Phase 1 | verified | OMB M-24-08 §III.B |

## Additions, October 28, 2026 (Help Desk Kit audit)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | A delegated grant with consentType AllPrincipals authorizes the app to impersonate all users; Principal, one user | The Help Desk Kit audit | verified (quoted) | c06-oauth2-grant |
| 2 | An app consented for every user can act as anyone who signs in to it, within the scopes granted | The Help Desk Kit audit | verified (follows from c06-oauth2-grant and the scope property) | c06-oauth2-grant |
| 3 | Nearest Entra counterpart to AD unconstrained delegation; differs in being limited to its scopes | The Help Desk Kit audit | restated-as-design (comparison; AD mechanism sourced in Book 02 Ch08) | c06-oauth2-grant; Book 02 Ch08 c08-sensitive |
| 4 | The script's checks, columns, exclusions and output file | The Help Desk Kit audit | verified against the kit v1.6.2 (`Get-EnterpriseAppInventory.ps1`, Pester 37/37) | kit release helpdesk-entra-kit-v1.6.2 |
| 5 | Tiers, who acts, A3 routing, drift to the governance officer and security operations | The Help Desk Kit audit | restated-as-design (program policy) | — |

## Claim language, November 8, 2026

The claim language was narrowed under the workbook's supports-not-satisfies rule (CONTRIBUTING.md, Claim language): the page now says what the mechanism supports or provides evidence for, not that it satisfies a control or requirement. No source changed and no source was re-opened.

| Before | After | Source |
|---|---|---|
| and why that moment closes or skips a whole set of controls at once. | and why that moment puts a whole set of controls in place or skips them at once. | no source change |
| How single sign-on and SCIM provisioning close account-management controls, and what they don't close. | How single sign-on and SCIM provisioning support account-management controls, and what they leave to the agency. | no source change |
| Heading: Federation closes controls, and what it doesn't close | Kept as written, with a `claims-ok` marker (heading kept as an anchor; body explains support, not satisfaction) | no source change |
| Table header: Control / How the integration closes it | Table header: Control / How the integration supports it | no source change |
| Table caption: What a governed integration closes. Control mapping is program design; | Table caption: What a governed integration supports. Control mapping is program design; | no source change |
| The federation mechanics close technical controls. They don't write the policies (AC-1, IA-1), sign the agreements with external systems, or run the access reviews that SP 800-53 expects alongside them. The gate in this chapter closes the external-system direction | The federation mechanics support technical controls; they don't satisfy them. They don't write the policies (AC-1, IA-1), sign the agreements with external systems, or run the access reviews that SP 800-53 expects alongside them, and the assessor decides whether each control is satisfied. The gate in this chapter supports the external-system direction | no source change |

## Consistency read, November 8, 2026

A read of the book against Book 04 Chapter 06, Book 11 Chapter 04 and its own chapters. No external source was re-opened.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Wording: onboarding is the densest control-supporting moment; the chapter supports the controls it names; consent restriction doesn't answer SA-9; a verdict addresses it (earlier wording said the design closes or doesn't close controls) | Opening; Consent restriction answers who, not whether | claim language narrowed; no fact change | CONTRIBUTING.md, Claim language |

## Learn coverage pass, November 9, 2026

Citations added from the Learn coverage map (covered-uncited pages). No content removed or changed in meaning.

| Learn page | Where cited | Date read | Supports |
|---|---|---|---|
| [Quickstart: Add an enterprise application](https://learn.microsoft.com/entra/identity/enterprise-apps/add-application-portal) | Opening scenario | Nov 9, 2026 | Adding a gallery application in the admin center |
| [Enable SAML single sign-on for an enterprise application](https://learn.microsoft.com/entra/identity/enterprise-apps/add-application-portal-setup-sso) | Opening scenario; Federation table, SC-8 row | Nov 9, 2026 | Configuring SAML single sign-on |
| [User provisioning management for enterprise apps](https://learn.microsoft.com/entra/identity/app-provisioning/configure-automatic-user-provisioning-portal) | Opening scenario | Nov 9, 2026 | Configuring provisioning for an enterprise app |
| [Application consent management and evaluation of consent requests](https://learn.microsoft.com/entra/identity/enterprise-apps/manage-consent-requests) | Consent restriction answers who, not whether | Nov 9, 2026 | Consent settings and evaluating requests |
| [Review and take action on admin consent requests](https://learn.microsoft.com/entra/identity/enterprise-apps/review-admin-consent-requests) | Consent restriction answers who, not whether | Nov 9, 2026 | Admin consent workflow review |
| [Protect against consent phishing](https://learn.microsoft.com/entra/identity/enterprise-apps/protect-against-consent-phishing) | OAuth application risk | Nov 9, 2026 | Attacker-registered apps and tricked consent |
| [App visibility and control with Microsoft Defender for Cloud Apps](https://learn.microsoft.com/entra/identity/enterprise-apps/cloud-app-security) | OAuth application risk | Nov 9, 2026 | Defender for Cloud Apps with Entra-connected apps |
| [What is automated app user provisioning in Microsoft Entra ID](https://learn.microsoft.com/entra/identity/app-provisioning/user-provisioning) | Federation table, AC-2 row | Nov 9, 2026 | Automated create, update and disable in SaaS apps |
| [Configure OIDC SSO for gallery and custom applications](https://learn.microsoft.com/entra/identity/enterprise-apps/add-application-portal-setup-oidc-sso) | Federation table, SC-8 row | Nov 9, 2026 | OpenID Connect single sign-on |
| [Application Management certificates frequently asked questions](https://learn.microsoft.com/entra/identity/enterprise-apps/application-management-certs-faq) | Phase 3 | Nov 9, 2026 | Three-year default; 60/30/7-day notices to up to five addresses |
| [PowerShell sample: Export enterprise apps with expiring secrets and certificates](https://learn.microsoft.com/entra/identity/enterprise-apps/scripts/powershell-export-enterprise-apps-with-expiring-secrets) | Phase 3 | Nov 9, 2026 | Finding expiring certificates ahead of rotation |
| [PowerShell sample: Export app registrations with expiring secrets and certificates](https://learn.microsoft.com/entra/identity/enterprise-apps/scripts/powershell-export-apps-with-expiring-secrets) | Phase 3 | Nov 9, 2026 | Finding expiring credentials ahead of rotation |
| [Tutorial - Customize Microsoft Entra attribute mappings](https://learn.microsoft.com/entra/identity/app-provisioning/customize-application-attributes) | Phase 4, enable provisioning | Nov 9, 2026 | Attribute mappings and scoping |
| [Plan an automatic user provisioning deployment](https://learn.microsoft.com/entra/identity/app-provisioning/plan-auto-user-provisioning) | Phase 4, enable provisioning | Nov 9, 2026 | Planning scope and mappings; quarantine after four weeks |
| [Quickstart: Create and assign a user account](https://learn.microsoft.com/entra/identity/enterprise-apps/add-application-portal-assign-users) | Phase 4, assignment required | Nov 9, 2026 | Assigning users to an app |
| [Understand how users are assigned to apps](https://learn.microsoft.com/entra/identity/enterprise-apps/ways-users-get-assigned-to-applications) | Phase 4, assignment required | Nov 9, 2026 | Assignment paths |
| [Find out when a specific user is able to access an app](https://learn.microsoft.com/entra/identity/app-provisioning/application-provisioning-when-will-provisioning-finish-specific-user) | Phase 5 | Nov 9, 2026 | Initial then periodic incremental cycles; provisioning not instant |
| [Provision a user or group on demand](https://learn.microsoft.com/entra/identity/app-provisioning/provision-on-demand) | Phase 5 | Nov 9, 2026 | On-demand provisioning |
| [Learn how Provisioning logs integrate with Azure Monitor](https://learn.microsoft.com/entra/identity/app-provisioning/application-provisioning-log-analytics) | Phase 6, logs | Nov 9, 2026 | Streaming provisioning logs out for retention and alerting |
| [Report automatic user account provisioning](https://learn.microsoft.com/entra/identity/app-provisioning/check-status-user-account-provisioning) | Phase 6, logs | Nov 9, 2026 | Provisioning reporting methods |
| [How to remove a user's access to an application](https://learn.microsoft.com/entra/identity/enterprise-apps/methods-for-removing-user-access) | Phase 7, offboard | Nov 9, 2026 | Removing assignments and disabling the app |
| [Delete an enterprise application](https://learn.microsoft.com/entra/identity/enterprise-apps/delete-application-portal) | Phase 7, offboard | Nov 9, 2026 | Retiring the enterprise application |
| [Assign enterprise application owners](https://learn.microsoft.com/entra/identity/enterprise-apps/assign-app-owners) | Help Desk Kit audit, orphaned application | Nov 9, 2026 | Assigning an owner |
| [Grant Consent on Behalf of a Single User](https://learn.microsoft.com/entra/identity/enterprise-apps/grant-consent-single-user) | Help Desk Kit audit, consent types | Nov 9, 2026 | Principal (single-user) consent |
| [Tutorial: Govern and monitor applications](https://learn.microsoft.com/entra/identity/enterprise-apps/tutorial-govern-monitor) | Keeping integrations authorized, access | Nov 9, 2026 | Access reviews and monitoring for apps |
| [Quickstart: View enterprise applications](https://learn.microsoft.com/entra/identity/enterprise-apps/view-applications-portal) | Keeping integrations authorized, inventory | Nov 9, 2026 | Listing enterprise applications |
| [Viewing apps using your tenant for identity management](https://learn.microsoft.com/entra/identity/enterprise-apps/application-list) | Keeping integrations authorized, inventory | Nov 9, 2026 | Application objects and service principals in the tenant |

## Zero Trust closure, Phase 4, November 11, 2026 (implementation conventions)

Section added: Putting the gate in place (control states, How-template map, authority labels, change safety, evidence checklist, assessment mapping). Product facts it points to are the rows above; the Global Administrator and assignment-required behavior is the Phase 4 row.

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | Global Administrators can sign in to an application regardless of Assignment required; Enabled for users to sign in = No stops token issuance | Putting the gate in place, Exclusions and Rollback | carried from the Phase 4 row's source | [Properties of an enterprise application](https://learn.microsoft.com/entra/identity/enterprise-apps/application-properties) (read Oct 21, 2026) | Nov 11, 2026 |
| 2 | Rings, audit phase, backout triggers and control-state evidence for the integration gate; assignment required on every application | Putting the gate in place | restated-as-design | Program design under Book 00, Appendix D | Nov 11, 2026 |
