---
title: "Module 7: PIV and derived PIV"
description: "Book 07, Chapter 09: what the PIV credential is under HSPD-12, FIPS 201-3 and OMB M-19-17; the PIV authentication certificate and the card's lifecycle, with revocation at separation run by the HR leaver gate; derived PIV credentials under SP 800-157 and how Intune and Entra ID relate to them; Entra certificate-based authentication as acceptance, not replacement, with its four settings and M-22-09's phishing-resistant requirement; administrators' PIV in the privileged strength; and accepting other agencies' PIV. Lab 1 runs the validation kit's PIV binding check on a fictional tenant that fails and one that passes; Lab 2 runs it against a test tenant. About 50 minutes, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 07"
series-order: 7
review-status: approved
reviewed-sha256: 5bcce1bf87971d87c27d6c7b3e6031e2a504385fe152d631f44beadcc237a75b
last-reviewed: 2026-11-25
---
# Module 7: PIV and derived PIV {.unnumbered}

*Part of the [PKI and Certificates learning path](index.md). Book 07, [Chapter 09](../../books/b07-pki/09-federal-workforce-credentials.md). About 50 minutes.*

## Introduction (3 minutes)

The PIV card is the federal workforce credential, and the migration doesn't change its issuer. What changes is where it's accepted: the agency's cloud tenant accepts the PIV authentication certificate through Entra certificate-based authentication (CBA), and it does that faithfully only if each card holder's certificate is bound to exactly one account with a value no other certificate can match. In this module you learn what the credential is, where derived PIV fits, the settings that make acceptance faithful, and how the binding is checked. In the lab you run the validation kit's PIV binding check on two fictional tenants and compare what it finds with the forest-side mappings from Module 4.

**The federal requirement.** The full table is in Chapter 09's [The evidence the ISSO keeps](../../books/b07-pki/09-federal-workforce-credentials.md#the-evidence-the-isso-keeps).

| Requirement | KSI | Evidence |
|---|---|---|
| IA-2(12): accept and electronically verify PIV-compliant credentials | No indicator pairing in this repository's verified mappings | The CBA configuration: the Federal PKI CAs in the trust store with their CRLs, the multifactor rule for the PIV authentication policy, and the phishing-resistant strength |
| IA-5(2): map the authenticated identity to the account | KSI-IAM-APM, KSI-IAM-ELP, KSI-IAM-SNU, KSI-SVC-ASM | VK-PIV-01's result for each card holder list, from a dated run: holders with no binding or only low-affinity values, by account, never by value |
| AC-2: disable accounts at separation | KSI-IAM-APM, KSI-IAM-JIT, KSI-IAM-SNU, KSI-IAM-SUS | The HR leaver gate's two times: separation to sign-in blocked, and separation to the CRL that carried the revocation. The kit doesn't produce these |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines its own evidence up with them; it doesn't report KSIs itself. The pairs above are the ones in [Book 13, Appendix A](../../books/b13-governance/appendix-a-requirements-mapping.md).

## Learning objectives (1 minute)

After this module, you'll be able to:

- say what HSPD-12, FIPS 201-3 and M-19-17 require, and which certificate on the card matters for logical access;
- follow the card's lifecycle, and say why the leaver gate disables the account before the revocation reaches Entra ID;
- say what a derived PIV credential is, which document governs it, and what Intune and Entra ID each do with it;
- name the four CBA settings that make acceptance faithful, and how they support M-22-09;
- say what makes the PIV certificate count for an administrator;
- read VK-PIV-01's result, and match each tenant-side finding to its forest-side cause.

## Prerequisites (1 minute)

- [Module 4](04-device-and-user-certificates.md), for bindings, affinity and the forest's strong mappings, and [Module 6](06-lifecycle-monitoring-and-decommissioning.md).
- The validation kit, as the path's [Get the code](index.md#get-the-code) says: this module's lab uses `validation-kit.zip`, not the Start Kit.

## Unit 1: What the PIV credential is (8 minutes)

Read [Chapter 09](../../books/b07-pki/09-federal-workforce-credentials.md), section *HSPD-12 and FIPS 201-3: what the PIV credential is*. HSPD-12 set the government-wide standard for identification issued to employees and contractors, FIPS 201-3 is that standard, and OMB M-19-17 makes PIV the primary means of identification and authentication to federal systems and facilities.

![The PIV credential sits under cloud authentication: policy defines it, the Federal PKI issues it, Entra CBA accepts it, and Conditional Access enforces the strength, for the agency's own users and for users arriving from other agencies and partners. The HR leaver gate blocks sign-in at once and revokes the card.](../../images/diagrams/b07-pki/svg/ch09-piv-under-cloud.svg){#fig-ch09-piv-under-cloud fig-alt="A top-to-bottom flow. A violet card, HSPD-12 and FIPS 201-3, one credential for employees and contractors that M-19-17 makes primary, points down to a blue card, PIV card, holding the PIV authentication certificate from a Federal PKI issuing CA under the Common Policy root. The PIV card points right to a blue card, derived PIV credential, bound by proving possession of the card and delivered to a phone through Intune. Both credentials point down to a blue card, Entra certificate-based authentication, with a trust store and a CRL per CA, username binding and authentication binding; the edges are labeled PIV auth certificate and own policy OID. To its left a red card, HR leaver gate, separation: disable and revoke sessions now, and revoke the card and every derived credential. Dashed red arrows run from it to the PIV card, labeled revoke then CRL, and to Entra CBA. Entra CBA points down to a green card, Conditional Access, requiring the phishing-resistant MFA authentication strength. Two slate cards feed Conditional Access with dashed arrows: on the left, another agency's Entra tenant, B2B collaboration with inbound trust of its MFA claim; on the right, a partner SAML or WS-Fed provider, guest federation with the MFA grant control rather than a strength. Conditional Access points down to a green card, agency applications, using SAML or OIDC with Entra as the agency's identity provider."}

For logical access, the certificate that matters is the **PIV authentication certificate**: its key is generated on the card and can't be exported, it works over the contact interface only, and the certificate asserts the Federal Common Policy's `id-fpki-common-authentication` policy. That policy OID is what Entra's authentication binding keys on to treat the certificate as multifactor. The card authentication certificate works contactless and without a PIN, so it's a physical-access credential and never multifactor.

Read the lifecycle table and *Revocation at separation is the HR leaver gate's job*. FIPS 201-3 gives a card that can't be collected 18 hours. Entra ID caches each CA's CRL and doesn't use OCSP, so a revocation reaches the cloud only when a newer CRL loads. That's why the leaver gate disables the account and revokes its sessions first, and revokes the card and its derived credentials in parallel. The [HR-Driven Identity guide, Step 6](../../books/guides/hr-driven-identity-implementation.md#step-6-time-separations-and-deprovisioning) runs it.

## Unit 2: Derived PIV credentials (7 minutes)

Read [Chapter 09](../../books/b07-pki/09-federal-workforce-credentials.md), section *Derived PIV credentials*. A derived PIV credential is issued on proof of possession of a valid PIV card, for places where the card is hard to use, mostly mobile devices. NIST SP 800-157 (December 2014) still governs it; Revision 1 is a final public draft. Derived credentials are invalidated whenever the card is terminated.

Intune delivers a derived credential from one supported issuer per tenant, and Entra CBA accepts it on iOS and Android through current MSAL or Microsoft Authenticator. A derived credential whose policy OID differs from the card's doesn't inherit the card's multifactor rule: give it its own rule, multifactor only if its key protection and activation meet AAL3.

## Unit 3: Acceptance, not replacement (12 minutes)

Read [Chapter 09](../../books/b07-pki/09-federal-workforce-credentials.md), sections *How Entra CBA uses the PIV authentication certificate* to *PIV interoperability and federation*. Entra CBA doesn't issue the credential, proof the person or decide eligibility. It accepts the card, and four settings make that acceptance faithful:

1. **Trust the issuing CAs, each with its CRL**, and require CRL validation. Module 3 checked a CA's CRL location and Module 5 its freshness and size.
2. **Bind the certificate to one person** with a high-affinity value in `certificateUserIds`, written by the card management system on every issuance and reissue. The program departs, on Microsoft's advice, from IDManagement.gov's low-affinity `PrincipalName` recommendation.
3. **Make the PIV authentication certificate multifactor** with a binding rule by issuer and policy OID, leaving the tenant default single-factor.
4. **Require the phishing-resistant strength.** That supports M-22-09's requirement for phishing-resistant MFA at the application layer.

[HR-Driven Identity, Module 5](../hr-driven-identity/05-certificate-based-authentication.md) checks the tenant side of settings 1, 3 and 4. This module's lab checks setting 2 per card holder, with the validation kit's **VK-PIV-01**: for each holder on the pilot list, it reads `certificateUserIds` and reports holders not found, holders with no value, and, when high affinity is required, holders with only low-affinity values. It reports each account and the binding types, never a value.

For administrators, the PIV certificate binds to the separate cloud-only admin account with its own high-affinity value, Book 04's CA003 strength requires the PIV authentication issuer and policy OID, and emergency access accounts use a different method, FIDO2 security keys. Accepting other agencies' PIV is the chapter's *PIV interoperability and federation* section.

## Unit 4: Assurance levels and the evidence (5 minutes)

Read [Chapter 09](../../books/b07-pki/09-federal-workforce-credentials.md), sections *NIST SP 800-63-4 assurance levels as they apply* and *The evidence the ISSO keeps*. The ISSO keeps three records: the CBA configuration, each card holder's binding coverage, and the leaver gate's timings. The first comes from the tenant export, the second from VK-PIV-01, and the third from the HR pipeline.

## Exercise: Lab 1, PIV binding on fictional tenants (15 minutes) {#pki-lab-1}

You run VK-PIV-01 on the validation kit's two fictional tenants: one that fails and one that passes. The failing tenant's card holders are alice, bob, carol and dave, the same names as Module 4's forest, so you can match each finding to its cause on the AD side.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\validation-kit

$Run = "C:\FMWLabs\results\pki-07-piv-and-derived-piv\lab1\$((Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHHmmssZ'))"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Load the validation kit
Import-Module .\powershell\ValidationKit -Force
(Get-Module ValidationKit).Version.ToString()

# Step 2: Run VK-PIV-01 on the failing tenant
$fail = Invoke-VkPiv01 -Context (Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z')
'{0} {1}: {2}' -f $fail.CheckId, $fail.Status, $fail.Message

# Step 3: Read what it found for each holder
$fail.Details | ForEach-Object { '{0}: {1}' -f $_.Object, $_.Issue }

# Step 4: Read the binding types behind each finding
$fail.Details | ForEach-Object { '{0,-22} {1}' -f $_.Object, $_.Detail }

# Step 5: Run it on the passing tenant
$pass = Invoke-VkPiv01 -Context (Get-VkRunContext -FixturePath .\tests\fixtures\pass -AsOf '2026-10-29T00:00:00Z')
'{0} {1}: {2}' -f $pass.CheckId, $pass.Status, $pass.Message

# Step 6: Keep both results in the run folder
$fail.Details | Export-Csv -NoTypeInformation -Path "$Run\vk-piv-01-fail.csv"
$pass | Select-Object CheckId, Status, Count, Message | Export-Csv -NoTypeInformation -Path "$Run\vk-piv-01-pass.csv"
Get-ChildItem $Run -Name

# Step 7: List this lab's runs
Get-ChildItem C:\FMWLabs\results\pki-07-piv-and-derived-piv\lab1 -Name
```

:::

<!-- labs:end -->

Every step runs in Windows PowerShell 5.1 or PowerShell 7, and prints the output shown here in either, so you can follow it top to bottom in one window. Open **Windows PowerShell** (or **PowerShell 7**) from the Start menu, then go to the validation kit's folder, where you unzipped it under [Get the code](index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\validation-kit
```

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\pki-07-piv-and-derived-piv\lab1\$((Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHHmmssZ'))"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\pki-07-piv-and-derived-piv\lab1\<run>
```

The run's date is only the folder's name. The data's date is `-AsOf`, which stays the same, so every run's results match this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it.

Prefer Git Bash? Go to the folder with `cd /c/FMWLabs/validation-kit` and make the run folder with `Run=/c/FMWLabs/results/pki-07-piv-and-derived-piv/lab1/$(date -u +%Y-%m-%dT%H%M%SZ); mkdir -p "$Run"`, but every step is a PowerShell command (type `powershell` or `pwsh` to start one there). In a clone of the repository, use the `examples` folder of the same name.

1. **Load the validation kit.**

    ```powershell
    Import-Module .\powershell\ValidationKit -Force
    (Get-Module ValidationKit).Version.ToString()
    ```

    Expected output:

    ```text
    0.1.0
    ```

2. **Run VK-PIV-01 on the failing tenant.** `Get-VkRunContext -FixturePath` reads the fictional tenant's exports instead of signing in:

    ```powershell
    $fail = Invoke-VkPiv01 -Context (Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z')
    '{0} {1}: {2}' -f $fail.CheckId, $fail.Status, $fail.Message
    ```

    Expected output:

    ```text
    VK-PIV-01 Fail: 4 pilot card holder(s); required affinity High; values reported by type only
    ```

    The pilot list, `pilot-card-holders.csv`, names four holders. The check requires high affinity, the program's production position, by default.

3. **Read what it found for each holder.**

    ```powershell
    $fail.Details | ForEach-Object { '{0}: {1}' -f $_.Object, $_.Issue }
    ```

    Expected output:

    ```text
    bob@contoso.example: Only low-affinity binding values: sign-in fails once high affinity is required
    carol@contoso.example: No certificateUserIds value; the binding comes from altSecurityIdentities in AD (only Entra Connect updates certificateUserIds for synced users)
    dave@contoso.example: Pilot card holder not found in the tenant, or not readable
    ```

    Alice passes, so she isn't listed. Three holders would fail to sign in with their cards once high affinity is required.

4. **Read the binding types behind each finding.**

    ```powershell
    $fail.Details | ForEach-Object { '{0,-22} {1}' -f $_.Object, $_.Detail }
    ```

    Expected output:

    ```text
    bob@contoso.example    Synced=False; Values=2; HighAffinity=0; Types=IssuerAndSubject,PrincipalName
    carol@contoso.example  Synced=True; Values=0; HighAffinity=0; Types=
    dave@contoso.example
    ```

    Match them to Module 4's forest. Bob's tenant account isn't synced, so the card management system writes his value directly, and it wrote only `IssuerAndSubject` and `PrincipalName`, both low affinity; in Module 4's forest he also had only a weak `X509IssuerSubject` mapping. The fix on both sides is the same strong form: `IssuerAndSerialNumber` in the tenant, `X509IssuerSerialNumber` in AD. Carol is synced, so her `certificateUserIds` can only come from `altSecurityIdentities` through Entra Connect, and in Module 4 her AD value was a weak `X509RFC822`: fix it in AD with a strong form, and sync carries it up. Dave isn't in the tenant at all: check the pilot list against the HR record.

5. **Run it on the passing tenant.**

    ```powershell
    $pass = Invoke-VkPiv01 -Context (Get-VkRunContext -FixturePath .\tests\fixtures\pass -AsOf '2026-10-29T00:00:00Z')
    '{0} {1}: {2}' -f $pass.CheckId, $pass.Status, $pass.Message
    ```

    Expected output:

    ```text
    VK-PIV-01 Pass: 2 pilot card holder(s); required affinity High; values reported by type only
    ```

    Every holder on this list has a high-affinity value. That's the result the pilot gate needs before card holders move to CBA.

6. **Keep both results in the run folder.**

    ```powershell
    $fail.Details | Export-Csv -NoTypeInformation -Path "$Run\vk-piv-01-fail.csv"
    $pass | Select-Object CheckId, Status, Count, Message | Export-Csv -NoTypeInformation -Path "$Run\vk-piv-01-pass.csv"
    Get-ChildItem $Run -Name
    ```

    Expected output:

    ```text
    vk-piv-01-fail.csv
    vk-piv-01-pass.csv
    ```

    In the program, `Invoke-ValidationKit.ps1 -Track PIV` writes the full result set, with its manifest, into its own run folder; Lab 2 uses it.

7. **List this lab's runs.**

    ```powershell
    Get-ChildItem C:\FMWLabs\results\pki-07-piv-and-derived-piv\lab1 -Name
    ```

    Expected output: one line per run, oldest first, the last one this run:

    ```text
    <run>
    ```

## Exercise: Lab 2, a test tenant {#pki-lab-2}

*Not timed. Not run by the authors. Never production.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
# Step 1: Run the PIV track
Set-Location C:\FMWLabs\validation-kit
$Run = "C:\FMWLabs\results\pki-07-piv-and-derived-piv\lab2"
.\Invoke-ValidationKit.ps1 -OutputPath $Run -Track PIV -InputPath <inputs-folder>

# Step 2: Read the summary
Get-ChildItem $Run -Recurse -Filter ValidationSummary.md | Sort-Object LastWriteTime | Select-Object -Last 1 | Get-Content

# Step 3: Back out
Remove-Item -Recurse -Force $Run
```

:::

<!-- labs:end -->

You run VK-PIV-01 against a test tenant's pilot card holders, signed in with only the read scope it needs. Nothing in this lab changes the tenant.

- **You need:** a test tenant in the commercial cloud (GCC uses it) with CBA set up as Module 4's Unit 4 and HR-Driven Identity Module 5 describe; test users holding test certificates bound in `certificateUserIds`; an account that can consent to `User.Read.All` for the sign-in.
- **You'll replace:** `<inputs-folder>` (a folder holding `pilot-card-holders.csv`, one `UserPrincipalName` per row, as in the kit's fixture).

1. **Run the PIV track**, from the validation kit's folder, in PowerShell 7:

    ```powershell
    Set-Location C:\FMWLabs\validation-kit
    $Run = "C:\FMWLabs\results\pki-07-piv-and-derived-piv\lab2"
    .\Invoke-ValidationKit.ps1 -OutputPath $Run -Track PIV -InputPath <inputs-folder>
    ```

    It signs you in with delegated Graph access for `User.Read.All` only, runs VK-PIV-01 and writes its results, details and manifest under a run folder it names.

2. **Read the summary** it printed the path of:

    ```powershell
    Get-ChildItem $Run -Recurse -Filter ValidationSummary.md | Sort-Object LastWriteTime | Select-Object -Last 1 | Get-Content
    ```

    A test user bound with `PrincipalName` only shows as low affinity, as bob did. The fix is the card management system's, on the user's next issuance or a correction it writes, not this lab's.

3. **Back out.** The run folder holds the test tenant's user names: delete it when you're done.

    ```powershell
    Remove-Item -Recurse -Force $Run
    ```

## Knowledge check (5 minutes)

1. Which certificate on the PIV card is for logical access to federal systems?
    a. The card authentication certificate, which works contactless.
    b. The PIV authentication certificate, whose key is generated on the card and works over the contact interface only.
    c. The key management certificate.

2. Why does the HR leaver gate disable the account before the card's revocation reaches Entra ID?
    a. Entra ID caches each CA's CRL and doesn't use OCSP, so a revocation reaches it only when a newer CRL loads.
    b. Revocation is slower than disabling.
    c. FIPS 201-3 requires that order.

3. A derived PIV credential carries a different policy OID from the card. How does Entra CBA treat it?
    a. As multifactor, like the card.
    b. It doesn't inherit the card's rule: it needs its own, multifactor only if its key protection and activation meet AAL3.
    c. CBA rejects it.

4. Which of the four settings does VK-PIV-01 check?
    a. The trust store and CRLs.
    b. The binding: each card holder's `certificateUserIds`, for no value or only low-affinity values.
    c. The phishing-resistant strength.

5. In Lab 1, carol is synced and has no `certificateUserIds` value. Where is the fix?
    a. In Entra ID, by writing the value directly.
    b. In AD: a strong `altSecurityIdentities` value, which Entra Connect syncs to `certificateUserIds`.
    c. On her card.

6. What method do emergency access accounts use where administrators use PIV?
    a. PIV, like everyone else.
    b. A different method, FIDO2 security keys, and they're excluded from CA003 and every blocking policy.
    c. A password only.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See Unit 1.
2. **a.** See Unit 1 and [Revocation at separation is the HR leaver gate's job](../../books/b07-pki/09-federal-workforce-credentials.md#revocation-at-separation-is-the-hr-leaver-gates-job).
3. **b.** See Unit 2.
4. **b.** See Unit 3 and Lab 1, step 3.
5. **b.** See Lab 1, step 4, and Module 4.
6. **b.** See Unit 3 and [Administrators: the PIV certificate in the privileged strength](../../books/b07-pki/09-federal-workforce-credentials.md#administrators-piv-in-the-privileged-strength).
:::

## Summary (2 minutes)

You ran the validation kit's PIV binding check on a failing and a passing fictional tenant, and traced each finding to its forest-side cause. **Evidence an ISSO keeps from this module:** VK-PIV-01's result for each pilot list from a dated run, the CBA configuration export with the Federal PKI CAs, their CRLs and the multifactor rule, the phishing-resistant strength and CA003, and the leaver gate's two times for each separation.

::: {.callout-tip}
## Continue the path
[← Previous: Module 6](06-lifecycle-monitoring-and-decommissioning.md) · [Learning path](index.md)
:::
