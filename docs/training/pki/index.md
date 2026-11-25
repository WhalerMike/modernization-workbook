---
title: "Learning path: PKI and Certificates"
subtitle: "Modules on the certificate estate that outlives every migration: what AD CS holds up, hardening what stays, the target PKI and who owns it, and device and user certificates, with labs on a fictional PKI snapshot and in your own test forest"
description: "A learning path for PKI owners, AD CS administrators, identity and endpoint engineers and ISSO reviewers, built from Book 07, PKI & Certificates, and the Start Kit's AD CS assessment: inventorying the CAs, templates and Public Key Services objects AD CS keeps in the forest, and giving every template a starting MIGRATE, BRIDGE, RETAIN or RETIRE class from Appendix B for its owner to confirm; then finding the ESC1, ESC2, ESC4 and ESC6 misconfigurations the kit checks, reading the CA audit filter, remediating under the migration gate and proving the fix with a second run; mapping each template to its issuer in the target, checking each CA's CRL and AIA locations for Entra certificate-based authentication and a Cloud PKI BYOCA issuing CA, and naming a renewal owner for each certificate class; and reading the strong certificate mapping evidence, from weak altSecurityIdentities values to the KDC's events and the NTAuth store. Each module has a knowledge check; Lab 1 runs the kit on a fictional Contoso PKI snapshot with no directory, and Lab 2 runs it in your own test forest."
doc-type: training-path
research-status: draft
research-type: training module
research-book: "Book 07"
series-order: 0
listing:
  - id: pki-modules
    contents:
      - "[0-9][0-9]-*.md"
    type: table
    fields: [title, description]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
review-status: approved
reviewed-sha256: 68fa4a3430238e4f5d91b6e20f659dc5eff31bc4d9cfe70cd4d77ce3ce6ef6d8
last-reviewed: 2026-11-25
---
# Learning path: PKI and Certificates {.unnumbered}

Certificates don't move when the directory moves. They keep working, unchanged, until they expire or are revoked, and then whatever relied on them stops. This learning path teaches you to find out what the existing Active Directory Certificate Services (AD CS) estate holds up, to make the part that stays safe, and to produce the evidence an assessor reads. You work through [Book 07, PKI & Certificates](../../books/b07-pki/index.md) with the [Start Kit](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/start-kit)'s AD CS assessment on your laptop.

**Watch first.** Book 07's narrated presentation, about 13 minutes with captions, covers the book in one sitting: [▶ watch it in the browser](../../presentations/watch.html?v=B07_PKI_Narrated). The [technical deep dive](../../presentations/watch.html?v=B07_PKI_Technical_Narrated), about 25 minutes, goes further into hardening and the target PKI.

Like a [Microsoft Learn learning path](https://learn.microsoft.com/training/), it is a short series of modules, each built on the one before. The modules don't repeat Book 07. They tell you what to read, in what order, what to run, and what to check you understood. The path has no developer workbook: its labs run the Start Kit directly, as the [Zero Trust Assessment path](../zero-trust-assessment/index.md) runs its results kit.

## Who this path is for

| Role | What you get from the path |
|---|---|
| PKI owner | The CA inventory record, a starting class for every template, and the list of templates only you can classify |
| AD CS administrator | The kit's read-only commands, the four misconfigurations it checks, the audit filter, and the order of a safe remediation |
| Identity and endpoint engineers | Which templates move to Cloud PKI or Entra certificate-based authentication, and which stay on AD CS and why |
| ISSO reviewer | The inventory and findings files, the before-and-after comparison that shows a finding closed, and the evidence each module keeps |

**Level:** intermediate. **Products:** Active Directory Certificate Services, the Start Kit's `FMPADAssessment` module, `certutil`. **Scope:** a civilian agency at FedRAMP Moderate in Microsoft 365 GCC, with an AD CS hierarchy that stays in service during the migration.

## Prerequisites

- [Book 07, Chapter 01](../../books/b07-pki/01-why-certificates-outlive-every-migration.md): why certificates outlive every migration. Fifteen minutes; Module 1 builds on it.
- Windows PowerShell 5.1 on a Windows laptop for Lab 1, with no RSAT and no domain: the Start Kit is an on-premises kit and runs in the edition its scripts declare.
- For Lab 2: a test forest, never production, with an enterprise CA, and a domain-joined host with the RSAT Active Directory module.

## Get the code {#get-the-code}

Download [start-kit.zip](../../../downloads/start-kit.zip) to your Downloads folder. It holds the Start Kit itself. Unzip it into `C:\FMWLabs\start-kit` (in Windows' **Extract All**, type that folder in place of the one it suggests), so you work in `C:\FMWLabs\start-kit`. Every lab command runs from there, as it does from `examples/start-kit` in a clone of the repository. The kit is Windows PowerShell 5.1, and its tests also run in PowerShell 7; it has no Python steps. [Get a path's code](../index.md#get-the-code) says why each step is there.

In Windows PowerShell 5.1:

```powershell
Expand-Archive -Path $HOME\Downloads\start-kit.zip -DestinationPath C:\FMWLabs\start-kit -Force
Set-Location C:\FMWLabs\start-kit
Get-ChildItem C:\FMWLabs\start-kit -Recurse -File | Unblock-File
```

Check it works, with Module 1, Lab 1, Step 1:

```powershell
Import-Module .\powershell\FMPADAssessment -Force
(Get-Module FMPADAssessment).Version.ToString()
```

It prints `1.8.0`. Each Lab 1 writes its output to a dated run folder under `C:\FMWLabs\results`. Lab 2 writes under `$HOME\fmp-labs\pki` in Modules 1 and 2, and to a dated run folder under `C:\FMWLabs\results` in Modules 3 and 4. All of them are outside the kit's folder, so the kit's own tests still pass after you run them.
esults`. Lab 2 writes under `$HOMEmp-labs\pki` in Modules 1 and 2, and to a dated run folder under `C:\FMWLabs
esults` in Modules 3 and 4. All of them are outside the kit's folder, so the kit's own tests still pass after you run them.

## What you'll be able to do

When you finish the path, you'll be able to:

- explain why the certificate estate fails on its own clock, and name the Public Key Services objects AD CS keeps in the forest;
- inventory every CA and template, published or not, and read a CA's record: its issuer, expiry, key size and published templates;
- give each template a starting MIGRATE, BRIDGE, RETAIN or RETIRE class from Appendix B, and list the custom templates whose owners must classify them;
- find the ESC1, ESC2, ESC4 and ESC6 misconfigurations the kit checks, and say which classes it doesn't;
- read each CA's audit filter, and explain why CA auditing comes before any other detection;
- remediate under the migration gate, then prove the fix with a second run and a finding-by-finding comparison;
- map each template to its issuer in the target, and check that each CA's certificates carry the HTTP CRL and AIA locations Entra certificate-based authentication and a BYOCA issuing CA need;
- name the renewal owner of each certificate class, and the four permission systems a certificate role spans;
- read strong certificate mapping evidence: weak and strong `altSecurityIdentities` forms, the KDC's events 39, 40 and 41, and the CAs in the NTAuth store.

## Modules

Work through them in order.

| # | Module | Book 07 | Labs | Time |
|---|---|---|---|---|
| 1 | [What AD CS holds up: the inventory](01-what-ad-cs-holds-up.md) | Chapters 01 and 02, Appendix B | Lab 1, Lab 2 | 50 min |
| 2 | [Hardening what stays](02-hardening-what-stays.md) | Chapter 03 | Lab 1, Lab 2 | 55 min |
| 3 | [The target PKI and who owns it](03-the-target-pki-and-who-owns-it.md) | Chapters 04 and 05 | Lab 1, Lab 2 | 55 min |
| 4 | [Device and user certificates](04-device-and-user-certificates.md) | Chapter 06, Appendix A | Lab 1, Lab 2 | 60 min |

: The modules of the PKI and Certificates learning path {.striped .hover}

**Planned.** Three more modules follow: coexistence and migration (Chapter 07); lifecycle, monitoring and decommissioning, with the [CyberArk certificate lifecycle guide](../../books/guides/cyberark-certificate-lifecycle.md) (Chapter 08 and Appendix C); and PIV and derived PIV (Chapter 09).

**Total time:** about 3 hours 40 minutes with each module's Lab 1. Lab 2, in your own test forest, isn't counted.

**Labs.** Lab 1 runs the kit against a fictional Contoso PKI snapshot, `tests\fixtures\pki-contoso.json`: two issuing CAs under an offline root, fifteen templates and each CA's `certutil -getreg` output. Module 4's Lab 1 adds a strong-mapping snapshot of the same forest, `tests\fixtures\cert-mapping-contoso.json`. Nothing reads a directory or a CA, and nothing leaves your laptop. The output shown in Modules 1 and 2 is what the commands printed on November 24, 2026, and in Modules 3 and 4 what they printed on November 25, 2026, in Windows PowerShell 5.1. Lab 2 runs the same commands in a test forest; the authors haven't run it, and each Lab 2 says how to back out what it did. [The Labs page](../labs.md#pki) lists every lab in the path.

::: {#pki-modules}
:::
