# Runs Microsoft's Sentinel analytics rule "New access credential added to Application or Service
# Principal", which Learn's security operations guide for applications links for added credentials,
# offline and unmodified (examples/third_party/sentinel-app-credential-rule, Chapter 10).
#
# The query is read from the pinned YAML at test time and split into its pipeline stages. Each stage
# is recognized by its exact text (whitespace collapsed, trailing // comments dropped) and evaluated
# by the matching implementation below over rows shaped like Log Analytics' AuditLogs table. A stage
# the harness doesn't recognize throws, so a new upstream query fails the tests instead of being
# half-run. It is not a KQL engine, and nothing is sent to a workspace.

$script:SentinelRule = Join-Path $PSScriptRoot '../../third_party/sentinel-app-credential-rule/NewAppOrServicePrincipalCredential.yaml'

function Get-SentinelRuleField {
    <# A top-level scalar from the pinned rule, such as queryFrequency. #>
    param([Parameter(Mandatory)][string]$Name)
    $line = @([IO.File]::ReadAllLines((Resolve-Path -LiteralPath $script:SentinelRule).Path) | Where-Object { $_ -match "^$([regex]::Escape($Name)):\s*(.*)$" })
    if ($line.Count -ne 1) { throw "Expected one '$Name' in the pinned rule, found $($line.Count)" }
    ($line[0] -replace "^$([regex]::Escape($Name)):\s*", '').Trim()
}

function Get-SentinelRuleQuery {
    <# The rule's KQL: the block under "query: |", unindented. #>
    $lines = [IO.File]::ReadAllLines((Resolve-Path -LiteralPath $script:SentinelRule).Path)
    $start = [Array]::IndexOf($lines, 'query: |')
    if ($start -lt 0) { throw "No 'query: |' block in the pinned rule" }
    $out = [Collections.Generic.List[string]]::new()
    for ($i = $start + 1; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^\S') { break }
        $out.Add(($lines[$i] -replace '^  ', ''))
    }
    ($out -join "`n").TrimEnd()
}

function Get-SentinelRuleStage {
    <# The query's pipeline stages, in order, each as one line with whitespace collapsed and comments dropped. #>
    param([string]$Query = (Get-SentinelRuleQuery))
    $stages = [Collections.Generic.List[string]]::new()
    $depth = 0   # a "|" inside an mv-apply's parentheses belongs to its subquery, not a new stage
    foreach ($raw in ($Query -split "`n")) {
        $l = $raw.Trim()
        if (-not $l -or $l.StartsWith('//')) { continue }
        $c = $l.IndexOf(' //'); if ($c -ge 0) { $l = $l.Substring(0, $c).TrimEnd() }
        if (($l.StartsWith('|') -and $depth -eq 0) -or $stages.Count -eq 0) { $stages.Add($l) } else { $stages[$stages.Count - 1] += " $l" }
        $depth += ([regex]::Matches($l, '\(').Count - [regex]::Matches($l, '\)').Count)
    }
    , @($stages | ForEach-Object { ($_ -replace '\s+', ' ').Replace('( ', '(').Replace(' )', ')') })
}

function ConvertTo-AuditLogsRow {
    <# A Graph directoryAudit item as a row of Log Analytics' AuditLogs table (the columns the rule reads). #>
    param([Parameter(Mandatory)]$Item, [string]$TenantId = 'c0ffee00-0000-4000-8000-000000000001')
    @{
        TimeGenerated     = [string]$Item.activityDateTime
        OperationName     = [string]$Item.activityDisplayName
        Result            = [string]$Item.result
        InitiatedBy       = $Item.initiatedBy
        TargetResources   = @($Item.targetResources)
        AdditionalDetails = @($Item.additionalDetails)
        CorrelationId     = [string]$Item.correlationId
        TenantId          = $TenantId
    }
}

function Get-KqlPath {
    # A dotted path into a row, KQL style: a missing member is null, never an error.
    param($Object, [string]$Path)
    $o = $Object
    foreach ($p in $Path.Split('.')) {
        if ($null -eq $o) { return $null }
        if ($o -is [System.Collections.IDictionary]) { $o = if ($o.Contains($p)) { $o[$p] } else { $null } } else { return $null }
    }
    $o
}

function Test-KqlHas {
    # has: a whole-term match, ignoring case. A term of punctuation only, such as "@", matches anywhere.
    param([string]$Text, [string]$Term)
    if (-not $Text) { return $false }
    if ($Term -notmatch '[A-Za-z0-9]') { return $Text.Contains($Term) }
    $Text -match "(?i)(?<![A-Za-z0-9])$([regex]::Escape($Term))(?![A-Za-z0-9])"
}

function ConvertTo-KqlString {
    # tostring() of a dynamic value: arrays and bags as compact JSON, null as empty.
    param($Value)
    if ($null -eq $Value) { return '' }
    if ($Value -is [string]) { return $Value }
    ConvertTo-Json -InputObject $Value -Compress -Depth 10
}

function ConvertFrom-KqlJson {
    # parse_json(): a string that isn't JSON stays a string.
    param([string]$Text)
    if (-not $Text) { return $null }
    try { , (ConvertFrom-Json -InputObject $Text -NoEnumerate -AsHashtable) } catch { $Text }
}

function Invoke-KqlMvApply {
    # mv-apply X = <array column> on (<subquery>): one output row per element the subquery keeps.
    param([object[]]$Rows, [string]$Alias, [string]$Column, [scriptblock]$Sub)
    @(foreach ($r in $Rows) {
            foreach ($el in @($r[$Column])) {
                if ($null -eq $el) { continue }
                $x = @{} + $r; $x[$Alias] = $el
                $kept = & $Sub $x
                if ($kept) { $x.Remove($Alias); $kept }
            }
        })
}

$script:KqlStage = [ordered]@{
    'AuditLogs' = { param($rows) $rows }
    '| where OperationName has_any ("Add service principal", "Certificates and secrets management")' = {
        param($rows) @($rows | Where-Object { (Test-KqlHas $_.OperationName 'Add service principal') -or (Test-KqlHas $_.OperationName 'Certificates and secrets management') })
    }
    '| where Result =~ "success"' = { param($rows) @($rows | Where-Object { $_.Result -ieq 'success' }) }
    '| where tostring(InitiatedBy.user.userPrincipalName) has "@" or tostring(InitiatedBy.app.displayName) has "@"' = {
        param($rows) @($rows | Where-Object { (Test-KqlHas (ConvertTo-KqlString (Get-KqlPath $_ 'InitiatedBy.user.userPrincipalName')) '@') -or (Test-KqlHas (ConvertTo-KqlString (Get-KqlPath $_ 'InitiatedBy.app.displayName')) '@') })
    }
    '| mv-apply TargetResource = TargetResources on (where TargetResource.type =~ "Application" | extend targetDisplayName = tostring(TargetResource.displayName), targetId = tostring(TargetResource.id), targetType = tostring(TargetResource.type), keyEvents = TargetResource.modifiedProperties)' = {
        param($rows) Invoke-KqlMvApply $rows 'TargetResource' 'TargetResources' {
            param($x)
            $t = $x.TargetResource
            if ((ConvertTo-KqlString (Get-KqlPath $t 'type')) -ine 'Application') { return }
            $x.targetDisplayName = ConvertTo-KqlString (Get-KqlPath $t 'displayName'); $x.targetId = ConvertTo-KqlString (Get-KqlPath $t 'id')
            $x.targetType = ConvertTo-KqlString (Get-KqlPath $t 'type'); $x.keyEvents = @(Get-KqlPath $t 'modifiedProperties')
            $x
        }
    }
    '| mv-apply Property = keyEvents on (where Property.displayName =~ "KeyDescription" | extend new_value_set = parse_json(tostring(Property.newValue)), old_value_set = parse_json(tostring(Property.oldValue)))' = {
        param($rows) Invoke-KqlMvApply $rows 'Property' 'keyEvents' {
            param($x)
            if ((ConvertTo-KqlString (Get-KqlPath $x.Property 'displayName')) -ine 'KeyDescription') { return }
            $x.new_value_set = ConvertFrom-KqlJson (ConvertTo-KqlString (Get-KqlPath $x.Property 'newValue'))
            $x.old_value_set = ConvertFrom-KqlJson (ConvertTo-KqlString (Get-KqlPath $x.Property 'oldValue'))
            $x
        }
    }
    '| where old_value_set != "[]"' = { param($rows) @($rows | Where-Object { (ConvertTo-KqlString $_.old_value_set) -ne '[]' }) }
    '| extend diff = set_difference(new_value_set, old_value_set)' = {
        param($rows) foreach ($r in $rows) { $old = @($r.old_value_set); $r.diff = , @(@($r.new_value_set) | Where-Object { $_ -notin $old } | Select-Object -Unique) }; @($rows)
    }
    '| where isnotempty(diff)' = { param($rows) @($rows | Where-Object { @($_.diff).Count -gt 0 }) }
    '| parse diff with * "KeyIdentifier=" keyIdentifier:string ",KeyType=" keyType:string ",KeyUsage=" keyUsage:string ",DisplayName=" keyDisplayName:string "]" *' = {
        param($rows)
        foreach ($r in $rows) {
            $m = [regex]::Match((ConvertTo-KqlString $r.diff), 'KeyIdentifier=(.*?),KeyType=(.*?),KeyUsage=(.*?),DisplayName=(.*?)\]')
            $r.keyIdentifier = if ($m.Success) { $m.Groups[1].Value } else { '' }; $r.keyType = if ($m.Success) { $m.Groups[2].Value } else { '' }
            $r.keyUsage = if ($m.Success) { $m.Groups[3].Value } else { '' }; $r.keyDisplayName = if ($m.Success) { $m.Groups[4].Value } else { '' }
        }
        @($rows)
    }
    '| where keyUsage =~ "Verify"' = { param($rows) @($rows | Where-Object { $_.keyUsage -ieq 'Verify' }) }
    '| mv-apply AdditionalDetail = AdditionalDetails on (where AdditionalDetail.key =~ "User-Agent" | extend UserAgent = tostring(AdditionalDetail.value))' = {
        param($rows) Invoke-KqlMvApply $rows 'AdditionalDetail' 'AdditionalDetails' {
            param($x)
            if ((ConvertTo-KqlString (Get-KqlPath $x.AdditionalDetail 'key')) -ine 'User-Agent') { return }
            $x.UserAgent = ConvertTo-KqlString (Get-KqlPath $x.AdditionalDetail 'value'); $x
        }
    }
    '| extend InitiatingAppName = tostring(InitiatedBy.app.displayName)' = { param($rows) foreach ($r in $rows) { $r.InitiatingAppName = ConvertTo-KqlString (Get-KqlPath $r 'InitiatedBy.app.displayName') }; @($rows) }
    '| extend InitiatingAppServicePrincipalId = tostring(InitiatedBy.app.servicePrincipalId)' = { param($rows) foreach ($r in $rows) { $r.InitiatingAppServicePrincipalId = ConvertTo-KqlString (Get-KqlPath $r 'InitiatedBy.app.servicePrincipalId') }; @($rows) }
    '| extend InitiatingUserPrincipalName = tostring(InitiatedBy.user.userPrincipalName)' = { param($rows) foreach ($r in $rows) { $r.InitiatingUserPrincipalName = ConvertTo-KqlString (Get-KqlPath $r 'InitiatedBy.user.userPrincipalName') }; @($rows) }
    '| extend InitiatingAadUserId = tostring(InitiatedBy.user.id)' = { param($rows) foreach ($r in $rows) { $r.InitiatingAadUserId = ConvertTo-KqlString (Get-KqlPath $r 'InitiatedBy.user.id') }; @($rows) }
    '| extend InitiatingIpAddress = tostring(iff(isnotempty(InitiatedBy.user.ipAddress), InitiatedBy.user.ipAddress, InitiatedBy.app.ipAddress))' = {
        param($rows) foreach ($r in $rows) { $u = Get-KqlPath $r 'InitiatedBy.user.ipAddress'; $r.InitiatingIpAddress = ConvertTo-KqlString $(if ($u) { $u } else { Get-KqlPath $r 'InitiatedBy.app.ipAddress' }) }; @($rows)
    }
    '| project-away diff, new_value_set, old_value_set' = { param($rows) foreach ($r in $rows) { foreach ($k in 'diff', 'new_value_set', 'old_value_set') { $r.Remove($k) } }; @($rows) }
    '| project-reorder TimeGenerated, OperationName, InitiatingAppName, InitiatingAppServicePrincipalId, InitiatingUserPrincipalName, InitiatingAadUserId, InitiatingIpAddress, UserAgent, targetDisplayName, targetId, targetType, keyDisplayName, keyType, keyUsage, keyIdentifier, CorrelationId, TenantId' = { param($rows) @($rows) }
    "| extend Name = tostring(split(InitiatingUserPrincipalName,'@',0)[0]), UPNSuffix = tostring(split(InitiatingUserPrincipalName,'@',1)[0])" = {
        param($rows) foreach ($r in $rows) { $p = "$($r.InitiatingUserPrincipalName)".Split('@'); $r.Name = $p[0]; $r.UPNSuffix = if ($p.Count -gt 1) { $p[1] } else { '' } }; @($rows)
    }
}

function Invoke-SentinelRule {
    <#
    .SYNOPSIS
        Run the pinned rule's query, stage by stage, over AuditLogs rows. Returns @{ Output; Stages }.
        Throws on a stage the harness doesn't recognize.
    #>
    param([Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Rows, [string]$Query = (Get-SentinelRuleQuery))
    $stages = Get-SentinelRuleStage -Query $Query
    $data = @($Rows | ForEach-Object { @{} + $_ })
    foreach ($s in $stages) {
        if (-not $script:KqlStage.Contains($s)) { throw "The harness doesn't recognize this stage of the pinned rule: $s" }
        $data = @(& $script:KqlStage[$s] $data)
    }
    [pscustomobject]@{ Output = $data; Stages = $stages }
}
