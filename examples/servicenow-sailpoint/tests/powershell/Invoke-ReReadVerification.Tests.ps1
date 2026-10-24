#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Re-read before close: verified closes with evidence, mismatch reopens, stale waits.

BeforeAll {
    $script:Kit = Resolve-Path (Join-Path -Path $PSScriptRoot -ChildPath '../..')
    Import-Module (Join-Path -Path $script:Kit -ChildPath 'clients/powershell/IdentityKit.psm1') -Force
    $script:Cfg = @{
        SAILPOINT_TENANT = 'example'; SAILPOINT_CLIENT_ID = 'isc-client'; SN_INSTANCE = 'contoso'
        SN_STATE_AWAITING_VERIFICATION = '18'; SN_STATE_CLOSED = '3'; SN_STATE_REOPENED = '1'; GRAPH_CLOUD = 'Global'
    }
    $script:Now = [datetime]::new(2026, 10, 24, 12, 0, 0, [DateTimeKind]::Utc)

    function Get-TestRecord([hashtable]$Over = @{}) {
        $r = @{
            sys_id = 'sys1'; number = 'IDF0001001'; state = '18'; u_system = 'isc_account'; u_account_id = 'acc1'
            u_intended_state = '{"disabled":true}'; u_awaiting_since = '2026-10-24 10:00:00'
        }
        foreach ($k in $Over.Keys) { $r[$k] = $Over[$k] }
        return [pscustomobject]$r
    }
    function Get-TestAccount([bool]$Disabled, [string]$Modified = '2026-10-24T11:00:00Z') {
        [pscustomobject]@{ id = 'acc1'; disabled = $Disabled; modified = $Modified; attributes = [pscustomobject]@{} }
    }
    function Get-HttpError([int]$Status) {
        [Microsoft.PowerShell.Commands.HttpResponseException]::new("HTTP $Status", [System.Net.Http.HttpResponseMessage]::new([System.Net.HttpStatusCode]$Status))
    }
    function Invoke-Verify($Records, [switch]$Apply, [datetime]$At = $script:Now) {
        Invoke-KitReReadVerification -Record $Records -Config $script:Cfg -Table 'u_identity_finding' -Apply:$Apply -Now $At -InformationAction SilentlyContinue
    }
}

Describe 'Compare-KitIntendedState' {
    It 'applies each rule' {
        $obs = [ordered]@{ exists = $true; observed = [pscustomobject]@{ disabled = $true; attributes = [pscustomobject]@{ memberOf = @('CN=A', 'CN=B'); title = 'X' } } }
        @(Compare-KitIntendedState -Intended @{ disabled = $true } -Observation $obs).Count | Should -Be 0
        @(Compare-KitIntendedState -Intended @{ attributes = @{ title = 'Y' } } -Observation $obs).Count | Should -Be 1
        @(Compare-KitIntendedState -Intended @{ entitlements_absent = @(@{ attribute = 'memberOf'; value = 'CN=A' }) } -Observation $obs).Count | Should -Be 1
        @(Compare-KitIntendedState -Intended @{ entitlements_present = @(@{ attribute = 'memberOf'; value = 'CN=B' }) } -Observation $obs).Count | Should -Be 0
        @(Compare-KitIntendedState -Intended @{ exists = $false } -Observation ([ordered]@{ exists = $false; observed = $null })).Count | Should -Be 0
        @(Compare-KitIntendedState -Intended @{ disabled = $true } -Observation ([ordered]@{ exists = $false; observed = $null })) | Should -Be @('subject not found')
    }
}

Describe 'Invoke-KitReReadVerification' {
    It 'lists awaiting records by state' {
        Mock Invoke-RestMethod -ModuleName IdentityKit { [pscustomobject]@{ result = @((Get-TestRecord)) } }
        @(Get-KitAwaitingRecord -Config $script:Cfg -Table 'u_identity_finding').Count | Should -Be 1
        Should -Invoke Invoke-RestMethod -ModuleName IdentityKit -ParameterFilter { $Uri -like '*sysparm_query=state%3D18*' }
    }
    It 'is a dry run by default' {
        Mock Invoke-RestMethod -ModuleName IdentityKit { Get-TestAccount $true } -ParameterFilter { $Uri -like '*/v3/accounts/acc1' }
        Mock Invoke-RestMethod -ModuleName IdentityKit { throw 'no writes in a dry run' } -ParameterFilter { $Method -ne 'GET' }
        $r = @(Invoke-Verify @((Get-TestRecord)))
        $r[0].outcome | Should -Be 'verified'
        $r[0].applied | Should -BeFalse
    }
    It 'previews with -WhatIf even when -Apply is given' {
        Mock Invoke-RestMethod -ModuleName IdentityKit { Get-TestAccount $true } -ParameterFilter { $Method -eq 'GET' }
        Mock Invoke-RestMethod -ModuleName IdentityKit { throw 'no writes under WhatIf' } -ParameterFilter { $Method -ne 'GET' }
        $r = @(Invoke-KitReReadVerification -Record @((Get-TestRecord)) -Config $script:Cfg -Table 't' -Apply -WhatIf -Now $script:Now -InformationAction SilentlyContinue)
        $r[0].applied | Should -BeFalse
    }
    It 'closes with evidence and an attachment when the re-read matches' {
        $script:patches = @()
        $script:posts = @()
        Mock Invoke-RestMethod -ModuleName IdentityKit { Get-TestAccount $true } -ParameterFilter { $Method -eq 'GET' }
        Mock Invoke-RestMethod -ModuleName IdentityKit { $script:patches += $Body; @{} } -ParameterFilter { $Method -eq 'PATCH' }
        Mock Invoke-RestMethod -ModuleName IdentityKit { $script:posts += $Uri; @{} } -ParameterFilter { $Method -eq 'POST' }
        $r = @(Invoke-Verify @((Get-TestRecord)) -Apply)
        $r[0].outcome | Should -Be 'verified'
        $patch = $script:patches[0] | ConvertFrom-Json
        $patch.state | Should -Be '3'
        $patch.u_evidence_hash | Should -Be $r[0].evidence_sha256
        $ev = $patch.u_evidence | ConvertFrom-Json -DateKind String
        $ev.query | Should -Be 'GET /v3/accounts/acc1'
        $ev.checked_at | Should -Be '2026-10-24T12:00:00Z'
        $script:posts[0] | Should -BeLike '*/api/now/attachment/file?table_name=u_identity_finding&table_sys_id=sys1&file_name=reread-evidence-IDF0001001.json'
    }
    It 'reopens with a work note when the re-read does not match' {
        $script:patches = @()
        Mock Invoke-RestMethod -ModuleName IdentityKit { Get-TestAccount $false } -ParameterFilter { $Method -eq 'GET' }
        Mock Invoke-RestMethod -ModuleName IdentityKit { $script:patches += $Body; @{} } -ParameterFilter { $Method -eq 'PATCH' }
        Mock Invoke-RestMethod -ModuleName IdentityKit { throw 'no attachment on mismatch' } -ParameterFilter { $Method -eq 'POST' }
        $r = @(Invoke-Verify @((Get-TestRecord)) -Apply)
        $r[0].outcome | Should -Be 'mismatch'
        $patch = $script:patches[0] | ConvertFrom-Json
        $patch.state | Should -Be '1'
        $patch.work_notes | Should -BeLike '*disabled*'
    }
    It 'waits on a stale ISC read until the grace period ends' {
        Mock Invoke-RestMethod -ModuleName IdentityKit { Get-TestAccount $false '2026-10-24T09:00:00Z' } -ParameterFilter { $Method -eq 'GET' }
        Mock Invoke-RestMethod -ModuleName IdentityKit { @{} } -ParameterFilter { $Method -eq 'PATCH' }
        (@(Invoke-Verify @((Get-TestRecord)) -Apply))[0].outcome | Should -Be 'pending'
        Should -Invoke Invoke-RestMethod -ModuleName IdentityKit -Times 0 -ParameterFilter { $Method -eq 'PATCH' }
        $late = [datetime]::new(2026, 10, 26, 12, 0, 0, [DateTimeKind]::Utc)
        (@(Invoke-Verify @((Get-TestRecord)) -Apply -At $late))[0].outcome | Should -Be 'mismatch'
    }
    It 're-reads identities through ISC Search and users through Graph' {
        Mock Invoke-RestMethod -ModuleName IdentityKit { @([pscustomobject]@{ id = 'id1'; attributes = [pscustomobject]@{ department = 'Finance' } }) } -ParameterFilter { $Uri -like '*/v3/search*' }
        Mock Invoke-RestMethod -ModuleName IdentityKit { [pscustomobject]@{ id = 'u1'; accountEnabled = $false } } -ParameterFilter { $Uri -like 'https://graph.microsoft.com/v1.0/users/u1*' }
        $ident = Get-TestRecord @{ u_system = 'isc_identity'; u_account_id = ''; u_identity_id = 'id1'; u_intended_state = '{"attributes":{"department":"Finance"}}' }
        $user = Get-TestRecord @{ u_system = 'entra_user'; u_subject_id = 'u1'; u_intended_state = '{"accountEnabled":false}' }
        @(Invoke-Verify @($ident, $user)).outcome | Should -Be @('verified', 'verified')
        Should -Invoke Invoke-RestMethod -ModuleName IdentityKit -ParameterFilter { $Uri -like '*/v3/search*' -and ($Body | ConvertFrom-Json).query.query -eq 'id:"id1"' }
    }
    It 'treats a 404 as "does not exist"' {
        Mock Invoke-RestMethod -ModuleName IdentityKit { throw (Get-HttpError 404) } -ParameterFilter { $Method -eq 'GET' }
        (@(Invoke-Verify @((Get-TestRecord @{ u_intended_state = '{"exists":false}' }))))[0].outcome | Should -Be 'verified'
    }
    It 'skips a record with no intended state' {
        (@(Invoke-Verify @((Get-TestRecord @{ u_intended_state = '' })) -Apply))[0].outcome | Should -Be 'skipped'
    }
}
