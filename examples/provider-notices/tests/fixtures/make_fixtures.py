import json, copy, sys, calendar
from pathlib import Path
from datetime import datetime

root = Path(sys.argv[1])


def w(rel, obj):
    p = root / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    with open(p, "w", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(obj, indent=2) + "\n")


def ep(s):  # ISO -> epoch seconds (AWS Health API)
    return calendar.timegm(datetime.strptime(s, "%Y-%m-%dT%H:%M:%SZ").timetuple()) + 0.0


S1 = "00000000-0000-0000-0000-00000000aa01"
S2 = "00000000-0000-0000-0000-00000000aa02"


def az(sub, tid, et, st, title, summ, start, end, upd, impact, sub_type="", level="Warning", prio=10):
    return {"subscriptionId": sub, "trackingId": tid, "eventType": et, "eventSubType": sub_type, "status": st,
            "description": title, "summary": summ, "priority": prio, "level": level,
            "impactStartTime": start, "impactMitigationTime": end, "lastUpdateTime": upd, "impact": impact}


def imp(svc, *regions):
    return [{"ImpactedService": svc, "ImpactedRegions": [{"ImpactedRegion": r} for r in regions]}]


def res(sub, tid, rg, name, rtype):
    rid = f"/subscriptions/{sub}/resourceGroups/{rg}/providers/{rtype}/{name}"
    return {"subscriptionId": sub, "TrackingId": tid, "resourceName": name, "resourceGroup": rg, "resourceType": rtype,
            "details": {"resourceName": name, "resourceGroup": rg, "targetResourceType": rtype, "targetResourceId": rid},
            "id": f"/subscriptions/{sub}/providers/Microsoft.ResourceHealth/events/{tid}/impactedResources/{name}"}


def argout(rows):
    return {"count": len(rows), "data": rows, "skip_token": None, "total_records": len(rows)}


# ---------------- Azure: az graph query output for the kit's two queries (rows invented; columns from Learn's samples)
vm_issue = "Starting at 09:10 UTC on 9 Nov 2026, a subset of customers using Virtual Machines in East US may experience connection failures. Engineers are investigating."
ev1 = [
    az(S1, "AB1C-2DE", "ServiceIssue", "Active", "Virtual Machines - East US - Connectivity issues", vm_issue,
       "2026-11-09T09:10:00Z", None, "2026-11-09T11:30:00Z", imp("Virtual Machines", "East US"), level="Error", prio=2),
    az(S2, "AB1C-2DE", "ServiceIssue", "Active", "Virtual Machines - East US - Connectivity issues", vm_issue,
       "2026-11-09T09:10:00Z", None, "2026-11-09T11:30:00Z", imp("Virtual Machines", "East US"), level="Error", prio=2),
    az(S1, "HA9Q-0RS", "HealthAdvisory", "Active", "Update clients to TLS 1.2 or later for Azure Storage",
       "Azure Storage will stop accepting TLS 1.0 and 1.1. Most clients already use TLS 1.2; check older applications.",
       "2026-10-01T00:00:00Z", "2027-02-01T00:00:00Z", "2026-10-01T00:00:00Z", imp("Storage", "East US", "East US 2"), level="Informational", prio=18),
    az(S1, "PM3F-4GH", "PlannedMaintenance", "Active", "Planned maintenance: Virtual Machines in East US 2",
       "Azure will perform host maintenance on virtual machines in East US 2. Virtual machines may pause for up to 30 seconds. You can start maintenance yourself before the window.",
       "2026-11-20T02:00:00Z", "2026-11-21T02:00:00Z", "2026-11-02T15:00:00Z", imp("Virtual Machines", "East US 2"), level="Informational", prio=12),
    az(S1, "RT5J-6KL", "HealthAdvisory", "Active", "Retirement: Basic SKU public IP addresses",
       "Basic SKU public IP addresses will be retired on 30 September 2027. Upgrade to Standard SKU public IP addresses before then.",
       "2026-09-30T00:00:00Z", "2027-09-30T00:00:00Z", "2026-09-30T00:00:00Z", imp("Virtual Network", "East US", "East US 2"),
       sub_type="Retirement", level="Informational", prio=15),
    az(S1, "SA7M-8NP", "SecurityAdvisory", "Active", "Security advisory: action recommended for Azure Kubernetes Service clusters",
       "A vulnerability affects some node images. Upgrade affected node pools to the latest node image.",
       "2026-11-05T00:00:00Z", "2026-12-05T00:00:00Z", "2026-11-05T18:00:00Z", imp("Azure Kubernetes Service", "East US"), level="Warning", prio=4),
]
im1 = [res(S1, "AB1C-2DE", "rg-app", "vm-app01", "Microsoft.Compute/virtualMachines"),
       res(S1, "PM3F-4GH", "rg-data", "vm-db01", "Microsoft.Compute/virtualMachines"),
       res(S1, "RT5J-6KL", "rg-net", "pip-legacy01", "Microsoft.Network/publicIPAddresses")]
w("day1/azure/service-health-events.json", argout(ev1))
w("day1/azure/impacted-resources.json", argout(im1))
ev2 = [copy.deepcopy(r) for r in ev1 if r["trackingId"] != "AB1C-2DE"]
for r in ev2:
    if r["trackingId"] == "PM3F-4GH":
        r["impactStartTime"] = "2026-11-24T02:00:00Z"
        r["impactMitigationTime"] = "2026-11-25T02:00:00Z"
        r["lastUpdateTime"] = "2026-11-12T10:00:00Z"
        r["summary"] = "Rescheduled. Azure will perform host maintenance on virtual machines in East US 2. Virtual machines may pause for up to 30 seconds."
ev2.append(az(S2, "NW1T-2UV", "PlannedMaintenance", "Active", "Planned maintenance: Azure SQL Database in Central US",
              "Azure SQL Database will apply a service update in Central US. Connections may drop briefly; retry logic handles it.",
              "2026-11-28T04:00:00Z", "2026-11-28T08:00:00Z", "2026-11-14T09:00:00Z", imp("SQL Database", "Central US"), level="Informational", prio=14))
ev2.sort(key=lambda r: (r["trackingId"], r["subscriptionId"]))
w("day2/azure/service-health-events.json", argout(ev2))
w("day2/azure/impacted-resources.json", argout([r for r in im1 if r["TrackingId"] != "AB1C-2DE"]))

# ---------------- Microsoft 365: Graph service communications API (shapes from Learn's list samples)
G = "https://graph.microsoft.com/v1.0"


def mc(i, title, cat, sev, tags, services, start, end, mod, by, body, major=False):
    return {"startDateTime": start, "endDateTime": end, "lastModifiedDateTime": mod, "title": title, "id": i,
            "category": cat, "severity": sev, "tags": tags, "isMajorChange": major, "actionRequiredByDateTime": by,
            "services": services, "expiryDateTime": None, "details": [], "body": {"contentType": "Html", "content": body}, "viewPoint": None}


msgs1 = [
    mc("MC900001", "Retirement of Basic authentication for SMTP AUTH client submission", "PlanForChange", "High", ["Retirement", "Admin impact"],
       ["Exchange Online"], "2026-10-15T18:00:00Z", "2027-03-31T07:00:00Z", "2026-10-15T18:00:00Z", "2027-01-31T08:00:00Z",
       "<p>We're retiring Basic authentication for <b>SMTP AUTH</b>. Move applications to OAuth before <i>January 31, 2027</i>.</p>", True),
    mc("MC900002", "New meeting recap features in Microsoft Teams", "StayInformed", "Normal", ["New feature", "User impact"],
       ["Microsoft Teams"], "2026-11-01T18:00:00Z", "2026-12-31T08:00:00Z", "2026-11-01T18:00:00Z", None,
       "<p>Meeting recap adds chapters and speaker notes. No action is needed.</p>"),
    mc("MC900003", "Update SharePoint Framework solutions that use a deprecated library", "PreventOrFixIssue", "Normal", ["Admin impact"],
       ["SharePoint Online"], "2026-11-03T18:00:00Z", "2027-01-15T08:00:00Z", "2026-11-03T18:00:00Z", None,
       "<p>Solutions built with an older library version may stop loading. Rebuild them with the current version.</p>"),
    mc("MC900004", "Microsoft Viva: new insights dashboard", "StayInformed", "Normal", ["New feature"],
       ["Microsoft Viva"], "2026-11-04T18:00:00Z", "2026-12-15T08:00:00Z", "2026-11-04T18:00:00Z", None, "<p>A new dashboard is rolling out.</p>"),
]


def issue(i, title, cls, status, service, feature, start, end, mod, resolved, desc):
    return {"startDateTime": start, "endDateTime": end, "lastModifiedDateTime": mod, "title": title, "id": i, "impactDescription": desc,
            "classification": cls, "origin": "Microsoft", "status": status, "service": service, "feature": feature, "featureGroup": feature,
            "isResolved": resolved, "details": [],
            "posts": [{"createdDateTime": start, "postType": "Regular", "description": {"contentType": "Html", "content": "Title: " + title}}]}


iss1 = [
    issue("EX900101", "Some users may see delays receiving external email", "Incident", "ServiceDegradation", "Exchange Online", "Mail flow",
          "2026-11-09T08:40:00Z", None, "2026-11-09T11:00:00Z", False, "Users may see delays of up to 30 minutes receiving email from external senders."),
    issue("TM900102", "Users couldn't load the Teams web app in some browsers", "Advisory", "ServiceRestored", "Microsoft Teams", "Teams web client",
          "2026-11-06T13:00:00Z", "2026-11-06T16:30:00Z", "2026-11-06T17:00:00Z", True, "Some users saw a blank page in the Teams web app."),
]
hov = {"value": [{"service": "Exchange Online", "status": "ServiceDegradation", "id": "Exchange"},
                 {"service": "Microsoft Teams", "status": "ServiceOperational", "id": "microsoftteams"},
                 {"service": "SharePoint Online", "status": "ServiceOperational", "id": "SharePoint"}]}


def page(kind, rows):
    return {"@odata.context": f"{G}/$metadata#admin/serviceAnnouncement/{kind}", "value": rows}


w("day1/m365/messages.json", page("messages", msgs1))
w("day1/m365/issues.json", page("issues", iss1))
w("day1/m365/health-overviews.json", hov)
msgs2 = copy.deepcopy(msgs1)
msgs2[2]["lastModifiedDateTime"] = "2026-11-12T18:00:00Z"
msgs2[2]["title"] = "(Updated) Update SharePoint Framework solutions that use a deprecated library"
msgs2[2]["tags"] = ["Updated message", "Admin impact"]
msgs2.append(mc("MC900005", "Action required: register your apps for the new mail sender policy", "PlanForChange", "High", ["Admin impact"],
                ["Exchange Online"], "2026-11-14T18:00:00Z", "2027-04-30T07:00:00Z", "2026-11-14T18:00:00Z", "2027-02-28T08:00:00Z",
                "<p>Register each application that sends mail as your domain before February 28, 2027.</p>"))
iss2 = copy.deepcopy(iss1)
iss2[0].update({"status": "ServiceRestored", "isResolved": True, "endDateTime": "2026-11-09T15:10:00Z", "lastModifiedDateTime": "2026-11-09T15:30:00Z"})
w("day2/m365/messages.json", page("messages", msgs2))
w("day2/m365/issues.json", page("issues", iss2))
hov2 = copy.deepcopy(hov)
hov2["value"][0]["status"] = "ServiceOperational"
w("day2/m365/health-overviews.json", hov2)


# ---------------- OCI: the CLI's {"data": ...} around the API's AnnouncementsCollection (fields from Oracle's SDK models)
def oa(n, atype, summary, services, regions, t1, t2, created, updated, chain, state="ACTIVE"):
    a = {"id": f"ocid1.announcement.oc1..aaaaaaaaexample{n:02d}", "type": "Announcement", "referenceTicketNumber": f"EXAMPLE-{n:04d}",
         "summary": summary, "services": services, "affectedRegions": regions, "announcementType": atype, "lifecycleState": state,
         "isBanner": False, "timeCreated": created, "timeUpdated": updated, "environmentName": "PROD", "platformType": "IAAS", "chainId": chain}
    if t1:
        a.update({"timeOneTitle": t1[0], "timeOneType": t1[1], "timeOneValue": t1[2]})
    if t2:
        a.update({"timeTwoTitle": t2[0], "timeTwoType": t2[1], "timeTwoValue": t2[2]})
    return a


oci1 = [
    oa(1, "SCHEDULED_MAINTENANCE", "Scheduled maintenance for Base Database Service in US East (Ashburn)", ["Base Database Service"], ["us-ashburn-1"],
       ("Start Time", "START_TIME", "2026-11-22T04:00:00Z"), ("End Time", "END_TIME", "2026-11-22T08:00:00Z"),
       "2026-11-02T16:00:00Z", "2026-11-02T16:00:00Z", "chain-example-01"),
    oa(2, "ACTION_REQUIRED", "Action required: replace the certificate bundle on load balancers before it expires", ["Load Balancer"],
       ["us-ashburn-1", "us-phoenix-1"], ("Action Required By", "ACTION_REQUIRED_BY", "2026-12-15T00:00:00Z"), None,
       "2026-11-04T14:00:00Z", "2026-11-04T14:00:00Z", "chain-example-02"),
    oa(3, "INFORMATION", "New compute shapes are available in US West (Phoenix)", ["Compute"], ["us-phoenix-1"], None, None,
       "2026-11-05T12:00:00Z", "2026-11-05T12:00:00Z", "chain-example-03"),
    oa(4, "PRODUCTION_EVENT_NOTIFICATION", "Object Storage requests returned errors in US East (Ashburn)", ["Object Storage"], ["us-ashburn-1"],
       ("Time Detected", "TIME_DETECTED", "2026-11-03T07:20:00Z"), ("End Time", "END_TIME", "2026-11-03T08:05:00Z"),
       "2026-11-03T07:30:00Z", "2026-11-03T09:00:00Z", "chain-example-04", state="INACTIVE"),
]


def det(a, desc, resources):
    d = dict(a)
    d["description"] = desc
    d["additionalInformation"] = None
    d["affectedResources"] = [{"resourceId": r, "resourceName": r.split(".")[-1], "region": a["affectedRegions"][0], "additionalProperties": []}
                              for r in resources]
    return {"data": d}


dets1 = {
    oci1[0]["id"]: det(oci1[0], "The database systems listed below will be patched during the window. Each node restarts once.", ["ocid1.dbsystem.oc1.iad.exampledb01"]),
    oci1[1]["id"]: det(oci1[1], "Replace the certificate bundle on each listed load balancer listener before the date shown.", ["ocid1.loadbalancer.oc1.iad.examplelb01"]),
    oci1[2]["id"]: det(oci1[2], "New shapes are available. No action is needed.", []),
    oci1[3]["id"]: det(oci1[3], "Requests to Object Storage returned 503 errors for 45 minutes. The service has recovered.", []),
}
w("day1/oci/announcements.json", {"data": {"items": oci1, "userStatuses": []}})
w("day1/oci/announcement-details.json", dets1)
oci2 = copy.deepcopy(oci1)
resched = oa(5, "EMERGENCY_MAINTENANCE_RESCHEDULED", "Rescheduled: maintenance for Base Database Service in US East (Ashburn)", ["Base Database Service"],
             ["us-ashburn-1"], ("New Start Time", "NEW_START_TIME", "2026-11-29T04:00:00Z"), ("New End Time", "NEW_END_TIME", "2026-11-29T08:00:00Z"),
             "2026-11-13T10:00:00Z", "2026-11-13T10:00:00Z", "chain-example-01")
oci2.append(resched)
dets2 = dict(dets1)
dets2[resched["id"]] = det(resched, "The maintenance moved one week. The database systems listed below will be patched during the new window.",
                           ["ocid1.dbsystem.oc1.iad.exampledb01"])
w("day2/oci/announcements.json", {"data": {"items": oci2, "userStatuses": []}})
w("day2/oci/announcement-details.json", dets2)

# ---------------- AWS Health: aws health CLI output (shapes from the API reference; times in epoch seconds)
A = "111122223333"


def ev(svc, code, cat, n, region, start, end, upd, status, scope="ACCOUNT_SPECIFIC", act=None, personas=None):
    e = {"arn": f"arn:aws:health:{region}::event/{svc}/{code}/{code}_EXAMPLE{n:02d}", "service": svc, "eventTypeCode": code,
         "eventTypeCategory": cat, "region": region, "startTime": ep(start), "lastUpdatedTime": ep(upd), "statusCode": status, "eventScopeCode": scope}
    if end:
        e["endTime"] = ep(end)
    if act:
        e["actionability"] = act
    if personas:
        e["personas"] = personas
    return e


aws1 = [
    ev("EC2", "AWS_EC2_INSTANCE_RETIREMENT_SCHEDULED", "scheduledChange", 1, "us-east-1", "2026-12-01T00:00:00Z", None, "2026-11-05T10:00:00Z",
       "upcoming", act="ACTION_REQUIRED", personas=["OPERATIONS"]),
    ev("RDS", "AWS_RDS_MAINTENANCE_SCHEDULED", "scheduledChange", 2, "us-east-1", "2026-11-23T06:00:00Z", "2026-11-23T07:00:00Z",
       "2026-11-06T10:00:00Z", "upcoming", act="ACTION_MAY_BE_REQUIRED", personas=["OPERATIONS"]),
    ev("LAMBDA", "AWS_LAMBDA_PLANNED_LIFECYCLE_EVENT", "scheduledChange", 3, "us-west-2", "2027-01-15T00:00:00Z", None, "2026-11-01T13:44:13Z",
       "upcoming", personas=["OPERATIONS"]),
    ev("IAM", "AWS_IAM_SECURITY_NOTIFICATION", "accountNotification", 4, "us-east-1", "2026-11-08T00:00:00Z", None, "2026-11-08T12:00:00Z",
       "open", act="ACTION_REQUIRED", personas=["SECURITY"]),
    ev("S3", "AWS_S3_OPERATIONAL_ISSUE", "issue", 5, "us-east-1", "2026-11-07T14:00:00Z", "2026-11-07T15:10:00Z", "2026-11-07T15:30:00Z",
       "closed", scope="PUBLIC"),
]
descs = {
    1: "EC2 has detected degradation of the underlying hardware hosting your instance. The instance is scheduled for retirement; stop and start it before the date to move it to healthy hardware.",
    2: "A required maintenance update is scheduled for your DB instance during its maintenance window.",
    3: "The runtime your function uses reaches end of support. Update the function to a supported runtime before the date.",
    4: "We detected an access key for an IAM user in a public location. Rotate the key and review recent activity.",
    5: "Between 14:00 and 15:10 UTC, some requests to Amazon S3 in US-EAST-1 returned errors. The issue is resolved.",
}


def details(evs):
    return {"successfulSet": [{"event": e, "eventDescription": {"latestDescription": descs[int(e["arn"][-2:])]}, "eventMetadata": {}} for e in evs],
            "failedSet": []}


ents = {1: f"arn:aws:ec2:us-east-1:{A}:instance/i-0abc1234example", 2: f"arn:aws:rds:us-east-1:{A}:db:example-db-01",
        3: f"arn:aws:lambda:us-west-2:{A}:function:example-function", 4: f"arn:aws:iam::{A}:user/example-user"}


def entities(evs):
    out = []
    for e in evs:
        n = int(e["arn"][-2:])
        if n in ents:
            out.append({"entityArn": ents[n], "eventArn": e["arn"], "entityValue": ents[n].split(":")[-1].split("/")[-1], "awsAccountId": A,
                        "lastUpdatedTime": e["lastUpdatedTime"], "statusCode": "PENDING" if e["statusCode"] != "closed" else "RESOLVED"})
    return {"entities": out}


w("day1/aws/describe-events.json", {"events": aws1})
w("day1/aws/describe-event-details.json", details(aws1))
w("day1/aws/describe-affected-entities.json", entities(aws1))
aws2 = copy.deepcopy(aws1)
aws2[3]["statusCode"] = "closed"
aws2[3]["endTime"] = ep("2026-11-12T00:00:00Z")
aws2[3]["lastUpdatedTime"] = ep("2026-11-12T00:00:00Z")
w("day2/aws/describe-events.json", {"events": aws2})
w("day2/aws/describe-event-details.json", details(aws2))
w("day2/aws/describe-affected-entities.json", entities(aws2))

# ---------------- Google Cloud Personalized Service Health: REST list response (shape from the v1 reference)
P = "projects/contoso-example-prod/locations/global/events"


def gev(eid, title, state, dstate, product, loc, start, end, upd, relevance, updates):
    e = {"name": f"{P}/{eid}", "title": title, "description": "", "category": "INCIDENT", "detailedCategory": "CONFIRMED_INCIDENT",
         "state": state, "detailedState": dstate,
         "eventImpacts": [{"product": {"productName": product, "id": "example-product"}, "location": {"locationName": loc}}],
         "relevance": relevance, "updates": updates, "parentEvent": "", "updateTime": upd, "startTime": start, "nextUpdateTime": ""}
    if end:
        e["endTime"] = end
    return e


g1 = [
    gev("example-incident-01", "Cloud SQL connection errors in us-east4", "ACTIVE", "CONFIRMED", "Google Cloud SQL", "us-east4",
        "2026-11-09T07:45:00Z", None, "2026-11-09T10:00:00Z", "IMPACTED",
        [{"updateTime": "2026-11-09T08:00:00Z", "title": "Investigating", "description": "We are investigating connection errors for Cloud SQL in us-east4.",
          "symptom": "Connection timeouts", "workaround": "Retry with backoff"},
         {"updateTime": "2026-11-09T10:00:00Z", "title": "Mitigation in progress", "description": "A mitigation is rolling out. Error rates are falling.",
          "symptom": "Connection timeouts", "workaround": "Retry with backoff"}]),
    gev("example-incident-02", "Cloud Storage latency in us-central1", "CLOSED", "RESOLVED", "Cloud Storage", "us-central1",
        "2026-11-04T12:00:00Z", "2026-11-04T13:20:00Z", "2026-11-04T13:30:00Z", "RELATED",
        [{"updateTime": "2026-11-04T13:30:00Z", "title": "Resolved", "description": "Latency returned to normal.", "symptom": "", "workaround": ""}]),
]
w("day1/google/events.json", {"events": g1})
g2 = copy.deepcopy(g1)
g2[0].update({"state": "CLOSED", "detailedState": "RESOLVED", "endTime": "2026-11-09T13:00:00Z", "updateTime": "2026-11-09T13:10:00Z"})
g2[0]["updates"].append({"updateTime": "2026-11-09T13:10:00Z", "title": "Resolved", "description": "The issue is resolved for all affected projects.",
                         "symptom": "", "workaround": ""})
w("day2/google/events.json", {"events": g2})
print("ok")
