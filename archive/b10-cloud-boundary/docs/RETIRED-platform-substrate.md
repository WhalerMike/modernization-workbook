# Retired: the platform substrate pages (November 26, 2026)

These pages were imported early as `docs/substrate/` and `docs/operational-guides/platform-substrate/`. The site never published them (they were outside `_quarto.yml`'s render list, so their URLs answered 404), and no published page linked to them. They were retired when the platform host's implementation guide landed, on the workbook owner's decision: "retire docs/substrate/ and docs/operational-guides/platform-substrate/ once the guide lands (redirect or record, don't leave dangling links)". They had no published URLs to redirect, so this file is the record. The pages are kept unchanged below it, in the same folder layout, so their links to each other still work.

Read them as history, not guidance. They describe the host enrolling in Intune and carry an "Intune Integration CLI" part; Intune doesn't support Windows Server, so the host is managed through Azure Arc and machine configuration instead ([Book 10, Appendix B, C.2](../../../docs/books/b10-cloud-boundary/appendix-b-platform-host-interfaces.md)).

| Retired page | Where its subject lives now |
|---|---|
| `operational-guides/platform-substrate/index.md` | The [Platform Host topic](../../../docs/topics/platform-host.md) and [The Platform Host: An Implementation Guide](../../../docs/books/guides/platform-host-implementation.md) |
| `substrate/index.md`, `substrate/core-architecture/index.md`, `substrate/execution-patterns/index.md`, `substrate/platform-tooling/index.md` | Landing pages only; nothing to carry |
| `substrate/core-architecture/active-passive-replication.md` | WD-178 in the [decision register](../../../docs/about/decision-register.md#wd-178) and the guide's hot standby section |
| `substrate/core-architecture/disaster-recovery.md` | WD-178 and the guide's backup and cold restore step |
| `substrate/execution-patterns/cli-operations-guide.md` | The guide's steps, and Book 10, Appendix B, family E (local management) |
| `substrate/execution-patterns/operations-runbook.md` | The guide's steps and its interface check; day-two cadence in [Book 15, Chapter 12](../../../docs/books/b15-day2-operations/12-the-day-two-runbook.md) |
| `substrate/platform-tooling/azure-arc-policy-library.md` | [Book 05, Chapter 09](../../../docs/books/b05-devices/09-servers-under-azure-arc.md) and the guide's M-007 step |
| `substrate/platform-tooling/invoke-ad-survey.md` | [Book 02, Chapter 08](../../../docs/books/b02-identity/08-assessing-the-forest.md) and its [forest assessment module](../../../docs/books/b02-identity/appendix-b-forest-assessment-module.md) |
| `substrate/platform-tooling/invoke-gpo-migration-triage.md`, `invoke-gpo-obsolete-audit.md` | [Book 05, Chapter 07](../../../docs/books/b05-devices/07-the-gpo-sunset-program.md), which restates the triage as a design |
