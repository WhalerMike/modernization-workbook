# Verification — Chapter 04, Identity Transformation

Sources: the series chapter itself (`04-identity-transformation.md`, upgraded in place); `docs/whitepapers/modernization-journey.md` Principle 1 (single source of truth), Principle 3 (session to token), and "Mainframe Access Modernization"; cross-checked against Book 02 Ch 05, 09, 10, Appendix C and Book 03 Ch 05, 06, 08, 10. The earlier copies `01-platform-foundation.md` and `02-legacy-ingestion.md` have no identity-transformation sections beyond what Chapters 03 and 10 carry. All sources accessed Oct 21, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Entra ID has no OUs; directory is flat | Identity claim | verified | Book 02 Ch 05 (Administrative units overview) |
| 2 | M-22-09: centralized identity management, enterprise-managed identities, consolidate identity systems | Why the attributes must be true | verified | M-22-09 PDF, "Identity" |
| 3 | SP 800-207 separates PE/PA from PEP; ID management system is an input | Why the attributes must be true | verified | SP 800-207 §3.1 |
| 4 | Whitepaper: FICAM Architecture and SP 800-63 "require every governed object carry a complete set of attributes from authoritative sources"; Evidence Act and Federal Data Strategy "mandate" a single system of record per data type | Why the attributes must be true | removed | Overstated; not found as requirements. Single source of truth kept as program principle |
| 5 | Rule-readable properties include department, jobTitle, employeeId, extensionAttribute1–15, directory extensions; employeeType, employeeOrgData, manager are not | Where the attributes live | verified | groups-dynamic-membership (supported properties; extension attributes); Q&A confirms employeeOrgData not usable |
| 6 | Series examples used extensionAttribute2/3 for department/division | Where the attributes live, rules | corrected | Book 03 Ch 06 assigns extensionAttribute2/3 to hire/term dates and extensionAttribute10–12 to access codes; examples realigned (note: Book 02 Appendix C uses a different numbering — flagged to editor) |
| 7 | extensionAttribute1–15: read-only in Entra for synced users; settable for cloud-only | Where the attributes live | verified | Graph onPremisesExtensionAttributes |
| 8 | API-driven and HR-driven inbound provisioning available with P1+; P1 license per provisioned user | Where the attributes live | verified (added) | ID Governance licensing fundamentals; Plan cloud HR provisioning (Licensing) |
| 9 | Microsoft warns that dynamic-rule security depends on attribute write permissions, incl. self-writable synced AD attributes | Protect the write path | verified (added) | groups-dynamic-membership, security consideration |
| 10 | Group-based licensing assigns on join, removes on leave | What the attributes drive | verified | directory-overview-user-model |
| 11 | Dynamic membership needs P1 per unique member | Dynamic groups | verified | groups-dynamic-membership, license requirements |
| 12 | `-and/-or/-not`; operators with or without hyphen; `-in` with bracketed list | Two query patterns | verified | groups-dynamic-membership |
| 13 | Series rule syntax used bare `and` | Two query patterns | corrected | Rewritten with `-and` (both accepted for comparison operators; documented logical operators are hyphenated) |
| 14 | Minimize `-contains`/`-match` for performance | Two query patterns | verified (added) | groups-dynamic-rule-more-efficient |
| 15 | Processing usually within a few hours, can exceed 24 hours | Dynamic groups; Joiner; Mover | verified (added; replaces "within platform cadence" and "no drift window") | manage-dynamic-group |
| 16 | AUs contain users, groups, devices; scoped role applies to members | Administrative units | verified | administrative-units |
| 17 | AUs can't be nested | Administrative units | verified (added) | administrative-units, Constraints |
| 18 | AUs scope management, not visibility | Administrative units | verified (added) | administrative-units, supported scenarios |
| 19 | Unit-scopable roles include User/Groups/Helpdesk/Password/Authentication Admin; Global Reader, Security Reader are not | Administrative units; three-tier table | verified | manage-roles-portal (AU scope list) |
| 20 | Series: Tier 1 AU-ORG-Enterprise assigned Global Reader, Security Reader | Three-tier table | corrected | Reader roles can't be AU-scoped; assigned at tenant scope (matches Book 02 Ch 05) |
| 21 | Dynamic AUs: one object type; P1 per unique member; global Azure cloud only | Three-tier model | verified | admin-units-members-dynamic, Prerequisites |
| 22 | GCC pairs with Entra ID in global Azure; GCC High/DoD with Azure Government | Three-tier model | verified (added) | Cloud feature availability for US Government customers |
| 23 | RMAU: only AU-scoped admins can modify members' Entra properties | Restricted management | verified | admin-units-restricted-management |
| 24 | GA/PRA can still manage RMAU membership and self-assign scoped roles; audited | Restricted management | verified (added) | admin-units-restricted-management |
| 25 | RMAU members can't be managed by PIM, entitlement mgmt, lifecycle workflows, access reviews; setting fixed at creation; max 100 | Restricted management | verified (added) | admin-units-restricted-management, Limitations |
| 26 | Series: dynamic membership + restricted management "together preserve the property that OU ACLs provided" | Restricted management | corrected | Overstated; per-unit decision with default no (consistent with Book 02 Ch 05) |
| 27 | AU-scoped password resets only for non-admin users | Role assignments | verified (added) | manage-roles-portal |
| 28 | Role-assignable groups: assigned membership only, no nesting, set at creation, max 500 per tenant | Role assignments | verified | groups-concept; groups-create-eligible |
| 29 | PIM for Groups eligible members need P2 or ID Governance license | Role assignments | verified (refines "P2 or ID Governance" in series) | groups-assign-member-owner |
| 30 | CA can target any group type incl. dynamic; nested members included | Conditional Access | verified | concept-conditional-access-users-groups |
| 31 | CA role targeting doesn't cover AU-scoped roles | Conditional Access | verified (added) | concept-conditional-access-users-groups |
| 32 | Built-in Phishing-resistant MFA strength: WHfB/platform credential, FIDO2, Entra CBA (multifactor) | Conditional Access | verified | concept-authentication-strengths |
| 33 | Smart lockout always on; customization needs P1; hybrid PHS/PTA threshold below AD | Conditional Access | verified (expanded) | howto-password-smart-lockout |
| 34 | KDC runs on every DC; client gets TGT and service tickets; service validates ticket without contacting DC per connection | From sessions to tokens | verified | Kerberos authentication overview in Windows Server |
| 35 | Whitepaper: token server "doesn't need to call back to a domain controller", implying Kerberos servers do | From sessions to tokens | corrected | Kerberos services also validate tickets locally; the dependency is the client's path to the KDC |
| 36 | Entra tokens validated by signature, issuer, audience against published keys (jwks_uri) | From sessions to tokens | verified | access-tokens, Validate tokens |
| 37 | M-22-09: phishing-resistant MFA required for staff, contractors, partners; option for public | From sessions to tokens | verified | M-22-09 PDF |
| 38 | BOD 25-01 (Dec 17, 2024) requires SCuBA baselines, tools, remediation | From sessions to tokens | verified | cisa.gov BOD 25-01 |
| 39 | Required Entra policies MS.AAD.1.1v1 legacy auth blocked; MS.AAD.3.1v1 phishing-resistant MFA for all users | From sessions to tokens | verified (refines whitepaper "modern authentication throughout") | BOD 25-01 Required Configurations page |
| 40 | Whitepaper: ZTMM v2.0 Identity at Advanced/Optimal "requires CBA as the primary mechanism" | From sessions to tokens | corrected | ZTMM v2.0 Table 2: phishing-resistant MFA at Advanced; continuous validation at Optimal |
| 41 | Whitepaper: NTLM "opaque to telemetry, invisible to audit logs" | From sessions to tokens | corrected | NTLM auditing exists; all NTLM deprecated (June 2024), NTLMv1 removed in WS2025/Win11 24H2; use Negotiate |
| 42 | z/OS Connect supports JWT third-party authentication and maps a distributed identity claim to a SAF user ID via RACMAP/IDIDMAP | Mainframe boundary | verified | IBM z/OS Connect 3.0 docs (security overview; mapping page) |
| 43 | Distributed identity filters let SMF record both RACF and distributed identities | Mainframe boundary | verified | IBM RACF Security Administrator's Guide, overview of distributed identity filters |
| 44 | PassTicket: one-time, within 10 minutes, validated with shared Secure Signon keys; avoids stored/transmitted passwords | Mainframe boundary | verified | IBM CICS TS 5.4, Generating and using PassTickets |
| 45 | Whitepaper: z/OS Connect has validated OAuth/OIDC "since the mid-2010s"; PassTicket "dates to the 1990s"; banks adopted under PSD2 | Mainframe boundary | removed | Not verified; history claims omitted with a note |
| 46 | CICS/IMS don't natively understand OAuth; pseudo-conversational refactoring; treat as by-product of interface consolidation | Mainframe boundary | restated-as-design | Program reasoning from whitepaper |
| 47 | HR-to-cloud provisioning populates standard attributes | Joiner | verified | plan-cloud-hr-provision |
| 48 | Lifecycle Workflows require ID Governance or Entra Suite | Leaver | corrected (series said ID Governance only) | what-are-lifecycle-workflows |
| 49 | Processing-paused drift category | Drift categories | verified (added) | Book 02 Ch 05 (Update-MgDirectoryAdministrativeUnit); manage-dynamic-group (pause/resume) |
| 50 | Naming convention, two patterns, drift categories, migration phases, verification list | Throughout | restated-as-design | Program design |
| 51 | Review fix, Oct 21, 2026: "Federal policy requires the move" | From sessions to tokens | corrected (wording-only) | Over-reached: the cited documents (M-22-09, BOD 25-01, ZTMM) require phishing-resistant MFA and secure configuration, not a move from Kerberos sessions to tokens as such. Now "requires what the move delivers rather than the move itself." No new factual claim. |
| 52 | Review fix, Oct 21, 2026: removed the aside "(The whitepaper said the model requires certificate-based authentication as the primary mechanism...)" | From sessions to tokens | restated, footnoted | Replaced by a plain statement that CBA is one way to meet the phishing-resistant bar. Opened and confirmed: Microsoft Learn, "Overview of Conditional Access authentication strengths," built-in Phishing-resistant MFA strength lists Windows Hello for Business or platform credential, FIDO2 security key, and certificate-based authentication (multifactor), <https://learn.microsoft.com/entra/identity/authentication/concept-authentication-strengths> (existing note [^c04-authstrength]). |
| 53 | Review fix, Oct 21, 2026: removed the aside "(The whitepaper said NTLM is invisible to audit logs...)" | From sessions to tokens | restated, footnoted | Kept the correct statement (Windows can audit NTLM use) as a plain sentence and attached [^c04-ntlm]. Opened and confirmed: Microsoft Learn, "Resources for deprecated features in the Windows client," NTLM section, customers "are encouraged to utilize NTLM auditing to investigate how NTLM is being used," <https://learn.microsoft.com/windows/whats-new/deprecated-features-resources>. |
| 54 | Review fix 2, Oct 21, 2026 (revision-history trim): "Earlier versions of this chapter put department and division in extensionAttribute2 and extensionAttribute3..." | Where the attributes live | wording-only | Now an instruction: Book 03 reserves those two for hire and termination dates, so don't use them for department or division (see #6). No new claim. |
| 55 | Review fix 2, Oct 21, 2026 (revision-history trim): "Earlier versions of this chapter assigned the Tier 1 reader roles at the enterprise unit" | Three-tier model | wording-only | Now "Assign the Tier 1 reader roles at tenant scope"; existing [^c04-au-roles] (see #19-20). No new claim. |
| 56 | Review fix 2, Oct 21, 2026 (revision-history trim): "Earlier versions said the two controls together preserve what OU access-control lists provided; that overstated restriction" | Restricted management | wording-only | Now "Dynamic membership and restriction together don't recreate what OU access-control lists provided", the program's reading of the limits cited in [^c04-rmau] (see #26). No new claim. |
| 57 | Review fix 3, Oct 21, 2026 (revision-history trim): removed "(The whitepaper also dated these capabilities and described commercial banks' adoption under open-banking mandates; those history claims weren't verified and are omitted.)" | At the mainframe boundary | wording-only | The omission stands; the note about it lives here now. No claim added. |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Series ch. — H1 "Chapter 04 — Identity: Hierarchical Directory → Flat Cloud Identity…", bold subtitle | H1 "Chapter 04 — Identity Transformation", italic thesis, callout | Retitled per brief |
| Series ch. — Dependency chain | Dependency chain (kept) | — |
| Series ch. — The identity claim (+ `cshc/identity-transformation.svg`) | The identity claim + `ch04-one-attribute-five-outcomes.flow.yaml` | Old SVG replaced; diagram now shows the five outcomes and HR source |
| Series ch. — The four mechanisms | The four mechanisms | — |
| Series ch. — Organizational attributes: where they live / what they drive | Organizational attributes (+ new "Protect the write path") | Carriers realigned with Book 03 (claim 6) |
| Series ch. — Dynamic groups: two patterns, naming convention | Dynamic groups | Rules rewritten (claims 6, 13); processing window added |
| Series ch. — Administrative units: three-tier model, restricted management, role assignments | Administrative units (same subsections) | Tier 1 corrected; RMAU nuance; links to Book 02 Ch 05 |
| Series ch. — Conditional Access | Conditional Access | AU-scoped role caveat added; authentication strength sourced |
| Series ch. — HR-driven lifecycle (joiner/mover/leaver; enumerated workflows) | HR-driven lifecycle | "No drift window" replaced by processing window; links to Book 03 |
| Series ch. — Drift categories | Drift categories | Processing-drift row added |
| Series ch. — Migration phases 0–5 | Migration phases | "Chapter 02's assessment" → Chapter 10; links to Ch 12 and Book 02 Ch 10 |
| Series ch. — Verification | Verification | Paused-processing check added |
| Series ch. — Key takeaways | Key takeaways | Reworded to include attributes-first and token point |
| Series ch. — Previous/Next | Continue the book callout | Reading order 03 ← 04 → 05 |
| Whitepaper — Principle 1, Restore a Single Source of Truth | Why the attributes must be true first | Agency-specific framing (twelve regional silos, state benefit calculations) generalized; requirement overclaims removed (claim 4) |
| Whitepaper — Figure 10 (rId75.png) | `ch04-one-attribute-five-outcomes` | Word extract not reused |
| Whitepaper — Principle 3, Session to Token (incl. BOD 25-01, M-22-09, ZTMM, NTLM, "tokens only work if…" callout) | From sessions to tokens | Corrections 35, 39–41 |
| Whitepaper — Figure 11 (rId81.png) | `ch04-session-vs-token.flow.yaml` | Word extract not reused |
| Whitepaper — Act 2 Kerberos ticket lifetimes, caddr, DC-dependent operations; physics box | — | Owned by Chapter 01 (W1, "The Session Problem"); Chapter 04 links Chapter 01 |
| Whitepaper — Mainframe Access Modernization: current state, gateway bridge, what doesn't change, recommendation | From sessions to tokens › At the mainframe boundary | Mechanisms verified (42–44); unverified history removed (45); Principle 5 cross-reference rephrased without linking the archived whitepaper |
| Whitepaper — Figure 14 (rId106.png) | — | Not redrawn; the three-bullet mechanism list carries it (diagram budget used on Figures 10 and 11) |
| Whitepaper — Principle 2, Principle 5, FedRAMP 20x, network physics, framework alignment, call to action | — | Not identity/platform; owned by W3/W4/W5 chapters |
| Earlier copy 01 / 02 | — | No identity-transformation content beyond Chapters 03 and 10 (see those ledgers) |

## Change log

| Date | Change |
|---|---|
| 2026-10-21 | Extension attribute reconciliation: region-scoped group example now names its carrier, `extensionAttribute4`, and links the program attribute map in Book 03 Ch 06. Existing `extensionAttribute10`/`12` rules already matched. |

## Revision 2026-10-29 — four tracks and companion-guide alignment

Added *Four populations, four tracks* (table, mechanism scope, Group Policy split) and *Where this ends* under *The four mechanisms*, and one paragraph at the end of *Where the attributes live* linking the guide's #attributes and Book 03 Ch 06 #the-attribute-stores. No new Microsoft facts and no new footnotes.

| # | Claim | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Four tracks, sources of truth, where each is covered | Four populations, four tracks | restated-as-design (shared FRAMING.md); links Books 02, 03, 05, 06, 17 | — |
| 2 | Dynamic groups hold users or devices | Four populations | carried (Book 02 Ch 09; guide's limits section); Learn re-check Oct 29: "Only users and devices can be members of a dynamic group" | learn.microsoft.com/graph/api/resources/groups-overview |
| 3 | Group Policy split: user settings with people, computer settings with devices and servers | Four populations | restated-as-design; links Chapter 05 | — |
| 4 | End-state goal | Where this ends | restated-as-design; links guide #what-this-migration-accomplishes | — |
| 5 | AC-2 for people; CM-8, CM-2, CM-6 for devices and servers | Where this ends | carried; links Appendix A #requirements-mapping (aA-53, Oct 21) — no new footnote | Appendix A |
| 6 | Stores: native, extensionAttribute1–15, directory extensions, custom security attributes, device properties; rules read only some | Where the attributes live | carried from Book 03 Ch 06 (verified Oct 29, see that log) | — |
