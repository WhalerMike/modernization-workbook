# DNS Modernization Guide

Moving from AD-integrated DNS to hybrid resolution across on-premises and cloud.

## Purpose

This guide describes the operational sequence for migrating from Active Directory-integrated DNS to a hybrid resolution model that correctly serves private endpoints, SaaS namespaces, and residual on-premises zones.

## Phases

| Phase | Focus |
|-------|-------|
| 0 | Assessment — inventory zones, forwarders, SRV records, and current resolution paths |
| 1 | Deploy cloud private resolver infrastructure |
| 2 | Create private DNS zones and import non-AD zones |
| 3 | Configure forwarding rulesets |
| 4 | Migrate conditional forwarders |
| 5 | Migrate residual zones (GlobalNames, reverse lookup) |
| 6 | Configure private endpoint DNS zones |
| 7 | Gradual client DNS server migration |
| 8 | Validate SRV and service records |
| 9 | Decommission legacy DNS servers after verification |

## Key risks

- **Split-brain** — The same name resolves differently depending on origin if forwarding rules are missing or stale.
- **Private endpoint fallback** — Missing conditional forwarding causes private endpoints to resolve to public addresses.
- **SRV orphaning** — Active Directory service records do not migrate automatically and must be inventoried before domain controller decommissioning.
- **OCSP/CRL reachability** — Certificate validation endpoints must resolve consistently from every location.

## Success criteria

- Same query returns the intended answer (private or public) from every governed origin.
- Private endpoint traffic stays on the private path.
- No residual dependency on decommissioned DNS servers.
- Query logging confirms resolution-path consistency.

---

*Cleaned extraction for project use.*
