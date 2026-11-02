# Building HR-Driven Identity, Chapter 05 — Certificate-Based Authentication Checks — narration script (practice copy)

## Slide 1 — Chapter 05: Certificate-Based Authentication Checks

Welcome back to Building HR-Driven Identity. This is Chapter 5: certificate-based authentication checks. A revoked card is only revoked if Entra can download the list that says so, in time, every time. So this chapter checks the configuration behind card sign-in as code. It starts from Learn's certificate revocation list page and the Graph resources that hold the trust store and the X.509 certificate method, and adds what they leave to you: a measurement of every CRL, and thirteen rules. We'll see why, what the code does, who runs it, two labs and the dangers.

## Slide 2 — Why this gate needs code

Why does this gate need code? The guide's Gate 5 ties the card's lifecycle to the person's: the card is issued from a joiner record and revoked from a leaver. But revocation only reaches sign-in through the CRL, and a CRL grows with every revocation. The day it crosses the limit is the day sign-in fails for every card from that CA. So the check runs every day. Per-user binding coverage is the validation kit's job; this chapter checks the tenant's settings, which that kit doesn't read.

## Slide 3 — Which cloud: the limit depends on it

Which cloud you're in changes the answer. For interactive sign-in, a CRL must stay under twenty megabytes in public Entra ID, which includes GCC, and forty-five in Azure US Government, which includes GCC High. Either way it must download within ten seconds. So the expected-configuration file holds both sets, and the check takes a cloud name with no default. Learn doesn't say which megabyte it means, so the configuration reads the decimal one, the stricter reading.

## Slide 4 — What Microsoft gives you

Learn's CRL page is Microsoft's procedure and its limits. Without a configured CRL, Entra doesn't check revocation for that CA. There's one endpoint per CA, and HTTP is recommended over HTTPS. A configured CRL that can't be downloaded fails sign-in for that CA's certificates, so Learn asks for highly available endpoints and for CRL validation enforced, with exemptions only while troubleshooting. Graph holds the configuration in three places: the PKI trust store, the X.509 certificate method, and the authentication strengths with the policies that use them.

## Slide 5 — What it leaves to you

What does Learn leave to you? The limits are prose, and nobody measures a CRL until sign-in fails, so the kit measures bytes and seconds and compares them with the cloud's limit. An unreachable endpoint becomes a finding, not a skip. A renewed CA with a new thumbprint would be silently missing, so each issuing CA is named by thumbprint. PIV could sign in as single-factor. An exemption could stay forever. And a phishing-resistant strength could exist that no enforced policy requires. Each row is pinned by a test.

## Slide 6 — cba_check.py: measure, then check

The code is one script with two commands. Measure takes a list of CRL URLs, downloads each once, and writes the bytes, the seconds and any error. A failed download is recorded, not raised, because the unreachable CRL is itself the finding. Run it from the internet-facing path Entra uses, not from inside the PKI's own network. Check reads the configuration export, the measurements and the expected file, and applies thirteen rules for one cloud. Five tests cover the chapter, and with the other chapters' tests, fifty-seven pass.

## Slide 7 — The check: CB-01 to CB-13

Here are the thirteen rules, each labeled with its source. Most come straight from Learn: a CA with no CRL, an endpoint that isn't HTTP, a CRL over the size limit or slower than ten seconds, the certificate method switched off, and CRL validation off or a CA exempted. Some are the program's own design: an early warning at eighty percent, a CRL nobody measured, a CA expiring within ninety days, and an issuing CA missing from the trust store. And two protect the strength: PIV mapped to multifactor, and an enforced phishing-resistant policy.

## Slide 8 — Three read permissions, and the root CA

The read needs three permissions, each the least-privileged for its call: one to read the public key infrastructure, one to read the authentication method policy, and one to read policies, for Conditional Access. The code reads the newer PKI trust store on purpose, because the older configuration's delegated read names only Global Administrator. One judgment call: a root CA with no CRL is a warning, not a finding, because a root that issues only CA certificates may publish none. Learn's prerequisite is wider, so Lab 2 confirms the root's revocation path.

## Slide 9 — The verified facts

The verified facts, all read on November first. The CRL limits are generally available: twenty and forty-five megabytes for interactive sign-in, a ten-second download, and larger service limits. Entra checks CRLs up to ten CAs toward the root. The trust store, the certificate method, the strengths and the Conditional Access policies are all in Graph version one point oh, with the permissions you just saw. The certificate method's bindings include the low-affinity principal name and email fields. And both features are available in Azure for US Government.

## Slide 10 — Where Learn says nothing, or differs

Four places where Learn says nothing or disagrees with itself, recorded so a later edit doesn't loosen the code. Learn never says which megabyte it means, so the code takes the stricter one; Learn also says it plans to remove the limits. The federation page still gives a single twenty-megabyte limit, so the code follows the CRL page and applies twenty to GCC either way. Learn wants a CRL on every CA, but the check only warns on a root. And Learn never says which way binding priority runs, so the check flags any low-affinity field.

## Slide 11 — What the check proves, and for whom

What does this prove federally? That every issuing CA is trusted with a CRL Entra can download in time, which supports acceptance of PIV credentials and public key-based authentication, IA-2 twelve and IA-5 two. That an enabled policy requires a phishing-resistant strength and PIV counts as multifactor, which the SCuBA baseline requires; keep those two rows beside the ScubaGear report. That a revoked card is refused, which is FIPS 201's termination of the card. And that the certificate counts at the assurance claimed.

## Slide 12 — Who builds, who runs the CAs, who keeps it

Who does what? Developers build the credential checks, and need to read Python. The PKI and credentialing engineers run the issuing CAs, so they own the list of CAs by thumbprint, the PIV policy OIDs, and endpoints that stay available. And the I S S O keeps the configuration export, the findings and every CRL measurement, dated. The reader app holds exactly the three read permissions, with a certificate or a managed identity. The code measures and compares; it never changes the configuration.

## Slide 13 — Lab 1: the read, and the measurement

Lab 1 runs on a laptop with no tenant. Step one lists the configuration read: five calls, under exactly three permissions. Step two measures the fixture CRLs. Two are read, with their sizes; the third file is missing, and that's recorded with its error rather than raised. Your times will differ. The check in the next step reads a different file, the fictional tenant's own measurements, where one CRL is eighteen and a half million bytes and took eleven point four seconds.

## Slide 14 — Lab 1: the fictional tenant, checked for GCC

Step three checks the fictional tenant for GCC, with its twenty-million-byte limit. Five findings and seven warnings, and the exit code is two. Read the story in the fixture. Issuing CA 2 was renewed, so the thumbprint the card program expects is gone from the trust store, and the renewed CA's CRL is large, slow and served over HTTPS. A legacy intermediate has no CRL at all. The mode rule maps the wrong OID, so PIV is single-factor. And the phishing-resistant policy is still report-only.

## Slide 15 — Lab 1: the same tenant for GCC High, and the tests

Step four runs the same tenant for GCC High, where the limit is forty-five million bytes. Now it's five findings and six warnings. The same eighteen and a half million bytes is under eighty percent of the larger limit, so the early warning drops away. But the eleven-second download is a finding in every cloud. That's why the cloud is a required argument. Step five runs the tests: fifty-seven pass. Then delete the output folder.

## Slide 16 — Lab 2: a test tenant, and a revoked card

Lab 2 uses a test tenant with certificate-based authentication set up for a test CA; the authors haven't run it. Register a reader app with a certificate and only the three permissions. Export the configuration and check its shape matches the fixture. Measure the real CRLs from outside the agency network. Run the check with your test PKI's thumbprints and policy OIDs, and your cloud. Then the real proof: revoke a test certificate, wait for the next CRL, and sign in. Entra should refuse it. Finally, back everything out.

## Slide 17 — Dangers, and the guard for each

The dangers, and the guard for each. A CRL that grows past the limit takes down every card from that CA, so the size rule and its early warning run every time. A slow or unreachable endpoint causes the same outage from the network side. A CA without a CRL lets revoked cards sign in. A renewed CA nobody added locks out new cards. A troubleshooting exemption that stays turns revocation off. PIV mapped as single-factor means the card isn't what meets MFA. And a report-only policy is a requirement only on paper.

## Slide 18 — Done when: the CBA checklist

Here's what done looks like. The expected file names every issuing CA by thumbprint and every PIV policy OID, with the limits for your cloud. Every CRL was measured from outside the network within the last day, none near the limit or slower than ten seconds. The check shows no finding, and every exemption has a ticket and an end date. An enabled policy requires a phishing-resistant strength. A revoked test card was refused, with the evidence filed. Next, Chapter 6: separation timing from the logs. Thanks for watching.
