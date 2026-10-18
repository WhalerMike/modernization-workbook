---
title: "Chapter 05 — The Canonical Attribute Schema"
description: "The one attribute schema the whole site uses: each canonical field with its Oracle HCM source, SCIM attribute, Active Directory and Entra ID carrier, whether a dynamic membership rule can read it, and what it's for — native Entra attributes first, three coded extension attributes for access, and the writer rules that protect them."
doc-type: hr-driven-iam-chapter
audience: [Executive, Technical, Customer]
family: hr-driven-iam
series-order: 5
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

# Chapter 05 — The Canonical Attribute Schema

*Native attributes first. A small, coded set of extension attributes for access. Nothing hand-edited.*

::: {.callout-note}
## In this chapter
The design rules behind the schema. The schema table itself, which every other page on this site links to instead of repeating. Why three extension attributes, and why they hold codes. How the hire and leave dates reach Entra ID from each landing zone. Who is allowed to write any of it.
:::

## Design rules

1. **Use a native Entra attribute wherever one exists.** `employeeId`, `department`, `jobTitle`, `companyName`, `manager`, `employeeType`, `employeeHireDate`, `employeeLeaveDateTime` and `employeeOrgData` already mean what the HR record means. Other Microsoft features (the org chart, Lifecycle Workflows, access-package approvals) read them directly.
2. **Add an extension attribute only where access needs a value a rule can't read natively.** Rules for dynamic membership support a fixed list of user properties. That list includes `department`, `companyName`, `jobTitle`, `employeeId`, `employeeHireDate` (preview), `userType` and `accountEnabled`, plus `extensionAttribute1`–`15` and directory extension properties. It doesn't include `employeeType`, `employeeOrgData` or `manager` (direct-reports groups use a separate rule form).[^c05-dyn-rules] Three attributes cover the gap.
3. **Put codes in access attributes, never display strings.** An organization code changes only when the business fact changes; a display name changes whenever someone retypes it.
4. **Use the same carrier in both landing zones.** `extensionAttribute1`–`15` exist in on-premises AD and in Entra ID. For synced users, AD is the source and the Entra values are read-only; for cloud-only users they can be set when the user is created or updated.[^c05-onprem-ext] A rule written against `user.extensionAttribute10` works the same for a hybrid user and a cloud-mastered one, which matters during the years of coexistence.
5. **Don't build an organizational hierarchy into attributes.** The reporting line is the `manager` relationship; organizational placement is `department`, `employeeOrgData` and one organization code. There's no encoded path, tree or composite key to maintain.

## The schema

| Canonical field | Oracle HCM source | SCIM attribute | On-premises AD | Entra ID | Rule can read it | Used for |
|---|---|---|---|---|---|---|
| Person number | `workers.PersonNumber` | `externalId` | `employeeID` | `employeeId` | Yes | **Match key**, identifier for life (Chapter 03) |
| Employment active | Assignment status | `active` | `accountDisabled` | `accountEnabled` | Yes | Joiner and leaver state |
| Given name / surname | `workers.names` | `name.givenName` / `name.familyName` | `givenName` / `sn` | `givenName` / `surname` | Yes | Display, UPN rules |
| Display name | `workers.DisplayName` | `displayName` | `cn` | `displayName` | Yes | Display only, never access |
| Department | Department name | enterprise `department` | `department` | `department` | Yes | Display, address book, coarse scoping |
| Division | Business unit | enterprise `division` | `division` | `employeeOrgData.division` | No | Reporting, profile card |
| Cost center | Cost center | enterprise `costCenter` | — | `employeeOrgData.costCenter` | No | Chargeback, reporting |
| Legal employer | Legal employer | enterprise `organization` | `company` | `companyName` | Yes | Agency or component |
| Manager | Manager's person number | enterprise `manager` | `manager` (DN) | `manager` | Direct-reports rule only | Supervisory chain, approvals, reviewers |
| Job title | `JobName` | `title` | `title` | `jobTitle` | Yes | Display; not an access input |
| Worker type | Worker type / person type | custom extension `workerType` | `employeeType` | `employeeType` | No | Employee, contractor, intern, volunteer |
| Hire date | Effective start date | custom extension `HireDate` | `extensionAttribute2` | `employeeHireDate` | Yes (preview) | Joiner workflow trigger |
| Leave date | Termination effective date | custom extension `TermDate` | `extensionAttribute3` | `employeeLeaveDateTime` | No | Leaver workflow trigger |
| Work country | Work address country | `addresses[type eq "work"].country` | `co` | `country` | Yes | Address; source for the `usageLocation` expression that licensing needs |
| **Organization code** | Department ID (code) | custom extension `orgCode` | `extensionAttribute10` | `extensionAttribute10` | Yes | **Access targeting** |
| **Worker type code** | Worker type (code) | custom extension `workerTypeCode` | `extensionAttribute11` | `extensionAttribute11` | Yes | **Access targeting**; mirrors `employeeType` |
| **Position category** | Job family or position category (code) | custom extension `positionCategory` | `extensionAttribute12` | `extensionAttribute12` | Yes | **Access targeting** |

: The canonical attribute schema — the only attribute crosswalk on this site {.striped .hover}

Notes on the table:

- The SCIM mappings for both landing zones follow the example worksheets in Microsoft's Oracle HCM integration guide, which also maps a custom `JobCode` to `extensionAttribute1` in both AD and Entra ID. Custom attributes are added to the provisioning app's schema as SCIM schema extensions and then mapped.[^c05-oracle-tutorial][^c05-custom-attrs] For attributes with no AD equivalent, the same guide says to use `extensionAttribute1`–`15` or extend the AD schema.[^c05-oracle-tutorial]
- **Neither date has a native AD attribute.** For AD-landed users, Microsoft's Oracle HCM worksheet writes `HireDate` and `TermDate` to `extensionAttribute2` and `extensionAttribute3`;[^c05-oracle-tutorial] a sync rule then maps each one to `employeeHireDate` or `employeeLeaveDateTime` in Entra ID. The AD attribute must be a string, and the value must be converted to the format Entra expects, usually with a date-format expression. Inbound provisioning, Entra Connect cloud sync and Entra Connect Sync all support both target attributes.[^c05-lcw-sync]
- **The choice of `extensionAttribute10`–`12` for access codes is this series' decision**, not a Microsoft default. Before Phase 1 closes, confirm that each one is in the provisioning app's target attribute list and isn't already used. Exchange calls `extensionAttribute1`–`15` custom attributes 1–15.[^c05-onprem-ext]
- Rules can't use multi-value extension properties.[^c05-dyn-rules] All three access attributes hold one code.

## Writers

A dynamic membership rule moves the access decision to whoever can write the attribute it reads. Microsoft's guidance is to check write permissions for every attribute a rule uses, in Entra ID and in any source directory, and to restrict self-service write access to attributes used in security-sensitive groups.[^c05-dyn-rules] For this schema that means:

- The **only writer** of every field above is the provisioning service: the API-driven inbound app for cloud-mastered users, the provisioning agent plus Entra Connect for AD-mastered ones.
- Remove help-desk, self-service and Exchange-admin write paths to `extensionAttribute10`–`12` and to the two date carriers. In AD, review the ACLs on the target OUs; in Exchange, the custom-attribute cmdlets are a write path.
- Any write by another principal is a drift event (Chapter 09).

## How other pages use this schema

The [SQL Server Identity Transformation series, Book 07](../case-studies/sql-server-narrative/Book_07_CPT_02.md) applies the same attribute-to-access discipline to SQL Server logins and database roles. The [AD → Entra ID Identity Modernization Guide](../operational-guides/identity/identity-modernization.md) and the Conditional Access library link here rather than carrying their own attribute map.


::: {.callout-tip}
## Continue the series
[← Previous: Chapter 04 — The Provisioning Pipeline](04-the-provisioning-pipeline.md) · [Index](index.md) · [Next: Chapter 06 — Joiner, Mover, Leaver →](06-joiner-mover-leaver.md)
:::

[^c05-dyn-rules]: Microsoft Learn, "Manage rules for dynamic membership groups in Microsoft Entra ID" (supported properties; extension attributes and custom extension properties; security consideration on attribute write permissions), <https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-membership> (accessed Oct 19, 2026).
[^c05-onprem-ext]: Microsoft Graph, "onPremisesExtensionAttributes resource type," <https://learn.microsoft.com/en-us/graph/api/resources/onpremisesextensionattributes> (accessed Oct 19, 2026).
[^c05-oracle-tutorial]: Microsoft Learn, "Configure Oracle Human Capital Management (HCM) for automatic user provisioning," <https://learn.microsoft.com/en-us/entra/identity/saas-apps/oracle-hcm-provisioning-tutorial> (accessed Oct 19, 2026).
[^c05-custom-attrs]: Microsoft Learn, "Extend API-driven provisioning to sync custom attributes," <https://learn.microsoft.com/en-us/entra/identity/app-provisioning/inbound-provisioning-api-custom-attributes> (accessed Oct 19, 2026).
[^c05-lcw-sync]: Microsoft Learn, "How to synchronize attributes for Lifecycle Workflows," <https://learn.microsoft.com/en-us/entra/id-governance/how-to-lifecycle-workflow-sync-attributes> (accessed Oct 19, 2026).
