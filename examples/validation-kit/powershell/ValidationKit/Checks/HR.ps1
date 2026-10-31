<#
.SYNOPSIS
    HR track (people): VK-HR-01 to VK-HR-07. Read-only.
    Sources: Attribute-Driven Migration guide, Stages 1-2 and "Lifecycle Workflows at scale";
    the implementation guide, Gates 1, 2 and 8 (VK-HR-07, and the wave scope); Book 03,
    Chapters 06 (program attribute map) and 08 (triggers and schedule).

    The wave scope: with the WaveId option set, VK-HR-01 to 04 and VK-HR-07 read only the users
    the Start Kit's Get-FMPWaveList put in that wave (waves.csv, the WaveFile option), matched
    on userPrincipalName or employeeId. That is Gate 8's "on the wave's query". Unset, they
    read the whole tenant.
#>

$script:VkUserSelect = 'id,userPrincipalName,displayName,accountEnabled,userType,employeeId,onPremisesExtensionAttributes,' +
    'mail,employeeType,department,onPremisesSyncEnabled,onPremisesSecurityIdentifier,onPremisesUserPrincipalName,onPremisesSamAccountName,onPremisesDomainName'
# Permission: User.Read.All (least privileged for List users, application and delegated).
$script:VkUsersUri = "/v1.0/users?`$select=$script:VkUserSelect&`$top=999"
# VK-HR-07: each user's manager, by id, key and state (List manager: GET /users?$expand=manager).
$script:VkManagersUri = "/v1.0/users?`$select=id&`$expand=manager(`$select=id,employeeId,accountEnabled)&`$top=999"

function Get-VkWaveScope {
    # The wave named by the WaveId option, from waves.csv: the users' UPNs and keys. $null when
    # no wave is set. A wave that names no user, or a missing file, is an error, never a
    # silent whole-tenant run.
    param($Context)
    $id = "$($Context.Options['WaveId'])".Trim()
    if (-not $id) { return $null }
    if ($Context.Cache.ContainsKey("wave|$id")) { return $Context.Cache["wave|$id"] }
    $rows = Read-VkInputCsv -Context $Context -Option 'WaveFile'
    if ($null -eq $rows) { throw "WaveId '$id' is set, but the wave file ($($Context.Options['WaveFile'])) wasn't found" }
    $upn = @{}; $key = @{}; $n = 0
    foreach ($r in $rows) {
        if ("$(Get-VkValue $r 'WaveId' '')".Trim() -ne $id) { continue }
        $type = "$(Get-VkValue $r 'ObjectType' 'User')".Trim()
        if ($type -and $type -ne 'User') { continue }
        $n++
        $u = "$(Get-VkValue $r 'UserPrincipalName' '')".Trim().ToLowerInvariant()
        $k = "$(Get-VkValue $r 'EmployeeId' '')".Trim().ToUpperInvariant()
        if ($u) { $upn[$u] = $true }
        if ($k) { $key[$k] = $true }
    }
    if ($n -eq 0) { throw "Wave '$id' has no users in $($Context.Options['WaveFile'])" }
    $scope = @{ Id = $id; Users = $n; Upn = $upn; Key = $key }
    $Context.Cache["wave|$id"] = $scope
    $scope
}

function Test-VkInWave {
    param($Scope, $User)
    if ($null -eq $Scope) { return $true }
    $u = "$(Get-VkValue $User 'userPrincipalName' '')".ToLowerInvariant()
    $k = "$(Get-VkValue $User 'employeeId' '')".Trim().ToUpperInvariant()
    ($u -and $Scope.Upn.ContainsKey($u)) -or ($k -and $Scope.Key.ContainsKey($k))
}

function Get-VkWaveNote {
    # The message suffix that says a result covers one wave, and how much of it Entra ID holds.
    param($Context, [object[]]$Found = @())
    $scope = Get-VkWaveScope $Context
    if ($null -eq $scope) { return '' }
    '; wave {0}: {1} of its {2} user(s) found in Entra ID' -f $scope.Id, @($Found).Count, $scope.Users
}

function Get-VkMemberUsers {
    # Enabled member users: the population every HR check measures.
    # With a wave set, only that wave's users.
    param($Context)
    $users = Get-VkData -Context $Context -Name 'users' -Uri $script:VkUsersUri
    $scope = Get-VkWaveScope $Context
    @($users | Where-Object { (Get-VkValue $_ 'accountEnabled' $false) -eq $true -and (Get-VkValue $_ 'userType' 'Member') -eq 'Member' -and (Test-VkInWave $scope $_) })
}

function Get-VkHrExceptions {
    # exceptions.csv: UserPrincipalName or Id, Owner, Reason. An exception with no owner isn't one.
    param($Context)
    $rows = Read-VkInputCsv -Context $Context -Option 'ExceptionsFile'
    $valid = @{}
    $invalid = @{}
    foreach ($r in $rows) {
        $key = "$(Get-VkValue $r 'UserPrincipalName' '')".Trim().ToLowerInvariant()
        $id = "$(Get-VkValue $r 'Id' '')".Trim().ToLowerInvariant()
        foreach ($k in @($key, $id) | Where-Object { $_ }) {
            if (Test-VkBlank (Get-VkValue $r 'Owner')) { $invalid[$k] = $r } else { $valid[$k] = $r }
        }
    }
    @{ Valid = $valid; Invalid = $invalid }
}

function Test-VkException {
    param($Exceptions, $User, [string]$Kind = 'Valid')
    $set = $Exceptions[$Kind]
    $upn = "$(Get-VkValue $User 'userPrincipalName' '')".ToLowerInvariant()
    $id = "$(Get-VkValue $User 'id' '')".ToLowerInvariant()
    $set.ContainsKey($upn) -or $set.ContainsKey($id)
}

function Invoke-VkHr01 {
    <#
    .SYNOPSIS
        Implements VK-HR-01: lists enabled member users with no employeeId, leaving out exceptions
        that name an owner. It passes only when every other enabled member is correlated to an HR record.
    .EXAMPLE
        # From the kit folder: against the fictional "fail" fixture tenant (no sign-in).
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkHr01 -Context $ctx | Select-Object -ExpandProperty Details
    .EXAMPLE
        # Live, on one wave: only the users Get-FMPWaveList put in wave W01 (waves.csv in D:\Inputs).
        Invoke-VkHr01 -Context (Get-VkRunContext -InputPath D:\Inputs -Option @{ WaveId = 'W01' })
    .DESCRIPTION
    #>
    <# VK-HR-01. Enabled member users with no employeeId, excluding exceptions that name an owner. #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-HR-01' $Context {
        param($Context)
        $ex = Get-VkHrExceptions $Context
        $members = @(Get-VkMemberUsers $Context)
        $rows = foreach ($u in $members) {
            if (-not (Test-VkBlank (Get-VkValue $u 'employeeId'))) { continue }
            if (Test-VkException $ex $u 'Valid') { continue }
            $why = 'No employeeId: not correlated to an HR record'
            if (Test-VkException $ex $u 'Invalid') { $why = 'No employeeId; listed as an exception but the exception names no owner' }
            ConvertTo-VkFinding -Severity Finding -Object $u.userPrincipalName -ObjectId $u.id -Issue $why
        }
        Get-VkOutcome -Rows @($rows) -Message (('{0} exception(s) with an owner excluded' -f $ex.Valid.Count) + (Get-VkWaveNote $Context $members))
    }
}

function Invoke-VkHr02 {
    <#
    .SYNOPSIS
        Implements VK-HR-02: lists enabled member users whose organization code, worker type or
        position category slot (extensionAttribute10 to 12 by default) is empty. It proves the coded
        attributes the dynamic groups depend on are populated.
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkHr02 -Context $ctx
    .DESCRIPTION
    #>
    <# VK-HR-02. Enabled members with an empty organization code, worker type or position category slot. #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-HR-02' $Context {
        param($Context)
        $slots = @($Context.Options['CodedSlots'])
        $ex = Get-VkHrExceptions $Context
        $members = @(Get-VkMemberUsers $Context)
        $rows = foreach ($u in $members) {
            if (Test-VkException $ex $u 'Valid') { continue }
            $missing = @($slots | Where-Object { $null -eq (Get-VkExtensionAttribute $u $_) })
            if ($missing.Count -gt 0) {
                ConvertTo-VkFinding -Severity Finding -Object $u.userPrincipalName -ObjectId $u.id -Issue 'Coded attribute slot empty' -Data ([ordered]@{ Missing = $missing })
            }
        }
        Get-VkOutcome -Rows @($rows) -Message (('Slots checked: {0}' -f ($slots -join ', ')) + (Get-VkWaveNote $Context $members))
    }
}

function Invoke-VkHr03 {
    <#
    .SYNOPSIS
        Implements VK-HR-03: counts enabled member users per organization code in Entra ID and
        compares each count with the HR export (hr-export.csv: OrgCode, Count). Any code whose counts
        differ fails it; NotApplicable without the export.
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkHr03 -Context $ctx | Select-Object -ExpandProperty Details
    .DESCRIPTION
    #>
    <# VK-HR-03. Users per organization code in Entra ID against the HR export's count per code. #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-HR-03' $Context {
        param($Context)
        $hr = Read-VkInputCsv -Context $Context -Option 'HrExportFile'
        if ($null -eq $hr) { return Get-VkNotApplicable 'No HR export (hr-export.csv with OrgCode and Count columns) was supplied' }
        $slot = $Context.Options['OrgCodeSlot']
        $ex = Get-VkHrExceptions $Context
        $entra = @{}
        $members = @(Get-VkMemberUsers $Context)
        foreach ($u in $members) {
            if (Test-VkException $ex $u 'Valid') { continue }
            $code = Get-VkExtensionAttribute $u $slot
            if ($null -eq $code) { continue }
            $entra[$code] = 1 + [int](Get-VkValue $entra $code 0)
        }
        $hrCounts = @{}
        foreach ($r in $hr) { $hrCounts["$($r.OrgCode)".Trim()] = [int]$r.Count }
        $codes = @(@($entra.Keys) + @($hrCounts.Keys) | Sort-Object -Unique)
        # On one wave, only the codes its users hold: the HR export counts the whole agency.
        if ($null -ne (Get-VkWaveScope $Context)) { $codes = @($entra.Keys | Sort-Object) }
        $rows = foreach ($c in $codes) {
            $e = [int](Get-VkValue $entra $c 0); $h = [int](Get-VkValue $hrCounts $c 0)
            $sev = 'Info'
            $issue = 'Counts agree'
            if ($e -ne $h) { $sev = 'Finding'; $issue = 'Entra ID count differs from the HR export' }
            ConvertTo-VkFinding -Severity $sev -Object $c -Issue $issue -Data ([ordered]@{ EntraId = $e; HrExport = $h; Difference = ($e - $h) })
        }
        Get-VkOutcome -Rows @($rows) -Message (('{0} organization codes compared on {1}' -f $codes.Count, $slot) + (Get-VkWaveNote $Context $members))
    }
}

function Invoke-VkHr04 {
    <#
    .SYNOPSIS
        Implements VK-HR-04: lists employeeId values held by more than one user, in any account
        state. It passes only when every key is unique.
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkHr04 -Context $ctx
    .DESCRIPTION
    #>
    <#
    VK-HR-04. employeeId values held by more than one user (any state). On a wave, the keys held
    twice where at least one holder is in the wave: the other holder can be anywhere.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-HR-04' $Context {
        param($Context)
        $users = Get-VkData -Context $Context -Name 'users' -Uri $script:VkUsersUri
        $scope = Get-VkWaveScope $Context
        $groups = @($users | Where-Object { -not (Test-VkBlank (Get-VkValue $_ 'employeeId')) } |
                Group-Object { "$($_.employeeId)".Trim().ToUpperInvariant() } | Where-Object Count -gt 1)
        if ($null -ne $scope) { $groups = @($groups | Where-Object { @($_.Group | Where-Object { Test-VkInWave $scope $_ }).Count -gt 0 }) }
        $rows = foreach ($g in $groups) {
            ConvertTo-VkFinding -Severity Finding -Object $g.Name -Issue 'employeeId held by more than one user' -Data ([ordered]@{ Users = @($g.Group | ForEach-Object { $_.userPrincipalName }) })
        }
        $note = ''
        if ($null -ne $scope) { $note = (Get-VkWaveNote $Context @($users | Where-Object { Test-VkInWave $scope $_ })).TrimStart('; ') }
        Get-VkOutcome -Rows @($rows) -Message $note
    }
}

function Get-VkUserAttribute {
    # A user's value for a survey attribute: a property, an extension attribute, or the
    # manager's id from the expanded manager. Untrimmed, so whitespace can be seen.
    param($User, [string]$Name, $Managers)
    if ($Name -like 'extensionAttribute*') { return Get-VkValue (Get-VkValue $User 'onPremisesExtensionAttributes') $Name }
    if ($Name -eq 'manager') {
        if ($null -eq $Managers) { return $null }
        $m = $Managers["$(Get-VkValue $User 'id' '')"]
        if ($m) { return "$(Get-VkValue $m 'id' '')" }
        return $null
    }
    Get-VkValue $User $Name
}

function Read-VkCodeLists {
    # code-lists.csv: Attribute, Code, the file the Start Kit's survey reads. Attribute names
    # match case-insensitively (EmployeeType and employeeType are one list).
    param($Context)
    $rows = Read-VkInputCsv -Context $Context -Option 'CodeListFile'
    $lists = @{}
    foreach ($r in @($rows)) {
        $a = "$(Get-VkValue $r 'Attribute' '')".Trim().ToLowerInvariant()
        if (-not $a) { continue }
        if (-not $lists.ContainsKey($a)) { $lists[$a] = @{} }
        $lists[$a]["$(Get-VkValue $r 'Code' '')".Trim()] = $true
    }
    $lists
}

function Invoke-VkHr07 {
    <#
    .SYNOPSIS
        Implements VK-HR-07: the attribute survey on the Entra ID side. Reports the fill rate of
        each survey attribute against SurveyThresholdPercent, and values that break the same rules
        as the Start Kit's Get-FMPAttributeSurvey.
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z' -Option @{ KeyPattern = '^MP\d{7}$' }
        Invoke-VkHr07 -Context $ctx | Select-Object -ExpandProperty Details
    .DESCRIPTION
    #>
    <#
    VK-HR-07. The attribute survey on the Entra side: for enabled members (exceptions with an
    owner left out), the fill rate of each survey attribute (employeeId, employeeType,
    department, mail, manager and the coded slots) against SurveyThresholdPercent, and the
    values that break a rule: leading or trailing whitespace, a key outside KeyPattern, a value
    not on the code list (code-lists.csv), a display string in a coded slot, mail held twice,
    and a manager who is disabled or has no employeeId. The same rules as the Start Kit's
    Get-FMPAttributeSurvey, so the two sides compare. A fill rate is an Info row when it meets
    the threshold and a Finding when it doesn't. Permission: User.Read.All.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-HR-07' $Context {
        param($Context)
        $ex = Get-VkHrExceptions $Context
        $members = @(Get-VkMemberUsers $Context)
        $users = @($members | Where-Object { -not (Test-VkException $ex $_ 'Valid') })
        $slots = @($Context.Options['CodedSlots'])
        $attributes = @(@($Context.Options['SurveyAttributes']) + $slots | Select-Object -Unique)
        $threshold = [double]$Context.Options['SurveyThresholdPercent']
        $pattern = "$($Context.Options['KeyPattern'])"
        $lists = Read-VkCodeLists $Context
        $rows = [System.Collections.Generic.List[object]]::new()

        $managers = $null
        if ($attributes -contains 'manager') {
            $read = Get-VkData -Context $Context -Name 'userManagers' -Uri $script:VkManagersUri -Optional
            if ($null -eq $read) {
                $rows.Add((ConvertTo-VkFinding -Severity Warn -Object 'manager' -Issue 'Managers could not be read, so the manager fill rate and manager rules were skipped'))
                $attributes = @($attributes | Where-Object { $_ -ne 'manager' })
            } else {
                $managers = @{}
                foreach ($r in @($read)) {
                    $m = Get-VkValue $r 'manager'
                    if ($null -ne $m) { $managers["$(Get-VkValue $r 'id' '')"] = $m }
                }
            }
        }

        foreach ($a in $attributes) {
            $n = @($users | Where-Object { -not (Test-VkBlank (Get-VkUserAttribute $_ $a $managers)) }).Count
            $pct = 0
            if ($users.Count) { $pct = [math]::Round(100 * $n / $users.Count, 1) }
            $sev = 'Info'; $issue = 'Fill rate meets the threshold'
            if ($users.Count -and $pct -lt $threshold) { $sev = 'Finding'; $issue = 'Fill rate below the threshold' }
            $rows.Add((ConvertTo-VkFinding -Severity $sev -Object $a -Issue $issue -Data ([ordered]@{ Populated = $n; Population = $users.Count; FillPercent = $pct; ThresholdPercent = $threshold })))
        }

        $mailHolders = @{}
        foreach ($u in $users) {
            $m = "$(Get-VkValue $u 'mail' '')".Trim().ToLowerInvariant()
            if ($m) { if (-not $mailHolders.ContainsKey($m)) { $mailHolders[$m] = 0 }; $mailHolders[$m]++ }
        }
        foreach ($u in $users) {
            $problems = [System.Collections.Generic.List[string]]::new()
            foreach ($a in @('employeeId', 'employeeType', 'department', 'mail') + $slots) {
                $v = Get-VkUserAttribute $u $a $managers
                if ($null -ne $v -and "$v" -ne "$v".Trim()) { $problems.Add("$a has leading or trailing whitespace") }
            }
            $key = "$(Get-VkValue $u 'employeeId' '')".Trim()
            if ($key -and $pattern -and $key -notmatch $pattern) { $problems.Add("employeeId doesn't match $pattern") }
            foreach ($a in $lists.Keys) {
                $prop = @($attributes + @('employeeType', 'department') | Where-Object { $_.ToLowerInvariant() -eq $a })[0]
                if (-not $prop) { continue }
                $v = "$(Get-VkUserAttribute $u $prop $managers)".Trim()
                if ($v -and -not $lists[$a].ContainsKey($v)) { $problems.Add("$prop '$v' isn't on the code list") }
            }
            foreach ($a in $slots) {
                $v = "$(Get-VkUserAttribute $u $a $managers)".Trim()
                if ($v -match '\s') { $problems.Add("$a holds a display string, not a code") }
            }
            $m = "$(Get-VkValue $u 'mail' '')".Trim().ToLowerInvariant()
            if ($m -and $mailHolders[$m] -gt 1) { $problems.Add('mail is held by another enabled member') }
            if ($null -ne $managers -and $managers.ContainsKey("$($u.id)")) {
                $mgr = $managers["$($u.id)"]
                if ((Get-VkValue $mgr 'accountEnabled' $true) -eq $false) { $problems.Add('the manager''s account is disabled') }
                elseif (Test-VkBlank (Get-VkValue $mgr 'employeeId')) { $problems.Add('the manager has no employeeId, so the HR manager link can''t be built') }
            }
            if ($problems.Count) {
                $rows.Add((ConvertTo-VkFinding -Severity Finding -Object $u.userPrincipalName -ObjectId $u.id -Issue ('Attribute value quality: {0}' -f ($problems -join '; '))))
            }
        }
        Get-VkOutcome -Rows @($rows) -Message (('{0} enabled member(s) surveyed on {1}; threshold {2}%' -f $users.Count, ($attributes -join ', '), $threshold) + (Get-VkWaveNote $Context $members))
    }
}

function Test-VkLcwScope {
    # Evaluates a Lifecycle Workflows scope rule made only of "property eq|ne 'value'" clauses
    # joined by "and". Returns $true or $false, or $null when the rule uses anything else.
    param([string]$Rule, $User)
    if (Test-VkBlank $Rule) { return $true }
    $clauses = [regex]::Split($Rule.Trim(), '\)\s+and\s+\(', 'IgnoreCase')
    foreach ($c in $clauses) {
        $m = [regex]::Match($c.Trim().Trim('(', ')').Trim(), "^(\w+)\s+(eq|ne)\s+(?:'([^']*)'|(true|false))$", 'IgnoreCase')
        if (-not $m.Success) { return $null }
        $prop = $m.Groups[1].Value
        $want = if ($m.Groups[4].Success) { $m.Groups[4].Value.ToLowerInvariant() } else { $m.Groups[3].Value.ToLowerInvariant() }
        $have = if ($prop -match '^extensionAttribute\d+$') { Get-VkExtensionAttribute $User $prop } else { Get-VkValue $User $prop }
        $haveText = "$have".ToLowerInvariant()
        $equal = $haveText -eq $want
        if ($m.Groups[2].Value -ieq 'eq' -and -not $equal) { return $false }
        if ($m.Groups[2].Value -ieq 'ne' -and $equal) { return $false }
    }
    $true
}

function Invoke-VkHr05 {
    <#
    .SYNOPSIS
        Implements VK-HR-05: for each enabled, scheduled Lifecycle Workflow with a time-based
        trigger, lists users whose trigger date passed in the lookback window with no processing
        record. Past the 3-day catch-up it is a finding; inside it, a warning.
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z' -Option @{ LookbackDays = 30 }
        Invoke-VkHr05 -Context $ctx
    .DESCRIPTION
    #>
    <#
    VK-HR-05. For each enabled, scheduled workflow with a time-based trigger: users whose trigger
    date (the attribute plus offsetInDays) fell in the lookback window and has passed, with no
    processing record. Past the 3-day catch-up: a finding. Inside it: a warning.
    Permissions: LifecycleWorkflows-Workflow.Read.All (the list's least privilege is
    -Workflow.ReadBasic.All; the kit reads execution conditions), LifecycleWorkflows-Reports.Read.All
    for userProcessingResults, User.Read.All, and User-LifeCycleInfo.Read.All to read
    employeeLeaveDateTime.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-HR-05' $Context {
        param($Context)
        $wfs = @(Get-VkData -Context $Context -Name 'lcwWorkflows' -Uri '/v1.0/identityGovernance/lifecycleWorkflows/workflows?$select=id,displayName,category,isEnabled,isSchedulingEnabled,createdDateTime,executionConditions,settings')
        $timed = @($wfs | Where-Object {
                (Get-VkValue $_ 'isEnabled' $false) -and (Get-VkValue $_ 'isSchedulingEnabled' $false) -and
                (Get-VkValue (Get-VkValue (Get-VkValue $_ 'executionConditions') 'trigger') 'timeBasedAttribute')
            })
        if ($timed.Count -eq 0) { return Get-VkNotApplicable 'No enabled, scheduled workflow with a time-based trigger' }
        $users = @(Get-VkData -Context $Context -Name 'users' -Uri "/v1.0/users?`$select=$script:VkUserSelect,companyName,department,country,employeeHireDate,employeeLeaveDateTime&`$top=999" |
                Where-Object { (Get-VkValue $_ 'userType' 'Member') -eq 'Member' })
        $asOf = $Context.AsOf
        $lookback = [int]$Context.Options['LookbackDays']
        $catchUp = [int]$Context.Options['CatchUpDays']
        $rows = foreach ($wf in $timed) {
            $cond = Get-VkValue $wf 'executionConditions'
            $trigger = Get-VkValue $cond 'trigger'
            $attr = Get-VkValue $trigger 'timeBasedAttribute'
            $offset = [int](Get-VkValue $trigger 'offsetInDays' 0)
            $scopeRule = Get-VkValue (Get-VkValue $cond 'scope') 'rule'
            $created = ConvertTo-VkUtc (Get-VkValue $wf 'createdDateTime')
            $results = @(Get-VkData -Context $Context -Name 'lcwUserProcessingResults' -Key $wf.id -Uri "/v1.0/identityGovernance/lifecycleWorkflows/workflows/$($wf.id)/userProcessingResults?`$select=id,processingStatus,scheduledDateTime,subject")
            $byUser = @{}
            foreach ($r in $results) { $byUser["$(Get-VkValue (Get-VkValue $r 'subject') 'id')".ToLowerInvariant()] = $r }
            foreach ($u in $users) {
                $base = ConvertTo-VkUtc (Get-VkValue $u $attr)
                if ($null -eq $base) { continue }
                $due = $base.AddDays($offset)
                if ($due -ge $asOf -or $due -lt $asOf.AddDays(-$lookback)) { continue }
                if ($created -and $due -lt $created) { continue }
                $inScope = Test-VkLcwScope -Rule $scopeRule -User $u
                if ($inScope -eq $false) { continue }
                $rec = $byUser["$($u.id)".ToLowerInvariant()]
                $late = Get-VkDays $due $asOf
                $data = [ordered]@{ Workflow = $wf.displayName; Trigger = $attr; Due = (Format-VkUtc $due); DaysPast = $late }
                if ($rec) {
                    if ((Get-VkValue $rec 'processingStatus') -eq 'failed') {
                        ConvertTo-VkFinding -Severity Warn -Object $u.userPrincipalName -ObjectId $u.id -Issue 'Processed, with failed tasks' -Data $data
                    }
                    continue
                }
                if ($null -eq $inScope) {
                    ConvertTo-VkFinding -Severity Warn -Object $u.userPrincipalName -ObjectId $u.id -Issue 'Trigger date passed with no processing record; the scope rule is beyond the kit''s evaluator, so confirm in the workflow history' -Data $data
                } elseif ($late -gt $catchUp) {
                    ConvertTo-VkFinding -Severity Finding -Object $u.userPrincipalName -ObjectId $u.id -Issue "Trigger date passed more than $catchUp days ago with no processing record (outside the catch-up window)" -Data $data
                } else {
                    ConvertTo-VkFinding -Severity Warn -Object $u.userPrincipalName -ObjectId $u.id -Issue 'Trigger date passed with no processing record yet (inside the catch-up window)' -Data $data
                }
            }
        }
        Get-VkOutcome -Rows @($rows) -Message ('{0} time-triggered workflow(s); lookback {1} days; catch-up {2} days' -f $timed.Count, $lookback, $catchUp)
    }
}

function Invoke-VkHr06 {
    <#
    .SYNOPSIS
        Implements VK-HR-06: confirms every enabled, scheduled Lifecycle Workflow has an execution
        limit (tenant-wide or its own) and reports the workflow count against the default ceiling of 100.
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkHr06 -Context $ctx | Select-Object -ExpandProperty Details
    .DESCRIPTION
    #>
    <#
    VK-HR-06. Execution limits: the tenant-wide quarantineConfiguration in the Lifecycle Workflows
    settings, or the workflow's own settings.quarantineConfiguration, for every enabled scheduled
    workflow. Also the workflow count against the default ceiling of 100. Learn notes that a
    workflow-specific limit set in the admin center "isn't currently reflected in the API", so a
    finding here is confirmed in the admin center before it's acted on.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-HR-06' $Context {
        param($Context)
        $settings = Get-VkData -Context $Context -Name 'lcwSettings' -Uri '/v1.0/identityGovernance/lifecycleWorkflows/settings' -Single
        $wfs = @(Get-VkData -Context $Context -Name 'lcwWorkflows' -Uri '/v1.0/identityGovernance/lifecycleWorkflows/workflows?$select=id,displayName,category,isEnabled,isSchedulingEnabled,createdDateTime,executionConditions,settings')
        $tenantConditions = @(Get-VkValue (Get-VkValue $settings 'quarantineConfiguration') 'conditions' @() | Where-Object { $_ })
        $rows = [System.Collections.Generic.List[object]]::new()
        $tenantText = 'none'
        if ($tenantConditions.Count -gt 0) {
            $tenantText = (@($tenantConditions | ForEach-Object {
                        $t = Get-VkValue $_ 'threshold'; $p = Get-VkValue $_ 'percentage'
                        if ($null -ne $t) { "count>$t" } elseif ($null -ne $p) { "percent>$p" } else { 'condition' }
                    }) -join ',')
        }
        $rows.Add((ConvertTo-VkFinding -Severity Info -Object 'Tenant' -Issue 'Tenant-wide execution limits' -Data ([ordered]@{ Conditions = $tenantText; ScheduleHours = (Get-VkValue $settings 'workflowScheduleIntervalInHours') })))
        foreach ($wf in $wfs) {
            if (-not ((Get-VkValue $wf 'isEnabled' $false) -and (Get-VkValue $wf 'isSchedulingEnabled' $false))) { continue }
            $own = @(Get-VkValue (Get-VkValue (Get-VkValue $wf 'settings') 'quarantineConfiguration') 'conditions' @() | Where-Object { $_ })
            if ($own.Count -eq 0 -and $tenantConditions.Count -eq 0) {
                $rows.Add((ConvertTo-VkFinding -Severity Finding -Object $wf.displayName -ObjectId $wf.id -Issue 'Scheduled workflow with no execution limit: no tenant-wide threshold and none of its own' -Data ([ordered]@{ Category = $wf.category })))
            }
        }
        $ceiling = [int]$Context.Options['WorkflowCeiling']
        $warnAt = [int]$Context.Options['WorkflowWarnAt']
        $sev = 'Info'
        if ($wfs.Count -ge $warnAt) { $sev = 'Warn' }
        $rows.Add((ConvertTo-VkFinding -Severity $sev -Object 'Tenant' -Issue 'Workflow count against the default ceiling' -Data ([ordered]@{ Workflows = $wfs.Count; Ceiling = $ceiling; WarnAt = $warnAt })))
        Get-VkOutcome -Rows $rows.ToArray() -Message ('{0} of {1} workflows' -f $wfs.Count, $ceiling)
    }
}
