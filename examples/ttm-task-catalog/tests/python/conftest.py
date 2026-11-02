"""Test helpers: put the kit, and the integration kit's finding contract, on sys.path."""

import sys
from pathlib import Path

KIT = Path(__file__).resolve().parents[2]
REPO = KIT.parents[1]
sys.path.insert(0, str(KIT))
sys.path.insert(0, str(KIT.parent / "servicenow-sailpoint" / "clients" / "python"))
