#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 08: Learn's PIM audit queries (pinned), run as published over fictional audit rows; then
# the evidence run: the audit read, its findings, the run folder, and the fixture runs that
# examples/drift-pipeline compares. No tenant, no network.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/PaEvidence/PaEvidence.psm1') -Force
    . (Join-Path $PSScriptRoot 'LearnSampleHarness.ps1')
    $script:Root = Resolve-Path (Join-Path $PSScriptRoot '..')
    $script:Fixture = Join-Path $PSScriptRoot 'fixtures/tenant.json'
    $script:Day2 = Join-Path $PSScriptRoot 'fixtures/ch08/tenant-day2.json'
    $script:AuditPath = Join-Path $PSScriptRoot 'fixtures/ch08/audit.json'
    $script:AuditPage = Join-Path $PSScriptRoot '../../third_party/entra-pim-audit-page/pim-how-to-use-audit-log.md'
    $script:Tenant = '11111111-1111-4111-8111-111111111111'
    $script:Hank = 'a0000000-0000-4000-8000-000000000020'
    $script:Lee = 'a0000000-0000-4000-8000-000000000013'
    $script:Req1 = '5eed0000-0000-4000-8000-000000000001'
    $script:Req2 = '5eed0000-0000-4000-8000-000000000002'

    # The audit fixture as Log Analytics AuditLogs rows: the same events under the table's column
    # names (OperationName, AdditionalDetails, CorrelationId), which is what Learn's queries read.
    $script:Raw = @((Get-Content $script:AuditPath -Raw | ConvertFrom-Json -AsHashtable -Depth 50).directoryAudits)
    $script:AuditLogs = @($script:Raw | ForEach-Object {
            [pscustomobject]@{ Id = $_.id; OperationName = $_.activityDisplayName; CorrelationId = $_.correlationId
                AdditionalDetails = ($_.additionalDetails | ConvertTo-Json -Compress -Depth 5); LoggedByService = $_.loggedByService }
        })

    # A tiny evaluator for the shape of Learn's three queries only: let-bound string literals,
    # let-bound "AuditLogs | where ... | summarize makeset(Col)", and "AuditLogs | where" terms
    # joined by "or", each "Col has <literal or name>" or "Col in (name)". Anything else throws.
    function Test-KqlHas([string]$Hay, [string]$Needle) {
        # KQL "has" matches whole terms; a phrase matches its terms in order.
        $h = @([regex]::Split($Hay.ToLowerInvariant(), '[^a-z0-9]+') | Where-Object { $_ })
        $n = @([regex]::Split($Needle.ToLowerInvariant(), '[^a-z0-9]+') | Where-Object { $_ })
        if ($n.Count -eq 0) { return $false }
        for ($i = 0; $i -le $h.Count - $n.Count; $i++) {
            $ok = $true
            for ($j = 0; $j -lt $n.Count; $j++) { if ($h[$i + $j] -ne $n[$j]) { $ok = $false; break } }
            if ($ok) { return $true }
        }
        $false
    }
    function Invoke-KqlWhere([string]$Pipeline, [object[]]$Rows, [hashtable]$Vars) {
        $p = ($Pipeline -replace '\s+', ' ').Trim()
        if ($p -notmatch '^AuditLogs \| where (.+?)( \| summarize makeset\((\w+)\))?$') { throw "Unsupported query shape: $p" }
        $cond = $Matches[1]; $set = $Matches[3]
        $terms = $cond -split ' or '
        $out = @($Rows | Where-Object {
                $row = $_
                foreach ($t in $terms) {
                    $t = $t.Trim()
                    if ($t -match '^(\w+) has "([^"]*)"$') { if (Test-KqlHas ([string]$row.($Matches[1])) $Matches[2]) { return $true } }
                    elseif ($t -match '^(\w+) has (\w+)$') { if (Test-KqlHas ([string]$row.($Matches[1])) ([string]$Vars[$Matches[2]])) { return $true } }
                    elseif ($t -match '^(\w+) in \((\w+)\)$') { if (@($Vars[$Matches[2]]) -contains $row.($Matches[1])) { return $true } }
                    else { throw "Unsupported term: $t" }
                }
                $false
            })
        if ($set) { $out | ForEach-Object { $_.$set } | Select-Object -Unique } else { $out }
    }
    function Invoke-LearnKql([string]$Query, [object[]]$Rows) {
        $vars = @{}
        $statements = $Query -split ';' | ForEach-Object { $_.Trim() } | Where-Object { $_ }
        foreach ($s in $statements) {
            if ($s -match '^let (\w+) = "([^"]*)"$') { $vars[$Matches[1]] = $Matches[2]; continue }
            if ($s -match '^let (\w+) = ([\s\S]+)$') { $name = $Matches[1]; $vars[$name] = @(Invoke-KqlWhere $Matches[2] $Rows $vars); continue }
            return Invoke-KqlWhere $s $Rows $vars
        }
    }
    $script:Queries = Get-LearnBlock -Page $script:AuditPage -Language 'Kusto'

    function New-Reader([string]$Tenant = $script:Fixture, [int]$PageSize = 2) {
        $fake = New-PaEvidenceFixtureInvoker -Path $Tenant -AuditPath $script:AuditPath -PageSize $PageSize
        [pscustomobject]@{ Fake = $fake; Reader = (New-PaAuditReader -Cloud gcc -Invoke $fake.Invoke) }
    }
    function Get-Day([int]$Day) {
        $since = if ($Day -eq 1) { [datetime]'2026-10-28T06:00:00Z' } else { [datetime]'2026-10-29T06:00:00Z' }
        $r = New-Reader
        $events = Get-PaPimAuditEvent -Reader $r.Reader -Since $since -Until $since.AddDays(1)
        [pscustomobject]@{ Reader = $r; Events = $events; Audit = (Test-PaPimAudit -Events $events -Since $since -Until $since.AddDays(1)) }
    }
    $script:D1 = Get-Day 1
    $script:D2 = Get-Day 2

    $script:RunArgs = @{
        Cloud = 'gcc'; TenantId = $script:Tenant; AuditFixturePath = $script:AuditPath
        EmergencyConfigPath = (Join-Path $PSScriptRoot 'fixtures/inputs/emergency-access.json')
        ValidationsPath = (Join-Path $PSScriptRoot 'fixtures/inputs/emergency-validations.csv')
        ExceptionsPath = (Join-Path $PSScriptRoot 'fixtures/inputs/exceptions.csv')
        AzureScope = @('/subscriptions/11111111-1111-4111-8111-111111111111', '/providers/Microsoft.Management/managementGroups/contoso-root', '/subscriptions/22222222-2222-4222-8222-222222222222')
        ControlPlaneSubscriptionId = '22222222-2222-4222-8222-222222222222'
    }
    $script:Entry = Join-Path $script:Root 'Invoke-PaEvidenceRun.ps1'
}

Describe 'Chapter 08: "View audit history for Microsoft Entra roles in PIM" queries (Learn), as published' {
    It 'has three Log Analytics queries' {
        $script:Queries.Count | Should -Be 3
        $script:Queries[0] | Should -Match '^AuditLogs'
    }
    It 'the first query finds activations: the model for what to read' {
        $hit = Invoke-LearnKql $script:Queries[0] $script:AuditLogs
        @($hit | Where-Object OperationName -EQ 'Add member to role completed (PIM activation)').Count | Should -Be 3
    }
    It 'the first query mixes role assignments made outside PIM in with activations' {
        $hit = Invoke-LearnKql $script:Queries[0] $script:AuditLogs
        @($hit).Count | Should -Be 13
        @($hit | Where-Object OperationName -In 'Add member to role', 'Add member to role outside of PIM (permanent)').Count | Should -Be 2
    }
    It 'the first query misses deactivations and role setting changes' {
        $hit = @(Invoke-LearnKql $script:Queries[0] $script:AuditLogs | ForEach-Object Id)
        $missed = @($script:AuditLogs | Where-Object { $hit -notcontains $_.Id -and $_.LoggedByService -ne 'Core Directory' })
        @($missed | ForEach-Object OperationName | Sort-Object -Unique) | Should -Be @(
            'Remove member from role (PIM activation expired)', 'Remove member from role completed (PIM deactivate)',
            'Remove member from role requested (PIM deactivate)', 'Update role setting in PIM')
    }
    It 'the second query, as published, holds a placeholder that selects no single request' {
        # Read as whole terms, the placeholder matches the detail's key name, so every event that
        # carries a request ID comes back (13 here), not one cycle. Real KQL "has" on a braced
        # literal wasn't checked in a workspace (research gaps).
        $script:Queries[1] | Should -Match '\{roleAssignmentRequestId\}'
        $all = @($script:AuditLogs | Where-Object { $_.AdditionalDetails -match 'roleAssignmentRequestId' })
        @(Invoke-LearnKql $script:Queries[1] $script:AuditLogs).Count | Should -Be $all.Count
        $all.Count | Should -Be 13
    }
    It 'with a real request ID, the second query finds one activation cycle across correlation IDs' {
        $hit = @(Invoke-LearnKql ($script:Queries[1].Replace('{roleAssignmentRequestId}', $script:Req1)) $script:AuditLogs)
        $hit.Count | Should -Be 5
        @($hit | ForEach-Object CorrelationId | Sort-Object -Unique).Count | Should -Be 3
    }
    It 'the third query adds the events that share a correlation ID but not the request ID' {
        $two = @(Invoke-LearnKql ($script:Queries[1].Replace('{roleAssignmentRequestId}', $script:Req2)) $script:AuditLogs)
        $three = @(Invoke-LearnKql ($script:Queries[2].Replace('{roleAssignmentRequestId}', $script:Req2)) $script:AuditLogs)
        $two.Count | Should -Be 4
        $three.Count | Should -Be 5
    }
    It 'works one request at a time, with no window, tier or approval check' {
        foreach ($q in $script:Queries) { $q | Should -Not -Match 'TimeGenerated|ago\(|between' }
    }
}

Describe 'Chapter 08: permissions and the reader' {
    It 'the audit read needs AuditLog.Read.All and nothing else' {
        (Get-PaEvidencePermission -Task pim-audit).GraphPermissions | Should -Be @('AuditLog.Read.All')
    }
    It 'the evidence run needs the union of the three tasks, none of them a write' {
        $p = Get-PaEvidencePermission -Task evidence-run
        $p.GraphPermissions | Should -Be @('AuditLog.Read.All', 'GroupMember.ReadBasic.All', 'Policy.Read.All', 'RoleAssignmentSchedule.Read.Directory',
            'RoleEligibilitySchedule.Read.Directory', 'RoleManagement.Read.Directory', 'User.Read.All', 'User.ReadBasic.All', 'UserAuthenticationMethod.Read.All')
        $p.AzureRoles | Should -Be @('Reader')
        @($p.GraphPermissions | Where-Object { $_ -match 'Write' }).Count | Should -Be 0
    }
    It 'every call in calls-ch08.json is a GET with its permission and Learn page' {
        foreach ($c in Get-PaEvidenceCall) {
            $c.method | Should -Be 'GET'
            $c.permissions | Should -Not -BeNullOrEmpty
            $c.learn | Should -Match '^https://learn\.microsoft\.com/'
        }
    }
    It 'refuses a call the audit task does not declare' {
        $r = New-Reader
        { Invoke-PaList -Reader $r.Reader -CallId 'ca-policies' } | Should -Throw '*Undeclared call*'
    }
    It 'sends three filtered GETs on the cloud''s own Graph host and follows every page' {
        $r = New-Reader -PageSize 1
        $events = Get-PaPimAuditEvent -Reader $r.Reader -Since ([datetime]'2026-10-28T06:00:00Z') -Until ([datetime]'2026-10-29T06:00:00Z')
        @($events).Count | Should -Be 10
        $r.Reader.Evidence.Count | Should -Be 12
        foreach ($e in $r.Reader.Evidence) { $e.Method | Should -Be 'GET'; $e.Uri | Should -BeLike 'https://graph.microsoft.com/v1.0/auditLogs/directoryAudits?*' }
        $uris = @($r.Reader.Evidence | ForEach-Object { [Uri]::UnescapeDataString($_.Uri) })
        @($uris | Where-Object { $_ -like "*loggedByService eq 'Privileged Identity Management'*" }).Count | Should -Be 10
        @($uris | Where-Object { $_ -like "*loggedByService eq 'PIM'*" }).Count | Should -Be 1
        @($uris | Where-Object { $_ -like "*activityDisplayName eq 'Add member to role'*" }).Count | Should -Be 1
    }
    It 'refuses a window that starts more than 30 days before the run, and one that ends before it starts' {
        $r = New-Reader
        { Get-PaPimAuditEvent -Reader $r.Reader -Since ([datetime]'2026-09-01T00:00:00Z') -Until ([datetime]'2026-10-30T00:00:00Z') } | Should -Throw '*30 days*'
        { Get-PaPimAuditEvent -Reader $r.Reader -Since ([datetime]'2026-10-30T00:00:00Z') -Until ([datetime]'2026-10-29T00:00:00Z') } | Should -Throw '*ends*before*'
    }
    It 'the fake refuses a filter it does not know' {
        $r = New-Reader
        { & $r.Fake.Invoke 'GET' "https://graph.microsoft.com/v1.0/auditLogs/directoryAudits?`$filter=category eq 'RoleManagement'" } | Should -Throw '*filter term*'
    }
}

Describe 'Chapter 08: the PIM audit evidence' {
    It 'keeps IDs and drops names from every event' {
        $text = $script:D2.Events | ConvertTo-Json -Depth 5
        $text | Should -Not -Match '@contoso|Hank Soto|Lee Moss|displayName'
        ($script:D2.Events | Where-Object Class -EQ 'OutsidePim').PrincipalId | Select-Object -Unique | Should -Be $script:Hank
    }
    It 'reads only PIM events and outside-PIM role assignments in the window' {
        @($script:D1.Events).Count | Should -Be 10
        @($script:D1.Events | Where-Object Activity -EQ 'Add member to group').Count | Should -Be 0
        @($script:D2.Events).Count | Should -Be 7
    }
    It 'groups an activation cycle by request ID, joining an event by correlation ID as Learn does' {
        $eli = @(Get-PaActivationRequest -Events $script:D1.Events | Where-Object RequestId -EQ $script:Req2)
        $eli.Count | Should -Be 1
        $eli[0].States | Should -Be @('Requested', 'Approved', 'Activated', 'DeactivationRequested', 'Deactivated')
        $eli[0].Events.Count | Should -Be 5
        $eli[0].Tier | Should -Be 'T1'
    }
    It 'finds nothing on day 1: both activations approved by someone else' {
        @($script:D1.Audit.Findings).Count | Should -Be 0
        $script:D1.Audit.Summary.approved | Should -Be 2
        $script:D1.Audit.Summary.activationsByTier.T0 | Should -Be 1
    }
    It 'PA-AUD-01: Privileged Role Administrator assigned outside PIM, once for the two events' {
        $f = @($script:D2.Audit.Findings | Where-Object Rule -EQ 'PA-AUD-01')
        $f.Count | Should -Be 1
        $f[0].Severity | Should -Be 'Finding'; $f[0].Tier | Should -Be 'T0'; $f[0].ObjectId | Should -Be $script:Hank
    }
    It 'PA-AUD-02: a Global Administrator activation with no approval' {
        $f = @($script:D2.Audit.Findings | Where-Object Rule -EQ 'PA-AUD-02')
        $f.Count | Should -Be 1
        $f[0].ObjectId | Should -Be $script:Lee
    }
    It 'PA-AUD-03: an approval by the requester' {
        $ev = @($script:D1.Events | ForEach-Object { $_.PSObject.Copy() })
        ($ev | Where-Object { $_.Class -eq 'Approved' -and $_.RequestId -eq $script:Req1 }).InitiatorId = 'a0000000-0000-4000-8000-000000000006'
        $a = Test-PaPimAudit -Events $ev -Since ([datetime]'2026-10-28T06:00:00Z') -Until ([datetime]'2026-10-29T06:00:00Z')
        @($a.Findings | Where-Object Rule -EQ 'PA-AUD-03').Count | Should -Be 1
    }
    It 'PA-AUD-04: the Global Administrator role setting changed in PIM' {
        $f = @($script:D2.Audit.Findings | Where-Object Rule -EQ 'PA-AUD-04')
        $f.Count | Should -Be 1
        $f[0].ObjectId | Should -Be '62e90394-69f5-4237-9190-012177145e10'
    }
    It 'a T2 role assigned outside PIM is a Warn' {
        $ev = @($script:D2.Events | ForEach-Object { $_.PSObject.Copy() })
        $ev | Where-Object Class -EQ 'OutsidePim' | ForEach-Object { $_.RoleId = '729827e3-9c14-49f7-bb1b-9608f156bbb8' }
        $a = Test-PaPimAudit -Events $ev -Since ([datetime]'2026-10-29T06:00:00Z') -Until ([datetime]'2026-10-30T06:00:00Z')
        ($a.Findings | Where-Object Rule -EQ 'PA-AUD-01').Severity | Should -Be 'Warn'
    }
    It 'finding issues name roles and IDs, never people' {
        ($script:D2.Audit.Findings | ConvertTo-Json) | Should -Not -Match '@|Hank|Alex|Lee'
    }
}

Describe 'Chapter 08: the evidence run' {
    BeforeAll {
        $script:Out = Join-Path $TestDrive 'runs'
        & $script:Entry @script:RunArgs -AsOf ([datetime]'2026-10-29T06:00:00Z') -FixturePath $script:Fixture -OutputPath $script:Out | Out-Null
        & $script:Entry @script:RunArgs -AsOf ([datetime]'2026-10-30T06:00:00Z') -FixturePath $script:Day2 -OutputPath $script:Out | Out-Null
        $script:Run2 = Join-Path $script:Out '2026-10-30T0600Z-fixture'
        $script:Index = Get-Content (Join-Path $script:Run2 'run.json') -Raw | ConvertFrom-Json
    }
    It 'has no default cloud and needs a tenant ID' {
        $p = (Get-Command $script:Entry).Parameters
        foreach ($n in 'Cloud', 'TenantId') { $p[$n].Attributes.Where({ $_ -is [Parameter] }).Mandatory | Should -BeTrue }
    }
    It 'writes run.json with the tenant, the window and each task''s manifest hash' {
        $script:Index.tenantId | Should -Be $script:Tenant
        [IO.File]::ReadAllText((Join-Path $script:Run2 'run.json')) | Should -Match '"since": "2026-10-29T06:00:00Z"'
        foreach ($t in 'inventory', 'emergency-access', 'pim-audit') {
            $row = $script:Index.tasks.$t
            $row.status | Should -Be 'OK'
            (Get-FileHash (Join-Path $script:Run2 "$($row.folder)/manifest.json")).Hash.ToLowerInvariant() | Should -Be $row.manifestSha256
        }
    }
    It 'every task manifest records the tenant and only GET requests' {
        foreach ($f in 'inventory', 'emergency', 'pim-audit') {
            $m = Get-Content (Join-Path $script:Run2 "$f/manifest.json") -Raw | ConvertFrom-Json
            $m.tenantId | Should -Be $script:Tenant
            @($m.requests | Where-Object method -NE 'GET').Count | Should -Be 0
        }
    }
    It 'writes this chapter''s files with LF line endings' {
        foreach ($f in 'run.json', 'pim-audit/events.json', 'pim-audit/manifest.json') {
            [IO.File]::ReadAllText((Join-Path $script:Run2 $f)) | Should -Not -Match "`r"
        }
    }
    It 'refuses to write a run twice' {
        { & $script:Entry @script:RunArgs -AsOf ([datetime]'2026-10-30T06:00:00Z') -FixturePath $script:Day2 -OutputPath $script:Out } | Should -Throw '*written once*'
    }
    It 'records a failed task as Error, leaves no folder for it, and runs the others' {
        $a = $script:RunArgs.Clone(); $a.EmergencyConfigPath = Join-Path $TestDrive 'missing.json'
        $out = Join-Path $TestDrive 'failed'
        & $script:Entry @a -AsOf ([datetime]'2026-10-30T06:00:00Z') -FixturePath $script:Day2 -OutputPath $out -WarningAction SilentlyContinue | Out-Null
        $run = Join-Path $out '2026-10-30T0600Z-fixture'
        $i = Get-Content (Join-Path $run 'run.json') -Raw | ConvertFrom-Json
        $i.tasks.'emergency-access'.status | Should -Be 'Error'
        Test-Path (Join-Path $run 'emergency') | Should -BeFalse
        $i.tasks.inventory.status | Should -Be 'OK'
    }
    It 'matches the fixture runs the drift pipeline compares, file by file' {
        $committed = Join-Path $script:Root '../drift-pipeline/tests/fixtures/pa-runs'
        foreach ($run in '2026-10-29T0600Z-fixture', '2026-10-30T0600Z-fixture') {
            foreach ($f in 'inventory/inventory.json', 'inventory/findings.json', 'emergency/findings.json', 'pim-audit/events.json', 'pim-audit/findings.json', 'pim-audit/requests.json', 'pim-audit/summary.json') {
                $norm = { param($p) $t = [IO.File]::ReadAllText($p); if ($t.Trim()) { $t | ConvertFrom-Json -Depth 50 | ConvertTo-Json -Depth 50 -Compress } else { '' } }
                (& $norm (Join-Path $script:Out "$run/$f")) | Should -Be (& $norm (Join-Path $committed "$run/$f")) -Because "$run/$f"
            }
        }
    }
}
