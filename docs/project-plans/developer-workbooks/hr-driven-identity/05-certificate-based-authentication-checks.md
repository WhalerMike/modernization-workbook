---
title: "Chapter 05 — Certificate-Based Authentication Checks"
description: "Check the certificate-based authentication configuration behind PIV and CAC sign-in as code, starting from Learn's CRL page and the PKI trust store and X.509 method APIs, and adding what they leave to you: a measurement of every CRL against the cloud's own size and download limits, a check of the trusted issuing CAs, the multifactor mapping of the PIV policy OIDs, CRL validation and its exemptions, low-affinity bindings and a Conditional Access policy that requires a phishing-resistant authentication strength, with labs against fixtures and a test tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-hr-driven-identity
part: How
series-order: 5
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: approved
reviewed-sha256: 6fff8cfc020a5825c1b3277fc04bcce80e2774e027de71f84010690e5ede6809
last-reviewed: 2026-11-01
---
# Chapter 05 — Certificate-Based Authentication Checks

*A revoked card is only revoked if Entra can download the list that says so, in time, every time.*

::: {.callout-note}
## In this chapter
The checks behind the guide's Gate 5, "CBA trusts the issuing CAs with CRLs," and plan task I1.6, the issuing CAs' CRL sizes checked. You start with Learn's certificate revocation list page, which sets the limits per cloud, and the Graph resources that hold the trust store and the X.509 certificate method. Then you use `examples/hr-lifecycle` for what they leave to you: a measurement of every CRL, and a check, CB-01 to CB-13, of the CAs, each CRL against the cloud's limit, the multifactor mapping, CRL validation and the phishing-resistant strength. Lab 1 runs on a laptop with no tenant; Lab 2 uses a test tenant.
:::

## Goal and audience

**Goal.** By the end of this chapter you can say, from code, whether every CA the card program issues from is trusted with a CRL that Entra can download within the limits of your tenant's cloud, whether PIV certificates count as multifactor, and whether a Conditional Access policy requires a phishing-resistant strength. You can say, for each rule, whether it is Learn's limit or the program's own design.

**Audience.** Developers who build the credential checks, the PKI and credentialing engineers who run the issuing CAs, and the ISSO who keeps the configuration export. You should read Python. You don't need a tenant until Lab 2.

## Why this gate needs code

The guide's [Gate 5](../../../books/guides/hr-driven-identity-implementation.md#step-5-bind-credentials-to-hr-events) ties the card's lifecycle to the person's: issuance from a joiner record, revocation from a leaver. Revocation only reaches sign-in through the CRL. Book 03 explains why ([Chapter 09, Revocation checking](../../../books/b03-hr-identity/09-credentials-and-certificates.md#revocation-checking)), and Book 07 explains the trust store, the bindings and the single-factor and multifactor split ([Chapter 06, Entra certificate-based authentication](../../../books/b07-pki/06-device-and-user-certificates.md#entra-certificate-based-authentication)). This chapter doesn't restate them. It turns them into a check that runs every day, because a CRL grows with every revocation, and the day it crosses the limit is the day sign-in fails for every card from that CA.[^hw05-crl]

Per-user binding coverage and affinity are the validation kit's **VK-PIV-01** ([Book 19, Chapter 03](../../../books/b19-developer-workbook/03-writing-a-validation-kit-check.md)) and the ADM guide's Gate 6. This chapter checks the tenant's settings, which VK-PIV-01 doesn't read.

### Which cloud, for this check

Learn gives two sets of CRL limits. For interactive sign-in, a CRL must stay under 20 MB in public Entra ID, which includes GCC, and 45 MB in Azure US Government, which Learn's FAQ says includes GCC High and DoD; it must download within 10 seconds. The service-side limits are 65 MB and 150 MB.[^hw05-crl] `config/cba-expected.json` holds both sets per cloud name, and the check takes `--cloud gcc`, `gcchigh` or `dod` with no default. Learn writes the limits in MB without saying whether a megabyte is 1,000,000 or 1,048,576 bytes; the configuration reads them as decimal, the stricter reading. The Graph reads go to `graph.microsoft.com` for GCC and `graph.microsoft.us` or `dod-graph.microsoft.us` for GCC High and DoD.[^hw05-deployments] Certificate-based authentication and Conditional Access are available in Azure for US Government.[^hw05-availability]

## Start with Microsoft's procedure

### What Microsoft gives you

Learn's CRL page is Microsoft's procedure and its limits. Without a configured CRL, Entra doesn't check revocation for that CA. Entra supports one CRL endpoint per CA, HTTP or HTTPS, and recommends HTTP because HTTPS adds latency and its own certificate validation. A configured CRL that can't be downloaded fails certificate-based authentication for that CA's certificates, so Learn asks for highly available endpoints, and for CRL validation enforced in policy, with an exemption only as a last resort while troubleshooting.[^hw05-crl] The setup page lists the same prerequisite: each CA has a CRL from an internet-facing URL.[^hw05-howto]

Graph holds the configuration in three places, all in v1.0:

- the PKI-based trust store, a list of `certificateBasedAuthPki` objects, each with `certificateAuthorities` of type `certificateAuthorityDetail`, which carry `certificateRevocationListUrl`, `certificateAuthorityType` (root or intermediate), `thumbprint` and `expirationDateTime`;[^hw05-pki-list] [^hw05-ca-list] [^hw05-ca-detail]
- the X.509 certificate authentication method, `x509CertificateAuthenticationMethodConfiguration`, with `authenticationModeConfiguration` (a default mode and rules that map an issuer or a policy OID to `x509CertificateMultiFactor`), `crlValidationConfiguration` (a state and the exempted CAs' subject key identifiers) and `certificateUserBindings`;[^hw05-x509] [^hw05-x509-get] [^hw05-rule] [^hw05-crlv] [^hw05-binding]
- the authentication strength policies, whose `allowedCombinations` use the `authenticationMethodModes` values, and the Conditional Access policies that reference them.[^hw05-strengths] [^hw05-strength-modes]

Learn's authentication strengths page says the built-in phishing-resistant strength allows Windows Hello for Business or platform credential, FIDO2 and certificate-based authentication (multifactor).[^hw05-strength-concept]

### What it leaves to you

Each row is pinned by a test in `tests/test_credentials_separation_drift.py`.

| What Learn gives | Why it matters | What `examples/hr-lifecycle` adds |
|---|---|---|
| The limits, in prose | Nobody measures the CRL until sign-in fails | `cba_check.py measure` downloads each CRL and records bytes and seconds; `check` compares them with the cloud's limit (`test_the_crl_limit_follows_the_cloud`) |
| One limit per cloud | A GCC tenant sized to the GCC High limit passes a CRL that fails | The limit comes from `--cloud`, never a default (`test_the_crl_limit_follows_the_cloud`) |
| "A CRL that can't be downloaded fails CBA" | An unreachable endpoint looks like a missing measurement | A download error or a missing measurement is a Finding, not a skip (`test_an_unreachable_or_unmeasured_crl_is_a_finding`) |
| The trust store as Graph objects | A renewed CA with a new thumbprint is silently missing | Each issuing CA the card program uses is named by thumbprint in `config/cba-expected.json` (`test_cba_fixture_raises_each_rule`) |
| Mode rules by issuer or policy OID | PIV certificates sign in as single-factor and fail the strength | CB-09 checks the program's PIV policy OIDs map to multifactor (`test_cba_fixture_raises_each_rule`) |
| CRL validation and exemptions | An exemption made while troubleshooting stays forever | Each exempted CA is a Warn until it's removed (`test_cba_fixture_raises_each_rule`) |
| Strengths and policies, separately | The phishing-resistant strength exists but no enforced policy requires it | CB-10 looks for an enabled policy for all users and all resources whose strength allows only phishing-resistant combinations; a report-only policy doesn't count (`test_a_compliant_configuration_is_clean`) |

**The verdict.** Keep Learn's limits as the configuration's values and Learn's objects as the check's inputs. The code measures and compares; it never changes the configuration.

## The code: what `examples/hr-lifecycle` adds

`python/cba_check.py` has two commands, and reads the exports `graph_export.py --task cba-read` writes.

### The measurement

`measure` takes a file with one CRL URL per line, downloads each once, and writes `crl-measurements.csv` with the bytes, the seconds and any error. A failed download is recorded, not raised: the unreachable CRL is the finding. For labs, a local path is read as a file. Run it from the network that represents the internet-facing path Entra uses, not from inside the PKI's own network (*design guidance*).

### The check

| Rule | Severity | What it flags | Source |
|---|---|---|---|
| CB-01 | Finding; Warn | An intermediate CA with no CRL configured (Finding); a root CA with none (Warn) | Learn: no CRL, no revocation check[^hw05-crl] |
| CB-02 | Warn | A CRL endpoint that isn't HTTP | Learn recommends HTTP[^hw05-crl] |
| CB-03 | Finding | A CRL over the cloud's interactive size limit | Learn[^hw05-crl] |
| CB-04 | Finding | A CRL that couldn't be downloaded, or took more than 10 seconds | Learn[^hw05-crl] |
| CB-05 | Warn | A CRL over 80% of the limit | *Design guidance* (`warnPercent`) |
| CB-06 | Finding | A configured CRL with no measurement | *Design guidance*: measure every CRL |
| CB-07 | Finding | The X.509 certificate method isn't enabled | Learn[^hw05-x509] |
| CB-08 | Warn | CRL validation isn't enabled, or a CA is exempted | Learn recommends enforcing it and exempting only to troubleshoot[^hw05-crl] |
| CB-09 | Finding | A PIV policy OID not mapped to multifactor, with a single-factor default | Learn's mode rules;[^hw05-rule] the program's OIDs |
| CB-10 | Finding | No enabled policy for all users and resources requires a phishing-resistant strength | SCuBA MS.AAD.3.1v1;[^hw05-bod] Learn's strengths[^hw05-strength-concept] |
| CB-11 | Warn | A CA certificate that expires within 90 days | *Design guidance* (`caExpiryWarnDays`) |
| CB-12 | Finding | An issuing CA the card program uses isn't in the trust store | *Design guidance* |
| CB-13 | Warn | A low-affinity binding field (`PrincipalName`, `RFC822Name`) configured | The validation kit's affinity table; ADM Gate 6's decision |

A root CA with no CRL configured is a Warn, not a Finding: a root that issues only CA certificates may publish none. Learn's prerequisite is wider, "each CA has a CRL," and Learn says Entra checks the CRLs up the chain to the root, so the warning asks you to confirm the root's revocation path, and Lab 2 checks it (verification log, row 14).[^hw05-howto] [^hw05-crl]

The read needs three permissions, each the least-privileged for its call:

| Call | Least-privileged permission | Delegated role |
|---|---|---|
| List `certificateBasedAuthPki`, and each one's CAs | `PublicKeyInfrastructure.Read.All`[^hw05-pki-list] [^hw05-ca-list] | Authentication Administrator or Privileged Authentication Administrator |
| Get the X.509 certificate method | `Policy.Read.AuthenticationMethod`[^hw05-x509-get] | Global Reader or Authentication Policy Administrator |
| List authentication strength policies | `Policy.Read.AuthenticationMethod`[^hw05-strengths] | Conditional Access Administrator, Security Administrator or Security Reader |
| List Conditional Access policies | `Policy.Read.All`[^hw05-ca-policies] | Global Reader or Security Reader |

The code reads the PKI-based trust store, not the older `organization/{id}/certificateBasedAuthConfiguration`, whose Learn pages name Global Administrator as the only role for a delegated read.[^hw05-legacy]

### The tests

Five tests cover this chapter: every rule on the fixture, the limit by cloud, an unreachable or unmeasured CRL, a compliant configuration that comes back clean, and the measurement against a fake opener. With the other chapters', 57 pytest tests pass under Python 3.10 or later, with no package, tenant or network.

::: {.callout-important}
## Illustrative code
The commands below run the example against a fictional tenant's exports and fictional CRL files. They show what the code does, not that a tenant returns the same shapes. Review the code and run Lab 2 in a test tenant before it reports on production.
:::

## Lab 1: fixtures, no tenant

You need Python 3.10 or later. Work in `examples/hr-lifecycle`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/hr-lifecycle`. Each step below says what it does and what to look for.

```bash
# Step 1: List the calls and permissions
python python/graph_export.py --task cba-read --list

# Step 2: Measure the fixture CRLs
python python/cba_check.py measure --urls tests/fixtures/ch05/crl-urls.txt --out out/ch05/crl-measurements.csv

# Step 3: Check the fictional tenant for GCC
python python/cba_check.py check --cloud gcc --exports tests/fixtures/ch05/exports --crl tests/fixtures/ch05/crl-measurements.csv --expected config/cba-expected.json --as-of 2026-11-01 --out out/ch05/check

# Step 4: Check the same tenant for GCC High
python python/cba_check.py check --cloud gcchigh --exports tests/fixtures/ch05/exports --crl tests/fixtures/ch05/crl-measurements.csv --expected config/cba-expected.json --as-of 2026-11-01 --out out/ch05/check-gcchigh

# Step 5: Run the tests
python -m pytest tests -q
```

:::

<!-- labs:end -->

1. **List the calls and permissions:**

   ```bash
   python python/graph_export.py --task cba-read --list
   ```

   ```text
   Task cba-read: Policy.Read.All, Policy.Read.AuthenticationMethod, PublicKeyInfrastructure.Read.All
     GET /directory/publicKeyInfrastructure/certificateBasedAuthConfigurations  [PublicKeyInfrastructure.Read.All]
     GET /directory/publicKeyInfrastructure/certificateBasedAuthConfigurations/{pkiId}/certificateAuthorities  [PublicKeyInfrastructure.Read.All]
     GET /policies/authenticationMethodsPolicy/authenticationMethodConfigurations/x509Certificate  [Policy.Read.AuthenticationMethod]
     GET /policies/authenticationStrengthPolicies  [Policy.Read.AuthenticationMethod]
     GET /identity/conditionalAccess/policies  [Policy.Read.All]
   ```

2. **Measure the fixture CRLs:**

   ```bash
   python python/cba_check.py measure --urls tests/fixtures/ch05/crl-urls.txt --out out/ch05/crl-measurements.csv
   ```

   ```text
            4,096 bytes    0.000 s  tests/fixtures/ch05/crl/piv-ca1.crl
            8,192 bytes    0.000 s  tests/fixtures/ch05/crl/piv-ca2.crl
                0 bytes    0.000 s  tests/fixtures/ch05/crl/missing.crl  FileNotFoundError
   Measured 3 CRL(s) -> out/ch05/crl-measurements.csv
   ```

   The times on your machine will differ. The missing file is recorded with its error, not raised. The check in the next step reads `tests/fixtures/ch05/crl-measurements.csv` instead, which holds measurements of the fictional tenant's own CRL URLs, one of them 18.5 million bytes and 11.4 seconds.

3. **Check the fictional tenant for GCC:**

   ```bash
   python python/cba_check.py check --cloud gcc --exports tests/fixtures/ch05/exports --crl tests/fixtures/ch05/crl-measurements.csv --expected config/cba-expected.json --as-of 2026-11-01 --out out/ch05/check
   ```

   ```text
   Cloud gcc: interactive CRL limit 20,000,000 bytes, download within 10 s
   CBA: 5 Finding, 7 Warn, 0 Info
     CB-01 Finding: Contoso Example Legacy Intermediate: no CRL configured: Entra doesn't check revocation for this CA
     CB-04 Finding: Contoso Example PIV Issuing CA 2 (renewed): CRL took 11.4 s to download; the limit is 10 s
     CB-09 Finding: authentication mode: PIV policy OID(s) 2.16.840.1.101.3.2.1.48.11 not mapped to multifactor, and the default is single-factor
     CB-10 Finding: Conditional Access: no enabled policy for all users and all resources requires a phishing-resistant authentication strength (SCuBA MS.AAD.3.1v1)
     CB-12 Finding: Contoso Example PIV Issuing CA 2: issuing CA the card program uses isn't in the trust store
     CB-01 Warn: Contoso Example PIV Root CA: root CA with no CRL configured; Learn asks for a CRL on each CA; confirm the root's revocation path
     CB-02 Warn: Contoso Example PIV Issuing CA 2 (renewed): CRL endpoint https://pki.contoso.example/crl/piv-ca2.crl isn't HTTP; Learn recommends HTTP
     CB-05 Warn: Contoso Example PIV Issuing CA 2 (renewed): CRL is 18,500,000 bytes, over 80% of the gcc interactive limit
     CB-08 Warn: CRL validation: CBA doesn't require a CRL from every CA (crlValidationConfiguration isn't enabled)
     CB-08 Warn: CA 5A5B5C5D5E5F60616263646566676869: exempted from CRL validation; allowed only while its CRL is fixed, with an end date
     CB-11 Warn: Contoso Example Legacy Intermediate: CA certificate expires 2026-12-15
     CB-13 Warn: username bindings: low-affinity binding fields configured (PrincipalName); align with the affinity decision (ADM Gate 6) and VK-PIV-01
   ```

   The exit code is 2. Read the story in the fixture: CA 2 was renewed, so the thumbprint the card program expects is gone (CB-12) and the renewed CA's CRL is large, slow and on HTTPS. The tenant's mode rule maps the wrong OID (CB-09), and the phishing-resistant policy is still report-only, so the enforced policy requires only the MFA strength (CB-10).

4. **Check the same tenant for GCC High:**

   ```bash
   python python/cba_check.py check --cloud gcchigh --exports tests/fixtures/ch05/exports --crl tests/fixtures/ch05/crl-measurements.csv --expected config/cba-expected.json --as-of 2026-11-01 --out out/ch05/check-gcchigh
   ```

   ```text
   Cloud gcchigh: interactive CRL limit 45,000,000 bytes, download within 10 s
   CBA: 5 Finding, 6 Warn, 0 Info
   ```

   The same 18.5 million bytes is under 80% of the Azure Government limit, so CB-05 drops away. The 11.4-second download is a Finding in every cloud.

5. **Run the tests:**

   ```bash
   python -m pytest tests -q
   ```

**Expected result:** `57 passed`. Delete `out` when you're done:

```bash
rm -rf out
```

## Lab 2: test tenant

Not run by the authors. Use a test tenant with certificate-based authentication configured for a test CA, never production. Work in `examples/hr-lifecycle`. You'll replace: `<graph-token>` (a bearer token for `graph.microsoft.com` issued to the reader app), `<pki-id>` (the PKI container's ID, from the list in step 2), `<crl-url-1>` and `<crl-url-2>` (the test CAs' CRL URLs, one per CA), `<ca-name>` and `<ca-thumbprint>` (an issuing CA of the test PKI), `<piv-policy-oid>` (the policy OID of the test PKI's PIV authentication certificates), `<cloud>` (the test tenant's cloud: `gcc`, `gcchigh` or `dod`) and `<today>` (today's date, `yyyy-mm-dd`).

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```bash
# Step 2: Export the configuration
python python/graph_export.py --task cba-read --cloud gcc --param pkiId=<pki-id> --out exports/cba
```

:::

<!-- labs:end -->

1. **Register the reader app** with a certificate, and grant the three application permissions from Lab 1, step 1, with admin consent, and nothing else.
2. **Export the configuration.** With a token for the reader app in `HRLC_GRAPH_TOKEN`, list the PKI containers, then export the task with the container's ID:

   ```bash
   export HRLC_GRAPH_TOKEN='<graph-token>'
   curl -s -H "Authorization: Bearer $HRLC_GRAPH_TOKEN" https://graph.microsoft.com/v1.0/directory/publicKeyInfrastructure/certificateBasedAuthConfigurations
   python python/graph_export.py --task cba-read --cloud gcc --param pkiId=<pki-id> --out exports/cba
   ```

   Check that `x509-method.json` holds one object and that each CA in `pki-cas.json` carries `certificateRevocationListUrl` as the fixture does. This prints the count and each CA's URL:

   ```bash
   python -c "import json; print('x509 objects:', len(json.load(open('exports/cba/x509-method.json'))['value'])); [print(c['displayName'], c.get('certificateRevocationListUrl')) for c in json.load(open('exports/cba/pki-cas.json'))['value']]"
   ```

3. **Measure the real CRLs.** Put each CA's CRL URL in a file, one per line (add a line for each further CA), and run `measure` from outside the agency network:

   ```bash
   printf '%s\n' '<crl-url-1>' '<crl-url-2>' > my-crl-urls.txt
   python python/cba_check.py measure --urls my-crl-urls.txt --out out/cba-test/crl-measurements.csv
   ```

   Record the run's date with the file.
4. **Check.** Copy `config/cba-expected.json` with the CA thumbprints and PIV policy OIDs replaced by the test PKI's (add an entry to `issuingCas` for each further issuing CA), and run `check` with `--cloud` set to the test tenant's cloud:

   ```bash
   python -c "import json; d=json.load(open('config/cba-expected.json')); d['issuingCas'] = [{'displayName': '<ca-name>', 'thumbprint': '<ca-thumbprint>'}]; d['multifactorPolicyOids'] = ['<piv-policy-oid>']; json.dump(d, open('my-cba-expected.json', 'w'), indent=2)"
   python python/cba_check.py check --cloud <cloud> --exports exports/cba --crl out/cba-test/crl-measurements.csv --expected my-cba-expected.json --as-of <today> --out out/cba-test/check
   ```

5. **Prove revocation.** Revoke a test user's certificate, wait for the CA's next CRL publication, and sign in with it. Entra should refuse it with the revoked-certificate error Learn lists.[^hw05-crl] Record the revocation time, the CRL's publication time and the refused sign-in.
6. **Back it out.** Remove the permissions, delete the reader app and its certificate, and reissue the test user's certificate if you need it again. Then delete `exports` and `out`, with the lab's two files:

   ```bash
   rm -rf exports out my-crl-urls.txt my-cba-expected.json
   ```

## Verified facts

| Item | Value | US Government clouds | Stage | Source |
|---|---|---|---|---|
| CRL limits | Interactive 20 MB (public, includes GCC) and 45 MB (Azure US Government, includes GCC High and DoD); 10-second download; service limits 65 MB and 150 MB | Applies, with the larger limits | GA | [^hw05-crl] |
| CRL behavior | No CRL, no revocation check; one endpoint, HTTP or HTTPS, HTTP recommended; a configured CRL that can't be downloaded fails CBA; CRLs checked up to 10 CAs toward the root | — | GA | [^hw05-crl] |
| List `certificateBasedAuthPki`; list its `certificateAuthorities` | `PublicKeyInfrastructure.Read.All`; Authentication Administrator or Privileged Authentication Administrator | L4 and L5 | v1.0 | [^hw05-pki-list] [^hw05-ca-list] |
| `certificateAuthorityDetail` | `certificateRevocationListUrl`, `certificateAuthorityType`, `thumbprint`, `expirationDateTime`, `issuerSubjectKeyIdentifier` | — | v1.0 | [^hw05-ca-detail] |
| Get X.509 certificate method | `Policy.Read.AuthenticationMethod`; Global Reader or Authentication Policy Administrator | L4 and L5 (not 21Vianet) | v1.0 | [^hw05-x509-get] |
| X.509 method properties | `authenticationModeConfiguration` (rules by `issuerSubject` or `policyOID`), `crlValidationConfiguration`, `certificateUserBindings` (`PrincipalName`, `RFC822Name`, `SubjectKeyIdentifier`, `SHA1PublicKey`) | — | v1.0 | [^hw05-x509] [^hw05-rule] [^hw05-crlv] [^hw05-binding] |
| List authentication strength policies | `Policy.Read.AuthenticationMethod`; `allowedCombinations` from `authenticationMethodModes` | L4 and L5 | v1.0 | [^hw05-strengths] [^hw05-strength-modes] |
| List Conditional Access policies | `Policy.Read.All` | — | v1.0 | [^hw05-ca-policies] |
| Legacy `certificateBasedAuthConfiguration` | `Organization.Read.All`; Global Administrator is the only delegated role | L4 and L5 | v1.0 | [^hw05-legacy] |
| CBA and Conditional Access | Available in Azure for US Government | Available | GA | [^hw05-availability] |

Places Learn says nothing or differs, recorded so a later edit doesn't loosen the code:

- **Megabytes.** Learn writes "20 MB" and "45 MB" without a byte count. The configuration uses decimal megabytes, the stricter reading. Learn also says it is reviewing the limits and plans to remove them.[^hw05-crl]
- **Two pages, two limits.** Learn's CBA-with-federation page still gives a single 20 MB limit with no cloud split; the CRL page gives both. The code follows the CRL page for the cloud split and applies 20 MB to GCC either way.[^hw05-crl] [^hw05-federation]
- **Root CAs.** Learn's prerequisite is a CRL for each CA; the check warns on a root with none rather than failing it (verification log, row 14).
- **Priority.** Learn says Entra uses the binding "with the highest priority" without saying whether that is the largest or the smallest number.[^hw05-binding] CB-13 flags any low-affinity field rather than guessing the order.

## Federal requirements and evidence

This chapter helps prove the guide's [Gate 5](../../../books/guides/hr-driven-identity-implementation.md#step-5-bind-credentials-to-hr-events); its requirements table is the source, and the [federal framework crosswalk](../../../reference/federal-framework-crosswalk.md) lists every federal source.

| Requirement | What this code shows | What the ISSO keeps |
|---|---|---|
| NIST SP 800-53 IA-2(12), acceptance of PIV credentials, and IA-5(2), public key-based authentication (Moderate) | Every issuing CA trusted, with a CRL Entra can download in time, and revocation enforced | The `cba-read` export and the check's `findings.json` and `manifest.json`, dated; each CRL measurement |
| CISA SCuBA MS.AAD.3.1v1 and MS.AAD.3.6v1, phishing-resistant MFA (BOD 25-01 required) | An enabled policy requires a phishing-resistant strength, and PIV certificates count as multifactor | The check's CB-09 and CB-10 rows, beside the ScubaGear report |
| FIPS 201-3, termination of the card | A revoked card is refused, because its CA's CRL is reachable and enforced | Lab 2's refused sign-in, the revocation record and the CRL that published it |
| NIST SP 800-63-4, authenticator assurance | The certificate counts at the strength the agency claims | The mode rules in the export |

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A CRL that grows past the limit | Every card from that CA fails sign-in | CB-03 and the early warning CB-05, every run |
| An unreachable or slow CRL endpoint | Same outage, from the network side | CB-04; Learn's highly available HTTP endpoints |
| A CA without a CRL | Revoked cards still sign in | CB-01 |
| A renewed CA not added | New cards don't sign in, and nobody knows why | CB-12 by thumbprint, CB-11 before expiry |
| A troubleshooting exemption that stays | Revocation is off for that CA | CB-08 lists every exemption, every run |
| PIV mapped as single-factor | Users meet MFA with a password plus something else, not the card | CB-09 |
| A phishing-resistant policy left in report-only | The requirement exists on paper | CB-10 counts only enabled policies |
| Measuring from inside the PKI's network | The measurement passes while Entra's path fails | Run `measure` from an internet-facing vantage point (*design guidance*) |

## Checklist

- [ ] `config/cba-expected.json` names every issuing CA by thumbprint and every PIV policy OID, and its limits match Learn's CRL page for the tenant's cloud.
- [ ] Every CRL was measured from outside the agency network within the last day, and none is over 80% of the limit or slower than 10 seconds.
- [ ] The check shows no Finding, and every CB-08 exemption has a ticket and an end date.
- [ ] An enabled Conditional Access policy for all users requires a phishing-resistant strength.
- [ ] A revoked test certificate was refused after the CRL published, with the evidence filed.
- [ ] The reader app holds exactly the three permissions, with a certificate or a managed identity.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 04 — Access from Attributes and the Mover's Residual Review](04-access-from-attributes-and-the-mover-review.md) · [Workbook index](index.md) · [Next: Chapter 06 — Separation Timing from the Logs →](06-separation-timing.md)
:::

[^hw05-crl]: Microsoft Learn, "Microsoft Entra certificate-based authentication Certificate Revocation List (CRL)," revocation process, setup guidance and FAQ, <https://learn.microsoft.com/entra/identity/authentication/concept-certificate-based-authentication-certificate-revocation-list> (read November 1, 2026).
[^hw05-howto]: Microsoft Learn, "Set up Microsoft Entra certificate-based authentication," prerequisites, <https://learn.microsoft.com/entra/identity/authentication/how-to-certificate-based-authentication> (read November 1, 2026).
[^hw05-federation]: Microsoft Learn, "Get started with certificate-based authentication in Microsoft Entra ID with federation," requirements, <https://learn.microsoft.com/entra/identity/authentication/certificate-based-authentication-federation-get-started> (read November 1, 2026).
[^hw05-deployments]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (read November 1, 2026; carried from Book 19, Chapter 02).
[^hw05-availability]: Microsoft Learn, "Microsoft Entra feature availability," <https://learn.microsoft.com/entra/identity/authentication/feature-availability> (read November 1, 2026; carried from the HR-driven identity implementation guide's verification log).
[^hw05-pki-list]: Microsoft Learn, "List certificateBasedAuthPki objects," permissions and national clouds, <https://learn.microsoft.com/graph/api/publickeyinfrastructureroot-list-certificatebasedauthconfigurations?view=graph-rest-1.0> (read November 1, 2026).
[^hw05-ca-list]: Microsoft Learn, "List certificateAuthorityDetail objects," permissions and national clouds, <https://learn.microsoft.com/graph/api/certificatebasedauthpki-list-certificateauthorities?view=graph-rest-1.0> (read November 1, 2026).
[^hw05-ca-detail]: Microsoft Learn, "certificateAuthorityDetail resource type," properties, <https://learn.microsoft.com/graph/api/resources/certificateauthoritydetail?view=graph-rest-1.0> (read November 1, 2026).
[^hw05-x509]: Microsoft Learn, "x509CertificateAuthenticationMethodConfiguration resource type," <https://learn.microsoft.com/graph/api/resources/x509certificateauthenticationmethodconfiguration?view=graph-rest-1.0> (read November 1, 2026).
[^hw05-x509-get]: Microsoft Learn, "Get x509CertificateAuthenticationMethodConfiguration," permissions and national clouds, <https://learn.microsoft.com/graph/api/x509certificateauthenticationmethodconfiguration-get?view=graph-rest-1.0> (read November 1, 2026).
[^hw05-rule]: Microsoft Learn, "x509CertificateRule resource type" and "x509CertificateAuthenticationModeConfiguration resource type," <https://learn.microsoft.com/graph/api/resources/x509certificaterule?view=graph-rest-1.0> (read November 1, 2026).
[^hw05-crlv]: Microsoft Learn, "x509CertificateCRLValidationConfiguration resource type," <https://learn.microsoft.com/graph/api/resources/x509certificatecrlvalidationconfiguration?view=graph-rest-1.0> (read November 1, 2026).
[^hw05-binding]: Microsoft Learn, "x509CertificateUserBinding resource type," <https://learn.microsoft.com/graph/api/resources/x509certificateuserbinding?view=graph-rest-1.0> (read November 1, 2026).
[^hw05-strengths]: Microsoft Learn, "List authenticationStrengthPolicies," permissions and national clouds, <https://learn.microsoft.com/graph/api/authenticationstrengthroot-list-policies?view=graph-rest-1.0> (read November 1, 2026).
[^hw05-strength-modes]: Microsoft Learn, "authenticationMethodModes enum type," <https://learn.microsoft.com/graph/api/resources/authenticationmethodmodes?view=graph-rest-1.0> (read November 1, 2026).
[^hw05-strength-concept]: Microsoft Learn, "Conditional Access authentication strengths," built-in authentication strengths, <https://learn.microsoft.com/entra/identity/authentication/concept-authentication-strengths> (read November 1, 2026).
[^hw05-ca-policies]: Microsoft Learn, "List policies" (conditionalAccessRoot), <https://learn.microsoft.com/graph/api/conditionalaccessroot-list-policies?view=graph-rest-1.0> (read November 1, 2026; carried from the validation kit's VK-CA-01 and *Building Privileged Access*, Chapter 02).
[^hw05-legacy]: Microsoft Learn, "Get certificateBasedAuthConfiguration" and "List certificateBasedAuthConfigurations," permissions, <https://learn.microsoft.com/graph/api/certificatebasedauthconfiguration-get?view=graph-rest-1.0> (read November 1, 2026).
[^hw05-bod]: Cybersecurity and Infrastructure Security Agency, "BOD 25-01: Implementing Secure Practices for Cloud Services Required Configurations," MS.AAD.3.1v1 and MS.AAD.3.6v1, <https://www.cisa.gov/resources-tools/services/bod-25-01-implementing-secure-practices-cloud-services-required-configurations> (read November 1, 2026; carried from the HR-driven identity implementation guide).
