---
title: "GPO Modernization — Parse, Crosswalk, the organizational-attribute model Join"
subtitle: "Canonical Spec · FMP_014"
date: 2026-06-21
---

::: {.callout-note}
## Canonical the Federal Modernization Program Specification

**FMP_014** — status: **Draft** — version: **1.0**

This page renders the canonical FMP_014 source verbatim. The
authoritative source is at
Its decision record is the program decision;
its doctrinal home is Gap #3 of FMP_009 §3.3. Per
the program decision, this canonical
page is generated as an `include`-style wrapper.
:::

![FMP_014 GPO modernization pipeline — three stages: a navy Stage 1 Parse (offline, FMP-owned, Build) emitting the GPO-IR; an ice Stage 2 Consume (Microsoft Group Policy Analytics over Graph beta, live tenant) emitting the Crosswalk Result; and a teal-bordered Stage 3 Join (pure over the IR + the organizational-attribute model, Differentiate) emitting the cohort-bound, topologically sequenced, drift-classified Migration Plan.](../images/canonical/FMP-FIG-015-fmp014-gpo-modernization-pipeline.png){#fig-fmp014-pipeline fig-alt="Three-stage GPO modernization pipeline. On-disk GPO artifacts (GPO backup XML, registry.pol, SYSVOL scope) feed a navy Stage 1 Parse box (BUILD) emitting GPO-IR; a Microsoft Group Policy Analytics box on Graph beta feeds an ice Stage 2 Consume box (CONSUME) emitting the Crosswalk Result; both converge into a teal-bordered Stage 3 Join box (DIFFERENTIATE) emitting the Migration Plan — cohort-bound, topologically sequenced, drift-classified. A footnote notes unsupported settings route to the residual-GPO backlog and a half-migrated GPO surfaces as a DRIFT finding." width="100%"}

