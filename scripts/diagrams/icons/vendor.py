"""Copy the product icons the diagrams use out of Microsoft's, AWS's and Google Cloud's official icon downloads.

    python scripts/diagrams/icons/vendor.py azure=<Azure_Public_Service_Icons_Vnn.zip> entra=<Microsoft Entra architecture icons - ....zip> aws=<AWS Icon-package_MMDDYYYY.zip> \n        google-core=<core-products-icons.zip> google-category=<category-icons.zip>

icons.yml names each icon the diagrams use, per set (`name: path inside the zip`). This
copies those files, unmodified, to scripts/diagrams/icons/<set>/<name>.svg and writes
manifest.json (each download, its page, each file's source path and SHA-256). A card in a
diagram source names one with `icon: <name>`; names are unique across sets.

Each set's terms are in SETS and are copied into manifest.json. Microsoft's (the icon pages
on Microsoft Learn): "Microsoft permits the use of these icons in architectural diagrams,
training materials, or documentation." AWS's (the AWS Architecture Icons page): "We allow
customers and partners to use these toolkits and assets to create architecture diagrams."
Google Cloud's (its icon library page): "Here you can find the Google Cloud product icons you
need for your diagrams, technical documentation, and more." The workbook uses them only in its diagrams, unmodified.
"""
from __future__ import annotations

import hashlib
import json
import sys
import zipfile
from pathlib import Path

import yaml

HERE = Path(__file__).resolve().parent
MICROSOFT_TERMS = ("Microsoft permits the use of these icons in architectural diagrams, training materials, or documentation. "
                   "You can copy, distribute, and display the icons only for the permitted use unless granted explicit permission by Microsoft. "
                   "Microsoft reserves all other rights.")
AWS_TERMS = ("We allow customers and partners to use these toolkits and assets to create architecture diagrams. "
             "You can also put icons in materials like whitepapers, presentations, data sheets, and posters.")
GOOGLE_TERMS = ("Welcome to the official library for Google Cloud product icons. "
                "Here you can find the Google Cloud product icons you need for your diagrams, technical documentation, and more.")
SETS = {
    "azure": {"prefix": "Azure_Public_Service_Icons/Icons/", "page": "https://learn.microsoft.com/azure/architecture/icons/",
              "terms": MICROSOFT_TERMS},
    "entra": {"prefix": "Microsoft Entra architecture icons - Oct 2023/", "page": "https://learn.microsoft.com/entra/architecture/architecture-icons",
              "terms": MICROSOFT_TERMS},
    "aws": {"prefix": "", "page": "https://aws.amazon.com/architecture/icons/", "terms": AWS_TERMS},
    # Google's 2025 icon system: unique icons for ~20 core products, one category icon for every other product.
    "google-core": {"prefix": "", "page": "https://cloud.google.com/icons", "terms": GOOGLE_TERMS},
    "google-category": {"prefix": "", "page": "https://cloud.google.com/icons", "terms": GOOGLE_TERMS},
}


def main(args: list[str]) -> int:
    zips = dict(a.split("=", 1) for a in args)
    want = yaml.safe_load((HERE / "icons.yml").read_text(encoding="utf-8"))
    if set(zips) != set(want):
        sys.exit(f"give one zip per set in icons.yml: {sorted(want)}")
    names = [n for s in want.values() for n in s]
    if len(names) != len(set(names)):
        sys.exit("an icon name is used in two sets; names must be unique")
    files, downloads = {}, {}
    for set_name, icons in want.items():
        z = zipfile.ZipFile(zips[set_name])
        inside = set(z.namelist())
        out = HERE / set_name
        out.mkdir(exist_ok=True)
        downloads[set_name] = {"download": Path(zips[set_name]).name, "documented_at": SETS[set_name]["page"],
                               "terms": SETS[set_name]["terms"]}
        for name, inner in sorted(icons.items()):
            full = SETS[set_name]["prefix"] + inner
            if full not in inside:
                sys.exit(f"{name}: {inner} isn't in {Path(zips[set_name]).name}")
            body = z.read(full)
            (out / f"{name}.svg").write_bytes(body)
            files[f"{set_name}/{name}.svg"] = {"source": inner, "bytes": len(body), "sha256": hashlib.sha256(body).hexdigest()}
        for stale in out.glob("*.svg"):
            if f"{set_name}/{stale.name}" not in files:
                stale.unlink()
    manifest = {
        "_comment": "Vendor architecture icons (Microsoft, AWS, Google Cloud), copied unmodified by vendor.py from the downloads named below. "
                    "Used only in the workbook's diagrams, as each vendor's icon terms (under downloads) permit. Never edit the SVGs; re-run vendor.py.",
        "downloads": downloads,
        "files": dict(sorted(files.items())),
    }
    (HERE / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"{len(files)} icon(s) vendored from {len(zips)} download(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
