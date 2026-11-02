"""Render the kit's three ISC workflows for one environment, and the synthetic test input for each.

The kit's sailpoint/workflows/drift-to-servicenow.json posts to an example
instance and carries placeholders. This prints one workflow, ready for
POST /v2025/workflows, with the environment's ServiceNow URL and token URL,
the owner and the finding writer's ServiceNow OAuth client ID from the settings file, and
"enabled": false (SailPoint creates workflows disabled in any case).

The client secret is never written to a file. With --secret-env NAME it is
read from that environment variable and goes to standard output only, to be
piped straight into curl; without it the placeholder stays, and the step
says so on standard error.

--test-input prints a body for POST /v2025/workflows/{id}/test built from the
kit's fictional event fixture with the synthetic worker's IDs, shaped so the
finding it raises has an intended state equal to the synthetic worker's
baseline: a later re-read can verify it.

Reads files only; it calls no network.

Examples (from the kit root):

  python deploy/render_workflows.py --settings tests/fixtures/deploy/environment.test.json --list
  python deploy/render_workflows.py --settings tests/fixtures/deploy/environment.test.json --index 1 --summary
  python deploy/render_workflows.py --settings deploy/environment.test.json --index 1 --secret-env SN_WORKFLOW_CLIENT_SECRET | curl ... --data-binary @-
"""

from __future__ import annotations

import argparse
import copy
import json
import os
import sys
from typing import Any

import deploy_common as dc

EVENT_FIXTURES = {
    "idn:native-change-account-updated": "native-change-account-updated.json",
    "idn:identity-attributes-changed": "identity-attributes-changed.json",
    "idn:post-provisioning": "provisioning-completed.json",
}


def _replace_urls(value: Any, base: str) -> Any:
    if isinstance(value, dict):
        return {k: _replace_urls(v, base) for k, v in value.items()}
    if isinstance(value, list):
        return [_replace_urls(v, base) for v in value]
    if isinstance(value, str) and value.startswith(dc.EXAMPLE_SN_BASE):
        return base + value[len(dc.EXAMPLE_SN_BASE):]
    return value


def render(settings: dc.Settings, index: int, secret: str | None = None) -> dict:
    workflows = dc.load_workflows()
    if not 1 <= index <= len(workflows):
        raise ValueError(f"--index must be 1 to {len(workflows)}")
    base = dc.kc.sn_base_url(settings.cfg)
    workflow = _replace_urls(copy.deepcopy(workflows[index - 1]), base)
    owner = settings.deploy.get("workflow_owner") or {}
    workflow["owner"] = {"type": "IDENTITY", "id": owner.get("id"), "name": owner.get("name")}
    workflow["enabled"] = False
    for step in workflow["definition"]["steps"].values():
        attributes = step.get("attributes") or {}
        if "oAuthClientId" in attributes:
            attributes["oAuthClientId"] = (settings.deploy.get("clients") or {}).get("finding_writer")
            if secret:
                attributes["oAuthClientSecret"] = secret
    return workflow


def test_input(settings: dc.Settings, index: int) -> dict:
    workflow = dc.load_workflows()[index - 1]
    trigger = workflow["trigger"]["attributes"]["id"]
    with open(dc.KIT / "tests" / "fixtures" / "events" / EVENT_FIXTURES[trigger], encoding="utf-8") as handle:
        event = json.load(handle)
    event.pop("_comment", None)
    syn = settings.synthetic
    attribute, baseline, changed = syn.get("attribute"), syn.get("baseline"), syn.get("changed")
    name = syn.get("name")
    if trigger == "idn:native-change-account-updated":
        # An out-of-band change from baseline to changed: the intended state reverts it to baseline.
        event["accountChangeTypes"] = ["ATTRIBUTES_CHANGED"]
        event["account"].update({"id": syn.get("account_id"), "name": name, "nativeIdentity": syn.get("native_identity"),
                                 "uuid": None})
        event["identity"] = {"id": syn.get("identity_id"), "name": name, "type": "IDENTITY"}
        event["source"] = {"id": syn.get("source_id"), "name": syn.get("source_name"), "type": "SOURCE"}
        event["singleValueAttributeChanges"] = [{"name": attribute, "oldValue": baseline, "newValue": changed}]
        event["entitlementChanges"] = []
        event["multiValueAttributeChanges"] = []
    elif trigger == "idn:identity-attributes-changed":
        # An HR change back to baseline: the intended state keeps it, so it equals the baseline.
        event["identity"] = {"id": syn.get("identity_id"), "name": name, "type": "IDENTITY"}
        event["changes"] = [{"attribute": attribute, "oldValue": changed, "newValue": baseline}]
    else:
        event["recipient"] = {"id": syn.get("identity_id"), "name": name, "type": "IDENTITY"}
        event["sources"] = syn.get("source_name")
        event["trackingNumber"] = "smoke-test-" + str(settings.deploy.get("change_record") or settings.environment)
        for request in event["accountRequests"]:
            request.update({"source": {"id": syn.get("source_id"), "name": syn.get("source_name"), "type": "SOURCE"},
                            "accountId": syn.get("native_identity"), "provisioningTarget": syn.get("source_name")})
    return {"input": event}


def main(argv: list[str] | None = None, out=None) -> int:
    out = out or sys.stdout
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--settings", required=True, help="The environment settings file (no secrets)")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--list", action="store_true", help="List the workflows by index")
    group.add_argument("--index", type=int, help="Print workflow N (1-3) for POST /v2025/workflows")
    group.add_argument("--test-input", type=int, metavar="N", help="Print the synthetic test body for workflow N")
    parser.add_argument("--secret-env", help="With --index: the environment variable holding the ServiceNow OAuth "
                                             "client secret the workflow posts with (standard output only)")
    parser.add_argument("--summary", action="store_true", help="With --index: print what changed, not the JSON")
    args = parser.parse_args(argv)
    settings = dc.load_settings(args.settings)
    left = settings.placeholders()
    if left:
        print("error: placeholders left in the settings file: " + ", ".join(left), file=sys.stderr)
        return 2
    workflows = dc.load_workflows()
    if args.list:
        for i, workflow in enumerate(workflows, 1):
            print(f"{i}  {workflow['trigger']['attributes']['id']:<36} {workflow['name']}", file=out)
        return 0
    if args.test_input:
        print(json.dumps(test_input(settings, args.test_input), indent=2), file=out)
        return 0
    secret = None
    if args.secret_env:
        secret = os.environ.get(args.secret_env)
        if not secret:
            print(f"error: {args.secret_env} is not set", file=sys.stderr)
            return 2
    try:
        workflow = render(settings, args.index, secret)
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    step = next(iter(workflow["definition"]["steps"].values()))
    attributes = step["attributes"]
    if args.summary:
        print(f"workflow {args.index}: {workflow['name']}", file=out)
        print(f"  trigger      {workflow['trigger']['attributes']['id']}", file=out)
        print(f"  url          {attributes['url']}", file=out)
        print(f"  token url    {attributes['oAuthTokenUrl']}", file=out)
        print(f"  client id    {attributes['oAuthClientId']}", file=out)
        print(f"  secret       {'from ' + args.secret_env if secret else 'placeholder (pass --secret-env)'}", file=out)
        print(f"  owner        {workflow['owner']['name']} ({workflow['owner']['id']})", file=out)
        print(f"  enabled      {str(workflow['enabled']).lower()}", file=out)
        return 0
    if not secret:
        print("note: the client secret is still the placeholder; pass --secret-env to set it", file=sys.stderr)
    print(json.dumps(workflow, indent=2), file=out)
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
