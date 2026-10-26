# Verification — Chapter 08, Who Owns AI Identity Governance

Writer W4. New chapter; no source page was assigned. Kept consistent with Book 00 Ch07 (CISO decides control requirements; AO alone accepts risk; sponsor and CIO decide budget; separations), Book 01 Ch09 (deciding/doing/consulted model), Book 04 Ch06 (IGO and identity engineering roles; consent, credential, federated credential and orphan rows; security ops decides incident-driven revocation), Book 12 Ch10, Book 13 Ch09 (governance board; system owner decides remediation; CISO decides on evidence; bounded vs open-ended exceptions), Book 14 Ch10 (RMF roles; AO decides significant change, ATO and ongoing authorization; SAOP categorization for PII and privacy plan; who must be a government official) and Book 15 Ch10 (system owner decides shadow assets). Federal PDFs downloaded from whitehouse.gov and nvlpubs.nist.gov with a generic user agent and read as text; Microsoft pages read through the Microsoft Learn MCP tools. All accessed October 21–22, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | CAIO retained or designated within 60 days; may be CIO/CDO/CTO with significant AI expertise; SES/ST/SL in CFO Act agencies, GS-14+ elsewhere; authority and access to Deputy Secretary | Where the roles come from | verified | M-25-21 §3(a)(i) |
| 2 | AI governance board within 90 days for CFO Act agencies; Deputy Secretary chair, CAIO vice-chair; membership list; existing bodies allowed | Where; CAIO section | verified | M-25-21 §3(a)(ii) |
| 3 | Accountable officials at lowest appropriate level accept risk for AI use cases; fn 21 mission outcome; fn 22 separate from and doesn't supersede authorization; fn 29 continue ATO requirements | Where; AO; separations | verified | M-25-21 §3(b)(i), fn 21, 22, 29 |
| 4 | M-25-22 cross-functional team and its expertise list; SAOP early and ongoing involvement; ATO prior to deployment; contract oversight for emerging risks; procedures to let officials review planned acquisitions | Where; privacy; acquisition | verified | M-25-22 §3(b), fn 14, §3(d), §4(a)(i), §4(e)(i)–(ii) |
| 5 | FITARA: covered CFO Act agencies can't contract for IT unless CIO approved; monthly reporting from May 2026 | Where; CIO | verified | M-26-10 §1 |
| 6 | No OMB memo through September 2026 rescinds M-25-21 or M-25-22 | Where | verified | OMB memoranda page (list through M-26-19); M-26-04 and M-26-10 checked for "rescind/supersede" |
| 7 | AO only official who can accept risk; government-only; system owner decides access with information owner; CIO designates SAISO; SAOP government-only; CIO may be AO for selected systems; mission owner may serve as AO; no conflicts of interest | Where; roles; government table; separations | verified | SP 800-37 Rev. 2 App. D, fn 113 |
| 8 | AI RMF GOVERN 2.1, 2.3, 3.2 | Where | verified | NIST AI 100-1 |
| 9 | Agent ID sponsors, owners, managers definitions; sponsor required; owners optional; separate from RBAC roles | Where; sponsor section | verified | Agent ID owners, sponsors and managers |
| 10 | Sponsors can disable/soft-delete and change sponsors, not configure or re-enable; owners can recover | Sponsor section | verified | Same |
| 11 | Guests and some group types allowed as sponsors | Sponsor section; government table | verified | Same |
| 12 | Creators often sponsor unpublished agents; published agents' sponsors come from using teams | Sponsor section | verified | Same |
| 13 | Sponsorship transfer to manager via Lifecycle Workflows GA May 2026 | Sponsor section | verified | Entra What's new, May 2026 |
| 14 | Sponsor must be an agency employee; group only as co-sponsor; transfer at publication; acceptance window | Sponsor section | restated-as-design | Program design |
| 15 | CAIO duties list (inventory, high-impact processes, workforce, code/data inventory) | CAIO | verified | M-25-21 §3(a)(i)(A)–(J) |
| 16 | Waivers: written system-specific determination, annual certification, not delegable; pilot certification | CAIO; matrix comment | verified | M-25-21 §4(a)(i)–(ii) |
| 17 | Determination that a presumed high-impact case isn't: documented by an official, CAIO may revisit | Matrix comment | verified | M-25-21 §4(a) |
| 18 | Inventory entries must link to identity records | CAIO; matrix | restated-as-design | Program design |
| 19 | Impact assessment ends in a signed risk acceptance; independent reviewer not involved in development; comments shared with the acceptor | Use-case risk acceptor; separations | verified | M-25-21 §4(b)(ii)(F)–(G) |
| 20 | System-specific operator training for high-impact AI | System owner | verified | M-25-21 §4(b)(iv) |
| 21 | Generative AI acceptable-use policy | Matrix comment | verified | M-25-21 §3(b)(iv) |
| 22 | New tool, permission, user account or model raised as candidate significant change | AO | restated-as-design | Program design on Book 14 Ch10 |
| 23 | Admin consent workflow doesn't work for agent permission requests | Identity team | verified | Agent ID FAQ |
| 24 | Highly privileged directory roles and high-risk Graph permissions blocked for agents; agent identities can't create agent identities | Separations | verified | Agent ID FAQ; Agent ID error codes |
| 25 | M-26-04 adds LLM contract requirements (truth-seeking, ideological neutrality) | Acquisition | verified | M-26-04 overview and §a |
| 26 | Acquisition minimum identity terms | Acquisition | restated-as-design | Program design |
| 27 | CIO decides shadow AI with no owning system | CIO; matrix | restated-as-design | Program design |
| 28 | Responsibility matrix (31 rows) and comments | Matrix | restated-as-design | Checked row by row against Book 04 Ch06, Book 13 Ch09, Book 14 Ch10, Book 15 Ch06 and Ch10 |
| 29 | Separation 2 (waiving official not sole AO for the same system) | Separations | restated-as-design | Built on SP 800-37 fn 113 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| (none assigned) | — | New chapter. Routing from the governed-path drift table (AO + ISSO, security team, IdM coordinator, privacy officer) informed the matrix rows for findings; the source is logged in Ch07's ledger |

## Source watch, October 26, 2026

Re-checked after the weekly source watch (issue #160) reported a change in a cited source. Checked October 26, 2026; no personal data sent to any site.

| Finding | Change |
|---|---|
| OMB memoranda index now runs to M-27-01; M-26-10 still listed and not superseded | `c08-omb-list` updated |
