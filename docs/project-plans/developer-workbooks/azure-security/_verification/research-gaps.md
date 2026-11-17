# Research gaps — Building Azure Security

Open questions from writing the workbook, November 17, 2026. Each row names the chapter and the lab step that would close it.

| # | Gap | Chapter | How to close it |
|---|---|---|---|
| 1 | Learn's reference shows Diagnostic Settings - List only at `2021-05-01-preview`; no GA version was found on the page | 01 | Re-read the reference; switch `config/calls.json` when a GA version is listed |
| 2 | The export format of Defender for Cloud's internet exposure analysis isn't fixed here; the kit reads only a `resourceId` column | 02 | Lab 2 step 3: export from the portal and record the columns |
| 3 | A load balancer frontend's protection depends on its backend network; the kit reports it as unknown (AZS-DD-02) | 03 | Lab 2 step 4: resolve by hand; decide whether to read backend pools |
| 4 | The WAF's JavaScript challenge, Front Door's CAPTCHA and Application Gateway's HTTP DDoS rule set (Zero Trust checks) aren't read | 04 | Read the rule-set and custom-rule shapes on Learn; add rules to `config/rules.json` |
| 5 | The WAF policies' Resource Graph columns are the ARM names the guide's Validate query uses, not read from a Resource Graph sample | 04 | Lab 2 step 4 |
| 6 | Front Door origin groups' `healthProbeSettings` and custom domains' `tlsSettings.minimumTlsVersion` (and whether `TLS13` exists) weren't read on Learn | 05 | Read the AFD origin groups and custom domains references; Lab 2 step 4 |
| 7 | Origin lock-down is read from configuration; the guide's test is a refused request | 05 | Lab 2 step 5 on every origin the kit calls locked |
| 8 | Declared routes, not effective routes; system and BGP routes can win | 06 | Lab 2 step 4 with `az network nic show-effective-route-table` |
| 9 | Key rotation policies are data-plane reads the kit doesn't make | 07 | Decide whether a data-plane reader (and network path) belongs in the kit |
| 10 | 18 of 33 calls are marked unverified (Resource Graph columns read by their ARM names); live runs need `-AllowUnverified` | 01 to 08 | Each chapter's Lab 2; flip `verified` in `config/calls.json` with the page that confirms it |
| 11 | No Microsoft sample is pinned under `examples/third_party/`: the chapters start from the guide's Learn commands and queries, which live in Learn pages, not a sample repository | All | If the editor wants the pinned-copy pattern of the other workbooks, pin the Learn page sources (`MicrosoftDocs/*`) for the Resource Graph policy samples and the Key Vault Private Link page |
| 12 | The fixtures' Resource Graph shapes follow `az graph query -o json` (`count`, `data`, `skip_token`, `total_count`) as the provider notices kit reads them; not re-read on Learn | 01 | Lab 2 step 3 of any chapter |
