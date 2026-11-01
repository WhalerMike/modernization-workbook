"""The declared call list, the cloud table, the output folder and the Graph export, against fakes.

    python -m pytest tests -q
"""
import io
import json
import sys
from pathlib import Path

import pytest

KIT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(KIT / "python"))
import graph_export  # noqa: E402
import hrlc_core as core  # noqa: E402


def test_every_call_is_a_get_and_every_task_declares_exactly_its_calls():
    data = core.load_calls()
    for task in data["tasks"]:
        union = set()
        for c in core.task_calls(task, data):
            assert c["method"] == "GET"
            assert c["learn"].startswith("https://learn.microsoft.com/")
            union |= core.call_permissions(c)
        assert set(core.task_permissions(task, data)) == union, task


def test_no_task_asks_for_a_write_permission():
    data = core.load_calls()
    for task, spec in data["tasks"].items():
        assert not [p for p in spec["graphPermissions"] if "ReadWrite" in p or p.endswith(".Upload")], task


def test_cloud_has_no_default_and_maps_hosts():
    with pytest.raises(core.HrlcError):
        core.cloud(None)
    with pytest.raises(core.HrlcError):
        core.cloud("public")
    assert core.cloud("gcc")["graph"] == "graph.microsoft.com"
    assert core.cloud("GCCHigh")["graph"] == "graph.microsoft.us"
    assert core.cloud("dod")["graph"] == "dod-graph.microsoft.us"


def test_output_is_written_once_with_a_hash_per_file(tmp_path):
    m = core.write_output(tmp_path / "o", "t", {"a.json": [1], "b.txt": "x\n"}, {"cloud": "gcc"})
    man = json.loads(m.read_text(encoding="utf-8"))
    assert man["readOnly"] is True and set(man["files"]) == {"a.json", "b.txt"}
    assert man["files"]["b.txt"] == core.sha256_file(tmp_path / "o" / "b.txt")
    with pytest.raises(core.HrlcError):
        core.write_output(tmp_path / "o", "t", {"a.json": [2]}, {})


def test_fingerprint_is_stable_and_free_of_names():
    a = core.finding("X-01", "Finding", "k1", "pat@contoso.example", "issue one")
    b = core.finding("X-01", "Finding", "k1", "someone else", "issue two")
    assert a["Fingerprint"] == b["Fingerprint"] == core.fingerprint("X-01", "k1")


def test_parse_time_reads_a_bare_date_as_utc_midnight():
    assert core.iso(core.parse_time("2026-11-01")) == "2026-11-01T00:00:00Z"
    with pytest.raises(core.HrlcError):
        core.parse_time("yesterday")


class _Resp(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


def _opener(pages):
    seen = []

    def open_(req):
        seen.append((req.get_method(), req.full_url, dict(req.header_items())))
        return _Resp(json.dumps(pages[len(seen) - 1]).encode())
    return open_, seen


def test_export_reads_every_page_with_get_on_the_clouds_host(tmp_path):
    pages = [{"value": [{"id": 1}], "@odata.nextLink": "https://graph.microsoft.us/v1.0/x?$skiptoken=2"}, {"value": [{"id": 2}]}]
    opener, seen = _opener(pages + [{"value": []}] * 10)
    written = graph_export.export("cba-read", "gcchigh", {"pkiId": "p1"}, tmp_path, "t0ken", opener)
    assert all(m == "GET" for m, _, _ in seen)
    assert all(u.startswith("https://graph.microsoft.us/v1.0/") for _, u, _ in seen)
    assert written[0]["count"] == 2
    assert json.loads((tmp_path / "pki-containers.json").read_text())["value"] == [{"id": 1}, {"id": 2}]


def test_export_refuses_a_next_link_to_another_host(tmp_path):
    opener, _ = _opener([{"value": [], "@odata.nextLink": "https://evil.example/v1.0/x"}])
    with pytest.raises(core.HrlcError):
        graph_export.export("drift-read", "gcc", {}, tmp_path, "t", opener)


def test_export_needs_a_token_and_every_parameter(tmp_path):
    with pytest.raises(core.HrlcError):
        graph_export.export("drift-read", "gcc", {}, tmp_path, "")
    opener, _ = _opener([{"value": []}] * 5)
    with pytest.raises(core.HrlcError):
        graph_export.export("cba-read", "gcc", {}, tmp_path, "t", opener)   # pkiId missing


def test_list_prints_the_tasks_permissions(capsys):
    assert graph_export.main(["--task", "separation-read", "--list"]) == 0
    assert "AuditLog.Read.All, LifecycleWorkflows-Reports.Read.All" in capsys.readouterr().out
