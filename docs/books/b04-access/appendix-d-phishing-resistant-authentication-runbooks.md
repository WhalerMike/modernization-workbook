---
title: "Appendix D — Phishing-Resistant Authentication Runbooks"
description: "Rollout runbooks for the three phishing-resistant methods the program deploys, passkeys (FIDO2), Windows Hello for Business and certificate-based authentication: bootstrap with a Temporary Access Pass, recovery, a lost or forgotten authenticator, the line between these runbooks and emergency access, and support-desk verification, each as copy-paste Microsoft Graph PowerShell commands; registration-coverage and recovery-test metrics; government-cloud availability; the control states, evidence checklist and Zero Trust assessment mapping."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b04-access
book: B04
part: Appendix
series-order: 93
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
---

# Appendix D — Phishing-Resistant Authentication Runbooks

*A phishing-resistant method is only as strong as the way a person first gets it and the way they get it back; the bootstrap and the recovery are where attackers go.*

::: {.callout-note}
## In this appendix
Runbooks for passkeys (FIDO2), Windows Hello for Business and certificate-based authentication: how a person gets the first credential, how they recover it, what happens when one is lost, where these runbooks stop and emergency access starts, and how the support desk verifies the person before acting. Then the metrics that show registration coverage and recovery working, government-cloud availability, and the control states, evidence and assessment mapping.
:::

[Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md#the-phishing-resistant-authentication-roadmap) owns the roadmap (which population gets which method, in which order) and the [authentication methods policy](../b02-identity/10-migrating-and-governing.md#authentication-methods-policy). [Chapter 07](07-the-conditional-access-policy-library.md#wave-5-segments-and-the-end-state) enforces the result through CA003 and CA022. This appendix adds what a Zero Trust assessment finds missing once the methods are switched on: the operational runbooks that put a credential in a person's hands and get it back to them safely. Where another book owns a piece, the runbook links to it: [Book 07, Chapter 09](../b07-pki/09-federal-workforce-credentials.md) for the PIV card and certificate-based authentication settings, [Book 05](../b05-devices/index.md) for the Windows Hello for Business policy on managed devices, and [Book 15, Chapter 03](../b15-day2-operations/03-intake-triage-and-routing.md#verify-the-person-before-a-sensitive-action) for the support desk's verification ladder. The conventions are [Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md)'s.

**Authority:** Mandated: OMB M-22-09 requires phishing-resistant MFA for agency staff, contractors and partners, and CISA's BOD 25-01 lists MS.AAD.3.1, phishing-resistant MFA for all users, as a required configuration ([Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md#the-phishing-resistant-authentication-roadmap); [Chapter 07](07-the-conditional-access-policy-library.md#cisa-bod-25-01)). Microsoft-recommended: the methods, the Temporary Access Pass as the bootstrap, and at least two credentials per person (Learn, read Nov 11, 2026).[^aD4-personas][^aD4-tap] Risk-based recommended: the runbook values, which are the program's.
**Applies:** all tenants with Microsoft Entra ID P1 for the Conditional Access enforcement. Environment-dependent: see [GCC availability](#b04-appd-government-cloud-availability).

## The runbooks on one page {#b04-appd-runbooks-on-one-page}

| | Passkey (FIDO2) | Windows Hello for Business | Certificate-based authentication (PIV, CAC, derived PIV) |
|---|---|---|---|
| **Who gets it** (Book 02's roadmap) | Privileged accounts first (device-bound, attestation enforced), then everyone else | Users of managed Windows devices | PIV and CAC holders |
| **Bootstrap** | A one-time Temporary Access Pass, then registration at Security info | A Temporary Access Pass during Microsoft Entra join, or on an already-joined device after another method | The card itself; no pass needed once the certificate authorities and username bindings are configured |
| **Second credential** | A second key, or Windows Hello for Business on a managed device | A passkey (FIDO2) key, so a lost device doesn't strand the person | A passkey (FIDO2) key; Learn recommends deploying passkeys or Windows Hello for Business alongside smart cards[^aD4-personas] |
| **Forgotten PIN** | Handled as a lost key: delete the method, clear the key with its manufacturer's management tool, register again[^aD4-orphaned] | Windows Hello PIN reset, which needs MFA[^aD4-pin-reset] | The card issuer's PIN reset process ([Book 07, Chapter 09](../b07-pki/09-federal-workforce-credentials.md#the-cards-lifecycle)) |
| **Lost authenticator** | Delete the key's method, revoke sessions, verify the person, issue a pass, register a new key | Delete the method, disable the device, revoke sessions, verify, issue a pass, re-provision | The issuer revokes the card's certificate; the person signs in with the second credential, or is verified and given a pass to register one |
| **Support-desk verification** | [Book 15's ladder](../b15-day2-operations/03-intake-triage-and-routing.md#verify-the-person-before-a-sensitive-action), for every row | Same | Same |
| **Emergency access** | Out of scope: the emergency accounts' credentials are never touched by these runbooks ([below](#b04-appd-where-the-runbooks-stop)) | Same | Same |

Microsoft's persona guidance runs the same phases: onboarding with a Temporary Access Pass, then a portable credential (a passkey or a smart card), then optionally a local credential such as Windows Hello for Business, and it recommends that every user have at least two credentials registered.[^aD4-personas]

## Prerequisites {#b04-appd-prerequisites}

- The authentication methods policy configured as [Book 02](../b02-identity/10-migrating-and-governing.md#authentication-methods-policy) sets it: passkeys with profiles, certificate-based authentication as multifactor for PIV and CAC holders, Windows Hello for Business on managed devices, and the Temporary Access Pass enabled with one-time use and a one-hour lifetime for passes the help desk issues.
- Roles: an Authentication Administrator can create a pass for members only; a Privileged Authentication Administrator can create one for administrators too ([Book 15, Chapter 03](../b15-day2-operations/03-intake-triage-and-routing.md#verify-the-person-before-a-sensitive-action)). Both are held eligible in PIM ([Chapter 08](08-pim-self-request-with-approval.md)).
- The Microsoft Graph PowerShell SDK on the support workstation; every command below is copy-paste with the placeholders `<user-upn>` (the person's user principal name) and `<method-id>` (from the list command) filled in.
- GCC availability confirmed ([below](#b04-appd-government-cloud-availability)).

Read the policy before running anything else. Read-only:

```powershell
Connect-MgGraph -Scopes 'Policy.Read.All' -NoWelcome
Get-MgPolicyAuthenticationMethodPolicyAuthenticationMethodConfiguration -AuthenticationMethodConfigurationId 'Fido2' | Format-List Id, State
Get-MgPolicyAuthenticationMethodPolicyAuthenticationMethodConfiguration -AuthenticationMethodConfigurationId 'X509Certificate' | Format-List Id, State
Get-MgPolicyAuthenticationMethodPolicyAuthenticationMethodConfiguration -AuthenticationMethodConfigurationId 'TemporaryAccessPass' | Format-List Id, State, AdditionalProperties
```

Expected: `State` is `enabled` for each, and the pass configuration shows one-time use and the lifetimes Book 02 sets.

## Bootstrap {#b04-appd-bootstrap}

A new person, or a person moving to a phishing-resistant method for the first time, gets a Temporary Access Pass, a time-limited passcode that lets them sign in and register a passwordless method without a password.[^aD4-tap] Microsoft notes that the pass itself isn't phishing-resistant and isn't a permanent method; it solves the first sign-in.[^aD4-intune-pwdless]

1. Verify the person on the rung of [Book 15's ladder](../b15-day2-operations/03-intake-triage-and-routing.md#verify-the-person-before-a-sensitive-action) that fits; for a new hire, the pre-hire workflow ([Book 03, Chapter 08](../b03-hr-identity/08-joiner-mover-leaver.md#built-in-tasks-by-stage)) issues the pass instead.
2. Issue a one-time pass with a one-hour lifetime. The value is shown once; hand it over in the verified session, never by email.

```powershell
Connect-MgGraph -Scopes 'UserAuthenticationMethod.ReadWrite.All' -NoWelcome
New-MgUserAuthenticationTemporaryAccessPassMethod -UserId '<user-upn>' -BodyParameter @{ isUsableOnce = $true; lifetimeInMinutes = 60 } |
    Select-Object TemporaryAccessPass, LifetimeInMinutes, IsUsableOnce, StartDateTime
```

3. The person registers the method:
   - **Passkey (FIDO2):** sign in at Security info (`https://mysignins.microsoft.com/security-info`) with the pass and add the key.[^aD4-tap]
   - **Windows Hello for Business:** on a new device, sign in with the pass during Microsoft Entra join and set up Windows Hello for Business in the same flow; on a device that is already joined, sign in first with another method such as a password, smart card or passkey, then use the pass to set up Windows Hello for Business.[^aD4-tap]
   - **Certificate-based authentication:** no pass is needed; the person signs in with the card once [Book 07's settings](../b07-pki/09-federal-workforce-credentials.md#how-entra-cba-uses-the-piv-authentication-certificate) are in place. Register the second credential with the card session.
4. Register the second credential in the same session ([the table above](#b04-appd-runbooks-on-one-page)).

A one-time pass gives 10 minutes after sign-in to finish registering a passwordless method; Learn offers two single-use passes, or one multi-use pass, where device setup takes longer.[^aD4-tap] The program's accommodation for a person who needs more time is [Book 15's](../b15-day2-operations/03-intake-triage-and-routing.md#verify-the-person-before-a-sensitive-action): the CISO's ladder says when a multi-use pass may be issued.

## Recovery and a lost authenticator {#b04-appd-recovery-and-a-lost-authenticator}

Recovery starts with verification, never with the reset. Learn tells users who replace a lost credential to remove the old method; the runbook does it for them, so a found key can't be used.[^aD4-tap]

1. Verify the person on [Book 15's ladder](../b15-day2-operations/03-intake-triage-and-routing.md#verify-the-person-before-a-sensitive-action). A person who still holds a second phishing-resistant credential signs in with it and raises the ticket from that session; nothing more is needed to verify them. A person who holds a directory role is escalated, not handled at the desk.
2. List the person's methods. Read-only:

```powershell
Connect-MgGraph -Scopes 'UserAuthenticationMethod.ReadWrite.All', 'User.RevokeSessions.All' -NoWelcome
Get-MgUserAuthenticationMethod -UserId '<user-upn>' |
    Select-Object Id, @{ n = 'Type'; e = { $_.AdditionalProperties['@odata.type'] } }
```

3. Remove the lost method, by type. These commands **write**; the method can't be restored, only registered again.

```powershell
# A lost security key (passkey, FIDO2):
Remove-MgUserAuthenticationFido2Method -UserId '<user-upn>' -Fido2AuthenticationMethodId '<method-id>'

# A lost or stolen Windows device (Windows Hello for Business):
Remove-MgUserAuthenticationWindowsHelloForBusinessMethod -UserId '<user-upn>' -WindowsHelloForBusinessAuthenticationMethodId '<method-id>'
```

   For a lost device, also disable the device object ([Book 12, Chapter 11](../b12-security-operations/11-detection-engineering-and-response.md) has the device step) and start Intune's retire or wipe through [Book 05](../b05-devices/index.md)'s process. For a lost PIV or CAC card, the card issuer revokes the certificate under [Book 07's lifecycle](../b07-pki/09-federal-workforce-credentials.md#the-cards-lifecycle); there is no Entra method to delete.

4. Revoke the person's sessions, so tokens the lost authenticator obtained stop working:

```powershell
Revoke-MgUserSignInSession -UserId '<user-upn>'
```

5. Issue a one-time pass as in [Bootstrap](#b04-appd-bootstrap) step 2, unless the person already holds a working second credential, and have them register the replacement and, if they have none left, a new second credential.
6. Notify the person through a channel other than the one just recovered, as Book 15 requires, and close the ticket with the rung used, the method IDs removed and the audit reference.

A forgotten Windows Hello PIN isn't a lost authenticator. The PIN reset service lets the person reset it from the lock screen or Settings after completing MFA, once the service is registered in the tenant and enabled on devices.[^aD4-pin-reset] A forgotten security key PIN is handled as a lost key from step 3; before the key is used again, its old passkey is removed with the key's management tool, as Learn advises for a passkey left on a key after its method was deleted.[^aD4-orphaned]

## Where the runbooks stop {#b04-appd-where-the-runbooks-stop}

The emergency access accounts are outside every runbook here. Their credentials are custody items, not support items: the help desk never lists, removes or replaces their methods and never issues them a pass, and Microsoft's own standard is that their credentials don't expire and aren't tied to any individual's device ([Chapter 04](04-privileged-roles-and-tiers.md#emergency-access-reference-architecture)). After an emergency use, the replacement is step 7 of [Chapter 06's emergency procedure](06-who-decides-access.md#emergency-access), done by the Privileged Role Administrator. Equally, a person locked out by a lost credential is never helped by using an emergency account: the runbooks above are the path, and emergency access is for the tenant, not for one person.

## Report-only and the readiness gate {#b04-appd-report-only-and-the-readiness-gate}

Enforcement is CA022 and CA003, not these runbooks. CA022 has run in report-only since the first day of the program, and its report-only failures are the list of people still to bootstrap ([Chapter 07](07-the-conditional-access-policy-library.md#sign-in-log-queries)). A population moves out of `CA-Exclude-PhishResistantNotReady` only after its readiness gate (95 percent registered) is met and a recovery drill has passed for it. Rollback for one person is adding them back to that group with an expiry, never weakening the policy ([the policy design matrix](07-the-conditional-access-policy-library.md#policy-design-matrix)).

## Registration coverage and recovery metrics {#b04-appd-metrics}

Registration coverage comes from the user registration details report. Read-only; it needs a reports-reading role such as Reports Reader:

```powershell
Connect-MgGraph -Scopes 'AuditLog.Read.All', 'UserAuthenticationMethod.Read.All' -NoWelcome
$Details = Get-MgReportAuthenticationMethodUserRegistrationDetail -All
$Details | Select-Object UserPrincipalName, IsAdmin, IsPasswordlessCapable, IsMfaCapable,
    @{ n = 'Methods'; e = { $_.MethodsRegistered -join ';' } } |
    Export-Csv -Path '.\evidence\auth\registration-details.csv' -NoTypeInformation   # CONFIGURE the evidence folder

$PhishResistant = 'fido2', 'passKeyDeviceBound', 'passKeyDeviceBoundAuthenticator', 'windowsHelloForBusiness'   # confirm against your output
$Covered = $Details | Where-Object { @($_.MethodsRegistered | Where-Object { $_ -in $PhishResistant }).Count -gt 0 }
'{0:P1} of {1} users hold a passkey or Windows Hello for Business' -f ($Covered.Count / $Details.Count), $Details.Count
```

The report's `isAdmin` property lets the privileged population be counted on its own.[^aD4-registration] The `methodsRegistered` values in `$PhishResistant` are those the program expects; confirm them against the tenant's own output before reporting a number. Certificate-based authentication doesn't show as a registered method because the credential is the card, so PIV and CAC coverage is counted from successful certificate sign-ins over the period instead.

The targets below are the program's settled position ([WD-147](../../about/decision-register.md#wd-147), risk-based recommended); the recovery-time target is still the CISO's to set from the drills.

| Metric | Target (program values) | Source |
|---|---|---|
| Privileged accounts with a phishing-resistant method | 100 percent | The report, `isAdmin` true |
| Members with a phishing-resistant method, by persona | 95 percent before a population leaves the not-ready group | The report and the persona groups |
| People with two credentials | Rising each month; 100 percent of privileged accounts | The report, two or more methods in `$PhishResistant`, or one plus a PIV card |
| Recovery drill pass rate | Every drill passes; a failure is fixed before the next population moves | Drill records |
| Recovery time, verified request to new credential registered | Measured each drill; the CISO sets the target | Ticket timestamps |
| Recoveries closed with the verification rung recorded | 100 percent | Ticket audit |
| Temporary Access Passes issued outside a ticket | Zero | Audit log, matched to tickets |

**The recovery drill.** Each quarter, and before each population leaves the not-ready group, the help desk recovers a test account through steps 1 to 6 for each method in use, with security operations told first. The record holds the expected and observed result of each step, the time taken, and the audit events produced (method deleted, sessions revoked, pass created, method registered).

## GCC availability {#b04-appd-government-cloud-availability}

Read on Nov 11, 2026. GCC tenants use Microsoft Entra ID in commercial Azure.[^aD4-gov-pairing]

| Feature | GCC (Entra in commercial Azure) |
|---|---|
| Passkeys (FIDO2) security keys, Windows Hello for Business, Microsoft Authenticator | Available |
| Certificate-based authentication | Available |
| Temporary Access Pass | Available |
| Passkey profiles and synced passkeys | Not yet specified |
| Windows Hello PIN reset service | Not yet specified |
| Entra ID account recovery with Verified ID | Supported in GCC ([Book 15, Chapter 03](../b15-day2-operations/03-intake-triage-and-routing.md#verify-the-person-before-a-sensitive-action)) |

## Evidence {#b04-appd-evidence}

**Evidence checklist**

- [ ] **Configuration:** the authentication methods policy export (the read-only commands under [Prerequisites](#b04-appd-prerequisites), saved as JSON) and the CA003 and CA022 exports
- [ ] **Operational:** `registration-details.csv` each month, the coverage figures, and the audit log's method-registration, method-deletion and pass-creation events
- [ ] **Test:** the quarterly recovery drill records, one per method in use, and CA022's report-only results for the population about to move
- [ ] **Exception:** `CA-Exclude-PhishResistantNotReady` membership with each member's expiry, and every multi-use pass issued as an accommodation with the CISO's approval
- [ ] **Assessor-ready artifact:** the period's evidence package entry: coverage by persona, drill results and the exception list

## Day-two ownership {#b04-appd-day-two-ownership}

The identity engineering lead owns the methods policy and the coverage report; the help desk manager owns the runbooks and the drills; the CISO owns the verification ladder ([Book 15](../b15-day2-operations/index.md)). Cadence: coverage monthly, drills quarterly, the runbooks reviewed when Microsoft changes a method or Book 02's policy changes. Drift is a method enabled outside the policy, a pass issued without a ticket, a recovery closed without its rung, or coverage falling.

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | Book 02's roadmap and this appendix's runbooks | The approved roadmap, methods policy and verification ladder |
| Configured | [Prerequisites](#b04-appd-prerequisites) | The methods policy export |
| Enforced | CA003 and CA022, as each population leaves the not-ready group | Policy exports and the group's shrinking membership |
| Evidenced | The recovery drill and the coverage report | Drill records and `registration-details.csv` |
| Operated | Day-two ownership above | The monthly coverage trend, drill calendar and ticket audit |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** Identity
- **CISA ZTMM pillar:** Identity
- **Depends on:** Devices (managed Windows devices for Windows Hello for Business, [Book 05](../b05-devices/index.md)); the PKI and card lifecycle ([Book 07](../b07-pki/index.md)); SecOps (registration and recovery events, [Book 12](../b12-security-operations/index.md))
- **Attack chain interrupted:** Initial Access and Credential Access through phishing, MFA fatigue and help-desk social engineering: the credential can't be relayed, and a recovery hands a new one only to a verified person
:::

::: {.callout-tip}
## Continue the book
[← Previous: Appendix C — Partner Access Profile (Microsoft Entra)](appendix-c-partner-access-profile-entra.md) · [Book index](index.md)
:::

[^aD4-personas]: Microsoft Learn, "Considerations for specific personas in a phishing-resistant passwordless authentication deployment in Microsoft Entra ID," sections "Deployment for Admins and Highly regulated users" (phases: onboarding with a Temporary Access Pass, portable credential, optional local credential; at least two credentials; passkeys or Windows Hello for Business in addition to smart cards) and "Deployment for non-admin users," <https://learn.microsoft.com/entra/identity/authentication/how-to-plan-persona-phishing-resistant-passwordless-authentication> (accessed Nov 11, 2026).
[^aD4-tap]: Microsoft Learn, "Configure Temporary Access Pass to register passwordless authentication methods," section "Use a Temporary Access Pass" (registration at Security info; remove old methods after replacing lost credentials; Windows device setup for joined and already-joined devices; the 10-minute registration window with a single-use pass; two single-use passes or one multi-use pass), <https://learn.microsoft.com/entra/identity/authentication/howto-authentication-temporary-access-pass> (accessed Nov 11, 2026).
[^aD4-intune-pwdless]: Microsoft Learn, "Passwordless authentication with Microsoft Intune," section "How Microsoft Intune drives passwordless adoption" (the Temporary Access Pass isn't a permanent passwordless method and isn't phishing-resistant; day-zero onboarding flow), <https://learn.microsoft.com/intune/solutions/passwordless> (accessed Nov 11, 2026).
[^aD4-pin-reset]: Microsoft Learn, "Passwordless sign-in" (Windows security book), section "PIN reset" (the Microsoft PIN Reset Service; registered in the tenant and enabled on devices; reset requires MFA), <https://learn.microsoft.com/windows/security/book/identity-protection-passwordless-sign-in> (accessed Nov 11, 2026).
[^aD4-registration]: Microsoft Learn, "New-MgReportAuthenticationMethodUserRegistrationDetail" (Microsoft Graph PowerShell, `Microsoft.Graph.Reports`), complex parameter notes for userRegistrationDetails (`IsAdmin`, `IsMfaCapable`, `IsPasswordlessCapable`, `MethodsRegistered`), <https://learn.microsoft.com/powershell/module/microsoft.graph.reports/new-mgreportauthenticationmethoduserregistrationdetail?view=graph-powershell-1.0> (accessed Nov 11, 2026).
[^aD4-gov-pairing]: Microsoft Learn, "Cloud feature availability for US Government customers," section "Microsoft 365 integration," <https://learn.microsoft.com/azure/security/fundamentals/feature-availability#microsoft-365-integration> (accessed Nov 11, 2026).
[^aD4-orphaned]: Microsoft Learn, "Sign in with a FIDO2 security key," section "Known issues," "Orphaned passkey" (remove the orphaned passkey from the security key with its management tool, then register again), <https://learn.microsoft.com/entra/identity/authentication/how-to-security-key-sign-in> (accessed Nov 11, 2026).
