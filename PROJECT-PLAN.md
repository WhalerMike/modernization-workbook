# Modernization Project Plan

## 1. Overview

This plan describes how the modernization project will move from the current state (implicit governance encoded in legacy directories and fragmented stores) to a target state defined by a single authoritative origin for structure and claims, attribute-driven constructs, explicit drift detection, and controlled, evidence-producing change.

It follows the approach in the Project Charter: Assess → Define target → Plan waves → Execute under control → Validate and sustain.

The plan is organized by phases. Each phase has objectives, key activities, deliverables, entry/exit criteria, and notes on risks or dependencies. Domain workstreams (identity, policy, services/addressing, compute/device, access plane) run inside the later phases and can be sequenced or parallelized according to organizational priorities.

## 2. Guiding Constraints

- Changes originate from a designated authoritative source and close with provenance.
- Elevated privilege is time-bounded and scoped (just-in-time).
- Derived copies and subordinate systems remain explicitly non-authoritative.
- Drift between intended and observed state is classified and visible.
- No full rip-and-replace is required to make progress.

## 3. Phases

### Phase 0 — Charter and Alignment
**Objective:** Confirm scope, stakeholders, success criteria, and decision rights.

**Key activities**
- Review and finalize the Project Charter.
- Identify sponsor, project lead, and domain leads.
- Confirm in-scope domains and any organizational constraints (data residency, existing tools, timeline pressure).
- Agree on the evidence and provenance expectations that will apply to all later changes.

**Deliverables**
- Signed or accepted Project Charter.
- Stakeholder and role list.
- Initial risk register.

**Supporting material**
- [Why Modernization Is Hard](docs/client-server-to-hybrid-cloud/00-prologue-why-modernization-is-hard.md) — leadership framing of the problem
- [Principles](docs/PRINCIPLES.md) — the rules the charter commits to
- [Chapter 00 — The Problem Nobody Talks About](docs/client-server-to-hybrid-cloud/00-the-problem.md)
- [Chapter 10 — Leadership Takeaway](docs/client-server-to-hybrid-cloud/10-leadership-takeaway.md)

**Exit criteria**
- Leadership can state the problem, the target outcome, and how success will be measured.

### Phase 1 — Current-State Assessment
**Objective:** Make the existing governance model and hidden dependencies explicit.

**Key activities**
- Inventory major directory and identity dependencies (organizational structure, delegation, policy, service accounts, certificates, naming, addressing).
- Document how structure and authority are currently encoded (hierarchical containers, group membership, policy inheritance, etc.).
- Identify sources of truth (or competing sources) for human and non-human identity lifecycle events.
- Capture known fragmentation points and reconciliation pain.
- Produce a dependency and risk map that highlights migration hazards.

**Deliverables**
- Current-state assessment report.
- Dependency and hidden-surface inventory.
- List of candidate authoritative origins for key object classes.
- Initial normalization recommendations (what must be cleaned or rationalized before migration).

**Supporting material**
- [Read-Only AD Assessment Guide](docs/operational-guides/read-only-ad-assessment.md) — discovery without changing the directory
- [Chapter 02 — Analyzing the Client/Server Estate](docs/client-server-to-hybrid-cloud/02-analyzing-the-estate.md)
- [Identity and Directory Transformation Inventory](docs/architecture/identity-directory-transformation-inventory.md)
- [GPO-to-Cloud Governance Gaps](docs/architecture/gpo-to-cloud-governance-gaps.md)
- [Old AD vs New Entra ID](docs/learning/old-ad-vs-new-entra-reference.md) — reference for the assessment team

**Exit criteria**
- The team can describe, in concrete terms, what the directory currently “knows” about the organization and what would break if that knowledge disappeared.

### Phase 2 — Target Architecture Definition
**Objective:** Define the attribute-oriented structure and control-plane model that will replace implicit hierarchy.

**Key activities**
- Specify the attributes that will represent organizational position, lifecycle, and security context.
- Define how dynamic membership and scoped policy will be driven from those attributes.
- Describe the layered model (Identity → Structure → Policy → Governance) and the role of each layer.
- Identify control planes (identity, addressing, policy, telemetry, etc.) and their boundaries.
- State the rules for authoritative origin versus derived/subordinate copies.
- Document the drift classes that will be monitored (schema, semantic, provenance, authorization, identity, and contention on the authoritative source).

**Deliverables**
- Target architecture description (conceptual, not implementation-specific).
- Attribute model and mapping guidance from current structures.
- Control-plane diagram or narrative.
- Drift taxonomy and detection approach outline.
- Provenance and evidence expectations for changes.

**Supporting material**
- [Single Source of Truth](docs/architecture/single-source-of-truth.md)
- [From Attributes to Access (dynamic groups)](docs/hr-driven-iam/08-from-attributes-to-access.md)
- [Delegation Matrix](docs/architecture/delegation-matrix.md)
- [Change Control and Provenance](docs/architecture/change-control-and-provenance.md)
- [Architecture Series](docs/architecture/architecture-series/README.md)

**Exit criteria**
- Domain leads can explain how a given organizational fact will be expressed, how policy will attach to it, and how drift will be detected, without relying on internal decision-record numbers.

### Phase 3 — Domain Playbooks and Wave Planning
**Objective:** Produce executable playbooks for each in-scope domain and sequence them into waves.

**Key activities**
- For each domain (identity structure, policy, services/addressing, compute/device, access plane):
  - Define objectives and success measures.
  - Map current constructs to target constructs.
  - Identify bridging or coexistence patterns.
  - Specify entry criteria, exit criteria, and rollback conditions.
  - Define the evidence that must be produced for each change.
- Sequence the domains into waves that respect dependencies (structure before policy, identity before compute, etc.).
- Identify any organization-specific constraints that affect sequencing.

**Deliverables**
- Domain playbooks (one per major domain).
- Wave plan with sequencing, gates, and rollback triggers.
- Evidence checklist applicable to every wave.

**Supporting material**
- [Chapter 03 — Analysis → Plan → Delivery](docs/client-server-to-hybrid-cloud/03-analysis-plan-delivery.md)
- [Chapters 04–08 — identity, policy, services, compute and access playbooks](docs/client-server-to-hybrid-cloud/04-identity-transformation.md)
- [GPO Sunset Program](docs/operational-guides/gpo-sunset-program.md) and [GPO Parse and Crosswalk](docs/operational-guides/gpo-modernization-parse-crosswalk.md)
- [Conditional Access Policy Library](docs/operational-guides/conditional-access-policy-library.md)
- [Intune + Azure Arc Modernization](docs/operational-guides/intune-arc-modernization/README.md)
- [DNS Modernization Guide](docs/operational-guides/dns-modernization.md) and [PKI Modernization Guide](docs/operational-guides/pki-modernization.md)
- [Test Plans](docs/program/test-plans.md) — evidence checklist inputs

**Exit criteria**
- At least the first wave has a complete playbook that a team could execute with existing tools and processes.

### Phase 4 — Pilot / First Wave Execution
**Objective:** Execute a controlled first wave and validate the change-control and evidence pattern.

**Key activities**
- Select a limited, representative scope for the first wave (recommended: identity structure and dynamic membership for a subset of the organization).
- Originate the changes from the designated authoritative source.
- Execute under least-privilege / just-in-time elevation.
- Close each change with provenance and collect the required evidence.
- Detect and classify any drift that appears during or after the wave.
- Conduct a lessons-learned review.

**Deliverables**
- Executed first-wave changes with provenance records.
- Evidence package.
- Drift findings (if any) and remediation notes.
- Updated playbooks and wave plan based on lessons learned.

**Supporting material**
- [Chapter 09 — Migration Roadmap: Phased Plan, Gates, Rollback](docs/client-server-to-hybrid-cloud/09-migration-roadmap.md)
- [PIM Self-Request with Approval](docs/operational-guides/pim-self-request-approval.md) — just-in-time elevation for wave execution
- [HR-Driven Identity](docs/hr-driven-iam/index.md) — originating changes from the authoritative source
- [End User Training Guide](docs/operational-guides/end-user-training.md)

**Exit criteria**
- The organization has demonstrated that a change can originate from the authoritative source, execute under controlled privilege, close with provenance, and be validated against the intended state.

### Phase 5 — Progressive Rollout and Steady-State Governance
**Objective:** Extend the pattern across remaining domains and establish ongoing drift detection and evidence practices.

**Key activities**
- Execute subsequent waves according to the updated plan.
- Expand the attribute model and dynamic constructs as additional domains are brought under the target architecture.
- Stand up or refine continuous drift detection against the authoritative origin.
- Transition from project-mode change control to steady-state operational governance.
- Capture residual risks and any items that remain outside the modernization scope.

**Deliverables**
- Completed domain transformations (or documented residual scope).
- Operational drift detection and evidence process.
- Final project report with outcomes against success criteria.
- Recommendations for ongoing ownership.

**Supporting material**
- [Continuous Monitoring Strategy](docs/architecture/continuous-monitoring-strategy.md)
- [Gap Closure Register](docs/architecture/gap-closure-register.md)
- [Training Program](docs/program/training.md) and [Education Program](docs/program/education.md)

**Exit criteria**
- Success criteria from the charter are met or explicitly deferred with rationale.
- Ownership for the authoritative origin and drift detection has transferred to steady-state operations.

## 4. Domain Workstreams (Summary)

| Domain | Primary Focus | Typical Dependencies | Suggested Position | Detailed project |
|--------|---------------|----------------------|--------------------|---|
| Identity structure | Attribute model, dynamic membership, lifecycle origin | Assessment complete | Early (Wave 1) | [Identity Lifecycle & Provisioning](docs/projects/identity-lifecycle-charter.md) |
| Policy | Mapping of existing policy to attribute-driven scope | Identity structure | After identity | Playbooks: [GPO Sunset Program](docs/operational-guides/gpo-sunset-program.md), [Conditional Access Policy Library](docs/operational-guides/conditional-access-policy-library.md) |
| Services / Addressing | Naming, IP management, related dependencies | Assessment; may bridge | Parallel or mid | [Network & Access Modernization](docs/projects/network-access-charter.md) |
| Compute / Device | Device identity and management alignment | Identity structure | Mid to late | [Endpoint & Device Modernization](docs/projects/endpoint-device-charter.md) |
| Access plane | Token-based / application-aware access patterns | Identity and policy | Later | [Network & Access Modernization](docs/projects/network-access-charter.md) |

Further detailed projects that run alongside these workstreams: [Privileged Access & Administrative Identity](docs/projects/privileged-access-charter.md), [Data Platform Identity Transformation](docs/projects/data-platform-charter.md), [Continuous Monitoring & Evidence Fabric](docs/projects/continuous-monitoring-charter.md), and [Supply Chain & Software Bill of Materials](docs/projects/supply-chain-charter.md). Each has a charter and a plan; see [Complementary Modernization Projects](docs/projects/README.md).

## 5. Governance and Decision Rights

- Sponsor approves scope changes, major sequencing shifts, and acceptance of residual risk.
- Project lead owns the overall plan, wave sequencing, and cross-domain dependencies.
- Domain leads own playbook content, execution readiness, and domain-specific evidence.
- All material changes to the target architecture or authoritative-origin rules require project-lead and sponsor concurrence.

## 6. Risks and Mitigations (Selected)

| Risk | Mitigation |
|------|------------|
| Incomplete discovery of hidden dependencies | Structured assessment checklist; pilot wave designed to surface unknowns early |
| Competing sources of truth persist | Explicit designation of authoritative origin per object class; drift class for contention |
| Organizational resistance to making authority explicit | Early stakeholder alignment; pilot that demonstrates controlled rather than disruptive change |
| Tooling leads the design | Target architecture and change-control pattern defined before tool selection or configuration |
| Physics / residency limits on centralization | Logical centralization of truth; physical distribution of subordinate copies only |

## 7. Success Measures (Project Level)

- Current-state assessment completed and accepted.
- Target architecture documented and understood by domain leads.
- First wave executed with full provenance and evidence.
- Drift detection approach operational for the domains in scope.
- Residual risks documented and ownership assigned.
- Leadership can describe the modernization path and outcomes without reference to internal technical decision records.

## 8. Immediate Next Actions

1. Review and accept this plan against the Project Charter.
2. Confirm Phase 0 stakeholders and decision rights.
3. Scope the Phase 1 assessment (data sources, access, timeline).
4. Identify the candidate authoritative origin(s) for human identity lifecycle events.
5. Draft the outline of the target attribute model.

---

*This plan is a project artifact. It incorporates the modernization concepts of authoritative origin, attribute-driven structure, explicit drift, and controlled evidence-producing change. It contains no internal architectural decision record identifiers or substrate-specific document numbers.*
