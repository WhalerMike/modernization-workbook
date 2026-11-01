---
title: "Appendix C — Anatomy of the CLM Platform"
description: "What the certificate lifecycle management platform is made of: the component types every CLM platform has, how they map to CyberArk Certificate Manager, Self-Hosted 26.1, the program's choice, its server roles and integrations, a two-site reference topology, and one certificate's journey through the components."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b07-pki
book: B07
part: Appendix
series-order: 92
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix C — Anatomy of the CLM Platform

*"The platform" is not a box. It is a set of servers, one database and a handful of connectors, and each piece has a job.*

## In this appendix

- The component types every certificate lifecycle management (CLM) platform has, and what each one does
- How they map to CyberArk Certificate Manager, Self-Hosted 26.1, the program's CLM platform ([Chapter 04](04-the-target-pki.md))
- The platform's server roles, what it connects to, a two-site reference topology, and one certificate's journey through it

The program chose CyberArk Certificate Manager, Self-Hosted as the CLM platform, the system of record for every certificate that Intune and the PIV system don't manage ([Chapter 04](04-the-target-pki.md)). This appendix describes what that platform is made of. The build itself, phase by phase, is in the Research section's implementation guide, [Certificate Lifecycle on CyberArk Certificate Manager](../guides/cyberark-certificate-lifecycle.md), which is under review; the component facts here come from CyberArk's 26.1 documentation, checked on October 23, 2026.

## What every CLM platform is made of

Any CLM platform, from any vendor, does the same jobs. The table names each job, says why Book 07's design needs it, and gives the CyberArk component that does it.

| Job | Why the design needs it | In CyberArk Certificate Manager |
|---|---|---|
| Inventory and policy store | One record of every certificate, its owner and its renewal path ([Chapter 05](05-who-owns-the-certificate-estate.md)) | One SQL Server database; policy folders in the Policy Tree[^aC-sql][^aC-trees] |
| Lifecycle engine | Issues, renews, installs and revokes on schedule, so no class depends on a person remembering a date ([Chapter 08](08-lifecycle-monitoring-and-decommissioning.md)) | Certificate Lifecycle and Monitoring component[^aC-comp] |
| Discovery | Finds certificates a CA's database doesn't show ([Chapter 02](02-what-ad-cs-holds-up.md)) | Network Discovery, CA Import, Onboard Discovery, Server Agent[^aC-comp] |
| CA connectors | Request certificates from each issuer in the issuer map | CA template drivers: Microsoft Enterprise and Standalone CA, public CAs, AWS[^aC-msca] |
| Provisioning connectors | Install renewed certificates where they're used | Application drivers (IIS and CAPI, F5, NetScaler, Key Vault and others) and the Server Agent[^aC-sysreq] |
| Enrollment services | Let servers, devices and pipelines request their own certificates | ACME, EST and SCEP services; the REST API[^aC-comp] |
| Monitoring | Watches revocation endpoints and expiry | Validation and Certificate Revocation Monitoring components[^aC-comp] |
| Consoles and API | People and automation in, behind single sign-on | Web console and Policy Tree (both web), Web SDK, Authentication Server; per-server Configuration Console[^aC-comp][^aC-webadmin] |
| Audit and events | Evidence for the assessor, events for the SIEM | Log server (Logging service), with SQL, syslog, SNMP and email channels[^aC-log] |
| Key protection | Protects the database's secrets | A software key, an HSM, or both[^aC-enc] |

## The server roles

Every server in the cluster runs the same software against the same database. "Multiple servers connected using the same database are referred to as a cluster," and each module is installed on every server and enabled per server, so a server's role is simply the set of components switched on.[^aC-sysreq][^aC-platobj]

![The platform's server roles: web services servers and separate non-FIPS ACME servers behind a load balancer; back-end processing servers and log and event servers; all linked by the message bus to one SQL Server Always On database and an HSM pair.](../../images/diagrams/b07-pki/svg/appC-server-roles.svg){fig-alt="Top, a load balancer giving one name for the web console, API, agents and SCEP, with arrows to two boxes. Web services servers, two or more: web console and Policy Tree; Web SDK and Authentication Server; agent check-in, EST on 50443, SCEP on 80 if used. ACME servers, separate and not in FIPS mode: ACME service only; their own load-balancer name; CyberArk allows no FIPS on any server used for ACMEv2. Below, back-end processing servers, two or more: the certificate lifecycle of issue, renew, install and revoke; CA Import, discovery, validation and revocation monitoring; processing engines keep work on chosen servers. Log and event servers, two at larger sizes: the Logging service for the audit trail and notifications; the only servers that send to the SIEM, email and SNMP. These connect to the Message Bus, MQTT over TLS on 8883 between every server and every other, across sites, which connects for all servers to SQL Server Always On, one active database with full recovery and Enterprise edition recommended, and to an HSM pair, or a software key, protecting the database's secrets with the same partition label on every server; if the HSM is unreachable the platform shuts down."}

| Role | Components switched on | What to know |
|---|---|---|
| Web services | Web Console (with the Policy Tree), Web SDK, Authentication Server, Client REST for agents; EST and SCEP if used | At least two servers; every web service behind a load balancer, which rolling upgrades require[^aC-comp][^aC-roll] |
| ACME | ACME service only | "Because FIPS is not supported for ACMEv2, you cannot have FIPS enabled on any server that is used for ACMEv2"[^aC-deploy] |
| Back-end processing | Lifecycle and monitoring, CA Import, discovery, validation, revocation monitoring, reporting | Processing engines assigned to policy folders keep work on chosen servers, for example public-CA enrollment on one server allowed out to the internet[^aC-part] |
| Log and event | The Logging service | "provides log event processing and notification delivery"; about ten events per renewal[^aC-svc][^aC-sqlch] |
| Agent handlers | Client REST | Two more servers for every 40,000 agent-managed servers[^aC-sysreq] |

CyberArk's sizing: two servers up to 50,000 active certificates; six at 250,000, as two logging event processing, two web services and two back-end servers; past a million, designed by CyberArk. Each server needs four cores, 16 GB of memory and 5 GB of disk.[^aC-sysreq] A Message Bus links the servers: "Message Bus is not optional," and in its default mode "All servers must be able to communicate with each other over the configured port," TLS 8883.[^aC-mbus] Every server works against one active database, so distance costs time: CyberArk's table shows about 2 seconds per renewal at no delay, and about 15 seconds at a 30 ms delay.[^aC-sysreq]

## What the platform connects to

![Integrations of CyberArk Certificate Manager: issuers on the left; Entra ID, the CyberArk vault and enrollment clients feeding in; installation targets on the right; the SIEM and ServiceNow receiving events and owners.](../../images/diagrams/b07-pki/svg/appC-integrations.svg){fig-alt="Center, CyberArk Certificate Manager: inventory, owners and policy; request, renew, install and revoke. Left, a group of issuers through CA template drivers: AD CS, enterprise or standalone, over DCOM; public CAs, DigiCert, Sectigo, GlobalSign and HID; AWS Private CA and ACM, issuing and importing through S3 audit reports, each with two-way arrows. Also left, Microsoft Entra ID for console sign-in with SAML or OIDC single sign-on and SCIM; the CyberArk vault providing target credentials through the Credential Provider; and clients requesting through ACME, EST, SCEP and REST such as certbot, win-acme, vCert and network devices. Right, a group of where certificates are installed: Windows IIS and CAPI, agentless with admin on the target; appliances F5, NetScaler and Palo Alto NGFW; keystores Apache PEM, Java and PKCS 12, and the Server Agent; cloud stores Azure Key Vault, AWS and HashiCorp Vault; and Kubernetes through the cert-manager CyberArk issuer, dashed. Below right, the SIEM receiving syslog over TLS on 6514 in CEF or JSON, and ServiceNow, dashed, through a third-party app and a MID Server."}

Three connections need care inside a federal boundary. Kubernetes discovery runs only through CyberArk's SaaS, which needs TCP 443 to its cloud service; issuance inside the boundary uses cert-manager's CyberArk issuer against the self-hosted API instead.[^aC-k8s][^aC-cm] There is no CyberArk-built ServiceNow integration in the 26.1 documentation; the third-party app on the ServiceNow Store connects through a MID Server, so it is assessed as a supply-chain component.[^aC-sn] And the Intune SCEP integration, which the program doesn't use ([Chapter 07](07-coexistence-and-migration.md)), needs outbound HTTPS to Azure from every server, with no government-cloud endpoints documented.[^aC-intune]

## A two-site reference topology

The layout below is the program's design guidance, built only from CyberArk's documented constraints; it is not a vendor blueprint.

![A two-site reference topology: in each site a web services server, a separate non-FIPS ACME server, a back-end server and a log server; a Message Bus mesh between all eight servers; one SQL Server Always On availability group across the sites; and an HSM pair.](../../images/diagrams/b07-pki/svg/appC-reference-topology.svg){fig-alt="Top, load-balancer names, one for the web console and API and one for ACME, with arrows to the web and ACME servers in two site groups. Site A, the primary database site: WEB-A1, web services with FIPS mode per policy; ACME-A1, ACME only with FIPS mode off; BE-A1, back end with site A engines and public-CA egress; LOG-A1, logging to the SIEM, email and SNMP. Site B: WEB-B1, ACME-B1, BE-B1 with site B engines, and LOG-B1. Below, a Message Bus mesh with TLS 8883 open between all eight servers across sites, connecting to one SQL Server Always On availability group, primary in site A and secondary in site B, with one listener every server uses, and a note of about 15 seconds per renewal at a 30 ms delay to the primary. Below that, HSM-A and HSM-B in the vendor's HA group with the same partition label on every server."}

Two points need written confirmation from CyberArk before this is built. CyberArk doesn't say whether FIPS-mode and non-FIPS servers can share one cluster; if they can't, the ACME servers become a separate small cluster with their own database (inference).[^aC-deploy] And CyberArk's pages disagree on whether servers without web services need IIS.[^aC-deploy][^aC-svc]

## One certificate's journey

![One certificate's journey through the platform: discover, place and own, enroll, provision, validate and monitor, renew back to enrollment, and revoke or retire.](../../images/diagrams/b07-pki/svg/appC-certificate-journey.svg){fig-alt="Seven steps. 1 Find: Discover, through Network Discovery, CA Import and the Server Agent. 2 Own: Place and own, placement rules put it in a policy folder with a named Server Owner. 3 Issue: Enroll, the lifecycle engine asks the CA through its CA template driver. 4 Install: Provision, an application driver or agent installs it on the target. 5 Check: Validate and monitor, with validation scans, revocation monitoring and expiry notices. 6 Repeat: Renew, before expiry back to step 3 so no one has to remember a date, shown as a dashed arrow labeled every renewal. 7 End: Revoke or retire, when no longer needed, revoked through the CA template and the object retired. A note says every step is logged: events go to the SIEM, and the inventory is the evidence an assessor reads."}

The steps follow the stages CyberArk's engine partitioning describes: certificate work, then enrollment through the CA template, then provisioning through each application object, with revocation through the CA template at the end.[^aC-part] Every event reaches the log server's default channel and, through the syslog channel, the SIEM ([Chapter 08](08-lifecycle-monitoring-and-decommissioning.md)).[^aC-log]

## Where the other books' certificates meet the platform

Every book whose systems depend on certificates has a section that maps them to this platform: which Book 07 class each certificate is, who issues it, which engine renews it, and what the platform does for it, with a diagram.

- [Book 00 — Orientation & Program, Chapter 10 — Retirement, Steady State and Measuring Success](../b00-orientation/10-retirement-steady-state-and-success.md#certificates-and-the-clm-platform): 2 of 5 certificate kinds renewed by the platform
- [Book 01 — The Transformation Arc, Chapter 10 — Analyzing the Estate](../b01-transformation-arc/10-analyzing-the-estate.md#certificates-and-the-clm-platform): 2 of 5 certificate kinds renewed by the platform
- [Book 02 — Identity & Directory, Chapter 04 — The Hidden Migration Surface](../b02-identity/04-the-hidden-migration-surface.md#certificates-and-the-clm-platform): 3 of 7 certificate kinds renewed by the platform
- [Book 03 — HR-Driven Identity, Chapter 09 — Credentials and Certificates Across Joiner, Mover, Leaver](../b03-hr-identity/09-credentials-and-certificates.md#certificates-and-the-clm-platform): 1 of 5 certificate kinds renewed by the platform
- [Book 04 — Access & Privilege, Chapter 05 — Applications and Workload Identities](../b04-access/05-applications-and-workload-identities.md#certificates-and-the-clm-platform): 0 of 3 certificate kinds renewed by the platform
- [Book 05 — Devices & Endpoints, Chapter 09 — Servers Under Azure Arc](../b05-devices/09-servers-under-azure-arc.md#certificates-and-the-clm-platform): 2 of 5 certificate kinds renewed by the platform
- [Book 06 — Data Platform: SQL Server Identity, Chapter 22 — Where SQL Server Touches AD CS](../b06-data-platform/22-where-sql-server-touches-adcs.md#certificates-and-the-clm-platform): 1 of 5 certificate kinds renewed by the platform
- [Book 08 — DNS, DHCP & IPAM, Chapter 11 — Operating the Control Plane: Delegation, Automation and Evidence](../b08-ddi/11-operating-the-control-plane.md#certificates-and-the-clm-platform): 3 of 5 certificate kinds renewed by the platform
- [Book 09 — Network & Transport, Chapter 07 — Network Access Control: 802.1X and RADIUS](../b09-network/07-network-access-control.md#certificates-and-the-clm-platform): 4 of 6 certificate kinds renewed by the platform
- [Book 10 — Cloud Boundary & Landing Zone, Appendix B — Platform Host Interface Reference](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#certificates-and-the-clm-platform): 2 of 5 certificate kinds renewed by the platform
- [Book 11 — Zero Trust & Assessment, Chapter 08 — Close Before You Assess](../b11-zero-trust/08-close-before-you-assess.md#certificates-and-the-clm-platform): 1 of 4 certificate kinds renewed by the platform
- [Book 12 — Security Operations & Telemetry, Chapter 05 — From Log Warehouse to Detection: SIEM and XDR](../b12-security-operations/05-from-log-warehouse-to-detection.md#certificates-and-the-clm-platform): 3 of 4 certificate kinds renewed by the platform
- [Book 13 — Governance, Drift & Evidence, Appendix B — Ticket-to-Machine Reference](../b13-governance/appendix-b-ticket-to-machine-reference.md#certificates-and-the-clm-platform): 2 of 5 certificate kinds renewed by the platform
- [Book 14 — Federal Compliance & Authorization, Appendix A — Control Crosswalk](../b14-compliance/appendix-a-control-crosswalk.md#certificates-and-the-clm-platform): 1 of 4 certificate kinds renewed by the platform
- [Book 15 — Compliance Automation & Day-2 Operations, Appendix A — Help Desk Task Reference](../b15-day2-operations/appendix-a-help-desk-task-reference.md#certificates-and-the-clm-platform): 1 of 4 certificate kinds renewed by the platform
- [Book 16 — People: Training & Education, Chapter 04 — The Implementation Track](../b16-people/04-the-implementation-track.md#certificates-and-the-clm-platform): 1 of 3 certificate kinds renewed by the platform
- [Book 17 — AI Identity Governance, Chapter 06 — Credentials, Least Privilege and Access Policy for AI](../b17-ai-identity/06-credentials-and-least-privilege.md#certificates-and-the-clm-platform): 0 of 3 certificate kinds renewed by the platform

## Key takeaways

- The platform is a cluster of Windows servers on one SQL Server database; a server's role is the set of components switched on.
- Web services sit behind a load balancer; ACME runs on separate servers that aren't in FIPS mode; log servers are the only ones that talk to the SIEM.
- The Message Bus needs TLS 8883 between every server, and every server works against one active database, so sites must be close.
- Drivers do the reaching: CA template drivers to issuers, application drivers or agents to the systems that use the certificates.

## Continue the book

::: {.callout-note appearance="minimal"}
[← Previous: Appendix B — Certificate Template Migration Matrix](appendix-b-template-migration-matrix.md) · [Book index](index.md)
:::

[^aC-sql]: CyberArk, Certificate Manager, Self-Hosted 26.1, "MS SQL Always On High Availability" ("All Trust Protection Foundation servers must connect to the same instance of the database"), <https://docs.venafi.com/Docs/current/TopNav/Content/Install/r_install_AlwaysOn-highavailability.php> (accessed Oct 23, 2026).
[^aC-trees]: CyberArk, 26.1, "Management trees," <https://docs.venafi.com/Docs/current/TopNav/Content/System_Architecture/r_management_trees.php> (accessed Oct 23, 2026).
[^aC-comp]: CyberArk, 26.1, "Selecting components" (component list and descriptions; "At least two Trust Protection Foundation servers needs to have Web Console enabled"), <https://docs.venafi.com/Docs/current/TopNav/Content/Install/r-install-select-components.php> (accessed Oct 23, 2026).
[^aC-msca]: CyberArk, 26.1, "Microsoft ADCS CA template," <https://docs.venafi.com/Docs/current/TopNav/Content/Drivers/cco-MicrosoftCertServices-CATemplate-tpp.php>, and the enrollment and revocation support matrix, <https://docs.venafi.com/Docs/current/TopNav/Content/Drivers/r-drivers-matrix-EnrollmentRevocationSupport-ta.php> (accessed Oct 23, 2026).
[^aC-sysreq]: CyberArk, 26.1, "System requirements" (cluster; server sizing; hardware; supported applications; latency table; agents), <https://docs.venafi.com/Docs/current/TopNav/Content/Install/r-install-SysReq-ALLVenProducts.php> (accessed Oct 23, 2026).
[^aC-webadmin]: CyberArk, 26.1, "Policy Tree overview" (accessed "using a supported or compatible web browser"), <https://docs.venafi.com/Docs/current/TopNav/Content/AdminConsoles/c-WebAdmin-Overview-tpp.php> (accessed Oct 23, 2026).
[^aC-log]: CyberArk, 26.1, "Log server," <https://docs.venafi.com/Docs/current/TopNav/Content/Logging/c-logging-LogServer.php>, and "Syslog channel," <https://docs.venafi.com/Docs/current/TopNav/Content/Logging/c-logging-sysLogChannelConfig-tpp.php> (accessed Oct 23, 2026).
[^aC-enc]: CyberArk, 26.1, "Encryption files" ("software encryption, and hardware encryption. You must use some combination of the two"), <https://docs.venafi.com/Docs/current/TopNav/Content/Install/r-vcc-encryption-files.php>, and "HSM configuration," <https://docs.venafi.com/Docs/current/TopNav/Content/EncryptionKeys/r-hsm-configuration.php> (accessed Oct 23, 2026).
[^aC-platobj]: CyberArk, 26.1, "Platform objects" ("every module is installed on the server. However, the modules may or may not be enabled"), <https://docs.venafi.com/Docs/current/TopNav/Content/System_Architecture/c_platform_objects_tpp.php> (accessed Oct 23, 2026).
[^aC-roll]: CyberArk, 26.1, "Rolling upgrades" (web services behind an application delivery controller), <https://docs.venafi.com/Docs/current/TopNav/Content/Install/c-rolling-upgrades.php> (accessed Oct 23, 2026).
[^aC-deploy]: CyberArk, 26.1, "Deploying on Windows Server" (FIPS and ACMEv2; servers with no web services), <https://docs.venafi.com/Docs/current/TopNav/Content/Install/r-deploy-windows-server.php> (accessed Oct 23, 2026).
[^aC-part]: CyberArk, 26.1, "Management partitions" (lifecycle stages handed off between processing engines), <https://docs.venafi.com/Docs/current/TopNav/Content/System_Architecture/r_management_partitions_tpp.php> (accessed Oct 23, 2026).
[^aC-svc]: CyberArk, 26.1, "Windows services" (CyberArk Platform; Logging; API Host; "IIS must be running on all CyberArk servers"), <https://docs.venafi.com/Docs/current/TopNav/Content/Install/r-vcc-windows-services.php> (accessed Oct 23, 2026).
[^aC-sqlch]: CyberArk, 26.1, "SQL Server channel requirements" (about 10 events per certificate renewal), <https://docs.venafi.com/Docs/current/TopNav/Content/Logging/r-logging-MSSQL-Channel-Requirements.php> (accessed Oct 23, 2026).
[^aC-mbus]: CyberArk, 26.1, "Message Bus," <https://docs.venafi.com/Docs/current/TopNav/Content/AdminConsoles/cco-vcc-message-bus.php> (accessed Oct 23, 2026).
[^aC-k8s]: CyberArk, 26.1, "Configuring Kubernetes discovery" (TCP 443 to the SaaS), <https://docs.venafi.com/Docs/current/TopNav/Content/Discovery/cco-Discovery-Kubernetes-configuring-tpp.php> (accessed Oct 23, 2026).
[^aC-cm]: cert-manager, "CyberArk" issuer ("formerly known as the Venafi Issuer"), <https://cert-manager.io/docs/configuration/venafi/> (accessed Oct 23, 2026).
[^aC-sn]: ServiceNow Store, AEYRiX, "Machine Identity Protection" ("A MID Server will be required"), <https://store.servicenow.com/store/app/c239a3ae1be06a50a85b16db234bcbe4> (accessed Oct 23, 2026).
[^aC-intune]: CyberArk, 26.1, "Integrating with Microsoft Intune" (outbound HTTPS to Microsoft Azure from all servers), <https://docs.venafi.com/Docs/current/TopNav/Content/ClientProtect/t-EntMob-intune.php> (accessed Oct 23, 2026).
