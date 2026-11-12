---
title: "Chapter 05 — The Landing Zone"
description: "What a cloud landing zone is, how management groups, subscriptions and Azure Policy turn the authorization boundary into enforceable structure, the AWS equivalent, and what a landing zone can and can't prove."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b10-cloud-boundary
book: B10
part: What
series-order: 5
status: baseline
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Chapter 05 — The Landing Zone

*The boundary stops being a diagram in the authorization package when it becomes a hierarchy, a set of subscriptions and a policy that says no.*

::: {.callout-note}
## In this chapter
What a landing zone is in Microsoft's current terms, and the substrate it depends on. How the management group hierarchy and subscriptions are organized, and how each boundary decision (which cloud, which regions, which services, which settings, which exceptions) becomes a specific policy at a specific scope. How the same pattern looks on AWS, including the differences in AWS GovCloud (US). How internet-facing workloads are selected and governed: Front Door, Application Gateway, WAF rules and rate limits, DDoS Protection tiers, Private Link, Azure Firewall and public IP policy, with the AWS, Google Cloud and Oracle Cloud equivalents, and the inventory and exercise that evidence them. Why every piece of automation that touches the cloud has to declare its boundary, and what a landing zone can't prove on its own.
:::

The earlier chapters argued that the authorization boundary, not the product catalog, decides what an agency can use. That argument stays abstract until something enforces it. The landing zone is the first place that happens: it's the pre-built environment every workload lands in, and its structure decides what a workload team can deploy, where, and with which settings, before anyone writes an application. If the boundary says a service is out of scope and the landing zone lets a team deploy it anyway, the boundary is a document, not a control.

![The baseline management group hierarchy, with boundary policy assigned near the top and inherited by every subscription below.](../../images/diagrams/b10-cloud-boundary/svg/ch05-management-groups.svg){#fig-ch05-management-groups fig-alt="A tenant root group at the top has one child, an intermediate root management group named with the agency's prefix, marked as the scope where boundary policy is assigned: allowed locations, allowed resource types and the FedRAMP regulatory compliance initiative. Four management groups sit beneath it. Platform, in blue, holds Security, Management, Connectivity and Identity, each with a dedicated subscription. Landing zones, in blue, holds Corp for workloads connected to the hub, Online for internet-facing workloads and Local for Azure Local clusters, each holding workload subscriptions. Sandbox, in amber, has looser policy and no connection to corporate networks, and is the default group for new subscriptions. Decommissioned, in slate, holds cancelled subscriptions until deletion. A violet note says policy assigned at a management group is inherited by every subscription beneath it, and only resources in subscriptions and resource groups are evaluated."}

## What a landing zone is

Microsoft's Cloud Adoption Framework defines an Azure landing zone as an architecture "for governing, securing, and scaling a multi-subscription Azure environment," made of two parts: a **platform landing zone**, the centralized foundation of governance, security and shared resources, and **workload landing zones**, where workload teams deploy within the platform's guardrails. Microsoft recommends one platform landing zone per Microsoft Entra tenant, and the platform needs a repeatable way to hand workload landing zones to teams.[^c05-alz] In Microsoft's terms, a landing zone is an individual Azure subscription.[^c05-faq]

Before building, Microsoft asks for decisions in eight design areas: Azure billing and Microsoft Entra tenant, identity and access management, resource organization, network topology and connectivity, security, management, governance, and platform automation and DevOps.[^c05-design-areas] For a federal agency, every one of those areas has a boundary dimension. Resource organization decides where boundary policy is assigned; network topology decides how traffic reaches the agency's enforcement points ([Book 09](../b09-network/index.md)); governance decides how the boundary is audited and enforced; platform automation decides whether the whole thing can be rebuilt from reviewed source ([Chapter 06](06-ipam-and-network-as-code.md)).

Microsoft publishes accelerators that deploy the platform landing zone from infrastructure as code (Bicep or Terraform, built on Azure Verified Modules), and recommends them over portal deployment.[^c05-impl] For an agency in **Azure Government** there's a catch that's easy to miss: Microsoft's portal, Bicep and Terraform deployment options are supported only for the public Azure cloud. The architecture is valid in every Azure cloud, but in Azure Government the platform team has to adapt the code by hand: remove policies that don't exist in that cloud, adjust API versions, and remove resources that aren't available.[^c05-deploy] That's the boundary's first appearance in the build: the commercial accelerator doesn't run unmodified in the government cloud.

## The substrate beneath it

A landing zone sits on top of four things that have to exist and be authoritative first. The Federal Modernization Program's design position, from Federal Compliance [Volume I](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_I_Book_00_Foundation_Transport_Overview.md), is that a control can't be scanned, an identity authorized or a package assembled until these planes are in place:

| Plane | What it provides | Where the workbook covers it |
|---|---|---|
| Naming and addressing | DNS, DHCP, IP address management and certificate issuance, as one authoritative record | [Book 08](../b08-ddi/index.md); this book's [Chapter 06](06-ipam-and-network-as-code.md) |
| Device and cryptographic identity | What's connected, and the certificates and keys that prove it | [Book 07](../b07-pki/index.md), [Book 09, Chapter 07](../b09-network/07-network-access-control.md) |
| Organizational identity | The human and organizational source of truth every account and access decision asserts | [Book 03](../b03-hr-identity/index.md), [Book 02](../b02-identity/index.md) |
| Governed transport | Encrypted, policy-enforced paths between sites and clouds | [Book 09](../b09-network/index.md) |

The landing zone consumes all four. Its subscriptions draw address space from the addressing plane, its administrators sign in through the identity plane, and its hub connects to the transport plane. The order matters: a landing zone built before the address plan exists will invent address space that the agency later has to reconcile.

## The management group hierarchy

Management groups organize subscriptions so that policy and access can be applied once and inherited. Microsoft's baseline hierarchy puts an **intermediate root** directly under the tenant root group, so the agency never has to assign anything at the tenant root itself, and divides everything beneath it into platform and workload groups:[^c05-mg]

| Management group | Holds | Boundary role |
|---|---|---|
| Intermediate root | Every group below; named with the organization's prefix | Where agency-wide boundary policy is assigned |
| Platform: Security | A subscription for SIEM tooling (Microsoft Sentinel, syslog collectors) | Logging and monitoring infrastructure |
| Platform: Management | A subscription for monitoring (Azure Monitor Logs workspace) | Operational evidence |
| Platform: Connectivity | Hub networking: Azure Firewall, gateways, Azure DNS private zones | The enforcement path to the agency edge |
| Platform: Identity | AD DS or Microsoft Entra Domain Services virtual machines | Hardened identity services |
| Landing zones: Corp | Workloads that connect to the corporate network through the hub | Private, hub-routed workloads |
| Landing zones: Online | Workloads that need direct internet connectivity or no virtual network | Internet-facing workloads, with stricter ingress policy |
| Landing zones: Local | Azure Local clusters and their workloads | Hybrid workloads with different policy needs |
| Sandbox | Isolated experimentation, with less restrictive policy | Outside the production boundary by design |
| Decommissioned | Cancelled landing zones, deleted after 30 to 60 days | Retirement path |

Microsoft's recommendations for the hierarchy carry directly into a federal design:[^c05-mg]

- **Keep it flat**: three to four levels at most. A tree can be six levels deep, not counting the tenant root or the subscription level, but depth multiplies inherited-policy debugging.
- **Don't mirror the org chart.** Management groups are for policy assignment, not billing or RBAC. Use tags for horizontal navigation.
- **Don't create management groups for production, test and development.** Separate environments by subscription within the same group, so a test subscription faces the same boundary policy as production.
- **Don't assign workload teams permissions at management group scope.** Assign them at the subscription or resource group the team needs, normally during subscription vending ([Chapter 07](07-the-front-door.md)). Platform-team access at management group scope should be eligible through Privileged Identity Management, not standing ([Book 04, Chapter 04](../b04-access/04-privileged-roles-and-tiers.md) places these roles in the tier model).
- **Protect the hierarchy.** By default any principal in the tenant can create management groups, and new subscriptions land under the tenant root. Turn on RBAC authorization for management group operations and set a default management group (Sandbox is a good candidate) so no subscription arrives under the root, outside the boundary policy.
- **Limit assignments at the root.** Assign broadly only what genuinely applies to everything.

Subscriptions are the unit of management and scale. Microsoft calls this "subscription democratization": workloads get their own subscriptions, rather than sharing a few large ones divided by resource group.[^c05-vending] For the boundary, that matters because a subscription's placement in the hierarchy is what decides which boundary policy applies to it. Moving a subscription is a boundary change.

## Where each boundary decision lands

The authorization package says what's in the boundary. The landing zone has to say the same thing in a form that Azure Resource Manager enforces. Each decision has a mechanism and a scope. The security baseline that sits on top of these boundary policies (protecting the hierarchy, the Microsoft cloud security benchmark and FedRAMP initiatives in audit, platform diagnostic logs and Defender for Cloud) is built, with its commands, in [Step 1 of the Azure Security Engineering implementation guide](../guides/azure-security-implementation.md#step-1-landing-zone-security-baseline).

![Five boundary decisions and the landing-zone mechanism that enforces each.](../../images/diagrams/b10-cloud-boundary/svg/ch05-boundary-to-policy.svg){#fig-ch05-boundary-to-policy fig-alt="On the left, a slate card for the authorization boundary as written in the package. Five arrows lead to five mechanism cards. Which cloud leads to a blue card: the tenant and subscription choice, Azure commercial or Azure Government, both FedRAMP High. Which regions leads to a green card: the Allowed locations policy with deny at the intermediate root. Which services leads to a green card: Allowed resource types or Not allowed resource types with deny, checked against Microsoft's audit-scope list, with a note that the built-in policy only covers resource types that support tags and location. Which settings leads to a violet card: the FedRAMP Moderate regulatory compliance initiative in audit mode, a partial view. Which exceptions leads to an amber card: a policy exemption with category Mitigated or Waiver and an expiry date, recorded in the package."}

### Which cloud

Azure (the public cloud) and Azure Government both hold FedRAMP High authorizations, and Microsoft says the High authorization covers all Azure public regions in the United States.[^c05-scope] On the FedRAMP Marketplace both are listed as FedRAMP Certified at Class D (High): Azure Commercial Cloud (F1209051525) and Azure Government (F1603087869).[^c05-fr] Azure Government adds contractual commitments on US data storage and screened US personnel; Microsoft frames the public cloud's High authorization as meeting "the needs of many US government customers."[^c05-fedramp-offering]

The choice isn't free-standing. Microsoft 365 GCC pairs with Microsoft Entra ID in the public Azure cloud, while GCC High and DoD pair with Azure Government ([Chapter 04](04-gcc-and-the-feature-gap.md); [Book 02, Chapter 11](../b02-identity/11-reference-deployment.md)). The workbook's reference environment is a GCC tenant with commercial Azure subscriptions in the same directory. An agency that picks Azure Government for workloads gets a separate cloud with its own endpoints (for example, Azure Resource Manager at `management.usgovcloudapi.net` rather than `management.azure.com`) and its own feature availability.[^c05-compare]

### Which regions

The built-in **Allowed locations** policy restricts the regions a deployment can name, with Audit, Deny or Disabled effects. It excludes resource groups and resources that use the "global" region, so pair it with **Allowed locations for resource groups**.[^c05-builtins] Assigned with Deny at the intermediate root, these two policies make "US regions only" an enforced property of every subscription.

### Which services

Microsoft publishes which Azure services are in the audit scope of each authorization, last updated February 2026 for both clouds.[^c05-scope] A service that isn't in scope isn't automatically forbidden (the agency can carry it in its own package with its own assessment), but it isn't inherited either, and that difference is the one between the inherited and agency-implemented control patterns in [Chapter 11](11-the-authorization-package.md). To enforce the list, assign **Allowed resource types** (or the less restrictive **Not allowed resource types**) with Deny. Read the fine print: the built-in Allowed resource types definition only affects resource types that support tags and location. Microsoft says to duplicate it and change its mode to `All` to restrict everything.[^c05-builtins][^c05-disallowed]

The audit-scope list is also where the boundary shows up in places a designer doesn't expect. Azure Virtual Network Manager, the service behind Azure's IP address management pools, isn't named in either cloud's table. [Chapter 06](06-ipam-and-network-as-code.md) works through what that means for the address plan.

### Which settings

Azure Policy ships built-in **Regulatory Compliance** initiatives for FedRAMP Moderate and FedRAMP High, in separate versions for Azure and Azure Government.[^c05-fedramp-offering] Assign the one that matches the boundary in audit mode at the intermediate root. It maps policy definitions to FedRAMP controls and shows which controls are the customer's, Microsoft's or shared. Microsoft is explicit about its limit: "Compliant" refers only to the policy definitions, there's often no one-to-one match between a control and a policy, some controls have no policy at all, and the initiative is "only a partial view of your overall compliance status."[^c05-init]

### Which exceptions

A deliberate deviation is recorded as a **policy exemption**. Exemptions have two categories: **Mitigated**, when the policy's intent is met another way, and **Waiver**, when non-compliance is temporarily accepted. An optional `expiresOn` date ends the exemption, and the expired object is kept for the record.[^c05-exempt] That's a close fit for the exception record [Chapter 09](09-equivalents-and-exceptions.md) describes: a Mitigated exemption points to an in-boundary equivalent, and a Waiver points to a documented, time-limited exception. The program's rule is that every exemption carries an expiry date and a reference to the decision that authorized it.

## Enforcing without breaking things

Azure Policy evaluates a create or update request before it reaches the resource provider. `disabled` is checked first, then `append` and `modify`, then `deny`, then `audit`; `auditIfNotExists` and `deployIfNotExists` run after the provider returns success.[^c05-effects] A `deny` match fails the request with a 403.[^c05-deny] A policy can be assigned at a management group, but only resources in subscriptions and resource groups are evaluated, and Microsoft recommends starting with `audit` or `auditIfNotExists` before switching to an enforcing effect.[^c05-overview] Existing resources are re-evaluated on a 24-hour standard cycle, and a subscription created or moved within the hierarchy is evaluated against subscription-targeted assignments in about 30 minutes.[^c05-compliance-data]

The program's rollout follows that guidance. Each boundary policy goes in at the intermediate root in audit mode, the compliance report is reviewed with the system owner and the information system security officer, non-compliant resources are either fixed or given an exemption, and only then does the effect change to Deny. A policy that blocks a production deployment on day one teaches teams to ask for exemptions instead of fixing designs. The commands for each stage (assignment with `--enforcement-mode DoNotEnforce`, the switch to `Default`, remediation tasks, exemptions with an expiry and the monthly compliance export) are in [Step 9 of the Azure Security Engineering implementation guide](../guides/azure-security-implementation.md#step-9-policy-and-drift), which applies the same rollout to the security policies.

**Authority:** Microsoft-recommended (start with `audit` or `auditIfNotExists` before an enforcing effect;[^c05-overview] exemptions with a category and an expiry[^c05-exempt]); Risk-based recommended for the rings and the exemption rule below, which are the program's position, for the risk that a deny policy blocks a production deployment nobody tested.
**Applies:** all subscriptions under the intermediate root; Environment-dependent: built-in definitions differ between Azure and Azure Government, so each definition is looked up in the cloud it's assigned in ([What a landing zone is](#what-a-landing-zone-is)).

| How template | Boundary policy rollout |
|---|---|
| Prerequisites | The hierarchy and the default management group in place ([The management group hierarchy](#the-management-group-hierarchy)); Resource Policy Contributor eligible through Privileged Identity Management at the intermediate root |
| Pilot | The Sandbox management group, then one Corp subscription chosen by the platform owner |
| Report-only or audit phase | `audit` effect, or the assignment in `DoNotEnforce`, for at least one 24-hour evaluation cycle and one compliance review with the system owner and ISSO |
| Enforcement | The rings below; the step that enforces is the change of effect to Deny, or of enforcement mode to `Default` |
| Rollback | Set the assignment back to `DoNotEnforce` (or the effect back to `audit`); minutes; the platform owner runs it |
| Exclusions | Policy exemptions only, each Mitigated or Waiver, with an expiry and the decision reference ([Which exceptions](#which-exceptions)); no `notScopes` for convenience. Sign-in exclusions such as emergency access accounts don't apply: Azure Policy evaluates resource requests, not sign-ins |
| Telemetry | Policy compliance state and activity-log deny events, sent to the Management subscription's workspace |
| Evidence | The checklist below |
| Day-two ownership | The platform owner for assignments; the ISSO for exemptions, reviewed monthly, expired ones reported ([Chapter 08](08-who-owns-the-boundary.md)) |

: Boundary policy rollout against the How template {.striped .hover}

**Change safety**

| Ring | Scope | Exit criteria |
|---|---|---|
| 0 | Sandbox management group | The deny fires on a test deployment with the policy's message; nothing else is blocked |
| 1 | One Corp subscription | One evaluation cycle with no unexplained non-compliance |
| 2 | Corp and Online landing zones | Every non-compliant resource fixed or exempted, with an expiry |
| 3 | The intermediate root | A month of compliance exports with no deny event that wasn't a design error |

- **Emergency access:** not applicable to resource policy; the platform team keeps an eligible Owner path through Privileged Identity Management to change an assignment during an incident ([Book 04, Chapter 04](../b04-access/04-privileged-roles-and-tiers.md)).
- **Change window:** the switch to Deny is a normal change approved by the platform owner and ISSO, made in a window with the platform team on hand ([Chapter 07](07-the-front-door.md)).
- **Backout triggers:** a deny that blocks a production deployment of an approved design, or a remediation task that changes resources outside the policy's intent.
- **Post-change validation:** a test deployment that should be denied is denied, and one that should pass passes, after each ring.

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | [Where each boundary decision lands](#where-each-boundary-decision-lands) | The boundary decisions in the package ([Chapter 11](11-the-authorization-package.md)) |
| Configured | Assignments in audit or `DoNotEnforce` | Assignment exports, or the policy-as-code file and its commit |
| Enforced | Deny (or `Default`) at the intermediate root | Assignment export showing the effect; the exemption register |
| Evidenced | The post-change validation | The denied and the allowed test deployments (date, tester) and their activity-log entries |
| Operated | Monthly compliance review | Compliance exports; exemption review record |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

**Evidence checklist**

- [ ] **Configuration:** policy assignment and initiative exports at the intermediate root, or the policy-as-code file and its commit
- [ ] **Operational:** monthly compliance summaries and deny events in the workspace, kept for the program's log retention
- [ ] **Test:** the denied and allowed test deployments after each ring (expected and observed result, date, tester)
- [ ] **Exception:** the exemption register (`az policy exemption list`), each with its category, expiry and decision reference
- [ ] **Assessor-ready artifact:** the compliance summary for the boundary with its exemptions, linked from the package ([Chapter 11](11-the-authorization-package.md))

## The same pattern on AWS

AWS expresses the same structure with AWS Organizations: accounts instead of subscriptions, organizational units instead of management groups, and **service control policies** instead of deny assignments. An SCP never grants a permission; it sets the maximum permissions available to IAM users and roles in member accounts, including the root user. SCPs don't affect the management account, and they require an organization with all features enabled.[^c05-scp]

**AWS Control Tower** builds the landing zone on top of Organizations. It runs in the commercial Regions and in both AWS GovCloud (US) Regions; AWS's GovCloud guide notes it can be used there even for workloads that require a High categorization. The GovCloud version works differently in ways that shape the build:[^c05-ct]

- Accounts can't be created inside GovCloud. The `CreateGovCloudAccount` API runs from a management account in the commercial partition and creates a pair: a standalone GovCloud account and a linked commercial account for billing and support.
- An organization in GovCloud is independent of commercial organizations, and the Audit and Log Archive accounts must already exist in it before Control Tower is set up.
- Account Factory's **Create account** feature isn't available, and new customers can't deploy Account Factory for Terraform there.
- Some controls have no effect in GovCloud, and some Security Hub CSPM controls in the Control Tower standard aren't available.
- Control Tower metadata (account names, email addresses, organizational unit names) must not contain export-controlled data.

AWS recommends **Landing Zone Accelerator on AWS** on top of Control Tower for regulated workloads. It's open-source infrastructure as code, supports the GovCloud (US) partition, and comes with AWS's own warning that it "will not, by itself, make you compliant."[^c05-lza] On the Marketplace, AWS GovCloud (F1603047866) is listed at Class D (High) and AWS US East/West at Class C (Moderate).[^c05-fr]

Those classes describe what each region was assessed against, not who may use it. AWS states that US East/West is FedRAMP Certified Class C (formerly the Moderate baseline) and GovCloud (US) Class D (formerly the High baseline), and its services-in-scope list marks each service separately for each, so a service can be in scope in one and not the other.[^c05-aws-fedramp] The High baseline contains the Moderate controls, so a Moderate system can run in GovCloud (US) as well as in the commercial Regions *(inference)*. An agency may run most of its AWS workloads in GovCloud (US) at Moderate and put a service such as a contact center in the commercial Regions; both are Moderate locations. The landing zone then has two organizations, one per partition, and the package names which services run where *(design guidance)*. Check each service, per region, on the FedRAMP Marketplace and AWS's list before the design depends on it.

## Internet-facing workloads: ingress and resilience {#internet-facing-workloads}

The **Online** management group holds the workloads that face the internet, and its policy is where the boundary decides how they may be reached. This section covers selection and control patterns only: which ingress, firewall and DDoS service fits which need, the policy that keeps every public endpoint behind one of them, and the evidence. The engineering (WAF rule tuning, origin lock-down, TLS, health probes, Firewall rules, Private Link DNS, response exercises) belongs to the [Azure Security Engineering implementation guide](../guides/azure-security-implementation.md), and the network paths themselves to [Book 09](../b09-network/index.md).

**Authority:** Microsoft-recommended for putting a web application firewall and DDoS protection in front of internet-facing web workloads;[^c05-ing-waf-afd] Mandated for knowing and attesting what is exposed, which BOD 26-04 asks of agencies quarterly for publicly exposed IP addresses and domains;[^c05-ing-bod2604] Risk-based recommended for the selection rules below, which are the program's position.
**Applies:** License-dependent (DDoS Protection and Front Door Premium are paid tiers) and Environment-dependent: Azure Front Door Standard and Premium are generally available in Azure Government in US Gov Arizona and US Gov Texas, and Learn records no other networking variation for the services below, deferring to Microsoft's products-by-region list, so their Azure Government availability is checked there when the design is written.[^c05-ing-gov]

### Selection

| Need | Service | Choose it when | Control pattern | Evidence |
|---|---|---|---|---|
| Global HTTP(S) entry with an edge WAF | Azure Front Door Premium with a WAF policy | The application spans regions, needs global load balancing or caching, or should be protected at the edge; Front Door has layer 3 and 4 DDoS protection by default and accepts only HTTP and HTTPS[^c05-ing-afd-ddos] | Managed rules need Premium (Standard supports custom rules only); origins reached over Private Link so they aren't public[^c05-ing-waf-afd][^c05-ing-afd-ddos] | Profile and WAF policy export; origin with no public access |
| Regional HTTP(S) entry, public or private | Application Gateway WAF v2 | A single-region application, or region-specific rules behind Front Door | Its public IP is in the agency's virtual network, so it needs DDoS Network Protection on that network for tuned layer 3 and 4 mitigation[^c05-ing-l7] | WAF policy export; DDoS plan association |
| Both | Front Door in front of Application Gateway | A multiregion application that also needs regional rules | Front Door as the first line, Application Gateway rules per region[^c05-ing-wafdesign] | Both exports |
| Request floods and abuse | WAF rate-limit custom rules on either service; the HTTP DDoS ruleset is in preview | Every internet-facing web workload | At least one catch-all rate-limit rule, in place before an attack[^c05-ing-l7] | Rule export; WAF logs |
| Volumetric attack on a public IP | Azure DDoS Protection: infrastructure protection (free, automatic), IP Protection (per IP) or Network Protection (a plan covering up to 100 public IPs across the tenant's subscriptions) | Network Protection for production estates: it adds DDoS Rapid Response, cost protection and a WAF discount, which IP Protection doesn't;[^c05-ing-ddos-tiers] Microsoft's FAQ puts the cost crossover at about 15 public IPs[^c05-ing-ddos-faq] | Built-in policy "Virtual networks should be protected by Azure DDoS Protection," in Audit, then Modify[^c05-ing-ddos-secure] | Policy compliance; plan associations |
| No public endpoint at all | Private Link and private endpoints for PaaS services | The service has no reason to be reached from the internet | Fewer public IPs are fewer DDoS targets[^c05-ing-ddos-secure] | Private endpoint inventory; public network access disabled |
| Egress and east-west control | Azure Firewall in the Connectivity hub | All spoke traffic to the internet and between spokes | Central, logged application and network rules[^c05-ing-netoverview] | Firewall policy export; logs |
| Public IP governance | Azure Policy at the landing-zone groups | Always | **Not allowed resource types** with Deny for `Microsoft.Network/publicIPAddresses` in **Corp** (see [Which services](#which-services)); in **Online**, every public IP behind Front Door or an Application Gateway, or registered as an exception | Policy assignment; exemption register; the inventory below |

The guide carries the build for each row, with its pilot, rollback and evidence: DDoS Protection in [Step 3](../guides/azure-security-implementation.md#step-3-ddos-protection), WAF policies and their Detection-to-Prevention move in [Step 4](../guides/azure-security-implementation.md#step-4-web-application-firewall), Front Door and Application Gateway with origin lock-down in [Step 5](../guides/azure-security-implementation.md#step-5-front-door-and-application-gateway), Azure Firewall and segmentation in [Step 6](../guides/azure-security-implementation.md#step-6-firewall-and-segmentation), Private Link and its DNS in [Step 7](../guides/azure-security-implementation.md#step-7-private-link-and-dns), and the policies that hold them in place in [Step 9](../guides/azure-security-implementation.md#step-9-policy-and-drift).

### The same pattern on other platforms

| Need | Azure | AWS | Google Cloud | Oracle Cloud Infrastructure |
|---|---|---|---|---|
| Global edge with WAF | Front Door Premium | CloudFront with AWS WAF; CloudFront isn't available in AWS GovCloud (US), though it can front GovCloud resources from the standard Regions[^c05-ing-aws-cf] | Global external Application Load Balancer with Cloud Armor; not listed for Assured Workloads FedRAMP Moderate or High[^c05-ing-gcp-aw] | WAF edge policy, reached through DNS[^c05-ing-oci-waf] |
| Regional L7 with WAF | Application Gateway WAF v2 | Application Load Balancer with AWS WAF, available in GovCloud (US) with AWS managed rule groups only[^c05-ing-aws-waf] | Regional external Application Load Balancer with Cloud Armor; regional backend security policies are the only Cloud Armor policies listed for FedRAMP High[^c05-ing-gcp-aw] | Load Balancer with a regional WAF policy[^c05-ing-oci-waf] |
| Rate limiting | WAF rate-limit rules | AWS WAF rate-based rules[^c05-ing-aws-waf] | Cloud Armor rate-based rules[^c05-ing-gcp-armor] | WAF rate limiting[^c05-ing-oci-waf] |
| DDoS | DDoS IP or Network Protection | Shield Standard (automatic) or Shield Advanced; Shield Advanced isn't yet available in GovCloud (US)[^c05-ing-aws-shield] | Cloud Armor; Adaptive Protection and DDoS response support come with Cloud Armor Enterprise[^c05-ing-gcp-armor] | Layer 3 and 4 protection included with every tenancy[^c05-ing-oci-ddos] |
| Private service access | Private Link | PrivateLink interface endpoints[^c05-ing-aws-pl] | Private Service Connect[^c05-ing-gcp-psc] | Private endpoints and service gateway[^c05-ing-oci-pe] |
| Managed firewall | Azure Firewall | AWS Network Firewall, available in GovCloud (US)[^c05-ing-aws-nfw] | Cloud NGFW, listed for FedRAMP Moderate and High[^c05-ing-gcp-aw] | OCI Network Firewall; available in Oracle US Government Cloud[^c05-ing-oci-gov] |
| Public exposure guardrail | Azure Policy deny on public IP resources | VPC Block Public Access; AWS Config rule `ec2-instance-no-public-ip` (detects only)[^c05-ing-aws-bpa] | Organization policy `constraints/compute.vmExternalIpAccess`, which can't be applied retroactively[^c05-ing-gcp-ip] | Security Zone policies `deny public_subnets` and `deny internet_gateway`[^c05-ing-oci-sz] |

Government availability is read per offering, not per vendor, as [Book 09, Chapter 05](../b09-network/05-sd-wan-sase-and-governed-transport.md#authorization-status-is-not-uniform) argues for SASE services: in Oracle US Government Cloud, WAF, Network Firewall and the Network Load Balancer have listed endpoints and the Layer 7 Load Balancer isn't listed, so for it availability is not yet specified.[^c05-ing-oci-gov]

### The inventory and the exercise

The closure evidence an assessor looks for is coverage, not configuration: every internet-facing resource known, owned and protected, and a test that shows the protection responds. Inventory every public IP and its DDoS protection mode with Azure Resource Graph, from the Azure CLI signed in to the agency's cloud (`az cloud set --name AzureUSGovernment` first in Azure Government):

```bash
az extension add --name resource-graph
az graph query --first 1000 -q "
Resources
| where type =~ 'microsoft.network/publicipaddresses'
| project subscriptionId, resourceGroup, name, ipAddress = tostring(properties.ipAddress),
          ddosMode = tostring(properties.ddosSettings.protectionMode),
          attachedTo = tostring(properties.ipConfiguration.id)
| order by subscriptionId asc, name asc" --output table
```

Microsoft recommends exactly this kind of inventory of public IPs and their protection status, with Resource Graph to find the gaps.[^c05-ing-ddos-secure] [Step 2 of the guide](../guides/azure-security-implementation.md#step-2-public-exposure-inventory) turns the query into the exposure register, adding the owner, the DNS names and certificates that point at each exposure, and whether a WAF covers it. Each row is matched to an owner in the CMDB ([Book 15, Chapter 07](../b15-day2-operations/07-the-cmdb-and-asset-identity.md)); a row with no owner, or attached to nothing, is a finding. The monthly comparison and the quarterly BOD 26-04 attestation run on [Book 15's operating cadence](../b15-day2-operations/12-the-day-two-runbook.md#the-cadence-by-control-family).

The exercise has two parts. A WAF policy starts in Detection mode, which logs and blocks nothing, and moves to Prevention after tuning; Microsoft's design guidance puts that at one to two weeks of clean logs, and is explicit that Detection mode gives no protection.[^c05-ing-wafdesign] A DDoS test is run only through Microsoft's approved simulation partners, against public IPs the agency owns that are already under DDoS Protection; Microsoft's penetration-testing rules prohibit any other denial-of-service testing.[^c05-ing-ddos-sim] The simulation report, the DDoS metrics and alerts it raised, and the response team's record are the exercise evidence.

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | [Selection](#selection), recorded per workload in the request ([Chapter 07](07-the-front-door.md)) | The workload's ingress decision |
| Configured | WAF policies, DDoS plan, Private Link, Firewall ([the Azure Security Engineering guide, Steps 3 to 7](../guides/azure-security-implementation.md#step-3-ddos-protection)) | Exports |
| Enforced | Public IP policy with Deny in Corp; DDoS policy in Modify; WAF in Prevention | Policy assignments; WAF mode; exemption register |
| Evidenced | The inventory and the exercise above | Inventory output; simulation report; WAF logs |
| Operated | Monthly inventory comparison, quarterly attestation, annual exercise | Cadence records |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** Infrastructure; Networks
- **CISA ZTMM pillar:** Networks; Applications and Workloads
- **Depends on:** the asset inventory and CMDB ([Book 15](../b15-day2-operations/07-the-cmdb-and-asset-identity.md)); logging to the SIEM ([Book 12](../b12-security-operations/index.md)); the landing-zone policy above
- **Attack chain interrupted:** exploitation of an unprotected public endpoint and denial of service against it (Initial Access, Impact)
:::

## A multi-environment estate

Many agencies don't have one landing zone; they have several environments that have to behave as one boundary. A typical pattern looks like this:

| Environment | How addresses are assigned | Whose authorization covers the infrastructure |
|---|---|---|
| On-premises VMware (NSX overlay) | NSX DHCP on the logical gateways, or the enterprise IPAM | The agency's own authorization |
| Azure virtual networks | The Azure fabric assigns from the subnet range; virtual networks are Layer 3 overlays with no Layer 2 semantics[^c05-vnetfaq] | Azure's certification for the service; the agency's authorization for its use |
| AWS VPCs | The VPC assigns from the subnet; AWS reserves five addresses per subnet, and the Amazon DNS server sits at the VPC range base plus two[^c05-aws-subnet] | AWS's certification for the service; the agency's authorization for its use |
| A shared service another agency runs in its own tenancy | The partner controls addressing; the agency documents what it connects to | The partner's authorization; the agency documents the connection as an external service |

None of these environments uses broadcast DHCP in the traditional sense, so none of them can be inventoried by watching the wire. That's why the address plan has to be held above the fabrics, which is [Chapter 06](06-ipam-and-network-as-code.md)'s subject. The fourth row is the one most often left out: an integration with a service another agency operates (an HR shared service, for example) crosses into a boundary the agency doesn't control, and the agency's side of it (name resolution, certificate monitoring, the documented interconnection) still belongs in the agency's package.

## Every automation declares its boundary

The landing zone constrains what people deploy. The program also has to constrain what its own automation does, because a collector or adapter that calls a commercial-only API from inside the boundary is a boundary crossing nobody approved. The program's cloud specification sets the contract every cloud adapter inherits:

- **A declared boundary.** Each adapter operates in-boundary, reading state through in-boundary APIs, or through a named exception that a formal decision added to a short, canonical list. There's no third option: an adapter that needs a commercial-only API can't register against the boundary without an authorizing decision.
- **No hardcoded hostnames.** Endpoints resolve from the declared cloud, because they differ by cloud (Resource Manager's address, above, is one example).
- **Fail closed** on an unknown cloud.
- **An endpoint class on every claim.** Each emitted claim records its boundary, tenant, region and endpoint class (Graph v1.0, Graph beta, Resource Manager or Arc), which makes it possible to tell later whether a finding came from inside the boundary.

These are design positions, not vendor facts. Their purpose is to make the boundary checkable for software the same way policy makes it checkable for deployments: a claim that crosses the boundary without a declared exception shows up as provenance drift, and an adapter emitting outside its declared scope shows up as an authorization finding. The specification also states its own limit. Platform feature gaps remain the agency's responsibility; the contract doesn't remove them, it makes them governable.

## What a landing zone can't prove

A landing zone enforces structure. It doesn't authorize anything. NIST defines the authorization boundary as all components of an information system to be authorized for operation by an authorizing official, excluding separately authorized systems it connects to,[^c05-sp80037] and FedRAMP's 2026 rules are explicit that "each agency still authorizes its own federal information systems" and that the agency's system security plan focuses on "what the agency implements, configures, operates, or inherits."[^c05-fedramp-use] The landing zone is a large part of what the agency implements and configures, and its policy assignments, compliance reports and exemptions are evidence. But Azure Policy's own documentation calls its compliance view partial, and AWS says the same of its accelerator. The authorizing official still decides; the landing zone makes the decision checkable. [Chapter 11](11-the-authorization-package.md) covers how this evidence enters the package.

## What this chapter establishes

1. A landing zone is a platform landing zone plus workload landing zones, and in Azure each workload landing zone is a subscription placed in a management group that carries its policy.
2. Every boundary decision has a mechanism: the cloud and tenant choice, Allowed locations, allowed resource types checked against Microsoft's audit-scope list, the FedRAMP regulatory compliance initiative in audit mode, and exemptions with an expiry.
3. Microsoft's landing zone accelerators aren't supported unmodified in Azure Government, and AWS Control Tower works differently in GovCloud; both differences have to be planned, not discovered.
4. Internet-facing workloads sit behind a chosen ingress (Front Door, Application Gateway or both), with the WAF in Prevention, DDoS Protection on every public IP and a public IP policy; the evidence is the inventory and a partner-run DDoS exercise.
5. Automation needs a boundary contract too: declared boundary or named exception, no hardcoded endpoints, fail closed.
6. Policy compliance is evidence, not authorization.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 04 — GCC, GCC High and the Commercial Feature Gap](04-gcc-and-the-feature-gap.md) · [Book index](index.md) · [Next: Chapter 06 — IPAM and Network as Code →](06-ipam-and-network-as-code.md)
:::

[^c05-alz]: Microsoft Learn, "What is an Azure landing zone?," Cloud Adoption Framework, <https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/> (accessed Oct 21, 2026).
[^c05-faq]: Microsoft Learn, "Azure landing zone frequently asked questions (FAQ)" ("landing zones are individual Azure subscriptions"), <https://learn.microsoft.com/azure/cloud-adoption-framework/ready/enterprise-scale/faq> (accessed Oct 21, 2026).
[^c05-design-areas]: Microsoft Learn, "Azure landing zone design areas and conceptual architecture," <https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/design-areas> (accessed Oct 21, 2026).
[^c05-impl]: Microsoft Learn, "Platform landing zone implementation options," <https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/implementation-options> (accessed Oct 21, 2026).
[^c05-deploy]: Microsoft Learn, "Deploy Azure landing zones," sections "Choose a platform landing zone approach" and "Azure sovereign cloud deployments," <https://learn.microsoft.com/azure/architecture/landing-zones/landing-zone-deploy> (accessed Oct 21, 2026).
[^c05-mg]: Microsoft Learn, "Management groups," Azure landing zone design area (design considerations, recommendations, and the baseline hierarchy table), <https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/design-area/resource-org-management-groups> (accessed Oct 21, 2026).
[^c05-vending]: Microsoft Learn, "Subscription vending," Azure landing zone design area, <https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/design-area/subscription-vending> (accessed Oct 21, 2026).
[^c05-scope]: Microsoft Learn, "Azure and other Microsoft cloud services compliance scope" (Azure public and Azure Government services by audit scope, both last updated February 2026; Azure and Azure Government FedRAMP High authorizations), <https://learn.microsoft.com/en-us/azure/azure-government/compliance/azure-services-in-fedramp-auditscope> (accessed Oct 21, 2026).
[^c05-fr]: FedRAMP Marketplace, `products.json` (meta `last_change` 2026-10-21): Azure Commercial Cloud, F1209051525, FedRAMP Certified, High, Class D; Azure Government (includes Dynamics 365), F1603087869, FedRAMP Certified, High, Class D; AWS GovCloud, F1603047866, FedRAMP Certified, High, Class D; AWS US East/West, AGENCYAMAZONEW, FedRAMP Certified, Moderate, Class C, <https://www.fedramp.gov/marketplace/products.json> (accessed Oct 21, 2026).
[^c05-fedramp-offering]: Microsoft Learn, "Federal Risk and Authorization Management Program (FedRAMP)," Azure compliance offerings (Azure and FedRAMP; regulatory compliance built-in initiatives for Azure and Azure Government), <https://learn.microsoft.com/azure/compliance/offerings/offering-fedramp> (accessed Oct 21, 2026).
[^c05-compare]: Microsoft Learn, "Compare Azure Government and global Azure," Guidance for developers (endpoint mapping), <https://learn.microsoft.com/azure/azure-government/compare-azure-government-global-azure> (accessed Oct 21, 2026).
[^c05-builtins]: Microsoft Learn, "Azure Policy built-in policy definitions," General category (Allowed locations, Allowed locations for resource groups, Allowed resource types, Not allowed resource types), <https://learn.microsoft.com/azure/governance/policy/samples/built-in-policies> (accessed Oct 21, 2026).
[^c05-disallowed]: Microsoft Learn, "Tutorial: Disallow resource types in your cloud environment," <https://learn.microsoft.com/azure/governance/policy/tutorials/disallowed-resources> (accessed Oct 21, 2026).
[^c05-init]: Microsoft Learn, "Details of the FedRAMP Moderate Regulatory Compliance built-in initiative," <https://learn.microsoft.com/azure/governance/policy/samples/fedramp-moderate> (accessed Oct 21, 2026).
[^c05-exempt]: Microsoft Learn, "Azure Policy exemption structure," sections "Exemption category" and "Expiration," <https://learn.microsoft.com/azure/governance/policy/concepts/exemption-structure> (accessed Oct 21, 2026).
[^c05-effects]: Microsoft Learn, "Azure Policy definitions effect basics," Order of evaluation, <https://learn.microsoft.com/azure/governance/policy/concepts/effect-basics> (accessed Oct 21, 2026).
[^c05-deny]: Microsoft Learn, "Azure Policy definitions deny effect," <https://learn.microsoft.com/azure/governance/policy/concepts/effect-deny> (accessed Oct 21, 2026).
[^c05-overview]: Microsoft Learn, "What is Azure Policy?," sections "Resources covered by Azure Policy" and "Recommendations for managing policies," <https://learn.microsoft.com/azure/governance/policy/overview> (accessed Oct 21, 2026).
[^c05-compliance-data]: Microsoft Learn, "Get compliance data of Azure resources," Evaluation triggers, <https://learn.microsoft.com/azure/governance/policy/how-to/get-compliance-data> (accessed Oct 21, 2026).
[^c05-scp]: AWS, *AWS Organizations User Guide*, "Service control policies (SCPs)," <https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html> (accessed Oct 21, 2026).
[^c05-ct]: AWS, *AWS GovCloud (US) User Guide*, "AWS Control Tower in AWS GovCloud (US)," <https://docs.aws.amazon.com/govcloud-us/latest/UserGuide/govcloud-controltower.html> (accessed Oct 21, 2026).
[^c05-aws-fedramp]: Amazon Web Services, "FedRAMP" (US East/West FedRAMP Certified Class C, formerly Moderate; GovCloud (US) Class D, formerly High), <https://aws.amazon.com/compliance/fedramp/>; and "FedRAMP — Services in Scope" (per-service, per-Region columns), <https://aws.amazon.com/compliance/services-in-scope/FedRAMP/>; baselines are cumulative per NIST SP 800-53B, <https://csrc.nist.gov/pubs/sp/800/53/b/upd1/final> (accessed Oct 29, 2026).
[^c05-lza]: AWS, *Landing Zone Accelerator on AWS Implementation Guide*, "Deploy a cloud foundation to support highly-regulated workloads and complex compliance requirements," <https://docs.aws.amazon.com/solutions/latest/landing-zone-accelerator-on-aws/solution-overview.html> (accessed Oct 21, 2026).
[^c05-vnetfaq]: Microsoft Learn, "Azure Virtual Network frequently asked questions (FAQ)," Configuration ("Virtual networks are Layer 3 overlays. Azure does not support any Layer 2 semantics"; five reserved addresses per subnet), <https://learn.microsoft.com/azure/virtual-network/virtual-networks-faq> (accessed Oct 21, 2026).
[^c05-aws-subnet]: AWS, *Amazon VPC User Guide*, "Subnet CIDR blocks," Subnet sizing for IPv4, <https://docs.aws.amazon.com/vpc/latest/userguide/subnet-sizing.html> (accessed Oct 21, 2026).
[^c05-sp80037]: National Institute of Standards and Technology, SP 800-37 Rev. 2, *Risk Management Framework for Information Systems and Organizations*, December 2018, Appendix A glossary, "authorization boundary" (from OMB Circular A-130), <https://csrc.nist.gov/pubs/sp/800/37/r2/final> (accessed Oct 21, 2026).
[^c05-fedramp-use]: FedRAMP, "Using a FedRAMP Certified Cloud Service," *Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/agencies/use/> (accessed Oct 21, 2026).
[^c05-ing-waf-afd]: Microsoft Learn, "Azure Web Application Firewall on Azure Front Door" (for web workloads Microsoft highly recommends Azure DDoS Protection and a web application firewall; WAF natively integrated with Front Door Premium with full capabilities, custom rules only on Standard), <https://learn.microsoft.com/azure/web-application-firewall/afds/afds-overview> (accessed Nov 11, 2026).
[^c05-ing-bod2604]: Cybersecurity and Infrastructure Security Agency, Binding Operational Directive 26-04, *Prioritizing Security Updates Based on Risk*, June 10, 2026, Phase I required actions (attest to publicly exposed IP addresses and domains quarterly), <https://www.cisa.gov/news-events/directives/bod-26-04-prioritizing-security-updates-based-risk> (accessed Oct 21, 2026, as cited in [Book 12, Chapter 06](../b12-security-operations/06-vulnerability-management.md)).
[^c05-ing-gov]: Microsoft Learn, "Compare Azure Government and global Azure," sections "Service availability" (availability without a listed variation implies the service's features are available; Microsoft points to its products-by-region list) and "Networking" ("Azure Front Door (AFD) Standard and Premium tiers are available in general availability in Azure Government regions US Gov Arizona and US Gov Texas"), <https://learn.microsoft.com/azure/azure-government/compare-azure-government-global-azure> (accessed Nov 11, 2026).
[^c05-ing-afd-ddos]: Microsoft Learn, "DDoS protection on Azure Front Door" (layer 3, 4 and 7 protection; only HTTP and HTTPS; Private Link to origins), <https://learn.microsoft.com/azure/frontdoor/front-door-ddos> (accessed Nov 11, 2026).
[^c05-ing-l7]: Microsoft Learn, "Application (layer 7) DDoS protection," sections "Platform DDoS protection differs by platform" (Application Gateway's public IP needs DDoS Network Protection), "Automated protection with the HTTP DDoS ruleset (preview)" and "Baseline configuration checklist" (at least one catch-all rate-limit rule), <https://learn.microsoft.com/azure/web-application-firewall/application-ddos-protection> (accessed Nov 11, 2026).
[^c05-ing-wafdesign]: Microsoft Learn, "Web Application Firewall for Azure networks," sections "Azure WAF platform comparison" (Front Door, Application Gateway, or both layered) and "Detection mode vs. Prevention mode" (Detection logs only and provides no protection; switch after one to two weeks of clean logs), <https://learn.microsoft.com/azure/networking/design-guide/web-application-firewall> (accessed Nov 11, 2026).
[^c05-ing-ddos-tiers]: Microsoft Learn, "About Azure DDoS Protection tier comparison" (IP Protection lacks DDoS rapid response support, cost protection and the WAF discount), <https://learn.microsoft.com/azure/ddos-protection/ddos-protection-sku-comparison>; and "DDoS protection for Azure networks," section "Azure services and features" (infrastructure protection free and automatic; a Network Protection plan covers up to 100 public IPs across the tenant), <https://learn.microsoft.com/azure/networking/design-guide/ddos> (both accessed Nov 11, 2026).
[^c05-ing-ddos-faq]: Microsoft Learn, "Azure DDoS Protection frequently asked questions," "Which Azure DDoS Protection tier should I choose?" (fewer than 15 public IP resources: IP Protection is the more cost-effective), <https://learn.microsoft.com/azure/ddos-protection/ddos-faq> (accessed Nov 11, 2026).
[^c05-ing-ddos-secure]: Microsoft Learn, "Secure your Azure DDoS Protection deployment," sections "Network security" (Private Link reduces exposed public IPs) and "Compliance and governance" (built-in policy "Virtual networks should be protected by Azure DDoS Protection" with Modify or Audit; inventory public IPs and their protection status with Azure Resource Graph; regular simulation testing), <https://learn.microsoft.com/azure/ddos-protection/secure-ddos-protection> (accessed Nov 11, 2026).
[^c05-ing-netoverview]: Microsoft Learn, "Azure networking services overview," section "Azure network security services" (Azure Firewall centrally creates, enforces and logs application and network connectivity policies across subscriptions and virtual networks; WAF with Application Gateway is regional, with Front Door at the edge), <https://learn.microsoft.com/azure/networking/networking-overview> (accessed Nov 11, 2026).
[^c05-ing-ddos-sim]: Microsoft Learn, "Tutorial: Azure DDoS Protection simulation testing," section "Azure DDoS simulation testing policy" (approved partners only; targets must be the customer's own Azure public IPs under DDoS Protection; Red Button is available only for the public cloud), <https://learn.microsoft.com/azure/ddos-protection/test-through-simulations>; and "Penetration testing," section "Prohibited testing," <https://learn.microsoft.com/azure/security/fundamentals/pen-testing> (both accessed Nov 11, 2026).
[^c05-ing-aws-cf]: Amazon Web Services, "Setting Up Amazon CloudFront with Your AWS GovCloud (US) Resources," AWS GovCloud (US) User Guide ("CloudFront is not available in AWS GovCloud (US), but you can use CloudFront in the standard Regions and point to your AWS GovCloud (US) resources"), <https://docs.aws.amazon.com/govcloud-us/latest/UserGuide/setting-up-cloudfront.html> (accessed Nov 11, 2026).
[^c05-ing-aws-waf]: Amazon Web Services, "AWS WAF in AWS GovCloud (US)" (available in US-West and US-East; only AWS managed rule groups), <https://docs.aws.amazon.com/govcloud-us/latest/UserGuide/govcloud-waf.html>; and "Using rate-based rule statements in AWS WAF," <https://docs.aws.amazon.com/waf/latest/developerguide/waf-rule-statement-type-rate-based.html> (both accessed Nov 11, 2026).
[^c05-ing-aws-shield]: Amazon Web Services, "AWS Shield Standard overview" (automatic, at no additional charge), <https://docs.aws.amazon.com/waf/latest/developerguide/ddos-standard-summary.html>; and the AWS Regional Services List, which shows Shield Advanced as planned, not available, in us-gov-west-1 and us-gov-east-1, <https://aws.amazon.com/about-aws/global-infrastructure/regional-product-services/> (both accessed Nov 11, 2026).
[^c05-ing-aws-pl]: Amazon Web Services, "What is AWS PrivateLink?," <https://docs.aws.amazon.com/vpc/latest/privatelink/what-is-privatelink.html> (accessed Nov 11, 2026).
[^c05-ing-aws-nfw]: Amazon Web Services, "AWS Network Firewall in AWS GovCloud (US)" (available in US-West and US-East, no differences), <https://docs.aws.amazon.com/govcloud-us/latest/UserGuide/govcloud-nf.html> (accessed Nov 11, 2026).
[^c05-ing-aws-bpa]: Amazon Web Services, "Block public access to VPCs and subnets," <https://docs.aws.amazon.com/vpc/latest/userguide/security-vpc-bpa.html>; and "ec2-instance-no-public-ip," AWS Config Developer Guide, <https://docs.aws.amazon.com/config/latest/developerguide/ec2-instance-no-public-ip.html> (both accessed Nov 11, 2026).
[^c05-ing-gcp-aw]: Google Cloud, "Supported products by control package," Assured Workloads (FedRAMP High and Moderate list Cloud Armor, regional Application Load Balancers and Cloud NGFW, and don't list the global external Application Load Balancer; "If a service is not listed for a given control package, that service is unsupported"), <https://docs.cloud.google.com/assured-workloads/docs/supported-products>; and "Google Cloud Armor compliance" (FedRAMP High: regional backend security policies), <https://docs.cloud.google.com/armor/docs/compliance> (both accessed Nov 11, 2026).
[^c05-ing-gcp-armor]: Google Cloud, "Rate limiting overview," Cloud Armor, <https://docs.cloud.google.com/armor/docs/rate-limiting-overview>; and "Cloud Armor Enterprise overview" (Adaptive Protection; DDoS response support with the Enterprise Annual subscription), <https://docs.cloud.google.com/armor/docs/managed-protection-overview> (both accessed Nov 11, 2026).
[^c05-ing-gcp-psc]: Google Cloud, "Private Service Connect," <https://docs.cloud.google.com/vpc/docs/private-service-connect> (accessed Nov 11, 2026).
[^c05-ing-gcp-ip]: Google Cloud, "Configure static external IP addresses," section on restricting external IP addresses (`constraints/compute.vmExternalIpAccess`; "You cannot apply the constraint retroactively"), <https://docs.cloud.google.com/compute/docs/ip-addresses/configure-static-external-ip-address> (accessed Nov 11, 2026).
[^c05-ing-oci-waf]: Oracle, "Overview of Web Application Firewall," OCI documentation (a regional WAF policy as a plug-in for the load balancer; an edge policy as a global solution reached through DNS; protection rules and rate limiting), <https://docs.oracle.com/en-us/iaas/Content/WAF/Concepts/overview.htm> (accessed Nov 11, 2026).
[^c05-ing-oci-ddos]: Oracle, "Security Overview," OCI documentation ("L3/4 DDoS protection is included with all Oracle Cloud Infrastructure accounts and no configuration or monitoring is required"), <https://docs.oracle.com/en-us/iaas/Content/Security/Concepts/security_overview.htm> (accessed Nov 11, 2026).
[^c05-ing-oci-pe]: Oracle, "Private Access," OCI Networking documentation (private endpoints; service gateway), <https://docs.oracle.com/en-us/iaas/Content/Network/Concepts/privateaccess.htm> (accessed Nov 11, 2026).
[^c05-ing-oci-sz]: Oracle, "Security Zone Policies," OCI documentation (`deny public_subnets`, `deny internet_gateway`), <https://docs.oracle.com/en-us/iaas/security-zone/using/security-zone-policies.htm> (accessed Nov 11, 2026).
[^c05-ing-oci-gov]: Oracle, "Oracle US Government Cloud," OCI documentation (API endpoints in us-langley-1 and us-luke-1 listed for Web Application Firewall, Network Firewall and Network Load Balancer; the Layer 7 Load Balancer isn't listed), <https://docs.oracle.com/en-us/iaas/Content/gov-cloud/govfedramp.htm> (accessed Nov 11, 2026).
