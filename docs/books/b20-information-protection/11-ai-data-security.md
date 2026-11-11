---
title: "Chapter 11 — AI Data Security"
description: "How the agency monitors and governs sensitive data in approved and unapproved AI workflows: how Microsoft 365 Copilot honors permissions, sensitivity labels and the EXTRACT and VIEW usage rights; Data Security Posture Management for AI and the current Data Security Posture Management, with their prerequisites, one-click policies, activity explorer and data risk assessments for oversharing; DLP for Microsoft 365 Copilot to keep labeled content out of Copilot processing and sensitive prompts out of web grounding; third-party AI sites through endpoint and browser DLP; the government-cloud availability of each feature; and the control states, procedure, evidence and day-two ownership."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b20-information-protection
book: B20
part: How
series-order: 11
status: draft
review-status: pending
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
---

# Chapter 11 — AI Data Security

*An AI assistant reads what its user can read, so every permission the agency got wrong and every label it never applied becomes an answer the assistant can give.*

::: {.callout-note}
## In this chapter
Why generative AI changes the data problem without changing the data controls: Microsoft 365 Copilot works in the user's security context and honors sensitivity labels and the EXTRACT and VIEW usage rights, so the labels, permissions and DLP built in Chapters 02 to 09 are the AI controls. What Microsoft Purview adds for AI: Data Security Posture Management (DSPM) for AI and its successor, the one-click policies, the activity explorer's AI events and the data risk assessments that find oversharing before an assistant surfaces it. DLP for Microsoft 365 Copilot, which keeps labeled items out of Copilot's responses and sensitive prompts out of web grounding. Unapproved AI sites, through endpoint and browser DLP. Then each feature's availability in GCC, GCC High and DoD, the procedure, the evidence and who owns it.
:::

Book 20 has built the data controls in order: what the data is ([Chapter 01](01-data-inventory-and-classification.md)), how labels describe it ([Chapter 02](02-sensitivity-label-architecture.md)), where they are published and defaulted ([Chapter 03](03-label-publication-and-defaults.md)), how containers carry them ([Chapter 04](04-teams-groups-and-sharepoint-containers.md)), how encryption enforces them ([Chapter 05](05-rights-management-and-recovery.md)), and how DLP and auto-labeling act on them ([Chapter 08](08-dlp-and-endpoint-controls.md) and [Chapter 09](09-auto-labeling-and-sensitive-information-types.md)). This chapter doesn't add a new layer of protection on top. It shows how each of those controls already decides what an AI assistant can return, adds the few controls that exist only for AI, and gives the program a way to see sensitive data moving into and out of AI tools, approved or not.

Two boundaries keep the chapter in scope. The identities of AI agents, their sponsors, owners, credentials and lifecycle are [Book 17](../b17-ai-identity/index.md)'s subject, and the federal AI rules that require an inventory and an accountable owner are in [Book 17, Chapter 02](../b17-ai-identity/02-what-federal-ai-rules-require.md); this chapter is about the data those agents and assistants touch. And Microsoft Security Copilot is out of the workbook's scope: where a Purview page describes a Security Copilot integration, this chapter leaves it out. Applications the agency builds on AI services are [Book 18, Chapter 05](../b18-application-modernization/05-generative-and-agentic-ai.md).

::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** Data (with Apps for AI applications)
- **CISA ZTMM pillar:** Data (Data Access, Data Inventory Management); Applications and Workloads for AI apps
- **Depends on:** sensitivity labels and encryption ([Chapter 02](02-sensitivity-label-architecture.md), [Chapter 05](05-rights-management-and-recovery.md)); container labels and sharing defaults ([Chapter 04](04-teams-groups-and-sharepoint-containers.md), [Chapter 07](07-sharepoint-and-onedrive.md)); device onboarding for endpoint DLP ([Chapter 08](08-dlp-and-endpoint-controls.md), [Book 05](../b05-devices/index.md)); Purview audit ([Chapter 10](10-audit-insider-risk-and-communication-compliance.md)); agent identities ([Book 17](../b17-ai-identity/index.md))
- **Attack chain interrupted:** Collection and Exfiltration: an assistant summarizing overshared or over-permissioned content for a user who shouldn't see it, and a user pasting sensitive data into an AI site outside the agency's boundary
:::

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | [The AI data decisions](#the-ai-data-decisions) | Decision record ([Chapter 01](01-data-inventory-and-classification.md#decision-record-template)) naming approved AI apps, the labels excluded from Copilot processing and the treatment of unapproved AI sites |
| Configured | [How: govern sensitive data in AI interactions](#how-govern-sensitive-data-in-ai-interactions), steps 1 to 4 | Audit status, the DSPM for AI policy list and the DLP policy export in simulation |
| Enforced | Step 5 | DLP policies in `Enable` mode, and the exclusion register |
| Evidenced | Step 6, the validation tests | Test record of a blocked Copilot response and a blocked paste to an AI site, with the activity explorer event each produced |
| Operated | [Day-two ownership](#b20-11-day-two-ownership-ai) | Owner, the monthly data risk assessment review, the AI activity alert route to security operations |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

## Why AI changes the problem, not the controls

Microsoft describes Microsoft 365 Copilot's protection in a fixed order, and the order is the design. First, permissions: Copilot only summarizes or references content the user is already authorized to access. Second, encryption: when content is encrypted, by a sensitivity label or by Azure Rights Management without a label, the user must have both the VIEW and the EXTRACT usage rights for Copilot to summarize or return it. A user with VIEW but not EXTRACT gets a link instead of a summary, and can't use Copilot with that item while it's open. Third, labels are shown: Copilot Chat displays the sensitivity label of the items it drew on, the highest-priority one when there are several, and new content Copilot creates from labeled items inherits the highest-priority label where inheritance is supported. And the same protection applies to a labeled or encrypted file stored outside Microsoft 365 while it is open in an Office app.[^c11-copilot-arch]

Three consequences follow for a federal tenant.

- **Oversharing is now a disclosure path, not only a latent risk.** A site shared with "everyone except external users", or a file with an organization-wide link, was always readable by the whole agency. Few people found it. An assistant that searches everything a user can read finds it in seconds. Microsoft makes the same point: generative AI "amplifies the problem of oversharing data," because it can proactively surface content that is obsolete, over-permissioned or ungoverned.[^c11-dspm-overshare]
- **The label's usage rights are an AI control.** EXTRACT has the common name *Copy*, and it is the usage right that decides whether Copilot or an agent can show text from encrypted content.[^c11-copilot-considerations] The label design in [Chapter 02](02-sensitivity-label-architecture.md) and the permissions in [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#mapping-cui-to-sensitivity-labels) therefore decide AI behavior: a CUI Specified sublabel whose rights for authorized holders leave out EXTRACT already keeps that content out of Copilot summaries, while the CUI Basic sublabel, which grants EXTRACT to everyone in the tenant, lets Copilot summarize CUI Basic for anyone who can open it. Both can be right; it has to be a decision.
- **Some protection excludes AI entirely.** Copilot and agents can't access content protected by Double Key Encryption, and Copilot isn't available in an app while a DKE item is open. Unopened SharePoint and OneDrive documents encrypted with user-defined permissions are excluded from Copilot except in two cases, and Copilot doesn't currently recognize the sensitivity labels that protect Teams meetings and chats.[^c11-copilot-arch] S/MIME-protected email isn't returned by Copilot, and Copilot isn't available in Outlook while an S/MIME message is open.[^c11-entra-apps]

One exception runs the other way. The person who applies encryption is the Rights Management owner and always holds EXTRACT, so content a user encrypted is always eligible to be returned to that user by Copilot; the restrictions apply to everyone else.[^c11-copilot-considerations]

**Authority:** Microsoft-recommended (Microsoft Learn, "Considerations to manage Microsoft 365 Copilot," and "Data protection and auditing for Microsoft Copilot," read Nov 11, 2026) for using labels, encryption and DLP as the protection for Copilot; Risk-based recommended (the program's position, for the oversharing risk above) for deciding EXTRACT per sublabel rather than inheriting a default.
**Applies:** License-dependent: Microsoft 365 Copilot is an add-on license, and Purview controls for Copilot need a Purview license (part of Microsoft 365 G3 or G5, or standalone).[^c11-copilot-sd] Environment-dependent: see the availability table in [Prerequisites](#b20-11-prerequisites-ai).

## The AI data decisions

Before any policy, the policy owner records four decisions in the decision record ([Chapter 01](01-data-inventory-and-classification.md#decision-record-template)):

1. **Which AI apps are approved, and for which data.** Microsoft 365 Copilot and Copilot Chat inside the tenant are one class. Enterprise AI apps the agency connects through Microsoft Entra are a second. Third-party AI sites reached in a browser are a third, and most agencies treat them as unapproved for any CUI. The inventory of the apps and agents themselves, with an owner for each, belongs to [Book 17, Chapter 03](../b17-ai-identity/03-the-inventory-as-an-identity-source.md).
2. **Which labels Copilot may process.** Name the sublabels whose content Copilot must not use in a response even for a user who can open the item. DLP for Microsoft 365 Copilot enforces the list (below); the label's own usage rights are the first line.
3. **What the agency does about oversharing before Copilot reaches a population.** The data risk assessment is the input. Remediation is the container and sharing work of [Chapter 04](04-teams-groups-and-sharepoint-containers.md) and [Chapter 07](07-sharepoint-and-onedrive.md), and auto-labeling from [Chapter 09](09-auto-labeling-and-sensitive-information-types.md); a site that can't be fixed in time can be withheld from Copilot with SharePoint Restricted Content Discovery.[^c11-dspm-overshare]
4. **What is captured and who may read it.** Copilot prompts and responses are user content. Who may read them in the activity explorer and in eDiscovery is a privacy and labor question for the senior agency official for privacy and counsel, settled the same way as for Insider Risk Management in [Chapter 10](10-audit-insider-risk-and-communication-compliance.md); [Book 14, Chapter 08](../b14-compliance/08-privacy-pii-processing.md) carries the privacy controls.

**Authority:** Risk-based recommended (the program's position: an AI rollout without these decisions inherits every permission error the tenant already has).
**Applies:** all tenants that license Microsoft 365 Copilot or allow access to third-party AI sites.

## What Purview provides for AI

### Data Security Posture Management for AI, and its successor

Microsoft Purview Data Security Posture Management for AI (DSPM for AI) is the Purview solution that shows how sensitive data is used in AI interactions and creates the policies that govern it. Microsoft has since released a new version of Data Security Posture Management that covers AI apps and agents as well as traditional data, and now names the earlier solution "DSPM for AI (classic)"; most new features go only into the new version.[^c11-dspm-new] The government feature tables still list the solution as "Microsoft Purview Data Security Posture Management for AI" (below), so this chapter uses that name for what the tables cover and says "DSPM" for the newer version, whose government availability Learn doesn't yet state separately.

The newer DSPM groups its work into data security objectives, such as preventing data exposure in Microsoft 365 Copilot interactions, preventing oversharing of sensitive data and preventing exfiltration to risky locations, each with one-click policies and recommended actions. It adds an AI observability page that inventories AI apps and agents with activity in the last 30 days, the activity explorer's AI activities tab, data risk assessments and reports.[^c11-dspm-new] Some of its AI-assisted features run on Microsoft Security Copilot agents; those are outside this workbook's scope, and nothing in this chapter depends on them.

### Prerequisites Purview names

Microsoft lists the prerequisites for DSPM for AI by what is being monitored:[^c11-dspm-considerations]

| To monitor | Prerequisite |
|---|---|
| Microsoft 365 Copilot and agents | Purview auditing turned on (the default); users assigned a Microsoft 365 Copilot license |
| Other AI apps in Microsoft Edge | An Edge configuration policy that turns on the Purview integration in Edge |
| Third-party generative AI sites | Devices onboarded to Microsoft Purview, for visibility of sensitive data shared with AI sites and for endpoint DLP that warns or blocks; the Microsoft Purview browser extension deployed to Windows users, to discover visits to AI sites through an Insider Risk Management policy and for endpoint DLP in Chrome |
| Entra-registered AI apps | Integration with the Microsoft Purview SDK |
| AI apps other than Microsoft 365 Copilot | Pay-as-you-go billing set up for the organization, where the portal says it applies |

Restricted administrators scoped by administrative units can't create the one-click policies that apply to all users; an unrestricted administrator must create them.[^c11-dspm-considerations]

### The one-click policies

DSPM for AI creates policies in other Purview solutions from its recommendations, and they can be edited where they live. The ones a federal tenant cares about most:[^c11-dspm-considerations]

| Policy (as Purview names it) | Solution | What it does | Mode when created |
|---|---|---|---|
| DSPM for AI: Detect sensitive info added to AI sites | DLP | Discovers sensitive content pasted or uploaded to AI sites in Edge, Chrome and Firefox | Audit only, all users |
| DSPM for AI - Detect when users visit AI sites | Insider Risk Management | Detects browser visits to AI sites | — |
| DSPM for AI - Detect risky AI usage | Insider Risk Management | Calculates user risk from risky prompts and responses in Copilot, agents and other AI apps | — |
| DSPM for AI - Unethical behavior in AI apps | Communication Compliance | Detects sensitive information in prompts and responses | All users |
| DSPM for AI - Block sensitive info from AI sites | DLP | Block with override, through Adaptive Protection, for elevated-risk users pasting or uploading sensitive information to AI apps in Edge, Chrome and Firefox | Test mode, all users |
| DSPM for AI - Protect sensitive data from Copilot processing | DLP | Blocks Microsoft 365 Copilot and agents from processing items with the labels selected | — |

Two cautions apply. A policy that uses Adaptive Protection turns Adaptive Protection on, with default risk levels for all users, if it isn't on already, which pulls Insider Risk Management into scope and with it the privacy and labor review in [Chapter 10](10-audit-insider-risk-and-communication-compliance.md). And the "Block elevated risk users from submitting prompts to AI apps in Microsoft Edge" and "Block sensitive info from AI apps in Edge" policies include unmanaged apps, so users in scope are blocked from using unprotected browsers.[^c11-dspm-considerations] Neither is a reason not to use them; both are reasons to pilot them.

### The activity explorer's AI events

The activity explorer records four AI events: *AI interaction* (prompts and responses; for Microsoft 365 Copilot this needs auditing on), *AI website visit*, *DLP rule match* during an AI interaction (including DLP for Microsoft 365 Copilot) and *Sensitive info types* found in an AI interaction. Known limits: the AI interaction event doesn't always show the prompt and response text, shows none for a user whose mailbox isn't in Exchange Online, and the sensitive information types event doesn't show the user's risk level.[^c11-dspm-considerations] The same interactions are in the audit log: the `CopilotInteraction` operation records a user entering prompts in Copilot, and the text of the prompt is reached through Content Search or the activity explorer, not the audit record.[^c11-audit-activities]

### Data risk assessments for oversharing

A default data risk assessment runs weekly over the 100 most-used SharePoint sites and reports items found, sensitive data detected and links that share data with anyone; the first results take about four days. Custom assessments can target chosen users and sites, and, with a registered Entra application, scan at item level on up to ten SharePoint sites (OneDrive isn't supported for item-level scanning). From a site's **Protect** tab an administrator can restrict access by label through DLP for Copilot, withhold the site from Copilot with Restricted Content Discovery, create an auto-labeling policy for unlabeled sensitive files, or create a retention policy for content not accessed in three years; the **Monitor** tab leads to a SharePoint site access review.[^c11-dspm-overshare] Results can be exported to Excel, CSV, JSON or TSV, which is how they become evidence.

The item-level scan's Entra application needs Microsoft Graph application permissions including `Files.ReadWrite.All` and `Sites.ReadWrite.All` and a client secret.[^c11-dspm-considerations] That is a high-privilege workload identity: register it under [Book 17](../b17-ai-identity/index.md) and [Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md)'s rules, with an owner, the shortest secret lifetime the portal accepts and a removal date, or don't use item-level scanning.

### DLP for Microsoft 365 Copilot

DLP has a policy location for Microsoft Copilot, Copilot Chat and Copilot Cowork. It supports four protections:[^c11-dlp-copilot]

| Condition | Action | Effect |
|---|---|---|
| Content contains a sensitivity label | Prevent Copilot from processing content | Copilot doesn't use the item's content in the response; the item can still appear in citations |
| Prompt contains sensitive information types | Prevent processing of the prompt | Copilot doesn't respond, and the prompt isn't used for internal or web search |
| Prompt contains sensitive information types | Prevent web searches | External web search isn't used as a grounding source for that prompt |
| Email received from external users (preview) | Prevent Copilot from processing content | External email is excluded from grounding, summarization and citation |

The label rule covers stored and open files and email sent on or after January 1, 2025; calendar invites aren't covered. A rule can't combine sensitive information types and sensitivity labels; use one rule for each in the same policy. The location is available only in the **Custom** template and disables every other location for that policy, simulation mode is supported, and a policy change can take up to four hours to reach Copilot. In Word, Excel and PowerPoint the policy is evaluated when the file opens, so a label applied mid-session takes effect at the next open.[^c11-dlp-copilot]

Licensing differs by protection: DLP that restricts Copilot from processing files and email is included in Microsoft 365 E5 and Office 365 E5 and the Purview suites, not in E3; DLP for prompts is available to all Copilot users.[^c11-purview-sd] A tenant that holds only G3-level Purview licensing has the label usage rights and the prompt protection but not the file and email exclusion; that is a licensing decision to record, not a failed control ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#a-normalized-result-taxonomy)).

### Unapproved AI sites

For AI sites the agency hasn't approved, the controls are the endpoint and browser DLP of [Chapter 08](08-dlp-and-endpoint-controls.md) applied to a list of AI sites. Purview publishes the list of supported third-party AI sites it can see.[^c11-dspm-considerations] Visibility needs onboarded devices and, for Chrome, the Purview browser extension. Network-level detection through a secure access service edge integration is possible but depends on the partner's implementation;[^c11-dspm-considerations] [Book 09](../b09-network/index.md) carries the network design. Out of scope by decision: macOS and Linux devices.

## How: govern sensitive data in AI interactions

The procedure takes Microsoft 365 Copilot first, because it sits inside the boundary and its controls are the labels already built, then unapproved AI sites.

### Prerequisites {#b20-11-prerequisites-ai}

- Sensitivity labels published and in use ([Chapter 03](03-label-publication-and-defaults.md)), with labels enabled for Office files in SharePoint and OneDrive ([Chapter 07](07-sharepoint-and-onedrive.md)). Without that, the encrypted files Copilot and agents can work with are limited to files open in Office apps on Windows.[^c11-entra-apps]
- Purview audit on ([Chapter 10](10-audit-insider-risk-and-communication-compliance.md)).
- Devices onboarded to Purview ([Chapter 08](08-dlp-and-endpoint-controls.md)) for third-party AI site coverage.
- Roles: Compliance Administrator or the Microsoft Purview Compliance Administrator role group for DSPM; an unrestricted administrator for the one-click policies; Exchange Online Audit Logs role to check auditing.[^c11-dspm-new][^c11-audit-on] Hold them through PIM ([Book 04](../b04-access/index.md)).
- Licenses: Microsoft 365 Copilot add-on for each Copilot user; Purview licensing for the Purview controls; E5-level Purview for the DLP file and email exclusion; pay-as-you-go billing where the portal asks for it for non-Microsoft AI apps.[^c11-copilot-sd][^c11-purview-sd][^c11-dspm-considerations]

Government-cloud availability, read Nov 11, 2026:

| Feature | Commercial | GCC | GCC High | DoD | Source |
|---|---|---|---|---|---|
| Microsoft 365 Copilot (work data grounding) | Available | Available | Available | Available | [^c11-copilot-sd] |
| Web grounding for Copilot | Available | Available, off by default | Available, off by default | Available, off by default | [^c11-copilot-sd] |
| Copilot in Teams (chat, channel, meetings) | Available | Available | Not currently available | Available | [^c11-copilot-sd] |
| Copilot in SharePoint; SharePoint agents | Available | Available | Not currently available | Available | [^c11-copilot-sd] |
| Declarative agents | Available | Available | Available (only Agent Builder and admin-published agents) | Not currently available | [^c11-copilot-sd] |
| Purview controls for Microsoft Copilot and Copilot Chat | Available | Available | Available (the footnote says Insider Risk Management isn't currently available in GCC High) | Available | [^c11-copilot-sd] |
| DSPM for AI: create policies and view analytics for AI apps | Available | Available; no "browse to URL" policy; only Microsoft Copilot and supported AI sites | Available; no "browse to URL" policy; only supported AI sites | Available; no "browse to URL" policy; only supported AI sites | [^c11-gcc][^c11-gcch][^c11-dod] |
| Data Security Posture Management (current version), AI observability, data risk assessments | Available | not yet specified | not yet specified | not yet specified | [^c11-dspm-new] |
| DLP for Microsoft 365 Copilot location (labels, prompts) | Available | not yet specified as its own row; covered by the Purview controls row above | not yet specified as its own row | not yet specified as its own row | [^c11-dlp-copilot][^c11-copilot-sd] |
| DLP to restrict Copilot from processing external email | Preview | not yet specified | not yet specified | not yet specified | [^c11-dlp-copilot] |
| Endpoint DLP (needed for third-party AI sites) | Available | Available | Available | Available | [^c11-gcc][^c11-gcch][^c11-dod] |
| Insider Risk Management (risky AI usage, AI site visits) | Available | Available (core) | Available on the Purview page; not currently available per the Copilot page footnote | Available (core) | [^c11-gcch][^c11-copilot-sd] |
| Communication Compliance (AI prompts and responses) | Available | Available | Available | Available | [^c11-gcc][^c11-gcch][^c11-dod] |
| SharePoint Restricted Content Discovery | Available | not yet specified | not yet specified | not yet specified | [^c11-dspm-overshare] |

Two Learn pages disagree on Insider Risk Management in GCC High: the Purview GCC High planning page lists its core features as Available, while the Microsoft Copilot service description's footnote says it "isn't currently available for GCC-High." Until Microsoft reconciles them, a GCC High tenant treats the Insider Risk policies in this chapter as unavailable and confirms with its Microsoft account team; the decision record carries the conflict.

**Applies:** License-dependent (above). Environment-dependent: in GCC High and DoD only supported AI sites are visible to DSPM for AI, and in GCC only Microsoft Copilot and supported AI sites; no tenant in a government cloud can create the "browse to URL" policy.[^c11-gcc][^c11-gcch][^c11-dod]

### Pilot {#b20-11-pilot-ai}

Choose a pilot of 25 to 50 Copilot-licensed users from two or three business units, including the help desk lead and a records officer, and none whose work is mostly CUI Specified. Before they get Copilot, run a custom data risk assessment for the sites they use. Success: the assessment's oversharing findings for those sites are remediated or accepted in writing, the pilot's Copilot responses never cite an item the user couldn't open directly, and the DLP simulation shows matches only on the labels the decision record names.

### Report-only or audit phase {#b20-11-audit-ai}

Every policy below starts in simulation (`TestWithoutNotifications`) or, for one-click DLP policies, the audit or test mode DSPM creates them in. Run it for at least two weeks across a month-end, when report and budget files move most. Read three things from it: the DLP rule matches in the activity explorer's AI activities tab, the sensitive information types detected in prompts, and the AI website visits by site. A rule that matches content the decision record didn't intend is fixed before enforcement.

The steps, in Security & Compliance PowerShell and Exchange Online PowerShell. Placeholders, used once each: `<admin>@contoso.example` is the operator's account; `<copilot-pilot>@contoso.example` is a mail-enabled group of pilot users; `<label-guid>` is a sensitivity label's GUID from `Get-Label`. Commands were checked against Learn on Nov 11, 2026; run them against a test tenant first. In GCC High add `-ExchangeEnvironmentName O365USGovGCCHigh` to `Connect-ExchangeOnline`, and in DoD `-ExchangeEnvironmentName O365USGovDoD`; for `Connect-IPPSSession` add the parameters in the comment.[^c11-scc-connect][^c11-exo-connect]

**Step 1. Confirm that auditing is on** (Exchange Online PowerShell; the value is always `False` in Security & Compliance PowerShell, so don't read it there).[^c11-audit-on]

```powershell
Connect-ExchangeOnline -UserPrincipalName <admin>@contoso.example
Get-AdminAuditLogConfig | Format-List UnifiedAuditLogIngestionEnabled
# If False:
Set-AdminAuditLogConfig -UnifiedAuditLogIngestionEnabled $true
```

**Step 2. Confirm Copilot interactions are being recorded** for a pilot user who has used Copilot today.

```powershell
Search-UnifiedAuditLog -StartDate (Get-Date).AddDays(-1) -EndDate (Get-Date) `
  -Operations CopilotInteraction -ResultSize 50 |
  Select-Object CreationDate, UserIds, Operations
```

**Step 3. Turn on DSPM.** In the Microsoft Purview portal, **Solutions** > **DSPM** (or **DSPM for AI** where only the classic solution is offered), accept the initial setup tasks, and allow about a day for data. Create the one-click policies the decision record approves from **Tasks and actions** > **Remediation actions**, then scope each to `<copilot-pilot>@contoso.example` in its own solution.[^c11-dspm-new][^c11-dspm-considerations]

**Step 4. Create the DLP for Microsoft 365 Copilot policy in simulation**, keeping the labels the decision record names out of Copilot processing. The location value is Microsoft's fixed identifier for the Copilot location, from Learn's example.[^c11-new-dlp]

```powershell
# GCC High: Connect-IPPSSession -UserPrincipalName <admin>@contoso.example `
#   -ConnectionUri https://ps.compliance.protection.office365.us/powershell-liveid/ `
#   -AzureADAuthorizationEndpointUri https://login.microsoftonline.us/organizations
# DoD:      -ConnectionUri https://l5.ps.compliance.protection.office365.us/powershell-liveid/ (same endpoint URI)
Connect-IPPSSession -UserPrincipalName <admin>@contoso.example

# Find the GUID of each label to exclude (for example the CUI Specified sublabels).
Get-Label | Format-List Priority,Name,DisplayName,Guid

$labelGuid = "<label-guid>"
$loc = '[{"Workload":"Applications","Location":"470f2276-e011-4e9d-a6ec-20768be3a4b0","Inclusions":[{"Type":"Tenant","Identity":"All"}]}]'

New-DlpCompliancePolicy -Name "B20-Copilot-Exclude-CUI-SP" -Locations $loc `
  -EnforcementPlanes @("CopilotExperiences") -Mode TestWithoutNotifications

$advRule = @{
  "Version" = "1.0"
  "Condition" = @{
    "Operator" = "And"
    "SubConditions" = @(
      @{
        "ConditionName" = "ContentContainsSensitiveInformation"
        "Value" = @(
          @{ "groups" = @(
              @{ "Operator" = "Or"; "name" = "Default"
                 "labels" = @( @{ "name" = $labelGuid; "type" = "Sensitivity" } ) } ) }
        )
      }
    )
  }
} | ConvertTo-Json -Depth 100

New-DlpComplianceRule -Name "B20-Copilot-Exclude-CUI-SP-Rule" -Policy "B20-Copilot-Exclude-CUI-SP" `
  -AdvancedRule $advRule -RestrictAccess @(@{setting="ExcludeContentProcessing";value="Block"})
```

To scope the pilot, replace the `Inclusions` value with the pilot group before creating the policy, as Learn's example notes. Add a second rule in the same policy for prompts that contain sensitive information types (for example U.S. Social Security numbers), from the portal's **Custom** template, because a rule can't hold both conditions.[^c11-dlp-copilot]

### Enforcement {#b20-11-enforcement-ai}

**Step 5. Enforce, ring by ring.**

```powershell
Set-DlpCompliancePolicy -Identity "B20-Copilot-Exclude-CUI-SP" -Mode Enable
```

Move the one-click DLP policies for AI sites out of test mode in their own solution, in the same rings.

**Change safety**

| Ring | Scope | Exit criteria |
|---|---|---|
| 0 | The platform team's own Copilot users | A labeled CUI Specified test file is cited but not summarized; a prompt with a test SSN is refused |
| 1 | The pilot group | Two weeks with no unexplained DLP matches; help desk tickets about Copilot refusals below the threshold set in the decision record |
| 2 | Early adopters, one business unit at a time, each after its data risk assessment is remediated | The unit's oversharing findings remediated or accepted |
| 3 | Every Copilot-licensed user | Rings 0 to 2 clean; the monthly assessment review in place |

- **Emergency access:** these policies govern what Copilot returns and what users can paste into AI sites; they don't block sign-in, so no emergency access exclusion is needed. Emergency access accounts aren't licensed for Copilot.
- **Change window:** business hours, Tuesday to Thursday, with the platform owner and a help desk lead on hand; allow four hours for a policy change to reach Copilot.[^c11-dlp-copilot]
- **Backout triggers:** Copilot refusing or omitting content with no matching label in the activity explorer; a blocked AI site the decision record approved; help desk volume on AI blocks above the decision record's threshold in any business day.
- **Post-change validation:** step 6, after each ring.

**Step 6. Validate.** As a ring member, with a test file labeled with an excluded sublabel in a site the user can open: ask Copilot to summarize it, and expect a citation without a summary. Put a synthetic test value into a Copilot prompt, one the security team keeps for DLP tests that matches the U.S. Social Security number type at the rule's confidence (never a real number), and expect a refusal. On an onboarded device, paste the same test value into a supported AI site in the browser, and expect the block or the warn the policy sets. Then confirm each produced its event:

```powershell
Search-UnifiedAuditLog -StartDate (Get-Date).AddHours(-4) -EndDate (Get-Date) `
  -RecordType DLPEndpoint -ResultSize 50 | Select-Object CreationDate, UserIds, Operations
```

and find the *DLP rule match* events in **DSPM** > **Discover** > **Activity explorer** > **AI activities**.[^c11-dspm-considerations]

### Rollback {#b20-11-rollback-ai}

The operator, or the platform owner if the operator isn't available, puts the policy back into simulation; the change reaches Copilot within four hours.

```powershell
Set-DlpCompliancePolicy -Identity "B20-Copilot-Exclude-CUI-SP" -Mode TestWithoutNotifications
# Or turn it off entirely:
Set-DlpCompliancePolicy -Identity "B20-Copilot-Exclude-CUI-SP" -Mode Disable
```

One-click DLP policies roll back the same way in the DLP solution. A deleted DSPM collection or one-click policy shows **PendingDeletion** until deletion completes.[^c11-dspm-considerations] Removing a site from Restricted Content Discovery restores Copilot's access to it. Rollback leaves the labels and their usage rights in place: those are the first line and aren't rolled back with the AI policies.

### Exclusions {#b20-11-exclusions-ai}

- No user is excluded from the Copilot label rule; it doesn't block access to the item, only Copilot's use of it.
- A business unit whose approved workflow needs Copilot to summarize a label the rule excludes gets a narrower label or a reviewed exception, not an exclusion from the policy: the exception names the label, the group, the approver (policy owner and ISSO) and a review date no more than 90 days out.
- Approved third-party AI sites are listed by name in the decision record and removed from the block list; every other AI site stays blocked or warned.
- Emergency access accounts: not applicable (no sign-in restriction).

### Telemetry {#b20-11-telemetry-ai}

- Unified audit log: `CopilotInteraction`, DLP rule matches, and the admin events for policy changes. Route them to the security information and event management system with the rest of the Purview telemetry in [Chapter 10](10-audit-insider-risk-and-communication-compliance.md) and [Book 12, Chapter 04](../b12-security-operations/04-platform-and-m365-telemetry.md).
- DSPM activity explorer AI activities, reports and data risk assessment exports.
- Insider Risk Management alerts from the risky AI usage policy, where available, to the triage path in [Chapter 10](10-audit-insider-risk-and-communication-compliance.md).
- A detection in [Book 12, Chapter 11](../b12-security-operations/11-detection-engineering-and-response.md)'s library for repeated sensitive-information pastes to AI sites by one user, alongside FMP-DET-06 for DLP override patterns.

### Evidence {#b20-11-evidence-ai}

**Evidence checklist**

- [ ] **Configuration:** the dated export of `Get-DlpCompliancePolicy` and `Get-DlpComplianceRule` for the Copilot and AI-site policies, the DSPM policy list, and the label definitions showing each sublabel's usage rights (EXTRACT or not), kept in the configuration repository ([Chapter 12](12-operations-and-evidence.md#evidence-catalog))
- [ ] **Operational:** the activity explorer AI activities export and the `CopilotInteraction` audit search for the period, retained with the audit data
- [ ] **Test:** the step 6 record: the labeled test file cited but not summarized, the sensitive prompt refused, the AI-site paste blocked, each with date, tester and the event it produced
- [ ] **Exception:** approved AI sites and label exceptions in the exclusion register, with approver and expiry
- [ ] **Assessor-ready artifact:** the data risk assessment export before and after remediation for each ring, and the closure-chain entry for the AI finding ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#the-closure-chain))

### Day-two ownership {#b20-11-day-two-ownership-ai}

The **policy owner** owns the list of approved AI apps and the labels excluded from Copilot, reviewed every quarter and whenever Microsoft adds a Copilot feature in the agency's cloud. The **platform owner** owns DSPM, the DLP policies and the monthly review of the default data risk assessment; each month's export goes into the evidence store. The **operator** runs policy changes through change control ([Book 13, Chapter 04](../b13-governance/04-change-control-and-provenance.md)). The **security monitor** triages AI-related DLP and insider risk alerts. The **help desk** answers "Copilot won't summarize this file" with the label's explanation, not a workaround, using the user guidance in [Book 16](../b16-people/index.md). The **assessor** reads the evidence above. Drift looks like a Copilot DLP policy back in simulation, a one-click policy deleted, a new AI site appearing in visits with no decision, or the oversharing count rising between assessments. The full RACI is in [Chapter 12](12-operations-and-evidence.md#raci).

## Key takeaways

- Copilot works in the user's security context and honors labels: a user needs both VIEW and EXTRACT on encrypted content for Copilot to summarize it, so the usage rights in each sublabel are an AI decision.
- Oversharing is the AI risk an agency already has. Run the data risk assessment and fix what it finds before Copilot reaches a population.
- DLP for Microsoft 365 Copilot keeps chosen labels out of Copilot processing and sensitive prompts out of web grounding; the file and email exclusion is E5-level licensing, and its absence is a licensing decision, not a failed control.
- Government availability is uneven: DSPM for AI sees only supported AI sites in GCC High and DoD, several Copilot features aren't available in GCC High, and Learn's two pages disagree on Insider Risk Management in GCC High.
- Agent identities are Book 17's; Security Copilot is out of scope.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 10 — Audit, Insider Risk and Communication Compliance](10-audit-insider-risk-and-communication-compliance.md) · [Book index](index.md) · [Next: Chapter 12 — Operations and Evidence →](12-operations-and-evidence.md)
:::

[^c11-copilot-arch]: Microsoft Learn, "Data protection and auditing for Microsoft Copilot," section "How Microsoft Copilot works with sensitivity labels and encryption" (permissions first; EXTRACT and VIEW for encrypted content; VIEW without EXTRACT returns a link; highest-priority label shown and inherited; protection while open outside the tenant; user-defined permissions, Double Key Encryption, Teams meetings and chats), <https://learn.microsoft.com/copilot/plan/architecture-data-protection-auditing> (accessed Nov 11, 2026).
[^c11-copilot-considerations]: Microsoft Learn, "Considerations to manage Microsoft 365 Copilot and Channel Agent in Teams for security and compliance," section "Information protection considerations for Microsoft 365 Copilot" (EXTRACT is the usage right with the common name Copy that determines whether Copilot or agents display text from encrypted content; the Rights Management owner always has EXTRACT), <https://learn.microsoft.com/purview/ai-m365-copilot-considerations> (accessed Nov 11, 2026).
[^c11-entra-apps]: Microsoft Learn, "Use Microsoft Purview to manage data security & compliance for Entra-registered AI apps," section "Capabilities supported" (without labels enabled for SharePoint and OneDrive, encrypted files Copilot and agents can access are limited to data in use from Office apps on Windows; S/MIME-protected email isn't returned by Copilot), <https://learn.microsoft.com/purview/ai-entra-registered> (accessed Nov 11, 2026).
[^c11-copilot-sd]: Microsoft Learn, "Microsoft Copilot" service description, section "Feature availability" (availability by Commercial, GCC, GCCH and DoD; web grounding not enabled by default for government clouds; Purview controls require a Purview license, part of Microsoft 365 G3/G5 or standalone; "Insider Risk Management isn't currently available for GCC-High"), <https://learn.microsoft.com/office365/servicedescriptions/office-365-platform-service-description/microsoft-365-copilot> (accessed Nov 11, 2026).
[^c11-dspm-overshare]: Microsoft Learn, "Prevent oversharing with data risk assessments from Data Security Posture Management" (generative AI amplifies oversharing; weekly default assessment of the top 100 SharePoint sites; custom and item-level assessments; Protect and Monitor actions including Restricted Content Discovery; export formats; limits), <https://learn.microsoft.com/purview/data-security-posture-management-oversharing> (accessed Nov 11, 2026).
[^c11-dspm-new]: Microsoft Learn, "Learn about Data Security Posture Management" (current version; DSPM for AI renamed classic; data security objectives; AI observability; activity explorer AI activities tab; data risk assessments; Compliance Administrator role; Security Copilot integrations), <https://learn.microsoft.com/purview/data-security-posture-management-learn-about> (accessed Nov 11, 2026).
[^c11-dspm-considerations]: Microsoft Learn, "Considerations for DSPM for AI to manage data security and compliance protections for AI interactions - (classic)," sections "Prerequisites for Data Security Posture Management for AI," "Prerequisites for Microsoft 365 item-level scanning for data risk assessments," "One-click policies from Data Security Posture Management for AI" and "Activity explorer events," <https://learn.microsoft.com/purview/dspm-for-ai-considerations> (accessed Nov 11, 2026).
[^c11-audit-activities]: Microsoft Learn, "Audit log activities," section "Microsoft 365 Copilot admin activities" (`CopilotInteraction`: a user entered prompts in Copilot; prompt text through Content Search or the activity explorer), <https://learn.microsoft.com/purview/audit-log-activities> (accessed Nov 11, 2026).
[^c11-dlp-copilot]: Microsoft Learn, "Learn about using Microsoft Purview Data Loss Prevention to protect interactions with Microsoft 365 Copilot, Copilot Chat, and Cowork" (the four protections; supported conditions and actions; external email in preview; email sent on or after January 1, 2025; calendar invites not supported; Custom template only; simulation; up to four hours to take effect; evaluation at file open), <https://learn.microsoft.com/purview/dlp-microsoft365-copilot-location-learn-about> (accessed Nov 11, 2026).
[^c11-purview-sd]: Microsoft Learn, "Microsoft Purview service description," section "Microsoft Purview Data Loss Prevention (DLP) for Microsoft Copilot" (DLP to restrict Copilot from processing files and emails included in Microsoft 365 E5/A5, Office 365 E5/A5 and the Purview suites, not in E3; DLP for prompts available to all Copilot users), <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/microsoft-purview-service-description> (accessed Nov 11, 2026).
[^c11-gcc]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions – GCC deployments," Step 4 (DSPM for AI Available, note 2: "Browse to URL policy cannot be created. Only Microsoft Copilot and supported AI sites are currently available in DSPM for AI within GCC"; endpoint DLP, Insider Risk Management and Communication Compliance rows), <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-gcc-deployments> (accessed Nov 11, 2026).
[^c11-gcch]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions – GCC High deployments," Step 4 (DSPM for AI Available, note 2: only supported AI sites in GCC-H and DoD; Insider Risk Management core features Available), <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-gcc-high-deployments> (accessed Nov 11, 2026).
[^c11-dod]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions - DoD deployments," Step 4 (DSPM for AI Available, note 2 as for GCC High), <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-dod-deployments> (accessed Nov 11, 2026).
[^c11-audit-on]: Microsoft Learn, "Turn auditing on or off" (verify with `Get-AdminAuditLogConfig` in Exchange Online PowerShell; the value is always False in Security & Compliance PowerShell; turn on with `Set-AdminAuditLogConfig -UnifiedAuditLogIngestionEnabled $true`; Audit Logs role), <https://learn.microsoft.com/purview/audit-log-enable-disable> (accessed Nov 11, 2026).
[^c11-new-dlp]: Microsoft Learn, "New-DlpCompliancePolicy," Example 4 (DLP policy for Microsoft 365 Copilot with the Copilot location, `-EnforcementPlanes CopilotExperiences`, an advanced rule matching a label and `-RestrictAccess` `ExcludeContentProcessing`), <https://learn.microsoft.com/powershell/module/exchangepowershell/new-dlpcompliancepolicy> (accessed Nov 11, 2026).
[^c11-scc-connect]: Microsoft Learn, "Connect to Security & Compliance PowerShell," Step 2 (GCC High and DoD `ConnectionUri` and `AzureADAuthorizationEndpointUri` values), <https://learn.microsoft.com/powershell/exchange/connect-to-scc-powershell> (accessed Nov 11, 2026).
[^c11-exo-connect]: Microsoft Learn, "Connect to Exchange Online PowerShell," Step 2 (`-ExchangeEnvironmentName` values `O365USGovGCCHigh` and `O365USGovDoD`), <https://learn.microsoft.com/powershell/exchange/connect-to-exchange-online-powershell> (accessed Nov 11, 2026).
