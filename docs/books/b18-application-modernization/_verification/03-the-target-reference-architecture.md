# Verification — Chapter 03, The Target Reference Architecture

## Sources opened

Opened October 28, 2026: openjdk.org JDK project page (release GA dates); Microsoft Learn, "Support roadmap for the Microsoft Build of OpenJDK" (MCP); spring.io Spring Boot project and generations pages, and the Spring projects API (`api.spring.io/projects/spring-boot/generations` and `/releases`, which the generations page loads its data from); docs.spring.io "System Requirements" (4.1.2); react.dev "Versions"; nodejs.org "Node.js Releases"; nodejs/Release `schedule.json` (raw file from the Node.js Release Working Group repository); spec.openapis.org version index and the v3.2.1 specification; opencontainers.org "About"; GitHub release lists for the OCI image, distribution and runtime specifications (GitHub API); kubernetes.io "Releases" and "Kubernetes Release Cycle"; Microsoft Learn Azure Architecture Center "Backends for Frontends pattern" and "Strangler Fig pattern" (MCP fetch); Martin Fowler, "Strangler Fig"; 12factor.net "III. Config"; CSRC pages for SP 800-204, 800-204A–D and SP 800-190, and the SP 800-190 PDF (table of contents, Sections 3–4).

Manual checks: Oracle's Java SE Support Roadmap returned HTTP 403 to the fetch tool and is not cited (a follow-up plain HTTP request returned page text consistent with the cited sources, listing 25 as the latest LTS and Java 29 as the next planned LTS for September 2027, but it is not relied on); Java's LTS designation is cited from Microsoft Learn's OpenJDK support roadmap, and GA dates from openjdk.org. The chapter therefore doesn't state the next planned LTS release. The OpenAPI 3.2.1 document's revision-history appendix wasn't reached in the fetched portion; the chapter states only the 3.2.1 date shown on the document (September 10, 2026) and that it is a patch release of 3.2.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Java 25 GA September 16, 2025; Java 26 March 17, 2026; Java 27 September 15, 2026; JDK 28 in development | Table; services | verified | openjdk.org |
| 2 | Java 25 is the current LTS; Microsoft Build of OpenJDK supports it until at least September 2030; OpenJDK releases every six months | Services | verified | Microsoft Learn OpenJDK roadmap |
| 3 | Java 27 is a feature release not on vendors' LTS lists | Table | verified against Microsoft's LTS list (11, 17, 21, 25) | Microsoft Learn |
| 4 | Spring Boot 4.1.2 current; requires Java 17, compatible up to Java 27; Spring Framework 7.0.10+ | Table; services | verified | docs.spring.io system requirements; api.spring.io releases |
| 5 | Spring Boot generations: 4.2.x initial 2026-11-30 (RC1 available), OSS to 2027-12-31, commercial to 2028-12-31; 4.1.x 2026-06-30 / 2027-07-31 / 2028-07-31; 4.0.x 2025-11-30 / 2026-12-31 / 2027-12-31; 3.5.x 2025-05-31 / 2026-06-30 / 2032-06-30 | Generations table | verified | api.spring.io generations |
| 6 | About thirteen months of open-source support per recent generation | Services; leadership | verified arithmetic (3.5, 4.0, 4.1 each 13 months) | api.spring.io generations |
| 7 | React 19.0.0 December 5, 2024; 19.3.0 September 9, 2026 | Table; front ends | verified | react.dev versions |
| 8 | Node.js 24 maintenance from 2026-10-20, end 2028-04-30; Node.js 26 LTS scheduled 2026-10-28, end 2029-04-30; Node.js 22 end 2027-04-30 | Table; Node.js | verified | nodejs/Release schedule.json; nodejs.org releases |
| 9 | Through 26, even releases became LTS; from 27, annual majors, every major to LTS after six-month Current; LTS about 30 months; production on Active or Maintenance LTS only | Node.js | verified | nodejs.org releases |
| 10 | BFF pattern: separate backend per frontend; frontend team manages it; cross-cutting concerns abstracted | Node.js | verified | Azure Architecture Center BFF |
| 11 | OpenAPI 3.2.1 dated September 10, 2026; patch versions "address errors in, or provide clarifications to" the document | Table; API-first | verified | spec.openapis.org v3.2.1 §2.1 |
| 12 | OCI formed June 22, 2015 under the Linux Foundation; maintains runtime, image and distribution specs | Table; containers | verified | opencontainers.org |
| 13 | OCI image-spec v1.1.1 (2025-03-03), distribution-spec v1.1.1 (2025-01-29), runtime-spec v1.3.0 (2025-11-04) | Table | verified | GitHub releases |
| 14 | Kubernetes 1.37 newest minor; project maintains the three most recent minor releases | Table; containers | verified | kubernetes.io releases |
| 15 | Kubernetes releases approximately three times per year | Honest limits | verified | kubernetes.io release cycle |
| 16 | Twelve-factor config in the environment; litmus test quoted | Containers | verified | 12factor.net |
| 17 | Fowler: build alongside, move piece by piece; transitional code worth the cost | Strangler fig | verified (paraphrased) | Fowler 2024 |
| 18 | Azure: façade routes to legacy or new; shift; decommission; remove façade or keep as adapter | Strangler fig | verified | Azure Strangler Fig |
| 19 | Not suitable when requests can't be intercepted and no integration point can be changed; small systems | Strangler fig | verified | Azure Strangler Fig |
| 20 | Shared data; database example with ETL, CDC, validation before cut-over; rollback until legacy objects removed | Strangler fig | verified | Azure Strangler Fig, Example |
| 21 | Anti-corruption layer; façade not a bottleneck or single point of failure | Strangler fig | verified | Azure Strangler Fig |
| 22 | SP 800-204 August 2019, scope (authentication, discovery, secure communication, monitoring, resiliency, load balancing, sessions; gateways and meshes) | Security references | verified | CSRC SP 800-204 |
| 23 | SP 800-204A May 2020, 204B August 2021, 204C March 2022, 204D February 2024, with titles | Security references | verified | CSRC pages |
| 24 | SP 800-190 September 2017; risks for image, registry, orchestrator, container, host OS; countermeasures including hardware | Security references | verified | SP 800-190 PDF §§3–4 |
| 25 | No newer revision or draft of SP 800-204 or SP 800-190 listed on CSRC | Security references | verified | CSRC document histories |
| 26 | Section 508, 21st Century IDEA, Login.gov direction (M-26-18) | Front ends | not restated; linked to the workbook's crosswalk (settled facts) | Crosswalk |
| 27 | Technology choices, upgrade cadence, thin front ends, BFF limits, contract practices, secrets from vault or workload identity, disposition mapping | Throughout | restated-as-design | Program design |

## Diagrams

- `docs/images/diagrams/b18-application-modernization/src/ch03-reference-architecture.flow.yaml` — the layered target architecture (program design; versions per the claims above).
- `docs/images/diagrams/b18-application-modernization/src/ch03-strangler-fig.flow.yaml` — the four stages of the strangler-fig pattern (after the Azure Architecture Center page).

Neither is rendered.

## November 2, 2026 addition

The front-end paragraph now points to Chapter 06's Section 508 gate. No new external claim; the gate's sources are logged in the Chapter 06 verification file.

## November 9, 2026: application proxy and secure hybrid access (Learn gap review)

New sections from the Learn coverage review (Mike, Nov 9, 2026: take all recommendations): "Applications that stay on premises: publishing through Application Proxy" and "Secure hybrid access for header-based, Kerberos and LDAP applications". Pages read November 9, 2026 with the Microsoft Learn MCP tools (full fetch unless noted "search excerpt"); no personal data sent to any site. Nothing here was run against a tenant.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| A1 | Application proxy = cloud service + private network connector on Windows Server; Entra sign-in with CA/MFA; connector does SSO; outbound only; no app change | App proxy intro | verified | Learn, "Microsoft Entra application proxy" |
| A2 | Microsoft's AD FS app migration guidance: WAP-published apps to application proxy; ADC-fronted apps to secure hybrid access | App proxy intro | verified (search excerpt) | Learn, "Best practices to migrate applications and authentication to Microsoft Entra ID" |
| A3 | Not designed for internal users on the corporate network (latency, performance) | App proxy intro | verified | Learn overview; deployment plan |
| A4 | Application proxy can't act as an AD FS proxy or publish AD FS endpoints | App proxy intro | verified | Learn, application proxy FAQ |
| A5 | Same connector as Private Access | App proxy intro | verified | Learn FAQ |
| A6 | Supported SSO: IWA via KCD (domain-joined, same or trusted domains), header-based, SAML/WS-Fed, password vaulting, RD Gateway, MSAL native clients, web APIs | What it can publish | verified | Learn overview; deployment plan |
| A7 | NTLM only negotiated directly, not preauthentication or SSO; client certificate authentication not supported (TLS terminated) | What it can publish | verified | Learn FAQ |
| A8 | Inventory fields and spreadsheet | Retiring WAP, step 1 | verified | Learn deployment plan |
| A9 | At least 2 connectors per group, 3 optimal; same segment; outbound 443 and 80; no TLS termination or inspection | Step 2 | verified | Learn deployment plan |
| A10 | 4 cores, 8 GiB, under 70 percent; domain join only for KCD | Step 2 | verified | Learn, "Microsoft Entra private network connectors" |
| A11 | Connector services: Network Service (connector), NT Authority System (updater); changing them not supported | Step 2 | verified | Learn FAQ |
| A12 | Connectors on Windows Server 2019 or later | Step 2 | restated-as-design | Workbook server baseline (program assumption) |
| A13 | Local admin plus at least Application Administrator to register; Cloud Application Administrator can't manage application proxy settings | Step 3 | verified | Learn deployment plan |
| A14 | Azure Government installer parameter `ENVIRONMENTNAME="AzureUSGovernment"`; URLs `*.msappproxy.us`, `*.servicebus.usgovcloudapi.net` | Step 3 | verified (search excerpt) | Learn, "Hybrid identity considerations for the Azure Government cloud" |
| A15 | Incremental test order (preauthentication off, then preauthentication and assignment, then SSO, then CA) | Step 4 | verified | Learn deployment plan |
| A16 | CA can't apply to passthrough; Assignment required defaults to Yes | Step 4 | verified | Learn FAQ |
| A17 | Passthrough only for an isolated pilot; leave assignment required on | Step 4 | restated-as-design | Program design |
| A18 | Identical internal and external URLs via custom domain; certificate and CNAME needed | Step 5 | verified | Learn deployment plan; FAQ |
| A19 | CAE for application proxy on by default, app needn't be CAE-aware; signals (deleted or disabled, password change or reset, MFA enabled, refresh tokens revoked); location re-evaluation; opportunistic without strict enforcement | CAE | verified | Learn, "Learn about Continuous Access Evaluation (CAE) for Application Proxy" |
| A20 | Leave CAE on; disabling it is an exception | CAE | restated-as-design | Program design |
| A21 | B2B: SAML apps need assignment; IWA/KCD need an on-premises footprint user via the MIM Graph connector or the B2B sample script; lifecycle carries; client access or external connector licensing | Guests | verified | Learn, "Grant Microsoft Entra B2B users access to your on-premises applications" |
| A22 | Guests lack on-premises UPN and SAM name; falls back to UPN | Guests | verified | Learn FAQ |
| A23 | Azure Government B2B: between Azure Government tenants that support B2B; cross-cloud with Microsoft cloud settings | Guests; availability table | verified (search excerpt) | Learn, "Microsoft Entra B2B in government and national clouds" |
| A24 | PowerShell samples list apps, URLs, preauthentication, SSO mode, connector groups, connectors, default-domain, wildcard, custom-domain certificates; need Microsoft.Graph.Beta 2.10 or later | Inventory | verified | Learn, "Microsoft Entra application proxy PowerShell examples" |
| A25 | A service principal can't manage application proxy through PowerShell or Graph | Inventory | verified | Learn FAQ |
| A26 | Commands adapted from the connector-group and extended-information samples (same cmdlets, tag filter and onPremisesPublishing properties) | Inventory | adapted; not run | Learn sample pages |
| A27 | SSH, NTLM, LDAP and cookies not supported by application proxy; ISVs connect them | Secure hybrid access intro | verified | Learn, "Secure hybrid access with Microsoft Entra integration" |
| A28 | Partners register apps so CA applies per app; partner categories (ADC, VPN, SDP) | Secure hybrid access intro | verified | Learn secure hybrid access pages |
| A29 | F5 BIG-IP APM: SAML SP plus header, Kerberos, forms or LDAP-backed SSO; Easy Button templates for PeopleSoft, EBS, JDE, SAP ERP, generic | Partner table | verified (search excerpts) | Learn F5 pages |
| A30 | Datawiza: container reverse proxy, OIDC or SAML, identity in headers; transition from legacy web access managers | Partner table | verified (search excerpts) | Learn Datawiza pages |
| A31 | Silverfort: agentless, proxyless; Kerberos, NTLM, LDAPS bridged to Entra; RDP, SSH, command line, file shares, databases | Partner table | verified (search excerpts) | Learn Silverfort tutorial |
| A32 | Cloudflare Zero Trust Access: Entra as IdP; default-deny rules on apps, private IPs, hostnames; dedicated IdP integration for app-specific CA | Partner table | verified (search excerpts) | Learn Cloudflare pages |
| A33 | Oracle EBS, JDE and PeopleSoft recipes for F5 and Datawiza; JDE header `JDE_SSO_UID`; EBS LDAP lookup to OID, AccessGate issues the EBS cookie | ERP and HR suites | verified (search excerpts) | Learn F5 and Datawiza Oracle pages |
| A34 | HR platform self-service on such a suite; pointer to Book 03 Ch13 | ERP and HR suites | restated-as-design (generic; no platform named) | Program design |
| A35 | Path order: modern protocol, application proxy, partner, refactor | Choosing the path | restated-as-design | Program design |
| A36 | Application proxy and secure hybrid access partnerships listed available in Azure for US Government | Availability | verified | Learn, "Microsoft Entra feature availability" |
| A37 | GCC pairs with commercial Entra ID; GCC High and DoD with Azure Government | Availability | verified Oct 21, 2026 for Book 01 Appendix B; the Learn MCP server didn't respond on Nov 9 for a re-read | Learn, "Cloud feature availability for US Government customers" |
| A38 | CAE for application proxy, partner products, beta Graph cmdlets in government clouds | Availability | not yet specified on Learn | none |

Pointer for the Book 03 owner: Chapter 13 (reference deployment) should point back to this section for the HR platform's header-based sign-in pattern (Oracle suites through F5 or Datawiza), said generically.
