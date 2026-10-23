# Verification — Appendix C, Anatomy of the CLM Platform

New appendix, written October 23, 2026, at the user's request: "describe each component of 'The Platform'". Source: the research brief on the components of CyberArk Certificate Manager, Self-Hosted 26.1 (program working file). It checked about 170 public docs.venafi.com pages on October 23, 2026; the docs.cyberark.com mirror returned 404, so every citation is docs.venafi.com. The diagrams are committed SVG sources under `docs/images/diagrams/b07-pki/src/appC-*.flow.yaml`.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | The program's CLM platform is CyberArk Certificate Manager, Self-Hosted; system of record for certificates Intune and PIV don't manage | Intro | settled (Book 07 Ch04) | Ch04 |
| 2 | Job-to-component mapping (inventory, lifecycle engine, discovery, CA and provisioning connectors, enrollment, monitoring, consoles, audit, keys) | Table | verified per component; the mapping itself is the workbook's framing | Components; drivers; system requirements; log server; encryption files |
| 3 | "Multiple servers connected using the same database are referred to as a cluster"; modules installed everywhere, enabled per server | Server roles | verified (quoted) | System requirements; Platform objects |
| 4 | Web Console installs both Policy Tree and Aperture; the Policy Tree is a web console | Table; consoles | verified (quoted) | Components; Policy Tree overview |
| 5 | At least two servers with Web Console; web services behind an ADC for rolling upgrades | Roles table | verified | Components; Rolling upgrades |
| 6 | No FIPS on any server used for ACMEv2 | Roles table | verified (quoted) | Deploying on Windows Server |
| 7 | Processing engines assigned to policy folders; lifecycle stages hand off between engines | Roles table; journey | verified | Management zones; Management partitions |
| 8 | Logging service "provides log event processing and notification delivery"; about 10 events per renewal | Roles table | verified (quoted) | Windows services; SQL channel requirements |
| 9 | Agent handlers: two servers per 40,000 agent-managed servers | Roles table | verified | System requirements |
| 10 | Sizing: 2 servers to 50K; 6 at 250K (2 logging, 2 web, 2 back end); 1M+ designed by CyberArk; 4 cores, 16 GB, 5 GB | Sizing paragraph | verified (quoted) | System requirements |
| 11 | Message Bus not optional; all servers communicate over TLS 8883 | Sizing paragraph | verified (quoted) | Message Bus |
| 12 | Renewal latency about 2 s at 0 ms and about 15 s at 30 ms | Sizing paragraph | verified | System requirements (latency table) |
| 13 | Kubernetes discovery needs TCP 443 to the SaaS; cert-manager CyberArk issuer for in-boundary issuance | Connections | verified | Kubernetes discovery; cert-manager |
| 14 | No CyberArk-authored ServiceNow integration; third-party app requires a MID Server | Connections | verified (absence in docs; Store quote) | ServiceNow Store |
| 15 | Intune integration needs outbound HTTPS to Azure from all servers; no government-cloud endpoints | Connections | verified (absence noted) | Integrating with Microsoft Intune |
| 16 | Two-site topology | Topology | restated-as-design (program design guidance) | Component brief §4 |
| 17 | Mixed FIPS/non-FIPS cluster not stated either way | Topology | verified (absence); consequence labeled inference | Deploying on Windows Server |
| 18 | Vendor pages disagree on IIS for non-web servers | Topology | verified (conflict quoted) | Windows services; Deploying on Windows Server |
| 19 | Journey steps follow engine-partitioning stages | Journey | verified; diagram is the workbook's framing | Management partitions; Log server |

## Not carried

| Item | Why not |
|---|---|
| SNMPv3 offers only SHA1/MD5 and AES/DES | Kept in the research guide's notes; not needed for the anatomy |
| Outbound certificate verification defaults to None | In the research guide's hardening slide |
| Answer-file `TrustServerCertificate` wording | Vendor wording conflicts with Microsoft's meaning; left for the vendor ask list |
| JavaKeyHost service | Purpose not documented |

## Addition, October 23, 2026

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Links to each book's certificate section, with counts of kinds the platform renews | Where the other books' certificates meet the platform | restated (internal links; counts from the sections) | The 17 sections |
