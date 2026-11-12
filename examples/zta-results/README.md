# Zero Trust Assessment results as evidence

Microsoft's Zero Trust Assessment writes its results to a JSON file in the report folder: `<Path>/zt-export/ZeroTrustAssessmentReport.json`. This kit reads that file, without ever connecting to a tenant, and turns it into the program's evidence. It is the code behind the [Zero Trust Assessment implementation guide](../../docs/books/guides/zero-trust-assessment-implementation.md) and its learning path.

- **Normalize.** Every test result gets one of the seven normalized results of [Book 11, Chapter 10](../../docs/books/b11-zero-trust/10-evidence-not-verdicts.md#a-normalized-result-taxonomy): Pass, Fail, Planned, Skipped-Licensing, Skipped-Disconnected, Skipped-Not-Applicable or Unable-to-Evaluate. The tool's own status and skip reason are kept beside it. A skipped test is not a failed control and not a pass: it is counted in its own column, with what to do about it. Investigate counts as a finding until a recorded manual review confirms or dismisses it.
- **Register.** One closure-register entry per finding, with the fields of Book 11's closure chain, the finding family and the workbook page that remediates it ([Book 11, Chapter 08](../../docs/books/b11-zero-trust/08-close-before-you-assess.md#finding-families)), the evidence that shows the finding is ready for closure, a default priority, and any exception with its approval state. Closure is never set: the authorizing official or assessor decides.
- **Compare.** Two runs, by test ID: new, regressed, fixed, still open, and no longer evaluated. A finding the tool skipped this time isn't fixed. Runs from different tool versions aren't compared until someone records that they reviewed the change.
- **Evidence.** Each output folder is recorded with its NIST SP 800-53 Rev. 5 controls and FedRAMP 20x KSIs, the SHA-256 of every file and of the source export, and the hash of the record before it, so the records form a chain an ISSO checks with `sha256sum -c`.

Read-only and illustrative: tested against fictional fixtures built from the 3.1.0 export's shape, not against a live tenant. It needs PowerShell 7.1 or later and, for the tests, Pester 5. Nothing else.

## Layout

```
Invoke-ZtaNormalize.ps1             normalize an export: results.json/.csv, summary.json/.md, dispositions.csv, manifest.json
Invoke-ZtaRegister.ps1              the closure register: register.json/.csv, manifest.json
Invoke-ZtaCompare.ps1               compare two normalized runs: comparison.json/.md, manifest.json
Invoke-ZtaEvidence.ps1              record an output folder as evidence; -Check verifies the folder and a package
config/taxonomy.json                the tool's statuses and skip reasons (3.1.0) mapped to the seven results; the scoring
config/finding-families.json        each finding family: remediation page, owner, attack path, ready-for-closure evidence, controls; test routing
config/requirements.json            each step's SP 800-53 controls and KSIs, and what each package needs
templates/                          reviews and exceptions to fill at work
copilot-prompts.md                  prompts for Microsoft 365 Copilot Chat to draft reviews and check exceptions
powershell/ZtaResults/              the module
tests/                              Pester 5
tests/fixtures/run-2026-10-27, run-2026-11-10   two fictional Contoso exports, two weeks apart (make_fixtures.py writes them)
tests/fixtures/inputs/              a fictional review and two fictional exceptions
```

## What the kit reads

The file is the one `Invoke-ZtAssessment` writes in its fifth stage, *Writing Assessment Report Data*, as `zt-export/ZeroTrustAssessmentReport.json` under `-Path` (default `.\ZeroTrustReport`). At release 3.1.0 its top level is `ExecutedAt`, `TenantId`, `TenantName`, `Domain`, `Account`, `CurrentVersion`, `LatestVersion`, `TestResultSummary`, `Tests`, `TenantInfo` and the `EndOfJson` marker the tool writes last. Each item in `Tests` carries `TestId`, `TestTitle`, `TestStatus`, `TestSkipped`, `SkippedReason`, `TestRisk`, `TestImpact`, `TestImplementationCost`, `TestPillar` (a string, or an array for a test filed under several pillars), `TestCategory`, `TestMinimumLicense`, `TestDescription` and `TestResult`. The kit reads the run metadata and those test fields, never `TenantInfo`, and copies no `TestResult` or `TestDescription` text into its outputs, because that text can name tenant objects.

| Tool status | Skip reason | Normalized |
|---|---|---|
| Passed | | Pass |
| Failed | | Fail |
| Investigate | | Fail, flagged for manual review; a recorded review can dismiss it to Pass |
| Planned | `UnderConstruction` | Planned |
| Skipped | `NotLicensedEntraIDP1`, `NotLicensedEntraIDP2`, `NotLicensedEntraIDGovernance`, `NotLicensedEntraWorkloadID`, `NotLicensedIntune`, `NoCompatibleLicenseFound` | Skipped-Licensing |
| Skipped | `NotConnectedAzure`, `NotConnectedExchange`, `NotConnectedSecurityCompliance`, `NotConnectedToService`, `NoAzureAccess` | Skipped-Disconnected |
| Skipped | `NotApplicable`, `NotDotGovDomain`, `NotSupported` | Skipped-Not-Applicable (`NotSupported` is flagged as a boundary finding; `NotDotGovDomain` for review) |
| Skipped | `TimeoutReached` | Unable-to-Evaluate |
| Error | | Unable-to-Evaluate |
| anything else | anything else | Unable-to-Evaluate, flagged unmapped |

The statuses come from the tool's `Get-ZtTestStatus.ps1` and the skip reasons from `Add-ZtTestResultDetail.ps1` and `Get-ZtSkippedReason.ps1` at tag 3.1.0. An export from another version is still normalized, but the summary says the taxonomy hasn't been reviewed for it.

## Lab 1: fixtures, no tenant

From `examples/zta-results`, in PowerShell 7:

```powershell
Invoke-Pester -Path tests
./Invoke-ZtaNormalize.ps1 -ExportPath tests/fixtures/run-2026-10-27 -OutputPath out/run1
./Invoke-ZtaRegister.ps1 -RunPath out/run1 -OutputPath out/run1-register
./Invoke-ZtaNormalize.ps1 -ExportPath tests/fixtures/run-2026-11-10 -OutputPath out/run2 -ReviewsPath tests/fixtures/inputs/reviews.csv
./Invoke-ZtaRegister.ps1 -RunPath out/run2 -OutputPath out/run2-register -ExceptionsPath tests/fixtures/inputs/exceptions.csv
./Invoke-ZtaCompare.ps1 -PreviousPath out/run1 -CurrentPath out/run2 -OutputPath out/compare
./Invoke-ZtaEvidence.ps1 -EvidencePath out/evidence -RunPath out/run2 -AsOf 2026-11-10T20:00:00Z
./Invoke-ZtaEvidence.ps1 -EvidencePath out/evidence -RunPath out/run2-register -AsOf 2026-11-10T20:01:00Z
./Invoke-ZtaEvidence.ps1 -EvidencePath out/evidence -RunPath out/compare -AsOf 2026-11-10T20:02:00Z
./Invoke-ZtaEvidence.ps1 -EvidencePath out/evidence -Check -Package re-run -RunDate 2026-11-10
```

The first run has 33 tests: 8 pass, 17 are findings (one of them Investigate), and 8 are neither, in the Planned, Skipped and Unable-to-Evaluate columns. Its register routes 16 findings to a family and leaves the Safe Links test unrouted. The second run, two weeks later, has 34 tests and 15 findings. The comparison shows 3 fixed, 1 regressed, 2 new, 12 still open, and 2 findings no longer evaluated because the run lost its Azure and Exchange connections: they aren't fixed. The register shows one governed exception and one whose approver is wrong for a standing acceptance. The evidence check passes.

## Lab 2: a real export, in a test tenant

Run the Zero Trust Assessment in a test tenant (the guide's [Steps 2 to 5](../../docs/books/guides/zero-trust-assessment-implementation.md)), then point the kit at the folder it wrote. `<report-folder>` is the `-Path` you gave `Invoke-ZtAssessment`; `<evidence-folder>` is a protected folder inside the boundary:

```powershell
./Invoke-ZtaNormalize.ps1 -ExportPath <report-folder> -OutputPath out/live
./Invoke-ZtaRegister.ps1 -RunPath out/live -OutputPath out/live-register
./Invoke-ZtaEvidence.ps1 -EvidencePath <evidence-folder> -RunPath out/live
./Invoke-ZtaEvidence.ps1 -EvidencePath <evidence-folder> -RunPath out/live-register
./Invoke-ZtaEvidence.ps1 -EvidencePath <evidence-folder> -Check -Package first-run
```

The kit's outputs carry test IDs, titles and counts, but they still describe where the tenant is weak: keep them, like the export, inside the boundary.

## Federal requirements and evidence

| Step | NIST SP 800-53 Rev. 5 | KSI | What the ISSO keeps |
|---|---|---|---|
| Normalize | CA-2, CA-7, CM-6 | KSI-PIY-RIS, KSI-MLA-EVC, KSI-SVC-ACM | `results.json`, `summary.json`, `dispositions.csv`, the source export's SHA-256 |
| Register | CA-5, RA-7, CA-7 | KSI-MLA-EVC (none listed for CA-5 or RA-7) | `register.json`, `register.csv`, the exceptions file's SHA-256 |
| Compare | CA-7, CM-6 | KSI-MLA-EVC, KSI-SVC-ACM, KSI-CMT-RMV | `comparison.json`, `comparison.md` |
| Evidence | AU-9, CA-7 | KSI-MLA-OSM, KSI-SVC-VRI, KSI-MLA-EVC | `records/`, `records.csv`, `SHA256SUMS` |

The KSIs are those [Book 13, Appendix A](../../docs/books/b13-governance/appendix-a-requirements-mapping.md) lists for each control. KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its own evidence up with them and doesn't report them. The records support these controls; the agency's assessor decides whether each is satisfied.
