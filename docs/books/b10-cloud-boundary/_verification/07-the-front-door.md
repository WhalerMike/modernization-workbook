# Verification — Chapter 07, The Landing Zone Front Door

File: `docs/books/b10-cloud-boundary/07-the-front-door.md`
Diagram source (new): `docs/images/diagrams/b10-cloud-boundary/src/ch07-provisioning-loop.flow.yaml`.
Source read: `docs/compliance/Vol_IX_Book_02_Landing_Zone_Front_Door.md`. Consistency checked against Book 08 Ch11 (ServiceNow spoke and Service Graph Connector for DDI) and Book 01 Ch03 (platform host).
Checked 2026-10-21 against NIST SP 800-53 Rev. 5 release 5.2.0 and SP 800-53B Moderate profile (usnistgov OSCAL), Microsoft Learn (Subscription vending; Get compliance data of Azure resources), CISA BOD 23-01, ServiceNow CPG documentation (Xanadu), HashiCorp blog (Service Catalog for Terraform 2.9) and Terraform documentation (sensitive data), FedRAMP KSI Change Management page, FedRAMP Marketplace `products.json` (meta last_change 2026-10-21; searched names, offerings and descriptions for HashiCorp/Terraform). Footnote keys drop the `c07-` prefix.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | CM-3 statement (determine, review and approve/disapprove with impact analysis, document, implement, retain, monitor) | Why code isn't change control | verified | sp80053 |
| 2 | CM-3(2) test/validate/document before finalizing; CM-8(1) update inventory during installs/removals | Why code isn't change control | verified | sp80053 |
| 3 | AC-5, CM-3(2), CM-5, CM-8(1) in Moderate baseline | Why code isn't change control | verified | moderate |
| 4 | Subscription vending = programmatic issuing; "official front door" | Subscription vending | verified | vending |
| 5 | Three groups (CCoE, workload teams, platform team) | Subscription vending | verified | vending |
| 6 | Automate in ITSM; tie to pipeline; intake fields (budget, owner, networking, criticality/confidentiality) | Subscription vending | verified | vending |
| 7 | Use IPAM in vending; never overlap in one routing domain; platform creates hub-peered VNets; teams may create subnets | Subscription vending | verified | vending |
| 8 | Network governance via Azure Policy or AVNM security admin rules | Subscription vending | verified | vending |
| 9 | Bicep and Terraform vending modules; programmatic creation needs EA/MCA/MPA role; configuration doesn't | Subscription vending | verified | vending |
| 10 | PIM for groups for elevated access; workload identities can't use PIM, have standing access; prefer managed identities | Subscription vending | verified | vending |
| 11 | Six-step loop and its order | Provisioning loop | restated-as-design (Vol IX Book 02) | — |
| 12 | Source: SoD maps to CM-5 | Provisioning loop | corrected: SoD is AC-5 (Separation of Duties); CM-5 is Access Restrictions for Change; both mapped | sp80053 |
| 13 | BOD 23-01 "entire IPv4 space used by the agency" | Step 5 | verified | bod2301 |
| 14 | Source: unreconciled block is "a CM-8 / BOD 23-01 finding" | Step 5 | restated: the directive requires discovery of the whole space; framed as what discovery must then chase, not as a named finding category | bod2301 |
| 15 | CPG Terraform connector: provider types (Terraform Environment Linux, Windows, Terraform Enterprise/Cloud via MID Server); no hard-coded credentials; no AWS IAM role auth by default | ServiceNow | verified | cpg |
| 16 | Source: "CPG Terraform Connector runs a speculative plan the approver reviews" | ServiceNow | corrected: not described in the CPG page; the documented plan-only approval workflow is HashiCorp's Service Catalog for Terraform 2.9 | cpg; hashi |
| 17 | HashiCorp Service Catalog for Terraform 2.9, Oct 2, 2025: plan-only run to approver; rejected run discarded; described with HCP Terraform | ServiceNow | verified | hashi |
| 18 | ServiceNow DDI spoke and Service Graph Connector | ServiceNow | verified via Book 08 Ch11 (linked) | Book 08 Ch11 |
| 19 | ServiceNow Government Community Cloud F1305072116 Certified, High, Class D | ServiceNow | verified | fr |
| 20 | Terraform state and plan files hold secrets, including `sensitive` values | Pipeline in boundary | verified | tfstate |
| 21 | No Marketplace listing for HCP Terraform; GitHub Enterprise Cloud LI-SaaS Class B; GitLab Dedicated for Government Moderate Class C | Pipeline in boundary | verified (searched all names, offerings and descriptions) | fr |
| 22 | Self-hosted runner and state in boundary; runner as platform-host role | Pipeline in boundary | restated-as-design | Book 01 Ch03 |
| 23 | Policy re-evaluation every 24 hours; ~30 minutes for subscription created/moved | After apply | verified | compliance-data |
| 24 | Destructive plans get heightened approval; reconcile against best available record | After apply | restated-as-design (source honest limits) | — |
| 25 | KSI-CMT-LMC, -VTD quotes; -RMV paraphrase | Evidence | verified; framed as provider indicators | ksi-cmt |
| 26 | Source authorities table: KSI-CMT for CM-2/CM-3, KSI-PIY for CM-8, "Tool-attestable? No" | Evidence | restated: KSI themes exist (CMT, PIY) but bind providers; spine-generated columns not carried | ksi-cmt |
| 27 | Source "OMB Circular A-130" as authority driver for CM-2/CM-3 | (not carried) | removed from the chapter (generated-spine column; not needed for the argument) | — |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Banners, draft notice, date code, Series Context callout | Ch07 intro (gap statement) | Stamps removed |
| What This Document Addresses | Ch07 intro and "Why code isn't change control" | `infoblox-ddi-book/servicenow-app/` kit path not carried (internal artifact) |
| The Provisioning Loop (table) | Ch07 "The provisioning loop" (table and diagram) | Control column corrected (AC-5) |
| "No landing zone stands up outside the naming plane" callout | Ch07 "Step 5 carries the most weight" | — |
| Reuse — This Is the DDI App, Generalized | Ch07 ServiceNow section (DDI pattern reuse) | Internal Vol VIII Book 07 reference replaced with Book 08 Ch11 |
| Closure Necessity | Ch07 "Why code isn't change control" | — |
| NIST control closure (generated spine table) | Ch07 loop table and evidence table | Generated columns (evidence slot, tool-attestable, A-130) not carried |
| Honest Limits | Ch07 "After apply: drift" and "Honest limits" | — |
| Cross-References | Chapter cross-links (Ch05, Ch06, Ch09, Ch11; Book 08 Ch11) | Internal volume numbers replaced |
| Provenance | Ch07 (CPG, Terraform/Bicep as examples; discipline invariant) | — |
