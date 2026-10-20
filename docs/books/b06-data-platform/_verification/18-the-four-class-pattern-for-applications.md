# Verification — Chapter 18, The Four-Class Pattern Applied to SQL-Consuming Applications

Checked October 20, 2026. Sources: the existing page (former Book 08, Chapter 1) verified and upgraded in place, plus the archived front page `docs/case-studies/sql-server-narrative/Book_08.md`, carried into the opening callout and diagram.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | SQL Server downstream of middleware; many apps LDAP-bind | Opening | restated-as-design | Program framing; "federal environment" → "agency environments" |
| 2 | LDAP-dependent-application migration plan accepted 2026-05-13; four classes and order | Opening | restated-as-design | Program decision |
| 3 | Order matches Microsoft: OIDC recommended for new development; Domain Services transitional | Opening | verified (new) | Learn, Authenticate applications and users with Entra ID; What is Entra Domain Services? |
| 4 | Driver versions add Entra modes in specific releases | Two axes | verified | Learn, Entra authentication with Microsoft.Data.SqlClient |
| 5 | `AccessToken` is part of the pool key; driver can't renew it | Two axes | verified (new example) | Same |
| 6 | Database-axis columns A–D; exception registry | Two axes | restated-as-design | Program taxonomy |
| 7 | Class 1 apps can't change auth mechanism | Class 1 | restated-as-design | Program definition |
| 8 | Source: App Proxy "fronts the application's user authentication behavior without modifying the application" | Class 1 | edited / verified | Learn, Microsoft Entra application proxy; How to configure SSO to an app proxy app: preauthentication with Entra ID, then KCD/IWA, header, password or SAML SSO; app unmodified |
| 9 | App's AD dependency remains behind the proxy; KCD needs connectors joined to same/trusting domain | Class 1 | verified (new) | Learn, KCD for SSO with application proxy (prerequisites) |
| 10 | App Proxy scope: web apps, web APIs, RD Gateway, MSAL rich clients | Class 1 | verified (new); thick-client conclusion labelled program interpretation | Learn, Microsoft Entra application proxy |
| 11 | SAML 2.0 XML-based, mature, predates OIDC adoption in enterprises | Class 2 | verified / edited | Learn, SAML versus OpenID Connect ("used widely for over a decade"); "before OIDC was standardized" softened |
| 12 | Entra ID as SAML IdP; signed assertion; CA applies | Class 2 | verified | Learn, Understand Microsoft's SSO model |
| 13 | Source: "the SAML identity-provider standard" | Class 2 | removed | Unidentified internal reference; Microsoft source used instead |
| 14 | SAML below OIDC "because it doesn't provide the full capability set" | Class 2 | edited | Replaced with Microsoft's stated reason: no SAML dev libraries, OIDC recommended |
| 15 | OIDC flow: redirect, ID token and access token, claims | Class 3 | verified | Learn, Understand Microsoft's SSO model; Tokens and claims overview |
| 16 | SQL Server validates the token "through the Arc-provided token-validation infrastructure" | Class 3 | edited | Learn, Entra authentication for SQL Server: Arc sets up the instance's Entra configuration; reworded |
| 17 | Domain Services: managed domain with LDAP, Kerberos, NTLM; one-way sync from Entra | Class 4 | verified | Learn, What is Entra Domain Services?; How objects and credentials are synchronized |
| 18 | Domain Services NTLM falls under Phase C | Class 4 | restated-as-design (new) | Follows from Chapter 15 |
| 19 | `Get-LDAPBindAccountInventory.ps1` outputs | Audit | restated-as-design | Program instrument; not an external claim |
| 20 | Source: "instance-level migration planning in Book 05" | Audit | corrected | → Chapters 11–12 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, H1 "Chapter 1 — …" | Front matter, H1 | edited |
| Thesis, "In this chapter" | Same | kept (lightly edited) |
| Opening three paragraphs + four-class diagram | Opening | edited (diagram moved after the chain diagram; claim 3 added) |
| "Two Axes" + matrix diagram | Same | edited (claims 4–5) |
| "Class 1 — App Proxy" | Same | edited (claims 8–10) |
| "Class 2 — SAML" | Same | edited (claims 11–14) |
| "Class 3 — OIDC" | Same | edited (claims 15–16) |
| "Class 4 — Entra Domain Services" | Same | edited (claims 17–18) |
| "The Application-Audit Script as the Classification Triage Tool" | Same | kept; cross-references renumbered |
| "What Book 08 establishes — Chapter 1" | "What this chapter establishes" | kept |
| Book_08 front matter, subtitle, description | Description, opening callout | carried |
| Book_08 callout (application chain is one path) | "Where this part of the book goes next" | carried |
| Book_08 diagram `book-08-application-chain.svg` | After opening callout | carried |
| Book_08 "Download this book" | — | removed: bundle not on site; Runbook R08 link instead |
| Book_08 "Chapters" listing | — | removed |
| Book_08 "Place in the dependency chain: Step 6" | Opening callout | carried as text |
| Book_08 "Authoritative references" (SqlClient, credential chains, linked server, Arc MI, CA) | Footnotes in Chapters 14, 16, 18, 19 | carried, re-opened |
| Book_08 "Continue the series" | Continue the book | edited |

Diagram source edited: `book-08-application-chain.flow.yaml` ("Chapter 1/2" → "Chapter 18/19"). Needs re-render. `book-08-ch01-four-class-pattern` and `book-08-ch01-two-axis-matrix` checked, no change.
