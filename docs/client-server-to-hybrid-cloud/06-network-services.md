# Chapter 06 — Services: DNS, DHCP, IPAM in the Hybrid-Cloud Model

**Active Directory-integrated DNS → private resolution · Active Directory DHCP → governed hybrid DHCP · informal IPAM → governed IP address management**

## The services claim

DNS, DHCP, and IP address management are the three network services that organizations almost always defer when they modernize Active Directory. The assumption is that because these services still work, they do not need to move.

That assumption is wrong. Active Directory-integrated DNS, Active Directory-joined DHCP servers, and informal IP address management are among the most common sources of post-migration governance regression. They look fine from the outside and are silently broken on the inside. This chapter addresses that.

## Why these three, why together

DNS, DHCP, and IP address management form a single addressing and resolution governance surface. Treating them separately is one of the most common migration mistakes:

- **DNS** translates names to addresses. Organizations rely on Active Directory-integrated zones that replicate as part of Active Directory and inherit its access model.
- **DHCP** assigns addresses. Active Directory-joined DHCP servers authenticate against Active Directory and are authorized in the forest.
- **IP address management** tracks what address ranges exist, who owns them, and which records point where. Without it, DNS and DHCP silently drift.

A migration that moves DNS but leaves Active Directory-joined DHCP in place produces a hybrid in which addresses are assigned by one authority and resolved by another. A migration that moves DNS and DHCP but leaves IP address management informal (spreadsheet, wiki, nobody-owns-it) produces silent conflicts and ghost records.

The framework treats all three as one governance domain, with matched adapters and one canonical policy: addressing governance is owned by IP address management; DNS and DHCP derive from it.

## DNS — Active Directory-integrated → private resolution

### The current-state problem

Active Directory-integrated DNS zones live inside the Active Directory replication graph. Every domain controller is a DNS server; every zone update propagates via Active Directory replication; zone access-control lists use Active Directory security groups. This means:

- Every domain controller is in the name-resolution trust path.
- Retiring Active Directory requires moving DNS first or accepting a multi-week name-resolution outage window.
- Zones that have accumulated stale records (from decommissioned computer objects) cannot be cleaned up without Active Directory-side coordination.
- External applications that depend on DNS-over-LDAPS enumeration will stop working at Active Directory retirement.

### The target architecture

DNS migrates in a three-layer pattern:

| Layer | Target | Purpose |
|-------|--------|---------|
| **Authoritative on-premises** | Private DNS zone (linked to on-premises resolver) | Canonical records for on-premises namespace |
| **Hybrid resolution** | Private resolver (inbound and outbound endpoints) | Bidirectional name resolution between virtual networks and on-premises |
| **Authoritative cloud** | Private DNS zone (private link) | Records for cloud services and SaaS endpoints |

Conditional forwarders on remaining on-premises DNS servers point to the private resolver’s inbound endpoint. Virtual-network resolution (for hybrid-projected servers, for example) points to the private resolver’s outbound endpoint, which forwards to the on-premises authoritative layer.

### The DNS adapter interface

The DNS adapter interface includes:

- **Discovery.** Enumerate zones (Active Directory-integrated and file-backed), records (with age and staleness flag), conditional forwarders, recursion settings.
- **Risk assessment.** Stale records, zones with no identifiable owner, aliases pointing to decommissioned resources.
- **Target architecture proposal.** For each zone, propose authoritative target (private DNS versus keep-on-premises versus retire) and produce a migration plan.
- **Migration path.** Phased cutover of zones, one zone at a time, with rollback per zone.
- **Validation.** Record-by-record comparison after cutover; TTL normalization; certificate-revocation-list distribution-point health.
- **Rollback.** Re-enable Active Directory-integrated zone; restore conditional forwarders to prior state.

### Attribute tagging of DNS records

DNS records are tagged with the organizational attributes of the owning object. A record that points to the platform host carries the corresponding attribute metadata. The drift engine uses this to flag records whose owner has been decommissioned — if the device object is removed but the DNS record still exists, that is orphan drift.

### Migration phases

1. **Assessment.** Chapter 02’s DNS stream produces the full zone and record inventory.
2. **Target proposal.** Analysis classifies every zone into one of three targets. A steward reviews and adjusts.
3. **Pilot zone.** Pick one low-risk zone; migrate; validate for a defined period.
4. **Zone-by-zone cutover.** Phased migration with conditional-forwarder updates per zone. Validation gate per zone.
5. **Active Directory-integrated zone retirement.** Once all zones are migrated and validated, the Active Directory-integrated zone is deleted.
6. **Steady state.** Private resolution handles all name resolution; drift detection reports zero DNS drift.

## DHCP — Active Directory-joined → governed hybrid DHCP

### The current-state problem

Microsoft DHCP running on Active Directory-joined servers is authenticated by Active Directory. DHCP server authorization lives in the forest. DHCP scopes have reservations keyed to MAC addresses; option sets inherit from server defaults. Common findings include:

- Reservations pointing at MAC addresses that have not been seen in years.
- Option sets that push Active Directory-integrated DNS servers whose addresses will change.
- Scopes sized for growth that never happened.
- Failover relationships that were configured once and never tested.

### The target architecture

DHCP modernization is less dramatic than DNS but no less important. Three variants by environment:

- **On-premises-heavy environments.** Keep DHCP on-premises; decouple from Active Directory (forest authorization removed); re-home to dedicated DHCP hosts governed by the framework.
- **Cloud-forward environments.** Move DHCP to cloud-native services or third-party virtual appliances running as hybrid-projected virtual machines.
- **Hybrid environments.** Split — on-premises scopes stay on-premises; cloud virtual networks use cloud-native; all governed via IP address management as the single source of truth.

### The DHCP adapter interface

Key discovery points:

- Every DHCP server (regardless of Active Directory-join state).
- Every scope — range, subnet mask, exclusion list, lease duration.
- Every reservation — MAC, IP, client name, option set.
- Every failover relationship — peer, mode, load-balancer split, maximum client lead time.
- Option sets — especially scope-level DNS server overrides.

Write methods: add, update, or retire scopes and reservations, governed via the plan pipeline.

### Location tagging of DHCP

DHCP scopes are tagged with the location of the site they serve. A scope for a given office carries location metadata. This enables drift detection on scope ownership and blast-radius analysis for address-pool changes.

## IP address management — informal → governed

### The current-state problem

Organizations routinely discover, as part of modernization, that they do not have IP address management at all. The state is often:

- A shared spreadsheet maintained by one person.
- A wiki page whose last edit was years ago.
- Several partial installations that cover some subnets but not others.
- Reserved and not-reserved ranges that conflict with actual usage.

The migration goal is **one governed IP address management system** with full coverage of the address surface.

### The IP address management adapter

The adapter contract standardizes:

- Network range discovery.
- Host record sync with DNS.
- Reservation sync with DHCP.
- Change-window tracking (every addition or modification carries a correlation identifier).
- Provenance emission (every change produces a repository commit).

### One IP address management system, three services

The operating model: IP address management is the single source of truth for addressing. DNS and DHCP adapters read from it and produce matched records. Drift between IP address management and DNS or DHCP is hierarchy drift — the tree exists but the leaves do not agree.

This pattern is why all three services migrate together, not separately.

## Hybrid resolution architecture

On-premises and cloud namespaces resolve through a private resolver into the authoritative private DNS zone, with IP address management as the single source of truth.

Reads go in either direction: an on-premises host resolves a local name through the resolver inbound endpoint; a hybrid-projected virtual machine in a virtual network resolves a private name through the outbound endpoint to private DNS.

## The three-adapter plan

Every network-services modernization run produces a plan with all three adapters coordinating:

1. **IP address management plan actions.** Populate authoritative records.
2. **DNS plan actions.** Create private DNS zone entries keyed to IP address management records.
3. **DHCP plan actions.** Create DHCP scope reservations keyed to IP address management records (where DHCP is used).

If any of the three would produce drift between itself and the other two, the plan fails validation. There is no DNS-only migration run; it is always DNS, DHCP, and IP address management together.

## Validation

Services migration passes when:

- IP address management covers one hundred percent of the address surface (no unclaimed subnets).
- Every private DNS record has a matching IP address management entry.
- Every DHCP reservation has a matching IP address management entry.
- Every on-premises conditional forwarder points to the private resolver inbound endpoint.
- Every virtual network points to the private resolver outbound endpoint.
- The legacy Active Directory-integrated DNS zone is retired (or explicitly excluded with documented rationale).
- Drift detection reports zero drift across IP address management, DNS, and DHCP for a defined period.
- The nightly assessment-to-plan run produces zero actions for the services tree.

## Why organizations postpone — and why they should not

The common pattern: modernize identity and policy, leave DNS, DHCP, and IP address management for “Phase 2.” Phase 2 rarely happens. The organization is left with:

- Active Directory retired for user authentication.
- Active Directory retained because DNS still lives there.
- Silent coupling between the two.

A forest that retains Active Directory-integrated DNS is not actually retired. Do not pretend otherwise. The services migration is part of the core modernization, not a follow-on.

---

**Previous:** [Chapter 05 — Policy Transformation](05-policy-transformation.md)  
**Next:** Chapter 07 — Compute Transformation
