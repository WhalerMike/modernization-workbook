"""The program's reusable Logic App, the registry and the builders, against fakes.

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
import wdl  # noqa: E402

FIX = HERE / "tests" / "fixtures"
PAYLOAD = json.loads((FIX / "trigger-leaver.json").read_text(encoding="utf-8"))
DOC = json.loads((HERE / "logicapp" / "integration.workflow.json").read_text(encoding="utf-8"))
REGISTRY = lcwext.load_registry(HERE / "config" / "integrations.json")
ENTRY = lcwext.entry(REGISTRY, "cms-revocation")
TENANT = "6e3a1f2b-8c4d-4e5f-9a0b-1c2d3e4f5a6b"
EXT_ID = "c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e01"


def run(cloud="Global", payload=PAYLOAD, fail=None, deliveries=1, entry=ENTRY):
    params = {**lcwext.workflow_parameters(entry), "graphHost": lcwext.GRAPH_HOSTS[cloud]}
    cms = lcwext.FakeIntegration(entry["integrationUri"], fail)
    return lcwext.simulate(DOC, payload, cloud, params, cms, deliveries, entry["extension"]["timeoutDuration"])


class Definition(unittest.TestCase):
    def test_lint_is_clean_within_the_registry_timeout(self):
        self.assertEqual(lcwext.lint(DOC, ENTRY["extension"]["timeoutDuration"]), [])

    def test_trigger_schema_is_learns_schema_unchanged(self):
        ours = DOC["definition"]["triggers"]["manual"]["inputs"]["schema"]
        self.assertEqual(ours, lcwext.learn_trigger_schema())

    def test_retries_must_fit_inside_the_callback_timeout(self):
        tight = lcwext.lint(DOC, "PT15M")
        self.assertIn("LX-11", {f.rule for f in tight})

    def test_the_graph_host_parameter_only_takes_the_three_us_relevant_roots(self):
        allowed = DOC["definition"]["parameters"]["graphHost"]["allowedValues"]
        self.assertEqual(sorted(allowed), sorted(set(lcwext.GRAPH_HOSTS.values())))


class Clouds(unittest.TestCase):
    def test_each_cloud_calls_back_to_its_own_graph_on_v1(self):
        for cloud, host in lcwext.GRAPH_HOSTS.items():
            with self.subTest(cloud=cloud):
                o = run(cloud)
                self.assertEqual(o.task_status, "completed")
                call = o.graph.calls[0]
                self.assertTrue(call.uri.startswith(f"{host}/v1.0/identityGovernance/lifecycleWorkflows/workflows/"))
                self.assertEqual(call.authentication, {"type": "ManagedServiceIdentity", "audience": host})
                self.assertEqual(o.elsewhere, [])

    def test_gcc_uses_the_worldwide_graph(self):
        self.assertEqual(lcwext.GRAPH_HOSTS["GCC"], "https://graph.microsoft.com")


class Outcomes(unittest.TestCase):
    def test_transient_failures_are_retried_then_completed(self):
        o = run(fail=[503, 429])
        self.assertEqual(o.task_status, "completed")
        self.assertEqual((o.integration.calls, len(o.integration.effects)), (3, 1))

    def test_exhausted_retries_call_back_failed_instead_of_timing_out(self):
        o = run(fail=[503] * 5)
        self.assertEqual(o.task_status, "failed")
        self.assertEqual(o.integration.calls, 5)
        self.assertEqual(o.graph.calls[0].body["data"]["operationStatus"], "failed")

    def test_a_permanent_error_is_not_retried_and_calls_back_failed(self):
        o = run(fail=[400])
        self.assertEqual((o.task_status, o.integration.calls), ("failed", 1))

    def test_a_repeat_delivery_does_the_work_once(self):
        o = run(deliveries=2)
        self.assertEqual(len(o.integration.effects), 1)
        self.assertEqual(o.integration.calls, 2)
        self.assertEqual(o.task_status, "completed")

    def test_the_idempotency_key_is_the_task_processing_result(self):
        o = run()
        req = next(r for r in o.runs[0].requests if r.uri.startswith(ENTRY["integrationUri"]))
        self.assertEqual(req.headers["Idempotency-Key"], PAYLOAD["data"]["taskProcessingResult"]["id"])

    def test_only_the_object_id_goes_downstream(self):
        o = run()
        req = next(r for r in o.runs[0].requests if r.uri.startswith(ENTRY["integrationUri"]))
        self.assertEqual(set(req.body), {"operation", "subjectId", "workflowId", "taskProcessingResultId"})
        self.assertNotIn("contoso.example", json.dumps(req.body))
        self.assertEqual(req.body["operation"], "revoke")

    def test_an_unregistered_workflow_gets_a_failed_callback_and_no_work(self):
        p = copy.deepcopy(PAYLOAD)
        other = "0d6f5b1c-3a2e-4f7d-9c1b-1e2a3b4c5d99"
        p["data"]["workflow"]["id"] = other
        p["data"]["callbackUriPath"] = p["data"]["callbackUriPath"].replace(PAYLOAD["data"]["workflow"]["id"], other)
        o = run(payload=p)
        self.assertEqual((o.task_status, o.integration.calls), ("failed", 0))

    def test_a_malformed_callback_path_is_rejected_without_any_call(self):
        for path in ("/users", None, "/identityGovernance/lifecycleWorkflows/workflows/x/tasks/y/taskProcessingResults/other/resume"):
            with self.subTest(path=path):
                p = copy.deepcopy(PAYLOAD)
                p["data"]["callbackUriPath"] = path
                o = run(payload=p)
                self.assertEqual(o.runs[0].status, "Failed")
                self.assertEqual(o.runs[0].requests, [])

    def test_a_missing_subject_is_rejected(self):
        p = copy.deepcopy(PAYLOAD)
        del p["data"]["subject"]
        o = run(payload=p)
        self.assertEqual((o.runs[0].status, o.runs[0].requests), ("Failed", []))

    def test_run_history_hides_the_subject(self):
        d = DOC["definition"]
        self.assertEqual(d["triggers"]["manual"]["runtimeConfiguration"]["secureData"]["properties"], ["outputs"])
        for action in (d["actions"]["Resume"], d["actions"]["Check_operation"]["actions"]["Call_integration"]):
            self.assertEqual(sorted(action["runtimeConfiguration"]["secureData"]["properties"]), ["inputs", "outputs"])


class Builders(unittest.TestCase):
    def test_extension_body_uses_proof_of_possession_and_learns_ranges(self):
        body = lcwext.build_extension(ENTRY)
        self.assertEqual(body["authenticationConfiguration"], {"@odata.type": "#microsoft.graph.azureAdPopTokenAuthentication"})
        self.assertEqual(body["callbackConfiguration"]["timeoutDuration"], "PT1H")
        self.assertEqual(body["endpointConfiguration"]["logicAppWorkflowName"], "la-lcw-cms-revocation")

    def test_out_of_range_settings_are_refused(self):
        for key, value in (("maximumRetries", 2), ("timeoutInMilliseconds", 5000), ("timeoutDuration", "PT20M"), ("timeoutDuration", "PT4H")):
            with self.subTest(key=key, value=value):
                e = copy.deepcopy(ENTRY)
                e["extension"][key] = value
                with self.assertRaises(lcwext.BuildError):
                    lcwext.build_extension(e)

    def test_access_control_turns_sas_off_and_holds_learns_pop_claims(self):
        ac = lcwext.build_access_control(ENTRY, TENANT)["triggers"]
        self.assertEqual(ac["sasAuthenticationPolicy"], {"state": "Disabled"})
        pol = ac["openAuthenticationPolicies"]["policies"]["AzureADLifecycleWorkflowsAuthPOPAuthPolicy"]
        claims = {c["name"]: c["value"] for c in pol["claims"]}
        self.assertEqual(pol["type"], "AADPOP")
        self.assertEqual(claims["iss"], f"https://sts.windows.net/{TENANT}/")
        self.assertEqual((claims["aud"], claims["u"], claims["m"]), ("https://management.azure.com", "management.azure.com", "POST"))
        self.assertTrue(claims["p"].endswith("/providers/Microsoft.Logic/workflows/la-lcw-cms-revocation"))

    def test_the_documentation_placeholder_appid_is_refused(self):
        e = copy.deepcopy(ENTRY)
        e["lcwAppId"] = "00001111-aaaa-2222-bbbb-3333cccc4444"
        with self.assertRaises(lcwext.BuildError):
            lcwext.build_access_control(e, TENANT)

    def test_azure_government_policy_values_are_refused_until_learn_documents_them(self):
        e = copy.deepcopy(ENTRY)
        e["azureCloud"] = "AzureUSGovernment"
        with self.assertRaises(lcwext.BuildError):
            lcwext.build_access_control(e, TENANT)

    def test_arm_resource_has_a_system_assigned_identity_and_the_cloud_parameters(self):
        arm = lcwext.build_arm(ENTRY, TENANT, DOC)
        res = arm["resources"][0]
        self.assertEqual(res["identity"], {"type": "SystemAssigned"})
        self.assertEqual(res["properties"]["parameters"]["graphHost"]["value"], "https://graph.microsoft.com")
        self.assertEqual(res["properties"]["parameters"]["operations"]["value"]["0d6f5b1c-3a2e-4f7d-9c1b-1e2a3b4c5d01"], "revoke")

    def test_build_writes_both_files_and_refuses_a_definition_with_findings(self):
        out = HERE / "out" / "test-build"
        out.mkdir(parents=True, exist_ok=True)
        self.assertEqual(lcwext.main(["build", str(HERE / "config" / "integrations.json"), "--name", "cms-revocation",
                                      "--tenant-id", TENANT, "--out", str(out)]), 0)
        self.assertTrue((out / "arm-cms-revocation.json").exists() and (out / "extension-cms-revocation.json").exists())
        (out / "learn.workflow.json").write_text(json.dumps(lcwext.learn_sample()), encoding="utf-8")
        reg = copy.deepcopy(REGISTRY)
        reg["integrations"][0]["definition"] = "out/test-build/learn.workflow.json"
        (out / "registry.json").write_text(json.dumps(reg), encoding="utf-8")
        self.assertEqual(lcwext.main(["build", str(out / "registry.json"), "--name", "cms-revocation",
                                      "--tenant-id", TENANT, "--out", str(out / "refused")]), 2)
        self.assertFalse((out / "refused").exists())


class ReadBack(unittest.TestCase):
    def test_the_extension_read_back_matches_the_registry(self):
        got = json.loads((FIX / "extension-get.json").read_text(encoding="utf-8"))
        self.assertEqual(lcwext.check_extension(ENTRY, got), [])

    def test_a_bearer_extension_or_one_without_authorized_apps_is_a_finding(self):
        got = json.loads((FIX / "extension-get.json").read_text(encoding="utf-8"))
        got["authenticationConfiguration"] = {"@odata.type": "#microsoft.graph.azureAdTokenAuthentication", "resourceId": "x"}
        got["callbackConfiguration"]["authorizedApps"] = []
        self.assertEqual({f.rule for f in lcwext.check_extension(ENTRY, got)}, {"CX-01", "CX-04"})

    def test_the_leaver_workflow_blocks_first_then_runs_the_custom_task(self):
        wf = json.loads((FIX / "workflow-get-leaver.json").read_text(encoding="utf-8"))
        self.assertEqual(lcwext.check_workflow(ENTRY, wf, EXT_ID), [])

    def test_a_custom_task_before_the_block_is_a_finding(self):
        wf = json.loads((FIX / "workflow-get-leaver.json").read_text(encoding="utf-8"))
        wf["tasks"][2]["executionSequence"] = 0
        self.assertIn("WX-03", {f.rule for f in lcwext.check_workflow(ENTRY, wf, EXT_ID)})

    def test_revoke_before_disable_and_stop_on_error_are_flagged(self):
        wf = json.loads((FIX / "workflow-get-leaver.json").read_text(encoding="utf-8"))
        wf["tasks"][0]["executionSequence"], wf["tasks"][1]["executionSequence"] = 2, 1
        wf["tasks"][2]["continueOnError"] = False
        self.assertEqual({f.rule for f in lcwext.check_workflow(ENTRY, wf, EXT_ID)}, {"WX-04", "WX-05"})

    def test_a_workflow_missing_from_the_registry_is_a_finding(self):
        wf = json.loads((FIX / "workflow-get-leaver.json").read_text(encoding="utf-8"))
        wf["id"] = "0d6f5b1c-3a2e-4f7d-9c1b-1e2a3b4c5d99"
        self.assertEqual([f.rule for f in lcwext.check_workflow(ENTRY, wf, EXT_ID)], ["WX-01"])

    def test_the_task_builder_uses_learns_definition_id_and_argument(self):
        t = lcwext.build_task(EXT_ID, "CMS - revoke PIV credential", "leaver")
        self.assertEqual(t["taskDefinitionId"], "4262b724-8dba-4fad-afc3-43fcbb497a0e")
        self.assertEqual(t["arguments"], [{"name": "customTaskExtensionID", "value": EXT_ID}])
        self.assertTrue(t["continueOnError"])


if __name__ == "__main__":
    unittest.main()
