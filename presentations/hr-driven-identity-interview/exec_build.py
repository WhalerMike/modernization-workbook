"""Executive cut, both editions: seven decision slides, then the full deck as backup.

Writes build_Exec_SSA.js and build_Exec_AnyAgency.js. Reuses editions.py's per-edition
sources (importing it also refreshes build_SSA.js / build_AnyAgency.js).
"""
import re
import sys

import editions  # noqa: E402  (writes the 16-slide builds and exposes ssa / anyp)

EXEC = open("exec.js", encoding="utf-8").read()
T1 = "// ------------------------------------------------------------------ 1 Title"
T2 = "// ------------------------------------------------------------------ 2 Thesis"
WIN = "// ------------------------------------------------------------------ 4 Window"

DIVIDER = '''
// ------------------------------------------------------------------ Backup divider
pres.addSection({ title: "Backup" });
{
  const s = pres.addSlide({ masterName: "Title", sectionTitle: "Backup" });
  n++;
  s.addText("Backup", { placeholder: "title" });
  s.addText("Detail for questions — not presented", { placeholder: "body" });
  s.addNotes("Backup. The slides that follow are the detailed case, for questions only.");
}
{
  const s = content("Sources behind the executive slides", "Backup");
  const rows = (EDITION === "SSA" ? [
    ["SSA OIG, Insider Threat Program (142302), Sept. 30, 2026", "Sampled personnel separated July 2024–June 2025: deficiencies in disabling access and revoking credentials. SSA agreed."],
    ["SSA OIG, Information Security Program and Practices for FY 2026 (142603), Sept. 2026", "Overall “Not Effective” (Level 3); identity and access management up to Level 4; recommends continued improvement in user-account oversight; data and metadata inventory not comprehensive."],
    ["SSA OIG, Use of AWS Connect for Telephone Services (042512), Sept. 2026", "SSA moved telephone services to Amazon Connect in August 2024."],
    ["SSA, Human Resources Operational Data Store Core Services (US-GOV-SSA-469), data.gov", "Subset of the HR Operational Data Store supporting manager look-ups of employee job information."],
  ] : []).concat([
    ["NIST FIPS 201-3 (Jan. 2022); NIST SP 800-53 Rev. 5, PS-4", "Revoke credentials at separation; complete PIV termination within 18 hours if the card cannot be collected."],
    ["OMB/OPM memo, “Federal HR 2.0” (Dec. 10, 2025)", "Consolidates core HCM on Oracle Fusion Cloud HCM in agency waves; ~8-month onboarding; interconnections live ~month 5."],
  ]);
  s.addTable([head(["Source", "What it supports"]), ...rows.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }])],
    tableOpts([4.6, 7.55], { y: 1.45, fontSize: 13 }));
  s.addNotes("[Backup — for questions]  Sources for the executive slides." + (EDITION === "SSA" ? " Audit details beyond these summaries are withheld by OIG as sensitive." : ""));
}
'''


def backup(parts):
    s4 = parts["slides4.js"]
    helpers, body = s4[:s4.index(T1)], s4[s4.index(T2):]
    cut = body.index(WIN)
    body = body[:cut] + parts["personal.js"] + body[cut:] + parts["teaser.js"]
    body = re.sub(r'pres\.addSection\(\{ title: "[^"]+" \}\);\n', "", body)
    body = re.sub(r'(content\((?:"[^"]*"|[^,]+)), "(Thesis|The data|Identity and ICAM|Delivery|Beyond)"\)', r'\1, "Backup")', body)
    body = re.sub(r"addNotes\(\n`\[\d+:\d\d–\d+:\d\d\]  ", "addNotes(\n`[Backup — for questions]  ", body)
    return helpers, body


for name, parts, ed in [("SSA", editions.ssa, "SSA"), ("AnyAgency", editions.anyp, "ANY")]:
    helpers, body = backup(parts)
    js = parts["lib2.js"] + helpers + f'const EDITION = "{ed}";\n' + EXEC + DIVIDER + body + parts["tail.js"]
    # the Any Agency check runs on the built deck's text (exec.js holds both editions' strings)
    assert '"Thesis"' not in body and '"Delivery"' not in body, "backup section rename"
    open(f"build_Exec_{name}.js", "w", encoding="utf-8").write(js)

# spoken length of the seven executive slides at 135 wpm (stage cues and workbook lines excluded)
notes = re.findall(r"addNotes\(\n`\[[^\]]*\]  (.*?)`\);", EXEC, re.S)
words = sum(len(re.sub(r"\$\{E\(\"(.*?)\", \".*?\"\)\}", r"\1", t.split("\n\nWorkbook:")[0]).split()) for t in notes)
print(f"executive cut written; ~{words} spoken words = {words / 135:.1f} min at 135 wpm")
