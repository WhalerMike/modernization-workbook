# Research: Certificate Lifecycle on CyberArk Certificate Manager — implementation guide

A 35-minute implementation guide for building Book 07's certificate lifecycle on CyberArk Certificate Manager, Self-Hosted (version 26.1, on the Trust Protection Foundation). It's built with the shared deck kit in [`../_build/`](../_build/README.md). It's a **Research — under review** item for the workbook's Research section, not part of the vendor-neutral workbook books. The title slide labels it "Implementation guide · Research — under review", and the closing notes say it's the program's research, not an endorsement by any federal agency. No specific federal agency is named. This folder sits outside `docs/`, so the site doesn't render it.

CyberArk is the program's chosen CLM vendor (the agency's existing machine-identity vendor, per Book 07 Ch 04), so the deck recommends it plainly and states its risks openly. Self-hosted is the deployment because the FedRAMP Marketplace lists no certificate-management package for the SaaS edition.

The deck has a 4-minute orientation and four parts that follow Book 07's phases and waves. Each part opens with a divider slide, so the parts can be watched separately:

| Part | Content | Minutes |
|---|---|---|
| Orientation | Title; what the guide implements (Book 07's issuer map, with the CLM as the system of record for what Intune and the PIV system don't manage); prerequisites and decisions | 4 |
| 1 — Build the platform | Architecture and high availability; FIPS posture (what you can and can't claim); console sign-in through Entra SSO with CBA; hardening and service accounts; backup and disaster recovery | 8 |
| 2 — Connect the issuers | AD CS driver; scoping its account under ESC7; public and cloud CA drivers in 26.1; Intune coexistence | 7 |
| 3 — Discover, own and automate | Discovery and CA import; ownership through policy folders, owners and the CMDB; enrollment automation (ACME, EST, SCEP, REST, agents); Kubernetes, ServiceNow and SIEM | 7 |
| 4 — Migrate and operate | Build sequence mapped to Book 07's six waves; renewal as public TLS lifetimes shrink; monitoring and drift; decommissioning; decisions, vendor asks and next steps | 9 |

| File | Use |
|---|---|
| `Research_CyberArk_CLM.pptx` | The deck: 25 narrated slides (4 of them dividers), then a backup section: assessor evidence checklist, risks register, what couldn't be verified, and the full source lists |
| `build.js` | Slide content and speaker notes; it stops if a slide title is over 58 characters or duplicated |

The narrated version, narration script, per-slide audio and captions aren't built yet. The editor runs `narrate.py`, `captions.py` and `build_narrated.ps1` from `../_build/`.

## Build

```bash
source /c/tmp/deckenv.sh
node build.js Research_CyberArk_CLM.pptx
python "$VALIDATE" Research_CyberArk_CLM.pptx
python ../_build/a11y_check.py Research_CyberArk_CLM.pptx
```

## Sourcing rules

- Every fact comes from the research brief *Implementing Book 07's certificate lifecycle on CyberArk Certificate Manager, Self-Hosted*, checked against primary sources on October 22, 2026: CyberArk's 26.1 documentation, Microsoft Learn, the FedRAMP Marketplace, NIST CMVP, the Common Criteria lists and the ServiceNow Store. Book 07 supplies the issuer map, ownership model, waves, drift patterns and decommissioning steps. The device-naming brief supplies the Intune SCEP SAN variables.
- Program recommendations are labeled design guidance on the slides and in the notes; inferences are labeled as inferences.
- Three places where the research corrects Book 07 are stated as corrections, and Book 07 is being updated:
  - **ACME and FIPS (Ch 08).** The 26.1 Installation Guide says no server used for ACMEv2 can have FIPS enabled, not just win-acme. ACME runs on separate non-FIPS servers.
  - **Cloud PKI inventory (Ch 04).** CyberArk documents no Cloud PKI import. The only path is a custom job from Microsoft Graph's beta Cloud PKI leaf report into the WebSDK Discovery/Import API; Intune's report stays the system of record.
  - **ESC7 scoping (Ch 03 and Ch 05).** Microsoft publishes no Windows Server 2025 procedure for certificate-manager restrictions, so scoping the CLM's CA account rests on template permissions plus lab-tested allowed and denied requests.
- Risks are stated plainly: no CMVP certificate names the product (CyberArk's #5205 and #5122 aren't claimed for it); no current Common Criteria certificate; Kubernetes discovery depends on the SaaS (cert-manager is the in-boundary path); the Entrust public CA driver was removed in 26.1; DigiCert client certificates now need an email SAN; Windows Server 2025 AD CS support needs written confirmation; the platform concentrates privilege; the only ServiceNow app is third-party; Key Vault on Azure Government and PIV console login aren't documented.
