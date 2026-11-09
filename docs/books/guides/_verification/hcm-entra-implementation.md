# Verification — Building Book 03's HR Pipeline: Oracle Fusion Cloud HCM to Microsoft Entra ID (research)

File: `docs/books/guides/hcm-entra-implementation.md`

The page's claims were checked on 2026-10-25 and are footnoted on the page. This log records later re-checks.

## Source watch, November 9, 2026

Re-checked after the weekly source watch (issue #499) reported a change in a cited source. Checked November 9, 2026; no personal data sent to any site.

| Finding | Change |
|---|---|
| FedRAMP Marketplace `products.json` (`last_change` 2026-11-09T05:06:48Z): Fusion Cloud (F1603257882) now shows 9 authorizations, not 10; it is still FedRAMP Certified, Class C, agency path, SaaS, Government Community Cloud, certified January 13, 2020 (event log). The data now reports `impact_level` as `Unknown` and `cert_date` as empty for every listing | Count updated in the body and footnote `he-fr`, dated; Moderate kept, as Class C is the former Moderate baseline |
| Microsoft Graph user resource type (distribution lists added) and permissions reference (new `HardDeletionSetting` permissions) | No effect: the property limits and `ProvisioningLog.Read.All` the page cites are unchanged |
