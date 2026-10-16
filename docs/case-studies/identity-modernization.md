# Identity Modernization — Framing Pattern

**Attribute-driven organizational structure and codebook adoption**

## Starting state

A federal civilian agency operates a 20-year Active Directory forest. Organizational structure is encoded in OU hierarchy and group membership. Access is assigned by hand. Movers lag behind their organizational changes. HR, IT, and Security each hold a different picture of who someone is.

## Intervention

Organizational position is decomposed into named facets written to extension attributes. Dynamic groups are defined by boolean composition over those facets. Administrative units are aligned to the major organizational segments. The facet-to-access rule set becomes the audit evidence.

## Observed behavior (intended)

Access recalculates the moment an attribute changes. Access narrows the moment a facet narrows. Audit evidence is the rule set itself rather than a reconstructed history of tickets.

## Lessons

- Facet writes for synced users are directory-mastered; the directory-sync interval is the provisioning floor, not zero.
- Dynamic groups without a governed library become a different kind of sprawl.
- The codebook and the delegation matrix must be adopted together; one without the other reintroduces the manual lag.

---

*Cleaned framing pattern for project use. Not a deployed reference. No internal branding or document identifiers.*
