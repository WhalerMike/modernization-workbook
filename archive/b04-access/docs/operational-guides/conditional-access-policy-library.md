# Conditional Access Policy Library

A tiered reference for transitioning from Group Policy-based access control to Microsoft Entra ID Conditional Access.

## Purpose

This library defines a structured Conditional Access framework for organizations moving from Active Directory Group Policy to cloud-native access control. Policies are organized by function and tier, with clear mapping from legacy constructs and a phased deployment method that includes report-only validation.

## Policy architecture

Policies are grouped into tiers:

| Tier | Scope | Examples |
|------|-------|----------|
| Baseline | Universal requirements | MFA, legacy authentication block, compliant device |
| Device | Device posture | Compliance state, join type, platform |
| Environment | Network and location | Named locations, trusted networks |
| Region / Site | Geographic or site constraints | Country, office, branch |
| Application | Per-application controls | High-risk apps, admin portals |
| Governance | Administrative and break-glass | Privileged access, emergency accounts |

Each policy should specify target population, conditions, grant or block controls, and verification method.

## Deployment methodology

1. Author the policy in report-only mode.
2. Validate impact against a representative population.
3. Resolve exclusions and break-glass accounts.
4. Move to enforced mode.
5. Monitor sign-in logs and policy hit rates.
6. Review and adjust on a defined cadence.

## GPO-to-Conditional Access mapping

Legacy GPO constructs map to Conditional Access signals rather than one-to-one settings:

| Legacy concept | Cloud equivalent |
|----------------|------------------|
| Logon restriction by OU | Dynamic group or filter + Conditional Access |
| Workstation restriction | Compliant device or hybrid join requirement |
| Network location restriction | Named location condition |
| Time-of-day restriction | Sign-in frequency or custom control (limited) |
| Account lockout / password policy | Authentication strength and risk-based controls |

## Break-glass accounts

Maintain at least two break-glass accounts excluded from Conditional Access policies that could lock out administrators. Requirements:

- Strong, non-shared credentials stored offline
- Monitoring and alerting on any use
- Regular access review
- Exclusion documented and approved

## Monitoring

Track:

- Policy hit rates and block rates
- Report-only impact before enforcement
- Sign-in failures attributable to Conditional Access
- Break-glass account usage
- Residual risk from exclusions

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
