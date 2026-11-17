# Building Global Secure Access, Chapter 01 — Decision, Licensing and GCC Availability — narration script (practice copy)

## Slide 1 — Chapter 01: Decision, Licensing and GCC Availability

Welcome to the Federal Modernization Workbook's developer workbook, Building Global Secure Access. This is Chapter 1: the decision, licensing, and availability in GCC. A network control is adopted by a written decision with exit criteria, not by turning on a toggle, so the first code reads what the tenant holds and checks the decision against it. We'll start from what Microsoft Learn says, see what it leaves to you, read the kit's call list, its availability table and nine checks, and walk two labs. One note before we begin: this chapter is a draft awaiting review, and the code is illustrative, tested against fixtures.

## Slide 2 — Why the decision comes first

Why start with a decision? Because each function of Global Secure Access has its own gate: the Microsoft traffic profile comes with Entra ID P1, while Internet Access and Private Access are licensed separately. So the goal is concrete. By the end you can read the tenant's licenses and onboarding state with the least-privileged permissions, keep one decision record for each of the four functions, and show an assessor that each record is current, licensed, approved, and honest about what GCC does and doesn't state. It's for the developers, the policy owner who signs the records, and the security officer who keeps them.

## Slide 3 — What Microsoft Learn gives you

Here's Microsoft's starting point. Learn's known limitations page says Global Secure Access is available in GCC, for the product as a whole; no feature page narrows or widens that, so a preview feature's GCC availability is not yet specified. Learn names the licenses: the Microsoft traffic profile with Entra ID P1 or P2, and Internet Access and Private Access separately, or through the Entra Suite. Two Graph reads tell you what the tenant holds: the subscribed SKUs, with License Assignment Read All, and the tenant status on the beta endpoint, with Network Access Policy Read All. Both live on the global service, which GCC uses.

## Slide 4 — What it leaves to you, and the verdict

What does Learn leave to you? One GCC sentence covers the whole product, so nothing says anything per feature, and preview features are silent. License names come without service plan identifiers, so a script can't match a license by ID. The onboarding read is beta, and beta APIs are subject to change. And nothing covers the decision itself. So the kit adds an availability table, one row per feature with an interim path where GCC isn't stated; a decision record that names the SKU the agency reads from its own export; and nine checks. The verdict: keep Learn's statements as they are, and build what it leaves.

## Slide 5 — GCC: the features Learn doesn't state

This is where GCC matters. Because Learn's sentence covers the product, every preview feature's GCC availability is not yet specified, and the kit's table lists them with the guide's interim path. Registered devices: use joined or hybrid joined devices. The cloud firewall for clients: block QUIC with an Intune-delivered Windows Firewall rule. The Explicit Forward Proxy: acquire with the client only. HTTP method filtering: filter by category and name. Custom Private Access profiles: per-app applications. Enriched log categories: not exported without a decision. A decision that uses one without an approved exception fails, and the finding says what to do instead.

## Slide 6 — The nine decision checks

Here are the nine checks Test-Gsa-Decision runs on the collection and the records. The tenant is onboarded. There's one record for each of the four functions. Each availability quote was read on Learn within thirty days. An adopted function has enough licenses for the pilot and the first ring. Each record has an approver, exit criteria and a review date within a year. A deferred or retained function names what protects it meanwhile. And any preview feature has an approved exception, or the finding names the interim path. The checks only read files; the policy owner still signs.

## Slide 7 — Who signs, who reads, with what

Who is involved? The policy owner signs each decision record and approves any exception. Developers build and maintain the kit. The security officer keeps the records, the license export and the run folders. And the reader holds very little: License Assignment Read All for the licenses, on version 1.0, and Network Access Policy Read All for the tenant status, on beta, delegated only. Global Reader is enough for both. One difference worth knowing: the guide's step connects with Organization Read All, a higher permission Learn also lists; the kit asks for the least-privileged one, and the research gaps record it.

## Slide 8 — Lab 1: the reads, and the unstated features

Lab 1 needs only PowerShell 7 with Pester, in the kit's folder, against one fictional tenant, contoso dot example, seen during its pilot and two weeks later. No tenant at all. Step 1 lists what the decision area reads: two calls, each with its least-privileged permission, one of them beta, both verified against their Learn pages. Step 2 lists the features whose GCC availability Learn doesn't state, each with the interim path the kit expects instead. The first rows are on the slide; the chapter shows them all.

## Slide 9 — Lab 1: four failures in the pilot's records

Step 3 reads the pilot tenant's licenses and onboarding state. Step 4 checks the four decision records, and finds four failures. The internet decision's availability quote is forty-six days old. Its SKU has twenty-five units for sixty users. It uses the cloud firewall for clients, a preview feature, with no exception. And the branch decision defers remote networks without naming what protects branches meanwhile. Step 5 reads the preview finding in full. Look at the fix: it isn't "enable the preview". It's the guide's interim path, a Windows Firewall rule delivered by Intune.

## Slide 10 — Lab 1: two weeks later, every check passes

Step 6 checks the same records two weeks later. The internet record was re-read on Learn and drops the preview feature, its SKU now has seventy-five units, and the branch record names its compensating controls: branch traffic stays on the current TIC path, and managed devices at branches keep the client. Every check passes. Step 7 runs this chapter's tests: thirteen passed, none failed. Then delete the output folder.

## Slide 11 — Lab 2: a test tenant

Lab 2 moves to a test tenant, never production, and a tenant with no Global Secure Access licenses is a valid result. Sign in as a person with the two least-privileged permissions. Run the guide's own reads as a cross-check. Then collect and check with the kit, using your own decision records, kept on agency storage and never in this repository. The kit's license counts should match the guide's. If the tenant isn't onboarded, onboard it before any later chapter. The lab only reads, so backing it out is signing out and filing or deleting the outputs. The authors haven't run this lab.

## Slide 12 — Federal requirements, dangers, done

What does the output prove? The license and onboarding reads, hashed, and the decision records support the system security plan and the control on external system services; the decision supports information exchange too. The guide maps no key security indicator to a decision record, and the kit doesn't invent one. The records support these controls; the assessor decides them. The dangers: adopting a preview because the product is in GCC, a stale availability quote, and beta reads in an unattended job, each with its guard. You're done when every function has a current, signed record, and no preview runs without its exception. Next, Chapter 2: the configuration export, and logs first.
