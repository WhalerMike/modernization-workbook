---
title: "Appendix D — Migrating AD FS Applications"
description: "How to move the applications that still sign in through AD FS to Microsoft Entra ID before the farm retires: the relying-party and claim-rule inventory, reading a claim rule, Microsoft's AD FS application migration tool and four-phase plan, how each kind of relying party moves, claims, tokens and signing keys in Entra ID, measuring what's left from the AD FS audit events, and keeping AD FS and Web Application Proxy secure while they stay in the sign-in path."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b02-identity
book: B02
part: Appendix
series-order: 93
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix D — Migrating AD FS Applications

*Converting the domain takes Microsoft 365 off AD FS in an hour; every other relying party has to be moved one at a time, and the farm can't retire until the last one is gone.*

::: {.callout-note}
## In this appendix
What [Chapter 10, Phase 9](10-migrating-and-governing.md#phase-9-federation-decommission-if-applicable) leaves open: the applications other than Microsoft 365 that trust AD FS. How to inventory relying parties and their claim rules, how to read a claim rule, what Microsoft's AD FS application migration tool and its four-phase plan do, how each kind of relying party moves to Entra ID, the Entra ID claims, token and signing-key behavior the migrated applications have to accept, how the AD FS audit events show what's still using the farm, and how to keep AD FS and Web Application Proxy secure until they're out of the path. Certificate authentication through AD FS moves separately, in [Book 07, Chapter 06](../b07-pki/06-device-and-user-certificates.md#migrating-from-ad-fs-certificate-authentication).
:::

## Two migrations, not one

An AD FS farm usually does two jobs. It federates the agency's Microsoft 365 domains, and it signs users in to other applications: SaaS products, line-of-business web applications and partner portals, each configured as a *relying party trust*. Chapter 10's Phase 9 handles the first job: staged rollout, then domain conversion with `Update-MgDomain`. It doesn't touch the second. A relying party trust keeps working after the domains are converted, because the application trusts the farm's token-signing certificate, not the domain, so the farm stays in the sign-in path for every application nobody moved.

Microsoft treats the two as separate work. Its AD FS application migration tool doesn't show Microsoft relying parties such as Office 365 (`urn:federation:MicrosoftOnline`) at all, and lists every other relying party that had an active sign-in in the last 30 days.[^aD-overview] This appendix is the second migration. Its exit is the Phase 9 step "Decommission AD FS": the farm can go only when the inventory below is empty.

## Availability in government clouds

GCC tenants use the commercial Microsoft Entra ID; GCC High and DoD tenants use Microsoft Entra ID in Azure Government.[^aD-gov-pairing] Microsoft's feature-availability page for Azure Government lists the capabilities this appendix relies on, with one exception: the migration tool itself.

| Capability | GCC | GCC High | DoD |
|---|---|---|---|
| SAML, WS-Federation and OpenID Connect single sign-on for enterprise applications | Commercial Entra ID feature | Available (Azure Government)[^aD-feature-avail] | Available (Azure Government)[^aD-feature-avail] |
| Conditional Access | Commercial Entra ID feature | Available[^aD-feature-avail] | Available[^aD-feature-avail] |
| Application Proxy for header-based and Integrated Windows Authentication applications | Commercial Entra ID feature | Available[^aD-feature-avail] | Available[^aD-feature-avail] |
| Microsoft Entra Connect Health for AD FS (the data behind the tool) | Commercial Entra ID feature | Reporting available; Learn lists the agent's Azure Government endpoints[^aD-feature-avail][^aD-health] | Same as GCC High |
| AD FS application migration tool and activity report | Commercial Entra ID feature; Learn states no exclusion | Not yet specified | Not yet specified |

Learn's feature-availability page doesn't name the AD FS application migration tool, the activity report or the "Usage & insights" blade, and the tool's own pages say nothing about government clouds. Treat the tool as unconfirmed in GCC High and DoD until Microsoft states it, and use the read-only inventory below, which needs nothing from the cloud.

## Step 1: Inventory the relying parties and their claim rules

Run the inventory on an AD FS server in the farm (on the primary server of a Windows Internal Database farm). It reads the configuration and changes nothing. Every relying party trust carries the properties the migration needs: identifiers, endpoints, the access control policy, the issuance authorization and transform rules, the additional authentication (MFA) rules, token lifetime and signing settings.[^aD-get-rpt]

```powershell
# Read-only: export every relying party trust and its rules from the AD FS farm
New-Item -ItemType Directory -Force -Path C:\adfs-inventory | Out-Null
Get-AdfsRelyingPartyTrust |
  Export-Clixml -Path C:\adfs-inventory\relying-party-trusts.xml
Get-AdfsRelyingPartyTrust |
  Select-Object Name, Enabled,
    @{n='Identifier';e={$_.Identifier -join ' '}},
    @{n='WSFedEndpoint';e={$_.WSFedEndpoint}},
    @{n='SamlEndpoints';e={($_.SamlEndpoints | ForEach-Object Location) -join ' '}},
    AccessControlPolicyName, TokenLifetime, SignedSamlRequestsRequired,
    EncryptClaims, EncryptedNameIdRequired,
    @{n='ClaimsProviderName';e={$_.ClaimsProviderName -join ' '}} |
  Export-Csv -Path C:\adfs-inventory\relying-party-trusts.csv -NoTypeInformation
```

```powershell
# Read-only: write each relying party's claim rules to its own text file
Get-AdfsRelyingPartyTrust | ForEach-Object {
  $file = Join-Path C:\adfs-inventory ("rules-" + ($_.Name -replace '[^A-Za-z0-9-]', '_') + ".txt")
  @(
    "# Relying party: $($_.Name)"
    "## IssuanceAuthorizationRules"; $_.IssuanceAuthorizationRules
    "## IssuanceTransformRules";     $_.IssuanceTransformRules
    "## AdditionalAuthenticationRules"; $_.AdditionalAuthenticationRules
    "## DelegationAuthorizationRules";  $_.DelegationAuthorizationRules
    "## ImpersonationAuthorizationRules"; $_.ImpersonationAuthorizationRules
  ) | Set-Content -Path $file
}
```

Commit the CSV and the rule files to the program's identity baseline repository, the same place the [Appendix C](appendix-c-identity-assessment-module.md#module-implementation) exports go. They're the record the migration works from, and the evidence of what the farm did before it was retired.

With Entra ID P1 or P2, Microsoft's tool adds what the export can't: which relying parties are actually used. It needs Microsoft Entra Connect Health agents on the AD FS servers, which read the relying party settings and the sign-in audit logs; the dashboard is under **Entra ID** > **Enterprise apps** > **Usage & Insights** > **AD FS application migration**, filtered to 1, 7 or 30 days, and the Cloud Application Administrator, Application Administrator, Global Reader or Report Reader role can view it.[^aD-howto] Each application gets one of three statuses, from the agents' data and a status job that runs every 24 hours:[^aD-overview]

- **Ready to migrate**: every setting is supported, and the application can move as configured.
- **Needs review**: some settings need a decision first.
- **Additional steps required**: some settings aren't supported in Entra ID, so the application can't move as configured.

Without P1 or P2, Microsoft points to its PowerShell-based "ADFS to Microsoft Entra app migration tools" on GitHub.[^aD-discover] Learn doesn't document their commands; the export above and the audit-event count in [Step 7](#step-7-measure-whats-left-from-the-ad-fs-audit-events) cover the same ground with documented cmdlets.

Discovery doesn't end at the farm. Microsoft's Phase 1 guidance adds Defender for Cloud Apps cloud discovery, proxy and portal logs, and asking business owners, because an application that signs in through another identity provider, or through Kerberos or headers, won't appear in the AD FS configuration at all.[^aD-discover] Those go to the [Chapter 04](04-the-hidden-migration-surface.md#ldap-proxy-dm_040-critical) LDAP inventory and the application classes below.

## Step 2: Read the claim rules

A claim rule is what the migration has to reproduce, so read it before deciding where the application goes. An AD FS claim rule has a condition and an issuance statement, joined by `=>`. The condition matches incoming claims, by single value, by several values joined with `&&`, or by regular expression (`=~`); the issuance statement either `issue`s a claim, which puts it in the outgoing token, or `add`s one, which only makes it available to later rules.[^aD-rule-language] A rule can also query an attribute store, Active Directory or another store such as SQL, for the values it issues.[^aD-rule-language]

Rules are grouped into rule sets, and each relying party has up to four of them that matter here:[^aD-claim-rules]

| Rule set | What it decides | Where it goes in Entra ID |
|---|---|---|
| Issuance authorization | Who may get a token at all. Without one, every user is denied by default | User and group assignment ("Assignment required"), plus Conditional Access |
| Issuance transform | Which claims go into the token, and how values are reshaped | **Single sign-on** > **Attributes & Claims** (claims customization) |
| Delegation and impersonation authorization | Whether one identity may act for another (WS-Trust) | OAuth 2.0 and OpenID Connect flows; no direct equivalent for a SAML application |
| Additional authentication | When to require MFA | Conditional Access |

The AD FS claims pipeline runs them in order: acceptance rules on the claims provider trust, then authorization, then issuance.[^aD-pipeline] Entra ID has no pipeline to configure. Authorization becomes assignment and Conditional Access, and issuance becomes the application's claims configuration, so translate each rule set separately.

Two examples show how the translation reads. The template rule "Send Group Membership as a Claim" usually looks like this:

```text
c:[Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/groupsid",
   Value == "S-1-5-21-1004336348-1177238915-682003330-1105", Issuer == "AD AUTHORITY"]
 => issue(Type = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role", Value = "FinanceApprover");
```

It issues a role claim to members of one AD group. In Entra ID the same result is a group condition on a claim: emit `FinanceApprover` in the role claim when the user is a member of the synced group, using the "emit claims based on conditions" feature.[^aD-saml-claims] The AD group has to be synced first, and its SID, not its name, is what the rule names; [Chapter 03](03-ad-and-entra-side-by-side.md#security-identifiers-and-what-replaces-them) explains why.

A custom rule that reads an attribute store other than Active Directory, or uses a regular expression to reshape a value, is the kind the tool flags. Microsoft's tool marks a rule `EXTERNAL_ATTRIBUTE_STORE` when it reads a store other than AD (Entra ID sources claims only from AD or Entra ID), `UNSUPPORTED_ISSUANCE_TRANSFORMATION` when it transforms with a regular expression, and `UNSUPPORTED_ISSUANCE_CLASS` when it uses `add`; the fixes are to sync the attribute, use the Entra transformation functions (`Extract()`, `Trim()`, `ToLower()` and the rest), and rebuild an `add` chain as several transformations.[^aD-howto] [Book 07, Chapter 06](../b07-pki/06-device-and-user-certificates.md#migrating-from-ad-fs-certificate-authentication) applies the same reading to certificate claim rules, which become username bindings.

## Step 3: Classify and plan

Microsoft's plan has four phases: discover and scope; classify applications and plan the pilot; plan migration and testing; and plan management and insights.[^aD-phases] It names a project team (a project manager, an identity architect or Entra application administrator, the on-premises AD operations team, the IT support manager, a security owner, and each application's technical and business owners) and a pilot group of users.[^aD-phases] The program adds nothing to that plan except its own record: each relying party is one row in the inventory, with an owner and a status.

Classify each relying party by business criticality, usage and expected lifespan, and record its type, current identity provider, security needs and dependencies; Microsoft's Application Discovery Worksheet has the fields.[^aD-classify] Retire what has no owner and no use instead of moving it.[^aD-discover] If the team is new to Entra ID, pilot with a low-priority application; otherwise start with gallery applications that support several identity providers.[^aD-classify] Then put each relying party on one of these paths:

| Relying party | Path | Notes |
|---|---|---|
| Microsoft 365 (`urn:federation:MicrosoftOnline`) | Domain conversion, [Chapter 10, Phase 9](10-migrating-and-governing.md#phase-9-federation-decommission-if-applicable) | Not shown by the tool; not an application migration |
| SAML 2.0 SaaS application in the Entra gallery | Gallery enterprise application with SAML single sign-on | Often also gets automatic provisioning |
| SAML 2.0 line-of-business application | Non-gallery enterprise application; the tool's wizard can create it | The wizard handles SAML only[^aD-howto] |
| WS-Federation application | Non-gallery enterprise application or app registration, configured by hand | Entra ID supports one WS-Federation endpoint per application; SharePoint applications that need SAML 1.1 tokens need more configuration[^aD-overview][^aD-saml-sso] |
| OpenID Connect or OAuth 2.0 application (AD FS application groups) | App registration, configured by hand | The wizard doesn't handle these[^aD-howto] |
| Non-claims-aware application published through Web Application Proxy (Kerberos or header) | Microsoft Entra application proxy, or a Secure Hybrid Access partner | Microsoft's route for legacy applications that won't be modernized[^aD-discover][^aD-stages] |
| Application that uses WS-Trust ActAs or SAML artifact resolution | Re-engineer, or keep on AD FS with a dated exception | Not supported in Entra ID today[^aD-saml-sso] |
| Relying party that accepts claims from several claims providers (partners) | B2B collaboration for the partner users, then the application moves | [Book 04, Appendix C](../b04-access/appendix-c-partner-access-profile-entra.md) has the partner route[^aD-overview] |

The tool's validation tests tell you which settings won't carry over. The ones that most often decide the path: more than one WS-Federation endpoint fails (Entra ID supports one); `AlwaysRequireAuthentication` and `AllowedAuthenticationClassReferences` fail and become Conditional Access; `EncryptedNameIdRequired` fails, because Entra ID encrypts the whole token, not single claims; and `TokenLifetime` warns, because the AD FS default is one hour and Entra ID handles session lifetime through Conditional Access.[^aD-overview]

## Step 4: Translate access policies to assignment and Conditional Access

AD FS access control policies and authorization rules become Entra ID assignments and Conditional Access policies. Microsoft's mapping:[^aD-policies]

| AD FS | Entra ID |
|---|---|
| Permit all users | "Assignment required" set to No, or the All Users dynamic group assigned |
| Permit a specific group (group SID) | Assign the synced group to the application |
| Permit a specific user (primary SID) | Assign the user |
| MFA for a user or group | A Conditional Access policy requiring MFA (for this program, an authentication strength) |
| MFA for unregistered devices | Conditional Access: require a compliant device, a hybrid-joined device or MFA |
| From a specific network (the "except" form) | A named location, excluded or included |
| Device trust level | The device filter or device state condition |
| With specific claims in the request | Can't be migrated; redesign the requirement |

Every group the rules name must be synced to Entra ID, with its membership checked, before the application cuts over.[^aD-stages] The tool's wizard carries over only the "Permit everyone" and "Permit specific groups" policies, skips groups that aren't synced, and creates no Conditional Access policies.[^aD-howto] Build the policies yourself, from the program's set in [Chapter 09](09-building-the-entra-target.md#the-policy-set), and run them report-only through the pilot.

## Step 5: Claims, tokens and signing keys in Entra ID

The application on the far end has to accept tokens from a new issuer, signed with a new certificate, carrying claims that may be shaped differently. Settle these before cutover.

**Endpoints and metadata.** Entra ID's SAML issuer is `https://sts.windows.net/{tenant-id}/`; the SAML sign-in and sign-out endpoint is `https://login.microsoftonline.com/{tenant-id}/saml2`, and the WS-Federation endpoint is `https://login.microsoftonline.com/{tenant-id}/wsfed`. Entra ID doesn't consume an application's federation metadata directly, so the application's settings are entered by hand; the application can read Entra ID's per-application metadata from `https://login.windows.net/{tenant-id}/federationmetadata/2007-06/federationmetadata.xml?appid={application-id}`.[^aD-saml-sso][^aD-fed-metadata] In GCC High and DoD the sign-in host is the Azure Government one, so take the URLs from the application's single sign-on page in the tenant, not from these commercial forms.

**Claims.** NameID defaults to the user principal name; the source can instead be mail, the mail prefix, `employeeid`, `onpremisessamaccountname`, a directory extension or extension attributes 1 to 15.[^aD-saml-claims][^aD-saml-sso] A claim takes at most two transformations, from a fixed set of functions (extract, join, case, contains, starts with, regex replace and others); conditional claims can name up to 50 unique groups across all of an application's claims.[^aD-saml-claims] A SAML token carries at most 150 groups; above that, it carries a link to Microsoft Graph instead, so an application that read a long group list from AD FS should get only the groups assigned to it.[^aD-saml-tokens] Attributes AD FS read from AD that Entra ID doesn't hold, such as `samAccountName`, have to be synced first.[^aD-saml-sso]

**The signing certificate.** The migration tool doesn't carry over the AD FS signing certificate.[^aD-howto] Entra ID generates a self-signed SAML signing certificate for each application, valid for three years, and emails up to five addresses 60, 30 and 7 days before it expires; renewal means creating a new certificate, giving it to the application, and making it active, with the dates overlapping.[^aD-certs] Record each certificate's expiry in the inventory and name an owner for the renewal: this is a new recurring task the farm used to do for every relying party at once. OpenID Connect and OAuth applications are different: they read Entra ID's signing keys from its metadata, which rolls them periodically without notice, so they must refresh keys rather than pin one.[^aD-signing-key]

**Token lifetime.** An Entra ID SAML token is valid for one hour by default, plus five minutes of clock skew; a token lifetime policy can set it from 10 minutes to 23 hours 59 minutes, through Microsoft Graph only. Session length is governed by Conditional Access sign-in frequency, not by token lifetime.[^aD-lifetimes] That matches the AD FS default of one hour.[^aD-overview]

**Signed requests and encryption.** AD FS could require signed SAML requests; Entra ID can enforce signed authentication requests per application.[^aD-saml-sso] SAML token encryption is a P1 or P2 feature.[^aD-saml-sso]

## Step 6: Pilot, cut over, and keep the rollback

Microsoft describes four stages for each application: the production application on AD FS; optionally, a test instance pointed at a test tenant; a test instance pointed at the production tenant; and, last, the production application pointed at the production tenant.[^aD-stages] Test a SAML application with "Test SAML Settings" on its single sign-on page, an OAuth or OpenID Connect application by checking consent under the application's permissions, and an Application Proxy application only with a running, assigned connector.[^aD-test]

Keep the rollback simple: leave the relying party on AD FS and remove its access rather than deleting it, so the application can be pointed back.[^aD-test] An application created by the wizard stays inactive until traffic is pointed at it, and there's no automatic cleanup; delete it by hand if the move is abandoned.[^aD-howto] After cutover, disable the relying party trust, watch the audit events in Step 7 for 30 days, and only then remove it.[^aD-disable-rpt]

```powershell
# After cutover: disable the relying party trust (reversible with Enable-AdfsRelyingPartyTrust)
Disable-AdfsRelyingPartyTrust -TargetName "<relying party name>"
```

## Step 7: Measure what's left from the AD FS audit events

The farm retires when nothing signs in through it. The AD FS audit events are the measure. On Windows Server 2016 and later, AD FS logs at the Basic level by default (no more than five events per request); `Set-AdfsProperties -AuditLevel` raises it to Verbose.[^aD-auditing] Auditing also has to be allowed in Windows: the AD FS service account needs the "Generate security audits" right, "Application Generated" auditing must be on, and Success and Failure audits must be ticked in the Federation Service properties.[^aD-health]

```powershell
# On each AD FS server, as an administrator: allow and confirm AD FS auditing
auditpol.exe /set /subcategory:"Application Generated" /failure:enable /success:enable
Get-AdfsProperties | Select-Object AuditLevel, LogLevel
# On the primary server, only if the program decides to keep Verbose during the measurement window
Set-AdfsProperties -AuditLevel Verbose
```

Two events matter for counting. Event 1200, "Application Token Success," is logged when AD FS issues a token to a relying party; event 1202, "Fresh Credential Validation Success," when it validates a user's credentials.[^aD-auditing][^aD-tshoot-logging] A relying party with no 1200 events across the measurement window has no users left on AD FS.

::: {.callout-warning}
## Illustrative code
The count below matches each relying party's identifier against the text of the 1200 events. It hasn't been tested against a production farm. Check the event text in your own Security log first, and run it on every AD FS server in the farm: each server logs only the requests it handled.
:::

```powershell
# Read-only, illustrative: count token issuance (event 1200) per relying party over 30 days
$since  = (Get-Date).AddDays(-30)
$events = Get-WinEvent -FilterHashtable @{ LogName = 'Security'; Id = 1200; StartTime = $since } -ErrorAction SilentlyContinue
Get-AdfsRelyingPartyTrust | ForEach-Object {
  $ids = $_.Identifier
  [pscustomobject]@{
    RelyingParty = $_.Name
    Enabled      = $_.Enabled
    TokensIssued = @($events | Where-Object { $m = $_.Message; $ids | Where-Object { $m -like "*$_*" } }).Count
  }
} | Sort-Object TokensIssued -Descending |
  Export-Csv -Path ("C:\adfs-inventory\token-count-{0:yyyyMMdd}.csv" -f (Get-Date)) -NoTypeInformation
```

With Connect Health, the same signal is in Usage Analytics and the migration tool's 1-, 7- and 30-day user counts, and it fails silently if a Group Policy turns AD FS auditing off.[^aD-health] Microsoft also raises an Entra recommendation, "Migrate apps from AD FS to Microsoft Entra ID," for applications it judges fully movable.[^aD-recommendation] Commit each month's count to the baseline repository; the trend to zero is the evidence that the farm can retire.

## Keeping AD FS and Web Application Proxy secure until they retire

While the farm is in the path, a compromise of it can issue tokens for every application that still trusts it, and for Microsoft 365 until the domains are converted. Harden it as a Tier 0 system for as long as it runs. Microsoft's guidance:[^aD-securing]

- **Limit and protect administration.** Keep AD FS administrators to a minimum, give the servers their own OU and Group Policy, and use a long random password or a group managed service account for the AD FS service account.
- **Expose the minimum.** Web Application Proxy talks to AD FS on TCP 443; port 49443 is needed only for certificate authentication. Publish only the proxy endpoints the remaining applications need, and turn off the WS-Trust `windowstransport` endpoints on the proxy:

```powershell
# On the primary AD FS server: stop publishing the WS-Trust windowstransport endpoints through the proxy
Set-AdfsEndpoint -TargetAddressPath /adfs/services/trust/2005/windowstransport -Proxy $false
Set-AdfsEndpoint -TargetAddressPath /adfs/services/trust/13/windowstransport -Proxy $false
```

- **Protect against password spray from the internet.** Extranet Smart Lockout applies to username-and-password requests that come through Web Application Proxy. Microsoft recommends setting its threshold below the AD account lockout threshold, running it in log-only mode first (three to seven days), then enforcing it:[^aD-esl]

```powershell
# On the primary AD FS server (Windows Server 2016 farm behavior level or later)
Set-AdfsProperties -EnableExtranetLockout $true -ExtranetLockoutThreshold 15 -ExtranetObservationWindow (New-TimeSpan -Minutes 30) -ExtranetLockoutRequirePDC $false
Set-AdfsProperties -ExtranetLockoutMode AdfsSmartlockoutLogOnly
Restart-Service adfssrv
# After the log-only window, on the primary server
Set-AdfsProperties -ExtranetLockoutMode AdfsSmartLockoutEnforce
Restart-Service adfssrv
```

  Pick the threshold from the domain's own lockout policy, not from the example; the values above are Microsoft's example.[^aD-esl]

- **Don't let the farm vouch for MFA.** Set the federated domains' `federatedIdpMfaBehavior` to `rejectMfaByFederatedIdp`, so Entra ID performs MFA itself instead of trusting the farm's claim:[^aD-securing]

```powershell
# Microsoft Graph PowerShell, as a Hybrid Identity Administrator or higher
Connect-MgGraph -Scopes "Domain.ReadWrite.All"
$fed = Get-MgDomainFederationConfiguration -DomainId "<federated domain>"
Update-MgDomainFederationConfiguration -DomainId "<federated domain>" -InternalDomainFederationId $fed.Id -FederatedIdpMfaBehavior "rejectMfaByFederatedIdp"
```

- **Log and watch.** Send the AD FS logs to the program's SIEM and watch for changes to the federation configuration.[^aD-securing] Chapter 10's [detection rules](10-migrating-and-governing.md#detection-rules) cover the Entra side.

The farm's own servers follow the program's Windows Server baseline: Windows Server 2019 is the minimum, and Windows Server 2016 must be gone by January 12, 2027 *(program assumption)*. A farm still on 2016 then is a reason to finish the migration, not to rebuild the farm.

## Retirement criteria

AD FS retires, in Chapter 10's Phase 9, when all of these are true:

1. Every relying party in the inventory is migrated, retired, or on a dated exception with an owner and an authorizing official's acceptance.
2. Event 1200 counts are zero for every relying party across a 30-day window, on every server in the farm.
3. Every federated domain is converted to managed authentication.
4. Every migrated SAML application's signing certificate has an owner and an expiry in the inventory.
5. The configuration, the rule files and the final counts are committed to the baseline repository.

Keep the farm restorable for 90 days after decommission, as Phase 9 does, because re-federating a domain needs it.[^aD-federation-migration]

## Requirements this appendix supports

The mapping is the program's. The controls are NIST SP 800-53 Rev. 5; the indicators are FedRAMP 20x Key Security Indicators. Moving applications to Entra ID supports these requirements; it doesn't satisfy them by itself. <!-- claims-ok: negation -->

| Requirement | What this appendix contributes | FedRAMP 20x indicator |
|---|---|---|
| CM-8 (System Component Inventory) | The relying-party and claim-rule inventory, committed to Git | `KSI-PIY-GIV`, Generating Inventories |
| AC-2 (Account Management), AC-3 (Access Enforcement) | Issuance authorization rules become assignments and Conditional Access, reviewed with every other application | `KSI-IAM-AAM`, Automating Account Management; `KSI-IAM-ELP`, Ensuring Least Privilege |
| IA-2 (Identification and Authentication) | Sign-in moves to Entra ID, under the phishing-resistant authentication strengths; the farm no longer vouches for MFA | `KSI-IAM-APM`, Adopting Passwordless Methods |
| AU-2 (Event Logging), AU-6 (Audit Record Review) | AD FS auditing on; monthly token-issuance counts; federation changes watched | `KSI-MLA-LET`, Logging Event Types; `KSI-MLA-RVL`, Reviewing Logs |

::: {.callout-tip}
## Continue the book
[← Previous: Appendix C — Identity Assessment Module](appendix-c-identity-assessment-module.md) · [Book index](index.md)
:::

[^aD-overview]: Microsoft Learn, "Overview of AD FS application migration," sections "Migration status" and "Validation tests," <https://learn.microsoft.com/entra/identity/enterprise-apps/migrate-ad-fs-application-overview> (accessed Nov 9, 2026).
[^aD-howto]: Microsoft Learn, "AD FS application migration to move AD FS apps to Microsoft Entra ID," sections "Prerequisites," "Claim rule tests," "Supported configurations," "Unsupported configurations" and "Rollback," <https://learn.microsoft.com/entra/identity/enterprise-apps/migrate-ad-fs-application-howto> (accessed Nov 9, 2026).
[^aD-gov-pairing]: Microsoft Learn, "Cloud feature availability for US Government customers" ("Office 365 GCC is paired with Microsoft Entra ID in Azure"; GCC High and DoD pair with Microsoft Entra ID in Azure Government), <https://learn.microsoft.com/azure/security/fundamentals/feature-availability> (accessed Nov 9, 2026).
[^aD-feature-avail]: Microsoft Learn, "Microsoft Entra feature availability" (Azure Government: federated authentication, SaaS apps with SAML and OAuth 2.0, Application Proxy, secure hybrid access, Conditional Access, Microsoft Entra Connect Health reporting), <https://learn.microsoft.com/entra/identity/authentication/feature-availability> (accessed Nov 9, 2026).
[^aD-health]: Microsoft Learn, "Microsoft Entra Connect Health agents for AD FS," sections "Outbound connectivity" (Azure Government endpoints) and "Enable auditing for AD FS," <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-health-adfs> (accessed Nov 9, 2026).
[^aD-get-rpt]: Microsoft Learn, "Set-AdfsRelyingPartyTrust" (relying party trust properties), <https://learn.microsoft.com/powershell/module/adfs/set-adfsrelyingpartytrust>, and "Get-AdfsRelyingPartyTrust," <https://learn.microsoft.com/powershell/module/adfs/get-adfsrelyingpartytrust> (accessed Nov 9, 2026).
[^aD-discover]: Microsoft Learn, "Phase 1: Discover and scope apps," <https://learn.microsoft.com/entra/identity/enterprise-apps/migrate-adfs-discover-scope-apps> (accessed Nov 9, 2026).
[^aD-rule-language]: Microsoft Learn, "The Role of the Claim Rule Language," <https://learn.microsoft.com/windows-server/identity/ad-fs/technical-reference/the-role-of-the-claim-rule-language> (accessed Nov 9, 2026).
[^aD-claim-rules]: Microsoft Learn, "The Role of Claim Rules," section "Claim rule set types," <https://learn.microsoft.com/windows-server/identity/ad-fs/technical-reference/the-role-of-claim-rules> (accessed Nov 9, 2026).
[^aD-pipeline]: Microsoft Learn, "The Role of the Claims Pipeline," <https://learn.microsoft.com/windows-server/identity/ad-fs/technical-reference/the-role-of-the-claims-pipeline> (accessed Nov 9, 2026).
[^aD-saml-claims]: Microsoft Learn, "Customize SAML token claims," sections "Edit nameID," "Claim transformations" and "Emit claims based on conditions," <https://learn.microsoft.com/entra/identity-platform/saml-claims-customization> (accessed Nov 9, 2026).
[^aD-phases]: Microsoft Learn, "Plan application migration to Microsoft Entra ID," <https://learn.microsoft.com/entra/identity/enterprise-apps/migrate-adfs-apps-phases-overview> (accessed Nov 9, 2026).
[^aD-classify]: Microsoft Learn, "Phase 2: Classify apps and plan pilot," <https://learn.microsoft.com/entra/identity/enterprise-apps/migrate-adfs-classify-apps-plan-pilot> (accessed Nov 9, 2026).
[^aD-saml-sso]: Microsoft Learn, "SAML-based single sign-on: Configuration and Limitations," <https://learn.microsoft.com/entra/identity/enterprise-apps/migrate-adfs-saml-based-sso> (accessed Nov 9, 2026).
[^aD-stages]: Microsoft Learn, "Understand the stages of migrating application authentication from AD FS to Microsoft Entra ID," <https://learn.microsoft.com/entra/identity/enterprise-apps/migrate-adfs-apps-stages> (accessed Nov 9, 2026).
[^aD-policies]: Microsoft Learn, "Represent AD FS security policies in Microsoft Entra ID: Mappings and examples," <https://learn.microsoft.com/entra/identity/enterprise-apps/migrate-adfs-represent-security-policies> (accessed Nov 9, 2026).
[^aD-fed-metadata]: Microsoft Learn, "Federation metadata," <https://learn.microsoft.com/entra/identity-platform/federation-metadata> (accessed Nov 9, 2026).
[^aD-saml-tokens]: Microsoft Learn, "SAML token claims reference," <https://learn.microsoft.com/entra/identity-platform/reference-saml-tokens> (accessed Nov 9, 2026).
[^aD-certs]: Microsoft Learn, "Tutorial: Manage certificates for federated single sign-on," <https://learn.microsoft.com/entra/identity/enterprise-apps/tutorial-manage-certificates-for-federated-single-sign-on> (accessed Nov 9, 2026).
[^aD-signing-key]: Microsoft Learn, "Signing key rollover in the Microsoft identity platform," <https://learn.microsoft.com/entra/identity-platform/signing-key-rollover> (accessed Nov 9, 2026).
[^aD-lifetimes]: Microsoft Learn, "Configurable token lifetimes in the Microsoft identity platform," <https://learn.microsoft.com/entra/identity-platform/configurable-token-lifetimes> (accessed Nov 9, 2026).
[^aD-test]: Microsoft Learn, "Phase 3: Plan migration and testing," <https://learn.microsoft.com/entra/identity/enterprise-apps/migrate-adfs-plan-migration-test> (accessed Nov 9, 2026).
[^aD-auditing]: Microsoft Learn, "Auditing Enhancements to AD FS in Windows Server 2016," <https://learn.microsoft.com/windows-server/identity/ad-fs/technical-reference/auditing-enhancements-to-ad-fs-in-windows-server> (accessed Nov 9, 2026).
[^aD-tshoot-logging]: Microsoft Learn, "Troubleshoot Active Directory Federation Services with events and logging," <https://learn.microsoft.com/windows-server/identity/ad-fs/troubleshooting/ad-fs-tshoot-logging> (accessed Nov 9, 2026).
[^aD-recommendation]: Microsoft Learn, "Microsoft Entra recommendation: Migrate apps from ADFS to Microsoft Entra ID," <https://learn.microsoft.com/entra/identity/monitoring-health/recommendation-migrate-apps-from-adfs-to-azure-ad> (accessed Nov 9, 2026).
[^aD-securing]: Microsoft Learn, "Best practices for securing Active Directory Federation Services," <https://learn.microsoft.com/windows-server/identity/ad-fs/deployment/best-practices-securing-ad-fs> (accessed Nov 9, 2026).
[^aD-esl]: Microsoft Learn, "AD FS Extranet Lockout and Extranet Smart Lockout Overview," <https://learn.microsoft.com/windows-server/identity/ad-fs/operations/configure-ad-fs-extranet-smart-lockout-protection> (accessed Nov 9, 2026).
[^aD-disable-rpt]: Microsoft Learn, "Disable-AdfsRelyingPartyTrust," <https://learn.microsoft.com/powershell/module/adfs/disable-adfsrelyingpartytrust> (accessed Nov 9, 2026).
[^aD-federation-migration]: Microsoft Learn, "Migrate from federation to cloud authentication," <https://learn.microsoft.com/entra/identity/hybrid/connect/migrate-from-federation-to-cloud-authentication> (accessed Nov 9, 2026).
