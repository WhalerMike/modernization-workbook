---
title: "Where SQL Server Touches ADCS"
doc-type: sql-server-narrative-chapter
audience: [Technical, Customer]
family: sql-server-narrative
book: "10"
series-order: 1
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

# Chapter 1 — Where SQL Server Touches ADCS

*The certificate dependencies a decommission plan cannot see, named before any decommission plan exists.*

::: {.callout-note}
## In this chapter
The three distinct SQL Server capabilities that can depend on ADCS-issued certificates — TLS encryption of client connections, certificate-mapped logins used for signing and endpoints, and Certificate-Based Authentication as the authorized NTLM-replacement interim posture — why each one breaks if ADCS is decommissioned before it is migrated, and why this book documents a transformation for which no normative ADR has yet been authored.[^b10c01-tls]
:::

![What fails if ADCS goes away before each dependency is moved, and the migration path for each.](../../images/sql-server/diagrams/svg/book-10-ch01-what-breaks.svg){fig-alt="Table of the three ADCS dependencies, what breaks if ADCS is retired first, and the migration path for each."}

The transformation inventory identifies the Active Directory Certificate Services to Microsoft Cloud PKI transformation as "Not Yet Defined." As the series opening established, that label means the destination may be known but the normative canon governing how to reach it has not been authored.[^b10c01-cloudpki] For most of this series, the missing record has been the substrate architecture decision; for Book 10, the gap is more fundamental still. No architecture decision record governs the certificate authority transformation at all.

There is no architecture decision equivalent to point to. The transformation is identified as necessary in the transformation inventory, the discovery instrument exists, but the normative decision about the replacement CA, the enrollment mechanism, and the sequencing of ADCS decommission has not been made. This book is therefore analytical and motivational rather than prescriptive. It documents why the certificate gap matters specifically for SQL Server, and it cites no normative ADCS-migration architecture decision because none exists.

It matters specifically because SQL Server has certificate dependencies that are not visible to most of the teams that will plan the ADCS decommission. Three distinct capabilities can depend on ADCS-issued certificates: TLS encryption of client connections, certificate-mapped SQL Server logins (used for code signing and endpoints, not to connect), and Certificate-Based Authentication as the authorized NTLM replacement for connections that cannot reach Kerberos or Entra OAuth before the deadline. `Get-CertBasedAuthAudit.ps1` is the instrument for discovering them.

## SQL Server TLS/SSL Certificates

The first and most commonly recognized SQL Server certificate dependency is the TLS certificate the engine presents for encryption of client connections. When SQL Server is configured to use TLS encryption — which is required under this program's FedRAMP-Moderate posture — it presents a server certificate to connecting clients as part of the TLS handshake.

In most federal environments, that certificate is issued by the organization's ADCS infrastructure. The administrator submitted a request to the ADCS Certificate Authority, the CA issued a certificate carrying the SQL Server's hostname as the Subject Alternative Name, and the certificate was installed in the instance's certificate store and bound through SQL Server Configuration Manager. The certificate has an expiration date.

When ADCS is decommissioned, that certificate will not be renewed automatically — there is no CA left to issue the renewal. If the TLS certificate expires after ADCS decommission, clients configured to validate the server certificate, which is the correct security posture, will reject the connection with a certificate validation error. The encryption that FedRAMP-Moderate requires becomes the thing that breaks the connection.

The certificate-audit script captures the TLS certificate for every instance in scope: the subject, the SAN, the issuing CA, and the expiration date. Any instance whose TLS certificate is ADCS-issued is a dependency the migration plan must address. The replacement certificate must come from the new CA — whether Microsoft Cloud PKI (the Intune Suite certificate service, which issues through Intune SCEP profiles to Intune-enrolled devices, so check that each SQL Server host qualifies) or an alternative — and must be installed and bound before the ADCS-issued certificate expires or before ADCS goes offline, whichever comes first.

## Certificate-Mapped SQL Server Logins

The second dependency is less commonly known. SQL Server supports a login type — the type-C login — created from a certificate in `master` with `CREATE LOGIN [name] FROM CERTIFICATE [cert_name]`. It is not a way to connect: Microsoft documents that logins created from certificates or asymmetric keys "are used only for code signing" and "can't be used to connect to SQL Server."[^b10c01-create-login] They carry permissions for signed modules, and certificates of the same kind secure Service Broker and database mirroring endpoints.

[^b10c01-create-login]: Microsoft Learn, [CREATE LOGIN (Transact-SQL)](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-login-transact-sql?view=sql-server-ver17), Remarks.

Certificate-mapped logins are uncommon in standard deployments, but they appear in specific scenarios: module signing that grants a stored procedure permissions its caller lacks, and Service Broker or mirroring endpoint security. Each is the kind of arrangement that survives quietly across an estate for years without anyone documenting it.

Most such certificates are created inside SQL Server rather than issued by ADCS, so the first question is the issuer. Where an ADCS-issued certificate backs a type-C login or an endpoint, replacing it means issuing a new certificate, re-signing the modules or reconfiguring the endpoints, and moving the login's permissions, before ADCS is retired. Type-C logins are not migrated to Entra logins, because nothing connects with them. The certificate-audit script captures every certificate-mapped login and the issuing CA of its associated certificate, providing the inventory the migration needs.

## CBA as the NTLM Replacement Interim Posture

The third dependency is the most consequential for the NTLM elimination timeline. The Kerberos/NTLM-elimination program designates CBA as the authorized replacement for NTLM connections that cannot be migrated to Kerberos or Entra ID OAuth 2.0 tokens within the required timeline. Here CBA means certificate-based sign-in by the user — a smart card or PIV credential — rather than a password. SQL Server itself has no client-certificate login, so for a pre-2022 instance the certificate secures the user's sign-in to Active Directory, and the SQL Server connection that follows still authenticates with Windows authentication. It avoids NTLM only where that connection can use Kerberos.

For connections that cannot reach Entra ID auth before the 2027-04-01 NTLM backstop — Category 3 instances still pre-2022, or applications still in the deferred class — CBA is the authorized interim posture. Certificate sign-in removes the password from the user's side, and the program accepts it as the interim posture provided the connection itself then negotiates Kerberos rather than NTLM — which still depends on the SPN and KDC fixes of Book 06.[^b10c01-spn] It is the bridge that keeps an un-migratable connection compliant.

The problem is that CBA certificates must be issued by a CA. If the plan is to deploy CBA as the NTLM-replacement posture for connections that cannot yet reach Entra auth, and ADCS is being decommissioned, the replacement CA must already be in place and issuing CBA certificates before ADCS goes offline. The interim posture has its own certificate dependency, and that dependency points at the same authority the program intends to remove.

## The Sequencing Dependency

![The order the ADCS migration must respect.](../../images/sql-server/diagrams/svg/book-10-ch01-sequencing.svg){fig-alt="First a replacement CA is issuing, then each dependency moves, the long tail stays on certificate-based authentication until 2027-04-01, and ADCS is decommissioned last."}

The three dependencies converge on a single sequencing question. TLS certificates must be re-issued before they expire; ADCS-issued certificates behind type-C logins and endpoints must be replaced and their modules re-signed; and CBA, the very mechanism the Kerberos/NTLM-elimination program relies on to cover connections that cannot meet the deadline, must have a CA issuing its certificates before ADCS is retired.

If the ADCS decommission timeline runs earlier than the replacement-CA and CBA-deployment timeline, the program loses the interim posture the Kerberos/NTLM-elimination program depends on at precisely the moment it is most needed — connections that could not migrate to Entra auth in time would have no compliant fallback. The sequencing of ADCS decommission against the 2027-04-01 NTLM deadline is therefore a critical dependency, and it is one the as-yet-unwritten ADCS-migration architecture decision must explicitly address before any decommission date is set.

::: {.callout-note title="What Book 10 establishes — Chapter 1"}
1. SQL Server can depend on ADCS in three places: the TLS server certificate, certificates behind type-C logins and endpoints, and the certificate-based interim posture.
2. `Get-CertBasedAuthAudit.ps1` discovers all three.
3. The sequencing of the ADCS decommission against the 2027-04-01 deadline is a dependency that the as-yet-unwritten ADCS-migration decision must resolve.
:::

[^b10c01-tls]: Microsoft Learn, [Encrypt connections by importing a certificate](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/enable-encrypted-connections-to-the-database-engine?view=sql-server-ver17).
[^b10c01-cloudpki]: Microsoft Learn, [Microsoft Cloud PKI for Microsoft Intune](https://learn.microsoft.com/en-us/intune/intune-service/protect/microsoft-cloud-pki-overview).
[^b10c01-spn]: Microsoft Learn, [Register a Service Principal Name for Kerberos connections](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/register-a-service-principal-name-for-kerberos-connections?view=sql-server-ver17).
