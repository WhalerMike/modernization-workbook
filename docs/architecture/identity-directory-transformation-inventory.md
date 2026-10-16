# Identity and Directory Transformation Inventory

Structured assessment artifact for planning the move from Active Directory to a hybrid or cloud-native identity model.

## Purpose

Capture the current identity and directory estate in a form that supports transformation planning. The inventory answers what exists, what depends on it, and what must be decided before any object is moved or retired.

## Inventory categories

| Category | Key questions |
|----------|---------------|
| Forest and domains | Functional levels, trusts, sites, domain controllers |
| Users | Count, privileged, service, stale, external |
| Groups | Count, nested, privileged, dynamic vs static |
| Computers | Domain-joined, OS distribution, last logon |
| Authentication | NTLM usage, Kerberos delegation, certificate-based |
| Applications | Apps that require AD, LDAP, or Kerberos |
| Group Policy | Count, high-risk settings, link structure |
| DNS and PKI | Zones, CAs, templates, issued certificates |
| Dependencies | Systems that will break if a DC, GPO, or trust is removed |

## Output

A decision-ready inventory that feeds:

- Identity transformation sequencing
- GPO sunset planning
- Application remediation
- Residual risk acceptance

---

*Cleaned extraction for project use.*
