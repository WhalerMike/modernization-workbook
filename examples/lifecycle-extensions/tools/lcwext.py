"""Lifecycle Workflows custom task extensions as code: lint a Logic App workflow definition,
run it offline against a fake Lifecycle Workflows service, a fake Microsoft Graph and a fake
downstream system, and build the deployment pieces (the Logic App resource with its
authorization policy, the custom task extension, the workflow task) from a reviewed registry.

Nothing here signs in or sends a request off the machine. Usage:

    python tools/lcwext.py learn-sample                    # extract Learn's definition from the pinned page
    python tools/lcwext.py lint <workflow.json> [--timeout PT1H]
    python tools/lcwext.py run <workflow.json> <payload.json> --cloud GCCHigh [--fail 503,503] [--deliveries 2]
    python tools/lcwext.py build <integrations.json> --name cms-revocation --tenant-id <guid>
    python tools/lcwext.py check-extension <integrations.json> --name cms-revocation <extension-get.json>
    python tools/lcwext.py check-workflow <integrations.json> --name cms-revocation <workflow-get.json>

Exit codes: 0 passed, 2 findings, 1 error.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import wdl  # noqa: E402

HERE = Path(__file__).resolve().parent.parent
LEARN_PAGE = HERE.parent / "third_party" / "lifecycle-workflows-logic-app" / "configure-logic-app-lifecycle-workflows.md"

# Graph root per tenant cloud (Learn, "Microsoft Graph national cloud deployments": GCC keeps
# the worldwide endpoints; GCC High and DoD have their own).
GRAPH_HOSTS = {
    "Global": "https://graph.microsoft.com",
    "GCC": "https://graph.microsoft.com",
    "GCCHigh": "https://graph.microsoft.us",
    "DoD": "https://dod-graph.microsoft.us",
}
ALL_GRAPH_HOSTS = ("graph.microsoft.com", "graph.microsoft.us", "dod-graph.microsoft.us")

# Learn's PoP authorization policy is documented for Azure commercial only (management.azure.com,
# sts.windows.net). For a Logic App in Azure Government, Learn gives no values, so the builder
# refuses rather than guess (research-gaps.md).
ARM_POP = {
    "AzureCloud": {"aud": "https://management.azure.com", "u": "management.azure.com", "iss": "https://sts.windows.net/{tenant}/"},
}
POP_POLICY_NAME = "AzureADLifecycleWorkflowsAuthPOPAuthPolicy"
# The appid row on Learn's page prints a documentation placeholder GUID; never deploy it.
PLACEHOLDER_GUIDS = {"00001111-aaaa-2222-bbbb-3333cccc4444"}

RUN_CUSTOM_TASK_EXTENSION = "4262b724-8dba-4fad-afc3-43fcbb497a0e"
DISABLE_USER_ACCOUNT = "1dfdfcc7-52fa-4c2e-bf3a-e3919cc12950"
REVOKE_REFRESH_TOKENS = "509589a4-0466-4471-829e-49c5e502bdee"

GUID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)
PERSONAL_FIELDS = ("userPrincipalName", "email", "displayName", "manager")


class BuildError(Exception):
    pass


@dataclass
class Finding:
    rule: str
    severity: str        # Finding, Warn, Info
    where: str
    issue: str

    def __str__(self) -> str:
        return f"{self.rule:6} {self.severity:7} {self.where:18} {self.issue}"


# --------------------------------------------------------------------------- Learn's sample

def learn_sample(page: Path = LEARN_PAGE) -> dict:
    """The workflow document in Learn's 'Configure a Logic App for Lifecycle Workflow use'
    page, parsed from the pinned page without changing a byte of it."""
    text = page.read_text(encoding="utf-8")
    m = re.search(r"```json\s*\n(.*?)\n\s*```", text, re.S)
    if not m:
        raise BuildError(f"no JSON block in {page}")
    return json.loads(m.group(1))


def learn_trigger_schema(page: Path = LEARN_PAGE) -> dict:
    return learn_sample(page)["definition"]["triggers"]["manual"]["inputs"]["schema"]


# --------------------------------------------------------------------------- lint

def _walk_actions(actions: dict, parent: str | None = None):
    for name, a in (actions or {}).items():
        yield name, a, parent
        if a.get("type") == "If":
            yield from _walk_actions(a.get("actions"), name)
            yield from _walk_actions((a.get("else") or {}).get("actions"), name)


def _text(obj) -> str:
    return json.dumps(obj)


def _upstream(name: str, actions_flat: dict, parents: dict) -> set[str]:
    """Every action that must have finished before `name` runs: runAfter, transitively,
    including the runAfter of enclosing If actions."""
    seen, todo = set(), [name]
    while todo:
        cur = todo.pop()
        a = actions_flat[cur]
        deps = list((a.get("runAfter") or {}).keys())
        if parents.get(cur):
            deps.append(parents[cur])
        for d in deps:
            if d not in seen:
                seen.add(d)
                todo.append(d)
    return seen


def _seconds(duration: str) -> int:
    return wdl._iso_seconds(duration)


def lint(doc: dict, callback_timeout: str | None = None) -> list[Finding]:
    d = doc.get("definition", doc)
    out: list[Finding] = []
    trig = d.get("triggers") or {}
    if len(trig) != 1 or next(iter(trig.values())).get("type") != "Request" or next(iter(trig.values())).get("kind") != "Http":
        out.append(Finding("LX-01", "Finding", "trigger", "needs exactly one Request trigger of kind Http"))
        return out
    (tname, t), = trig.items()
    schema = _text(t.get("inputs", {}).get("schema", {}))
    for field in ("callbackUriPath", "taskProcessingResult", "workflow", "subject"):
        if f'"{field}"' not in schema:
            out.append(Finding("LX-02", "Finding", tname, f"trigger schema lacks {field} (Learn's schema has it)"))

    flat, parents = {}, {}
    for name, a, parent in _walk_actions(d.get("actions")):
        flat[name], parents[name] = a, parent
    http = {n: a for n, a in flat.items() if a.get("type") == "Http"}
    callbacks = {n: a for n, a in http.items() if "callbackUriPath" in _text(a["inputs"].get("uri", ""))}
    calls = {n: a for n, a in http.items() if n not in callbacks}

    for name, a in flat.items():
        body = _text(a.get("inputs", {})) + _text(a.get("expression", {}))
        for host in ALL_GRAPH_HOSTS:
            if host in body:
                out.append(Finding("LX-03", "Finding", name, f"hard-codes {host}; take the Graph host from a parameter checked against the tenant's cloud"))
                break

    if not callbacks:
        out.append(Finding("LX-05", "Info", "actions", "no callback: fine for launch and continue, not for launch and wait"))
    for name, a in callbacks.items():
        inp = a["inputs"]
        if re.search(r"/beta(@|/|\b)", _text(inp.get("uri"))):
            out.append(Finding("LX-04", "Finding", name, "calls back on /beta; resume is in v1.0"))
        auth = inp.get("authentication") or {}
        if auth.get("type") != "ManagedServiceIdentity":
            out.append(Finding("LX-05", "Finding", name, "callback doesn't authenticate with the Logic App's managed identity"))
        gates = [g for g in _upstream(name, flat, parents)
                 if flat[g].get("type") == "If" and "callbackUriPath" in _text(flat[g].get("expression"))]
        if not gates:
            out.append(Finding("LX-06", "Finding", name, "uses callbackUriPath without checking it first"))
        after = a.get("runAfter") or {}
        if not after or not any("Failed" in s for s in after.values()):
            out.append(Finding("LX-07", "Finding", name, "no callback when the work fails; Lifecycle Workflows waits out the whole timeout"))
        status = (inp.get("body") or {}).get("data", {}).get("operationStatus", "")
        if isinstance(status, str) and not status.startswith("@"):
            out.append(Finding("LX-08", "Finding", name, f"always reports {status!r}, whatever happened"))

    for name, a in calls.items():
        headers = a["inputs"].get("headers") or {}
        key = next((v for k, v in headers.items() if k.lower() == "idempotency-key"), "")
        if "taskProcessingResult" not in _text(key):
            out.append(Finding("LX-09", "Finding", name, "no Idempotency-Key from the taskProcessingResult ID; a repeat delivery repeats the work"))
        if any(f'"{p}"' in _text(a["inputs"].get("body")) or f"['{p}']" in _text(a["inputs"].get("body")) for p in PERSONAL_FIELDS):
            out.append(Finding("LX-12", "Warn", name, "sends name, UPN, email or manager downstream; send the object ID only (design guidance)"))

    if "outputs" not in _text((t.get("runtimeConfiguration") or {}).get("secureData")):
        out.append(Finding("LX-10", "Warn", tname, "trigger outputs (the subject's name, UPN and email) show in run history; secure them"))
    for name, a in http.items():
        props = _text((a.get("runtimeConfiguration") or {}).get("secureData"))
        if "inputs" not in props or "outputs" not in props:
            out.append(Finding("LX-10", "Warn", name, "inputs or outputs not secured in run history"))

    worst = 0
    for name, a in http.items():
        pol = a["inputs"].get("retryPolicy")
        if pol is None:
            out.append(Finding("LX-11", "Warn", name, "no explicit retryPolicy; the Default policy applies (up to 4 retries)"))
        elif pol.get("type", "").lower() == "exponential" and "maximumInterval" not in pol:
            out.append(Finding("LX-11", "Finding", name, "exponential retry without maximumInterval can wait up to a day per retry"))
        worst += wdl.retry_budget(pol)[1]
    if callback_timeout and worst >= _seconds(callback_timeout):
        out.append(Finding("LX-11", "Finding", "retryPolicy", f"worst-case retry waits ({worst}s) reach the callback timeout {callback_timeout}"))
    return out


# --------------------------------------------------------------------------- fakes and a run

def callback_path(workflow_id: str, task_id: str, tpr_id: str) -> str:
    """The resume path for a task processing result, as the Graph API reference writes it.
    The exact callbackUriPath value Lifecycle Workflows sends isn't documented; Lab 2
    records a real one."""
    return (f"/identityGovernance/lifecycleWorkflows/workflows/{workflow_id}"
            f"/tasks/{task_id}/taskProcessingResults/{tpr_id}/resume")


class FakeGraph:
    """Microsoft Graph for one cloud: accepts a resume only with a managed identity token
    for its own host, for a task processing result that is in progress."""

    def __init__(self, host: str, in_progress: set[str]):
        self.host = host
        self.state = {t: "inProgress" for t in in_progress}
        self.calls: list[wdl.Request] = []

    def __call__(self, req: wdl.Request) -> wdl.Response:
        self.calls.append(req)
        auth = req.authentication or {}
        if auth.get("type") != "ManagedServiceIdentity" or auth.get("audience", "").rstrip("/") != self.host:
            return wdl.Response(401, {"error": "token audience doesn't match this cloud"})
        m = re.search(r"/taskProcessingResults/([^/]+)/resume$", req.uri)
        if not m or not re.match(re.escape(self.host) + r"/(v1\.0|beta)/identityGovernance/", req.uri):
            return wdl.Response(400, {"error": "not a resume call"})
        if self.state.get(m.group(1)) != "inProgress":
            return wdl.Response(404, {"error": "no task processing result in progress"})
        self.state[m.group(1)] = str((req.body or {}).get("data", {}).get("operationStatus", "")).lower()
        return wdl.Response(204)


class FakeIntegration:
    """The one downstream system: honors Idempotency-Key, and fails first with the
    status codes it is given."""

    def __init__(self, uri: str, fail_with: list[int] | None = None):
        self.uri = uri
        self.fail_with = list(fail_with or [])
        self.effects: list[dict] = []
        self.done: dict[str, dict] = {}
        self.calls = 0

    def __call__(self, req: wdl.Request) -> wdl.Response:
        self.calls += 1
        if self.fail_with:
            return wdl.Response(self.fail_with.pop(0), {"error": "unavailable"})
        key = next((v for k, v in (req.headers or {}).items() if k.lower() == "idempotency-key"), None)
        if key and key in self.done:
            return wdl.Response(200, self.done[key])
        self.effects.append(req.body)
        result = {"result": "done", "n": len(self.effects)}
        if key:
            self.done[key] = result
        return wdl.Response(200, result)


def router(graph: FakeGraph, integration: FakeIntegration | None, others: list | None = None):
    others = [] if others is None else others

    def send(req: wdl.Request) -> wdl.Response:
        if integration and req.uri.startswith(integration.uri):
            return integration(req)
        for host in ALL_GRAPH_HOSTS:
            if req.uri.startswith(f"https://{host}"):
                if req.uri.startswith(graph.host):
                    return graph(req)
                others.append(req)
                return wdl.Response(401, {"error": f"{host} isn't this tenant's cloud"})
        others.append(req)
        return wdl.Response(404)
    return send


@dataclass
class Outcome:
    runs: list
    task_status: str          # what Lifecycle Workflows records for the task
    graph: FakeGraph
    integration: FakeIntegration | None
    elsewhere: list


def simulate(doc: dict, payload: dict, cloud: str, parameters: dict | None = None,
             integration: FakeIntegration | None = None, deliveries: int = 1,
             timeout: str = "PT1H") -> Outcome:
    """Lifecycle Workflows starts the Logic App `deliveries` times with the same payload
    (a retry of the call, or a rerun) and waits for a resume until `timeout`."""
    d = doc.get("definition", doc)
    tpr = payload["data"]["taskProcessingResult"]["id"]
    graph = FakeGraph(GRAPH_HOSTS[cloud], {tpr})
    elsewhere: list = []
    send = router(graph, integration, elsewhere)
    runs = [wdl.run(d, payload, send, parameters) for _ in range(deliveries)]
    status = graph.state[tpr]
    task_status = status if status != "inProgress" else f"failed (no callback within {timeout})"
    return Outcome(runs, task_status, graph, integration, elsewhere)


# --------------------------------------------------------------------------- the registry and builders

def load_registry(path: Path) -> dict:
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def entry(registry: dict, name: str) -> dict:
    for e in registry["integrations"]:
        if e["name"] == name:
            return e
    raise BuildError(f"no integration named {name!r}")


def workflow_parameters(e: dict) -> dict:
    """Values for the Logic App definition's parameters, for this integration's tenant cloud."""
    return {
        "graphHost": GRAPH_HOSTS[e["tenantCloud"]],
        "integrationUri": e["integrationUri"],
        "integrationAudience": e["integrationAudience"],
        "operations": {w["workflowId"]: w["operation"] for w in e["workflows"]},
    }


def check_entry(e: dict) -> None:
    if e.get("tenantCloud") not in GRAPH_HOSTS:
        raise BuildError(f"{e['name']}: tenantCloud must be one of {sorted(GRAPH_HOSTS)}")
    ext = e["extension"]
    if ext.get("maximumRetries") not in (0, 1):
        raise BuildError(f"{e['name']}: maximumRetries must be 0 or 1 (Learn)")
    if not 200 <= int(ext.get("timeoutInMilliseconds", 1000)) <= 2000:
        raise BuildError(f"{e['name']}: timeoutInMilliseconds must be 200 to 2000 (Learn)")
    secs = _seconds(ext["timeoutDuration"])
    if not 30 * 60 <= secs <= 3 * 3600:
        raise BuildError(f"{e['name']}: timeoutDuration must be 30 minutes to 3 hours (Learn)")
    for w in e["workflows"]:
        if not GUID.match(w["workflowId"]):
            raise BuildError(f"{e['name']}: workflowId {w['workflowId']!r} isn't a GUID")
        if w["scenario"] not in ("joiner", "mover", "leaver"):
            raise BuildError(f"{e['name']}: scenario must be joiner, mover or leaver")


def build_access_control(e: dict, tenant_id: str) -> dict:
    """The Logic App's accessControl: SAS off, and Learn's PoP policy for Lifecycle Workflows."""
    if not GUID.match(tenant_id or ""):
        raise BuildError("tenant ID must be a GUID")
    app_id = e.get("lcwAppId", "")
    if app_id.lower() in PLACEHOLDER_GUIDS:
        raise BuildError("lcwAppId is the documentation placeholder printed on Learn's page; use the Lifecycle Workflows application ID")
    if not GUID.match(app_id):
        raise BuildError("lcwAppId must be a GUID")
    arm = ARM_POP.get(e["azureCloud"])
    if arm is None:
        raise BuildError(f"{e['name']}: Learn documents the PoP policy only for Azure commercial; "
                         f"no values for {e['azureCloud']} (research gap), so nothing is built")
    la = e["logicApp"]
    claims = [
        {"name": "iss", "value": arm["iss"].format(tenant=tenant_id)},
        {"name": "aud", "value": arm["aud"]},
        {"name": "appid", "value": app_id},
        {"name": "m", "value": "POST"},
        {"name": "u", "value": arm["u"]},
        {"name": "p", "value": f"/subscriptions/{la['subscriptionId']}/resourceGroups/{la['resourceGroup']}"
                                f"/providers/Microsoft.Logic/workflows/{la['name']}"},
    ]
    return {"triggers": {
        "sasAuthenticationPolicy": {"state": "Disabled"},
        "openAuthenticationPolicies": {"policies": {POP_POLICY_NAME: {"type": "AADPOP", "claims": claims}}},
    }}


def build_arm(e: dict, tenant_id: str, definition_doc: dict) -> dict:
    check_entry(e)
    la = e["logicApp"]
    params = workflow_parameters(e)
    return {
        "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
        "contentVersion": "1.0.0.0",
        "resources": [{
            "type": "Microsoft.Logic/workflows",
            "apiVersion": "2019-05-01",
            "name": la["name"],
            "location": la["location"],
            "identity": {"type": "SystemAssigned"},
            "properties": {
                "state": "Enabled",
                "definition": definition_doc.get("definition", definition_doc),
                "parameters": {k: {"value": v} for k, v in params.items()},
                "accessControl": build_access_control(e, tenant_id),
            },
        }],
    }


def build_extension(e: dict) -> dict:
    """The body for POST /identityGovernance/lifecycleWorkflows/customTaskExtensions (v1.0)."""
    check_entry(e)
    ext, la = e["extension"], e["logicApp"]
    return {
        "displayName": ext["displayName"],
        "description": ext["description"],
        "endpointConfiguration": {
            "@odata.type": "#microsoft.graph.logicAppTriggerEndpointConfiguration",
            "subscriptionId": la["subscriptionId"],
            "resourceGroupName": la["resourceGroup"],
            "logicAppWorkflowName": la["name"],
        },
        "authenticationConfiguration": {"@odata.type": "#microsoft.graph.azureAdPopTokenAuthentication"},
        "clientConfiguration": {
            "@odata.type": "#microsoft.graph.customExtensionClientConfiguration",
            "maximumRetries": ext["maximumRetries"],
            "timeoutInMilliseconds": ext["timeoutInMilliseconds"],
        },
        "callbackConfiguration": {
            "@odata.type": "#microsoft.graph.identityGovernance.customTaskExtensionCallbackConfiguration",
            "timeoutDuration": ext["timeoutDuration"],
        },
    }


def check_extension(e: dict, got: dict) -> list[Finding]:
    """Compare a custom task extension read back from Graph (GET) with the registry."""
    want = build_extension(e)
    out = []
    auth = (got.get("authenticationConfiguration") or {}).get("@odata.type", "")
    if auth != "#microsoft.graph.azureAdPopTokenAuthentication":
        out.append(Finding("CX-01", "Finding", "authentication", f"{auth or 'none'}: not proof-of-possession; create a new extension (Learn: can't be migrated)"))
    for k in ("subscriptionId", "resourceGroupName", "logicAppWorkflowName"):
        if (got.get("endpointConfiguration") or {}).get(k) != want["endpointConfiguration"][k]:
            out.append(Finding("CX-02", "Finding", "endpoint", f"{k} differs from the registry"))
    cb = got.get("callbackConfiguration") or {}
    if cb.get("timeoutDuration") != want["callbackConfiguration"]["timeoutDuration"]:
        out.append(Finding("CX-03", "Finding", "callback", f"timeoutDuration {cb.get('timeoutDuration')!r} differs from the registry"))
    if not cb.get("authorizedApps"):
        out.append(Finding("CX-04", "Finding", "callback", "no authorizedApps: the Logic App's identity can't resume without a tenant-wide permission"))
    cc = got.get("clientConfiguration") or {}
    for k in ("maximumRetries", "timeoutInMilliseconds"):
        if cc.get(k) != want["clientConfiguration"][k]:
            out.append(Finding("CX-05", "Finding", "client", f"{k} {cc.get(k)!r} differs from the registry"))
    return out


def build_task(extension_id: str, display_name: str, scenario: str) -> dict:
    """A 'Run a custom task extension' task for a workflow. In a leaver, the task continues
    on error so the access removals after it still run (design guidance)."""
    return {
        "taskDefinitionId": RUN_CUSTOM_TASK_EXTENSION,
        "displayName": display_name,
        "isEnabled": True,
        "continueOnError": scenario == "leaver",
        "arguments": [{"name": "customTaskExtensionID", "value": extension_id}],
    }


def check_workflow(e: dict, wf: dict, extension_id: str) -> list[Finding]:
    """Check a lifecycle workflow read back from Graph against Book 03's leaver order:
    block first (disable, then revoke refresh tokens), then the custom task."""
    out = []
    reg = {w["workflowId"]: w for w in e["workflows"]}
    w = reg.get(wf.get("id"))
    if w is None:
        return [Finding("WX-01", "Finding", "workflow", f"{wf.get('id')} isn't in the registry; this integration will send it a failed callback")]
    tasks = sorted(wf.get("tasks") or [], key=lambda t: t.get("executionSequence", 0))
    ids = [t.get("taskDefinitionId") for t in tasks]
    mine = [i for i, t in enumerate(tasks) if t.get("taskDefinitionId") == RUN_CUSTOM_TASK_EXTENSION
            and any(a.get("value") == extension_id for a in t.get("arguments") or [])]
    if not mine:
        return [Finding("WX-02", "Finding", "tasks", "no task runs this integration's custom task extension")]
    pos = mine[0]
    if w["scenario"] == "leaver":
        for needed, label in ((DISABLE_USER_ACCOUNT, "Disable user account"), (REVOKE_REFRESH_TOKENS, "Revoke all refresh tokens for user")):
            if needed not in ids or ids.index(needed) > pos:
                out.append(Finding("WX-03", "Finding", "tasks", f"'{label}' doesn't run before the custom task (Book 03: block first)"))
        if DISABLE_USER_ACCOUNT in ids and REVOKE_REFRESH_TOKENS in ids and ids.index(DISABLE_USER_ACCOUNT) > ids.index(REVOKE_REFRESH_TOKENS):
            out.append(Finding("WX-04", "Finding", "tasks", "revoke runs before disable; Microsoft's order is disable, then revoke"))
        if not tasks[pos].get("continueOnError"):
            out.append(Finding("WX-05", "Warn", "tasks", "custom task stops the workflow on failure; the access removals after it won't run (design guidance)"))
    return out


# --------------------------------------------------------------------------- CLI

def _show(path: Path) -> str:
    try:
        return Path(path).resolve().relative_to(HERE).as_posix()
    except ValueError:
        return str(path)


def _print(findings: list[Finding]) -> int:
    for f in findings:
        print(f)
    worst = {"Finding"} & {f.severity for f in findings}
    print(f"{len(findings)} result(s); {'findings' if worst else 'no findings'}")
    return 2 if worst else 0


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("learn-sample")
    s.add_argument("--out", default=str(HERE / "out" / "learn-sample.workflow.json"))
    s = sub.add_parser("lint")
    s.add_argument("workflow")
    s.add_argument("--timeout")
    s = sub.add_parser("run")
    s.add_argument("workflow")
    s.add_argument("payload")
    s.add_argument("--cloud", default="Global", choices=sorted(GRAPH_HOSTS))
    s.add_argument("--registry", default=str(HERE / "config" / "integrations.json"))
    s.add_argument("--name", default="cms-revocation")
    s.add_argument("--fail", default="", help="status codes the downstream returns first, e.g. 503,503")
    s.add_argument("--deliveries", type=int, default=1)
    s = sub.add_parser("build")
    s.add_argument("registry")
    s.add_argument("--name", required=True)
    s.add_argument("--tenant-id", required=True)
    s.add_argument("--out", default=str(HERE / "out"))
    for c in ("check-extension", "check-workflow"):
        s = sub.add_parser(c)
        s.add_argument("registry")
        s.add_argument("--name", required=True)
        s.add_argument("document")
        if c == "check-workflow":
            s.add_argument("--extension-id", required=True)
    a = p.parse_args(argv)
    try:
        if a.cmd == "learn-sample":
            out = Path(a.out)
            out.parent.mkdir(parents=True, exist_ok=True)
            with open(out, "w", encoding="utf-8", newline="\n") as fh:
                json.dump(learn_sample(), fh, indent=2)
                fh.write("\n")
            print(f"wrote {_show(out)}")
            return 0
        if a.cmd == "lint":
            return _print(lint(json.loads(Path(a.workflow).read_text(encoding="utf-8")), a.timeout))
        if a.cmd == "run":
            doc = json.loads(Path(a.workflow).read_text(encoding="utf-8"))
            payload = json.loads(Path(a.payload).read_text(encoding="utf-8"))
            e = entry(load_registry(Path(a.registry)), a.name)
            declared = set((doc.get("definition", doc).get("parameters") or {}))
            params = {k: v for k, v in {**workflow_parameters(e), "graphHost": GRAPH_HOSTS[a.cloud]}.items() if k in declared}
            fails = [int(x) for x in a.fail.split(",") if x]
            integ = FakeIntegration(e["integrationUri"], fails)
            o = simulate(doc, payload, a.cloud, params, integ, a.deliveries, e["extension"]["timeoutDuration"])
            for i, r in enumerate(o.runs, 1):
                print(f"run {i}: {r.status}")
            for req in o.graph.calls + o.elsewhere:
                status = (req.body or {}).get("data", {}).get("operationStatus") if isinstance(req.body, dict) else None
                aud = (req.authentication or {}).get("audience")
                print(f"  {req.method} {req.uri}  audience={aud}  operationStatus={status}")
            print(f"downstream: {integ.calls} call(s), {len(integ.effects)} effect(s)")
            print(f"Lifecycle Workflows task: {o.task_status}")
            return 0
        reg = load_registry(Path(a.registry))
        e = entry(reg, a.name)
        if a.cmd == "build":
            definition = json.loads((HERE / e["definition"]).read_text(encoding="utf-8"))
            findings = lint(definition, e["extension"]["timeoutDuration"])
            if any(f.severity == "Finding" for f in findings):
                _print(findings)
                return 2
            out = Path(a.out)
            out.mkdir(parents=True, exist_ok=True)
            for fname, body in ((f"arm-{e['name']}.json", build_arm(e, a.tenant_id, definition)),
                                (f"extension-{e['name']}.json", build_extension(e))):
                with open(out / fname, "w", encoding="utf-8", newline="\n") as fh:
                    json.dump(body, fh, indent=2)
                    fh.write("\n")
                print(f"wrote {_show(out / fname)}")
            return 0
        doc = json.loads(Path(a.document).read_text(encoding="utf-8"))
        if a.cmd == "check-extension":
            return _print(check_extension(e, doc))
        return _print(check_workflow(e, doc, a.extension_id))
    except (BuildError, wdl.WdlError, KeyError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
