# Book 07 — PKI & Certificates — Technical Deep Dive — narration script (practice copy)

## Slide 1 — PKI & Certificates: the technical deep dive

This is the technical deep dive for Book 07 of the Federal Modernization Workbook, PKI and Certificates. It's for the PKI engineers and architects who will run the move off Active Directory Certificate Services.

It comes in two parts of about twenty-five minutes each, and four modules you can watch separately. Part 1 is hardening and the target: first how to make the AD CS that stays the best-defended system you own, then the target architecture of four issuers and one lifecycle platform. Part 2 is issuing, migrating and retiring: the Intune certificate profiles, strong mapping and Entra certificate-based authentication, then coexistence, the six-wave migration, lifecycle monitoring and the decommissioning of the old CAs.

The slides show tables, checklists and decision matrices. The commands live in the chapters and appendices, and the book marks them as illustrative and untested against production; I'll point you to them rather than put them on screen.

## Slide 2 — Why this matters: certificates fail at expiry, not at cutover

Why this matters. A certificate is a signed naming claim that has already been handed out. It sits in device stores, on smart cards, in load balancers and in trust stores nobody remembers configuring. It doesn't move when the directory moves. It keeps working until it expires, and then whatever relied on it stops.

Three properties make AD CS the hardest part of Active Directory to leave. An enterprise CA is wired into the forest: its templates, enrollment services, NTAuth trust and publication points live in the configuration partition. The cloud replacements cover only part of the estate: Cloud PKI issues to Intune-managed devices, and Intune doesn't manage Windows Server. And domain controllers need certificates for as long as domain controllers exist.

Meanwhile the rules are moving under certificates already issued. Public TLS maximum validity is two hundred days today, a hundred days from March 15, 2027, and forty-seven days from March 15, 2029. KB5014754 put domain controllers in Full Enforcement on February 11, 2025, and Compatibility mode has been gone since September 9, 2025. NIST's draft post-quantum transition plan proposes deprecating RSA-2048 signatures after 2030 and disallowing RSA and ECDSA signatures after 2035, and OMB M-26-15 gave agencies a hundred and twenty days from June 24, 2026 to submit a migration plan.

So the move off AD CS runs as its own program. It fails at expiry, not at cutover, which can be months later and far from its cause.

## Slide 3 — What AD CS holds up, and the four verdicts

What AD CS holds up. It isn't one server. The typical estate is a two-tier hierarchy: an offline standalone root that signs the issuing CAs and its own CRL, and enterprise issuing CAs that issue from templates stored in Active Directory. Every enterprise CA also lives as objects in the forest's Public Key Services branch: certificate templates, enrollment services, the NTAuth certificates object, AIA and CDP containers, key recovery agents and OIDs. Those objects are forest-wide, which is exactly what ties AD CS to Active Directory. Domain members enroll through Group Policy autoenrollment, which runs every eight hours and renews a certificate after it passes eighty percent of its validity.

Chapter 02's inventory has four layers: the CAs, the templates, the issued certificates and the relying parties. The relying-party layer decides the order of work later, because a new issuer is useful only once everything that validates it trusts it.

Then every template and use case gets one of four verdicts, asked in order. RETIRE first, if the consumer is going away. MIGRATE, if Cloud PKI through Intune or Entra CBA replaces it: Wi-Fi, VPN, device authentication, tenant sign-in. BRIDGE, if it depends on AD itself or a server the cloud can't reach: domain controllers, LDAPS, NPS and NTAuth trust. RETAIN is what's left, such as HSM-held code signing, and every entry gets an owner and a review date. Appendix B applies these verdicts template by template; we'll come back to it in Module 4.

## Slide 4 — Module 1: Hardening what stays

Module 1: hardening what stays. A migration off AD CS takes months, and for some workloads it never finishes. Throughout that time the enterprise CA keeps issuing certificates that domain controllers, VPN gateways, RADIUS servers and Entra ID accept as proof of identity. A CA can create credentials the whole environment trusts, so one over-privileged account or misconfigured setting on it can undo every other identity control.

That makes hardening the first technical workstream, not a cleanup task at the end. Everything in this module is defensive: what each misconfiguration is, how to detect it, and how to fix it.

## Slide 5 — The gate, and where the misconfigurations live

The program carries one rule forward unchanged: misconfigurations rated Critical or High are remediated and verified before any certificate workload migrates. Migrating from a CA that can be made to issue arbitrary credentials propagates the weakness into whatever trusts the hierarchy next. And under the bring-your-own-CA model the program recommends, the new Cloud PKI issuing CA chains to the existing AD CS hierarchy, so it inherits every weakness the day it goes live.

The ESC names come from SpecterOps' 2021 research; Microsoft adopted the same labels in Defender for Identity, which is why they're the shared vocabulary. The book uses them only as labels for defensive checks. The classes live in four control points. Template objects hold ESC1 through ESC4. The Public Key Services objects hold ESC5, which Defender for Identity doesn't assess, so detection is an ACL review plus directory change auditing, event 5136. The CA's own configuration holds ESC6 and ESC7, and HTTP enrollment endpoints hold ESC8. Certificate template assessments are available to every customer with AD CS; CA assessments need a Defender for Identity sensor on the AD CS server, so install it on every enterprise CA that stays.

Two caveats from the book. In GCC, Defender for Identity uses the security dot microsoft dot com portal; Microsoft says new features reach GCC, GCC High and DoD within ninety days of commercial release, but preview features may not be supported there. The ESC1 and ESC6 assessments are still labeled preview, so confirm they appear in your tenant, and run the manual checks in the meantime.

## Slide 6 — Template classes ESC1–ESC4: detect and fix

The template classes, as a checklist.

ESC1: a template lets the requester supply the subject or subject alternative name, permits client authentication, and broad unprivileged groups can enroll, so a member could obtain a certificate that names someone else. Detect it with Defender for Identity, and by hand: Supply in the request on the Subject Name tab, an authentication purpose such as Client Authentication, Smart Card Logon, PKINIT or Any Purpose, and Enroll granted to Authenticated Users, Domain Users, Domain Computers or Everyone. On the CA, events 4886 and 4887 show requests where the requester and the issued subject differ. Any one remediation closes it: build the subject from Active Directory, remove authentication EKUs the template doesn't need, restrict Enroll, require CA certificate manager approval, or take the template off every CA if it's unused.

ESC2 is Any Purpose or no EKU on a broadly enrollable template. A no-EKU template restricted to PKI administrators, such as a subordinate CA template, isn't the same exposure.

ESC3 is a broadly enrollable enrollment agent template. Treat an enrollment agent certificate as an impersonation capability. Microsoft doesn't publish a Windows Server 2025 procedure for enrollment agent restrictions, so validate the existing configuration in a lab first.

ESC4 is write rights or ownership on a template held by anyone but the PKI administrators. Changes are logged as event 5136 only when directory change auditing is on and the objects carry a matching SACL. One trap when you fix it: if you remove Authenticated Users from a template ACL, grant each issuing CA's computer account Read, or the CA can no longer read the template.

## Slide 7 — Directory and CA classes ESC5–ESC8, then ESC11 and ESC15

The directory and CA classes.

ESC5 is unprivileged write access on the forest's Public Key Services objects. The NTAuth certificates object holds the CAs trusted to issue logon and domain controller certificates, and each enrollment services object records what a CA can issue and who can enroll. Write access to either is control over authentication. Defender for Identity has no ESC5 assessment, so review the ACLs, compare the NTAuth store with your approved CA list, and audit changes through event 5136.

ESC6 is the CA-wide flag that lets any requester supply subject alternative names on any template. Find out why it was turned on, since some old workflows depended on it, then clear it and restart the service. The book corrects a common belief here: KB5014754 introduced strong mapping, which reduces what a forged name can do against Kerberos, but it doesn't change what the CA will sign, and other relying parties may still trust the name. Clear the flag regardless.

ESC7 is unprivileged Manage CA or Issue and Manage Certificates. Build separate groups for CA administrators, certificate managers, enrollment agents, auditors and backup custodians. Service accounts count too: the Intune Certificate Connector and lifecycle tooling both hold Issue and Manage Certificates, so each is a certificate manager in all but name.

ESC8 is an HTTP enrollment endpoint that accepts NTLM without HTTPS or Extended Protection. Microsoft's advisory: Extended Protection set to Required, Require SSL, restart IIS, and restrict NTLM where you can. Better still, remove Web Enrollment wherever nothing depends on it, and apply the same rules to NDES.

## Slide 8 — Turn on CA auditing, then watch the baseline events

Every detection in this module depends on evidence, and AD CS produces none by default. Two settings are needed, and neither works without the other. The CA's audit filter selects which CA operations are audited. The Audit Certification Services advanced audit subcategory lets the operating system generate the events. Set the subcategory to Success and Failure in a dedicated GPO linked to the CA servers, set the audit filter to cover every category, and restart the service in a maintenance window. Full auditing includes the start and stop category, which can slow restarts on a CA with a large database, so test that first.

Then watch Microsoft's focused baseline. 4886, 4887 and 4888 are requests received, issued and denied: issuance volume per template, every credential issued, and probing of templates that should be restricted. 4870 is revocation evidence. 4882 and 4890 are permission and certificate manager changes, which is ESC7 drift. 4885 is someone changing the audit filter. 4892 is a CA property change, which catches the ESC6 flag. 4896 is rows deleted from the CA database. 4897 is role separation enabled. Microsoft recommends generating each event in a nonproduction test before writing the collection rule, so an assumed event doesn't become a blind spot.

Forward through Windows Event Forwarding to a collector and the SIEM. Forwarding doesn't stop a full local log from overwriting evidence, so size the CA's Security log for the longest plausible collection outage.

## Slide 9 — The risk-scoring matrix, and what closed means

The program scores each class for prioritization. Be clear about what's whose. The risk level, domain-compromise and priority columns are the program's own scoring, carried forward from its PKI guide. The detection column is from Microsoft's documentation.

Four classes are Critical with Immediate priority: ESC1, ESC2, ESC6 and ESC8. Four are High, to be fixed within two weeks: ESC3, ESC4, ESC5 and ESC7. One change from the original guide: ESC2 is downgraded from Yes to Possible for domain compromise, because Microsoft describes its main effect as undermining trust in other certificate consumers rather than direct user impersonation.

Immediate means the finding is fixed, or the template or endpoint is taken out of service, before the next change window closes. And every row is a migration blocker until it's verified closed. Verified has a definition: the Defender for Identity assessment shows no exposed entities, remembering that scores and statuses update every twenty-four hours, plus a manual re-check for ESC5, which Defender for Identity doesn't assess.

That's the record the gate reads. Chapter 07's first wave doesn't exit until every Critical and High finding is remediated and re-tested, and the PKI owner and the security team have approved the assessment.

## Slide 10 — Hardening baselines: retained AD CS, Cloud PKI and Entra CBA

Three baselines close the module.

The AD CS that remains keeps running for months or years for BRIDGE and RETAIN workloads. Remove every template those workloads don't need from each CA's issuance list; it's reversible. Alert on requests for templates that should no longer be requested. Keep CRL publication on schedule, and test it from representative client networks. Back up the CA before every change. Treat CA servers as Tier 0, the program's designation, because the CA can mint domain authentication credentials. And the program requires FIPS 140-2 or 140-3 validated modules, CA keys held non-exportable in an HSM, and dual control for root ceremonies.

Cloud PKI removes most of that attack surface but adds its own. Scope administrators with custom Intune roles and scope tags; there's no built-in Intune PKI Administrator role. EKUs are fixed at creation. On Windows, set the key storage provider to TPM, otherwise fail; a 4096-bit key can only live in the software provider, so the program uses 2048-bit RSA in the TPM. The program sets one-year validity. And don't build production CAs during a trial.

Entra CBA is a relying party, so its hardening is about trust and binding. Require high-affinity bindings in production. Use a custom authentication strength that names issuers or policy OIDs, up to five of each, for sensitive resources. Require CRL validation; the program wants each trusted issuing CA to publish a CRL at least every twenty-four hours, because Entra caches it. And CA scoping, generally available since April 2026, ties each CA to one group, with up to thirty rules. A mistake can lock users out, so pilot it.

## Slide 11 — Module 2: The target PKI

Module 2: the target PKI. The guide this book replaces said Microsoft Cloud PKI eliminates the need for on-premises AD CS for most certificate use cases. That's true for devices and wrong for the estate.

There's no single replacement for AD CS. The target is four issuers, each chosen for the subjects only it can serve: Cloud PKI for Intune-managed devices, a smaller and hardened AD CS for what still depends on Active Directory, the Federal PKI for PIV, and public CAs for names the internet must trust. Entra ID sits beside all of them as a relying party, not an issuer. One root-of-trust decision and one lifecycle platform hold them together.

## Slide 12 — Microsoft Cloud PKI: what it can and can't issue

Cloud PKI is a Microsoft-hosted PKI managed in the Intune admin center. It hosts the root and issuing CAs, a SCEP registration authority for each issuing CA, the CRL distribution point and the AIA endpoint, which together replace the on-premises CA, NDES server and Certificate Connector for device certificates.

What it can do. Issue client-authentication certificates to Intune-enrolled Android, Apple and Windows devices, through SCEP. Publish a CRL per CA, valid seven days, republished every three and a half days and on every revocation. And host up to three CAs per tenant.

What it can't. Issue to anything not enrolled in Intune; Intune doesn't support Windows Server, so no domain controller, NPS server, web server or SQL Server gets a Cloud PKI certificate. Issue the server certificates RADIUS and VPN gateways present; Microsoft says those must come from another CA. Issue through PKCS. Answer OCSP. And change a CA's EKUs after creation. Plan the three-CA count before you create anything.

Keys: licensed CAs use Azure Managed HSM; trial CAs use software keys that can't be converted after purchase. Licensing: Cloud PKI is a subscription on top of Intune Plan 1 or 2. From July 2026, Microsoft 365 E5 and E7 include it for commercial customers; Microsoft says Government plans are planned to align, subject to compliance and regulatory requirements, so confirm the entitlement on the current SKU. And availability: GCC uses the commercial Intune service, so availability follows it and licensing is the question. Cloud PKI became available in GCC High in the week of September 28, 2026, and isn't supported in DoD.

## Slide 13 — Two ways to anchor trust: a cloud root or bring-your-own-CA

Cloud PKI offers two ways to anchor trust, and both can coexist in one tenant.

The Cloud PKI root CA: you create a root and one or more issuing CAs in the cloud. It's a two-tier hierarchy. In the admin center the root's validity is five to twenty-five years and an issuing CA's is two to ten, never longer than its root; the Graph API allows custom periods. The catch is that every relying party has to be given the new root.

Bring your own CA: you create an issuing CA in the cloud, Intune generates a certificate signing request, and your private CA signs it. Four details matter. The signer doesn't have to be the root; Microsoft says it can be a root or issuing CA from any tier, using the Subordinate Certification Authority template. The signer sets the terms: validity and hash algorithm come from the signing CA, the key size you choose caps the SCEP profiles that use it, and 1024-bit keys and SHA-1 aren't supported. The AIA comes from your CA, and AD CS defaults to an LDAP location, so configure an HTTP AIA before signing; Android doesn't follow AIA paths, so deploy the full chain there. And relying parties still get one new certificate: Microsoft recommends deploying the BYOCA issuing CA certificate to them, because AIA retrieval isn't guaranteed on every platform. Renewal repeats the signing.

One consequence matters more than any of these. Under BYOCA the private root CRL stays where it is, and every relying party, Entra ID included, must still fetch it. An offline root that publishes its CRL only over LDAP, or late, breaks the cloud issuer as surely as the on-premises one.

## Slide 14 — The deployment-model decision, and the program's choice

A Cloud PKI root needs no existing private PKI, brings a new chain that has to reach every relying party and every forest, and keeps the root key in a Microsoft-managed HSM. BYOCA needs a private CA to sign, preserves the chain relying parties already hold, keeps root custody wherever your AD CS root key is, and adds one ongoing on-premises dependency: the private root's CRL must stay published and reachable over HTTP. Neither model can serve domain controller, LDAPS or server certificates, because Cloud PKI issues only to Intune-enrolled devices. And rollback is simpler under BYOCA, because the original root and its issuing CAs keep running.

The program's recommendation, for an organization with an established AD CS hierarchy, an offline root and cross-forest trust, is BYOCA. It preserves the trust chain, needs one cloud CA rather than two, and keeps a natural rollback path. For an organization building PKI for the first time alongside cloud-first identity, a Cloud PKI root removes every on-premises dependency.

Three program rules go with BYOCA. Harden first: the root's hierarchy passes the Chapter 03 gate before it signs a cloud issuing CA. Sign with the root, not an AD CS issuing CA, so the cloud issuer is a peer of the existing issuing CAs and retiring them later doesn't touch it. And treat the root CRL as production: publish it to an internet-reachable HTTP location on a schedule with margin, monitor it, and record the next ceremony date before the current CRL expires.

## Slide 15 — What AD CS is kept for, and who issues server certificates

Chapter 04 records what AD CS is kept for and when each use ends.

Domain controller and KDC certificates stay until the last domain controller retires: servers can't get Cloud PKI certificates, and smart card or certificate logon to the domain needs a domain controller certificate chaining to a CA in the forest's NTAuth store. LDAPS stays until LDAP-bound applications move. NPS, RADIUS and VPN gateway server certificates stay until RADIUS moves, and until then they fall under the server issuer decision. Network equipment through NDES and HSM-held code signing stay too. And S/MIME: delivery can move to Intune imported PKCS, but the issuer and its key history stay.

That leaves internal server TLS, which Chapter 02 parked as BRIDGE until an issuer was named. The program's decision has three parts. Internal names are issued by the retained AD CS hierarchy, but requested and renewed through CyberArk Certificate Manager rather than by hand or by server autoenrollment, so every server certificate has an owner, an expiry alert and automated renewal in one place. That covers NPS and RADIUS servers, VPN and Remote Desktop gateways and SQL Server as well as web servers. Domain controller certificates, which also serve LDAPS, stay on autoenrollment. Names the internet must trust come from a public CA, also through the lifecycle platform, because public lifetimes are on the shrinking schedule. And after Active Directory: enterprise CAs need AD, and standalone CAs don't use templates. When the forest retires, server issuance moves to a standalone AD CS issuing CA under the same root, still driven by the lifecycle platform, which supports both kinds of Microsoft CA. That keeps server certificates on the existing chain with no new root to distribute.

## Slide 16 — Federal PKI for PIV, and one lifecycle platform

PIV certificates aren't issued by Cloud PKI or by the program's AD CS, and the migration doesn't change their issuer. The Federal PKI's root for the federal government is the Federal Common Policy CA G2, and shared service providers are contracted to issue the certificates on PIV cards. What the target PKI has to do for PIV is trust, not issue. Distribute the federal root, because it isn't in the Microsoft, Mozilla or Apple trust stores by default: an Intune trusted certificate profile for managed devices, Group Policy for domain members. Keep NTAuth right while the domain exists, because smart card logon with certificates from a non-Microsoft CA needs that issuing CA in NTAuth, and a certificate on every authenticating domain controller. And upload the chain to Entra ID, which validates PIV certificates against its trust store.

Then lifecycle. Cloud PKI and Intune issue, renew and revoke what they put on managed devices. Everything else is the lifecycle platform's job, and for this program it's CyberArk Certificate Manager, now part of Palo Alto Networks, from the program's existing machine-identity vendor; the program doesn't add a second lifecycle vendor.

Two facts shape how it's deployed. Its CA account is privileged: to enroll through a Microsoft CA it holds Read, Issue and Manage Certificates, and Request Certificates, so it falls under the ESC7 review. And in the FedRAMP Marketplace dataset as of October 20, 2026, none of Palo Alto Networks' authorized packages is Certificate Manager or Next-Generation Trust Security. Until one is, the program deploys Certificate Manager, Self-Hosted inside its own authorization boundary. That's a program decision, to revisit when the Marketplace changes.

## Slide 17 — Module 3: Device and user certificates

Module 3: device and user certificates. Intune puts certificates on devices. Entra ID decides whether a certificate proves who someone is. Those are two jobs, and each one fails differently.

When Intune delivery fails, a device has no certificate and Wi-Fi, VPN or an application refuses it. The failure is local and visible in the profile report. When Entra certificate-based authentication goes wrong, the danger is the opposite: a certificate that should fail might pass, because the trust store holds too much, revocation isn't configured, or a binding is weak. Keep the two jobs apart in planning. They meet at one point, a user certificate delivered by Intune and then used to sign in, and that's where most migration surprises come from.

## Slide 18 — Three delivery paths, one trusted certificate profile first

Every other profile depends on the trusted certificate profile. It deploys the public certificate of the root and of intermediate or issuing CAs, so the device can build the chain. Export each CA certificate as a DER-encoded file, never the private key, and create one profile per platform. With Cloud PKI, that's the Cloud PKI root and issuing CAs. With BYOCA, it's every CA in the private hierarchy as well as the BYOCA issuing CA, on every platform. If a device doesn't trust the root, the SCEP or PKCS profile fails.

Then three paths. SCEP with Cloud PKI: the device generates its own key pair and request; the old guide said Intune generates it, and it doesn't. The Cloud PKI registration authority checks the request against the Intune challenge, and the issuing CA signs. No on-premises CA, NDES server or connector. Don't mix NDES and Cloud PKI SCEP URLs in one profile.

SCEP with AD CS runs through two pieces of on-premises software: NDES as the registration authority, and the Certificate Connector, which adds the Intune policy module. The private key still never leaves the device.

PKCS doesn't use NDES. The connector generates the key pair on its own server, requests the certificate, and hands the certificate and key to Intune as a PFX. So the template must allow export, and the private key exists, however briefly, somewhere other than the device that uses it. That's the trade PKCS makes for not needing NDES, and it's why the program prefers SCEP wherever a use case allows either.

## Slide 19 — NDES and the connector, and which profile for which use

When the issuer is AD CS, the infrastructure rules are strict. The CA must be an enterprise CA; a standalone CA isn't supported. The NDES and connector server is domain-joined in the same forest, and is neither a domain controller nor the issuing CA. Publishing NDES to the internet needs a reverse proxy with passthrough preauthentication. The SCEP template supplies the subject in the request, which is exactly the setting Chapter 03 treats as dangerous; here the policy module enforces the subject, so the template is safe only while Enroll is limited to the NDES service account. Audit that ACL like any other. And the connector's Issue and Manage Certificates right is a CA officer right, so the connector server belongs in the CA's administrative tier.

NDES picks a template by the request's purpose, so one server serves at most three templates. It can't be clustered; for availability, run several identical servers. Its own two registration-authority certificates expire like any other and are a frequent cause of outages.

Keep the connector current. The current release is 6.2510.3.3007, from May 18, 2026. Let it update itself and alert on Warning or Error.

Which profile for which use. Wi-Fi, VPN, web application client certificates and user certificates for Entra CBA are trusted plus SCEP, from Cloud PKI, or from AD CS while a relying party trusts only AD CS. S/MIME signing is PKCS; S/MIME encryption is imported PKCS from a CA with key archival, because old mail needs the old keys. And a user certificate for certificate logon to AD needs the SID added, from AD CS or a CA in NTAuth.

## Slide 20 — Strong certificate mapping: Full Enforcement is the present

Before May 2022, a domain controller mapped a certificate to an account by name. KB5014754 changed the KDC to want a strong mapping. The old guide said enforcement began in February 2025; that was one step of four. May 2022, Compatibility mode. April 2023, the Disabled setting is ignored. February 11, 2025, Full Enforcement for domain controllers with no value set. September 9, 2025, the registry key is no longer honored. As of October 2026, every current domain controller is in Full Enforcement with no supported way back.

A strong mapping is the SID extension AD CS adds, the SID in a tagged SAN URL, which is Intune's form, or an explicit strong value on the account, such as issuer and serial number, SKI or SHA-1 public key.

What Intune profiles need. It applies to user certificates on all platforms and to device certificates only on hybrid joined Windows devices, and the user or device must be synced from AD. For SCEP, add a SAN attribute of type URI with the on-premises security identifier variable. The old guide said Cloud PKI adds it automatically; Microsoft's instructions say you must add it. For PKCS, run the current connector and set the SID security extension registry value. Logon certificates need their issuing CA in NTAuth. Pilot with a new profile, because editing a SCEP profile revokes what it issued.

To find weak certificates, sweep the KDC's System log for events 39, 40 and 41. One trap on a mixed estate: on Server 2008 and 2008 R2, event 41 means no strong mapping, and the other two are logged as 48 and 49. Read the event text before you classify a hit.

## Slide 21 — Entra CBA: the sign-in, the trust store and revocation

How a CBA sign-in works, as Microsoft documents it. The user enters a username; Entra ID performs home realm discovery and offers Use a certificate or smart card. The client is redirected to the certificate authentication endpoint, certauth dot login dot microsoftonline dot com in the commercial cloud, which includes GCC, and the dot us endpoint in Azure Government. It requests the client certificate in a mutual-TLS handshake. Entra ID checks the chain and the CRL, and finds one user through the username bindings. If Conditional Access requires MFA and the certificate counts as multifactor, the user is signed in; if it's single-factor, Entra offers a registered second factor. Allow the endpoint through proxies and turn off TLS inspection for it, or the client certificate never reaches Entra ID.

The trust store. Upload every CA in the chain that issues user certificates. Microsoft highly recommends the PKI-based trust store, which holds up to two hundred fifty CAs. Managing it takes Privileged Authentication Administrator, and bulk upload needs P1 or P2. The trust store is also a blast radius: adding a CA lets any certificate it issues authenticate any user it can be bound to.

Revocation. Set each CA's base CRL URL, and the delta if published; without one, a revoked certificate still authenticates, so turn on Require CRL validation. Entra ID supports one CRL endpoint per CA over HTTP or HTTPS, with HTTP recommended, downloaded within ten seconds. It doesn't support OCSP. Interactive sign-in downloads CRLs up to twenty megabytes in the commercial cloud including GCC, and forty-five in Azure Government. And it caches the CRL until its next update, so revoke the user's sessions when revocation must be immediate.

## Slide 22 — Username bindings, affinity and factors

Username bindings map a certificate field to a user attribute. By default the SAN principal name maps to the user principal name. Microsoft classes subject key identifier, SHA-1 public key, and issuer and serial number as high affinity, and principal name, email, subject, and issuer and subject as low. The old guide classed issuer plus subject as high; Microsoft classes it as low, because a CA can issue several certificates with the same subject.

How Entra ID evaluates them. In priority order, lowest number first, and only Graph shows the priority. If the tenant or a custom rule requires high affinity, every low-affinity binding is dropped. So with several bindings, CBA is only as secure as the lowest-affinity one. Configure one low-affinity binding at most. The program's position: production tenants require high affinity, using issuer and serial number or SKI in certificate user IDs. Low-affinity UPN binding is acceptable in a pilot. But setting the tenant-wide requirement to high before every user's values are correct locks those users out.

The authentication binding policy decides one factor or two. The default is single-factor; rules can be by issuer, by policy OID, or both. Issuer-and-OID rules beat OID rules, and OID rules beat issuer rules; a certificate whose OIDs map to both is single-factor. Microsoft says to treat a certificate as multifactor only if a PIN or biometric protects it, so a PIV card qualifies and a software certificate doesn't.

Two rules prevent lockout. Target CBA to groups that hold valid certificates, never All users, and give people without a certificate another path, such as a Temporary Access Pass. CBA itself needs no premium license; Conditional Access, which every real deployment uses, needs P1.

## Slide 23 — Staged rollout, and moving off AD FS

Staged rollout lets synchronized users in a federated domain sign in at Entra ID with CBA instead of being sent to AD FS, while everyone else stays federated. Microsoft is explicit that it's a temporary testing mechanism, not a permanent mixed state, and its limits are tighter than the old guide implied. It applies only to users synced by Entra Connect, and only to browser and modern authentication; legacy authentication still goes to the federation server. Up to ten groups per feature, and no nested or dynamic groups. A group added for the first time is limited to two hundred users, and later membership changes take up to twenty-four hours. Password sign-in for CBA pilot users works only with password hash sync. And issue a Temporary Access Pass right after adding a user, so the first sign-in doesn't fall back to the federation server.

The program pilots with cloud groups of ten to twenty users, confirms in the sign-in log which binding matched and what level was granted, and grows in steps until the domain converts.

Moving off AD FS certificate authentication doesn't change the credential or the PKI; only the place where authentication and revocation are checked moves. Get trust parity, with internet-reachable CRLs. Get binding parity, syncing account mappings to certificate user IDs where AD FS used them, and protect that sync path. Keep staged rollout short, because staged users stay exposed to a federation server compromise until the domain converts. Record the federation configuration and back up the farm. And the old guide called conversion one-way; it isn't. Microsoft's rollback is to re-federate, which works only while AD FS can still be brought back.

## Slide 24 — Module 4: Coexistence, migration and retirement

Module 4: coexistence, migration and retirement. Coexistence isn't a phase at the end of the project; it's the condition the project runs in. From the day the first Cloud PKI certificate is issued until the last AD CS-dependent workload retires, devices carry certificates from both issuers, relying parties trust both chains, and two sets of CRLs have to stay reachable.

For most of the migration, both PKIs are production. The plan has to say which one each certificate comes from on any given day, and how to go back. Then, after the migration, the work becomes keeping every certificate owned, renewed and checkable, and retiring the old CAs without stranding a single one.

## Slide 25 — Coexistence: five rules and trust in both directions

The program's coexistence rules. Each use case has one issuer at a time per population: a device group gets its Wi-Fi certificate from AD CS or from Cloud PKI, never both by design. Trust goes up before issuance moves: a relying party trusts the new chain before the first certificate from it reaches anything that relying party sees. Revocation must be reachable wherever validation happens. Nothing is revoked to force a move: an AD CS certificate is replaced at renewal or expiry. And every move has a tested rollback that doesn't depend on something the move retired.

What stays on AD CS until Active Directory retires. Domain controller certificates, because Cloud PKI doesn't issue to servers. Use a copy of the Kerberos Authentication template. Entra-joined devices can't read a CRL from AD before they authenticate, so publish an HTTP CRL listed first. LDAPS stays too; the old guide said it could move to Cloud PKI, but an LDAPS endpoint is a server. Other server certificates stay on AD CS as well, renewed through CyberArk Certificate Manager, as Chapter 04 decided. NPS needs care: it must trust the Cloud PKI chain before the first pilot device gets a cloud Wi-Fi certificate, and keep trusting AD CS until the last AD CS client certificate expires.

Trust runs both ways. AD CS into Entra ID: upload the root and every intermediate and issuing CA, each with an internet-facing CRL; that's also what lets AD FS certificate authentication move without reissuing anything. The cloud chain into the forest: by Group Policy or by publishing to the directory. NTAuth only for CAs that will issue logon certificates. And each forest needs its own distribution, while every forest's user-issuing root goes into the single Entra trust store.

## Slide 26 — CRL availability: outages are revocation outages

Most coexistence outages are revocation outages. Relying parties now sit in three places, inside the network, on the internet, and in Entra ID, and each CA's CRL must be reachable from all three wherever its certificates are validated.

Every relying party that validates Cloud PKI certificates, including on-premises RADIUS and VPN servers, needs outbound HTTP to the Intune-hosted CDP and AIA. A BYOCA issuing CA's own CRL is Intune-hosted too, but its parent CRL and AIA come from the private CA, and AD CS defaults to an LDAP AIA location. AD CS CAs that issue user certificates for Entra CBA usually publish over LDAP plus an internal HTTP URL; Entra ID needs one internet HTTP or HTTPS URL per CA, HTTP recommended, with no OCSP and no LDAP, and watch the CRL size limits, twenty megabytes for commercial and GCC and forty-five for Azure Government. And the CAs behind domain controller certificates must serve Entra-joined devices that haven't authenticated yet, so LDAP-only distribution points break them.

Fixing an AD CS distribution point means two things. Add an HTTP location reachable from the internet, using HTTP rather than HTTPS. And recognize that the new URL appears only in certificates issued after the change. Entra ID uses the CRL URL configured in its trust store, not the one inside each certificate, so CBA works as soon as the trust store points at the published CRL; other relying parties keep failing until their certificates renew. The program publishes on plain anonymous HTTP, not through an application proxy, because Entra ID must download the CRL without authentication within ten seconds.

## Slide 27 — Six gated waves, each with a tested rollback

The migration runs as six waves. Each wave's exit gate is the next one's entry gate, and each has its own rollback. The durations are program planning figures for a single-forest estate, not commitments; scale them to the wave 1 inventory. Appendix A turns each wave into a checklist with an owner and a verification per line.

Wave 1, Assess, weeks one to four: inventory every CA and template, run the Chapter 03 checklist, classify every template, list every relying party, and run the strong-mapping sweep. It reads, so it needs no rollback. Wave 2, Foundation: create the Cloud PKI CAs with licensed keys, upload user-issuing CAs to the Entra trust store, deploy trust profiles and the cloud chain to domain-joined relying parties, and test. The gate is trust profiles on at least ninety-nine percent of managed devices and every CRL reachable from inside, outside and Entra. Wave 3, Pilot, fifty to a hundred devices: Wi-Fi then VPN, then CBA through staged rollout, with AD CS autoenrollment left on so the rollback works. The gate is ninety-five percent issuance success. Wave 4, Scale, in rings; remove autoenrollment for each ring once its cloud certificates are accepted. Wave 5, Cutover: record federation settings, convert domains starting with the smallest, and keep AD FS restorable for thirty days, which is what makes the four-hour recovery objective achievable. Wave 6, Decommission.

The rules across waves: rehearse each rollback in a test scope first, and never let a rollback depend on a component the same wave retires. Removing or editing a SCEP profile revokes its certificates on Windows and Apple platforms, so treat profile changes as changes with impact.

## Slide 28 — The template matrix: classify by what was actually issued

Appendix B is the starting matrix that seeds wave 1. Classify each template by what it actually issued, not by its name.

Three facts drive most rows. Cloud PKI issues only through SCEP, only to Intune-enrolled devices, and Intune doesn't manage Windows Server, so every server certificate is BRIDGE or RETAIN, never MIGRATE. And PKCS profiles move delivery to Intune, not issuance off AD CS.

So: User, Computer and Workstation Authentication are MIGRATE for Intune-managed devices, to Cloud PKI SCEP, with the SID URI where the certificate is used against AD; servers stay on autoenrollment. Web Server is RETAIN, on AD CS or a public CA for internet-facing names, with lifecycle automation through CyberArk Certificate Manager. The old guide had it as MIGRATE to Cloud PKI; web servers aren't Intune devices. Kerberos Authentication and LDAPS are BRIDGE until the last domain controller; the domain controller certificate from the Kerberos Authentication copy serves LDAPS. The older Domain Controller templates lack the KDC Authentication OID, so they're superseded by a Kerberos Authentication copy. RAS and IAS Server stays while NPS runs, renewed through CyberArk Certificate Manager. Exchange Signature Only migrates delivery. Exchange User carries two verdicts: MIGRATE for delivery, because Intune delivers it, and RETAIN for the issuer, because the existing CA and its key history stay. EFS retires, but the recovery agent retires last: keep its certificates and keys until no encrypted data remains.

Before any MIGRATE row moves, four things must be true, and they're wave 4's per-ring exit test. Every relying party trusts the new chain and can reach its CRL. The Intune profile issues at the program's success threshold. Certificates used against Active Directory carry a strong mapping. And the template's remaining certificates are on a dated path to expiry, with autoenrollment removed only after the profile is issuing. For BRIDGE rows, record the event that ends them, so retirement is scheduled rather than forgotten.

## Slide 29 — Renewal at scale, monitoring and drift

Migration ends on a date; certificates don't. Public TLS validity falls to forty-seven days from March 15, 2029. The schedule binds publicly trusted certificates, but the program aligns internal lifetimes with it as automation proves itself. The design rule: no certificate class may depend on a person remembering a date. The target has three renewal engines.

Intune profiles renew certificates on managed devices at the profile's renewal threshold, with a new key pair for SCEP. On Apple platforms, renewal happens only inside the threshold window with the device unlocked, and a failed renewal leaves the expired certificate in place without a retry. AD CS autoenrollment renews domain controller certificates, which also serve LDAPS, so the CA must stay online and its CRL current. And CyberArk Certificate Manager discovers, tracks and renews server TLS, including NPS and RADIUS servers, appliances, public TLS and network devices, with a Server Owner on every certificate.

Neither Microsoft issuer in the target offers ACME, so the program provides it through the lifecycle platform. CyberArk documents the http-01 and dns-01 challenges. One federal limit: win-acme requires FIPS mode to be disabled on the CyberArk server, so where FIPS mode is required, use another tested client.

The drift checks run at least weekly and are committed to the evidence repository, because an assessor asks how long a finding stayed open. Watch for certificates within two renewal windows of expiry with no engine bound, issuance outside policy, missing strong mapping, trust store anchors that aren't approved, stale CRLs, and posture regressions. And treat a SID mismatch as a security event: it can mean the certificate was issued to a different user. That's event 41 on current domain controllers, but event 49 on Server 2008 and 2008 R2, where 41 means no strong mapping.

## Slide 30 — Retire AD CS last, and hand the assessor the evidence

Last, retiring AD CS, which is the program's sixth wave. It applies only to the CAs and role services that no longer serve a retained class; domain controller, LDAPS and RADIUS certificates usually keep at least one issuing CA alive for as long as domain controllers exist. The gate: cutover complete, the thirty-day rollback window passed with no incidents, and every retained class running on the CAs that remain.

Confirm nothing depends on the CA, using the lifecycle inventory and the CA database. Stop new issuance: remove the templates, unlink autoenrollment, deny pending requests. Back up the database and key, with the backup and its password through separate channels. Revoke outstanding certificates for cessation of operation, set the CRL lifetime past the remaining certificates' lifetime, and publish. Remove NDES and the web services before the CA, and move any OCSP consumers to CRL checking. Clean up trust in Entra, Intune, Group Policy, NTAuth and the lifecycle platform. Keep the CDP and AIA endpoints serving until the last certificate expires, delete templates only after every CA in the forest is gone, and commit a decommission record. Under BYOCA, the root and any CA that signed the Cloud PKI issuing CA stay.

The assessor reads NIST SP 800-53 evidence: key storage and binding settings for IA-5 enhancement two, the trust store and CRL configuration for path validation, HSM key protection for SC-12, and the certificate policy and approved trust anchors for SC-17.

So, from Monday: harden first and gate on it, choose the root deliberately, issue strongly mapped certificates, run both PKIs with reachable CRLs, and retire AD CS last, with evidence. Chapters 03 through 08 and the appendices carry the detail. Thank you.
