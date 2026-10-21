# Zero Trust Assessment

Dimensions and evidence sources for assessing Zero Trust maturity.

## Purpose

Provide a structured view of Zero Trust posture across identity, device, network, application, and data. The assessment is evidence-based: each dimension is scored from observable signals rather than self-attestation alone.

## Dimensions

| Dimension | Primary evidence sources |
|-----------|--------------------------|
| Identity | MFA coverage, Conditional Access hit rates, privileged access reviews, stale accounts |
| Device | Intune enrollment rate, compliance policy results, unmanaged device access attempts |
| Network | Named location accuracy, split-tunnel or private access adoption, DNS resolution consistency |
| Application | Application registration hygiene, Conditional Access coverage per app, legacy auth blocks |
| Data | Sensitivity labeling adoption, access reviews, external sharing controls |

## Assessment method

1. Collect signals from directory, endpoint, network, and application telemetry.
2. Map each signal to a dimension and a maturity level.
3. Identify gaps where evidence is missing or contradictory.
4. Prioritize remediation by residual risk and dependency.
5. Re-assess on a defined cadence.

## Output

A dashboard or report that shows current maturity per dimension, evidence gaps, and recommended next actions. The value is in the evidence trail, not the score alone.

---

*Cleaned extraction for project use.*
