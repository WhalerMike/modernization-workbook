---
title: "GPO Modernization — Parse, Crosswalk, the organizational-attribute model Join"
subtitle: "Canonical Spec · the modernization program_014"
date: 2026-06-21
---

::: {.callout-note}
## Canonical the modernization program Specification

**the modernization program_014** — status: **Draft** — version: **1.0**

This page renders the canonical the modernization program_014 source verbatim. The
authoritative source is at
[`src/uiao/canon/the modernization program_014_GPO_Modernization_Parse_Crosswalk_the organizational-attribute model_Join_v1.0.md`](../../src/uiao/canon/the modernization program_014_GPO_Modernization_Parse_Crosswalk_the organizational-attribute model_Join_v1.0.md).
Its decision record is [the program decision](../adr/adr-122-gpo-modernization-parse-crosswalk-orgpath.qmd);
its doctrinal home is Gap #3 of the modernization program_009 §3.3. Per
[the program decision](../adr/adr-072-canon-publication-policy.qmd), this canonical
page is generated as an `include`-style wrapper.
:::

![the modernization program_014 GPO modernization pipeline — three stages: a navy Stage 1 Parse (offline, the modernization program-owned, Build) emitting the GPO-IR; an ice Stage 2 Consume (Microsoft Group Policy Analytics over Graph beta, live tenant) emitting the Crosswalk Result; and a teal-bordered Stage 3 Join (pure over the IR + the organizational-attribute model, Differentiate) emitting the cohort-bound, topologically sequenced, drift-classified Migration Plan.](../images/canonical/the modernization program-FIG-015-uiao014-gpo-modernization-pipeline.png){#fig-uiao014-pipeline fig-alt="Three-stage GPO modernization pipeline. On-disk GPO artifacts (GPO backup XML, registry.pol, SYSVOL scope) feed a navy Stage 1 Parse box (BUILD) emitting GPO-IR; a Microsoft Group Policy Analytics box on Graph beta feeds an ice Stage 2 Consume box (CONSUME) emitting the Crosswalk Result; both converge into a teal-bordered Stage 3 Join box (DIFFERENTIATE) emitting the Migration Plan — cohort-bound, topologically sequenced, drift-classified. A footnote notes unsupported settings route to the residual-GPO backlog and a half-migrated GPO surfaces as a DRIFT finding." width="100%"}

{{< include ../../src/uiao/canon/the modernization program_014_GPO_Modernization_Parse_Crosswalk_the organizational-attribute model_Join_v1.0.md >}}
