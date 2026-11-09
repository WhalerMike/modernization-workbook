---
title: "Module 9: Govern AI agent identities"
description: "The guide's AI agents section and workbook Chapter 09: read agent identities and blueprints with their sponsors, owners and credentials, check them against the program's rules (creation closed, a reviewed handshake, no secret on a production blueprint, no allAllowed inheritance, the ten-business-day sponsor rule, no shadow AI identity), run the same rules in a cloud without Agent ID, and plan report-only agent Conditional Access by its approved hash. About 65 minutes, with a lab on fixtures and a test tenant lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Books 04, 17"
series-order: 9
review-status: approved
reviewed-sha256: 1df37b52480cf3febe60aaf5474a65a32c9c4e1c98fc557eeee1b371f1e4920e
last-reviewed: 2026-11-09
---
# Module 9: Govern AI agent identities {.unnumbered}

*Part of the [Non-Person Identity learning path](index.md). The guide's [AI agents](../../books/guides/non-person-identity-implementation.md#ai-agents) section. Workbook [Chapter 09](../../project-plans/developer-workbooks/non-person-identity/09-ai-agent-identities.md). About 65 minutes.*

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.5/Training_NPI_Module_9.pptx) · [▶ Watch](../../presentations/watch.html?v=Training_NPI_Module_9_Narrated) (about 15 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_NPI_Module_9_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-9/Training_NPI_Module_9_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-9/Training_NPI_Module_9_Narrated.vtt).

**Also:** the chapter's narrated tour, about 12 minutes: [▶ Watch](../../presentations/watch.html?v=DW_NPI_09_AI_Agent_Identities_Narrated).

## Introduction (3 minutes)

AI agents are non-person identities, and they follow every gate before this module. They add three things. An agent can act, so a sponsor who hasn't confirmed within ten business days of a handover makes it an orphan, an extra trigger on top of the program's disable-first orphan rule. A blueprint holds the credentials for every agent made from it, so one secret on it is every agent's secret. And by default the person who creates an agent becomes its sponsor and owner, so creation has to be gated.

In this module you check a fictional tenant's agents against the program's rules, see the same rules run where the cloud has no agent identities, and plan two report-only agent Conditional Access policies.

**The federal requirement.** The guide's [AI agents](../../books/guides/non-person-identity-implementation.md#ai-agents) section adds to the gates, and its [Evidence](../../books/guides/non-person-identity-implementation.md#evidence) table carries SCuBA MS.AAD.9.1v1 for risky agents. The workbook chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/non-person-identity/09-ai-agent-identities.md#federal-requirements-and-evidence) table has a row for every lab step.

| Requirement | KSI | Evidence |
|---|---|---|
| AC-2 Account Management; OMB M-25-21, section 3(b)(v) | KSI-IAM-SNU | `ai-identities.json`: sponsor, sponsoring group, technical owner and record for every AI identity |
| AC-2; AC-5 Separation of Duties | KSI-IAM-SNU; KSI-IAM-JIT (AC-5) | `findings.json`, NPI-AI-03 to -09 |
| IA-5(2); AC-6; AC-6(5) Privileged Accounts | KSI-IAM-SNU, KSI-SVC-ASM; KSI-IAM-ELP, KSI-IAM-JIT | `findings.json`, NPI-AI-10 to -15 |
| CM-8 System Component Inventory; AC-2(4) Automated Audit Actions | KSI-PIY-GIV (CM-8); KSI-MLA-LET, KSI-MLA-RVL (AC-2(4)) | `findings.json`, NPI-AI-21 to -23: no shadow AI identity |
| AC-3 Access Enforcement; SCuBA MS.AAD.9.1v1; CM-3 | KSI-IAM-ELP, KSI-IAM-JIT; KSI-CMT-LMC, KSI-CMT-RVP | `agent-ca-plan.json`; `results.json` and `manifest.json` from the dry run and the apply |
| SA-9 External System Services | KSI-SCR-MIT, KSI-SCR-MON | `config/agent-id-capabilities-ch09.json`; `Get-NpiAgentCapability` |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines this evidence up with what its providers report against them; it doesn't report KSIs itself. Which file supports which indicator is the program's mapping *(design guidance)*. The guide's [Evidence](../../books/guides/non-person-identity-implementation.md#evidence) section explains both.

## Learning objectives (1 minute)

After this module, you'll be able to:

- describe a blueprint, an agent identity and a sponsor, and why the blueprint is the credential boundary;
- explain decision D-NP6 as data, and what the code does in a cloud without Agent ID;
- run the AI identity check and read its findings, including the P1 drift;
- explain the ten-business-day sponsor rule and what happens to an orphaned agent;
- show that the agent Conditional Access plan is report-only and runs only by its approved hash.

## Prerequisites (1 minute)

- [Module 2](02-owners-and-the-orphan-rule.md): the lab reads Chapter 02's ownership run, which recorded the sponsor fields this chapter fills.
- [Module 6](06-conditional-access.md): Conditional Access for workload identities, report-only first.

## Unit 1: What the guide adds for agents (8 minutes)

Read the guide's [AI agents](../../books/guides/non-person-identity-implementation.md#ai-agents) section: sponsors and blueprints, gated creation, credentials, recertification by expiry, and availability by cloud. Then read:

- The guide's [Orphans](../../books/guides/non-person-identity-implementation.md#orphans): the program's disable-first rule, which Book 17 used for agents first.
- The guide's [Dangers](../../books/guides/non-person-identity-implementation.md#dangers) row "The agent built by whoever was there".

## Unit 2: The rules as code (14 minutes)

Read the workbook chapter in this order:

- [What Microsoft Entra Agent ID is, and its stage](../../project-plans/developer-workbooks/non-person-identity/09-ai-agent-identities.md#what-microsoft-entra-agent-id-is-and-its-stage): which pieces are GA, which are preview, and what GCC lists.
- [Decision D-NP6 as data](../../project-plans/developer-workbooks/non-person-identity/09-ai-agent-identities.md#decision-d-np6-as-data): AgentId mode and Fallback mode.
- [The program's rules the code holds](../../project-plans/developer-workbooks/non-person-identity/09-ai-agent-identities.md#the-programs-rules-the-code-holds) *(design guidance)*.
- [The checks](../../project-plans/developer-workbooks/non-person-identity/09-ai-agent-identities.md#the-checks): NPI-AI-01 to -23, the ten business days, and standing privileged roles.
- [The agent Conditional Access plan and the separate write path](../../project-plans/developer-workbooks/non-person-identity/09-ai-agent-identities.md#the-agent-conditional-access-plan-and-the-separate-write-path).

## Exercise: Lab 1, fixtures, no tenant (25 minutes)

This is the workbook's [Chapter 09, Lab 1](../../project-plans/developer-workbooks/non-person-identity/09-ai-agent-identities.md#lab-1-fixtures-no-tenant), which explains each result. Its step 1 here makes Chapters 01 and 02's runs, so the chapter's steps 1 to 10 are steps 2 to 11 below. Work in `examples/non-person-identity`, in PowerShell 7. The tenant and its agents are fictional, and `-Apply` changes only a fake.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/non-person-identity`. Each step below says what it does and what to look for.

```powershell
# Step 1: Make Chapter 01's register and Chapter 02's ownership run
./Invoke-NpiInventory.ps1 -Cloud gcc -FixturePath tests/fixtures/estate.json -OutputPath out/inventory
./Invoke-NpiOwnership.ps1 -Cloud gcc -RegisterRun out/inventory -FixturePath tests/fixtures/estate.json -InputPath tests/fixtures/inputs -OutputPath out/ownership

# Step 2: Send Learn's samples to the fake
Invoke-Pester -Path tests/NpiAgentId.Tests.ps1 -FullNameFilter '*Learn*' -Output None -PassThru |
    Select-Object PassedCount, FailedCount, NotRunCount

# Step 3: List what each task needs
Import-Module ./powershell/NpiAgentId/NpiAgentId.psm1
foreach ($t in 'agent-id', 'agent-ca-apply') { $p = Get-NpiAgentRequiredPermission -Task $t; "$t : " + ($p.GraphPermissions -join ', ') }

# Step 4: Read D-NP6 for each cloud
'global','gcc','gcchigh','dod' | ForEach-Object { $c = Get-NpiAgentCapability -Cloud $_
    [pscustomobject]@{ Cloud = $_; Mode = $c.Mode; AgentIdentities = $c.AgentIdentities.stage; AgentCA = $c.AgentConditionalAccess.stage; SponsorWorkflows = $c.SponsorWorkflows.stage } } | Format-Table

# Step 5: Check the AI identities and build the plan
./Invoke-NpiAgentId.ps1 -Cloud gcc -RegisterRun out/inventory -OwnershipRun out/ownership -FixturePath tests/fixtures/ch09/agent-estate.json -InputPath tests/fixtures/ch09/inputs -OutputPath out/agent-id

# Step 6: Read the findings
Get-Content out/agent-id/findings.json -Raw | ConvertFrom-Json | Where-Object Severity -eq 'Finding' | Group-Object Rule | Format-Table Name, Count

# Step 7: Read the sponsor fields Chapter 02 recorded, filled
Get-Content out/agent-id/ai-identities.json -Raw | ConvertFrom-Json | Format-Table Name, FederalSponsor, TechnicalOwner, InventoryRecord, Handshake, SponsorState

# Step 8: Run the D-NP6 fallback in GCC High
./Invoke-NpiInventory.ps1 -Cloud gcchigh -FixturePath tests/fixtures/estate.json -OutputPath out/inventory-gcchigh
./Invoke-NpiOwnership.ps1 -Cloud gcchigh -RegisterRun out/inventory-gcchigh -FixturePath tests/fixtures/estate.json -InputPath tests/fixtures/inputs -OutputPath out/ownership-gcchigh
./Invoke-NpiAgentId.ps1 -Cloud gcchigh -RegisterRun out/inventory-gcchigh -OwnershipRun out/ownership-gcchigh -FixturePath tests/fixtures/ch09/agent-estate.json -InputPath tests/fixtures/ch09/inputs -OutputPath out/agent-id-gcchigh

# Step 9: Dry-run the agent Conditional Access plan with its approved hash
$sha = (Get-FileHash out/agent-id/agent-ca-plan.json -Algorithm SHA256).Hash.ToLower()
./Invoke-NpiAgentCaAction.ps1 -Cloud gcc -PlanPath out/agent-id/agent-ca-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/ch09/agent-estate.json -OutputPath out/agent-ca-dryrun

# Step 10: Apply it to the fake, then try a hash nobody approved
./Invoke-NpiAgentCaAction.ps1 -Cloud gcc -PlanPath out/agent-id/agent-ca-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/ch09/agent-estate.json -OutputPath out/agent-ca-apply -Apply
./Invoke-NpiAgentCaAction.ps1 -Cloud gcc -PlanPath out/agent-id/agent-ca-plan.json -ApprovedSha256 ('0' * 64) -FixturePath tests/fixtures/ch09/agent-estate.json -OutputPath out/agent-ca-x

# Step 11: Run the tests
Invoke-Pester -Path tests

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Make Chapter 01's register and Chapter 02's ownership run:**

    ```powershell
    ./Invoke-NpiInventory.ps1 -Cloud gcc -FixturePath tests/fixtures/estate.json -OutputPath out/inventory
    ./Invoke-NpiOwnership.ps1 -Cloud gcc -RegisterRun out/inventory -FixturePath tests/fixtures/estate.json -InputPath tests/fixtures/inputs -OutputPath out/ownership
    ```

    The last line is `Plan SHA-256: 1e1799d7181bd1a3dc271c645fff8a60fc741ab1ebc219bb3011cc25953bad3e`.

2. **Send Learn's samples to the fake:**

    ```powershell
    Invoke-Pester -Path tests/NpiAgentId.Tests.ps1 -FullNameFilter '*Learn*' -Output None -PassThru |
        Select-Object PassedCount, FailedCount, NotRunCount
    ```

    Expect `PassedCount 13`, `FailedCount 0`, `NotRunCount 49`.

3. **List what each task needs:**

    ```powershell
    Import-Module ./powershell/NpiAgentId/NpiAgentId.psm1
    foreach ($t in 'agent-id', 'agent-ca-apply') { $p = Get-NpiAgentRequiredPermission -Task $t; "$t : " + ($p.GraphPermissions -join ', ') }
    ```

    Expect ten read permissions for `agent-id`, none ending in `ReadWrite`, and `Policy.Read.All, Policy.ReadWrite.ConditionalAccess` for `agent-ca-apply`.

4. **Read D-NP6 for each cloud:**

    ```powershell
    'global','gcc','gcchigh','dod' | ForEach-Object { $c = Get-NpiAgentCapability -Cloud $_
        [pscustomobject]@{ Cloud = $_; Mode = $c.Mode; AgentIdentities = $c.AgentIdentities.stage; AgentCA = $c.AgentConditionalAccess.stage; SponsorWorkflows = $c.SponsorWorkflows.stage } } | Format-Table
    ```

    ```text
    Cloud   Mode     AgentIdentities AgentCA                        SponsorWorkflows
    -----   ----     --------------- -------                        ----------------
    global  AgentId  GA (April 2026) Preview (policy builder label) GA (May 2026)
    gcc     AgentId  GA (April 2026) Preview (policy builder label) GA (May 2026)
    gcchigh Fallback Not published   Not published                  Not published
    dod     Fallback Not published   Not published                  Not published
    ```

5. **Check the AI identities and build the plan:**

    ```powershell
    ./Invoke-NpiAgentId.ps1 -Cloud gcc -RegisterRun out/inventory -OwnershipRun out/ownership -FixturePath tests/fixtures/ch09/agent-estate.json -InputPath tests/fixtures/ch09/inputs -OutputPath out/agent-id
    ```

    ```text
    D-NP6 (Proposed): AgentId mode in cloud 'gcc'; agent Conditional Access Preview (policy builder label); agent risk Preview
    AI identities: 8 checked (4 AgentIdentity, 3 AgentIdentityBlueprint, 1 ServicePrincipal); Chapter 02 sponsor fields filled: 2 of 2
    Findings: 22 Finding (4 P1, 2 P2), 6 Warn, 4 Info. Orphan candidates for Chapter 02: 2
    Agent CA plan: Unapproved InPlace, HighRisk Create; nothing sent
    Plan SHA-256: 5a8002467655390a12ee9f8967a82d52e40234adf3a9a74ea37952b34b14073b
    ```

6. **Read the findings:**

    ```powershell
    Get-Content out/agent-id/findings.json -Raw | ConvertFrom-Json | Where-Object Severity -eq 'Finding' | Group-Object Rule | Format-Table Name, Count
    ```

    Expect 16 rules with Findings. Look for these: NPI-AI-10 twice (Case Triage Blueprint's secret, and Correspondence Drafting's app registration), NPI-AI-13 once (Case Triage Blueprint inherits all Graph roles), NPI-AI-16 once (Records Search: its sponsor left on October 9 and nobody confirmed by October 26), and the P1 drift, NPI-AI-21, NPI-AI-22 twice and NPI-AI-23. Benefits Q&A Agent and its blueprint pass every rule.

7. **Read the sponsor fields Chapter 02 recorded, filled:**

    ```powershell
    Get-Content out/agent-id/ai-identities.json -Raw | ConvertFrom-Json | Format-Table Name, FederalSponsor, TechnicalOwner, InventoryRecord, Handshake, SponsorState
    ```

    Expect eight rows. Case Triage Agent has `carol@contoso.example` as both sponsor and technical owner. Records Search Agent is `Orphaned`. Sandbox Helper has no sponsor, record or handshake.

8. **Run the D-NP6 fallback in GCC High** (Chapters 01 and 02 again, in that cloud):

    ```powershell
    ./Invoke-NpiInventory.ps1 -Cloud gcchigh -FixturePath tests/fixtures/estate.json -OutputPath out/inventory-gcchigh
    ./Invoke-NpiOwnership.ps1 -Cloud gcchigh -RegisterRun out/inventory-gcchigh -FixturePath tests/fixtures/estate.json -InputPath tests/fixtures/inputs -OutputPath out/ownership-gcchigh
    ./Invoke-NpiAgentId.ps1 -Cloud gcchigh -RegisterRun out/inventory-gcchigh -OwnershipRun out/ownership-gcchigh -FixturePath tests/fixtures/ch09/agent-estate.json -InputPath tests/fixtures/ch09/inputs -OutputPath out/agent-id-gcchigh
    ```

    The last command prints `D-NP6 (Proposed): Fallback mode in cloud 'gcchigh'` and `AI identities: 1 checked (1 ServicePrincipal)`. No agent identity read is sent.

9. **Dry-run the agent Conditional Access plan with its approved hash:**

    ```powershell
    $sha = (Get-FileHash out/agent-id/agent-ca-plan.json -Algorithm SHA256).Hash.ToLower()
    ./Invoke-NpiAgentCaAction.ps1 -Cloud gcc -PlanPath out/agent-id/agent-ca-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/ch09/agent-estate.json -OutputPath out/agent-ca-dryrun
    ```

    ```text
    DryRun: 1 WouldSend
      WouldSend HighRisk POST https://graph.microsoft.com/beta/identity/conditionalAccess/policies
    ```

10. **Apply it to the fake, then try a hash nobody approved:**

    ```powershell
    ./Invoke-NpiAgentCaAction.ps1 -Cloud gcc -PlanPath out/agent-id/agent-ca-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/ch09/agent-estate.json -OutputPath out/agent-ca-apply -Apply
    ./Invoke-NpiAgentCaAction.ps1 -Cloud gcc -PlanPath out/agent-id/agent-ca-plan.json -ApprovedSha256 ('0' * 64) -FixturePath tests/fixtures/ch09/agent-estate.json -OutputPath out/agent-ca-x
    ```

    Expect `Apply: 1 Sent`, with `Created ca000000-0000-4000-8000-000000000103 report-only`. Then the refusal: `The plan's SHA-256 is 5a800246…, not the approved 0000…; refusing to run a plan nobody reviewed.`

11. **Run the tests:**

    ```powershell
    Invoke-Pester -Path tests
    ```

    Expect 513 tests passed, 0 failed.

Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

## Exercise: Lab 2, your test tenant (5 minutes to read)

*Not run by the authors.* Follow the workbook's [Chapter 09, Lab 2](../../project-plans/developer-workbooks/non-person-identity/09-ai-agent-identities.md#lab-2-test-tenant). It has the exact commands.

- **You need:** a test tenant in the worldwide or GCC cloud, never production, with fictional people, licensed for Agent 365 (or Microsoft 365 E7) with Entra ID P1, and P2 for agent risk; and Chapters 01 and 02's Lab 2 runs.
- **What you do:** read and set **Users can create agent blueprints** to No, make one governed agent with a sponsor who isn't its owner and a managed identity as its credential, run the check with an app holding only the `agent-id` permissions, then dry-run and apply the plan as a person with Conditional Access Administrator.
- **Back-out:** step 6, as a person in the admin center: delete the two policies, remove the attribute, disable then delete the test agent identity and blueprint, set the creation setting back if the tenant needs it, and delete the `out` folders. The code deletes nothing.

## Knowledge check (5 minutes)

1. Why is a client secret on a production blueprint a Finding?
    a. Secrets can't be read in GCC
    b. The blueprint holds the credentials for every agent made from it, so one leaked secret is every agent's
    c. Blueprints can't hold certificates
    d. A secret makes the agent multitenant
2. What does the code do in GCC High, where Microsoft has published no Agent ID availability?
    a. It fails
    b. It reads agent identities anyway
    c. It runs in Fallback mode: no agent identity read, and the same rules on the service principals the agents run as
    d. It skips every AI rule
3. A sponsor leaves. When does the agent become orphaned?
    a. At once
    b. After 30 days
    c. When the new sponsor hasn't confirmed within ten business days
    d. When its credential expires
4. Why is inheritance set to `allAllowed` for application roles a Finding?
    a. Any future grant to the blueprint becomes a grant to every agent
    b. It blocks token issuance
    c. It's a preview feature
    d. It turns off Conditional Access
5. What state does the agent Conditional Access write path create policies in?
    a. On
    b. Off
    c. Report-only, with Block as the only grant; it never turns a policy on
    d. Whatever the plan file says

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Taught in the guide's [AI agents](../../books/guides/non-person-identity-implementation.md#ai-agents) section and the chapter's [Dangers](../../project-plans/developer-workbooks/non-person-identity/09-ai-agent-identities.md#dangers).
2. **c.** Taught in [Decision D-NP6 as data](../../project-plans/developer-workbooks/non-person-identity/09-ai-agent-identities.md#decision-d-np6-as-data).
3. **c.** Taught in [The program's rules the code holds](../../project-plans/developer-workbooks/non-person-identity/09-ai-agent-identities.md#the-programs-rules-the-code-holds) and [The checks](../../project-plans/developer-workbooks/non-person-identity/09-ai-agent-identities.md#the-checks).
4. **a.** Taught in [The program's rules the code holds](../../project-plans/developer-workbooks/non-person-identity/09-ai-agent-identities.md#the-programs-rules-the-code-holds).
5. **c.** Taught in [The agent Conditional Access plan and the separate write path](../../project-plans/developer-workbooks/non-person-identity/09-ai-agent-identities.md#the-agent-conditional-access-plan-and-the-separate-write-path).
:::

## Summary (2 minutes)

You checked eight fictional AI identities, filled the sponsor fields Chapter 02 recorded, found an orphaned agent and four P1 drift findings, ran the same rules in GCC High's Fallback mode, and applied a report-only agent policy to a fake by its approved hash.

**The evidence an ISSO keeps** from this module: `ai-identities.json`, `findings.json`, `orphan-candidates.json`, `agent-ca-plan.json` with its approved SHA-256, and the dry-run and apply folders' `results.json` and `manifest.json`, dated; the capability table for D-NP6; and the test result. Before shipping, work through the chapter's [Checklist](../../project-plans/developer-workbooks/non-person-identity/09-ai-agent-identities.md#checklist).

**Next:** [Module 10: Find drift and file the evidence](10-drift-and-evidence.md).
