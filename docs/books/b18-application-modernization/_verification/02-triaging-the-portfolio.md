# Verification — Chapter 02, Triaging the Portfolio

## Sources opened

Opened October 28, 2026: AWS Prescriptive Guidance, "About the migration strategies" (large migration guide); AWS Cloud Enterprise Strategy Blog, Stephen Orban, "6 Strategies for Migrating Applications to the Cloud" (November 1, 2016); Microsoft Learn, Cloud Adoption Framework, "Select your cloud migration strategies" (MCP search and full fetch; the old "5 Rs of rationalization" URL now redirects to it); Microsoft Learn, "The 6 Rs of application modernization" (MCP fetch); OMB Circular A-130 PDF (§5.a(1), §5.a(3), §5.d(1)); FIPS 199 publication page and PDF (Sections 3–4); GAO-25-107795 PDF (pages 4–7, 11–12, 20); 40 U.S.C. §11312 (govinfo, 2023 edition); Technology Modernization Fund "Agency and project fit" and "2026 Call for Proposals" pages.

Manual checks: Gartner's research note on the five options is paywalled and was not consulted. The press coverage (Help Net Security, May 16, 2011; Computer Weekly; IT Business Edge) refused automated retrieval (HTTP 405/403); the five names and Gartner's meaning of "refactor" and "revise" are taken from the search-result summaries of those articles and are labeled in the chapter as "reported at the time". The brief's "Gartner's 2010 '5 Rs'" could not be confirmed; AWS dates them to 2011, and the coverage is from 2011.

Settled-fact note: the federal framework crosswalk quotes the TMF 2026 call as saying competitive projects are "less than $25M and take no more than three years." The TMF "fit" page opened today says "typically less than $25M," a "five year repayment timeline," and outcomes "ideally within 12 months"; the 2026 call page itself no longer states size or duration. The chapter cites the fit page. Not necessarily stale (the crosswalk may quote the call PDF), but worth a recheck by the editor.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Gartner five options: rehost, refactor, revise, rebuild, replace | Names | unverifiable on a primary source; carried as "reported at the time" with secondary citation | Help Net Security (search result); AWS blog for the year |
| 2 | AWS dates Gartner's 5 Rs to 2011 | Names | verified | AWS blog, 2016 |
| 3 | Gartner's "refactor" meant running on a provider's platform; "revise" modify code first | Names | unverifiable on a primary source; labeled "as reported" | Search-result summaries |
| 4 | AWS 7 Rs: retire, retain, rehost, relocate, repurchase, replatform, refactor or re-architect | Names; table | verified | AWS PG |
| 5 | Relocate: move to cloud version of the platform without changes; repurchase "drop and shop", typically SaaS | Names | verified | AWS PG |
| 6 | AWS: refactor most complex, not recommended for large migrations; migrate first, modernize after | Names | verified | AWS PG |
| 7 | CAF eight strategies tied to business drivers | Names; table | verified | Microsoft CAF |
| 8 | CAF: don't rehost problematic workloads; rehost only if no modernization needed for at least two years | Names | verified | Microsoft CAF |
| 9 | Microsoft application modernization guidance uses six Rs (rehost, replatform, refactor, rebuild, retire, retain) | Names | verified | Microsoft 6 Rs page |
| 10 | A-130: custom development only when no existing alternative can efficiently meet the need (quoted) | Replace is retire | verified | A-130 §5.d(1)(e) |
| 11 | FIPS 199: low/moderate/high for confidentiality, integrity, availability; system takes high water mark | Criteria | verified | FIPS 199 §§3–4 |
| 12 | A-130: unsupported components "phased out as rapidly as possible" | Criteria | verified | A-130 §5.a(3)(f) |
| 13 | GAO: 7 of 11 critical systems with vulnerabilities not remediable without modernization | Criteria | verified | GAO-25-107795 p. 20 |
| 14 | A-130: inventory of systems holding PII | Criteria | verified | A-130 §5.a(1)(a)(ii) |
| 15 | 40 U.S.C. 11312: risk-adjusted ROI criterion (quoted); design and implement process; integrated with budget; compare and rank | Criteria; capital planning | verified | 40 U.S.C. §11312(a)–(b) |
| 16 | GAO: COBOL and assembly skills shortage; premium for staff | Criteria | verified | GAO-25-107795 p. 7 |
| 17 | AWS: dependencies a reason to retain | Criteria | verified | AWS PG (retain) |
| 18 | AWS: no inbound connection for 90 days; low CPU and memory use to find unused applications | Keeping it honest | verified | AWS PG (retire) |
| 19 | A-130: weigh IT investments in the portfolio; CIO approves IT components of plans | Capital planning | verified | A-130 §5.a(3)(c)–(d) |
| 20 | TMF: must improve, retire or replace; typically under $25M; aim to repay full amount; five-year repayment; outcomes ideally within 12 months | TMF | verified (quoted) | TMF fit page |
| 21 | TMF 2026 call: legacy modernization and cybersecurity proposals accepted; initial proposals due October 20, 2026 | TMF | verified | TMF 2026 call page |
| 22 | MGT Act authorizes IT working capital funds for transitioning from legacy systems | Working capital | verified | GAO-25-107795 p. 12 |
| 23 | GAO: extent of legacy IT unknown | Honest limits | verified | GAO-25-107795 p. 4 |
| 24 | Six dispositions, ordering by cost and risk, two-axis rubric, decision table, confidence flags, owner review, calibration on 30–50 applications | Rubric | restated-as-design | Program design |
| 25 | FITARA memo status | Capital planning | not restated; linked to the crosswalk | Crosswalk |

## Diagrams

- `docs/images/diagrams/b18-application-modernization/src/ch02-triage-funnel.flow.yaml` — triage at scale (program design).
- `docs/images/diagrams/b18-application-modernization/src/ch02-value-health-grid.flow.yaml` — the two axes and the dispositions (program design).

Neither is rendered.

## Addition — October 30, 2026: recording dependencies as an evidence map

Opened October 30, 2026: 5 U.S.C. §552a on the Legal Information Institute (subsections (e)(4), (e)(12), (o)(1) and (o)(2)).

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 26 | A system of records notice lists routine uses and categories of sources of records | Evidence map | verified | 5 U.S.C. §552a(e)(4)(D), (I) |
| 27 | A computer matching agreement is written, runs up to 18 months, renewable without new review for no more than one additional year | Evidence map | verified | 5 U.S.C. §552a(o)(1), (o)(2)(C)–(D) |
| 28 | Entity and relationship types, basis labels, confidence flags, open questions, master-record ranking, computed dependency score | Evidence map | restated-as-design | Program design |

The section is agency-neutral: its pattern was observed in a public, independent research site about one federal agency's systems, which is deliberately not named or linked. No facts, system names or counts from that site are used.

## Decision of Nov 8, 2026

| Before | After | Check |
|---|---|---|
| Mission value axis inputs "mission criticality, cost of the function if lost, and the number and kind of users" | "Mission criticality and cost", two of the six criteria in the table above (so five of six combine into two axes: two for value, three for health) | Decision of Nov 8, 2026; matches the six-criteria table |

## November 9, 2026: legacy identity libraries and APIs (Learn gap review)

Small addition from the Learn coverage review: the app inventory asks about ADAL, Azure AD Graph and the implicit grant. Pages read November 9, 2026 with the Microsoft Learn MCP tools.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| L1 | ADAL support including security fixes ended June 30, 2023; existing apps keep working; MSAL gets tokens from AD FS 2019 or later only | Six triage criteria, notes | verified | Learn, "Migrate applications to the Microsoft Authentication Library (MSAL)" |
| L2 | Sign-ins workbook lists ADAL apps active in the last 30 days, with sign-in count and ADAL version, after sign-in logs are sent to Azure Monitor | Same | verified | Learn, "Get a complete list of apps using ADAL in your tenant" |
| L3 | Extended access to Azure AD Graph ended August 31, 2025; apps using it stop functioning after retirement; migrate to Microsoft Graph | Same | verified | Learn (Graph docs), "Migrate your apps from Azure AD Graph to Microsoft Graph"; "Configure Azure AD Graph permissions" (caution) |
| L4 | Entra recommendations list applications and service principals still calling Azure AD Graph; service principals usually need a vendor update | Same | verified | Learn, "Microsoft Entra recommendation: Migrate from Azure AD Graph APIs to Microsoft Graph" |
| L5 | Implicit grant no longer a suitable method (third-party cookie blocking breaks silent SSO); MSAL.js 2.x doesn't support it; three migration steps; disabling it affects every app sharing the registration | Same | verified | Learn, "Migrate a JavaScript single-page app from implicit grant to auth code flow"; "Microsoft identity platform and OAuth 2.0 implicit grant flow" |
| L6 | Questions lower technical condition; measured vs attested flag | Same | restated-as-design | Program design (this chapter's rubric) |

## Addition — Nov 11, 2026: identity and access intake fields (Zero Trust Assessment closure, B18-01, CM-07)

New section "Identity and access intake fields" before the evidence map. Fields and the attack-path rank are program design; the export it reads is Book 13 Chapter 14's.

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| I1 | Maintain ownership of redirect URIs; monitor DNS; no wildcards or insecure schemes; keep the list small; a lapse can lead to app compromise | Intake fields | verified | Learn, "Security best practices for application properties in Microsoft Entra ID," Redirect URIs, <https://learn.microsoft.com/entra/identity-platform/security-best-practices-for-app-registration> | Nov 11, 2026 |
| I2 | Wildcards allowed only for work/school sign-in apps via manifest; strongly recommend absolute URIs | Same | verified | Learn, "Redirect URI (reply URL) outline and restrictions," <https://learn.microsoft.com/entra/identity-platform/reply-url> | Nov 11, 2026 |
| I3 | Dangling DNS can be taken over; OAuth credentials sent to a dangling subdomain might be exposed | Same | verified | Learn, "Prevent dangling DNS entries and avoid subdomain takeover," <https://learn.microsoft.com/azure/security/fundamentals/subdomain-takeover> | Nov 11, 2026 |
| I4 | Nine fields; additive score and thresholds 8 / 4; 90-day retirement-candidate rule | Same | restated-as-design | Program design | Nov 11, 2026 |
| I5 | Ranking script | Same | not tested against a tenant; uses only the Book 13 Ch14 export and .NET DNS resolution | — | Nov 11, 2026 |
