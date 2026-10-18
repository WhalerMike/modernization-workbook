# Book 10 — Certificate-Authority Dependency

**The layer the other steps depend on but rarely name**

![The three places SQL Server depends on ADCS-issued certificates.](../../images/sql-server/diagrams/svg/book-10-adcs-dependencies.svg){fig-alt="ADCS, being decommissioned, issues TLS server certificates, the certificates behind certificate-mapped type C logins, and the certificates for certificate-based authentication used as an interim posture."}

## Why this book exists

Certificate services, auto-enrollment, and the trust relationships that Kerberos and token validation both rely on are the layer the other steps depend on but rarely name. Certificate-authority failure is a silent failure that surfaces only when tickets or tokens cannot be validated.

## What the certificate authority provides

- **Kerberos.** The domain controller’s Key Distribution Center uses certificates for some trust relationships. When the certificate authority is unavailable, those trust relationships fail.
- **Token validation.** The SQL Server engine validates the signature of cloud-identity tokens against the cloud identity platform’s public key infrastructure. That infrastructure is itself certificate-anchored.
- **Auto-enrollment.** Certificates that are automatically enrolled for servers and clients depend on the certificate authority. When auto-enrollment stops, certificates expire and authentication fails.

## Silent failure

Certificate-authority failure does not produce an immediate error. Certificates continue to work until they expire. When they expire, authentication fails in ways that look like application bugs or network problems. The failure is silent because the certificate authority is not in the authentication path at the moment of failure; it is in the path only at the moment of issuance.

## Sequencing

Certificate-authority continuity is a prerequisite for every other book. It is not a later phase. It is a continuous dependency. The certificate authority must be inventoried, its expiration dates must be known, and its continuity must be assured before any authentication migration begins.

## The gate

No authentication migration begins until the certificate authority has been inventoried and a continuity plan has been recorded. Certificate-authority failure during the migration is a program-stopping event, not a recoverable incident.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
