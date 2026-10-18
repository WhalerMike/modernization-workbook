---
title: "Reading the Audit: Classification and Triage"
doc-type: sql-server-narrative-chapter
audience: [Technical, Customer]
family: sql-server-narrative
book: "03"
series-order: 2
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

# Chapter 2 — Reading the Audit: Classification and Triage

*From a per-instance category to a defensible migration order — and the one distinction that prevents the program's most common mistake.*

::: {.callout-note}
## In this chapter
How to interpret each of the three Arc-eligibility categories the audit assigns, how the audit output should drive triage and prioritization within each category, and the architectural distinction between SQL Server engine Entra authentication and server OS Entra login capability — the Layer 1 versus Layer 2 separation that lets engine migration proceed on a host that is still domain-joined.
:::

![The triage action for each category, and the path from Category 3 and 2 to Category 1.](../../images/sql-server/diagrams/svg/book-03-ch02-triage-by-category.svg){fig-alt="Category 3 instances are upgraded, Category 2 instances are Arc-enabled and configured for Entra authentication, and both arrive at Category 1, Entra-auth-ready."}

## Interpreting Category 1: Entra-Auth-Ready

A Category 1 classification is the program's best starting position. It means the infrastructure prerequisites for Entra ID authentication are already in place — the Arc agent is running, the Azure extension for SQL Server is deployed, and the engine is running on SQL Server 2022.[^b03c02-arc-sql]

The Managed Identity for the server is available, and the SQL Server extension has registered the instance with the Arc data services plane. Nothing in the infrastructure stack remains to be built.

The migration work for a Category 1 instance therefore begins with the login inventory from the audit: how many Windows logins exist, what AD groups are mapped to SQL Server roles, and whether any SQL Authentication logins need to be addressed before or alongside the Windows login migration. The specific migration steps are documented in Book 05.

The point here is that the audit has done its job for a Category 1 instance when it delivers a precise login inventory. The infrastructure work is already done, and the migration can proceed without any further prerequisites.

## Interpreting Category 2: Arc-Eligible but Not Enabled

A Category 2 instance requires an Arc deployment action before login migration can begin. The audit output for such an instance should be used to prioritize that deployment.

Instances with a large number of Windows logins, active SQL Authentication logins, or missing SPN registrations — and therefore NTLM-generating connections — are higher priority for Arc deployment than instances with simple, well-configured Windows Authentication.[^b03c02-spn]

The Arc deployment itself is not a SQL Server change. It is a server-level action that installs the Connected Machine agent and the SQL Server extension.[^b03c02-arc-servers] Book 03 describes the Arc deployment sequence in detail.

Once Arc deployment is complete and the SQL Server extension confirms the Managed Identity is available, the instance re-classifies from Category 2 to Category 1 on the next audit run, and the login migration can begin.

## Interpreting Category 3: Version Upgrade Required

A Category 3 instance is the most operationally complex. A pre-2022 instance cannot accept `FROM EXTERNAL PROVIDER` logins regardless of any other configuration change.[^b03c02-create-login]

The `CREATE LOGIN [user@tenant] FROM EXTERNAL PROVIDER` syntax was introduced in SQL Server 2022 as part of the Azure extension for SQL Server integration. Earlier versions do not support the syntax at all — it produces a parse error.

A Category 3 instance therefore has two possible paths: upgrade the SQL Server engine to 2022 and then proceed through the Category 2 pathway, or document a formal exception with a sunset date for the instance.

Given the 2027-04-01 NTLM elimination deadline, a Category 3 instance that cannot be upgraded to SQL Server 2022 before that date will face NTLM failure regardless of exception status. The NTLM block is network-level, not application-level, and it does not distinguish between instances that are excepted from the transformation and instances that are not.

The version-upgrade timeline for Category 3 instances must be integrated into the SQL Server engine-authentication migration plan as an explicit dependency.

## The SQL Engine vs. OS Entra Auth Distinction

![SQL engine Entra authentication and OS-level Entra sign-in are independent tracks.](../../images/sql-server/diagrams/svg/book-03-ch02-engine-vs-os-sign-in.svg){fig-alt="Layer 1, the SQL Server engine accepting Entra tokens, can start now and doesn't depend on Layer 2, administrators signing in to Windows with Entra ID, which is a separate program sequenced on its own."}

One of the most important clarifications the audit output must carry — and that the teams reading it must internalize — is the architectural distinction between SQL Server engine Entra authentication and server OS Entra ID login capability. These are two separate capabilities with separate prerequisites, and confusing them is the most common misunderstanding this program will encounter.

SQL Server engine Entra authentication — Layer 1, the capability described in this series — requires the Arc Connected Machine agent, the Azure extension for SQL Server, and SQL Server 2022. It does not require the server to be domain-unjoined, and it does not require Windows Server 2025.

A domain-joined Windows Server 2019 host running SQL Server 2022 with Arc installed can have Entra ID-backed SQL Server logins today, while the server itself remains domain-joined and continues to authenticate OS-level users via Kerberos to the domain controller.[^b03c02-entra-sql]

Server OS Entra ID login capability — Layer 2, the ability for administrators to RDP into the server using Entra ID credentials instead of domain credentials — is a separate transformation governed by the Arc non-domain-join requirement. It requires domain unjoin and Windows Server 2025 with Desktop Experience.

The two capabilities are related — both are part of the SQL Server authentication transformation — but they are sequenced independently, and the SQL Server engine migration can and should proceed first.

This sequencing point must be explicit in every instance of audit output that classifies a server as "not yet domain-unjoined." The correct interpretation is not "SQL Server migration blocked" but "OS-level Entra login not yet available; SQL engine migration can proceed."

::: {.callout-note title="What Book 03 establishes — Chapter 2"}
1. Category 1 migrates now; Category 2 gets Arc and becomes Category 1; Category 3 upgrades or carries a dated exception.
2. SQL-engine Entra authentication (Layer 1) needs only Arc, the SQL extension and SQL Server 2022 or later.
3. Layer 1 proceeds on domain-joined hosts and never waits for OS-level Entra login (Layer 2).
:::

[^b03c02-arc-sql]: Microsoft Learn, [Overview — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/overview?view=sql-server-ver17).
[^b03c02-spn]: Microsoft Learn, [Register a Service Principal Name for Kerberos connections](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/register-a-service-principal-name-for-kerberos-connections?view=sql-server-ver17).
[^b03c02-arc-servers]: Microsoft Learn, [Azure Arc-enabled servers overview](https://learn.microsoft.com/en-us/azure/azure-arc/servers/overview).
[^b03c02-create-login]: Microsoft Learn, [CREATE LOGIN (Transact-SQL)](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-login-transact-sql?view=sql-server-ver17).
[^b03c02-entra-sql]: Microsoft Learn, [Microsoft Entra authentication for SQL Server overview](https://learn.microsoft.com/en-us/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview?view=sql-server-ver17).
