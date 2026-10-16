# HRIT Identity and Organizational Single Source of Truth

How OPM HRIT modernization aligns with identity and organizational governance.

## Purpose

OPM HRIT modernization establishes a single Core HCM platform for the Executive Branch civilian workforce. For identity and access management, this creates an opportunity to treat the HR system as the authoritative source for both identity proofing and organizational attributes.

## What HRIT provides

- Authoritative employment status (joiner, mover, leaver)
- Organizational attributes (department, division, location, employee type)
- A consistent feed shape across agencies once consolidation completes

## What identity architecture must add

- A canonical schema that normalizes HRIT attributes for directory consumption
- Joiner/mover/leaver workflows that act only on HR events
- Population of governance attributes so that policy targeting remains deterministic
- Drift detection between HR state and directory state
- Evidence that account management controls can be continuously verified

## Relationship to Federal HR 2.0

Federal HR 2.0 is the program that consolidates Core HCM onto a single platform. The identity architecture does not depend on that platform being Oracle Fusion Cloud HCM; it depends on the HR system remaining the authoritative source and on the feed being normalizable to a canonical schema.

## Bottom line

HRIT modernization supplies the authoritative origin. Identity architecture supplies the binding, the workflows, the governance attributes, and the evidence. Neither is sufficient alone.

---

*Cleaned extraction for project use.*
