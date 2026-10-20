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
Why NTLMv1 is blocked early (Phase B, targeted 2026-Q3) while NTLMv2 has a phased 2027-04-01 deadline, and the four SQL Server connection patterns that generate NTLM: a missing or incorrect SPN, an unreachable KDC, linked-server passthrough, and non-domain-joined application hosts.[^b06c01-linked][^b06c01-ntlm-removed][^b06c01-spn]
:::

No single switch or Group Policy change removes NTLM from SQL Server connections. Eliminating it means finding every connection pattern that generates it, and there are more than most database teams expect. Beyond Book 01's missing-SPN case there are cross-site connections, linked-server passthrough, and hosts already moved to a non-domain-joined state, each with its own root cause and fix.

## NTLMv1: Blocked First, in Phase B

![The two NTLM variants and their different timelines.](../../images/sql-server/diagrams/svg/book-06-ch01-ntlmv1-vs-ntlmv2.svg){fig-alt="NTLMv1 and LM have a program target of 2026-Q3, right after the Phase A assessment; NTLMv2 has a backstop of 2027-04-01."}

NTLMv1 uses an MD4 hash of the password as its response key. A captured response can be attacked offline or replayed to authenticate as the victim (pass-the-hash), and with no session signing, traffic can be modified in transit.

The Kerberos/NTLM-elimination program blocks NTLMv1 in its Phase B "block-where-safe" stage, by default as soon as the Phase A assessment completes (targeted 2026-Q3), by setting "Network Security: LAN Manager Authentication Level" to "Send NTLMv2 response only; refuse LM and NTLM." The Local Security Authority then negotiates only NTLMv2. This is slightly ahead of Microsoft, whose October 2026 Windows Update flips the `BlockNTLMv1SSO` default from Audit to Enforce on devices without an explicit policy; the program's Group Policy makes the block deterministic.

Windows Server 2016 and later with default settings generate no NTLMv1; it surfaces only with Windows 7-era clients or applications explicitly configured for LM or NTLM. NTLMv1 found by the authentication audit or Phase A traffic analysis is a critical finding requiring immediate remediation, not a routine migration item.

## NTLMv2: The 2027-04-01 Deadline

NTLMv2 uses HMAC-MD5, adds a client challenge against replay, and supports signing; it is what most SQL Server NTLM traffic in a modern federal environment uses. Phase B restricts it to documented exception groups; Phase C disables it at the 2027-04-01 hard cutover, the program's own backstop. That is a program decision, not a Microsoft deadline: Microsoft's stated target is to disable NTLM by default — not remove it — in the next major release of Windows Server and client, subject to change, with re-enablement possible at least initially.[^b06c01-ntlm-faq] SQL Server NTLMv2 connections must be migrated either to Kerberos as an interim posture — using Cloud Kerberos trust per the elimination program — or to Entra ID OAuth 2.0 authentication as the final destination, before that date.[^b06c01-ckt]

## Pattern One: Missing or Incorrect SPN

![The checks Negotiate makes before it settles for NTLM, and the connection pattern behind each failure.](../../images/sql-server/diagrams/svg/book-06-ch01-when-sspi-falls-back.svg){fig-alt="Decision flow for an Integrated Security connection: a client that isn't domain-joined, can't reach a KDC, or finds no correctly registered SPN falls back to NTLM; a linked server passing the caller on without delegation leads to NTLM or a failed hop; each failure is labelled with its pattern and fix."}

::: {.callout-tip title="Established in Book 01"}
When no valid SPN is registered on the engine's service account, SSPI cannot negotiate Kerberos and falls back to NTLM.
:::

This is the most common cause of NTLM fallback. The SPN takes the form `MSSQLSvc/hostname.domain.com:port` (named instances also `MSSQLSvc/hostname.domain.com:instancename`) on the account the engine runs under. A service-account change without an SPN update leaves the SPN on the wrong account, with the same result. The fix is `setspn -S MSSQLSvc/hostname.domain.com:port serviceaccount`; the authentication audit captures SPN status per instance, and each gap can be fixed independently of the login migration.

## Pattern Two: Cross-Site Connections

Connections that cross AD sites, domains, or forests can generate NTLM when Kerberos cannot complete. Kerberos requires the client to obtain a service ticket from a domain controller (KDC) for the domain that holds the server's service account — any DC of that domain, not one in a particular site. Across forests it also needs a forest trust with name-suffix routing for the SPN; without a trust, neither Kerberos nor NTLM can authenticate an account from the other forest.

If the client cannot reach or locate a DC for that domain — port 88 blocked, or DNS that doesn't resolve it — Negotiate falls back to NTLM where a trust lets the server validate the account, and the connection fails where it doesn't. This is common in distributed federal networks.

Detect it in Phase A output by correlating source and destination sites. Cross-site NTLM usually means DC reachability or DNS from the source site, but a missing SPN or trust gap looks the same, so confirm with `klist` or the client's Kerberos events before changing firewall rules. The remediation is to restore Kerberos — DC reachability on UDP and TCP port 88 and working DNS from every client site, a correct SPN, and, across forests, a trust — or to move the connection to Entra ID tokens, which need no KDC at all. Cloud Kerberos trust, which the Kerberos/NTLM-elimination program deploys for Windows Hello for Business sign-in, is not a fix for this pattern: the partial ticket Entra ID issues must still be exchanged with an on-premises domain controller, and the service ticket for the SQL Server SPN still comes from one.

## Pattern Three: Linked-Server Passthrough Authentication

Linked-server definitions in SQL Server — which allow one instance to query another using `OPENQUERY` or four-part name syntax — frequently use Windows passthrough (self-mapping, `@useself = 'TRUE'`) as the mechanism for the linked-server connection. In the passthrough model, the originating instance impersonates the connecting client's Windows identity and tries to present that identity to the target SQL Server — a second hop.

NTLM cannot make that second hop: an instance that authenticated the client with NTLM holds no credential it can forward, so the connection to the target fails, typically as `Login failed for user 'NT AUTHORITY\ANONYMOUS LOGON'`. Passthrough needs Kerberos delegation: the client should reach the first instance with Kerberos, and the first instance's service account must be trusted for (preferably constrained) delegation to the target's SPN. In practice the pattern shows up as NTLM on the client's first hop or as a failed second hop; it is not a working NTLM path to keep.

Linked-server NTLM often looks like "internal" traffic and escapes standard connection audits; find it through `sys.linked_logins`, `sys.servers`, and inter-instance traffic analysis. Each passthrough definition is migrated during the restriction phase to a defined security context: a specific mapped login, a managed identity (SQL Server 2025 on an Arc-enabled host, linking to a target with Entra authentication), or, where the caller's own identity must reach the target, Kerberos constrained delegation.[^b06c01-kcd][^b06c01-mi-2025]

## Pattern Four: Non-Domain-Joined Application Hosts

An application on a host unjoined under the Arc non-domain-join requirement has no Kerberos TGT, so a connection string still using Windows Integrated Security falls back to NTLM with local credentials: a new NTLM source the unjoin created. The pattern grows as server unjoin progresses, which is why connection strings should move to managed identity before or alongside application-host unjoin. A host on managed identity generates no NTLM and satisfies both programs.

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
