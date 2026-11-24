# Verification — Guide: Non-Person Identity: Zero Trust, SASE and Other Clouds

New page, November 24, 2026. Mike asked to "Evaluate the Impact on SASE and Zero Trust of any SA / MSA compared to EntraID for SQL, IIS and etc.", to "Examine current content", to "Make this easy to find as part of the Non-Person ID", to "ensure knowledge linking Cert Requirement mapping for SA / MSA with SPN to EntraID", and to "explain for other CSPs. Look into AWS IAM for RHEL and if Agencies are best to expand EntraID." He chose a new Non-Person Identity page, applying WD-027's NTLM backstop to service accounts, and fixing Book 02, Chapter 09 to match the decision path.

## What the search of current content found (origin/main, November 24, 2026)

- No page weighed the Zero Trust or SASE impact of keeping a service account against moving it to Entra. Book 06, Chapter 02 does it for people connecting to SQL Server; Book 01, Chapter 08 says what replaces what without assessing it.
- Application proxy and Private Access with Kerberos constrained delegation are covered in Book 01 (Chapters 07 and 08), Book 18 (Chapter 03), Book 06 (Chapter 18 and R08) and Book 09 (Chapter 06), and the domain controller sensor in the Global Secure Access guide, Step 10. None linked to the Non-Person Identity track, and none linked back.
- Conflicts raised with Mike before writing: Book 06's NTLM backstop (WD-027) wasn't stated for service accounts; Book 02, Chapter 09's first table sent a traditional account to an app registration or managed identity while its second table sent a Kerberos-only one to a dMSA or gMSA. Both settled as above.
- Already reconciled, not changed: certificate lifetime (Book 02's "annual" against Book 04's and Book 13's 180 days for app registrations; this page uses 180 days); the Kerberos island as minimal AD (Book 01) against Entra Domain Services (Book 06, Class 4), which Book 01 already notes.

## Claims and sources

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| ZS-01 | An identity covers non-person entities; the Identity pillar's Authentication, Identity stores, Risk assessments and Access management stages as quoted | Scorecard; Extend Entra | supported by the source | CISA, ZTMM v2.0, section 5.1 and Table 2 (PDF read November 24, 2026; the HTML landing page is marked archived) |
| ZS-02 | Conditional Access for workload identities: single-tenant service principals; managed identities not covered; workload identities can't perform MFA | In brief; Scorecard | supported by the source | Learn, "Conditional Access for workload identities" |
| ZS-03 | Application proxy KCD: the connector impersonates the user; domain-joined connector and app server; the SPN in the delegation list; the app server runs under `webserviceaccount`, a user or computer account. Learn's page doesn't mention gMSAs | SASE | supported by the source | Learn, "Kerberos Constrained Delegation for SSO with application proxy"; "Use Kerberos for SSO with Private Access" |
| ZS-04 | Private Access for domain controllers: synchronized users; phishing-resistant CA; sensor in audit mode by default; direct access to a protected SPN blocked without the client. Learn doesn't say whether service accounts are covered | SASE | supported by the source; service-account coverage not stated | Learn, "Configure Private Access for AD domain controllers" |
| ZS-05 | The Global Secure Access client controls traffic at the end-user device; Learn doesn't address server-side workload traffic | SASE | supported by the source; "not in the SASE path" is the program's reading | Learn, "Learn about the Global Secure Access clients" |
| ZS-06 | SQL Server Entra authentication supports non-interactive mechanisms including managed identities | Workloads | supported by the source | Learn, SQL Server Entra authentication overview |
| ZS-07 | RHEL: SSSD and realmd recommended for AD; Red Hat's "Managed Service Account" is an AD account for a computer, made with `adcli create-msa`, with a keytab | Workloads; Linux | supported by the source | Red Hat, RHEL 9, *Integrating RHEL systems directly with Windows Active Directory*, chapters 1 and 5 |
| ZS-08 | Entra sign-in for SSH on Azure Linux VMs and Arc-enabled Linux servers; RHEL 7.4–7.9, 8.3+, 9.0+, 10.1 | Linux; Extend Entra | supported by the source | Learn, "Sign in to a Linux VM in Azure by using Microsoft Entra ID and OpenSSH" |
| ZS-09 | NTLM "is still supported"; Kerberos "is the preferred authentication method" | NTLM | supported by the source | Learn, "NTLM overview in Windows Server" |
| ZS-10 | M-22-09: "Agencies must employ centralized identity management systems for agency users …" | Extend Entra | supported by the source; it doesn't address workloads | OMB M-22-09, section III.A (PDF read November 24, 2026) |
| ZS-11 | IAM Identity Center in GovCloud connects an existing identity provider; FIPS endpoints; `aws-us-gov` ARNs | Extend Entra | supported by the source | AWS, "AWS IAM Identity Center in AWS GovCloud (US)" |
| ZS-12 | Oracle documents SSO and identity lifecycle management between OCI IAM and Entra ID, for tenancies with identity domains | Extend Entra | supported by the source | Oracle, "SSO Between OCI and Microsoft Entra ID" |
| ZS-13 | Where each kind of service identity lands on the ZTMM stages; "SASE protects the people in front of a service"; extend Entra for people, native workload identities with one governance record | Scorecard; SASE; Extend Entra | design guidance | The sources above; WD-171 |
| ZS-14 | The certificate map | Certificate map | supported by the linked pages (Book 06, Chapters 09 and 22; the hybrid credentials explainer; Book 07, Chapter 06; Book 13, Chapter 14; WD-171) | Those pages |

## Not verified

- Whether a gMSA can be the application server account behind application proxy KCD (Learn names user and computer accounts only).
- Whether the Private Access domain controller sensor evaluates service accounts' Kerberos requests.
- Arc onboarding and Entra SSH sign-in for RHEL instances in AWS GovCloud (US) and OCI OC2 specifically.
