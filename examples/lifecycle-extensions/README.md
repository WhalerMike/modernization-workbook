# Lifecycle Workflows custom task extensions

One reusable Logic App per integration, called by Microsoft Entra ID Governance Lifecycle Workflows through a custom task extension, with its own managed identity and a callback that resumes the task. It is the code for the [developer workbook *Building the Attribute-Driven Migration*, Chapter 05](../../docs/project-plans/developer-workbooks/attribute-driven-migration/05-lifecycle-workflows-custom-extensions.md).

Illustrative: tested against fixtures and fakes, not proven against a production tenant. Nothing here signs in or sends a request off the machine.

## Start with Microsoft's sample

Learn publishes the Logic App definition a custom task extension needs, inside the page [Configure a Logic App for Lifecycle Workflow use](https://learn.microsoft.com/entra/id-governance/configure-logic-app-lifecycle-workflows). Microsoft publishes no GitHub sample, ARM template or Bicep file for it. A pinned, unmodified copy of the page is in [`../third_party/lifecycle-workflows-logic-app`](../third_party/lifecycle-workflows-logic-app/SNAPSHOT.md). `tests/test_learn_sample.py` extracts the definition from the pinned page and runs it against the fakes:

| Learn's definition, run as published | What this example adds |
|---|---|
| Keeps the trigger schema Lifecycle Workflows sends | Kept unchanged; a test compares the two |
| Calls back to `graph.microsoft.com/beta`, hard-coded | `graphHost` parameter with the three US-relevant Graph roots; callback on v1.0 |
| Uses `callbackUriPath` as it arrives | `Check_request` refuses a malformed path or a missing subject before any call |
| Always reports `Completed` | Reports `completed` or `failed` from the integration call's status |
| Work added before the callback that fails leaves no callback | `Resume` runs after success, failure or time-out |
| A repeat delivery repeats the work | `Idempotency-Key` from the task processing result ID |
| The subject's name, UPN and email show in run history | Trigger outputs and HTTP inputs and outputs secured |
| Default retry policy, implicit | Explicit bounded retry; the lint checks it fits inside the callback timeout |
| Authorization policy set by hand in the portal | `accessControl` built from the registry: SAS off, Learn's PoP policy |

## Layout

```
logicapp/integration.workflow.json   the reusable Logic App definition (code view shape)
config/integrations.json             the registry: one entry per integration (cloud, Logic App, workflows, extension settings)
tools/wdl.py                         a small offline interpreter for the Workflow Definition Language subset used here
tools/lcwext.py                      lint, run against fakes, build the ARM resource and extension body, check read-backs
tests/test_wdl.py                    the interpreter
tests/test_learn_sample.py           Learn's definition, unmodified, against the fakes
tests/test_extension.py              this example's definition, registry, builders and checks
tests/fixtures/                      a fictional trigger payload and Graph read-backs for contoso.example
```

## Run

Python 3.10 or later; no packages, tenant or network:

```
python tools/lcwext.py learn-sample
python tools/lcwext.py lint out/learn-sample.workflow.json --timeout PT1H
python tools/lcwext.py lint logicapp/integration.workflow.json --timeout PT1H
python tools/lcwext.py run logicapp/integration.workflow.json tests/fixtures/trigger-leaver.json --cloud GCCHigh --fail 503,503
python tools/lcwext.py build config/integrations.json --name cms-revocation --tenant-id <tenant-guid>
python -m unittest discover -s tests -v
```

Exit codes: 0 passed, 2 findings, 1 error. Generated files go to `out/` (ignored by Git).

## Lint rules

| Rule | Severity | Checks |
|---|---|---|
| LX-01 | Finding | One Request trigger of kind Http |
| LX-02 | Finding | The trigger schema has Learn's fields (`callbackUriPath`, `subject`, `taskProcessingResult`, `workflow`) |
| LX-03 | Finding | No hard-coded Graph host; the host comes from a parameter |
| LX-04 | Finding | The callback uses v1.0, not `/beta` |
| LX-05 | Finding | The callback authenticates with the Logic App's managed identity |
| LX-06 | Finding | `callbackUriPath` is checked by an If action before the callback uses it |
| LX-07 | Finding | The callback also runs when the work fails or times out |
| LX-08 | Finding | The reported status is computed, not a literal |
| LX-09 | Finding | Each downstream call carries an `Idempotency-Key` from the task processing result ID |
| LX-10 | Warn | Trigger outputs and HTTP inputs and outputs are secured in run history |
| LX-11 | Finding or Warn | An explicit, bounded retry policy whose worst-case waits fit inside the callback timeout |
| LX-12 | Warn | Only the object ID goes downstream, not name, UPN, email or manager (design guidance) |

`check-extension` (CX-01 to CX-05) compares a custom task extension read back from Graph with the registry; `check-workflow` (WX-01 to WX-05) checks a workflow read back from Graph against Book 03's leaver order.

## What the fakes decide

The fakes stand in for services whose behavior Learn documents only in part. `FakeGraph` accepts a resume only with a managed identity token for its own cloud and only once per task processing result; how the real service answers a second resume isn't documented. `FakeIntegration` honors `Idempotency-Key`, which is a contract this example asks the downstream system to keep, not a Microsoft behavior. The `callbackUriPath` in the fixture follows the resume path in the Graph API reference; the exact value Lifecycle Workflows sends isn't documented, and Lab 2 records a real one.
