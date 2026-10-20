# Where Data Lives — Devices and Azure Resources

Data location taxonomy for devices and Azure resources under a governed model.

## Purpose

Extends the identity data-location model to devices and Azure resources. For each object type, identify the authoritative origin, the derived pointers, and the systems that must not be treated as sources of truth.

## Devices

| Claim | Authoritative origin | Derived pointers |
|-------|---------------------|------------------|
| Ownership / purpose | Procurement or asset record | Intune device category, dynamic group membership |
| Compliance state | Intune compliance policy evaluation | Conditional Access signal |
| Location / site | Procurement or assignment record | Named location, dynamic group |
| Management authority | Intune enrollment | Azure Arc (servers) |

## Azure resources

| Claim | Authoritative origin | Derived pointers |
|-------|---------------------|------------------|
| Subscription / resource group purpose | Governance assignment | Tags, policy assignment |
| Owner | Governance record | Tag or role assignment |
| Environment (prod/non-prod) | Governance assignment | Tag, policy, Conditional Access named location |
| Compliance scope | Governance boundary | Azure Policy assignment, regulatory tags |

## Rule

No device or Azure resource should carry an empty governance attribute when enrolled or created under the governed path. Derived values (tags, group membership, policy assignment) must be explainable from the authoritative origin.

---

*Cleaned extraction for project use.*
