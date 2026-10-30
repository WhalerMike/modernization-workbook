<#
.SYNOPSIS
    Shared plumbing for the validation kit: the run context, data access (fixtures, Microsoft
    Graph, Azure Resource Graph, Active Directory), the result shape, the guarded writers and
    the provenance manifest. Dot-sourced by ValidationKit.psm1.

.DESCRIPTION
    Read-only by design. Microsoft Graph is called only through Invoke-VkGraphRequest, which
    sends GET and nothing else. The one exception is Invoke-VkRuleValidation, which sends
    Microsoft Graph's beta evaluateDynamicMembership action for VK-DG-03: it evaluates a rule
    and changes nothing. Azure is read through Search-AzGraph (Azure Resource Graph) only;
    Active Directory through Get-ADUser and Get-ADServiceAccount only. Every file goes through
    Write-VkJson, Write-VkCsv or Write-VkText, which refuse any path outside a registered
    output root. tests/powershell/Safety.Tests.ps1 enforces all of this on the source.

    Windows PowerShell 5.1 and PowerShell 7: no PowerShell 7-only syntax here.
#>

$script:VkKitVersion = '0.1.0'
$script:VkUtf8 = [System.Text.UTF8Encoding]::new($false)
$script:VkAllowedRoots = [System.Collections.Generic.List[string]]::new()
$script:VkQueryLog = [System.Collections.Generic.List[object]]::new()
$script:VkKitRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))

# Microsoft Learn, "Microsoft Graph national cloud deployments" and "Use Microsoft Graph PowerShell
# authentication commands" (Get-MgEnvironment). GCC (Moderate) uses the worldwide service. GCC High
# and DoD are listed only so a High-only run can reach its own endpoint.
$script:VkClouds = @{
    global  = @{ GraphEnvironment = 'Global'; AzureEnvironment = 'AzureCloud'; GraphHost = 'https://graph.microsoft.com' }
    gcc     = @{ GraphEnvironment = 'Global'; AzureEnvironment = 'AzureCloud'; GraphHost = 'https://graph.microsoft.com' }
    gcchigh = @{ GraphEnvironment = 'USGov'; AzureEnvironment = 'AzureUSGovernment'; GraphHost = 'https://graph.microsoft.us' }
    dod     = @{ GraphEnvironment = 'USGovDoD'; AzureEnvironment = 'AzureUSGovernment'; GraphHost = 'https://dod-graph.microsoft.us' }
}

$script:VkDefaultOptions = [ordered]@{
    # Input files, resolved against -InputPath (or the fixture folder), then the kit's config folder.
    ExceptionsFile           = 'exceptions.csv'
    HrExportFile             = 'hr-export.csv'
    RuleTestsFile            = 'rule-tests.json'
    ShadowPairsFile          = 'shadow-pairs.csv'
    SnapshotFile             = 'membership-snapshot.json'
    AuGroupMapFile           = 'au-group-map.csv'
    RestrictedAuReasonsFile  = 'restricted-au-reasons.csv'
    AutopilotTagsFile        = 'autopilot-group-tags.csv'
    PlatformMatrixFile       = 'platform-matrix.csv'
    TagTaxonomyFile          = 'tag-taxonomy.json'
    CmdbFile                 = 'cmdb.csv'
    SecretExceptionsFile     = 'secret-exceptions.csv'
    BreakGlassFile           = 'break-glass.csv'
    OnboardingWavesFile      = 'onboarding-waves.csv'
    HighPrivilegeRolesFile   = 'high-privilege-graph-roles.json'
    GovernedGroupsFile       = 'governed-groups.csv'
    EmergencyAccessGroupsFile = 'emergency-access-groups.csv'
    PivCardHoldersFile       = 'pilot-card-holders.csv'
    AdSlotExportFile         = 'ad-slot-export.csv'
    GpoScopeFile             = 'gpo-scope.csv'
    # VK-PIV-01: High (the program's production position) or Low.
    RequiredAffinity         = 'High'
    # The program attribute map (Book 03, Chapter 06): organization code, worker type, position category.
    CodedSlots               = @('extensionAttribute10', 'extensionAttribute11', 'extensionAttribute12')
    OrgCodeSlot              = 'extensionAttribute10'
    # Book 05, Chapter 08's device attribute schema: tier, role, environment.
    DeviceSlots              = @('extensionAttribute11', 'extensionAttribute12', 'extensionAttribute13')
    LookbackDays             = 30
    CatchUpDays              = 3
    WorkflowCeiling          = 100
    WorkflowWarnAt           = 90
    ShadowAllowedDifferences = 0
    DeltaThresholdPercent    = 10
    DeltaThresholdMinimum    = 5
    StaleDays                = 90
    MinSupportedAgentVersion = '1.58'
    BaselineAssignmentName   = ''
    PatchAssessmentDays      = 7
    ExpiringDays             = 30
    MaxSecretDays            = 180
    MaxCertificateDays       = 365
    MinOwners                = 2
    MaxPasswordAgeDays       = 365
    ServiceAccountNameHint   = 'svc'
    Subscriptions            = @()
    # VK-ARC-07: CMDB config_owner or ConfigOwner tag values that mean "machine configuration owns it".
    MachineConfigurationOwnerValues = @('machine-configuration', 'machineconfiguration', 'machine configuration', 'azure machine configuration')
    # VK-NPI-09 (preview): days without a service principal sign-in.
    SpInactiveDays           = 90
}

# ---------------------------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------------------------

function Get-VkValue {
    # A property from a PSObject or a dictionary, or $Default when it's absent.
    param($Object, [string]$Name, $Default = $null)
    if ($null -eq $Object) { return $Default }
    if ($Object -is [System.Collections.IDictionary]) {
        if ($Object.Contains($Name)) { return $Object[$Name] }
        return $Default
    }
    $p = $Object.PSObject.Properties[$Name]
    if ($p) { return $p.Value }
    $Default
}

function Test-VkBlank {
    param($Value)
    ($null -eq $Value) -or ("$Value".Trim() -eq '')
}

function Get-VkExtensionAttribute {
    # extensionAttributeN from a user (onPremisesExtensionAttributes) or a device (extensionAttributes).
    param($Object, [string]$Slot)
    $bag = Get-VkValue $Object 'onPremisesExtensionAttributes'
    if ($null -eq $bag) { $bag = Get-VkValue $Object 'extensionAttributes' }
    $v = Get-VkValue $bag $Slot
    if (Test-VkBlank $v) { return $null }
    "$v".Trim()
}

function ConvertTo-VkUtc {
    # Accepts strings, DateTime and DateTimeOffset (PowerShell 7's ConvertFrom-Json turns ISO
    # strings into DateTime; 5.1 leaves them as strings). Returns a UTC DateTimeOffset or $null.
    param($Value)
    if ($null -eq $Value -or "$Value" -eq '') { return $null }
    if ($Value -is [datetimeoffset]) { return $Value.ToUniversalTime() }
    if ($Value -is [datetime]) {
        $d = $Value
        if ($d.Kind -eq [System.DateTimeKind]::Unspecified) { $d = [datetime]::SpecifyKind($d, [System.DateTimeKind]::Utc) }
        return [datetimeoffset]::new($d.ToUniversalTime(), [timespan]::Zero)
    }
    [datetimeoffset]::Parse([string]$Value, [cultureinfo]::InvariantCulture, [System.Globalization.DateTimeStyles]::AssumeUniversal).ToUniversalTime()
}

function Format-VkUtc {
    param($Value)
    if ($null -eq $Value) { return '' }
    (ConvertTo-VkUtc $Value).ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", [cultureinfo]::InvariantCulture)
}

function Get-VkDays {
    # Whole days from $From to $To, floored.
    param($From, $To)
    [int][math]::Floor(((ConvertTo-VkUtc $To) - (ConvertTo-VkUtc $From)).TotalDays)
}

function ConvertTo-VkVersion {
    # A [version] from a dotted string, padded to two parts; $null when it doesn't parse.
    param([string]$Value)
    if (Test-VkBlank $Value) { return $null }
    $m = [regex]::Match($Value, '\d+(\.\d+){0,3}')
    if (-not $m.Success) { return $null }
    $s = $m.Value
    if ($s -notmatch '\.') { $s = "$s.0" }
    [version]$s
}

function ConvertTo-VkDetail {
    # "key=value; key=value" from an ordered dictionary, for the CSV Detail column.
    param([System.Collections.IDictionary]$Data)
    if (-not $Data) { return '' }
    (@($Data.Keys | ForEach-Object { '{0}={1}' -f $_, ((@($Data[$_]) | ForEach-Object { "$_" }) -join ',') })) -join '; '
}

function ConvertTo-VkFinding {
    # One row of a check's Details. Every row has the same columns so it exports cleanly.
    # Severity: Finding (fails the check), Warn (needs review), Info (context only).
    param(
        [Parameter(Mandatory)][ValidateSet('Finding', 'Warn', 'Info')][string]$Severity,
        [string]$Object = '',
        [string]$ObjectId = '',
        [Parameter(Mandatory)][string]$Issue,
        [System.Collections.IDictionary]$Data
    )
    [pscustomobject][ordered]@{
        Severity = $Severity
        Object   = $Object
        ObjectId = $ObjectId
        Issue    = $Issue
        Detail   = ConvertTo-VkDetail $Data
    }
}

function Get-VkOutcome {
    # Status from the rows: Fail when any Finding, Warn when any Warn, otherwise Pass.
    # Count is the rows that need action (Finding and Warn); Info rows don't count.
    param([object[]]$Rows = @(), [string]$Message = '', [string]$Status, $Artifacts = $null)
    $rows = @($Rows | Where-Object { $null -ne $_ })
    $count = @($rows | Where-Object { $_.Severity -ne 'Info' }).Count
    if (-not $Status) {
        $Status = 'Pass'
        if (@($rows | Where-Object Severity -eq 'Warn').Count -gt 0) { $Status = 'Warn' }
        if (@($rows | Where-Object Severity -eq 'Finding').Count -gt 0) { $Status = 'Fail' }
    }
    @{ Status = $Status; Count = $count; Details = $rows; Message = $Message; Artifacts = $Artifacts }
}

function Get-VkNotApplicable {
    param([string]$Message)
    @{ Status = 'NotApplicable'; Count = 0; Details = @(); Message = $Message; Artifacts = $null }
}

# ---------------------------------------------------------------------------------------------
# Run context and inputs
# ---------------------------------------------------------------------------------------------

function Get-VkRunContext {
    <#
    .SYNOPSIS
        The settings every check reads: fixture or live mode, where the inputs are, the as-of
        time, the cloud and the thresholds (defaults merged with -Option).
    #>
    [CmdletBinding()]
    param(
        [string]$FixturePath,
        [string]$InputPath,
        $AsOf,
        [ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud = 'gcc',
        [hashtable]$Option = @{},
        [switch]$SkipAD,
        [switch]$IncludeBeta,
        [switch]$IncludePreview
    )
    $options = [ordered]@{}
    foreach ($k in $script:VkDefaultOptions.Keys) { $options[$k] = $script:VkDefaultOptions[$k] }
    foreach ($k in $Option.Keys) {
        if (-not $options.Contains($k)) { throw "Unknown option '$k'. Known options: $($script:VkDefaultOptions.Keys -join ', ')" }
        $options[$k] = $Option[$k]
    }
    $fixture = $null
    if ($FixturePath) {
        $fixture = ConvertTo-VkFullPath $FixturePath
        if (-not (Test-Path -LiteralPath $fixture -PathType Container)) { throw "Fixture folder not found: $fixture" }
    }
    $inputs = $null
    if ($InputPath) { $inputs = ConvertTo-VkFullPath $InputPath } elseif ($fixture) { $inputs = $fixture }
    $when = if ($null -ne $AsOf -and "$AsOf" -ne '') { ConvertTo-VkUtc $AsOf } else { [datetimeoffset]::UtcNow }
    $mode = 'Live'
    if ($fixture) { $mode = 'Fixture' }
    [pscustomobject]@{
        Mode        = $mode
        FixturePath = $fixture
        InputPath   = $inputs
        AsOf        = $when
        Cloud       = $Cloud
        GraphHost   = $script:VkClouds[$Cloud].GraphHost
        Options     = $options
        SkipAD      = [bool]$SkipAD
        IncludeBeta = [bool]$IncludeBeta
        IncludePreview = [bool]$IncludePreview
        Cache       = @{}
    }
}

function ConvertTo-VkFullPath {
    # Resolves a relative path against PowerShell's current location.
    param([Parameter(Mandatory)][string]$Path)
    [System.IO.Path]::GetFullPath($ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Path))
}

function Resolve-VkInputFile {
    # The input named by an option: an absolute path, or a name looked up in -InputPath and then
    # in the kit's config folder (which ships defaults for the platform matrix, tag taxonomy and
    # high-privilege role list). $null when there's no such file.
    param([Parameter(Mandatory)]$Context, [Parameter(Mandatory)][string]$Option)
    $name = "$($Context.Options[$Option])"
    if (Test-VkBlank $name) { return $null }
    if ([System.IO.Path]::IsPathRooted($name)) {
        if (Test-Path -LiteralPath $name -PathType Leaf) { return $name }
        return $null
    }
    foreach ($dir in @($Context.InputPath, (Join-Path $script:VkKitRoot 'config'))) {
        if (-not $dir) { continue }
        $p = Join-Path $dir $name
        if (Test-Path -LiteralPath $p -PathType Leaf) { return $p }
    }
    $null
}

function Read-VkInputCsv {
    param([Parameter(Mandatory)]$Context, [Parameter(Mandatory)][string]$Option)
    $p = Resolve-VkInputFile -Context $Context -Option $Option
    if (-not $p) { return $null }
    Trace-VkQuery -Source 'Input' -Query (Split-Path -Leaf $p)
    , @(Import-Csv -LiteralPath $p)
}

function Read-VkInputJson {
    param([Parameter(Mandatory)]$Context, [Parameter(Mandatory)][string]$Option)
    $p = Resolve-VkInputFile -Context $Context -Option $Option
    if (-not $p) { return $null }
    Trace-VkQuery -Source 'Input' -Query (Split-Path -Leaf $p)
    # Assigned first: Windows PowerShell 5.1's ConvertFrom-Json writes a JSON array as one object.
    $o = ConvertFrom-Json -InputObject ([System.IO.File]::ReadAllText($p))
    $o
}

function Trace-VkQuery {
    param([string]$Source, [string]$Query)
    $script:VkQueryLog.Add([pscustomobject][ordered]@{ Source = $Source; Query = $Query; AtUtc = Format-VkUtc ([datetimeoffset]::UtcNow) })
}

# ---------------------------------------------------------------------------------------------
# Data access: one entry point for fixtures, Graph, Resource Graph and AD
# ---------------------------------------------------------------------------------------------

function Get-VkData {
    <#
    .SYNOPSIS
        Reads one data set. In fixture mode, <FixturePath>\<Name>.json (and, with -Key, that
        property of it). Live, the Graph URI, the Resource Graph query or the AD scriptblock.
        Every read is logged as the check's evidence.
    #>
    param(
        [Parameter(Mandatory)]$Context,
        [Parameter(Mandatory)][string]$Name,
        [string]$Uri,
        [ValidateSet('Graph', 'ResourceGraph', 'ResourceManager', 'ActiveDirectory')][string]$Source = 'Graph',
        [string]$Key,
        [switch]$Advanced,
        [switch]$Single,
        [switch]$Count,
        [switch]$Optional,
        [scriptblock]$Reader
    )
    $query = if ($Uri) { $Uri } else { $Name }
    if ($Context.Mode -eq 'Fixture') {
        $file = Join-Path $Context.FixturePath "$Name.json"
        $label = "fixture:$Name.json"
        if ($Key) { $label = "$label[$Key]" }
        Trace-VkQuery -Source "$Source (fixture)" -Query "$label <= $query"
        $cacheKey = "fixture|$Name"
        if (-not $Context.Cache.ContainsKey($cacheKey)) {
            if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
                if ($Optional) { return $null }
                throw "Fixture file not found: $Name.json"
            }
            $Context.Cache[$cacheKey] = ConvertFrom-Json -InputObject ([System.IO.File]::ReadAllText($file))
        }
        $data = $Context.Cache[$cacheKey]
        if ($Key) {
            $p = $data.PSObject.Properties[$Key]
            if (-not $p) {
                if ($Count -or $Single) { return $null }
                return @()
            }
            $data = $p.Value
        }
        if ($Count -or $Single) { return $data }
        return @($data)
    }

    Trace-VkQuery -Source $Source -Query $query
    $cacheKey = "$Source|$query"
    if ($Context.Cache.ContainsKey($cacheKey)) { return $Context.Cache[$cacheKey] }
    $result = switch ($Source) {
        'Graph' {
            try {
                if ($Count) { Get-VkGraphCount -Uri $Uri -GraphHost $Context.GraphHost }
                else { Invoke-VkGraphGet -Uri $Uri -GraphHost $Context.GraphHost -Advanced:$Advanced -Single:$Single }
            } catch {
                if ($Optional -and (Get-VkHttpStatus $_) -in 400, 403, 404) { $null } else { throw }
            }
        }
        'ResourceGraph' { Invoke-VkResourceGraph -Query $Uri -Subscription @($Context.Options['Subscriptions']) }
        'ResourceManager' { , @(& $Reader) }
        'ActiveDirectory' { , @(& $Reader) }
    }
    $Context.Cache[$cacheKey] = $result
    $result
}

# ---------------------------------------------------------------------------------------------
# Microsoft Graph (the house pattern from examples/ms-automation: Connect-MgGraph -Environment,
# Invoke-MgGraphRequest, follow @odata.nextLink, low throttle priority), plus a retry loop
# ---------------------------------------------------------------------------------------------

function Connect-VkGraph {
    <#
    .SYNOPSIS
        Signs in to Microsoft Graph for the chosen cloud. Delegated with the least-privileged
        read scopes the selected checks need, or app-only with a certificate or a managed
        identity (permissions then come from the app's admin-consented grants).
    #>
    [CmdletBinding(DefaultParameterSetName = 'Delegated')]
    param(
        [Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
        [Parameter(ParameterSetName = 'Delegated')][string[]]$Scopes,
        [string]$TenantId,
        [Parameter(Mandatory, ParameterSetName = 'Certificate')][string]$ClientId,
        [Parameter(Mandatory, ParameterSetName = 'Certificate')][string]$CertificateThumbprint,
        [Parameter(Mandatory, ParameterSetName = 'ManagedIdentity')][switch]$Identity
    )
    $envName = $script:VkClouds[$Cloud].GraphEnvironment
    $p = @{ Environment = $envName; NoWelcome = $true }
    if ($TenantId) { $p.TenantId = $TenantId }
    switch ($PSCmdlet.ParameterSetName) {
        'Delegated' { $p.Scopes = @($Scopes) }
        'Certificate' { $p.ClientId = $ClientId; $p.CertificateThumbprint = $CertificateThumbprint }
        'ManagedIdentity' { $p.Identity = $true; $p.Remove('TenantId') }
    }
    Connect-MgGraph @p
}

function Connect-VkAzure {
    <# Signs in to Azure for Resource Graph reads; Reader at the scope is enough. #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
        [string]$TenantId,
        [switch]$Identity
    )
    $p = @{ Environment = $script:VkClouds[$Cloud].AzureEnvironment }
    if ($TenantId) { $p.Tenant = $TenantId }
    if ($Identity) { $p.Identity = $true }
    $null = Connect-AzAccount @p
}

function Assert-VkGraphUri {
    # A relative path, or an absolute URL on this cloud's Graph host. Refuses anything else, so a
    # nextLink pointing elsewhere never receives the token.
    param([Parameter(Mandatory)][string]$Uri, [Parameter(Mandatory)][string]$GraphHost)
    if ($Uri.StartsWith('/')) { return }
    if ($Uri.StartsWith($GraphHost + '/', [System.StringComparison]::OrdinalIgnoreCase)) { return }
    throw "Refusing to call a URL outside $($GraphHost): $Uri"
}

function Get-VkHttpStatus {
    # The HTTP status code from an Invoke-MgGraphRequest or Search-AzGraph error, or 0.
    param($ErrorRecord)
    $ex = $ErrorRecord
    if ($ErrorRecord -is [System.Management.Automation.ErrorRecord]) { $ex = $ErrorRecord.Exception }
    try {
        $resp = $ex.Response
        if ($resp -and $resp.StatusCode) { return [int]$resp.StatusCode }
    } catch { $null = $_ }
    $m = [regex]::Match("$($ex.Message)", '\b(400|401|403|404|429|500|502|503|504)\b|TooManyRequests|ServiceUnavailable|GatewayTimeout')
    if (-not $m.Success) { return 0 }
    switch ($m.Value) {
        'TooManyRequests' { return 429 }
        'ServiceUnavailable' { return 503 }
        'GatewayTimeout' { return 504 }
        default { return [int]$m.Value }
    }
}

function Get-VkRetryAfter {
    # Seconds from the Retry-After header, when the error carries one.
    param($ErrorRecord)
    try {
        $ex = $ErrorRecord.Exception
        $ra = $ex.Response.Headers.RetryAfter
        if ($ra -and $ra.Delta) { return [int][math]::Ceiling($ra.Delta.TotalSeconds) }
    } catch { $null = $_ }
    $null
}

function Wait-VkRetry {
    # The only sleep in the kit, separate so the tests can skip it.
    param([int]$Seconds)
    Start-Sleep -Seconds $Seconds
}

function Invoke-VkGraphRequest {
    <#
    .SYNOPSIS
        One Microsoft Graph GET. Retries 429, 503 and 504 after Retry-After (or exponential
        backoff), up to -MaxRetries. The Graph PowerShell SDK also retries on its own; this loop
        covers what is left. GET is the only method this function sends.
    #>
    param(
        [Parameter(Mandatory)][string]$Uri,
        [hashtable]$Headers = @{},
        [int]$MaxRetries = 5
    )
    $attempt = 0
    while ($true) {
        try {
            return Invoke-MgGraphRequest -Method GET -Uri $Uri -Headers $Headers -OutputType PSObject -ErrorAction Stop
        } catch {
            $status = Get-VkHttpStatus $_
            $attempt++
            if (@(429, 503, 504) -notcontains $status -or $attempt -gt $MaxRetries) { throw }
            $wait = Get-VkRetryAfter $_
            if (-not $wait) { $wait = [int][math]::Min(60, [math]::Pow(2, $attempt)) }
            Wait-VkRetry -Seconds $wait
        }
    }
}

function Invoke-VkGraphGet {
    <# Every item of a collection, following @odata.nextLink; or one object with -Single. #>
    param(
        [Parameter(Mandatory)][string]$Uri,
        [Parameter(Mandatory)][string]$GraphHost,
        [switch]$Advanced,
        [switch]$Single
    )
    $headers = @{ 'x-ms-throttle-priority' = 'Low' }
    if ($Advanced) { $headers['ConsistencyLevel'] = 'eventual' }
    $items = [System.Collections.Generic.List[object]]::new()
    $next = $Uri
    while ($next) {
        Assert-VkGraphUri -Uri $next -GraphHost $GraphHost
        $page = Invoke-VkGraphRequest -Uri $next -Headers $headers
        if ($Single) { return $page }
        foreach ($v in @(Get-VkValue $page 'value' @())) { if ($null -ne $v) { $items.Add($v) } }
        $next = Get-VkValue $page '@odata.nextLink'
    }
    , $items.ToArray()
}

function Get-VkGraphCount {
    <# A $count segment (advanced query), returned as an integer. #>
    param([Parameter(Mandatory)][string]$Uri, [Parameter(Mandatory)][string]$GraphHost)
    Assert-VkGraphUri -Uri $Uri -GraphHost $GraphHost
    $r = Invoke-VkGraphRequest -Uri $Uri -Headers @{ 'ConsistencyLevel' = 'eventual'; 'x-ms-throttle-priority' = 'Low' }
    if ($r -is [byte[]]) { $r = [System.Text.Encoding]::UTF8.GetString($r) }
    [int]("$r".Trim())
}

function Invoke-VkRuleValidation {
    <#
    .SYNOPSIS
        VK-DG-03's rule test: Microsoft Graph beta group: evaluateDynamicMembership. The kit's
        only Graph call that isn't a GET. It evaluates whether a user or device is, or would be,
        a member under a group's rule or a proposed rule, and changes nothing.

    .NOTES
        Beta: "APIs under the /beta version in Microsoft Graph are subject to change." Delegated
        permissions only (application permissions aren't supported): Group.Read.All with
        User.Read.All or Device.Read.All for a group ID, User.Read.All or Device.Read.All for a
        rule. The admin center's Validate rules tab needs at least Groups Administrator.
        https://learn.microsoft.com/graph/api/group-evaluatedynamicmembership?view=graph-rest-beta
    #>
    param(
        [Parameter(Mandatory)]$Context,
        [Parameter(Mandatory)][string]$MemberId,
        [string]$GroupId,
        [string]$MembershipRule,
        [Parameter(Mandatory)][string]$Label
    )
    if ($Context.Mode -eq 'Fixture') {
        return Get-VkData -Context $Context -Name 'ruleEvaluations' -Key $Label -Single -Uri 'POST /beta/groups/evaluateDynamicMembership'
    }
    $body = @{ memberId = $MemberId }
    if ($MembershipRule) { $body['membershipRule'] = $MembershipRule }
    $uri = '/beta/groups/evaluateDynamicMembership'
    if ($GroupId) { $uri = '/beta/groups/' + $GroupId + '/evaluateDynamicMembership' }
    Trace-VkQuery -Source 'Graph (beta, read-only evaluation)' -Query "POST $uri"
    Invoke-MgGraphRequest -Method POST -Uri $uri -Body (ConvertTo-Json -InputObject $body) -ContentType 'application/json' -OutputType PSObject -ErrorAction Stop
}

# ---------------------------------------------------------------------------------------------
# Azure Resource Graph (read-only KQL) and Active Directory
# ---------------------------------------------------------------------------------------------

function Invoke-VkResourceGraph {
    <# Every row of a Resource Graph query, following the skip token. Needs Az.ResourceGraph. #>
    param([Parameter(Mandatory)][string]$Query, [string[]]$Subscription = @())
    if (-not (Get-Command -Name Search-AzGraph -ErrorAction SilentlyContinue)) {
        throw 'Search-AzGraph is not available. Install the Az.ResourceGraph module and run Connect-AzAccount.'
    }
    $rows = [System.Collections.Generic.List[object]]::new()
    $skip = $null
    do {
        $p = @{ Query = $Query; First = 1000 }
        if (@($Subscription | Where-Object { $_ }).Count -gt 0) { $p['Subscription'] = @($Subscription) }
        if ($skip) { $p['SkipToken'] = $skip }
        $attempt = 0
        while ($true) {
            try { $r = Search-AzGraph @p -ErrorAction Stop; break }
            catch {
                $attempt++
                if ((Get-VkHttpStatus $_) -ne 429 -or $attempt -gt 5) { throw }
                Wait-VkRetry -Seconds ([int][math]::Pow(2, $attempt))
            }
        }
        $data = Get-VkValue $r 'Data'
        if ($null -eq $data) { $data = $r }
        foreach ($row in @($data)) { if ($null -ne $row) { $rows.Add($row) } }
        $skip = Get-VkValue $r 'SkipToken'
    } while ($skip)
    , $rows.ToArray()
}

# ---------------------------------------------------------------------------------------------
# Results
# ---------------------------------------------------------------------------------------------

function Invoke-VkCheckBody {
    # Runs one check's body, times it, and wraps the outcome in the kit's result shape. A read
    # that fails gives Status Error, never a silent Pass.
    param(
        [Parameter(Mandatory)][string]$CheckId,
        [Parameter(Mandatory)]$Context,
        [Parameter(Mandatory)][scriptblock]$Body
    )
    $meta = Get-VkCheckCatalog -CheckId $CheckId
    $script:VkQueryLog.Clear()
    $outcome = $null
    try {
        $outcome = & $Body $Context
    } catch {
        $outcome = @{ Status = 'Error'; Count = 0; Details = @(); Message = "$($_.Exception.Message)"; Artifacts = $null }
    }
    [pscustomobject][ordered]@{
        CheckId   = $CheckId
        Track     = $meta.Track
        Title     = $meta.Title
        Status    = $outcome.Status
        Count     = [int]$outcome.Count
        Message   = "$($outcome.Message)"
        Details   = @($outcome.Details)
        Evidence  = [pscustomobject][ordered]@{
            Mode           = $Context.Mode
            Source         = $meta.Source
            Queries        = @($script:VkQueryLog.ToArray())
            Permissions    = @($meta.GraphPermissions)
            AzureRole      = $meta.AzureRole
            Stage          = $meta.Stage
            AsOfUtc        = Format-VkUtc $Context.AsOf
            CollectedAtUtc = Format-VkUtc ([datetimeoffset]::UtcNow)
        }
        Artifacts = $outcome.Artifacts
    }
}

# ---------------------------------------------------------------------------------------------
# Guarded writers and the provenance manifest (the Start Kit's pattern)
# ---------------------------------------------------------------------------------------------

function Resolve-VkOutputRoot {
    # Creates the output root if needed, registers it as writable, and returns its full path.
    param([Parameter(Mandatory)][string]$OutputPath)
    $full = (ConvertTo-VkFullPath -Path $OutputPath).TrimEnd('\', '/')
    [void][System.IO.Directory]::CreateDirectory($full)
    if (-not $script:VkAllowedRoots.Contains($full)) { $script:VkAllowedRoots.Add($full) }
    $full
}

function Assert-VkWritePath {
    param([Parameter(Mandatory)][string]$Path)
    $full = ConvertTo-VkFullPath -Path $Path
    foreach ($root in $script:VkAllowedRoots) {
        if ($full.StartsWith($root + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
            [void][System.IO.Directory]::CreateDirectory((Split-Path -Parent $full))
            return $full
        }
    }
    throw "Refusing to write outside -OutputPath: $full"
}

function Write-VkJson {
    param([Parameter(Mandatory)][AllowNull()][AllowEmptyCollection()]$InputObject, [Parameter(Mandatory)][string]$Path, [int]$Depth = 8)
    $full = Assert-VkWritePath -Path $Path
    $json = ConvertTo-Json -InputObject $InputObject -Depth $Depth
    if ($null -eq $json) { $json = 'null' }
    [System.IO.File]::WriteAllText($full, $json, $script:VkUtf8)
}

function Write-VkCsv {
    param([Parameter(Mandatory)][AllowNull()][AllowEmptyCollection()]$InputObject, [Parameter(Mandatory)][string]$Path)
    $full = Assert-VkWritePath -Path $Path
    $rows = @($InputObject | Where-Object { $null -ne $_ })
    [string[]]$lines = @()
    if ($rows.Count -gt 0) { $lines = @($rows | ConvertTo-Csv -NoTypeInformation) }
    [System.IO.File]::WriteAllLines($full, $lines, $script:VkUtf8)
}

function Write-VkText {
    param([Parameter(Mandatory)][AllowEmptyString()][AllowEmptyCollection()]$Value, [Parameter(Mandatory)][string]$Path)
    $full = Assert-VkWritePath -Path $Path
    [System.IO.File]::WriteAllText($full, (@($Value) -join "`n"), $script:VkUtf8)
}

function Get-VkFileManifest {
    # Relative path, size and SHA-256 of every file under $Root, sorted, excluding $Exclude.
    param([Parameter(Mandatory)][string]$Root, [string[]]$Exclude = @())
    $base = [System.IO.Path]::GetFullPath($Root).TrimEnd('\', '/')
    @(Get-ChildItem -LiteralPath $base -Recurse -File | ForEach-Object {
            $rel = $_.FullName.Substring($base.Length).TrimStart('\', '/') -replace '\\', '/'
            if ($Exclude -notcontains $rel) {
                [pscustomobject][ordered]@{ RelativePath = $rel; SizeBytes = $_.Length; SHA256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash }
            }
        } | Sort-Object RelativePath)
}

function Get-VkExecutor {
    try { [System.Security.Principal.WindowsIdentity]::GetCurrent().Name }
    catch { "$env:USERDOMAIN\$env:USERNAME" }
}

function Get-VkModuleVersions {
    $o = [ordered]@{}
    foreach ($n in 'Microsoft.Graph.Authentication', 'Az.Accounts', 'Az.ResourceGraph', 'ActiveDirectory', 'Pester') {
        $m = Get-Module -Name $n | Select-Object -First 1
        if (-not $m) { $m = Get-Module -ListAvailable -Name $n | Sort-Object Version -Descending | Select-Object -First 1 }
        $o[$n] = $(if ($m) { "$($m.Version)" } else { $null })
    }
    $o['ValidationKit'] = $script:VkKitVersion
    [pscustomobject]$o
}

function Write-VkManifest {
    <# ValidationManifest.json at the run root: who, when, where, with what, and a SHA-256 of every other file. #>
    param(
        [Parameter(Mandatory)][string]$RunPath,
        [Parameter(Mandatory)][string]$RunId,
        [Parameter(Mandatory)][datetime]$StartTime,
        [Parameter(Mandatory)]$Context,
        [object[]]$Results = @(),
        [hashtable]$Parameters = @{},
        [string[]]$RequestedScopes = @()
    )
    $files = @(Get-VkFileManifest -Root $RunPath -Exclude 'ValidationManifest.json')
    $manifest = [ordered]@{
        Schema          = 'fmw-validation-kit/manifest/1'
        RunId           = $RunId
        KitVersion      = $script:VkKitVersion
        ReadOnly        = $true
        Mode            = $Context.Mode
        Cloud           = $Context.Cloud
        AsOfUtc         = Format-VkUtc $Context.AsOf
        ExecutedBy      = Get-VkExecutor
        ComputerName    = [Environment]::MachineName
        StartTimeUtc    = $StartTime.ToUniversalTime().ToString('o')
        EndTimeUtc      = (Get-Date).ToUniversalTime().ToString('o')
        PowerShell      = [ordered]@{ Version = "$($PSVersionTable.PSVersion)"; Edition = "$($PSVersionTable.PSEdition)" }
        OSVersion       = [Environment]::OSVersion.VersionString
        ModuleVersions  = Get-VkModuleVersions
        Parameters      = $Parameters
        Options         = $Context.Options
        RequestedScopes = @($RequestedScopes)
        Checks          = @($Results | ForEach-Object { [ordered]@{ CheckId = $_.CheckId; Status = $_.Status; Count = $_.Count; Queries = @($_.Evidence.Queries | ForEach-Object { $_.Query }) } })
        FileCount       = $files.Count
        Files           = $files
    }
    Write-VkJson -InputObject $manifest -Path (Join-Path $RunPath 'ValidationManifest.json') -Depth 6
    [pscustomobject]$manifest
}

# ---------------------------------------------------------------------------------------------
# Run output: results, details, the one-page summary, the snapshot and the manifest
# ---------------------------------------------------------------------------------------------

function ConvertTo-VkRunId {
    # YYYY-MM-DD-HHmm-<host>-<mode>, in UTC.
    param([Parameter(Mandatory)][datetime]$AsOf, [Parameter(Mandatory)][string]$HostName, [Parameter(Mandatory)][string]$Mode)
    $safeHost = ($HostName -replace '[^A-Za-z0-9\-]', '').ToLowerInvariant()
    '{0}-{1}-{2}' -f $AsOf.ToUniversalTime().ToString('yyyy-MM-dd-HHmm'), $safeHost, $Mode.ToLowerInvariant()
}

function Get-VkSummaryText {
    # The one-page summary as Markdown lines.
    param([Parameter(Mandatory)][string]$RunId, [Parameter(Mandatory)]$Context, [object[]]$Results = @())
    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.Add('# Validation kit summary')
    $lines.Add('')
    $lines.Add("Run **$RunId**, mode **$($Context.Mode)**, cloud **$($Context.Cloud)**, as of $(Format-VkUtc $Context.AsOf).")
    $lines.Add('Read-only. Illustrative: the kit is tested against fixtures, not proven against a live tenant.')
    $lines.Add('')
    $by = @{}
    foreach ($s in 'Pass', 'Fail', 'Warn', 'NotApplicable', 'Error') { $by[$s] = @($Results | Where-Object Status -eq $s).Count }
    $lines.Add(('**{0}** checks: {1} Pass, {2} Fail, {3} Warn, {4} NotApplicable, {5} Error.' -f @($Results).Count, $by.Pass, $by.Fail, $by.Warn, $by.NotApplicable, $by.Error))
    $lines.Add('')
    $lines.Add('| Check | Track | Status | Count | What it checks | Note |')
    $lines.Add('|---|---|---|---|---|---|')
    foreach ($r in $Results) {
        $note = ("$($r.Message)" -replace '\|', '/' -replace '\r?\n', ' ')
        $lines.Add(('| {0} | {1} | {2} | {3} | {4} | {5} |' -f $r.CheckId, $r.Track, $r.Status, $r.Count, ($r.Title -replace '\|', '/'), $note))
    }
    $lines.Add('')
    $lines.Add('Count is the rows that need action (Finding and Warn). Each check''s rows are in `Details\<CheckId>.csv`; the queries and the time each was read are in `Results\ValidationResults.json` and `ValidationManifest.json`.')
    $lines.ToArray()
}

function Write-VkRunOutput {
    <#
    .SYNOPSIS
        Writes a run under <OutputPath>\<run-id>: Results (CSV and JSON), Details per check,
        Summary (Markdown and JSON), the membership snapshot when VK-DG-05 ran, and
        ValidationManifest.json last, with a SHA-256 of every other file.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][datetime]$StartTime,
        [Parameter(Mandatory)]$Context,
        [object[]]$Results = @(),
        [hashtable]$Parameters = @{},
        [string[]]$RequestedScopes = @()
    )
    $runId = ConvertTo-VkRunId -AsOf $StartTime -HostName ([Environment]::MachineName) -Mode $Context.Mode
    $base = Resolve-VkOutputRoot -OutputPath $OutputPath
    $run = Resolve-VkOutputRoot -OutputPath (Join-Path $base $runId)
    $flat = @($Results | ForEach-Object {
            [pscustomobject][ordered]@{
                CheckId = $_.CheckId; Track = $_.Track; Status = $_.Status; Count = $_.Count; Title = $_.Title; Message = $_.Message
                Mode = $_.Evidence.Mode; Source = $_.Evidence.Source; Stage = $_.Evidence.Stage
                Permissions = (@($_.Evidence.Permissions) -join ' '); AzureRole = $_.Evidence.AzureRole
                Queries = (@($_.Evidence.Queries | ForEach-Object { $_.Query }) -join ' || '); CollectedAtUtc = $_.Evidence.CollectedAtUtc
            }
        })
    Write-VkCsv -InputObject $flat -Path (Join-Path (Join-Path $run 'Results') 'ValidationResults.csv')
    Write-VkJson -InputObject @($Results | Select-Object CheckId, Track, Title, Status, Count, Message, Details, Evidence) -Path (Join-Path (Join-Path $run 'Results') 'ValidationResults.json') -Depth 8
    foreach ($r in $Results) {
        if (@($r.Details).Count -gt 0) { Write-VkCsv -InputObject $r.Details -Path (Join-Path (Join-Path $run 'Details') "$($r.CheckId).csv") }
        $snap = Get-VkValue $r.Artifacts 'Snapshot'
        if ($snap) { Write-VkJson -InputObject $snap -Path (Join-Path (Join-Path $run 'Snapshot') 'membership-snapshot.json') -Depth 6 }
    }
    Write-VkText -Value (Get-VkSummaryText -RunId $runId -Context $Context -Results $Results) -Path (Join-Path (Join-Path $run 'Summary') 'ValidationSummary.md')
    Write-VkJson -InputObject ([ordered]@{
            RunId = $runId; Mode = $Context.Mode; AsOfUtc = (Format-VkUtc $Context.AsOf)
            Counts = [ordered]@{
                Checks = @($Results).Count; Pass = @($Results | Where-Object Status -eq 'Pass').Count; Fail = @($Results | Where-Object Status -eq 'Fail').Count
                Warn = @($Results | Where-Object Status -eq 'Warn').Count; NotApplicable = @($Results | Where-Object Status -eq 'NotApplicable').Count; Error = @($Results | Where-Object Status -eq 'Error').Count
            }
            Checks = @($Results | ForEach-Object { [ordered]@{ CheckId = $_.CheckId; Status = $_.Status; Count = $_.Count } })
        }) -Path (Join-Path (Join-Path $run 'Summary') 'ValidationSummary.json')
    $manifest = Write-VkManifest -RunPath $run -RunId $runId -StartTime $StartTime -Context $Context -Results $Results -Parameters $Parameters -RequestedScopes $RequestedScopes
    [pscustomobject]@{ RunId = $runId; RunPath = $run; FileCount = $manifest.FileCount; Summary = (Join-Path (Join-Path $run 'Summary') 'ValidationSummary.md') }
}
