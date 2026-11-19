# Verification — Chapter 04, Deploying to Test and Production

New material, written November 18, 2026. Code: `examples/daily-checks-workbook` (new in this change). Every Microsoft fact was read on Microsoft Learn that day with WebFetch (the Learn documentation service wasn't available to this session); facts carried from the guide rely on its verification log (`docs/books/guides/_verification/daily-checks-dashboard-implementation.md`), and facts from the books are cited by link.

This chapter is a runbook with no Lab 1 or Lab 2. Its fixture-mode output (step 4) was run on November 18, 2026 against `tests/fixtures/settings.lab.json` and `deploy/tests/fixtures/whatif-create.json`; every deploy script is exercised by the 19 tests in `deploy/tests` with a stand-in for the Azure CLI. Nothing was run against a live subscription.

## Claims log

| # | Claim (short) | Verdict | Source |
|---|---|---|---|
| 1 | Learn facts in this chapter | verified Nov 18, 2026 | dc04-roles (Workbook Contributor, Workbook Reader); dc04-whatif (same permissions as a deployment; change types); dc04-access (Log Analytics Reader); dc04-overview (workbook access control) |
| 2 | Kit behavior and lab output | verified by running the kit and its tests | `data/kit-captures/dc/`, `examples/daily-checks-workbook/tests`, `deploy/tests` |
| 3 | Lab 2 behavior | not run | — |
| 4 | Design guidance (tab fit, freshness limits, render rules, stage steps) | the program's position, labeled | `config/manifest.json`, `config/requirements.json` |
| 5 | The replication probe section: Tier 0 identity on a Tier 0 host (Enterprise Admins or equivalent per Learn, cited in the guide's dcg-repadmin); Monitoring Metrics Publisher on the probe's rule | verified Nov 19, 2026 (through the guide's footnotes); where it runs is design guidance, for the owner to decide | guide `dcg-repadmin`, `dcg-ingest` |

## Federal requirements and evidence

Controls and KSIs are only the pairs in `config/requirements.json`, each reused from the Azure security kit's verified pairs; no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Review gate

`review-status: pending`. Not approved here.
