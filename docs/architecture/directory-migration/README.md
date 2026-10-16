# Directory Migration — Active Directory Infrastructure Bridge

**Everything Active Directory was holding together**

## The Hidden Migration Surface

When organizations plan their “Active Directory to Entra ID migration,” they think about users and groups. They forget about everything else Active Directory was silently holding together.

Active Directory was the implicit governance model for eleven categories of infrastructure objects. When Active Directory goes away, every one of these services loses its governance anchor — and most of them fail silently. No errors. No alerts. Just certificates that stop renewing, RADIUS authentications that stop working, DNS records that go stale, and LDAP-dependent applications that quietly break.

## The Eleven Active Directory Dependency Object Types

| # | Object Type | What Active Directory Was Doing | What Breaks Without Governance |
|---|-------------|-------------------------------|-------------------------------|
| 1 | **Users** | Identity lifecycle, organizational-unit placement, attribute authority | Orphaned accounts, privilege drift, compliance gaps |
| 2 | **Computers** | Domain join, Group Policy targeting, machine certificates | Unmanaged endpoints, missing patches, security exposure |
| 3 | **Service Accounts** | Service principal names, Kerberos delegation, password management | Application authentication failures, silent service outages |
| 4 | **Security Groups** | Access control, policy scoping, resource permissions | Permission sprawl, ungoverned access, audit failures |
| 5 | **Group Policy Objects** | Device configuration, security baselines, software deployment | Configuration drift, inconsistent baselines, compliance gaps |
| 6 | **DNS / DHCP** | Name resolution, IP allocation, Active Directory-integrated zones | Name resolution failures, IP conflicts, split-brain DNS |
| 7 | **PKI / Certificate Services** | Certificate issuance, auto-enrollment, certificate-revocation-list distribution | Silent certificate expiration, authentication failures, mutual-TLS breaks |
| 8 | **RADIUS / Network Policy Server** | 802.1X network access, VPN authentication, Wi-Fi authentication | Network access failures, VPN outages, unauthorized access |
| 9 | **LDAP** | Application authentication, directory queries, legacy integrations | Application login failures, directory query errors, broken integrations |
| 10 | **Service Principal Names / Application Registrations** | Kerberos service principal names, application identity | Application single sign-on breaks, delegation failures, service identity loss |
| 11 | **Trust Relationships** | Cross-domain authentication, forest trusts, selective authentication | Cross-domain access failures, authentication breaks between organizations |

## Adapter Interfaces

Each Active Directory-dependent service gets a dedicated adapter interface that defines the governance model for migrating that service away from Active Directory. Every adapter follows the same structure:

- **Discovery** — what to inventory and how to find it in Active Directory
- **Risk Assessment** — what fails if this is not migrated correctly
- **Target Architecture** — the modern equivalent and how governance works there
- **Migration Path** — step-by-step governance-driven migration
- **Validation** — how to confirm the migration preserved governance integrity
- **Rollback** — what to do if the migration causes failures

### Critical Priority — Silent Failure Risk

These adapters address services that fail *silently* when Active Directory governance is removed. No error messages, no alerts — just things that stop working.

| Adapter | Risk Profile |
|---------|-------------|
| **PKI / Certificate Services** | Certificates stop auto-enrolling. Mutual-TLS connections fail weeks later when certificates expire. Nobody notices until production breaks. |
| **RADIUS / 802.1X / VPN** | Network access control stops authenticating against Active Directory groups. Devices fall off the network. VPN stops accepting machine certificates. |
| **LDAP Proxy** | Legacy applications that authenticate via LDAP bind stop working. This is the largest hidden attack surface in most enterprises — hundreds of applications nobody inventoried. |

### High Priority — Operational Impact

| Adapter | Risk Profile |
|---------|-------------|
| **IP Address Management** | IP address management loses its Active Directory-integrated authority model. Includes support for common platforms. |
| **Directory Synchronization Engine** | The bridge between Active Directory and Entra ID. This adapter defines the retirement criteria — when is it safe to turn off directory synchronization? Includes a retirement-readiness checklist. |
| **Device Management** | Configuration-manager to device-management transition. Group Policy to configuration-profile translation. Co-management state machine. |

### Medium Priority — Operational Continuity

| Adapter | Risk Profile |
|---------|-------------|
| **NTP / Time Services** | Kerberos requires clock synchronization within five minutes. Active Directory provided this implicitly via the primary domain controller emulator. Entra ID does not. Clock skew causes authentication failures that look like identity problems. |
| **Distributed File System / File Services** | Distributed file system namespaces and universal naming convention paths that reference Active Directory domain names. User-facing file access breaks when the domain name changes. Migration requires namespace redirection and Group Policy-based drive mapping updates. |

## The Eight Core Concepts

Every adapter is grounded in eight universal core concepts:

| Core Concept | Definition | Adapter Relevance |
|--------------|------------|-------------------|
| **Single source of truth** | Every claim has one authoritative origin | Each adapter defines its single source of truth for governance decisions |
| **Conversation as atomic unit** | Every interaction binds identity, certificates, addressing, path, quality of service, and telemetry | Adapter migrations must preserve complete conversation integrity |
| **Identity as root namespace** | Every address, certificate, subnet, policy, and telemetry event derives from identity | All adapter governance traces back to identity authority |
| **Deterministic addressing** | Addressing is identity-derived and policy-driven | IP address management and DNS adapters enforce deterministic address assignment |
| **Certificate-anchored overlay** | Mutual TLS anchors tunnels, services, and trust relationships | PKI adapter is the foundation — other adapters depend on it |
| **Telemetry as control** | Telemetry is a real-time control input, not passive reporting | Every adapter emits governance telemetry for drift detection |
| **Embedded governance** | Governance is executed through orchestrated workflows, not manual tickets | Adapter migrations are governed workflows, not ad-hoc projects |
| **User experience first** | The migration is invisible to end users if governance was done right | The ultimate validation: users notice nothing |

## The Six Migration Phases

Every adapter follows the same six-phase governance-driven migration:

| Phase | What Happens | Governance Gate |
|-------|-------------|-----------------|
| **1. Discover** | Complete inventory of what Active Directory encodes for this service | Inventory signed off by service owner |
| **2. Normalize** | Rationalize decades of organic growth into a clean model | Normalized model reviewed against the organizational-attribute codebook |
| **3. Map** | Translate Active Directory governance constructs to modern equivalents | Mapping validated — no governance gaps, no orphaned objects |
| **4. Migrate** | Execute with continuous validation | Every step validated before proceeding — no big-bang cutover |
| **5. Validate** | Confirm governance integrity is preserved post-migration | Full drift scan, telemetry confirmation, user experience validation |
| **6. Decommission** | Formally retire legacy infrastructure after validation passes a stability window | Legacy systems offline; rollback window expired with no incidents; provenance archived for audit |

Adapter migrations that add a net-new capability without retiring any legacy infrastructure may declare Phase 6 as not applicable with a brief justification.

## Adapter Registration

Every adapter registers with standardized metadata:

- Adapter identifier and name
- Priority tier (Critical / High / Medium)
- Migration phase (current state in the six-phase model)
- Dependencies (which other adapters must complete first)
- Validation criteria (machine-checkable success conditions)

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
