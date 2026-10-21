# Secure Access Service Edge Modernization Specification

**Cross-adapter contract for Secure Access Service Edge governance**

Secure Access Service Edge replaces perimeter-and-VPN remote access with identity-driven, network-overlay security delivered as a converged service. This specification defines the substrate contract that adapters must honor: identity-derived addressing, certificate-anchored overlay, and canonical claim emission for access decisions.

## Substrate contract

Secure Access Service Edge adapters span the Identity, Network, Addressing, and Security & Compliance planes. They inherit:
- Identity-derived access — every access decision consumes identity claims as authoritative input; policy decision points do not maintain parallel identity authority.
- Certificate-anchored overlay — the network overlay binds to certificates from the identity plane, not to per-device pre-shared keys or location-based trust.
- Decision-record emission — every access decision is a canonical claim with the full provenance envelope.

## Adapter shape

Adapters declare:
- Mission-class: enforcement (policy decision/enforcement point role) or integration (cloud access security broker / secure web gateway / data loss prevention integration role).
- Class: modernization (replacing legacy VPN / perimeter) or conformance (observing vendor policy state).
- Boundary disposition per adapter.

## Integration shape

```
provenance:
  ...
sase_decision:
  pdp_id: "{policy_decision_point}"
  decision: "permit | deny | escalate"
  identity_context: "{issuer_identity}"
  resource_scope: "{application_id | url | dns_name}"
  network_overlay: "{overlay_id}"
  certificate_thumbprint: "{cert_id}"
  policy_refs:
    - "{authoritative_policy_id}"
  evaluation_timestamp: ISO8601
```

## Drift considerations

- Identity — policy decision point receives an unresolvable identity claim; halt and alert.
- Authorization — decision recorded outside the consent envelope.
- Provenance — overlay certificate fails to bind to an identity-plane object.
- Schema — vendor policy schema diverges from canonical shape.

## Honest limits

- Vendor maturity in government clouds varies. Programs may need compensating-mechanism declarations for vendor features unavailable in-boundary.
- Certificate-anchored overlay requires the agency public-key infrastructure to issue certificates bound to identity-plane objects.
- Some vendor policy decision points do not emit decision records natively; the adapter shape may require synthesis from logs, with explicit derived classification.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
