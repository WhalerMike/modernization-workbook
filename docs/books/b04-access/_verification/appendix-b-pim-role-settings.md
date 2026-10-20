# Verification — Appendix B, PIM Role Settings Reference

Checked 2026-10-20 against Microsoft Learn. Footnote keys are `aB-*`.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Activation 1–24 h; ticket info-only; per-role settings | Intro | verified | aB-settings |
| 2 | 24-hour fixed approval window; single-stage only | Intro | verified | aB-approval |
| 3 | Assignment-tab settings and matching Graph rule IDs | Common settings | verified | aB-settings, aB-rules |
| 4 | Per-role values (durations, approvers, ticket, expiry, groups) | Tier tables | restated-as-design | — |
| 5 | Fewer than five GAs | Tier 0 | verified | aB-privileged |
| 6 | Eligible group-to-role + active members recommended for Exchange/SharePoint/Purview roles | Tier 1 | verified | aB-pim-groups |
| 7 | Some Exchange admin center areas don't recognize group-held roles; assign directly | Tier 1 | verified (known issues) | aB-rag |
| 8 | Tier 2 roles can't change credentials of role-assignable group members/owners (needs PAA) | Tier 2 | verified (User Admin, Password Admin role text; RAG page) | aB-roles-ref, aB-rag |
| 9 | Microsoft recommends approval for groups used to elevate into roles | Tier 2 | verified | aB-rag |
| 10 | Privileged label on readers (GR, SR yes; Reports Reader no) | Read-only | verified | aB-roles-ref |
| 11 | Notification option types; 1,000 recipients | Notifications | verified | aB-settings, aB-email |
| 12 | Notification routing per tier | Notifications | restated-as-design | — |
| 13 | Role review shows group, not members; self-review excludes RAGs | Reviews; Book 02 diff | verified | aB-review |
| 14 | Book 02 Ch09 values quoted in diff table | Book 02 diff | verified against `docs/books/b02-identity/09-building-the-entra-target.md` and `10-migrating-and-governing.md` in this worktree | — |
| 15 | 22 template IDs | Template IDs | verified (20 by fact-check against permissions reference; Password Administrator and Authentication Policy Administrator by Learn search of the same page) | aB-roles-ref |
| 16 | Privileged label per role | Template IDs | verified (Authentication Policy Administrator shows no label in the all-roles table) | aB-roles-ref |
| 17 | Privileged label still preview | Template IDs | verified | aB-privileged |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| access-plane/pim-self-request-approval.md — Role tiering table | Appendix B tier tables (single values chosen within source ranges: T0 4 h, T1 8 h) | Source ranges (2–4 h, 4–8 h) collapsed to single program values |
| — Step 3 template ID table | Appendix B Role template IDs (Password, Authentication Policy, Compliance Admin and Reports Reader added) | — |
| — Step 2 notifications guidance | Appendix B notifications by tier | — |
| — Step 7 review guidance | Appendix B review cadence | Cadence set monthly T0 (Book 02 Ch05) / quarterly others (Book 02 Ch10) |
| Book 02 Ch09 role table (not a source page; consistency check) | Appendix B "Where this appendix tightens Book 02" | — |

## 3. Notes for the editor

- **Inconsistency with Book 02, Chapter 09's PIM table** is deliberate and listed in the appendix (Security Admin and CA Admin durations/approval, Tier 1 approvals, tickets, reader durations, review reviewers). Book 04 Chapter 02 links to both; consider updating Book 02 Ch09 to point to this appendix as the governing values.
- Authentication Policy Administrator and Compliance Administrator were added to Tier 1 (Compliance from Book 02 Ch09's table; Authentication Policy because it controls tenant-wide method policy).
