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
| 44 | Workload identity CA limits; Workload ID Premium; gov via account manager; no gov trial | Workload identities | verified | Learn, CA for workload identities; Workload ID FAQ |
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
| 59 | App management policies in GCC High/DoD | Release table | unverifiable | No Microsoft page found stating it; cell says "Not stated on the pages checked; confirm in the tenant" |
| 60 | GCC High/DoD Graph and authority endpoints; configurable endpoints don't guarantee availability | Release stage | verified | Learn, Configure the Agent 365 CLI for US Government clouds |

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
