"""The managed service account production proposal's content, in one place.

build_proposal.py writes the Word proposal and the deck from this file, and the tests read it, so the two
can't drift apart. Every fact comes from the workbook's service accounts guide, the request pack guide, the
decision register (data/decisions.yml) or Microsoft Learn, cited by a number in SOURCES. Nothing here names
an agency, a server, a tenant or a person: the angle-bracket placeholders are filled at work, from the Day 2 evidence
(day2-test-script.md), with the prompts in proposal-prompts.md. Standard library only.
"""

from __future__ import annotations

TITLE = "Managed Service Account Production Proposal"
SUBTITLE = "Group and delegated managed service accounts for <agency>: the decided design, how it runs, and the decisions requested"
AUDIENCE = "For the authorizing official and the change advisory board; the technical appendix is for the engineers who run it."
STATUS = ("Neutral template from the Federal Modernization Workbook. Every <placeholder> is filled inside the agency, "
          "with the agency's tools, from the Day 2 evidence; nothing filled in goes back to the public workbook. The design is "
          "the program's (decision register WD-123 to WD-176), not a federal requirement. Where it says a step supports a "
          "control, the assessor decides.")

GUIDE = "https://whalermike.github.io/modernization-workbook/docs/books/guides/service-account-migration.html"
PACK_GUIDE = "https://whalermike.github.io/modernization-workbook/docs/books/guides/msa-request-pack.html"
REGISTER = "https://whalermike.github.io/modernization-workbook/docs/about/decision-register.html"

# (number, citation). Cited in the text as [n].
SOURCES = [
    (1, "Microsoft Learn, \"Secure user-based service accounts in Active Directory\" (find accounts with an SPN, trusted for delegation, or with a password that never expires), https://learn.microsoft.com/entra/architecture/service-accounts-user-on-premises"),
    (2, "Microsoft Learn, \"Securing on-premises service accounts\" (choose the right type; service accounts shouldn't be in privileged groups), https://learn.microsoft.com/entra/architecture/service-accounts-on-premises"),
    (3, "Microsoft Learn, \"Secure group managed service accounts\" (benefits; move to a gMSA), https://learn.microsoft.com/entra/architecture/service-accounts-group-managed"),
    (4, "Microsoft Learn, \"Manage group Managed Service Accounts\" (forest-unique names; outbound-only; the password interval set only at creation; delegated create right; Test-ADServiceAccount; Event ID 4004), https://learn.microsoft.com/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/manage-group-managed-service-accounts"),
    (5, "Microsoft Learn, \"Create a Key Distribution Service (KDS) root key\" (domain controllers wait up to 10 hours from the key's creation before allowing a gMSA; Domain Admins or Enterprise Admins; the backdated key only for a test environment with one domain controller), https://learn.microsoft.com/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/create-the-key-distribution-services-kds-root-key (read Nov 28, 2026)"),
    (6, "Microsoft Learn, \"Create gMSAs for Windows containers\" (one KDS root key per forest; more than one makes gMSAs fail after a password rotation), https://learn.microsoft.com/virtualization/windowscontainers/manage-containers/manage-serviceaccounts"),
    (7, "Microsoft Learn, \"Delegated Managed Service Accounts overview\" (a dMSA supersedes one account; an MSA or gMSA can't be migrated to a dMSA; unconstrained delegation stops working), https://learn.microsoft.com/windows-server/identity/ad-ds/manage/delegated-managed-service-accounts/delegated-managed-service-accounts-overview"),
    (8, "Microsoft Learn, \"Setting up delegated Managed Service Accounts (dMSA) in Windows Server 2025\" (\"currently only available on devices running Windows Server 2025\"; Domain Admins or Enterprise Admins, or equivalent, to create or migrate; a KDS root key first; never delete the original account), https://learn.microsoft.com/windows-server/identity/ad-ds/manage/delegated-managed-service-accounts/delegated-managed-service-accounts-set-up-dmsa (read Nov 28, 2026)"),
    (9, "Microsoft Learn, \"Delegated Managed Service Accounts FAQ\" (at least one Windows Server 2025 domain controller, discoverable by the client or member server; extending the schema isn't enough; every client and server on a dMSA-supported operating system), https://learn.microsoft.com/windows-server/identity/ad-ds/manage/delegated-managed-service-accounts/delegated-managed-service-accounts-faq (read Nov 28, 2026)"),
    (10, "Microsoft Learn, \"New-ADServiceAccount\" (-Path; -ManagedPasswordIntervalInDays; -RestrictToOutboundAuthenticationOnly; -KerberosEncryptionType; -Description; 15 characters or less for older operating systems), https://learn.microsoft.com/powershell/module/activedirectory/new-adserviceaccount"),
    (11, "Microsoft Learn, \"Group Managed Service Accounts overview\" (always configure AES), https://learn.microsoft.com/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/group-managed-service-accounts-overview"),
    (12, "Microsoft Learn, \"Service principal names\" (an SPN can be registered on only one account), https://learn.microsoft.com/windows/win32/ad/service-principal-names, and \"Setspn\" (-S checks for duplicates first), https://learn.microsoft.com/windows-server/administration/windows-commands/setspn"),
    (13, "Microsoft Security Response Center, \"CVE-2025-53779: Windows Kerberos Elevation of Privilege Vulnerability,\" August 12, 2025 (KB5063878, KB5064010), https://msrc.microsoft.com/update-guide/vulnerability/CVE-2025-53779"),
    (14, "National Institute of Standards and Technology, SP 800-53 Rev. 5 (AC-2(1), AC-2(3), AC-2(4), AC-5) and the SP 800-53B Moderate baseline, https://csrc.nist.gov/projects/cprt/catalog#/cprt/framework/version/SP_800_53_5_2_0/home"),
    (15, "FedRAMP, \"Key Security Indicators,\" FedRAMP Consolidated Rules for 2026, https://www.fedramp.gov/2026/reference/key-security-indicators/"),
    (16, "Federal Modernization Workbook, Service Accounts guide: the managed service account standard, its settings, steps S1 to S11, enforcement, the change-safety rings and Dangers, " + GUIDE + "#msa-standard"),
    (17, "Federal Modernization Workbook, Requesting a Managed Service Account (the request pack: forms, checker and tags), " + PACK_GUIDE),
    (18, "Federal Modernization Workbook, decision register, WD-123 to WD-176, " + REGISTER),
    (19, "Federal Modernization Workbook, Book 13, Appendix A: controls behind service accounts and other non-person identities, https://whalermike.github.io/modernization-workbook/docs/books/b13-governance/appendix-a-requirements-mapping.html#controls-behind-service-accounts-and-other-non-person-identities"),
    (20, "Federal Modernization Workbook, Non-Person Identity learning path, Module 15: Your first gMSA, https://whalermike.github.io/modernization-workbook/docs/training/non-person-identity/15-your-first-gmsa.html"),
]

SUMMARY = [
    "<agency> runs services on user accounts: passwords that people set and rarely change, SPNs spread across accounts nobody owns, and NTLM where Kerberos should be [1] [16]. Windows Server can manage the password instead: a group managed service account (gMSA) on any supported domain controller, and a delegated managed service account (dMSA) once a Windows Server 2025 domain controller is in the domain [3] [9].",
    "The program has already decided how every managed service account is named, approved, created, watched, attested and retired (WD-159 to WD-176) [18]. This proposal asks the authorizing official and the change advisory board to accept that design for production at <agency>: gMSAs now, created by a pipeline from an approved, hashed plan; dMSAs when the domain controllers reach Windows Server 2025; one pilot workload first.",
]

PROBLEM = [
    ("Static passwords", "A user account used as a service has a password a person set, often never expiring, kept in service configurations and in people's memory. A gMSA's or dMSA's password is generated and rotated by Active Directory and no person knows it [3] [16]."),
    ("SPN sprawl", "SPNs sit on whatever account a service once ran as. An SPN can be on only one account; a missing or misplaced one breaks Kerberos or drops the service to NTLM [12] [16]."),
    ("NTLM", "Services that fall back to NTLM keep a protocol the program is retiring: after its own backstop of April 1, 2027, an account kept in AD authenticates with Kerberos only (WD-027) [16] [18]."),
    ("No owners", "Many service accounts have no named owner, so nobody certifies them and nobody can say whether they're still needed. Every non-person identity needs two named technical owners and a federal sponsor (WD-164) [18]."),
    ("Privilege", "Service accounts end up in privileged groups. Learn says they shouldn't be, and that each service should have its own account [2]."),
]

# (WD id, topic, the decision in short). Checked against data/decisions.yml by the tests.
DECISIONS = [
    ("WD-159", "Names", "gmsa-<app> or dmsa-<app>, a role suffix only where a system needs more than one account, 15 characters or fewer before the $; retrievers DL-gMSA-<app>-Hosts; creators DL-gMSA-Creators; the pipeline's gMSA gmsa-msapipe"),
    ("WD-173", "Naming and configuration detail", "Lowercase letters, digits and hyphens; role suffix from -sql, -agt, -rs, -is, -web, -svc, -task; SPNs only as named on the request, with setspn -S after approval; logon rights by Group Policy; Remote Desktop and local sign-in denied; a dMSA created only by Domain Admins"),
    ("WD-160", "Who retrieves the password", "Always a domain local group of the workload's hosts, never a single computer account"),
    ("WD-161", "Where accounts live", "A dedicated <service-account-ou>, with the create right delegated there to DL-gMSA-Creators"),
    ("WD-154", "Creation and restriction", "Create right delegated on the OU, not a Domain Admins task; Domain Admins kept for the dMSA steps; outbound-only by default when there's no SPN; gMSA containers only on domain-joined hosts"),
    ("WD-162", "Who approves", "SailPoint approves every request, created, changed or retired, whatever the risk tier; requests come in through the agency's system access management tool; ServiceNow records the change and never approves"),
    ("WD-163", "Who writes", "After approval and the change record, a pipeline runs the kit's hashed Chapter 06 plan as gmsa-msapipe, with only delegated rights on the OU; the authorizing official accepts it as an autonomous class; a person runs the dMSA steps, host uninstalls and every delete"),
    ("WD-168", "No hand writes in production", "Every production write goes through the approved Chapter 06 plan, the smoke-test account included; a superseded account is disabled and moved to the holding OU in the same plan"),
    ("WD-164", "Owners", "Two named technical owners and a sponsor who is a federal employee mastered in HR"),
    ("WD-165", "End date for an account that stays", "Accepted by the authorizing official, recorded by program D08, never later than program G5 (AD retired) or the Kerberos island's end of life"),
    ("WD-166", "Attestation", "The two owners certify in SailPoint: quarterly for R1, twice a year for R2, annually for R3; a revoke opens a ServiceNow task"),
    ("WD-167", "Disabled before delete", "90 days after the disable, with no sign-in seen, then deleted through the decommission ticket"),
    ("WD-124", "Parallel run", "30 days everywhere before a converted account's old identity is disabled"),
    ("WD-123", "dMSA as an in-place replacement", "An existing account that stays on premises can convert in place to a dMSA, which Learn describes as the way to replace an AD service account"),
    ("WD-125", "dMSA as a target", "The Windows Server 2025 dMSA is one of the conversion targets"),
    ("WD-150", "Backout triggers", "The backout triggers set in the implementation guides stand as program decisions"),
    ("WD-169", "Where the indicators come from", "Book 13, Appendix A, read from FedRAMP's Key Security Indicators on November 20, 2026"),
    ("WD-170", "How much machines run", "Machines run, verify and record every step they can; people decide, approve, accept risk and run the Domain Admins and delete steps"),
    ("WD-174", "Where the standard is enforced", "The request form, a workflow before approval, the ServiceNow change record, a daily SailPoint search, and Chapter 12's reconciliation as the backstop"),
    ("WD-175", "Tags", "Seven tags on every account: SystemId, Owner1, Owner2, Sponsor, Environment, Tier, EntraTarget; in AD as key=value pairs in the description"),
    ("WD-176", "Tags in Entra (GCC)", "Custom security attributes treated as unavailable in the GCC tenant until a tenant check confirms them; until then the tags live in a service principal's tags and notes, or Azure resource tags"),
]

FLOW = [
    ("1. Request", "The owner asks in the agency's system access management tool, filling in the request pack's form; its checks refuse a request that breaks a rule before anyone approves it [17]."),
    ("2. Approve", "SailPoint approves, whatever the risk tier (WD-162)."),
    ("3. Record", "ServiceNow opens the change record; it can't move to Implement without the SailPoint request ID, approval date, account name and system ID (WD-174). It records; it never approves."),
    ("4. Create", "The pipeline, as gmsa-msapipe, runs the Non-Person Identity kit's Chapter 06 plan, approved by its SHA-256: the gMSA in <service-account-ou>, AES256, a 30-day password interval, its retriever group and its tags (WD-163, WD-168) [16]."),
    ("5. Install and restrict", "On each host, Install-ADServiceAccount and Test-ADServiceAccount; Group Policy grants only the logon right the workload needs and denies Remote Desktop and local sign-in (WD-173) [4]."),
    ("6. Register and certify", "SailPoint aggregates the account and correlates its owners; the ServiceNow task closes only on Chapter 12's re-read; the owners certify it on its tier's cadence (WD-166)."),
]

# (event, what happens, who runs it, form or record). The Change kind and the name suggester are pending approval.
LIFECYCLE = [
    ("Add", "A gMSA for a new workload: no old account, no parallel run. A dMSA only to supersede an existing account (Migration B); the pack refuses a new dMSA for a new workload (MSA-REQ-05)", "gMSA: the pipeline. dMSA: a Domain Admin", "Form 01 (new); form 02 (migration)"),
    ("Change", "Add or remove a host, add or remove an SPN, change the risk tier or the end date. Pending approval: a Change request kind with ChangeType AddHost, RemoveHost, AddSpn, RemoveSpn, Tier or EndDate", "SailPoint approves; the pipeline rewrites the retriever group or tags; a person registers an SPN with setspn -S", "Form 07 (pending)"),
    ("Migrate", "A: user account to gMSA, 30-day parallel run, then disable. B: user account to dMSA on Windows Server 2025, 30 days, then complete. C: AD to a Microsoft Entra workload identity when the workload moves", "A: the pipeline. B: a Domain Admin. C: Chapter 05's plan", "Form 02"),
    ("Owner change", "A new owner or sponsor; a departing owner's HR event starts a transfer; an orphan is disabled first, then given 30 days to be claimed", "SailPoint approves; the pipeline rewrites the tags", "Form 03"),
    ("Retire and delete", "Disable and move to <holding-ou>; after 90 days with no sign-in a person uninstalls and deletes it; an account a dMSA superseded is never deleted (WD-167) [8]", "The pipeline disables; a person deletes", "Form 04; the decommission ticket"),
    ("Attest", "The two owners certify: R1 quarterly, R2 twice a year, R3 annually; a revoke opens a ServiceNow task (WD-166)", "SailPoint; the owners", "The campaign's decisions export"),
]
LIFECYCLE_NOTE = ("Pending approval: the Change request kind (form 07) and the name suggester Get-MsaNameSuggestion, which proposes a "
                  "standard name from the system's short name and role, are being added to the request pack in a separate change. They're "
                  "part of the proposed solution, not yet in the published pack.")

NAMING = [
    "gMSA: gmsa-<app>; dMSA: dmsa-<app>; -<role> only where one system needs more than one account (WD-159).",
    "<app> is the short name on the system's record: lowercase letters and digits, starting with a letter, no hyphen; the same short name the system uses in Entra (WD-173, WD-175).",
    "Role suffixes: -sql, -agt, -rs, -is, -web, -svc, -task. Nothing else (WD-173).",
    "15 characters or fewer before the $, shortened at <app>, never at the prefix or suffix [10] (WD-159).",
    "Retriever group DL-gMSA-<app>-Hosts; creator group DL-gMSA-Creators; the pipeline's own gMSA gmsa-msapipe (WD-159, WD-160).",
]
# WD-174's layers.
ENFORCEMENT = [
    ("1. The request form", "SailPoint's form (and the agency's system access management tool in front of it) requires every field and checks the short name's pattern, the role list and the length; the request pack's checker runs the same rules before submission"),
    ("2. Before an approver sees it", "An Access Request Submitted workflow runs Chapter 12's request check and denies a failing request"),
    ("3. The change record", "A ServiceNow change can't move to Implement without the SailPoint request ID, approval date, account name and system ID; a data policy holds them for imports and web service writes too"),
    ("4. Every day", "A saved SailPoint search lists the accounts in the service-account OU that break a rule or have no owner"),
    ("5. The backstop", "Chapter 12's reconciliation flags every account AD holds that SailPoint, the register or a request doesn't explain"),
]

PHASES = [
    ("0. Test domain", "One gMSA end to end in the test domain: Module 15's Lab 2 [20], then the Day 2 test", "The commands run clean; backed out", "Ring 0"),
    ("1. Pilot", "<pilot-workload> on <pilot-hosts>: one low-risk production workload in <service-account-ou>, through the full flow", "A clean 30-day parallel run; the end-to-end test passes", "Ring 1"),
    ("2. First wave", "<first-wave-systems>: new workloads and simple Migration A moves, by application owner", "Every workload switched and verified; no old-account logons for 30 days", "Ring 2"),
    ("3. Migration waves", "The remaining user service accounts, wave by wave; dMSA moves (Migration B) only once the domain controllers and hosts run Windows Server 2025", "Every account dispositioned; the island list reviewed", "Rings 2 and 3"),
    ("4. Retire old accounts", "Each superseded account disabled after its 30 days, deleted 90 days later with no sign-in; dMSA-superseded accounts kept disabled", "Chapter 12's delete list empty; SailPoint's aggregation confirms", "Ring 3"),
]

# (step, requirement it supports, KSIs) from the guide's S1 to S11 table, Book 13 Appendix A's pairs (WD-169).
CONTROLS = [
    ("S1 Request", "AC-2; IA-4; CM-8", "KSI-IAM-SNU; KSI-IAM-ELP, IAM-JIT; KSI-PIY-GIV"),
    ("S3 Approve", "AC-2; CM-3; AC-5", "KSI-IAM-SNU; KSI-CMT-LMC; KSI-IAM-JIT"),
    ("S4 Create", "AC-6; IA-5; CM-3; AC-2(1)", "KSI-IAM-ELP, IAM-JIT; KSI-IAM-SNU, IAM-APM; KSI-CMT-LMC"),
    ("S5 Install and restrict", "AC-6; AC-6(5); CM-6", "KSI-IAM-ELP; KSI-IAM-JIT, IAM-SNU; KSI-CMT-LMC"),
    ("S6 Register and close", "CM-8; AC-2", "KSI-PIY-GIV; KSI-IAM-SNU"),
    ("S7 Watch", "CA-7; SI-4; AU-6; AC-2(4)", "KSI-MLA-EVC; KSI-IAM-SUS, MLA-RVL; KSI-MLA-RVL; KSI-MLA-LET"),
    ("S8 Attest", "AC-2; AC-6(7)", "KSI-IAM-SNU; KSI-IAM-AAM, IAM-JIT"),
    ("S9 Owner change and orphans", "AC-2; AC-2(3)", "KSI-IAM-SNU; KSI-IAM-AAM"),
    ("S10 Retire", "AC-2; AC-2(3); CM-8", "KSI-IAM-SNU; KSI-IAM-AAM, IAM-JIT, IAM-SUS; KSI-PIY-GIV"),
    ("S11 Move to Entra", "IA-9 (tailored in); IA-5; AC-6", "None for IA-9; KSI-IAM-SNU, IAM-APM; KSI-IAM-ELP"),
]
CONTROLS_NOTE = ("The pairs are the service accounts guide's steps S1 to S11, drawn from Book 13, Appendix A (WD-169) [16] [19]. "
                 "The evidence supports these controls; it doesn't satisfy them, and the assessor decides. KSIs are FedRAMP 20x indicators "
                 "for cloud service providers: the agency lines this evidence up with what its providers report, and doesn't report KSIs itself [15]. "
                 "The controls are in the NIST SP 800-53 Rev. 5 Moderate baseline except IA-9, which is tailored in [14].")

# (danger, what happens, the guard) from the guide's Dangers table.
RISKS = [
    ("A gMSA created before the KDS root key replicates", "Password retrieval fails on hosts that ask another domain controller", "Wait 10 hours after the key is created; never the backdated key in production [5]"),
    ("A second KDS root key", "gMSAs fail after their next password rotation", "One key per forest; the kit never creates one [6]"),
    ("An SPN left on the old account", "Kerberos fails, or falls back to NTLM", "Move SPNs in the switch window; setspn -L [12]"),
    ("A host that can't retrieve the password", "The service fails to start after the switch", "Test-ADServiceAccount True on every host first [4]"),
    ("A gMSA in a privileged group", "Every host that retrieves its password holds that privilege", "Grant only the service's rights; the kit's NPI-KRB-08 [2]"),
    ("Retrievers widened by hand", "Another host can act as the service", "Retrievers are a reviewed group; NPI-KRB-03 (WD-160)"),
    ("A dMSA completed too early, or with a host not on Windows Server 2025", "The old account is disabled and the service fails", "30 days; every host on 2025; NPI-KRB-04 [9]"),
    ("The old account deleted during the migration", "No way back", "Disable only; delete through the decommission process (WD-167) [8]"),
    ("Create-child rights on an OU once a Windows Server 2025 domain controller exists", "Whoever holds them could create a dMSA and take over another account (BadSuccessor)", "The August 2025 update on every 2025 domain controller; dMSAs by Domain Admins only; create-child rights reviewed [13]"),
    ("A gMSA left behind at program G5", "The workload loses its credential when the last domain controller is demoted", "Chapter 06's reconciliation and island list (WD-165)"),
]

# (prerequisite, what it needs, source, status at <agency>)
PREREQS = [
    ("KDS root key", "Exactly one per forest, created by a Domain Admin or Enterprise Admin, at least 10 hours old before the first gMSA", "[5] [6]", "<kds-key-count> key(s); created <kds-key-created>"),
    ("Domain controllers for gMSA", "The KDS procedure runs on Windows Server 2012 or later domain controllers; the agency baseline is assumed to be Windows Server 2016 with Windows Server 2019 as the minimum, which meets it", "[5] [16]", "<dc-os-summary>"),
    ("Domain controllers for dMSA", "At least one Windows Server 2025 domain controller, discoverable by the hosts; extending the schema isn't enough; every host that uses the account on Windows Server 2025; the August 2025 update on every 2025 domain controller", "[8] [9] [13]", "<ws2025-dc-count> Windows Server 2025 domain controller(s)"),
    ("Functional level", "Learn names no functional level for dMSA; recorded for the record", "[16]", "Forest <forest-functional-level>; domain <domain-functional-level>"),
    ("OUs and groups", "<service-account-ou>, <holding-ou>, DL-gMSA-Creators with the create right delegated on the OU; gmsa-msapipe created once by hand", "[16] (WD-161)", "<service-account-ou-status>"),
    ("Cloud", "GCC Moderate only: the Entra side runs in the agency's Microsoft 365 GCC tenant", "(WD-176)", "<agency> tenant: GCC"),
    ("Tags in Entra", "Custom security attributes treated as unavailable in GCC until a tenant check confirms them; the fallback carries the tags", "[17] (WD-176)", "<csa-tenant-check>"),
    ("SailPoint and ServiceNow", "SailPoint's AD source scoped to <service-account-ou>; the request form, workflow and change-model fields configured", "[16] (WD-174)", "<enforcement-status>"),
]
ASSUMPTION = ("Assumption: <agency>'s domain controllers run Windows Server 2016 or later, with Windows Server 2019 as the minimum, and none "
              "runs Windows Server 2025 yet. So the proposal is gMSAs now, and dMSAs when the domain controllers reach Windows Server 2025. "
              "The Day 2 read of the domain controllers confirms or corrects this.")

OPEN_ITEMS = [
    "The Change request kind (form 07) and Get-MsaNameSuggestion are pending approval in the request pack.",
    "Custom security attributes in the GCC tenant: the tenant check hasn't been run (WD-176).",
    "SailPoint configuration: the request form's rules, the Access Request Submitted workflow and the daily saved search are to configure or build; the search's syntax for a name pattern isn't verified [16].",
    "ServiceNow: the change model's required fields and the data policy are to configure [16].",
    "SailPoint's AD connector names gMSAs, not dMSAs, so dMSAs are reached through Chapter 12's read of AD, not SailPoint's aggregation [16].",
    "Who holds Attribute Definition Administrator and Attribute Assignment Administrator for the NonPersonIdentity set [17].",
    "The date the domain controllers reach Windows Server 2025, which gates every dMSA move: <ws2025-dc-date>.",
    "<pilot-workload>, its owners and sponsor, and the date of the change advisory board: <cab-date>.",
]

DECISIONS_REQUESTED = [
    ("Authorizing official", "Accept the pipeline, gmsa-msapipe running the approved Chapter 06 plan, as an autonomous class (WD-163), with its own owners and certification."),
    ("Authorizing official", "Accept the design for production at <agency>: gMSAs now, dMSAs when the domain controllers reach Windows Server 2025."),
    ("Change advisory board", "Approve the one-time setup as a standard change: <service-account-ou>, <holding-ou>, DL-gMSA-Creators and its delegated right, gmsa-msapipe, and the KDS root key if the forest has none."),
    ("Change advisory board", "Approve the pilot: <pilot-workload> on <pilot-hosts>, with a 30-day parallel run and the backout triggers below (WD-124, WD-150)."),
    ("Both", "Agree the first wave, <first-wave-systems>, to follow a clean pilot."),
]
BACKOUT = ("Backout triggers (WD-150): the service fails to start or the application's test fails; Kerberos errors to the service after the SPN move; "
           "the old account still logging on from a host not on the record. Rollback: point the service back at the old account, which stays enabled for the 30 days.")

# (placeholder, what it is, filled from)
PLACEHOLDERS = [
    ("<agency>", "The agency's name", "You"),
    ("<proposal-date>", "The date of this proposal", "You"),
    ("<cab-date>", "The change advisory board's meeting date", "The board's calendar"),
    ("<domain-fqdn>", "The production domain's DNS name", "Day 2 step R0 (00-context.json)"),
    ("<kds-key-count>", "How many KDS root keys the forest has (should be one)", "Day 2 step R1 (01-kds-root-keys.json)"),
    ("<kds-key-created>", "When the key was created, and its age in hours", "Day 2 step R1"),
    ("<dc-os-summary>", "Domain controllers by operating system", "Day 2 step R2 (02-domain-controllers.csv)"),
    ("<ws2025-dc-count>", "How many domain controllers run Windows Server 2025", "Day 2 step R2"),
    ("<ws2025-dc-date>", "When the first Windows Server 2025 domain controller is planned", "The infrastructure plan"),
    ("<forest-functional-level>", "The forest functional level", "Day 2 step R3 (03-functional-levels.json)"),
    ("<domain-functional-level>", "The domain functional level", "Day 2 step R3"),
    ("<user-service-account-count>", "User accounts with an SPN or trusted for delegation", "Day 2 step R4 (04-user-service-accounts.csv)"),
    ("<spn-count>", "SPNs on those user accounts", "Day 2 step R4"),
    ("<privileged-service-account-count>", "Of those, how many are protected by AdminSDHolder (adminCount 1)", "Day 2 step R4"),
    ("<duplicate-spn-count>", "Duplicate SPNs in the forest", "Day 2 step R5 (05-duplicate-spns.txt)"),
    ("<existing-gmsa-count>", "gMSAs, sMSAs and dMSAs already in the domain", "Day 2 step R6 (06-managed-service-accounts.csv)"),
    ("<service-account-ou>", "The OU for managed service accounts", "Day 2 step R7, or the setup change"),
    ("<service-account-ou-status>", "Whether the OU exists, and who may create objects in it", "Day 2 step R7 (07-service-account-ou-acl.csv)"),
    ("<create-child-holders>", "Who holds create-child rights on OUs that could create a dMSA", "Day 2 step R8 (08-ou-create-child-rights.csv)"),
    ("<holding-ou>", "The OU for disabled service accounts", "The setup change"),
    ("<groups-ou>", "The OU for the DL-gMSA groups", "The setup change"),
    ("<pilot-workload>", "The pilot's system and workload", "The application owner"),
    ("<pilot-hosts>", "The pilot's hosts", "The application owner; Day 2 step R4"),
    ("<first-wave-systems>", "The systems in the first wave", "The application owners"),
    ("<csa-tenant-check>", "Whether the GCC tenant check for custom security attributes passed", "The tenant check (WD-176)"),
    ("<enforcement-status>", "Which of the five enforcement layers are configured", "SailPoint and ServiceNow administrators"),
    ("<test-result>", "The Day 2 test-domain run: Test-ADServiceAccount and qmanagedaccount results", "Day 2 steps T1 to T5"),
]

# Technical appendix: (setting, the standard). From the guide's settings table.
TECH_SETTINGS = [
    ("Name", "gmsa-<app>[-<role>] or dmsa-<app>[-<role>], 15 characters or fewer before the $, unique in the forest [4] [10]"),
    ("Where", "<service-account-ou>, created with New-ADServiceAccount -Path (WD-161) [10]"),
    ("Who creates", "DL-gMSA-Creators, delegated create-child for msDS-GroupManagedServiceAccount on the OU; gmsa-msapipe its only member (WD-154, WD-159) [4]"),
    ("Who retrieves", "DL-gMSA-<app>-Hosts, a domain local group of the hosts (WD-160) [4]"),
    ("Encryption", "AES256 only [11]"),
    ("Password interval", "30 days, set at creation; it can't be changed later [4] [10]"),
    ("No SPN", "Outbound-only (-RestrictToOutboundAuthenticationOnly) unless a reason is recorded (WD-154)"),
    ("SPNs", "Only those named on the request, <service-class>/<host>[:<port>], registered with setspn -S after approval (WD-173) [12]"),
    ("Tags", "SystemId, Owner1, Owner2, Sponsor, Environment, Tier, EntraTarget, with the request and change numbers, as key=value pairs in the description (WD-175)"),
    ("Logon rights", "Log on as a service or as a batch job only; deny Remote Desktop and local sign-in; all by Group Policy (WD-173)"),
    ("dMSA", "Domain Admins only; DelegatedMSAEnabled set by Group Policy; the August 2025 update on every Windows Server 2025 domain controller (WD-154, WD-173) [8] [13]"),
    ("Pipeline rights", "gmsa-msapipe: member of DL-gMSA-Creators, write msDS-GroupMSAMembership on the accounts it creates, disable accounts and move them to <holding-ou>; nothing else (WD-163)"),
]
TECH_COMMAND = ("New-ADServiceAccount -Name gmsa-<app> -DNSHostName gmsa-<app>.<domain-fqdn> -Path \"<service-account-ou>\" "
                "-RestrictToOutboundAuthenticationOnly -ManagedPasswordIntervalInDays 30 "
                "-PrincipalsAllowedToRetrieveManagedPassword \"DL-gMSA-<app>-Hosts\" -KerberosEncryptionType AES256 -Description \"<tags>\"")
TECH_LINKS = [
    "The standard, its settings and steps S1 to S11: the Service Accounts guide's managed service account standard [16].",
    "The scripted write path: the Non-Person Identity developer workbook's Chapter 06, and Chapter 12's request check and reconciliation.",
    "The forms, the checker and the tags: the request pack [17].",
    "A first gMSA, set up and backed out in a test domain: Module 15 [20].",
    "The Day 2 test script in this folder, which produces the evidence that fills the placeholders.",
]

# The deck: (title, bullets or table, speaker notes). Built from the same facts as the proposal.
SLIDES = [
    {"title": TITLE, "subtitle": "<agency>  ·  For the authorizing official and the change advisory board  ·  <proposal-date>",
     "notes": "This proposal asks for one thing: to run managed service accounts in production at the agency by the design the program has already decided. Group managed service accounts now, created by a pipeline from an approved, hashed plan; delegated managed service accounts once the domain controllers reach Windows Server 2025. It starts with one pilot workload. Every fact in it comes from the workbook's service accounts guide, the decision register, or Microsoft Learn."},
    {"title": "The problem: services run on user accounts",
     "bullets": [
         "Static passwords: set by a person, rarely changed, known to people and kept in service configurations.",
         "SPN sprawl: SPNs on accounts nobody owns; a misplaced SPN breaks Kerberos or drops the service to NTLM.",
         "NTLM: the program's own backstop is April 1, 2027; after it, accounts kept in AD use Kerberos only (WD-027).",
         "No owners: nobody certifies the account or knows whether it's still needed (WD-164 needs two owners and a sponsor).",
         "Privilege: service accounts in privileged groups, which Learn says they shouldn't be.",
     ],
     "notes": "Today our services run as user accounts. A person set each password, and it rarely changes. SPNs sit on whatever account a service once used, and a misplaced SPN breaks Kerberos or drops the service to NTLM. Many of these accounts have no named owner, so nobody certifies them. And some sit in privileged groups, which Learn says service accounts shouldn't. Learn's own criteria for finding them are an SPN, delegation, and a password that never expires."},
    {"title": "What we're asking you to decide",
     "table": (["Who", "Decision"], DECISIONS_REQUESTED),
     "notes": "Here are the decisions. The authorizing official accepts the pipeline as an autonomous class, which decision WD-163 requires, and accepts the design for production. The change advisory board approves the one-time setup as a standard change and approves the pilot, with a 30-day parallel run and the backout triggers the program already set. Then both agree the first wave, after a clean pilot."},
    {"title": "The design is already decided",
     "table": (["Decision", "In short"], [(d[0] + " " + d[1], d[2]) for d in DECISIONS if d[0] in ("WD-159", "WD-160", "WD-161", "WD-162", "WD-163", "WD-164", "WD-166", "WD-167")]),
     "notes": "None of this is new design. The program settled it in the decision register: the names, the host group that may retrieve each password, the dedicated OU, SailPoint as the only approver, the pipeline as the only writer for a gMSA, two owners and a federal sponsor, the attestation cadence, and the 90 days a disabled account waits before it's deleted. The full table, with every decision from WD-123 to WD-176, is in the proposal document."},
    {"title": "How a request flows",
     "bullets": [
         "1. Request: the owner asks in the agency's system access management tool; the form's checks refuse a broken request.",
         "2. Approve: SailPoint approves every request, whatever the risk tier (WD-162).",
         "3. Record: ServiceNow's change record can't reach Implement without the SailPoint request (WD-174).",
         "4. Create: the pipeline, as gmsa-msapipe, runs the hashed Chapter 06 plan (WD-163).",
         "5. Install and restrict: Test-ADServiceAccount on each host; Group Policy sets the logon rights (WD-173).",
         "6. Register and certify: SailPoint aggregates; the owners certify on the tier's cadence (WD-166).",
     ],
     "notes": "A request starts in the agency's system access management tool. SailPoint approves it. ServiceNow records the change, and it can't move to Implement without the SailPoint request and the account's name and system. Then the pipeline, running as its own gMSA, applies the Chapter 06 plan that was approved by its hash. The hosts install and test the account, and Group Policy restricts it. Finally SailPoint aggregates it, and its two owners certify it on its tier's cadence."},
    {"title": "The lifecycle",
     "table": (["Event", "Who runs it", "Form"], [(r[0], r[2], r[3]) for r in LIFECYCLE]),
     "notes": "Every event in an account's life has a form and a runner. The pipeline adds a gMSA; a Domain Admin creates a dMSA, and only to supersede an existing account. Changes to hosts, SPNs, the tier or the end date use a Change request type that is pending approval in the request pack. Migrations take one of three paths. Deletes are always run by a person, 90 days after the disable. And the owners attest on the tier's cadence: quarterly, twice a year, or annually."},
    {"title": "One naming standard, enforced in five places",
     "table": (["Where", "What it enforces"], [(e[0], e[1].split(";")[0]) for e in ENFORCEMENT]),
     "notes": "Every name is gmsa or dmsa, then the system's short name, with a role suffix only when one system needs more than one account, and fifteen characters or fewer. Decision WD-174 enforces that in five places: the request form, a workflow before any approver sees the request, the ServiceNow change record, a daily SailPoint search, and Chapter 12's reconciliation as the backstop. ServiceNow's required fields record completeness; they aren't an approval."},
    {"title": "Rollout: test, pilot, waves, retire",
     "table": (["Phase", "Exit criteria"], [(p[0], p[2]) for p in PHASES]),
     "notes": "We roll out in rings. First, one gMSA end to end in the test domain. Then the pilot: one low-risk production workload, with a 30-day parallel run while the old account stays enabled. Then the first wave by application owner, then the migration waves. dMSA moves wait for Windows Server 2025 domain controllers. Last, each old account is disabled after its 30 days and deleted 90 days later, except an account a dMSA superseded, which stays disabled."},
    {"title": "Controls the evidence supports",
     "table": (["Step", "Supports", "KSIs"], [c for c in CONTROLS if c[0].split()[0] in ("S1", "S3", "S4", "S5", "S8", "S10")]),
     "notes": "Each step leaves evidence: the approved plan's hash, the apply manifest, the re-read, the host tests and the certification export. That evidence supports these NIST 800-53 controls, all in the Moderate baseline. It doesn't satisfy them; the assessor decides. The KSI column is FedRAMP's indicators, from Book 13 Appendix A, which the agency lines up with what its providers report."},
    {"title": "Risks and their guards",
     "table": (["Risk", "Guard"], [(r[0], r[2].split(";")[0].split(" [")[0]) for r in RISKS[:7]]),
     "notes": "These are the risks the service accounts guide names, with their guards. The key one first: create a gMSA before the KDS root key has replicated and hosts can't get the password, so we wait ten hours and never use the backdated key in production. One root key per forest. SPNs move in the switch window. Every host passes Test-ADServiceAccount before the switch. No gMSA in a privileged group. And a dMSA is completed only after 30 days, with every host on Windows Server 2025."},
    {"title": "Prerequisites and assumptions",
     "bullets": [
         "KDS root key: one per forest, at least 10 hours old before the first gMSA: <kds-key-count>, created <kds-key-created>.",
         "dMSA needs at least one Windows Server 2025 domain controller, and every host on Windows Server 2025: <ws2025-dc-count> today.",
         "Assumed baseline: Windows Server 2016, with 2019 as the minimum. So gMSAs now, dMSAs when the domain controllers reach 2025.",
         "GCC Moderate only. Custom security attributes treated as unavailable in GCC until a tenant check (WD-176).",
         "SailPoint and ServiceNow enforcement configured: <enforcement-status>.",
     ],
     "notes": "Three prerequisites matter most. The forest needs exactly one KDS root key, at least ten hours old. A dMSA needs at least one Windows Server 2025 domain controller that the hosts can find, and Learn says extending the schema isn't enough; every host that uses it must run 2025 too. Our assumed baseline is Windows Server 2016 with 2019 as the minimum, so the proposal is gMSAs now and dMSAs later. Everything in the cloud stays in our GCC Moderate tenant."},
    {"title": "Open items and next steps",
     "bullets": [
         "Pending approval: the Change request kind (form 07) and Get-MsaNameSuggestion.",
         "Not yet run: the GCC tenant check for custom security attributes (WD-176).",
         "To configure: SailPoint's form rules, workflow and daily search; ServiceNow's required fields.",
         "dMSAs are read by Chapter 12 from AD: SailPoint's connector names gMSAs, not dMSAs.",
         "Owners needed for the Attribute Definition and Attribute Assignment Administrator roles.",
         "Next: approve the setup and the pilot; start in the test domain.",
     ],
     "notes": "A few things are still open. The Change request type and the name suggester are pending approval. The GCC tenant check for custom security attributes hasn't run. SailPoint's form rules, workflow and daily search, and ServiceNow's required fields, still have to be configured. SailPoint's connector reaches gMSAs but not dMSAs, so Chapter 12 covers those. And the attribute administrator roles need owners. Next step: approve the setup and the pilot, and we start in the test domain."},
]
