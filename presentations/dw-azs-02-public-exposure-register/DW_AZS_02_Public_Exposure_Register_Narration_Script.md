# Building Azure Security, Chapter 02 — The Public Exposure Register — narration script (practice copy)

## Slide 1 — Chapter 02: The Public Exposure Register

Welcome back to Building Azure Security, the Federal Modernization Workbook's developer workbook for the Azure Security Engineering guide. This is Chapter 2: the public exposure register. DDoS protection, the web application firewall and origin lock-down can't be proved complete without a list of what is exposed. So the list is code, it runs every week, and it notices what is new. We'll start from the guide's Resource Graph queries, built from Microsoft Learn's starter sample, see what they leave to you, read the register and its rules, then walk two labs a week apart. The chapter is a draft, and the code is illustrative.

## Slide 2 — Why the exposure list comes before the controls

Why a register first? Because the later steps can't be proved complete without it. By the end of this chapter you can build the register the guide's Step 2 asks for: one row per exposure with its resource, type, public name, owner, DDoS state, and its WAF and mode, regenerated every week. Every ownerless row is flagged, every new exposure since last week reported, every one that went away reported with a reminder to remove its DNS record, and every resource Defender for Cloud calls internet-exposed that the register lacks. It's for platform owners, workload owners and the developers who keep the queries current. And the register is a map of the attack surface: it stays inside the boundary.

## Slide 3 — What the guide's Learn queries give you

Here's the starting point. The guide builds four Resource Graph queries from Microsoft Learn's starter sample that lists every public IP: public IPs with their DDoS mode, the resource they're attached to and an owner tag; Front Door profiles; application gateways with their WAF policy; and every resource whose public network access isn't disabled. Learn recommends an inventory of every public IP and its protection, kept with Resource Graph, and a quarterly review of which IPs still need protection. And Learn's cost guidance adds that fewer public IPs means less to protect.

## Slide 4 — What four queries leave to you

What do four queries leave to you? Four lists aren't a register, so the kit joins them into one with eleven columns. A public IP's attachment is an IP configuration ID, so the kit finds the gateway behind it and that gateway's WAF and mode. A Front Door profile's public names are its custom domains and its WAF lives in a security policy, so both are read per profile. Classic Front Door is public too, and retires on March 31, 2027, so it's in the register. Nothing compares with last week, so the kit reports new and gone rows. And Defender for Cloud's view is reconciled, not eyeballed. A test pins each answer.

## Slide 5 — The register's columns, and its five rules

Here's what the register holds. The public name is a public IP's DNS name and address, a Front Door profile's custom domains, or an application gateway's public IP. The owner is the owner tag. The DDoS column is the IP's protection mode, or "Front Door edge", because Learn says Front Door's edge has built-in layer three and four protection. And the WAF columns name the policy and its mode. Five rules read it: a row without an owner is a finding; a public IP attached to nothing is a warning; a new row since last week is information; a row that went away is a warning to check its DNS records; and an exposure Defender reports that the register lacks is a gap in the queries.

## Slide 6 — Who runs the register, and who answers for it

Who's involved? The platform owner runs the register every week, keeps it inside the boundary, and reviews it each quarter with the security officer. Workload owners answer for their own rows: every row needs an owner tag, and every finding a ticket. The security officer reconciles the register with Defender for Cloud at that quarterly review. The kit's reads need only Reader on the intermediate root. Nothing in this chapter writes.

## Slide 7 — Lab 1: build the first week's register

Lab 1 needs PowerShell 7 with Pester, in the kit's folder. The fixture estate is read twice, a week apart, and a small file stands in for Defender for Cloud's export. Step 1 builds the first week's register: nineteen exposures, eight public IPs, three Front Door profiles, two application gateways and six PaaS resources, sixteen with an owner. Step 2 reads it. The application gateway's public IP carries the gateway's WAF policy. The careers Front Door profile has no WAF, the legacy profile is classic, and three rows have no owner.

## Slide 8 — Lab 1: findings now, and a week later

Step 3 reads the findings: three exposures with no owner, a public IP attached to nothing, and one resource Defender reports that no query finds. It's a container group with a public address that isn't a public IP resource, so it's a gap in the queries. Step 4 builds the register again a week later, against the first one, and step 5 reads what changed. One public IP is new, and has no owner. The orphan is gone, with the reminder to remove any DNS record that still points at its address. Step 6 runs the chapter's tests.

## Slide 9 — Lab 2: a test subscription

Lab 2 moves to a test subscription in a test tenant, never production. Sign in to commercial Azure, write the settings file, and build the register live with Defender for Cloud's export. The classic Front Door, gateway and WAF queries aren't verified on Learn yet, so allow them and check their rows in the portal. Then run the guide's own test: create a public IP and build the register again. It should appear as new, and as attached to nothing; Resource Graph can take a few minutes to show it. Back out by deleting the public IP and the output, and sign out. The authors haven't run this lab.

## Slide 10 — Federal requirements and the register

Each output is evidence for something specific, from the guide's requirements table. The register itself, every exposure with its owner, supports NIST's system component inventory and boundary protection controls, and aligns to a FedRAMP cloud-native architecture indicator. Ownerless and unattached exposures, what changed since last week, and the reconciliation with Defender for Cloud support the same inventory control. The kit's output supports those controls; the assessor decides, and the agency lines its own evidence up with FedRAMP's indicators rather than reporting them.

## Slide 11 — Dangers, and the guard for each

What breaks, and what guards against it? Published in a public repository, the register is a map of the attack surface, so the check prints a warning every run and the runbook's preflight refuses an output folder inside the kit's repository. Some public addresses aren't public IP resources, so the queries can't see them; Defender for Cloud's export closes that gap. A DNS record left pointing at a released address can be taken over, so every exposure that goes away is named. And an owner tag nobody checks names a team that may no longer exist, which is what the quarterly review is for.

## Slide 12 — Done when: the register's checklist

Here's what done looks like. The register runs every week, and every ownerless row has a ticket with an owner. Every exposure that went away had its DNS records checked and removed. Defender for Cloud's export was reconciled, and every gap is either added to the queries or explained. And the register and its run folders live inside the boundary. Next, Chapter 3 traces each public IP in this register to its DDoS protection.
