# Verification — Guide: Ansible for Configuration Automation

New guide, first pass of 2026-10-29. The guide is an implementation view over Book 05 Ch 01, 03, 04 and 09, Book 08 Ch 11 and Appendix A, Book 12 Ch 07, Book 15 Ch 09, Book 02 Ch 09, Book 04 Ch 05 and the research page `docs/research/infoblox-nios-implementation.md`. Facts carried from those pages are cited by link to the section that states them and rely on those chapters' own verification logs. Every external source footnoted in the guide was opened on 2026-10-29. No personal name or email address was sent in any request.

**Access limits on 2026-10-29.** docs.ansible.com returned HTTP 429 to scripted requests and a Cloudflare bot check in the browser, which was not bypassed. Ansible facts were therefore verified against the source files the site is built from (`ansible/ansible-documentation` `docs/docsite/rst/…` on `devel`; module and plugin `DOCUMENTATION` blocks in `ansible/ansible` `stable-2.21`; each collection's repository; `ansible/ansible-lint` `docs/`). The footnotes give the docs.ansible.com address each source renders to. **Re-open those addresses once before the guide leaves draft.** DISA's DoD Cyber Exchange (public.cyber.mil) did not resolve from the editing environment.

## Claims log: Microsoft Learn (footnoted)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Arc supports listed Windows and Linux versions; unlisted versions unsupported | What Ansible is; Linux and Unix | verified | `ans-arc-prereq` |
| 2 | End of new agent version support November 2026: Ubuntu 18.04/20.04, Debian 11/12, SLES 12 SP5 and 15 SP3–SP6, Oracle Linux 7, Amazon Linux 2; final agent serviced 12 months after its release | Linux and Unix | verified (read from the table; RHEL 7 ends Feb 2027, not November, so not listed) | `ans-arc-prereq` |
| 3 | Agent not tested on CIS-hardened operating systems | Linux and Unix | verified | `ans-arc-prereq` |
| 4 | Machine configuration modes Audit, ApplyAndMonitor, ApplyAndAutoCorrect; no way to report an automatic correction | What Ansible is; One owning tool | verified | `ans-mc-remediation` |
| 5 | "don't try to manage the same settings" (DSC versions); no Microsoft guidance dividing settings between machine configuration and Ansible/Chef/Puppet | One owning tool | verified (quote); absence stated as found | `ans-mc-dsc` |
| 6 | Deployment options list Ansible role in Ansible Core or AAP; agent can't be installed on an Azure VM | Arc onboarding; Cloud VMs | verified | `ans-arc-deploy` |
| 7 | `azure.azcollection.azure_arc` role: installs agent and registers; idempotent; skips connected machines; doesn't discover or replace Policy; variables | Arc onboarding | verified. **Change noted:** the page formerly walked through a hand-written service-principal playbook; it now documents the role only | `ans-arc-ansible` |
| 8 | Sign-in options: managed identity recommended for production (control node must be an Azure VM or Arc server; no RBAC by default); AAP service principal credential (`auth_source: env`); Azure CLI for development, not applicable in AAP | Arc onboarding | verified | `ans-arc-ansible` |
| 9 | Identity needs Azure Connected Machine Onboarding role | Arc onboarding | verified | `ans-arc-ansible`; `ans-arc-roles` |
| 10 | Microsoft recommends assigning the onboarding role only to the onboarding service principal | Arc onboarding | verified | `ans-arc-roles` |
| 11 | `azcmagent connect`: secret in a configuration file to keep it out of console logs; `--tags` comma-delimited `Name=Value`; `--cloud` with `--location`; `AzureUSGovernment` | Arc onboarding | verified | `ans-azcmagent-connect` |
| 12 | `--config` common flag takes JSON or YAML; command line wins | Arc onboarding; examples | verified | `ans-azcmagent-cli` |

Not carried: the Onboarding role's action list includes `machines/addExtensions/action` while the security page says the role "disallows extension management." The guide doesn't characterize the role's extension rights.

## Claims log: Ansible documentation (footnoted; verified from source, see access limits)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 20 | Windows connections: psrp, ssh, winrm | What Ansible is; Windows | verified (source) | `ans-windows` |
| 21 | Windows SSH officially supported since 2.18; needs Windows OpenSSH | Windows | verified (source) | `ans-windows-ssh` |
| 22 | Idempotency definition; not all playbooks and modules behave that way | What Ansible is | verified (source) | `ans-idempotent` |
| 23 | Check mode: no changes; unsupported modules report nothing and do nothing; "just a simulation"; `--diff` can reveal sensitive information | What Ansible is; Linux and Unix; Dangers | verified (source) | `ans-checkmode` |
| 24 | `become` methods include sudo, su, pfexec, doas, pbrun, dzdo; can't limit escalation to certain commands | Linux and Unix; Dangers | verified (source). The docs give no general least-privilege recommendation for become; the guide doesn't attribute one | `ans-become` |
| 25 | `ios_facts`: `network_cli`; `gather_subset` default `min`; `ansible_net_` facts | Network devices | verified (source) | `ans-ios-facts` |
| 26 | `community.vmware.vmware_vm_inventory` removed in community.vmware 7.0.0; use `vmware.vmware.vms` | VMware | verified (changelog) | `ans-vmware-inv` |
| 27 | `vmware.vmware_rest.vcenter_vm_info` gathers VM information | VMware | verified (source) | `ans-vmware-rest` |
| 28 | `nios_lookup`, `nios_next_ip` need `infoblox-client` | Infoblox | verified (source; README pins 0.6.2) | `ans-nios` |
| 29 | Cloud inventory plugins `aws_ec2`, `gcp_compute`, `azure_rm` | Cloud VMs | verified (source short descriptions) | `ans-cloud-inv` |
| 30 | Vault "ONLY protects 'data at rest'" | Credentials | verified (source) | `ans-vault` |
| 31 | `no_log` on secret tasks; doesn't affect debugging output | Credentials; Dangers | verified (source) | `ans-no-log` |
| 32 | `--limit` | Dangers | verified (source) | `ans-patterns` |
| 33 | `serial` number, percentage or list | Dangers | verified (source) | `ans-strategies` |
| 34 | `any_errors_fatal`; `max_fail_percentage` per batch, exceeded not equaled | Dangers | verified (source) | `ans-errors` |
| 35 | Inventory plugins recommended over scripts | Dangers; examples README | verified (source) | `ans-dyninv` |
| 36 | `constructed` builds groups from earlier inventory variables | Dangers | verified (source) | `ans-constructed` |
| 37 | Galaxy: "finding and sharing Ansible community content" | Dangers | verified (source). No "unvetted" disclaimer exists in the docs; the guide doesn't claim one | `ans-galaxy` |
| 38 | Latest version installed by default; version ranges; `--keyring`; GPG only for distribution-server installs | Dangers | verified (source) | `ans-galaxy-install` |
| 39 | `ansible-galaxy collection verify` | Dangers | verified (source) | `ans-galaxy-verify` |
| 40 | command module check mode only with `creates`/`removes` | Dangers | verified (source) | `ans-command` |
| 41 | ansible-lint profiles min→production; production "meets requirements for inclusion in Ansible Automation Platform"; `no-changed-when`; `fqcn` | Dangers | verified (source) | `ans-lint` |
| 42 | ansible-core 2.16 community EOL July 2025 | AAP versions | verified (doc source, last changed 2026-10-27) | `ans-core-matrix` |

## Claims log: Red Hat, FedRAMP, NIST (footnoted)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 50 | AAP 2.7 GA 2026-06-02, full support to 2027-06-02, maintenance to 2029-06-02; 2.6 full support ended 2026-10-01, maintained to 2028-10-01 | AAP versions | verified (life-cycle page and Product Life Cycle API) | `ans-aap-lifecycle` |
| 51 | Default ansible-core 2.16 supported for life of 2.5–2.7; 2.18 EEs likewise; 2.20 optional in 2.7 | AAP versions | verified | `ans-aap-lifecycle` |
| 52 | 2.7: containerized (rootless default) on RHEL 9/10 or OpenShift operator; no RPM installer | AAP versions; Hosting | verified | `ans-aap-lifecycle`; `ans-aap-install` |
| 53 | Gateway is the only supported external authentication path in 2.7 | AAP versions; Sign-in | verified | `ans-aap-auth` |
| 54 | No Ansible offering on the FedRAMP Marketplace | Authorization status | verified (marketplace product data searched; marketplace.fedramp.gov now redirects to fedramp.gov/marketplace) | `ans-fedramp-mkt` |
| 55 | Red Hat: "FedRAMP is only applicable to the products listed below" — ROSA (two architectures) and Lightspeed, via AWS GovCloud | Authorization status | verified | `ans-rh-fedramp` |
| 56 | ROSA FR2102031769 FedRAMP Certified, High, Lightspeed bundled | Authorization status | verified | `ans-fedramp-rosa` |
| 57 | Self-managed AAP's FedRAMP treatment | Authorization status | **not published**; the guide says so and gives the program's default as design guidance | — |
| 58 | Azure managed application in the customer's tenant; Red Hat reaches only the managed resource group; regions commercial only | Authorization status; Hosting | verified; Azure Government availability **not published** | `ans-aap-azure` |
| 59 | AWS service: Red Hat-run control plane; customer execution nodes; job logs erased every 30 days; regions commercial only | Hosting | verified; GovCloud availability **not published** | `ans-aap-aws` |
| 60 | Self-managed offers on AWS, Google Cloud and Oracle marketplaces | Hosting | verified | `ans-aap-options` |
| 61 | FIPS page lists RHEL module certificates; generally applicable to other products running unmodified; AAP not named | FIPS | verified | `ans-rh-fips` |
| 62 | AAP 2.6/2.7 FIPS-mode support statement | FIPS | **couldn't verify** (none found in 2.6/2.7 system requirements, installation, hardening or compliance pages); the guide says so | — |
| 63 | 2.5 known issue AAP-39146 (gateway on FIPS RHEL 9) fixed April 9, 2025; AAP-16456, AAP-50443 | FIPS | verified | `ans-aap-25-notes` |
| 64 | Red Hat lists an Ansible Automation Controller STIG | Baseline content (controller, *High only*) | verified. **Changed 2026-10-29 (Moderate civilian sweep):** the FIPS paragraph no longer justifies FIPS through the RHEL STIG profile's FIPS requirement, and the RHEL STIG baselines-by-release claim was dropped; FIPS now stands on its own as design guidance. The footnote's description was trimmed to match | `ans-rh-stig` |
| 65 | First controller STIG released April 2023 | Baseline content (controller, *High only*) | verified (Red Hat blog, Apr 11, 2023) | `ans-rh-stig-blog` |
| 66 | Current controller STIG release and covered platform version | Baseline content (controller, *High only*) | **couldn't verify** (public.cyber.mil unreachable); the guide tells readers to check DoD Cyber Exchange | — |
| 67 | 2.7 caveats for CIS/PCI DSS/STIG-hardened hosts: fapolicyd, noexec on /tmp and /var, umask | Baseline content (controller) | verified. **Reframed 2026-10-29:** the controller host is hardened to the CIS RHEL 9 or 10 Benchmark and agency CM-6 settings (design guidance); STIG kept only as a *High only* reference | `ans-aap-hardened` |
| 68 | RHEL 9 §7.5 and RHEL 10 §5.3.2: remediate with an SSG Ansible playbook | Baseline content (hosts) | verified | `ans-rhel-hardening` |
| 69 | Gateway authentication methods; per-resource roles | Sign-in | verified | `ans-aap-auth` |
| 70 | Token default expiry 1,000 years → 1 year; earlier tokens keep their lifetime | Sign-in | verified | `ans-aap-tokens` |
| 71 | External logging to Splunk, Loggly, Sumo Logic, Elastic over HTTPS/TCP/UDP; most useful data | Logging | verified | `ans-aap-logging` |
| 72 | Activity stream records time, user and action for every change | Logging | verified | `ans-aap-activity` |
| 73 | Central logging plus auditd | Logging | verified | `ans-aap-securelog` |
| 74 | Cleanup management jobs, days to keep | Logging | verified on the 2.5 guide (2.7 page not located) | `ans-aap-cleanup` |
| 75 | Certified (in subscription) and validated content | Content | verified | `ans-aap-content` |
| 76 | Hub signing disabled by default; GPG; 2.7 post-quantum option; clients opt in with a keyring | Content | verified | `ans-aap-signing` |
| 77 | Project signing with `ansible-sign`; failed verification blocks update and launch | Content | verified | `ans-aap-projsign` |
| 78 | Webhooks from GitHub and GitLab | Content | verified | `ans-aap-webhooks` |
| 79 | Credential plugins: AWS Secrets Manager, Centrify, CyberArk CCP and Conjur, HashiCorp Vault KV and signed SSH, Azure Key Vault, Thycotic | Credential plugins | verified | `ans-aap-creds` |
| 80 | 2.7 HashiCorp Vault OIDC credential types with per-job short-lived tokens | Credential plugins | verified | `ans-aap-vault-oidc` |
| 81 | NIST SP 800-53 Rev. 5.2.0 titles for CM-2, CM-3, CM-6, CM-7, CM-8, AU-2, AU-12, AC-6, AC-6(5), SR-3, SR-11; all in the Moderate baseline; SA-12 withdrawn, incorporated into SR | Evidence | verified (OSCAL catalog and Moderate profile, version 5.2.0, parsed directly). SR-4 is not in Moderate and isn't cited | `ans-80053` |
| 82 | CM-6: organization-defined common secure configurations; documented and approved deviations; common secure configurations developed by vendors, federal agencies, consortia, academia and industry | How to read; Baseline content | verified 2026-10-29 (coordinator fact pack, OSCAL Rev. 5 catalog) | `ans-cm6` |
| 83 | NIST National Checklist Program (SP 800-70 Rev. 5, May 2026) is the federal checklist repository | How to read; Baseline content | verified 2026-10-29 (coordinator fact pack) | `ans-ncp` |
| 84 | SCuBA baselines cover Microsoft 365 and Google Workspace (not servers or network devices) | Baseline content | verified 2026-10-29 (coordinator fact pack) | `ans-scuba` |
| 85 | CIS Benchmarks listed: RHEL 9 (3.0.0), RHEL 10 (1.0.1), Windows Server 2022 (5.1.0), 2025 (2.1.0), VMware ESXi 8.0 (1.4.0), 9.0 (1.0.0) | Baseline content; VMware | verified 2026-10-29 (coordinator fact pack) | `ans-cis` |
| 86 | RHEL 9 SCAP Security Guide ships CIS Level 1 and Level 2 Server and Workstation profiles | Baseline content | verified 2026-10-29 (coordinator fact pack) | `ans-rh-ssg` |
| 87 | Ansible Lockdown, sponsored by MindPoint Group, publishes CIS roles (RHEL9-CIS, RHEL10-CIS, Windows-2022-CIS) with -Audit counterparts; community, not Red Hat-supported | Baseline content | verified 2026-10-29 (coordinator fact pack); "review and pin" is design guidance | `ans-lockdown` |
| 88 | RHEL9-CIS warns it "will make changes to the system", developed against a clean install, targets CIS RHEL 9 v2.0.0; RHEL9-CIS-Audit audits with goss, CIS 2.0.0 | Baseline content | verified 2026-10-29 (both GitHub READMEs opened) | `ans-lockdown-rhel9` |
| 89 | AWS US East/West FedRAMP Certified Class C (formerly Moderate); GovCloud (US) Class D (formerly High); services in scope per service, per Region | Hosting | verified 2026-10-29 (coordinator fact pack); "a Moderate system can run in either" labeled inference | `ans-aws-fedramp` |
| 104 | Broadcom's VCF Security Configuration and Hardening Guide as the VMware vendor hardening guide; STIG readiness content *High only* | VMware | carried from B15 Ch09 (`#vmware-hardening-content`, section being renamed in the same sweep) and the coordinator fact pack | B15 Ch09 |

## Claims log: carried from the chapters (linked, not footnoted)

| # | Claim (short) | Where in guide | Chapter section |
|---|---|---|---|
| 90 | Intune's supported platforms don't include Windows Server | Tool table | B05 Ch03, Which system owns which fact |
| 91 | One management plane per asset; no co-management for new assets | One owning tool | B05 Ch04, pillar 4 |
| 92 | CMDB is the origin of business facts and a consumer of technical ones | One owning tool | B05 Ch03, The procurement record and the CMDB |
| 93 | Derived values must be explainable from their origin | Arc onboarding | B05 Ch03, The rule |
| 94 | Onboarding waves; certificate service principal scoped to the resource group; credential needed only during connect | Arc onboarding; Credentials | B05 Ch09, Onboarding; Create the onboarding service principal |
| 95 | Arc-enabled VMware vSphere and the multicloud connector as onboarding methods | VMware; Cloud VMs | B05 Ch09, Choose a method |
| 96 | VCF 9 STIG readiness content (*High only*): Ansible for appliances; record the content version | VMware | B15 Ch09, VMware hardening content (anchor `#vmware-hardening-content`; formerly "STIG content for VCF 9") |
| 97 | `infoblox.nios_modules` in the integration table; certified `infoblox.universal_ddi` collection | Infoblox | B08 App A; B08 Ch11 |
| 98 | State Manager can run Ansible playbooks | Cloud VMs | B12 Ch07, Configuration state |
| 99 | Customer-operated AAP carries no provider certification; management channels as external connections | Authorization status; Hosting | B12 Ch07, Accreditation and the boundary |
| 100 | AAP job results to the coordination layer; emission contract fields; playbook version as CM-2 baseline; Insights/Lightspeed excluded by default | Evidence; Authorization status | B12 Ch07, Extending the contract |
| 101 | Baseline changes by pull request (CM-3); Ansible enforcement under CM-6 | Evidence | B12 Ch07, Controls and indicators |
| 102 | Service principal governance: two human owners, credentials, reviews | Credentials | B02 Ch09, Governing service principals |
| 103 | Managed identities and workload identity federation | Credentials | B04 Ch05 |

## Design guidance (labeled in the guide)

The tool-to-population mapping, the four ownership rules, Ansible's role per coverage tier, network and VMware ownership splits, the application-versus-OS split on Arc Windows servers, the self-managed-in-boundary default, the hosting views, the credential rules for the controller, the evidence mapping beyond the cited chapter text, the dangers' mitigations beyond the cited documentation, and the five-phase adoption path.

## Example playbooks

`examples/ansible`, tested 2026-10-29 on Ubuntu 24.04 under WSL with ansible-core 2.21.5, ansible-lint 26.10.1 (production profile, strict), yamllint 1.38.0 (strict) and pytest; collections pinned to ansible.windows 3.9.2, ansible.netcommon 8.7.1, ansible.utils 6.1.1, cisco.ios 11.6.0 and infoblox.nios_modules 1.10.0 (the latest on Galaxy that day). `tests/run_all.sh`: yamllint, ansible-lint, `--syntax-check` on all four playbooks, and 39 pytest tests passed, including live runs of playbooks 01 and 03 against the control node and a dry run of 02 that left no agent, parameter file or installer. The Arc, Windows, Cisco and Infoblox tasks were not run against those platforms.

The onboarding playbook passes the secret through an `azcmagent connect --config` file whose keys are the flag names (`service-principal-secret`, `tags` and so on), which follows Microsoft's description of `--config`; the file format beyond that description wasn't tested against a live agent. `azcmagent show --json`'s `status` field is read with an `unknown` fallback because Learn documents `-j` and the `status` property but not a full output sample.

## Could not verify

| Item | Status |
|---|---|
| docs.ansible.com rendered pages | 429 / bot check on 2026-10-29; verified from source; re-open before leaving draft |
| Current DISA Ansible Automation Controller STIG release (*High only*) | public.cyber.mil unreachable; guide directs readers there |
| AAP 2.6/2.7 support on FIPS-mode RHEL | No statement found; guide says ask Red Hat and test |
| Self-managed AAP's FedRAMP treatment | Not published by Red Hat or FedRAMP; guide gives design guidance |
| AAP managed offerings in Azure Government or AWS GovCloud | Not published |

## Moderate civilian sweep (2026-10-29)

The guide was reframed for FedRAMP Moderate civilian agencies. "STIG content" became "Baseline content" (`#baseline-content`): the agency's CM-6 settings drawn from CIS Benchmarks, Red Hat's SCAP Security Guide CIS profiles, the vendor's hardening guide and reviewed, pinned Ansible Lockdown CIS roles. The controller host is hardened to CIS RHEL 9 or 10 plus agency CM-6 settings. The DISA controller STIG and Broadcom's VCF STIG readiness content are kept as optional *High only* references, with the page's one explaining line under "How to read this guide". The FIPS paragraph no longer leans on the STIG profile. The phase-2 decision, the decisions in the checklist and the description frontmatter no longer offer STIG as a baseline option. The hosting table no longer implies a commercial Region is out of bounds; the managed offerings are excluded because they aren't FedRAMP-listed. New claims are rows 82 to 89 and 104. No personal name or email address was sent in any request.

## Addition, October 30, 2026

| Claim | Where | Verdict |
|---|---|---|
| Rule 5: one patch owner per server (`patch_owner`, mirrored to the Arc `PatchOwner` tag); Update Manager assesses only where Ansible patches | One owning tool per setting | design guidance (the rule list is labeled); links Book 05 Ch 09 |
