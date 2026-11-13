---
title: "Zero Trust Assessment: An Implementation Guide"
description: "An implementation guide for running Microsoft's Zero Trust Assessment as evidence rather than a verdict: scoping what it is and isn't, preparing a dedicated host and protecting the output, consenting with least privilege and reviewing what consent leaves behind, connecting in Commercial and GCC, running it and reading the report, normalizing every result to Book 11's taxonomy so a skipped test never counts as a failed control, opening a closure register routed to the pages that remediate each finding family, reconciling with ScubaGear and with AWS Security Hub CSPM through the setting and the NIST SP 800-53 control, and re-running on a schedule with a hashed evidence package. Ten steps with copy-paste commands from Microsoft Learn and the tool's own source, the results kit in examples/zta-results, GCC availability for each step, the federal requirements and KSIs each supports, and the decision record, RACI, evidence catalog and metrics."
doc-type: workbook-guide
audience: [Technical, Customer]
family: guides
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
research-status: draft
research-type: implementation guide
research-book: "Book 11"
review-status: pending
last-reviewed: 2026-11-11
---
# Zero Trust Assessment: An Implementation Guide

*The Zero Trust Assessment tells you, test by test, how a tenant's configuration compares with Microsoft's Zero Trust guidance; it doesn't tell you what to fix first, what a skipped test means, or when a finding is closed. Those are the program's to decide, and this guide is how.*

::: {.callout-note}
## In this guide
How an agency runs Microsoft's Zero Trust Assessment and turns its report into evidence, as ten steps an operator can follow. First, how to read the guide, the placeholders, the track at a glance, prerequisites, government-cloud availability and the path on one page. Then the steps: decide and scope; prepare the host and protect the output; consent and roles; connect in the GCC tenant; run it; read the report; normalize the results with the kit; open the closure register and route each finding; reconcile with ScubaGear and AWS Security Hub CSPM; and re-run on a schedule and keep the evidence. Each step has its authority label, exact commands, the federal requirements and KSIs it supports, government-cloud availability, a **Validate** step and rollback. Then the control states, the decision record, RACI, evidence catalog and metrics, the dangers, rollback, a checklist and what couldn't be verified.
:::

::: {.callout-tip}
## Watch, present or train
**Narrated deck (about 15 minutes, captions)**: why a score isn't a verdict, what the tool checks and the four things it isn't, running it alongside ScubaGear, the ten steps, government-cloud availability, consent and the RACI, then each step from the host to the sealed evidence, the dangers and what couldn't be verified, as a Why / What / Who / How deck, on the [Presentations](../../presentations/index.md#guide-zero-trust-assessment) page, or [▶ watch it in the browser](../../presentations/watch.html?v=Guide_Zero_Trust_Assessment_Narrated). **Training:** the learning path [*The Zero Trust Assessment as Evidence*](../../training/zero-trust-assessment/index.md) teaches this guide in four modules, with labs on the kit's fixtures and in a test tenant and a knowledge check in each.
:::

## How to read this guide {#zta-how-to-read}

[Book 11](../b11-zero-trust/index.md) already argues the case. [Chapter 05](../b11-zero-trust/05-two-assessment-tools.md) explains what the Zero Trust Assessment and CISA's ScubaGear each check and why an agency runs both; [Chapter 08](../b11-zero-trust/08-close-before-you-assess.md) puts the assessment after the architecture it confirms and maps each [finding family](../b11-zero-trust/08-close-before-you-assess.md#finding-families) to the page that closes it; [Chapter 09](../b11-zero-trust/09-running-the-assessment.md) covers the run and the evidence chain; [Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md) sets the [normalized result taxonomy](../b11-zero-trust/10-evidence-not-verdicts.md#a-normalized-result-taxonomy), the [closure chain](../b11-zero-trust/10-evidence-not-verdicts.md#the-closure-chain) and the [weighting](../b11-zero-trust/10-evidence-not-verdicts.md#weigh-the-finding-not-the-pass-rate). What none of them gives is the run as a procedure, from the first consent to a re-run whose evidence an assessor can check. This guide does that, with the code in the Zero Trust Assessment results kit, [`examples/zta-results`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/zta-results), and links to the books instead of restating them.

**Where the facts come from.** The tool's behavior was read on Microsoft Learn's three Zero Trust Assessment pages (the overview, *Get started* and the terminology glossary) and in the tool's own source and guide at release 3.1.0 on GitHub, the current release on November 11, 2026.[^zta-overview][^zta-start][^zta-glossary][^zta-release] Where Learn and the tool's guide differ, the guide says so and gives both. The connection commands for each cloud come from Learn's pages for Microsoft Graph, Exchange Online, Security & Compliance and Azure Government. AWS facts come from AWS's documentation, control statements from NIST SP 800-53 Rev. 5, and the KSIs from [Book 13, Appendix A](../b13-governance/appendix-a-requirements-mapping.md)'s mappings. Everything was read on November 11, 2026; the [verification log](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/books/guides/_verification/zero-trust-assessment-implementation.md) lists every claim. Where a fact couldn't be verified, the guide says *not yet specified* and [lists it](#zta-what-couldnt-be-verified). Nothing here was run against a live tenant: the kit is tested against fictional fixtures, and every tenant command is unrun by the authors.

**Labels.** Each step carries an authority label from [Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md#authority-labels). The Zero Trust Assessment itself is **Optional** in federal terms: no directive requires it, and it isn't a substitute for the SCuBA tools BOD 25-01 names ([Chapter 05](../b11-zero-trust/05-two-assessment-tools.md#where-they-overlap-and-where-they-dont)). The program runs it as **Risk-based recommended**, for breadth across devices, network, data and security operations that ScubaGear doesn't cover. *(Design guidance)* marks the program's own choices.

**The audience.** A civilian agency at FedRAMP Moderate whose Microsoft 365 GCC tenant pairs with commercial Azure. The examples use the fictional Contoso, `contoso.onmicrosoft.com` and `contoso.example`.

**The placeholders.** The commands are exact; replace these values once, everywhere:

| Placeholder | What it is |
|---|---|
| `<tenant>` | The tenant's initial domain, for example `contoso.onmicrosoft.com`, or its tenant ID |
| `<report-folder>` | A new, empty folder on the assessment host for this run, for example `D:\Assessments\ZTA\2026-11-10` |
| `<evidence-folder>` | The protected evidence folder inside the boundary that the ISSO controls |
| `<kit>` | The `examples/zta-results` folder from the kit's zip |
| `<subscription-id>` | An Azure subscription in the Infrastructure pillar's scope |
| `<spo-admin-url>` | The tenant's SharePoint admin URL, for example `https://contoso-admin.sharepoint.com` |
| `<upn>` | The assessment account's user principal name |
| `<grant-id>` | The ID of a delegated permission grant, from Step 3's review command |
| `<previous-run>`, `<current-run>` | Two normalized run folders the kit wrote |
| `<region>` | An AWS Region where Security Hub CSPM runs, for example `us-east-1` or `us-gov-west-1` |

: Placeholders used in this guide {.striped .hover}

**The pieces.** An implementation guide is finished when it has its deck series, its labs and its training path ([CONTRIBUTING](https://github.com/WhalerMike/modernization-workbook/blob/main/CONTRIBUTING.md#an-implementation-guide-is-finished-when-it-has-all-four-pieces)):

| Piece | State |
|---|---|
| This guide | Draft, November 11, 2026 |
| The results kit, `examples/zta-results`, with fixtures and Pester tests | Built; [download](../../../downloads/zta-results.zip) |
| Narrated deck and video | Built, November 11, 2026: 15 narrated slides, about 15 minutes, with captions; see *Watch, present or train* at the top |
| Labs: Lab 1 on the kit's fixtures, Lab 2 in a test tenant | Draft, November 11, 2026, inside the training path; this guide has no separate developer workbook, because the kit is small enough for the learning path to carry its labs |
| Training path | Draft, November 11, 2026: [The Zero Trust Assessment as Evidence](../../training/zero-trust-assessment/index.md), four modules |

: The guide's pieces {.striped .hover}

::: {.callout-tip}
## Labs for this guide
The hands-on work is in the learning path [*The Zero Trust Assessment as Evidence*](../../training/zero-trust-assessment/index.md): Lab 1 on a laptop with the kit's fictional fixtures, Lab 2 in a test tenant. [The Labs page](../../training/labs.md#zta) lists them; the steps below link their module.
:::

## The track at a glance {#zta-at-a-glance}

**The goal.** Every run of the Zero Trust Assessment is scoped, authorized and pinned to a tool version; its output stays inside the boundary; every result is recorded twice, the tool's value and the normalized one; every finding has an owner, a route to the page that remediates it and a weighted place in the backlog; and every run is compared with the last and sealed as evidence. A finding is ready for closure when every applicable state has evidence and a reassessment shows a Pass; the authorizing official or assessor decides.

**Done when** *(design guidance)*:

- the decision record names the scope, the run account, the cadence and the tool version, and the CISO approved it;
- the run account holds only the read roles it needs, and the consent it relies on is reviewed;
- every result is normalized, with no skipped test counted as a failure and no unmapped value hidden;
- every finding is in the closure register with an owner, a family and a remediation page, or is routed by the program lead;
- every run after the first is compared with the one before, and every run's evidence passes the kit's check.

## Prerequisites {#zta-prerequisites}

- **Decisions first.** Step 1's decision record: scope, run account, cadence, telemetry and output handling.
- **A dedicated Windows host inside the boundary**, with PowerShell 7.6 or later for release 3.1.0 and the Microsoft Visual C++ Redistributable (x64). Learn says PowerShell 7; the tool's guide asks for 7.6 because its pinned Exchange module needs it, and recommends a clean, dedicated virtual machine. SharePoint Online and Azure Information Protection checks need Windows; on other platforms they are skipped.[^zta-start][^zta-guide]
- **Roles.** A consent administrator for the first connection, and a run account with the read roles of [Step 3](#zta-step-3).
- **Licenses.** Coverage depends on what the tenant holds. A test the tenant isn't licensed for is skipped: a licensing decision, not a failed control ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#a-normalized-result-taxonomy)).
- **For the kit:** PowerShell 7.1 or later and, for its tests, Pester 5. The kit reads files only.
- **For Step 9's AWS part:** the AWS CLI and a role that can read Security Hub CSPM findings, where the agency runs AWS.

### GCC availability {#zta-gov-availability}

Learn's Zero Trust Assessment pages don't mention GCC. GCC uses the worldwide endpoints,[^zta-graph-clouds] so a GCC run uses the tool's defaults: `-Environment Global` and `-ExchangeEnvironmentName O365Default`.[^zta-connect] The services it signs in to are documented on Learn. Where neither says, this guide says *not yet specified*.

| Capability | Commercial and GCC | Source |
|---|---|---|
| The Zero Trust Assessment tool | Default `Global` environment; GCC uses the worldwide Graph and Azure endpoints | Tool source; Learn silent[^zta-connect] |
| Microsoft Graph | `graph.microsoft.com` (`Connect-MgGraph -Environment Global`) | Learn[^zta-graph-clouds][^zta-mg-env] |
| Exchange Online | `O365Default` (no parameter needed) | Learn[^zta-exo] |
| Security & Compliance (Purview) | Default endpoint | Learn[^zta-ipps] |
| Azure | `AzureCloud` | Tool source[^zta-connect] |
| SharePoint Online admin | `-admin.sharepoint.com` | Tool source; Learn not read for the URL[^zta-connect] |
| Azure Information Protection | Default | Tool source; not yet specified on Learn[^zta-connect] |
| AWS Security Hub CSPM (Step 9) | Commercial Regions; GovCloud (US) is available, with product integrations, some controls and cross-Region aggregation limited | AWS[^zta-sh-gov] |

: GCC availability for the run and the reconciliation {.striped .hover}

**Interim path.** Until a run has been proved in the agency's own cloud, run one pillar at a time (`-Pillar Identity` needs only Microsoft Graph) in a test tenant of the same cloud, record what connected and what was skipped, and keep ScubaGear as the federal baseline tool throughout ([Chapter 05](../b11-zero-trust/05-two-assessment-tools.md#what-this-means-for-an-agency)).

## The path on one page {#zta-path}

| Step | Done when | Validate with |
|---|---|---|
| [1 Decide and scope](#zta-step-1) | The decision record is approved: scope, account, cadence, version, output handling | The signed record |
| [2 Prepare the host](#zta-step-2) | A clean host has PowerShell 7.6 and the pinned module, and a protected report folder | `Get-Module -ListAvailable ZeroTrustAssessment` |
| [3 Consent and roles](#zta-step-3) | Consent granted once; the run account holds read roles only; the grants reviewed | The grant review's output |
| [4 Connect in the GCC tenant](#zta-step-4) | Every service connects in the tenant's own cloud | `Get-MgContext` and the connection messages |
| [5 Run it](#zta-step-5) | The report and export exist and are hashed | The export's SHA-256 |
| [6 Read the report](#zta-step-6) | Pillar owners have read their tabs; skips and errors are noted | The reading notes |
| [7 Normalize](#zta-step-7) | Every result normalized; no unmapped value | `Invoke-ZtaNormalize.ps1` |
| [8 Register and route](#zta-step-8) | Every finding has an owner, a family and a page | `Invoke-ZtaRegister.ps1` |
| [9 Reconcile](#zta-step-9) | Overlapping findings matched through the setting and the control | The reconciliation table |
| [10 Re-run and keep evidence](#zta-step-10) | The run is on the calendar, compared with the last, and sealed | `Invoke-ZtaEvidence.ps1 -Check` |

: The ten steps {.striped .hover}

## Step 1: Decide and scope {#zta-step-1}

**Authority:** Optional in federal terms, run as Risk-based recommended (the risk: devices, network, data and security operations configuration nobody assesses). **Applies:** every Microsoft cloud tenant the agency operates; License-dependent and Environment-dependent coverage.

The Zero Trust Assessment tests a tenant's configuration against hundreds of items drawn from Microsoft's configuration guidance for Entra, Intune, Azure networking and Purview, aligned with the Secure Future Initiative and the Zero Trust pillars.[^zta-overview] Release 3.1.0 holds 364 tests across seven pillars: Identity, Devices, Network, Data, Infrastructure, Security Operations and AI.[^zta-release] Four things it isn't, and the decision record says so:

- **Not a verdict.** It reads configuration on the day it runs. A finding is evidence for a decision a named person makes ([Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md)); a pass rate is not a maturity stage.
- **Not a substitute for ScubaGear.** BOD 25-01 names CISA's SCuBA tools, and ScubaGear covers Exchange Online mail flow, Teams, SharePoint sharing and Power Platform, which the Zero Trust Assessment doesn't test ([Chapter 05](../b11-zero-trust/05-two-assessment-tools.md#where-they-overlap-and-where-they-dont)).
- **Not a supported product.** It is a community project maintained by Microsoft employees, provided as is, and not supported through any Microsoft support program.[^zta-repo]
- **Not a detector.** Learn's operations guidance for Global Secure Access calls it a configuration-posture check, not a real-time detector, to be paired with alerts.[^zta-gsa-ops]

**Steps.**

1. **Write the decision record** from the [template](#zta-decision-record): scope (the tenant, the pillars, the Azure subscriptions for the Infrastructure pillar), the run account, the cadence (Step 10), the pinned tool version, telemetry, and where the output goes. The CISO approves the tool, its version and the accounts ([Book 11, Chapter 07](../b11-zero-trust/07-who-owns-zero-trust.md)).
2. **Tag the subscriptions in the Infrastructure scope.** The Infrastructure pillar reads Microsoft Defender for Cloud recommendations only for accessible subscriptions tagged `ZeroTrustAssessment` with the value `Infrastructure`; with none tagged, its test is skipped as not applicable, which is not a clean result.[^zta-guide][^zta-infra-test] Tagging is a write to Azure: a subscription Owner or Tag Contributor runs it under change control.

    ```powershell
    Connect-AzAccount -Environment AzureCloud
    Update-AzTag -ResourceId "/subscriptions/<subscription-id>" -Tag @{ ZeroTrustAssessment = 'Infrastructure' } -Operation Merge
    ```

    For Azure Government use `-Environment AzureUSGovernment`.[^zta-azgov][^zta-tags]

3. **Put the run on the calendar** (Step 10), with the pillar owners who read their tabs (Step 6).

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| CA-2 (control assessments): plan the assessment and its scope | KSI-PIY-RIS | The approved decision record |
| CA-7 (continuous monitoring): the frequency of assessment | KSI-MLA-EVC | The calendar entry and its owner |

: Step 1 requirements and evidence {.striped .hover}

**Government-cloud availability.** As in [the availability table](#zta-gov-availability). Tagging uses the same command in Azure Government with its environment.

::: {.callout-important}
## Validate (G1 Decide and scope)
- The decision record names the scope, the account, the cadence, the tool version (3.1.0 at this writing) and the output handling, and carries the CISO's approval.
- `Get-AzTag -ResourceId "/subscriptions/<subscription-id>"` shows `ZeroTrustAssessment = Infrastructure` for each subscription in scope.
- Gate owner: the Zero Trust program lead.
:::

::: {.callout-tip}
## Labs and training: G1 Decide and scope
- **As training:** [Module 1: Evidence, not a verdict](../../training/zero-trust-assessment/01-evidence-not-a-verdict.md), with [Lab 1](../../training/zero-trust-assessment/01-evidence-not-a-verdict.md#zta-lab-1) on fixtures and a knowledge check
:::

**Rollback.** A superseding decision record. To take a subscription out of scope: `Update-AzTag -ResourceId "/subscriptions/<subscription-id>" -Tag @{ ZeroTrustAssessment = 'Infrastructure' } -Operation Delete`.

## Step 2: Prepare the host and protect the output {#zta-step-2}

**Authority:** Microsoft-recommended for the PowerShell version, a clean session, and storing the report securely and deleting the local folder after the run (Learn and the tool's guide, read Nov 11, 2026). **Applies:** all tenants; Windows for full coverage.

The report and the export folder hold tenant information an attacker could use; Learn says to share them only with authorized personnel, store the report securely, and delete the generated folder once the assessment is complete.[^zta-start] The tool's guide adds that exports, support packages and extended logs can hold personal information, tenant identifiers and configuration details, and that deleting the report folder doesn't remove the separate PowerShell logging folder.[^zta-guide]

**Steps.**

1. **Open a clean PowerShell 7 session** on the dedicated host and check the version.

    ```powershell
    pwsh -NoProfile
    $PSVersionTable.PSVersion
    ```

2. **Install the module for the run account.** Learn shows `Install-Module`; the tool's guide uses PSResourceGet. Either installs the same package; pin the version the decision record names.

    ```powershell
    Install-PSResource -Name ZeroTrustAssessment -Version 3.1.0 -Scope CurrentUser
    Get-Module -ListAvailable ZeroTrustAssessment | Select-Object Name, Version
    ```

3. **Create the run's report folder and restrict it** to the run account and the evidence custodians. A new, empty folder per run: a non-resume run against a non-empty folder asks to delete its contents.[^zta-guide]

    ```powershell
    New-Item -ItemType Directory -Path <report-folder>
    icacls <report-folder> /inheritance:r /grant:r "${env:USERDOMAIN}\${env:USERNAME}:(OI)(CI)F" "BUILTIN\Administrators:(OI)(CI)F"
    ```

4. **Update only through the decision record.** A new version is a reviewed change ([Step 10](#zta-step-10)); the tool's guide updates with `Update-PSResource` and a fresh session.

    ```powershell
    Update-PSResource -Name ZeroTrustAssessment
    ```

5. **Uninstall when retired**, then delete only the assessment output you intend to remove, and the PowerShell logs under your retention rule.

    ```powershell
    Uninstall-PSResource ZeroTrustAssessment -Version '*'
    Get-ChildItem (Join-Path $env:APPDATA 'PowerShell\PSFramework\Logs')
    ```

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| CM-6 (configuration settings): the host's pinned versions | KSI-SVC-ACM, KSI-MLA-EVC | The module version and PowerShell version for each run |
| AU-9 (protection of audit information) and SI-12 (information management and retention): the output restricted and retained by rule | KSI-MLA-OSM (AU-9) | The folder's permissions and the records schedule entry |

: Step 2 requirements and evidence {.striped .hover}

**Government-cloud availability.** The host and the module are the same in every cloud; the PowerShell Gallery must be reachable from the host, or the agency stages the package internally *(design guidance)*.

::: {.callout-important}
## Validate (G2 Prepare the host)
- `Get-Module -ListAvailable ZeroTrustAssessment` shows the pinned version, and `$PSVersionTable.PSVersion` is 7.6 or later.
- `icacls <report-folder>` lists only the run account and the custodians.
- Gate owner: the assessment operator, with the ISSO for the folder.
:::

**Rollback.** `Uninstall-PSResource ZeroTrustAssessment -Version '*'`; nothing in the tenant changes.

## Step 3: Consent and roles {#zta-step-3}

**Authority:** Microsoft-recommended (Learn and the tool's guide, read Nov 11, 2026); least privilege is Risk-based recommended. **Applies:** all tenants; Environment-dependent for the national-cloud endpoints.

The first connection asks an administrator to consent to the Microsoft Graph read permissions the tool needs; later runs don't ask again unless a new version adds a permission.[^zta-start][^zta-guide] The sources differ on who may consent and run:

| Source | First run | Later runs |
|---|---|---|
| Learn, *Get started* | Global Administrator, to connect and consent | Global Reader, Security Reader, Exchange Administrator and SharePoint Administrator; the same page also says later runs can be performed as a Global Reader |
| The tool's guide, 3.1.0 | Cloud Application Administrator or Application Administrator for delegated consent; Privileged Role Administrator or Global Administrator also can. Consent assigns no runtime role | Global Reader for the Graph context (validated by the module); Security Reader for protection policies; SharePoint Administrator for SharePoint tenant commands; Attribute Assignment Reader for custom security attributes; Azure Reader on in-scope subscriptions; an Azure Information Protection reader role |
| Learn's permission list | 21 Graph permissions | — |
| The 3.1.0 source (`Get-ZtGraphScope`) | 34 Graph permissions, all read | — |

: Consent and roles, by source {.striped .hover}

The program follows the tool's guide, because it describes the version being run, and [Book 11, Chapter 07](../b11-zero-trust/07-who-owns-zero-trust.md) holds the role set: the consent administrator grants consent and doesn't run the assessment; the run account is a dedicated reader, activated through PIM before each run, under the same privileged-access controls as any administrator ([Privileged Access implementation guide](privileged-access-implementation.md)). SharePoint Administrator is the one write-capable role the run needs; Learn and the tool's guide both name it, and Global Reader alone can't run the SharePoint tenant commands.[^zta-start][^zta-guide] *(Design guidance)*

**What consent leaves behind.** Consent is recorded as a delegated permission grant on the enterprise application the tool signs in through, by default the Microsoft Graph PowerShell application, shared with every other script in the tenant that uses it. Learn recommends a custom application for Microsoft Graph PowerShell when you need to isolate and limit the consent it holds.[^zta-mg-custom] The program uses a dedicated application for the assessment *(design guidance)*, which the tool supports with `-ClientId`.[^zta-connect]

**Steps.**

1. **Consent once, as the consent administrator**, in the tenant's cloud ([Step 4](#zta-step-4) has the connection parameters).

    ```powershell
    Import-Module ZeroTrustAssessment
    Get-ZtGraphScope
    Connect-ZtAssessment -Tenant <tenant> -Service Graph
    ```

2. **Review what the consent granted.** Run as a Cloud Application Administrator, with read scopes:

    ```powershell
    $clientId = (Get-MgContext).ClientId
    Connect-MgGraph -Scopes Application.Read.All, DelegatedPermissionGrant.Read.All
    $sp = Get-MgServicePrincipal -Filter "appId eq '$clientId'"
    Get-MgOauth2PermissionGrant -Filter "clientId eq '$($sp.Id)'" | Format-List Id, ConsentType, PrincipalId, Scope
    ```

    Compare `Scope` with `Get-ZtGraphScope`'s list, and record the output with the run's evidence.

3. **Activate the run account's roles** through PIM before each run, and reconnect after activating; the tool's guide says to activate eligible roles before connecting.[^zta-guide]

4. **Remove a dedicated application's grant when the tool is retired.** Learn's revocation command; never on the shared Microsoft Graph PowerShell application without assessing what else uses it, as the tool's guide warns.[^zta-mg-revoke][^zta-guide] Run as a Cloud Application Administrator:

    ```powershell
    Connect-MgGraph -Scopes DelegatedPermissionGrant.ReadWrite.All
    Remove-MgOauth2PermissionGrant -OAuth2PermissionGrantId <grant-id>
    ```

    Existing tokens stay valid for their lifetime after the grant is deleted.[^zta-mg-revoke]

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| AC-6 (least privilege): read roles only, activated just in time; the consent administrator separate from the run account | KSI-IAM-ELP, KSI-IAM-JIT | Role assignments and PIM activations for the run account |
| AC-2 (account management): a dedicated, named run account | — | The account's record and its owner |
| CM-8 and AC-6: the application and its grants reviewed | KSI-IAM-ELP | Step 2's grant review output, each run |

: Step 3 requirements and evidence {.striped .hover}

**Government-cloud availability.** The grants and roles work the same way in GCC as in commercial tenants.

::: {.callout-important}
## Validate (G3 Consent and roles)
- The grant review lists exactly the scopes `Get-ZtGraphScope` prints, on the application the decision record names.
- The run account holds Global Reader, Security Reader and the other read roles, eligible not permanent, and no Global Administrator assignment.
- Gate owner: the identity-plane owner, with the CISO.
:::

**Rollback.** Remove the dedicated application's grant (step 4) and the run account's role assignments. Nothing else in the tenant changed.

## Step 4: Connect in the GCC tenant {#zta-step-4}

**Authority:** Microsoft-recommended for the GCC endpoints (Learn). **Applies:** Environment-dependent.

`Connect-ZtAssessment` signs in separately to Microsoft Graph, Azure, Exchange Online, Security & Compliance, SharePoint Online and Azure Information Protection, and a Graph connection doesn't grant access to the others.[^zta-guide] Learn's *Get started* page shows only the commercial command, which GCC also uses; the parameters below are the tool's 3.1.0 source, matched to Learn's per-service pages.[^zta-connect]

**Steps.** Run this block as the run account, in the session that will run the assessment.

- Commercial and GCC (GCC uses the worldwide endpoints[^zta-graph-clouds]):

    ```powershell
    Connect-ZtAssessment -Tenant <tenant> -Environment Global -SharePointAdminUrl <spo-admin-url> -UserPrincipalName <upn>
    ```

Then confirm which tenant and cloud the session is in:

```powershell
Get-MgContext | Format-List TenantId, Environment, Account, Scopes
Get-AzContext | Format-List Tenant, Environment, Subscription
```

Pass `-SharePointAdminUrl` explicitly: the tool otherwise infers it from the tenant's initial domain.

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| CA-2 and CA-7: the assessment reads the tenant in scope, in its own cloud | KSI-PIY-RIS, KSI-MLA-EVC | The `Get-MgContext` and `Get-AzContext` output for the run |

: Step 4 requirements and evidence {.striped .hover}

**Government-cloud availability.** As in the [table](#zta-gov-availability): Graph, Exchange and Security & Compliance from Learn; the SharePoint admin URL and Azure Information Protection's environment from the tool's source.

**Interim path.** If a service won't connect in the tenant's cloud, connect the rest with `-Service` (for example `-Service Graph,Azure`), run, and record each service's tests as Skipped-Disconnected with the reason ([Step 7](#zta-step-7)).

::: {.callout-important}
## Validate (G4 Connect)
- Each service prints a successful connection; `Get-MgContext` shows the tenant and the environment the decision record names.
- Gate owner: the assessment operator.
:::

**Rollback.** `Disconnect-ZtAssessment`; nothing in the tenant changed.

## Step 5: Run it {#zta-step-5}

**Authority:** Microsoft-recommended for the run and its handling (Learn). **Applies:** all tenants.

The assessment is read-only and stores its data locally. On a large tenant it can take more than 24 hours; Learn says not to stop it, even if it logs warnings or errors.[^zta-start] The tool's default overall timeout is 24 hours.[^zta-guide]

**Steps.**

1. **Run**, in the connected session. `-DisableTelemetry` suppresses the one telemetry event, which carries the tenant ID; whether to use it is the CISO's decision in the decision record.[^zta-guide] `-NoBrowser` keeps the report from opening on a shared screen.

    ```powershell
    Invoke-ZtAssessment -Path <report-folder> -DisableTelemetry -NoBrowser
    ```

2. **Hash the export as soon as the run finishes**, before anyone opens or copies it.

    ```powershell
    Get-FileHash -Algorithm SHA256 -LiteralPath <report-folder>\zt-export\ZeroTrustAssessmentReport.json
    Get-ChildItem <report-folder> -Recurse -File | Get-FileHash -Algorithm SHA256 | Export-Csv <report-folder>\..\run-hashes.csv -NoTypeInformation
    ```

3. **If the run fails**, capture a support package in the same session before closing it, to a separate protected folder.[^zta-start][^zta-guide]

    ```powershell
    New-PSFSupportPackage -Path <report-folder>-support -Force
    ```

4. **Watch a long run** in the per-run logs, `<report-folder>\zt-export\logs\<run>\`, and resume report processing over an existing export only for the same pillar:[^zta-guide]

    ```powershell
    Get-ChildItem <report-folder>\zt-export\logs -Recurse -Filter '*progress.log' | Sort-Object LastWriteTime | Select-Object -Last 3
    Invoke-ZtAssessment -Path <report-folder> -Resume -DisableTelemetry -NoBrowser
    ```

The run writes `ZeroTrustAssessmentReport.html` and `ZeroTrustAssessmentReport-classic.html` in `<report-folder>`, and `zt-export\ZeroTrustAssessmentReport.json` (the report data the kit reads), `ZeroTrustWorkshop.json`, the exported entities, a database and logs under `zt-export`.[^zta-guide] Everything under `zt-export` is assessment data, not just logs.

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| CA-2 and CA-7: the assessment run | KSI-PIY-RIS, KSI-MLA-EVC | The export's SHA-256 and `run-hashes.csv` |
| AU-9: the output protected from modification | KSI-MLA-OSM | The hashes, taken before anyone opened the files |

: Step 5 requirements and evidence {.striped .hover}

**Government-cloud availability.** The run is local; coverage follows Step 4's connections.

::: {.callout-important}
## Validate (G5 Run it)
- `<report-folder>\zt-export\ZeroTrustAssessmentReport.json` exists, ends with the `EndOfJson` marker (the kit checks it), and its SHA-256 is recorded.
- Gate owner: the assessment operator.
:::

::: {.callout-tip}
## Labs and training: G5 Run it
- **In a test tenant:** [Module 2, Lab 2](../../training/zero-trust-assessment/02-running-the-assessment-safely.md#zta-lab-2) runs Steps 2 to 5
- **As training:** [Module 2: Running the assessment safely](../../training/zero-trust-assessment/02-running-the-assessment-safely.md), with a knowledge check
:::

**Rollback.** None in the tenant. Delete an abandoned run's folder under the records rule.

## Step 6: Read the report {#zta-step-6}

**Authority:** Microsoft-recommended for reading the rubric (Learn's glossary). **Applies:** all tenants.

The report opens on an Overview tab, then a tab per pillar; each test shows its risk and its status, and a selected test describes what was tested and the recommended remediation.[^zta-start] Learn's page still names the Identity, Devices, Network and Data tabs; release 3.1.0's redesigned report has seven pillars.[^zta-release] Microsoft rates each recommendation on three scales:[^zta-glossary]

| Scale | High | Medium | Low |
|---|---|---|---|
| Risk Level | Potential environment-wide exposure until mitigated | Moderate exposure | Defense in depth or an operational optimization |
| User Impact | Many non-privileged users act or are told | A subset of users | Administrators act; users needn't be told |
| Implementation Cost | Programs needing ongoing commitment | Projects | Targeted actions |

: The Zero Trust Assessment's rubric {.striped .hover}

The tool's source adds Critical and Unranked to the risk levels.[^zta-class] Each test ends in one of six statuses: Passed, Failed, Investigate, Skipped, Planned or Error.[^zta-status] Investigate means the tool needs a person to look; Skipped carries a reason (not licensed, not connected, not applicable, not supported, timed out), and Planned is a test still under construction.[^zta-skip]

**Steps.**

1. **Open the report** from the protected folder on the assessment host:

    ```powershell
    Invoke-Item <report-folder>\ZeroTrustAssessmentReport.html
    ```

2. **Each pillar owner reads their tab** with the risk and status filters, and notes every Investigate result, every Skipped and Error result with its reason, and every Failed result whose feature may not be available in the tenant's cloud ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#absence-of-evidence-is-a-different-claim)).

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| CA-2: assessment results reviewed by the owners | KSI-PIY-RIS | Each owner's reading notes, dated |

: Step 6 requirements and evidence {.striped .hover}

**Government-cloud availability.** Feature availability per test follows each product's government service description; check the description before treating a failed premium test as a gap.

::: {.callout-important}
## Validate (G6 Read the report)
- Every pillar owner has dated reading notes, including the Investigate results they will review in Step 7.
- Gate owner: the pillar owners, through the program lead.
:::

**Rollback.** Not applicable: nothing changes.

## Step 7: Normalize the results {#zta-step-7}

**Authority:** Risk-based recommended (the program's method, [Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#a-normalized-result-taxonomy)). **Applies:** every run.

The kit records every result twice: the tool's own value, unchanged, and one of seven normalized results. A skipped test is not a failed control and not a pass; it goes in its own column with its reason. Investigate counts as a finding until a manual review confirms or dismisses it, and the review is recorded with the reviewer.

| Normalized result | Zero Trust Assessment 3.1.0 | Counted as |
|---|---|---|
| Pass | Passed | Evidence of conformance for that run |
| Fail | Failed; Investigate until reviewed | A finding |
| Planned | Planned (`UnderConstruction`) | Neither |
| Skipped-Licensing | `NotLicensedEntraIDP1`, `NotLicensedEntraIDP2`, `NotLicensedEntraIDGovernance`, `NotLicensedEntraWorkloadID`, `NotLicensedIntune`, `NoCompatibleLicenseFound` | Neither; a licensing decision |
| Skipped-Disconnected | `NotConnectedAzure`, `NotConnectedExchange`, `NotConnectedSecurityCompliance`, `NotConnectedToService`, `NoAzureAccess` | Neither; fix the run's scope |
| Skipped-Not-Applicable | `NotApplicable`, `NotDotGovDomain`, `NotSupported` | Neither; `NotSupported` flagged as a boundary finding, `NotDotGovDomain` for review |
| Unable-to-Evaluate | Error; `TimeoutReached`; any status or reason the taxonomy doesn't list | Neither; fix the run or verify by hand |

: The taxonomy as the kit applies it {.striped .hover}

`NotDotGovDomain` deserves a look in a federal tenant: the tool skips the test because it found no .gov domain, which for an agency usually means the domain isn't verified in the tenant.[^zta-skip]

**Steps.** On the assessment host, from `<kit>`:

1. **Record the manual review of each Investigate result** in a reviews file written at work from `templates/reviews.template.csv` (the kit's [Copilot prompts](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/zta-results/copilot-prompts.md) help draft it). Each row names the test, `confirmed` or `dismissed`, the reviewer and the date.

2. **Normalize the run:**

    ```powershell
    ./Invoke-ZtaNormalize.ps1 -ExportPath <report-folder> -OutputPath out/<run-date> -ReviewsPath <reviews-file>
    ```

    `<run-date>` is the run's date, `yyyy-mm-dd`; `<reviews-file>` is the reviews CSV. The script writes `results.json` and `results.csv` (every test, both values), `summary.json` and `summary.md` (counts by normalized result and by pillar), `dispositions.csv` (every result that is neither a pass nor a finding, with what to do) and `manifest.json` (the export's SHA-256 and every output's). No result text from the tool is copied, because it can name tenant objects.

3. **Work the dispositions**: a licensing decision for each Skipped-Licensing row, a fix and re-run for each Skipped-Disconnected and Unable-to-Evaluate row, a recorded reason for each Skipped-Not-Applicable row. Disposition records live in [Book 13, Chapter 12](../b13-governance/12-governance-at-scale.md#disposition-register)'s register.

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| CA-2, CA-7, CM-6: results normalized and counted honestly | KSI-PIY-RIS, KSI-MLA-EVC, KSI-SVC-ACM | `results.json`, `summary.json`, `dispositions.csv`, the reviews file |

: Step 7 requirements and evidence {.striped .hover}

**Government-cloud availability.** The kit reads files only; it runs the same in every cloud.

::: {.callout-important}
## Validate (G7 Normalize)
- `Invoke-ZtaNormalize.ps1` prints no warning about an unreviewed taxonomy or an unmapped value; if it does, review `config/taxonomy.json` against the new version before using the counts.
- Every Investigate result has a row in the reviews file.
- Gate owner: the assessment operator, with the ISSO.
:::

**Rollback.** Delete the output folder and re-run; the export is unchanged.

## Step 8: Open the closure register and route each finding {#zta-step-8}

**Authority:** Risk-based recommended (the program's method, [Book 11, Chapters 08 and 10](../b11-zero-trust/10-evidence-not-verdicts.md#the-closure-chain)). **Applies:** every finding.

Every finding gets one closure-register entry with the fields of Book 11's closure chain: the finding and its tool version, the attack path, the owner, its dependencies, the change, the pilot, the enforcement, the test, the evidence, the residual risk, the reassessment and the weighting. The kit fills what the tool and the family table know and leaves the rest as placeholders a person fills; it never marks a finding ready for closure.

**Where each finding family is remediated.** The table is [Book 11, Chapter 08's](../b11-zero-trust/08-close-before-you-assess.md#finding-families), with one row the guide adds (identity risk triage) and the evidence that shows each family's finding is ready for closure. The kit's `config/finding-families.json` holds the same table and routes each test ID to its family.

| Finding family | Remediation page | Evidence that shows it's ready for closure |
|---|---|---|
| Emergency access | [Book 04, Chapter 04](../b04-access/04-privileged-roles-and-tiers.md#emergency-access-reference-architecture) | Two cloud-only emergency accounts with phishing-resistant credentials, excluded from blocking Conditional Access; the sign-in alert fired on a test sign-in; the quarterly validation record |
| Standing privilege and PIM | [Book 04, Chapter 08](../b04-access/08-pim-self-request-with-approval.md#role-setting-export-and-exception-register) | The PIM role-setting export; no permanent active assignment outside the exception register; an activation test with its approval and audit record |
| Phishing-resistant admin authentication | [Book 04, Appendix D](../b04-access/appendix-d-phishing-resistant-authentication-runbooks.md) | The authentication strength export; a registration report for every privileged user; a refused test sign-in without a phishing-resistant method |
| Conditional Access gaps | [Book 04, Chapter 07](../b04-access/07-the-conditional-access-policy-library.md#policy-design-matrix) | The policy export; report-only results reviewed; the policy enforced with registered exclusions; a test sign-in blocked as designed |
| Application secrets | [Book 13, Chapter 14](../b13-governance/14-application-secret-and-configuration-governance.md#secrets-governance) | The credential inventory with no secret outside the exception register; each moved workload signing in with a managed identity or certificate |
| Ownerless privileged applications | [Book 13, Chapter 14](../b13-governance/14-application-secret-and-configuration-governance.md#application-governance-record) | The governance record with an owner for every privileged application |
| Redirect URI risk | [Book 08, Chapter 06](../b08-ddi/06-dns-identity-and-dnssec.md#redirect-uris-and-dns-ownership) | The redirect URI inventory reconciled to owned DNS zones |
| Device compliance gaps | [Book 05, Chapter 10](../b05-devices/10-operating-and-evidencing-the-fleet.md#compliance-architecture) | Compliance policy exports; device-based Conditional Access enforced; a noncompliant test device refused |
| Endpoint hardening gaps | [Book 05, Chapter 08](../b05-devices/08-gpo-to-intune-policy-migration.md#windows-hardening-rollout); the [Defender XDR guide](defender-xdr-implementation.md) | Onboarding coverage; ASR and prevention in block mode with registered exclusions; a test detection that raised its alert |
| Network access gaps | The [Global Secure Access guide](global-secure-access-implementation.md) | Forwarding profile and policy exports; the in-scope population routed; a blocked test destination |
| DDoS, WAF and public exposure | The [Azure Security Engineering guide](azure-security-implementation.md) | The exposure register; DDoS protection and WAF in prevention mode on every in-scope endpoint; a blocked test request |
| No labels, defaults or containers | [Book 20, Chapters 02 to 04](../b20-information-protection/index.md) | Label and label policy exports; default and container labels published; label activity in the audit log |
| Rights Management and mail encryption | [Book 20, Chapters 05 and 06](../b20-information-protection/index.md) | The service activated; encrypting labels published; a protected test message opened only by its recipient |
| Audit and visibility gaps | [Book 12, Chapter 02](../b12-security-operations/02-the-evidence-contract.md#data-and-endpoint-telemetry) | Diagnostic settings exports; every expected table arriving; the telemetry-completeness check passing |
| Identity risk triage (added by this guide) | [Book 12, Appendix B](../b12-security-operations/appendix-b-identity-and-application-detections.md) | The risky-user and risky-sign-in detections deployed; the daily triage record ([Book 15, Chapter 12](../b15-day2-operations/12-the-day-two-runbook.md#the-cadence-by-control-family)) |
| Skipped or unevaluated tests | [Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#a-normalized-result-taxonomy); [Book 13, Chapter 12](../b13-governance/12-governance-at-scale.md#disposition-register) | Step 7's dispositions, each with its reason and decision |

: Finding family, remediation page and ready-for-closure evidence {.striped .hover}

A finding that matches no family, by test ID or by the tool's category, is *unrouted*: the register gives it to the Zero Trust program lead, who routes it ([Book 11, Chapter 07](../b11-zero-trust/07-who-owns-zero-trust.md)). In release 3.1.0, the email and collaboration threat-protection tests (Safe Links, Safe Attachments, anti-phishing) have no family in Chapter 08's table; until one exists, they stay unrouted and visible.

**Weigh, then order.** The kit sets a default priority: severity is the risk weight times the status factor, priority is severity divided by the effort the implementation cost implies, in buckets P1 to P4 (`config/taxonomy.json`, *design guidance*). The owner then weighs each finding on Chapter 10's six factors (exploitability, blast radius, exposure, compensating controls, effort and dependency order) and writes the rationale into the entry ([Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#weigh-the-finding-not-the-pass-rate)). The register lists each family's dependencies, so a Conditional Access finding waits for emergency access to be right.

**Exceptions.** The Zero Trust Assessment has no exception file of its own, so accepted findings go in an exceptions file in the program's repository, with the same approval rule as ScubaGear's omissions: an exception with an expiry is the CISO's decision; one without is a standing risk acceptance for the authorizing official ([Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#exceptions-belong-in-the-configuration-file-with-an-owner)). The kit checks each one and marks it a governed exception, a lapsed acceptance or a wrong approver; these are Chapter 08's three dispositions.

**Steps.**

1. **Write the register**, with the exceptions file written at work from `templates/exceptions.template.csv`:

    ```powershell
    ./Invoke-ZtaRegister.ps1 -RunPath out/<run-date> -OutputPath out/<run-date>-register -ExceptionsPath <exceptions-file>
    ```

    The script writes `register.json` (every entry, with every field), `register.csv` (one row per finding, for the tracker) and `manifest.json`, and warns about unrouted findings and exceptions to fix.

2. **Each owner fills their entries**: the change record, the pilot, the test, the weighting rationale. Findings not fixed in the next change window and not covered by an approved exception become plan of action and milestones items ([Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#from-findings-to-plans-of-action-and-milestones)).

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| CA-5 (plan of action and milestones): each finding's planned remediation | None listed in Book 13, Appendix A | `register.json` and `register.csv`; the POA&M items they seed |
| RA-7 (risk response): findings weighed against risk tolerance, exceptions approved by the right official | None listed | The weighting rationale; the exceptions file and its SHA-256 |
| CA-7: findings correlated to owners and pages | KSI-MLA-EVC | The register |

: Step 8 requirements and evidence {.striped .hover}

**Government-cloud availability.** Files only; the same in every cloud.

::: {.callout-important}
## Validate (G8 Register and route)
- `Invoke-ZtaRegister.ps1` reports no unrouted finding the program lead hasn't assigned, and no lapsed or wrongly approved exception.
- Every entry has an owner who has acknowledged it.
- Gate owner: the Zero Trust program lead.
:::

::: {.callout-tip}
## Labs and training: G8 Register and route
- **On a laptop, no tenant:** [Module 3, Lab 1](../../training/zero-trust-assessment/03-from-results-to-a-closure-register.md#zta-lab-1) runs Steps 7 and 8 on the kit's fixtures
- **In a test tenant:** [Module 3, Lab 2](../../training/zero-trust-assessment/03-from-results-to-a-closure-register.md#zta-lab-2)
- **As training:** [Module 3: From results to a closure register](../../training/zero-trust-assessment/03-from-results-to-a-closure-register.md), with a knowledge check
:::

**Rollback.** Delete the register folder and re-run; the owners' filled fields live in the agency's tracker, not in the kit's output.

## Step 9: Reconcile with ScubaGear and AWS Security Hub CSPM {#zta-step-9}

**Authority:** Risk-based recommended. **Applies:** every agency that runs ScubaGear (all in BOD 25-01's scope); the AWS part only where the agency runs AWS.

Two tools that use different identifiers can't be matched to each other directly. The program matches both to a common spine: the setting itself, and the NIST SP 800-53 control it supports ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#reconcile-at-the-control-not-tool-to-tool)). When two tools fail the same setting under the same control, that is one finding with two pieces of evidence, routed to one owner. Each tool sees only its own platform: the Zero Trust Assessment reads Microsoft's cloud, ScubaGear reads Microsoft 365, Security Hub CSPM reads AWS. None of them sees the others' gaps.

**ScubaGear.** CISA maps every SCuBA policy to SP 800-53 Rev. 5 controls in the FedRAMP High baseline, and ScubaGear's policies overlap the Zero Trust Assessment mostly on Entra ID identity and email threat policies ([Chapter 05](../b11-zero-trust/05-two-assessment-tools.md#where-they-overlap-and-where-they-dont)). Where both fail, the ScubaGear finding is the BOD 25-01 deviation and carries the directive's reporting; the Zero Trust Assessment finding is supporting evidence for the same control.

**AWS Security Hub CSPM.** Security Hub CSPM's NIST SP 800-53 Revision 5 standard supports a subset of the framework's requirements: in AWS's words, it provides security controls that "support a subset of NIST SP 800-53 Revision 5 requirements," performs automated checks only, and doesn't support requirements that need manual checks; the standard and its controls represent the service's understanding of the guidelines.[^zta-sh-nist] Each control finding lists its standards and its related requirements, such as `NIST.800-53.r5 AC-4`, which is the spine.[^zta-sh-asff] Its compliance statuses map to the taxonomy like this:

| Security Hub CSPM compliance status | AWS's meaning | Normalized |
|---|---|---|
| `PASSED` | Passed for all evaluated resources | Pass |
| `FAILED` | Failed for at least one evaluated resource | Fail |
| `WARNING` | Security Hub CSPM can't tell, for example AWS Config isn't recording the resource type | Unable-to-Evaluate |
| `NOT_AVAILABLE` | A service failure, a deleted resource, or AWS Config returned not applicable | Unable-to-Evaluate, or Skipped-Not-Applicable when the reason is not applicable |

: Security Hub CSPM statuses in Book 11's taxonomy (the program's mapping) {.striped .hover}

AWS also notes that a control with no corresponding resources produces a `PASSED` finding at the account level,[^zta-sh-status] so a pass there can mean nothing was evaluated; read it with the resource inventory.

**The same spine on the other clouds, one line each.** Oracle Cloud Infrastructure's Cloud Guard and Google Cloud's Security Command Center are each platform's posture service; [Book 12, Chapter 08](../b12-security-operations/08-cloud-native-posture.md) compares them and how their findings enter the evidence contract.

**Steps.**

1. **Pull Security Hub CSPM's active NIST SP 800-53 findings** where the agency runs AWS, as a role that can read Security Hub findings, in each Region in scope (GovCloud uses its own Regions):[^zta-sh-asff]

    ```bash
    aws securityhub get-findings --region <region> \
      --filters '{"ComplianceAssociatedStandardsId":[{"Value":"standards/nist-800-53/v/5.0.0","Comparison":"EQUALS"}],"RecordState":[{"Value":"ACTIVE","Comparison":"EQUALS"}]}' \
      --query 'Findings[].{control:Compliance.SecurityControlId,status:Compliance.Status,requirements:Compliance.RelatedRequirements}' \
      --output json > securityhub-nist.json
    ```

2. **Fill the reconciliation table** for the controls more than one tool touches: control, setting, each tool's identifier and normalized result, and the one owner. The program's mapping table carries the Zero Trust Assessment tests onto the same controls as CISA's SCuBA mapping ([Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#reconcile-at-the-control-not-tool-to-tool)).

| Control | Setting | Zero Trust Assessment | ScubaGear | Security Hub CSPM | Owner |
|---|---|---|---|---|---|
| `<SP 800-53 control>` | `<the setting>` | `<test ID: normalized>` | `<policy ID: normalized>` | `<control ID: normalized>` or not applicable | `<pillar owner>` |

: Reconciliation table (template) {.striped .hover}

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| CA-7 (continuous monitoring), part e: correlation and analysis of monitoring results | KSI-MLA-EVC | The reconciliation table, with each tool's run date and version |
| CM-6: the setting as the common key | KSI-SVC-ACM | The same |

: Step 9 requirements and evidence {.striped .hover}

**Government-cloud availability.** Security Hub CSPM is available in AWS GovCloud (US) with limits on integrations, some controls and cross-Region aggregation.[^zta-sh-gov]

::: {.callout-important}
## Validate (G9 Reconcile)
- Every control two tools both report has one row and one owner, and no finding counts twice in the backlog.
- Gate owner: the Zero Trust program lead, with the CISO.
:::

**Rollback.** Not applicable: nothing changes.

## Step 10: Re-run on a schedule and keep the evidence {#zta-step-10}

**Authority:** Risk-based recommended for the cadence (the program's choice, inside the frequency CA-7 leaves to the organization); Microsoft-recommended for scheduling the assessment in operations (Learn's Global Secure Access operations guidance). **Applies:** every tenant in scope.

**Cadence** *(design guidance, from [Book 15, Chapter 12](../b15-day2-operations/12-the-day-two-runbook.md#the-cadence-by-control-family))*:

| When | What | Owner |
|---|---|---|
| Monthly | Full run; assessment results and the POA&M regenerated | Assessment operators; the ISSO |
| After each remediation wave | A run of the affected pillar (`-Pillar`), so a fix is closed by evidence, not by a ticket | The pillar owner |
| Before a tool upgrade reaches production | A run of the new version in the test tenant, compared with the old version's results for the same tenant | Assessment operators |
| Quarterly | Trend review: which findings regress, which dispositions recur | The ISSM |

: The Zero Trust Assessment cadence (program design) {.striped .hover}

Learn's operations guidance for Microsoft Entra Private Access and Internet Access includes a weekly *Scheduled Zero Trust Assessment digest* playbook: an Azure Automation runbook that runs the assessment, filters the network pillar's checks, emails pass and fail totals and the differences since the last run, opens a ticket per failed check, and stores the raw JSON in versioned Blob Storage.[^zta-gsa-ops] Two cautions before adopting it. Its suggested "single posture number" is a pass rate, which Book 11 doesn't treat as a maturity score ([Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#weigh-the-finding-not-the-pass-rate)); report counts by normalized result instead. And it gives the automation's managed identity four Graph permissions, while the 3.1.0 module checks its complete permission list and connects with a user, a device code or an application certificate, so whether the playbook runs as written against 3.1.0 is not yet specified.[^zta-gsa-ops][^zta-guide]

**Steps.**

1. **Compare the run with the last one**, from `<kit>`:

    ```powershell
    ./Invoke-ZtaCompare.ps1 -PreviousPath <previous-run> -CurrentPath <current-run> -OutputPath out/<run-date>-compare
    ```

    New, regressed, fixed, still open, and *no longer evaluated*: a finding the tool skipped this time isn't fixed. Runs from different tool versions are refused until someone records that they reviewed the change, with `-AcceptVersionChange '<reviewer and date>'`.

2. **Seal the run's evidence.** Each output folder becomes a record with its controls and KSIs, every file's SHA-256, the export's SHA-256 and the previous record's hash:

    ```powershell
    ./Invoke-ZtaEvidence.ps1 -EvidencePath <evidence-folder> -RunPath out/<run-date> -Operator '<role>'
    ./Invoke-ZtaEvidence.ps1 -EvidencePath <evidence-folder> -RunPath out/<run-date>-register -Operator '<role>'
    ./Invoke-ZtaEvidence.ps1 -EvidencePath <evidence-folder> -RunPath out/<run-date>-compare -Operator '<role>'
    ./Invoke-ZtaEvidence.ps1 -EvidencePath <evidence-folder> -Check -Package re-run -RunDate <run-date>
    ```

    The ISSO can check the folder without the kit, in a POSIX shell: `cd <evidence-folder> && sha256sum -c SHA256SUMS`.

3. **Move the unaltered export into the evidence repository and delete the local folder**, as Learn advises; then hash again to show the copy is the original.

    ```powershell
    New-Item -ItemType Directory -Force -Path <evidence-folder>\exports | Out-Null
    Copy-Item -Recurse <report-folder> <evidence-folder>\exports\<run-date>
    Get-FileHash -Algorithm SHA256 -LiteralPath <evidence-folder>\exports\<run-date>\zt-export\ZeroTrustAssessmentReport.json
    Remove-Item -Recurse -Force <report-folder>
    ```

**The evidence package for a run:** the export's SHA-256 and the export itself in the evidence repository; the normalized results and summary; the dispositions; the reviews and exceptions files with their hashes; the register; the comparison with the previous run; and the chained records with `SHA256SUMS`. Retention follows the records officer's schedule; [Book 11, Chapter 09](../b11-zero-trust/09-running-the-assessment.md#scubagear-as-a-registered-adapter) uses three years as the program's default for assessment evidence.

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| CA-7: assessment at a defined frequency, with changes between runs analyzed | KSI-MLA-EVC, KSI-SVC-ACM | The calendar; each `comparison.json` |
| AU-9 and AU-11 (audit record retention): the evidence protected and kept | KSI-MLA-OSM, KSI-SVC-VRI | `records/`, `records.csv`, `SHA256SUMS`, the exports |
| CA-5: the POA&M regenerated from each run | None listed | The register and the POA&M items |

: Step 10 requirements and evidence {.striped .hover}

**Government-cloud availability.** The kit runs anywhere. Learn's playbook relies on Azure Automation, Logic Apps and Blob Storage; their availability in Azure Government for this use is not yet specified here.

::: {.callout-important}
## Validate (G10 Re-run and keep evidence)
- `Invoke-ZtaEvidence.ps1 -Check -Package re-run -RunDate <run-date>` passes every row.
- The comparison's *no longer evaluated* rows each have a fix-and-re-run task.
- Gate owner: the ISSO.
:::

::: {.callout-tip}
## Labs and training: G10 Re-run and keep evidence
- **On a laptop, no tenant:** [Module 4, Lab 1](../../training/zero-trust-assessment/04-reconcile-re-run-and-keep-the-evidence.md#zta-lab-1) compares, seals and breaks the evidence
- **In a test tenant:** [Module 4, Lab 2](../../training/zero-trust-assessment/04-reconcile-re-run-and-keep-the-evidence.md#zta-lab-2)
- **As training:** [Module 4: Reconcile, re-run and keep the evidence](../../training/zero-trust-assessment/04-reconcile-re-run-and-keep-the-evidence.md), with a knowledge check
:::

**Rollback.** Remove the calendar entry; keep the evidence.

## Control states, change safety and assessment mapping {#zta-control-states}

This section states the guide against [Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md). The Zero Trust Assessment is read-only: it enforces nothing, so the states describe the assessment capability, not a control in the tenant.

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | [Step 1](#zta-step-1): the decision record; [the RACI](#zta-raci) | The approved decision record |
| Configured | [Steps 2 to 4](#zta-step-2): the host, the pinned version, the consent and roles, the connections | Module version, grant review, role assignments, connection context |
| Enforced | Not applicable: the assessment enforces nothing. The only writes are Step 1's subscription tags and Step 3's consent, both under change control | The tag and consent records |
| Evidenced | [Steps 5 to 8](#zta-step-5): the hashed export, the normalized results, the register | The kit's outputs and their manifests |
| Operated | [Step 10](#zta-step-10): the cadence, the comparison, the sealed package | The calendar, each comparison, the evidence check |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

**How-template coverage.** Prerequisites: [Prerequisites](#zta-prerequisites) and each step's. Pilot: the first run in a test tenant of the same cloud (the [interim path](#zta-gov-availability)), then one production tenant. Report-only or audit phase: not applicable; the whole tool observes. Enforcement: not applicable. Rollback: [Rollback](#zta-rollback). Exclusions: Step 8's exceptions file, with its approval rule; there are no sign-in exclusions because nothing blocks. Telemetry: the run account's sign-ins and the consent grant in the identity logs ([Book 12, Chapter 03](../b12-security-operations/03-identity-telemetry.md)); the tool's per-run logs. Evidence: [Evidence catalog](#zta-evidence-catalog). Day-two ownership: the [RACI](#zta-raci) and Step 10's cadence.

**Change safety** *(design guidance)*. The assessment changes nothing in the tenant. The two writes the procedure makes, Step 1's subscription tags and Step 3's consent, follow the change record:

| Ring | Scope | Exit criteria |
|---|---|---|
| 0 | A test tenant in the agency's cloud | A complete run; every skip explained |
| 1 | One production tenant, one pillar (`-Pillar Identity`) | The run completes; the grant review matches `Get-ZtGraphScope` |
| 2 | The production tenant, every pillar in scope | The evidence check passes |

- **Emergency access:** not applicable: no sign-in is restricted. The assessment account is never an emergency access account.
- **Change window:** the change record for the tags and the consent, approved by the CISO.
- **Backout triggers:** consent requested for a permission outside `Get-ZtGraphScope`'s list; a run that reaches a tenant or cloud the decision record doesn't name.
- **Post-change validation:** Steps 3 and 4's **Validate**.

::: {.callout-note appearance="simple"}
## Assessment mapping {#zta-assessment-mapping}
- **Microsoft Zero Trust pillar:** all seven, as the tool's pillars (Identity, Devices, Network, Data, Infrastructure, Security Operations, AI)
- **CISA ZTMM pillar:** all five, through the cross-cutting Visibility and Analytics and Governance capabilities
- **Depends on:** Identity, for the run account and its consent ([Privileged Access implementation guide](privileged-access-implementation.md)); SecOps, for the logs of the run account ([Book 12](../b12-security-operations/index.md))
- **Attack chain interrupted:** none directly; the assessment finds the configuration gaps that leave Initial Access, Privilege Escalation, Persistence and Exfiltration open, and its findings route to the pages that close them
:::

## Decision record, RACI, evidence catalog and metrics {#zta-artifacts}

The six artifacts of the closure update fit a read-only tool where they have something to hold. A reference architecture adds nothing beyond [Chapter 09's pipeline](../b11-zero-trust/09-running-the-assessment.md#the-four-stage-pipeline); the checklist is [below](#zta-checklist).

### Decision record {#zta-decision-record}

One record per tenant, kept in the agency's repository inside its boundary. The fields are the program's design.

```yaml
# decision-record: Zero Trust Assessment, one per tenant (program template)
tenant: "<tenant>"
cloud: "<Commercial | GCC>"
tool: {name: "Zero Trust Assessment", version: "<x.y.z>", source: "PowerShell Gallery"}
scope:
  pillars: ["<All | Identity | Devices | Network | Data | Infrastructure | SecOps | AI>"]
  infrastructure_subscriptions: ["<subscription-id>"]
not_a_substitute_for: "ScubaGear under BOD 25-01"
accounts:
  consent_administrator: "<role>"
  run_account: "<upn>, eligible roles: Global Reader, Security Reader, SharePoint Administrator, <others>"
  application: "<Microsoft Graph PowerShell | dedicated app registration>"
telemetry: "<enabled | -DisableTelemetry>"
host: "<dedicated Windows host inside the boundary>"
output: {report_folder: "<protected path>", evidence_repository: "<path>", retention: "<records schedule entry>", delete_local_after: "<days>"}
cadence: "<monthly | ...>, plus after each remediation wave"
approved_by: "<CISO>, <date>"
review_date: "<date>"
```

### RACI {#zta-raci}

R responsible, A accountable, C consulted, I informed. The roles are [Book 11, Chapter 07](../b11-zero-trust/07-who-owns-zero-trust.md)'s; the assignment is the program's design.

| Activity | ZT program lead | CISO / ISSO | AO | Pillar owners | Identity-plane owner | Assessment operators | Assessors |
|---|---|---|---|---|---|---|---|
| Decision record, tool version | C | A | I | C | C | R | I |
| Consent and run account | I | A | | | R | C | |
| Run, hash, store | I | A | | | | R | I |
| Read the report, review Investigate results | C | I | | R | C | C | |
| Normalize and register | A | C | | C | | R | I |
| Route unrouted findings, set priority | A/R | C | C | R | C | | |
| Expiring exceptions | C | A | C | R | | | |
| Standing exceptions | C | R | A | C | | | |
| Reconcile with ScubaGear and Security Hub | A | C | | R | | R | C |
| Evidence package and its check | C | A | I | | | R | C |
| Closure of a finding | I | C | A (POA&M) | R | | | A (assessment finding) |

: RACI for the Zero Trust Assessment {.striped .hover}

### Evidence catalog {#zta-evidence-catalog}

| Evidence | Kind | Produced by | Kept |
|---|---|---|---|
| Decision record | Configuration | Step 1 | Repository, each revision |
| Module and PowerShell versions; grant review; role assignments | Configuration | Steps 2 and 3 | With each run |
| Export SHA-256 and `run-hashes.csv`; the export itself | Operational | Steps 5 and 10 | Evidence repository |
| `results.json`, `summary.json`, `dispositions.csv` | Operational | Step 7 | Evidence records |
| Reviews file (Investigate) | Test | Step 7 | Evidence records, hashed in the manifest |
| Exceptions file | Exception | Step 8 | Repository; hashed in the register's manifest |
| `register.json`, `register.csv` | Assessor-ready | Step 8 | Evidence records; seeds the POA&M |
| Reconciliation table | Assessor-ready | Step 9 | With each run |
| `comparison.json`; `records/`, `records.csv`, `SHA256SUMS` | Assessor-ready | Step 10 | Evidence repository, by the records schedule |

: Evidence catalog {.striped .hover}

**Evidence checklist**

- [ ] **Configuration:** the decision record, the pinned module version, the grant review and the run account's role assignments, kept with each run
- [ ] **Operational:** the export and its SHA-256, the normalized results and summary, kept by the records schedule
- [ ] **Test:** the reviews of Investigate results (reviewer and date), and a test-tenant run after every tool upgrade compared with the previous version
- [ ] **Exception:** the exceptions file with approver and expiry; the dispositions of skipped and unevaluated results
- [ ] **Assessor-ready artifact:** the register, the comparison and the chained evidence records with `SHA256SUMS`, traceable to the four above

### Metrics {#zta-metrics}

Report counts, not a pass rate ([Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#weigh-the-finding-not-the-pass-rate)). *(Design guidance)*

| Metric | From | Read it as |
|---|---|---|
| Findings by normalized result and by pillar | `summary.json` | The state of each pillar on the run date |
| Findings by bucket (P1 to P4) and by family | `register.csv` | Where the work is |
| New, regressed, fixed, no longer evaluated | `comparison.json` | Whether remediation is holding, and whether the run lost coverage |
| Skipped and unevaluated, by reason | `dispositions.csv` | Coverage the run didn't have: licensing, connections, the boundary |
| Unrouted findings and exceptions to fix | `register.json` | Governance gaps |
| Days a P1 finding stays open | The register over time | Response against risk tolerance |

: Metrics {.striped .hover}

## Federal requirements and KSIs {#zta-requirements}

The steps support these controls; they don't by themselves decide them. KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its own evidence up with them and doesn't report them ([Book 00, Appendix B](../b00-orientation/appendix-b-engagement-archetype.md)). The KSI column follows [Book 13, Appendix A](../b13-governance/appendix-a-requirements-mapping.md); "none listed" means that appendix lists none.

| Step | NIST SP 800-53 Rev. 5 | KSI | What the ISSO keeps |
|---|---|---|---|
| 1 Decide | CA-2, CA-7 | KSI-PIY-RIS, KSI-MLA-EVC | The decision record |
| 2 Host | CM-6, AU-9, SI-12 | KSI-SVC-ACM, KSI-MLA-OSM | Versions; folder permissions |
| 3 Consent | AC-6, AC-2, CM-8 | KSI-IAM-ELP, KSI-IAM-JIT | Grant review; role assignments |
| 4 Connect | CA-2, CA-7 | KSI-PIY-RIS, KSI-MLA-EVC | Connection context |
| 5 Run | CA-2, CA-7, AU-9 | KSI-PIY-RIS, KSI-MLA-EVC, KSI-MLA-OSM | Export hashes |
| 6 Read | CA-2 | KSI-PIY-RIS | Reading notes |
| 7 Normalize | CA-2, CA-7, CM-6 | KSI-PIY-RIS, KSI-MLA-EVC, KSI-SVC-ACM | Results, summary, dispositions |
| 8 Register | CA-5, RA-7, CA-7 | KSI-MLA-EVC (none listed for CA-5, RA-7) | Register; exceptions |
| 9 Reconcile | CA-7, CM-6 | KSI-MLA-EVC, KSI-SVC-ACM | Reconciliation table |
| 10 Re-run | CA-7, AU-9, AU-11, CA-5 | KSI-MLA-EVC, KSI-MLA-OSM, KSI-SVC-VRI | Comparison; evidence records |

: Requirements and KSIs by step {.striped .hover}

The Zero Trust Assessment is not a BOD 25-01 tool, and nothing in this guide reports to CISA; ScubaGear's reporting stays as [Book 11, Chapter 04](../b11-zero-trust/04-scuba-and-bod-25-01.md) describes. OMB M-22-09 asks agencies to move toward Zero Trust across the pillars; the assessment's evidence supports measuring that move, and the agency's own maturity targets are its design choices ([Book 11, Chapter 03](../b11-zero-trust/03-what-the-mandates-require.md)).

## Dangers and how to avoid them {#zta-dangers}

| Danger | What goes wrong | Mitigation |
|---|---|---|
| **A skipped test counted as a failure, or as a pass** | A missing license or a lost connection becomes a control failure, or quietly drops out | Step 7's taxonomy; skipped results in their own columns with their reasons |
| **A finding "fixed" because the next run skipped it** | Coverage lost between runs reads as remediation | The comparison's *no longer evaluated* class; fix the run and re-run |
| **The pass rate as the maturity score** | One exposed, tenant-wide gap hides behind a high percentage | Counts by normalized result and pillar; the weighted register |
| **The Zero Trust Assessment instead of ScubaGear** | BOD 25-01's mandatory policies go unassessed and unreported | Run both ([Chapter 05](../b11-zero-trust/05-two-assessment-tools.md#what-this-means-for-an-agency)); Step 9 |
| **Global Administrator for every run** | A privileged session on a host holding the tenant's weaknesses | Consent once; a dedicated reader with eligible roles (Step 3) |
| **Consent on the shared Graph PowerShell app** | Scripts in the tenant inherit the assessment's permissions | A dedicated application (Step 3); review the grants each run |
| **The report folder left on the host or shared** | A map of the tenant's weaknesses, readable by anyone with the folder | Step 2's restricted folder; Step 10's move and delete |
| **Raw reports or logs in a public issue** | Tenant data published; the tool's guide warns against it | Share only through an approved private channel, reviewed and redacted |
| **Scores compared across tool versions** | A new release adds tests and moves the denominator; the score moves though the tenant didn't | The comparison refuses mixed versions without a recorded review |
| **Infrastructure "clean" with no tagged subscription** | The Infrastructure test is skipped as not applicable | Step 1's tags; Step 7's dispositions |

: Dangers in running the Zero Trust Assessment {.striped .hover}

## Rollback {#zta-rollback}

The assessment changes nothing in the tenant. What the procedure leaves behind, and how to remove it:

| Item | Rollback |
|---|---|
| Subscription tags (Step 1) | `Update-AzTag ... -Operation Delete` under change control |
| The module (Step 2) | `Uninstall-PSResource ZeroTrustAssessment -Version '*'` |
| Consent (Step 3) | Remove the dedicated application's grant; never revoke the shared Graph PowerShell grant without assessing other users of it |
| Run account roles (Step 3) | Remove the eligible assignments; disable the account |
| Local output (Steps 5 and 10) | Move to the evidence repository, then delete; review the PowerShell logging folder by the retention rule |
| The kit's outputs (Steps 7 to 10) | Delete and re-run; the evidence records stay |

: Rollback {.striped .hover}

## Checklist {#zta-checklist}

- [ ] Decision record approved: scope, account, cadence, version, telemetry, output handling (Step 1)
- [ ] Infrastructure subscriptions tagged (Step 1)
- [ ] Clean host with PowerShell 7.6 and the pinned module; protected report folder (Step 2)
- [ ] Consent granted once; grants reviewed; run account holds eligible read roles only (Step 3)
- [ ] Connected in the tenant's own cloud, `-SharePointAdminUrl` explicit (Step 4)
- [ ] Run completed; export hashed before it was opened (Step 5)
- [ ] Pillar owners read their tabs; Investigate results reviewed and recorded (Steps 6 and 7)
- [ ] Results normalized with no unmapped value; dispositions worked (Step 7)
- [ ] Register written; no unrouted finding unassigned; exceptions approved by the right official (Step 8)
- [ ] Overlaps with ScubaGear and Security Hub CSPM reconciled to one owner per control (Step 9)
- [ ] Run compared with the last; evidence sealed and checked; local folder moved and deleted (Step 10)

## What couldn't be verified {#zta-what-couldnt-be-verified}

- **GCC on Learn.** Learn's three Zero Trust Assessment pages don't mention GCC. The parameters here are the tool's 3.1.0 source, matched to Learn's per-service pages; a GCC run is unproved by the authors.
- **Azure Information Protection's environment name:** the tool's source only.
- **The run roles.** Learn's *Get started* page lists four roles for later runs and also says Global Reader is enough; the tool's guide gives a different set. Test which applies in your tenant before writing the run book ([Book 11, Chapter 05](../b11-zero-trust/05-two-assessment-tools.md#the-zero-trust-assessment)).
- **Learn's scheduled digest playbook against 3.1.0.** It gives a managed identity four Graph permissions; the module checks its full list and documents user, device code and certificate sign-in, not managed identity.
- **The export's schema.** Microsoft doesn't publish one. The kit reads the fields the 3.1.0 source writes (`Get-ZtAssessmentResults.ps1`, `Add-ZtTestResultDetail.ps1`); a new release can change them, which is why the kit checks the version.
- **Tenant behavior.** Nothing in this guide was run against a tenant. The kit is fixture-tested; every tenant command is unrun by the authors.

## Back to the books

[Book 11, Chapter 05](../b11-zero-trust/05-two-assessment-tools.md) (the two tools) · [Chapter 08](../b11-zero-trust/08-close-before-you-assess.md) (close before you assess) · [Chapter 09](../b11-zero-trust/09-running-the-assessment.md) (running the assessment) · [Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md) (evidence, not verdicts) · [Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md) (conventions) · [Book 13, Appendix A](../b13-governance/appendix-a-requirements-mapping.md) (requirements) · [Book 15, Chapter 12](../b15-day2-operations/12-the-day-two-runbook.md) (cadence) · [Book 12, Chapter 08](../b12-security-operations/08-cloud-native-posture.md) (posture tools on other clouds)

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

This guide has not been published in an edition yet. Each edition is kept, with its Word editions, decks and videos, on the [Archive](../../about/archive.md) page. Every change so far is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/guides/zero-trust-assessment-implementation.md).

<!-- revisions:end -->

[^zta-overview]: Microsoft Learn, "What is the Zero Trust Assessment?" (tests drawn from Microsoft's configuration guidance for Entra, Intune, Azure networks and Purview; aligned with SFI and the Zero Trust pillars; open source), <https://learn.microsoft.com/security/zero-trust/assessment/overview> (accessed Nov 11, 2026).
[^zta-start]: Microsoft Learn, "Get started with the Zero Trust Assessment" (prerequisites, roles, the 21 permissions, sign-in, read-only and local storage, more than 24 hours, the caution on sensitive output, the tabs, removal, `New-PSFSupportPackage`), <https://learn.microsoft.com/security/zero-trust/assessment/get-started> (accessed Nov 11, 2026).
[^zta-glossary]: Microsoft Learn, "Zero Trust assessment terminology" (Risk Level, User Impact, Implementation Cost), <https://learn.microsoft.com/security/zero-trust/assessment/glossary> (accessed Nov 11, 2026).
[^zta-release]: Microsoft, Zero Trust Assessment release 3.1.0, published October 20, 2026, the latest release on November 11, 2026 (module manifest version 3.1.0, `PowerShellVersion = '7.6'`; 364 `Test-Assessment.*.ps1` tests by declared pillar), <https://github.com/microsoft/zerotrustassessment/releases/tag/3.1.0> (accessed Nov 11, 2026).
[^zta-guide]: Microsoft, Zero Trust Assessment repository, "Run the Zero Trust Assessment," tag 3.1.0, `src/powershell/doc/readme.md` (prerequisites; data handling and telemetry; permissions and roles; install, update and remove; connect; run, resume and parameters; infrastructure scope; outputs; logs and support package), <https://github.com/microsoft/zerotrustassessment/blob/3.1.0/src/powershell/doc/readme.md> (accessed Nov 11, 2026).
[^zta-repo]: Microsoft, Zero Trust Assessment repository, README, tag 3.1.0 (a community project maintained by Microsoft employees, not an official Microsoft product, not supported through any Microsoft support program), <https://github.com/microsoft/zerotrustassessment/blob/3.1.0/README.md> (accessed Nov 11, 2026).
[^zta-connect]: Microsoft, Zero Trust Assessment source, tag 3.1.0, `src/powershell/public/Connect-ZtAssessment.ps1` (`-Environment` values; `-ExchangeEnvironmentName` values; `-ClientId`; Security & Compliance connection; SharePoint admin URL inference; AIP environment) and `Get-ZtGraphScope.ps1` (34 scopes), <https://github.com/microsoft/zerotrustassessment/tree/3.1.0/src/powershell/public> (accessed Nov 11, 2026).
[^zta-class]: Microsoft, Zero Trust Assessment source, tag 3.1.0, `src/powershell/classes/ZtTest.ps1` (`RiskLevel` values Critical, High, Medium, Low, Unranked), <https://github.com/microsoft/zerotrustassessment/blob/3.1.0/src/powershell/classes/ZtTest.ps1> (accessed Nov 11, 2026).
[^zta-status]: Microsoft, Zero Trust Assessment source, tag 3.1.0, `src/powershell/private/core/Get-ZtTestStatus.ps1` and `Get-ZtTestResultStatus.ps1` (Passed, Failed, Investigate, Skipped, Planned, Error), <https://github.com/microsoft/zerotrustassessment/tree/3.1.0/src/powershell/private/core> (accessed Nov 11, 2026).
[^zta-skip]: Microsoft, Zero Trust Assessment source, tag 3.1.0, `src/powershell/private/core/Add-ZtTestResultDetail.ps1` (the 16 `SkippedBecause` values) and `Get-ZtSkippedReason.ps1` (their texts, including `NotDotGovDomain`), <https://github.com/microsoft/zerotrustassessment/tree/3.1.0/src/powershell/private/core> (accessed Nov 11, 2026).
[^zta-infra-test]: Microsoft, Zero Trust Assessment source, tag 3.1.0, `src/powershell/tests/Test-Assessment.50001.ps1` (subscriptions where `tags['ZeroTrustAssessment'] =~ 'Infrastructure'`; none tagged is skipped as `NotApplicable`), <https://github.com/microsoft/zerotrustassessment/blob/3.1.0/src/powershell/tests/Test-Assessment.50001.ps1> (accessed Nov 11, 2026).
[^zta-graph-clouds]: Microsoft Learn, "Microsoft Graph national cloud deployments" (GCC uses the worldwide endpoints), <https://learn.microsoft.com/graph/deployments> (accessed Nov 11, 2026).
[^zta-mg-env]: Microsoft Learn, "Authentication module cmdlets in Microsoft Graph PowerShell," section "Use Get-MgEnvironment" (`-Environment Global`), <https://learn.microsoft.com/powershell/microsoftgraph/authentication-commands> (accessed Nov 11, 2026).
[^zta-mg-custom]: Microsoft Learn, "Authentication module cmdlets in Microsoft Graph PowerShell," section "Use delegated access with a custom application for Microsoft Graph PowerShell" ("if you need to isolate and limit the consent permissions granted for Microsoft Graph PowerShell usage"), <https://learn.microsoft.com/powershell/microsoftgraph/authentication-commands> (accessed Nov 11, 2026).
[^zta-mg-revoke]: Microsoft Learn, "Grant and revoke API permissions in Microsoft Entra ID" (`Get-MgOauth2PermissionGrant`, `Remove-MgOauth2PermissionGrant`; existing tokens stay valid for their lifetime), <https://learn.microsoft.com/powershell/microsoftgraph/how-to-grant-revoke-api-permissions>, and "Review permissions granted to enterprise applications" (Cloud Application Administrator), <https://learn.microsoft.com/entra/identity/enterprise-apps/manage-application-permissions> (both accessed Nov 11, 2026).
[^zta-exo]: Microsoft Learn, "Connect to Exchange Online PowerShell," step 2 (`-ExchangeEnvironmentName`: none needed in Microsoft 365 or GCC), <https://learn.microsoft.com/powershell/exchange/connect-to-exchange-online-powershell> (accessed Nov 11, 2026).
[^zta-ipps]: Microsoft Learn, "App-only authentication for unattended scripts in Exchange Online PowerShell and Security & Compliance PowerShell," connection examples (the default Security & Compliance connection), <https://learn.microsoft.com/powershell/exchange/app-only-auth-powershell-v2> (accessed Nov 11, 2026).
[^zta-azgov]: Microsoft Learn, "Quickstart: Connect to Azure Government with PowerShell" (`Connect-AzAccount -Environment AzureUSGovernment`), <https://learn.microsoft.com/azure/azure-government/documentation-government-get-started-connect-with-ps> (accessed Nov 11, 2026).
[^zta-tags]: Microsoft Learn, "Use tags to organize your Azure resources and management hierarchy," Azure PowerShell (`Update-AzTag` with `-Operation Merge` and `Delete` on a subscription resource ID), <https://learn.microsoft.com/azure/azure-resource-manager/management/tag-resources-powershell> (accessed Nov 11, 2026).
[^zta-gsa-ops]: Microsoft Learn, "Operate Microsoft Entra Private Access," sections "Automated posture assessment" (a configuration-posture check, not a real-time detector) and "Playbook 7: Scheduled Zero Trust Assessment digest," <https://learn.microsoft.com/entra/global-secure-access/how-to-operate-private-access>, and "Operate Microsoft Entra Internet Access," the same playbook, <https://learn.microsoft.com/entra/global-secure-access/how-to-operate-internet-access> (both accessed Nov 11, 2026).
[^zta-sh-nist]: AWS, AWS Security Hub CSPM User Guide, "NIST SP 800-53 Revision 5 in Security Hub CSPM," <https://docs.aws.amazon.com/securityhub/latest/userguide/standards-reference-nist-800-53.html> (accessed Nov 11, 2026).
[^zta-sh-asff]: AWS, AWS Security Hub CSPM User Guide, "Optional top-level ASFF attributes," `Compliance` (`AssociatedStandards` with `standards/nist-800-53/v/5.0.0`; `RelatedRequirements` such as `NIST.800-53.r5 AC-4`; `SecurityControlId`; `Status`), <https://docs.aws.amazon.com/securityhub/latest/userguide/asff-top-level-attributes.html>, and the AWS SDK reference for `GetFindings` filters (`ComplianceAssociatedStandardsId`), <https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SecurityHub.html> (both accessed Nov 11, 2026).
[^zta-sh-status]: AWS, AWS Security Hub CSPM User Guide, "Evaluating compliance status and control status" (`PASSED`, `FAILED`, `WARNING`, `NOT_AVAILABLE`; an account-level `PASSED` finding when no resources correspond to a control), <https://docs.aws.amazon.com/securityhub/latest/userguide/controls-overall-status.html> (accessed Nov 11, 2026).
[^zta-sh-gov]: AWS, AWS GovCloud (US) User Guide, "AWS Security Hub CSPM in AWS GovCloud (US)," "How Security Hub CSPM differs" (product integrations, controls, cross-Region aggregation), <https://docs.aws.amazon.com/govcloud-us/latest/UserGuide/govcloud-ash.html> (accessed Nov 11, 2026).
