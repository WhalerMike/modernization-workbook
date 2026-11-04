# Building HR-Driven Identity, Chapter 01 — The Writer Register as Code — narration script (practice copy)

## Slide 1 — Chapter 01: The Writer Register as Code

Welcome to Building HR-Driven Identity. This is Chapter 1: the writer register as code. A rule that reads an attribute hands the decision to whoever can write it. The register names that writer, and the audit log says whether anyone else did. This chapter keeps the register's lifecycle rows as a reviewed file, checks its shape, and scans the directory audit log for every protected write that didn't come from the named writer or its backstop. We'll see what Microsoft Learn gives you, what it leaves to you, the register, the scan, two labs and the dangers.

## Slide 2 — Why this gate comes first

Why does this gate come first? Because every later gate leans on it. The guide's first step names one writer for every state and value. Without that, a late active value of true from the pipeline undoes a workflow's disable, and a help desk edit to an organization code moves a person's access without HR knowing. The HR-Driven Identity book explains the design. This chapter makes it checkable.

## Slide 3 — Which cloud, for this read

Which cloud matters for this read. The scan reads two Graph collections, the directory audits and the provisioning log, and both are listed for the global service and for both US Government levels. G C C uses the global Graph host; G C C High and level 5 have their own. The export script takes the cloud as an argument and has no default. And Entra keeps audit records for only thirty days with P1 or P2, so the export has to run on a schedule well inside that window, with the logs already flowing to the agency's own store.

## Slide 4 — What Microsoft Learn gives you

Start with Microsoft's procedure. Learn's list directory audits page gives the read, its least-privileged permission, audit log read all, and the filter operators. Its example shows the record: the activity name and time, the result, who initiated it, either an app with its service principal ID or a user, and the target with its modified properties. The audit activity reference names the six user activities this chapter watches, from add user to set user manager. What Learn doesn't give is a test of who may write what. There's no Microsoft sample for that.

## Slide 5 — What Learn leaves to you, and what the kit adds

Here's what Learn leaves to you, and what the kit adds. The log records every write and its initiator, but not which identity may write which value: that's the register. One enable activity covers two lifecycle rows, hire and cancellation, which must agree on one writer. Every change is logged, but testing each successful protected write is yours. So are the saved queries, least privilege per task, and evidence nobody edited. The verdict: use Learn's API as it is, and build the register and the test against it.

## Slide 6 — The register: one writer and a backstop per row

The register holds the guide's lifecycle rows. Each row names the audited activity, and for an update user record, the property it protects. It names one writer, an optional backstop, and for deletion, a list of writers that are forbidden. Writers are named groups of service principal IDs: inbound provisioning, Lifecycle Workflows, the card system's binding writer, and the interim directory sync. One caution: the property names aren't documented on Learn. They're the program's best reading, and Lab 2 confirms them.

## Slide 7 — The register checks: WR-01 to WR-09

The check reads the register's shape. The first rule flags a row without a single writer, or a row listed twice. Others flag a writer that isn't defined, or one with no identities, so its writes can't be attributed. A required account-state transition with no row is a finding. So is deletion by inbound provisioning, since the guide deletes through the post-separation workflow. A backstop can't be the writer itself, and rows for the same audited change must agree. An unsigned register and an unversioned scope filter are warnings.

## Slide 8 — The scan: every protected write, tested

The scan tests every protected write in the window against the register. A write by an identity that's neither the writer nor the backstop is a finding: that's the unauthorized write. A write by the backstop is a warning, because the writer should have acted first. And a write by a writer the row forbids is a finding. The scan reads only successful records inside the window, takes the first app or user as the initiator, and counts an enable record once, not against both the hire and the cancellation rows.

## Slide 9 — Two GET permissions, and what the scan can't see

The writers scan task needs two permissions, each the least-privileged for its call: audit log read all for the directory audits, and that plus directory read all for the provisioning log. Both are reads. And here's what the scan can't see. The Entra log records writes made in Entra I D. For synced users, the slots are mastered in Active Directory, and those writes show up only in A D change auditing. So the register names the sync agent as the interim writer, and the O U permissions are reviewed every quarter.

## Slide 10 — The tests: nine for this chapter, 57 in all

The tests hold all of this in place. Nine belong to this chapter: the shipped register is clean, the shape rules work, rows for one change agree, one enable counts once, second writers and the forbidden delete are found, and failures, unprotected changes and records outside the window are ignored. Ten more are shared: the call list, the cloud table, the output folder and the export that only reads. All fifty-seven tests in the kit pass under Python 3.10 or later, with no package, tenant or network.

## Slide 11 — The verified facts, and where Learn is silent

The verified facts, each read on November first. The directory audits list is version 1.0 and listed for both government levels, with the filter operators the saved queries use. The six user activities come from the Core Directory reference. Retention is thirty days, and it isn't retroactive. And two places Learn says nothing are recorded, so a later edit doesn't loosen the code: the display name each property gets in the modified properties, and the service principal each service writes as.

## Slide 12 — What the register and scan prove, and for whom

What does this prove, and for whom? The register's rows, version, signature and scope filter, checked by the nine register rules, support account management and identifier management, AC-2 and IA-4, at Moderate. The I S S O keeps the signed register and the check's output. The scan's findings support audit review, AU-6, for writes outside the named writer; keep the output folder with its manifest, the saved queries and the A D auditing settings, which this code doesn't read. And the privacy basis for the feed comes from the privacy office, not from code.

## Slide 13 — Who builds, who owns, who removes

Who does what? Developers build the HR lifecycle's checks; they need to read Python and JSON, and they don't need a tenant until Lab 2. The data architect owns the register. Identity engineers remove the other write paths, which is how every second-writer finding closes: by removing the write path, not by editing the value. And the I S S O keeps the signed register, the check's output, and the scan's output folder as evidence.

## Slide 14 — Lab 1: what the scan reads, and October's scan

Lab 1 runs on a laptop, in the H R lifecycle kit. Step one lists what the scan reads: two GET calls, with audit log read all and directory read all. Step two checks the register: no findings, no warnings. Step three scans October's audit records. It counts eleven protected writes: five by the writer, one by the backstop, four by a second writer and one forbidden. That's five findings and one warning, the exit code is two, and the manifest lists every file's hash.

## Slide 15 — Lab 1: the findings, a saved query, the tests

Step four reads the findings. A help desk administrator disabled a user at separation, and edited another's manager. Another account wrote a leave date. A fix-up script wrote an organization code. All four are second writers. Inbound provisioning deleted an account, which the register forbids. And Lifecycle Workflows, the backstop, enabled a new hire, so confirm the writer acted or was late. Three records aren't counted: an unprotected change, a failed disable and one outside the window. Step five reads a saved query, and step six: fifty-seven tests pass.

## Slide 16 — Lab 2: real records in a test tenant

Lab 2 uses a test tenant in the worldwide or G C C cloud, never production; the authors haven't run it. Register a reader app with a certificate and exactly the two read permissions. As a test administrator, change a user's hire date and disable another user. Export the window. Then confirm the property names against the real records, and correct any that differ in your copy of the register. Write the tenant's real service principal IDs into the copy and scan: both of your changes should appear as second writers. Then back it all out.

## Slide 17 — Dangers, and the guard for each

The dangers. Two writers of account state let a late active value undo a disable; one writer per row, agreement across rows, and the backstop warning guard it. A property name that doesn't match is the quiet one: the scan reports nothing for that value, and silence looks clean, so Lab 2 confirms every name first. Logs expire after thirty days, so export on a schedule. A D writes for synced users aren't in the Entra log. Deletion by the provisioning app is caught twice. And the findings name people, so keep them under access control.

## Slide 18 — Done when: the writer register checklist

Here's what done looks like. The register file matches the signed register, and the check reports nothing. Every writer group lists the tenant's real service principal IDs, and every property name was confirmed against a real record. The reader app holds exactly the two read permissions. The scan runs on a schedule inside the thirty days, into the evidence store. Every finding has an owner and closes by removing the write path. And A D change auditing covers every population still synced. Next, Chapter 2: contractor sources and enforced end dates. Thanks for watching.
