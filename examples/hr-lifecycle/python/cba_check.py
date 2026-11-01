"""Certificate-based authentication configuration checks: every trusted issuing CA with a reachable CRL
sized for the cloud's limit, the method enabled with PIV certificates mapped to multifactor, and a
Conditional Access policy that requires a phishing-resistant authentication strength.

Gate 5 of the HR-driven identity implementation guide. It reads the cba-read exports (graph_export.py
--task cba-read): the PKI trust store's certificate authorities, the X.509 certificate authentication
method configuration, the authentication strength policies and the Conditional Access policies; and a
CRL measurement file that `measure` writes by downloading each CRL. Binding coverage and affinity per
user are the validation kit's VK-PIV-01 (Book 19, Chapter 03); this tool checks the tenant's settings.

Illustrative: unit-tested against fixtures, not proven against a live tenant. Standard library only.

    python python/cba_check.py measure --urls tests/fixtures/ch05/crl-urls.txt --out out/ch05/crl-measurements.csv
    python python/cba_check.py check --cloud gcc --exports tests/fixtures/ch05/exports --crl tests/fixtures/ch05/crl-measurements.csv --expected config/cba-expected.json --as-of 2026-11-01 --out out/ch05/check

Exit codes: 0 clean, 2 findings or warnings, 1 error.
"""
from __future__ import annotations

import argparse
import datetime as dt
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hrlc_core import (  # noqa: E402
    EXIT_ERROR, EXIT_OK, HrlcError, cloud, csv_text, exit_code, finding, iso, parse_time, read_csv, read_json,
    sort_findings, summary_line, values, write_output, write_text,
)

LOW_AFFINITY_FIELDS = {"PrincipalName", "RFC822Name"}   # the validation kit's affinity table (Learn's username binding policy)


def measure(urls: list[str], timeout: float = 15.0, opener=urllib.request.urlopen) -> list[dict[str, Any]]:
    """Download each CRL once and record its size and time. A local path is read as a file, for labs."""
    rows = []
    for u in urls:
        start = time.monotonic()
        try:
            if urllib.parse.urlparse(u).scheme in ("http", "https"):
                with opener(urllib.request.Request(u, method="GET"), timeout=timeout) as resp:
                    size = len(resp.read())
            else:
                size = Path(u).stat().st_size
            err = ""
        except Exception as e:  # recorded, not raised: an unreachable CRL is the finding
            size, err = 0, type(e).__name__
        rows.append({"url": u, "bytes": size, "seconds": round(time.monotonic() - start, 3), "error": err,
                     "measuredAt": iso(dt.datetime.now(dt.timezone.utc))})
    return rows


def _one(exports: Path, name: str) -> Any:
    rows = values(read_json(exports / f"{name}.json"))
    if len(rows) != 1:
        raise HrlcError(f"{name}.json: expected one object, found {len(rows)}")
    return rows[0]


def check(cl: dict[str, Any], cas: list[dict[str, Any]], x509: dict[str, Any], strengths: list[dict[str, Any]],
          ca_policies: list[dict[str, Any]], crl: list[dict[str, str]], expected: dict[str, Any], as_of: str) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    lim = expected["crlLimits"][cl["name"]]
    meas = {r["url"]: r for r in crl}
    now = parse_time(as_of)
    thumbs = {str(c.get("thumbprint", "")).upper() for c in cas}
    for e in expected["issuingCas"]:
        if e["thumbprint"].upper() not in thumbs:
            out.append(finding("CB-12", "Finding", e["thumbprint"], e["displayName"], "issuing CA the card program uses isn't in the trust store"))
    for c in cas:
        key, name = c.get("thumbprint") or c.get("id", ""), c.get("displayName") or c.get("issuer", "")
        url = c.get("certificateRevocationListUrl") or ""
        exp = parse_time(c.get("expirationDateTime"))
        if exp and (exp - now).days <= int(expected["caExpiryWarnDays"]):
            out.append(finding("CB-11", "Warn", key, name, f"CA certificate expires {exp.date().isoformat()}"))
        if c.get("certificateAuthorityType") == "root" and not url:
            # Learn's prerequisite is a CRL for each CA, and Entra checks CRLs up the chain; a root that
            # issues only CA certificates may publish none, so this is a warning to confirm, not a finding.
            out.append(finding("CB-01", "Warn", key, name, "root CA with no CRL configured; Learn asks for a CRL on each CA; confirm the root's revocation path"))
            continue
        if not url:
            out.append(finding("CB-01", "Finding", key, name, "no CRL configured: Entra doesn't check revocation for this CA"))
            continue
        if not url.lower().startswith("http://"):
            out.append(finding("CB-02", "Warn", key, name, f"CRL endpoint {url} isn't HTTP; Learn recommends HTTP"))
        m = meas.get(url)
        if m is None:
            out.append(finding("CB-06", "Finding", key, name, f"no measurement for {url}; run `measure` against every CRL"))
            continue
        if m.get("error"):
            out.append(finding("CB-04", "Finding", key, name, f"CRL couldn't be downloaded ({m['error']}); CBA fails for this CA's certificates"))
            continue
        size, secs = int(m["bytes"]), float(m["seconds"])
        if size > lim["interactiveBytes"]:
            out.append(finding("CB-03", "Finding", key, name, f"CRL is {size:,} bytes, over the {cl['name']} interactive limit of {lim['interactiveBytes']:,}"))
        elif size > lim["interactiveBytes"] * int(expected["warnPercent"]) / 100:
            out.append(finding("CB-05", "Warn", key, name, f"CRL is {size:,} bytes, over {expected['warnPercent']}% of the {cl['name']} interactive limit"))
        if secs > lim["downloadSeconds"]:
            out.append(finding("CB-04", "Finding", key, name, f"CRL took {secs:g} s to download; the limit is {lim['downloadSeconds']} s"))
    if x509.get("state") != "enabled":
        out.append(finding("CB-07", "Finding", "x509Certificate", "X.509 certificate method", f"method state is {x509.get('state')!r}"))
    crlv = x509.get("crlValidationConfiguration") or {}
    if crlv.get("state") != "enabled":
        out.append(finding("CB-08", "Warn", "crlValidation", "CRL validation", "CBA doesn't require a CRL from every CA (crlValidationConfiguration isn't enabled)"))
    for ski in crlv.get("exemptedCertificateAuthoritiesSubjectKeyIdentifiers") or []:
        out.append(finding("CB-08", "Warn", f"exempt:{ski}", f"CA {ski}", "exempted from CRL validation; allowed only while its CRL is fixed, with an end date"))
    mode = x509.get("authenticationModeConfiguration") or {}
    mfa_oids = {str(r.get("identifier")) for r in mode.get("rules") or []
                if r.get("x509CertificateRuleType") == "policyOID" and r.get("x509CertificateAuthenticationMode") == "x509CertificateMultiFactor"}
    missing = [o for o in expected["multifactorPolicyOids"] if o not in mfa_oids]
    if missing and mode.get("x509CertificateAuthenticationDefaultMode") != "x509CertificateMultiFactor":
        out.append(finding("CB-09", "Finding", "authenticationMode", "authentication mode", f"PIV policy OID(s) {', '.join(missing)} not mapped to multifactor, and the default is single-factor"))
    low = sorted({b.get("x509CertificateField") for b in x509.get("certificateUserBindings") or []} & LOW_AFFINITY_FIELDS)
    if low:
        out.append(finding("CB-13", "Warn", "bindings", "username bindings", f"low-affinity binding fields configured ({', '.join(low)}); align with the affinity decision (ADM Gate 6) and VK-PIV-01"))
    pr = set(expected["phishingResistantCombinations"])
    strong = {s["id"] for s in strengths if s.get("allowedCombinations") and set(s["allowedCombinations"]) <= pr}
    covered = False
    for p in ca_policies:
        users = ((p.get("conditions") or {}).get("users") or {})
        apps = ((p.get("conditions") or {}).get("applications") or {})
        sid = (((p.get("grantControls") or {}).get("authenticationStrength") or {}).get("id"))
        if p.get("state") == "enabled" and "All" in (users.get("includeUsers") or []) and "All" in (apps.get("includeApplications") or []) and sid in strong:
            covered = True
    if not covered:
        out.append(finding("CB-10", "Finding", "conditionalAccess", "Conditional Access",
                           "no enabled policy for all users and all resources requires a phishing-resistant authentication strength (SCuBA MS.AAD.3.1v1)"))
    return sort_findings(out)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    me = sub.add_parser("measure", help="download each CRL and record its size and time")
    me.add_argument("--urls", type=Path, required=True, help="one CRL URL (or local path) per line")
    me.add_argument("--out", type=Path, required=True, help="the CSV to write")
    ch = sub.add_parser("check", help="check the CBA configuration (CB-01 to CB-13)")
    ch.add_argument("--cloud", required=True)
    ch.add_argument("--exports", type=Path, required=True, help="the folder graph_export.py --task cba-read wrote")
    ch.add_argument("--crl", type=Path, required=True, help="crl-measurements.csv from `measure`")
    ch.add_argument("--expected", type=Path, required=True)
    ch.add_argument("--as-of", required=True)
    ch.add_argument("--tenant-id", default="contoso-fixture")
    ch.add_argument("--out", type=Path, required=True)
    args = ap.parse_args(argv)
    try:
        if args.cmd == "measure":
            urls = [u.strip() for u in args.urls.read_text(encoding="utf-8").splitlines() if u.strip() and not u.startswith("#")]
            rows = measure(urls)
            write_text(args.out, csv_text(rows, ["url", "bytes", "seconds", "error", "measuredAt"]))
            for r in rows:
                print(f"  {r['bytes']:>12,} bytes  {r['seconds']:>7.3f} s  {r['url']}{'  ' + r['error'] if r['error'] else ''}")
            print(f"Measured {len(rows)} CRL(s) -> {args.out.as_posix()}")
            return EXIT_OK
        cl = cloud(args.cloud)
        x = args.exports
        rows = check(cl, values(read_json(x / "pki-cas.json")), _one(x, "x509-method"), values(read_json(x / "auth-strengths.json")),
                     values(read_json(x / "ca-policies.json")), read_csv(args.crl), read_json(args.expected), args.as_of)
        write_output(args.out, "cba-check", {"findings.json": rows}, {"tool": "cba_check.py", "cloud": cl["name"], "tenantId": args.tenant_id, "asOf": args.as_of})
        lim = read_json(args.expected)["crlLimits"][cl["name"]]
        print(f"Cloud {cl['name']}: interactive CRL limit {lim['interactiveBytes']:,} bytes, download within {lim['downloadSeconds']} s")
        print(summary_line("CBA", rows))
        for r in rows:
            print(f"  {r['Rule']} {r['Severity']}: {r['Object']}: {r['Issue']}")
        return exit_code(rows)
    except (HrlcError, OSError, KeyError, ValueError) as e:
        print(f"error: {e}", file=sys.stderr)
        return EXIT_ERROR


if __name__ == "__main__":
    sys.exit(main())
