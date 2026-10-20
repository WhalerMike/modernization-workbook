# Intune + Azure Arc — Manual Path

End-to-end modernization runbook without a central governance control plane.

## Purpose

This path is for organizations executing modernization without a real-time governance control plane. Every step is self-contained and owned by the operator under local change control. The manual path is not an ungoverned path: because no control plane validates each decision in real time, the operator owns the change record, the approval, and the rollback.

## Phases

| Phase | Focus | Why |
|-------|-------|-----|
| 1 — Observe | Read-only baseline (NTLM, SPNs, SQL posture, Intune state) | You cannot safely restrict what you have not measured |
| 2 — Onboard | Arc onboarding and Intune enrollment | Attach the management planes |
| 3 — Harden | Restrict legacy protocols, clean SPNs, enforce Conditional Access | Reduce attack surface |
| 4 — Verify | Confirm posture and residual risk | Evidence of completion |

## Operating rules

- Document accepted risks in a change record before starting.
- Treat the first run of any state-changing step as a dry run.
- If governance will be added later, nothing in this path prevents a retrofit.
- Do not re-image or re-enroll devices solely to add governance later.

## Bottom line

The manual path reaches the same technical end state as a governed path. The difference is ownership and evidence: the operator holds the change record instead of a control plane.

---

*Cleaned extraction for project use.*
