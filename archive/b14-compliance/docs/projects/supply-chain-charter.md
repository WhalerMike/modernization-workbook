# Supply Chain & Software Bill of Materials — Project Charter

## 1. Purpose

Establish a governed software supply chain: produce and consume software bills of materials, apply risk-based remediation timelines, and track vendor authorization status so that third-party components do not become ungoverned residual risk.

## 2. Problem Statement

Software components enter the estate through procurement, open source, and cloud services with uneven visibility. Vulnerability disclosure is manual. Remediation timelines are best-effort. Vendor authorization status is not continuously tracked. The result is:

- No reliable inventory of software components and their known vulnerabilities.
- Remediation that misses regulatory timelines.
- Cloud services adopted without a recorded authorization status.
- Supply-chain findings that recur because evidence is assembled after the fact.

## 3. Objectives

1. Establish a software bill of materials pipeline for in-scope systems and services.
2. Consume vulnerability disclosures and apply risk-based remediation timelines.
3. Track vendor and cloud-service authorization status; gate new software-as-a-service on a recorded authorization.
4. Emit evidence of component inventory, vulnerability status, and remediation closure.
5. Define ownership for supply-chain risk acceptance.

## 4. Scope

### In Scope
- Software bill of materials production or consumption for pilot systems.
- Vulnerability disclosure intake and risk-based remediation tracking.
- Vendor and cloud-service authorization status inventory.
- Gating of new software-as-a-service on recorded authorization.
- Evidence of component inventory and remediation closure.

### Out of Scope (Initial Phase)
- Full software composition analysis for every application.
- Hardware bill of materials.
- Replacement of existing procurement systems.

## 5. Guiding Principles

- **Inventory before you remediate.** You cannot prioritize what you have not named.
- **Risk-based timelines.** Remediation urgency follows exploitability and exposure, not a single calendar.
- **Authorization is a gate.** New software-as-a-service requires a recorded authorization status before provisioning.
- **Evidence is continuous.** Component and vulnerability status emit into the evidence stream.
- **Ownership is explicit.** Supply-chain risk acceptance has a named owner.

## 6. Success Criteria

- Software bill of materials available for at least one pilot system or service.
- Vulnerability disclosure intake operational; at least one risk-based remediation tracked to closure.
- Vendor and cloud-service authorization status inventoried for in-scope services.
- New software-as-a-service provisioning gated on recorded authorization for the pilot.
- Evidence of component inventory and remediation available.
- Supply-chain risk acceptance owner named.

## 7. High-Level Approach

1. **Inventory** — Produce or consume a software bill of materials for a pilot scope; inventory vendor authorization status.
2. **Intake** — Establish vulnerability disclosure intake and risk-based prioritization.
3. **Remediate** — Track at least one finding to closure under the defined timeline.
4. **Gate** — Require recorded authorization before new software-as-a-service provisioning.
5. **Evidence** — Emit component and remediation records.

## 8. Risks and Assumptions

### Key Risks
- Vendors do not produce software bills of materials in a consumable format.
- Remediation timelines conflict with operational constraints.
- Authorization status is stale or unavailable for key services.
- Ownership for risk acceptance is unclear.

### Assumptions
- At least one pilot system can produce or consume a software bill of materials.
- Stakeholders accept risk-based rather than uniform remediation timelines.

## 9. Governance and Ownership

- Project sponsor: (to be named)
- Project lead: (to be named)
- Domain leads: Software Bill of Materials, Vulnerability Remediation, Vendor Authorization, Evidence

## 10. Next Steps

- Identify the pilot system or service for software bill of materials.
- Inventory current vendor and cloud-service authorization status.
- Define risk-based remediation timelines and ownership.
- Establish the gating rule for new software-as-a-service.
- Document evidence expectations.

---

*This charter describes a supply chain and software bill of materials project. It deliberately omits internal architectural decision records and document identifiers.*
