# Verification — Chapter 06, Legacy Protocols on Re-Routed Paths

File: `docs/books/b09-network/06-legacy-protocols-on-re-routed-paths.md`
Diagram sources (new): `docs/images/diagrams/b09-network/src/ch06-dc-dependencies.flow.yaml`, `ch06-round-trip-decomposition.flow.yaml`. No staged `src-` diagram used.
Checked 2026-10-21 against Microsoft Learn (Kerberos registry and KDC keys; Max-Ticket-Age, Max-Renew-Age, Maximum lifetime for service ticket; Kerberos SSP/AP; Kerberos authentication overview; NTLM overview; KB 976918; IIS browser authentication; Delivery Optimization proxy; Global Secure Access TLS inspection concept and FAQ; Entra Private Access Kerberos SSO; MS-KKDCP listing; Policy CSP ADMX_Kerberos; hybrid join concept, plan and FAQ; continuous access evaluation; strict location enforcement; token protection), the RFC Editor (RFC 4120, 9293, 4821), OMB M-22-09 (PDF text extracted) and NIST (SP 800-63B-4 CSRC record and AAL page).
Sources: *The Branch Edge Gap* v2 §4.1–4.3, §5.1–5.2 and the matching §10 and Appendix A entries; *The Long Interim* §7.1–7.3. Footnote keys drop the `c06-` prefix.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Proxies reset/reap idle connections | What breaks | restated-as-design (general engineering behavior; no vendor-specific figure claimed) | — |
| 2 | Certificate pinning and mutual TLS fail under inspection; bypass needed | What breaks | verified | gsa-tls |
| 3 | Channel binding (EPA) causes NTLM failures through proxies | What breaks | verified (added) | cbt |
| 4 | NTLM over HTTP needs one persistent connection; some proxies break it | What breaks | verified (added) | iis-ntlm |
| 5 | Applications keyed to client IP break behind a PoP's egress | What breaks | verified with documented example (Delivery Optimization) | do |
| 6 | Unparseable protocols passed, blocked or generically proxied | What breaks | restated-as-design; HTTP/2 inspection limit added as documented example | gsa-tls-limits |
| 7 | MTU changes present as "throughput collapse" | What breaks | corrected: documented symptom of PMTUD black holes is connection hangs; reworded | pmtud |
| 8 | Path change does not cause TCP sequence discontinuity; address change breaks connections | Address continuity | verified | tcp |
| 9 | "Proactive SD-WAN switch preserves session; reactive reroute terminates it" (v1.0) | Address continuity | corrected (already corrected in v2; re-checked) | tcp |
| 10 | RFC 4120 `caddr` optional | Kerberos | verified; added that RFC 4120 recommends addressless tickets because of NAT | rfc4120 |
| 11 | Address checking is the application server's function, not the KDC's | Kerberos | verified (`KRB_AP_ERR_BADADDR`, §3.2.3) | rfc4120 |
| 12 | `KdcUseClientAddresses` default 0; `KdcDontCheckAddresses` default 1; `ClientIpAddresses` default false | Kerberos | verified (ClientIpAddresses default 0, attributed by Microsoft to DHCP and NAT) | kdc-keys |
| 13 | No sub-5 ms DC requirement; 5-minute SkewTime | Kerberos | verified | kdc-keys |
| 14 | Client waits 10 s for KDC, 3 retries | Kerberos | verified (added) | kdc-keys |
| 15 | TGT 10 hours, renewal 7 days, service ticket 600 minutes | Kerberos | verified | maxticket; maxrenew; svcticket |
| 16 | Expired service ticket doesn't interrupt an established connection | Kerberos | verified (added) | svcticket |
| 17 | Windows Kerberos uses TCP by default since Vista; KDCs MUST accept TCP on 88 | Kerberos | verified (added) | kdc-keys; rfc4120 |
| 18 | "Four" operations need a reachable DC | DC dependencies | corrected: list extended to five; service tickets for on-premises services (and TGT renewal) added | kerb-overview |
| 19 | Initial TGT at logon needs KDC | DC dependencies | verified | kerb-ssp |
| 20 | Group Policy from SYSVOL needs DC | DC dependencies | restated-as-design (well-established; Microsoft's Private Access guide lists SMB 445 for Group Policy, cited in the paths section) | gsa-kerberos |
| 21 | Password change can't be satisfied from cached credentials | DC dependencies | verified via hybrid join plan and FAQ | hybrid-plan; hybrid-faq |
| 22 | Hybrid join "registration" needs line of sight | DC dependencies | verified and extended: periodic line of sight; device password change, user password change, TPM reset | hybrid-plan |
| 23 | Cloud resources don't need DC after first sign-in except password change | DC dependencies | verified (added) | hybrid-faq |
| 24 | "Everything works except signing in" asymmetry at local-breakout branches | DC dependencies | restated-as-design | — |
| 25 | No KDC → fallback to MSV1_0/NTLM pass-through | NTLM | verified (added) | kerb-ssp |
| 26 | NTLM resource server contacts DC per new token; Kerberos server needs DC only for PAC validation | NTLM | verified (added) | ntlm; kerb-overview |
| 27 | NTLM deprecation status | NTLM | not restated; linked to Book 06 Ch14, which carries it with sources | — |
| 28 | Entra Private Access: publish DCs and ports for Kerberos SSO; guide excludes domain operations | Paths | verified (added; vendor example only) | gsa-kerberos |
| 29 | KDC proxy protocol: tickets and password change via proxy; client uses it when DC can't be located | Paths | verified (added) | kkdcp; kdcproxy-policy |
| 30 | Microsoft recommends Entra join where line of sight is a concern | Paths | verified (added) | hybrid-concept |
| 31 | Corrected three-part remediation | Remediation | restated-as-design (registry facts footnoted above) | kdc-keys |
| 32 | PowerShell snippet reading Kdc key values | Remediation | added; read-only `Get-ItemProperty` on documented path; warning callout | kdc-keys |
| 33 | 120–180 ms RTT; 3.6–5.4 s for 30 queries | Round trips | verified as worked arithmetic from stated inputs | — |
| 34 | v1.0 "750 ms, 6×" | Round trips | corrected (already in v2; re-checked: device acts on first leg only) | — |
| 35 | Branch-edge gain "≈20–25%" | Round trips | corrected: 3.6→2.7 s is 25%, 5.4→4.5 s is 16.7%; now "17–25%" | arithmetic |
| 36 | 30→3 round trips gives "270–540 ms" | Round trips | corrected: 360–540 ms on the baseline path, 270–450 ms with the branch improvement; v2 mixed endpoints of two paths | arithmetic |
| 37 | Hairpin first leg 40–60 ms; most recovery came from DIA | Round trips | restated-as-design (illustrative input, labeled) | — |
| 38 | M-22-09 requires phishing-resistant MFA at application layer | Token access | verified | m2209 |
| 39 | M-22-09 mandates no token lifetime; only risk-triggered reauthentication | Token access | verified (text searched; session language is continuous evaluation with reauthentication as one mitigation) | m2209 |
| 40 | EO 14028 as amended by EO 14306 | Token access | not carried (Ch03 owns policy instruments) | — |
| 41 | SP 800-63B-4 "Authentication and Lifecycle Management," final 31 July 2025 | Token access | corrected title: *Authentication and Authenticator Management*; date verified | sp80063b |
| 42 | Reauthentication: AAL1 30 days; AAL2 24 h / 1 h inactivity; AAL3 12 h / 15 min | Token access | verified, with SHALL/SHOULD distinctions added (AAL3 12 h is SHALL; others SHOULD) | sp80063b-aal |
| 43 | Access token 1-hour default; up to 28 h in CAE; up to 15 min propagation; IP enforcement immediate | Token access | verified | cae |
| 44 | Queue priority for identity traffic | Transport matters | restated-as-design | — |
| 45 | Changing egress causes false risk detections and location-signal gaps | Transport matters | verified and sharpened with Microsoft's IP-variation table (SD-WAN, SNAT, branch DIA named; non-enumerable RP egress → critical events only, 1-hour tokens) | cae |
| 46 | CAE sees only IP-based named locations; >5,000 ranges limit | Transport matters | verified (added) | cae |
| 47 | Strict location enforcement requires dedicated enumerable egress (preview) | Transport matters | verified (added; preview status stated in footnote title) | cae-strict |
| 48 | Token protection binds session tokens to device | Transport matters | verified (added); link to Book 04 Ch03 | token-protection |
| 49 | "Sub-10 ms SD-WAN path selection"; "250–400 ms token-relay degradation" | Token access | removed (unsourced; already removed in v2, recorded here) | — |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Branch Edge Gap §4 intro ("substantially wrong in version 1.0") | Ch06 opening paragraph | — |
| Branch Edge Gap §4.1 What actually breaks | Ch06 "What actually breaks" and "Address continuity, not sequence continuity" | — (MTU symptom corrected, claim 7; examples added) |
| Branch Edge Gap §4.2 Kerberos: the real dependencies (caddr, registry defaults, 5 ms myth, lifetimes, four dependencies, local-breakout asymmetry, corrected remediation) | Ch06 "Kerberos: the real dependencies," "What genuinely needs a reachable domain controller," "The corrected remediation" | — (list extended, claim 18) |
| Branch Edge Gap §4.3 Round trips, decomposed honestly (table, worked example, 30→3, hairpin case) | Ch06 "Round trips dominate" and figure `ch06-round-trip-decomposition` | — (percentages and 30→3 range corrected, claims 35–36) |
| Branch Edge Gap §5.1 What the policy actually says | Ch06 "What the policy says, and doesn't" | EO 14028/14306 sentence → Ch03 |
| Branch Edge Gap §5.2 Where transport actually matters here | Ch06 "Where transport actually matters" | — (CAE IP-variation detail added) |
| Branch Edge Gap §10 entries: Kerberos KDC registry, AD ticket defaults, CAE, hybrid join, RFC 4120, SP 800-63B-4, M-22-09 | Re-verified; footnotes in Ch06 | Other §10 entries belong to Ch02/03/05/13 and App B |
| Branch Edge Gap App A rows: Kerberos client IP; TCP sequence; 30 queries 6×; 15-minute token; sub-10 ms / 250–400 ms | Ch06 text names each earlier error and its correction | Other App A rows belong to other chapters |
| Long Interim §7.1 What actually breaks on proxied and re-routed paths | Ch06 "What actually breaks" (duplicate of BEG §4.1, consolidated) | Pointer to Long Interim §6.3 (egress) replaced by Ch10 link where relevant |
| Long Interim §7.2 Kerberos, and the four dependencies that are real | Ch06 Kerberos sections (duplicate, consolidated) | — |
| Long Interim §7.3 Round trips dominate ("only lever" when transport can't change; "weaker of two arguments") | Ch06 "Round trips dominate" (interim sentence with Ch10 link) | — |
