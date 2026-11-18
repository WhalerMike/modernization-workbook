# Building Global Secure Access, Chapter 07 — Internet Access, QUIC and TLS Inspection — narration script (practice copy)

## Slide 1 — Chapter 07: Internet Access, QUIC and TLS Inspection

Welcome back to Building Global Secure Access. This is Chapter 7: Internet Access, QUIC, and TLS inspection. Filtering the web by identity is the easy part. The hard parts are the bypasses that never expire, the protocol the service doesn't carry, and a certificate authority that could impersonate every site. The code watches all three. This is also the chapter where GCC availability bites. The chapter has been reviewed and approved, and the code is illustrative, tested against fixtures.

## Slide 2 — Why bypasses, QUIC and the CA

Why these three? A bypass with no end date is a permanent hole in the filter. QUIC isn't forwarded end to end, so a browser could carry web traffic around the service. And a TLS inspection certificate authority that's compromised could impersonate any site to every managed device. So the goal: show that the ring's web traffic is filtered by an identity-aware policy, that every exception has an owner and an end date, that QUIC can't slip past it, and that inspection runs from a dedicated authority, within an approved privacy scope, breaking under one percent of sessions.

## Slide 3 — What Microsoft Learn gives you

Learn's Internet Access tutorial creates a filtering policy, a security profile, the link between them, and a Conditional Access policy that assigns the profile. Its limits are generous, but Internet Access doesn't forward QUIC end to end. Learn's newer pages block QUIC with a cloud firewall rule, which is preview; its TLS page uses Windows Firewall instead. Learn asks for an expiration or review date on allow-list entries. The agency's inspection intermediate needs specific extensions and at least six months' validity, only one is active, and renewal starts ninety days ahead. Learn suggests a dedicated authority, not the production PKI, and Microsoft treats failures above one percent as systemic.

## Slide 4 — GCC: QUIC through the interim path

Here's where GCC bites. In the guide's table, web filtering, threat intelligence and TLS inspection rest on Learn's product-wide GCC sentence. But the cloud firewall for clients, the Explicit Forward Proxy and HTTP method filtering are previews whose GCC availability isn't stated. So the kit doesn't assume them. For QUIC, it expects the guide's interim path: an Intune-delivered Windows Firewall rule blocking outbound UDP 443, piloted first and recorded in the architecture record. The QUIC check passes only when that block is recorded, and a decision that leans on the preview fails Chapter 1's check.

## Slide 5 — Twelve checks: six for filtering, six for TLS

Twelve checks. For filtering: each Internet Access policy links an existing profile and excludes emergency access; the acceptable-use categories and threat intelligence are blocked; every bypass is owned, approved and unexpired; QUIC is blocked by the interim path; and the tenant is inside Learn's limits. For TLS: more than ninety days left on a certificate issued for at least six months; an issuer that isn't an authentication authority; never the baseline profile before ring 3; the privacy approval and user notice recorded; every custom bypass registered; and failures under one percent. One note: no Graph read for TLS inspection was verified, so its record comes from the portal.

## Slide 6 — Who approves categories, bypasses, privacy

Who's involved? The policy owner approves categories and every bypass, and reviews bypasses each quarter. The privacy officer approves the inspection scope before it starts. The PKI team runs the dedicated issuing authority. The platform owner applies the changes and renews the certificate ninety days ahead. And the security monitor watches the failure rate and the top blocked destinations. For permissions: Network Access read and write for the profiles and policies, Policy Read Write Conditional Access for the Internet Access policy, and two administrator roles activated just for the lab.

## Slide 7 — Lab 1: two bypasses fail

Lab 1, after listing the reads, reading the GCC rows for Step 5, and collecting the pilot. Step 4 runs the Internet Access checks. The profile, the categories, threat intelligence, the QUIC interim block and the limits all pass. Two bypasses fail: E X 3 expired on November first, and E X 4 has no approver. Step 5 reads the bypass rows of the exception register, the agency's own record: target, reason, owner, approver and expiry.

## Slide 8 — Lab 1: TLS — a certificate near expiry

Step 6 runs the TLS checks. Three fail. The certificate has seventy-four days left, inside the ninety-day renewal window, and it was issued for only ninety days, short of Learn's six months. The pinned payroll site's bypass is E X 3, which expired. And one and a half percent of sessions failed, above the one percent threshold. Three pass: the issuer is a dedicated inspection authority, not the authentication one; the policy is linked only to the pilot's profile; and the privacy approval and the user notice came before inspection started.

## Slide 9 — Lab 1: two weeks later, thirteen pass

Step 7 checks both areas two weeks later, after the certificate was rolled, the bypasses renewed and approved, and the failing destinations bypassed. The certificate has a hundred and eighty days left on two hundred and ten. Both bypasses have an approver and a future date. The failure share is half a percent. All thirteen checks pass. Step 8 runs this chapter's tests: six passed, none failed. Then delete the output folder.

## Slide 10 — Lab 2: a pilot security profile and QUIC

Lab 2 uses a test tenant with Internet Access licenses, the Internet profile on for a pilot group, and a test device with the client. It doesn't enable TLS inspection, which needs a dedicated test authority and the privacy officer's scope. Create the filtering policy and the pilot profile with the guide's requests. Plan and apply the Internet Access policy, on for the pilot group only, as the guide does, because Learn doesn't say whether report-only applies a profile. Block QUIC on the device with Learn's firewall command. Then browse to a blocked category and expect the block page. Back out newest first. The authors haven't run this lab.

## Slide 11 — Requirements, dangers, done

Identity-aware filtering supports boundary protection, deny by default, and malicious code protection. Governed bypasses support deny by default and configuration settings. The QUIC block supports boundary protection. And inspection from a dedicated, renewed authority, within an approved privacy scope, supports transmission confidentiality, key management, PKI certificates and monitoring. The guide reads these steps as TIC 3.0's remote user pattern to the web. The assessor decides the controls. The dangers: assuming a preview firewall exists in GCC, reusing the authentication authority, and letting the certificate expire, which stops all inspection. You're done when every bypass is governed, QUIC is blocked, and privacy came first. Next, Chapter 8.
