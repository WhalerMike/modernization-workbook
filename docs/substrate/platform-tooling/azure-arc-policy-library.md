---
title: "the modernization program Azure Arc Policy Library"
subtitle: "Azure Policy definitions for Arc-enabled servers"
doc-type: policy-library
audience: [Customer, Technical]
author: Michael Stratton
date: "April 2026"
status: Active
canon-source: "inbox/Posted/the modernization program Azure Arc Policy Library.docx"
repo-path: docs/customer-documents/substrate/platform-tooling/azure-arc-policy-library.qmd
created-at: 2026-04-26
updated-at: 2026-04-26
format:
  html:
    toc: true
    toc-depth: 3
  docx:
    toc: true
lifecycle: adopted
tiers_adopted: [1]
lifecycle_review: 2026-11-22
---

![Azure Arc integration topology (AD to Arc to Azure Policy)](images/azure-arc-policy-library-image-01-azure-arc-integration-topology-a.png){#fig-azure-arc-policy-library-image-01 fig-alt="Azure Arc integration topology (AD to Arc to Azure Policy). Engineering blueprint style, neutral slate background, federal navy (#1F3A5F) for primary structural elements, teal (#1A9E8F) for secondary/integration elements, amber (#D4A017) for governance/audit/registry overlays, monospace labels for identifiers, no human figures, 16:9 landscape." width="100%"}

![the organizational-attribute model-tag mapping flow](images/azure-arc-policy-library-image-02-orgpath-tag-mapping-flow.png){#fig-azure-arc-policy-library-image-02 fig-alt="the organizational-attribute model-tag mapping flow. Engineering blueprint style, neutral slate background, federal navy (#1F3A5F) for primary structural elements, teal (#1A9E8F) for secondary/integration elements, amber (#D4A017) for governance/audit/registry overlays, monospace labels for identifiers, no human figures, 16:9 landscape." width="100%"}


the modernization program Azure Arc Policy Library

Governance OS Modernization Program --- Azure Policy Definitions for Arc-Enabled Servers

**Classification:** Controlled

**Boundary:** GCC-Moderate (Azure Arc in Commercial Cloud --- Explicit Exception)

**Version:** 1.0

**Date:** April 21, 2026

**Author:** the modernization program Governance Engineering

**Repository:** https://github.com/WhalerMike/uiao

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **BOUNDARY NOTICE**                                                                                                                                                                                                                                                                                                                                         |
|                                                                                                                                                                                                                                                                                                                                                             |
| the modernization program operates within a GCC-Moderate environment for Microsoft 365 SaaS services. Azure Arc runs in Commercial Cloud under an explicit, documented exception to the GCC-Moderate boundary. All Azure Policy definitions in this library target the Commercial Cloud Azure control plane. Data classification for all managed servers remains **Controlled**. |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

Table of Contents

1.  Executive Summary

2.  Azure Arc Overview for the modernization program

3.  Arc Agent Deployment Policies

4.  Tagging and the organizational-attribute model Policies

5.  Security Baseline Policies

6.  Compliance and Governance Policies

7.  Monitoring and Logging Policies

8.  Network Security Policies

9.  the modernization program-Specific Governance Policies

10. Policy Initiative (Policy Set) Definitions

11. Deployment Guide

12. Compliance Reporting

13. Remediation Playbooks

14. Appendix A: Policy Definition JSON Templates

15. Appendix B: the organizational-attribute model Tag Mapping Reference

16. Appendix C: Guest Configuration Package Development

1\. Executive Summary

Azure Arc extends cloud-native governance capabilities to on-premises and multi-cloud server environments, providing a unified management plane that eliminates the divide between cloud-hosted and traditionally managed infrastructure. For the the modernization program Governance OS modernization program, Azure Arc serves as the critical bridge between Active Directory--managed servers and the Entra ID / Intune governance plane that underpins modern identity and device management.

This document provides a comprehensive library of ready-to-deploy Azure Policy definitions purpose-built for the the modernization program modernization pipeline. These policies enforce consistent governance across all Arc-enabled servers, ensuring that every machine brought into the the modernization program management scope meets established standards for security, compliance, operational health, and organizational taxonomy.

The policy library is organized across five governance domains:

- **Inventory & Agent Health** --- Ensure the Connected Machine Agent is deployed, current, and reporting

- **Security** --- Enforce security baselines, endpoint protection, TLS compliance, and local account controls

- **Compliance** --- Validate operating system currency, patch status, encryption, and backup enrollment

- **Monitoring** --- Deploy Azure Monitor Agent, associate Log Analytics workspaces, and collect governance-critical logs

- **Tagging & the organizational-attribute model** --- Enforce the modernization program organizational taxonomy via Arc resource tags mapped to the organizational-attribute model extension attributes

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **ENVIRONMENT CONTEXT**                                                                                                                                                                                                                                                                                                                                                                                                        |
|                                                                                                                                                                                                                                                                                                                                                                                                                                |
| the modernization program operates within a GCC-Moderate boundary for all Microsoft 365 SaaS services. Azure Arc is deployed in Commercial Cloud under an explicit exception documented in the the modernization program architecture decision record. This library targets the Commercial Cloud Azure Policy engine. All 24 policy definitions and 3 policy initiatives defined herein are maintained in the the modernization program repository at **https://github.com/WhalerMike/uiao**. |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

2\. Azure Arc Overview for the modernization program

2.1 What Azure Arc Provides

Azure Arc projects on-premises and multi-cloud servers as first-class Azure resources, enabling organizations to apply cloud-native governance constructs --- Azure Policy, Microsoft Defender for Cloud, Azure Monitor, and Azure Automation --- to infrastructure that resides outside of Azure. Each Arc-enabled server appears in the Azure portal with a resource ID, enabling consistent policy assignment, compliance tracking, and operational monitoring across the entire estate.

2.2 Arc-Enabled Servers in the modernization program

The the modernization program program targets Windows Server environments running the Connected Machine Agent. Supported operating systems include:

  -------------------------------------------------------------------------------------------------------------
  **Operating System**                 **Support Status**    **Notes**
  ------------------------------------ --------------------- --------------------------------------------------
  Windows Server 2025                  Fully Supported       Preferred target for new deployments

  Windows Server 2022                  Fully Supported       Primary production OS

  Windows Server 2019                  Fully Supported       Migration candidate

  Windows Server 2016                  Supported (Limited)   Extended Security Updates; upgrade path required

  Windows Server 2012 R2 and earlier   Not Supported         End of support --- blocked by the modernization program policy
  -------------------------------------------------------------------------------------------------------------

2.3 Integration Points

- **Azure Policy** --- Enforce governance at scale; audit, deny, modify, or deploy configurations

- **Microsoft Defender for Cloud** --- Security posture management and threat protection

- **Azure Monitor** --- Log collection, performance metrics, and alerting via Azure Monitor Agent

- **Azure Automation** --- Update management, change tracking, and runbook execution

- **Azure Update Manager** --- Patch assessment and deployment orchestration

- **Guest Configuration (Machine Configuration)** --- In-guest policy evaluation for OS-level settings

2.4 the modernization program Use Case

Azure Arc serves the specific the modernization program need of extending governance to servers that cannot be fully Entra-joined. This includes Domain Controllers, Certificate Authority servers, legacy line-of-business application servers, and other infrastructure that must remain domain-joined to Active Directory. Arc provides a parallel governance plane that does not disrupt AD authentication or Group Policy processing while enabling centralized compliance visibility and automated remediation.

2.5 Relationship to the modernization program the organizational-attribute model

The the modernization program the organizational-attribute model taxonomy --- implemented via Entra ID extension attributes --- is projected onto Arc-enabled server resources as Azure resource tags. This mapping ensures that organizational context (Region, Site, Department, Device Tier, Environment, and Device Role) follows each server from Active Directory through Arc into the Azure governance plane, enabling scoped policy assignments and compliance reporting by organizational segment.

3\. Arc Agent Deployment Policies

These policies ensure that the Azure Connected Machine Agent is properly deployed, current, and actively communicating with the Azure control plane across all servers in the the modernization program management scope.

Policy 3.1: Arc Agent Installation Verification

**the modernization program-Arc-AgentInstalled**

Effect: AuditIfNotExists \| Category: Agent Deployment \| Severity: High

**Description:** Audits Windows servers that do not have the Azure Connected Machine Agent installed. This policy targets all server organizational units identified during the the modernization program Active Directory assessment phase and reports non-compliant resources to the governance dashboard.

**Scope:** All server OUs identified in the AD assessment inventory.

**Remediation:** Deploy the Connected Machine Agent using the the modernization program deployment script (Install-the modernization programArcAgent.ps1) from the the modernization program repository. The script handles service principal authentication, proxy configuration, and tag assignment from the organizational-attribute model attributes.

Policy 3.2: Arc Agent Version Compliance

**the modernization program-Arc-AgentVersion**

Effect: Audit \| Category: Agent Deployment \| Severity: Medium

**Description:** Ensures the Connected Machine Agent is running at or above the minimum required version. Outdated agents may lack security patches, feature support, or compatibility with current Guest Configuration packages.

  ----------------------------------------------------------------------------
  **Parameter**    **Type**   **Default**   **Description**
  ---------------- ---------- ------------- ----------------------------------
  minimumVersion   String     1.38          Minimum acceptable agent version

  ----------------------------------------------------------------------------

**Remediation:** Update the agent via Azure Automation runbook or manual update using the the modernization program agent update script.

Policy 3.3: Arc Agent Connectivity Status

**the modernization program-Arc-ConnectivityHealth**

Effect: Audit \| Category: Agent Deployment \| Severity: High

**Description:** Audits Arc-enabled servers that have not reported a heartbeat within the configured threshold. Stale connections indicate network issues, agent crashes, or decommissioned servers still registered as Arc resources.

  -----------------------------------------------------------------------------------------------------------
  **Parameter**   **Type**   **Default**   **Description**
  --------------- ---------- ------------- ------------------------------------------------------------------
  maxStaleHours   Integer    24            Maximum hours since last heartbeat before flagging non-compliant

  -----------------------------------------------------------------------------------------------------------

**Remediation:** Investigate connectivity on the server; verify proxy settings, firewall rules for \*.his.arc.azure.com, and agent service status (himds).

4\. Tagging and the organizational-attribute model Policies

the modernization program the organizational-attribute model tags are the foundational taxonomy for scoped governance. These policies enforce that every Arc-enabled server carries the required organizational metadata, that tag values conform to the allowed taxonomy, and that inheritance rules maintain consistency across the resource hierarchy.

Policy 4.1: Required the modernization program Tags

**the modernization program-Arc-RequiredTags**

Effect: Deny \| Category: Tagging \| Severity: Critical

**Description:** Enforces that all Arc-enabled server resources carry the six required the modernization program the organizational-attribute model tags. Resources missing any required tag will be denied creation or modification until tags are supplied.

**Required Tags:**

  --------------------------------------------------------------------
  **Tag Name**       **the organizational-attribute model Attribute**   **Extension Attribute**
  ------------------ ----------------------- -------------------------
  uiao-region        Region                  extensionAttribute1

  uiao-site          Site                    extensionAttribute2

  uiao-department    Department              extensionAttribute3

  uiao-device-tier   DeviceTier              extensionAttribute4

  uiao-environment   Environment             extensionAttribute5

  uiao-device-role   DeviceRole              extensionAttribute6
  --------------------------------------------------------------------

Policy 4.2: Tag Value Validation

**the modernization program-Arc-TagValues**

Effect: Deny \| Category: Tagging \| Severity: Critical

**Description:** Validates that each the modernization program tag value conforms to the allowed taxonomy. Prevents free-text or misspelled values that would fragment governance reporting and policy scoping.

**Allowed Values by Tag:**

  -------------------------------------------------------------------------------------------------------------------------
  **Tag**            **Allowed Values**
  ------------------ ------------------------------------------------------------------------------------------------------
  uiao-region        East, West, Central, Global

  uiao-device-tier   Tier0, Tier1, Tier2

  uiao-environment   Production, Staging, Dev, DR

  uiao-device-role   DomainController, MemberServer, GitServer, AppServer, FileServer, DatabaseServer, Workstation, Kiosk
  -------------------------------------------------------------------------------------------------------------------------

**Note:** uiao-site and uiao-department values are organization-specific and validated against a parameter array that must be populated during policy assignment based on the the modernization program AD assessment output.

Policy 4.3: Tag Inheritance from Resource Group

**the modernization program-Arc-TagInheritance**

Effect: Modify \| Category: Tagging \| Severity: Low

**Description:** Automatically inherits uiao-region and uiao-environment tags from the parent resource group if these tags are not already set on the Arc-enabled server resource. This ensures baseline organizational context even when agent deployment scripts do not supply all tags.

**Behavior:** Uses the Modify effect with a managed identity to add missing tags. Existing tag values on the resource are never overwritten.

5\. Security Baseline Policies

Security baseline policies enforce hardening standards on Arc-enabled servers using Azure Policy Guest Configuration (Machine Configuration). These policies evaluate in-guest operating system settings and report compliance without requiring Group Policy modifications.

Policy 5.1: Windows Security Baseline via Guest Configuration

**the modernization program-Arc-SecurityBaseline**

Effect: AuditIfNotExists \| Category: Security \| Severity: Critical

**Description:** Applies the Windows Server 2022/2025 security baseline via Azure Policy Guest Configuration. The baseline maps to CIS Level 1 benchmarks and the Microsoft Security Baseline, evaluating server configuration against established security standards.

**Audit Areas:**

- **Password Policy** --- Minimum length, complexity, history, maximum age

- **Audit Policy** --- Logon events, account management, policy changes, privilege use

- **Windows Firewall** --- Profile state, default actions, logging configuration

- **User Rights Assignment** --- Logon rights, privilege assignments, deny policies

- **Security Options** --- Interactive logon settings, network security, UAC configuration

Policy 5.2: Endpoint Protection Verification

**the modernization program-Arc-EndpointProtection**

Effect: AuditIfNotExists \| Category: Security \| Severity: Critical

**Description:** Verifies that Microsoft Defender for Endpoint is installed, operational, and reporting to the security console. Servers without active endpoint protection represent a critical gap in the the modernization program security posture.

**Compliance Checks:**

- Defender for Endpoint service (MsSense) is running

- Antimalware definitions are current (updated within the last 7 days)

- Real-time protection is enabled and active

Policy 5.3: TLS Configuration

**the modernization program-Arc-TLSCompliance**

Effect: Audit \| Category: Security \| Severity: High

**Description:** Audits server TLS configuration to ensure TLS 1.2 is enforced and legacy protocols (TLS 1.0, TLS 1.1, SSL 3.0) are disabled. Uses a Guest Configuration package that validates the relevant registry keys under HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols.

**Validated Registry Settings:**

  -------------------------------------------------------------------------
  **Protocol**   **Expected State**   **Registry Path (Server\\Enabled)**
  -------------- -------------------- -------------------------------------
  TLS 1.2        Enabled (1)          \...\\Protocols\\TLS 1.2\\Server

  TLS 1.1        Disabled (0)         \...\\Protocols\\TLS 1.1\\Server

  TLS 1.0        Disabled (0)         \...\\Protocols\\TLS 1.0\\Server

  SSL 3.0        Disabled (0)         \...\\Protocols\\SSL 3.0\\Server
  -------------------------------------------------------------------------

Policy 5.4: Local Administrator Management

**the modernization program-Arc-LocalAdminControl**

Effect: AuditIfNotExists \| Category: Security \| Severity: High

**Description:** Audits local administrator group membership via Guest Configuration. Flags servers with non-standard local administrator accounts --- any account in the local Administrators group beyond the built-in Administrator, the domain Admins group, and explicitly approved the modernization program service accounts.

**Remediation:** Review flagged accounts; remove unauthorized members from local Administrators group using LAPS or the modernization program privileged access procedures.

Policy 5.5: Certificate Hygiene

**the modernization program-Arc-CertificateExpiry**

Effect: Audit \| Category: Security \| Severity: Medium

**Description:** Audits servers with certificates in the Local Machine certificate store that are expiring within the configured threshold. Expired certificates cause service outages, authentication failures, and TLS errors.

  --------------------------------------------------------------------------------------------
  **Parameter**         **Type**   **Default**   **Description**
  --------------------- ---------- ------------- ---------------------------------------------
  expiryThresholdDays   Integer    30            Days before expiry to flag as non-compliant

  --------------------------------------------------------------------------------------------

6\. Compliance and Governance Policies

These policies enforce organizational compliance requirements across the the modernization program server estate, covering operating system currency, patch management, disk encryption, backup enrollment, and time synchronization.

Policy 6.1: Operating System Compliance

**the modernization program-Arc-OSCompliance**

Effect: Audit \| Category: Compliance \| Severity: High

**Description:** Audits servers running unsupported operating systems. Only Windows Server versions within the Microsoft support lifecycle are permitted in the the modernization program environment.

  ---------------------------------------------------------------------------
  **Status**   **Operating Systems**
  ------------ --------------------------------------------------------------
  Allowed      Windows Server 2016, 2019, 2022, 2025

  Blocked      Windows Server 2012 R2 and earlier (end of extended support)
  ---------------------------------------------------------------------------

**Remediation:** Initiate OS upgrade via the the modernization program migration pipeline. Servers on unsupported operating systems must have a documented upgrade plan with a target completion date.

Policy 6.2: Patch Compliance

**the modernization program-Arc-PatchCompliance**

Effect: AuditIfNotExists \| Category: Compliance \| Severity: Critical

**Description:** Verifies that servers are enrolled in Azure Update Manager and are patch-current according to the modernization program SLA requirements.

**Compliance Thresholds:**

- **Critical patches:** Must be applied within 14 days of release

- **All other patches:** Must be applied within 30 days of release

**Remediation:** Enroll the server in Azure Update Manager via the the modernization program onboarding script. Schedule maintenance windows aligned with the server\'s uiao-environment tag.

Policy 6.3: Disk Encryption

**the modernization program-Arc-DiskEncryption**

Effect: Audit \| Category: Compliance \| Severity: High

**Description:** Audits servers that do not have BitLocker enabled on the operating system volume. Disk encryption protects data at rest in the event of physical media theft or decommissioning.

**Exemptions:** Domain Controllers are exempt from BitLocker enforcement per Microsoft guidance, as BitLocker can interfere with Active Directory boot and recovery scenarios. Exemptions must be documented in the the modernization program policy exemption register.

Policy 6.4: Backup Verification

**the modernization program-Arc-BackupCompliance**

Effect: AuditIfNotExists \| Category: Compliance \| Severity: High

**Description:** Verifies that servers are enrolled in an approved backup solution and that the most recent recovery point is less than 24 hours old. Servers without current backups represent a data loss risk.

**Remediation:** Enroll the server in the organization\'s backup solution and verify that backup jobs are completing successfully. Investigate and resolve any backup failures flagged by the policy.

Policy 6.5: NTP Configuration

**the modernization program-Arc-TimeSync**

Effect: Audit \| Category: Compliance \| Severity: Medium

**Description:** Verifies that servers are configured for proper time synchronization. Accurate time is essential for Kerberos authentication, log correlation, and certificate validation.

**Expected Configuration:**

- **Domain-joined servers:** Syncing time from a Domain Controller via NT5DS

- **Standalone servers:** Syncing from a known, approved NTP source via NTP client

7\. Monitoring and Logging Policies

Monitoring policies automate the deployment and configuration of the Azure Monitor Agent and associated data collection infrastructure. These policies use the DeployIfNotExists effect to automatically remediate non-compliant resources, ensuring continuous log ingestion into the the modernization program governance pipeline.

Policy 7.1: Azure Monitor Agent Deployment

**the modernization program-Arc-AMADeployment**

Effect: DeployIfNotExists \| Category: Monitoring \| Severity: High

**Description:** Automatically deploys the Azure Monitor Agent (AMA) extension on Arc-enabled servers that do not have it installed. Associates the deployed agent with the the modernization program data collection rule for governance log ingestion.

**Behavior:** When a non-compliant Arc-enabled server is detected, a remediation task is triggered that installs the AzureMonitorWindowsAgent extension and configures the data collection rule association.

Policy 7.2: Log Analytics Workspace Association

**the modernization program-Arc-LAWorkspace**

Effect: DeployIfNotExists \| Category: Monitoring \| Severity: High

**Description:** Associates Arc-enabled servers with the designated the modernization program Log Analytics workspace. Ensures all governance and operational logs flow to a centralized location for analysis, alerting, and compliance reporting.

  -------------------------------------------------------------------------------------------
  **Parameter**   **Type**   **Default**    **Description**
  --------------- ---------- -------------- -------------------------------------------------
  workspaceId     String     *(Required)*   Resource ID of the the modernization program Log Analytics workspace

  -------------------------------------------------------------------------------------------

Policy 7.3: Diagnostic Settings

**the modernization program-Arc-Diagnostics**

Effect: DeployIfNotExists \| Category: Monitoring \| Severity: Medium

**Description:** Enables diagnostic settings on the Arc-enabled server Azure resource to capture platform-level operational telemetry.

**Collected Log Categories:**

- Administrative logs --- Resource management operations

- Security events --- Authentication and authorization events

- Operational events --- Agent health, extension operations, policy evaluation

Policy 7.4: Windows Event Log Collection

**the modernization program-Arc-EventLogCollection**

Effect: AuditIfNotExists \| Category: Monitoring \| Severity: High

**Description:** Verifies that Security, System, and Application event logs are being collected and forwarded to the the modernization program Log Analytics workspace. The data collection rule targets governance-critical event IDs.

**Critical Event IDs:**

  --------------------------------------------------------------------
  **Event ID**   **Log**    **Description**
  -------------- ---------- ------------------------------------------
  4624           Security   Successful logon

  4625           Security   Failed logon attempt

  4648           Security   Logon using explicit credentials

  4672           Security   Special privileges assigned to new logon

  4688           Security   New process created

  4720           Security   User account created

  4726           Security   User account deleted

  7045           System     New service installed
  --------------------------------------------------------------------

8\. Network Security Policies

Network security policies audit server-level network configurations that affect the attack surface. These policies use Guest Configuration packages to validate Windows Firewall state, remote access configuration, and legacy protocol status.

Policy 8.1: Windows Firewall State

**the modernization program-Arc-FirewallState**

Effect: Audit \| Category: Network Security \| Severity: High

**Description:** Verifies that Windows Firewall is enabled for all three network profiles: Domain, Private, and Public. A disabled firewall on any profile exposes the server to unauthorized network traffic.

**Guest Configuration Checks:**

- Domain Profile: Firewall State = On

- Private Profile: Firewall State = On

- Public Profile: Firewall State = On

Policy 8.2: Remote Desktop Configuration

**the modernization program-Arc-RDPSecurity**

Effect: Audit \| Category: Network Security \| Severity: High

**Description:** Audits Remote Desktop Protocol (RDP) configuration to ensure secure remote access. Servers with RDP enabled must enforce Network Level Authentication (NLA) and restrict connections to authorized users.

**Compliance Checks:**

- Network Level Authentication (NLA) is enabled

- RDP port configuration (3389 default or documented custom port)

- Connection restrictions are configured (authorized users/groups only)

Policy 8.3: SMB Configuration

**the modernization program-Arc-SMBSecurity**

Effect: Audit \| Category: Network Security \| Severity: High

**Description:** Verifies that SMBv1 is disabled and SMB signing is required. SMBv1 is a legacy protocol with known vulnerabilities (including EternalBlue/WannaCry); SMB signing prevents man-in-the-middle attacks on file share traffic.

**Guest Configuration Registry Checks:**

  ----------------------------------------------------------------------------------------------------------------------------------------------------------
  **Setting**                     **Registry Path**                                                                                     **Expected Value**
  ------------------------------- ----------------------------------------------------------------------------------------------------- --------------------
  SMBv1 Disabled                  HKLM:\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters\\SMB1                            0

  SMB Signing Required (Server)   HKLM:\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters\\RequireSecuritySignature        1

  SMB Signing Required (Client)   HKLM:\\SYSTEM\\CurrentControlSet\\Services\\LanmanWorkstation\\Parameters\\RequireSecuritySignature   1
  ----------------------------------------------------------------------------------------------------------------------------------------------------------

9\. the modernization program-Specific Governance Policies

These policies are unique to the the modernization program Governance OS and validate program-specific configurations, including Gitea server compliance, assessment data freshness, governance hook integrity, and the modernization program module versioning.

Policy 9.1: Git Server Compliance

**the modernization program-Arc-GitServerCompliance**

Effect: Audit \| Category: the modernization program Governance \| Severity: High

**Description:** For servers tagged uiao-device-role=GitServer, verifies that the Gitea service is installed and operational, that the IIS reverse proxy is configured and responding, and that Git governance hooks are present in the expected locations.

**Compliance Checks:**

- Gitea Windows service is running (gitea)

- IIS site is configured and responding on the expected port

- Git hooks directory contains required hook files (pre-receive, post-receive, update)

**Scope Condition:** This policy only evaluates servers where the uiao-device-role tag equals GitServer.

Policy 9.2: Assessment Data Currency

**the modernization program-Arc-AssessmentCurrency**

Effect: Audit \| Category: the modernization program Governance \| Severity: Medium

**Description:** Audits servers where the the modernization program assessment data is older than the configured threshold. Stale assessment data means the governance pipeline is operating on outdated inventory, risking drift between actual and recorded server state.

**Check Location:** D:\\the modernization program\\Assessment\\ --- evaluates file timestamps of assessment output artifacts.

  ---------------------------------------------------------------------------------------------------------------
  **Parameter**          **Type**   **Default**   **Description**
  ---------------------- ---------- ------------- ---------------------------------------------------------------
  maxAssessmentAgeDays   Integer    30            Maximum age (in days) before assessment data is flagged stale

  ---------------------------------------------------------------------------------------------------------------

Policy 9.3: Governance Hook Integrity

**the modernization program-Arc-HookIntegrity**

Effect: Audit \| Category: the modernization program Governance \| Severity: Critical

**Description:** Verifies that Git governance hooks (pre-receive, post-receive, update) on the modernization program Git servers are present and have not been tampered with. The policy computes content hashes of each hook file and compares them against expected hash values maintained in the policy parameters.

**Scope:** Servers tagged uiao-device-role=GitServer.

**Rationale:** Governance hooks enforce the the modernization program schema validation, the organizational-attribute model integrity checks, and audit trail generation. Tampered or missing hooks bypass the governance pipeline entirely.

Policy 9.4: the modernization program Module Version

**the modernization program-Arc-ModuleVersion**

Effect: Audit \| Category: the modernization program Governance \| Severity: Medium

**Description:** Verifies that the modernization program PowerShell modules installed on the server are at or above the minimum required version. The policy checks module manifest files in D:\\the modernization program\\Modules\\ for version information.

**Modules Checked:**

- the modernization programAssessment --- AD assessment and inventory collection

- the modernization programDriftDetection --- Configuration drift monitoring

- the modernization programGovernance --- Governance pipeline orchestration

- the modernization programRemediation --- Automated remediation actions

10\. Policy Initiative (Policy Set) Definitions

Policy initiatives group related policy definitions into logical sets for assignment as a single unit. The the modernization program policy library defines three initiatives that cover the full governance spectrum.

Initiative 10.1: the modernization program Governance Baseline

**the modernization program-GovernanceBaseline**

Type: Policy Initiative \| Assignment Scope: All Arc-enabled servers in the modernization program tenant

**Description:** The foundational policy set applied to every Arc-enabled server in the the modernization program environment. Combines security baseline, compliance, and monitoring policies to establish a minimum governance standard.

**Included Policies:**

  --------------------------------------------------------------
  **Policy**                    **Domain**   **Effect**
  ----------------------------- ------------ -------------------
  the modernization program-Arc-AgentInstalled       Agent        AuditIfNotExists

  the modernization program-Arc-AgentVersion         Agent        Audit

  the modernization program-Arc-ConnectivityHealth   Agent        Audit

  the modernization program-Arc-RequiredTags         Tagging      Deny

  the modernization program-Arc-TagValues            Tagging      Deny

  the modernization program-Arc-SecurityBaseline     Security     AuditIfNotExists

  the modernization program-Arc-EndpointProtection   Security     AuditIfNotExists

  the modernization program-Arc-TLSCompliance        Security     Audit

  the modernization program-Arc-OSCompliance         Compliance   Audit

  the modernization program-Arc-PatchCompliance      Compliance   AuditIfNotExists

  the modernization program-Arc-AMADeployment        Monitoring   DeployIfNotExists

  the modernization program-Arc-LAWorkspace          Monitoring   DeployIfNotExists

  the modernization program-Arc-EventLogCollection   Monitoring   AuditIfNotExists
  --------------------------------------------------------------

Initiative 10.2: the modernization program Tier0 Hardening

**the modernization program-Tier0Hardening**

Type: Policy Initiative \| Assignment Scope: Servers tagged uiao-device-tier=Tier0

**Description:** Enhanced security policy set for Tier0 servers --- Domain Controllers, Certificate Authority servers, and Git servers. Includes all Governance Baseline policies plus additional restrictions for privileged infrastructure.

**Additional Policies (beyond Governance Baseline):**

- **Internet Access Audit** --- Verify Tier0 servers have no direct internet access

- **Privileged Access Audit** --- Enhanced audit of privileged logon activity (Event IDs 4672, 4648)

- **Enhanced Logging** --- PowerShell script block logging, command-line process auditing

- **Local Admin Control** --- Zero non-standard local administrators permitted

- **Hook Integrity** --- Governance hook validation for Git servers

Initiative 10.3: the modernization program Operational Health

**the modernization program-OperationalHealth**

Type: Policy Initiative \| Assignment Scope: All Arc-enabled servers in the modernization program tenant

**Description:** Operational health initiative focused on ensuring servers remain monitored, patched, backed up, and connected. This initiative powers the the modernization program operational health dashboard and drift detection pipeline.

**Included Policies:**

- the modernization program-Arc-ConnectivityHealth --- Agent heartbeat monitoring

- the modernization program-Arc-AMADeployment --- Azure Monitor Agent presence

- the modernization program-Arc-LAWorkspace --- Log Analytics workspace association

- the modernization program-Arc-Diagnostics --- Diagnostic settings

- the modernization program-Arc-EventLogCollection --- Event log forwarding

- the modernization program-Arc-PatchCompliance --- Patch currency

- the modernization program-Arc-BackupCompliance --- Backup enrollment

- the modernization program-Arc-TimeSync --- NTP configuration

- the modernization program-Arc-AssessmentCurrency --- Assessment data freshness

- the modernization program-Arc-ModuleVersion --- the modernization program module version compliance

11\. Deployment Guide

11.1 Prerequisites

- Azure subscription with Contributor or Resource Policy Contributor role

- Arc-enabled servers enrolled in the the modernization program resource group structure

- Service principal or managed identity for remediation tasks (DeployIfNotExists policies)

- Log Analytics workspace provisioned for the the modernization program environment

- Azure CLI (2.50+) or Az PowerShell module (10.0+) installed

- Access to the the modernization program policy repository: https://github.com/WhalerMike/uiao

11.2 Resource Group Structure

The the modernization program policy library assumes the following resource group naming convention for Arc-enabled server resources:

  --------------------------------------------------------------------------------------------------------------------------
  rg-uiao-arc-{region}-{environment} Example: rg-uiao-arc-east-production rg-uiao-arc-west-staging rg-uiao-arc-central-dev

  --------------------------------------------------------------------------------------------------------------------------

11.3 Deployment Steps

**Step 1: Clone the the modernization program repository**

  -----------------------------------------------------------------------
  git clone https://github.com/WhalerMike/uiao.git cd uiao/policies/arc

  -----------------------------------------------------------------------

**Step 2: Deploy policy definitions (PowerShell)**

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| \# Connect to Azure Connect-AzAccount \# Set the target subscription Set-AzContext -SubscriptionId \"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| \<                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| subscription-id                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| \>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| \" \# Deploy all the modernization program policy definitions \$policyFiles = Get-ChildItem -Path \".\\definitions\" -Filter \"\*.json\" foreach (\$file in \$policyFiles) { \$policy = Get-Content \$file.FullName \| ConvertFrom-Json New-AzPolicyDefinition \` -Name \$policy.name \` -DisplayName \$policy.properties.displayName \` -Description \$policy.properties.description \` -Policy (\$policy.properties.policyRule \| ConvertTo-Json -Depth 20) \` -Parameter (\$policy.properties.parameters \| ConvertTo-Json -Depth 10) \` -Mode \$policy.properties.mode \` -Metadata (\$policy.properties.metadata \| ConvertTo-Json -Depth 5) } |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**Step 3: Deploy policy initiatives**

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  \# Deploy the Governance Baseline initiative New-AzPolicySetDefinition \` -Name \"the modernization program-GovernanceBaseline\" \` -DisplayName \"the modernization program Governance Baseline\" \` -PolicyDefinition (Get-Content \".\\initiatives\\governance-baseline.json\")

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**Step 4: Assign policies to target scope**

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| \# Assign the Governance Baseline initiative to a resource group New-AzPolicyAssignment \` -Name \"uiao-baseline-east-prod\" \` -DisplayName \"the modernization program Governance Baseline - East Production\" \` -PolicySetDefinition (Get-AzPolicySetDefinition -Name \"the modernization program-GovernanceBaseline\") \` -Scope \"/subscriptions/ |
|                                                                                                                                                                                                                                                                                                               |
| \<                                                                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                                               |
| sub-id                                                                                                                                                                                                                                                                                                        |
|                                                                                                                                                                                                                                                                                                               |
| \>                                                                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                                               |
| /resourceGroups/rg-uiao-arc-east-production\" \` -IdentityType \"SystemAssigned\" \` -Location \"eastus\"                                                                                                                                                                                                     |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**Step 5: Create remediation tasks for DeployIfNotExists policies**

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| \# Trigger remediation for Azure Monitor Agent deployment Start-AzPolicyRemediation \` -Name \"remediate-ama-deployment\" \` -PolicyAssignmentId \"/subscriptions/ |
|                                                                                                                                                                    |
| \<                                                                                                                                                                 |
|                                                                                                                                                                    |
| sub-id                                                                                                                                                             |
|                                                                                                                                                                    |
| \>                                                                                                                                                                 |
|                                                                                                                                                                    |
| /providers/Microsoft.Authorization/policyAssignments/uiao-baseline-east-prod\" \` -PolicyDefinitionReferenceId \"the modernization program-Arc-AMADeployment\"                          |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------+

11.4 Assignment Scoping

Policies can be assigned at three levels in the Azure resource hierarchy:

  -----------------------------------------------------------------------------------------------------------------
  **Scope Level**    **Use Case**                                **Example**
  ------------------ ------------------------------------------- --------------------------------------------------
  Management Group   Enterprise-wide governance                  Apply Governance Baseline to all subscriptions

  Subscription       Environment-level governance                Apply to all resource groups in a subscription

  Resource Group     Targeted governance by region/environment   Apply Tier0 Hardening to DC resource groups only
  -----------------------------------------------------------------------------------------------------------------

11.5 Exemption Process

When a server legitimately cannot comply with a policy (e.g., Domain Controllers exempt from BitLocker), a formal exemption must be documented:

1. Submit an exemption request via the the modernization program governance pipeline with justification

2. Governance review and approval by the the modernization program compliance officer

3. Create the Azure Policy exemption with expiry date and category (Waiver or Mitigated)

4. Document compensating controls in the the modernization program exemption register

5. Review and renew exemptions quarterly

12\. Compliance Reporting

12.1 Azure Policy Compliance Dashboard

The Azure Policy compliance dashboard provides real-time visibility into the compliance state of all Arc-enabled servers against the the modernization program policy library. Access the dashboard at:

**Azure Portal → Policy → Compliance → Filter by Initiative → the modernization program-GovernanceBaseline**

Key metrics available:

- **Overall compliance percentage** --- Percentage of servers compliant with all assigned policies

- **Non-compliant resources by policy** --- Drill-down into specific policy failures

- **Compliance trend** --- 30/60/90-day compliance trajectory

- **Non-compliant resources by resource group** --- Identify problem areas by region or environment

12.2 the modernization program Governance Dashboard Integration

The the modernization program governance dashboard (cross-referenced in the the modernization program Dashboard Design Document) ingests Azure Policy compliance state via the Azure Resource Graph API. This integration enables:

- Unified compliance view across AD, Entra ID, Intune, and Arc governance planes

- the organizational-attribute model-segmented compliance reporting (compliance by Region, Site, Department, Tier)

- Executive summary cards showing overall the modernization program governance posture

12.3 Compliance Report Export

For audit and governance pipeline consumption, compliance data can be exported using the following Azure Resource Graph query:

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  PolicyResources \| where type == \"microsoft.policyinsights/policystates\" \| where properties.complianceState != \"Compliant\" \| extend resourceId = tostring(properties.resourceId), policyName = tostring(properties.policyDefinitionName), complianceState = tostring(properties.complianceState), timestamp = todatetime(properties.timestamp) \| project resourceId, policyName, complianceState, timestamp \| order by timestamp desc

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

12.4 Drift Detection Integration

Azure Policy compliance state feeds directly into the the modernization programDriftDetection PowerShell module. When a server transitions from compliant to non-compliant, the drift detection pipeline:

1. Records the drift event with timestamp, policy, and previous state

2. Classifies the drift by severity (Critical, High, Medium, Low)

3. Triggers the appropriate remediation workflow or escalation

4. Updates the the modernization program governance dashboard in near real-time

13\. Remediation Playbooks

13.1 Automated Remediation (DeployIfNotExists / Modify)

Policies with DeployIfNotExists or Modify effects support automated remediation via Azure Policy remediation tasks. No manual intervention is required once the remediation task is created.

  --------------------------------------------------------------------------------------------------
  **Policy**                **Effect**          **Automated Action**
  ------------------------- ------------------- ----------------------------------------------------
  the modernization program-Arc-AMADeployment    DeployIfNotExists   Installs Azure Monitor Agent extension

  the modernization program-Arc-LAWorkspace      DeployIfNotExists   Associates server with Log Analytics workspace

  the modernization program-Arc-Diagnostics      DeployIfNotExists   Enables diagnostic settings on Arc resource

  the modernization program-Arc-TagInheritance   Modify              Copies region/environment tags from resource group
  --------------------------------------------------------------------------------------------------

13.2 Manual Remediation Procedures (Audit Policies)

Audit-only policies require manual remediation. The following table provides the remediation action for each audit policy:

  ---------------------------------------------------------------------------------------------------
  **Policy**                     **Remediation Action**
  ------------------------------ --------------------------------------------------------------------
  the modernization program-Arc-AgentInstalled        Run Install-the modernization programArcAgent.ps1 on the target server

  the modernization program-Arc-AgentVersion          Update agent via azcmagent upgrade or Automation runbook

  the modernization program-Arc-ConnectivityHealth    Check network, proxy, and himds service on the server

  the modernization program-Arc-SecurityBaseline      Apply security settings via Group Policy or DSC configuration

  the modernization program-Arc-EndpointProtection    Install/repair Microsoft Defender for Endpoint, update definitions

  the modernization program-Arc-TLSCompliance         Apply TLS registry settings via the modernization program remediation script

  the modernization program-Arc-LocalAdminControl     Remove unauthorized local admin accounts

  the modernization program-Arc-CertificateExpiry     Renew expiring certificates via CA or certificate management tool

  the modernization program-Arc-OSCompliance          Initiate OS upgrade via the modernization program migration pipeline

  the modernization program-Arc-PatchCompliance       Enroll in Azure Update Manager; apply missing patches

  the modernization program-Arc-DiskEncryption        Enable BitLocker on OS volume

  the modernization program-Arc-BackupCompliance      Enroll server in backup solution; verify backup jobs

  the modernization program-Arc-TimeSync              Configure W32Time service for proper NTP source

  the modernization program-Arc-FirewallState         Enable Windows Firewall on all profiles

  the modernization program-Arc-RDPSecurity           Enable NLA; restrict RDP access to authorized groups

  the modernization program-Arc-SMBSecurity           Disable SMBv1; enable SMB signing via registry or Group Policy

  the modernization program-Arc-GitServerCompliance   Repair Gitea installation; reconfigure IIS reverse proxy

  the modernization program-Arc-AssessmentCurrency    Re-run the modernization program assessment on the server

  the modernization program-Arc-HookIntegrity         Redeploy governance hooks from the the modernization program repository

  the modernization program-Arc-ModuleVersion         Update the modernization program PowerShell modules from the repository
  ---------------------------------------------------------------------------------------------------

13.3 Escalation Procedures

When remediation cannot be completed within the SLA window or requires elevated privileges:

1. **First escalation:** Notify the the modernization program governance engineer responsible for the server\'s region

2. **Second escalation:** Raise to the the modernization program program lead with impact assessment

3. **Third escalation:** Engage the compliance officer for risk acceptance or emergency exemption

13.4 SLA Targets

  ------------------------------------------------------------------------------------------------------------------------------
  **Severity**   **Remediation SLA**   **Example Findings**
  -------------- --------------------- -----------------------------------------------------------------------------------------
  **Critical**   72 hours              Missing endpoint protection, tampered governance hooks, Tier0 security baseline failure

  **High**       7 days                TLS misconfiguration, firewall disabled, missing patches (critical), agent offline

  **Medium**     30 days               Certificate expiry warning, stale assessment data, outdated agent version

  **Low**        90 days               Tag inheritance issues, NTP configuration drift
  ------------------------------------------------------------------------------------------------------------------------------

Appendix A: Policy Definition JSON Templates

The following skeleton JSON templates illustrate the Azure Policy definition structure used by the modernization program policies. Complete definitions are maintained in the the modernization program repository under /policies/arc/definitions/.

A.1 Audit Policy --- the modernization program-Arc-AgentVersion

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  { \"name\": \"the modernization program-Arc-AgentVersion\", \"properties\": { \"displayName\": \"the modernization program - Arc Agent Version Compliance\", \"description\": \"Audit Arc-enabled servers with Connected Machine Agent below minimum version.\", \"mode\": \"Indexed\", \"metadata\": { \"category\": \"the modernization program Governance\", \"version\": \"1.0.0\" }, \"parameters\": { \"minimumVersion\": { \"type\": \"String\", \"defaultValue\": \"1.38\", \"metadata\": { \"displayName\": \"Minimum Agent Version\", \"description\": \"Minimum acceptable Connected Machine Agent version.\" } } }, \"policyRule\": { \"if\": { \"allOf\": \[ { \"field\": \"type\", \"equals\": \"Microsoft.HybridCompute/machines\" }, { \"field\": \"Microsoft.HybridCompute/machines/agentVersion\", \"less\": \"\[parameters(\'minimumVersion\')\]\" } \] }, \"then\": { \"effect\": \"audit\" } } } }

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

A.2 Deny Policy --- the modernization program-Arc-RequiredTags

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  { \"name\": \"the modernization program-Arc-RequiredTags\", \"properties\": { \"displayName\": \"the modernization program - Required the organizational-attribute model Tags\", \"description\": \"Deny Arc-enabled server resources missing required the modernization program the organizational-attribute model tags.\", \"mode\": \"Indexed\", \"metadata\": { \"category\": \"the modernization program Governance\", \"version\": \"1.0.0\" }, \"parameters\": {}, \"policyRule\": { \"if\": { \"allOf\": \[ { \"field\": \"type\", \"equals\": \"Microsoft.HybridCompute/machines\" }, { \"anyOf\": \[ { \"field\": \"tags\[\'uiao-region\'\]\", \"exists\": \"false\" }, { \"field\": \"tags\[\'uiao-site\'\]\", \"exists\": \"false\" }, { \"field\": \"tags\[\'uiao-department\'\]\", \"exists\": \"false\" }, { \"field\": \"tags\[\'uiao-device-tier\'\]\", \"exists\": \"false\" }, { \"field\": \"tags\[\'uiao-environment\'\]\", \"exists\": \"false\" }, { \"field\": \"tags\[\'uiao-device-role\'\]\", \"exists\": \"false\" } \] } \] }, \"then\": { \"effect\": \"deny\" } } } }

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

A.3 DeployIfNotExists Policy --- the modernization program-Arc-AMADeployment

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  { \"name\": \"the modernization program-Arc-AMADeployment\", \"properties\": { \"displayName\": \"the modernization program - Deploy Azure Monitor Agent on Arc Servers\", \"description\": \"Automatically deploy Azure Monitor Agent on Arc-enabled Windows servers.\", \"mode\": \"Indexed\", \"metadata\": { \"category\": \"the modernization program Governance\", \"version\": \"1.0.0\" }, \"parameters\": {}, \"policyRule\": { \"if\": { \"allOf\": \[ { \"field\": \"type\", \"equals\": \"Microsoft.HybridCompute/machines\" }, { \"field\": \"Microsoft.HybridCompute/machines/osName\", \"equals\": \"Windows\" } \] }, \"then\": { \"effect\": \"deployIfNotExists\", \"details\": { \"type\": \"Microsoft.HybridCompute/machines/extensions\", \"roleDefinitionIds\": \[ \"/providers/Microsoft.Authorization/roleDefinitions/\...\" \], \"existenceCondition\": { \"allOf\": \[ { \"field\": \"Microsoft.HybridCompute/machines/extensions/type\", \"equals\": \"AzureMonitorWindowsAgent\" }, { \"field\": \"Microsoft.HybridCompute/machines/extensions/provisioningState\", \"equals\": \"Succeeded\" } \] }, \"deployment\": { \"properties\": { \"mode\": \"incremental\", \"template\": { \"\$schema\": \"https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#\", \"contentVersion\": \"1.0.0.0\", \"resources\": \[ { \"type\": \"Microsoft.HybridCompute/machines/extensions\", \"apiVersion\": \"2023-10-03-preview\", \"name\": \"\[concat(field(\'name\'), \'/AzureMonitorWindowsAgent\')\]\", \"location\": \"\[field(\'location\')\]\", \"properties\": { \"publisher\": \"Microsoft.Azure.Monitor\", \"type\": \"AzureMonitorWindowsAgent\", \"autoUpgradeMinorVersion\": true } } \] } } } } } } } }

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

A.4 Modify Policy --- the modernization program-Arc-TagInheritance

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  { \"name\": \"the modernization program-Arc-TagInheritance\", \"properties\": { \"displayName\": \"the modernization program - Inherit Region and Environment Tags from Resource Group\", \"description\": \"Inherit uiao-region and uiao-environment tags from the parent resource group.\", \"mode\": \"Indexed\", \"metadata\": { \"category\": \"the modernization program Governance\", \"version\": \"1.0.0\" }, \"parameters\": {}, \"policyRule\": { \"if\": { \"allOf\": \[ { \"field\": \"type\", \"equals\": \"Microsoft.HybridCompute/machines\" }, { \"field\": \"tags\[\'uiao-region\'\]\", \"exists\": \"false\" } \] }, \"then\": { \"effect\": \"modify\", \"details\": { \"roleDefinitionIds\": \[ \"/providers/Microsoft.Authorization/roleDefinitions/\...\" \], \"operations\": \[ { \"operation\": \"addOrReplace\", \"field\": \"tags\[\'uiao-region\'\]\", \"value\": \"\[resourceGroup.tags\[\'uiao-region\'\]\]\" } \] } } } } }

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Appendix B: the organizational-attribute model Tag Mapping Reference

The following table provides the complete mapping between the modernization program the organizational-attribute model extension attributes in Entra ID, their corresponding Azure Arc resource tags, and the allowed values for each field.

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Extension Attribute**   **the organizational-attribute model Field**   **Arc Tag Name**   **Allowed Values**
  ------------------------- ------------------- ------------------ ------------------------------------------------------------------------------------------------------
  extensionAttribute1       Region              uiao-region        East, West, Central, Global

  extensionAttribute2       Site                uiao-site          *Organization-specific (populated from AD assessment)*

  extensionAttribute3       Department          uiao-department    *Organization-specific (populated from AD assessment)*

  extensionAttribute4       DeviceTier          uiao-device-tier   Tier0, Tier1, Tier2

  extensionAttribute5       Environment         uiao-environment   Production, Staging, Dev, DR

  extensionAttribute6       DeviceRole          uiao-device-role   DomainController, MemberServer, GitServer, AppServer, FileServer, DatabaseServer, Workstation, Kiosk
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **IMPLEMENTATION NOTE**                                                                                                                                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                                                                                           |
| When deploying the Arc agent via the the modernization program deployment script, the organizational-attribute model extension attribute values from the source AD object are automatically read and applied as Arc resource tags. The script calls Get-the modernization programthe organizational-attribute model to retrieve the current the organizational-attribute model for the server and maps each attribute to its corresponding tag during the azcmagent connect command. |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

B.1 Tag Flow Diagram

The the organizational-attribute model tag flow follows this sequence:

1. **Active Directory** --- the organizational-attribute model attributes set on computer objects during the modernization program assessment

2. **Entra ID Sync** --- Extension attributes synchronized via Entra Connect (for hybrid-joined devices)

3. **Arc Agent Deployment** --- Tags applied during azcmagent connect from the organizational-attribute model values

4. **Azure Policy** --- Tag values validated by the modernization program-Arc-RequiredTags and the modernization program-Arc-TagValues

5. **Governance Pipeline** --- Tags used for scoped policy assignment, compliance reporting, and dashboard segmentation

Appendix C: Guest Configuration Package Development

Several the modernization program policies rely on Azure Policy Guest Configuration (Machine Configuration) to evaluate in-guest operating system settings. This appendix describes how to create, test, and publish custom Guest Configuration packages for the modernization program-specific checks.

C.1 Overview

Guest Configuration packages use PowerShell Desired State Configuration (DSC) resources to define the expected state of a server. The package is compiled into a MOF file, zipped with the required DSC resources, and published to Azure Blob Storage where the Guest Configuration agent can retrieve and evaluate it.

C.2 Development Workflow

1. **Author the DSC Configuration** --- Write a PowerShell DSC configuration that checks the desired settings

2. **Compile the MOF** --- Run the configuration to generate the MOF file

3. **Package the artifact** --- Use New-GuestConfigurationPackage to create the .zip package

4. **Test locally** --- Use Test-GuestConfigurationPackage to validate the package against a local server

5. **Publish to Azure Storage** --- Upload the package to a blob container with a SAS URL

6. **Create the Azure Policy definition** --- Reference the package URI in the policy definition

C.3 Example: the modernization program Assessment Currency Check

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  \# DSC Configuration for checking the modernization program assessment file age Configuration the modernization programAssessmentCurrency { Import-DscResource -ModuleName GuestConfiguration Node \"the modernization programAssessmentCurrency\" { Script CheckAssessmentAge { GetScript = { \$assessmentPath = \"D:\\the modernization program\\Assessment\" \$files = Get-ChildItem -Path \$assessmentPath -File -ErrorAction SilentlyContinue \$newestFile = \$files \| Sort-Object LastWriteTime -Descending \| Select-Object -First 1 return \@{ Result = if (\$newestFile) { \$newestFile.LastWriteTime.ToString } else { \"NoFiles\" } } } TestScript = { \$assessmentPath = \"D:\\the modernization program\\Assessment\" \$maxAgeDays = 30 \$files = Get-ChildItem -Path \$assessmentPath -File -ErrorAction SilentlyContinue if (-not \$files) { return \$false } \$newestFile = \$files \| Sort-Object LastWriteTime -Descending \| Select-Object -First 1 \$age = (Get-Date) - \$newestFile.LastWriteTime return (\$age.TotalDays -le \$maxAgeDays) } SetScript = { \# Audit-only: no remediation action } } } } \# Compile the MOF the modernization programAssessmentCurrency \# Create the Guest Configuration package New-GuestConfigurationPackage \` -Name \"the modernization programAssessmentCurrency\" \` -Configuration \".\\the modernization programAssessmentCurrency\\localhost.mof\" \` -Type \"Audit\" \` -Force

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

C.4 Testing and Publishing

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  \# Test the package locally \$result = Test-GuestConfigurationPackage \` -Path \".\\the modernization programAssessmentCurrency.zip\" \$result.complianceStatus \# Should return \"Compliant\" or \"NonCompliant\" \# Publish to Azure Storage \$publishResult = Publish-GuestConfigurationPackage \` -Path \".\\the modernization programAssessmentCurrency.zip\" \` -ResourceGroupName \"rg-uiao-governance\" \` -StorageAccountName \"stuiaogovernance\" \# Create the policy definition from the published package New-GuestConfigurationPolicy \` -ContentUri \$publishResult.ContentUri \` -DisplayName \"the modernization program - Assessment Data Currency\" \` -Description \"Audit servers where the modernization program assessment data is older than 30 days.\" \` -Path \".\\policies\" \` -Platform \"Windows\" \` -Version \"1.0.0\"

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

C.5 the modernization program-Specific DSC Resources

The the modernization program program maintains custom DSC resources in the repository for specialized checks:

  -----------------------------------------------------------------------------------------------
  **DSC Resource**     **Purpose**                                 **Used By Policy**
  -------------------- ------------------------------------------- ------------------------------
  the modernization programAssessmentFile   Check assessment file age and integrity     the modernization program-Arc-AssessmentCurrency

  the modernization programGitHook          Validate Git hook presence and hash         the modernization program-Arc-HookIntegrity

  the modernization programModuleVersion    Check PowerShell module manifest versions   the modernization program-Arc-ModuleVersion

  the modernization programGiteaService     Validate Gitea installation and IIS proxy   the modernization program-Arc-GitServerCompliance
  -----------------------------------------------------------------------------------------------

**Classification:** Controlled

**Boundary:** GCC-Moderate (Azure Arc in Commercial Cloud --- Explicit Exception)

**Repository:** https://github.com/WhalerMike/uiao

**Document Version:** 1.0 \| **Date:** April 21, 2026 \| **the modernization program Governance OS Modernization Program**

This document contains 24 policy definitions and 3 policy initiatives for the the modernization program Azure Arc governance framework. All policy definitions are maintained as code in the the modernization program repository and deployed via the CI/CD pipeline described in Section 11.
