# Chapter 09 — Migration Roadmap: Phased Plan, Gates, Rollback

**Seven phases, five parallel workstreams, named gates, deterministic rollback**

> **Dependency chain:** Inventory → Plan → Identity → Policy → Network services → Devices and servers → Access plane → **Retire AD DS** → **Prove steady state** — this chapter sequences the whole chain as a program.

## The program claim

![Diagram](../images/cshc/migration-roadmap.svg)


This chapter sequences Chapters 01–08 as an **illustrative fifty-two-week program** with five parallel workstreams (identity, policy, services, compute, access) and seven named gates. The week numbers are a sequencing model, not a commitment: large federal estates typically run multi-year. The roadmap lives in the authoritative repository, and every gate criterion can be evaluated mechanically.

Two properties define the program:

1. **Parallel, not sequential.** The five workstreams run together. Finishing one before starting the next doubles the duration and produces worse outcomes.
2. **Gated, not open-ended.** A phase starts only when the prior exit gate clears, and exits only when its own criteria are green.

Illustratively, a mid-size organization (5,000–50,000 users, 500–5,000 servers) with a clean forest and few Kerberos applications might finish in about fifty-two weeks. Scale changes the duration of each phase, not the structure.

## The seven phases

### Phase 0 — Pre-flight (weeks 1–4)

**Goal.** Produce the planning artifacts and stand up the platform host.

- **Entry:** executive sponsor and steward named; platform host provisioned; read-only AD service account delegated.
- **Work:** build the platform host (Chapter 01); run the assessment (Chapter 02); seed the repository; confirm least-privilege service principals for Entra ID, Intune and Arc.
- **Gate G0 — Ready to Plan:** platform host operational; assessment committed; no open priority-one findings.

### Phase 1 — Foundation (weeks 5–8)

**Goal.** Put identity primitives in place before anything else moves.

- **Identity:** enterprise-level dynamic groups; administrative units for Tier-1 and selected Tier-2 scopes.
- **Policy:** enterprise Conditional Access baseline: MFA for all users, legacy authentication blocked, break-glass exclusions.[^cs09-breakglass][^cs09-legacy]
- **Services:** IP address management covering the platform host and Tier-0 infrastructure.
- **Compute:** platform host and pilot servers connected through Arc.
- **Access:** single sign-on configured; FIDO2 registration open to Tier-0 administrators.

**Gate G1 — Foundation Complete:** enterprise groups and administrative units drift-clean; baseline Conditional Access enforced with no MFA-exempt users; Tier-0 covered by IPAM; break-glass accounts vaulted; HR-to-cloud provisioning operational for the foundation scope; zero drift across the foundation.

### Phase 2 — Pilot Division (weeks 9–16)

**Goal.** Prove the full pattern on one division, typically IT, which tolerates disruption best.

- **Identity:** organizational attributes populated; dynamic groups, administrative units and delegated roles live.
- **Policy:** division-scoped Conditional Access and Intune policies applied; first Group Policy Objects retired.
- **Services:** division DNS zones migrated, DHCP scopes re-homed, address space in IPAM.
- **Compute:** PCs moved by pattern (greenfield, reset-and-re-enroll, or hybrid for the rest); servers connected through Arc.
- **Access:** certificate-based authentication for smart-card holders; ZTNA for division applications.

**Gate G2 — Pilot Clean:** zero drift for a hold period (for example, fourteen consecutive days, illustrative); no AD-only users and no hybrid-joined PCs without a cut date; retrospective and runbook updates committed.

### Phase 3 — General Rollout (weeks 17–36)

**Goal.** Scale the pattern to every remaining division.

This is the longest phase. Illustratively, budget two to three weeks per division with two or three in parallel. Each division follows the same sub-pattern (plan, in-division pilot, full availability, drift-clean hold), reports green/yellow/red weekly, and draws on the shared authoritative source.

**Gate G3 — Rollout Complete:** every division passed its exit gate; every HR-listed employee has valid attributes; every user PC is cloud-joined and every server Arc-connected, or in a documented exception; zero cross-division drift.

### Phase 4 — Legacy Retirement (weeks 37–44)

**Goal.** Retire legacy infrastructure, each artifact through its own plan with steward approval. Typical order:

1. Group Policy Objects already migrated to Intune.
2. OU-based security groups superseded by dynamic groups.
3. AD-integrated DNS zones, one at a time.
4. AD-authorized DHCP.
5. AD CS smart-card logon Group Policy configuration.
6. Remaining AD-bound service principal names, application by application.

**Gate G4 — Legacy Quiet:**

- No active GPOs beyond the minimum Kerberos-island set, and no AD security groups in active use.
- Zero AD-integrated DNS zones.
- Certificate issuance moved, or scheduled to move, to a CA that does not depend on AD DS (Chapter 08); AD CS no longer used for smart-card logon.
- Every service principal name migrated, retired or islanded.
- AD authentication rate below an agreed threshold (for example, 5% of the peak-migration rate, illustrative).

### Phase 5 — AD DS Retirement (weeks 45–48)

**Goal.** Shut down AD DS. This is the shortest phase because Phases 0–4 did the work.

1. Freeze AD changes and run a final assessment and evidence packet.
2. Demote non-FSMO domain controllers.
3. Transfer FSMO roles to a survivor if a Kerberos island is retained.
4. Demote or isolate the remaining domain controllers.
5. Decommission the VMs, keep the forest in backup, and commit the retirement record.

**Gate G5 — AD Retired:** domain controllers decommissioned or retained as a documented Kerberos island; evidence packet in the repository and the SIEM; no live production dependency on AD authentication.

### Phase 6 — Steady State (week 49+)

**Goal.** Operate under governed control, indefinitely. Assessments, plans and drift checks run on cadence (Chapters 02–03), every delivery emits evidence, continuous monitoring feeds compliance reporting, and changes flow through reviewed pull requests. Periodic retrospectives confirm the authoritative source still matches organizational intent.

## The five parallel workstreams

| Workstream | Lead | Chapter | Key artifacts |
|------------|------|---------|---------------|
| **Identity** | Identity Architect | 04 | Dynamic groups, administrative units |
| **Policy** | Security Engineer | 05 | Intune configurations, Conditional Access, Machine Configuration |
| **Services** | Network Engineer | 06 | DNS, DHCP, IPAM adapters |
| **Compute** | Endpoint Admin + Server Engineer | 07 | Device enrollments, Arc projections |
| **Access** | Identity + Security jointly | 08 | ZTNA, CBA, PAM, MFA |

A weekly cross-workstream sync resequences work around dependencies; for example, a division's devices cannot move until its Conditional Access policies are in place.

## Gates, rollback and authority

Every gate criterion is evaluated from the repository and drift reports: "zero drift for fourteen days" is a filtered drift query, "valid attributes for every employee" is a query on the canonical user table, and "every PC cloud-joined" is a device-inventory query. The engine reports green, the steward concurs, and the pull request merges. A gate the engine cannot evaluate needs a better criterion.

Rollback triggers are thresholds, not judgment calls:

| Trigger | Scope | Action |
|---------|-------|--------|
| Drift above threshold for more than 24 hours | Phase | Halt; no new deliveries until clean |
| Conditional Access blocks more than a set share of legitimate sign-ins | Enterprise | Revert the policy; authorize a replacement |
| Drift detection stops reporting | Platform | Escalate; halt all phase work |
| Evidence packet fails signature validation | Delivery | Halt; investigate; restore last known-good |
| SLA breach on a priority-one finding | Any | Notify steward and sponsor |

Pilots exist to catch problems before they become rollbacks.

| Gate | Authority | Backup |
|------|-----------|--------|
| G0 — Ready to Plan | Steward | Executive Sponsor |
| G1 — Foundation Complete | Steward | — |
| G2 — Pilot Clean | Steward + Executive Sponsor | — |
| G3 — Rollout Complete | Executive Sponsor + Steering Committee | — |
| G4 — Legacy Quiet | Steward | Executive Sponsor |
| G5 — AD Retired | Executive Sponsor + CIO | — |
| Division-level exit | Division Lead + Steward | — |

The pull request that merges a gate decision records who made it.

## Common failure modes

1. **Half-finished identity.** The HR connector breaks mid-rollout and the program stalls. *Mitigation:* G1 requires HR provisioning before rollout.
2. **Unscoped Conditional Access.** A broad MFA policy blocks critical edge-case sign-ins. *Mitigation:* attribute scoping and pilot groups first.
3. **DNS left for "phase 2."** Identity moves, DNS stays AD-integrated, and AD can never retire. *Mitigation:* DNS, DHCP and IPAM move together.
4. **Permanent hybrid join.** *Mitigation:* treat hybrid join as a transition state and monitor time-in-state.
5. **Evidence-less migration.** Ad-hoc changes leave no provenance. *Mitigation:* plan-based delivery.

## Cadence and finish line

Weekly: Monday status, Tuesday dependency sync, Wednesday plan reviews merge, Thursday off-peak deliveries, Friday evidence and drift review. Monthly: gate reviews against the schedule. Two consecutive red weeks escalate to the sponsor.

At steady state, the program meeting sees zero drift findings, zero actions from the nightly plan run, signed evidence flowing to the SIEM and continuous monitoring, a refreshed authorization package, and only routine tickets. The program is never "done," but the modernization is: AD is gone or reduced to documented Kerberos islands with end-of-life dates.


## Key takeaways

1. Workstreams run in parallel, but gates follow the dependency chain.
2. Gate criteria are evaluated from data, not executive signature.
3. Week numbers are illustrative; large estates run multi-year.

## Authoritative references

- Microsoft Learn, [Block legacy authentication with Conditional Access - Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/conditional-access/policy-block-legacy-authentication)
- Microsoft Learn, [Manage emergency access admin accounts - Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/security-emergency-access)

---

**Previous:** [Chapter 08 — Access Plane](08-access-plane.md)  
**Next:** [Chapter 10 — Leadership Takeaway](10-leadership-takeaway.md)

[^cs09-legacy]: Microsoft Learn, *Block legacy authentication with Conditional Access - Microsoft Entra ID*. <https://learn.microsoft.com/en-us/entra/identity/conditional-access/policy-block-legacy-authentication>
[^cs09-breakglass]: Microsoft Learn, *Manage emergency access admin accounts - Microsoft Entra ID*. <https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/security-emergency-access>
