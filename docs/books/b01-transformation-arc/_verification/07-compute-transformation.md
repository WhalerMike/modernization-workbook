# Verification — Chapter 07 (Compute Transformation)

File: `07-compute-transformation.md`. Diagram sources: `docs/images/diagrams/b01-transformation-arc/src/ch07-device-paths.flow.yaml` (replaces `../../images/cshc/compute-transformation.svg`: domain-joined → hybrid join → cloud identity / Arc, "domain-unjoin is separate") and `ch07-server-arc-path.flow.yaml` (new; the six server steps already in the text).
Microsoft sources opened through the Microsoft Learn MCP tools on October 21, 2026. Book 05 (`02`, `04`, `06`, `09`), Book 06 (`index`, `14`), Book 07 (titles) read for consistency.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | PCs → Entra join + Intune; servers → Arc + machine configuration | §Compute claim | verified | Settled book fact; Learn, Intune supported platforms |
| 2 | Entra registered = BYOD/mobile; "rare in regulated environments" | §Device states | verified / restated-as-design | Learn, "Microsoft Entra registered devices"; "rare" restated as program position |
| 3 | Arc server: OS logon unchanged; system-assigned managed identity | §Device states | verified | Learn, "What is Azure Arc-enabled servers?"; Book 05 Ch09 |
| 4 | Hybrid join is an interim step; not a long-term or end-goal state | §Device states | verified (added) | Learn, "What is a device identity?"; "Entra joined vs. hybrid joined" |
| 5 | Hybrid joined devices need periodic line of sight; password changes and TPM reset break | §Device states | verified (added) | Learn, "Plan your Microsoft Entra hybrid join implementation"; whitepaper Act 2 absorbed |
| 6 | Intune doesn't support Windows Server | §Device states | verified | Learn, Intune supported platforms; settled book fact |
| 7 | OEM pre-registration; Global Administrator approval required | §Patterns | verified (extended) | Learn, "OEM registration" |
| 8 | No supported in-place hybrid → Entra join conversion; Autopilot Reset unsupported for hybrid; full wipe; complementary event | §Patterns | verified | Learn, "Entra joined vs. hybrid joined" |
| 9 | "Autopilot for existing devices is the listed method" (source footnote) | §Patterns | corrected | Learn, "Windows Autopilot deployment for existing devices": a Configuration Manager task sequence that reimages; described as one documented way, not the only one |
| 10 | Arc projects server as Azure resource; Defender, monitoring, policy | §Arc path | verified | Learn, Arc-enabled servers overview |
| 11 | Entra ID sign-in on Windows Server 2025 (Desktop Experience) / Windows 11 24H2; Entra joins the machine; not for AD-joined servers; CA unsupported | §Arc path | verified (added) | Learn, "Sign in to an Azure Arc-enabled server using Microsoft Entra ID" |
| 12 | Defender for Cloud onboarding of non-Azure machines via Arc recommended | §Arc path | verified | Learn, "Connect your non-Azure machines to Microsoft Defender for Cloud" |
| 13 | Defender for Cloud auto-onboards the MDE extension to Arc machines | §Arc path | verified (added) | Learn, "Onboard servers to Microsoft Defender," Server plans |
| 14 | CA doesn't evaluate server compliance for server-to-server traffic | §Arc path | restated-as-design | Program reading of CA scope (sign-ins to Entra-protected resources) |
| 15 | Arc servers run non-domain-joined in the target; unjoin separately sequenced | §Arc path | verified | Book 05 Ch09 (program target) |
| 16 | Budget per application, not per server | §Arc path | restated-as-design | Program planning rule |
| 17 | Compute stays co-located with data until round trips reduced (whitepaper Principle 5) | §Where compute runs | restated-as-design | Program principle; techniques list from the whitepaper; physics linked to Book 09 |
| 18 | "Chapter 02 map" of SPNs | §Kerberos | corrected | Renumbered to Chapter 10 |
| 19 | App proxy with KCD for unmodified IWA web apps | §Kerberos | verified | Learn, "Kerberos Constrained Delegation for SSO… with application proxy" |
| 20 | Migrate / retire / island; no server leaves until SPNs resolved | §Kerberos | restated-as-design | Program decision rule |
| 21 | NTLM deprecated (all versions); use Negotiate | §Kerberos | verified (added) | Learn, "Deprecated features for Windows client" |
| 22 | NTLMv1 removed in Windows 11 24H2 / Server 2025; NTLMv2 to be removed in a future Server release | §Kerberos | verified (added) | Learn, "Features removed or no longer developed in Windows Server"; consistent with Book 06 Ch14 |
| 23 | NTLM is invisible to Entra sign-in logs and CA (whitepaper: "every NTLM event is opaque…") | §Kerberos | restated-as-design | Consistent with Book 06 index; whitepaper's "invisible to audit logs" not carried (Windows can audit NTLM) |
| 24 | TGT 10 h, renewal 7 days | §Distance | verified | Learn, Max-Ticket-Age; Max-Renew-Age |
| 25 | Service ticket 600 minutes | §Distance | verified | Learn, Azure NetApp Files AD connections (AD default 600 minutes) |
| 26 | Five-minute figure is clock skew, not latency budget | §Distance | verified | Learn, Kerberos registry entries (SkewTime default 5) |
| 27 | DC-dependent operations: logon TGT, SYSVOL/GPO, password change, hybrid registration | §Distance | verified | Rows 5 and Ch05 rows 2–3; whitepaper wording narrowed (consistent with Ch01 log) |
| 28 | Entra Kerberos partial TGT exchanged at an on-premises DC; line of sight needed | §Distance | verified (added) | Learn, "Introduction to Microsoft Entra Kerberos" |
| 29 | Device extensionAttribute1–15 set via Graph; enrollmentProfileName in rules | §Devices | verified | Learn, dynamic membership rules for devices |
| 30 | Entra CBA Windows smart-card sign-in on Entra-joined (and hybrid) devices; managed auth or Staged Rollout | §Devices | verified (extended) | Learn, "Windows smart card sign-in using Microsoft Entra CBA" |
| 31 | SSO to on-premises from Entra-joined devices needs DC line of sight and Entra Connect/Cloud Sync | §Devices | verified | Learn, "How SSO to on-premises resources works…" |
| 32 | Joiner: "encryption keys are escrowed" | §Lifecycle | verified (specified) | Learn, BitLocker with Intune: silent encryption backs recovery keys up to Entra ID |
| 33 | Leaver: "retired (and its Entra object deleted) or reset" | §Lifecycle | corrected | Order and cautions added: retire/wipe in Intune first after backing up the BitLocker key (retire suspends BitLocker), delete the Entra object last (nonrecoverable, removes BitLocker keys); Learn retire action and Entra PowerShell manage devices; consistent with Book 05 Ch06 |
| 34 | "The retirement itself is mechanical (Chapter 09)" | §Validation | corrected | Renumbered to Chapter 12 |
| 35 | Source footnote `cs07-apsc` (Autopilot scenarios) and `cs07-autopilot` (Autopilot overview) | — | removed (source) | Replaced by pages opened this session (rows 7, 9) |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Series Ch07 front matter, H1 "Compute: Domain-Joined → Cloud Identity + Device Management + Hybrid Management", bold subtitle | Title, H1, italic thesis, description | H1 fixed to book title |
| Ch07 dependency-chain blockquote | Kept | — |
| Ch07 §The compute claim + `cshc/compute-transformation.svg` | §The compute claim; `ch07-device-paths` | Figure replaced by house-style source |
| Ch07 §The device states (table, two rules, three dependencies) | Same section | Waypoint and line-of-sight facts added; Book 07 linked |
| Ch07 §Three migration patterns | Same section | Autopilot facts corrected/extended; Book 05 Ch02/Ch04 linked |
| Ch07 §Servers — the Arc path (six steps) | Same section; `ch07-server-arc-path` | Entra sign-in option and Defender onboarding added; Book 05 Ch09, Book 06 Ch10 linked |
| Ch07 §Kerberos and SPN retirement | Same section | NTLM paragraph and "What distance does and doesn't break" subsection added; Book 06 Ch15/Ch18 linked |
| Ch07 §Devices, attributes and certificates | Same section | CBA conditions extended; Book 07 Ch06 linked |
| Ch07 §Lifecycle after the move | Same section | Leaver order corrected |
| Ch07 §Validation | Same section | NTLM criterion added; Chapter 09 → 12 |
| Ch07 §Key takeaways | Same section | One takeaway added |
| Ch07 §Authoritative references list | Footnotes | Removed as a list |
| Ch07 Previous/Next lines | "Continue the book" callout | Restyled |
| Whitepaper Act 2, Kerberos ticket lifetimes, `caddr`/NAT discussion and DC-dependent operations | §What distance does and doesn't break | Ticket lifetimes, skew and DC-dependent operations carried; RFC 4120 `caddr`/KILE/FAST detail not carried (W1's Chapter 01 covers it) |
| Whitepaper Principle 3, NTLM elimination; Appendix "CBA + Cloud Kerberos trust" | §Kerberos (NTLM para); §Distance (Entra Kerberos); §Devices (CBA) | Whitepaper's ZTMM "CBA required as primary mechanism" not carried (identity strength belongs to Chapter 04/08) |
| Whitepaper Principle 5, round-trip reduction table | §Where compute runs | Table compressed to a sentence listing the techniques |
| Whitepaper Framework table, "Eliminate NTLM — BOD 25-01" | Not carried as stated | BOD 25-01 covers SCuBA cloud baselines, not on-premises NTLM; the NTLM case rests on Microsoft's deprecation (rows 21–22) |
| Whitepaper Act 2, "consolidating compute around 2010" | Not carried | History belongs to Chapter 01 (W1) |
| Whitepaper "Mainframe Access Modernization" | Not carried | Access-plane topic (Chapter 08, W4) |
| Whitepaper images `rId*.png` | Not carried | House-style sources instead |
