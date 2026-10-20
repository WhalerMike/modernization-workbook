# Intune + Azure Arc — Retrofit Path

Add governance to an estate already modernized under the manual path.

## Purpose

Servers are Arc-onboarded, endpoints are Intune-enrolled, legacy protocols are restricted, and Conditional Access is enforced. Governance is now required. The retrofit adopts the existing estate into the governed path without re-doing the Intune or Arc work.

## Why this works

The manual path already produced the artifacts the control plane needs: Arc tags, enrollment state, Conditional Access policies, and audit records. The retrofit reads those artifacts, derives governance attributes from existing structure, and attaches the observation and approval loop. No re-imaging, re-onboarding, or re-enrollment is required.

## Steps

1. Inventory what the manual path already produced (tags, enrollment status, policy assignments, audit files).
2. Derive governance attributes from existing tags, OUs, or groups.
3. Stamp the derived attributes onto the objects that already exist.
4. Register the current state as the desired state.
5. Enable continuous observation and drift detection.
6. Route future changes through the approval process.

## Bottom line

Adding governance after the fact is not a migration. It is turning on the observation and approval seam that the manual path left available.

---

*Cleaned extraction for project use.*
