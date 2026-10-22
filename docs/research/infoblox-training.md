---
title: "Infoblox Training and Learning Paths"
subtitle: "Official Infoblox courses, certifications, labs, documentation and videos, organized by role, for an agency adopting NIOS, Universal DDI and Threat Defense"
description: "Research under review: a verified catalog of official Infoblox training resources organized as learning paths for Grid administrators, division administrators, security operations, automation engineers, help desk staff and architects, with costs, formats and version currency."
research-status: in review
research-type: explainer
research-book: "Books 08, 16"
date-modified: 2026-10-22
---

# Infoblox Training and Learning Paths {.unnumbered}

A companion to the research deep dive [Infoblox DDI for Federal Agencies](infoblox-ddi-federal.md) and to the training model in [Book 16 — People: Training & Education](../books/b16-people/index.md), whose [Chapter 06](../books/b16-people/06-vendor-training-and-labs.md) sets the rules for vendor training and labs. Every link below is official Infoblox material (or, where noted, a cloud provider's own page) and was opened on October 22, 2026. Infoblox's prices, course catalogs and trials change; confirm before you plan a budget.

## Before you plan: four facts that shape the plan

- **Training runs through Launchpad,** Infoblox's learning portal, which is free with Infoblox products; people without a product entitlement get only the vendor-neutral Industry Learning track. Launchpad requires an organizational email address and cites "US Federal reporting requirements", so staff enroll with their .gov address. Its course catalog is behind sign-in.
- **The NIOS courses lag the product.** Infoblox's own Education FAQ says the NIOS courses were "refreshed against NIOS 8.6", while the current release is NIOS 9.1. New 2026 content covers DNS Firewall (RPZ), DNS Infrastructure Protection, Threat Insight, discovery, Universal Asset Insights and DNS Traffic Control. Pair the courses with the NIOS 9.1 documentation, and ask Infoblox Education which NIOS version its labs run.
- **There is no federal-specific curriculum on any public page.** An agency-only or onsite class is a "Private Training Event", paid for with training credits that expire after one year; subscription and credit prices aren't published.
- **One certification is retiring:** the NetMRI Administrator exam (IMA) retires on December 31, 2026; don't plan new IMA certifications.

## Learning paths by role

| Role | 1. Foundation | 2. Product core | 3. Depth and certification | Keep at hand |
|---|---|---|---|---|
| **Central DDI and Grid administrators** (Grid, Trinzic and vNIOS, HA, upgrades) | Industry Learning DDI track; DDI Associate (DDIA) | NIOS DDI Operations, then NIOS DDI Administration | NIOS Administrator (INA), then Expert (INE) | [NIOS 9.1.x documentation](https://docs.infoblox.com/space/nios91x/1934393566/Infoblox+NIOS+9.1.x) and [What's New in 9.1.0](https://docs.infoblox.com/space/nios91x/2396391621/What%27s+New) |
| **Division (delegated) administrators** | Industry Learning DDI basics | NIOS DDI Operations | NIOS Operator (INO); Universal DDI Administration if divisions run Universal DDI sites | [Creating Limited-Access Admin Groups (NIOS 9.1)](https://docs.infoblox.com/space/nios91x/2397634569/Creating+Limited-Access+Admin+Groups); [Getting Started with Universal DDI](https://docs.infoblox.com/space/BloxOneDDI/186778208) |
| **Security operations** (Threat Defense, RPZ, Dossier) | DNS Security Associate (DSA), then Professional (DSP) | Infoblox Threat Defense Administration; NIOS DNS Firewall (RPZ) | Threat Defense "Knowledge Verified" badge | [Getting Started with Infoblox Threat Defense](https://docs.infoblox.com/space/BloxOneThreatDefense/38109299); [DNS Firewall (RPZ) labs](https://docs.education.infoblox.com/lab/on-prem-dns-firewall-rpz-labs) |
| **Automation and platform engineers** (WAPI, Terraform, Ansible) | Administrator-level object model (INA) | [NIOS 9.1.0 WAPI documentation (PDF)](https://docs.infoblox.com/download/attachments/15433773/Infoblox%20NIOS%209.1.0%20WAPI%20Documentation.pdf); [Using NIOS APIs](https://docs.infoblox.com/space/nios91x/2397175843/Using+NIOS+APIs); [Universal DDI API Guide](https://docs.infoblox.com/space/BloxOneDDI/186745633) | The infobloxopen Terraform and Ansible projects on GitHub (see the deep dive's automation notes) | [Developer Portal](https://www.infoblox.com/developer-portal/getting-started/); [WAPI Bytes videos](https://www.youtube.com/playlist?list=PLRASOKPhqoBwVEk8SKOnInzn0n9xSi-0M) |
| **Help desk and operators** | Industry Learning DDI basics | NIOS DDI Operations (on demand) | NIOS Operator (INO) | [Getting Started with Universal DDI](https://docs.infoblox.com/space/BloxOneDDI/186778208); [DDI community forum](https://community.infoblox.com/categories/dns-dhcp-ipam-%28ddi%29) |
| **Architects and decision makers** | Industry Learning DNS security and DDI | [Introducing Universal DDI videos](https://www.youtube.com/playlist?list=PLRASOKPhqoBz0zub8mTFtSrEoGyF1H2HV); Universal Asset Insights course | DDI Professional (DDIP) or DSP, vendor-neutral | [Free Cloud Workshop](https://www.infoblox.com/resources/workshop/cloud-workshop/); [IPv6 blog](https://community.infoblox.com/categories/-blogs-id-IPv6) |

## Portal, certifications and costs

| Resource | Link | Cost and notes |
|---|---|---|
| Infoblox Education | [infoblox.com/infoblox-education](https://www.infoblox.com/infoblox-education/) | Launchpad free with Infoblox products; Industry Learning free for non-customers |
| Launchpad catalog | [launchpad.education.infoblox.com](https://launchpad.education.infoblox.com/student/catalog) | Catalog requires sign-in; organizational email required |
| Certifications | [Launchpad certifications](https://launchpad.education.infoblox.com/student/activity/1767039-certifications) | NIOS track Operator → Administrator → Expert (INO → INA → INE); vendor-neutral DDIA/DDIP and DSA/DSP; Universal DDI and Threat Defense "Knowledge Verified" badges |
| Exams, certificates and badges | [Education KB](https://docs.education.infoblox.com/kb/exams-certificates-and-digital-badges) | $29, $69 and $99 per attempt through Kryterion Webassessor, 80% pass mark; customers get two free vouchers per exam, subscribers six; NIOS certifications valid two years |
| Learning Subscription | [Learning Subscription](https://www.infoblox.com/infoblox-education/learning-subscription/) | Instructor-led and on-demand courses with unlimited labs and exams; price not published |
| Education release notes | [Course changelog](https://docs.education.infoblox.com/rel) | Shows what content is new; use it to track course currency |

## Hands-on labs and evaluation

| Resource | Link | Cost and limits |
|---|---|---|
| Browser hands-on labs | [infoblox.com/labs](https://www.infoblox.com/labs/) | Free trial; four hours per lab; includes a 30-day Universal Asset Insights trial; registration required |
| Lab guides (NIOS, Universal DDI, Threat Defense) | [Lab guide index](https://docs.education.infoblox.com/lab) | Guides public; the labs themselves need Launchpad access |
| Downloadable vNIOS evaluation | [Product evaluation portal](https://www.infoblox.com/product-evaluation-portal-ddi/) | Free 60-day license; images are NIOS 9.0.3, not 9.1 |
| Lab network requirements | [Lab environments KB](https://docs.education.infoblox.com/kb/lab-environments) | Labs need outbound access to the lab provider's domains, which agency networks may block; check with the network team before a class |

Book 16's lab rules apply: labs never touch production, use synthetic data, and are torn down afterward ([Chapter 06](../books/b16-people/06-vendor-training-and-labs.md)).

## Cloud and integration learning

| Topic | Link | Federal note |
|---|---|---|
| vNIOS from the Azure Marketplace | [Deploying vNIOS for Azure](https://docs.infoblox.com/space/vniosazure/37486729/Deploying+vNIOS+for+Azure+from+the+Marketplace) | Supported on Azure Government |
| AWS VPC IPAM with Universal DDI | [Amazon VPC IPAM and Universal DDI Integration](https://docs.infoblox.com/space/BloxOneDDI/1803780139/Amazon+VPC+IPAM+and+Universal+DDI+Integration) | Not available in AWS GovCloud (US); private scopes only; needs the VPC IPAM Advanced Tier |
| NIOS-X servers on Azure | [Deploying NIOS-X Servers from the Azure Marketplace](https://docs.infoblox.com/space/BloxOneInfrastructure/204800816) | For Universal DDI sites |

The research explainer [Trinzic Alone, or Trinzic Plus Cloud DDI?](trinzic-multicloud-ddi.md) explains when each of these patterns fits.

## Community and video

- [Infoblox Community](https://community.infoblox.com/), readable without an account, with forums for [NIOS DDI](https://community.infoblox.com/categories/nios-ddi-1), [Universal DDI](https://community.infoblox.com/categories/universal-ddi-management-1), [Threat Defense](https://community.infoblox.com/categories/infoblox-threat-defense-1) and [automation](https://community.infoblox.com/categories/automation), and [product announcements](https://community.infoblox.com/categories/product-announcements), where end-of-life notices appear.
- Infoblox's official YouTube channel, [@InfobloxInc](https://www.youtube.com/@InfobloxInc), with playlists including [Universal DDI Management](https://www.youtube.com/playlist?list=PLRASOKPhqoBzFqEB48iO8fon6I_UJO94S), [NIOS-X as a Service](https://www.youtube.com/playlist?list=PLRASOKPhqoByw9PQ92lkKfLquNUgsCzZo) and [Universal Asset Insights](https://www.youtube.com/playlist?list=PLRASOKPhqoBxe-4DwUeunECdRbTjEK74A).

## Status and review

**In review.** Every link was opened on October 22, 2026 on an Infoblox-owned site or a cloud provider's own documentation. Login-gated content (the Launchpad catalog, the Support Portal knowledge base and NIOS 9.1 release notes) is listed by its public landing page only. Not verified: two course-outline PDFs that returned errors, individual video titles, and any named U.S. training partners. Before building a 9.1 training plan, ask Infoblox Education which NIOS version its labs run and request a quote for a Private Training Event. Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).
