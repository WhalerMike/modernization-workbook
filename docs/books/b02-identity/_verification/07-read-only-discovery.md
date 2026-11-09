# Verification — Chapter 07, Read-Only Discovery

Written by the editor (the assigned writer's draft was stopped before the chapter was saved; its diagram sources and its source-claim findings were reused). Sources checked October 20, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | AC-6 least privilege is a NIST SP 800-53 Rev. 5 control | Opening | verified | csrc.nist.gov SP 800-53 Rev. 5 |
| 2 | Authenticated Users gets four property sets + read permissions on user objects by default | Standard account | corrected (source: "Read All Properties") | MS Learn, password writeback permissions |
| 3 | Pre–Windows 2000 Compatible Access gets list/read-all/read-permissions on users, groups, InetOrgPerson | Standard account | verified | same |
| 4 | Its default membership depends on the permissions mode chosen at domain creation | Standard account | verified | MS Learn, AD security groups |
| 5 | AdminSDHolder holds template permissions; SDProp runs every 60 min on the PDC emulator; inheritance disabled | Protected groups | verified | MS Learn, Appendix C |
| 6 | SDProp acts on current members; removed accounts keep adminCount=1 and stop being refreshed | Protected groups | corrected (source: "every adminCount=1 object") | MS Learn, Reducing the AD Attack Surface |
| 7 | searchFlags bit 7 (128) marks an attribute confidential; needs CONTROL_ACCESS; only admins by default | Confidential | verified | MS Learn KB 922836 |
| 8 | Base-schema attributes can't be marked confidential | Confidential | verified | MS Learn, Search-Flags attribute |
| 9 | LAPS passwords are in protected/confidential attributes readable only by delegated users | Confidential | verified | MS Learn, MDI accounts posture assessments |
| 10 | Windows LAPS uses msLAPS-PasswordExpirationTime | Confidential | verified | MS Learn, Windows LAPS schema reference |
| 11 | Legacy Microsoft LAPS deprecated as of Windows 11 23H2; installer blocked | Confidential | corrected (source treated legacy LAPS as current) | MS Learn, What is Windows LAPS? |
| 12 | Password hashes leave a DC only by replication; Replicating Directory Changes All = secret domain data | Secrets | corrected (source: plain "Replicating Directory Changes") | MS Learn, DS-Replication-Get-Changes-All |
| 13 | Entra Connect PHS account holds both replication rights | Secrets | verified | MS Learn, PHS with Connect Sync |
| 14 | Deleted Objects viewable only by SYSTEM and Administrators by default; grant LCRP after take-ownership | Restricted containers | corrected (source named "Reanimate Tombstones" as the read right) | MS Learn KB 892806 |
| 15 | Reanimate Tombstone is the restore right | Restricted containers | verified | MS Learn, Restoring Deleted Objects |
| 16 | Default tombstoneLifetime 180 days in forests created with 2003 SP1 or later | Restricted containers | verified | MS Learn, ADAC Level 200 |
| 17 | Fine-grained password policies managed by Domain Admins by default | Restricted containers | verified (narrowed: the chapter no longer claims who can *read* PSOs; treated as a delegation item) | MS Learn, Configure FGPP |
| 18 | Defender for Identity raises discovery alerts for AD enumeration and sensitive-attribute LDAP queries | Running safely | verified | MS Learn, MDI alerts in Defender format |
| 19 | Source's ~87% coverage figure; its own module averages ~94% | Gaps | restated-as-design (neither is a measurement) | source page arithmetic |
| 20 | BitLocker status detectable via userAccountControl flags | (source) | removed (no such flag; recovery objects restricted) | writer's finding |
| 21 | Fine-grained password policies readable by standard users | (source) | removed | writer's finding; chapter narrowed per row 17 |
| 22 | userPassword "never returned" | (source) | removed (not needed by the chapter; it is a normal attribute unless fUserPwdSupport is set) | writer's finding |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| 1.1 Purpose, 1.2 Use cases | Opening, "What a standard account can read" | — |
| 1.3 Scope (OS versions, Controlled/GCC-Moderate stamp) | — | Classification stamps are not used in the workbook; OS scope implicit |
| 2.1–2.5 Permission baseline and exceptions | "What a standard account can read", "Where the default read boundary sits" | Corrected per claims log |
| 3.1–3.7 Capability matrix | Table in "What a standard account can read" | Condensed to plan-relevant areas |
| 4 Coverage score | "Recording what read-only discovery couldn't see" | Restated: report measured coverage only |
| 5 PowerShell module, function specs | — | Not carried: the enumeration module stays in the archive pending technical review (defects found) |
| 6 Output directory structure | "Running the assessment safely" (dated repository path, manifest) | Tree listing not carried |
| 7 Gap analysis | Gap table | Corrected; secret-revealing rights removed as requests |
| 8 Delegation request template | "The delegation request" (rules) | dsacls commands not carried: the directory team implements delegations through its own change process |
| 9.1–9.4 Security considerations | "Running the assessment safely" | — |
| 10 Pipeline integration | Pipeline diagram and safe-running bullets | Gitea webhook specifics generalized to "versioned repository" |
| 11 Companion cross-reference | — | Replaced by book cross-links |
| Appendix A module | — | Not carried (see §5) |
| Appendix B quick reference card | — | Not carried (module-specific) |
| Appendix C checklist | "Checklist" | Module-copy item dropped |
| Appendix D sample manifest | — | Not carried (module-specific) |

## Revision 2026-11-09 — Learn citation pass

Microsoft Learn pages listed as covered but uncited for this chapter were read on Nov 9, 2026 and cited where they support a specific sentence. No sentence was reworded. The krbtgt password reset page (forest recovery guide) supports nothing in this chapter, which only names krbtgt among the protected accounts; it stays covered-uncited because Chapter 09 is also in its workbook list.

| # | Claim | Where | Verdict | Source |
|---|---|---|---|---|
| L1 | Sites, subnets and site links set the shape of replication (c07-repl-concepts) | Read-only results table, topology row | verified (Learn read Nov 9, 2026) | <https://learn.microsoft.com/windows-server/identity/ad-ds/get-started/replication/active-directory-replication-concepts> |
| L2 | Replication health needs an administrator-run summary; repadmin forest-wide status needs Enterprise Admins or equivalent (c07-repl-status) | Gap list, replication row | verified (Learn read Nov 9, 2026) | <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/troubleshoot/troubleshooting-active-directory-replication-problems> |
| L3 | Recycle Bin status is a read-only substitute for Deleted Objects; it is off by default and irreversible once enabled (c07-ad-recyclebin) | Gap list, Deleted Objects row | verified (Learn read Nov 9, 2026) | <https://learn.microsoft.com/windows-server/identity/ad-ds/get-started/adac/active-directory-recycle-bin> |
