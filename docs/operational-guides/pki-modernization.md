# PKI Modernization Guide

Migrating from Active Directory Certificate Services to cloud-native certificate issuance and authentication.

## Purpose

This guide provides a phased approach for moving from on-premises AD CS to a cloud PKI model using Intune certificate profiles and Entra ID Certificate-Based Authentication, while preserving required certificates during coexistence.

## Phases

| Phase | Focus |
|-------|-------|
| 1 | Assessment — inventory CAs, templates, issued certificates, and ESC vulnerabilities |
| 2 | Target design — Cloud PKI (Cloud Root or BYOCA), Intune SCEP/PKCS profiles, Entra CBA |
| 3 | Pilot — limited issuance and authentication testing |
| 4 | Scale — broader template migration and device/user rollout |
| 5 | Cutover — shift issuance authority; validate before rollback window closes |
| 6 | Decommission — retire AD CS after residual certificate needs are met |

## Key considerations

- **Strong certificate mapping** — Enforce modern binding to prevent authentication bypass.
- **Hybrid coexistence** — Domain controller certificates, LDAPS, and cross-trust scenarios must continue to function during transition.
- **OCSP/CRL consistency** — Revocation endpoints must resolve and respond from every client location.
- **Template rationalization** — Do not migrate every legacy template; classify and retire obsolete ones.
- **Intune deployment** — Trusted root, SCEP, and PKCS profiles replace autoenrollment for managed devices.

## Success criteria

- New certificates are issued from the target PKI.
- Authentication (user and device) succeeds with cloud-issued certificates.
- Residual AD CS certificates are inventoried and either renewed from the new PKI or explicitly retained.
- Revocation checking works from on-premises, cloud, and branch locations.

---

*Cleaned extraction for project use.*
