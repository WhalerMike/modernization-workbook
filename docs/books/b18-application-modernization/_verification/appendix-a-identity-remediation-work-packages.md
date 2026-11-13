# Verification — Appendix A, Identity Remediation Work Packages

New appendix, first pass of Nov 11, 2026, written for the Zero Trust Assessment closure update (Phase 2): instruction ID B18-02 (remediation factory), the Book 18 parts of closure-map rows CM-05 (application secrets), CM-06 (ownerless privileged apps) and CM-07 (redirect URI risk). Status `draft` with `review-status: pending` (added after Release 2.0). An appendix rather than a chapter section because six work packages of copy-paste commands don't fit Chapter 10, a leadership chapter; Chapter 10 carries the summary and links here. Conversion engineering is linked to the service account migration guide (Migration C) and the Non-Person Identity guide (Steps 2 and 5), not repeated.

Primary sources opened on Nov 11, 2026 through the Microsoft Learn documentation service, plus the IETF's RFC 6749. No personal or agency detail was sent in any request; nothing from any private assessment is used.

## Claims log

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | Six work packages, entry conditions, rings, backout triggers, evidence-pack layout | Throughout | restated-as-design | Program design | Nov 11, 2026 |
| 2 | Graph activity logs: global service; Entra ID P1 or P2; Security Administrator for diagnostic settings; AppId, RequestUri columns | Prerequisites; WP2 | verified | <https://learn.microsoft.com/graph/microsoft-graph-activity-logs-overview> | Nov 11, 2026 |
| 3 | GCC uses worldwide Graph | Prerequisites | verified | <https://learn.microsoft.com/graph/deployments> | Nov 11, 2026 |
| 4 | Group-based assignment needs P1 or P2; assignment requirement doesn't apply to Global Administrators; test with the affected user; AADSTS50105 | Prerequisites; WP5 | verified | <https://learn.microsoft.com/troubleshoot/entra/entra-id/app-integration/error-code-aadsts50105-user-not-assigned-role> | Nov 11, 2026 |
| 5 | AADSTS501051 for an app-only assignment failure | WP5 | verified (the AADSTS50105 page points to it) | Same | Nov 11, 2026 |
| 6 | Removing a permission from the registration doesn't revoke an existing grant; tokens stay valid until expiry | WP2 | verified (carried from Book 04 Ch05 admin consent) | Book 04 Ch05 | Nov 11, 2026 |
| 7 | signIn beta: P1/P2 to read through Graph; `clientCredentialType` values; `servicePrincipalCredentialKeyId`; `signInEventTypes` | WP3; WP6 | verified | <https://learn.microsoft.com/graph/api/resources/signin?view=graph-rest-beta> (ms.date 2025-11-27) | Nov 11, 2026 |
| 8 | Redirect URI guidance: maintain ownership, monitor DNS, no wildcards or insecure schemes, keep list small | WP4 | verified | <https://learn.microsoft.com/entra/identity-platform/security-best-practices-for-app-registration> | Nov 11, 2026 |
| 9 | RFC 6749 §3.1.2: redirection endpoint must be an absolute URI | WP4 | verified | <https://www.rfc-editor.org/rfc/rfc6749#section-3.1.2> | Nov 11, 2026 |
| 10 | Wildcards only for work/school apps via manifest, strongly discouraged; state-parameter alternative; AADSTS50011; separate dev and prod registrations; redirect URIs on the application object only | WP4 | verified | <https://learn.microsoft.com/entra/identity-platform/reply-url> | Nov 11, 2026 |
| 11 | Dangling DNS: remove CNAMEs to deprovisioned resources; investigate; OAuth credentials sent to dangling subdomains may be exposed | WP4 | verified | <https://learn.microsoft.com/azure/security/fundamentals/subdomain-takeover> | Nov 11, 2026 |
| 12 | Assignment required: on means users and apps must be assigned to get tokens; off means all users can sign in and apps can get tokens, including invited external users | WP5 | verified | <https://learn.microsoft.com/entra/identity/enterprise-apps/application-properties> | Nov 11, 2026 |
| 13 | Client-app-to-resource assignment is API-only; `-AppRoleAssignmentRequired:$true`; user consent not allowed when assignment required | WP5 | verified | <https://learn.microsoft.com/entra/identity-platform/howto-restrict-your-app-to-a-set-of-users> | Nov 11, 2026 |
| 14 | Default access app role ID is all zeros | WP5 | verified against Microsoft Graph appRoleAssignment documentation as already used in the workbook; marked `identifiers-ok` | Graph documentation | Nov 11, 2026 |
| 15 | Control names AC-2, AC-6, IA-5, IA-5(7), CM-8, SC-7, SI-4, CA-7 | Requirements | verified | NIST OSCAL catalog 5.2.0 | Nov 11, 2026 |
| 16 | Sign-in log (Graph beta) national-cloud availability | Availability table | unverifiable on the resource page: *not yet specified* | — | Nov 11, 2026 |

## Not tested

The commands are written from Learn's documented cmdlets and haven't been run against a tenant. WP4's regression test proves registration of a redirect URI only; a real sign-in by the owner completes it.
