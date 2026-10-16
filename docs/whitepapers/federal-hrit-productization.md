# Federal HRIT Productization

How HR systems of record become the authoritative source for identity provisioning into Entra ID.

## Problem

Agencies do not own their identity-proofing event. It happens in the HR system of record months before an Entra account exists. Bespoke, vendor-specific HR-to-directory pipelines make account management, identifier management, and authenticator management difficult to verify continuously. Federal HR 2.0 is consolidating Core HCM systems, changing the feed shapes agencies currently integrate against.

## Solution

An HR-agnostic architecture: any HR source feeds a per-source adapter, which produces one canonical schema, which flows through middleware to a single SCIM 2.0 binding into Entra ID. Joiner, mover, and leaver workflows, governance attribute population, drift detection, and evidence are produced as byproducts.

## Key facts (Federal HR 2.0)

| Fact | Value |
|------|-------|
| Directing instrument | OMB/OPM memorandum, December 10, 2025 |
| Platform | Oracle Fusion Cloud HCM |
| Award | June 11, 2026 (~$395.8M, 10-year) |
| Wave 1 | Begins FY 2026, concludes FY 2027 |
| Wave 2 | Includes additional agencies; completes FY 2027 |
| Typical onboarding | ~8 months; interconnections live ~month 5 |

## Architecture principles

- HR system of record is authoritative for identity proofing and employment status.
- No OPM document mandates a specific directory product. Entra ID integration is an agency implementation decision.
- The integration path must work with any HR source, not only the awarded platform.
- Joiner/mover/leaver workflows are driven by HR events, not by directory-side changes.
- Governance attributes are populated from the HR feed so that policy targeting remains deterministic.

## Ask

Build the HR-to-directory path against a canonical schema and a single binding, not against a vendor-specific connector. Treat the HR system as the source of truth for joiner, mover, and leaver events.

---

*Cleaned extraction for project use.*
