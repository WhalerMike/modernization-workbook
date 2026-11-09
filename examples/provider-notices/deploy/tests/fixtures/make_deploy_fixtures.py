import json, sys
from pathlib import Path

root = Path(sys.argv[1])
root.mkdir(parents=True, exist_ok=True)


def w(name, obj):
    with open(root / name, "w", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(obj, indent=2) + "\n")


TENANT = "00000000-0000-0000-0000-0000000000c0"
TENANCY = "ocid1.tenancy.oc1..aaaaaaaaexampletenancy"
w("settings.test.json", {
    "_comment": "A fictional test environment (contoso.example) for the deploy tests: Azure, Microsoft 365 and OCI enabled, AWS and Google off.",
    "environment": "test", "changeRecord": "CHG-EXAMPLE-0101", "outputRoot": "out/deploy-test",
    "providers": {
        "azure": {"enabled": True, "cloud": "AzureCloud", "subscriptions": ["00000000-0000-0000-0000-00000000aa01"], "managementGroup": "", "noticeContacts": ["cloud-ops@contoso.example"]},
        "m365": {"enabled": True, "cloud": "gcc", "tenantId": TENANT, "noticeContacts": ["m365-admins@contoso.example"]},
        "oci": {"enabled": True, "realm": "oc1", "region": "us-ashburn-1", "tenancyId": TENANCY, "noticeContacts": ["oci-admins@contoso.example"]},
        "aws": {"enabled": False, "partition": "aws", "accountId": "<account-id>", "profile": "", "noticeContacts": []},
        "google": {"enabled": False, "scope": "project", "project": "<project-id>", "organization": "", "noticeContacts": []},
    },
    "routing": {"path": "config/routing.json", "send": False, "endpoint": "", "tokenVariable": ""},
    "digest": {"days": 7, "upcomingDays": 30, "weekday": "Monday"},
    "azurePolicy": {"enabled": False, "scope": "", "location": "", "assignmentName": "pn-service-health-alerts", "parametersPath": ""},
    "schedule": {"taskName": "ProviderNotices-Weekly-Test"},
})
w("settings.production.json", {
    "_comment": "A fictional production environment (contoso.example) for the deploy tests: every provider enabled, the Service Health alert policy at a management group.",
    "environment": "production", "changeRecord": "CHG-EXAMPLE-0202", "outputRoot": "out/deploy-prod",
    "providers": {
        "azure": {"enabled": True, "cloud": "AzureCloud", "subscriptions": [], "managementGroup": "mg-contoso-example", "noticeContacts": ["cloud-ops@contoso.example"]},
        "m365": {"enabled": True, "cloud": "gcc", "tenantId": TENANT, "noticeContacts": ["m365-admins@contoso.example"]},
        "oci": {"enabled": True, "realm": "oc1", "region": "us-ashburn-1", "tenancyId": TENANCY, "noticeContacts": ["oci-admins@contoso.example"]},
        "aws": {"enabled": True, "partition": "aws", "accountId": "111122223333", "profile": "", "noticeContacts": ["aws-admins@contoso.example"]},
        "google": {"enabled": True, "scope": "project", "project": "contoso-example-prod", "organization": "", "noticeContacts": ["gcp-admins@contoso.example"]},
    },
    "routing": {"path": "config/routing.json", "send": True, "endpoint": "https://instance.contoso.example/api/x_example/provider_notices", "tokenVariable": "PN_SERVICENOW_TOKEN"},
    "digest": {"days": 7, "upcomingDays": 30, "weekday": "Monday"},
    "azurePolicy": {"enabled": True, "scope": "/providers/Microsoft.Management/managementGroups/mg-contoso-example", "location": "eastus", "assignmentName": "pn-service-health-alerts", "parametersPath": ""},
    "schedule": {"taskName": "ProviderNotices-Weekly"},
})
w("environment-test.json", {
    "_comment": "Fixture mode for the test environment: which tools are installed, which cloud each session is signed in to, and the folder the reads come from. Fictional.",
    "tools": {"az": True, "Microsoft.Graph.Authentication": True, "oci": True, "aws": False, "gcloud": False},
    "contexts": {"azure": "AzureCloud", "m365": {"Environment": "Global", "TenantId": TENANT}, "aws": ""},
    "readsFrom": "../../../tests/fixtures/day1",
    "policyDefinition": None,
})
w("environment-production.json", {
    "_comment": "Fixture mode for the production environment. The policy definition holds only the fields the plan reads; its role ID is a made-up GUID, not the real definition's.",
    "tools": {"az": True, "Microsoft.Graph.Authentication": True, "oci": True, "aws": True, "gcloud": True},
    "contexts": {"azure": "AzureCloud", "m365": {"Environment": "Global", "TenantId": TENANT}, "aws": "arn:aws:iam::111122223333:role/example-notice-reader"},
    "readsFrom": "../../../tests/fixtures/day2",
    "policyDefinition": {
        "name": "98903777-a9f6-47f5-90a9-acaf62ab01a8",
        "displayName": "Configure subscriptions to enable Service Health Monitoring Alert Rules",
        "policyRule": {"then": {"effect": "[parameters('effect')]", "details": {"roleDefinitionIds": ["/providers/Microsoft.Authorization/roleDefinitions/00000000-0000-0000-0000-00000000e001"]}}},
    },
})
print("ok")
