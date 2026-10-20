"""Trim notes back under 15:00 after adding the cross-agency slide."""
import re

p = "slides4.js"
s = open(p, encoding="utf-8").read()


def r(a, b, f=None):
    global s
    assert s.count(a) == 1, (a[:70], s.count(a))
    s = s.replace(a, b)


# new slide: tighter notes
m = re.search(r"One standard, shared across agencies\.\n\n.*?(?=\n\nWorkbook:)", s, re.S)
assert m
s = s[:m.start()] + """One standard, shared across agencies.

Every agency is moving to the same Core HCM on the same OPM data standards. If SSA defines HR-driven ICAM as a standard — crosswalk, canonical model, identifiers and evidence — other agencies can reuse it instead of building their own. And attributes that mean the same thing everywhere make details, transfers, shared services and cross-agency access easier.

That's the work this position describes: working the issues with other agencies and industry, developing options and predicting their impact, and serving as the data expert on interagency committees and working groups. The goal: present this model to our fellow agencies, and adopt it together.""" + s[m.end():]

r("Now: align with SSA's HR 2.0 team so identity is named as a consumer of the new interconnection. Before onboarding: the standards crosswalk, the authority map, the contractor source and the privacy basis — the data architecture work. During onboarding: build and prove joiner, mover and leaver, in shadow mode first. At go-live: cut each population over as it moves to Entra ID, and close the ticket path for it. After: sustain it with metrics.",
  "Now: align with SSA's HR 2.0 team so identity is a named consumer of the interconnection. Before onboarding: the crosswalk, authority map, contractor source and privacy basis. Then build and prove in shadow mode, cut each population over as it moves to Entra ID, and sustain it with metrics.")

r("Then the operating rules: leave versus leaver, precedence and rescinded offers; a quarantine where failures never auto-resolve; drift detection and metrics; and change control on the crosswalk and code lists.",
  "Then the operating rules on the bottom row, from lifecycle rules through change control.")
open(p, "w", encoding="utf-8").write(s)

e = "editions.py"
u = open(e, encoding="utf-8").read()
u = u.replace('("it\'s the work this position describes:", "it\'s the work an enterprise data architect does:")',
              '("That\'s the work this position describes:", "That\'s the work an enterprise data architect does:")')
open(e, "w", encoding="utf-8").write(u)
print("ok")
