# Federal Compliance Series - Moderate — Volume VI: Implementation

**Volume purpose — the deployable-artifact layer**

## Draft posture

This document is a draft proposal. It has not been reviewed or approved by the agency CIO Office, the Office of Information Security, or organizational leadership.

## Volume purpose

Volumes I–IV establish the architecture as what must be true and why. Volume V addresses training and certification. Volume VI is the deployable counterpart: the infrastructure-as-code, detection rules, response playbooks, configuration baselines, and evidence wiring that actually stand the architecture up. Where an architecture book says a control is closed by a mechanism, the corresponding Volume VI book carries the artifact that deploys that mechanism.

## The deploy model

Three principles govern every artifact:

1. **Everything as code, applied through a pipeline.** No artifact is a click-path. Landing zones, policy, detection rules, and playbooks are declarative and applied through a change-controlled pipeline, so that the deployed state is reproducible, reviewable, and diffable against its intended state.
2. **In-boundary by construction.** Every artifact that processes identity-attributed or behavioral telemetry runs inside the agency’s own authorized boundary. The moment an artifact ships that telemetry to an out-of-scope service for convenience, it recreates the very flow the boundary forbids.
3. **Evidence-emitting by default.** An artifact that deploys a control but produces no machine-readable evidence of doing so has done half the job. Each artifact emits to the series evidence contract so that the continuous-monitoring pipeline can bind it to the control it closes.

## Books in this volume

| Book | Deployable artifacts | Implements |
|------|----------------------|------------|
| Book 00 | Deploy model, in-boundary principle, evidence emission | All volumes |
| Book 01 | Landing zone and network as code | Volume I |
| Book 02 | Identity and access as code | Volume I identity, Volume III privileged access |
| Book 03 | Detection engineering | Volume III SIEM/XDR |
| Book 04 | Response automation | Volume III SIEM/XDR |
| Book 05 | Data protection deployment | Volume III data protection |
| Book 06 | Configuration baselines and hardening | Volume III posture and patch |
| Book 07 | Evidence and continuous-monitoring pipeline | Volume III evidence fabric, Volume IV |
| Book 08 | Validation and test harnesses | All |

## Closure necessity

Volume VI does not claim to close controls the architecture volumes already claim. Its necessity is of a different kind: a control-closure claim that is not deployed as code, and does not emit evidence, is not assessable. The architecture volumes prove the mechanism is sufficient; this volume is what makes the closure demonstrable.

## What this volume is and is not

It is the agency-side build layer — the code and evidence that turn the architecture into an operating, assessable posture. It is not a claim that any single product is the only way to deploy the architecture: every artifact names a deployed example and preserves the substitution path, because the mechanism is the invariant. It is not a replacement for the operate-and-tune discipline: deployed detections rot, baselines drift, and sources silently stop emitting.

## Where evidence lands

The binding of this volume’s closures and evidence to a governance substrate is optional and separable. The volume stands complete at FedRAMP Moderate with no substrate engagement at all. Adopting a substrate adds machine-checked scoring and drift-gating on top of what is already closed, and can be adopted later — or never — without rework.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
