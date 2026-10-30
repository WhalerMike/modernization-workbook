<!-- generated from sample-portfolio.yml by scripts/check_evidence_maps.py; do not hand-edit -->

# Sample benefits portfolio — evidence map summary

Map `FMP-EM-SAMPLE`, as of 2026-10-30. 12 entities, 13 relationships (12 current), 1 open question(s).

## Master records, ranked by what depends on them

Incoming current reads, writes, feeds and calls. Outside exchanges are counted separately because the agency can't change them alone.

| Rank | Master record | Incoming | From outside exchanges | Assumed | Governed by |
|---:|---|---:|---:|---:|---|
| 1 | Person master record | 6 | 2 | 1 | System of records notice for the person master record |
| 2 | Payments ledger | 1 | 0 | 0 | — |

## Dependency inputs per system

The inputs Chapter 02's dependency score is computed from. The confidence is the weakest among the system's current links.

| System | Type | Depends on | Depended on by | Outside exchanges involved | Assumed share | Weakest confidence |
|---|---|---:|---:|---:|---:|---|
| Case management system | application | 2 | 0 | 0 | 0% | measured |
| Nightly status reconciliation | process | 2 | 0 | 0 | 0% | measured |
| Public self-service portal | application | 1 | 0 | 0 | 0% | attested |
| Monthly eligibility feed to state partners | data exchange | 1 | 0 | 0 | 0% | attested |
| Identity verification service for a partner agency | data exchange | 1 | 0 | 0 | 100% | assumed |

## Outside exchanges and agreement terms

| Entity | Partner | Term ends | Days left at as_of |
|---|---|---|---:|
| Identity verification service for a partner agency | A federal partner agency | 2027-01-31 | 93 (renewal due) |
| Computer matching agreement with state partners | — | 2027-06-30 | 243 |
| Monthly eligibility feed to state partners | State benefit agencies | 2027-06-30 | 243 |

## Open questions

| Question | About | Owner | Asked | Answered |
|---|---|---|---|---|
| Which person master fields does the partner verification service read, and is the status code among them? | R-VERIFY-READS-PERSON; Identity verification service for a partner agency | Interface agreements team | 2026-10-14 | open |
