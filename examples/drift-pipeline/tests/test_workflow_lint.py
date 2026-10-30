"""Tests for workflow_lint.py: Learn's sample workflows (pinned) and this example's workflow, parsed
offline. Nothing signs in and nothing runs. Illustrative: not proven against a live tenant."""
from __future__ import annotations

import sys
from pathlib import Path

import yaml

KIT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(KIT / "python"))

import workflow_lint as w  # noqa: E402
from drift_pipeline import CLOUDS  # noqa: E402

WORKFLOW = KIT / "workflow" / "drift-pipeline.yml"


def rules(results, severity=None):
    return sorted({r["rule"] for r in results if severity is None or r["severity"] == severity})


def lint_workflow(text=None):
    return w.lint_text(text if text is not None else WORKFLOW.read_text(encoding="utf-8"))


# ---------------------------------------------------------------- Learn's samples, as published

def test_the_pinned_page_has_three_sample_workflows():
    assert len(w.learn_samples()) == 3


def test_learn_cli_sample_gaps():
    res = w.lint_text(w.learn_samples()[0])
    assert rules(res, "Finding") == ["WF-02", "WF-05", "WF-08", "WF-09"]
    assert rules(res, "Warn") == ["WF-03", "WF-10", "WF-11"]


def test_learn_cli_and_powershell_sample_gaps():
    res = w.lint_text(w.learn_samples()[1])
    assert rules(res, "Finding") == ["WF-02", "WF-05", "WF-08", "WF-09"]
    assert sum(r["rule"] == "WF-05" for r in res) == 3       # login, cli, powershell
    assert sum(r["rule"] == "WF-09" for r in res) == 2       # azcliversion and azPSVersion: latest


def test_learn_samples_ask_for_id_token_write_and_nothing_more():
    for text in w.learn_samples()[:2]:
        assert "WF-04" not in rules(w.lint_text(text))
        assert yaml.safe_load(text)["jobs"]["test"]["permissions"] == {"id-token": "write"}


def test_learn_government_sample_does_not_parse():
    res = w.lint_text(w.learn_samples()[2])
    assert [r["rule"] for r in res] == ["WF-01"]


def test_learn_government_sample_pairs_the_right_audience_once_indented():
    # The only defect is the indentation of `with:`. Fixed in memory (the pinned copy is never
    # edited), the environment and audience are the US Government pair.
    text = w.learn_samples()[2].replace("        with:\n          ", "      with:\n        ").replace("\n          ", "\n        ")
    step = yaml.safe_load(text)["jobs"]["test"]["steps"][0]
    assert step["with"]["environment"] == "AzureUSGovernment"
    assert step["with"]["audience"] == "api://AzureADTokenExchangeUSGov"
    assert "WF-07" not in rules(w.lint_text(text))


def test_learn_samples_use_inputs_the_action_declares():
    for text in w.learn_samples()[:2]:
        assert "WF-06" not in rules(w.lint_text(text))


# ---------------------------------------------------------------- the pinned action

def test_pinned_action_declares_the_oidc_inputs_and_audience_default():
    inputs = w.action_inputs()
    assert {"client-id", "tenant-id", "subscription-id", "environment", "audience", "enable-AzPSSession"} <= set(inputs)
    assert inputs["audience"]["default"] == "api://AzureADTokenExchange"
    assert w.pinned_major() == 3


# ---------------------------------------------------------------- this example's workflow

def test_example_workflow_is_clean():
    assert lint_workflow() == []


def test_example_workflow_runs_on_a_schedule_and_on_demand():
    doc = yaml.safe_load(WORKFLOW.read_text(encoding="utf-8"))
    on = doc.get("on", doc.get(True))
    assert set(on) == {"schedule", "workflow_dispatch"}
    assert doc["permissions"] == {}


def test_example_workflow_separates_azure_access_from_issue_writes():
    jobs = yaml.safe_load(WORKFLOW.read_text(encoding="utf-8"))["jobs"]
    assert jobs["check"]["permissions"] == {"contents": "read", "id-token": "write"}
    assert jobs["findings"]["permissions"] == {"contents": "read", "issues": "write"}
    assert jobs["check"]["environment"] == "drift-gcc"


def test_example_workflow_has_no_secret_credential():
    text = WORKFLOW.read_text(encoding="utf-8")
    for bad in ("creds:", "client-secret", "AZURE_CLIENT_SECRET", "--overwrite true", "--overwrite \\"):
        assert bad not in text


def test_example_workflow_uses_the_gcc_profile():
    doc = yaml.safe_load(WORKFLOW.read_text(encoding="utf-8"))
    p = CLOUDS[doc["env"]["CLOUD"]]
    assert doc["env"]["GRAPH_HOST"] == p["graph"] and doc["env"]["MG_ENVIRONMENT"] == p["mg_environment"]
    login = doc["jobs"]["check"]["steps"][1]["with"]
    assert (login["environment"], login["audience"]) == (p["azure_environment"], p["audience"])


# ---------------------------------------------------------------- the rules catch what they should

def test_unpinned_action_is_a_finding():
    text = WORKFLOW.read_text(encoding="utf-8").replace("actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1", "actions/checkout@v7", 1)
    assert rules(lint_workflow(text)) == ["WF-05"]


def test_wrong_audience_for_the_environment_is_a_finding():
    text = WORKFLOW.read_text(encoding="utf-8").replace("audience: api://AzureADTokenExchange", "audience: api://AzureADTokenExchangeUSGov")
    assert "WF-07" in rules(lint_workflow(text))


def test_dod_graph_host_under_gcc_is_a_finding():
    text = WORKFLOW.read_text(encoding="utf-8").replace("GRAPH_HOST: https://graph.microsoft.com", "GRAPH_HOST: https://dod-graph.microsoft.us")
    assert rules(lint_workflow(text)) == ["WF-12"]


def test_government_environment_under_gcc_is_a_finding():
    text = (WORKFLOW.read_text(encoding="utf-8").replace("environment: AzureCloud", "environment: AzureUSGovernment")
            .replace("audience: api://AzureADTokenExchange", "audience: api://AzureADTokenExchangeUSGov"))
    assert rules(lint_workflow(text)) == ["WF-12"]


def test_issue_write_beside_id_token_is_a_finding():
    text = WORKFLOW.read_text(encoding="utf-8").replace("      id-token: write\n", "      id-token: write\n      issues: write\n", 1)
    assert rules(lint_workflow(text)) == ["WF-04"]


def test_a_secret_based_sign_in_is_a_finding():
    text = WORKFLOW.read_text(encoding="utf-8").replace("client-id: ${{ secrets.AZURE_CLIENT_ID }}", "creds: ${{ secrets.AZURE_CREDENTIALS }}")
    assert rules(lint_workflow(text), "Finding") == ["WF-06"]


def test_cli_exit_codes(capsys):
    assert w.main([str(WORKFLOW)]) == 0
    assert w.main(["--learn-samples"]) == 2
