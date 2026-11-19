"""Writes tests/fixtures/exported/edited.workbook.json: the kit's template as someone might export it from the
portal's Advanced Editor after editing the workbook by hand (fictional). Four changes, each one a validator
finding: the workspace saved into fallbackResourceIds and into one query's resources, the not-evidence banner
deleted from the grants tab, and the devices look-back widened to 30 days. Run from examples/daily-checks-workbook."""
import json
from pathlib import Path

here = Path(__file__).resolve().parent
kit = here.parents[1]
wb = json.loads((kit / "workbook" / "daily-checks.workbook.json").read_text(encoding="utf-8"))
ws = "/subscriptions/aaaa0a0a-bb1b-cc2c-dd3d-eeeeee4e4e4e/resourceGroups/rg-contoso-sentinel/providers/Microsoft.OperationalInsights/workspaces/law-contoso-sentinel"
wb["fallbackResourceIds"] = [ws]
banner = json.loads((kit / "config" / "manifest.json").read_text(encoding="utf-8"))["banner"]
for item in wb["items"]:
    if item.get("type") != 12:
        continue
    tab = item["conditionalVisibility"]["value"]
    for inner in item["content"]["items"]:
        if tab == "grants" and inner["type"] == 1:
            inner["content"]["json"] = inner["content"]["json"].replace(f"**{banner}**\n\n", "")
        if tab == "devices" and inner["type"] == 3:
            inner["content"]["query"] = inner["content"]["query"].replace("ago(3d)", "ago(30d)")
        if tab == "risk" and inner["type"] == 3 and inner["name"] == "risk-2":
            inner["content"]["crossComponentResources"] = [ws]
out = here / "exported" / "edited.workbook.json"
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(wb, indent=2, sort_keys=True) + "\n", encoding="utf-8", newline="\n")
print(out.relative_to(kit).as_posix())
