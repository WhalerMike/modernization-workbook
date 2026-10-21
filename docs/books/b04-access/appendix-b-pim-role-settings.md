---
title: "Appendix B — PIM Role Settings Reference"
description: "The program's Privileged Identity Management role settings for each Microsoft Entra administrative role: tier, maximum activation, approval and approvers, authentication context, justification, ticket, eligibility expiry and notification recipients, with role template IDs."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b04-access
book: B04
part: Appendix
series-order: 91
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix B — PIM Role Settings Reference

*One row per role, so that the setting in the tenant, the file in the repository and the statement in the security plan can be compared line by line.*

::: {.callout-note}
## In this appendix
The role settings the program applies in Privileged Identity Management (PIM) to each Microsoft Entra administrative role, grouped by the privilege tiers of [Chapter 04](04-privileged-roles-and-tiers.md). The settings common to every role, the notification recipients by tier, where these values tighten [Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md#pim-configuration-standards), the role template IDs used to find each role's policy, and a PowerShell script that applies a tier's settings.
:::

The values are the program's design. The ranges and behaviors they sit inside are Microsoft's, and [Chapter 08](08-pim-self-request-with-approval.md) documents them: an activation maximum of 1 to 24 hours, information-only ticket numbers, a fixed 24-hour approval window, single-stage approval only, and settings defined independently for each role.[^aB-settings][^aB-approval] [Chapter 08](08-pim-self-request-with-approval.md#step-4-configure-role-settings-with-microsoft-graph) shows how to apply a tier's values with Microsoft Graph, the [script at the end of this appendix](#applying-a-tiers-settings-with-powershell) applies them to a list of roles, and [Chapter 10](10-access-as-code-and-evidence.md) keeps one file per role policy so drift from this table is detectable.

## Conventions

| Term | Meaning |
|---|---|
| `c1` | Authentication context `FMP-PIM-Activation`, enforced by Conditional Access policy `PIM-Activation-c1`: authentication strength `FMP-Privileged-SeparateDevice`, compliant device, sign-in frequency every time ([Chapter 08](08-pim-self-request-with-approval.md#step-2-build-the-authentication-context-and-its-policy)) |
| `PIM-Approvers-T0` | Approvers for Tier 0 activations, drawn from the security office; no member is eligible for a Tier 0 role |
| `PIM-Approvers-T1` | Approvers for Tier 1 activations, drawn from identity engineering leads and the security office; no member is eligible for the role they approve |
| `PIM-Approvers-T2` | Used only for a Tier 2 role whose risk acceptance has been withdrawn, so that it requires approval |
| SOC mailbox | The security operations distribution list that receives every activation alert |
| Eligible to | The role-assignable group that holds the eligible assignment ([Chapter 04](04-privileged-roles-and-tiers.md#how-a-role-reaches-a-person)) |

Every value marked "Required" for approval also requires the approver's own justification (`isApproverJustificationRequired`).

## Settings common to every role

These apply to every role in the tables below, on the **Assignment** tab and in the matching Graph rules.[^aB-settings][^aB-rules]

| Setting | Value | Graph rule |
|---|---|---|
| Allow permanent eligible assignment | No; expiry by tier (below) | `Expiration_Admin_Eligibility` |
| Allow permanent active assignment | No, except Global Administrator for the emergency access accounts | `Expiration_Admin_Assignment` |
| Expire active assignment after | The shortest period the documented exception needs; reviewed with the exception | `Expiration_Admin_Assignment` |
| Require MFA on active assignment | Yes | `Enablement_Admin_Assignment` |
| Require justification on active assignment | Yes | `Enablement_Admin_Assignment` |
| On activation, require | Authentication context `c1` | `AuthenticationContext_EndUser_Assignment` |
| Require justification on activation | Yes | `Enablement_EndUser_Assignment` |
| Approval stage timeout | 1 day (the fixed 24-hour window) | `Approval_EndUser_Assignment` |

## Tier 0 — control plane

| Role | Max activation | Approval and approvers | Ticket | Eligibility expiry | Eligible to |
|---|---|---|---|---|---|
| Global Administrator | 4 hours | Required: `PIM-Approvers-T0` | Required | 90 days | `PRV-T0-GlobalAdmin` |
| Privileged Role Administrator | 4 hours | Required: `PIM-Approvers-T0` | Required | 90 days | `PRV-T0-PrivRoleAdmin` |
| Privileged Authentication Administrator | 4 hours | Required: `PIM-Approvers-T0` | Required | 90 days | `PRV-T0-PrivAuthAdmin` |
| Security Administrator | 4 hours | Required: `PIM-Approvers-T0` | Required | 90 days | `PRV-T0-SecurityAdmin` |
| Conditional Access Administrator | 4 hours | Required: `PIM-Approvers-T0` | Required | 90 days | `PRV-T0-CAAdmin` |

Microsoft's guidance is fewer than five Global Administrators;[^aB-privileged] the eligible population of `PRV-T0-GlobalAdmin`, plus the two emergency accounts, stays within that.

## Tier 1 — management plane

| Role | Max activation | Approval and approvers | Ticket | Eligibility expiry | Eligible to |
|---|---|---|---|---|---|
| Exchange Administrator | 8 hours | Required: `PIM-Approvers-T1` | Required | 180 days | `PRV-T1-ExchangeAdmin` |
| SharePoint Administrator | 8 hours | Required: `PIM-Approvers-T1` | Required | 180 days | `PRV-T1-SharePointAdmin` |
| Teams Administrator | 8 hours | Required: `PIM-Approvers-T1` | Required | 180 days | `PRV-T1-TeamsAdmin` |
| Intune Administrator | 8 hours | Required: `PIM-Approvers-T1` | Required | 180 days | `PRV-T1-IntuneAdmin` |
| Application Administrator | 8 hours | Required: `PIM-Approvers-T1` | Required | 180 days | `PRV-T1-AppAdmin` |
| Cloud Application Administrator | 8 hours | Required: `PIM-Approvers-T1` | Required | 180 days | `PRV-T1-CloudAppAdmin` |
| Hybrid Identity Administrator | 8 hours | Required: `PIM-Approvers-T1` | Required | 180 days | `PRV-T1-HybridIdentityAdmin` |
| Authentication Policy Administrator | 8 hours | Required: `PIM-Approvers-T1` | Required | 180 days | `PRV-T1-AuthPolicyAdmin` |
| Compliance Administrator | 8 hours | Required: `PIM-Approvers-T1` | Required | 180 days | `PRV-T1-ComplianceAdmin` |

For Exchange Administrator and SharePoint Administrator the program uses an eligible group-to-role assignment with active group members, the pattern Microsoft recommends for roles with Exchange, SharePoint or Purview permissions to avoid slow activation.[^aB-pim-groups] Some Exchange admin center areas don't recognize a role held through a group; where an administrator needs them, assign that person's eligibility directly to the role and record the exception.[^aB-rag]

## Tier 2 — scoped operations

These roles are assigned at administrative-unit scope wherever the role supports it ([Book 02, Chapter 05](../b02-identity/05-delegation-without-ous.md#role-assignment-matrix)). The PIM settings are per role, so every scoped assignment of a role shares them.[^aB-settings]

| Role | Max activation | Approval and approvers | Ticket | Eligibility expiry | Eligible to |
|---|---|---|---|---|---|
| User Administrator | 8 hours | Not required; risk acceptance on file | Required | 180 days | `PRV-T2-UserAdmin-<AU>` |
| Groups Administrator | 8 hours | Not required; risk acceptance on file | Required | 180 days | `PRV-T2-GroupsAdmin-<AU>` |
| Helpdesk Administrator | 8 hours | Not required; risk acceptance on file | Required | 180 days | `PRV-T2-HelpdeskAdmin-<AU>` |
| Password Administrator | 8 hours | Not required; risk acceptance on file | Required | 180 days | `PRV-T2-PasswordAdmin-<AU>` |
| Authentication Administrator | 8 hours | Not required; risk acceptance on file | Required | 180 days | `PRV-T2-AuthAdmin-<AU>` |

The risk acceptance rests on three compensating facts: the assignment is scoped to an administrative unit, these roles can't change the credentials of members of role-assignable groups,[^aB-roles-ref] and every activation still passes `c1` and is alerted to the SOC. Microsoft recommends approval for eligible assignments in groups used to elevate into roles, because otherwise someone who can reset an eligible user's credentials could activate on their behalf;[^aB-rag] if an agency's help desk can reset the credentials of Tier 2 administrators, withdraw the risk acceptance and require `PIM-Approvers-T2`.

## Read-only

| Role | Max activation | Approval | Ticket | Eligibility expiry | Eligible to |
|---|---|---|---|---|---|
| Global Reader | 8 hours | Not required | Optional | 365 days | `PRV-RO-GlobalReader` |
| Security Reader | 8 hours | Not required | Optional | 365 days | `PRV-RO-SecurityReader` |
| Reports Reader | 8 hours | Not required | Optional | 365 days | `PRV-RO-ReportsReader` |

Global Reader and Security Reader carry Microsoft's privileged label; Reports Reader doesn't.[^aB-roles-ref] All three stay eligible-only so that every read session over the security configuration has a justification on record.

## Notifications by tier

PIM controls each notification per event and per recipient type: off, named recipients only, default recipients plus named ones, or critical emails only. One event reaches at most 1,000 recipients.[^aB-settings][^aB-email]

| Event | Tier 0 | Tier 1 | Tier 2 and read-only |
|---|---|---|---|
| Eligible member activates: request to approve | `PIM-Approvers-T0` | `PIM-Approvers-T1` | Not applicable (no approval) |
| Eligible member activates: role activation alert | Default recipients plus SOC mailbox | Default recipients plus SOC mailbox | SOC mailbox only, critical emails only off |
| Eligible member activates: notice to the requester | On | On | On |
| Member assigned as eligible | Default recipients plus SOC mailbox and the identity governance office | Default recipients plus SOC mailbox | SOC mailbox |
| Member assigned as active | Default recipients plus SOC mailbox, flagged for incident review | Default recipients plus SOC mailbox, flagged for incident review | Default recipients plus SOC mailbox, flagged for incident review |

An active assignment should never happen outside the documented exceptions, so every "assigned as active" notice is reconciled against the exception register, alongside the PIM alert for assignments made outside PIM ([Chapter 08](08-pim-self-request-with-approval.md#step-7-notifications-and-pim-alerts)).

## Review cadence by tier

| Tier | Role access review | Reviewers | If no response |
|---|---|---|---|
| Tier 0 | Monthly | `PIM-Approvers-T0` | Remove access |
| Tier 1 | Quarterly | Role owner and `PIM-Approvers-T1` | Remove access |
| Tier 2 | Quarterly | Role owner (the AU's department lead) and the security office | Remove access |
| Read-only | Quarterly | Security office | Remove access |

Each role review is paired with a membership review of its `PRV-*` group, because a review of a role held by a group shows the group, not its members ([Chapter 08](08-pim-self-request-with-approval.md#step-8-access-reviews-of-eligibility)).[^aB-review]

## Where this appendix tightens Book 02

[Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md#pim-configuration-standards) set the migration-era baseline. This book's tier model tightens it in these places, and these values govern where the two differ:

| Role or setting | Book 02, Chapter 09 | This appendix | Reason |
|---|---|---|---|
| Security Administrator | 8 hours | 4 hours | Tier 0: can change the policies that protect every sign-in |
| Conditional Access Administrator | 8 hours, no approval | 4 hours, approval by `PIM-Approvers-T0` | Can weaken the activation gate itself ([Chapter 04](04-privileged-roles-and-tiers.md#the-programs-privilege-tiers)) |
| Exchange, SharePoint, Intune, Application and Compliance Administrator | No approval | Approval by `PIM-Approvers-T1` | Tier 1: service-wide control |
| Teams, Cloud Application, Hybrid Identity and Authentication Policy Administrator | Not in Chapter 09's table | Eligible only; approval by `PIM-Approvers-T1`, 8 hours, ticket required (Tier 1 table above) | Tier 1: service-wide control, application credentials, the synchronization bridge to AD, or the tenant's authentication methods policy[^aB-roles-ref] |
| Ticket on activation | Global, Privileged Role and Exchange Administrator only | Every Tier 0, 1 and 2 role | Ticket correlation in the ITSM is how activations are reconciled to approved work |
| Security Reader, Global Reader | 12 hours, no justification | 8 hours, justification required | Privileged-labeled read access gets a recorded reason |
| Eligibility expiry | At most 12 months | 90, 180 or 365 days by tier | Within Book 02's ceiling |
| Role access reviews | Not set in Chapter 09; [Chapter 05](../b02-identity/05-delegation-without-ous.md#delegation-principles) and [Chapter 10](../b02-identity/10-migrating-and-governing.md#access-reviews) set monthly for Tier 0 and quarterly for other privileged roles, reviewed by the security team, never by the assignees alone | Same cadences; reviewers named per tier ([above](#review-cadence-by-tier)); never self-review | Per-tier approver groups match the activation gate; a self-review leaves role-assignable groups out of the review[^aB-review] |

## Role template IDs {#role-template-ids}

Template IDs are immutable and the same in every tenant; Graph uses them to find each role's policy.[^aB-roles-ref]

| Role | Tier | Privileged label | Template ID |
|---|---|---|---|
| Global Administrator | T0 | Yes | `62e90394-69f5-4237-9190-012177145e10` |
| Privileged Role Administrator | T0 | Yes | `e8611ab8-c189-46e8-94e1-60213ab1f814` |
| Privileged Authentication Administrator | T0 | Yes | `7be44c8a-adaf-4e2a-84d6-ab2649e08a13` |
| Security Administrator | T0 | Yes | `194ae4cb-b126-40b2-bd5b-6091b380977d` |
| Conditional Access Administrator | T0 | Yes | `b1be1c3e-b65d-4f19-8427-f6fa0d97feb9` |
| Exchange Administrator | T1 | No | `29232cdf-9323-42fd-ade2-1d097af3e4de` |
| SharePoint Administrator | T1 | No | `f28a1f50-f6e7-4571-818b-6a12f2af6b6c` |
| Teams Administrator | T1 | No | `69091246-20e8-4a56-aa4d-066075b2a7a8` |
| Intune Administrator | T1 | Yes | `3a2c62db-5318-420d-8d74-23affee5d9d5` |
| Application Administrator | T1 | Yes | `9b895d92-2cd3-44c7-9d02-a6ac2d5ea5c3` |
| Cloud Application Administrator | T1 | Yes | `158c047a-c907-4556-b7ef-446551a6b5f7` |
| Hybrid Identity Administrator | T1 | Yes | `8ac3fc64-6eca-42ea-9e69-59f4c7b60eb2` |
| Authentication Policy Administrator | T1 | No | `0526716b-113d-4c15-b2c8-68e3c22b9f80` |
| Compliance Administrator | T1 | No | `17315797-102d-40b4-93e0-432062caca18` |
| User Administrator | T2 | Yes | `fe930be7-5e62-47db-91af-98c3a49a38b1` |
| Groups Administrator | T2 | No | `fdd7a751-b60b-444a-984c-02652fe8fa1c` |
| Helpdesk Administrator | T2 | Yes | `729827e3-9c14-49f7-bb1b-9608f156bbb8` |
| Password Administrator | T2 | Yes | `966707d0-3269-4727-9be2-8c3a10f19b9d` |
| Authentication Administrator | T2 | Yes | `c4e39bd9-1100-46d3-8c65-fb160da0071f` |
| Global Reader | Read-only | Yes | `f2ef992c-3afb-46b9-b7cf-a126ee74c451` |
| Security Reader | Read-only | Yes | `5d6b6bb7-de71-4623-b4af-96380a352509` |
| Reports Reader | Read-only | No | `4a5d8f65-41da-4de4-8968-e035b65339cf` |

The privileged label is still described as a preview; recheck it when Microsoft's role reference changes.[^aB-privileged]

## Applying a tier's settings with PowerShell {#applying-a-tiers-settings-with-powershell}

::: {.callout-warning}
## Illustrative code
This script is illustrative and hasn't been tested against a production tenant. Review it, and run it with `-WhatIf` against a test tenant, before using it.
:::

The script applies one tier's PIM settings to a list of roles; [Chapter 08, Step 4](08-pim-self-request-with-approval.md#step-4-configure-role-settings-with-microsoft-graph) explains each rule it sets. Save it as `Set-FMPPimTierPolicy.ps1`. `Get-MgPolicyRoleManagementPolicyAssignment` and `Update-MgPolicyRoleManagementPolicyRule` are in the `Microsoft.Graph.Identity.SignIns` module.[^aB-update-rules] The script honors `-WhatIf`.

```powershell
#Requires -Modules Microsoft.Graph.Identity.SignIns

<#
.SYNOPSIS
    Apply an FMP privilege-tier PIM policy (approval, authentication context,
    justification, ticket, duration, eligibility expiry) to Microsoft Entra roles.

.DESCRIPTION
    Resolves each role's role management policy from its immutable template ID,
    then updates the five rules that make up the approval gate. Re-running with
    the same inputs leaves the settings unchanged.

.NOTES
    Least-privileged role: Privileged Role Administrator.
    Connect first:
        Connect-MgGraph -Scopes 'RoleManagementPolicy.ReadWrite.Directory'
#>
[CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'High')]
param(
    # CONFIGURE: the template IDs of the roles in one tier (Role template IDs, above).
    [Parameter(Mandatory)]
    [string[]] $RoleTemplateId,

    # CONFIGURE: object ID of the tier's approver group (Chapter 08, Step 1).
    [Parameter(Mandatory)]
    [string] $ApproverGroupId,

    # Maximum activation window, ISO 8601, 1 to 24 hours.
    [ValidatePattern('^PT([1-9]|1[0-9]|2[0-4])H$')]
    [string] $MaxActivationDuration = 'PT4H',

    # Maximum eligible-assignment lifetime, ISO 8601.
    [string] $MaxEligibilityDuration = 'P90D',

    # Authentication context required on activation (Chapter 08, Step 2).
    [string] $AuthenticationContext = 'c1'
)

begin {
    function New-PimRuleTarget {
        param(
            [ValidateSet('EndUser', 'Admin')][string] $Caller = 'EndUser',
            [ValidateSet('Assignment', 'Eligibility')][string] $Level = 'Assignment'
        )
        @{
            '@odata.type'       = 'microsoft.graph.unifiedRoleManagementPolicyRuleTarget'
            caller              = $Caller
            operations          = @('All')
            level               = $Level
            inheritableSettings = @()
            enforcedSettings    = @()
        }
    }

    # Activation rules apply to the end user activating their own eligible
    # assignment; the eligibility-expiry rule applies to the admin who assigns it.
    $activationTarget  = New-PimRuleTarget -Caller 'EndUser' -Level 'Assignment'
    $eligibilityTarget = New-PimRuleTarget -Caller 'Admin'   -Level 'Eligibility'

    function Resolve-PimPolicyId {
        param([Parameter(Mandatory)][string] $TemplateId)

        $filter = "scopeId eq '/' and scopeType eq 'DirectoryRole' and " +
                  "roleDefinitionId eq '$TemplateId'"
        $assignment = Get-MgPolicyRoleManagementPolicyAssignment -Filter $filter -ErrorAction Stop

        if (-not $assignment) {
            throw "No role management policy assignment found for template ID $TemplateId."
        }
        # A directory role at tenant scope resolves to exactly one policy.
        return $assignment[0].PolicyId
    }

    function Set-PimRule {
        param(
            [Parameter(Mandatory)][string]    $PolicyId,
            [Parameter(Mandatory)][string]    $RuleId,
            [Parameter(Mandatory)][hashtable] $Body
        )
        Update-MgPolicyRoleManagementPolicyRule `
            -UnifiedRoleManagementPolicyId     $PolicyId `
            -UnifiedRoleManagementPolicyRuleId $RuleId `
            -BodyParameter                     $Body `
            -ErrorAction                       Stop
    }
}

process {
    foreach ($templateId in $RoleTemplateId) {

        $policyId = Resolve-PimPolicyId -TemplateId $templateId

        if (-not $PSCmdlet.ShouldProcess(
                "role $templateId (policy $policyId)",
                "Apply tier policy: approval by $ApproverGroupId, context $AuthenticationContext, max $MaxActivationDuration")) {
            continue
        }

        # 1. Require approval, routed to the approver group.
        Set-PimRule -PolicyId $policyId -RuleId 'Approval_EndUser_Assignment' -Body @{
            '@odata.type' = '#microsoft.graph.unifiedRoleManagementPolicyApprovalRule'
            id            = 'Approval_EndUser_Assignment'
            target        = $activationTarget
            setting       = @{
                '@odata.type'                    = 'microsoft.graph.approvalSettings'
                isApprovalRequired               = $true
                isApprovalRequiredForExtension   = $false
                isRequestorJustificationRequired = $true
                approvalMode                     = 'SingleStage'
                approvalStages                   = @(
                    @{
                        approvalStageTimeOutInDays      = 1
                        isApproverJustificationRequired = $true
                        escalationTimeInMinutes         = 0
                        isEscalationEnabled             = $false
                        escalationApprovers             = @()
                        primaryApprovers                = @(
                            @{
                                '@odata.type' = '#microsoft.graph.groupMembers'
                                groupId       = $ApproverGroupId
                            }
                        )
                    }
                )
            }
        }

        # 2. Require the authentication context on activation.
        Set-PimRule -PolicyId $policyId -RuleId 'AuthenticationContext_EndUser_Assignment' -Body @{
            '@odata.type' = '#microsoft.graph.unifiedRoleManagementPolicyAuthenticationContextRule'
            id            = 'AuthenticationContext_EndUser_Assignment'
            isEnabled     = $true
            claimValue    = $AuthenticationContext
            target        = $activationTarget
        }

        # 3. Require justification and ticket information on activation.
        #    Ticket information is recorded but not validated by Entra.
        Set-PimRule -PolicyId $policyId -RuleId 'Enablement_EndUser_Assignment' -Body @{
            '@odata.type' = '#microsoft.graph.unifiedRoleManagementPolicyEnablementRule'
            id            = 'Enablement_EndUser_Assignment'
            enabledRules  = @('Justification', 'Ticketing')
            target        = $activationTarget
        }

        # 4. Cap the activation window.
        Set-PimRule -PolicyId $policyId -RuleId 'Expiration_EndUser_Assignment' -Body @{
            '@odata.type'        = '#microsoft.graph.unifiedRoleManagementPolicyExpirationRule'
            id                   = 'Expiration_EndUser_Assignment'
            isExpirationRequired = $true
            maximumDuration      = $MaxActivationDuration
            target               = $activationTarget
        }

        # 5. Bound how long an eligible assignment may live.
        Set-PimRule -PolicyId $policyId -RuleId 'Expiration_Admin_Eligibility' -Body @{
            '@odata.type'        = '#microsoft.graph.unifiedRoleManagementPolicyExpirationRule'
            id                   = 'Expiration_Admin_Eligibility'
            isExpirationRequired = $true
            maximumDuration      = $MaxEligibilityDuration
            target               = $eligibilityTarget
        }

        Write-Verbose "Applied tier policy to role $templateId (policy $policyId)."
    }
}
```

For a Tier 2 role whose approval has been risk-accepted, set `isApprovalRequired` to `$false` and record the acceptance alongside the role's file in the policy repository ([Chapter 10](10-access-as-code-and-evidence.md)).

::: {.callout-tip}
## Continue the book
[← Previous: Appendix A — Conditional Access Policy Templates](appendix-a-conditional-access-templates.md) · [Book index](index.md)
:::

[^aB-settings]: Microsoft Learn, "Configure Microsoft Entra role settings in Privileged Identity Management," <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-how-to-change-default-settings> (accessed Oct 20, 2026).
[^aB-approval]: Microsoft Learn, "Approve or deny requests for Microsoft Entra roles in Privileged Identity Management," <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-approval-workflow> (accessed Oct 20, 2026).
[^aB-rules]: Microsoft Learn, "Rules in PIM - mapping guide," <https://learn.microsoft.com/graph/identity-governance-pim-rules-overview> (accessed Oct 20, 2026).
[^aB-privileged]: Microsoft Learn, "Privileged roles and permissions in Microsoft Entra ID (preview)," <https://learn.microsoft.com/entra/identity/role-based-access-control/privileged-roles-permissions> (accessed Oct 20, 2026).
[^aB-pim-groups]: Microsoft Learn, "Privileged Identity Management (PIM) for Groups," <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/concept-pim-for-groups> (accessed Oct 20, 2026).
[^aB-rag]: Microsoft Learn, "Use Microsoft Entra groups to manage role assignments," <https://learn.microsoft.com/entra/identity/role-based-access-control/groups-concept> (accessed Oct 20, 2026).
[^aB-roles-ref]: Microsoft Learn, "Microsoft Entra built-in roles," <https://learn.microsoft.com/entra/identity/role-based-access-control/permissions-reference> (accessed Oct 21, 2026).
[^aB-email]: Microsoft Learn, "Email notifications in PIM," <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-email-notifications> (accessed Oct 20, 2026).
[^aB-review]: Microsoft Learn, "Create an access review of Azure resource and Microsoft Entra roles in PIM," <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-create-roles-and-resource-roles-review> (accessed Oct 21, 2026).
[^aB-update-rules]: Microsoft Learn, "Update rules in PIM by using Microsoft Graph," <https://learn.microsoft.com/graph/how-to-pim-update-rules> (accessed Oct 20, 2026).
