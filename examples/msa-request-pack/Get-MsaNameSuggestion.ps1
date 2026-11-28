#Requires -Version 5.1
<#
.SYNOPSIS
    Suggests every name a new managed service account needs, from the standard's rules: the
    account, its retriever group, its SPNs, the Entra managed identity it moves to, and its seven tags.
.DESCRIPTION
    The rules are the managed service account standard's (WD-159, WD-160, WD-173, WD-175):
      Account          gmsa-<app> or dmsa-<app>, with -<role> only where one system needs more than one
                       account; lowercase letters, digits and hyphens; <app> starts with a letter and has
                       no hyphen; the role from the list (sql, agt, rs, is, web, svc, task); 15 characters
                       or fewer before the $, shortened at <app>, never at the prefix or the role
      Retriever group  DL-gMSA-<app>-Hosts for a gMSA; a dMSA's retrievers are the hosts themselves
      SPNs             <service-class>/<host-fqdn>[:<port>] for each host and service class (or each
                       -SpnHost, such as the name clients use for a load-balanced site); name only
                       the ones the workload needs; they're registered after approval with setspn -S
      Managed identity id-<app>-<environment>-<region>-<instance>, the Cloud Adoption Framework's
                       form, with a three-digit instance (001)
      Tags             SystemId, Owner1, Owner2, Sponsor, Environment, Tier, EntraTarget
    Where a value breaks a rule, the suggestion fixes what a rule fixes (lowercase, drop characters
    the rule doesn't allow, shorten <app>) and says so in Findings. It never invents a number or a
    suffix the standard doesn't have: a clash -CheckForest finds is reported, not renamed.

    -CheckForest looks up, read only, whether the account name, the retriever group and each SPN
    already exist: Get-ADObject with the ActiveDirectory module, by sAMAccountName or name and by
    servicePrincipalName, against -Server (a global catalog, host:3268, searches the whole forest),
    or a JSON fixture with -ForestFixturePath. Nothing is written anywhere.

    Runs in Windows PowerShell 5.1 and PowerShell 7, and prints the same text in both.
.EXAMPLE
    ./Get-MsaNameSuggestion.ps1 -SystemId SYS-0233 -AppShortName hrdb -Role sql -AccountType gMSA -Environment prod -Hosts HRSQL01 -ServiceClass MSSQLSvc -Port 1433 -Domain corp.contoso.example
.EXAMPLE
    ./Get-MsaNameSuggestion.ps1 -SystemId SYS-0412 -AppShortName Payroll -AccountType gMSA -Environment prod -Hosts PAY01,PAY02 -ServiceClass HTTP -CheckForest -ForestFixturePath tests/fixtures/forest.json
.EXAMPLE
    # As an object, for a script (the request checker calls it this way).
    $s = ./Get-MsaNameSuggestion.ps1 -SystemId SYS-0517 -AppShortName visitor -Environment prod -Hosts VIS01 -AsObject
    $s.AccountName
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][AllowEmptyString()][string]$SystemId,
    [Parameter(Mandatory)][AllowEmptyString()][string]$AppShortName,
    [AllowEmptyString()][string]$Role = '',
    [ValidateSet('gMSA', 'dMSA')][string]$AccountType = 'gMSA',
    [Parameter(Mandatory)][AllowEmptyString()][string]$Environment,
    [string[]]$Hosts = @(),
    [string[]]$ServiceClass = @(),
    [string[]]$SpnHost = @(),
    [int]$Port = 0,
    [string]$Domain = '',
    [string]$Region = '<region>',
    [ValidateRange(1, 999)][int]$Instance = 1,
    [string]$Owner1 = '<owner1-upn>',
    [string]$Owner2 = '<owner2-upn>',
    [string]$Sponsor = '<sponsor-upn>',
    [string]$Tier = '<R1|R2|R3>',
    [string]$EntraTarget = 'Undecided',
    [string]$StandardPath = (Join-Path $PSScriptRoot 'standard.json'),
    [switch]$CheckForest,
    [string]$ForestFixturePath,
    [string]$Server,
    [switch]$AsObject
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# The standard's lists (WD-173, WD-175): the same values pack_schema.py and Chapter 12 use.
$Roles = @('sql', 'agt', 'rs', 'is', 'web', 'svc', 'task')
$Environments = @('prod', 'test', 'dev')
$MaxName = 15
$findings = New-Object System.Collections.Generic.List[object]
function Add-Finding([string]$Rule, [string]$Severity, [string]$Issue) { $findings.Add([pscustomobject][ordered]@{ Rule = $Rule; Severity = $Severity; Issue = $Issue }) }

if (-not $Domain -and (Test-Path -LiteralPath $StandardPath)) { $Domain = "$((Get-Content -LiteralPath $StandardPath -Raw | ConvertFrom-Json).domain)" }
$prefix = if ($AccountType -eq 'dMSA') { 'dmsa' } else { 'gmsa' }

# The app short name: lowercase letters and digits, starting with a letter (WD-173).
$given = "$AppShortName".Trim()
$app = $given.ToLowerInvariant()
if ($app -cne $given) { Add-Finding 'NAME-CASE' 'Fixed' "AppShortName '$given' lowercased to '$app' (WD-173)" }
$clean = $app -replace '[^a-z0-9]', ''
if ($clean -ne $app) { Add-Finding 'NAME-CHARS' 'Fixed' "AppShortName '$app' has characters the standard doesn't allow (letters and digits only, no hyphen); '$clean' kept (WD-173)"; $app = $clean }
if (-not $app) { Add-Finding 'NAME-EMPTY' 'Finding' 'AppShortName has no letters or digits: use the short name on the system''s record' }
elseif ($app -notmatch '^[a-z]') { Add-Finding 'NAME-START' 'Finding' "AppShortName '$app' starts with a digit: the standard's short name starts with a letter (WD-173). Change the short name on the system's record" }

# The role suffix, only from the list.
$r = "$Role".Trim().TrimStart('-').ToLowerInvariant()
if ($r -and $r -notin $Roles) { Add-Finding 'NAME-ROLE' 'Finding' "Role '$Role' isn't one of $(($Roles | ForEach-Object { "-$_" }) -join ', ') (WD-173): leave it blank, or pick one from the list"; $r = '' }

# 15 characters before the $, shortened at <app>.
$suffix = if ($r) { "-$r" } else { '' }
$room = $MaxName - $prefix.Length - 1 - $suffix.Length
if ($app.Length -gt $room) {
    $short = $app.Substring(0, $room)
    Add-Finding 'NAME-LENGTH' 'Finding' "$prefix-$app$suffix is $($prefix.Length + 1 + $app.Length + $suffix.Length) characters; the standard allows $MaxName before the `$, shortened at <app>, so the short name can have $room characters here. '$short' is only the first ${room}: choose the short name on the system's record, check it isn't another system's (-CheckForest), and ask again (WD-173, WD-175)"
    $app = $short
}
$account = "$prefix-$app$suffix"

# The environment, from the tag's closed list.
$envName = "$Environment".Trim()
if ($envName -cnotin $Environments) {
    $low = $envName.ToLowerInvariant()
    if ($low -in $Environments) { Add-Finding 'TAG-ENVIRONMENT' 'Fixed' "Environment '$envName' lowercased to '$low' (WD-175)"; $envName = $low }
    else { Add-Finding 'TAG-ENVIRONMENT' 'Finding' "Environment '$envName' isn't prod, test or dev (WD-175)"; $envName = '<prod|test|dev>' }
}

# The hosts, and the SPN forms for them (Learn's <service-class>/<host>[:<port>]).
$hostList = @(@($Hosts) | ForEach-Object { "$_" -split '[;,]' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$spnHostList = @(@($(if ($SpnHost) { $SpnHost } else { $hostList })) | ForEach-Object { "$_" -split '[;,]' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$fqdn = @($spnHostList | ForEach-Object { $h = $_.ToLowerInvariant(); if ($h.Contains('.') -or -not $Domain) { $h } else { "$h.$($Domain.ToLowerInvariant())" } })
$classes = @(@($ServiceClass) | ForEach-Object { "$_" -split '[;,]' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$spns = @(foreach ($c in $classes) { foreach ($h in $fqdn) { if ($Port) { "$c/${h}:$Port" } else { "$c/$h" } } })
foreach ($c in $classes) { if ($c -notmatch '^[A-Za-z][A-Za-z0-9.-]*$') { Add-Finding 'SPN-CLASS' 'Finding' "Service class '$c' isn't a service class name (for example HTTP or MSSQLSvc)" } }
if (-not $hostList.Count) { Add-Finding 'HOSTS' 'Finding' "No hosts: $(if ($prefix -eq 'gmsa') { "DL-gMSA-$app-Hosts would have no members and" } else { 'the dMSA would have no retriever, so' }) no host could retrieve the password" }
if ($fqdn.Count -and -not $Domain) { Add-Finding 'SPN-DOMAIN' 'Warn' 'No -Domain and no domain in standard.json: the SPNs use the host names as given' }

$group = if ($prefix -eq 'gmsa') { "DL-gMSA-$app-Hosts" } else { '' }
$identity = 'id-{0}-{1}-{2}-{3:000}' -f $app, $envName, $Region, $Instance
$tagKeys = @('SystemId', 'Owner1', 'Owner2', 'Sponsor', 'Environment', 'Tier', 'EntraTarget')
$tags = [ordered]@{ SystemId = "$SystemId".Trim(); Owner1 = $Owner1; Owner2 = $Owner2; Sponsor = $Sponsor; Environment = $envName; Tier = $Tier; EntraTarget = $EntraTarget }
foreach ($k in $tagKeys) { if ("$($tags[$k])" -match '[=;]' -and "$($tags[$k])" -notmatch '^<.*>$') { Add-Finding 'TAG-VALUE' 'Finding' "Tag $k's value '$($tags[$k])' contains '=' or ';'" } }

# -CheckForest: read-only lookups, live or from a fixture.
$clashes = @()
if ($CheckForest) {
    if ($ForestFixturePath) {
        $fx = Get-Content -LiteralPath $ForestFixturePath -Raw | ConvertFrom-Json
        $objects = @($fx.objects | ForEach-Object { $_ })
        $byName = { param($n) @($objects | Where-Object { "$($_.samAccountName)" -ieq $n -or "$($_.name)" -ieq $n }) }
        $bySpn = { param($s) @($objects | Where-Object { @($_.servicePrincipalName) -contains $s }) }
    } else {
        Import-Module ActiveDirectory -ErrorAction Stop
        $srv = @{}; if ($Server) { $srv.Server = $Server }
        $byName = { param($n) $sam = $n.Replace("'", "''"); @(Get-ADObject -LDAPFilter "(|(sAMAccountName=$sam)(name=$sam))" -Properties samAccountName, objectClass @srv) }
        $bySpn = { param($s) @(Get-ADObject -LDAPFilter "(servicePrincipalName=$s)" -Properties samAccountName, objectClass @srv) }
    }
    foreach ($hit in @(& $byName "$account`$")) {
        Add-Finding 'FOREST-NAME' 'Finding' "$account`$ already exists ($($hit.objectClass) $($hit.distinguishedName)). The standard has no numbering rule: if it's this system's account, ask for a change, not a new account; if it's another system's, one of the two needs a different short name on its record (WD-173 sets no rule for that case, WD-185 asks for one)"
        $clashes += "$account`$"
    }
    if ($group) {
        foreach ($hit in @(& $byName $group)) {
            if ("$($hit.objectClass)" -eq 'group') { Add-Finding 'FOREST-GROUP' 'Info' "$group already exists: a second account for the same system uses the same group (WD-159); if the group isn't this system's, its short name is taken" }
            else { Add-Finding 'FOREST-GROUP' 'Finding' "$group is the name of a $($hit.objectClass), not a group: $($hit.distinguishedName)"; $clashes += $group }
        }
    }
    foreach ($s in $spns) {
        foreach ($hit in @(& $bySpn $s)) {
            Add-Finding 'FOREST-SPN' 'Finding' "$s is already registered on $($hit.samAccountName): setspn -S would refuse it. Move it in the switch window (Migration A, step A5) or name a different SPN"
            $clashes += $s
        }
    }
}

$result = [pscustomobject][ordered]@{
    AccountName      = "$account`$"
    AccountType      = $AccountType
    DnsHostName      = $(if ($Domain) { "$account.$($Domain.ToLowerInvariant())" } else { "$account.<domain-fqdn>" })
    RetrieverGroup   = $(if ($group) { $group } else { 'none: a dMSA''s retrievers are the hosts named on the request (WD-173)' })
    Hosts            = ($hostList -join '; ')
    Spns             = ($spns -join '; ')
    ManagedIdentity  = $identity
    Tags             = (($tagKeys | ForEach-Object { "$_=$($tags[$_])" }) -join '; ')
    Findings         = $findings.ToArray()
    Ready            = -not @($findings | Where-Object { $_.Severity -eq 'Finding' }).Count
    CheckedForest    = [bool]$CheckForest
}
if ($AsObject) { return $result }

# The printed form: fixed labels and LF line ends, the same text in Windows PowerShell 5.1 and PowerShell 7.
$lines = New-Object System.Collections.Generic.List[string]
foreach ($k in 'AccountName', 'AccountType', 'DnsHostName', 'RetrieverGroup', 'Hosts', 'Spns', 'ManagedIdentity', 'Tags') { $lines.Add(('{0,-16} {1}' -f $k, $(if ("$($result.$k)") { $result.$k } else { '(none)' }))) }
$lines.Add(('{0,-16} {1}' -f 'Ready', $result.Ready))
if ($CheckForest) { $lines.Add(('{0,-16} {1}' -f 'Forest', $(if ($clashes.Count) { "$($clashes.Count) clash(es)" } else { 'no clash found' }))) }
foreach ($f in $findings) { $lines.Add(('  {0,-15} {1,-7} {2}' -f $f.Rule, $f.Severity, $f.Issue)) }
$lines -join "`n"
