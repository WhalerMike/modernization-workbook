# Book 09 — Transformed Steady State

**The destination and the milestone**

## Why this book exists

The destination is not a partial migration. It is a state in which no domain controller is in the authentication path, no NTLM is used, no SQL Authentication is used for human principals, the engine runs under a managed identity, and Conditional Access evaluates every human connection.

## The milestone

The milestone is the date by which the migration must already be complete. It is not a completion date for the migration. It is the date by which NTLM is blocked at the Local Security Authority layer across the estate. Any connection that still requires NTLM on that date fails.

## What the steady state looks like

- Every surviving instance accepts only cloud-identity logins for human principals.
- Every engine process runs under a system-assigned managed identity.
- Every human connection is evaluated by Conditional Access before the token is issued.
- No Service Principal Name is required for human authentication because the authentication path no longer uses Kerberos.
- No domain controller is in the authentication path.

## Evidence

The steady state is not declared. It is evidenced. The authentication audit is re-run. The fraction of connections that use NTLM is zero. The fraction of human logins that are type-E is one. The engine process identity is the managed identity. The evidence is recorded.

## The gate

The milestone is not declared complete until the evidence shows that the steady state has been reached for the entire surviving estate.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
