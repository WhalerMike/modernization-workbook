# Data Platform and SQL Server Identity learning path — Module 8: AD CS Dependencies — narration script (practice copy)

## Slide 1 — Module 8: AD CS Dependencies

Welcome to Module 8 of the Data Platform and SQL Server Identity learning path: A D C S dependencies. It goes with Runbook R ten and Chapter 08 of the developer workbook, Building SQL Server Identity. You'll list every certificate sequel server depends on, by class, issuer and expiry, before anyone dates a change to the certificate authority. Take this module after Module 7.

## Slide 2 — Why the certificates nobody sees come first

Why does this matter? Sequel server depends on certificates that most teams planning an A D C S decommission never see. The T L S certificate the engine presents. The certificates behind certificate-mapped logins and endpoints. And the domain controller certificates that certificate-based sign-in needs. The book P K I and Certificates owns the decision about which issuer serves which certificate. This module doesn't restate that decision; it feeds it. Before any certificate authority's date is set, you hand the P K I owner a list of every certificate sequel server depends on, with its class, issuer, expiry and the action each one needs.

## Slide 3 — What you'll be able to do in Module 8

Here's what you'll be able to do by the end of this module, which takes about forty minutes with the lab. You'll name the three places sequel server can depend on certificates that A D C S issued, and the issuer that P K I and Certificates assigns to each. You'll explain why an expiring T L S certificate breaks clients, while an expiring signing certificate doesn't lock anyone out. You'll run the kit's certificate dependency list over fixtures and read its class, issuer, expiry and action for each row. And you'll say why certificate-mapped, type C, logins aren't migrated to Entra logins. Before you start, finish Module 7. And remember from Module 6: an endpoint that authenticates with NTLM or negotiate is also an NTLM source. The lab runs in PowerShell 7, in the kit you unzipped into the F M W Labs folder.

## Slide 4 — Three places SQL Server touches AD CS

Unit 2 is the three places. The data platform book's chapter on where sequel server touches A D C S names three dependencies. First, the T L S certificate, which encrypts client connections. Entra-authenticated connections are always encrypted, so the Entra target depends on it more, not less. Second, certificate-mapped type C logins. They carry permissions for signed modules and can't be used to connect, and certificates of the same kind secure Service Broker and mirroring endpoints. So treating type C logins as connection logins, and moving them to Entra logins, is effort they never needed. Third, certificate-based sign-in. It's the program's interim posture for connections that can't reach Entra authentication but can negotiate Kerberos. And it usually depends on A D C S through the domain controllers' certificates, rather than through the piv card.

## Slide 5 — What Microsoft gives you: expiry differs by class

Here's what Microsoft Learn gives you. A sequel server T L S certificate needs the Server Authentication enhanced key usage, a key spec of key exchange from a legacy provider, and every client name in the subject alternative name. A certificate from a Key Storage Provider gives a key spec of zero, which sequel server can't use. Sequel server checks the certificate's validity only when it's configured, but clients that validate the certificate fail on an expired one. Signing certificates are different. A certificate-mapped login shows as type C, used only for code signing, and the built-in signing functions don't check expiry, though Service Broker and backup encryption do. So an expiring T L S certificate breaks clients, and an expiring signing certificate doesn't lock anyone out. One more fact: Microsoft Cloud P K I issues only to devices enrolled in Intune, which excludes Windows Server.

## Slide 6 — The issuer decision, and the class on every row

Unit 3 is the issuer decision and the order. P K I and Certificates gives each class of certificate one issuer and one renewal engine. Sequel server's T L S certificate comes from the retained A D C S hierarchy, requested and renewed through the C L M platform. Its deadline is the issuing C A it chains to being retired, not A D C S as a whole. A certificate-mapped login or endpoint isn't renewed by the platform, so it's replaced or re-mapped by hand before its C A is retired. Domain controller certificates stay on A D C S autoenrollment until the last domain controller retires, so the interim posture keeps what it depends on. The kit turns each certificate's use into a class and an action. It marks it yes when its issuer is one of your enterprise C As, a list the P K I owner supplies, and it warns inside a ninety-day window.

## Slide 7 — Dangers, and the guard against each

Chapter 08 of the workbook names the dangers, and the guard against each. If the T L S certificate expires after its C A goes, clients that validate refuse to connect, and every Entra connection validates. The guard is the class and window on every row, with the lifecycle platform renewing it from the retained A D C S hierarchy before its issuing C A is retired. An empty registry value read as no certificate hides a store certificate or a self-generated one; Lab 2's second step and R ten's error-log check find it. A replacement certificate from a Key Storage Provider has a key spec of zero, which sequel server can't use, so check the key spec before renewal. Type C logins treated as connection logins waste effort, because they sign code. And an issuer missing from the enterprise C A list makes an A D C S certificate read no, so the P K I owner supplies that list.

## Slide 8 — Try it: list the certificates

Try it. Lab 1 runs in PowerShell 7 on the kit's fictional certificate inventory, with no tenant. Go to the kit's folder and make this run's results folder, named for the time you start, in U T C. Step one lists the certificates. Four of the five came from the fictional enterprise C A, and two expire inside ninety days. The SQL P R D oh one T L S row matters most: in seventy-two days every client that validates the certificate refuses to connect, and Entra connections always validate. The SQL P R D oh two login row expires sooner, in forty-one days, but signing doesn't check expiry. The reason to replace it is its issuer. The last line counts the rows an enterprise A D C S C A issued: four of five, each needing its action before that C A is retired.

## Slide 9 — Try it: read the action for each certificate

Step two reads the action for each certificate. The SQL P R D oh one T L S certificate stays on the retained A D C S, issued through the C L M platform; move it before its C A is retired. The SQL P R D oh six T L S certificate isn't from A D C S at all, so it's tracked in the certificate lifecycle platform. The certificate-mapped login and endpoint on SQL P R D oh two aren't renewed by the C L M platform, so they're replaced or re-mapped before the C A is retired. And the certificate-based sign-in on SQL F C I oh four also depends on the domain controllers' certificates, so it's retired with the NTLM interim posture.

## Slide 10 — Try it: widen the warning window

Step three widens the window. The ninety days is a default in the kit's thresholds file, and a parameter changes it for one run. With a window of three hundred sixty-five days, four of the five certificates warn. Only SQL P R D oh six's T L S certificate, with four hundred eighty-one days left, stays quiet.

## Slide 11 — Try it: the manifest, the tests and your runs

Step four opens the manifest: the step, its mode, read-only, its controls, S C eight, S C twelve and S C seventeen, its two K S Is, and the S H A two fifty-six of each file. Step five runs this chapter's tests: three pass, none fail. And step six lists your runs. There's nothing to clean up: the kit's folder is as you unzipped it, and each run's results stay in their own folder.

## Slide 12 — Lab 2: R10's reads on your test instance

Lab 2 runs Runbook R ten's reads on one test instance and its host, never production. It was not run by the authors. Every step reads: nothing is issued, bound, changed or restarted. Sign in as a test reader whose login holds the view-state and view-definition permissions the page lists, never sysadmin. Read the configured T L S thumbprint, the host's certificates, the certificate-mapped logins and the endpoints. An empty thumbprint means sequel server picked a certificate itself. Save the reads by hand in the fixture's shape, and run the dependency list on them. Then delete the lab folder, or keep the saved reads inside your boundary as R ten's evidence.

## Slide 13 — The federal requirement and the evidence the ISSO keeps

The federal requirement. Chapter 08 of the workbook maps the dependency list and Runbook R ten's reads to S C eight, S C twelve and S C seventeen in NIST SP 800-53. The list supports S C eight, because the certificate that protects connections is known and dated; S C twelve, key and certificate lifecycle; and S C seventeen, which P K I issued each certificate. R ten notes that S C eight and its enhancement one are in the moderate baseline, and that every Microsoft Entra-authenticated connection to sequel server needs encryption. The I S S O keeps the certificates file and the manifest per instance, and the saved reads with the date and the reader. K S Is are FedRAMP twenty X indicators for cloud service providers; your providers report against them, the agency doesn't. The list supports these controls; the assessor decides whether each one is in place.

## Slide 14 — Check yourself: two questions on certificates

Check yourself with two questions. First: the certificate behind SQL P R D oh two's certificate-mapped login expires in forty-one days. Why replace it? The answer is a: because of its issuer. Signing doesn't check expiry, but the certificate came from the enterprise C A that will be retired. Second: the run ends with blocking an A D C S decommission, four of five. What does it count? The answer is b: the rows an enterprise A D C S C A issued, each needing its action before that C A is retired. The module page has two more questions, each linked to the section that answers it.

## Slide 15 — Summary: the list goes to the PKI owners first

To sum up. You listed the certificates sequel server depends on, by class, issuer and expiry, and read the action each class needs before its issuing C A is retired. The list goes to the owners of P K I and Certificates before any C A date is set; the issuer decision stays theirs. The I S S O keeps the certificates file and the manifest per instance, and Runbook R ten's saved reads with the date and the reader. Before shipping, work through the Chapter 08 checklist. Next is Module 9: closure, drift and evidence.
