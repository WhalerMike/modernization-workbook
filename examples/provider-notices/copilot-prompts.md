# Copilot prompts for provider notice routing

Use these prompts to decide your agency's routing: which provider notices matter, who owns them and how fast they are triaged. Each prompt is ready to copy. Paste it into Copilot, then paste what it asks for.

The kit reads what providers publish. Your routing is the agency's part, so you write it at work, in [`templates/routing-worksheet.csv`](templates/routing-worksheet.csv) or [`templates/routing.template.json`](templates/routing.template.json).

## Before you use Copilot

- **Use only your agency's approved tools.** Use Microsoft 365 Copilot Chat signed in with your work account. If your license shows a Work and Web choice, choose Work. Use GitHub Copilot only in a repository your agency hosts inside its boundary. Never use a personal account, a personal repository or a public repository.
- **Check what your agency allows.** Your agency's AI-use policy decides what you may paste. Ask your ISSO before you paste notice text, team names or anything about how your systems are run.
- **Copilot drafts. You decide.** Check every suggestion against the kit's rules (below) and with your ISSO. A suggestion is not an approval, and it is not evidence.
- **Nothing comes back to the public workbook.** Your routing, your notices and your digests stay inside your agency. Don't open an issue or a pull request with them, and don't paste them anywhere outside your agency.

### The rules to paste

Copy this block where a prompt says *[paste the rules]*.

```text
Routing rules for provider notices. Use only these keys and values.

A notice has: provider (azure, m365, oci, aws, google), kind (maintenance, retirement,
advisory, security, change, incident), status (open, closed), actionRequired (true or false),
services (names), regions (names), resources (IDs the provider says are affected).

A rule has:
  id: R01, R02, ... (tried in order; the first rule whose every match key matches wins)
  name: a few words
  match: any of provider [list], kind [list], status [list], actionRequired true|false,
         hasResources true|false, servicePattern (regular expression), regionPattern (regular expression)
  route: task (a Ticket-to-Machine task to an assignment group) | digest (weekly digest only) | ignore
  severity (task only): P1 | P2 | P3 | P4  (time to triage: P1 immediate, P2 1 hour, P3 24 hours, P4 72 hours)
  assignmentGroup (task only): the group that owns the task
  approverRole: the role that approves the response (C2 of the request chain)
  contingencyReview: true when the notice should trigger a contingency plan review (retirements, maintenance)
A notice no rule matches takes the defaults (route digest, severity P4).

Worksheet columns: Rule ID | Rule name | Provider | Kind | Status | Action required |
Names our resources | Service pattern | Region pattern | Route | Severity | Assignment group |
Approver role | Contingency review | Owner | Notes
```

## Prompts for Microsoft 365 Copilot Chat

Open Copilot Chat with your work account. If you upload the worksheet, it is stored in your OneDrive under your agency's controls. Pasting text works too.

### 1. Draft the routing from your own notes

```text
You are helping me write routing rules for cloud provider notices. Use only the keys and values below.
[paste the rules]

Here is how our teams split the work today, in my words:
---
[describe who handles Azure, Microsoft 365, Oracle Cloud Infrastructure, AWS and Google Cloud
notices; who handles security advisories; who plans changes for retirements; who runs the service desk]
---

Draft one worksheet row per rule, in order, most specific first. Use the worksheet columns.
Put security advisories and retirements before the general "action required" rule.
For each row, add a one-line reason in Notes. Mark any value you had to guess with "CHECK".
```

### 2. Decide which notices matter

```text
Here are the services we use from each provider:
---
[list the services per provider, for example: Azure Virtual Machines, Azure SQL Database;
Microsoft 365 Exchange Online, SharePoint Online; OCI Base Database Service; ...]
---

Using the rules below, propose:
1. servicePattern rules that send notices for services we don't use to "ignore";
2. any provider or region we should route differently, with a reason.
[paste the rules]
Don't ignore security advisories or retirements for any service we use.
```

### 3. Review a draft routing file

```text
Review this routing file against the rules below. List, as a table:
- rules that can never match because an earlier rule catches every notice they would match;
- task rules with no severity or no assignment group;
- security advisories or retirements that end up in "digest" or "ignore";
- placeholders still in the file (text in angle brackets).
Don't rewrite the file; only list the problems.
[paste the rules]
---
[paste routing.json, or the worksheet rows]
```

### 4. Turn the worksheet into routing.json

```text
Turn these worksheet rows into a routing.json file with this shape:
{ "version": 1,
  "defaults": { "route": "...", "severity": "...", "assignmentGroup": "...", "approverRole": "...", "contingencyReview": false },
  "rules": [ { "id": "...", "name": "...", "match": { ... }, "route": "...", "severity": "...",
               "assignmentGroup": "...", "approverRole": "...", "contingencyReview": true|false } ] }
Lists (provider, kind, status) are JSON arrays. Leave out empty match keys. The "default" row is "defaults".
[paste the rules]
---
[paste the worksheet rows]
```

Then check the file the way the kit does: `Read-PnRouting` refuses an unknown match key, a task rule without a severity or assignment group, and a placeholder left in.

### 5. Summarize this week's digest for a meeting

```text
Here is this week's provider notices digest (digest.md). Summarize it in five bullets for the
change advisory board: what needs a decision this week, what maintenance falls in the next two
weeks, and which retirements have a due date in the next 90 days. Quote the notice IDs.
Don't add anything that isn't in the digest.
---
[paste digest.md]
```

## Prompts for GitHub Copilot (agency-hosted repository only)

Use these only in a repository your agency hosts inside its boundary.

```text
Read config/routing.json and templates/routing.template.json in this repository. Write
routing.<environment>.json from my worksheet in templates/routing-worksheet.csv, then run:
pwsh -NoProfile -Command "Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1; Read-PnRouting -Path routing.<environment>.json"
and fix anything it refuses. Don't change the kit's code.
```

## Where to keep what you write

- The routing file, the worksheet, the settings files, the run folders, the digests and the evidence stay on agency OneDrive, SharePoint or Teams, or in a repository your agency hosts.
- **The routing names who owns which cloud.** Ask your ISSO how to label it and who may see it.
- The kit's own fixtures and examples are fictional (`contoso.example`). Nothing in them describes a real agency.
