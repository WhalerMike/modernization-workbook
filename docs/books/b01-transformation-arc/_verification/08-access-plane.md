# Verification — Chapter 08, The Access Plane

Editor W4. Verified October 21, 2026. Sources: the series chapter as copied in (old "Chapter 08 — Access Plane: SASE, Zero Trust, MFA, Certificate-Based Auth") and the access parts of `docs/whitepapers/modernization-journey.md`.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | M-22-09: users log into applications, not networks; treat apps as internet-accessible; MFA at the application layer, not VPN | The access claim; anchors table | verified (new) | OMB M-22-09 §III.A, §III.D |
| 2 | NIST SP 800-207 tenets: communication secured regardless of location; per-session, least-privilege, dynamic-policy access | The model | verified (expanded from bare citation) | SP 800-207 §2.1 (PDF read) |
| 3 | Microsoft's three Zero Trust principles | The model | verified | Learn, "Zero Trust as a security foundation" |
| 4 | ZTMM Networks pillar Traditional stage = macro-segmentation, bulk-traffic VPN tunnels | The model | verified (new) | CISA ZTMM v2.0 Table 4 |
| 5 | Kerberos islands bridged by App Proxy / Private Access with KCD, and cloud Kerberos trust | The model | verified (new) | Learn, cloud-first identity guidance, Step 8 |
| 6 | gMSA for Kerberos islands; workload identity federation for secret-holding workloads | The model; PAM | verified (WIF scope corrected from "cloud workloads": WIF is for workloads outside Azure or on app registrations; managed identities cover Azure) | Learn gMSA overview/manage; WIF concepts |
| 7 | Whitepaper: "OMB M-22-09 requires phishing-resistant MFA government-wide" | Sessions to tokens | corrected: required for agency staff, contractors and partners; option for the public; agencies must discontinue SMS/voice/OTP/push for routine staff access | M-22-09 §III.A |
| 8 | Old chapter: phishing-resistant MFA "required for every privileged user and for all users on high-risk resources" citing M-22-09 | Phishing-resistant MFA | corrected: M-22-09 requires it for all staff, contractors and partners; privileged users first is restated as program sequencing | M-22-09 |
| 9 | Whitepaper: "BOD 25-01 mandates SCuBA baselines that require modern authentication throughout" | Sessions to tokens | corrected/specified: BOD 25-01 makes CISA's listed mandatory policies binding; mandatory Entra list includes MS.AAD.1.1v1 (block legacy auth) and MS.AAD.3.1v1 (phishing-resistant MFA for all users) | BOD 25-01 page; Required Configurations page |
| 10 | Whitepaper: "ZTMM v2.0 Identity pillar at Advanced and Optimal requires CBA as the primary mechanism" | Sessions to tokens | corrected: Advanced = begins phishing-resistant MFA, incl. passwordless via FIDO2 or PIV; Optimal = continuous validation with phishing-resistant MFA; no CBA mandate; model is a guide, not strict requirements | CISA ZTMM v2.0 §4, Table 2 |
| 11 | Whitepaper: "every NTLM event is opaque to telemetry, invisible to audit logs" | Sessions to tokens | corrected: NTLM logons are logged (Event 4624) and NTLM auditing is documented; the real gap is that Conditional Access can't evaluate NTLM | Learn NTLMv1 audit KB; deprecated-features resources |
| 12 | NTLM deprecated June 2024; NTLMv1 removed in Windows 11 24H2 / Windows Server 2025; NTLMv2 to be removed later | Sessions to tokens | verified (new) | Learn deprecated features (client, Server) |
| 13 | "Tokens only work if the identity model is right" | Sessions to tokens | restated-as-design (agency-specific "twelve regional OU trees" removed for agency neutrality) | — |
| 14 | CISA SASE definition and components (SD-WAN, routing; SWG, CASB, ZTNA, NGFW) | SASE | verified (new; replaces whitepaper's unsourced SASE description) | CISA SASE/TIC 3.0 guide v1.0, §4 (PDF read) |
| 15 | SD-WAN alone doesn't decide access by identity or posture | SASE | restated-as-design | — |
| 16 | Global Secure Access = Entra Internet Access + Private Access, Microsoft's SSE; Private Access per-app without VPN | SASE | verified | Learn, "What is Global Secure Access?" |
| 17 | GSA available in GCC, not GCC High / DoD | SASE | verified (new) | Learn, GSA known limitations |
| 18 | TIC 3.0 adopters must work with CISA on telemetry sharing | SASE contract | verified (new) | CISA SASE guide §3 |
| 19 | Whitepaper TIC 3.0 use-case version list; ZTMM Networks-pillar "Advanced = FedRAMP ConMon standard posture" mapping | (not carried) | removed: version details owned by Book 09; the ConMon mapping is not in ZTMM | CISA ZTMM v2.0 Table 4 (checked) |
| 20 | Phishing-resistant methods table (FIDO2, WHfB, Platform SSO/credential, CBA, Authenticator passkey) | MFA | verified | Learn WHfB; phishing-resistant deployment plan |
| 21 | Authenticator passkeys device-bound; synced passkeys can't be attested | MFA | verified (new caveat) | Learn passkeys (FIDO2) how-to; Authenticator methods |
| 22 | Number matching enabled for all Authenticator push; users can't opt out | MFA | verified | Learn number matching |
| 23 | CBA counts as phishing-resistant MFA only when bound as multifactor; default is single-factor | MFA; CBA | corrected (old text implied card+PIN is always phishing-resistant MFA) | Learn CBA setup Step 3; deployment plan |
| 24 | Built-in MFA strength accepts password + SMS/voice; Phishing-resistant strength = WHfB/platform credential, FIDO2, CBA multifactor | MFA | verified (new detail) | Learn authentication strengths |
| 25 | SCuBA MS.AAD.3.5v2: SMS, voice, email OTP SHALL be disabled | MFA | verified; noted not on BOD 25-01 mandatory list | ScubaGear aad.md; Required Configurations |
| 26 | Old chapter: CA library requires FIDO2 or CBA for "break-glass test accounts" | MFA | corrected to match Book 04: emergency accounts use phishing-resistant credentials but are excluded from blocking policies | Book 04 Ch04/Ch07 (internal consistency) |
| 27 | PKI-based trust store holds root and issuing CAs with CRL locations; all CAs to the root needed | CBA | verified | Learn configure CAs; CBA setup |
| 28 | One CDP per CA, HTTP(S) internet-facing; no OCSP/LDAP; no CRL URL → revoked certs still authenticate | CBA | verified (new) | Learn configure CAs; CBA CRL |
| 29 | Old chapter: binding examples "SAN principal name, RFC 822 name, issuer and serial number, high-affinity preferred" | CBA | verified and clarified: PrincipalName/RFC822/Subject/IssuerAndSubject are low affinity; SKI/SHA1PublicKey/IssuerAndSerialNumber high; Microsoft says use high-affinity exclusively for higher assurance | Learn CBA technical concepts; setup Considerations |
| 30 | Enterprise CA depends on AD DS; stand-alone CAs don't | CBA | verified | Learn Certification Authority role |
| 31 | Old chapter: issuance can move to "a managed cloud PKI service" | CBA | corrected: Cloud PKI issues only to Intune-enrolled devices via SCEP; not smart cards, DCs or servers | Learn Cloud PKI overview |
| 32 | PIM: just-in-time, time-bound, approval, MFA, justification | PAM | verified | Learn PIM overview |
| 33 | Old chapter: "every privileged account ... goes through a PAM vault"; drift types "orphan" (vaulted, missing from Entra) and "phantom" (privileged Entra account not vaulted) | PAM | corrected to match Book 04: Entra/Azure admin roles eligible in PIM; vault only for standing credentials PIM can't govern; drift types restated as program design (privilege drift, orphan drift) | Book 04 Ch04, Ch08 (internal consistency); PIM overview |
| 34 | Session recording is third-party PAM, not Entra PIM | PAM | restated-as-design (PIM overview lists no session recording) | Learn PIM overview |
| 35 | Break-glass standard (2+ cloud-only, permanent GA, phishing-resistant, excluded from blocking CA, alerted, 90-day validation) | PAM | verified via Book 04's footnoted text; not re-footnoted here (linked) | Book 04 Ch04 |
| 36 | CAE critical events: disabled/deleted, password change/reset, MFA enabled, refresh tokens revoked, high user risk | CAE | corrected/expanded (old list omitted MFA-enabled and token revocation) | Learn CAE |
| 37 | CAE latency up to 15 minutes; IP-location enforcement immediate | CAE | verified (new) | Learn CAE |
| 38 | CAE initial services Exchange, SharePoint, Teams; Graph syncs location policy | CAE | verified | Learn CAE |
| 39 | Old chapter: device-compliance change "takes effect at the next token refresh" | CAE | corrected/qualified: CAE-session tokens last up to 28 hours, so the refresh can be many hours later | Learn CAE, Token lifetime |
| 40 | CA policy and group changes can take up to a day; guests unsupported | CAE | verified (new) | Learn CAE, Limitations |
| 41 | Strict location enforcement is public preview | CAE | verified | Learn CAE |
| 42 | Strict location enforcement + GSA can block users in trusted range for non-Microsoft resources | CAE | verified (new) | Learn GSA known limitations |
| 43 | ID Protection risk detections | CAE | verified | Learn risk detections |
| 44 | Mainframe access governed by RACF through SAF; 3270 / z/OS Kerberos session-bound | Mainframe | restated-as-design (general description; validate per estate) | — |
| 45 | z/OS Connect validates third-party tokens and maps the identity to a registry user | Mainframe | verified | IBM z/OS Connect 3.0, provider authentication |
| 46 | RACF distributed identity filter (RACMAP) maps JWT subject to RACF ID | Mainframe | verified | IBM CICS TS 6.x, Configuring JWT authentication |
| 47 | Whitepaper: "CICS and IMS do not natively understand OAuth tokens" | Mainframe | corrected: a CICS Liberty JVM server can validate JWTs; restated as "the transaction engine still runs under a RACF user ID" | IBM CICS TS 6.x JWT page |
| 48 | PassTicket: one-time, for a specific RACF user ID and application, from a shared secret, within 10 minutes | Mainframe | verified (whitepaper's "user ID, application ID, timestamp" kept in substance) | IBM CICS TS 6.x PassTickets |
| 49 | Identity propagation puts the distributed identity into RACF audit records | Mainframe | verified | IBM Redbook SG24-7850 abstract |
| 50 | Whitepaper: "IBM has shipped it for a decade"; z/OS Connect OAuth since "the mid-2010s"; PassTicket "dates to the 1990s" | Mainframe | removed: dates not verified on a primary source | — |
| 51 | Whitepaper: commercial banks adopted this "under PSD2 and open-banking mandates that required OAuth-fronted core banking APIs" | Mainframe | removed: PSD2 requires access interfaces, not OAuth specifically; not verified | — |
| 52 | Token access as part of interface consolidation; sequence by transaction type; validate per estate | Mainframe | restated-as-design | — |
| 53 | Whitepaper framework-alignment rows for access (EO 14028, M-22-09 "§4", BOD 25-01, ZTMM) | Anchors table | corrected: M-22-09 has no §4 application-layer inspection requirement (networks section is DNS/HTTP encryption and isolation); rows rebuilt from verified sources | M-22-09 §III.C |
| 54 | M-22-09: at least one device-level signal alongside identity | Anchors table | verified (new) | M-22-09 §III.A |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Series Ch08: title, bold subtitle, dependency chain | H1/title fixed to "Chapter 08 — The Access Plane"; subtitle became the italic thesis; dependency chain kept | — |
| Series Ch08: The access claim (+ `cshc/access-plane.svg`) | The access claim; figure replaced by `ch08-access-plane.flow.yaml` (same content: perimeter/VPN → identity-driven ZTNA/SASE + cert auth; decisions consume identity claims) | — |
| Series Ch08: The model — Zero Trust | The model — Zero Trust (expanded, Kerberos-island bridges added) | — |
| Series Ch08: SASE — the edge delivery surface (table, five-point contract) | SASE — kept table and contract; contract item 4 extended with CISA telemetry | — |
| Series Ch08: Phishing-resistant MFA (table, CA requirements) | Phishing-resistant MFA (corrected break-glass, CBA multifactor, strengths) | — |
| Series Ch08: Cloud CBA — the AD CS retirement path (six-step sequence, issuance) | Cloud CBA section; new figure `ch08-cba-reanchor.flow.yaml`; issuance corrected (Cloud PKI scope) | — |
| Series Ch08: Privileged access management | Privileged access management (reconciled with Book 04) | — |
| Series Ch08: Continuous access evaluation | Continuous access evaluation (corrected and expanded) | — |
| Series Ch08: The access plane in one flow (7 steps) | Kept; step 6 (mainframe) added, now 8 steps | — |
| Series Ch08: Validation | Kept and extended (CBA multifactor, CRL, PIM eligibility, NTLM) | — |
| Series Ch08: Key takeaways | Kept; takeaways 3 and 4 extended/added | — |
| Series Ch08: Authoritative references list | Removed | Every entry is now a footnote; the workbook books use footnotes only |
| Series Ch08: Previous/Next lines | Replaced by "Continue the book" callout (Next was wrong: pointed to roadmap) | — |
| Whitepaper §Principle 2 — Application-Aware Networking and Cybersecurity: SD-WAN/SASE bullets | SASE section (SASE definition from CISA; SD-WAN vs SASE as design) | ZTMM Networks-pillar maturity mapping and TIC use-case versions not carried (unverified mapping; TIC detail is Book 09's) |
| Whitepaper §Principle 2: M-22-09 "§4" application-layer inspection claim | Not carried | Not in M-22-09 (see claim 53) |
| Whitepaper §Principle 3 — Session-Based to Token-Based Identity (incl. callout, Figure 11) | From sessions to tokens; callout kept as blockquote (agency-neutral) | Figure 11 (Word extract `rId81.png`) not reproduced; the access-plane figure carries the session→token contrast and Book 02 Ch03 has the two-worlds diagram |
| Whitepaper §Mainframe Access Modernization (Current state, How the gateway bridges to RACF, What does not change internally, Recommendation; Figure 14) | Mainframe access: tokens at the boundary; Figure 14 replaced by `ch08-mainframe-token-boundary.flow.yaml` | Banking/PSD2 history and dating removed (claims 50–51) |
| Whitepaper §Federal Framework Alignment — access rows (separate truth from enforcement; app-aware networking; phishing-resistant MFA/CBA; eliminate NTLM; device compliance; SASE/ZTNA; mainframe bridge) | Federal anchors for the access plane (rebuilt, verified) | Non-access rows (DNS, IPAM, audit, FedRAMP 20x, round-trip) are W3/W5 and Appendix A territory |
| Whitepaper §Act 4 intro (structural move: directory vs in-path enforcer) | Not carried here | Owned by W5 (journey) / Chapter 02; Chapter 08 references the consequence only |
| Whitepaper §Principles 1, 4, 5; FedRAMP 20x section; Acts 1–3; Prologue; Exec Summary; Appendix | Not carried here | Owned by W1 (why/problem) and W5 (journey, phases, roadmap); Principle 4's authorizing-official note went to Chapter 09 |
