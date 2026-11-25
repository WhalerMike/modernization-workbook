---
title: "Training"
subtitle: "Learning paths: modules to work through in order, and the vendors' own training mapped to the workbook's roles"
description: "The Federal Modernization Workbook's training: the Microsoft Automation learning path in four modules, the Ticket-to-Machine and HR-Driven Identity learning paths in seven modules each, the Privileged Access learning path in eight modules, the Attribute-Driven Migration learning path in nine modules, the Non-Person Identity learning path in eleven modules, the Provider Notices learning path in nine modules, the Zero Trust Assessment learning path in four modules, the Defender XDR learning path in five modules, the Global Secure Access learning path in six modules, the Azure Security Engineering learning path in five modules, the Daily Checks Dashboard learning path in two modules, the DNS, DHCP and IPAM learning path in six modules, the Application Modernization learning path in seven modules, and external learning paths from product vendors."
doc-type: section-landing
fmw-eyebrow: "Training"
listing:
  - id: training-microsoft
    contents:
      - "ms-automation-*.md"
    type: table
    fields: [title, research-status, last-reviewed, description]
    field-display-names: &names
      research-status: "Status"
      last-reviewed: "Reviewed"
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
  - id: training-ttm
    contents:
      - "ticket-to-machine/[0-9][0-9]-*.md"
    type: table
    fields: [title, research-status, last-reviewed, description]
    field-display-names: *names
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
  - id: training-external
    contents:
      - "*.md"
      - "!index.md"
      - "!ms-automation-*.md"
      - "!labs.md"
      - "!lab-setup.md"
      - "!ticket-to-machine/**"
      - "!hr-driven-identity/**"
      - "!privileged-access/**"
      - "!attribute-driven-migration/**"
      - "!non-person-identity/**"
      - "!provider-notices/**"
      - "!zero-trust-assessment/**"
      - "!defender-xdr/**"
      - "!global-secure-access/**"
      - "!network-sd-wan/**"
      - "!azure-security/**"
      - "!daily-checks-dashboard/**"
      - "!dns-dhcp-ipam/**"
      - "!application-modernization/**"
    type: table
    fields: [title, research-status, last-reviewed, description]
    field-display-names: *names
    sort: "title asc"
    sort-ui: false
    filter-ui: false
review-status: approved
reviewed-sha256: 99f12d645fa4431d86c81ebeee6f0ccfaa1d1fb190c0f54eb91712f43b05a811
last-reviewed: 2026-11-20
---
# Training {.unnumbered}

Training pages teach a skill step by step, in the order you should learn it. They work like a [Microsoft Learn learning path](https://learn.microsoft.com/training/): a short series of modules, each building on the one before.

**Looking for a lab?** [Labs](labs.md) lists every hands-on lab in the workbook, chapter by chapter: what each needs, where it runs, and a direct link.

Each page keeps its status label (draft or in review) until it is reviewed and proved. See [Status labels](../about/sources-and-verification.md#status-labels) for what each label means.

## Get a path's code {#get-the-code}

Each learning path's code downloads as one zip, rebuilt from the repository on every site deploy. Every lab command runs from the kit's folder, `examples/<kit>` in a clone of the repository. To get the same folder from the zip, unzip it into your **Downloads** folder, into a folder with the zip's name. That's the folder Windows' **Extract All** suggests. The zip holds a top-level folder with the same name, so the name appears twice in the path:

| Path | Download | The folder you work in | Language |
|---|---|---|---|
| Microsoft Automation | [microsoft-automation-code.zip](../../downloads/microsoft-automation-code.zip) | `Downloads\microsoft-automation-code\microsoft-automation-code\ms-automation` | Python and PowerShell 7.5 |
| Ticket-to-Machine | [ticket-to-machine-code.zip](../../downloads/ticket-to-machine-code.zip) | `Downloads\ticket-to-machine-code\ticket-to-machine-code\servicenow-sailpoint` | Python; PowerShell 7.2 client |
| HR-Driven Identity | [hr-driven-identity-code.zip](../../downloads/hr-driven-identity-code.zip) | `Downloads\hr-driven-identity-code\hr-driven-identity-code\hr-lifecycle` | Python |
| Privileged Access | [privileged-access-code.zip](../../downloads/privileged-access-code.zip) | `Downloads\privileged-access-code\privileged-access-code\privileged-access` | PowerShell 7.1 |
| Attribute-Driven Migration | [attribute-driven-migration-code.zip](../../downloads/attribute-driven-migration-code.zip) | `Downloads\attribute-driven-migration-code\attribute-driven-migration-code\<the folder each module names>` | Python and PowerShell 7.2 |
| Non-Person Identity | [non-person-identity-code.zip](../../downloads/non-person-identity-code.zip) | `Downloads\non-person-identity-code\non-person-identity-code\non-person-identity` | PowerShell 7.1 |
| Provider Notices | [provider-notices-code.zip](../../downloads/provider-notices-code.zip) | `Downloads\provider-notices-code\provider-notices-code\provider-notices` | PowerShell 7.1 |
| Zero Trust Assessment | [zta-results.zip](../../downloads/zta-results.zip) | `Downloads\zta-results\zta-results` | PowerShell 7.1 |
| Defender XDR | [defender-xdr-code.zip](../../downloads/defender-xdr-code.zip) | `Downloads\defender-xdr-code\defender-xdr-code\defender-xdr` | PowerShell 7.1 |
| Global Secure Access | [global-secure-access-code.zip](../../downloads/global-secure-access-code.zip) | `Downloads\global-secure-access-code\global-secure-access-code\global-secure-access` | PowerShell 7.1 |
| SD-WAN Governor | [cisco-sdwan.zip](../../downloads/cisco-sdwan.zip) | `Downloads\cisco-sdwan\cisco-sdwan` | Python 3.10; PowerShell 5.1 or 7 to read the output |
| Azure Security Engineering | [azure-security-code.zip](../../downloads/azure-security-code.zip) | `Downloads\azure-security-code\azure-security-code\azure-security` | PowerShell 7.1 |
| Daily Checks Dashboard | [daily-checks-workbook-code.zip](../../downloads/daily-checks-workbook-code.zip) | `Downloads\daily-checks-workbook-code\daily-checks-workbook-code\daily-checks-workbook` | PowerShell 7.1 |
| DNS, DHCP and IPAM | [start-kit.zip](../../downloads/start-kit.zip) | `Downloads\start-kit\start-kit` | Windows PowerShell 5.1 or PowerShell 7 |
| Application Modernization | [app-modernization.zip](../../downloads/app-modernization.zip) | `Downloads\app-modernization\app-modernization` | Java 21, Node.js 24 and PowerShell 7.4 |

: Each learning path's code, and the folder its labs run from {.striped .hover}

The PowerShell versions are the ones the kits' scripts declare with `#Requires -Version`. **First time?** [Set Up for the Labs](lab-setup.md) installs PowerShell 7, Python and Git, sets the execution policy, and has a Git Bash command guide. Each path's page has its exact commands under **Get the code**; the Microsoft Automation commands are [below](#get-the-microsoft-automation-code). They do three things:

- **Unzip.** `Expand-Archive` in PowerShell, or `unzip -d` in Bash, puts the files where the table says. If you already used **Extract All**, the files are already there.
- **Unblock.** Windows marks a downloaded zip as coming from the internet, and **Extract All** copies that mark onto every file. Under the RemoteSigned execution policy the labs need, PowerShell then refuses to load the kit's scripts and modules (`Import-Module` says the file is not digitally signed). `Unblock-File` removes the mark. Run it only on a kit you downloaded from this site.
- **Check.** One command from the path's first lab, with the output it prints, so you know the kit runs before you start.

Each zip also holds a `.txt` copy of every script, for mail systems and Microsoft 365 Copilot, which refuse `.ps1` and `.py` files. The labs use the originals. The Attribute-Driven Migration path's Module 3 needs a clone of the repository instead, because its steps call `git`.

## Microsoft Automation learning path

Four modules that teach you to script Microsoft Entra ID and Intune through Microsoft Graph, and Azure Arc-enabled servers through Azure Resource Manager and Resource Graph, in a federal tenant: which cloud's endpoints to call, how a script signs in without a secret, which least-privileged permissions each read needs, and how to turn the results into evidence. Each module is in Microsoft Learn's form: an introduction with the federal requirements it supports, objectives, concept units, **Where agencies are** with government-cloud availability, a lab on fixtures with no tenant, a lab in your own test tenant, a knowledge check and a summary. The code is [`examples/ms-automation`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/ms-automation), in Python and PowerShell; download it as [microsoft-automation-code.zip](../../downloads/microsoft-automation-code.zip).

| | |
|---|---|
| **Level** | Intermediate |
| **Roles** | Developer, identity engineer, endpoint (Intune) engineer, server (Arc) engineer, ISSO reviewer |
| **Products** | Microsoft Graph, Microsoft Entra ID, Microsoft Intune, Azure Resource Manager, Azure Resource Graph, Azure Arc, Azure Policy |
| **Scope** | A FedRAMP Moderate civilian agency, most often in Microsoft 365 GCC with commercial Azure |
| **Modules** | 4 (two more are planned) |
| **Time** | About 5 hours 55 minutes, not counting the Lab 2 exercises |

**Prerequisites.** You can run commands in a terminal and read Python or PowerShell, and you know what an access token is. For the design behind the checks, skim [Book 02](../books/b02-identity/index.md), [Book 04](../books/b04-access/index.md), [Book 05](../books/b05-devices/index.md) and [Book 06](../books/b06-data-platform/index.md); the modules link the chapters they use.

| # | Module | What you learn | Books | Time |
|---|---|---|---|---|
| 1 | [Graph and Azure Foundations](ms-automation-foundations.md) | Clouds and endpoints, signing in without a secret, permissions and consent, tools, paging, throttling, batching and delta | 02, 04, 05, 06, 10, 15 | 85 min |
| 2 | [Microsoft Entra ID through Microsoft Graph](ms-automation-entra.md) | Users, groups, Conditional Access, PIM, applications, logs and authentication methods; four of its five checks mapped to ScubaGear | 02, 04 | 89 min |
| 3 | [Intune through Microsoft Graph](ms-automation-intune.md) | Managed devices, compliance, configuration, assignment filters, Autopilot, v1.0 versus beta; five checks mapped to NIST SP 800-53 Moderate | 05 | 86 min |
| 4 | [Azure Arc through Azure Resource Manager and Resource Graph](ms-automation-arc.md) | Resource Manager versus Graph, Azure RBAC, Resource Graph paging and its traps, Arc machines, extensions, SQL Server, policy and product lifecycle; five Reader-only checks mapped to NIST SP 800-53 Moderate | 05, 06 | 95 min |

: The Microsoft Automation modules in order {.striped .hover}

Work through them in order: Module 1 sets up what the other three use. The developer workbook's [Chapter 02](../books/b19-developer-workbook/02-graph-clients-for-government-clouds.md) goes deeper on the Graph client, and the [Ticket-to-Machine](ticket-to-machine/index.md), [HR-Driven Identity](hr-driven-identity/index.md), [Non-Person Identity](non-person-identity/index.md), [Privileged Access](privileged-access/index.md) and [Attribute-Driven Migration](attribute-driven-migration/index.md) paths build on Module 1. **If you're an ISSO reviewer,** read each module's introduction, Where agencies are and summary, and skip the labs.

### What you need for the Microsoft Automation labs

**Lab 1: fixtures, no tenant.** Every Lab 1 runs on a laptop against the kit's fictional fixtures, and nothing signs in or sends a request. You need:

- the code: [microsoft-automation-code.zip](../../downloads/microsoft-automation-code.zip), unzipped as below, or a clone of the repository;
- Python 3.10 or later, with `pytest`;
- PowerShell 7.5 or later with Pester 5, for the PowerShell steps and tests;
- a Bash-compatible shell for the commands as written.

Run every command from `examples/ms-automation` in a clone, or from `Downloads\microsoft-automation-code\microsoft-automation-code\ms-automation` in the zip. Module 2's lab writes an `out` folder there; delete it afterward.

#### Get the Microsoft Automation code {#get-the-microsoft-automation-code}

Download [microsoft-automation-code.zip](../../downloads/microsoft-automation-code.zip) to your Downloads folder. It holds `ms-automation`, the kit the labs use (its `python`, `powershell` and `tests` folders), and `third_party/msgraph-snippets-python`, Microsoft's Graph snippets for Python, pinned unmodified. [Get a path's code](#get-the-code) says why each step is there.

In PowerShell (Windows PowerShell 5.1 or PowerShell 7 can unzip; the kit's PowerShell steps need 7.5):

```powershell
Expand-Archive -Path $HOME\Downloads\microsoft-automation-code.zip -DestinationPath $HOME\Downloads\microsoft-automation-code -Force
Set-Location $HOME\Downloads\microsoft-automation-code\microsoft-automation-code\ms-automation
Get-ChildItem $HOME\Downloads\microsoft-automation-code -Recurse -File | Unblock-File
```

In Bash on Linux or macOS, or Git Bash on Windows:

```bash
unzip -o ~/Downloads/microsoft-automation-code.zip -d ~/Downloads/microsoft-automation-code
cd ~/Downloads/microsoft-automation-code/microsoft-automation-code/ms-automation
```

Check the Python code, with Module 1, Lab 1, Step 1 (it runs the same in PowerShell or Bash):

```bash
python -c "import sys; sys.path.insert(0, 'python'); from graphkit import endpoints, scope_for; print(endpoints('gcc')); print(scope_for('gcc', 'arm')); print(scope_for('gcc'))"
```

It prints the GCC endpoints, `{'login': 'https://login.microsoftonline.com', 'graph': 'https://graph.microsoft.com', 'arm': 'https://management.azure.com', 'ps_env': 'Global', 'azure_env': 'AzureCloud'}`, then `https://management.azure.com/.default` and `https://graph.microsoft.com/.default`.

Check the PowerShell code, in PowerShell 7.5, with Module 1, Lab 1, Step 6:

```powershell
Import-Module ./powershell/FmwGraph.psm1
(Get-FmwCloud gcc).Graph
```

It prints `https://graph.microsoft.com`. If `Import-Module` says the file is not digitally signed, run the `Unblock-File` line above.

**Lab 2: your test tenant.** Each Lab 2 registers one app with a certificate and only the read permissions its checks need, runs them read-only, and ends by deleting the app registration. You need a test tenant in the worldwide or GCC cloud for learning, never production, with fictional data (before a gate passes, rehearse once in your agency's own cloud, as [Book 16](../books/b16-people/06-vendor-training-and-labs.md#what-changes-in-the-government-clouds) describes); Microsoft Entra ID P1 or P2 for Module 2's sign-in data, and P2 or Microsoft Entra ID Governance for its PIM data; an Intune license and a few test devices for Module 3; for Module 4, a test subscription with a few Arc-enabled servers, someone who can assign the Reader role on it, and `Az.Accounts` and `Az.ResourceGraph` for the PowerShell steps; and an administrator who can grant admin consent. **The authors haven't run the Lab 2 steps.**

**Watch:** each module has a narrated deck, about 13 to 16 minutes, linked from the module's page; Module 4's is [here](../presentations/watch.html?v=Training_MS_Automation_Module_4_Narrated).

::: {#training-microsoft}
:::

## Ticket-to-Machine learning path

[Learning path: Ticket-to-Machine on ServiceNow and SailPoint](ticket-to-machine/index.md) teaches you to build, test and evidence Book 13's Ticket-to-Machine loop on ServiceNow and SailPoint Identity Security Cloud, in seven modules mapped to the example guide's gates and the developer workbook's chapters. Each module has a lab on fixtures with no tenant, a pointer to a lab in your own test instance, and a knowledge check. Start with the path page for the roles, prerequisites and what you need for the labs.

**Code:** [ticket-to-machine-code.zip](../../downloads/ticket-to-machine-code.zip), or [`examples/servicenow-sailpoint`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/servicenow-sailpoint) in the repository. The path's page says [how to unzip it and where](ticket-to-machine/index.md#get-the-code).

::: {#training-ttm}
:::

## HR-Driven Identity learning path

Seven modules, one per gate of the [HR-driven identity implementation guide](../books/guides/hr-driven-identity-implementation.md), each with a lab on fixtures and a lab in your own test tenant. Start at the [learning path](hr-driven-identity/index.md).

**Code:** [hr-driven-identity-code.zip](../../downloads/hr-driven-identity-code.zip), or [`examples/hr-lifecycle`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/hr-lifecycle) in the repository. The path's page says [how to unzip it and where](hr-driven-identity/index.md#get-the-code).

## Privileged Access learning path

Eight modules, one per chapter (01 to 08) of the developer workbook [*Building Privileged Access*](../project-plans/developer-workbooks/privileged-access/index.md); operators who deploy the kit also use its Chapter 09, the deployment runbook. Each with a lab on fixtures and a lab in your own test tenant. It follows the workbook and the [project plan](../project-plans/privileged-access.md), and its modules match the gates of the [implementation guide](../books/guides/privileged-access-implementation.md) one for one. Emergency access comes first, and every module that writes has a guard against locking people out. Start at the [learning path](privileged-access/index.md).

**Code:** [privileged-access-code.zip](../../downloads/privileged-access-code.zip), or [`examples/privileged-access`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/privileged-access) in the repository. The path's page says [how to unzip it and where](privileged-access/index.md#get-the-code).

## Attribute-Driven Migration learning path

Nine modules that teach [Book 19, *Building the Attribute-Driven Migration*](../books/b19-developer-workbook/index.md), one chapter each, in the order of the [implementation guide's](../books/guides/attribute-driven-migration-implementation.md) gates. Each runs the chapter's Lab 1 on fixtures (Chapter 10 has no Lab 1; its module runs the chapter's fixture dry run), points to its Lab 2 in a non-production environment, names the federal requirement with its KSI and evidence, and ends with a knowledge check. Chapter 02 is taught by the Microsoft Automation path's [Module 1](ms-automation-foundations.md). Start at the [learning path](attribute-driven-migration/index.md).

**Code:** [attribute-driven-migration-code.zip](../../downloads/attribute-driven-migration-code.zip), or the `examples` folders its chapters name in the repository. The path's page says [how to unzip it and where](attribute-driven-migration/index.md#get-the-code).

## Non-Person Identity learning path

Thirteen modules, one per chapter of the developer workbook *Building Non-Person Identity*, in the order of the six gates of the [non-person identity implementation guide](../books/guides/non-person-identity-implementation.md): inventory, ownership and the orphan rule, the decision, credential rules, least privilege and Conditional Access for workload identities, conversion, AI agent identities, drift and evidence, and the deployment to test, then production; then two companions to the [service account guide](../books/guides/service-account-migration.md): one account migrated by hand, and the managed service account standard, from a request approved in SailPoint to retirement. Each has a lab on fixtures and a lab in your own test tenant or domain. Start at the [learning path](non-person-identity/index.md).

**Code:** [non-person-identity-code.zip](../../downloads/non-person-identity-code.zip), or [`examples/non-person-identity`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/non-person-identity) in the repository. The path's page says [how to unzip it and where](non-person-identity/index.md#get-the-code).

## Provider Notices learning path

Nine modules on the notices cloud providers send about the agency's own estate, in the order of the seven gates of the [provider notices implementation guide](../books/guides/provider-notices-implementation.md): why notices go unread and the one record every notice becomes; Azure Service Health with Service Health alerts; the Microsoft 365 Message center; Oracle Cloud Infrastructure announcements; AWS Health and its support plan; Google Cloud incidents and the maintenance gap; routing notices to owners as Ticket-to-Machine tasks; and the weekly digest, evidence and go/no-go. A ninth, optional module dry-runs the deployment to test, then production. Each module runs a chapter's Lab 1 from the developer workbook [*Building Provider Notices*](../project-plans/developer-workbooks/provider-notices/index.md) on fixtures, points to its Lab 2 in a test environment, and ends with a knowledge check. Start at the [learning path](provider-notices/index.md).

**Code:** [provider-notices-code.zip](../../downloads/provider-notices-code.zip), or [`examples/provider-notices`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/provider-notices) in the repository. The path's page says [how to unzip it and where](provider-notices/index.md#get-the-code).

**Watch:** each module has a narrated deck, about 12 to 15 minutes, linked from the module's page.

## Zero Trust Assessment learning path

Four modules on running Microsoft's Zero Trust Assessment as evidence rather than a verdict, in the order of the ten steps of the [Zero Trust Assessment implementation guide](../books/guides/zero-trust-assessment-implementation.md): what the assessment checks and why a skipped test is neither a failure nor a pass; running it safely, from the host and consent to the connection in GCC and the hashed export; normalizing the results and opening a closure register routed to the pages that remediate each finding; and comparing runs, reconciling with ScubaGear and AWS Security Hub CSPM, and sealing the evidence. Lab 1 runs on the results kit's fictional fixtures with no tenant; Lab 2 runs in your own test tenant; each module ends with a knowledge check. Start at the [learning path](zero-trust-assessment/index.md).

**Code:** [zta-results.zip](../../downloads/zta-results.zip), or [`examples/zta-results`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/zta-results) in the repository. The path's page says [how to unzip it and where](zero-trust-assessment/index.md#get-the-code).

**Watch:** each module has a narrated deck, about 12 minutes, linked from the module's page.

## Defender XDR learning path

Five modules on engineering and operating Microsoft Defender XDR on Windows clients and Windows Server, in the order of the ten gates of the [Defender XDR implementation guide](../books/guides/defender-xdr-implementation.md): the service architecture, government-cloud availability, unified RBAC roles and onboarding with proof of sensor health; endpoint prevention and Attack Surface Reduction through audit, warn and block; exposure management without Security Exposure Management, and incidents triaged to a severity table; advanced hunting, custom detections deployed as code through Microsoft Graph, and identity and cloud-app signals; and automation levels set to the response ladder, with the monthly evidence run. Each module's Lab 1 runs chapters of the developer workbook [*Building Defender XDR*](../project-plans/developer-workbooks/defender-xdr/index.md) on the kit's fictional fixtures, with no tenant; its Lab 2 runs the guide's own Validate commands in your own test tenant; each module ends with a knowledge check. Start at the [learning path](defender-xdr/index.md).

**Code:** [defender-xdr-code.zip](../../downloads/defender-xdr-code.zip), or [`examples/defender-xdr`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/defender-xdr) in the repository. The path's page says [how to unzip it and where](defender-xdr/index.md#get-the-code).

**Watch:** each module has a narrated deck, about 11 to 14 minutes, linked from the module's page.

## Global Secure Access learning path

Six modules on deploying Microsoft Entra Internet Access and Private Access as the agency's identity-aware network layer, in the run order of the twelve steps of the [Global Secure Access implementation guide](../books/guides/global-secure-access-implementation.md): deciding each function and turning the network logs on before anything is enforced; the Windows client and the Microsoft traffic profile with source IP restoration; the compliant network check and universal tenant restrictions, in report-only or a pilot first; per-app Private Access and phishing-resistant administrative paths; Internet Access security profiles and TLS inspection within a privacy scope; and cutover rings, rollback in order and the evidence package. Each module's Lab 1 runs chapters of the developer workbook [*Building Global Secure Access*](../project-plans/developer-workbooks/global-secure-access/index.md) on the kit's fictional fixtures, with no tenant; its Lab 2 runs the guide's own commands and Validate steps in your own test tenant; each module ends with a knowledge check. Learn says Global Secure Access is available in GCC. Start at the [learning path](global-secure-access/index.md).

**Code:** [global-secure-access-code.zip](../../downloads/global-secure-access-code.zip), or [`examples/global-secure-access`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/global-secure-access) in the repository. The path's page says [how to unzip it and where](global-secure-access/index.md#get-the-code).

**Watch:** each module has a narrated deck, about 11 to 12 minutes, linked from the module's page.

## SD-WAN Governor learning path

Four modules on securing an SD-WAN fabric before it carries traffic and keeping the evidence, built from [Book 09](../books/b09-network/index.md) and the [Cisco Catalyst SD-WAN implementation guide](../books/guides/cisco-sdwan-implementation.md): why transport is physics and control is compliance, the four branch egress patterns, and the hosted-or-on-premises decision; Gate 0, the fixed-release floor for Emergency Directive 26-03 and the Known Exploited Vulnerabilities catalog, as a gate a pipeline can stop on; validating every control component, reviewing Manager's audit log and getting logs off the box; and path classes, Microsoft 365's Optimize exception, change rings and the evidence package. Lab 1 replays the Cisco kit's fictional Manager responses with no fabric; Lab 2 runs the kit read-only against a test fabric; each module ends with a knowledge check. The guide names one product as an example, not an endorsement. Microsoft's own security service edge has its own path, above. Start at the [learning path](network-sd-wan/index.md).

**Code:** [cisco-sdwan.zip](../../downloads/cisco-sdwan.zip), or [`examples/cisco-sdwan`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/cisco-sdwan) in the repository. The path's page says [how to unzip it and where](network-sd-wan/index.md#get-the-code).

## Azure Security Engineering learning path

Five modules on engineering and proving the security of an agency's Azure estate, in the order of the ten steps of the [Azure Security Engineering implementation guide](../books/guides/azure-security-implementation.md): the security baseline in audit and the exposure register; DDoS protection on every public IP and the web application firewall from detection to prevention; an origin nothing can reach around Front Door or Application Gateway, and egress through Azure Firewall; Private Link, private DNS and Key Vault; and the security initiative, expiring exemptions, the operating model and the evidence. GCC Moderate with commercial Azure, and the AWS, Google Cloud and Oracle Cloud Infrastructure equivalents. Each module's Lab 1 runs chapters of the developer workbook [*Building Azure Security*](../project-plans/developer-workbooks/azure-security/index.md) on the kit's fictional fixtures, with no subscription; its Lab 2 runs the guide's own checks in your test subscription; each module ends with a knowledge check. Start at the [learning path](azure-security/index.md).

**Code:** [azure-security-code.zip](../../downloads/azure-security-code.zip), or [`examples/azure-security`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/azure-security) in the repository. The path's page says [how to unzip it and where](azure-security/index.md#get-the-code).

**Watch:** each module has a narrated deck, about 11 to 13 minutes, linked from the module's page.

## Daily Checks Dashboard learning path

Two modules on putting the operator runbook's daily checks on one Azure Monitor workbook in the Sentinel workspace, from the [Daily Checks Dashboard implementation guide](../books/guides/daily-checks-dashboard-implementation.md): which checks fit a workbook and from which table, which ones link out, GCC availability, and the template kept as reviewed code with its validator; then reading each tab (a stale source never shows clear), the reachability check, deployment with what-if and an approved hash, and the evidence, which never includes the workbook itself. Each module links its chapters' Lab 1 on fixtures and Lab 2 in a test workspace, and ends with a knowledge check. Start at the [learning path](daily-checks-dashboard/index.md).

**Code:** [daily-checks-workbook-code.zip](../../downloads/daily-checks-workbook-code.zip), or [`examples/daily-checks-workbook`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/daily-checks-workbook) in the repository. The path's page says [how to unzip it and where](daily-checks-dashboard/index.md#get-the-code).

## DNS, DHCP and IPAM learning path

Six modules on [Book 08](../books/b08-ddi/index.md)'s naming plane, run with the Start Kit's DNS and DHCP collectors and its readiness checks: reading a domain's zones, DNS servers, locator records, zone health and DHCP scopes as one plane, with what to clear before anything moves; sorting every Active Directory DNS component into Chapter 10's target, method and risk, with the DHCP registration settings to decide; checking the resolvers and options each DHCP scope hands out, failover and DHCP servers nobody authorized, with encrypted DNS at the endpoint; holding every network on premises and in Azure, AWS GovCloud (US) and Oracle Cloud to one IPAM address plan; moving authority zone by zone through Chapter 10's five decommissioning gates; and operating the plane with its roles and an evidence index for the ISSO. Each module's Lab 1 runs on fictional files with no server or subscription; its Lab 2 runs in your own test domain or cloud accounts; each module ends with a knowledge check. Start at the [learning path](dns-dhcp-ipam/index.md). Once the agency has chosen Infoblox, the vendor's own courses are under [External learning paths](#external-learning-paths).

**Code:** [start-kit.zip](../../downloads/start-kit.zip), or [`examples/start-kit`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/start-kit) in the repository. The path's page says [how to unzip it and where](dns-dhcp-ipam/index.md#get-the-code).

## Application Modernization learning path

Seven modules, one per chapter of the developer workbook [*Building Application Modernization*](../project-plans/developer-workbooks/application-modernization/index.md), built on [Book 18](../books/b18-application-modernization/index.md)'s reference implementation: the API contract and the schema a service owns; loading a legacy Db2 or Oracle schema into PostgreSQL by stated rules, and proving the move three ways; an AI agent that can only propose what a person decides; the React front end with an automated WCAG 2.0 A and AA check and what it can't decide under Section 508; and the application's own Microsoft Entra identity through Book 18 Appendix A's work packages, from redirect URIs and assignment to a sealed evidence pack. Each module runs a chapter's Lab 1 on fixtures, points to its Lab 2 in a test environment, and ends with a knowledge check. Start at the [learning path](application-modernization/index.md).

**Code:** [app-modernization.zip](../../downloads/app-modernization.zip), or [`examples/app-modernization`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/app-modernization) in the repository. The path's page says [how to unzip it and where](application-modernization/index.md#get-the-code).

## External learning paths

Vendors' own training, organized by role and linked to the books that use it.

::: {#training-external}
:::
