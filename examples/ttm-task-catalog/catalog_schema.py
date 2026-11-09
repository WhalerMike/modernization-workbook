"""The task catalog's columns, drop-down lists, control mapping and checks, in one place.

build_template.py writes the workbook from this module and check_catalog.py
checks a CSV export against it, so the two can't disagree. The drift classes,
default severities, priorities, response windows, re-read systems and the
classes that go to a person first are read from the integration kit's
finding_contract.py, not retyped; the catalog adds orphan_account to that last
set (HUMAN_FIRST_CLASSES), as Book 13 does. The lanes and the five request-chain clauses
are Book 13, Appendix B's. The control-to-indicator rows are Book 13,
Appendix A's. Everything here is fictional or program design; nothing names an
agency.

Standard library only.
"""

from __future__ import annotations

import sys
from pathlib import Path

KIT = Path(__file__).resolve().parent
# The integration kit sits beside this one, in the repository and in the download.
CONTRACT_DIR = KIT.parent / "servicenow-sailpoint" / "clients" / "python"
if str(CONTRACT_DIR) not in sys.path:
    sys.path.insert(0, str(CONTRACT_DIR))

import finding_contract as fc  # noqa: E402  (the shared vocabulary)

# ------------------------------------------------------------------ the vocabulary

# Book 13, Appendix B, "Change classes and their lanes".
LANES = ["Machine, autonomous", "Machine, gated", "Human decision", "Protocol-enforced", "Declared exception"]
MACHINE_LANES = {"Machine, autonomous", "Machine, gated"}
TRIGGERS = ["event", "schedule", "request", "request (automated intake)"]
# A request or a routine event that isn't drift has no drift class and raises no typed finding.
NO_DRIFT = "none"
DRIFT_CLASSES = list(fc.DRIFT_CLASSES) + [NO_DRIFT]
SEVERITIES = list(fc.PRIORITY)
# Where the re-read happens, as the finding contract names it; "other" means the notes say where.
OTHER_SYSTEM = "other"
SYSTEMS = list(fc.SYSTEMS) + [OTHER_SYSTEM]
# The classes a person decides first. Book 13, Chapter 06 files an orphan account as identity drift,
# and Appendix B gives identity drift a human decision unless the claim is in active use, so the
# catalog adds orphan_account to the finding contract's set: the owner decides, then the fix runs gated.
HUMAN_FIRST_CLASSES = set(fc.HUMAN_DECISION_CLASSES) | {"orphan_account"}
STATUSES = ["Draft", "In review", "Approved", "Retired"]
# Who or what the executing identity is. An AI agent is a non-person identity with
# extra rules (the ai_agent check).
AI_AGENT = "AI agent"
IDENTITY_TYPES = ["Person (time-boxed role)", "Service identity", "Managed or workload identity", AI_AGENT,
                  "Protocol client"]
YES_NO = ["yes", "no"]
INDEPENDENT = "Independent checker"
REREAD_BY = [INDEPENDENT, "The identity that acted"]


def window_text(severity: str) -> str:
    """The response window for a severity, from finding_contract.WINDOW_SECONDS."""
    seconds = fc.WINDOW_SECONDS.get(severity)
    if seconds is None:
        return ""
    if seconds == 0:
        return "Immediate"
    hours = seconds // 3600
    return "1 hour" if hours == 1 else f"{hours} hours"


# ------------------------------------------------------------------ the columns

# (header, what goes in it). The header is the exact text in the workbook and the CSV.
COLUMNS = [
    ("Task ID", "Your identifier, such as TTM-001. Unique in the catalog."),
    ("Task name", "The day-to-day task in a few words."),
    ("Lane", "Book 13, Appendix B: who approves, what runs, what evidence results."),
    ("Trigger", "event, schedule or request."),
    ("Source system", "Where the fact or request comes from."),
    ("Target system", "Where the change lands."),
    ("Drift class", "The finding contract's class, or none for a request or a routine event."),
    ("Severity", "P1 to P4. Sets the response window. Each drift class has a default."),
    ("C1 Origin (who asks)", "Clause 1: the origin record, such as an HR event, a finding or a request."),
    ("C2 Approver role (who approves)", "Clause 2: the role that approves. Never the requester."),
    ("C3 Action (what runs)", "Clause 3: the native surface or API the change runs on."),
    ("C3 Executing identity (as which identity)", "Clause 3: the service identity, elevated just in time."),
    ("Identity type", "Person, service identity, managed or workload identity, AI agent, or protocol client."),
    ("Identity sponsor", "The accountable person for a non-person identity. Required for an AI agent."),
    ("High impact", "yes when a mistake is hard to undo or reaches many people, such as consent, "
                    "app deletion or an ImmutableId change."),
    ("Human approval before action", "yes when a named person approves each instance before it runs."),
    ("C4 Re-read check (how closure is proven)", "Clause 4: what is read back, and what it must show."),
    ("Re-read by", "Who does the re-read. An AI agent's own report of success isn't a re-read."),
    ("Re-read system", "Where the re-read happens, in the finding contract's terms, or other."),
    ("Response window", "Filled from the severity: P1 immediate, P2 1 hour, P3 24 hours, P4 72 hours."),
    ("C5 Evidence kept", "Clause 5: what the closure record holds."),
    ("NIST SP 800-53 controls", "Semicolon-separated, such as AC-2; AC-6. See the Controls sheet."),
    ("KSIs", "The provider-side FedRAMP indicators that cite those controls. See the Controls sheet."),
    ("Owner", "The team that owns the task."),
    ("Status", "Draft, In review, Approved or Retired."),
    ("Notes", "Anything else. Required when the severity differs from the class default."),
]
HEADERS = [name for name, _ in COLUMNS]
COL = {name: index for index, name in enumerate(HEADERS)}

# Columns that take a drop-down, and its values.
ENUMS = {
    "Lane": LANES,
    "Trigger": TRIGGERS,
    "Drift class": DRIFT_CLASSES,
    "Severity": SEVERITIES,
    "Identity type": IDENTITY_TYPES,
    "High impact": YES_NO,
    "Human approval before action": YES_NO,
    "Re-read by": REREAD_BY,
    "Re-read system": SYSTEMS,
    "Status": STATUSES,
}

# ------------------------------------------------------------------ controls and indicators

# NIST SP 800-53 Rev. 5 control -> the FedRAMP 2026 Key Security Indicators the
# workbook already maps to it. Most rows are Book 13, Appendix A's, which lists the
# indicators whose "Related SP 800-53 Controls" cite the control (FedRAMP's page as
# read on October 21, 2026); a test compares those rows with Appendix A. The others
# come from other chapters (CONTROL_SOURCES). IA-4, AC-6(5) and CM-8(4) have no
# indicator in the workbook's mappings, so they map to none. The indicators bind cloud service providers; an
# agency lines its own evidence up with what its providers report against them.
APPENDIX_A = "Book 13, Appendix A"
CONTROL_SOURCES = {
    "AC-6(5)": "Book 17, Appendix A cites it for AI identities; no indicator is mapped to it in the workbook",
    "AU-2": "Book 12, Chapter 12 (FedRAMP lists AU-2 among the related controls of KSI-MLA-OSM and KSI-MLA-LET)",
    "AU-12": "Book 12, Chapter 12 (FedRAMP lists AU-12 among KSI-MLA-LET's related controls)",
    "CM-8(4)": "Book 17, Appendix A cites it for AI identities; no indicator is mapped to it in the workbook",
    "IA-4": "No indicator is mapped to IA-4 in the workbook",
    "IA-5": "Book 02, Chapter 10 (the program's mapping: IA-5 to KSI-IAM-APM; IA-5 for non-users to KSI-IAM-SNU)",
}
CONTROL_KSIS = {
    "AC-2": ["KSI-IAM-APM", "KSI-IAM-JIT", "KSI-IAM-SNU", "KSI-IAM-SUS"],
    "AC-3": ["KSI-IAM-APM", "KSI-IAM-ELP", "KSI-IAM-JIT"],
    "AC-5": ["KSI-IAM-JIT", "KSI-PIY-RIS", "KSI-PIY-RSD"],
    "AC-6": ["KSI-IAM-ELP", "KSI-IAM-JIT"],
    "AC-6(5)": [],
    "AU-2": ["KSI-MLA-LET", "KSI-MLA-OSM"],
    "AU-10": ["KSI-IAM-JIT", "KSI-IAM-SNU", "KSI-MLA-LET"],
    "AU-12": ["KSI-MLA-LET"],
    "CA-7": ["KSI-MLA-EVC"],
    "CM-3": ["KSI-CMT-LMC", "KSI-CMT-RMV", "KSI-CMT-RVP", "KSI-CMT-VTD"],
    "CM-4(2)": ["KSI-CMT-LMC", "KSI-CMT-VTD"],
    "CM-5(1)": ["KSI-IAM-ELP", "KSI-IAM-JIT", "KSI-IAM-SUS", "KSI-MLA-LET"],
    "CM-6": ["KSI-CMT-LMC", "KSI-CMT-RMV", "KSI-MLA-EVC", "KSI-SVC-ACM"],
    "CM-6(2)": ["KSI-CMT-VTD", "KSI-CNA-EIS", "KSI-IAM-SUS"],
    "CM-8": ["KSI-PIY-GIV"],
    "CM-8(4)": [],
    "IA-4": [],
    "IA-5": ["KSI-IAM-APM", "KSI-IAM-SNU"],
    "IA-5(2)": ["KSI-IAM-APM", "KSI-IAM-ELP", "KSI-IAM-SNU", "KSI-SVC-ASM"],
    "SC-12": ["KSI-SVC-ASM"],
    "SC-17": ["KSI-SVC-ASM"],
    "SI-4": ["KSI-IAM-SUS", "KSI-MLA-RVL", "KSI-SVC-EIS"],
}
CONTROL_TITLES = {
    "AC-2": "Account Management", "AC-3": "Access Enforcement", "AC-5": "Separation of Duties",
    "AC-6": "Least Privilege", "AC-6(5)": "Privileged Accounts", "AU-2": "Event Logging", "AU-10": "Non-repudiation", "AU-12": "Audit Record Generation", "CA-7": "Continuous Monitoring",
    "CM-3": "Configuration Change Control", "CM-4(2)": "Verification of Controls",
    "CM-5(1)": "Automated Access Enforcement and Audit Records", "CM-6": "Configuration Settings",
    "CM-6(2)": "Respond to Unauthorized Changes", "CM-8": "System Component Inventory",
    "CM-8(4)": "Accountability Information",
    "IA-4": "Identifier Management", "IA-5": "Authenticator Management",
    "IA-5(2)": "Public Key-based Authentication", "SC-12": "Cryptographic Key Establishment and Management",
    "SC-17": "Public Key Infrastructure Certificates", "SI-4": "System Monitoring",
}


def control_source(control: str) -> str:
    return CONTROL_SOURCES.get(control, APPENDIX_A)


KNOWN_KSIS = sorted({k for ksis in CONTROL_KSIS.values() for k in ksis})

# Task type -> (typical drift class, typical lane, suggested controls, why). Program design.
TASK_TYPES = [
    ("Joiner", NO_DRIFT, "Machine, gated", ["AC-2"],
     "An account is created from the HR record; AC-2 covers creating accounts by policy."),
    ("Mover", "attribute_drift", "Machine, gated", ["AC-2", "AC-6"],
     "Attributes follow HR, and access from the old role is removed."),
    ("Leaver", "stale_access", "Machine, gated", ["AC-2"],
     "The account is disabled and its access removed on the last day."),
    ("Access request", NO_DRIFT, "Machine, gated", ["AC-2", "AC-3", "AC-5"],
     "A named approver who isn't the requester; the grant is enforced."),
    ("Attribute correction", "attribute_drift", "Machine, gated", ["AC-2", "CA-7"],
     "The source is corrected and the directory follows; monitoring found it."),
    ("Stale access removal", "stale_access", "Machine, gated", ["AC-2", "AC-6"],
     "The entitlement owner decides; the removal runs gated."),
    ("Orphan account", "orphan_account", "Human decision", ["AC-2", "CA-7"],
     "The owner decides first; an account with no HR record is then disabled, gated."),
    ("Contractor end date", "stale_access", "Machine, gated", ["AC-2"],
     "The account ends on the contract's end date unless the sponsor extends it."),
    ("Certificate renewal", NO_DRIFT, "Protocol-enforced", ["SC-12", "SC-17"],
     "Routine renewal runs on the protocol; no ticket per event."),
    ("Certificate anomaly", NO_DRIFT, "Human decision", ["IA-5(2)", "SC-17"],
     "An unknown issuer or odd lifetime goes to the PKI owner."),
    ("Emergency access check", "credential_drift", "Human decision", ["AC-2", "SI-4"],
     "Any use of an emergency access account is monitored and decided by a person."),
    ("Privileged role activation review", "unauthorized_write", "Human decision", ["AC-6", "AU-10", "CM-5(1)"],
     "Each activation traces to a task; one with no task is provenance drift."),
    ("Group owner change", "attribute_drift", "Machine, gated", ["AC-2", "AC-5"],
     "A group always has an accountable owner who isn't its only member."),
    ("Service account owner leaving", "orphan_account", "Human decision", ["AC-2", "CM-8"],
     "A non-person identity needs a human owner in the inventory."),
    ("Failed provisioning retry", "missing_identity", "Human decision", ["AC-2", "CA-7"],
     "A person reads the error before the retry runs."),
    ("Schema drift", "schema_drift", "Machine, gated", ["CM-3", "CM-4(2)"],
     "A versioned transform is approved, deployed and verified."),
    ("Unauthorized direct write", "unauthorized_write", "Human decision", ["CM-5(1)", "CM-6(2)", "AU-10", "SI-4"],
     "A change outside the front door: the owner decides keep or revert."),
    ("Admin consent request triage", NO_DRIFT, "Human decision", ["AC-3", "AC-6", "AU-12"],
     "A reviewer with the right role checks the publisher and permissions; the grant is re-read."),
    ("App registration lifecycle request", NO_DRIFT, "Machine, gated", ["AC-2", "AC-6", "CM-3", "IA-5"],
     "Create, change or delete an application with an owner, a sponsor and no long-lived secret."),
    ("ImmutableId update (hard match)", "missing_identity", "Human decision", ["AC-2", "IA-4", "CM-3"],
     "Linking a cloud account to the wrong AD account hands it to the wrong person; a person approves."),
    ("Integration credential issue or rotation", "credential_drift", "Machine, gated", ["IA-5", "AC-6", "AU-12"],
     "The credential goes to the vault with an expiry; the old one is revoked and the revocation re-read."),
    ("Automated intake request", NO_DRIFT, "Machine, gated", ["AC-2", "AC-5", "AU-12"],
     "A virtual agent or other intake creates the typed task; the chain and re-read are unchanged."),
    ("AI agent takes an action", NO_DRIFT, "Machine, gated", ["AC-2", "AC-6", "AC-6(5)", "AU-2", "AU-12", "CM-3", "CM-8(4)"],
     "The agent acts as a governed non-person identity with a sponsor; a person approves high-impact "
     "actions; an independent re-read closes the task."),
    ("Configuration drift", NO_DRIFT, "Machine, gated", ["CM-6", "CM-3", "CA-7"],
     "A setting drifts from its baseline; the fix restores the baseline version."),
]


def ksis_for(controls: list[str]) -> list[str]:
    """The indicators that cite any of these controls, in a stable order."""
    out: list[str] = []
    for control in controls:
        for ksi in CONTROL_KSIS.get(control, []):
            if ksi not in out:
                out.append(ksi)
    return out


# ------------------------------------------------------------------ the checks

# (key, sheet column title, what a flag means). check_catalog.py and the Checks
# sheet's formulas apply the same seven rules.
CHECKS = [
    ("owner_approver_reread", "Missing owner, approver or re-read",
     "Owner, C2 Approver role or C4 Re-read check is blank."),
    ("severity_note", "Severity differs, no note",
     "The severity isn't the drift class's default, and Notes is blank."),
    ("human_to_machine", "Human-decision class sent to a machine",
     "The drift class goes to a person first (Book 13, Appendix B), but the lane is a machine lane."),
    ("no_evidence", "No evidence named", "C5 Evidence kept is blank."),
    ("no_control", "No control mapped", "NIST SP 800-53 controls is blank."),
    ("high_impact_no_human", "High impact, no human approval",
     "High impact is yes, but Human approval before action isn't yes."),
    ("ai_agent", "AI agent without safeguards",
     "The identity is an AI agent, and it has no sponsor, or a high-impact or human-decision task has no "
     "human approval, or the re-read isn't by an independent checker."),
]


def split_list(text: str) -> list[str]:
    return [part.strip() for part in text.replace(",", ";").split(";") if part.strip()]


def check_row(row: dict) -> dict:
    """The seven checks for one row (a dict keyed by header). Returns {check key: bool flagged}."""
    get = lambda name: (row.get(name) or "").strip()  # noqa: E731
    drift = get("Drift class")
    default = fc.DEFAULT_SEVERITY.get(drift)
    return {
        "owner_approver_reread": not (get("Owner") and get("C2 Approver role (who approves)")
                                      and get("C4 Re-read check (how closure is proven)")),
        "severity_note": bool(default) and get("Severity") != default and not get("Notes"),
        "human_to_machine": drift in HUMAN_FIRST_CLASSES and get("Lane") in MACHINE_LANES,
        "no_evidence": not get("C5 Evidence kept"),
        "no_control": not get("NIST SP 800-53 controls"),
        "high_impact_no_human": get("High impact") == "yes" and get("Human approval before action") != "yes",
        "ai_agent": get("Identity type") == AI_AGENT and (
            not get("Identity sponsor")
            or ((get("High impact") == "yes" or drift in HUMAN_FIRST_CLASSES)
                and get("Human approval before action") != "yes")
            or get("Re-read by") != INDEPENDENT),
    }
