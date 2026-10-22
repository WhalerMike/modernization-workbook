# Research: Infoblox DDI for Federal Agencies — technical deep dive

An hour-long technical presentation on Infoblox DNS, DHCP and IPAM (NIOS Grid and Universal DDI) for federal agencies, built with the shared deck kit in [`../_build/`](../_build/README.md). It is a **Research — under review** item on the workbook site ([docs/research/infoblox-ddi-federal.md](../../docs/research/infoblox-ddi-federal.md)), not part of the vendor-neutral workbook books. The title slide labels it "Research — program analysis, under review", and the closing notes say it is the program's research analysis, not an endorsement by any federal agency. No specific federal agency is named. This folder sits outside `docs/`, so the site doesn't render it.

The deck has a 5-minute orientation, then two parts (about 28 and 22 minutes), in four modules; about 56 minutes of narration in all. Each module opens with a divider slide, so the modules can be watched separately:

| Part | Module | Minutes |
|---|---|---|
| Orientation | Title; DNS, DHCP and IPAM as one control plane; what federal rules require (and that none names a vendor) | 5 |
| 1 — The platform and the case for it | 1. The platform: Grid, Universal DDI and its limits, DNS, DHCP and IPAM, Threat Defense, automation and logging | 12 |
| | 2. Why Infoblox, and why federal networks need what it does: requirement-to-feature map, FedRAMP scope, Trinzic hardware against the workbook's design, Trinzic alone or with cloud DDI, assurance, comparison, risks and procurement asks | 16 |
| 2 — Divisions under central governance | 3. Divisions on NIOS: permissions, scoping, views and extensible attributes, approvals (the CSV gap), sign-in, Microsoft servers, what stays central, reporting | 12 |
| | 4. Universal DDI divisions and the operating model: access views and IPAM Federation, four patterns, worked example, responsibility matrix, rollout | 10 |

| File | Use |
|---|---|
| `Infoblox_DDI_Federal_Deep_Dive.pptx` | The deck: 32 narrated slides, then a backup section with the full source lists |
| `Infoblox_DDI_Federal_Deep_Dive_Narrated.pptx` | Self-running version with the narration and captions embedded (built by `../_build/build_narrated.ps1`) |
| `Infoblox_DDI_Federal_Deep_Dive_Narration_Script.md` | The narration text, for practice |
| `narration_Infoblox_DDI_Federal_Deep_Dive/` | Per-slide audio, durations and captions |
| `Infoblox_DDI_Federal_Deep_Dive_Narrated.vtt` | One caption track for the whole narration |
| `build.js` | Slide content and speaker notes; it stops if a slide title is over 58 characters or duplicated |

## Sourcing rules

- Every fact comes from four research briefs checked against primary sources on October 22, 2026: Infoblox platform documentation, federal requirements and validations, divisional delegation, and a competitor comparison. Book 08 supplies the architecture context and the responsibility matrix.
- Infoblox marketing figures are labeled vendor claims. When NIST SP 800-81 Rev. 3 is cited, the notes disclose that two of its three authors are Infoblox employees.
- Risks are stated plainly: no active FIPS 140 certificate, no current NIAP certificate, not on the CDM Approved Products List, a Moderate-only FedRAMP listing with low reuse, the 2025–2026 NIOS CVEs (none in CISA's KEV catalog) and the BIND dependency, reporting ingest caps, token licensing, DoT/DoH on X6 hardware only, the RSA/SHA1 DNSSEC default, and Universal DDI hybrid limits.
