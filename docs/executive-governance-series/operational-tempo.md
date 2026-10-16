# Operational Tempo

**The cadence of detection, remediation, and escalation**

Substrate-level governance has a tempo: the cadence at which detection, classification, remediation, escalation, and service-level agreement enforcement run. Without an explicit tempo, even a deterministic substrate degrades — findings pile up, remediation contracts are not honored, and the substrate’s evidence reflects neglect rather than discipline.

## The tempo declared

| Severity | Auto-remediate? | SLA |
|----------|-----------------|-----|
| P1 (critical) | No — halt + alert | Immediate |
| P2 (high) | Yes, if deterministic | 1 hour |
| P3 (medium) | Yes | 24 hours |
| P4 (low) | Yes | 72 hours |

Programs that adopt the model inherit the tempo as a commitment, not as a target to negotiate.

## What the tempo requires of the program

1. **Continuous detection.** Detection is not audit-cycle.
2. **Bounded remediation.** Every finding has a service-level agreement; auto-remediation handles deterministic fixes; the human-judgment subset escalates.
3. **Escalation paths land at named roles.** Escalation paths are named roles, not generic distribution lists.

> A program that declares tempo but does not honor service-level agreements is itself generating drift in the operational layer.

## Auto-remediation versus escalation

- Auto-remediation that requires judgment is unsafe.
- Escalation that auto-remediates undermines the authoritative-source-change process.
- The split clarifies what humans do. Humans tune the classifier, review escalations, and author changes. Humans do not do ticket triage on routine drift.

## The leadership view

Three measurable properties:
- **Detection coverage** — what fraction of the runtime surface is emitting drift findings?
- **Service-level agreement adherence** — what fraction of findings remediate within their agreement?
- **Escalation rate** — what fraction of findings escalate to a human?

These three are program health metrics, not just operations metrics.

## What the tempo does not require

- It does not require 24/7 staffing. Medium and low findings auto-remediate; critical findings halt and alert.
- It does not require eliminating drift. Drift is the signal; the tempo bounds response, not occurrence.
- It does not require a vendor service. The tempo runs entirely on the substrate hosted by the agency.

## Key takeaways

- Operational tempo is canonical, not negotiable.
- Auto-remediation handles deterministic fixes; escalation handles the rest.
- The split clarifies what humans do.
- Detection coverage, service-level agreement adherence, and escalation rate are program health metrics.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
