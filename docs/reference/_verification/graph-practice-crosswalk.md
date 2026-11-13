# Verification — Microsoft Practice Crosswalk (reference)

File: `docs/reference/graph-practice-crosswalk.md`
Verified: 2026-10-25 (the page's row review); this log compiled 2026-11-09

Method:
- This log was compiled on November 9, 2026 from the page's 37 `gpc-*` footnotes and the sentences and table rows that cite them. It records one row per claim-bearing location.
- The verdicts record the check the page itself reports: every row was checked against its source on October 25, 2026 (the ScubaGear 2.0.0 Entra baseline, Microsoft Learn, and Microsoft's built-in Azure Policy references and definitions), and each table row carries that review date. The sources were not opened again to compile this log. A reviewer moving the page to **In review** re-checks each row and updates its date here and on the page.
- Footnote keys are given without the `gpc-` prefix. The full citation, with the URL and access date, is in the page's footnotes.
- No personal data was sent to any site.

Verdicts: **verified** (the source says it; checked 2026-10-25); **inference** (labelled on the page); **design** (stated as design guidance, labelled on the page).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | ScubaGear assesses each Entra ID policy automatically or manually | Introduction, "The check" | verified | scuba (CISA ScubaGear, Entra ID baseline `aad.md`) |
| 2 | The ScubaGear 2.0.0 Entra ID baseline is the source for every Entra ID policy ID; BOD 25-01's Required Configurations list binds federal civilian agencies and still uses an older ID for one policy | Entra ID, opening paragraph | verified | scuba; bodlist (CISA, BOD 25-01 Required Configurations) |
| 3 | Block legacy authentication: Microsoft page; MS.AAD.1.1v1 (SHALL) | Entra ID table | verified | legacy (Microsoft Learn, "Block legacy authentication with Conditional Access"); scuba |
| 4 | Block high-risk users and sign-ins, notify administrators: MS.AAD.2.1v1, 2.3v1 (SHALL), 2.2v1 (SHOULD) | Entra ID table | verified | risk (Microsoft Learn, "Risk policies"); scuba |
| 5 | Phishing-resistant MFA for all users: MS.AAD.3.1v1, 3.2v2 (SHALL); BOD 25-01 list gives MS.AAD.3.2v1 | Entra ID table | verified | strength (Microsoft Learn, "Overview of Conditional Access authentication strengths"); scuba; bodlist |
| 6 | Phishing-resistant MFA for highly privileged roles: MS.AAD.3.6v1 (SHALL) | Entra ID table | verified | strength; scuba |
| 7 | Authentication methods policy migration, SMS, voice and email OTP off, sign-in context: MS.AAD.3.4v1, 3.5v2, 3.3v2 (SHALL) | Entra ID table | verified | methods (Microsoft Learn, "How to migrate to the Authentication methods policy"); scuba |
| 8 | Managed devices to sign in and register MFA: MS.AAD.3.7v1, 3.8v1 (SHOULD) | Entra ID table | verified | compliance (Microsoft Learn, "Device compliance policies in Microsoft Intune"); scuba |
| 9 | Block the device code flow: MS.AAD.3.9v1 (SHOULD) | Entra ID table | verified | flows (Microsoft Learn, "Block authentication flows with Conditional Access policy"); scuba |
| 10 | Send Entra logs to the security operations center: MS.AAD.4.1v1 (SHALL, manual check) | Entra ID table | verified | logs (Microsoft Learn, "Stream Microsoft Entra logs to an event hub"); scuba |
| 11 | Only administrators register applications, user consent restricted, admin consent workflow: MS.AAD.5.1v1 to 5.3v1 (SHALL) | Entra ID table | verified | consent (Microsoft Learn, "Configure how users consent to applications"); adminconsent (Microsoft Learn, "Configure the admin consent workflow"); scuba |
| 12 | Block application passwords; password lifetime 180 days, certificate lifetime 365 days: MS.AAD.5.5v1 to 5.7v1 (SHOULD) | Entra ID table | verified | appmgmt (Microsoft Learn, "Configure restrictions on how applications can be configured"); scuba |
| 13 | Two to eight Global Administrators, finer-grained roles, cloud-only privileged accounts: MS.AAD.7.1v1 to 7.3v1 (SHALL) | Entra ID table | verified | roles (Microsoft Learn, "Best practices for Microsoft Entra roles"); scuba |
| 14 | No permanent active assignments to highly privileged roles, PIM only, Global Administrator activation approved, alerts: MS.AAD.7.4v1 to 7.8v1 (SHALL), 7.9v1 (SHOULD) | Entra ID table | verified | pim (Microsoft Learn, "What is Privileged Identity Management?"); scuba |
| 15 | Limit guest access, invitations and invitation domains: MS.AAD.8.1v1 to 8.3v1 (SHOULD) | Entra ID table | verified | guests (Microsoft Learn, "Configure external collaboration"); scuba |
| 16 | ScubaGear has no Intune baseline; its baselines cover Entra ID, the security suite, Exchange Online, Power BI, Power Platform, SharePoint and OneDrive, and Teams | Intune, opening paragraph | verified | scubarepo (CISA, ScubaGear repository, baselines folder) |
| 17 | Device compliance policies as the Conditional Access signal; no ScubaGear policy | Intune table | verified | compliance; scubarepo |
| 18 | Intune security baselines in place of Group Policy; no ScubaGear policy | Intune table | verified | baselines (Microsoft Learn, "Learn about Intune security baselines for Windows devices"); scubarepo |
| 19 | Windows Autopilot onboarding; no ScubaGear policy | Intune table | verified | autopilot (Microsoft Learn, "Overview of Windows Autopilot"); scubarepo |
| 20 | Intune role-based access control and Multi Admin Approval; no ScubaGear policy | Intune table | verified | irbac (Microsoft Learn, "Role-based access control (RBAC) with Microsoft Intune"); maa (Microsoft Learn, "Use Multi Admin Approval in Intune"); scubarepo |
| 21 | Intune configuration is read and evidenced through Microsoft Graph; no ScubaGear policy | Intune table | verified | igraph (Microsoft Learn, "Working with Intune in Microsoft Graph"); scubarepo |
| 22 | A Microsoft 365 GCC tenant uses the worldwide endpoints | GCC endpoints table | verified | deploy (Microsoft Learn, "Microsoft Graph national cloud deployments") |
| 25 | Intune has no separate GCC instance; a GCC tenant uses the commercial service | GCC endpoints table | verified | igov (Microsoft Learn, "Microsoft Intune Government Service overview") |
| 28 | The Arc policy names are the display names in Microsoft's built-in reference for Arc-enabled servers | Azure Arc, opening sentence | verified | arcpol (Microsoft Learn, "Azure Policy built-in definitions for Azure Arc-enabled servers") |
| 29 | Private Link for Arc: the two Private Link Scope built-ins as named | Azure Arc table | verified | arcpl (Microsoft Learn, "Use Azure Private Link to connect servers to Azure Arc by using a private endpoint"); arcpol |
| 30 | Agent network path: no built-in; review the endpoint list for the cloud in use | Azure Arc table | verified | arcnet (Microsoft Learn, "Connected Machine agent network requirements"); arcpol |
| 31 | Arc managed identity: no built-in fits; the "[Preview]: A managed identity should be enabled on your machines" built-in applies only to Automanage resources | Azure Arc table | verified | arcmi (Microsoft Learn, "Access Azure resources with managed identity on Azure Arc-enabled servers"); arcpol |
| 32 | Azure Update Manager: the two update built-ins as named | Azure Arc table | verified | aum (Microsoft Learn, "Azure Update Manager overview"); arcpol |
| 33 | Automatic extension upgrade: the built-in as named | Azure Arc table | verified | arcext (Microsoft Learn, "Automatic extension upgrade for Azure Arc-enabled servers"); arcpol |
| 34 | Azure Monitor Agent: the Windows and Linux built-ins as named | Azure Arc table | verified | ama (Microsoft Learn, "Azure Monitor Agent overview"); arcpol |
| 35 | The SQL rows come from the Arc built-in reference, Microsoft's built-in reference for Azure SQL and the definitions in the Azure Policy repository | SQL Server and Azure SQL, opening sentence | verified | arcpol; sqlpol (Microsoft Learn, "Built-in policy definitions for Azure SQL Database"; Azure Policy repository) |
| 36 | SQL Server 2022 and later authenticates with Entra ID through Arc; neither built-in reference has a definition that audits it | SQL Server and Azure SQL table | verified | sqlentra (Microsoft Learn, "Microsoft Entra authentication for SQL Server overview"); arcpol; sqlpol |
| 37 | Defender for SQL on Arc-enabled SQL Server: the two built-ins as named | SQL Server and Azure SQL table | verified | arcpol |
| 38 | Azure SQL Entra administrator then Entra-only authentication: the built-ins as named | SQL Server and Azure SQL table | verified | sqlcfg (Microsoft Learn, "Configure Microsoft Entra authentication"); sqlonly (Microsoft Learn, "Microsoft Entra-only authentication"); sqlpol |
| 39 | Azure SQL TLS 1.2 or newer and no public network access: the two built-ins as named | SQL Server and Azure SQL table | verified | sqlconn (Microsoft Learn, "Connectivity settings"); sqlpol |
| 40 | Azure SQL auditing: the built-in as named | SQL Server and Azure SQL table | verified | sqlaudit (Microsoft Learn, "Auditing for Azure SQL Database"); sqlpol |
| 41 | The Entra administrator built-in still carries its Azure Active Directory name at version 1.0.0 | SQL Server and Azure SQL, notes | verified | sqlpol |
| 42 | Azure Policy can stop creation without Entra-only authentication but can't block turning it off afterwards; the server then shows as non-compliant | SQL Server and Azure SQL, notes | verified | sqlonlypol (Microsoft Learn, "Azure Policy for Microsoft Entra-only authentication with Azure SQL") |
| 43 | BOD 25-01's list gives MS.AAD.3.2v1 ("if phishing-resistant MFA isn't enforced yet, enforce an alternative MFA method"); ScubaGear 2.0.0 has MS.AAD.3.2v2 ("MFA SHALL be enforced for all users"), last modified February 2026 | What this found, first item | verified | bodlist; scuba |
| 44 | Intune rows depend on the Graph evidence approach in Book 15 | What this found, second item | verified | scubarepo (no Intune baseline); Book 15, Chapter 08 |
| 45 | Proving Entra authentication on Arc-enabled SQL Server needs a custom check, such as a query of the instance's logins | What this found, third item | inference | — (labelled *inference* on the page) |

## Source watch, November 9, 2026

Re-checked after the weekly source watch (issue #499) reported a new commit in the ScubaGear baselines folder. Checked November 9, 2026; no personal data sent to any site.

| Finding | Change |
|---|---|
| ScubaGear baselines folder now also holds `si.md`, "CISA M365 Secure Configuration Baseline for Super Intelligence (SI) / SI Agents capabilities", added November 4, 2026 (commit `8c954fc`) as a shell: description, assumptions and policies marked TBD. Still no Intune baseline | The baseline list and footnote `gpc-scubarepo` name the placeholder (row 16); "ScubaGear has no Intune baseline" unchanged |
