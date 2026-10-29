# Research: Implementing Book 08 on Infoblox NIOS — implementation guide

A 52-minute implementation guide for building Book 08's DNS, DHCP and IPAM design on Infoblox NIOS 9.1. It's built with the shared deck kit in [`../_build/`](../_build/README.md). It's a **Research — under review** item for the workbook's Research section, not part of the vendor-neutral workbook books. The title slide labels it "Implementation guide · Research — under review", and the closing notes say it's the program's research, not an endorsement by any federal agency. No specific federal agency is named. This folder sits outside `docs/`, so the site doesn't render it.

It's the step-by-step companion to the product deep dive in [`../research-infoblox-ddi/`](../research-infoblox-ddi/README.md). It keeps Book 08's default that the Active Directory locator zones stay on AD DNS until the last domain controller goes, and shows NIOS hosting the AD zone only as the alternative.

The deck has a 6-minute orientation and four parts. Each part opens with a divider slide, so the parts can be watched separately:

| Part | Content | Minutes |
|---|---|---|
| Orientation | Title; Book 08's design mapped onto a Grid; Phase 0, the decisions that can't be undone cheaply (FIPS mode, LTS train, DNSSEC defaults, HSM) | 6 |
| 1 — Build the Grid | Grid Master HA pair and switch ports; the candidate, joining members and Grid ports; time and licenses; vNIOS on VMware, Azure and AWS | 9 |
| 2 — Migrate from Microsoft | Managing Windows servers, then taking over; zone import and bulk import; AD zones and Kerberos-signed updates (AES keytabs); DHCP takeover; DHCP failover and DHCPv6; rollback | 14 |
| 3 — Sign and harden | DNSSEC parameters; HSM and DS publication; the agency's NIOS settings baseline (NIST SP 800-81r3, Infoblox documentation; the DISA NIOS 9.x STIG as an optional, High only cross-check); FIPS mode; administrator access and the 9.1.0 upgrade gates | 12 |
| 4 — Operate and evidence | Upgrades and LTS; patching and CISA KEV; backup, restore and Grid Master recovery; logging; Terraform and Ansible; the build mapped to Book 08's six phases; decisions, vendor asks and next steps | 15 |

| File | Use |
|---|---|
| `Research_Infoblox_Impl.pptx` | The deck: 29 narrated slides (4 of them dividers), then a backup section: assessor evidence checklist, risks register, what couldn't be verified, and the full source lists |
| `Research_Infoblox_Impl_Narrated.pptx` | Self-running edition with narration and built-in captions |
| `Research_Infoblox_Impl_Narrated.vtt` | Caption track |
| `Research_Infoblox_Impl_Narration_Script.md` | The spoken script |
| `build.js` | Slide content and speaker notes; it stops if a slide title is over 58 characters or duplicated |

## Build

```bash
source /c/tmp/deckenv.sh
node build.js Research_Infoblox_Impl.pptx
python "$VALIDATE" Research_Infoblox_Impl.pptx
python ../_build/a11y_check.py Research_Infoblox_Impl.pptx
```

Then `narrate.py`, `captions.py` and `build_narrated.ps1` from `../_build/`.

## Sourcing rules

- Every new fact comes from the research brief *Implementing Book 08's DDI design on Infoblox NIOS*, checked against primary sources on October 23, 2026: Infoblox's NIOS 9.1.x, upgrade, FIPS/CC, vNIOS and Data Connector documentation; NIST SP 800-81r3 and SP 800-53 Rev. 5 CM-6 (read October 29, 2026); the DISA Infoblox NIOS 9.x STIG V1R1 (downloaded October 22, 2026), kept as an optional High only reference; Microsoft Learn; the CISA KEV catalog; and the Infoblox Terraform and Ansible repositories. Earlier facts come from the verified briefs behind the other Infoblox research items. Book 08 supplies the design, phases, gates and evidence model.
- *High only* marks material that applies to FedRAMP High or Defense environments, such as DISA STIGs and DoD Impact Levels, not to the Moderate civilian baseline this workbook targets. It's kept as an optional reference.
- Program sequencing is labeled design guidance on the slides and in the notes; inferences are labeled as inferences.
- Findings that change the plan are stated plainly: FIPS mode needs a factory reset and severs cloud and portal connections, and the FIPS 140-3 and Common Criteria certifications are still pending; there's no CIS Benchmark for NIOS, so the agency writes its CM-6 settings from NIST SP 800-81r3 and Infoblox's documentation, with the DNS-only DISA STIG as an optional High only cross-check; the NIOS DNSSEC defaults (RSA/SHA1, 1024-bit ZSK) fall outside SP 800-81r3's algorithm table; the vendor's keytab example uses RC4, which Microsoft's July 2026 enforcement breaks; vNIOS can't manage Microsoft servers; removing a managed Microsoft DHCP server deletes its synced data; cloud HA documentation omits the government regions; and NIOS 9.1.0 is WAPI v2.14.
- Items that couldn't be verified (the approved federal LTS build, Windows Server 2025 DC support for GSS-TSIG, vNIOS HA in the government clouds, address continuity in a DHCP takeover, a SHA-2 NTP key type) are listed as vendor asks, not stated as facts.
