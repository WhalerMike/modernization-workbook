# Chapter 05 — Policy: Group Policy → Device Management + Conditional Access

**How twenty-five years of Group Policy becomes configuration profiles, compliance policies, and Conditional Access**

## The policy claim

Group Policy was Active Directory’s most ambitious delivery system — configuration, security, software deployment, scripts, drive mappings, and more, inheriting down an organizational-unit tree and filtered by security groups. The replacement surface is not one product; it is several: device management (configuration and compliance), Conditional Access (access control), hybrid server configuration, and tenant policy settings.

The framework maps every Group Policy category to the correct modern target, keeps the mapping versioned in the authoritative repository, and delivers policies through the same plan-and-deliver pipeline used for identity.

## The target surfaces

Every Group Policy Object falls into one of several categories. Each category has a clear modern home.

| Group Policy category | Modern target | Attribute-scoped? |
|-----------------------|---------------|-------------------|
| **Device configuration** (lockscreen, power, printers, drive maps) | Configuration profiles | Yes |
| **Security baselines** (password, lockout, audit, UAC) | Security baselines + authentication methods | Yes |
| **Software deployment** (.msi, scripts) | Application deployment + enrollment | Yes |
| **Access control** (startup, logon scripts, drive-letter mapping) | Conditional Access + session controls | Yes |
| **Server configuration** (roles, features, registry hardening) | Hybrid guest configuration + policy | Yes |
| **Browser / mailbox config** | Settings catalog + productivity-suite policies | Yes |

Categorization is not free-form. Every Group Policy Object in the assessment is classified into exactly one target category, and the Plan stage proposes a modern equivalent.

## Why one-to-one mapping fails (and what to do instead)

If a Group Policy Object has fifty settings, naïve mapping produces fifty modern settings and calls the job done. That is wrong for three reasons.

1. **Signal-to-noise.** A twenty-five-year-old Group Policy Object almost always contains settings nobody can attribute to a current requirement. Migrating them preserves dead weight.
2. **Conflict surface.** Modern settings catalogs have clearer precedence rules than Group Policy’s merge-versus-replace semantics. A faithful one-to-one port reproduces ancient conflicts.
3. **Targeting mismatch.** Group Policy Objects target by organizational unit plus security-group filter. Modern policy targets by group. Copying a filter verbatim misses the opportunity to use attribute-scoped dynamic groups instead of manually curated legacy groups that drift.

The correct pattern is **regenerate, not copy**. For each Group Policy category the framework proposes a canonical modern policy keyed to attribute branches, then layers per-branch overrides only where the assessment data justifies them. The result is simpler and more governed.

## Configuration profiles — the workhorse

Roughly seventy percent of Group Policy settings map to device-management configuration profiles. Configuration profiles are opinionated policy bundles targeting user or device dynamic groups.

### Policy authoring

Every configuration profile is a versioned manifest in the authoritative repository:

```yaml
policy_id: CONF-ENDPOINT-BASELINE-v1
display_name: Endpoint Baseline (v1)
platform: windows-11
profile_type: settings-catalog
scope:
  include_groups:
    - Structure-Enterprise-Devices
  exclude_groups:
    - Structure-Enterprise-BreakGlass-Devices
settings:
  - path: Security/Account/MaximumPasswordAge
    value: 60
  - path: Security/Lockout/LockoutDuration
    value: 15
  - path: Device/Experience/LockScreenMessage
    value: "Authorized use only."
  - path: Browser/Edge/SmartScreen/Enable
    value: true
provenance:
  derives_from_gpos:
    - { guid: "{8d1a7fc9-...}", gpo_name: "Enterprise Endpoint Baseline" }
    - { guid: "{2f6e4c7a-...}", gpo_name: "Global Browser Hardening" }
```

The manifest is versioned. A new version supersedes the old; both versions remain in the repository; the delivery pipeline carries only the newest enabled manifest. Legacy versions are auditable but not assigned.

### Targeting

Every configuration profile targets attribute-scoped dynamic groups:

- **Enterprise-wide:** all governed devices.
- **Division-wide:** devices in a given division.
- **Department-scoped:** devices in a given department.
- **Role-scoped:** devices matching a functional query (for example, high-risk).

No profile targets all devices tenant-wide unless it is the enterprise baseline. Narrower scoping keeps blast radius small.

### Compliance policies

Distinct from configuration profiles, compliance policies evaluate device state and report compliant or noncompliant. Conditional Access then uses that signal.

A typical compliance catalog includes:

- Minimum operating-system version
- Disk encryption required
- Firewall on
- Real-time protection on
- Device health attestation passed
- Specific required applications installed
- Specific prohibited applications absent

Each policy is attribute-scoped and evaluates on a schedule. Noncompliant devices are excluded from the compliant-devices dynamic group, which is the Conditional Access signal for downstream enforcement.

## Conditional Access — the access gate

Conditional Access replaces the perimeter-based authority that Group Policy inherited from network segmentation. Policies target attribute-scoped groups, evaluate signals (device compliance, risk score, location, session age), and enforce controls (multi-factor authentication, block, session limits).

### Policy library pattern

A baseline library enumerates policies as versioned manifests:

```yaml
policy_id: CA-100-Enterprise-MFA
display_name: "CA-100 · Enterprise · Require MFA for all users"
state: enabled
conditions:
  users:
    include_groups: [Structure-Enterprise-Users]
    exclude_groups: [Structure-BreakGlass-Users]
  applications:
    include: all-cloud-apps
    exclude: [assessment-apps]
  client_app_types: [browser, mobileAppsAndDesktopClients]
grant:
  controls: [require_mfa]
  operator: AND
session:
  sign_in_frequency: 12h
```

### Canonical policy numbering

The library follows a numbering convention that maps intent to scope:

| Range | Meaning |
|-------|---------|
| CA-000–099 | Foundational / break-glass / emergency |
| CA-100–199 | Enterprise baseline (all users) |
| CA-200–299 | Division-scoped |
| CA-300–399 | Department-scoped |
| CA-400–499 | Role-scoped (executive, admin, high-risk) |
| CA-500–599 | Workload-specific |
| CA-900–999 | Reserved — experimental / pilot |

Adding a new policy picks the next open number in the right range; every policy has a short, human-readable display name that begins with its number.

### Block versus require — the policy discipline

Policies lean heavily on “require” controls rather than “block” controls. The rationale: a block policy with a bad rule locks users out; a require policy with a bad rule requires a step that can be fixed. Block policies exist only for clear-cut deny cases (legacy authentication, high-risk sign-ins, impossible travel). Everything else is a require (multi-factor authentication, compliant device, session lifetime).

## Hybrid server configuration — the server equivalent

Windows Server policy — registry settings, service states, installed features — migrates to hybrid guest configuration. Hybrid management projects on-premises servers into the cloud; guest configuration applies policy; cloud policy governs assignment.

Policies live in the authoritative repository and target via resource tags that stay in sync with the organizational attributes of the corresponding device object. If a hybrid-projected server’s tag drifts from the device’s attributes, drift opens a tracked item.

## The policy-delivery pipeline

Policies flow through the same three-stage pipeline as identity changes (Chapter 03):

1. **Analyze.** Compare the repository policy tree to the live device-management, Conditional Access, and hybrid state; produce a diff.
2. **Plan.** Propose creations, updates, and retirements. Each action targets a single policy.
3. **Deliver.** The execution layer invokes the relevant APIs, verifies each policy’s actual-after state, and records the result.

A typical policy-run plan has tens to hundreds of actions. The evidence packet contains the full snapshot of every policy after delivery.

## Conflict resolution

When two profiles target the same device with conflicting settings, the platform applies a documented precedence. The framework enforces a **canonical precedence order** to keep conflicts predictable:

1. Enterprise baseline profiles
2. Division profiles
3. Department profiles
4. Role-scoped profiles
5. Device-specific profiles (emergency patches)

Conflicts that would violate this order are flagged at plan-validation time — the plan fails until the conflict is resolved.

For Conditional Access, a similar order is enforced, and policies that require at a broader scope while blocking at a narrower scope are prohibited (a pattern that produces user lockouts that are hard to debug).

## Break-glass carve-outs

Every Conditional Access policy library includes a standard carve-out pattern for a small number of emergency administrative accounts that are explicitly excluded from block-class policies. The accounts are stored in a privileged-access vault, used only in documented emergencies, and audited on a schedule.

Break-glass carve-outs are not backdoors. They are documented, monitored, reviewed, and revoked on a schedule. Every use opens an incident ticket.

## Testing

Policy changes are tested in four places before reaching production:

1. **Schema and boundary validation** at plan validation.
2. **Simulated tenant** — the proposed policy is applied to a simulated tenant; tests assert the expected effects.
3. **Pilot group** — a pilot group receives the policy first for a defined period; the drift engine watches.
4. **Production rollout** — general availability follows a clean pilot with zero drift findings.

No policy reaches production without all four. The pipeline enforces this; policies that skip stages are rejected.

## Retiring legacy Group Policy Objects

The end state: every user account is device-management-managed, every server is hybrid-projected, every Conditional Access policy is attribute-scoped. Legacy Group Policy Objects can then be retired.

Retirement proceeds in phases:

- **Phase 1.** Every Group Policy Object flagged as migrated has its link removed from the legacy organizational unit (the settings are now delivered by modern policy).
- **Phase 2.** Unlinked Group Policy Objects are marked deprecated and kept for a defined window (for example, ninety days) as a rollback window.
- **Phase 3.** After the window with zero drift findings in the modern surface, Group Policy Objects are deleted via a governed deprecation change.

The last Group Policy Object to go is typically a password-policy object that legacy Kerberos-bound applications depend on. That object retires only when the compute migration is complete.

## Verification

Policy migration passes when:

- Every configuration profile, compliance policy, Conditional Access policy, and hybrid guest configuration derives from a canonical manifest in the repository.
- Every manifest targets attribute-scoped dynamic groups (no manually curated groups).
- The legacy forest has zero linked Group Policy Objects other than deprecated ones within the rollback window.
- Drift detection reports zero findings for every policy.
- The nightly assessment-to-plan run produces a zero-action plan for the policy tree.

---

**Previous:** [Chapter 04 — Identity Transformation](04-identity-transformation.md)  
**Next:** [Chapter 06 — Services: DNS, DHCP, IPAM](06-network-services.md)
