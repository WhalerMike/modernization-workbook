---
title: "Attribute-Driven Migration, Module 8: Run the Drift Pipeline and Hand Over the Evidence"
subtitle: "Run the validation kit on a schedule with no stored secret, compare each run with the last without treating a failed read as a fix, open findings without names, and hand the ISSO a package sha256sum verifies"
description: "Research draft: Module 8 of the Attribute-Driven Migration learning path. You learn where the drift pipeline sits in Book 13's drift engine, what Learn's sample workflows leave to you, the comparison of one run with the last, findings by fingerprint without names, and the chained evidence package, then lint the workflows, record a baseline, compare the next day, draft the findings, package and verify the chain, and break it on purpose. Guide Gate 9; Book 19, Chapter 09."
research-status: draft
research-type: training module
research-book: "Book 19"
series-order: 8
date-modified: 2026-11-02
review-status: approved
reviewed-sha256: 43069096ad0c8f6f2b14099af9247afa22441d6870abe8e7437f8c45ba97af57
last-reviewed: 2026-11-03
---
# Attribute-Driven Migration, Module 8: Run the Drift Pipeline and Hand Over the Evidence {.unnumbered}

**Learning path:** [Building the Attribute-Driven Migration](index.md) · Module 8 of 9 · 55 minutes · Guide [Gate 9](../../books/guides/attribute-driven-migration-implementation.md#gate-9-keep-the-attributes-true) · Workbook [Chapter 09](../../books/b19-developer-workbook/09-drift-pipelines-and-evidence.md)

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.4/Training_ADM_Module_8.pptx) · [▶ Watch](../../presentations/watch.html?v=Training_ADM_Module_8_Narrated) (about 14 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_ADM_Module_8_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-adm-module-8/Training_ADM_Module_8_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-adm-module-8/Training_ADM_Module_8_Narrated.vtt).

**Also:** the chapter's narrated tour, about 11 minutes: [▶ Watch](../../presentations/watch.html?v=DW_ADM_09_Drift_Pipelines_Evidence_Narrated).

## Unit 1: Introduction

*5 minutes, with the objectives and prerequisites*

Without Gate 9, everything slowly decays. Its Validate step runs the HR, dynamic group and sync checks on the drift cadence, and its evidence is each cycle's run folder, the findings queue and the metrics for continuous monitoring. Each validation kit check compares the tenant with the program's record. The pipeline adds the second comparison: this run against the last. In this module you run it on two days of fixture runs, read what changed, and hand over a package the ISSO can check with `sha256sum` and nothing else.

**The federal requirement.** This chapter turns the other chapters' outputs into continuous monitoring. From [Chapter 09's table](../../books/b19-developer-workbook/09-drift-pipelines-and-evidence.md#federal-requirements-and-evidence):

| Requirement | KSI | Evidence the ISSO keeps |
|---|---|---|
| CA-7; CM-2: the first run is a packaged baseline | KSI-MLA-EVC | `drift-report.json` and `EVIDENCE-MANIFEST.json`, in the immutable evidence container |
| CA-7; SI-4 System Monitoring: each run says what is new, resolved, changed and unverified, and a failed read never resolves a finding | KSI-MLA-EVC; KSI-MLA-RVL | The evidence package |
| CA-7; AU-6: each finding is opened or closed by fingerprint, with object IDs and no names | KSI-MLA-RVL | The issue tracker |
| AU-9 Protection of Audit Information; SI-7; CM-3: the package hashes every file, carries the other kits' provenance and chains to the day before | KSI-SVC-VRI; KSI-CMT-LMC | `EVIDENCE-MANIFEST.json`, `SHA256SUMS` and `provenance/` |
| SI-7; AU-9: an edit after packaging and runs out of order are refused | KSI-SVC-VRI | The test results |
| SA-10; AC-6: every action is pinned, and the job that reads the tenant can't write to the tracker | KSI-SCR-MIT; KSI-IAM-ELP | The workflow file in Git |
| IA-5: the pipeline signs in with a federated credential, and no secret is stored (Lab 2) | KSI-IAM-SNU | The app registration and the Entra audit log |

: Chapter 09's requirements, KSIs and evidence for this module {.striped .hover}

Key Security Indicators are FedRAMP 20x indicators for cloud service providers. The agency authorizes its own system and lines this evidence up with what its providers report against them; it doesn't report KSIs itself ([Book 00, Appendix B](../../books/b00-orientation/appendix-b-engagement-archetype.md)). Which output supports which control is the program's reading *(design guidance)*.

### Learning objectives

In this module, you'll:

- Explain what the pipeline adds to the validation kit's own comparison.
- Describe what Learn's sample workflows leave to you.
- Compare two runs and read new, resolved, changed, detail only, unchanged and unverified.
- Explain why a failed read is unverified, not resolved.
- Package and verify a run, and explain how the packages form a chain.

### Prerequisites

- [Module 2](02-a-validation-kit-check.md): the pipeline reads the kit's runs and their manifests. [Modules 1, 3 and 5](01-the-hr-middleware.md) produce the provenance it packages.
- Python 3.10 or later with PyYAML and pytest, and a shell with `sha256sum`, such as Git Bash.

## Unit 2: Where the pipeline sits

*8 minutes*

Drift is measured against a versioned record, not a snapshot. No closure counts unless it carries its proof. A finding that was there yesterday and is still there today isn't new, but it is still open. Learn's sample workflows sign in with OpenID Connect and no secret, but have no schedule, pin actions by tag, and one doesn't parse. Read:

- The guide's [Gate 9](../../books/guides/attribute-driven-migration-implementation.md#gate-9-keep-the-attributes-true).
- [Chapter 09: where the pipeline sits](../../books/b19-developer-workbook/09-drift-pipelines-and-evidence.md#where-the-pipeline-sits).
- [Chapter 09: what Learn's sample leaves to you](../../books/b19-developer-workbook/09-drift-pipelines-and-evidence.md#what-it-leaves-to-you).

## Unit 3: Compare, findings and the package

*10 minutes*

The comparison refuses a run edited after the kit wrote it, runs from different clouds or tenants, and a "current" run that isn't later. Findings go to the tracker with object IDs and fingerprints, not names. The package hashes every file, carries the other kits' provenance and the previous package's manifest hash, so a missing day shows as a break in the chain. Read:

- [Compare](../../books/b19-developer-workbook/09-drift-pipelines-and-evidence.md#compare).
- [Findings without names](../../books/b19-developer-workbook/09-drift-pipelines-and-evidence.md#findings-without-names).
- [The evidence package](../../books/b19-developer-workbook/09-drift-pipelines-and-evidence.md#the-evidence-package).

## Unit 4: Exercise: Lab 1 (fixtures, no tenant)

*25 minutes*

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/drift-pipeline`. Each step below says what it does and what to look for.

```bash
# Step 1: Check Learn's sample workflows offline
python python/workflow_lint.py --learn-samples

# Step 2: Check the pipeline's own workflow
python python/workflow_lint.py workflow/drift-pipeline.yml

# Step 3: Print a cloud's hosts
python python/drift_pipeline.py cloud --name dod
python python/drift_pipeline.py cloud --name usgov

# Step 4: Record a baseline and package it
PREV=tests/fixtures/runs/previous/2026-10-28-0617-fixture-runner-fixture
CURR=tests/fixtures/runs/current/2026-10-29-0617-fixture-runner-fixture
P="--provenance hcm-entra=tests/fixtures/provenance/hcm-entra/provenance.json --provenance machine-configuration=tests/fixtures/provenance/machine-configuration/provenance.json --provenance dynamic-rules=tests/fixtures/provenance/dynamic-rules/check-results.json"
python python/drift_pipeline.py compare --current $PREV --out out/day1
python python/drift_pipeline.py package --kit-run $PREV --diff out/day1/drift-report.json $P --out out/evidence

# Step 5: Compare the next day
python python/drift_pipeline.py compare --previous $PREV --current $CURR --out out/day2
cat out/day2/drift-summary.md

# Step 6: Draft the findings
python python/drift_pipeline.py issues --diff out/day2/drift-report.json --out out/day2/issues.json
grep -c "gina@contoso.example" out/day2/issues.json
grep -c "00000000-0000-4000-8000-000000000011" out/day2/issues.json

# Step 7: Package and verify the second run, chained to the first
python python/drift_pipeline.py package --kit-run $CURR --diff out/day2/drift-report.json $P \
  --previous-manifest out/evidence/2026-10-28-0617-fixture-runner-fixture/EVIDENCE-MANIFEST.json --out out/evidence
python python/drift_pipeline.py verify out/evidence/2026-10-29-0617-fixture-runner-fixture
(cd out/evidence/2026-10-29-0617-fixture-runner-fixture && sha256sum -c --quiet SHA256SUMS)

# Step 7: Package and verify the second run, chained to the first
python -c "import json; m = json.load(open('out/evidence/2026-10-29-0617-fixture-runner-fixture/EVIDENCE-MANIFEST.json')); print(m['previous']['evidence_manifest_sha256']); print(m['tenant_id'])"

# Step 8: Break it on purpose
echo "edited after packaging" >> out/evidence/2026-10-29-0617-fixture-runner-fixture/drift/drift-summary.md
python python/drift_pipeline.py verify out/evidence/2026-10-29-0617-fixture-runner-fixture
python python/drift_pipeline.py compare --previous $CURR --current $PREV --out out/swapped

# Step 9: Run the tests
python -m pytest tests -q

# Step 10: Clean up
rm -rf out
```

:::

<!-- labs:end -->

You lint the workflows, print a cloud's hosts, record a baseline, compare the next day, draft the findings, package and verify the chain, and break it on purpose. Work in `examples/drift-pipeline`, in a POSIX shell. These are the steps of [Chapter 09, Lab 1](../../books/b19-developer-workbook/09-drift-pipelines-and-evidence.md#lab-1-fixtures-no-tenant), which explains each result.

1. **Check Learn's sample workflows offline.**

   ```bash
   python python/workflow_lint.py --learn-samples
   ```

   Expected: exit 2. Sample 1 has 5 findings and 4 warnings, sample 2 has 7 findings and 4 warnings, and sample 3 has one: `WF-01 file: Not valid YAML (mapping values are not allowed here)`.

2. **Check the pipeline's own workflow.**

   ```bash
   python python/workflow_lint.py workflow/drift-pipeline.yml
   ```

   Expected: `workflow/drift-pipeline.yml: 0 finding(s), 0 warning(s)`.

3. **Print a cloud's hosts**, then ask for a name the pipeline doesn't know:

   ```bash
   python python/drift_pipeline.py cloud --name dod
   python python/drift_pipeline.py cloud --name usgov
   ```

   Expected: for `dod`, the authority `https://login.microsoftonline.us`, the Graph host `https://dod-graph.microsoft.us` and the Azure environment `AzureUSGovernment`. Then exit 1: `error: unknown cloud 'usgov'; expected one of gcc, gcchigh, dod`.

4. **Record a baseline and package it.**

   ```bash
   PREV=tests/fixtures/runs/previous/2026-10-28-0617-fixture-runner-fixture
   CURR=tests/fixtures/runs/current/2026-10-29-0617-fixture-runner-fixture
   P="--provenance hcm-entra=tests/fixtures/provenance/hcm-entra/provenance.json --provenance machine-configuration=tests/fixtures/provenance/machine-configuration/provenance.json --provenance dynamic-rules=tests/fixtures/provenance/dynamic-rules/check-results.json"
   python python/drift_pipeline.py compare --current $PREV --out out/day1
   python python/drift_pipeline.py package --kit-run $PREV --diff out/day1/drift-report.json $P --out out/evidence
   ```

   Expected output (the compare exits 2):

   ```text
   {"baseline": true, "counts": {"changed": 0, "detail_only": 0, "new": 10, "resolved": 0, "unchanged": 0, "unverified": 0}, "drift": true}
   {"evidence_manifest_sha256": "6d9fffbc86009c18673ea37a3a5ed3805541331a8e921955380c1b1143374cd1", "package": "2026-10-28-0617-fixture-runner-fixture"}
   ```

5. **Compare the next day.**

   ```bash
   python python/drift_pipeline.py compare --previous $PREV --current $CURR --out out/day2
   cat out/day2/drift-summary.md
   ```

   Expected: exit 2, and the summary reads `New 3, resolved 1, changed 1, detail only 1, unchanged 6, unverified checks 2.` Its table:

   ```text
   | Check | Before | After |
   |---|---|---|
   | VK-CA-01 | Pass | Fail |
   | VK-NPI-03 | Fail | Error |
   | VK-PIV-01 | Pass | not run |
   ```

   VK-NPI-03's finding is unverified, not resolved: its read failed.

6. **Draft the findings**, then search them for a name and for an object ID:

   ```bash
   python python/drift_pipeline.py issues --diff out/day2/drift-report.json --out out/day2/issues.json
   grep -c "gina@contoso.example" out/day2/issues.json
   grep -c "00000000-0000-4000-8000-000000000011" out/day2/issues.json
   ```

   Expected: `{"close": 2, "comment": 0, "open": 6}`, then `0` (the address isn't there; `grep` exits 1), then `1` (the object ID is).

7. **Package and verify the second run, chained to the first.**

   ```bash
   python python/drift_pipeline.py package --kit-run $CURR --diff out/day2/drift-report.json $P \
     --previous-manifest out/evidence/2026-10-28-0617-fixture-runner-fixture/EVIDENCE-MANIFEST.json --out out/evidence
   python python/drift_pipeline.py verify out/evidence/2026-10-29-0617-fixture-runner-fixture
   (cd out/evidence/2026-10-29-0617-fixture-runner-fixture && sha256sum -c --quiet SHA256SUMS)
   ```

   Expected: the manifest hash is `0932f0a3cd710c19bdfce05ff4f7595bf2d8d5e3b652921223d12fa49aada6ee`, `verify` reports `"files": 16`, and `sha256sum` prints nothing and exits 0. Read two fields of the manifest:

   ```bash
   python -c "import json; m = json.load(open('out/evidence/2026-10-29-0617-fixture-runner-fixture/EVIDENCE-MANIFEST.json')); print(m['previous']['evidence_manifest_sha256']); print(m['tenant_id'])"
   ```

   Expected: the day 1 hash, `6d9fffbc86009c18673ea37a3a5ed3805541331a8e921955380c1b1143374cd1`, and the fixture tenant's placeholder, `11111111-1111-4111-8111-111111111111`.

8. **Break it on purpose.** Append a line to the packaged summary and verify again, then swap the runs:

   ```bash
   echo "edited after packaging" >> out/evidence/2026-10-29-0617-fixture-runner-fixture/drift/drift-summary.md
   python python/drift_pipeline.py verify out/evidence/2026-10-29-0617-fixture-runner-fixture
   python python/drift_pipeline.py compare --previous $CURR --current $PREV --out out/swapped
   ```

   Expected: exit 1, `drift/drift-summary.md doesn't match its SHA-256`; then exit 1, `error: the current run (2026-10-28T06:17:00Z) isn't later than the previous one (2026-10-29T06:17:00Z)`.

9. **Run the tests.**

   ```bash
   python -m pytest tests -q
   ```

   Expected: `142 passed`. It takes about two minutes.

10. **Clean up.**

    ```bash
    rm -rf out
    ```

**Check your work:** given two runs, you can say what is new, resolved, changed or unverified, and given a package, you can show it is unedited and chained to the day before.

## Unit 5: Exercise: Lab 2 (your test tenant)

*Not timed. Not run by the authors.*

Register an app that trusts a private test repository through a federated credential, grant it only the reads, make an evidence container with an unlocked retention policy, set up the repository's environment, run the workflow by hand for a baseline, make one real change and run it again, and let the schedule run. Follow [Chapter 09, Lab 2](../../books/b19-developer-workbook/09-drift-pipelines-and-evidence.md#lab-2-test-tenant-and-test-subscription).

- **You need:** a test tenant and a test subscription, never production, and a private test repository, `contoso-example/estate-checks`, holding the validation kit and this example.
- **Back it out:** step 8 deletes the federated credential and the app. Leave the test retention policy unlocked: Learn says an unlocked policy is for testing and can be deleted.

## Unit 6: Knowledge check

*5 minutes*

1. Yesterday VK-NPI-03 had a finding. Today its read failed with a 403. What does the comparison report?
   a. Resolved.
   b. Unverified, not resolved: a failed read is never a fix.
   c. Unchanged.

2. What goes into a drafted issue for a finding?
   a. The user principal name, so the owner is obvious.
   b. The check, severity, object ID, issue and fingerprint, without the name.
   c. The full drift report.

3. How does the ISSO check a package without the program's code?
   a. By reading the drift summary.
   b. With `sha256sum -c SHA256SUMS` in the package's folder.
   c. By re-running the validation kit.

4. What shows that a day's package is missing?
   a. Nothing; each package stands alone.
   b. A break in the chain: each manifest records the previous package's manifest hash.
   c. The issue tracker.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See [Compare](../../books/b19-developer-workbook/09-drift-pipelines-and-evidence.md#compare) and step 5 of the lab.
2. **b.** See [findings without names](../../books/b19-developer-workbook/09-drift-pipelines-and-evidence.md#findings-without-names) and step 6 of the lab.
3. **b.** See [the evidence package](../../books/b19-developer-workbook/09-drift-pipelines-and-evidence.md#the-evidence-package) and step 7 of the lab.
4. **b.** See [the evidence package](../../books/b19-developer-workbook/09-drift-pipelines-and-evidence.md#the-evidence-package) and step 7 of the lab.
:::

## Unit 7: Summary

*2 minutes*

You compared two days of kit runs without letting a failed read close a finding, drafted findings without names, and packaged and verified a chain of evidence the ISSO can check with `sha256sum` alone.

**Evidence an ISSO keeps from this module:** each day's package, with its kit run, drift report, other kits' provenance, `EVIDENCE-MANIFEST.json` and `SHA256SUMS`, in a container whose retention is locked in production; the findings in the tracker by fingerprint; and the workflow file and the pipeline app's registration. Gate 9 adds the scan schedule, the limits register and the metrics for continuous monitoring, in the guide's [Gate 9](../../books/guides/attribute-driven-migration-implementation.md#gate-9-keep-the-attributes-true). Before shipping, work through the [Chapter 09 checklist](../../books/b19-developer-workbook/09-drift-pipelines-and-evidence.md#checklist).

::: {.callout-tip}
## Continue the path
[Previous: Module 7](07-lifecycle-workflows-extensions.md) · [Learning path](index.md) · [Next: Module 9, Deploy to test, then production →](09-deploying-to-test-and-production.md)
:::
