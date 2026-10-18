---
title: "Modernization — Modernization"
subtitle: "The modernization expression of the Federal Modernization Program substrate: migration without rip-and-replace, governed by the same spine"
doc-type: section-landing
audience: [Executive, Technical, Customer]
---

# Modernization — Modernization {.unnumbered}

**Modernization** is the modernization member of the Org family — the operational
expression of the Federal Modernization Program substrate that moves a legacy estate forward *without
rip-and-replace*. Its core is vendor-neutral: adapter interfaces for
directory, device, PKI, RADIUS, DNS/DHCP/IPAM, and overlay-adjacent control
surfaces, driven by an assessment engine, a defined target surface, and
program management that keeps the whole journey change-controlled. Active
Directory → Entra ID remains the leading worked path, but Modernization is designed
to govern heterogeneous stacks beyond that single journey.

**the organizational-attribute model** governs, **Compliance** proves federal organizational compliance,
**Modernization** modernizes — three expressions of one substrate, adoptable
together or entirely independently.

![The Org family: four operational expressions — the organizational-attribute model (governance), Compliance (Federal Organizational Compliance), Modernization (Organizational Modernization), and external interconnection (external interconnection) — standing on one governance substrate of identity, addressing, evidence, and policy-bearing control planes. Compliance connects to the substrate through a dashed Evidence & Authorization Contract seam, and a footer band states the four are adoptable together or each on its own.](../customer-documents/orgcomp-series/figs/org-family-substrate.png){width="100%"}

::: {.callout-tip}
## Download the whole family
**[orgmod-modernization-series-latest.zip]**
— every page Modernization publishes as Word documents, grouped into `Transformation_Narrative/`, `Guides/`,
`Modernization_Specs/`, `Directory_Migration_Bridge/`, `Whitepapers/`, and
`SQL_Server_Transformation/`. Rebuilt from source on
every site deploy; open `INDEX.md` first. See the
Downloads page for what each folder holds.
:::

## Ways in

Pick the entry point that matches your role:

| Entry point | For | Start here |
|---|---|---|
| **The infrastructure bridge** | Architects planning what replaces AD's eleven implicit roles | [Directory Migration — the AD infrastructure bridge](../reference-architecture/directory-migration.md), and the eight adapter interfaces behind it |
| **The transformation series** | Program teams running the end-to-end journey | Microsoft Client-Server to Hybrid-Cloud — AD, GPO, DNS, DHCP, Kerberos, and PKI → Entra ID, Intune, Azure Arc, IPAM, SASE, and Zero Trust |
| **The device and server planes** | Operators modernizing endpoints and servers | Intune + Azure Arc Modernization — runnable manually or the organizational-attribute model-governed |
| **The HR-driven identity pipeline** | Identity teams building the joiner/mover/leaver feed against Federal HR 2.0 (Oracle Core HCM) | HRIT to HR-Driven IAM Execution Plan — the provisioning pipe to today's AD-mastered estate and the cloud-native target, on the program's wave clock |
| **The full guide shelf** | Everything task-oriented in one place | The Modernization guides — transformation engine, target surface, and program management |
| **The long-form case** | Readers who need the argument before the runbook | The modernization whitepapers — [the structural migration problem](../whitepapers/ad-to-entraid-migration-problem.md), [the modernization journey](../whitepapers/modernization-journey.md), and the [network and infrastructure track](../whitepapers/reading-guide.md) behind the transport, DNS, and field-office decisions |

## What Modernization modernizes

- **The assessment engine** — enumerate what the legacy estate actually does
 before deciding what replaces it; the
 Federal Modernization Program
 carries the engine, target surface, and program-management discipline.
- **The target surface** — [Intune policy templates](../operational-guides/target-surface/intune-policy-templates.md),
 the [Conditional Access library](../operational-guides/access-plane/conditional-access-library.md),
 and the cross-adapter modernization specs.
- **A worked consumer** — the
 SQL Server Identity Transformation
 series migrates a twenty-year SQL estate off Windows Authentication onto
 Entra ID, end to end.
- **The long-form argument** — the modernization tracks of the
 [whitepaper reading guide](../whitepapers/reading-guide.md):
 Track 2 carries the AD → Entra ID arc from
 [the structural migration problem](../whitepapers/ad-to-entraid-migration-problem.md)
 through
 [flipping 50,000 devices to hybrid join](../whitepapers/hybrid-join-without-governance.md),
 and Track 4 carries the network and infrastructure decisions — transport
 under TIC 3.0, DNS in the hybrid multi-cloud, and the field-office WAN
 case. These ship in the Modernization kit's `Whitepapers/` folder.
- **The seams to its siblings** — Modernization's changes land on the addressing
 plane the organizational-attribute model governs, and the evidence they produce is what Compliance
 proves; adopt any of the three alone, or all together. What Modernization does
 *not* carry is steady-state governance operations: the Active Governance
 Directory, federal AI identity governance, and the Help Desk / Cloud
 Services authority model sit in the same `operational-guides/` tree but
 are the organizational-attribute model's, because their deliverable is an
 estate governed rather than an estate moved.

## One lifecycle, three pillars {#macdr}

Every operational change the Org family touches — every **Move, Add, Change,
Deletion, and Reset (MACD-R)** — travels the same five-clause authorized
path: **it originates with the SSOT → carries an authoritative authorization
→ executes under least privilege with just-in-time elevation (PIM) → closes
with provenance → emits verified, secured evidence automatically to
continuous monitoring.** Modernization applies the law at migration scale: a wave
is a batch of Moves originated by the modernization plan's source of truth,
each executed under a just-in-time role and each emitting per-object
closure evidence — which is how a migration stays an audited operation
instead of a weekend of standing admin rights. The non-human classes Modernization
moves have designated SSOTs of their own: devices originate in the
asset-lifecycle registry (MDM enrollment is enforcement, not truth),
declared infrastructure originates in the IaC repository, and every item
migrated must carry a human owner resolvable in the HR SSOT — an ownerless
item is an orphan finding before it is a migration candidate. The full
doctrine — including Closure Provenance ("no closure counts unless it
carries its proof") and the per-class
[SSOT Registry](../compliance/Vol_0_Book_00_Executive_Summary.md#ssot-registry)
— is stated in
[Compliance Vol 0 Book 00](../compliance/Vol_0_Book_00_Executive_Summary.md#macdr-lifecycle).

## Current state

Modernization's adoption state is tracked component-by-component on the
Substrate Status page — the candid map of
what is implemented, partial, and aspirational today.
