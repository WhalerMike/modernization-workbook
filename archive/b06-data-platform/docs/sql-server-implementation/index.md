---
title: "SQL Server Identity Transformation — Implementation Companion"
subtitle: "The executable counterpart to the narrative series: runbooks, audits and validation for each step"
---

The Implementation Companion turns the [SQL Server Identity Transformation narrative](../case-studies/sql-server-narrative/README.md) into runbooks. The narrative explains why each step happens and in what order; each book here covers how to carry it out, what the tooling produces, and how to check the result. Read [Book 01](Book_01.md) first: it sets out the prerequisites, the evidence model and the run order the other books assume.

| Book | Title | Narrative counterpart |
|------|-------|-----------------------|
| [01](Book_01.md) | Prerequisites and using this companion | Book 01 |
| [02](Book_02.md) | Estate discovery and the consolidation gate | Book 02 |
| [03](Book_03.md) | The authentication audit | Book 03 |
| [04](Book_04.md) | Arc deployment and the instance identity (managed identity on SQL Server 2025; app registration plus certificate on 2022) | Book 04 |
| [05](Book_05.md) | Login migration and parallel-run validation | Book 05 |
| [06](Book_06.md) | NTLM detection and remediation | Book 06 |
| [07](Book_07.md) | Groups, administrative units and the Conditional Access perimeter | Book 07 |
| [08](Book_08.md) | The application chain and connection-string migration | Book 08 |
| [09](Book_09.md) | Continuous monitoring and the closure record | Book 09 |
| [10](Book_10.md) | Certificate discovery for SQL Server's ADCS dependencies | Book 10 |

The narrative's epilogue, Book 11 (the platform question), is a decision framework rather than a procedure, so it has no implementation book.
