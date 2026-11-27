# Copilot prompts for the help desk automation pack

Use these in Microsoft 365 Copilot Chat at work, with your agency's own procedures open. Nothing you write goes back to the public workbook.

## Turn an emailed command into typed changes

> Here is a procedure in which the help desk runs a command that arrives in a request (paste the procedure). List each distinct change the command makes to a user: the property it sets and the values it ever takes. For each, write one entry in this JSON shape: `{ "id": "set-<what>", "property": "<Graph user property>", "allowed": [<values>] }` or, for free text, `"pattern": "<regular expression>"`. Leave out anything that isn't a change to one user's property, and list those separately with what they do.

## Check the typed changes against the source of authority

> For each entry in this list of typed changes (paste your copy of `typed-changes.json`), say whether the property is written by the HR system, by directory synchronization from on-premises Active Directory, or only in the cloud, in our environment. A change whose property comes from HR or on-premises belongs there, not in the help desk.

## Set the consent review's limits

> Our admin consent requests are decided by (name the role). How many days should a request wait before it's escalated, and which Microsoft Graph permissions should always go to that approver rather than be approved on a quick review? Give the answer as `maxAgeDays` and a list of permission patterns such as `*.ReadWrite.All`.

## Write the ServiceNow catalog item

> Write the variables for a ServiceNow catalog item "Typed user change" with exactly these inputs: the request number, the user's principal name, the change (a choice list of these ids: paste the ids) and the value. No free-text command field. Add a help text for each variable.
