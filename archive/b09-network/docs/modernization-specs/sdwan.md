# Software-Defined WAN Modernization Specification

**Cross-adapter contract for Software-Defined WAN governance**

Software-Defined WAN replaces static multiprotocol label switching wide-area networks with policy-driven, telemetry-informed routing across diverse transports. This specification defines the substrate contract for adapters: identity-aware routing, telemetry-as-control, and canonical claim emission for path and policy decisions.

## Substrate contract

Software-Defined WAN adapters span the Network, Addressing, and Telemetry planes. They inherit:
- Identity-aware policy — routing policy consumes identity context where applicable; the controller does not maintain parallel identity authority.
- Telemetry as control — path quality, service-level agreement telemetry, and policy decisions emit as canonical claims; the substrate consumes them as control input, not as after-the-fact reports.
- Canonical decision records — every policy decision (path selection, transport failover, application steering) is a claim with the full provenance envelope.

## Adapter shape

Adapters declare:
- Mission-class: enforcement (path-level enforcement), telemetry (path-quality observer), or integration (controller integration).
- Class: modernization (replacing legacy wide-area network) or conformance (observing policy/state).
- Boundary disposition per adapter. Most controllers operate outside government-cloud boundaries unless explicitly certified.

## Integration shape

```
provenance:
  ...
sdwan_decision:
  controller_id: "{controller}"
  decision_kind: "path-selection | failover | application-steering | qos"
  source_site: "{site_id}"
  destination: "{site_id | application_id}"
  selected_path: "{transport_id}"
  identity_context: "{issuer_identity | n/a}"
  sla_state: "{sla_class}"
  policy_refs:
    - "{authoritative_policy_id}"
  evaluation_timestamp: ISO8601
```

## Boundary treatment

Controllers frequently sit outside the government-cloud boundary. The adapter must declare its boundary disposition explicitly (in-boundary, named exception, or compensating-controller). Controllers that do not fit any of these categories require an authorizing decision before registration.

## Drift considerations

- Schema — controller policy schema diverges from canonical shape.
- Provenance — telemetry chain breakage between site, controller, and substrate (common at boundary crossings).
- Authorization — policy decision emitted outside the declared scope.
- Semantic — service-level agreement classification mismatch between controller and canonical model.

## Honest limits

- Vendor maturity in federal cloud boundaries varies. Adapter authors may have to carry significant compensating-controller logic for vendors lacking in-boundary controllers.
- Path-quality telemetry from some vendors is proprietary; canonical claim emission may require synthesis with explicit synthesized classification.
- Identity-aware policy is not universally supported by all vendors; programs adopting an identity-naive controller cannot realize the full specification.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
