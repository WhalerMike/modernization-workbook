---
title: "NTLMv1, NTLMv2, and the Patterns That Generate NTLM"
doc-type: sql-server-narrative-chapter
audience: [Technical, Customer]
family: sql-server-narrative
book: "06"
series-order: 1
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

# Chapter 1 — NTLMv1, NTLMv2, and the Patterns That Generate NTLM

*NTLM is a protocol, not a setting — so eliminating it means naming every connection pattern that produces it.*

::: {.callout-note}
## In this chapter
Why NTLMv1 is blocked early — in the Kerberos/NTLM-elimination program's Phase B, by default upon completion of the Phase A assessment (targeted 2026-Q3) — through the LAN Manager Authentication Level policy, while NTLMv2 carries a phased deadline of 2027-04-01, and the four distinct SQL Server connection patterns that generate NTLM traffic — a missing or incorrect SPN, cross-site connections where the KDC is unreachable, linked-server passthrough authentication, and non-domain-joined application hosts created by the server transformation.[^b06c01-linked][^b06c01-ntlm-removed][^b06c01-spn]
:::

NTLM is a protocol, not a configuration setting, and that distinction governs everything in this book. There is no single switch to flip and no single Group Policy change that removes NTLM from SQL Server connections. Eliminating NTLM at the SQL layer requires identifying every connection pattern that generates NTLM traffic, and there are more such patterns than most database teams expect.

The most obvious is the missing-SPN case described in Book 01, where Kerberos negotiation fails because no SPN is registered and SSPI falls back to NTLM. But other patterns exist: cross-site connections, linked-server definitions using passthrough authentication, and application connections from hosts that have already been migrated to a non-domain-joined state. Each pattern has a different root cause and a different remediation path, and none of them can be addressed until it has been detected.

## NTLMv1: Blocked First, in Phase B

![The two NTLM variants and their different timelines.](../../images/sql-server/diagrams/svg/book-06-ch01-ntlmv1-vs-ntlmv2.svg){fig-alt="NTLMv1 and LM have a program target of 2026-Q3, right after the Phase A assessment; NTLMv2 has a backstop of 2027-04-01."}

NTLMv1 is the older of the two NTLM variants, and it carries well-documented cryptographic weaknesses that make it unsuitable for any authenticated environment. The NTLMv1 challenge-response uses an MD4 hash of the user's password as the response key, which is vulnerable to pass-the-hash attacks.

An attacker who captures the NTLMv1 response can mount an offline dictionary attack against the MD4 hash, and can replay the captured hash to authenticate as the victim without ever learning the plaintext password. NTLMv1 also provides no session signing, so a network attacker positioned between the client and the server can modify data in transit without detection.

The Kerberos/NTLM-elimination program blocks NTLMv1 in its Phase B "block-where-safe" stage — by default immediately upon completion of the Phase A assessment, with the implementation plan targeting 2026-Q3 — implemented through Group Policy. The "Network Security: LAN Manager Authentication Level" policy is set to "Send NTLMv2 response only; refuse LM and NTLM." Once that policy is in force, any connection attempt that generates LM or NTLMv1 authentication traffic is refused inside the Windows security subsystem — the Local Security Authority (LSA) negotiates only NTLMv2, and the server rejects the weaker protocols. This puts the program slightly ahead of Microsoft's own NTLMv1 enforcement, which flips the `BlockNTLMv1SSO` default from Audit to Enforce via Windows Update in October 2026 for devices without an explicit policy; the program's Group Policy makes the block deterministic rather than waiting for the platform default.

In a modern SQL Server environment, NTLMv1 should not appear in any connection. SQL Server clients and servers running on Windows Server 2016 or later, with default security configuration, do not generate NTLMv1 traffic. It surfaces only in environments with very old clients — Windows 7 and earlier — or with applications that have explicitly configured LM or NTLM rather than NTLMv2 as the authentication protocol.

If the authentication-audit script or the Phase A network-traffic analysis reveals NTLMv1 in SQL Server connection traffic, it is a critical finding that requires immediate remediation regardless of the broader migration timeline. NTLMv1 in a production SQL Server connection stream is a significant security vulnerability and a compliance violation under the elimination program, and it cannot be treated as a routine migration item.

## NTLMv2: The 2027-04-01 Deadline

NTLMv2 is the current NTLM variant, and it addresses the cryptographic weaknesses of its predecessor. It uses HMAC-MD5 rather than MD4, incorporates a client challenge in addition to the server challenge to prevent replay attacks, and supports session signing. NTLMv2 is the variant that most SQL Server NTLM traffic in a modern federal environment will be generating.

Unlike NTLMv1, NTLMv2 is not removed in Phase B. The Kerberos/NTLM-elimination program restricts it via Group Policy to documented exception groups during Phase B, but full disablement waits for the elimination phase — Phase C — which carries a hard cutover at 2027-04-01. The phased timeline exists to give programs the operational space to identify and remediate NTLMv2-generating connection patterns before the hard block is applied.

That space is not infinite, and the timeline is not flexible. The elimination program's enforcement phase sets 2027-04-01 as the date on which domain-wide NTLM restrictions take effect program-wide — the program's own NTLM-elimination backstop. It is a program decision, not a Microsoft deadline: Microsoft's stated target is to disable NTLM by default — not remove it — in the next major release of Windows Server and client, subject to change, with re-enablement possible at least initially.[^b06c01-ntlm-faq] SQL Server NTLMv2 connections must be migrated either to Kerberos as an interim posture — using Cloud Kerberos trust per the elimination program — or to Entra ID OAuth 2.0 authentication as the final destination, before that date.[^b06c01-ckt]

## Pattern One: Missing or Incorrect SPN

![The checks Negotiate makes before it settles for NTLM, and the connection pattern behind each failure.](../../images/sql-server/diagrams/svg/book-06-ch01-when-sspi-falls-back.svg){fig-alt="Decision flow for an Integrated Security connection: a client that isn't domain-joined, can't reach a KDC, or finds no correctly registered SPN falls back to NTLM; a linked server passing the caller on without delegation leads to NTLM or a failed hop; each failure is labelled with its pattern and fix."}

The most common cause of NTLM fallback in SQL Server connections is a missing or incorrect SPN registration. When a client opens a connection using Windows Integrated Security, SSPI checks whether a valid SPN exists for the SQL Server endpoint. If the SPN is missing from the service account's AD object, SSPI cannot negotiate Kerberos and falls back to NTLM.

The SPN must take the form `MSSQLSvc/hostname.domain.com:port` and must be registered on the service account that the SQL Server engine process runs under. Named instances use the named-instance format, `MSSQLSvc/hostname.domain.com:instancename`, in addition to the port format.

If the service account has been changed without updating the SPN registration — a common occurrence during service-account migration — the SPN may exist but be registered on the wrong account, which produces the same NTLM fallback. SPN remediation is straightforward: `setspn -S MSSQLSvc/hostname.domain.com:port serviceaccount`. The authentication-audit script captures SPN registration status for every instance, and any instance with a missing or incorrect SPN is a discovery-phase finding that can be remediated independently of the broader login migration.

## Pattern Two: Cross-Site Connections

SQL Server connections that originate from a client in one Active Directory site and target a server in a different AD site, domain, or forest can generate NTLM traffic when Kerberos cannot complete. Kerberos requires the client to obtain a service ticket from a domain controller (KDC) for the domain that holds the server's service account — any DC of that domain, not one in a particular site. Across forests it also needs a forest trust with name-suffix routing for the SPN; without a trust, neither Kerberos nor NTLM can authenticate an account from the other forest.

If the client cannot reach or locate a DC for that domain — port 88 blocked, or DNS that doesn't resolve it — Negotiate falls back to NTLM where a trust lets the server validate the account, and the connection fails where it doesn't. In a distributed federal environment with multiple AD sites across geographic locations and network boundaries, this pattern is not uncommon.

Cross-site NTLM is detectable from the Phase A audit output by correlating connection source and destination network topology. If the source host and the destination SQL Server host are in different AD sites, and the connection is generating NTLM traffic, a likely cause is DC reachability or DNS from the source site, though a missing SPN or trust gap produces the same symptom, so confirm with `klist` or the client's Kerberos events before changing firewall rules. The remediation is to restore Kerberos — DC reachability on UDP and TCP port 88 and working DNS from every client site, a correct SPN, and, across forests, a trust — or to move the connection to Entra ID tokens, which need no KDC at all. Cloud Kerberos trust, which the Kerberos/NTLM-elimination program deploys for Windows Hello for Business sign-in, is not a fix for this pattern: the partial ticket Entra ID issues must still be exchanged with an on-premises domain controller, and the service ticket for the SQL Server SPN still comes from one.

## Pattern Three: Linked-Server Passthrough Authentication

Linked-server definitions in SQL Server — which allow one instance to query another using `OPENQUERY` or four-part name syntax — frequently use Windows passthrough (self-mapping, `@useself = 'TRUE'`) as the mechanism for the linked-server connection. In the passthrough model, the originating instance impersonates the connecting client's Windows identity and tries to present that identity to the target SQL Server — a second hop.

NTLM cannot make that second hop: an instance that authenticated the client with NTLM holds no credential it can forward, so the connection to the target fails, typically as `Login failed for user 'NT AUTHORITY\ANONYMOUS LOGON'`. Passthrough needs Kerberos delegation: the client should reach the first instance with Kerberos, and the first instance's service account must be trusted for (preferably constrained) delegation to the target's SPN. In practice the pattern shows up as NTLM on the client's first hop or as a failed second hop; it is not a working NTLM path to keep.

Linked-server NTLM is particularly insidious because it often appears in monitoring as "internal" database traffic and is not always visible in standard SQL Server connection audits. It requires examination of the `sys.linked_logins` and `sys.servers` views as well as network-traffic analysis between instances. Any linked-server definition that uses passthrough authentication must be identified during discovery and migrated to a defined security context during the restriction phase — a specific mapped login, a managed identity (SQL Server 2025 on an Arc-enabled host, linking to a target with Entra authentication), or, where the caller's own identity must reach the target, Kerberos constrained delegation.[^b06c01-kcd][^b06c01-mi-2025]

## Pattern Four: Non-Domain-Joined Application Hosts

Any application running on a host that has been migrated to a non-domain-joined state — as part of the Arc non-domain-join requirement — but still connecting to SQL Server using Windows Integrated Security will generate NTLM traffic. A non-domain-joined host has no Kerberos TGT from the KDC and cannot negotiate Kerberos for SQL Server connections. SSPI falls back to NTLM using local credentials when the application host is in a workgroup.

This pattern becomes more prevalent as the Arc non-domain-join server migration progresses. As more application servers are domain-unjoined, the applications running on them that still use Windows Integrated Security become new NTLM sources. This is a strong operational argument for completing the SQL Server connection-string migration in parallel with, or before, the domain unjoin of application hosts.

An application host that has been domain-unjoined and whose connection string uses Managed Identity authentication generates no NTLM traffic and is fully compliant with both the Arc non-domain-join requirement and the Kerberos/NTLM-elimination program. An application host that has been domain-unjoined but whose connection string still uses Windows Integrated Security is now an NTLM source that did not exist before the domain unjoin.

[^b06c01-ntlm-faq]: Microsoft Tech Community, [Retiring NTLM: frequently asked questions](https://techcommunity.microsoft.com/blog/windows-itpro-blog/retiring-ntlm-frequently-asked-questions/4550522).

::: {.callout-note title="What Book 06 establishes — Chapter 1"}
1. NTLM is a protocol, not a setting; no single switch removes it from SQL Server connections.
2. NTLMv1 is blocked early; NTLMv2 is restricted to exception groups, then blocked at the program's 2027-04-01 cutover.
3. Four patterns generate NTLM at the SQL layer — missing SPNs, unreachable KDCs, linked-server passthrough, and non-domain-joined hosts — and each must be found before it can be fixed.
:::

[^b06c01-spn]: Microsoft Learn, [Register a Service Principal Name for Kerberos connections](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/register-a-service-principal-name-for-kerberos-connections?view=sql-server-ver17).
[^b06c01-ntlm-removed]: Microsoft Learn, [Features removed or no longer developed in Windows Server](https://learn.microsoft.com/en-us/windows-server/get-started/removed-deprecated-features-windows-server).
[^b06c01-linked]: Microsoft Learn, [Linked server for SQL Server with Microsoft Entra authentication](https://learn.microsoft.com/en-us/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-linked-server?view=sql-server-ver17).
[^b06c01-ckt]: Microsoft Learn, [Windows Hello for Business cloud Kerberos trust deployment guide](https://learn.microsoft.com/en-us/windows/security/identity-protection/hello-for-business/deploy/hybrid-cloud-kerberos-trust).
[^b06c01-mi-2025]: Microsoft Learn, [Managed identity overview — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/managed-identity?view=sql-server-ver17).
[^b06c01-kcd]: Microsoft Learn, [Kerberos constrained delegation overview](https://learn.microsoft.com/en-us/windows-server/security/kerberos/kerberos-constrained-delegation-overview).
