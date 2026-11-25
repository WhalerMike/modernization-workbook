"""The managed service account request pack's fields, values and forms, in one place.

build_pack.py writes the Word forms and the two CSVs from this file, and Test-MsaRequest.ps1 and the
tests read the same column list, so the forms, the CSV and the checker can't drift apart.

Sources: the managed service account standard in the service accounts guide (WD-159 to WD-170,
WD-173 naming and configuration, WD-174 enforcement, WD-175 tags) and Chapter 12's request import
format. Everything here is program design, not a federal requirement. Every example is fictional.
Standard library only.
"""

from __future__ import annotations

# WD-173: a role suffix only from this list (Chapter 12's NPI-STD-03 refuses any other).
ROLES = {
    "sql": "The SQL Server Database Engine",
    "agt": "SQL Server Agent",
    "rs": "SQL Server Reporting Services",
    "is": "SQL Server Integration Services",
    "web": "An IIS application pool",
    "svc": "Another Windows service",
    "task": "A scheduled task",
}

# WD-175: the tag keys and the closed values. The same keys go on the AD account (its description),
# on the Entra identity (its service principal's tags and notes until a tenant check confirms custom
# security attributes in GCC, WD-176; then the NonPersonIdentity set) and on Azure,
# AWS and OCI resources.
TAG_KEYS = ["SystemId", "Owner1", "Owner2", "Sponsor", "Environment", "Tier", "EntraTarget"]
ENVIRONMENTS = ["prod", "test", "dev"]
TIERS = ["R1", "R2", "R3"]
ENTRA_TARGETS = {
    "ManagedIdentity": "A managed identity, when the workload moves to Azure",
    "AppRegistrationFederated": "An app registration with a federated identity credential",
    "AppRegistrationCertificate": "An app registration with a certificate credential",
    "GmsaPlusAppRegistration": "Keep the gMSA, plus an app registration for the cloud calls",
    "KeepKerberos": "Stays on Kerberos until program G5 or the island's end of life",
    "Retire": "Retired, with no replacement",
    "Undecided": "Not assessed yet: Chapter 03 records the target at the next review",
}
ACCOUNT_TYPES = ["gMSA", "dMSA"]
WORKLOADS = {"Service": "svc or sql/agt/rs/is", "IisAppPool": "web", "ScheduledTask": "task"}
YES_NO = ["yes", "no"]

# One row per request in request_template.csv: (column, required, allowed values or "", what to enter).
COLUMNS = [
    ("RequestId", True, "", "Your request's number in the access management tool, for example REQ-2026-0201"),
    ("RequestedOn", True, "", "The date you submit it, yyyy-mm-dd"),
    ("RequestKind", True, "New|Migrate", "New: a new account for a new workload. Migrate: replace an existing service account"),
    ("SystemId", True, "", "The system's ID in the system inventory"),
    ("AppShortName", True, "", "The short name on the system's record: lowercase letters and digits, starting with a letter. Use the same short name the system will use in Entra and Azure"),
    ("AccountType", True, "gMSA|dMSA", "gMSA, or dMSA where every host runs Windows Server 2025 and the decision path says so"),
    ("Role", False, "|".join(ROLES), "Only where the system needs more than one account; leave blank otherwise"),
    ("Hosts", True, "", "The servers that run the workload, separated by semicolons"),
    ("Workload", True, "|".join(WORKLOADS), "What runs as the account"),
    ("NeedsSpn", True, "yes|no", "yes if clients connect to the workload with Kerberos (a web site, SQL Server, a file share)"),
    ("Spns", False, "", "Each SPN, <service-class>/<host>[:<port>], separated by semicolons; blank when NeedsSpn is no"),
    ("OutboundOnlyReason", False, "", "Only for a gMSA with no SPN that can't be outbound-only: why"),
    ("Owner1", True, "", "First technical owner's user principal name (a person, never a service account)"),
    ("Owner2", True, "", "Second technical owner's user principal name"),
    ("Sponsor", True, "", "The sponsor's user principal name: a federal employee who isn't one of the owners"),
    ("SponsorIsFederalEmployee", True, "yes|no", "Must be yes"),
    ("RiskTier", True, "R1|R2|R3", "The system's risk tier; it sets how often the owners certify the account"),
    ("Environment", True, "|".join(ENVIRONMENTS), "The environment the hosts are in"),
    ("EntraTarget", True, "|".join(ENTRA_TARGETS), "Where the workload goes when it moves to Entra; Undecided if it hasn't been assessed"),
    ("EndDate", False, "", "Only for an account that stays on Kerberos: the end date the authorizing official accepts, yyyy-mm-dd"),
    ("Supersedes", False, "", "Migrate only: the sAMAccountName of the account it replaces"),
    ("RunByPerson", False, "yes|no", "dMSA only: yes (a Domain Admin runs the dMSA steps)"),
]

# Fictional worked examples (contoso.example). Each one passes the checker.
EXAMPLES = [
    {"RequestId": "REQ-2026-0401", "RequestedOn": "2026-11-25", "RequestKind": "New", "SystemId": "SYS-0517",
     "AppShortName": "visitor", "AccountType": "gMSA", "Role": "", "Hosts": "VIS01;VIS02", "Workload": "IisAppPool",
     "NeedsSpn": "no", "Spns": "", "OutboundOnlyReason": "", "Owner1": "visitor.owner@contoso.example",
     "Owner2": "visitor.backup@contoso.example", "Sponsor": "facilities.sponsor@contoso.example",
     "SponsorIsFederalEmployee": "yes", "RiskTier": "R3", "Environment": "prod", "EntraTarget": "ManagedIdentity",
     "EndDate": "", "Supersedes": "", "RunByPerson": ""},
    {"RequestId": "REQ-2026-0402", "RequestedOn": "2026-11-25", "RequestKind": "Migrate", "SystemId": "SYS-0412",
     "AppShortName": "payroll", "AccountType": "gMSA", "Role": "", "Hosts": "PAY01;PAY02", "Workload": "Service",
     "NeedsSpn": "yes", "Spns": "HTTP/payroll.corp.contoso.example", "OutboundOnlyReason": "",
     "Owner1": "payroll.owner@contoso.example", "Owner2": "payroll.backup@contoso.example",
     "Sponsor": "finance.sponsor@contoso.example", "SponsorIsFederalEmployee": "yes", "RiskTier": "R2",
     "Environment": "prod", "EntraTarget": "AppRegistrationFederated", "EndDate": "", "Supersedes": "svc-payroll",
     "RunByPerson": ""},
    {"RequestId": "REQ-2026-0403", "RequestedOn": "2026-11-25", "RequestKind": "Migrate", "SystemId": "SYS-0233",
     "AppShortName": "hrdb", "AccountType": "gMSA", "Role": "sql", "Hosts": "HRSQL01", "Workload": "Service",
     "NeedsSpn": "yes", "Spns": "MSSQLSvc/hrsql01.corp.contoso.example:1433;MSSQLSvc/hrsql01.corp.contoso.example",
     "OutboundOnlyReason": "", "Owner1": "hrdb.dba@contoso.example", "Owner2": "hrdb.backup@contoso.example",
     "Sponsor": "hr.sponsor@contoso.example", "SponsorIsFederalEmployee": "yes", "RiskTier": "R1",
     "Environment": "prod", "EntraTarget": "KeepKerberos", "EndDate": "2028-09-30", "Supersedes": "svc-hrsql",
     "RunByPerson": ""},
    {"RequestId": "REQ-2026-0404", "RequestedOn": "2026-11-25", "RequestKind": "Migrate", "SystemId": "SYS-0233",
     "AppShortName": "hrdb", "AccountType": "gMSA", "Role": "agt", "Hosts": "HRSQL01", "Workload": "Service",
     "NeedsSpn": "no", "Spns": "", "OutboundOnlyReason": "", "Owner1": "hrdb.dba@contoso.example",
     "Owner2": "hrdb.backup@contoso.example", "Sponsor": "hr.sponsor@contoso.example",
     "SponsorIsFederalEmployee": "yes", "RiskTier": "R1", "Environment": "prod", "EntraTarget": "KeepKerberos",
     "EndDate": "2028-09-30", "Supersedes": "svc-hragent", "RunByPerson": ""},
    {"RequestId": "REQ-2026-0405", "RequestedOn": "2026-11-25", "RequestKind": "Migrate", "SystemId": "SYS-0388",
     "AppShortName": "billing", "AccountType": "dMSA", "Role": "", "Hosts": "BILL01", "Workload": "Service",
     "NeedsSpn": "yes", "Spns": "HTTP/billing.corp.contoso.example", "OutboundOnlyReason": "",
     "Owner1": "billing.owner@contoso.example", "Owner2": "billing.backup@contoso.example",
     "Sponsor": "finance.sponsor@contoso.example", "SponsorIsFederalEmployee": "yes", "RiskTier": "R2",
     "Environment": "prod", "EntraTarget": "Undecided", "EndDate": "", "Supersedes": "svc-billing",
     "RunByPerson": "yes"},
]

# The Word forms: (file, title, purpose, [(field, what to enter)], closing notes).
_TAGS = [
    ("System ID", "The system's ID in the system inventory (tag SystemId)"),
    ("Owner 1 and Owner 2", "Two technical owners, by user principal name: people, never service accounts (tags Owner1, Owner2)"),
    ("Sponsor", "A federal employee who isn't one of the owners (tag Sponsor)"),
    ("Environment", "prod, test or dev (tag Environment)"),
    ("Risk tier", "R1, R2 or R3 (tag Tier): R1 is certified every 3 months, R2 every 6, R3 every 12"),
    ("Entra target", "Where the workload goes when it moves to Entra (tag EntraTarget): " + ", ".join(ENTRA_TARGETS)),
]
FORMS = [
    ("01-new-account-request.docx", "Request: a new managed service account",
     "For a new workload with no existing service account. The request goes to SailPoint, which approves it; "
     "ServiceNow records the change. The pipeline creates the account from an approved plan.",
     [("Request number", "From the access management tool"),
      ("App short name", "Lowercase letters and digits, starting with a letter; the same short name the system will use in Entra"),
      ("Account type", "gMSA (most workloads) or dMSA (only where every host runs Windows Server 2025)"),
      ("Role", "Only where the system needs more than one account: " + ", ".join(f"-{r}" for r in ROLES)),
      ("Account name", "Built for you: gmsa-<app> or gmsa-<app>-<role>, 15 characters or fewer"),
      ("Hosts", "Every server that runs the workload; they become the members of DL-gMSA-<app>-Hosts"),
      ("Workload", "A Windows service, an IIS application pool or a scheduled task"),
      ("SPNs needed?", "Yes if clients connect with Kerberos. List each SPN as <service-class>/<host>[:<port>]"),
      ("If no SPN", "The account is outbound-only. If it can't be, say why")] + _TAGS,
     ["The form refuses a request that breaks a rule, and a workflow checks it again before an approver sees it.",
      "Approvers decide the purpose and the risk. They don't check names or fields: the form and the checker do."]),
    ("02-migration-request.docx", "Request: replace an existing service account",
     "For an existing user account used as a service, moving to a gMSA or a dMSA. Chapter 03's decision path "
     "decides which; the owner confirms it here.",
     [("Request number", "From the access management tool"),
      ("Account it replaces", "The existing account's sAMAccountName"),
      ("Target", "gMSA, or dMSA where every host runs Windows Server 2025, a Windows Server 2025 domain controller is reachable and nothing uses unconstrained delegation"),
      ("App short name and role", "As on the new account request"),
      ("Hosts", "Every server where the old account runs today"),
      ("SPNs and delegation", "Every SPN and delegation setting on the old account; they move in the switch window"),
      ("Parallel run", "30 days for a gMSA; a dMSA's migration has its own wait"),
      ("If it stays on Kerberos", "The end date the authorizing official accepts (never later than program G5 or the island's end of life)")] + _TAGS,
     ["The old account is disabled and moved to the holding OU after the parallel run, and deleted 90 days later.",
      "An account a dMSA supersedes is never deleted: it stays disabled until the dMSA retires."]),
    ("03-owner-change-request.docx", "Request: change an owner or the sponsor",
     "When an owner leaves or moves, or the sponsor changes. An owner's HR event starts it; the departing owner "
     "or the sponsor confirms the new name.",
     [("Account", "The managed service account's name"),
      ("Who is leaving", "The owner or sponsor being replaced"),
      ("New owner or sponsor", "By user principal name; a sponsor must be a federal employee who isn't an owner"),
      ("Effective date", "yyyy-mm-dd")],
     ["SailPoint is the source for owners. After approval the pipeline rewrites the account's tags in AD, "
      "and Chapter 12 flags any tag that still disagrees (NPI-STD-30).",
      "An account with no owner is disabled first, then given 30 days to be claimed."]),
    ("04-retirement-request.docx", "Request: retire a managed service account",
     "When the workload is gone or has moved to Entra.",
     [("Account", "The managed service account's name"),
      ("Why", "Workload retired, or moved to Entra (name the new identity)"),
      ("Hosts to uninstall from", "Every host where the account is installed"),
      ("Replaced by", "The new Entra identity, if any; it carries the same tags")],
     ["The pipeline disables the account and moves it to the holding OU. After 90 days with no sign-in, "
      "a person uninstalls and deletes it, and SailPoint's next aggregation confirms it's gone."]),
    ("05-approver-checklist.docx", "SailPoint approver checklist",
     "What the approver decides. The form, the workflow and Chapter 12's code check every rule; the approver "
     "doesn't repeat those checks.",
     [("Purpose", "Is there a real workload that needs this account, and is this the system it belongs to?"),
      ("Risk", "Is the risk tier right for what the system does and the data it touches?"),
      ("Hosts", "Are these the servers the workload runs on, and no more?"),
      ("Owners and sponsor", "Are these the right people, and will they certify it?"),
      ("If it stays on Kerberos", "Has the authorizing official accepted the end date?")],
     ["Approve or deny in SailPoint. ServiceNow records the change; it never approves."]),
    ("06-servicenow-change-template.docx", "ServiceNow change record: managed service account",
     "The fields the change model requires before the change can move to Implement. Requiring them makes the "
     "record complete; it isn't an approval.",
     [("SailPoint request ID", "The approved request's number"),
      ("Approval date", "The date SailPoint approved it"),
      ("Account name", "gmsa-<app>[-<role>]$ or dmsa-<app>[-<role>]$"),
      ("System ID", "The system's ID in the system inventory"),
      ("Plan", "The Chapter 06 plan's SHA-256, attached by the pipeline"),
      ("Re-read", "Chapter 12's re-read of AD and SailPoint, attached before the task closes")],
     ["A data policy keeps these fields mandatory for imports and web-service writes too."]),
]
