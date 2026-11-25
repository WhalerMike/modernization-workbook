---
title: "Learning path: The SD-WAN Governor and Its Evidence"
subtitle: "Four modules: the governor before the traffic, the ED 26-03 and KEV gate, the hunt and the logs, and path classes, change rings and the evidence, with labs on the Cisco kit's fixtures and in a test fabric"
description: "A learning path in four modules for network engineers, the fabric owner, security monitors and ISSO reviewers, built from Book 09 and the Cisco Catalyst SD-WAN implementation guide: why transport is physics and control is compliance, and why the governor is secured before it carries traffic; Gate 0, the fixed-release floor for Emergency Directive 26-03 and the Known Exploited Vulnerabilities catalog, as a gate a pipeline can stop on; validating every control component, reviewing Manager's audit log and getting logs off the box; and path classes, egress patterns, Microsoft 365's Optimize exception, change rings and the evidence package. Lab 1 replays the Cisco kit's fictional Manager responses with no fabric; Lab 2 runs the kit read-only against a test fabric. Each module ends with a knowledge check."
doc-type: training-path
research-status: draft
research-type: training module
research-book: "Book 09"
series-order: 0
listing:
  - id: nsw-modules
    contents:
      - "[0-9][0-9]-*.md"
    type: table
    fields: [title, description]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
review-status: approved
reviewed-sha256: e41e65c0203b7e6c24f5b4ea90e7ae6b9b478d748b00c53c6d70e55777dadf3b
last-reviewed: 2026-11-25
---
# Learning path: The SD-WAN Governor and Its Evidence {.unnumbered}

[Book 09](../../books/b09-network/index.md) argues that a branch network's transport is a physics decision and its security is a control decision, and that the device which governs the transport, the SD-WAN fabric, has to be secured before it carries a single production flow. In 2026 that stopped being a design opinion: CISA's Emergency Directive 26-03 and nine entries in the Known Exploited Vulnerabilities catalog made "secure the governor first" a gate with a definition. This learning path teaches you to run that gate, read its evidence and keep it, on one named product, with [Building Book 09's SD-WAN Design on Cisco Catalyst SD-WAN](../../books/guides/cisco-sdwan-implementation.md) as the guide and the [Cisco SD-WAN kit](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/cisco-sdwan) on your laptop.

The guide names one product to make Book 09's vendor-neutral design concrete. Neither the guide nor this path is an endorsement by any agency, and Book 09's design doesn't depend on the vendor.

Like a [Microsoft Learn learning path](https://learn.microsoft.com/training/), it is a short series of modules, each built on the one before. The modules don't repeat Book 09 or the guide. They tell you what to read, in what order, what to run, and what to check you understood.

**Not this path.** Microsoft's own security service edge, deployed as the identity-aware network layer, has its own path: [Global Secure Access as the Identity-Aware Network](../global-secure-access/index.md). This path stops where the fabric hands traffic to a security service edge, whichever one the agency chooses, and links there for Global Secure Access.

## Who this path is for

| Role | What you get from the path |
|---|---|
| Network engineer | The kit's commands, the release rule behind the gate, and the read-only Manager account the live run uses |
| Fabric owner | Gate 0 as a checklist, the change rings and their exit criteria, and the re-run cadence that follows Cisco's publication days |
| Security monitor | The audit-log review flags, the peering and sign-in alerts the hunt guidance asks for, and what the kit leaves to the SIEM |
| ISSO reviewer | The requirements and KSIs each module supports, the evidence each run produces, and how to check a gate run yourself |

**Level:** intermediate. **Products:** Cisco Catalyst SD-WAN Manager, Controller and Validator (release 20.18 in the guide's baseline); Python 3.10 or later for the kit; PowerShell 5.1 or 7 to read its output. **Scope:** a civilian agency at FedRAMP Moderate, with the Catalyst control plane hosted in Cisco's FedRAMP environment by default, as [WD-060](../../about/decision-register.md#wd-060) settles.

## Prerequisites

- [Book 09, Chapter 02](../../books/b09-network/02-transport-is-physics-control-is-compliance.md): transport versus control. Module 1 reads it with you.
- The guide's [Gate 0](../../books/guides/cisco-sdwan-implementation.md#gate-0-emergency-directive-26-03-and-the-kev-floor): fifteen minutes, and Modules 2 and 3 work through it.
- Python 3.10 or later and pytest, and PowerShell 5.1 or 7, on your laptop for Lab 1. [Set Up for the Labs](../lab-setup.md) installs them. The kit's zip, [cisco-sdwan.zip](../../../downloads/cisco-sdwan.zip), extracted, or this repository cloned.
- For Lab 2: a test fabric, never production: a Catalyst SD-WAN Manager in a lab overlay or a vendor sandbox, reachable from your host, and a Manager account with a read-only role.

## Get the code {#get-the-code}

Download [cisco-sdwan.zip](../../../downloads/cisco-sdwan.zip) to your Downloads folder. It holds the Cisco SD-WAN kit itself. Unzip it into `C:\FMWLabs\cisco-sdwan` (in Windows' **Extract All**, type that folder in place of the one it suggests), so you work in `C:\FMWLabs\cisco-sdwan`. Every lab command runs from there, as it does from `examples/cisco-sdwan` in a clone of the repository. The kit is one Python script, standard library only, with pytest for its tests; the labs read its output in PowerShell. The kit has no PowerShell scripts or modules, so there's nothing to unblock. [Get a path's code](../index.md#get-the-code) says why each step is there.

In PowerShell (Windows PowerShell 5.1 or PowerShell 7):

```powershell
Expand-Archive -Path $HOME\Downloads\cisco-sdwan.zip -DestinationPath C:\FMWLabs\cisco-sdwan -Force
Set-Location C:\FMWLabs\cisco-sdwan
```

In Git Bash on Windows:

```bash
mkdir -p /c/FMWLabs
unzip -o ~/Downloads/cisco-sdwan.zip -d /c/FMWLabs/cisco-sdwan
cd /c/FMWLabs/cisco-sdwan
```

In Bash on Linux or macOS, which use `~/FMWLabs` in place of `C:\FMWLabs`:

```bash
mkdir -p ~/FMWLabs
unzip -o ~/Downloads/cisco-sdwan.zip -d ~/FMWLabs/cisco-sdwan
cd ~/FMWLabs/cisco-sdwan
```

Check it works, with Module 1, Lab 1, Step 3 (use `python3` in Bash on Linux or macOS):

```powershell
python python/sdwan_evidence.py --config config/config.example.json --replay tests/fixtures --out out
```

It prints `gate: fail  evidence: out/sdwan-evidence.json  findings: out/ed-26-03-gate.csv`. The fictional fabric fails its gate on purpose; Module 2 says why.

## What you'll be able to do

When you finish the path, you'll be able to:

- explain why direct internet access is a transport decision that leaves the boundary controls undone, and why the governor is secured before it carries traffic;
- choose between Cisco's FedRAMP-hosted control plane and an on-premises one, and say what hosting doesn't remove;
- run the ED 26-03 and KEV gate against a fabric, read its findings, and apply the release rule behind each `pass`, `fail` and `confirm`;
- use the gate's exit code to stop a cutover, and re-run it on every KEV addition and Cisco publication day;
- validate every control component Manager knows about, review Manager's audit log, and get the fabric's logs off the box to the SIEM and to CISA;
- map Book 09's path classes and egress patterns onto the fabric, and recognize what belongs to the security service edge;
- assemble and seal the evidence package an assessor checks, and say which of Chapter 05's records the kit doesn't build.

## Modules

Work through them in order.

| # | Module | Guide sections | Labs | Time |
|---|---|---|---|---|
| 1 | [The governor before the traffic](01-the-governor-before-the-traffic.md) | Orientation, the hosted-or-on-premises decision | Lab 1, Lab 2 | 45 min, plus Lab 2 |
| 2 | [Gate 0: the ED 26-03 and KEV floor](02-gate-0-the-ed-26-03-and-kev-floor.md) | Gate 0 | Lab 1, Lab 2 | 50 min, plus Lab 2 |
| 3 | [The hunt, hardening and logs off the box](03-the-hunt-hardening-and-logs-off-the-box.md) | Gate 0's hunt, Hardening, Getting logs off the box | Lab 1, Lab 2 | 45 min, plus Lab 2 |
| 4 | [Path classes, change rings and the evidence](04-path-classes-change-rings-and-the-evidence.md) | Policy, TIC 3.0, SSE and Microsoft 365, Evidence and telemetry, Control states | Lab 1, Lab 2 | 50 min, plus Lab 2 |

: The modules of the SD-WAN governor learning path {.striped .hover}

**Total time:** about 3 hours and 10 minutes with each module's Lab 1. Lab 2 isn't counted.

**Labs.** Lab 1 replays two fictional Manager captures through the kit, a week apart: the fabric before its upgrade and after it. Nothing signs in and nothing leaves your laptop. The output shown in each Lab 1 is what the commands printed on November 24, 2026. Lab 2 runs the kit read-only against a test fabric; the authors haven't run it, and each Lab 2 says what it leaves behind. [The Labs page](../labs.md#network-sd-wan) lists every lab in the path.

::: {#nsw-modules}
:::
