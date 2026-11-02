# Building HR-Driven Identity, Chapter 02 — Contractor Sources and Enforced End Dates — narration script (practice copy)

## Slide 1 — Chapter 02: Contractor Sources and Enforced End Dates

Welcome back to Building HR-Driven Identity. This is Chapter 2: contractor sources and enforced end dates. A contractor's end date in a spreadsheet nobody updates keeps access alive. The end date the code computes, from every fact that can end an engagement, doesn't. So this chapter computes each contractor's earliest end, writes the records as an extract the HR middleware sends, reconciles the register, the card system and the directory without changing anything, and builds a sponsor review that removes access when no one responds.

## Slide 2 — Why contractors need their own code

Why do contractors need their own code? Because they aren't in the HR system's scope. They come from a register the agency owns, mapped into the same canonical record as employees. The guide ships the contractor leaver first: the middleware computes the earliest end and sends the leave date, and an inactive status, itself. This chapter is that computation and the checks around it. Which register to use is the governance body's decision; the code works with whichever one is named.

## Slide 3 — Which cloud, for these reads and writes

Which cloud? The records reach Entra ID through the contractor source's own provisioning app, through the same middleware employees use. Learn's feature availability page lists API-driven inbound provisioning as available in Azure Government, and access reviews too; GCC uses the commercial service. The bulk upload page itself has no national cloud table. The middleware accepts only the three Graph endpoints, and the reconciliation reads users from the cloud you name. There's no default.

## Slide 4 — What Microsoft gives you

Start with what Microsoft gives you. Learn's bulk upload page is the contract: a SCIM post to the provisioning job, at most fifty user operations a request and forty requests a second. The service matches on the attributes the job maps, resolves the manager, and disables the user when a record sends active false. A successful call returns accepted, with a header pointing to the provisioning logs. For recertification, an assignment policy's review settings carry reviewers, a schedule, and what happens when nobody responds.

## Slide 5 — What it leaves to you, and the kit adds

Here's what Learn leaves to you. It disables an account when told to, but not when an engagement has ended. It accepts any record, so refusing a contractor with no end or no sponsor is yours. Mapping the register into the canonical record, reconciling before anything changes, and writing the review settings as a reviewed body are yours too. Each row is pinned by a test. And the verdict: don't write a second SCIM client. The existing middleware already validates, batches, paces and records provenance.

## Slide 6 — The earliest end: the first condition wins

The heart of the chapter is the earliest end. For each register row, the extract computes every end condition that applies and takes the first: the contract end or an earlier completion date, suitability withdrawn, a card terminated, revoked or expired, a sponsor gone past the grace period, or a sponsor recertification that's due. The thirty-day grace period and the hundred-and-eighty-day cycle are design guidance the agency sets. A record past its end goes out inactive, and every record carries its end as the termination date, so the leaver fires that day.

## Slide 7 — The source checks and the reconciliation

Two sets of rules sit around that computation. The source checks quarantine a record with no contract end, or whose sponsor isn't in the HR export, warn when a sponsor has separated, and note an engagement ending within two weeks. The reconciliation compares the register, the card system and the directory: an enabled account past its end, an orphan account, a card for someone the register doesn't hold, a record with no account, and a leave date that isn't the earliest end. It's read only, joined on the person key.

## Slide 8 — One read, and the sponsor review as code

The reconciliation makes one Graph call: a filtered read of contractor users with their leave dates, needing two read permissions. Then the sponsor review. The review command writes the review settings for the contractor package's assignment policy: every six months, the requestor's manager as reviewer, a named fallback, and remove access on no response. So a missed recertification ends access, just as the earliest-end rule says. The code sends nothing. Learn's cmdlet takes the whole policy, so you merge the block into the policy you read back.

## Slide 9 — The tests: seven new, 57 in the kit

The chapter's tests are seven, in the writers-and-contractors test file. They check that the earliest end takes the first condition, that an expired card ends an engagement, that a record with no end or no sponsor is quarantined, that a duplicate person key is refused, that the extract matches the middleware's layout and marks past ends inactive, that the reconciliation finds every class, and that the review removes access when no one responds. All fifty-seven tests in the kit pass with no package, tenant or network.

## Slide 10 — The verified facts

The verified facts, each read on November first. Bulk upload is a version one point oh API: fifty operations a request, forty requests a second, and an accepted response pointing to the logs. Its least permission is the owned-by upload permission. The review settings and the access review procedure are both documented, and access reviews are available in Azure Government. The requestor manager subject set is documented for approval stages. And the policy update cmdlet needs the entitlement management read-write permission.

## Slide 11 — Where Learn differs or says nothing

Two places Learn's pages differ or say nothing. First, the requestor's manager as a reviewer: Learn documents that subject set for approvals, and the portal offers Manager as a reviewer, but no page shows it in review settings. Lab 2 confirms it. Second, bulk upload in the national clouds: the API page has no table, and the program reads the feature availability page as saying it's available there. And remember the code is illustrative: it runs on fictional data and doesn't prove a tenant maps the same attributes.

## Slide 12 — What the output proves, and for whom

What does the output prove? For account management and third-party personnel security, AC-2 and PS-7, the code gives every earliest end with its reason, and a reconciliation run before the contractor leaver ships and again after, with no enabled account past its end. Keep both output folders with their manifests. The worker type on every record supports identifier management. The register as one named source per fact supports the OMB memos, though the signed authority table isn't code. And the privacy office's determination covers the data flows.

## Slide 13 — Who builds, who owns, who runs it

Who does what? Developers build the contractor source's integration, and need to read Python, CSV and JSON. The owner of the contractor register signs the authority table, and the governance body names which register is the source. Identity engineers run the provisioning app, and the middleware's identity holds the upload permission on the contractor app only. The I S S O keeps the reconciliation folders and the provenance manifest, the privacy office covers the data flows, and every quarantined record has an owner.

## Slide 14 — Lab 1: the read, the extract, the decisions

Lab 1 runs on a laptop. Step one lists the reconciliation's one read and its two permissions. Step two computes the earliest ends: nine records, three active, four inactive past their earliest end, and two quarantined, with an exit code of two because the run has findings. Step three reads the decisions. One record has no contract end; another's sponsor isn't in the HR export. And one shows the rule at work: its card expired on October twenty-eighth, but its recertification was due three days earlier, which comes first.

## Slide 15 — Lab 1: the SCIM requests and the reconciliation

Step four hands the extract to the middleware, which builds seven records in one batch, four of them disables. Nothing is sent: the middleware's dry run is its default. Step five reconciles the register, the cards and the directory: seven findings and one warning. Four accounts are still enabled past their earliest end. There's an orphan account, a card for someone the source doesn't hold, a leave date that would fire the leaver on the wrong day, and a record with no account. Those four accounts are exactly the four disables.

## Slide 16 — Lab 1: the review settings and the tests

Step six writes the sponsor review settings for review, and sends nothing. The block removes access on no response, names the requestor's manager at level one as the primary reviewer, and recurs every six months. Step seven runs the whole kit's tests: fifty-seven pass. Then delete the output folder.

## Slide 17 — Lab 2: a test tenant

Lab 2 uses a test tenant; the authors haven't run it. Set up the contractor provisioning app, and grant the middleware the owned-by upload permission on that app only. Send two test contractors, one active and one past its end, and read the provisioning logs. Reconcile against the tenant: there should be no finding for the account you just disabled. Then apply the review settings by merging them into the policy you read back, and confirm the reviewer is the manager. Finally, restore the policy and clean up.

## Slide 18 — Dangers, and the guard for each

The dangers all come down to access outliving the reason for it. A trusted spreadsheet end date lets access outlive the engagement; the computed earliest end stops it. An open-ended contractor never leaves, so it's quarantined. A sponsor who left leaves nobody accountable, so access ends after the grace period. A missed recertification removes access. A drifted leave date is caught, and so is a card for someone nobody sponsors. And a second SCIM client means two writers, so everything goes through the one middleware.

## Slide 19 — Done when: the contractor checklist

Here's what done looks like. The contractor source is named and its owner signed the authority table. The rules file holds the agency's grace period and recertification cycle. The extract runs on the middleware's schedule, and quarantined records have an owner. The reconciliation ran before and after the contractor leaver shipped, with no account left enabled past its end. The review settings are confirmed by read-back, the upload permission is scoped to the contractor app, and the privacy office has signed off. Next, Chapter 3: joiner workflows as code. Thanks for watching.
