# Cloud Modernization Specification

**Cross-adapter contract for cloud boundary governance and migration**

The cloud domain specification defines the substrate contract for modernizing cloud services under a declared authorization boundary.

## Substrate contract

Every cloud adapter inherits:
- A declared boundary — either in-boundary or one of a small set of named exceptions.
- Endpoint resolution that does not hardcode hostnames.
- Fail-closed behavior for unknown clouds.

## Boundary contract

Cloud adapters either:
1. Operate in-boundary — declare the boundary and read state via in-boundary APIs. Drift findings are scoped to the boundary’s capability disposition.
2. Operate via a named exception — declare a discrete exception value. New exceptions require a formal decision; the enumeration is added in lockstep.

There is no third option. Adapters that require commercial-only APIs cannot register against the boundary without an authorizing decision.

## Integration shape

Cloud adapter claims carry the canonical provenance envelope plus cloud-specific fields:

```
provenance:
  ...
cloud:
  boundary: "declared-boundary"
  tenant_id: "{tenant_id}"
  region: "{region}"
  endpoint_class: "graph-v1.0 | graph-beta | arm | arc"
```

The endpoint class is what makes boundary-aware emission possible.

## Drift considerations

- Provenance — boundary crossings often manifest as provenance drift; the chain breaks where a claim crosses the boundary without a derived-classification adjustment.
- Schema — API version transitions surface as schema drift if the adapter does not track them.
- Authorization — runtime drift if an adapter emits outside its declared cloud scope.

## Honest limits

- The named-exception list is canonical and small. New exceptions require formal decisions; programs that need additional cross-boundary capabilities cannot self-authorize.
- Platform feature gaps remain agency responsibility; the specification does not eliminate them, it makes them governable.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
