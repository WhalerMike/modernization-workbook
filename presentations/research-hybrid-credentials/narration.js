// Spoken narration for the hybrid credentials explainer, one entry per narrated slide, keyed by title.
// This is what the voice says: the slide's intent and its one or two highpoints, in plain language, with a
// lead-in to the next slide. The full detail stays in each slide's notes as the "Detail:" block, which
// narrate.py never speaks.
module.exports = {
"Certificates, Tokens and Keys Across the Hybrid Estate":
`Welcome. This is a research explainer from the Federal Modernization Workbook, and it answers a question that comes up in every Active Directory retirement: when AD goes, what happens to all the certificates, tokens and keys it quietly looked after? We'll follow four paths: SQL Server signing in with Entra ID, the clouds' own key vaults, the PIV card, and the network's RADIUS and 802.1X. For each one we'll look at today, the years of coexistence, and life after AD, and then put it all on one page: who issues each credential, and who renews it. The slides and notes carry the detail and the sources.`,

"What AD does for credentials today":
`Start with what AD actually does, because most of it is invisible. It trusts the PIV card's issuer and maps each card to an account. It hands out Kerberos tickets, so SQL Server never has to think about tokens. It autoenrolls certificates for domain controllers and servers. And through NPS, it answers the network when a laptop plugs in. Each of those jobs needs a new owner, and the right-hand column shows who takes each one. Some answers are obvious. Others, like RADIUS, surprise people. Let's go through them in order.`,

"Three stages, five paths":
`Here's how the explainer is laid out. Every path is shown at three stages. Today, with AD at the center. Coexistence, which is the long middle, when AD and the cloud run side by side and both have to work. And after AD, when the last domain controller is gone. The four paths are SQL Server, the cloud key vaults, PIV, and network access. The fifth part is the summary table. One rule runs through all of it: every credential has exactly one renewer, and we write down who that is. First, SQL Server.`,

"SQL Server: one server, three credentials":
`SQL Server can now accept Entra ID tokens on premises, through Azure Arc, instead of Kerberos. That sounds like it removes certificates. It doesn't. Around one SQL Server there are three different credentials, with three different owners. The TLS certificate, which CyberArk Certificate Manager renews. On SQL Server 2022, an app-registration certificate that lives in Key Vault. And on SQL Server 2025, a managed identity that the Arc agent looks after, with no certificate to manage at all. The next slide explains why the TLS certificate suddenly matters more than it used to.`,

"SQL Server: the TLS certificate becomes mandatory":
`Here's the catch. Every connection authenticated by Entra ID is encrypted. If the server only has its own self-signed certificate, clients have to be told to trust it blindly, which gives up checking who the server is. So the day Entra logins start, every instance needs a real, CA-issued certificate. The CLM installs and renews it. There's one technical trap to test first: SQL Server only accepts a certificate whose key was made the older way, and CyberArk's driver documentation doesn't say which way it makes keys. Prove it in the lab. And on 2022, the app certificate can rotate itself, if you set it up as service-managed.`,

"SQL Server across the three stages":
`Put the stages side by side and the direction is clear. Today, Windows authentication, and TLS is optional. During coexistence, Windows and Entra logins run together, TLS becomes mandatory, and SQL Server 2022 carries an app certificate in Key Vault. After AD, it's Entra logins only, applications use managed identities, and the TLS certificate comes from the standalone CA under the same root. The program's advice is simple: move to SQL Server 2025, so one whole certificate disappears. Next, the clouds' key vaults.`,

"The clouds' key vaults: one renewer per certificate":
`Every cloud has its own certificate service, and each one can issue and renew certificates by itself. Azure has Key Vault, AWS has Certificate Manager, and Google has its own. Nobody coordinates them unless the program does. So the rule is: for each certificate, decide one renewer, and record it in the CLM. Either the CLM issues it and pushes it into the cloud, or the cloud issues it and the CLM just watches. And notice the red band. Keys and secrets are a different job. They stay with each cloud's own key and secret services. The CLM manages certificates, not secrets.`,

"Azure, AWS and Google: who renews what":
`The details differ a little by cloud. Key Vault only renews by itself for its two partner CAs and for self-signed certificates, so a certificate from the program's own CA comes from the CLM, and the good news is that the CLM's Key Vault driver supports Azure Government. In AWS, Certificate Manager renews what it issues, but never what you import, so imported certificates belong to the CLM. Google is similar. One thing to confirm with CyberArk in writing: its AWS driver pages don't mention GovCloud. Now, the PIV card.`,

"PIV: the card stays, AD's side goes":
`The PIV card is the credential that changes least. The card, the Federal PKI issuer behind it, and the card management system all stay exactly as they are. What changes is the system that checks the card. Today that's AD: the domain controllers, the NTAuth store that trusts the issuer, and the mapping from card to account. All of that, shown in red, ends with AD. On the right is what replaces it: Entra certificate-based authentication, an attribute called certificate user IDs that binds the card to the person, and Conditional Access. Let's take the stages one at a time.`,

"PIV today: strong mapping for non-Microsoft CAs":
`Today, there's a deadline that already passed. Since September 2025, domain controllers refuse a certificate that isn't strongly mapped to its account. Microsoft's easy fix, a security identifier stamped inside the certificate, only works for certificates from Microsoft's own CA. PIV certificates come from the Federal PKI, so they need a different route. One is an explicit mapping on each account, which IDManagement dot gov recommends. The other is a government-specific policy Microsoft added, which trusts name-based mappings from named federal issuers. The books now cover both. Next, the coexistence years.`,

"PIV in coexistence: Entra CBA and certificateUserIds":
`During coexistence, Entra ID learns to check the card itself. You load the PIV issuers into its trust store, give it a revocation list it can reach over HTTP, and users can sign in to Windows with their card on Entra-joined devices. The binding between card and person lives in certificate user IDs, and for synced users only Entra Connect can write it. There's one tension worth naming: the federal guide suggests a looser binding, while Microsoft says use only the strict kind. The program uses the strict kind, tied to one specific certificate. So what happens when sync goes away?`,

"PIV after AD: who writes the binding":
`After AD, there's no sync to carry the binding, so it has to be written in the cloud. The program's design is that the card management system writes it, at the moment a card is issued, through Microsoft Graph. That's the only moment anyone knows the new certificate's serial number before it's first used. HR can't do this job: HR knows the person, not the certificate. Microsoft doesn't document this pattern, so it's design guidance, and it needs proving in a pilot. Windows Hello stays the backup for when a card isn't practical. Now, the one that surprises people: RADIUS.`,

"RADIUS: there is no Entra RADIUS":
`When a laptop plugs into a switch, the switch asks a RADIUS server whether to let it on. Today that's usually NPS, and NPS checks with AD, so it ends with AD. People expect Microsoft to offer a RADIUS service in Entra ID. It doesn't. So there are four choices. Keep NPS as a bridge. Move to a network access control platform that checks Intune, which is the program's default. A cloud RADIUS service, except none is FedRAMP-authorized yet. Or, for remote users, Global Secure Access, which replaces the VPN, but not the switch on the campus network.`,

"802.1X with Intune: EAP-TLS and compliance":
`Here's how the default works. The device gets a certificate from Intune with its Intune device ID inside. It presents that certificate to the switch. The switch passes it to the access control platform, Cisco ISE or Aruba ClearPass, which asks Intune: is this device compliant? Then it tells the switch to let it on, restrict it, or block it. Two things to watch. ISE needs a recent patch, or these certificates fail. And the platform's own server certificate isn't Intune's, so the CLM renews it. Today's NPS also hides a certificate of its own that nobody tracked.`,

"RADIUS and NAC across the three stages":
`Across the stages, the network story is a handover. Today, NPS against AD, plus a VPN that relies on it. During coexistence, Intune devices move to the access control platform while older hybrid devices still go through NPS. After AD, the platform handles the campus network, and Global Secure Access or a federated VPN handles remote users. Device certificates come from Intune throughout, and the server certificates come from the CLM. Now let's put all four paths on one page.`,

"Who issues and who renews: the whole estate":
`This is the page to keep. Each row is a credential, each column a stage, and each cell says who issues it and who renews it. Read it for three patterns. The PIV row barely changes. The domain controller and NPS rows simply end. And the CLM's rows stay steady while the CA behind them moves from the retained AD CS to the standalone one. Wherever two systems could renew the same certificate, the program picks one, and writes it down.`,

"What changed in the books, and next steps":
`Finally, this research changed the books in five places: the SQL Server and application chapters on how certificates rotate and who renews them, Book 07 on federal smart card mapping, and Book 09 on the forgotten NPS certificate and the access control server's certificate. The next steps are tests, not more reading: prove the SQL key type, prove the card system can write the binding, and get CyberArk's answer on GovCloud. This is the program's research, under review, and not an endorsement by any federal agency. Thanks for watching.`,
};
