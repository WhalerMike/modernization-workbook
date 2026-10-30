"""A small, offline interpreter for the part of the Azure Logic Apps Workflow Definition
Language (WDL) that Lifecycle Workflows custom task extensions use.

It exists so a workflow definition can be tested without a tenant, a subscription or a
network: the HTTP actions go to a transport function that the tests supply.

What it covers: the Request trigger; Http, If, Compose and Terminate actions; runAfter;
retryPolicy (default, none, fixed, exponential); and the expression functions listed in
FUNCTIONS. What it is not: Azure Logic Apps. Anything it doesn't know, it refuses
(WdlError) rather than guess. Lab 2 runs the same definition in a test tenant.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from typing import Any, Callable

RETRYABLE = {408, 429} | set(range(500, 600))
DEFAULT_RETRY_COUNT = 4          # Learn: the Default policy sends up to 4 retries
ACTION_TYPES = {"Http", "If", "Compose", "Terminate"}


class WdlError(Exception):
    """The definition or an expression uses something this interpreter doesn't support,
    or an expression fails the way Logic Apps would fail it (for example a missing
    property read without the ? operator)."""


class _Terminated(Exception):
    def __init__(self, status: str):
        self.status = status


# --------------------------------------------------------------------------- expressions

_TOKEN = re.compile(r"""
    (?P<ws>\s+)
  | (?P<str>'(?:[^']|'')*')
  | (?P<num>-?\d+(?:\.\d+)?)
  | (?P<name>[A-Za-z_][A-Za-z0-9_]*)
  | (?P<punct>\?\[|\?\.|[()\[\],.])
""", re.VERBOSE)


def _tokenize(text: str) -> list[tuple[str, str]]:
    out, pos = [], 0
    while pos < len(text):
        m = _TOKEN.match(text, pos)
        if not m:
            raise WdlError(f"can't read expression at {text[pos:pos + 20]!r}")
        pos = m.end()
        kind = m.lastgroup
        if kind != "ws":
            out.append((kind, m.group()))
    return out


class _Parser:
    def __init__(self, text: str):
        self.toks = _tokenize(text)
        self.i = 0

    def peek(self) -> tuple[str, str] | None:
        return self.toks[self.i] if self.i < len(self.toks) else None

    def take(self, value: str | None = None) -> tuple[str, str]:
        tok = self.peek()
        if tok is None or (value is not None and tok[1] != value):
            raise WdlError(f"expected {value!r}, found {tok!r}")
        self.i += 1
        return tok

    def parse(self):
        node = self.expr()
        if self.peek() is not None:
            raise WdlError(f"unexpected {self.peek()[1]!r}")
        return node

    def expr(self):
        kind, val = self.take()
        if kind == "str":
            node = ("lit", val[1:-1].replace("''", "'"))
        elif kind == "num":
            node = ("lit", float(val) if "." in val else int(val))
        elif kind == "name" and val in ("true", "false", "null") and (self.peek() is None or self.peek()[1] != "("):
            node = ("lit", {"true": True, "false": False, "null": None}[val])
        elif kind == "name":
            self.take("(")
            args = []
            if self.peek() and self.peek()[1] != ")":
                args.append(self.expr())
                while self.peek() and self.peek()[1] == ",":
                    self.take(",")
                    args.append(self.expr())
            self.take(")")
            node = ("call", val, args)
        else:
            raise WdlError(f"unexpected {val!r}")
        while self.peek() and self.peek()[1] in ("[", "?[", ".", "?."):
            op = self.take()[1]
            safe = op.startswith("?")
            if op.endswith("["):
                key = self.expr()
                self.take("]")
            else:
                key = ("lit", self.take()[1])
            node = ("index", node, key, safe)
        return node


def _index(obj, key, safe: bool):
    if obj is None:
        if safe:
            return None
        raise WdlError(f"can't read {key!r} of null (use ?[...])")
    if isinstance(obj, list):
        if isinstance(key, int) and -len(obj) <= key < len(obj):
            return obj[key]
        if safe:
            return None
        raise WdlError(f"index {key!r} out of range")
    if isinstance(obj, dict):
        if key in obj:
            return obj[key]
        if safe:
            return None
        raise WdlError(f"property {key!r} doesn't exist")
    if safe:
        return None
    raise WdlError(f"can't index {type(obj).__name__}")


def _as_text(v) -> str:
    if v is None:
        return ""
    if isinstance(v, bool):
        return "True" if v else "False"
    if isinstance(v, (dict, list)):
        return json.dumps(v, separators=(",", ":"))
    return str(v)


def _contains(coll, item) -> bool:
    if isinstance(coll, str):
        if not isinstance(item, str):
            raise WdlError("contains() on a string needs a string")
        return item in coll          # case-sensitive here; startsWith and endsWith aren't (Learn)
    if isinstance(coll, dict):
        return item in coll
    if isinstance(coll, list):
        return item in coll
    raise WdlError("contains() needs a string, array or object")


def _empty(v) -> bool:
    return v is None or (isinstance(v, (str, list, dict)) and len(v) == 0)


def _equals(a, b) -> bool:
    return a == b


FUNCTIONS: dict[str, Callable] = {
    "concat": lambda *a: "".join(_as_text(x) for x in a),
    "equals": _equals,
    "and": lambda *a: all(bool(x) for x in a),
    "or": lambda *a: any(bool(x) for x in a),
    "not": lambda a: not bool(a),
    "if": lambda c, a, b: a if c else b,
    "empty": _empty,
    "coalesce": lambda *a: next((x for x in a if x is not None), None),
    "startsWith": lambda s, p: isinstance(s, str) and isinstance(p, str) and s.lower().startswith(p.lower()),
    "endsWith": lambda s, p: isinstance(s, str) and isinstance(p, str) and s.lower().endswith(p.lower()),
    "contains": _contains,
    "toLower": lambda s: _as_text(s).lower(),
    "string": _as_text,
    "length": lambda v: len(v),
}


@dataclass
class Context:
    trigger_body: Any
    parameters: dict
    actions: dict = field(default_factory=dict)   # name -> {"status", "inputs", "outputs"}


def evaluate(node, ctx: Context):
    kind = node[0]
    if kind == "lit":
        return node[1]
    if kind == "index":
        return _index(evaluate(node[1], ctx), evaluate(node[2], ctx), node[3])
    _, name, args = node
    vals = [evaluate(a, ctx) for a in args]
    if name == "triggerBody":
        return ctx.trigger_body
    if name == "triggerOutputs":
        return {"body": ctx.trigger_body}
    if name == "parameters":
        if vals[0] not in ctx.parameters:
            raise WdlError(f"parameter {vals[0]!r} isn't defined")
        return ctx.parameters[vals[0]]
    if name in ("body", "outputs", "actions"):
        rec = ctx.actions.get(vals[0])
        if rec is None:
            if name == "actions":
                return None
            raise WdlError(f"action {vals[0]!r} hasn't run")
        if name == "actions":
            return {"status": rec["status"], "outputs": rec.get("outputs")}
        out = rec.get("outputs")
        return out.get("body") if name == "body" and isinstance(out, dict) and "body" in out else out
    fn = FUNCTIONS.get(name)
    if fn is None:
        raise WdlError(f"function {name}() isn't supported by this interpreter")
    return fn(*vals)


def evaluate_text(expr: str, ctx: Context):
    return evaluate(_Parser(expr).parse(), ctx)


def resolve(value, ctx: Context):
    """Evaluate a definition value: '@expr' (any type), '...@{expr}...' (string),
    '@@' (a literal @), and dicts and lists recursively."""
    if isinstance(value, dict):
        return {k: resolve(v, ctx) for k, v in value.items()}
    if isinstance(value, list):
        return [resolve(v, ctx) for v in value]
    if not isinstance(value, str):
        return value
    if value.startswith("@@"):
        return value[1:]
    if value.startswith("@") and not value.startswith("@{"):
        return evaluate_text(value[1:], ctx)
    if "@{" not in value:
        return value
    out, pos = [], 0
    while True:
        start = value.find("@{", pos)
        if start < 0:
            out.append(value[pos:])
            break
        out.append(value[pos:start])
        depth, j, in_str = 0, start + 1, False
        while j < len(value):
            ch = value[j]
            if ch == "'":
                in_str = not in_str
            elif not in_str and ch == "{":
                depth += 1
            elif not in_str and ch == "}":
                depth -= 1
                if depth == 0:
                    break
            j += 1
        if j >= len(value):
            raise WdlError(f"unclosed @{{ in {value!r}")
        out.append(_as_text(evaluate_text(value[start + 2:j], ctx)))
        pos = j + 1
    return "".join(out)


# If-action condition objects, as the designer writes them: {"and": [{"equals": [a, b]}]}
_CONDITION_OPS = {"and", "or", "not", "equals", "contains", "startsWith", "endsWith", "greater", "less"}


def condition(obj, ctx: Context) -> bool:
    if isinstance(obj, str):
        return bool(resolve(obj, ctx))
    if not isinstance(obj, dict) or len(obj) != 1:
        raise WdlError(f"unsupported condition {obj!r}")
    (op, arg), = obj.items()
    if op not in _CONDITION_OPS:
        raise WdlError(f"unsupported condition operator {op!r}")
    if op == "and":
        return all(condition(a, ctx) for a in arg)
    if op == "or":
        return any(condition(a, ctx) for a in arg)
    if op == "not":
        return not condition(arg, ctx)
    a, b = (resolve(x, ctx) for x in arg)
    if op == "greater":
        return a > b
    if op == "less":
        return a < b
    return bool(FUNCTIONS[op](a, b))


# --------------------------------------------------------------------------- the run

@dataclass
class Request:
    action: str
    method: str
    uri: str
    headers: dict
    body: Any
    authentication: dict | None


@dataclass
class Response:
    status: int
    body: Any = None


Transport = Callable[[Request], Response]


def _iso_seconds(text: str) -> int:
    m = re.fullmatch(r"P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?", text or "")
    if not m or text in ("P", "PT"):
        raise WdlError(f"not an ISO 8601 duration this interpreter reads: {text!r}")
    d, h, mi, s = (int(x or 0) for x in m.groups())
    return ((d * 24 + h) * 60 + mi) * 60 + s


def retry_budget(policy: dict | None) -> tuple[int, int]:
    """(retries, worst-case seconds spent waiting between attempts) for a retryPolicy.

    Default: up to 4 retries, intervals capped at 45 seconds (Learn). Fixed: count x
    interval. Exponential: count x maximumInterval, which is 1 day when not set (Learn's
    Consumption default) -- the reason the lint asks for an explicit maximumInterval.
    """
    if policy is None or policy.get("type", "default").lower() == "default":
        return DEFAULT_RETRY_COUNT, DEFAULT_RETRY_COUNT * 45
    kind = policy["type"].lower()
    if kind == "none":
        return 0, 0
    count = int(policy.get("count", 0))
    if not 1 <= count <= 90:
        raise WdlError("retryPolicy count must be 1 to 90")
    if kind == "fixed":
        return count, count * _iso_seconds(policy["interval"])
    if kind == "exponential":
        return count, count * _iso_seconds(policy.get("maximumInterval", "P1D"))
    raise WdlError(f"unknown retryPolicy type {kind!r}")


@dataclass
class RunResult:
    status: str
    actions: dict
    requests: list


def _run_scope(actions: dict, ctx: Context, transport: Transport, requests: list) -> str:
    pending = dict(actions)
    for name, a in actions.items():
        if a.get("type") not in ACTION_TYPES:
            raise WdlError(f"action {name!r}: type {a.get('type')!r} isn't supported")
        for dep in (a.get("runAfter") or {}):
            if dep not in actions:
                raise WdlError(f"action {name!r} runs after {dep!r}, which isn't in the same scope")
    while pending:
        ready = [n for n, a in pending.items() if all(d in ctx.actions for d in (a.get("runAfter") or {}))]
        if not ready:
            raise WdlError(f"runAfter cycle among {sorted(pending)}")
        for name in ready:
            a = pending.pop(name)
            after = a.get("runAfter") or {}
            if all(ctx.actions[d]["status"] in [s for s in want] for d, want in after.items()):
                _run_action(name, a, ctx, transport, requests)
            else:
                ctx.actions[name] = {"status": "Skipped", "inputs": None, "outputs": None}
    return _scope_status(actions, ctx)


def _scope_status(actions: dict, ctx: Context) -> str:
    """Failed if an action failed and nothing that ran after it handled the failure."""
    for name in actions:
        if ctx.actions[name]["status"] not in ("Failed", "TimedOut"):
            continue
        handled = any(
            name in (b.get("runAfter") or {})
            and set(b["runAfter"][name]) & {"Failed", "TimedOut"}
            and ctx.actions[other]["status"] != "Skipped"
            for other, b in actions.items())
        if not handled:
            return "Failed"
    return "Succeeded"


def _run_action(name: str, a: dict, ctx: Context, transport: Transport, requests: list) -> None:
    kind = a["type"]
    if kind == "Compose":
        val = resolve(a.get("inputs"), ctx)
        ctx.actions[name] = {"status": "Succeeded", "inputs": val, "outputs": val}
    elif kind == "Terminate":
        status = resolve(a.get("inputs", {}).get("runStatus", "Failed"), ctx)
        ctx.actions[name] = {"status": "Succeeded", "inputs": a.get("inputs"), "outputs": None}
        raise _Terminated(status)
    elif kind == "If":
        branch = a.get("actions", {}) if condition(a["expression"], ctx) else a.get("else", {}).get("actions", {})
        ctx.actions[name] = {"status": "Running", "inputs": None, "outputs": None}
        for inner, b in {**a.get("actions", {}), **a.get("else", {}).get("actions", {})}.items():
            if inner not in branch:
                ctx.actions[inner] = {"status": "Skipped", "inputs": None, "outputs": None}
        status = _run_scope(branch, ctx, transport, requests) if branch else "Succeeded"
        ctx.actions[name]["status"] = status
    elif kind == "Http":
        inputs = a["inputs"]
        retries, _ = retry_budget(inputs.get("retryPolicy"))
        req = Request(
            action=name,
            method=resolve(inputs["method"], ctx),
            uri=resolve(inputs["uri"], ctx),
            headers=resolve(inputs.get("headers") or {}, ctx),
            body=resolve(inputs.get("body"), ctx),
            authentication=resolve(inputs.get("authentication"), ctx),
        )
        attempts, resp = 0, None
        while True:
            attempts += 1
            requests.append(req)
            resp = transport(req)
            if resp.status not in RETRYABLE or attempts > retries:
                break
        ok = 200 <= resp.status < 300
        ctx.actions[name] = {
            "status": "Succeeded" if ok else "Failed",
            "inputs": req,
            "outputs": {"statusCode": resp.status, "body": resp.body},
            "attempts": attempts,
        }


def load(path) -> dict:
    """Read a workflow file: either {"definition": ..., "parameters": ...} (code view)
    or a bare definition."""
    with open(path, encoding="utf-8") as fh:
        doc = json.load(fh)
    return doc["definition"] if "definition" in doc else doc


def bind_parameters(definition: dict, values: dict) -> dict:
    """Apply definition parameter defaults, refuse unknown and missing values, and check
    allowedValues, as a deployment would."""
    declared = definition.get("parameters") or {}
    unknown = set(values) - set(declared)
    if unknown:
        raise WdlError(f"values for undeclared parameters: {sorted(unknown)}")
    out = {}
    for pname, spec in declared.items():
        if pname in values:
            val = values[pname]
        elif "defaultValue" in spec:
            val = spec["defaultValue"]
        else:
            raise WdlError(f"parameter {pname!r} has no value and no default")
        if "allowedValues" in spec and val not in spec["allowedValues"]:
            raise WdlError(f"parameter {pname!r}: {val!r} isn't one of {spec['allowedValues']}")
        out[pname] = val
    return out


def run(definition: dict, trigger_body, transport: Transport, parameters: dict | None = None) -> RunResult:
    triggers = definition.get("triggers") or {}
    if len(triggers) != 1:
        raise WdlError("expected exactly one trigger")
    (tname, trig), = triggers.items()
    if trig.get("type") != "Request":
        raise WdlError(f"trigger {tname!r} isn't a Request trigger")
    ctx = Context(trigger_body=trigger_body, parameters=bind_parameters(definition, parameters or {}))
    requests: list[Request] = []
    try:
        status = _run_scope(definition.get("actions") or {}, ctx, transport, requests)
    except _Terminated as t:
        status = t.status
    return RunResult(status=status, actions=ctx.actions, requests=requests)
