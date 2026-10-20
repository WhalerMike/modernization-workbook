# Delegation Matrix

Principles for scoping administrative authority.

## Purpose

Delegation defines who may perform which actions on which scope of objects. In a modernized environment the scope is expressed by governed attributes rather than by OU.

## Principles

| Principle | Implication |
|-----------|-------------|
| Least privilege | Role is limited to the minimum actions required |
| Scoped by attribute | Scope is an attribute value or combination, not a manual group |
| Time-bound where possible | Standing access is the exception |
| Recorded | Every delegation has an owner, a scope, and a review date |
| Separated | Requestor and approver are different people for high-privilege actions |

## Example scopes

| Scope | Typical roles | Review cadence |
|-------|---------------|----------------|
| Single department | Help desk, local admin | Quarterly |
| Division or region | Tier-2 operations | Quarterly |
| Privileged roles | Identity admins | Monthly or on change |
| Break-glass | Emergency only | Continuous monitoring |

## Bottom line

Delegation is auditable when the scope is a governed attribute and the assignment is recorded. Manual group membership as the sole scope mechanism loses that auditability.

---

*Cleaned extraction for project use.*
