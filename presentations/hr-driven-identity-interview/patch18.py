"""Name the Mainframe PIN as SSA's enterprise person key (slides 8 and 9)."""
p = "slides4.js"
s = open(p, encoding="utf-8").read()


def r(a, b):
    global s
    assert s.count(a) == 1, (a[:70], s.count(a))
    s = s.replace(a, b)


r('["Enterprise person key", "The person, across every affiliation", "The agency\\u2019s identifier decision", "Never, once assigned"],',
  '["Enterprise person key (Mainframe PIN)", "The person, across every affiliation", "SSA \\u2014 the existing Mainframe PIN", "Never, once assigned"],')
r('{ text: "The decision this requires: ", options: { bold: true, color: HEX.amber } },\n    { text: "which key is the enterprise person key \\u2014 and how every source, directory and credential key maps to it." },',
  '{ text: "SSA already has the key: ", options: { bold: true, color: HEX.amber } },\n    { text: "the Mainframe PIN. Confirm it as the enterprise person key, and map Core HCM\\u2019s PersonNumber and every directory and credential key to it." },')
r("The person is the tracked entity, not the account. That's what survives rehire, conversion and reorganization — and when SSA moves to Core HCM, only the source key changes; nothing downstream has to. The decision this requires is which key is the enterprise person key, and how everything else maps to it.",
  "The person is the tracked entity, not the account. That's what survives rehire, conversion and reorganization. And SSA already has its enterprise person key: the Mainframe PIN, which today is our person ID and employee ID. So the decision is to confirm the Mainframe PIN as the enterprise key and map Core HCM's PersonNumber to it — then when SSA moves to Core HCM, only the source key changes, and nothing downstream has to.")
r('["Person (enterprise key)", "personKey", "employeeId", "employeeID", "Audit and SIEM joins"],',
  '["Person (Mainframe PIN)", "personKey = Mainframe PIN", "employeeId", "employeeID", "Audit and SIEM joins"],')
r("In the middle is the logical model: a person with an enterprise key the agency controls,",
  "In the middle is the logical model: a person keyed by the Mainframe PIN — carried in employee ID in both directories —")
open(p, "w", encoding="utf-8").write(s)
print("ok")
