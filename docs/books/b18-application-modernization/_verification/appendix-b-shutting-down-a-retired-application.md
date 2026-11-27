# Verification — Appendix B, Shutting Down a Retired or Replaced Application

Written November 27, 2026, for the lifecycle gap "Application modernization × Retire": Chapter 02 calls for "a decommissioning checklist" for a retired application, and none existed. Microsoft Learn pages read November 27, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Replace is a form of retire; retire needs a decommissioning checklist | In this appendix | verified | Chapter 02 |
| 2 | Setting the service principal's accountEnabled to false deactivates the enterprise application; Update-MgServicePrincipal -AccountEnabled:$false; Application.ReadWrite.All | The commands, R4 | verified (command copied) | Learn "Disable user sign-in for an application" |
| 3 | A deleted application can be restored within 30 days; Remove-MgApplication | The commands, R5 | verified (quoted; command copied) | Learn "Delete application"; "Restore an enterprise application" |
| 4 | Remove-DnsServerResourceRecord with -ZoneName, -RRType, -Name and -RecordData removes only that record | The commands, R5 | verified (example adapted with -ComputerName) | Learn "Remove-DnsServerResourceRecord" |
| 5 | Disable-ADAccount -Identity disables a user, computer or service account | The commands, R4 | verified (example copied) | Learn "Disable-ADAccount" |
| 6 | Records migrated, transferred or destroyed under an approved schedule | Requirement table | verified | Chapter 06 (A-130 and records law) |
| 7 | The six gates, their order, signers, the 30-day reversible window, the footprint table, the KSI alignment | Gates; footprint; evidence | restated-as-design | — |
