# HRIT to Cloud Identity — Reference Framing Pattern

**Inbound HR provisioning into the cloud identity platform**

## Starting state

A federal civilian agency receives identity data from a human-resources information technology system. Provisioning into the directory is manual or semi-manual. Joiner, mover, and leaver events lag behind the authoritative HR record. Access remains assigned by hand.

## Intervention

Inbound provisioning is treated as a governed flow. The HR system is the authoritative origin for lifecycle events. Facets are written to the directory of record. Dynamic groups recalculate. Access and policy update automatically. The directory-sync interval is accepted as the provisioning floor for synced users.

## Observed behavior (intended)

Joiner, mover, and leaver events produce owned, clocked, evidenced work. Access recalculates when an attribute changes. The Chief Data Officer and the identity team share a single designation register.

## Lessons

- Run the data-governance program and the identity-migration program as one.
- Accept the directory-sync interval as the floor for synced users; do not claim zero-latency provisioning.
- The facet-to-access rule set is the audit evidence.

---

*Cleaned framing pattern for project use. Not a deployed reference. No internal branding or document identifiers.*
