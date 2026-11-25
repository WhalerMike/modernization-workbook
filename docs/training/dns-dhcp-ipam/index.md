---
title: "Learning path: DNS, DHCP and IPAM"
subtitle: "Six modules on Book 08's naming plane: read it from the evidence, sort what Active Directory DNS does into where it goes, check the DHCP edge, hold every network to one address plan, move authority through the decommissioning gates, and keep the evidence, each with a lab on fixtures and a lab in your own test environment"
description: "A learning path for DNS and DDI engineers, Active Directory engineers, network and cloud engineers and ISSO reviewers, built on Book 08, DNS, DHCP & IPAM, and the Start Kit's DNS and DHCP collectors: read a domain's zones, locator records, zone health and DHCP scopes as one naming plane, sort every Active Directory DNS component into Chapter 10's target, method and risk, with the findings to clear before anything moves; check the resolvers and options each DHCP scope hands out, failover, the registration settings and DHCP servers nobody authorized, with encrypted DNS at the endpoint; check every network on premises and in Azure, AWS GovCloud (US) and Oracle Cloud against the IPAM address plan, with the forwarders that carry private DNS between them; move authority zone by zone and run Chapter 10's five decommissioning gates from the evidence; and operate the plane with Chapter 09's roles and Chapter 11's evidence, indexed and hashed for the ISSO. Each module's Lab 1 runs the Start Kit on fictional files with no server or subscription; its Lab 2 runs the same commands in your own test domain or cloud accounts; each module ends with a knowledge check."
doc-type: training-path
research-status: draft
research-type: training module
research-book: "Book 08"
series-order: 0
listing:
  - id: ddi-modules
    contents:
      - "[0-9][0-9]-*.md"
    type: table
    fields: [title, description]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
review-status: approved
reviewed-sha256: 6a05035259ba44a0bee7465d5d82f44a4ff6d4db05c5acda89a46f3fd275bf42
last-reviewed: 2026-11-25
---
# Learning path: DNS, DHCP and IPAM {.unnumbered}

In most agencies DNS, DHCP and IPAM grew up as a utility on the domain controllers, and nobody owns the whole of it. [Book 08](../../books/b08-ddi/index.md) argues that the naming plane is now a control plane: identity, private cloud connectivity and security policy all depend on a name resolving to the right address from every place a client sits. This learning path teaches you to read that plane from evidence rather than from memory, and to plan its move off Active Directory DNS one component at a time. You run the [Start Kit](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/start-kit)'s DNS and DHCP collectors and its readiness checks on your laptop, then in a test domain.

Like a [Microsoft Learn learning path](https://learn.microsoft.com/training/), it is a short series of modules, each built on the one before. The modules don't repeat Book 08. They tell you what to read, in what order, what to run, and what to check you understood.

## Who this path is for

| Role | What you get from the path |
|---|---|
| DNS or DDI engineer | Every zone, forwarder and scope in one inventory, and each one's target, method and risk on the new platform |
| Active Directory engineer | The locator records, secure dynamic updates and DHCP registration that AD DNS provides, and what must replace each before the last domain controller goes |
| Network or cloud engineer | The DHCP options and forwarders that decide which resolver a client uses, and where cloud private DNS joins the plane |
| ISSO reviewer | The federal requirements each module supports, the KSI it lines up with where the workbook has a verified pairing, and the evidence you keep |

**Level:** intermediate. **Products:** Windows Server DNS and DHCP with Active Directory Domain Services (Windows Server 2019 or later), the Windows Server DnsServer and DhcpServer PowerShell modules; in Module 4, Azure virtual networks and the DNS Private Resolver, Amazon VPC and the Route 53 VPC Resolver in AWS GovCloud (US), and OCI VCNs and the VCN resolver, through each cloud's CLI. **Scope:** a civilian agency at FedRAMP Moderate, in Microsoft 365 GCC with commercial Azure, its AWS workloads in AWS GovCloud (US) and its HR platform on Oracle Cloud, with an on-premises Active Directory whose domain controllers run DNS, as Book 08 assumes.

## Prerequisites

- Book 08, [Chapter 01](../../books/b08-ddi/01-dns-is-the-control-plane.md): fifteen minutes, and every module refers back to it.
- PowerShell basics: you can run a command, import a module and read the objects it returns.
- For Lab 1: Windows PowerShell 5.1 or PowerShell 7, and the Start Kit (below). Nothing else.
- For Lab 2: a test domain you can build and throw away. [What you need for the labs](#what-you-need-for-the-labs) says what it holds.

## Get the code {#get-the-code}

Download [start-kit.zip](../../../downloads/start-kit.zip) to your Downloads folder. It holds the Start Kit, in one folder, `start-kit`: the DNS and DHCP collectors in `FMPADAssessment`, the readiness checks in `FMPDdiReadiness`, their tests, and the fictional domain's files the labs read, in `tests/fixtures/ddi`. Unzip it into `Downloads\start-kit`, the folder Windows' **Extract All** suggests, so you work in `Downloads\start-kit\start-kit`: the zip's name appears twice. Every lab command runs from there, as it does from `examples/start-kit` in a clone of the repository. The kit is Windows PowerShell 5.1 or PowerShell 7; it has no Python steps. [Get a path's code](../index.md#get-the-code) says why each step is there.

In PowerShell (Windows PowerShell 5.1 or PowerShell 7):

```powershell
Expand-Archive -Path $HOME\Downloads\start-kit.zip -DestinationPath $HOME\Downloads\start-kit -Force
Set-Location $HOME\Downloads\start-kit\start-kit
Get-ChildItem $HOME\Downloads\start-kit -Recurse -File | Unblock-File
```

In Bash on Linux or macOS, or Git Bash on Windows:

```bash
unzip -o ~/Downloads/start-kit.zip -d ~/Downloads/start-kit
cd ~/Downloads/start-kit/start-kit
```

Check it works, in PowerShell, with Module 1, Lab 1, Step 2:

```powershell
$inv = Get-Content -Raw tests/fixtures/ddi/run-2026-11-20/contoso.example/DNS/DNSInventory.json | ConvertFrom-Json
$inv.DnsServer, $inv.Zones.Count
```

It prints `dc01.contoso.example` and `12`.

## What you'll be able to do

When you finish the path, you'll be able to:

- read a domain's zones, the DNS servers that hold them, its locator records, its zone health and its DHCP scopes from one assessment run, and say what each tells you;
- spot what Book 08 says to clear before anything moves: a locator record that doesn't resolve, a DNS server nobody could read, scavenging off, stale and duplicate records, forwarders nobody has tested;
- sort every Active Directory DNS component into its target, its Azure-native equivalent, its method and its risk, as Chapter 10 does;
- explain why the locator records stay with a service domain controllers can register in, and why Azure Private DNS can't host them;
- check every DHCP scope for the resolvers and options it hands out, failover and registration settings, and find DHCP servers nobody authorized;
- explain why encrypted DNS has to end at the agency's resolvers, and what the network can and can't block;
- check every network on premises and in Azure, AWS GovCloud (US) and Oracle Cloud against the IPAM address plan, and see where each forwarder carrying private DNS between them points;
- run the cutover loop for one zone, and Chapter 10's five decommissioning gates from the evidence, and say why a failed locator record check restarts the clock;
- hand the ISSO an evidence index they can trace, file by file, to the requirement each supports, and check for changes, with what the platform and the SOC must add.

## Modules

Work through them in order.

| # | Module | Book 08 | Labs | Time |
|---|---|---|---|---|
| 1 | [Read the naming plane](01-read-the-naming-plane.md) | Chapters 01 to 03, and Chapter 10's Phase 1 | Lab 1, Lab 2 | 50 min |
| 2 | [The Active Directory DNS departure](02-the-active-directory-dns-departure.md) | Chapter 04, and Chapter 10's "Where each component goes" | Lab 1, Lab 2 | 55 min |
| 3 | [DHCP, encrypted DNS and the edge](03-dhcp-encrypted-dns-and-the-edge.md) | Chapter 05, and Chapter 04's DHCP settings | Lab 1, Lab 2 | 55 min |
| 4 | [Cloud private DNS and one address plan](04-cloud-private-dns-and-one-address-plan.md) | Chapter 07, and Book 10's Chapter 06 | Lab 1, Lab 2 | 55 min |
| 5 | [Move authority zone by zone](05-move-authority-zone-by-zone.md) | Chapter 10's Phases 2 to 5, and Chapter 08's five decisions | Lab 1, Lab 2 | 60 min |
| 6 | [Operate the control plane with evidence](06-operate-the-control-plane-with-evidence.md) | Chapters 09 and 11, and Appendix B | Lab 1, Lab 2 | 50 min |

: The modules of the DNS, DHCP and IPAM learning path {.striped .hover}

**Total time:** about 5 hours 25 minutes with each module's Lab 1. Lab 2 isn't counted: building the test domain takes most of an hour the first time, and Module 4's depends on the cloud accounts you have.

Each module follows the same units: an introduction with the federal requirements it supports, learning objectives, prerequisites, two or three concept units, Lab 1, Lab 2, a knowledge check and a summary.

## What you need for the labs {#what-you-need-for-the-labs}

**Lab 1: a laptop, no server.** Every Lab 1 runs the Start Kit against the files of a fictional domain, `contoso.example`, in `tests/fixtures/ddi/run-2026-11-20`: the files `Get-FMPDNSAssessment` and `Get-FMPDHCPInventory` write, for three domain controllers and two DHCP servers. Module 3 adds a DHCP snooping export, Module 4 an IPAM export and the JSON the Azure, AWS and OCI CLIs print, and Module 5 a month of locator record checks and the other gates' records, all in `tests/fixtures/ddi`. The kit's tests run the real collector under mocks and read its output with the same checks, so the fixture keeps the collectors' shape. You need the kit and Windows PowerShell 5.1 or PowerShell 7, on Windows, Linux or macOS. Run every command from `examples/start-kit` (or `Downloads\start-kit\start-kit`). A lab that writes anything writes an `out` folder there and deletes it at the end. Nothing in Lab 1 contacts a server. The output shown in each Lab 1 is what the commands printed on November 24, 2026, in PowerShell 7.6 and Windows PowerShell 5.1.

**Lab 2: your own test domain.** Lab 2 needs one Windows Server 2019 or later virtual machine that you can checkpoint and throw away, promoted to a new forest with fictional names (the labs use `lab.contoso.example`), with the DNS Server and DHCP Server roles. Module 1's Lab 2 builds it with Microsoft Learn's commands. Never run Lab 2 against a production domain: the collectors only read, but the build steps create a forest. **The authors didn't run the Lab 2 steps.** Each one ends with a way to back it out, and restoring the checkpoint backs out everything. Module 4's Lab 2 instead reads an Azure test subscription, an AWS GovCloud (US) account and an OCI tenancy that aren't production, whichever you have, with their CLIs; it creates nothing in them.

## How this path fits with the other pieces

Book 08 has no developer workbook: its only code is the Start Kit's DNS and DHCP collectors and the readiness checks this path added beside them, so the labs run the kit directly, as the [Zero Trust Assessment path](../zero-trust-assessment/index.md) does with its results kit.

| Piece | Where |
|---|---|
| The design | [Book 08 — DNS, DHCP & IPAM](../../books/b08-ddi/index.md) |
| A platform build | [Implementing Book 08 on Infoblox NIOS](../../books/guides/infoblox-nios-implementation.md), research under review |
| The code and its tests | [`examples/start-kit`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/start-kit) |
| The schedule | [Network & Access Modernization](../../project-plans/network-access.md): its naming and addressing plane |
| The vendor's own training | [Infoblox Training and Learning Paths](../infoblox-training.md): Infoblox's courses and certifications, arranged by role |
| Private Link and its DNS in Azure | [Azure Security Engineering, Module 4](../azure-security/04-private-link-dns-and-key-vault.md) |
| Everything on the topic | [Topic: DNS, DHCP and IPAM](../../topics/dns-dhcp-ipam.md) |

: Where each piece of DNS, DHCP and IPAM lives {.striped .hover}

**Why the Infoblox page stays separate.** It is the vendor's own curriculum, arranged by role, for an agency that has chosen Infoblox. This path teaches Book 08's platform-neutral design with the workbook's own code, before and whatever the platform choice ([Chapter 12](../../books/b08-ddi/12-selection-cost-and-residual-risk.md)). Take the Infoblox paths once the platform is chosen; they don't replace these modules, and these modules don't teach the product.

## Modules in this path

::: {#ddi-modules}
:::
