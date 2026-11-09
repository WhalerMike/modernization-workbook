---
title: "Building an internal Ticket-to-Machine task catalog"
subtitle: "List your agency's day-to-day Ticket-to-Machine tasks in a workbook you download at work, fill in inside your agency, and never send back"
description: "A one-page guide to the Ticket-to-Machine task catalog pack: a macro-free Excel workbook, a CSV template, 25 fictional worked examples and a checker that turns each row into a sample ticket contract. It covers the split between the public workbook and the agency's own work, the steps, how to use Microsoft 365 Copilot Chat and an agency-hosted GitHub Copilot to draft and review rows, where to store the filled catalog and how to label it, the common task types, and the rules for tasks an AI agent performs."
doc-type: workbook-guide
audience: [Technical, Customer]
family: guides
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
research-status: draft
research-type: implementation guide
research-book: "Book 13"
review-status: approved
reviewed-sha256: 0879a25226fca75d28cf2bfd9853d10bb941effd445e52db96d108629c2d12e4
last-reviewed: 2026-11-09
---
# Building an internal Ticket-to-Machine task catalog {.unnumbered}

*A catalog of your own tasks is how the loop stops being an idea: each row says who asks, who approves, what runs, as which identity, and what re-read proves it worked.*

::: {.callout-note}
## In this guide
What the task catalog pack is, and the one-way split between this public workbook and your agency's work. The steps to fill it in, the seven checks, and the common task types. How to use Copilot to draft and review rows. Where to keep the filled catalog and how to label it. Then the rules for a task an AI agent performs, and what couldn't be verified.
:::

::: {.callout-important}
## Program design, with fictional examples
The lanes, severities and response windows come from [Book 13, Appendix B](../b13-governance/appendix-b-ticket-to-machine-reference.md). They are the program's design, not federal requirements. Every example in the pack is invented and set at contoso.example.
:::

## Download

**[ticket-to-machine-task-catalog.zip](../../../downloads/ticket-to-machine-task-catalog.zip)**: the workbook `catalog_template.xlsx` (no macros), `catalog_template.csv`, 25 worked examples in `examples.csv`, the Copilot prompt sheet `copilot-prompts.md`, and `check_catalog.py` with its tests. It also carries the [integration kit's](snow-sailpoint-integration-kit.md) Python clients, because the checker reads its vocabulary from the kit's `finding_contract.py`. Rebuilt on every site deploy from [`examples/ttm-task-catalog`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/ttm-task-catalog).

## Two sides, one direction

| This public workbook | Your agency |
|---|---|
| Publishes the neutral template, the checks, the fictional examples and the prompts | Downloads the pack at work |
| Holds no agency data, now or later | Fills in its real tasks, inside its boundary, with its own tools |
| Never receives a filled catalog | Keeps the filled catalog, labeled and stored as its ISSO says |

Nothing comes back. Don't open an issue or a pull request with your rows, and don't paste them into any tool outside your agency.

## The steps

1. **Download** the pack at work and open `catalog_template.xlsx`.
2. **Read the examples.** The Examples sheet has 25 rows. EX-P1, EX-P2 and EX-P3 fail on purpose, so you can see each check fire on the Example checks sheet.
3. **Add your tasks** on the Tasks sheet, one row per task. Every enumerated column has a drop-down. The values come from the integration kit's [finding contract](snow-sailpoint-integration-kit.md) and from Book 13, Appendix B.
4. **Name the five clauses** of the [request chain](../b13-governance/appendix-b-ticket-to-machine-reference.md#the-five-clause-request-chain) for each task: who asks (C1), who approves (C2), what runs and as which identity (C3), the re-read that proves closure (C4), and the evidence kept (C5). The response window fills in from the severity: P1 immediate, P2 1 hour, P3 24 hours, P4 72 hours.
5. **Map controls and KSIs** from the Controls sheet. It suggests NIST SP 800-53 controls for each task type, and the FedRAMP 20x indicators the workbook already maps to them. KSIs are provider-side indicators: your agency doesn't report them, but lines its own evidence up with what its providers report ([Book 00, Appendix B](../b00-orientation/appendix-b-engagement-archetype.md)). Your ISSO decides the final controls.
6. **Fix every row the Checks sheet marks FIX.** The seven checks need no macros and no code. A row needs a fix when:
   - the owner, the approver or the re-read check is blank;
   - the severity differs from its drift class's default and Notes doesn't say why;
   - a class Book 13 sends to a person first (`missing_identity`, `orphan_account`, `unauthorized_write`) uses a machine lane;
   - no evidence is named;
   - no control is mapped;
   - a high-impact task has no human approval before it runs;
   - an AI agent does the work without a sponsor, a human approval for high-impact or human-decision work, or an independent re-read.
7. **Review and approve.** Each task's owner and your ISSO review the rows, then set Status to Approved.
8. **Optional: run the checker**, if your agency allows Python. Save the Tasks sheet as CSV UTF-8, then run `python check_catalog.py catalog.csv`. It applies the same seven checks and writes a sample typed-finding payload for each row with a drift class. The integration kit's `finding_contract.py --validate` accepts those payloads, so a catalog row becomes the contract its tickets follow.

On the pack's own examples, the checker reports:

```
25 rows: 22 PASS, 3 FIX; 17 sample payloads, 17 accepted by finding_contract
```

The three FIX rows are the practice rows. The pack's README shows the full output.

## Common task types

The Controls sheet lists these task types with their usual drift class, lane and controls. Each has a worked example.

| Task type | Usual lane | Suggested controls |
|---|---|---|
| Joiner, mover, leaver | Machine, gated | AC-2; AC-6 for a mover |
| Access request | Machine, gated | AC-2, AC-3, AC-5 |
| Attribute correction | Machine, gated (fix the source) | AC-2, CA-7 |
| Stale access removal, contractor end date | Machine, gated | AC-2, AC-6 |
| Orphan account; service account owner leaving | Human decision, then gated (the owner decides) | AC-2, CA-7, CM-8 |
| Certificate renewal | Protocol-enforced | SC-12, SC-17 |
| Emergency access check | Human decision | AC-2, SI-4 |
| Privileged role activation review | Human decision | AC-6, AU-10, CM-5(1) |
| Group owner change | Machine, gated | AC-2, AC-5 |
| Failed provisioning retry | Human decision | AC-2, CA-7 |
| Schema drift | Machine, gated | CM-3, CM-4(2) |
| Unauthorized direct write | Human decision | CM-5(1), CM-6(2), AU-10, SI-4 |
| Admin consent request triage | Human decision | AC-3, AC-6, AU-12 |
| App registration lifecycle request | Machine, gated, with human approval | AC-2, AC-6, CM-3, IA-5 |
| ImmutableId update (hard match) | Human decision | AC-2, IA-4, CM-3 |
| Integration credential issued or rotated | Machine, gated | IA-5, AC-6, AU-12 |
| Request through ServiceNow Otto, the Virtual Agent or other intake | Machine, gated | AC-2, AC-5, AU-12 |
| ServiceNow Otto (or an AI agent it routes to) takes an action | Machine, gated, with human approval | AC-2, AC-6, AC-6(5), AU-2, AU-12, CM-3, CM-8(4) |

: Task types in the Controls sheet {.striped .hover}

Notes on the Microsoft tasks, from Microsoft Learn:

- **Admin consent request triage.** With the admin consent workflow on, reviewers get an email when a user requests consent, and reminders before a request expires; the expiry is a setting in days. Being a reviewer doesn't grant the right to approve: the reviewer needs a role that can grant the consent.[^cat-acw] Cloud Application Administrator and Application Administrator can grant consent for any permission except Microsoft Graph application permissions; Privileged Role Administrator can grant any, but a request for a Graph application permission in the workflow needs a Global Administrator, the only role that can approve those requests ([Book 04, Chapter 06](../b04-access/06-who-decides-access.md#who-approves-admin-consent)).[^cat-grant] The request is an `appConsentRequest` in Microsoft Graph.[^cat-acr] The re-read reads the grant: `oauth2PermissionGrants` for delegated permissions,[^cat-grant] or the service principal's `appRoleAssignments` for application permissions. The pack calls the notification "Microsoft's notification email"; Learn doesn't name its sender for this workflow.
- **App registration lifecycle.** Deleting an application moves it to deleted items, where it can be restored within 30 days.[^cat-appdel] Restoring an application through Graph doesn't restore its service principal; that takes a second restore.[^cat-restore] The credential follows the [non-person identity guide's](non-person-identity-implementation.md) rules: a certificate or a federated credential, not a long-lived secret.
- **ImmutableId update.** Microsoft Entra Connect matches a new on-premises object to a cloud object by its source anchor, by default the base64 of the AD object's `mS-DS-ConsistencyGuid` or `objectGUID`, set as the cloud object's ImmutableId: a hard match. The cloud object is then managed on premises, and its attributes are overwritten with the on-premises values. A conflict fails with an `AttributeValueMustBeUnique` error. Microsoft blocks a hard match to an account with a privileged role or with `onPremisesObjectIdentifier` already set.[^cat-hard] `Update-MgUser` takes an `-OnPremisesImmutableId` parameter.[^cat-mguser] A wrong value links the wrong person's AD account, so the pack marks the task high impact, with human approval required.

## When an AI agent does the work

Some agencies route requests through ServiceNow Otto. ServiceNow describes Otto as an AI experience that combines Now Assist, Moveworks and AI Experience, routes work to the right agent and executes it to completion. Its actions are governed by AI Control Tower, which can log each AI interaction and enforce enterprise policies. ServiceNow says Otto starts in EmployeeWorks and AI Control Tower and rolls out across its products in the year ahead.[^cat-otto] Otto is also available in the Virtual Agent,[^cat-otto-va] and ServiceNow offers a service to migrate an existing Virtual Agent to it.[^cat-otto-migrate]

**Government cloud.** We found no ServiceNow or FedRAMP source that says Otto or Now Assist is available in ServiceNow's Government Community Cloud. Confirm availability in the government cloud with the FedRAMP Marketplace and with ServiceNow before relying on it, as [Ticket-to-Machine on ServiceNow and SailPoint](ttm-servicenow-sailpoint.md) says for SailPoint features.

The catalog has two rows for this, and the same rules apply to any AI agent *(design guidance)*:

- **A request that arrives through Otto or the Virtual Agent.** The channel is the trigger (`request (automated intake)`), never the approver. The same request chain and re-read apply.
- **An AI agent that takes an action.**
  - It acts as a governed non-person identity with a named owner and sponsor, scoped roles and no standing admin rights. See the [non-person identity guide's AI agents section](non-person-identity-implementation.md#ai-agents) and [Book 17](../b17-ai-identity/index.md) for the Entra side.
  - A person approves high-impact work before the agent acts, in clause 2. Admin consent, app deletion and ImmutableId changes stay human-approved, even when an agent prepares them.
  - The agent's action is logged under its own identity, apart from people's. The AI Control Tower log is supporting evidence.
  - Closure still needs the same independent re-read. The agent's own report that it succeeded is not evidence.

The seventh check enforces the identity, approval and re-read parts. The prompt sheet asks Copilot: "Is this task safe for an AI agent to perform? What must a human approve?"

## Using Copilot at work

The prompt sheet `copilot-prompts.md` has copy-paste prompts to turn a task description into a row, find gaps, propose the re-read check, propose the drift class and severity with the reason, map controls and KSIs from the Controls sheet, write a ServiceNow catalog item description, review the sheet for duplicates, and judge whether a task is safe for an AI agent. Each prompt asks you to paste the template's column list first.

**Microsoft 365 Copilot Chat.** Use it signed in with your work account. Microsoft says Copilot is available in GCC, and that prompts, responses and generated content stay in the government cloud.[^cat-gov] Prompts and responses get enterprise data protection, under the same terms as Exchange mail and SharePoint files; your sensitivity labels, retention and audit apply.[^cat-edp] Copilot Chat without a Microsoft 365 Copilot license works on what you paste or upload; an uploaded file is stored in your OneDrive, and Copilot Chat doesn't use your data to train foundation models.[^cat-priv] Users with a Microsoft 365 Copilot license can choose between web and work in the Copilot app; choose work.[^cat-work] Features differ between commercial and government clouds, and web grounding isn't on by default in government clouds.[^cat-sd]

**GitHub Copilot.** Use it only in a repository your agency hosts inside its boundary, never in a personal or public repository. Whether GitHub Copilot is approved for that repository, and inside your boundary, is your agency's call: confirm it with your ISSO. This guide doesn't make claims about GitHub's government offerings.

**Either way:** Copilot drafts. Check each suggestion against the workbook and with your ISSO. Your agency's AI-use policy decides what you may paste.

## Storage and labeling

- Keep the filled catalog on agency OneDrive, SharePoint or Teams, or in an agency-hosted repository.
- Never keep it in a personal or public repository, or a personal cloud drive.
- A filled catalog maps how your systems are administered: the identities that change things, who approves, and where the gaps are. Ask your ISSO how to label it and who may see it.

## Related pages

- [*Building Ticket-to-Machine*](../../project-plans/developer-workbooks/ticket-to-machine/index.md), the developer workbook.
- [Ticket-to-Machine on ServiceNow and SailPoint](ttm-servicenow-sailpoint.md), the gated guide.
- [Book 13, Appendix B](../b13-governance/appendix-b-ticket-to-machine-reference.md): the loop, the five clauses, the lanes, the tempo and the evidence record.
- [Book 13, Appendix A](../b13-governance/appendix-a-requirements-mapping.md#controls-behind-the-ticket-to-machine-lanes): the controls behind the lanes.
- The [Downloads](../../downloads.md) page.

## What couldn't be verified

- The checker and the workbook's formulas are tested on the pack's examples, not on an agency's catalog.
- Whether ServiceNow Otto, Now Assist or AI Control Tower are available in ServiceNow's Government Community Cloud.
- Whether GitHub Copilot is available inside a given agency's boundary.
- The sender address of the admin consent workflow's notification email. Learn doesn't name it.

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

**Version 2.0**, in [edition 2026.11.5](../../about/archive.md#edition-2026-11-5) (November 8, 2026). Every edition is kept on the [Archive](../../about/archive.md) page; every change between editions is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/guides/ttm-task-catalog.md).

| Version | Edition | Date | Changes |
|---|---|---|---|
| 2.0 | [2026.11.5](../../about/archive.md#edition-2026-11-5) | 2026-11-08 | Release 2.0, the baseline: checked against every other book; Draft becomes Baseline; Edition 2026.11.4: record the edition and point deck links at it ([#362](https://github.com/WhalerMike/modernization-workbook/pull/362)); Fix confirmed crosswalk errors in guides and explainers ([#406](https://github.com/WhalerMike/modernization-workbook/pull/406)); Guides and explainers: fix inconsistency findings (Oracle platform, Wave 2 count, emergency class, name change, contractor source) ([#442](https://github.com/WhalerMike/modernization-workbook/pull/442)); Approve 116 gated pages (Nov 7); fix RMF map stale-review test ([#457](https://github.com/WhalerMike/modernization-workbook/pull/457)) |
| 1.2 | [2026.11.4](../../about/archive.md#edition-2026-11-4) | 2026-11-05 | Deck and audio links point at edition 2026.11.4 |
| 1.1 | [2026.11.3](../../about/archive.md#edition-2026-11-3) | 2026-11-05 | Review gate: Mike's approval of the 15 implementation guides gated on November 3 ([#348](https://github.com/WhalerMike/modernization-workbook/pull/348)) |
| 1.0 | [2026.11.2](../../about/archive.md#edition-2026-11-2) | 2026-11-02 | Ticket-to-Machine task catalog pack: build an internal task catalog with Copilot ([#310](https://github.com/WhalerMike/modernization-workbook/pull/310)) |

: Versions of this guide, newest first {.striped .hover}

<!-- revisions:end -->

[^cat-acw]: Microsoft Learn, "Configure the admin consent workflow" (reviewers; email notifications; expiration reminders; "Consent request expires after (days)"; a reviewer needs the permissions to grant admin consent), <https://learn.microsoft.com/entra/identity/enterprise-apps/configure-admin-consent-workflow> (read November 2, 2026); and "Overview of admin consent workflow" (reviewers are emailed when a request is created, is nearing expiry and expires), <https://learn.microsoft.com/entra/identity/enterprise-apps/admin-consent-workflow-overview> (read November 2, 2026).
[^cat-grant]: Microsoft Learn, "Grant tenant-wide admin consent to an application" (prerequisites: Privileged Role Administrator for any permission; Cloud Application Administrator, AI Administrator or Application Administrator for any permission except Microsoft Graph app roles; confirm with `GET /oauth2PermissionGrants`), <https://learn.microsoft.com/entra/identity/enterprise-apps/grant-admin-consent> (read November 2, 2026).
[^cat-acr]: Microsoft Learn, "appConsentRequest resource type," Microsoft Graph v1.0, <https://learn.microsoft.com/graph/api/resources/appconsentrequest> (read November 2, 2026).
[^cat-appdel]: Microsoft Learn, "Delete application," Microsoft Graph v1.0 ("apps are moved to a temporary container and can be restored within 30 days"), <https://learn.microsoft.com/graph/api/application-delete> (read November 2, 2026).
[^cat-restore]: Microsoft Learn, "Restore deleted item (directory object)," Microsoft Graph v1.0 (restoring an application doesn't restore the associated service principal; a deleted item remains available for up to 30 days), <https://learn.microsoft.com/graph/api/directory-deleteditems-restore> (read November 2, 2026).
[^cat-hard]: Microsoft Learn, "Configure Microsoft Entra Connect for an existing tenant" (hard match and soft match; the source anchor as the base64 of `mS-DS-ConsistencyGuid` or `objectGUID`; attributes overwritten with on-premises values; `AttributeValueMustBeUnique`; hard match protections from July 1, 2026), <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-install-existing-tenant> (read November 2, 2026).
[^cat-mguser]: Microsoft Learn, "Update-MgUser," Microsoft Graph PowerShell (`-OnPremisesImmutableId` parameter), <https://learn.microsoft.com/powershell/module/microsoft.graph.users/update-mguser> (read November 2, 2026).
[^cat-otto]: ServiceNow, "ServiceNow Otto creates the unified AI experience for the enterprise," press release, May 5, 2026, <https://newsroom.servicenow.com/press-releases/details/2026/ServiceNow-Otto-creates-the-unified-AI-experience-for-the-enterprise/default.aspx> (read November 2, 2026).
[^cat-otto-va]: ServiceNow, "ServiceNow Otto in Native Mobile Virtual Agent," product documentation, Zurich, <https://www.servicenow.com/docs/r/zurich/mobile/now-assist-mobile-va.html> (read November 2, 2026).
[^cat-otto-migrate]: ServiceNow, "Jumpstart Your Migration to ServiceNow Otto for Virtual Agent," Impact accelerator, <https://www.servicenow.com/docs/r/impact/accelerator-and-initiative-list/jumpstart-migration-to-otto-for-virtual-agent.html> (read November 2, 2026).
[^cat-gov]: Microsoft Learn, "Understand Microsoft U.S. government cloud environments for Microsoft 365 and Microsoft Copilot" (available in GCC, GCC High and DoD; prompts, responses and generated content remain in the government cloud), <https://learn.microsoft.com/microsoft-365/copilot/gov-overview> (read November 2, 2026).
[^cat-edp]: Microsoft Learn, "Enterprise data protection in Microsoft Copilot and Microsoft Copilot Chat," <https://learn.microsoft.com/microsoft-365/copilot/enterprise-data-protection> (read November 2, 2026).
[^cat-priv]: Microsoft Learn, "Privacy and protections," Copilot Chat (organizational data: paste or upload; uploaded files stored in the user's OneDrive for Business; no training of foundation models), <https://learn.microsoft.com/copilot/privacy-and-protections> (read November 2, 2026).
[^cat-work]: Microsoft Learn, "Updated Windows and Microsoft Copilot Chat experience" (users with the Microsoft 365 Copilot license can toggle between web and work), <https://learn.microsoft.com/windows/client-management/manage-windows-copilot> (read November 2, 2026).
[^cat-sd]: Microsoft Learn, "Microsoft Copilot," service description, feature availability (enterprise data protection in GCC; web grounding isn't enabled by default for government clouds), <https://learn.microsoft.com/office365/servicedescriptions/office-365-platform-service-description/microsoft-365-copilot> (read November 2, 2026).
