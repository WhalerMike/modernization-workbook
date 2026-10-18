---
title: "Vol II Book 00 — Federal Compliance — Volume II Overview: Data Platform"
subtitle: "Volume Purpose — applying the identity and transport substrate to the database tier"
author: "Federal Cloud Services"
date: "2026-07-19T16:20:00-04:00"
format:
  html:
    css: lz-style.css
    number-sections: true
    toc: true
    toc-depth: 2
    toc-title: "Contents"
  docx:
    reference-doc: assets/reference-mslearn.docx
    number-sections: true
fig-align: center
out-width: "100%"
execute:
  echo: false

aliases:
 - /customer-documents/federal-aan-series/Vol_II_Book_00_FedAAN_Data_Platform_Overview.html

---

:::: {.content-hidden unless-profile="ssa"}
::: {.fouo-banner}
INTERNAL — NOT FOR PUBLIC DISTRIBUTION
:::
::::

::: {.aan-warning}
## Draft Proposal — Subject to Review

This document is a **draft proposal** developed by the **CSI Team (Cloud Services Infrastructure)**. It has not been reviewed or approved by the {{< meta agency.short >}} CIO Office, the Office of Information Security (OIS), or organizational leadership.

**Date Code:** 2026-07-19 16:20 ET
:::

# Volume Purpose

**Volume II applies the identity and transport substrate of Volume I to the data
tier.** The database layer carries the same credential vulnerabilities as the
identity and network layers — stored passwords, NTLM fallback, manual rotation,
no continuous evidence — and it is where most federal business systems keep
their crown jewels. This volume closes that surface: it eliminates stored SQL
credentials through Arc Managed Identity and token-based authentication, provides
the operational runbooks to execute the migration, and resolves the
**network-physics constraints** — the speed-of-light propagation floor and
consistency-class alignment — that govern how far a database can be consolidated
before physics, not procurement, decides.

The database is the **first large estate** where the series' workload-identity
progression is executed end to end. It is therefore both an application of the
Volume I substrate and the first end-to-end test of whether the substrate holds
under real production load.

# Books in This Volume

| Book | Title | Role |
|---|---|---|
| **Vol II Book 01** | SQL Server Authentication Modernization | Arc Managed Identity replaces stored credentials; NTLM eliminated; Entra Conditional Access as the SQL perimeter |
| **Vol II Book 02** | SQL Server Implementation Guide | The operational runbook — estate discovery, Arc deployment, login migration, NTLM remediation, continuous monitoring |
| **Vol II Book 03** | Database Consolidation & Network Physics | Speed-of-light floor, consistency-class-to-transport alignment, SD-WAN traffic separation for replication |

: Volume II — Data Platform {.striped .hover}

# How This Volume Fits the Program

Volume II **consumes** the cryptographic identity of Vol I Book 03 (Certificates
& Tokens) and the transport of Vol I Books 05–06, and it **feeds** two downstream
volumes: its DR runbooks are the Section-5 recovery procedures and its
geo-replicated replica architecture is the CP-6 alternate-storage content the
Business Continuity book (Vol IV Book 01) assembles into a CP-2 plan, and its
continuous SQL compliance record emits into the Multi-Cloud Evidence Fabric (Vol
III Book 07) like every other source. It is the bridge between the substrate and
the operational and governance volumes that follow.

# Where This Volume's Evidence Lands — Volume X (Optional)

Where the closures and evidence this volume produces bind to the governance
substrate — the conformance layer, the surface slots, and the evidence
contract — is documented once, for the whole series, in
**[Vol X Book 00 — Governance-Substrate Integration](Vol_X_Book_00_Governance_Substrate_Integration_Overview.md)**.
The binding is **optional and separable**: this volume, and the series it
belongs to, stands complete at FedRAMP Moderate with no substrate engagement
at all; adopting the substrate adds machine-checked scoring and drift-gating
on top of what is already closed, and can be adopted later — or never —
without rework.
