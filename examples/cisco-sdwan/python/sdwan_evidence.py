"""Read-only evidence collector for a Cisco Catalyst SD-WAN fabric (illustrative).

Status: illustrative, unit-tested against mocked responses, not proven against a
live fabric. Not an endorsement of any product by any agency.

What it does, all with GET requests after sign-in:

1. Reads the device inventory from SD-WAN Manager (GET /dataservice/device).
2. Checks every control component (Manager, Controller, Validator) against the
   first fixed releases of the Catalyst SD-WAN vulnerabilities in CISA's Known
   Exploited Vulnerabilities catalog, from a data file you keep current
   (data/ed-26-03-fixed-releases.json). That is the "ED 26-03 and KEV gate".
3. Flags control components that are not in the expected inventory (the
   hunt guidance's "validate every peer" step, done against Manager's view).
4. Reads the Manager audit log (GET /dataservice/auditlog) for a look-back
   window and maps each entry into an evidence record, flagging successful
   sign-ins and administrative sources outside the management network.

Output: one JSON file of evidence records and one CSV of gate findings. Exit
code 0 means the gate passed, 2 means it failed or needs confirmation, 1 means
an error.

The client refuses any HTTP method other than GET, except the sign-in and
sign-out calls Cisco documents. It never changes the fabric.

Example (from the kit root; copy config/config.example.json to config/config.json
and edit it first, and set the credential environment variables it names):

  python python/sdwan_evidence.py --config config/config.json
"""

from __future__ import annotations

import argparse
import csv
import ipaddress
import json
import os
import re
import ssl
import sys
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Iterable

# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------

SECRET_KEY_PATTERN = re.compile(r"(password|secret|token|apikey|api_key|credential)", re.I)
ALLOWED_SECRET_KEYS = {"password_env", "username_env"}

DEVICE_TYPE_MAP = {
    "vmanage": "manager",
    "vsmart": "controller",
    "vbond": "validator",
    "vedge": "edge",
}


class ConfigError(ValueError):
    """Raised when the configuration is unsafe or incomplete."""


def load_config(path: str | Path) -> dict[str, Any]:
    """Load a JSON config file and refuse anything that looks like a secret."""
    cfg = json.loads(Path(path).read_text(encoding="utf-8"))
    for key in cfg:
        if key.startswith("_"):
            continue
        if SECRET_KEY_PATTERN.search(key) and key not in ALLOWED_SECRET_KEYS:
            raise ConfigError(f"config key '{key}' looks like a secret; use an environment variable")
    for required in ("manager_url", "auth_mode", "fixed_release_file"):
        if not cfg.get(required):
            raise ConfigError(f"config is missing '{required}'")
    if not str(cfg["manager_url"]).startswith("https://"):
        raise ConfigError("manager_url must use https://")
    if cfg["auth_mode"] not in ("jwt", "session"):
        raise ConfigError("auth_mode must be 'jwt' (20.18.1 and later) or 'session'")
    return cfg


# --------------------------------------------------------------------------
# HTTP client (read-only)
# --------------------------------------------------------------------------

@dataclass
class Response:
    status: int
    headers: dict[str, str]
    body: bytes

    def json(self) -> Any:
        return json.loads(self.body.decode("utf-8"))


Transport = Callable[[str, str, dict[str, str], bytes | None], Response]

# The only non-GET calls the client will make: Cisco's documented sign-in and
# sign-out endpoints.
WRITE_ALLOWLIST = {("POST", "/jwt/login"), ("POST", "/j_security_check"), ("POST", "/logout")}


class ReadOnlyViolation(RuntimeError):
    """Raised if code tries to send a request that could change the fabric."""


def urllib_transport(ca_bundle: str | None = None, timeout: int = 30) -> Transport:
    """Default transport: urllib with certificate verification always on."""
    context = ssl.create_default_context(cafile=ca_bundle or None)

    def send(method: str, url: str, headers: dict[str, str], body: bytes | None) -> Response:
        req = urllib.request.Request(url, data=body, method=method, headers=headers)
        try:
            with urllib.request.urlopen(req, context=context, timeout=timeout) as resp:
                return Response(resp.status, dict(resp.headers.items()), resp.read())
        except urllib.error.HTTPError as err:  # pragma: no cover - exercised live only
            return Response(err.code, dict(err.headers.items()), err.read())

    return send


class ManagerClient:
    """A minimal, read-only Catalyst SD-WAN Manager REST client."""

    def __init__(self, base_url: str, transport: Transport):
        self.base_url = base_url.rstrip("/")
        self.transport = transport
        self.headers: dict[str, str] = {"Accept": "application/json"}
        self.mode: str | None = None

    def _send(self, method: str, path: str, headers: dict[str, str] | None = None,
              body: bytes | None = None) -> Response:
        route = path.split("?", 1)[0]
        if method != "GET" and (method, route) not in WRITE_ALLOWLIST:
            raise ReadOnlyViolation(f"{method} {route} is not allowed; this client is read-only")
        merged = dict(self.headers)
        merged.update(headers or {})
        return self.transport(method, self.base_url + path, merged, body)

    # Sign-in -------------------------------------------------------------

    def login_jwt(self, username: str, password: str, duration: int = 1800) -> None:
        """JWT sign-in (SD-WAN Manager 20.18.1 and later): POST /jwt/login."""
        body = json.dumps({"username": username, "password": password, "duration": duration}).encode()
        resp = self._send("POST", "/jwt/login", {"Content-Type": "application/json"}, body)
        if resp.status != 200:
            raise PermissionError(f"JWT sign-in failed with HTTP {resp.status}")
        data = resp.json()
        token = data.get("token")
        if not token:
            raise PermissionError("JWT sign-in returned no token")
        self.headers["Authorization"] = f"Bearer {token}"
        if data.get("csrf"):
            self.headers["X-XSRF-TOKEN"] = data["csrf"]
        self.mode = "jwt"

    def login_session(self, username: str, password: str) -> None:
        """Session sign-in: POST /j_security_check, then GET /dataservice/client/token."""
        form = urllib.parse.urlencode({"j_username": username, "j_password": password}).encode()
        resp = self._send("POST", "/j_security_check",
                          {"Content-Type": "application/x-www-form-urlencoded"}, form)
        cookie = _find_header(resp.headers, "Set-Cookie") or ""
        match = re.search(r"JSESSIONID=([^;]+)", cookie)
        # A failed sign-in returns an HTML login page, not an error status.
        if resp.status != 200 or not match or b"<html" in resp.body.lower():
            raise PermissionError("session sign-in failed")
        self.headers["Cookie"] = f"JSESSIONID={match.group(1)}"
        token = self._send("GET", "/dataservice/client/token")
        if token.status == 200 and token.body:
            self.headers["X-XSRF-TOKEN"] = token.body.decode().strip()
        self.mode = "session"

    def logout(self) -> None:
        """Session mode only; Cisco documents no JWT sign-out, so tokens are kept short."""
        if self.mode == "session":
            self._send("POST", "/logout")

    # Reads ---------------------------------------------------------------

    def get_devices(self) -> list[dict[str, Any]]:
        resp = self._send("GET", "/dataservice/device")
        _raise_for_status(resp, "/dataservice/device")
        return resp.json().get("data", [])

    def get_audit_log(self, lookback_hours: int) -> list[dict[str, Any]]:
        # The query follows the rule format Cisco's API examples use for alarm
        # queries; confirm it against your Manager release (inference).
        query = {
            "query": {
                "condition": "AND",
                "rules": [{
                    "value": [str(lookback_hours)],
                    "field": "entry_time",
                    "type": "date",
                    "operator": "last_n_hours",
                }],
            },
            "size": 10000,
        }
        path = "/dataservice/auditlog?query=" + urllib.parse.quote(json.dumps(query, separators=(",", ":")))
        resp = self._send("GET", path)
        _raise_for_status(resp, "/dataservice/auditlog")
        return resp.json().get("data", [])


def _find_header(headers: dict[str, str], name: str) -> str | None:
    for key, value in headers.items():
        if key.lower() == name.lower():
            return value
    return None


def _raise_for_status(resp: Response, path: str) -> None:
    if resp.status != 200:
        raise RuntimeError(f"GET {path} returned HTTP {resp.status}")


# --------------------------------------------------------------------------
# Versions and the ED 26-03 / KEV gate
# --------------------------------------------------------------------------

def parse_version(text: str) -> tuple[int, ...]:
    """'20.15.4.2' -> (20, 15, 4, 2). Letters in IOS XE strings ('17.15.04c') are dropped."""
    parts = []
    for piece in str(text).strip().split("."):
        digits = re.match(r"\d+", piece)
        if not digits:
            break
        parts.append(int(digits.group()))
    if len(parts) < 2:
        raise ValueError(f"not a release string: {text!r}")
    return tuple(parts)


def train_of(version: tuple[int, ...]) -> str:
    return f"{version[0]}.{version[1]}"


def _train_key(train: str) -> tuple[int, int]:
    major, minor = train.split(".")
    return int(major), int(minor)


def _pad(version: tuple[int, ...], length: int = 4) -> tuple[int, ...]:
    return version + (0,) * (length - len(version))


def check_release(version_text: str, advisory: dict[str, Any],
                  end_of_maintenance: Iterable[str] = ()) -> tuple[str, str]:
    """Return (status, reason). Status is 'pass', 'fail' or 'confirm'.

    Rule for a train with fixed releases: take the fixed releases on the same or a
    later maintenance branch (first three numbers) than the running release; the
    running release passes if it is at or above the lowest of them, or if it is newer
    than every listed fix.
    """
    version = parse_version(version_text)
    train = train_of(version)
    trains: dict[str, Any] = advisory.get("trains", {})
    not_affected = advisory.get("not_affected_from_train")
    if not_affected and _train_key(train) >= _train_key(not_affected):
        return "pass", f"train {train} is not affected per {advisory['id']}"
    if _train_key(train) < _train_key(advisory.get("minimum_train", "0.0")):
        return "fail", f"train {train} is older than any fixed train in {advisory['id']}; migrate"
    entry = trains.get(train)
    if entry is None:
        if train in set(end_of_maintenance):
            return "fail", f"train {train} has reached End of Software Maintenance; migrate"
        highest = max((_train_key(t) for t in trains), default=(0, 0))
        where = "newer than" if _train_key(train) > highest else "between"
        return "confirm", f"train {train} is {where} the trains listed in {advisory['id']}; confirm with Cisco"
    if "migrate_to" in entry:
        return "fail", f"train {train} has no fix in {advisory['id']}; migrate to {entry['migrate_to']} or later"
    fixes = sorted(_pad(parse_version(f)) for f in entry["fixed"])
    running = _pad(version)
    candidates = [f for f in fixes if f[:3] >= running[:3]]
    if not candidates:
        return "pass", f"{version_text} is newer than every fix listed in {advisory['id']}"
    floor = candidates[0]
    floor_text = _fmt(floor)
    if running >= floor:
        return "pass", f"{version_text} is at or above fixed release {floor_text}"
    return "fail", f"{version_text} is below fixed release {floor_text} ({', '.join(advisory['kev_cves'])})"


def _fmt(version: tuple[int, ...]) -> str:
    trimmed = list(version)
    while len(trimmed) > 3 and trimmed[-1] == 0:
        trimmed.pop()
    return ".".join(str(n) for n in trimmed)


def role_of(device: dict[str, Any]) -> str:
    raw = (device.get("device-type") or device.get("personality") or "").lower()
    return DEVICE_TYPE_MAP.get(raw, raw or "unknown")


def gate_findings(devices: list[dict[str, Any]], floor_data: dict[str, Any],
                  observed_at: str) -> list[dict[str, Any]]:
    """One finding per control component per advisory."""
    findings = []
    eom = floor_data.get("end_of_maintenance_trains", [])
    for device in devices:
        role = role_of(device)
        if role not in ("manager", "controller", "validator"):
            continue
        version = device.get("version", "")
        for advisory in floor_data["advisories"]:
            if role not in advisory["products"]:
                continue
            try:
                status, reason = check_release(version, advisory, eom)
            except ValueError:
                status, reason = "confirm", f"could not parse version {version!r}"
            findings.append({
                "record_kind": "ed_26_03_kev_gate",
                "evaluation_timestamp": observed_at,
                "host_name": device.get("host-name"),
                "system_ip": device.get("system-ip"),
                "role": role,
                "software_version": version,
                "advisory_id": advisory["id"],
                "kev_cves": advisory["kev_cves"],
                "emergency_directive": advisory.get("emergency_directive"),
                "status": status,
                "reason": reason,
                "floor_data_as_of": floor_data.get("as_of"),
            })
    return findings


def unexpected_control_components(devices: list[dict[str, Any]], expected: list[dict[str, str]],
                                  observed_at: str) -> list[dict[str, Any]]:
    """Control components Manager knows about that aren't in the expected inventory."""
    allowed = {(e["system_ip"], e["device_type"]) for e in expected}
    findings = []
    for device in devices:
        role = role_of(device)
        if role not in ("manager", "controller", "validator"):
            continue
        key = (device.get("system-ip"), role)
        if key not in allowed:
            findings.append({
                "record_kind": "unexpected_control_component",
                "evaluation_timestamp": observed_at,
                "host_name": device.get("host-name"),
                "system_ip": device.get("system-ip"),
                "role": role,
                "status": "fail",
                "reason": "control component not in the expected inventory; validate it (ED 26-03 hunt guidance)",
            })
    return findings


# --------------------------------------------------------------------------
# Evidence records
# --------------------------------------------------------------------------

def iso_from_ms(value: Any) -> str | None:
    try:
        return datetime.fromtimestamp(int(value) / 1000, tz=timezone.utc).isoformat().replace("+00:00", "Z")
    except (TypeError, ValueError):
        return None


def inventory_records(devices: list[dict[str, Any]], controller_id: str, observed_at: str,
                      policy_refs: list[str]) -> list[dict[str, Any]]:
    """Fleet inventory with software versions (Book 09 Ch05: CM-8, SI-2)."""
    records = []
    for device in devices:
        records.append({
            "record_kind": "fleet_inventory",
            "controller_id": controller_id,
            "evaluation_timestamp": observed_at,
            "device_uuid": device.get("uuid"),
            "host_name": device.get("host-name"),
            "system_ip": device.get("system-ip"),
            "site_id": device.get("site-id"),
            "role": role_of(device),
            "device_model": device.get("device-model"),
            "board_serial": device.get("board-serial"),
            "software_version": device.get("version"),
            "reachability": device.get("reachability"),
            "control_refs": ["CM-8", "SI-2"],
            "policy_refs": policy_refs,
            "source_api": "GET /dataservice/device",
            "derived": True,
        })
    return records


def _in_networks(address: str | None, networks: list[ipaddress._BaseNetwork]) -> bool:
    try:
        ip = ipaddress.ip_address(address or "")
    except ValueError:
        return False
    return any(ip in net for net in networks)


def audit_records(entries: list[dict[str, Any]], controller_id: str,
                  management_cidrs: list[str], policy_refs: list[str]) -> list[dict[str, Any]]:
    """Manager audit-log entries as evidence records (Book 09 Ch05: AU-6, AU-9)."""
    networks = [ipaddress.ip_network(c, strict=False) for c in management_cidrs]
    records = []
    for entry in entries:
        message = entry.get("logmessage") or ""
        flags = []
        if "authentication succeeded" in message.lower() or "login" in str(entry.get("logfeature", "")).lower():
            flags.append("successful_sign_in_review_against_authorized_users")
        if "root" in message.lower() and "authentication succeeded" in message.lower():
            flags.append("root_sign_in_assume_compromise")
        source = entry.get("logusersrcip")
        if networks and source and not _in_networks(source, networks):
            flags.append("source_outside_management_network")
        records.append({
            "record_kind": "management_audit",
            "controller_id": controller_id,
            "evaluation_timestamp": iso_from_ms(entry.get("entry_time")),
            "log_id": entry.get("logid"),
            "actor": entry.get("loguser"),
            "source_ip": source,
            "module": entry.get("logmodule"),
            "feature": entry.get("logfeature"),
            "device": entry.get("logdeviceid"),
            "message": message,
            "tenant": entry.get("tenant"),
            "review_flags": flags,
            "control_refs": ["AU-6", "AU-9", "AC-6(9)"],
            "policy_refs": policy_refs,
            "source_api": "GET /dataservice/auditlog",
            "derived": True,
        })
    return records


# --------------------------------------------------------------------------
# Orchestration
# --------------------------------------------------------------------------

def gate_status(findings: list[dict[str, Any]]) -> str:
    statuses = {f["status"] for f in findings}
    if "fail" in statuses:
        return "fail"
    if "confirm" in statuses:
        return "confirm"
    return "pass" if findings else "confirm"


def run(cfg: dict[str, Any], client: ManagerClient, floor_data: dict[str, Any],
        username: str, password: str, now: datetime | None = None) -> dict[str, Any]:
    observed_at = (now or datetime.now(timezone.utc)).isoformat().replace("+00:00", "Z")
    if cfg["auth_mode"] == "jwt":
        client.login_jwt(username, password, duration=min(int(cfg.get("token_duration", 900)), 1800))
    else:
        client.login_session(username, password)
    try:
        devices = client.get_devices()
        audit = client.get_audit_log(int(cfg.get("audit_lookback_hours", 24)))
    finally:
        client.logout()
    controller_id = cfg.get("controller_id") or urllib.parse.urlparse(cfg["manager_url"]).hostname
    policy_refs = cfg.get("policy_refs", [])
    findings = gate_findings(devices, floor_data, observed_at)
    findings += unexpected_control_components(devices, cfg.get("expected_control_components", []), observed_at)
    return {
        "generated_at": observed_at,
        "status_note": "illustrative; unit-tested against mocked responses, not proven against a live fabric",
        "gate": gate_status(findings),
        "gate_findings": findings,
        "records": inventory_records(devices, controller_id, observed_at, policy_refs)
        + audit_records(audit, controller_id, cfg.get("management_source_cidrs", []), policy_refs),
    }


def write_outputs(result: dict[str, Any], out_dir: str | Path) -> tuple[Path, Path]:
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    json_path = out / "sdwan-evidence.json"
    csv_path = out / "ed-26-03-gate.csv"
    json_path.write_text(json.dumps(result, indent=2), encoding="utf-8")
    fields = ["record_kind", "host_name", "system_ip", "role", "software_version",
              "advisory_id", "status", "reason"]
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(result["gate_findings"])
    return json_path, csv_path


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Read-only Catalyst SD-WAN evidence collector (illustrative)")
    parser.add_argument("--config", required=True, help="path to config.json")
    args = parser.parse_args(argv)
    try:
        cfg = load_config(args.config)
        base = Path(args.config).resolve().parent
        floor_data = json.loads((base / cfg["fixed_release_file"]).read_text(encoding="utf-8"))
        username = os.environ.get(cfg.get("username_env", "SDWAN_API_USERNAME"), "")
        password = os.environ.get(cfg.get("password_env", "SDWAN_API_PASSWORD"), "")
        if not username or not password:
            raise ConfigError("set the username and password environment variables named in the config")
        client = ManagerClient(cfg["manager_url"],
                               urllib_transport(cfg.get("ca_bundle") or None, int(cfg.get("timeout_seconds", 30))))
        result = run(cfg, client, floor_data, username, password)
        json_path, csv_path = write_outputs(result, base / cfg.get("output_dir", "./out"))
    except Exception as err:  # noqa: BLE001 - report and exit non-zero
        print(f"error: {err}", file=sys.stderr)
        return 1
    print(f"gate: {result['gate']}  evidence: {json_path}  findings: {csv_path}")
    return 0 if result["gate"] == "pass" else 2


if __name__ == "__main__":
    sys.exit(main())
