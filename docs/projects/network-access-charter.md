# Network & Access Modernization — Project Charter

## 1. Purpose

Replace perimeter-and-VPN remote access and static wide-area networking with identity-driven, application-aware access and an authoritative naming and addressing plane that every other control can reconcile to.

## 2. Problem Statement

Remote access is still largely perimeter-and-VPN. Wide-area networking is static. DNS, DHCP, and IP address management are fragmented or per-cloud. The result is:

- Access decisions that do not consume identity as authoritative input.
- No single join key for asset identity across management stacks.
- Encrypted transport that does not exist, or exists only inside a cloud provider’s boundary.
- Customer-edge enforcement that is ungoverned or unaccredited.

## 3. Objectives

1. Establish an authoritative naming and addressing plane (DNS, DHCP, IPAM) as the asset-identity join key.
2. Deploy identity-driven access (Zero Trust Network Access or Secure Access Service Edge) that consumes identity claims and does not maintain parallel identity authority.
3. Implement certificate-anchored overlay where feasible, binding network trust to identity-plane certificates.
4. Close the customer-owned half of boundary and encryption controls that no cloud provider’s authorization covers.
5. Emit access and path decisions as canonical claims with provenance.

## 4. Scope

### In Scope
- Authoritative naming and addressing plane (DNS, DHCP, IPAM).
- Identity-driven remote access (Zero Trust Network Access / Secure Access Service Edge).
- Encrypted, application-aware transport (SD-WAN or equivalent under the applicable boundary model).
- Customer-edge enforcement (802.1X, boundary controls) where in scope.
- Certificate and token issuance bound to identity-plane objects.
- Provenance for access and path decisions.

### Out of Scope (Initial Phase)
- Full replacement of existing wide-area networking contracts.
- Application-layer microsegmentation inside every workload.
- Non-federal or commercial-only network designs beyond the boundary model already defined.

## 5. Guiding Principles

- **Identity is the root namespace.** Addressing and access derive from identity attributes.
- **Naming plane is a truth plane.** DNS, DHCP, and IPAM are authoritative; other inventories reconcile to them.
- **Access decisions consume identity.** Policy decision points do not maintain parallel identity authority.
- **Certificate-anchored where feasible.** Network overlay binds to identity-plane certificates rather than pre-shared keys or location-based trust.
- **Customer edge is in scope.** The half of boundary and encryption controls that no cloud provider covers must be closed by the organization.

## 6. Success Criteria

- Authoritative naming and addressing plane designated and operational for the pilot scope.
- Identity-driven access path available for a pilot population; VPN or perimeter path is documented as residual.
- At least one access or path decision emits a canonical claim with provenance.
- Customer-edge enforcement approach documented (802.1X or equivalent) with accreditation path identified.
- Boundary disposition declared for every network service in scope.

## 7. High-Level Approach

1. **Name and address** — Establish or confirm the authoritative naming and addressing plane.
2. **Identify** — Ensure identity claims are available to access decision points.
3. **Access** — Deploy identity-driven access for a pilot; retain legacy path under controlled residual risk.
4. **Enforce at the edge** — Document and begin customer-edge enforcement where required.
5. **Evidence** — Emit access and path decisions as claims.

## 8. Risks and Assumptions

### Key Risks
- Naming plane fragmentation across clouds prevents a single join key.
- Identity claims are not available to network policy decision points.
- Certificate issuance is not bound to identity-plane objects.
- Vendor maturity varies inside government-cloud boundaries.

### Assumptions
- An identity provider capable of emitting claims is available.
- Stakeholders accept that the naming plane is a truth plane and other inventories are subordinate.

## 9. Governance and Ownership

- Project sponsor: (to be named)
- Project lead: (to be named)
- Domain leads: Naming & Addressing, Identity-Driven Access, Customer-Edge Enforcement, Certificates

## 10. Next Steps

- Confirm or designate the authoritative naming and addressing plane.
- Inventory current remote-access paths and residual VPN usage.
- Identify where identity claims can be consumed by access decision points.
- Document boundary disposition for network services in scope.
- Define the pilot population and evidence expectations.

---

*This charter describes a network and access modernization project. It deliberately omits internal architectural decision records and document identifiers.*
