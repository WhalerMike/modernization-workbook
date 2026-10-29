<#
.SYNOPSIS
    HR track (people): VK-HR-01 to VK-HR-06. Read-only.
    Sources: Attribute-Driven Migration guide, Stages 1-2 and "Lifecycle Workflows at scale";
    Book 03, Chapters 06 (program attribute map) and 08 (triggers and schedule).
#>

$script:VkUserSelect = 'id,userPrincipalName,displayName,accountEnabled,userType,employeeId,onPremisesExtensionAttributes'
# Permission: User.Read.All (least privileged for List users, application and delegated).
$script:VkUsersUri = "/v1.0/users?`$select=$script:VkUserSelect&`$top=999"

function Get-VkMemberUsers {
    # Enabled member users: the population every HR check measures.
    param($Context)
    $users = Get-VkData -Context $Context -Name 'users' -Uri $script:VkUsersUri
    @($users | Where-Object { (Get-VkValue $_ 'accountEnabled' $false) -eq $true -and (Get-VkValue $_ 'userType' 'Member') -eq 'Member' })
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
    <# VK-HR-01. Enabled member users with no employeeId, excluding exceptions that name an owner. #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-HR-01' $Context {
        param($Context)
        $ex = Get-VkHrExceptions $Context
        $rows = foreach ($u in Get-VkMemberUsers $Context) {
            if (-not (Test-VkBlank (Get-VkValue $u 'employeeId'))) { continue }
            if (Test-VkException $ex $u 'Valid') { continue }
            $why = 'No employeeId: not correlated to an HR record'
            if (Test-VkException $ex $u 'Invalid') { $why = 'No employeeId; listed as an exception but the exception names no owner' }
            ConvertTo-VkFinding -Severity Finding -Object $u.userPrincipalName -ObjectId $u.id -Issue $why
        }
        Get-VkOutcome -Rows @($rows) -Message ('{0} exception(s) with an owner excluded' -f $ex.Valid.Count)
    }
}

function Invoke-VkHr02 {
    <# VK-HR-02. Enabled members with an empty organization code, worker type or position category slot. #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-HR-02' $Context {
        param($Context)
        $slots = @($Context.Options['CodedSlots'])
        $ex = Get-VkHrExceptions $Context
        $rows = foreach ($u in Get-VkMemberUsers $Context) {
            if (Test-VkException $ex $u 'Valid') { continue }
            $missing = @($slots | Where-Object { $null -eq (Get-VkExtensionAttribute $u $_) })
            if ($missing.Count -gt 0) {
                ConvertTo-VkFinding -Severity Finding -Object $u.userPrincipalName -ObjectId $u.id -Issue 'Coded attribute slot empty' -Data ([ordered]@{ Missing = $missing })
            }
        }
        Get-VkOutcome -Rows @($rows) -Message ('Slots checked: {0}' -f ($slots -join ', '))
    }
}

function Invoke-VkHr03 {
    <# VK-HR-03. Users per organization code in Entra ID against the HR export's count per code. #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-HR-03' $Context {
        param($Context)
        $hr = Read-VkInputCsv -Context $Context -Option 'HrExportFile'
        if ($null -eq $hr) { return Get-VkNotApplicable 'No HR export (hr-export.csv with OrgCode and Count columns) was supplied' }
        $slot = $Context.Options['OrgCodeSlot']
        $ex = Get-VkHrExceptions $Context
        $entra = @{}
        foreach ($u in Get-VkMemberUsers $Context) {
            if (Test-VkException $ex $u 'Valid') { continue }
            $code = Get-VkExtensionAttribute $u $slot
            if ($null -eq $code) { continue }
            $entra[$code] = 1 + [int](Get-VkValue $entra $code 0)
        }
        $hrCounts = @{}
        foreach ($r in $hr) { $hrCounts["$($r.OrgCode)".Trim()] = [int]$r.Count }
        $codes = @(@($entra.Keys) + @($hrCounts.Keys) | Sort-Object -Unique)
        $rows = foreach ($c in $codes) {
            $e = [int](Get-VkValue $entra $c 0); $h = [int](Get-VkValue $hrCounts $c 0)
            $sev = 'Info'
            $issue = 'Counts agree'
            if ($e -ne $h) { $sev = 'Finding'; $issue = 'Entra ID count differs from the HR export' }
            ConvertTo-VkFinding -Severity $sev -Object $c -Issue $issue -Data ([ordered]@{ EntraId = $e; HrExport = $h; Difference = ($e - $h) })
        }
        Get-VkOutcome -Rows @($rows) -Message ('{0} organization codes compared on {1}' -f $codes.Count, $slot)
    }
}

function Invoke-VkHr04 {
    <# VK-HR-04. employeeId values held by more than one user (any state). #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-HR-04' $Context {
        param($Context)
        $users = Get-VkData -Context $Context -Name 'users' -Uri $script:VkUsersUri
        $groups = @($users | Where-Object { -not (Test-VkBlank (Get-VkValue $_ 'employeeId')) } |
                Group-Object { "$($_.employeeId)".Trim().ToUpperInvariant() } | Where-Object Count -gt 1)
        $rows = foreach ($g in $groups) {
            ConvertTo-VkFinding -Severity Finding -Object $g.Name -Issue 'employeeId held by more than one user' -Data ([ordered]@{ Users = @($g.Group | ForEach-Object { $_.userPrincipalName }) })
        }
        Get-VkOutcome -Rows @($rows)
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
