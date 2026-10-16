# HRIT to HR-Driven IAM — Execution Plan

Concretization of an HR-agnostic provisioning architecture against Federal HR 2.0.

## Purpose

Until mid-2026 the HR side of identity architecture had to be planned without knowing the government-wide HCM vendor. That uncertainty is over. This plan fills in the facts for Federal HR 2.0 while preserving an architecture that works with any HR source.

## Program facts

| Fact | Value |
|------|-------|
| Directing instrument | OMB/OPM memorandum, December 10, 2025 |
| Platform | Oracle Fusion Cloud HCM (SaaS) |
| Award | June 11, 2026 |
| Wave 1 | Begins FY 2026 |
| Wave 2 | Completes FY 2027 |
| Agency onboarding | ~8 months; interconnections ~month 5 |

## Caution

No OPM document mandates Entra ID integration. Federal guidance is product-neutral. OMB M-19-17 makes HR systems authoritative for identity. The GSA/FICAM Identity Lifecycle Management Playbook supplies joiner-mover-leaver doctrine as best practice, not policy. Entra-specific steps are an agency implementation decision.

## Execution phases

| Phase | Focus |
|-------|-------|
| 1 | Confirm HR source events and canonical schema mapping |
| 2 | Deploy adapter and middleware; validate SCIM binding |
| 3 | Pilot joiner/mover/leaver with a limited population |
| 4 | Scale; populate governance attributes from HR |
| 5 | Enable drift detection and evidence retention |
| 6 | Steady state — HR events drive directory changes |

## Success criteria

- Joiner, mover, and leaver events originate in the HR system of record.
- Directory objects are created, updated, or disabled only in response to those events.
- Governance attributes used for policy targeting are populated from the HR feed.
- Drift between HR state and directory state is detectable and recorded.

---

*Cleaned extraction for project use.*
