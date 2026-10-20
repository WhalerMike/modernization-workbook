# Verification — Appendix B, Security-Approval (ATO) Kit

Source: the existing page `appendix-b-ato-kit.md`. All sources accessed Oct 20, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Authorization is the agency AO's decision; FedRAMP covers leveraged cloud services | Callout | verified; RMF citation added | SP 800-37 Rev. 2; SP 800-53 CA-6 |
| 2 | SQL Server needs Azure public cloud access for Entra authentication | Callout | added (verified) | Learn, Managed identity Limitations |
| 3 | Connected Machine agent outbound TCP 443 | Boundary | verified | Learn, Connected Machine agent network requirements |
| 4 | Private Link quote (Entra ID and ARM traffic doesn't traverse the scope) | Boundary | verified (exact) | Learn, Private Link for Arc servers |
| 5 | SQL Server connects directly to Entra ID and ignores the Arc proxy; uses WinHTTP proxy | Boundary | added (verified) | Learn, Entra auth tutorial (Arc) |
| 6 | Endpoint table rows (download, login.microsoftonline.com, *.login.microsoft.com, pas.windows.net, management.azure.com, his, guestconfiguration, guestnotificationservice, servicebus, arcdataservices) | Endpoints | verified; arcdataservices TLS 1.2/1.3-only note added | Learn, network requirements |
| 7 | Entra auth endpoints: vault, graph | Endpoints | corrected: the SQL prerequisites list also login.microsoftonline.com, login.microsoft.com and enterpriseregistration.windows.net; vault only when using certificates | Learn, Prerequisites — SQL Server enabled by Azure Arc |
| 8 | FedRAMP High audit scope for the ten services; page dated 21 Sep 2026 | FedRAMP | verified (all ten rows ✅ in "Azure public services by audit scope"; ms.date 2026-09-21) | Learn, compliance scope page |
| 9 | Graph permissions quotes (User.Read.All, GroupMember.Read.All, Application.Read.All; assigned directly; not via group; Privileged Role Administrator) | Graph | verified (exact) | Learn, Set up managed identity |
| 10 | SQL 2022: Directory.Read.All or Application/Group/User.Read.All | Graph | verified | Learn, Entra auth tutorial |
| 11 | Directory Readers quotes | Graph | verified (exact) | Learn, Set up managed identity |
| 12 | Tokens folder / BULK permissions quote | Token folder | verified (exact) | Learn, Managed identity Limitations |
| 13 | Local endpoint needs local Administrators or Hybrid Agent Extension Applications | Token folder | verified | Learn, managed identity authentication on Arc servers |
| 14 | Single-user mode; any local Administrators member connects as sysadmin | Break-glass | verified | Learn, Connect when sysadmins are locked out |
| 15 | Emergency access guidance | Break-glass | verified | Learn, Manage emergency access admin accounts |
| 16 | Disabling Entra auth isn't advisable; registry deletion unpredictable | Break-glass | verified | Learn, Managed identity Limitations |
| 17 | Client connection summary needs SA/subscription/PAYG; Entra auth with License only | Licensing | verified (feature availability by license table) | Learn, Arc SQL overview |
| 18 | Conditional Access needs P1 | Licensing | verified | Learn, What is CA? |
| 19 | Dynamic groups P1 for each unique member | Licensing | verified | Learn, dynamic membership rules |
| 20 | PIM for Groups: P2, ID Governance or Entra Suite | Licensing | verified; restated as "P2, or a tier that includes it" (the table also lists further suites) | Learn, ID Governance licensing fundamentals |
| 21 | Access reviews: ID Governance or Entra Suite | Licensing | verified; added "some capabilities work with P2" | Learn, What are access reviews? |
| 22 | Defender for SQL servers on machines needs a Defender for Cloud plan | Licensing | verified | Learn, Defender for SQL on machines overview |
| 23 | Cloud PKI: Intune add-on, standalone or Intune Suite | Licensing | verified; wording aligned to "a subscription in addition to Intune Plan 1 or Plan 2"; issues only to Intune-enrolled devices added | Learn, Cloud PKI overview |
| 24 | Book references (07, 08, 09, 10; licensing column 02–10) | Throughout | renumbered to chapter ranges | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter (subtitle, description, doc-type) | House front matter; subtitle folded into description | edited |
| docx-only H1 wrapper | Plain H1, thesis line, "In this appendix" callout | edited |
| "Supports an authorization decision" callout | Kept; RMF/AO and Azure-public-cloud sentences added; date Oct 20, 2026 | edited |
| "Download this appendix" callout | Not carried; bundles are linked from the book index | removed |
| § Boundary (+ diagram) | Kept; proxy sentence added | edited |
| § Outbound endpoints | Kept; Entra-auth row corrected | edited |
| § FedRAMP audit scope | Kept; chapter links; Intune row clarified | edited |
| § Graph permissions (bold pseudo-headings "What is required", "Least-privilege justification", "Why not Directory Readers") | Same content as `###` headings (style rule: no bold fake headings) | edited |
| § Token folder and BULK permissions | Kept | kept |
| § Break-glass design | Kept | kept |
| § Licensing bill of materials | Kept; column renamed "Chapters" and renumbered; PIM, access reviews, Cloud PKI rows refined | edited |
| Footnotes `[^ab-…]` | Renamed `[^aB-…]`, reformatted, re-opened | edited |
| Continue-the-series callout | Adds Next: Appendix C per reading order | edited |
