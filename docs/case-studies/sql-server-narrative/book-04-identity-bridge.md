# Book 04 — The Identity Bridge

**Hybrid-management attachment and managed identity for the engine**

## What hybrid management provides

Azure Arc Connected Machine agent provides the system-assigned Managed Identity that replaces the AD-anchored service account. The agent registers the host with Azure, installs the Azure extension for SQL Server, and exposes the Instance Metadata Service (IMDS) endpoint for credential-free token acquisition.

The engine process acquires a token from IMDS without a stored credential. The token is presented to Entra ID. Conditional Access evaluates the request. The token is issued and validated by SQL Server. No password traverses the network. No credential is stored in a configuration file.

![What Azure Arc connects: the on-premises host, Azure Resource Manager and Microsoft Entra ID.](../../images/sql-server/diagrams/svg/book-04-arc-identity-bridge.svg){fig-alt="The Connected Machine agent on the on-premises host projects it into Azure Resource Manager; the Azure extension for SQL Server and the instance's Entra identity let the engine validate Entra tokens."}

## Layer 1 and Layer 2

SQL-engine Entra authentication (Layer 1) does not depend on OS-level domain unjoin (Layer 2). Layer 1 can proceed while the host remains domain-joined. Layer 2 — domain unjoin — is a separate decision that follows the authentication migration, not a prerequisite for it.

This distinction must be communicated to every stakeholder. SQL-engine Entra authentication must never be blocked waiting for OS-level domain unjoin.

## Deployment sequencing

Arc deployment respects linked-server dependency order. The host that is the target of a linked server must be enrolled before the host that originates the linked-server connection. Outbound HTTPS connectivity through the GCC-Moderate egress proxy must be verified before enrollment. The IMDS token test serves as the gate that authorizes login migration.

## What Book 04 establishes

Arc provides the managed identity that replaces the AD-anchored service account. The engine acquires a token from IMDS without a stored credential. Layer 1 (SQL-engine Entra auth) does not depend on Layer 2 (OS-level domain unjoin). Deployment sequencing respects linked-server dependency order. The IMDS token test is the gate that authorizes login migration.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
