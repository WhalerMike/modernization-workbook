# Application retirement: the decommission plan

> **Status: illustrative.** Tested on a fictional application (`tests/`), not run against a live tenant. Read only: it prints the removal commands for the owning teams and runs none of them.

The kit behind [Book 18, Appendix B](../../docs/books/b18-application-modernization/appendix-b-shutting-down-a-retired-application.md): it checks a retired or replaced application's footprint against the six shutdown gates and writes the decommission plan that the change board and the owning teams work from.

| Gate | Passes when | Checks |
|---|---|---|
| R1 Decide | The disposition, owner and decision record are recorded, and for a replace, the replacement | ART-01 |
| R2 Quiet | From the quiet date, no dependent system calls the application and no one signs in to it | ART-03, ART-04 |
| R3 Records | The records officer has signed off and confirmed the disposition | ART-02 |
| R4 Switch off | From the switch-off date, sign-in is disabled (reversible) | ART-05 |
| R5 Remove | After the reversible window, every item is removed: DNS records, certificates, accounts, firewall rules, monitoring sources, licenses | ART-06 (warning: removed too early), ART-07 |
| R6 Close | Every other gate met: the authorization closure and the CMDB item retired | — |

## Lab 1: the fixture

From the `app-retirement` folder, in PowerShell 7.1 or later:

```powershell
./Invoke-ArtPlan.ps1 -FootprintPath tests/fixtures/footprint.json -OutputPath out/retire -AsOf 2026-12-10
```

Seven findings and one warning: a payments system still called the application after the quiet date (ART-03), and six items are past their removal date (ART-07); a firewall rule was removed during the reversible window (ART-06). Read the plan:

```powershell
Get-Content out/retire/plan.md
```

The same application before its switch-off date, with nothing overdue yet:

```powershell
./Invoke-ArtPlan.ps1 -FootprintPath tests/fixtures/footprint.json -OutputPath out/retire-early -AsOf 2026-10-30
```

The tests:

```powershell
Invoke-Pester -Path tests
```

## Lab 2: your test tenant

1. Copy `tests/fixtures/footprint.json` to a working folder and fill it in for a **test** application from your exports: the CMDB item, DNS records, certificates, AD accounts, Entra app registrations, firewall rules, monitoring sources, licenses and the systems that call it.
2. Sign in read only and write the plan with the live sign-in state:

   ```powershell
   Connect-MgGraph -Scopes Application.Read.All, AuditLog.Read.All -NoWelcome
   ./Invoke-ArtPlan.ps1 -FootprintPath .\test-app-footprint.json -OutputPath .\retire-plan -ReadEntra
   ```

3. Run the plan's commands only in your test tenant, each in its own change at its gate. Back it out: set the service principal's sign-in back to enabled (`Update-MgServicePrincipal -ServicePrincipalId <id> -AccountEnabled:$true`), and restore a deleted app registration from the deleted items within 30 days.

## What it reads

[`config/calls.json`](config/calls.json): with `-ReadEntra`, each service principal's `accountEnabled` (`Application.Read.All`) and its last sign-in from `servicePrincipalSignInActivities` (beta, `AuditLog.Read.All`). Everything else comes from the footprint file. A test fails if the module sends a write to Microsoft Graph or runs a removal cmdlet itself.

## The plan

`plan.md` (the gates, the findings and the commands), `plan.json`, `findings.json`, and `manifest.json` with each file's SHA-256, the footprint's SHA-256, the controls (CM-8, AC-2, AC-2(3), CA-3, SR-12, SI-12, CM-3) and the KSIs (KSI-PIY-GIV, KSI-IAM-AAM, KSI-CMT-LMC). The KSIs pair as Book 18, Appendix B pairs them, from Book 13, Appendix A's mapping: KSI-PIY-GIV with CM-8, KSI-IAM-AAM with AC-2(3) (disabling accounts no longer needed; AC-2 itself carries no KSI), and KSI-CMT-LMC with CM-3 (each removal is its own change). The evidence supports those controls; the assessor decides them. KSIs are FedRAMP's provider indicators, which the agency lines its own evidence up with.
