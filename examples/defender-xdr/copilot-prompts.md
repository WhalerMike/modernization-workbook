# Copilot prompts for the Defender XDR kit's inputs

Use these at work, in Microsoft 365 Copilot Chat in the agency's own tenant. Paste the template from `templates/` and the agency's own source (an Intune export, a Defender portal export, the CM-8 inventory); keep what Copilot drafts on agency storage. Check every row yourself: Copilot drafts, people decide. Never paste agency data into a public or personal tool.

## The inventory

> Here is the column list of `templates/inventory.csv` and our CM-8 device export. Draft one row per Windows device: DeviceName as the short host name, Ring from our ring groups (ring0 to ring3, servers for every server), Kind workstation or server, Role dc, dns, file, sql or app for servers (blank for workstations), Owner as a role not a person, InScope yes or no, DeviceGroup the Defender device group, ManagedBy Intune or ConfigMgr. List any device you couldn't place and why.

## The role export

> Here is the role list I exported from the Defender portal (System > Permissions > Microsoft Defender XDR > Roles) and `config/roles.json`. Write it in the columns of `templates/role-export.csv`, one row per role, permissions and groups separated by semicolons. Then list every difference from `config/roles.json`, and every group that isn't in this list of PIM-governed groups: <paste the list>.

## The ASR plan

> Here is `templates/asr-plan.template.json`, our Intune Attack Surface Reduction policy for each ring, and the change records that moved each ring. Fill each ring's rules with the mode the policy sets (audit, warn, block or off) and the date of the change record that set it. Flag any rule in warn that Microsoft says doesn't support warn: the LSASS rule (9e6c4e1f-7d60-472f-ba1a-a39ef669e4b2) and the Office code-injection rule (75668c1f-73b5-4cf0-bb93-3ecf5cb7cc84).

## The exclusion registers

> Here is `templates/asr-exclusions.csv` and the exclusions in our ASR policy (ASR only per rule exclusions and Attack surface reduction only exclusions). Draft one row per exclusion, with the rule GUID or * for a global one, the exact path (a folder ends with \), the decision, an owner role, the approver and an expiry no more than a year out. List the exclusions with no approver.

## The device groups and attack disruption exclusions

> Here is the Device groups page I exported from the Defender portal, and the Automated response exclusions (Identities, Devices). Fill `templates/device-groups.csv` with each group's remediation level, exactly as the portal names it, and its kind (workstation, pilot or server). Fill `templates/automation-exclusions.csv` with each excluded identity, device group and IP range, its approver and its review date. Tell me whether every emergency access account in this list is excluded: <paste the list>.

## A detection rule

> Here is `templates/detection-rule.template.json` and `templates/detection-rule.template.test.json`, and the KQL our detection engineer tested in advanced hunting. Draft the rule file with status disabled and no automated actions, and the test file naming the table the query starts from, a known-bad window that holds our ring 0 replay and a quiet known-good window, both within the last 30 days.

## Reviewing a run

> Here are `tickets.csv`, `drift.csv` and `readiness.csv` from this month's Defender XDR run. Summarize, for the change board, what needs an owner this week, which ASR rules can move to their next stage and which are held and why. Don't add anything the files don't say.
