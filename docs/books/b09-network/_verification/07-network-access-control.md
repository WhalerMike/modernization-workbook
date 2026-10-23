# Verification — Chapter 07, Network Access Control: 802.1X and RADIUS

Writer: W5. Verified 2026-10-21. Sources: `docs/operational-guides/network-transformation/radius-802-1x-modernization.md` (G.6 stub), `docs/projects/network-access-charter.md` and `network-access-plan.md` (customer-edge items), and the Federal Compliance Vol I Book 02 (`docs/compliance/Vol_I_Book_02_Network_Access_Control_802_1X.md`, read for facts and linked by GitHub URL; it stays in place).

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | IEEE 802.1X-2020 is the current port-based NAC standard; supersedes 802.1X-2010 | How port-based admission works | verified | IEEE standards page (c07-ieee8021x); a 2026 corrigendum is also listed |
| 2 | Supplicant / authenticator / authentication server roles | Same | verified | IEEE 802.1X scope; RFC 3579 |
| 3 | RADIUS packets carrying EAP-Message MUST carry Message-Authenticator | Same; Securing RADIUS | verified | RFC 3579 §3.3 (c07-rfc3579) |
| 4 | RADIUS UDP 1812; MD5 response authenticator with shared secret | Same | verified | RFC 2865 (c07-rfc2865) |
| 5 | DHCP option 60 = vendor class identifier; option 43 vendor-specific | Voice VLAN precedent | verified | RFC 2132 (c07-rfc2132) |
| 6 | Voice VLAN steering predates broad supplicant deployment ("before 802.1X-2001 was ratified") | Voice VLAN precedent | restated-as-design | Historical framing kept as narrative; the specific ratification-date comparison removed |
| 7 | EAP-TLS mutual authentication; RFC 9190 updates RFC 5216 for TLS 1.3 | Choosing the EAP method | verified | RFC 9190 (c07-rfc9190) |
| 8 | EAP-TLS is the only EAP method allowed for WPA3-Enterprise 192-bit mode | Choosing; Wired and wireless | verified | MS Learn EAP for network access (c07-eap-windows) |
| 9 | "NIST SP 800-120 and SP 800-153 both recommend EAP-TLS as strongest" | Choosing | corrected | SP 800-120 withdrawn Oct 19, 2018 (c07-sp800120); SP 800-153 is final but the "recommends EAP-TLS as strongest" wording not confirmed (c07-sp800153) |
| 10 | "Mutual-certificate FIPS-approved EAP method is not optional under FedRAMP Moderate" | Choosing | restated-as-design | No FedRAMP/NIST text found; stated as program position |
| 11 | EAP table "FIPS Approved" column (MSCHAPv2 No, EAP-TLS Yes) | Choosing | removed | Column dropped; replaced with program position column |
| 12 | Credential Guard default-on (Win 11 22H2, WS2025) blocks MS-CHAPv2 SSO; move to EAP-TLS/PEAP-TLS | Choosing | verified | MS Learn Credential Guard known issues (c07-credguard) — new fact |
| 13 | Oct 2026 update restricts NTLMv1-derived SSO on devices without Credential Guard; MS-CHAPv2 Wi-Fi/Ethernet/VPN may break | Choosing | verified | Windows message center, Oct 14, 2026 (c07-ntlmv1-2026) — new fact |
| 14 | Older NPS best-practice page recommends PEAP-MSCHAPv2 for wireless | Choosing | verified | MS Learn NPS best practices (c07-nps-best) |
| 15 | NPS accepts client certs issued by enterprise CA or mapped to AD account; computer cert SAN = DNS name | RADIUS server is the AD dependency | verified | MS Learn NPS cert requirements (c07-nps-certreq) |
| 16 | Entra-joined devices don't support RADIUS relying on on-prem computer object and cert; alternatives Intune certs or user credentials | Same | verified | MS Learn Entra join plan (c07-aadj-plan) |
| 17 | NPS can't authorize cloud-native devices except via dummy AD objects; "unsustainable at fleet scale" | Same | restated-as-design | Program position built on #15–16 |
| 18 | Entra ID has no RADIUS; NPS extension does MFA only after AD primary auth; Microsoft recommends SAML-federated VPN | Same | verified | MS Learn RADIUS auth with Entra ID (c07-radius-entra) |
| 19 | "entra-radius — Cloud-native RADIUS proxy" registered implementation | Same | corrected | No such Microsoft product; removed (consistent with Book 02 Ch04) |
| 20 | NAP deprecated in WS2012 R2, unavailable from WS2016 → NPS has no posture engine | Same | verified | MS Learn NPS overview (c07-nps-overview) |
| 21 | "NPS Extension for Intune NAC" reads Intune compliance into Access-Accept | Same; Posture | corrected | No such component; NPS is not on Intune's NAC partner list (c07-intune-nac) |
| 22 | NPS role not available on Server Core | Same | verified | MS Learn NPS overview (c07-nps-overview) — new fact |
| 23 | NPS config sync by export/import XML; exported file has shared secrets in clear text | Same | verified | MS Learn NPS export; Export-NpsConfiguration (c07-nps-export) — the clear-text warning is new |
| 24 | NPS HA: two servers, primary/secondary, 3-s failover, P2 alert if no accounting > 5 min | Same | restated-as-design | Program design; "3-second failover timeout" dropped as vendor-specific |
| 25 | Cisco ISE 3.1+, ClearPass with Intune extension v6+, Forescout eyeExtend, FortiNAC, Portnox Cloud integrate with Intune compliance retrieval | What can replace it | verified | MS Learn NAC integration partner list (c07-intune-nac) |
| 26 | Cloud RADIUS FedRAMP status: no Portnox/SecureW2/HPE Aruba listing; IronWiFi Initial Implementation (2026-08-13); Juniper Mist Certified Class C (2025-03-28), description doesn't name NAC; Meraki US Gov Class C (2025-02-18); Forescout for Government Class D (2026-03-20) | What can replace it | verified | FedRAMP Marketplace products.json, last_change 2026-10-21 (c07-fedramp) |
| 27 | Microsoft Cloud PKI or AD CS via Intune connector can issue device certs | Certificates | verified (by reference) | Book 07 Ch06 owns and footnotes it; linked, not re-footnoted |
| 28 | Intune posture via compliance retrieval service; legacy NAC service supported to Mar 31, 2024 | Posture | verified | c07-intune-nac |
| 29 | NAC partner registers with Entra ID, delegated permissions to Intune NAC API; discovery URL; cert auth | Posture | verified | c07-intune-nac |
| 30 | SAN = `{{DeviceId}}@tenant` as UPN; NPS validates against Entra via Graph | Posture | corrected | Compliance retrieval requires Intune device ID as URI SAN, e.g. `IntuneDeviceId://{{DeviceID}}`; MAC fallback (c07-intune-nac) |
| 31 | Data returned: compliance state, managed, MAC, Intune device ID (CR/NAC 2.0) | Posture | verified | c07-intune-nac |
| 32 | Intune maintenance check-in ~8 h; one maintenance sync per 6.5 h | Posture | verified | MS Learn policy refresh intervals (c07-intune-refresh) |
| 33 | Windows client-driven compliance evaluation with real-time triggers (firewall, AV, BitLocker, Defender, OS build, RTP, Secure Boot) | Posture | verified | MS Learn Windows compliance settings (c07-intune-wincomp) — new fact |
| 34 | Broad "all noncompliant" queries at most every 4 h, else HTTP 503 | Posture; CoA | verified | c07-intune-nac — contradicts the source's 15-minute poller |
| 35 | NAC compliance policy minimums (patch 30 d, BitLocker, Defender 7 d, Secure Boot, TPM, firewall) | Posture | restated-as-design | Program policy |
| 36 | CoA RFC 5176, UDP 3799, Informational | CoA | verified | RFC 5176 (c07-rfc5176) |
| 37 | Cisco Catalyst 1300 CoA default UDP 1700; ISE only supported DAC | CoA | verified | Cisco doc (c07-cisco-coa) — new; source assumed 3799 everywhere |
| 38 | "NPS has no RFC 5176 support"; ISE/ClearPass issue CoA natively | CoA | restated-as-design | No Microsoft statement found either way; stated as "NPS documentation describes no dynamic authorization client; program treats NPS as unable to initiate CoA" |
| 39 | Azure Function CoA engineering realities (mgmt path, dynamic-author trust, accounting becomes enforcement infra) | CoA | restated-as-design | Program engineering analysis |
| 40 | "Within 20 minutes" timing qualified; 8-h re-auth backstop | CoA; Session timers | restated-as-design | Program design; aligned with #32–34 |
| 41 | VLAN tier numbers and ACLs | Policy tiers | restated-as-design | Program examples |
| 42 | Remediation ACL host list (`*.manage.microsoft.com`, `*.update.microsoft.com`, `*.wdcp.microsoft.com`…) | Policy tiers | removed | Endpoints differ by cloud (commercial/GCC/GCC High); replaced with instruction to build from Microsoft's published lists |
| 43 | MAB is spoofable; classification not authentication | MAB | verified (general) / restated-as-design | Consistent with IA-3 discussion naming MAC as shared known information (c07-sp80053) |
| 44 | Session-Timeout 28800, Termination-Action RADIUS-Request, Idle-Timeout 1800 | Session timers | restated-as-design | Program values (RADIUS attribute names standard) |
| 45 | Intune Wi-Fi / wired profiles: EAP-TLS, server names, root cert for server validation, SCEP/PKCS cert | Certificates and supplicant profiles | verified | c07-intune-wifi, c07-intune-wired |
| 46 | Deploy network, cert and trusted-root profiles to same groups | Same | verified | c07-intune-wired-howto |
| 47 | Wired profile 802.1X "Enforce" can cut device off; must remove policy manually | Same | verified | c07-intune-wired — new operational gotcha |
| 48 | Multi-auth host mode for phone + PC on one port | Wired and wireless | restated-as-design | Vendor feature; config labeled illustrative |
| 49 | IOS-XE port configuration commands | Wired and wireless | unverifiable | Kept as illustrative vendor example behind a warning; not checked against Cisco command references; the WLC/Catalyst Center SSID snippet was dropped |
| 50 | "WPA3-Enterprise (SAE + EAP-TLS)" | Wired and wireless | corrected | SAE is WPA3-Personal; WPA3-Enterprise = 802.1X + mandatory server cert validation + PMF (c07-wpa3-enum) |
| 51 | WPA3-Enterprise "eliminates KRACK-class attacks" | Wired and wireless | removed | Not verifiable as stated |
| 52 | Windows 11 WPA3-Enterprise with enhanced server cert validation and TLS 1.3 EAP-TLS; Wi-Fi 7 enterprise requires WPA3-Enterprise | Wired and wireless | verified | MS Learn Windows security book (c07-win-netsec) — new |
| 53 | Blast-RADIUS CVE-2024-3596: MITM forges Access-Accept; non-EAP (PAP) affected; EAP largely protected; mitigations | Securing RADIUS | verified | blastradius.fail (c07-blastradius) — new |
| 54 | KB5040268 NPS Message-Authenticator / limitProxyState / requireMsgAuth settings, off by default, recommended on | Securing RADIUS | verified | Microsoft Support KB5040268 (c07-kb5040268) — new |
| 55 | NPS requires Message-Authenticator for EAP by default | Securing RADIUS | verified | MS Learn RADIUS clients (c07-nps-clients) |
| 56 | Shared secrets 32+ chars, Key Vault, 180-day rotation | Securing RADIUS | restated-as-design | Program rule; "Azure Key Vault" generalized to "managed secret store" |
| 57 | RadSec RFC 6614 replaces shared-secret model | Securing RADIUS | corrected | RFC 6614 is Experimental (2012); standards-track RADIUS/(D)TLS bis in IESG evaluation (Sept 2026); RFC 9765 RADIUS/1.1 Experimental (Apr 2025) (c07-radext) |
| 58 | BOD 26-02 scope includes switches and WAPs on the network boundary; 12- and 18-month milestones from Feb 5, 2026 | Securing RADIUS (Refresh) | verified | cisa.gov BOD 26-02 (c07-bod2602) — boundary-only scope nuance is new |
| 59 | DHCP fingerprinting / anomaly detection; IPAM record contents; DHCP snooping + IP source guard closing static bypass | Inventory, profiling and logs | restated-as-design | Program design; InfoBlox named only in source, generalized |
| 60 | RADIUS accounting attribute names (Calling-Station-Id, NAS-IP-Address, NAS-Port, Tunnel-Private-Group-ID) | Same | verified (standard attributes) | RFC 2865 family (c07-rfc2865); no separate footnote |
| 61 | KQL detection queries | Same | removed | Described in prose; queries left in the Federal Compliance book. Table names in the source (`EntraDevices`, `NpsRadius_CL`, `Event` with Source NPS) depend on ingestion and couldn't be verified as standard |
| 62 | Phased rollout 90–180 days, four phases | Rolling it out | restated-as-design | Program plan |
| 63 | 90-day accounting retention per AU-11 | Rolling it out | restated-as-design | Agency-defined retention; reworded "per the agency's AU-11 retention" |
| 64 | IA-3 text and discussion naming 802.1X/EAP and RADIUS EAP-TLS | Controls | verified | SP 800-53 Rev 5, OSCAL release 5.2.0 (c07-sp80053) |
| 65 | SC-7(3) Access Points closed by switch-port enforcement | Controls | corrected | SC-7(3) = limit number of external network connections (TIC example); row replaced by AC-18(1) (c07-sp80053) |
| 66 | AC-18(1) authentication and encryption for wireless | Controls | verified | c07-sp80053 |
| 67 | AC-17 row ("posture consistent across in-office and remote") | Controls | removed | Folded into "From port to token"; IA-3 for remote devices met at the broker |
| 68 | FedRAMP 20x KSI alignment (KSI-SVC, KSI-MLA, KSI-IAM; KSI-001..010; "29 rules") | — | removed | Series-internal decomposition, not a FedRAMP fact; out of scope for the workbook chapter |
| 69 | Cloud PKI licensing (Intune Suite add-on) | — | removed | Book 07 owns licensing; linked instead |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| G.6 stub — Scaffold callout (DM_030 pending guide) | — | Not carried: page status note; this chapter is the guide |
| G.6 — Why this matters | Opening section (NPS as AD dependency, total-access-failure) | — |
| G.6 — Registered implementations (nps, cisco-ise, aruba-clearpass, entra-radius) | "What can replace it" table | `entra-radius` corrected (claim #19) |
| G.6 — Related controls (AC-18, IA-3, IA-5(2), SC-7(5)) | "The controls this closes" | IA-5(2) belongs to certificates; left to Book 07 |
| G.6 — What goes here: 1 landscape decomposition | Rolling it out (Phase 1 baseline) and the Book 02 Ch04 migration sequence link | — |
| G.6 — 2 target architecture (ISE vs cloud vs retire to CA/ZTNA) | "What can replace it"; Figure ch07-radius-target | — |
| G.6 — 3 migration sequence (parallel run, 30-day NPS decommission) | Rolling it out (via Book 02 Ch04) | — |
| G.6 — 4 validation evidence (RADIUS trust for SCEP certs, auth success by EAP method, AAA attestation) | Rolling it out (Phase 1 baseline, assessor evidence list); Certificates | — |
| G.6 — 5 rollback (restore NPS without reintroducing AD dependency) | Partly: "The RADIUS server is the AD dependency" (D3 trigger) | Rollback runbook not written in the source; Chapter 09 assigns revert owners |
| G.6 — See also | Links to Book 02 Ch04 | DM_030 canon spec is internal; not linked |
| Compliance Vol I Book 02 — Series context and "What this document addresses" | Opening section | Cross-volume series references dropped (agency/series-specific) |
| — Device identity vs user identity note | Opening section | — |
| — The device identity gap: Scenarios A and B | Opening section | — |
| — Federal physical access reality (five bullets) | Opening paragraph | — |
| — Before and after comparison | Figure ch07-admission-decision; Policy tiers | — |
| — The voice VLAN precedent | "The voice VLAN precedent: assertion before proof" | — |
| — Authentication stack | "How port-based admission works" | — |
| — EAP method selection and table | "Choosing the EAP method" | Corrections #9–11; Credential Guard and NTLMv1 facts added |
| — RADIUS server design (D3, NPS vs ISE vs ClearPass) | "The RADIUS server is the AD dependency"; "What can replace it" | — |
| — NPS high availability | Same section (hybrid-phase configuration) | — |
| — RADIUS shared secrets and RadSec | "Securing RADIUS itself" | Corrected #57; Blast-RADIUS added |
| — 802.1X port configuration (IOS-XE) | "Wired and wireless" (restored code block, warning) | — |
| — Certificate trust chain; Intune SCEP enrollment flow; SCEP profile JSON | "Certificates and supplicant profiles" (summary) and Book 07 Ch06 link | JSON profile not carried: wrong SAN format (#30) and Book 07 owns profile detail |
| — Certificate revocation (CRL 24 h, OCSP < 500 ms) | Certificates (revoke at wipe; CRL over HTTP) | CRL/OCSP timings left to Book 07 |
| — NAC policy tier structure and table | "The policy tiers" | — |
| — Production VLAN; compliance policy minimums | Policy tiers; Posture | NPS-extension mechanism corrected (#21) |
| — Remediation VLAN ACL | Policy tiers | Host list removed (#42) |
| — Quarantine VLAN and captive portal | Policy tiers | — |
| — MAB (guest and IoT) and warning | "MAC Authentication Bypass" with warning callout | — |
| — Posture: Intune compliance as the signal | "Posture comes from Intune, not from a probe" | — |
| — RADIUS CoA and the Azure Function engine | "Change of Authorization" | Throttling correction (#34), port variance (#37) |
| — Wired 802.1X, multi-auth | "Wired and wireless" | — |
| — Wireless WPA3-Enterprise; WLC snippet | "Wired and wireless" | WLC snippet dropped; SAE/KRACK corrected (#50–51) |
| — Session timeout and re-authentication table | "Session timers" | — |
| — InfoBlox integration: DHCP fingerprinting, IPAM-driven VLAN assignment, CM-8 artifact | "Inventory, profiling and logs" | InfoBlox generalized (vendor neutrality); Book 08 owns DDI |
| — Cross-book note: DNS hostname + cert binding at admission | Inventory section (IPAM record) | "Validate with OIS" note dropped (agency-specific) |
| — RADIUS accounting to Sentinel | "Inventory, profiling and logs" | Sentinel generalized to "agency SIEM" |
| — Sentinel analytics rules (3 KQL queries) | Same, as three described detections | Queries not reproduced (#61) |
| — Phased implementation, Phases 1–4 | "Rolling it out" | — |
| — NIST 800-53 control closure table | "The controls this closes" | SC-7(3) corrected (#65); AC-17 folded (#67) |
| — Closure Necessity: IA-3 at the point of admission | Controls section prose | — |
| — Closure Necessity: CM-8 and the enumeration problem | Inventory section (static-address bypass) | — |
| — FedRAMP 20x KSI alignment note; OSCAL evidence list | Evidence list kept in "Rolling it out" | KSI mapping removed (#68) |
| — From port to token: NAC → ZTNA continuum | "From port to token" | Series volume references replaced by Book 09/04 chapters |
| — Closing series paragraph | — | Not carried: series-internal |
| Network access charter — §4 in-scope "customer-edge enforcement (802.1X, boundary controls)"; §6 success criterion "customer-edge enforcement approach documented with accreditation path" | Opening (customer-edge half), Rolling it out | Charter otherwise carried in Chapter 09 |
| Network access plan — Phase 4 customer-edge enforcement | Rolling it out; Chapter 09 plan table | — |

## Additions, October 23, 2026 (certificates and the CLM platform)

At the user's request, every certificate-dependent book maps its certificates to Book 07 and the CLM platform. Source: the certificate-touchpoints research brief (program working file), Book 07 Ch04/Ch05/Ch07/Ch08 and CyberArk 26.1 documentation (accessed Oct 23, 2026).

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Certificates section: class, issuer and renewal engine per certificate | Certificates in this book and the CLM platform | restated-as-design (Book 07's classes applied); items marked inference are labeled | Book 07 Ch04, Ch05 |
| 2 | CyberArk mechanism (capi) | Same section | verified (noted) | CyberArk 26.1 docs, note clm-capi |
| 3 | CyberArk mechanism (est) | Same section | verified (noted) | CyberArk 26.1 docs, note clm-est |
| 4 | CyberArk mechanism (drivers) | Same section | verified (noted) | CyberArk 26.1 docs, note clm-drivers |
| 5 | CyberArk mechanism (pan) | Same section | verified (noted) | CyberArk 26.1 docs, note clm-pan |
| 6 | RADIUS server certificate issuer stated, renewal owner not | Certificates and supplicant profiles | added: renewed through CyberArk Certificate Manager, network team owns it | Book 07 Ch05 |
