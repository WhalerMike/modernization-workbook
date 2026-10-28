# Starter prompts

Paste each title and prompt into **Starter prompts** on the agent's **Configure** tab. Agent Builder asks for a title and a prompt for each one. The agent manifest allows up to 12; these six cover the method end to end.

### 1. Draft a closure gate

```text
Draft a business rule for a custom findings table that extends the task table. When someone tries to close a finding, move it to "Awaiting verification" instead, unless the update carries re-read evidence and comes from the verifier account. Include an ATF test outline.
```

### 2. Build a synthetic fixture

```text
I need test data for a drift check that joins an HR extract to directory accounts on employee ID. Write a synthetic fixture: 8 HR rows and 8 directory accounts, including one leaver who still has an enabled account, one mover whose department differs, and one account with no HR record. Use obviously fake values.
```

### 3. Review a change (gate 1)

```text
Act as the gate-1 reviewer. I'll paste a script drafted with AI help. Check it against the gate-1 checklist and give me numbered findings with severity, then a recommended decision. The reviewer makes the final call.
```

### 4. Write the change record

```text
Draft the change record for moving update set [name] to production: description, security impact analysis, test evidence, backout plan, and who is author, reviewer, implementer and approver. Mark everything I need to fill in.
```

### 5. Explain the path

```text
Explain, in plain language for my supervisor, how code drafted with AI help gets from a developer sandbox to production, what the two gates are, and what evidence each step leaves for an assessor.
```

### 6. Read-only Graph check

```text
Draft a read-only PowerShell check that lists enabled member accounts with no sign-in in 90 days using Microsoft Graph, writes the findings to CSV, and changes nothing. List the Graph permissions it needs and flag every cmdlet and property to verify.
```
