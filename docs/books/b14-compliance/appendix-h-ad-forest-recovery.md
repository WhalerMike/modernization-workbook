---
title: "Appendix H — Recovering Active Directory During the Hybrid Period"
description: "A forest recovery runbook for the years Active Directory still runs beside Microsoft Entra ID: when to use it, the backups it depends on, recovery of the first writable domain controller in each domain (restore, SYSVOL, DNS, global catalog, RID pool, operations master roles, metadata cleanup, computer account, krbtgt and trust resets), reconnection, redeployment, cleanup and verification, with the exact commands from Microsoft's Active Directory Forest Recovery Guide, what the hybrid period adds for Microsoft Entra Connect, and the contingency planning controls and FedRAMP indicators it supports."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b14-compliance
book: B14
part: Appendix
series-order: 97
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix H — Recovering Active Directory During the Hybrid Period

*The program is retiring the domain controllers. Until the last one is gone, a forest-wide failure can still stop sign-in to everything that hasn't moved, and the plan has to say how the forest comes back.*

::: {.callout-note}
## In this appendix
When a forest recovery is the right response and when it isn't. The backups it depends on and the decisions to make before an incident. The recovery of the first writable domain controller in each domain, step by step, with the commands Microsoft's Active Directory Forest Recovery Guide gives. Reconnecting the recovered domain controllers, redeploying the rest, cleaning up and verifying replication. What the hybrid period adds, chiefly Microsoft Entra Connect, which would otherwise carry the restored state into the cloud. The controls and indicators the runbook supports, and the evidence it leaves.
:::

[Chapter 06](06-contingency-and-continuity.md) puts the runbooks in the contingency plan's appendices and keeps the plan itself to decisions, roles and order. This appendix is the identity runbook for one event: a failure that leaves every domain controller in a forest unable to function. It follows Microsoft's *Active Directory Forest Recovery Guide*, which states its steps apply to domain controllers running Windows Server 2022, 2019, 2016, 2012 R2 and 2012.[^aH-guide] The program's server standard (Windows Server 2016 gone by January 12, 2027, 2019 the minimum) is inside that range. The guide doesn't yet list Windows Server 2025. Active Directory runs on the agency's own servers, so government-cloud availability doesn't apply to anything in this appendix except the Microsoft Entra Connect steps, and Connect runs on the agency's own server too.

The guide presents its steps as a template to customize, not a script to run unchanged,[^aH-guide] and so does this appendix. Each agency writes its own plan from it, with its own forest map, and tests it in a lab with copies of production backups before it's needed.[^aH-prereq]

::: {.callout-important}
## Not a security playbook
Microsoft's guide says plainly that it doesn't cover the security recommendations for recovering a compromised forest.[^aH-identify] It restores a working forest from a backup taken before the failure and resets the secrets an attacker would hold: administrator passwords, the krbtgt account, trust passwords and, where the database was exposed, the Key Distribution Service root key behind group managed service accounts.[^aH-initial][^aH-determine] Investigation, eradication and the decision that a backup predates the compromise belong to the incident response plan ([Chapter 06](06-contingency-and-continuity.md), Section 4).
:::

## When to use this runbook

A forest recovery is usually the last option. The guide assumes the cause has been worked out with Microsoft Support and that recovery from backup is the best remaining course.[^aH-prereq] Its examples of forest-wide failures include every domain controller's database being corrupted, a rogue administrator or a malicious script changing the directory beyond repair, a malicious schema extension, malware on the domain controllers, and a forest in which no domain controller can replicate, accept writes or be added. It also notes that an exposed backup of a domain controller may only need password resets for users, computers, trusts and managed service accounts, not a recovery.[^aH-identify]

Everything written to the directory after the backup used is lost.[^aH-determine] For a program midway through its migration that loss has a second edge: anything Microsoft Entra Connect synchronized from Active Directory after that backup is in Microsoft Entra ID and not in the restored forest. The hybrid steps below exist for that reason.

## Before an incident

The recovery is only as good as what exists before it starts. The guide asks for these things to be in place.

- **A plan and a forest map.** A detailed topology map, with each domain controller's name, roles, backup status and the trusts, and a plan practised at least once a year and again when the membership of Enterprise Admins or Domain Admins changes.[^aH-plan]
- **The passwords.** A Domain Admin password for each domain, preferably the built-in Administrator account, and the Directory Services Restore Mode password, with their history kept for as long as the backups are valid (the tombstone lifetime, or the deleted object lifetime if the Active Directory Recycle Bin is enabled).[^aH-determine]
- **Backups of at least two writable domain controllers in each domain.** A backup of a read-only domain controller can't restore a writable one. Restoring system state to a different server, or to a new Windows installation, isn't supported; recovery to different hardware is a full server recovery.[^aH-determine]
- **The BitLocker recovery keys** for every domain controller that uses BitLocker, and a check that none relies on BitLocker Network Unlock as its only protector where Windows Deployment Services is deployed.[^aH-prereq][^aH-determine]

Windows Server Backup isn't installed by default; install the feature first.[^aH-fullbackup] The guide recommends a full backup, which supports both bare metal recovery and a system state restore.[^aH-faq] A system state backup:[^aH-ssbackup]

```cmd
wbadmin start systemstatebackup -backuptarget:<targetDrive>:
```

A bare metal recovery backup, and a full server backup:[^aH-fullbackup]

```cmd
wbadmin start backup -allCritical -backuptarget:<Drive_letter_to_store_backup>:
```

```cmd
wbadmin start backup -backuptarget:<Drive_letter_to_store_backup>: -include:<Drive_letter_to_include>:
```

The guide doesn't recommend virtual machine snapshots as the backup. If one is used, SYSVOL has to be marked authoritative by hand after the restore.[^aH-faq]

## The sequence

The guide's high-level order is five steps: identify the problem, determine how to recover, perform the initial recovery in isolation (one writable domain controller in each domain), redeploy the remaining domain controllers, and clean up.[^aH-steps] The initial recovery starts with the forest root domain and always recovers a parent domain before its children.[^aH-initial]

### Determine how to recover

- **Choose one writable domain controller in each domain** with a trusted backup, preferably taken a few days before the failure, which trades recentness for confidence that the backup predates it. If the time of the failure is unknown, the guide points to `ntdsutil snapshot` and Dsamain.exe to find the last safe state.[^aH-determine]
- **Prefer** a domain controller that is a virtual machine on a hypervisor that supports VM-GenerationID (so it can be a cloning source), is a DNS server and a global catalog, and has a good full server backup.[^aH-determine]
- **Isolate.** Preferably shut down every writable domain controller, especially the operations master role holders, before the first recovered domain controller returns to production. Move virtual domain controllers to an isolated virtual network; disconnect physical ones. Read-only domain controllers can keep running and are all rebuilt afterwards.[^aH-determine]
- **If the recovered domain controller isn't a global catalog**, sign in first with the built-in Administrator account (RID 500), or set this registry value so sign-in doesn't need a global catalog for group membership:[^aH-determine]

```text
Key:   HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Lsa
Value: IgnoreGCFailures
Type:  REG_DWORD
Data:  0 – Require GlobalCatalog for logon (default)
       1 – Allow logon without groups from GC
```

### Pause synchronization to Microsoft Entra ID

This step is the hybrid period's addition; the guide doesn't cover it. Before any recovered domain controller is reachable by the Microsoft Entra Connect server, disable the Connect sync scheduler, which otherwise runs a cycle every 30 minutes:[^aH-scheduler]

```powershell
Import-Module ADSync
Set-ADSyncScheduler -SyncCycleEnabled $False
```

With the scheduler stopped, the restored forest's state doesn't reach Microsoft Entra ID until someone has looked at what would change. Objects created in Active Directory after the backup are missing from the restored forest, so to Connect they look like objects that have left its scope, and Connect deletes in Microsoft Entra ID the objects it once considered in scope. Microsoft's filtering guidance warns that users deleted that way come back from the Microsoft Entra recycle bin when they are synchronized again, but other object types can't be undeleted: a deleted security group, and the access it granted, is gone. If an export would delete more objects than the configured threshold, 500 by default, Connect stops the export with an error rather than deleting them.[^aH-filtering] The threshold is a safety net, not the plan. The plan is to keep the scheduler off until cleanup is done and then review the pending exports. Where cloud sync is used instead of Connect, the equivalent is to pause its configuration; the program's hybrid design is in [Book 02](../b02-identity/index.md).

### Initial recovery of the first writable domain controller in each domain

The guide's procedure for each domain's first recovered domain controller, in its order:[^aH-initial]

**1. Isolate the domain controller** from the network.

**2. Restore it.** Either a full server recovery followed by an authoritative synchronization of SYSVOL, or a nonauthoritative restore of Active Directory with an authoritative restore of SYSVOL from a system state backup in one step:[^aH-nonauth]

```cmd
wbadmin start systemstaterecovery <otheroptions> -authsysvol
```

For example:[^aH-nonauth]

```cmd
wbadmin start systemstaterecovery -version:01/01/2023-13:00 -authsysvol
```

The backup must explicitly include system state; a bare metal recovery backup does.[^aH-nonauth] After a full server recovery instead (Repair your computer, Troubleshoot, System Image Recovery from the installation media), mark SYSVOL authoritative by setting `msDFSR-Options` to `1` on the domain controller's SYSVOL Subscription object (Domain Controllers, the domain controller, DFSR-LocalSettings, Domain System Volume, SYSVOL Subscription, in Active Directory Users and Computers with Advanced Features on), then restart the service and look for event 4602:[^aH-fullrecovery][^aH-authsysvol]

```powershell
Restart-Service DFSR -PassThru
```

```powershell
Get-WinEvent -LogName 'DFS Replication' | Where-Object ID -EQ 4602 | Format-Table -AutoSize -Wrap
```

The authoritative SYSVOL restore is for the first recovered domain controller only. The guide's warning words it as "the first DC to be restored in the forest root domain," while its step list asks for it on the first domain controller in each domain;[^aH-initial] the plan should state which the agency follows and test it. An authoritative restore on any further domain controller causes SYSVOL replication conflicts.[^aH-initial] SYSVOL still replicated by FRS is out of scope for the program's standard (it should have been migrated to DFS Replication); the guide refers to the BurFlags procedure for that case.[^aH-nonauth]

**3. Check the restored data** before going further. If it's damaged, restore another backup. If the domain controller holds an operations master role, add this registry value (REG_DWORD, `0`) so it doesn't wait for initial synchronization with partners that won't come back, and set it back to `1` when recovery is complete:[^aH-initial]

```text
HKLM\System\CurrentControlSet\Services\NTDS\Parameters\Repl
Perform Initial Synchronizations
```

**4. If an intrusion is suspected**, reset the passwords of every administrative account (Enterprise Admins, Domain Admins, Schema Admins, Server Operators, Account Operators and the like) and do the full krbtgt reset (step 11) before any additional domain controller is installed. If user accounts were compromised, plan a reset of every user password.[^aH-initial]

**5. Seize the operations master roles.** On the first recovered domain controller in the forest root domain, seize the forest-wide and domain-wide roles; in each child domain, the domain-wide roles:[^aH-seize]

```cmd
ntdsutil
```

```cmd
roles
```

```cmd
connections
```

```cmd
Connect to server ServerFQDN
```

```cmd
quit
```

Then, at the `FSMO maintenance:` prompt, the command for each role:[^aH-seize]

| Role | Credentials | Command |
|---|---|---|
| Domain naming master | Enterprise Admins | `Seize naming master` |
| Schema master | Schema Admins | `Seize schema master` |
| Infrastructure master | Domain Admins | `Seize infrastructure master` |
| PDC emulator master | Domain Admins | `Seize pdc` |
| RID master | Domain Admins | `Seize rid master` |

Confirm with `Netdom Query FSMO`. If the domain controller wasn't the RID master before, seizing the role warns that it can't synchronize with a partner; in isolation that's expected, and the answer is Yes.[^aH-seize]

**6. Clean up the metadata of every other writable domain controller in the domain.** From Active Directory Users and Computers (Windows Server 2012 or later, or the Remote Server Administration Tools), deleting a domain controller's object in the Domain Controllers organizational unit, with "This Domain Controller is permanently offline and can no longer be demoted using the Active Directory Domain Services Installation Wizard (DCPROMO)" selected, performs the metadata cleanup and removes its server and computer objects.[^aH-cleanmeta] From the command line:[^aH-metadata]

```cmd
ntdsutil
```

```cmd
metadata cleanup
```

```cmd
connections
```

```cmd
connect to server <ServerName>
```

```cmd
quit
```

```cmd
remove selected server <ServerName>
```

Until this is done, a domain controller that wasn't the RID master won't take the role; the System log shows event 16650 and then 16648 when it succeeds.[^aH-cleanmeta] "Access is denied" means the object is protected from accidental deletion; clear that setting on the object.[^aH-metadata]

**7. Configure DNS.** Make sure the DNS Server service is installed and running. In the forest root, the domain controller's preferred DNS server is its own address; in a child domain, it's the first DNS server in the forest root. Delete the name server records of the domain controllers removed in step 6 from the `_msdcs` and domain zones, and check that their service records are gone; this speeds the removal:[^aH-initial]

```cmd
nltest.exe /dsderegdns:server.domain.tld
```

Store the zones in Active Directory, allow only secure dynamic updates, make sure each parent zone delegates to its child zones, and re-register the domain controller's records:[^aH-dns]

```cmd
net stop netlogon
```

```cmd
net start netlogon
```

Secure dynamic updates work only when a global catalog is available.[^aH-dns]

**8. Raise the RID pool by 100,000.** Raising the value of `rIDAvailablePool` on `CN=RID Manager$,CN=System,DC=<domain name>` keeps the domain from reissuing security identifiers that objects created after the backup already used. The guide gives two methods, ADSI Edit (add 100,000 to the value) and LDP (Modify, the attribute `rIDAvailablePool`, operation Replace), and works an example: 4611686014132422708 becomes 4611686014132522708.[^aH-raiserid] Raise it by the lowest amount that is safe for the domain's actual consumption, because RIDs are finite.[^aH-initial]

**9. Invalidate the current RID pool.** A system state restore already does this; after any other kind of restore, run:[^aH-invalidrid]

```powershell
$Domain = New-Object System.DirectoryServices.DirectoryEntry
$DomainSid = $Domain.objectSid
$RootDSE = New-Object System.DirectoryServices.DirectoryEntry("LDAP://RootDSE")
$RootDSE.UsePropertyCache = $false
$RootDSE.Put("invalidateRidPool", $DomainSid.Value)
$RootDSE.SetInfo()
```

Event 16654 in the System log confirms it. The first attempt to create a security principal afterwards fails and the retry succeeds.[^aH-invalidrid]

**10. Reset the domain controller's own computer account password, twice:**[^aH-computer]

```powershell
Reset-ComputerMachinePassword
```

Run the same command a second time. The reset breaks replication with any other domain controller, which in a forest recovery is the point; run it only on the sole recovered domain controller.[^aH-computer]

**11. Reset the krbtgt password, twice.** In Active Directory Users and Computers with Advanced Features on, reset the password of the `krbtgt` account in the Users container; the password typed doesn't matter, because the system generates a strong one. Wait ten hours, the default maximum lifetime of user and service tickets, before the second reset, or longer if the domain's ticket lifetimes are higher. The account keeps a password history of two, so the second reset removes the pre-failure password.[^aH-krbtgt][^aH-initial] The reset applies to the writable domain controllers' `krbtgt` account; don't delete the read-only domain controllers' `krbtgt_<number>` accounts if they will be recovered.[^aH-krbtgt]

**12. Reset trust passwords** if the recovery follows a security breach. Reset on the trusting side and use the same password on the trusted side when that domain's first domain controller is recovered. In the parent domain:[^aH-trust]

```cmd
netdom trust parent domain name /domain:child domain name /resetOneSide /passwordT:password /userO:administrator /passwordO:*
```

In the child domain:[^aH-trust]

```cmd
netdom trust child domain name /domain:parent domain name /resetOneSide /passwordT:password /userO:administrator /passwordO:*
```

`passwordT` must be the same on both sides. Run the command once: it resets the password twice by itself.[^aH-trust]

**13. Remove the global catalog** if the forest has more than one domain and the recovered domain controller was a global catalog, so newer partial replicas of other domains don't leave lingering objects:[^aH-removegc]

```cmd
repadmin.exe /options DC_NAME -IS_GC
```

The guide prints this command with an en dash before `IS_GC`; type a hyphen.

**14. Recreate group managed service accounts** if their password generation details may have been exposed, after creating a new Key Distribution Service root key.[^aH-initial][^aH-determine]

**15. Set the time source.** Configure the forest root PDC emulator to synchronize time from an external source.[^aH-initial]

### Reconnect and verify

Connect the recovered domain controllers, one from each domain, to a common network that is still isolated from the rest of the environment. Virtual domain controllers keep their addresses; physical ones may need new addresses, which leaves their DNS records wrong until a global catalog is available. Create DNS delegations, forwarders and root hints as needed, temporary connection objects if recovered domain controllers aren't direct replication partners, and check replication and the domain controller list:[^aH-initial]

```cmd
repadmin /replsum
```

```cmd
Repadmin /viewlist *
```

```cmd
Nltest /DCList:<domain>
```

```cmd
DCDiag /v
```

Then add the global catalog back to a domain controller in the forest root domain:[^aH-addgc]

```cmd
repadmin.exe /options DC_NAME +IS_GC
```

Directory Service event 1119, or the registry value `Global Catalog Promotion Complete` set to `1` under `HKLM\System\CurrentControlSet\Services\NTDS\Parameters`, shows that it's done. A domain controller isn't advertised as a global catalog until it has synchronized every partition.[^aH-initial][^aH-addgc] Take a new backup of each recovered domain controller before going further.[^aH-initial]

### Redeploy the remaining domain controllers

Install Active Directory Domain Services again on every domain controller that existed before the failure, after forcibly removing it from the existing ones or reinstalling the operating system; their old backups can't be reused. Cloning a virtualized domain controller, or Install from Media (`ntdsutil ifm` on a trusted writable domain controller), shortens this. Point each one's preferred DNS server at the first recovered domain controller in the forest root, rebuild every read-only domain controller, and stagger the installations.[^aH-redeploy] Cloning needs a hypervisor that supports VM-GenerationID, the source domain controller in the Cloneable Domain Controllers group, and the PDC emulator available while cloning.[^aH-virt]

For a program that is retiring domain controllers, this is a decision point, not only a step. A domain controller that the retirement plan was going to remove in the next wave doesn't have to come back; the plan records which domain controllers are redeployed and which are retired at recovery, and [Book 00, Chapter 10](../b00-orientation/10-retirement-steady-state-and-success.md) covers retiring one cleanly.

### Verify replication and clean up

After every domain controller is back, check replication with `repadmin /replsum`, and check SYSVOL: DFS Replication event 4602 means SYSVOL initialized, 4614 means it is waiting for initial replication, and 4612 on the first recovered domain controller means a manual authoritative restore is needed.[^aH-verify] Then clean up: return DNS client settings to the original design and delete the DNS and WINS records of domain controllers that weren't recovered; transfer the operations master roles and add global catalogs as the design before the failure had them; recreate the objects and reapply the changes lost since the backup; and restore outgoing trusts with external domains and forests, which aren't restored from backup.[^aH-cleanup] Set `Perform Initial Synchronizations` back to `1`.[^aH-initial]

### Resume synchronization to Microsoft Entra ID

Only after cleanup, and after the objects lost since the backup have been recreated, review what Connect would export: run an import and synchronization, check the pending exports, and only then re-enable the scheduler:[^aH-filtering]

```powershell
Set-ADSyncScheduler -SyncCycleEnabled $True
```

If the review shows that cloud objects would be deleted because they're missing from the restored forest, the fix is to recreate them in Active Directory first. Microsoft Entra Backup and Recovery can't put back synchronized objects; it shows their changes in difference reports but recovers only cloud objects ([Chapter 06](06-contingency-and-continuity.md#identity-recovery-during-the-hybrid-period)).[^aH-entrabackup]

## A single domain in a multidomain forest

When only one domain fails, recover its domain controllers as above, clean up the metadata of the rest and add new ones. The global catalogs in the other domains then hold a newer partial copy of the recovered domain; the guide gives two ways to fix that: unhost and rehost the recovered domain's partition on every global catalog in the other domains (`repadmin /unhost`, then `repadmin /rehost`), or remove lingering objects from them using a domain controller in the recovered domain as the source.[^aH-single]

## What the runbook supports, and the evidence

| Requirement or indicator | What the runbook does for it | Evidence an assessor can check |
|---|---|---|
| NIST SP 800-53 CP-2, CP-2(1) | The identity recovery appendix of the contingency plan, coordinated with the incident response plan | The appendix, approved with the plan; forest map; cross-reference to the incident response plan |
| CP-4, CP-4(1) | The yearly recovery drill the guide asks for, in a lab with copies of production backups | Drill plan, timings per step, after-action report, plan changes |
| CP-9, CP-9(1) | Backups of two writable domain controllers per domain; restore tested in the drill | Backup job reports; restore test record with the backup's age |
| CP-10 | Recovery to a known state: one restored domain controller per domain, secrets reset, metadata cleaned, replication verified | Recovery log with each step's command output, `repadmin /replsum` and `DCDiag /v` results |
| IA-5 | krbtgt, computer account, administrator and trust password resets after a compromise | Change records with times; the 10-hour interval recorded |
| IR-4 | The compromise case handed to incident handling, not solved by restore alone | Incident record linking the recovery |
| FedRAMP KSI-RPL-ABO, KSI-RPL-ARP, KSI-RPL-RRO, KSI-RPL-TRC | Backups and the recovery plan aligned with the identity tier's recovery objectives, and recovery tested | The same records, reviewed on the program's cycle |

The rows support the controls; they don't satisfy them. The agency sets each control's parameters, owns the policy and procedures, and the assessor decides whether each is satisfied.[^aH-sp80053] The FedRAMP indicators bind cloud service providers; for the agency they are the vocabulary [Chapter 06](06-contingency-and-continuity.md#fedramps-recovery-planning-indicators) uses for its own evidence.[^aH-ksi]

**Control states, recovery safety and evidence.** [Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md)'s conventions apply to a recovery runbook as follows. **Authority:** Microsoft guidance for the sequence and commands; Mandated in substance for CP-2, CP-4 and CP-10 where the system's baseline selects them; the hybrid steps are program design (the table below). **Applies:** every forest that still holds domain controllers; Windows Server 2019 or later is the program's assumed minimum for domain controllers after January 12, 2027.

| State | This runbook | Evidence |
|---|---|---|
| Designed | [Before an incident](#before-an-incident): the plan, the forest map and the choice of domain controllers to recover | The approved plan and forest map |
| Configured | The backups and passwords held | Backup job reports; the password and BitLocker key custody record |
| Enforced | Not applicable: recovery restores service; it enforces nothing | — |
| Evidenced | The yearly lab drill with copies of production backups | Drill timings per step, `repadmin /replsum` and `DCDiag /v` output, after-action report |
| Operated | Practice yearly and on changes to Enterprise Admins or Domain Admins membership | The drill calendar and plan revisions |

How-section coverage: the pilot is the lab drill; report-only and enforcement are not applicable; rollback is not available once a forest is restored from backup, which is why [Pause synchronization](#pause-synchronization-to-microsoft-entra-id) comes before any domain controller is reachable and [Resume synchronization](#resume-synchronization-to-microsoft-entra-id) only after the export review; exclusions are the domain controllers retired at recovery instead of redeployed. Recovery safety, in place of rings: the **change window** is an emergency change under the incident commander, with the identity engineer and Microsoft Support on hand; the **backout trigger** is any sign the chosen backup postdates the failure, which sends the team back to [Determine how to recover](#determine-how-to-recover) with an older backup; **post-change validation** is the replication and SYSVOL checks, then the Connect export review. Emergency access to Microsoft Entra ID doesn't depend on the forest: the cloud-only emergency accounts in [Book 04](../b04-access/04-privileged-roles-and-tiers.md#emergency-access-reference-architecture) stay usable throughout. Day-two ownership: the identity platform owner keeps the runbook; the contingency planning coordinator schedules the drill ([Chapter 10](10-who-owns-compliance.md)).

**Evidence checklist**

- [ ] **Configuration:** the forest map, the plan, and the backup job reports for two writable domain controllers per domain
- [ ] **Operational:** the custody record for passwords and BitLocker keys, and the drill calendar
- [ ] **Test:** the yearly drill record with timings, command output and the backup's age
- [ ] **Exception:** domain controllers not backed up or not redeployed, with the decision and approver
- [ ] **Assessor-ready artifact:** the identity recovery appendix of the contingency plan and the drill's after-action report, pointing to the four above

## What is requirement and what is design

| Statement | Status | Basis |
|---|---|---|
| The recovery sequence, commands and registry values | Microsoft guidance | Active Directory Forest Recovery Guide[^aH-guide] |
| Practise the plan at least yearly and when Enterprise Admins or Domain Admins membership changes | Microsoft guidance | Devise a plan[^aH-plan] |
| Pausing Microsoft Entra Connect before reconnecting, and reviewing exports before resuming | Program design, using Microsoft's Connect procedures | [^aH-scheduler][^aH-filtering] |
| Deciding at recovery which domain controllers are redeployed and which retire | Program design | [Book 00, Chapter 10](../b00-orientation/10-retirement-steady-state-and-success.md) |
| The evidence rows | Program design | [Chapter 06](06-contingency-and-continuity.md) |

::: {.callout-tip}
## Continue the book
[← Previous: Appendix G — Prepare-Step Templates](appendix-g-prepare-step-templates.md) · [Book index](index.md) · [Chapter 06 — Contingency Planning and Business Continuity](06-contingency-and-continuity.md)
:::

[^aH-guide]: Microsoft Learn, "Active Directory Forest Recovery Guide" (applies to Windows Server 2022, 2019, 2016, 2012 R2 and 2012; steps are a template), <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-guide> (accessed Nov 9, 2026).
[^aH-prereq]: Microsoft Learn, "AD Forest Recovery - Prerequisites," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-prerequisites> (accessed Nov 9, 2026).
[^aH-identify]: Microsoft Learn, "AD Forest Recovery - Identify the problem," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-identify-the-problem> (accessed Nov 9, 2026).
[^aH-determine]: Microsoft Learn, "AD Forest Recovery - Determine how to recover the forest" (backups, passwords, domain controller selection, IgnoreGCFailures, isolation, KDS root key and gMSA), <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-determine-how-to-recover> (accessed Nov 9, 2026).
[^aH-plan]: Microsoft Learn, "AD Forest Recovery - Devise a plan," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-devise-a-plan> (accessed Nov 9, 2026).
[^aH-steps]: Microsoft Learn, "AD Forest Recovery - Steps to restore the forest," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-steps-for-restoring-the-forest> (accessed Nov 9, 2026).
[^aH-initial]: Microsoft Learn, "AD Forest Recovery - Perform initial recovery" (the step list for the first writable domain controller in each domain; reconnection; adding the global catalog), <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-perform-initial-recovery> (accessed Nov 9, 2026).
[^aH-ssbackup]: Microsoft Learn, "AD Forest Recovery - Backing up the System State data," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-backing-up-system-state> (accessed Nov 9, 2026).
[^aH-fullbackup]: Microsoft Learn, "AD Forest Recovery - Backing up a full server," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-backing-up-a-full-server> (accessed Nov 9, 2026).
[^aH-faq]: Microsoft Learn, "AD Forest Recovery - FAQ," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-faq> (accessed Nov 9, 2026).
[^aH-nonauth]: Microsoft Learn, "AD Forest Recovery - Perform a nonauthoritative restore of AD DS," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-perform-nonauthoritative-restore> (accessed Nov 9, 2026).
[^aH-fullrecovery]: Microsoft Learn, "AD Forest Recovery - Perform a full server recovery," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-perform-full-server-recovery> (accessed Nov 9, 2026).
[^aH-authsysvol]: Microsoft Learn, "AD Forest Recovery - Perform an authoritative synchronization of DFSR-replicated SYSVOL," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-authoritative-recovery-sysvol> (accessed Nov 9, 2026).
[^aH-seize]: Microsoft Learn, "AD Forest Recovery - Seizing an operations master role," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-seizing-operations-master-role> (accessed Nov 9, 2026).
[^aH-cleanmeta]: Microsoft Learn, "AD Forest Recovery - Cleaning metadata of removed writable domain controllers," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-cleaning-metadata-of-removed-dcs> (accessed Nov 9, 2026).
[^aH-metadata]: Microsoft Learn, "Clean up Active Directory Domain Controller server metadata" (command line with ntdsutil), <https://learn.microsoft.com/windows-server/identity/ad-ds/deploy/ad-ds-metadata-cleanup> (accessed Nov 9, 2026).
[^aH-dns]: Microsoft Learn, "AD Forest Recovery - Configuring the DNS Server service," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-configure-dns> (accessed Nov 9, 2026).
[^aH-raiserid]: Microsoft Learn, "AD Forest Recovery - Raising the value of available RID pools," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-raise-rid-pool> (accessed Nov 9, 2026).
[^aH-invalidrid]: Microsoft Learn, "AD Forest Recovery - Invalidating the current RID pool," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-invaildate-rid-pool> (accessed Nov 9, 2026).
[^aH-computer]: Microsoft Learn, "AD Forest Recovery - Resetting the computer account password of the domain controller," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-reset-computer-account-dc> (accessed Nov 9, 2026).
[^aH-krbtgt]: Microsoft Learn, "AD Forest Recovery - Resetting the krbtgt password," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-reset-the-krbtgt-password> (accessed Nov 9, 2026).
[^aH-trust]: Microsoft Learn, "AD Forest Recovery - Resetting a trust password on one side of the trust," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-reset-trust> (accessed Nov 9, 2026).
[^aH-removegc]: Microsoft Learn, "AD Forest Recovery - Removing the global catalog," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-remove-gc> (accessed Nov 9, 2026).
[^aH-addgc]: Microsoft Learn, "AD Forest Recovery - Adding the global catalog," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-add-gc> (accessed Nov 9, 2026).
[^aH-redeploy]: Microsoft Learn, "AD Forest Recovery - Redeploy remaining DCs," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-restore-additional-dcs> (accessed Nov 9, 2026).
[^aH-virt]: Microsoft Learn, "AD Forest Recovery - Virtualization," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-virtualization> (accessed Nov 9, 2026).
[^aH-verify]: Microsoft Learn, "AD Forest Recovery - Verify replication," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-verify-replication> (accessed Nov 9, 2026).
[^aH-cleanup]: Microsoft Learn, "AD Forest Recovery - Cleanup," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-cleanup> (accessed Nov 9, 2026).
[^aH-single]: Microsoft Learn, "AD Forest Recovery - Recovering a single domain within a multidomain forest," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-recover-single-domain-multidomain-forest> (accessed Nov 9, 2026).
[^aH-scheduler]: Microsoft Learn, "Microsoft Entra Connect Sync: Scheduler" (default cycle every 30 minutes; disabling the scheduler), <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-sync-feature-scheduler> (accessed Nov 9, 2026).
[^aH-filtering]: Microsoft Learn, "Microsoft Entra Connect Sync: Configure filtering" (disable and re-enable the scheduler; Connect deletes objects it once considered in scope; the export deletion threshold, 500 by default), <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-sync-configure-filtering> (accessed Nov 9, 2026).
[^aH-entrabackup]: Microsoft Learn, "Supported objects and recoverable properties" (Microsoft Entra Backup and Recovery; synchronized objects appear in difference reports but are excluded from recovery), <https://learn.microsoft.com/entra/backup/scope-supported-objects-limitations> (accessed Nov 9, 2026).
[^aH-sp80053]: National Institute of Standards and Technology, SP 800-53 Rev. 5, controls CP-2, CP-4, CP-9 and CP-10 as checked in [Chapter 06](06-contingency-and-continuity.md) against release 5.2.0 (accessed Oct 21, 2026); IA-5 (Authenticator Management) and IR-4 (Incident Handling) named from the same catalog, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5/json>.
[^aH-ksi]: FedRAMP, *FedRAMP Consolidated Rules for 2026*, machine-readable ruleset `fedramp-consolidated-rules.json`, version 2026.10.13.01, Key Security Indicators KSI-RPL-ABO, KSI-RPL-ARP, KSI-RPL-RRO and KSI-RPL-TRC, as read for [Chapter 06](06-contingency-and-continuity.md), <https://github.com/FedRAMP/rules> (accessed Oct 21, 2026).
