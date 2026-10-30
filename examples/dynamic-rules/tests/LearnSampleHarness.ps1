# Runs one of Learn's pinned dynamic membership samples offline, against a fake tenant.
# The sample's own code is extracted, unmodified, from the pinned Learn source page; only the
# commands it calls outside itself (Read-Host, Write-Host, Start-Sleep, and the Microsoft Graph
# PowerShell cmdlets) are replaced by fakes defined here. Nothing signs in or calls a network.

function Get-LearnSampleScript {
    <# The first ```powershell block after "## Sample script" in a pinned Learn source page. #>
    param([Parameter(Mandatory)][string]$Page)
    $text = [IO.File]::ReadAllText($Page) -replace "`r`n", "`n"
    $m = [regex]::Match($text, '(?s)## Sample script\s*\n```powershell\n(.*?)\n```')
    if (-not $m.Success) { throw "No sample script block in $Page" }
    $m.Groups[1].Value
}

function New-FakeTenant {
    <# Collections keyed by id: @{ id; displayName; kind = 'group'|'au'; state = 'On'|'Paused' }. #>
    param([object[]]$Collections, [int]$ThrottleCount = 0)
    [pscustomobject]@{
        Collections = $(& { $h = [ordered]@{}; foreach ($c in $Collections) { $h[$c.id] = [pscustomobject]$c }; $h })
        Calls       = [Collections.Generic.List[object]]::new()
        Connected   = $null
        Throttle    = $ThrottleCount
        Output      = [Collections.Generic.List[string]]::new()
    }
}

function Invoke-LearnSample {
    <#
    Run a sample with scripted answers to its Read-Host prompts. Returns the fake tenant after the run.
    #>
    param(
        [Parameter(Mandatory)][string]$Page,
        [Parameter(Mandatory)]$Tenant,
        [Parameter(Mandatory)][string[]]$Answers
    )
    $global:FakeTenant = $Tenant
    $global:FakeAnswers = [Collections.Generic.Queue[string]]::new([string[]]$Answers)
    $path = Join-Path ([IO.Path]::GetTempPath()) ("learn-sample-{0}.ps1" -f [guid]::NewGuid().Guid.Substring(0, 8))
    [IO.File]::WriteAllText($path, (Get-LearnSampleScript -Page $Page))
    try {
        function global:Read-Host { param([Parameter(Position = 0)]$Prompt) if ($global:FakeAnswers.Count -eq 0) { return '' }; $global:FakeAnswers.Dequeue() }
        function global:Write-Host { param([Parameter(Position = 0)]$Object, $ForegroundColor) $global:FakeTenant.Output.Add("$Object") }
        function global:Start-Sleep { param($Seconds) }
        function global:Get-MgContext { $global:FakeTenant.Connected }
        function global:Connect-MgGraph { param($Environment, $Scopes) $global:FakeTenant.Connected = [pscustomobject]@{ Environment = $Environment; Scopes = @($Scopes); Account = 'admin@contoso.example'; TenantId = '00000000-0000-0000-0000-000000000000'; ClientId = 'test' } }
        function global:Disconnect-MgGraph { $c = $global:FakeTenant.Connected; $global:FakeTenant.Connected = $null; $c }
        function global:Invoke-MgGraphRequest {
            param($Method = 'GET', $Uri, $Headers, $Body)
            $t = $global:FakeTenant
            $t.Calls.Add([pscustomobject]@{ Method = $Method; Uri = "$Uri"; Body = $Body })
            if ($t.Throttle -gt 0) {
                $t.Throttle--
                $resp = [pscustomobject]@{ StatusCode = 429; Headers = @{ 'Retry-After' = '1' } }
                $ex = [Exception]::new('Too Many Requests')
                $ex | Add-Member -NotePropertyName Response -NotePropertyValue $resp
                throw $ex
            }
            $u = [uri]::UnescapeDataString("$Uri")
            $kind = if ($u -match '/administrativeUnits') { 'au' } else { 'group' }
            if ($Method -eq 'PATCH') {
                $id = ($u -split '[/?]')[-1]
                if (-not $t.Collections.Contains($id)) { throw "404 $id" }
                $t.Collections[$id].state = ($Body | ConvertFrom-Json).membershipRuleProcessingState
                return $null
            }
            $one = [regex]::Match($u, '/(groups|administrativeUnits)/([0-9a-fA-F-]{36})$')
            if ($one.Success) {
                $c = $t.Collections[$one.Groups[2].Value]
                if (-not $c -or $c.kind -ne $kind) { throw "404 $($one.Groups[2].Value)" }
                return @{ id = $c.id; displayName = $c.displayName; membershipRuleProcessingState = $c.state; groupTypes = @('DynamicMembership'); membershipType = 'Dynamic' }
            }
            $items = @($t.Collections.Values | Where-Object kind -EQ $kind)
            if ($u -match "membershipRuleProcessingState eq 'Paused'") { $items = @($items | Where-Object state -EQ 'Paused') }
            $top = [regex]::Match($u, '\$top=(\d+)')
            if ($top.Success) { $items = @($items | Select-Object -First ([int]$top.Groups[1].Value)) }
            @{ value = @($items | ForEach-Object { @{ id = $_.id; displayName = $_.displayName; membershipRuleProcessingState = $_.state } }); '@odata.nextLink' = $null }
        }
        & $path *> $null
    } finally {
        foreach ($f in 'Read-Host', 'Write-Host', 'Start-Sleep', 'Get-MgContext', 'Connect-MgGraph', 'Disconnect-MgGraph', 'Invoke-MgGraphRequest') {
            Remove-Item "function:global:$f" -ErrorAction SilentlyContinue
        }
        Remove-Item $path -ErrorAction SilentlyContinue
    }
    $Tenant
}
