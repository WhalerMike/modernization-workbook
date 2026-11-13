# Verification — Learning path: Azure Security Engineering

Files: `docs/training/azure-security/index.md` and its five modules, `01-the-baseline-and-the-exposure-register.md` to `05-policy-drift-and-evidence.md`.
Example code: none. The guide has no kit in `examples/` and no developer workbook yet.
Verified: 2026-11-13

Method:
- The path adds no new facts about the services. Every fact a module states is carried by link from the Azure Security Engineering implementation guide (`docs/books/guides/azure-security-implementation.md`, draft of November 11, 2026, review pending) and relies on its verification log (`docs/books/guides/_verification/azure-security-implementation.md`) and footnotes (Microsoft Learn pages read November 11, 2026; NIST SP 800-53 Rev. 5 and 800-53B; FIPS 200; fedramp.gov's 2026 KSI theme pages; AWS, Google Cloud and Oracle documentation). New writing is limited to the path, the module framing, objectives, unit glue, knowledge-check questions, time estimates and the lab steps listed below.
- Each knowledge-check answer links the section that teaches it; the answer was checked against that section's text.
- Requirement and KSI rows in each module are the guide's "Requirements and KSIs by step" rows, unchanged, with the control names from NIST SP 800-53 Rev. 5.
- Slide references in the Watch lines are the guide deck's slide titles in `presentations/guide-azure-security/Guide_Azure_Security_Narration_Script.md` (built November 13, 2026). The deck's video isn't on the Presentations page yet, so the path links the narration script.

Labs:
- Every lab is a Lab 2 in a test subscription. None was run by the authors, as each lab says. Expected results are the guide's **Validate** statements; no output is shown.
- Commands taken from the guide unchanged (placeholders as the guide's): the sign-in and extensions (Prerequisites); `az policy assignment list` and the platform-resource query (Step 1); the four inventory queries (Step 2); `az network application-gateway waf-policy show` with its query (Step 4 Validate); `az network nic show-effective-route-table` and `az network firewall policy show` with its query (Step 6 Validate); `nslookup` (Step 7 Validate); `az keyvault show` with its query (Step 8 Validate); `az policy definition list`, `az policy state summarize` and `az policy state list` (Step 9).
- Commands the path adds, as read-only checks or evidence exports, each a standard Azure CLI, Az PowerShell or Windows command: `az monitor diagnostic-settings list`, `az network ddos-protection show` (named in the guide's Step 3 evidence checklist), `az monitor metrics alert show`, `az webapp config access-restriction show`, `Get-AzApplicationGatewaySslPolicy`, `az network private-endpoint dns-zone-group list`, `az keyvault key rotation-policy show`, `az keyvault secret show`, `az login --identity`, `az policy assignment show`, `curl.exe` test requests, and PowerShell filters over the Resource Graph output's `data` array.
- Module 3's failover test uses `az webapp stop` and `az webapp start` on a test origin, following the guide's Step 5 note that Learn's Front Door quickstart stops one origin to show failover.
- Read on Microsoft Learn on November 13, 2026, for the lab's log queries and listing only:
  - "Diagnostic logs for Application Gateway" (resource-specific tables `AGWAccessLogs`, `AGWPerformanceLogs`, `AGWFirewallLogs`), <https://learn.microsoft.com/azure/application-gateway/application-gateway-diagnostics> (Module 2, step 6).
  - "Monitoring data reference for Azure Firewall" (resource-specific table `AZFWThreatIntel` for threat intelligence events), <https://learn.microsoft.com/azure/firewall/monitor-firewall-reference> (Module 3, step 9).
  - "Monitor Azure Key Vault" (sample queries on `AzureDiagnostics` filtered by `ResourceProvider == "MICROSOFT.KEYVAULT"`; `ResultSignature` holds the HTTP status, such as `OK` or `Forbidden`), <https://learn.microsoft.com/azure/key-vault/general/monitor-key-vault> (Module 4, step 9).
  - Azure CLI reference, "az monitor log-analytics" (`query` is an extension command; `--workspace` is the workspace's GUID), <https://learn.microsoft.com/cli/azure/monitor/log-analytics> (Modules 2 to 4).
  - Azure CLI reference, "az policy exemption" (`list --management-group <name> --filter atScopeAndBelow()` example), <https://learn.microsoft.com/cli/azure/policy/exemption> (Module 5, step 4).
- The Module 5 metric arithmetic follows the guide's metrics table; the PowerShell is the path's.
- Time estimates are the program's planning figures *(design guidance)*, not measurements.
- Claim wording: the steps *support* the controls; the assessor decides them. KSIs are written as indicators for cloud service providers that the agency lines its evidence up with.
