# PIM Self-Request with Approval

Pattern for just-in-time privileged access with recorded approval.

## Purpose

Privileged Identity Management allows eligible users to request activation of a privileged role for a limited time. This document describes the self-request pattern with approval, evidence requirements, and residual risk controls.

## Pattern

1. User is assigned eligibility for a role (not standing membership).
2. User requests activation and supplies a justification.
3. Designated approver reviews and approves or denies.
4. Role is activated for the approved duration.
5. Activation and approval are recorded as evidence.
6. Role expires automatically.

## Requirements

| Element | Requirement |
|---------|-------------|
| Eligibility | Assigned by governance, not by the user |
| Justification | Required and retained |
| Approval | Required for high-privilege roles; optional for lower tiers |
| Duration | Maximum activation window defined per role |
| Evidence | Request, approver, timestamp, and duration recorded |
| Monitoring | Alert on activation outside expected patterns |

## Residual risk

- Approver fatigue if volume is high
- Standing eligibility that is never reviewed
- Break-glass accounts that bypass the pattern

Mitigate by periodic eligibility review, volume monitoring, and separate break-glass procedures.

---

*Cleaned extraction for project use.*
