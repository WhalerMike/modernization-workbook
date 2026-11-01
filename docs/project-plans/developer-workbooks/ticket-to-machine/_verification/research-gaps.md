# Research gaps — Building Ticket-to-Machine

Open questions the chapters couldn't settle from vendor documentation on November 1, 2026. Chapter NN uses rows (NN − 1) × 10 + 1 to NN × 10 − 1. Close a row by recording what settled it and the date.

| Row | Chapter | Question | Why it matters | How to settle it |
|---|---|---|---|---|
| 1 | 01 | The current ServiceNow developer-instance reclamation rule (the docs page says ten days unused; July 2026 community posts describe an added age condition) | Lab work can be lost | ServiceNow Developer Site announcements |
| 11 | 02 | Whether the client-credentials token's optional `scope` can narrow access to a custom table | A tighter token than the integration user's roles | Test on a developer instance |
| 21 | 03 | How an agency obtains a SailPoint sandbox tenant | Lab 2 depends on it | Ask SailPoint |
| 22 | 03 | The API domain of an ISC FedRAMP tenant | `SAILPOINT_API_BASE` | The tenant's `/oauth/info`; SailPoint |
| 31 | 04 | The shape of items in `entitlementChanges[].added` and `removed` (the kit reads `value`) | The revert of an added entitlement | A saved native-change input from a sandbox |
| 61 | 07 | The format and time zone of date and time values the Table API returns on a given instance | Window adherence | Chapter 07, Lab 2, step 3 |
| 62 | 07 | What the ISC `events` index holds, and for how long | The SailPoint half of the evidence export | SailPoint documentation or support |
| 71 | 08 | Why Learn lists `CustomSecAttributeProvisioning.Read.All` as the least-privileged application permission for reading a synchronization schema | The Graph grant for the export | Test in a tenant; Learn feedback |
| 72 | 08 | The `targetDirectoryName` an HR inbound provisioning job uses for Entra ID | `--entra-directory` | A test tenant's schema export |
| 73 | 08 | How SailPoint's Entra connector field names map to Entra attributes | The alias list | The source's account schema in a sandbox |
| 74 | 08 | Whether SailPoint writes Entra attributes outside provisioning policies | A writer the check misses | SailPoint documentation for the Entra source |
