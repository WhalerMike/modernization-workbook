# Verification — Chapter 10, From Attributes to Access

Editor pass, 2026-10-20. All Microsoft Learn pages re-opened on this date; every kept footnote was re-checked against the sentence it supports. Footnote keys renamed `c08-*` → `c10-*` (the chapter was renumbered from 08).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Dynamic group members are added/removed automatically; can't be added or removed manually | Derivation chain; Governance of the rules | verified (footnote added) | c10-dyn-rules |
| 2 | Conditional Access can target any user group, dynamic or assigned | Derivation chain | verified (new footnote) | c10-ca-users |
| 3 | "Token evaluated against these groups on every session" | Derivation chain, Zero Trust paragraph | corrected — restated as: Conditional Access evaluates its policies, including group assignments, before granting access | c10-ca-users |
| 4 | AC-2 asks for specified group/role membership and authorization on attributes | Derivation chain, *because* bullet | verified (new footnote; AC-2 d, i) | c10-nist-80053 |
| 5 | Review attribute write permissions in Entra and source directory before using in security-sensitive rules | Derivation chain | verified | c10-dyn-rules |
| 6 | Rule syntax in all eight patterns (`accountEnabled`, `userType`, `extensionAttribute10–12`, `companyName`, `-in [..]`, `-ne`, Direct Reports, `device.deviceOSType`, `device.deviceOwnership -eq "Company"`) | Rule patterns table | verified | c10-dyn-rules |
| 7 | extensionAttribute1–15 supported as string properties | Rule patterns | verified (added) | c10-dyn-rules |
| 8 | Direct reports rule: manager's object ID; manager also added | Rule patterns | verified; expanded — direct reports only, can't combine with other rules | c10-dyn-rules |
| 9 | Rules can't read `employeeType`, `employeeOrgData`, `manager` | Rule patterns | verified (not in supported user properties list); reworded to say so | c10-dyn-rules |
| 10 | Agent user accounts are evaluated by user rules unless excluded | Rule patterns | added (new, verified) | c10-dyn-rules |
| 11 | Rule body ≤ 3,072 characters; ≤ 15,000 dynamic groups per tenant | Limits | verified | c10-dyn-rules |
| 12 | Dynamic groups and dynamic AUs together ≤ 15,000 | Limits | added (consistent with Book 02 Ch 05) | c10-au-faq |
| 13 | Prefer `-eq`, then `-startsWith`/`-endsWith`; `-in` over `-or` chains; minimize `-match`/`-contains` | Limits | verified | c10-dyn-efficient |
| 14 | P1 for each unique user in one or more dynamic groups | Limits | verified; added that licenses needn't be assigned and devices need none | c10-dyn-rules |
| 15 | AUs scope delegated administration (help desk example) | Administrative units | verified (new footnote) | c10-au-overview |
| 16 | AUs can't be nested | Administrative units | added for consistency with Book 02 Ch 05 | c10-au-overview |
| 17 | Dynamic AU holds users or devices, not both, and not groups | Administrative units | verified | c10-au-dynamic |
| 18 | "Each AU administrator and member needs P1" | Administrative units | corrected — true for dynamic AUs; assigned AUs need P1 for administrators only (members Free) | c10-au-overview, c10-au-dynamic |
| 19 | Dynamic AUs available in global Azure cloud "which is where GCC tenants run" | Administrative units | verified; corrected framing — dynamic AUs aren't available in specialized clouds such as Azure Government; GCC uses Entra ID in the global cloud, GCC High/DoD use Azure Government; replaced the indirect CBA-CRL footnote with the Azure Government identity-planning FAQ | c10-au-dynamic, c10-gov-identity |
| 20 | Restricted management set at creation, can't be changed | Administrative units | verified | c10-au-restricted |
| 21 | Restricted AU users/groups can't be managed by PIM, entitlement management, Lifecycle Workflows, access reviews | Administrative units | added (material omission; consistent with Book 02 Ch 05) | c10-au-restricted |
| 22 | Manager as approver for users in the directory; resolves to `manager` attribute | Access packages | verified; added fallback-approver behavior | c10-ap-approval |
| 23 | Access reviews can be assigned to managers | Access reviews | verified; re-sourced to "Create an access review" (the overview table doesn't list managers for groups/apps); added fallback reviewer | c10-ar-create |
| 24 | Built-in separation-of-duties capability in entitlement management | Separation of duties | added (verified); person-level and reporting-chain checks restated as program design | c10-gov-licensing |
| 25 | Entitlement management and access reviews require ID Governance for member users; P2-era capabilities (incl. manager approvers) still run on P2; no new IGA features in P2 | Licensing (new subsection) | added (verified) | c10-gov-licensing |
| 26 | Lifecycle Workflows, auto-assignment policies, manager request-on-behalf, PIM for Groups eligibility in access packages require ID Governance or Entra Suite | Licensing | added (verified) | c10-gov-licensing |
| 27 | ID Governance needs a P1/P2-plan prerequisite; ID Governance for Government offered in GCC, GCC High, DoD | Licensing | added (verified) | c10-gov-licensing |
| 28 | Role-assignable groups require assigned membership (removes attribute-write risk) | Where dynamic membership stops | verified | c10-dyn-rules |
| 29 | ≤ 500 role-assignable groups per tenant | Where dynamic membership stops | added (verified; consistent with Book 02 Ch 05) | c10-pim-groups |
| 30 | PIM for Groups: any security/M365 group except dynamic and on-prem-synced | Where dynamic membership stops | verified | c10-pim-groups |
| 31 | Microsoft recommends approval for eligible member assignments of role-elevating groups | Where dynamic membership stops | added (verified) | c10-pim-groups |
| 32 | Enterprise person key as SIEM/DB/badge join key; separated-person authentication is an alert | Where dynamic membership stops | restated-as-design (unchanged; program position) | — |
| 33 | Break-glass accounts cloud-only, excluded, monitored | Where dynamic membership stops | verified and expanded (`*.onmicrosoft.com`, not federated/synced, not tied to an individual, excluded from blocking CA, alert on every sign-in); exclusion from HR rules/LCW stated as program design | c10-emergency |
| 34 | Rule validation, shadow run, pilot gating; HR-owned code lists | Governance of the rules | restated-as-design (unchanged) | — |
| 35 | The choice of `extensionAttribute10–12` | Rule patterns | restated-as-design (owned by Chapter 06, unchanged) | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | Front matter | edited — added `part: How`; `lifecycle_review` 2027-01-01 → 2027-04-01 |
| Thesis line, "In this chapter" | Same | edited — callout mentions licensing |
| The derivation chain | Same | edited — the bold-paragraph chain line became a plain sentence (style rule: no bold paragraph as fake heading); added `#fig-ch10-derivation-chain` id; footnotes for CA and AC-2; Zero Trust sentence corrected (claim 3) |
| Rule patterns (table and notes) | Same | edited — footnote keys; direct-reports and supported-property wording; agent-account exclusion added |
| Limits and efficiency | Same | edited — combined 15,000 limit with AUs; license-count detail |
| Governance of the rules themselves | Same | kept (footnote added to the manual-addition bullet) |
| Administrative units | Same | edited — corrected licensing and cloud availability; added no-nesting, restricted-management governance exclusion, and link to `../b02-identity/05-delegation-without-ous.md` |
| Access packages and access reviews | Same | edited — fallback approver/reviewer; reviewer source changed; SoD split into product capability vs. program design; new Licensing subsection |
| Where dynamic membership stops | Same | edited — 500 limit, approval recommendation, emergency-access details |
| SQL Server workbook pointer | Same | kept (link target exists) |
| Continue the series callout | "Continue the book" callout | edited — Book 02 styling; full Chapter 09 title |
| Diagram `ch10-derivation-chain.flow.yaml` | Unchanged | kept — no wrong facts (its comment line still says "Chapter 08"; cosmetic, not edited) |

## Addition, October 30, 2026: emergency calling and HR attributes

New section "Emergency calling: what HR attributes supply and what they don't," placed before "Where dynamic membership stops," with diagram `ch10-emergency-location-precedence`. Every source below was opened on Oct 30, 2026. The eCFR text was read through the versioner API for Title 47 as of Oct 28, 2026 (`47 CFR 9.3`, `9.11`, `9.16`); the statutes through govinfo (United States Code, 2024 edition); FCC 19-76 from the FCC's PDF.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| E1 | FCC reads MLTS to cover cloud-based systems and over-the-top applications; record named softphone clients and mobile devices | Intro | verified (para. 48, quoting a commenter for the endpoint list) | c10-fcc1976 |
| E2 | Dispatchable location = validated street address plus suite, floor or similar | The rules ask where the caller is | verified | c10-cfr93 |
| E3 | Non-fixed device = one the user can move between endpoints without assistance | Same | verified (note 402) | c10-fcc1976 |
| E4 | On-premises non-fixed: automated when technically feasible, else manual update or alternative location information; off-premises: automatic if feasible, else manual update or best available location at reasonable cost, may be coordinates | Same | verified (§ 9.16(b)(3)(ii)–(iii)) | c10-cfr916 |
| E5 | Systems may rely on the user to provide or confirm location via prompt; manual locations may be inaccurate or stale | Same | verified (paras. 153–154) | c10-fcc1976 |
| E6 | Managers and operators may rely on enterprise customers to acquire, maintain and update location information | Same | verified (para. 164) | c10-fcc1976 |
| E7 | Statutory MLTS definition includes systems owned or leased by governmental agencies | Interpretation callout | verified | c10-usc1471 |
| E8 | Obligations fall on "a person engaged in the business of installing, managing, or operating" | Interpretation callout | verified (§ 623(b)–(c)) | c10-usc623 |
| E9 | "Person" defined as individual, partnership, association, joint-stock company, trust or corporation | Interpretation callout | verified (§ 153(39)) | c10-usc153 |
| E10 | FCC 19-76 doesn't discuss federal agencies as operators | Interpretation callout | verified by full-text search of the order (no passage on federal government, federal agencies or federal entities as MLTS operators); conclusion labeled as interpretation | c10-fcc1976 |
| E11 | Location precedence, five tiers | How Teams chooses | verified | c10-remote-loc |
| E12 | Routing by address type: dynamic, OS-confirmed, autosuggest direct; static user address, unconfirmed OS, manual, null screened | How Teams chooses | verified (routing table, United States) | c10-remote-loc |
| E13 | Calling Plan: non-dynamic calls screened; if caller can't update location, transferred to PSAP for registered address | How Teams chooses | verified (US row of the routing table) | c10-cp-e911 |
| E14 | Calling Plan, US: emergency location required when number is assigned | How Teams chooses | verified | c10-cp-e911 |
| E15 | Emergency calling policy applies to all four connectivity options; assignable to users or network sites; site overrides user | What HR attributes drive | verified | c10-dynamic, c10-ecp |
| E16 | Calling Plan, Operator Connect, Teams Phone Mobile emergency numbers come from usage location | Table row 1 | verified | c10-dynamic |
| E17 | Notification modes: chat only, conferenced muted, conferenced unmuted | Table row 2 | verified | c10-ecp |
| E18 | External location lookup mode lets off-network users configure their address; disclaimer banner | Table row 3 | verified | c10-ecp |
| E19 | Give every softphone user the remote-location policy; telework flag only for training | What HR attributes drive | restated-as-design (program position) | — |
| E20 | `Grant-CsTeamsEmergencyCallingPolicy` has a group parameter set with rank | Group rules | verified | c10-ecp-grant |
| E21 | Direct assignment beats group; nested groups not propagated; 64 groups per policy type; large-group propagation 24 hours or more | Group rules | verified | c10-gpa |
| E22 | Emergency call routing policy: cmdlet shows group parameter; group-assignment reference lists it as excluded | Group rules | verified (both pages say so; conflict reported, not resolved) | c10-ecrp-grant, c10-gpa |
| E23 | Routing policy assignable to network sites | Group rules | verified | c10-dynamic |
| E24 | LIS needs subnets, BSSIDs, switches, ports linked to geocoded addresses | Where the data comes from | verified | c10-dynamic |
| E25 | Subnet lookups only when public IP is trusted; WAP and switch lookups regardless | Same | verified | c10-dynamic |
| E26 | Cloud proxies that rewrite source IP don't support network setting lookups | Same | verified | c10-dynamic |
| E27 | Full-tunnel VPN can return the mapped location of the VPN pool | Same | inference, labeled as such in the text (follows from E25; no Microsoft statement found) | — |
| E28 | Windows stateful DHCPv6 /128: site match without LIS subnet match; fixes are IPv4 subnet, switch or BSSID entries; Locations and Networks report shows matches | Same | verified | c10-dynamic, c10-loc-report |
| E29 | Remote-location experience: Teams desktop Windows and Mac; mobile automatic only; Teams phones unsupported | Same | verified | c10-remote-loc |
| E30 | Location consent prompt not shown where OS location setting is managed; Windows only, macOS not fully controllable | Same | verified | c10-consent |
| E31 | Location data owners: facilities, address management, wireless controllers, NAC inventory | Same | restated-as-design | — |

### Carry-forward ledger for this addition

| Source | Went to | Or why not carried |
|---|---|---|
| Assessment notes for this addition (session notes, not published) | This section | Law and Teams configuration detail already in Book 15 Ch05 linked, not repeated; Direct Routing PIDF-LO and ERSP setup, 933 testing and government-cloud table left in Book 15 |
| 47 CFR 9.11 (interconnected VoIP) | Not carried | Binds the carriers, not the agency; out of scope for an identity chapter |
| Front matter description and "In this chapter" callout | Same | edited to name the new section |

## Correction, October 30, 2026: the userType guard on two rule patterns

The "Organization and worker type" and "Exclusion" rows of the rule pattern table had the `accountEnabled` guard but not `user.userType -eq "Member"`, unlike the other three rows. Both now carry it. The validation kit's VK-DG-01 flags any user rule that lacks either guard, so a rule copied from those two rows would have failed the kit. Found while writing the developer workbook *Building the Attribute-Driven Migration* (under Projects); logged in `docs/project-plans/developer-workbooks/attribute-driven-migration/_verification/research-gaps.md`, gap 4.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Members-only rule form: `(user.objectId -ne null) -and (user.userType -eq "Member")` excludes guests; `userType` takes `member`, `guest` or `null` | Rule pattern table, rows "Organization and worker type" and "Exclusion" | corrected | Microsoft Learn, "Manage rules for dynamic membership groups in Microsoft Entra ID," <https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership> (accessed Oct 30, 2026) |
| 2 | The Exclusion row's `-ne "CTR"` also matches a blank worker type | Exclusion row | not changed: noted for the owner's decision | Rule semantics; Learn page above (null checks) |

## Correction, October 30, 2026 (later): the userType guard on the Legal employer pattern

The "Legal employer" row had the `accountEnabled` guard but not `user.userType -eq "Member"`, so a guest whose `companyName` matched would have qualified. It now carries the guard, approved by the owner. Found by the rule linter in the developer workbook *Building the Attribute-Driven Migration* (Chapter 04, rule DR-04, under Projects); logged in `docs/project-plans/developer-workbooks/attribute-driven-migration/_verification/research-gaps.md`, gap 8. The row still reads `companyName`, which the validation kit's VK-DG-02 and the linter's DR-05 flag as a display-name attribute; that is left for the owner, since the row exists to show the legal-employer case.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 3 | Guests are excluded with `user.userType -eq "Member"` | Rule pattern table, row "Legal employer" | corrected | Microsoft Learn, "Manage rules for dynamic membership groups in Microsoft Entra ID," <https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership> (accessed Oct 30, 2026) |

## Correction, October 30, 2026 (later): an empty worker type no longer passes the Exclusion pattern

The "Exclusion" row's `(user.extensionAttribute11 -ne "CTR")` also matched a person whose worker-type slot was empty. The owner decided that a person with an empty worker type must not qualify, so the row now ends `-and (user.extensionAttribute11 -ne null)`. Learn's rules page says to compare with `null`, unquoted, to test for a null value. This settles claim 2 above. Found by the rule linter in the developer workbook *Building the Attribute-Driven Migration* (Chapter 04, rule DR-10, under Projects); logged in `docs/project-plans/developer-workbooks/attribute-driven-migration/_verification/research-gaps.md`, gap 9.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 4 | A null check is written `-ne null`, without quotes; an `-ne "CTR"` comparison alone admits an empty value | Rule pattern table, row "Exclusion" | corrected (owner's decision, October 30, 2026) | Microsoft Learn, "Manage rules for dynamic membership groups in Microsoft Entra ID," <https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership> (accessed Oct 30, 2026) |