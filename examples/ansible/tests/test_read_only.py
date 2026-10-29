"""The read-only discipline, checked statically on every playbook.

A read-only playbook may only gather facts, read state, assert and report. A task that could
change a target fails the test unless it is one of three narrow exceptions:

  * a read-only command (the agent's own `azcmagent show`) with changed_when: false;
  * a module that would change something, pinned to check mode (check_mode: true on the task
    or the play), so "changed" means "drifted";
  * a report writer (file, copy, template) in a play that runs only on the control node and
    writes only under report_dir.

The one changing playbook, 02_arc_onboarding.yml, must run every task in check mode unless
the operator passes confirm_change=true, and every task that touches the secret must hide it.
The negative tests prove the checker catches the writes it's meant to catch.
"""

from __future__ import annotations

from pathlib import Path

import pytest
import yaml

KIT = Path(__file__).resolve().parent.parent
PLAYBOOKS = KIT / "playbooks"
READ_ONLY = ["01_inventory_assessment.yml", "03_linux_baseline_check.yml", "04_network_and_ddi_facts.yml"]
GATED = ["02_arc_onboarding.yml"]

SAFE_MODULES = {
    "ansible.builtin.setup", "ansible.builtin.stat", "ansible.builtin.set_fact",
    "ansible.builtin.assert", "ansible.builtin.debug", "ansible.builtin.fail",
    "ansible.builtin.service_facts", "ansible.builtin.package_facts",
    "ansible.windows.win_stat", "cisco.ios.ios_facts",
}
COMMAND_MODULES = {"ansible.builtin.command", "ansible.windows.win_command"}
READ_ONLY_COMMANDS = [["show", "--json"]]  # arguments after the azcmagent executable
REPORT_WRITERS = {"ansible.builtin.file", "ansible.builtin.copy", "ansible.builtin.template"}
GATE = "{{ not (confirm_change | bool) }}"

TASK_KEYWORDS = {
    "name", "when", "register", "loop", "loop_control", "vars", "become", "become_user",
    "changed_when", "failed_when", "check_mode", "no_log", "tags", "delegate_to", "run_once",
    "ignore_errors", "notify", "environment", "block", "rescue", "always", "until", "retries",
    "delay", "diff", "throttle", "args", "with_items", "listen",
}


def load(path: Path) -> list[dict]:
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def walk(tasks: list[dict] | None):
    """Every task, flattening block, rescue and always."""
    for task in tasks or []:
        if "block" in task:
            yield from walk(task.get("block"))
            yield from walk(task.get("rescue"))
            yield from walk(task.get("always"))
        else:
            yield task


def module_of(task: dict) -> str:
    modules = [key for key in task if key not in TASK_KEYWORDS]
    assert len(modules) == 1, f"can't tell the module of task {task.get('name')!r}: {modules}"
    return modules[0]


def play_tasks(play: dict):
    for section in ("pre_tasks", "tasks", "post_tasks", "handlers"):
        yield from walk(play.get(section))


def is_control_node_play(play: dict) -> bool:
    return play.get("hosts") == "localhost" and play.get("connection") == "local"


def violations(plays: list[dict]) -> list[str]:
    """Why each task in a read-only playbook could change something; empty means clean."""
    found = []
    for play in plays:
        for task in play_tasks(play):
            module = module_of(task)
            args = task[module] if isinstance(task[module], dict) else {}
            label = f"{play.get('name')} / {task.get('name')} ({module})"
            check = task.get("check_mode", play.get("check_mode"))
            if module in SAFE_MODULES:
                continue
            if module in COMMAND_MODULES:
                argv = [str(a) for a in args.get("argv", [])]
                if (argv and Path(argv[0].replace("\\", "/")).name.lower().startswith("azcmagent")
                        and argv[1:] in READ_ONLY_COMMANDS and task.get("changed_when") is False):
                    continue
                found.append(f"{label}: command that isn't a known read-only command")
                continue
            if module in REPORT_WRITERS and is_control_node_play(play):
                target = str(args.get("dest") or args.get("path") or "")
                if target.startswith("{{ report_dir }}"):
                    continue
                found.append(f"{label}: control-node write outside report_dir: {target}")
                continue
            if check is True:
                continue
            found.append(f"{label}: can change a target and isn't pinned to check mode")
    return found


@pytest.mark.parametrize("name", READ_ONLY)
def test_read_only_playbooks_have_no_unguarded_writes(name):
    assert violations(load(PLAYBOOKS / name)) == []


@pytest.mark.parametrize("name", READ_ONLY)
def test_read_only_playbooks_never_escape_check_mode_on_targets(name):
    for play in load(PLAYBOOKS / name):
        if is_control_node_play(play):
            continue
        for task in play_tasks(play):
            if task.get("check_mode") is False:
                assert module_of(task) in COMMAND_MODULES, f"{task.get('name')} leaves check mode"


def test_every_playbook_is_classified():
    assert sorted(p.name for p in PLAYBOOKS.glob("*.yml")) == sorted(READ_ONLY + GATED)


def test_baseline_check_is_pinned_to_check_mode():
    for play in load(PLAYBOOKS / "03_linux_baseline_check.yml"):
        if not is_control_node_play(play):
            assert play.get("check_mode") is True


@pytest.mark.parametrize("name", GATED)
def test_changing_playbook_defaults_to_check_mode(name):
    for play in load(PLAYBOOKS / name):
        assert play.get("check_mode") == GATE, f"{play['name']} isn't gated"
        assert play.get("vars", {}).get("confirm_change") is False
        for task in play_tasks(play):
            if task.get("check_mode") is False:
                # Only the agent's read-only status call may run for real in a dry run.
                assert module_of(task) in COMMAND_MODULES and task.get("changed_when") is False


@pytest.mark.parametrize("name", GATED)
def test_changing_playbook_runs_in_small_batches_and_stops_on_failure(name):
    for play in load(PLAYBOOKS / name):
        assert play.get("serial") and play["serial"][0] == 1, "first batch must be one canary host"
        assert play.get("max_fail_percentage") == 0


@pytest.mark.parametrize("name", GATED)
def test_secret_is_never_logged_or_put_on_a_command_line(name):
    for play in load(PLAYBOOKS / name):
        for task in play_tasks(play):
            text = yaml.safe_dump(task)
            if "arc_secret" in text or "service-principal-secret" in text:
                assert task.get("no_log") is True, f"{task.get('name')} can log the secret"
            module = module_of(task)
            if module in COMMAND_MODULES:
                argv = " ".join(str(a) for a in task[module].get("argv", []))
                assert "secret" not in argv, f"{task.get('name')} puts the secret on the command line"


def test_no_secret_value_is_committed():
    for path in KIT.rglob("*.yml"):
        data = path.read_text(encoding="utf-8")
        assert "arc_sp_secret:" not in data, f"{path.relative_to(KIT)} defines the secret"


# --- The checker catches what it should ---------------------------------------------------

def _play(task: dict, **play) -> list[dict]:
    return [{"name": "p", "hosts": play.pop("hosts", "all"), "tasks": [task], **play}]


@pytest.mark.parametrize("task", [
    {"name": "write a file", "ansible.builtin.copy": {"dest": "/etc/motd", "content": "x"}},
    {"name": "edit a line", "ansible.builtin.lineinfile": {"path": "/etc/ssh/sshd_config", "line": "x"}},
    {"name": "run a shell", "ansible.builtin.shell": "rm -rf /tmp/x"},
    {"name": "restart", "ansible.builtin.service": {"name": "sshd", "state": "restarted"}},
    {"name": "any command", "ansible.builtin.command": {"argv": ["/usr/bin/azcmagent", "disconnect"]},
     "changed_when": False},
    {"name": "show, but reports change", "ansible.builtin.command": {"argv": ["azcmagent", "show", "--json"]}},
    {"name": "install", "ansible.windows.win_package": {"path": "x.msi"}},
])
def test_checker_rejects_writes(task):
    assert violations(_play(task))


def test_checker_rejects_a_report_written_on_a_target():
    task = {"name": "report", "ansible.builtin.copy": {"dest": "{{ report_dir }}/x.json", "content": "x"}}
    assert violations(_play(task))


def test_checker_rejects_a_control_node_write_outside_report_dir():
    task = {"name": "report", "ansible.builtin.copy": {"dest": "/etc/x.json", "content": "x"}}
    assert violations(_play(task, hosts="localhost", connection="local"))


def test_checker_accepts_a_write_pinned_to_check_mode():
    task = {"name": "edit", "ansible.builtin.lineinfile": {"path": "/etc/x", "line": "x"}}
    assert violations(_play(task, check_mode=True)) == []
    assert violations(_play(dict(task, check_mode=False), check_mode=True))
