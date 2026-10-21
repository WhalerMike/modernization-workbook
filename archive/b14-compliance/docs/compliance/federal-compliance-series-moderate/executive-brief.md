# Federal Compliance Series - Moderate — Executive Brief

**Two-page decision brief for authorizing officials, program executives, and budget decision-makers**

## The thesis

The agency’s federal compliance debt is not a resource shortage — it is an architectural pattern mismatch. The estate was built for a world where compute, identity, and communication sat inside a perimeter; the controls now required under Executive Order 14028, OMB M-22-09, TIC 3.0, and the FedRAMP 20x Consolidated Rules cannot be satisfied by a perimeter architecture at any budget. The implementations in this series are therefore structural prerequisites for an agency Moderate authorization whose evidence survives the FedRAMP 20x transition, not optional modernization projects. A small number of truth-plane mechanisms — authoritative naming and addressing, cryptographic identity, and a unified evidence contract — are load-bearing: everything else can be re-platformed; these can only be depended on.

## The three deadlines that bind

| Date | What happens | Why it binds |
|------|--------------|--------------|
| Aug 31, 2026 | FedRAMP 20x Class B + C opens | The pipeline inherited Moderate providers enter. The substrate must exist to structure inherited evidence cleanly. |
| Dec 7, 2026 | BOD 26-04 VDR/VER in force | Software bill of materials + vendor disclosure required; risk-based remediation timelines live. |
| Jan 1, 2027 | CR26 mandatory | All continuous-monitoring evidence must be machine-readable Key Security Indicator format. |

## Decisions required

1. Endorse (or redirect) the architecture doctrine. Owner: Office of Information Security + CIO. By: before any procurement or build commitment.
2. Accept the automation platform boundary treatment, or name a Moderate-authorized alternative. Owner: Authorizing Official / Information System Security Officer. By: before the automation volumes build.
3. Fund the load-bearing substrate first — naming and addressing, then the transport overlay and boundary enforcement. Owner: CIO / budget. By: in time to structure evidence for the August 31, 2026 window.
4. Direct the internal-rules to CR26 reconciliation and schedule the independent security control assessment. Owner: Office of Information Security continuous-monitoring lead. By: before independent assessment; no later than August 31, 2026.
5. Decide the multi-cloud breadth. One volume spans multiple cloud providers — the one deliberate exception to the government-cloud / Microsoft scope. Owner: CIO. By: before committing that volume beyond the primary cloud.

## Cost of inaction

If the substrate is not in place before the August 31, 2026 window and the January 1, 2027 mandate:
- Inherited authorizations stop reconciling. Without the naming, identity, and evidence planes, the agency cannot assemble a continuous, machine-readable Key Security Indicator package.
- The same findings recur every assessment cycle. Open component-inventory, DNSSEC, and transport-encryption findings become standing items that manual evidence assembly cannot clear under the new rules.
- Spend does not fix it. The perimeter architecture cannot satisfy the Zero Trust controls regardless of tooling budget — the mismatch is structural.

## Reading paths by role

- **Authorizing Official / budget:** this brief, then the product inventory questionnaire and the residual compliance risk section.
- **Information System Security Officer / assessor:** the series control crosswalk and the claim-to-evidence-to-test matrix, then the authorization package and continuous-monitoring volume.
- **Engineer:** the volume overview books, then the implementation volume and the deployable kits.

## Honest status

Self-assessed against the series’ internal Key Security Indicator decomposition. Coverage is partial. The package is pending independent security control assessment. Nothing here is an authorization result.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
