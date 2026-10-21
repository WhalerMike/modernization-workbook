# Verification — Chapter 05, Owners, Sponsors and the AI Identity Lifecycle

Checked October 21–22, 2026 by writer W3. No source page was assigned to this chapter; the brief lists it as new research on Microsoft Entra workload and agent identities. Microsoft facts from Microsoft Learn via the MCP search and fetch tools and direct downloads of the Learn pages (parsed locally), including the Entra "What's new" page, whose month headings were re-checked by HTML position after the editor's note (sponsor lifecycle GA is under **May 2026**, not June as first written). Graph API facts from the Graph v1.0 reference pages. Book cross-references checked against the published B03, B04 and B15 chapters and W2's Chapter 04 draft. The PowerShell example uses only `Connect-MgGraph` and `Invoke-MgGraphRequest` against the documented `GET /servicePrincipals/microsoft.graph.agentIdentity` endpoint; it wasn't run. No personal data was sent to any site; downloads used a generic User-Agent.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Copilot Studio agent gets an agent identity; creator recorded as sponsor | Opening | verified | Learn, What are agent identities |
| 2 | Foundry provisions a default blueprint and identity per project; agents share it until published | Opening; Creation | verified | Learn, Governing agent identities |
| 3 | Agents created dynamically, may exist minutes or be created thousands of times a day | Opening | verified | Learn, What are agent identities |
| 4 | Lifecycle anchored in an HR-mastered human and an inventory record | Opening | restated-as-design | Program position (brief's argument) |
| 5 | Owner / sponsor / manager definitions, who can hold each, rights, limits (100 sponsors, max 5 groups), group types allowed | Three relationships table | verified | Learn, Administrative relationships in Agent ID |
| 6 | Sponsor can disable/soft-delete, can't re-enable or restore | Three relationships | verified | Same |
| 7 | Agent user account sponsors: no modify rights, max 5, not required; use same sponsor on both | Three relationships | verified | Same |
| 8 | Creation defaults: delegated caller becomes sponsor unless others named; admins not auto; app-only must name sponsor | What creation sets | verified | Same |
| 9 | Blueprint creator becomes owner of blueprint and principal; owners create identities without Agent ID role | What creation sets | verified | Learn, Create an agent identity blueprint |
| 10 | Program rule: federal-employee sponsor, dynamic-group cosponsor, separate owner, inventory match, admins sponsor nothing | Program's rule | restated-as-design | Program design; builds on #5 |
| 11 | Service principals can be owners for automated management | Program's rule | verified | Learn, Administrative relationships |
| 12 | Blueprint has `serviceManagementReference` | Program's rule | verified | Graph, agentIdentityBlueprint resource type |
| 13 | Earlier Copilot Studio / Foundry agents used standard service principals, shown alongside agent identities | Agents that aren't agent identities | verified | Learn, Agent identities, service principals, and applications |
| 14 | Microsoft: don't register an app for an agent (no sponsor, no agent audit, no blueprint lifecycle) | Same | verified | Learn, Plan your agent identity architecture |
| 15 | Migration guidance exists for app registrations and Copilot Studio agents | Same | verified | Learn, What's new in Agent ID |
| 16 | Lifecycle table: event mapping | Lifecycle table | restated-as-design | Program design; platform column cites #5, #18–#26 |
| 17 | Best practices: plan blueprints, unique identity per instance, sponsor+owner at creation, metadata, production handshake | Creation | verified | Learn, Best practices for Agent ID |
| 18 | Tenant setting "Users can create agent blueprints"; otherwise Agent ID Developer/Administrator | Creation | verified | Learn, Create an agent identity blueprint |
| 19 | Access package policy option "For users, service principals, and agent identities…/All agents"; resources: groups, API permissions, Entra roles | Creation | verified | Learn, Governing agent identities |
| 20 | Three request pathways (agent, sponsor/owner, admin); My Access US Gov domain myaccess.microsoft.us | Creation | verified | Learn, Access packages for agent identities |
| 21 | Sponsor leaving → sponsorship transfers to manager | Sponsor moves or leaves | verified | Learn, Governing agent identities |
| 22 | Three LCW tasks; mover/leaver only | Same | verified | Learn, Agent identity sponsor tasks in Lifecycle Workflows |
| 23 | Two LCW templates for sponsor leaving / role change | Same | verified | Learn, Lifecycle Workflows templates and categories |
| 24 | Sponsorship lifecycle with LCW GA **May 2026** | Same; table; limits | corrected | Entra What's new: first written as June from a month heuristic; re-checked by HTML heading position (item sits under "May 2026"), per editor note; matches Ch04 |
| 25 | Ten-business-day confirmation grace period; dynamic-group cosponsor for reorganization; change of purpose = new request | Mover; Reorganization; Purpose | restated-as-design | Program design |
| 26 | Expiry notifications to sponsor; extension may trigger new approval; no action → expires | Recertification | verified | Learn, Access packages for agent identities; Governing agent identities |
| 27 | Microsoft recommends access reviews including agents, sponsor attestation every 6–12 months, quarterly orphan review | Recertification | verified | Learn, Best practices for Agent ID |
| 28 | Human-oriented governance processes can wrongly remove access from agents run as users | Recertification | verified | Learn, Plan your agent identity architecture |
| 29 | Disable vs delete; cascade soft delete; 30-day restore; restore-before-cleanup nuance; async with "Delete Agent Identities Task" actor; quota; 250 per blueprint (app-only) | Retirement; Orphaned | verified | Learn, Agent identity deletion |
| 30 | Orphan definition and response (disable at once, 30 days to resolve) | Orphaned | restated-as-design | Program design, adapted from Book 04 Ch06 orphan policy |
| 31 | Multi-select disable from All agent identities page | Orphaned | verified | Learn, Manage agent identities in your organization |
| 32 | List agentIdentity: `AgentIdentity.Read.All` least privileged; Agent ID Administrator for nonowners delegated; `$expand` supported; owners supports `$expand` | Script callout | verified | Graph, List agentIdentity objects; agentIdentity resource type |
| 33 | List sponsors: application `AgentIdentity.ReadWrite.All` only; delegated not supported | Script callout | verified | Graph, List agentIdentity sponsors |
| 34 | Agent ID platform GA April 2026; GCC partial; GCC High/DoD unpublished; Agent 365 FedRAMP High pending | Release stage (by reference to Ch04) | verified | Entra What's new (April 2026); Agent 365 service description; consistent with Ch04's table |
| 35 | Access packages for agents and sponsor lifecycle policies available in GCC | Release table | verified | Agent 365 service description, GCC column |
| 36 | Agent-specific governance licensing: E7, or Agent 365 with Entra ID P1 or M365 E3 | Release table | verified | Learn, Governing agent identities; Agent identity sponsor tasks; licensing table (Agent 365 and E7 columns) |
| 37 | Manage agents (My Account) announced preview Nov 2025; no GA found | Release table | verified | Entra What's new archive, November 2025 |
| 38 | Entra ID Governance for Government available in GCC, GCC High, DoD | Release table | verified | Learn, Entra ID Governance licensing fundamentals |
| 39 | Agent-specific governance rows marked for Agent 365 and E7, not Entra ID Governance | Release section | verified | Same, feature-by-license table |
| 40 | "All Service principals" policy option for agents not using agent identities | Where features aren't available | verified | Learn, Governing agent identities |
| 41 | LCW custom extensions licensed under Entra ID Governance | Same | verified | Licensing fundamentals table |
| 42 | Responsibility matrix | Each party | restated-as-design | Program design |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| (none assigned) | — | The brief assigns this chapter no source page; all content is new research. The four source pages (`ai-identity-governance/index.md`, `central-deployment.md`, `governed-path.md`, the submission-readiness whitepaper) feed Chapters 01–03, 07, 09 and 10 and weren't carried here. |

## Notes for the editor

- **Book 04 Ch03 (line 50)** — the preview/Block-only statement still holds; see the Chapter 06 log. No stale line found in this chapter's scope.
- **Overlap with Chapter 04** — the general Agent ID availability table was removed from this chapter per the editor's note and replaced by a link to Chapter 04's "Release stage, licensing and government clouds" section; the remaining rows are lifecycle-specific and match Chapter 04 (GA months, GCC subset, licensing wording).
- **Not verified:** whether the automatic sponsor transfer to the manager happens without a configured workflow, or only through the "Transfer agent identity sponsorships to manager" task. Microsoft's pages describe both; the chapter states both and makes the program configure the workflow explicitly.
