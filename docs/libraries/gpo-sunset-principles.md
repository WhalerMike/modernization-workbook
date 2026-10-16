# Group Policy Object Sunset — Methodology Principles

**Short extract from the GPO Sunset Program / Intune Policy Templates**

## Purpose

This page captures the methodology for retiring Group Policy Objects on an existing fleet and replacing them with device-management policies. It is distinct from net-new device onboarding and from the broader “regenerate, not copy” philosophy.

## Three related but distinct programs

- **Net-new device onboarding** — governance at procurement time for devices that have never been domain-joined.
- **Existing-fleet Group Policy Object sunset** *(this page)* — replacement of Group Policy Objects on currently deployed endpoints, ending in formal Group Policy Object retirement.
- **Regenerate, not copy** — the philosophy governing how replacement policies are authored. Not a separate program.

## Seven-phase shape (illustrative)

1. Inventory and assessment of existing Group Policy Objects.
2. Classification of each Group Policy Object (retire, regenerate, or retain temporarily).
3. Author replacement policies under the regenerate-not-copy philosophy.
4. Pilot on a controlled cohort.
5. Expand with continuous validation.
6. Coexistence period with last-writer-wins monitoring.
7. Formal retirement of the Group Policy Object once the device-management policy owns the setting.

## Co-management decision matrix

For organizations running a configuration manager alongside device management, co-management enables a phased workload transition. The co-management workload slider determines which authority controls each policy area:

| Workload | Phase 1 (Group Policy + configuration manager) | Phase 2 (co-managed) | Phase 3 (device management only) |
|----------|------------------------------------------------|----------------------|-----------------------------------|
| Compliance policies | Configuration manager | Pilot device management | Device management |
| Device configuration | Configuration manager | Pilot device management | Device management |
| Endpoint security | Configuration manager | Pilot device management | Device management |
| Windows updates | Configuration manager | Pilot device management | Device management |

## Policy assignment strategy

All policies are assigned to dynamic groups based on organizational attributes. This replaces organizational-unit-linked Group Policy Object scoping with attribute-driven, cloud-native targeting:

- **Include groups** — dynamic device groups matching the policy’s intended tier, environment, and role.
- **Exclude groups** — break-glass exclusion groups for emergency override; staging groups during phased rollout.
- **Filters** — assignment filters provide an additional layer of targeting evaluated after group membership.

## Assignment precedence

- **Compliance policies:** Most restrictive wins. If a device is in scope of multiple compliance policies, the most restrictive setting value is enforced.
- **Configuration profiles:** Last write wins. If two profiles configure the same setting, the most recently processed profile’s value takes effect. Conflicts are reported.
- **Endpoint security:** Endpoint security policies take precedence over configuration profiles for the same setting.

## Regenerate, not copy

The mapping from Group Policy Object settings to device-management equivalents is a **semantic translation reference**, not a literal 1:1 copy prescription. Engineers use it to answer “what is the closest equivalent for this setting?” Policy authoring decisions follow the regenerate-not-copy philosophy: write the policy for the modern control plane rather than translating every legacy setting verbatim.

## Conflict note

Where device management and a Group Policy Object target the same setting, last-writer-wins produces unpredictable results. Document overlapping settings before enabling device-management policy in production, and retire the Group Policy Object copy once device management owns the setting.

## Full library

The complete policy template library, settings tables, JSON export templates, and 50-row semantic translation reference remain in the source repository. This page captures only the methodology required for program-level understanding.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
