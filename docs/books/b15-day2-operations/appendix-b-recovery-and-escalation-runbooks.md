---
title: "Appendix B — Recovery and Escalation Runbooks"
description: "Identity-proofing and escalation runbooks for the help desk's six hardest calls: a lost passkey, a Windows Hello for Business reset, a replaced device, a BitLocker recovery key, an emergency access account incident and a user blocked by Conditional Access. Each runbook gives the trigger, the identity check, who executes and who is escalated to, copy-paste commands, and the evidence; then the help-desk simulation that tests them, government-cloud availability, and the control states, change safety and assessment mapping."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b15-day2-operations
book: B15
part: Appendix
series-order: 91
status: draft
review-status: pending
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
---

# Appendix B — Recovery and Escalation Runbooks

*A recovery call is the moment an attacker most wants to be the caller, so every runbook starts with who is on the line and ends with a record someone else can check.*

::: {.callout-note}
## In this appendix
Six runbooks for the calls that hand an account, a device or a key to whoever is on the line: a lost or stolen passkey, a Windows Hello for Business reset, a replaced device, a BitLocker recovery key request, an emergency access account incident, and a user blocked by Conditional Access. Each gives the trigger, the identity check, who executes and who is escalated to, copy-paste commands, and the evidence it leaves. Then the help-desk simulation that tests the runbooks before an attacker does, the government-cloud availability of what they rely on, and the control states, change safety and assessment mapping the workbook's conventions ask for.
:::

[Chapter 04](04-help-desk-authority-in-entra.md) set the help desk's authority: which roles it holds, whose accounts they can touch, how a user is re-proofed, and which tasks need a second approver. [Appendix A](appendix-a-help-desk-task-reference.md) lists every task in one row. This appendix takes the six calls where a mistake hands over an identity and writes each as a runbook an operator can follow on the phone. It adds no new authority: every role, approver and boundary is the one Chapter 04 and [Book 04](../b04-access/index.md) already set.

## How the runbooks work {#how-the-runbooks-work}

Every runbook has the same three opening steps, from [Chapter 04](04-help-desk-authority-in-entra.md#identity-proofing-before-any-credential-action), and the same closing step:

1. **Re-proof, don't interview.** Confirm the caller against the record the agency already holds: in person with the PIV card, or a supervised video session against the HR-sourced identity. Knowledge questions, a callback number the caller supplies, and email are never enough on their own. NIST SP 800-63B-4 treats a lost authenticator as account recovery and, for an identity-proofed workforce account at AAL2, allows repeated identity proofing as the recovery method, with a notification to the subscriber every time.[^aB-nist-63b]
2. **Check the target before the method.** If the user holds any role, is a member or owner of a role-assignable group, or sits in a restricted management unit, stop and route the ticket to the Tier 0 or restricted-unit executors Chapter 04 names ([Script 1 in Appendix A](appendix-a-help-desk-task-reference.md#script-1-target-check-before-any-credential-action) runs the check).
3. **Open or match the ticket.** Every command below runs under a role activated through PIM with the ticket number as the justification ([Chapter 04](04-help-desk-authority-in-entra.md#evidence-every-action-leaves)).
4. **Close with the evidence and notify the user** through a channel other than the one the request came on.

Microsoft Entra's self-service account recovery with Verified ID Face Check is held until it is available in GCC: Microsoft states Verified ID is supported in GCC but not GCC High, and doesn't state government-cloud availability for account recovery, so for this program it is not yet specified ([Chapter 04](04-help-desk-authority-in-entra.md#identity-proofing-before-any-credential-action)).[^aB-vid-gcc]

**Placeholders.** The commands use these, explained once: `<ticket-id>` is the ITSM ticket number; `<user-upn>` is the user's sign-in name, for example `pat@contoso.example`; `<method-id>`, `<device-object-id>`, `<managed-device-id>` and `<key-id>` are identifiers the preceding command prints; `<emergency-account-object-id-1>` and `<emergency-account-object-id-2>` are the object IDs of the two emergency access accounts, held in the Book 04 register. Run every block in PowerShell 7 with the Microsoft Graph PowerShell SDK installed. In a GCC tenant, `Connect-MgGraph` uses the default environment; in GCC High or DoD, add `-Environment` with the national cloud name `Get-MgEnvironment` lists.

**Authority.** The runbook steps are the program's design (**Risk-based recommended**, for the risk that a recovery call is the cheapest account takeover); where a step rests on Microsoft's guidance or a federal requirement, the step says so and the note gives the source ([Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md#authority-labels)).

### What the runbooks rely on, by cloud

| Capability | GCC (commercial Entra ID) | GCC High (Azure Government, L4) | DoD (L5) | Source and date read |
|---|---|---|---|---|
| Passkeys (FIDO2), Windows Hello for Business, certificate-based authentication | Available | Available | Available | Entra feature availability, Nov 11, 2026[^aB-featavail] |
| Temporary Access Pass, through Microsoft Graph | Available | Available | Available | Graph *Create temporaryAccessPassMethod*, Nov 11, 2026[^aB-tap-api] |
| Delete a passkey, through Microsoft Graph | Available | Available | Available | Graph *Delete fido2AuthenticationMethod*, Nov 11, 2026[^aB-fido2-delete] |
| Retire or wipe an Intune-managed device, through Microsoft Graph | Available (needs an active Intune license) | Available | Available | Graph *retire action*, Nov 11, 2026[^aB-retire] |
| BitLocker recovery keys stored in Entra ID | Available | Not yet specified | Not yet specified | Learn doesn't state government-cloud availability on the pages read[^aB-bitlocker-view] |
| Windows Hello for Business nondestructive PIN reset (Microsoft PIN reset service) | Not yet specified | Not yet specified | Not yet specified | Learn's PIN reset page doesn't state it[^aB-pin-reset] |
| Self-service account recovery with Verified ID | Held | Not supported (Verified ID isn't) | Not supported | Verified ID what's new, read Nov 9, 2026[^aB-vid-gcc] |

Where a capability is not yet specified for the agency's cloud, the runbook's interim path is the one that doesn't need it: re-proofing plus a Temporary Access Pass, which is available in all three.

## Control states, the How template and change safety {#control-states-and-change-safety}

The runbooks are one control: the help desk's governed recovery procedure. It supports NIST SP 800-53 IA-5 (authenticator management), IA-12 (identity proofing), AC-2 (account management) and IR-4 (incident handling), and its evidence is evidence for them; the agency still sets their parameters and owns the policy, and the assessor decides whether each is satisfied.

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | [How the runbooks work](#how-the-runbooks-work) and the identity-verification procedure the CISO decides ([Chapter 10](10-who-runs-day-two.md#the-responsibility-matrix)) | The approved procedure, versioned |
| Configured | The help desk role groups, administrative-unit scopes and PIM settings ([Chapter 04](04-help-desk-authority-in-entra.md)); the catalog items that start each runbook ([Chapter 05](05-the-service-catalogs.md)) | Role and PIM exports; catalog item definitions |
| Enforced | The SIEM rules that flag any recovery action without a matching ticket ([Chapter 04](04-help-desk-authority-in-entra.md#evidence-every-action-leaves)) | Rule definitions and their alert history |
| Evidenced | [The help-desk simulation](#the-help-desk-simulation) | Simulation record: scenario, expected and observed outcome, audit events |
| Operated | Quarterly simulation and procedure review on the [operating cadence](12-the-day-two-runbook.md#the-cadence-by-control-family) | Owner, cadence and the last review record |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

### Prerequisites
Microsoft Entra ID with the help desk roles scoped as Chapter 04 sets; PIM for activation (P2 or Governance); Intune for the device runbooks; the sign-in and audit logs streaming to the SIEM ([Book 12](../b12-security-operations/index.md)); the emergency access alert from [Book 04](../b04-access/04-privileged-roles-and-tiers.md#emergency-access-accounts) in place. Government-cloud availability is in the table above.

### Pilot
One service desk shift, with its supervisor, runs the runbooks for two weeks against real tickets, with identity engineering on hand; success is every ticket closed with the evidence below and no recovery action that the SIEM flags as unmatched.

### Report-only or audit phase
A runbook has no report-only mode. Its audit phase is the [simulation](#the-help-desk-simulation): every scenario is run in a test tenant, or as a tabletop against the production procedure, before the shift uses the runbook on live calls.

### Enforcement
**Change safety**

| Ring | Scope | Exit criteria |
|---|---|---|
| 0 | Identity engineering and the service desk supervisors | Every simulation scenario passes in the test tenant |
| 1 | One pilot shift | Two weeks with every ticket evidenced and no unmatched action |
| 2 | All second-line technicians | One month with the same result and the pretext-call scenario passed by each technician |
| 3 | All help desk staff who hold a recovery role | Quarterly simulation passed |

- **Emergency access:** the runbooks never act on the emergency access accounts; [Runbook 5](#runbook-emergency-access-incident) only routes an incident about them.
- **Change window:** a change to a runbook is a normal change to the identity-verification procedure, approved by the CISO ([Chapter 10](10-who-runs-day-two.md#the-responsibility-matrix)).
- **Backout triggers:** any recovery action the SIEM flags as unmatched; a failed pretext-call scenario; a rise in repeat resets for one identity. Each sends the ring back one step.
- **Post-change validation:** rerun the simulation scenarios the change touches.

### Rollback
Returning to the previous version of the procedure is a document change the supervisor can make the same day; the roles and scopes don't change, so there is nothing to roll back in the tenant.

### Exclusions
None. A caller who can't be re-proofed is not excluded from the check; the ticket waits for an in-person or supervised video verification. The emergency access accounts are outside the help desk's scope by design, not excluded from a check.

### Telemetry
Directory audit events for each method change, Temporary Access Pass, session revocation and BitLocker key read (category `KeyManagement`); PIM activation records; sign-in logs; the ITSM ticket. The SIEM joins them on the target's identity and the time ([Chapter 04](04-help-desk-authority-in-entra.md#evidence-every-action-leaves)).

### Evidence
**Evidence checklist**

- [ ] **Configuration:** the approved identity-verification procedure and this appendix's version, with the role and PIM exports
- [ ] **Operational:** the joined ticket, PIM record and audit entry for each recovery, retained in the SIEM under [Book 12](../b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md)'s retention
- [ ] **Test:** the latest simulation record, expected and observed outcome per scenario, date, tester
- [ ] **Exception:** every recovery that skipped a step, with the supervisor's or security office's approval
- [ ] **Assessor-ready artifact:** the quarterly simulation summary and a sample of joined recovery records, traceable to the four above

### Day-two ownership
The service desk supervisor owns the runbooks' use; the CISO owns the identity-verification procedure; security operations owns the alerts. The simulation runs quarterly and the procedure is reviewed annually on the [operating cadence](12-the-day-two-runbook.md#the-cadence-by-control-family). Drift looks like a rising share of human-only closures on recovery tickets, or recovery actions with no matching ticket.

::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** Identity
- **CISA ZTMM pillar:** Identity
- **Depends on:** phishing-resistant methods and the Temporary Access Pass policy ([Book 04](../b04-access/index.md)); device identity and compliance ([Book 05](../b05-devices/index.md)); identity detections in the SIEM ([Book 12](../b12-security-operations/index.md))
- **Attack chain interrupted:** the social-engineered recovery that gives an attacker a new sign-in method (Initial Access, Persistence), and the use of a disclosed recovery key or an emergency account (Credential Access, Privilege Escalation)
:::

## Runbook 1 — Lost or stolen passkey {#runbook-lost-passkey}

**Trigger:** the user reports a lost or stolen FIDO2 security key, or a lost phone holding a passkey in Microsoft Authenticator. **Executes:** Authentication Administrator scoped to the user's administrative unit; Privileged Authentication Administrator for any account the target check routes away. **Approver:** the service desk supervisor for an ordinary user ([Appendix A](appendix-a-help-desk-task-reference.md#credentials-and-authentication-methods)).

Microsoft's delete-passkey API supports Authentication Administrator and Privileged Authentication Administrator as the least-privileged built-in roles, and a Temporary Access Pass is created under the same two roles.[^aB-fido2-delete][^aB-tap-api]

1. Re-proof the user and run the target check ([How the runbooks work](#how-the-runbooks-work)).
2. Connect and list the user's passkeys, so the lost one is identified by its name, model and registration date:

   ```powershell
   Connect-MgGraph -Scopes 'UserAuthenticationMethod.ReadWrite.All', 'User.RevokeSessions.All' -NoWelcome
   $upn = '<user-upn>'
   Get-MgUserAuthenticationFido2Method -UserId $upn |
       Select-Object Id, DisplayName, Model, CreatedDateTime
   ```

3. Revoke the user's sessions, then delete the lost passkey by the `Id` the list printed:

   ```powershell
   Revoke-MgUserSignInSession -UserId $upn
   Remove-MgUserAuthenticationFido2Method -UserId $upn -Fido2AuthenticationMethodId '<method-id>'
   ```

4. If the user has no other phishing-resistant method, issue a one-time Temporary Access Pass with the shortest lifetime the handover allows, and hand it only to the verified person, never to an email address or a number given on the call:

   ```powershell
   $tap = New-MgUserAuthenticationTemporaryAccessPassMethod -UserId $upn -BodyParameter @{
       lifetimeInMinutes = 60
       isUsableOnce      = $true
   }
   $tap.TemporaryAccessPass
   ```

   A user can have only one usable pass at a time; creating a new one deletes the previous one.[^aB-tap-api] With a one-time pass the user has 10 minutes after sign-in to finish registering.[^aB-tap]

5. Stay with the user while they register the replacement at **Security info**, then confirm the old passkey is gone and the new method is present:

   ```powershell
   Get-MgUserAuthenticationMethod -UserId $upn |
       Select-Object Id, @{ n = 'Type'; e = { $_.AdditionalProperties['@odata.type'] } }
   ```

6. Close the ticket and notify the user on a second channel.

**Escalate** to security operations if the key was stolen rather than lost, or if the sign-in log shows a sign-in with the lost passkey after the reported loss ([Runbook 6](#runbook-blocked-by-conditional-access) shows the sign-in query). **Evidence:** the ticket with the verification method; the PIM activation; audit entries for the session revocation, the method deletion and the pass; the method list from step 5.

## Runbook 2 — Windows Hello for Business reset {#runbook-whfb-reset}

**Trigger:** the user forgot the Windows Hello PIN, the device locked the PIN after repeated attempts, or the Windows Hello container is broken. **Executes:** the user, for a PIN reset; end-user device support for a container reset; an Authentication Administrator scoped to the user's unit for removing the cloud registration. **Approver:** none for a user-run PIN reset; the supervisor for removing the registration.

Windows offers two PIN resets. A **destructive** reset, the default, deletes the user's PIN and the keys and certificates in the Windows Hello container and provisions new ones; a **nondestructive** reset keeps the container and keys and changes only the PIN, and needs the Microsoft PIN reset service and the PIN recovery policy. Both start from the lock screen or **Settings** and require the user to complete multifactor authentication to Microsoft Entra ID.[^aB-pin-reset]

1. **Forgotten PIN.** Guide the user to **I forgot my PIN** on the lock screen. The help desk doesn't reset a PIN for the user; the user's own multifactor authentication is the check. If the user can't complete it, go to [Runbook 1](#runbook-lost-passkey) step 4 for a Temporary Access Pass after re-proofing.
2. **Confirm which reset the device supports.** On the device, the user (or device support, in the user's session) runs:

   ```cmd
   dsregcmd /status
   ```

   In the user state section, `CanReset : DestructiveOnly` means only destructive reset is configured; `DestructiveAndNonDestructive` means the PIN reset service is in use.[^aB-pin-reset]

3. **Broken container.** Device support deletes the container in the user's session:

   ```cmd
   certutil.exe -deleteHelloContainer
   ```

   On recent Windows 11 builds this also removes passkeys stored on that device for other services, so the user confirms another way to sign in to those before it runs.[^aB-whfb-faq] The user then signs out and back in to provision again; on an already-joined device they first authenticate with another method before a Temporary Access Pass can be used to set up Windows Hello for Business.[^aB-tap]

4. **Lost or compromised device.** Remove the cloud registration so the old device's key can't be used against Entra ID, after re-proofing and the target check:

   ```powershell
   Connect-MgGraph -Scopes 'UserAuthMethod-WindowsHello.ReadWrite.All' -NoWelcome
   $upn = '<user-upn>'
   Get-MgUserAuthenticationWindowsHelloForBusinessMethod -UserId $upn |
       Select-Object Id, DisplayName, CreatedDateTime, KeyStrength
   Remove-MgUserAuthenticationWindowsHelloForBusinessMethod -UserId $upn `
       -WindowsHelloForBusinessAuthenticationMethodId '<method-id>'
   ```

   The delete takes `UserAuthMethod-WindowsHello.ReadWrite.All` or a broader authentication-method permission.[^aB-whfb-delete] Then continue with [Runbook 3](#runbook-device-replacement) for the device itself.

**Evidence:** the ticket; for step 4, the PIM activation and the audit entry for the method deletion.

## Runbook 3 — Device replacement {#runbook-device-replacement}

**Trigger:** a device is lost, stolen, broken or due for replacement. **Executes:** end-user device support with the Intune role [Book 05](../b05-devices/06-who-owns-the-endpoint.md) assigns; identity steps by an Authentication Administrator scoped to the user's unit. **Approver:** the supervisor; security operations for a stolen device.

1. Re-proof the user, run the target check, and record whether the device was lost, stolen, broken or returned.
2. Find the Intune record for the old device:

   ```powershell
   Connect-MgGraph -Scopes 'DeviceManagementManagedDevices.PrivilegedOperations.All', 'DeviceManagementManagedDevices.Read.All' -NoWelcome
   Get-MgDeviceManagementManagedDevice -Filter "userPrincipalName eq '<user-upn>'" |
       Select-Object Id, DeviceName, SerialNumber, LastSyncDateTime, AzureAdDeviceId
   ```

3. Act on the old device by its `Id`. **Lost or stolen:** wipe it. **Returned for reuse:** retire it, which removes the agency's data and management, before reimaging:

   ```powershell
   # Lost or stolen
   Clear-MgDeviceManagementManagedDevice -ManagedDeviceId '<managed-device-id>'
   # Returned for reuse
   Invoke-MgRetireDeviceManagementManagedDevice -ManagedDeviceId '<managed-device-id>'
   ```

   Both actions take `DeviceManagementManagedDevices.PrivilegedOperations.All`, and the Intune Graph API needs an active Intune license for the tenant.[^aB-retire]

4. Remove the old device's Windows Hello for Business registration and any device-bound passkey on it ([Runbook 2](#runbook-whfb-reset) step 4, [Runbook 1](#runbook-lost-passkey) step 3).
5. Provision the new device through the enrollment path [Book 05](../b05-devices/04-intune-first-onboarding.md) sets. During Microsoft Entra join, a user can authenticate with a Temporary Access Pass to join the device and register Windows Hello for Business, so the pass from [Runbook 1](#runbook-lost-passkey) step 4 serves here too.[^aB-tap]
6. Close the ticket when the new device shows as compliant and the old one is wiped or retired.

**Escalate** to security operations immediately for a stolen device, and to the data owner if it held data the wipe can't be confirmed for. **Evidence:** the ticket; the Intune action and its completion state; the method deletions; the new device's compliance state.

## Runbook 4 — BitLocker recovery key request {#runbook-bitlocker-recovery}

**Trigger:** a Windows device boots to the BitLocker recovery screen. **Executes:** a technician holding one of the roles Microsoft lists for reading BitLocker keys: Cloud Device Administrator, Helpdesk Administrator, Intune Administrator, Security Administrator or Security Reader; the device's registered owner can also read it.[^aB-bitlocker-view] **Approver:** none for the device's owner on a verified call; the supervisor for any other requester.

A recovery key unlocks the drive for whoever holds it. Reading one is recorded: showing a key in the Entra or Intune admin center writes an audit entry in the `KeyManagement` category, and the Graph call returns the key only when it is explicitly selected, which also writes the audit entry.[^aB-bitlocker-view][^aB-bitlocker-graph]

1. Re-proof the caller and confirm they are the device's registered user. A key is never read out to someone who isn't.
2. Ask for the **Key ID** the recovery screen shows, and find the device's keys:

   ```powershell
   Connect-MgGraph -Scopes 'BitlockerKey.Read.All', 'Device.Read.All' -NoWelcome
   $dev = Get-MgDevice -Filter "displayName eq '<device-name>'" -Property 'id', 'deviceId', 'displayName'
   Get-MgInformationProtectionBitlockerRecoveryKey -Filter "deviceId eq '$($dev.DeviceId)'" |
       Select-Object Id, CreatedDateTime, VolumeType
   ```

3. Read only the key whose `Id` begins with the Key ID on the screen:

   ```powershell
   (Get-MgInformationProtectionBitlockerRecoveryKey -BitlockerRecoveryKeyId '<key-id>' -Property 'key').Key
   ```

4. Read it to the verified user on the call, then treat it as disclosed: device support rotates the key through the device-management tool ([Book 05](../b05-devices/10-operating-and-evidencing-the-fleet.md)), and the ticket records that it did. That rotation is the program's position, not a Microsoft requirement.
5. If no key is found, Entra ID holds up to 200 recovery keys per device and silent encryption fails when the key can't be backed up,[^aB-bitlocker-intune] so a missing key is itself a device finding for Book 05's encryption report, not only a lost drive.

**Escalate** to security operations when the requester isn't the registered user, when the device is reported stolen, or when the same device asks for recovery more than once in a week. **Evidence:** the ticket; the `KeyManagement` audit entry; the rotation record.

## Runbook 5 — Emergency access account incident {#runbook-emergency-access-incident}

**Trigger:** the SIEM's alert on any sign-in by, or change to, an emergency access account; or a caller who says they need one. **Executes:** the help desk executes nothing on these accounts. It opens the incident and routes it. **Owners:** security operations leads the incident; the Tier 0 custodians named in the Book 04 register act on the accounts.

Microsoft recommends alerting on every use of an emergency access account, a post-use review of whether the use was a drill, a real emergency or misuse, and validation of the accounts at least every 90 days.[^aB-emergency] Its security-operations guidance adds that a sign-in, a password change, a permission or role change, and a new or changed authentication method on one of these accounts should each raise a high-priority alert.[^aB-secops-priv] The account design is [Book 04's](../b04-access/04-privileged-roles-and-tiers.md#emergency-access-accounts).

1. **A caller asks for an emergency account.** Don't discuss the accounts or their custodians. Open a priority 1 security ticket and transfer to security operations; the caller's need is the incident.
2. **The alert fires.** The service desk supervisor opens a priority 1 incident and pages security operations and the Tier 0 custodians.
3. Security operations checks the drill calendar. A scheduled drill is closed as such, with the custodian's confirmation. Anything else is treated as a compromise until shown otherwise.
4. Security operations pulls the accounts' recent activity, from Microsoft's own query pattern:[^aB-emergency]

   ```kql
   SigninLogs
   | where TimeGenerated > ago(7d)
   | where UserId == "<emergency-account-object-id-1>" or UserId == "<emergency-account-object-id-2>"
   | project TimeGenerated, UserPrincipalName, UserId, IPAddress, ResultType, ResultDescription
   ```

   ```kql
   AuditLogs
   | where TimeGenerated > ago(7d)
   | where tostring(InitiatedBy.user.id) in ("<emergency-account-object-id-1>", "<emergency-account-object-id-2>")
       or TargetResources has "<emergency-account-object-id-1>" or TargetResources has "<emergency-account-object-id-2>"
   | project TimeGenerated, OperationName, Result, InitiatedBy, TargetResources
   ```

5. **Unauthorized use.** The Tier 0 custodians, under Book 04's two-person rule, revoke the account's sessions, replace its credential with a new phishing-resistant one, and reverse every change the audit query shows; security operations runs the incident under [Book 12](../b12-security-operations/index.md).
6. **Any use, authorized or not.** Hold the post-use review Microsoft describes, then re-validate the account (sign-in and an administrative task) and confirm the alert fired, as the 90-day validation does.

**Evidence:** the incident record; the alert; the query results; the custodians' actions with their approvals; the post-use review; the re-validation record.

## Runbook 6 — Blocked by Conditional Access {#runbook-blocked-by-conditional-access}

**Trigger:** a user sees "You cannot access this right now" or an `AADSTS53xxx` error. **Executes:** the help desk reads; it never edits a policy or adds an exclusion. Reading the sign-in log takes Reports Reader, and seeing which policies applied also takes permission to read the policies, which Security Reader gives ([Chapter 04](04-help-desk-authority-in-entra.md#evidence-every-action-leaves)). **Escalates to:** device support for device causes; security operations and the identity governance officer for policy causes.

1. Ask the user for the error code, request ID and time from the error page; no re-proofing is needed to read logs, but nothing is changed on the account.
2. Find the sign-in:

   ```powershell
   Connect-MgGraph -Scopes 'AuditLog.Read.All', 'Policy.Read.All' -NoWelcome
   $since = (Get-Date).ToUniversalTime().AddHours(-24).ToString('yyyy-MM-ddTHH:mm:ssZ')
   Get-MgAuditLogSignIn -Filter "userPrincipalName eq '<user-upn>' and createdDateTime ge $since" -Top 50 |
       Where-Object { $_.Status.ErrorCode -ne 0 } |
       Select-Object CreatedDateTime, AppDisplayName, ConditionalAccessStatus,
           @{ n = 'ErrorCode'; e = { $_.Status.ErrorCode } }, CorrelationId
   ```

3. Read the error code against Microsoft's list and route it:[^aB-ca-troubleshoot]

   | Code | Meaning | Route |
   |---|---|---|
   | 53000 | DeviceNotCompliant | Device support: bring the device into compliance ([Book 05](../b05-devices/index.md)) |
   | 53001 | DeviceNotDomainJoined | Device support: join state |
   | 53002 | ApplicationUsedIsNotAnApprovedApp | Tell the user which approved app to use |
   | 53003 | BlockedByConditionalAccess | Identify the policy (step 4), then security operations |
   | 53004 | ProofUpBlockedDueToRisk | Security operations: risky user or sign-in; don't help the user register methods |
   | 53009 | Application needs to enforce Intune protection policies | Device support: app protection |

4. For 53003, open the sign-in in the admin center's **Conditional Access** tab, or run the sign-in diagnostic or the What If tool, to name the policy that blocked.[^aB-ca-troubleshoot] Record the policy name in the ticket.
5. **Fix the cause, not the policy.** A block that the policy intends stays; the user is told how to meet it. A block the business needs lifted goes to the identity governance officer as an exception request, which [Book 04, Chapter 07](../b04-access/07-the-conditional-access-policy-library.md#rollout-from-report-only-to-enforcement) handles as a time-bound exclusion group with an owner and an expiry. The help desk never adds a user to an exclusion group.
6. **Many users blocked at once** is a backout trigger for the policy's owner, not a help desk fix: escalate to identity engineering, who apply Book 04's rollback (report-only first).

**Evidence:** the ticket with the error code, the policy named and the routing; any exception request and its decision.

## The help-desk simulation {#the-help-desk-simulation}

A runbook proves itself only when someone tries to break it. The simulation is how the program tests, before an attacker does, that each recovery is authorized as designed and leaves the audit record it should. It supports CA-2 (control assessments) and IR-3 (incident response testing) as evidence. Run it quarterly as a tabletop against the production procedure, and in a test tenant before any change to a runbook goes to ring 1.

| # | Scenario | What the tester does | Pass when | Evidence |
|---|---|---|---|---|
| 1 | Pretext call | Calls as a named employee, urgent, with correct public details, asking for an authenticator reset | The technician refuses to act without re-proofing and routes to the supervisor | Call record; ticket shows refusal and routing |
| 2 | Lost passkey | A test user reports a lost security key | Runbook 1 completes; the old key is gone; the user registers a new one | Audit entries; method list |
| 3 | Admin target | The same request for a test user who holds a directory role | The target check stops the technician and the ticket routes to Tier 0 | Ticket routing; no audit entry from the help desk |
| 4 | Recovery key to the wrong person | A tester who isn't the registered user asks for a BitLocker key | Refused and escalated; no `KeyManagement` read | Ticket; absence of the audit entry |
| 5 | Emergency account drill | Custodians sign in with an emergency account on the drill calendar | The alert fires within the rule's window; the drill is closed as such | Alert; incident record; drill record |
| 6 | Conditional Access block | A test user on a noncompliant device signs in | The technician names code 53000, routes to device support and doesn't touch the policy | Ticket with code and routing |
| 7 | Unmatched action | Identity engineering performs a method reset with no ticket, in the test tenant | The SIEM rule raises the unmatched-action alert | Alert record |

CISA's advisory on the Scattered Spider group describes exactly scenario 1, help desk staff called by actors posing as employees, and recommends training against it;[^aB-cisa-spider] [Book 16](../b16-people/index.md) carries the training. Each run is kept as a test record (scenario, expected and observed result, date, tester) and feeds the monthly harness review in [Chapter 12](12-the-day-two-runbook.md#validation-and-test-harnesses).

## Key takeaways

- Every recovery runbook opens with re-proofing and the target check and closes with joined evidence and a second-channel notice.
- The help desk executes the ordinary recoveries; it never acts on an emergency access account, a privileged account or a Conditional Access policy.
- A disclosed BitLocker key is a spent key, and a missing one is a device finding.
- The quarterly simulation, including a pretext call, is the evidence that the runbooks work.

::: {.callout-tip}
## Continue the book
[← Previous: Appendix A — Help Desk Task Reference](appendix-a-help-desk-task-reference.md) · [Book index](index.md)
:::

[^aB-nist-63b]: National Institute of Standards and Technology, SP 800-63B-4, *Digital Identity Guidelines: Authentication and Authenticator Management*, July 2025, section 4.2, "Account Recovery," <https://pages.nist.gov/800-63-4/sp800-63b.html> (accessed Oct 21, 2026, as cited in [Chapter 04](04-help-desk-authority-in-entra.md)).
[^aB-vid-gcc]: Microsoft Learn, "What's new in Microsoft Entra Verified ID," September 2025 ("Entra Verified ID is supported on Microsoft GCC environments ... GCC only and not GCC High"), <https://learn.microsoft.com/entra/verified-id/whats-new>; and "Account recovery overview," <https://learn.microsoft.com/entra/identity/authentication/concept-account-recovery-overview> (both accessed Nov 9, 2026, as cited in [Chapter 04](04-help-desk-authority-in-entra.md)).
[^aB-featavail]: Microsoft Learn, "Microsoft Entra feature availability," table "Microsoft Entra ID," rows "Passwordless (Windows Hello for Business, Microsoft Authenticator, FIDO2 security key integrations)" and "Certificate-based authentication," <https://learn.microsoft.com/entra/identity/authentication/feature-availability> (accessed Nov 11, 2026). GCC tenants use Microsoft Entra ID in the commercial cloud ([Book 10, Chapter 05](../b10-cloud-boundary/05-the-landing-zone.md#which-cloud)).
[^aB-tap-api]: Microsoft Learn, "Create temporaryAccessPassMethod" (Microsoft Graph v1.0; national clouds: global, US Government L4 and L5; built-in roles Authentication Administrator and Privileged Authentication Administrator; one usable pass per user), <https://learn.microsoft.com/graph/api/authentication-post-temporaryaccesspassmethods> (accessed Nov 11, 2026).
[^aB-fido2-delete]: Microsoft Learn, "Delete fido2AuthenticationMethod" (Microsoft Graph v1.0; national clouds: global, US Government L4 and L5; built-in roles Authentication Administrator and Privileged Authentication Administrator; PowerShell `Remove-MgUserAuthenticationFido2Method`), <https://learn.microsoft.com/graph/api/fido2authenticationmethod-delete> (accessed Nov 11, 2026).
[^aB-tap]: Microsoft Learn, "Configure Temporary Access Pass to register passwordless authentication methods," section "Use a Temporary Access Pass" (10 minutes to register with a single-use pass; Windows device setup with a pass; users replacing lost credentials should remove the old methods), <https://learn.microsoft.com/entra/identity/authentication/howto-authentication-temporary-access-pass> (accessed Nov 11, 2026).
[^aB-retire]: Microsoft Learn, "retire action" (Intune, Microsoft Graph v1.0; national clouds: global, US Government L4 and L5; permission `DeviceManagementManagedDevices.PrivilegedOperations.All`; an active Intune license is required), <https://learn.microsoft.com/graph/api/intune-devices-manageddevice-retire>; and "Microsoft.Graph.DeviceManagement.Actions" (`Clear-MgDeviceManagementManagedDevice`, wipe; `Invoke-MgRetireDeviceManagementManagedDevice`, retire), <https://learn.microsoft.com/powershell/module/microsoft.graph.devicemanagement.actions/> (both accessed Nov 11, 2026).
[^aB-bitlocker-view]: Microsoft Learn, "Manage device identities using the Microsoft Entra admin center," section "View or copy BitLocker keys" (roles; device owner; **Show Recovery Key** writes an audit entry in the `KeyManagement` category), <https://learn.microsoft.com/entra/identity/devices/manage-device-identities#view-or-copy-bitlocker-keys> (accessed Nov 11, 2026).
[^aB-bitlocker-graph]: Microsoft Learn, "Get-MgInformationProtectionBitlockerRecoveryKey" (the key is returned only when selected, which triggers an audit entry), <https://learn.microsoft.com/powershell/module/microsoft.graph.identity.signins/get-mginformationprotectionbitlockerrecoverykey>; and "BitLocker recovery process," section "Helpdesk recovery," <https://learn.microsoft.com/windows/security/operating-system-security/data-protection/bitlocker/recovery-process#helpdesk-recovery> (both accessed Nov 11, 2026).
[^aB-bitlocker-intune]: Microsoft Learn, "Encrypt Windows devices with BitLocker using Intune," section "Monitor and manage BitLocker" (encryption report; recovery keys in the Intune admin center; a maximum of 200 keys per device, after which silent encryption fails), <https://learn.microsoft.com/intune/device-configuration/endpoint-security/encrypt-bitlocker-windows#monitor-and-manage-bitlocker> (accessed Nov 11, 2026).
[^aB-pin-reset]: Microsoft Learn, "PIN reset" (destructive and nondestructive PIN reset; requirements; `dsregcmd /status` and the `CanReset` value), <https://learn.microsoft.com/windows/security/identity-protection/hello-for-business/pin-reset> (accessed Nov 11, 2026).
[^aB-whfb-faq]: Microsoft Learn, "Common questions about Windows Hello for Business," "How do I delete a Windows Hello for Business container on a device?" (`certutil.exe -deleteHelloContainer`; on recent Windows 11 it also clears passkeys stored on the device), <https://learn.microsoft.com/windows/security/identity-protection/hello-for-business/faq> (accessed Nov 11, 2026).
[^aB-whfb-delete]: Microsoft Learn, "Remove-MgUserAuthenticationWindowsHelloForBusinessMethod" (deletes a `windowsHelloForBusinessAuthenticationMethod`; delegated permissions include `UserAuthMethod-WindowsHello.ReadWrite.All`), <https://learn.microsoft.com/powershell/module/microsoft.graph.identity.signins/remove-mguserauthenticationwindowshelloforbusinessmethod> (accessed Nov 11, 2026).
[^aB-emergency]: Microsoft Learn, "Manage emergency access accounts in Microsoft Entra ID," sections "Security guardrails summary," "Monitor sign-in and audit logs" (sample `SigninLogs` queries; post-mortem review) and "Validate accounts regularly" (at least every 90 days), <https://learn.microsoft.com/entra/identity/role-based-access-control/security-emergency-access> (accessed Nov 11, 2026).
[^aB-secops-priv]: Microsoft Learn, "Security operations for privileged accounts in Microsoft Entra ID," section "Emergency access accounts" (high-priority alert on sign-in, password change, permission or role change, and credential or authentication method change), <https://learn.microsoft.com/entra/architecture/security-operations-privileged-accounts> (accessed Nov 11, 2026).
[^aB-ca-troubleshoot]: Microsoft Learn, "Troubleshoot sign-in problems with Conditional Access," sections "Microsoft Entra sign-in events" and "Common Conditional Access error codes," <https://learn.microsoft.com/entra/identity/conditional-access/troubleshoot-conditional-access> (accessed Nov 11, 2026).
[^aB-cisa-spider]: Cybersecurity and Infrastructure Security Agency, AA23-320A, *Scattered Spider*, November 16, 2023 (updated July 29, 2025), <https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-320a> (accessed Oct 21, 2026, as cited in [Chapter 04](04-help-desk-authority-in-entra.md)).
