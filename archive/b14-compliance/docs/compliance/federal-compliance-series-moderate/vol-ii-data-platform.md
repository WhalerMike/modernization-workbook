# Federal Compliance Series - Moderate — Volume II: Data Platform

**Volume purpose — applying the identity and transport substrate to the database tier**

## Draft posture

This document is a draft proposal. It has not been reviewed or approved by the agency CIO Office, the Office of Information Security, or organizational leadership.

## Volume purpose

Volume II applies the identity and transport substrate of Volume I to the data tier. The database layer carries the same credential vulnerabilities as the identity and network layers — stored passwords, NTLM fallback, manual rotation, no continuous evidence — and it is where most federal business systems keep their crown jewels. This volume closes that surface: it eliminates stored SQL credentials through managed identity and token-based authentication, provides the operational runbooks to execute the migration, and resolves the network-physics constraints — the speed-of-light propagation floor and consistency-class alignment — that govern how far a database can be consolidated before physics, not procurement, decides.

The database is the first large estate where the series’ workload-identity progression is executed end to end. It is therefore both an application of the Volume I substrate and the first end-to-end test of whether the substrate holds under real production load.

## Books in this volume

| Book | Title | Role |
|------|-------|------|
| Book 01 | SQL Server Authentication Modernization | Managed identity replaces stored credentials; NTLM eliminated; cloud identity conditional access as the SQL perimeter |
| Book 02 | SQL Server Implementation Guide | The operational runbook — estate discovery, managed-identity deployment, login migration, NTLM remediation, continuous monitoring |
| Book 03 | Database Consolidation & Network Physics | Speed-of-light floor, consistency-class-to-transport alignment, SD-WAN traffic separation for replication |

## How this volume fits the program

Volume II consumes the cryptographic identity and transport of Volume I, and it feeds two downstream volumes: its disaster-recovery runbooks and geo-replicated replica architecture are assembled into the business continuity plan, and its continuous SQL compliance record emits into the multi-cloud evidence fabric like every other source. It is the bridge between the substrate and the operational and governance volumes that follow.

## Where evidence lands

The binding of this volume’s closures and evidence to a governance substrate is optional and separable. The volume stands complete at FedRAMP Moderate with no substrate engagement at all. Adopting a substrate adds machine-checked scoring and drift-gating on top of what is already closed, and can be adopted later — or never — without rework.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
