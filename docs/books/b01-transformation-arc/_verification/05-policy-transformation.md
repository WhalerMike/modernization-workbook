# Verification — Chapter 05 (Policy Transformation)

File: `05-policy-transformation.md`. Diagram sources: `docs/images/diagrams/b01-transformation-arc/src/ch05-policy-surfaces.flow.yaml` (replaces `../../images/cshc/policy-transformation.svg`, same content: Group Policy → regenerate → Intune + CA, report-only first, break-glass excluded) and `ch05-change-gates.flow.yaml` (new; the four test stages already in the text).
Microsoft sources opened through the Microsoft Learn MCP tools on October 21, 2026; CISA and FedRAMP sources opened with WebFetch the same day. Book 04 (`07-the-conditional-access-policy-library.md`, `03-the-conditional-access-model.md`), Book 05 (`01`, `05`, `07`, `09`) and Book 02 (`09`, emergency access) read for consistency.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Group Policy replaced by Intune, Conditional Access, machine configuration and tenant settings | §Policy claim | restated-as-design | Program architecture |
| 2 | Group Policy needs Kerberos, LDAP, SMB and RPC to a DC; otherwise doesn't apply or update | §Policy claim | verified | Learn, "Service overview and network port requirements," Group Policy |
| 3 | GPO template lives in SYSVOL on each DC; container in AD | §Policy claim | verified | Learn, "Group Policy overview for Windows Server" |
| 4 | Whitepaper: SYSVOL/GPO retrieval is a DC-dependent operation that feels distance | §Policy claim | verified (restated) | Rows 2–3; whitepaper's "each documented as requiring line of sight" wording not used (consistent with Ch01 log row 21) |
| 5 | Cloud-native endpoint has no dependency on AD, Group Policy or DCs | §Policy claim | verified | Learn, "Tutorial: Set up cloud-native Windows endpoints," FAQ |
| 6 | CA and device compliance are the token-era equivalents of AD's access decisions (whitepaper Principle 3) | §Policy claim | restated-as-design | Program model |
| 7 | Drive maps → configuration profiles (source table) | §Target surfaces | corrected | Learn tutorial Phase 4: no built-in solution for mapped drives; move to Teams/SharePoint/OneDrive, scripts if necessary; Universal Print for printers |
| 8 | Intune platform scripts via the Intune Management Extension | §Target surfaces | verified | Learn, "Understand Microsoft Intune Management Extension" |
| 9 | Remediations licensing (Windows Enterprise E3/E5, Education A3/A5, VDA) | §Target surfaces | verified (added) | Learn, "Remediations," Prerequisites and Licensing |
| 10 | Intune doesn't apply policy in LSDOU order; applies by assignment | §One-to-one | verified (added) | Learn, "Known issues and limitations with cloud-native endpoints" |
| 11 | Microsoft recommends "start new"; don't move GPOs until you know what they do | §One-to-one | verified (added) | Learn, "High level planning guide to move to cloud-native endpoints" |
| 12 | "In most estates the majority of Group Policy settings map to Intune configuration profiles" | §Config profiles | corrected | Microsoft publishes no typical figure (consistent with Book 05 Ch01); restated as an estate measurement from Group Policy analytics |
| 13 | Group Policy analytics reports per-GPO MDM Support percentage | §Config profiles | verified | Learn, "Import and analyze your on-premises GPOs using Group Policy analytics" |
| 14 | YAML path `DeviceLock/MaxInactivityTimeDeviceLock` + `MachineInactivityLimit` both set | §Config profiles | corrected | Duplicate effect removed; kept `LocalPoliciesSecurityOptions/InteractiveLogon_MachineInactivityLimit` (seconds), Learn Policy CSP |
| 15 | YAML path `Device/Experience/LockScreenMessage` | §Config profiles | corrected | No such CSP path; replaced with `InteractiveLogon_MessageTitle…`/`MessageText…` (Learn Policy CSP - LocalPoliciesSecurityOptions) |
| 16 | Logon message settings break Autopilot pre-provisioning | §Config profiles | verified (added) | Same Policy CSP page |
| 17 | YAML path `Browser/Edge/SmartScreen/Enable` | §Config profiles | corrected | Replaced with settings catalog "Microsoft Edge\SmartScreen settings\Configure Microsoft Defender SmartScreen" (Learn, Edge for Business settings catalog step 5) |
| 18 | Compliance policy value beats configuration profile; most restrictive among compliance policies | §Config profiles | verified (added) | Learn, "Common questions… policies and profiles," Conflicts |
| 19 | CA reads compliance via "Require device to be marked as compliant"; needs an Intune compliance policy | §Config profiles | verified | Learn, "Require device compliance with Conditional Access" |
| 20 | CA manifest `CA-100-Enterprise-MFA` excluding assessment apps, 12 h sign-in frequency | §CA | corrected | Aligned to Book 04 CA018-AllUsers-RequireMFA (all users, all resources, no resource exclusions); session control removed |
| 21 | CA numbering by scope bands CA-000–999 | §CA | corrected | Contradicted Book 04's single library (CA001–CA038, CA090); bands retired, Book 04 numbering adopted |
| 22 | Block access is a powerful control; test in report-only | §Prefer require | verified | Learn, "Plan a Conditional Access deployment," Block or grant controls |
| 23 | "Block only legacy auth and high-risk sign-ins; everything else is a require" | §Prefer require | corrected | Book 04 also blocks device code flow, high user risk (BOD 25-01), and uses grant/block pairs; text now names the sanctioned blocks |
| 24 | BOD 25-01 requires mandatory SCuBA policies; issued Dec 17, 2024 | §Prefer require | verified | CISA BOD 25-01 page |
| 25 | SCuBA MS.AAD.1.1 legacy auth SHALL be blocked; 2.1 high-risk users SHALL be blocked; 2.3 high-risk sign-ins SHALL be blocked | §Prefer require | verified | CISA ScubaGear `aad.md` baseline |
| 26 | Intune doesn't support Windows Server | §Server config | verified | Learn, "Supported operating systems and browsers in Intune"; settled book fact |
| 27 | Machine configuration audits/sets OS settings via DSC; Azure Policy at Azure scopes not OUs | §Server config | verified | Learn, "Cloud-native governance and policy with Azure Arc-enabled servers" |
| 28 | Machine configuration extension built into the Arc agent; Arc machines in scope automatically | §Server config | verified | Learn, "Azure Machine Configuration prerequisites" |
| 29 | Tags synced to organizational attributes; drifted tag opens an item | §Server config | restated-as-design | Program design |
| 30 | Pipeline Analyze/Plan/Deliver; "Chapter 03 pipeline" | §Pipeline | corrected | Chapter reference renumbered to Chapter 11 |
| 31 | Two Intune configuration policies with conflicting values: conflict shown, resolve manually | §Conflict | verified | Learn, "Common questions…," Conflicts |
| 32 | Layer order as an authoring rule | §Conflict | restated-as-design | Program rule |
| 33 | GPO vs MDM on hybrid: GP wins by default; MDMWinsOverGP only for Policy CSP; otherwise race | §Conflict | verified (added) | Learn, "Policy CSP - ControlPolicyConflict"; consistent with Book 05 Ch01/Ch05 |
| 34 | All applicable CA policies must be satisfied; block ends enforcement | §Conflict | verified | Learn, "Build a Conditional Access policy" |
| 35 | "Requiring broadly while blocking narrowly is prohibited" | §Conflict | corrected | Restated so it doesn't contradict Book 04's grant/block pairs: blocks are never used to fix grant-policy scope |
| 36 | Emergency accounts excluded from "block-class" policies | §Break-glass | corrected | Learn: exclude from every policy that blocks *or restricts* sign-in; report-only needs no exclusion; two or more cloud-only accounts; test e.g. quarterly. Matches Book 04 `CA-Exclude-EmergencyAccess` on every enforced policy |
| 37 | Report-only evaluates at sign-in and logs without enforcing | §Testing | verified (added) | Learn, "Analyze Conditional Access policy impact" |
| 38 | Four test stages; ninety-day rollback window | §Testing/§Retiring | restated-as-design | Program design (illustrative values kept as such) |
| 39 | Last GPO is "the domain password and account policy" | §Retiring | verified (refined) | Learn, password policy FAQ: account policies defined in only one GPO linked to the domain (Default Domain Policy) |
| 40 | Exceptions via fine-grained password policies (not GPOs) | §Retiring | verified (added) | Learn, "Configure fine grained password policies" |
| 41 | Default Domain Controllers Policy retires with the last DC | §Retiring | restated-as-design | Program sequencing |
| 42 | Entra ID Protection risk detections; block legacy auth page (source footnotes `cs05-idp`, `cs05-legacy`) | §Prefer require | removed (source) | Not reopened; claims now carried by the SCuBA baseline (row 25) and Book 04 |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Series Ch05 front matter, H1 "Policy: Group Policy → Device Management + Conditional Access", bold subtitle | Title, H1, italic thesis, description | H1 fixed to book title; subtitle replaced by thesis line |
| Ch05 dependency-chain blockquote | Kept | — |
| Ch05 §The policy claim + `cshc/policy-transformation.svg` | §The policy claim; `ch05-policy-surfaces` | Figure replaced by house-style source |
| Ch05 §The target surfaces (table) | §The target surfaces | Drive-map and printer row corrected; Book 05 Appendix A linked |
| Ch05 §Why one-to-one mapping fails | Same section | Microsoft guidance added; Book 05 Ch01/Ch07 linked |
| Ch05 §Configuration profiles (YAML, versioning, scopes, compliance) | Same section | YAML paths corrected; compliance precedence added |
| Ch05 §Conditional Access (YAML, numbering table, prefer require) | §Conditional Access | Numbering table replaced by Book 04 library reference; "prefer require" kept as subsection, reconciled |
| Ch05 §Server configuration | Same section | Expanded; Book 05 Ch09 linked |
| Ch05 §The policy-delivery pipeline | Same section | Chapter 03 → Chapter 11 |
| Ch05 §Conflict resolution | Same section | GPO/MDM coexistence and CA evaluation added |
| Ch05 §Break-glass exclusions and testing | Same section | Exclusion scope corrected; stages as a list; `ch05-change-gates` |
| Ch05 §Retiring legacy GPOs | Same section | Account-policy and FGPP facts added |
| Ch05 §Verification, §Key takeaways | Same sections | One takeaway added |
| Ch05 §Authoritative references list | Footnotes | Removed as a list; every source is a footnote |
| Ch05 Previous/Next lines | "Continue the book" callout | Restyled |
| Whitepaper Act 2, DC-dependent operations paragraph (SYSVOL/GPO retrieval) | §The policy claim (para 3) | Restated to the documented port and SYSVOL facts |
| Whitepaper Principle 3, "Entra ID, Conditional Access and device-compliance policies are the token-based equivalents" | §The policy claim (para 4) | Kept as program model |
| Whitepaper Principle 3 / Framework table, BOD 25-01 SCuBA and modern authentication | §Prefer require | Narrowed to the verified SCuBA block policies |
| Whitepaper Framework table, "Device compliance as input to access decisions (M-22-09 §3)" | Not carried | Belongs to Chapter 08 (access plane, W4); compliance-to-CA mechanics kept in §Config profiles |
| Whitepaper images `rId*.png` | Not carried | None depict policy; diagrams are house-style sources |
