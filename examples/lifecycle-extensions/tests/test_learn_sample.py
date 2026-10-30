"""Learn's Logic App definition for Lifecycle Workflows, run unmodified from the pinned
Learn page against the fakes. Each test pins one row of the chapter's gap table, so a
change upstream that closes a gap shows up as a failing test.

    python -m unittest discover -s tests -v
"""
import copy
import json
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE / "tools"))
import lcwext  # noqa: E402

PAYLOAD = json.loads((HERE / "tests" / "fixtures" / "trigger-leaver.json").read_text(encoding="utf-8"))
TPR = PAYLOAD["data"]["taskProcessingResult"]["id"]


def learn():
    return lcwext.learn_sample()


class LearnSample(unittest.TestCase):
    def test_the_pinned_page_holds_a_definition_that_parses(self):
        doc = learn()
        d = doc["definition"]
        self.assertEqual(list(d["triggers"]), ["manual"])
        self.assertEqual(d["triggers"]["manual"]["type"], "Request")
        self.assertEqual(list(d["actions"]), ["HTTP"])

    def test_in_the_worldwide_cloud_it_resumes_the_task_with_its_managed_identity(self):
        o = lcwext.simulate(learn(), PAYLOAD, "Global")
        self.assertEqual(o.task_status, "completed")
        call = o.graph.calls[0]
        self.assertEqual(call.authentication, {"audience": "https://graph.microsoft.com", "type": "ManagedServiceIdentity"})
        self.assertTrue(call.uri.startswith("https://graph.microsoft.com/beta/identityGovernance/"))

    def test_gap_hard_coded_worldwide_graph_misses_a_gcc_high_tenant(self):
        o = lcwext.simulate(learn(), PAYLOAD, "GCCHigh")
        self.assertTrue(o.task_status.startswith("failed (no callback"))
        self.assertTrue(o.elsewhere[0].uri.startswith("https://graph.microsoft.com/"))

    def test_gap_it_reports_completed_without_checking_anything(self):
        o = lcwext.simulate(learn(), PAYLOAD, "Global")
        self.assertEqual(o.graph.calls[0].body["data"]["operationStatus"], "Completed")

    def test_gap_work_added_before_the_callback_that_fails_leaves_no_callback(self):
        # Learn's step 5: add your actions between the trigger and the callback action.
        doc = copy.deepcopy(learn())
        d = doc["definition"]
        d["actions"]["Do_work"] = {"type": "Http", "inputs": {"method": "POST", "uri": "https://cms.contoso.example/api/v1/lifecycle-events"}, "runAfter": {}}
        d["actions"]["HTTP"]["runAfter"] = {"Do_work": ["Succeeded"]}
        o = lcwext.simulate(doc, PAYLOAD, "Global", integration=lcwext.FakeIntegration("https://cms.contoso.example", [503] * 10))
        self.assertEqual(o.graph.calls, [])
        self.assertEqual(o.task_status, "failed (no callback within PT1H)")

    def test_gap_a_repeat_delivery_repeats_the_work(self):
        doc = copy.deepcopy(learn())
        d = doc["definition"]
        d["actions"]["Do_work"] = {"type": "Http", "inputs": {"method": "POST", "uri": "https://cms.contoso.example/api/v1/lifecycle-events", "body": "@triggerBody()?['data']?['subject']?['id']"}, "runAfter": {}}
        d["actions"]["HTTP"]["runAfter"] = {"Do_work": ["Succeeded"]}
        cms = lcwext.FakeIntegration("https://cms.contoso.example")
        lcwext.simulate(doc, PAYLOAD, "Global", integration=cms, deliveries=2)
        self.assertEqual(len(cms.effects), 2)

    def test_gap_the_callback_path_is_used_unchecked(self):
        bad = copy.deepcopy(PAYLOAD)
        bad["data"]["callbackUriPath"] = "/users"
        o = lcwext.simulate(learn(), bad, "Global")
        self.assertEqual(o.graph.calls[0].uri, "https://graph.microsoft.com/beta/users")
        self.assertEqual(o.graph.calls[0].authentication["type"], "ManagedServiceIdentity")

    def test_gap_lint_finds_what_the_runs_show(self):
        rules = {(f.rule, f.severity) for f in lcwext.lint(learn(), "PT1H")}
        self.assertEqual(rules, {("LX-03", "Finding"), ("LX-04", "Finding"), ("LX-06", "Finding"), ("LX-07", "Finding"),
                                 ("LX-08", "Finding"), ("LX-10", "Warn"), ("LX-11", "Warn")})

    def test_the_policy_appid_on_the_page_is_the_documentation_placeholder(self):
        page = lcwext.LEARN_PAGE.read_text(encoding="utf-8")
        self.assertIn("|appid     |  00001111-aaaa-2222-bbbb-3333cccc4444   |", page)
        self.assertIn("|azp     |  ce79fdc4-cd1d-4ea5-8139-e74d7dbe0bb7   |", page)


if __name__ == "__main__":
    unittest.main()
