# Eight Core Concepts

These concepts are universal — not specific to any single compliance regime. They form the architectural foundation for governance, including directory migration.

| # | Core Concept | Definition |
|---|--------------|------------|
| 1 | **Single source of truth** | Every claim has one authoritative origin. All other representations are pointers, not copies. |
| 2 | **Conversation as atomic unit** | Every interaction binds identity, certificates, addressing, path, quality of service, and telemetry. |
| 3 | **Identity as root namespace** | Every address, certificate, subnet, policy, and telemetry event derives from identity. |
| 4 | **Deterministic addressing** | Addressing is identity-derived and policy-driven. |
| 5 | **Certificate-anchored overlay** | Mutual TLS anchors tunnels, services, and trust relationships. |
| 6 | **Telemetry as control** | Telemetry is a real-time control input, not passive reporting. |
| 7 | **Embedded governance** | Governance is executed through orchestrated workflows, not manual tickets. |
| 8 | **User experience first** | The migration is invisible to end users if governance was done right. |

## Alignment to Directory Migration

Each adapter interface references the core concepts it implements:

- **IP Address Management Adapter** → Concepts 1 (single source of truth) and 4 (deterministic addressing)
- **PKI Adapter** → Concept 5 (certificate-anchored overlay)
- **RADIUS Adapter** → Concepts 3 (identity as root namespace) and 5
- **LDAP Proxy Adapter** → Concept 3 (identity as root namespace)
- **Directory Synchronization Engine Adapter** → Concept 1 (single source of truth) — retirement means the single source of truth moves to the cloud identity platform
- **Device Management Adapter** → Concept 7 (embedded governance)
- **NTP Adapter** → Concept 5 (certificate-anchored overlay — Kerberos dependency)
- **Distributed File System Adapter** → Concept 8 (user experience first — path names must not break)

---

*Cleaned extraction for project use.*
