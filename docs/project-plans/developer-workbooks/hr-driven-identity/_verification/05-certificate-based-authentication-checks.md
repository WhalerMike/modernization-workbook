# Verification — Chapter 05, Certificate-Based Authentication Checks

New material; it replaces no workbook page. Code: `examples/hr-lifecycle` (new kit): `python/cba_check.py` (`measure`, `check`), `config/cba-expected.json`, the `cba-read` calls in `config/calls.json`, read by `python/graph_export.py`; fixtures `tests/fixtures/ch05/exports/` (`pki-containers.json`, `pki-cas.json`, `x509-method.json`, `auth-strengths.json`, `ca-policies.json`), `tests/fixtures/ch05/crl-measurements.csv`, `tests/fixtures/ch05/crl-urls.txt` and `tests/fixtures/ch05/crl/`; tests in `tests/test_credentials_separation_drift.py` (the Chapter 05 block) and `tests/test_core.py` (the call list). No Microsoft sample pinned: Learn's procedure for this gate is a concept page and portal steps, and the code follows the v1.0 Graph resources.

Test results on November 1, 2026, Windows 11, Python 3.14.3 with pytest: 57 passed across the kit; this chapter's are 5 (`test_cba_fixture_raises_each_rule`, `test_the_crl_limit_follows_the_cloud`, `test_an_unreachable_or_unmeasured_crl_is_a_finding`, `test_a_compliant_configuration_is_clean`, `test_measure_records_size_time_and_errors_without_raising`). Nothing was sent to a tenant.

Microsoft Learn pages opened on November 1, 2026 through the Microsoft Learn MCP tools: Microsoft Entra certificate-based authentication Certificate Revocation List (CRL) (search results across the revocation process, guidance, FAQ and error reference); Set up Microsoft Entra certificate-based authentication (prerequisites); Get started with certificate-based authentication in Microsoft Entra ID with federation (requirements); List certificateBasedAuthPki objects; Get certificateBasedAuthPki; List certificateAuthorityDetail objects; certificateAuthorityDetail resource type; x509CertificateAuthenticationMethodConfiguration resource type; Get x509CertificateAuthenticationMethodConfiguration; x509CertificateRule; x509CertificateAuthenticationModeConfiguration; x509CertificateCRLValidationConfiguration; x509CertificateUserBinding; List authenticationStrengthPolicies; authenticationMethodModes enum type; Conditional Access authentication strengths; Get and List certificateBasedAuthConfiguration (legacy).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Interactive CRL limit 20 MB public (includes GCC), 45 MB Azure US Government (includes GCC High and DoD); 10-second download; service limits 65 MB and 150 MB | Which cloud; rules; verified facts | verified; Learn's FAQ names GCC, GCC High and DoD explicitly, so treating DoD as Azure Government is Learn's statement, not an inference | Learn, CBA CRL page |
| 2 | No CRL configured, no revocation check; one endpoint, HTTP or HTTPS; HTTP recommended; a configured CRL that can't be downloaded fails CBA for that CA | Start with Microsoft's procedure; CB-01, CB-02, CB-04 | verified | Learn, CBA CRL page |
| 3 | Learn recommends enforcing CRL validation and exempting a CA only while troubleshooting | CB-08 | verified | Learn, CBA CRL page (guidance; FAQ) |
| 4 | CRLs are checked up to 10 CAs toward the root | Verified facts | verified | Learn, CBA CRL page |
| 5 | Learn is reviewing the size limits and plans to remove them | Differences | verified | Learn, CBA CRL page FAQ |
| 6 | Federation page gives a single 20 MB limit | Differences | verified | Learn, CBA with federation |
| 7 | PKI trust store: list containers and CAs, `PublicKeyInfrastructure.Read.All`, Authentication Administrator or Privileged Authentication Administrator, US Gov L4 and L5, v1.0 | Permissions; verified facts | verified | Learn, List certificateBasedAuthPki; List certificateAuthorityDetail |
| 8 | `certificateAuthorityDetail` properties | Start with Microsoft's procedure | verified | Learn, resource type |
| 9 | X.509 method GET: `Policy.Read.AuthenticationMethod`; Global Reader or Authentication Policy Administrator; L4 and L5 yes, 21Vianet no | Permissions; verified facts | verified | Learn, Get x509CertificateAuthenticationMethodConfiguration |
| 10 | Mode rules by `issuerSubject` or `policyOID` to `x509CertificateMultiFactor`; CRL validation state and exempted SKIs; binding fields `PrincipalName`, `RFC822Name`, `SubjectKeyIdentifier`, `SHA1PublicKey` | Start with Microsoft's procedure; CB-08, CB-09, CB-13 | verified | Learn, resource types |
| 11 | Authentication strengths list: `Policy.Read.AuthenticationMethod`; Conditional Access Administrator, Security Administrator or Security Reader; L4 and L5 | Permissions | verified | Learn, List authenticationStrengthPolicies |
| 12 | Built-in phishing-resistant strength: Windows Hello for Business or platform credential, FIDO2, CBA multifactor; enum values `windowsHelloForBusiness`, `fido2`, `x509CertificateMultiFactor` | CB-10 | verified | Learn, authentication strengths; authenticationMethodModes |
| 13 | Legacy `certificateBasedAuthConfiguration`: `Organization.Read.All`; Global Administrator the only delegated role | The code | verified | Learn, Get/List certificateBasedAuthConfiguration |
| 14 | A root CA with no CRL is a Warn (CB-01), an intermediate with none a Finding; Learn's prerequisite is a CRL for each CA | The check; differences | updated November 1, 2026: the code first skipped such a root; it now warns. Open: confirm in Lab 2 whether a root without a CRL blocks or weakens revocation | Learn, setup prerequisites; code |
| 15 | MB read as decimal bytes | Which cloud | restated-as-design (labeled): Learn doesn't define the unit | config |
| 16 | "Highest priority" binding order undefined | Differences | verified as unstated | Learn, x509CertificateUserBinding |
| 17 | List Conditional Access policies: `Policy.Read.All` | Permissions | carried forward from the validation kit's VK-CA-01 and *Building Privileged Access*, Chapter 02 | Learn, List policies |
| 18 | CBA and Conditional Access available in Azure for US Government | Which cloud | carried forward from the guide's verification log | Learn, feature availability |
| 19 | SCuBA MS.AAD.3.1v1 and 3.6v1 | Federal requirements | carried forward from the guide | CISA, BOD 25-01 |
| 20 | 80% warning, 90-day CA expiry warning, measuring from an internet-facing vantage point, issuing CAs by thumbprint | Rules; dangers | restated-as-design (labeled) | — |
| 21 | Lab 1 outputs (call list; measurement lines; 5/6/0 for gcc; 5/5/0 for gcchigh; 57 passed) | Lab 1 | verified by running the commands as written; the measurement's times vary by machine | local run, November 1, 2026 |
| 22 | Lab 2 behavior (export shapes; revoked certificate refused after publication) | Lab 2 | not run against a tenant | — |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| Guide, Gate 5 steps 1 and 2; plan task I1.6 | Why this gate; the check | Steps 3 to 6 (issuance and revocation as HR events) are the card system's integration and Book 19, Chapter 05's custom task; Chapter 06 measures the revocation time |
| Guide, Gate 5 requirements table | Federal requirements and evidence | Restated only as the code's contribution; the guide's table is linked |
| Book 03, Chapter 09 (revocation checking) | Linked | Design not restated |
| Book 07, Chapter 06 (Entra CBA) | Linked | Trust store, bindings and modes not restated |
| VK-PIV-01 (Book 19, Chapter 03) | The code | Per-user binding coverage stays the kit's check; CB-13 only flags the tenant's binding fields |
| ADM guide, Gate 6 (affinity decision) | CB-13 | The decision itself isn't this chapter's |
