# Verification — Chapter 04, Kinds of AI Identity: Workloads, Agents and Delegated Access

Checked October 21, 2026 by writer W2. This chapter is new research; the brief assigns it no source page. Microsoft facts from Microsoft Learn via the MCP search and fetch tools; release stage and dates confirmed on the Entra "What's new" page (downloaded and parsed for month headings) and the Agent ID "What's new" page; GCC facts from the Agent 365 service description (GCC column) and the Agent 365 CLI page for US Government clouds. AWS facts from the AgentCore developer guide and the AWS GovCloud (US) User Guide page for AgentCore. Google facts from the Google Cloud IAM agent identity overview. Where a search result's text differed from the fetched page (the Agent ID overview's search snippet still carried a "currently in PREVIEW" banner; the fetched page doesn't), the fetched page and the Entra what's new GA announcement were used. No personal data was sent to any site.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Three token patterns: OBO (user subject, agent actor), app-only, agent user | Opening | verified | Learn, Conditional Access for agents |
| 2 | API key bypasses token issuance; CA doesn't apply | Opening | verified | Learn, Conditional Access for agents, Boundaries |
| 3 | Workload identities = applications, service principals, managed identities | Workload identities | verified | Learn, managed identities overview |
| 4 | Earlier Copilot Studio / AI Foundry agents may be classic service principals, tagged, no agent identity | Workload identities | verified | Learn, Disable agent identities |
| 5 | System-assigned vs user-assigned; user-assigned recommended for Microsoft services | Managed identities | verified | Learn, managed identities overview |
| 6 | Managed identity as federated credential on an app; recommended when an app is required | Managed identities | verified | Learn, managed identities overview |
| 7 | WIF scenarios incl. AWS outbound federation, SPIFFE/SPIRE; exact issuer/subject/audience match; Entra-issued tokens not accepted | WIF | verified | Learn, Workload identity federation concepts |
| 8 | Credential order of preference | WIF | verified (settled) | Book 02 Ch09, Book 04 Ch05 |
| 9 | CA for workload IDs: single-tenant only; not SaaS/multitenant/MI; group assignment not enforced; block by location/risk/auth context; Premium to create/modify | Policy on workload identities | verified | Learn, Conditional Access for workload identities |
| 11 | App identities expect stability; agents dynamic, minutes, thousands per day (quote) | Agent identities | verified | Learn, What are agent identities |
| 12 | Agent ID platform GA April 2026; available to all Entra customers | Agent identities | verified | Learn, Entra what's new April 2026; Agent ID overview |
| 13 | Four object types | Object model | verified | Learn, Governing agent identities |
| 14 | Blueprint holds FIC/cert/secret, inheritable permissions, app roles, publisher; can federate to MI | Object model | verified | Learn, Agent 365 identity; Agent identity blueprints |
| 15 | Blueprint principal acquires tokens, creates agent identities, appears in audit logs | Object model | verified | Learn, Agent ID design patterns |
| 16 | Agent identity = special SP, no own credentials, single-tenant; blueprints can be multitenant | Object model | verified | Learn, Agent identities; Agent 365 identity |
| 17 | Agent's user account optional, 1:1, immutable, authenticates only via agent identity token | Object model | verified | Learn, The agent's user account |
| 18 | Blueprint = credential boundary; one operation applies to all agents of the kind incl. later ones | Consequences | verified | Learn, Agent 365 identity; Agent identities; Conditional Access for agents |
| 19 | Declared permissions need consent; Azure RBAC not on blueprint; Entra built-in roles on agent identities | Consequences | verified | Learn, Agent 365 identity |
| 20 | Sponsor required at creation (users or supported groups); sponsor rights; owners optional; managers | Consequences | verified | Learn, Administrative relationships |
| 21 | Copilot Studio creator recorded as sponsor | Consequences | verified | Learn, What are agent identities |
| 22 | Copilot Studio auto-create setting labeled preview; Foundry default shared project identity until published; App Service/Functions; CA optimization agent | Which products | verified | Learn, Governing agent identities; What are agent identities |
| 23 | Non-Microsoft agents (Bedrock, n8n) via sidecar or WIF | Which products | verified | Learn, Agent ID overview |
| 24 | Entra agent registry blades retirement announced March 2026 for May 1, 2026; Agent 365 single registry | Which products | verified | Learn, Entra what's new March 2026 |
| 25 | Separate policy per token subject | Delegated and autonomous | verified | Learn, Conditional Access for agents |
| 26 | Delegated-access table rows (subject, targeting, Block-only, agent risk preview, agent users preview, All users excludes agent users, compliant device grant) | Delegated and autonomous | verified | Learn, CA for agents; Target agent identities; CA Grant |
| 27 | OBO risk attributed to user | Delegated and autonomous | verified | Learn, ID Protection for agents |
| 28 | OBO limits agent to what user consented to and can access | Delegated and autonomous | verified | Learn, Agent identity concepts in Microsoft Foundry |
| 29 | Agent identities don't use MFA; govern with CA | Delegated and autonomous | verified | Learn, Agent 365 identity |
| 30 | Agent user can hold mailbox/licenses, join groups and AUs; not targetable by group membership | Delegated and autonomous | verified | Learn, CA for agents |
| 31 | Logs distinguish blueprint, agent identity, agent user | Delegated and autonomous | verified | Learn, Agent 365 identity |
| 32 | Licensing: CA and ID Governance for agents need E7 or Agent 365 + P1/E3; ID Protection "starting soon" Agent 365 | Release-stage table | verified | Learn, CA for agents; Governing agent identities; ID Protection for agents |
| 33 | Agent risk detections offline | Release-stage table | verified | Learn, ID Protection for agents |
| 34 | Sponsor lifecycle workflows GA May 2026 | Release-stage table | verified | Learn, Entra what's new May 2026 (month heading confirmed in page HTML) |
| 35 | Agent 365 GCC column: listed yes and no rows | Government clouds | verified | Learn, Agent 365 service description |
| 36 | Agent 365 meets FedRAMP High controls reviewed by assessor as of Oct 1, 2026; final authorization pending | Government clouds | verified | Learn, Agent 365 service description |
| 37 | Agent 365 CLI: features available commercially may not yet be available in GCC | Government clouds | verified | Learn, Configure the Agent 365 CLI for US Government clouds |
| 39 | Treat agent capabilities not listed for GCC as unavailable until confirmed | Government clouds | restated-as-design | Program position |
| 40 | Build on GA in agency's cloud; preview as watch items | Government clouds | restated-as-design | Consistent with Book 04 Ch03 |
| 41 | Book 04 Ch03 statement still accurate; additions (Agent 365 license; agent-user compliant-device grant, preview) | Note for readers of Book 04 | verified | Learn, Target agent identities; CA Grant |
| 42 | AgentCore Identity: agent identities as workload identities with specialized attributes; inbound JWT authorizer; outbound credential providers; on behalf of users | AWS | verified | AWS AgentCore developer guide |
| 43 | AgentCore in GovCloud (US-West); several CloudFormation resources incl. OAuth2 and API key credential providers unavailable | AWS | verified | AWS GovCloud (US) User Guide |
| 44 | Google agent identity: SPIFFE, X.509, not shared by default, can't be impersonated, no long-lived keys | Google | verified | Google Cloud IAM agent identity overview |
| 45 | Google release stage and government availability | Google | unverifiable | Page has no launch-stage label or government statement; stated as such in the chapter |
| 46 | Classification table of AI identity kinds | Classifying the estate | restated-as-design | Program design; product behavior per rows above |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| (new research) Microsoft Entra workload and agent identities | Ch04 throughout | — |
| (new research) AWS and Google equivalents | Ch04 AWS and Google, briefly | Kept to one paragraph each per brief |
| index.md and whitepaper | — | Assigned to Ch01, Ch02, Ch03, Ch07, Ch09, Ch10; no Ch04 content in either source |

## Source watch, November 9, 2026

Re-checked after the weekly source watch (issue #499) reported a change in a cited source. Checked November 9, 2026; no personal data sent to any site.

| Finding | Change |
|---|---|
| Amazon Bedrock AgentCore in AWS GovCloud (US): still US-West only; differences now Bedrock Guardrails Policy, Temporal Policy, AgentCore payments and AgentCore optimization; unavailable CloudFormation resources listed as AWS::AgentRegistry::Registry and ::RegistryRecord only (the OAuth2 and API key credential providers are no longer named) | Row 43 updated in the AWS paragraph; footnote [^c04-aws-gov] updated |

## November 9, 2026: Learn citations

Microsoft Learn pages the Learn coverage map marked as covered but uncited, read on November 9, 2026 with the Microsoft Learn fetch tool and cited where they support a specific sentence. No wording changed beyond the added footnotes.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 47 | Three token subjects Entra ID can see: user (on-behalf-of), own identity (autonomous), own user account | Opening | verified | Learn, Authentication protocols in agents, <https://learn.microsoft.com/entra/agent-id/agent-oauth-protocols> (`c04-protocols`) |
| 48 | Legacy Copilot Studio and app-registration agents are treated as standard applications | Workload identities | verified | Learn, Recreate Copilot Studio agents; Migrate custom app registrations, <https://learn.microsoft.com/entra/agent-id/migrate-copilot-studio-agents-to-agent-id>, <https://learn.microsoft.com/entra/agent-id/migrate-custom-app-registrations-to-agent-id> (`c04-migrate-cs`, `c04-migrate-custom`) |
| 49 | Agent ID object model: blueprint, blueprint principal, agent identity, agent user account | The object model | verified | Learn, Agent ID key concepts, <https://learn.microsoft.com/entra/agent-id/key-concepts> (`c04-key-concepts`) |
| 50 | Blueprint is a template holding credentials, app roles, verified publisher and inheritable permissions | The object model | verified | Learn, Agent identity blueprints, <https://learn.microsoft.com/entra/agent-id/agent-blueprint> (`c04-blueprint`) |
| 51 | Products and channels that create agent identities (Copilot Studio, Foundry, consent to non-Microsoft agents) | Which products create agent identities | verified | Learn, How are agent identities created?, <https://learn.microsoft.com/entra/agent-id/agent-id-creation-channels> (`c04-creation-channels`) |
| 52 | Non-Microsoft agents (Bedrock, n8n) given agent identities through the sidecar or workload identity federation | Which products create agent identities | verified | Learn, What is the Microsoft agent identity platform; Secure an Amazon Bedrock agent, <https://learn.microsoft.com/entra/agent-id/what-is-agent-id-platform>, <https://learn.microsoft.com/entra/agent-id/integrate-aws-bedrock-agent> (`c04-platform`, `c04-bedrock`) |
| 53 | Agent 365 becomes the unified registry; Entra continues to provide agent identities | Which products create agent identities | verified | Learn, Agent Registry convergence with Microsoft Agent 365, <https://learn.microsoft.com/entra/agent-id/agent-registry-convergence> (`c04-registry-convergence`) |
