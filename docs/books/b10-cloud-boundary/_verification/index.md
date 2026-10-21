# Verification — Book 10 index (landing page)

Sources: `index.md` itself. All sources accessed Oct 21, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Review fix, Oct 21, 2026: opening said what an agency can use is decided "by the authorization boundary of the government cloud it runs in" | Opening paragraph | corrected | Conflated three checks that Chapters 01 and 04 separate. Rewritten around the provider's per-feature environment exclusions, FedRAMP certification and assessment scope, and the agency's own authorization; Microsoft 365 GCC and Azure named as the worked case. |
| 2 | Network connectivity in the admin center supports commercial tenants "but not GCC Moderate, GCC High, or DoD" | Opening paragraph (example of a per-feature exclusion) | verified (added) | Microsoft Learn, "Network connectivity in the Microsoft 365 Admin Center," <https://learn.microsoft.com/en-us/microsoft-365/enterprise/office-365-network-mac-perf-overview?view=o365-worldwide>. Note [^c00-netconn]. |
| 3 | Microsoft 365 GCC is listed as FedRAMP Certified at Class C | Opening paragraph | verified (added) | FedRAMP Marketplace `products.json`, `last_change` 2026-10-21T16:12:00Z, listing MSO365MT (`status` FedRAMP Certified, `cert_class` Class C, `impact_level` Moderate), <https://www.fedramp.gov/marketplace/products.json>. Note [^c00-marketplace]. |
| 4 | Each agency "still authorizes its own federal information systems" | Opening paragraph | verified (added) | FedRAMP, "Using a FedRAMP Certified Cloud Service," <https://www.fedramp.gov/2026/agencies/use/>. Note [^c00-fedramp-use]. |
| 5 | Microsoft lists Azure and Azure Government features as GA, Public Preview or Not Available | Opening paragraph | verified (added) | Microsoft Learn, "Cloud feature availability for US Government customers," <https://learn.microsoft.com/azure/security/fundamentals/feature-availability>. Note [^c00-azfeature]. |
| 6 | "A feature can pass one check and fail another" | Opening paragraph | restated-as-design | Book's own framing, argued in Chapter 01. |
| 7 | Review fix, Oct 21, 2026 (consistency): "three honest responses" became "three responses" and the paragraph now ends with "Going without the capability is also a legitimate outcome when someone decides it and records it." | Opening paragraph | restated-as-design (wording-only) | Matches Ch01 and Ch09. No new note. |
