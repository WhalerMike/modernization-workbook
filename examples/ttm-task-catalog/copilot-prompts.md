# Copilot prompts for the Ticket-to-Machine task catalog

Use these prompts to fill in and review `catalog_template.xlsx`. Each prompt is ready to copy. Paste it, then paste what it asks for.

## Before you use Copilot

- **Use only your agency's approved tools.** Use Microsoft 365 Copilot Chat signed in with your work account. If your license shows a Work and Web choice, choose Work. Use GitHub Copilot only in a repository your agency hosts inside its boundary. Never use a personal account, a personal repository or a public repository.
- **Check what your agency allows.** Your agency's AI-use policy decides what you may paste. Ask your ISSO before you paste details of how systems are administered.
- **Copilot drafts. You decide.** Check every suggestion against the workbook (the Lists, Controls and Checks sheets) and with your ISSO. A suggestion is not an approval, and it is not evidence.
- **Paste the column list every time.** Each prompt asks for it, so Copilot uses the template's exact columns and values.

### The column list to paste

Copy this block where a prompt says *[paste the column list]*.

```text
Columns, in order:
Task ID | Task name | Lane | Trigger | Source system | Target system | Drift class | Severity |
C1 Origin (who asks) | C2 Approver role (who approves) | C3 Action (what runs) |
C3 Executing identity (as which identity) | Identity type | Identity sponsor | High impact |
Human approval before action | C4 Re-read check (how closure is proven) | Re-read by | Re-read system |
Response window | C5 Evidence kept | NIST SP 800-53 controls | KSIs | Owner | Status | Notes

Allowed values:
Lane: Machine, autonomous | Machine, gated | Human decision | Protocol-enforced | Declared exception
Trigger: event | schedule | request | request (automated intake)
Drift class: missing_identity | stale_access | orphan_account | attribute_drift | unauthorized_write |
  credential_drift | schema_drift | none
Severity: P1 | P2 | P3 | P4 (windows: P1 immediate, P2 1 hour, P3 24 hours, P4 72 hours)
Default severity by class: missing_identity, stale_access, orphan_account, unauthorized_write,
  credential_drift = P2; attribute_drift, schema_drift = P3
Classes a person decides first: missing_identity, orphan_account, unauthorized_write
Identity type: Person (time-boxed role) | Service identity | Managed or workload identity | AI agent | Protocol client
High impact, Human approval before action: yes | no
Re-read by: Independent checker | The identity that acted
Re-read system: isc_account | isc_identity | entra_user | other
Status: Draft | In review | Approved | Retired
```

## Prompts for Microsoft 365 Copilot Chat

Open Copilot Chat with your work account. If you upload the workbook, it is stored in your OneDrive under your agency's controls. Pasting text works too.

### 1. Turn one task description into a catalog row

```text
You are helping me fill in a Ticket-to-Machine task catalog. Use only the columns and allowed values below.
[paste the column list]

Here is one day-to-day task, in my words:
[paste the task description]

Write one catalog row as a table with one column per catalog column. Use only allowed values in the
drop-down columns. Leave a cell blank and say why if my description doesn't tell you the answer.
Don't invent system names, people or controls. List your open questions after the row.
```

### 2. Find the gaps in a row

```text
Here is the catalog's column list and one row.
[paste the column list]
[paste the row]

Check the row against these rules and list every failure:
1. Owner, C2 Approver role and C4 Re-read check must not be blank.
2. If Severity differs from the drift class's default, Notes must explain why.
3. A class a person decides first must not use a Machine lane.
4. C5 Evidence kept must not be blank.
5. NIST SP 800-53 controls must not be blank.
6. If High impact is yes, Human approval before action must be yes.
7. If Identity type is AI agent: Identity sponsor must not be blank; a high-impact task or a class a person
   decides first needs Human approval before action = yes; Re-read by must be Independent checker.
Also say if the approver could be the requester, or if C4 reads only a ticket status.
```

### 3. Propose the re-read check

```text
[paste the column list]
[paste the row]

Propose the C4 Re-read check for this task. It must read the real system after the change, not the
ticket status or the tool's success message. Say which system to read, what to read, and the exact
value that proves the task is done. Give one sentence for C4 and one for Re-read system.
```

### 4. Propose the drift class and severity, with the reason

```text
[paste the column list]
[paste the row, or the task description]

Propose the Drift class and Severity. Use only the allowed values. Give the reason in two sentences.
If the task is a request or a routine event and not drift, say none. If your severity differs from the
class default, write the sentence I should put in Notes.
```

### 5. Map controls and KSIs from the Controls sheet

```text
Here is the Controls sheet from my catalog workbook, and one row.
[paste the Controls sheet: the task types table and the control-to-indicator table]
[paste the row]

Pick the closest task type and suggest NIST SP 800-53 controls from that sheet only. Then list the KSIs
the sheet maps to those controls. Don't add controls or KSIs that aren't on the sheet. Remind me that
KSIs are FedRAMP 20x indicators for cloud providers, and my ISSO decides our controls.
```

### 6. Turn a row into a ServiceNow catalog item description

```text
[paste the column list]
[paste the row]

Write a ServiceNow catalog item description for this task. Include: what the requester gets, the
questions the form must ask, who approves (from C2), what runs and as which identity (C3), the
re-read that closes it (C4), the response window, and what evidence the record keeps (C5). Use plain,
short sentences. Don't name people. Don't include passwords, keys or other secrets.
```

### 7. Review the whole sheet for duplicates

```text
[paste the column list]
[paste all the rows from the Tasks sheet]

Find rows that describe the same task in different words, or overlap so much they should merge. For
each pair, say which columns match and which differ, and suggest one merged row. Also list any Task ID
used twice.
```

### 8. Is this task safe for an AI agent to perform?

```text
[paste the column list]
[paste the row]

Is this task safe for an AI agent to perform? What must a human approve?
Answer in this order:
1. Could a mistake be hard to undo or reach many people? Should High impact be yes?
2. What must a person approve before the agent acts? Admin consent, app deletion and ImmutableId
   changes always need a person's approval, even when an agent prepares them.
3. The agent's identity: who sponsors it, which scoped roles it needs, and confirm it has no standing
   admin rights.
4. The independent re-read that closes the task. The agent's own report of success isn't evidence.
5. What the log must show, with the agent's identity kept apart from people's.
```

## Prompts for GitHub Copilot (agency-hosted repository only)

Use these only when the catalog CSV lives in a repository your agency hosts inside its boundary. Never paste catalog rows into a personal or public repository, or into a chat tied to one. Confirm with your agency that GitHub Copilot is approved for that repository.

### 9. Add a row to the CSV

```text
In catalog.csv, add a row for the task below. Keep the exact header order:
[paste the column list]
Task: [paste the task description]
Use only the allowed values. Leave cells blank where the task doesn't say. Don't change other rows.
```

### 10. Run the checker and explain the result

```text
Run: python check_catalog.py catalog.csv
For each row marked FIX, explain the failed rule in one sentence and propose the smallest change that
fixes it. Don't change Owner, approvers or controls without asking me.
```

### 11. Draft the ticket contract

```text
Run: python check_catalog.py catalog.csv --payloads payloads
Then run: python ../servicenow-sailpoint/clients/python/finding_contract.py --validate payloads/payloads.json
Explain each contract warning. Remind me that payloads carry SAMPLE identifiers to replace.
```

Prompts 2 to 8 also work in GitHub Copilot Chat on the CSV. Check the answers the same way.
