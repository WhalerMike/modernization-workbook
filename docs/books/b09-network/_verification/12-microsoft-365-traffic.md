# Verification — Chapter 12, Microsoft 365 Traffic and the Optimize Inspection Exemption

File: `docs/books/b09-network/12-microsoft-365-traffic.md`
Diagram sources (new; no staged `src-` file reused): `docs/images/diagrams/b09-network/src/ch12-optimize-exemption-paths.flow.yaml`, `ch12-three-instruments.flow.yaml`.
Sources: `docs/operational-guides/m365-optimize-exemption/index.md`, `attachment-a-site-register.md`, `attachment-b-architecture-review.md` (the instruments themselves are carried in Appendix A; see its verification file).
Checked 2026-10-21 against Microsoft Learn (network connectivity principles; Managing Microsoft 365 endpoints; IP Address and URL web service; Microsoft 365 URLs and IP address ranges, Worldwide (+GCC), last updated 08/14/2026; Microsoft 365 endpoints overview; informed network routing; network connectivity in the admin center; tenant restrictions v2; Global Secure Access known limitations; Teams security guide), CISA TIC 3.0 PDFs (Security Capabilities Catalog v3.3, Branch Office Use Case v3.0, Reference Architecture v1.2, all September 2026 publications, text extracted with pdftotext/pypdf; revision-history rows disambiguated by text coordinates), NIST SP 800-53 Rev. 5 and SP 800-53B via the usnistgov OSCAL catalog and baseline profiles, and the FedRAMP Marketplace `products.json` (meta last_change 2026-10-21). Footnote keys below drop the `c12-` prefix.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Web service `category` is Optimize, Allow or Default; follow highest-priority category when an endpoint is in several | Endpoint categories | verified | websvc |
| 2 | Web service instances are Worldwide, China, USGovDoD, USGovGCCHigh; no GCC instance | Endpoint categories | verified | websvc |
| 3 | Worldwide list covers plans "including Government Community Cloud (GCC)" | Endpoint categories | verified | ww |
| 4 | Source: feed must be "Worldwide (+GCC)", not DoD or GCC High | Endpoint categories | verified (label matches page title) | ww |
| 5 | Optimize sets: 1 Exchange (outlook.cloud.microsoft, outlook.office.com, outlook.office365.com; TCP 443/80, UDP 443), 31 SharePoint (*.sharepoint.com; TCP 443/80, UDP 443), 11 Teams media (IPs only, UDP 3478–3481) | Table | verified (added; source didn't enumerate) | ww |
| 6 | Allow includes Entra sign-in and Graph (56), Teams signaling (12), EOP (9, 10); Default often names-only | Endpoint categories | verified | ww; managing (FAQ) |
| 7 | Blocking QUIC and forcing UDP→TCP fallback "known to cause connectivity issues" | Endpoint categories | verified | principles |
| 8 | Source framing: Microsoft says bypass inspection for the Optimize set | What Microsoft recommends | corrected: current guidance recommends bypassing TLS decryption etc. for all Required endpoints and categories; TLS break and inspect incompatible with Optimize and Allow | principles; managing |
| 9 | SD-WAN branch egress of Optimize, or Optimize and Allow | What Microsoft recommends | verified | managing |
| 10 | Optimize-only scope is narrower than Microsoft asks | What Microsoft recommends | restated-as-design (program position) | — |
| 11 | Lists update at the beginning of each month; new addresses 30 days ahead; out-of-band changes | What Microsoft recommends | verified | ww; managing |
| 12 | Microsoft's case: built-in controls (Purview DLP, Defender for Office 365, MFA); shortest path to nearest front door | Why bypass meets boundary | verified | principles |
| 13 | Branch Office pattern 1 permits direct CSP access with capabilities at branch or CSP "so long as policy enforcement parity is ensured" | Why bypass meets boundary | verified | branch §6.1 |
| 14 | Source: TIC 3.0 permits PEPs "between, before, or within a trust zone" | Why bypass meets boundary | corrected: Reference Architecture says enforcement "may occur at any point between endpoints"; the source wording wasn't found in RA, SCC or Branch Office Use Case | ra §4.2 |
| 15 | PEPAR definition (quote) | Why bypass meets boundary | verified | scc Table 3 |
| 16 | Exemption punctures SI-3, SI-4(10), AC-4, AU-3 (AU-12 by reference) | Name the controls | restated-as-design (control titles verified) | sp80053 |
| 17 | SI-4(10) is in the High baseline, not Moderate | Name the controls | verified (added) | baselines |
| 18 | AU-3 content: what, when, where, source, outcome, identity | Name the controls | verified | sp80053 |
| 19 | SC-8 not a gap: TLS; Teams media SRTP with keys over TLS signaling | Name the controls | verified | teams |
| 20 | SC-7(4)(c) confidentiality/integrity across each interface met by application encryption | Name the controls | verified (text); application to design is design reasoning | sp80053 |
| 21 | SC-7(4) is in the Moderate baseline | SC-7(4) exception | verified | baselines |
| 22 | SC-7(4) managed interface and traffic-flow policy per external telecom service | SC-7(4) exception | verified | sp80053 |
| 23 | Source: exception fields are SC-7(4)(c) and (d) | SC-7(4) exception | corrected: (d) documents mission need and duration; (e) review and removal; (c) is confidentiality/integrity | sp80053 |
| 24 | Steering log as enforcement evidence | SC-7(4) exception | restated-as-design | — |
| 25 | TRv2 signaling paths: proxy (auth plane only), Global Secure Access universal TR (auth plane all platforms, data plane Graph only), Windows device (auth and data plane, no proxy, GPO or Entra-managed) | Tenant restrictions | verified | trv2 |
| 26 | Proxy TRv2 requires decrypting sign-in URLs; Microsoft supports this as an exception to its third-party-device policy | Tenant restrictions | verified | trv2 |
| 27 | Source: bypassing the proxy removes the header-injection path | Tenant restrictions | corrected: sign-in endpoints are Allow (set 56) and still cross the campus proxy in an Optimize-only design; what's exposed is the data plane, which proxy signaling never covered | ww; trv2 |
| 28 | Source: Windows Group Policy path "is the only one reaching the data plane" | Tenant restrictions | corrected/refined: Windows device signaling (GPO or Entra-managed) is the only documented path to the SharePoint/Exchange data plane; Global Secure Access reaches the Graph data plane | trv2 |
| 29 | Source: Global Secure Access is non-FIPS in GCC Moderate | Tenant restrictions | unverifiable on current Microsoft Learn (not on the known-limitations page as of 2026-10-21; a third-party diff mirror suggests the wording existed earlier); reported as unconfirmed; design conclusion re-based on the verified Graph-only data-plane limit | gsa; trv2 |
| 30 | Global Secure Access available in GCC; not GCC High, DoD | Tenant restrictions | verified | gsa |
| 31 | Device TRv2 covers Office apps, UWP .NET apps, Edge; not .NET stack, Chrome, Firefox; App Control for Business for unenlightened apps; Windows 10/11 | Tenant restrictions | verified | trv2 |
| 32 | Data-plane support for Teams, SharePoint, Exchange, Office.com, and Forms/Teams anonymous blocking, labeled preview | Tenant restrictions | verified (added) | trv2 |
| 33 | Device-side TRv2 verified from the endpoint is a cutover precondition; enumerate uncovered population | Tenant restrictions | restated-as-design | — |
| 34 | Intune delivery of the Windows TRv2 setting | Tenant restrictions | not asserted; reader told to confirm (Microsoft documents GPO deployment) | trv2 |
| 35 | Three instruments, decisions and signers; memo vs Attachment B separation | The three instruments | restated-as-design | — |
| 36 | "Branch office to web" classification pulls in web-proxy capability set | The three instruments | restated-as-design | — |
| 37 | Twelve PEP groups in v3.3; Services and Identity added in v3.0 (April 2023); v3.3 (July 2025) only removed NCPS reference in Appendix A; September 2026 publication changed only footnote links | The three instruments | verified (source was right; Book 08 Ch03 "v3.3, published September 2026" consistent) | scc Table 1 |
| 38 | Source header "SCC v3.3 (July 2025)" | The three instruments | refined: v3.3 revision dated July 2025; current publication September 2026 | scc |
| 39 | CLMAN, AACCO, PEPAR identifiers | The three instruments | verified | scc Table 3 |
| 40 | Source: telemetry reported under "NCPS Cloud Interface RA pattern" | The three instruments | corrected: Branch Office Use Case v3.0 (July 2025) replaced NCPS references with CISA services; telemetry via TIC delegates and CISA services (CLAW, CDM, Protective DNS); quote "must preserve CISA visibility" | branch §8, revision history |
| 41 | INR WW Commercial only, not GCC Moderate, GCC High, DoD, Germany, China | GCC-Moderate | verified (consistent with Book 08 App C) | inr |
| 42 | Source (Attachment A derived-from): egress ranges per office location follow INR configuration guidance | GCC-Moderate | corrected: network connectivity in the admin center (where locations and egress ranges are entered) is also not available to GCC Moderate; ranges serve agency steering, probes and scope | netconn |
| 43 | ThousandEyes for Government FedRAMP Certified, Class C (Moderate) | GCC-Moderate | verified (FR2523656707) | fr |
| 44 | DNS resolution close to the egress | GCC-Moderate | verified | principles |
| 45 | Agency resolver as first hop, Protective DNS upstream | GCC-Moderate | consistent with Book 08 Ch05 (linked, not re-footnoted) | B08 Ch05 |
| 46 | Telemetry is a condition of fleet rollout, not pilot cutover | What the exemption doesn't settle | restated-as-design | — |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| index.md — front matter, callout "These are templates, not completed records" | Appendix A warning callout (kept) | Front matter not carried (chapter has its own) |
| index.md — The problem these answer | Ch12 opening and "Why bypass guidance meets an inspect-everything boundary"; "SC-7(4) documented traffic-flow exception" | — |
| index.md — The set (table; memo vs Attachment B separation) | Ch12 "The three instruments" (table and separation paragraph); Appendix A "How the set fits together" | — |
| index.md — Naming the controls | Ch12 "Name the controls, not inspection forgone" | SI-4(10) baseline note added |
| index.md — Tenant restrictions | Ch12 "Tenant restrictions: the case an assessor will build" | Corrected (claims 27–29) |
| index.md — The exception record | Ch12 "The three instruments" (Attachment A paragraph); Appendix A Attachment A intro | Lettering corrected to (d)–(e) |
| index.md — Policy Enforcement Parity | Ch12 "Why bypass guidance meets..." | — |
| index.md — Related material (SD-WAN vs DIA §5.5; Vol I Book 05 App A; FedRAMP 20x commercial-feature-gap paper) | §5.5 argument → Ch02/Ch05 links; Vol I Book 05 App A linked by GitHub URL in "What's different for GCC-Moderate tenants" | Whitepapers are archived sources, not linked; the FedRAMP 20x commercial-feature-gap paper's argument isn't carried (out of B09 scope; framework argument belongs to Ch03) |
| attachment-a — all sections | Appendix A (Attachment A); summarized in Ch12 | See Appendix A ledger |
| attachment-b — all sections | Appendix A (Attachment B); summarized in Ch12 | See Appendix A ledger |
