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

## Revision 2026-10-29 — four tracks and companion-guide alignment

New sections "Three stores that policy reads," "Which end-user devices Intune covers" (coverage table) and "What Intune and Arc don't reach" (tiered strategy, design guidance). Sources opened on Oct 29, 2026 through the Microsoft Learn documentation service; no personal data sent.

| # | Claim | Where | Verdict | Source |
|---|---|---|---|---|
| D1 | Device attributes come from provisioning and the procurement record, not HR | Three stores | restated-as-design (series framing) | Shared framing |
| D2 | Dynamic device rules read device properties (deviceOSType, deviceOwnership, deviceTrustType, enrollmentProfileName, devicePhysicalIds, extensionAttribute1–15); a device rule can't use the device owner's user attributes | Three stores | verified | c03-dynamic-rules, "Manage rules for dynamic membership groups in Microsoft Entra ID," "Rules for devices" and "Considerations for dynamic membership groups," <https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership> (footnote updated with the second section and the re-check date) |
| D3 | Conditional Access device filters can read extensionAttribute1–15 only when the device is Intune managed, compliant or Microsoft Entra hybrid joined | Three stores | verified | c03-ca-device-filter, "Conditional Access: Filter for devices," "Supported operators and device properties for filters" (Warning), <https://learn.microsoft.com/entra/identity/conditional-access/concept-condition-filters-for-devices> |
| D4 | Assignment filters read Intune inventory at check-in, not extension attributes; Arc tags are read by Policy and Update Manager and are plain text | Three stores | carried by link to Ch08 and Ch09 | Ch08 (c08-filters, c08-intune-assign); Ch09 |
| D5 | Intune supported OS: Android, iOS/iPadOS, Linux, macOS, Windows, Chrome OS (no app protection on Chrome OS); Windows 11 editions incl. IoT Enterprise; Windows 10/11 Cloud PCs; Windows 10 LTSC 2019/2021 and Windows 11 LTSC 2024; Windows 10 out of support Oct 14, 2025 and "allowed"; UWF devices not supported; Linux Ubuntu 24.04 and 26.04 LTS, RHEL 9 and 10; Android 10+ user-based, 8+ userless; device administrator support ended on GMS devices in December 2024, Teams Android devices excepted | Coverage table | verified | c03-intune-platforms, "Supported operating systems and browsers in Intune," <https://learn.microsoft.com/intune/fundamentals/ref-supported-platforms> (re-check date added to the footnote) |
| D6 | Windows 365 Cloud PCs are Entra joined or hybrid joined and enrolled in Intune at provisioning, and fully managed by Intune | Coverage table | verified | c03-w365, "What is Windows 365 Enterprise?," <https://learn.microsoft.com/windows-365/enterprise/overview> |
| D7 | AVD multi-session: settings catalog plus only trusted/SCEP/PKCS certificate and device-tunnel VPN templates; Autopilot, Commercial OOBE and ESP not supported; enroll with device credentials (hybrid) or "Enroll the VM with Intune" (Entra join); GCC, GCC High and DoD supported | Coverage table | verified | c03-intune-avd, "Windows Enterprise multi-session remote desktops," <https://learn.microsoft.com/intune/solutions/azure-virtual-desktop-multi-session> |
| D8 | Apple: iOS/iPadOS via ADE, Apple Configurator, BYOD device enrollment or account-driven user enrollment; macOS via BYOD device enrollment, ADE, direct enrollment with Apple Configurator | Coverage table | verified | c03-intune-apple, the iOS/iPadOS and macOS enrollment guides |
| D9 | Android Enterprise modes (BYOD work profile, COPE, COBO, COSU); corporate methods QR code, zero-touch, Knox Mobile Enrollment, NFC, token | Coverage table | verified | c03-intune-android, the Android enrollment guide and corporate-methods page |
| D10 | AOSP supported devices are listed by OEM: mostly AR/VR headsets, plus a phone and a wearable scanner | Coverage table | verified | c03-aosp, "Android Open Source Project Supported Devices" |
| D11 | ChromeOS: the Chrome Enterprise connector syncs inventory and allows deprovision, lost mode, restart and wipe; enrollment in the Google Admin console; compliance "Not evaluated"; one connection per tenant | Coverage table | verified | c03-intune-chromeos, "Configure Chrome Enterprise connector" and "View ChromeOS device information in Intune" |
| D12 | Specialty devices (AR/VR, Surface Hub, Teams Rooms) need Intune Plan 2 or an additional subscription, or Teams Rooms Pro or shared-device licenses; HoloLens needs nothing beyond Plan 1 | Coverage table | verified (the table says "need extra licensing"; the HoloLens nuance is in the guide matrix) | c03-intune-specialty, "Specialty device management," "Licensing considerations" |
| D13 | Shared devices: Windows shared PC (an Intune feature) and kiosk; Entra shared device mode on iOS/iPadOS and Android | Coverage table | verified | c03-intune-flw, the frontline worker overview and Windows pages |
| D14 | Defender for Endpoint discovers endpoints that aren't onboarded, network devices and IoT devices; IoT/OT discovery needs Defender for IoT onboarded | Coverage table; tier 3 | verified | c03-mde-discovery, "Microsoft Defender for Endpoint device discovery overview" |
| D15 | Windows Server isn't an Intune platform | Coverage table | verified (not on the supported list); unchanged from row 19 above | c03-intune-platforms |
| D16 | Printers, network gear, IoT/OT aren't Intune platforms | Coverage table | verified by absence from Microsoft's supported list. A thin client running a supported Windows edition (for example IoT Enterprise) is covered as Windows (guide matrix) | c03-intune-platforms |
| D17 | Four-tier strategy, CMDB as the single source of truth outside Intune and Arc, tie to CM-8 | What Intune and Arc don't reach | restated-as-design. CM-8 carried by link to Ch10's evidence table (no new federal footnote); CDM and BOD 23-01 by link to Book 12 Ch01; network devices to Book 09 Ch09; NAC records to Book 09 Ch07; mainframe to Book 01 Ch04 | Ch10; Books 01, 09, 12 |
| D18 | Link to the guide's `#attributes` | Three stores | open: the anchor didn't exist in the guide when this was written; the guide's owner is adding it | guide |
