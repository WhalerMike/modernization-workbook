---
title: "Why the Inheritance Must End"
doc-type: sql-server-narrative-chapter
audience: [Technical, Customer]
family: sql-server-narrative
book: "01"
series-order: 2
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

# Chapter 2 — Why the Inheritance Must End

*Three drivers, each as well-reasoned as the original design, and their dependency structure.*

::: {.callout-note}
## In this chapter
The three forces that now require replacing Windows Authentication for SQL Server — the NTLM elimination the program has committed to, with its 2027-04-01 backstop, the zero-trust requirement that puts the Azure identity plane in the authentication path, and the service-account credential problem created by the broader directory modernization — and why their dependency structure dictates the order of the entire series.
:::

![Three drivers end the inheritance, and their dependencies set the order of the series.](../../images/sql-server/diagrams/svg/book-01-ch02-three-drivers-and-order.svg){fig-alt="Three drivers, NTLM elimination, zero trust and service-account identity, impose an order: assess and consolidate, enable Arc, migrate logins, then eliminate NTLM."}

The reasons for replacement are as well-reasoned as the original design. NTLM elimination, Conditional Access in the authentication path for all human access, and the end of the domain-joined world are not preferences.[^b01c02-ca] They follow from Microsoft's deprecation of NTLM, the transformation inventory, and OMB M-22-09 (the Federal Zero Trust Strategy), operationalized in this boundary as phishing-resistant MFA and Conditional Access (AC-17, IA-2).[^b01c02-m2209]

## Driver One — The NTLM Elimination Commitment

The first driver is a decision this program has made and recorded: the Kerberos/NTLM-elimination program, accepted 2026-05-13, commits the program to eliminating NTLM. The external driver is real but gradual: Microsoft formally deprecated NTLM in June 2024 and is disabling it by default — not removing it — across successive Windows releases, from enhanced auditing in Windows Server 2025 / Windows 11 24H2, to the `BlockNTLMv1SSO` enforcement default arriving via Windows Update in October 2026, to network NTLM off by default in the next major Windows Server release (~2027/2028). Microsoft has not published a fixed calendar date for that final step; the program's 2027-04-01 backstop is its own planning anchor, set to finish ahead of it, not a vendor deadline. Both NTLM variants are eliminated, on different timelines. NTLMv1 goes first:[^b01c02-ntlm-removed] Phase B blocks it through the LAN Manager Authentication Level policy as soon as the Phase A assessment completes (targeted 2026-Q3), so any connection still needing LM or NTLMv1 fails before the engine evaluates the login. Book 06 covers the detail.

NTLMv2 has a firm backstop: on 2027-04-01 the enforcement phase disables NTLM at the LSA layer across the estate. Any SQL Server connection still relying on it, through a missing SPN, a client that cannot negotiate Kerberos, a trust boundary, or an unjoined host, will fail inside the host's security subsystem before the engine sees it.[^b01c02-spn] 2027-04-01 is not the migration's completion date; it is the date by which consolidation, Arc deployment, login migration, and connection-string migration must already be complete.

## Driver Two — The Zero-Trust Requirement

![Conditional Access can evaluate an Entra token request; it never sees a Kerberos or NTLM exchange.](../../images/sql-server/diagrams/svg/book-01-ch02-conditional-access-leverage.svg){fig-alt="Two paths from a DBA workstation: Kerberos or NTLM through a domain controller to SQL Server involves no token request and so no policy decision; an Entra token request passes Conditional Access, and the token is issued only if every check passes."}

The M-22-09 zero-trust posture for this FedRAMP Moderate boundary cannot be implemented without the Azure identity plane in the SQL Server authentication path. Conditional Access enforces device compliance, named locations, MFA, and sign-in risk by intercepting token issuance.[^b01c02-idp] Kerberos and NTLM involve no token request, so a DBA on an unmanaged device, outside named locations, or with elevated risk cannot be blocked.

With Entra ID authentication, every token request is evaluated first. Missing MFA, a non-compliant device, or elevated risk (an anonymous IP, an account flagged by Entra ID Protection) means no token, or a remediation challenge, and no connection. The policy has real leverage because the token it controls is the credential SQL Server accepts.

## Driver Three — The Service Account Credential Problem

The transformation inventory removes Active Directory as the authoritative identity source. The AD service accounts and gMSAs that authorize the engine on the network then lose their governance foundation,[^b01c02-gmsa] so the engine needs a new identity first.

On-premises, that identity arrives through Azure Arc: the server's managed identity, which SQL Server 2025 uses directly, or on SQL Server 2022 an app registration certificate the Arc agent fetches from Key Vault with that identity. (Microsoft also documents an Arc-free, certificate-only app-registration setup.)[^b01c02-arc-servers][^b01c02-mi-2025][^b01c02-appreg-2022] Arc is therefore a prerequisite, not an enhancement. It does not change the Windows account the service runs as.

The order follows from these dependencies, preceded by Book 02's consolidation decision: assess and consolidate, enable Arc, migrate logins, then eliminate NTLM. That order is the architecture of this series.

::: {.callout-note title="What Book 01 establishes — Chapter 2"}
1. Three independent drivers end the Windows Authentication inheritance: the Kerberos/NTLM-elimination program and its 2027-04-01 backstop, the M-22-09 zero-trust posture, and the engine's need for an identity that outlives AD.
2. The zero-trust posture works only when the Entra identity plane is in the authentication path.
3. The drivers' dependencies set the order of the books: inventory and rationalize, audit, enable the identity substrate, move principals and applications, retire protocols, then demonstrate the posture.
:::

[^b01c02-m2209]: Office of Management and Budget, [M-22-09, Moving the U.S. Government Toward Zero Trust Cybersecurity Principles](https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf).
[^b01c02-ca]: Microsoft Learn, [What is Conditional Access?](https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview).
[^b01c02-ntlm-removed]: Microsoft Learn, [Features removed or no longer developed in Windows Server](https://learn.microsoft.com/en-us/windows-server/get-started/removed-deprecated-features-windows-server).
[^b01c02-spn]: Microsoft Learn, [Register a Service Principal Name for Kerberos connections](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/register-a-service-principal-name-for-kerberos-connections?view=sql-server-ver17).
[^b01c02-idp]: Microsoft Learn, [What is Microsoft Entra ID Protection?](https://learn.microsoft.com/en-us/entra/id-protection/overview-identity-protection).
[^b01c02-gmsa]: Microsoft Learn, [Group Managed Service Accounts overview](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/group-managed-service-accounts-overview).
[^b01c02-appreg-2022]: Microsoft Learn, [Set up Microsoft Entra authentication with app registration — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/entra-authentication-setup-tutorial?view=sql-server-ver17).
[^b01c02-mi-2025]: Microsoft Learn, [Managed identity overview — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/managed-identity?view=sql-server-ver17).
[^b01c02-arc-servers]: Microsoft Learn, [Azure Arc-enabled servers overview](https://learn.microsoft.com/en-us/azure/azure-arc/servers/overview).
