# Read-Only AD Assessment Guide

Safe discovery of Active Directory state before any modernization action.

## Purpose

Establish a complete baseline of the Active Directory estate without modifying a single object. All collection is read-only. The output feeds identity transformation planning, GPO analysis, and residual-risk decisions.

## Assessment categories

| Category | What is collected |
|----------|-------------------|
| Forest and domains | Trusts, functional levels, sites, site links |
| Users and groups | Counts, privileged groups, service accounts, stale objects |
| Computers | Domain-joined counts, OS distribution, last logon |
| GPOs | Link inventory, setting counts, high-risk settings |
| DNS | Zones, forwarders, SRV records |
| Certificate services | CAs, templates, issued certificate volume |
| Authentication | NTLM usage, Kerberos constrained delegation, SPNs |

## Safety rules

- Use a least-privilege read account.
- Prefer scheduled, throttled collection over interactive bulk queries.
- Store results outside the production domain.
- Do not enable auditing or change any object as part of the assessment.

## Output

A structured inventory that answers:

- What must be migrated?
- What can be retired?
- What is high-risk if left unchanged?
- What dependencies will break if a domain controller or GPO is removed?

---

*Cleaned extraction for project use.*
