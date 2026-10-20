# Verification — Chapter 02 — The Hybrid Join Trap

File covered: `02-the-hybrid-join-trap.md`.
Diagram sources: `docs/images/diagrams/b05-devices/src/ch02-the-flip.flow.yaml`, `ch02-join-paths.flow.yaml`.
All Microsoft sources opened (fetch or search excerpt) through the Microsoft Learn MCP tools on October 20, 2026.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | "All sign-in activity comes from managed devices" as a typical Zero Trust baseline control | §A program | restated-as-design | Program framing; no specific baseline cited |
| 2 | Microsoft CA template: grant "compliant" or "hybrid joined" (or MFA), created in report-only, excludes emergency-access accounts | §A program; ledger | verified | Learn, "Require a compliant device, Microsoft Entra hybrid joined device, or MFA for all users" |
| 3 | 50,000-device fleet | throughout | restated-as-design | Labeled as a framing device, not a real engagement |
| 4 | Entra Connect ≥ 1.1.819.0; don't exclude default device attributes; configure computer OUs in sync scope; wizard | §How the fleet converts | verified | Learn, "Configure Microsoft Entra hybrid join" |
| 5 | Cloud Sync can sync computer objects for hybrid join; doesn't configure federation | §How | verified | Learn, "Microsoft Entra hybrid joined devices" |
| 6 | SCP in configuration naming context; keywords azureADId and azureADName; must exist in every forest with domain-joined computers | §How | verified | Learn, "Configure Microsoft Entra hybrid join manually" |
| 7 | Entra Connect configures SCP per forest with enterprise admin credentials | §How | verified | Learn, "Configure Microsoft Entra hybrid join" |
| 8 | Source: SCP alternative is the GPO "Register domain-joined computers as devices" | §How | corrected | Documented GPO path is the client-side SCP registry values `TenantId`/`TenantName` under `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\CDJ\AAD` (Learn, "Microsoft Entra hybrid join targeted deployment"); the named GPO setting couldn't be confirmed on Learn and was dropped |
| 9 | Automatic Device Join task triggered on domain join and user sign-in, retried hourly | §How | corrected | Source said "fires on the next logon or reboot"; Learn, "How it works: Device registration" |
| 10 | Managed flow: self-signed cert to userCertificate; sync creates device object; registration and device certificate | §How | verified | Learn, "How it works: Device registration" |
| 11 | Synced object shows Pending until registration completes | §How | verified | Learn, "Microsoft Entra hybrid join targeted deployment" |
| 12 | PRT issued at Windows sign-in on hybrid-joined devices | §How | verified | Learn, "Understanding Primary Refresh Token (PRT)" |
| 13 | No per-device gate/ownership/position/reconciliation check in the path; effortlessness is the hazard | §How | restated-as-design | Program analysis of the documented mechanism |
| 14 | Microsoft recommends targeted deployment with a varied pilot group first | §How | verified | Learn, "Plan your Microsoft Entra hybrid join implementation"; "Configure Microsoft Entra hybrid join" |
| 15 | Entra join recommended default for new/reset devices; hybrid for new typically not recommended | §What Microsoft recommends | verified | Learn, "Microsoft Entra joined vs. Hybrid Microsoft Entra joined" |
| 16 | Hybrid join recommended for existing domain-joined devices (minimal impact) | §Recommends | verified | Same. Source implied hybrid join is simply the wrong choice; chapter adds Microsoft's nuance |
| 17 | Hybrid join shouldn't be long term or end goal | §Recommends | verified | Same |
| 18 | Autopilot: deploying new devices as hybrid joined isn't recommended | §Recommends | verified | Learn, "Deploy Microsoft Entra hybrid joined devices by using Intune and Windows Autopilot" |
| 19 | Entra join first choice for new devices; SSO to on-prem servers on org network | §Recommends | verified | Learn, "Plan your Microsoft Entra device deployment" |
| 20 | No supported conversion hybrid→Entra join without reset; Autopilot Reset unsupported for hybrid (full wipe); move at complementary event | §Recommends | verified | Learn, "Microsoft Entra joined vs. Hybrid…" |
| 21 | Hybrid devices need periodic DC line of sight; device/user password change and TPM reset break; devices become unusable | §Recommends; ledger | verified | Learn, "Plan your Microsoft Entra hybrid join implementation" |
| 22 | Moving away from on-prem domain requires moving away from hybrid join | §Recommends | verified | Learn, "Microsoft Entra joined vs. Hybrid…" |
| 23 | Three systems of record (AD, Entra ID, Intune) with no default reconciliation | §Ledger | restated-as-design | Program analysis |
| 24 | Dual state (Entra registered + hybrid joined) can cause nondeterministic evaluation | ledger | verified | Learn, "Microsoft Entra device management FAQ" |
| 25 | Moving computer out of sync scope deletes Entra device; moving back creates Pending object needing re-registration | ledger | verified | Learn, "Pending devices in Microsoft Entra ID" |
| 26 | Hybrid devices follow on-prem stale policy; deleting only in Entra re-syncs as Pending | ledger | verified | Learn, "How To: Manage stale devices in Microsoft Entra ID" |
| 27 | Deleting a device object deletes stored BitLocker recovery keys | ledger | verified | Same |
| 28 | Ownership, provenance and reconciliation ledger rows | ledger | restated-as-design | Program analysis; chapter states which rows are documented behavior |
| 29 | Hybrid join OS support: Windows 11/10 except Home, Server 2016/2019/2022 | §Never covers | verified | Learn, "Microsoft Entra hybrid joined devices" |
| 30 | Not supported on DCs; Server Core supports no device registration | §Never covers | verified | Learn, "Plan your Microsoft Entra hybrid join implementation" |
| 31 | Entra join supports macOS 13+ and Ubuntu / RHEL LTS | §Never covers | verified | Learn, "Microsoft Entra joined devices" |
| 32 | BYOD, contractors, guests never hybrid joinable | §Never covers | restated-as-design | Follows from #29 (organization-owned, domain-joined only); not separately footnoted |
| 33 | Governed path, L0–L4 ladder, plan/apply/dry-run, signed evidence | §Governed path | restated-as-design | Program design (Ch05 owns detail) |
| 34 | Report-only policies evaluated but not enforced; results in sign-in logs | §Governed path step 4 | verified | Learn, "Analyze Conditional Access policy impact" |
| 35 | Step 8 "plan the exit from the waypoint" | §Governed path | restated-as-design | Added by the chapter from #15–#20 |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| whitepapers/hybrid-join-without-governance.md — Title and subtitle | Ch02 title, thesis line, §A program | — |
| — "Problem, solution, ask" | Ch02 "In this chapter," §A program, §What to do first | — |
| — "The one sentence this turns on" | Ch02 thesis line and §How (closing paragraph) | Quotation block not reused; restated |
| — §1 "The control being satisfied" | Ch02 §A program that turns out to be a switch | Now anchored to Microsoft's CA template |
| — §2 "The ungoverned path" (three steps) | Ch02 §How the fleet converts itself (four steps) | GPO name and task trigger corrected (#8, #9) |
| — §3 "The loss ledger" (seven-row table) | Ch02 §The loss ledger (all seven rows) | Rows anchored to Learn where documented |
| — §4 "What hybrid join still does not satisfy" | Ch02 §What hybrid join never covers | — |
| — §5 "The governed path" (seven steps, L0–L4 table) | Ch02 §The governed path (eight steps, ladder table) | Step 8 added; detail deferred to Ch05 |
| — "Call to Action" | Ch02 §What to do first | — |
| Assignment item: Microsoft's current join recommendation | Ch02 §What Microsoft recommends now | New section; not in sources |
