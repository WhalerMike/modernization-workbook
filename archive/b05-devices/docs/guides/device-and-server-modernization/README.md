# Device and Server Modernization

**Endpoint and server modernization on a hybrid Active Directory → cloud identity estate — runnable manually or under governed change control**

This guide modernizes a hybrid Active Directory estate onto device management (workstations) and hybrid management (servers), and closes out the identity work that rides alongside it — NTLM elimination, service principal name hygiene, SQL Server hardening, and a Conditional Access baseline.

It is runnable two ways from the same technical steps:

- a **manual path** — you preview each change and own the decision under local change control; and
- a **governed path** — every change is bound to organizational attributes, an actuation rung, and a recorded approval.

If you build the manual path now and want governance later, you do not redo the work.

## The pages

| Page | What it covers |
|------|----------------|
| [Manual path](manual-path.md) | The end-to-end technical runbook with no governance control plane — hybrid management onboarding, device-management enrollment, NTLM/service principal name/SQL hardening, Conditional Access, monitoring, and rollback. Each operator owns the decision. |
| Governed path | The same end state, bound to attribute-driven scoping, an actuation ladder, the drift-detection loop, and evidence. |
| Retrofit path | For estates already built the manual way: how to layer attribute-driven governance on top without re-doing the device-management and hybrid-management work. |

## How the two paths relate

The manual path and the governed path produce the **same configuration** on the platform surface. The governed path adds the binding from organizational intent to technical change: who owns it, what authorizes it, and how drift is caught.

## Terminology

In this guide, the **control plane** is an active reconciliation layer that governs provider data planes. It holds desired state, observes actual state, classifies drift, and reconciles toward intent; it is not an inline runtime component and does not replace the providers. **Organizational attributes** are the coded values carried by every governed object so its state is addressable in the same terms across every plane.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
