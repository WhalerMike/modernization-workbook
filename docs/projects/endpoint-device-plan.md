# Endpoint & Device Modernization — Project Plan

## 1. Overview

Move from Group Policy Object–driven management to a governed device lifecycle. Follows: Observe → Onboard → Harden → Watch.

## 2. Phases

### Phase 0 — Charter and Alignment
Confirm scope, pilot population, and evidence expectations.

### Phase 1 — Observe
Inventory NTLM usage, service principal names, Group Policy Object overlap with device management, and current device-management posture.

### Phase 2 — Onboard
Bring the pilot population under hybrid or cloud-native management with organizational attributes populated.

### Phase 3 — Harden
Regenerate selected Group Policy Object settings into device-management policies and retire the Group Policy Object copies. Deploy Conditional Access in report-only. Begin NTLM restriction only where audit confirms safety.

### Phase 4 — Watch
Emit continuous device-posture evidence. Detect drift between intended and observed state. Plan enforcement promotion for Conditional Access.

## 3. Success Measures
- Observation inventory complete.
- Pilot onboarded with attributes.
- At least one Group Policy Object setting class regenerated and retired.
- Conditional Access in report-only; enforcement plan defined.
- NTLM restriction plan documented.
- Device-posture evidence available.

## 4. Immediate Next Actions
1. Inventory NTLM and service principal names.
2. Map overlapping Group Policy Object settings.
3. Define pilot population and attribute requirements.
4. Document break-glass accounts.

---

*Project artifact. No internal architectural decision record identifiers.*
