"""The offline Workflow Definition Language interpreter: expressions, runAfter, If,
Terminate and retry policies.

    python -m unittest discover -s tests -v
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import wdl  # noqa: E402

CTX = wdl.Context(trigger_body={"data": {"a": "x", "n": None, "list": [1, 2]}}, parameters={"p": "v", "o": {"k": "w"}})


def ev(text):
    return wdl.resolve(text, CTX)


class Expressions(unittest.TestCase):
    def test_null_safe_index_returns_null_and_strict_index_fails(self):
        self.assertIsNone(ev("@triggerBody()?['data']?['missing']?['deeper']"))
        with self.assertRaises(wdl.WdlError):
            ev("@triggerBody()['data']['missing']")

    def test_interpolation_builds_a_string_and_whole_expressions_keep_their_type(self):
        self.assertEqual(ev("pre-@{triggerBody()?['data']?['a']}-post"), "pre-x-post")
        self.assertEqual(ev("@triggerBody()?['data']?['list']"), [1, 2])
        self.assertEqual(ev("@@literal"), "@literal")

    def test_null_interpolates_as_empty(self):
        self.assertEqual(ev("a@{triggerBody()?['data']?['n']}b"), "ab")

    def test_parameters_dynamic_index_and_coalesce(self):
        self.assertEqual(ev("@parameters('o')?[concat('k')]"), "w")
        self.assertEqual(ev("@coalesce(parameters('o')?['nope'], 'fallback')"), "fallback")
        with self.assertRaises(wdl.WdlError):
            ev("@parameters('undeclared')")

    def test_starts_and_ends_with_ignore_case_as_learn_says(self):
        self.assertTrue(ev("@startsWith('ABCdef', 'abc')"))
        self.assertTrue(ev("@endsWith('abcDEF', 'def')"))

    def test_quoted_strings_escape_by_doubling(self):
        self.assertEqual(ev("@concat('it''s', ' ok')"), "it's ok")

    def test_unknown_function_is_refused_not_guessed(self):
        with self.assertRaises(wdl.WdlError):
            ev("@utcNow()")


def _send(responses):
    calls = []

    def send(req):
        calls.append(req)
        return wdl.Response(responses.pop(0) if responses else 200)
    return send, calls


def _definition(actions, params=None):
    return {"triggers": {"manual": {"type": "Request", "kind": "Http"}}, "actions": actions, "parameters": params or {}}


class Runs(unittest.TestCase):
    def test_run_after_failed_handles_a_failure(self):
        d = _definition({
            "A": {"type": "Http", "inputs": {"method": "GET", "uri": "https://a.contoso.example", "retryPolicy": {"type": "none"}}, "runAfter": {}},
            "B": {"type": "Compose", "inputs": "on failure", "runAfter": {"A": ["Failed"]}},
            "C": {"type": "Compose", "inputs": "on success", "runAfter": {"A": ["Succeeded"]}},
        })
        send, _ = _send([500])
        r = wdl.run(d, {}, send)
        self.assertEqual((r.actions["A"]["status"], r.actions["B"]["status"], r.actions["C"]["status"]),
                         ("Failed", "Succeeded", "Skipped"))
        self.assertEqual(r.status, "Succeeded")

    def test_an_unhandled_failure_fails_the_run(self):
        d = _definition({"A": {"type": "Http", "inputs": {"method": "GET", "uri": "https://a.contoso.example", "retryPolicy": {"type": "none"}}, "runAfter": {}}})
        send, _ = _send([400])
        self.assertEqual(wdl.run(d, {}, send).status, "Failed")

    def test_default_retry_policy_retries_retryable_codes_four_times(self):
        d = _definition({"A": {"type": "Http", "inputs": {"method": "GET", "uri": "https://a.contoso.example"}, "runAfter": {}}})
        send, calls = _send([503] * 10)
        r = wdl.run(d, {}, send)
        self.assertEqual(len(calls), 5)
        self.assertEqual(r.actions["A"]["status"], "Failed")

    def test_non_retryable_codes_are_not_retried(self):
        d = _definition({"A": {"type": "Http", "inputs": {"method": "GET", "uri": "https://a.contoso.example"}, "runAfter": {}}})
        send, calls = _send([403])
        wdl.run(d, {}, send)
        self.assertEqual(len(calls), 1)

    def test_retry_budget(self):
        self.assertEqual(wdl.retry_budget(None), (4, 180))
        self.assertEqual(wdl.retry_budget({"type": "none"}), (0, 0))
        self.assertEqual(wdl.retry_budget({"type": "fixed", "count": 2, "interval": "PT30S"}), (2, 60))
        self.assertEqual(wdl.retry_budget({"type": "exponential", "count": 4, "interval": "PT10S", "maximumInterval": "PT2M"}), (4, 480))
        self.assertEqual(wdl.retry_budget({"type": "exponential", "count": 1, "interval": "PT10S"}), (1, 86400))

    def test_if_runs_one_branch_and_terminate_stops_the_run(self):
        d = _definition({
            "Gate": {"type": "If", "expression": {"equals": ["@triggerBody()?['ok']", True]},
                     "actions": {}, "else": {"actions": {"Stop": {"type": "Terminate", "inputs": {"runStatus": "Failed"}, "runAfter": {}}}},
                     "runAfter": {}},
            "After": {"type": "Compose", "inputs": "ran", "runAfter": {"Gate": ["Succeeded"]}},
        })
        send, _ = _send([])
        self.assertEqual(wdl.run(d, {"ok": True}, send).actions["After"]["status"], "Succeeded")
        stopped = wdl.run(d, {"ok": False}, send)
        self.assertEqual(stopped.status, "Failed")
        self.assertNotIn("After", stopped.actions)

    def test_parameters_are_bound_like_a_deployment(self):
        d = _definition({}, {"host": {"type": "String", "allowedValues": ["https://graph.microsoft.us"]}})
        send, _ = _send([])
        with self.assertRaises(wdl.WdlError):
            wdl.run(d, {}, send)
        with self.assertRaises(wdl.WdlError):
            wdl.run(d, {}, send, {"host": "https://graph.microsoft.com"})
        self.assertEqual(wdl.run(d, {}, send, {"host": "https://graph.microsoft.us"}).status, "Succeeded")

    def test_unsupported_action_types_are_refused(self):
        d = _definition({"A": {"type": "Foreach", "runAfter": {}}})
        send, _ = _send([])
        with self.assertRaises(wdl.WdlError):
            wdl.run(d, {}, send)


if __name__ == "__main__":
    unittest.main()
