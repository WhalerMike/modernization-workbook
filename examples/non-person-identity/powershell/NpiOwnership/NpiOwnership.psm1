#Requires -Version 7.1
<#
    NpiOwnership: Chapter 02 of the developer workbook "Building Non-Person Identity".

    The ownership check over Chapter 01's register (two human owners who are enabled members, not
    service principals or guests; a service-management reference that names an active record; an
    application owner for every AD service account), findings with stable IDs, and the orphan rule
    (decision D-N2) as a dry-run plan: disable, never delete, once the identity governance officer
    confirms; a 30-day claim window recorded. Writes happen only in Invoke-NpiOrphanPlan with -Apply,
    through a separate writer whose calls are declared for the orphan-apply task.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot '../NpiCore/NpiCore.psm1') -Force -Global

$script:ClaimWindowDays = 30
$script:MaxPlanAgeDays = 7
$script:OwnerRuleTypes = @('AppRegistration', 'LegacyServicePrincipal')
$script:AdTypes = @('Traditional', 'MSA', 'gMSA', 'dMSA', 'UnknownServiceAccount')
$script:AiNotBuilt = 'Recorded for Chapter 09; not read or checked in this chapter'

function ConvertTo-NpiDate {
    param([string]$Text)
    if (-not $Text) { return $null }
    [datetime]::Parse($Text, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal)
}

function Import-NpiRegister {
    <#
    .SYNOPSIS
        Chapter 01's register, checked against its run manifest: the file's SHA-256 must be the
        one manifest.json records, so the ownership check runs on the evidence the ISSO received.
    .EXAMPLE
        # Load Chapter 01's fixture run from out/inventory.
        $register = Import-NpiRegister -RunPath out/inventory
        $register.Rows.Count
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$RunPath)
    $reg = Join-Path $RunPath 'register.json'; $man = Join-Path $RunPath 'manifest.json'
    foreach ($p in $reg, $man) { if (-not (Test-Path -LiteralPath $p)) { throw "Missing $p; run Chapter 01's Invoke-NpiInventory.ps1 first." } }
    $manifest = Get-Content -LiteralPath $man -Raw | ConvertFrom-Json -AsHashtable
    if ($manifest.task -ne 'inventory') { throw "$man isn't an inventory run." }
    $hash = Get-NpiFileHash -Path $reg
    if ($hash -ne $manifest.files['register.json']) { throw "register.json doesn't match its manifest (SHA-256 $hash); refusing to check a changed register." }
    [pscustomobject]@{ Rows = @(Get-Content -LiteralPath $reg -Raw | ConvertFrom-Json); Manifest = $manifest; Sha256 = $hash }
}

function Import-NpiInput {
    <#
    .SYNOPSIS
        Reads a CSV input file and returns its rows. Returns an empty array when the path is empty
        or the file doesn't exist, so an optional input can be left out.
    .EXAMPLE
        # Read the application owners file from the fixture inputs.
        Import-NpiInput -Path tests/fixtures/inputs/application-owners.csv
    .DESCRIPTION
    #>
    <# A CSV input, or nothing when the path is empty or missing. #>
    param([string]$Path)
    if (-not $Path -or -not (Test-Path -LiteralPath $Path)) { return @() }
    @(Import-Csv -LiteralPath $Path)
}

function Get-NpiPersonCache {
    # Read each person once through the ownership reader, by object ID or UPN.
    param($Reader)
    $cache = @{}
    {
        param([string]$Key)
        if (-not $Key) { return $null }
        if (-not $cache.ContainsKey($Key)) {
            try { $cache[$Key] = Invoke-NpiGetOne -Reader $Reader -CallId 'graph-user' -Bind @{ id = [Uri]::EscapeDataString($Key) } -Query '$select=id,userPrincipalName,userType,accountEnabled' }
            catch { if ("$_" -match '404|does not exist|Request_ResourceNotFound') { $cache[$Key] = $null } else { throw } }
        }
        $cache[$Key]
    }.GetNewClosure()
}

function Test-NpiHumanOwner {
    # Design guidance: an owner counts only if it is a user, a member (not a guest) and enabled.
    param($Person)
    if (-not $Person) { return 'not found' }
    if ($Person.userType -ne 'Member') { return 'guest' }
    if (-not $Person.accountEnabled) { return 'disabled' }
    $null
}

function Test-NpiOwnership {
    <#
    .SYNOPSIS
        Check every identity in the register against the program's ownership rule and return
        @{ Identities; Findings; AiSponsorFields; Evidence }. Findings NPI-OWN-01 to NPI-OWN-09,
        each with a stable ID (rule:identity).
    .EXAMPLE
        # Check Chapter 01's fixture register against the fixture inputs.
        $register = Import-NpiRegister -RunPath out/inventory
        $reader = New-NpiReader -Cloud gcc -Task ownership -Invoke (New-NpiFixtureInvoker -Path tests/fixtures/estate.json -Cloud gcc).Invoke
        $own = Test-NpiOwnership -Reader $reader -Rows $register.Rows -ApplicationOwners (Import-NpiInput tests/fixtures/inputs/application-owners.csv) -ServiceRecords (Import-NpiInput tests/fixtures/inputs/service-records.csv)
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Reader,
        [Parameter(Mandatory)][object[]]$Rows,
        [object[]]$ApplicationOwners = @(),
        [object[]]$ServiceRecords = @(),
        [string]$RecordPattern = '^[A-Z]+-\d+$'
    )
    $person = Get-NpiPersonCache -Reader $Reader
    $records = @{}; foreach ($r in $ServiceRecords) { $records[$r.RecordId] = $r }
    $adOwners = @{}; foreach ($o in $ApplicationOwners) { if ($o.SamAccountName) { $adOwners[$o.SamAccountName] = $o } }
    $f = [Collections.Generic.List[object]]::new()
    $ids = [Collections.Generic.List[object]]::new()
    $ai = [Collections.Generic.List[object]]::new()

    $checkRecord = {
        param($row, [string]$ref, [string]$label)
        if (-not $ref) { $f.Add((New-NpiFinding 'NPI-OWN-06' 'Finding' $row.IdentityId $label 'No service-management reference: set serviceManagementReference (or the owners file''s ApplicationRecord) to the record in the system inventory')); return 'missing' }
        if ($ref -notmatch $RecordPattern) { $f.Add((New-NpiFinding 'NPI-OWN-07' 'Finding' $row.IdentityId $label "Reference '$ref' isn't a record key; it must name a record, not hold free text")); return 'not a record key' }
        if (-not $records.ContainsKey($ref)) { $f.Add((New-NpiFinding 'NPI-OWN-07' 'Finding' $row.IdentityId $label "Reference '$ref' names no record in the system inventory")); return 'unknown record' }
        if ($records[$ref].Status -ne 'Active') { $f.Add((New-NpiFinding 'NPI-OWN-07' 'Finding' $row.IdentityId $label "Record $ref is $($records[$ref].Status)")); return "record $($records[$ref].Status)" }
        'ok'
    }

    foreach ($row in $Rows) {
        $label = "$($row.Name) ($($row.Type))"
        $isAiRecord = $row.ServiceManagementReference -and $records.ContainsKey("$($row.ServiceManagementReference)") -and $records["$($row.ServiceManagementReference)"].IsAI -eq 'true'
        if ($row.Type -in 'AgentIdentity', 'AgentIdentityBlueprint' -or $isAiRecord) {
            $ai.Add([pscustomobject]@{ IdentityId = $row.IdentityId; Name = $row.Name; Type = $row.Type; FederalSponsor = ''; SponsoringGroup = ''; TechnicalOwner = ''; InventoryRecord = "$($row.ServiceManagementReference)"; Status = $script:AiNotBuilt })
            if ($row.Type -in 'AgentIdentity', 'AgentIdentityBlueprint') { continue }
        }

        if ($row.Type -in $script:OwnerRuleTypes) {
            $owners = @("$($row.OwnerIds)" -split '; ' | Where-Object { $_ }); $types = @("$($row.OwnerTypes)" -split '; ' | Where-Object { $_ })
            $valid = 0; $problems = [Collections.Generic.List[string]]::new()
            for ($i = 0; $i -lt $owners.Count; $i++) {
                if ($types[$i] -ne 'user') {
                    $problems.Add("$($owners[$i]) is a $($types[$i])")
                    $f.Add((New-NpiFinding 'NPI-OWN-03' 'Warn' $row.IdentityId $label "Owner $($owners[$i]) is a $($types[$i]), not a person; it doesn't count toward the two"))
                    continue
                }
                $p = & $person $owners[$i]
                $why = Test-NpiHumanOwner $p
                if (-not $why) { $valid++; continue }
                $who = if ($p) { $p.userPrincipalName } else { $owners[$i] }
                $problems.Add("$who is $why")
                $rule = switch ($why) { 'guest' { 'NPI-OWN-04' } default { 'NPI-OWN-05' } }
                $f.Add((New-NpiFinding $rule 'Warn' $row.IdentityId $label "Owner $who is $why; it doesn't count toward the two"))
            }
            if ($valid -eq 0) { $f.Add((New-NpiFinding 'NPI-OWN-01' 'Finding' $row.IdentityId $label 'No valid human owner: an orphan candidate under the orphan rule (D-N2)')) }
            elseif ($valid -eq 1) { $f.Add((New-NpiFinding 'NPI-OWN-02' 'Finding' $row.IdentityId $label 'One valid human owner; the rule is two')) }
            $rec = if ($row.Type -eq 'AppRegistration') { & $checkRecord $row "$($row.ServiceManagementReference)" $label } else { 'n/a (no app registration)' }
            $ids.Add([pscustomobject]@{ IdentityId = $row.IdentityId; Name = $row.Name; Type = $row.Type; Enabled = $row.Enabled; ValidHumanOwners = $valid; OwnerProblems = ($problems -join '; '); ServiceRecord = "$($row.ServiceManagementReference)"; RecordCheck = $rec; OrphanCandidate = ($valid -eq 0); Handoff = "$($row.Handoff)" })
            continue
        }

        if ($row.Type -in $script:AdTypes) {
            if ($row.Note -like 'Detected only by a password that never expires*') {
                $f.Add((New-NpiFinding 'NPI-OWN-09' 'Info' $row.IdentityId $label 'Not checked: confirm it is a service account before the ownership rule applies'))
                continue
            }
            $o = if ($adOwners.ContainsKey($row.Name)) { $adOwners[$row.Name] } else { $null }
            $valid = 0; $problem = ''
            if (-not $o -or -not $o.OwnerUpn) { $problem = 'no application owner in the owners file' }
            else {
                $why = Test-NpiHumanOwner (& $person $o.OwnerUpn)
                if ($why) { $problem = "$($o.OwnerUpn) is $why" } else { $valid = 1 }
            }
            if ($valid -eq 0) { $f.Add((New-NpiFinding 'NPI-OWN-08' 'Finding' $row.IdentityId $label "No valid application owner ($problem): an orphan candidate under the orphan rule (D-N2)")) }
            $rec = & $checkRecord $row "$(if ($o) { $o.ApplicationRecord })" $label
            $ids.Add([pscustomobject]@{ IdentityId = $row.IdentityId; Name = $row.Name; Type = $row.Type; Enabled = $row.Enabled; ValidHumanOwners = $valid; OwnerProblems = $problem; ServiceRecord = "$(if ($o) { $o.ApplicationRecord })"; RecordCheck = $rec; OrphanCandidate = ($valid -eq 0); Handoff = "$($row.Handoff)" })
        }
    }
    [pscustomobject]@{ Identities = $ids.ToArray(); Findings = $f.ToArray(); AiSponsorFields = $ai.ToArray(); Evidence = $Reader.Evidence.ToArray() }
}

function New-NpiOrphanPlan {
    <#
    .SYNOPSIS
        The orphan rule (D-N2) as a dry-run plan. An orphan candidate is disabled, never deleted,
        only after the identity governance officer confirms it in the confirmations log; the claim
        window is 30 days from the disable. Owner nominations become AddOwner actions for app
        registrations, after the nominee is checked. Nothing here writes.
    .EXAMPLE
        # Build the dry-run plan from an ownership result ($own from Test-NpiOwnership).
        $plan = New-NpiOrphanPlan -Reader $reader -Ownership $own -Rows $register.Rows -AsOf '2026-10-30T12:00:00Z' -Cloud gcc -TenantId $register.Manifest.tenantId -RegisterSha256 $register.Sha256 -Confirmations (Import-NpiInput tests/fixtures/inputs/igo-confirmations.csv) -Claims (Import-NpiInput tests/fixtures/inputs/owner-claims.csv)
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Reader,
        [Parameter(Mandatory)]$Ownership,
        [Parameter(Mandatory)][object[]]$Rows,
        [Parameter(Mandatory)][datetime]$AsOf,
        [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][string]$TenantId,
        [string]$RegisterSha256,
        [object[]]$Confirmations = @(),
        [object[]]$Claims = @()
    )
    $graph = (Get-NpiCloud -Cloud $Cloud).Graph
    $person = Get-NpiPersonCache -Reader $Reader
    $byId = @{}; foreach ($r in $Rows) { $byId[$r.IdentityId] = $r }
    $spOf = @{}; foreach ($r in $Rows) { if ($r.Type -eq 'ServicePrincipal' -and $r.AppId) { $spOf[$r.AppId] = $r.ObjectId } }
    $conf = @{}; foreach ($c in $Confirmations) { $conf[$c.IdentityId] = $c }
    $actions = [Collections.Generic.List[object]]::new()
    $merge = { param([hashtable]$A, [hashtable]$B) $m = @{} + $A; foreach ($k in $B.Keys) { $m[$k] = $B[$k] }; $m }
    $add = {
        param([hashtable]$a)
        $base = [ordered]@{ ActionId = ''; IdentityId = ''; Name = ''; Type = ''; Action = ''; Write = $false; Call = ''; Method = ''; Target = ''; Body = $null; Precheck = ''; ConfirmedBy = ''; ConfirmedOn = ''; ClaimWindowEnds = ''; Reason = '' }
        foreach ($k in $a.Keys) { $base[$k] = $a[$k] }
        if (-not $base.ActionId) { $base.ActionId = "$($base.Action):$($base.IdentityId)" }
        $actions.Add([pscustomobject]$base)
    }

    foreach ($id in @($Ownership.Identities | Where-Object OrphanCandidate)) {
        $row = $byId[$id.IdentityId]
        $common = @{ IdentityId = $id.IdentityId; Name = $id.Name; Type = $id.Type }
        if ($id.Handoff -eq 'DataPlatform') { & $add (& $merge $common @{ Action = 'HandedOff'; Reason = 'SQL Server account: the Data Platform plan owns its disposition' }); continue }
        $c = if ($conf.ContainsKey($id.IdentityId)) { $conf[$id.IdentityId] } else { $null }
        if (-not $c -or -not $c.ConfirmedBy -or -not $c.ConfirmedOn) { & $add (& $merge $common @{ Action = 'AwaitConfirmation'; Reason = 'The identity governance officer confirms the finding before anything is disabled' }); continue }
        $common.ConfirmedBy = $c.ConfirmedBy; $common.ConfirmedOn = $c.ConfirmedOn
        # (if, not switch: continue inside a PowerShell switch doesn't leave the foreach)
        if ($c.Decision -eq 'Exception') {
            $ends = ConvertTo-NpiDate $c.ExceptionEnds
            if ($ends -and $ends -gt $AsOf) { & $add (& $merge $common @{ Action = 'Exception'; Reason = "Dated exception until $($ends.ToString('yyyy-MM-dd'))" }) }
            else { & $add (& $merge $common @{ Action = 'ExceptionExpired'; Reason = "The exception ended $($c.ExceptionEnds); a new decision is needed" }) }
            continue
        }
        if ($c.Decision -ne 'Disable') { & $add (& $merge $common @{ Action = 'AwaitConfirmation'; Reason = "Unknown decision '$($c.Decision)'; the log accepts Disable or Exception" }); continue }
        $disabledOn = ConvertTo-NpiDate $c.DisabledOn
        if ($disabledOn) {
            $ends = $disabledOn.AddDays($script:ClaimWindowDays)
            $common.ClaimWindowEnds = $ends.ToString('yyyy-MM-dd')
            if ($row.Enabled -eq $true) { & $add (& $merge $common @{ Action = 'ReEnabledOutsideRule'; Reason = "Recorded as disabled on $($c.DisabledOn) but enabled now; a new confirmation is needed before it is disabled again" }) }
            elseif (@($Claims | Where-Object IdentityId -EQ $id.IdentityId).Count) { & $add (& $merge $common @{ Action = 'ClaimRecorded'; Reason = 'The office named an owner inside the window; re-enabling is a person''s decision, not this code''s' }) }
            elseif ($AsOf -gt $ends) { & $add (& $merge $common @{ Action = 'RetirementCandidate'; Reason = 'The claim window closed with no claim: retire through the reviewed decommission process. This code never deletes.' }) }
            else { & $add (& $merge $common @{ Action = 'ClaimWindowOpen'; Reason = "Disabled; the office has until $($ends.ToString('yyyy-MM-dd')) to name an owner or retire it" }) }
            continue
        }
        if ($row.Enabled -eq $false) { & $add (& $merge $common @{ Action = 'AlreadyDisabled'; Reason = 'Already disabled: record DisabledOn in the confirmations log; the claim window runs from that date' }); continue }
        $window = "$($script:ClaimWindowDays) days after the disable is applied"
        if ($id.Type -in $script:AdTypes) {
            $recheck = if ($id.Type -eq 'Traditional') { 'ad-recheck-user' } else { 'ad-recheck-service-account' }
            & $add (& $merge $common @{ Action = 'Disable'; Write = $true; Call = 'ad-disable-account'; Method = 'WRITE'; Target = "Disable-ADAccount -Identity $($row.ObjectId)"; Precheck = "$recheck`: still enabled"; ClaimWindowEnds = $window; Reason = 'Confirmed orphan: disable, never delete' })
        } else {
            $spId = if ($id.Type -eq 'AppRegistration') { if ($spOf.ContainsKey($row.AppId)) { $spOf[$row.AppId] } else { $null } } else { $row.ObjectId }
            if (-not $spId) { & $add (& $merge $common @{ Action = 'AwaitConfirmation'; Reason = 'No service principal in this tenant to disable; deactivating the app registration is a beta API (research gaps, row 12)' }); continue }
            $ownerCheck = if ($id.Type -eq 'AppRegistration') { "graph-application-owners $($row.ObjectId): still no owner" } else { "graph-service-principal-owners $spId`: still no owner" }
            & $add (& $merge $common @{ Action = 'Disable'; Write = $true; Call = 'graph-sp-disable'; Method = 'PATCH'; Target = "$graph/v1.0/servicePrincipals/$spId"; Body = [ordered]@{ accountEnabled = $false }; Precheck = $ownerCheck; ClaimWindowEnds = $window; Reason = 'Confirmed orphan: sign-in disabled in this tenant (accountEnabled false), never deleted' })
        }
    }

    foreach ($cl in $Claims) {
        $row = if ($byId.ContainsKey($cl.IdentityId)) { $byId[$cl.IdentityId] } else { $null }
        if (-not $row) { & $add @{ ActionId = "NomineeRefused:$($cl.IdentityId):$($cl.NomineeUpn)"; IdentityId = $cl.IdentityId; Action = 'NomineeRefused'; Reason = 'No such identity in the register' }; continue }
        $common = @{ IdentityId = $row.IdentityId; Name = $row.Name; Type = $row.Type; ActionId = "AddOwner:$($row.IdentityId):$($cl.NomineeUpn)" }
        if ($row.Type -ne 'AppRegistration') {
            & $add (& $merge $common @{ ActionId = "RecordOwner:$($row.IdentityId):$($cl.NomineeUpn)"; Action = 'RecordOwner'; Reason = "Record $($cl.NomineeUpn) in the owners file in a reviewed change; there is no owner to add in the directory for a $($row.Type)" }); continue
        }
        $p = & $person $cl.NomineeUpn
        $why = Test-NpiHumanOwner $p
        if ($why) { & $add (& $merge $common @{ ActionId = "NomineeRefused:$($row.IdentityId):$($cl.NomineeUpn)"; Action = 'NomineeRefused'; Reason = "$($cl.NomineeUpn) is $why; owners are enabled members" }); continue }
        if (@("$($row.OwnerIds)" -split '; ') -contains $p.id) { & $add (& $merge $common @{ Action = 'AlreadyOwner'; Reason = "$($cl.NomineeUpn) already owns it" }); continue }
        & $add (& $merge $common @{ Action = 'AddOwner'; Write = $true; Call = 'graph-app-owner-add'; Method = 'POST'; Target = "$graph/v1.0/applications/$($row.ObjectId)/owners/`$ref"; Body = [ordered]@{ '@odata.id' = "$graph/v1.0/directoryObjects/$($p.id)" }; Precheck = "graph-application-owners $($row.ObjectId): not already an owner"; Reason = "Claimed by $($cl.ClaimedBy) on $($cl.ClaimedOn)" })
    }

    [pscustomobject][ordered]@{
        planVersion = 1; task = 'orphan-apply'; generated = $AsOf.ToString('o'); asOf = $AsOf.ToString('yyyy-MM-dd'); cloud = $Cloud; tenantId = $TenantId
        registerSha256 = $RegisterSha256; claimWindowDays = $script:ClaimWindowDays
        actions = $actions.ToArray()
    }
}

# ----------------------------------------------------------------------------- the reviewed write path

function New-NpiWriter {
    <#
    .SYNOPSIS
        The writer for the orphan-apply task: the only object in this example that can send a
        PATCH, a POST or Disable-ADAccount, and only the calls calls.json declares for that task.
    .EXAMPLE
        # A writer over the fake Graph and fake AD, which accept writes only with -AllowWrite.
        $fake = New-NpiFixtureInvoker -Path tests/fixtures/estate.json -Cloud gcc -AllowWrite
        $fakeAd = New-NpiFixtureAdInvoker -Path tests/fixtures/estate.json -AllowWrite
        $writer = New-NpiWriter -Cloud gcc -TenantId c0ffee00-0000-4000-8000-000000000001 -Invoke $fake.Invoke -AdInvoke $fakeAd.Invoke
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][string]$TenantId, [Parameter(Mandatory)][scriptblock]$Invoke, [scriptblock]$AdInvoke)
    $decl = Get-NpiTask -Task 'orphan-apply'
    if ($decl.mode -ne 'write') { throw 'orphan-apply must be declared as a write task.' }
    [pscustomobject]@{ Cloud = Get-NpiCloud -Cloud $Cloud; TenantId = $TenantId; Task = 'orphan-apply'; Calls = Get-NpiCall -Task 'orphan-apply'; Invoke = $Invoke; AdInvoke = $AdInvoke; Evidence = [Collections.Generic.List[object]]::new() }
}

function Assert-NpiPlannedWrite {
    <#
    .SYNOPSIS
        Throws unless a plan action is a write declared for the orphan-apply task, with the declared
        method, the expected target shape and, for a disable, the only allowed body. Returns nothing
        when the action passes.
    .EXAMPLE
        # Check every write in a saved orphan plan before anything is sent.
        $plan = Get-Content -LiteralPath out/ownership/orphan-plan.json -Raw | ConvertFrom-Json
        foreach ($a in @($plan.actions | Where-Object Write)) { Assert-NpiPlannedWrite -Writer $writer -Action $a }
    #>

    # Every write must be a declared orphan-apply call, with the method and the body the call list allows.
    param($Writer, $Action)
    $call = $Writer.Calls | Where-Object { $_.id -eq $Action.Call }
    if (-not $call) { throw "Action $($Action.ActionId): '$($Action.Call)' isn't declared for orphan-apply." }
    if ($call.method -ne $Action.Method) { throw "Action $($Action.ActionId): $($Action.Method) doesn't match the declared $($call.method)." }
    if ($Action.Method -in 'DELETE', 'PUT') { throw "Action $($Action.ActionId): $($Action.Method) is never sent; the orphan rule disables, it doesn't delete." }
    $g = $Writer.Cloud.Graph
    switch ($call.id) {
        'graph-sp-disable' {
            if ($Action.Target -notmatch "^$([regex]::Escape($g))/v1\.0/servicePrincipals/[0-9a-f-]{36}$") { throw "Action $($Action.ActionId): unexpected target $($Action.Target)" }
            $b = if ($Action.Body -is [Collections.IDictionary]) { [pscustomobject]$Action.Body } else { $Action.Body }
            $keys = @($b.PSObject.Properties.Name)
            if ($keys.Count -ne 1 -or $keys[0] -ne 'accountEnabled' -or $b.accountEnabled -ne $false) { throw "Action $($Action.ActionId): the only body allowed is {""accountEnabled"": false}." }
        }
        'graph-app-owner-add' {
            if ($Action.Target -notmatch "^$([regex]::Escape($g))/v1\.0/applications/[0-9a-f-]{36}/owners/\`$ref$") { throw "Action $($Action.ActionId): unexpected target $($Action.Target)" }
            if ("$($Action.Body.'@odata.id')" -notmatch "^$([regex]::Escape($g))/v1\.0/directoryObjects/[0-9a-f-]{36}$") { throw "Action $($Action.ActionId): @odata.id must be a directory object on $g." }
        }
        'ad-disable-account' {
            if ($Action.Target -notmatch '^Disable-ADAccount -Identity [0-9a-f-]{36}$') { throw "Action $($Action.ActionId): unexpected target $($Action.Target)" }
        }
        default { throw "Action $($Action.ActionId): no rule for $($call.id)." }
    }
}

function Invoke-NpiWriterGet {
    param($Writer, [string]$CallId, [string]$Uri)
    $call = $Writer.Calls | Where-Object { $_.id -eq $CallId -and $_.method -eq 'GET' }
    if (-not $call) { throw "'$CallId' isn't a declared orphan-apply read." }
    Assert-NpiHost -Uri $Uri -ExpectedHost $Writer.Cloud.Graph
    $Writer.Evidence.Add([pscustomobject]@{ Call = $CallId; Method = 'GET'; Target = $Uri; At = [DateTime]::UtcNow.ToString('o') })
    $items = [Collections.Generic.List[object]]::new()
    while ($Uri) {
        $body = & $Writer.Invoke 'GET' $Uri $null $null
        foreach ($v in @($body['value'])) { if ($null -ne $v) { $items.Add($v) } }
        $Uri = if ($body.ContainsKey('@odata.nextLink')) { $body['@odata.nextLink'] } else { $null }
        if ($Uri) { Assert-NpiHost -Uri $Uri -ExpectedHost $Writer.Cloud.Graph; $Writer.Evidence.Add([pscustomobject]@{ Call = $CallId; Method = 'GET'; Target = $Uri; At = [DateTime]::UtcNow.ToString('o') }) }
    }
    $items.ToArray()
}

function Invoke-NpiOrphanPlan {
    <#
    .SYNOPSIS
        Apply a reviewed orphan plan. Without -Apply it is a dry run: it checks the plan and runs
        every precheck, and sends nothing. With -Apply it sends only the plan's writes, only if
        the plan file's SHA-256 is the one the reviewer approved, the plan is for this tenant and
        cloud and no older than seven days, and each precheck still holds.
    .EXAMPLE
        # A dry run of the reviewed plan against the fake; add -Apply to send the writes.
        $sha = (Get-FileHash -Algorithm SHA256 -LiteralPath out/ownership/orphan-plan.json).Hash
        $run = Invoke-NpiOrphanPlan -PlanPath out/ownership/orphan-plan.json -ApprovedSha256 $sha -Writer $writer -AsOf '2026-10-30T12:00:00Z'
        $run.Results | Format-Table Outcome, Action, Target
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$PlanPath,
        [Parameter(Mandatory)][string]$ApprovedSha256,
        [Parameter(Mandatory)]$Writer,
        [Parameter(Mandatory)][datetime]$AsOf,
        [switch]$Apply
    )
    $hash = Get-NpiFileHash -Path $PlanPath
    if ($hash -ne $ApprovedSha256.ToLowerInvariant()) { throw "The plan's SHA-256 is $hash, not the approved $ApprovedSha256; refusing to run a plan nobody reviewed." }
    $plan = Get-Content -LiteralPath $PlanPath -Raw | ConvertFrom-Json
    if ($plan.task -ne 'orphan-apply') { throw 'Not an orphan plan.' }
    if ($plan.tenantId -ne $Writer.TenantId) { throw "The plan is for tenant $($plan.tenantId), not $($Writer.TenantId)." }
    if ($plan.cloud -ne $Writer.Cloud.Name) { throw "The plan is for cloud $($plan.cloud), not $($Writer.Cloud.Name)." }
    $generated = ConvertTo-NpiDate $plan.generated
    if (($AsOf - $generated).TotalDays -gt $script:MaxPlanAgeDays) { throw "The plan is $([int]($AsOf - $generated).TotalDays) days old; build and review a new one (the limit is $($script:MaxPlanAgeDays))." }

    $results = [Collections.Generic.List[object]]::new()
    foreach ($a in @($plan.actions | Where-Object Write)) {
        Assert-NpiPlannedWrite -Writer $Writer -Action $a
        $outcome = $null; $detail = ''
        switch ($a.Call) {
            'graph-sp-disable' {
                $owners = if ($a.Precheck -match '^graph-application-owners ([0-9a-f-]{36})') { Invoke-NpiWriterGet $Writer 'graph-application-owners' "$($Writer.Cloud.Graph)/v1.0/applications/$($Matches[1])/owners?`$select=id" }
                elseif ($a.Precheck -match '^graph-service-principal-owners ([0-9a-f-]{36})') { Invoke-NpiWriterGet $Writer 'graph-service-principal-owners' "$($Writer.Cloud.Graph)/v1.0/servicePrincipals/$($Matches[1])/owners?`$select=id" }
                else { throw "Action $($a.ActionId): no owner precheck." }
                if (@($owners).Count) { $outcome = 'Skipped'; $detail = 'An owner was added since the plan was reviewed; check ownership again' }
            }
            'graph-app-owner-add' {
                if ($a.Precheck -notmatch '^graph-application-owners ([0-9a-f-]{36})') { throw "Action $($a.ActionId): no owner precheck." }
                $owners = Invoke-NpiWriterGet $Writer 'graph-application-owners' "$($Writer.Cloud.Graph)/v1.0/applications/$($Matches[1])/owners?`$select=id"
                $nominee = ("$($a.Body.'@odata.id')" -split '/')[-1]
                if (@($owners | Where-Object { $_.id -eq $nominee }).Count) { $outcome = 'Skipped'; $detail = 'Already an owner' }
            }
            'ad-disable-account' {
                $guid = ($a.Target -split ' ')[-1]
                $recheck = if ($a.Precheck -like 'ad-recheck-user*') { 'ad-recheck-user' } else { 'ad-recheck-service-account' }
                $call = $Writer.Calls | Where-Object id -EQ $recheck
                $Writer.Evidence.Add([pscustomobject]@{ Call = $recheck; Method = 'READ'; Target = "$($call.cmdlet) -Identity $guid"; At = [DateTime]::UtcNow.ToString('o') })
                $o = & $Writer.AdInvoke $call.cmdlet @{ Identity = $guid; Properties = @('Enabled') }
                if (-not $o.Enabled) { $outcome = 'Skipped'; $detail = 'Already disabled' }
            }
        }
        if (-not $outcome) {
            if (-not $Apply) { $outcome = 'WouldSend' }
            else {
                $Writer.Evidence.Add([pscustomobject]@{ Call = $a.Call; Method = $a.Method; Target = $a.Target; At = [DateTime]::UtcNow.ToString('o') })
                if ($a.Call -eq 'ad-disable-account') { & $Writer.AdInvoke 'Disable-ADAccount' @{ Identity = ($a.Target -split ' ')[-1] } | Out-Null }
                else {
                    Assert-NpiHost -Uri $a.Target -ExpectedHost $Writer.Cloud.Graph
                    $body = @{}; foreach ($p in $a.Body.PSObject.Properties) { $body[$p.Name] = $p.Value }
                    $null = & $Writer.Invoke $a.Method $a.Target $body $null
                }
                $outcome = 'Sent'
                if ($a.Action -eq 'Disable') { $detail = "Record DisabledOn $($AsOf.ToString('yyyy-MM-dd')) in the confirmations log; the claim window ends $($AsOf.AddDays($plan.claimWindowDays).ToString('yyyy-MM-dd'))" }
            }
        }
        $results.Add([pscustomobject]@{ ActionId = $a.ActionId; Action = $a.Action; Name = $a.Name; Method = $a.Method; Target = $a.Target; Outcome = $outcome; Detail = $detail })
    }
    [pscustomobject]@{ PlanSha256 = $hash; Mode = $(if ($Apply) { 'Apply' } else { 'DryRun' }); Results = $results.ToArray(); Evidence = $Writer.Evidence.ToArray() }
}

Export-ModuleMember -Function Import-NpiRegister, Import-NpiInput, Test-NpiOwnership, New-NpiOrphanPlan, New-NpiWriter, Assert-NpiPlannedWrite, Invoke-NpiOrphanPlan
