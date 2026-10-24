# Cisco Catalyst SD-WAN: read-only ED 26-03 gate and evidence collector

> **Status: illustrative. Unit-tested against mocked responses, not proven against a live fabric.**
> This is one way to produce some of the evidence [Book 09](../../docs/books/b09-network/index.md) asks of an SD-WAN fabric, on one named product. It is not an endorsement of the product by any agency, and no agency has adopted it. Product and API facts were checked against Cisco's documentation on October 24, 2026. The explanation, with sources, is the research page [Building Book 09's SD-WAN Design on Cisco Catalyst SD-WAN](../../docs/research/cisco-sdwan-implementation.md).

## What it does

One Python script, `python/sdwan_evidence.py`, signs in to Catalyst SD-WAN Manager, makes only `GET` requests, and writes two files:

| Output | Contents | Book 09 use |
|---|---|---|
| `out/ed-26-03-gate.csv` | One row per control component (Manager, Controller, Validator) per advisory: running release, the fixed release it needs, and `pass`, `fail` or `confirm` | The gate before the fabric carries production traffic ([Chapter 05](../../docs/books/b09-network/05-sd-wan-sase-and-governed-transport.md), [Chapter 13](../../docs/books/b09-network/13-sequencing-cost-and-evidence.md) step 0) |
| `out/sdwan-evidence.json` | The gate findings, plus evidence records: a fleet inventory record per device (CM-8, SI-2) and a management audit record per Manager audit-log entry (AU-6, AU-9, AC-6(9)), with review flags | The inventory and off-box log evidence in Chapter 05's table of controls owed to the governor |

It also flags any Manager, Controller or Validator that Manager knows about but your expected inventory doesn't list. That is a narrow, API-side version of the "validate every peer" step in CISA's hunt guidance; it is not a hunt, and it doesn't replace reviewing the logs CISA names.

The exit code is `0` when every gate row passes, `2` when any row fails or needs confirmation, and `1` on an error, so a pipeline can stop a cutover on it.

## What the gate checks, and what it doesn't

`data/ed-26-03-fixed-releases.json` lists the first fixed releases from Cisco's advisories for the nine Catalyst SD-WAN CVEs in CISA's Known Exploited Vulnerabilities catalog (catalog version 2026.10.23): CVE-2026-20127, CVE-2022-20775, CVE-2026-20122, CVE-2026-20128, CVE-2026-20133, CVE-2026-20182, CVE-2026-20245, CVE-2026-20262 and CVE-2026-76504. **The file is a transcription, not an authority.** Re-read every advisory, and the KEV catalog, before you rely on it; Cisco revises fixed-release tables, and new advisories arrive on its twice-monthly publication schedule.

How a release is judged:

- On a train the advisory lists, the release passes if it is at or above the fixed release on its own maintenance branch (the first three numbers), or newer than every listed fix. `20.12.6.0` fails against a `20.12.6.1` fix even though it is above `20.12.5.3`.
- A train that has reached End of Software Maintenance, or whose only fix is on another train, fails: migrate.
- A train the advisory doesn't list at all returns `confirm`. Ask Cisco; don't assume.

It doesn't check WAN edges against these advisories (they cover the control components), IOS XE advisories for the edges, hardening settings, or whether a compromise already happened. Those are build and hunt tasks on the research page.

## Run it

Requires Python 3.10 or later and nothing outside the standard library.

```text
copy config\config.example.json config\config.json      (then edit it)
set SDWAN_API_USERNAME=<a read-only Manager account>
set SDWAN_API_PASSWORD=<its password>
python python\sdwan_evidence.py --config config\config.json
```

- Use a Manager account with a read-only role (for example a copy of the `operator` role), not `netadmin`.
- `auth_mode` is `jwt` for SD-WAN Manager 20.18.1 and later (`POST /jwt/login`, bearer token, short duration; Cisco documents no JWT sign-out) or `session` for earlier releases (`POST /j_security_check`, then `GET /dataservice/client/token`, then `POST /logout`).
- The loader refuses config keys that look like secrets, and refuses a Manager URL that isn't `https://`. Certificate verification is always on; set `ca_bundle` to your enterprise CA bundle if Manager's web certificate is issued by it, as CISA's hardening guidance asks.
- Run it from a host on the management network. Book 09 and the hardening guidance put Manager's management interface on an isolated management VLAN, reachable only from jump hosts.

## Test it

```text
python -m pytest -q -p no:cacheprovider tests
```

The tests answer every HTTP call from `tests/fixtures/` and cover the release logic, the read-only guard, both sign-in modes, the audit query, the end-to-end output and the configuration checks. They prove the code does what it says against the fixtures; they don't prove the fixtures match your Manager release.

## Known limits

- **Field names.** The device fields (`host-name`, `system-ip`, `device-type`, `version`, `board-serial`, `device-model`) follow Cisco's API examples and Cisco's own Python SDK; the audit-log fields follow Cisco's `AuditLogEntry` schema. Confirm both against your release.
- **Audit-log query.** The `last_n_hours` rule follows the query format Cisco's examples use for alarms. That it works the same way for `/dataservice/auditlog` is an inference to test.
- **Review flags are heuristics.** "Successful sign-in" matches text in the audit message; CISA's alert asks you to match the `Authentication succeeded for` syslog string against authorized users in the SIEM, which is the stronger check.
- **Not the whole evidence schema.** Book 09's `sdwan_decision` record (path selection, failover, steering) needs application-route statistics and policy state that this script doesn't read.

```
examples/cisco-sdwan/
  README.md
  config/config.example.json          placeholders only
  data/ed-26-03-fixed-releases.json   fixed releases per advisory, as of 2026-10-24
  python/sdwan_evidence.py            the collector (read-only)
  tests/test_sdwan_evidence.py        pytest, mocked HTTP
  tests/fixtures/                     device list, audit log and JWT sign-in samples
```
