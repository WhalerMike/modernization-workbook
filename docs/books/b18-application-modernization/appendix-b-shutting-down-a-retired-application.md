---
title: "Appendix B — Shutting Down a Retired or Replaced Application"
description: "The decommissioning checklist Chapter 02 calls for when an application is retired or replaced: six gates (decide, quiet, records, switch off, remove, close), what each needs and who signs it, the order that keeps a retirement reversible until the last safe moment, the footprint to remove (DNS records, certificates, service accounts and SPNs, Entra app registrations, firewall rules, monitoring, licenses and the CMDB item), the commands from Microsoft Learn, and the app-retirement kit that checks the gates and writes the plan."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b18-application-modernization
book: B18
part: Appendix
series-order: 91
status: draft
review-status: pending
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
---

# Appendix B — Shutting Down a Retired or Replaced Application

*Switching an application off is one step out of six. The others decide whether it was safe to switch off, and whether anything it left behind is still running.*

## In this appendix

The decommissioning checklist [Chapter 02](02-triaging-the-portfolio.md#the-six-dispositions) calls for: six gates in order, what each needs and who signs it; the footprint an application leaves in other systems; the commands for removing it, from Microsoft Learn; and the [app-retirement kit](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/app-retirement), which checks the gates and writes the plan. It applies to a **retire** and to a **replace**, which Chapter 02 treats as a form of retire.

## The six gates

The order keeps the retirement reversible as long as it can be: nothing is deleted until the application has been quiet, its records are dealt with, and it has stayed switched off for a window in which someone can still object.

| Gate | Passes when | Signs | Evidence |
|---|---|---|---|
| **R1 Decide** | The disposition is recorded (Chapter 02's rubric), with the owner's agreement and the decision record; for a replace, the replacement is live | Application owner; architecture board ([Chapter 07](07-who-governs-the-architecture.md#four-gates)) | The decision record |
| **R2 Quiet** | From the quiet date, no dependent system calls the application and no one signs in to it; users and dependent owners have been told | Application owner | The dependency map's edges ([Chapter 02](02-triaging-the-portfolio.md#recording-dependencies-as-an-evidence-map)) and the sign-in log |
| **R3 Records** | The records officer has signed off: each record class migrated, transferred or scheduled for destruction ([Chapter 06](06-compliance-by-design.md#records-from-design-to-decommissioning)) | Records officer | The disposition and its authority |
| **R4 Switch off** | Sign-in is disabled and the service stopped, reversibly, for the reversible window (the program's design: 30 days) | Application owner, through a change | The change record |
| **R5 Remove** | After the window, every item in the footprint is removed by its owning team | Each owning team | The removal records |
| **R6 Close** | The authorization is closed and the CMDB item retired ([Book 14](../b14-compliance/index.md), closing a retired system's authorization) | Authorizing official; asset manager | The closing decision and the plan's manifest |

## The footprint

An application leaves things in systems it doesn't own. Each is an item to remove at R5, by the team that owns it:

| Item | Where it is | Removed by | How |
|---|---|---|---|
| Entra app registration and service principal | Microsoft Entra ID | Identity team | Disable sign-in at R4; delete at R5 (restorable for 30 days) |
| DNS records | The DNS servers | DNS team | `Remove-DnsServerResourceRecord` |
| Certificates | The certificate authority and the certificate lifecycle tool | PKI team | Revoke, and stop the renewal ([Book 07](../b07-pki/index.md)) |
| Service accounts, gMSAs and their SPNs | Active Directory | Identity team | Disable at R4, delete at R5 ([Non-Person Identity](../guides/non-person-identity-implementation.md)) |
| Firewall rules and other exchanges | The firewall and the interconnection agreements | Network team | Remove the rules; end the agreements (CA-3; [Book 14](../b14-compliance/index.md) closes them with the authorization) |
| Monitoring sources | The SIEM and the monitoring tools | Security operations | Remove the source so nothing alerts on its absence |
| Licenses | The license portal | Asset manager | Release or reassign |
| The CMDB item | The CMDB | Asset manager | Retire it ([Book 15, Chapter 07](../b15-day2-operations/07-the-cmdb-and-asset-identity.md)) |

The app-retirement kit takes the footprint as one JSON file assembled from those systems' exports, so the plan lists every item and flags the ones left past the removal date.

## The commands

Each runs in its own change at its gate, from Microsoft Learn's syntax.

**R4, switch off sign-in** (reversible: set it back to `$true`). Setting the service principal's `accountEnabled` to false makes the enterprise application's activation status *Deactivated*.[^aB-disable]

```powershell
Connect-MgGraph -Scopes "Application.ReadWrite.All"
$servicePrincipal = Get-MgServicePrincipal -Filter "appId eq '<application id>'"
Update-MgServicePrincipal -ServicePrincipalId $servicePrincipal.Id -AccountEnabled:$false
```

**R5, delete the app registration.** A deleted application moves to a temporary container and "can be restored within 30 days."[^aB-delete] [^aB-restore]

```powershell
Remove-MgApplication -ApplicationId (Get-MgApplication -Filter "appId eq '<application id>'").Id
```

**R5, remove a DNS record**, naming its data so only that record goes:[^aB-dns]

```powershell
Remove-DnsServerResourceRecord -ComputerName <DNS server> -ZoneName "<zone>" -RRType "A" -Name "<host>" -RecordData "<address>"
```

**R4, disable a service account**, before it's deleted at R5:[^aB-disable-ad]

```powershell
Disable-ADAccount -Identity '<account>'
```

## The kit

From the `app-retirement` folder, the decommission plan for the fictional application in its fixtures:

```powershell
./Invoke-ArtPlan.ps1 -FootprintPath tests/fixtures/footprint.json -OutputPath out/retire -AsOf 2026-12-10
```

It checks the gates (ART-01 to ART-07, set out in the kit's README) and writes `plan.md` with each gate's state, the findings and the commands for the footprint, and a manifest with each file's SHA-256. Run it at each gate; file the last plan's manifest with the authorization closure at R6. [*Building Application Modernization*, Chapter 08](../../project-plans/developer-workbooks/application-modernization/08-shutting-down-a-retired-application.md) runs it step by step, on the fixture and in a test tenant, with the [learning path's Module 8](../../training/application-modernization/08-shutting-down-a-retired-application.md).

## What the gates support, and the evidence

| Gate | Supports | FedRAMP 20x KSI the evidence lines up with |
|---|---|---|
| R2 Quiet, R5 exchanges | CA-3 (agreements reviewed and ended) | — |
| R3 Records | SI-12 (information management and retention), with the records schedule | — |
| R4, R5 accounts and registrations | AC-2 | — |
| R4 switch-off, R5 accounts disabled | AC-2(3) (disable accounts no longer needed) | KSI-IAM-AAM |
| R5 components and certificates | SR-12 | — |
| R5, R6 the CMDB item | CM-8 | KSI-PIY-GIV |
| Each change | CM-3 | KSI-CMT-LMC |

KSI-IAM-AAM is paired with AC-2(3), not AC-2: [Book 13, Appendix A](../b13-governance/appendix-a-requirements-mapping.md) records that the indicator lists AC-2(2), AC-2(3) and AC-2(13) among its related controls, not AC-2 itself. The evidence supports those controls; the assessor decides them.

## What is requirement and what is design

| Statement | Kind |
|---|---|
| Records are migrated, transferred or destroyed under an approved schedule | Requirement (federal records law; [Chapter 06](06-compliance-by-design.md#records-from-design-to-decommissioning)) |
| Disabling sign-in, deleting a registration and its 30-day restore; the commands | Microsoft Learn |
| The six gates, their order, the 30-day reversible window and who signs | Design |
| The KSI alignment | Design |

::: {.callout-tip}
## Continue the book
[← Previous: Appendix A — Identity Remediation Work Packages](appendix-a-identity-remediation-work-packages.md) · [Book index](index.md) · [Chapter 02 — Triaging the Portfolio](02-triaging-the-portfolio.md)
:::

[^aB-disable]: Microsoft Learn, "Disable user sign-in for an application," <https://learn.microsoft.com/entra/identity/enterprise-apps/disable-user-sign-in-portal> (accessed Nov 27, 2026).
[^aB-delete]: Microsoft Learn, "Delete application," Microsoft Graph v1.0, <https://learn.microsoft.com/graph/api/application-delete?view=graph-rest-1.0> (accessed Nov 27, 2026).
[^aB-restore]: Microsoft Learn, "Restore an enterprise application," <https://learn.microsoft.com/entra/identity/enterprise-apps/restore-application> (accessed Nov 27, 2026).
[^aB-dns]: Microsoft Learn, "Remove-DnsServerResourceRecord," <https://learn.microsoft.com/powershell/module/dnsserver/remove-dnsserverresourcerecord> (accessed Nov 27, 2026).
[^aB-disable-ad]: Microsoft Learn, "Disable-ADAccount," <https://learn.microsoft.com/powershell/module/activedirectory/disable-adaccount> (accessed Nov 27, 2026).
