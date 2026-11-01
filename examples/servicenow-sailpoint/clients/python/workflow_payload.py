"""Show what an ISC workflow's HTTP Request step would post for a sample event, and check it.

Reads sailpoint/workflows/drift-to-servicenow.json, picks the workflow for a
trigger, and resolves its request body against a saved trigger input the way
the workflow's `.$` keys say to (`"account_id.$": "$.account.id"` takes the
value at that path). Then it:

  * derives the intended state the Scripted REST script would store
    (a native change reverted; an attribute change kept), mirroring the
    script's own derivation;
  * checks the payload against the data contract (finding_contract.py);
  * lists the input's top-level fields the workflow doesn't send, so a
    field SailPoint adds, or one the workflow forgot, is seen.

Only simple paths are resolved (`$`, `$.a`, `$.a.b`); anything else is
refused, because this is not a JSONPath engine. Whether the HTTP Request
step resolves `.$` keys inside its JSON body, and whether the input sits at
`$` or `$.trigger`, are on the kit README's verify list. Illustrative and
offline: it calls no network.

Examples (from the kit root):

  # The native-change workflow, against the fictional sample event
  python clients/python/workflow_payload.py --trigger idn:native-change-account-updated --event tests/fixtures/events/native-change-account-updated.json

  # The closure signal for a provisioning event, as JSON
  python clients/python/workflow_payload.py --trigger idn:post-provisioning --event tests/fixtures/events/provisioning-completed.json --json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any, Mapping

import finding_contract as fc

KIT = Path(__file__).resolve().parents[2]
WORKFLOWS = KIT / "sailpoint" / "workflows" / "drift-to-servicenow.json"
SIMPLE_PATH = re.compile(r"^\$(\.[A-Za-z_][A-Za-z0-9_]*)*$")


class PayloadError(Exception):
    """A workflow or event this tool can't resolve."""


def load_workflows(path: Path | str = WORKFLOWS) -> list[dict]:
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def workflow_for(workflows: list[dict], trigger_id: str) -> dict:
    found = [w for w in workflows if w["trigger"]["attributes"].get("id") == trigger_id]
    if len(found) != 1:
        raise PayloadError(f"Expected one workflow for trigger {trigger_id!r}, found {len(found)}")
    return found[0]


def http_body(workflow: Mapping[str, Any]) -> dict:
    for step in workflow["definition"]["steps"].values():
        if step.get("actionId") == "sp:http":
            return step["attributes"]["jsonRequestBody"]
    raise PayloadError(f"{workflow['name']}: no HTTP Request step")


def resolve_path(event: Any, path: str) -> Any:
    if not SIMPLE_PATH.match(path):
        raise PayloadError(f"Only simple paths like $.a.b are resolved here, not {path!r}")
    value = event
    for part in path.split(".")[1:]:
        if not isinstance(value, Mapping) or part not in value:
            return None
        value = value[part]
    return value


def resolve_body(body: Mapping[str, Any], event: Mapping[str, Any]) -> tuple[dict, set[str]]:
    """(payload, top-level input fields the body reads)."""
    payload: dict[str, Any] = {}
    used: set[str] = set()
    for key, value in body.items():
        if key.endswith(".$"):
            payload[key[:-2]] = resolve_path(event, value)
            parts = value.split(".")
            if len(parts) > 1:
                used.add(parts[1])
        else:
            payload[key] = value
    return payload, used


def derive_intended_state(payload: Mapping[str, Any]) -> Any:
    """The intended state the Scripted REST script stores when the payload has none."""
    if payload.get("intended_state"):
        return payload["intended_state"]
    if payload.get("single_value_changes") is not None:
        intended: dict[str, Any] = {"attributes": {}, "entitlements_absent": [], "entitlements_present": []}
        for change in payload.get("single_value_changes") or []:
            intended["attributes"][change["name"]] = change.get("oldValue")
        for change in payload.get("multi_value_changes") or []:
            for value in change.get("addedValues") or []:
                intended["entitlements_absent"].append({"attribute": change["name"], "value": value})
            for value in change.get("removedValues") or []:
                intended["entitlements_present"].append({"attribute": change["name"], "value": value})
        for change in payload.get("entitlement_changes") or []:
            for item in change.get("added") or []:
                intended["entitlements_absent"].append({"attribute": change["attributeName"], "value": item["value"]})
            for item in change.get("removed") or []:
                intended["entitlements_present"].append({"attribute": change["attributeName"], "value": item["value"]})
        return intended
    if isinstance(payload.get("changes"), list):
        return {"attributes": {c["attribute"]: c.get("newValue") for c in payload["changes"]}}
    return None


def build(trigger_id: str, event: Mapping[str, Any], workflows: list[dict] | None = None) -> dict:
    workflow = workflow_for(workflows or load_workflows(), trigger_id)
    payload, used = resolve_body(http_body(workflow), event)
    if payload.get("kind", "finding") == "finding" and not payload.get("intended_state"):
        payload["intended_state"] = derive_intended_state(payload)
        if isinstance(payload.get("changes"), list) and not payload.get("attribute"):
            payload["attribute"] = ",".join(c["attribute"] for c in payload["changes"])
    unmapped = sorted(k for k in event if not k.startswith("_") and k not in used)
    return {"workflow": workflow["name"], "payload": payload, "contract": fc.validate(payload),
            "unmapped_input_fields": unmapped}


def main(argv: list[str] | None = None, out=None) -> int:
    out = out or sys.stdout
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--trigger", required=True, help="Trigger ID, as in the workflow file")
    parser.add_argument("--event", required=True, help="A saved trigger input (JSON)")
    parser.add_argument("--workflows", default=str(WORKFLOWS), help="Workflow file (default: the kit's)")
    parser.add_argument("--json", action="store_true", help="Print the whole result as JSON")
    args = parser.parse_args(argv)
    with open(args.event, encoding="utf-8") as handle:
        event = json.load(handle)
    result = build(args.trigger, event, load_workflows(args.workflows))
    if args.json:
        print(json.dumps(result, indent=2, sort_keys=True), file=out)
    else:
        payload, contract = result["payload"], result["contract"]
        print(f"Workflow: {result['workflow']}", file=out)
        print(f"kind {payload.get('kind', 'finding')}, drift_class {payload.get('drift_class', '-')}, "
              f"system {payload.get('system', '-')}", file=out)
        if payload.get("intended_state") is not None:
            print("intended_state " + json.dumps(payload["intended_state"], sort_keys=True), file=out)
        if contract["ok"]:
            n = contract["normalized"]
            extra = "" if n["kind"] == "closure_signal" else f": {n['severity']}, priority {n['priority']}, key {n['dedupe_key']}"
            print("contract: accepted" + extra, file=out)
        else:
            print("contract: 400 " + "; ".join(contract["errors"]), file=out)
        for warning in contract["warnings"]:
            print("warning: " + warning, file=out)
        print("input fields not sent: " + (", ".join(result["unmapped_input_fields"]) or "none"), file=out)
    return 0 if result["contract"]["ok"] else 1


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
