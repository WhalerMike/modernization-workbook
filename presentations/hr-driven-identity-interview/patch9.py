"""Append a workbook reference to every slide's notes; recompute timing tags
(reference lines are not spoken, so they don't count toward time)."""
import re

REFS = [
    ("Good morning, and thank you.", "Chapter 00 — Overview and Applicability: The proposal; Why now; Why together"),
    ("The thesis in one slide.", "Chapter 00 — The proposal; Chapter 02 — Why this is the opportunity, not the project"),
    ("Why we need HR-driven ICAM at all", "Chapter 01 — Why the agency needs HR-driven ICAM now; Chapter 08 — The derivation chain"),
    ("Why this matters to me personally", "Chapter 01 — What HR-driven provisioning means; Chapter 08 — Access packages and access reviews"),
    ("The window.", "Chapter 02 — The program facts; Why this is the opportunity, not the project"),
    ("This is the heart of the proposal", "Chapter 05 — The standard-attribute layer; Contractors and vendors"),
    ("Personnel actions drive the lifecycle.", "Chapter 06 — Personnel actions are the triggers; Appendix A — Lifecycle Rules"),
    ("Logical and physical modeling", "Chapter 05 — The standard-attribute layer; The schema"),
    ("Logical architecture and Microsoft realization", "Chapter 04 — Logical architecture and Microsoft realization; Two landing zones; Over the Entra ID migration"),
    ("Identifiers are where data architecture", "Chapter 03 — One person, layered identifiers"),
    ("ICAM — beyond accounts.", "Chapter 07 — The canonical leaver sequence; Assurance as data; Chapter 08 — Where dynamic membership stops"),
    ("Privacy", "Chapter 03 — Privacy: identity is a routine-use consumer; Appendix B — Security and Privacy Assessment"),
    ("The governance I'd bring", "Chapter 09 — Drift, Metrics and Evidence; Chapter 10 — Execution Plan; Appendices A–C"),
    ("One standard, shared across agencies.", "Chapter 02 — Federal HR 2.0; Chapter 05 — The standard-attribute layer"),
    ("The roadmap and the ask.", "Chapter 10 — Execution Plan; Appendix C — Acceptance and Cutover"),
    ("[Leave up during questions", "the same site's Whitepapers, Next-Generation DDI, Client-Server to Hybrid Cloud and Operational Guides sections"),
]
files = ["slides4.js", "personal.js", "teaser.js"]
src = {f: open(f, encoding="utf-8").read() for f in files}
NOTE = re.compile(r"(addNotes\(\n`)(.*?)(`\);)", re.S)

for f in files:
    def add(m):
        body = m.group(2)
        body = re.sub(r"\n\nWorkbook: .*\Z", "", body, flags=re.S)  # idempotent
        head = re.sub(r"^\[[^\]]*\]\s+", "", body)
        for key, ref in REFS:
            if head.startswith(key) or body.startswith(key):
                body = body + "\n\nWorkbook: HR-Driven Identity, " + ref + "."
                break
        else:
            raise SystemExit(f"no ref for note starting: {head[:40]!r}")
        return m.group(1) + body + m.group(3)
    src[f] = NOTE.sub(add, src[f])

# recompute timing tags in deck order (teaser is untimed)
a_end = src["slides4.js"].index("// ------------------------------------------------------------------ 4 Window")
order = [("slides4.js", 0, a_end), ("personal.js", 0, len(src["personal.js"])), ("slides4.js", a_end, len(src["slides4.js"]))]
WPM, t = 135, 0.0
fmt = lambda x: f"{int(x // 60)}:{int(x % 60):02d}"
TAG = re.compile(r"addNotes\(\n`\[(\d+:\d\d)–(\d+:\d\d)\]  (.*?)`\);", re.S)
out = {}
for f, a, b in order:
    def fix(m):
        global t
        spoken = m.group(3).split("\n\nWorkbook:")[0]
        start, t_end = t, t + len(spoken.split()) / WPM * 60
        t = t_end
        return f"addNotes(\n`[{fmt(start)}–{fmt(t_end)}]  {m.group(3)}`);"
    out.setdefault(f, []).append((a, b, TAG.sub(fix, src[f][a:b])))
for f, parts in out.items():
    s = src[f]
    for a, b, new in sorted(parts, reverse=True):
        s = s[:a] + new + s[b:]
    src[f] = s
for f in files:
    open(f, "w", encoding="utf-8").write(src[f])
print("spoken minutes", round(t / 60, 1))
