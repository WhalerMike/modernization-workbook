# Verification — Chapter 08, AD CS Dependencies

New material, written November 24, 2026. Code: `examples/sql-server-identity` (new in this change). Every Microsoft fact was read on Microsoft Learn on November 24, 2026 with WebFetch; the Book 06 citations it reuses (Chapter 22 `c22-certreq`, `c22-principals`, `c22-create-login`, `c22-create-cert`, `c22-cloudpki`; Runbook R10 `r10-certificates`, `r10-encryption`, `r10-dbm-endpoints`) were re-read that day rather than carried.

Lab 1 was first run by hand on November 24, 2026; superseded by the re-run below.

## Claims log

| # | Claim (short) | Where | Source URL | Read | Result |
|---|---|---|---|---|---|
| 1 | TLS certificate: Server Authentication EKU; `KeySpec` `AT_KEYEXCHANGE`; KSP gives `KeySpec = 0`; SAN with client names | Start with; Verified facts | <https://learn.microsoft.com/sql/database-engine/configure-windows/certificate-requirements> | Nov 24, 2026 | verified |
| 2 | Validity checked only at configuration; validating clients fail on an expired certificate | Start with; Verified facts | same as 1 | Nov 24, 2026 | verified ("Expired certificates") |
| 3 | Precedence: configured; else FQDN certificate the service account can read; else self-generated | Start with; Verified facts | <https://learn.microsoft.com/sql/database-engine/configure-windows/configure-sql-server-encryption> | Nov 24, 2026 | verified |
| 4 | `sys.dm_server_registry` returns `SuperSocketNetLib` values; `VIEW SERVER PERFORMANCE STATE` on 2022+ | Start with; Lab 2 step 1 | <https://learn.microsoft.com/sql/relational-databases/system-dynamic-management-objects/sys-dm-server-registry-transact-sql> | Nov 24, 2026 | verified |
| 5 | Type C = login mapped to a certificate | Start with; Verified facts | <https://learn.microsoft.com/sql/relational-databases/system-catalog-views/sys-server-principals-transact-sql> | Nov 24, 2026 | verified |
| 6 | Certificate and key logins "used only for code signing"; "can't be used to connect" | Start with; Verified facts | <https://learn.microsoft.com/sql/t-sql/statements/create-login-transact-sql> | Nov 24, 2026 | verified (quoted) |
| 7 | `sys.certificates`: `issuer_name`, `expiry_date`, `sid` = login SID, `thumbprint` | Start with; Lab 2 step 3 | <https://learn.microsoft.com/sql/relational-databases/system-catalog-views/sys-certificates-transact-sql> | Nov 24, 2026 | verified |
| 8 | Self-signed generation; signing functions don't check expiry; Service Broker and backup encryption do | Start with; Verified facts | <https://learn.microsoft.com/sql/t-sql/statements/create-certificate-transact-sql> | Nov 24, 2026 | verified |
| 9 | Endpoint `connection_auth_desc`, `certificate_id`; `VIEW SERVER SECURITY STATE` on 2022+ | Start with; Lab 2 step 4 | <https://learn.microsoft.com/sql/relational-databases/system-catalog-views/sys-database-mirroring-endpoints-transact-sql> | Nov 24, 2026 | verified |
| 10 | Cloud PKI issues only to Intune-enrolled devices through SCEP | Start with; Verified facts | <https://learn.microsoft.com/intune/cloud-pki/> | Nov 24, 2026 | verified |
| 11 | Book 07's issuer decision for SQL Server TLS (retained AD CS through the lifecycle platform) | The code | `docs/books/b07-pki/04-the-target-pki.md`, `07-coexistence-and-migration.md`; Book 06 Chapter 22 (repository) | Nov 24, 2026 | verified in the repository |
| 12 | Classes, AD CS match, window, action text | The code | `Get-SqlCertificateDependency`; `config/thresholds.json` | Nov 24, 2026 | verified against the code and the `Chapter 08` tests (3 passed) |
| 13 | Lab 1 outputs | Lab 1 | local run | Nov 24, 2026 | verified by running |
| 14 | Lab 2 | Lab 2 | — | — | not run (no test instance) |

## Book 06 and Book 07 against the kit

- **Action text (resolved).** The actions now follow Book 06 Chapter 22 and Book 07 Chapter 04: TLS "Retained AD CS issues it through the CLM platform (Book 07, Ch 04); move it before this CA is retired"; login and endpoint "Not renewed by the CLM platform: replace or re-map before this CA is retired (Chapter 22)"; client-auth "NTLM interim: it also depends on the domain controllers certificates; retire it with the interim posture". `Invoke-SqlCertDependency.ps1`'s last line still prints "Blocking an AD CS decommission: 4 of 5"; the chapter keeps it and says it counts the AD CS-issued rows. The script's synopsis still says "re-issue or replace before that CA is decommissioned".
- **The `client-auth` class.** The kit attaches a certificate-based sign-in certificate to an instance (SQLFCI04). Book 06 Chapter 22 says SQL Server has no client-certificate login: the interim posture's AD CS dependency is the domain controllers' certificates (and any non-PIV user certificates), which Book 07 keeps on autoenrollment. The chapter explains the row that way.
- **Expiry warning on type C rows.** The kit warns on a type C certificate inside 90 days. R10 says expiry there locks nobody out; the chapter says the issuer, not the date, is the reason to replace it.
- `tests/fixtures/certs/certs.json` has no `KeySpec` field, so the kit can't flag a KSP renewal (Book 06 Chapter 22's test before renewal).

## Update after the kit's fixes (November 24, 2026)

Lab 1 was re-run on November 24, 2026, after the kit's fixes (89 Pester tests pass), with `python scripts/kit_captures.py sql`, which runs every Lab 1 command exactly as written, in order, in a scratch copy of `examples/`; each `text` block is now that run's output (Windows names keep their backslashes, which the capture writes as forward slashes). `examples/sql-server-identity/out` doesn't exist afterwards.

- The chapter's action table, the paragraph under it and the TLS danger now quote the kit's new action text. The `KeySpec` gap stays open.

## Federal requirements and evidence

Controls and KSIs are the `CERTS` step's in `config/requirements.json` (SC-8, SC-12, SC-17; KSI-SVC-SIN, KSI-SVC-ASM); no new pair. Claim language: "supports" and "provides evidence for", never "satisfies".

## Review gate

`review-status: pending`. Not approved here.
