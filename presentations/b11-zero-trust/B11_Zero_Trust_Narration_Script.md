# Book 11 — Zero Trust & Assessment — narration script (practice copy)

## Slide 1 — Why Is Zero Trust a Whole-Agency Property, Not a Product?

This briefing comes from Book 11 of the Federal Modernization Workbook, Zero Trust and Assessment: how an agency measures its Zero Trust posture across every estate it runs, and turns what the tools find into a program.

I'll take four questions: why Zero Trust is a whole-agency property, what the mandates and tools actually cover, who owns the posture, and how to assess it.

The short version: unify first, assess second, and treat every tool as evidence, never as the verdict.

## Slide 2 — Three reports stapled together are not one score

Why is Zero Trust a whole-agency property? Look at the usual assessment calendar. The network team reviews the boundary, keyed by address. The cloud team runs each provider's posture scan, keyed by resource tags. The virtualization team works a hypervisor checklist, keyed by whatever the management plane calls a machine. At year end someone puts the three reports behind one cover page and calls it the agency's maturity. It's three partial assessments with one title.

The failure is architectural. A database server that runs as a virtual machine, sits on an agency subnet and backs up to a cloud bucket can appear as three unrelated objects, scored by three tools. A total across them counts objects, not architecture.

The guidance describes the enterprise, not a tenant. Executive Order 14028 says throughout all aspects of the infrastructure, and NIST SP 800-207 grants no implicit trust from network location or ownership. So unify first, then assess, and defend the unified plane, because it becomes a complete map of the attack surface.

## Slide 3 — Evidence, not verdicts: failures beneath any one tool

Two documented incidents show why the whole-agency view is a security property, not a reporting preference. In May and June 2023, an actor used a Microsoft consumer signing key to forge tokens and read Exchange Online mail. The Cyber Safety Review Board counted 22 enterprise organizations and 503 related personal accounts, with access to some mailboxes for at least six weeks. The tokens were valid to every system that checked them. What caught the intrusion was a custom alert one federal department had built on mailbox logs it paid for.

The second sits beneath the guest. ESXiArgs compromised more than 3,800 ESXi servers in February 2023. In 2024, CVE-2024-37085 gave full hypervisor control to members of a directory group named ESX Admins, matched by name.

Even one vendor's two tools don't add up. ScubaGear is CISA's, the Zero Trust Assessment is Microsoft's, and neither sees past Microsoft's platform. Tools are evidence inputs. The agency owns the verdict.

## Slide 4 — Five governance principles, none of them a purchase

Chapter 02 explains why programs stall at Initial or low Advanced. They read CISA's maturity model as a five-pillar shopping list. But the model runs those pillars through three cross-cutting capabilities, and the one programs fund least is Governance, which the model defines as the definition and enforcement of policy within and across pillars. Its Traditional stage reads like the failure list: siloed pillars of policy enforcement, and limited correlation of logs and telemetry.

Five principles answer it. Identity is the anchor, but it isn't self-authenticating, so sessions are re-evaluated and the identity plane is defended. Privileged identity gets controls of its own: Microsoft's guidance is zero permanently active assignments other than emergency accounts, which are tested at least every 90 days. Evidence must be reproducible, machine-readable and regenerable. Governance enforces: a policy that only produces next quarter's finding is a report. And the cloud boundary is modeled, with each government-cloud feature gap recorded as a governed finding.

## Slide 5 — Only one Zero Trust document sets requirements

What do the mandates actually require? Four documents get cited as if they were one. Executive Order 14028 is binding, and required each agency to develop a plan to implement Zero Trust Architecture. OMB M-22-09 is binding and sets specific actions by pillar: phishing-resistant MFA for staff, contractors and partners, reliable device inventories through CDM, encrypted DNS and HTTPS, and an environmental isolation plan. CISA's Zero Trust Maturity Model, version 2.0, is guidance. It says it should not be viewed as a strict set of requirements but as a general guide, and CISA's page for it is now marked archived, with no later version. NIST SP 800-207 supplies the architecture.

M-22-09's FY 2024 deadlines have passed, but OMB hasn't rescinded it, and a passed deadline doesn't retire an action. One adjustment: its logging action pointed to M-21-31, which M-26-14 rescinded on May 22, 2026.

And no federal document defines a Zero Trust score, or requires a maturity stage.

## Slide 6 — BOD 25-01: six actions and 50 required policies

BOD 25-01 is narrower and more concrete. CISA issued it on December 17, 2024, for every production cloud tenant with a finalized SCuBA baseline. It has six required actions: inventory the tenants by February 21, 2025; deploy the SCuBA tools and report by April 25; implement the mandatory policies by June 20; keep up with updates; baseline every new tenant before its ATO; and explain deviations with each report.

The mandatory list is a subset of the baselines. For Microsoft 365, CISA's Required Configurations page lists 50 policies; in Entra ID, that's 20 of the 30 in ScubaGear's baseline. Google Workspace is now in scope too, with its policies due December 1, 2026. CISA's guidance limits scope to software as a service, so Azure subscriptions are out even when they share the tenant, and on-premises Active Directory is untouched.

Inventory, deployment and explanations take days. Implementing the policies is architecture, and that's what the directive exists for.

## Slide 7 — Two assessment tools answer two different questions

Agencies run two free, read-only assessments of their Microsoft cloud, and often drop one because it covers identity. They answer different questions. ScubaGear is CISA's tool, and asks whether the tenant meets the federal baseline. Version 1.8.0 shipped May 7, 2026, with 2.0.0 in preview. Microsoft's Zero Trust Assessment asks how mature the environment is against Microsoft's guidance. Release 3.1.0 shipped October 20, 2026, with 364 tests. It's a community project maintained by Microsoft employees, not an official product, and no Microsoft support program covers it.

They overlap on Entra ID identity and, in 3.1.0, on Defender threat policies. Only ScubaGear covers Exchange Online, Teams, SharePoint and Power Platform, and 22 of the 50 mandatory policies sit in those four products. Dropping ScubaGear leaves mandatory policies unassessed and stops the reporting the directive requires.

So run both, and reconcile at the control level: the tenant setting and the SP 800-53 control it supports.

## Slide 8 — Beyond Microsoft 365: networks, clouds, hypervisors

Everything so far stops at the edge of Microsoft 365. Nothing on BOD 25-01's list covers infrastructure accounts, the agency network or the virtualized estate. So the whole-agency argument rests on the Zero Trust documents, and on the SP 800-53 controls every system security plan asserts.

Three things get reconciled before assessing. One inventory: CM-8 forbids duplicate accounting of components, and BOD 23-01 requires asset discovery every 7 days. One naming authority, because each cloud provider and VMware ships its own private DNS. And no implicit trust from any boundary: a site-to-site VPN, a default virtual network and a flat virtualized segment are the same mistake.

The hypervisor is a distinct threat class, so its management plane is assessed as its own surface, not inferred from its guests.

And every provider's tool answers for its own platform. AWS says its NIST standard supports a subset of requirements. Microsoft calls Azure Policy compliance only a partial view. FedRAMP certifies the service; the agency authorizes its own use of it.

## Slide 9 — Who owns the posture, not just the pillars

Who owns it? Every pillar already has an owner. What most agencies lack is an owner for the posture itself. M-22-09 required each agency to designate a zero trust strategy implementation lead within 30 days, and many will give this role to that person.

The program lead owns the definition of the whole-agency score, what it covers and what it excludes, plus cross-pillar correlation and the assessment calendar. The lead decides priority but doesn't accept risk, and shouldn't also own the agency's relationship with its largest cloud vendor.

The CIO decides scope and sequence. The CISO sets the evidence standard and approves the tools and the accounts that run them. The authorizing official accepts residual risk and approves each plan of action and milestones.

Exceptions split on time. An omission with an expiration date is a CISO decision; one with no end date is a standing risk acceptance for the authorizing official. Pillar owners decide how to fix a finding, never that it doesn't need fixing.

## Slide 10 — Close before you assess: assessors run at step five

How do you get there? First, close before you assess. Agencies met BOD 25-01's early dates: tenants inventoried, ScubaGear deployed and reporting. Many now treat that as the answer. But ScubaGear measures deviation from a baseline; it doesn't close any, and neither does the Zero Trust Assessment. A thermometer that reports a fever every day isn't a treatment plan.

So the program's six-phase sequence puts the assessors at step five, as confirmation rather than discovery: understand, design, implement, govern, then validate, and then the authorizing official decides. That's the Risk Management Framework's own order: implement, assess, authorize, monitor.

Before validating, build the layers a finding depends on: naming and certificates, device and workload identity, a phased retirement of legacy authentication, and governed exceptions.

Meanwhile, route every current finding to exactly one response: a configuration change now, architectural work with an owner and a date, or a risk acceptance by the authorizing official. A finding with no response is the only failure.

## Slide 11 — Run the assessment: pin it, record it, never edit it

Then run the assessment and keep the evidence. Five things are decided before either tool touches a production tenant. Scope comes from the BOD 25-01 tenant inventory. The host is a dedicated Windows machine inside the authorization boundary, a separate one for each tool, because their dependencies conflict. Each tool gets a reader account, with consent granted once, separately. Output is handled as controlled data. And the assessment accounts belong in the M-26-14 Agency Logging Plan, due 90 days after CISA's August 20 reference architecture.

ScubaGear runs in Windows PowerShell 5.1. Its configuration file is the exception record: annotations, omissions with a rationale and an expiration date, and exclusions for emergency accounts. It's versioned in the repository, and its hash is recorded with every run, like the tool version. The results file is never renamed or edited, only hashed and copied.

The Zero Trust Assessment needs PowerShell 7 and can take more than 24 hours. And install the program's toolkit only from its own repository: a package named fmp on the public Python index is unrelated.

## Slide 12 — Ingest the evidence: four stages to OSCAL

Most agencies run ScubaGear, save the HTML report, and reopen it when an assessor asks. The program instead treats each tool as an adapter, one input to one evidence chain, and leaves the tools exactly as their publishers ship them.

Each run flows through four stages. The tool writes its own unaltered output. Each result becomes a claim in a provenance envelope: who issued it, when it was extracted, and a lineage hash. Claims from one interval are assembled into a sealed bundle. And the bundle emits OSCAL assessment results and plan of action and milestones items.

Take MS.AAD.1.1v1, legacy authentication shall be blocked, which CISA maps to CM-7. Say it fails. The claim's lineage hash ties it to the raw result, and the bundle opens a POA&M item. Months later an assessor can rebuild the bundle, check its hash, and walk back to the raw output without re-running the tool.

The limits are stated. ScubaGear runs on an interval, not continuously. And there's no ScubaGoggles adapter yet, so Google Workspace is a gap.

## Slide 13 — From findings to a program the AO can see

Last, turn findings into a program. Read each result before counting it. Only ScubaGear's Fail and Warning, and the Zero Trust Assessment's Failed and Investigate, are findings. A skipped check isn't a gap and isn't a pass. It's absence of evidence, recorded with the reason, which is often a license or a government-cloud feature that isn't available in the boundary.

The program scores findings with a documented method: severity from 0 to 100, priority as severity divided by effort, and buckets from P1 at 50 or above down to P4. Quick wins go into the next change window; major projects go onto a pillar owner's roadmap. Both tools' findings are reconciled against the same SP 800-53 control, so two pieces of evidence become one finding for one owner.

Anything not fixed and not excepted becomes a plan of action and milestones item, which the authorizing official approves. Drift between intervals goes to the authorizing official too, not only to security operations. And re-run after every remediation wave, so a finding is closed by evidence, not by a ticket status.

## Slide 14 — Decisions to make, and next steps

So, four decisions.

Name an agency-level owner of the Zero Trust posture, separate from every cloud provider relationship.

Reconcile the network, every cloud and the virtualization estate to one authoritative record before scoring any of them.

Close the BOD 25-01 mandatory findings before measuring maturity, with Google Workspace due December 1, 2026.

And move every exception into the versioned configuration file, with an expiration, and route each standing one to the authorizing official.

The next step needs no procurement. Find out, pillar by pillar, which evidence can be re-run without the operator's help, because every no is the adoption boundary. And put the assessment hosts and accounts in the Agency Logging Plan now.

Unify first, assess second, and let named people make the decisions the evidence supports. The Federal Modernization Workbook's Book 11 has the detail, every claim footnoted. Thank you.
