# Verification — Chapter 12: The Managed Service Account Standard

New chapter, first pass of 2026-11-20, at the program owner's request of November 20, 2026 for a gMSA standardization process using ServiceNow, SailPoint and Microsoft tools. Program rules are decisions WD-159 to WD-170. Every source was read on November 20, 2026. The kit's Lab 1 was run on the fixtures that day; its output is in the chapter.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | SailPoint's Active Directory connector supports MSA and gMSA objects; reading `msDS-GroupMSAMembership` needs IQService with the Active Directory PowerShell module | Context | verified (vendor documentation) | `np12-sp-ad` |
| 2 | SailPoint Machine Identity Security: owner by attribute mapping, none when several identities match; owners review in certifications | Context | verified; licensing not stated | `np12-sp-mis` |
| 3 | Defender for Identity's Service Accounts page: gMSA, sMSA and user accounts with an SPN and a password that never expires; type column | Context; Lab 2, step 2 | verified | `np12-mdi-sa` |
| 4 | Defender for Identity's *Remove Stale Service Accounts* uses 90 days | Context | verified | `np12-mdi-posture` |
| 5 | `Get-ADServiceAccount` reads the account's properties, including `PrincipalsAllowedToRetrieveManagedPassword` | Context; the code | verified (cmdlet reference) | `np12-get-adsa` |
| 6 | Interval only at creation; always configure AES | Context | verified | `np12-gmsa-manage` |
| 7 | Control-to-KSI rows | Federal requirements | verified against Book 13, Appendix A's rows re-read from FedRAMP the same day | Book 13, Appendix A |
| 8 | Never delete the original account when a dMSA migration is finalized (in case you need to revert); `msDS-ManagedAccountPrecededByLink` on the dMSA names the superseded account; the superseded account's `msDS-SupersededManagedServiceAccountLink` and state attribute (spelled `msDS-SupersededAccountState` at the start and `msDS-SupersededServiceAccountState` at completion on the same page) | Rules (Retirement); the code | verified Nov 22, 2026 (set-up page ms.date 2025-05-30; overview ms.date 2025-05-30), at the program owner's request of Nov 22, 2026 that the retirement list never offer such an account for deletion | `np12-dmsa-setup` |
| 9 | Checklist (November 24, 2026): a deleted account's CyberArk vault entry goes in the same decommission ticket; no gMSA or dMSA is onboarded in CyberArk | Checklist | design guidance; CyberArk's pages don't mention managed accounts | Service accounts guide, "CyberArk hand-offs" and "CyberArk across the migration" |
| 10 | Each `kerberos-replatform.csv` row carries the request's tags in a thirteenth column, `Tags` (with `Request=` and `Change=`), which Chapter 06 writes as the new account's AD description; Lab 1's manifest SHA-256 is now `39aae524…` and step 3's rows end in the tags | What it hands to Chapter 06; Lab 1, steps 1 and 3 | updated by running the commands as written | WD-175; local run and captures 12-1 and 12-3, November 25, 2026 |

## Research gaps (rows 111 to 119)

| Row | Gap | Status |
|---|---|---|
| 111 | SailPoint's export field names for access requests and certification decisions | Open: the kit reads its own import format; Lab 2 maps columns by hand |
| 112 | Defender for Identity's Service Accounts export columns | Open: same |
| 113 | The Active Directory attribute that `-RestrictToOutboundAuthenticationOnly` sets | Open: Learn's cmdlet reference names none; a live read leaves it empty and NPI-STD-15 warns |
| 114 | Whether SailPoint Machine Identity Security is a separate license | Open: not stated on the page read |
| 115 | ServiceNow's Microsoft Active Directory spoke actions and a CMDB class for service accounts | Open: ServiceNow's documentation couldn't be read on November 20, 2026; the standard doesn't use them |
| 116 | Whether a default read returns a gMSA's retrievers | Open: carried from Chapter 06's row 53 |
