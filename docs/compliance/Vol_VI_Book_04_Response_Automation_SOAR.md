---
title: "Vol VI Book 04 — Federal Compliance — Response Automation: The SOAR Playbook Library"
subtitle: "Automated containment and enrichment playbooks that convert a detection into a bounded response"
author: "Federal Cloud Services"
date: "2026-07-09T15:13:00-04:00"
format:
  html: {css: lz-style.css, number-sections: true, toc: true, toc-depth: 3, toc-title: "Contents"}
  docx: {reference-doc: assets/reference-mslearn.docx, toc: true, toc-depth: 3, number-sections: true, fig-width: 6.5}
fig-align: center
out-width: "100%"
execute: {echo: false}

aliases:
  - /customer-documents/federal-aan-series/Vol_VI_Book_04_FedAAN_Response_Automation_SOAR.html

---

:::: {.content-hidden unless-profile="ssa"}
::: {.fouo-banner}
INTERNAL — NOT FOR PUBLIC DISTRIBUTION
:::
::::

::: {.aan-warning}
## Draft Proposal — Subject to Review
Developed by the **CSI Team (Cloud Services Infrastructure)**; not yet reviewed or approved by the {{< meta agency.short >}} CIO Office, OIS, or leadership. **Date Code:** 2026-07-09 15:13 ET
:::

::: {.aan-important}
**Series Context** — Volume VI Book 04. The response half of the detection engine: the playbooks that Book VI-03's rules trigger. It approximates, in-boundary and at minutes, the *containment speed* of Continuous Access Evaluation (CAE) revocation, and it covers the services and clients that CAE does not reach.
:::

# What This Document Addresses

Detection without response only shortens the investigation, not the exposure. The Volume III SIEM/XDR architecture ends at the alert; this book carries the automation that acts on it. CAE revokes access in near real time for supported applications, with up to 15 minutes of event propagation, and the design enables it. These playbooks trigger it rather than replace it, and they cover the services and clients CAE does not reach. They are honest that containment lands at minutes, because a playbook triggered by a scheduled analytic cannot beat the analytic's cadence.

The design rule for every playbook here is **confidence-gated action**: high-confidence detections auto-contain; medium-confidence detections enrich and ticket for a human; nothing low-confidence auto-acts. Auto-containment on a noisy rule is its own denial-of-service.

# The Response Ladder

| Confidence | Action | Human in loop? | Substitutes for or complements |
|---|---|---|---|
| High (e.g. rule 04 session-anomaly with corroboration) | Revoke sessions, confirm-compromised, force re-auth | No — auto | Triggers CAE revocation; covers services and clients CAE does not reach (minutes) |
| Medium | Enrich (identity/device/IP context), open ticket, raise risk | Yes | Vendor auto-remediation |
| Standing control | Conditional Access session controls (for example sign-in frequency) | n/a — config | Standing exposure ceiling |

# Deployable Artifacts

| Playbook | Trigger (Book VI-03) | Action | Substitutes for or complements |
|---|---|---|---|
| `revoke-session` | Token-theft / session-anomaly (rule 04) | Graph `revokeSignInSessions` + confirm-compromised | Triggers CAE revocation; covers services and clients CAE does not reach (minutes) |
| `disable-principal` | High-confidence account compromise | Disable account, block sign-in | Automated account containment |
| Conditional Access session controls (config) | Standing control | Session controls from the Conditional Access policy library ([Book 4, Chapter 07](../books/b04-access/07-the-conditional-access-policy-library.md)) | Standing exposure ceiling |
| `enrich-and-ticket` | Medium-confidence detections | Enrich with identity/device context, open ticket (human-in-loop) | Vendor auto-remediation |

## Illustrative playbook — session revocation on a high-confidence session anomaly

The `revoke-session` playbook is the containment path for Book VI-03 rule 04. It runs entirely in-boundary against the management plane; the containment action is a Graph call, and the whole run is itself logged as an incident action into the evidence contract.

```jsonc
// Logic App / Automation runbook (deployed example) — pseudocode of the revoke-session flow
{
  "trigger": "Sentinel incident: rule 'token-theft-session-anomaly'",
  "steps": [
    { "guard": "incident.severity == 'High' && entities.Account != null" },        // confidence gate
    { "graph": "POST /users/{account}/revokeSignInSessions" },                      // AC-12 containment
    { "graph": "PATCH /identityProtection/riskyUsers/confirmCompromised",
      "body": { "userIds": ["{account}"] } },                                       // raise risk state
    { "ticket": "create IR record, link Sentinel incident, attach entity context" },// IR-4 record
    { "evidence": "emit response-action to the evidence contract (Book 12 Chapter 02)" }     // CA-7 evidence
  ],
  "notes": "Containment latency = detection cadence plus revocation propagation (minutes); CAE is near real time with up to 15 minutes of propagation, not sub-second. TUNE the confidence gate."
}
```

Conditional Access session controls are not a playbook but a standing configuration: they bound the maximum exposure window so that even a *missed* detection cannot leave a stolen token valid indefinitely. The 60 to 90 minute access-token lifetime is the platform default rather than a setting this program adds, and CAE-aware sessions can receive tokens that live up to 28 hours because they can be revoked, so the program does not treat a short token clock as the limit. The standing controls are the Conditional Access policies in [Book 4, Chapter 07](../books/b04-access/07-the-conditional-access-policy-library.md). They are the exposure ceiling under which the playbooks operate.

# Deployment

1. Deploy playbooks through the change-controlled pipeline ([Book 15, Chapter 02](../books/b15-day2-operations/02-day-two-is-where-compliance-lives.md#the-deploy-model), The deploy model); grant the automation identity only the Graph scopes each action needs (least privilege — the revocation identity should not also be able to create accounts).
2. Wire each Book VI-03 rule to its playbook via the SIEM automation rules; start every auto-containment playbook in **alert-only** mode and promote to auto-action only after the triggering rule's false-positive rate is measured (Vol III Book 06).
3. Set the standing exposure control through the Conditional Access session controls in the policy library ([Book 4, Chapter 07](../books/b04-access/07-the-conditional-access-policy-library.md)).

# Closure Necessity

::: {.aan-tip}
## Closure Necessity — a detection with no response is exposure, not control
IR-4 requires incident *handling*, not just detection. These playbooks are what convert a Book VI-03 firing into a bounded containment action and a documented incident record — the artifact an assessor asks for. Without them, the detection layer shortens time-to-know but not time-to-contain, and the token-theft window stays open for the full token lifetime.
:::

# Controls Operationalized

| Control | Title | How this book deploys it |
|---|---|---|
| IR-4/6 | Incident Handling / Reporting | Automated containment + enriched incident records |
| AC-12 | Session Termination | Session revocation + Conditional Access session controls |
| AC-2(13) | Disable Accounts (high-risk) | `disable-principal` on high-confidence compromise |

# Honest Limits

- Containment is **minutes** — bounded by the detection cadence plus revocation propagation; CAE itself is near real time with up to 15 minutes of propagation, not sub-second, and clients and resources that are not CAE-aware keep an access token until it expires. Conditional Access session controls are the standing ceiling that makes that latency tolerable.
- Auto-containment amplifies a noisy rule into an availability incident; the confidence gate and the alert-only ramp (Vol III Book 06) are mandatory, not optional.
- The playbooks act only on the agency's own tenant; a compromised identity federated elsewhere is outside their reach.

# Cross-References

- **Book VI-03** — the detections these playbooks respond to.
- [Book 4, Chapter 07](../books/b04-access/07-the-conditional-access-policy-library.md) — the standing control (Conditional Access session controls).
- **Volume III — SIEM/XDR** — the incident-workflow architecture.
- [Book 12, Chapter 02](../books/b12-security-operations/02-the-evidence-contract.md) — response actions emit to the evidence contract.
- **Vol III Book 06** — false-positive measurement that gates auto-action.

# Provenance

Draft. Containment latency is honestly minutes. The playbook pseudocode is an illustrative flow to adapt, not a deployable runbook. Products are deployed examples of the SOAR-containment mechanism, which is portable across automation engines.
