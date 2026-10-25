# Microsoft automation reference: Graph client and Entra ID checks

> **Status: illustrative. Unit-tested against fixtures, not proven against live tenants.**
> This is the example code for two research pages: [Module 1: Graph and Azure Automation Foundations](../../docs/research/ms-automation-foundations.md) and [Module 2: Microsoft Entra ID through Microsoft Graph](../../docs/research/ms-automation-entra.md). Every API, permission and limit it relies on was checked against Microsoft Learn on October 25, 2026; the pages give the sources. It isn't an endorsement by any agency, and no agency has adopted it.

## What it does

Equivalent Python and PowerShell implementations of five **read-only** Entra ID checks, each tied to the ScubaGear policy it evidences:

| Task | Graph calls | Least-privileged application permissions | Finding |
|---|---|---|---|
| `stale-users` | `GET /users?$select=...,signInActivity&$top=500` | `User.Read.All`, `AuditLog.Read.All` (and Entra ID P1 or P2 for `signInActivity`) | Enabled members with no interactive or non-interactive sign-in in N days (default 90) |
| `ca-export` | `GET /identity/conditionalAccess/policies`, `.../namedLocations` | `Policy.Read.All` | One sorted JSON file per policy, for diffing, plus a summary of state and grant controls |
| `pim-report` | `GET /roleManagement/directory/roleDefinitions`, `roleEligibilitySchedules`, `roleAssignmentSchedules` | `RoleManagement.Read.Directory`, `RoleEligibilitySchedule.Read.Directory`, `RoleAssignmentSchedule.Read.Directory` | MS.AAD.7.1v1 (2 to 8 Global Administrators) and MS.AAD.7.4v1 (no permanent active assignment to a privileged role) |
| `app-credentials` | `GET /applications?$select=...,passwordCredentials,keyCredentials` | `Application.Read.All` | Every secret and certificate, flagged against MS.AAD.5.5v1, 5.6v1 and 5.7v1, plus expired and expiring |
| `mfa-registration` | `GET /reports/authenticationMethods/userRegistrationDetails` | `AuditLog.Read.All` | Members without MFA, without a phishing-resistant method, and administrators without one (toward MS.AAD.3.1v1) |

The Python version also has a small Graph client, `python/graphkit.py`, standard library only, that:

- picks the endpoints for the cloud: `gcc` and `global` use `graph.microsoft.com`, `gcchigh` uses `graph.microsoft.us`, and `dod` uses `dod-graph.microsoft.us`;
- refuses to send its token to any other host, including an `@odata.nextLink` that points elsewhere;
- follows `@odata.nextLink`;
- retries 429, 503 and 504 after `Retry-After`;
- batches at most 20 requests per `$batch`, retrying throttled items;
- tracks `@odata.deltaLink`;
- sends `x-ms-throttle-priority: Low`, because these are background jobs.

The PowerShell module, `powershell/FmwGraph.psm1`, uses `Connect-MgGraph -Environment` and `Invoke-MgGraphRequest` from Microsoft Graph PowerShell for the same thing.

## Run it

Requires Python 3.10 or later, or PowerShell 7.5 or later.

```text
# Evaluate saved Graph responses (no tenant needed):
python python/entra_tasks.py --from-json tests/fixtures/apps.json --as-of 2026-10-25T00:00:00Z app-credentials

# Against a tenant, as an app with a certificate (pip install azure-identity):
python python/entra_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem stale-users --days 90
```

```powershell
Import-Module ./powershell/FmwGraph.psm1
Connect-FmwGraph -Cloud gcchigh -TenantId <tenant-id> -ClientId <app-id> -CertificateThumbprint <thumbprint>
Invoke-FmwEntraTask -Task pim-report -PrivilegedRoleIds 62e90394-69f5-4237-9190-012177145e10, e8611ab8-c189-46e8-94e1-60213ab1f814
```

**Sign-in.** Both versions sign in as an application, with a certificate or a managed identity. Neither accepts a client secret. Grant only the permissions in the table for the tasks you run; an administrator must consent to application permissions. `pim-report` checks Global Administrator by default; pass the template IDs of the other roles you treat as highly privileged.

## Test it

```text
python -m pytest -q -p no:cacheprovider tests/python
pwsh -NoProfile -Command "Invoke-Pester -Path tests/powershell"
```

The fixtures describe a fictional tenant at `contoso.example`. `tests/fixtures/expected.json` holds the Python results, and the PowerShell tests compare their own results with it, so the two versions must agree. The client is tested with a fake transport that covers:

- paging;
- the host check;
- Retry-After waits, and giving up after the retry limit;
- error codes;
- chunks of 20 in `$batch`, with throttled items retried;
- delta links;
- the advanced-query header.

Nothing calls the network. The tests prove the code does what this README says against the fixtures. They don't prove that your tenant returns the same shapes.

## Known limits

- **Read-only.** Nothing here writes to a tenant. Changing Conditional Access or PIM needs higher permissions, and belongs in a reviewed pipeline, as Book 04 Chapter 10 describes.
- **Phishing-resistant method names.** Microsoft documents `methodsRegistered` only by example (`mobilePhone`, `email`, `passKeyDeviceBound`). The other names in the list (`windowsHelloForBusiness`, `fido2SecurityKey` and the passkey variants) are Graph's names for those methods in other APIs. Confirm them against your own report before relying on the count.
- **Global Administrator count.** It counts each principal holding the role, eligible or active, once. A group assigned to the role counts as one principal; expand groups if your rule counts people.
- **Sort order.** Both versions sort the same fields, but PowerShell's string comparison is culture-aware and Python's is ordinal. Names that differ only in case or accents may sort differently.
- **Throttling in PowerShell.** `Invoke-MgGraphRequest` relies on the Graph PowerShell SDK's own retry handling. The PowerShell module doesn't add its own retry loop.

```
examples/ms-automation/
  README.md
  python/graphkit.py              Graph client: clouds, paging, retry, batch, delta
  python/entra_tasks.py           the five checks and a command line
  powershell/FmwGraph.psm1        the same checks for Microsoft Graph PowerShell
  tests/fixtures/                 fictional tenant data and expected.json
  tests/python/                   pytest
  tests/powershell/               Pester 5
```
