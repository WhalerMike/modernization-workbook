# Verification — Appendix D, Migrating AD FS Applications

New appendix, Nov 9, 2026 (Learn coverage gaps: entra-apps gap 1 and 8, ws gap 3 and 4). Every Microsoft Learn page below was read on Nov 9, 2026. Program positions are marked restated-as-design.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| D1 | Domain conversion doesn't move other relying parties; a relying party trust keeps trusting the farm's signing certificate | Two migrations | restated-as-design (inferred from how relying party trusts work; Chapter 10 Phase 9 converts domains only) | Chapter 10 Phase 9; migrate-from-federation-to-cloud-authentication |
| D2 | The tool hides Microsoft relying parties (Office 365, `urn:federation:MicrosoftOnline`) and lists apps with an active sign-in in the last 30 days | Two migrations | verified | <https://learn.microsoft.com/entra/identity/enterprise-apps/migrate-ad-fs-application-overview> |
| D3 | GCC pairs with Entra ID in Azure; GCC High and DoD with Entra ID in Azure Government | Availability | verified | <https://learn.microsoft.com/azure/security/fundamentals/feature-availability> |
| D4 | Azure Government: federated authentication, SAML/OAuth SaaS apps, Application Proxy, secure hybrid access, Conditional Access, Connect Health reporting available | Availability | verified | <https://learn.microsoft.com/entra/identity/authentication/feature-availability> |
| D5 | The AD FS application migration tool, activity report and Usage & insights aren't named on the feature-availability page; the tool's pages state no government-cloud availability | Availability | verified (absence checked on the four pages); shown as "not yet specified" | feature-availability; migrate-ad-fs-application-overview; migrate-ad-fs-application-howto; recommendation-migrate-apps-from-adfs-to-azure-ad |
| D6 | Connect Health for AD FS lists Azure Government endpoints | Availability | verified | <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-health-adfs> |
| D7 | Relying party trust properties: identifiers, endpoints, access control policy, authorization, transform, additional authentication, delegation and impersonation rules, token lifetime, signed requests, encryption, claims providers | Step 1 | verified (parameter list of the AD FS module) | <https://learn.microsoft.com/powershell/module/adfs/set-adfsrelyingpartytrust>; add-adfsrelyingpartytrust |
| D8 | Inventory commands are read-only | Step 1 | restated-as-design (Get- cmdlets and local file writes only) | — |
| D9 | Tool prerequisites: Connect Health agents read RP settings and sign-in audit logs; dashboard path; 1/7/30 days; Cloud Application Administrator, Application Administrator, Global Reader, Report Reader; P1 or P2 | Step 1 | verified | migrate-ad-fs-application-howto |
| D10 | Three statuses; status job every 24 hours | Step 1 | verified | migrate-ad-fs-application-overview |
| D11 | Without P1/P2, Microsoft points to PowerShell tools on GitHub; Learn gives no commands | Step 1 | verified | <https://learn.microsoft.com/entra/identity/enterprise-apps/migrate-adfs-discover-scope-apps> |
| D12 | Other discovery: Defender for Cloud Apps, proxy and portal logs, business owners | Step 1 | verified | migrate-adfs-discover-scope-apps |
| D13 | Claim rule = condition `=>` issuance statement; `issue` vs `add`; regex `=~`; attribute stores incl. SQL | Step 2 | verified | <https://learn.microsoft.com/windows-server/identity/ad-fs/technical-reference/the-role-of-the-claim-rule-language> |
| D14 | Rule set types; without an issuance authorization rule all users are denied | Step 2 | verified | <https://learn.microsoft.com/windows-server/identity/ad-fs/technical-reference/the-role-of-claim-rules> |
| D15 | Pipeline order: acceptance, authorization, issuance | Step 2 | verified | <https://learn.microsoft.com/windows-server/identity/ad-fs/technical-reference/the-role-of-the-claims-pipeline> |
| D16 | Where each rule set goes in Entra ID | Step 2 table | verified (validation tests map IssuanceAuthorizationRules, IssuanceTransformRules, Delegation/Impersonation, additional authentication) | migrate-ad-fs-application-overview |
| D17 | Example group rule (illustrative SID and value) translates to a group-conditional claim | Step 2 | verified for the Entra feature; the rule text is illustrative | <https://learn.microsoft.com/entra/identity-platform/saml-claims-customization> |
| D18 | Tool flags EXTERNAL_ATTRIBUTE_STORE, UNSUPPORTED_ISSUANCE_TRANSFORMATION, UNSUPPORTED_ISSUANCE_CLASS and their fixes | Step 2 | verified | migrate-ad-fs-application-howto |
| D19 | Four phases; project team roles | Step 3 | verified | <https://learn.microsoft.com/entra/identity/enterprise-apps/migrate-adfs-apps-phases-overview> |
| D20 | Classify by criticality, usage, lifespan; worksheet; pilot choice | Step 3 | verified | <https://learn.microsoft.com/entra/identity/enterprise-apps/migrate-adfs-classify-apps-plan-pilot> |
| D21 | Path table: wizard SAML only; one WS-Fed endpoint; SAML 1.1 SharePoint; App Proxy / SHA for legacy; WS-Trust ActAs and artifact resolution unsupported; several claims providers to B2B | Step 3 | verified | migrate-ad-fs-application-howto; migrate-adfs-saml-based-sso; migrate-adfs-apps-stages; migrate-ad-fs-application-overview |
| D22 | Validation tests that decide the path (WS-Fed endpoints, AlwaysRequireAuthentication, AllowedAuthenticationClassReferences, EncryptedNameIdRequired, TokenLifetime and the one-hour AD FS default) | Step 3 | verified | migrate-ad-fs-application-overview |
| D23 | Access policy mapping table, incl. "With specific claims in the request" can't be migrated | Step 4 | verified | <https://learn.microsoft.com/entra/identity/enterprise-apps/migrate-adfs-represent-security-policies> |
| D24 | Sync groups and check membership before cutover | Step 4 | verified | <https://learn.microsoft.com/entra/identity/enterprise-apps/migrate-adfs-apps-stages> |
| D25 | Wizard carries only "Permit everyone"/"Permit specific groups", skips unsynced groups, creates no CA policies | Step 4 | verified | migrate-ad-fs-application-howto |
| D26 | SAML issuer, SAML and WS-Fed endpoints, per-app metadata URL; Entra doesn't consume app metadata directly | Step 5 | verified | <https://learn.microsoft.com/entra/identity/enterprise-apps/migrate-adfs-saml-based-sso>; <https://learn.microsoft.com/entra/identity-platform/federation-metadata> |
| D27 | Use the tenant's own URLs in GCC High and DoD | Step 5 | restated-as-design (sovereign sign-in hosts differ; the page gives commercial forms) | — |
| D28 | NameID default UPN and sources; two transformations per claim; 50 unique groups in conditions | Step 5 | verified | saml-claims-customization; migrate-adfs-saml-based-sso |
| D29 | SAML group overage at 150 | Step 5 | verified | <https://learn.microsoft.com/entra/identity-platform/reference-saml-tokens> |
| D30 | Signing certificate isn't migrated | Step 5 | verified | migrate-ad-fs-application-howto |
| D31 | Self-signed certificate valid three years; notifications 60/30/7 days to up to five addresses; renewal by overlap | Step 5 | verified | <https://learn.microsoft.com/entra/identity/enterprise-apps/tutorial-manage-certificates-for-federated-single-sign-on> |
| D32 | OIDC/OAuth apps must refresh rolled signing keys | Step 5 | verified | <https://learn.microsoft.com/entra/identity-platform/signing-key-rollover> |
| D33 | SAML token 1 hour default plus 5 minutes skew; 10 min to 23:59:59; Graph only; session via sign-in frequency | Step 5 | verified | <https://learn.microsoft.com/entra/identity-platform/configurable-token-lifetimes> |
| D34 | Entra can enforce signed SAML requests; SAML token encryption is P1/P2 | Step 5 | verified (the overview's "won't verify the signature" test note predates the enforce option; the appendix states the enforce option) | migrate-adfs-saml-based-sso |
| D35 | Four stages; testing per app type | Step 6 | verified | migrate-adfs-apps-stages; <https://learn.microsoft.com/entra/identity/enterprise-apps/migrate-adfs-plan-migration-test> |
| D36 | Rollback: leave RP on AD FS and remove access; wizard app inactive until used, no automatic cleanup | Step 6 | verified | migrate-adfs-plan-migration-test; migrate-ad-fs-application-howto |
| D37 | Disable-AdfsRelyingPartyTrust stops token issuance for the RP | Step 6 | verified | <https://learn.microsoft.com/powershell/module/adfs/disable-adfsrelyingpartytrust> |
| D38 | 30-day watch before removing a trust | Step 6 | restated-as-design | — |
| D39 | Basic audit level default on 2016+ (≤5 events/request); Set-AdfsProperties -AuditLevel | Step 7 | verified | <https://learn.microsoft.com/windows-server/identity/ad-fs/technical-reference/auditing-enhancements-to-ad-fs-in-windows-server> |
| D40 | Generate security audits right, auditpol "Application Generated", Success and Failure audits | Step 7 | verified | how-to-connect-health-adfs |
| D41 | Event 1200 Application Token Success; 1202 Fresh Credential Validation Success | Step 7 | verified | auditing-enhancements-to-ad-fs-in-windows-server; <https://learn.microsoft.com/windows-server/identity/ad-fs/troubleshooting/ad-fs-tshoot-logging> |
| D42 | Per-RP count by matching identifiers in event 1200 text | Step 7 | restated-as-design (illustrative; Learn gives no ready query) | — |
| D43 | Usage Analytics; Group Policy can turn auditing off | Step 7 | verified | how-to-connect-health-adfs |
| D44 | Entra recommendation "Migrate apps from AD FS" | Step 7 | verified | <https://learn.microsoft.com/entra/identity/monitoring-health/recommendation-migrate-apps-from-adfs-to-azure-ad> |
| D45 | Securing AD FS: minimal admins, OU/GPO, gMSA or long password, ports 443/49443, windowstransport endpoints off, federatedIdpMfaBehavior, SIEM, watch configuration changes | Securing | verified | <https://learn.microsoft.com/windows-server/identity/ad-fs/deployment/best-practices-securing-ad-fs> |
| D46 | Extranet Smart Lockout: applies through WAP; threshold below AD's; log-only 3-7 days then enforce; exact cmdlets | Securing | verified | <https://learn.microsoft.com/windows-server/identity/ad-fs/operations/configure-ad-fs-extranet-smart-lockout-protection> |
| D47 | Update-MgDomainFederationConfiguration -FederatedIdpMfaBehavior rejectMfaByFederatedIdp | Securing | verified (setting named on the securing page; cmdlet form as in the federation migration guidance) | best-practices-securing-ad-fs; migrate-from-federation-to-cloud-authentication |
| D48 | Windows Server 2019 minimum; 2016 gone by Jan 12, 2027 | Securing | restated-as-design (program assumption) | — |
| D49 | Retirement criteria; 90-day restorable window | Retirement | restated-as-design; 90 days from Chapter 10 Phase 9 | <https://learn.microsoft.com/entra/identity/hybrid/connect/migrate-from-federation-to-cloud-authentication> |
| D50 | Requirements and KSI mapping | Requirements | restated-as-design (program mapping; indicator IDs as used in Chapter 10) | Chapter 10 §Compliance Manager and the FedRAMP 20x indicators |

## Not used

- Microsoft's "Best practices to migrate applications and authentication" page still calls the migration tool "Currently in preview"; the how-to page doesn't. The appendix follows the how-to page.
- The GitHub "ADFS to AzureAD App Migration" scripts aren't documented on Learn; no commands from them are given.

## Zero Trust closure update, Phase 4 (Nov 11, 2026)

Conventions from [Book 00, Appendix D](../../b00-orientation/appendix-d-control-states-and-evidence.md) applied to this page's procedure sections: control states, How-template gaps, authority labels, evidence checklist, change safety and assessment mapping. Product claims below were re-read on Microsoft Learn on Nov 11, 2026.

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| P4-1 | "Every group ... must be synced" relabeled as Microsoft's migration stages (Microsoft-recommended) | Step 4 | restated-as-design (authority label) | Learn, as note aD-stages | Nov 11, 2026 |
| P4-2 | How-template mapping, rings, backout triggers, control states, evidence checklist and assessment mapping for each relying party's move | Rollout safety and evidence | restated-as-design (built from Steps 1–7, whose Learn sources are logged above) | — | Nov 11, 2026 |
