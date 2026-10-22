# Certificate Lifecycle on CyberArk Certificate Manager — Implementation Guide — narration script (practice copy)

## Slide 1 — Certificate Lifecycle on CyberArk Certificate Manager

This is an implementation guide. The Federal Modernization Workbook's Book 07 decided that the program's certificate lifecycle platform is CyberArk Certificate Manager, from the vendor the agency already uses for machine identity. This guide shows how to build it, self-hosted, and connect it to Book 07's design, phase by phase.

It runs in four parts after a short orientation. Part 1 builds the platform: architecture, the FIPS posture, console sign-in, hardening, and backup. Part 2 connects the issuers: Active Directory Certificate Services, the public certificate authorities, the cloud, and Intune. Part 3 covers discovery, ownership and enrollment automation. And Part 4 maps the build onto Book 07's six migration waves and covers running it.

Three ground rules. Every fact comes from a primary source opened on October twenty-second, 2026, mostly CyberArk's version 26.1 documentation. Recommendations are labeled design guidance. And in three places the research corrects Book 07; I'll state the corrected fact each time, and Book 07 has been updated to match to match.

Sources: Research brief, Implementing Book 07's certificate lifecycle on CyberArk Certificate Manager, Self-Hosted (verified Oct. 22, 2026); CyberArk Trust Protection Foundation 26.1 documentation; Book 07, Chapters 01, 04, 05, 07 and 08.

## Slide 2 — What this guide implements: Book 07's issuer map

The Federal Modernization Workbook's Book 07's target gives each class of subject its own issuer, and a lifecycle platform covers the issuers that don't renew their own certificates.

Intune-managed devices get user and device certificates from Microsoft Cloud PKI through SCEP, or during the bridge period from AD CS through the Intune connector. Intune renews them, so the CLM platform doesn't manage them. PIV cards come from a Federal PKI shared service provider through the card management system. Domain controller, KDC and LDAPS certificates stay on retained AD CS with autoenrollment; the platform watches them but never renews them.

Everything else lands on the platform. RADIUS and NPS servers, VPN and Remote Desktop gateways, SQL Server, internal web servers and appliances get certificates from the retained AD CS hierarchy, which becomes a standalone CA after Active Directory, requested and renewed through CyberArk Certificate Manager. Public-facing TLS comes from a public CA the agency authorizes in its CAA records, renewed by the platform, with ACME where the endpoint supports it. And for the hierarchy itself, the platform's revocation monitoring checks CRL and OCSP endpoints.

So the platform's job is simple to state: it's the system of record for every certificate Intune and the PIV system don't manage.

Sources: Book 07, Chapter 04 (issuer map; certificate lifecycle management), Chapter 05 (renewal ownership per certificate class), Chapter 08 (renewal engines); research brief section 10; CyberArk 26.1 Installation and Upgrade Guide (Certificate Revocation Monitoring).

## Slide 3 — Prerequisites and decisions before you build

Why self-hosted? In the FedRAMP Marketplace data as of October twenty-second, there's no certificate-management package from Palo Alto Networks, CyberArk or Venafi: not Certificate Manager, not Next-Gen Trust Security, and not the Trust Protection Foundation. Palo Alto's authorized packages cover privileged access, endpoint privilege management and network security. So the Federal Modernization Workbook's Book 07's decision stands: run Certificate Manager, Self-Hosted inside the agency's own authorization boundary, alongside the CAs it manages. The program's design guidance adds a corollary: avoid any feature that depends on the SaaS, and we'll meet two of those later.

The product runs on the Trust Protection Foundation, formerly the Venafi Trust Protection Platform. The current release is 26.1, from July 2026, and CyberArk typically ships major releases every six months, so plan an upgrade cadence from day one.

The servers run Windows Server 2016 through 2025, with the desktop experience, from English installation media only, and the same OS version across the cluster. They need IIS, .NET 4.8, the Visual C++ runtimes and WebView2. The database is SQL Server 2014 through 2022, also English only, and not on a platform server except in test. CyberArk strongly recommends the FULL recovery model, and recommends Enterprise edition because Standard needs an outage for the weekly index rebuild. For high availability, use Always On availability groups.

Sources: FedRAMP Marketplace products.json (last_change Oct. 22, 2026); CyberArk 26.1 System Requirements, Always On high availability, Choosing SQL Server Enterprise or Standard, Important Considerations, Installation and Upgrade Guide; Palo Alto Networks Next-Gen Trust Security page; Book 07, Chapter 04.

## Slide 4 — Part 1: Build the platform

Part 1: build the platform.

We'll start with the architecture: the cluster, its components, how to size it and make it highly available. Then the FIPS posture, where you have to be careful about what you claim. Then how administrators sign in to the console. And finally hardening, least-privilege service accounts, and backup and recovery for the database and its keys.

Sources: CyberArk 26.1 System Requirements, Installation and Upgrade Guide, security hardening and disaster recovery documentation; NIST CMVP; the Federal Modernization Workbook's Book 07, Chapter 05.

## Slide 5 — Architecture: cluster, components and availability

The architecture. Several Trust Protection Foundation servers sharing one SQL database form a cluster, and a message bus, an MQTT broker using TLS on port 8883, links them.

Each server runs the components you switch on for it in the Configuration Console. The ones this guide uses are CA Import, Certificate Lifecycle and Monitoring, Certificate Revocation Monitoring, Network Discovery, the EST service, Network Device Enrollment for SCEP, the ACME service and Reporting. You can keep work on particular servers with processing engines, discovery zones, or by turning components off, and that matters later, when we keep ACME off the FIPS-mode servers.

Sizing comes from CyberArk's tables. Two servers handle up to fifty thousand active certificates. Up to two hundred fifty thousand takes six: two for log and event processing, two for web services and two back-end servers. Past a million, CyberArk designs it with you, and SQL Enterprise is required. Each server needs four cores, sixteen gigabytes of memory and five gigabytes of disk.

For availability: Always On for the database, at least two servers per role, and a load balancer in front of the web services, which rolling upgrades require. For the CAs, a Microsoft CA Pool holds up to three CA templates; if the first CA fails, the platform stops querying it for sixty minutes and fails over.

Sources: CyberArk 26.1 System Requirements (cluster, Message Bus, sizing, ports, network scoping); Installation and Upgrade Guide pp. 54 and 86–94 (components); Rolling upgrades; Always On high availability; Create and configure a Microsoft CA Pool.

## Slide 6 — FIPS posture: what you can and can't claim

Be exact about FIPS.

What CyberArk documents: the Trust Protection Foundation supports Windows servers with FIPS mode enabled, through the Windows policy that says to use FIPS-compliant algorithms. The installation guide also says to enable it only if your industry requires it, and links Microsoft's post explaining why Microsoft no longer recommends FIPS mode. For a federal deployment, decide FIPS mode per server, deliberately. The database's secrets are encrypted with an AES-256 software key kept in the registry, a key held in a hardware security module, or both.

What not to claim. I searched NIST's validated-modules list on October twenty-second. Under the vendor name Venafi there's nothing. Under CyberArk there are two FIPS 140-3 Level 1 certificates, number 5205, the CyberArk Cryptographic Module, and number 5122, its Java counterpart. Neither names the Trust Protection Foundation or Certificate Manager, and I found no CyberArk statement saying which module the product uses. So don't cite either certificate for this product without a vendor letter. There's also no current Common Criteria certificate; the last one, for Trust Protection Platform 23.1, was archived on July twenty-ninth, 2026.

The defensible evidence path, and this is my inference, is FIPS-mode Windows, which uses Microsoft's validated modules, plus the HSM's own CMVP certificate for the database secrets. One catch, which Part 3 covers: servers running the ACME service can't be in FIPS mode at all.

Sources: CyberArk 26.1 Installation and Upgrade Guide pp. 49–55 (FIPS, encryption keys); System Requirements (HSMs); System encryption keys overview; NIST CMVP validated-modules search (Vendor Venafi; Vendor CyberArk) and certificates #5205 and #5122; Common Criteria Portal certified and archived product lists.

## Slide 7 — Console sign-in: Entra SSO with certificate-based auth

Who signs in to the console, and how.

Version 26.1 supports single sign-on to the web console through OIDC or SAML, and CyberArk's vendor table lists Microsoft Entra ID as supported for SAML, OIDC and SCIM. The MMC snap-ins sign in with the OIDC device flow. CyberArk also documents client-certificate login: you enable certificate authentication, choose the trusted CAs, and set the IIS site to require client certificates; the platform takes the identity from the certificate's UPN, email, common name, or SID extension. What CyberArk doesn't document is PIV or CAC by name.

So the program's design guidance is to federate the web console to Entra ID, and let administrators present their PIV card through Entra certificate-based authentication, as the Federal Modernization Workbook's Book 07 Chapter 06 configures it. That keeps one CBA trust store and Conditional Access in front of the console, rather than a second, separate trust store in IIS. The native client-certificate login stays a fallback. Master Admin is eligible, not standing, and the local master admin is the break-glass.

Then the API. Automation authenticates with OAuth tokens from the platform's authentication server. The defaults are a ninety-day access token and a one-year grant, and the program's guidance is to shorten both. API keys are no longer supported.

Sources: CyberArk 26.1 What's New; Login experience; Vendor support for SSO; Configuration Console Authentication node; Configuring certificate authentication in the platform and IIS; Setting up OAuth; Authentication options; Deprecated features; Book 07, Chapters 05 and 06.

## Slide 8 — Hardening and least-privilege service accounts

Hardening. CyberArk's hardening section currently covers IIS only: a rewrite rule against host-header injection; web configuration settings with debugging off, cookies marked HTTP-only and secure, request filtering to GET and POST, strict transport security, frame and content security policy headers; and the X-Powered-By header removed. Apply all of it.

Every platform server ships with a self-signed certificate called the Venafi Operational Certificate. Replace it on every server with one issued by your CA before production.

The database needs two accounts: a DBO account used only to install and upgrade, and an operational account the services run as. CyberArk documents that the operational account needs Log on as a Service and local administrator rights on every platform server, and group managed service accounts are supported.

The provisioning drivers need privilege on the targets too. For Windows CAPI and IIS, CyberArk says the account must be a Windows administrator on the target. The program's guidance is to keep those credentials in CyberArk's Enterprise Password Vault, which the platform can query through the Credential Provider. And the installation answer files contain the admin password, the database credentials and the software key, so encrypt them.

So the platform concentrates privilege: certificate-manager rights on CAs, administrator on Windows targets, and private keys in its database. The program therefore treats the Master Admins, the software key and the database backups as Tier 0.

Sources: CyberArk 26.1 Security hardening best practices and IIS hardening; Securing the web server; Windows authentication requirements; Group managed service accounts; Rolling upgrades; CAPI permissions; CyberArk credential best-practice example; Securing credential objects; Installation and Upgrade Guide p. 86.

## Slide 9 — Backup and disaster recovery: database and keys

Backup and recovery. The database and its encryption key are a pair.

Back up the database on the FULL recovery model. Export the software key with the configuration tool's key-export option, and keep it safe: CyberArk says that without it, you cannot access data in the database. If an HSM holds the key, use the HSM vendor's backup, and run the HSMs in high availability, because if the HSM stays unreachable the platform retries, logs, and then shuts down.

CyberArk's disaster recovery procedure has five steps. First, the prerequisites: local master admin credentials, the database backup, the database connection details, and the software key or HSM access. Second, stop the services on every platform server. Third, restore the database and recover its users. Fourth, re-enable SQL Service Broker on the restored database, which is easy to forget and stops the platform working if you do. Fifth, import the software key, or reconnect the HSM through the Configuration Console or the configuration tool's HSM PIN option.

On the CA side, Microsoft recommends backing up the CA with Backup-CARoleService before you change its permissions, which you're about to do for the platform's CA account. The program's guidance is to rehearse a full restore before Wave 2 exits, and the Federal Modernization Workbook's Book 07 Chapter 08's rule applies to every key backup: store the backup and its password through separate approved channels.

Sources: CyberArk 26.1 Software key backup; HSM configuration; Using HSM-protected keys; Disaster recovery prerequisites, database recovery and HSM recovery; System Requirements; Microsoft Learn, Secure, delegate and audit a certification authority; Book 07, Chapter 08.

## Slide 10 — Part 2: Connect the issuers

Part 2: connect the issuers.

First the AD CS driver: what it needs on the CA, how templates map, and which Windows Server versions are confirmed. Then how to scope its privileged account under the ESC7 review, which includes the first correction to the Federal Modernization Workbook's Book 07. Then the public and cloud CA drivers, where release 26.1 changed one. And finally how the platform coexists with Intune, which owns device certificates.

Sources: CyberArk 26.1 CA driver documentation, Supported integrations, Deprecated features; Microsoft Learn AD CS, Intune and Microsoft Graph pages; Book 07, Chapters 03 to 07.

## Slide 11 — The AD CS driver: permissions, templates, versions

The AD CS driver. In the platform it's a CA template object called Microsoft Active Directory Certificate Services, Enterprise and Standalone. It needs Microsoft CA Support installed on the platform servers, and it talks to the CA over DCOM. The account it uses needs Read, Issue and Manage Certificates, and Request Certificates on the CA. That matches the Federal Modernization Workbook's Book 07.

Template mapping is done by policy. A certificate gets its CA template object from the policy on its folder, or directly on the certificate. CyberArk's vCert tool expects the template to come from policy and calls choosing it per request against CyberArk's recommendations. So, by inference, the natural pattern is one CyberArk CA template object for each AD CS template the platform issues from.

Enterprise and standalone CAs are both supported. Only enterprise CAs use Active Directory templates, which is exactly why Book 07 moves server issuance to a standalone CA after the forest retires, with template policy living in the platform.

Letting requesters set end dates may need a CA policy flag turned on; that raises event 4892 under Book 07 Chapter 03, so the program's guidance is to leave it off unless you need it.

One open item. The driver page says it supports CAs on all supported Windows Server versions, and the platform runs on 2025. But CyberArk's supported-integrations table lists AD CS only through Windows Server 2022. If any retained CA runs Windows Server 2025, get written confirmation before Wave 2.

Sources: CyberArk 26.1 Microsoft ADCS Enterprise and Standalone CA template; MSCA certificate object settings; CA chaining; Configuring certificate import from a Microsoft CA; Microsoft CA Pool; Supported integrations; Deprecated features; System Requirements; vCert README; Microsoft Learn, Manage certificate templates.

## Slide 12 — Scoping the CLM's CA account under ESC7

Now the sensitive part. Issue and Manage Certificates is the AD CS certificate-manager right. Microsoft says it lets the holder issue, deny, revoke and reinstate certificates without the broader Manage CA permission. Defender for Identity's ESC7 assessment flags unprivileged holders of it.

Here's the first correction to the Federal Modernization Workbook's Book 07. Chapter 05 says the program scopes the account to the templates the platform is meant to issue, as if the CA had a control for that. Microsoft's current guidance says to define each certificate manager's templates and requesters and to run positive and negative authorization tests, but it also says Microsoft Learn doesn't publish a Windows Server 2025 step-by-step procedure for configuring certificate-manager restrictions, and to validate any existing restriction in a lab first. So the scoping rests on template permissions, plus allowed and denied test requests proven in the lab. Book 07 has been updated to match to say so.

My inference about why that matters: template permissions limit what the account can request. They don't narrow the certificate-manager right itself, which is why the negative test and the alerts carry the weight.

The program's controls, as design guidance. A dedicated account, a group managed service account where the CA allows it, denied interactive logon. DCOM to the CA allowed only from the platform's engine servers. Read and Enroll only on the platform's templates. Alerts on event 4887 when this requester gets a certificate outside those templates, and on 4882, 4890 and 4892. And the account goes into the quarterly ESC7 review, with the negative test result on record.

Sources: Microsoft Learn, Secure, delegate and audit a certification authority; Review and dispose of pending certificate requests; Defender for Identity certificate posture assessments; CyberArk 26.1 Microsoft ADCS CA template and Securing credential objects; Book 07, Chapter 03 (ESC7) and Chapter 05 (four permission systems).

## Slide 13 — Public and cloud CA drivers in 26.1

The public and cloud CA drivers.

For public TLS, 26.1 documents drivers for DigiCert, Sectigo, GlobalSign, HID, QuoVadis, VikingCloud and Amazon. Two 26.1 changes matter before you upgrade. Entrust Certificate Services is no longer supported as a standalone CA; CyberArk says those customers migrated to Sectigo Certificate Manager, though the Entrust CA Gateway driver for Entrust's own CA software is still documented. So if the agency's public CA is Entrust, plan the issuing path before the upgrade. And for DigiCert client and S/MIME certificates, an email subject alternative name is now required; automated renewals without one fail after the upgrade.

Note one absence. There's no documented ACME client driver for public CAs, so no Let's Encrypt-style path out to the internet. The platform is an ACME server for your own clients, not an ACME client to public CAs.

On the cloud side, I'm stating only what's documented. The AWS Certificate Manager driver issues public and private certificates and works with Amazon Private CA, and CA Import can pull Private CA certificates through audit reports written to S3, which AWS limits to once every thirty minutes. Azure Key Vault is a provisioning target, not a CA: the platform stores certificates, keys and chains there and can bind them to web apps. What I couldn't find is any statement that the Key Vault driver supports Azure Government endpoints. Test that, or ask CyberArk, before you rely on it.

Sources: CyberArk 26.1 System Requirements; Supported integrations; Deprecated features; Important considerations; DigiCert, GlobalSign and Entrust CA Gateway driver pages; AWS Certificate Manager CA template; Configuring import from Amazon Private CA; Azure integration prerequisites and permissions.

## Slide 14 — Intune coexistence: who owns device certificates

Intune coexistence. Intune owns device certificates. Cloud PKI issues to Intune-managed devices through SCEP, and Intune's profiles renew them. The platform's role there is narrow.

During the bridge period, some Intune certificates still come from AD CS through the connector. Because a Microsoft CA import brings in mobile, user and client certificates the platform didn't enroll, those will appear in its inventory. The program's guidance is to import them as monitor-only, with no renewal binding, so Intune stays the renewal engine.

There's an option CyberArk documents that the program rejects. The platform can act as an Intune third-party SCEP CA: Intune profiles point at its SCEP endpoint, and it validates challenges with Intune through an Entra app. But the Federal Modernization Workbook's Book 07 chose Cloud PKI for these devices, and this would make the platform a second issuer for a migrating population, which breaks Chapter 07's first coexistence rule. It also adds a tenant-wide consent, and Microsoft notes that revocation after a wipe depends on each third party's API.

Here's the second correction. Book 07 Chapter 04 says the platform reads Cloud PKI's inventory for reporting. CyberArk documents no Cloud PKI import. What exists is Microsoft Graph's beta Cloud PKI leaf-certificate report, and the platform's Discovery Import API. Joining them is a custom job, on a beta API. Book 07 has been updated to say that, and that Intune's certificates report remains the system of record.

Sources: CyberArk 26.1 Integrating with Microsoft Intune; Importing certificates from a CA; WebSDK POST Discovery/Import; Microsoft Learn, Third-party CA SCEP partners; Graph beta retrieveCloudPkiLeafCertificateReport; Create SCEP certificate profiles in Intune; device-naming research brief; Book 07, Chapters 04 to 07.

## Slide 15 — Part 3: Discover, own and automate

Part 3: discover, own and automate.

First, how the platform finds certificates: discovery scans and CA import. Then how each certificate gets an owner, through policy folders tied to identity and to the CMDB. Then the enrollment protocols, where the third correction to the Federal Modernization Workbook's Book 07 sits. And finally three integrations: Kubernetes, ServiceNow and the SIEM, each with a boundary question.

Sources: CyberArk 26.1 discovery, policy, permissions, ACME, EST, SCEP, OAuth, Kubernetes discovery and logging documentation; vCert; cert-manager; ServiceNow Store.

## Slide 16 — Discovery scans and CA import

Discovery. The Federal Modernization Workbook's Book 07 Chapter 02 points out that a CA database shows only what that CA issued. Certificates from public CAs, appliances or self-signing don't appear there, and finding them takes network discovery.

The platform has five ways in. Network Discovery scans IPv4 ranges and ports for TLS listeners, and can instantly check a single IPv4 or IPv6 address. CA Import pulls what a Microsoft CA or Amazon Private CA issued, template by template, optionally including expired and revoked certificates. Onboard Discovery is agentless and brings the application configuration with it. And the Discovery Import API takes results from a collector you write, such as the Graph job from Part 2.

Reconciliation decides whether a discovered certificate is one the platform already knows. It matches on subject, key usage, extended key usage and the DNS names in the subject alternative name, and the newer certificate becomes the active one. It doesn't apply to CA Import or Onboard Discovery.

The program's rule, from Book 07 Chapter 08: every certificate found on a listener with no issuance record and no owner is a finding. As design guidance for Wave 1, run read-only network scans of server and appliance ranges, and import the in-scope AD CS templates. That import needs the privileged CA account, so create it under the ESC7 controls first.

Sources: CyberArk 26.1 Certificate discovery overview; Configuring Network Discovery; Certificate reconciliation; Onboard Discovery; Agent discovery; Importing certificates from a CA; WebSDK POST Discovery/Import; Book 07, Chapter 02 and Chapter 08; research brief section 9.

## Slide 17 — Ownership: policy folders, owners and the CMDB

Ownership. The Federal Modernization Workbook's Book 07 Chapter 05 says an expired certificate is almost always an ownership failure first, so every certificate class has one renewal owner, who answers for it even when automation does the renewing. The platform is where that's recorded.

What the platform provides: placement rules and placement jobs move discovered certificates into policy folders. A folder's policy sets inherited configuration, such as the CA template and key size. Object permissions are granted on folders and objects, and Teams group the people. The documented roles are Master Admin, Server Owner, Certificate Approver and Team Owner, and workflows can require approvals at lifecycle stages.

The program's design guidance turns that into ownership. Build the policy tree to mirror Book 07 Chapter 05's certificate classes, so a certificate's folder tells you its class and its renewal engine. Give every certificate a named Server Owner. Map Teams to Entra groups; release 26.1 adds SCIM 2.0, and CyberArk lists Entra ID as supported for it. If the agency adopts the ServiceNow app, which we'll see next, associate certificates with configuration items so the CMDB owner and the platform's owner agree. And follow Chapter 08's alert: any certificate within two renewal windows of expiry with no renewal path bound to it is an incident while it can still be fixed.

Sources: CyberArk 26.1 Placement rules; Policies overview; Permissions and abilities; Teams and policy folder permissions; Workflows; Configuring expiration event intervals; Notifications and logging; Notification channels; What's New (SCIM 2.0); Vendor support for SSO; ServiceNow Store, Machine Identity Protection; Book 07, Chapters 05 and 08.

## Slide 18 — Enrollment automation: ACME, EST, SCEP, REST, agents

Enrollment automation, starting with the third correction to the Federal Modernization Workbook's Book 07.

Book 07 Chapter 08 says CyberArk documents that the win-acme client needs FIPS mode off, and advises using another tested client where the server must run in FIPS mode. The 26.1 Installation and Upgrade Guide is broader. It says that because FIPS is not supported for ACMEv2, you can't have FIPS enabled on any server used for ACMEv2. The topic page still names only win-acme; the stricter text governs until CyberArk says otherwise. The program's design guidance: run the ACME service on dedicated servers that aren't in FIPS mode, kept out of the FIPS-mode set, or get a written vendor statement. Book 07 has been updated to match.

The ACME service itself implements RFC 8555 with http-01 and dns-01 challenges, and was designed and tested with certbot, win-acme and acme.sh. The page both lists wildcard issuance and calls it future work, so test it.

EST runs on port 50443 with client-certificate authentication, and a CA label in the URL selects the CA template; three optional EST functions aren't supported. SCEP, for network devices, needs port 80.

For everything else there's the REST API with OAuth tokens, and CyberArk's vCert command-line tool, currently version 5.13.9, which needs view, read, write and create on its zone. Agentless drivers push certificates to the endpoints, licensed per instance in 26.1, and the Server Agent covers the rest.

Sources: CyberArk 26.1 Installation and Upgrade Guide p. 50; ACME overview; EST overview, limitations and reference; Configuring SCEP; NDE rules; Setting up OAuth; System Requirements; What's New; vCert README and latest release; Book 07, Chapter 08.

## Slide 19 — Kubernetes, ServiceNow and SIEM inside the boundary

Three integrations, each with a boundary question.

Kubernetes. The platform has a Kubernetes Discovery component, but it imports certificates from clusters registered to the SaaS edition, and it needs outbound HTTPS to the SaaS service. With no FedRAMP package for the SaaS, the program's guidance is not to plan on it inside the boundary. The in-boundary path is cert-manager. Its CyberArk issuer, formerly the Venafi issuer, talks directly to the self-hosted WebSDK. You configure one issuer per zone, with an access token or username and password, and refresh tokens aren't supported, so plan token rotation.

ServiceNow. I found no first-party CyberArk app in the ServiceNow Store. There is a third-party app from AEYRiX, called Machine Identity Protection, released July twenty-ninth, 2026, that supports the self-hosted edition through a MID Server and associates certificates with CMDB configuration items. That's a third-party supply-chain component, so assess it like one before adopting it.

SIEM. The platform's log server has a syslog channel with BSD, CEF or JSON formats, and it supports TLS. There's a catch worth knowing before you build: the collector's server certificate must carry an IP address subject alternative name that matches the connection IP, plus the server authentication extended key usage. So issue the collector certificate with an IP address SAN even if you configure the collector by name.

Sources: CyberArk 26.1 Configuring Kubernetes discovery; Syslog channel configuration; cert-manager documentation, CyberArk (formerly Venafi) issuer; ServiceNow Store, AEYRiX Machine Identity Protection and Lite editions; FedRAMP Marketplace products.json; device-naming research brief.

## Slide 20 — Part 4: Migrate and operate

Part 4: migrate and operate.

First, how the platform build fits into the Federal Modernization Workbook's Book 07's six migration waves, as program design guidance. Then renewal as public TLS lifetimes shrink, and how the platform feeds monitoring and drift detection. Then its role in decommissioning AD CS. And finally the decisions to take, the questions for the vendor, and next steps.

Sources: Book 07, Chapters 01, 05, 07 and 08; CyberArk 26.1 documentation.

## Slide 21 — Build sequence mapped to Book 07's six waves

Here's the build mapped onto the Federal Modernization Workbook's Book 07's six waves. This is the platform work that runs alongside the Cloud PKI waves, with a gate added to each. It's program design guidance.

Wave 1, Assess, weeks one to four. Stand up a two-server test cluster and its SQL database inside the boundary. Run read-only network discovery and import the AD CS templates in scope. That import needs the privileged CA account, so create it now, under the ESC7 controls. Gate: every certificate without an issuance record is logged as a finding, and the CA account is in the ESC7 baseline.

Wave 2, Foundation. Build production: at least two servers per role, a load balancer, Always On, keys backed up. Decide FIPS mode per server, with ACME on its own servers. Replace the operational certificates, set up Entra single sign-on and syslog over TLS, build the policy tree, one CA template object per AD CS template, a CA pool, the public CA driver and the password-vault connection. Gate: a rehearsed restore, a passing negative test, and IIS hardening applied.

Wave 3, Pilot. Move pilot servers onto platform renewal, IIS, Apache, F5, NetScaler and one NPS server, assign Server Owners, and pilot ACME, with autoenrollment left on for rollback.

Wave 4, Scale, moves servers ring by ring off autoenrollment. Wave 5 puts all public TLS on the platform. Wave 6 retires CAs on the inventory's evidence.

Sources: Research brief section 9 (program design guidance); Book 07, Chapter 07 (migration playbook, waves 1 to 6 and exit gates), Chapter 04 (issuer decision for internal server certificates), Chapter 08 (drift patterns and decommissioning).

## Slide 22 — Renewal as public TLS lifetimes shrink

Why renewal automation can't wait. In April 2025 the CA/Browser Forum adopted a ballot that cuts the maximum validity of publicly trusted TLS certificates in steps. From March fifteenth, 2026, it's two hundred days, and that's in force now. From March fifteenth, 2027, a hundred days. From March fifteenth, 2029, forty-seven days. The Federal Modernization Workbook's Book 07 works out what that means for a thousand certificates: about seven renewals every working day today, fifteen next year, and thirty-one in 2029. The reuse period for domain validation falls to ten days, so validation has to be automated too.

That's why Book 07 Chapter 08 sets one design rule: no certificate class may depend on a person remembering a date. Every class runs through one of three engines: Intune profiles, AD CS autoenrollment for domain controllers, or this platform.

On the platform, renewal works two ways. Drivers renew the certificate and push it to the endpoint, IIS, Apache, F5, NetScaler and the others. And ACME clients on web listeners renew themselves against the platform's ACME service. When you use the dns-01 challenge, the authoritative DNS zone becomes the gate for automated issuance, which is why the DNS team is consulted on ACME rollout.

The program aligns internal lifetimes with the schedule too, as the automation proves itself.

Sources: Book 07, Chapter 01 (CA/Browser Forum Ballot SC-081v3; Baseline Requirements 2.3.1; renewal arithmetic) and Chapter 08 (renewal at scale, ACME where it applies); CyberArk 26.1 provisioning driver and ACME documentation.

## Slide 23 — Monitoring and drift on the CLM platform

Monitoring and drift. The Federal Modernization Workbook's Book 07 Chapter 08 collects certificate signals from many places into one view, and security operations owns the alerts. The platform contributes the inventory, every certificate it knows with its owner, expiry and renewal status, and sends its events to the SIEM over syslog with TLS.

Four of Chapter 08's drift patterns are the platform's to catch. Expiring with no renewal path: a certificate within two renewal windows of expiry with no engine bound to it. Issuance outside policy: a discovered certificate with no enrollment record, or, from Part 2, event 4887 showing the platform's CA account received a certificate outside its templates. CRLs near their next update or served stale: the platform's Certificate Revocation Monitoring component checks CRL distribution points and OCSP endpoints, at least daily. And trust store drift: the program's guidance is to keep the platform's Roots tree limited to approved trust anchors, which is the SC-17 part b question an assessor asks.

And persist the evidence. In the program's model the drift checks run at least weekly, and their outputs are committed to the evidence repository. History matters more than any single run, because an assessor asks how long a finding stayed open, not only whether it's open now.

Sources: Book 07, Chapter 05 (security operations role) and Chapter 08 (monitoring, drift patterns, persisting the evidence); CyberArk 26.1 Installation and Upgrade Guide p. 89 (Certificate Revocation Monitoring); Syslog channel configuration; research brief section 11.

## Slide 24 — Decommissioning AD CS with the CLM inventory

Decommissioning is the Federal Modernization Workbook's Book 07's Wave 6, and the platform has a defined part in it.

The gate comes first: cutover complete, the thirty-day rollback window passed with no incidents, and every retained certificate class documented and running on the CAs that remain.

Step one of Book 07's procedure is to confirm nothing depends on the CA, and the platform's inventory is the main evidence, together with the CA database. It has to show that no unexpired certificate in a migrated class is still in use. Steps two to five retire the CA itself: stop new issuance, back up and archive the database and key, revoke outstanding certificates for cessation of operation and publish the final CRL, and uninstall the role services. Before you stop issuance, repoint any CyberArk CA template objects that used this CA to a retained CA, so renewals don't fail.

Step six cleans up trust: the Entra trust store, Intune trusted certificate profiles, NTAuth, and the CA object in the platform. Retiring that CA object is the platform owner's task, and the decommission record should say it was done. Steps seven to nine keep the CRL and AIA endpoints serving until the last certificate expires, and commit the record.

After Active Directory retires, Book 07 moves server issuance to a standalone AD CS issuing CA under the same root, still driven by the platform, which supports standalone Microsoft CAs. Template policy then lives in the platform, and there's no new root to distribute.

Sources: Book 07, Chapter 08 (Decommissioning AD CS, steps 1 to 9), Chapter 07 (Wave 6), Chapter 04 (after Active Directory); CyberArk 26.1 Microsoft ADCS Enterprise and Standalone CA template; Microsoft Learn, Manage certificate templates.

## Slide 25 — Decisions, vendor asks and next steps

To close: decisions, vendor asks, and next steps.

The decisions to take. Which servers run in FIPS mode, and which separate servers run ACME. Whether database secrets are protected by an HSM or by the software key, and whether SQL is Enterprise or Standard. Console sign-in through Entra single sign-on with certificate-based authentication. The public CA path, if the agency uses Entrust today. Whether to build the Cloud PKI feed on a beta API, and whether to adopt the ServiceNow app.

Ask CyberArk, in writing: which statement governs ACME and FIPS; whether AD CS on Windows Server 2025 is supported, given the stale table; which cryptographic module the product uses, and whether any CMVP certificate covers it; whether the Key Vault driver works with Azure Government; and whether PIV or CAC console login is supported as such.

Next steps: stand up the Wave 1 test cluster, create the CA account under the ESC7 controls, and lab-test allowed and denied requests. The Federal Modernization Workbook's Book 07 has been updated in Chapters 03 and 05 for the ESC7 caveat, Chapter 04 for Cloud PKI reporting, and Chapter 08 for ACME and FIPS.

The program's recommendation is plain: CyberArk Certificate Manager, Self-Hosted, is the right platform for Book 07's lifecycle. It's the agency's existing machine-identity vendor, it covers every issuer the design assigns to it, and its risks are known and manageable. The backup slides list the risks, the assessor evidence and what couldn't be verified. This is the program's research, under review, not an endorsement by any federal agency. Thank you.

Sources: Research brief sections 0, 12 and 13; Book 07, Chapters 03, 04, 05, 07 and 08; CyberArk 26.1 documentation cited in Parts 1 to 3.
