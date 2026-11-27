# ServiceNow roles and access for the request pipeline (template)

Example names (`x_example_hda`); create them in your instance's scope.

| Role | Held by | Can |
|---|---|---|
| `x_example_hda.pipeline` | The pipeline's integration user only (an inbound OAuth client with client credentials, its own user) | Read `sc_req_item` rows of the four catalog items and their `sc_item_option_mtom` variables; write only `u_automation_state`, `work_notes` and `u_one_time_secret` on them; create attachments on them. Nothing else |
| `x_example_hda.secret_reader` | The service desk group that verifies identity | Read `u_one_time_secret` on items assigned to their group, to read it to the verified person on a separate channel |
| `x_example_hda.verifier` | Service desk agents | Write `u_identity_verified_by` and `u_identity_verification_method` |

- No role can write `u_isc_access_request_id` except the access management hand-off.
- The person who opened the request can't set its verification (the pipeline also refuses it, HT-RQ-01).
- The pipeline's client secret is in an environment variable on the platform host for the pipeline's gMSA only (WD-182), never in the settings file.
