---
title: "Non-Person Identity: Zero Trust, SASE and Other Clouds"
description: "What keeping a service account (a user account used as a service, an sMSA, a gMSA or a dMSA) costs in Zero Trust and SASE terms, compared with moving the workload to a Microsoft Entra workload identity, for SQL Server, IIS, scheduled tasks and Windows services, RHEL and other Linux, and workloads in AWS GovCloud (US) and Oracle Cloud. Scored against the CISA Zero Trust Maturity Model's Identity and Applications and Workloads pillars; what Global Secure Access, Private Access and application proxy do and don't do for a service account and its SPNs; a certificate map from each SA, MSA and SPN to its Entra target; and whether agencies should extend Microsoft Entra ID across clouds, for people and for workloads."
doc-type: workbook-guide
audience: [Executive, Technical, Customer]
family: guides
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
research-status: draft
research-type: implementation guide
research-book: "Books 02, 04, 06, 09, 11"
review-status: approved
reviewed-sha256: 530db19700e026f2781f59bac794e06d485c100b3acf355253f3c17d22aee6f0
last-reviewed: 2026-11-24
---
# Non-Person Identity: Zero Trust, SASE and Other Clouds

*A gMSA fixes the password, not the protocol: the service still speaks Kerberos to Active Directory, where Conditional Access, Global Secure Access and the Zero Trust maturity model can't see it.*

::: {.callout-tip}
## Which guide?
The Non-Person Identity track has three guides. [*Non-Person Identity: An Implementation Guide*](non-person-identity-implementation.md) runs the track as gates G1 to G6. [*Service Accounts: From User Accounts to gMSAs to Microsoft Entra Workload Identities*](service-account-migration.md) moves one account at a time. This page is the *why*: what each choice does to the program's Zero Trust maturity and its SASE design, workload by workload and cloud by cloud, and which certificates each move adds or removes.
:::

::: {.callout-note}
## In this guide
The answer in brief; the Zero Trust scorecard; what SASE does and doesn't do for a service account; the workloads one by one (SQL Server, IIS, scheduled tasks and Windows services, RHEL and Linux, AWS GovCloud (US), OCI); the certificate map from each service account and SPN to its Entra target; NTLM; whether to extend Microsoft Entra ID across clouds; dangers; checklist.
:::

## The answer in brief {#in-brief}

- **A gMSA or dMSA is a better password, not a Zero Trust identity.** It removes the human-known password, which is the Kerberoasting risk ([SPNs and service accounts](service-account-migration.md#spns)), but the workload still authenticates with Kerberos against Active Directory. Nothing in Entra ID evaluates that sign-in, so Conditional Access, Entra's risk signals and the sign-in logs never see it.
- **A Microsoft Entra workload identity moves the identity into the program's central store,** with no secret anyone holds (a managed identity or a federated credential) or a short-lived certificate, and every token it gets is logged in Entra ID. That's the Identity pillar's direction of travel; the limit is that Conditional Access for workload identities covers single-tenant service principals only, not managed identities.[^zt-cawi]
- **SASE protects the people in front of a service, not the service itself.** Private Access and application proxy put Entra sign-in and phishing-resistant MFA in front of a Kerberos application, then reach it with Kerberos constrained delegation to its SPN; the application's own service account and SPN stay where they are.[^zt-kcd] Service-to-service traffic doesn't go through the Global Secure Access client, which runs on end-user devices.[^zt-gsa-client]
- **Certificates change shape, not count.** Kerberos and SPNs need none; a SQL Server that takes Entra logins needs a CA-issued TLS certificate; an app registration needs its own certificate; a managed identity needs none ([the certificate map](#certificate-map)).
- **Extend Entra ID for people across every cloud; don't force one workload identity across them.** People: one identity provider, federated into AWS IAM Identity Center, OCI identity domains and Linux sign-in. Workloads: each platform's native identity with no stored secret, governed from one record (design guidance, [below](#extend-entra)).

## The Zero Trust scorecard {#scorecard}

The CISA Zero Trust Maturity Model defines an identity as attributes that describe "an agency user or entity, including non-person entities", so service accounts are inside the Identity pillar, not beside it.[^zt-ztmm] The table scores each kind of service identity against the pillar's functions. The stages are the model's; where each kind lands is the program's reading (design guidance).

| ZTMM function (Identity pillar) | User account used as a service | gMSA or dMSA | Entra workload identity (managed identity, federated credential, app registration with a certificate) |
|---|---|---|---|
| **Authentication.** Traditional is "passwords or multi-factor authentication"; Optimal "continuously validates identity"[^zt-ztmm] | Traditional: a static password, often never expiring, crackable offline if it holds an SPN | Better than Traditional on the credential (generated, rotated, unknown to people), but static Kerberos access with no continuous evaluation | Token-based, short-lived and logged; a managed identity has no credential to steal. Workloads "can't perform multifactor authentication",[^zt-cawi] so the workload equivalent of phishing-resistant MFA is having no stored secret |
| **Identity stores.** Traditional is "self-managed, on-premises" stores; Optimal "securely integrates their identity stores across all partners and environments"[^zt-ztmm] | On-premises AD only | On-premises AD only | Entra ID, the program's integrated store; federation reaches other clouds |
| **Risk assessments.** Optimal determines risk "in real time"[^zt-ztmm] | Defender for Identity on domain controller traffic | Defender for Identity; no Entra risk signal | Entra ID Protection risk and Conditional Access for workload identities (single-tenant service principals) |
| **Access management.** Traditional is "permanent access with periodic review"; Optimal is "just-in-time and just-enough access"[^zt-ztmm] | Standing group memberships and delegation | Standing, scoped by the retriever group and the account's rights | Role assignments and app roles, reviewable in Entra and Azure; still standing, but visible and scoped per resource |

**What this means for the program's scores.** Every account kept on Kerberos (`Keep` or `KeepKerberos`, [the decision path](service-account-migration.md#decision-path)) holds the Identity pillar's Identity stores function at Traditional for that workload until its end date (WD-165), whatever the rest of the estate reaches. The [Zero Trust assessment guide](zero-trust-assessment-implementation.md) and [Book 11, Chapter 08](../b11-zero-trust/08-close-before-you-assess.md) already count legacy authentication that service accounts still use as a finding; the island list from [the developer workbook's Chapter 06](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md) is that finding's evidence.

## What SASE does and doesn't do for a service account {#sase}

The program's SASE is Microsoft's Security Service Edge, Global Secure Access ([implementation guide](global-secure-access-implementation.md)). Three of its parts touch service accounts:

| Global Secure Access part | What it does | What it means for a service account and its SPN |
|---|---|---|
| **Private Access and application proxy, with Kerberos SSO** | The user signs in to Entra ID, under Conditional Access; the connector then "impersonat[es] the user to get a Kerberos token to the application", which needs the connector and the application server domain joined, and the application's SPN in the connector's delegation list[^zt-kcd] | The application keeps running as its service account, which holds the SPN (Learn's example is a `webserviceaccount` that is a user or a computer account).[^zt-kcd] Moving the SPN to a gMSA at A5 means updating the connector's delegation entry in the same change ([A5's delegation check](service-account-migration.md#migration-a)) |
| **Private Access for domain controllers** | Puts Conditional Access and phishing-resistant MFA in front of Kerberos to on-premises applications, for "the users who are synchronized from Active Directory"; the sensor starts in audit mode[^zt-dc] | Scoped to users. Once enforced, Kerberos to a protected SPN from a device without the Global Secure Access client is blocked,[^zt-dc] so service-to-service Kerberos needs an SPN exclusion ([GSA guide, Step 10](global-secure-access-implementation.md#step-10-privileged-protocols)) |
| **The Global Secure Access client** | Controls "network traffic at the end-user computing device"[^zt-gsa-client] | A server-side workload's own traffic isn't in the SASE path. Its protection is its identity (this track) and its network segmentation ([Book 09](../b09-network/index.md)) |

So SASE and this track meet at the SPN: the connector delegates to it, the domain controller sensor guards it, and the island list names who owns it. A Kerberos application published through Private Access is Zero Trust at the front door and Traditional behind it until its service account moves.

## The workloads, one by one {#workloads}

| Workload | Today | Target ([decision path](service-account-migration.md#decision-path)) | Zero Trust gain | SASE path |
|---|---|---|---|---|
| **SQL Server engine** | A user account or gMSA, `MSSQLSvc` SPN | The gMSA stays the Windows logon account; the instance gets an Entra identity: the Arc managed identity on SQL Server 2025, an app registration with a certificate on 2022 ([Book 06, Chapter 09](../b06-data-platform/09-what-arc-provides-to-sql-server.md)) | Users and applications sign in with Entra logins; Microsoft lists "non-interactive mechanisms including managed identities" for SQL Server's Entra authentication[^zt-sql] | Users reach it through Private Access; the engine's Kerberos stays on the island until its logins are Entra-only |
| **Applications that call SQL Server** | A user account or gMSA with a Windows login | A managed identity, or a service principal with a certificate, with an Entra login in SQL Server ([Book 06, Chapter 18](../b06-data-platform/18-the-four-class-pattern-for-applications.md)) | The connection moves from Kerberos to an Entra token | Not in the SASE path (server to server) |
| **IIS sites and application pools** | A user account or gMSA, `HTTP` SPN | gMSA now; a managed identity when the site moves to Azure ([Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md)) | Users sign in with Entra through application proxy or Private Access; the pool's own calls to Microsoft APIs use an Entra identity | Application proxy or Private Access with Kerberos SSO to the `HTTP` SPN |
| **Scheduled tasks and Windows services** | A user account, often with a password that never expires | gMSA now; an Azure Automation runbook with a managed identity once moved ([Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md)) | The password goes; the identity moves to Entra only when the job does | Not in the SASE path |
| **RHEL and other Linux services** | An AD-joined host (SSSD and realmd) with a keytab, or Red Hat's "Managed Service Account" made with `adcli create-msa`[^zt-rhel] | The platform's workload identity: an IAM role on EC2, an instance principal on OCI, the Arc managed identity for calls to Azure | A keytab on disk is a long-lived Kerberos key, unlike a Windows gMSA; the platform identity has no stored secret | Operators sign in to the host with Entra ID ([below](#linux)); the workload itself isn't in the SASE path |
| **AWS GovCloud (US) workloads** | IAM roles, or IAM users with access keys ([implementation guide, 1g](non-person-identity-implementation.md#step-1g-aws)) | An IAM role; to call Microsoft APIs, a federated credential once tested (WD-171) | Temporary credentials; keys are exceptions | People reach AWS through IAM Identity Center federated with Entra |
| **OCI workloads** | Instance, resource or workload principals, or users with API keys ([1h](non-person-identity-implementation.md#step-1h-oci)) | A principal; keys are exceptions (WD-171) | No stored secret | People reach OCI through its identity domain federated with Entra |

### RHEL and Linux sign-in {#linux}

Red Hat recommends joining a RHEL host to AD with SSSD and `realm`; its "Managed Service Account" is an AD account "that corresponds to a specific computer", created with `adcli create-msa`, whose Kerberos key is written to a keytab on the host.[^zt-rhel] That's a different thing from a Windows gMSA: the key sits in a file, so it's a long-lived secret to protect and rotate. For people, Microsoft Entra ID can be the sign-in for SSH on Azure Linux VMs and on Azure Arc-enabled Linux servers, with RHEL 7.4 to 7.9, 8.3 and later, 9.0 and later and 10.1 listed as supported.[^zt-linux] An RHEL instance in AWS GovCloud (US) or OCI that's onboarded to Arc can use the same Entra sign-in, so operators keep one identity across clouds (design guidance; the Arc onboarding of other clouds' servers is in the [Arc track guide](arc-track-implementation.md)).

## The certificate map {#certificate-map}

Moving a service account or its SPN to Entra changes which certificates exist. Each row starts from what the workload holds today; the [passwords, certificates or neither table](service-account-migration.md#credentials) gives each identity's credential, and the [SPN section](service-account-migration.md#spns) explains why an SPN needs no certificate.

| From (today) | To (Entra target) | Certificates before | Certificates after | Who issues and renews |
|---|---|---|---|---|
| SQL Server engine as a user account or gMSA, `MSSQLSvc` SPN, Windows logins | Same engine account, Entra logins added | Optional TLS certificate; Kerberos needs none | A CA-issued TLS certificate on every instance that takes Entra logins, with the service account able to read its key ([explainer](../explainers/hybrid-credentials.md)) | CyberArk Certificate Manager, from the program's AD CS ([Book 06, Chapter 22](../b06-data-platform/22-where-sql-server-touches-adcs.md#certificates-and-the-clm-platform)) |
| SQL Server 2022 instance | Its Entra identity | None | An app-registration certificate in Key Vault | Key Vault and the Arc extension, when service-managed |
| SQL Server 2025 instance | The Arc managed identity | None | None | Azure |
| IIS pool as a user account or gMSA, `HTTP` SPN | Published through application proxy or Private Access with Kerberos SSO | The site's TLS certificate | The same site certificate; the connector reaches the SPN with Kerberos, no new certificate | CyberArk Certificate Manager for the site; Microsoft for the application proxy endpoint ([Book 07, Chapter 06](../b07-pki/06-device-and-user-certificates.md)) |
| An application calling Graph as a user account | An app registration | None | An app-registration certificate, at most 180 days ([Book 13, Chapter 14](../b13-governance/14-application-secret-and-configuration-governance.md#secrets-governance)) | The owner, or Key Vault's renewal |
| An application calling Graph as a user account, on Azure or Arc | A managed identity | None | None | Azure |
| A workload outside AWS using an IAM user's key | IAM Roles Anywhere | None (a secret key) | An X.509 certificate from the program's PKI | The certificate platform; GovCloud needs CRLs imported |
| A RHEL host's AD keytab | The platform's workload identity | None (a keytab) | None for an IAM role or an OCI principal | AWS or OCI |

## NTLM {#ntlm}

The program's NTLM backstop is April 1, 2027, its own date rather than an external deadline ([WD-027](../../about/decision-register.md#wd-027); [Book 06](../b06-data-platform/index.md)). It applies to service accounts too: after that date, an account kept in AD (`Keep` or `KeepKerberos`) authenticates with Kerberos only, never NTLM, and its end date still follows WD-165. Microsoft's own position is that NTLM "is still supported" and Kerberos "is the preferred authentication method".[^zt-ntlm] An SPN that's missing or on the wrong account is the usual way a service falls back to NTLM without anyone choosing it ([SPNs and service accounts](service-account-migration.md#spns)).

## Should agencies extend Microsoft Entra ID across clouds? {#extend-entra}

**For people, yes.** OMB M-22-09 says "Agencies must employ centralized identity management systems for agency users that can be integrated into applications and common platforms",[^zt-m2209] and the maturity model's Optimal identity store "securely integrates" stores "across all partners and environments".[^zt-ztmm] Entra ID can be that one store for the program's people in every cloud it uses:

- **AWS GovCloud (US):** IAM Identity Center connects "your existing identity provider", and runs in GovCloud with FIPS endpoints and `aws-us-gov` ARNs.[^zt-aws-idc] Human access in [Book 04, Chapter 04](../b04-access/04-privileged-roles-and-tiers.md) already uses its permission sets.
- **OCI:** Oracle documents single sign-on and identity lifecycle management between OCI IAM and Microsoft Entra ID, for tenancies with identity domains.[^zt-oci-entra] The program's OC2 tenancy has to confirm it has identity domains ([implementation guide, 1h](non-person-identity-implementation.md#step-1h-oci)).
- **Linux hosts:** Entra sign-in for SSH on Azure and Arc-enabled Linux, RHEL included ([above](#linux)).

**For workloads, no single store; one record instead.** M-22-09's sentence is about agency users. A workload is safest with its own platform's identity, which has no stored secret and never leaves that platform: an IAM role in AWS, a principal in OCI, a managed identity in Azure. Forcing an Entra identity onto an AWS workload would mean a secret or a certificate where AWS would issue temporary credentials for free. What the program extends across clouds for workloads is the governance, not the credential: one inventory joined to a system record with two owners and a sponsor ([implementation guide, Step 1](non-person-identity-implementation.md#step-1-inventory-every-non-person-identity)), one exception rule for long-lived keys ([Book 13, Chapter 14](../b13-governance/14-application-secret-and-configuration-governance.md#secrets-governance)), and federation between platforms where a workload must call across, such as an AWS workload calling Microsoft Graph with a federated credential once tested ([WD-171](../../about/decision-register.md#wd-171)). This split is the program's recommendation (design guidance).

## Dangers and how to avoid them {#dangers}

| Danger | What goes wrong | How to avoid it |
|---|---|---|
| Counting a gMSA as "done" for Zero Trust | The Identity pillar stays at Traditional for the workload, unseen | Score kept accounts against the [scorecard](#scorecard); the island list carries them to an end date |
| Publishing a Kerberos app through Private Access and forgetting its service account | The front door is Zero Trust, the back end isn't; an SPN move breaks SSO | Record the application's service account and SPN with the published app; move the connector's delegation in A5's change |
| Enforcing the domain controller sensor on an SPN a service uses | Service-to-service Kerberos is blocked | Start in audit, add SPN exclusions to the exception register, then enforce ([GSA guide, Step 10](global-secure-access-implementation.md#step-10-privileged-protocols)) |
| Treating a RHEL keytab like a gMSA | A long-lived key on disk goes unrotated | Inventory keytabs as secrets; move the workload to its platform identity |
| One Entra identity for every cloud's workloads | Secrets or certificates where the platform would issue temporary credentials | Native workload identities, one governance record, federation only to cross platforms |

## Checklist {#checklist}

- [ ] Every account kept on Kerberos is scored against the Identity pillar, with its end date and owner.
- [ ] Every Kerberos application published through Private Access or application proxy names its service account and SPN, and the connector's delegation entry moved with any SPN.
- [ ] SPN exclusions for service-to-service Kerberos are in the exception register before the domain controller sensor is enforced.
- [ ] Every SQL Server instance that takes Entra logins has a CA-issued TLS certificate the service account can read.
- [ ] No service account uses NTLM after April 1, 2027 (WD-027).
- [ ] Program people sign in to AWS, OCI and Linux hosts with Entra ID; workloads use their platform's identity, each joined to a record.

## Back to the track

- [Non-Person Identity: An Implementation Guide](non-person-identity-implementation.md) and [Service Accounts](service-account-migration.md)
- [Global Secure Access implementation guide](global-secure-access-implementation.md), [Zero Trust assessment guide](zero-trust-assessment-implementation.md), [Book 11, Chapter 08](../b11-zero-trust/08-close-before-you-assess.md)
- [Certificates, Tokens and Keys Across the Hybrid Estate](../explainers/hybrid-credentials.md)

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

This guide has not been published in an edition yet. Each edition is kept, with its Word editions, decks and videos, on the [Archive](../../about/archive.md) page. Every change so far is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/guides/non-person-identity-zero-trust-sase.md).

<!-- revisions:end -->

[^zt-ztmm]: CISA, *Zero Trust Maturity Model*, Version 2.0, April 2023, section 5.1, "Identity," and Table 2, <https://www.cisa.gov/sites/default/files/2023-04/zero_trust_maturity_model_v2_508.pdf> (accessed Nov 24, 2026). CISA's landing page for the model is now marked archived.
[^zt-cawi]: Microsoft Learn, "Microsoft Entra Conditional Access for workload identities" (single-tenant service principals; managed identities aren't covered; workload identities can't perform multifactor authentication; Workload Identities Premium), <https://learn.microsoft.com/entra/identity/conditional-access/workload-identity> (accessed Nov 24, 2026).
[^zt-kcd]: Microsoft Learn, "Kerberos Constrained Delegation for single sign-on (SSO) to your apps with application proxy" (the connector impersonates the user; the connector and app servers are domain joined; the SPN in the delegation list; the application server runs under `webserviceaccount`), <https://learn.microsoft.com/entra/identity/app-proxy/how-to-configure-sso-with-kcd>; "Use Kerberos for single sign-on (SSO) with Microsoft Entra Private Access," <https://learn.microsoft.com/entra/global-secure-access/how-to-configure-kerberos-sso> (accessed Nov 24, 2026).
[^zt-dc]: Microsoft Learn, "Configure Microsoft Entra Private Access for Active Directory Domain Controllers" (synchronized users; phishing-resistant authentication; the sensor in audit mode by default; direct access to a protected SPN blocked), <https://learn.microsoft.com/entra/global-secure-access/how-to-configure-domain-controllers> (accessed Nov 24, 2026).
[^zt-gsa-client]: Microsoft Learn, "Learn about the Global Secure Access clients," <https://learn.microsoft.com/entra/global-secure-access/concept-clients> (accessed Nov 24, 2026).
[^zt-sql]: Microsoft Learn, "Microsoft Entra authentication for SQL Server overview" (SQL Server 2022 and later; non-interactive mechanisms including managed identities), <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview> (accessed Nov 24, 2026).
[^zt-rhel]: Red Hat, *Integrating RHEL systems directly with Windows Active Directory*, RHEL 9, chapter 1 (SSSD and realmd) and chapter 5, "Accessing AD with a Managed Service Account" (`adcli create-msa`; the keytab), <https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html-single/integrating_rhel_systems_directly_with_windows_active_directory/index> (accessed Nov 24, 2026).
[^zt-linux]: Microsoft Learn, "Sign in to a Linux virtual machine in Azure by using Microsoft Entra ID and OpenSSH" (Azure Linux VMs and Azure Arc-enabled Linux servers; supported distributions), <https://learn.microsoft.com/entra/identity/devices/howto-vm-sign-in-azure-ad-linux> (accessed Nov 24, 2026).
[^zt-ntlm]: Microsoft Learn, "NTLM overview in Windows Server," <https://learn.microsoft.com/windows-server/security/kerberos/ntlm-overview> (accessed Nov 24, 2026).
[^zt-m2209]: Office of Management and Budget, M-22-09, "Moving the U.S. Government Toward Zero Trust Cybersecurity Principles," January 26, 2022, section III.A, <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf> (accessed Nov 24, 2026).
[^zt-aws-idc]: AWS, AWS GovCloud (US) User Guide, "AWS IAM Identity Center in AWS GovCloud (US)," <https://docs.aws.amazon.com/govcloud-us/latest/UserGuide/govcloud-sso.html> (accessed Nov 24, 2026).
[^zt-oci-entra]: Oracle, OCI documentation, "SSO Between OCI and Microsoft Entra ID" and "Identity Lifecycle Management Between OCI IAM and Entra ID" (tenancies with identity domains), <https://docs.oracle.com/en-us/iaas/Content/Identity/tutorials/azure_ad/sso_azure/azure_sso.htm> (accessed Nov 24, 2026).
