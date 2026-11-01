# Building Ticket-to-Machine, Chapter 03 — The SailPoint Client and Its Scopes — narration script (practice copy)

## Slide 1 — Chapter 03: The SailPoint Client and Its Scopes

Welcome back to Building Ticket-to-Machine. This is Chapter 3: the SailPoint client and its scopes. An identity governance API client that can read every identity is already a sensitive account. One that can also change them is a second administrator nobody named. This chapter shows how the kit's clients reach SailPoint Identity Security Cloud and Microsoft Graph, adds their rows to the call list, and proves the drift and re-read clients hold read scopes only. Then two labs and the dangers.

## Slide 2 — Why the SailPoint client reads and never writes

Why insist on read scopes? Look at what the clients actually do. The drift client reads identities, uncorrelated accounts and Graph users, and optionally the directory audit. The re-read client reads one account, one identity or one user. Nothing in Pass 1 writes anywhere. So a manage scope on either client buys nothing and risks a lot: a stolen token could change accounts. The workflow scope left on a standing client lets anyone add workflows that call out of SailPoint. And an administrator's personal token runs the whole kit as an org admin.

## Slide 3 — What exists: base URL, token, search and lists

Here's what the shared client already does. It builds SailPoint's base URL from the tenant name, or takes one you set. It gets a token from a vault or by client credentials; a personal access token works the same way. Search pages with search-after, sorted on the ID, which is how SailPoint says to get past ten thousand results. Account lists page two hundred fifty at a time, the API's maximum. Graph uses a certificate first, from the cloud's own authority. And because Search has no accounts index, one account is re-read through the Accounts API.

## Slide 4 — The ISC and Graph rows of the call list

These are the rows this chapter adds. On SailPoint, a token from an API client, then Search with the search read scope, and the Accounts list and single-account read with the accounts read scope. Workflow creation needs a manage scope, and it's its own task, because no client in the kit makes that call. On Graph, listing users and reading one user both need User dot Read dot All as an application permission, and the directory audit, which is optional, needs AuditLog dot Read dot All.

## Slide 5 — Read scopes, the workflow client, required-only

Four choices make the rows enforceable. The Accounts endpoints accept either a read or a manage scope; the list names the read scope, and the comparison flags manage as extra. Workflow creation gets a separate client, used once and then removed, which is the program's design guidance. The comparison works for SailPoint scopes and for Graph application permissions alike. And a required-only option leaves out optional calls, so an app registration without the audit permission still passes for a drift run that doesn't read the audit.

## Slide 6 — The tests: the same file, now for ISC and Graph

No new test file this time: Chapter 2's call-list test covers SailPoint and Graph too. The drift and re-read clients run against a fake session, and every request they make must match a row for their task. It also asserts that no task asks for a scope ending in manage, or a Graph permission ending in ReadWrite dot All, except workflow creation. And the kit's original SailPoint tests still pass: the token by client credentials and from a vault, and both paging styles.

## Slide 7 — The verified facts: ISC token, Search, Accounts

The SailPoint facts, each read on November first. The token endpoint supports client credentials and personal access tokens, up to ten per user. A client-credentials token has no user context, and SailPoint warns that most admin APIs often return forbidden with one. Search needs the search read scope and pages past ten thousand with search-after. Its indexes include identities but no accounts. The Accounts list and get accept a read or manage scope, at most two hundred fifty a page. And creating a workflow needs the workflow manage scope.

## Slide 8 — The verified facts: Graph, GCC and FedRAMP

And the Graph facts. User dot Read dot All is the least-privileged application permission both to list users and to read one, and the audit needs AuditLog dot Read dot All; both reads are available in the US Government clouds. One wrinkle: application permissions aren't supported on the manager endpoint, and Learn documents expanding the manager on the users list instead. Microsoft 365 GCC uses the worldwide Graph host; GCC High and the Defense Department cloud have their own. SailPoint's Identity Security Cloud is FedRAMP Moderate.

## Slide 9 — What couldn't be verified on SailPoint and Graph

Four points are still open. SailPoint's public pages don't say what API domain a FedRAMP tenant uses. They don't say whether a client-credentials token gets data from Search and Accounts or a forbidden response. Learn doesn't settle whether expanding the manager works under an application permission. And feature parity in SailPoint's FedRAMP environment, for Search, Workflows and the Accounts API, is a question to put to SailPoint in writing. Each one is on the kit's verify list.

## Slide 10 — What the scopes prove, and for whom

What this proves: the drift and re-read clients hold read scopes only, and the workflow client holds one scope and is removed after use. That's least privilege and account management at Moderate, with the comparison kept beside the API client's approval. The Graph app registration holds only what it reads, with a certificate, which adds authenticator management, IA-5. And no part of Pass 1 can write to SailPoint, Entra ID or Active Directory, which is the Federal Modernization Workbook's Book 13's rule that the coordination layer never writes configuration itself.

## Slide 11 — Who owns the SailPoint side

Who owns this? Developers who own the clients, the identity engineers who own the SailPoint side, and the I S S O who approves API clients. There are three non-person identities here. A standing SailPoint reader with exactly two read scopes. A workflow client with one manage scope, used once to create the three workflows and then removed. And a Graph app registration with the user read permission, plus the audit permission only if you read the audit, signed in with a certificate.

## Slide 12 — Lab 1: what the drift client needs from ISC

Lab 1 runs on a laptop. First, the kit's four SailPoint client tests pass. Then list what the drift client needs from SailPoint: a token, Search with the search read scope, and the Accounts list with the accounts read scope. That's two scopes. Now give it a manage scope as well and compare. Nothing is missing, the manage scope is extra, least privilege doesn't hold, and the command exits with a failure. That one line is the review an I S S O needs.

## Slide 13 — Lab 1: two jobs, two clients; the Graph app

Next, check the reader's scopes against the workflow task. The workflow scope is missing and both read scopes are extra: the comparison fails in both directions, which is the point. Two jobs need two clients. Then the Graph app registration. Holding only the user read permission, it fails a drift run that reads the audit, because the audit permission is missing. With the required-only option, the same grant passes for a drift run that doesn't read the audit.

## Slide 14 — Lab 2: two API clients in a sandbox tenant

Lab 2 is in a SailPoint sandbox tenant, never production, and the authors haven't run it. Find the tenant's API base from its own O auth info page rather than guessing. Create the two API clients and compare each. Try the reader against the sandbox. If Search or Accounts refuses a client-credentials token, use a personal token for a dedicated user at the lowest level that works, and record which one. Find where the HR key lives on an identity. Then delete both clients and the output.

## Slide 15 — Dangers, and the guard for each

The dangers. A manage scope on a read client means a stolen token can change accounts, and the comparison flags it. The workflow scope left on a standing client lets anyone add workflows that call out of SailPoint, so it lives on a client used once. An administrator's personal token runs the kit as an org admin, so use a dedicated low-level user. Offset paging past ten thousand results stops silently, so the code uses search-after. The wrong Graph cloud is refused. And Graph signs in with a certificate first, not a secret.

## Slide 16 — Done when: the SailPoint and Graph checklist

Done looks like this. The SailPoint reader holds exactly its two read scopes. No standing client holds the workflow scope, and the workflow client is gone. Any personal token belongs to a dedicated user at the lowest level that works, recorded. The Graph app holds only what it reads, with a certificate. The API base came from the tenant itself. And the call-list test passes, including the no-write assertion. Next, Chapter 4 turns a SailPoint event into a typed task and sees the exact payload. Thanks for watching.
