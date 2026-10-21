# Verification — Chapter 05, ScubaGear and Microsoft's Zero Trust Assessment

Writer W3. All sources opened October 21, 2026. Microsoft Learn pages read with the Microsoft Learn MCP tools. ScubaGear docs and baselines read from GitHub at `v1.8.0` and `main`. Zero Trust Assessment release data read from the GitHub API; the 3.1.0 source tarball was downloaded to a scratch directory and its test definitions counted by attribute (`Pillar`, `RiskLevel`, `Service`, `TestId`, synopsis text). Nothing was executed against a tenant.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | ScubaGear = compliance with federal baseline; ZTA = maturity against Microsoft Zero Trust/SFI guidance | Opening; at a glance | verified | SCuBA/ScubaGear README; Learn ZTA overview |
| 2 | ZTA tests drawn from NIST, CISA, CIS, Microsoft internal baselines, customer insight; "hundreds" of items | At a glance; ZTA | verified | Learn ZTA overview |
| 3 | ScubaGear 1.8.0 May 7, 2026; 2.0.0 prerelease | At a glance | verified | PowerShell Gallery; GitHub releases API |
| 4 | ZTA 3.1.0 Oct 20, 2026 | At a glance | verified (new) | GitHub releases API; PowerShell Gallery (3.1.4-preview also listed) |
| 5 | ScubaGear products (incl. Power BI) | At a glance | verified | v1.8.0 README |
| 6 | ZTA scope: Entra, Intune, Azure, Exchange, SharePoint, Purview/AIP | At a glance | corrected | Learn get-started (connects to Graph, Azure, Exchange, SharePoint, AIP); source listed Entra, Intune, Azure, Purview only |
| 7 | ScubaGear: PowerShell queries M365 APIs, OPA/Rego, HTML/JSON/CSV | At a glance | verified | v1.8.0 README |
| 8 | ZTA output: HTML report + local export folder | At a glance | corrected | Learn get-started. Source said "HTML report + JSON, by pillar"; JSON not documented, so not claimed |
| 9 | Policy ID vs numeric TestId; SHALL/SHOULD vs High/Medium/Low | At a glance | verified | `aad.md`; ZTA 3.1.0 `TestId`/`RiskLevel` attributes (215 High, 129 Medium, 20 Low) |
| 10 | Both read-only | At a glance | verified, qualified | Learn get-started ("read-only"); ScubaGear reads settings. Qualified by role requirements (rows 13, 16) |
| 11 | ScubaGear runs in PowerShell 5, `Install-Module`, `Invoke-SCuBA` | ScubaGear | verified | v1.8.0 README |
| 12 | Default ProductNames aad, defender, exo, sharepoint, teams; powerplatform optional; `-M365Environment` commercial/gcc/gcchigh/dod; required for Power Platform, GCC High, DoD | ScubaGear | verified (new) | v1.8.0 `parameters.md` |
| 13 | Roles: Global Reader for most; Power Platform Administrator + license; Fabric Admin for Power BI; Graph read permissions consent | ScubaGear | verified (new) | `interactive.md` |
| 14 | CISA requires results from most recent tool version (manual reporting) | ScubaGear | verified | Implementation guidance |
| 15 | ZTA module `ZeroTrustAssessment`; open source; part of Zero Trust Workshop | ZTA | verified | Learn overview; Learn Zero Trust Workshop |
| 16 | PowerShell 7 (3.1.0 needs 7.6+); Global Admin for first consent; later runs Global Reader, Security Reader, Exchange Admin, SharePoint Admin vs "Global Reader" on same page | ZTA | verified (inconsistency recorded) | Learn get-started; 3.1.0 release notes |
| 17 | 21 Graph permissions; `Connect-ZtAssessment`, `Invoke-ZtAssessment`, report path; >24 h for large tenants | ZTA | verified | Learn get-started |
| 18 | `-Environment` (Global, USGov, USGovDoD, China, Germany) and `-ExchangeEnvironmentName` in 3.1.0 | ZTA | verified (new) | 3.1.0 `Connect-ZtAssessment.ps1`. Learn doesn't document government clouds; GCC-on-commercial-endpoints stated as guidance to confirm |
| 19 | 3.1.0 has 364 tests: Identity 135, Network 70, SecOps 57, Devices 43; smaller Data, AI, Infrastructure | ZTA | verified (writer's count) | 3.1.0 test definitions (first `Pillar` value per file; some files carry combined values such as Data/AI) |
| 20 | Learn still describes Identity, Devices, Network, Data tabs | ZTA | verified | Learn get-started |
| 21 | SCuBA-only: EXO mail flow (forwarding, SPF, DKIM, DMARC, SMTP AUTH), Teams, SharePoint sharing, Power Platform/BI | Overlap table | verified | v1.8.0 baselines; 3.1.0 tests grep (no SPF, DKIM, forwarding, sharing or Power Platform tests; one DMARC mention inside an anti-phishing test) |
| 22 | Defender for Office 365 has "essentially no" ZTA counterpart | Overlap; inverse gap | corrected | 3.1.0 tests Safe Links, Safe Attachments, anti-phishing, anti-spam, Teams protection, ZAP (SecOps pillar) |
| 23 | ZTA-only: Intune, Azure networking/infrastructure, GSA, Purview, SecOps, AI agents | Overlap table | verified | 3.1.0 tests and release notes |
| 24 | Illustrative split 295 checks, 140 (~47%) / 155 (~53%) | ILLUSTRATIVE callout | unverifiable; kept labelled illustrative | Computed in the source from Microsoft's demo report; noted as predating 3.1.0 |
| 25 | Entra baseline "~30 policies at v1.8.0"; 5.5–5.7 and AI-agent policy | Caveats | corrected | v1.8.0 has 30; the additions are on `main` (2.0.0 line), not in v1.8.0 |
| 26 | 20 of 30 Entra policies mandatory; ZTA 135 identity tests | Caveats | verified | Required Configurations page; 3.1.0 tests |
| 27 | 22 of 50 mandatory M365 policies in EXO, Teams, SharePoint, Power Platform | Inverse gap | verified (computed: 10+4+4+4) | Required Configurations page |
| 28 | ZTA isn't a BOD 25-01 tool; directive names SCuBA assessment tools | Inverse gap | verified | BOD 25-01 page |
| 29 | Report and export folder are sensitive; share only with authorized staff; delete local folder | What this means | verified | Learn get-started (Caution) |
| 30 | Reconcile at control level (NIST 800-53 / FedRAMP Moderate) | What this means | restated-as-design | Program recommendation |
| 31 | GCC-Moderate tenant caps ZTMM Identity/Devices/Networks near Initial without agency analytics | — | removed | Internal boundary-model claim; not externally verifiable; boundary questions belong to Book 10 |

## Carry-forward ledger

Source: `docs/whitepapers/zta-scuba-relationship.md`.

| Source page § | Went to | Or why not carried |
|---|---|---|
| Problem, solution, ask box | Ch05 opening and §What this means | `fmp zta overlap` ask moved to Ch09 by reference |
| Executive summary | Ch05 opening; §Where they overlap | Overlap description updated for 3.1.0 (row 22) |
| Callout note (illustrative; output sensitive) | Ch05 ILLUSTRATIVE callout; §What this means | — |
| The two tools at a glance (table) | Ch05 §The two tools at a glance | Rows corrected (rows 6, 8) and versions added |
| Where they overlap (three-column table) | Ch05 §Where they overlap; diagram `ch05-two-tools-overlap` | Defender moved to shared |
| Illustrative split (295 checks) | Ch05 ILLUSTRATIVE callout | — |
| Two caveats | Ch05 numbered caveats | Counts corrected |
| What this means for your agency | Ch05 §What this means | GCC-Moderate maturity-cap caveat removed (row 31) |
| Producing your own figures (`fmp zta overlap`, `fmp zta remediate`) | Ch09 (referenced from the ILLUSTRATIVE callout) | Running and ingesting the tools is Chapter 09's subject; the operational guide that feeds Ch09 carries the `fmp zta` commands |

## Review round 1 (October 21, 2026)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| R1 | Reconciliation baseline: was "the FedRAMP Moderate baseline" | Where they overlap / reconcile | corrected | CISA ScubaGear v1.8.0 "Mappings": "limited to controls found within the FedRAMP High baseline", https://github.com/cisagov/ScubaGear/blob/v1.8.0/docs/misc/mappings.md (opened Oct 21, 2026); now agrees with Ch09 and Ch10 |
