# Verification — Appendix B, Applicability

Editor: W5. Source: the series page in place (old 00a, "Applicability and Scope"). All checks October 21, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | "Commercial cloud / GCC-Moderate (FedRAMP Moderate system boundary; underlying Azure commercial services carry FedRAMP High)" | Environment table | verified and made specific: M365 GCC is paired with Entra ID in commercial Azure; its Marketplace listing (MSO365MT) is FedRAMP Certified, Class C (Moderate); Azure holds a FedRAMP High P-ATO in the public cloud | Microsoft Learn, Cloud feature availability for US Government; FedRAMP Marketplace MSO365MT; Microsoft Learn, Configure Entra ID for FedRAMP High |
| 2 | M365 INR not available to GCC Moderate | Environment table | verified via settled book fact (Book 09 Ch 12), linked | Book 09 |
| 3 | GCC High and DoD are Azure Government; feature availability differs | Environment table | verified (pairing with Entra ID in Azure Government) | Microsoft Learn, Cloud feature availability |
| 4 | Confirm CBA, Lifecycle Workflows, Cloud PKI, Global Secure Access and Arc services per cloud | Environment table | updated: Entra's US Government table lists CBA, PIM, access reviews and Lifecycle Workflows as available; threat-intelligence detection and My Staff aren't. Global Secure Access and Arc not checked here, so not named | Microsoft Learn, Entra feature availability in Azure for US Government |
| 5 | Cloud PKI in GCC High, not DoD | Environment table | verified | Microsoft Learn, Intune GCC High and DoD service description |
| 6 | Air-gapped: Entra, Intune, Arc unavailable; discipline still applies | Environment table | restated-as-design | — |
| 7 | 802.1X/NPS successor "not designed in the series" | Environment table | updated: Book 09 Ch 07 now covers it | Book 09 |
| 8 | Windows Server 2025 for the platform host; earlier versions for assessment | Platform | kept; added WS2012 ESU end and WS2016 end-of-support dates | Microsoft Learn, Arc licensing page |
| 9 | Windows 11 for Entra join and Autopilot | Platform | kept; added Windows 10 end of support Oct 14, 2025 | Microsoft Learn lifecycle |
| 10 | Entra ID P1 for dynamic groups, dynamic AUs, Conditional Access | Platform | verified and refined (AU administrators need P1; dynamic AU members need P1) | Microsoft Learn, Administrative units; Entra licensing |
| 11 | "Entra ID P2 or Entra ID Governance for PIM, Identity Protection risk policies, access reviews and Lifecycle Workflows" | Platform | corrected: PIM needs P2 or Governance; Identity Protection risk policies need P2; access reviews and Lifecycle Workflows need Governance (or Entra Suite); P2 alone doesn't include Lifecycle Workflows | Microsoft Learn, Entra licensing; ID Governance licensing fundamentals; What are lifecycle workflows |
| 12 | Intune licensing for every managed device user | Platform | restated-as-design (licensing assumption) | — |
| 13 | "Some Arc-enabled capabilities are billed per server" | Platform | corrected: the Arc control plane carries no extra cost; Azure services used on Arc servers are billed at their own rates | Microsoft Learn, Azure Arc overview, Pricing |
| 14 | Framework is a design, not a product; numbers illustrative | What it is | restated-as-design | — |
| 15 | AD DS not deprecated; remains in Windows Server 2025 | What it is | verified (WS2025 added a functional level) | Microsoft Learn, What's new in Windows Server 2025 |
| 16 | "Read this before Chapter 01" | Opening | corrected: the page is now Appendix B; read alongside Chapter 01 | — |
| 17 | Old chapter numbers (01, 02–03, 04–08, 07) | Throughout | corrected to new numbering (03, 10–11, 03–08, 07) | — |
| 18 | Microsoft Learn "Authoritative references" list | End | removed as a list; every entry footnoted | — |
| 19 | Review fix, Oct 21, 2026: new row "Non-Microsoft identity or cloud stack": the method transfers, the product mappings don't | The environment this book assumes | restated-as-design | Program position; no external claim, no note. Links Book 10 Ch10 for one alternative collaboration path. |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Title "Applicability and Scope" and bold subtitle | H1 "Appendix B — Applicability"; italic thesis; "In this appendix" callout | — |
| The environment this series assumes (four-row table) | "The environment this book assumes," same four rows, corrected | — |
| Platform assumptions | Same, corrected (claims 8–13) | — |
| What this series is, and isn't | "What this book is, and isn't"; data and encrypted DNS bullet added from Appendix A's old gap list | — |
| Authoritative references | Footnotes | List removed |
| Previous/Next links | "Continue the book" callout (Appendix A; no Next) | — |
