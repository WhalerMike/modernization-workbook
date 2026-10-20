# Verification — Chapter 09, Who Owns DNS, DHCP and IPAM

Checked October 20, 2026. New chapter. Inputs: series Chapter 08 (five decisions), Chapter 11 (delegated
administration model), and the operating-model content of the DNS Modernization Guide
(`docs/operational-guides/network-transformation/dns-modernization.md`; being archived, not linked) and its short
twin. Migration-wide RMF roles are linked to Book 02 Chapter 06 and endpoint roles to Book 05 Chapter 06, not repeated.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | DnsAdmins has full control of all zones and records in the AD domain by default | Opening | verified | Learn, DNS zones — Access to zones and names |
| 2 | DnsAdmins is a privileged group with administrative control of the DNS Server service; MDI flags non-privileged members; group often delegated to network staff | Opening; AD admins | verified | Learn, MDI security assessment: Unsafe permissions on the DnsAdmins group |
| 3 | Any authenticated user can create A/PTR records in AD zones by default | Opening; closing table | verified | Learn, DNS zones — Access to zones and names |
| 4 | DnsUpdateProxy lets DHCP servers update on behalf of clients; DHCP Administrators is a default group | Opening; role map | verified | Learn, Active Directory security groups |
| 5 | Microsoft AD DS planning names a "DNS for AD DS owner" who coordinates with DHCP and DNS groups | Opening | verified | Learn, DNS for AD DS Owner Role |
| 6 | AO accepts risk on the organization's behalf (RMF) | Decision rights | verified | NIST SP 800-37 Rev. 2 (Dec 2018); detail linked to Book 02 Ch 06 |
| 7 | M-22-09: encrypted DNS wherever technically supported; endpoints use agency-designated resolvers, not auto-discovery; log at designated resolvers | CISO role | verified | OMB M-22-09 §C.2 (PDF text extracted) |
| 8 | FCEB agencies are mandated to use CISA Protective DNS; it blocks/redirects/sinkholes and alerts the agency | CISO, SecOps roles | verified | CISA Protective DNS Resolver page |
| 9 | Windows DNSSEC Key Master: one per zone, generates keys, performs rollovers; AD-integrated keys can replicate via AD; lost Key Master without key access means re-sign with new keys | AD admins | verified | Learn, DNSSEC Key Master; Transfer Key Master role |
| 10 | CAF: privatelink zones hosted centrally in connectivity subscription; typically only networking and identity admins manage records; Deny policy on workload-created privatelink zones; DeployIfNotExists managed identity with Private DNS Zone Contributor writes and removes records | Cloud platform; change classes; role map | verified | Learn, Private Link and DNS integration at scale |
| 11 | Private DNS Zone Contributor manages private zones but not linked VNets; DNS Zone Contributor is public zones only; Network Contributor manages networks | Cloud platform; role map | verified | Learn, Azure built-in roles for Networking; How to protect DNS zones and records |
| 12 | AVNM IPAM pools need Network Contributor on the network manager; pool access can be delegated | Cloud platform; role map | verified | Learn, Manage IP addresses with AVNM; What is IPAM in AVNM |
| 13 | Route 53 VPC Resolver rules shareable via RAM; recipient can associate but can't change or delete | Cloud platform; role map | verified | AWS, Managing forwarding rules (note: AWS now names it "Route 53 VPC Resolver") |
| 14 | VPC IPAM delegated account must be a member account, not the management account | Cloud platform; role map | verified | AWS, Integrate IPAM with accounts in an AWS Organization |
| 15 | .gov: only domain managers change name servers and DS data; incorrect DNSSEC can break the domain; senior official authorizes requests | Roles (.gov domain managers) | verified | get.gov, Domain management |
| 16 | Azure custom role blocking deletion isn't effective because updates can empty a record set | Record change approval | verified | Learn, How to protect private DNS zones and records — Custom roles |
| 17 | Program gates: change control per phase; validation window with no SRV failures; parallel operation before decommission; accept lost DNSSEC with compensating controls | Where the roles come from | restated-as-design | DNS Modernization Guide §8.4, §13 Phases 9–10, App. D (program runbooks; durations left to Ch 10) |
| 18 | Roles, decide/do/consult split, matrix, one decider per row | Throughout | restated-as-design | Program model |
| 19 | Three record-change classes and their approvers | Record change approval | restated-as-design | Program model built on verified CAF lifecycle behavior (#10) |
| 20 | Team-to-role map across policy plane, Windows, Azure, AWS | Roles in each system | restated-as-design | Program model built from verified role definitions (#4, #10–#14); AWS IAM managed-policy names deliberately not named (not verified) |
| 21 | Policy-plane role names (corporate admin, manager, operator, auditor, scoped automation) | Roles; role map | restated-as-design | Series Ch 11 (vendor-neutral model) |
| 22 | Source DNSSEC trade-off claim "VNet traffic is encrypted at the infrastructure layer" as a compensating control | Not carried | removed | Not verified for this chapter; DNSSEC technical treatment belongs to Ch 06 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Series Ch 08 — five critical decisions | Where the roles come from; matrix rows for Decisions 1–5 | — |
| Series Ch 08 — target operating model (cloud DNS as consumers) | Cloud platform teams role; closing table | — |
| Series Ch 11 — delegated administration across divisions | Where the roles come from; role map (policy plane column) | Mechanics stay in Ch 11 (linked) |
| Series Ch 11 — API and automation, service accounts | Application owners role; change classes (standard) | Detail stays in Ch 11 |
| Series Ch 11 — ITSM integration | Change classes (catalog item) | Detail stays in Ch 11 |
| Series Ch 11 — certificate automation (ACME DNS-01) | Application owners role | Detail stays in Ch 11; certificates to Book 07 |
| Series Ch 11 — monitoring and evidence checklist | CISO/ISSO role (linked) | Not repeated |
| Guide header — owner: Platform Engineering | Where the roles come from | — |
| Guide Canon Phase Mapping and §13 Migration Execution Playbook (gates, 30-day SRV validation, 90-day parallel operation) | Where the roles come from (as decisions needing an owner); matrix rows "migration phase go/no-go" and "decommission timing" | Phase durations and steps belong to Ch 10 |
| Guide §1.3 / App. D companion cross-reference (change control for every phase; Azure Policy for Private DNS zones) | Where the roles come from; cloud platform role | Companion document names not carried (internal documents) |
| Guide §8.3–8.4 DNSSEC trade-off and transition plan | Matrix rows on DNSSEC (accepting zones that lose signing = AO); AD admins (Key Master handover) | Compensating-control list not carried (see claim 22); technical DNSSEC content to Ch 06 |
| Guide §8.1 Key Master | AD administrators role (verified on Learn) | — |
| Guide §10.3 auto-registration vs manual management | Change classes (policy-driven) | Technical content to Ch 07 |
| Guide §11 DHCP and dynamic DNS (DHCP registers on behalf of clients; target-state options) | Opening (DnsUpdateProxy); matrix DHCP rows | Target-state options and scavenging to Ch 07/Ch 10 |
| Guide §12 monitoring and drift detection | SecOps role; change-class audit note | Metrics tables to Ch 11 |
| Guide §2–7, §9, §14, App. A–C (technical decomposition, scripts, troubleshooting) | — | Not ownership content; absorbed by Ch 04, 07, 10, 11 and Appendix A writers |
| Guide App. B cost calculator | — | Belongs to Ch 12 (corrected there) |
| Short twin `docs/operational-guides/dns-modernization.md` (Purpose, Phases, Key risks, Success criteria) | — | No ownership content; duplicates long guide |
