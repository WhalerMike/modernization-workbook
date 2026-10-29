# Companion guide — Ansible for Configuration Automation: technical deep dive

**Deck name: Guide_Ansible_Technical.** The technical presentation for the companion guide [Ansible for Configuration Automation](../../docs/books/guides/ansible-configuration-automation.md), built with the shared kit in [`../_build/`](../_build/README.md). It's for server, network and platform engineers, configuration managers, and the security staff who assess them: the people who decide which tool may change which setting, run the automation, and prove what it did. This folder sits outside `docs/`, so the site doesn't render it.

The deck runs about 45 to 50 minutes live from the speaker notes, and about 19 minutes narrated. It's split into four modules, each opening with a divider slide, so it can be watched in parts:

| Part | Module | Guide sections |
|---|---|---|
| Orientation | Title; why Ansible's reach needs a rule | Introduction; What Ansible is; One owning tool per setting |
| 1 | What Ansible is, and where it fits | What Ansible is, and what it isn't; Where Ansible fits (tiers, Arc onboarding, Linux and Unix, network, VMware, Infoblox, Windows, cloud VMs) |
| 2 | Ansible Automation Platform in a federal setting | Versions; Authorization status; FIPS mode; Baseline content; Hosting; Sign-in; Logging; Content; Credential plugins; the controller's identity |
| 3 | Evidence and dangers | Evidence to the program; Dangers and how to avoid them |
| 4 | Adoption and the example playbooks; decisions | A phased adoption path; The example playbooks; Checklist (and the example folder's README) |

| File | Use |
|---|---|
| `Guide_Ansible_Technical.pptx` | The deck: 29 narrated slides (title, orientation, four module dividers, 22 content slides and a closing decisions slide), then a backup section with the source lists, one slide per module group, and "Federal requirements: full citations" |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per slide before "Backup", in the conversational style: each slide's intent and its one or two highpoints, with a lead-in to the next slide (about 2,800 words, about 19 minutes) |
| `build.js` | Slide content and full speaker notes; rebuild with the commands in `../_build/README.md` |

The narrated edition (`Guide_Ansible_Technical_Narrated.pptx`, its practice script, captions and per-slide audio) is generated separately by `narrate.py`, `captions.py` and `build_narrated.ps1`, and isn't in this folder yet. `narrate.py` speaks `narration.json` rather than the notes, and stops if an entry's title doesn't match its slide. The narration spells out the acronyms the voice would otherwise misread (C M D B, Y A M L, S T I G, F I P S, S S H, A P I) and leaves the ones `narrate.py`'s `PHON` map already handles (SIEM, CISO, FedRAMP).

The speaker notes are the live script: about 6,700 words, each note carrying its timing cue at 142 words a minute and ending with the `Workbook: Companion guide, Ansible for Configuration Automation — <section>` reference it draws on. `build.js` prints the words and minutes per module. It also refuses a slide title longer than 58 characters or used twice, and a Sources line longer than 185 characters. It sizes each text panel to its contents when no height is given, and warns when a table, panel or callout is likely to overflow or a panel is left mostly empty. With `FIT=1` it prints each table's, panel's and callout's estimated bottom edge.

## What it covers

- **Where Ansible fits.** The five-tool table (Intune, Arc with machine configuration, Azure Policy, Configuration Manager, Ansible) and the population each owns. One owning tool per setting as a `config_owner` attribute in the CMDB, and why auto-correct makes a collision invisible. Ansible's role in each coverage tier and in the four tracks. Arc onboarding with Microsoft's role, its three sign-in options and the onboarding role's scope, Book 05's waves and tags from the CMDB. The tier-2 populations: Unix and Linux outside Arc's support list, network devices, VMware, Infoblox NIOS, Windows without Configuration Manager, and cloud VMs.
- **The platform in a federal setting.** Supported versions and install methods. Authorization status as published, and the self-managed-in-boundary default. What Red Hat does and doesn't state about FIPS mode, and baseline content: CIS Benchmarks, Red Hat's CIS profiles and reviewed community CIS roles, shaped into the agency's CM-6 settings, with the controller STIG kept as a High only reference. Hosting options and what each inherits, and why the managed offerings are out of the default (not FedRAMP-listed) rather than because of their region. Federated sign-in and token lifetimes, external logging and cleanup jobs, content and project signing. The controller governed as a privileged non-person identity, with credential plugins.
- **Evidence and dangers.** CM-2, CM-3, CM-6, CM-7 and CM-8 evidence; AU-2 and AU-12, AC-6 and AC-6(5), SR-3 and SR-11; job results posted to Book 12's evidence contract with the CMDB key. The seven dangers (blast radius, inventory drift, credential sprawl, two tools on one setting, unreviewed Galaxy content, running as root, idempotence failures) and lint as a gate.
- **Adoption and the examples.** The five phases with their decisions, deciders and gates. The CMDB-driven inventory's groups. The four example playbooks, what each changes and what it proves. How they're tested, and what the tests don't prove. The checklist, and the decisions with their owners.

## Labels and sourcing

Every fact on the slides comes from the guide (checked October 29, 2026), the books it links, or the example folder's [README](../../examples/ansible/README.md). Each slide's notes end with the guide section they draw on, each content slide carries a short Sources line, and the backup slides list the sources in full. Federal requirements (NIST SP 800-53 Rev. 5.2.0, the NIST National Checklist Program, the FedRAMP Marketplace and FIPS 140 as Red Hat lists them, with the DISA controller STIG as a High only reference) are cited in short form on the Sources lines and in full on "Federal requirements: full citations".

The program's own recommendations are labeled design guidance on the slide, as the guide does: the tool-to-population mapping, the four ownership rules, Ansible's role per tier, the network, VMware and Windows ownership splits, the self-managed-in-boundary default, the hosting views, the controller's credential rules, the evidence mapping beyond the cited chapters, the dangers' mitigations beyond the cited documentation, the adoption phases and the decisions. Items the guide marks as not published or unverified keep that label: the self-managed platform's FedRAMP treatment, Azure Government and GovCloud availability of the managed offerings, a FIPS-mode support statement for 2.6 and 2.7, and the current release of the controller STIG (High only).

The example playbooks are described, not reproduced; the slides name their files and patterns but carry no code. The guide has no committed diagrams (`docs/images/diagrams/guides/` holds only another guide's figure), so the deck uses the kit's tables, panels and callouts and draws no images.
