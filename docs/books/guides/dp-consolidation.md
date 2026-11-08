---
title: "Distribution Point Consolidation: A Decision Guide Before You Fund a Refresh"
description: "A decision guide for the CIO, program lead, endpoint lead, ISSO and budget officer at an agency weighing a Configuration Manager distribution point refresh: what a distribution point is and what changed, the five questions to answer before any money moves, three options compared (refresh in place, consolidate to a hub tier, cloud-first with Connected Cache), the target architecture, the five gates that decide when the last distribution point retires, standard packaging with PSAppDeployToolkit as the follow-on, federal requirements and KSIs with the evidence an ISSO keeps, a fill-in assessment worksheet with Microsoft 365 Copilot prompts, and a position statement for a briefing. Word download included."
doc-type: workbook-guide
audience: [Executive, Technical, Customer]
family: guides
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
research-status: draft
research-type: decision guide
research-book: "Book 09"
review-status: approved
reviewed-sha256: ddfe972c7f92925f0738a5fec1018a78d105432c36f7e3c903f8967927cfd526
last-reviewed: 2026-11-08
---
# Distribution Point Consolidation: A Decision Guide Before You Fund a Refresh

*A distribution point refresh buys servers for offices. The question to settle first is whether the offices still need servers, and Microsoft's own limits answer most of it.*

::: {.callout-note}
## In this guide
What a Configuration Manager distribution point is and what has changed since one went into every office. The five questions to answer before any money moves. Three options compared in one decision table. The target architecture in summary, the five gates that decide when the last distribution point retires, and the packaging work that follows. The federal requirements each step supports, with the KSIs and the evidence an ISSO keeps. A fill-in [assessment worksheet](#worksheet) with Microsoft 365 Copilot prompts for filling it at work, and a [position statement](#position-statement) for a briefing. The worked case, with its cost model and roadmap, is [Book 09, Chapter 11](../b09-network/11-field-office-wan-transformation.md); this guide links to it rather than repeating it.
:::

| Download | Use |
|---|---|
| [dp-consolidation-guide.docx](../../../downloads/dp-consolidation-guide.docx) | This guide as a Word document, to circulate before the decision meeting |
| [dp-consolidation-worksheet.csv](files/dp-consolidation-worksheet.csv) | The assessment worksheet: one row per question, blank values, opens in Excel |
| [dp-consolidation.zip](../../../downloads/dp-consolidation.zip) | The scripts kit: a read-only inventory and sizing calculator that fill most of the worksheet from the hierarchy, and the change scripts the [implementation guide](dp-consolidation-implementation.md) runs |

## Who this is for and how to use it {#how-to-use}

This guide is for an agency weighing a distribution point refresh: the CIO who approves the money, the program lead who owns the plan, the endpoint lead who runs Configuration Manager and Intune, the ISSO who carries every server in the system security plan, and the budget officer who has to defend the figure. Read it before the funding decision, not after.

**Where agencies are.** The guide assumes the starting state of the worked case: a Configuration Manager hierarchy with a distribution point in most offices, co-management turned on but early, branch traffic over MPLS to a central gateway, and a Microsoft 365 GCC (Moderate) tenant. If your estate differs, the questions still apply; the numbers change.

**How to use it.**

1. Fill in the [assessment worksheet](#worksheet) from agency data, at work. The [Copilot prompts](#copilot-prompts) help.
2. Answer the [five questions](#questions) with the worksheet's numbers.
3. Use the [decision table](#options) to choose an option, and record the decision.
4. If you consolidate, follow the [implementation guide](dp-consolidation-implementation.md), which runs the work step by step with Configuration Manager commands and a scripts kit, on the schedule of the [Content Delivery Modernization project plan](../../project-plans/content-delivery.md).

**Labels.** *(Design guidance)* marks the program's recommendations. Facts cite Microsoft Learn or a federal primary source, read on November 8, 2026 unless the note says otherwise, and logged in this guide's [verification file](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/books/guides/_verification/dp-consolidation.md). Every dollar figure is the worked case's planning estimate, not a quote. Server sizing assumes Windows Server 2019 as the minimum server standard, the workbook's planning assumption.

## What a distribution point is, and what changed {#what-changed}

A distribution point is a content host. Configuration Manager's management point tells a client what to install; the distribution point serves the files. It runs on IIS, moves content with BITS, needs Remote Differential Compression, and keeps a copy of the site's content library.[^dpc-dp-prereq] It holds no database and makes no policy decisions. Where it sits is an economic choice, not a functional one ([Book 09, Chapter 11](../b09-network/11-field-office-wan-transformation.md#why-per-office-distribution-points-are-no-longer-the-model)).

A distribution point went into each office because the office circuit was too slow to pull content from anywhere else. Three things have changed since:

- **Much of the content now comes from the cloud.** Windows updates, Microsoft 365 Apps, Defender definitions and Intune Win32 apps come from Microsoft's content delivery network. Windows devices can download Intune Win32 app content through Delivery Optimization, which shares content between peers and is on by default.[^dpc-win32]
- **Peers can share content without a server.** Configuration Manager peer cache lets a client serve content from its own cache to other clients in the same boundary group.[^dpc-peercache] BranchCache and Delivery Optimization do the same for other content. The aim is one transfer across the WAN per office, not one per client.
- **The management platform is moving.** Microsoft has said Intune is where new device-management innovation will happen and has moved Configuration Manager to an annual release cadence, with each current-branch version supported for 18 months ([Book 09, Chapter 11](../b09-network/11-field-office-wan-transformation.md#the-timing-problem)). Configuration Manager isn't end-of-life, and the distribution point role isn't deprecated. What has gone is the reason for a copy of the content library in every office.

::: {.callout-important}
## The accurate statement
The distribution point role isn't obsolete. The distribution-point-per-office topology is ([Book 09, Chapter 11](../b09-network/11-field-office-wan-transformation.md#what-changed-since-the-model-was-adopted)).
:::

## The questions to answer before any money moves {#questions}

Five questions. Each has a row block in the [worksheet](#worksheet), and each answer goes in the decision record.

### 1. What exactly is the ask? {#q-decompose}

Divide the ask by the number of offices and compare the result with what a distribution point costs. In the worked case, about \$50 million across about 1,500 offices is \$33,333 per office, about twice the program's fully loaded estimate for a server-class distribution point with installation ([Book 09, Chapter 11](../b09-network/11-field-office-wan-transformation.md#the-proposal-under-review)). A gap like that means one of two things: the figure is a five-year total cost of ownership presented as a refresh, or it bundles scope beyond the distribution point, such as circuits, switching or power. Either can be legitimate. Neither can be compared with an alternative until it is said.

**Ask the sponsor:** is the figure acquisition cost or five-year total cost of ownership, and what is in it besides the distribution point itself, item by item?

### 2. How many distribution points when co-management completes? {#q-target-count}

A refresh needs a target inventory. If the planned count when co-management completes is well below today's, the refresh buys servers whose useful life is shorter than their depreciation schedule. The program's Intune-first decision allows no new Configuration Manager infrastructure for new assets ([Book 05, Chapter 04](../b05-devices/04-intune-first-onboarding.md#the-five-pillars)); a consolidated tier shrinks the existing footprint and doesn't add to it, and the budget submission should say so.

**Ask the endpoint lead:** what is the planned distribution point count when co-management completes, and in which fiscal year?

### 3. What does Microsoft's sizing say? {#q-sizing}

Microsoft publishes a limit of 4,000 clients per distribution point, and warns that the real number depends on network speed and server hardware.[^dpc-sizescale] Treat it as a ceiling to stay under. Divide the validated endpoint count by 4,000, round up, and add headroom. In the worked case, about 70,000 endpoints need 18 at the ceiling and 24 with headroom: two at each of 12 hub sites, for a capacity of 96,000 clients at 73% utilization ([Book 09, Chapter 11](../b09-network/11-field-office-wan-transformation.md#content-tier-24-distribution-points)). Every distribution point above that number exists because of a circuit, not because of Configuration Manager.

The same page sets other limits that matter at scale: 250 standard distribution points per primary or secondary site, plus up to 2,000 more as pull distribution points, and 25,000 clients per management point.[^dpc-sizescale] A topology of more than 250 per-office distribution points works only with pull distribution points.

**Ask the endpoint lead:** what is the validated endpoint count, reconciled across Configuration Manager, Intune and the asset record, and dated?

### 4. Does the timing fit the depreciation? {#q-timing}

Hardware bought this year depreciates over about five years. Set that against the target date from question 2. If co-management completes in three or four years, the agency pays for servers for one or two years past their use, and then pays to dispose of them ([Book 09, Chapter 11](../b09-network/11-field-office-wan-transformation.md#the-timing-problem)). Check the hardware too: a distribution point that is out of vendor support is an unsupported component under SA-22, which is a reason to retire it, not only to replace it.[^dpc-53]

**Ask the budget officer:** what depreciation schedule applies, and in which year does the target count from question 2 fall inside it?

### 5. What do the circuits allow? {#q-circuits}

Consolidation depends on each office being able to pull content from a hub, or on peers carrying most of it. That turns on the circuit: bandwidth, peak use, cost and renewal date per office. The worked case's financial result turns on one number, current MPLS cost per office per month, and is cash-positive only above a breakeven of \$873 in its model ([Book 09, Chapter 11](../b09-network/11-field-office-wan-transformation.md#sensitivity-to-current-mpls-cost)). Below that, consolidation is still the better architecture but has to be argued on capability, not savings.

**Ask network engineering:** what is each office's circuit bandwidth, peak use, monthly cost and renewal date?

## The options compared {#options}

| | Refresh in place | Consolidate to a hub tier | Cloud-first with Connected Cache |
|---|---|---|---|
| **What it is** | Replace the distribution point in every office | Two pull distribution points at each of a small set of hubs, sized by client count; peers in the offices; branch distribution points retired in waves | Move content workloads to Intune; Delivery Optimization and Connected Cache serve cloud content; a hub tier stays only until the five gates close |
| **Distribution points** | About one per office (about 1,500 in the worked case) | Validated endpoints ÷ 4,000, plus headroom (24 in the worked case) | The hub tier, falling to none |
| **Capital for content** | The full ask (about \$50M in the worked case) | 24 servers and licences, about \$316,000 in the worked case's bill of materials; circuits are funded and justified separately | The hub tier as interim, plus cache hosts at the hubs |
| **Circuits** | No change | Each office must pull from its hub, or peers must carry it | As for the hub tier, and Microsoft's content delivery network must be reachable from each office |
| **Compliance footprint** | One server per office in the inventory, baseline, scan cadence and SSP | Under 2% of the per-office count; the labor falls, though not in strict proportion | Falls to the cache hosts, then to none |
| **Fit with Intune-first** | Expands the footprint the doctrine is shrinking | Consolidates the existing footprint; adds none for new assets | The doctrine's end state |
| **Main risk** | Paying for servers past their use | Circuits or segmentation not ready; waves slip with the network program | Workloads move but Configuration Manager deployments stay, so the gates don't close |
| **When it's right** | Only where the circuits can't be fixed in the asset's life, or for an air-gapped enclave | Most estates, once the five questions are answered *(design guidance)* | Where co-management is already far along and the circuits are ready |

: The three options {.striped .hover}

The hub-tier capital figure is the worked case's 24 distribution point servers at \$12,000 and 24 Windows Server Standard licences at \$1,176 ([Book 09, Chapter 11](../b09-network/11-field-office-wan-transformation.md#hub-equipment)). It leaves out the hub network equipment, which the network program carries. The comparison isn't scope for scope, and the worked case says why: the refresh funds content only, and the network investment that makes consolidation work also carries Microsoft 365, TIC 3.0 breakout and the Intune migration ([Book 09, Chapter 11](../b09-network/11-field-office-wan-transformation.md#five-year-phased-position)).

**Recommendation** *(design guidance)*. Defer a per-office refresh until the five questions are answered. For most estates the answer is the hub tier now, with cloud-first as its end state: the two options are stages of one path, not rivals. Refresh in place only where a named circuit can't be fixed within the asset's life, and record each one as an exception with its reason.

## The target architecture {#target-architecture}

The full design is in [Book 09, Chapter 11](../b09-network/11-field-office-wan-transformation.md#target-architecture). In summary:

- **A hub content tier.** Two standard source distribution points at each of two data centers hold the full content library. Each regional hub has two pull distribution points that source from them, so distribution is 2-to-20 instead of 1-to-1,500, and distribution point groups limit each hub to the content its region uses ([Book 09, Chapter 11](../b09-network/11-field-office-wan-transformation.md#content-tier-24-distribution-points)). Hub servers run Windows Server 2019 or later; Microsoft supports the distribution point role on Windows Server 2019, 2022 and 2025.[^dpc-siteos]
- **Boundary groups that point at the hubs.** Each office's boundary group lists its hub's distribution points as content sources, with the other hubs as fallback after a set time. A client that can't find content in its current boundary group keeps trying there until the fallback time, then widens its search to neighbor groups.[^dpc-bg-dp]
- **Peers in the office.** Peer cache sources serve only clients in their own current boundary group; the management point doesn't offer peers from a neighbor group. Sources can divide content into parts, so a boundary group downloads each part once.[^dpc-peercache] Boundary group options can keep peer downloads within a subnet.[^dpc-bg-options] Delivery Optimization should use Group mode, or a subnet restriction, while branch traffic still leaves at a hub, because its default LAN mode treats every office behind one public address as one group ([Book 09, Chapter 11](../b09-network/11-field-office-wan-transformation.md#keeping-content-local-without-a-server)).
- **Peer traffic needs open ports.** Peer cache uses TCP 8003, and UDP 8004 for the Windows PE broadcast; Delivery Optimization peers on TCP 7680. Branch segmentation has to allow client-to-client traffic on these ports, or peering doesn't work. Peering is an optimization, not a dependency: blocked, clients pull from the hub ([Book 09, Chapter 11](../b09-network/11-field-office-wan-transformation.md#keeping-content-local-without-a-server)).
- **Connected Cache at the hubs, later.** Microsoft Connected Cache for Enterprise and Education is a stand-alone cache managed from the Azure portal. It needs Windows Server 2022 or later, Windows 11 or Ubuntu 24.04, an Azure subscription, and a host with nothing else on port 80, so it can't share a server with a distribution point.[^dpc-mcc-ent][^dpc-mcc-prereq] The Configuration Manager–integrated cache runs on a distribution point with no other roles and serves only content for workloads that have moved to Intune, including Win32 apps.[^dpc-mcc-cm] Nothing earlier in the plan depends on either.
- **Office retirement in waves.** An office's distribution point goes read-only first, with clients on the hub and peers, then retires after 30 days of serving nothing *(design guidance)*. Waves follow circuit readiness and renewal dates, not geography ([Book 09, Chapter 11](../b09-network/11-field-office-wan-transformation.md#why-this-order)).

Out of scope, as in the worked case: air-gapped and separately accredited enclaves, which keep Configuration Manager and local distribution points.

## The five retirement gates {#retirement-gates}

The hub tier is the interim state, not a new floor. The last distribution point retires when five gates have closed, in whatever month that is; an open gate keeps the tier ([Book 09, Chapter 11](../b09-network/11-field-office-wan-transformation.md#when-to-retire-the-last-distribution-point) says why each one binds). The table adds the evidence that closes each gate.

| Gate | Closed when | Evidence that closes it |
|---|---|---|
| 1. App content | Client apps and Office Click-to-Run apps workloads on Intune for the whole validated population, **and** no required or available deployment still published from Configuration Manager | Workload slider state; a deployment report showing zero Configuration Manager app deployments. Switching the slider alone isn't enough: apps deployed from Configuration Manager stay in Software Center[^dpc-comanage] |
| 2. Update content | Windows Update policies and device configuration workloads on Intune, and Configuration Manager's software-update client setting off for those devices | Slider state; the client settings export; update compliance from Intune |
| 3. OS provisioning | Bare-metal imaging moved from task sequences to Windows Autopilot | No task sequence deployed; PXE off on every distribution point. OS deployment isn't a co-management workload, so the sliders don't cover it |
| 4. Caching role | No Connected Cache instance runs on distribution-point hardware, or none is needed | Cache host inventory; cache hit reports from the hubs |
| 5. Compliance evidence | Compliance and Endpoint Protection reporting no longer cite the Configuration Manager site database | The ISSO's confirmation that every control's evidence source has moved |

: The five retirement gates and their evidence {.striped .hover}

## The packaging follow-on {#packaging}

The app content gate closes only when the application catalog has moved, and that is packaging work. Most catalogs carry years of installers in different shapes: MSIs, vendor setup programs with their own switches, scripts. Each behaves differently in each tool. Standard packaging makes the move repeatable.

**What Microsoft requires.** A Win32 app deployed through Intune must install silently, without user interaction. It is prepared with the Microsoft Win32 Content Prep Tool, which converts the setup folder into an *.intunewin* file, and it can be up to 30 GB.[^dpc-win32-prep] Intune can also run a PowerShell script of up to 50 KB as the installer instead of a command line, with the script's return code deciding success.[^dpc-win32] When the client apps workload moves, apps already deployed from Configuration Manager stay available in Software Center, so the move has to withdraw those deployments, not only publish new ones.[^dpc-comanage][^dpc-comanage-faq]

**A standard wrapper** *(design guidance)*. Put every application that isn't a clean MSI into one wrapper, so it installs, logs, reports and uninstalls the same way from Configuration Manager or from Intune. PSAppDeployToolkit is a free, open-source PowerShell framework for this, licensed under the GNU Lesser General Public License; its project describes it as a way to "simplify and standardize deploying software to Windows, at scale," and says it supports Intune and Configuration Manager.[^dpc-psadt][^dpc-psadt-gh] It isn't a Microsoft product and isn't documented on Microsoft Learn; the agency's software approval process decides whether it is allowed.

The standard, in five rules:

1. **One template, version pinned.** The toolkit version, the folder layout, the log location and the exit codes are fixed in a template held under change control. The project published a 4.2 release candidate on October 1, 2026; pin a released version, not a candidate.[^dpc-psadt-gh]
2. **Signed scripts.** The packaging team signs the wrapper scripts with the agency's code-signing certificate, so execution policy doesn't have to be loosened.
3. **One package, two tools.** The same folder is a Configuration Manager application's content and, run through the Content Prep Tool, an Intune Win32 app. Both call the same silent command line.
4. **A detection rule for every app.** Each package carries a tested detection rule, so both tools report the same install state.
5. **Rationalize first.** Retire what nobody installs and remove duplicate versions before repackaging, then repackage by install count.

The [project plan](../../project-plans/content-delivery.md) schedules this as its own phase, with a gate before the client apps workload moves.

## Government cloud availability and the interim path {#gcc-availability}

| Capability | GCC (Moderate) | GCC High and DoD | Interim path |
|---|---|---|---|
| Intune, including Win32 apps and co-management | GCC tenants use the commercial Intune service[^dpc-intune-gov] | Separate government service; check its feature gaps[^dpc-intune-gov] | Keep the hub tier until each workload is available and moved |
| Delivery Optimization peering | A Windows component, configured by policy[^dpc-win32] | Same | Peer cache and BranchCache through Configuration Manager |
| Connected Cache for Enterprise and Education | Not listed as unavailable; only GCC High and DoD are[^dpc-intune-gov] | Listed as not available[^dpc-intune-gov] | The Configuration Manager–integrated cache on a hub distribution point (then gate 4 binds it), or no cache where circuits carry the load |
| PSAppDeployToolkit | Runs on the endpoint; no cloud dependency | Same | Intune's PowerShell script installer, or vendor installers |

: Availability read November 8, 2026, from the pages cited; GCC availability carried from [Book 09, Chapter 11](../b09-network/11-field-office-wan-transformation.md#connected-cache-at-the-hubs) {.striped .hover}

For a GCC tenant, the Azure resource that manages Connected Cache has to be placed in the boundary analysis before any cache goes into production ([Book 09, Chapter 11](../b09-network/11-field-office-wan-transformation.md#connected-cache-at-the-hubs)).

## Federal requirements, KSIs and evidence {#requirements}

Each step the [project plan](../../project-plans/content-delivery.md) schedules supports a requirement and produces evidence for it; the organization still sets the control parameters and procedures, and the assessor decides whether each control is satisfied. The table maps each step to NIST SP 800-53 Rev. 5 controls at Moderate, OMB M-22-09 where it applies, and the FedRAMP 20x Key Security Indicators whose related controls include them.[^dpc-53][^dpc-ksi] KSIs are indicators for cloud service providers: the agency authorizes its own system and lines its evidence up with what its providers report against them; it doesn't report KSIs itself ([Book 00, Appendix B](../b00-orientation/appendix-b-engagement-archetype.md)). Which record supports which indicator is the program's mapping *(design guidance)*, following [Book 13, Appendix A](../b13-governance/appendix-a-requirements-mapping.md) and [Book 14, Chapter 03](../b14-compliance/03-the-baseline-and-the-crosswalk.md).

| Step (plan phase) | Requirement | KSI | What the ISSO keeps |
|---|---|---|---|
| Validated endpoint count and distribution point inventory (Phase 0) | CM-8 (system component inventory); M-22-09's device goal, a complete inventory of every device operated for government use[^dpc-m2209] | KSI-PIY-GIV | The dated reconciliation export (Configuration Manager, Intune, asset record); the distribution point inventory; the completed worksheet, stored inside the boundary |
| Decision on the funding ask, target count and timing (Phases 0 and 1) | CM-3 (configuration change control: decisions documented and retained); SA-22 (unsupported system components) | KSI-CMT-LMC, KSI-CMT-RVP; KSI-SCR-MIT | The decision record with the decision table and worksheet attached; hardware support dates per distribution point |
| Hub distribution points built (Phase 2) | CM-2 (baseline configuration); CM-6 (configuration settings); CM-3 | KSI-CMT-RMV, KSI-MLA-EVC, KSI-SVC-ACM, KSI-CMT-LMC | The baseline per server, its scan result and deviations; change records; the SSP component entries |
| Hub distribution points kept current (Phase 2 onward) | RA-5 (vulnerability scanning); SI-2 (flaw remediation) | KSI-SCR-MON; KSI-CMT-VTD | Scan reports and patch compliance for every distribution point, for as long as any exists |
| HTTPS between clients and distribution points (Phase 2) | SC-8 (transmission confidentiality and integrity) | KSI-CNA-MAT, KSI-CNA-ULN, KSI-SVC-SIN | The distribution point HTTPS configuration and certificate record |
| Two distribution points per hub; content restorable from the source tier (Phase 2) | CP-10 (system recovery and reconstitution) | KSI-RPL-ABO, KSI-RPL-ARP, KSI-RPL-RRO, KSI-RPL-TRC | The hub pair design; a tested redistribution from the source distribution points |
| Boundary groups, peer cache and Delivery Optimization settings; branch peer ports (Phase 3) | CM-6; CM-7 (least functionality: only the ports peering needs, only where it's allowed) | KSI-CMT-LMC, KSI-MLA-EVC; KSI-CMT-RMV | Client settings and Intune policy exports; the CISO's port decision and the firewall rules that implement it; the pilot measurement report |
| Branch distribution points retired (Phase 4) | CM-8; MP-6 (media sanitization); SA-22 | KSI-PIY-GIV; MP-6 has none; KSI-SCR-MIT | Per server: the decommission change record, the sanitization record, and the closed inventory and SSP entries |
| Packaging standard (Phase 5) | CM-2; CM-3, including CM-3(2) (test, validate and document changes) | KSI-CMT-RMV, KSI-CMT-LMC, KSI-CMT-VTD | The template under version control; a test record per package from both tools; signing records |
| Content workloads moved to Intune (Phase 6) | CM-6; SI-2 (updates installed in a defined period); CA-7 (continuous monitoring) | KSI-CMT-LMC, KSI-CMT-VTD, KSI-MLA-EVC | Workload slider states; the deployment report showing Configuration Manager deployments withdrawn; update compliance from Intune |
| Connected Cache at the hubs (Phase 7) | CM-8; CM-6; the boundary disposition of its Azure resource | KSI-PIY-GIV; KSI-CMT-LMC | Cache host inventory and baseline; the boundary analysis entry |
| Last distribution point retired (Phase 8) | CM-8; MP-6; CA-7 | KSI-PIY-GIV; KSI-MLA-EVC | The five gates' evidence above; the final decommission and sanitization records; the SSP change |

: Requirements, KSIs and evidence by plan phase {.striped .hover}

CM-3 is in the Moderate baseline but not the Low ([Book 00, Appendix A](../b00-orientation/appendix-a-risk-register-and-traceability.md#milestone-to-control-family-traceability-pl-2)). The [federal framework crosswalk](../../reference/federal-framework-crosswalk.md) carries the wider mapping.

## The assessment worksheet {#worksheet}

The worksheet is a blank template, one row per question this guide asks: the funding ask, the endpoint count, the distribution point inventory, circuits, packaging, co-management workload states, the retirement gates and the decision. Each row says where the number comes from and who owns it.

**Download:** [dp-consolidation-worksheet.csv](files/dp-consolidation-worksheet.csv). Open it in Excel and save it as a workbook at work. Most of its numbers come straight out of the kit's read-only inventory and sizing runs ([implementation guide, Steps 0 and 1](dp-consolidation-implementation.md#step-0)); the rest come from people.

::: {.callout-warning}
## Agency data stays at work
Fill the worksheet inside your agency's environment, with your agency's tools, and store it where your agency keeps program records. Never put the filled worksheet, exports from your systems or your answers into this public repository, an issue or a pull request. The template is public; your numbers aren't.
:::

### Copilot prompts for filling it at work {#copilot-prompts}

Microsoft 365 Copilot Chat, signed in with your work account, can turn exports from your own systems into worksheet rows. Microsoft says Copilot is available in GCC and that prompts, responses and generated content stay in the government cloud,[^dpc-copilot-gov] and that prompts and responses get enterprise data protection.[^dpc-copilot-edp] Your agency's AI-use policy decides what you may paste or upload. Copilot drafts; check every number against its source before it goes in the worksheet.

1. **Endpoint count.** "I've attached three exports: Configuration Manager clients, Intune managed devices and our asset record. Match them on device name and serial number. Give me the count in each, the count in all three, and a list of devices in only one, with the likely reason (stale, duplicate, not enrolled)."
2. **Distribution point inventory.** "From the attached Configuration Manager distribution point report, make a table of every distribution point with its site, office, operating system version, whether PXE is enabled and its content library size. Count them by operating system version and flag any on a version older than Windows Server 2019."
3. **Sizing.** "Our validated endpoint count is [number]. Microsoft's limit is 4,000 clients per distribution point. How many distribution points do we need at the ceiling, and how many at 75% utilization? Show the arithmetic."
4. **Circuits.** "From the attached telecom contract export, list each office with its circuit bandwidth, monthly cost and renewal date. Sort by renewal date and group by quarter. Give the average monthly cost per office."
5. **Packaging.** "From the attached Configuration Manager application export, list every application with its deployment type, install count and active deployments. Mark applications with no installs in the last 12 months as candidates to retire, and duplicate versions of the same product."
6. **Retirement gates.** "Using the five retirement gates in this table [paste the table above], and the attached co-management workload settings and deployment report, tell me which gates are closed, which are open, and what evidence is missing for each."
7. **Decomposition.** "Here is the funding request [paste the narrative and figures]. Separate it into acquisition cost and recurring cost, and list every item that isn't distribution point hardware or software. Divide the total by the number of offices."

## Position statement for a briefing {#position-statement}

::: {.callout-tip}
## Position statement
Before the agency funds a refresh of a distribution point in every office, it should answer five questions: what the ask contains, how many distribution points it will need when co-management completes, what Microsoft's 4,000-clients-per-distribution-point limit says that number is, whether the hardware's depreciation outlasts its use, and what the office circuits allow. For an estate like the workbook's worked case, the answer is a small hub tier sized to the client count, peers in the offices and standard packaging, with the last distribution point retiring when five gates close, not on a date. Recommend deferring a per-office refresh until the assessment is complete.
:::

## The pieces of this guide {#pieces}

| Piece | Status |
|---|---|
| This guide, with its worksheet | Draft, held for review |
| [Implementation guide](dp-consolidation-implementation.md), with the [scripts kit](../../../downloads/dp-consolidation.zip), Lab 1 on fixtures and a Lab 2 outline | Draft, held for review |
| [Project plan: Content Delivery Modernization](../../project-plans/content-delivery.md) | Sample ready |
| Narrated deck series at the level of the guide's sections | In progress, on the [Presentations](../../presentations/index.md) page when published |
| Developer workbook (chapters built on the kit, each with a Lab 1 and a Lab 2) | Planned; the implementation guide's two labs come first |
| Training path | Planned |

: The pieces of the guide set, and the plan {.striped}

::: {.callout-tip}
## Back to the books
- [Distribution Point Consolidation: An Implementation Guide](dp-consolidation-implementation.md): the same work, step by step.
- [Book 09, Chapter 11 — Field Office WAN Transformation](../b09-network/11-field-office-wan-transformation.md): the worked case, cost model, roadmap, risks and assumptions.
- [Book 05 — Devices](../b05-devices/index.md): [Intune-first onboarding](../b05-devices/04-intune-first-onboarding.md) and the [GPO-to-Intune migration](../b05-devices/08-gpo-to-intune-policy-migration.md), which moves the co-management workloads.
- [Book 00, Chapter 06 — The Complementary Projects](../b00-orientation/06-the-project-portfolio.md#content-delivery-modernization): where this project sits in the portfolio.
- The [Content Delivery Modernization](../../project-plans/content-delivery.md), [Endpoint & Device Modernization](../../project-plans/endpoint-device.md) and [Network & Access Modernization](../../project-plans/network-access.md) plans.
:::

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

This guide has not been published in an edition yet. Each edition is kept, with its Word editions, decks and videos, on the [Archive](../../about/archive.md) page. Every change so far is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/guides/dp-consolidation.md).

<!-- revisions:end -->

[^dpc-dp-prereq]: Microsoft Learn, "Site and site system prerequisites for Configuration Manager," Distribution point (Remote Differential Compression; content transferred with BITS; IIS configuration), <https://learn.microsoft.com/intune/configmgr/core/plan-design/configs/site-and-site-system-prerequisites#distribution-point> (read November 8, 2026).
[^dpc-win32]: Microsoft Learn, "Win32 app management in Microsoft Intune," sections "Delivery optimization" (Win32 app content through Delivery Optimization, peer-to-peer on by default; Connected Cache on Configuration Manager distribution points) and "PowerShell script installer" (scripts up to 50 KB; return code decides status), <https://learn.microsoft.com/intune/app-management/deployment/win32> (read November 8, 2026).
[^dpc-win32-prep]: Microsoft Learn, "Prepare Win32 app content for upload" (Microsoft Win32 Content Prep Tool; `.intunewin` format; silent installation required; 30 GB per app), <https://learn.microsoft.com/intune/app-management/deployment/create-win32-package> (read November 8, 2026).
[^dpc-peercache]: Microsoft Learn, "Peer cache for Configuration Manager clients" (current boundary group only; no peers from a neighbor group; partial download in parts), <https://learn.microsoft.com/intune/configmgr/core/plan-design/hierarchy/client-peer-cache> (read November 8, 2026).
[^dpc-bg-options]: Microsoft Learn, "Boundary group options" (allow peer downloads; only peers within the same subnet; prefer distribution points over peers; prefer cloud-based sources), <https://learn.microsoft.com/intune/configmgr/core/servers/deploy/configure/boundary-group-options> (read November 8, 2026).
[^dpc-bg-dp]: Microsoft Learn, "Boundary groups and distribution points" (content location requests; fallback to neighbor and default site boundary groups; task sequence location priority), <https://learn.microsoft.com/intune/configmgr/core/servers/deploy/configure/boundary-groups-distribution-points> (read November 8, 2026).
[^dpc-sizescale]: Microsoft Learn, "Size and scale numbers for Configuration Manager" (4,000 clients per distribution point; 250 standard distribution points per site and 2,000 more as pull distribution points; 25,000 clients per management point; the real number depends on network speed and hardware), <https://learn.microsoft.com/intune/configmgr/core/plan-design/configs/size-and-scale-numbers> (accessed Oct 21, 2026; carried from Book 09, Chapter 11).
[^dpc-siteos]: Microsoft Learn, "Supported operating systems for Configuration Manager site system servers" (distribution point on Windows Server 2025, 2022 and 2019), <https://learn.microsoft.com/intune/configmgr/core/plan-design/configs/supported-operating-systems-for-site-system-servers> (read November 8, 2026).
[^dpc-mcc-ent]: Microsoft Learn, "Microsoft Connected Cache for Enterprise and Education overview," <https://learn.microsoft.com/windows/deployment/do/mcc-ent-edu-overview> (accessed Oct 21, 2026; carried from Book 09, Chapter 11).
[^dpc-mcc-prereq]: Microsoft Learn, "Microsoft Connected Cache for Enterprise and Education requirements" (Azure subscription; no other service on port 80; host operating systems; licensing), <https://learn.microsoft.com/windows/deployment/do/mcc-ent-prerequisites> (accessed Oct 21, 2026; carried from Book 09, Chapter 11).
[^dpc-mcc-cm]: Microsoft Learn, "Microsoft Connected Cache with Configuration Manager" (a distribution point with no other roles; content for workloads moved to Intune only; Win32 apps), <https://learn.microsoft.com/intune/configmgr/core/plan-design/hierarchy/microsoft-connected-cache> (accessed Oct 21, 2026; carried from Book 09, Chapter 11).
[^dpc-intune-gov]: Microsoft Learn, "Microsoft Intune for US Government GCC High and DoD service description" (GCC uses the commercial Intune instance; Connected Cache for Enterprise and Education not available in GCC High and DoD), <https://learn.microsoft.com/intune/fundamentals/government-service> (accessed Oct 21, 2026; carried from Book 09, Chapter 11).
[^dpc-comanage]: Microsoft Learn, "Co-management workloads," Client apps (apps deployed from Configuration Manager stay available in Software Center; Connected Cache serves Win32 apps to co-managed clients), <https://learn.microsoft.com/intune/configmgr/comanage/workloads> (read November 8, 2026).
[^dpc-comanage-faq]: Microsoft Learn, "Frequently asked questions about co-management," Workloads (after switching an app workload you can still deploy applications from Configuration Manager), <https://learn.microsoft.com/intune/configmgr/comanage/faq> (read November 8, 2026).
[^dpc-psadt]: PSAppDeployToolkit project, home page ("A PowerShell-based framework to simplify and standardize deploying software to Windows, at scale"; support for Intune and ConfigMgr), <https://psappdeploytoolkit.com/> (read November 8, 2026). Not a Microsoft Learn source.
[^dpc-psadt-gh]: PSAppDeployToolkit, GitHub repository (GNU Lesser General Public License v3.0; release notes for v4.2 RC2, October 1, 2026), <https://github.com/PSAppDeployToolkit/PSAppDeployToolkit> (read November 8, 2026). Not a Microsoft Learn source.
[^dpc-53]: National Institute of Standards and Technology, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, controls CM-2, CM-3, CM-6, CM-7, CM-8, CP-10, MP-6, RA-5, SA-22, SC-8, SI-2 and CA-7, <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>; control statements read from NIST's OSCAL Rev. 5 catalog, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5> (accessed Oct 21, 2026; carried from Book 00, Appendix A, and Book 13, Appendix A).
[^dpc-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026*, indicator statements and "Related SP 800-53 Controls" (SA-22 cited by KSI-SCR-MIT; MP-6 cited by none), <https://www.fedramp.gov/2026/reference/key-security-indicators/> (read November 8, 2026).
[^dpc-m2209]: Office of Management and Budget, M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022, devices goal, <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf> (accessed Oct 20, 2026; carried from Book 01).
[^dpc-copilot-gov]: Microsoft Learn, "Understand Microsoft U.S. government cloud environments for Microsoft 365 and Microsoft Copilot" (available in GCC, GCC High and DoD; prompts, responses and generated content remain in the government cloud), <https://learn.microsoft.com/microsoft-365/copilot/gov-overview> (read November 2, 2026; carried from the Ticket-to-Machine task catalog guide).
[^dpc-copilot-edp]: Microsoft Learn, "Enterprise data protection in Microsoft Copilot and Microsoft Copilot Chat," <https://learn.microsoft.com/microsoft-365/copilot/enterprise-data-protection> (read November 2, 2026; carried from the Ticket-to-Machine task catalog guide).
