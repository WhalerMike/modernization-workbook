---
title: "Arc Deployment Sequencing for SQL Server Hosts"
doc-type: sql-server-narrative-chapter
audience: [Technical, Customer]
family: sql-server-narrative
book: "04"
series-order: 2
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

# Chapter 2 — Arc Deployment Sequencing for SQL Server Hosts

*The ordered prerequisites that turn a domain-joined SQL Server host into an Arc-enabled, identity-ready instance.*

::: {.callout-note}
## In this chapter
The connectivity prerequisites that Arc enrollment demands inside a GCC-Moderate boundary, why the Azure extension for SQL Server is a distinct installation with its own version validation, the version-specific step that enables Microsoft Entra authentication on the instance, and the checks — a token from the Arc agent's local endpoint and a test Entra login — that confirm the identity is genuinely available before any login migration begins.[^b04c02-arc-sql]
:::

![The ordered steps that make a host identity-ready.](../../images/sql-server/diagrams/svg/book-04-ch02-arc-deployment-sequence.svg){fig-alt="Five steps in order: confirm egress, install the Connected Machine agent, deploy the Azure extension for SQL Server, enable Microsoft Entra authentication on the instance, and verify before any login moves."}

Arc deployment is a sequence, not a single act. Each step has a prerequisite that the prior step satisfies, and skipping ahead produces failures that are easy to misdiagnose as migration problems when they are in fact enrollment problems. The order is connectivity first, then the Connected Machine agent, then the SQL Server extension, then Entra authentication on the instance, then a verification that the identity is actually present and answering.[^b04c02-arc-servers]

## Prerequisites for Arc Enrollment

The Connected Machine agent requires outbound HTTPS connectivity from the server to the Azure Arc endpoints — `management.azure.com`, `login.microsoftonline.com`, and the Arc-specific regional endpoints. In a GCC-Moderate boundary, this connectivity must be routed through the program's approved network egress path.

Direct internet egress from a production SQL Server host is not acceptable under the boundary's network posture. The Arc agent supports proxy configuration for HTTPS traffic, and the proxy address must be provided at installation time. The instance's own Entra authentication traffic does not use the Arc agent's proxy setting: SQL Server connects to Entra ID directly, so a host that needs a proxy also needs the machine-level WinHTTP proxy set (`netsh winhttp set proxy`).

Connectivity verification — confirming that the server can reach all required Arc endpoints through the approved proxy — is the first prerequisite check before Arc deployment begins. An agent that cannot reach its endpoints will fail to register its ARM resource, and without that resource there is no Managed Identity to verify later.

## The Azure Extension for SQL Server

The Azure extension for SQL Server is a distinct installation from the Connected Machine agent and must be deployed after the agent is enrolled. It is installed via Azure Policy assignment — the recommended approach for fleet-wide deployment — or via the Azure portal or CLI for individual servers.

The extension performs additional validation at installation time. It verifies the SQL Server version, where 2022 or later is required for Entra auth capability; it registers the SQL Server instance with the Arc SQL resource plane; and it is the component that later applies the instance's Entra authentication configuration.

The authentication-audit script (`the authentication audit script`) Arc-eligibility classification — Category 1 versus Category 2 versus Category 3 — is the primary input for prioritizing Arc deployment across the estate. Category 2 instances are the immediate deployment targets, and the audit's login inventory and NTLM risk signals within Category 2 are used to order those deployments by remediation urgency.

## Enabling Microsoft Entra Authentication on the Instance

Installing the extension does not by itself switch on Entra authentication. That is a separate, version-specific step. On SQL Server 2022, the instance uses an Entra app registration: register the application, grant it the Microsoft Graph read permissions the setup tutorial lists with admin consent, create its certificate in Azure Key Vault, and give the Arc server's managed identity read access to that certificate so the Arc agent can install it on the host.[^b04c02-entra-sql] On SQL Server 2025, the recommended path is to set the Arc server's system-assigned managed identity as the instance's primary managed identity and grant that identity `User.Read.All`, `GroupMember.Read.All` and `Application.Read.All`, which only a Privileged Role Administrator can do.[^b04c02-mi-2025][^b04c02-graph-perms] On both versions, set the instance's Entra admin to a group (Book 07). Neither version supports Entra authentication on failover cluster instances, and both need a network path to the Azure public cloud.

## Verification of Managed Identity Availability

After the Connected Machine agent is installed and the Azure extension for SQL Server is deployed, the program must verify that the system-assigned Managed Identity is available, and that Entra authentication works on the instance, before proceeding to the login migration. This verification is not optional — it is the gate between enrollment and migration.

The first check calls the Arc agent's local identity endpoint (HIMDS) on the server — `http://localhost:40342/metadata/identity/oauth2/token?api-version=2019-11-01&resource=https://management.azure.com/` — not the Azure VM metadata address `169.254.169.254`. The endpoint first returns a challenge that only a local administrator or a member of the Hybrid Agent Extension Applications group can answer; the check confirms that the Arc agent then returns a valid access token. The second check is a test Entra login that connects to the instance. The third is the next audit run, which should classify the instance as Category 1 (Book 03).

A successful token response confirms three things at once: that the Managed Identity is enrolled in Entra ID, that the Arc agent is functioning, and that the server's ARM resource is in a healthy state. A failed token response at this stage requires Arc troubleshooting before the SQL Server migration can proceed.

The authentication-audit script's Arc-eligibility classification is updated on each run to reflect the current Managed Identity availability state, so the per-instance compliance record for the instance reflects this verification outcome in near-real-time.

::: {.callout-note title="What Book 04 establishes — Chapter 2"}
Arc deployment for a SQL Server host proceeds in a strict order: first verify outbound HTTPS connectivity to the Arc endpoints through the program's approved GCC-Moderate egress proxy, then install the Connected Machine agent, then the Azure extension for SQL Server — a distinct installation that validates the SQL Server 2022+ version and registers the instance with the Arc SQL resource plane — then enable Entra authentication on the instance (an app registration and Key Vault certificate on SQL Server 2022, the primary managed identity on SQL Server 2025), and finally verify: the agent returns a token from its local endpoint (`localhost:40342`), a test Entra login connects, and the next audit run shows Category 1.[^b04c02-appreg-2022][^b04c02-arc-mi-endpoint] That verification is the gate that authorizes login migration; a failure is an enrollment problem to resolve before migration begins. The authentication-audit script drives prioritization and records the verification outcome in near-real-time.
:::

[^b04c02-arc-sql]: Microsoft Learn, [Overview — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/overview?view=sql-server-ver17).
[^b04c02-arc-servers]: Microsoft Learn, [Azure Arc-enabled servers overview](https://learn.microsoft.com/en-us/azure/azure-arc/servers/overview).
[^b04c02-graph-perms]: Microsoft Learn, [Set up managed identity and Microsoft Entra authentication for SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/microsoft-entra-authentication-with-managed-identity?view=sql-server-ver17).
[^b04c02-mi-2025]: Microsoft Learn, [Managed identity overview — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/managed-identity?view=sql-server-ver17).
[^b04c02-entra-sql]: Microsoft Learn, [Microsoft Entra authentication for SQL Server overview](https://learn.microsoft.com/en-us/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview?view=sql-server-ver17).
[^b04c02-arc-mi-endpoint]: Microsoft Learn, [Access Azure resources with managed identity on Azure Arc-enabled servers](https://learn.microsoft.com/en-us/azure/azure-arc/servers/managed-identity-authentication).
[^b04c02-appreg-2022]: Microsoft Learn, [Set up Microsoft Entra authentication with app registration — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/entra-authentication-setup-tutorial?view=sql-server-ver17).
