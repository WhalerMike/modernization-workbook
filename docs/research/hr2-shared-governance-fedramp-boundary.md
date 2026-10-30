---
title: "Federal HR 2.0 Across Agencies and Boundaries: Shared Governance, FedRAMP's 2026 Rules and What Oracle Publishes"
subtitle: "An explainer: where agencies can share HR 2.0 implementation work, what the FedRAMP Consolidated Rules for 2026 change about the boundary, what they don't make public, where Oracle's HR platform stands today, FIPS validated cryptography at Moderate, and the domains Oracle's government cloud uses"
description: "Research under review. It covers the forums Federal HR 2.0 provides for agencies to share implementation work and who runs them. It covers what the FedRAMP Consolidated Rules for 2026 require a provider to publish about its assessment scope, when those rules reach existing Rev5 packages, and what can stay restricted. It sets out where Oracle Fusion Cloud's Marketplace record stands, what still limits HR data crossing from the platform to an agency system, FIPS 140 at Moderate, and Oracle's .com government domains, with questions an agency can put to OPM and Oracle."
research-status: in review
research-type: explainer
research-book: "Book 10"
date-modified: 2026-10-30
last-reviewed: 2026-10-30
---

# Federal HR 2.0 Across Agencies and Boundaries: Shared Governance, FedRAMP's 2026 Rules and What Oracle Publishes {.unnumbered}

Federal HR 2.0 puts every civilian agency's core HR on one Oracle Fusion Cloud HCM platform that OPM runs ([Book 03, Chapter 03](../books/b03-hr-identity/03-federal-hr-2-0.md)). Two questions follow for an agency building its identity feed from it ([Book 03, Chapter 05](../books/b03-hr-identity/05-the-provisioning-pipeline.md)):

1. **Can agencies share their implementation work with each other?** That covers configurations, integrations, the identity feed and lessons learned.
2. **Has FedRAMP's move to the 2026 rules settled what crosses the boundary?** More precisely: the rules change what may cross, but do they ensure that the provider hosting HR 2.0 has *documented*, rather than *restricted*, information about what its boundary holds?

[Book 10, Chapter 03](../books/b10-cloud-boundary/03-what-changed-at-fedramp.md) sets out what the Consolidated Rules for 2026 changed. This page applies it to the HR 2.0 platform.

::: {.callout-note}
## Sources and labels
Every fact was checked against primary sources on October 30, 2026, and is footnoted. FedRAMP's rules file (version 2026.10.13.01) and Marketplace data (updated October 30, 2026) were downloaded and parsed directly. Statements marked *(inference)* are conclusions the sources support but don't state; *(design guidance)* marks the program's recommendations. Some OPM slides cited here are publicly posted but marked "draft – pre-decisional"; they're cited as what OPM showed agencies, not as settled policy. Agencies are named only as cited sources; nothing here is endorsed by any agency.
:::

## What the research found

- **Agencies have seats, but every forum is OPM's.** The memo creates a Federal HR 2.0 Advisory Board "comprising key stakeholder agencies."[^hb-memo] The solicitation sets out a Steering Committee, a Customer Advisory Board whose members "represent their agency," and Policy, Data and Super User working groups, with OPM chairing both boards.[^hb-pws-gov] No public forum lets agencies share configurations or integrations with each other directly, and none of these bodies publishes its output.
- **Solutions spread from the top.** The Steering Committee approves every agency-specific integration and customization, and will "enforce configuration patterns and reusable templates across all agencies."[^hb-pws-cust][^hb-pws-appb] All agencies run one "common federal baseline configuration."[^hb-pws-base] OPM's program office is the "primary integrator," including for identity management.[^hb-pws-gpmo] An agency's identity feed is therefore something the program approves and may make a reusable pattern, not something agencies trade among themselves *(inference)*.
- **The hypothesis about the boundary is half right.** The 2026 rules do require every certified provider, Rev5 included, to publish a service list "complete enough for a potential customer to determine which services are and are not included" in its assessed scope.[^hb-cds] But:
  - that duty reaches existing Rev5 packages only from 2027, with a grace period to February 1, 2028;[^hb-cds-dates]
  - the scope documentation itself stays in the certification package, shared through a trust center with "all necessary parties," which needn't include an agency that isn't yet a customer;[^hb-cds][^hb-defs]
  - FedRAMP treats that material as "the provider's intellectual property and is not federal information."[^hb-cds]
- **Oracle publishes neither the list nor the scope today.** Oracle's Fusion Cloud record (package F1603257882, Moderate, agency path, certified January 13, 2020) has no trust center, no certified-services list and no third-party resources entered. No Oracle listing has a trust center, and none names OPM.[^hb-mkt] Oracle's award release calls the platform "FedRAMP-authorized" without naming a package.[^hb-ora-award] Which package covers OPM's Core HCM instance still can't be confirmed from public sources.
- **The rules document data leaving the scope; they don't stop it.** A provider documents its information flows and third-party resources;[^hb-mas] material outside the offering is simply "not FedRAMP Certified."[^hb-mas] The limits on HR data crossing into an agency system come from elsewhere:
  - the agency's own authorization;[^hb-agency-use]
  - privacy law, which FedRAMP "does not replace";[^hb-m2415]
  - the CUI rule;[^hb-cui]
  - information-exchange agreements;[^hb-sp80047]
  - the program's API gateway requirement.[^hb-pws-gw]
- **Validated cryptography at Moderate is a SHOULD in FedRAMP and a must for the agency.** Under the 2026 rules, Class C (Moderate) providers "SHOULD use" modules with active validations; only Class D must.[^hb-cmu] NIST's validation program says "if cryptography is required, then it must be validated," for all federal agencies.[^hb-cmvp] FIPS 140-2 validations move to the historical list after September 21, 2026.[^hb-cmvp-transition]
- **Oracle's government cloud is `.com`, not `.us`.** Oracle's US Government and US Defense cloud regions sign in at hosts such as `console.us-langley-1.oraclegovcloud.com`.[^hb-oci-gov][^hb-oci-dod] Oracle doesn't publish the Fusion Applications hostname pattern for its restricted regions.[^hb-ora-url] Microsoft's GCC High uses `.us` endpoints, and GCC uses the worldwide `.com` ones.[^hb-ms-deploy]

## Part 1: Where agencies can share HR 2.0 work

### The forums the program provides

| Body | Source | Who sits on it | What it does |
|---|---|---|---|
| **Federal HR 2.0 Advisory Board** | Memo, p. 3 | "key stakeholder agencies"; the CHCO Council reports an advisory board of CHCOs and federal CIOs for HR IT modernization | "assist with governance and change management"[^hb-memo][^hb-chcoc-report] |
| **Interagency working groups** | Memo, Appendix C | Agency representatives | Policy, Data, Learning and Super User groups that "meet regularly to address agency readiness, migration, and testing coordination"[^hb-memo] |
| **Executive sponsorship** | Solicitation §2.1 | The OMB and OPM Directors | Final authority over major configurations and customizations[^hb-pws-gov] |
| **Steering Committee** | Solicitation §2.1, §5.6, App. B | "senior leaders"; membership and charter not published | Recommendations; approves agency-specific integrations and customizations; enforces configuration patterns and reusable templates[^hb-pws-gov][^hb-pws-cust][^hb-pws-appb] |
| **Customer Advisory Board** | Solicitation §2.1 | Members who "represent their agency" | "formal open communication from the program to agency customers"; OPM chairs it with the Steering Committee, and both meet at least monthly[^hb-pws-gov] |
| **Policy, Data and Super User working groups** | Solicitation §2.1 | Agency representatives | The Data group covers migration and integration strategy "within and across federal agencies"[^hb-pws-gov] |
| **Government-wide program management office** | Solicitation §5.2 | OPM, with the vendor | The "primary integrator" for agencies, including identity management, single sign-on, integration and data migration; data readiness managed jointly with each agency[^hb-pws-gpmo] |

: The HR 2.0 forums in the memo and the solicitation {.striped .hover}

OPM's agency priority goal for Core HCM lists an "Interagency executive investment and advisory board" among its stakeholders, with the CHCO Council, the HR Line of Business and the HR Quality Service Management Office.[^hb-apg]

### Bodies that exist but have no stated HR 2.0 role

- **The CHCO Council.** The statute tasks it with advising and coordinating agencies' activities, including the modernization of human resources systems,[^hb-hsa] and its charter lets it form working groups and share promising practices.[^hb-chcoc-charter] Its 2025 report lists one new working group, on a different topic.[^hb-chcoc-report]
- **The HR Line of Business.** Its multi-agency executive steering committee sets up communities of practice,[^hb-hrlob-maesc] and its human capital standards are the ones the solicitation requires the configuration to follow.[^hb-hrlob][^hb-fibf] Its pages don't mention Core HCM.
- **The HR Quality Service Management Office.** OPM's office under M-19-16 continues, with a "customer engagement and feedback model."[^hb-qsmo][^hb-m1916] The solicitation's answers give it change control of the HR data model.[^hb-qa1]
- **No change control board.** The answers say none is defined.[^hb-qa2]

### After the award

OPM's Core HCM page and award release describe no onboarding playbook, agency liaison model or community.[^hb-opm-core][^hb-opm-award] The publicly posted material reaches agencies through OPM's quarterly eOPF "Agency Touchpoint":
- the June 2026 questions and answers send Core HCM questions to each Wave 1 agency's point of contact or the program mailbox;[^hb-touch-jun]
- a June 2026 slide, marked draft and pre-decisional, mentions "governance and working group formation";[^hb-touch-deck]
- the March deck sets out the program's principles, including a single ATO for which agencies don't need their own.[^hb-touch-mar]

### What this means for an agency's identity feed

*(Inference and design guidance.)* The Steering Committee approves the identity feed as an agency-specific integration, and it may turn the approved pattern into a reusable template for other agencies. So:
1. **Bring the feed to the program early, as a pattern.** Submit Book 03's pipeline (Core HCM to a middleware in the agency boundary to Entra ID) as an integration others can reuse, not as an exception. The [HCM implementation guide](hcm-entra-implementation.md#what-the-solicitation-says-about-identity) records that the solicitation already shows an "Identity Management Solution" fed by Core HCM in its sample interconnection.
2. **Use the Data working group and the Customer Advisory Board** to ask which identity integrations other agencies have had approved, since nothing is published.
3. **Keep the agency-owned parts agency-owned:** the enterprise person key, the canonical schema, the middleware and the contractor source. Book 03 designs these to outlast any one HR source ([Chapter 04](../books/b03-hr-identity/04-attribute-authority.md#one-person-layered-identifiers)), and they're the part another agency can reuse without the program.

## Part 2: What FedRAMP's 2026 rules publish, and what stays restricted

### Three tiers of information

The Consolidated Rules for 2026 sort a provider's information into three tiers:

| Tier | What it holds | Who sees it | Rule |
|---|---|---|---|
| **Public** | Offering information in human-readable and JSON form: the service list, a link to secure configuration guidance, the trust center landing page | Anyone | MUST: "Providers MUST publicly share up-to-date information about the cloud service offering in both human-readable and JSON formats"; the service list "MUST be complete enough for a potential customer to determine which services are and are not included in the FedRAMP Minimum Assessment Scope"[^hb-cds] |
| **Trust center** | The certification package and certification data, including the Minimum Assessment Scope documentation, information flows and third-party resources | "All necessary parties": always FedRAMP and current agency customers; potential agency customers "should also be included in most cases but this is not a mandatory requirement" | MUST use a FedRAMP-compatible trust center;[^hb-cds] the scope is "documented by the cloud service provider in their FedRAMP Certification Package"[^hb-mas][^hb-defs] |
| **On request** | Package access for a requesting agency | The requesting agency | SHOULD supply it; a denial MUST be reported to FedRAMP within 5 business days[^hb-cds] |

: What a provider must publish, and to whom, under the 2026 rules {.striped .hover}

The rules also say certification data shouldn't include detail "that would likely enable a threat actor to gain unauthorized access,"[^hb-cds] and that the information "usually remains the provider's intellectual property and is not federal information."[^hb-cds] Publishing more is the provider's choice: "Providers MAY responsibly share some or all of the information in a FedRAMP Certification Package publicly."[^hb-cds]

The law asks GSA for the same transparency: boundary guidance must "promote transparency for agencies and users as to which services are included in the scope of a FedRAMP authorization."[^hb-usc3609]

### When the rules reach a Rev5 package

The rules are tagged for both 20x and Rev5, but an existing Rev5 certification adopts them on a schedule:

| Rule family | Rev5: obtaining | Rev5: maintaining | Grace period ends |
|---|---|---|---|
| Certification Data Sharing (the public list, the trust center) | 2027-01-01 | 2027-08-01 | 2028-02-01, a fixed date[^hb-cds-dates] |
| Minimum Assessment Scope | 2027-01-01 | 2027-01-01 | At the first independent assessment started after 2027-01-01[^hb-mas-dates] |
| Cryptographic Module Use | 2027-01-01 | 2027-01-01 | 2027-06-01[^hb-rules] |

: When the 2026 rules apply to existing Rev5 certifications {.striped .hover}

FedRAMP's adoption notice says existing Rev5 certifications adopt the new approach during the first assessment "that is completed after January 1, 2027";[^hb-ntc13] the scope rules say "started after."[^hb-mas-dates] The two FedRAMP sources disagree, and the difference can move a provider's date by most of a year *(inference)*. The notice gives no end date for Rev5 itself, only that it "is likely to be no later than 2029."[^hb-ntc13]

### Oracle's HR platform today

| Marketplace field | Oracle Fusion Cloud, F1603257882 |
|---|---|
| Status | FedRAMP Certified, ongoing certification |
| Class and impact | Class C, Moderate |
| Path | Agency |
| Certified | January 13, 2020 |
| Authorizations | 10 (9 reuses); OPM isn't among the named agencies |
| Deployment | Government Community Cloud, SaaS |
| Trust center | none |
| Certified services list | empty |
| Third-party information resources | none entered |
| Secure configuration guidance | none entered |

: Oracle Fusion Cloud's FedRAMP Marketplace record, October 30, 2026[^hb-mkt] {.striped .hover}

- **Across Oracle.** None of Oracle's eight Marketplace listings has a trust center; across the Marketplace, 117 of 778 listings do.[^hb-mkt] Oracle's high-impact listing is its cloud infrastructure for government, not a SaaS offering.[^hb-mkt]
- **Separate offerings.** The Fusion description names complementary services, such as integration and other platform services on Oracle's government cloud infrastructure, as separate offerings.[^hb-mkt]
- **Oracle's own pages.** Its compliance page points to the Marketplace and says attestations come through "your Oracle sales representative."[^hb-ora-compliance] No public page describing the Fusion US Government scope was found.

So, as of October 30, 2026 *(inference)*: the information that would show which Fusion services, integration paths and third-party resources are inside the platform's assessed scope is restricted. An agency that isn't yet a customer can't read it without asking, and Oracle isn't yet required to publish even the service list.

### What still restricts HR data crossing to the agency

The rules make the provider *document* data leaving its scope: information flows, security categories and third-party resources must be identified and explained.[^hb-mas] They don't forbid it. A third-party resource is "Any information resource that is not entirely included in the Minimum Assessment Scope,"[^hb-defs] and supplementary material outside the offering "will not be FedRAMP Certified."[^hb-mas] What actually limits an identity feed from Core HCM to an agency's directory:

| Limit | Source | Effect on the HR-to-identity feed |
|---|---|---|
| The agency's own authorization | FedRAMP's agency rules: "An agency should never create a standalone authorization to operate for a cloud service offering"; the agency integrates the service securely, including identity[^hb-agency-use] | The middleware and directory sit in the agency's system and its ATO, not the platform's |
| The program's single ATO and API gateway | The solicitation: one OPM ATO; persistent integrations through an OPM-hosted API gateway with OAuth 2.0, rate limiting and IP filtering[^hb-pws-gw] | The feed's path and credentials are OPM's to set |
| Privacy Act and the governing notices | M-24-15: FedRAMP "does not replace other legal, Executive Order, regulatory, or OMB-issued compliance requirements"[^hb-m2415] | A disclosure basis and notice coverage ([Book 03, Appendix B](../books/b03-hr-identity/appendix-b-security-and-privacy.md)) |
| CUI | CUI Basic is "no less than the moderate confidentiality impact level"; written agreements "whenever feasible"[^hb-cui] | The receiving system is at least Moderate for any CUI it holds |
| Information-exchange agreement | NIST SP 800-47 Rev. 1: managing the protection of exchanged information "before, during, and after the exchange"[^hb-sp80047] | An agreement between the agency and the program for the feed |

: What limits HR data crossing from the platform to an agency system {.striped .hover}

M-24-15 asks agencies to "presume the security assessment documented in the authorization package is adequate for their use," but only "as long as a FedRAMP authorization is actively maintained."[^hb-m2415] It places the duty to make artifacts accessible on GSA and agencies, not on providers.[^hb-m2415]

## Part 3: FIPS validated cryptography at Moderate

| Source | What it says | Strength |
|---|---|---|
| FedRAMP 2026 rules, Class C (Moderate) | "Providers with Class C Certifications SHOULD use cryptographic modules or update streams of cryptographic modules with active validations"[^hb-cmu] | SHOULD (MUST only at Class D) |
| FedRAMP 2026 rules, Classes B–D | Document each service's modules, "including whether these modules are validated under the NIST Cryptographic Module Validation Program"[^hb-cmu] | MUST |
| FedRAMP 2026 rules, agency tenants | Configure agency tenants by default to use validated modules[^hb-cmu] | SHOULD |
| FedRAMP's SC-13 guidance | "Follow the FedRAMP Cryptographic Module Use rules"[^hb-rules] | Points to the above |
| NIST SP 800-53 Rev. 5, SC-13 | The organization defines the types of cryptography for each use; generally applicable standards include FIPS-validated cryptography[^hb-sp80053] | Organization-defined |
| NIST CMVP | "if cryptography is required, then it must be validated"; FIPS 140-2 and 140-3 "are applicable to all U.S. Federal agencies"[^hb-cmvp] | Required for the agency |
| FIPS 140-2 transition | 140-2 validations move to the historical list after September 21, 2026, usable "for existing systems only"[^hb-cmvp-transition] | Date |

: FIPS validated cryptography at Moderate {.striped .hover}

*(Inference.)* For a civilian agency at Moderate, FedRAMP's SHOULD is weaker than the agency's own obligation. The agency's authorizing official still needs validated modules wherever cryptography protects the HR feed, and from 2027 the provider's module documentation is how the agency checks. NIST's transition page puts the FIPS 140-2 date at September 21 in its text and September 22 in its schedule table;[^hb-cmvp-transition] either way, modules validated only under 140-2 are now historical, usable for existing systems. Whether DoD's cloud security requirements add more wasn't checked; this page covers civilian agencies.

## Part 4: `.com` or `.us`

| Cloud | Hostnames Oracle or Microsoft documents |
|---|---|
| Oracle US Government Cloud | `console.us-langley-1.oraclegovcloud.com`, `identity.us-langley-1.oraclegovcloud.com`[^hb-oci-gov] |
| Oracle US Defense Cloud | `console.us-gov-ashburn-1.oraclegovcloud.com`[^hb-oci-dod] |
| Oracle commercial | `oraclecloud.com`; Fusion Applications `systemName.fa.<dc>.oraclecloud.com`, "for commercial regions only. In restricted regions … the patterns are different"[^hb-ora-url] |
| Microsoft 365 GCC | The worldwide `.com` endpoints[^hb-ms-deploy] |
| Microsoft GCC High and DoD | `graph.microsoft.us`, `login.microsoftonline.us`; `dod-graph.microsoft.us`[^hb-ms-deploy] |

: Government cloud domains {.striped .hover}

Oracle's two government infrastructure pages show no `.us` or `.mil` hostname.[^hb-oci-gov][^hb-oci-dod] Oracle requires government customers to "bring your own identity provider that meets your agency's compliance requirements and supports common access card/personal identity verification card (CAC/PIV)."[^hb-oci-info]

*(Inference.)* The domain matters at the boundary in three places:
- **Egress allow-lists.** The agency's middleware calls the platform, so its outbound proxy and network policy name the hosts it may reach.
- **Identity configuration.** Sign-in redirects and federation metadata name the hosts.
- **Certificate pinning.** The middleware may pin the platform's certificates.

A government-only suffix such as `oraclegovcloud.com` or Microsoft's `.us` lets a rule name government endpoints exactly. If the HR platform's Fusion hosts sit under `oraclecloud.com`, a suffix rule can't tell government from commercial, and the agency has to allow each host by name. Oracle doesn't publish the Fusion government hostname, so ask.

## Questions to ask

1. **OPM (program office):** which FedRAMP package, and which impact level, covers the Core HCM instance? Is it F1603257882?
2. **OPM:** who sits on the Steering Committee and the Customer Advisory Board, and will approved agency integrations, including identity feeds, be published to other agencies as reusable templates?
3. **OPM:** does the agency identity feed pass through the OPM API gateway? What hostnames, authentication and IP ranges should agencies allow?
4. **Oracle:** when will Fusion Cloud publish its service list and a FedRAMP-compatible trust center under the 2026 rules? Will agencies that aren't yet customers get trust-center access?
5. **Oracle:** for the HR platform, which services and third-party resources are inside the assessed scope? Is Oracle Integration Cloud or another separate offering in the data path to agencies?
6. **Oracle:** which cryptographic modules protect data in transit and at rest, and are their validations active under FIPS 140-3?
7. **Oracle:** what is the Fusion Applications hostname pattern for the US Government region hosting the HR platform?
8. **FedRAMP:** "completed after" or "started after" January 1, 2027 for Rev5 adoption?

## What couldn't be verified

- **Which package covers OPM's Core HCM instance.** No Marketplace record names OPM, and the award releases name no package.
- **Steering Committee and advisory board membership and charters.** None are published.
- **A Core HCM onboarding playbook or agency community.** None found on opm.gov, the CHCO Council's pages or the eOPF help desk.
- **The Fusion US Government hostname.** Oracle says only that restricted-region patterns differ.
- **Any statement that no Oracle government service uses `.us`.** Only the two infrastructure pages were scanned.
- **The legacy FedRAMP Rev5 Moderate SC-13 parameter, and DoD's additional requirements.** Neither could be loaded from an allowed source.
- **The FedRAMP Authorization Act's sunset.** The code notes repeal 44 U.S.C. 3607–3616 five years after December 23, 2022;[^hb-usc3609] whether Congress has extended it couldn't be checked (congress.gov refused automated access).
- **OPM's personnel-records notice text.** Not reloaded here; [Book 03](../books/b03-hr-identity/appendix-b-security-and-privacy.md) and the [contractor-source research](oracle-contingent-worker-contractor-source.md#privacy-act) cite it.

## Status and review

**In review.** Checked on October 30, 2026, against:
- the Federal HR 2.0 memo, the solicitation's final amendment and its answers;
- OPM's priority goals, budget justification and program pages, and the CHCO Council's charter and 2025 report;
- the eOPF Agency Touchpoint materials;
- FedRAMP's 2026 rules, definitions, notices and Marketplace data;
- 44 U.S.C. chapter 36, M-24-15, M-19-16, 32 CFR part 2002, NIST SP 800-47 Rev. 1, SP 800-53 Rev. 5 and the CMVP pages;
- Oracle's and Microsoft's documentation.

To move it to **Proved**, record OPM's and Oracle's answers to the questions above on this page, and re-check the Marketplace record after Oracle's first assessment under the 2026 rules.

Related:
- [Book 10, Chapter 03 — What Changed at FedRAMP](../books/b10-cloud-boundary/03-what-changed-at-fedramp.md)
- [Book 03, Chapter 03 — Federal HR 2.0](../books/b03-hr-identity/03-federal-hr-2-0.md)
- the implementation guide [Building Book 03's HR Pipeline](hcm-entra-implementation.md)
- [Contractors as Oracle Contingent Workers](oracle-contingent-worker-contractor-source.md)

[^hb-memo]: Office of Management and Budget and Office of Personnel Management, *Creating "Federal HR 2.0" by Consolidating Core Human Capital Management Across the Federal Government*, December 10, 2025 (p. 3: "OMB and OPM will stand up a Federal HR 2.0 Advisory Board comprising key stakeholder agencies to assist with governance and change management"; p. 6, Appendix C: Policy, Data, Learning and Super User working groups), <https://www.opm.gov/chcoc/latest-memos/creating-federal-hr-20-by-consolidating-core-human-capital-management-across-the-federal-government.pdf>, accessed October 30, 2026.
[^hb-pws-gov]: Office of Personnel Management, Solicitation 24322626R0007, *Federal HRIT Modernization*, Amendment 4 (posted December 11, 2025), Performance Work Statement §2.1, Governance Structure (pp. 18–19: executive sponsorship, Steering Committee, Customer Advisory Board, Policy, Data and Super User working groups, Core HCM Program Office; OPM chairs the Steering Committee and Customer Advisory Board, which convene at least monthly), SAM.gov, <https://sam.gov/api/prod/opps/v3/opportunities/resources/files/88d26ce7f2e943a88e95d70c6510f62f/download>, accessed October 30, 2026.
[^hb-pws-cust]: Office of Personnel Management, Solicitation 24322626R0007, Amendment 4, PWS §5.6 (p. 41: customizations approved by the Steering Committee; "enforce configuration patterns and reusable templates across all agencies"), SAM.gov, <https://sam.gov/api/prod/opps/v3/opportunities/resources/files/88d26ce7f2e943a88e95d70c6510f62f/download>, accessed October 30, 2026.
[^hb-pws-appb]: Office of Personnel Management, Solicitation 24322626R0007, Amendment 4, PWS Appendix B (p. 88: the Core HCM Steering Committee reviews and approves agency-specific integration requirements), SAM.gov, <https://sam.gov/api/prod/opps/v3/opportunities/resources/files/88d26ce7f2e943a88e95d70c6510f62f/download>, accessed October 30, 2026.
[^hb-pws-base]: Office of Personnel Management, Solicitation 24322626R0007, Amendment 4, PWS §5.1 (p. 27: "a common federal baseline configuration") and p. 51 (one OPM-approved version for all tenants), SAM.gov, <https://sam.gov/api/prod/opps/v3/opportunities/resources/files/88d26ce7f2e943a88e95d70c6510f62f/download>, accessed October 30, 2026.
[^hb-pws-gpmo]: Office of Personnel Management, Solicitation 24322626R0007, Amendment 4, PWS §5.2 (pp. 31–32: the Governmentwide Program Management Office; OPM as the "primary integrator" for agencies, including identity management, SSO, integration and data migration; p. 36: data readiness managed jointly with each agency), SAM.gov, <https://sam.gov/api/prod/opps/v3/opportunities/resources/files/88d26ce7f2e943a88e95d70c6510f62f/download>, accessed October 30, 2026.
[^hb-pws-gw]: Office of Personnel Management, Solicitation 24322626R0007, Amendment 4, PWS §5.1.1 (p. 26: FedRAMP Moderate or higher; a single OPM ATO) and Appendix B (pp. 82–83: persistent integrations through an OPM-hosted API Management gateway with OAuth 2.0, rate limiting and IP filtering), SAM.gov, <https://sam.gov/api/prod/opps/v3/opportunities/resources/files/88d26ce7f2e943a88e95d70c6510f62f/download>, accessed October 25, 2026 (as verified for the [HCM implementation guide](hcm-entra-implementation.md)).
[^hb-qa1]: Office of Personnel Management, Solicitation 24322626R0007, Questions and Answers, set 1 (Q85: change control of the HR data model with the HR QSMO; Q127: one centrally governed baseline), SAM.gov, <https://sam.gov/api/prod/opps/v3/opportunities/resources/files/fbde5477815f434c91d0e77b8ddac549/download>, accessed October 30, 2026.
[^hb-qa2]: Office of Personnel Management, Solicitation 24322626R0007, Questions and Answers, set 2 (Q360: no change control board defined), SAM.gov, <https://sam.gov/api/prod/opps/v3/opportunities/resources/files/be19b6e56b5e43cdb1ad259d6abfc5f5/download>, accessed October 30, 2026.
[^hb-chcoc-report]: Chief Human Capital Officers Council, *2025 Annual Report to Congress* (PDF p. 13: governance for HR IT modernization, including an advisory board of CHCOs and federal CIOs; PDF p. 10: one new working group established in 2025), <https://www.opm.gov/chcoc/annual-reports/2025-annual-report.pdf>, accessed October 30, 2026.
[^hb-chcoc-charter]: Chief Human Capital Officers Council, *Charter*, effective December 14, 2021 (pp. 2–3: committees and working groups; "Identify and share promising practices"), <https://www.opm.gov/chcoc/chco-council-charter.pdf>, accessed October 30, 2026.
[^hb-hsa]: Homeland Security Act of 2002, Pub. L. 107-296, §1303(b), 116 Stat. 2289 (the Council meets periodically to advise and coordinate agencies' activities, including the modernization of human resources systems), codified at 5 U.S.C. 1401–1402, <https://www.congress.gov/107/plaws/publ296/PLAW-107publ296.pdf>, accessed October 30, 2026.
[^hb-apg]: Office of Personnel Management, *FY 2026–2027 Agency Priority Goals*, March 2026, APG 3 (p. 8: stakeholders including an "Interagency executive investment and advisory board," the CHCO Council, the HR Line of Business and the HR QSMO), <https://www.opm.gov/about-us/reports-publications/opm-fy-2026-2027-agency-priority-goals.pdf>, accessed October 30, 2026.
[^hb-hrlob]: Office of Personnel Management, "Human Resources Line of Business," <https://www.opm.gov/agency-services/hr-governance/hr-line-of-business/>, accessed October 30, 2026.
[^hb-hrlob-maesc]: Office of Personnel Management, HR Line of Business, "MAESC and Governance" (the multi-agency executive steering committee; communities of practice), <https://www.opm.gov/agency-services/hr-governance/hr-line-of-business/maesc-and-governance/>, accessed October 30, 2026.
[^hb-fibf]: General Services Administration, Federal Integrated Business Framework, "Human Resources / Human Capital Management" standards, <https://ussm.gsa.gov/fibf-hr-hcm/>, accessed October 30, 2026.
[^hb-qsmo]: Office of Personnel Management, "HR Quality Services Management Office" ("Institute a customer engagement and feedback model that allows for continuous improvement and performance management of solutions"), <https://www.opm.gov/agency-services/hr-governance/hr-quality-services-management-office/>, accessed October 30, 2026.
[^hb-m1916]: Office of Management and Budget, M-19-16, *Centralized Mission Support Capabilities for the Federal Government*, April 26, 2019, <https://www.whitehouse.gov/wp-content/uploads/2019/04/M-19-16.pdf>, accessed October 30, 2026.
[^hb-opm-core]: Office of Personnel Management, "Core HCM," <https://www.opm.gov/agency-services/talent-systems/core-hcm/>, accessed October 30, 2026.
[^hb-opm-award]: Office of Personnel Management, "OPM Awards Contract for First-Ever Governmentwide HR Platform," <https://www.opm.gov/news/news-releases/opm-awards-contract-for-first-ever-governmentwide-hr-platform/>, accessed October 30, 2026.
[^hb-touch-jun]: Office of Personnel Management, eOPF Help Desk, "Agency Touchpoint Q&A – June 2026" (Core HCM questions to Wave 1 agency points of contact or the CoreHCM mailbox), <https://eopfhelpdesk.opm.gov/hc/en-us/articles/53223497231891-Agency-Touchpoint-Q-A-June-2026>, accessed October 30, 2026.
[^hb-touch-deck]: Office of Personnel Management, eOPF Agency Touchpoint presentation, June 24, 2026 (marked "DRAFT – PRE-DECISIONAL," publicly posted; Core HCM update, including governance and working group formation), <https://eopfhelpdesk.opm.gov/hc/en-us/article_attachments/53226772733715>, accessed October 30, 2026.
[^hb-touch-mar]: Office of Personnel Management, eOPF Agency Touchpoint presentation, March 25, 2026, slide 5 (marked draft; guiding principles including a single ATO for which agencies don't require their own), <https://eopfhelpdesk.opm.gov/hc/en-us/article_attachments/50467456710803>, accessed October 30, 2026.
[^hb-cds]: FedRAMP, *Consolidated Rules for 2026*, "Certification Data Sharing" (CDS-CSO-PUB, CDS-CSO-SVC, CDS-CSO-RPS, CDS-CSO-UTC, CDS-CSO-RIS, CDS-UTC-AGA, CDS-UTC-AAD; the family's statement that the information usually remains the provider's intellectual property), <https://www.fedramp.gov/2026/reference/certification-data-sharing/>, and rules file version 2026.10.13.01, <https://github.com/FedRAMP/rules>, accessed October 30, 2026.
[^hb-cds-dates]: FedRAMP, *Consolidated Rules for 2026*, "Certification Data Sharing," Effective Dates, Rev5 (obtaining 2027-01-01; maintaining 2027-08-01; grace period ends 2028-02-01), <https://www.fedramp.gov/2026/reference/certification-data-sharing/>, accessed October 30, 2026.
[^hb-defs]: FedRAMP, *Consolidated Rules for 2026*, "Definitions" ("All Necessary Parties": potential agency customers "should also be included in most cases but this is not a mandatory requirement"; "Third-Party Information Resource": "Any information resource that is not entirely included in the Minimum Assessment Scope"), <https://www.fedramp.gov/2026/definitions/>, accessed October 30, 2026.
[^hb-mas]: FedRAMP, *Consolidated Rules for 2026*, "Minimum Assessment Scope" (MAS-CSO-FLO: information flows and security categories for all information resources; MAS-CSO-TPR: third-party resources; MAS-CSO-SUP: supplementary resources "will not be FedRAMP Certified"; MAS-CSO-IIR note: the scope is documented in the certification package), <https://www.fedramp.gov/2026/reference/minimum-assessment-scope/>, accessed October 30, 2026.
[^hb-mas-dates]: FedRAMP, *Consolidated Rules for 2026*, "Minimum Assessment Scope," Effective Dates, Rev5 (obtaining and maintaining 2027-01-01; "Grace Period Ends: On the first FedRAMP independent assessment started after 2027-01-01"), <https://www.fedramp.gov/2026/reference/minimum-assessment-scope/>, accessed October 30, 2026.
[^hb-rules]: FedRAMP, *Consolidated Rules for 2026*, rules file version 2026.10.13.01 (CMU Rev5 effective dates: obtaining and maintaining 2027-01-01, grace period ends 2027-06-01; SC-13 guidance: "Follow the FedRAMP Cryptographic Module Use rules"), <https://github.com/FedRAMP/rules>, accessed October 30, 2026.
[^hb-ntc13]: FedRAMP, Notice NTC-0013, June 16, 2026 (existing Rev5 certifications adopt the new approach "during their first FedRAMP independent assessment that is completed after January 1, 2027"; the end of Rev5 "has not been finalized but is likely to be no later than 2029"), <https://www.fedramp.gov/notices/0013/>, accessed October 30, 2026.
[^hb-mkt]: FedRAMP Marketplace data, `products.json` (last change 2026-10-30; record F1603257882, Oracle Fusion Cloud, and Oracle's other seven listings; trust-center counts across 778 listings), <https://www.fedramp.gov/marketplace/products.json>, accessed October 30, 2026.
[^hb-ora-award]: Oracle, "US Office of Personnel Management Selects Oracle to Power Federal Workforce Modernization," June 11, 2026 ("an AI-powered, secure, FedRAMP-authorized HR platform"), <https://www.oracle.com/news/announcement/us-office-of-personnel-management-selects-oracle-to-power-federal-workforce-modernization-2026-06-11/>, accessed October 30, 2026.
[^hb-ora-compliance]: Oracle, "Cloud Compliance" (FedRAMP entry points to the Marketplace; "Customers can obtain more information about available attestations by contacting their Oracle sales representative"), <https://www.oracle.com/corporate/cloud-compliance/>, accessed October 30, 2026.
[^hb-agency-use]: FedRAMP, *Consolidated Rules for 2026*, "Using a FedRAMP Certified Cloud Service" ("An agency should never create a standalone authorization to operate for a cloud service offering"; configure and integrate the service securely, including identity, logging, monitoring and data protection), <https://www.fedramp.gov/2026/agencies/use/>, accessed October 30, 2026.
[^hb-m2415]: Office of Management and Budget, M-24-15, *Modernizing the Federal Risk and Authorization Management Program (FedRAMP)*, July 25, 2024, §IV.a (pp. 6–7: the presumption of adequacy, "as long as a FedRAMP authorization is actively maintained"), §IV n. 7 (FedRAMP "does not replace other legal, Executive Order, regulatory, or OMB-issued compliance requirements"), §VII.a(7) (p. 16: GSA to enable agency officials' access to artifacts), <https://www.whitehouse.gov/wp-content/uploads/2024/07/M-24-15-Modernizing-the-Federal-Risk-and-Authorization-Management-Program.pdf>, accessed October 30, 2026.
[^hb-usc3609]: 44 U.S.C. 3609(a)(4) (guidance to "promote transparency for agencies and users as to which services are included in the scope of a FedRAMP authorization"), and the code's note on the effective date of repeal of §§3607–3616 (Pub. L. 117-263, §5921), <https://www.govinfo.gov/content/pkg/USCODE-2024-title44/html/USCODE-2024-title44-chap36-sec3609.htm>, accessed October 30, 2026.
[^hb-cui]: 32 CFR 2002.14(g) ("CUI Basic is categorized at no less than the moderate confidentiality impact level") and 2002.16(a) (dissemination; written agreements "whenever feasible"), eCFR, <https://www.ecfr.gov/current/title-32/subtitle-B/chapter-XX/part-2002>, accessed October 30, 2026.
[^hb-sp80047]: National Institute of Standards and Technology, SP 800-47 Rev. 1, *Managing the Security of Information Exchanges*, July 2021, <https://csrc.nist.gov/pubs/sp/800/47/r1/final>, accessed October 30, 2026.
[^hb-cmu]: FedRAMP, *Consolidated Rules for 2026*, "Cryptographic Module Use" (CMU-CSO-UVM: Class C SHOULD, Class D MUST; CMU-CSO-CMD: document modules and validation status, Classes B–D; CMU-CSO-CAT: validated defaults for agency tenants), <https://www.fedramp.gov/2026/reference/cryptographic-module-use/>, accessed October 30, 2026.
[^hb-sp80053]: National Institute of Standards and Technology, SP 800-53 Rev. 5, SC-13, Cryptographic Protection (statement b and discussion), <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>, accessed October 30, 2026.
[^hb-cmvp]: National Institute of Standards and Technology, "Cryptographic Module Validation Program" ("In essence, if cryptography is required, then it must be validated"; "FIPS 140-2 and FIPS 140-3 requirements are applicable to all U.S. Federal agencies"), <https://csrc.nist.gov/projects/cryptographic-module-validation-program>, accessed October 30, 2026.
[^hb-cmvp-transition]: National Institute of Standards and Technology, "FIPS 140-3 Transition Effort" (FIPS 140-2 validations moved to the historical list after September 21, 2026; usable for existing systems only; the schedule table gives September 22), <https://csrc.nist.gov/projects/fips-140-3-transition-effort>, accessed October 30, 2026.
[^hb-oci-gov]: Oracle, *Oracle Cloud Infrastructure Documentation*, "FedRAMP Authorized Services" for US Government Cloud (regions us-langley-1 and us-luke-1; console and API endpoints on oraclegovcloud.com), <https://docs.oracle.com/en-us/iaas/Content/gov-cloud/govfedramp.htm>, accessed October 30, 2026.
[^hb-oci-dod]: Oracle, *Oracle Cloud Infrastructure Documentation*, US Defense Cloud (regions us-gov-ashburn-1, us-gov-chicago-1, us-gov-phoenix-1; console on oraclegovcloud.com), <https://docs.oracle.com/en-us/iaas/Content/gov-cloud/govfeddod.htm>, accessed October 30, 2026.
[^hb-oci-info]: Oracle, *Oracle Cloud Infrastructure Documentation*, "Information for US Government Cloud Customers" (bring your own CAC/PIV-capable identity provider; customers enable FIPS mode), <https://docs.oracle.com/en-us/iaas/Content/gov-cloud/govinfo.htm>, accessed October 30, 2026.
[^hb-ora-url]: Oracle, *Enterprise Performance Management Cloud*, "Sample URLs" ("This pattern is for commercial regions only. In restricted regions (for example OC2 and OC4), the patterns are different"), <https://docs.oracle.com/en/cloud/saas/enterprise-performance-management-common/cgsad/1_epm_cloud_accessing_sample_urls.html>; and *Oracle Integration*, "Obtain the Event Catalog URL" (Fusion Applications `systemName.fa.<dc>.oraclecloud.com`), <https://docs.oracle.com/en/cloud/paas/application-integration/erp-adapter/obtaining-event-catalog-url.html>, accessed October 30, 2026.
[^hb-ms-deploy]: Microsoft Learn, "Microsoft Graph national cloud deployments" (GCC uses the worldwide endpoints; GCC High `graph.microsoft.us` and `login.microsoftonline.us`; DoD `dod-graph.microsoft.us`), <https://learn.microsoft.com/en-us/graph/deployments>, accessed October 30, 2026.
