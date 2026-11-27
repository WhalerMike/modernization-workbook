---
title: "Chapter 04 — An Agent That Only Proposes"
description: "The case triage agent in the reference implementation: a provider-neutral model interface with a deterministic stub, an agent identity with a human sponsor and a tool allow-list, arguments validated before any query, a hard step limit, an audit row for every tool call allowed or not, and one write, a pending proposal, that only a person's recorded decision can apply. Lab 1 runs triage, reads the proposal and the audit, shows the agent refused as a decider, makes the model misbehave three ways and writes the step's evidence record; Lab 2 runs triage and a decision against the service on a test PostgreSQL server and reads the audit table."
doc-type: workbook-chapter
audience: [Technical]
family: dw-application-modernization
part: How
series-order: 4
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: approved
reviewed-sha256: 9cda1c511634c699ab18709017f94ed263899a79e00c92f3d9bcfddcac1a4400
last-reviewed: 2026-11-25
---
# Chapter 04 — An Agent That Only Proposes

*The model decides what to ask for. Code the agency controls decides what runs, writes down every call, and leaves every change to a person.*

::: {.callout-note}
## In this chapter
The agent pattern of [Book 18, Chapter 05](../../../books/b18-application-modernization/05-generative-and-agentic-ai.md), in code. You start with what the chapter and the federal rules ask of an agent that calls tools, then read the kit's agent loop and its guards. Lab 1 runs triage on a fictional case, reads the pending proposal and the audit, shows a decision in the agent's own name refused, and makes the model misbehave on purpose. Lab 2 runs triage and a decision against the service on a test database.
:::

## Goal and audience

**Goal.** By the end of this chapter you can show, from the audit table, every tool the agent asked for and whether it ran, and show that no case changed until a person decided.

**Audience.** Developers who add AI features to a modernized application, the agent's sponsor, and the ISSO. You should have done Chapter 01's Lab 1.

## Start with the book and the standards

### What they give you

Book 18's Chapter 05 sets the guardrails for an agent that calls tools: one provider-neutral model interface, a record of every call, an identity with a sponsor, an allow-list, validated arguments, a step limit, and human approval for any action that changes a record. OWASP's guidance for excessive agency is to require user approval for high-impact actions.[^am04-owasp] OMB M-25-21 asks for human oversight and a fail-safe for high-impact AI.[^am04-m2521] Book 17's [Chapter 05](../../../books/b17-ai-identity/05-owners-sponsors-and-lifecycle.md) asks every AI identity to have an owner and sponsor; in Microsoft Entra, agent identities themselves are built in *Building Non-Person Identity*'s [Chapter 09](../non-person-identity/09-ai-agent-identities.md).

### What they leave to you

Each row is pinned by a test in `AgentGuardrailTest` or `TriageAndApprovalTest`.

| What the book and the rules give | Why it matters | What the kit adds |
|---|---|---|
| "Use a provider-neutral interface" | A provider's SDK spread through the code locks the application to it | `ModelClient`: one method, a final answer or one tool call; a deterministic stub by default |
| "Give the agent an identity and a sponsor" | Nobody answers for an agent without one | `app.agent.id` and `app.agent.sponsor`; the service won't start without both; every proposal and audit row carries the id |
| "Allow-list the tools" | A model asks for tools it was never offered | Only listed tools are offered; any other name is refused and audited |
| "Treat model output as untrusted" | An argument becomes an injected query | Case number format, known action, rationale length, no extra arguments, proposals only for the case being triaged |
| "Limit the steps" | A looping model runs up cost and load | `app.agent.max-steps` (5); the stop is audited |
| "A person approves high-impact actions" | The model's judgment alone changes a record | The agent's only write is a PENDING proposal; only `POST /api/proposals/{id}/decision` applies one, and never in the agent's own name |

**The verdict.** Build all of it: no framework the kit could take on supplies these guards as tested code. Keep each guard outside the model.

## The code

| Piece | File | What it does |
|---|---|---|
| Model interface | `ai/ModelClient.java` | `ModelReply next(ModelRequest)` |
| Stub | `ai/StubModelClient.java` | Rule-based: proposes `FLAG_FOR_REVIEW` for a case open over 365 days, or a possible duplicate; two modes misbehave on purpose |
| Identity | `ai/AgentIdentity.java` | Id, sponsor and allowed tools from configuration |
| Loop | `ai/CaseTriageAgent.java` | Offers only allowed tools, validates arguments, audits every call, stops at the limit |
| Tools | `get_case`, `list_related_cases`, `propose_action` | Two reads and one insert of a PENDING proposal |
| Audit | `ai/AgentAuditLog.java`, table `agent_audit` | Agent, tool, case, allowed, and a reason, never raw arguments |
| Approval | `cases/ProposalService.java` | The only code that applies a proposal |

The configuration is in `service/src/main/resources/application.yml`.

::: {.callout-important}
## Illustrative code
Only the deterministic stub runs; the guards have not been tested against a real model. Adding a provider means writing one `ModelClient` adapter, which the README describes. The service has no authentication, so `decidedBy` comes from the request body; a real deployment takes it from the signed-in user.
:::

## Lab 1: fixtures, no tenant

You need Java 21 and PowerShell 7.4 or later. Work in `examples/app-modernization`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/app-modernization`. Each step below says what it does and what to look for.

```powershell
# Step 1: Read the agent's identity and limits
Select-String -Path service/src/main/resources/application.yml -Pattern '^\s+(id|sponsor|allowed-tools|max-steps):' | ForEach-Object { $_.Line.Trim() }

# Step 2: Run the agent's tests and the lab records
./mvnw -q -pl service test "-Dtest=AgentGuardrailTest,TriageAndApprovalTest,LabRecordsTest"
Import-Module ./powershell/AppModernization/AppModernization.psm1
Get-AmTestResult -Path service/target/surefire-reports | Format-Table

# Step 3: Read what triage proposed for C-000001
(Read-AmJson -Path service/target/lab/triage-C-000001.json).body.proposals | Format-List action, status, agentId, sponsor, rationale

# Step 4: Read the audit of that run
Import-Csv service/target/lab/audit-triage.csv | Format-Table

# Step 5: See the agent refused as a decider, and the case change only after a person decided
foreach ($f in 'case-before-decision', 'decision-by-agent', 'case-after-decision', 'decision-twice') { $r = Read-AmJson -Path "service/target/lab/$f.json"; [pscustomobject]@{ Step = $f; Status = $r.httpStatus; Case = $(if ($r.httpStatus -eq 200) { $r.body.status }); Detail = $r.body.detail } }

# Step 6: Make the model misbehave
Import-Csv service/target/lab/audit-guardrails.csv | Format-Table tool, case_number, allowed, detail -Wrap

# Step 7: Write the step's evidence record
Write-AmEvidenceRecord -Step AGENT -Path service/src/main/resources/application.yml, service/target/lab/audit-triage.csv, service/target/lab/audit-guardrails.csv, service/target/surefire-reports/TEST-gov.example.modernization.ai.AgentGuardrailTest.xml, service/target/surefire-reports/TEST-gov.example.modernization.TriageAndApprovalTest.xml -OutputPath out/evidence -AsOf 2026-11-24T00:00:00Z | Format-List Record, Step, Files, Controls, KSIs, Other

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Read the agent's identity and limits:**

   ```powershell
   Select-String -Path service/src/main/resources/application.yml -Pattern '^\s+(id|sponsor|allowed-tools|max-steps):' | ForEach-Object { $_.Line.Trim() }
   ```

   <!-- capture:begin 04-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/04-1.txt))](captures/04-1.png){.lightbox fig-alt="Terminal window showing Select-String -Path service/src/main/resources/application.yml -Pattern '^\s+… and what it printed"}

   <!-- capture:end -->

2. **Run the agent's tests and the lab records:**

   ```powershell
   ./mvnw -q -pl service test "-Dtest=AgentGuardrailTest,TriageAndApprovalTest,LabRecordsTest"
   Import-Module ./powershell/AppModernization/AppModernization.psm1
   Get-AmTestResult -Path service/target/surefire-reports | Format-Table
   ```

   <!-- capture:begin 04-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/04-2.txt))](captures/04-2.png){.lightbox fig-alt="Terminal window showing ./mvnw -q -pl service test '-Dtest=AgentGuardrailTest,TriageAndApprovalTest,L… and what it printed"}

   <!-- capture:end -->

   No failures or errors in the three classes.

3. **Read what triage proposed for `C-000001`:**

   ```powershell
   (Read-AmJson -Path service/target/lab/triage-C-000001.json).body.proposals | Format-List action, status, agentId, sponsor, rationale
   ```

   <!-- capture:begin 04-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/04-3.txt))](captures/04-3.png){.lightbox fig-alt="Terminal window showing (Read-AmJson -Path service/target/lab/triage-C-000001.json).body.proposals | … and what it printed"}

   <!-- capture:end -->

   One PENDING `FLAG_FOR_REVIEW`, with the agent's id, its sponsor and the reason.

4. **Read the audit of that run:**

   ```powershell
   Import-Csv service/target/lab/audit-triage.csv | Format-Table
   ```

   <!-- capture:begin 04-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/04-4.txt))](captures/04-4.png){.lightbox fig-alt="Terminal window showing Import-Csv service/target/lab/audit-triage.csv | Format-Table and what it printed"}

   <!-- capture:end -->

   Three calls, each allowed: two reads and the proposal.

5. **See the agent refused as a decider, and the case change only after a person decided:**

   ```powershell
   foreach ($f in 'case-before-decision', 'decision-by-agent', 'case-after-decision', 'decision-twice') { $r = Read-AmJson -Path "service/target/lab/$f.json"; [pscustomobject]@{ Step = $f; Status = $r.httpStatus; Case = $(if ($r.httpStatus -eq 200) { $r.body.status }); Detail = $r.body.detail } }
   ```

   <!-- capture:begin 04-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/04-5.txt))](captures/04-5.png){.lightbox fig-alt="Terminal window showing foreach ($f in 'case-before-decision', 'decision-by-agent', 'case-after-decis… and what it printed"}

   <!-- capture:end -->

   The case is `OPEN`; a decision recorded as `agent-case-triage-01` gets a 400; a reviewer's approval moves the case to `PENDING`; a second decision gets a 409.

6. **Make the model misbehave:** ask for a tool it was never offered, loop forever, and send an injected case number and a proposal for another case:

   ```powershell
   Import-Csv service/target/lab/audit-guardrails.csv | Format-Table tool, case_number, allowed, detail -Wrap
   ```

   <!-- capture:begin 04-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/04-6.txt))](captures/04-6.png){.lightbox fig-alt="Terminal window showing Import-Csv service/target/lab/audit-guardrails.csv | Format-Table tool, case_… and what it printed"}

   <!-- capture:end -->

   The unknown tool is denied, the loop stops after five steps, both bad arguments are rejected before anything runs, and every one is in the audit.

7. **Write the step's evidence record:**

   ```powershell
   Write-AmEvidenceRecord -Step AGENT -Path service/src/main/resources/application.yml, service/target/lab/audit-triage.csv, service/target/lab/audit-guardrails.csv, service/target/surefire-reports/TEST-gov.example.modernization.ai.AgentGuardrailTest.xml, service/target/surefire-reports/TEST-gov.example.modernization.TriageAndApprovalTest.xml -OutputPath out/evidence -AsOf 2026-11-24T00:00:00Z | Format-List Record, Step, Files, Controls, KSIs, Other
   ```

   <!-- capture:begin 04-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/04-7.txt))](captures/04-7.png){.lightbox fig-alt="Terminal window showing Write-AmEvidenceRecord -Step AGENT -Path service/src/main/resources/applicati… and what it printed"}

   <!-- capture:end -->

**Expected result:** one pending proposal, an audit row for every call, the agent refused as a decider, each misbehavior denied or stopped and audited, and `record-001-AGENT.json`. Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

<!-- capture:begin 04-8 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/04-8.txt))](captures/04-8.png){.lightbox fig-alt="Terminal window showing Remove-Item -Recurse -Force out and what it printed"}

<!-- capture:end -->

## Lab 2: the service on a test PostgreSQL server

Use the test database and the running service from Chapter 01's Lab 2, after step 2, with the `demo` profile, never production. You need what that lab needed, with the same placeholders. You'll also replace `<reviewer>`, a name for the person deciding.

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
# Step 1: Run triage on the oldest open case
$t = Invoke-RestMethod -Method Post http://localhost:8080/api/cases/C-000001/triage
$t.answer; $t.proposals | Format-List id, action, status, agentId, sponsor, rationale

# Step 2: Try to decide as the agent, then as a person
$id = $t.proposals[0].id
Invoke-WebRequest -Method Post "http://localhost:8080/api/proposals/$id/decision" -ContentType 'application/json' -Body '{"decision":"APPROVED","decidedBy":"agent-case-triage-01"}' -SkipHttpErrorCheck | Select-Object StatusCode, Content
Invoke-RestMethod -Method Post "http://localhost:8080/api/proposals/$id/decision" -ContentType 'application/json' -Body '{"decision":"APPROVED","decidedBy":"<reviewer>"}' | Format-List status, decidedBy, decidedAt
(Invoke-RestMethod http://localhost:8080/api/cases/C-000001).status

# Step 3: Read the audit table
psql -h <pg-host> -U <db-user> -d <database> -c 'select agent_id, tool, case_number, allowed, detail, at from agent_audit order by id'

# Step 4: Back it out
Stop-Process -Id $svc.Id
psql -h <pg-host> -U <db-user> -d postgres -c 'DROP DATABASE <database>'
Remove-Item service-test.log; Remove-Item Env:DB_URL, Env:DB_USER, Env:DB_PASSWORD
```

:::

<!-- labs:end -->

1. **Run triage on the oldest open case:**

   ```powershell
   $t = Invoke-RestMethod -Method Post http://localhost:8080/api/cases/C-000001/triage
   $t.answer; $t.proposals | Format-List id, action, status, agentId, sponsor, rationale
   ```

2. **Try to decide as the agent, then as a person:**

   ```powershell
   $id = $t.proposals[0].id
   Invoke-WebRequest -Method Post "http://localhost:8080/api/proposals/$id/decision" -ContentType 'application/json' -Body '{"decision":"APPROVED","decidedBy":"agent-case-triage-01"}' -SkipHttpErrorCheck | Select-Object StatusCode, Content
   Invoke-RestMethod -Method Post "http://localhost:8080/api/proposals/$id/decision" -ContentType 'application/json' -Body '{"decision":"APPROVED","decidedBy":"<reviewer>"}' | Format-List status, decidedBy, decidedAt
   (Invoke-RestMethod http://localhost:8080/api/cases/C-000001).status
   ```

   A 400 for the agent; `APPROVED` for the person; the case now `PENDING`.

3. **Read the audit table:**

   ```powershell
   psql -h <pg-host> -U <db-user> -d <database> -c 'select agent_id, tool, case_number, allowed, detail, at from agent_audit order by id'
   ```

4. **Back it out:** Chapter 01's Lab 2, step 5. In PowerShell, in the same session, from `examples/app-modernization`: the commands stop the service, drop the test database from the `postgres` database, and remove the log and the session's variables, as [that step](01-the-contract-and-the-schema-the-service-owns.md#lab-2-a-test-postgresql-server) does:

   ```powershell
   Stop-Process -Id $svc.Id
   psql -h <pg-host> -U <db-user> -d postgres -c 'DROP DATABASE <database>'
   Remove-Item service-test.log; Remove-Item Env:DB_URL, Env:DB_USER, Env:DB_PASSWORD
   ```

## Verified facts

| Item | Value | Source |
|---|---|---|
| Human approval for high-impact actions | OWASP LLM06:2025, Excessive Agency | [^am04-owasp] |
| Human oversight and a fail-safe for high-impact AI | OMB M-25-21, Section 4(b)(v) | [^am04-m2521] |
| The guards | 4 guardrail and 11 triage and approval tests pass on PostgreSQL 18.6 | Lab 1, November 24, 2026 |
| A real model | *Not verified* | Book 18, [Chapter 08](../../../books/b18-application-modernization/08-the-reference-implementation.md#what-was-verified-and-what-wasnt) |

## Federal requirements and evidence

The record's controls, KSIs and other requirements are the kit's `config/requirements.json`, step `AGENT`.[^am04-oscal] [^am04-ksi]

| What the output proves | Requirement it supports | KSI it aligns to | Who keeps it |
|---|---|---|---|
| The agent can reach only its allow-listed tools and can't apply its own proposals (Lab 1, steps 1, 5 and 6) | AC-6, Least Privilege | KSI-IAM-ELP | The agent's sponsor |
| Every tool call, allowed or not, is recorded with the agent's id and a reason (Lab 1, steps 4 and 6; Lab 2, step 3) | AU-2, Event Logging; AU-12, Audit Record Generation | KSI-MLA-LET | The service's technical owner; the ISSO keeps the record |
| A person decides every change the agent proposes | OMB M-25-21, human oversight of high-impact AI | — | The sponsor and the reviewers |

KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its evidence up with them and doesn't report them. The kit's records support these controls; the agency's assessor decides them *(design guidance)*.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| The model calls a tool it wasn't given | An unplanned action | Allow-list; refused and audited |
| An injected argument | A query does what the model was told by a case note | Strict formats before any query |
| A loop | Cost and load without end | Step limit, audited |
| The agent approves its own work | No human oversight | Decisions in the agent's name refused |
| Raw arguments in the audit | Personal data in logs | A reason, not the arguments |
| `decidedBy` from the request body in production | Anyone can claim to be the reviewer | Take it from the signed-in user (README, Security notes) |

## Checklist

- [ ] The agent has an id and a named sponsor, and the service refuses to start without them.
- [ ] The allow-list holds only the tools the use case needs.
- [ ] The guardrail tests run in the pipeline on every change.
- [ ] The audit table is retained with the application's other logs.
- [ ] Decisions come from the signed-in user before production.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 03 — Proving the Move](03-proving-the-move.md) · [Workbook index](index.md) · [Next: Chapter 05 — The Front End, Its Accessibility Check and the Containers →](05-the-front-end-its-accessibility-check-and-the-containers.md)
:::

[^am04-owasp]: OWASP GenAI Security Project, "LLM06:2025 Excessive Agency," Prevention and Mitigation Strategies, <https://genai.owasp.org/llmrisk/llm062025-excessive-agency/> (accessed Oct 28, 2026; carried from Book 18, Chapter 05).
[^am04-m2521]: Office of Management and Budget, M-25-21, *Accelerating Federal Use of AI through Innovation, Governance, and Public Trust*, April 3, 2025, Section 4(b)(v) and footnote 22, <https://www.whitehouse.gov/wp-content/uploads/2025/02/M-25-21-Accelerating-Federal-Use-of-AI-through-Innovation-Governance-and-Public-Trust.pdf> (accessed Oct 28, 2026; carried from Book 18, Chapter 05).
[^am04-oscal]: National Institute of Standards and Technology, SP 800-53 Rev. 5 OSCAL catalog, release 5.2.0, <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (accessed Nov 11, 2026; carried from Book 18, Appendix A).
[^am04-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/providers/20x/key-security-indicators/> (read November 9, 2026; carried from *Building Provider Notices*).
