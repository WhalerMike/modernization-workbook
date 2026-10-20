p = "exec.js"
s = open(p, encoding="utf-8").read()
R = [
 ("Removal waits for a ticket \u2014 but the federal standard is to revoke credentials within 18 hours.",
  "Removal waits for a ticket, yet federal standards require revoking credentials at separation."),
 ("The federal standard is eighteen hours.",
  "And when a PIV card can't be collected, the federal standard is to terminate it within eighteen hours."),
 ("The federal standard is to revoke a separated person's credentials within eighteen hours, and a ticket-driven process struggles to meet it.",
  "Federal standards require revoking a separated person's credentials, and terminating a PIV card that can't be collected within eighteen hours. A ticket-driven process struggles to meet that."),
 ("Within hours \u2014 inside the 18-hour federal standard",
  "Within hours \u2014 PIV termination standard is 18 hours"),
 ("time from separation to blocked access, in hours, inside the eighteen-hour federal standard;",
  "time from separation to blocked access, in hours, well inside the eighteen-hour federal standard for terminating a PIV card;"),
]
for a, b in R:
    assert s.count(a) == 1, (a[:60], s.count(a))
    s = s.replace(a, b)
open(p, "w", encoding="utf-8").write(s)
print("ok")
