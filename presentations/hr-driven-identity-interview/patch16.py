"""Add the Zero Trust/SASE callback to the ask; trim four long notes to bring the
talk to about 14 minutes. Slide content otherwise unchanged."""
import re

p = "slides4.js"
s = open(p, encoding="utf-8").read()


def r(a, b):
    global s
    assert s.count(a) == 1, (a[:60], s.count(a))
    s = s.replace(a, b)


def note(key, body):
    global s
    m = re.search(r"(\]  )" + re.escape(key) + r".*?(?=\n\nWorkbook:)", s, re.S)
    assert m, key
    s = s[:m.start()] + m.group(1) + body + s[m.end():]


# ---- the ask: slide text and notes
r("and build it into both the HR 2.0 onboarding and the Entra ID migration.\", options: { fontSize: 17 } },",
  "and build it into both the HR 2.0 onboarding and the Entra ID migration, so Zero Trust and SASE decide access on accurate data.\", options: { fontSize: 17 } },")
r("So the ask is simple: decide now to start HR-driven identity, and build it into both the HR 2.0 onboarding and the Entra ID migration instead of retrofitting it after both are done.",
  "So the ask is simple: decide now to start HR-driven identity, and build it into both the HR 2.0 onboarding and the Entra ID migration — so that Zero Trust and SASE decide access on accurate data.")

# ---- trims
note("The thesis in one slide.", """The thesis in one slide.

On the left, two migrations that happen regardless: HR moves to Core HCM, and identity moves from Active Directory toward Entra ID. Meanwhile nothing connects HR to identity today — accounts come from tickets.

In the middle, what OPM leaves to us. OPM fixes the HR side; how SSA's directories and ICAM consume that data is SSA's decision. And the solicitation requires SCIM 2.0 provisioning — exactly what Entra ID consumes.

On the right, the proposal: start HR-driven identity, with HR as the source of authority, expressed in OPM's standard attributes.

So the real choice is: carry ticket-driven identity through both migrations, or start HR-driven identity once, while both platforms are being rebuilt anyway.""")

note("Personnel actions drive the lifecycle.", """Personnel actions drive the lifecycle.

For federal employees, every personnel action carries a nature-of-action code, and the families map cleanly to identity events: the 100 series are joiners, the 700 series movers, the 500 series conversions, the 300 series separations. Contractors have no SF-50; their events come from contract start and end dates.

Two families matter more than people expect. The 400 series — furlough, leave without pay, suspension — is not a leaver; the person is still employed and policy restricts the account. The 200 series, return to duty, lifts those restrictions. Getting this wrong either locks out people on leave or leaves access open for people who've left.

The codes also settle precedence — a separation wins — and rescinded offers.""")

note("Logical and physical modeling.", """Logical and physical modeling, following the data from HR to ICAM.

In the middle is the logical model: a person with an enterprise key the agency controls, their assignments, and the lifecycle events that change them. On the left, the OPM element that feeds each field; then where it lands in Entra ID and Active Directory; and on the right, what ICAM does with it — component scope, location policy, role-based access, approvals, and the joiner, mover and leaver actions, including PIV.

Three physical rules: native attributes first; codes, never display strings, in anything that grants access; and one governed crosswalk as the only place mappings live.""")

note("The governance I'd bring to deliver it safely.", """The governance I'd bring to deliver it safely.

The data foundation first: an authority map with one owner per attribute, and an enterprise person key SSA controls. A security assessment of the data flow. An acceptance gate with a signed validation before cutover. And a cutover that proves HR is the sole source for a population before the ticket path closes for it.

Then the operating rules: leave versus leaver, precedence and rescinded offers; a quarantine where failures never auto-resolve; drift detection and metrics; and change control on the crosswalk and code lists.

Together that produces evidence for AC-2, PS-4, PS-5, IA-4 and SI-12 as a byproduct of operating — supporting those controls, not claiming to close them on its own.""")

open(p, "w", encoding="utf-8").write(s)
print("ok")
