# Research: Who Names the Device After AD? — explainer

A 17-minute plain-language explainer on two questions that Active Directory used to answer quietly: once AD retires, who gives each device its name, and who puts that name into DNS? It's for a federal architect who is still learning DNS and device management, so every term is defined the first time it's used. It is built with the shared deck kit in [`../_build/`](../_build/README.md).

It belongs to the workbook's **Research — under review** section, next to the [Trinzic Alone, or Trinzic Plus Cloud DDI?](../../docs/research/trinzic-multicloud-ddi.md) explainer and the [Infoblox DDI for Federal Agencies](../../docs/research/infoblox-ddi-federal.md) deep dive. It is not part of the vendor-neutral workbook books. The title slide says "Research — under review". Recommendations are labeled program design guidance, not vendor or standards requirements. The closing notes say this is research under review, not an endorsement by any federal agency. No specific federal agency is named. This folder sits outside `docs/`, so the site doesn't render it.

| # | Slide | Minutes |
|---|---|---|
| 1 | Title and session map | 1.2 |
| 2 | Two jobs Active Directory did at once (diagram) | 1.5 |
| 3 | Who names the device now | 1.4 |
| 4 | Why devices can't register themselves securely (diagram) | 1.5 |
| 5 | DHCP registers the record on the device's behalf (diagram) | 1.4 |
| 6 | The migration trap: who owns the existing names | 1.4 |
| 7 | IPv6: addresses that nobody registers (diagram) | 1.3 |
| 8 | Servers and the cloud register differently | 1.4 |
| 9 | Remote and VPN clients: resolved, not registered (diagram) | 1.4 |
| 10 | Why device names still matter after AD | 1.3 |
| 11 | Platform by platform: who names, who registers | 1.2 |
| 12 | What the agency must do: before, cutover, after (program design guidance) | 1.4 |
| 13 | Decisions, next steps and where this fits | 1.3 |
| | Backup (not narrated): full per-platform table (two slides), what couldn't be verified, three source lists | — |

Narrated total: about 2,490 words, roughly 17.5 minutes at 142 words per minute.

| File | Use |
|---|---|
| `Research_Device_Naming.pptx` | The deck: 13 narrated slides, then a backup section with the full per-platform table, what couldn't be verified, and the full source lists |
| `build.js` | Slide content and speaker notes. It stops if a slide title is over 58 characters or duplicated |

Narration isn't built yet. When it is, `../_build/narrate.py`, `captions.py` and `build_narrated.ps1` add the `_Narrated.pptx`, the narration script, the per-slide audio folder and the `.vtt` caption track, as in the Trinzic research deck.

## Build

```bash
source /c/tmp/deckenv.sh
node build.js Research_Device_Naming.pptx
python "$VALIDATE" Research_Device_Naming.pptx
python ../_build/a11y_check.py Research_Device_Naming.pptx
```

## Sourcing rules

- Every fact comes from a research brief checked against primary sources on October 22, 2026: Microsoft Learn, Apple, systemd, cloud-init, NetworkManager, FreeIPA, AWS, Infoblox NIOS 9.1 documentation and IETF RFCs. Book 05 (Chapter 04) and Book 08 (Chapters 04, 07 and 10) supply the workbook context. Each slide's notes end with a short "Sources:" line, and the backup slides list every source by ID.
- Caveats are kept as the brief states them:
  - Autopilot device preparation's name template (up to 63 characters) works only for devices with device association, not for devices onboarded with corporate identifiers only.
  - Intune Rename doesn't support hybrid-joined devices, and no enrollment-time name template was found for macOS.
  - That an Entra-joined Windows client can't sign its own update, that macOS is registered by DHCP, that no AAAA record exists for SLAAC or privacy addresses, and that remote clients on Global Secure Access are resolvers rather than registrants are all labeled inferences.
  - Azure autoregistration covers VMs only, the primary NIC only, A records only (no PTR), and one zone per virtual network. No built-in AWS registration into custom Route 53 zones was found in AWS docs.
  - The Android and Windows equivalents of the Mac Wi-Fi randomization key weren't verified.
- Infoblox behavior is described from its vendor documentation. Recommendations, including the whole checklist on slide 12, are labeled program design guidance. Items that couldn't be verified are listed on a backup slide instead of being stated as fact.
- Global Secure Access is always written out in full, so the abbreviation can't be mistaken for a federal agency.
