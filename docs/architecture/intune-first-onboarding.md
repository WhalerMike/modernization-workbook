# Intune-First Asset Onboarding

Net-new devices enter governance from day zero.

## Purpose

Devices procured after the modernization decision should receive their governance attributes and management enrollment at the earliest practical moment — ideally before a user signs in. This document describes a five-phase process that stamps governance intent at procurement time and carries it through enrollment.

## Priority order for attribute assignment

1. **Procurement record** — The organization decided to buy the asset for a specific purpose and location.
2. **Vendor or program carrier** — The supplier or enrollment program carries the intended attributes.
3. **User derivation** — Fallback when no procurement record exists (for example, BYOD or historical inventory).
4. **Unpositioned** — Explicit marker when no source can supply a value. No enrolled device should carry an empty governance attribute.

Procurement-first ordering provides determinism (the attribute reflects the purchase decision, not the technician who powered the device on), auditability (chain of custody from purchase order to production), and pre-user-logon coverage (shared and self-deploying devices are stamped correctly with no user present).

## Five phases

| Phase | Owner | Outcome |
|-------|-------|---------|
| 1 — Procure | Procurement / asset management | Asset record created with intended governance attributes |
| 2 — Carrier | Vendor or enrollment program | Attributes available to the enrollment process |
| 3 — Validate | Governance / identity | Attributes checked against the canonical model |
| 4 — Enroll | Endpoint management | Device enrolled in Intune with attributes stamped |
| 5 — Verify | Operations | Device appears in the correct dynamic groups and policies; residual risk recorded if any |

## Devices without a procurement record

Devices that pre-date the process or arrive outside normal procurement fall through to user derivation or the unpositioned marker. These surface as findings for governance review — either by retroactively filing a record, reclassifying the asset, or quarantining it for disposition.

## Bottom line

Every enrolled device carries a governance attribute, even if that attribute is an explicit “unpositioned” marker. That invariant keeps dynamic group membership and drift detection deterministic from day zero.

---

*Cleaned extraction for project use.*
