# Drift Detection Walk-through

How a governance engine detects and classifies misalignment between authoritative sources, directory attributes, and a canonical codebook.

## Detection loop

The engine executes a six-phase control loop:

1. **Snapshot** — Pull current directory state (users, groups, administrative units, role assignments, device records) and the governance attributes carried on each principal.
2. **Compare** — Diff each principal’s attribute values against the codebook’s per-facet enumerations and typed patterns.
3. **Classify** — Map each difference to a drift category with severity and an auto-remediation policy.
4. **Alert** — Emit findings into an evidence store with immutable recording.
5. **Remediate** — If not in dry-run mode and the finding is auto-remediable, apply the fix. Governance-review operations are never auto-applied.
6. **Verify** — Re-snapshot to confirm the state. In the initial implementation this step is operator-triggered.

The loop repeats on a schedule.

## Drift categories

| Category | What broke | Typical severity | Auto-remediate |
|----------|------------|------------------|----------------|
| Format | Value fails the required pattern | P1 | No |
| Value | Value is not in the allowed enumeration | P2 | Sometimes (trusted source only) |
| Slot | Two facets claim the same attribute slot, or a facet was remapped without a change record | P1 | No |
| Orphan | An enumeration value has zero matching principals | P3 | Flag only |
| Phantom | A principal carries a deprecated value | P3 | Yes, if a successor is defined |

## Example findings

**Format drift (P1, no auto-fix)**  
A date attribute contains `01/15/2024` instead of the required ISO 8601 form `2024-01-15`. Auto-reformatting would hide an upstream bug; the finding is escalated for investigation.

**Value drift (P2, conditional auto-fix)**  
A department attribute is set to `IT-Sec`, which is not in the enumeration. For HR-driven principals the engine may correct from the trusted source; for other objects it is flagged.

**Slot drift (P1, no auto-fix)**  
Two facets are bound to the same attribute slot. This creates ambiguity in dynamic groups and policy rules and must be resolved by a deliberate change, not an automated fix.

**Orphan drift (P3, flag only)**  
An enumeration value exists in the codebook but no principal currently uses it. The value is retained for audit; the finding is reported for review.

**Phantom drift (P3, auto-remediate if successor exists)**  
A principal still carries a deprecated value that the codebook has replaced. The engine writes the successor value and records the substitution.

## Operational procedure

1. Run the engine on a defined schedule.
2. Validate each facet against the codebook.
3. Classify every anomaly using the decision table above.
4. Record findings in the evidence store.
5. Remediate according to severity:
   - P1 — Halt and escalate; no auto-fix
   - P2 — Ticket; auto-fix only from a trusted source
   - P3 — Flag or auto-reassign when a successor is defined
6. Verify by re-snapshot.
7. Escalate according to severity and age of the finding.

## Key properties

- Findings are immutable once written.
- Drift detection does not suppress evidence, and evidence storage does not influence classification.
- Critical (P1) findings can halt an entire remediation pass.
- Auto-remediation is limited to cases where the correct value is unambiguous and comes from a trusted source.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
