# GPO Modernization — Parse and Crosswalk

Method for analyzing Group Policy before translation or retirement.

## Purpose

Before any GPO setting is translated to Intune or Conditional Access, it must be inventoried, classified, and crosswalked. This document describes the parse and crosswalk steps that prevent literal copying of obsolete or high-risk settings.

## Steps

1. **Parse** — Extract every setting from every linked GPO. Record GPO name, link path, setting path, and current value.
2. **Classify** — Tag each setting as required, obsolete, high-risk, or redundant.
3. **Crosswalk** — Map required settings to the closest Intune, Endpoint Security, or Conditional Access equivalent. Note where no equivalent exists.
4. **Decide** — For each setting, record the disposition: translate, retire, or retain with exception.
5. **Sequence** — Order the work so that high-risk and high-dependency settings are addressed before broad rollout.

## Classification guidance

| Tag | Meaning | Typical action |
|-----|---------|----------------|
| Required | Still needed in the target model | Translate to modern control |
| Obsolete | No longer relevant | Retire |
| High-risk | Weakens security or creates operational hazard | Retire or replace with stronger control |
| Redundant | Duplicated by another control | Retire |

## Output

A decision record per GPO and per setting that feeds the GPO Sunset Program and the Conditional Access Policy Library.

---

*Cleaned extraction for project use.*
