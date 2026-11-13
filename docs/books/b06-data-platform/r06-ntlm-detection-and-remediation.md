---
title: "Runbook R06 — NTLM Detection & Remediation"
description: "How to find every NTLM-generating pattern at the SQL layer with the program's read-only SPN and protocol audits, then work the review-required remediation patterns (SPN registration, collision repair, linked-server fixes and the phased Group Policy restriction) toward Kerberos."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b06-data-platform
book: B06
part: How
series-order: 106
status: baseline
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Runbook R06 — NTLM Detection & Remediation

*You can't remove NTLM you haven't found, and most of what you find is a missing or misplaced name rather than a protocol choice.*

::: {.callout-note}
## In this runbook
The two-phase NTLM runbook for SQL Server. Phase 1 is detection: three read-only audits that map every `MSSQLSvc` service principal name (SPN), classify the SPN collisions that break Kerberos, and find the delegation settings that shape what can move to Kerberos. Phase 2 is remediation: SPN registration and repair, linked-server fixes, and the phased Group Policy restriction, each review-required and run through change control.
:::

**Pairs with:** [Chapter 14 — NTLMv1, NTLMv2 and the Patterns That Generate NTLM](14-ntlm-and-the-patterns-that-generate-it.md) and [Chapter 15 — The Three Phases of NTLM Elimination for SQL Server](15-the-three-phases-of-ntlm-elimination.md). Those chapters explain why NTLM is a protocol you negotiate your way out of, not a switch you turn off. This page is the detect-then-remediate procedure. Detection is read-only and backed by the program's discovery scripts. Remediation changes production (SPNs, linked servers and Group Policy) and is marked review-required throughout.

## The shape of the problem

Windows Authentication to SQL Server tries Kerberos first. The client builds an SPN for the instance and asks the Key Distribution Center (KDC) for a ticket; if no ticket can be obtained, authentication falls back to NTLM.[^r06-spn] In practice that happens for four reasons: a missing `MSSQLSvc` SPN, a client that can't reach a KDC, a linked-server hop that needs delegation, or a host or client outside the domain. One more case surprises teams that measure NTLM: even with a correct SPN, a *local* connection on the SQL Server host itself uses NTLM, and only remote connections use Kerberos.[^r06-spn] And an SPN registered to the *wrong* account, or a *duplicated* SPN, doesn't fall back at all; authentication fails.[^r06-spn]

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

The output is a `*_SPNInventory_<domain>_<timestamp>.json` file (`Summary`, `SPNs[]`, `Duplicates[]`, `Orphans[]`) plus `*.csv` and, when duplicates exist, `*_duplicates.csv`. Each SPN record includes `IsOrphan`, `DaysSinceLogon`, `HasDelegation` and a `MigrationTarget`; for `MSSQLSvc` the target is *"Entra ID auth for SQL 2022+ via Arc"*, because Microsoft Entra authentication starts with SQL Server 2022.[^r06-entra-sql] A **missing** `MSSQLSvc` SPN is the most common silent-NTLM root cause in the program's experience. A **duplicate** isn't a silent-NTLM cause: it breaks Kerberos and makes the connection fail, so it surfaces as an error rather than as NTLM traffic.

The SPN formats SQL Server uses are `MSSQLSvc/<FQDN>:<port>` for TCP connections (default and named instances), and `MSSQLSvc/<FQDN>` or `MSSQLSvc/<FQDN>:<instancename>` for other protocols. When SQL Server starts it tries to register the TCP form itself, and this succeeds only if its service account has permission to write `servicePrincipalName`; virtual accounts and managed service accounts can.[^r06-spn] An inventory that shows no `MSSQLSvc` SPN for an instance running under a domain user account usually means that registration failed at startup, which SQL Server records as a warning in its error log.[^r06-spn]

### `Spec3-D1.7-Get-SPNCollisionReport.ps1` — what breaks Kerberos

This script consumes the D1.5 inventory (or queries Active Directory live) and classifies the collisions that break Kerberos authentication.

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

### Remote SAM enumeration: SAM client logging

NTLM isn't the only legacy call that discovery turns up. Applications and scripts that look up accounts and enumerate domains over the Security Account Manager remote protocol (SAM-R) are another AD dependency, and on a busy domain controller another source of load. Windows records them on the client side: SAM client event logging writes connections, domain lookups and enumeration requests, with the calling process, to the **Microsoft-Windows-SAMLIB/Debug** channel (Event Viewer: **Applications and Services Logs** > **Microsoft** > **Windows** > **SAMLIB** > **Debug**).[^r06-samlib] It records activity from any Windows system that sends SAM traffic toward a domain controller, client or server, joined or not. Learn lists Windows 11 with the June 2026 security update (KB5095093) or later as the prerequisite; a minimum Windows Server version for the channel is not yet specified.[^r06-samlib] Enable it on a suspected caller, for example the SQL Server host or the application server in front of it, for the collection window only:

```powershell
# Run elevated on the suspected client. Read-only on the directory; it only adds a local log.
wevtutil sl Microsoft-Windows-SAMLIB/Debug /e:true

# After the collection window: the 50 most recent SamConnect (1000) and SamEnumerateDomainsInSamServer (1012) events
wevtutil qe Microsoft-Windows-SAMLIB/Debug /q:"*[System[(EventID=1000 or EventID=1012)]]" /c:50 /rd:true /f:text

# Turn it off again
wevtutil sl Microsoft-Windows-SAMLIB/Debug /e:false
```

The `sl /e:` switch enables or disables a log, and `qe` reads it with an XPath filter, a count and newest-first ordering.[^r06-wevtutil] The events to read are 1000 (`SamConnect`, with the target server and calling process), 1010 (domain lookup), 1012 (domain enumeration) and 1014 (`SamOpenDomain`).[^r06-samlib] Each calling process named there goes into the same inventory as the NTLM findings. By default the events omit command-line arguments; the `IncludeArguments` registry value adds them, but Microsoft cautions that arguments can contain credentials, so the runbook doesn't turn it on.[^r06-samlib]

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

1. **Move the linked server to Microsoft Entra authentication.** On SQL Server 2025, use a managed identity.[^r06-linked-entra] On SQL Server 2022, use an access token for a Microsoft Entra application: the linked server login maps to the application's client ID, and the source instance generates the token from the application's client secret, so this is the documented client-secret exception of [Chapter 11](11-three-principal-types.md).[^r06-linked-token] Microsoft also documents a password option; don't use it, because the Entra username-and-password flow is deprecated in Microsoft's SQL drivers and is incompatible with mandatory multifactor authentication ([Chapter 14](14-ntlm-and-the-patterns-that-generate-it.md)).[^r06-entra-password] Either supported option removes the Windows hop entirely.
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
- **Re-run detection.** Spec3-D1.7 should report zero CRITICAL collisions, and the connection checks of [Runbook R05](r05-login-migration-and-parallel-run.md) (the `sys.dm_exec_connections` query and SQL Server Audit) should show no remote NTLM connections for the instance. The Spec3-D1.8 audit doesn't carry connection data, so it can't show this.
- **Rollback.** SPN changes are reversible (`setspn -D`, or re-add with `-S`). Group Policy changes revert by restoring the prior LAN Manager level and *Restrict NTLM* values. Because the Group Policy block is the *last* step, the earlier Kerberos fixes can be validated long before anything is refused.

## Control states, change safety and evidence {#b06-r06-control-states}

This section applies the conventions of [Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md) to Phase 2 and adds only what was missing. Phase 1 changes nothing and needs no rollout of its own.

**Authority:** Microsoft-recommended for registering SPNs with `setspn -S` and for constrained rather than unconstrained delegation (the Learn pages cited in Phase 2); risk-based recommended for the phased Group Policy restriction and the 2027-04-01 Phase C date, which are the program's plan, not a Microsoft or federal deadline ([Chapter 15](15-the-three-phases-of-ntlm-elimination.md)).
**Applies:** domain-joined SQL Server hosts, their clients and the domain controllers that serve them. Not applicable for cloud availability: SPNs, delegation and the *Restrict NTLM* policies are on-premises Windows and Active Directory settings and don't depend on GCC.

| How-section subsection | In this runbook |
|---|---|
| Prerequisites | Phase 1 output (the SPN map, the collision report and the protocol audit) and the reviewed `New-FMPSpnRemediationPlan` and `Get-FMPNtlmGpoReport` records |
| Pilot | One instance and its known clients for SPN and linked-server fixes; one pilot set of SQL hosts and clients for each Group Policy step; success is Kerberos tickets and `KERBEROS` in `auth_scheme` from remote clients, with no new failures |
| Report-only or audit phase | The *Restrict NTLM* audit settings come before every deny setting: *Audit Incoming NTLM Traffic* on servers, *Audit NTLM authentication in this domain* on domain controllers, and *Outgoing NTLM traffic to remote servers* set to **Audit all** on clients. The audit settings log, in the NTLM Operational log, the requests that the matching deny setting would block.[^r06-restrict-audit][^r06-ntlm-policies] Read them for at least one full business cycle, including month-end jobs, before the deny step |
| Enforcement | LAN Manager level 5, then the *Restrict NTLM* deny settings, then Phase C at the program date, ring by ring as below |
| Rollback | The verification-and-rollback list above: `setspn` reverses an SPN change; the prior LAN Manager level and *Restrict NTLM* values restore the policy, and a deny setting goes back to audit first ([Chapter 15](15-the-three-phases-of-ntlm-elimination.md), Phase B) |
| Exclusions | Server names in *Add server exceptions in this domain* (domain controller) and *Add remote server exceptions for NTLM authentication* (client); there is no server-side list. Each name is recorded in the exception registry with its owner, reason and sunset date, reconciled against 2027-04-01 |
| Telemetry | The NTLM Operational log on servers, clients and domain controllers; Windows logon events naming the authentication package; `auth_scheme` and SQL Server Audit on the instance ([Runbook R09](r09-continuous-monitoring-and-closure.md), Step 4) |
| Evidence | The checklist below |
| Day-two ownership | The data platform team owns SPNs and linked servers; the directory and server teams own the Group Policy objects; security operations watches the NTLM telemetry ([Chapter 13](13-who-owns-the-data-platform.md#the-responsibility-matrix)). Drift is a new NTLM connection, a new SPN collision, or a GPO whose `Get-FMPNtlmGpoReport` posture drops |

**Change safety**

| Ring | Scope | Exit criteria |
|---|---|---|
| 0 | A test domain or lab OU with representative SQL hosts and clients | Each change applied and backed out once; audit events read as expected |
| 1 | A pilot set of SQL hosts and their clients | Audit shows no NTLM request that the deny step would block, other than registered exceptions, for a full business cycle; after the deny, no blocked production connection for two weeks |
| 2 | A site or application wave | As ring 1 |
| 3 | Domain-wide (Phase C, at the program date) | Every production instance through [Runbook R05](r05-login-migration-and-parallel-run.md); the exception registry reconciled |

- **Emergency access:** the *Restrict NTLM* settings don't touch Entra sign-ins, so the tenant's emergency access accounts are unaffected. The SQL Server break-glass group of [Appendix B](appendix-b-ato-kit.md#break-glass-design) authenticates with Windows Authentication, so test it over Kerberos from the administrators' workstations before each deny ring; local sign-in on the host keeps working because it doesn't cross the network.
- **Change window:** SPN and linked-server changes in the instance's window; each Group Policy ring in a window approved by the directory owner and the affected application owners, with a domain administrator able to revert the GPO on hand, and Group Policy refresh time allowed for.
- **Backout triggers:** set before the change: an NTLM block event (NTLM Operational log) from a production application not on the exception list, a CRITICAL collision reappearing, a linked-server query failing with `NT AUTHORITY\ANONYMOUS LOGON`, or a help-desk call pattern traced to the ring. Any one returns the ring's setting to audit.
- **Post-change validation:** the verification steps above (`klist`, `auth_scheme` from a remote client, Spec3-D1.7 with zero CRITICAL collisions) and the NTLM Operational log after each ring.

**Evidence checklist**

- [ ] **Configuration:** the reviewed remediation plan, the `setspn -L` output for each service account after the change, and the GPO reports with `Get-FMPNtlmGpoReport` posture per GPO
- [ ] **Operational:** NTLM Operational log extracts and the instance protocol telemetry, before and after each ring
- [ ] **Test:** the `klist` and `auth_scheme` checks from a remote client, and the break-glass group's Kerberos test, with date and tester
- [ ] **Exception:** each server name on an exception list with its registry entry, owner and sunset date
- [ ] **Assessor-ready artifact:** the protocol-telemetry evidence set of [Runbook R09](r09-continuous-monitoring-and-closure.md#the-six-live-evidence-sets), traceable to the above

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | Phase 1 and the reviewed remediation plan | The plan records and the exception registry |
| Configured | SPN and linked-server fixes; the *Restrict NTLM* audit settings | `setspn -L` output and GPO reports in audit posture |
| Enforced | LAN Manager level 5, the deny settings, Phase C | GPO reports showing `phase_b_ntlmv2_only` or `phase_c_full_block` |
| Evidenced | Verification and rollback | `klist` and `auth_scheme` test records; Spec3-D1.7 rerun |
| Operated | [Runbook R09](r09-continuous-monitoring-and-closure.md) protocol telemetry | NTLM alerts and their review |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** Identity
- **CISA ZTMM pillar:** Identity
- **Depends on:** Infrastructure (domain controllers and Group Policy while they remain, [Book 05](../b05-devices/index.md)); Applications and Workloads (connection strings that stop asking for Windows Authentication, [Runbook R08](r08-application-chain-and-connection-strings.md))
- **Attack chain interrupted:** Credential Access and Lateral Movement: NTLM relay and pass-the-hash need NTLM to be accepted, and each ring removes a place that accepts it
:::

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
[^r06-linked-token]: Microsoft Learn, "Linked server for SQL Server with Microsoft Entra authentication," section "Linked server configuration using access token authentication" (provider string `AccessToken=%s`; remote user is the application's client ID; "The application must have a secret assigned to it, which will be used by S1 to generate the access token"), <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-linked-server> (accessed Oct 21, 2026).
[^r06-entra-password]: Microsoft Learn, "Use Microsoft Entra ID" (OLE DB Driver for SQL Server), section "Microsoft Entra username and password authentication" ("The ActiveDirectoryPassword authentication option ... is deprecated in the Microsoft SQL drivers"; incompatible with mandatory Microsoft Entra multifactor authentication), <https://learn.microsoft.com/sql/connect/oledb/features/using-azure-active-directory> (accessed Oct 21, 2026).
[^r06-samlib]: Microsoft Learn, "Enable SAM client logging and diagnostics," sections "Prerequisites," "Enable the SAM client event log," "Review SAM client events" and "Manage command-line argument logging," <https://learn.microsoft.com/windows-server/identity/ad-ds/enable-sam-client-logging-diagnostics> (accessed Nov 9, 2026).
[^r06-wevtutil]: Microsoft Learn, "wevtutil," sections "Parameters" (`set-log`, `query-events`) and "Options" (`/e`, `/q`, `/c`, `/rd`, `/f`), <https://learn.microsoft.com/windows-server/administration/windows-commands/wevtutil> (accessed Nov 9, 2026).
[^r06-restrict-audit]: Microsoft Learn, "Policy CSP - LocalPoliciesSecurityOptions," entries *NetworkSecurity_RestrictNTLM_AuditIncomingNTLMTraffic* (logs the requests that *Incoming NTLM traffic* would block), *NetworkSecurity_RestrictNTLM_OutgoingNTLMTrafficToRemoteServers* ("Audit all" logs each NTLM request to a remote server) and *NetworkSecurity_RestrictNTLM_IncomingNTLMTraffic*; events in Applications and Services Logs/Microsoft/Windows/NTLM/Operational, <https://learn.microsoft.com/windows/client-management/mdm/policy-csp-localpoliciessecurityoptions> (accessed Nov 11, 2026).
