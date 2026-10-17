# Book 06 — NTLM Elimination

**Silent fallback, service principal name repair, and protocol restriction**



![NTLM elimination](../../images/sql-server/kerberos-lifecycle.png)

*NTLM elimination diagram.*

## Why this book exists

NTLM is the silent fallback. Eliminating it requires first repairing Service Principal Names, then restricting the protocol, then verifying that no application falls back. Premature restriction breaks legacy clients.

## Service Principal Name repair

Every SQL Server instance that will remain in the estate must have a correctly registered Service Principal Name. The format is `MSSQLSvc/hostname.domain.com:port`. The registration binds the service account’s long-term key to the service name so the Key Distribution Center can issue a ticket.

Missing or incorrect Service Principal Names are the primary cause of silent NTLM fallback. They are repaired before any protocol restriction is applied.

## Protocol restriction

NTLMv1 is restricted first. The Local Security Authority is configured to refuse LM and NTLMv1. Any connection that still requires NTLMv1 fails at the Local Security Authority layer, before the engine evaluates the login.

NTLMv2 is restricted later. The restriction is applied only after the authentication audit shows that no remaining connection requires NTLMv2, and only after the login migration for the affected instances is complete.

## Verification

After each restriction, the authentication audit is re-run. The fraction of connections that fall back to NTLM is measured again. A non-zero fraction is a finding. The restriction is not expanded until the fraction is zero for the affected cohort.

## The gate

NTLM restriction is not applied estate-wide until the pilot cohort has been verified and the connection-string inventory shows that no remaining connection requires NTLM.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
