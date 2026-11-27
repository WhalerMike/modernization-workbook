# Data Platform and SQL Server Identity learning path — Module 6: NTLM and the SPNs — narration script (practice copy)

## Slide 1 — Module 6: NTLM and the SPNs

Welcome to Module 6 of the Data Platform and SQL Server Identity learning path: NTLM and the SPNs. It goes with Runbook R oh six and Chapter 06 of the developer workbook, Building SQL Server Identity. You'll find every reason an instance's connections use NTLM or fail Kerberos, and write each S P N fix for review instead of running it. Take this module after Modules 5 and 2.

## Slide 2 — Why most NTLM is a missing or misplaced name

Why does this matter? You can't remove NTLM you haven't found, and most of what you find is a missing or misplaced name. Windows Authentication tries Kerberos first. When the client can't get a ticket for the instance's S P N, it uses NTLM. And when the S P N sits on the wrong account, authentication fails outright. In this module you list, per instance, every reason its connections use NTLM or fail Kerberos, with the set S P N line that would fix each S P N problem, ready for a change window.

## Slide 3 — What you'll be able to do in Module 6

Here's what you'll be able to do by the end of this module, which takes about fifty minutes with the lab. You'll name the patterns that make sequel server connections use NTLM, and the two S P N problems that fail instead of falling back. You'll explain why local connections are left out of the count. You'll run the kit's NTLM audit over fixtures on day 1 and day 30 and read its findings. And you'll read the fix file and say why nothing in it has run. Before you start, finish Module 5, and Module 2, whose audit snapshots this module reads. The lab runs in PowerShell 7, in the kit you unzipped into the F M W Labs folder.

## Slide 4 — What Microsoft gives you: the SPN states

Start with what Microsoft Learn gives you. The client builds an S P N for the instance. For T C P it's M S SQL S V C, slash, the fully qualified name, colon, the port, registered on the account the service runs under. Learn's table of S P N states is the triage key. When the S P N maps to the account the service runs under, local connections use NTLM and remote ones use Kerberos. When it maps to an incorrect account, authentication fails. And when the lookup fails, or there's no S P N, local and remote connections both use NTLM. Notice the first row: a connection made on the server itself always reports NTLM, even when Kerberos is set up correctly. So you judge only remote connections.

## Slide 5 — The patterns that generate NTLM at the SQL layer

Unit 2 is the patterns. The data platform book's chapter on NTLM names four patterns at the sequel layer. A missing or incorrect S P N. Cross-site connections that can't reach a domain controller. Linked-server passthrough. And clients that aren't domain-joined. Its triage point matters most: an S P N on the wrong account doesn't fall back to NTLM, it fails, and a duplicate S P N breaks Kerberos too. That shows up as an error, not as NTLM, so it gets triaged as a different problem. And a linked server that passes the caller's credentials needs Kerberos delegation, because NTLM can't make the second hop.

## Slide 6 — Discovery first: the NTLM audit and the fix file

Unit 3 is discovery first, and fixes for review. The data platform book's three phases of NTLM elimination start with discovery: the baseline that later phases measure against. The kit's NTLM audit joins the audit snapshot, the estate, the domain's M S SQL S V C S P Ns, the linked servers and the client records. It builds the expected T C P S P N for each instance and compares it with who holds it. For a virtual or built-in service account, it expects the S P N on the computer account. It writes each set S P N fix to a file for review, and never runs it. Runbook R oh six puts each change in a window, with its back-out. Two patterns aren't detected. Cross-site connections look like a missing S P N in this data, so confirm with K list before changing anything. And only the T C P form of the S P N is checked.

## Slide 7 — Dangers, and the guard against each

Chapter 06 of the workbook names the dangers, and the guard against each. Running the fix file as a script moves every S P N in it at once, outside review; the guard is one reviewed line at a time, in a window, with its back-out. For a virtual or built-in service account, the S P N belongs on the computer account, and moving it to the service account would break Kerberos, so the kit expects the computer account for those. Cross-site NTLM read as a missing S P N leads to an S P N that changes nothing; run K list get from the client's site before any fix. A linked server fixed with unconstrained delegation leaves the first server holding a reusable ticket for every caller; Runbook R oh six's options are Entra authentication, constrained delegation, or a mapped login as a documented exception. And because only the T C P S P N is checked, named pipes or short-name clients can still use NTLM, so check those forms by hand.

## Slide 8 — Try it: run the NTLM audit on day 1

Try it. Lab 1 runs in PowerShell 7 on the kit's fictional estate, with no tenant. Go to the kit's folder, and make this run's results folder, named for the time you start, in U T C, so every run keeps its own results. Step one runs the audit on day 1: seven findings on four instances. SQL P R D oh two is missing its S P N, so remote connections fall back to NTLM. On SQL F C I oh four, the S P N is held by an old account, not the one the service runs as, so authentication fails. On SQL P R D oh six, two accounts hold it, so Kerberos can't choose. Then there's remote NTLM, a linked server passing the caller's credentials, and a client off the domain. Look at SQL P R D oh one: its S P N is correct, yet forty-one sessions use NTLM. The client file shows that host is domain-joined, so look on the client side: aliases, hosts file entries, D N S and old drivers.

## Slide 9 — Try it: read the fix file

Step two reads the fix file: four lines for three instances, and nothing has run. The first line says so: review each line, and run it with Domain Admin rights in a change window. SQL P R D oh two gets its S P N added on its service account. On SQL F C I oh four, the S P N is deleted from the old account, then added to the one the service runs as. And on SQL P R D oh six, the S P N stays with the G M S A the service runs as, and leaves the computer account. That's the guard against a danger: a duplicate removed from the wrong account takes the S P N away from the service account, and Kerberos stops.

## Slide 10 — Try it: every fix, including those that aren't setspn

Step three reads every fix, including the ones that aren't set S P N lines. For remote NTLM, the fix is to find each client, from the client rows or the client address in the connections view; local sessions are excluded. For the linked-server passthrough on SQL P R D oh one, it's constrained delegation, a mapped login, or the sequel server twenty twenty-five managed-identity linked server. And for the client off the domain, it's moving Reports Readers to an Entra login with a token-based connection, which is the next module's subject.

## Slide 11 — Try it: run the audit on day 30

Step four runs the same audit on the day-30 snapshot. SQL P R D oh one's remote NTLM is gone: its logins moved to Entra in Chapter 04 of the workbook. But the S P N problems on the other instances are still there, because nobody ran the fixes. The audit finds; it doesn't repair. The linked-server and client findings come from the same fixture files on both days, so they're unchanged.

## Slide 12 — Try it: the manifest, the tests and your runs

Step five opens the manifest. It names the step, says the run was read-only, and lists the controls, I A two and C M six, with one K S I. Then the S H A two fifty-six of each file, the fix file included. That's the point: the fix file is hashed with the findings, so the lines a change board approves are the lines that run. Step six runs this chapter's tests: seven pass, none fail. And step seven lists your runs. There's nothing to clean up: the kit's folder is as you unzipped it, and each run's results stay in their own folder.

## Slide 13 — Lab 2: your test domain and test instance

Lab 2 runs the audit on your own test domain and test instance, never production. It was not run by the authors. You need PowerShell 7 on a domain-joined machine that isn't the sequel server host, because a connection made on the host itself always reports NTLM. Steps one to five only read: query the domain's S P Ns with set S P N, snapshot the instance, write the audit's other inputs, and run the audit. Step six is a change. Run the one reviewed fix only in an approved window, with its back-out line ready, then check the auth scheme and K list from a client. If the window's checks fail, the set S P N delete line restores the old state, and step seven deletes the lab's output folder.

## Slide 14 — The federal requirement and the evidence the ISSO keeps

The federal requirement. Chapter 06 of the workbook maps the audit and fix plan to C M six, Configuration Settings, in NIST SP 800-53, with the K S I S V C A C M. The evidence is the findings file and the fix file with the manifest, and the change record for each set S P N line that ran. It maps the same plan to I A two, Identification and Authentication for organizational users, which has no K S I pairing in the kit. Its evidence is the same findings, and the auth scheme and K list record from a remote client after each fix. Runbook R oh six lists the evidence for each remediation state. K S Is are FedRAMP twenty X indicators for cloud service providers; your providers report against them, the agency doesn't. The kit's records support these controls and provide evidence for them; the assessor decides whether each one is in place.

## Slide 15 — Check yourself: two questions on NTLM and SPNs

Check yourself with two questions. First: on SQL F C I oh four, the S P N is held by the old account, but the service runs as its own account. What happens to remote connections? The answer is b: authentication fails. An S P N on the wrong account fails rather than falls back to NTLM. Second: what has happened to the lines in the fix file when the audit finishes? The answer is b: nothing in the file has run. Each line is reviewed and run in a change window, with its back-out. The module page has two more questions, each linked to the section that answers it.

## Slide 16 — Summary: find the NTLM, review the fixes

To sum up. You found the missing, misplaced and duplicate S P Ns, the remote NTLM, the linked-server passthrough and the client off the domain in the fictional estate. And you saw that the S P N problems stay until someone runs the reviewed fixes. The fix file is hashed with the findings, so the lines a change board approves are the lines that run. The I S S O keeps the findings and the fix file with the manifest, the change record for each set S P N line that ran, and the auth scheme and K list record from a remote client after each fix. Before shipping, work through the Chapter 06 checklist. Next is Module 7, the application chain.
