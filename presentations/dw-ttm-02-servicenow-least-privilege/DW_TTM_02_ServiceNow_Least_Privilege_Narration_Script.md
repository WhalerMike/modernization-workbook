# Building Ticket-to-Machine, Chapter 02 — The ServiceNow Client and Least Privilege — narration script (practice copy)

## Slide 1 — Chapter 02: The ServiceNow Client and Least Privilege

Welcome back to Building Ticket-to-Machine. This is Chapter 2: the ServiceNow client and least privilege. An integration user with more roles than its calls need is a standing privilege nobody requested. So this chapter writes down every ServiceNow call the kit's Python clients make, the task that makes it and the least privilege it needs, and then makes the tests hold the code to that list. We'll see how the clients authenticate and page, the call list and its test, the three roles, two labs and the dangers.

## Slide 2 — Why write the calls down

Why write the calls down? Because privilege that nobody can trace back to a call tends to grow. The kit's read me listed the roles in prose, and nothing tied that list to the code. So a new call in a client would surface as an error on a live instance, and the quickest fix, granting a broader role, is exactly the wrong one. After this chapter, every call lives in one file with its task and least privilege, a test holds the code to it, and a tool compares a real grant with the list.

## Slide 3 — What exists: tokens, paging and retries

Here's what the clients already share. Configuration comes from the environment, and a settings file that carries a secret is refused. The token comes from a vault if one is set, otherwise from the OAuth client-credentials grant, and only on a developer instance from basic authentication. Paging reads a hundred rows a page through the Table API. And one wrapper retries throttling and unavailable responses, honoring Retry-After. The clients make three kinds of ServiceNow call: posting findings, closing them with evidence, and reading closed ones.

## Slide 4 — config/calls.json: the ServiceNow rows

This is the file the chapter adds: one row per call. Every task first gets a token from its own OAuth client and integration user. The drift push posts findings through the scripted REST resource, as the finding writer. The re-read task lists waiting findings, patches each one and uploads an evidence attachment, all as the verifier. And the evidence export reads the same table under its own role, the evidence reader, which can read but not change anything. Every row names the vendor page that justifies it.

## Slide 5 — Three custom roles, split by task

The roles are custom roles in the scoped application, and splitting them by task is the point. The finding writer can create findings and nothing else. The verifier can close them, which is why Chapter 5's business rule accepts a close only from that account. And the evidence reader, new in this workbook, can read a record but never change one it's about to hash. Why custom roles at all? ServiceNow says the caller needs roles that allow access to the table, and no single role allows adding attachments by default.

## Slide 6 — kit_calls.py and the test that holds the code

Two tools read that file. The first, kit calls, prints what a task needs on each system, and with the granted option it compares what an integration user actually holds against that need, exiting with a failure on anything missing or extra. Grants are typed or exported by the operator; it never touches the network. The second is the test that holds the code to the list: it runs every client against a fake HTTP session and checks each request, by method and whole path, against the rows for that task.

## Slide 7 — The tests: nine new, the originals unchanged

The chapter's own test file has nine tests: every client's requests matched to a declared row for its task, and the assertion that no task asks SailPoint or Graph for a write scope. The kit's original ServiceNow client tests still pass unchanged. Lab 1 runs seven of them: the base URLs, the order of OAuth before basic authentication, Retry-After read both as seconds and as a date, a throttled request retried, and every paging style.

## Slide 8 — The verified facts: token, Table and Attachment

The vendor facts behind the code, each read on November first. The token request is a post to the instance's OAuth token endpoint with the grant type, client ID and secret; a scope is optional. The Table API's read takes an encoded query, a field list, a limit that defaults to ten thousand, and an offset. The Attachment API needs the table, the record and a file name, and a content type header, and no single role allows adding attachments by default. And ServiceNow's Government Community Cloud is FedRAMP High.

## Slide 9 — What couldn't be verified on ServiceNow

Three points stay open. First, which inbound client-credentials setup applies depends on the release: Zurich documents a Machine Identity Console, and an older page documents a system property that's off by default. Second, the token's optional scope: ServiceNow's examples narrow incident reads and writes, but nothing found says a scope can narrow a custom table. And third, API access policies: whether an instance's policies add roles the kit doesn't list is still on the kit's verify list. Lab 2 is where you settle them.

## Slide 10 — What the call list proves, and for whom

What does this prove? That each integration user holds exactly the roles its calls need and the code calls nothing else, which is least privilege and account management, AC-6 and AC-2, in the Moderate baseline. Keep the comparison's output with the access approval. That the account that closes findings is separate from the ones that raise and read them, which is separation of duties, AC-5. And that any change to what the integration may call is reviewed, because it arrives as a new row in a pull request.

## Slide 11 — Who builds, who grants, who approves

Who does what? Developers build or change the ServiceNow side, and need to read Python. ServiceNow administrators create the integration users, their OAuth clients and the three roles. And the I S S O approves the access, with the comparison's output kept beside the approval. The rule for the users is simple: three separate users, each with its own OAuth client and exactly one custom role. None of them holds the broad I T I L or admin roles, and the evidence reader never borrows the verifier's.

## Slide 12 — Lab 1: every call declared, and what reread needs

Lab 1 runs on a laptop. Step one proves every call is declared: the nine tests pass. Step two lists what the re-read client needs on ServiceNow: a token from its own OAuth client, then a read of the finding table, a patch of one record, and an attachment upload. Every one of those maps to a single role, the verifier. That's the whole of what this account should hold.

## Slide 13 — Lab 1: catching a grant that's too wide

Now catch the mistakes. An administrator gave the verifier the I T I L role as well. The comparison finds nothing missing, one role extra, says least privilege doesn't hold, and exits with a failure. Then try the evidence export reusing the verifier's account. It would work, which is the trap: it would also be able to close findings. The tool reports the evidence reader role missing and the verifier role extra. Finally, the original ServiceNow client tests: seven pass.

## Slide 14 — Lab 2: three users, three roles, one instance

Lab 2 builds the split for real on your developer instance; the authors haven't run it. Create the three custom roles with exactly the grants on the slide. Create one integration user per role, each with its own OAuth client. Compare each user's roles with the tool, one task at a time. Then exercise them: get a token as the verifier and list findings, and try to patch a record as the evidence reader. That should be refused. Finally, delete the integrations, users and roles, and revoke any saved token.

## Slide 15 — Dangers, and the guard for each

The dangers are mostly about privilege creeping in sideways. A client gains a call nobody listed, and someone grants a broad role in production to make the error go away; the test stops that before release. One user for everything lets the evidence reader close findings; the split stops it. A broad role granted to make it work is caught as an extra. Basic authentication outside a developer instance puts a password in a pipeline. A secret in the config file is refused. And paging is tested, so no waiting finding is skipped.

## Slide 16 — Done when: the ServiceNow checklist

Here's what done looks like. Every ServiceNow call has a row and the test passes. Each integration user's roles match the tool's list exactly. The finding writer, the verifier and the evidence reader are separate users with separate OAuth clients. None holds a broad role. Basic authentication exists only on a developer instance, and tokens come from a vault or the client-credentials grant, never a file. Next, Chapter 3 adds the SailPoint and Graph rows and compares an API client's scopes the same way. Thanks for watching.
