#Requires -Version 7.1
<#
    NpiCloudWorkload: Chapter 13 of the developer workbook "Building Non-Person Identity".

    Workload identity across AWS GovCloud (US) and OCI (WD-171), checked from the files the
    implementation guide's Steps 1g and 1h write: the IAM credential report, every user's access
    keys, service-specific credentials, roles with their trust policies, instance profiles, OIDC
    providers and IAM Roles Anywhere trust anchors and profiles; and OCI users with their API
    signing keys, auth tokens and customer secret keys, dynamic groups and policies. Two optional
    AWS files the guide's commands don't write, iam-tags.json (ListUserTags and ListRoleTags, because
    ListUsers and ListRoles return no tags) and roles-anywhere-crls.json (ListCrls), let the owner-tag
    and CRL checks run; without them those checks warn that they couldn't. Findings NPI-AWS-01 to
    NPI-AWS-16 and NPI-OCI-01 to NPI-OCI-10.

    Read only, and offline: the module never runs the AWS CLI or the OCI CLI, never calls an AWS or
    OCI API, and writes nothing to either cloud. config/calls-ch13.json declares the read-only export
    commands an operator runs to make the files. A run folder holds findings.json, identities.json,
    credentials.csv, trust.json, evidence.json (one row per step and control, from
    config/requirements-ch13.json) and manifest.json with the SHA-256 of every input and output.

    Field names: the AWS files keep the API's names. The OCI CLI's output field names aren't shown on
    the CLI reference pages read, so every lookup ignores case, hyphens and underscores
    (time-created, timeCreated and time_created are the same field).

    Illustrative: tested against fixtures, not against a production account or tenancy.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot '../NpiCore/NpiCore.psm1') -Force -Global

$script:ModuleVersion = '1.0.0'
$script:CallsPath = Join-Path $PSScriptRoot '../../config/calls-ch13.json'
$script:RequirementsPath = Join-Path $PSScriptRoot '../../config/requirements-ch13.json'
$script:Task = 'cloud-workload'
$script:UnusedDays = 90             # design guidance: the guide's inactivity window for service principals
$script:OciApiKeyMaxAgeDays = 90    # Oracle, Securing IAM: rotate API keys every 90 days or less
$script:AwsFiles = @('credential-report.csv', 'access-keys.json', 'service-specific-credentials.json', 'roles.json', 'instance-profiles.json',
    'oidc-providers.json', 'roles-anywhere-trust-anchors.json', 'roles-anywhere-profiles.json')
$script:AwsOptional = @('iam-tags.json', 'roles-anywhere-crls.json')
$script:OciFiles = @('oci-users.json', 'oci-user-credentials.json', 'oci-dynamic-groups.json', 'oci-policies.json')
# A trust principal's AWS service and the workload kind it means (the guide's Step 1g, item 2).
$script:ServiceKinds = [ordered]@{
    'ec2.amazonaws.com'          = 'EC2 (instance profile)'
    'ecs-tasks.amazonaws.com'    = 'ECS task role'
    'lambda.amazonaws.com'       = 'Lambda execution role'
    'pods.eks.amazonaws.com'     = 'EKS Pod Identity'
    'rolesanywhere.amazonaws.com' = 'IAM Roles Anywhere'
}
$script:CredentialHeader = @('Cloud', 'Scope', 'Identity', 'Kind', 'CredentialId', 'Status', 'CreatedOn', 'AgeDays', 'LastUsedOn', 'ExpiresOn', 'Exception', 'ReplaceBy', 'Rule')

# ----------------------------------------------------------------------------- helpers

function Get-NpiCwValue {
    <#
    .SYNOPSIS
        A field of a parsed JSON object, CSV row or hashtable, found whatever its case, hyphens or
        underscores (time-created, timeCreated and time_created match), or -Default when it's missing.
    .EXAMPLE
        # 'ACTIVE'
        Get-NpiCwValue @{ 'lifecycle-state' = 'ACTIVE' } 'lifecycleState'
    #>
    param($Object, [Parameter(Mandatory)][string]$Name, $Default = $null)
    if ($null -eq $Object) { return $Default }
    $want = ($Name -replace '[-_]', '').ToLowerInvariant()
    if ($Object -is [Collections.IDictionary]) {
        foreach ($k in $Object.Keys) { if ((("$k" -replace '[-_]', '').ToLowerInvariant()) -eq $want) { return $Object[$k] } }
        return $Default
    }
    foreach ($p in $Object.PSObject.Properties) { if ((($p.Name -replace '[-_]', '').ToLowerInvariant()) -eq $want) { return $p.Value } }
    $Default
}

function ConvertTo-NpiCwDate {
    <#
    .SYNOPSIS
        Parses an ISO 8601 date or date-time as UTC and returns a [datetime], or $null for an empty
        value or for the credential report's N/A, no_information and not_supported.
    .EXAMPLE
        # $null: the credential report's value for a key that was never used.
        ConvertTo-NpiCwDate 'N/A'
    #>
    param($Text)
    if ($null -eq $Text) { return $null }
    if ($Text -is [datetime]) { if ($Text.Kind -eq [DateTimeKind]::Local) { return $Text.ToUniversalTime() } return [datetime]::SpecifyKind($Text, [DateTimeKind]::Utc) }
    if ($Text -is [DateTimeOffset]) { return $Text.UtcDateTime }
    $s = "$Text".Trim()
    if ($s -eq '' -or @('N/A', 'no_information', 'not_supported') -contains $s) { return $null }
    [datetime]::Parse($s, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal)
}

function Get-NpiCwItem {
    # The items of an export: an array as it is, the array under one of -Key in an object (Roles, data,
    # trustAnchors ...), a lone object as one item, nothing as nothing.
    param($Document, [string[]]$Key = @())
    if ($null -eq $Document) { return @() }
    if ($Document -is [Collections.IDictionary]) {
        foreach ($k in $Key) { $v = Get-NpiCwValue $Document $k '<missing>'; if (-not ($v -is [string] -and $v -eq '<missing>')) { return @($v | Where-Object { $null -ne $_ }) } }
        return @($Document)
    }
    @($Document | Where-Object { $null -ne $_ })
}

function Read-NpiCwJson {
    param([Parameter(Mandatory)][string]$Path)
    $text = Get-Content -LiteralPath $Path -Raw
    if ([string]::IsNullOrWhiteSpace($text)) { return $null }
    ConvertFrom-Json -InputObject $text -AsHashtable -NoEnumerate
}

function Get-NpiCwDays {
    param([datetime]$From, [datetime]$To)
    [int][math]::Floor(($To - $From).TotalDays)
}

function Format-NpiCwDate { param($Date) if ($null -eq $Date) { '' } else { ([datetime]$Date).ToString('yyyy-MM-dd') } }

function Get-NpiCwSortedFinding {
    param([object[]]$Findings)
    @($Findings | Where-Object { $_ } | Sort-Object Rule, ObjectKey, Issue)
}

# ----------------------------------------------------------------------------- the call list and requirements

function Get-NpiCwCallList {
    <#
    .SYNOPSIS
        Reads Chapter 13's call list (config/calls-ch13.json unless -Path names another file): the
        read-only AWS CLI and OCI CLI commands an operator runs to make the input files. The module
        runs none of them.
    .EXAMPLE
        # Every command, in order.
        (Get-NpiCwCallList).calls | ForEach-Object command
    #>
    [CmdletBinding()]
    param([string]$Path = $script:CallsPath)
    Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
}

function Get-NpiCwRequirement {
    <#
    .SYNOPSIS
        Reads config/requirements-ch13.json (or -Path): the KSIs per control and the controls and
        evidence files per step.
    .EXAMPLE
        # The KSIs the program aligns IA-5 with.
        (Get-NpiCwRequirement).controls['IA-5'].ksis
    #>
    [CmdletBinding()]
    param([string]$Path = $script:RequirementsPath)
    Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
}

# ----------------------------------------------------------------------------- inputs

function Import-NpiCwSetting {
    <#
    .SYNOPSIS
        Reads the run's settings: the AWS account, partition, Region and the program's account IDs;
        the OCI realm, tenancy OCID and the defined-tag namespace; and the tag keys for the system ID,
        the two owners and the sponsor. Returns them with the file's SHA-256.
    .EXAMPLE
        $s = Import-NpiCwSetting -Path tests/fixtures/ch13/settings.json
        $s.Aws.Partition
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { throw "Missing settings $Path." }
    $s = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
    $tags = Get-NpiCwValue $s 'tags'
    if (-not $tags) { throw "$Path`: 'tags' is required (systemId, owners, sponsor)." }
    $owners = @(Get-NpiCwValue $tags 'owners' @())
    if (-not "$(Get-NpiCwValue $tags 'systemId')" -or $owners.Count -ne 2 -or -not "$(Get-NpiCwValue $tags 'sponsor')") { throw "$Path`: tags needs systemId, exactly two owners and sponsor." }
    $aws = Get-NpiCwValue $s 'aws'
    $oci = Get-NpiCwValue $s 'oci'
    [pscustomobject]@{
        Aws    = [pscustomobject]@{
            AccountId       = "$(Get-NpiCwValue $aws 'accountId' '')"
            Partition       = "$(Get-NpiCwValue $aws 'partition' 'aws-us-gov')"
            Region          = "$(Get-NpiCwValue $aws 'region' 'us-gov-west-1')"
            ProgramAccounts = @(Get-NpiCwValue $aws 'programAccounts' @() | ForEach-Object { "$_" })
        }
        Oci    = [pscustomobject]@{
            Realm        = "$(Get-NpiCwValue $oci 'realm' 'oc2')"
            TenancyOcid  = "$(Get-NpiCwValue $oci 'tenancyOcid' '')"
            TagNamespace = "$(Get-NpiCwValue $oci 'definedTagNamespace' '')"
        }
        Tags   = [pscustomobject]@{ SystemId = "$(Get-NpiCwValue $tags 'systemId')"; Owners = @($owners | ForEach-Object { "$_" }); Sponsor = "$(Get-NpiCwValue $tags 'sponsor')" }
        Path   = $Path
        Sha256 = Get-NpiFileHash -Path $Path
    }
}

function Import-NpiCwInput {
    <#
    .SYNOPSIS
        Reads the AWS folder (-AwsPath), the OCI folder (-OciPath) or both, and the exception list,
        each file with its SHA-256. A missing required file throws; iam-tags.json and
        roles-anywhere-crls.json are optional, and their absence is recorded. Returns
        @{ Aws; Oci; Exceptions; Hashes; NotRead }.
    .EXAMPLE
        $in = Import-NpiCwInput -AwsPath tests/fixtures/ch13/aws -OciPath tests/fixtures/ch13/oci -ExceptionsPath tests/fixtures/ch13/exceptions.csv
        $in.Aws.Roles.Count
    #>
    [CmdletBinding()]
    param([string]$AwsPath, [string]$OciPath, [string]$ExceptionsPath)
    if (-not $AwsPath -and -not $OciPath) { throw 'Give -AwsPath, -OciPath or both.' }
    $hashes = [ordered]@{}
    $notRead = [Collections.Generic.List[string]]::new()
    $aws = $null; $oci = $null
    if ($AwsPath) {
        foreach ($f in $script:AwsFiles) { if (-not (Test-Path -LiteralPath (Join-Path $AwsPath $f))) { throw "Missing input $(Join-Path $AwsPath $f) (the guide's Step 1g writes it)." } }
        foreach ($f in $script:AwsFiles + $script:AwsOptional) { $p = Join-Path $AwsPath $f; if (Test-Path -LiteralPath $p) { $hashes["aws/$f"] = Get-NpiFileHash -Path $p } }
        $opt = @{}
        foreach ($f in $script:AwsOptional) {
            $p = Join-Path $AwsPath $f
            if (Test-Path -LiteralPath $p) { $opt[$f] = Read-NpiCwJson $p } else { $opt[$f] = $null; $notRead.Add("aws/$f") }
        }
        $aws = [pscustomobject]@{
            Report             = @(Import-Csv -LiteralPath (Join-Path $AwsPath 'credential-report.csv'))
            AccessKeys         = @(Get-NpiCwItem (Read-NpiCwJson (Join-Path $AwsPath 'access-keys.json')) 'AccessKeyMetadata')
            ServiceCredentials = @(Get-NpiCwItem (Read-NpiCwJson (Join-Path $AwsPath 'service-specific-credentials.json')) 'ServiceSpecificCredentials')
            Roles              = @(Get-NpiCwItem (Read-NpiCwJson (Join-Path $AwsPath 'roles.json')) 'Roles')
            InstanceProfiles   = @(Get-NpiCwItem (Read-NpiCwJson (Join-Path $AwsPath 'instance-profiles.json')) 'InstanceProfiles')
            OidcProviders      = @(Get-NpiCwItem (Read-NpiCwJson (Join-Path $AwsPath 'oidc-providers.json')) 'OpenIDConnectProviderList')
            TrustAnchors       = @(Get-NpiCwItem (Read-NpiCwJson (Join-Path $AwsPath 'roles-anywhere-trust-anchors.json')) 'trustAnchors')
            Profiles           = @(Get-NpiCwItem (Read-NpiCwJson (Join-Path $AwsPath 'roles-anywhere-profiles.json')) 'profiles')
            Tags               = $(if ($null -ne $opt['iam-tags.json']) { @(Get-NpiCwItem $opt['iam-tags.json']) } else { $null })
            Crls               = $(if ($null -ne $opt['roles-anywhere-crls.json']) { @(Get-NpiCwItem $opt['roles-anywhere-crls.json'] 'crls') } else { $null })
        }
    }
    if ($OciPath) {
        foreach ($f in $script:OciFiles) { if (-not (Test-Path -LiteralPath (Join-Path $OciPath $f))) { throw "Missing input $(Join-Path $OciPath $f) (the guide's Step 1h writes it)." } }
        foreach ($f in $script:OciFiles) { $hashes["oci/$f"] = Get-NpiFileHash -Path (Join-Path $OciPath $f) }
        $oci = [pscustomobject]@{
            Users         = @(Get-NpiCwItem (Read-NpiCwJson (Join-Path $OciPath 'oci-users.json')) 'data')
            Credentials   = @(Get-NpiCwItem (Read-NpiCwJson (Join-Path $OciPath 'oci-user-credentials.json')) 'data')
            DynamicGroups = @(Get-NpiCwItem (Read-NpiCwJson (Join-Path $OciPath 'oci-dynamic-groups.json')) 'data')
            Policies      = @(Get-NpiCwItem (Read-NpiCwJson (Join-Path $OciPath 'oci-policies.json')) 'data')
        }
    }
    $exceptions = @()
    if ($ExceptionsPath) {
        if (-not (Test-Path -LiteralPath $ExceptionsPath)) { throw "Missing exception list $ExceptionsPath." }
        $exceptions = @(Import-Csv -LiteralPath $ExceptionsPath)
        foreach ($col in 'Cloud', 'CredentialId', 'ExceptionRecord', 'ReplaceBy') {
            if ($exceptions.Count -and -not $exceptions[0].PSObject.Properties[$col]) { throw "$ExceptionsPath`: column '$col' is required." }
        }
        $hashes['exceptions.csv'] = Get-NpiFileHash -Path $ExceptionsPath
    }
    [pscustomobject]@{ Aws = $aws; Oci = $oci; Exceptions = $exceptions; Hashes = $hashes; NotRead = $notRead.ToArray() }
}

# ----------------------------------------------------------------------------- shared rules

function Get-NpiCwOwnerTag {
    <#
    .SYNOPSIS
        Reads the program's tags from an AWS tag list (Key, Value pairs), or from OCI freeform and
        defined tags (in the settings' namespace), and returns the system ID, owners, sponsor and the
        names of the missing tags.
    .EXAMPLE
        $s = Import-NpiCwSetting -Path tests/fixtures/ch13/settings.json
        Get-NpiCwOwnerTag -AwsTags @(@{ Key = 'SystemId'; Value = 'SYS-0101' }) -Settings $s
    #>
    param($AwsTags, $OciObject, [Parameter(Mandatory)]$Settings)
    $map = @{}
    if ($null -ne $AwsTags) { foreach ($t in @($AwsTags)) { $k = "$(Get-NpiCwValue $t 'Key')"; if ($k) { $map[$k] = "$(Get-NpiCwValue $t 'Value')" } } }
    if ($null -ne $OciObject) {
        $free = Get-NpiCwValue $OciObject 'freeformTags'
        if ($free -is [Collections.IDictionary]) { foreach ($k in $free.Keys) { $map["$k"] = "$($free[$k])" } }
        $defined = Get-NpiCwValue $OciObject 'definedTags'
        $ns = $Settings.Oci.TagNamespace
        if ($ns -and $defined -is [Collections.IDictionary]) {
            $d = Get-NpiCwValue $defined $ns
            if ($d -is [Collections.IDictionary]) { foreach ($k in $d.Keys) { $map["$k"] = "$($d[$k])" } }
        }
    }
    $get = { param($k) if ($map.ContainsKey($k) -and "$($map[$k])".Trim()) { "$($map[$k])".Trim() } else { $null } }
    $system = & $get $Settings.Tags.SystemId
    $owners = @($Settings.Tags.Owners | ForEach-Object { & $get $_ } | Where-Object { $_ })
    $sponsor = & $get $Settings.Tags.Sponsor
    $missing = @()
    if (-not $system) { $missing += $Settings.Tags.SystemId }
    foreach ($o in $Settings.Tags.Owners) { if (-not (& $get $o)) { $missing += $o } }
    if (-not $sponsor) { $missing += $Settings.Tags.Sponsor }
    if (@($owners | Sort-Object -Unique).Count -lt $owners.Count) { $missing += 'two different owners' }
    [pscustomobject]@{ SystemId = $system; Owners = $owners; Sponsor = $sponsor; Missing = $missing }
}

function Get-NpiCwExceptionVerdict {
    <#
    .SYNOPSIS
        Matches a long-lived credential to the exception list (Book 13, Chapter 14) and returns the
        severity its finding takes: Warn while a recorded exception's ReplaceBy date is in the future,
        Finding with no exception or after the date.
    .EXAMPLE
        Get-NpiCwExceptionVerdict -Exceptions @() -Cloud aws -CredentialId AKIAEXAMPLE000000001 -AsOf 2026-11-24
    #>
    param([object[]]$Exceptions, [string]$Cloud, [string]$CredentialId, [datetime]$AsOf)
    $e = @($Exceptions | Where-Object { "$($_.Cloud)" -eq $Cloud -and "$($_.CredentialId)" -eq $CredentialId }) | Select-Object -First 1
    if (-not $e) { return [pscustomobject]@{ Severity = 'Finding'; Exception = ''; ReplaceBy = ''; Note = 'no exception recorded: replace it, or record a Book 13, Chapter 14 exception with a replacement date' } }
    $by = ConvertTo-NpiCwDate $e.ReplaceBy
    if ($null -eq $by) { return [pscustomobject]@{ Severity = 'Finding'; Exception = "$($e.ExceptionRecord)"; ReplaceBy = ''; Note = "exception $($e.ExceptionRecord) has no replacement date" } }
    if ($by -lt $AsOf) { return [pscustomobject]@{ Severity = 'Finding'; Exception = "$($e.ExceptionRecord)"; ReplaceBy = (Format-NpiCwDate $by); Note = "exception $($e.ExceptionRecord) ended $(Format-NpiCwDate $by)" } }
    [pscustomobject]@{ Severity = 'Warn'; Exception = "$($e.ExceptionRecord)"; ReplaceBy = (Format-NpiCwDate $by); Note = "under exception $($e.ExceptionRecord) until $(Format-NpiCwDate $by)" }
}

function New-NpiCwCredentialRow {
    param([string]$Cloud, [string]$Scope, [string]$Identity, [string]$Kind, [string]$CredentialId, [string]$Status, $Created, $AsOf, $LastUsed, $Expires, $Verdict, [string]$Rule)
    [pscustomobject][ordered]@{
        Cloud = $Cloud; Scope = $Scope; Identity = $Identity; Kind = $Kind; CredentialId = $CredentialId; Status = $Status
        CreatedOn = Format-NpiCwDate $Created; AgeDays = $(if ($null -ne $Created) { Get-NpiCwDays $Created $AsOf } else { '' })
        LastUsedOn = Format-NpiCwDate $LastUsed; ExpiresOn = Format-NpiCwDate $Expires
        Exception = $(if ($Verdict) { $Verdict.Exception } else { '' }); ReplaceBy = $(if ($Verdict) { $Verdict.ReplaceBy } else { '' }); Rule = $Rule
    }
}

# ----------------------------------------------------------------------------- AWS

function ConvertFrom-NpiCwPolicyDocument {
    <#
    .SYNOPSIS
        A role's trust policy as a hashtable, whether the export holds it as JSON (the AWS CLI's
        output) or URL-encoded text (the IAM API's).
    .EXAMPLE
        ConvertFrom-NpiCwPolicyDocument '%7B%22Version%22%3A%222012-10-17%22%2C%22Statement%22%3A%5B%5D%7D'
    #>
    param($Document)
    if ($null -eq $Document) { return @{ Statement = @() } }
    if ($Document -is [Collections.IDictionary]) { return $Document }
    $t = "$Document"
    if ($t -notmatch '^\s*\{') { $t = [Uri]::UnescapeDataString($t) }
    ConvertFrom-Json -InputObject $t -AsHashtable
}

function Get-NpiCwTrust {
    <#
    .SYNOPSIS
        Reads a role's trust policy into one row per principal its Allow statements name: Type
        (Anyone, Service, AWS, Federated), Value, Partition, Account, the workload kind, and the
        condition keys and values that apply.
    .EXAMPLE
        Get-NpiCwTrust -Document @{ Statement = @(@{ Effect = 'Allow'; Principal = @{ Service = 'ec2.amazonaws.com' }; Action = 'sts:AssumeRole' }) }
    #>
    param($Document)
    $doc = ConvertFrom-NpiCwPolicyDocument $Document
    $rows = [Collections.Generic.List[object]]::new()
    foreach ($st in @(Get-NpiCwValue $doc 'Statement' @())) {
        if ("$(Get-NpiCwValue $st 'Effect' 'Allow')" -ne 'Allow') { continue }
        $cond = Get-NpiCwValue $st 'Condition' @{}
        $conds = [Collections.Generic.List[object]]::new()
        if ($cond -is [Collections.IDictionary]) {
            foreach ($op in $cond.Keys) { $block = $cond[$op]; if ($block -is [Collections.IDictionary]) { foreach ($k in $block.Keys) { $conds.Add([pscustomobject]@{ Operator = "$op"; Key = "$k"; Values = @($block[$k] | ForEach-Object { "$_" }) }) } } }
        }
        $p = Get-NpiCwValue $st 'Principal'
        $pairs = @()
        if ($p -is [string]) { $pairs += , @('Anyone', $p) }
        elseif ($p -is [Collections.IDictionary]) { foreach ($t in $p.Keys) { foreach ($v in @($p[$t])) { $pairs += , @("$t", "$v") } } }
        foreach ($pair in $pairs) {
            $type = $pair[0]; $value = $pair[1]
            $partition = ''; $account = ''; $kind = ''
            if ($value -eq '*') { $type = 'Anyone'; $kind = 'Anyone' }
            elseif ($type -eq 'Service') { $kind = $(if ($script:ServiceKinds.Contains($value)) { $script:ServiceKinds[$value] } else { "AWS service $value" }) }
            elseif ($type -eq 'AWS') {
                if ($value -match '^\d{12}$') { $account = $value }
                elseif ($value -match '^arn:([\w-]+):(?:iam|sts)::(\d{12}):') { $partition = $Matches[1]; $account = $Matches[2] }
                $kind = 'Another account or principal'
            } elseif ($type -eq 'Federated') {
                if ($value -match '^arn:([\w-]+):iam::(\d{12}):oidc-provider/(.+)$') { $partition = $Matches[1]; $account = $Matches[2]; $kind = $(if ($Matches[3] -match '^oidc\.eks\.') { 'EKS IRSA (OIDC)' } else { 'OIDC federation' }) }
                elseif ($value -match '^arn:([\w-]+):iam::(\d{12}):saml-provider/') { $partition = $Matches[1]; $account = $Matches[2]; $kind = 'SAML federation' }
                else { $kind = "Federated $value" }
            }
            $rows.Add([pscustomobject]@{ Type = $type; Value = $value; Partition = $partition; Account = $account; Kind = $kind; Conditions = $conds.ToArray(); Actions = @(Get-NpiCwValue $st 'Action' @() | ForEach-Object { "$_" }) })
        }
    }
    $rows.ToArray()
}

function Test-NpiCwAws {
    <#
    .SYNOPSIS
        Runs the AWS checks (NPI-AWS-01 to -16) on one account's files and returns
        @{ Findings; Identities; Credentials; Trust }.
    .EXAMPLE
        $s = Import-NpiCwSetting -Path tests/fixtures/ch13/settings.json
        $in = Import-NpiCwInput -AwsPath tests/fixtures/ch13/aws
        (Test-NpiCwAws -Aws $in.Aws -Settings $s -Exceptions @() -AsOf 2026-11-24).Findings.Count
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Aws, [Parameter(Mandatory)]$Settings, [object[]]$Exceptions = @(), [Parameter(Mandatory)][datetime]$AsOf)
    $f = [Collections.Generic.List[object]]::new()
    $ids = [Collections.Generic.List[object]]::new()
    $creds = [Collections.Generic.List[object]]::new()
    $trust = [Collections.Generic.List[object]]::new()
    $acct = $Settings.Aws.AccountId
    $scope = "aws:$acct"
    $add = { param($rule, $sev, $key, $obj, $issue) $f.Add((New-NpiFinding $rule $sev $key $obj $issue)) }

    # Tags, when iam-tags.json was read (ListUserTags and ListRoleTags: ListUsers and ListRoles return none).
    $tagsRead = $null -ne $Aws.Tags
    $tagMap = @{}
    if ($tagsRead) { foreach ($t in $Aws.Tags) { $tagMap["$(Get-NpiCwValue $t 'Type')|$(Get-NpiCwValue $t 'Name')"] = @(Get-NpiCwValue $t 'Tags' @()) } }
    if (-not $tagsRead) { & $add 'NPI-AWS-08' 'Warn' "$scope|tags" "AWS account $acct" 'iam-tags.json not read: no role or user was checked for its SystemId, owner and sponsor tags (ListUsers and ListRoles return no tags; run the Lab 2 tag export)' }
    $checkTags = {
        param([string]$type, [string]$name, [string]$label)
        if (-not $tagsRead) { return [pscustomobject]@{ SystemId = $null; Owners = @(); Sponsor = $null; Missing = @('(tags not read)') } }
        $k = "$type|$name"
        $o = Get-NpiCwOwnerTag -AwsTags $(if ($tagMap.ContainsKey($k)) { $tagMap[$k] } else { @() }) -Settings $Settings
        if ($o.Missing.Count) { & $add 'NPI-AWS-08' 'Finding' "$scope|$type|$name" $label "Not joined to a record: missing tag(s) $($o.Missing -join ', ') (Step 1f: two owners and a sponsor; an identity nobody claims is an orphan)" }
        $o
    }

    # ---- IAM users: the credential report, every access key, service-specific credentials
    $report = @{}
    foreach ($r in $Aws.Report) { $report["$(Get-NpiCwValue $r 'user')"] = $r }
    $keysByUser = @{}
    foreach ($k in $Aws.AccessKeys) { $u = "$(Get-NpiCwValue $k 'UserName')"; if (-not $keysByUser.ContainsKey($u)) { $keysByUser[$u] = [Collections.Generic.List[object]]::new() }; $keysByUser[$u].Add($k) }
    $sscByUser = @{}
    foreach ($c in $Aws.ServiceCredentials) { $u = "$(Get-NpiCwValue $c 'UserName')"; if (-not $sscByUser.ContainsKey($u)) { $sscByUser[$u] = [Collections.Generic.List[object]]::new() }; $sscByUser[$u].Add($c) }
    $users = @(@($report.Keys) + @($keysByUser.Keys) + @($sscByUser.Keys) | Sort-Object -Unique)
    foreach ($u in $users) {
        $r = if ($report.ContainsKey($u)) { $report[$u] } else { $null }
        $arn = "$(Get-NpiCwValue $r 'arn' '')"
        if ($arn -match ':root$') {
            foreach ($n in 1, 2) {
                if ("$(Get-NpiCwValue $r "access_key_$($n)_active" '')" -eq 'true') { & $add 'NPI-AWS-07' 'Finding' "$scope|root|$n" "AWS account root user ($acct)" "Access key $n is active: a GovCloud account's root keys come only through AWS Support, and no workload should hold one (Step 1g, item 5)" }
            }
            $ids.Add([pscustomobject][ordered]@{ Cloud = 'aws'; Scope = $scope; Type = 'RootUser'; Name = 'root'; Arn = $arn; WorkloadKind = ''; SystemId = ''; Owners = @(); Sponsor = ''; Joined = 'n/a'; Target = 'No workload use (Step 1g, item 5)' })
            continue
        }
        $label = "$u (IAM user)"
        $keys = @(if ($keysByUser.ContainsKey($u)) { $keysByUser[$u] | Sort-Object { ConvertTo-NpiCwDate (Get-NpiCwValue $_ 'CreateDate') } })
        $active = @($keys | Where-Object { "$(Get-NpiCwValue $_ 'Status')" -eq 'Active' })
        $ssc = @(if ($sscByUser.ContainsKey($u)) { $sscByUser[$u] })
        $activeSsc = @($ssc | Where-Object { "$(Get-NpiCwValue $_ 'Status')" -eq 'Active' })
        $password = "$(Get-NpiCwValue $r 'password_enabled' '')" -eq 'true'
        $certs = @(1, 2 | Where-Object { "$(Get-NpiCwValue $r "cert_$($_)_active" '')" -eq 'true' })
        # A workload user: it holds a long-lived credential, or it has no console password (it can only call APIs).
        $workload = $active.Count -gt 0 -or $activeSsc.Count -gt 0 -or $certs.Count -gt 0 -or -not $password
        if (-not $workload) {
            $ids.Add([pscustomobject][ordered]@{ Cloud = 'aws'; Scope = $scope; Type = 'IamUser'; Name = $u; Arn = $arn; WorkloadKind = 'Console only (person or unknown)'; SystemId = ''; Owners = @(); Sponsor = ''; Joined = 'out of scope'; Target = 'Not a workload identity' })
            continue
        }
        $o = & $checkTags 'User' $u $label
        $ids.Add([pscustomobject][ordered]@{ Cloud = 'aws'; Scope = $scope; Type = 'IamUser'; Name = $u; Arn = $arn; WorkloadKind = 'IAM user (long-lived credentials)'; SystemId = "$($o.SystemId)"; Owners = @($o.Owners); Sponsor = "$($o.Sponsor)"
                Joined = $(if (-not $tagsRead) { 'tags not read' } elseif ($o.Missing.Count) { 'no' } else { 'yes' }); Target = 'Replace with an IAM role; a key stays only as an exception (Step 2)' })
        foreach ($k in $active) {
            $id = "$(Get-NpiCwValue $k 'AccessKeyId')"
            $created = ConvertTo-NpiCwDate (Get-NpiCwValue $k 'CreateDate')
            # The report's slot for this key: access_key_N_last_rotated is when the key was created.
            $lastUsed = $null; $slotFound = $false
            foreach ($n in 1, 2) {
                $rot = ConvertTo-NpiCwDate (Get-NpiCwValue $r "access_key_$($n)_last_rotated" '')
                if ($null -ne $rot -and $null -ne $created -and [math]::Abs(($rot - $created).TotalSeconds) -lt 1) { $lastUsed = ConvertTo-NpiCwDate (Get-NpiCwValue $r "access_key_$($n)_last_used_date" ''); $slotFound = $true }
            }
            $v = Get-NpiCwExceptionVerdict -Exceptions $Exceptions -Cloud aws -CredentialId $id -AsOf $AsOf
            $age = if ($null -ne $created) { Get-NpiCwDays $created $AsOf } else { $null }
            & $add 'NPI-AWS-01' $v.Severity "$scope|$u|$id" $label "Active access key $id, a long-lived secret$(if ($null -ne $age) { ", $age days old" }), last used $(if ($lastUsed) { Format-NpiCwDate $lastUsed } elseif ($slotFound) { 'never' } else { 'unknown (not in the credential report''s first two keys)' }): $($v.Note)"
            if ($slotFound -and $null -ne $created) {
                $since = if ($lastUsed) { Get-NpiCwDays $lastUsed $AsOf } else { $age }
                if ($since -gt $script:UnusedDays) { & $add 'NPI-AWS-03' 'Warn' "$scope|$u|$id" $label "Access key $id $(if ($lastUsed) { "not used for $since days" } else { "never used in $age days" }): an orphan lead (Step 6); deactivate it with update-access-key --status Inactive once its owner confirms, before deleting it" }
            }
            $creds.Add((New-NpiCwCredentialRow 'aws' $scope $u 'Access key' $id 'Active' $created $AsOf $lastUsed $null $v 'NPI-AWS-01'))
        }
        if ($active.Count -gt 1) { & $add 'NPI-AWS-02' 'Finding' "$scope|$u" $label "$($active.Count) active access keys: AWS allows two so a key can be rotated, but both active outside a rotation means two secrets to protect; deactivate the older one" }
        if ($password -and $active.Count) { & $add 'NPI-AWS-04' 'Finding' "$scope|$u" $label 'Has a console password and an active access key: a workload doesn''t sign in to the console; remove the password (and the user, once its workload has a role)' }
        foreach ($n in $certs) { & $add 'NPI-AWS-06' 'Warn' "$scope|$u|cert$n" $label "Signing certificate $n is active: a long-lived X.509 credential on an IAM user; retire it with the user" }
        foreach ($c in $activeSsc) {
            $cid = "$(Get-NpiCwValue $c 'ServiceSpecificCredentialId')"
            $svc = "$(Get-NpiCwValue $c 'ServiceName')"
            $created = ConvertTo-NpiCwDate (Get-NpiCwValue $c 'CreateDate')
            $exp = ConvertTo-NpiCwDate (Get-NpiCwValue $c 'ExpirationDate')
            $v = Get-NpiCwExceptionVerdict -Exceptions $Exceptions -Cloud aws -CredentialId $cid -AsOf $AsOf
            $sev = if ($null -ne $exp -and $v.Severity -eq 'Finding' -and -not $v.Exception) { 'Warn' } else { $v.Severity }
            & $add 'NPI-AWS-05' $sev "$scope|$u|$cid" $label "Active service-specific credential $cid for $svc$(if ($null -ne $exp) { ", expires $(Format-NpiCwDate $exp)" } else { ', no expiry' }): the credential report leaves these out; $($v.Note)"
            $creds.Add((New-NpiCwCredentialRow 'aws' $scope $u "Service-specific ($($svc -replace '\.amazonaws\.com$', ''))" $cid 'Active' $created $AsOf $null $exp $v 'NPI-AWS-05'))
        }
    }

    # ---- Roles and their trust policies
    $roleNames = @{}
    $oidcArns = @($Aws.OidcProviders | ForEach-Object { "$(Get-NpiCwValue $_ 'Arn')" })
    $trustedProviders = @{}
    foreach ($role in ($Aws.Roles | Sort-Object { "$(Get-NpiCwValue $_ 'RoleName')" })) {
        $name = "$(Get-NpiCwValue $role 'RoleName')"; $arn = "$(Get-NpiCwValue $role 'Arn')"; $path = "$(Get-NpiCwValue $role 'Path' '/')"
        $roleNames[$name] = $arn
        $label = "$name (IAM role)"
        $principals = @(Get-NpiCwTrust (Get-NpiCwValue $role 'AssumeRolePolicyDocument'))
        $kinds = @($principals | ForEach-Object Kind | Where-Object { $_ } | Sort-Object -Unique)
        $trust.Add([pscustomobject][ordered]@{ Cloud = 'aws'; Scope = $scope; Object = $name; Kind = 'Role trust policy'; Principals = @($principals | ForEach-Object { [ordered]@{ type = $_.Type; value = $_.Value; kind = $_.Kind; conditions = @($_.Conditions | ForEach-Object { "$($_.Operator) $($_.Key) = $($_.Values -join ' | ')" }) } }) })
        if ($path.StartsWith('/aws-service-role/')) {
            $ids.Add([pscustomobject][ordered]@{ Cloud = 'aws'; Scope = $scope; Type = 'ServiceLinkedRole'; Name = $name; Arn = $arn; WorkloadKind = 'Service-linked role (AWS-managed)'; SystemId = ''; Owners = @(); Sponsor = ''; Joined = 'n/a'; Target = 'Keep: the linked service defines and manages it' })
            continue
        }
        $o = & $checkTags 'Role' $name $label
        $ids.Add([pscustomobject][ordered]@{ Cloud = 'aws'; Scope = $scope; Type = 'IamRole'; Name = $name; Arn = $arn; WorkloadKind = ($kinds -join '; '); SystemId = "$($o.SystemId)"; Owners = @($o.Owners); Sponsor = "$($o.Sponsor)"
                Joined = $(if (-not $tagsRead) { 'tags not read' } elseif ($o.Missing.Count) { 'no' } else { 'yes' }); Target = 'Keep: temporary credentials (Step 2)' })
        foreach ($p in $principals) {
            if ($p.Type -eq 'Anyone') { & $add 'NPI-AWS-12' 'Finding' "$scope|$name|*" $label 'The trust policy''s principal is "*": anyone can try to assume it, and AWS says not to leave a role accessible to everyone' ; continue }
            if ($p.Partition -and $p.Partition -ne $Settings.Aws.Partition) {
                & $add 'NPI-AWS-13' 'Warn' "$scope|$name|$($p.Value)" $label "Trusts $($p.Value), in partition $($p.Partition): AWS says a role can't delegate access between a GovCloud account and a standard AWS account; remove the principal, or record what it was for"
                continue
            }
            if ($p.Type -eq 'AWS' -and $p.Account -and $p.Account -ne $acct -and $Settings.Aws.ProgramAccounts -notcontains $p.Account) {
                & $add 'NPI-AWS-11' 'Finding' "$scope|$name|$($p.Account)" $label "Trusts account $($p.Account), which isn't one of the program's accounts: record who it is, why, and its owner's approval, or remove it"
            }
            if ($p.Type -eq 'Federated' -and $p.Value -match ':oidc-provider/(.+)$') {
                $iss = $Matches[1]
                $trustedProviders[$p.Value] = $true
                if ($oidcArns -notcontains $p.Value) { & $add 'NPI-AWS-10' 'Warn' "$scope|$name|$($p.Value)" $label "Trusts OIDC provider $iss, which isn't in oidc-providers.json: the provider was deleted, or the read is from another account" }
                $sub = @($p.Conditions | Where-Object { $_.Key -ieq "$($iss):sub" })
                if (-not $sub.Count) { & $add 'NPI-AWS-09' 'Finding' "$scope|$name|$iss" $label "Trusts OIDC provider $iss with no condition on $($iss):sub: any workload that issuer signs a token for can assume it; limit sub to the one workload (design guidance from AWS's OIDC role pages)" }
                elseif (@($sub.Values | Where-Object { $_ -match '\*' }).Count) { & $add 'NPI-AWS-09' 'Warn' "$scope|$name|$iss" $label "The $($iss):sub condition uses a wildcard ($((@($sub | ForEach-Object Values) -join ', '))): check it names only this workload" }
            }
        }
    }
    foreach ($p in ($Aws.OidcProviders | Sort-Object { "$(Get-NpiCwValue $_ 'Arn')" })) {
        $parn = "$(Get-NpiCwValue $p 'Arn')"
        $iss = ($parn -split 'oidc-provider/', 2)[-1]
        $ids.Add([pscustomobject][ordered]@{ Cloud = 'aws'; Scope = $scope; Type = 'OidcProvider'; Name = $iss; Arn = $parn; WorkloadKind = 'Trusted outside issuer'; SystemId = ''; Owners = @(); Sponsor = ''; Joined = 'approve like a federated credential (Step 1g, item 4)'; Target = '' })
        if (-not $trustedProviders.ContainsKey($parn)) { & $add 'NPI-AWS-10' 'Warn' "$scope|$parn" "$iss (OIDC provider)" 'No role in roles.json trusts this provider: remove it, or record which role will' }
    }

    # ---- Instance profiles
    foreach ($ip in ($Aws.InstanceProfiles | Sort-Object { "$(Get-NpiCwValue $_ 'InstanceProfileName')" })) {
        $n = "$(Get-NpiCwValue $ip 'InstanceProfileName')"
        $rs = @(Get-NpiCwValue $ip 'Roles' @() | ForEach-Object { "$(Get-NpiCwValue $_ 'RoleName')" })
        $ids.Add([pscustomobject][ordered]@{ Cloud = 'aws'; Scope = $scope; Type = 'InstanceProfile'; Name = $n; Arn = "$(Get-NpiCwValue $ip 'Arn')"; WorkloadKind = "Passes role(s): $(if ($rs.Count) { $rs -join ', ' } else { 'none' })"; SystemId = ''; Owners = @(); Sponsor = ''; Joined = 'through its role'; Target = '' })
        if (-not $rs.Count) { & $add 'NPI-AWS-16' 'Info' "$scope|$n" "$n (instance profile)" 'Holds no role: an instance using it gets no credentials; remove it if nothing launches with it' }
    }

    # ---- IAM Roles Anywhere
    $crlsRead = $null -ne $Aws.Crls
    foreach ($ta in ($Aws.TrustAnchors | Sort-Object { "$(Get-NpiCwValue $_ 'name')" })) {
        $n = "$(Get-NpiCwValue $ta 'name')"; $tarn = "$(Get-NpiCwValue $ta 'trustAnchorArn')"
        $enabled = (Get-NpiCwValue $ta 'enabled') -eq $true
        $src = "$(Get-NpiCwValue (Get-NpiCwValue $ta 'source') 'sourceType' '')"
        $crls = @(if ($crlsRead) { $Aws.Crls | Where-Object { "$(Get-NpiCwValue $_ 'trustAnchorArn')" -eq $tarn -and (Get-NpiCwValue $_ 'enabled') -eq $true } })
        $ids.Add([pscustomobject][ordered]@{ Cloud = 'aws'; Scope = $scope; Type = 'RolesAnywhereTrustAnchor'; Name = $n; Arn = $tarn; WorkloadKind = "CA source $src$(if (-not $enabled) { ' (disabled)' })"; SystemId = ''; Owners = @(); Sponsor = ''; Joined = 'through its profiles'' roles'; Target = 'Certificates on the certificate calendar (Step 3)' })
        $trust.Add([pscustomobject][ordered]@{ Cloud = 'aws'; Scope = $scope; Object = $n; Kind = 'Roles Anywhere trust anchor'; Principals = @([ordered]@{ type = 'CA'; value = $src; kind = $(if ($enabled) { 'enabled' } else { 'disabled' }); conditions = @(if ($crlsRead) { "imported CRLs enabled: $($crls.Count)" } else { 'CRLs not read' }) }) })
        if (-not $enabled) { continue }
        if (-not $crlsRead) { & $add 'NPI-AWS-14' 'Warn' "$scope|$tarn" "$n (trust anchor)" 'roles-anywhere-crls.json not read: can''t tell whether a CRL is imported; GovCloud has no automatic CRL distribution point checking, so imported CRLs are the only revocation (run the Lab 2 CRL export)' }
        elseif (-not $crls.Count) { & $add 'NPI-AWS-14' 'Finding' "$scope|$tarn" "$n (trust anchor)" 'Enabled with no enabled imported CRL: in GovCloud a revoked certificate from this CA still gets credentials until a CRL is imported' }
    }
    foreach ($pr in ($Aws.Profiles | Sort-Object { "$(Get-NpiCwValue $_ 'name')" })) {
        $n = "$(Get-NpiCwValue $pr 'name')"
        $roles = @(Get-NpiCwValue $pr 'roleArns' @() | ForEach-Object { "$_" })
        $enabled = (Get-NpiCwValue $pr 'enabled') -eq $true
        $ids.Add([pscustomobject][ordered]@{ Cloud = 'aws'; Scope = $scope; Type = 'RolesAnywhereProfile'; Name = $n; Arn = "$(Get-NpiCwValue $pr 'profileArn')"; WorkloadKind = "Roles: $(($roles | ForEach-Object { ($_ -split '/')[-1] }) -join ', ')$(if (-not $enabled) { ' (disabled)' })"; SystemId = ''; Owners = @(); Sponsor = ''; Joined = 'through its roles'; Target = '' })
        if (-not $enabled) { continue }
        foreach ($ra in $roles) { $rn = ($ra -split '/')[-1]; if (-not $roleNames.ContainsKey($rn)) { & $add 'NPI-AWS-15' 'Warn' "$scope|$n|$rn" "$n (Roles Anywhere profile)" "Names role $rn, which isn't in roles.json: remove it from the profile, or find where it went" } }
    }
    [pscustomobject]@{ Findings = $f.ToArray(); Identities = $ids.ToArray(); Credentials = $creds.ToArray(); Trust = $trust.ToArray() }
}

# ----------------------------------------------------------------------------- OCI

function Get-NpiCwPolicySubject {
    <#
    .SYNOPSIS
        The dynamic groups a policy statement names as its subject ('Allow dynamic-group <name> to
        ...', a domain-qualified 'Domain'/'name', or 'dynamic-group id <ocid>'), and whether it's for
        OKE workload identities (request.principal.type = 'workload').
    .EXAMPLE
        Get-NpiCwPolicySubject "Allow dynamic-group dg-hr-batch to read objects in compartment hr"
    #>
    param([string]$Statement)
    $groups = @()
    if ($Statement -match '(?i)^\s*allow\s+(.+?)\s+to\s+') {
        foreach ($part in ($Matches[1] -split ',')) {
            if ($part -match "(?i)^\s*dynamic-group\s+id\s+(\S+)\s*$") { $groups += $Matches[1] }
            elseif ($part -match "(?i)^\s*dynamic-group\s+(\S+)\s*$") { $g = $Matches[1].Trim("'", '"'); if ($g -match "/") { $g = ($g -split '/')[-1].Trim("'", '"') }; $groups += $g }
        }
    }
    [pscustomobject]@{ DynamicGroups = $groups; Workload = $Statement -match "(?i)request\.principal\.type\s*=\s*'workload'"; ManageAll = $Statement -match '(?i)\bto\s+manage\s+all-resources\b' }
}

function Test-NpiCwOci {
    <#
    .SYNOPSIS
        Runs the OCI checks (NPI-OCI-01 to -10) on one tenancy's files and returns
        @{ Findings; Identities; Credentials; Trust }.
    .EXAMPLE
        $s = Import-NpiCwSetting -Path tests/fixtures/ch13/settings.json
        $in = Import-NpiCwInput -OciPath tests/fixtures/ch13/oci
        (Test-NpiCwOci -Oci $in.Oci -Settings $s -Exceptions @() -AsOf 2026-11-24).Findings.Count
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Oci, [Parameter(Mandatory)]$Settings, [object[]]$Exceptions = @(), [Parameter(Mandatory)][datetime]$AsOf)
    $f = [Collections.Generic.List[object]]::new()
    $ids = [Collections.Generic.List[object]]::new()
    $creds = [Collections.Generic.List[object]]::new()
    $trust = [Collections.Generic.List[object]]::new()
    $scope = "oci:$($Settings.Oci.Realm)"
    $add = { param($rule, $sev, $key, $obj, $issue) $f.Add((New-NpiFinding $rule $sev $key $obj $issue)) }
    $isActive = { param($x) "$(Get-NpiCwValue $x 'lifecycleState' '')" -eq 'ACTIVE' }
    $usersByName = @{}
    foreach ($u in $Oci.Users) { $usersByName["$(Get-NpiCwValue $u 'name')"] = $u }

    # ---- users and their long-lived credentials
    foreach ($entry in ($Oci.Credentials | Sort-Object { "$(Get-NpiCwValue $_ 'User')" })) {
        $name = "$(Get-NpiCwValue $entry 'User')"
        $label = "$name (OCI user)"
        $api = @(Get-NpiCwItem (Get-NpiCwValue $entry 'ApiKeys') | Where-Object { & $isActive $_ } | Sort-Object { ConvertTo-NpiCwDate (Get-NpiCwValue $_ 'timeCreated') })
        $tokens = @(Get-NpiCwItem (Get-NpiCwValue $entry 'AuthTokens') | Where-Object { & $isActive $_ })
        $csk = @(Get-NpiCwItem (Get-NpiCwValue $entry 'CustomerSecretKeys') | Where-Object { & $isActive $_ })
        $user = if ($usersByName.ContainsKey($name)) { $usersByName[$name] } else { $null }
        if (-not ($api.Count + $tokens.Count + $csk.Count)) {
            $ids.Add([pscustomobject][ordered]@{ Cloud = 'oci'; Scope = $scope; Type = 'OciUser'; Name = $name; Arn = "$(Get-NpiCwValue $user 'id' '')"; WorkloadKind = 'No active API key, auth token or customer secret key'; SystemId = ''; Owners = @(); Sponsor = ''; Joined = 'out of scope'; Target = 'Not a workload identity' })
            continue
        }
        $o = Get-NpiCwOwnerTag -OciObject $user -Settings $Settings
        if (-not $user) { & $add 'NPI-OCI-06' 'Warn' "$scope|user|$name" $label 'Holds credentials but isn''t in oci-users.json: the two reads are from different times or tenancies; read both again' }
        elseif ($o.Missing.Count) { & $add 'NPI-OCI-06' 'Finding' "$scope|user|$name" $label "Not joined to a record: missing tag(s) $($o.Missing -join ', ') (Step 1f)" }
        $ids.Add([pscustomobject][ordered]@{ Cloud = 'oci'; Scope = $scope; Type = 'OciUser'; Name = $name; Arn = "$(Get-NpiCwValue $user 'id' '')"; WorkloadKind = 'OCI user (long-lived credentials)'; SystemId = "$($o.SystemId)"; Owners = @($o.Owners); Sponsor = "$($o.Sponsor)"
                Joined = $(if ($user -and -not $o.Missing.Count) { 'yes' } else { 'no' }); Target = 'Replace with an instance, resource or workload principal; keep a credential only as an exception (Step 2)' })
        foreach ($k in $api) {
            $fp = "$(Get-NpiCwValue $k 'fingerprint')"
            $created = ConvertTo-NpiCwDate (Get-NpiCwValue $k 'timeCreated')
            $age = if ($null -ne $created) { Get-NpiCwDays $created $AsOf } else { $null }
            $v = Get-NpiCwExceptionVerdict -Exceptions $Exceptions -Cloud oci -CredentialId $fp -AsOf $AsOf
            & $add 'NPI-OCI-01' $v.Severity "$scope|$name|$fp" $label "Active API signing key $fp, a long-lived private key$(if ($null -ne $age) { ", $age days old" }): $($v.Note)"
            if ($null -ne $age -and $age -gt $script:OciApiKeyMaxAgeDays) { & $add 'NPI-OCI-02' 'Finding' "$scope|$name|$fp" $label "API signing key $fp is $age days old: Oracle says to rotate API keys every $($script:OciApiKeyMaxAgeDays) days or less" }
            $creds.Add((New-NpiCwCredentialRow 'oci' $scope $name 'API signing key' $fp 'ACTIVE' $created $AsOf $null $null $v 'NPI-OCI-01'))
        }
        if ($api.Count -gt 1) { & $add 'NPI-OCI-03' 'Warn' "$scope|$name" $label "$($api.Count) active API signing keys (OCI allows three): each is a private key somewhere; remove the ones a rotation left behind" }
        foreach ($t in $tokens) {
            $tid = "$(Get-NpiCwValue $t 'id')"
            $created = ConvertTo-NpiCwDate (Get-NpiCwValue $t 'timeCreated')
            $v = Get-NpiCwExceptionVerdict -Exceptions $Exceptions -Cloud oci -CredentialId $tid -AsOf $AsOf
            & $add 'NPI-OCI-04' $v.Severity "$scope|$name|$tid" $label "Active auth token$(if ($desc = "$(Get-NpiCwValue $t 'description' '')") { " ($desc)" }) created $(Format-NpiCwDate $created): auth tokens don't expire, so the exception's date is the only limit; $($v.Note)"
            $creds.Add((New-NpiCwCredentialRow 'oci' $scope $name 'Auth token' $tid 'ACTIVE' $created $AsOf $null (ConvertTo-NpiCwDate (Get-NpiCwValue $t 'timeExpires')) $v 'NPI-OCI-04'))
        }
        foreach ($c in $csk) {
            $cid = "$(Get-NpiCwValue $c 'id')"
            $created = ConvertTo-NpiCwDate (Get-NpiCwValue $c 'timeCreated')
            $v = Get-NpiCwExceptionVerdict -Exceptions $Exceptions -Cloud oci -CredentialId $cid -AsOf $AsOf
            & $add 'NPI-OCI-05' $v.Severity "$scope|$name|$cid" $label "Active customer secret key$(if ($dn = "$(Get-NpiCwValue $c 'displayName' '')") { " ($dn)" }) created $(Format-NpiCwDate $created): customer secret keys don't expire; $($v.Note)"
            $creds.Add((New-NpiCwCredentialRow 'oci' $scope $name 'Customer secret key' $cid 'ACTIVE' $created $AsOf $null (ConvertTo-NpiCwDate (Get-NpiCwValue $c 'timeExpires')) $v 'NPI-OCI-05'))
        }
    }

    # ---- policies: which dynamic groups each statement names, and the OKE workload statements
    $named = @{}
    foreach ($p in ($Oci.Policies | Sort-Object { "$(Get-NpiCwValue $_ 'name')" })) {
        $pname = "$(Get-NpiCwValue $p 'name')"
        $i = 0
        foreach ($s in @(Get-NpiCwValue $p 'statements' @())) {
            $i++
            $subj = Get-NpiCwPolicySubject "$s"
            foreach ($g in $subj.DynamicGroups) { $named[$g] = $true }
            if ($subj.Workload) {
                & $add 'NPI-OCI-10' 'Info' "$scope|$pname|$i" "$pname (policy), statement $i" "OKE workload identity: $s. It can't be in a dynamic group, so its owner is the policy's (record the cluster, namespace and service account)"
                $ids.Add([pscustomobject][ordered]@{ Cloud = 'oci'; Scope = $scope; Type = 'OkeWorkloadIdentity'; Name = "$pname#$i"; Arn = ''; WorkloadKind = 'OKE workload identity (policy statement)'; SystemId = ''; Owners = @(); Sponsor = ''; Joined = 'through the policy'; Target = 'Keep: no secret' })
            }
            if (($subj.DynamicGroups.Count -or $subj.Workload) -and $subj.ManageAll) {
                & $add 'NPI-OCI-09' 'Finding' "$scope|$pname|$i" "$pname (policy), statement $i" "Grants a workload 'manage all-resources': $s. Grant only the statements its workload needs (Step 4f)"
            }
            if ($subj.DynamicGroups.Count -or $subj.Workload) {
                $trust.Add([pscustomobject][ordered]@{ Cloud = 'oci'; Scope = $scope; Object = "$pname#$i"; Kind = 'Policy statement'; Principals = @([ordered]@{ type = $(if ($subj.Workload) { 'workload' } else { 'dynamic-group' }); value = ($subj.DynamicGroups -join ', '); kind = $(if ($subj.ManageAll) { 'manage all-resources' } else { 'scoped' }); conditions = @("$s") }) })
            }
        }
    }

    # ---- dynamic groups
    foreach ($dg in ($Oci.DynamicGroups | Sort-Object { "$(Get-NpiCwValue $_ 'name')" })) {
        $n = "$(Get-NpiCwValue $dg 'name')"; $dgId = "$(Get-NpiCwValue $dg 'id')"
        $label = "$n (dynamic group)"
        $rule = "$(Get-NpiCwValue $dg 'matchingRule' '')"
        $o = Get-NpiCwOwnerTag -OciObject $dg -Settings $Settings
        $kind = if ($rule -match "(?i)resource\.type\s*=\s*'fnfunc'") { 'Resource principal (Functions)' } elseif ($rule -match '(?i)resource\.') { 'Resource principal' } else { 'Instance principal' }
        $ids.Add([pscustomobject][ordered]@{ Cloud = 'oci'; Scope = $scope; Type = 'DynamicGroup'; Name = $n; Arn = $dgId; WorkloadKind = $kind; SystemId = "$($o.SystemId)"; Owners = @($o.Owners); Sponsor = "$($o.Sponsor)"; Joined = $(if ($o.Missing.Count) { 'no' } else { 'yes' }); Target = 'Keep: platform-rotated credentials (Step 2)' })
        $trust.Add([pscustomobject][ordered]@{ Cloud = 'oci'; Scope = $scope; Object = $n; Kind = 'Dynamic group matching rule'; Principals = @([ordered]@{ type = 'matching-rule'; value = $rule; kind = $kind; conditions = @() }) })
        if ($o.Missing.Count) { & $add 'NPI-OCI-06' 'Finding' "$scope|dg|$n" $label "Not joined to a record: missing tag(s) $($o.Missing -join ', ') (Step 1f)" }
        if (-not ($named.ContainsKey($n) -or $named.ContainsKey($dgId))) { & $add 'NPI-OCI-07' 'Warn' "$scope|dg|$n" $label 'No policy in oci-policies.json names it: it has no permissions in the compartments read; remove it, or read the compartment whose policy uses it' }
        if ($rule -match 'ocid1\.tenancy\.') { & $add 'NPI-OCI-08' 'Warn' "$scope|dg|$n" $label "The matching rule names the tenancy ($rule): every instance or resource in it is a member; narrow it to a compartment or tag (Step 4f)" }
    }
    [pscustomobject]@{ Findings = $f.ToArray(); Identities = $ids.ToArray(); Credentials = $creds.ToArray(); Trust = $trust.ToArray() }
}

# ----------------------------------------------------------------------------- the run

function Invoke-NpiCwRun {
    <#
    .SYNOPSIS
        Runs the AWS checks, the OCI checks or both on the inputs and returns @{ AsOf; Findings;
        Identities; Credentials; Trust; NotRead }. Nothing is written; Export-NpiCwRun writes the folder.
    .EXAMPLE
        $s = Import-NpiCwSetting -Path tests/fixtures/ch13/settings.json
        $in = Import-NpiCwInput -AwsPath tests/fixtures/ch13/aws -OciPath tests/fixtures/ch13/oci -ExceptionsPath tests/fixtures/ch13/exceptions.csv
        $r = Invoke-NpiCwRun -Inputs $in -Settings $s -AsOf 2026-11-24
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Inputs, [Parameter(Mandatory)]$Settings, [Parameter(Mandatory)][datetime]$AsOf)
    $asOf = [datetime]::SpecifyKind($AsOf.Date, [DateTimeKind]::Utc)
    $parts = @()
    if ($Inputs.Aws) { $parts += Test-NpiCwAws -Aws $Inputs.Aws -Settings $Settings -Exceptions $Inputs.Exceptions -AsOf $asOf }
    if ($Inputs.Oci) { $parts += Test-NpiCwOci -Oci $Inputs.Oci -Settings $Settings -Exceptions $Inputs.Exceptions -AsOf $asOf }
    [pscustomobject]@{
        AsOf        = $asOf
        Findings    = Get-NpiCwSortedFinding @($parts | ForEach-Object { $_.Findings })
        Identities  = @($parts | ForEach-Object { $_.Identities })
        Credentials = @($parts | ForEach-Object { $_.Credentials })
        Trust       = @($parts | ForEach-Object { $_.Trust })
        NotRead     = @($Inputs.NotRead)
    }
}

function Export-NpiCwRun {
    <#
    .SYNOPSIS
        Writes a run folder: findings.json, identities.json, credentials.csv (identifiers only, never
        a secret), trust.json, evidence.json (one row per step and control: step, control, ksi,
        evidence, sha256) and manifest.json (input and output SHA-256s, settings, as-of date, module
        version, the export commands the inputs came from, and the files not read). Every byte depends
        only on the inputs and -AsOf. Returns the manifest file.
    .EXAMPLE
        Export-NpiCwRun -Run $r -Inputs $in -Settings $s -OutputPath out/cloud-workload
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Run, [Parameter(Mandatory)]$Inputs, [Parameter(Mandatory)]$Settings, [Parameter(Mandatory)][string]$OutputPath)
    $out = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
    New-Item -ItemType Directory -Force -Path $out | Out-Null
    $enc = [Text.UTF8Encoding]::new($false)
    $csvText = if (@($Run.Credentials).Count) { ((@($Run.Credentials) | ConvertTo-Csv -NoTypeInformation) -join "`n") + "`n" } else { (($script:CredentialHeader | ForEach-Object { '"' + $_ + '"' }) -join ',') + "`n" }
    $files = [ordered]@{
        'findings.json'   = @{ json = @($Run.Findings) }
        'identities.json' = @{ json = @($Run.Identities) }
        'credentials.csv' = @{ text = $csvText }
        'trust.json'      = @{ json = @($Run.Trust) }
    }
    $hashes = [ordered]@{}
    foreach ($name in $files.Keys) {
        $p = Join-Path $out $name
        if ($files[$name].ContainsKey('text')) { [IO.File]::WriteAllText($p, $files[$name].text, $enc) } else { Write-NpiJson -Path $p -Value $files[$name].json }
        $hashes[$name] = Get-NpiFileHash -Path $p
    }
    $req = Get-NpiCwRequirement
    $rows = [Collections.Generic.List[object]]::new()
    foreach ($step in $req.steps.Keys) {
        foreach ($control in $req.steps[$step].controls) {
            $c = $req.controls[$control]
            foreach ($file in $req.steps[$step].evidence) {
                $row = [ordered]@{ step = $step; control = $control; ksi = @($c.ksis); evidence = $file; sha256 = $hashes[$file] }
                if ($c.ContainsKey('primaryKsi')) { $row.primaryKsi = $c.primaryKsi }
                $rows.Add([pscustomobject]$row)
            }
        }
    }
    $evPath = Join-Path $out 'evidence.json'
    Write-NpiJson -Path $evPath -Value ([ordered]@{ note = "The controls each output provides evidence for and the KSIs aligned with them (config/requirements-ch13.json; FedRAMP's KSI page accessed $($req.source.accessed)). Evidence for, not proof that a control is met."; rows = $rows.ToArray() })
    $hashes['evidence.json'] = Get-NpiFileHash -Path $evPath

    $inputHashes = [ordered]@{}
    foreach ($k in $Inputs.Hashes.Keys) { $inputHashes[$k] = $Inputs.Hashes[$k] }
    $inputHashes['settings.json'] = $Settings.Sha256
    $inputHashes['calls-ch13.json'] = Get-NpiFileHash -Path $script:CallsPath
    $inputHashes['requirements-ch13.json'] = Get-NpiFileHash -Path $script:RequirementsPath
    $calls = Get-NpiCwCallList
    $clouds = @(if ($Inputs.Aws) { 'aws' }; if ($Inputs.Oci) { 'oci' })
    $fs = @($Run.Findings)
    $m = [ordered]@{
        task = $script:Task; chapter = '13'; mode = 'Files'; asOf = $Run.AsOf.ToString('yyyy-MM-dd'); generated = $Run.AsOf.ToString('o')
        module = 'NpiCloudWorkload'; moduleVersion = $script:ModuleVersion
        aws = $(if ($Inputs.Aws) { [ordered]@{ accountId = $Settings.Aws.AccountId; partition = $Settings.Aws.Partition; region = $Settings.Aws.Region } } else { $null })
        oci = $(if ($Inputs.Oci) { [ordered]@{ realm = $Settings.Oci.Realm; tenancyOcid = $Settings.Oci.TenancyOcid } } else { $null })
        requests = @()   # the kit calls nothing; the exports came from these read-only commands, run by an operator
        exportCommands = @($calls.calls | Where-Object { $clouds -contains $_.api } | ForEach-Object { [ordered]@{ call = $_.id; command = $_.command } })
        notRead = @($Run.NotRead)
        counts = [ordered]@{ Finding = @($fs | Where-Object Severity -EQ 'Finding').Count; Warn = @($fs | Where-Object Severity -EQ 'Warn').Count; Info = @($fs | Where-Object Severity -EQ 'Info').Count }
        inputs = $inputHashes; files = $hashes
    }
    Write-NpiJson -Path (Join-Path $out 'manifest.json') -Value $m
    Get-Item -LiteralPath (Join-Path $out 'manifest.json')
}

Export-ModuleMember -Function Get-NpiCwValue, ConvertTo-NpiCwDate, Get-NpiCwCallList, Get-NpiCwRequirement, Import-NpiCwSetting, Import-NpiCwInput,
    Get-NpiCwOwnerTag, Get-NpiCwExceptionVerdict, ConvertFrom-NpiCwPolicyDocument, Get-NpiCwTrust, Test-NpiCwAws, Get-NpiCwPolicySubject, Test-NpiCwOci,
    Invoke-NpiCwRun, Export-NpiCwRun
