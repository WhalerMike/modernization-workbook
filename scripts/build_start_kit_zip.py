#!/usr/bin/env python3
"""Build downloads/<kit>.zip from examples/<kit> (default: the Start Kit).

Book 00 Chapter 08 and Book 06 Runbook R02 link the Start Kit as a download, and Book 15
Chapter 13 links the Copilot agent pack (--kit copilot-agent-pack), and Book 18 Chapter 08
the application modernization reference implementation (--kit app-modernization), and the
Ansible companion guide links its example playbooks (--kit ansible, published as ansible-examples.zip),
and the track implementation guides link the validation kit (--kit validation-kit).
The developer workbook Building the Attribute-Driven Migration links the code its nine
chapters build on (--kit attribute-driven-migration-code), a bundle of several examples
folders rather than one: see BUNDLES.
This packs the folder as
it is in the repository, scripts, README, fixtures and tests, under a top-level <kit>/
folder. The archive is reproducible: entries are sorted, timestamps fixed and
line endings left as committed, so the same commit always gives the same bytes.

Every script, code and data file also gets a plain-text copy beside it, named with .txt
added (Get-Thing.ps1 -> Get-Thing.ps1.txt), because Microsoft 365 Copilot and some mail
systems refuse to take .ps1, .py and similar files. The copies are made here, not
committed, so they can't drift from the originals.

Usage: python3 scripts/build_start_kit_zip.py [--kit start-kit] [--out _site/downloads]
Default output directory: _site/downloads (the site's /downloads/ URL).
Standard library only.
"""

from __future__ import annotations

import argparse
import hashlib
import sys
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
KITS = ("start-kit", "copilot-agent-pack", "app-modernization", "ansible", "validation-kit",
        "attribute-driven-migration-code")
# Kits packed from several examples folders, each kept under its own path, instead of
# from examples/<kit>. The Attribute-Driven Migration developer workbook's chapters 01-09
# build on these folders and the Microsoft samples pinned under third_party/.
BUNDLES = {
    "attribute-driven-migration-code": (
        "hcm-entra", "ms-automation", "validation-kit", "dynamic-rules", "lifecycle-extensions",
        "group-policy-as-code", "machine-configuration", "ansible", "drift-pipeline",
        "third_party/csv2scim", "third_party/msgraph-snippets-python",
        "third_party/dynamic-membership-samples", "third_party/lifecycle-workflows-logic-app",
        "third_party/mggraph-intune-samples", "third_party/guest-configuration-samples",
        "third_party/azure-arc-role", "third_party/azure-login-action",
        "third_party/azure-login-oidc-sample",
    ),
}
# Kits whose download name differs from their folder name.
ZIP_NAMES = {"ansible": "ansible-examples"}
# Files that must stay executable once extracted, beyond shell scripts: Ansible runs an
# inventory script only if it has the execute bit.
EXECUTABLES = {"ansible": {"inventory/cmdb_inventory.py"},
               "attribute-driven-migration-code": {"ansible/inventory/cmdb_inventory.py"}}
FIXED_TIME = (2026, 1, 1, 0, 0, 0)
SKIP_PARTS = {"__pycache__", ".pytest_cache", "node_modules", "target", "dist", "reports"}
# Windows can't create these names, so a file called one would break extraction there.
RESERVED = {"con", "prn", "aux", "nul"} | {f"com{i}" for i in range(1, 10)} | {f"lpt{i}" for i in range(1, 10)}
# Files that get a .txt copy: scripts, code, configuration and data.
TXT_COPY = {
    ".ps1", ".psm1", ".psd1", ".py", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".java",
    ".sql", ".sh", ".cmd", ".bat", ".json", ".xml", ".yml", ".yaml", ".csv", ".toml",
    ".properties", ".ini", ".cfg", ".gradle", ".html", ".css", ".conf", ".example",
}
TXT_COPY_NAMES = {"mvnw", "Dockerfile"}


def kit_files(kit: Path, base: Path | None = None) -> list[Path]:
    """Files under kit; reserved names are checked on the path relative to base (default kit)."""
    base = base or kit
    files = []
    for path in sorted(kit.rglob("*")):
        if not path.is_file() or SKIP_PARTS.intersection(path.parts):
            continue
        for part in path.relative_to(base).parts:
            if part.split(".")[0].lower() in RESERVED:
                raise SystemExit(f"Reserved Windows file name in the kit: {path.relative_to(REPO)}")
        files.append(path)
    return files


def needs_copy(path: Path) -> bool:
    return path.suffix.lower() in TXT_COPY or path.name in TXT_COPY_NAMES


def entries(kit: Path, files: list[Path]) -> list[tuple[str, Path]]:
    """Archive names (relative to the kit) and their sources, with the .txt copies."""
    out = []
    for path in files:
        rel = path.relative_to(kit).as_posix()
        out.append((rel, path))
        if needs_copy(path):
            if path.with_name(path.name + ".txt").exists():
                raise SystemExit(f"Committed .txt copy would collide: {path.relative_to(REPO)}.txt")
            out.append((rel + ".txt", path))
    return sorted(out)


def build(out_dir: Path, name: str = "start-kit") -> Path:
    if name in BUNDLES:
        kit = REPO / "examples"
        files = []
        for folder in BUNDLES[name]:
            part = kit_files(kit / folder, base=kit)
            if not part:
                raise SystemExit(f"No files under examples/{folder}")
            files += part
    else:
        kit = REPO / "examples" / name
        files = kit_files(kit)
    if not files:
        raise SystemExit(f"No files under {kit.relative_to(REPO)}")
    out_dir.mkdir(parents=True, exist_ok=True)
    zip_name = ZIP_NAMES.get(name, name)
    target = out_dir / f"{zip_name}.zip"
    with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for rel, path in entries(kit, files):
            info = zipfile.ZipInfo(f"{zip_name}/{rel}", date_time=FIXED_TIME)
            info.compress_type = zipfile.ZIP_DEFLATED
            # Keep shell scripts such as mvnw runnable on Linux and macOS.
            executable = not rel.endswith(".txt") and (
                path.name == "mvnw" or path.suffix == ".sh" or rel in EXECUTABLES.get(name, set())
            )
            info.external_attr = (0o755 if executable else 0o644) << 16
            zf.writestr(info, path.read_bytes())
    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    copies = sum(1 for path in files if needs_copy(path))
    print(f"{zip_name}: {len(files)} files and {copies} .txt copies -> {target} (sha256 {digest})")
    return target


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--out", type=Path, default=REPO / "_site" / "downloads", help="output directory")
    parser.add_argument("--kit", choices=KITS, default="start-kit", help="folder under examples/")
    args = parser.parse_args(argv)
    build(args.out, args.kit)
    return 0


if __name__ == "__main__":
    sys.exit(main())
