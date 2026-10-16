# Data Platform Identity Transformation — Project Plan

## 1. Overview

Modernize data-platform authentication beyond the SQL Server worked example. Follows: Assess → Bridge → Migrate → Eliminate NTLM → Evidence.

## 2. Phases

### Phase 0 — Charter and Alignment
Confirm pilot engine, scope, and evidence expectations.

### Phase 1 — Assess
Inventory engines, authentication methods, stored credentials, and NTLM usage.

### Phase 2 — Bridge
Introduce token-based or managed-identity authentication alongside existing methods for the pilot.

### Phase 3 — Migrate
Move pilot workloads. Retire stored credentials for the migrated scope. Move application-tier access to managed identity or scoped credentials where feasible.

### Phase 4 — NTLM Elimination and Evidence
Restrict NTLM after audit. Emit authentication evidence. Document network-physics constraints for any consolidation under consideration.

## 3. Success Measures
- Estate assessed.
- One engine migrated for pilot scope.
- NTLM restriction plan documented.
- Application-tier access uses managed identity or scoped credentials.
- Authentication evidence available.
- Network-physics constraints documented.

## 4. Immediate Next Actions
1. Inventory engines and authentication methods.
2. Identify the pilot engine.
3. Confirm managed-identity or token support.
4. Document NTLM dependencies.

---

*Project artifact. No internal architectural decision record identifiers.*
