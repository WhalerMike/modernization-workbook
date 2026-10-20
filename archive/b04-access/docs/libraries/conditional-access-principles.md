# Conditional Access — Baseline Principles

**Short extract from the Conditional Access Policy Library**

## Purpose

Conditional Access replaces legacy Group Policy Object-based access control with signal-based, real-time policy evaluation. It enforces Zero Trust principles across identity, device, application, and network signals.

## Policy evaluation model

Cloud identity evaluates Conditional Access policies using an **additive model**. All policies that match a given sign-in are evaluated simultaneously, and the most restrictive combination of grant controls applies. There is no policy priority number or ordering mechanism.

**Key principles:**

1. **All matching policies apply.** Unlike Group Policy Objects, which have precedence rules, every Conditional Access policy whose conditions match the sign-in contributes to the final access decision.
2. **Block overrides grant.** If any matching policy issues a Block grant control, access is denied regardless of other policies.
3. **Multiple grant controls combine as AND by default.** When multiple policies require different grant controls (for example, one requires multi-factor authentication, another requires a compliant device), the user must satisfy all controls unless policies are explicitly configured with OR logic.
4. **Session controls are additive.** The most restrictive session control from all matching policies is enforced (for example, the shortest sign-in frequency wins).
5. **Exclusions are absolute.** If a user or group is in the exclusion list, that policy does not apply to them, regardless of inclusion conditions.

## Deployment methodology

- Deploy policies in **report-only** state first.
- Measure impact before promoting any policy to enforce.
- Promote to enforce as a **separate** change.
- Always exclude a break-glass account group from every policy before enforcing.

## Break-glass procedure

- Maintain two cloud-only break-glass accounts with long unique passwords.
- Exclude the break-glass group from all Conditional Access policies.
- Alert on any use of the break-glass accounts.
- Document the recovery procedure and test it periodically.

## GPO-to-Conditional Access transformation (illustrative)

| Legacy Group Policy mechanism | Conditional Access equivalent | Advantage |
|-------------------------------|-------------------------------|-----------|
| Logon restrictions | Device-based grant controls + device filters | Enforced at authentication, not session |
| Security filtering by group membership | User/group assignments + dynamic groups | Real-time group evaluation, no replication lag |
| Account lockout policy | Risk-based policies + identity protection | Risk intelligence, not static thresholds |
| Drive mapping / printer deployment | Device-management configuration profiles | Cloud-native, location-independent |
| Software restriction policies | Device-management app protection + Conditional Access app controls | Per-application conditional enforcement |
| Password policy | Authentication methods policy + Conditional Access multi-factor authentication | Passwordless capable, phishing-resistant |

## Targeting

Conditional Access policies are targeted via dynamic groups built from organizational attributes (extension attributes on users and devices). This replaces organizational-unit-based Group Policy targeting with attribute-driven, cloud-native group membership.

**Important:** Extension attributes must be populated before deploying Conditional Access policies that reference them. Unpopulated attributes will cause devices and users to fall outside dynamic group membership, resulting in policy bypass.

## Full library

The complete catalog of 40+ policies, JSON export templates, named-location definitions, and authentication-strength definitions remains in the source repository. This page captures only the principles required for program-level understanding.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
