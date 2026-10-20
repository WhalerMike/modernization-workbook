---
title: "Appendix B — Security-Approval (ATO) Kit"
subtitle: "Boundary diagram, outbound endpoints, FedRAMP audit scope, Graph permission justification, token-folder mitigation, break-glass design and a licensing bill of materials"
description: "Material a system owner and ISSO can adapt for the system security plan when SQL Server moves to Microsoft Entra authentication through Azure Arc. Every platform fact is sourced to Microsoft documentation and stamped as of 19 October 2026. It supports an authorization decision; it does not make one."
doc-type: sql-server-narrative-book
audience: [Executive, Technical, Customer]
family: sql-server-narrative
series-order: 13
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

::: {.content-visible when-format="docx"}
# Appendix B — Security-Approval (ATO) Kit
:::

::: {.callout-important}
## Supports an authorization decision; doesn't make one
The authorization boundary, interconnection and leveraged-authorization language, and the risk decision belong to the agency's authorizing official. This kit collects the facts an assessor will ask for. Platform facts were checked on 19 October 2026 and apply to Microsoft's commercial cloud, including GCC-Moderate; see [Applicability](Applicability.md) for GCC High and DoD.
:::

::: {.callout-tip}
## Download this appendix
**[Appendix_B-bundle.docx](../../../downloads/Appendix_B-bundle.docx)** — this appendix as one Word document. Regenerated on every site deploy.
:::

## Boundary

![What runs inside the agency boundary and what it reaches outside it.](../../images/sql-server/diagrams/svg/appendix-b-boundary.svg){fig-alt="Inside the agency boundary: users and applications, and the SQL Server host running the engine, the Connected Machine agent with its local endpoint, and the Azure extension for SQL Server. Outside, in Microsoft's commercial cloud: Microsoft Entra ID, Microsoft Graph, Azure Resource Manager, Arc services and Key Vault (SQL Server 2022 only). The host reaches them over outbound HTTPS on TCP 443; clients sign in to Entra ID and present the token to SQL Server over TDS."}

The SQL Server host stays inside the boundary. What changes is that it now depends on leveraged cloud services: Microsoft Entra ID for tokens, Microsoft Graph for lookups of users, groups and applications, and the Azure Arc services for the agent and the SQL extension. The Connected Machine agent communicates outbound to Azure Arc over TCP port 443.[^ab-netreq] Azure Private Link can carry the Arc service traffic, but "network traffic to Microsoft Entra ID and Azure Resource Manager doesn't traverse the Azure Arc private link scope and continues to use your default network route to the internet."[^ab-pl]

## Outbound endpoints

From Microsoft's network requirements for the Connected Machine agent (Azure public cloud) and the prerequisites for SQL Server enabled by Azure Arc:[^ab-netreq] [^ab-sqlprereq]

| Endpoint | Purpose | When required |
|---|---|---|
| `download.microsoft.com` | Windows installation package | Installation only |
| `login.microsoftonline.com` | Global Microsoft Entra token endpoint (onboarding and fallback) | Always |
| `*.login.microsoft.com` | Regional Microsoft Entra token endpoints | Always |
| `pas.windows.net` | Microsoft Entra ID | Always |
| `management.azure.com` | Azure Resource Manager: create or delete the Arc server resource | Connect or disconnect only |
| `*.his.arc.azure.com` | Metadata and hybrid identity services | Always |
| `*.guestconfiguration.azure.com` | Extension management and guest configuration | Always |
| `guestnotificationservice.azure.com`, `*.guestnotificationservice.azure.com` | Notification service | Always |
| `azgn*.servicebus.windows.net` or `*.servicebus.windows.net` | Notification service | Always |
| `*.<region>.arcdataservices.com` | Arc data processing service for Arc-enabled SQL Server | If Arc-enabled SQL Server is used |
| `<key-vault-name>.vault.azure.net`, `graph.microsoft.com` | Microsoft Entra authentication with Arc-enabled SQL Server | If Arc-enabled SQL Server is used |

Use Microsoft's page, not this table, as the firewall source of truth: it lists optional endpoints (Windows Admin Center, SSH, ESU certificates, license validation) and changes over time.

## FedRAMP audit scope of each leveraged service

Microsoft's compliance-scope page lists each of these Azure public-cloud services as in scope for FedRAMP High (page dated 21 September 2026):[^ab-fedramp]

| Service | Role in this design | FedRAMP High (Azure public) |
|---|---|---|
| Microsoft Entra ID (P1 + P2) and Microsoft Entra multifactor authentication | Tokens, Conditional Access, MFA, sign-in logs | ✅ |
| Microsoft Entra ID Governance | PIM for Groups, access reviews (Book 07) | ✅ |
| Microsoft Graph | Instance-identity lookups | ✅ |
| Azure Arc-enabled servers | Connected Machine agent, managed identity | ✅ |
| Azure Arc-enabled SQL Server | Azure extension for SQL Server | ✅ |
| Azure Resource Manager | Arc resources | ✅ |
| Key Vault | SQL Server 2022 certificate | ✅ |
| Azure Monitor (incl. Log Analytics) | Telemetry (Book 09) | ✅ |
| Microsoft Defender for Cloud | Defender for SQL (Book 09) | ✅ |
| Microsoft Intune | Cloud PKI (Book 10) | ✅ |

An audit-scope listing is not the agency's authorization. Leveraging a provider authorization still needs the agency's own review of the package and of customer responsibilities.

## Graph permissions for each machine identity

**What is required.** "Each system-assigned managed identity requires `User.Read.All`, `GroupMember.Read.All`, and `Application.Read.All` permissions to query Microsoft Graph." They are application permissions (app roles) that "must be assigned directly to each managed identity" and "can't be manually assigned to a Microsoft Entra security group." Only a Privileged Role Administrator or higher can grant them.[^ab-misetup] The SQL Server 2022 app-registration setup documents either `Directory.Read.All` or the narrower set `Application.Read.All`, `Group.Read.All` and `User.Read.All`; choose the narrower set.[^ab-appreg]

**Least-privilege justification.**

- `User.Read.All` resolves the Entra users that `CREATE LOGIN … FROM EXTERNAL PROVIDER` names and that connect.
- `GroupMember.Read.All` resolves group membership for type-X (group) logins, which is how Book 07 grants access.
- `Application.Read.All` resolves service principals and managed identities that connect as applications (Book 08).
- All three are read-only. None grants write access to the directory.

**Why not Directory Readers.** Microsoft offers assigning the Directory Readers role to a role-assignable group as an alternative for many machines, but notes that it "grants broad read access across all directory objects, significantly exceeding the three targeted Graph API permissions," and that it "isn't recommended for production environments where least-privilege access is required."[^ab-misetup] Grant the three app roles to each identity with a script, and review the grants with the rest of the access reviews.

## Token folder and BULK permissions

Microsoft documents that "OPENROWSET BULK operations can also read the tokens folder `C:\ProgramData\AzureConnectedMachineAgent\Tokens\`," and that the `ADMINISTER BULK OPERATIONS` and `ADMINISTER DATABASE BULK OPERATIONS` permissions "should be treated as equivalent to sysadmin."[^ab-miov] The mitigation:

- Grant either permission only to principals that already hold `sysadmin`, and record any exception in the exception registry.
- Include both permissions in the audit's privileged-permission report and in SQL Server Audit, alongside `sysadmin` membership.
- The agent's local identity endpoint requires the caller to be in the local Administrators group or the Hybrid Agent Extension Applications group,[^ab-miauth] so manage those memberships as privileged.

## Break-glass design

| Failure | Design |
|---|---|
| Entra ID or Graph unreachable | Entra logins can't authenticate. Keep one documented break-glass path: a Windows group holding `sysadmin`, empty by default, in the exception registry, with every membership change and every login alerting. |
| Every `sysadmin` path lost | Microsoft documents starting the instance in single-user mode; a member of the computer's local Administrators group can then connect as `sysadmin`.[^ab-lockout] That is why local Administrators membership on SQL hosts is itself privileged. |
| Tenant-side lockout | Follow Microsoft's emergency-access account guidance for the Entra tenant.[^ab-emergency] |
| Pressure to turn Entra authentication off | Microsoft states that once Entra authentication is enabled with a managed identity, disabling it isn't advisable, and forcibly deleting registry entries can cause unpredictable behavior.[^ab-miov] Recover through the paths above instead. |

## Licensing bill of materials

List prices change and agreements differ, so this table names the license each capability needs, not its price.

| Book | Capability | License | Source |
|---|---|---|---|
| 02–03 | Arc inventory and the audit | SQL Server license; Arc's client connection summary needs Software Assurance, a SQL Server subscription or pay-as-you-go | [^ab-arcov] |
| 04–05 | Entra authentication on the engine | Available with "License only" — no Software Assurance or pay-as-you-go needed | [^ab-arcov] |
| 04 | SQL Server 2022 certificate | Azure Key Vault (consumption) | [^ab-appreg] |
| 05, 07, 09 | Conditional Access (MFA, device, location, risk) | Microsoft Entra ID P1 | [^ab-ca] |
| 07 | Dynamic membership groups | Microsoft Entra ID P1 for each unique member | [^ab-dyn] |
| 07 | PIM for Groups | Microsoft Entra ID P2, ID Governance or Entra Suite | [^ab-lic] |
| 07 | Access reviews | Microsoft Entra ID Governance or Entra Suite | [^ab-ar] |
| 09 | Defender for SQL servers on machines | A Microsoft Defender for Cloud plan | [^ab-def] |
| 09 | Log Analytics | Azure Monitor (consumption) | — |
| 10 | Microsoft Cloud PKI | Intune add-on, standalone or in the Intune Suite | [^ab-pki] |

[^ab-netreq]: Microsoft Learn, [Connected Machine agent network requirements](https://learn.microsoft.com/en-us/azure/azure-arc/servers/network-requirements). Checked 19 October 2026.
[^ab-pl]: Microsoft Learn, [Use Azure Private Link to connect servers to Azure Arc by using a private endpoint](https://learn.microsoft.com/en-us/azure/azure-arc/servers/private-link-security).
[^ab-sqlprereq]: Microsoft Learn, [Prerequisites — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/prerequisites?view=sql-server-ver17).
[^ab-fedramp]: Microsoft Learn, [Azure and other Microsoft cloud services compliance scope](https://learn.microsoft.com/en-us/azure/azure-government/compliance/azure-services-in-fedramp-auditscope), "Azure public services by audit scope". Checked 19 October 2026.
[^ab-misetup]: Microsoft Learn, [Set up managed identity and Microsoft Entra authentication for SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/microsoft-entra-authentication-with-managed-identity?view=sql-server-ver17), "Grant application permissions to the identity".
[^ab-appreg]: Microsoft Learn, [Set up Microsoft Entra authentication with app registration — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/entra-authentication-setup-tutorial?view=sql-server-ver17).
[^ab-miov]: Microsoft Learn, [Managed identity overview — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/managed-identity?view=sql-server-ver17), Limitations.
[^ab-miauth]: Microsoft Learn, [Access Azure resources with managed identity on Azure Arc-enabled servers](https://learn.microsoft.com/en-us/azure/azure-arc/servers/managed-identity-authentication).
[^ab-lockout]: Microsoft Learn, [Connect to SQL Server when system administrators are locked out](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/connect-to-sql-server-when-system-administrators-are-locked-out?view=sql-server-ver17).
[^ab-emergency]: Microsoft Learn, [Manage emergency access admin accounts](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/security-emergency-access).
[^ab-arcov]: Microsoft Learn, [Overview — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/overview?view=sql-server-ver17), feature availability by license type.
[^ab-ca]: Microsoft Learn, [What is Conditional Access?](https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview), License requirements.
[^ab-dyn]: Microsoft Learn, [Manage rules for dynamic membership groups in Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-membership), License requirements.
[^ab-lic]: Microsoft Learn, [Microsoft Entra ID Governance licensing fundamentals](https://learn.microsoft.com/en-us/entra/id-governance/licensing-fundamentals).
[^ab-ar]: Microsoft Learn, [What are access reviews?](https://learn.microsoft.com/en-us/entra/id-governance/access-reviews-overview), License requirements.
[^ab-def]: Microsoft Learn, [Microsoft Defender for SQL servers on machines overview](https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-sql-on-machines-overview).
[^ab-pki]: Microsoft Learn, [Microsoft Cloud PKI for Microsoft Intune](https://learn.microsoft.com/en-us/intune/intune-service/protect/microsoft-cloud-pki-overview).

::: {.callout-tip}
## Continue the series
[← Previous: Appendix A — Requirements Mapping](Appendix_A_Requirements_Mapping.md) · [Index](index.md)
:::
