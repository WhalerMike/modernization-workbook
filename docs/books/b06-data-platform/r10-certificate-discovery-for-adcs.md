---
title: "Runbook R10 — Certificate Discovery for SQL Server's ADCS Dependencies"
description: "How to discover, ahead of any Active Directory Certificate Services decommission, the certificate dependencies that break SQL Server if the certificate authority is removed first: the program's read-only certificate audit, the in-engine reads, the extraction of SQL Server's three dependency classes, and the dependency-ordered CA sequence, all analytical because no program decision yet governs the AD CS migration."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b06-data-platform
book: B06
part: How
series-order: 110
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Runbook R10 — Certificate Discovery for SQL Server's ADCS Dependencies

*Before anyone sets a date to switch off the certificate authority, someone has to find out what it is still signing.*

::: {.callout-note}
## In this runbook
A discovery-and-analysis runbook, not a provisioning one. Step 1 runs the program's read-only Active Directory certificate audit and the in-engine reads it can't reach. Step 2 maps the results onto SQL Server's three dependencies on Active Directory Certificate Services (AD CS): the engine's TLS certificate, certificates behind certificate-mapped logins and endpoints, and certificate-based sign-in as the NTLM-replacement interim posture. Step 3 orders the certificate authority (CA) migration. Everything here reads and plans; nothing issues, binds, revokes or decommissions.
:::

**Pairs with:** [Chapter 22 — Where SQL Server Touches AD CS](22-where-sql-server-touches-adcs.md). That chapter documents a gap the program has recorded as *not yet defined*: no program decision governs the move from AD CS to a cloud PKI. The replacement CA, the enrollment mechanism and the AD CS decommission sequence haven't been decided. This runbook therefore runs the audit, names what breaks, and orders the CA-migration dependencies so that the decision, when it is written, is written against real data. Don't cite it as governance for AD CS migration decisions.

## Why discovery comes long before any decommission date

SQL Server has certificate dependencies that are invisible to most teams planning an AD CS decommission. If AD CS is removed before they are migrated, SQL Server capabilities fail. With no governing decision in place, the only safe move is to **discover the dependencies and order them**. That discovery is fully script-backed.

## Step 1 — Run the certificate audit (read-only)

### `Spec3-D1.10-Get-CertBasedAuthAudit.ps1`

This program discovery script inventories certificate-based authentication dependencies across the Active Directory environment. It is read-only.

| Parameter | Type | Default | Purpose |
|---|---|---|---|
| `-OutputPath` | string | `.\output` | JSON and CSV output directory |
| `-DomainController` | string | — | Target a specific domain controller; auto-discovery if omitted |
| `-SearchBase` | string | — | Optional Active Directory search base (DN) |
| `-D1InputFile` | string | — | A service-account scan JSON (the program's planned Spec3-D1.1, not yet published), for cross-reference |
| `-IncludePKIAudit` | switch | off | Run `certutil -TCAInfo` against the Enterprise CA |
| `-IncludeTemplateAudit` | switch | off | Enumerate all published certificate templates from Active Directory |

It runs six analysis sections: PKI infrastructure inventory (Enterprise root and subordinate CAs, CRL and OCSP distribution points, NTAuth certificates, auto-enrollment GPOs), a machine-certificate audit, a user-certificate audit, service and application certificate dependencies (AD FS, **LDAPS on domain controllers**, RADIUS and NPS, web TLS client certificates), Entra ID certificate-based authentication readiness, and migration paths. LDAPS is a real AD CS dependency in its own right: a domain controller's LDAPS certificate must carry the Server Authentication EKU and chain to a CA that both the domain controller and its clients trust.[^r10-ldaps]

::: {.callout-warning}
## Illustrative, not tested against production
The commands and queries on this page are illustrative. They haven't been tested against a production forest, CA or instance. The audit script and the `FMP*` functions are the program's own tooling; their parameters are documented here as the program defines them. Review each, and run it first in a non-production environment.
:::

```powershell
# Full read-only certificate audit, including PKI infrastructure and templates
# (needs certutil; the script's own guidance is to run the template audit with Enterprise Admin rights)
./Spec3-D1.10-Get-CertBasedAuthAudit.ps1 -IncludePKIAudit -IncludeTemplateAudit -OutputPath .\output
```

### Output schema

Under `-OutputPath` the script writes `FMP_Spec3_D1.10_CertBasedAuthAudit_<domain>_<timestamp>.json` (summary, PKI infrastructure and the certificate arrays), plus `*_machines.csv` and `*_users.csv`. Machine records carry the `userCertificate` EKU set (Client Authentication, Server Authentication, IPsec, 802.1X), issuer, template and expiration. User records carry `AuthenticationType`; **`SmartCardRequired`**, from the `SMARTCARD_REQUIRED` flag (`0x40000`) in `userAccountControl`, which forces the user to sign in with a smart card;[^r10-uac] `AltSecIdentityCount`, the number of `altSecurityIdentities` values that bind certificates to the account; and a `MigrationPath` (smart card to Entra certificate-based authentication, FIDO2 or Windows Hello for Business). Template records (with `-IncludeTemplateAudit`) carry `HasSmartCardLogon`, true when the template includes the Smart Card Logon EKU; the source listed it among the user fields. The summary counts smart-card-required and certificate-based users and the smart-card-capable templates.

The `altSecurityIdentities` count matters twice. On the domain controller, strong certificate mapping under KB5014754 relies on non-reusable mapping types in that attribute; and Microsoft Entra Connect can synchronize those values to `certificateUserIds` for Entra certificate-based authentication, provided each account has 10 or fewer values, none longer than 1,024 characters and no duplicates.[^r10-certuserids]

### What D1.10 does and doesn't give you

D1.10 is an **Active Directory-wide** certificate audit: machine and user certificates, smart cards, PKI infrastructure, LDAPS on domain controllers. It captures the issuing CA for each certificate, which is exactly the signal needed to know *what depends on AD CS*. It does **not** reach into a SQL Server instance to find the engine's TLS certificate or the certificates stored in `master`; those live in the host's certificate store and in the instance, not in Active Directory.

**`New-FMPSqlCertificatePlan`**, in the program's `FMPSqlServerMigration` module, is the SQL-specific extraction. It reads the D1.10 output and isolates the three dependency classes: `tls_server_cert` (scoped to SQL Server hosts with `-SqlHostFilter`), `certificate_mapped_login`, and `cba_posture` (readiness of the NTLM-replacement posture). It then derives the dependency-ordered CA-replacement sequence (roots before issuing CAs), the bridge for issuing certificate-based sign-in certificates. Every record is `requires_review`; the function is analytical and changes nothing.

```powershell
Import-Module FMPSqlServerMigration
New-FMPSqlCertificatePlan -CertAuditPath .\output\*CertBasedAuthAudit*.json -SqlHostFilter 'SQL' -OutputPath .\output\sql-cert-plan.json
```

Reading the engine's TLS certificate and the certificates inside the instance requires a connection to the instance, which this module deliberately never opens (the same no-connection rule as the emitters in [Runbook R05](r05-login-migration-and-parallel-run.md) and [Runbook R07](r07-groups-aus-and-the-conditional-access-perimeter.md)). These stay a read-only, in-engine step. Capture their output and feed it in alongside the D1.10 audit:

```sql
-- 1. The engine's configured TLS certificate (thumbprint), read-only
SELECT registry_key, value_name, value_data
FROM   sys.dm_server_registry
WHERE  registry_key LIKE N'%SuperSocketNetLib%' AND value_name = N'Certificate';

-- 2. Certificate-mapped (type C) logins and the certificate behind each; run in master.
--    A login created FROM CERTIFICATE shares the certificate's SID.
USE master;
SELECT  sp.name AS login_name, sp.type_desc,
        c.name  AS cert_name, c.issuer_name, c.subject, c.expiry_date, c.thumbprint
FROM    sys.server_principals AS sp
JOIN    sys.certificates      AS c ON c.sid = sp.sid
WHERE   sp.type = 'C';

-- 3. Database mirroring / availability group endpoints and how they authenticate
SELECT name, connection_auth_desc, is_encryption_enabled, encryption_algorithm_desc
FROM   sys.database_mirroring_endpoints;
```

Three corrections to the source's version of these reads:

- **The join for type-C logins.** The source joined `sys.certificates.principal_id` to `sys.server_principals.principal_id`. In `sys.certificates`, `principal_id` is the *database* principal that owns the certificate; the column that links a certificate to its login is `sid`, the login SID for the certificate.[^r10-certificates] The query also adds `issuer_name`, which is the field that tells you whether the certificate came from AD CS at all.
- **An empty registry value doesn't mean no certificate.** If no certificate is configured, SQL Server automatically uses one from the local computer store whose subject contains the machine's FQDN, if its service account can read the private key; if none qualifies, it uses a self-generated certificate.[^r10-encryption] So check the SQL Server error log at startup as well, which records the hash of the certificate it loaded for encryption.[^r10-tls-log]
- **Endpoints are a third place certificates hide.** Database mirroring and availability group endpoints authenticate either with Windows Authentication or with certificates, and `connection_auth_desc` shows which.[^r10-endpoints][^r10-dbm-endpoints] An endpoint that reports `NTLM` or `NEGOTIATE` is also an NTLM source for [Runbook R06](r06-ntlm-detection-and-remediation.md).

## Step 2 — Map the audit to SQL Server's three dependencies

[Chapter 22](22-where-sql-server-touches-adcs.md) names three SQL Server capabilities that can depend on AD CS-issued certificates. `New-FMPSqlCertificatePlan` classifies the D1.10 output (the issuing CA on every certificate) into these three, with the in-engine reads above supplying the detail.

| Dependency | What it is | What breaks if AD CS is decommissioned first | Migration direction |
|---|---|---|---|
| **TLS engine certificate** | The server certificate the engine presents to encrypt connections. Transmission confidentiality with cryptographic protection (SC-8 and SC-8(1)) is in the NIST SP 800-53B moderate baseline,[^r10-nist-53b] and every Microsoft Entra-authenticated connection to SQL Server requires encryption.[^r10-entra-encrypt] | No CA is left to renew it. A certificate outside its validity period no longer meets SQL Server's requirements,[^r10-cert-reqs] and clients that validate the server certificate refuse to connect. Encryption becomes the thing that breaks the connection. | A new CA issues and binds a replacement **before** the AD CS certificate expires or AD CS goes offline, and its root is distributed to every client. |
| **Certificates behind certificate-mapped logins and endpoints** | A login `FROM CERTIFICATE` used for code signing and permissions, or a certificate that authenticates a mirroring or availability group endpoint | Less than the source claimed; see the note below | If the certificate was issued by AD CS, replace it and re-sign the modules or re-create the endpoint certificate before the CA goes; most are self-signed by SQL Server and have no AD CS dependency. |
| **Certificate-based sign-in as the NTLM-replacement interim posture** | The program's authorized fallback for connections that can't reach Kerberos-only or Entra authentication before the deadline: the user signs in to Active Directory with a smart card or PIV certificate, and the SQL Server connection then negotiates Kerberos | The program loses its interim posture at the moment it is most needed | The replacement CA must be **issuing sign-in certificates before AD CS retires** |

The second row is substantially corrected. The source described a certificate-mapped login as one where "the client presents a cert as the credential," failing "when the backing cert expires," with the preferred fix of replacing it with an Entra service-principal login. That isn't how type-C logins work. Microsoft documents that logins created from certificates or asymmetric keys are used only for code signing and can't be used to connect to SQL Server.[^r10-create-login] SQL Server's built-in signing and encryption functions don't check certificate expiration either; Service Broker and backup encryption do.[^r10-create-cert] So an expiring certificate behind a type-C login doesn't lock anyone out, and there's no connection to move to an Entra login. The real AD CS dependency is narrower: a certificate that was imported from an AD CS-issued file (visible in `issuer_name`), whose renewal would require the old CA. Certificates that SQL Server generated itself with `CREATE CERTIFICATE` are self-signed and don't depend on AD CS at all.[^r10-create-cert] The same is true of mirroring endpoint certificates, which Microsoft's procedure creates locally on each instance.[^r10-endpoints] This matches [Chapter 22](22-where-sql-server-touches-adcs.md), which describes type-C logins as "used for code signing and endpoints, not to connect."

## Step 3 — Order the CA-migration dependencies

CAs carry parent and child trust edges: an issuing CA depends on its root. The program's **`New-FMPPKIMigrationPlan`**, in the `FMPPlanGenerators` module, derives a deterministic, dependency-ordered migration sequence from a PKI assessment envelope:

| Parameter | Purpose |
|---|---|
| `-AssessmentPath` (required) | Path to the PKI assessment envelope (the CA inventory) |
| `-OutputPath` | Where the sealed plan envelope is written |

It orders the CAs topologically (**root before issuing**) and **flags cycles and cross-domain dependencies as blockers**, the same cross-domain entanglement that [Runbook R02](r02-estate-discovery-and-consolidation-gate.md) surfaces. The plan it emits is a sequence of `migrate_ca` steps plus a blocker list, sealed as a derived-from-assessment envelope.

```powershell
Import-Module FMPPlanGenerators
New-FMPPKIMigrationPlan -AssessmentPath .\output\pki-assessment.json -OutputPath .\output
```

This plan is the CA-sequencing skeleton. It doesn't choose the replacement CA or the enrollment mechanism; that is the decision the missing AD CS migration decision must make. One fact bears directly on that choice for this book. Microsoft Cloud PKI, a candidate cloud CA, issues end-entity certificates through SCEP to Intune-managed devices;[^r10-cloudpki] Intune's supported platforms don't include Windows Server ([Book 05, Chapter 09](../b05-devices/09-servers-under-azure-arc.md)). A Cloud PKI design would therefore need another enrollment path for SQL Server hosts' TLS certificates. That's an observation for the decision, not a conclusion of this runbook.

## The sequencing finding

The three dependencies converge on one question the audit makes concrete: **does the AD CS decommission timeline run earlier than the replacement-CA and sign-in-certificate timeline?** If it does, the program loses the certificate-based interim posture at precisely the moment connections that couldn't reach Entra authentication need it. TLS certificates must be re-issued before they expire; AD CS-issued certificates behind type-C logins and endpoints must be replaced and their modules re-signed; and certificate-based sign-in must have a CA issuing its certificates before AD CS retires. The sequencing of AD CS decommission against the program's **2027-04-01** NTLM backstop ([Runbook R06](r06-ntlm-detection-and-remediation.md), [Runbook R09](r09-continuous-monitoring-and-closure.md)) is therefore a critical dependency. The central deliverable of this runbook is the discovered, ordered evidence that the AD CS migration decision must resolve **before any decommission date is set**.

## Safety

This entire runbook is **read-only**. The D1.10 audit reads Active Directory and, with `-IncludePKIAudit`, the CA configuration; the in-engine queries are inventory reads; `New-FMPSqlCertificatePlan` and `New-FMPPKIMigrationPlan` derive plans from captured output. Nothing here issues, binds or revokes a certificate, and nothing decommissions a CA; those are governed actions awaiting the AD CS migration decision.

::: {.callout-tip}
## Continue the book
[← Previous: Runbook R09 — Continuous Monitoring & the CCM-BIR Closure Record](r09-continuous-monitoring-and-closure.md) · [Book index](index.md) · [Next: Appendix A — Requirements Mapping →](appendix-a-requirements-mapping.md)
:::

[^r10-ldaps]: Microsoft Learn, "Configure certificates for LDAP over SSL in Active Directory Domain Services" (Server Authentication EKU; trust chain to a CA both the domain controller and clients trust; ports 636 and 3269), <https://learn.microsoft.com/windows-server/identity/ad-ds/configure-ldap-signing-certificates> (accessed Oct 20, 2026).
[^r10-uac]: Microsoft Learn, "Use the UserAccountControl flags to manipulate user account properties" (`SMARTCARD_REQUIRED`, 0x40000: "forces the user to log on by using a smart card"), <https://learn.microsoft.com/troubleshoot/windows-server/active-directory/useraccountcontrol-manipulate-account-properties> (accessed Oct 20, 2026).
[^r10-certuserids]: Microsoft Learn, "Mapping to the certificateUserIds attribute in Microsoft Entra ID," section "Update certificateUserIds using Microsoft Entra Connect" (altSecurityIdentities, KB5014754 strong mapping, synchronization limits), <https://learn.microsoft.com/entra/identity/authentication/concept-certificate-based-authentication-certificateuserids> (accessed Oct 20, 2026).
[^r10-certificates]: Microsoft Learn, "sys.certificates (Transact-SQL)" (`principal_id`: the database principal that owns the certificate; `sid`: login SID for this certificate; `issuer_name`; `expiry_date`), <https://learn.microsoft.com/sql/relational-databases/system-catalog-views/sys-certificates-transact-sql> (accessed Oct 20, 2026).
[^r10-encryption]: Microsoft Learn, "Encrypt connections to SQL Server by importing a certificate," sections "SQL Server certificate behavior with permissions" and "Certificate precedence," <https://learn.microsoft.com/sql/database-engine/configure-windows/configure-sql-server-encryption> (accessed Oct 20, 2026).
[^r10-tls-log]: Microsoft Learn, "An existing connection was forcibly closed by the remote host (OS error 10054)," section "SQL Server certificate uses a weak hash algorithm" (error-log entry "The certificate [Cert Hash(sha1) ...] was successfully loaded for encryption"), <https://learn.microsoft.com/troubleshoot/sql/database-engine/connect/tls-exist-connection-closed> (accessed Oct 20, 2026).
[^r10-endpoints]: Microsoft Learn, "Transport security in availability groups and database mirroring," section "Authentication" (Windows Authentication or certificates; each endpoint configured with its own locally created certificate), <https://learn.microsoft.com/sql/database-engine/database-mirroring/transport-security-database-mirroring-always-on-availability> (accessed Oct 20, 2026).
[^r10-dbm-endpoints]: Microsoft Learn, "sys.database_mirroring_endpoints (Transact-SQL)" (`connection_auth_desc`), <https://learn.microsoft.com/sql/relational-databases/system-catalog-views/sys-database-mirroring-endpoints-transact-sql> (accessed Oct 20, 2026).
[^r10-nist-53b]: National Institute of Standards and Technology, SP 800-53B, *Control Baselines for Information Systems and Organizations*, control baselines spreadsheet (SC-8 and SC-8(1) marked in the moderate and high security control baselines), <https://csrc.nist.gov/pubs/sp/800/53/b/upd1/final> (accessed Oct 20, 2026).
[^r10-entra-encrypt]: Microsoft Learn, "Tutorial: Set up Microsoft Entra authentication for SQL Server with app registration," section "Create logins and users" ("All connections to SQL Server that are done with Microsoft Entra authentication require an encrypted connection"), <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-setup-tutorial> (accessed Oct 20, 2026).
[^r10-cert-reqs]: Microsoft Learn, "Certificate requirements for SQL Server" (the current system time must be between the certificate's Valid from and Valid to; Server Authentication EKU), <https://learn.microsoft.com/sql/database-engine/configure-windows/certificate-requirements> (accessed Oct 20, 2026).
[^r10-create-login]: Microsoft Learn, "CREATE LOGIN (Transact-SQL)," Remarks ("Logins created from certificates or asymmetric keys are used only for code signing. They can't be used to connect to SQL Server."), <https://learn.microsoft.com/sql/t-sql/statements/create-login-transact-sql> (accessed Oct 20, 2026).
[^r10-create-cert]: Microsoft Learn, "CREATE CERTIFICATE (Transact-SQL)," Remarks and Arguments (can generate a self-signed certificate; built-in encryption and signing functions don't check expiration; Service Broker and backup encryption check it), <https://learn.microsoft.com/sql/t-sql/statements/create-certificate-transact-sql> (accessed Oct 20, 2026).
[^r10-cloudpki]: Microsoft Learn, "Overview of Microsoft Cloud PKI for Microsoft Intune" (end-entity certificate issuance through SCEP to Intune-MDM enrolled devices; bring-your-own-CA anchoring to AD CS), <https://learn.microsoft.com/intune/cloud-pki/> (accessed Oct 20, 2026).
