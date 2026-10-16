# Federal Civilian OPM HRIT to Entra ID — Reference Deployment Pattern

End-to-end pattern for a federal civilian agency consuming an OPM-platform HR system of record under an HR-agnostic architecture.

## Framing

This is an engagement pattern, not a fabricated deployment. Specific metrics, agency identifiers, and calendar dates are intentionally absent. The narrative describes expected behavior against the archetype.

## Pipeline

1. **HR system of record** — Authoritative source for joiner, mover, and leaver events (NFC EmpowHR, Treasury HR Connect, DCPDS, DOI IBC, or equivalent).
2. **Per-source adapter** — Normalizes the source feed to a canonical schema.
3. **Middleware** — Resolves organizational attributes, derives the UPN, constructs the SCIM payload, and calls the directory binding.
4. **Directory** — Entra ID receives the provisioning event. The middleware never writes back to the HR system.
5. **Downstream consumers** — Systems such as GRB, EHRI, or eOPF may consume provisioning events.
6. **Trust chain** — PIV (USAccess) to directory federation to consuming-agency tenant.

## Phases

| Phase | Focus |
|-------|-------|
| 1 | Pre-flight inventory of HR records and attribute mapping |
| 2 | Adapter deployment and validation |
| 3 | Middleware integration; organizational attribute population |
| 4 | Joiner / mover / leaver workflows active |
| 5 | Drift detection between HR state and directory state |
| 6 | Evidence retention and residual risk review |

## Key invariants

- The HR system remains the sole system of record. The middleware never writes back.
- Organizational attributes used for policy targeting are populated from the HR feed.
- Joiner, mover, and leaver events originate in HR, not in the directory.
- Drift between HR state and directory state is detectable and recorded.

## Companion

This pattern covers the inbound provisioning dimension. The Active Directory to Entra ID reference deployment covers the directory migration dimension. Both are required for a federal civilian identity plane that is continuously trustworthy from the HR event through to the directory.

---

*Cleaned extraction for project use. Framing pattern, not an attributed engagement.*
