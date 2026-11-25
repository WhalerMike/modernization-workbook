# Data Platform and SQL Server Identity learning path — Module 3: Arc and the Engine's Identity — narration script (practice copy)

## Slide 1 — Module 3: Arc and the Engine's Identity

Welcome to Module 3 of the Data Platform and SQL Server Identity learning path: Arc and the engine's identity. It teaches Runbook R oh four, with Chapter 3 of the developer workbook, Building SQL Server Identity. Module 2 left every current, non-clustered instance at "Category 1 or 2". In this module you settle that category from evidence.

## Slide 2 — Why no Arc means no Entra login

Why does this matter? An on-premises SQL Server host has no cloud identity of its own. Connecting it to Azure Arc gives the machine a system-assigned managed identity, and that identity is what lets the instance take part in Entra authentication. No Arc, no machine identity. No machine identity, no Entra login. In this module you settle each instance's category from evidence: the agent's status, the SQL extension's state, and the instance's own Entra setting, read from the cloud a G C C Moderate tenant uses.

## Slide 3 — What you'll be able to do in Module 3

Here's what you'll be able to do by the end of this module, which takes about fifty-five minutes with the lab. You'll explain what the Arc agent's managed identity gives the engine, and what the instance uses as its Entra identity on SQL Server 2022 and on 2025. You'll explain why engine Entra authentication, Layer 1, doesn't wait for O S level Entra sign-in, Layer 2. You'll put the deployment steps in order, and name the checks that gate login migration. And you'll settle each audited instance's category with the kit, and say why it refuses a snapshot from an unrecorded cloud. Before you start, finish Module 2. For Resource Graph and its paging, see Module 4 of the Microsoft Automation learning path.

## Slide 4 — What Arc gives the engine

Unit 2 is what Arc gives the engine. Installing the Connected Machine agent makes the server an Azure Resource Manager resource, with a system-assigned managed identity whose credential the agent manages. What the instance uses as its Entra identity depends on the version. On SQL Server 2025, it's the Arc server's managed identity, used as the instance's primary managed identity. Microsoft Learn says only system-assigned identities are supported. On SQL Server 2022, it's an app registration with a certificate kept in Azure Key Vault, which the agent downloads with the machine's identity. On either version, Entra authentication needs SQL Server 2022 or later, is disabled by default, and isn't supported on a failover cluster instance. And neither replaces the Windows account the SQL Server service runs as.

## Slide 5 — Two layers, and the cloud a GCC tenant uses

Two distinctions matter here. The first is the two layers. Layer 1, engine Entra authentication, proceeds on a domain-joined host. Layer 2, O S level Entra sign-in, is a separate transformation. So a domain-joined Windows Server host running SQL Server 2022 with Arc doesn't have to leave the domain before its engine takes Entra logins. The second is the cloud. Microsoft Learn says Office 365 G C C is paired with Microsoft Entra I D in Azure, the commercial cloud. So a G C C Moderate tenant's Arc resources are in a commercial Azure subscription in the same tenant, the cloud called Azure Cloud. The program recorded that as a decision.

## Slide 6 — The deployment sequence, and the gate

Unit 3 is the sequence and the gate. Arc deployment runs in order. Connectivity first. Then the agent. Then the Azure extension for SQL Server, which Arc installs automatically on a host with SQL Server. Then Entra authentication, turned on for the instance, since it's disabled by default. Verification is the gate between enrollment and migration. The first check asks the agent's local identity endpoint for a token. The second is a test Entra login that connects to the instance. And the third is the next audit run, which should put the instance in Category 1. A failed verification is an enrollment problem, solved before migration starts. Pre-2022 instances and failover cluster instances upgrade, re-platform, or carry a dated exception.

## Slide 7 — How the kit settles the category

The kit reads three things for each instance, the agent, the extension and the Entra setting, and names whatever is missing. A failover cluster instance, or a version before SQL Server 2022, is Category 3 before Arc is even looked at. An agent that isn't connected, an extension that didn't succeed, or Entra not configured makes it Category 2, with each missing piece named. All three, on 2022 or later, is Category 1: plan the logins. It refuses any snapshot whose cloud isn't Azure Cloud, because a snapshot from the wrong cloud judges the wrong estate. And Resource Graph doesn't give it the Entra setting, so that's confirmed in the portal and recorded.

## Slide 8 — What Microsoft Learn leaves to you, and the kit adds

Chapter 3 lists what Microsoft Learn's material leaves to you, and what the kit adds. Each row is pinned by a test. The agent, the extension and the Entra setting are three resources and one setting, so an instance with two of the three looks ready in the portal; the kit reads all three, and names whatever is missing. The category rules are in the data platform book, not in Learn, so a pre-2022 instance or a cluster could be scheduled for Arc work it can't use; the kit puts it in Category 3 before Arc is looked at. Resource Graph returns nothing, not an error, for what the caller can't read, so the kit reports the agent as not installed and keeps the instance in Category 2, and Lab 2 checks the sign-in first. The cloud is a sign-in choice, so the kit refuses a snapshot from any cloud but Azure Cloud. And the managed identity method is SQL Server 2025's: a 2022 instance recorded that way gets a note.

## Slide 9 — Try it: make the run's folder, read the Arc results

Try it. Lab 1 runs in PowerShell 7 on the kit's fictional estate, with no subscription and no tenant. Go to the kit's folder, and make this run's results folder, named for the time you start, so running the lab again never overwrites a run. Step one reads the fictional Arc results: their cloud, Azure Cloud, and the three machines Resource Graph returned. Sequel P R D oh one and sequel P R D oh six are connected. The cluster node, sequel F C I oh four dash N one, is disconnected, on an older agent.

## Slide 10 — Try it: settle the categories

Step two settles the categories. Sequel P R D oh one and sequel P R D oh six are Category 1: ready, so plan the logins. Notice the Entra column. Sequel P R D oh one uses an app registration, as SQL Server 2022 does. Sequel P R D oh six, on 2025, uses the managed identity. Sequel P R D oh two is Category 2, and the next column names every missing piece: the agent isn't installed, the SQL extension isn't deployed, and Entra authentication isn't configured. Sequel F C I oh four is Category 3 whatever Arc shows. Its agent column reads "cluster: see its nodes", because a failover cluster instance has no machine of its own name, so the check doesn't guess one. Read its node machines in the snapshot for the re-platform plan.

## Slide 11 — Try it: the manifest, and a cloud not recorded

Step three opens the manifest: the arc step, read-only, with its three controls, C M eight, C M six and I A five, its three K S Is, and each file's hash. Step four tries a snapshot whose cloud isn't recorded. It copies the fixture, sets its environment to not recorded, and runs the check on it. The check throws: the Arc results came from a cloud that isn't recorded, and a G C C Moderate tenant's Arc resources are in Azure Cloud. Then Test-Path shows false. The check refused the snapshot and wrote nothing.

## Slide 12 — Try it: leave SQLPRD01's Entra setting unconfirmed

Step five leaves sequel P R D oh one's Entra setting unconfirmed. This is what every instance looks like in Lab 2, until you confirm it. The agent is connected and the extension is deployed, but with the Entra setting unconfirmed, the instance drops to Category 2, and the next column names the missing piece: Entra authentication not configured. An instance with two of the three looks ready in the portal; the kit doesn't treat it as ready. Step six runs this chapter's tests: five pass, none fail. Step seven lists your runs. There's nothing to clean up: the results stay in the run's own folder.

## Slide 13 — Lab 2: settle a test subscription's categories

Lab 2 runs on your own test subscription. It hasn't been run by the authors. You need a commercial Azure test subscription in the test tenant, which is where a G C C Moderate tenant's Arc resources live, with at least one Arc-enabled test server running SQL Server, never production. You need PowerShell 7 with the Az Accounts and Az Resource Graph modules, a person who holds Reader on the subscription and nothing more, and Module 2's Lab 2 snapshot from the same instances. Sign in and confirm the cloud, export an Arc snapshot through Resource Graph, and settle the categories as Resource Graph leaves them. Then confirm one instance's Entra setting in the portal, record it in a separate copy, and settle the categories again. Nothing in Azure changes. To back it out, sign out and delete the lab's files.

## Slide 14 — The federal requirement and the evidence the ISSO keeps

The federal requirement. Chapter 3's table maps the check to three controls in NIST SP 800-53. Recording each instance's agent, extension and host machine supports C M eight, System Component Inventory, with the snapshot as exported and the run's files as evidence. Checking each instance's Entra configuration, and refusing results from the wrong cloud, supports C M six, Configuration Settings; keep the confirmed snapshot, naming who confirmed it. And naming which instances can take Entra logins without a stored password supports I A five, Authenticator Management. Runbook R oh four lists the evidence for the deployment itself, ring by ring. K S Is are FedRAMP twenty X indicators for cloud service providers. The run's files provide evidence for each control; the agency still sets its parameters, and the assessor decides.

## Slide 15 — Check yourself: two questions on Arc

Check yourself with two questions. First: what does the check do with a snapshot whose environment isn't Azure Cloud? The answer is a: it refuses it, and writes nothing. Second: on SQL Server 2022, what does the instance use as its Entra identity? The answer is c: an app registration with a certificate in Azure Key Vault, downloaded to the host by the Arc agent. The managed identity method is SQL Server 2025's. The module page has two more questions, each linked to the section that answers it.

## Slide 16 — Summary: settle the category from evidence

To sum up. You learned what Arc gives the engine, how its Entra identity differs between SQL Server 2022 and 2025, and the sequence and checks that gate login migration. You settled four instances' categories from evidence, and saw the check refuse results from an unrecorded cloud. The evidence an I S S O keeps from this module is the Arc snapshot as Resource Graph returned it, the run's files with their manifest, and the confirmed snapshot, naming who confirmed the Entra setting and when, with the second run's manifest. Before shipping, work through Chapter 3's checklist. Next is Module 4, Entra logins and the parallel run.
