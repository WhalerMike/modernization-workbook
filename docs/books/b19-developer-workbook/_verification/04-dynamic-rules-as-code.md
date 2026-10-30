# Verification — Chapter 04, Dynamic Rules as Code

New material; it replaces no workbook page. Code: `examples/dynamic-rules` (new): `DynamicRules.psm1`, `Invoke-DrLibraryCheck.ps1`, six rule files, a fictional population, Book 03's rule pattern table as a fixture, and two Pester files with a harness. Pinned sample: `examples/third_party/dynamic-membership-samples` (new), the Learn source pages for the five dynamic membership processing samples and their overview page, from MicrosoftDocs/entra-docs at commit `07cb73d6c6380414eecd040ba5e14c1c94d48b66` (October 30, 2026; code MIT). Every file's git blob hash matched the upstream tree at that commit before `snapshot.json` was written. Source-watch feed added: `dynamic-membership-samples-commits`.

Test results on October 30, 2026, Windows 11, PowerShell 7.6.9, Pester 5.5.0: `DynamicRules.Tests.ps1` 57 passed; `LearnSamples.Tests.ps1` 13 passed. `scripts/tests/test_third_party_snapshots.py` covers all three snapshots. Learn's samples were run only against the fake tenant in `tests/LearnSampleHarness.ps1`: nothing signed in and no Graph call left the machine.

Microsoft Learn pages opened on October 30, 2026 through the Microsoft Learn MCP tools: Manage rules for dynamic membership groups; Create simpler, more efficient rules; Understand and manage dynamic group processing; Configure dynamic membership groups with the memberOf operator (preview); group: evaluateDynamicMembership (beta); evaluateDynamicMembershipResult; PowerShell samples for dynamic membership processing and the pause-all sample page; Troubleshooting groups with dynamic membership processing; Create or update a dynamic membership group; group resource type; New-MgGroup.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Rule grammar; precedence comparisons, -not, -and, -or; 3,072-character limit | Where the rules sit; Parse; Verified facts | verified | Learn, rules page |
| 2 | String and regex operations not case sensitive; property names case sensitive | Where the rules sit; Verified facts | verified | Learn, rules page, Supported values |
| 3 | 15,000 dynamic groups per tenant; P1 per unique user | Where the rules sit; Verified facts | verified | Learn, rules page (overview; considerations) |
| 4 | Processing sequential; usually a few hours, can exceed 24; Match, Contains, memberOf slow it | Where the rules sit; Verified facts | verified | Learn, manage dynamic group processing |
| 5 | memberOf preview ends November 3, 2026; then stops updating; public cloud only; 500 per tenant | Where the rules sit; DR-06; Verified facts | verified | Learn, memberOf page (overview; preview limitations) |
| 6 | Agents' user accounts included by user rules unless excluded; property not documented | Where the rules sit; Verified facts; Dangers | verified (absence rechecked October 30, 2026) | Learn, rules page overview; research-gaps.md row 2 |
| 7 | No Microsoft sample rule library; Graph's evaluateDynamicMembership is beta, delegated only | What Learn gives you | verified | Learn, evaluateDynamicMembership |
| 8 | Five samples, what each does, two phases, scopes and roles per phase | What Learn gives you | verified | Learn, samples page |
| 9 | Pause all skips paused collections, pauses the rest, signs in to the cloud chosen with only the scopes chosen | What they leave to you | verified by running the pinned script against the fake tenant; pinned in `LearnSamples.Tests.ps1` | local run |
| 10 | Pause all records nothing | What they leave to you | verified by running and by reading the script (no file or output object) | local run; pinned page |
| 11 | Resume noncritical resumes a collection paused before the incident | What they leave to you | verified by running; pinned in tests | local run |
| 12 | Unrecognized cloud answer (GCCHigh) selects Global | What they leave to you | verified by running; pinned in tests | local run; pinned script's `GetEnvironmentAndEndpoint` |
| 13 | Resume scripts enforce no wait | What they leave to you | verified (no time test in either script); pinned in tests | pinned pages |
| 14 | Samples page: 12 hours; processing guidance: at least 24 hours | What they leave to you; Verified facts | verified; Learn pages differ (recorded in research-gaps.md) | Learn, samples page; manage dynamic group processing |
| 15 | Throttled request retried once, then counted as failed | What they leave to you | verified by running with two 429 responses; pinned in tests | local run |
| 16 | Resume noncritical takes at most 100 of each kind | What Learn gives you | verified (`$top=100`); pinned in tests | pinned page; Learn, samples page |
| 17 | Learn's examples print an en dash (–eq) | Parse | verified | Learn, rules page (null and precedence examples) |
| 18 | Direct reports rule can't be combined; adds the manager | Lint; evaluator; Verified facts | verified | Learn, rules page; Book 03, Chapter 10 |
| 19 | Extension attributes 1–15 as string properties; multi-value extension properties unsupported | Verified facts | verified | Learn, rules page |
| 20 | Book 03 table: Legal employer lacked userType (now fixed, owner approved) and reads companyName; Exclusion admits an empty worker type | Lint | verified by running the linter on the table; the Legal employer row was corrected in the same pull request and the fixture follows the published table (a test compares them) | Book 03, Chapter 10 (October 30, 2026) |
| 21 | evaluateDynamicMembership permissions and clouds (global, L4, L5) | Lab 2; Verified facts | verified | Learn, evaluateDynamicMembership |
| 22 | New-MgGroup permissions: Group.ReadWrite.All delegated, Group.Create application | Lab 2; Verified facts | verified | Learn, New-MgGroup |
| 23 | Processing state values On and Paused; Update complete status | Lab 2; Verified facts | verified | Learn, group resource type; create or update a dynamic group |
| 24 | Guards ANDed at the top; `-ne` on coded slots and empty slots; 24-hour default | Lint; pause manifest; Dangers | restated-as-design (labeled where stated) | — |
| 25 | Lab 1 outputs (both groups On; Graph host for GCCHigh; three lint rows after the Legal employer fix; members u01, u02, u06, u08, u09; exit 0 then 2 with adds u06) | Lab 1 | verified by running the commands as written | local run, October 30, 2026 |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| Book 03, Chapter 10, rule patterns | The six library rules; the Book 03 lint fixture | The Legal employer and Direct reports patterns aren't in the library: one reads `companyName`, the other can't carry guards |
| `examples/validation-kit` VK-DG-01 to VK-DG-07 | Lint rules DR-03 to DR-06 match VK-DG-01, -02 and -06; Lab 2 uses VK-DG-03 and VK-DG-04 | The live checks are unchanged; this chapter adds the pull-request half |
| Index outline row 04 | The chapter | Agents' user accounts: still not documented on Learn; the chapter says so instead of giving a clause |
