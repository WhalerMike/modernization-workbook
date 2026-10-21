# Verification — Chapter 10, Alternative Collaboration Paths

Checked October 21, 2026 by writer W5. Source: `docs/case-studies/google-workspace-collaboration-path.md` (1,080 words). Marketplace status read from `https://www.fedramp.gov/marketplace/products.json` (`last_change` 2026-10-21T05:02:15Z). Microsoft claims checked with the Microsoft Learn MCP tools; Google, GSA, press and Army sources fetched directly (army.mil didn't resolve from this network; its content came from search-result summaries and is labeled as such in the footnote).

**Framing.** The source presents the department move as "a real federal example." It is real public record, not a program engagement, so the chapter keeps it as a public example, says so explicitly, and attributes every figure. Per the workbook rule against naming an agency as the subject, the prose says "a cabinet-level department" and "a military department"; the footnote titles necessarily name them (Transportation, Army). The editor may prefer to keep or drop those titles.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | FedRAMP 2026: Classes A–D; agency authorizes its own system; "should never create a standalone authorization to operate for a cloud service offering" | Read the certification | verified | FedRAMP, Using a FedRAMP Certified Cloud Service |
| 2 | Agency accepts risk for configuration, integrations and controls it operates; configure identity, logging, monitoring, data protection | What the boundary still asks | verified (new) | Same |
| 3 | M365 GCC MSO365MT Certified Class C (Moderate); MSO365MTA In Process Class D | Marketplace table | verified | products.json |
| 4 | M365 GCC High FR1824057433 Certified Class D | Marketplace table | verified (new) | products.json |
| 5 | "Google Workspace and Gemini are FedRAMP High authorized" (source) | Marketplace table; cautions | corrected | Workspace F1206081364 is Class D/High. Gemini for Government FR2604952026 is listed Class B, impact level "Low", certified Jan 21, 2026. Google's own claim (Workspace, Gemini in Workspace apps, Gemini app at High) kept as an attributed vendor statement; Google's scope page lists the Gemini app and Workspace with Gemini among Workspace services |
| 6 | Zoom for Government, Webex for Government, Slack Class C; GovSlack, Box Class D | Marketplace table | verified (new examples) | products.json |
| 7 | Workspace listing: asterisked services don't meet SA-9(5) | Cautions; boundary asks | verified (new) | products.json `service_description` |
| 8 | FedRAMP High/IL4 configuration requires Enterprise Plus (or named editions); not every service in them authorized; Vault in scope | Cautions; boundary asks | verified (new) | Google Cloud, FedRAMP and DoD compliance scope |
| 9 | "Assured Controls Plus used" | Public example table | verified (restated) | Google blog: Enterprise Plus with Assured Controls Plus "for 100% U.S.-based support" (vendor statement) |
| 10 | "First cabinet-level agency to move its suite" | (source Case Summary) | restated | Vendor claim only (Google blog); chapter calls it a cabinet-level department without asserting "first" |
| 11 | ~50,000+ employees | Public example table | verified | Nextgov Dec 29, 2025; Google blog |
| 12 | Five-year agreement, ceiling up to $89M, via Carahsoft | Public example | verified | Nextgov Oct 29, 2025 (award Sept 27, Carahsoft prime). Chapter says "a reseller as prime contractor" |
| 13 | "via GSA OneGov" | Public example | corrected | The award ran under GSA's April 10, 2025 Google agreement, which GSA later folded into OneGov (GSA April 10 and Aug 21, 2025 releases) |
| 14 | "temporary ~71% discount" | Public example | verified | GSA April 10, 2025: "temporary price reduction of 71%", temporary pricing expires Sept 30, 2025 |
| 15 | Initial deployment in ~22–30 days | Public example table | verified | Google: 22 days; Nextgov: initial users within 30 days, AI tools within 60 |
| 16 | Coexistence period | Public example table | verified | Nextgov Dec 29, 2025 |
| 17 | Status October 2026 (Gmail migration done for department staff; component pending; 50,000+ with Gemini/NotebookLM) | Public example table | verified (new) | Nextgov Oct 16, 2026 |
| 18 | "AI features cited as a differentiator" | (source) | restated | Folded into "when the path fits"; deputy CIO quote is about the discount |
| 19 | "Move was framed as collaboration-suite modernization, not identity replacement" | Public example | removed / restated-as-design | No source describes identity integration (Nextgov, Google). Chapter says so and presents the identity patterns as program design |
| 20 | "Agency has described a broader multi-cloud posture" | (source) | removed | Not found in the sources opened (Nextgov Dec 2025 explicitly has no multi-cloud statement) |
| 21 | Army ran a large pilot, sunset after low utilization, consolidated on Army 365 | Counter-example | verified | Stars and Stripes Feb 28, 2025: ~150,000 licenses, ~16% used, decommissioned Feb 28, 2025, moved to Army 365 |
| 22 | Gmail data kept for National Archives and eDiscovery | Boundary asks | verified (search summary) | army.mil article (search-result summary; page didn't load) |
| 23 | "Microsoft 365 remains the majority platform"; Google cites GSA, DOE, AFRL | (source Considerations) | removed | Not verified; Marketplace authorization counts would be a proxy at best and weren't used |
| 24 | Entra provisioning creates/updates/disables users and groups; scoping by assignment or filter | Pattern 1 | verified (new detail) | Learn, Google Workspace provisioning tutorial |
| 25 | Custom domain required; primaryEmail only matching attribute; OrgUnitPath, suspended, manager mappings; group attributes; personal-account conflicts and transfer tool | Pattern 1 | verified (new) | Same |
| 26 | SAML SSO via Google third-party SSO profile; email mapped as identifier | Pattern 1 | verified (new) | Learn, Google Cloud / G Suite Connector SSO tutorial |
| 27 | Conditional Access can target any Entra-integrated app (gallery, non-gallery) | Pattern 1 | verified | Learn, Conditional Access: Target resources |
| 28 | CA applies at federated sign-in; in-session control is Google's | Pattern 1 | restated-as-design | Program reading of #27 |
| 29 | "Google Workspace brings its own directory (Cloud Identity)" | Gaps | corrected (wording) | Restated as Google's own directory of users, groups and OUs; Cloud Identity is a separate Google product name |
| 30 | SSO profiles assigned to OUs or groups, not per user | Gaps | verified (new) | Google, Setting up SSO |
| 31 | Super admin SSO only with legacy profile, some cases; admin console sign-in uses Google password; 2SV recommended at IdP and Google | Gaps | verified (new) | Google, Super administrator SSO |
| 32 | Two identity patterns; derived directory; drift; "when it fits / doesn't"; next steps | Patterns; When; Decision record | restated-as-design | Program design (source) |
| 33 | Client-side encryption, data regions need agency validation | Boundary asks | restated-as-design | Kept as an instruction, no product claim |
| 34 | Review fix, Oct 21, 2026: re-verified the retention of Gmail data "for National Archives and electronic discovery purposes" | Retention, eDiscovery and records; [^c10-army] | verified (source re-read) | army.mil doesn't resolve from this network (DNS failure on Oct 21, 2026), so the earlier note rested on a search summary. Opened the Internet Archive capture of Nov 15, 2025, <https://web.archive.org/web/20251115181302/https://www.army.mil/article/283432/army_to_sunset_army_google_workspace_accounts>: Jonathan Austin, Army News Service, Feb 28, 2025, quoting the G-6 that individual Gmail data "will be retained for National Archives and electronic discovery purposes." Footnote rewritten with author, date and the capture URL. |
| 35 | Review fix 2, Oct 21, 2026 (revision-history trim): removed "The earlier version of this page said the move 'was framed as a collaboration-suite modernization, not a full identity platform replacement'; that framing isn't in the public record" | A public example | wording-only | Body keeps the plain statement that the identity patterns are the program's design. No new claim. |
| 36 | Review fix 2, Oct 21, 2026 (agency-agnostic check): body text of the case study and counter-example | A public example; A counter-example; Retention bullet | checked, no change needed | Body already says "a cabinet-level department" and "a military department"; the department and service names appear only in footnote titles and URLs, which keep their publishers. index.md, Appendix A, Appendix B and the Book 10 SVG sources contain no agency names. The General Services Administration is named once as the issuer of the government-wide schedule agreement, not as a case subject; flagged to the editor. |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Purpose | The third answer (opening); identity/collaboration separation | "Real federal example" reframed as public record, not engagement |
| Framing (table; Cloud Identity note) | Layer table; Gaps ("A second directory that drifts") | Cloud Identity wording corrected (#29) |
| Case Summary table | A public example (table + prose) | Each row verified or corrected (#10–#17); "first" not asserted; OneGov vehicle corrected |
| Key observations | A public example; "Three things the record doesn't say" | Identity framing and multi-cloud statement removed as unsupported (#19, #20) |
| Technical Patterns 1 and 2 | Keep the identity plane where it is (Pattern 1, Pattern 2) | Expanded with verified provisioning/SSO behavior |
| Alignment with Workbook Principles | Folded into the layer table, Pattern sections and the drift gap | Five-principle list not repeated verbatim; each principle appears where it applies |
| Considerations: Dominance | — | Removed (#23), unverified |
| Considerations: Utilization risk | A counter-example | Verified (#21) |
| Considerations: Identity surface | Gaps ("What the identity plane carries today") | |
| Considerations: Procurement window | A public example (discount, renewal years) | Verified with GSA (#14) |
| Considerations: Data and compliance | What the boundary still asks of you | Expanded with SA-9(5), editions, Vault, logging |
| When This Path May Be Worth Evaluating | When the path fits | "AI features" bullet sharpened: features must be inside the certification |
| When It Is Probably Not the Right Path | When the path fits ("probably the wrong path") | |
| Suggested Next Steps | The decision record (six steps) | Steps re-ordered and given evidence content |
| Sources line | Footnotes | Replaced by specific dated sources |
| Pattern-reference disclaimer | Marketplace table note ("examples, not recommendations") and public-example framing | |
