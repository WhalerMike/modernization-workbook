#Requires -Version 7.1
<#
    ProviderNotices: a read-only kit that collects the notices cloud providers send about a tenant,
    account, tenancy or project (scheduled maintenance, retirements, advisories, security advisories,
    upcoming changes and incidents), normalizes them into one record, routes the ones that need action
    to an owner as a Ticket-to-Machine typed task, writes a weekly digest, and records each run as
    hashed, chained evidence.

    Providers: Azure Service Health (Azure Resource Graph), Microsoft 365 (Microsoft Graph service
    communications API), Oracle Cloud Infrastructure (Announcements), AWS (AWS Health API) and Google
    Cloud (Personalized Service Health). Every call is a read declared in config/calls.json with the
    least-privileged role or permission its provider documents. Fixture mode reads files and sends
    nothing; live mode calls az, Microsoft Graph PowerShell, oci, aws and gcloud. The router writes
    task payloads and sends them only with -Send. Illustrative: tested against fixtures and fakes,
    not run against a live tenant, account, tenancy or project.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:KitRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$script:ConfigRoot = Join-Path $script:KitRoot 'config'
$script:Providers = @('azure', 'm365', 'oci', 'aws', 'google')
$script:Kinds = @('maintenance', 'retirement', 'advisory', 'security', 'change', 'incident')
$script:NoticeSchema = 'fmp-provider-notice/1'
$script:SummaryMax = 2000

# The Ticket-to-Machine finding contract's severities, priorities and response windows
# (examples/servicenow-sailpoint/clients/python/finding_contract.py; a test keeps them equal).
$script:Priority = [ordered]@{ P1 = '1'; P2 = '2'; P3 = '3'; P4 = '4' }
$script:WindowSeconds = [ordered]@{ P1 = 0; P2 = 3600; P3 = 86400; P4 = 259200 }

# ----------------------------------------------------------------------------- clouds

# Each provider's clouds, with the endpoint the kit reads. Case-sensitive on purpose: an unknown
# name throws, and there is no default cloud.
$script:Clouds = @{
    azure  = @{
        # Learn: az cloud set --name AzureUSGovernment; resource manager https://management.usgovcloudapi.net/
        AzureCloud        = @{ Arm = 'https://management.azure.com'; Portal = 'https://portal.azure.com' }
        AzureUSGovernment = @{ Arm = 'https://management.usgovcloudapi.net'; Portal = 'https://portal.azure.us' }
    }
    m365   = @{
        # Learn (Microsoft Graph national cloud deployments): GCC keeps the worldwide endpoint.
        global  = @{ Graph = 'https://graph.microsoft.com'; GraphEnvironment = 'Global' }
        gcc     = @{ Graph = 'https://graph.microsoft.com'; GraphEnvironment = 'Global' }
    }
    oci    = @{
        # Oracle: announcements.<region>.<second-level domain>; the US Government Cloud page lists
        # announcements.us-langley-1.oraclegovcloud.com and announcements.us-luke-1.oraclegovcloud.com (OC2).
        oc1 = @{ Domain = 'oraclecloud.com'; Regions = @() }
        oc2 = @{ Domain = 'oraclegovcloud.com'; Regions = @('us-langley-1', 'us-luke-1') }
    }
    aws    = @{
        # AWS: the Health API's active endpoint is us-east-1; in GovCloud a single endpoint in us-gov-west-1.
        'aws'        = @{ Region = 'us-east-1'; ArnPrefix = 'arn:aws:' }
        'aws-us-gov' = @{ Region = 'us-gov-west-1'; ArnPrefix = 'arn:aws-us-gov:' }
    }
    google = @{
        global = @{ Api = 'https://servicehealth.googleapis.com/v1' }
    }
}

function Get-PnCloud {
    <#
    .SYNOPSIS
        Returns one provider's cloud: azure (AzureCloud, AzureUSGovernment), m365 (global, gcc), oci (oc1, oc2), aws (aws, aws-us-gov) or google (global). Any other name throws.
    .EXAMPLE
        # The Graph host for GCC: https://graph.microsoft.com
        (Get-PnCloud -Provider m365 -Cloud gcc).Graph
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][ValidateSet('azure', 'm365', 'oci', 'aws', 'google')][string]$Provider,
        [Parameter(Mandatory)][string]$Cloud)
    $rows = $script:Clouds[$Provider]
    if (-not ($rows.Keys -ccontains $Cloud)) {
        throw "Unknown $Provider cloud '$Cloud'. Use $(($rows.Keys | Sort-Object) -join ', ')."
    }
    [pscustomobject]$rows[$Cloud]
}

# ----------------------------------------------------------------------------- files and values

function Read-PnJson {
    <#
    .SYNOPSIS
        Reads a JSON file as hashtables and arrays. Date-like strings stay strings where PowerShell
        allows it (7.5 and later), so a record reads back exactly as it was written.
    .EXAMPLE
        Read-PnJson -Path config/routing.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    ConvertFrom-PnJsonText -Text ([IO.File]::ReadAllText((Resolve-Path -LiteralPath $Path).Path))
}

function ConvertFrom-PnJsonText {
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Text)
    if (-not $Text.Trim()) { return $null }
    $p = @{ AsHashtable = $true; Depth = 100; NoEnumerate = $true }
    if ((Get-Command ConvertFrom-Json).Parameters.ContainsKey('DateKind')) { $p.DateKind = 'String'; return ($Text | ConvertFrom-Json @p) }
    # PowerShell before 7.5 turns date-like strings into DateTime: turn them back into UTC strings.
    , (ConvertTo-PnStringDate -Value ($Text | ConvertFrom-Json @p))
}

function ConvertTo-PnStringDate {
    param([AllowNull()]$Value)
    if ($Value -is [DateTime]) { return $Value.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", [Globalization.CultureInfo]::InvariantCulture) }
    if ($Value -is [Collections.IDictionary]) {
        foreach ($k in @($Value.Keys)) { $Value[$k] = ConvertTo-PnStringDate -Value $Value[$k] }
        return , $Value
    }
    if ($Value -is [Collections.IList] -and $Value -isnot [string]) {
        for ($i = 0; $i -lt $Value.Count; $i++) { $Value[$i] = ConvertTo-PnStringDate -Value $Value[$i] }
        return , $Value
    }
    $Value
}

function Write-PnJson {
    <#
    .SYNOPSIS
        Writes a value as UTF-8 JSON without a byte order mark, with LF line endings.
    .EXAMPLE
        Write-PnJson -Path out/x.json -Value @{ a = 1 }
    #>
    param([Parameter(Mandatory)][string]$Path, [AllowNull()]$Value)
    $dir = Split-Path -Parent $Path
    if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $json = (ConvertTo-Json -InputObject $Value -Depth 50) -replace "`r`n", "`n"
    [IO.File]::WriteAllText($Path, $json + "`n", [Text.UTF8Encoding]::new($false))
}

function Write-PnText {
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][AllowEmptyString()][string]$Text)
    $dir = Split-Path -Parent $Path
    if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    [IO.File]::WriteAllText($Path, ($Text -replace "`r`n", "`n"), [Text.UTF8Encoding]::new($false))
}

function Get-PnFileHash {
    <#
    .SYNOPSIS
        The lowercase hexadecimal SHA-256 of a file, the form every manifest and evidence record uses.
    .EXAMPLE
        Get-PnFileHash -Path config/calls.json
    #>
    param([Parameter(Mandatory)][string]$Path)
    (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Get-PnTextHash {
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Text)
    $bytes = [Text.Encoding]::UTF8.GetBytes($Text)
    ([Security.Cryptography.SHA256]::HashData($bytes) | ForEach-Object { $_.ToString('x2') }) -join ''
}

function Get-PnV {
    <#
    .SYNOPSIS
        The first non-empty value of any of the names in a hashtable, matching case-insensitively and
        also in kebab-case (the OCI CLI's output keys), or $null.
    .EXAMPLE
        Get-PnV @{ 'time-one-value' = 'x' } 'timeOneValue'
    #>
    param($Object, [Parameter(Mandatory)][string[]]$Names)
    if ($null -eq $Object -or $Object -isnot [Collections.IDictionary]) { return $null }
    foreach ($n in $Names) {
        $kebab = ($n -creplace '([a-z0-9])([A-Z])', '$1-$2').ToLowerInvariant()
        foreach ($k in @($n, $kebab)) {
            foreach ($key in $Object.Keys) {
                if ([string]::Equals("$key", $k, [StringComparison]::OrdinalIgnoreCase)) {
                    $v = $Object[$key]
                    if ($null -ne $v -and "$v" -ne '') { return $v }
                }
            }
        }
    }
    $null
}

function ConvertTo-PnUtc {
    <#
    .SYNOPSIS
        A time as 'yyyy-MM-ddTHH:mm:ssZ', or $null. Takes a DateTime, an ISO 8601 string, epoch seconds
        (the AWS Health API), epoch milliseconds or .NET ticks, and RFC 1123 strings (EventBridge).
    .EXAMPLE
        ConvertTo-PnUtc 1589077890.53     # 2020-05-10T02:31:30Z
    #>
    param([AllowNull()]$Value)
    if ($null -eq $Value -or "$Value" -eq '') { return $null }
    $dt = $null
    if ($Value -is [DateTime]) { $dt = $Value }
    elseif ($Value -is [DateTimeOffset]) { $dt = $Value.UtcDateTime }
    elseif ($Value -is [ValueType] -or "$Value" -match '^\d+(\.\d+)?$') {
        $n = [double]"$Value"
        if ($n -gt 1e16) { $dt = [DateTime]::new([long]$n, [DateTimeKind]::Utc) }
        elseif ($n -gt 1e11) { $dt = [DateTimeOffset]::FromUnixTimeMilliseconds([long]$n).UtcDateTime }
        else { $dt = [DateTimeOffset]::FromUnixTimeMilliseconds([long]([math]::Round($n * 1000))).UtcDateTime }
    } else {
        $o = [DateTimeOffset]::MinValue
        $styles = [Globalization.DateTimeStyles]::AssumeUniversal
        if ([DateTimeOffset]::TryParse("$Value", [Globalization.CultureInfo]::InvariantCulture, $styles, [ref]$o)) { $dt = $o.UtcDateTime }
        else { throw "Not a time: '$Value'" }
    }
    $dt.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", [Globalization.CultureInfo]::InvariantCulture)
}

function ConvertTo-PnPlainText {
    <#
    .SYNOPSIS
        Text with markup removed, whitespace collapsed and spaces before punctuation dropped, at most
        2,000 characters: the form of a notice's title and summary.
    .EXAMPLE
        ConvertTo-PnPlainText '<p>Move to <b>OAuth</b>.</p>'     # Move to OAuth.
    #>
    param([AllowNull()]$Text)
    if ($null -eq $Text) { return '' }
    $t = "$Text" -replace '(?s)<(script|style)[^>]*>.*?</\1>', ' ' -replace '<[^>]+>', ' '
    $t = [Net.WebUtility]::HtmlDecode($t) -replace '\s+', ' '
    $t = $t -replace ' ([.,;:!?)])', '$1' -replace '\( ', '('
    $t = $t.Trim()
    if ($t.Length -gt $script:SummaryMax) { $t = $t.Substring(0, $script:SummaryMax - 1) + [char]0x2026 }
    $t
}

function ConvertTo-PnList {
    param($Value)
    @(@($Value) | Where-Object { $null -ne $_ -and "$_" -ne '' } | ForEach-Object { "$_" } | Sort-Object -Unique)
}

# ----------------------------------------------------------------------------- calls

function Get-PnCall {
    <#
    .SYNOPSIS
        The calls declared in config/calls.json, optionally one provider's, or the one with -Id. Each
        carries its tool, operation, least-privileged role or permission and documentation page.
    .EXAMPLE
        Get-PnCall -Provider aws | ForEach-Object id
    #>
    [CmdletBinding()]
    param([string]$Provider, [string]$Id, [string]$Path = (Join-Path $script:ConfigRoot 'calls.json'))
    $calls = @((Read-PnJson -Path $Path).calls)
    if ($Provider) { $calls = @($calls | Where-Object { $_.provider -eq $Provider }) }
    if ($Id) {
        $c = @($calls | Where-Object { $_.id -eq $Id })
        if (-not $c.Count) { throw "Call '$Id' isn't declared in config/calls.json." }
        return $c[0]
    }
    $calls
}

function Get-PnRequiredPermission {
    <#
    .SYNOPSIS
        What a provider's reads need: each call's least-privileged role or permission, the elevated
        access some fields need, and the page that says so.
    .EXAMPLE
        Get-PnRequiredPermission -Provider m365
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][ValidateSet('azure', 'm365', 'oci', 'aws', 'google')][string]$Provider)
    foreach ($c in Get-PnCall -Provider $Provider) {
        [pscustomobject][ordered]@{
            Call = $c.id; Permissions = (@($c.permissions) -join '; '); Elevated = "$($c.elevated)"
            Verified = [bool]$c.verified; Doc = $c.permissionDoc
        }
    }
}

# ----------------------------------------------------------------------------- invokers

function New-PnFixtureInvoker {
    <#
    .SYNOPSIS
        The fixture invoker: each call reads its file (config/calls.json 'fixture') from the provider's
        folder under -Path. A call with a 'key' argument reads that entry when the file is a map. Sends
        nothing anywhere. Every call it serves is recorded in the invoker's Calls list.
    .EXAMPLE
        $inv = New-PnFixtureInvoker -Path tests/fixtures/day1
        Invoke-PnCall -Invoker $inv -CallId m365-messages
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    [pscustomobject]@{ Mode = 'Fixture'; Root = (Resolve-Path -LiteralPath $Path).Path; Calls = [Collections.Generic.List[string]]::new() }
}

function Invoke-PnCall {
    <#
    .SYNOPSIS
        Sends one declared call through an invoker: a fixture invoker reads its file, a live invoker runs
        the call's command, and a test's invoker (Mode 'Script') runs its own script block. A call that
        isn't in config/calls.json throws.
    .EXAMPLE
        Invoke-PnCall -Invoker (New-PnFixtureInvoker -Path tests/fixtures/day1) -CallId google-events
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)][string]$CallId, [hashtable]$Arguments = @{})
    $call = Get-PnCall -Id $CallId
    switch ($Invoker.Mode) {
        'Fixture' {
            $file = Join-Path (Join-Path $Invoker.Root $call.provider) $call.fixture
            if (-not (Test-Path -LiteralPath $file)) { throw "Fixture $file is missing for call $CallId." }
            $Invoker.Calls.Add($CallId)
            $data = Read-PnJson -Path $file
            if ($Arguments.Contains('key')) {
                if ($data -is [Collections.IDictionary] -and $data.Contains($Arguments.key)) { return , $data[$Arguments.key] }
                return $null
            }
            return , $data
        }
        'Live' { $Invoker.Calls.Add($CallId); return , (Invoke-PnLiveCall -Invoker $Invoker -Call $call -Arguments $Arguments) }
        'Script' { $Invoker.Calls.Add($CallId); return , (& $Invoker.Script $CallId $Arguments) }
        default { throw "Unknown invoker mode '$($Invoker.Mode)'." }
    }
}

# The native runner: replaced in tests so no tool is started. Returns @{ ExitCode; Output }.
$script:NativeRunner = {
    param([string]$Tool, [string[]]$Arguments)
    $out = & $Tool @Arguments 2>&1
    @{ ExitCode = $LASTEXITCODE; Output = (@($out) -join "`n") }
}
# The Microsoft Graph runner: replaced in tests. Live, Invoke-MgGraphRequest (Microsoft.Graph.Authentication).
$script:GraphRunner = {
    param([string]$Uri)
    Invoke-MgGraphRequest -Method GET -Uri $Uri -OutputType Hashtable
}
# The Graph session's environment: replaced in tests. Live, Get-MgContext.
$script:GraphContext = { $ctx = Get-MgContext; if ($ctx) { @{ Environment = "$($ctx.Environment)"; TenantId = "$($ctx.TenantId)" } } }

function Set-PnRunner {
    <#
    .SYNOPSIS
        Replaces the native, Graph or Graph-context runner (for tests). Returns the previous one.
    .EXAMPLE
        $old = Set-PnRunner -Native { param($Tool, $Arguments) @{ ExitCode = 0; Output = '{}' } }
    #>
    param([scriptblock]$Native, [scriptblock]$Graph, [scriptblock]$GraphContext)
    $old = @{ Native = $script:NativeRunner; Graph = $script:GraphRunner; GraphContext = $script:GraphContext }
    if ($Native) { $script:NativeRunner = $Native }
    if ($Graph) { $script:GraphRunner = $Graph }
    if ($GraphContext) { $script:GraphContext = $GraphContext }
    $old
}

function Invoke-PnNative {
    <#
    .SYNOPSIS
        Runs a provider CLI through the native runner (a stand-in in tests) and returns its JSON output
        parsed, or with -Raw its text. A non-zero exit code throws with the tool's message.
    .EXAMPLE
        Invoke-PnNative -Tool az -Arguments @('cloud', 'show', '--query', 'name', '--output', 'tsv') -Raw
    #>
    param([Parameter(Mandatory)][string]$Tool, [string[]]$Arguments = @(), [switch]$Raw)
    $r = & $script:NativeRunner $Tool $Arguments
    if ($r.ExitCode -ne 0) { throw "$Tool exited $($r.ExitCode): $("$($r.Output)".Trim())" }
    if ($Raw) { return "$($r.Output)".Trim() }
    ConvertFrom-PnJsonText -Text "$($r.Output)"
}

function Get-PnAzureQuery {
    <#
    .SYNOPSIS
        The kit's two Azure Resource Graph queries. 'events' starts from Learn's "all active Service
        Health events" sample, adds the retirement sample's EventSubType, converts the impact times as
        Learn's health advisory sample does, and projects named columns. 'impacted' is Learn's
        "impacted resources" sample as published, ordered for paging.
    .EXAMPLE
        Get-PnAzureQuery -Name events
    #>
    param([Parameter(Mandatory)][ValidateSet('events', 'impacted')][string]$Name)
    if ($Name -eq 'events') {
        return (@(
                "ServiceHealthResources"
                "| where type =~ 'Microsoft.ResourceHealth/events'"
                "| extend eventType = tostring(properties.EventType), eventSubType = tostring(properties.EventSubType), status = tostring(properties.Status), description = tostring(properties.Title), trackingId = tostring(properties.TrackingId), summary = tostring(properties.Summary), priority = properties.Priority, level = tostring(properties.Level), impactStartTime = todatetime(tolong(properties.ImpactStartTime)), impactMitigationTime = todatetime(tolong(properties.ImpactMitigationTime)), lastUpdateTime = properties.LastUpdateTime, impact = properties.Impact"
                "| where (eventType in ('HealthAdvisory', 'SecurityAdvisory', 'PlannedMaintenance') and impactMitigationTime > now()) or (eventType == 'ServiceIssue' and status == 'Active')"
                "| project subscriptionId, trackingId, eventType, eventSubType, status, description, summary, priority, level, impactStartTime, impactMitigationTime, lastUpdateTime, impact"
                "| order by trackingId asc, subscriptionId asc"
            ) -join ' ')
    }
    @(
        "ServiceHealthResources"
        "| where type == 'microsoft.resourcehealth/events/impactedresources'"
        "| extend TrackingId = split(split(id, '/events/', 1)[0], '/impactedResources', 0)[0]"
        "| extend p = parse_json(properties)"
        "| project subscriptionId, TrackingId, resourceName= p.resourceName, resourceGroup=p.resourceGroup, resourceType=p.targetResourceType, details = p, id"
        "| order by id asc"
    ) -join ' '
}

function Get-PnLiveCommand {
    <#
    .SYNOPSIS
        The exact command a live call runs, from the settings: @{ Tool; Arguments } for az, oci, aws and
        gcloud, or @{ Tool = 'graph'; Uri } for Microsoft Graph. Pure: it runs nothing.
    .EXAMPLE
        Get-PnLiveCommand -CallId aws-describe-events -Settings $s
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$CallId, [Parameter(Mandatory)][hashtable]$Settings, [hashtable]$Arguments = @{})
    $call = Get-PnCall -Id $CallId
    $p = $Settings.providers[$call.provider]
    switch ($CallId) {
        { $_ -in 'azure-service-health-events', 'azure-impacted-resources' } {
            $q = Get-PnAzureQuery -Name $(if ($CallId -eq 'azure-service-health-events') { 'events' } else { 'impacted' })
            $a = @('graph', 'query', '-q', $q, '--first', '1000', '--output', 'json')
            if ($p.Contains('managementGroup') -and $p.managementGroup) { $a += @('--management-groups', "$($p.managementGroup)") }
            elseif ($p.Contains('subscriptions') -and @($p.subscriptions).Count) { $a += @('--subscriptions') + @($p.subscriptions | ForEach-Object { "$_" }) }
            if ($Arguments.Contains('skipToken') -and $Arguments.skipToken) { $a += @('--skip-token', "$($Arguments.skipToken)") }
            return @{ Tool = 'az'; Arguments = $a }
        }
        { $_ -like 'm365-*' } {
            $graph = (Get-PnCloud -Provider m365 -Cloud $p.cloud).Graph
            $path = @{ 'm365-messages' = 'messages'; 'm365-issues' = 'issues'; 'm365-health-overviews' = 'healthOverviews' }[$CallId]
            $uri = if ($Arguments.Contains('nextLink') -and $Arguments.nextLink) { "$($Arguments.nextLink)" } else { "$graph/v1.0/admin/serviceAnnouncement/$path" }
            if (-not $uri.StartsWith("$graph/")) { throw "Refusing ${uri}: it isn't on the $($p.cloud) Graph host $graph." }
            return @{ Tool = 'graph'; Uri = $uri }
        }
        'oci-announcements-list' {
            return @{ Tool = 'oci'; Arguments = @('announce', 'announcements', 'list', '--compartment-id', "$($p.tenancyId)", '--all', '--should-show-only-latest-in-chain', 'true', '--region', "$($p.region)", '--output', 'json') }
        }
        'oci-announcement-get' {
            return @{ Tool = 'oci'; Arguments = @('announce', 'announcements', 'get', '--announcement-id', "$($Arguments.key)", '--region', "$($p.region)", '--output', 'json') }
        }
        'aws-describe-events' {
            $region = (Get-PnCloud -Provider aws -Cloud $p.partition).Region
            $a = @('health', 'describe-events', '--region', $region, '--filter', '{"eventStatusCodes":["open","upcoming"]}', '--output', 'json')
            if ($p.Contains('profile') -and $p.profile) { $a += @('--profile', "$($p.profile)") }
            return @{ Tool = 'aws'; Arguments = $a }
        }
        { $_ -in 'aws-describe-event-details', 'aws-describe-affected-entities' } {
            $region = (Get-PnCloud -Provider aws -Cloud $p.partition).Region
            $arns = @($Arguments.arns)
            if ($arns.Count -lt 1 -or $arns.Count -gt 10) { throw "$CallId takes 1 to 10 event ARNs; got $($arns.Count)." }
            $a = if ($CallId -eq 'aws-describe-event-details') { @('health', 'describe-event-details', '--region', $region, '--event-arns') + $arns }
            else { @('health', 'describe-affected-entities', '--region', $region, '--filter', (@{ eventArns = $arns } | ConvertTo-Json -Compress)) }
            $a += @('--output', 'json')
            if ($p.Contains('profile') -and $p.profile) { $a += @('--profile', "$($p.profile)") }
            return @{ Tool = 'aws'; Arguments = $a }
        }
        'google-events' {
            return @{ Tool = 'gcloud'; Arguments = @('service-health', 'events', 'list', "--project=$($p.project)", '--location=global', '--format=json') }
        }
        'google-organization-events' {
            return @{ Tool = 'gcloud'; Arguments = @('service-health', 'organization-events', 'list', "--organization=$($p.organization)", '--location=global', '--format=json') }
        }
        default { throw "No live command for call '$CallId'." }
    }
}

function Assert-PnLiveContext {
    <#
    .SYNOPSIS
        Refuses a live run whose session is signed in to another cloud than the settings name: Azure CLI's
        cloud, the Graph session's environment, the AWS caller's partition, the OCI region's realm.
    .EXAMPLE
        Assert-PnLiveContext -Provider azure -Settings $s
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Provider, [Parameter(Mandatory)][hashtable]$Settings)
    $p = $Settings.providers[$Provider]
    switch ($Provider) {
        'azure' {
            $null = Get-PnCloud -Provider azure -Cloud $p.cloud
            $name = Invoke-PnNative -Tool az -Arguments @('cloud', 'show', '--query', 'name', '--output', 'tsv') -Raw
            if ($name -ne $p.cloud) { throw "Azure CLI is set to cloud '$name', not '$($p.cloud)'. Run: az cloud set --name $($p.cloud)" }
        }
        'm365' {
            $want = (Get-PnCloud -Provider m365 -Cloud $p.cloud).GraphEnvironment
            $ctx = & $script:GraphContext
            if (-not $ctx) { throw "No Microsoft Graph session. Run: Connect-MgGraph -Environment $want -Scopes ServiceMessage.Read.All,ServiceHealth.Read.All" }
            if ($ctx.Environment -ne $want) { throw "The Graph session is in '$($ctx.Environment)', not '$want'." }
            if ($p.Contains('tenantId') -and $p.tenantId -and $ctx.TenantId -and $ctx.TenantId -ne $p.tenantId) { throw "The Graph session is in tenant $($ctx.TenantId), not $($p.tenantId)." }
        }
        'oci' {
            $c = Get-PnCloud -Provider oci -Cloud $p.realm
            if ($c.Regions.Count -and $p.region -notin $c.Regions) { throw "OCI region '$($p.region)' isn't in realm $($p.realm) ($($c.Regions -join ', '))." }
            if ($p.realm -eq 'oc1' -and $p.region -in (Get-PnCloud -Provider oci -Cloud oc2).Regions) { throw "OCI region '$($p.region)' is in realm oc2, not oc1." }
        }
        'aws' {
            $c = Get-PnCloud -Provider aws -Cloud $p.partition
            $a = @('sts', 'get-caller-identity', '--query', 'Arn', '--output', 'text')
            if ($p.Contains('profile') -and $p.profile) { $a += @('--profile', "$($p.profile)") }
            $arn = Invoke-PnNative -Tool aws -Arguments $a -Raw
            if (-not $arn.StartsWith($c.ArnPrefix)) { throw "The AWS caller '$arn' isn't in partition $($p.partition)." }
        }
        'google' { $null = Get-PnCloud -Provider google -Cloud 'global' }
    }
}

function New-PnLiveInvoker {
    <#
    .SYNOPSIS
        The live invoker: each declared call runs its command from Get-PnLiveCommand through az, Microsoft
        Graph PowerShell, oci, aws or gcloud, after Assert-PnLiveContext. It refuses a call that isn't in
        config/calls.json, and one marked unverified unless -AllowUnverified. Paging follows Resource
        Graph skip tokens and Graph's @odata.nextLink. Not run against a live tenant by the authors.
    .EXAMPLE
        $inv = New-PnLiveInvoker -Settings (Read-PnSettings -Path deploy/settings.test.json)
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [switch]$AllowUnverified, [switch]$SkipContextCheck)
    [pscustomobject]@{ Mode = 'Live'; Settings = $Settings; AllowUnverified = [bool]$AllowUnverified; SkipContextCheck = [bool]$SkipContextCheck
        Checked = @{}; Calls = [Collections.Generic.List[string]]::new() }
}

function Invoke-PnLiveCall {
    param([Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)]$Call, [hashtable]$Arguments = @{})
    $Settings = $Invoker.Settings; $CallId = $Call.id
    if (-not $Call.verified -and -not $Invoker.AllowUnverified) { throw "Call $CallId isn't verified against its provider's documentation ($($Call.unverified)). Pass -AllowUnverified to run it." }
    if (-not $Invoker.SkipContextCheck -and -not $Invoker.Checked.Contains($Call.provider)) { Assert-PnLiveContext -Provider $Call.provider -Settings $Settings; $Invoker.Checked[$Call.provider] = $true }
    $cmd = Get-PnLiveCommand -CallId $CallId -Settings $Settings -Arguments $Arguments
    if ($cmd.Tool -eq 'graph') {
        $items = [Collections.Generic.List[object]]::new(); $uri = $cmd.Uri
        while ($uri) {
            $page = & $script:GraphRunner $uri
            foreach ($v in @($page['value'])) { if ($null -ne $v) { $items.Add($v) } }
            $uri = $page['@odata.nextLink']
            if ($uri) { $uri = (Get-PnLiveCommand -CallId $CallId -Settings $Settings -Arguments @{ nextLink = $uri }).Uri }
        }
        return , @{ value = $items.ToArray() }
    }
    if ($cmd.Tool -eq 'az') {
        $rows = [Collections.Generic.List[object]]::new(); $token = $null
        do {
            $a = if ($token) { (Get-PnLiveCommand -CallId $CallId -Settings $Settings -Arguments @{ skipToken = $token }).Arguments } else { $cmd.Arguments }
            $page = Invoke-PnNative -Tool az -Arguments $a
            foreach ($r in @($page['data'])) { if ($null -ne $r) { $rows.Add($r) } }
            $token = Get-PnV $page @('skip_token', 'skipToken', '$skipToken')
        } while ($token)
        return , @{ data = $rows.ToArray() }
    }
    , (Invoke-PnNative -Tool $cmd.Tool -Arguments $cmd.Arguments)
}

# ----------------------------------------------------------------------------- the common record

function New-PnNotice {
    <#
    .SYNOPSIS
        One normalized notice (schema/notice.schema.json), with its fingerprint: the SHA-256 of the
        record without firstSeen and fingerprint, so a provider's update changes it and a re-read doesn't.
    .EXAMPLE
        New-PnNotice -Provider aws -Cloud aws -SourceId arn:... -Kind maintenance -Status open -Title 'x' -FirstSeen 2026-11-09T12:00:00Z
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Provider, [Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][string]$SourceId,
        [Parameter(Mandatory)][string]$Kind, [Parameter(Mandatory)][string]$Status, [Parameter(Mandatory)][string]$Title,
        [AllowNull()]$Summary, [AllowNull()]$WindowStart, [AllowNull()]$WindowEnd,
        $Services = @(), $Regions = @(), $Resources = @(),
        [bool]$ActionRequired = $false, [AllowNull()]$ActionRequiredBy, [string]$ActionBasis = 'none',
        [AllowNull()]$ProviderSeverity, [AllowNull()]$SourceUrl, [string]$SourceRef,
        [AllowNull()]$Published, [AllowNull()]$LastUpdated, [Parameter(Mandatory)]$FirstSeen
    )
    $rec = [ordered]@{
        schema = $script:NoticeSchema; noticeId = "${Provider}:$SourceId"; provider = $Provider; cloud = $Cloud; sourceId = $SourceId
        kind = $Kind; status = $Status; title = (ConvertTo-PnPlainText $Title); summary = (ConvertTo-PnPlainText $Summary)
        windowStart = (ConvertTo-PnUtc $WindowStart); windowEnd = (ConvertTo-PnUtc $WindowEnd)
        services = [string[]]@(ConvertTo-PnList $Services); regions = [string[]]@(ConvertTo-PnList $Regions); resources = [string[]]@(ConvertTo-PnList $Resources)
        actionRequired = $ActionRequired; actionRequiredBy = $(if ($ActionRequired) { ConvertTo-PnUtc $ActionRequiredBy } else { $null }); actionBasis = $ActionBasis
        providerSeverity = $(if ($null -ne $ProviderSeverity -and "$ProviderSeverity" -ne '') { "$ProviderSeverity" } else { $null })
        sourceUrl = $(if ($SourceUrl) { "$SourceUrl" } else { $null }); sourceRef = $(if ($SourceRef) { $SourceRef } else { $SourceId })
        published = (ConvertTo-PnUtc $Published); lastUpdated = (ConvertTo-PnUtc $LastUpdated); firstSeen = (ConvertTo-PnUtc $FirstSeen); fingerprint = ''
    }
    $rec.fingerprint = Get-PnNoticeFingerprint -Notice $rec
    $rec
}

function Get-PnNoticeFingerprint {
    param([Parameter(Mandatory)][Collections.IDictionary]$Notice)
    $copy = [ordered]@{}
    foreach ($k in $Notice.Keys) { if ($k -notin 'firstSeen', 'fingerprint') { $copy[$k] = $Notice[$k] } }
    Get-PnTextHash -Text (ConvertTo-Json -InputObject $copy -Depth 10 -Compress)
}

function Test-PnNotice {
    <#
    .SYNOPSIS
        The schema's rules applied in code (works on PowerShell 7.1, which has no 2020-12 validator):
        every required field, the enums, the time format, the ID form and the fingerprint. Returns the
        problems; none means the record is valid.
    .EXAMPLE
        Test-PnNotice -Notice $n
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][Collections.IDictionary]$Notice)
    $schema = Read-PnJson -Path (Join-Path $script:KitRoot 'schema/notice.schema.json')
    $errors = [Collections.Generic.List[string]]::new()
    foreach ($f in $schema.required) { if (-not $Notice.Contains($f)) { $errors.Add("missing $f") } }
    foreach ($k in $Notice.Keys) { if (-not $schema.properties.Contains($k)) { $errors.Add("unexpected $k") } }
    if ($errors.Count) { return $errors.ToArray() }
    if ($Notice.schema -ne $script:NoticeSchema) { $errors.Add("schema must be $script:NoticeSchema") }
    if ($Notice.provider -notin $script:Providers) { $errors.Add("provider '$($Notice.provider)'") }
    if ($Notice.kind -notin $script:Kinds) { $errors.Add("kind '$($Notice.kind)'") }
    if ($Notice.status -notin 'open', 'closed') { $errors.Add("status '$($Notice.status)'") }
    if ("$($Notice.noticeId)" -ne "$($Notice.provider):$($Notice.sourceId)") { $errors.Add('noticeId must be <provider>:<sourceId>') }
    if (-not "$($Notice.title)") { $errors.Add('title is empty') }
    if ("$($Notice.summary)".Length -gt $script:SummaryMax) { $errors.Add('summary is too long') }
    foreach ($t in 'windowStart', 'windowEnd', 'actionRequiredBy', 'published', 'lastUpdated', 'firstSeen') {
        $v = $Notice[$t]
        if ($null -ne $v -and "$v" -notmatch '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$') { $errors.Add("$t '$v' isn't UTC ISO 8601") }
    }
    if ($Notice.actionRequired -isnot [bool]) { $errors.Add('actionRequired must be true or false') }
    foreach ($a in 'services', 'regions', 'resources') { if ($null -eq $Notice[$a] -or $Notice[$a] -is [string]) { $errors.Add("$a must be a list") } }
    if ("$($Notice.fingerprint)" -ne (Get-PnNoticeFingerprint -Notice $Notice)) { $errors.Add('fingerprint does not match the record') }
    $errors.ToArray()
}

# ----------------------------------------------------------------------------- Azure

function ConvertTo-PnAzureNotice {
    <#
    .SYNOPSIS
        Azure Service Health rows (the kit's events query, one row per event per subscription) and the
        impacted-resources rows, as notices. EventType ServiceIssue and RCA are incidents, PlannedMaintenance
        maintenance, SecurityAdvisory security, HealthAdvisory an advisory, and a HealthAdvisory with
        EventSubType Retirement a retirement (Learn: upcoming retirements are health advisories, and the
        advisory's mitigation time is its end). Billing and other types are left out and counted.
    .EXAMPLE
        ConvertTo-PnAzureNotice -Events $ev -Impacted $imp -Cloud AzureCloud -AsOf 2026-11-09T12:00:00Z
    #>
    [CmdletBinding()]
    param($Events, $Impacted, [Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][string]$AsOf)
    $arm = (Get-PnCloud -Provider azure -Cloud $Cloud).Arm
    $resources = @{}
    foreach ($r in @(Get-PnV $Impacted @('data'))) {
        if ($null -eq $r) { continue }
        $tid = "$(Get-PnV $r @('TrackingId'))"
        $rid = Get-PnV (Get-PnV $r @('details')) @('targetResourceId')
        if (-not $rid) { $rid = "$(Get-PnV $r @('id'))" -replace '/providers/Microsoft\.ResourceHealth/events/.*$', '' }
        if (-not $resources.Contains($tid)) { $resources[$tid] = [Collections.Generic.List[string]]::new() }
        $resources[$tid].Add("$rid".ToLowerInvariant())
    }
    $byId = [ordered]@{}
    foreach ($row in @(Get-PnV $Events @('data'))) {
        if ($null -eq $row) { continue }
        $tid = "$(Get-PnV $row @('trackingId'))"
        if (-not $byId.Contains($tid)) { $byId[$tid] = [Collections.Generic.List[object]]::new() }
        $byId[$tid].Add($row)
    }
    $skipped = 0
    $out = foreach ($tid in $byId.Keys) {
        $rows = $byId[$tid]; $row = $rows[0]
        $type = "$(Get-PnV $row @('eventType'))"; $sub = "$(Get-PnV $row @('eventSubType'))"
        $kind = switch ($type) {
            'ServiceIssue' { 'incident' } 'RCA' { 'incident' } 'PlannedMaintenance' { 'maintenance' } 'SecurityAdvisory' { 'security' }
            'HealthAdvisory' { if ($sub -eq 'Retirement') { 'retirement' } else { 'advisory' } }
            default { $null }
        }
        if (-not $kind) { $skipped++; continue }
        $services = @(); $regions = @()
        foreach ($i in @(Get-PnV $row @('impact'))) {
            if ($null -eq $i) { continue }
            $services += Get-PnV $i @('ImpactedService')
            foreach ($rg in @(Get-PnV $i @('ImpactedRegions'))) { if ($rg) { $regions += Get-PnV $rg @('ImpactedRegion') } }
        }
        $end = Get-PnV $row @('impactMitigationTime')
        $action = $false; $basis = 'none'; $by = $null
        if ($kind -eq 'retirement') { $action = $true; $by = $end; $basis = 'rule: Azure retirement (HealthAdvisory, EventSubType Retirement); due at the advisory end time' }
        elseif ($kind -eq 'security') { $action = $true; $basis = 'rule: Azure security advisory; the ISSO reviews every one' }
        $subs = @($rows | ForEach-Object { "$(Get-PnV $_ @('subscriptionId'))" } | Sort-Object -Unique)
        $status = if ("$(Get-PnV $row @('status'))" -eq 'Resolved') { 'closed' } else { 'open' }
        $sev = @((Get-PnV $row @('level')), $(if ($null -ne (Get-PnV $row @('priority'))) { "priority $(Get-PnV $row @('priority'))" })) | Where-Object { $_ }
        $res = if ($resources.Contains($tid)) { $resources[$tid] } else { @() }
        New-PnNotice -Provider azure -Cloud $Cloud -SourceId $tid -Kind $kind -Status $status `
            -Title (Get-PnV $row @('description', 'title')) -Summary (Get-PnV $row @('summary')) `
            -WindowStart (Get-PnV $row @('impactStartTime')) -WindowEnd $end -Services $services -Regions $regions -Resources $res `
            -ActionRequired $action -ActionRequiredBy $by -ActionBasis $basis -ProviderSeverity (($sev -join ', ')) `
            -SourceUrl "$arm/subscriptions/$($subs[0])/providers/Microsoft.ResourceHealth/events/$($tid)?api-version=2025-05-01" `
            -SourceRef $tid -Published $null -LastUpdated (Get-PnV $row @('lastUpdateTime')) -FirstSeen $AsOf
    }
    @{ Notices = @($out); Skipped = $skipped }
}

# ----------------------------------------------------------------------------- Microsoft 365

function ConvertTo-PnM365Notice {
    <#
    .SYNOPSIS
        Message center posts (serviceUpdateMessage) and service health issues (serviceHealthIssue) as
        notices. A post tagged Retirement is a retirement; planForChange and preventOrFixIssue posts are
        changes; stayInformed posts are advisories. actionRequiredByDateTime makes a post action required
        (the provider's flag); a preventOrFixIssue post without it is action required by the kit's rule.
        Issues: classification incident or advisory; isResolved closes them. Enum values are matched
        case-insensitively (Learn's samples use PascalCase).
    .EXAMPLE
        ConvertTo-PnM365Notice -Messages $m -Issues $i -Cloud gcc -AsOf 2026-11-09T12:00:00Z
    #>
    [CmdletBinding()]
    param($Messages, $Issues, [Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][string]$AsOf)
    $graph = (Get-PnCloud -Provider m365 -Cloud $Cloud).Graph
    $now = [DateTimeOffset]::Parse($AsOf).UtcDateTime
    $out = [Collections.Generic.List[object]]::new()
    foreach ($m in @(Get-PnV $Messages @('value'))) {
        if ($null -eq $m) { continue }
        $id = "$(Get-PnV $m @('id'))"
        $tags = @(Get-PnV $m @('tags')) | ForEach-Object { "$_" }
        $category = "$(Get-PnV $m @('category'))".ToLowerInvariant()
        $kind = if ($tags | Where-Object { $_ -match '^retirement$' }) { 'retirement' }
        elseif ($category -in 'planforchange', 'preventorfixissue') { 'change' } else { 'advisory' }
        $by = Get-PnV $m @('actionRequiredByDateTime')
        $action = $false; $basis = 'none'
        if ($by) { $action = $true; $basis = 'provider: actionRequiredByDateTime' }
        elseif ($category -eq 'preventorfixissue') { $action = $true; $basis = 'rule: Message center category preventOrFixIssue' }
        $end = Get-PnV $m @('endDateTime')
        $status = if ($end -and [DateTimeOffset]::Parse((ConvertTo-PnUtc $end)).UtcDateTime -lt $now) { 'closed' } else { 'open' }
        $out.Add((New-PnNotice -Provider m365 -Cloud $Cloud -SourceId $id -Kind $kind -Status $status -Title (Get-PnV $m @('title')) `
                    -Summary (Get-PnV (Get-PnV $m @('body')) @('content')) -WindowStart (Get-PnV $m @('startDateTime')) -WindowEnd $end `
                    -Services (Get-PnV $m @('services')) -ActionRequired $action -ActionRequiredBy $by -ActionBasis $basis `
                    -ProviderSeverity (Get-PnV $m @('severity')) -SourceUrl "$graph/v1.0/admin/serviceAnnouncement/messages/$id" -SourceRef $id `
                    -Published (Get-PnV $m @('startDateTime')) -LastUpdated (Get-PnV $m @('lastModifiedDateTime')) -FirstSeen $AsOf))
    }
    foreach ($i in @(Get-PnV $Issues @('value'))) {
        if ($null -eq $i) { continue }
        $id = "$(Get-PnV $i @('id'))"
        $kind = if ("$(Get-PnV $i @('classification'))" -eq 'advisory') { 'advisory' } else { 'incident' }
        $resolved = (Get-PnV $i @('isResolved')) -eq $true
        $title = Get-PnV $i @('title')
        $feature = Get-PnV $i @('feature')
        $out.Add((New-PnNotice -Provider m365 -Cloud $Cloud -SourceId $id -Kind $kind -Status $(if ($resolved) { 'closed' } else { 'open' }) `
                    -Title $title -Summary (@((Get-PnV $i @('impactDescription')), $(if ($feature) { "Feature: $feature." })) -join ' ') `
                    -WindowStart (Get-PnV $i @('startDateTime')) -WindowEnd (Get-PnV $i @('endDateTime')) -Services (Get-PnV $i @('service')) `
                    -ProviderSeverity (@((Get-PnV $i @('classification')), (Get-PnV $i @('status'))) -join ', ') `
                    -SourceUrl "$graph/v1.0/admin/serviceAnnouncement/issues/$id" -SourceRef $id -Published (Get-PnV $i @('startDateTime')) `
                    -LastUpdated (Get-PnV $i @('lastModifiedDateTime')) -FirstSeen $AsOf))
    }
    @{ Notices = $out.ToArray(); Skipped = 0 }
}

# ----------------------------------------------------------------------------- Oracle Cloud Infrastructure

function ConvertTo-PnOciNotice {
    <#
    .SYNOPSIS
        OCI announcements (ListAnnouncements, with GetAnnouncement's details where read) as notices.
        announcementType: *_MAINTENANCE* are maintenance, *_CHANGE* and ACTION_REQUIRED changes,
        PRODUCTION_EVENT_NOTIFICATION incidents, ACTION_RECOMMENDED and INFORMATION advisories.
        ACTION_REQUIRED, or a time of type ACTION_REQUIRED_BY, makes it action required (the provider's
        flag). lifecycleState INACTIVE closes it. A chain keeps only its latest announcement.
    .EXAMPLE
        ConvertTo-PnOciNotice -List $l -Details $d -Realm oc1 -Region us-ashburn-1 -AsOf 2026-11-09T12:00:00Z
    #>
    [CmdletBinding()]
    param($List, [hashtable]$Details = @{}, [Parameter(Mandatory)][string]$Realm, [Parameter(Mandatory)][string]$Region, [Parameter(Mandatory)][string]$AsOf)
    $domain = (Get-PnCloud -Provider oci -Cloud $Realm).Domain
    $body = Get-PnV $List @('data')
    if ($null -eq $body) { $body = $List }
    $items = @(Get-PnV $body @('items'))
    $latest = [ordered]@{}
    foreach ($a in $items) {
        if ($null -eq $a) { continue }
        $key = "$(Get-PnV $a @('chainId', 'id'))"
        if (-not $latest.Contains($key) -or (ConvertTo-PnUtc (Get-PnV $a @('timeUpdated', 'timeCreated'))) -gt (ConvertTo-PnUtc (Get-PnV $latest[$key] @('timeUpdated', 'timeCreated')))) { $latest[$key] = $a }
    }
    $out = foreach ($key in $latest.Keys) {
        $a = $latest[$key]; $id = "$(Get-PnV $a @('id'))"
        $d = if ($Details.Contains($id)) { $Details[$id] } else { $null }
        if ($d -and (Get-PnV $d @('data'))) { $d = Get-PnV $d @('data') }
        $type = "$(Get-PnV $a @('announcementType'))"
        $kind = if ($type -like '*MAINTENANCE*') { 'maintenance' } elseif ($type -like '*CHANGE*' -or $type -eq 'ACTION_REQUIRED') { 'change' }
        elseif ($type -eq 'PRODUCTION_EVENT_NOTIFICATION') { 'incident' } else { 'advisory' }
        $start = $null; $end = $null; $by = $null
        foreach ($n in 'One', 'Two') {
            $tt = "$(Get-PnV $a @("time${n}Type"))"; $tv = Get-PnV $a @("time${n}Value")
            if ($tt -in 'START_TIME', 'NEW_START_TIME') { $start = $tv }
            elseif ($tt -in 'END_TIME', 'NEW_END_TIME', 'ESTIMATED_END_TIME', 'ORIGINAL_END_TIME') { if (-not $end -or $tt -ne 'ORIGINAL_END_TIME') { $end = $tv } }
            elseif ($tt -eq 'ACTION_REQUIRED_BY') { $by = $tv }
        }
        $action = $false; $basis = 'none'
        if ($type -eq 'ACTION_REQUIRED') { $action = $true; $basis = 'provider: announcementType ACTION_REQUIRED' }
        elseif ($by) { $action = $true; $basis = 'provider: timeOneType ACTION_REQUIRED_BY' }
        $resources = @(); $summary = Get-PnV $a @('summary')
        if ($d) {
            $resources = @(@(Get-PnV $d @('affectedResources')) | Where-Object { $_ } | ForEach-Object { Get-PnV $_ @('resourceId') })
            $desc = Get-PnV $d @('description')
            if ($desc) { $summary = $desc }
        }
        New-PnNotice -Provider oci -Cloud $Realm -SourceId $key -Kind $kind -Status $(if ("$(Get-PnV $a @('lifecycleState'))" -eq 'INACTIVE') { 'closed' } else { 'open' }) `
            -Title (Get-PnV $a @('summary')) -Summary $summary -WindowStart $start -WindowEnd $end -Services (Get-PnV $a @('services')) `
            -Regions (Get-PnV $a @('affectedRegions')) -Resources $resources -ActionRequired $action -ActionRequiredBy $by -ActionBasis $basis `
            -ProviderSeverity $type -SourceUrl "https://announcements.$Region.$domain/20180904/announcements/$id" `
            -SourceRef "$(Get-PnV $a @('referenceTicketNumber', 'id'))" -Published (Get-PnV $a @('timeCreated')) -LastUpdated (Get-PnV $a @('timeUpdated', 'timeCreated')) -FirstSeen $AsOf
    }
    @{ Notices = @($out); Skipped = 0 }
}

# ----------------------------------------------------------------------------- AWS

$script:AwsRetirement = 'RETIREMENT|LIFECYCLE|DEPRECAT|END_OF_SUPPORT|END_OF_LIFE'

function ConvertTo-PnAwsTitle {
    # 'EC2', 'AWS_EC2_INSTANCE_RETIREMENT_SCHEDULED' -> 'EC2: Instance retirement scheduled'
    param([string]$Service, [string]$Code)
    $t = ($Code -replace '^AWS_', '' -replace "^$([regex]::Escape($Service))_", '' -replace '_', ' ').ToLowerInvariant().Trim()
    if (-not $t) { return $Service }
    "${Service}: " + $t.Substring(0, 1).ToUpperInvariant() + $t.Substring(1)
}

function ConvertTo-PnAwsNotice {
    <#
    .SYNOPSIS
        AWS Health events (DescribeEvents, with DescribeEventDetails' description and
        DescribeAffectedEntities' entities) as notices. eventTypeCategory issue and investigation are
        incidents; scheduledChange is maintenance, or a retirement when the event type code names a
        retirement, lifecycle event, deprecation or end of support (the kit's rule); accountNotification
        is an advisory, or security when its personas include SECURITY. actionability ACTION_REQUIRED
        makes it action required (the provider's flag); a retirement is action required by the kit's
        rule, due at its start time. statusCode closed closes it.
    .EXAMPLE
        ConvertTo-PnAwsNotice -Events $e -Details $d -Entities $x -Partition aws -AsOf 2026-11-09T12:00:00Z
    #>
    [CmdletBinding()]
    param($Events, $Details, $Entities, [Parameter(Mandatory)][string]$Partition, [Parameter(Mandatory)][string]$AsOf)
    $null = Get-PnCloud -Provider aws -Cloud $Partition
    $desc = @{}
    foreach ($s in @(Get-PnV $Details @('successfulSet'))) {
        if ($null -eq $s) { continue }
        $desc["$(Get-PnV (Get-PnV $s @('event')) @('arn'))"] = Get-PnV (Get-PnV $s @('eventDescription')) @('latestDescription')
    }
    $ents = @{}
    foreach ($e in @(Get-PnV $Entities @('entities'))) {
        if ($null -eq $e) { continue }
        $arn = "$(Get-PnV $e @('eventArn'))"
        if (-not $ents.Contains($arn)) { $ents[$arn] = [Collections.Generic.List[string]]::new() }
        $v = Get-PnV $e @('entityArn', 'entityValue')
        if ($v -and "$v" -ne 'UNKNOWN') { $ents[$arn].Add("$v") }
    }
    $out = foreach ($ev in @(Get-PnV $Events @('events'))) {
        if ($null -eq $ev) { continue }
        $arn = "$(Get-PnV $ev @('arn'))"; $code = "$(Get-PnV $ev @('eventTypeCode'))"; $cat = "$(Get-PnV $ev @('eventTypeCategory'))"
        $personas = @(Get-PnV $ev @('personas')) | ForEach-Object { "$_" }
        $kind = switch ($cat) {
            'issue' { 'incident' } 'investigation' { 'incident' }
            'scheduledChange' { if ($code -match $script:AwsRetirement) { 'retirement' } else { 'maintenance' } }
            default { if ($personas -contains 'SECURITY' -or $code -match 'SECURITY') { 'security' } else { 'advisory' } }
        }
        $actionability = "$(Get-PnV $ev @('actionability'))"
        $action = $false; $basis = 'none'; $by = $null
        if ($actionability -eq 'ACTION_REQUIRED') { $action = $true; $basis = 'provider: actionability ACTION_REQUIRED'; if ($cat -eq 'scheduledChange') { $by = Get-PnV $ev @('startTime') } }
        elseif ($kind -eq 'retirement') { $action = $true; $by = Get-PnV $ev @('startTime'); $basis = 'rule: AWS scheduled change whose event type code names a retirement; due at its start time' }
        $service = Get-PnV $ev @('service')
        New-PnNotice -Provider aws -Cloud $Partition -SourceId $arn -Kind $kind -Status $(if ("$(Get-PnV $ev @('statusCode'))" -eq 'closed') { 'closed' } else { 'open' }) `
            -Title (ConvertTo-PnAwsTitle -Service $service -Code $code) -Summary $desc[$arn] -WindowStart (Get-PnV $ev @('startTime')) -WindowEnd (Get-PnV $ev @('endTime')) `
            -Services $service -Regions (Get-PnV $ev @('region')) -Resources $(if ($ents.Contains($arn)) { $ents[$arn] } else { @() }) `
            -ActionRequired $action -ActionRequiredBy $by -ActionBasis $basis -ProviderSeverity ((@($code, $actionability) | Where-Object { $_ }) -join ', ') `
            -SourceUrl $null -SourceRef $arn -Published $null -LastUpdated (Get-PnV $ev @('lastUpdatedTime')) -FirstSeen $AsOf
    }
    @{ Notices = @($out); Skipped = 0 }
}

# ----------------------------------------------------------------------------- Google Cloud

function ConvertTo-PnGoogleNotice {
    <#
    .SYNOPSIS
        Personalized Service Health events (project events, or organization events) as notices. The API
        has one category, INCIDENT, so every Google notice is an incident; state CLOSED closes it. The
        latest update's description is the summary when the event has no description.
    .EXAMPLE
        ConvertTo-PnGoogleNotice -Events $e -AsOf 2026-11-09T12:00:00Z
    #>
    [CmdletBinding()]
    param($Events, [Parameter(Mandatory)][string]$AsOf)
    $api = (Get-PnCloud -Provider google -Cloud global).Api
    $list = if ($Events -is [Collections.IDictionary]) { @(Get-PnV $Events @('events', 'organizationEvents')) } else { @($Events) }
    $skipped = 0
    $out = foreach ($e in $list) {
        if ($null -eq $e) { continue }
        $name = "$(Get-PnV $e @('name'))"
        if ("$(Get-PnV $e @('category'))" -ne 'INCIDENT') { $skipped++; continue }
        $updates = @(Get-PnV $e @('updates')) | Where-Object { $_ }
        $summary = Get-PnV $e @('description')
        if (-not $summary -and $updates) { $summary = Get-PnV ($updates | Sort-Object { ConvertTo-PnUtc (Get-PnV $_ @('updateTime')) } | Select-Object -Last 1) @('description') }
        $impacts = @(Get-PnV $e @('eventImpacts')) | Where-Object { $_ }
        New-PnNotice -Provider google -Cloud global -SourceId $name -Kind incident -Status $(if ("$(Get-PnV $e @('state'))" -eq 'CLOSED') { 'closed' } else { 'open' }) `
            -Title (Get-PnV $e @('title')) -Summary $summary -WindowStart (Get-PnV $e @('startTime')) -WindowEnd (Get-PnV $e @('endTime')) `
            -Services @($impacts | ForEach-Object { Get-PnV (Get-PnV $_ @('product')) @('productName') }) `
            -Regions @($impacts | ForEach-Object { Get-PnV (Get-PnV $_ @('location')) @('locationName') }) `
            -ProviderSeverity ((@((Get-PnV $e @('detailedCategory')), (Get-PnV $e @('relevance'))) | Where-Object { $_ }) -join ', ') `
            -SourceUrl "$api/$name" -SourceRef ($name -replace '^.*/events/', '') -Published $null -LastUpdated (Get-PnV $e @('updateTime')) -FirstSeen $AsOf
    }
    @{ Notices = @($out); Skipped = $skipped }
}

# ----------------------------------------------------------------------------- collection

function Read-PnSettings {
    <#
    .SYNOPSIS
        Reads one environment's settings file (deploy/settings.template.json's shape). Refuses a file
        with a placeholder left in an enabled provider, or a secret-like name or value: the file holds
        names and IDs only.
    .EXAMPLE
        Read-PnSettings -Path tests/fixtures/settings.lab.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $text = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $Path).Path)
    if ($text -match '"[^"]*(password|secret|clientSecret|apiKey|privateKey|token)"\s*:\s*"[^"<]') { throw "Settings $Path holds a secret-like value; the settings file holds names and IDs only." }
    $s = ConvertFrom-PnJsonText -Text $text
    foreach ($k in 'environment', 'providers') { if (-not $s.Contains($k)) { throw "Settings $Path has no '$k'." } }
    foreach ($p in $s.providers.Keys) {
        if ($p -notin $script:Providers) { throw "Settings $Path names an unknown provider '$p'." }
        $row = $s.providers[$p]
        if ($row.enabled -and (ConvertTo-Json -InputObject $row -Depth 5) -match '<[a-z][^>]*>') { throw "Settings $Path still has a <placeholder> in provider '$p'." }
    }
    $s._sha256 = Get-PnFileHash -Path $Path
    $s
}

function Get-PnProviderNotice {
    <#
    .SYNOPSIS
        Collects one provider's notices through an invoker (fixture or live): runs its declared calls in
        order and normalizes the answers. Returns @{ Provider; Cloud; Raw; Notices; Skipped; Calls }.
    .EXAMPLE
        Get-PnProviderNotice -Provider oci -Settings $s -Invoker (New-PnFixtureInvoker -Path tests/fixtures/day1) -AsOf 2026-11-09T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][ValidateSet('azure', 'm365', 'oci', 'aws', 'google')][string]$Provider,
        [Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)][string]$AsOf)
    $p = $Settings.providers[$Provider]
    $raw = [ordered]@{}; $calls = [Collections.Generic.List[string]]::new()
    $do = { param($id, $a = @{}) $calls.Add($id); Invoke-PnCall -Invoker $Invoker -CallId $id -Arguments $a }
    switch ($Provider) {
        'azure' {
            $raw['azure-service-health-events'] = & $do 'azure-service-health-events'
            $raw['azure-impacted-resources'] = & $do 'azure-impacted-resources'
            $r = ConvertTo-PnAzureNotice -Events $raw['azure-service-health-events'] -Impacted $raw['azure-impacted-resources'] -Cloud $p.cloud -AsOf $AsOf
            $cloud = $p.cloud
        }
        'm365' {
            foreach ($id in 'm365-messages', 'm365-issues', 'm365-health-overviews') { $raw[$id] = & $do $id }
            $r = ConvertTo-PnM365Notice -Messages $raw['m365-messages'] -Issues $raw['m365-issues'] -Cloud $p.cloud -AsOf $AsOf
            $cloud = $p.cloud
        }
        'oci' {
            $raw['oci-announcements-list'] = & $do 'oci-announcements-list'
            $body = Get-PnV $raw['oci-announcements-list'] @('data'); if ($null -eq $body) { $body = $raw['oci-announcements-list'] }
            $details = @{}
            if (-not ($p.Contains('details') -and $p.details -eq $false)) {
                foreach ($a in @(Get-PnV $body @('items'))) {
                    if ($null -eq $a) { continue }
                    $id = "$(Get-PnV $a @('id'))"
                    $d = & $do 'oci-announcement-get' @{ key = $id }
                    if ($null -ne $d) { $details[$id] = $d }
                }
            }
            $raw['oci-announcement-get'] = $details
            $r = ConvertTo-PnOciNotice -List $raw['oci-announcements-list'] -Details $details -Realm $p.realm -Region $p.region -AsOf $AsOf
            $cloud = $p.realm
        }
        'aws' {
            $raw['aws-describe-events'] = & $do 'aws-describe-events'
            $arns = @(@(Get-PnV $raw['aws-describe-events'] @('events')) | Where-Object { $_ } | ForEach-Object { "$(Get-PnV $_ @('arn'))" })
            $det = @{ successfulSet = [Collections.Generic.List[object]]::new(); failedSet = [Collections.Generic.List[object]]::new() }
            $ent = @{ entities = [Collections.Generic.List[object]]::new() }
            for ($i = 0; $i -lt $arns.Count; $i += 10) {
                $batch = $arns[$i..([math]::Min($i + 9, $arns.Count - 1))]
                $d = & $do 'aws-describe-event-details' @{ arns = $batch }
                foreach ($s in @(Get-PnV $d @('successfulSet'))) { if ($s -and "$(Get-PnV (Get-PnV $s @('event')) @('arn'))" -in $batch) { $det.successfulSet.Add($s) } }
                foreach ($f in @(Get-PnV $d @('failedSet'))) { if ($f -and "$(Get-PnV $f @('eventArn'))" -in $batch) { $det.failedSet.Add($f) } }
                $x = & $do 'aws-describe-affected-entities' @{ arns = $batch }
                foreach ($e in @(Get-PnV $x @('entities'))) { if ($e -and "$(Get-PnV $e @('eventArn'))" -in $batch) { $ent.entities.Add($e) } }
            }
            $raw['aws-describe-event-details'] = @{ successfulSet = $det.successfulSet.ToArray(); failedSet = $det.failedSet.ToArray() }
            $raw['aws-describe-affected-entities'] = @{ entities = $ent.entities.ToArray() }
            $r = ConvertTo-PnAwsNotice -Events $raw['aws-describe-events'] -Details $raw['aws-describe-event-details'] -Entities $raw['aws-describe-affected-entities'] -Partition $p.partition -AsOf $AsOf
            $cloud = $p.partition
        }
        'google' {
            $id = if ($p.Contains('scope') -and $p.scope -eq 'organization') { 'google-organization-events' } else { 'google-events' }
            $raw[$id] = & $do $id
            $r = ConvertTo-PnGoogleNotice -Events $raw[$id] -AsOf $AsOf
            $cloud = 'global'
        }
    }
    @{ Provider = $Provider; Cloud = $cloud; Raw = $raw; Notices = @($r.Notices); Skipped = $r.Skipped; Calls = $calls.ToArray() }
}

function Write-PnManifest {
    <#
    .SYNOPSIS
        Writes manifest.json in a run folder: the task, time, mode, environment, the calls sent with their
        permissions, and the SHA-256 of every other file in the folder.
    .EXAMPLE
        Write-PnManifest -OutputPath out/day1 -Task collect -AsOf 2026-11-09T12:00:00Z -Mode Fixture -Environment lab
    #>
    param([Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$Task, [Parameter(Mandatory)][string]$AsOf,
        [string]$Mode = 'Fixture', [string]$Environment = '', [string[]]$CallIds = @(), [hashtable]$Extra = @{})
    $root = (Resolve-Path -LiteralPath $OutputPath).Path.TrimEnd('\', '/')
    $files = [ordered]@{}
    foreach ($f in (Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object Name -NE 'manifest.json' | Sort-Object { $_.FullName.Substring($root.Length + 1).Replace('\', '/') })) {
        $files[$f.FullName.Substring($root.Length + 1).Replace('\', '/')] = Get-PnFileHash -Path $f.FullName
    }
    $calls = @($CallIds | Sort-Object -Unique | ForEach-Object { $c = Get-PnCall -Id $_; [ordered]@{ id = $c.id; operation = $c.operation; permissions = @($c.permissions); doc = $c.doc } })
    $m = [ordered]@{ schema = 'fmp-pn-manifest/1'; task = $Task; asOf = $AsOf; mode = $Mode; environment = $Environment; kit = 'examples/provider-notices'; calls = $calls; files = $files }
    foreach ($k in $Extra.Keys) { $m[$k] = $Extra[$k] }
    Write-PnJson -Path (Join-Path $root 'manifest.json') -Value $m
    Get-Item -LiteralPath (Join-Path $root 'manifest.json')
}

function ConvertTo-PnCsvText {
    param([object[]]$Rows, [string[]]$Columns)
    $lines = [Collections.Generic.List[string]]::new()
    $lines.Add(($Columns | ForEach-Object { '"' + $_ + '"' }) -join ',')
    foreach ($r in $Rows) {
        $lines.Add((($Columns | ForEach-Object {
                        $v = $r[$_]
                        if ($v -is [Array]) { $v = ($v -join '; ') } elseif ($v -is [bool]) { $v = "$v".ToLowerInvariant() }
                        '"' + ("$v" -replace '"', '""') + '"'
                    }) -join ','))
    }
    ($lines -join "`n") + "`n"
}

function Invoke-PnCollection {
    <#
    .SYNOPSIS
        Collects every enabled provider (or -Provider), validates every record, and writes the run:
        raw/<provider>.json, notices.json, notices.csv and manifest.json. Returns the run's summary.
    .EXAMPLE
        Invoke-PnCollection -Settings $s -Invoker (New-PnFixtureInvoker -Path tests/fixtures/day1) -OutputPath out/day1 -AsOf 2026-11-09T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$AsOf, [string[]]$Provider = @('all'))
    $AsOf = ConvertTo-PnUtc $AsOf
    $want = if ($Provider -contains 'all') { @($script:Providers | Where-Object { $Settings.providers.Contains($_) -and $Settings.providers[$_].enabled }) } else { $Provider }
    foreach ($w in $want) { if (-not ($Settings.providers.Contains($w) -and $Settings.providers[$w].enabled)) { throw "Provider '$w' isn't enabled in the settings." } }
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $all = [Collections.Generic.List[object]]::new(); $summary = [ordered]@{}; $callIds = [Collections.Generic.List[string]]::new()
    foreach ($p in $want) {
        $r = Get-PnProviderNotice -Provider $p -Settings $Settings -Invoker $Invoker -AsOf $AsOf
        Write-PnJson -Path (Join-Path $OutputPath "raw/$p.json") -Value $r.Raw
        foreach ($n in $r.Notices) {
            $bad = @(Test-PnNotice -Notice $n)
            if ($bad.Count) { throw "Notice $($n.noticeId) isn't valid: $($bad -join '; ')" }
            $all.Add($n)
        }
        foreach ($c in $r.Calls) { $callIds.Add($c) }
        $summary[$p] = [ordered]@{ cloud = $r.Cloud; notices = $r.Notices.Count; open = @($r.Notices | Where-Object { $_.status -eq 'open' }).Count
            actionRequired = @($r.Notices | Where-Object { $_.actionRequired -and $_.status -eq 'open' }).Count; skipped = $r.Skipped; calls = @($r.Calls | Sort-Object -Unique) }
    }
    $sorted = @($all | Sort-Object { $_.noticeId })
    Write-PnJson -Path (Join-Path $OutputPath 'notices.json') -Value ([ordered]@{ schema = 'fmp-provider-notices/1'; asOf = $AsOf; mode = $Invoker.Mode; environment = $Settings.environment; providers = $summary; notices = $sorted })
    $cols = 'noticeId', 'provider', 'cloud', 'kind', 'status', 'title', 'windowStart', 'windowEnd', 'actionRequired', 'actionRequiredBy', 'services', 'regions', 'resources', 'sourceUrl', 'lastUpdated'
    Write-PnText -Path (Join-Path $OutputPath 'notices.csv') -Text (ConvertTo-PnCsvText -Rows $sorted -Columns $cols)
    $null = Write-PnManifest -OutputPath $OutputPath -Task collect -AsOf $AsOf -Mode $Invoker.Mode -Environment $Settings.environment -CallIds $callIds.ToArray() -Extra @{ providers = @($want) }
    [pscustomobject]@{ AsOf = $AsOf; Providers = $summary; Notices = $sorted; OutputPath = $OutputPath }
}

# ----------------------------------------------------------------------------- routing

function Read-PnRouting {
    <#
    .SYNOPSIS
        Reads a routing file and checks it: every rule has an id and a route of task, digest or ignore; a
        task names a severity P1 to P4 and an assignment group; match keys are known.
    .EXAMPLE
        Read-PnRouting -Path config/routing.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $r = Read-PnJson -Path $Path
    $known = 'provider', 'kind', 'status', 'actionRequired', 'hasResources', 'servicePattern', 'regionPattern'
    foreach ($rule in @($r.rules)) {
        if (-not $rule.id) { throw "A routing rule has no id." }
        foreach ($k in $rule.match.Keys) { if ($k -notin $known) { throw "Rule $($rule.id): unknown match key '$k'." } }
        if ($rule.Contains('servicePattern')) { throw "Rule $($rule.id): servicePattern belongs under match." }
    }
    foreach ($rule in @($r.rules) + @($r.defaults)) {
        $route = "$($rule['route'])"
        if ($route -notin 'task', 'digest', 'ignore') { throw "Routing: route '$route' isn't task, digest or ignore." }
        if ($route -eq 'task') {
            if ("$($rule['severity'])" -notin $script:Priority.Keys) { throw "Routing: a task rule needs a severity of P1 to P4 (rule $($rule['id']))." }
            if (-not $rule['assignmentGroup']) { throw "Routing: a task rule needs an assignment group (rule $($rule['id']))." }
        }
    }
    $body = [ordered]@{ defaults = $r.defaults; rules = $r.rules }
    if ((ConvertTo-Json $body -Depth 10) -match '<[a-z][^>]*>') { throw "Routing $Path still has a <placeholder>." }
    $r
}

function Resolve-PnRoute {
    <#
    .SYNOPSIS
        The first rule whose every match key matches the notice, or the defaults. Returns the rule with
        its id (defaults: 'default').
    .EXAMPLE
        Resolve-PnRoute -Notice $n -Routing (Read-PnRouting -Path config/routing.json)
    #>
    param([Parameter(Mandatory)][Collections.IDictionary]$Notice, [Parameter(Mandatory)][hashtable]$Routing)
    foreach ($rule in @($Routing.rules)) {
        $ok = $true
        foreach ($k in $rule.match.Keys) {
            $v = $rule.match[$k]
            $hit = switch ($k) {
                'provider' { $Notice.provider -in @($v) } 'kind' { $Notice.kind -in @($v) } 'status' { $Notice.status -in @($v) }
                'actionRequired' { [bool]$Notice.actionRequired -eq [bool]$v }
                'hasResources' { (@($Notice.resources).Count -gt 0) -eq [bool]$v }
                'servicePattern' { [bool](@($Notice.services) | Where-Object { $_ -match $v }) }
                'regionPattern' { [bool](@($Notice.regions) | Where-Object { $_ -match $v }) }
            }
            if (-not $hit) { $ok = $false; break }
        }
        if ($ok) { return $rule }
    }
    $d = @{ id = 'default' }; foreach ($k in $Routing.defaults.Keys) { $d[$k] = $Routing.defaults[$k] }; $d
}

function New-PnTaskPayload {
    <#
    .SYNOPSIS
        A ServiceNow-shaped Ticket-to-Machine typed task for one notice: create, update or close, with the
        finding contract's severity, priority and response window, the provider's action date, the five
        clauses of the request chain (C1 to C5), and the controls and KSIs the routing step supports.
    .EXAMPLE
        New-PnTaskPayload -Notice $n -Rule $rule -Action create -AsOf 2026-11-09T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][Collections.IDictionary]$Notice, [Parameter(Mandatory)][Collections.IDictionary]$Rule,
        [Parameter(Mandatory)][ValidateSet('create', 'update', 'close')][string]$Action, [Parameter(Mandatory)][string]$AsOf, [string]$Note = '')
    $req = (Read-PnJson -Path (Join-Path $script:ConfigRoot 'requirements.json')).steps
    $sev = "$($Rule.severity)"
    $due = [DateTimeOffset]::Parse((ConvertTo-PnUtc $AsOf)).UtcDateTime.AddSeconds($script:WindowSeconds[$sev])
    $label = @{ azure = 'Azure'; m365 = 'Microsoft 365'; oci = 'OCI'; aws = 'AWS'; google = 'Google Cloud' }[$Notice.provider]
    $lines = @(
        "$label $($Notice.kind): $($Notice.title)"
        "Provider ID: $($Notice.sourceRef)"
        $(if ($Notice.windowStart -or $Notice.windowEnd) { "Window: $($Notice.windowStart) to $($Notice.windowEnd)" })
        $(if ($Notice.actionRequired) { "Action required by: $(if ($Notice.actionRequiredBy) { $Notice.actionRequiredBy } else { 'not stated' }) ($($Notice.actionBasis))" })
        $(if (@($Notice.services).Count) { "Services: $(@($Notice.services) -join ', ')" })
        $(if (@($Notice.regions).Count) { "Regions: $(@($Notice.regions) -join ', ')" })
        $(if (@($Notice.resources).Count) { "Resources: $(@($Notice.resources) -join ', ')" })
        $(if ($Notice.sourceUrl) { "Source: $($Notice.sourceUrl)" })
        $(if ($Note) { "Note: $Note" })
        ''
        "$($Notice.summary)"
    ) | Where-Object { $null -ne $_ }
    $steps = @('ROUTE') + $(if ($Rule.contingencyReview) { @('CONTINGENCY') } else { @() })
    $controls = @($steps | ForEach-Object { $req[$_].controls } | Sort-Object -Unique)
    $ksis = @($steps | ForEach-Object { $req[$_].ksis } | Sort-Object -Unique)
    $short = "[$label $($Notice.kind)] $($Notice.title)"
    if ($short.Length -gt 160) { $short = $short.Substring(0, 159) + [char]0x2026 }
    [ordered]@{
        kind = 'provider_notice'; action = $Action; source = 'provider-notices-kit'; dedupe_key = "$($Notice.provider)|$($Notice.sourceId)"
        severity = $sev; priority = $script:Priority[$sev]; response_window_seconds = $script:WindowSeconds[$sev]
        response_due = (ConvertTo-PnUtc $due); action_required = [bool]$Notice.actionRequired; action_due = $Notice.actionRequiredBy
        assignment_group = "$($Rule.assignmentGroup)"; short_description = $short; description = ($lines -join "`n").TrimEnd()
        contingency_review = [bool]$Rule.contingencyReview
        origin = [ordered]@{ notice_id = $Notice.noticeId; provider = $Notice.provider; cloud = $Notice.cloud; kind = $Notice.kind; status = $Notice.status
            source_ref = $Notice.sourceRef; source_url = $Notice.sourceUrl; fingerprint = $Notice.fingerprint; rule_id = "$($Rule.id)" }
        ticket_to_machine = [ordered]@{
            lane = 'Human decision'; trigger = 'event'
            c1_origin = "Provider notice $($Notice.noticeId), read by the provider notices kit"
            c2_approver_role = "$($Rule.approverRole)"
            c3_action = $(if ($Notice.kind -in 'retirement', 'maintenance', 'change') { 'Plan the change the notice calls for and run it under change control' } else { 'Assess the notice and record the decision' })
            c4_reread_check = 'The next collection shows the notice closed or no longer listed, or the named resources no longer affected'
            c5_evidence_kept = 'notices.json and this payload from the run, the change or decision record, and the evidence chain'
        }
        controls = $controls; ksis = $ksis
    }
}

function Test-PnTaskPayload {
    <#
    .SYNOPSIS
        A payload checked against the rules the finding contract shares with it (severity P1 to P4, the
        priority and window for that severity) and the kit's own (action, de-duplication key, origin,
        assignment group, the five clauses). Returns the problems; none means valid.
    .EXAMPLE
        Test-PnTaskPayload -Payload $p
    #>
    param([Parameter(Mandatory)][Collections.IDictionary]$Payload)
    $e = [Collections.Generic.List[string]]::new()
    if ($Payload.kind -ne 'provider_notice') { $e.Add('kind must be provider_notice') }
    if ($Payload.action -notin 'create', 'update', 'close') { $e.Add('action must be create, update or close') }
    if ("$($Payload.severity)" -notin $script:Priority.Keys) { $e.Add('severity must be P1, P2, P3 or P4') }
    else {
        if ("$($Payload.priority)" -ne $script:Priority["$($Payload.severity)"]) { $e.Add('priority does not match severity') }
        if ([long]$Payload.response_window_seconds -ne $script:WindowSeconds["$($Payload.severity)"]) { $e.Add('response window does not match severity') }
    }
    if ("$($Payload.dedupe_key)" -notmatch '^(azure|m365|oci|aws|google)\|.+') { $e.Add('dedupe_key must be <provider>|<sourceId>') }
    if (-not $Payload.assignment_group) { $e.Add('assignment_group is required') }
    if (-not ($Payload.origin -and $Payload.origin.notice_id)) { $e.Add('origin.notice_id is required') }
    foreach ($c in 'c1_origin', 'c2_approver_role', 'c3_action', 'c4_reread_check', 'c5_evidence_kept') {
        if (-not ($Payload.ticket_to_machine -and $Payload.ticket_to_machine[$c])) { $e.Add("ticket_to_machine.$c is required") }
    }
    $e.ToArray()
}

function Get-PnTaskFileName {
    param([Parameter(Mandatory)][string]$Key, [Parameter(Mandatory)][string]$Action)
    $slug = ($Key -replace '[^A-Za-z0-9]+', '-').Trim('-')
    if ($slug.Length -gt 60) { $slug = $slug.Substring(0, 44) + '-' + (Get-PnTextHash -Text $Key).Substring(0, 15) }
    "$Action-$slug.json"
}

function Invoke-PnRouting {
    <#
    .SYNOPSIS
        Routes a collection: each notice compared with the state from earlier runs (new, changed,
        unchanged; open notices a provider no longer lists are 'absent'), its rule found, and a task
        payload written when a task-routed notice is new, changed, closed or gone. The state keeps each
        notice's first-seen time and fingerprint, so a re-run de-duplicates. Dry run: payloads are written
        to tasks/ and nothing is sent unless -Send, which hands each to -Sender.
    .EXAMPLE
        Invoke-PnRouting -NoticesPath out/day1/notices.json -RoutingPath config/routing.json -StatePath out/state.json -OutputPath out/day1/route -AsOf 2026-11-09T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$NoticesPath, [Parameter(Mandatory)][string]$RoutingPath, [Parameter(Mandatory)][string]$StatePath,
        [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$AsOf, [switch]$Send, [scriptblock]$Sender)
    if ($Send -and -not $Sender) { throw '-Send needs a -Sender (deploy/Invoke-PnScheduledRun.ps1 builds one from the settings file).' }
    $AsOf = ConvertTo-PnUtc $AsOf
    $run = Read-PnJson -Path $NoticesPath
    $routing = Read-PnRouting -Path $RoutingPath
    $state = if (Test-Path -LiteralPath $StatePath) { Read-PnJson -Path $StatePath } else { @{ schema = 'fmp-pn-state/1'; notices = @{} } }
    if ($state.schema -ne 'fmp-pn-state/1') { throw "State $StatePath isn't a provider notices state file." }
    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
    New-Item -ItemType Directory -Force -Path (Join-Path $OutputPath 'tasks') | Out-Null
    $rows = [Collections.Generic.List[object]]::new(); $payloads = [Collections.Generic.List[object]]::new()
    $seen = @{}
    $counts = [ordered]@{ new = 0; changed = 0; unchanged = 0; absent = 0; task = 0; digest = 0; ignore = 0; create = 0; update = 0; close = 0 }
    foreach ($n in @($run.notices)) {
        if ($null -eq $n) { continue }
        $id = $n.noticeId; $seen[$id] = $true
        $prev = if ($state.notices.Contains($id)) { $state.notices[$id] } else { $null }
        $change = if (-not $prev) { 'new' } elseif ($prev.fingerprint -ne $n.fingerprint -or $prev.status -eq 'absent') { 'changed' } else { 'unchanged' }
        $counts[$change]++
        $firstSeen = if ($prev) { $prev.firstSeen } else { $n.firstSeen }
        $rule = Resolve-PnRoute -Notice $n -Routing $routing
        $route = "$($rule.route)"; $counts[$route]++
        $hadTask = [bool]($prev -and $prev.taskKey)
        $action = $null
        if ($route -eq 'task') {
            if (-not $hadTask) { if ($n.status -eq 'open') { $action = 'create' } }
            elseif ($change -eq 'changed' -or ($prev.ruleId -ne $rule.id)) { $action = if ($n.status -eq 'closed') { 'close' } else { 'update' } }
        } elseif ($hadTask -and $change -eq 'changed' -and $n.status -eq 'closed') { $action = 'close' }
        $taskKey = if ($hadTask) { $prev.taskKey } elseif ($action -eq 'create') { "$($n.provider)|$($n.sourceId)" } else { $null }
        if ($action) {
            $useRule = if ($route -eq 'task') { $rule } else { @{ id = $prev.ruleId; severity = $prev.severity; assignmentGroup = $prev.assignmentGroup; approverRole = $prev.approverRole; contingencyReview = $prev.contingencyReview } }
            $p = New-PnTaskPayload -Notice $n -Rule $useRule -Action $action -AsOf $AsOf -Note $(if ($action -eq 'close') { 'The provider closed this notice. Close the task only after the re-read check (C4) passes.' } else { '' })
            $bad = @(Test-PnTaskPayload -Payload $p)
            if ($bad.Count) { throw "Payload for $id isn't valid: $($bad -join '; ')" }
            $payloads.Add($p); $counts[$action]++
        }
        $state.notices[$id] = [ordered]@{
            provider = $n.provider; firstSeen = $firstSeen; lastSeen = $AsOf; lastUpdated = $n.lastUpdated; fingerprint = $n.fingerprint; status = $n.status
            kind = $n.kind; title = $n.title; route = $route; ruleId = "$($rule.id)"; severity = $(if ($route -eq 'task') { "$($rule.severity)" } elseif ($prev) { $prev.severity } else { $null })
            assignmentGroup = $(if ($route -eq 'task') { "$($rule.assignmentGroup)" } elseif ($prev) { $prev.assignmentGroup } else { $null })
            approverRole = $(if ($route -eq 'task') { "$($rule.approverRole)" } elseif ($prev) { $prev.approverRole } else { $null })
            contingencyReview = $(if ($route -eq 'task') { [bool]$rule.contingencyReview } elseif ($prev) { [bool]$prev.contingencyReview } else { $false })
            taskKey = $taskKey; taskSent = $(if ($prev) { [bool]$prev.taskSent } else { $false })
        }
        $rows.Add([ordered]@{ noticeId = $id; provider = $n.provider; kind = $n.kind; status = $n.status; change = $change; ruleId = "$($rule.id)"; route = $route
                severity = $(if ($route -eq 'task') { "$($rule.severity)" } else { '' }); assignmentGroup = $(if ($route -eq 'task') { "$($rule.assignmentGroup)" } else { '' }); action = "$action"; title = $n.title })
    }
    # Open notices from a provider read in this run that the provider no longer lists.
    $ran = @($run.providers.Keys)
    foreach ($id in @($state.notices.Keys | Sort-Object)) {
        $s = $state.notices[$id]
        if ($seen.Contains($id) -or $s.provider -notin $ran -or $s.status -ne 'open') { continue }
        $counts.absent++
        $s.status = 'absent'
        $action = ''
        if ($s.taskKey) {
            $ghost = [ordered]@{ noticeId = $id; provider = $s.provider; cloud = ''; sourceId = $id.Substring($id.IndexOf(':') + 1); kind = $s.kind; status = 'closed'; title = $s.title
                summary = 'The provider no longer lists this notice.'; windowStart = $null; windowEnd = $null; services = @(); regions = @(); resources = @()
                actionRequired = $false; actionRequiredBy = $null; actionBasis = 'none'; sourceRef = $id.Substring($id.IndexOf(':') + 1); sourceUrl = $null; fingerprint = $s.fingerprint }
            $rule = @{ id = $s.ruleId; severity = $s.severity; assignmentGroup = $s.assignmentGroup; approverRole = $s.approverRole; contingencyReview = $s.contingencyReview }
            $p = New-PnTaskPayload -Notice $ghost -Rule $rule -Action update -AsOf $AsOf -Note 'No longer listed by the provider. Run the re-read check (C4) before closing.'
            $payloads.Add($p); $counts.update++; $action = 'update'
        }
        $rows.Add([ordered]@{ noticeId = $id; provider = $s.provider; kind = $s.kind; status = 'absent'; change = 'absent'; ruleId = "$($s.ruleId)"; route = "$($s.route)"
                severity = "$($s.severity)"; assignmentGroup = "$($s.assignmentGroup)"; action = $action; title = $s.title })
    }
    $sent = [Collections.Generic.List[object]]::new()
    foreach ($p in $payloads) {
        Write-PnJson -Path (Join-Path $OutputPath ("tasks/" + (Get-PnTaskFileName -Key $p.dedupe_key -Action $p.action))) -Value $p
        if ($Send) {
            $res = & $Sender $p
            $sent.Add([ordered]@{ dedupe_key = $p.dedupe_key; action = $p.action; result = "$res" })
            $k = $p.origin.notice_id; if ($state.notices.Contains($k)) { $state.notices[$k].taskSent = $true }
        }
    }
    Write-PnJson -Path (Join-Path $OutputPath 'tasks.json') -Value ([ordered]@{ schema = 'fmp-pn-tasks/1'; asOf = $AsOf; dryRun = (-not $Send); payloads = $payloads.ToArray() })
    if ($Send) { Write-PnJson -Path (Join-Path $OutputPath 'sent.json') -Value $sent.ToArray() }
    $cols = 'noticeId', 'provider', 'kind', 'status', 'change', 'ruleId', 'route', 'severity', 'assignmentGroup', 'action', 'title'
    Write-PnText -Path (Join-Path $OutputPath 'routing.csv') -Text (ConvertTo-PnCsvText -Rows @($rows | Sort-Object { $_.noticeId }) -Columns $cols)
    $state.schema = 'fmp-pn-state/1'; $state.updatedAt = $AsOf
    $ordered = [ordered]@{}; foreach ($k in @($state.notices.Keys | Sort-Object)) { $ordered[$k] = $state.notices[$k] }
    Write-PnJson -Path $StatePath -Value ([ordered]@{ schema = 'fmp-pn-state/1'; updatedAt = $AsOf; notices = $ordered })
    Copy-Item -LiteralPath $StatePath -Destination (Join-Path $OutputPath 'state.json') -Force
    $null = Write-PnManifest -OutputPath $OutputPath -Task route -AsOf $AsOf -Mode $(if ($Send) { 'Send' } else { 'DryRun' }) -Environment "$($run.environment)" `
        -Extra @{ notices = (Get-PnFileHash -Path $NoticesPath); routing = (Get-PnFileHash -Path $RoutingPath); contingencyReview = [bool](@($payloads | Where-Object { $_.contingency_review }).Count) }
    [pscustomobject]@{ Counts = $counts; Payloads = $payloads.ToArray(); Rows = $rows.ToArray(); DryRun = (-not $Send) }
}

# ----------------------------------------------------------------------------- digest

function New-PnDigest {
    <#
    .SYNOPSIS
        The weekly digest of a collection, with the routing state: open notices by provider and kind,
        action required (soonest first), maintenance and changes starting in the next -UpcomingDays,
        notices first seen in the last -Days, and notices closed or no longer listed in the last -Days.
        Writes digest.md, digest.csv and a manifest.
    .EXAMPLE
        New-PnDigest -NoticesPath out/day2/notices.json -StatePath out/state.json -OutputPath out/digest -AsOf 2026-11-16T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$NoticesPath, [Parameter(Mandatory)][string]$StatePath, [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$AsOf, [int]$Days = 7, [int]$UpcomingDays = 30)
    $AsOf = ConvertTo-PnUtc $AsOf
    $now = [DateTimeOffset]::Parse($AsOf).UtcDateTime
    $run = Read-PnJson -Path $NoticesPath
    $state = if (Test-Path -LiteralPath $StatePath) { (Read-PnJson -Path $StatePath).notices } else { @{} }
    $since = ConvertTo-PnUtc $now.AddDays(-$Days); $until = ConvertTo-PnUtc $now.AddDays($UpcomingDays)
    $notices = @(@($run.notices) | Where-Object { $_ })
    $st = { param($id, $f) if ($state.Contains($id)) { $state[$id][$f] } else { $null } }
    $open = @($notices | Where-Object { $_.status -eq 'open' })
    $label = [ordered]@{ azure = 'Azure'; m365 = 'Microsoft 365'; oci = 'Oracle Cloud Infrastructure'; aws = 'AWS'; google = 'Google Cloud' }
    $esc = { param($t) ("$t" -replace '\|', '\|') }
    $md = [Collections.Generic.List[string]]::new()
    $md.Add("# Provider notices: weekly digest"); $md.Add('')
    $md.Add("As of $AsOf. New and closed cover the last $Days days; upcoming covers the next $UpcomingDays days. Read from ``$((Split-Path -Leaf (Split-Path -Parent (Resolve-Path $NoticesPath).Path)))/notices.json`` (collected $($run.asOf), $($run.mode) mode).")
    $md.Add(''); $md.Add('## Open notices by provider'); $md.Add('')
    $md.Add('| Provider | Open | Action required | Maintenance | Retirement | Advisory | Security | Change | Incident |')
    $md.Add('|---|---|---|---|---|---|---|---|---|')
    foreach ($p in $label.Keys) {
        if (-not $run.providers.Contains($p)) { continue }
        $o = @($open | Where-Object { $_.provider -eq $p })
        $cells = @($script:Kinds | ForEach-Object { $k = $_; @($o | Where-Object { $_.kind -eq $k }).Count })
        $md.Add("| $($label[$p]) | $($o.Count) | $(@($o | Where-Object { $_.actionRequired }).Count) | $($cells -join ' | ') |")
    }
    $md.Add(''); $md.Add('## Action required'); $md.Add('')
    $act = @($open | Where-Object { $_.actionRequired } | Sort-Object @{ e = { if ($_.actionRequiredBy) { $_.actionRequiredBy } else { '9999' } } }, @{ e = { $_.noticeId } })
    if ($act.Count) {
        $md.Add('| Due | Provider | Kind | Title | Routed to | Notice |'); $md.Add('|---|---|---|---|---|---|')
        foreach ($n in $act) {
            $to = & $st $n.noticeId 'assignmentGroup'; $route = & $st $n.noticeId 'route'
            $md.Add("| $(if ($n.actionRequiredBy) { $n.actionRequiredBy.Substring(0, 10) } else { 'not stated' }) | $($label[$n.provider]) | $($n.kind) | $(& $esc $n.title) | $(if ($route -eq 'task') { & $esc $to } else { "$route" }) | ``$($n.noticeId)`` |")
        }
    } else { $md.Add('None.') }
    $md.Add(''); $md.Add("## Maintenance and changes starting in the next $UpcomingDays days"); $md.Add('')
    $up = @($open | Where-Object { $_.kind -in 'maintenance', 'change', 'retirement' -and $_.windowStart -and $_.windowStart -ge $AsOf -and $_.windowStart -le $until } | Sort-Object { $_.windowStart }, { $_.noticeId })
    if ($up.Count) {
        $md.Add('| Starts | Ends | Provider | Kind | Title | Regions |'); $md.Add('|---|---|---|---|---|---|')
        foreach ($n in $up) { $md.Add("| $($n.windowStart) | $(if ($n.windowEnd) { $n.windowEnd } else { '' }) | $($label[$n.provider]) | $($n.kind) | $(& $esc $n.title) | $(@($n.regions) -join ', ') |") }
    } else { $md.Add('None.') }
    $md.Add(''); $md.Add("## New in the last $Days days"); $md.Add('')
    $new = @($notices | Where-Object { $fs = & $st $_.noticeId 'firstSeen'; if (-not $fs) { $fs = $_.firstSeen }; $fs -gt $since } | Sort-Object { $_.noticeId })
    if ($new.Count) { foreach ($n in $new) { $md.Add("- $($label[$n.provider]) $($n.kind): $($n.title) (``$($n.noticeId)``)") } } else { $md.Add('None.') }
    $md.Add(''); $md.Add("## Closed or no longer listed in the last $Days days"); $md.Add('')
    $closed = [Collections.Generic.List[string]]::new()
    foreach ($n in @($notices | Where-Object { $_.status -eq 'closed' } | Where-Object { $_.lastUpdated -and $_.lastUpdated -ge $since } | Sort-Object { $_.noticeId })) { $closed.Add("- $($label[$n.provider]) $($n.kind): $($n.title), closed by the provider (``$($n.noticeId)``)") }
    foreach ($id in @($state.Keys | Sort-Object)) { $s = $state[$id]; if ($s.status -eq 'absent' -and $s.provider -in @($run.providers.Keys)) { $closed.Add("- $($label[$s.provider]) $($s.kind): $($s.title), no longer listed by the provider (``$id``)") } }
    if ($closed.Count) { foreach ($c in $closed) { $md.Add($c) } } else { $md.Add('None.') }
    $md.Add(''); $md.Add('Neutral by design: this digest holds what providers published and the routing the agency set. File it with the run''s evidence.')
    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
    Write-PnText -Path (Join-Path $OutputPath 'digest.md') -Text (($md -join "`n") + "`n")
    $rows = foreach ($n in ($notices | Sort-Object { $_.noticeId })) {
        $r = [ordered]@{}; foreach ($k in $n.Keys) { $r[$k] = $n[$k] }
        $r.firstSeen = $(if (& $st $n.noticeId 'firstSeen') { & $st $n.noticeId 'firstSeen' } else { $n.firstSeen })
        $r.route = "$(& $st $n.noticeId 'route')"; $r.assignmentGroup = "$(& $st $n.noticeId 'assignmentGroup')"; $r
    }
    $cols = 'noticeId', 'provider', 'kind', 'status', 'title', 'windowStart', 'windowEnd', 'actionRequired', 'actionRequiredBy', 'services', 'regions', 'firstSeen', 'route', 'assignmentGroup', 'sourceUrl'
    Write-PnText -Path (Join-Path $OutputPath 'digest.csv') -Text (ConvertTo-PnCsvText -Rows @($rows) -Columns $cols)
    $null = Write-PnManifest -OutputPath $OutputPath -Task digest -AsOf $AsOf -Mode "$($run.mode)" -Environment "$($run.environment)" -Extra @{ notices = (Get-PnFileHash -Path $NoticesPath) }
    [pscustomobject]@{ Open = $open.Count; ActionRequired = $act.Count; Upcoming = $up.Count; New = $new.Count; Closed = $closed.Count; Path = (Join-Path $OutputPath 'digest.md') }
}

# ----------------------------------------------------------------------------- evidence

function Get-PnRequirements {
    <#
    .SYNOPSIS
        Reads config/requirements.json: each step's SP 800-53 controls and FedRAMP 20x KSIs, and the steps
        each stage's evidence must hold.
    .EXAMPLE
        (Get-PnRequirements).steps.ROUTE.ksis
    #>
    param([string]$Path = (Join-Path $script:ConfigRoot 'requirements.json'))
    Read-PnJson -Path $Path
}

function Test-PnRunFolder {
    <#
    .SYNOPSIS
        Re-hashes every file a run folder's manifest.json lists. Returns @{ Ok; Detail; Manifest }.
    .EXAMPLE
        Test-PnRunFolder -Path out/day1
    #>
    param([Parameter(Mandatory)][string]$Path)
    $mp = Join-Path $Path 'manifest.json'
    if (-not (Test-Path -LiteralPath $mp)) { return @{ Ok = $false; Detail = "no manifest.json in $Path"; Manifest = $null } }
    $m = Read-PnJson -Path $mp
    $bad = @()
    foreach ($f in $m.files.Keys) {
        $fp = Join-Path $Path $f
        if (-not (Test-Path -LiteralPath $fp)) { $bad += "$f missing" } elseif ((Get-PnFileHash -Path $fp) -ne $m.files[$f]) { $bad += "$f changed since its manifest" }
    }
    @{ Ok = (-not $bad.Count); Detail = $(if ($bad.Count) { $bad -join '; ' } else { "$($m.files.Count) files match the manifest" }); Manifest = $m }
}

function Get-PnStepsForRun {
    param([Parameter(Mandatory)][hashtable]$Manifest)
    switch ($Manifest.task) {
        'collect' { @(@($Manifest.providers) | ForEach-Object { "COL-$("$_".ToUpperInvariant())" }) + @('NORMALIZE') }
        'route' { @('ROUTE') + $(if ($Manifest.contingencyReview) { @('CONTINGENCY') } else { @() }) }
        'digest' { @('DIGEST') }
        'preflight' { @('PRE') }
        'alerts' { @('ALERTS') }
        'scheduled-run' { @('RUN') }
        'rollback' { @('RB') }
        default { throw "No evidence step for task '$($Manifest.task)'." }
    }
}

function Update-PnEvidenceSums {
    <#
    .SYNOPSIS
        Rewrites SHA256SUMS in an evidence folder: one "sha256  relative/path" line per file, LF line
        endings, so the ISSO can check it with sha256sum -c SHA256SUMS. Returns the line count.
    .EXAMPLE
        Update-PnEvidenceSums -EvidencePath out/evidence
    #>
    param([Parameter(Mandatory)][string]$EvidencePath)
    $root = (Resolve-Path -LiteralPath $EvidencePath).Path.TrimEnd('\', '/')
    $lines = @(Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object Name -NE 'SHA256SUMS' |
            Sort-Object { $_.FullName.Substring($root.Length + 1).Replace('\', '/') } |
            ForEach-Object { '{0}  {1}' -f (Get-PnFileHash -Path $_.FullName), $_.FullName.Substring($root.Length + 1).Replace('\', '/') })
    [IO.File]::WriteAllText((Join-Path $root 'SHA256SUMS'), ($lines -join "`n") + "`n", [Text.UTF8Encoding]::new($false))
    $lines.Count
}

function Write-PnEvidence {
    <#
    .SYNOPSIS
        Records one run folder as evidence: checks its manifest, copies it under runs/, and writes a record
        with the time, environment, command, result, the steps it covers with their SP 800-53 controls and
        FedRAMP 20x KSIs (config/requirements.json), every file's SHA-256, and the SHA-256 of the record
        before it, so the records form a chain. Appends records.csv and rewrites SHA256SUMS.
    .EXAMPLE
        Write-PnEvidence -EvidencePath out/evidence -RunPath out/day1 -AsOf 2026-11-09T12:00:00Z -Command './Invoke-PnCollect.ps1 ...'
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$EvidencePath, [Parameter(Mandatory)][string]$RunPath, [Parameter(Mandatory)][string]$AsOf,
        [string]$Command = '', [string]$ChangeRecord = '', [string]$Note = '')
    $AsOf = ConvertTo-PnUtc $AsOf
    $req = Get-PnRequirements
    $t = Test-PnRunFolder -Path $RunPath
    if (-not $t.Manifest) { throw $t.Detail }
    $steps = @(Get-PnStepsForRun -Manifest $t.Manifest) + @('EVIDENCE')
    New-Item -ItemType Directory -Force -Path (Join-Path $EvidencePath 'records') | Out-Null
    $prior = @(Get-ChildItem -LiteralPath (Join-Path $EvidencePath 'records') -Filter '*.json' -File | Sort-Object Name)
    $seq = $prior.Count + 1
    $prev = if ($prior.Count) { Get-PnFileHash -Path $prior[-1].FullName } else { $null }
    $name = '{0:d4}-{1}' -f $seq, $t.Manifest.task
    $dest = Join-Path $EvidencePath "runs/$name"
    if (Test-Path -LiteralPath $dest) { Remove-Item -Recurse -Force -LiteralPath $dest }
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Copy-Item -Path (Join-Path $RunPath '*') -Destination $dest -Recurse -Force
    $files = @(foreach ($k in $t.Manifest.files.Keys) { [ordered]@{ path = "runs/$name/$k"; sha256 = $t.Manifest.files[$k] } }) + @([ordered]@{ path = "runs/$name/manifest.json"; sha256 = (Get-PnFileHash -Path (Join-Path $RunPath 'manifest.json')) })
    $controls = @($steps | ForEach-Object { $req.steps[$_].controls } | Sort-Object -Unique)
    $ksis = @($steps | ForEach-Object { $req.steps[$_].ksis } | Sort-Object -Unique)
    $rec = [ordered]@{
        schema = 'fmp-pn-evidence/1'; sequence = $seq; recordedAt = $AsOf; task = $t.Manifest.task; environment = "$($t.Manifest.environment)"; mode = "$($t.Manifest.mode)"
        changeRecord = $ChangeRecord; command = $Command.Trim(); result = $(if ($t.Ok) { 'Pass' } else { 'Fail' }); detail = $t.Detail; note = $Note
        steps = @($steps | ForEach-Object { [ordered]@{ id = $_; title = $req.steps[$_].title; controls = @($req.steps[$_].controls); ksis = @($req.steps[$_].ksis) } })
        controls = @($controls | ForEach-Object { [ordered]@{ id = $_; title = $req.controls[$_].title } }); ksis = $ksis
        claim = 'Supports the controls listed; the agency''s assessor decides whether a control is satisfied. KSIs are FedRAMP 20x indicators for cloud service providers; this record lines the agency''s evidence up with them.'
        files = $files; previousRecordSha256 = $prev
    }
    $recPath = Join-Path $EvidencePath "records/$name.json"
    Write-PnJson -Path $recPath -Value $rec
    $csv = Join-Path $EvidencePath 'records.csv'
    if (-not (Test-Path -LiteralPath $csv)) { Write-PnText -Path $csv -Text "sequence,recordedAt,task,environment,result,steps,controls,ksis,recordSha256,previousRecordSha256`n" }
    $line = (@($seq, $AsOf, $t.Manifest.task, "$($t.Manifest.environment)", $rec.result, ($steps -join ' '), ($controls -join ' '), ($ksis -join ' '), (Get-PnFileHash -Path $recPath), "$prev") | ForEach-Object { '"' + ("$_" -replace '"', '""') + '"' }) -join ','
    [IO.File]::AppendAllText($csv, $line + "`n", [Text.UTF8Encoding]::new($false))
    $null = Update-PnEvidenceSums -EvidencePath $EvidencePath
    [pscustomobject]@{ Record = $recPath; Sequence = $seq; Result = $rec.result; Steps = $steps; Controls = $controls; Ksis = $ksis }
}

function Test-PnEvidence {
    <#
    .SYNOPSIS
        Checks an evidence folder: every file SHA256SUMS lists is unchanged and every file is listed; each
        record's files match their hashes; the chain is unbroken; and, with -Stage, every step the stage
        needs (config/requirements.json 'stages') has a passing record. Returns one row per check.
    .EXAMPLE
        Test-PnEvidence -EvidencePath out/evidence -Stage test
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$EvidencePath, [ValidateSet('test', 'production')][string]$Stage)
    $rows = [Collections.Generic.List[object]]::new()
    $add = { param($id, $ok, $detail) $rows.Add([pscustomobject][ordered]@{ Check = $id; Status = $(if ($ok) { 'Pass' } else { 'Fail' }); Detail = $detail }) }
    $root = (Resolve-Path -LiteralPath $EvidencePath).Path.TrimEnd('\', '/')
    $sums = Join-Path $root 'SHA256SUMS'
    if (-not (Test-Path -LiteralPath $sums)) { & $add 'SUMS' $false 'no SHA256SUMS'; return $rows.ToArray() }
    $listed = @{}; $bad = @()
    foreach ($l in (Get-Content -LiteralPath $sums)) { if ($l -match '^([0-9a-f]{64})  (.+)$') { $listed[$Matches[2]] = $Matches[1] } }
    foreach ($f in (Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object Name -NE 'SHA256SUMS')) {
        $rel = $f.FullName.Substring($root.Length + 1).Replace('\', '/')
        if (-not $listed.Contains($rel)) { $bad += "$rel not listed" } elseif ($listed[$rel] -ne (Get-PnFileHash -Path $f.FullName)) { $bad += "$rel changed" }
    }
    foreach ($k in $listed.Keys) { if (-not (Test-Path -LiteralPath (Join-Path $root $k))) { $bad += "$k missing" } }
    & $add 'SUMS' (-not $bad.Count) $(if ($bad.Count) { $bad -join '; ' } else { "$($listed.Count) files match SHA256SUMS" })
    $recs = @(Get-ChildItem -LiteralPath (Join-Path $root 'records') -Filter '*.json' -File -ErrorAction SilentlyContinue | Sort-Object Name)
    $prev = $null; $chain = @(); $passed = @{}
    foreach ($r in $recs) {
        $j = Read-PnJson -Path $r.FullName
        if ("$($j.previousRecordSha256)" -ne "$prev") { $chain += "$($r.Name) doesn't follow the record before it" }
        foreach ($f in @($j.files)) { $fp = Join-Path $root $f.path; if (-not (Test-Path -LiteralPath $fp) -or (Get-PnFileHash -Path $fp) -ne $f.sha256) { $chain += "$($f.path) doesn't match $($r.Name)" } }
        if ($j.result -eq 'Pass') { foreach ($s in @($j.steps)) { $passed[$s.id] = $true } }
        $prev = Get-PnFileHash -Path $r.FullName
    }
    & $add 'CHAIN' ($recs.Count -and -not $chain.Count) $(if (-not $recs.Count) { 'no records' } elseif ($chain.Count) { $chain -join '; ' } else { "$($recs.Count) records, chain unbroken" })
    if ($Stage) {
        foreach ($s in (Get-PnRequirements).stages[$Stage]) { & $add "STEP-$s" $passed.Contains($s) $(if ($passed.Contains($s)) { 'a passing record covers it' } else { 'no passing record' }) }
    }
    $rows.ToArray()
}

Export-ModuleMember -Function Get-PnCloud, Read-PnJson, Write-PnJson, Get-PnFileHash, Get-PnV, ConvertTo-PnUtc, ConvertTo-PnPlainText, Get-PnCall, Get-PnRequiredPermission, New-PnFixtureInvoker, Invoke-PnCall, Set-PnRunner, Invoke-PnNative, Get-PnAzureQuery, Get-PnLiveCommand, Assert-PnLiveContext, New-PnLiveInvoker, New-PnNotice, Test-PnNotice, ConvertTo-PnAzureNotice, ConvertTo-PnM365Notice, ConvertTo-PnOciNotice, ConvertTo-PnAwsNotice, ConvertTo-PnGoogleNotice, Read-PnSettings, Get-PnProviderNotice, Write-PnManifest, Invoke-PnCollection, Read-PnRouting, Resolve-PnRoute, New-PnTaskPayload, Test-PnTaskPayload, Invoke-PnRouting, New-PnDigest, Get-PnRequirements, Test-PnRunFolder, Update-PnEvidenceSums, Write-PnEvidence, Test-PnEvidence
