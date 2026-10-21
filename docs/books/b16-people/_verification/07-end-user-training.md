# Verification — Chapter 07, End-User Training for the Modernized Estate

Writer W4. Source: `docs/operational-guides/end-user-training.md` (6,109 words by `wc -w`). All primary sources opened October 21, 2026. Microsoft claims checked with the Microsoft Learn search and fetch tools. NIST SP 800-63B-4, SP 800-50 Rev. 1 and OMB M-24-08 downloaded with curl (generic user agent, no identifying headers) and read as extracted text (pypdf); M-22-09 and SP 800-37 Rev. 2 read from text extractions made earlier in the same session's scratchpad; SP 800-53 AC-8 read from the NIST release 5.2.0 OSCAL catalog. U.S. Code and CFR text read on law.cornell.edu; the Revised 508 Standards read on access-board.gov (ecfr.gov redirected to a block page and was not used). OMB's memoranda page was checked for a rescission of M-24-08; none is listed.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | 5 CFR 930.301 requires training when the system environment or procedures change significantly, plus annual awareness and awareness before access for new employees | Opening | verified | 5 CFR 930.301(a)(1), (b), (d) |
| 2 | AT-2 includes training when required by system changes | Opening | verified | Book 14 Ch09 (linked; settled fact) |
| 3 | M-22-09: staff, contractors and partners must use phishing-resistant methods; discontinue SMS/voice, OTP and push for routine self-service access; PIV simplest; FIDO2/WebAuthn permitted | Module 1 | verified | M-22-09 §III.A.2 text |
| 4 | SP 800-63B-4 (July 2025) §2.2.2: federal agencies SHALL require phishing-resistant authentication for staff, contractors, partners | Module 1 | verified | SP 800-63B-4 §2.2.2 |
| 5 | Passwords, look-up secrets, out-of-band, OTP each "not phishing-resistant" | Module 1 | verified | SP 800-63B-4 §§3.1.1–3.1.5 |
| 6 | Source taught Authenticator push / phone sign-in as the everyday target | Module 1 | corrected | Microsoft: phone sign-in "not considered phishing-resistant" (Windows 365 credential page); M-22-09 |
| 7 | Entra phishing-resistant methods list (WHfB, Platform Credential for macOS, synced passkeys, FIDO2 keys, passkeys in Authenticator, CBA) | Module 1 | verified | Microsoft Learn, Entra authentication overview |
| 8 | First credential should be portable; register at least two methods | Module 1 | verified | Microsoft Learn, phishing-resistant deployment plan |
| 9 | 63B-4: CSPs should encourage at least two separate means of authentication | Module 1 | verified | SP 800-63B-4 §4.1.2.1 |
| 10 | Synced passkeys for federal enterprise: FISMA Moderate sync fabric, device management, agency-managed accounts | Module 1 | verified | SP 800-63B-4 Appendix B |
| 11 | Which passkey types are allowed is a CISO decision; don't save work passkey to personal account | Module 1 | restated-as-design | — |
| 12 | Windows smart card sign-in with Entra CBA needs no special client configuration; select smart card, enter PIN | Module 1 | verified | Microsoft Learn, Windows smart card sign-in using Entra CBA |
| 13 | Browser CBA: "Use a certificate or smart card"; MRU makes CBA the default next time | Module 1 | verified | Microsoft Learn, CBA technical concepts |
| 14 | Source: certificates deployed and renewed automatically via Intune (applied to PIV) | Module 1 | corrected | PIV certificates come from the card issuer; Intune applies to deployed device/user certificates (CBA docs; Book 07) |
| 15 | WHfB PIN tied to device, never leaves device, TPM-backed with anti-hammering; per-device setup | Module 1 | verified | Microsoft Learn, WHfB common questions |
| 16 | Passkey registration path: Security info, Add sign-in method, Passkey | Module 1 | verified | Microsoft Learn, register a synced passkey; register with FIDO2 key |
| 17 | Minimum OS: iOS 17, Android 14, Windows 10 22H2, macOS 13 | Module 1 | verified | Microsoft Learn, deployment plan "Plan device readiness" |
| 18 | Number matching enabled for all Authenticator push notifications; user types the number into the app | Module 1 | verified | Microsoft Learn, number matching |
| 19 | Source: "match a two-digit number on your phone and tap Approve" | Module 1 | corrected | Same; the user enters the number shown on the sign-in screen |
| 20 | Report suspicious activity sets user to high risk in ID Protection | Module 1 | verified | Microsoft Learn, MFA settings, Report suspicious activity |
| 21 | Source: FIDO2 keys mainly for shared workstations/kiosks | Module 1 | corrected | Microsoft recommends FIDO2 keys as first portable credential for admins and highly regulated users |
| 22 | SSPR methods list; one or two required; Authenticator and OATH count as one method; changing methods can strand users | Module 2 | verified | Microsoft Learn, How SSPR works |
| 23 | Combined registration at Security info | Module 2 | verified | Microsoft Learn, combined registration overview |
| 24 | aka.ms/sspr; Windows sign-in Reset password link on Entra-joined/hybrid-joined Windows 10 1803+ | Module 2 | verified | Microsoft Learn, SSPR on Windows sign-in screen |
| 25 | Writeback needed for on-premises-managed passwords | Module 2 | verified | Microsoft Learn, How SSPR works |
| 26 | Smart lockout: 10 attempts commercial, 3 Azure US Government; 1 minute then longer; customizable with P1 | Module 2 | verified | Microsoft Learn, smart lockout |
| 27 | Source: lockout "starts at about one minute and increases" | Module 2 | verified (kept, with cloud-specific thresholds added) | Same |
| 28 | "I forgot my password" in SSPR resets lockout to 0; "I know my password" doesn't | Module 2 | verified | Same |
| 29 | Source: password "14+ characters" with upper/lower/number/special | Module 2 | corrected | SP 800-63B-4 §3.1.1.2 items 1, 5, 6, 8; M-22-09 ("must not require use of special characters or regular rotation") |
| 30 | Source: security questions and personal email as recovery | Module 2 | corrected / restated-as-design | SP 800-63B-4 §3.1.1.2 item 8; personal email left to privacy office and CISO |
| 31 | Total-loss recovery follows Book 15's verification ladder and TAP procedure | Module 2 | verified | Book 15 Ch03, Ch04 (linked; settled) |
| 32 | 63B-4 requires an account recovery notification in all cases | Module 2 | verified | SP 800-63B-4 §4.2.3 |
| 33 | Source: compliance grace period "usually 24–72 hours" | Module 3 | corrected | Intune default Mark noncompliant = 0 days; grace is agency-configured |
| 34 | Source: organization cannot see personal files, browsing history, etc. | Module 3 | corrected | Microsoft data-visibility article: never/always/might lists; corporate-owned Windows device query of file paths, registry, processes |
| 35 | Company Portal can carry an agency privacy message | Module 3 | verified | Microsoft Learn, configure Company Portal, Privacy |
| 36 | AC-8 system use notice: U.S. Government system; may be monitored, recorded, audited | Module 3 | verified | SP 800-53r5 AC-8 a (OSCAL 5.2.0) |
| 37 | Correlation ID identifies a sign-in in the Entra sign-in logs | Module 3 | verified | Microsoft Learn, troubleshoot sign-in errors |
| 38 | OneDrive work/school recycle bin purged after 93 days unless configured; Files Restore 30 days; KFM covers Desktop, Documents, Pictures | Module 4 | verified | Microsoft Learn, OneDrive overview |
| 39 | Don't delete from mapped drives; retire on schedule with records officer | Module 4 | restated-as-design | Book 01 Ch09 (records) |
| 40 | Access approvals come from owners/approvers, not help desk | Module 4 | verified | Book 04 Ch06 (linked) |
| 41 | SP 800-37: system user reports anomalous or suspicious behavior | Module 5 | verified | SP 800-37r2 App. D, System User |
| 42 | Built-in Report button versions; requires user reporting on and built-in button selected; phishing reports deleted | Module 5 | verified | Microsoft Learn, report phishing in Outlook |
| 43 | GCC, GCC High, DoD: only "My reporting mailbox only" | Module 5 | verified | Microsoft Learn, User reported settings |
| 44 | Admin "Mark as and notify" results email to users | Module 5 | verified | Same |
| 45 | Report Message / Report Phishing add-ins in maintenance mode | Module 5; currency section | verified | Microsoft Learn, transition from add-ins |
| 46 | Phishing exercise rules (legal review, no impersonation, non-punitive) | Module 5 | verified | Book 14 Ch09 (linked; settled) |
| 47 | CISA AA23-320A revised July 29, 2025: posed as IT/help desk; got OTPs; posed as employees to help desk; mitigations | Module 6 | verified | CISA advisory page |
| 48 | Help desk will / won't list | Module 6 | restated-as-design | Consistent with Book 15 Ch03 ladder |
| 49 | Microsoft communications cadence 60/45/30/15/7/1 days; other channels; templates incl. help desk | Timing | verified | Microsoft Learn, deployment plan "Plan end user communications" |
| 50 | SP 800-50r1: communications plan per phase; "sufficient time"; explain why mandated and consequences | Timing | verified | SP 800-50r1 §2.11, §4.3 |
| 51 | Wave calendar table | Timing | restated-as-design | — |
| 52 | Microsoft: track help desk ticket volume, slow/resume, date ranges, a group per wave | Timing | verified | Microsoft Learn, deployment plan "Monitor help desk ticket volume" |
| 53 | Books 02/05 treat registration and ticket volume as wave go/no-go inputs | Timing | verified | Book 02 Ch06; Book 05 Ch06 |
| 54 | Wave message rules (one sender, no links, no personal data requests) | Timing | restated-as-design | — |
| 55 | 29 U.S.C. 794d(a)(1)(A): comparable access for federal employees with disabilities unless undue burden | Accessibility | verified | law.cornell.edu |
| 56 | E205.3 includes "Educational or training materials"; E205.4 WCAG 2.0 A and AA | Accessibility | verified | access-board.gov ICT standards |
| 57 | 63B-4 §8: identity providers expected to comply with 508; design for people with disabilities; "a single authenticator type does not usually suffice" | Accessibility | verified | SP 800-63B-4 §8, §8.1.1 |
| 58 | M-24-08 (Dec 21, 2023): 508 program and program manager; CIO leads; CHCO training plans; help desk assistive-technology training | Accessibility | verified | M-24-08 §III.A, §III.F, Appendix A |
| 59 | SP 800-50r1: plan for accessibility requirements; elements meet accessibility standards | Accessibility | verified | SP 800-50r1 §2.1, §3.2.1.4 |
| 60 | Accessibility checklist | Accessibility | restated-as-design | — |
| 61 | Module currency practice (owners, review dates, placeholders) | Currency | restated-as-design | — |
| 62 | Source's "Passwords are the #1 target" and "three seconds" Authenticator timing | — | removed | Not verified; replaced by federal requirement framing |
| 63 | Source's "These three steps cover 90% of what you need" | — | removed | Unverifiable statistic |
| 64 | Source FAQ: "Authenticator does not give your organization access to your personal phone" | — | removed | No Microsoft source found that states it for unenrolled phones; replaced by device-visibility facts and privacy-office wording |
| 65 | Source FAQ: SharePoint "has separate, larger storage" | — | removed | Not verified; not needed |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, CONTROLLED / GCC-MODERATE banners, author, version, repository lines | — | Classification stamps, personal name and internal metadata not carried (workbook style; stamps removed repo-wide) |
| §1 What's Changing and Why (What's happening, benefits, when, what stays the same, key message) | Opening; "What changes for a user, and what doesn't" | Marketing tone dropped; "what stays the same" kept as half of the table; phasing tied to Book 01 waves |
| §1 figure 01 (before/after PNG) | Replaced by `ch07-what-users-learn` house-style diagram | Old PNG not reused |
| §2.1 Overview: why passwordless; methods table | Module 1, "What federal policy requires" and methods table | Rebuilt on M-22-09 and SP 800-63B-4; PIV added; push demoted |
| §2.2 Setting up Windows Hello for Business (steps, PIN tip) | Module 1, "Set up Windows Hello for Business" | Step-by-step Settings paths condensed; PIN explanation kept and sourced |
| §2.2 figure 02 (WHfB enrollment mockup) | — | Product UI mockup not reproduced; training should use the agency's own screens |
| §2.3 Setting up Microsoft Authenticator (8 steps, tap tip) | Module 1, "Register a passkey" and "Treat any prompt you didn't start as an attack" | Re-targeted to passkey in Authenticator; "enable phone sign-in" corrected; number-match description corrected |
| §2.3 figure 03 (Authenticator three-step) | — | Not reproduced |
| §2.4 Using a FIDO2 security key | Module 1 methods table, "Register a passkey," correction on kiosks | Shared-workstation-only framing corrected |
| §3.1 What is Conditional Access | Module 3, "When access is blocked"; Book 04 linked | Concept explanation shortened; Book 04 carries the model |
| §3.2 What you might experience (scenario table) | Module 3, "When access is blocked" | Condensed; "connect to VPN first" advice dropped (zero trust target doesn't rely on VPN; Books 09, 11) |
| §3.3 What to do if blocked (steps, correlation ID, screenshot tip) | Module 3, "When access is blocked" | Kept; correlation ID sourced |
| §3 figure 04 (block-page mockup) | — | Not reproduced |
| §4 Certificate-Based Authentication (what it is, what you'll notice, picking the right certificate) | Module 1, "Sign in with a PIV card" | Re-centered on PIV/CAC; Intune auto-renewal claim corrected for PIV |
| §5.1–5.3 OneDrive Known Folder Move, what you'll see, status icons, useful actions | Module 4, "Files in OneDrive, SharePoint and Teams" | Step list condensed; icons kept as a lesson (and as a 508 note: name, don't only show color) |
| §5 figure 05 (OneDrive status card) | — | Not reproduced |
| §5.4 Mapped drives (H:, S:) and Important box | Module 4 | Kept; records-officer consultation added |
| §6.1–6.3 Intune Company Portal (what, installing, using) | Module 3, "Enrollment and the Company Portal" and "What not compliant means" | Condensed; per-platform install table not carried (product docs change; agency screens) |
| §6.4 Enrolling a new device | Module 3; Book 05 Ch04 linked | Settings path not carried; Autopilot/governed path per Book 05 |
| §6 figure 06 (Company Portal mockup) and pin-to-taskbar tip | — | Not reproduced; trivial tip dropped |
| §7.1 Setting up SSPR (methods incl. alternate email; Do This Now) | Module 2, "Registering and resetting"; correction on security questions and personal email | Kept with corrections |
| §7.2 Resetting your password (Windows sign-in, web; complexity rule; tip) | Module 2 | Complexity rule corrected |
| §7.3 Unlocking your account; frequent-lockout note | Module 2, "Lockout" | Kept and sourced |
| §8.1 Managing your groups | Module 4, "Groups and access requests" | Condensed |
| §8.2 Requesting access; finding the owner tip | Module 4; Book 04 Ch06 | "Approvals are handled automatically" replaced by owner/approver model |
| §9 FAQ, Sign-in & Authentication (PIN, still asked for password, lost phone, personal phone, too many prompts) | Module 1 (PIN; password prompts); Module 2 ("When everything is lost"); Module 5 table (lost phone); Module 1 (prompts you didn't start) | Personal-phone answer removed as unverified; replaced by synced-passkey and device-visibility facts |
| §9 FAQ, Files & OneDrive (deleted file 93 days; OneDrive full; phone access) | Module 4 (93 days, Files Restore) | Storage-full and phone-app answers not carried (routine product help) |
| §9 FAQ, Device & Compliance (grace period; new computer) | Module 3 | Grace period corrected |
| §9 FAQ, General (who to contact; personal Microsoft account; can org see personal files; traveling offline; overwhelming) | Module 6 (contact rules); Module 3 (what the agency can see) | Personal-account and offline answers not carried (product help, not training design); "overwhelming" answered by the wave cadence |
| §10 Quick Reference Card (URLs, Top 3 actions) | URLs used in-line in Modules 1–2; currency section (placeholders) | Card not reproduced; "90%" claim removed |
| Appendix A Glossary | — | Terms defined in context and in Books 02–05; glossary not duplicated |
| Appendix B Cross-references to internal guides | — | Internal document names not carried (vocabulary rule); workbook books linked instead |
| Compliance Amendment: IT staff security training (AT-3) | Book 14 Ch09 (linked); Chapter 08 | Role-based training belongs to Book 14 Ch09 and Book 16 Chs 03–05; internal ID `FMP_187` dropped |
| Compliance Amendment: Training records (AT-4) | Module timing and Chapter 08 (evidence row); Book 14 Ch09 linked | Not duplicated |
| Compliance Amendment: Phishing simulation (repeat clickers get targeted training) | Module 5, linked to Book 14 Ch09 | Kept under Book 14's non-punitive rules |
