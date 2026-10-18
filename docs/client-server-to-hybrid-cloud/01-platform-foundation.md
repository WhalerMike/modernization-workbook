# Chapter 01 — Platform Foundation

**Windows Server 2025 + IIS + version control + Kerberos + enterprise PKI — the host that runs the transformation**

## The architectural claim

Everything the modernization framework does — every analysis, every plan, every delivery, every evidence artifact — can run on one Windows Server 2025 host. Not a cluster, not a microservice mesh, not a cloud-native control plane. One authoritative host, with a standby for recovery.

This is a deliberate design choice, not a simplification. The property that matters is a *single authoritative writer*; "one host" is the simplest way to get it. The framework described here is a reference architecture to be built from standard components, not an existing product.

![Platform Host — Five Roles](../images/cshc/platform-host.svg)

## Why one host

The platform host is a governance substrate, not an application server. Governance substrates have properties that ordinary application servers do not:

- **Single source of truth.** There is exactly one repository that holds the authoritative governance artifacts. Two hosts cannot both be authoritative; they would diverge. Replication is for resilience and recovery, not active-active load-sharing. Where high availability is required, a hot-standby replica with automatic, witness-gated failover keeps that single authority continuously available without ever creating a second writer.
- **Deterministic provenance.** Every plan, every delivery, and every drift report must be traceable to a commit on the canonical repository. A distributed-by-default architecture dilutes provenance; a single-host architecture concentrates it.
- **Bounded attack surface.** A single hardened Tier-0 host can present a simpler security story (CIS baseline, application control, code integrity) than a fleet of loosely coupled services, though it is also a concentrated high-value target and must be protected as one.
- **Operational simplicity.** One host means one patch cadence, one backup policy, one disaster-recovery playbook, one set of compliance rules, and one enrollment. Complexity scales badly in governance systems because every extra moving part is an extra source of drift.

Horizontal scale, when it becomes necessary, is handled at the target surface layer — cloud identity, device management, and vendor APIs scale natively — not by fanning out the governance substrate.

## The five roles

A single host plays five distinct roles. Each maps to a capability the transformation engine needs.

### 1. Canonical source of truth

**Version control (for example, Gitea).** Every governance artifact — dynamic group rules, delegation matrices, transformation plans, policy libraries, adapter manifests, drift reports — lives as a versioned file in the repository. Nothing is an admin-portal click. Nothing is a verbal assurance. Every change is a commit; every commit is signed; every commit is attributable.

The repository sits behind a reverse proxy (never exposed directly), is anchored to enterprise PKI for client-certificate and HTTPS, and is replicated to a standby. The baseline posture is a cold standby with manual failover and explicit recovery-point and recovery-time objectives. An HA-enabled deployment uses a hot standby with automatic, witness-gated failover. Off-premises backup remains the floor for total-site loss.

### 2. HTTPS reverse proxy and client-certificate terminator

**IIS + URL Rewrite + Application Request Routing.** Every inbound request lands at IIS. IIS performs TLS termination, client-certificate mutual TLS (for administrative access), HSTS, HTTP/2, and forwards to the version-control service on loopback. IIS can also serve as the authenticated landing point for directory lookups required by the version-control service.

This pattern keeps the authoritative repository off the public network while still supporting certificate-based administrative access.

### 3. Legacy-to-modern authentication bridge

**Kerberos + enterprise PKI.** The platform host holds simultaneous memberships:

- It is **domain-joined** to the legacy Active Directory forest (for Kerberos-anchored reads of the forest, Group Policy, DNS zones, and certificate services).
- It is **Azure Arc-connected** (for a system-assigned managed identity that authenticates outbound calls to Azure Resource Manager[^cs01-arcmi]; Microsoft Graph calls use a workload identity granted only the permissions it needs).
- It holds an **enterprise-CA-issued server certificate** for TLS. Arc onboarding uses a service principal or interactive sign-in, not a client certificate from the enterprise CA.[^cs01-arcsp]

The bridges are not redundant. The Active Directory side is read-only by policy (assessment tooling runs with a least-privilege account that has only the forest-reader rights it needs). The cloud side is read-write (transformation plans land there).

### 4. Transformation engine host

**PowerShell + Python + API integrator layer.** This is where assessment, planning, and delivery actually happen.

- **PowerShell** (7.4 or later, as an example baseline) handles Active Directory-side reads (ActiveDirectory, GroupPolicy, DnsServer, DhcpServer modules), version-control API calls, local provenance writes, and test harnesses.
- **Python** (3.12 or later, as an example baseline) handles graph analysis (organizational unit trees, dependency graphs), schema validation, and anything that benefits from a richer type system or library ecosystem.
- **API integrators** wrap vendor APIs — Microsoft Graph, Azure Resource Manager, Intune management APIs, IPAM, IT service management, privileged access management, and posture-assessment output — behind uniform contracts.

Both engines are governed: every script lives in the repository; every run produces a signed, provenanced log entry; every API call is logged with correlation identifiers that tie back to a plan and a commit.

### 5. Adapter dispatcher

When the transformation engine needs to touch a specific Active Directory dependency category (PKI, RADIUS, LDAP, DHCP, etc.), it dispatches through a defined adapter interface. Each adapter implementation (IPAM vendor, certificate authority, network access control, etc.) plugs in behind the interface; the engine never hard-codes vendor specifics.

A new vendor slots into the relevant adapter contract without requiring changes to the transformation engine.

## Separation of governance and execution

A critical principle: **governance and execution never co-mingle on the platform host.**

- **Governance layer** — the review and authorization function. It validates plans, signs commits, enforces boundary rules, and writes audit entries. It does not touch the target surface directly.
- **Execution layer** — the delivery function. It takes an authorized plan, calls the adapter APIs, and writes back a structured result. It does not decide what to do; it executes what the governance layer has already decided.

On the platform host this manifests as two separate service accounts, two separate credential stores, and two separate log streams. Removing either layer’s access stops the system in a safe state; it does not leave the other layer able to make decisions it should not.

The reason is straightforward: a component that both decides and acts can cover its tracks. Separating them makes every change auditable, reversible, and governed.

## Integration surface

The platform host has clearly bounded integration points. Each is governed by an adapter specification and a validation approach.

| Integration | Direction | Purpose |
|-------------|-----------|---------|
| Active Directory forest (legacy) | Read-only | Forest/domain/OU discovery, GPO inventory, DNS/DHCP read, Kerberos SPN audit |
| Certificate services (legacy PKI) | Read-only | Template analysis, privilege-escalation path check, certificate inventory |
| Cloud identity | Read-write | User/group/device/administrative-unit/policy provisioning |
| Device management | Read-write | Compliance policies, configuration profiles, enrollment |
| Hybrid management (Arc) | Read-write | Hybrid server enrollment, tag management, policy assignment |
| IP address management | Read-write | IPAM records, DHCP scope governance |
| Network access control | Read-write | RADIUS policy, 802.1X, device posture |
| IT service management | Read-write | Change and incident integration |
| Privileged access management | Read-write | Vault and safe integration |

Every integration is bidirectional-or-less. The drift detection process re-validates every integration on a schedule.

## Operational properties

A fully configured host has the following operational properties:

- **Tier-0 classification** — hardened baseline, application control, code integrity, endpoint protection, and security-information-and-event-management forwarding.
- **Provenance-bound** — every configuration file change is a commit; administrative-portal changes are prohibited by procedure and detected by drift monitoring.
- **Attribute-governed** — the server carries its organizational tags in Azure Resource Manager and is targeted by tag-scoped Azure Policy and machine configuration.[^cs01-mc]
- **Drift-monitored** — state (attributes, administrative-unit membership, repository team mapping, hybrid heartbeat) is reported on a schedule. Drift opens a tracked item.
- **Disaster-recovery ready** — nightly backup plus a standby replica with documented recovery objectives. The baseline is manual failover to a cold standby, upgradable to automatic, witness-gated failover to a hot standby.

## What the platform host is not

Boundaries matter as much as capabilities:

- **Not a domain controller.** The platform host is domain-joined, not domain-hosting. When the legacy forest is eventually retired, the platform host is rebuilt or re-joined as a non-domain (workgroup, Arc-managed) server; the domain controllers go away.
- **Not a target-surface component.** The platform host governs the cloud identity, device management, and hybrid management surfaces — it does not live inside them. It is deliberately on-premises (or Arc-projected) so it survives tenant-level events.
- **Not a proprietary product.** The platform host is a governed deployment of well-known components configured together in a specific way. There is no proprietary binary to ship.
- **Not a replacement for human review.** The governance layer still reviews and authorizes. The platform host hosts the execution layer and the authoritative repository.

## Cross-references

- Full build procedures can be developed as a separate runbook (PowerShell-first, phased).
- The decision to place version control behind a reverse proxy and the choice of standby model are architectural decisions that should be recorded in the project’s own decision log, not inherited from external documents.


## Authoritative references

- Microsoft Learn, [Access Azure resources with managed identity on Azure Arc-enabled servers - Azure Arc](https://learn.microsoft.com/en-us/azure/azure-arc/servers/managed-identity-authentication)
- Microsoft Learn, [Connect hybrid machines to Azure at scale - Azure Arc](https://learn.microsoft.com/en-us/azure/azure-arc/servers/onboard-service-principal)
- Microsoft Learn, [What is Azure Machine Configuration? - Azure Machine Configuration](https://learn.microsoft.com/en-us/azure/governance/machine-configuration/overview/01-overview-concepts)

---

**Previous:** [Applicability and scope](00a-applicability.md)  
**Next:** [Chapter 02 — Analyzing the Client/Server Estate](02-analyzing-the-estate.md)

[^cs01-arcmi]: Microsoft Learn, *Access Azure resources with managed identity on Azure Arc-enabled servers - Azure Arc*. <https://learn.microsoft.com/en-us/azure/azure-arc/servers/managed-identity-authentication>
[^cs01-arcsp]: Microsoft Learn, *Connect hybrid machines to Azure at scale - Azure Arc*. <https://learn.microsoft.com/en-us/azure/azure-arc/servers/onboard-service-principal>
[^cs01-mc]: Microsoft Learn, *What is Azure Machine Configuration? - Azure Machine Configuration*. <https://learn.microsoft.com/en-us/azure/governance/machine-configuration/overview/01-overview-concepts>
