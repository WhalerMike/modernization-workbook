# Verification — Chapter 08, The Adapter Model

Checked October 21, 2026 by writer W4. Sources: `docs/executive-governance/ch05-adapter-model/index.md` (1,004 words) and `docs/executive-briefs/adapter-ecosystem-overview.md` (823 words). Both are archived after the book is built and aren't linked. Microsoft claims come from the Microsoft Learn MCP tools; ScubaGear claims from CISA's v1.8.0 documentation on GitHub; control text from NIST's OSCAL catalog (SP 800-53 Rev. 5, release 5.2.0). Products appear only as examples; no endorsement is made. No personal data was sent to any site.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | The program is an overlay; adapters reach incumbent platforms without replacing them | Overlay | restated-as-design | Source brief |
| 2 | Adapter = translator from native state into the common record with provenance; change-making adapters translate plans into platform calls | Overlay | restated-as-design | Sources, reworded per book brief |
| 3 | Adapters hold no rules, make no decisions, never edit the record | Overlay | restated-as-design | Source invariant `ssot-mutation`; consistent with Ch05 layer 3 and Ch06 |
| 4 | Two classes: conformance (read-only) and modernization (change-making) | Two kinds | restated-as-design | Sources |
| 5 | Separate lists by file, one schema; separation checkable before reading code | Two kinds | restated-as-design | Sources. Internal file names (`adapter-registry.yaml`, `modernization-registry.yaml`) dropped per book brief |
| 6 | Source example: "A directory-migration adapter (bluecat-address-manager) ships as a modernization / identity adapter" | Two kinds | corrected | BlueCat Address Manager is an IP address management/DDI product, not a directory-migration tool; the example was mislabeled. Not carried by name; the chapter uses generic examples (moving identities to Entra ID, reshaping the addressing plan) |
| 7 | Mapping of classes to the actuation ladder (conformance = L1; modernization up to ceiling, L3 default; L4 only via change-making adapters) | Two kinds | restated-as-design | New; uses Book 01 Ch11 terms (settled) |
| 8 | Five missions; exactly one per adapter; no miscellaneous; decompose multi-purpose tools | Five missions | restated-as-design | Sources |
| 9 | Mission examples column | Five missions | restated-as-design | Generic examples, no products |
| 10 | Declaration fields (class, mission, status, invariants) | Contract | restated-as-design | Sources. Illustrative YAML is new; `platform-api`, `permissions`, `version`, `successor` fields added as design |
| 11 | Permissions User.Read.All, GroupMember.Read.All, Policy.Read.All exist as Graph read permissions | Contract YAML | verified | Microsoft Learn, Graph permissions overview (GroupMember.Read.All example); ScubaGear permission list (User.Read.All, Policy.Read.All) |
| 12 | Source invariant `gcc-boundary: gcc-moderate` | Contract | corrected | Restated as "the authorization boundary declared for the system, or a named exception," so the model isn't tied to one cloud; Book 10 covers the boundary |
| 13 | `certificate-anchored`, `object-identity-only` invariants | Contract | restated-as-design | Sources |
| 14 | Emission outside the envelope = authorization drift; schema break = schema drift | Contract | restated-as-design | Book 11 Ch09 (settled), Ch06 five-class model |
| 15 | AC-6 least privilege text ("necessary to accomplish assigned organizational tasks") | Read-only first | verified (new) | SP 800-53 Rev. 5 catalog 5.2.0 |
| 16 | Graph guidance: grant minimum permission; Directory.Read.All is the highest-privileged read-only permission for Entra ID resources; use with caution | Read-only first | verified (new) | Microsoft Learn, Overview of Microsoft Graph permissions |
| 17 | ScubaGear Graph application permissions all `.Read` (incl. Directory.Read.All, Policy.Read.All, RoleManagement.Read.Directory); most products run as Global Reader; Power Platform needs Power Platform Administrator with a Power Apps for Office 365 license; Global Administrator always sufficient | Read-only first | verified (new) | ScubaGear v1.8.0 docs, interactive permissions |
| 18 | Read-only must be verified by comparing granted permissions with the declaration | Read-only first | restated-as-design | Program design drawn from row 17 |
| 19 | Separate identities for read-only and change-making adapters | Read-only first | restated-as-design | Book 01 Ch03 (settled) |
| 20 | Semantic Versioning MAJOR/MINOR/PATCH rules | Versioning | verified (new) | semver.org 2.0.0 |
| 21 | Graph v1.0 GA "ready for production use"; beta can change; "Use of beta APIs in production applications is not supported"; 24-month deprecation notice for versions and GA APIs | Versioning | verified (new) | Microsoft Learn, Versioning, support, and breaking change policies |
| 22 | Source: "`graph_api_version`: per-adapter default (`beta` for IntuneAdapter …)" | Versioning | corrected | Beta isn't supported in production; restated as a rule (pin v1.0, record beta-only dependencies as risks with an owner). Internal adapter class names dropped |
| 23 | Additions of nullable properties and enum members are backward-compatible; clients should be prepared for undefined properties | Versioning | verified (new) | Microsoft Learn, same page |
| 24 | Graph endpoints: global graph.microsoft.com (also Microsoft 365 GCC), GCC High graph.microsoft.us, DoD dod-graph.microsoft.us; tokens not interchangeable across clouds | Versioning | verified | Microsoft Learn, Microsoft Graph national cloud deployments. Source's "commercial also serving GCC-Moderate" is consistent |
| 25 | Endpoint resolution by declared cloud; unknown clouds fail closed | Versioning | restated-as-design | Source "Microsoft Graph adapter convention"; internal function name dropped |
| 26 | Status lifecycle proposed/reserved → active → deprecated → retired, successor pointers | Lifecycle | restated-as-design | Sources (retirement decision). Internal decision ID dropped |
| 27 | Three test tiers (recorded fixtures every change; live tenant nightly; reference GCC-Moderate tenant quarterly as signed OSCAL evidence) | Lifecycle | restated-as-design | Source brief (test strategy). Generalized: "live non-production tenant on a schedule," "reference deployment in the target boundary"; the quarterly cadence and "signed OSCAL" not carried because signing is design-only (Ch07) |
| 28 | Conformance gate blocks merge on any failure | Lifecycle | restated-as-design | Source brief |
| 29 | References to retired adapters flagged as provenance drift; past evidence reproducible | Lifecycle | restated-as-design | Source ch05 |
| 30 | Source: "Of 48 registered adapters, 12 are active"; registry entry counts 29/19; lists of shipped adapter IDs; CLI commands | Limits | removed | Internal snapshot of the program's tooling that would go stale and names internal IDs and commands. Restated qualitatively: "most entries are reserved names, not active adapters" |
| 31 | Vendor adapter names in the source (CyberArk, Infoblox, Palo Alto, ServiceNow, Terraform, BlueCat) | — | removed | Not carried: chapter makes no vendor endorsements; products only as examples (ScubaGear, Microsoft Graph) |
| 32 | Swapping vendors means swapping the adapter; rules, drift engine, evidence unchanged | Neutrality | restated-as-design | Sources' overlay argument |
| 33 | OSCAL component definitions are authored by vendors of products or services and describe controls a component supports | Neutrality | verified (new) | NIST OSCAL, Component Definition Model |
| 34 | SA-9 external system services: define oversight, monitor control compliance ongoing | Neutrality | verified (new) | SP 800-53 Rev. 5 catalog 5.2.0 |
| 35 | Feature missing in a cloud = boundary finding | Neutrality | restated-as-design | Book 11 Ch09 (settled) |
| 36 | Four AO properties | What an AO gains | restated-as-design | Source ch05 |
| 37 | Honest limits: opinionated taxonomy; engineering work; drift catches silent mutation after the fact | Limits | restated-as-design | Source ch05 limits; "resolved by an ADR" translated to the change-control path |
| 38 | Source quote attributed to an internal document ("Adapters are plural in class but singular in mission") | — | removed | Internal document quotation; idea carried in "Five missions" |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| ch05 "In this chapter" | Opening callout | — |
| ch05 "The dual-axis taxonomy" | "Two kinds" and "Five missions" | Internal CI workflow and file names dropped |
| ch05 "Why two registries" (and at-a-glance table) | "Two kinds: read-only and change-making" and its table | Mislabeled BlueCat example corrected (claims log 6) |
| ch05 "Canon invariants every adapter inherits" | "The contract" invariants table | Boundary invariant generalized (claims log 12) |
| ch05 "Microsoft Graph adapter convention" | "Versioning" | Beta default corrected (claims log 22); internal function and class names dropped |
| ch05 "Adapter retirement" | "Earning active status, and retiring" | — |
| ch05 "What changes for an authorizing official" | "What an authorizing official gains" | — |
| ch05 "Honest limits" | "Honest limits" | — |
| ch05 "Key takeaways" | "Key takeaways" | Rewritten |
| ch05 "Continue the series" / "Related documents" | Continue-the-book callout | Old links not carried |
| brief intro (overlay) | "An overlay, not a replacement" | — |
| brief "The dual-axis taxonomy" | "Two kinds", "Five missions" | Internal-document quotation removed (claims log 38) |
| brief "Two registries, one schema" | "Two kinds"; "The contract" | Entry counts removed (claims log 30) |
| brief "What ships today" | "Honest limits" (qualitative) | Adapter lists, counts and CLI commands removed (claims log 30, 31) |
| brief "How an adapter earns 'active'" | "Earning active status, and retiring"; figure ch08-adapter-lifecycle | Generalized (claims log 27) |
| brief "Maturity snapshot" | "Honest limits" | Ship table not carried |
| brief "Where to go deeper" | Links to Book 01 Ch03, Book 02 Ch04, Book 11 Ch09 | Internal spec/validation-suite pages not linked |
| brief "Leadership takeaway" | "Key takeaways"; "What an authorizing official gains" | — |

## Re-base on ScubaGear 2.0.0, October 26, 2026

ScubaGear 2.0.0 was released October 22, 2026 (weekly source watch, issue #160). Footnotes that cited ScubaGear v1.8.0 were re-checked against tag `v2.0.0` (raw files from GitHub, compared with the same files at `v1.8.0`), the v2.0.0 release notes and CISA's BOD 25-01 Required Configurations page, all read October 26, 2026. No personal data was sent to any site; downloads used a generic User-Agent.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Graph application permissions all `.Read` (Directory.Read.All, Policy.Read.All, RoleManagement.Read.Directory among them); Global Reader for most products; Power Platform Administrator with Power Apps for Office 365 license; Global Administrator always sufficient (row 17) | Read-only first | verified (unchanged at v2.0.0) | ScubaGear v2.0.0 interactive.md |
| 2 | Power BI needs Fabric Administrator (or Global Administrator) with a Power BI or Fabric license | Read-only first | verified (added) | ScubaGear v2.0.0 interactive.md |
