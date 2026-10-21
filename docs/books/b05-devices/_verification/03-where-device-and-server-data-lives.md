# Verification — Chapter 03, Where Device and Server Data Lives

Source: `docs/architecture/where-data-lives-devices-azure.md` (all sections). The chapter also adds material the assignment asked for (what each Microsoft record is authoritative for, correlation keys, a read-only script), sourced from Microsoft Learn. All sources accessed Oct 20, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Three ways to get a device identity; hybrid join is an interim step on the road to Entra join | Entra ID device object | verified | learn.microsoft.com/entra/identity/devices/overview |
| 2 | `deviceId` set by Device Registration Service; `trustType` values Workplace / AzureAd / ServerAd | Entra ID device object | verified | Graph device resource v1.0 |
| 3 | `isCompliant` / `isManaged` writable only by Intune or approved MDM (Windows) | Entra ID device object | verified | Graph device resource v1.0 |
| 4 | Device `extensionAttributes` 1–15 are cloud-mastered | Entra ID device object | verified | Graph device resource v1.0 |
| 5 | BitLocker keys stored on device object; deletion unrecoverable; retire in Intune, disable, grace period, then delete; don't delete Autopilot (system-managed) objects | Entra ID device object | verified | manage-stale-devices |
| 6 | Intune record carries `azureADDeviceId`, `serialNumber`, `complianceState`, `managedDeviceOwnerType`, `deviceEnrollmentType` | Intune record; correlation table | verified | Graph managedDevice resource v1.0 |
| 7 | "Mark devices with no compliance policy assigned as" defaults to Compliant; Microsoft recommends Not compliant with CA; validity period default 30 days | Intune record | verified | Intune compliance overview |
| 8 | Hardware hash contents; registration ideally by OEM/reseller; registration auto-creates an Entra object; registered ≠ enrolled until licensed user signs in | Autopilot registration | verified | Autopilot registration overview |
| 9 | Autopilot identity properties incl. groupTag, purchaseOrderIdentifier; `azureActiveDirectoryDeviceId` "to be deprecated" | Autopilot registration; correlation table | verified | Graph PowerShell New-MgDeviceManagementWindowsAutopilotDeviceIdentity |
| 10 | Group tag maps to `[OrderID]` physical ID usable in dynamic rules | Autopilot registration | verified | groups-dynamic-membership (rules for devices) |
| 11 | Device preparation doesn't require registration | Autopilot registration | verified | device-preparation/compare |
| 12 | Arc server = `Microsoft.HybridCompute/machines` resource with Azure resource ID in a resource group | Arc machine resource | verified | Arc servers overview |
| 13 | Instance metadata list (FQDN, AD domain, BIOS UUID, serial, SMBIOS asset tag, ESU eligibility…) and data received from Azure | Arc machine resource; correlation table | verified | Connected Machine agent overview |
| 14 | Azure is the source of truth for the agent | Arc machine resource | verified | Arc security overview |
| 15 | Each Arc server associated with an Entra object counting against directory quota | Arc machine resource | verified | plan-at-scale-deployment |
| 16 | Heartbeat 5 min; Disconnected in 15–30 min; Expired after 45 days | Arc machine resource | verified | Arc servers overview |
| 17 | MDE machine has `aadDeviceId` only when Entra joined; risk score, exposure, machine tags | Defender machine; correlation table | verified | MDE API machine resource |
| 18 | Intune compliance can require device at/under machine risk score (Clear/Low/Medium/High) | Defender machine | verified | Intune Windows compliance settings |
| 19 | Source listed Arc as derived pointer of Intune "management authority" | Authority table | corrected (Arc is the management authority for servers; Intune doesn't support Windows Server) | Intune supported platforms |
| 20 | Defender security settings management reaches non-enrolled servers and joins a device not registered in Entra | Authority table; correlation rules | verified | MDE security settings management |
| 21 | Duplicate / Pending device objects after reimage or broken hybrid join | Correlation rules | verified | manage-stale-devices |
| 22 | Linux broker 2.0.2+ re-registers/re-enrolls with new Intune and Entra device IDs | Correlation rules | verified | platform-guide-linux step 4 |
| 23 | Arc detected properties include serial number (`DetectedProperty.serialNumber` in output) | Correlation table | verified | Update-AzConnectedMachine example output (Az.ConnectedMachine) — not footnoted separately; covered by agent overview metadata list |
| 24 | Graph PowerShell cmdlets used in the script (Get-MgDevice, Get-MgDeviceManagementManagedDevice, Get-MgDeviceManagementWindowsAutopilotDeviceIdentity) and Get-AzConnectedMachine with Status, LastStatusChange, DomainName, Tags | Script | verified (cmdlet existence and property names from Learn reference/examples) | Graph PowerShell reference; Az.ConnectedMachine reference |
| 25 | "No empty governance attribute"; derived values explainable from origin | The rule | restated-as-design | program design (source "Rule") |
| 26 | Correlation rules (join on deviceId, serial to procurement, Arc on resource ID) | How the records correlate | restated-as-design | program design |
| 27 | CMDB authoritative for business facts, consumer for technical ones | Procurement and CMDB | restated-as-design | program design |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Title line ("Data location taxonomy…") | Ch03 opening prose | |
| Purpose (extend identity data-location model; origin / derived pointers / not-a-source) | Ch03 opening prose; "Which system owns which fact" | |
| Devices table (ownership, compliance, location, management authority) | Ch03 device authority table, expanded with organizational assignment, identity, threat state and a "not a source of truth" column | Management-authority row corrected (Arc ≠ derived pointer of Intune) |
| Azure resources table | Ch03 Azure resources table | Carried unchanged |
| Rule (no empty governance attribute; derived values explainable) | Ch03 "The rule" | Unpositioned marker linked to Ch04 |
| Footer ("Cleaned extraction for project use") | — | Production note, not content |
| (new) Authority map figure | `ch03-authority-map` | |
| (new) Correlation keys figure and table | `ch03-correlation-keys` | |
| (new) Read-only correlation script | Ch03 "A read-only correlation pass" | |

## Revision 2026-10-21 — review fixes

Applied from the verified review of Books 02–05. Sources were opened again on Oct 21, 2026.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| R1 | Source-correction narration trimmed | Arc as management authority | restated | unchanged footnotes |

### Revision history moved out of the chapter body

The body now states the guidance directly. These were the earlier positions it used to narrate:

- The source page listed Azure Arc as a derived pointer of Intune enrollment.
