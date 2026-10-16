# Entra Security Baseline — A Federal AD-to-Entra Crosswalk

**Microsoft’s Secure Future Initiative / Zero Trust configure-security checklist, scored for a government-cloud agency with 20+ years of Active Directory**

## 1. The assessment in one paragraph

A 20-year Active Directory agency on a government cloud can implement a meaningful slice of the baseline quickly — the consent/guest/logging/break-glass/legacy-auth/privileged-identity cluster is mostly already licensed and config-only. But three filters knock out or defer roughly a third of the checklist before any work starts: the entire “Protect networks” theme depends on a capability that is unavailable or non-FIPS in government clouds; the AI theme is nascent and unconfirmed; and the heaviest identity controls (managed-device sign-in, token protection, org-wide phishing-resistant auth, cloud authentication) are gated on device, device-management, and federation modernization that two decades of Active Directory make a multi-quarter program rather than a toggle. The agency’s one structural advantage is certificate-based authentication (PIV/CAC), which turns several phishing-resistant controls into accelerators.

## 2. The three filters

### Filter 1 — Government-cloud eligibility
| Theme | Reality |
|-------|---------|
| Protect identities & secrets | Almost entirely available |
| Protect tenants | Available |
| Protect networks | Gated or non-FIPS in government clouds. Treat as evaluate, not quick win. |
| Protect engineering systems | Available |
| Monitor & detect | Available, except network-log checks that depend on the gated capability |
| Accelerate response | Available (confirm entitlement) |
| AI | Nascent; government availability unconfirmed — defer |

### Filter 2 — Licensing
Federal agencies typically run a suite that includes the identity governance features. The constraint is operational, not entitlement, for the majority of controls. Separate SKUs for network-access features collide with Filter 1.

### Filter 3 — 20-year Active Directory friction
The same control can be a 10-minute toggle or a 9-month program depending on the hybrid estate (directory sync, federation, basic-auth applications, decades of service accounts, domain-joined devices, on-premises Group Policy password policy). The friction column names that entanglement; the effort tier prices it.

## 3. How to read the crosswalk

**Government-cloud availability**
- Available today
- Available but caveated
- Not available or only via non-FIPS path

**Active Directory friction**
- Cloud-only — no on-premises entanglement
- Hybrid-touching — coordinate with sync / devices / users
- Legacy-blocking — gated on retiring or modernizing a 20-year dependency

**Effort tier**
- T0 — This week. Tenant toggle, no legacy dependency.
- T1 — Quick (days). Config is fast; discovery / coordination / rollout is the work.
- T2 — Weeks. Inventory + remediation, or staged rollout.
- T3 — Multi-quarter program. Gated on device / identity / federation modernization.

## 4. Illustrative controls — Protect identities and secrets

| Control | Friction | Tier |
|---------|----------|------|
| User consent settings restricted | Cloud-only | T0 |
| Admin consent workflow enabled | Cloud-only | T0 |
| Block legacy authentication policy | Legacy-blocking | T1 (report-only first) |
| Privileged accounts have phishing-resistant methods | Hybrid-touching (certificate-based auth accelerates) | T1→T2 |
| All privileged role assignments are just-in-time | Hybrid-touching | T2 |
| Privileged accounts are cloud-native identities | Legacy-blocking | T2→T3 |
| Use cloud authentication | Legacy-blocking (federation migration) | T3 |
| All sign-in activity from managed devices | Legacy-blocking (device-management maturity) | T3 |
| Token protection policies | Legacy-blocking (device join maturity) | T3 |

## 5. Sequencing implication

Start with the T0/T1 cloud-only controls (consent, guest restrictions, break-glass, logging, legacy-auth report-only). Treat network-protection and AI themes as gated evaluations. Treat device-dependent and federation-dependent controls as multi-quarter programs that consume the attribute and device-modernization workstreams already described elsewhere in this workbook.

---

*Cleaned extraction for project use. No internal branding or document identifiers. This is a pedagogical planning artifact, not a runbook. Verify government-cloud availability against current vendor documentation before sequencing.*
