# Ticket-to-Machine, Not Ticket-to-Human

**Why changing state isn’t compliance evidence**

## Problem, solution, ask

**Problem.** Native cloud and virtualization tools genuinely remediate; none can answer the four questions an assessor asks about a finding — who owns it, by when, under whose approval, with what evidence. Configuration Settings (CM-6) is not tool-attestable on any platform surveyed. And raising a ticket does not fix that if a human still logs into the console because the ticket told them to.

**Solution.** A coordination layer in front of the native tools, where the ticket authorizes a machine to execute under a service identity and the human’s role stops at approval. Where no machine actuator exists yet, the closure is a declared exception through a recorded privileged session, not a silent one.

**Ask.** Confirm, row by row, whether the coordination-layer contract entitles the integrations each platform needs. Where it does not, license the integration or book a declared exception with a named compensating control. Never route the gap through a human at the console.

## The question, precisely

“Does the native cloud portal already do this?” is really three separate questions:

1. Can the native tool detect drift and change state? Yes.
2. Can the native tool’s own dashboard show current compliance posture? Yes, for its own boundary.
3. Can the native tool’s dashboard, by itself, serve as the evidence artifact an assessor relies on for an authorization decision? No.

A console shows current state. An evidence record has to show who owns the finding, the clock they are working against, the approval trail for any exception, and a re-test that proves closure. None of the native consoles are built to be a system of record for ownership and approval across an organization’s workflow.

## One coordination pattern

Test → Detect drift → Raise a typed task against the reconciled configuration item → Actuate on the native surface → Close with evidence.

Actuation always stays platform-native. The coordination layer’s role is never to write the configuration, apply the patch, or fix the firewall rule — it is to make sure every drift becomes an owned, clocked, approved, evidenced piece of work.

## Ticket-to-machine, not ticket-to-human

The default shape of change management is ticket → a human opens the console (or runs a script) because the ticket told them to → replies “done.” Adding a ticket in front of that does not change who is at the keyboard.

The ticket should authorize a machine, not a person, wherever a machine can reach the surface. A human approves the change; the platform executes it under a service identity. The human’s role stops at approval.

Running a change through an orchestrator produces, automatically, everything an assessor checks for: the change traces to a prior approval, the artifact that ran is version-controlled and access-restricted, the execution is logged and attributable to the task rather than to a person’s memory, and the result is a re-testable, reproducible record.

Where no machine actuator exists yet, the fallback is a declared exception, not a silent one. The compensating control is a time-boxed, proxied, recorded privileged session — approved first, then executed, with the recording itself as the evidence artifact.

## Leadership takeaway

Native tools change state. They do not produce the ownership, clock, approval, and evidence record that authorization requires. The coordination layer supplies that record. The ticket must authorize a machine, not a person, wherever a machine can reach the surface.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
