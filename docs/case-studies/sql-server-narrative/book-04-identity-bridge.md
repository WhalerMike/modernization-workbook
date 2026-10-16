# Book 04 — The Identity Bridge

**Hybrid-management attachment and managed identity for the engine**

## Why this book exists

The SQL Server engine process needs a new identity before the directory is removed as the authoritative identity source. The only credential-free, cloud-native identity available for an on-premises server is the system-assigned managed identity that hybrid management provides.

## Hybrid-management attachment

Hybrid management attaches the management plane so the server can receive policy and telemetry without requiring domain membership for authentication. Attachment does not imply domain unjoin. Domain unjoin is a separately sequenced decision.

The attachment produces a managed identity for the host. That identity is the destination for the engine process.

## Managed identity for the engine

The engine process is reconfigured to run under the system-assigned managed identity. The managed identity is credential-free: there is no password to rotate, no secret to store, and no domain account to maintain.

The managed identity is used for network connections that the engine makes — file shares, linked servers, and monitoring sinks. It is also the identity that the engine presents when it authenticates to the cloud identity platform for its own operations.

## Sequencing

Hybrid-management attachment precedes login migration. The engine must have a managed identity before the directory is removed. Login migration can proceed in parallel once the engine has a stable identity, but the engine identity is the prerequisite.

## The gate

No instance is considered ready for login migration until hybrid management is attached and the engine process is running under the managed identity. Evidence of the attachment and the identity change is recorded.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
