# Verification — Chapter 05, The Landing Zone

File: `docs/books/b10-cloud-boundary/05-the-landing-zone.md`
Diagram sources (new): `docs/images/diagrams/b10-cloud-boundary/src/ch05-management-groups.flow.yaml`, `ch05-boundary-to-policy.flow.yaml`.
Sources read: `docs/compliance/Vol_I_Book_01_Cloud_Landing_Zone_IPAM_FedRAMP.md` (landing-zone definition, scope table, SDN sections, boundary-enforcement section), `docs/compliance/Vol_I_Book_00_Foundation_Transport_Overview.md`, `docs/modernization-specs/cloud.md`. The compliance volumes stay in place and are linked by GitHub URL.
Checked 2026-10-21 against Microsoft Learn (CAF landing zone overview, design areas, management groups, subscription vending, implementation options, Deploy Azure landing zones, ALZ FAQ; Azure Policy overview, effect basics, deny effect, built-in definitions, disallowed-resources tutorial, exemption structure, compliance data; FedRAMP Moderate built-in initiative; FedRAMP compliance offering; Azure services in FedRAMP audit scope; Compare Azure Government and global Azure; Virtual Network FAQ), AWS documentation (Organizations SCPs; Control Tower in GovCloud; Landing Zone Accelerator; VPC subnet sizing), NIST SP 800-37 Rev. 2, FedRAMP *Consolidated Rules for 2026* ("Using a FedRAMP Certified Cloud Service"), and FedRAMP Marketplace `products.json` (meta last_change 2026-10-21). Footnote keys below drop the `c05-` prefix.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Azure landing zone = platform landing zone + workload landing zones; definition quote | What a landing zone is | verified | alz |
| 2 | One platform landing zone per Entra tenant; repeatable distribution of workload LZs | What a landing zone is | verified | alz |
| 3 | A landing zone is an individual Azure subscription | What a landing zone is | verified | faq |
| 4 | Eight design areas (named) | What a landing zone is | verified (added; source didn't list them) | design-areas |
| 5 | Accelerators use Bicep/Terraform on Azure Verified Modules; IaC preferred to portal | What a landing zone is | verified | impl |
| 6 | Portal, Bicep and Terraform options supported only in public Azure; manual changes needed for US Government (policies, API versions, resources) | What a landing zone is | verified (added) | deploy |
| 7 | Four substrate planes (naming/addressing, device/crypto identity, org identity, transport) | The substrate | restated-as-design (from Vol I Book 00) | — |
| 8 | Baseline hierarchy: intermediate root, Platform (Security, Management, Connectivity, Identity), Landing zones (Corp, Online, Local), Sandbox, Decommissioned; 30–60 days deletion | Management group hierarchy | verified (current hierarchy includes Security and Local groups) | mg |
| 9 | Flat 3–4 levels; six levels max excluding root and subscription | Management group hierarchy | verified | mg |
| 10 | Don't mirror org chart; no prod/test/dev MGs; no workload RBAC at MG scope; platform access via PIM | Management group hierarchy | verified | mg |
| 11 | Any principal can create MGs by default; new subscriptions go under tenant root; set RBAC authorization and a default MG | Management group hierarchy | verified | mg |
| 12 | Subscription democratization: subscriptions are the primary unit of management and scale | Management group hierarchy | verified | vending |
| 13 | Moving a subscription is a boundary change | Management group hierarchy | restated-as-design | — |
| 14 | Azure and Azure Government both FedRAMP High; High covers all US public Azure regions | Which cloud | verified | scope; fedramp-offering |
| 15 | Marketplace: Azure Commercial Cloud F1209051525 and Azure Government F1603087869, Certified, Class D | Which cloud | verified | fr |
| 16 | Azure Government adds US data-storage and screened-personnel commitments; public High "meets the needs of many" | Which cloud | verified | fedramp-offering |
| 17 | GCC pairs with Entra ID in public Azure; GCC High/DoD with Azure Government | Which cloud | verified via settled books (Book 02 Ch11, Book 01 App B) | linked |
| 18 | ARM endpoint management.azure.com vs management.usgovcloudapi.net | Which cloud | verified | compare |
| 19 | Allowed locations (Audit/Deny/Disabled) excludes resource groups and "global" resources; RG variant exists | Which regions | verified | builtins |
| 20 | Audit-scope tables for Azure and Azure Government last updated February 2026 | Which services | verified | scope |
| 21 | Allowed resource types only affects types supporting tags and location; duplicate with mode All | Which services | verified | builtins; disallowed |
| 22 | Azure Virtual Network Manager not named in either audit-scope table | Which services | verified (absence checked in full page text) | scope |
| 23 | FedRAMP Moderate/High regulatory compliance initiatives for Azure and Azure Government | Which settings | verified | fedramp-offering |
| 24 | "Compliant" refers only to policy definitions; partial view | Which settings | verified | init |
| 25 | Exemption categories Mitigated and Waiver; expiresOn; expired object kept | Which exceptions | verified | exempt |
| 26 | Every exemption carries expiry and decision reference | Which exceptions | restated-as-design | — |
| 27 | Effect evaluation order (disabled, append/modify, deny, audit…; AINE/DINE after success) | Enforcing | verified | effects |
| 28 | Deny returns 403 | Enforcing | verified | deny |
| 29 | MG-assigned policy evaluates only resources in subscriptions/RGs; start with audit | Enforcing | verified | overview |
| 30 | 24-hour standard cycle; ~30 minutes for subscription created/moved | Enforcing | verified | compliance-data |
| 31 | SCPs never grant permissions; max permissions incl. root user; don't affect management account; need all features | AWS | verified | scp |
| 32 | Control Tower in both GovCloud Regions; usable there for workloads that require High | AWS | verified; reworded 2026-10-29 so it no longer reads as GovCloud being only for High (AWS: "You can utilize AWS Control Tower with workloads that require FedRAMP High categorization level in the AWS GovCloud (US) Regions") | ct |
| 33 | CreateGovCloudAccount from commercial management account creates paired accounts; GovCloud org independent; bring existing Audit and Log Archive accounts | AWS | verified | ct |
| 34 | Account Factory Create account removed; new customers can't deploy AFT in GovCloud; some controls ineffective; some Security Hub CSPM controls unavailable; metadata must not contain export-controlled data | AWS | verified | ct |
| 35 | LZA recommended atop Control Tower; supports GovCloud; "will not, by itself, make you compliant" | AWS | verified | lza |
| 36 | Marketplace: AWS GovCloud F1603047866 Class D; AWS US East/West Class C | AWS | verified | fr |
| 37 | Source scope table: Azure Government "GCC Moderate"; AWS GovCloud/Azure Government "FedRAMP High" as the boundary | Multi-environment | corrected: Azure Government is a separate cloud from M365 GCC; the agency's own authorization covers its use, the provider's certification covers the service; table generalized and agency-specific estate removed | fedramp-use; Ch04 |
| 38 | Azure VNets are Layer 3 overlays with no Layer 2 semantics; five reserved addresses | Multi-environment | verified (source's "synthetic DHCP injected by host agent" not carried; couldn't confirm wording) | vnetfaq |
| 39 | AWS reserves five per subnet; DNS server at VPC base +2 | Multi-environment | corrected: source said EC2 gets IPs via "synthetic DHCP at CIDR +2"; +2 is the Amazon DNS server | aws-subnet |
| 40 | Cloud adapter boundary contract (declared boundary or named exception; no hardcoded hostnames; fail closed; endpoint class) | Every automation declares | restated-as-design (from cloud.md) | — |
| 41 | Authorization boundary definition (all components to be authorized; excludes separately authorized connected systems) | What a landing zone can't prove | verified | sp80037 |
| 42 | "each agency still authorizes its own federal information systems"; SSP focuses on what the agency implements, configures, operates, or inherits | What a landing zone can't prove | verified | fedramp-use |
| 43 | Source: FedRAMP 20x Consolidated Rules impose "automated, machine-readable compliance evidence enforced by IaC" on the agency landing zone | (not carried) | removed: the Consolidated Rules govern provider certification; the agency authorizes its own system (Book 01 Ch12; Chapter 03) | fedramp-use |
| 44 | 2026-10-29: AWS US East/West FedRAMP Certified Class C (formerly Moderate), GovCloud (US) Class D (formerly High); services-in-scope marked per service, per Region | AWS | verified (coordinator fact pack, 2026-10-29) | aws-fedramp |
| 45 | 2026-10-29: High baseline contains the Moderate controls, so a Moderate system can run in GovCloud (US) or commercial Regions | AWS | inference (SP 800-53B baselines are cumulative) | aws-fedramp |
| 46 | 2026-10-29: most AWS workloads in GovCloud (US) at Moderate, a contact center in commercial Regions; two organizations, one per partition; package names which services run where | AWS | restated-as-design (agency-neutral pattern) | — |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Vol I Book 01 — banners, draft notice, date code | — | Internal stamps; workbook style forbids them |
| Vol I Book 01 — Executive Summary (DDI as one control plane; Path A/B; Infoblox authorization history; three outcomes; vendor relationships) | Ch06 (Infoblox listing status, Path B "carried in own boundary"); Book 08 owns DDI selection | Vendor positioning and Path A/B procurement detail not carried; Book 08 Ch12 covers selection. Linked by GitHub URL |
| Vol I Book 01 — What Is a Federal Cloud Landing Zone (definition; four frameworks; 20x callout; core insight) | Ch05 "What a landing zone is"; Ch06 "The address plan is the join key" | 20x callout corrected and left to Chapter 03 (provider rules, not agency obligations) |
| Vol I Book 01 — Multi-Cloud Landing Zone Scope (table) | Ch05 "A multi-environment estate" | Generalized; agency-specific estate and boundary column corrected |
| Vol I Book 01 — FedRAMP Boundary Enforcement (three layers) | Ch06 (Layer 1, IP inventory vs boundary definition); Ch05 (boundary vs components) | Layer 2 (DNS egress / commercial M365 blocking) corrected in Ch06; Layer 3 (certificate = boundary membership) is Book 07/08 territory |
| Vol I Book 00 — Volume Purpose (four planes; closure claim) | Ch05 "The substrate beneath it" | — |
| Vol I Book 00 — Books in This Volume; How This Volume Fits; Volume X note | Ch05 substrate table (as workbook cross-links) | Internal series navigation; replaced with workbook book links |
| cloud.md — Substrate contract; Boundary contract; Integration shape; Drift considerations; Honest limits | Ch05 "Every automation declares its boundary" | — (all carried) |

Other Vol I Book 01 sections are logged in the Chapter 06 ledger.
