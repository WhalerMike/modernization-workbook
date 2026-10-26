---
title: "Chapter 03 — What CISA's Maturity Model and M-22-09 Actually Require"
description: "What the federal Zero Trust instruments require, read from the documents themselves as of October 2026: the kind of authority each carries, the specific actions OMB M-22-09 sets, what CISA's Zero Trust Maturity Model v2.0 is and isn't, what NIST SP 800-207 contributes, the requirements that circulate but don't exist, and the design contract the program takes from all of them."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b11-zero-trust
book: B11
part: What
series-order: 3
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Chapter 03 — What CISA's Maturity Model and M-22-09 Actually Require

*Only one of the federal Zero Trust documents sets requirements, and none of them sets a score.*

::: {.callout-note}
## In this chapter
The four documents that define the federal Zero Trust target and the different kind of authority each one carries. The specific actions OMB M-22-09 requires, pillar by pillar, and how to read them now that its FY 2024 deadlines have passed and one of its cross-references has been rescinded. What CISA's Zero Trust Maturity Model v2.0 says about itself, what NIST SP 800-207 contributes, the requirements that are often cited but don't exist, and the design contract the program takes from all of them. [Appendix A](appendix-a-requirements-mapping.md) maps every requirement to the chapters and books that close it.
:::

Zero Trust programs are usually argued by citation. A tool is bought because "the maturity model requires Optimal." An assessment is scheduled because "M-22-09 requires a Zero Trust score." A tenant is called compliant because its dashboard shows a high number against "CISA's pillars." Each of those statements can be checked against the documents, and most fail. The maturity model calls itself a guide. M-22-09 sets specific actions, not a maturity stage. No federal document defines a Zero Trust score at all.

That doesn't make the target vague. M-22-09 contains binding actions with deadlines, the maturity model gives a common vocabulary of pillars, functions and stages, and SP 800-207 defines the architecture both of them assume. The rest of this book depends on reading them precisely. [Chapter 01](01-a-whole-agency-property.md) argues that Zero Trust maturity is a property of the whole agency; this chapter shows that the documents describe it that way, and says exactly what they ask for.

![The federal Zero Trust instruments by kind of authority: an executive order that requires a plan, an OMB memorandum that sets binding actions, a CISA guide that supplies the vocabulary, a NIST architecture, and the adjacent instruments that bind particular surfaces.](../../images/diagrams/b11-zero-trust/svg/ch03-instrument-authority.svg){#fig-ch03-instrument-authority fig-alt="Three tiers. Top tier, in amber, labeled binding: Executive Order 14028 section 3(b)(ii), which required each agency to develop a plan to implement zero trust architecture; and OMB M-22-09, which sets specific actions by pillar with FY 2024 deadlines and requires an implementation plan and a strategy lead. Middle tier, in blue, labeled guidance that sets the vocabulary: CISA's Zero Trust Maturity Model version 2.0, five pillars, three cross-cutting capabilities and four stages, which calls itself a general guide and not a strict set of requirements; and NIST SP 800-207, seven tenets, policy engine, administrator and enforcement points, guidance rather than a mandate. Bottom tier, in violet, labeled adjacent instruments that bind particular surfaces: CISA BOD 25-01, cloud tenant configuration for products with a published SCuBA baseline; OMB M-26-14, logging, whose reference architecture aligns with the maturity model; and the agency's own NIST SP 800-53 control assertions in each system security plan. A note states that none of the documents defines a Zero Trust score or requires a maturity stage."}

## Four documents, four kinds of authority

The federal Zero Trust target is set by four documents that are often cited as if they were one. They differ in who issued them and in whether an agency must follow them.

| Document | Issuer and date | Authority | What it does |
|---|---|---|---|
| Executive Order 14028, *Improving the Nation's Cybersecurity* | The President, May 12, 2021 | Binding on agencies | Directs the government to "advance toward Zero Trust Architecture" and required each agency head, within 60 days, to "develop a plan to implement Zero Trust Architecture" incorporating NIST's migration steps[^c03-eo14028] |
| OMB M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles* | OMB, January 26, 2022 | Binding on agencies | Sets a federal Zero Trust strategy "requiring agencies to meet specific cybersecurity standards and objectives by the end of Fiscal Year (FY) 2024," organized by the maturity model's pillars[^c03-m2209] |
| *Zero Trust Maturity Model*, Version 2.0 | CISA, April 2023 | Guidance | Five pillars, three cross-cutting capabilities and four maturity stages; "should not be viewed as a strict set of requirements but as a general guide"[^c03-ztmm] |
| NIST SP 800-207, *Zero Trust Architecture* | NIST, August 2020 | Guidance | The definition of zero trust and zero trust architecture, seven tenets, the logical components and deployment approaches the other documents rely on[^c03-sp207] |

Executive Order 14028 also defines the term. Its definition describes zero trust as a security model that "eliminates implicit trust in any one element, node, or service" and that embeds monitoring, risk-based access control and automation "throughout all aspects of the infrastructure."[^c03-eo14028] That phrase is the first place the whole-agency scope of [Chapter 01](01-a-whole-agency-property.md) appears in federal text.

The maturity model and M-22-09 were written to fit each other. M-22-09 says its goals "are organized using the zero trust maturity model developed by CISA," and the model says CISA revised it "to further align with M-22-09's direction for agencies."[^c03-m2209][^c03-ztmm] The relationship runs one way, though. M-22-09 borrows the model's structure for its own actions; it doesn't adopt the model's stages as requirements.

Three adjacent instruments bind particular surfaces rather than the Zero Trust program as a whole. BOD 25-01 binds the configuration of cloud tenants that have a published SCuBA baseline ([Chapter 04](04-scuba-and-bod-25-01.md)). OMB M-26-14 binds logging, and the Logging Reference Architecture it calls for "will align with the Zero Trust Maturity Model."[^c03-m2614] And every system security plan binds the agency to the NIST SP 800-53 controls it asserts. These instruments are where much of the Zero Trust evidence is actually demanded, which is why [Appendix A](appendix-a-requirements-mapping.md) maps them alongside the four documents above.

## What M-22-09 requires

M-22-09 is the only one of the four that sets specific, dated actions for the Zero Trust program itself. It frames them modestly: the strategy "is a starting point, not a comprehensive guide to a fully mature zero trust architecture," and agencies are pointed to the maturity models and reference architectures in its Appendix A for long-term planning.[^c03-m2209] Its scope is not limited to the cloud. The memorandum "frequently references cloud services, but also addresses on-premise and hybrid systems."[^c03-m2209]

### Program actions

Agencies had 30 days to designate a zero trust strategy implementation lead, and 60 days to build on their EO 14028 plans and submit an implementation plan for FY 2022 to FY 2024 and a budget estimate to OMB and CISA.[^c03-m2209] M-22-09 also says agency leadership and "the entire 'C-suite'" should be aligned and committed to overhauling the agency's security architecture; [Chapter 07](07-who-owns-zero-trust.md) builds the ownership model on that sentence.

### Actions by pillar

The table restates the memorandum's numbered actions. "Must" and "should" are M-22-09's own words.

| Pillar | Vision (M-22-09) | Actions (M-22-09 §III.A to §III.E) |
|---|---|---|
| Identity | Staff use enterprise-managed identities; phishing-resistant MFA protects them | Agencies must use centralized identity management systems that integrate with applications and common platforms. MFA must be enforced at the application layer, not the network layer; phishing-resistant MFA is required for agency staff, contractors and partners and must be an option for public users. Password policies must not require special characters or regular rotation. Authorization must consider at least one device-level signal alongside identity information[^c03-m2209] |
| Devices | A complete inventory of every device authorized and operated for official business; prevent, detect and respond to incidents on those devices | Agencies must create reliable asset inventories through CISA's Continuous Diagnostics and Mitigation (CDM) program, and must ensure their endpoint detection and response (EDR) tools meet CISA's technical requirements and are deployed widely, as described in M-22-01[^c03-m2209] |
| Networks | Encrypt all DNS requests and HTTP traffic; begin breaking perimeters into isolated environments | Agencies must resolve DNS using encrypted DNS wherever technically supported, enforce HTTPS for all web and API traffic, preload agency .gov domains as HTTPS-only, and develop, in consultation with CISA, a zero trust architecture plan describing the agency's approach to environmental isolation[^c03-m2209] |
| Applications and Workloads | Treat all applications as internet-connected; rigorous testing; welcome external vulnerability reports | Agencies must operate dedicated application security testing programs, use high-quality firms for independent third-party evaluation, maintain a public vulnerability disclosure program, make at least one internal-facing FISMA Moderate application fully operational over the public internet, and provide CISA and GSA their non-.gov hostnames; they should work toward immutable workloads[^c03-m2209] |
| Data | Protections built on thorough data categorization; cloud security services to discover, classify and protect sensitive data; enterprise-wide logging | Agencies must implement initial automation of data categorization and security responses, audit access to any data encrypted at rest in commercial cloud infrastructure, and work with CISA on comprehensive logging and information sharing "as described in OMB Memorandum M-21-31"[^c03-m2209] |

Several of these actions are narrower or more specific than they are usually quoted.

- **Phishing resistance has a defined meaning and a defined consequence.** M-22-09 defines phishing-resistant authentication as processes "designed to detect and prevent disclosure of authentication secrets and outputs to a website or application masquerading as a legitimate system." For routine self-service access by staff, contractors and partners, agency systems must stop supporting methods that fail that test, including SMS or voice codes, one-time codes and push notifications. PIV, including Derived PIV, is named as the simplest route; FIDO2 and Web Authentication authenticators are permitted.[^c03-m2209] [Book 04](../b04-access/index.md) implements this as authentication strength policy.
- **The network action is an isolation plan, not a product.** M-22-09 lists three approaches from SP 800-207 (enhanced identity governance, logical micro-segmentation and network-based segmentation), says the right one "may vary from agency to agency," and requires only that agencies "move away from the practice of maintaining a broad enterprise-wide network."[^c03-m2209] [Book 09](../b09-network/index.md) carries the network design.
- **Inline decryption is neither required nor prohibited.** The memorandum says so directly and warns against static keys with an overly broad ability to decrypt enterprise-wide traffic.[^c03-m2209]
- **The device signal is a minimum.** "At least one device-level signal" is the floor for authorization decisions, not a description of a mature policy engine.[^c03-m2209] [Book 05](../b05-devices/index.md) supplies the device compliance signal.

### Reading M-22-09 in October 2026

M-22-09's FY 2024 deadlines have passed. OMB hasn't rescinded it: its memoranda index for 2025 and 2026 lists no rescission of M-22-09, and the memorandum is still published on whitehouse.gov.[^c03-omb-index][^c03-m2209] The program treats it as in force, with two adjustments.

The first is logging. The Data pillar's logging action points to M-21-31, and M-26-14 rescinded M-21-31 on May 22, 2026, replacing its event-logging tiers with a risk-based approach and a Logging Reference Architecture.[^c03-m2614] The program reads M-22-09's logging action through M-26-14.

The second is the deadline itself. A passed deadline doesn't retire an action. The actions in the table above remain the specific federal requirements for each pillar; what changed is that agencies are now measured against them as an existing obligation rather than a target date.

## What the maturity model is, and what it isn't

CISA's Zero Trust Maturity Model, Version 2.0, is dated April 2023 on its cover (its revision table records Version 2.0 as March 2022).[^c03-ztmm] CISA describes it as "one of many paths" an organization can take in designing its transition to zero trust architectures in accordance with EO 14028.[^c03-ztmm] No later version has been published. CISA's landing page for the model is now marked "Archived Content," still offers Version 2.0 for download, and directs readers to the Federal Zero Trust Resource Hub that OMB and CISA maintain at zerotrust.cyber.gov.[^c03-ztmm-page] (That site didn't resolve when it was checked for this chapter.)

### Structure

The model has five pillars (Identity, Devices, Networks, Applications and Workloads, and Data) and three cross-cutting capabilities (Visibility and Analytics, Automation and Orchestration, and Governance). Each pillar is broken into functions, and each function is described at four stages: Traditional, Initial, Advanced and Optimal.[^c03-ztmm]

| Pillar | Functions (ZTMM v2.0 Tables 2 to 6) |
|---|---|
| Identity | Authentication; Identity Stores; Risk Assessments; Access Management |
| Devices | Policy Enforcement and Compliance Monitoring; Asset and Supply Chain Risk Management; Resource Access; Device Threat Protection |
| Networks | Network Segmentation; Network Traffic Management; Traffic Encryption; Network Resilience |
| Applications and Workloads | Application Access; Application Threat Protections; Accessible Applications; Secure Application Development and Deployment Workflow; Application Security Testing |
| Data | Data Inventory Management; Data Categorization; Data Availability; Data Access; Data Encryption |

Every pillar also carries its own Visibility and Analytics, Automation and Orchestration, and Governance rows, and Table 7 describes the three capabilities at enterprise level.[^c03-ztmm] Version 2.0 marks several functions as new or renamed (Access Management, Device Threat Protection, Network Resilience and Data Categorization among the new ones), which is why counts of the model's functions quoted from Version 1.0 don't match.

### The stages describe the enterprise, not a product

The stage definitions are where the whole-agency argument is written into the model. Traditional describes "static security policies and solutions that address one pillar at a time" and "siloed pillars of policy enforcement." Advanced describes "cross-pillar coordination," "centralized visibility and identity control," "policy enforcement integrated across pillars" and "building toward enterprise-wide awareness (including externally hosted resources)." Optimal describes "cross-pillar interoperability with continuous monitoring" and "centralized visibility with comprehensive situational awareness."[^c03-ztmm]

None of those properties can be observed by examining one tool or one tenant. A product can be configured to Advanced settings; a stage describes how the agency's enterprise behaves. The model also allows uneven progress: each pillar "can progress at its own pace" until cross-pillar coordination is required, and that coordination "can only be achieved with capabilities and dependencies compatible with one another and the enterprise-wide environment."[^c03-ztmm]

Two examples show how specific the stage text is, and how often it's paraphrased wrongly.

- **Identity, Authentication.** Advanced: the agency "begins to authenticate all identity using phishing-resistant MFA and attributes, including initial implementation of passwordless MFA via FIDO2 or PIV." Optimal: the agency "continuously validates identity with phishing-resistant MFA, not just when access is initially granted."[^c03-ztmm] FIDO2 and PIV are examples; neither stage requires certificate-based authentication.
- **Networks, Network Segmentation.** Traditional: "large perimeter/macro-segmentation with minimal restrictions on reachability within network segments," possibly relying on "bulk traffic VPN tunnels." Optimal: "fully distributed ingress/egress micro-perimeters and extensive micro-segmentation based around application profiles."[^c03-ztmm]

### What the model says about itself

The model is explicit about its limits, and an assessment that treats it as a checklist ignores them.

- It is a guide: "This maturity model should not be viewed as a strict set of requirements but as a general guide."[^c03-ztmm]
- It is generally aligned to "a federal enterprise's single administrative domain or accreditation boundary," but agencies "should also assess how their interactions with and reliance upon external partners, stakeholders, and service providers factor into their ZTA."[^c03-ztmm] [Chapter 06](06-beyond-microsoft-365.md) takes that sentence to its conclusion.
- It does not address incident response, "specifics for logging, monitoring, alerting, forensic analysis, risk acceptance, recovery," challenges specific to operational technology, or certain classes of IoT devices.[^c03-ztmm]
- It tells agencies to assess their current systems, resources, infrastructure, personnel and processes "before investing in zero trust capabilities."[^c03-ztmm] That instruction is the basis for the read-only assessment in [Chapter 09](09-running-the-assessment.md), and for closing known gaps first in [Chapter 08](08-close-before-you-assess.md).
- It warns that agencies "should be careful to not create new opportunities for exploitation or weaken security protocols" as they mature each pillar.[^c03-ztmm] [Chapter 06](06-beyond-microsoft-365.md) applies the warning to the unification layer itself.

## What SP 800-207 contributes

NIST SP 800-207 is the architecture both other documents assume. The maturity model quotes its definitions and lists its seven tenets; M-22-09 takes its three deployment approaches from it.[^c03-ztmm][^c03-m2209] It is guidance, not a mandate, and three parts of it matter most to this book.

The tenets put the decision in a policy, not a place. Access to each resource is granted per session; access is determined by dynamic policy that weighs client identity, the application or service and the state of the requesting asset; the enterprise "monitors and measures the integrity and security posture of all owned and associated assets"; and "all communication is secured regardless of network location."[^c03-sp207] NIST adds that the tenets "attempt to be technology agnostic."[^c03-sp207]

The logical components separate deciding from enforcing. A policy engine makes the access decision, a policy administrator establishes or shuts down the communication path, and a policy enforcement point enables, monitors and terminates the connection.[^c03-sp207] [Book 04](../b04-access/index.md) maps these onto Conditional Access and its enforcement points.

The network assumptions extend the architecture past the agency's own infrastructure. SP 800-207 assumes that "not all enterprise resources are on enterprise-owned infrastructure," and that assets and workflows moving between enterprise and non-enterprise infrastructure "should have a consistent security policy and posture," including workloads "migrating from on-premises data centers to nonenterprise cloud instances."[^c03-sp207] It also warns what happens without the knowledge the policy engine needs: "Incomplete knowledge will most often lead to a business process failure where the PE denies requests due to insufficient information."[^c03-sp207] That is the architectural reason a whole-agency program needs one inventory and one naming plane ([Chapter 06](06-beyond-microsoft-365.md)).

NIST's practice guide, SP 1800-35 (final June 2025), demonstrates 19 example zero trust implementations built with commercial technology from 24 collaborators, consistent with SP 800-207.[^c03-sp1800] It shows that the architecture can be built in many ways. It doesn't add requirements.

## Requirements that are cited but don't exist

Claims like these circulate in proposals, vendor material and earlier drafts of this program's own documents. They are listed so a reviewer can recognize them.

| Claimed requirement | What the record shows |
|---|---|
| M-22-09 or FedRAMP requires a particular maturity stage, such as Advanced | M-22-09 organizes specific actions by the model's pillars and sets no stage; the model calls itself a general guide.[^c03-m2209][^c03-ztmm] FedRAMP certifies cloud services and leaves each agency to authorize its own systems.[^c03-fedramp] |
| The maturity model's Identity pillar requires certificate-based authentication at Advanced or Optimal | Advanced names passwordless MFA "via FIDO2 or PIV" as examples; Optimal requires continuous validation with phishing-resistant MFA.[^c03-ztmm] |
| "M-22-09 §4" | M-22-09 has sections I (Overview), II (Executive Summary) and III (Actions), with the pillar actions at §III.A to §III.E and policy alignment at §III.F.[^c03-m2209] |
| A federal Zero Trust score, or a tool whose output certifies Zero Trust maturity | No federal document defines a score. The model describes stages per function and pillar; M-22-09 sets actions.[^c03-ztmm][^c03-m2209] Assessment tools are evidence inputs ([Chapter 05](05-two-assessment-tools.md), [Chapter 10](10-evidence-not-verdicts.md)). |
| M-22-09 requires ScubaGear or any SCuBA tool | M-22-09 predates SCuBA's directive; the requirement to deploy SCuBA assessment tools comes from BOD 25-01 ([Chapter 04](04-scuba-and-bod-25-01.md)).[^c03-bod2501] |
| Inline decryption of all traffic is required for Zero Trust | M-22-09: current OMB policies "neither require nor prohibit inline decryption of enterprise network traffic."[^c03-m2209] |
| SP 800-207 makes the policy decision "infrastructure-agnostic" | SP 800-207 says its tenets "attempt to be technology agnostic" and that assets moving between enterprise and non-enterprise infrastructure should keep a consistent policy and posture.[^c03-sp207] The consequence for a multi-platform estate is the program's reading, developed in [Chapter 06](06-beyond-microsoft-365.md). |
| M-21-31 event-logging tiers (EL0 to EL3) still govern the Data pillar's logging action | M-26-14 rescinded M-21-31 on May 22, 2026.[^c03-m2614] |

## The design contract the program takes from the mandates

The documents set a target and leave the architecture to the agency. The program fills that space with a short design contract that every book applies. These are the program's positions, consistent with the documents above but not required by them.

1. **Every decision is anchored to an identity that is verified, not assumed.** Every access decision, certificate event and governance decision traces to an identity proven by cryptographic evidence, independent corroboration or explicit governance authorization. Bindings are untrusted until one of those backs them.
2. **Identity is necessary, not sufficient.** Decisions evaluate several signals together, as SP 800-207's tenets and M-22-09's device-signal floor describe, and they re-evaluate during a session.
3. **Privileged identity has controls of its own.** Administrative access is separately tiered, time-bound and monitored ([Book 04](../b04-access/index.md)).
4. **Continuous evidence is a governance property, not a tool feature.** Evidence is produced by how the agency runs, and assessment tools sample it ([Chapter 10](10-evidence-not-verdicts.md)).
5. **Governance enforces; it doesn't only observe.** A finding has an owner, a deadline and a closure record, or it isn't governance ([Chapter 02](02-governance-principles.md)).
6. **The program sits above the systems already running.** It normalizes their identity-linked signals and enforces traceable outcomes across them without requiring a rip-and-replace, so the same contract applies to the Microsoft cloud, other clouds, the network and virtualized estates.

The contract is meant to close controls rather than describe intent: access control (the AC family), continuous monitoring (CA-7, SI-4) and incident response (IR-4), by making each access decision an identity-anchored evaluation that can be regenerated and shown to an assessor. [Appendix A](appendix-a-requirements-mapping.md) lists the controls and the books that carry the evidence.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 02 — Governance Principles for Zero Trust](02-governance-principles.md) · [Book index](index.md) · [Next: Chapter 04 — SCuBA and BOD 25-01 →](04-scuba-and-bod-25-01.md)
:::

[^c03-eo14028]: Executive Order 14028, *Improving the Nation's Cybersecurity*, May 12, 2021, 86 Fed. Reg. 26633, §3(a), §3(b)(ii) and §10(k), <https://www.govinfo.gov/content/pkg/FR-2021-05-17/pdf/2021-10460.pdf> (accessed Oct 21, 2026).
[^c03-m2209]: Office of Management and Budget, M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022, §II, §III (introduction), §III.A to §III.F and Appendix B, <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf> (accessed Oct 21, 2026).
[^c03-ztmm]: Cybersecurity and Infrastructure Security Agency, *Zero Trust Maturity Model*, Version 2.0, April 2023, Table 1 (Revision History), §1, §2, §5 (stage criteria and cross-cutting capabilities), §5.1 to §5.6 (Tables 2 to 7), <https://www.cisa.gov/sites/default/files/2023-04/zero_trust_maturity_model_v2_508.pdf> (accessed Oct 21, 2026).
[^c03-ztmm-page]: Cybersecurity and Infrastructure Security Agency, "Zero Trust Maturity Model" (page marked "Archived Content"; Version 2.0 download; Federal Zero Trust Resource Hub), <https://www.cisa.gov/zero-trust-maturity-model> (accessed Oct 21, 2026).
[^c03-sp207]: National Institute of Standards and Technology, SP 800-207, *Zero Trust Architecture*, August 2020, §2.1 (Tenets), §2.2 (A Zero Trust View of a Network), §3 (Logical Components), §3.1 and §7.3, <https://csrc.nist.gov/pubs/sp/800/207/final> (accessed Oct 21, 2026).
[^c03-sp1800]: National Institute of Standards and Technology, SP 1800-35, *Implementing a Zero Trust Architecture*, final June 10, 2025, <https://csrc.nist.gov/pubs/sp/1800/35/final> (accessed Oct 21, 2026).
[^c03-m2614]: Office of Management and Budget, M-26-14, *Ensuring Effective and Efficient Agency Logging and Network Visibility to Defend Against Evolving Cyber Threats*, May 22, 2026 (rescinds M-21-31; Appendix A, "Alignment with zero trust"), <https://www.whitehouse.gov/wp-content/uploads/2026/05/M-26-14-Ensuring-Effective-and-Efficient-Agency-Logging-and-Network-Visibility-to-Defend-Against-Evolving-Cyber-Threats.pdf> (accessed Oct 21, 2026).
[^c03-omb-index]: Office of Management and Budget, "Memoranda" (index of OMB memoranda, including M-25-10 to M-25-36, M-26-01 to M-26-19 and M-27-01), <https://www.whitehouse.gov/omb/information-resources/guidance/memoranda/> (accessed Oct 26, 2026).
[^c03-fedramp]: FedRAMP, "Using a FedRAMP Certified Cloud Service," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/agencies/use/> (accessed Oct 21, 2026).
[^c03-bod2501]: Cybersecurity and Infrastructure Security Agency, Binding Operational Directive 25-01, *Implementing Secure Practices for Cloud Services*, December 17, 2024, <https://www.cisa.gov/news-events/directives/bod-25-01-implementing-secure-practices-cloud-services> (accessed Oct 21, 2026).
