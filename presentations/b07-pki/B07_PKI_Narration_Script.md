# Book 07 — PKI & Certificates — narration script (practice copy)

## Slide 1 — Why Do Certificates Outlive Every Migration?

This briefing comes from Book 07 of the Federal Modernization Workbook, PKI and Certificates: the move from Active Directory Certificate Services to Microsoft Cloud PKI, Entra certificate-based authentication and the Federal PKI.

Every other migration changes which system answers the question "who is this?" Certificates are how that answer gets proved. I'll cover why certificates outlive every migration, what the target PKI is, who owns the certificate estate, and how to move it without stranding a single certificate.

## Slide 2 — Certificates fail at expiry, not at cutover

Why do certificates outlive every migration? Because a certificate isn't a record in a directory. It's a signed statement that's already been handed out: the holder of this private key is entitled to this name. When the directory moves, the certificate doesn't. It keeps working until it expires, and then whatever relied on it stops.

A great deal relies on it. Domain controllers need KDC certificates and LDAPS. Smart card and PIV logon need the issuing CA in the forest's NTAuth store and a certificate on every domain controller. 802.1X and VPN need NPS and device certificates. TLS listeners, including SQL Server, need them, and so do code signing and encryption keys.

That gives the program two clocks. On the directory's clock, cutover is declared complete and the first expiry wave finds no issuer, months later, far from its cause. On the certificate's clock, the replacement issuer is live before the first expiry, and AD CS retires last.

So the estate outlives the directory twice over: issued certificates run until they expire, and the forest needs an issuer until its last domain controller retires.

## Slide 3 — The rules are moving under certificates already issued

A certificate estate used to be something you could leave alone between renewals. Three changes have ended that.

First, public TLS lifetimes are shrinking on a fixed schedule. Under the CA/Browser Forum's ballot SC-081v3, adopted in April 2025, the maximum validity fell from 398 days to 200 days on March 15, 2026. It drops to 100 days on March 15, 2027, and to 47 days on March 15, 2029. On the book's arithmetic, a thousand certificates means about seven renewals every working day now, and about thirty-one at 47 days.

Second, mapping rules changed under certificates already in use. Under KB5014754, domain controllers moved to Full Enforcement on February 11, 2025, with no way back after the September 9, 2025 update.

Third, the algorithms have a horizon. NIST's draft transition plan would deprecate RSA-2048 after 2030 and disallow RSA and ECDSA signatures after 2035.

So manual lifecycle management can't keep up, and the move off AD CS runs as its own program.

## Slide 4 — What AD CS holds up, and the four verdicts

What does AD CS hold up today? It isn't one server. It's a hierarchy, usually an offline root and enterprise issuing CAs; a set of forest-wide objects in the Public Key Services container, including the templates and the NTAuth store; and Group Policy autoenrollment, which runs on domain members every eight hours.

The inventory has four layers: the CAs, the templates, the certificates actually issued, and the relying parties. The relying parties set the order of work, because a new issuer is useful only once everything that validates its certificates trusts it.

Then every template and use case gets one of four verdicts. MIGRATE, where Cloud PKI or Entra certificate-based authentication replaces it. BRIDGE, where both issuers run because the consumer depends on AD or a server: domain controllers, LDAPS, NPS. RETAIN, where there's no cloud equivalent, like HSM-held code signing. And RETIRE, where the consumer is going away.

The book corrects its source here: internal web and SQL Server TLS can't move to Cloud PKI, and S/MIME stays BRIDGE because its key history has to survive.

## Slide 5 — Harden what stays before anything moves

AD CS keeps issuing trusted credentials while the migration runs, so the CA you're leaving has to be the best-defended system you own until it's gone. The book frames hardening strictly as a detect-and-fix checklist.

The eight classes carry the ESC labels that Microsoft Defender for Identity also uses: requester-supplied subjects on authentication templates; Any Purpose or no-EKU templates; open enrollment agent templates; writable template permissions; writable Public Key Services objects such as NTAuth; the CA-wide flag that lets any request supply a subject alternative name; unprivileged CA permissions; and web enrollment without HTTPS and Extended Protection.

Defender for Identity detects most of them, and the CA-level checks need its sensor on the CA. The fifth class has no assessment, so it's a manual review backed by directory-change event 5136. The ratings are the program's own scoring.

The gate is simple: every Critical and High finding is fixed and verified before any workload migrates, because the recommended cloud issuer chains to this hierarchy. And none of it has evidence until CA auditing is on, which takes two settings together.

## Slide 6 — Four issuers, each for what only it can serve

So what is the target? Not Cloud PKI instead of AD CS. That's true for devices and wrong for the estate. The target is four issuers, each for the subjects only it can serve.

Microsoft Cloud PKI issues to Intune-managed devices, and only to them, through SCEP, with three CAs per tenant, a CRL valid for seven days and no OCSP responder. A smaller, hardened AD CS stays for domain controllers and LDAPS, NPS and RADIUS, internal server TLS, network devices through NDES, and HSM-held code signing. The Federal PKI keeps issuing PIV; the target's job is to trust it, by distributing the federal root and uploading the chain to Entra ID. And a public CA serves names the internet must trust.

One decision ties them together: the root. For an established hierarchy, the program recommends bring-your-own-CA, a Cloud PKI issuing CA signed by the offline root. It keeps the existing chain, and makes the root's CRL a production dependency.

Check the entitlement too. The July 2026 change that puts Cloud PKI in Microsoft 365 E5 and E7 covers commercial customers, so confirm it for a government tenant.

## Slide 7 — One lifecycle platform: CyberArk Certificate Manager

Four issuers need one lifecycle platform. Intune and Cloud PKI renew what they put on managed devices. Nothing Microsoft-native does that for AD CS server certificates, public TLS, appliances, or certificates nobody inventoried. That's the job of certificate lifecycle management: discovery, ownership and automated renewal across issuers.

The program's platform is CyberArk Certificate Manager, now part of Palo Alto Networks. It's the program's existing vendor, so the program consolidates there and adds no second lifecycle vendor. The names have moved: Venafi became part of CyberArk in October 2024, Palo Alto Networks completed its acquisition of CyberArk on February 11, 2026, and the SaaS edition is now sold as Next-Generation Trust Security.

Two facts shape the deployment. The FedRAMP Marketplace has no listing for the certificate product, so the program runs Certificate Manager, Self-Hosted inside its own authorization boundary. And its AD CS account holds the certificate-manager permission, so it's scoped and reviewed like any other certificate manager.

## Slide 8 — Who decides, who does the work for certificates

Who owns the certificate estate? In most forests, whoever installed the CA. Domain Admins and Enterprise Admins are CA administrators by default, and nobody decided that.

The book separates deciding from doing. The sponsor and CIO decide the target hierarchy, when each AD CS component retires, and who owns renewal for each certificate class. The CISO and ISSO decide issuance policy, trust anchors and the minimum binding strength. The authorizing official accepts standing exceptions, such as a low-affinity binding.

PKI and CA administrators run the CAs, templates, CRLs and key ceremonies. The identity team owns the Entra trust store and bindings, endpoint engineering owns the Intune profiles, and the CLM platform owner runs discovery and server renewal. Server, network and application owners, the PIV office and security operations are consulted.

The principle is separation of duties. Whoever can change a CA must never be the only person who decides what it issues. And whoever administers directory sync can change which account a certificate signs in as.

## Slide 9 — Intune delivers the certificate, strongly mapped

How. Start with devices. Intune delivers certificates by three paths, and each needs the trusted certificate profile deployed first.

SCEP from Cloud PKI is the cleanest: the device makes its own key pair, with no NDES server, connector or on-premises CA. SCEP from AD CS runs through NDES and the Certificate Connector; its template lets the request supply the subject, so its Enroll permission stays limited to the NDES account. PKCS makes the key on the connector server and exports it, which is why the program prefers SCEP.

Strong mapping is no longer optional. KB5014754 began in compatibility mode in May 2022. Domain controllers moved to Full Enforcement on February 11, 2025, and since the September 9, 2025 update the registry key is ignored, so there's no way back. A certificate used against a domain controller without a strong mapping is rejected now.

So SCEP profiles add the on-premises security identifier as a SAN URI, for user certificates on every platform and device certificates on hybrid-joined Windows. Pilot it in a new profile, because editing one revokes what it issued.

## Slide 10 — Entra CBA validates certificates; it issues none

On the user side, Entra certificate-based authentication is a relying party. It validates certificates and issues none, so its risk is the opposite: a certificate that should fail might pass.

Trust and revocation first. Upload every CA in the chain to the PKI-based trust store. Each CA gets one HTTP CRL, which Entra ID must download within ten seconds or the sign-in fails. There's no OCSP and no LDAP. Turn on Require CRL validation, because a CA uploaded without a CRL lets revoked certificates keep working.

Then binding. Issuer and serial number, subject key identifier and public-key hash are high affinity. Principal name, email, subject, and issuer plus subject are low; the old guide called issuer plus subject high. A certificate counts as multifactor only when a PIN or biometric protects it: a PIV card, not a software certificate. And staged rollout is a temporary test, limited to ten groups.

Production requires high affinity, because CBA is only as strong as its weakest binding. But switch only once every user's certificate user IDs are right, or those users are locked out.

## Slide 11 — Run both PKIs, then migrate in six gated waves

For most of the migration, both PKIs are production. Devices carry certificates from both issuers, and relying parties trust both chains.

Three coexistence rules carry the weight. Trust goes up before issuance moves. Nothing is revoked to force a move; old certificates leave at renewal. And every CRL must be reachable from inside the network, from the internet and from Entra ID, because most coexistence outages are revocation outages.

The migration runs in six gated waves, about forty-four weeks on the program's planning figures for a single forest. Assess ends when every template is classified and Critical and High findings are fixed. Foundation puts the cloud CA live, with trust on ninety-nine percent of devices. Pilot needs ninety-five percent issuance success. Scale moves every managed device. Cutover converts federated domains and turns off AD FS certificate authentication. And Decommission retires what served only migrated workloads.

Every wave has a rehearsed rollback. Autoenrollment stays on through the pilot, and AD FS stays restorable for thirty days after cutover, with a four-hour recovery objective.

## Slide 12 — Keep it renewed and checkable, then retire AD CS last

Migration ends on a date; certificates don't. With public TLS at 200 days today and 47 days from March 2029, no certificate class may depend on someone remembering a date.

Three renewal engines cover the target. Intune profiles renew managed devices at the profile's threshold, with a new key pair. AD CS autoenrollment renews domain controllers, LDAPS and RADIUS while the forest stays. And CyberArk Certificate Manager renews server, appliance and public TLS, using ACME where the endpoint supports it.

Monitoring watches signals, not outages: expiry with no renewal path, a stale CRL, issuance outside policy, trust-store drift. The checks run at least weekly, and their history is the evidence.

Retiring an AD CS CA comes last. Confirm nothing depends on it. Stop issuance, and back up the database and key. Revoke what's left for cessation of operation and publish a final CRL. Remove the role services and clean every trust store. And keep the CRL and AIA endpoints serving until the last certificate expires. Under bring-your-own-CA, the CA that signed the cloud issuer stays.

## Slide 13 — Decisions to make, and next steps

So, four decisions.

Confirm the root decision: bring-your-own-CA, signed by the offline root, once the hierarchy has passed the hardening gate.

Settle the Cloud PKI entitlement for the government tenant, rather than assuming the commercial E5 change applies.

Stand up CyberArk Certificate Manager, Self-Hosted, inside the authorization boundary, as the single lifecycle tool.

And name the owners: issuance policy and trust anchors with the CISO, and one renewal owner for every certificate class.

The next step is wave one, Assess: four weeks to inventory every CA and template, close the Critical and High findings, classify every use case, and list every relying party.

Run certificates on their own clock, and the old CAs can retire without stranding anything. The Federal Modernization Workbook's Book 07 has the detail, every claim footnoted, with deployment checklists and a template-by-template matrix. Thank you.
