#Requires -Version 7.2
<#
.SYNOPSIS
    Convert an Oracle Fusion Cloud HCM extract (CSV) into SCIM bulk requests for Microsoft Entra
    API-driven inbound provisioning, validate every record, and optionally POST to /bulkUpload.

.DESCRIPTION
    ILLUSTRATIVE: unit-tested against fixtures, not proven against live tenants.
    The PowerShell twin of python/hcm_to_scim.py. Both read config/mapping.json and produce the
    same operations and the same payload hashes for the same input. Nothing is sent unless
    Invoke-HcmBulkUpload is called (the wrapper script does that only with -Apply).
#>
Set-StrictMode -Version 3.0

$script:CoreSchema = 'urn:ietf:params:scim:schemas:core:2.0:User'
$script:EnterpriseSchema = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'
$script:BulkSchema = 'urn:ietf:params:scim:api:messages:2.0:BulkRequest'
$script:EndpointPattern = '^https://(graph\.microsoft\.com|graph\.microsoft\.us|dod-graph\.microsoft\.us)/(v1\.0|beta)/servicePrincipals/[0-9a-fA-F-]{36}/synchronization/jobs/[A-Za-z0-9._-]+/bulkUpload$'
$script:SecretKeyPattern = '(secret|password|passwd|token|credential|private|apikey|api_key|bearer)'
$script:DatePattern = '^\d{4}-\d{2}-\d{2}$'
$script:OffsetPattern = '^[+-](0\d|1[0-4]):[0-5]\d$'
$script:TimePattern = '^([01]\d|2[0-3]):[0-5]\d$'
$script:Inv = [System.Globalization.CultureInfo]::InvariantCulture

# ------------------------------------------------------------------ configuration

function Get-HcmMapping {
    <#
    .SYNOPSIS
        Read the field mapping file (config/mapping.json) into a hashtable.
    .EXAMPLE
        $map = Get-HcmMapping -Path ./config/mapping.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    return Get-Content -LiteralPath $Path -Raw -Encoding utf8 | ConvertFrom-Json -AsHashtable
}

function Test-HcmSettings {
    <#
    .SYNOPSIS
        Merge defaults, refuse secrets, and check formats. Returns the merged settings.
    .EXAMPLE
        Test-HcmSettings -Settings @{ default_utc_offset = '-05:00'; max_disables_per_run = 10 }
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings)
    foreach ($key in $Settings.Keys) {
        if ($key.StartsWith('_')) { continue }
        if ($key -match $script:SecretKeyPattern) {
            throw "settings key '$key' looks like a secret; secrets never go in a file"
        }
    }
    $merged = [ordered]@{
        endpoint                  = ''
        default_utc_offset        = '+00:00'
        hire_local_time           = '05:00'
        leave_local_time          = '23:00'
        max_disables_per_run      = 25
        daily_call_budget         = 2000
        min_seconds_between_calls = 0.15
        max_retries               = 4
        catch_up_days             = 3
        prestart_disabled         = $true
    }
    foreach ($key in $Settings.Keys) { if (-not $key.StartsWith('_')) { $merged[$key] = $Settings[$key] } }
    if ($merged.default_utc_offset -notmatch $script:OffsetPattern) { throw 'default_utc_offset must look like -05:00' }
    foreach ($k in 'hire_local_time', 'leave_local_time') {
        if ($merged[$k] -notmatch $script:TimePattern) { throw "$k must look like 05:00" }
    }
    if ([double]$merged.min_seconds_between_calls -lt 0.125) {
        throw 'min_seconds_between_calls must be at least 0.125 (40 calls per 5 seconds)'
    }
    return $merged
}

function Get-HcmSettings {
    <#
    .SYNOPSIS
        Read a settings JSON file and return it merged with the defaults and checked by
        Test-HcmSettings. A key that looks like a secret is refused.
    .EXAMPLE
        $cfg = Get-HcmSettings -Path ./config/settings.example.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $raw = Get-Content -LiteralPath $Path -Raw -Encoding utf8 | ConvertFrom-Json -AsHashtable
    return Test-HcmSettings -Settings $raw
}

function Test-HcmEndpoint {
    <#
    .SYNOPSIS
        Return the endpoint unchanged when it is an https Microsoft Graph /bulkUpload URL for one
        provisioning job (graph.microsoft.com, graph.microsoft.us or dod-graph.microsoft.us);
        otherwise throw.
    .EXAMPLE
        Test-HcmEndpoint -Endpoint (Get-HcmSettings -Path ./config/settings.example.json).endpoint
    #>
    [CmdletBinding()]
    param([AllowEmptyString()][string]$Endpoint)
    if ($Endpoint -cnotmatch $script:EndpointPattern) {
        throw 'endpoint must be an https Microsoft Graph /bulkUpload URL for one provisioning job (graph.microsoft.com, graph.microsoft.us or dod-graph.microsoft.us)'
    }
    return $Endpoint
}

# ------------------------------------------------------------------ canonical JSON and hashing

function ConvertTo-HcmJsonString([string]$s) {
    $sb = [System.Text.StringBuilder]::new('"')
    foreach ($ch in $s.ToCharArray()) {
        switch ([int]$ch) {
            0x22 { [void]$sb.Append('\"'); continue }
            0x5C { [void]$sb.Append('\\'); continue }
            0x0A { [void]$sb.Append('\n'); continue }
            0x0D { [void]$sb.Append('\r'); continue }
            0x09 { [void]$sb.Append('\t'); continue }
            0x08 { [void]$sb.Append('\b'); continue }
            0x0C { [void]$sb.Append('\f'); continue }
            default {
                if ([int]$ch -lt 0x20) { [void]$sb.Append(('\u{0:x4}' -f [int]$ch)) } else { [void]$sb.Append($ch) }
            }
        }
    }
    [void]$sb.Append('"')
    return $sb.ToString()
}

function ConvertTo-HcmCanonicalJson {
    <#
    .SYNOPSIS
        Convert a value to canonical JSON: sorted keys (ordinal), no whitespace, UTF-8 characters
        kept. Matches Python's json.dumps(sort_keys=True, separators=(',', ':'), ensure_ascii=False).
    .EXAMPLE
        ConvertTo-HcmCanonicalJson -Value ([ordered]@{ b = 1; a = @($true, $null) })   # {"a":[true,null],"b":1}
    #>
    [CmdletBinding()]
    param([AllowNull()]$Value)
    if ($null -eq $Value) { return 'null' }
    if ($Value -is [bool]) { return $(if ($Value) { 'true' } else { 'false' }) }
    if ($Value -is [string]) { return ConvertTo-HcmJsonString $Value }
    if ($Value -is [int] -or $Value -is [long]) { return $Value.ToString($script:Inv) }
    if ($Value -is [System.Collections.IDictionary]) {
        $keys = [string[]]@($Value.Keys)
        [Array]::Sort($keys, [StringComparer]::Ordinal)
        $parts = foreach ($k in $keys) { (ConvertTo-HcmJsonString $k) + ':' + (ConvertTo-HcmCanonicalJson $Value[$k]) }
        return '{' + ($parts -join ',') + '}'
    }
    if ($Value -is [System.Collections.IEnumerable]) {
        $parts = foreach ($item in $Value) { ConvertTo-HcmCanonicalJson $item }
        return '[' + (@($parts) -join ',') + ']'
    }
    throw "unsupported value type $($Value.GetType().FullName)"
}

function Get-HcmSha256 {
    <#
    .SYNOPSIS
        Return the lowercase hex SHA-256 of a value's canonical JSON.
    .EXAMPLE
        Get-HcmSha256 -Value $result.Batches[0]
    #>
    [CmdletBinding()]
    param([AllowNull()]$Value)
    $bytes = [System.Text.Encoding]::UTF8.GetBytes((ConvertTo-HcmCanonicalJson $Value))
    return [Convert]::ToHexString([System.Security.Cryptography.SHA256]::HashData($bytes)).ToLowerInvariant()
}

function ConvertTo-HcmUtcIso {
    <#
    .SYNOPSIS
        Combine a date, a local time and a UTC offset into a UTC timestamp (yyyy-MM-ddTHH:mm:ssZ).
    .EXAMPLE
        ConvertTo-HcmUtcIso -Date '2026-11-02' -LocalTime '05:00' -Offset '-05:00'   # 2026-11-02T10:00:00Z
    #>
    [CmdletBinding()]
    param([string]$Date, [string]$LocalTime, [string]$Offset)
    $dto = [DateTimeOffset]::ParseExact("$Date $LocalTime $Offset", 'yyyy-MM-dd HH:mm zzz', $script:Inv)
    return $dto.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", $script:Inv)
}

# ------------------------------------------------------------------ one record

function Get-Cell($Row, [string]$Name) {
    $p = $Row.PSObject.Properties[$Name]
    if ($null -eq $p -or $null -eq $p.Value) { return '' }
    return ([string]$p.Value).Trim()
}

function ConvertTo-HcmScimOperation {
    <#
    .SYNOPSIS
        Validate one extract row and build its SCIM bulk operation. Fail closed: a row with any
        problem comes back quarantined, with its reasons and no operation.
    .EXAMPLE
        $rows = @(Import-Csv -LiteralPath ./tests/fixtures/hcm_extract_sample.csv -Encoding utf8)
        ConvertTo-HcmScimOperation -Row $rows[0] -Mapping $map -Settings $cfg -AsOf ([datetime]'2026-10-25')
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Row,
        [Parameter(Mandatory)][System.Collections.IDictionary]$Mapping,
        [Parameter(Mandatory)][System.Collections.IDictionary]$Settings,
        [Parameter(Mandatory)][datetime]$AsOf
    )
    $clean = [ordered]@{}
    foreach ($p in $Row.PSObject.Properties) { $clean[$p.Name.Trim()] = Get-Cell $Row $p.Name }
    $cell = { param($n) if ($clean.Contains($n)) { [string]$clean[$n] } else { '' } }
    $key = & $cell 'PersonNumber'
    $reasons = [System.Collections.Generic.List[string]]::new()
    $warnings = [System.Collections.Generic.List[string]]::new()
    $out = [pscustomobject]@{
        PersonKey = $(if ($key) { $key } else { '(missing)' })
        Status = 'ready'; Reasons = $reasons; Warnings = $warnings; Operation = $null
        Row = $clean; IsLeaver = $false; ManagerKey = ''
    }

    foreach ($column in $Mapping.required_columns) {
        if (-not (& $cell $column)) { $reasons.Add("required column $column is empty") }
    }
    if ($key -and $key -cnotmatch $Mapping.person_key_pattern) {
        $reasons.Add("PersonNumber doesn't fit employeeId (letters, digits and hyphens, at most 16 characters)")
    }
    $workerType = & $cell 'WorkerType'
    $wt = if ($workerType -and $Mapping.worker_types.Contains($workerType)) { $Mapping.worker_types[$workerType] } else { $null }
    if ($workerType -and $Mapping.refused_worker_types.Contains($workerType)) {
        $reasons.Add("worker type $workerType refused: $($Mapping.refused_worker_types[$workerType])")
    } elseif ($workerType -and $null -eq $wt) {
        $reasons.Add("unknown worker type $workerType")
    }
    $statusType = & $cell 'AssignmentStatusType'
    $status = if ($statusType -and $Mapping.assignment_status_types.Contains($statusType)) { $Mapping.assignment_status_types[$statusType] } else { $null }
    if ($statusType -and $null -eq $status) { $reasons.Add("unknown assignment status type $statusType") }

    foreach ($column in $Mapping.max_lengths.Keys) {
        $limit = [int]$Mapping.max_lengths[$column]
        if ((& $cell $column).Length -gt $limit) { $reasons.Add("$column is longer than $limit characters") }
    }
    $deptCode = & $cell 'DepartmentCode'
    if ($deptCode -and $deptCode -cnotmatch $Mapping.code_pattern) {
        $reasons.Add("DepartmentCode '$deptCode' isn't a code (A-Z, 0-9, hyphen)")
    }
    $category = & $cell 'PositionCategory'
    if ($category -and $Mapping.position_categories -cnotcontains $category) {
        $reasons.Add("PositionCategory '$category' isn't in the approved code list")
    }
    $offset = & $cell 'UtcOffset'
    if (-not $offset) { $offset = [string]$Settings.default_utc_offset }
    if ($offset -notmatch $script:OffsetPattern) { $reasons.Add("UtcOffset '$offset' isn't an offset like -05:00") }
    foreach ($column in 'HireDate', 'TerminationDate') {
        $v = & $cell $column
        if ($v) {
            $parsed = [datetime]::MinValue
            if ($v -notmatch $script:DatePattern -or -not [datetime]::TryParseExact($v, 'yyyy-MM-dd', $script:Inv, 'None', [ref]$parsed)) {
                $reasons.Add("$column '$v' isn't a date (yyyy-mm-dd)")
            }
        }
    }
    $manager = & $cell 'ManagerPersonNumber'
    if ($manager -and $manager -ceq $key) { $reasons.Add('worker is recorded as their own manager') }
    $out.ManagerKey = $manager
    if ($null -ne $status -and -not [bool]$status.active -and -not (& $cell 'TerminationDate')) {
        $reasons.Add("inactive assignment with no termination date: the leave date can't be set")
    }
    if ($reasons.Count -gt 0) { $out.Status = 'quarantined'; return $out }

    $ext = [string]$Mapping.scim_extension_namespace
    $active = [bool]$status.active
    $out.IsLeaver = -not $active
    if ($status.note -and $active) { $warnings.Add([string]$status.note) }
    $hireText = & $cell 'HireDate'
    if ($active -and [bool]$Settings.prestart_disabled -and $hireText -and [datetime]::ParseExact($hireText, 'yyyy-MM-dd', $script:Inv) -gt $AsOf.Date) {
        # Book 03, Appendix C: the account exists, disabled, before day one. Re-send on the hire date.
        $active = $false
        $warnings.Add('pre-start: sent disabled until the hire date; schedule a re-send on that date')
    }

    $first = & $cell 'FirstName'; $last = & $cell 'LastName'
    $display = & $cell 'DisplayName'; if (-not $display) { $display = "$first $last" }
    $data = [ordered]@{
        schemas     = @($script:CoreSchema, $script:EnterpriseSchema, $ext)
        externalId  = $key
        active      = $active
        name        = [ordered]@{ givenName = $first; familyName = $last }
        displayName = $display
    }
    if (& $cell 'UserName') { $data.userName = & $cell 'UserName' }
    if (& $cell 'JobName') { $data.title = & $cell 'JobName' }
    if (& $cell 'WorkCountry') { $data.addresses = @([ordered]@{ type = 'work'; country = (& $cell 'WorkCountry'); primary = $true }) }

    $enterprise = [ordered]@{ employeeNumber = $key; organization = (& $cell 'LegalEmployer') }
    foreach ($pair in @(@('DepartmentName', 'department'), @('BusinessUnit', 'division'), @('CostCenter', 'costCenter'))) {
        if (& $cell $pair[0]) { $enterprise[$pair[1]] = & $cell $pair[0] }
    }
    if ($manager) { $enterprise.manager = [ordered]@{ value = $manager } }
    $data[$script:EnterpriseSchema] = $enterprise

    $extension = [ordered]@{ workerType = [string]$wt.employeeType; workerTypeCode = [string]$wt.code; orgCode = $deptCode }
    if ($category) { $extension.positionCategory = $category }
    if (& $cell 'JobCode') { $extension.JobCode = & $cell 'JobCode' }
    if (& $cell 'HireDate') { $extension.HireDate = ConvertTo-HcmUtcIso -Date (& $cell 'HireDate') -LocalTime $Settings.hire_local_time -Offset $offset }
    $termText = & $cell 'TerminationDate'
    if ($termText) {
        $extension.TermDate = ConvertTo-HcmUtcIso -Date $termText -LocalTime $Settings.leave_local_time -Offset $offset
        $term = [datetime]::ParseExact($termText, 'yyyy-MM-dd', $script:Inv)
        if (-not $active -and ($AsOf.Date - $term).Days -gt [int]$Settings.catch_up_days) {
            $warnings.Add('termination date is more than the Lifecycle Workflows catch-up window in the past: run the leaver workflow on demand')
        }
    }
    $data[$ext] = $extension
    $out.Operation = [ordered]@{ method = 'POST'; bulkId = $key; path = '/Users'; data = $data }
    return $out
}

# ------------------------------------------------------------------ the run

function Convert-HcmExtract {
    <#
    .SYNOPSIS
        Convert all extract rows into SCIM bulk request batches: validate each row, settle duplicates
        (a separation wins), order leavers first and managers before their reports, and hold the run
        when disables or calls exceed the limits in the settings.
    .EXAMPLE
        $rows = @(Import-Csv -LiteralPath ./tests/fixtures/hcm_extract_sample.csv -Encoding utf8)
        $result = Convert-HcmExtract -Rows $rows -Mapping $map -Settings $cfg -AsOf ([datetime]'2026-10-25')
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][object[]]$Rows,
        [Parameter(Mandatory)][System.Collections.IDictionary]$Mapping,
        [Parameter(Mandatory)][System.Collections.IDictionary]$Settings,
        [Parameter(Mandatory)][datetime]$AsOf
    )
    $outcomes = @(foreach ($r in $Rows) { ConvertTo-HcmScimOperation -Row $r -Mapping $Mapping -Settings $Settings -AsOf $AsOf })

    # Precedence (Book 03, Appendix A): a separation wins; otherwise refuse the duplicate.
    $groups = [ordered]@{}
    foreach ($o in $outcomes) {
        if ($o.Status -ne 'ready') { continue }
        if (-not $groups.Contains($o.PersonKey)) { $groups[$o.PersonKey] = [System.Collections.Generic.List[object]]::new() }
        $groups[$o.PersonKey].Add($o)
    }
    foreach ($k in $groups.Keys) {
        $g = $groups[$k]
        if ($g.Count -lt 2) { continue }
        $leavers = @($g | Where-Object { $_.IsLeaver })
        if ($leavers.Count -eq 1) {
            foreach ($o in $g) {
                if (-not [object]::ReferenceEquals($o, $leavers[0])) {
                    $o.Status = 'superseded'; $o.Reasons.Add('superseded: a separation for the same person is in this run')
                }
            }
        } else {
            foreach ($o in $g) {
                $o.Status = 'quarantined'; $o.Reasons.Add('more than one record for this person and no single separation to prefer')
            }
        }
    }

    $ready = [ordered]@{}
    foreach ($o in $outcomes) { if ($o.Status -eq 'ready') { $ready[$o.PersonKey] = $o } }
    foreach ($o in $ready.Values) {
        if ($o.ManagerKey -and $ready.Contains($o.ManagerKey)) {
            $mgr = $ready[$o.ManagerKey]
            if ($mgr.IsLeaver -and -not $o.IsLeaver) { $o.Warnings.Add('manager is separating in this run: HR must assign a new supervisor') }
        }
    }

    # Order: leavers first, then managers before their reports, then person key (ordinal).
    $sortKeys = [System.Collections.Generic.List[string]]::new()
    $byKey = @{}
    foreach ($o in $ready.Values) {
        $depth = 0; $seen = [System.Collections.Generic.HashSet[string]]::new(); $cur = $o.ManagerKey
        while ($cur -and $ready.Contains($cur) -and -not $seen.Contains($cur)) { [void]$seen.Add($cur); $depth++; $cur = $ready[$cur].ManagerKey }
        $sk = '{0}|{1:D4}|{2}' -f $(if ($o.IsLeaver) { 0 } else { 1 }), $depth, $o.PersonKey
        $sortKeys.Add($sk); $byKey[$sk] = $o
    }
    $sortKeys.Sort([StringComparer]::Ordinal)
    $arr = [object[]]@(foreach ($sk in $sortKeys) { $byKey[$sk] })

    $size = [int]$Mapping.batch_size
    if ($size -lt 1 -or $size -gt 50) { throw 'batch_size must be between 1 and 50' }
    $batches = [System.Collections.Generic.List[object]]::new()
    for ($start = 0; $start -lt $arr.Count; $start += $size) {
        $chunk = $arr[$start..([Math]::Min($start + $size, $arr.Count) - 1)]
        $batches.Add([ordered]@{ schemas = @($script:BulkSchema); Operations = @($chunk | ForEach-Object { $_.Operation }); failOnErrors = $null })
    }
    $disables = @($arr | Where-Object { $_.IsLeaver }).Count
    $held = $disables -gt [int]$Settings.max_disables_per_run
    $reason = if ($held) { "$disables disables exceed max_disables_per_run ($($Settings.max_disables_per_run)): held for confirmation (Book 03, Appendix B pause switch)" } else { '' }
    if ($batches.Count -gt [int]$Settings.daily_call_budget) {
        $held = $true; $reason = "$($batches.Count) calls exceed the daily call budget ($($Settings.daily_call_budget))"
    }
    return [pscustomobject]@{ Outcomes = $outcomes; Batches = @($batches); Held = $held; HoldReason = $reason; Disables = $disables }
}

function Get-HcmReport {
    <#
    .SYNOPSIS
        Build the operational report from a conversion result: person key and payload hash only,
        never the payload.
    .EXAMPLE
        Get-HcmReport -Result $result | ConvertTo-Json -Depth 8
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Result)
    $counts = [ordered]@{}
    foreach ($o in $Result.Outcomes) { $counts[$o.Status] = 1 + $(if ($counts.Contains($o.Status)) { $counts[$o.Status] } else { 0 }) }
    $records = foreach ($o in $Result.Outcomes) {
        [ordered]@{
            person_key = $o.PersonKey; status = $o.Status; leaver = $o.IsLeaver
            payload_sha256 = $(if ($null -ne $o.Operation) { Get-HcmSha256 $o.Operation } else { '' })
            reasons = @($o.Reasons); warnings = @($o.Warnings)
        }
    }
    return [ordered]@{ counts = $counts; batches = $Result.Batches.Count; disables = $Result.Disables; held = $Result.Held; hold_reason = $Result.HoldReason; records = @($records) }
}

function Get-HcmQuarantineEntry {
    <#
    .SYNOPSIS
        Return the quarantine entries (Book 03, Appendix A) from a conversion result. They contain
        personal data: write them only to the access-controlled audit store.
    .EXAMPLE
        @(Get-HcmQuarantineEntry -Result $result) | ConvertTo-Json -Depth 12 -AsArray
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Result)
    foreach ($o in $Result.Outcomes) {
        if ($o.Status -eq 'quarantined') {
            [ordered]@{ person_key = $o.PersonKey; reasons = @($o.Reasons); hr_record = $o.Row; attempted_payload = $o.Operation }
        }
    }
}

function Get-HcmFileSha256 {
    <#
    .SYNOPSIS
        Return the SHA-256 of a file's bytes, so the manifest names the exact extract and mapping used.
    .EXAMPLE
        Get-HcmFileSha256 -Path ./tests/fixtures/hcm_extract_sample.csv
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    return [Convert]::ToHexString([System.Security.Cryptography.SHA256]::HashData([IO.File]::ReadAllBytes($Path))).ToLowerInvariant()
}

function Get-HcmProvenance {
    <#
    .SYNOPSIS
        Build the run's provenance manifest: which inputs produced which batches, by hash and
        person key. No names and no payloads; each batch_sha256 matches apply-results.json for
        that batch.
    .EXAMPLE
        Get-HcmProvenance -Result $result -AsOf ([datetime]'2026-10-25') -ExtractSha256 (Get-HcmFileSha256 -Path ./tests/fixtures/hcm_extract_sample.csv) -MappingSha256 (Get-HcmFileSha256 -Path ./config/mapping.json)
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Result,
        [Parameter(Mandatory)][datetime]$AsOf,
        [Parameter(Mandatory)][string]$ExtractSha256,
        [Parameter(Mandatory)][string]$MappingSha256
    )
    $counts = [ordered]@{}
    foreach ($o in $Result.Outcomes) { $counts[$o.Status] = 1 + $(if ($counts.Contains($o.Status)) { $counts[$o.Status] } else { 0 }) }
    $index = 0
    $batches = foreach ($b in $Result.Batches) {
        $index++
        [ordered]@{ batch = $index; batch_sha256 = (Get-HcmSha256 $b); person_keys = @($b.Operations | ForEach-Object { $_.bulkId }) }
    }
    return [ordered]@{
        schema = 'fmp-hcm-provenance/1'
        as_of = $AsOf.ToString('yyyy-MM-dd', $script:Inv)
        extract_sha256 = $ExtractSha256
        mapping_sha256 = $MappingSha256
        counts = $counts
        held = [bool]$Result.Held
        batches = @($batches)
        quarantined = @($Result.Outcomes | Where-Object { $_.Status -eq 'quarantined' } | ForEach-Object { $_.PersonKey })
    }
}

# ------------------------------------------------------------------ apply

function Invoke-HcmDefaultPost {
    param([string]$Uri, [byte[]]$Body, [hashtable]$Headers)
    $r = Invoke-WebRequest -Uri $Uri -Method Post -Body $Body -Headers $Headers -SkipHttpErrorCheck -UseBasicParsing
    $h = @{}; foreach ($k in $r.Headers.Keys) { $h[$k] = [string]($r.Headers[$k] -join ',') }
    return [pscustomobject]@{ Status = [int]$r.StatusCode; Headers = $h }
}

function Invoke-HcmBulkUpload {
    <#
    .SYNOPSIS
        POST each batch to the provisioning job's /bulkUpload endpoint, paced below the documented
        limit, honoring Retry-After on 429 and 503. Stops at the first batch that isn't accepted (202).
    .EXAMPLE
        # The token is obtained outside the kit. -WhatIf lists the calls without sending them.
        Invoke-HcmBulkUpload -Batches $result.Batches -Endpoint $cfg.endpoint -Token $env:HCM_ENTRA_BEARER_TOKEN -Settings $cfg -WhatIf
    #>
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(Mandatory)][object[]]$Batches,
        [Parameter(Mandatory)][string]$Endpoint,
        [Parameter(Mandatory)][string]$Token,
        [Parameter(Mandatory)][System.Collections.IDictionary]$Settings,
        [scriptblock]$Poster = { param($u, $b, $h) Invoke-HcmDefaultPost -Uri $u -Body $b -Headers $h },
        [scriptblock]$Sleeper = { param($s) Start-Sleep -Milliseconds ([int]($s * 1000)) }
    )
    [void](Test-HcmEndpoint -Endpoint $Endpoint)
    $headers = @{ Authorization = "Bearer $Token"; 'Content-Type' = 'application/scim+json' }
    $results = [System.Collections.Generic.List[object]]::new()
    $index = 0
    foreach ($batch in $Batches) {
        $index++
        if (-not $PSCmdlet.ShouldProcess($Endpoint, "POST bulk request $index")) { continue }
        $body = [System.Text.Encoding]::UTF8.GetBytes((ConvertTo-HcmCanonicalJson $batch))
        $attempt = 0
        while ($true) {
            $resp = & $Poster $Endpoint $body $headers
            if ($resp.Status -in 429, 503 -and $attempt -lt [int]$Settings.max_retries) {
                $ra = $null; foreach ($k in $resp.Headers.Keys) { if ($k -ieq 'Retry-After') { $ra = [string]$resp.Headers[$k] } }
                $wait = if ($ra -match '^\d+$') { [double]$ra } else { [double][Math]::Min(60, [Math]::Pow(2, $attempt)) }
                & $Sleeper $wait
                $attempt++
                continue
            }
            break
        }
        $location = ''; foreach ($k in $resp.Headers.Keys) { if ($k -ieq 'Location') { $location = [string]$resp.Headers[$k] } }
        $results.Add([ordered]@{ batch = $index; status = $resp.Status; attempts = $attempt + 1; provisioning_logs = $location; batch_sha256 = (Get-HcmSha256 $batch) })
        if ($resp.Status -ne 202) { break }
        & $Sleeper ([double]$Settings.min_seconds_between_calls)
    }
    # The comma keeps a one-element result an array for the caller.
    return , $results.ToArray()
}

Export-ModuleMember -Function Get-HcmMapping, Get-HcmSettings, Test-HcmSettings, Test-HcmEndpoint, ConvertTo-HcmCanonicalJson,
    Get-HcmSha256, Get-HcmFileSha256, Get-HcmProvenance, ConvertTo-HcmUtcIso, ConvertTo-HcmScimOperation, Convert-HcmExtract, Get-HcmReport,
    Get-HcmQuarantineEntry, Invoke-HcmBulkUpload
