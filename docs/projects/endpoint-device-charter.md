# Endpoint & Device Modernization — Project Charter

## 1. Purpose

Move the endpoint estate from Group Policy Object–driven, domain-joined management to a governed, attribute-driven device lifecycle that produces continuous evidence and reduces NTLM and standing-privilege risk.

## 2. Problem Statement

Endpoints are still largely governed by Group Policy Objects and domain join. Hybrid join has been adopted for connectivity without corresponding governance. NTLM remains a silent fallback. Conditional Access is deployed unevenly. The result is:

- Devices that cannot be inventoried or governed once domain controllers are no longer in the path.
- Overlapping Group Policy Object and device-management settings that produce unpredictable results.
- Premature NTLM restriction that breaks legacy applications, or delayed restriction that leaves the estate exposed.
- No continuous evidence of device posture or compliance.

## 3. Objectives

1. Observe before changing: inventory NTLM usage, service principal names, device-management posture, and Group Policy Object overlap.
2. Onboard devices to hybrid or cloud-native management under an attribute-driven model.
3. Sunset Group Policy Objects through a regenerate-not-copy approach, retiring each setting once device management owns it.
4. Deploy Conditional Access in report-only, then enforce, with break-glass exclusions.
5. Restrict and ultimately eliminate NTLM after audit confirms legacy dependencies are resolved.
6. Produce continuous evidence of device posture and compliance.

## 4. Scope

### In Scope
- Device identity and management alignment (hybrid join and cloud-native paths).
- Group Policy Object sunset and co-management transition.
- Conditional Access baseline (report-only to enforce).
- NTLM audit and restriction roadmap.
- Service principal name repair and certificate-based authentication where applicable.
- Provenance and evidence for device lifecycle changes.

### Out of Scope (Initial Phase)
- Full domain-unjoin of the existing fleet (treated as a separately sequenced decision).
- Application packaging and software distribution redesign.
- Non-Windows endpoint platforms beyond inventory.

## 5. Guiding Principles

- **Observe before you change anything.** Audit NTLM, service principal names, and Group Policy Object overlap before restriction or sunset.
- **Regenerate, not copy.** Replacement policies are authored against the target model, not copied from Group Policy Objects.
- **Last-writer-wins is a hazard.** Overlapping Group Policy Object and device-management settings must be documented and retired.
- **Report-only first.** Conditional Access is deployed in report-only before enforcement.
- **Break-glass is governed.** Break-glass accounts are excluded and documented, not unwritten exceptions.
- **Domain-unjoin is separate.** Onboarding does not imply domain-unjoin.

## 6. Success Criteria

- Observation phase complete: NTLM usage, service principal names, and Group Policy Object overlap inventoried.
- Pilot population onboarded to governed device management with attribute-driven scoping.
- At least one Group Policy Object setting class regenerated and retired.
- Conditional Access baseline in report-only for the pilot; enforcement plan defined.
- NTLM restriction plan documented with legacy dependencies identified.
- Evidence of device posture available for the pilot.

## 7. High-Level Approach

1. **Observe** — Inventory NTLM, service principal names, Group Policy Object overlap, and current device-management posture.
2. **Onboard** — Bring a pilot population under hybrid or cloud-native management with attributes.
3. **Harden** — Regenerate selected Group Policy Object settings, deploy Conditional Access in report-only, and begin NTLM restriction where safe.
4. **Watch** — Emit continuous evidence and detect drift between intended and observed device state.

## 8. Risks and Assumptions

### Key Risks
- Premature NTLM restriction breaks legacy applications.
- Overlapping Group Policy Object and device-management settings produce unpredictable results.
- Service principal secrets embedded in Group Policy Object startup scripts.
- Incomplete attribute population causes policy bypass.

### Assumptions
- A device management platform is available.
- Stakeholders accept that domain-unjoin is a later, separate decision.
- Break-glass accounts can be identified and excluded.

## 9. Governance and Ownership

- Project sponsor: (to be named)
- Project lead: (to be named)
- Domain leads: Device Identity, Group Policy Object Sunset, Conditional Access, NTLM

## 10. Next Steps

- Inventory NTLM usage and service principal names.
- Map Group Policy Object settings that overlap with device management.
- Define the pilot population and attribute requirements.
- Document break-glass accounts.
- Establish evidence expectations for device posture.

---

*This charter describes an endpoint and device modernization project. It deliberately omits internal architectural decision records and document identifiers.*
