# Verification — Chapter 06, Credentials, Least Privilege and Access Policy for AI

Checked October 21–22, 2026 by writer W3. No source page was assigned to this chapter; the brief lists it as new research. Microsoft facts from Microsoft Learn via the MCP search and fetch tools and direct downloads of the Learn pages (parsed locally). CISA facts from the BOD 25-01 required configurations page on cisa.gov and the ScubaGear repository (main branch `aad.md`, and the same file at tag v1.8.0; release date from the GitHub releases API). NIST control text from the SP 800-53 release 5.2.0 OSCAL catalog. MCP facts from modelcontextprotocol.io (current version 2026-07-28, after confirming `/specification/latest` redirects there). AWS fact from the AgentCore developer guide. No code in this chapter. No personal data was sent to any site; downloads used a generic User-Agent.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Agent identities don't use passwords/MFA methods; govern with Conditional Access | Opening | verified | Learn, Agent 365 identity |
| 2 | Workload identities can't do MFA, often lack lifecycle, must store credentials | Opening | verified | Learn, Microsoft Entra Conditional Access for workload identities |
| 3 | Blueprint holds credentials and impersonates agent identities; agent identity holds permissions and is the logged client | No stored secrets | verified | Learn, Agent identities, service principals, and applications |
| 4 | Supported blueprint credentials; shared credential = credential boundary | Same | verified | Learn, Agent 365 identity |
| 5 | Blueprint credential compromise affects all its agent identities | Same | verified | Learn, Agent identities, service principals, and applications |
| 6 | Managed identity as FIC recommended for production; needs Azure compute; secrets not recommended for production | Credential order | verified | Learn, Create an agent identity blueprint |
| 7 | Third-party agents: Auth SDK sidecar or federation (Bedrock, n8n) | Credential order | verified | Learn, Integrate third-party agents with Agent ID |
| 8 | Key Vault/HSM; rotate certificates at least annually; rotate secrets out before go-live; isolate per blueprint/environment; check sign-in logs | Credential order | verified | Learn, Best practices for Agent ID |
| 9 | Tenant credential lifecycle policies can restrict blueprint secret lifetime | Enforcing the order | verified | Learn, Create an agent identity blueprint (note on lifetime errors) |
| 10 | Program's 180-day cap and secret block apply to blueprints | Enforcing the order | restated-as-design | Program design, from Book 04 Ch05 |
| 11 | SCuBA MS.AAD.5.5v1–5.7v1 (SHOULD; block passwords; 180-day passwords; 365-day certs; last modified April 2026) in development text | Enforcing the order | verified (new) | ScubaGear main `aad.md` |
| 12 | Not in v1.8.0 (May 7, 2026), whose section 5 has 5.1–5.3 only; not BOD 25-01 required | Same | verified (new) | ScubaGear tag v1.8.0; cisa.gov required configurations |
| 13 | API-key access bypasses Entra and Conditional Access | Outside Entra | verified | Learn, Conditional Access for agents, Boundaries and limitations |
| 14 | Program rule on API keys | Same | restated-as-design | Program design |
| 15 | AWS AgentCore Identity implements agent identities as workload identities with credential management | Same | verified | AWS AgentCore developer guide. GovCloud availability not checked and not claimed |
| 16 | AC-6 text "users (or processes acting on behalf of users)"; AC-6(7), AC-6(9) | Least privilege; privileged roles | verified | OSCAL 5.2.0 catalog |
| 17 | Three access modes; subjects | Access mode table | verified | Learn, Agent 365 identity |
| 18 | Prefer OBO; app-only only as needed; avoid app perms where delegated suffice; user accounts only when needed | Access mode | verified | Learn, Best practices for Agent ID |
| 19 | Delegated can't exceed user; app permissions need explicit admin consent | Access mode | verified | Learn, Authorization in Agent ID |
| 20 | Agents' user accounts preview, Frontier program only | Access mode | verified | Learn, Agent 365 identity; matches Ch04 |
| 21 | Blocked roles (GA, PRA, User Admin), no role-assignable groups, blocked permission examples, list will change | What Microsoft blocks | verified | Learn, Authorization in Agent ID |
| 22 | Agent user account: no privileged admin roles, no role-assignable groups, custom roles allowed | Same | verified | Learn, agent's user account |
| 23 | Allowed roles include Exchange/SharePoint/Teams/Power Platform/Compliance Administrator and Global Reader | Same; privileged roles | verified | Learn, Authorization in Agent ID (allowed list) |
| 24 | Inheritable permissions: allAllowed/none, includes later grants, 50 resource apps, review and document | Inherited permissions | verified | Learn, Configure inheritable permissions for agent identity blueprints |
| 25 | Declaring on blueprint doesn't grant; admin must consent | Same | verified | Learn, Agent 365 identity |
| 26 | Blueprints can't hold Azure RBAC; assign per agent identity; resource-scoped example | Azure resources | verified | Learn, Agent identities/service principals; Authorization in Agent ID |
| 27 | App scopes or app roles for agents; SCIM doesn't provision SPs/agents; SAML needs agent user + helper | Azure resources and other APIs | verified | Learn, Manage assignment of agent identities to an application |
| 28 | BOD 25-01 MS.AAD.5.1–5.3 text as on cisa.gov ("Only administrators SHALL be allowed to consent…"), added 12/17/2024 | Admin consent | verified | cisa.gov required configurations |
| 29 | SCuBA document wording of 5.2v1 and its two options | Admin consent | verified | ScubaGear main `aad.md` |
| 30 | Users can create agent blueprints setting | Admin consent | verified | Learn, Create an agent identity blueprint |
| 31 | PRA least-privileged to grant Graph app permissions; Cloud App Admin/App Admin for delegated | Admin consent | verified | Same, Prerequisites |
| 32 | MCP server approval: Requests tab preview; approve then consent; AI Administrator or Global Administrator | Admin consent; tools | verified | Learn, Manage plugins, skills, and MCP servers |
| 33 | Separate policy per token subject; table of patterns, targets, controls | Conditional Access | verified | Learn, Conditional Access for agents; Target agents in CA policies; CA Grant |
| 34 | CA boundaries (blueprint creation token, token exchange endpoint, security defaults, API keys, group scoping of agent users, blueprint policy not reaching agent user) | Conditional Access | verified | Learn, Conditional Access for agents |
| 35 | Recommended Block-all-except-approved pattern via attributes, report-only | Conditional Access | verified | Learn, Secure autonomous agents with Conditional Access |
| 36 | Program keeps it report-only until the preview label is removed | Same | restated-as-design | Program design, consistent with Book 04's rule |
| 37 | Review broad user policies for effect on agents | Same | verified | Learn, Best practices for Agent ID |
| 38 | Licensing: E7 or Agent 365 + P1/E3; risk policies need P2/E5 | Conditional Access | verified | Learn, Conditional Access for agents; Secure autonomous agents |
| 39 | **Status of Book 04 Ch03 statement** | Status note | verified (Book 04 still accurate) | Learn, Target agents in CA policies: assignment labeled "Users, agents (Preview) or workload identities"; agent users, Agent risk, Agent execution environments preview; CA Grant: agent identities Block only. First draft wrongly said agent-identity targeting was no longer labeled preview (based on the autonomous-agents page); corrected after comparing with Ch04 and re-reading the targeting page |
| 40 | Agent ID platform GA April 2026; CA for agent user accounts extended protections public preview June 2026 | Status note | verified | Entra What's new, month headings checked by HTML position |
| 41 | ID Protection for agents: detection list, offline, learning mode, OBO attribution to user, 90-day retention, actions | ID Protection | verified | Learn, ID Protection for agents |
| 42 | Agent risk preview; P2 during preview; Agent 365 "starting soon" | ID Protection | verified | Learn, Secure autonomous agents; Manage agent identities in your organization; ID Protection for agents |
| 43 | Risky-agent alerts to sponsor | ID Protection | restated-as-design | Program design |
| 44 | Workload identity CA limits; Workload ID Premium | Workload identities | verified | Learn, CA for workload identities; Workload ID FAQ |
| 45 | No standing privileged role for AI; order of three paths | Privileged roles | restated-as-design | Program design |
| 46 | M365 Admin agent honors admin's existing Entra role assignments | Privileged roles | verified | Learn, Use Microsoft 365 Admin agent |
| 47 | Access packages can grant Entra roles to agents; agent can request programmatically; human approvers; end date | Privileged roles | verified | Learn, Governing agent identities |
| 48 | Entra roles in access packages preview | Privileged roles | verified | Licensing fundamentals table ("EM – Microsoft Entra Roles (Preview)") |
| 49 | PIM assigns roles to users, groups, service principals, managed identities; eligible/active; start/end dates | Privileged roles | verified | Learn, What is PIM, Role assignment overview |
| 50 | Tools defined; each needs security/permission care | Tool boundaries | verified | Learn, What are agent identities |
| 51 | CA evaluates subject and audience | Layer 1 | verified | Learn, Conditional Access for agents |
| 52 | MCP: authorization optional; HTTP SHOULD conform; STDIO SHOULD NOT and uses environment credentials; resource server; audience validation; no token passthrough | Layer 1 | verified | MCP specification 2026-07-28, Authorization |
| 53 | Tools registry is source of truth; BYO registration | Layer 2 | verified | Learn, Understand MCP server options in Agent 365 |
| 54 | Tenant-wide tool control available in GCC | Layer 2 | verified | Agent 365 service description |
| 55 | APIM integration preview; Tools Gateway preview | Layer 2 | verified | Learn, Govern tools with Agent 365 and APIM (preview); Manage Tools Gateway |
| 56 | Purview labels/DLP/insider risk for agents, network controls, Defender tool-invocation blocking not available in GCC | Layer 3 | verified | Agent 365 service description |
| 57 | Three-boundary model and table | Tool boundaries | restated-as-design | Program design |
| 58 | Release-stage table rows | Release stage | verified | Rows cite the sources above; general Agent ID rows removed in favor of a link to Chapter 04 per editor note; overlapping facts match Ch04 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| (none assigned) | — | The brief assigns this chapter no source page; all content is new research. The four source pages feed Chapters 01–03, 07, 09 and 10. |

## Notes for the editor

- **Book 04 Ch03 line 50** ("Those targets are in preview… agent identities support only Block") — still accurate on Oct 22, 2026, per the policy builder label; Chapter 06 says so in a status note matching Chapter 04's note. Microsoft's autonomous-agents page omits the preview label, so the labeling is inconsistent across Learn pages.
- **Book 04 Ch05 / Book 15 Ch06 wording of MS.AAD.5.2v1** — both quote the SCuBA document wording ("User consent to applications SHALL be restricted"); the cisa.gov BOD 25-01 required-configurations page words it "Only administrators SHALL be allowed to consent to applications." Not wrong, but the two CISA texts differ; Chapter 06 cites both.
- **New SCuBA drafts** MS.AAD.5.5v1–5.7v1 exist on the ScubaGear main branch (April 2026) but not in release v1.8.0 or BOD 25-01; no published chapter mentions them yet.
- **Diagram overlap** — a draft `ch06-token-subject` duplicated W2's `ch04-whose-token`; it was deleted (renderer removed its outputs) and Chapter 06 links Chapter 04's figure instead.

## Additions, October 23, 2026 (certificates and the CLM platform)

At the user's request, every certificate-dependent book maps its certificates to Book 07 and the CLM platform. Source: the certificate-touchpoints research brief (program working file), Book 07 Ch04/Ch05/Ch07/Ch08 and CyberArk 26.1 documentation (accessed Oct 23, 2026).

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Certificates section: class, issuer and renewal engine per certificate | Certificates in this book and the CLM platform | restated-as-design (Book 07's classes applied); items marked inference are labeled | Book 07 Ch04, Ch05 |
| 2 | CyberArk mechanism (drivers) | Same section | verified (noted) | CyberArk 26.1 docs, note clm-drivers |

## Re-base on ScubaGear 2.0.0, October 26, 2026

ScubaGear 2.0.0 was released October 22, 2026 (weekly source watch, issue #160). Footnotes that cited ScubaGear v1.8.0 were re-checked against tag `v2.0.0` (raw files from GitHub, compared with the same files at `v1.8.0`), the v2.0.0 release notes and CISA's BOD 25-01 Required Configurations page, all read October 26, 2026. No personal data was sent to any site; downloads used a generic User-Agent.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | MS.AAD.5.5v1–5.7v1 released in ScubaGear 2.0.0 (Oct 22, 2026); SHOULD; April 2026; no BOD 25-01 indicator; not on CISA's page (supersedes row 12 and the "New SCuBA drafts" note) | Enforcing the order | verified (updated) | v2.0.0 `aad.md`; v2.0.0 release notes; Required Configurations page |
| 2 | v1.8.0 section 5 had only 5.1–5.3 | Enforcing the order | verified | v1.8.0 `aad.md` |
| 3 | MS.AAD.9.1v1 "Risky AI agents SHALL be blocked": CA policy, all agent identities, all resources, agent risk High, block; P2 plus Agent 365 or M365 E7; BOD 25-01 indicator; last modified March 2026 | Enforcing the order | verified (new) | v2.0.0 `aad.md` section 9; v2.0.0 release notes |
| 4 | MS.AAD.9.1v1 not on CISA's Required Configurations page on Oct 26, 2026 | Same | verified | Required Configurations page (20 Entra IDs; no 9.1) |
| 5 | Program treats 9.1v1 as notice; records ScubaGear result per tenant; blocks when the agent risk condition is GA in the agency's cloud | Same | restated-as-design | Book 17 Ch04 position (preview capabilities are watch items; agent risk condition in preview; GCC licensing and availability rows) |
| 6 | MS.AAD.5.2v1 wording and the two compliant options unchanged at v2.0.0 (`c06-scuba-main` renamed `c06-scuba-v2` and pinned to the tag) | Admin consent | verified | v2.0.0 `aad.md` |

## November 9, 2026: Learn citations and Global Secure Access for AI

Learn coverage pass (citations for pages the coverage map marked covered-uncited) and a small addition from the Learn gap review: Global Secure Access controls for generative AI. All pages read November 9, 2026 with the Microsoft Learn MCP tools; no personal data sent to any site.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| L1 | Sidecar is a container beside the agent; acquires and caches tokens through client credentials or FIC (autonomous) and OBO (user context); no host port | No stored secrets, item 2 | verified | Learn, "Authentication with Microsoft Entra ID Auth SDK (sidecar)" |
| L2 | Three agent modes: on behalf of a user, autonomous through the agent identity's service principal, agent's user account | Choose the access mode first | verified | Learn, "Authentication protocols in agents" |
| L3 | Inherited permissions aren't visible on agent identities in the admin center or Graph; only in the token at runtime | Inherited permissions | verified | Learn, "Inheritable permissions and required resource access in Microsoft Entra Agent ID" |
| L4 | MCP server validates signature, issuer, tenant, audience, expiry on every request before any tool runs, then roles/scopes; use tested libraries | Layer 1 | verified | Learn, "Secure a Model Context Protocol (MCP) server with Microsoft Entra ID" |
| L5 | Prompt injection protection: blocks adversarial prompts and jailbreaks; preconfigured models incl. ChatGPT, Claude, Gemini; custom JSON model by URL and JSON path; Internet Access license, TLS inspection, client on Entra joined/hybrid joined Windows; text only, 64,000 characters | Network edge | verified; page not labeled preview | Learn, "Protect enterprise generative AI applications with prompt injection protection" |
| L6 | MCP firewall (preview): remote MCP servers; allow/block servers, tools, resources, prompts, methods, transports, versions; default-Block-with-allow-list example; TLS inspection required; stdio/local servers and JSON-RPC batches not inspected | Network edge | verified | Learn, "Configure Global Secure Access MCP firewall to secure MCP traffic (preview)" |
| L7 | Secure Web and AI Gateway: Copilot Studio agent traffic (HTTP node, custom connectors, MCP server connector) forwarded per Power Platform environment; web content, threat intelligence and file filtering; requires Agent 365 | Network edge | verified; page not labeled preview | Learn, "Learn about Secure Web And AI Gateway for Microsoft Copilot Studio agents" |
| L8 | Global Secure Access available in GCC | Network edge; release table | verified | Learn, "Known limitations for Global Secure Access" |
| L9 | Default-Block MCP posture from the identity records; block event as drift signal; GCC consequences | Network edge | restated-as-design | Program design from L6, L8 and the Agent 365 service description |

Learn pages left uncited but listed for this chapter in the coverage map: the individual agent OAuth flow pages, the sidecar setup and local-development pages, control-user-access, grant-agent-access-microsoft-365, manage-owners-sponsors, manage-agents-without-identity, the Bedrock and n8n pages and fundamentals/zero-trust-ai (topic-level matches; the chapter cites the more specific pages).

## Zero Trust Assessment closure additions (Nov 11, 2026)

Added for the Zero Trust Assessment closure update (B17-01). Each row uses the verification-log row from [Book 00, Appendix D](../../b00-orientation/appendix-d-control-states-and-evidence.md#block-verification-row). Learn pages were read on the date shown; `ms.date` wasn't exposed by the fetch tool, so the read date is the date recorded.

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| Z1 | Disable an agent identity or blueprint (object kept, tokens stopped); three tenant-wide block policies, report-only first, P1; consequences; audit logging under base identity types | The kill switch | verified | Learn, Disable agent identities in your tenant | Nov 11, 2026 |
| Z2 | PATCH servicePrincipals/{id}/microsoft.graph.agentIdentity; AgentIdentity.EnableDisable.All; Agent ID Administrator | The kill switch | verified | Learn, Graph Update agentIdentity; agentIdentity resource type | Nov 11, 2026 |
| Z3 | Per-agent control table; who may pull the switch; yearly disable test | Workload-identity controls per agent | restated-as-design | Program design from Chapters 04-07 and Book 04 Chapter 05 | Nov 11, 2026 |
| Z4 | M-25-21 fail-safe "when practicable" | Authority label | verified (carried from Chapter 02's verified reading) | Chapter 02 verification log | Nov 11, 2026 |

## Zero Trust closure, Phase 4, November 11, 2026 (implementation conventions)

Follow-up: the agent-credential section's Applies line now links Book 04's governed consent process and tenant-creation restriction for AI systems governed as workload identities, where an Agent ID feature isn't available in GCC.
