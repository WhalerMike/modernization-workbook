# Verification — Appendix A, Federal Requirements Crosswalk

File: `docs/books/b02-identity/appendix-a-federal-requirements-crosswalk.md`
Diagrams: none.
Verified: 2026-10-20

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Microsoft checklist "Configure Microsoft Entra for increased security" (preview), SFI-based themes, workforce tenants, controls added over time | The baseline | verified | learn.microsoft.com/entra/fundamentals/configure-security |
| 2 | Seven themes: identities and secrets; tenants; networks; engineering systems; monitor and detect; accelerate response; AI | The baseline | verified | same |
| 3 | Zero Trust Assessment automates testing against the checks | The baseline | verified | same |
| 4 | Every check name and minimum license in the crosswalk table | Crosswalk | verified (names corrected to Microsoft's current wording) | same |
| 5 | Source: "Protect networks — gated or non-FIPS in government clouds" | Filter 1 | corrected (Global Secure Access available in GCC, not yet GCC High/DoD/sovereign; FIPS claim removed as unverifiable) | learn.microsoft.com/entra/global-secure-access/reference-current-known-limitations |
| 6 | Named locations and Tenant restrictions v2 need only P1 | Filter 1 | verified | configure-security |
| 7 | GCC uses public Entra ID; GCC High/DoD use Entra Government | Filter 1 | verified | learn.microsoft.com/power-platform/admin/microsoft-dynamics-365-government |
| 8 | Accelerate-response checks need P2 or Workload ID | Filter 1 | verified | configure-security |
| 9 | Source: "AI — nascent; government availability unconfirmed" | Filter 1 | restated-as-design (confirm before planning; checks are agent-identity checks per Microsoft) | configure-security |
| 10 | Source: "Federal agencies typically run a suite that includes the identity governance features" | Filter 2 | restated-as-design ("many federal enterprise agreements"; program experience) | — |
| 11 | License tiers named in the checklist | Filter 2 | verified | configure-security |
| 12 | Friction / tier legend and per-row scoring | How to read; crosswalk | restated-as-design (program assessment) | — |
| 13 | Source control names ("All privileged role assignments are just-in-time", "Privileged accounts have phishing-resistant methods", "All sign-in activity from managed devices") | Crosswalk | corrected to Microsoft's names | configure-security |
| 14 | SCuBA policy IDs and text (MS.AAD.1.1v1 … 7.8v1), 20 mandatory Entra policies | Crosswalk; BOD section | verified | cisa.gov/.../bod-25-01-implementing-secure-practices-cloud-services-required-configurations |
| 15 | PHS: synced users' cloud password set to never expire by default; on-prem policy governs | Crosswalk notes | verified | learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-password-hash-synchronization |
| 16 | Microsoft rationale and remediation for "Use cloud authentication" | Crosswalk notes | verified | learn.microsoft.com/entra/fundamentals/zero-trust-protect-identities |
| 17 | M-22-09 requires phishing-resistant MFA for agency staff and enterprise-managed identities | Crosswalk notes; OMB section | verified (via Microsoft's M-22-09 page; OMB PDF opened, text not machine-readable) | bidenwhitehouse.archives.gov M-22-09 PDF; learn.microsoft.com/entra/standards/memo-22-09-multi-factor-authentication |
| 18 | Qualifying methods (CBA/PIV/CAC, FIDO2, WHfB); Authenticator alone isn't phishing-resistant | Crosswalk notes | verified | learn.microsoft.com/entra/standards/memo-22-09-multi-factor-authentication |
| 19 | BOD 25-01 title, Dec 17, 2024, FCEB scope, tenants with final SCuBA baselines | BOD section | verified | cisa.gov/news-events/directives/bod-25-01-implementing-secure-practices-cloud-services |
| 20 | Deadlines Feb 21, Apr 25, Jun 20, 2025; future updates per CISA; new tenants before ATO | BOD table | verified | same |
| 21 | "shall" mandatory vs "should" recommended; CISA notifies agencies of changes | BOD section | verified | same |
| 22 | Entra Connect Sync default cycle 30 minutes | Specification | verified | learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-sync-feature-scheduler |
| 23 | Identity specification contract requirements and integration shape | Specification | restated-as-design | — |
| 24 | SP 800-53 Rev. 5 title; Sept 2020, updated Dec 10, 2020; Release 5.2.0 Aug 27, 2025 | Control mapping | verified | csrc.nist.gov/pubs/sp/800/53/r5/upd1/final |
| 25 | Every control ID and title in the mapping table (AC-2, AC-2(1), AC-2(3), AC-2(7), AC-3, AC-3(13), AC-6, AC-6(5), AC-6(7), AU-2, AU-6, AU-12, CA-7, CM-6, CM-7, IA-2, IA-2(1), IA-2(2), IA-2(8), IA-2(12), IA-3, IA-5, IA-5(1), IA-8, SC-23, SI-4) | Control mapping; crosswalk | verified (parsed from NIST OSCAL catalog, Release 5.2.0) | raw.githubusercontent.com/usnistgov/oscal-content/.../NIST_SP-800-53_rev5_catalog.json |
| 26 | Which control each item "supports" | Control mapping; crosswalk | restated-as-design (program mapping; assessors decide satisfaction) | — |
| 27 | Source: "the identity domain closes controls related to account management, access enforcement, and continuous monitoring" | Control mapping | corrected (restated as "supports"; mapped to AC-2, AC-3, CA-7 and related) | — |
| 28 | CBA turns PIV/CAC into a phishing-resistant credential without a federation server | Opening paragraph | verified | learn.microsoft.com/entra/identity/authentication/concept-certificate-based-authentication |
| 29 | MS.AAD.3.2: the BOD 25-01 list still says 3.2v1 (alternative MFA until phishing-resistant MFA is enforced); ScubaGear 2.0.0's baseline renumbered it 3.2v2, "MFA SHALL be enforced for all users" (Feb 2026) | BOD section table | verified Oct 25, 2026; ID kept as the directive lists it, ScubaGear's ID added | cisa.gov BOD 25-01 required configurations; github.com/cisagov/ScubaGear baselines/aad.md |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| `docs/learning/entra-security-baseline-federal-crosswalk.md` — title and subtitle | Appendix title and description; "The baseline" | — |
| same — §1 The assessment in one paragraph | "The assessment in one paragraph" (network claim corrected) | — |
| same — §2 Filter 1 table | "Filter 1: government-cloud availability" (corrected; claim 5) | — |
| same — §2 Filter 2 | "Filter 2: licensing" (sourced license tiers; suite claim restated) | — |
| same — §2 Filter 3 | "Filter 3: Active Directory friction" | — |
| same — §3 How to read the crosswalk (availability, friction, tier legends) | "How to read the crosswalk" | — |
| same — §4 Illustrative controls table (9 rows) | "The crosswalk: identity controls" (9 source rows kept with Microsoft names, plus 9 added rows, license, SCuBA and NIST columns) | — |
| same — §5 Sequencing implication | "Sequencing" | — |
| same — footer ("pedagogical planning artifact… verify availability") | Folded into "The baseline" (re-pull the checklist each cycle) and BOD section (cisa.gov list is authoritative) | — |
| `docs/modernization-specs/identity.md` — title, intro | "The identity modernization specification" | — |
| same — Contract requirements (4 items) | "Contract requirements" list | — |
| same — Integration shape (3 items) | "Integration shape" list (sync interval sourced) | — |
| same — Control mapping | "NIST SP 800-53 Rev. 5 control mapping" (expanded table) | — |
| same — footer | Not carried | Provenance boilerplate |
| `docs/learning/README.md` | Not carried (see Chapter 03 ledger) | Navigation page only |
