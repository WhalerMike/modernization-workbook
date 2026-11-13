# Verification — Appendix D, Phishing-Resistant Authentication Runbooks

New page, Nov 11, 2026 (Zero Trust Assessment closure, B04-05 and the Book 04 part of CM-03). Learn pages read on Nov 11, 2026.

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | Phases: onboarding with TAP, portable credential, optional local credential; at least two credentials; passkeys or WHfB alongside smart cards | Runbooks on one page | verified | https://learn.microsoft.com/entra/identity/authentication/how-to-plan-persona-phishing-resistant-passwordless-authentication | Nov 11, 2026 |
| 2 | TAP registration at Security info; remove old methods after replacing a lost credential; Entra join with TAP and WHfB; already-joined devices need another method first; 10-minute window; two single-use or one multi-use pass | Bootstrap; Recovery | verified | https://learn.microsoft.com/entra/identity/authentication/howto-authentication-temporary-access-pass | Nov 11, 2026 |
| 3 | TAP isn't a permanent method and isn't phishing-resistant | Bootstrap | verified | https://learn.microsoft.com/intune/solutions/passwordless | Nov 11, 2026 |
| 4 | Windows Hello PIN reset service; registered in tenant, enabled on devices; reset requires MFA | Forgotten PIN | verified | https://learn.microsoft.com/windows/security/book/identity-protection-passwordless-sign-in | Nov 11, 2026 |
| 5 | Orphaned passkey removed with the key's management tool, then re-register | Forgotten PIN | verified | https://learn.microsoft.com/entra/identity/authentication/how-to-security-key-sign-in | Nov 11, 2026 |
| 6 | userRegistrationDetails properties IsAdmin, IsMfaCapable, IsPasswordlessCapable, MethodsRegistered | Metrics | verified | https://learn.microsoft.com/powershell/module/microsoft.graph.reports/new-mgreportauthenticationmethoduserregistrationdetail?view=graph-powershell-1.0 | Nov 11, 2026 |
| 7 | methodsRegistered value names used for phishing-resistant coverage | Metrics | unverifiable | page tells the reader to confirm against tenant output | Nov 11, 2026 |
| 9 | Passkey profiles, synced passkeys, PIN reset service in GCC | GCC availability | not yet specified | not stated on Learn | Nov 11, 2026 |
| 10 | GCC pairs with Entra in commercial Azure | GCC availability | verified | https://learn.microsoft.com/azure/security/fundamentals/feature-availability | Nov 11, 2026 |
| 11 | Account recovery with Verified ID: GCC only; held | Government-cloud availability | verified (carried) | Book 15 Chapter 03 and its verification log; decision to hold Verified ID until available in GCC | Nov 11, 2026 |
| 12 | Authentication Administrator creates TAP for members only; Privileged Authentication Administrator for admins too | Prerequisites | verified (carried) | Book 15 Chapter 03 (c03-tap) | Nov 11, 2026 |
| 13 | M-22-09 and MS.AAD.3.1 mandate phishing-resistant MFA | Authority | verified (carried) | Book 02 Chapter 10; Chapter 07 | Nov 11, 2026 |
| 14 | Graph PowerShell commands (New-MgUserAuthenticationTemporaryAccessPassMethod, Get-MgUserAuthenticationMethod, Remove-MgUserAuthenticationFido2Method, Remove-MgUserAuthenticationWindowsHelloForBusinessMethod, Revoke-MgUserSignInSession, Get-MgPolicyAuthenticationMethodPolicyAuthenticationMethodConfiguration, Get-MgReportAuthenticationMethodUserRegistrationDetail) | Runbooks | command (illustrative, not run) | Microsoft Graph PowerShell reference | Nov 11, 2026 |
| 15 | Runbook values: one-time one-hour pass, readiness 95 percent, quarterly drill, metric targets, owners | Throughout | restated-as-design | program position | Nov 11, 2026 |
