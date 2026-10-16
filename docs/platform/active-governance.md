# Active Governance

**The control plane that governs providers without replacing them**

When Active Directory is retired, what is lost is not a directory — it is the closed loop. Active Directory governed because it sat in the path: it authenticated the logon, evaluated the group, pushed the policy, and truth and enforcement were the same act. The cloud era deliberately tore that apart. Identity lives in one provider, devices in another, network admission in a third, privileged access in a fourth, and each keeps its own copy of the truth. A registry that merely records intended state and reports divergence can see the gap; it cannot close it. Governance without a closed loop is a spreadsheet that judges you.

Active Governance closes the loop — but it does so as a **control plane**, never by climbing back into the runtime path the way Active Directory did.

## Control plane versus data plane

The line that makes this safe is the boundary between governing and executing. The governance layer holds desired state, observes actual state, classifies divergence, and reconciles toward intent. The provider authenticates, authorizes, routes, resolves, or stores at runtime. The governance layer may call a provider’s management API to correct drift, but it never becomes the runtime component: it does not sit inline in the authentication path, terminate a session or tunnel, route a packet, or issue the production credential.

This is the same separation of concerns that lets a Kubernetes control plane govern a cluster without standing in the data path of a single packet.

## Incorporate, do not compete

A provider is brought under governance as an adapter bound to one control-plane slot. The governance layer does not reimplement what the provider does; it reconciles the provider’s state against the authoritative source and emits evidence. To be incorporated, an adapter must:

- Bind to one control-plane slot — identity, addressing, network, telemetry, endpoint, or security.
- Expose plan / apply / reconcile — compute the change-set with no writes, execute it (dry-run by default), or both.
- Carry organizational position so the provider’s state is addressable in the same terms as every other plane.
- Advertise governance metadata — controls supported, side effects, blast radius, rollback capability.
- Declare a governance mode on the maturity ladder below.

> The provider keeps its job. The governance layer gives that job a single organizational truth to answer to, a continuous check that it still matches, and an audit trail proving it.

## The six control-plane slots

| Slot | What it governs | Example providers |
|------|-----------------|-------------------|
| **Identity** | Identity provider, joiner/mover/leaver, privileged identity | Cloud identity platform; non-employee identity governance |
| **Addressing** | IPAM, DNS, DHCP authority | DNS/DHCP/IPAM platform |
| **Network** | Admission, SD-WAN segmentation | Network access control; SD-WAN fabric |
| **Telemetry** | SIEM, monitoring, evidence correlation | SIEM; cloud monitoring |
| **Endpoint** | Device compliance, configuration, endpoint detection | Device management; endpoint protection |
| **Security** | Zero-Trust enforcement, privileged access | Privileged access management |

## The actuation maturity ladder

| Rung | Name | Behavior |
|------|------|----------|
| **L0** | Record | Desired state recorded only. |
| **L1** | Observe | Actual state collected; drift detected. Read-only. |
| **L2** | Advise | The specific corrective change-set is generated and shown; no writes. |
| **L3** | Gated actuation | A human approves; the governance layer then executes the change through the provider API. |
| **L4** | Autonomous reconciliation | The loop closes without a human in each cycle, within declared guardrails. |

The default production ceiling is L3 — human-approved actuation. Autonomous (L4) reconciliation is permitted only for an explicitly enumerated, low-blast-radius, rollback-capable operation class with a clean advisory record. High-blast-radius operations are capped at L3 permanently and always route to human review.

When reality and the authoritative source disagree, reconciliation is not always “force the authoritative source onto reality.” Sometimes a legitimate change happened and the authoritative source is stale. Every finding can be promoted (update the authoritative source to match reality), forced (correct the drift), or quarantined (held for review) — and only the force path is ever allowed to run autonomously.

## Leadership takeaway

Governance without a closed loop is a spreadsheet that judges you. Active Governance closes the loop as a control plane that incorporates providers rather than competing with them. The provider keeps its runtime job. The governance layer supplies the single organizational truth, the continuous check, and the audit trail.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
