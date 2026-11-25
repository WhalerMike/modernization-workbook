---
title: "Learning path: Information Protection with Microsoft Purview"
subtitle: "Five modules: classes, access and the baseline; labels, publication and containers; encryption and recovery; DLP, auto-labeling and AI; and audit, drift and evidence, each with a lab on fixtures and a lab in your own test tenant"
description: "A learning path in five modules for Purview and Microsoft 365 engineers, operators, security monitors, records and privacy officials and ISSO reviewers, built from the information protection implementation guide and Book 20: the data classes, the read path and the configuration baseline; the label taxonomy, its publication with justified defaults, and container labels; Rights Management with just-in-time recovery, message encryption and labeled files in SharePoint and OneDrive; DLP and auto-labeling from simulation to enforcement, with Copilot; and audit, the synthetic events, drift and the monthly evidence. Each module states what GCC doesn't offer, links the developer workbook's fixture lab and gives a read-only lab in a test tenant from the guide's Validate commands, with a knowledge check."
doc-type: training-path
research-status: draft
research-type: training module
research-book: "Book 20"
series-order: 0
listing:
  - id: ip-modules
    contents:
      - "[0-9][0-9]-*.md"
    type: table
    fields: [title, description]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
review-status: pending
---
# Learning path: Information Protection with Microsoft Purview {.unnumbered}

A published label isn't protected data. The label has to be on the content, its encryption has to open for the right people and stay shut for the rest, the agency has to be able to get back into what it encrypted, and it has to be able to show all of it. This learning path teaches you to build and run Microsoft Purview information protection that way in a Microsoft 365 GCC tenant. You work through the twelve gates of [Information Protection with Microsoft Purview: An Implementation Guide](../../books/guides/information-protection-implementation.md) in five modules.

The modules work like a [Microsoft Learn learning path](https://learn.microsoft.com/training/): a short series, each module built on the one before. They don't repeat the guide, [Book 20](../../books/b20-information-protection/index.md) or the developer workbook. Each one tells you what to read and in what order, what to run, and what to check you understood.

## Who this path is for {#ip-who}

| Role | What you get from the path |
|---|---|
| Platform owner (Purview and Microsoft 365 engineering) | The gate order, the label and policy design as a plan, the rings, the baseline export and the drift run |
| Operator (Purview administrator) | The read path in GCC, the Validate commands, the stages of DLP and auto-labeling, the recovery procedure's checks |
| Security monitor (SOC) | The audit floor, the synthetic events, and the drift signals that are P1 |
| Policy owner, records officer and privacy official | The class register, the decision records, what isn't available in GCC, and the charter that comes before insider risk |
| ISSO reviewer | The federal requirements each gate supports, the evidence the kit keeps, and the go/no-go |

: Who the path is for {.striped .hover}

**Level:** intermediate. **Products:** Microsoft Purview (sensitivity labels, DLP, auto-labeling, Audit, Insider Risk Management, Communication Compliance, DSPM for AI), the Azure Rights Management service, Exchange Online, SharePoint and OneDrive, Microsoft 365 Copilot; the ExchangeOnlineManagement and AIPService modules in PowerShell 7. **Scope:** a civilian agency at FedRAMP Moderate in Microsoft 365 GCC.

## Prerequisites {#ip-prerequisites}

- The guide's [How to read this guide](../../books/guides/information-protection-implementation.md#how-to-read-this-guide), including the placeholders: ten minutes, and every Lab 2 uses them.
- The guide's [GCC availability by feature](../../books/guides/information-protection-implementation.md#government-cloud-availability) and its [prerequisites](../../books/guides/information-protection-implementation.md#prerequisites), with the shells table.
- For Lab 1: PowerShell 7.1 or later and Pester 5. For Lab 2: a **test tenant, never production**, an account holding the read roles through PIM, PowerShell 7.6 or later with ExchangeOnlineManagement 3.10 or later, and AIPService 3.1.0.0 or later.

## Get the code {#get-the-code}

Download [information-protection-code.zip](../../../downloads/information-protection-code.zip) to your Downloads folder. It holds `information-protection`, the kit the labs use. Unzip it into `C:\FMWLabs\information-protection-code` (in Windows' **Extract All**, type that folder in place of the one it suggests), so you work in `C:\FMWLabs\information-protection-code\information-protection`. Every Lab 1 command runs from there, as it does from `examples/information-protection` in a clone of the repository. The kit is PowerShell 7.1 or later, with Pester 5 for its tests.

In PowerShell (Windows PowerShell 5.1 or PowerShell 7):

```powershell
Expand-Archive -Path $HOME\Downloads\information-protection-code.zip -DestinationPath C:\FMWLabs\information-protection-code -Force
Set-Location C:\FMWLabs\information-protection-code\information-protection
Get-ChildItem C:\FMWLabs\information-protection-code -Recurse -File | Unblock-File
```

In Git Bash on Windows:

```bash
mkdir -p /c/FMWLabs
unzip -o ~/Downloads/information-protection-code.zip -d /c/FMWLabs/information-protection-code
cd /c/FMWLabs/information-protection-code/information-protection
```

In Bash on Linux or macOS, which use `~/FMWLabs` in place of `C:\FMWLabs`:

```bash
mkdir -p ~/FMWLabs
unzip -o ~/Downloads/information-protection-code.zip -d ~/FMWLabs/information-protection-code
cd ~/FMWLabs/information-protection-code/information-protection
```

Check it works, in PowerShell 7.1 or later, with Step 1 of [Chapter 01's Lab 1](../../project-plans/developer-workbooks/information-protection/01-access-and-the-read-path.md#lab-1-fixtures-no-tenant):

```powershell
./Invoke-IpAccess.ps1 -SettingsPath tests/fixtures/settings.lab.json -SnapshotPath tests/fixtures/snapshots/2026-11-24 -OutputPath out/access -AsOf 2026-11-24T12:00:00Z
```

It prints four rows and ends with `access: Fail (2 pass, 1 fail, 1 other). Written to ./out/access`. The failure and the warning are in the fixtures on purpose; the chapter's lab explains each.

## What you'll be able to do {#ip-outcomes}

When you finish the path, you'll be able to:

- say which Purview features the agency's design needs that GCC doesn't offer, and the interim path for each;
- read the Purview configuration in the right tenant with the right roles, and keep it as a dated baseline;
- check labels, label policies and container labels against the design, and say why a label is never deleted;
- confirm that Rights Management is active, that nobody can decrypt everything at rest, and that the approved mail scenarios encrypt;
- hold every DLP and auto-labeling policy to its stage, with exceptions that expire;
- prove the audit floor with synthetic events, find the month's drift, and produce the evidence an assessor reads.

## Modules {#ip-modules-table}

Work through them in order.

| # | Module | Guide gates | Workbook chapters | Time |
|---|---|---|---|---|
| 1 | [Classes, access and the baseline](01-classes-access-and-the-baseline.md) | G1, G12 | [01](../../project-plans/developer-workbooks/information-protection/01-access-and-the-read-path.md), [02](../../project-plans/developer-workbooks/information-protection/02-the-baseline-export.md), [03](../../project-plans/developer-workbooks/information-protection/03-the-data-inventory.md) | 40 min, plus the labs |
| 2 | [Labels, publication and containers](02-labels-publication-and-containers.md) | G2, G3, G4 | [04](../../project-plans/developer-workbooks/information-protection/04-labels-policies-and-containers.md) | 40 min, plus the labs |
| 3 | [Encryption and recovery](03-encryption-and-recovery.md) | G5, G6, G7 | [05](../../project-plans/developer-workbooks/information-protection/05-rights-management-and-message-encryption.md) | 40 min, plus the labs |
| 4 | [DLP, auto-labeling and AI](04-dlp-auto-labeling-and-ai.md) | G8, G9, G11 | [06](../../project-plans/developer-workbooks/information-protection/06-dlp-and-auto-labeling.md) | 45 min, plus the labs |
| 5 | [Audit, drift and evidence](05-audit-drift-and-evidence.md) | G10, G12 | [07](../../project-plans/developer-workbooks/information-protection/07-audit-and-the-synthetic-events.md), [08](../../project-plans/developer-workbooks/information-protection/08-drift-metrics-and-the-monthly-evidence-run.md), [09](../../project-plans/developer-workbooks/information-protection/09-deploying-to-test-and-production.md) | 45 min, plus the labs |

: The modules of the Information Protection learning path {.striped .hover}

**Total time:** about 3½ hours of reading and knowledge checks. The labs aren't counted: a label policy takes time to reach clients, a simulation runs for days, and an audit event can take hours to appear.

**Labs.** Each module has two:

- **Lab 1** runs the developer workbook [*Building Information Protection*](../../project-plans/developer-workbooks/information-protection/index.md)'s chapter labs on the kit's fictional fixtures, with no tenant. The module links them rather than repeating them; every Lab 1 command was run as printed, and the chapters show what each printed.
- **Lab 2** runs the guide's own **Validate** commands in a test tenant, every step a copy-paste command, and every step a read. The authors haven't run the Lab 2s; the expected result each step states is the guide's pass condition or the Learn fact the guide cites, not captured output.

## How this path fits {#ip-fits}

The guide is finished when it has [four pieces](https://github.com/WhalerMike/modernization-workbook/blob/main/CONTRIBUTING.md#an-implementation-guide-is-finished-when-it-has-all-four-pieces): the guide, a narrated deck series, a developer workbook and a training path. This path is the training piece. The developer workbook is [*Building Information Protection*](../../project-plans/developer-workbooks/information-protection/index.md), whose kit is `examples/information-protection`. The narrated decks aren't built yet.

::: {#ip-modules}
:::
