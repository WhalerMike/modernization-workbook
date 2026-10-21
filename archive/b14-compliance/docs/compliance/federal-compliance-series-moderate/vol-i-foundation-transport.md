# Federal Compliance Series - Moderate — Volume I: Foundation & Transport

**Volume purpose — the naming, identity, and transport substrate every other volume depends on**

## Draft posture

This document is a draft proposal. It has not been reviewed or approved by the agency CIO Office, the Office of Information Security, or organizational leadership.

## Volume purpose

Volume I establishes the substrate every other volume depends on. Before a control can be scanned, an identity authorized, a workload consolidated, or an authorization package assembled, four things must exist and be authoritative:

- A naming and addressing plane (DNS, DHCP, IPAM, certificate issuance).
- A device and cryptographic identity plane.
- An organizational identity source of truth.
- An encrypted, governed transport between sites and clouds.

The volume’s governing claim is the series’ Closure Necessity doctrine at its foundation: you cannot inventory what you cannot name, authorize what you cannot identify, or encrypt a circuit that has no overlay. Remove Volume I and the controls claimed in later volumes do not degrade — they become unevaluable.

## Books in this volume

| Book | Title | Role |
|------|-------|------|
| Book 01 | Cloud Landing Zone, IPAM/DDI, FedRAMP | The authoritative naming/addressing plane — the asset-identity join key the whole program correlates on |
| Book 02 | Network Access Control (802.1X) | Device identity at the physical port — what is connected, proven at the wire |
| Book 03 | Certificates & Tokens | Cryptographic identity for users, devices, and workloads — path-independent, session-less |
| Book 04 | HRIT Identity & Org SSOT | The human/organizational source of truth every account and access decision asserts |
| Book 05 | Network Modernization | Cloud identity, zero-trust network access, and drift reconciliation — session-to-token identity modernization |
| Book 06 | Federal Telecommunications Modernization | SD-WAN + Secure Access Service Edge under TIC 3.0 — encrypted, application-aware transport |
| Book 07 | Network Enforcement Substrate | Customer-edge enforcement accredited via NIAP / DISA STIG / FIPS 140-3 / DoDIN APL |

## How this volume fits the program

Volume I feeds everything downstream. The naming-plane join key lets later evidence fabrics correlate multiple management stacks into one compliance picture. The identity source of truth is what every access decision sits on. Cryptographic identity is applied to the database tier in Volume II. Transport and edge enforcement close the customer-owned half of boundary and encryption controls — the half no cloud service provider’s FedRAMP authorization covers. Volume I is the floor; the rest of the series is built on it.

## Where evidence lands

The binding of this volume’s closures and evidence to a governance substrate is optional and separable. The volume stands complete at FedRAMP Moderate with no substrate engagement at all. Adopting a substrate adds machine-checked scoring and drift-gating on top of what is already closed, and can be adopted later — or never — without rework.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
