# Verification — Appendix H, Recovering Active Directory During the Hybrid Period

Written November 9, 2026, for the Learn coverage gaps (Windows Server identity gap 1: AD forest recovery). Every page of Microsoft's *Active Directory Forest Recovery Guide* (29 pages under `windows-server/identity/ad-ds/manage/forest-recovery-guide/`), the AD DS metadata cleanup page and three Microsoft Entra pages were read November 9, 2026 with the Microsoft Learn fetch tool. Commands are copied from the rendered pages; where the fetched text carried Markdown escapes (`\<...\>`, doubled backslashes) the rendered form is used.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Guide applies to DCs on Windows Server 2022, 2019, 2016, 2012 R2, 2012; steps are a template to customize | Opening | verified (Server 2025 not listed on the hub page) | Learn "Active Directory Forest Recovery Guide" |
| 2 | Plan tested in a lab with production backups | Opening | verified | Learn "Prerequisites" |
| 3 | Guide doesn't cover security recommendations for a compromised forest | Callout | verified | Learn "Identify the problem" |
| 4 | Resets: administrators, krbtgt, trusts; KDS root key and gMSA recreation when the database was exposed | Callout; step 14 | verified | Learn "Perform initial recovery"; "Determine how to recover" |
| 5 | Forest recovery usually last option; worked out with Microsoft Support | When to use | verified | Learn "Prerequisites" |
| 6 | Example forest-wide failures; exposed DC backup may need only password resets | When to use | verified | Learn "Identify the problem" |
| 7 | Everything after the backup is lost | When to use | verified | Learn "Determine how to recover" |
| 8 | Objects synchronized after the backup exist in Entra ID and not in the restored forest | When to use | restated-as-design (consequence of 7 for a hybrid estate) | — |
| 9 | Topology map; practise at least yearly and when Enterprise/Domain Admins membership changes | Before an incident | verified | Learn "Devise a plan" |
| 10 | Domain Admin and DSRM passwords; keep history for the backup lifetime (tombstone or deleted object lifetime) | Before an incident | verified | Learn "Determine how to recover" |
| 11 | Back up at least two writable DCs per domain; RODC backup can't restore a writable DC; no system state restore to a different server or new install | Before an incident | verified | Learn "Determine how to recover" |
| 12 | BitLocker recovery keys; Network Unlock caveat | Before an incident | verified | Learn "Prerequisites"; "Determine how to recover" |
| 13 | Windows Server Backup not installed by default; wbadmin bare metal and full server commands | Before an incident | verified (commands copied) | Learn "Backing up a full server" |
| 14 | wbadmin system state backup command | Before an incident | verified (command copied) | Learn "Backing up the System State data" |
| 15 | Full backup supports BMR and system state; VM snapshots not recommended; mark SYSVOL authoritative if used | Before an incident | verified | Learn "FAQ" |
| 16 | Five-step high-level order; root domain first, parent before child | The sequence | verified | Learn "Steps to restore the forest"; "Perform initial recovery" |
| 17 | DC selection, backup a few days before, ntdsutil snapshot and Dsamain.exe, preferred DC traits, isolation, RODCs rebuilt | Determine how to recover | verified | Learn "Determine how to recover" |
| 18 | IgnoreGCFailures key, value, type and data | Determine how to recover | verified (copied) | Learn "Determine how to recover" |
| 19 | Pause Entra Connect before reconnecting | Pause synchronization | restated-as-design (the guide doesn't cover Connect) | — |
| 20 | Scheduler cycle every 30 minutes; `Import-Module ADSync`, `Set-ADSyncScheduler -SyncCycleEnabled $False` and `$True` | Pause/resume | verified (commands copied from the filtering page) | Learn "Microsoft Entra Connect Sync: Scheduler"; "Configure filtering" |
| 21 | Connect deletes only objects it once considered in scope; users restored from the recycle bin on resync, other types can't be undeleted; export deletion threshold 500 by default | Pause synchronization | verified; "objects missing from the restored forest look like objects that left scope" is the writer's inference, marked in the text as how they "look to Connect" | Learn "Configure filtering" |
| 22 | Cloud sync equivalent is to pause its configuration | Pause synchronization | restated-as-design (not sourced; cloud sync pages not read for this) | — |
| 23 | Initial recovery steps 1 to 15 in the guide's order | Initial recovery | verified (order and content) | Learn "Perform initial recovery" |
| 24 | `wbadmin start systemstaterecovery <otheroptions> -authsysvol` and the dated example; backup must include system state; BMR contains it | Step 2 | verified (copied) | Learn "Perform a nonauthoritative restore of AD DS" |
| 25 | Full server recovery path; msDFSR-Options = 1 on SYSVOL Subscription; Restart-Service DFSR; Get-WinEvent 4602 | Step 2 | verified (copied) | Learn "Perform a full server recovery"; "Perform an authoritative synchronization of DFSR-replicated SYSVOL" |
| 26 | Learn's warning says authoritative SYSVOL only on "the first DC to be restored in the forest root domain"; its step list asks for it on the first DC in each domain | Step 2 | verified; Learn inconsistency reported in the text rather than resolved | Learn "Perform initial recovery" |
| 27 | FRS SYSVOL out of scope for the standard; guide refers to BurFlags | Step 2 | verified (BurFlags reference); "out of scope for the standard" is program design | Learn "Perform a nonauthoritative restore" |
| 28 | Perform Initial Synchronizations registry value 0, back to 1 | Step 3; cleanup | verified (copied) | Learn "Perform initial recovery" |
| 29 | Intrusion: reset admin accounts and krbtgt before additional DCs; plan user password reset | Step 4 | verified | Learn "Perform initial recovery" |
| 30 | ntdsutil seizure commands, role table, Netdom Query FSMO, RID master warning | Step 5 | verified (copied) | Learn "Seizing an operations master role" |
| 31 | ADUC deletion performs metadata cleanup; check box text; events 16650 and 16648 | Step 6 | verified | Learn "Cleaning metadata of removed writable domain controllers" |
| 32 | ntdsutil metadata cleanup commands; "Access is denied" and accidental deletion protection | Step 6 | verified (copied) | Learn "Clean up Active Directory Domain Controller server metadata" |
| 33 | Preferred DNS settings; delete NS records; `nltest.exe /dsderegdns:server.domain.tld` | Step 7 | verified (copied) | Learn "Perform initial recovery" |
| 34 | AD-integrated zones, secure updates, delegation; `net stop netlogon` / `net start netlogon`; secure updates need a GC | Step 7 | verified | Learn "Configuring the DNS Server service" |
| 35 | rIDAvailablePool on CN=RID Manager$; add 100,000; ADSI Edit or LDP; worked example | Step 8 | verified; the guide gives no PowerShell for this step, so none is given | Learn "Raising the value of available RID pools" |
| 36 | Lowest safe increase; RIDs finite | Step 8 | verified | Learn "Perform initial recovery" |
| 37 | invalidateRidPool PowerShell; event 16654; first creation fails, retry succeeds; system state restore already invalidates | Step 9 | verified (copied) | Learn "Invalidating the current RID pool" |
| 38 | Reset-ComputerMachinePassword twice; only on the sole recovered DC | Step 10 | verified | Learn "Resetting the computer account password of the domain controller" |
| 39 | krbtgt reset twice via ADUC; typed password irrelevant; wait 10 hours (default ticket lifetimes) or longer; history of 2; don't delete RODC krbtgt_number accounts | Step 11 | verified; the guide gives no command-line method | Learn "Resetting the krbtgt password"; "Perform initial recovery" |
| 40 | netdom trust /resetOneSide parent and child commands; same passwordT; run once (resets twice) | Step 12 | verified (copied) | Learn "Resetting a trust password on one side of the trust" |
| 41 | `repadmin.exe /options DC_NAME -IS_GC`; Learn prints an en dash | Step 13 | verified (Learn's en dash noted; hyphen given) | Learn "Removing the global catalog" |
| 42 | Forest root PDC emulator external time source | Step 15 | verified | Learn "Perform initial recovery" |
| 43 | Reconnect on a common isolated network; physical DC address caveat; repadmin /replsum, Repadmin /viewlist *, Nltest /DCList, DCDiag /v | Reconnect and verify | verified (copied) | Learn "Perform initial recovery" |
| 44 | `repadmin.exe /options DC_NAME +IS_GC`; event 1119 or Global Catalog Promotion Complete = 1; not advertised until full sync; new backup of each recovered DC | Reconnect and verify | verified (copied) | Learn "Adding the global catalog"; "Perform initial recovery" |
| 45 | Redeploy: reinstall AD DS, old backups unusable, cloning or IFM, preferred DNS, rebuild RODCs, stagger | Redeploy | verified | Learn "Redeploy remaining DCs" (its cloning and IFM links point to a wrong page on Learn) |
| 46 | Cloning prerequisites | Redeploy | verified | Learn "Virtualization" |
| 47 | Redeploy-or-retire decision at recovery | Redeploy | restated-as-design | Book 00 Ch10 |
| 48 | Events 4602, 4614, 4612 | Verify and clean up | verified | Learn "Verify replication" |
| 49 | Cleanup items (DNS, WINS, FSMO, GC, recreate objects, outgoing trusts) | Verify and clean up | verified | Learn "Cleanup" |
| 50 | Review exports before re-enabling the scheduler | Resume synchronization | verified (import, synchronize, verify, then export; then re-enable) | Learn "Configure filtering" |
| 51 | Entra Backup and Recovery shows synced-object changes but excludes them from recovery | Resume synchronization | verified | Learn "Supported objects and recoverable properties" |
| 52 | Single domain: unhost/rehost or remove lingering objects | Single domain | verified | Learn "Recovering a single domain within a multidomain forest" |
| 53 | CP-2, CP-4, CP-9, CP-10 statements | Evidence table | carried from Chapter 06 (OSCAL 5.2.0, Oct 21, 2026) | Chapter 06 log |
| 54 | IA-5, IR-4 named | Evidence table | carried (control titles only; catalog not re-opened for this appendix) | — |
| 55 | KSI-RPL-ABO, ARP, RRO, TRC; bind providers | Evidence table | carried from Chapter 06 | Chapter 06 log |
| 56 | Evidence rows | Evidence table | restated-as-design | — |
| 57 | Server standard: 2016 gone by Jan 12, 2027, 2019 minimum | Opening | restated-as-design (program assumption) | — |

## Not taken from Learn

The following commands are often quoted for forest recovery but are not in Microsoft's guide, so the appendix doesn't give them: `Set-ADObject` for `rIDAvailablePool`, `Move-ADDirectoryServerOperationMasterRole -Force`, `dnscmd`, a PowerShell setting of `msDFSR-Options`, BurFlags values, the SysvolReady registry path, a command-line krbtgt reset and an `Install-ADDSDomainController` example.

## Open items for review
- Learn's authoritative-SYSVOL wording (claim 26): the agency's plan states which reading it follows.
- The guide doesn't list Windows Server 2025; recheck when the program's standard moves.
- Status `draft` (added after the baseline edition, per CONTRIBUTING.md).
