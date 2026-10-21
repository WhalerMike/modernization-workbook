---
title: "Runbook R06 — NTLM Detection & Remediation"
description: "How to find every NTLM-generating pattern at the SQL layer with the program's read-only SPN and protocol audits, then work the review-required remediation patterns (SPN registration, collision repair, linked-server fixes and the phased Group Policy restriction) toward Kerberos."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b06-data-platform
book: B06
part: How
series-order: 106
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Runbook R06 — NTLM Detection & Remediation

*You can't remove NTLM you haven't found, and most of what you find is a missing or misplaced name rather than a protocol choice.*

::: {.callout-note}
## In this runbook
The two-phase NTLM runbook for SQL Server. Phase 1 is detection: three read-only audits that map every `MSSQLSvc` service principal name (SPN), classify the collisions that force NTLM fallback, and find the delegation settings that shape what can move to Kerberos. Phase 2 is remediation: SPN registration and repair, linked-server fixes, and the phased Group Policy restriction, each review-required and run through change control.
:::

**Pairs with:** [Chapter 14 — NTLMv1, NTLMv2 and the Patterns That Generate NTLM](14-ntlm-and-the-patterns-that-generate-it.md) and [Chapter 15 — The Three Phases of NTLM Elimination for SQL Server](15-the-three-phases-of-ntlm-elimination.md). Those chapters explain why NTLM is a protocol you negotiate your way out of, not a switch you turn off. This page is the detect-then-remediate procedure. Detection is read-only and backed by the program's discovery scripts. Remediation changes production (SPNs, linked servers and Group Policy) and is marked review-required throughout.

## The shape of the problem

Windows Authentication to SQL Server tries Kerberos first. The client builds an SPN for the instance and asks the Key Distribution Center (KDC) for a ticket; if no ticket can be obtained, authentication falls back to NTLM.[^r06-spn] In practice that happens for four reasons: a missing or duplicated `MSSQLSvc` SPN, a client that can't reach a KDC, a linked-server hop that needs delegation, or a host or client outside the domain. One more case surprises teams that measure NTLM: even with a correct SPN, a *local* connection on the SQL Server host itself uses NTLM, and only remote connections use Kerberos.[^r06-spn] And an SPN registered to the *wrong* account doesn't fall back at all; authentication fails.[^r06-spn]

You can't remediate what you haven't detected, so this runbook has two phases: **detect** (run first, read-only), then **remediate** (review-required, audit first).

## Phase 1 — Detection (read-only)

::: {.callout-warning}
## Illustrative, not tested against production
The commands and queries on this page are illustrative. They haven't been tested against a production forest or instance. The three discovery scripts and the `FMP*` functions are the program's own tooling; their parameters are documented here as the program defines them. Review every command, and run it first in a non-production environment.
:::

### `Spec1-D1.5-Get-KerberosSPNInventory.ps1` — the SPN map

This script catalogs every SPN, flags duplicates and orphans, and assigns a migration target for each service class. For SQL Server the relevant service class is `MSSQLSvc`.

| Parameter | Type | Default | Purpose |
|---|---|---|---|
| `-OutputPath` | string | `.\output` | Output directory |
| `-DomainController` | string | — | Target a specific domain controller |
| `-SearchBase` | string | — | Optional Active Directory search base (DN) |
| `-ResolveDNS` | switch | off | Resolve each SPN hostname (slow on large estates) |

The source table also listed a `-D4InputFile` parameter for a Spec1-D1.4 cross-reference; the script has no such parameter, so it's removed here. Delegation is reported per SPN from the account's own attributes (`HasDelegation`).

The output is a `*_SPNInventory_<domain>_<timestamp>.json` file (`Summary`, `SPNs[]`, `Duplicates[]`, `Orphans[]`) plus `*.csv` and, when duplicates exist, `*_duplicates.csv`. Each SPN record includes `IsOrphan`, `DaysSinceLogon`, `HasDelegation` and a `MigrationTarget`; for `MSSQLSvc` the target is *"Entra ID auth for SQL 2022+ via Arc"*, because Microsoft Entra authentication starts with SQL Server 2022.[^r06-entra-sql] A **missing** `MSSQLSvc` SPN is the most common silent-NTLM root cause in the program's experience; a **duplicate** is the second.

The SPN formats SQL Server uses are `MSSQLSvc/<FQDN>:<port>` for TCP connections (default and named instances), and `MSSQLSvc/<FQDN>` or `MSSQLSvc/<FQDN>:<instancename>` for other protocols. When SQL Server starts it tries to register the TCP form itself, and this succeeds only if its service account has permission to write `servicePrincipalName`; virtual accounts and managed service accounts can.[^r06-spn] An inventory that shows no `MSSQLSvc` SPN for an instance running under a domain user account usually means that registration failed at startup, which SQL Server records as a warning in its error log.[^r06-spn]

### `Spec3-D1.7-Get-SPNCollisionReport.ps1` — what breaks Kerberos

This script consumes the D1.5 inventory (or queries Active Directory live) and classifies the collisions that force NTLM fallback.

| Parameter | Type | Default | Purpose |
|---|---|---|---|
| `-OutputPath` | string | `.\output` | Output directory |
| `-D5InputFile` | string | — | An SPN-inventory JSON to read instead of querying Active Directory (see the defect note below) |
| `-DomainController` / `-SearchBase` | string | — | Live-query targeting |
| `-ResolveDNS` | switch | off | Detect DNS-alias collisions |
| `-IncludeForestWide` | switch | off | Cross-domain collisions across the forest |

It detects five collision types (**exact duplicate**, **case-insensitive**, **port-variant**, **cross-object-type**, meaning the same SPN on a computer *and* a user object, and **DNS alias**) and emits `*_collisions.csv` plus a `*_remediation.csv` action plan. The case-insensitive class matters because Windows treats SPNs as case-insensitive, so two values that differ only in case are the same name to the KDC.[^r06-setspn] Severity is **CRITICAL** when two or more *enabled* accounts hold the same SPN, or for a cross-object-type collision. Microsoft's own tool reports the same condition: `setspn -X` searches for duplicate SPNs, and `-F` widens the search to the forest.[^r06-setspn]

::: {.callout-important}
## Known defect in the D1.5-to-D1.7 handoff
Spec3-D1.7 reads an `SPNInventory[]` array from the file given to `-D5InputFile`, but Spec1-D1.5 writes its records to a top-level `SPNs[]` array. Passing the D1.5 output therefore yields no SPNs, and because an input file was supplied, the live query is skipped. Until the program fixes the handoff, run D1.7 against Active Directory directly (omit `-D5InputFile`), as the detection pass below does. [Runbook R03](r03-the-authentication-audit.md) records the same defect for Spec3-D1.8.
:::

### `Spec1-D1.4-Get-AuthenticationProtocolAudit.ps1` — NTLM indicators and delegation

This script finds the delegation configurations (unconstrained, Kerberos constrained delegation and resource-based constrained delegation) and the NTLM-dependency indicators (Protected Users membership, Authentication Policies and Silos) that shape what can move to Kerberos. The output is a JSON file plus `*_findings.csv` and `*_chains.csv`, and each finding carries a `Risk` and a `Remediation`. It also accepts an optional `-D1InputFile` for cross-reference.

```powershell
# Detection pass for SQL Server NTLM. Run in order; all three are read-only.
./Spec1-D1.5-Get-KerberosSPNInventory.ps1 -OutputPath .\output
./Spec3-D1.7-Get-SPNCollisionReport.ps1 -OutputPath .\output     # live query; see the defect note above
./Spec1-D1.4-Get-AuthenticationProtocolAudit.ps1 -OutputPath .\output

# Microsoft's equivalent spot checks with setspn (also read-only)
setspn -L CONTOSO\svc-sql                        # SPNs registered on the service account
setspn -Q MSSQLSvc/sqlhost.contoso.gov:1433      # which account holds this SPN
setspn -X -F                                     # duplicate SPNs across the forest
```

The `setspn` switches are Microsoft's: `-L` lists, `-Q` queries, `-X` searches for duplicates and `-F` queries at forest level.[^r06-setspn] To measure NTLM itself, rather than its causes, enable logon success auditing on domain controllers and read the NTLM version in Event ID 4624,[^r06-ntlmv1-audit] and turn on the *Restrict NTLM* audit policies, which record would-be-blocked requests in the NTLM Operational log.[^r06-csp]

## Phase 2 — Remediation (review-required patterns)

::: {.callout-warning}
## These change production
SPN edits, linked-server reconfiguration and Group Policy changes alter live authentication. Remediation **planning** is audit-first: `New-FMPSpnRemediationPlan` and `Get-FMPNtlmGpoReport`, in the program's `FMPSqlServerMigration` module, emit reviewable plans and posture reports but enforce **nothing**. They run no `setspn` and set no Group Policy. The `setspn` and Group Policy patterns below are the actions, run in a change window after the plan is reviewed. Validate each in audit mode, capture the planned change, and route it through change control and security review before enforcement.
:::

### Register a missing `MSSQLSvc` SPN

Use `-S`, not `-A`. Microsoft's guidance is that `-S` verifies no duplicate exists before it adds the SPN, so the registration is rejected if it would collide.[^r06-setspn]

```powershell
# FQDN form for a default instance on TCP 1433, registered to the account that runs the SQL Server service
setspn -S MSSQLSvc/sqlhost.contoso.gov:1433 CONTOSO\svc-sql

# Optional: the short-name form, only if clients connect by NetBIOS name
setspn -S MSSQLSvc/sqlhost:1433 CONTOSO\svc-sql
```

The FQDN form is the one Microsoft documents and the one the client drivers generate for TCP connections.[^r06-spn] The source runbook registered the short-name form as well. Keep it only where the inventory shows clients connecting by short name; it's a program practice for those clients, not a Microsoft requirement.

### Repair a collision

From the `*_remediation.csv`, remove the SPN from the **disabled or wrong** account, leaving exactly one enabled owner:

```powershell
setspn -D MSSQLSvc/sqlhost.contoso.gov:1433 CONTOSO\old-or-disabled-account
```

A cross-object-type or two-or-more-enabled-account collision (severity CRITICAL) must be reduced to a single enabled owner before Kerberos will succeed. Microsoft's troubleshooting sequence is the same: `-L` on the service account, `-Q` to find the current holder, `-D` to remove the misplaced registration.[^r06-misplaced]

`New-FMPSpnRemediationPlan` consumes the Spec3-D1.7 collision report and derives this minimal action set per collision: a `setspn -D` for each disabled or shadowing account, and, for a cross-object-type collision, a `setspn -D` of the user-object SPN plus a recommendation to move the service to a workload identity (a program design choice). It can scope to `MSSQLSvc` with `-ServiceClassFilter` and emit the `setspn -S` registration preview for a **missing** SPN. Every action carries `mutating=true`, `requires_review=true` and a `command_preview`. The plan is the deliverable; the function runs no `setspn`.

### Linked-server passthrough

A linked server that passes the caller's Windows identity to the next instance ("be made using the login's current security context", or **Impersonate** on a login mapping) is a double hop, and a double hop needs Kerberos delegation. Delegation isn't required for a single hop, but it is for multiple hops, and delegation with linked servers requires Kerberos.[^r06-addlinkedsrvlogin][^r06-spn-client] So this pattern doesn't quietly run on NTLM: when the first hop arrives over NTLM, the second hop fails with `Login failed for user 'NT AUTHORITY\ANONYMOUS LOGON'`.[^r06-gmsa] Correct SPNs are necessary but not sufficient; delegation must also be configured.[^r06-gmsa]

There are three remediation options, in the program's order of preference:

1. **Move the linked server to Microsoft Entra authentication.** On SQL Server 2022 and later, a linked server can authenticate with a Microsoft Entra password or an access token for an application; on SQL Server 2025, with a managed identity.[^r06-linked-entra] This removes the Windows hop entirely.
2. **Keep Windows Authentication and make the hop Kerberos.** Fix the SPNs on both instances and configure constrained delegation, or resource-based constrained delegation on the destination, for the service account of the first instance. Where Credential Guard is in use, constrained delegation is required, because Credential Guard blocks unconstrained delegation.[^r06-unconstrained]
3. **Map to a defined remote login** instead of impersonating. This removes the delegation requirement, but a mapping to a SQL Authentication login reintroduces a stored password, which the program is removing elsewhere. Use it only as a documented exception.

Afterward, re-run the Spec3-D1.8 instance audit from [Runbook R03](r03-the-authentication-audit.md) and check its `LinkedServers` output.

### Phased Group Policy restriction

NTLM elimination is sequenced, not a single cutover. Two different policy families do two different jobs, and the source runbook's phases are restated here with that distinction:

- **Phase B, step 1 — refuse LM and NTLMv1.** Set *Network security: LAN Manager authentication level* to *Send NTLMv2 response only. Refuse LM & NTLM* (level 5). On domain controllers, level 5 refuses LM and NTLMv1 and accepts only NTLMv2; it doesn't block NTLMv2.[^r06-lmlevel] This is the program's own deterministic NTLMv1 block. It is separate from Microsoft's change in the October 2026 security update, under which Windows 11 versions 24H2 to 26H2 and Windows Server 2025 restrict generating NTLMv1-derived credentials for single sign-on by default on devices without Credential Guard; that change mainly affects Wi-Fi, Ethernet and VPN connections that use MS-CHAPv2.[^r06-ntlmv1-oct2026] NTLMv1 itself is already removed from Windows 11 version 24H2 and Windows Server 2025, so Phase B matters most for older systems.[^r06-ntlm-deprecated]
- **Phase B, step 2 — restrict NTLMv2 to documented exceptions.** NTLMv2 is restricted by the *Restrict NTLM* policies, not by the LAN Manager level. *NTLM authentication in this domain* controls the domain controller, *Incoming NTLM traffic* controls servers, and *Outgoing NTLM traffic to remote servers* controls clients.[^r06-ntlm-policies] The source called the exceptions "exception groups"; they are actually **server-name lists**. *Add server exceptions in this domain* serves the domain controller and *Add remote server exceptions for NTLM authentication* serves clients, and there's no exception list for the server role.[^r06-ntlm-policies] A SQL Server host set to deny incoming NTLM therefore denies it to every client; the exceptions have to be expressed at the domain controller or on the client.
- **Phase C — full block** at the program's **2027-04-01** backstop. That date is the program's own planning date. It isn't an external FedRAMP or Microsoft mandate; Microsoft describes NTLM as deprecated and still working, and its own timeline is covered in [Chapter 14](14-ntlm-and-the-patterns-that-generate-it.md) and [Chapter 15](15-the-three-phases-of-ntlm-elimination.md).[^r06-ntlm-deprecated]

`Get-FMPNtlmGpoReport`, in the `FMPSqlServerMigration` module, reports each in-scope GPO's NTLM-reduction posture against this phased plan. It classifies each GPO as `unconfigured`, `below_target`, `phase_b_ntlmv2_only` or `phase_c_full_block` from the LAN Manager authentication level and the *Restrict NTLM* settings, and it records 2027-04-01 explicitly as the program backstop, not an external mandate. It is **read-only**: it audits posture and never calls `Set-GPRegistryValue` or `Set-GPO`, so the phased enforcement stays a reviewed change.

## Verification and rollback

- **Verify Kerberos** after SPN work. On a client, run `klist purge`, reconnect, and run `klist` to confirm that a `MSSQLSvc` ticket was issued; `klist get MSSQLSvc/sqlhost.contoso.gov:1433` requests one directly.[^r06-klist] On the instance, `SELECT auth_scheme FROM sys.dm_exec_connections WHERE session_id = @@SPID;` returns `KERBEROS` for a Kerberos connection.[^r06-spn] Test from a remote client; a local connection reports NTLM by design.[^r06-spn]
- **Re-run detection.** Spec3-D1.7 should report zero CRITICAL collisions, and the Spec3-D1.8 audit ([Runbook R03](r03-the-authentication-audit.md)) should show no NTLM connections for the instance.
- **Rollback.** SPN changes are reversible (`setspn -D`, or re-add with `-S`). Group Policy changes revert by restoring the prior LAN Manager level and *Restrict NTLM* values. Because the Group Policy block is the *last* step, the earlier Kerberos fixes can be validated long before anything is refused.

::: {.callout-tip}
## Continue the book
[← Previous: Runbook R05 — Login Migration & Parallel-Run Validation](r05-login-migration-and-parallel-run.md) · [Book index](index.md) · [Next: Runbook R07 — Groups, Administrative Units & the Conditional Access Perimeter →](r07-groups-aus-and-the-conditional-access-perimeter.md)
:::

[^r06-spn]: Microsoft Learn, "Register a Service Principal Name for Kerberos connections" (SPN formats, automatic registration, fallback to NTLM, and the authentication-defaults table), <https://learn.microsoft.com/sql/database-engine/configure-windows/register-a-service-principal-name-for-kerberos-connections> (accessed Oct 20, 2026).
[^r06-entra-sql]: Microsoft Learn, "Microsoft Entra authentication for SQL Server" (applies to SQL Server 2022 and later), <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview> (accessed Oct 20, 2026).
[^r06-setspn]: Microsoft Learn, "setspn" (parameters `-S`, `-D`, `-L`, `-Q`, `-X`, `-F`; use `-S` instead of `-A` because it verifies there are no duplicates; SPNs aren't case sensitive on Windows), <https://learn.microsoft.com/windows-server/administration/windows-commands/setspn> (accessed Oct 20, 2026).
[^r06-ntlmv1-audit]: Microsoft Learn, "Audit use of NTLMv1 on a Windows Server-based domain controller," <https://learn.microsoft.com/troubleshoot/windows-server/windows-security/audit-domain-controller-ntlmv1> (accessed Oct 20, 2026).
[^r06-csp]: Microsoft Learn, "Policy CSP - LocalPoliciesSecurityOptions," entries for *Restrict NTLM: Audit Incoming NTLM Traffic*, *Incoming NTLM traffic* and *Outgoing NTLM traffic to remote servers* (events recorded in the Microsoft/Windows/NTLM Operational log), <https://learn.microsoft.com/windows/client-management/mdm/policy-csp-localpoliciessecurityoptions> (accessed Oct 20, 2026).
[^r06-misplaced]: Microsoft Learn, "Explicit misplaced SPN problem in SQL Server," <https://learn.microsoft.com/troubleshoot/sql/database-engine/connect/explicit-spn-is-misplaced> (accessed Oct 20, 2026).
[^r06-addlinkedsrvlogin]: Microsoft Learn, "sys.sp_addlinkedsrvlogin (Transact-SQL)," Remarks (delegation isn't required for single-hop scenarios but is required for multiple-hop scenarios), <https://learn.microsoft.com/sql/relational-databases/system-stored-procedures/sp-addlinkedsrvlogin-transact-sql> (accessed Oct 20, 2026).
[^r06-spn-client]: Microsoft Learn, "Service Principal Name (SPN) Support in Client Connections," section "Linked Servers and Delegation," <https://learn.microsoft.com/sql/connect/oledb/features/service-principal-name-spn-support-in-client-connections> (accessed Oct 20, 2026).
[^r06-gmsa]: Microsoft Learn, "Troubleshoot SQL Server Kerberos and authentication failures with gMSAs," section "Linked server or double-hop failures," <https://learn.microsoft.com/troubleshoot/sql/database-engine/startup-shutdown/gmsa-kerberos-authentication-failures> (accessed Oct 20, 2026).
[^r06-linked-entra]: Microsoft Learn, "Linked server for SQL Server with Microsoft Entra authentication" (password and access token on SQL Server 2022 and later; managed identity on SQL Server 2025 and later), <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-linked-server> (accessed Oct 20, 2026).
[^r06-unconstrained]: Microsoft Learn, "You can't use Kerberos unconstrained delegation in certain versions of Windows," <https://learn.microsoft.com/troubleshoot/sql/database-engine/connect/windows-prevents-unconstrained-delegation> (accessed Oct 20, 2026).
[^r06-lmlevel]: Microsoft Learn, "Policy CSP - LocalPoliciesSecurityOptions," entry *NetworkSecurity_LANManagerAuthenticationLevel* ("Send NTLMv2 response only\refuse LM and NTLM: ... domain controllers refuse LM and NTLM (accept only NTLMv2 authentication)"), <https://learn.microsoft.com/windows/client-management/mdm/policy-csp-localpoliciessecurityoptions> (accessed Oct 20, 2026).
[^r06-ntlmv1-oct2026]: Microsoft Learn, "Windows message center," entry "Take action: NTLMv1 hardening changes might affect network connections on devices without Credential Guard," October 14, 2026, <https://learn.microsoft.com/windows/release-health/windows-message-center> (accessed Oct 20, 2026).
[^r06-ntlm-deprecated]: Microsoft Learn, "Deprecated features for Windows client," entry NTLM (all versions deprecated, June 2024; NTLMv1 removed starting in Windows 11, version 24H2 and Windows Server 2025), <https://learn.microsoft.com/windows/whats-new/deprecated-features> (accessed Oct 20, 2026).
[^r06-ntlm-policies]: Microsoft Learn, "Status code 0x32 and you can't join a domain," section "More information" (the seven NTLM security policies; the two exception lists are for the client and the DC; there's no exception list for the server role), <https://learn.microsoft.com/troubleshoot/windows-server/active-directory/status-code-0x32-cannot-join-domain> (accessed Oct 20, 2026).
[^r06-klist]: Microsoft Learn, "klist" (`purge`, `tickets`, `get`), <https://learn.microsoft.com/windows-server/administration/windows-commands/klist> (accessed Oct 20, 2026).
