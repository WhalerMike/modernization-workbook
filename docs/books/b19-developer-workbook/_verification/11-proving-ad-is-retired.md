# Verification — Chapter 11, Proving AD Is Retired

New chapter, November 27, 2026. It extends existing material and replaces no page: the kit `examples/ad-retirement-evidence` (merged in #862), Book 00, Chapter 10's Phase 5 (the steps), Book 01, Chapter 12 (gate G5's wording, which #859 reconciled across the books), *Building Non-Person Identity*, Chapter 06 (the island list) and WD-183 (the platform host's AD dependencies as one WD-065 exception). The chapter links them and doesn't restate them. Numbered 11, not 10: Chapter 10 is the deployment runbook, and existing file numbers stay stable.

## Overlap search, origin/main, November 27, 2026

Searched by topic and key terms ("AD retired", "AD Retired", "G5", "Kerberos island", "WD-065", "WD-183", "domain controller decommission", "AD-G5", "Invoke-AreEvidence", "ad-retirement-evidence") across `docs/books`, `docs/project-plans`, `docs/training`, `docs/topics`, `data` and `presentations`.

- **Covers it already, linked:** Book 00, Chapter 10 (Phase 5 steps, removing each domain controller, the decommissioning checklist, Gate G5, and a pointer to the kit); Book 01, Chapter 12 (G5's criteria); NPI workbook Chapter 06 (island list and reconciliation); WD-065, WD-183 and WD-014 in the decision register; the Attribute-Driven Migration topic page (lists the kit and its zip); Book 14, Appendix I (closing the retired system's authorization).
- **New here:** the developer walk-through of the kit (gap table against Learn, labs, verified facts, federal table, dangers, checklist) and the learning path module. No other workbook chapter or module teaches the kit.
- **Conflicts found:** none on G5's wording, the island or WD-183. One mapping tension, held rather than written (below).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | G5's criteria, word for word as Book 01, Chapter 12 and the reconciled pages (#859) | Where the kit sits | verified against main | Book 01, Chapter 12 |
| 2 | Normal demotion removes metadata; forced removal needs cleanup; cleanup verified by no NTDS Settings object | Learn table; Verified facts | verified (as cited by Book 00, Chapter 10, accessed Nov 9, 2026) | Learn, demote; metadata cleanup |
| 3 | DC locator SRV record `_ldap._tcp.dc._msdcs.<domain>`, checked with `nslookup` | Learn table; Lab 2 step 4 | verified Nov 27, 2026 | Learn, Verify SRV DNS records |
| 4 | `Get-ADDomainController -Filter *`, `-Server` | Learn table; Lab 2 | verified Nov 27, 2026 | Learn, Get-ADDomainController |
| 5 | 4768 and 4769 only on domain controllers; 4776 on the authoritative computer (the domain controller for domain accounts); their audit subcategories | Learn table; Lab 2 step 2; Dangers | verified Nov 27, 2026 | Learn, events 4768, 4769, 4776 |
| 6 | `SecurityEvent` collected by Defender for Cloud or Microsoft Sentinel; its columns | Learn table; Lab 2 | verified Nov 27, 2026 | Learn, SecurityEvent table reference |
| 7 | `Invoke-AzOperationalInsightsQuery -WorkspaceId -Query`, rows in `.Results` | Lab 2 step 2 | verified Nov 27, 2026 | Learn, cmdlet reference |
| 8 | Log Analytics Reader includes `*/read`; Log Analytics Data Reader is the bare minimum for queries | Lab 2 step 1; Verified facts | verified Nov 27, 2026; see open item 1 | Learn, Manage access to Log Analytics workspaces |
| 9 | `lastLogonTimestamp` updated only past the sync interval; 14 days minus a random part of 5 after a functional level raise | Learn table; The checks; Dangers | verified Nov 27, 2026 | Learn, Last-Logon-Timestamp attribute |
| 10 | RSAT through Optional features on Windows 10 1809 and later | Lab 2 | verified Nov 27, 2026 | Learn, Remote Server Administration Tools |
| 11 | `New-AzRoleAssignment` / `Remove-AzRoleAssignment` with `-SignInName -RoleDefinitionName -Scope` | Lab 2 steps 1 and 7 | as cited in Chapter 09 (Nov 27, 2026); `Remove-AzRoleAssignment` with the same parameters not reread | Learn, Assign Azure roles using Azure PowerShell |
| 12 | Get-ADObject, Get-ADTrust, Get-ADComputer pages | Learn table | links from the kit's `config/calls.json`, not reread | Learn |
| 13 | Microsoft supports AD DS; retirement is the agency's decision | Where the kit sits | verified against WD-014 | decision register |
| 14 | Windows Server 2019 minimum, 2016 upgrades done | Where the kit sits | stated as an assumption about the estate | the workbook owner's baseline decision, November 5, 2026 |
| 15 | Lab 1 outputs: 7 findings and 1 warning, manifest `aa9fad97…`; 9 hashes true; `findings.json` caught; 9 findings, 0 warnings after 2028-10-01; full retirement ready; 14 tests | Lab 1 | verified by `scripts/kit_captures.py adm` in Windows PowerShell 5.1, and the same packet hashes in PowerShell 7 | local run, Nov 27, 2026 |
| 16 | The register's workloads come from the island list; the platform host's objects stay in the register until WD-183 ends; the manifest hash goes to the SIEM | Where the kit sits; The packet; Checklist | restated-as-design (labeled) | — |

## Kit changes in this pull request

- `ConvertTo-AreJson` replaces `ConvertTo-Json` for the packet: the two editions indented and escaped differently, so the same reads gave different manifest hashes in 5.1 and 7. Now identical; a test pins the fixture manifest hash.
- The manifest's `asOfUtc` and the summary's date are UTC whatever the machine's time zone (`-AsOf` without a zone is taken as UTC).
- AD-G5-05's message: "A trust the register doesn't list (direction: Outbound)" (was "A Outbound trust …").
- `Invoke-AreEvidence.ps1` exits 0 when ready, so `$LASTEXITCODE` never holds an earlier run's code.
- The test file unrolls `ConvertFrom-Json`'s array in Windows PowerShell 5.1: eight tests failed there before (they passed in PowerShell 7 only).

Tests: 14 passed in Windows PowerShell 5.1.26100 (Pester 5.9.0) and PowerShell 7 (Pester 5.9.0), November 27, 2026.

## Open items

1. **Workspace role.** The kit's `config/calls.json` declares Log Analytics Reader; Learn names Log Analytics Data Reader as the bare minimum for queries. The chapter grants the declared role at the workspace scope and says so. Changing the declaration is a kit decision for the owner.
2. **KSI pairing for AC-2.** The kit's `config/requirements.json` lists KSI-IAM-AAM, and Book 18, Appendix B pairs AC-2 with it; Book 13, Appendix A maps KSI-IAM-AAM to AC-2's enhancements (AC-2(2), AC-2(3), AC-2(13)) and not to AC-2. The chapter claims no KSI for AC-2 until the owner settles which reading holds. AU-6's indicator in Book 13, Appendix A (KSI-MLA-RVL) isn't in the kit's config, so AU-6 carries none here either.
3. **Zero authentication rows.** The kit doesn't fail when the export is empty while domain controllers remain; the chapter's guard is the checklist and Lab 2's stop. A check in the kit is a possible change.
4. **Not run against a live forest or workspace.** Lab 2 is written from Learn's commands and the kit's code.
