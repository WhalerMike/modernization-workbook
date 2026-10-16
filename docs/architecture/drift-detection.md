# Drift Detection — A Walk-through

**Five categories, one engine loop, attribute-level examples**

## The job of the drift engine

Every governance pipeline rests on the assumption that three things agree: the HR system’s view of who works where, the directory’s attribute values for every principal, and the codebook’s enumerations of valid values. The drift engine’s job is to *not believe that assumption*. It re-checks, on a schedule, that the three layers still line up — per attribute, per principal — and when they do not, it emits a structured finding that names the disagreement precisely enough for a human to fix it (or, in some cases, fixes it automatically).

The engine runs a six-phase loop:

```
Snapshot → Compare → Classify → Alert → Remediate → Verify
   ↑                                      │
   └─────────────────────── re-scan ───────────────────┘
```

1. **Snapshot.** Pull current tenant state — users, groups, administrative units, role assignments, device records.
2. **Compare.** Diff each principal’s attribute values against the codebook.
3. **Classify.** Map each difference to one of the five categories below, with severity and an auto-fix policy.
4. **Alert.** Emit structured findings for immutable recording.
5. **Remediate.** If not in dry-run mode and the finding is auto-remediable, apply the fix. High-impact operations (phantom deletions, administrative-unit cascades) are never auto-applied.
6. **Verify.** Re-snapshot to confirm.

## The five drift categories

| Category | What broke | Severity | Auto-fix? |
|----------|------------|----------|-----------|
| **Format** | A typed attribute’s value fails its expected pattern | Critical | No |
| **Value** | An enumerated attribute’s value is not in the enumeration | High | Sometimes |
| **Slot** | Two attributes are fighting over the same slot, or a slot was remapped without review | Critical | No |
| **Orphan** | An enumeration value has zero matching principals | Medium | Flag only |
| **Phantom** | A principal carries a value that has been deprecated in the codebook | Medium | Reassign (when a successor is defined) |

### Format Drift

A typed attribute has an expected pattern. Any value that fails the pattern is Format Drift.

**Example.** A bulk-import script writes US-style dates into a hire-date attribute that expects ISO 8601. After the next run, the attribute reads `01/15/2024` instead of `2024-01-15`.

**Why no auto-fix?** Auto-reformatting would hide the upstream script bug. Critical severity forces a human to look at *why* the malformed value got written.

### Value Drift

An enumerated attribute’s value passes type but does not appear in the enumeration.

**Example.** A device-provisioning script populates a department attribute with `IT-Sec`. The department enumeration includes `IT` but not `IT-Sec`.

**Sometimes auto-fixed.** When the HR source is trusted as authoritative, Value Drift on principals can be remediated by writing the HR value back. For device records and other non-HR-driven principals, the finding flags for human review.

### Slot Drift

A codebook change remapped an attribute to a different slot without a reviewed change, or two attributes are declared binding the same slot. This is a codebook integrity violation, not a per-principal data finding.

**Why critical?** Cross-attribute slot collision means downstream dynamic groups, administrative units, and Conditional Access policies become ambiguous. It halts the entire remediation pass.

### Orphan Drift

An enumeration value has zero matching principals. The value is canonical and well-formed but no user, device, or administrative unit points at it.

**Example.** A region value was added in anticipation of an expansion that was later delayed. Nobody has that region value.

**Flag only.** Auto-deleting empty enumeration values would erase audit-relevant history. The engine flags for governance review.

### Phantom Drift

A principal carries a value that has been deprecated in the codebook. The codebook says it is gone (with a successor); the directory says it is still there.

**Example.** A department value was deprecated in favor of a two-attribute decomposition. Several contractor accounts still carry the old value.

**Reassign.** When the deprecation entry has a successor, the engine writes the successor into the affected slot and records the substitution.

## What happens after a finding fires

| Severity | Behavior |
|----------|----------|
| **Critical** | Halt remediation pass; escalate immediately |
| **High** | Standard tracked item; escalate at the service-level boundary |
| **Medium** | Standard tracked item; warning at a defined percentage of the service-level boundary |
| **Low** | Logged for trend analysis; no individual escalation |

Findings are written with cryptographic anchoring. Drift detection cannot suppress evidence emission, and evidence storage cannot influence drift classification.

## How to think about the categories

| Question | If yes → |
|----------|----------|
| Does the value violate a typed attribute’s expected pattern? | **Format** |
| Does an enumerated attribute’s value not appear in the enumeration? | **Value** |
| Are two attributes fighting over the same slot, or did a slot remap happen without review? | **Slot** |
| Does an enumeration value have zero matching principals? | **Orphan** |
| Does a principal carry a deprecated value? | **Phantom** |

Format and Slot are critical because they break governance *structure*. Value is high because the structure is intact but a single principal’s data is wrong. Orphan and Phantom are medium because the structure is intact and the data is internally consistent — there is just a stale reference at one end or the other.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
