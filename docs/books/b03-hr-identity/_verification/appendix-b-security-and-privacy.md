# Verification — appendix-b-security-and-privacy.md

Editor pass 2026-10-20. The appendix had no footnotes. The privacy-basis section needed the most correction. Following the coordinator's note (from the Chapter 07 writer), it now matches Chapter 07: sharing inside the agency rests on need-to-know under 5 U.S.C. 552a(b)(1), a routine use covers disclosure outside the agency, and the privacy office makes the call.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Source said: confirm the "routine-use basis for disclosure to identity services" | Privacy basis | corrected: inside the agency that maintains the records, sharing with the identity platform normally rests on need-to-know (5 U.S.C. 552a(b)(1)). A routine use is a disclosure outside that agency (for example a shared-service provider or another agency), and it must be published in the SORN. The privacy office decides which basis covers each leg | Privacy Act 5 U.S.C. 552a(a)(7), (b)(1), (b)(3) (`[^aB-privacy-act]`); OMB A-108 §6.k (`[^aB-a108]`) |
| 2 | OPM/GOVT-1 governs general personnel records | Privacy basis | verified; added that the notice places records on current employees with the employing agency and that it is a government-wide SORN | OPM/GOVT-1 modified notice, Aug 17, 2023 (`[^aB-govt1]`); A-108 §6.i |
| 3 | Copying HR attributes into the directory may need a SORN revision | Privacy basis (new "SORN scope" bullet) | added (verified): A-108's significant changes include substantially increased access within the agency and new or expanded routine uses | A-108 §6.b |
| 4 | Directory attributes are readable by member users | SORN scope | added (verified): member users can enumerate users and read all public properties by default | MS Learn, default user permissions |
| 5 | Update the PIA for the new flow | Privacy basis | corrected/qualified: E-Gov Act §208 as implemented by M-03-22 targets information about members of the public; M-03-22 exempts employee/contractor-only systems but encourages PIAs. A-130 Appendix II §5.e directs PIAs for IT processing PII absent an exception, and SP 800-53 RA-8 is in the privacy baseline. The program treats the update as required (design) | M-03-22 §II.B; A-130; SP 800-53 Rev. 5 Release 5.2.0; SP 800-53B |
| 6 | Interconnection terms cover the feed | Privacy basis | verified; tied to SP 800-53 CA-3 and SP 800-47 Rev. 1 | NIST SP 800-53; SP 800-47 Rev. 1 |
| 7 | Send only attributes a decision reads | Minimization | verified as federal principle (A-130 FIPP Minimization; SI-12(1)) | A-130 App. II §3; SP 800-53 |
| 8 | SSN never moves | Minimization | verified as consistent with A-130 §5.f.1(f) (eliminate unnecessary SSN use) | A-130 |
| 9 | TLS to Graph | Legs table | verified/specified: TLS 1.2 or later; Entra deprecated TLS 1.0/1.1 (US Gov instances Mar 31, 2021; public Jan 31, 2022) | MS Learn, Enable TLS 1.2 support for Microsoft Entra |
| 10 | Provisioning agent is outbound-only | Legs table | verified | MS Learn, on-premises application provisioning architecture (firewall requirements) |
| 11 | Logs hold person key and payload hash only | Legs table | restated-as-design; linked to AU-3(3) | SP 800-53 |
| 12 | Managed identity or certificate, no secrets | Service identity | verified; clarified that managed identity applies to workloads on Azure resources and that Microsoft's setup uses a secret but recommends certificate or managed identity for production | MS Learn, Grant access to the inbound provisioning API |
| 13 | Least privilege: upload + provisioning-log read; never deletes | Service identity | verified; added that `/bulkUpload` doesn't support deletion and that Microsoft points disposal to the LCW delete-user task | Grant access page; API-driven provisioning FAQ |
| 14 | Conditional Access applies to the service principal "where supported" | Service identity | corrected/specified: needs Workload Identities Premium, single-tenant SPs only, block grant only, managed identities not covered | MS Learn, Conditional Access for workload identities |
| 15 | Quarterly review of SP permissions | Service identity | restated-as-design; linked to AC-6(7) | SP 800-53 |
| 16 | Pause switch | Pause | verified mechanism; added that pausing needs `Application.ReadWrite.OwnedBy` or `Synchronization.ReadWrite.All`, which the upload client doesn't hold | MS Learn, synchronizationJob: pause |
| 17 | Large-delta hold | Pause | verified Entra-side mechanism: accidental deletions prevention counts disables and deletions per cycle and quarantines the job; the middleware check covers re-scoping | MS Learn, accidental deletions prevention; API-driven FAQ |
| 18 | Diagram edge label "TLS; routine use" | appb diagram source, caption, fig-alt | corrected to "TLS; disclosure basis" (a routine use is not always the basis) | as #1 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | edited: `part: Appendix`, `series-order` 21 → 91, `lifecycle_review` → 2027-04-01, description wording | — |
| Thesis, In this appendix | kept | — |
| Diagram appb-data-flow-protection | edited: caption and fig-alt; source edge label changed in `docs/images/diagrams/b03-hr-identity/src/appb-data-flow-protection.flow.yaml` (needs re-render) | — |
| The privacy basis | edited: "Routine use" bullet replaced by "Disclosure basis"; new "SORN scope" bullet; PIA bullet qualified; interconnection bullet footnoted | — |
| Minimization | edited (footnotes, A-130/SI-12(1) tie) | — |
| Protecting every leg table | edited (TLS version, outbound-only footnote, AU-3(3)) | — |
| Service identity and privilege | edited (managed identity scope; deletion; CA limits; AC-6(7)) | — |
| A pause switch | edited (pause permission; accidental-deletions threshold) | — |
| ISSO review checklist | edited (first item: disclosure basis, SORN coverage) | — |
| Continue callout | edited to "Continue the book" / "Book index" | — |
