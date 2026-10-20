"""Work the verified primary sources into the executive cut (exec.js)."""
p = "exec.js"
s = open(p, encoding="utf-8").read()


def r(a, b):
    global s
    assert s.count(a) == 1, (a[:80], s.count(a))
    s = s.replace(a, b)


# --- Why: access outlives the job, now evidenced
r('"Removal waits for a ticket. A stale account is a security violation that can enable a breach of the public’s records."',
  'E("Removal waits for a ticket. A 2026 OIG audit of separated staff found deficiencies in revoking access.", '
  '"Removal waits for a ticket — but the federal standard is to revoke credentials within 18 hours.")')

# --- Why: the phones are already in the cloud; the back end is the gap
r('{ text: "The hard part is the back end:", options: { breakLine: true } },',
  '{ text: E("The phones already run in the cloud (Amazon Connect). The hard part is the back end:", '
  '"Cloud contact centers make the front end easy. The hard part is the back end:"), options: { breakLine: true } },')
r('], { x: 7.5, y: 2.55, w: 5.05, h: 2.0, fontSize: 15, paraSpaceAfter: 3 });',
  '], { x: 7.5, y: 2.5, w: 5.05, h: 2.2, fontSize: 14.5, paraSpaceAfter: 3 });')
r('{ x: 7.5, y: 4.6, w: 5.05, h: 0.55, fontSize: 15, bold: true, color: HEX.teal });',
  '{ x: 7.5, y: 4.68, w: 5.05, h: 0.5, fontSize: 14.5, bold: true, color: HEX.teal });')

# source line under the Why slide's left column (SSA edition only)
r('  box(s, "Do nothing", 0.6, 5.5, 12.15, 1.15, "FFFFFF", HEX.amber);',
  '  if (EDITION === "SSA") txt(s, "Why source", "Source: SSA OIG, Insider Threat Program (142302), Sept. 2026; standard: FIPS 201-3.",\n'
  '    { x: 0.6, y: 5.1, w: 6.4, h: 0.3, fontSize: 10.5, italic: true, color: HEX.slate });\n'
  '  box(s, "Do nothing", 0.6, 5.5, 12.15, 1.15, "FFFFFF", HEX.amber);')

# Why notes
r("Access outlives the job: when someone leaves or changes roles, removal waits for a ticket, and a stale account is a security violation that can enable a breach of the public's records.",
  "Access outlives the job: when someone leaves or changes roles, removal waits for a ticket, and a stale account is a security violation that can enable a breach of the public's records. "
  "${E(\"This isn't hypothetical. Last month OIG's Insider Threat audit sampled people who separated over a year and found deficiencies in disabling their access and revoking their credentials. The federal standard is eighteen hours.\", "
  "\"The federal standard is to revoke a separated person's credentials within eighteen hours, and a ticket-driven process struggles to meet it.\")}")
r("The hard part of an idea like that isn't the phones. It's the back end.",
  "The hard part of an idea like that isn't the phones${E(\" — SSA's phones already run on a cloud contact center, Amazon Connect, since 2024\", \" — cloud contact centers make the front end easy\")}. It's the back end.")

# --- Options: the no-regret first step starts from today's HR data
r("The judgment call: if HR 2.0 slipped a long way, C becomes reasonable. But D's first step — data standards, ownership and the person key — is no-regret either way.",
  "The judgment call: if HR 2.0 slipped a long way, C becomes reasonable. But D's first step — data standards, ownership and the person key — is no-regret either way, "
  "and it can start today from ${E(\"the HR operational data store SSA already runs\", \"the HR data the agency already has\")}, with the source switched to Core HCM when it arrives.")

# --- Recommendation: security builds on progress and answers the audit
r("The federal mandates point the same way, but they're the floor, not the reason.",
  "The federal mandates point the same way, but they're the floor, not the reason. "
  "${E(\"And it builds on real progress: this year's FISMA audit moved identity and access management up to Level 4, and its open recommendation is to keep improving user-account oversight. This is how.\", "
  "\"And it gives the inspector general's perennial question — how do you know every account belongs to a current person? — a standing answer.\")}")

# --- Who: the EDA role answers the data-inventory finding
r("and to carry the standard to the interagency committees and working groups where it gets adopted.",
  "and to carry the standard to the interagency committees and working groups where it gets adopted. "
  "${E(\"It also contributes to a FY2026 FISMA finding: SSA lacks a comprehensive inventory of its data and metadata, and the person model and its attributes are a governed piece of that inventory.\", "
  "\"The person model and its attributes also become a governed piece of the agency's data and metadata inventory, which auditors increasingly ask for.\")}")

# --- How: start from today's HR data store
r('["Shadow mode first: compare HR with the directories", "Cut over one population at a time", "Close the ticket path only when the data proves it"]',
  '[E("Start now from the HR Operational Data Store; switch the source at Core HCM", "Start now from today\'s HR data; switch the source at Core HCM"), '
  '"Shadow mode first: compare HR with the directories", "Cut over one population at a time", "Close the ticket path only when the data proves it"]')
r("Operations. We run in shadow mode first,",
  "Operations. We start now, from ${E(\"the HR Operational Data Store SSA already runs\", \"the HR data the agency already has\")}, and switch the source to Core HCM when it arrives. We run in shadow mode first,")

# --- Measures: the 18-hour standard
r('["FaUserXmark", "Separation to blocked access", "Hours, not days or weeks", HEX.red],',
  '["FaUserXmark", "Separation to blocked access", "Within hours — inside the 18-hour federal standard", HEX.red],')
r("time from separation to blocked access, in hours, not days or weeks;",
  "time from separation to blocked access, in hours, inside the eighteen-hour federal standard;")

open(p, "w", encoding="utf-8").write(s)
print("ok")
