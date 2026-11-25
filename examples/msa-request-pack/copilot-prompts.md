# Copilot prompts for the managed service account request pack

Use these prompts to fill in the request forms and `request_template.csv`. Each prompt is ready to copy. Paste it, then paste what it asks for.

## Before you use Copilot

- **Use only your agency's approved tools.** Use Microsoft 365 Copilot Chat signed in with your work account. If your license shows a Work and Web choice, choose Work. Never use a personal account or a public repository.
- **Check what your agency allows.** Your agency's AI-use policy decides what you may paste. Ask your ISSO before you paste server names or account details.
- **Copilot drafts. You decide.** Run `Test-MsaRequest.ps1` on every row Copilot drafts. A suggestion is not an approval, and it is not evidence.

### The column list to paste

```text
Columns, in order:
RequestId | RequestedOn | RequestKind | SystemId | AppShortName | AccountType | Role | Hosts | Workload |
NeedsSpn | Spns | OutboundOnlyReason | Owner1 | Owner2 | Sponsor | SponsorIsFederalEmployee | RiskTier |
Environment | EntraTarget | EndDate | Supersedes | RunByPerson

Rules:
RequestKind: New | Migrate (Migrate names the old account in Supersedes)
AppShortName: lowercase letters and digits, starting with a letter; the system's short name, the same one it will use in Entra
AccountType: gMSA | dMSA (dMSA only for Migrate, where every host runs Windows Server 2025)
Role: blank, or sql | agt | rs | is | web | svc | task, only where the system needs more than one account
Name: gmsa-<app> or gmsa-<app>-<role>, 15 characters or fewer before the $
Hosts, Spns: separated by semicolons; an SPN is <service-class>/<host>[:<port>]
Workload: Service | IisAppPool | ScheduledTask
NeedsSpn, SponsorIsFederalEmployee, RunByPerson: yes | no
Owner1, Owner2: two different people, by user principal name; Sponsor: a federal employee who isn't an owner
RiskTier: R1 | R2 | R3; Environment: prod | test | dev
EntraTarget: ManagedIdentity | AppRegistrationFederated | AppRegistrationCertificate | GmsaPlusAppRegistration | KeepKerberos | Retire | Undecided
EndDate: yyyy-mm-dd, only for KeepKerberos
```

## 1. Draft a row from what you know

> I need a managed service account request row. [paste the column list] Here is what I know about the workload: [describe the system, its servers, what runs as the account, how clients connect, the owners and sponsor]. Draft one CSV row. Leave a field blank and list it under "Questions" when I haven't told you the answer. Don't invent server names, SPNs or people.

## 2. Find the SPNs a workload needs

> [paste the column list] The workload is [SQL Server on <host> port <port> | an IIS site at <url> | a file share on <host>]. Which SPNs does it need, in the form <service-class>/<host>[:<port>]? Say which ones depend on how clients connect, and what I should check with `setspn -L` on the old account.

## 3. Check a row before you run the checker

> [paste the column list] Check this row against the rules and list every rule it breaks, with the column: [paste the row]

## 4. Explain a finding

> The request checker printed this finding: [paste the finding line]. Explain what it means and what to change in the row, using only the rules in this list: [paste the column list]
