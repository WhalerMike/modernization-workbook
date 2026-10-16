# Federal Compliance for Moderate Agencies

**Which mandates bind the agency, which bind the vendor, and where to read deeper**

## Problem, solution, ask

**Problem.** FedRAMP, NIST SP 800-53, CISA’s directives, OMB’s memos, and TIC 3.0 get discussed as if they bind “the government” undifferentiated. Some bind the cloud service provider, some bind the agency, a few bind both — and conflating them produces agencies that treat FedRAMP as someone else’s problem while missing their own continuous-monitoring obligation, or that pour effort into vendor-shaped paperwork that was never theirs to do.

**Solution.** One question per mandate — who does this actually bind? — with the deadlines that matter.

**Ask.** Sort every open compliance item into “ours” and “our vendor’s”; put the CSP-facing dates on the calendar anyway, because the agency’s own authorization and reciprocity decisions depend on them.

## Executive summary

Three distinct actors sit inside “federal compliance,” and almost every mandate binds exactly one of them directly:

| Actor | Role | Directly bound by |
|-------|------|-------------------|
| **Cloud Service Provider / vendor** | Builds and operates a Cloud Service Offering it sells into the federal market | FedRAMP (the baseline itself, and the 20x Consolidated Rules) |
| **Federal agency** (AO, ISSO, CISO, mission owner) | Operates systems — its own, or built on top of an authorized CSO — and holds its own Authority to Operate | NIST SP 800-53/800-37 (its own ATO), CISA’s directives, OMB’s policy memos |
| **Independent assessor** | Validates either side’s evidence | Whichever framework it is assessing against |

The confusion is that FedRAMP 20x’s headline change — continuous, machine-readable evidence instead of periodic assessment — is a CSP-facing authorization requirement, but the same evidentiary bar is also rising for agencies’ own systems under NIST SP 800-37’s continuous-monitoring requirement (CA-7) and OMB Circular A-130. An agency reading “FedRAMP 20x” and concluding “not my problem” misses that its own ATO package is being held to the same rising bar, on a different legal basis.

## Key distinctions

### FedRAMP and the 20x Consolidated Rules
Binds vendors directly. Agencies inherit the evidence. An agency does not submit into the FedRAMP 20x pipeline the way a CSP does. What changes for the agency is what it can now expect to receive: continuous evidence from its authorized cloud providers instead of a stale point-in-time assessment package.

### NIST SP 800-53 / SP 800-37
Binds agencies directly for systems they operate. Running on top of a FedRAMP-authorized offering inherits that offering’s controls but does not relieve the agency of its own ATO for the system it built on top of it. CA-7 continuous monitoring is the agency-side analog of FedRAMP 20x’s evidence requirement.

### CISA BOD 25-01 (SCuBA)
Binds agencies directly, on a fixed timeline. Requires agencies to identify Microsoft 365 tenants, implement secure configuration baselines, deploy assessment tooling, integrate with continuous-monitoring infrastructure, and remediate deviations — not merely report them. The remediation clause is the part agencies most often under-invest in.

### CISA BOD 26-04
Binds agencies directly for risk-based vulnerability remediation.

## Honest limits

Scope is federal civilian agencies operating at the FedRAMP Moderate baseline. DoD, state and local, and commercial-non-federal regimes are out of scope.

---

*Cleaned extraction for project use. No internal branding or document identifiers. This is a routing primer; companion papers cover each mandate in depth.*
