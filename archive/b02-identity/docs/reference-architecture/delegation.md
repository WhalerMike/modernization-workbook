---
title: "Delegation Matrix"
subtitle: "Administrative Units and scoped role assignments"
date: 2026-05-24
format:
  html:
    toc: true
    toc-depth: 3
  docx:
    toc: true
lifecycle: aspirational
lifecycle_review: 2026-11-22
aliases:
  - /customer-documents/reference-architecture/delegation.html
---


## The Delegation Problem

In Active Directory, delegation was implicit. Place a user in an OU, grant an admin group permissions on that OU, and delegation was done. The OU tree *was* the delegation model — every branch of the hierarchy defined a scope of management authority.

Entra ID has no OUs. It has a flat directory where every user is at the same level. Without a replacement for OU-based delegation, organizations face two bad choices:

1. **Over-delegate**: Give administrators tenant-wide permissions (Global Admin, User Admin) because there is no scope boundary. This violates least-privilege and creates audit findings.
2. **Under-delegate**: Lock down all administration to a tiny team, creating bottlenecks where every password reset, group change, and user update requires a central IT ticket.

Administrative Units (AUs) solve this — they create virtual scope boundaries within the flat directory. The Delegation Matrix (FMP_154) names the canonical AUs and the role assignments they carry.

## Three-Tier Model

| Tier | Scope | Who | What They Can Do |
|---|---|---|---|
| **Tier 1** | Enterprise | Security team, Compliance, Executives | Read-only visibility across all governed principals |
| **Tier 2** | Department / Division | Department administrators | Full user lifecycle management within their AU scope |
| **Tier 3** | Sub-team (Department + Division + Role tier) | Helpdesk / per-team admins | Password resets and basic user support within their narrow AU scope |

Each tier maps to an Administrative Unit:

- **Tier 1:** `AU-Enterprise`
- **Tier 2:** `AU-Department-IT`
- **Tier 3:** `AU-IT-CyberOps`

## Administrative Unit Registry

### Enterprise AU (Tier 1)

| AU | Restricted |
|---|---|
| `AU-Enterprise` | Yes |

The Tier-1 enterprise AU uses the Department attribute's non-empty check as the "is this principal governed?" predicate — populated Department implies the principal has been HR-provisioned through the provisioning pipeline.

### Department AUs (Tier 2)

| AU | Department | Restricted |
|---|---|---|
| `AU-Department-IT` | IT | Yes |
| `AU-Department-HR` | HR | Yes |
| `AU-Department-Finance` | Finance | Yes |
| `AU-Department-Legal` | Legal | Yes |
| `AU-Department-Engineering` | Engineering | Yes |
| `AU-Department-Operations` | Operations | Yes |
| `AU-Department-Sales` | Sales | Yes |
| `AU-Department-Executive` | Executive | Yes |

### Division AUs (Tier 3 — created on demand within a Department)

| AU | Scope | Restricted |
|---|---|---|
| `AU-IT-CyberOps` | IT/CyberOps | Yes |
| `AU-IT-InfraOps` | IT/Infrastructure | Yes |
| `AU-IT-AppDev` | IT/AppDev | Yes |
| `AU-Legal-GRC` | Legal/GRC | Yes |

## Role Assignment Matrix

| Role | Assigned To | Scoped To | Tier |
|---|---|---|---|
| Global Reader | `IT-CyberOps-Users` | `AU-Enterprise` | 1 |
| Security Reader | `Legal-GRC-Users` | `AU-Enterprise` | 1 |
| Reports Reader | `Department-Executive-Users` | `AU-Enterprise` | 1 |
| User Administrator | `Finance-Admins` | `AU-Department-Finance` | 2 |
| Groups Administrator | `Finance-Admins` | `AU-Department-Finance` | 2 |
| User Administrator | `HR-Admins` | `AU-Department-HR` | 2 |
| User Administrator | `IT-Admins` | `AU-Department-IT` | 2 |
| Helpdesk Administrator | `IT-CyberOps-Admins` | `AU-IT-CyberOps` | 3 |
| Password Administrator | `IT-CyberOps-Admins` | `AU-IT-CyberOps` | 3 |
| Authentication Administrator | `IT-InfraOps-Admins` | `AU-IT-InfraOps` | 3 |

Notes:
- The `*-Admins` dynamic groups derive from the corresponding `*-Users` groups via a separate membership rule (typically an enriched HR attribute or a manually curated list per FMP_154).

## Restricted Management

**Every AU in this matrix is Restricted Management.** This is non-negotiable.

Restricted Management means:

- Global Administrators **cannot** manage AU members without explicit AU-scoped role assignment
- Only users with roles scoped to the specific AU can manage objects within it
- This **prevents privilege escalation** — even a Global Admin cannot bypass AU-scoped delegation

An unrestricted AU is classified as **CRITICAL drift** and triggers immediate remediation.

## Drift Detection

| Drift Type | Severity | Auto-Fix |
|---|---|---|
| AU Membership Drift — rule mismatch | HIGH | Yes |
| Role Assignment Drift — unauthorized assignment | CRITICAL | No — investigate |
| Unrestricted AU — missing Restricted flag | CRITICAL | Yes |
| Orphaned AU — no role assignments | LOW | No — flag |
| Missing AU — canonical entry with no tenant AU | HIGH | Yes |

::: {.callout-tip}
## Source
Canonical narrative: `FMP_154_Delegation_Matrix_AUs_Roles.md`.
:::
