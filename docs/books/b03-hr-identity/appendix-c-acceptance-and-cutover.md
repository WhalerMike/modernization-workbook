---
title: "Appendix C — Acceptance and Cutover"
description: "How a population moves to HR-driven identity: acceptance tests in business terms, a signed validation report, a dry run, cutover with rollback, proof that HR is the sole source, and closing the ticket path."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b03-hr-identity
book: B03
part: Appendix
series-order: 92
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix C — Acceptance and Cutover

*A population is cut over when HR is provably its only source of accounts — not when the pipeline first runs.*

::: {.callout-note}
## In this appendix
Acceptance tests and who signs them. The validation report. Dry run, cutover and rollback. Proving HR is the sole source. Closing the ticket path. Where an agency does already run an HR connector.
:::

![Acceptance and cutover: acceptance tests by worker type, a signed validation report, a dry run on production data, cutover with rollback ready, seven days of proof that every change came from HR, then the ticket path closes for the population.](../../images/diagrams/b03-hr-identity/svg/appc-cutover-sequence.svg){fig-alt="Six boxes left to right: acceptance tests (business-language cases, by worker type); amber validation report (signed before cutover); dry run (production data, no writes); blue cutover (spot checks; rollback ready); green sole-source proof (every change for 7 days came from HR); red close the ticket path (manual account creation ends for the population)."}

## Acceptance

Acceptance tests are written in business terms, by worker type and event, so that HR, the business and security can read them:

| Scenario | Expected outcome |
|---|---|
| A hire is entered with a start date two weeks out | The account exists, disabled, before day one; baseline access is ready on day one[^aC-lcw-deploy] |
| A reassignment to another organization takes effect | The old organization's access is gone and the new one's present within the agreed interval; a review opens on what remains |
| A separation takes effect | Sign-in is blocked and sessions revoked at the effective time; PIV, devices and access are revoked and reconciled[^aC-lcw-tasks] |
| An employee goes on leave without pay | The account is kept and restricted; nothing is deprovisioned |
| A separation is cancelled | What the separation disabled is re-enabled from the corrected record, with evidence |
| A contractor converts to employee | Same person and key; access re-derived; manually assigned contractor access removed |
| A record fails validation | It lands in quarantine with a reason; nothing partial reaches the directory |

: Acceptance scenarios, stated in business terms {.striped .hover}

Lifecycle Workflows' templates map onto these rows: the pre-hire and new-hire templates generate a Temporary Access Pass and enable the account on the hire date, and the offboarding templates disable the account and remove group memberships; refresh-token revocation is a separate built-in task.[^aC-lcw-deploy][^aC-lcw-tasks] The tests prove the agency's configuration of them, not the templates.

Defects are graded by severity; anything that could leave a separated person with access, or lock out an active one, blocks acceptance. Sign-off comes from HR, the identity owner, the ISSO and the business owner of the population.

## The validation report

A short report gates every cutover: the acceptance results, open defects and their dispositions, the drift baseline for the population, the privacy and security checks of Appendix B, and the rollback plan. It is signed before the cutover is scheduled.

## Dry run, cutover and rollback

- **Dry run** on production data with writes disabled: the pipeline computes what it would do, and every difference from the directory is explained.
- **Cutover** for one population at a time, aligned with that population's move to Entra ID where the two coincide (Chapter 05). Spot-check named records immediately after the first cycle.
- **Rollback** is written down before cutover: pause the provisioning job (a paused job keeps its state and resumes where it left off),[^aC-pause] quarantine the batch, and return the population to the prior process while the cause is fixed.

## Proving HR is the sole source

For seven days after cutover, every create, change and disable for the population must trace to an HR event and a provenance record. The provisioning logs record the outcome the provisioning service reached for each record it received,[^aC-prov-logs] so the comparison is between those logs and the directory's audit log: anything in the audit log without a matching provisioning record came from somewhere else. Any change that doesn't — a ticket, a script, a hand edit — is a finding, and the clock restarts once it is closed.

## Closing the ticket path

When the proof holds, the manual path for creating and changing accounts in that population closes: the service desk stops accepting account-creation tickets for it, and any exception goes through the governed exception process (Appendix A). This is the visible end state of HR-driven identity: nobody requests an account for a new hire, because the hire causes it.

## Where an HR connector already exists

Some agencies already run a script or connector that creates accounts from an HR extract. The same sequence applies, with one more step: once HR-driven provisioning is the proven sole source, revoke the old connector's credentials, keep its state and logs under the applicable approved records schedules and any legal holds (for system access records, often NARA General Records Schedule 3.2, items 030 and 031, as the agency records officer confirms),[^aC-grs32] and decommission it — an irreversible step that is signed off like the cutover itself.

::: {.callout-tip}
## Continue the book
[← Previous: Appendix B — Security and Privacy Assessment](appendix-b-security-and-privacy.md) · [Book index](index.md)
:::

[^aC-lcw-deploy]: Microsoft Learn, "Plan a Lifecycle Workflow deployment" (scenarios and predefined tasks: Onboard prehire employee, Onboard new hire employee, Offboard an employee), <https://learn.microsoft.com/en-us/entra/id-governance/lifecycle-workflows-deployment> (accessed Oct 20, 2026).
[^aC-lcw-tasks]: Microsoft Learn, "Lifecycle Workflow built-in tasks" (Disable user account; Revoke all refresh tokens for user), <https://learn.microsoft.com/en-us/entra/id-governance/lifecycle-workflow-tasks> (accessed Oct 20, 2026).
[^aC-pause]: Microsoft Learn, "synchronizationJob: pause" (Microsoft Graph v1.0: progress and job state persist, and the job continues from where it left off on start), <https://learn.microsoft.com/en-us/graph/api/synchronization-synchronizationjob-pause> (accessed Oct 20, 2026).
[^aC-prov-logs]: Microsoft Learn, "API-driven inbound provisioning concepts" (admins and API clients track the outcome of each record through the provisioning logs and the provisioning logs API), <https://learn.microsoft.com/en-us/entra/identity/app-provisioning/inbound-provisioning-api-concepts> (accessed Oct 20, 2026).
[^aC-grs32]: National Archives and Records Administration, General Records Schedule 3.2, *Information Systems Security Records*, Transmittal No. 33, January 2023 (items 030 and 031, system access records), <https://www.archives.gov/files/records-mgmt/grs/grs03-2.pdf> (accessed Oct 20, 2026).
