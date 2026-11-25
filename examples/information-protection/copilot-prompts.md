# Prompts for filling the kit's inputs at work

Use these in Microsoft 365 Copilot Chat at work, with the agency's own documents. Paste the answer into the template, check every line yourself, and keep the filled file inside the agency's boundary. Copilot drafts; the policy owner and platform owner decide.

## The protection plan (`templates/protection-plan.example.json`)

> From the attached label design table and the decision records, list each sensitivity label as JSON: `name`, `priority` (0 is lowest), `encryption` (true or false), `header` (the header marking text, or empty), and `rightsTo` (the groups or domain the encryption grants rights to). Use only what the documents say; write "UNKNOWN" where they don't.

> From the attached rollout plan, list each DLP policy and auto-labeling policy with its current stage: `simulation`, `notify`, `enforce` or `retired`. Name the change record that approved each move to `enforce`.

## The role register (`templates/role-register.csv`)

> From the attached insider risk charter and role assignments, list each Purview role group and the people who should hold it, with the approver and the next review date, as CSV with the columns roleGroup, member, approvedBy, reviewBy.

## The class register (`templates/class-register.csv`)

> From the attached data class register, list each class with its owner (a role), its label and the sensitive information types that find it, separated by semicolons, as CSV with the columns class, owner, label, sits.

## The exception register (`templates/exceptions.csv`)

> From the attached DLP exception approvals, list each exception as CSV with the columns id, kind (dlp-recipient-domain or dlp-sender-group), policy, target, approver, expires (yyyy-mm-dd) and reason. Flag any approval with no expiry date.

## Reading a run

> Here is `results.csv` from the kit's labels check. For each failed row, say in one sentence what changed in the tenant and which Book 20 chapter's rollback applies. Don't propose changes to the tenant.
