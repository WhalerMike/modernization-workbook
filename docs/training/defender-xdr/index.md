---
title: "Learning path: Defender XDR Engineering and Operations"
subtitle: "Five modules: architecture, access and onboarding; prevention and Attack Surface Reduction; exposure and incidents; hunting, detections as code and identity signals; and automation, operations and evidence, each with a lab in your own test tenant"
description: "A learning path in five modules for endpoint engineers, Intune and Defender operators, SOC analysts and detection engineers, the policy owner and ISSO reviewers, built from the Defender XDR implementation guide: unified RBAC roles through PIM, the Graph read path in the tenant's own cloud and proof that the sensor is on and healthy; antivirus, firewall, tamper protection, network protection and controlled folder access through audit, and Attack Surface Reduction through audit, warn and block; vulnerability work without Security Exposure Management, which isn't available in GCC, and incidents triaged to a severity table; custom detections kept in a repository and deployed through the Microsoft Graph API, and identity and cloud-app signals in one query; automation levels matched to the response ladder, and the monthly evidence run. Each module has a knowledge check and a lab that runs the guide's own Validate commands in a test tenant. There is no kit and no fixture lab yet."
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
review-status: pending
last-reviewed: 2026-11-13
---
# Learning path: Defender XDR Engineering and Operations {.unnumbered}

A Defender license is not a defended endpoint. The sensor has to be on every device and healthy, the prevention settings have to be enforced and not just configured, and every alert has to end in a decision someone can show. This learning path teaches you to build and run Microsoft Defender XDR that way on Windows clients and Windows Server, and to produce the evidence an assessor reads. You work through the ten gates of [Defender XDR Engineering & Operations: An Implementation Guide](../../books/guides/defender-xdr-implementation.md) in five modules.

**Watch first.** The guide's narrated deck, about 15 minutes with captions, covers the ten gates in one sitting. Its video is being exported; until it is on the [Presentations](../../presentations/index.md) page, read its [narration script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/guide-defender-xdr/Guide_Defender_XDR_Narration_Script.md).

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

| # | Module | Guide steps | Lab | Time |
|---|---|---|---|---|
| 1 | [Architecture, access and onboarding](01-architecture-access-and-onboarding.md) | 1 and 2 | Lab 2 | 40 min, plus Lab 2 |
| 2 | [Prevention and Attack Surface Reduction](02-prevention-and-attack-surface-reduction.md) | 3 and 4 | Lab 2 | 50 min, plus Lab 2 |
| 3 | [Exposure and incidents](03-exposure-and-incidents.md) | 5 and 6 | Lab 2 | 35 min, plus Lab 2 |
| 4 | [Hunting, detections as code and identity signals](04-hunting-detections-and-identity-signals.md) | 7 and 8 | Lab 2 | 45 min, plus Lab 2 |
| 5 | [Automation, operations and evidence](05-automation-operations-and-evidence.md) | 9 and 10 | Lab 2 | 40 min, plus Lab 2 |

: The modules of the Defender XDR learning path {.striped .hover}

**Total time:** about 3½ hours of reading and knowledge checks. The labs aren't counted: a policy change takes until the next device check-in, and an audit phase runs for weeks.

**Labs.** This guide has no kit in `examples/` and no developer workbook yet, so there is no Lab 1 on fixtures. Each module's lab is a Lab 2: the guide's own **Validate** commands and read-only queries, run in a test tenant, every step a copy-paste command. The authors haven't run them; the expected result each step states is the one the guide and Microsoft Learn give, not captured output. Where a step changes something, it keeps the guide's change safety: a ring 0 test device, audit before block, and the step back. The developer workbook, with fixture labs, is planned. [The Labs page](../labs.md#xdr) lists every lab in the path.

## How this path fits {#xdr-fits}

The guide is finished when it has [four pieces](https://github.com/WhalerMike/modernization-workbook/blob/main/CONTRIBUTING.md#an-implementation-guide-is-finished-when-it-has-all-four-pieces): the guide, a narrated deck series, a developer workbook and a training path. This path is the training piece. The guide's narrated deck is built; each module's own narrated deck comes next; the developer workbook is planned.

::: {#xdr-modules}
:::
