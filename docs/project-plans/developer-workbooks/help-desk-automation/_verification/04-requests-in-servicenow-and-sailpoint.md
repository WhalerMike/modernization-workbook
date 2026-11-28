# Verification — Chapter 04, Requests In: ServiceNow Catalog Items and the SailPoint Approval

New material, written November 27, 2026. Code: `servicenow/` (catalog-items.json, the business rule, the clearing job, acl.md), `sailpoint/access-profiles.json`, `config/request-items.json`. SailPoint facts were read on November 27, 2026 from SailPoint's published v3 API specification on GitHub (`sailpoint-oss/api-specs`, `idn/v3`). ServiceNow facts are carried from *Building Ticket-to-Machine*, Chapter 02. Lab 1 was run with `python scripts/kit_captures.py ht` on November 27, 2026; the output is `data/kit-captures/ht/04-*.txt`.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | `accessRequestConfig`: `commentsRequired`, `denialCommentsRequired`, `approvalSchemes` (quoted description) | Start with; Verified facts | verified Nov 27 (`access/Requestability.yaml`) | `ht04-scheme` |
| 2 | `approverType` nine values; `approverId` use | Start with; Verified facts | verified Nov 27 (`access/AccessProfileApprovalScheme.yaml`) | `ht04-scheme` |
| 3 | create/get/delete access profile; scopes; user levels | Start with; Lab 2 | verified Nov 27 (`paths/access-profiles.yaml`, `access-profile.yaml`) | `ht04-profiles` |
| 4 | access request status: scope, `ORG_ADMIN`, filter | Start with | verified Nov 27 | `ht04-status` |
| 5 | ServiceNow Table, Attachment, OAuth | Start with | carried (TTM Ch02, Nov 1) | `ht04-table` |
| 6 | The templates' items, fields, roles, rule states, profiles | The code | read in the templates and tests | kit |
| 7 | Lab 1 outputs | Lab 1 | verified by running the commands | `data/kit-captures/ht/04-*.txt` |
| 8 | Lab 2 behavior | Lab 2 | not run | — |

## Not yet specified

N1 the ServiceNow field type `password2` and `gs.minutesAgo` (no ServiceNow page read here); N2 the tables `sc_cat_item` and `item_option_new` and the dot-walked query Lab 2 step 4 uses; N3 the system access management tool's interface for submitting to SailPoint; N4 whether the sandbox accepts the template's profiles with only the fields shown (SailPoint's create may require more, such as a description).

## Federal requirements and evidence

Four rows, using only the controls and KSIs `config/requirements.json` gives `typed-change`, `password-reset`, `authenticator-reset` and `account-create`. No new pair.

## Overlap search (origin/main, November 27, 2026)

Searched for "catalog item", "access profile", "approvalSchemes", "u_automation_state", "access management tool", "WD-174", "WD-182". Found: *Building Ticket-to-Machine*, Chapters 02 and 03 (the clients, scopes and least privilege; linked, not restated); Book 15, Chapter 05 (the service catalogs) and the illustrative item names Chapter 12 gives, such as `entra.credential.password_reset`, which differ from the kit's display names: the kit's are a template the agency renames, and `config/request-items.json` holds the mapping; not a conflicting fact, noted for review; the managed service account guide's SailPoint enforcement (WD-174; consistent: SailPoint approves, ServiceNow records).

## Noted for the owner

The access profiles give the password reset one approval step (a governance group), and the typed change and cloud account two. Book 15, Chapter 12 asks for a second approver for "a privileged or sensitive account" on an authenticator reset; the kit requires two for every authenticator reset and refuses privileged accounts. Consistent, and stricter.
