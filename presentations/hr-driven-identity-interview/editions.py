"""Produce the two deck editions from the shared sources.

SSA edition:        lib/slides/personal/teaser as written, footer labelled "SSA edition".
Any Agency edition: every SSA-, DITM- and SAM-specific reference made generic, footer
                    labelled "Any Agency edition". Fails if anything agency-specific survives.
Writes build_SSA.js and build_AnyAgency.js.
"""
import re
import sys

src = {f: open(f, encoding="utf-8").read() for f in ["lib2.js", "slides4.js", "personal.js", "teaser.js", "tail.js"]}
FOOT = "HR-Driven Identity  ·  Mike Stratton"
assert src["lib2.js"].count(FOOT) == 1


def assemble(parts):
    s4 = parts["slides4.js"]
    cut = s4.index("// ------------------------------------------------------------------ 4 Window")
    return parts["lib2.js"] + s4[:cut] + parts["personal.js"] + s4[cut:] + parts["teaser.js"] + parts["tail.js"]


# ---------------- SSA edition
ssa = dict(src)
ssa["lib2.js"] = src["lib2.js"].replace(FOOT, FOOT + "  ·  SSA edition")
open("build_SSA.js", "w", encoding="utf-8").write(assemble(ssa))

# ---------------- Any Agency edition
ANY = {
    "lib2.js": [(FOOT, FOOT + "  ·  Any Agency edition")],
    "slides4.js": [
        ("Digital Identity line of business  ·  GS-14 Enterprise Data Architect  ·  Data Strategy and Enablement",
         "Enterprise data architecture  ·  Digital identity modernization"),
        ("I chose the Digital Identity line of business, and I want to make one proposal.", "I want to make one proposal."),
        ("Today SSA has no HR-driven identity.", "In many agencies today there is no HR-driven identity."),
        ("Federal HR 2.0 moves SSA's HR onto Oracle Core HCM in Wave 2, scheduled for the second half of 2027, and SSA's identity is moving from Active Directory toward Entra ID.",
         "Federal HR 2.0 moves each agency's HR onto Oracle Core HCM in waves through 2027, and agency identity is moving from Active Directory toward Entra ID."),
        ("Identity is SSA’s call", "The agency’s call"),
        ('content("HRIT arrives in late 2027 — build identity into it", "Thesis")', 'content("HRIT is coming — build identity into it", "Thesis")'),
        ("The agency’s directory and ICAM design is SSA’s decision", "The agency’s directory and ICAM design is its own decision"),
        ("how SSA's directories and ICAM consume that data is SSA's decision", "how the agency's directories and ICAM consume that data is the agency's decision"),
        ("The window closes at SSA’s interconnection go-live", "The window closes at the agency’s interconnection go-live"),
        ('["2nd half 2027", "SSA’s Core HCM (Wave 2)",', '["FY 2027", "Wave 2 agencies",'),
        ("SSA is in Wave 2, scheduled for the second half of 2027 — so we aren't on the platform yet, and that's the point: about eight months of onboarding, with interconnections live around month five, lie ahead of us.",
         "Wave 2 agencies follow in fiscal 2027. For an agency not yet on the platform, that's the point: about eight months of onboarding, with interconnections live around month five, still lie ahead."),
        ("(Verify SSA's current Wave 2 onboarding dates before presenting.)", "(Verify the agency's onboarding dates before presenting.)"),
        ('"Enterprise person key (Mainframe PIN)"', '"Enterprise person key"'),
        ('"SSA \\u2014 the existing Mainframe PIN"', '"The agency \\u2014 often an existing ID"'),
        ('{ text: "SSA already has the key: ", options: { bold: true, color: HEX.amber } },', '{ text: "Often the key already exists: ", options: { bold: true, color: HEX.amber } },'),
        ('{ text: "the Mainframe PIN. Confirm it as the enterprise person key,', '{ text: "for example, a Mainframe PIN. Confirm it as the enterprise person key,'),
        ("And SSA already has its enterprise person key: the Mainframe PIN, which today is our person ID and employee ID. So the decision is to confirm the Mainframe PIN as the enterprise key and map Core HCM's PersonNumber to it — then when SSA moves to Core HCM, only the source key changes, and nothing downstream has to.",
         "And many agencies already have one — for example, a Mainframe PIN that already serves as the person ID and employee ID. Then the decision is to confirm it as the enterprise key and map Core HCM's PersonNumber to it — so when the agency moves to Core HCM, only the source key changes, and nothing downstream has to."),
        ('"Person (Mainframe PIN)", "personKey = Mainframe PIN",', '"Person (enterprise key)", "personKey",'),
        ("a person keyed by the Mainframe PIN — carried in employee ID in both directories —", "a person with an enterprise key the agency controls —"),
        ("plus SSA's own", "plus the agency's own"),
        ("with SSA's privacy office", "with the agency's privacy office"),
        ("an enterprise person key SSA controls", "an enterprise person key the agency controls"),
        ("align with SSA's HR 2.0 team", "align with the agency's HR 2.0 team"),
        ("If SSA defines HR-driven ICAM as a standard", "If one agency defines HR-driven ICAM as a standard"),
        ("That's the work this position describes:", "That's the work an enterprise data architect does:"),
    ],
    "personal.js": [
        ('content("I’ve lived the impact of manually provisioned ICAM", "Thesis")', 'content("The everyday impact of manually provisioned ICAM", "Thesis")'),
        ('"The phone book (DITM)"', '"The phone book"'),
        ("Active Directory fed the agency phone book, but nothing fed Active Directory from HR. Titles, offices, phone numbers and managers stayed wrong until someone filed a ticket.",
         "Active Directory feeds the agency phone book, but nothing feeds Active Directory from HR. Titles, offices, phone numbers and managers stay wrong until someone files a ticket."),
        ("My organization, my manager, and my access to tools such as SAM were updated by hand",
         "A person\\u2019s organization, manager and access to tools are updated by hand"),
        ("The phone book, approvals and SAM access follow", "The phone book, approvals and tool access follow"),
    ],
    "teaser.js": [
        ("More modernizations I\\u2019ve designed for the agency", "More modernizations I\\u2019ve designed"),
        ("I've designed for the agency over the last several years", "I've designed over the last several years"),
    ],
}
PERSONAL_NOTES = """Why this matters to everyone who works in an agency.

In many agencies Active Directory feeds the phone book, and nothing feeds Active Directory from HR. Titles, offices, phone numbers and managers stay wrong until someone notices and files a ticket.

And every time someone changes management, their organization, their manager and their access to tools have to be updated by hand, after the fact, by ticket.

HR already knows all of it. With HR-driven IT, the personnel action that records the reassignment updates the organization and manager in Entra ID and Active Directory, and the phone book, the approval chain and tool access follow from the authoritative source — instead of each person, and the help desk, keeping them current by hand."""

anyp = {}
for f, s in src.items():
    for a, b in ANY.get(f, []):
        n = s.count(a)
        if n < 1:
            sys.exit(f"Any Agency: anchor not found in {f}: {a[:70]!r}")
        s = s.replace(a, b)
    anyp[f] = s
m = re.search(r"(\]  )Why this matters to me personally.*?(?=\n\nWorkbook:)", anyp["personal.js"], re.S)
assert m, "personal notes"
anyp["personal.js"] = anyp["personal.js"][:m.start()] + m.group(1) + PERSONAL_NOTES + anyp["personal.js"][m.end():]
built = assemble(anyp)
left = re.findall(r".{0,40}\b(SSA|DITM|SAM)\b.{0,40}", built)
if left:
    sys.exit("Any Agency edition still mentions: " + " | ".join(left[:10]))
open("build_AnyAgency.js", "w", encoding="utf-8").write(built)
print("editions written")
