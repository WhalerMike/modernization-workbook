# Ticket-to-Machine learning path — Module 2: The Boundary and Least Privilege — narration script (practice copy)

## Slide 1 — Module 2: The boundary and least privilege

Welcome to Module 2 of the Ticket-to-Machine learning path: the boundary and least privilege. Before any call is made, you need to know which actions run from a vendor's cloud, and which non-person identities make them. Then each identity has to hold exactly what its calls need, and no more. This module follows the guide's Gate 1, and the developer workbook's Chapters 02 and 03. You'll confirm the boundary on paper, learn the ServiceNow roles, SailPoint scopes and Graph permissions each kit task needs, and then make privilege something a test can check, by catching three kinds of over-wide grant on a laptop.

## Slide 2 — Why "to make it work" is the wrong grant

Why does this matter? Because the easy fix is the wrong one. An administrator who grants the itil role to make it work has given the integration every ITSM table. An API client with a manage scope can change accounts if its token is stolen. One integration user for everything means the account that reads evidence can also close findings. And when a client gains a call nobody listed, someone grants a role in production to make the error go away. Each of those has a guard in the kit, and you'll use every one of them in the lab. The idea of the module is simple: confirm the boundary on paper first, then make privilege something a test can check, instead of something someone remembers.

## Slide 3 — What you'll be able to do in Module 2

Here's what you'll be able to do by the end of this module, which takes about an hour with the lab. You'll explain what Gate 1 records about each product's authorization and each action that runs from a vendor's cloud. You'll describe the ServiceNow roles the kit uses and why they're split by task. You'll describe the SailPoint scopes and Graph permissions each task needs, and why the workflow scope gets a client of its own. And you'll verify a grant against the kit's call list, and catch a grant that's too wide. You need Module 1 first. For the Graph rows, the Microsoft Automation path's first module covers permissions. Lab 1 runs on fixtures; Lab 2 needs a developer instance and a sandbox tenant.

## Slide 4 — Gate 1 records and decides; it builds nothing

Gate 1 records and decides; it builds nothing. It has six steps. One: confirm each product's FedRAMP status on the Marketplace on the day you decide, and record the listing, its impact level, its path and the date. Two: confirm what's inside the authorization. SailPoint doesn't publish a list of features missing from its authorized environment, so ask in writing whether Workflows, Native Change Detection and the workflow HTTP Request step, which Gates 3 to 6 rely on, are there. Three: confirm the product you bought is the one authorized. Four: record which actions run from a vendor's cloud. Five: confirm the apps are in ServiceNow's government Store. And six: register the integration identities, with a certificate or federated credential, never a long-lived secret.

## Slide 5 — Four integration identities, and the vendor-cloud flows

Four non-person identities carry the integration. SailPoint's Entra connector app registration in the agency's tenant. The ServiceNow Entra spoke's app registration. The ServiceNow integration user that SailPoint's workflow posts as, together with the verifier account the re-read client closes records as. And the SailPoint API client the kit's clients read with. As design guidance, each has two named owners and a federal sponsor in the system inventory. Now the flows. SailPoint's cloud connectors call Microsoft Graph from SailPoint's cloud; only the Active Directory path runs through its on-premises virtual appliance. And, by inference, its workflows call out from SailPoint's cloud to ServiceNow. The Federal Modernization Workbook's design prefers execution through a connector inside the boundary, so each vendor-cloud action becomes a recorded data flow.

## Slide 6 — The call list: privilege a test can check

Here's how the kit makes privilege checkable. A file called calls dot JSON lists every HTTP call a Python client makes: the system, the method and path, the tasks that make it, the least privilege it needs, and the vendor page that says so. A test runs the clients against a fake HTTP session and fails on any call the file doesn't declare. So a new call fails the test until someone adds its row, its privilege and its source, and a reviewer sees that row in the pull request. The test also asserts that no task asks SailPoint or Graph for a write scope, except workflow creation. Then the kit calls tool reads the file. Give it a task and it lists what that task needs. Give it a grant and it compares, and exits one on anything missing or extra.

## Slide 7 — ServiceNow roles, split by task

On ServiceNow, the roles are custom roles in the scoped application, split by task. That's design guidance: ServiceNow says the calling user needs roles that allow access to the table, and no single role allows adding attachments by default. The finding writer can create findings, and nothing else. The verifier can read and write findings and attach evidence, so it can close them, which is why the business rule accepts a close only from that account. And the evidence reader reads, but can't change a record it's about to hash. Each gets its own integration user and client-credentials client. The client itself takes a token from a vault first, then client credentials, and basic authentication only on a developer instance. It pages, retries, and refuses a secret in its config file.

## Slide 8 — ISC scopes and Graph permissions each task needs

Now SailPoint and Graph. The drift and re-read clients need read scopes only: search read, and accounts read. The Accounts endpoints would accept the manage scope too, so the call list names the read scope and the comparison flags manage as extra. Creating SailPoint's workflows needs the workflow manage scope, and no client in the kit makes that call. So, as design guidance, that scope belongs to a separate client, used once, by hand or by a reviewed pipeline, and then removed. On Graph, the app registration needs User dot Read dot All, as an application permission, and AuditLog dot Read dot All only if the run reads the audit. Nothing in Pass 1 needs write access to Entra ID, Active Directory or SailPoint.

## Slide 9 — What a client-credentials token can't do in ISC

One thing a client-credentials token can't do in SailPoint: act as a user. It has no user context, and SailPoint warns that calling most admin APIs with one often returns four oh three. It doesn't say which. So if Search or Accounts returns four oh three in your sandbox, use a personal access token for a dedicated user at the lowest user level that works, and record which one. Never an administrator's, or the kit runs as org admin. Whether a client-credentials token gets data is on the verify list. The client pages Search past ten thousand results with search after, sorted on I D, and reads accounts two hundred fifty at a time. For Graph, it signs in with a certificate first, and the cloud setting is Global for worldwide and GCC.

## Slide 10 — Try it: catch two over-wide ServiceNow grants

Try it. Part A of Lab 1 runs in the kit's folder against fixtures. Step one proves every call is declared: nine tests pass. Step two lists what the re-read client needs on ServiceNow: a client-credentials token, then read and write on the finding table and create on attachments, all from one role, the verifier. Step three is the classic mistake: an administrator gave the verifier itil as well. The tool lists the calls, then reports nothing missing, itil extra, and least privilege does not hold. It exits one. Step four catches the evidence export reusing the verifier's role: the evidence reader is missing and the verifier is extra. With the verifier's role, the export could also close findings. Step five reruns the original ServiceNow client tests: seven pass.

## Slide 11 — Try it: a manage scope, one client, and the audit

Part B turns to SailPoint and Graph. Step six runs the SailPoint client tests: four pass. Step seven lists what the drift client needs from SailPoint: search read and accounts read. Step eight catches a manage scope on that read client: nothing missing, accounts manage extra, and it exits one. Step nine checks the drift client's scopes against the workflow task. The workflow scope is missing, and both read scopes are extra. That's the point of the step: the two jobs need two clients. Step ten checks the Graph app registration twice. For a drift run that reads the audit, AuditLog dot Read dot All is missing. With the required-only option, for a run that doesn't read the audit, least privilege holds, and the command exits zero.

## Slide 12 — Lab 2: build the roles and clients in test instances

Lab 2 builds the real thing in test instances. In your ServiceNow developer instance, from Module 1, you create the three custom roles, one integration user and one client-credentials integration per role. Then you compare each user's roles with the call list, and confirm the evidence reader can't patch a record. In a SailPoint sandbox tenant, you create a reader API client and a separate workflow client, compare each with the call list, and try the reader. How an agency gets a sandbox is between it and SailPoint. Back it out before you leave: delete the OAuth integrations, users and roles, and revoke any saved token; then delete both API clients and anything under the output folder. The authors haven't run Lab 2.

## Slide 13 — Where agencies are: the boundary on the Marketplace

What does the boundary look like on the Marketplace? Read on November 1, 2026: ServiceNow's Government Community Cloud is FedRAMP certified at High, on the JAB path. ServiceNow's commercial cloud has no listing of its own, and some agencies run on it. SailPoint Identity Security Cloud is certified at Moderate, on the agency path. And IdentityIQ, the self-hosted product, has no listing of its own. The interim path: on ServiceNow's commercial cloud, the authorizing official decides whether identity tasks may run there before a move, and, as design guidance, payloads stay to identifiers. Where a feature's presence in SailPoint's authorized environment is unconfirmed, build Gates 3 to 6 in the sandbox and hold production until SailPoint confirms it.

## Slide 14 — The federal requirement, and the evidence to keep

The federal requirement. The guide maps Gate 1 to NIST special publication eight hundred fifty-three. S A nine, external system services, and FedRAMP authorization: each service's authorization is confirmed, or the gap is recorded as a risk for the authorizing official. C A three, information exchange: each flow is recorded. I A five and A C six: the integration identities use certificates and least privilege. The chapters map the call list to A C six, A C two for account management, A C five because the account that closes findings is separate, and C M three because a change to what the integration may call is reviewed. The evidence an ISSO keeps: Gate 1's record, plus the call list, its test, and the comparison output with each access approval.

## Slide 15 — Check yourself: two questions on least privilege

Check yourself with two questions from the module's knowledge check. First: why does the evidence export get its own evidence reader role, instead of reusing the verifier's? The answer is b. With the verifier's role, the export could also close findings. The reader can't change a record it's about to hash. Roles are split by task. Second: Gate 1 asks you to record which actions run from a vendor's cloud. Why? The answer is a. The workbook's design prefers execution through a connector inside the boundary, so each vendor-cloud action becomes a recorded data flow. The module page has two more questions, each linked to the section that answers it.

## Slide 16 — Summary, and next: Module 3, one writer

To sum up. You confirmed what Gate 1 records: each product's FedRAMP status, what's inside the authorization, which actions run from a vendor's cloud, and the integration identities. And you saw that it builds nothing. You learned the ServiceNow roles, SailPoint scopes and Graph permissions each kit task needs, and why the workflow scope gets a client of its own. And on a laptop you caught three kinds of over-wide grant: an extra role, a reused role, and a manage scope on a read client. Before you ship, work through the Chapter 02 and Chapter 03 checklists. Next is Module 3, one writer per attribute: Gate 2's decisions about who writes each attribute and who approves each class, and a check that finds an attribute with two writers.
