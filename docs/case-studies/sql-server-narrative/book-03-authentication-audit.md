# Book 03 — The Authentication Audit

**What is actually using Windows Authentication, SQL Authentication, and NTLM**

## Why this book exists

The authentication audit produces the baseline that every subsequent decision depends on. Without it, the program does not know which connections will break when NTLM is restricted, which logins can be migrated to cloud identity, and which applications must be changed.

## What the audit produces

- **Principal-type inventory.** Every login on every surviving instance, classified as Windows (type-U), SQL Authentication (type-S), or cloud identity (type-E).
- **Connection-string inventory.** Every connection string found in application configurations, scheduled tasks, and linked-server definitions, classified by the authentication method it uses.
- **NTLM measurement.** The fraction of connections that fall back to NTLM because a Service Principal Name is missing or because the client cannot negotiate Kerberos. This fraction is measured, not assumed.
- **Service-account inventory.** Every service account used by an engine process, classified as named domain account, group managed service account, or virtual account.

## How the audit is run

The audit is run against every surviving instance. It does not require downtime. It produces a machine-readable report that is stored as evidence. The report is the baseline against which migration progress is measured.

## What the audit does not do

The audit does not change any configuration. It does not restrict NTLM. It does not migrate any login. It produces the facts that the subsequent books use to decide what to change and in what order.

## The gate

No login migration begins until the authentication audit is complete and the results have been reviewed. An incomplete audit is a finding, not a starting point.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
