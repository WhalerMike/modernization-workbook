---
title: "Training"
subtitle: "Learning paths: modules to work through in order, and the vendors' own training mapped to the workbook's roles"
description: "The Federal Modernization Workbook's training: the Microsoft Automation learning path in three modules, and external learning paths from product vendors."
doc-type: section-landing
fmw-eyebrow: "Training"
listing:
  - id: training-microsoft
    contents:
      - "ms-automation-*.md"
    type: table
    fields: [title, research-status, last-reviewed, description]
    field-display-names: &names
      research-status: "Status"
      last-reviewed: "Reviewed"
    sort: "title asc"
    sort-ui: false
    filter-ui: false
  - id: training-external
    contents:
      - "*.md"
      - "!index.md"
      - "!ms-automation-*.md"
    type: table
    fields: [title, research-status, last-reviewed, description]
    field-display-names: *names
    sort: "title asc"
    sort-ui: false
    filter-ui: false
---

# Training {.unnumbered}

Training pages teach a skill step by step, in the order you should learn it. They work like a [Microsoft Learn learning path](https://learn.microsoft.com/training/): a short series of modules, each building on the one before.

Each page keeps its status label (draft or in review) until it is reviewed and proved. See [Status labels](../about/sources-and-verification.md#status-labels) for what each label means.

## Microsoft Automation learning path

Work through the three modules in order. Module 1 sets up what the other two use.

1. [Module 1: Graph and Azure Foundations](ms-automation-foundations.md): the clouds and endpoints, signing in from scripts, permissions, paging and throttling.
2. [Module 2: Microsoft Entra ID through Microsoft Graph](ms-automation-entra.md): reading and evidencing users, groups, Conditional Access and roles.
3. [Module 3: Intune through Microsoft Graph](ms-automation-intune.md): reading and evidencing devices, compliance and configuration.

::: {#training-microsoft}
:::

## External learning paths

Vendors' own training, organized by role and linked to the books that use it.

::: {#training-external}
:::
