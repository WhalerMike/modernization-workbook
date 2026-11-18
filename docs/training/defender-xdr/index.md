---
title: "Learning path: Defender XDR Engineering and Operations"
subtitle: "Five modules: architecture, access and onboarding; prevention and Attack Surface Reduction; exposure and incidents; hunting, detections as code and identity signals; and automation, operations and evidence, each with a lab in your own test tenant"
description: "A learning path in five modules for endpoint engineers, Intune and Defender operators, SOC analysts and detection engineers, the policy owner and ISSO reviewers, built from the Defender XDR implementation guide: unified RBAC roles through PIM, the Graph read path in the tenant's own cloud and proof that the sensor is on and healthy; antivirus, firewall, tamper protection, network protection and controlled folder access through audit, and Attack Surface Reduction through audit, warn and block; vulnerability work without Security Exposure Management, which isn't available in GCC, and incidents triaged to a severity table; custom detections kept in a repository and deployed through the Microsoft Graph API, and identity and cloud-app signals in one query; automation levels matched to the response ladder, and the monthly evidence run. Each module has a knowledge check, a Lab 1 that runs the developer workbook's checks on fixtures with no tenant, and a Lab 2 that runs the guide's own Validate commands in a test tenant."
doc-type: training-path
research-status: draft
research-type: training module
research-book: "Book 12"
series-order: 0
listing:
  - id: xdr-modules
    contents:
      - "[0-9][0-9]-*.md"
    type: table
    fields: [title, description]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
review-status: approved
reviewed-sha256: 955fe66e36f575fb4ac0bfac60f4d7662bdd5ca4c96989c0884e00e1f7a1522d
last-reviewed: 2026-11-18
---
# Learning path: Defender XDR Engineering and Operations {.unnumbered}

A Defender license is not a defended endpoint. The sensor has to be on every device and healthy, the prevention settings have to be enforced and not just configured, and every alert has to end in a decision someone can show. This learning path teaches you to build and run Microsoft Defender XDR that way on Windows clients and Windows Server, and to produce the evidence an assessor reads. You work through the ten gates of [Defender XDR Engineering & Operations: An Implementation Guide](../../books/guides/defender-xdr-implementation.md) in five modules.

**Watch first.** The guide's narrated deck, about 17 minutes with captions, covers the ten gates in one sitting: [▶ watch it in the browser](../../presentations/watch.html?v=Guide_Defender_XDR_Narrated), or find it on the [Presentations](../../presentations/index.md#guide-defender-xdr) page. Each module also has its own narrated deck, linked from the module's page.

Like a [Microsoft Learn learning path](https://learn.microsoft.com/training/), it is a short series of modules, each built on the one before. The modules don't repeat the guide or the books it links ([Security Operations](../../books/b12-security-operations/index.md) and [Devices](../../books/b05-devices/index.md)). They tell you what to read, in what order, what to run, and what to check you understood.

## Who this path is for {#xdr-who}

| Role | What you get from the path |
|---|---|
| Platform owner (endpoint engineering) | The rings, the order of the prevention and Attack Surface Reduction changes, the exception register and the monthly evidence run |
| Operator (Intune and Defender administrator) | Onboarding and sensor health, the policy settings and their audit modes, device groups and automation levels |
| Security monitor (SOC) and detection engineer | The incident queue and severity table, advanced hunting, custom detections as code, and the cross-source query |
| Policy owner and ISSO reviewer | The decision record, the federal requirements each gate supports, the evidence catalog and what couldn't be verified |

**Level:** intermediate. **Products:** Microsoft Defender for Endpoint, Defender XDR, Defender for Identity and Defender for Cloud Apps; Microsoft Intune; Microsoft Graph PowerShell (`Microsoft.Graph.Authentication`, `Microsoft.Graph.Security`); the Windows `Defender` and `NetSecurity` modules. **Scope:** a civilian agency at FedRAMP Moderate in Microsoft 365 GCC. Windows clients and Windows Server only; macOS and Linux are out of scope.

## Prerequisites {#xdr-prerequisites}

- The guide's [How to read this guide](../../books/guides/defender-xdr-implementation.md#how-to-read-this-guide) and its [placeholders](../../books/guides/defender-xdr-implementation.md#how-to-read-this-guide): ten minutes, and every lab uses them.
- The guide's [prerequisites](../../books/guides/defender-xdr-implementation.md#prerequisites): the licenses, roles and tools, and the decisions that come first.
- For the labs: a **test tenant, never production**, licensed for Defender for Endpoint Plan 2 (advanced hunting needs it), with at least one Windows test device enrolled in Intune; PowerShell 7 on your workstation.

## What you'll be able to do {#xdr-outcomes}

When you finish the path, you'll be able to:

- describe Defender XDR's components, its two trust boundaries and its control planes, and check each feature's availability in GCC;
- set up unified RBAC roles through PIM, read incidents through Microsoft Graph in the tenant's own cloud, and prove that the sensor is on and healthy across the fleet;
- move network protection and controlled folder access through audit to block, and every Attack Surface Reduction rule through audit and warn to block, with exclusions in a register;
- prioritize vulnerabilities without Security Exposure Management, and triage, contain and classify incidents to a severity table;
- keep custom detections in a repository, test them against a validation window and deploy them through Graph, and correlate endpoint, identity and cloud-app alerts;
- set automation levels to the response ladder, exclude what must never be contained automatically, and produce the hashed monthly evidence package.

## Modules {#xdr-modules-table}

Work through them in order.

| # | Module | Guide gates | Workbook chapters | Time |
|---|---|---|---|---|
| 1 | [Architecture, access and onboarding](01-architecture-access-and-onboarding.md) | G1, G2 | [01](../../project-plans/developer-workbooks/defender-xdr/01-access-and-the-graph-read-path.md), [02](../../project-plans/developer-workbooks/defender-xdr/02-onboarding-coverage-and-sensor-health.md) | 40 min, plus the labs |
| 2 | [Prevention and Attack Surface Reduction](02-prevention-and-attack-surface-reduction.md) | G3, G4 | [03](../../project-plans/developer-workbooks/defender-xdr/03-prevention-through-audit.md), [04](../../project-plans/developer-workbooks/defender-xdr/04-attack-surface-reduction-audit-warn-block.md) | 50 min, plus the labs |
| 3 | [Exposure and incidents](03-exposure-and-incidents.md) | G5, G6 | [05](../../project-plans/developer-workbooks/defender-xdr/05-exposure-and-incidents.md) | 35 min, plus the labs |
| 4 | [Hunting, detections as code and identity signals](04-hunting-detections-and-identity-signals.md) | G7, G8 | [06](../../project-plans/developer-workbooks/defender-xdr/06-detections-as-code.md), [07](../../project-plans/developer-workbooks/defender-xdr/07-identity-signals-and-automation-boundaries.md) | 45 min, plus the labs |
| 5 | [Automation, operations and evidence](05-automation-operations-and-evidence.md) | G9, G10 | [07](../../project-plans/developer-workbooks/defender-xdr/07-identity-signals-and-automation-boundaries.md), [08](../../project-plans/developer-workbooks/defender-xdr/08-the-monthly-evidence-run.md) | 40 min, plus the labs |

: The modules of the Defender XDR learning path {.striped .hover}

**Total time:** about 3½ hours of reading and knowledge checks. The labs aren't counted: a policy change takes until the next device check-in, and an audit phase runs for weeks.

**Labs.** Each module has two. **Lab 1** runs the developer workbook [*Building Defender XDR*](../../project-plans/developer-workbooks/defender-xdr/index.md)'s chapter labs on the kit's fictional fixtures, with no tenant; the module links them rather than repeating them. **Lab 2** runs the guide's own **Validate** commands and read-only queries in a test tenant, every step a copy-paste command. The authors haven't run the Lab 2s; the expected result each step states is the one the guide and Microsoft Learn give, not captured output. Where a step changes something, it keeps the guide's change safety: a ring 0 test device, audit before block, and the step back. [The Labs page](../labs.md#xdr) lists every lab in the path.

## How this path fits {#xdr-fits}

The guide is finished when it has [four pieces](https://github.com/WhalerMike/modernization-workbook/blob/main/CONTRIBUTING.md#an-implementation-guide-is-finished-when-it-has-all-four-pieces): the guide, a narrated deck series, a developer workbook and a training path. This path is the training piece. The guide and each module have a narrated deck; the developer workbook is [*Building Defender XDR*](../../project-plans/developer-workbooks/defender-xdr/index.md), a draft, whose kit is `examples/defender-xdr`.

::: {#xdr-modules}
:::
