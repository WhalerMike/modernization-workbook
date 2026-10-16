# Device and Server Modernization — Manual Path

**The end-to-end modernization runbook with no governance control plane: each operator owns the decision under local change control**

This is the modernization runbook for organizations executing without a governance control plane — by structure, acquisition, expedited timeline, or resource constraint. Every step is self-contained: it is meant to be run by technically qualified staff with no external advisory dependency.

The manual path is not the un-governed path. Because no control plane validates each decision in real time, **you** own the change record, the approval, and the rollback. Document accepted risks in a change record before you begin, and treat every first run as a dry run.

If you expect to add governance later, this path is designed so you can. Nothing here forecloses it.

## 0. Phases and run order

Modernization runs in four phases. **Observe before you change anything.**

| Phase | Rung | What runs | Why |
|-------|------|-----------|-----|
| 1 — Observe | read-only | NTLM audit, service principal name inventory, SQL audit, device-management posture | Baseline; you cannot safely restrict what you have not measured |
| 2 — Onboard | gated | Hybrid management onboarding + baseline, device-management auto-enrollment | Attach the management planes |
| 3 — Harden | gated | Service principal name repair, NTLM restriction, Conditional Access baseline | Close the identity gaps — only after Phase 1 signs off |
| 4 — Watch | read-only | Conditional Access drift, cross-domain status | Keep it from drifting back |

## 1. Prerequisites and assessment

Beginning hybrid-management onboarding or device-management enrollment without completing the inventory and the NTLM audit is the single most common cause of failed modernization: authentication failures, policy conflicts, and application outages. Budget a minimum of two weeks for assessment before any production change.

**Licensing (verify before starting):** Device management, cloud identity with Conditional Access, a cloud subscription (hybrid-management connectivity is typically free; extensions may incur cost), endpoint and server security, and a log-analytics workspace.

**Roles (least privilege):** Hybrid-management onboarding role for servers; device-management administrator (via just-in-time elevation) for endpoints; Conditional Access administrator; hybrid identity administrator for directory synchronization; delegated organizational-unit admin for service principal name work.

Baseline the estate (all read-only):

- NTLM audit (last 30 days)
- Service principal name inventory
- SQL hardening audit
- Device-management enrollment status

## 2. Hybrid management onboarding (servers)

Hybrid management extends the cloud control plane to on-premises servers. The agent makes an **outbound** HTTPS connection — no inbound firewall rules are required. Each server appears as a hybrid resource, enabling role-based access control, tags, policy, and extensions.

**Note:** Hybrid-management servers run non-domain-joined in the target architecture. Onboarding attaches the *management* plane; it does **not** unjoin the domain for you. Domain-unjoin is a separately sequenced decision — plan it; do not let onboarding imply it.

The onboarding process creates a least-privilege onboarding service principal, installs and connects the agent, and validates registration. A baseline policy assignment applies a Windows security baseline and enables server security.

**Never embed a service-principal secret in a Group Policy startup script.** A service-principal secret in a Group Policy startup script is readable by every domain-authenticated user. Retrieve it at runtime from a secrets store, or — for an expedited deployment — rotate the secret immediately after onboarding and restrict the service principal to the onboarding role only.

**Tag taxonomy** (apply consistently — tags drive policy scope, cost, and operational queries): `Environment`, `Workload`, `Criticality`, `Owner`, `CostCenter`, plus `PatchGroup` and `OnboardedDate`. On the governed path the same taxonomy carries organizational attributes.

## 3. Device-management endpoint modernization (workstations)

For an existing domain-joined fleet with directory synchronization, **hybrid join + auto-enrollment** is the lowest-friction path: no reimage, no user action. Target it for the existing fleet before evaluating enrollment-from-the-start for new procurement.

Deploy the critical configuration profiles in priority order: security baseline, disk encryption (with recovery escrow), platform single sign-on, endpoint protection, firewall profiles, and local administrator password solution. Then attach the compliance policy (minimum operating-system version, encryption, Secure Boot, code integrity, real-time protection, signature age, firewall, trusted platform module, health attestation) so non-compliant devices can be blocked by Conditional Access.

**Conflict note:** Where device management and a Group Policy Object target the same setting, last-writer-wins produces unpredictable results. Document overlapping settings before enabling device-management policy in production, and retire the Group Policy Object copy once device management owns the setting.

## 4. Identity modernization — NTLM elimination

NTLM is the most-exploited authentication weakness in Active Directory estates (relay, pass-the-hash). The destination is Kerberos-only.

**Audit before you restrict.** Prematurely blocking NTLM breaks legacy web applications, universal naming convention file access without service principal names, and some third-party applications. Enforce only after a 14–30 day audit confirms no remaining dependencies and application owners sign off.

**Staged elimination:**

| Stage | Compatibility level | Restrict NTLM |
|-------|---------------------|---------------|
| 1 — Audit | NTLMv2 only | Audit NTLM in this domain |
| 2 — Restrict NTLMv1 | Domain controller refuses LM | Deny domain accounts (with exceptions) |
| 3 — Block all | Domain controller refuses LM and NTLM | Deny all; remove exceptions |

**Enforcement layer:** NTLM is blocked at the local security authority layer and via Group Policy — **not** in Conditional Access. Conditional Access blocks *legacy authentication to cloud applications* only; it cannot block on-premises NTLM inside the domain.

## 5. Service principal name audit and repair

Kerberos needs correct, unique service principal names. A **duplicate** service principal name breaks Kerberos and silently falls back to NTLM; a service principal name on a disabled account is stale. Fix service principal names before enforcing Kerberos.

Validate post-repair by purging the ticket cache, accessing the service, and confirming a Kerberos ticket was issued (not NTLM). For SQL, the authentication scheme on the current session should return Kerberos.

## 6. SQL Server audit and hardening

The audit reports authentication mode (Windows-authentication-only is the goal), the dangerous server-configuration switches that should be **off**, and the system-administrator account status. Then hybrid-connect the SQL hosts and enable server and SQL security.

**Note:** This audit covers the hardening checklist only. Replacing Windows/SQL authentication with cloud identity for SQL Server is its own engine-layer transformation.

## 7. Conditional Access baseline

The baseline creates the core policies — block legacy authentication, require multi-factor authentication, require compliant device, require multi-factor authentication for administrators and for the cloud management plane — in **report-only** state. Measure impact, then promote to enforce as a **separate** change.

**Always exclude break-glass.** Exclude a break-glass account group from every policy before enforcing, or you can lock yourself out. Keep two cloud-only break-glass accounts with long unique passwords, excluded from all Conditional Access, and alert on their use.

## 8. Monitoring and drift

Send hybrid-management heartbeat, device-management compliance, Active Directory audit, and endpoint-protection alerts to log analytics with defined alert rules. A cross-domain report rolls up which domains have fresh evidence and the headline pass/attention counts — your weekly status page.

## 9. Rollback

Define rollback criteria before you begin. Each domain has a defined back-out:

- **Device management:** un-enroll devices and re-apply the Group Policy baseline.
- **Hybrid management:** disconnect and uninstall the agent.
- **Conditional Access:** keep policies report-only until validated; the break-glass accounts are the emergency exclusion.
- **NTLM:** revert the compatibility level if a missed dependency surfaces — this is exactly why the audit gate exists.

## 10. What you must configure

Search any supporting scripts for configuration markers — tenant identifier, subscription identifier, resource group, location/cloud, workstation organizational-unit distinguished name, break-glass group identifier, SQL instance list. Dry-run before removing any guards.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
