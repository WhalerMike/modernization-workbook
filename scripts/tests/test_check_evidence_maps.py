"""Tests for scripts/check_evidence_maps.py: the schema, the rules and the summary.

Needs PyYAML and jsonschema.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import copy
import datetime as dt
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import check_evidence_maps as em  # noqa: E402

SAMPLE = em.MAPS / "sample-portfolio.yml"


def minimal() -> dict:
    return {
        "map": {"id": "FMP-EM-T", "title": "Test", "as_of": "2026-10-30", "stale_after_days": 100},
        "entities": [
            {"id": "E-APP", "type": "application", "name": "App"},
            {"id": "E-DB", "type": "data_store", "name": "Master", "master_record": True},
            {"id": "E-DOC", "type": "governance_document", "name": "Notice"},
        ],
        "relationships": [
            {"id": "R-APP-DB", "from": "E-APP", "to": "E-DB", "kind": "reads", "basis": "observed",
             "evidence": [{"ref": "log", "revised": "2026-10-01"}], "observed": "2026-10-01",
             "confidence": "measured", "status": "current"},
        ],
        "open_questions": [],
    }


def errors(doc: dict) -> list[str]:
    return em.schema_errors(doc) or em.check(doc)[0]


class Sample(unittest.TestCase):
    def test_sample_is_clean_and_its_summary_current(self):
        rep, = em.run([SAMPLE], write=False)
        self.assertEqual(rep.errors, [])

    def test_dates_stay_strings(self):
        self.assertIsInstance(em.load(SAMPLE)["map"]["as_of"], str)


class Schema(unittest.TestCase):
    def test_minimal_passes(self):
        self.assertEqual(errors(minimal()), [])

    def test_observed_basis_needs_a_date(self):
        doc = minimal()
        del doc["relationships"][0]["observed"]
        self.assertTrue(em.schema_errors(doc))

    def test_measured_must_be_observed(self):
        doc = minimal()
        doc["relationships"][0]["basis"] = "documented"
        self.assertTrue(em.schema_errors(doc))

    def test_exchange_needs_a_partner(self):
        doc = minimal()
        doc["entities"].append({"id": "E-X", "type": "data_exchange", "name": "Feed"})
        self.assertTrue(em.schema_errors(doc))

    def test_master_record_only_on_a_data_store(self):
        doc = minimal()
        doc["entities"][0]["master_record"] = True
        self.assertTrue(em.schema_errors(doc))


class Rules(unittest.TestCase):
    def test_no_evidence_must_be_assumed_with_a_question(self):
        doc = minimal()
        r = doc["relationships"][0]
        r.update(basis="documented", confidence="attested", evidence=[])
        self.assertTrue(any("no evidence" in e for e in errors(doc)))
        r.update(confidence="assumed", question="Q-ONE")
        doc["open_questions"] = [{"id": "Q-ONE", "about": ["R-APP-DB"], "question": "Which fields?",
                                  "owner": "Team", "asked": "2026-10-01"}]
        self.assertEqual(errors(doc), [])

    def test_dangling_ids(self):
        doc = minimal()
        doc["relationships"][0]["to"] = "E-NOPE"
        self.assertTrue(any("not an entity" in e for e in errors(doc)))

    def test_duplicate_ids(self):
        doc = minimal()
        doc["entities"].append(copy.deepcopy(doc["entities"][0]))
        self.assertTrue(any("more than once" in e for e in errors(doc)))

    def test_dates_after_as_of(self):
        doc = minimal()
        doc["relationships"][0]["observed"] = "2026-11-01"
        self.assertTrue(any("after the map's as_of" in e for e in errors(doc)))

    def test_planned_basis_and_status_agree(self):
        doc = minimal()
        doc["relationships"][0].update(status="planned", target_date="2027-01-01")
        self.assertTrue(any("planned link is both" in e for e in errors(doc)))

    def test_only_documents_and_findings_govern(self):
        doc = minimal()
        doc["relationships"][0]["kind"] = "governs"
        self.assertTrue(any("governs" in e for e in errors(doc)))

    def test_stale_and_never_observed_are_warnings(self):
        doc = minimal()
        doc["relationships"][0]["observed"] = "2026-01-01"
        errs, warns = em.check(doc)
        self.assertEqual(errs, [])
        self.assertTrue(any("last observed" in w for w in warns))

    def test_as_of_moves_staleness_and_terms(self):
        doc = minimal()
        doc["entities"][2]["term_ends"] = "2027-02-01"
        self.assertEqual(em.check(doc)[1], [])
        warns = em.check(doc, today=dt.date(2027, 1, 15))[1]
        self.assertTrue(any("renewal due" in w for w in warns))
        self.assertTrue(any("last observed" in w for w in warns))

    def test_example_maps_ignore_today(self):
        doc = minimal()
        doc["map"]["example"] = True
        self.assertEqual(em.check(doc, today=dt.date(2030, 1, 1))[1], [])

    def test_assumed_link_with_open_question_is_not_also_never_observed(self):
        doc = minimal()
        doc["relationships"][0].update(basis="documented", confidence="assumed", evidence=[], question="Q-ONE")
        del doc["relationships"][0]["observed"]
        doc["open_questions"] = [{"id": "Q-ONE", "about": ["R-APP-DB"], "question": "Which fields?",
                                  "owner": "Team", "asked": "2026-10-01"}]
        self.assertEqual(em.check(doc), ([], []))


class Summary(unittest.TestCase):
    def test_ranks_master_records_by_incoming(self):
        doc = minimal()
        doc["entities"].append({"id": "E-DB2", "type": "data_store", "name": "Other", "master_record": True})
        doc["entities"].append({"id": "E-APP2", "type": "application", "name": "App 2"})
        for i, src in enumerate(("E-APP", "E-APP2")):
            doc["relationships"].append({**copy.deepcopy(doc["relationships"][0]), "id": f"R-X-{i}", "from": src, "to": "E-DB2"})
        text = em.summary(doc, "t.yml")
        self.assertLess(text.index("| 1 | Other | 2 |"), text.index("| 2 | Master | 1 |"))

    def test_deterministic(self):
        doc = em.load(SAMPLE)
        self.assertEqual(em.summary(doc, SAMPLE.name), em.summary(copy.deepcopy(doc), SAMPLE.name))


if __name__ == "__main__":
    unittest.main()
