# Verification — Chapter 02, Sensitivity Label Architecture

Writer: Book 20 build (Nov 11, 2026). All sources opened Nov 11, 2026. Claims sourced to Microsoft Learn: 15.

## Claims log

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | Reference architecture planes and boundaries | The reference architecture | restated-as-design | Program design; product behavior from the Learn pages below | Nov 11, 2026 |
| 2 | External users can't see labels in apps | The reference architecture | verified | Learn, "Learn about sensitivity labels" | Nov 11, 2026 |
| 3 | Groups & sites-only labels aren't shown in Office apps | The taxonomy | verified | Learn, "Use sensitivity labels to protect collaborative workspaces" | Nov 11, 2026 |
| 4 | Label scopes; Meetings needs Files and Emails | Scopes | verified | Learn, "Learn about sensitivity labels," Label scopes | Nov 11, 2026 |
| 5 | Don't remove the Files scope from an existing label | Scopes | verified | Learn, "Manage sensitivity labels in Office apps," Scope labels to just files or emails | Nov 11, 2026 |
| 6 | Priority order; downgrade justification; sublabels share parent priority | Priority | verified | Learn, "Learn about sensitivity labels" | Nov 11, 2026 |
| 7 | Label groups replace parent labels; only name, description, color, priority | Priority | verified | Learn, "Learn about sensitivity labels" | Nov 11, 2026 |
| 8 | Modern scheme automatic for new tenants from Oct 1, 2025; irreversible; test first; applicable parent labels create a sublabel with the same GUID | Priority | verified | Learn, "Migrate parent sensitivity labels to label groups" | Nov 11, 2026 |
| 9 | Detected document sensitivity mismatch; order container labels before file labels | Container labels and priority | verified | Learn, "Use sensitivity labels to protect collaborative workspaces," Auditing | Nov 11, 2026 |
| 10 | Rights Management doesn't support non-mail-enabled security groups or exclusions | Encryption settings | verified | Learn, "Learn about sensitivity labels," What label policies can do | Nov 11, 2026 |
| 11 | A default label usually shouldn't encrypt | Encryption settings | verified | Same | Nov 11, 2026 |
| 12 | 500 labels with administrator-defined encryption | Encryption settings | verified | Same, limitations per tenant | Nov 11, 2026 |
| 13 | Marking length limits; watermarks not on email; variables | Content markings | verified | Same, What sensitivity labels can do | Nov 11, 2026 |
| 14 | Dynamic watermarking with E5/G5-level plans | Content markings | verified | Learn, "Microsoft Purview service description" | Nov 11, 2026 |
| 15 | Policy priority: highest order number wins; up to 24 hours | Publishing policies | verified | Learn, "Learn about sensitivity labels" | Nov 11, 2026 |
| 16 | Deleting a label doesn't remove it from content; the applied version is enforced | How | verified | Same, Editing or deleting | Nov 11, 2026 |
| 17 | Set-Label -Priority | How | verified | Learn, "Set-Label" syntax | Nov 11, 2026 |
| 18 | Sensitivity labels supported for all platforms in US Government tenants | Prerequisites | verified | Learn, "Learn about sensitivity labels" note | Nov 11, 2026 |
| 19 | Government availability rows | Prerequisites | verified | Learn, "Plan for Microsoft Purview compliance and risk management solutions" for GCC, GCC High and DoD deployments, Step 4 | Nov 11, 2026 |

## Government-cloud gaps

- Label-group migration rollout in GCC, GCC High and DoD: not yet specified.
