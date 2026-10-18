# Chapter 00 — The Problem Nobody Talks About

**Active Directory was never just an identity store. It was the implicit governance model.**

## The thesis

Active Directory was never just an identity store. It was the **implicit governance model** for every network service an organization ran. When teams migrate “AD to Entra ID” and treat the project as users and groups, they retire the directory and silently break the governance. Most of the failures do not show up for months.

This series is about not doing that.

![Silent Dependencies](../images/cshc/silent-dependencies.svg)

## What was sold in 1999

When Microsoft shipped Active Directory with Windows 2000, it was presented as an identity directory — a modern, replicated, Kerberos-anchored replacement for NT domains. That framing was true but incomplete.

Over the next twenty-five years, every Windows-era infrastructure service quietly wired itself into AD. Not because of a single grand design, but because AD was the only enterprise-wide, governed, authenticated, replicated namespace the Windows ecosystem had. If you needed to know what a server was called, where it lived in the organization, who was allowed to manage it, which certificates it should trust, which DHCP scope applied to it, which policies configured it, and which accounts had which service principal names bound to it — AD held every one of those answers.

By the time a forest was ten years old, it had become the single most load-bearing piece of governance infrastructure the organization owned. It was just never written down anywhere as “our governance model.”

## What breaks when AD goes away

Microsoft has not deprecated Active Directory Domain Services; it remains a supported role in Windows Server 2025. What has changed is where Microsoft invests and what it recommends: a cloud-first identity model in which Entra ID becomes the source of authority and on-premises AD is minimized. In that model Entra ID takes over from AD DS as the primary directory, Intune takes over from Group Policy, Conditional Access takes over from the network perimeter, Azure Arc extends cloud management to on-premises hosts, Entra certificate-based authentication takes over from AD CS-anchored smart-card logon, and Azure private DNS and private resolvers take over from AD-integrated DNS zones. Retiring AD is therefore an organizational decision, not a vendor deadline.

Every one of those substitutions is a valid target. But the tools arrived without a framework. The result is that when user objects are migrated into a flat directory and victory is declared, eleven categories of infrastructure object that AD was silently governing are left behind:

| # | Object Type | What AD Was Doing | What Breaks Without Governance |
|---|-------------|-------------------|-------------------------------|
| 1 | **Users** | Identity lifecycle, OU placement, attribute authority | Orphaned accounts, privilege drift, compliance gaps |
| 2 | **Computers** | Domain join, GPO targeting, machine certificates | Unmanaged endpoints, missing patches, security exposure |
| 3 | **Service Accounts** | SPNs, Kerberos delegation, password management | Application authentication failures, silent service outages |
| 4 | **Security Groups** | Access control, policy scoping, resource permissions | Permission sprawl, ungoverned access, audit failures |
| 5 | **Group Policy Objects** | Device configuration, security baselines, software deployment | Configuration drift, inconsistent baselines, compliance gaps |
| 6 | **DNS / DHCP** | Name resolution, IP allocation, AD-integrated zones | Name resolution failures, IP conflicts, split-brain DNS |
| 7 | **PKI / Certificate Services** | Certificate issuance, auto-enrollment, CRL distribution | Silent certificate expiration, authentication failures, mTLS breaks |
| 8 | **RADIUS / NPS** | 802.1X network access, VPN authentication, Wi-Fi auth | Network access failures, VPN outages, unauthorized access |
| 9 | **LDAP** | Application authentication, directory queries, legacy integrations | Application login failures, directory query errors, broken integrations |
| 10 | **SPNs / App Registrations** | Kerberos service principal names, application identity | Application SSO breaks, delegation failures, service identity loss |
| 11 | **Trust Relationships** | Cross-domain authentication, forest trusts, selective authentication | Cross-domain access failures, authentication breaks between organizations |

### Silent failure is the real enemy

Most of these failures do not throw clear errors. A certificate does not renew because the enrollment policy was never re-pointed. A network access policy does not authorize a new device because the group lookup returns empty. An LDAP-bound application silently stops querying because the bind account was decommissioned. There is no log line that says “governance has failed.” There is only a long tail of untraceable outages and an audit that finds the organization cannot prove what it should have been doing.

## The OU tree was the governance tree

AD’s Organizational Unit tree was not a folder system. It was a **delegation graph, a policy inheritance engine, an operational boundary, and a security scope — all in one hierarchical structure**.

Placing a user in an OU simultaneously:
- Assigned management to the delegated administrators of that branch.
- Inherited every policy that applied along the path.
- Scoped the user to groups that used container-based rules.
- Bound the user’s identity to the delegation authority of that branch.
- Stated an operational responsibility boundary for audit purposes.

A flat cloud directory has none of this by default. Dynamic groups, administrative units, and Conditional Access are powerful tools, but they do not automatically reconstruct the governance model the OU tree was providing. That reconstruction must be made explicit: organizational position expressed through attributes, dynamic groups that materialize structure, administrative units that scope delegation, and Conditional Access that enforces policy. The result can be equivalent to — and in several ways cleaner than — what AD provided.

## Why naïve migrations fail

Almost every “AD to Entra ID” project has been scoped around users, groups, and mailboxes. That is the visible part of the work. The larger, invisible part is the eleven categories above.

A successful modernization must:

1. **Enumerate the hidden dependencies** before anything is retired.
2. **Map each dependency to a modern target** — not always one-to-one.
3. **Preserve governance continuity** during the transition (no gaps where nobody owns the delegation).
4. **Deliver the transformed data** into the target surface through a deterministic, governed pipeline — not a series of one-off administrative actions.
5. **Detect drift** between what the plan said should exist and what actually exists, continuously.

Organizations do not fail at enumeration because they cannot list objects. They fail because no one treats steps 1–5 as a discipline. They fail at the conceptual level: the idea that the project is just users and groups.

## What the framework provides

The modernization framework treats all eleven categories as a single governed surface, with one transformation approach, one authoritative source of intended state, one evidentiary pipeline, and one drift detector. It sits above the Microsoft (and third-party) tools and orchestrates them into a coherent governance model.

A practical platform host can run:
- Version control as the canonical source of governance artifacts (plans, policies, group rules).
- An HTTPS reverse proxy and certificate terminator.
- Kerberos and enterprise PKI bridges that allow the host to talk to the legacy forest it is migrating away from.
- Automation (PowerShell, Python, APIs) that reads the Client/Server estate, computes transformation plans, validates them against the intended state, and delivers them into the Hybrid-Cloud target surface.

The target surface includes Entra ID, administrative units, Intune, Azure Arc, IP address management, DNS, DHCP, SASE, Zero Trust, MFA, certificate-based authentication, and the adapters that connect them.

## What this series covers

| Chapter | Covers |
|---------|--------|
| 00a | Applicability and scope. Which clouds and environments the target state assumes. |
| 01 | The platform host. What runs on it and why. |
| 02 | Analyzing the legacy estate. Forest discovery, GPO inventory, DNS/DHCP, Kerberos, certificate services. |
| 03 | The engine. Turning analysis into a plan and a plan into delivered state. |
| 04 | Identity. Attribute-driven structure, dynamic groups, administrative units. The OU-tree replacement. |
| 05 | Policy. GPO retirement. Intune compliance. Conditional Access. |
| 06 | Services. DNS, DHCP, and IP address management in the hybrid model. |
| 07 | Compute. Device transformation. Domain-joined to cloud identity + device management + Arc. |
| 08 | Access plane. MFA, Zero Trust, SASE, certificate-based authentication. |
| 09 | Roadmap. Phased plan, gates, rollback, cutover. |
| 10 | Leadership takeaway. Instruments versus orchestra. |

## The bottom line

AD retirement is not a migration project. It is a **governance transformation**. The hard part is not the API calls; it is the framework that decides what the target state looks like, how to prove it is right, and how to keep it right. This series describes that framework.

---

**Next:** [Applicability and scope](00a-applicability.md) · [Chapter 01 — Platform Foundation](01-platform-foundation.md)
