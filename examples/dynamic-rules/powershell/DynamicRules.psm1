#Requires -Version 7.1
<#
DynamicRules: dynamic membership rules as code. A rule library in Git (rules/*.json, one file per
group), a parser and an offline evaluator for the rule grammar Learn documents, a linter, a shadow
diff of a rule change against a fixture population, and a pause manifest that lets an incident
responder resume only what the incident paused.

The evaluator is for unit tests and reviews, not a replacement for the service: Lab 2 compares it
with Graph's own evaluateDynamicMembership (beta) for the same users. Nothing here signs in; the
pause and resume functions take the Graph call as a script block, so tests pass a fake tenant.
#>

Set-StrictMode -Version Latest

# Learn: the rule body can't exceed 3,072 characters.
$script:DrMaxRuleLength = 3072
# Learn: string and regex operations aren't case sensitive.
$script:DrCompare = [StringComparison]::OrdinalIgnoreCase
$script:DrComparisonOps = @('eq', 'ne', 'startswith', 'notstartswith', 'endswith', 'notendswith', 'contains', 'notcontains',
    'match', 'notmatch', 'in', 'notin', 'le', 'ge')
# Learn's national cloud Graph hosts. An unknown name is an error, never a default.
$script:DrGraphHosts = [ordered]@{
    Global   = 'https://graph.microsoft.com'
    USGov    = 'https://graph.microsoft.us'
    USGovDoD = 'https://dod-graph.microsoft.us'
}

function New-DrFinding {
    param(
        [Parameter(Mandatory)][ValidateSet('Finding', 'Warn', 'Info')][string]$Severity,
        [Parameter(Mandatory)][string]$Rule,
        [Parameter(Mandatory)][string]$Issue,
        [string]$Group = '',
        [string]$Detail = ''
    )
    [pscustomobject][ordered]@{ Severity = $Severity; Rule = $Rule; Group = $Group; Issue = $Issue; Detail = $Detail }
}

#region Parser

function Get-DrTokens {
    <# Tokens: ( ) [ ] , strings, operators (-eq or eq), property paths, literals. #>
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Rule)
    $tokens = [Collections.Generic.List[object]]::new()
    $i = 0
    # Learn's examples also use the en dash (–eq); treat it as a hyphen.
    $s = $Rule -replace [char]0x2013, '-'
    while ($i -lt $s.Length) {
        $c = $s[$i]
        if ([char]::IsWhiteSpace($c)) { $i++; continue }
        if ($c -in '(', ')', '[', ']', ',') { $tokens.Add([pscustomobject]@{ Type = $c; Value = "$c" }); $i++; continue }
        if ($c -eq '"' -or $c -eq "'") {
            $q = $c; $sb = [Text.StringBuilder]::new(); $i++
            while ($i -lt $s.Length) {
                $d = $s[$i]
                if ($d -eq '`' -and $i + 1 -lt $s.Length) { [void]$sb.Append($s[$i + 1]); $i += 2; continue }
                if ($q -eq "'" -and $d -eq "'" -and $i + 1 -lt $s.Length -and $s[$i + 1] -eq "'") { [void]$sb.Append("'"); $i += 2; continue }
                if ($d -eq $q) { break }
                [void]$sb.Append($d); $i++
            }
            if ($i -ge $s.Length) { throw "Unterminated string in rule" }
            $i++
            $tokens.Add([pscustomobject]@{ Type = 'string'; Value = $sb.ToString() }); continue
        }
        $start = $i
        while ($i -lt $s.Length -and -not [char]::IsWhiteSpace($s[$i]) -and $s[$i] -notin '(', ')', '[', ']', ',', '"', "'") { $i++ }
        $word = $s.Substring($start, $i - $start)
        $bare = $word.TrimStart('-').ToLowerInvariant()
        if ($word -match '^-' -or $bare -in ($script:DrComparisonOps + @('and', 'or', 'not', 'any', 'all', 'plus', 'minus'))) {
            if ($bare -in $script:DrComparisonOps + @('and', 'or', 'not', 'any', 'all', 'plus', 'minus')) { $tokens.Add([pscustomobject]@{ Type = 'op'; Value = $bare }); continue }
            throw "Unknown operator '$word'"
        }
        $tokens.Add([pscustomobject]@{ Type = 'word'; Value = $word })
    }
    , $tokens.ToArray()
}

function ConvertFrom-DrRule {
    <#
    Parse a rule into a tree. Precedence follows Learn: comparisons, then -not, then -and, then -or.
    Nodes: @{ Kind = 'or'|'and'; Items }, @{ Kind = 'not'; Item }, @{ Kind = 'cmp'; Property; Op; Value },
    @{ Kind = 'any'|'all'; Property; Item } (Item compares '_' or an item property),
    @{ Kind = 'directReports'; ManagerId }.
    #>
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Rule)
    $dr = [regex]::Match($Rule.Trim(), '^(?i)Direct\s+Reports\s+for\s+"([0-9a-fA-F-]{36})"$')
    if ($dr.Success) { return @{ Kind = 'directReports'; ManagerId = $dr.Groups[1].Value } }
    $t = Get-DrTokens -Rule $Rule
    if ($t.Count -eq 0) { throw 'Empty rule' }
    $state = @{ T = $t; P = 0 }
    $peek = { if ($state.P -lt $state.T.Count) { $state.T[$state.P] } else { $null } }
    $next = { $tok = & $peek; if ($null -eq $tok) { throw 'Unexpected end of rule' }; $state.P++; $tok }

    $parseValue = $null; $parseOr = $null
    $parseValue = {
        $tok = & $next
        switch ($tok.Type) {
            'string' { return $tok.Value }
            '[' {
                $items = [Collections.Generic.List[object]]::new()
                while ((& $peek).Type -ne ']') {
                    $items.Add((& $parseValue))
                    if ((& $peek).Type -eq ',') { [void](& $next) }
                }
                [void](& $next)
                return , $items.ToArray()
            }
            'word' {
                switch -regex ($tok.Value) {
                    '^(?i)true$' { return $true }
                    '^(?i)false$' { return $false }
                    '^(?i)\$?null$' { return [DBNull]::Value }
                    '^(?i)system\.now$' {
                        # Learn: employeeHireDate compares with system.now, optionally -plus or -minus a duration.
                        $nx = & $peek
                        if ($nx -and $nx.Type -eq 'op' -and $nx.Value -in 'plus', 'minus') { [void](& $next); return "system.now -$($nx.Value) $((& $next).Value)" }
                        return 'system.now'
                    }
                    '^-?\d+(\.\d+)?$' { return $tok.Value }
                    default { return $tok.Value }
                }
            }
            default { throw "Unexpected '$($tok.Value)' where a value belongs" }
        }
    }
    $parsePrimary = {
        $tok = & $peek
        if ($null -eq $tok) { throw 'Unexpected end of rule' }
        if ($tok.Type -eq '(') {
            [void](& $next); $inner = & $parseOr
            if ((& $next).Type -ne ')') { throw 'Missing )' }
            return $inner
        }
        if ($tok.Type -eq 'op' -and $tok.Value -eq 'not') {
            [void](& $next); return @{ Kind = 'not'; Item = (& $parsePrimary) }
        }
        if ($tok.Type -ne 'word') { throw "Unexpected '$($tok.Value)'" }
        $prop = (& $next).Value
        $op = & $next
        if ($op.Type -ne 'op') { throw "Expected an operator after $prop" }
        if ($op.Value -in 'any', 'all') {
            if ((& $peek).Type -eq '(') { [void](& $next); $item = & $parseOr; if ((& $next).Type -ne ')') { throw 'Missing )' } }
            else { $item = & $parsePrimary }
            return @{ Kind = $op.Value; Property = $prop; Item = $item }
        }
        if ($op.Value -notin $script:DrComparisonOps) { throw "Expected a comparison after $prop, found -$($op.Value)" }
        $value = & $parseValue
        @{ Kind = 'cmp'; Property = $prop; Op = $op.Value; Value = $value }
    }
    $parseAnd = {
        $items = [Collections.Generic.List[object]]::new(); $items.Add((& $parsePrimary))
        while ((& $peek) -and (& $peek).Type -eq 'op' -and (& $peek).Value -eq 'and') { [void](& $next); $items.Add((& $parsePrimary)) }
        if ($items.Count -eq 1) { return $items[0] }
        @{ Kind = 'and'; Items = $items.ToArray() }
    }
    $parseOr = {
        $items = [Collections.Generic.List[object]]::new(); $items.Add((& $parseAnd))
        while ((& $peek) -and (& $peek).Type -eq 'op' -and (& $peek).Value -eq 'or') { [void](& $next); $items.Add((& $parseAnd)) }
        if ($items.Count -eq 1) { return $items[0] }
        @{ Kind = 'or'; Items = $items.ToArray() }
    }
    $tree = & $parseOr
    if ($state.P -lt $state.T.Count) { throw "Unexpected '$($state.T[$state.P].Value)' after the end of the rule" }
    $tree
}

function Get-DrRuleNodes {
    <# Every node in a tree, depth first. #>
    param([Parameter(Mandatory)]$Tree)
    $Tree
    switch ($Tree.Kind) {
        { $_ -in 'and', 'or' } { foreach ($i in $Tree.Items) { Get-DrRuleNodes $i } }
        { $_ -in 'not', 'any', 'all' } { Get-DrRuleNodes $Tree.Item }
    }
}

function Get-DrRuleObjectType {
    <# 'user', 'device', 'mixed' or 'none', from the property prefixes the rule reads. #>
    param([Parameter(Mandatory)]$Tree)
    if ($Tree.Kind -eq 'directReports') { return 'user' }
    $prefixes = @(Get-DrRuleNodes $Tree | Where-Object { $_.Kind -in 'cmp', 'any', 'all' -and $_.Property -match '^(?i)(user|device)\.' } |
            ForEach-Object { ($_.Property -split '\.')[0].ToLowerInvariant() } | Sort-Object -Unique)
    if ($prefixes.Count -eq 0) { 'none' } elseif ($prefixes.Count -gt 1) { 'mixed' } else { $prefixes[0] }
}

#endregion

#region Evaluator

function Get-DrPropertyValue {
    param($Object, [string]$Property)
    $name = ($Property -split '\.', 2)[-1]
    if ($Object -is [System.Collections.IDictionary]) {
        foreach ($k in $Object.Keys) { if ("$k" -ieq $name) { return $Object[$k] } }
        return $null
    }
    $p = $Object.PSObject.Properties | Where-Object { $_.Name -ieq $name } | Select-Object -First 1
    if ($p) { $p.Value } else { $null }
}

function Test-DrCompare {
    param($Actual, [string]$Op, $Expected)
    $isNull = { param($v) $null -eq $v -or $v -is [DBNull] -or ("$v" -eq '' -and $v -isnot [bool]) }
    if ($Expected -is [DBNull]) {
        switch ($Op) { 'eq' { return (& $isNull $Actual) } 'ne' { return -not (& $isNull $Actual) } default { throw "Only -eq and -ne can compare with null" } }
    }
    if ($Expected -is [bool]) {
        $a = if ($Actual -is [bool]) { $Actual } elseif ("$Actual" -match '^(?i)true$') { $true } elseif ("$Actual" -match '^(?i)false$') { $false } else { $null }
        switch ($Op) { 'eq' { return $a -eq $Expected } 'ne' { return $a -ne $Expected } default { throw "-$Op can't compare a Boolean" } }
    }
    $a = if (& $isNull $Actual) { '' } else { "$Actual" }
    switch ($Op) {
        'eq' { return [string]::Equals($a, "$Expected", $script:DrCompare) }
        'ne' { return -not [string]::Equals($a, "$Expected", $script:DrCompare) }
        'startswith' { return $a.StartsWith("$Expected", $script:DrCompare) }
        'notstartswith' { return -not $a.StartsWith("$Expected", $script:DrCompare) }
        'endswith' { return $a.EndsWith("$Expected", $script:DrCompare) }
        'notendswith' { return -not $a.EndsWith("$Expected", $script:DrCompare) }
        'contains' { return $a.IndexOf("$Expected", $script:DrCompare) -ge 0 }
        'notcontains' { return $a.IndexOf("$Expected", $script:DrCompare) -lt 0 }
        'match' { return [regex]::IsMatch($a, "$Expected", 'IgnoreCase') }
        'notmatch' { return -not [regex]::IsMatch($a, "$Expected", 'IgnoreCase') }
        'in' { return [bool](@($Expected) | Where-Object { [string]::Equals($a, "$_", $script:DrCompare) }) }
        'notin' { return -not [bool](@($Expected) | Where-Object { [string]::Equals($a, "$_", $script:DrCompare) }) }
        default { throw "-$Op isn't supported by the offline evaluator" }
    }
}

function Test-DrNode {
    param($Node, $Object, $Population)
    switch ($Node.Kind) {
        'or' { foreach ($i in $Node.Items) { if (Test-DrNode $i $Object $Population) { return $true } }; return $false }
        'and' { foreach ($i in $Node.Items) { if (-not (Test-DrNode $i $Object $Population)) { return $false } }; return $true }
        'not' { return -not (Test-DrNode $Node.Item $Object $Population) }
        'cmp' {
            if ($Node.Property -match '(?i)\.memberof$') { throw 'memberOf (preview) is not evaluated offline' }
            return Test-DrCompare -Actual (Get-DrPropertyValue $Object $Node.Property) -Op $Node.Op -Expected $Node.Value
        }
        { $_ -in 'any', 'all' } {
            if ($Node.Property -match '(?i)\.memberof$') { throw 'memberOf (preview) is not evaluated offline' }
            $items = @(Get-DrPropertyValue $Object $Node.Property | Where-Object { $null -ne $_ })
            $hits = foreach ($it in $items) {
                $wrapped = if ($it -is [string]) { @{ '_' = $it } } else { $it }
                $inner = $Node.Item
                if ($inner.Kind -eq 'cmp' -and $inner.Property -eq '_') { Test-DrCompare -Actual $it -Op $inner.Op -Expected $inner.Value }
                else { Test-DrNode $inner $wrapped $Population }
            }
            if ($Node.Kind -eq 'any') { return [bool](@($hits) -contains $true) }
            return ($items.Count -gt 0 -and -not (@($hits) -contains $false))
        }
        'directReports' {
            # Learn: the manager is also added to the group.
            $id = "$(Get-DrPropertyValue $Object 'objectId')"
            return ($id -ieq $Node.ManagerId) -or ("$(Get-DrPropertyValue $Object 'managerId')" -ieq $Node.ManagerId)
        }
    }
}

function Test-DrMember {
    <# Whether one fixture object satisfies a rule, by the offline evaluator. #>
    param([Parameter(Mandatory)][string]$Rule, [Parameter(Mandatory)]$Object)
    $tree = ConvertFrom-DrRule -Rule $Rule
    $type = Get-DrRuleObjectType $tree
    $objType = "$(Get-DrPropertyValue $Object 'objectType')"
    if ($objType -and $type -in 'user', 'device' -and $objType -ine $type) { return $false }
    [bool](Test-DrNode $tree $Object $null)
}

function Get-DrMembers {
    <# The keys of every population object a rule selects. #>
    param([Parameter(Mandatory)][string]$Rule, [Parameter(Mandatory)][object[]]$Population)
    @($Population | Where-Object { Test-DrMember -Rule $Rule -Object $_ } | ForEach-Object { "$(Get-DrPropertyValue $_ 'key')" })
}

#endregion

#region Library and linter

function Get-DrLibrary {
    <# Every rules/*.json file, with its file name. Required: displayName, kind, membershipRule, owner. #>
    param([Parameter(Mandatory)][string]$Path)
    foreach ($f in Get-ChildItem -LiteralPath $Path -Filter '*.json' | Sort-Object Name) {
        $r = Get-Content -LiteralPath $f.FullName -Raw | ConvertFrom-Json -AsHashtable
        foreach ($k in 'displayName', 'kind', 'membershipRule', 'owner') {
            if (-not $r.ContainsKey($k) -or [string]::IsNullOrWhiteSpace("$($r[$k])")) { throw "$($f.Name): missing $k" }
        }
        if ($r.kind -notin 'user', 'device') { throw "$($f.Name): kind must be user or device" }
        $r['file'] = $f.Name
        $r
    }
}

function Get-DrTopLevelTerms {
    <# The terms ANDed at the top of a rule: a guard only protects the rule if it sits here. #>
    param($Tree)
    if ($Tree.Kind -eq 'and') { @($Tree.Items) } else { , $Tree }
}

function Test-DrRule {
    <#
    Lint one rule. Rules:
      DR-01 Finding  the rule doesn't parse (or is empty)
      DR-02 Finding  longer than Learn's 3,072 characters
      DR-03 Finding  a user rule without (user.accountEnabled -eq true) ANDed at the top
      DR-04 Finding  a user rule without (user.userType -eq "Member") ANDed at the top
      DR-05 Finding  reads a display-name attribute (department, jobTitle, companyName), as VK-DG-02
      DR-06 Finding  memberOf (preview; ends November 3, 2026; public cloud only)
      DR-07 Warn     -match, -notMatch, -contains or -notContains (Learn: slower processing)
      DR-08 Warn     three or more -or tests of one property (Learn: use -in)
      DR-09 Finding  reads user and device properties together, or a kind that disagrees with the file
      DR-10 Info     -ne or -notIn on a coded slot admits users whose slot is empty
    #>
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Rule, [string]$Kind = '', [string]$Group = '')
    if ($Rule.Length -gt $script:DrMaxRuleLength) {
        New-DrFinding -Severity Finding -Rule 'DR-02' -Group $Group -Issue "Rule is $($Rule.Length) characters; Learn's limit is 3,072"
    }
    try { $tree = ConvertFrom-DrRule -Rule $Rule }
    catch { return New-DrFinding -Severity Finding -Rule 'DR-01' -Group $Group -Issue "Rule doesn't parse: $($_.Exception.Message)" }
    if ($tree.Kind -eq 'directReports') {
        return New-DrFinding -Severity Info -Rule 'DR-03' -Group $Group -Issue 'Direct reports rule: Learn says it cannot be combined with other rules, so it carries no guards; the group must not grant access on its own'
    }
    $type = Get-DrRuleObjectType $tree
    if ($type -eq 'mixed' -or ($Kind -and $type -in 'user', 'device' -and $type -ne $Kind)) {
        New-DrFinding -Severity Finding -Rule 'DR-09' -Group $Group -Issue "Rule reads $type properties; the library entry says $Kind"
    }
    $nodes = @(Get-DrRuleNodes $tree)
    if ($type -eq 'user') {
        $top = @(Get-DrTopLevelTerms $tree)
        $hasTop = {
            param($prop, $value)
            [bool]($top | Where-Object { $_.Kind -eq 'cmp' -and $_.Property -ieq $prop -and $_.Op -eq 'eq' -and "$($_.Value)" -ieq "$value" })
        }
        if (-not (& $hasTop 'user.accountEnabled' 'True')) {
            New-DrFinding -Severity Finding -Rule 'DR-03' -Group $Group -Issue 'User rule without (user.accountEnabled -eq true) ANDed at the top'
        }
        if (-not (& $hasTop 'user.userType' 'Member')) {
            New-DrFinding -Severity Finding -Rule 'DR-04' -Group $Group -Issue 'User rule without (user.userType -eq "Member") ANDed at the top'
        }
    }
    $display = @($nodes | Where-Object { $_.Kind -eq 'cmp' -and $_.Property -match '^(?i)user\.(department|jobTitle|companyName)$' } | ForEach-Object { $_.Property } | Sort-Object -Unique)
    if ($display.Count) {
        New-DrFinding -Severity Finding -Rule 'DR-05' -Group $Group -Issue 'Rule reads a display-name attribute instead of a coded slot' -Detail ($display -join ', ')
    }
    if ($nodes | Where-Object { $_.Kind -in 'cmp', 'any', 'all' -and $_.Property -match '(?i)\.memberof$' }) {
        New-DrFinding -Severity Finding -Rule 'DR-06' -Group $Group -Issue 'memberOf is a preview that ends November 3, 2026, and is available only in the public cloud'
    }
    $slow = @($nodes | Where-Object { $_.Kind -eq 'cmp' -and $_.Op -in 'match', 'notmatch', 'contains', 'notcontains' } | ForEach-Object { "-$($_.Op)" } | Sort-Object -Unique)
    if ($slow.Count) {
        New-DrFinding -Severity Warn -Rule 'DR-07' -Group $Group -Issue 'Operator Learn advises minimizing for processing time' -Detail ($slow -join ', ')
    }
    foreach ($or in @($nodes | Where-Object { $_.Kind -eq 'or' })) {
        $eqs = @($or.Items | Where-Object { $_.Kind -eq 'cmp' -and $_.Op -eq 'eq' } | Group-Object { $_.Property.ToLowerInvariant() } | Where-Object Count -GE 3)
        foreach ($g in $eqs) { New-DrFinding -Severity Warn -Rule 'DR-08' -Group $Group -Issue "$($g.Count) -or tests of $($g.Name); Learn suggests one -in" }
    }
    foreach ($n in @($nodes | Where-Object { $_.Kind -eq 'cmp' -and $_.Op -in 'ne', 'notin' -and $_.Value -isnot [DBNull] -and $_.Property -match '(?i)extension' })) {
        $hasNullGuard = [bool]($nodes | Where-Object { $_.Kind -eq 'cmp' -and $_.Property -ieq $n.Property -and $_.Op -eq 'ne' -and $_.Value -is [DBNull] })
        if (-not $hasNullGuard) {
            New-DrFinding -Severity Info -Rule 'DR-10' -Group $Group -Issue "$($n.Property) -$($n.Op) also admits users whose slot is empty; add ($($n.Property) -ne null) if an empty slot must not qualify"
        }
    }
}

function Invoke-DrLibraryTest {
    <#
    Lint every rule in the library and run its tests against the population: each test names a
    population key and the expected membership. Returns finding rows; DR-11 is a failed test.
    #>
    param([Parameter(Mandatory)][object[]]$Library, [Parameter(Mandatory)][object[]]$Population)
    $byKey = @{}; foreach ($p in $Population) { $byKey["$(Get-DrPropertyValue $p 'key')"] = $p }
    foreach ($r in $Library) {
        Test-DrRule -Rule $r.membershipRule -Kind $r.kind -Group $r.displayName
        foreach ($t in @($r['tests'])) {
            if ($null -eq $t) { continue }
            $obj = $byKey["$($t.member)"]
            if (-not $obj) { New-DrFinding -Severity Finding -Rule 'DR-11' -Group $r.displayName -Issue "Test names $($t.member), which isn't in the population"; continue }
            try { $got = Test-DrMember -Rule $r.membershipRule -Object $obj } catch { $got = "error: $($_.Exception.Message)" }
            if ($got -isnot [bool] -or $got -ne [bool]$t.expected) {
                New-DrFinding -Severity Finding -Rule 'DR-11' -Group $r.displayName -Issue "Expected $($t.member) to be $(if ($t.expected) { 'a member' } else { 'outside' }); the evaluator says $got"
            }
        }
    }
}

function Compare-DrRule {
    <#
    Shadow diff offline: who a proposed rule adds and removes compared with the current rule, over
    the fixture population. VK-DG-04 does the same against live groups.
    #>
    param([Parameter(Mandatory)][string]$Current, [Parameter(Mandatory)][string]$Proposed, [Parameter(Mandatory)][object[]]$Population)
    $cur = @(Get-DrMembers -Rule $Current -Population $Population)
    $new = @(Get-DrMembers -Rule $Proposed -Population $Population)
    [pscustomobject][ordered]@{
        CurrentCount  = $cur.Count
        ProposedCount = $new.Count
        Adds          = @($new | Where-Object { $cur -notcontains $_ } | Sort-Object)
        Removes       = @($cur | Where-Object { $new -notcontains $_ } | Sort-Object)
    }
}

#endregion

#region Pause and resume

function Get-DrGraphEndpoint {
    <# Learn's Graph host for a cloud. An unknown name throws; there is no silent default. #>
    param([Parameter(Mandatory)][string]$Cloud)
    $k = $script:DrGraphHosts.Keys | Where-Object { $_ -ieq $Cloud.Trim() }
    if (-not $k) { throw "Unknown cloud '$Cloud'. Use one of: $($script:DrGraphHosts.Keys -join ', ')" }
    $script:DrGraphHosts[$k]
}

function Get-DrDynamicCollections {
    <# Every dynamic group and dynamic administrative unit, with its processing state, through $Invoke. #>
    param([Parameter(Mandatory)][scriptblock]$Invoke, [Parameter(Mandatory)][string]$Endpoint)
    $sources = @(
        @{ Kind = 'group'; Uri = "$Endpoint/v1.0/groups?`$filter=" + [uri]::EscapeDataString("groupTypes/any(c:c eq 'DynamicMembership')") + "&`$count=true&`$select=id,displayName,membershipRuleProcessingState" }
        @{ Kind = 'au'; Uri = "$Endpoint/v1.0/directory/administrativeUnits?`$filter=" + [uri]::EscapeDataString("membershipType eq 'Dynamic'") + "&`$count=true&`$select=id,displayName,membershipRuleProcessingState" }
    )
    foreach ($s in $sources) {
        $uri = $s.Uri
        while ($uri) {
            $page = & $Invoke 'GET' $uri $null @{ ConsistencyLevel = 'eventual' }
            foreach ($v in @($page.value)) {
                [pscustomobject][ordered]@{ kind = $s.Kind; id = "$($v.id)"; displayName = "$($v.displayName)"; state_before = "$($v.membershipRuleProcessingState)" }
            }
            $uri = if ($page -is [System.Collections.IDictionary]) { $page['@odata.nextLink'] } else { $page.PSObject.Properties['@odata.nextLink'].Value }
        }
    }
}

function New-DrPauseManifest {
    <#
    Record every dynamic collection's processing state before anything is paused. The manifest is
    what makes a safe resume possible: Learn's resume samples act on whatever is paused.
    #>
    param(
        [Parameter(Mandatory)][scriptblock]$Invoke,
        [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][string]$Reason,
        [string]$TakenAt = [datetime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
    )
    $endpoint = Get-DrGraphEndpoint -Cloud $Cloud
    [ordered]@{
        schema      = 'fmp-dynamic-pause/1'
        taken_at    = $TakenAt
        cloud       = $Cloud
        endpoint    = $endpoint
        reason      = $Reason
        paused_at   = $null
        collections = @(Get-DrDynamicCollections -Invoke $Invoke -Endpoint $endpoint)
        paused      = @()
        resumed     = @()
    }
}

function Set-DrState {
    param([scriptblock]$Invoke, [string]$Endpoint, $Collection, [string]$State)
    $path = if ($Collection.kind -eq 'au') { 'directory/administrativeUnits' } else { 'groups' }
    & $Invoke 'PATCH' "$Endpoint/v1.0/$path/$($Collection.id)" (@{ membershipRuleProcessingState = $State } | ConvertTo-Json -Compress) @{}
}

function Invoke-DrPause {
    <#
    Pause the collections that were On when the manifest was taken, except those listed in -Except.
    Without -Apply it only reports what it would pause. Each pause is recorded in the manifest.
    #>
    param(
        [Parameter(Mandatory)][System.Collections.IDictionary]$Manifest,
        [Parameter(Mandatory)][scriptblock]$Invoke,
        [string[]]$Except = @(),
        [switch]$Apply,
        [string]$Now = [datetime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
    )
    $targets = @($Manifest.collections | Where-Object { $_.state_before -ceq 'On' -and $Except -notcontains $_.id })
    if (-not $Apply) { return $targets }
    $done = [Collections.Generic.List[object]]::new()
    foreach ($c in $targets) { Set-DrState -Invoke $Invoke -Endpoint $Manifest.endpoint -Collection $c -State 'Paused'; $done.Add($c.id) }
    $Manifest.paused = @($Manifest.paused) + $done.ToArray()
    $Manifest.paused_at = $Now
    $targets
}

function Invoke-DrResume {
    <#
    Resume only collections this manifest paused, never one that was already paused before.
    -Ids resumes named (critical) collections at any time. Otherwise the next -BatchSize collections
    are resumed, but not before -WaitHours after the pause: Learn's samples page says 12 hours, its
    processing guidance says 24; the default follows the stricter. Without -Apply it only reports.
    #>
    param(
        [Parameter(Mandatory)][System.Collections.IDictionary]$Manifest,
        [Parameter(Mandatory)][scriptblock]$Invoke,
        [string[]]$Ids,
        [int]$BatchSize = 100,
        [int]$WaitHours = 24,
        [switch]$Apply,
        [datetimeoffset]$Now = [datetimeoffset]::UtcNow
    )
    $pending = @($Manifest.paused | Where-Object { @($Manifest.resumed) -notcontains $_ })
    if ($Ids) {
        $notOurs = @($Ids | Where-Object { $pending -notcontains $_ })
        if ($notOurs.Count) { throw "Not paused by this manifest, or already resumed: $($notOurs -join ', ')" }
        $targets = @($Ids)
    } else {
        if (-not $Manifest.paused_at) { throw 'Nothing was paused under this manifest' }
        $ready = [datetimeoffset]::Parse($Manifest.paused_at, [Globalization.CultureInfo]::InvariantCulture).AddHours($WaitHours)
        if ($Now -lt $ready) { throw "Too early: noncritical collections resume after $($ready.ToString('yyyy-MM-ddTHH:mm:ssZ')) ($WaitHours hours after the pause)" }
        $targets = @($pending | Select-Object -First $BatchSize)
    }
    $byId = @{}; foreach ($c in $Manifest.collections) { $byId[$c.id] = $c }
    if (-not $Apply) { return @($targets | ForEach-Object { $byId[$_] }) }
    foreach ($id in $targets) { Set-DrState -Invoke $Invoke -Endpoint $Manifest.endpoint -Collection $byId[$id] -State 'On' }
    $Manifest.resumed = @($Manifest.resumed) + $targets
    @($targets | ForEach-Object { $byId[$_] })
}

#endregion

Export-ModuleMember -Function New-DrFinding, Get-DrTokens, ConvertFrom-DrRule, Get-DrRuleNodes, Get-DrRuleObjectType, Test-DrMember, Get-DrMembers,
    Get-DrLibrary, Test-DrRule, Invoke-DrLibraryTest, Compare-DrRule, Get-DrGraphEndpoint, Get-DrDynamicCollections, New-DrPauseManifest,
    Invoke-DrPause, Invoke-DrResume
