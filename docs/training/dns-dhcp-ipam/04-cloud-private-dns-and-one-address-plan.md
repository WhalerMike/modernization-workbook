---
title: "Module 4: Cloud private DNS and one address plan"
description: "Book 08, Chapter 07 and Book 10, Chapter 06: how Azure, AWS and Oracle Cloud each run private DNS and take queries from outside, why an on-premises forwarder decides whether a private endpoint gets its private answer, and why the enterprise IPAM must stay the authority for every network's addresses. Lab 1 runs the Start Kit's Test-FMPAddressPlan on a fictional IPAM export, the domain's DHCP scopes and Azure, AWS and OCI CLI exports, and finds an overlap, a network outside the plan and the forwarders' targets; Lab 2 runs it on your own test subscription, account and tenancy. About 55 minutes, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Books 08, 10"
series-order: 4
review-status: pending
---
# Module 4: Cloud private DNS and one address plan {.unnumbered}

*Part of the [DNS, DHCP and IPAM learning path](index.md). Book 08, [Chapter 07](../../books/b08-ddi/07-cloud-private-endpoints-and-ipam.md), and Book 10, [Chapter 06](../../books/b10-cloud-boundary/06-ipam-and-network-as-code.md). About 55 minutes.*

## Introduction (3 minutes) {#ddi-m4-introduction}

Each cloud runs its own private DNS and its own address management, and none was built to share either with the others. So a name can resolve to a private endpoint from one place and to its public address from another, and a cloud team can create a network whose addresses another cloud, or a branch office, already uses. Neither shows up until something fails to connect.

In this module you see how Azure, AWS and Oracle Cloud each take part in name resolution and address allocation, and you check one estate's networks, on premises and in all three clouds, against the enterprise IPAM's plan. In Lab 2 you check your own test subscription, account and tenancy the same way.

**The federal requirement.** The address plan is the join key for the inventory, and Book 10 makes it the number BOD 23-01's asset discovery depends on: "the entire IPv4 space used by the agency".

| Requirement | KSI | Evidence |
|---|---|---|
| CM-8: an inventory that accurately reflects the system, without duplication | KSI-PIY-GIV | `AddressPlan.csv`: every network with the allocation that holds it, dated |
| CISA BOD 23-01: automated discovery covering the agency's whole IPv4 space | None in the workbook's verified pairings | The plan's allocations, and the networks outside them |
| SC-22: fault-tolerant name resolution across the platforms | None in the workbook's verified pairings | Each conditional forwarder's target, and the network that holds it |
| OMB M-21-07: IPv6 | None in the workbook's verified pairings | The IPv6 allocations and the networks that use them |

KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its own evidence up with them. The steps *support* these controls; the assessor decides whether each is satisfied.

## Learning objectives (1 minute) {#ddi-m4-objectives}

After this module, you'll be able to:

- name each platform's private namespace, its entry point for queries from outside and its way of forwarding out, for Azure, AWS and Oracle Cloud;
- explain why an on-premises client gets a private endpoint's private answer only through a forwarder to a resolver in a linked network;
- explain why the enterprise IPAM stays the authority, which clouds can hand allocation to it and which can only mirror it;
- check every network against the plan, and read an overlap, a network in the wrong allocation and one outside the plan.

## Prerequisites (1 minute) {#ddi-m4-prerequisites}

- [Module 2](02-the-active-directory-dns-departure.md): the `blob.core.windows.net` forwarder in its register.
- Windows PowerShell 5.1 or PowerShell 7, and the Start Kit's folder `examples/start-kit`.

## Unit 1: Private DNS on each platform (10 minutes) {#ddi-m4-unit-1}

Read Book 08, [Chapter 07, How each platform implements private DNS](../../books/b08-ddi/07-cloud-private-endpoints-and-ipam.md#how-each-platform-implements-private-dns), its first table and the bullets under *What this means for the agency's estate*. For the three clouds this path's estate uses:

| Platform | Private namespace | Queries from outside come in at | Forwarding out |
|---|---|---|---|
| Azure | Private DNS zones, resolvable only from linked virtual networks | DNS Private Resolver inbound endpoint | Outbound endpoint and forwarding rulesets |
| AWS | Route 53 private hosted zones, answered by the VPC Resolver | VPC Resolver inbound endpoint | Outbound endpoint and Resolver rules |
| Oracle Cloud | Private zones in private views, answered by each VCN's resolver | A listening endpoint on the VCN resolver | A forwarding endpoint and resolver rules |

: Private DNS in the three clouds, from Book 08's Chapter 07 {.striped .hover}

Two of the chapter's points matter most for this estate. AWS GovCloud (US) and AWS's commercial Regions are separate partitions, so each needs its own resolver configuration, written from the same policy plane. And an Oracle Fusion Applications environment gives the agency no VCN: private access to it needs a VCN in the agency's own tenancy, and then its resolver is one more private resolver to forward to.

## Unit 2: The forwarder decides the answer (8 minutes) {#ddi-m4-unit-2}

Read [Chapter 07, Azure DNS and private endpoints](../../books/b08-ddi/07-cloud-private-endpoints-and-ipam.md#azure-dns-and-private-endpoints). A private endpoint's name resolves to its private address only from a resolver inside a virtual network linked to its private zone. An on-premises client asks the agency's resolvers, so they forward the service's public zone, such as `blob.core.windows.net`, to the Private Resolver's inbound endpoint. Without that forwarder the client gets the public answer, which is a valid answer, and the connection fails or goes the long way: Module 1's split-brain.

That forwarder only works if its target is reachable: an address inside a network the agency routes to, not one in a range another network also uses. Lab 1 checks where each forwarder's target sits. How Private Link zones are linked, and the checks in Azure itself, are [Azure Security Engineering, Module 4](../azure-security/04-private-link-dns-and-key-vault.md)'s subject; this module doesn't repeat them.

## Unit 3: One address plan (8 minutes) {#ddi-m4-unit-3}

Read [Chapter 07, SDN–IPAM consistency across cloud providers and VMware](../../books/b08-ddi/07-cloud-private-endpoints-and-ipam.md#sdnipam-consistency-across-cloud-providers-and-vmware), then Book 10, [Chapter 06](../../books/b10-cloud-boundary/06-ipam-and-network-as-code.md)'s opening sections. The rule: the enterprise IPAM is the authority for address blocks everywhere, and a block is reserved there before a network is created in any cloud. How each platform follows it differs:

- **AWS** can hand a private scope's allocation to an external IPAM, but not in AWS GovCloud (US), where most of this estate's AWS workloads run.
- **Azure** can't hand it over: Virtual Network Manager's IPAM pools mirror the enterprise reservations as static CIDRs, and the agency reconciles.
- **Oracle Cloud** and the rest: reserve first, then discover and reconcile.

So in most of this estate the plan is kept by discipline and checked by reconciliation. The Start Kit's `Test-FMPAddressPlan` is that reconciliation: it reads the plan (an IPAM export with each allocation's prefix, name and use) and the networks that exist (the DHCP scopes of a run, and the JSON each cloud's CLI prints), and reports networks outside the plan, networks inside another platform's allocation, and every pair of networks that overlap. It reads IPv4 and IPv6.

## Exercise: Lab 1, fixtures, no subscription (20 minutes) {#ddi-m4-lab-1}

You check a fictional estate's networks against its address plan. Work in `examples/start-kit`, in Windows PowerShell 5.1 or PowerShell 7. The plan is `tests/fixtures/ddi/ipam/ipam-allocations.csv`; beside it are the JSON that `az network vnet list`, `aws ec2 describe-vpcs` and `oci network vcn list` print, for four Azure virtual networks, two AWS GovCloud (US) VPCs and two OCI VCNs; the DHCP scopes and forwarders are Module 1's run.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/start-kit`. Each step below says what it does and what to look for.

```powershell
# Step 1: Read the plan
Import-Csv tests/fixtures/ddi/ipam/ipam-allocations.csv | Format-Table Prefix, Name, Use

# Step 2: Check every network against it
Import-Module ./powershell/FMPDdiReadiness/FMPDdiReadiness.psd1
$plan = Test-FMPAddressPlan -IpamPath tests/fixtures/ddi/ipam/ipam-allocations.csv -Path tests/fixtures/ddi/run-2026-11-20/contoso.example -AzureVnetPath tests/fixtures/ddi/ipam/azure-vnets.json -AwsVpcPath tests/fixtures/ddi/ipam/aws-vpcs.json -OciVcnPath tests/fixtures/ddi/ipam/oci-vcns.json
$plan.Networks | Format-Table Platform, Name, Prefix, Use

# Step 3: Read the findings
$plan.Findings | ForEach-Object { '{0,-16} {1,-22} {2,-13} {3}' -f $_.Check, $_.Network, $_.Prefix, $_.Finding }

# Step 4: See where each forwarder's target sits
$plan.ForwarderTargets | Format-Table Zone, Target, Network

# Step 5: Write the plan and its findings, as the evidence for this check
$null = Test-FMPAddressPlan -IpamPath tests/fixtures/ddi/ipam/ipam-allocations.csv -Path tests/fixtures/ddi/run-2026-11-20/contoso.example -AzureVnetPath tests/fixtures/ddi/ipam/azure-vnets.json -AwsVpcPath tests/fixtures/ddi/ipam/aws-vpcs.json -OciVcnPath tests/fixtures/ddi/ipam/oci-vcns.json -OutputPath out
Get-ChildItem -File out/address-plan | Select-Object Name, @{ n = 'Rows'; e = { @(Import-Csv $_.FullName).Count } }

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Read the plan.**

    ```powershell
    Import-Csv tests/fixtures/ddi/ipam/ipam-allocations.csv | Format-Table Prefix, Name, Use
    ```

    Expected output:

    ```text
    Prefix              Name                   Use
    ------              ----                   ---
    10.0.0.0/16         Headquarters           On-premises
    10.1.0.0/16         Branch offices         On-premises
    10.2.0.0/16         Azure hubs and spokes  Azure
    10.3.0.0/16         AWS GovCloud (US) VPCs AWS
    10.4.0.0/16         OCI VCNs               OCI
    172.16.0.0/16       Legacy lab             On-premises
    fd12:3456:789a::/48 Azure IPv6             Azure
    ```

    One block per platform, and one IPv6 block for Azure. Every network should sit in its own platform's block.

2. **Check every network against it.**

    ```powershell
    Import-Module ./powershell/FMPDdiReadiness/FMPDdiReadiness.psd1
    $plan = Test-FMPAddressPlan -IpamPath tests/fixtures/ddi/ipam/ipam-allocations.csv -Path tests/fixtures/ddi/run-2026-11-20/contoso.example -AzureVnetPath tests/fixtures/ddi/ipam/azure-vnets.json -AwsVpcPath tests/fixtures/ddi/ipam/aws-vpcs.json -OciVcnPath tests/fixtures/ddi/ipam/oci-vcns.json
    $plan.Networks | Format-Table Platform, Name, Prefix, Use
    ```

    Expected output:

    ```text
    Platform    Name                      Prefix                Use
    --------    ----                      ------                ---
    AWS         vpc-hr-integration        10.3.16.0/20          AWS
    AWS         vpc-hr-integration        100.64.0.0/22
    AWS         vpc-shared-services       10.3.0.0/20           AWS
    Azure       vnet-app-01               10.2.16.0/24          Azure
    Azure       vnet-app-02               10.1.5.0/24           On-premises
    Azure       vnet-hub-eastus           10.2.0.0/22           Azure
    Azure       vnet-hub-eastus           fd12:3456:789a:1::/64 Azure
    Azure       vnet-hub-westus2          10.2.4.0/22           Azure
    OCI         vcn-fusion-access         10.4.0.0/24           OCI
    OCI         vcn-test                  10.2.16.0/24          Azure
    On-premises DHCP scope Branch clients 10.1.5.0/24           On-premises
    On-premises DHCP scope Branch guest   10.1.7.0/24           On-premises
    On-premises DHCP scope HQ clients     10.0.5.0/24           On-premises
    On-premises DHCP scope HQ printers    10.0.6.0/24           On-premises
    ```

    Fourteen networks: eight in the clouds, one with a second IPv4 block and one with an IPv6 prefix, and the four DHCP scopes (the branch scope two servers share counts once). `Use` is the use of the allocation that holds each one; three don't match their own platform, and one has none.

3. **Read the findings.**

    ```powershell
    $plan.Findings | ForEach-Object { '{0,-16} {1,-22} {2,-13} {3}' -f $_.Check, $_.Network, $_.Prefix, $_.Finding }
    ```

    Expected output:

    ```text
    Outside the plan AWS vpc-hr-integration 100.64.0.0/22 No IPAM allocation contains it
    Wrong allocation Azure vnet-app-02      10.1.5.0/24   Inside 10.1.0.0/16, allocated to On-premises (Branch offices)
    Wrong allocation OCI vcn-test           10.2.16.0/24  Inside 10.2.0.0/16, allocated to Azure (Azure hubs and spokes)
    Overlap          Azure vnet-app-01      10.2.16.0/24  Overlaps OCI vcn-test, 10.2.16.0/24
    Overlap          Azure vnet-app-02      10.1.5.0/24   Overlaps On-premises DHCP scope Branch clients, 10.1.5.0/24
    ```

    Each is the failure Chapter 07 describes. Someone numbered `vnet-app-02` from the branch range, so once the branch and Azure are connected, traffic for half of one goes to the other. An OCI test network reuses an Azure spoke's block, which is harmless until the two are peered through the agency's network. And an AWS VPC has a second block nobody reserved, so discovery that sweeps "the agency's IPv4 space" from the plan never looks there.

4. **See where each forwarder's target sits.**

    ```powershell
    $plan.ForwarderTargets | Format-Table Zone, Target, Network
    ```

    Expected output:

    ```text
    Zone                  Target        Network
    ----                  ------        -------
    partner.example       192.0.2.53    Outside the address plan
    oldvendor.example     198.51.100.53 Outside the address plan
    blob.core.windows.net 10.2.4.4      Azure vnet-hub-westus2
    hr.contoso.example    10.20.0.10    Outside the address plan
    ```

    The Azure Storage forwarder's target is in the second region's hub, where Chapter 07 puts the Private Resolver's inbound endpoint: that is the path on-premises clients take to a private endpoint's answer. The two partner forwarders point outside the agency, as partners do. But the stub zone for `hr.contoso.example` points at `10.20.0.10`, which no allocation holds: a target nobody reserved, and a question for the team that owns the HR platform's DNS.

5. **Write the plan and its findings, as the evidence for this check.**

    ```powershell
    $null = Test-FMPAddressPlan -IpamPath tests/fixtures/ddi/ipam/ipam-allocations.csv -Path tests/fixtures/ddi/run-2026-11-20/contoso.example -AzureVnetPath tests/fixtures/ddi/ipam/azure-vnets.json -AwsVpcPath tests/fixtures/ddi/ipam/aws-vpcs.json -OciVcnPath tests/fixtures/ddi/ipam/oci-vcns.json -OutputPath out
    Get-ChildItem -File out/address-plan | Select-Object Name, @{ n = 'Rows'; e = { @(Import-Csv $_.FullName).Count } }
    ```

    Expected output:

    ```text
    Name                    Rows
    ----                    ----
    AddressPlan.csv           14
    AddressPlanFindings.csv    5
    ```

Clean up:

```powershell
Remove-Item -Recurse -Force out
```

## Exercise: Lab 2, your test subscription, account and tenancy (30 minutes) {#ddi-m4-lab-2}

You export the networks of your own test environments with each cloud's CLI and check them against a plan you write. You need any of: an Azure test subscription (commercial Azure, as this estate uses) with the Azure CLI signed in; an AWS GovCloud (US) account that isn't production with the AWS CLI configured for it; an OCI tenancy that isn't production with the OCI CLI configured for it. Run the steps for the ones you have and leave the others' parameters out of step 5. The CLI commands only read. Work in PowerShell 7 on your laptop, in `examples/start-kit`, with the test domain's run from [Module 3](03-dhcp-encrypted-dns-and-the-edge.md)'s Lab 2 copied to `C:\fmp-lab\run2` if you have it. *The authors didn't run these steps.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
# Step 1: Export the Azure virtual networks
New-Item -ItemType Directory -Force C:\fmp-lab\plan | Out-Null
az network vnet list --output json | Out-File -Encoding utf8 C:\fmp-lab\plan\azure-vnets.json

# Step 2: Export the AWS GovCloud (US) VPCs
aws ec2 describe-vpcs --region us-gov-west-1 --output json | Out-File -Encoding utf8 C:\fmp-lab\plan\aws-vpcs.json

# Step 3: Export the OCI VCNs
oci network vcn list --compartment-id <compartment-ocid> --all | Out-File -Encoding utf8 C:\fmp-lab\plan\oci-vcns.json

# Step 4: Write your plan
@'
Prefix,Name,Use
10.50.0.0/16,Lab domain,On-premises
<azure-prefix>,Azure test,Azure
<aws-prefix>,AWS GovCloud (US) test,AWS
<oci-prefix>,OCI test,OCI
'@ | Set-Content -Encoding utf8 C:\fmp-lab\plan\ipam.csv

# Step 5: Check your networks against it
Import-Module ./powershell/FMPDdiReadiness/FMPDdiReadiness.psd1
$plan = Test-FMPAddressPlan -IpamPath C:\fmp-lab\plan\ipam.csv -Path C:\fmp-lab\run2\lab.contoso.example -AzureVnetPath C:\fmp-lab\plan\azure-vnets.json -AwsVpcPath C:\fmp-lab\plan\aws-vpcs.json -OciVcnPath C:\fmp-lab\plan\oci-vcns.json -OutputPath C:\fmp-lab\plan\out
$plan.Networks | Format-Table Platform, Name, Prefix, Use
$plan.Findings | Format-Table Check, Network, Prefix, Finding -Wrap

# After the steps
Remove-Item -Recurse -Force C:\fmp-lab\plan
```

:::

<!-- labs:end -->

Values you supply:

| Placeholder | What it is |
|---|---|
| `<compartment-ocid>` | The OCID of the OCI compartment that holds your test VCNs |
| `<azure-prefix>`, `<aws-prefix>`, `<oci-prefix>` | The block your plan reserves for each cloud's test networks, such as `10.60.0.0/16` |

1. **Export the Azure virtual networks.**

    ```powershell
    New-Item -ItemType Directory -Force C:\fmp-lab\plan | Out-Null
    az network vnet list --output json | Out-File -Encoding utf8 C:\fmp-lab\plan\azure-vnets.json
    ```

2. **Export the AWS GovCloud (US) VPCs.**

    ```powershell
    aws ec2 describe-vpcs --region us-gov-west-1 --output json | Out-File -Encoding utf8 C:\fmp-lab\plan\aws-vpcs.json
    ```

3. **Export the OCI VCNs.**

    ```powershell
    oci network vcn list --compartment-id <compartment-ocid> --all | Out-File -Encoding utf8 C:\fmp-lab\plan\oci-vcns.json
    ```

4. **Write your plan.** One line per block you reserve; keep the test domain's `10.50.0.0/16` as on-premises.

    ```powershell
    @'
    Prefix,Name,Use
    10.50.0.0/16,Lab domain,On-premises
    <azure-prefix>,Azure test,Azure
    <aws-prefix>,AWS GovCloud (US) test,AWS
    <oci-prefix>,OCI test,OCI
    '@ | Set-Content -Encoding utf8 C:\fmp-lab\plan\ipam.csv
    ```

5. **Check your networks against it.**

    ```powershell
    Import-Module ./powershell/FMPDdiReadiness/FMPDdiReadiness.psd1
    $plan = Test-FMPAddressPlan -IpamPath C:\fmp-lab\plan\ipam.csv -Path C:\fmp-lab\run2\lab.contoso.example -AzureVnetPath C:\fmp-lab\plan\azure-vnets.json -AwsVpcPath C:\fmp-lab\plan\aws-vpcs.json -OciVcnPath C:\fmp-lab\plan\oci-vcns.json -OutputPath C:\fmp-lab\plan\out
    $plan.Networks | Format-Table Platform, Name, Prefix, Use
    $plan.Findings | Format-Table Check, Network, Prefix, Finding -Wrap
    ```

    Expected result: every network you exported, with the allocation that holds it. A default VPC (`172.31.0.0/16` in every AWS Region unless someone deleted it) and any network created before you wrote the plan show as outside it: in a test account, that is the plan, not the network, to fix. If a cloud's networks are missing, open its JSON: an empty list means the CLI read a different subscription, Region or compartment.

**Back it out.** Nothing was created in any cloud. Delete the exports:

```powershell
Remove-Item -Recurse -Force C:\fmp-lab\plan
```

## Knowledge check (5 minutes) {#ddi-m4-check}

1. An on-premises client resolves a storage account that has a private endpoint and gets the public address. What is most likely missing?
    a. The private endpoint itself.
    b. A forwarder on the agency's resolvers for the service's public zone, such as `blob.core.windows.net`, to the Private Resolver's inbound endpoint, so the query reaches a resolver in a network linked to the private zone.
    c. A public DNS record.

2. Why can't the agency hand AWS address allocation to the enterprise IPAM for most of this estate?
    a. Because AWS has no IPAM.
    b. Because the external IPAM integration isn't available in AWS GovCloud (US), where most of the estate's AWS workloads run, so reservations are mirrored and reconciled instead.
    c. Because the IPAM can't hold IPv6.

3. Lab 1 found an OCI test VCN using the same block as an Azure spoke. Why is that a finding while neither network is broken?
    a. It isn't one.
    b. Because the overlap breaks routing and private answers the moment the two are connected through the agency's network, and the plan is meant to prevent it before then.
    c. Because OCI doesn't allow `10.2.0.0/16`.

4. What makes a network "outside the plan" matter for BOD 23-01?
    a. The directive's discovery has to cover the agency's whole IPv4 space, and that space is what the plan says it is: an unreserved block is a block discovery never sweeps.
    b. The directive forbids private address space.
    c. Nothing: BOD 23-01 is about vulnerabilities only.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See Unit 2 and [Chapter 07](../../books/b08-ddi/07-cloud-private-endpoints-and-ipam.md#azure-dns-and-private-endpoints).
2. **b.** See Unit 3 and [Chapter 07, AWS VPC IPAM integration](../../books/b08-ddi/07-cloud-private-endpoints-and-ipam.md#aws-vpc-ipam-integration).
3. **b.** See Unit 3 and Lab 1, step 3.
4. **a.** See the introduction and [Book 10, Chapter 06](../../books/b10-cloud-boundary/06-ipam-and-network-as-code.md).
:::

## Summary (2 minutes) {#ddi-m4-summary}

You saw how Azure, AWS and Oracle Cloud each run private DNS and take queries from outside, why the forwarder to a resolver in a linked network decides a private endpoint's answer, and why the enterprise IPAM stays the authority while most of the clouds can only mirror it; then you checked an estate's networks against its plan and found an overlap, two networks in the wrong allocation, one outside the plan and a forwarder target nobody reserved. **Evidence an ISSO keeps from this module:** `AddressPlan.csv` and `AddressPlanFindings.csv`, with the dated IPAM export and cloud exports they were built from.

::: {.callout-tip}
## Continue the path
[Learning path](index.md) · [← Module 3, DHCP, encrypted DNS and the edge](03-dhcp-encrypted-dns-and-the-edge.md)
:::
