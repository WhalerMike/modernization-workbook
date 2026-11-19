# Copilot prompts for the daily checks workbook kit

The kit ships neutral, fictional settings. The agency's own settings file (its tenant, subscription, workspace and emergency access object IDs), the deployment plans and the evidence are filled and kept at work, on agency storage, and never committed to this public repository. These prompts are for Microsoft 365 Copilot Chat in the agency's own tenant. Paste the file, then the prompt. Review every answer: Copilot drafts, a person decides.

## Fill the settings file

> Using the attached `settings.template.json`, draft a settings file for our `<test-or-production>` environment from the attached notes. Fill only values that appear in the notes; leave any value you can't find as its `<placeholder>`. `cloud` stays `AzureCloud`. Put the emergency access accounts' object IDs, not their names, in `emergencyAccessObjectIds`. Don't add any password, key or secret.

## Find the right ProductName and ComplianceState values

> Here are the distinct `ProductName` values from our `SecurityAlert` table and the distinct `ComplianceState` values from our `IntuneDeviceComplianceOrg` table (attached query results). Which `ProductName` values look like Purview data loss prevention or sensitivity label alerts, and which `ComplianceState` value means compliant? List them; say which you are unsure of. Don't change any file.

## Read the what-if result

> This is the what-if result for our daily checks workbook deployment (`whatif.json`). List every change with its change type and resource. Say plainly whether anything other than one `Microsoft.Insights/workbooks` resource would be created or modified, and whether anything would be deleted.

## Explain a dark source

> The telemetry completeness tab shows `<table>` as Dark: its newest record is `<minutes>` minutes old against a limit of `<limit>`. In three sentences, say which daily checks on the other tabs can't be trusted until it recovers, and what task the operator should open. Don't suggest raising the limit.
