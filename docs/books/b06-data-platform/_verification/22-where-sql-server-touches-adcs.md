# Verification — Chapter 22, Where SQL Server Touches AD CS

Sources: the existing page `22-where-sql-server-touches-adcs.md` (former narrative Book 10, Chapter 1) and the archived front page `docs/case-studies/sql-server-narrative/Book_10.md`. PKI facts kept consistent with Book 02 Chapter 04 (Cloud PKI, Entra CBA as relying party) and Book 03 Chapter 09 (PIV issued under Federal PKI Common Policy; Cloud PKI in GCC High not DoD). All sources accessed Oct 20, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | AD CS → Cloud PKI is "Not Yet Defined"; no ADR | Intro | restated-as-design (program inventory) | — |
| 2 | SQL Server presents a server certificate in the TLS handshake when encrypting | TLS | verified | Learn, Encrypt connections by importing a certificate |
| 3 | "TLS ... required under this program's FedRAMP Moderate posture" | TLS | corrected: the agency's own system is assessed by its AO against the SP 800-53B Moderate baseline, where SC-8 and SC-8(1) apply; FedRAMP doesn't authorize the agency's system | NIST SP 800-53 Rev. 5 SC-8/SC-8(1); OSCAL Moderate baseline |
| 4 | Entra-authenticated connections are always encrypted; untrusted chain fails | TLS | added (verified); the transformation raises the TLS dependency | Learn, Entra auth tutorial (Arc) |
| 5 | "In most federal environments, that certificate is issued by ADCS" | TLS | restated: "In many environments" (no source for "most") | — |
| 6 | Certificate requirements: Server Auth EKU, KeySpec AT_KEYEXCHANGE/legacy CSP, SAN incl. AG listener; AD CS template warning | TLS | added (verified) | Learn, Certificate Requirements for SQL Server |
| 7 | When the ADCS certificate expires, validating clients reject the connection | TLS | corrected: SQL Server checks validity only at configuration and keeps running; clients that check each connection (e.g., Power BI) error; Microsoft recommends against expired certificates | same, "Expired certificates" |
| 8 | Cloud PKI issues through Intune SCEP to Intune-enrolled devices; "check that each SQL Server host qualifies" | TLS | corrected: Intune doesn't support Windows Server, so Cloud PKI can't issue SQL Server TLS certificates directly; BYOCA can share a root; server issuer is a separate decision | Learn, Cloud PKI overview; Supported operating systems in Intune; consistent with Book 05 Ch03/Ch09 |
| 9 | Cloud PKI licensing and cloud availability (GCC High yes, DoD no) | TLS | added (verified), consistent with Book 03 Ch09 | Learn, Cloud PKI overview |
| 10 | Type-C login via `CREATE LOGIN ... FROM CERTIFICATE`; "used only for code signing", "can't be used to connect" | Type-C | verified (quotes exact) | Learn, CREATE LOGIN Remarks |
| 11 | Type-K (asymmetric key) logins behave the same | Type-C | added (verified) | Learn, sys.server_principals; CREATE LOGIN |
| 12 | Most such certificates are created inside SQL Server | Type-C | verified in part (`CREATE CERTIFICATE` can generate a self-signed cert); "most" kept as the author's judgment | Learn, CREATE CERTIFICATE |
| 13 | CBA = user certificate sign-in; SQL Server has no client-certificate login; avoids NTLM only with Kerberos | CBA | kept (consistent with SQL auth types: Windows/SQL/Entra) | Learn, Register an SPN (Kerberos conditions) |
| 14 | "CBA certificates must be issued by a CA ... points at the same authority" (AD CS) | CBA | corrected: PIV certificates come from a Federal PKI Common Policy CA via the CMS, not agency AD CS; the AD CS dependency is the DC certificates (Enterprise CA auto-enrolls DCs) and any non-PIV smart-card certs; NTAuth must trust the issuer | FIPS 201-3 §5; Learn troubleshoot, Smart card logon with third-party CAs; Book 03 Ch09 |
| 15 | Entra CBA is a relying party validating against the tenant's trusted CAs | CBA (new paragraph) | added (verified), consistent with Book 02 Ch04 | Learn, Entra CBA overview |
| 16 | SPN/KDC fixes "of Book 06" | CBA | renumbered to Chapters 14–15 | — |
| 17 | 2027-04-01 "NTLM deadline" | CBA, sequencing | restated-as-design: the program's backstop | see Ch21 verification |
| 18 | Sequencing: replacement CA first, AD CS last | Sequencing | restated-as-design | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter / H1 "Chapter 1 — Where SQL Server Touches ADCS" | "Chapter 22 — Where SQL Server Touches AD CS" (Microsoft's name, as in Books 02–03); description; house front matter | edited |
| Thesis line | Kept verbatim | kept |
| "In this chapter" callout | Kept; adds the Cloud PKI limit | edited |
| Opening diagram `book-10-ch01-what-breaks.svg` and intro paragraphs | Kept; diagram moved after the intro so the front-page diagram leads | edited |
| § SQL Server TLS/SSL Certificates | Kept; corrections rows 3–9; new final paragraph on the server-certificate issuer | edited |
| § Certificate-Mapped SQL Server Logins | Kept; type-K and CREATE CERTIFICATE added | edited |
| § CBA as the NTLM Replacement Interim Posture | Kept argument and conclusion; CA dependency corrected to DC certificates and NTAuth; Entra CBA paragraph added | edited |
| § The Sequencing Dependency (+ diagram) | Kept; link to Book 02 Chapter 04 added | edited |
| "What Book 10 establishes — Chapter 1" callout | "What this chapter establishes"; items 1 and 2 updated | edited |
| Book_10.md warning callout ("Not Yet Defined", analytical, don't cite as normative, `Get-CertBasedAuthAudit.ps1`) | New warning callout at the top, with link to Runbook R10 | kept (moved) |
| Book_10.md subtitle ("the infrastructure dependency most SQL Server transformation documents ignore") | In the warning callout | kept (merged) |
| Book_10.md diagram `book-10-adcs-dependencies.svg` | Placed after the callouts | kept (moved) |
| Book_10.md Download bundle callout | Not carried; bundles are linked from the book index | removed |
| Book_10.md chapter listing; dependency-chain line ("behind steps 4 and 8") | Replaced by book navigation; dependency-chain page archived | removed |
| Book_10.md Authoritative references (Cloud PKI, Intune Government, encrypt connections, CREATE LOGIN, Entra CBA) | Footnoted where used; Intune Government page not cited because the Cloud PKI page itself states GCC High/DoD availability | kept (as footnotes) |
| Book_10.md Continue-the-series links | Chapter 21 / index / Chapter 23 | edited |
| Diagram sources `book-10-*.flow.yaml` | Not changed: they say "ADCS issues ... certificates for certificate-based authentication", which is still true where AD CS issues DC or non-PIV certificates; editor may wish to say "DC and smart-card certificates" on next render | kept |

## Additions, October 23, 2026 (certificates and the CLM platform)

At the user's request, every certificate-dependent book maps its certificates to Book 07 and the CLM platform. Source: the certificate-touchpoints research brief (program working file), Book 07 Ch04/Ch05/Ch07/Ch08 and CyberArk 26.1 documentation (accessed Oct 23, 2026).

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Certificates section: class, issuer and renewal engine per certificate | Certificates in this book and the CLM platform | restated-as-design (Book 07's classes applied); items marked inference are labeled | Book 07 Ch04, Ch05 |
| 2 | CyberArk mechanism (capi) | Same section | verified (noted) | CyberArk 26.1 docs, note clm-capi |
| 3 | Issuer decision 'Not Yet Defined'; 'Which new CA is an open question' | Callout; TLS section; takeaway 4 | corrected by a callout and two sentences: retained AD CS through the CLM, standalone after AD; DCs keep autoenrollment | Book 07 Ch04, Ch07 |

## Addition, October 23, 2026: hybrid credentials research

From the research explainer *Certificates, Tokens and Keys Across the Hybrid Estate* (docs/research/hybrid-credentials.md), sources opened October 23, 2026.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Renewer of the 2022 app-registration certificate is Key Vault and the Arc extension when service-managed, else the app's owner; Entra ID renews nothing | Certificates section table | corrected (was "Entra ID or the app's owner") | Rotate certificates, note c22-sqlrot |
| 2 | SQL Server needs KeySpec AT_KEYEXCHANGE; KSP keys aren't compatible; the CAPI driver doesn't document CSP vs KSP, so a test gate | Certificates section | added; test gate is design guidance | Certificate requirements (Mar. 3, 2026), note hc-keyspec; CAPI object settings, note clm-capi |
