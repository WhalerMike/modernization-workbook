# Verification — Chapter 04, Change Control and Provenance

Checked October 21, 2026 by writer W2. Source: `docs/architecture/change-control-and-provenance.md` (695 words). The brief also asked for pull-request-based change and the separation of governance and execution identities. Those draw on the "Two-Brain Execution" principle in the reference-architecture landing (see Ch03's ledger), Book 01 Ch03 and Ch11, and Book 04 Ch10. Ch04 is consistent with them and links to them rather than restating them.

How claims were checked:

- **SP 800-53 Rev. 5.2.0.** Control statements, discussion and security baselines for CM-3, CM-3(1), CM-3(2), CM-5, CM-5(1), CM-5(4), AU-10, AU-10(1) and SA-10 were read from the csrc.nist.gov Cybersecurity and Privacy Reference Tool JSON export (`SP_800_53_5_2_0`). They were cross-checked against NIST's OSCAL catalog and the SP 800-53B baseline profiles, which the csrc publication page links.
- **FedRAMP.** Rev5 classes and parameters were read from the fedramp.gov Full Rev5 Control Reference family pages (AU, CM, SA). The KSIs were read on the fedramp.gov change-management KSI page.
- **Microsoft.** PIM was checked with the Microsoft Learn MCP fetch tool.
- **GitHub.** Protected branches were checked on docs.github.com.

No personal data was sent to any site.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Five-clause path; skipping a clause makes the operation unauthorized by construction | Five-clause path | restated-as-design | Program design; matches Book 00 Ch04 principle 2 and Book 01 Ch02 wording |
| 2 | MACD-R = move, add, change, deletion, reset; class definitions and examples | Five change classes | restated-as-design | Source names the classes only. Definitions and examples are new and labeled illustrative |
| 3 | Leaver deprovisioning is rollback-never; restore through joiner | Five change classes | verified (in workbook) | Book 01 Ch11, linked |
| 4 | Standing authorizations = recorded grants with scope and expiry; tied to the L4 enumerated classes | Clause 2 | restated-as-design | Source (standing authorizations) plus Book 01 Ch11 (ladder). The tie between them is this chapter's |
| 5 | PIM: eligible vs active; JIT; activation can require approval, MFA and justification; audit history | Clause 3 | verified | Learn, "What is Microsoft Entra Privileged Identity Management?" |
| 6 | Per-class sources of truth (devices = asset registry; IaC; human owner resolvable in HR; ownerless = orphan finding) | Where work comes from | restated-as-design | Source. Compliance and migration rows come from the source's clause 1 examples |
| 7 | Orphan = identity finding in Ch06's model | Where work comes from | restated-as-design | Consistent with Ch06 diagram source (orphan account under Identity) |
| 8 | Pull-request rules: registry, decision record, checks, two people, signed merge, revert | Changing the record | restated-as-design | Ch03 SSOT change process; Book 01 Ch11 authorization gate; Book 04 Ch10 change control. Consistent with all three |
| 9 | GitHub branch protection: required approving reviews; dismiss stale approvals; most recent push approved by someone other than the pusher; required status checks; signed and verified commits; restrictions don't apply to admins by default unless "Do not allow bypassing" is set | Changing the record | verified (new) | GitHub Docs, "About protected branches" |
| 10 | Emergency change under PIM with ticket; back-port within one business day; drift monitor shows it | Changing the record | verified (in workbook) | Book 04 Ch10, linked (program design there) |
| 11 | KSI-CMT-RMV: redeploy version-controlled resources rather than direct modification wherever reasonable. KSI-CMT-LMC: modifications logged and monitored. KSI-CMT-VTD: testing and validation throughout deployment automated | Changing the record | verified (new) | fedramp.gov Change Management KSI page (mappings updated Oct 13, 2026) |
| 12 | KSIs bind providers, not agencies | Changing the record | verified (in workbook) | Book brief settled fact; Book 10 Ch03, linked |
| 13 | Governance and execution: separate service principal, credential store, log stream; revoking either stops safely | Two identities | verified (in workbook) / restated-as-design | Book 01 Ch03 and Ch11 (program design there) |
| 14 | Pipeline identity without a secret (workload identity federation); Tier 0 asset | Two identities | verified (in workbook) | Book 04 Ch10, linked |
| 15 | Provenance envelope fields | Provenance for every state change | restated-as-design | Source clauses 3–5 plus Ch05's "envelope" (who issued, when observed and recorded, lineage). Ch05 points to this chapter for the definition; the fields were aligned to that wording |
| 16 | AU-10 statement; discussion names "approving information" and "digital signatures" | Provenance | verified (new) | csrc CPRT CST-AU-10, D-AU-10 |
| 17 | AU-10 is in the NIST High baseline only; FedRAMP Class D only; FedRAMP actions parameter includes addition, modification, deletion, approval, sending or receiving of data | Provenance; controls table | verified (new) | CPRT relationship AU-10→SB-High; fedramp.gov AU page. Consistent with Book 12 Ch09 and App A |
| 18 | CM-5(1): automated enforcement, automatic audit records; NIST High only; FedRAMP Class C, D | Provenance; controls table | verified (new) | CPRT CST-CM-05(01), SB-High; fedramp.gov CM page |
| 19 | CM-3 statement a–g; NIST Moderate, High; FedRAMP C, D | Controls table | verified (new) | CPRT CST-CM-03; fedramp.gov CM page. Consistent with Ch05's CM-3 paragraph |
| 20 | CM-3(2): test, validate and document before finalizing; NIST Moderate, High; FedRAMP C, D | Controls table | verified (new) | CPRT; fedramp.gov |
| 21 | CM-5 statement; NIST Low, Moderate, High; FedRAMP B, C, D | Controls table | verified (new) | CPRT; fedramp.gov |
| 22 | SA-10 is a developer control (statement a–e); NIST Moderate, High; FedRAMP C, D | Controls table | verified (new) | CPRT CST-SA-10; fedramp.gov SA page |
| 23 | SA-10 applies to the program's own tooling; for a cloud service it is the provider's obligation | Controls table | restated-as-design | The program's reading of the control's "developer" scope, labeled as such |
| 24 | CM-5(4) dual authorization is in no NIST baseline; no FedRAMP class listed; the two-person rule is program design | Controls table | verified (new) | CPRT SB-Not_Selected; fedramp.gov CM page (no class line for CM-05(04)) |
| 25 | Closure provenance doctrine: three requirements | No closure counts | restated-as-design | Program design (source) |
| 26 | Reports derived from closure stream feed CA-7 continuous monitoring | No closure counts | verified (in workbook) | Book 12 Ch12, linked |
| 27 | Migration wave = batch of moves, JIT per action, per-object closure evidence | At migration scale | restated-as-design | Source; Book 01 Ch11 evidence packet linked |
| 28 | A Global Administrator can still change the tenant directly; drift detection catches it | Honest limits | verified (in workbook) | Book 04 Ch10 drift section |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Title and bold subtitle | Ch04 thesis and opening | Reworded |
| § The five-clause path (MACD-R; clauses 1–5; one-chain summary) | "Five change classes"; "The five-clause path" with figure ch04-five-clause-path | Clause 3's activation-record sentence is also used in the provenance table |
| § Closure Provenance Doctrine, opening lines | "No closure counts unless it carries its proof" | "Doctrine" label dropped |
| § Three requirements | Same section, numbered list; figure ch04-closure-record | — |
| § Non-human class sources of truth | "Where work comes from" table and owner rule | Expanded with people, contractor, compliance and migration rows |
| § Application at migration scale | "At migration scale" | Linked to Book 01 Ch11 evidence packet |
| Closing "Cleaned extraction" note | — | Source plumbing |
| (Brief) pull-request-based change | "Changing the record: pull requests" | Built from the Ch03 sources and Books 01 and 04 |
| (Brief) separation of governance and execution identities | "Two identities, not one" | From the reference-architecture "Two-Brain Execution" principle and Book 01 Ch03. The assistant-product name was dropped |
| (Brief) CM-3, CM-5, AU-10, SA-10 | "How the path lines up with the controls" | Verified on csrc.nist.gov and fedramp.gov. Two points of correction are stated: AU-10 is High/Class D only, and SA-10 is a developer control |
