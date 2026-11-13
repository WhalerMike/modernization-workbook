# Verification — Guide: HR-Driven Identity, an Implementation Guide

New guide, first pass of 2026-11-01. The guide is a gated operator layer over Book 03 (Ch 03, 04, 06, 08, 09, 10, 11, 12 and Appendices A, B and C), Book 04 Ch 03 and 09, Book 02 Appendix A, Book 14 Ch 03, the guides `hcm-entra-implementation.md`, `attribute-driven-migration-implementation.md`, `attribute-driven-migration.md` and `non-person-identity-implementation.md`, the evaluation `oracle-contingent-worker-contractor-source.md`, the explainers `identity-maintenance.md`, `hr2-shared-governance-fedramp-boundary.md` and `hr-identity-dns.md`, Book 19 Ch 05, and the `examples/validation-kit`, `examples/hcm-entra` and `examples/lifecycle-extensions` READMEs. Facts carried from those pages are cited by link to the section that states them and rely on those pages' own verification logs. Every Microsoft Learn page footnoted in the guide was read on 2026-11-01 through the Microsoft Learn documentation service; the CISA, OMB and NIST sources were read the same day. No personal name or email address was sent in any request.

## Claims log: new external claims (footnoted)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Entra ID Governance available in GCC | Where agencies start | verified | `hri-feat` |
| 2 | GCC uses Microsoft Entra Public (commercial); an Azure Government subscription can't be associated with a directory in Entra Public | Where agencies start; every gate's availability paragraph; Step 6 | verified (FAQ). Use for custom task extensions is an inference, labeled in the guide | `hri-gov-identity`, <https://learn.microsoft.com/azure/azure-government/documentation-government-plan-identity> |
| 3 | API-driven provisioning from P1; entitlement management, access reviews and Lifecycle Workflows need ID Governance for member users (some capabilities under P2) | Prerequisites | verified | `hri-lic`, <https://learn.microsoft.com/entra/id-governance/licensing-fundamentals> |
| 4 | Licensing page: Lifecycle Workflows up to 50 workflows and 100 custom task extensions | Step 3; dangers | verified. **Discrepancy D1**: service limits page says 100 workflows (row 5) | `hri-lic` |
| 5 | Service limits: 100 workflows, 25 tasks, 100 custom task extensions, schedule 1–24 h, 10 users on demand, extension timeout 30 min–3 h, 5 administrative scopes; 15,000 assignments per automatic policy | Step 3; Step 6 | verified | `hri-limits`, <https://learn.microsoft.com/entra/id-governance/governance-service-limits> |
| 6 | Automatic assignment policy: rule on supported and extension attributes, adds and removes assignments, at most 15,000 identities, ID Governance or Entra Suite, Identity Governance Administrator (not catalog owners or access package managers) | Prerequisites; Step 4 | verified | `hri-auto`, <https://learn.microsoft.com/entra/id-governance/entitlement-management-access-package-auto-assignment-policy> |
| 7 | One automatic policy per package unless scopes never overlap or transition; hidden dynamic group per policy not to be modified or reused | Step 4; dangers | verified | `hri-auto` |
| 8 | `memberOf` automatic assignment policies quarantined from November 3, 2026; Learn publishes a read-only scan | Step 4; dangers | verified | `hri-auto` |
| 9 | Grace period after a user leaves a policy's scope | Step 4 | verified | `hri-auto` |
| 10 | Access package reviews: frequency annually, bi-annually, quarterly, monthly; Manager as reviewer with fallback; no-response options | Step 2 | verified | `hri-ar-ap`, <https://learn.microsoft.com/entra/id-governance/entitlement-management-access-reviews-create> |
| 11 | TAP task: hire date as start time; manager and manager's mail required; user must have no other methods, sign-ins or role assignments | Step 3; dangers | verified. The rehire consequence is an inference, labeled | `hri-tap-task`, <https://learn.microsoft.com/entra/id-governance/lifecycle-workflow-tasks> |
| 12 | TAP policy lifetime 10 minutes to 30 days; one-time use enforceable | Step 3 | verified | `hri-tap`, <https://learn.microsoft.com/entra/identity/authentication/howto-authentication-temporary-access-pass> |
| 13 | Hire time early, leave time late; tenant schedule default 3 h can delay; 24-hour TAP lifetime for new hires | Step 3 | verified | `hri-lcw-time`, <https://learn.microsoft.com/entra/id-governance/how-to-lifecycle-workflow-sync-attributes> |
| 14 | One tenant-wide schedule, default 3 h, settable 1–24 h; workflow versions | Step 3 | verified | `hri-lcw-api`, <https://learn.microsoft.com/graph/api/resources/identitygovernance-lifecycleworkflows-overview?view=graph-rest-1.0> |
| 15 | Custom task extensions call Azure Logic Apps (consumption); Logic App Contributor, Contributor or Owner, not Logic App Operator; launch and wait fails after the configured time | Where agencies start; Prerequisites; Step 6 | verified | `hri-lcw-ext`, <https://learn.microsoft.com/entra/id-governance/lifecycle-workflow-extensibility> |
| 16 | CRL: none configured, no revocation check; one endpoint, HTTP recommended; 20 MB interactive (public), 10 s; 65 MB service (public); CBA fails if a configured CRL can't be downloaded; Authentication Policy Administrator | Prerequisites; Step 5; dangers | verified | `hri-crl`, <https://learn.microsoft.com/entra/identity/authentication/concept-certificate-based-authentication-certificate-revocation-list> |
| 17 | Dynamic administrative units only in the global Azure cloud | Step 4 | verified | `hri-au-dyn`, <https://learn.microsoft.com/entra/identity/role-based-access-control/admin-units-members-dynamic> |
| 18 | M-22-09: centralized identity management; phishing-resistant MFA for staff, contractors and partners; enterprise identity draws on HR, contract management and personnel security | Track at a glance; Steps 2 and 3 | verified (pages 5–6 of the PDF) | `hri-m2209`, <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf> |
| 19 | BOD 25-01 required: MS.AAD.3.1v1 phishing-resistant MFA for all users; MS.AAD.3.6v1 for highly privileged roles; MS.AAD.7.5v1 privileged roles only through a PAM system | Steps 4 and 5 | verified (CISA Required Configurations page) | `hri-bod`, <https://www.cisa.gov/resources-tools/services/bod-25-01-implementing-secure-practices-cloud-services-required-configurations> |
| 20 | AC-2, AC-2(1), AC-2(3), AC-2(13), AC-5, AC-6, AU-6, AU-11, CA-7, IA-2(12), IA-4, IA-4(4), IA-5(2), PS-4, PS-5, PS-7, SI-12 are in the Moderate baseline | Every gate's requirements table | verified (NIST OSCAL Moderate profile). Control text not re-read; it relies on Book 03 Ch 11's log | `hri-nist-mod` |

## Claims log: carried from the books and guides (linked, not footnoted)

| Claim (short) | Where in the guide | Carried from |
|---|---|---|
| One writer per state transition; LCW tasks can write account state for synced users | Step 1 | Book 03 Ch 04 Operating rules; Ch 08 |
| Writers of the schema; remove help-desk, self-service and Exchange paths | Step 1 | Book 03 Ch 06 Writers |
| Scope filter; leave is not a leaver; cancellations; manager links; partial leavers; contractor leavers | Steps 1, 2, 6 | Book 03 Appendix A |
| Contractor options, one authority per fact, earliest end, six register questions, read-only first | Step 2 | Book 03 Ch 06; contractor evaluation Part 6 |
| Published-date polling | Step 2 | `hcm-entra-implementation.md`, the two decisions |
| Few workflows, execution limits, on-demand bypass, reorganization as mass mover | Steps 3, 4 | Book 03 Ch 08 Guardrails |
| Three-day catch-up; schedule in the separation interval | Steps 3, 6 | Book 03 Ch 08 Triggers and schedule |
| Manager as approver with fallback; PIM eligibility through packages; privileged roles out of rules | Step 4 | Book 03 Ch 10 |
| Mover grace period for standard access, zero for Tier 1 | Step 4 | Book 04 Ch 09 |
| Binding identifies one certificate; contractor PIV path (pending proof); card events; leaver sequence; 18-hour rule; evidence per leaver | Steps 5, 6 | Book 03 Ch 09 |
| `certificateUserIds` writer after AD is an open pilot | Step 5 | ADM implementation guide Gate 6 |
| Two writers coordinated (`active` false first) | Step 6 | `hcm-entra-implementation.md` sequences; Book 03 Ch 08 |
| Drift classes, six metrics, evidence by event, Entra retention, control support | Step 7; Evidence | Book 03 Ch 11 |
| Sole-source proof; acceptance rows | Steps 6, 7 | Book 03 Appendix C |
| Validation kit check IDs and what each reports | Every Validate step | `examples/validation-kit/README.md` and its catalog |

## KSI column (November 2, 2026)

FedRAMP's Key Security Indicators page (<https://www.fedramp.gov/2026/reference/key-security-indicators/>) was read through WebFetch on November 2, 2026, for each indicator's "Related SP 800-53 Controls." Every KSI ID in the gate tables was already cited in the repo (Book 02, Chapter 10; Book 04, Chapter 10; Book 13, Chapter 04 and Appendix A; Book 14, Chapter 03); none is new. The provider-side framing is carried from Book 00, Appendix B.

| Claim (short) | Where in the guide | Verdict | Source |
|---|---|---|---|
| AC-2, AC-5, AC-6, CA-7, IA-5(2), SA-9 pairs | Gates 1, 2, 4, 5, 7 | carried forward | Book 13, Appendix A |
| IA-4 to KSI-IAM-ELP, KSI-IAM-JIT; IA-4(4) to KSI-IAM-AAM, KSI-IAM-ELP, KSI-IAM-JIT | Gates 1, 2 | verified (new pairs) | FedRAMP KSI page |
| PS-7 to KSI-SCR-MON only | Gates 2, 6 | verified (new pair) | same |
| AC-2(1) to KSI-IAM-JIT and KSI-IAM-SUS (KSI-IAM-JIT shown); IA-5 to KSI-IAM-APM | Gate 3 | verified (new pairs) | same |
| PS-5 to KSI-IAM-ELP, KSI-IAM-JIT | Gate 4 | verified (new pair) | same |
| No indicator lists IA-2(12) | Gate 5 | verified | same |
| PS-4 to KSI-IAM-ELP, KSI-IAM-JIT, KSI-IAM-SUS; AC-2(3) to KSI-IAM-AAM, KSI-IAM-JIT, KSI-IAM-SUS; AC-2(13) to KSI-IAM-AAM, KSI-IAM-SUS | Gate 6 | verified (new pairs) | same |
| AU-6 to KSI-MLA-RVL; AU-11 to KSI-MLA-OSM; no indicator lists SI-12 | Gates 1, 7 | verified (new pairs) | same |
| M-22-09's phishing-resistant MFA and SCuBA MS.AAD.3.1v1 and MS.AAD.3.6v1 line up with KSI-IAM-APM; MS.AAD.7.5v1 with KSI-IAM-JIT | Gates 3, 4, 5 | carried forward (program mapping) | Book 02, Chapter 10; Book 04, Chapter 10 |
| OMB memos, the Privacy Act, FIPS 201-3, SP 800-63-4 and BOD 25-01 have no indicator | Gates 1 to 7 | verified: KSIs list only SP 800-53 controls | FedRAMP KSI page |
| The HR platform runs on Oracle Cloud Infrastructure; the agency relies on its FedRAMP authorization (SA-9) | Gate 2 | carried forward | Where the parts run; HR 2.0 governance explainer |

## Discrepancies

- **D1.** Microsoft Learn gives two Lifecycle Workflows ceilings: 50 workflows on the licensing page, 100 on the service limits page (both read 2026-11-01). Book 03 Ch 08 and the validation kit use 100; Book 04 Ch 09 uses 50. The guide budgets to 50 and lists the conflict under What couldn't be verified.

## Not verified

- Whether a GCC tenant's custom task extension can call a Logic App in an Azure Government subscription.
- Tenant behavior of any step; the kit checks are fixture-tested.

## Zero Trust closure, Phase 4 (November 11, 2026)

Applied the conventions of Book 00, Appendix D (`docs/books/b00-orientation/appendix-d-control-states-and-evidence.md`) to this procedure guide, as the smallest coherent addition:

| Convention | Where | What was added |
|---|---|---|
| G-01 control states | `#hrd-control-states` | The five states mapped to the guide's gates, with the evidence for each, and the ready-for-closure sentence |
| G-02 How template | `#hrd-control-states` | A coverage table pointing each subsection to where the guide already covers it; exclusions name the emergency access accounts |
| G-06 evidence checklist | the five-kind evidence checklist appended to **Evidence** | Five kinds: configuration, operational, test, exception, assessor-ready artifact |
| G-07 change safety | `#hrd-control-states` | Rings adapted from the guide's pilot and waves, emergency access, change window, backout triggers *(design guidance)*, post-change validation |
| G-08 assessment mapping | `#hrd-assessment-mapping` | Microsoft and CISA pillars, dependencies, attack chain interrupted |

**G-05 musts relabeled.** None. The remaining *must* and *required* are product constraints (a CRL must download within 10 seconds), BOD 25-01 required configurations (a mandate, kept), the binding affinity setting's name, or descriptive.

**G-03 re-verification.** None. Every statement in the new section is carried from the guide's own gates, Evidence and Rollback, the pipeline guide's shadow mode, or the privileged access guide's G2; no new product, licensing or government-cloud claim was added, so no Learn page was re-read. The guide's product claims keep their footnoted read date (November 1, 2026).
