# SQL Server Identity Transformation — Narrative Series

**From Windows Authentication to cloud identity — a reading sequence on transforming the SQL Server estate**

![The ten books and the epilogue, in the order they depend on each other.](../../images/sql-server/diagrams/svg/series-00-reading-path.svg){fig-alt="The ten books and the epilogue in stages: why and what survives (Books 01 to 03), migrating the engine (Books 04 to 06), and extending outward then sustaining (Books 07 to 09), with Book 10, the certificate authority dependency, alongside the whole series, and Book 11, the platform question, as the epilogue."}

**Full narrative bundle:** [sql-server-narrative-bundle.docx](../../../downloads/sql-server-narrative-bundle.docx) — all books combined into one Word document, regenerated on every site deploy.

**Neutralized Markdown:** [sql-server-narrative-neutralized.md](sql-server-narrative-neutralized.md) — source identifiers replaced with plain language.

**Series overview:** [Series Overview](series-overview.md) — cleaned summary with the series diagrams.

## Status

The full original narrative is available as a single DOCX bundle. Individual cleaned Markdown chapters are also present. Every book and chapter carries its own diagram; the sources and render script are in `docs/images/sql-server/diagrams/`.

## The destination

Windows Authentication and SQL Authentication are eliminated and replaced with cloud identity authentication for SQL Server 2022 and later. Authentication is enforced through OAuth 2.0 tokens, a Microsoft Entra identity for each instance (the Arc managed identity on SQL Server 2025, an app registration on SQL Server 2022), and multi-factor authentication for every human principal.

## The journey in diagrams

![How a connection authenticates before, during and after the transformation.](../../images/sql-server/diagrams/svg/series-01-before-during-after.svg){fig-alt="Before: a domain-joined client gets a Kerberos ticket or falls back to NTLM, invisible to Entra ID. During: legacy and migrated clients coexist, with two authorities and old logins disabled after validation. After: users, apps and managed identities get an Entra token under Conditional Access, only Entra logins remain in use on SQL Server, and every sign-in is logged."}

Before, every party is domain-joined and NTLM is the silent fallback when the service principal name is missing. During the parallel run, legacy and migrated clients coexist. After, Conditional Access evaluates every sign-in and the SQL Server validates the Entra token; no domain controller is in the path.

## Reading sequence

| Book | Title | Focus |
|------|-------|-------|
| [—](Applicability.md) | Applicability | Read first: where the series applies as written, alternatives, and fallback protections |
| [01](book-01-the-inheritance.md) | The Authentication Inheritance Problem | What Windows Authentication actually is, and why it must end |
| [02](book-02-the-estate.md) | The Estate Itself | Assess and consolidate before you touch authentication |
| [03](book-03-authentication-audit.md) | The Authentication Audit | What is actually using Windows Authentication, SQL Authentication, and NTLM |
| [04](book-04-identity-bridge.md) | The Identity Bridge | Hybrid-management attachment and an Entra identity for the engine |
| [05](book-05-login-migration.md) | Login Migration | Parallel-run of Windows and cloud-identity logins |
| [06](book-06-ntlm-elimination.md) | NTLM Elimination | Silent fallback, service principal name repair, and protocol restriction |
| [07](book-07-access-control.md) | Access Control | Dynamic groups and administrative-unit delegation |
| [08](book-08-upstream-chain.md) | The Upstream Application Chain | Applications that depend on Windows Authentication or LDAP |
| [09](book-09-steady-state.md) | Transformed Steady State | The destination and the milestone |
| [10](book-10-certificate-authority.md) | Certificate-Authority Dependency | The layer the other steps depend on but rarely name |
| [11](book-11-platform-question.md) | Epilogue — The Platform Question | Database consolidation toward SSOT, after the transformation |

## Relationship to identity governance

Dynamic Entra security groups grant SQL Server access based on HR-sourced user attributes, so no database administrator has to provision access by hand. The HR-to-directory attribute feed, its write protection, and the rule testing described in [Book 07](Book_07.md) must be in place before the dynamic-group access work starts.

---

*Original diagrams from the source bundle. Paths are relative and resolve for both HTML and DOCX.*

## Building the Word bundles

The combined Word document (`downloads/sql-server-narrative-bundle.docx`, also published as `sql-server-narrative-standalone-bundle.docx`) and the per-book documents (`downloads/Book_01-bundle.docx` to `Book_11-bundle.docx`) are built directly from the Markdown pages in this folder by `scripts/build_bundles.py`. The same script builds the site's other section bundles. The site deploy workflow runs it on every push to `main`. To build locally, run this from the repository root (you need [Quarto](https://quarto.org/), plus `rsvg-convert` if any page uses an SVG):

```bash
python3 scripts/build_bundles.py                                    # every bundle, into _site/downloads/
python3 scripts/build_bundles.py --only sql-server-narrative-bundle.docx Book_07-bundle.docx
python3 scripts/build_bundles.py --list                             # print each manifest, build nothing
```

- **Reading order** comes from the manifests in `scripts/bundles.yml`. The combined bundle lists every page explicitly: `index.md`, then each `Book_NN.md` followed by its chapters, then Book 11. **When you add, remove, or rename a page, update that list.** The build fails if a listed file is missing, and it warns about any `Book_*` page that isn't listed. Each per-book bundle is `Book_NN.md` followed by its `Book_NN_CPT_*.md` chapters, so new chapters are picked up automatically.
- **Images** are resolved relative to the page that references them (normally `../../images/sql-server/`). Each one is embedded where it appears, with its alt text as the caption, scaled to the page width. SVGs are converted to PNG, and files whose extension doesn't match their content are fixed for Word. **The build fails if a referenced image is missing.** It prints a report of references and embedded images per bundle, plus any images in `docs/images/sql-server/` that no page uses.
- **Web-only pieces** are dropped by `scripts/bundle-filter.lua`: chapter listings, the "Continue the series" and "Download" callouts, and links between pages, which become plain text. Each bundle gets a title page and a Word table of contents. If Word asks to update fields when you open it, choose **Yes** so it fills in the page numbers.
- **Download links** on the site must point at a bundle the script builds: the build fails if any `downloads/*.docx` link on a published page has no matching bundle.
