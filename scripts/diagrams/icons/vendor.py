"""Copy the Microsoft product icons the diagrams use out of Microsoft's icon download.

    python scripts/diagrams/icons/vendor.py <Azure_Public_Service_Icons_Vnn.zip>

icons.yml names each icon the diagrams use (`name: path inside the zip`). This copies those
files, unmodified, to scripts/diagrams/icons/azure/<name>.svg and writes manifest.json (the
download, its version, each file's source path and SHA-256). A card in a diagram source
names one with `icon: <name>`.

Microsoft's terms for these icons (Azure architecture icons page on Microsoft Learn):
"Microsoft permits the use of these icons in architectural diagrams, training materials, or
documentation." The workbook uses them only in its diagrams, unmodified.
"""
from __future__ import annotations

import hashlib
import json
import sys
import zipfile
from pathlib import Path

import yaml

HERE = Path(__file__).resolve().parent
SOURCE = "https://learn.microsoft.com/azure/architecture/icons/"


def main(zip_path: str) -> int:
    want = yaml.safe_load((HERE / "icons.yml").read_text(encoding="utf-8"))
    z = zipfile.ZipFile(zip_path)
    names = set(z.namelist())
    out = HERE / "azure"
    out.mkdir(exist_ok=True)
    files = {}
    for name, inner in sorted(want["azure"].items()):
        full = f"Azure_Public_Service_Icons/Icons/{inner}"
        if full not in names:
            sys.exit(f"{name}: {inner} isn't in {Path(zip_path).name}")
        body = z.read(full)
        (out / f"{name}.svg").write_bytes(body)
        files[f"azure/{name}.svg"] = {"source": inner, "bytes": len(body), "sha256": hashlib.sha256(body).hexdigest()}
    for stale in out.glob("*.svg"):
        if f"azure/{stale.name}" not in files:
            stale.unlink()
    manifest = {
        "_comment": "Microsoft's Azure architecture icons, copied unmodified by vendor.py from the download named below. "
                    "Used only in the workbook's diagrams, as Microsoft's icon terms permit. Never edit the SVGs; re-run vendor.py.",
        "download": Path(zip_path).name,
        "documented_at": SOURCE,
        "terms": "Microsoft permits the use of these icons in architectural diagrams, training materials, or documentation. "
                 "You can copy, distribute, and display the icons only for the permitted use unless granted explicit permission by Microsoft. "
                 "Microsoft reserves all other rights.",
        "files": files,
    }
    (HERE / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"{len(files)} icon(s) vendored from {Path(zip_path).name}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
