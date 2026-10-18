---
title: "Choose Your Partners — The OrgPath Composability Matrix"
subtitle: "What governs what, with which IdP, and what each piece needs the others for"
doc-type: whitepaper
author: Michael Stratton
date: "2026-06-01"
status: Active
derived-from: "Converted from the committed DOCX (rendered 2026-09-16, rev e1a72fa8)"
---

::: {.content-visible when-format="html"}
::: {.callout-tip appearance="simple"}
**[Download this whitepaper as DOCX](orgpath-composability-matrix.docx)** — a Word copy of
this page, regenerated on every site deploy. (Also available from the
**Other Formats** link in the page sidebar.)
:::
:::

![OrgPath composability --- Axis 1 identity targets and Axis 2 capability packs](../images/whitepapers/orgpath-composability-matrix-diagram-01-axis1-identity-targets.png){#fig-orgpath-composability-matrix-diagram-01-axis1-identity-targets width="100%" fig-alt="OrgPath composability — Axis 1 identity targets and Axis 2 capability packs"}

::: {.callout-important title="Problem, solution, ask"}
**Problem.** Buyers assume FMP is a monolith you adopt whole, which makes build-vs-buy look binary. Without a legible map of what is active, proposed, or not applicable per identity target and capability pack, the *deployed* surface and the *designed* surface get confused in both directions.

**Solution.** OrgPath (FMP_151) is the à-la-carte core; everything else is an additive profile or adapter (ADR-098). Two independent axes --- where identity lives, which capabilities are switched on --- laid out as a status-labelled grid with three worked stacks and the dependency truths: OrgPath needs no single vendor, SailPoint is an optional vertical, and enforcement reads facets through whichever storage profile is present.

**Ask.** Weight the matrix by status, not by row count --- today's write-capable path is Microsoft/Entra plus read-only assessment. Pick a stack from the grid, and where a target you need is marked *Proposed*, ask for its live-tenant conformance run before treating it as delivered.
:::

## The substrate is à la carte by construction

FMP is not a monolith you adopt whole. OrgPath --- the 15-facet organizational placement model (FMP_151) --- is the core substrate, and everything else is a **profile** or an **adapter** that snaps onto it. ADR-098 states the rule directly: *"New profiles are additive --- a vendor is onboarded by writing a profile (locator map) + a transport... No core change is required."*

That means a customer chooses along two independent axes:

1.  **Where identity lives** --- which IdP / directory / cloud stores the facets.
2.  **Which capabilities are switched on** --- drift detection, Zero Trust enforcement, the non-employee / partner branch, AI-system governance, the device plane.

This paper makes those choices legible: a grid of what is **active** today, what is **proposed** (built, pending live-tenant conformance), and what is **N/A** for a given target --- so a buyer can see exactly what they get by picking a stack, and what each piece needs the others for.

## What needs what --- the dependency truths

Three separability facts drive every cell below:

- **OrgPath runs without any single vendor.** The facet model is vendor-neutral; the Microsoft `extensionAttribute1..15` slot table is just the *reference* profile, not the schema (ADR-098 §D2). OrgPath governs humans, devices (ADR-038), and AI systems (FMP_196) with or without any particular IdP.
- **SailPoint is an optional vertical, not a dependency.** The SailPoint NERM / ISC slots (ADR-059) are read-only (`ssot-mutation: never`), reserved, and only deepen the **non-employee / partner** branch (FMP_141) that Microsoft has no FedRAMP-Moderate product for. Remove SailPoint and OrgPath loses nothing of its core; it loses only deep non-employee lifecycle.
- **Enforcement consumes facets through a profile's read side.** Zero Trust policy groups (NSX, Palo Alto, cloud-native) resolve a facet predicate (`Department=IT AND Classification=Contractor`) to a native construct (ADR-098 §D5) --- so enforcement depends on a storage profile being present, not on a specific vendor.

## Axis 1 --- Identity / storage targets

Status legend: **Active** = shipped and exercised on the Microsoft estate; **Proposed** = profile + transport built, pending live-tenant conformance; **Profile-only** = facet map exists, transport staged to a later ADR.

| Target | License | Plane(s) | Profile | Transport | Adapter status |
|-----------|-----------|-----------|-----------|-----------|-----------|
| Microsoft Entra | Commercial | identity, device | reference | `graph` + `arm` | **Active** |
| Okta | Commercial | identity | proposed | `okta_transport` | Proposed |
| Generic LDAP / FreeIPA | Open Source | identity | proposed | `ldap_transport` | Proposed |
| **Keycloak** (Red Hat / community) | **Apache-2.0** | identity | proposed | `keycloak_transport` | **Proposed (new, ADR-113)** |
| Auth0 | Commercial | identity | proposed | `auth0_transport` | **Proposed (new, ADR-113)** |
| PingOne | Commercial | identity | proposed | `pingone_transport` | **Proposed (new, ADR-113)** |
| AWS (IAM Identity Center) | Commercial | identity, workload | proposed | --- (Stage 2) | Profile-only |
| GCP (Cloud Identity) | Commercial | identity, workload | proposed | --- (Stage 2) | Profile-only |
| VMware (WS1 / vSphere / NSX) | Commercial | identity, workload, enforcement | proposed | --- (Stage 2) | Profile-only |

::: {.callout-warning title="ILLUSTRATIVE — replace before external release"}
**Deployment evidence for the Microsoft Entra Active row.** The status legend above asserts Entra is "shipped and exercised on the Microsoft estate," but this paper does not yet state the evidence behind that claim. Before external release, replace this block with the real figures:

- **Tenant count:** exercised across `[N tenants]` in production
- **Scale:** `[X objects / users]` under active facet management (identity + device planes)
- **Time-in-production:** live since `[Month Year]`, i.e. `[Y months]` in production as of this paper's publication date

**Promotion criteria --- moving a Proposed row to Active.** Unlike the figures above, this is a real, statable policy, not an unknown fact: a Proposed row (for example, **Keycloak**) promotes to Active once it (1) passes the full adapter-conformance test suite defined in ADR-098 §D2 against a live Keycloak instance, and (2) has at least one reference deployment running the `keycloak_transport` write path in production for a sustained period. Until both conditions are met and documented --- with the same tenant count / scale / time-in-production evidence template above --- the row stays Proposed, no matter how complete the profile and transport code are.
:::

The open-source path is real: **Keycloak + generic LDAP** give a customer a fully open IdP storage layer under an Apache-2.0 substrate --- no commercial IdP required. The remaining cloud/multi-plane targets (AWS, GCP, VMware) have their facet maps published; their write-back transports are staged because they are multi-plane and SDK-bound.

## Axis 2 --- Capability packs (mix and match)

| Capability | What it does | Depends on | Status |
|----------------|----------------|----------------|----------------|
| Facet stamping | Write the 10 named facets onto identity objects | any one Axis-1 target | Active (Entra) / Proposed (others) |
| Drift detection (DRIFT-IDENTITY) | Validate facet *values* vs codebook, independent of where stored | any profile | Active |
| Device plane | Stamp facets onto devices (Arc / Intune) | Entra/Arc | Active |
| AI-system governance | Govern AI systems as identity subjects (M-25-21) | OrgPath + ATO registry | Proposed (FMP_196 / ADR-112) |
| Non-employee / **partner** branch | Contractor / vendor / sponsored-external lifecycle + risk | SailPoint NERM (optional) | Reserved (ADR-059) |
| Zero Trust enforcement | Facet predicate → native policy group | a profile's read side + enforcement vendor | Proposed (ADR-098 §D5) |
| Active Governance Directory | In-path LDAP read projection of the substrate | OrgPath | Proposed (ADR-100) |

![Three worked stacks --- OrgPath composability in practice](../images/whitepapers/orgpath-composability-matrix-diagram-02-three-worked-stacks.png){#fig-orgpath-composability-matrix-diagram-02-three-worked-stacks width="100%" fig-alt="Three worked stacks — OrgPath composability in practice"}

## Three worked stacks

**Open-source-first.** Keycloak (identity) + generic LDAP (legacy directories) + drift detection + Active Governance Directory. No commercial IdP, no SailPoint; Apache-2.0 top to bottom. Governs employees and devices; partner governance off.

**Microsoft-native + partners.** Entra (identity + device, active) + SailPoint NERM (non-employee/partner branch) + AI-system governance + drift. The most mature stack today; the only one with an active write path.

**Multi-cloud enterprise.** Entra + Okta + PingOne (identity) with AWS/GCP workload tagging and VMware NSX enforcement as those Stage-2 transports land --- OrgPath as the single policy subject across the whole estate.

## How to read the maturity honestly

A buyer should weight the matrix by status, not by row count. **Today's demonstrable, write-capable path is Microsoft/Entra** plus read-only assessment. The Okta/LDAP/Keycloak/Auth0/PingOne transports exist and are unit-tested but await live-tenant conformance before promotion to `active`; AWS/GCP/VMware are facet-mapped but transport-deferred. The architecture is genuinely composable; the *deployed* surface is narrower than the *designed* surface, and this paper labels every cell so the difference is never hidden.

## Companion series

- OrgPath narrative --- the series-length telling of the substrate this matrix decomposes.
- OrgPath for All Clouds --- the multi-cloud binding-profile companion; the narrative form of the ADR-098 content that is this paper's canon source.

## References

- ADR-098 --- OrgPath Vendor-Neutral Binding Profiles
- ADR-099 --- IdP Binding-Profile Expansion (PingOne, Keycloak, Auth0)
- ADR-113 --- OrgPath IdP Transport Activation (Stage 1)
- ADR-059 --- SailPoint Adapter Family
- ADR-085 --- Universal-Enterprise Positioning
