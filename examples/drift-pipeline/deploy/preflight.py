"""Pre-flight checks before the Attribute-Driven Migration deploys to a test environment or production.

Book 19, Chapter 10. Offline, it checks the settings file (no secret, no placeholder, a known cloud, GUIDs,
a certificate kept outside the repository), that the kits the runbook deploys are present and agree with
the settings, and, for production, that the go/no-go record points at a passing test-stage smoke report.
With --live it also runs read-only probes (the Azure CLI's signed-in tenant, subscription and cloud, the
certificate files, the PowerShell modules) and compares them with the settings. Without --live it prints
the probes it would run and runs nothing: that is its dry run.

Illustrative: unit-tested against fixtures, not run against a live tenant. Standard library only.

    python deploy/preflight.py --settings <file> [--other <file>] [--test-smoke-report <file>] [--out <dir>]
    python deploy/preflight.py --settings <file> --live

Exit codes: 0 every check passed (warnings allowed), 2 a check failed, 1 error.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any, Callable

sys.path.insert(0, str(Path(__file__).resolve().parent))

import adm_deploy as ad  # noqa: E402
import evidence as ev  # noqa: E402

EXIT_OK, EXIT_ERROR, EXIT_FINDINGS = 0, 1, 2
# Files each kit must have for the runbook's commands to work, relative to examples/.
KIT_FILES = {
    "hcm-entra": ["hcm-entra/python/hcm_to_scim.py", "hcm-entra/config/mapping.json",
                  "hcm-entra/config/settings.example.json"],
    "ms-automation": ["ms-automation/python/entra_tasks.py"],
    "validation-kit": ["validation-kit/Invoke-ValidationKit.ps1"],
    "dynamic-rules": ["dynamic-rules/powershell/DynamicRules.psm1", "dynamic-rules/rules"],
    "lifecycle-extensions": ["lifecycle-extensions/tools/lcwext.py", "lifecycle-extensions/config/integrations.json"],
    "group-policy-as-code": ["group-policy-as-code/powershell/Invoke-GpcSync.ps1", "group-policy-as-code/policies"],
    "machine-configuration": ["machine-configuration/powershell/Invoke-McBuild.ps1",
                              "machine-configuration/config/releases.json"],
    "ansible": ["ansible/playbooks/05_arc_wave_plan.yml", "ansible/playbooks/06_arc_onboarding_role.yml",
                "ansible/playbooks/02_arc_onboarding.yml"],
    "drift-pipeline": ["drift-pipeline/python/drift_pipeline.py", "drift-pipeline/workflow/drift-pipeline.yml"],
}
MODULES = ["Microsoft.Graph.Authentication", "Az.Accounts", "Az.Resources", "Az.Storage", "GuestConfiguration",
           "GroupPolicy"]

Runner = Callable[[list[str]], tuple[int, str]]


def run_command(cmd: list[str]) -> tuple[int, str]:
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    except (OSError, subprocess.TimeoutExpired) as exc:
        return 127, str(exc)
    return p.returncode, (p.stdout or p.stderr).strip()


class Report:
    def __init__(self) -> None:
        self.rows: list[dict[str, str]] = []

    def add(self, result: str, check: str, message: str) -> None:
        self.rows.append({"result": result, "check": check, "message": message})

    @property
    def failed(self) -> bool:
        return any(r["result"] == "FAIL" for r in self.rows)


def check_settings(path: Path, report: Report) -> dict[str, Any] | None:
    try:
        raw = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        report.add("FAIL", "PF-01", f"can't read {path}: {exc}")
        return None
    problems = ad.structure_problems(raw)
    report.add("FAIL" if problems else "PASS", "PF-01",
               "; ".join(problems) if problems else f"settings schema {ad.SCHEMA}, environment {raw.get('environment')}")
    secrets = ad.secret_problems(raw)
    report.add("FAIL" if secrets else "PASS", "PF-02", "; ".join(secrets) if secrets else "no secret in the settings file")
    holders = ad.placeholder_problems(raw)
    report.add("FAIL" if holders else "PASS", "PF-03",
               f"{len(holders)} placeholder(s) left: " + "; ".join(holders[:3]) + (" ..." if len(holders) > 3 else "")
               if holders else "no placeholder left")
    return raw


def check_cloud(s: dict[str, Any], report: Report) -> None:
    try:
        c = ad.dp.cloud_profile(str(s.get("cloud", "")))
    except ad.dp.DriftError as exc:
        report.add("FAIL", "PF-04", str(exc))
        return
    report.add("PASS", "PF-04", f"cloud {c['name']}: Graph {c['graph']}, Azure {c['azure_environment']}, "
                                f"Graph PowerShell {c['mg_environment']}, Arc playbook {ad.ARC_PLAYBOOK[c['azure_environment']]}")
    if c["azure_environment"] == "AzureUSGovernment":
        report.add("WARN", "PF-04", "Azure Government: Arc onboarding uses 02_arc_onboarding.yml, which reads the "
                                    "onboarding service principal's secret from Ansible Vault at run time, not from this file")
        report.add("WARN", "PF-04", "dynamic administrative units aren't documented for GCC High or DoD; units keep "
                                    "assigned membership kept by automation (implementation guide, Gate 4)")


def check_certificates(s: dict[str, Any], report: Report) -> None:
    bad = []
    for name in ("deploy", "provisioning"):
        pem = ad.get(s, f"identities.{name}.certificate_pem")
        if not isinstance(pem, str) or ad.PLACEHOLDER.search(pem):
            continue
        p = Path(pem)
        resolved = p if p.is_absolute() else Path.cwd() / p
        if not pem.lower().endswith(".pem"):
            bad.append(f"{name}: {pem} isn't a .pem file (the Azure CLI reads PEM with the key and certificate)")
        try:
            resolved.resolve().relative_to(ad.REPO.resolve())
            bad.append(f"{name}: {pem} is inside the repository; keep certificates in the operator's protected store")
        except ValueError:
            pass
    report.add("FAIL" if bad else "PASS", "PF-05", "; ".join(bad) if bad else "certificate files are PEM paths outside the repository")


def check_kits(s: dict[str, Any], report: Report) -> None:
    missing = [f for files in KIT_FILES.values() for f in files if not (ad.EXAMPLES / f).exists()]
    report.add("FAIL" if missing else "PASS", "PF-06",
               f"missing kit files: {', '.join(missing)}" if missing else f"{len(KIT_FILES)} kits present")
    name = ad.get(s, "machine_configuration.configuration")
    reg = json.loads((ad.EXAMPLES / "machine-configuration/config/releases.json").read_text(encoding="utf-8"))
    entry = reg.get("configurations", {}).get(name)
    if entry is None:
        report.add("FAIL", "PF-07", f"machine configuration {name!r} isn't in the release registry")
    else:
        report.add("PASS", "PF-07", f"machine configuration {name}: registry mode {entry['mode']}, "
                                    f"policy ID {entry['policyId']}, published {entry['published']}")
    integrations = json.loads((ad.EXAMPLES / "lifecycle-extensions/config/integrations.json").read_text(encoding="utf-8"))
    names = [i.get("name") for i in integrations.get("integrations", [])]
    report.add("PASS" if names else "FAIL", "PF-08", f"Lifecycle Workflows integrations in the registry: {', '.join(names)}"
               if names else "no integration in lifecycle-extensions/config/integrations.json")


def check_environment(s: dict[str, Any], report: Report, other: Path | None, smoke: Path | None,
                      evidence_check: Path | None = None) -> None:
    if other is not None:
        o = json.loads(Path(other).read_text(encoding="utf-8"))
        same = [k for k in ("tenant_id", "subscription_id", "identities.deploy.client_id")
                if ad.get(o, k) and ad.get(o, k) == ad.get(s, k)]
        report.add("FAIL" if same else "PASS", "PF-09",
                   f"test and production share {', '.join(same)}" if same else
                   f"{s.get('environment')} and {o.get('environment')} use different tenants, subscriptions and identities")
    if s.get("environment") != "production":
        report.add("PASS", "PF-10", "test stage: no promotion record needed")
        return
    expected = ad.get(s, "promotion.test_smoke_report_sha256")
    approvals = ad.get(s, "promotion.approvals") or []
    roles = {a.get("role") for a in approvals if isinstance(a, dict)}
    problems = []
    if not {"CISO", "Identity engineering"} <= roles:
        problems.append("promotion.approvals needs the CISO and identity engineering (the guide's deciders)")
    if smoke is None:
        problems.append("pass --test-smoke-report with the test stage's smoke-report.json")
    else:
        rep = json.loads(Path(smoke).read_text(encoding="utf-8"))
        if ad.sha256_file(smoke) != expected:
            problems.append("the test smoke report's SHA-256 isn't the one in promotion.test_smoke_report_sha256")
        if rep.get("environment") != "test" or rep.get("result") != "pass":
            problems.append(f"the test smoke report is {rep.get('environment')}/{rep.get('result')}, not test/pass")
        if rep.get("fixture"):
            problems.append("the test smoke report ran in fixture mode; promotion needs a live test run")
    if evidence_check is None:
        problems.append("pass --test-evidence-check with the test stage's evidence-check.json")
    else:
        chk = json.loads(Path(evidence_check).read_text(encoding="utf-8"))
        if ad.sha256_file(evidence_check) != ad.get(s, "promotion.test_evidence_check_sha256"):
            problems.append("the test evidence check's SHA-256 isn't the one in promotion.test_evidence_check_sha256")
        if chk.get("environment") != "test" or chk.get("result") != "pass":
            problems.append(f"the test evidence check is {chk.get('environment')}/{chk.get('result')}: "
                            f"{chk.get('missing')} requirement row(s) without passing evidence")
    report.add("FAIL" if problems else "PASS", "PF-10", "; ".join(problems) if problems else
               f"go/no-go: test smoke report {expected[:12]}... passed; approvals {', '.join(sorted(roles))}")


def live_probes(s: dict[str, Any]) -> list[tuple[str, list[str], str]]:
    """(check, command, what the output must equal; '' means exit 0 is enough)."""
    c = ad.dp.cloud_profile(s["cloud"])
    probes = [
        ("PF-11", ["az", "cloud", "show", "--query", "name", "-o", "tsv"], c["azure_environment"]),
        ("PF-12", ["az", "account", "show", "--query", "tenantId", "-o", "tsv"], s["tenant_id"]),
        ("PF-13", ["az", "account", "show", "--query", "id", "-o", "tsv"], s["subscription_id"]),
        ("PF-14", ["az", "account", "show", "--query", "user.name", "-o", "tsv"], ad.get(s, "identities.deploy.client_id")),
    ]
    mods = ",".join(f"'{m}'" for m in MODULES)
    probes.append(("PF-15", ["pwsh", "-NoProfile", "-Command",
                             f"$m = @({mods}) | Where-Object {{ -not (Get-Module -ListAvailable -Name $_) }}; "
                             "if ($m) { 'missing: ' + ($m -join ', '); exit 1 } else { 'all present' }"], ""))
    return probes


def run_live(s: dict[str, Any], report: Report, runner: Runner | None, live: bool) -> None:
    for name in ("deploy", "provisioning"):
        pem = ad.get(s, f"identities.{name}.certificate_pem")
        if live:
            ok = Path(pem).is_file()
            report.add("PASS" if ok else "FAIL", "PF-16", f"{name} certificate {'found' if ok else 'not found'}: {pem}")
        else:
            report.add("DRY", "PF-16", f"would check that the {name} certificate file exists: {pem}")
    for check, cmd, expected in live_probes(s):
        shown = " ".join(cmd)
        if not live:
            report.add("DRY", check, f"would run: {shown}" + (f"  (expect {expected})" if expected else ""))
            continue
        code, out = (runner or run_command)(cmd)
        if code != 0:
            report.add("FAIL", check, f"{shown} exited {code}: {out}")
        elif expected and out.strip().lower() != expected.lower():
            report.add("FAIL", check, f"{shown} printed {out.strip()!r}; the settings say {expected!r}")
        else:
            report.add("PASS", check, f"{shown}: {out.strip() or 'ok'}")


def preflight(settings_path: Path, other: Path | None = None, smoke: Path | None = None,
              live: bool = False, runner: Runner | None = None,
              evidence_check: Path | None = None) -> tuple[Report, dict[str, Any] | None]:
    report = Report()
    s = check_settings(settings_path, report)
    if s is None:
        return report, None
    check_cloud(s, report)
    check_certificates(s, report)
    check_kits(s, report)
    check_environment(s, report, other, smoke, evidence_check)
    if not report.failed:
        run_live(s, report, runner, live)
    else:
        report.add("SKIP", "PF-11", "live probes not run: fix the failures above first")
    return report, s


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--settings", required=True, type=Path)
    ap.add_argument("--other", type=Path, help="the other stage's settings file, to prove they don't share a tenant")
    ap.add_argument("--test-smoke-report", type=Path, help="production only: the test stage's smoke-report.json")
    ap.add_argument("--test-evidence-check", type=Path, help="production only: the test stage's evidence-check.json")
    ap.add_argument("--live", action="store_true", help="run the read-only probes (Azure CLI, modules, files)")
    ap.add_argument("--out", type=Path, help="write preflight.json here")
    args = ap.parse_args(argv)
    try:
        report, s = preflight(args.settings, args.other, args.test_smoke_report, args.live,
                              evidence_check=args.test_evidence_check)
    except (OSError, json.JSONDecodeError, KeyError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return EXIT_ERROR
    for r in report.rows:
        print(f"{r['result']:<4} {r['check']}  {r['message']}")
    fails = sum(r["result"] == "FAIL" for r in report.rows)
    warns = sum(r["result"] == "WARN" for r in report.rows)
    mode = "live" if args.live else "dry run (nothing signed in, nothing called)"
    print(f"preflight: {fails} failed, {warns} warning(s); {mode}")
    files = []
    if args.out:
        args.out.mkdir(parents=True, exist_ok=True)
        doc = {"schema": "adm-preflight/1", "settings": str(args.settings), "settings_sha256": ad.sha256_file(args.settings),
               "environment": (s or {}).get("environment"), "live": args.live, "rows": report.rows,
               "result": "fail" if fails else "pass"}
        target = args.out / "preflight.json"
        target.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8", newline="\n")
        files.append(target)
    try:
        loaded = ad.load_settings(args.settings)
    except ad.SettingsError:
        print("no evidence record: the settings file doesn't load")
    else:
        command = "preflight.py " + " ".join(argv if argv is not None else sys.argv[1:])
        rec = ev.add(loaded, args.settings, "preflight", command, "fail" if fails else "pass", files,
                     {"live": args.live, "failed": fails, "warnings": warns})
        print(f"evidence {rec.name}: preflight {'fail' if fails else 'pass'}")
        pf10 = [r for r in report.rows if r["check"] == "PF-10"]
        if loaded["environment"] == "production" and pf10 and pf10[-1]["result"] == "PASS":
            cited = [p for p in (args.test_smoke_report, args.test_evidence_check) if p]
            rec = ev.add(loaded, args.settings, "promotion", command, "pass", cited, {"approvals": ad.get(loaded, "promotion.approvals")})
            print(f"evidence {rec.name}: promotion pass")
    return EXIT_FINDINGS if fails else EXIT_OK


if __name__ == "__main__":
    sys.exit(main())
