# Alternative Collaboration Path — Google Workspace

> **Who this is for:** Teams evaluating productivity suite options while preserving an authoritative identity origin and no-rip-and-replace discipline.

---

## Purpose

This note documents a real federal example of moving email and collaboration workloads from a Microsoft suite to Google Workspace. It is **not** an alternative identity path. The identity plane (source of truth for attributes, organizational structure, policy scope, and access decisions) remains independent and can continue to live in Entra ID or another governed directory.

The pattern is consistent with the workbook’s principles: authoritative origin, identity as root namespace, no rip-and-replace, and governance that transcends any single vendor.

## Framing

| Layer | Typical Role | Can Be Separated? |
|-------|--------------|-------------------|
| **Identity / governance** | Authoritative origin for attributes, dynamic groups, policy scope, drift detection | Yes — remains the root |
| **Collaboration / email** | Day-to-day productivity (mail, docs, chat, meetings, AI assistants) | Yes — can be federated or provisioned from the identity plane |
| **Access control** | Conditional access, app access, Zero Trust signals | Usually stays with the identity platform |

Google Workspace brings its own directory (Cloud Identity). In practice this is almost always a **derived** or **federated** surface rather than a second source of truth.

## Case Summary: Department of Transportation (2025–2026)

DOT became the first cabinet-level agency to move its collaboration suite from Microsoft to Google Workspace with Gemini.

| Aspect | Detail |
|--------|--------|
| **Scale** | ~50,000+ employees (DOT proper + FAA and other modes) |
| **Contract** | Five-year agreement, ceiling up to $89 million (via Carahsoft, GSA OneGov) |
| **Tools** | Gmail, Docs/Sheets/Slides, Drive, Meet, Chat; Gemini and NotebookLM |
| **Timeline** | Foundational environment and initial users in ~22–30 days; broader rollout through 2026 |
| **Security** | Google Workspace and Gemini are FedRAMP High authorized; Assured Controls Plus used |
| **Drivers** | OneGov pricing (temporary ~71% discount), AI capabilities, modernization, reported cost reduction |
| **Coexistence** | Period of parallel operation with Microsoft tools during transition |

Key observations from the public record:

- The move was framed as a collaboration-suite modernization, not a full identity platform replacement.
- Speed of initial deployment was high once the contract was in place.
- AI features (Gemini) were cited as a meaningful differentiator beyond pure cost.
- The agency has described a broader multi-cloud posture rather than a single-vendor commitment.

## Technical Patterns (Identity Boundary)

Two common, governable approaches keep the workbook’s authoritative-origin model intact:

1. **Entra ID as source of truth**
   - Users and groups are provisioned from Entra ID into Google Workspace / Cloud Identity.
   - SSO is configured so Google apps trust Entra (or the reverse for specific scenarios).
   - Attribute changes, dynamic group membership, and policy scope continue to originate from the identity plane.
   - Drift between intended and observed state remains detectable in the identity system.

2. **Federated coexistence**
   - Limited set of attributes and groups are synchronized in one direction.
   - Conditional access and high-assurance signals stay with the identity platform.
   - Google Workspace is treated as a workload that consumes identity, not a second directory of record.

Both patterns allow the collaboration plane to change without forcing a rip-and-replace of the identity and governance model.

## Alignment with Workbook Principles

- **Authoritative origin**: Identity attributes and organizational structure retain a single origin. Google Workspace holds derived or synchronized objects.
- **No rip-and-replace**: Coexistence and phased cutover are the observed pattern. Core identity, addressing, and policy controls are preserved.
- **Identity as root namespace**: Organizational structure, policy scope, and access decisions continue to derive from the identity plane.
- **Drift is explicit**: Synchronization or federation failures become observable drift between the authoritative source and the collaboration directory.
- **Evidence-driven change**: Migration waves, provenance of attribute flow, and validation of federation or provisioning remain required.

## Considerations and Counter-Examples

- **Dominance**: Microsoft 365 remains the majority platform across federal agencies. Google Workspace has meaningful but smaller adoption (examples previously cited by Google include GSA, Department of Energy, and Air Force Research Laboratory).
- **Utilization risk**: The Army ran a large Google Workspace pilot and later sunsetted the accounts after low utilization, consolidating on Army 365 (Microsoft). Demand and change-management outcomes matter.
- **Identity surface**: Cloud Identity is not a drop-in replacement for a mature Entra ID deployment that already carries conditional access, Privileged Identity Management, application registrations, and Zero Trust signals.
- **Procurement and discount window**: OneGov pricing was a significant accelerator. Discount duration and subsequent pricing should be evaluated explicitly.
- **Data and compliance**: FedRAMP High authorization removes a major barrier, but data residency, client-side encryption options, retention/eDiscovery (Vault), and records requirements still require agency-specific validation.

## When This Path May Be Worth Evaluating

- The primary pain is in the collaboration and email experience (or cost), not in the identity governance model.
- AI features embedded in the productivity suite are a material requirement.
- The organization is already comfortable with, or actively pursuing, multi-cloud or multi-vendor patterns.
- Federation or provisioning from the existing identity plane can be governed and monitored for drift.
- Change management capacity exists for a coexistence period.

## When It Is Probably Not the Right Path

- The core modernization problem is directory hierarchy, attribute authority, dynamic groups, or policy scope — these remain identity-plane problems.
- High-assurance conditional access, privileged access workflows, or extensive application integrations are already deeply implemented on Entra ID and would be expensive to re-create.
- The organization lacks capacity for dual-directory governance during a transition.

## Suggested Next Steps for an Agency

1. Confirm whether the authoritative identity origin will remain Entra ID (or equivalent).
2. Inventory applications and workflows that depend on Microsoft 365 identity, mail, or files.
3. Evaluate federation vs. provisioning options and the drift-detection surface they create.
4. Validate FedRAMP High configuration requirements and any Assured Controls or data-region needs.
5. Model coexistence duration, training, and rollback triggers before any cutover wave.
6. Treat productivity-suite choice as separable from the identity and governance modernization program.

---

**Sources (public reporting, 2025–2026):**  
Department of Transportation announcements and interviews (Nextgov/FCW, MeriTalk, Google Public Sector), GSA OneGov materials, FedRAMP authorization statements for Google Workspace and Gemini, and Army sunset notice for its prior Google Workspace pilot.

*This note is a pattern reference only. It does not constitute a recommendation to adopt or reject any specific vendor. Execution decisions remain with the adopting organization.*
