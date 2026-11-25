---
title: "Learning path: Global Secure Access as the Identity-Aware Network"
subtitle: "Six modules, in the guide's run order: decide, design and log first; the client and Microsoft traffic; the compliant network and tenant restrictions; private applications and administrative paths; Internet Access and TLS inspection; and rings, rollback and the evidence package, each with a lab in your own test tenant"
description: "A learning path in six modules for network security and identity engineers, endpoint engineers, the policy owner, the security monitor and ISSO reviewers, built from the Global Secure Access implementation guide: deciding per function and logging before anything is enforced; deploying the Windows client and the Microsoft traffic profile with source IP restoration; the compliant network check and universal tenant restrictions in report-only first; per-app Private Access and phishing-resistant administrative paths; Internet Access security profiles and TLS inspection within a privacy scope; and cutover rings, rollback in order and the evidence an assessor checks. Each module runs the guide's own Validate commands in a test tenant and ends with a knowledge check. Learn says Global Secure Access is available in GCC."
doc-type: training-path
research-status: draft
research-type: training module
research-book: "Book 09"
series-order: 0
listing:
  - id: gsa-modules
    contents:
      - "[0-9][0-9]-*.md"
    type: table
    fields: [title, description]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
review-status: approved
reviewed-sha256: 4e9a1495f01a3d5ffb6ef0113ceef86946ec0bf5e2a3c7aa48bc5c0f84dee5bf
last-reviewed: 2026-11-25
---
# Learning path: Global Secure Access as the Identity-Aware Network {.unnumbered}

A VPN proves that a device reached the network. Microsoft's security service edge, Global Secure Access, lets every connection prove who is asking, from which device, for which application, and leaves a record that it did. This learning path teaches you to deploy it in that order: logs first, nothing enforced before its path exists, every policy in report-only or a pilot before it blocks anyone. You work through the twelve steps of [Global Secure Access & Zero Trust Network Engineering: An Implementation Guide](../../books/guides/global-secure-access-implementation.md) in six modules, following the guide's own run order.

**Watch first.** The guide's narrated deck, Guide_Global_Secure_Access (16 narrated slides, about 16 minutes), covers the twelve steps in one sitting. [▶ Watch it in the browser](../../presentations/watch.html?v=Guide_Global_Secure_Access_Narrated), find it on the [Presentations](../../presentations/index.md#guide-global-secure-access) page, or read its [narration script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/guide-global-secure-access/Guide_Global_Secure_Access_Narration_Script.md). Each module names the slides it builds on, and each module also has its own narrated deck, linked from the module's page.

Like a [Microsoft Learn learning path](https://learn.microsoft.com/training/), it is a short series of modules, each built on the one before. The modules don't repeat the guide or [Book 09](../../books/b09-network/index.md). They tell you what to read, in what order, what to run, and what to check you understood.

## Who this path is for {#gsa-who}

| Role | What you get from the path |
|---|---|
| Network security and identity engineer (platform owner) | Every step's commands, in run order, with the Validate test and the rollback for each |
| Endpoint engineer | The client package, its detection rule, DNS over HTTPS, hardening by ring, and the client coverage count |
| Policy owner | The decision record per function, the report-only periods, the exception register and the TLS inspection privacy scope |
| Security monitor | The diagnostic setting, the freshness query, and the sign-in, traffic, block and TLS queries each step reads |
| ISSO reviewer | The requirements and KSIs each module supports, and the evidence each produces; read each module's introduction and summary and skip the labs |

**Level:** intermediate. **Products:** Microsoft Entra Internet Access and Microsoft Entra Private Access (Global Secure Access), Microsoft Entra Conditional Access, Microsoft Intune, Microsoft Graph PowerShell and the beta network access API, Azure CLI, Log Analytics. **Scope:** a civilian agency at FedRAMP Moderate on Microsoft 365 GCC, with Windows 11 devices managed by Intune and a VPN still in service, as the guide's [starting state](../../books/guides/global-secure-access-implementation.md#how-to-read) describes. Learn says Global Secure Access is available in GCC.

## Prerequisites {#gsa-prerequisites}

- [Book 09, Chapter 05: Microsoft's security service edge](../../books/b09-network/05-sd-wan-sase-and-governed-transport.md#microsofts-security-service-edge-global-secure-access): what the service is, its gates, Private Access as the VPN replacement, connectors and Internet Access policy. Module 1 reads it with you.
- [Book 04, Chapter 07's network traffic family](../../books/b04-access/07-the-conditional-access-policy-library.md#optional-family-conditional-access-on-network-traffic) and [emergency access accounts](../../books/b04-access/04-privileged-roles-and-tiers.md#emergency-access-accounts): every policy in this path excludes them.
- PowerShell 7 with the Microsoft Graph PowerShell SDK, and Azure CLI in a Bash shell, on an administrator workstation.

## Get the code {#get-the-code}

Download [global-secure-access-code.zip](../../../downloads/global-secure-access-code.zip) to your Downloads folder. It holds `global-secure-access`, the kit the labs use. Unzip it into `Downloads\global-secure-access-code`, the folder Windows' **Extract All** suggests, so you work in `Downloads\global-secure-access-code\global-secure-access-code\global-secure-access`: the zip's name appears twice. Every lab command runs from there, as it does from `examples/global-secure-access` in a clone of the repository. The kit is PowerShell 7.1 or later, with Pester 5, and has no Python steps; only `tools/Get-GsaClientState.ps1`, which runs on a test device, also runs in Windows PowerShell 5.1. [Get a path's code](../index.md#get-the-code) says why each step is there.

In PowerShell (Windows PowerShell 5.1 or PowerShell 7):

```powershell
Expand-Archive -Path $HOME\Downloads\global-secure-access-code.zip -DestinationPath $HOME\Downloads\global-secure-access-code -Force
Set-Location $HOME\Downloads\global-secure-access-code\global-secure-access-code\global-secure-access
Get-ChildItem $HOME\Downloads\global-secure-access-code -Recurse -File | Unblock-File
```

In Bash on Linux or macOS, or Git Bash on Windows:

```bash
unzip -o ~/Downloads/global-secure-access-code.zip -d ~/Downloads/global-secure-access-code
cd ~/Downloads/global-secure-access-code/global-secure-access-code/global-secure-access
```

Check it works, in PowerShell 7.1 or later, with Step 1 of [Chapter 01's Lab 1](../../project-plans/developer-workbooks/global-secure-access/01-decision-licensing-and-gcc-availability.md#lab-1-fixtures-no-tenant):

```powershell
Import-Module ./powershell/GlobalSecureAccess/GlobalSecureAccess.psm1
Get-GsaRequiredPermission -Area decision | Format-Table
```

It prints two calls: `licenses` with `LicenseAssignment.Read.All`, and `tenant-status` with `NetworkAccessPolicy.Read.All`.

## What you'll be able to do {#gsa-outcomes}

When you finish the path, you'll be able to:

- decide each Global Secure Access function on its own gate, record the decision with a dated availability quote, and turn the network logs on before anything is enforced;
- package the Windows client in Intune with Learn's values, enable the Microsoft traffic profile and source IP restoration, and measure client coverage and the sign-ins carried by the service;
- run the compliant network check and universal tenant restrictions in report-only or a pilot first, and know their failure modes before enforcing;
- publish each private application with its own segments, group and Conditional Access, and put administrative paths behind phishing-resistant authentication;
- build Internet Access security profiles, govern every bypass, and enable TLS inspection from a dedicated CA within an approved privacy scope;
- move users ring by ring with exit criteria, roll back in the guide's order, and hand an assessor the evidence for each finding.

## Modules {#gsa-module-list}

Work through them in order; each module's lab builds on the one before.

| # | Module | Guide steps | Labs | Time |
|---|---|---|---|---|
| 1 | [Decide, design and log first](01-decide-design-and-log-first.md) | 1, 2 and 12 (logging) | Lab 1 (chapters [01](../../project-plans/developer-workbooks/global-secure-access/01-decision-licensing-and-gcc-availability.md#lab-1-fixtures-no-tenant), [02](../../project-plans/developer-workbooks/global-secure-access/02-configuration-export-and-logs-first.md#lab-1-fixtures-no-tenant)), Lab 2 | 45 min, plus Lab 2 |
| 2 | [The client and Microsoft traffic](02-the-client-and-microsoft-traffic.md) | 3 and 4 | Lab 1 (chapters [03](../../project-plans/developer-workbooks/global-secure-access/03-the-client-and-its-coverage.md#lab-1-fixtures-no-tenant), [04](../../project-plans/developer-workbooks/global-secure-access/04-microsoft-traffic-and-change-plans.md#lab-1-fixtures-no-tenant)), Lab 2 | 45 min, plus Lab 2 |
| 3 | [The compliant network and tenant restrictions](03-compliant-network-and-tenant-restrictions.md) | 7 and 8 | Lab 1 (chapter [05](../../project-plans/developer-workbooks/global-secure-access/05-compliant-network-and-tenant-restrictions.md#lab-1-fixtures-no-tenant)), Lab 2 | 45 min, plus Lab 2 |
| 4 | [Private applications and administrative paths](04-private-apps-and-admin-paths.md) | 6 and 10 | Lab 1 (chapter [06](../../project-plans/developer-workbooks/global-secure-access/06-private-apps-and-admin-paths.md#lab-1-fixtures-no-tenant)), Lab 2 | 50 min, plus Lab 2 |
| 5 | [Internet Access and TLS inspection](05-internet-access-and-tls-inspection.md) | 5 and 9 | Lab 1 (chapter [07](../../project-plans/developer-workbooks/global-secure-access/07-internet-access-and-tls-inspection.md#lab-1-fixtures-no-tenant)), Lab 2 | 50 min, plus Lab 2 |
| 6 | [Rings, rollback and the evidence package](06-rings-rollback-and-the-evidence-package.md) | 11 and 12 (evidence) | Lab 1 (chapter [08](../../project-plans/developer-workbooks/global-secure-access/08-rings-metrics-and-evidence.md#lab-1-fixtures-no-tenant)), Lab 2 | 40 min, plus Lab 2 |

: The modules of the Global Secure Access learning path {.striped .hover}

**Total time:** about 4 hours 35 minutes of reading and knowledge checks. The labs aren't counted: each needs a test tenant, and some steps wait for logs to arrive.

**Labs.** Each module has two kinds of lab. **Lab 1** is in the developer workbook [*Building Global Secure Access*](../../project-plans/developer-workbooks/global-secure-access/index.md): the kit in `examples/global-secure-access` run on a laptop against a fictional tenant's fixtures, with no tenant, every command a copy-paste block and the kit's real output beside it; each module links its chapters' Lab 1 rather than repeating them. **Lab 2** is the guide's own commands and **Validate** steps, run in a test tenant with fictional users and test devices, never production. **The authors haven't run the Lab 2s**; each expected result is the one the guide or the Microsoft Learn page it cites states, not captured output. Where a lab writes (a profile, a policy, a setting), it keeps the guide's change-safety order: report-only or a pilot group first, the emergency access group excluded, and Module 6 rolls everything back in the guide's [rollback order](../../books/guides/global-secure-access-implementation.md#rollback). [The Labs page](../labs.md#gsa) lists every lab in the path.

**What the labs need.** For Lab 1, PowerShell 7.1 or later with Pester 5, and nothing else. For Lab 2, a test tenant in the worldwide or GCC cloud for learning, with Microsoft Entra ID P1 or P2 and trial or test licenses for Internet Access and Private Access (or the Microsoft Entra Suite); an emergency access group and a pilot group of fictional users; one Windows 11 test device joined to Microsoft Entra ID and enrolled in Intune; for Module 4, a test connector group with two connectors on Windows Server 2019 or later and a test application server; and an Azure test subscription with a Log Analytics workspace. Activate the guide's roles (Global Secure Access Administrator or Security Administrator, Conditional Access Administrator) through PIM for the lab only.

::: {#gsa-modules}
:::
