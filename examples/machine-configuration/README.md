# Machine configuration packages: a checked build

A build for Azure Machine Configuration content that runs Learn's own **GuestConfiguration** cmdlets and checks what they produce before anything is published. It is the code for the [developer workbook *Building the Attribute-Driven Migration*, Chapter 07](../../docs/project-plans/developer-workbooks/attribute-driven-migration/07-machine-configuration-packages.md).

Illustrative: tested against fixtures and run offline on Windows with the module versions below, not proven against a production tenant.

## Start with Learn's procedure and Microsoft's samples

Learn documents the whole procedure in [How to develop a custom machine configuration package](https://learn.microsoft.com/azure/governance/machine-configuration/how-to/develop-custom-package/overview) and [How to create custom machine configuration policy definitions](https://learn.microsoft.com/azure/governance/machine-configuration/how-to/create-policy-definition): compile a DSC configuration, package it with `New-GuestConfigurationPackage`, test it with `Get-GuestConfigurationPackageComplianceStatus`, publish it, sign it with `Protect-GuestConfigurationPackage`, and write the definition with `New-GuestConfigurationPolicy`. This build calls those cmdlets; it doesn't replace them.

Learn's overview points to Microsoft's sample resource modules. A pinned, unmodified copy of the worked example project is in [`../third_party/guest-configuration-samples`](../third_party/guest-configuration-samples/SNAPSHOT.md). `tests/LearnBaseline.Tests.ps1` runs the cmdlets and that sample offline and pins what they leave to you:

| What Learn's cmdlets do on their own | What this build adds | Rule |
|---|---|---|
| The compiled MOF records the user name, host name, date and absolute script path | `ConvertTo-McCleanMof` removes them | MC-PKG-04 |
| Compiling writes properties in a different order each run, so the MOF hash changes with no change to the source | `ConvertTo-McCleanMof` sorts them: the same source gives the same MOF bytes on any host, checked with DSC's own MOF deserializer | — |
| `New-GuestConfigurationPackage` writes a different `.zip` each run from the same MOF | Build once, check, and publish those bytes; `provenance.json` records both hashes | MC-POL-02 |
| Nothing checks a package for secrets, though Learn says not to put them there | A scan of the MOF | MC-PKG-05 |
| Nothing ties the package or definition to a reviewed record | `config/releases.json`: fixed policy ID, mode, published version, owner tag, identity | MC-POL-05, -06, -07 |
| An enforcing definition reaches every machine in scope | The owner tag filter (`ConfigOwner`) is required for `ApplyAnd*` modes, matching VK-ARC-07 | MC-POL-08 |
| The definition's `IncludeArcMachines` parameter defaults to `false` | Flagged on every build meant for Arc | MC-POL-09 |
| Learn's SAS example lasts three years | A SAS longer than 90 days is a finding; managed identity is the default | MC-POL-03 |
| The module and resource versions float | `RequiredModules.psd1` pins them; the build stops if one is missing | — |
| Microsoft's pinned `createPackage.ps1` calls `Test-GuestConfigurationPackage`, which version 4.12.0 no longer exports | The build uses the current cmdlets; the baseline test pins the difference | — |

## Layout

```
RequiredModules.psd1           exact module versions for a build
config/releases.json           release registry: one entry per configuration
configurations/                DSC configurations (TlsServerProtocols.ps1: audit TLS 1.0/1.1 server off)
powershell/McPipeline.psm1     the checks and the provenance manifest (no module or network needed)
powershell/Invoke-McBuild.ps1  compile, clean, package, define, check, write provenance.json
tests/McPipeline.Tests.ps1     Pester 5, fixtures only
tests/LearnBaseline.Tests.ps1  Pester 5, runs Learn's cmdlets and the pinned sample offline
tests/fixtures/                compiled MOFs (two property orders) and definitions the cmdlets wrote
```

## Run

PowerShell 7.1 or later on Windows (Learn: the module installs on Windows and Ubuntu 20+). Save the pinned modules to a folder instead of installing them:

```powershell
Save-Module GuestConfiguration -RequiredVersion 4.12.0 -Path ./mcmods
Save-Module PSDesiredStateConfiguration -RequiredVersion 2.0.7 -Path ./mcmods
Save-Module PSDscResources -RequiredVersion 2.12.0.0 -Path ./mcmods

pwsh ./powershell/Invoke-McBuild.ps1 -Name TlsServerProtocols -Version 1.0.0 `
    -ContentUri https://<storage-account>.blob.core.windows.net/machine-configuration `
    -ModulePath ./mcmods -OutputPath ./out
```

Exit codes: 0 passed (warnings and information allowed), 2 findings, 1 error. Output in `out/TlsServerProtocols_1.0.0/`: the cleaned MOF, the package, the definition, `findings.json` and `provenance.json`. Nothing signs in to Azure or uploads anything; publishing uses Learn's own commands, on output that passed. The chapter's Lab 2 walks through it, including the Azure Government sign-in.

## Test

```powershell
Invoke-Pester ./tests                       # 48 fixture tests; the 16 baseline tests skip
$env:MC_MODULE_PATH = (Resolve-Path ./mcmods).Path
Invoke-Pester ./tests                       # all 64
```

## Rules

| Rule | Severity | Checks |
|---|---|---|
| MC-PKG-01 | Finding | `<Name>.mof` and `<Name>.metaconfig.json` at the package root |
| MC-PKG-02 | Finding | Package type (`Audit` or `AuditAndSet`) is the one the registry mode needs |
| MC-PKG-03 | Finding | Uncompressed size within Learn's 100 MB limit |
| MC-PKG-04 | Finding | No build-host data or absolute paths in the MOF |
| MC-PKG-05 | Finding | Nothing in the MOF looks like a secret |
| MC-PKG-06 | Finding | Every module the MOF imports is in the package at the same version |
| MC-PKG-07 | Warn | The package name carries a version (Learn's lifecycle guidance) |
| MC-POL-01 | Finding | `metadata.category` is `Guest Configuration` |
| MC-POL-02 | Finding | `contentHash`, everywhere it appears, is the package's SHA-256 |
| MC-POL-03 | Finding / Warn | HTTPS content URI; a SAS token is a warning, one valid past 90 days a finding |
| MC-POL-04 | Finding | The content URI names this build's package |
| MC-POL-05 | Finding | The definition's name is the registry's fixed policy ID |
| MC-POL-06 | Finding | The version is greater than the published one |
| MC-POL-07 | Finding | Effect and assignment type match the registry mode |
| MC-POL-08 | Finding | An enforcing definition filters on the owner tag |
| MC-POL-09 | Info / Finding | Arc reminder for `IncludeArcMachines`; a user-assigned identity can't serve Arc |

## Known limits

- The package's agent-side behavior (`Get-GuestConfigurationPackageComplianceStatus`, `Start-GuestConfigurationPackageRemediation`) isn't in the automated tests: Learn says the first run installs the agent and needs elevation. Run it on a disposable test machine (Lab 2).
- The cleaned MOF parses to the same resources with DSC's deserializer, but its acceptance by the agent on a machine is shown in Lab 2, not in the unit tests.
- Signing (`Protect-GuestConfigurationPackage`) follows Learn's procedure and isn't wrapped here.
- Windows configurations only. Learn says Linux configurations compile with the PSDesiredStateConfiguration 3.0.0 prerelease.
