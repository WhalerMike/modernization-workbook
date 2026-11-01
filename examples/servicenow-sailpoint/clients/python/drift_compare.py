"""Compare two drift reconciliation runs: what is new, what persists, what is gone.

Reads two outputs of identity_drift.py (--out-json) and compares their
findings by finding_id, which is a hash of the class, system, employee ID,
object ID and attribute, so the same drift gets the same ID on every run.

  new        in the current run only: raise it (--push-to-servicenow)
  persisting in both: already raised; the de-duplication adds a counter
  resolved   in the previous run only: the drift is no longer measured.
             That is a lead for the re-read, not a closure: the record
             still closes only when reread_verification.py reads the
             intended state

It also refuses to compare runs that computed different drift classes (one
with the Entra audit and one without, say), because a class that wasn't
computed would look resolved. Read-only and offline.

Examples (from the kit root):

  # Day 1 and day 2 of the fictional estate
  python clients/python/drift_compare.py --previous day1.json --current day2.json

  # As JSON, for a pipeline
  python clients/python/drift_compare.py --previous day1.json --current day2.json --json
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import Any, Mapping


class CompareError(Exception):
    """Two runs that can't be compared honestly."""


def load_run(path: str) -> dict:
    with open(path, encoding="utf-8") as handle:
        run = json.load(handle)
    if "findings" not in run or "computed" not in run:
        raise CompareError(f"{path} isn't an identity_drift.py output (no findings or computed)")
    return run


def compare_runs(previous: Mapping[str, Any], current: Mapping[str, Any]) -> dict:
    if sorted(previous["computed"]) != sorted(current["computed"]):
        raise CompareError(
            "The runs computed different drift classes (previous: " + ", ".join(sorted(previous["computed"]))
            + "; current: " + ", ".join(sorted(current["computed"])) + "). A class one run didn't compute "
            "would look resolved; rerun with the same inputs.")
    before = {f["finding_id"]: f for f in previous["findings"]}
    after = {f["finding_id"]: f for f in current["findings"]}

    def brief(f: Mapping[str, Any]) -> dict:
        return {k: f.get(k) for k in ("finding_id", "drift_class", "system", "employee_id", "object_name",
                                       "attribute", "expected", "observed", "priority")}

    new = [brief(after[i]) for i in sorted(after.keys() - before.keys())]
    persisting = [brief(after[i]) for i in sorted(after.keys() & before.keys())]
    resolved = [brief(before[i]) for i in sorted(before.keys() - after.keys())]
    by_class: dict[str, dict[str, int]] = {}
    for label, items in (("new", new), ("persisting", persisting), ("resolved", resolved)):
        for f in items:
            by_class.setdefault(f["drift_class"], {"new": 0, "persisting": 0, "resolved": 0})[label] += 1
    return {"new": new, "persisting": persisting, "resolved": resolved, "by_class": by_class,
            "computed": sorted(current["computed"])}


def main(argv: list[str] | None = None, out=None) -> int:
    out = out or sys.stdout
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--previous", required=True, help="The earlier identity_drift.py JSON output")
    parser.add_argument("--current", required=True, help="The later identity_drift.py JSON output")
    parser.add_argument("--json", action="store_true", help="Print the comparison as JSON")
    args = parser.parse_args(argv)
    try:
        result = compare_runs(load_run(args.previous), load_run(args.current))
    except CompareError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    if args.json:
        print(json.dumps(result, indent=2, sort_keys=True, default=str), file=out)
        return 0
    print(f"{len(result['new'])} new, {len(result['persisting'])} persisting, {len(result['resolved'])} resolved",
          file=out)
    for label in ("new", "resolved"):
        for f in result[label]:
            print(f"  {label:<9} {f['finding_id']} {f['drift_class']} {f['system']} {f['employee_id'] or '-'} "
                  f"{f['attribute'] or '-'}: expected {f['expected']!r}, observed {f['observed']!r}", file=out)
    if result["resolved"]:
        print("Resolved findings are leads for the re-read; their records close only on reread_verification.py.",
              file=out)
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
