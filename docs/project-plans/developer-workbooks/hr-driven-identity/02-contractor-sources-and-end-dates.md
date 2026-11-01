---
title: "Chapter 02 — Contractor Sources and Enforced End Dates"
description: "Run contractors from a source other than HR with an end date that can't be left open: compute each contractor's earliest end from the contract, the completion date, suitability, the card and the sponsor, write the records as an extract the HR middleware sends through API-driven inbound provisioning, reconcile the register, the card system and the directory read-only, and build the sponsor review that removes access when no one responds, starting from Learn's bulkUpload API and access package review settings and adding what they leave to you, with labs against fixtures and a test tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-hr-driven-identity
part: How
series-order: 2
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: approved
reviewed-sha256: 41b5c2394e6b3b0c20ef8df32dcb7ced4556152e937784437ea613e62168f1df
last-reviewed: 2026-11-01
---
# Chapter 02 — Contractor Sources and Enforced End Dates

*A contractor's end date in a spreadsheet nobody updates keeps access alive. The end date the code computes, from every fact that can end an engagement, doesn't.*

::: {.callout-note}
## In this chapter
The code behind the guide's Gate 2 and the plan's decision D-I3 and task I5.2: contractors from a named source, an enforced earliest end, the contractor leaver shipped first, and sponsors recertified with remove-on-no-response. You start with Learn's API-driven inbound provisioning contract (`bulkUpload`) and the review settings of an access package assignment policy. Then you use `examples/hr-lifecycle` for what they leave to you: the earliest end per contractor, an extract that `examples/hcm-entra` turns into SCIM requests, a read-only reconciliation, and the review settings as code. Lab 1 runs on a laptop with no tenant; Lab 2 uses a test tenant.
:::

## Goal and audience

**Goal.** By the end of this chapter you can turn a contractor register into records the HR middleware sends, each carrying its earliest end as the leave date and an inactive status once that date has passed; refuse a record with no end or no sponsor; show every contractor account, card and record that disagree; and produce the sponsor review's settings for review. For each rule you can say whether it is Learn's contract, Book 03's design or the program's own guidance.

**Audience.** Developers who build the contractor source's integration, the owner of the contractor register, and the identity engineers who run the provisioning app. You should read Python, CSV and JSON. You don't need a tenant until Lab 2.

## Why contractors need their own code

Contractors aren't in Federal HR 2.0's scope, so they come from an agency-owned register mapped into the same canonical record ([Book 03, Chapter 06](../../../books/b03-hr-identity/06-canonical-attribute-schema.md#contractors-and-vendors-the-population-hrit-doesnt-cover)), as the [contractor evaluation](../../../evaluations/oracle-contingent-worker-contractor-source.md#part-6-recommendation) recommends. The guide's [Step 2](../../../books/guides/hr-driven-identity-implementation.md#step-2-bring-in-employees-and-contractors-from-their-sources) ships the contractor leaver first: the middleware computes the earliest end and sends the leave date and `active` false itself ([Appendix A, Contractor leavers](../../../books/b03-hr-identity/appendix-a-lifecycle-rules.md#contractor-leavers)). This chapter is that computation, and the checks around it. The decision of which source to use is the governance body's (D-I3); the code works with whichever register is named.

### Which cloud, for these reads and writes

The records reach Entra ID through the contractor source's own API-driven provisioning app, through the same middleware as employees. Learn's feature availability page lists API-driven inbound provisioning, and provisioning agent registration for a US Government tenant, as available in Azure Government, and access reviews as available; GCC uses the commercial service.[^hw02-feat] The *Perform bulkUpload* page itself carries no national cloud table (verification log, row 6). The middleware's endpoint check accepts only `graph.microsoft.com`, `graph.microsoft.us` and `dod-graph.microsoft.us` ([Book 19, Chapter 01](../../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md)). The reconciliation reads `GET /users` from the cloud you name; `graph_export.py` has no default.

## Start with Microsoft's procedure

### What Microsoft gives you

Learn's *Perform bulkUpload* page is the contract: `POST /servicePrincipals/{servicePrincipalId}/synchronization/jobs/{jobId}/bulkUpload` with `Content-Type: application/scim+json`, at most 50 user operations per request and a rate limit of 40 requests per second. The provisioning service matches on the attributes the job maps (`externalId` in the examples) to create, update, enable or disable the account, resolves `manager.value` as the manager's `externalId`, and disables the user when a record sends `active` false. A successful call returns `202 Accepted` with a `Location` header that points to the provisioning logs. The least-privileged application permission is `SynchronizationData-User.Upload.OwnedBy`; `SynchronizationData-User.Upload` is the higher one and the only delegated one, for a User Administrator.[^hw02-bulk]

For recertification, the `reviewSettings` of an access package assignment policy carry `isEnabled`, `primaryReviewers`, `fallbackReviewers`, `schedule` and `expirationBehavior`, whose values are `keepAccess`, `removeAccess` and `acceptAccessRecommendation`.[^hw02-review] Learn's procedure for a review of an access package offers monthly, quarterly, bi-annual and annual frequencies, **Manager** as reviewer with a fallback, and the no-response choices no change, remove access or take recommendations.[^hw02-ar]

### What it leaves to you

Each row is pinned by a test in `tests/test_writers_and_contractors.py`.

| Learn gives | What it leaves to you | What `examples/hr-lifecycle` adds | Test |
|---|---|---|---|
| `active` false disables the account | When a contractor's engagement has ended | The earliest end: contract end, earlier completion date, suitability withdrawn, card terminated, revoked or expired, sponsor gone past the grace period, sponsor recertification due | `test_earliest_end_takes_the_first_condition`, `test_an_expired_card_ends_the_engagement` |
| Any record it's sent | Refusing a contractor with no end or no sponsor | Quarantine: CS-01, CS-02 | `test_no_end_date_or_no_sponsor_is_quarantined` |
| A SCIM bulk request schema | Mapping the register into the canonical record | Rows in the `examples/hcm-entra` extract layout: worker type `C`, the sponsor as manager, organization from the sponsor, the earliest end as the termination date | `test_extract_matches_the_hcm_entra_layout_and_marks_past_ends_inactive` |
| Provisioning results per record | A reconciliation before anything changes | CR-01 to CR-05 across the register, the card system and the directory | `test_reconcile_finds_every_class` |
| Review settings as properties | The settings the guide asks for, as a reviewed body | Bi-annual, the manager as reviewer, a named fallback, remove access on no response | `test_review_settings_remove_access_when_no_one_responds` |
| — | One record per person | A register with a key twice is refused | `test_duplicate_person_keys_are_refused` |

**The verdict.** Don't write a second SCIM client. The middleware in `examples/hcm-entra` already validates, batches, paces and records provenance; this chapter feeds it the contractor population with dates it computed.

## The code: what `examples/hr-lifecycle` adds

What exists already isn't rebuilt. [`examples/hcm-entra`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/hcm-entra) builds and sends the SCIM bulk requests, with its own validation, quarantine and provenance manifest ([Book 19, Chapter 01](../../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md)); its mapping already treats worker type `C` as a contractor with code `CTR`. The validation kit reports enabled member users with no `employeeId` (**VK-HR-01**) and the worker type fill rate (**VK-HR-07**). This chapter adds `python/contractor_source.py`, `config/contractor-rules.json` and the `contractor-reconcile` task.

### The earliest end

`extract` computes, for each register row, every end condition that applies and takes the first. The conditions and their order are Book 03's ([Appendix A, Contractor leavers](../../../books/b03-hr-identity/appendix-a-lifecycle-rules.md#contractor-leavers)); the sponsor's 30-day grace period and the 180-day recertification cycle in `config/contractor-rules.json` are *design guidance* the agency sets. A record whose end is on or before the run date goes out `INACTIVE`, so the provisioning service disables the account; every record carries its end as the termination date, so the leaver workflow (Chapter 03) fires on that day.

| Rule | Severity | What it flags | Source |
|---|---|---|---|
| CS-01 | Finding | No contract end date; quarantined | The guide: an enforced earliest end |
| CS-02 | Finding | Sponsor not in the HR export; quarantined, no manager | The evaluation's mapping: the sponsor as `manager` |
| CS-03 | Warn | Sponsor separated; access ends after the grace period unless a new sponsor is recorded | Appendix A |
| CS-04 | Info | An engagement ending within 14 days | *Design guidance* |
| CR-01 | Finding | An enabled account past its earliest end | Appendix A |
| CR-02 | Finding | An enabled contractor account with no register record (orphan) | Book 03, Chapter 11 |
| CR-03 | Finding | An active card for a person the register doesn't hold | Book 03, Chapter 11: contractor credential drift |
| CR-04 | Warn | An active register record with no account | *Design guidance* |
| CR-05 | Finding | `employeeLeaveDateTime` that isn't the earliest end | *Design guidance*: the leaver fires on the wrong day |

The reconciliation is read only, joined on the enterprise person key in `employeeId`, as the guide's step 2 asks before anything changes. Its one Graph call:

| Call | Least-privileged permission | Note |
|---|---|---|
| `GET /users` filtered to `employeeType eq 'Contractor'`, with `employeeLeaveDateTime` | `User.Read.All` and `User-LifeCycleInfo.Read.All` | Carried from the validation kit's VK-HR-05 notes; the filter needs `ConsistencyLevel: eventual` and `$count` |

### The sponsor review

`review` writes `assignment-policy-review.json`: the `reviewSettings` block for the contractor package's assignment policy, bi-annual (`absoluteMonthly`, interval 6), the requestor's manager as primary reviewer, a named fallback reviewer and `removeAccess` on no response, so a missed recertification ends access as the earliest-end rule says. Learn documents the `requestorManager` subject set for approval stages; its use as a reviewer in `reviewSettings` isn't shown on Learn, and Lab 2 confirms it (verification log, row 10). The code sends nothing. Learn's cmdlet for updating a policy in v1.0 is `Set-MgEntitlementManagementAssignmentPolicy`, which takes the whole policy as its body, with `EntitlementManagement.ReadWrite.All`;[^hw02-set] merge the block into the policy you read back and send that. The output's own `_target` note names the same cmdlet.

### The tests

This chapter's tests are the seven Chapter 02 tests in `tests/test_writers_and_contractors.py`, with the shared tests in `tests/test_core.py`. All 57 tests in the kit pass, with no package, tenant or network.

::: {.callout-important}
## Illustrative code
The commands below run the example against a fictional register, card export and directory. They show what the code does, not that a tenant's provisioning job maps the same attributes. Review the code and the rules, and run Lab 2 in a test tenant, before contractor records reach production.
:::

## Lab 1: fixtures, no tenant

You need Python 3.10 or later. Work in `examples/hr-lifecycle`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/hr-lifecycle`. Each step below says what it does and what to look for.

```bash
# Step 1: List the reconciliation's read and permissions
python python/graph_export.py --task contractor-reconcile --list

# Step 2: Compute the earliest ends and write the extract
python python/contractor_source.py extract --register tests/fixtures/ch02/contractor-register.csv --cards tests/fixtures/ch02/cards.csv \
    --sponsors tests/fixtures/ch02/hr-sponsors.csv --rules config/contractor-rules.json --as-of 2026-11-01 --out out/ch02/extract

# Step 3: Read the decisions
python -c "import json; [print(d['PersonKey'], d['Action'], d['EarliestEnd'], d['Reason']) for d in json.load(open('out/ch02/extract/decisions.json'))]"

# Step 4: Build the SCIM requests with the middleware
python ../hcm-entra/python/hcm_to_scim.py --extract out/ch02/extract/contractors-extract.csv --as-of 2026-11-01 --out out/ch02/scim

# Step 5: Reconcile the register, the cards and the directory
python python/contractor_source.py reconcile --register tests/fixtures/ch02/contractor-register.csv --cards tests/fixtures/ch02/cards.csv \
    --sponsors tests/fixtures/ch02/hr-sponsors.csv --accounts tests/fixtures/ch02/contractor-users.json --rules config/contractor-rules.json \
    --as-of 2026-11-01 --cloud gcc --out out/ch02/reconcile
python -c "import json; [print(r['Rule'], r['Severity'], r['Object'], '|', r['Issue']) for r in json.load(open('out/ch02/reconcile/findings.json'))]"

# Step 6: Write the sponsor review settings
python python/contractor_source.py review --rules config/contractor-rules.json --out out/ch02/review

# Step 7: Run the tests
python -m pytest tests -q

# Step 7: Run the tests
rm -rf out
```

:::

<!-- labs:end -->

1. **List the reconciliation's read and permissions:**

   ```bash
   python python/graph_export.py --task contractor-reconcile --list
   ```

   ```text
   Task contractor-reconcile: User-LifeCycleInfo.Read.All, User.Read.All
     GET /users  [User-LifeCycleInfo.Read.All, User.Read.All]
   ```

   <!-- capture:begin 02-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/hr/02-1.txt))](captures/02-1.png){.lightbox fig-alt="Terminal window showing python python/graph_export.py --task contractor-reconcile --list and what it printed"}

   <!-- capture:end -->

2. **Compute the earliest ends and write the extract:**

   ```bash
   python python/contractor_source.py extract --register tests/fixtures/ch02/contractor-register.csv --cards tests/fixtures/ch02/cards.csv \
       --sponsors tests/fixtures/ch02/hr-sponsors.csv --rules config/contractor-rules.json --as-of 2026-11-01 --out out/ch02/extract
   ```

   ```text
   Contractors: 9 records: 3 active, 4 inactive (past their earliest end), 2 quarantined
   Source: 2 Finding, 1 Warn, 1 Info
   Extract written to out/ch02/extract/contractors-extract.csv; build the SCIM requests with examples/hcm-entra/python/hcm_to_scim.py
   ```

   <!-- capture:begin 02-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/hr/02-2.txt))](captures/02-2.png){.lightbox fig-alt="Terminal window showing python python/contractor_source.py extract --register tests/fixtures/ch02/con… and what it printed"}

   <!-- capture:end -->

   The exit code is 2, because the run has a Finding or a Warn; see the exit codes in the kit's README.

3. **Read the decisions:**

   ```bash
   python -c "import json; [print(d['PersonKey'], d['Action'], d['EarliestEnd'], d['Reason']) for d in json.load(open('out/ch02/extract/decisions.json'))]"
   ```

   ```text
   900001 active 2027-01-11 contract end
   900002 inactive 2026-10-15 completion date
   900003 inactive 2026-10-20 suitability withdrawn
   900004 inactive 2026-10-30 sponsor gone past the grace period
   900005 inactive 2026-10-25 sponsor recertification due
   900006 active 2026-11-10 contract end
   900007 quarantine  no contract end
   900008 quarantine 2027-03-31 contract end
   900009 active 2027-03-01 sponsor recertification due
   ```

   <!-- capture:begin 02-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/hr/02-3.txt))](captures/02-3.png){.lightbox fig-alt="Terminal window showing python -c 'import json; [print(d['PersonKey'], d['Action'], d['EarliestEnd'],… and what it printed"}

   <!-- capture:end -->

   900007 has no contract end (CS-01); 900008's sponsor isn't in the HR export (CS-02). 900004's sponsor separated on September 30, so the 30-day grace period ends October 30 (CS-03). 900005's card expired October 28, but its sponsor recertification was due October 25, which comes first.

4. **Build the SCIM requests with the middleware:**

   ```bash
   python ../hcm-entra/python/hcm_to_scim.py --extract out/ch02/extract/contractors-extract.csv --as-of 2026-11-01 --out out/ch02/scim
   ```

   ```text
   {"counts": {"ready": 7}, "batches": 1, "disables": 4, "held": false, "hold_reason": ""}
   ```

   <!-- capture:begin 02-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/hr/02-4.txt))](captures/02-4.png){.lightbox fig-alt="Terminal window showing python ../hcm-entra/python/hcm_to_scim.py --extract out/ch02/extract/contract… and what it printed"}

   <!-- capture:end -->

   Seven records in one batch, four of them disables. `out/ch02/scim/bulk-request-001.json` sends 900002, 900003, 900004 and 900005 with `active` false. Nothing is sent: the middleware's dry run is its default.

5. **Reconcile the register, the cards and the directory:**

   ```bash
   python python/contractor_source.py reconcile --register tests/fixtures/ch02/contractor-register.csv --cards tests/fixtures/ch02/cards.csv \
       --sponsors tests/fixtures/ch02/hr-sponsors.csv --accounts tests/fixtures/ch02/contractor-users.json --rules config/contractor-rules.json \
       --as-of 2026-11-01 --cloud gcc --out out/ch02/reconcile
   python -c "import json; [print(r['Rule'], r['Severity'], r['Object'], '|', r['Issue']) for r in json.load(open('out/ch02/reconcile/findings.json'))]"
   ```

   ```text
   Reconciliation: 7 Finding, 1 Warn, 0 Info
   Written to out/ch02/reconcile (manifest.json lists every file's SHA-256)
   CR-01 Finding bailey.ortiz@contoso.example | enabled past its earliest end 2026-10-15 (completion date)
   CR-01 Finding cameron.wu@contoso.example | enabled past its earliest end 2026-10-20 (suitability withdrawn)
   CR-01 Finding devon.hale@contoso.example | enabled past its earliest end 2026-10-30 (sponsor gone past the grace period)
   CR-01 Finding ellis.ward@contoso.example | enabled past its earliest end 2026-10-25 (sponsor recertification due)
   CR-02 Finding temp.vendor@contoso.example | enabled contractor account with no register record (orphan)
   CR-03 Finding 900011 | active card for a person the contractor source doesn't hold (contractor credential drift)
   CR-05 Finding finley.moss@contoso.example | employeeLeaveDateTime 2026-12-10 isn't the earliest end 2026-11-10; the leaver workflow fires on the wrong day
   CR-04 Warn indy.shah@contoso.example | active register record with no account
   ```

   <!-- capture:begin 02-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/hr/02-5.txt))](captures/02-5.png){.lightbox fig-alt="Terminal window showing python python/contractor_source.py reconcile --register tests/fixtures/ch02/c… and what it printed"}

   <!-- capture:end -->

   The four CR-01 accounts are the four disables in step 4: once the requests are sent, the next reconciliation shows none, which is the guide's evidence for the gate.

6. **Write the sponsor review settings:**

   ```bash
   python python/contractor_source.py review --rules config/contractor-rules.json --out out/ch02/review
   ```

   <!-- capture:begin 02-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/hr/02-6.txt))](captures/02-6.png){.lightbox fig-alt="Terminal window showing python python/contractor_source.py review --rules config/contractor-rules.jso… and what it printed"}

   <!-- capture:end -->

   `Review settings written to out/ch02/review/assignment-policy-review.json for review; nothing was sent`. The block has `expirationBehavior` `removeAccess`, the requestor's manager at level 1 as primary reviewer, and an `absoluteMonthly` recurrence with interval 6.

7. **Run the tests:**

   ```bash
   python -m pytest tests -q
   ```

   <!-- capture:begin 02-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/hr/02-7.txt))](captures/02-7.png){.lightbox fig-alt="Terminal window showing python -m pytest tests -q and what it printed"}

   <!-- capture:end -->

**Expected result:** `57 passed`. Delete `out` when you're done:

```bash
rm -rf out
```

<!-- capture:begin 02-8 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/hr/02-8.txt))](captures/02-8.png){.lightbox fig-alt="Terminal window showing rm -rf out and what it printed"}

<!-- capture:end -->

## Lab 2: test tenant

*Not run by the authors.* Use a test tenant in the worldwide or GCC cloud, never production. Work in `examples/hr-lifecycle`. You'll need `my-register.csv`, `my-cards.csv` and `my-sponsors.csv`: your test contractors, their cards and their sponsors, in the layout of the files in `tests/fixtures/ch02`. You'll replace: `<today>` (today's date, `yyyy-mm-dd`), `<provisioning-api-endpoint>` (the **Provisioning API Endpoint** on the contractor provisioning app's overview page), `<scim-token>` (a bearer token for `graph.microsoft.com` issued to the middleware's identity), `<graph-token>` (a bearer token for `graph.microsoft.com` issued to the reader app), `<tenant-id>` (the test tenant's ID) and `<policy-id>` (the ID of the test contractor package's assignment policy).

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/hr-lifecycle`. Each step below says what it does and what to look for.

In a POSIX shell (Git Bash on Windows):

```bash
# Step 2: Send two test contractors
python python/contractor_source.py extract --register my-register.csv --cards my-cards.csv --sponsors my-sponsors.csv --rules config/contractor-rules.json --as-of <today> --out out/ch02-test-extract
cp ../hcm-entra/config/settings.example.json ../hcm-entra/config/settings.json
python -c "import json; p='../hcm-entra/config/settings.json'; d=json.load(open(p)); d['endpoint'] = '<provisioning-api-endpoint>'; json.dump(d, open(p, 'w'), indent=2)"
export HCM_ENTRA_BEARER_TOKEN='<scim-token>'
python ../hcm-entra/python/hcm_to_scim.py --extract out/ch02-test-extract/contractors-extract.csv --settings ../hcm-entra/config/settings.json --as-of <today> --out out/ch02-test-scim --apply
python -c "import json; [print(r['batch'], r['status'], r['provisioning_logs']) for r in json.load(open('out/ch02-test-scim/apply-results.json'))]"

# Step 3: Reconcile against the tenant
export HRLC_GRAPH_TOKEN='<graph-token>'
python python/graph_export.py --task contractor-reconcile --cloud gcc --out exports/ch02
python python/contractor_source.py reconcile --register my-register.csv --cards my-cards.csv --sponsors my-sponsors.csv \
    --accounts exports/ch02/contractor-users.json --rules config/contractor-rules.json --as-of <today> --cloud gcc --out out/ch02-test
```

In PowerShell 7:

```powershell
# Step 4: Apply the review settings to a test contractor package
python python/contractor_source.py review --rules config/contractor-rules.json --out out/ch02-test-review
Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes EntitlementManagement.ReadWrite.All
$uri = 'https://graph.microsoft.com/v1.0/identityGovernance/entitlementManagement/assignmentPolicies/<policy-id>'
$before = Invoke-MgGraphRequest -Method GET -Uri $uri
$before.Remove('@odata.context')
$before | ConvertTo-Json -Depth 20 | Set-Content policy-before.json
$body = Get-Content policy-before.json -Raw | ConvertFrom-Json -AsHashtable
$body['reviewSettings'] = (Get-Content out/ch02-test-review/assignment-policy-review.json -Raw | ConvertFrom-Json -AsHashtable)['reviewSettings']
$body | ConvertTo-Json -Depth 20 | Set-Content policy-new.json

# Step 4: Apply the review settings to a test contractor package
Set-MgEntitlementManagementAssignmentPolicy -AccessPackageAssignmentPolicyId <policy-id> -BodyParameter (Get-Content policy-new.json -Raw | ConvertFrom-Json -AsHashtable)
(Invoke-MgGraphRequest -Method GET -Uri $uri).reviewSettings.primaryReviewers | ConvertTo-Json -Depth 5

# Step 4: Apply the review settings to a test contractor package
Invoke-MgGraphRequest -Method GET -Uri $uri | ConvertTo-Json -Depth 20 | Set-Content policy-portal.json

# Step 5: Back it out
Set-MgEntitlementManagementAssignmentPolicy -AccessPackageAssignmentPolicyId <policy-id> -BodyParameter (Get-Content policy-before.json -Raw | ConvertFrom-Json -AsHashtable)
```

In a POSIX shell (Git Bash on Windows):

```bash
# Step 5: Back it out
rm -rf exports/ch02 out/ch02-test out/ch02-test-extract out/ch02-test-scim out/ch02-test-review policy-before.json policy-new.json policy-portal.json
```

:::

<!-- labs:end -->

1. **Set up the contractor provisioning app** as Learn's API-driven inbound provisioning procedure describes, with the attribute mappings `examples/hcm-entra` documents, and grant the middleware's identity `SynchronizationData-User.Upload.OwnedBy` on that app only.[^hw02-bulk]
2. **Send two test contractors** through the middleware's apply path, as Book 19, Chapter 01's Lab 2 describes: one active, one past its end. The commands write the extract from your files, put the endpoint in the middleware's settings, send the batch, and print each batch's status and the `Location` header it returned:

   ```bash
   python python/contractor_source.py extract --register my-register.csv --cards my-cards.csv --sponsors my-sponsors.csv --rules config/contractor-rules.json --as-of <today> --out out/ch02-test-extract
   cp ../hcm-entra/config/settings.example.json ../hcm-entra/config/settings.json
   python -c "import json; p='../hcm-entra/config/settings.json'; d=json.load(open(p)); d['endpoint'] = '<provisioning-api-endpoint>'; json.dump(d, open(p, 'w'), indent=2)"
   export HCM_ENTRA_BEARER_TOKEN='<scim-token>'
   python ../hcm-entra/python/hcm_to_scim.py --extract out/ch02-test-extract/contractors-extract.csv --settings ../hcm-entra/config/settings.json --as-of <today> --out out/ch02-test-scim --apply
   python -c "import json; [print(r['batch'], r['status'], r['provisioning_logs']) for r in json.load(open('out/ch02-test-scim/apply-results.json'))]"
   ```

   Read the provisioning log entry each `Location` header points to, and confirm the second account is disabled and both carry the leave date.
3. **Reconcile against the tenant,** with a token for `graph.microsoft.com` in `HRLC_GRAPH_TOKEN` for an app holding `User.Read.All` and `User-LifeCycleInfo.Read.All`:

   ```bash
   export HRLC_GRAPH_TOKEN='<graph-token>'
   python python/graph_export.py --task contractor-reconcile --cloud gcc --out exports/ch02
   python python/contractor_source.py reconcile --register my-register.csv --cards my-cards.csv --sponsors my-sponsors.csv \
       --accounts exports/ch02/contractor-users.json --rules config/contractor-rules.json --as-of <today> --cloud gcc --out out/ch02-test
   ```

   There should be no CR-01 for the account step 2 disabled.
4. **Apply the review settings to a test contractor package.** In PowerShell 7 with Graph PowerShell, the commands write the review settings, read the policy back into `policy-before.json` (your read-back), and write `policy-new.json`: the read-back with `reviewSettings` from `assignment-policy-review.json` merged in:

   ```powershell
   python python/contractor_source.py review --rules config/contractor-rules.json --out out/ch02-test-review
   Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes EntitlementManagement.ReadWrite.All
   $uri = 'https://graph.microsoft.com/v1.0/identityGovernance/entitlementManagement/assignmentPolicies/<policy-id>'
   $before = Invoke-MgGraphRequest -Method GET -Uri $uri
   $before.Remove('@odata.context')
   $before | ConvertTo-Json -Depth 20 | Set-Content policy-before.json
   $body = Get-Content policy-before.json -Raw | ConvertFrom-Json -AsHashtable
   $body['reviewSettings'] = (Get-Content out/ch02-test-review/assignment-policy-review.json -Raw | ConvertFrom-Json -AsHashtable)['reviewSettings']
   $body | ConvertTo-Json -Depth 20 | Set-Content policy-new.json
   ```

   Review `policy-new.json`, then send it with `Set-MgEntitlementManagementAssignmentPolicy`,[^hw02-set] and read the primary reviewers back:

   ```powershell
   Set-MgEntitlementManagementAssignmentPolicy -AccessPackageAssignmentPolicyId <policy-id> -BodyParameter (Get-Content policy-new.json -Raw | ConvertFrom-Json -AsHashtable)
   (Invoke-MgGraphRequest -Method GET -Uri $uri).reviewSettings.primaryReviewers | ConvertTo-Json -Depth 5
   ```

   Confirm the reviewer is the manager. If the service refuses `requestorManager` as a reviewer, set **Manager** as reviewer in the admin center as Learn's procedure shows,[^hw02-ar] export the policy, and record the subject set it uses:

   ```powershell
   Invoke-MgGraphRequest -Method GET -Uri $uri | ConvertTo-Json -Depth 20 | Set-Content policy-portal.json
   ```

5. **Back it out.** Restore the policy's previous `reviewSettings` from your read-back:

   ```powershell
   Set-MgEntitlementManagementAssignmentPolicy -AccessPackageAssignmentPolicyId <policy-id> -BodyParameter (Get-Content policy-before.json -Raw | ConvertFrom-Json -AsHashtable)
   ```

   Pause the provisioning job (a paused job keeps its state), delete the test contractors, and remove the permissions. Then delete `exports/ch02` and `out/ch02-test`, with the lab's other output folders and policy files:

   ```bash
   rm -rf exports/ch02 out/ch02-test out/ch02-test-extract out/ch02-test-scim out/ch02-test-review policy-before.json policy-new.json policy-portal.json
   ```

## Verified facts

| Item | Value | US Government clouds | Stage | Source |
|---|---|---|---|---|
| Perform bulkUpload | `POST /servicePrincipals/{id}/synchronization/jobs/{jobId}/bulkUpload`; `application/scim+json`; 50 operations per request; 40 requests per second; `202 Accepted` with a `Location` header to the provisioning logs | No national cloud table on the page; API-driven inbound provisioning listed as available in Azure Government | v1.0 | [^hw02-bulk] [^hw02-feat] |
| bulkUpload permissions | Application: `SynchronizationData-User.Upload.OwnedBy` (least), `SynchronizationData-User.Upload`; delegated: `SynchronizationData-User.Upload`, for a User Administrator | — | v1.0 | [^hw02-bulk] |
| Matching and state | Matching attributes per the job's mapping; `active` false disables; `manager.value` is the manager's `externalId` | — | v1.0 | [^hw02-bulk] |
| Review settings | `isEnabled`, `primaryReviewers`, `fallbackReviewers`, `schedule`, `expirationBehavior` (`keepAccess`, `removeAccess`, `acceptAccessRecommendation`) | Access reviews available in Azure Government | v1.0 | [^hw02-review] [^hw02-feat] |
| Access review of a package (procedure) | Monthly, quarterly, bi-annual or annual; Manager as reviewer with a fallback; no response: no change, remove access or take recommendations | — | GA | [^hw02-ar] |
| requestorManager | A subject set for a requestor's manager, `managerLevel` 1 or 2, documented for approval stages | — | v1.0 | [^hw02-mgr] |
| Update an assignment policy | `Set-MgEntitlementManagementAssignmentPolicy`, `EntitlementManagement.ReadWrite.All` | — | v1.0 | [^hw02-set] |
| List users with leave date | `User.Read.All` with `User-LifeCycleInfo.Read.All` | — | v1.0 | Carried from the validation kit's VK-HR-05 |

Places Learn's pages differ or say nothing:

- **`requestorManager` as a reviewer.** Learn documents it for approvals, and the portal offers Manager as a reviewer, but no v1.0 page shows the subject set in `reviewSettings`. Lab 2 confirms it.
- **bulkUpload in the national clouds.** The API page has no table; the feature availability page lists API-driven inbound provisioning in Azure Government. The program reads that as the API being available there.

## Federal requirements and evidence

This chapter helps prove the guide's [Gate 2](../../../books/guides/hr-driven-identity-implementation.md#step-2-bring-in-employees-and-contractors-from-their-sources); its requirements table is the source, and the [federal framework crosswalk](../../../reference/federal-framework-crosswalk.md) lists every federal source.

| Requirement | What this code gives | What the ISSO keeps |
|---|---|---|
| NIST SP 800-53 AC-2 and PS-7, Moderate | The decisions with each earliest end and its reason; the read-only reconciliation, run before the contractor leaver ships and again after, with zero CR-01 | Both reconciliation output folders with their manifests; end-date-to-block intervals from Chapter 06 |
| IA-4(4) | Worker type `C` on every record, mapped to `CTR` by the middleware | The extract and the middleware's provenance manifest |
| OMB M-22-09 and M-19-17 | The register as one named source per fact | The authority-per-fact table, signed by the governance body (not produced by code) |
| Privacy Act basis for each contractor record flow | — | The privacy office's determination for the register and the card system |

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A trusted spreadsheet end date | Access outlives the engagement | The earliest end from every condition; CR-01 |
| An open-ended contractor | No leaver ever fires | CS-01 quarantines the record |
| A sponsor who left | Nobody is accountable for the contractor | CS-03, and the end after the grace period |
| A missed recertification | Access stays because no one answered | `removeAccess` on no response, and the recertification date as an end condition |
| A leave date in the directory that drifted | The leaver workflow fires on the wrong day | CR-05 |
| A card for someone the source doesn't hold | A credential works for a person nobody sponsors | CR-03, and Chapter 07's contractor credential drift |
| A second SCIM client | Two writers, two sets of validation | The extract goes through `examples/hcm-entra`; the register names one writer (Chapter 01) |

## Checklist

- [ ] The contractor source is named (D-I3), and its owner signed the authority table.
- [ ] `config/contractor-rules.json` holds the agency's grace period and recertification cycle.
- [ ] The extract runs on the same schedule as the middleware, and quarantined records have an owner.
- [ ] The reconciliation ran before the contractor leaver shipped, and again after, with zero CR-01.
- [ ] The contractor package's policy has the review settings, with a named fallback reviewer, confirmed by read-back.
- [ ] The middleware's identity holds `SynchronizationData-User.Upload.OwnedBy` on the contractor app only.
- [ ] The privacy office's determination covers the register and the card system flows.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 01 — The Writer Register as Code](01-the-writer-register-as-code.md) · [Workbook index](index.md) · [Next: Chapter 03 — Joiner Workflows as Code and the Temporary Access Pass Bridge →](03-joiner-workflows-as-code.md)
:::

[^hw02-bulk]: Microsoft Learn, "Perform bulkUpload," permissions, HTTP request, response and examples, <https://learn.microsoft.com/graph/api/synchronization-synchronizationjob-post-bulkupload?view=graph-rest-1.0> (read November 1, 2026).
[^hw02-feat]: Microsoft Learn, "Microsoft Entra feature availability," <https://learn.microsoft.com/entra/identity/authentication/feature-availability> (read November 1, 2026; carried from the HR-driven identity implementation guide's verification log).
[^hw02-review]: Microsoft Learn, "accessPackageAssignmentReviewSettings resource type," <https://learn.microsoft.com/graph/api/resources/accesspackageassignmentreviewsettings?view=graph-rest-1.0> (read November 1, 2026).
[^hw02-ar]: Microsoft Learn, "Create an access review of an access package in entitlement management," <https://learn.microsoft.com/entra/id-governance/entitlement-management-access-reviews-create> (read November 1, 2026; carried from the HR-driven identity implementation guide's verification log).
[^hw02-mgr]: Microsoft Learn, "requestorManager resource type," <https://learn.microsoft.com/graph/api/resources/requestormanager?view=graph-rest-1.0> (read November 1, 2026).
[^hw02-set]: Microsoft Learn, "Set-MgEntitlementManagementAssignmentPolicy," permissions and example, <https://learn.microsoft.com/powershell/module/microsoft.graph.identity.governance/set-mgentitlementmanagementassignmentpolicy?view=graph-powershell-1.0> (read November 1, 2026).
