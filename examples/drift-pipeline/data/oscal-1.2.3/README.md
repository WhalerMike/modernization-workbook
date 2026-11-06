# OSCAL 1.2.3 JSON schemas (pinned copies)

Unmodified copies of two JSON schemas from the NIST OSCAL release [v1.2.3](https://github.com/usnistgov/OSCAL/releases/tag/v1.2.3) (published August 7, 2026; tag commit `a504f40be661d4c1758e753643b0164978a9c2f1`), downloaded November 6, 2026 from the release assets. `python/oscal_export.py validate` and `tests/test_oscal_export.py` check the converter's output against them.

| File | Bytes | SHA-256 |
|---|---|---|
| `oscal_assessment-results_schema.json` | 152214 | `4034e2032332dbf597e59e0646ec16c2c31df992962490371e91f47b219ff42c` |
| `oscal_poam_schema.json` | 148253 | `f4fd94487408a9589954b5b92d88965c984d4f79b85365cc574b860898759437` |

**License.** NIST publishes the OSCAL repository as a work of the United States government, in the public domain in the United States and dedicated worldwide under CC0 1.0 ([LICENSE.md](https://github.com/usnistgov/OSCAL/blob/main/LICENSE.md)). The files are NIST's, provided "as is"; NIST is the source. Don't edit them: `tests/test_oscal_export.py` fails if a byte changes. To move to a newer release, replace both files from that release, update this table and `OSCAL_VERSION` in `python/oscal_export.py`, and rerun the tests.

**Validating needs two third-party packages.** The schemas use Unicode property escapes (`\p{L}`) in patterns, which Python's `re` rejects, so `validate` routes the pattern check through the `regex` package: `pip install jsonschema regex`. Generating the documents needs neither.
