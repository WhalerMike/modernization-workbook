# Governed and Retrofit Paths

**Device and server modernization — the paths beyond the manual overview**

## Overview

The manual path is the starting point: observe, onboard, harden, watch. The governed and retrofit paths address the cases where the estate is large, the risk is high, or the devices cannot be treated as net-new.

## Governed path

The governed path routes the bulk state change through an active reconciliation control plane rather than a Group Policy switch.

**Rules:**

- Address before you actuate. Organizational attributes must be present on every device before any policy is applied.
- Cap the blast radius. High-blast-radius classes (privileged workstations, servers, kiosks) remain gated on human approval.
- Execute through plan and apply with dry-run. No change is applied without a preview of the impact.
- Bake enforcement in report-only first. Measure before you enforce.
- Reconcile duplicates and lifecycle. One object per machine. Orphaned and phantom objects are findings, not residual state.
- Emit evidence an authorizing official can sign. Every bulk change produces a provenance record.
- Cover the whole denominator. Non-Windows, bring-your-own, guest, and server classes are in scope, not deferred.

**When to use:** Estates larger than a few hundred devices, or any estate where an authorizing official must sign the change.

## Retrofit path

The retrofit path is for devices that cannot be treated as net-new and cannot be fully unjoined in the current wave.

**Rules:**

- Hybrid management onboarding attaches the management plane without requiring domain unjoin.
- Policy is applied through the management plane; Group Policy remains only where the management plane cannot yet own the setting.
- Last-writer-wins conflicts are documented before they are encountered. Overlapping settings are retired in a later wave.
- NTLM and service principal name work proceeds in parallel but is sequenced after the management plane is attached.
- Domain unjoin is a separately sequenced decision. Onboarding does not imply it.

**When to use:** Existing fleets that must remain domain-joined for the current wave, or servers that cannot yet be detached from the domain.

## Relationship to the manual path

The manual path is the learning path. The governed path is the production path for large estates. The retrofit path is the production path for estates that cannot yet leave the domain. All three share the same observe-before-change rule and the same evidence requirement.

## Key risks

- Premature NTLM restriction breaks legacy applications.
- Embedded service-principal secrets in Group Policy startup scripts are a credential exposure.
- Missing break-glass exclusion before Conditional Access enforcement locks out recovery.
- Treating domain unjoin as a side effect of onboarding rather than a sequenced decision.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
