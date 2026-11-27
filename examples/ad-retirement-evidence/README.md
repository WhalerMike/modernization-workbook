# AD retirement evidence: the G5 packet

> **Status: illustrative.** Tested on fictional fixtures (`tests/`), in Windows PowerShell 5.1 and PowerShell 7; not run against a live forest. Read only: it changes nothing in Active Directory, DNS or the workspace.

Gate G5, *AD Retired*, passes when the "domain controllers [are] decommissioned, or retained as a documented Kerberos island with an end-of-life date; evidence packet in the repository and the SIEM; no live production dependency on AD authentication" ([Book 01, Chapter 12](../../docs/books/b01-transformation-arc/12-migration-roadmap.md)). [Book 00, Chapter 10](../../docs/books/b00-orientation/10-retirement-steady-state-and-success.md#phase-5-ad-ds-retirement) sets out Phase 5's steps. This kit produces the packet: it reads what still runs and what still authenticates, compares it with the island register, and says whether the gate owner can pass the gate.

## What it checks

| Check | What it finds | Where Book 00 deals with it |
|---|---|---|
| AD-G5-01 | A domain controller that is neither decommissioned nor in the island register | Phase 5: demote or isolate the rest |
| AD-G5-02 | An island with no end-of-life date, or one that has passed; a workload past its own date | G5: "an end-of-life date" |
| AD-G5-03 | An NTDS Settings object for a server that is no longer a domain controller | Removing each domain controller cleanly, step 3 (metadata cleanup) |
| AD-G5-04 | A DC locator SRV record (`_ldap._tcp.dc._msdcs.<domain>`) pointing at a host that isn't an island domain controller | Phase 5: the domain's DNS zones move or retire with them |
| AD-G5-05 | A trust the register doesn't list | Phase 5 |
| AD-G5-06 | An SPN on a user or managed service account the register doesn't list: a service still needs Kerberos from the domain | G4: every SPN migrated, retired or islanded |
| AD-G5-07 | Authentication on the domain controllers (Kerberos 4768 and 4769, NTLM 4776) from an account the register doesn't list | G5: "no live production dependency on AD authentication" |
| AD-G5-08 | (a warning) An enabled computer that signed in to the domain in the window and isn't a listed host | G4: PCs cloud-joined |

The island register, [`config/island-register.json`](config/island-register.json), is the documented Kerberos island: the domain controllers kept, the workloads with their accounts and SPNs, the trusts, the hosts allowed to authenticate, and the end-of-life dates. An empty `domainControllers` list means full retirement. The island's AD objects are a dated WD-065 exception, as the platform host's are ([WD-183](../../docs/about/decision-register.md#wd-183)).

## Lab 1: the fixtures, no forest

From the `ad-retirement-evidence` folder, in Windows PowerShell 5.1 or PowerShell 7:

```powershell
./Invoke-AreEvidence.ps1 -Domain corp.contoso.example -FixturePath tests/fixtures/island -OutputPath out/g5 -AsOf 2026-11-27
```

`Ready` is `False`, with 7 findings and 1 warning: a second domain controller still running (AD-G5-01), metadata and an SRV record left for a removed one (AD-G5-03, AD-G5-04), a trust (AD-G5-05), a reporting service's SPN and its NTLM sign-ins (AD-G5-06, AD-G5-07), a person still signing in to a domain controller (AD-G5-07), and a PC still signing in to the domain (AD-G5-08). Read them:

```powershell
Get-Content out/g5/summary.md
```

A full retirement, with nothing left:

```powershell
./Invoke-AreEvidence.ps1 -Domain corp.contoso.example -FixturePath tests/fixtures/retired -RegisterPath tests/fixtures/retired/island-register.json -OutputPath out/g5-retired -AsOf 2026-11-27
```

`Ready` is `True`. The tests:

```powershell
Invoke-Pester -Path tests
```

## Lab 2: a test forest

On a domain-joined machine with RSAT's Active Directory module, as an account with default read in a **test** forest:

1. Export the authentication rows from the workspace your domain controllers forward to. Run [`queries/dc-authentication.kql`](queries/dc-authentication.kql) in Log Analytics and export the result as `dc-auth.csv`, or pass `-WorkspaceId` to run it with Az.OperationalInsights as a Log Analytics Reader.
2. Copy `config/island-register.json`, set the domain, and list your island's domain controllers, workloads, trusts and hosts (or none, for full retirement).
3. Write the packet:

   ```powershell
   ./Invoke-AreEvidence.ps1 -Domain <test domain> -AuthPath .\dc-auth.csv -RegisterPath .\island-register.json -OutputPath .\g5-packet
   ```

4. After the last domain controller is gone, record the full retirement from DNS and the SIEM alone:

   ```powershell
   ./Invoke-AreEvidence.ps1 -Domain <test domain> -NoDomain -AuthPath .\dc-auth.csv -RegisterPath .\island-register.json -OutputPath .\g5-final
   ```

Back it out: the kit writes only the packet folder; delete it.

## What it reads

Everything is declared in [`config/calls.json`](config/calls.json): `Get-ADDomainController`, `Get-ADObject` (NTDS Settings in the Configuration partition, and objects with an SPN), `Get-ADTrust` and `Get-ADComputer`, all at the default read any domain account has; `Resolve-DnsName` for the SRV records; and the workspace query as a Log Analytics Reader. A test fails if the module calls a cmdlet that changes Active Directory or DNS.

## The packet

`dcs.json`, `ntds.json`, `trusts.json`, `spns.json`, `computers.json`, `srv.json`, `auth.json`, `findings.json`, `summary.md`, and `manifest.json` with each file's SHA-256, the island register's SHA-256, the controls (CM-8, AC-2, IA-2, AU-6, CA-7, SA-22) and the KSIs (KSI-PIY-GIV, KSI-IAM-AAM, KSI-MLA-EVC). Commit the packet to the repository and send the manifest's hash to the SIEM, as G5 asks. The evidence supports those controls; the gate owner checks it and the assessor decides them. KSIs are FedRAMP's provider indicators, which the agency lines its own evidence up with.

## Not covered

- Demotion and metadata cleanup themselves: Book 00, Chapter 10 gives the steps; this kit checks they happened.
- Records and media sanitization: Book 00, Chapter 10's checklist; the authorization side, closing the domain's authorization, is Book 14's.
- Hybrid-joined devices in Microsoft Entra ID: AD-G5-08 reads the domain side only.
