# Modernization Workbook — Outline

## 1. Problem Statement
- Hidden governance surfaces in legacy directories (beyond users and groups)
- Structural loss when moving from hierarchical models to flat cloud directories
- Fragmentation vs. single authoritative origin

## 2. Core Principles
- Single Source of Truth / authoritative origin (derived pointers, never copies)
- Identity as the root namespace
- Drift is explicit (schema, semantic, provenance, authorization, identity)
- Evidence-driven change and provenance closure
- No rip-and-replace

## 3. Assessment Framework
- Discovery of legacy dependencies (GPO, DNS/DHCP/IPAM, Kerberos, PKI, service accounts, etc.)
- Inventory and normalization of organizational structure and authority chains

## 4. Target Architecture
- Attribute-oriented structure (facets / coded attributes driving hierarchy, groups, and policy)
- Dynamic membership constructs
- Layered model: Identity → Structure → Policy → Governance
- Control planes: Identity, Addressing, Policy, Telemetry, etc.

## 5. Domain Playbooks
- Identity transformation
- Policy migration
- Services / addressing (DDI)
- Compute / device
- Access plane (token-based, application-aware)

## 6. Program Management
- Change waves under least privilege / just-in-time elevation
- Gates, rollback triggers, cutover
- Closure with provenance and continuous evidence emission

## 7. Validation & Ongoing Governance
- Drift detection and classification
- Continuous monitoring against the authoritative origin

## Sources
Derived and rebranded from public materials at https://whalermike.github.io/uiao/ (Client-Server to Hybrid-Cloud series, modernization whitepapers, attribute-oriented models, SSOT and drift concepts).
