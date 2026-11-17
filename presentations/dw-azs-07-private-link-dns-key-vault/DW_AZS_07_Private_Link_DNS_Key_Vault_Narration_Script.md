# Building Azure Security, Chapter 07 — Private Link, DNS and Key Vault — narration script (practice copy)

## Slide 1 — Chapter 07: Private Link, DNS and Key Vault

Welcome to Building Azure Security, Chapter 7: Private Link, DNS and Key Vault. A private endpoint is an address. Whether anything uses it is a DNS question, and whether the public path is closed is a third one. The code asks all three. We'll start from Microsoft Learn's Private Link commands for Key Vault, the zone group, the Cloud Adoption Framework's central-zone pattern and Learn's Key Vault recommendations, see what they leave to you, read the kit's check, and walk two labs, the evidence and the dangers. The chapter is a draft awaiting the owner's review, and the code is illustrative, tested against a fictional estate.

## Slide 2 — Why an endpoint is three questions, not one

Why three questions? Because a private endpoint that exists can still go unused if the name doesn't resolve to it, and can still be bypassed if the public path stays open. By the end of this chapter you can answer four things: whether every privatelink zone is central and linked to the hub, whether every private endpoint registers its record in a central zone, which resources still accept public traffic beside their endpoint, and which key vaults miss any part of the posture Microsoft Learn recommends. And you can compute the guide's vault-posture metric. It's for platform owners, who own the zones; workload owners, who own endpoints and vaults; and the developers who review both.

## Slide 3 — What Microsoft Learn gives you

Here's Microsoft's starting point. Learn's Key Vault Private Link page creates a vault on role-based access with purge protection, closes its firewall, creates the vault's privatelink zone and its link, and the private endpoint, then validates with nslookup. It also says name resolution is where private endpoints fail. A private DNS zone group registers the endpoint's record, and removes it with the endpoint. The Cloud Adoption Framework keeps privatelink zones central in the connectivity subscription and adds zone groups by policy. The zone group API returns each group's zone. And Learn's Key Vault recommendations: role-based access, not access policies; purge protection; private endpoints with public access disabled; and audit logging.

## Slide 4 — What it leaves to you

What does Learn leave to you? The commands make one zone, one link, one endpoint; in practice, zones still get created in workload subscriptions, and records split. A zone group per endpoint means an endpoint without one has no record anybody manages. "Turn public access off once the private path works" leaves room for the private path to work while the public one stays open. Key Vault's recommendations are read once, and a vault created next quarter misses one. And nslookup has to run from inside a network, which the kit can't do. So the kit checks the records' configuration every run, and Lab 2 runs nslookup.

## Slide 5 — Zones, endpoints and public access: six rules

Six rules cover the network side. A privatelink zone outside the connectivity subscription, or not linked to the hub, is a finding, as the Cloud Adoption Framework's central pattern asks. A private endpoint with no zone group, or one that registers in a zone outside the connectivity subscription, is a finding. A resource with a private endpoint and public network access still on is a finding. And a platform service that's public with no private endpoint at all is a warning, not a finding: the guide's private PaaS target is the agency's own, rising, and a Front Door origin locked by Chapter 5's checks may be public by design. Vaults go to the Key Vault rules.

## Slide 6 — Every vault, six checks

Then every vault gets six checks from Learn's Key Vault recommendations: role-based access, not access policies; purge protection; a firewall whose default is deny; public network access, which is a warning; an approved private endpoint; and audit events sent to the platform workspace. A vault has the full posture when it has role-based access, purge protection, an approved private endpoint and audit logs: the four parts of the guide's vault-posture metric. Key rotation policies are read through the vault's own data plane, which the kit doesn't call. Lab 2 reads one with the guide's command.

## Slide 7 — Who owns the zones, endpoints and vaults

Who's involved? The platform owner owns the central zones, their links to the hub, and the policy that adds zone groups. Workload owners own their endpoints and vaults, and close the public path once the private one works. And the application owner keeps each vault's posture, with the platform owner. Every read the check makes is Reader, and it never touches a vault's data plane: no secrets, no keys.

## Slide 8 — Lab 1: run the check, read each vault

Lab 1 needs PowerShell 7 with Pester, in the kit's folder, and no subscription. Contoso's vault zone is central and linked to the hub; the payroll team created its own blob zone in its workload subscription. Step 1 runs the check: one of three vaults has the full posture. Step 2 reads each vault. The payroll vault has everything. The hub certificates vault has no private endpoint, and its public access is on. And the portal vault misses every part: access policies, no purge protection, an open firewall, public access, no endpoint and no audit log.

## Slide 9 — Lab 1: endpoints and the findings

Step 3 reads each private endpoint and the zone it registers in. The vault's endpoint registers in the central vault zone. The blob endpoint registers in the payroll team's own zone. And the queue endpoint has no zone group at all: nothing registers its record. Step 4 reads the findings. The blob zone is in the payroll subscription and not linked to the hub; the blob endpoint registers there; the queue endpoint has no zone group; the storage account has two endpoints and public access still on. Then the vault findings, and warnings for public services with no endpoint. Step 5 runs this chapter's two tests.

## Slide 10 — Lab 2: a test vault, nslookup and the CLI

Lab 2 moves to a test subscription with a test vault behind a private endpoint and the central zone, and a test machine in a linked network, never production. Sign in, write the settings, and run the check live, allowing the unverified calls. Compare with the guide's Validate query, which reads the vault's role-based access, purge protection, firewall and public access, and read one key's rotation policy, which the kit doesn't. Then, from the test machine, look up the vault's name: the answer should come through the vault's privatelink zone with a private address. From outside, the same name resolves to the public frontend, which refuses the request. Back out by deleting the output and signing out.

## Slide 11 — Federal requirements and the evidence

Each output is evidence for something specific, from the guide's requirements table against NIST SP 800-53. Central zones linked to the hub, every endpoint registered there, and nothing public behind an endpoint support boundary protection and information flow enforcement. Public services without an endpoint, named, support boundary protection. And every vault on role-based access with purge protection, a private endpoint and audit logs supports cryptographic key management, protection of information at rest, and authenticator management. The kit's output supports these controls; the assessor decides. The key security indicators are FedRAMP's indicators for cloud providers, which the agency lines its own evidence up with.

## Slide 12 — Dangers, and the guard for each

What breaks in production? Zones in workload subscriptions split the records, so resolution fails or goes public; the kit flags them. An endpoint with no zone group has a record somebody made by hand, or none at all. The public path left open means the private endpoint works, and so does the internet; three rules catch it. Purge protection can't be turned off once it's on, which is the point, so the kit only ever asks for it on. And configuration isn't resolution: the records can exist while clients still resolve the public name, which is why Lab 2 runs nslookup from a linked machine.

## Slide 13 — Done when: the chapter's checklist

Here's what done looks like. Every privatelink zone is in the connectivity subscription and linked to the hub. Every private endpoint has a zone group in a central zone. No resource has an endpoint with public network access still on, unless a decision record says why. Every vault has the full posture, or a dated plan. And nslookup from a linked machine returned a private address. Next, Chapter 8: the policy that holds all of this in place, and the evidence that it did.
