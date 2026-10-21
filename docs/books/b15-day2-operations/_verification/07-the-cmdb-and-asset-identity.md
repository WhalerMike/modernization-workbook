# Verification — Chapter 07, The CMDB and Asset Identity

Writer W5. Source: `docs/compliance/Vol_VII_Book_01_CMDB_Reconciliation_Asset_Identity.md` (about 1,370 words). Kept consistent with Book 12 Ch02 (join key: authoritative asset identity plus time; CMDB reconciles to the naming plane), Book 12 Ch06 and Ch07 (CM-8 precondition for SI-2; daily queue reads an asset register), Book 13 Ch03 (one authority per fact; corrections flow upstream), Book 13 Ch09 (CISO monthly metric review) and Book 12 Ch10 (DDI team owns the naming plane). All primary sources opened October 21, 2026. SP 800-53 text from the release 5.2.0 OSCAL catalog (usnistgov/oscal-content), release confirmed on the csrc.nist.gov publication page; baselines from the 5.2.0 SP 800-53B OSCAL profiles; SP 800-128 downloaded from nvlpubs and read as extracted text; ServiceNow pages fetched from servicenow.com/docs (English pages; release named per footnote); Microsoft claims via Microsoft Learn.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | In most agencies the ITSM platform holds the CMDB and work attaches to CIs | Opening | restated-as-design | Book 13 Ch10 "How the service desk fits" |
| 2 | CMDB is a projection; naming plane governs identity; disagreement is a finding | Projection | restated-as-design | Program design, as in Book 12 Ch02 and Book 13 Ch03 |
| 3 | SP 800-128: inventory "is populated through a process of discovery"; some elements (unique identifiers, system association, owner) still entered manually | Projection | verified | SP 800-128 §3.1.2 |
| 4 | CM-8 a.1–a.5, b text; "does not include duplicate accounting…"; discussion: unique identifier; IPv4/IPv6 duplicates | CM-8 | verified | SP 800-53 r5 5.2.0 CM-8 |
| 5 | CM-8(1)–(9) statements; CM-8(5) withdrawn, incorporated into CM-8 | CM-8 table | verified | OSCAL catalog 5.2.0 |
| 6 | Baselines: Low CM-8; Moderate CM-8, (1), (3); High adds (2), (4); (6)–(9) not selected | CM-8 table | verified | SP 800-53B 5.2.0 profiles |
| 7 | CM-8(4) discussion: contact individuals "if some action is required" (breach) | CM-8 | verified | CM-8(4) discussion |
| 8 | Source said CM-8 closes at "FedRAMP Moderate"; table listed CM-8 and CM-3 as closed here | CM-8 | corrected | Restated with NIST baselines; FedRAMP Rev5 baseline workbook is legacy (Book 12 Ch02); the generated authorities table and its KSI column not carried |
| 9 | BOD 23-01: discovery every 7 days; enumeration every 14 days; CDM ingestion within 72 hours | CM-8 | verified | CISA BOD 23-01 Required Actions |
| 10 | Source: reconcile exception queue "is exactly what CM-8 and CISA BOD 23-01 require" | Reconcile pass | restated-as-design | The directive requires discovery and enumeration cadence, not a queue; the queue is the program's measure |
| 11 | KSI-PIY-GIV text and mappings (CM-8, CM-8(1), (2), (4) among others); KSIs bind providers | CM-8 | verified | fedramp.gov KSI page, Class C (changelog to Oct 13, 2026); brief's settled fact |
| 12 | Source's KSI-PIY / KSI-CMT columns in the authorities table | — | removed | Generated internal table not carried |
| 13 | Populated by connectors, never hand entry | Where CIs come from | restated-as-design | Program rule; ties to CM-8(2) |
| 14 | Discovery finds computers, servers, printers, IP devices and applications; MID Server runs probes inside the network, initiates from inside the firewall, retains no discovery data | Where CIs come from | verified | ServiceNow "Exploring Discovery" (Brazil) |
| 15 | Service Graph Connector for Microsoft Azure pulls Azure data; RTE maps; IRE inserts; event-based create/update | Where CIs come from | verified | ServiceNow SGC for Microsoft Azure (Zurich) |
| 16 | Source: "Service Graph Connector for Azure (subscriptions, resource groups, VMs, storage, key vaults, policy assignments)" | Where CIs come from | corrected | Connector page doesn't list classes; table now says "representative CI classes" and drops policy assignments from the connector claim |
| 17 | Source: Graph ingest of Conditional Access policy objects as configuration CIs via in-boundary integration | Where CIs come from | restated-as-design | No ServiceNow connector claimed; stated as an integration the agency builds |
| 18 | MID Server and connector credentials inside the boundary | Where CIs come from | restated-as-design | Program design |
| 19 | Azure Resource Graph: query at scale across subscriptions; 14 days of change history; "keep an up-to-date CMDB… only receive their changes" | Where CIs come from | verified | MS Learn ARG overview; Get resource changes |
| 20 | Configuration objects as CIs; CM-8(6) assessed configurations and approved deviations | Where CIs come from | verified (control) / restated-as-design (modeling) | CM-8(6) |
| 21 | IRE "prevents duplicate CIs by uniquely identifying CIs" and "reconciles CI attributes by allowing only authoritative data sources to write to CMDB"; source_name/source_native_key shortcut | Platform reconciles | verified | ServiceNow IRE (Australia, updated Mar 12, 2026) |
| 22 | Reconciliation rules prevent sources overwriting each other; parent-class rules inherited unless child overrides; data refresh rules decide staleness for a source so a lower-priority source can update | Platform reconciles | verified | ServiceNow "Reconciliation rules" (Australia) |
| 23 | IRE data source rule prevents named sources creating CIs of a class | Platform reconciles | verified | ServiceNow IRE (Australia) |
| 24 | IRE always updates last_discovered and discovery_source; first_discovered = creation time | Platform reconciles; join key | verified | ServiceNow IRE (Australia; Zurich page also read) |
| 25 | Match/bind/flag; authoritative key first, cloud ID second | Reconcile pass | restated-as-design | Source's design, kept |
| 26 | Shadow asset as CM-8(3) finding | Reconcile pass | restated-as-design | Built on CM-8(3) text |
| 27 | SP 800-128 monitoring quotes ("all items in the component inventory can be identified…"; unapproved components "rarely have updated patches…") | Reconcile pass | verified | SP 800-128 §3.4 |
| 28 | Dynamic reconciliation rules choose a value from CMDB 360 data, need CMDB 360, take precedence over static rules | Platform reconciles | verified | ServiceNow "Reconciliation rules" (Australia) |
| 29 | Entra activity timestamp: ApproximateLastSignInDateTime; not an audit; updated only if delta > 14 days (±5); don't treat < 21 days as stale; blank on some active devices | Join key | verified | MS Learn "Manage stale devices in Microsoft Entra ID" |
| 30 | Defender DeviceInfo Timestamp = "last date and time recorded for the device" | Join key | verified | MS Learn DeviceInfo table |
| 31 | Joins use evidence observed_at, not CMDB refresh time | Join key | restated-as-design | Book 12 Ch02 contract |
| 32 | Entra duplicate device objects after reimage; duplicates confuse helpdesk | Duplicates | verified | MS Learn stale devices |
| 33 | MergedDeviceIds / MergedToDeviceId definitions; sample query removes "invalidated/merged devices" | Duplicates | verified | MS Learn DeviceInfo; "Review and assess devices" |
| 34 | CMDB Health duplicates: identification rules, independent CIs only, count = set minus one | Duplicates | verified | ServiceNow "CMDB Health KPIs and metrics" (Australia) |
| 35 | Resolve duplicates by binding; move attached records before retiring | Duplicates | restated-as-design | Program design |
| 36 | Stale: "not updated within the Effective Duration"; default 60 days | Stale | verified | CMDB Health KPIs and metrics |
| 37 | Data Manager policies (retire, archive, delete, attestation, certification); attestation text; one task per Managed By Group; group approves when required | Stale | verified | ServiceNow "Working with CMDB Data Manager" (Australia) |
| 38 | Entra stale devices: disable, grace period, delete; deletion unrecoverable; BitLocker keys lost; retire in Intune first; don't delete Autopilot/system-managed | Stale | verified | MS Learn stale devices |
| 39 | Stale CI lifecycle detect/attest/retire/archive | Stale | restated-as-design | Program design; CM-8(1) cited for removals |
| 40 | CM-8 precondition for SI-2; daily queue reads asset register | Patching | verified (internal) | Book 12 Ch06, Ch07 |
| 41 | Defect-to-effect table | Patching | restated-as-design | Program reasoning |
| 42 | Measures and cadence | Measuring | restated-as-design | Program design; CISO monthly review per Book 13 Ch09 cadence |
| 43 | Honest limits (coverage decays; can't repair naming plane; platform substitutable) | Honest limits | restated-as-design | Source, kept |
| 44 | Native features overlap the design | Honest limits | verified | ServiceNow IRE, CMDB Health, Data Manager pages above |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, aliases, FOUO/visibility banner, "Draft Proposal" box, Date Code | — | Internal publication metadata and stamps; not carried |
| Series Context box | Opening; "The CMDB is a projection" | Volume and book identifiers translated to Book 08 / Book 10 / Book 12 / Book 13 links |
| What This Document Addresses | Opening paragraphs | Rewritten; "Vol I Book 01" → naming plane, Book 08 |
| The Reconciliation Model (callout and layer table) | "The CMDB is a projection, not the authority" (table and figure ch07-cmdb-is-a-projection) | "Vol III Book 03" join-key reference → Book 12 Ch02 / Ch07 |
| Population — Where CIs Come From (table, configuration-objects note) | "Where configuration items come from" | Vendor capabilities verified; CA-policy ingest restated as agency-built integration; "Arc-projected servers" kept |
| The Reconcile Pass (Match, Bind, Flag; exception queue) | "How the platform reconciles, and what the program adds" (figure ch07-reconcile-pass) | Added the native IRE layer the source didn't describe; BOD 23-01 claim restated |
| Closure Necessity box | Opening (three CIs, forked trail) and "Why patching and evidence depend on it" | Capitalized doctrine name dropped; argument kept |
| NIST SP 800-53 Rev 5 Control Closure — generated authorities table | "What CM-8 asks of an inventory" | Generated table, spine file, KSI and "tool-attestable" columns not carried; CM-3 change gate moved to Chapter 10 (CAB) and Chapter 05's catalogs |
| Honest Limits | "Honest limits" | Kept; added native-overlap bullet per the book brief |
| Cross-References | Inline links to Book 08, Book 12 Ch02/06/07, Book 13 Ch03/09/10, Chapters 08, 10, 11 | Internal volume numbers not carried |
| Provenance | Footnotes now carry the vendor citations the source said were pending | Draft/rasterization notes not carried |
