#!/usr/bin/env python3
"""Write the Azure security kit's fixtures: a fictional Contoso estate read twice, a week apart.

    python tests/fixtures/make_fixtures.py

week1/ is the estate on November 9, 2026; week2/ is the same estate on November 16, 2026, after some
fixes and some new drift. Each file is what one call in config/calls.json returns: Resource Graph
queries return {"count", "data", "skip_token", "total_count"} as `az graph query -o json` prints it, and
keyed REST calls are a map from the lower-cased key (a resource ID, subscription ID or group ID) to the
response body. Every ID, name, address and GUID is invented; addresses are from documentation ranges or
private ranges. Standard library only. Rerunning gives the same bytes.
"""
from __future__ import annotations

import copy
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent

TENANT = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
CONN = "11111111-1111-4111-8111-111111111111"
MGMT = "22222222-2222-4222-8222-222222222222"
CORP = "33333333-3333-4333-8333-333333333333"
ONL = "44444444-4444-4444-8444-444444444444"
SUBS = {CONN: "sub-connectivity", MGMT: "sub-management", CORP: "sub-corp-payroll", ONL: "sub-online-portal"}
MG = "/providers/Microsoft.Management/managementGroups"


def rid(sub: str, rg: str, prov: str, name: str) -> str:
    return f"/subscriptions/{sub}/resourceGroups/{rg}/providers/{prov}/{name}"


WS = rid(MGMT, "rg-management", "Microsoft.OperationalInsights/workspaces", "law-contoso-platform")
WS_OTHER = rid(ONL, "rg-portal", "Microsoft.OperationalInsights/workspaces", "law-portal-app")

# Networks
HUB = rid(CONN, "rg-hub", "Microsoft.Network/virtualNetworks", "vnet-hub")
PAYROLL = rid(CORP, "rg-payroll-net", "Microsoft.Network/virtualNetworks", "vnet-payroll")
PORTAL = rid(ONL, "rg-portal-net", "Microsoft.Network/virtualNetworks", "vnet-portal")
PLAN = rid(CONN, "rg-hub", "Microsoft.Network/ddosProtectionPlans", "ddos-contoso")
PLAN2 = rid(ONL, "rg-portal-net", "Microsoft.Network/ddosProtectionPlans", "ddos-portal-trial")
RT_PAYROLL = rid(CORP, "rg-payroll-net", "Microsoft.Network/routeTables", "rt-payroll")
RT_PORTAL = rid(ONL, "rg-portal-net", "Microsoft.Network/routeTables", "rt-portal")
RT_JUMP = rid(ONL, "rg-portal-net", "Microsoft.Network/routeTables", "rt-jump")
RT_PE = rid(ONL, "rg-portal-net", "Microsoft.Network/routeTables", "rt-portal-pe")
FW = rid(CONN, "rg-hub", "Microsoft.Network/azureFirewalls", "afw-hub")
FWP = rid(CONN, "rg-hub", "Microsoft.Network/firewallPolicies", "afwp-hub")
NAT = rid(CONN, "rg-hub", "Microsoft.Network/natGateways", "nat-hub")
VNG = rid(CONN, "rg-hub", "Microsoft.Network/virtualNetworkGateways", "vng-hub")
NIC_JUMP = rid(ONL, "rg-portal", "Microsoft.Network/networkInterfaces", "nic-jump")
NIC_TEST = rid(ONL, "rg-portal", "Microsoft.Network/networkInterfaces", "nic-test-app")
NIC_API = rid(ONL, "rg-portal", "Microsoft.Network/networkInterfaces", "nic-api")
LB = rid(ONL, "rg-portal", "Microsoft.Network/loadBalancers", "lb-portal")
APPGW = rid(CONN, "rg-hub", "Microsoft.Network/applicationGateways", "appgw-portal")
APPGW_INT = rid(CORP, "rg-payroll-net", "Microsoft.Network/applicationGateways", "appgw-intranet")
WAFP = rid(CONN, "rg-hub", "Microsoft.Network/ApplicationGatewayWebApplicationFirewallPolicies", "wafp-portal")
AFD = rid(CONN, "rg-edge", "Microsoft.Cdn/profiles", "afd-portal")
AFD2 = rid(ONL, "rg-careers", "Microsoft.Cdn/profiles", "afd-careers")
AFDWAF = rid(CONN, "rg-edge", "Microsoft.Network/frontdoorwebapplicationfirewallpolicies", "afdwafportal")
CLASSIC = rid(CORP, "rg-legacy", "Microsoft.Network/frontdoors", "fd-legacy-intranet")
APP_E = rid(ONL, "rg-portal", "Microsoft.Web/sites", "app-portal-east")
APP_W = rid(ONL, "rg-portal", "Microsoft.Web/sites", "app-portal-west")
ST_CAREERS = rid(ONL, "rg-careers", "Microsoft.Storage/storageAccounts", "stcareersweb")
ST_PAYROLL = rid(CORP, "rg-payroll", "Microsoft.Storage/storageAccounts", "stpayrolldata")
KV_PAYROLL = rid(CORP, "rg-payroll", "Microsoft.KeyVault/vaults", "kv-payroll")
KV_PORTAL = rid(ONL, "rg-portal", "Microsoft.KeyVault/vaults", "kv-portal")
KV_HUB = rid(CONN, "rg-hub", "Microsoft.KeyVault/vaults", "kv-hub-certs")
Z_KV = rid(CONN, "rg-dns", "Microsoft.Network/privateDnsZones", "privatelink.vaultcore.azure.net")
Z_BLOB = rid(CORP, "rg-payroll-net", "Microsoft.Network/privateDnsZones", "privatelink.blob.core.windows.net")
PE_KV = rid(CORP, "rg-payroll", "Microsoft.Network/privateEndpoints", "pe-kv-payroll")
PE_BLOB = rid(CORP, "rg-payroll", "Microsoft.Network/privateEndpoints", "pe-st-payroll-blob")
PE_QUEUE = rid(CORP, "rg-payroll", "Microsoft.Network/privateEndpoints", "pe-st-payroll-queue")
FDID_PORTAL = "9f3c2a10-5b7e-4c1d-8e2f-0a1b2c3d4e5f"
FDID_CAREERS = "1d2e3f40-6a7b-4c8d-9e0f-a1b2c3d4e5f6"


def pip(sub, rg, name, ip, attached="", nat="", mode="VirtualNetworkInherited", owner="", fqdn=""):
    return {"id": rid(sub, rg, "Microsoft.Network/publicIPAddresses", name), "name": name, "subscriptionId": sub,
            "resourceGroup": rg, "ip": ip, "fqdn": fqdn, "sku": "Standard", "ddosMode": mode, "attachedTo": attached,
            "natGateway": nat, "owner": owner}


def subnet(vnet, name, rt=None):
    s = {"name": name, "id": f"{vnet}/subnets/{name}", "properties": {}}
    if rt:
        s["properties"]["routeTable"] = {"id": rt}
    return s


def diag(ws, logs=None, name="to-workspace"):
    return {"name": name, "properties": {"workspaceId": ws, "logs": logs or [{"categoryGroup": "allLogs", "enabled": True}]}}


def arg(rows):
    return {"count": len(rows), "data": rows, "skip_token": None, "total_count": len(rows)}


def week1() -> dict:
    f: dict = {}
    f["arg-subscriptions"] = arg([{"subscriptionId": s, "name": n} for s, n in sorted(SUBS.items())])
    pips = [
        pip(CONN, "rg-hub", "pip-afw-hub", "203.0.113.10", f"{FW}/azureFirewallIpConfigurations/ipconfig1", owner="platform-team"),
        pip(CONN, "rg-hub", "pip-appgw-portal", "203.0.113.20", f"{APPGW}/frontendIPConfigurations/appGwPublicFrontendIp", owner="portal-team", fqdn="portal-gw.contoso.example"),
        pip(CONN, "rg-hub", "pip-nat-egress", "203.0.113.30", nat=NAT, owner="platform-team"),
        pip(CONN, "rg-hub", "pip-vpngw", "203.0.113.40", f"{VNG}/ipConfigurations/default", owner="platform-team"),
        pip(ONL, "rg-portal", "pip-jump", "198.51.100.10", f"{NIC_JUMP}/ipConfigurations/ipconfig1"),
        pip(ONL, "rg-portal", "pip-lb-portal", "198.51.100.20", f"{LB}/frontendIPConfigurations/fe-public", owner="portal-team"),
        pip(ONL, "rg-portal", "pip-orphan", "198.51.100.30"),
        pip(ONL, "rg-portal", "pip-test-app", "198.51.100.40", f"{NIC_TEST}/ipConfigurations/ipconfig1", mode="Enabled", owner="portal-team"),
    ]
    f["arg-public-ips"] = arg(sorted(pips, key=lambda r: r["id"]))
    f["arg-platform-resources"] = arg(sorted(
        [{"id": p["id"], "type": "microsoft.network/publicipaddresses", "subscriptionId": p["subscriptionId"]} for p in pips]
        + [{"id": FW, "type": "microsoft.network/azurefirewalls", "subscriptionId": CONN},
           {"id": APPGW, "type": "microsoft.network/applicationgateways", "subscriptionId": CONN},
           {"id": APPGW_INT, "type": "microsoft.network/applicationgateways", "subscriptionId": CORP},
           {"id": AFD, "type": "microsoft.cdn/profiles", "subscriptionId": CONN},
           {"id": AFD2, "type": "microsoft.cdn/profiles", "subscriptionId": ONL},
           {"id": KV_HUB, "type": "microsoft.keyvault/vaults", "subscriptionId": CONN},
           {"id": KV_PAYROLL, "type": "microsoft.keyvault/vaults", "subscriptionId": CORP},
           {"id": KV_PORTAL, "type": "microsoft.keyvault/vaults", "subscriptionId": ONL}], key=lambda r: r["id"]))
    f["arg-frontdoor-profiles"] = arg([
        {"id": AFD2, "name": "afd-careers", "subscriptionId": ONL, "sku": "Standard_AzureFrontDoor", "frontDoorId": FDID_CAREERS, "owner": "hr-web-team"},
        {"id": AFD, "name": "afd-portal", "subscriptionId": CONN, "sku": "Premium_AzureFrontDoor", "frontDoorId": FDID_PORTAL, "owner": "portal-team"}])
    f["arg-frontdoor-profiles"]["data"].sort(key=lambda r: r["id"])
    f["arg-classic-frontdoors"] = arg([{"id": CLASSIC, "name": "fd-legacy-intranet", "subscriptionId": CORP, "owner": "payroll-team"}])
    f["arg-app-gateways"] = arg(sorted([
        {"id": APPGW, "name": "appgw-portal", "subscriptionId": CONN, "skuTier": "WAF_v2", "wafPolicy": WAFP,
         "sslPolicy": {"policyType": "Predefined", "policyName": "AppGwSslPolicy20220101S"},
         "frontendIPConfigurations": [{"id": f"{APPGW}/frontendIPConfigurations/appGwPublicFrontendIp", "properties": {"publicIPAddress": {"id": pips[1]["id"]}}}],
         "gatewayIPConfigurations": [{"id": f"{APPGW}/gatewayIPConfigurations/appGwIpConfig", "properties": {"subnet": {"id": f"{HUB}/subnets/snet-appgw"}}}],
         "owner": "portal-team"},
        {"id": APPGW_INT, "name": "appgw-intranet", "subscriptionId": CORP, "skuTier": "Standard_v2", "wafPolicy": "",
         "sslPolicy": {"policyType": "Predefined", "policyName": "AppGwSslPolicy20150501"},
         "frontendIPConfigurations": [{"id": f"{APPGW_INT}/frontendIPConfigurations/fe-private", "properties": {"privateIPAddress": "10.20.1.10"}}],
         "gatewayIPConfigurations": [{"id": f"{APPGW_INT}/gatewayIPConfigurations/gw", "properties": {"subnet": {"id": f"{PAYROLL}/subnets/snet-app"}}}],
         "owner": "payroll-team"}], key=lambda r: r["id"]))
    f["arg-paas-public"] = arg(sorted([
        {"id": APP_E, "name": "app-portal-east", "type": "microsoft.web/sites", "subscriptionId": ONL, "publicNetworkAccess": "Enabled", "privateEndpoints": 0, "owner": "portal-team"},
        {"id": APP_W, "name": "app-portal-west", "type": "microsoft.web/sites", "subscriptionId": ONL, "publicNetworkAccess": "Enabled", "privateEndpoints": 0, "owner": "portal-team"},
        {"id": KV_HUB, "name": "kv-hub-certs", "type": "microsoft.keyvault/vaults", "subscriptionId": CONN, "publicNetworkAccess": "Enabled", "privateEndpoints": 0, "owner": "platform-team"},
        {"id": KV_PORTAL, "name": "kv-portal", "type": "microsoft.keyvault/vaults", "subscriptionId": ONL, "publicNetworkAccess": "Enabled", "privateEndpoints": 0, "owner": "portal-team"},
        {"id": ST_CAREERS, "name": "stcareersweb", "type": "microsoft.storage/storageaccounts", "subscriptionId": ONL, "publicNetworkAccess": "Enabled", "privateEndpoints": 0, "owner": "hr-web-team"},
        {"id": ST_PAYROLL, "name": "stpayrolldata", "type": "microsoft.storage/storageaccounts", "subscriptionId": CORP, "publicNetworkAccess": "Enabled", "privateEndpoints": 2, "owner": ""}],
        key=lambda r: r["id"]))
    f["arg-network-owners"] = arg(sorted([
        {"id": NIC_JUMP, "type": "microsoft.network/networkinterfaces", "ipConfigurations": [{"id": f"{NIC_JUMP}/ipConfigurations/ipconfig1", "properties": {"subnet": {"id": f"{PORTAL}/subnets/snet-jump"}}}], "gatewayIPConfigurations": None, "frontendIPConfigurations": None},
        {"id": NIC_TEST, "type": "microsoft.network/networkinterfaces", "ipConfigurations": [{"id": f"{NIC_TEST}/ipConfigurations/ipconfig1", "properties": {"subnet": {"id": f"{PORTAL}/subnets/snet-web"}}}], "gatewayIPConfigurations": None, "frontendIPConfigurations": None},
        {"id": FW, "type": "microsoft.network/azurefirewalls", "ipConfigurations": [{"id": f"{FW}/azureFirewallIpConfigurations/ipconfig1", "properties": {"subnet": {"id": f"{HUB}/subnets/AzureFirewallSubnet"}}}], "gatewayIPConfigurations": None, "frontendIPConfigurations": None},
        {"id": VNG, "type": "microsoft.network/virtualnetworkgateways", "ipConfigurations": [{"id": f"{VNG}/ipConfigurations/default", "properties": {"subnet": {"id": f"{HUB}/subnets/GatewaySubnet"}}}], "gatewayIPConfigurations": None, "frontendIPConfigurations": None},
        {"id": APPGW, "type": "microsoft.network/applicationgateways", "ipConfigurations": None,
         "gatewayIPConfigurations": [{"id": f"{APPGW}/gatewayIPConfigurations/appGwIpConfig", "properties": {"subnet": {"id": f"{HUB}/subnets/snet-appgw"}}}],
         "frontendIPConfigurations": [{"id": f"{APPGW}/frontendIPConfigurations/appGwPublicFrontendIp", "properties": {}}]},
        {"id": LB, "type": "microsoft.network/loadbalancers", "ipConfigurations": None, "gatewayIPConfigurations": None,
         "frontendIPConfigurations": [{"id": f"{LB}/frontendIPConfigurations/fe-public", "properties": {}}]}], key=lambda r: r["id"]))
    f["arg-vnets"] = arg(sorted([
        {"id": HUB, "name": "vnet-hub", "subscriptionId": CONN, "ddosEnabled": True, "ddosPlan": PLAN,
         "subnets": [subnet(HUB, "AzureFirewallSubnet"), subnet(HUB, "GatewaySubnet"), subnet(HUB, "snet-appgw")]},
        {"id": PAYROLL, "name": "vnet-payroll", "subscriptionId": CORP, "ddosEnabled": False, "ddosPlan": "",
         "subnets": [subnet(PAYROLL, "snet-app", RT_PAYROLL), subnet(PAYROLL, "snet-data")]},
        {"id": PORTAL, "name": "vnet-portal", "subscriptionId": ONL, "ddosEnabled": False, "ddosPlan": "",
         "subnets": [subnet(PORTAL, "snet-jump", RT_JUMP), subnet(PORTAL, "snet-pe", RT_PE), subnet(PORTAL, "snet-web", RT_PORTAL)]}],
        key=lambda r: r["id"]))
    f["arg-ddos-plans"] = arg(sorted([
        {"id": PLAN, "name": "ddos-contoso", "subscriptionId": CONN, "virtualNetworks": [{"id": HUB}]},
        {"id": PLAN2, "name": "ddos-portal-trial", "subscriptionId": ONL, "virtualNetworks": []}], key=lambda r: r["id"]))
    f["arg-nat-gateways"] = arg([{"id": NAT, "name": "nat-hub", "publicIpAddresses": [{"id": pips[2]["id"]}]}])
    alert = lambda name, scope, enabled=True: {
        "id": rid(CONN, "rg-monitor", "Microsoft.Insights/metricAlerts", name), "name": name, "enabled": enabled, "scopes": [scope],
        "criteria": [{"name": "c1", "metricName": "IfUnderDDoSAttack", "operator": "GreaterThanOrEqual", "threshold": 1, "timeAggregation": "Maximum"}],
        "actions": [{"actionGroupId": rid(MGMT, "rg-monitor", "Microsoft.Insights/actionGroups", "ag-security-monitor")}]}
    f["arg-metric-alerts"] = arg(sorted([alert("ddos-under-attack-pip-appgw-portal", pips[1]["id"]),
                                         alert("ddos-under-attack-pip-test-app", pips[7]["id"], enabled=False)], key=lambda r: r["id"]))
    f["arg-appgw-waf-policies"] = arg([
        {"id": WAFP, "name": "wafp-portal", "subscriptionId": CONN,
         "policySettings": {"mode": "Detection", "state": "Enabled", "requestBodyCheck": True},
         "managedRuleSets": [{"ruleSetType": "Microsoft_DefaultRuleSet", "ruleSetVersion": "2.1"}, {"ruleSetType": "Microsoft_BotManagerRuleSet", "ruleSetVersion": "1.1"}],
         "customRules": [{"name": "LoginRateLimitRule", "ruleType": "RateLimitRule", "action": "Block", "priority": 99}],
         "applicationGateways": [{"id": APPGW}]}])
    f["arg-afd-waf-policies"] = arg([
        {"id": AFDWAF, "name": "afdwafportal", "subscriptionId": CONN, "sku": "Premium_AzureFrontDoor",
         "policySettings": {"enabledState": "Enabled", "mode": "Prevention", "requestBodyCheck": "Enabled"},
         "managedRuleSets": [{"ruleSetType": "Microsoft_DefaultRuleSet", "ruleSetVersion": "2.1", "ruleSetAction": "Block"}],
         "customRules": [{"name": "rateLimitRule", "ruleType": "RateLimitRule", "action": "Block", "priority": 1}],
         "securityPolicyLinks": [{"id": f"{AFD}/securityPolicies/afd-portal-waf"}]}])
    f["arg-firewall-policies"] = arg([{"id": FWP, "name": "afwp-hub", "subscriptionId": CONN, "tier": "Premium", "threatIntelMode": "Alert", "idpsMode": "Alert", "tlsInspection": False, "firewalls": [{"id": FW}]}])
    f["arg-firewalls"] = arg([{"id": FW, "name": "afw-hub", "subscriptionId": CONN, "tier": "Premium", "policy": FWP,
                               "ipConfigurations": [{"id": f"{FW}/azureFirewallIpConfigurations/ipconfig1", "properties": {"privateIPAddress": "10.0.0.4", "subnet": {"id": f"{HUB}/subnets/AzureFirewallSubnet"}}}]}])
    route = lambda prefix, hop, ip=None: {"name": "default", "properties": {"addressPrefix": prefix, "nextHopType": hop, **({"nextHopIpAddress": ip} if ip else {})}}
    f["arg-route-tables"] = arg(sorted([
        {"id": RT_PAYROLL, "name": "rt-payroll", "subscriptionId": CORP, "routes": [route("0.0.0.0/0", "VirtualAppliance", "10.0.0.4")], "subnets": [{"id": f"{PAYROLL}/subnets/snet-app"}]},
        {"id": RT_PORTAL, "name": "rt-portal", "subscriptionId": ONL, "routes": [route("0.0.0.0/0", "Internet")], "subnets": [{"id": f"{PORTAL}/subnets/snet-web"}]},
        {"id": RT_JUMP, "name": "rt-jump", "subscriptionId": ONL, "routes": [route("0.0.0.0/0", "VirtualAppliance", "10.9.9.9")], "subnets": [{"id": f"{PORTAL}/subnets/snet-jump"}]},
        {"id": RT_PE, "name": "rt-portal-pe", "subscriptionId": ONL, "routes": [route("0.0.0.0/0", "VirtualAppliance", "10.0.0.4")], "subnets": [{"id": f"{PORTAL}/subnets/snet-pe"}]}],
        key=lambda r: r["id"]))
    f["arg-private-dns-zones"] = arg(sorted([
        {"id": Z_KV, "name": "privatelink.vaultcore.azure.net", "subscriptionId": CONN},
        {"id": Z_BLOB, "name": "privatelink.blob.core.windows.net", "subscriptionId": CORP}], key=lambda r: r["id"]))
    f["arg-private-dns-links"] = arg(sorted([
        {"id": f"{Z_KV}/virtualNetworkLinks/vnet-hub-link", "zone": Z_KV, "vnet": HUB, "registration": False},
        {"id": f"{Z_BLOB}/virtualNetworkLinks/vnet-payroll-link", "zone": Z_BLOB, "vnet": PAYROLL, "registration": False}], key=lambda r: r["id"]))
    conn = lambda target, group: [{"name": "c", "properties": {"privateLinkServiceId": target, "groupIds": [group], "privateLinkServiceConnectionState": {"status": "Approved"}}}]
    f["arg-private-endpoints"] = arg(sorted([
        {"id": PE_KV, "name": "pe-kv-payroll", "subscriptionId": CORP, "connections": conn(KV_PAYROLL, "vault"), "subnet": f"{PAYROLL}/subnets/snet-app"},
        {"id": PE_BLOB, "name": "pe-st-payroll-blob", "subscriptionId": CORP, "connections": conn(ST_PAYROLL, "blob"), "subnet": f"{PAYROLL}/subnets/snet-app"},
        {"id": PE_QUEUE, "name": "pe-st-payroll-queue", "subscriptionId": CORP, "connections": conn(ST_PAYROLL, "queue"), "subnet": f"{PAYROLL}/subnets/snet-app"}], key=lambda r: r["id"]))
    pec = lambda pe: [{"id": f"{pe}/c", "properties": {"privateEndpoint": {"id": pe}, "privateLinkServiceConnectionState": {"status": "Approved"}}}]
    f["arg-key-vaults"] = arg(sorted([
        {"id": KV_HUB, "name": "kv-hub-certs", "subscriptionId": CONN, "rbac": True, "purgeProtection": True, "defaultAction": "Deny", "publicNetworkAccess": "Enabled", "privateEndpointConnections": [], "owner": "platform-team"},
        {"id": KV_PAYROLL, "name": "kv-payroll", "subscriptionId": CORP, "rbac": True, "purgeProtection": True, "defaultAction": "Deny", "publicNetworkAccess": "Disabled", "privateEndpointConnections": pec(PE_KV), "owner": "payroll-team"},
        {"id": KV_PORTAL, "name": "kv-portal", "subscriptionId": ONL, "rbac": False, "purgeProtection": None, "defaultAction": "Allow", "publicNetworkAccess": "Enabled", "privateEndpointConnections": [], "owner": "portal-team"}],
        key=lambda r: r["id"]))
    asg = lambda name, disp, mode, extra=None: {
        "id": f"{MG}/contoso/providers/Microsoft.Authorization/policyAssignments/{name}", "name": name, "displayName": disp, "scope": f"{MG}/contoso",
        "definitionId": f"/providers/Microsoft.Authorization/policySetDefinitions/{name}-set", "enforcementMode": mode, "notScopes": [], "identityType": "", **(extra or {})}
    f["arg-policy-assignments"] = arg(sorted([
        asg("allowed-locations", "Allowed locations", "Default", {"notScopes": [f"{MG}/contoso-sandbox"]}),
        asg("azs-fedramp-mod", "FedRAMP Moderate (audit)", "DoNotEnforce"),
        asg("azs-mcsb", "Microsoft cloud security benchmark", "Default"),
        asg("azs-security", "Azure security engineering", "DoNotEnforce", {"identityType": "SystemAssigned"})], key=lambda r: r["id"]))
    aid = lambda n: f"{MG}/contoso/providers/Microsoft.Authorization/policyAssignments/{n}"
    exm = lambda sub, rg, name, cat, exp, desc: {"id": f"/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Authorization/policyExemptions/{name}",
                                                "name": name, "assignmentId": aid("azs-security"), "category": cat, "expiresOn": exp, "description": desc}
    f["arg-policy-exemptions"] = arg(sorted([
        exm(ONL, "rg-careers", "ex-careers-tls", "Waiver", "2027-03-31T00:00:00Z", "DR-AZS-014: careers site TLS cutover"),
        exm(CORP, "rg-legacy", "ex-legacy-fd", "Waiver", "2026-10-31T00:00:00Z", "DR-AZS-009: classic Front Door until migration"),
        exm(CORP, "rg-payroll-net", "ex-payroll-ddos", "Mitigated", "", "DR-AZS-011: no public IPs in the payroll spoke"),
        exm(ONL, "rg-portal", "ex-portal-waf", "Waiver", "2026-12-01T00:00:00Z", "DR-AZS-012: WAF tuning for the portal")], key=lambda r: r["id"]))
    comp = lambda name, st, pct, c, n, e: {"policyAssignmentName": name, "scope": f"{MG}/contoso", "complianceState": st, "compliancePercentage": pct,
                                           "compliantCount": c, "nonCompliantCount": n, "conflictCount": 0, "exemptCount": e}
    f["arg-policy-compliance"] = arg([
        comp("allowed-locations", "compliant", 100.0, 61, 0, 0),
        comp("azs-fedramp-mod", "noncompliant", 71.4, 40, 16, 0),
        comp("azs-mcsb", "noncompliant", 80.3, 45, 11, 0),
        comp("azs-security", "noncompliant", 52.6, 18, 18, 2)])
    f["rest-hierarchy-settings"] = {TENANT: {"id": f"{MG}/{TENANT}/settings/default", "type": "Microsoft.Management/managementGroups/settings", "name": "default",
                                             "properties": {"tenantId": TENANT, "defaultManagementGroup": f"{MG}/contoso-sandbox", "requireAuthorizationForGroupCreation": False}}}
    plan = lambda name, tier: {"id": f"/providers/Microsoft.Security/pricings/{name}", "name": name, "type": "Microsoft.Security/pricings", "properties": {"pricingTier": tier}}
    full = lambda: {"value": [plan("Arm", "Standard"), plan("CloudPosture", "Standard"), plan("KeyVaults", "Standard"), plan("VirtualMachines", "Standard")]}
    f["rest-defender-pricings"] = {CONN: full(), MGMT: full(), CORP: full(),
                                   ONL: {"value": [plan("Arm", "Standard"), plan("CloudPosture", "Standard"), plan("KeyVaults", "Free"), plan("VirtualMachines", "Standard")]}}
    d = {}
    for p in pips:
        d[p["id"]] = {"value": []}
    d[pips[1]["id"]] = {"value": [diag(WS, name="ddos-to-workspace")]}
    d[pips[7]["id"]] = {"value": [diag(WS, [{"category": "DDoSProtectionNotifications", "enabled": True}, {"category": "DDoSMitigationFlowLogs", "enabled": True}], "ddos-to-workspace")]}
    d[pips[0]["id"]] = {"value": [diag(WS_OTHER, name="to-app-team")]}
    d[FW] = {"value": []}
    d[APPGW] = {"value": [diag(WS, name="appgw-to-workspace")]}
    d[APPGW_INT] = {"value": []}
    d[AFD] = {"value": [diag(WS, name="afd-to-workspace")]}
    d[AFD2] = {"value": []}
    d[KV_PAYROLL] = {"value": [diag(WS, [{"category": "AuditEvent", "enabled": True}], "kv-to-workspace")]}
    d[KV_HUB] = {"value": [diag(WS, [{"categoryGroup": "audit", "enabled": True}], "kv-to-workspace")]}
    d[KV_PORTAL] = {"value": []}
    f["rest-diagnostic-settings"] = {k.lower(): v for k, v in sorted(d.items())}
    og = lambda prof, name: {"id": f"{prof}/originGroups/{name}", "name": name, "properties": {"healthProbeSettings": {"probePath": "/", "probeProtocol": "Https", "probeIntervalInSeconds": 60, "probeRequestType": "GET"}}}
    f["rest-afd-origin-groups"] = {AFD.lower(): {"value": [og(AFD, "og-api"), og(AFD, "og-portal")]}, AFD2.lower(): {"value": [og(AFD2, "og-careers")]}}
    origin = lambda group, name, host, azure=None, pl=None: {"id": f"{group}/origins/{name}", "name": name, "properties": {
        "hostName": host, "enabledState": "Enabled", **({"azureOrigin": {"id": azure}} if azure else {}), "sharedPrivateLinkResource": pl}}
    f["rest-afd-origins"] = {
        f"{AFD}/originGroups/og-api".lower(): {"value": [
            origin(f"{AFD}/originGroups/og-api", "api-private", "api-int.contoso.example", pl={"privateLink": {"id": APPGW_INT}, "groupId": "fe-private", "privateLinkLocation": "eastus2", "status": "Approved"}),
            origin(f"{AFD}/originGroups/og-api", "api-public", "api-public.contoso.example")]},
        f"{AFD}/originGroups/og-portal".lower(): {"value": [
            origin(f"{AFD}/originGroups/og-portal", "origin-east", "app-portal-east.azurewebsites.net", APP_E),
            origin(f"{AFD}/originGroups/og-portal", "origin-west", "app-portal-west.azurewebsites.net", APP_W)]},
        f"{AFD2}/originGroups/og-careers".lower(): {"value": [
            origin(f"{AFD2}/originGroups/og-careers", "careers-static", "stcareersweb.z13.web.core.windows.net", ST_CAREERS)]}}
    dom = lambda prof, name, host, tls: {"id": f"{prof}/customDomains/{name}", "name": name, "properties": {"hostName": host, "tlsSettings": {"certificateType": "ManagedCertificate", "minimumTlsVersion": tls}}}
    f["rest-afd-custom-domains"] = {AFD.lower(): {"value": [dom(AFD, "portal", "portal.contoso.example", "TLS12")]},
                                    AFD2.lower(): {"value": [dom(AFD2, "careers", "careers.contoso.example", "TLS10")]}}
    f["rest-afd-security-policies"] = {AFD.lower(): {"value": [{"id": f"{AFD}/securityPolicies/afd-portal-waf", "name": "afd-portal-waf", "properties": {"parameters": {
        "type": "WebApplicationFirewall", "wafPolicy": {"id": AFDWAF}, "associations": [{"domains": [{"id": f"{AFD}/customDomains/portal"}], "patternsToMatch": ["/*"]}]}}}]},
        AFD2.lower(): {"value": []}}
    allow_fd = lambda hdr: {"name": "AllowFrontDoor", "priority": 100, "action": "Allow", "tag": "ServiceTag", "ipAddress": "AzureFrontDoor.Backend", **({"headers": {"x-azure-fdid": [hdr]}} if hdr else {})}
    deny_all = {"name": "Deny all", "priority": 2147483647, "action": "Deny", "ipAddress": "Any"}
    site = lambda sid, rules: {"id": f"{sid}/config/web", "name": "web", "properties": {"minTlsVersion": "1.2", "ipSecurityRestrictions": rules, "ipSecurityRestrictionsDefaultAction": "Deny", "publicNetworkAccess": "Enabled"}}
    f["rest-webapp-config"] = {APP_E.lower(): site(APP_E, [allow_fd(FDID_PORTAL), deny_all]), APP_W.lower(): site(APP_W, [allow_fd(None), deny_all])}
    zg = lambda pe, zone: {"value": [{"id": f"{pe}/privateDnsZoneGroups/default", "name": "default", "properties": {"privateDnsZoneConfigs": [{"name": "c", "properties": {"privateDnsZoneId": zone}}]}}]}
    f["rest-pe-zone-groups"] = {PE_KV.lower(): zg(PE_KV, Z_KV), PE_BLOB.lower(): zg(PE_BLOB, Z_BLOB), PE_QUEUE.lower(): {"value": []}}
    return f


def week2(w1: dict) -> dict:
    """A week later: some fixes, one new exposure, one gone."""
    f = copy.deepcopy(w1)
    pips = [p for p in f["arg-public-ips"]["data"] if p["name"] != "pip-orphan"]
    pips.append(pip(ONL, "rg-portal", "pip-new-api", "198.51.100.50", f"{NIC_API}/ipConfigurations/ipconfig1"))
    pips.sort(key=lambda r: r["id"])
    f["arg-public-ips"] = arg(pips)
    f["arg-platform-resources"]["data"] = sorted(
        [r for r in f["arg-platform-resources"]["data"] if not r["id"].endswith("/pip-orphan")]
        + [{"id": pips[-1]["id"] if pips[-1]["name"] == "pip-new-api" else next(p["id"] for p in pips if p["name"] == "pip-new-api"),
            "type": "microsoft.network/publicipaddresses", "subscriptionId": ONL}], key=lambda r: r["id"])
    f["arg-platform-resources"] = arg(f["arg-platform-resources"]["data"])
    new_api = next(p["id"] for p in pips if p["name"] == "pip-new-api")
    f["arg-network-owners"]["data"].append({"id": NIC_API, "type": "microsoft.network/networkinterfaces", "ipConfigurations": [
        {"id": f"{NIC_API}/ipConfigurations/ipconfig1", "properties": {"subnet": {"id": f"{PORTAL}/subnets/snet-web"}}}], "gatewayIPConfigurations": None, "frontendIPConfigurations": None})
    f["arg-network-owners"] = arg(sorted(f["arg-network-owners"]["data"], key=lambda r: r["id"]))
    d = f["rest-diagnostic-settings"]
    d.pop(rid(ONL, "rg-portal", "Microsoft.Network/publicIPAddresses", "pip-orphan").lower(), None)
    d[new_api.lower()] = {"value": []}
    d[FW.lower()] = {"value": [diag(WS, name="fw-to-workspace")]}
    f["rest-diagnostic-settings"] = dict(sorted(d.items()))
    f["arg-appgw-waf-policies"]["data"][0]["policySettings"]["mode"] = "Prevention"
    fwp = f["arg-firewall-policies"]["data"][0]
    fwp["threatIntelMode"] = "Deny"
    fwp["idpsMode"] = "Deny"
    for rt in f["arg-route-tables"]["data"]:
        if rt["name"] == "rt-portal":
            rt["routes"] = [{"name": "default", "properties": {"addressPrefix": "0.0.0.0/0", "nextHopType": "VirtualAppliance", "nextHopIpAddress": "10.0.0.4"}}]
    f["rest-webapp-config"][APP_W.lower()]["properties"]["ipSecurityRestrictions"][0]["headers"] = {"x-azure-fdid": [FDID_PORTAL]}
    for kv in f["arg-key-vaults"]["data"]:
        if kv["name"] == "kv-portal":
            kv["purgeProtection"] = True
    for a in f["arg-policy-assignments"]["data"]:
        if a["name"] == "azs-security":
            a["enforcementMode"] = "Default"
    f["rest-hierarchy-settings"][TENANT]["properties"]["requireAuthorizationForGroupCreation"] = True
    for c in f["arg-policy-compliance"]["data"]:
        if c["policyAssignmentName"] == "azs-security":
            c.update({"compliancePercentage": 63.2, "compliantCount": 22, "nonCompliantCount": 14})
    return f


def write(folder: Path, files: dict) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    for name, value in files.items():
        if name.startswith("rest-"):
            value = {k.lower(): v for k, v in value.items()}
        (folder / f"{name}.json").write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8", newline="\n")


def main() -> None:
    w1 = week1()
    write(HERE / "week1", w1)
    write(HERE / "week2", week2(w1))
    (HERE / "defender-exposure.csv").write_text(
        "resourceId,resourceName,source\n"
        f"{rid(CONN, 'rg-hub', 'Microsoft.Network/publicIPAddresses', 'pip-appgw-portal')},pip-appgw-portal,internet exposure analysis\n"
        f"{rid(ONL, 'rg-portal', 'Microsoft.Network/publicIPAddresses', 'pip-jump')},pip-jump,internet exposure analysis\n"
        f"{rid(ONL, 'rg-batch', 'Microsoft.ContainerInstance/containerGroups', 'ci-batch-export')},ci-batch-export,internet exposure analysis\n",
        encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
