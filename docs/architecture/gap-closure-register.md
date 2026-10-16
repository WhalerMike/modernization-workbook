# Gap Closure Register

Structure for tracking residual risk and closure actions.

## Purpose

A living register of gaps that remain after a modernization wave or control implementation. Each entry records the gap, its residual risk, the owner, the planned closure action, and the evidence required to close it.

## Entry fields

| Field | Content |
|-------|---------|
| Gap ID | Unique identifier |
| Description | What is missing or incomplete |
| Residual risk | Impact and likelihood if left open |
| Owner | Accountable party |
| Planned action | How the gap will be closed |
| Evidence required | What will prove closure |
| Target date | When closure is expected |
| Status | Open, in progress, closed, accepted |

## Operating rules

- No gap is closed without evidence.
- Accepted residual risk requires explicit approval and a review date.
- The register is reviewed on a defined cadence.
- Closed items remain in the register for audit.

## Bottom line

The register makes residual risk visible and actionable. It prevents gaps from being forgotten after the project phase that created them ends.

---

*Cleaned extraction for project use.*
