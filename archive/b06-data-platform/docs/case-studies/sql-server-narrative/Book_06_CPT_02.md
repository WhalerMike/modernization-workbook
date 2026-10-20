---
title: "The Three Phases of NTLM Elimination for SQL Server"
doc-type: sql-server-narrative-chapter
audience: [Technical, Customer]
family: sql-server-narrative
book: "06"
series-order: 2
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

# Chapter 2 — The Three Phases of NTLM Elimination for SQL Server

*Discover, restrict, eliminate — the same phase structure the Kerberos/NTLM-elimination program applies program-wide, applied specifically to SQL Server workloads.*

::: {.callout-note}
## In this chapter
How the Kerberos/NTLM-elimination program's three-phase structure applies to SQL Server: Phase A discovery using the authentication-audit script alongside Windows event-log NTLM analysis, Phase B restriction that converts NTLM connections to Kerberos and migrates the remaining patterns, and Phase C elimination at the 2027-04-01 domain-wide block — and why an instance migrated to Entra ID logins is immune to that block because it was never generating NTLM in the first place.
:::

The Kerberos/NTLM-elimination program structures NTLM elimination into three phases — discover, restrict, eliminate — and this chapter applies that structure specifically to SQL Server workloads. The phases are sequential and the final one is a hard backstop: the domain-wide NTLM block takes effect no later than 2027-04-01, the date the elimination program sets for the program.

After that date, any SQL Server connection that requires NTLM will fail at the LSA layer — inside the host's Windows security subsystem, where the Local Security Authority (LSA) enforces the policy. The SQL Server engine will not receive an authenticated connection; the NTLM exchange is rejected by the LSA before the engine evaluates the login. SQL Server NTLM elimination is therefore not decoupled from the broader elimination program timeline. Every NTLM-generating connection pattern must be resolved before the elimination phase, not after.

## Phase A — Discovery

![The evidence Phase A combines into the NTLM baseline.](../../images/sql-server/diagrams/svg/book-06-ch02-phase-a-evidence.svg){fig-alt="The authentication audit, the Security log on SQL Server hosts (events 4624 and 4625 with the NTLM package), the NTLM operational log and linked-server definitions combine into a per-instance NTLM baseline in compliance monitoring."}

The discovery phase is the elimination program's first phase, and for SQL Server its primary instrument is the authentication-audit script. The Phase A output for SQL Server includes the full instance inventory with Arc-eligibility classifications, the login-type inventory, the SPN registration status for every instance, and the service-account identity for each engine process.

Network-traffic analysis supplements the script output by capturing actual NTLM authentication events in the Windows event log. The relevant events are Event IDs 4624 and 4625 — logon success and failure — with logon type 3, the network logon type, and authentication package NTLM, filtered to events where the target server is a SQL Server host.

The combination of the audit-script output and the event-log analysis produces a complete picture of NTLM-generating SQL Server connection patterns across the estate. That Phase A output is ingested by the compliance-monitoring pipeline as the baseline record from which all subsequent phases measure progress.

## Phase B — Restriction

The restriction phase applies controls that reduce NTLM traffic without eliminating it entirely. The restrictions create pressure on connection patterns to migrate while preserving operational continuity. The primary Phase B control for SQL Server is NTLMv1 blocking, combined with Kerberos remediation for the missing-SPN cases.[^b06c02-ntlm-removed][^b06c02-spn]

SPN registration is corrected for all instances with missing or incorrect SPNs, converting those connections from NTLM to Kerberos. Cross-site connection patterns are fixed by restoring DC reachability (port 88 and DNS) and, across forests, a trust, or by moving the connection to Entra ID tokens; Cloud Kerberos trust, which the Kerberos/NTLM-elimination program also deploys, does not remove the need for DC reachability, because its tickets are still exchanged with on-premises domain controllers.[^b06c02-ckt] Linked-server definitions using passthrough authentication are migrated to defined security contexts. Application connection strings on recently domain-unjoined hosts are migrated to Managed Identity or service-principal authentication.

After Phase B, the only remaining NTLM-generating SQL Server connections should be those that require the elimination program's enforcement phase's hard block to remove. These are typically applications that cannot be modified before the 2027-04-01 block date set in the elimination program, which become exception cases requiring formal exception documentation per the elimination program.

## Phase C — Elimination

![What the Phase C block does to each kind of connection.](../../images/sql-server/diagrams/svg/book-06-ch02-phase-c-impact.svg){fig-alt="Under the Phase C block, Windows logins that fall back to NTLM fail at the LSA, Windows logins on Kerberos still work but stay invisible to Conditional Access, excepted instances still on NTLM fail, and Entra logins are unaffected."}

The elimination phase disables NTLM across the estate. Group Policy pushed domain-wide restricts NTLM authentication at the LSA layer on every host, and any connection that cannot negotiate an alternative protocol fails. For SQL Server, Phase C is only safe to implement after the login migration of Book 05 has been completed for every instance in the estate.

An instance whose connections have been migrated to Entra ID OAuth 2.0 tokens generates no NTLM traffic at all. The SQL Server engine does not use NTLM or Kerberos for type-E login connections. An instance that has completed the login migration is therefore immune to Phase C — it was not generating NTLM before the block, and it is not affected by the block after.

The sequencing imperative is clear: complete the SQL Server login migration before Phase C is applied. The 2027-04-01 backstop is the Phase C application date, and the SQL Server login migration must be complete before that date for every production instance in the estate.

::: {.callout-warning title="Unresolved: what happens to the long tail on 2027-04-01"}
**Known fact.** Microsoft's own plan is to disable NTLM by default in the next major Windows release, subject to change; 2027-04-01 is this program's date, not Microsoft's (Chapter 1).

**Dependency.** Pre-2022 instances and deferred applications that can't reach Kerberos or Entra tokens by then rely on the certificate-based interim posture, which needs a replacement CA issuing before ADCS is retired (Book 10).

**Unresolved decision.** Whether the Phase C date holds for instances whose interim posture isn't in place, or whether they get dated exceptions with network-level isolation.

**Owner and artifact.** The Kerberos/NTLM-elimination program, recorded as an amendment to its enforcement-phase decision and reflected in the exception registry.
:::

::: {.callout-note title="What Book 06 establishes — Chapter 2"}
1. Discovery baselines every NTLM-generating pattern from the audit and Windows NTLM logon events.
2. Restriction blocks NTLMv1, repairs SPNs and Kerberos reachability, and migrates linked-server security contexts and connection strings.[^b06c02-linked]
3. Elimination applies the domain-wide block; instances already on Entra logins are unaffected because they don't use NTLM.
:::

[^b06c02-spn]: Microsoft Learn, [Register a Service Principal Name for Kerberos connections](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/register-a-service-principal-name-for-kerberos-connections?view=sql-server-ver17).
[^b06c02-ntlm-removed]: Microsoft Learn, [Features removed or no longer developed in Windows Server](https://learn.microsoft.com/en-us/windows-server/get-started/removed-deprecated-features-windows-server).
[^b06c02-ckt]: Microsoft Learn, [Windows Hello for Business cloud Kerberos trust deployment guide](https://learn.microsoft.com/en-us/windows/security/identity-protection/hello-for-business/deploy/hybrid-cloud-kerberos-trust).
[^b06c02-linked]: Microsoft Learn, [Linked server for SQL Server with Microsoft Entra authentication](https://learn.microsoft.com/en-us/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-linked-server?view=sql-server-ver17).
