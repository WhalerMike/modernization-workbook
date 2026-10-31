<#
.SYNOPSIS
    Dynamic groups and administrative units (HR and Intune tracks): VK-DG-01 to VK-DG-07.
    Read-only, except VK-DG-03's read-only beta rule evaluation.
    Sources: Attribute-Driven Migration guide, "Dynamic group dangers and how to avoid them",
    Stages 4 and 5, and Limits; Book 03, Chapter 10; Book 02, Chapter 05.
#>

# Learn's List groups page names a write permission (Group-NestingSupport.ReadWrite.All) as the
# least privileged; the kit uses the read-only Group.Read.All, which returns membershipRule.
$script:VkGroupsUri = '/v1.0/groups?$filter=groupTypes/any(c:c eq ''DynamicMembership'')&$select=id,displayName,groupTypes,membershipRule,membershipRuleProcessingState,securityEnabled&$count=true&$top=999'

function Get-VkDynamicGroups {
    param($Context)
    @(Get-VkData -Context $Context -Name 'groups' -Uri $script:VkGroupsUri -Advanced |
            Where-Object { @(Get-VkValue $_ 'groupTypes' @()) -contains 'DynamicMembership' -and -not (Test-VkBlank (Get-VkValue $_ 'membershipRule')) })
}

function Test-VkUserRule { param([string]$Rule) $Rule -match '(?i)\buser\.' }
function Test-VkDeviceRule { param([string]$Rule) $Rule -match '(?i)\bdevice\.' }

function ConvertTo-VkRuleText {
    # A rule normalized for comparison: lower case, single spaces, no spaces inside parentheses.
    param([string]$Rule)
    $r = ("$Rule".ToLowerInvariant() -replace '\s+', ' ').Trim()
    ($r -replace '\(\s+', '(' -replace '\s+\)', ')')
}

function Invoke-VkDg01 {
    <#
    .SYNOPSIS
        Implements VK-DG-01: lists dynamic user groups whose rule lacks the user.accountEnabled -eq
        true or user.userType -eq "Member" guard. It proves disabled accounts and guests can't fall
        into rule-based access.
    .EXAMPLE
        # From the kit folder: against the fictional "fail" fixture tenant (no sign-in).
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkDg01 -Context $ctx
    .DESCRIPTION
    #>
    <# VK-DG-01. User rules without user.accountEnabled -eq true and user.userType -eq "Member". #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-DG-01' $Context {
        param($Context)
        $rows = foreach ($g in Get-VkDynamicGroups $Context) {
            $rule = "$($g.membershipRule)"
            if (-not (Test-VkUserRule $rule)) { continue }
            $missing = @()
            if ($rule -notmatch '(?i)user\.accountEnabled\s+-eq\s+true') { $missing += 'accountEnabled' }
            if ($rule -notmatch '(?i)user\.userType\s+-eq\s+"?Member"?') { $missing += 'userType' }
            if ($missing.Count -gt 0) {
                ConvertTo-VkFinding -Severity Finding -Object $g.displayName -ObjectId $g.id -Issue 'User rule lacks the guards every access rule needs' -Data ([ordered]@{ Missing = $missing; Rule = $rule })
            }
        }
        Get-VkOutcome -Rows @($rows)
    }
}

function Invoke-VkDg02 {
    <#
    .SYNOPSIS
        Implements VK-DG-02: lists dynamic group rules that read user.department, user.jobTitle or
        user.companyName instead of the coded slots.
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkDg02 -Context $ctx
    .DESCRIPTION
    #>
    <# VK-DG-02. Rules reading user.department, user.jobTitle or user.companyName. #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-DG-02' $Context {
        param($Context)
        $rows = foreach ($g in Get-VkDynamicGroups $Context) {
            $rule = "$($g.membershipRule)"
            $hits = @([regex]::Matches($rule, '(?i)\buser\.(department|jobTitle|companyName)\b') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
            if ($hits.Count -gt 0) {
                ConvertTo-VkFinding -Severity Finding -Object $g.displayName -ObjectId $g.id -Issue 'Rule reads a display-name attribute instead of a coded slot' -Data ([ordered]@{ Attributes = $hits; Rule = $rule })
            }
        }
        Get-VkOutcome -Rows @($rows)
    }
}

function Invoke-VkDg03 {
    <#
    .SYNOPSIS
        Implements VK-DG-03: evaluates each test in rule-tests.json with Microsoft Graph's beta
        evaluateDynamicMembership action and fails when a result differs from the expected
        membership. Proves a rule change before it is made; delegated sign-in only.
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkDg03 -Context $ctx
    .EXAMPLE
        # Live: a delegated sign-in (Groups Administrator), with rule-tests.json in D:\Inputs.
        Connect-VkGraph -Cloud gcc -Scopes (Get-VkRequiredScope -Checks (Get-VkCheckCatalog -CheckId VK-DG-03))
        Invoke-VkDg03 -Context (Get-VkRunContext -InputPath D:\Inputs)
    .DESCRIPTION
    #>
    <#
    VK-DG-03. Each test in rule-tests.json (Label, MemberId, GroupId or MembershipRule, Expected)
    is evaluated with Graph's beta evaluateDynamicMembership; a result that differs from
    Expected is a finding. Delegated sign-in only.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-DG-03' $Context {
        param($Context)
        $tests = Read-VkInputJson -Context $Context -Option 'RuleTestsFile'
        if ($null -eq $tests -or @($tests).Count -eq 0) { return Get-VkNotApplicable 'No rule tests (rule-tests.json) were supplied' }
        $rows = foreach ($t in @($tests)) {
            $r = Invoke-VkRuleValidation -Context $Context -MemberId $t.MemberId -GroupId (Get-VkValue $t 'GroupId' '') -MembershipRule (Get-VkValue $t 'MembershipRule' '') -Label $t.Label
            $got = Get-VkValue $r 'membershipRuleEvaluationResult'
            $want = [bool]$t.Expected
            $data = [ordered]@{ Expected = $want; Evaluated = $got; Target = (Get-VkValue $t 'GroupId' 'proposed rule') }
            if ($null -eq $got) {
                ConvertTo-VkFinding -Severity Finding -Object $t.Label -ObjectId $t.MemberId -Issue 'No evaluation result returned' -Data $data
            } elseif ([bool]$got -ne $want) {
                ConvertTo-VkFinding -Severity Finding -Object $t.Label -ObjectId $t.MemberId -Issue 'Rule evaluation differs from the expected membership' -Data $data
            } else {
                ConvertTo-VkFinding -Severity Info -Object $t.Label -ObjectId $t.MemberId -Issue 'As expected' -Data $data
            }
        }
        Get-VkOutcome -Rows @($rows) -Message 'Microsoft Graph beta: group evaluateDynamicMembership (read-only evaluation)'
    }
}

function Get-VkGroupMemberIds {
    param($Context, [string]$GroupId)
    # Permission: GroupMember.ReadBasic.All (least privileged for List group members).
    @(Get-VkData -Context $Context -Name 'groupMembers' -Key $GroupId -Uri "/v1.0/groups/$GroupId/members?`$select=id&`$top=999" | ForEach-Object {
            if ($_ -is [string]) { $_ } else { "$(Get-VkValue $_ 'id')" }
        })
}

function Invoke-VkDg04 {
    <#
    .SYNOPSIS
        Implements VK-DG-04: the shadow diff. For each pair in shadow-pairs.csv (CurrentGroupId,
        ProposedGroupId), lists the members the proposed group adds and removes; more differences
        than ShadowAllowedDifferences fail it.
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkDg04 -Context $ctx | Select-Object -ExpandProperty Details
    .DESCRIPTION
    #>
    <# VK-DG-04. For each pair in shadow-pairs.csv (CurrentGroupId, ProposedGroupId): who the proposed group adds and removes. #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-DG-04' $Context {
        param($Context)
        $pairs = Read-VkInputCsv -Context $Context -Option 'ShadowPairsFile'
        if ($null -eq $pairs -or $pairs.Count -eq 0) { return Get-VkNotApplicable 'No shadow pairs (shadow-pairs.csv) were supplied' }
        $allowed = [int]$Context.Options['ShadowAllowedDifferences']
        $rows = [System.Collections.Generic.List[object]]::new()
        foreach ($p in $pairs) {
            $cur = @(Get-VkGroupMemberIds $Context $p.CurrentGroupId)
            $new = @(Get-VkGroupMemberIds $Context $p.ProposedGroupId)
            $adds = @($new | Where-Object { $cur -notcontains $_ })
            $removes = @($cur | Where-Object { $new -notcontains $_ })
            $sev = 'Finding'
            if (($adds.Count + $removes.Count) -le $allowed) { $sev = 'Warn' }
            foreach ($a in $adds) { $rows.Add((ConvertTo-VkFinding -Severity $sev -Object $p.ProposedGroupId -ObjectId $a -Issue 'Added by the proposed group' -Data ([ordered]@{ Current = $p.CurrentGroupId }))) }
            foreach ($r in $removes) { $rows.Add((ConvertTo-VkFinding -Severity $sev -Object $p.ProposedGroupId -ObjectId $r -Issue 'Removed by the proposed group' -Data ([ordered]@{ Current = $p.CurrentGroupId }))) }
            $rows.Add((ConvertTo-VkFinding -Severity Info -Object $p.ProposedGroupId -Issue 'Shadow comparison' -Data ([ordered]@{ Current = $p.CurrentGroupId; CurrentMembers = $cur.Count; ProposedMembers = $new.Count; Adds = $adds.Count; Removes = $removes.Count })))
        }
        Get-VkOutcome -Rows $rows.ToArray() -Message ('Allowed differences per pair: {0}' -f $allowed)
    }
}

function Invoke-VkDg05 {
    <#
    .SYNOPSIS
        Implements VK-DG-05: compares each dynamic group's transitive member count with the last
        run's snapshot (membership-snapshot.json) and fails on a change over DeltaThresholdPercent
        and DeltaThresholdMinimum. The first run records the baseline.
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z' -Option @{ DeltaThresholdPercent = 10 }
        Invoke-VkDg05 -Context $ctx
    .DESCRIPTION
    #>
    <#
    VK-DG-05. Current transitive member count of every dynamic group against the snapshot from
    the last run (membership-snapshot.json). A change over DeltaThresholdPercent and at least
    DeltaThresholdMinimum members is a finding. The run writes this run's counts as the next
    snapshot (Snapshot\membership-snapshot.json).
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-DG-05' $Context {
        param($Context)
        $groups = Get-VkDynamicGroups $Context
        $current = [ordered]@{}
        foreach ($g in $groups) {
            $n = Get-VkData -Context $Context -Name 'groupMemberCounts' -Key $g.id -Count -Uri "/v1.0/groups/$($g.id)/transitiveMembers/`$count"
            $kind = 'user'
            if (Test-VkDeviceRule "$($g.membershipRule)") { $kind = 'device' }
            $current[$g.id] = [ordered]@{ displayName = $g.displayName; kind = $kind; count = $(if ($null -eq $n) { $null } else { [int]$n }) }
        }
        $snapshot = [ordered]@{ takenAtUtc = (Format-VkUtc $Context.AsOf); groups = $current }
        $previous = Read-VkInputJson -Context $Context -Option 'SnapshotFile'
        if ($null -eq $previous) {
            $o = Get-VkNotApplicable 'No previous snapshot; this run''s counts are written as the baseline'
            $o.Artifacts = @{ Snapshot = $snapshot }
            return $o
        }
        $pct = [double]$Context.Options['DeltaThresholdPercent']
        $min = [int]$Context.Options['DeltaThresholdMinimum']
        $rows = foreach ($id in $current.Keys) {
            $now = $current[$id].count
            $was = Get-VkValue (Get-VkValue (Get-VkValue $previous 'groups') $id) 'count'
            if ($null -eq $was -or $null -eq $now) {
                ConvertTo-VkFinding -Severity Info -Object $current[$id].displayName -ObjectId $id -Issue 'No baseline for this group' -Data ([ordered]@{ Now = $now })
                continue
            }
            $delta = [int]$now - [int]$was
            $deltaPct = if ([int]$was -eq 0) { 100.0 } else { [math]::Round(100.0 * [math]::Abs($delta) / [int]$was, 1) }
            if ([math]::Abs($delta) -ge $min -and $deltaPct -gt $pct) {
                ConvertTo-VkFinding -Severity Finding -Object $current[$id].displayName -ObjectId $id -Issue 'Membership changed beyond the threshold since the last snapshot' -Data ([ordered]@{ Kind = $current[$id].kind; Was = $was; Now = $now; Delta = $delta; Percent = $deltaPct })
            }
        }
        $o = Get-VkOutcome -Rows @($rows) -Message ('Threshold: more than {0}% and at least {1} members; previous snapshot {2}' -f $pct, $min, (Get-VkValue $previous 'takenAtUtc'))
        $o.Artifacts = @{ Snapshot = $snapshot }
        $o
    }
}

function Invoke-VkDg06 {
    <#
    .SYNOPSIS
        Implements VK-DG-06: lists dynamic groups whose processing is paused, and rules that use
        the memberOf preview, so no group silently stops updating.
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkDg06 -Context $ctx
    .DESCRIPTION
    #>
    <# VK-DG-06. Groups with membershipRuleProcessingState Paused, and rules using memberOf (preview ending November 3, 2026). #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-DG-06' $Context {
        param($Context)
        $rows = foreach ($g in Get-VkDynamicGroups $Context) {
            if ((Get-VkValue $g 'membershipRuleProcessingState') -eq 'Paused') {
                ConvertTo-VkFinding -Severity Finding -Object $g.displayName -ObjectId $g.id -Issue 'Dynamic processing is paused: membership no longer updates'
            }
            if ("$($g.membershipRule)" -match '(?i)\.memberof\b') {
                ConvertTo-VkFinding -Severity Finding -Object $g.displayName -ObjectId $g.id -Issue 'Rule uses the memberOf preview, which ends November 3, 2026; the group then freezes in its last state' -Data ([ordered]@{ Rule = $g.membershipRule })
            }
        }
        Get-VkOutcome -Rows @($rows)
    }
}

function Invoke-VkDg07 {
    <#
    .SYNOPSIS
        Implements VK-DG-07: checks that each dynamic administrative unit's rule matches the group
        it mirrors (au-group-map.csv), and that each restricted management unit has a recorded
        reason (restricted-au-reasons.csv).
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkDg07 -Context $ctx
    .DESCRIPTION
    #>
    <#
    VK-DG-07. Dynamic administrative units whose rule differs from the group it mirrors
    (au-group-map.csv: AdministrativeUnitId, GroupId), and restricted management units with no
    recorded reason (restricted-au-reasons.csv: AdministrativeUnitId, Reason, DecisionRef).
    Permission: AdministrativeUnit.Read.All.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-DG-07' $Context {
        param($Context)
        $aus = @(Get-VkData -Context $Context -Name 'administrativeUnits' -Uri '/v1.0/directory/administrativeUnits?$select=id,displayName,membershipType,membershipRule,membershipRuleProcessingState,isMemberManagementRestricted&$top=999')
        if ($aus.Count -eq 0) { return Get-VkNotApplicable 'No administrative units in the tenant' }
        $groups = @{}
        foreach ($g in Get-VkDynamicGroups $Context) { $groups["$($g.id)"] = $g }
        $map = Read-VkInputCsv -Context $Context -Option 'AuGroupMapFile'
        $reasons = @{}
        foreach ($r in (Read-VkInputCsv -Context $Context -Option 'RestrictedAuReasonsFile')) {
            if (-not (Test-VkBlank $r.Reason)) { $reasons["$($r.AdministrativeUnitId)"] = $r }
        }
        $byId = @{}
        foreach ($a in $aus) { $byId["$($a.id)"] = $a }
        $rows = [System.Collections.Generic.List[object]]::new()
        foreach ($m in $map) {
            $au = $byId["$($m.AdministrativeUnitId)"]
            $g = $groups["$($m.GroupId)"]
            if (-not $au -or -not $g) {
                $rows.Add((ConvertTo-VkFinding -Severity Finding -Object "$($m.AdministrativeUnitId)" -Issue 'Mapped unit or group not found' -Data ([ordered]@{ GroupId = $m.GroupId })))
                continue
            }
            if ((Get-VkValue $au 'membershipType') -ne 'Dynamic') {
                $rows.Add((ConvertTo-VkFinding -Severity Finding -Object $au.displayName -ObjectId $au.id -Issue 'Mapped unit is not dynamic' -Data ([ordered]@{ GroupId = $m.GroupId })))
            } elseif ((ConvertTo-VkRuleText $au.membershipRule) -ne (ConvertTo-VkRuleText $g.membershipRule)) {
                $rows.Add((ConvertTo-VkFinding -Severity Finding -Object $au.displayName -ObjectId $au.id -Issue 'Unit rule differs from the rule of the group it mirrors' -Data ([ordered]@{ Group = $g.displayName; UnitRule = $au.membershipRule; GroupRule = $g.membershipRule })))
            }
        }
        foreach ($a in $aus) {
            if (-not (Get-VkValue $a 'isMemberManagementRestricted' $false)) { continue }
            $why = $reasons["$($a.id)"]
            if ($why) {
                $rows.Add((ConvertTo-VkFinding -Severity Info -Object $a.displayName -ObjectId $a.id -Issue 'Restricted management unit' -Data ([ordered]@{ Reason = $why.Reason; Decision = (Get-VkValue $why 'DecisionRef' '') })))
            } else {
                $rows.Add((ConvertTo-VkFinding -Severity Finding -Object $a.displayName -ObjectId $a.id -Issue 'Restricted management unit with no recorded reason (members fall outside Entra ID Governance)'))
            }
        }
        Get-VkOutcome -Rows $rows.ToArray() -Message ('{0} unit(s); {1} mapped to groups' -f $aus.Count, @($map | Where-Object { $_ }).Count)
    }
}
