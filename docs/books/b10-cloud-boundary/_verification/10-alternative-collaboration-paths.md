# Verification — Chapter 10, Alternative Collaboration Paths

Checked October 21, 2026 by writer W5. Source: `docs/case-studies/google-workspace-collaboration-path.md` (1,080 words). Marketplace status read from `https://www.fedramp.gov/marketplace/products.json` (`last_change` 2026-10-21T05:02:15Z). Microsoft claims checked with the Microsoft Learn MCP tools; Google, GSA and press sources fetched directly.

**Framing.** The source presents the department move as "a real federal example." It is real public record, not a program engagement, so the chapter keeps it as a public example, says so explicitly, and attributes every figure. Per the workbook rule against naming an agency as the subject, the prose says "a cabinet-level department"; the footnote titles necessarily name it (Transportation). The editor may prefer to keep or drop those titles.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | FedRAMP 2026: Classes A–D; agency authorizes its own system; "should never create a standalone authorization to operate for a cloud service offering" | Read the certification | verified | FedRAMP, Using a FedRAMP Certified Cloud Service |
| 2 | Agency accepts risk for configuration, integrations and controls it operates; configure identity, logging, monitoring, data protection | What the boundary still asks | verified (new) | Same |
| 3 | M365 GCC MSO365MT Certified Class C (Moderate); MSO365MTA In Process Class D | Marketplace table | verified | products.json |
| 4 | "Google Workspace and Gemini are FedRAMP High authorized" (source) | Marketplace table; cautions | corrected | Workspace F1206081364 is Class D/High. Gemini for Government FR2604952026 is listed Class B, impact level "Low", certified Jan 21, 2026. Google's own claim (Workspace, Gemini in Workspace apps, Gemini app at High) kept as an attributed vendor statement; Google's scope page lists the Gemini app and Workspace with Gemini among Workspace services |
| 5 | Zoom for Government, Webex for Government, Slack Class C; GovSlack, Box Class D | Marketplace table | verified (new examples) | products.json |
| 6 | Workspace listing: asterisked services don't meet SA-9(5) | Cautions; boundary asks | verified (new) | products.json `service_description` |
| 7 | "Assured Controls Plus used" | Public example table | verified (restated) | Google blog: Enterprise Plus with Assured Controls Plus "for 100% U.S.-based support" (vendor statement) |
| 8 | "First cabinet-level agency to move its suite" | (source Case Summary) | restated | Vendor claim only (Google blog); chapter calls it a cabinet-level department without asserting "first" |
| 9 | ~50,000+ employees | Public example table | verified | Nextgov Dec 29, 2025; Google blog |
| 10 | Five-year agreement, ceiling up to $89M, via Carahsoft | Public example | verified | Nextgov Oct 29, 2025 (award Sept 27, Carahsoft prime). Chapter says "a reseller as prime contractor" |
| 11 | "via GSA OneGov" | Public example | corrected | The award ran under GSA's April 10, 2025 Google agreement, which GSA later folded into OneGov (GSA April 10 and Aug 21, 2025 releases) |
| 12 | "temporary ~71% discount" | Public example | verified | GSA April 10, 2025: "temporary price reduction of 71%", temporary pricing expires Sept 30, 2025 |
| 13 | Initial deployment in ~22–30 days | Public example table | verified | Google: 22 days; Nextgov: initial users within 30 days, AI tools within 60 |
| 14 | Coexistence period | Public example table | verified | Nextgov Dec 29, 2025 |
| 15 | Status October 2026 (Gmail migration done for department staff; component pending; 50,000+ with Gemini/NotebookLM) | Public example table | verified (new) | Nextgov Oct 16, 2026 |
| 16 | "AI features cited as a differentiator" | (source) | restated | Folded into "when the path fits"; deputy CIO quote is about the discount |
| 17 | "Move was framed as collaboration-suite modernization, not identity replacement" | Public example | removed / restated-as-design | No source describes identity integration (Nextgov, Google). Chapter says so and presents the identity patterns as program design |
| 18 | "Agency has described a broader multi-cloud posture" | (source) | removed | Not found in the sources opened (Nextgov Dec 2025 explicitly has no multi-cloud statement) |
| 19 | "Microsoft 365 remains the majority platform"; Google cites GSA, DOE, AFRL | (source Considerations) | removed | Not verified; Marketplace authorization counts would be a proxy at best and weren't used |
| 20 | Entra provisioning creates/updates/disables users and groups; scoping by assignment or filter | Pattern 1 | verified (new detail) | Learn, Google Workspace provisioning tutorial |
| 21 | Custom domain required; primaryEmail only matching attribute; OrgUnitPath, suspended, manager mappings; group attributes; personal-account conflicts and transfer tool | Pattern 1 | verified (new) | Same |
| 22 | SAML SSO via Google third-party SSO profile; email mapped as identifier | Pattern 1 | verified (new) | Learn, Google Cloud / G Suite Connector SSO tutorial |
| 23 | Conditional Access can target any Entra-integrated app (gallery, non-gallery) | Pattern 1 | verified | Learn, Conditional Access: Target resources |
| 24 | CA applies at federated sign-in; in-session control is Google's | Pattern 1 | restated-as-design | Program reading of #23 |
| 25 | "Google Workspace brings its own directory (Cloud Identity)" | Gaps | corrected (wording) | Restated as Google's own directory of users, groups and OUs; Cloud Identity is a separate Google product name |
| 26 | SSO profiles assigned to OUs or groups, not per user | Gaps | verified (new) | Google, Setting up SSO |
| 27 | Super admin SSO only with legacy profile, some cases; admin console sign-in uses Google password; 2SV recommended at IdP and Google | Gaps | verified (new) | Google, Super administrator SSO |
| 28 | Two identity patterns; derived directory; drift; "when it fits / doesn't"; next steps | Patterns; When; Decision record | restated-as-design | Program design (source) |
| 29 | Client-side encryption, data regions need agency validation | Boundary asks | restated-as-design | Kept as an instruction, no product claim |
| 30 | Review fix 2, Oct 21, 2026 (revision-history trim): removed "The earlier version of this page said the move 'was framed as a collaboration-suite modernization, not a full identity platform replacement'; that framing isn't in the public record" | A public example | wording-only | Body keeps the plain statement that the identity patterns are the program's design. No new claim. |
| 31 | Review fix 2, Oct 21, 2026 (agency-agnostic check): body text of the case study | A public example | checked, no change needed | Body already says "a cabinet-level department"; the department names appear only in footnote titles and URLs, which keep their publishers. index.md, Appendix A, Appendix B and the Book 10 SVG sources contain no agency names. The General Services Administration is named once as the issuer of the government-wide schedule agreement, not as a case subject; flagged to the editor. |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Purpose | The third answer (opening); identity/collaboration separation | "Real federal example" reframed as public record, not engagement |
| Framing (table; Cloud Identity note) | Layer table; Gaps ("A second directory that drifts") | Cloud Identity wording corrected (#25) |
| Case Summary table | A public example (table + prose) | Each row verified or corrected (#8–#15); "first" not asserted; OneGov vehicle corrected |
| Key observations | A public example; "Three things the record doesn't say" | Identity framing and multi-cloud statement removed as unsupported (#17, #18) |
| Technical Patterns 1 and 2 | Keep the identity plane where it is (Pattern 1, Pattern 2) | Expanded with verified provisioning/SSO behavior |
| Alignment with Workbook Principles | Folded into the layer table, Pattern sections and the drift gap | Five-principle list not repeated verbatim; each principle appears where it applies |
| Considerations: Dominance | — | Removed (#19), unverified |
| Considerations: Utilization risk | — | Not carried |
| Considerations: Identity surface | Gaps ("What the identity plane carries today") | |
| Considerations: Procurement window | A public example (discount, renewal years) | Verified with GSA (#12) |
| Considerations: Data and compliance | What the boundary still asks of you | Expanded with SA-9(5) and logging |
| When This Path May Be Worth Evaluating | When the path fits | "AI features" bullet sharpened: features must be inside the certification |
| When It Is Probably Not the Right Path | When the path fits ("probably the wrong path") | |
| Suggested Next Steps | The decision record (six steps) | Steps re-ordered and given evidence content |
| Sources line | Footnotes | Replaced by specific dated sources |
| Pattern-reference disclaimer | Marketplace table note ("examples, not recommendations") and public-example framing | |

## Source watch, November 9, 2026

Re-checked after the weekly source watch (issue #499) reported a change in a cited source. Checked November 9, 2026; no personal data sent to any site.

| Finding | Change |
|---|---|
| FedRAMP Marketplace `products.json` re-read Nov 9, 2026 (`last_change` 2026-11-09T05:06Z, 791 listings): `impact_level` reads "Unknown" and `impact_level_number` 0 on every listing; `cert_date` and `fedramp_msg` are empty on every listing; statuses and classes of the listings cited here are unchanged; the Google Workspace description still carries the SA-9(5) note | Gemini for Government impact level dated October 21, 2026; footnote [^c10-marketplace] records the re-read and that the table's impact levels are the October 21 values |
