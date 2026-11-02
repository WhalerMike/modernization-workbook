---
title: "Attribute-Driven Migration, Module 1: Send HR Records through a Middleware that Fails Closed"
subtitle: "Start from Microsoft's CSV2SCIM sample, then run the hardened client that refuses bad rows, orders leavers first, holds a mass disable and ties every batch to its inputs by hash"
description: "Research draft: Module 1 of the Attribute-Driven Migration learning path. You learn what the HR-to-Entra middleware owns and what the provisioning service owns, why every record is sent whole, and how quarantine, ordering, the mass-disable hold and the provenance manifest work, then run the hardened client on the HR fixture with no tenant. Guide Gates 2 and 3; Book 19, Chapter 01."
research-status: draft
research-type: training module
research-book: "Book 19"
series-order: 1
date-modified: 2026-11-02
last-reviewed: 2026-11-02
---

# Attribute-Driven Migration, Module 1: Send HR Records through a Middleware that Fails Closed {.unnumbered}

**Learning path:** [Building the Attribute-Driven Migration](index.md) · Module 1 of 9 · 55 minutes · Guide [Gate 2](../../books/guides/attribute-driven-migration-implementation.md#gate-2-prove-the-attributes) and [Gate 3](../../books/guides/attribute-driven-migration-implementation.md#gate-3-map-the-attributes-through-sync) · Workbook [Chapter 01](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md)

**Watch:** the chapter's narrated tour, about 11 minutes: [▶ Watch](../../presentations/watch.html?v=DW_ADM_01_HR_Entra_Middleware_Narrated). The narrated deck for this module comes later.

## Unit 1: Introduction

*5 minutes, with the objectives and prerequisites*

Every later gate trusts the attributes HR sends. A bad HR record becomes bad access faster than any ticket queue, so the guide proves the values true at Gate 2 and maps them through sync at Gate 3. The middleware between the HR extract and Entra ID is where a record is first checked. Microsoft's CSV2SCIM sample sends every row it reads. In this module you see what a federal deployment has to add, and you run the client that adds it.

**The federal requirement.** The middleware is where an HR record becomes an account, so its outputs are account-management evidence. [Chapter 01's table](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#federal-requirements-and-evidence) maps every lab step to a requirement. These are the rows Lab 1 produces, and the two Lab 2 adds:

| Requirement | KSI | Evidence the ISSO keeps |
|---|---|---|
| SI-10 Information Input Validation; AC-2 Account Management | KSI-IAM-AAM | `validation-report.json`, keys and hashes only |
| SI-10; IA-4 Identifier Management | KSI-IAM-AAM | `quarantine.json`, in the access-controlled audit store, because it holds personal data |
| CM-3 Configuration Change Control; AU-3 Content of Audit Records | KSI-CMT-LMC | `provenance.json`: every batch tied by hash to its extract and mapping |
| AC-2; CM-3, for a mass disable | KSI-IAM-AAM | The change record that carries the `--confirm-large-delta` confirmation |
| SA-11 Developer Testing and Evaluation; SR-3 Supply Chain Controls and Processes | KSI-CMT-VTD; KSI-SCR-MIT | The test results, and the pinned sample's `snapshot.json` |
| AC-6 Least Privilege; IA-5 Authenticator Management (Lab 2) | KSI-IAM-ELP; KSI-IAM-SNU | The app registration and its consent record |
| AU-6 Audit Record Review; AC-2 (Lab 2) | KSI-MLA-RVL | The findings queue, and the reconciliation report |

: Chapter 01's requirements, KSIs and evidence for this module {.striped .hover}

Key Security Indicators are FedRAMP 20x indicators for cloud service providers. The agency authorizes its own system: it lines this evidence up with what its providers report against the indicators, and doesn't report KSIs itself ([Book 00, Appendix B](../../books/b00-orientation/appendix-b-engagement-archetype.md)). Which output supports which control is the program's reading *(design guidance)*.

### Learning objectives

In this module, you'll:

- Explain what the middleware owns and what the provisioning service owns, and what a `202 Accepted` means.
- Describe what Microsoft's CSV2SCIM sample leaves to you.
- Run the hardened client and read its counts, its quarantine and its exit codes.
- Verify a run's provenance by hash, and show that a rerun gives identical bytes.
- Explain why the client sends every record whole and holds a mass disable.

### Prerequisites

- [Microsoft Automation, Module 1](../ms-automation-foundations.md), for the clouds, sign-in and least privilege.
- Python 3.10 or later with pytest. PowerShell 7 with Pester 5 is optional: it runs the PowerShell client and Microsoft's sample, which the full chapter lab compares.

## Unit 2: Where the middleware sits

*10 minutes*

The provisioning service maps attributes, matches records to users, and writes. The middleware owns everything before the POST: what is sent, in what order, how fast, and what record is kept. The endpoint is asynchronous. A `202 Accepted` means the batch was staged, not that any user was written. Read:

- [Chapter 01: where the middleware sits](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#where-the-middleware-sits).
- [Chapter 01: what CSV2SCIM leaves to you](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#what-it-leaves-to-you), the table of gaps the hardened client closes.
- The guide's [Gate 2](../../books/guides/attribute-driven-migration-implementation.md#gate-2-prove-the-attributes), for why the values are proved before anything reads them, and [Gate 3, step 5](../../books/guides/attribute-driven-migration-implementation.md#gate-3-map-the-attributes-through-sync), *send the whole record every time*.

## Unit 3: Fail closed, send it whole, and keep the record

*10 minutes*

The client takes each row and either builds a SCIM operation or refuses it with reasons. Refused rows go to `quarantine.json`. Leavers go first, then managers before their reports. Two guards hold the whole run until someone confirms it: too many disables, or too many calls. Every batch is tied to its inputs by hash, and that works only because `bulkId` is the person key. Read:

- [Validate and fail closed](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#validate-and-fail-closed).
- [Send the complete record every time](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#send-the-complete-record-every-time).
- [Order, batch and hold](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#order-batch-and-hold).
- [The provenance manifest](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#the-provenance-manifest).

## Unit 4: Exercise: Lab 1 (fixtures, no tenant)

*20 minutes*

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/hcm-entra`. Each step below says what it does and what to look for.

```bash
# Step 1: Run the hardened client
python python/hcm_to_scim.py --extract tests/fixtures/hcm_extract_sample.csv --as-of 2026-10-25 --out out

# Step 2: Read the quarantine
python -c "import json; [print(q['person_key'], '|', '; '.join(q['reasons'])) for q in json.load(open('out/quarantine.json', encoding='utf-8'))]"

# Step 3: Check the provenance
cat out/provenance.json
python -c "import hashlib,sys;print(hashlib.sha256(open(sys.argv[1],'rb').read()).hexdigest())" tests/fixtures/hcm_extract_sample.csv

# Step 4: Run it again, and compare the bytes
python python/hcm_to_scim.py --extract tests/fixtures/hcm_extract_sample.csv --as-of 2026-10-25 --out out-2
cmp out/bulk-request-001.json out-2/bulk-request-001.json && cmp out/provenance.json out-2/provenance.json && echo identical

# Step 5: Break a row on purpose
sed '/^100005,/s/ORG-100/org-100/' tests/fixtures/hcm_extract_sample.csv > extract-broken.csv
python python/hcm_to_scim.py --extract extract-broken.csv --as-of 2026-10-25 --out out-broken
python -c "import json; [print(q['person_key'], '|', '; '.join(q['reasons'])) for q in json.load(open('out-broken/quarantine.json', encoding='utf-8')) if q['person_key'] == '100005']"

# Step 6: Hold a run
echo '{"max_disables_per_run": 1}' > settings-hold.json
python python/hcm_to_scim.py --extract tests/fixtures/hcm_extract_sample.csv --as-of 2026-10-25 --settings settings-hold.json --out out-hold

# Step 7: Run the tests
python -m pytest -q -p no:cacheprovider tests/python

# Step 8: Clean up
rm -rf out out-2 out-broken out-hold extract-broken.csv settings-hold.json
```

:::

<!-- labs:end -->

You run the hardened client on the fictional HR extract, check its record, break a row and hold a run. Work in `examples/hcm-entra`. Nothing here sends a request. These are steps 2 to 7 of [Chapter 01, Lab 1](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#lab-1-fixtures-no-tenant), without the comparisons with Microsoft's sample; that lab explains each result.

1. **Run the hardened client.**

   ```bash
   python python/hcm_to_scim.py --extract tests/fixtures/hcm_extract_sample.csv --as-of 2026-10-25 --out out
   ```

   Expected output (the command exits 2, because rows were quarantined):

   ```text
   {"counts": {"ready": 9, "quarantined": 9, "superseded": 1}, "batches": 1, "disables": 3, "held": false, "hold_reason": ""}
   ```

2. **Read the quarantine.**

   ```bash
   python -c "import json; [print(q['person_key'], '|', '; '.join(q['reasons'])) for q in json.load(open('out/quarantine.json', encoding='utf-8'))]"
   ```

   Expected output:

   ```text
   100006 | worker type P refused: pending worker: provision from the hire record, not the pending record
   100007 | unknown worker type X
   (missing) | required column PersonNumber is empty
   12345678901234567 | PersonNumber doesn't fit employeeId (letters, digits and hyphens, at most 16 characters)
   100009 | worker is recorded as their own manager
   100010 | inactive assignment with no termination date: the leave date can't be set
   100014 | DepartmentName is longer than 64 characters
   100015 | PositionCategory 'ZZZ' isn't in the approved code list
   100016 | DepartmentCode 'org 300' isn't a code (A-Z, 0-9, hyphen)
   ```

3. **Check the provenance.** Show the manifest, then hash the extract yourself.

   ```bash
   cat out/provenance.json
   python -c "import hashlib,sys;print(hashlib.sha256(open(sys.argv[1],'rb').read()).hexdigest())" tests/fixtures/hcm_extract_sample.csv
   ```

   Expected: the hash is `ca06b111d5fdd45b8355952d0a9beb403eb442af61a6f4a5dc0f0ef9bb643344`, the same as `extract_sha256` in the manifest. The batch's `person_keys` start with the leaver, `100003`.

4. **Run it again, and compare the bytes.**

   ```bash
   python python/hcm_to_scim.py --extract tests/fixtures/hcm_extract_sample.csv --as-of 2026-10-25 --out out-2
   cmp out/bulk-request-001.json out-2/bulk-request-001.json && cmp out/provenance.json out-2/provenance.json && echo identical
   ```

   Expected: the same counts as step 1, then `identical`. Microsoft's sample gives a new `bulkId` on every run, so its hashes never repeat.

5. **Break a row on purpose.** The first command writes a copy of the extract with worker 100005's `DepartmentCode` in lower case.

   ```bash
   sed '/^100005,/s/ORG-100/org-100/' tests/fixtures/hcm_extract_sample.csv > extract-broken.csv
   python python/hcm_to_scim.py --extract extract-broken.csv --as-of 2026-10-25 --out out-broken
   python -c "import json; [print(q['person_key'], '|', '; '.join(q['reasons'])) for q in json.load(open('out-broken/quarantine.json', encoding='utf-8')) if q['person_key'] == '100005']"
   ```

   Expected: the counts become `"ready": 8, "quarantined": 10`, and the last line is `100005 | DepartmentCode 'org-100' isn't a code (A-Z, 0-9, hyphen)`.

6. **Hold a run.**

   ```bash
   echo '{"max_disables_per_run": 1}' > settings-hold.json
   python python/hcm_to_scim.py --extract tests/fixtures/hcm_extract_sample.csv --as-of 2026-10-25 --settings settings-hold.json --out out-hold
   ```

   Expected: exit code 3, and `"held": true, "hold_reason": "3 disables exceed max_disables_per_run (1): held for confirmation (Book 03, Appendix B pause switch)"`.

7. **Run the tests.**

   ```bash
   python -m pytest -q -p no:cacheprovider tests/python
   ```

   Expected: `70 passed`.

8. **Clean up.**

   ```bash
   rm -rf out out-2 out-broken out-hold extract-broken.csv settings-hold.json
   ```

**Check your work:** for any row in an extract, you can say whether the client sends it, quarantines it or supersedes it, and where the record of that decision is kept.

## Unit 5: Exercise: Lab 2 (your test tenant)

*Not timed. Not run by the authors.*

Create an API-driven inbound provisioning app in a test tenant, extend its schema with CSV2SCIM, grant the sender one permission, send five fictional records with the hardened client, and reconcile them against the provisioning logs. Follow [Chapter 01, Lab 2](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#lab-2-test-tenant).

- **You need:** a test tenant, never production, with Microsoft Entra ID P1, P2 or ID Governance, and a sender identity with a certificate or managed identity, never a secret.
- **Back it out:** step 7 sends the five records again as inactive, with a termination date, and unsets the token variable.

## Unit 6: Knowledge check

*5 minutes*

1. The `/bulkUpload` endpoint answers `202 Accepted`. What does that tell you?
   a. Every user in the batch was written to the directory.
   b. The batch was staged for the provisioning job; each record's result appears in the provisioning logs.
   c. The batch was validated against the code lists.

2. Why does the client use the person key as each operation's `bulkId`?
   a. The provisioning service requires it.
   b. So the same input produces the same batch hash, and an auditor can trace a log line back to the extract.
   c. So the batch is smaller.

3. A run would disable more accounts than `max_disables_per_run` allows. What happens?
   a. The client sends the first batch and stops.
   b. The client drops the extra disables.
   c. The whole run is held, with exit code 3, until someone confirms it with `--confirm-large-delta`.

4. Why does the client never send a partial record?
   a. Partial records are slower.
   b. When the job's clearing feature is on, an omitted attribute can clear the value in the directory.
   c. SCIM doesn't allow partial records.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See [Chapter 01: where the middleware sits](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#where-the-middleware-sits).
2. **b.** With a random `bulkId`, as in the sample, the same input never gives the same hash. See [the provenance manifest](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#the-provenance-manifest) and step 4 of the lab.
3. **c.** See [order, batch and hold](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#order-batch-and-hold) and step 6 of the lab.
4. **b.** See [send the complete record every time](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#send-the-complete-record-every-time) and the guide's [Gate 3, step 5](../../books/guides/attribute-driven-migration-implementation.md#gate-3-map-the-attributes-through-sync).
:::

## Unit 7: Summary

*2 minutes*

You learned where the middleware's job ends and the provisioning service's begins, and you ran the client that refuses bad rows, orders leavers first, holds a mass disable and keeps a record an auditor can follow by hash.

**Evidence an ISSO keeps from this module:** `validation-report.json`, `provenance.json` and, in Lab 2, `apply-results.json` in the evidence store; `quarantine.json` in the access-controlled audit store; the change record for any confirmed hold; the sender's app registration and consent record; and the reconciliation against the provisioning logs. Gate 2's own evidence, the correlation report and the threshold decision, is in the guide's [Gate 2](../../books/guides/attribute-driven-migration-implementation.md#gate-2-prove-the-attributes). Before shipping, work through the [Chapter 01 checklist](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md#checklist).

::: {.callout-tip}
## Continue the path
[Learning path](index.md) · [Next: Module 2, Write a validation kit check →](02-a-validation-kit-check.md)
:::
