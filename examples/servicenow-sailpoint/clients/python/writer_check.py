"""Check that each Entra ID user attribute has one writer: Entra inbound provisioning or SailPoint, not both.

Gap 4 of the Ticket-to-Machine example: if Entra inbound provisioning from
HR and SailPoint's Entra source both write the same attribute, each
overwrites the other and drift never settles. The design guidance is one
writer per attribute. This read-only check compares two exports:

  * the inbound provisioning job's synchronizationSchema from Microsoft
    Graph (GET /servicePrincipals/{id}/synchronization/jobs/{jobId}/schema):
    each attributeMapping's targetAttributeName on the rule whose target is
    the Entra directory, and its flowType (Always, or ObjectAddOnly for
    create only);
  * the provisioning policies of the ISC source that writes to Entra ID
    (GET /v3/sources/{sourceId}/provisioning-policies): fields[].name per
    usageType (UPDATE writes on every change, CREATE only at creation).

  Finding  both update the attribute
  Warn     one updates it and the other sets it at creation
  Info     both set it only at creation

SailPoint's field names aren't necessarily Entra's attribute names; give
each pair that differs with --alias (field=attribute). Names otherwise
match case-insensitively. Reads files only: it calls no network.

Examples (from the kit root):

  # The fictional exports, with one name that differs
  python clients/python/writer_check.py --entra-schema tests/fixtures/writers/entra_inbound_schema.json --isc-policies tests/fixtures/writers/isc_entra_source_policies.json --alias title=jobTitle

  # As JSON, naming the Entra directory as your schema does
  python clients/python/writer_check.py --entra-schema schema.json --isc-policies policies.json --entra-directory "Azure Active Directory" --json
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import Any, Iterable, Mapping

ENTRA_UPDATE_FLOWS = {"always", ""}          # flowType default is Always
ENTRA_CREATE_FLOWS = {"objectaddonly"}
ISC_UPDATE_USAGES = {"UPDATE"}
ISC_CREATE_USAGES = {"CREATE"}


def entra_writes(schema: Mapping[str, Any], directory: str) -> dict[str, str]:
    """{attribute (lower case): 'update' | 'create'} for the rules that target the Entra directory."""
    out: dict[str, str] = {}
    rules = [r for r in schema.get("synchronizationRules") or [] if r.get("targetDirectoryName") == directory]
    if not rules:
        names = sorted({r.get("targetDirectoryName") for r in schema.get("synchronizationRules") or []})
        raise ValueError(f"No synchronization rule targets {directory!r}; the schema's targets are {names}")
    for rule in rules:
        for mapping in rule.get("objectMappings") or []:
            if mapping.get("enabled") is False or mapping.get("targetObjectName", "User").lower() != "user":
                continue
            for attr in mapping.get("attributeMappings") or []:
                name = (attr.get("targetAttributeName") or "").lower()
                if not name:
                    continue
                flow = (attr.get("flowType") or "").lower()
                kind = "update" if flow in ENTRA_UPDATE_FLOWS else "create" if flow in ENTRA_CREATE_FLOWS else "update"
                out[name] = "update" if "update" in (kind, out.get(name)) else "create"
    return out


def isc_writes(policies: Iterable[Mapping[str, Any]], aliases: Mapping[str, str]) -> dict[str, str]:
    alias = {k.lower(): v.lower() for k, v in aliases.items()}
    out: dict[str, str] = {}
    for policy in policies:
        usage = policy.get("usageType")
        if usage in ISC_UPDATE_USAGES:
            kind = "update"
        elif usage in ISC_CREATE_USAGES:
            kind = "create"
        else:
            continue
        for field in policy.get("fields") or []:
            name = (field.get("name") or "").lower()
            if not name:
                continue
            name = alias.get(name, name)
            out[name] = "update" if "update" in (kind, out.get(name)) else "create"
    return out


def entra_display_names(schema: Mapping[str, Any]) -> dict[str, str]:
    """{lower case: name as the schema spells it}, for readable output."""
    return {(a.get("targetAttributeName") or "").lower(): a.get("targetAttributeName")
            for r in schema.get("synchronizationRules") or [] for m in r.get("objectMappings") or []
            for a in m.get("attributeMappings") or [] if a.get("targetAttributeName")}


def check(entra: Mapping[str, str], isc: Mapping[str, str], display: Mapping[str, str] | None = None) -> list[dict]:
    display = display or {}
    findings = []
    for name in sorted(entra.keys() & isc.keys()):
        pair = (entra[name], isc[name])
        if pair == ("update", "update"):
            severity, why = "Finding", "both update it: each overwrites the other, so drift never settles"
        elif "update" in pair:
            severity, why = "Warn", "one updates it and the other sets it at creation: two sources for its first value"
        else:
            severity, why = "Info", "both set it only at creation"
        findings.append({"attribute": display.get(name, name), "severity": severity, "entra_inbound": entra[name],
                         "sailpoint": isc[name], "why": why})
    return findings


def parse_aliases(items: Iterable[str]) -> dict[str, str]:
    out = {}
    for item in items:
        if "=" not in item:
            raise ValueError(f"--alias takes field=attribute, not {item!r}")
        field, attribute = item.split("=", 1)
        out[field.strip()] = attribute.strip()
    return out


def main(argv: list[str] | None = None, out=None) -> int:
    out = out or sys.stdout
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--entra-schema", required=True, help="synchronizationSchema JSON of the inbound provisioning job")
    parser.add_argument("--isc-policies", required=True, help="Provisioning policies JSON of the ISC source that writes to Entra")
    parser.add_argument("--entra-directory", default="Azure Active Directory",
                        help="targetDirectoryName of the Entra directory in the schema (default: Azure Active Directory)")
    parser.add_argument("--alias", action="append", default=[], help="SailPoint field=Entra attribute, when they differ")
    parser.add_argument("--json", action="store_true", help="Print the findings as JSON")
    args = parser.parse_args(argv)
    with open(args.entra_schema, encoding="utf-8") as handle:
        schema = json.load(handle)
    with open(args.isc_policies, encoding="utf-8") as handle:
        policies = json.load(handle)
    try:
        entra = entra_writes(schema, args.entra_directory)
        isc = isc_writes(policies, parse_aliases(args.alias))
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    findings = check(entra, isc, entra_display_names(schema))
    if args.json:
        print(json.dumps({"findings": findings, "entra_inbound": entra, "sailpoint": isc}, indent=2, sort_keys=True),
              file=out)
    else:
        counts = {s: sum(1 for f in findings if f["severity"] == s) for s in ("Finding", "Warn", "Info")}
        print(f"Entra inbound writes {len(entra)} attributes; SailPoint writes {len(isc)}; "
              f"{counts['Finding']} Finding, {counts['Warn']} Warn, {counts['Info']} Info", file=out)
        for f in findings:
            print(f"  {f['severity']:<7} {f['attribute']:<18} Entra {f['entra_inbound']:<6} SailPoint {f['sailpoint']:<6} "
                  f"{f['why']}", file=out)
    return 1 if any(f["severity"] == "Finding" for f in findings) else 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
