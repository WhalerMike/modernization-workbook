# Chapter 05 (guide G5 and G6): vulnerability and exposure work without Security Exposure Management, and the
# incident queue against the severity table.

function Get-XdrExposureDisposition {
    <#
    .SYNOPSIS
        The record for Microsoft Security Exposure Management in the tenant's cloud. Learn says it is
        available in Public Cloud only, not in US Government clouds, so for GCC the record says not available,
        with the normalized result Skipped-Not-Applicable that the Zero Trust Assessment results kit
        (examples/zta-results) and the Zero Trust book's closure method use, and the guide's interim path.
    .EXAMPLE
        Get-XdrExposureDisposition -Cloud gcc
    #>
    param([Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][string]$AsOf)
    $null = Get-XdrCloud -Cloud $Cloud
    $gcc = $Cloud -eq 'gcc'
    [ordered]@{
        feature          = 'Microsoft Security Exposure Management (attack paths, exposure graph, critical asset management)'
        cloud            = $Cloud
        availability     = $(if ($gcc) { 'not available' } else { 'available (Public Cloud)' })
        source           = 'https://learn.microsoft.com/security-exposure-management/microsoft-security-exposure-management (read November 11, 2026: available in Public Cloud only, not in US Government clouds)'
        normalizedResult = $(if ($gcc) { 'Skipped-Not-Applicable' } else { $null })
        disposition      = $(if ($gcc) { 'not applicable: unavailable in the tenant''s cloud; a disposition, not a failed control' } else { 'not used by this kit; the program targets GCC' })
        interimPath      = 'Prioritize by DeviceInfo ExposureLevel, IsInternetFacing and AssetValue and by Defender Vulnerability Management recommendations; use the Tier 0 inventory of the access and privilege book as the critical-asset list.'
        recordedAt       = (ConvertTo-XdrUtc $AsOf)
    }
}

function Invoke-XdrExposureCheck {
    <#
    .SYNOPSIS
        Gate 5's check: the guide's two queries (high and critical vulnerabilities by software and update;
        exposed and internet-facing devices), each exposed device matched to its remediation owner by device
        group from the agency's owners file, and the Exposure Management disposition. A device with no owner
        is a CM-8 finding, not just RA-5. Writes vulnerabilities.csv, exposed.csv, unowned.csv,
        exposure-management.json, summary.json and the manifest. Reads only.
    .EXAMPLE
        Invoke-XdrExposureCheck -Settings $s -Invoker $inv -OutputPath out/exposure -AsOf 2026-11-16T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$AsOf, [string]$OwnersPath)
    $out = New-XdrRunFolder -OutputPath $OutputPath
    $owners = (Read-XdrJson -Path (Get-XdrInput -Settings $Settings -Name owners -Override $OwnersPath)).machineGroups
    $vul = @(Invoke-XdrHunting -Invoker $Invoker -Name tvm-high-critical -OutputPath $out | ForEach-Object {
            [pscustomobject][ordered]@{ SoftwareVendor = "$(Get-XdrV $_ 'SoftwareVendor')"; SoftwareName = "$(Get-XdrV $_ 'SoftwareName')"; RecommendedSecurityUpdate = "$(Get-XdrV $_ 'RecommendedSecurityUpdate')"; CVEs = [int](Get-XdrV $_ 'CVEs'); Devices = [int](Get-XdrV $_ 'Devices') } })
    $exp = @(Invoke-XdrHunting -Invoker $Invoker -Name exposed-devices -OutputPath $out | ForEach-Object {
            $g = "$(Get-XdrV $_ 'MachineGroup')"
            $o = if ($g -and $owners.Contains($g)) { "$($owners[$g])" } else { '' }
            [pscustomobject][ordered]@{ DeviceName = (Get-XdrShortName (Get-XdrV $_ 'DeviceName')); ExposureLevel = "$(Get-XdrV $_ 'ExposureLevel')"; IsInternetFacing = "$(Get-XdrV $_ 'IsInternetFacing')"; AssetValue = "$(Get-XdrV $_ 'AssetValue')"; MachineGroup = $g; Owner = $o; Status = $(if ($o) { 'Owned' } else { 'NoOwner' }) } })
    Write-XdrCsv -Path (Join-Path $out 'vulnerabilities.csv') -Rows $vul -Columns SoftwareVendor, SoftwareName, RecommendedSecurityUpdate, CVEs, Devices
    Write-XdrCsv -Path (Join-Path $out 'exposed.csv') -Rows $exp -Columns DeviceName, ExposureLevel, IsInternetFacing, AssetValue, MachineGroup, Owner, Status
    $unowned = @($exp | Where-Object Status -EQ 'NoOwner')
    Write-XdrCsv -Path (Join-Path $out 'unowned.csv') -Rows $unowned -Columns DeviceName, ExposureLevel, IsInternetFacing, AssetValue, MachineGroup, Owner, Status
    $disp = Get-XdrExposureDisposition -Cloud $Settings.cloud -AsOf $AsOf
    Write-XdrJson -Path (Join-Path $out 'exposure-management.json') -Value $disp
    $sum = [ordered]@{ asOf = (ConvertTo-XdrUtc $AsOf); softwareRows = $vul.Count; cves = @($vul | Measure-Object CVEs -Sum).Sum; exposedDevices = $exp.Count; unowned = $unowned.Count; exposureManagement = $disp.availability }
    if ($null -eq $sum.cves) { $sum.cves = 0 }
    Write-XdrJson -Path (Join-Path $out 'summary.json') -Value $sum
    $null = Write-XdrManifest -OutputPath $out -Task exposure -AsOf $AsOf -Mode $Invoker.Mode -Environment $Settings.environment -CallIds @($Invoker.Calls) -Extra @{ result = $(if ($unowned.Count) { 'Fail' } else { 'Pass' }) }
    [pscustomobject]@{ Vulnerabilities = $vul; Exposed = $exp; Disposition = $disp; Summary = $sum; OutputPath = $out }
}

function Get-XdrIncidentFinding {
    <#
    .SYNOPSIS
        Reads each incident against the severity table (config/severity.json): an open incident with an owner
        is Triaged; without one it is Untriaged inside its window and OverdueTriage past it; a resolved
        incident needs a classification and a determination other than unknown, or it is
        ClosedWithoutClassification. The containment rung and hand-off come from the table.
    .EXAMPLE
        Get-XdrIncidentFinding -Incidents $items -AsOf 2026-11-16T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Incidents, [Parameter(Mandatory)][string]$AsOf, [string]$ConfigPath = (Join-Path $script:ConfigRoot 'severity.json'))
    $cfg = Read-XdrJson -Path $ConfigPath
    $now = Get-XdrDate $AsOf
    foreach ($i in $Incidents) {
        $sev = "$(Get-XdrV $i 'severity')".ToLowerInvariant()
        $row = @($cfg.rows | Where-Object { $_.severity -eq $sev })
        $hours = if ($row.Count) { [int]$row[0].triageHours } else { 24 }
        $st = "$(Get-XdrV $i 'status')"; $owner = "$(Get-XdrV $i 'assignedTo')"
        $created = Get-XdrDate (Get-XdrV $i 'createdDateTime')
        $age = [math]::Round(($now - $created).TotalHours, 1)
        $cls = "$(Get-XdrV $i 'classification')"; $det = "$(Get-XdrV $i 'determination')"
        $closed = $st -in @($cfg.closedStatuses)
        $finding = if ($closed) {
            if (-not $cls -or $cls -eq 'unknown' -or -not $det -or $det -eq 'unknown') { 'ClosedWithoutClassification' } else { 'Closed' }
        }
        elseif ($owner) { 'Triaged' } elseif ($age -gt $hours) { 'OverdueTriage' } else { 'Untriaged' }
        [pscustomobject][ordered]@{
            Id = "$(Get-XdrV $i 'id')"; DisplayName = "$(Get-XdrV $i 'displayName')"; Severity = $sev; Status = $st; AssignedTo = $owner
            CreatedDateTime = (ConvertTo-XdrUtc $created); AgeHours = $age; TriageWindowHours = $hours
            Alerts = @(Get-XdrV $i 'alerts').Where({ $null -ne $_ }).Count; Classification = $cls; Determination = $det
            Rung = $(if ($row.Count) { $row[0].rung } else { '' }); Finding = $finding
            Result = $(switch ($finding) { 'OverdueTriage' { 'Fail' } 'ClosedWithoutClassification' { 'Fail' } 'Untriaged' { 'Warn' } default { 'Pass' } })
        }
    }
}

function Invoke-XdrIncidentCheck {
    <#
    .SYNOPSIS
        Gate 6's check: the incidents created in the last 30 days and every incident still active, with their
        alerts (Learn's list incidents with $expand=alerts), each read against the severity table. Writes
        incidents.csv, findings.csv, by-severity.csv, raw/incidents.json, summary.json and the manifest.
        Reads only.
    .EXAMPLE
        Invoke-XdrIncidentCheck -Settings $s -Invoker $inv -OutputPath out/incidents -AsOf 2026-11-16T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$AsOf)
    $out = New-XdrRunFolder -OutputPath $OutputPath
    $since = (Get-XdrDate $AsOf).AddDays(-30).ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", [Globalization.CultureInfo]::InvariantCulture)
    $all = [ordered]@{}
    foreach ($f in @("createdDateTime ge $since", "status eq 'active'")) {
        $r = Invoke-XdrCall -Invoker $Invoker -CallId incidents-list -Arguments @{ filter = $f; expand = 'alerts' }
        foreach ($i in @(Get-XdrV $r 'value')) { if ($null -ne $i) { $all["$(Get-XdrV $i 'id')"] = $i } }
    }
    $items = @($all.Values)
    Write-XdrJson -Path (Join-Path $out 'raw/incidents.json') -Value @{ value = $items }
    $rows = @(Get-XdrIncidentFinding -Incidents $items -AsOf $AsOf | Sort-Object Id)
    $cols = 'Id', 'DisplayName', 'Severity', 'Status', 'AssignedTo', 'CreatedDateTime', 'AgeHours', 'TriageWindowHours', 'Alerts', 'Classification', 'Determination', 'Rung', 'Finding', 'Result'
    Write-XdrCsv -Path (Join-Path $out 'incidents.csv') -Rows $rows -Columns $cols
    Write-XdrCsv -Path (Join-Path $out 'findings.csv') -Rows @($rows | Where-Object Result -NE 'Pass') -Columns $cols
    $bySev = foreach ($s in 'high', 'medium', 'low', 'informational') {
        $g = @($rows | Where-Object Severity -EQ $s)
        [pscustomobject][ordered]@{ Severity = $s; Incidents = $g.Count; Open = @($g | Where-Object { $_.Finding -in 'Triaged', 'Untriaged', 'OverdueTriage' }).Count; OverdueTriage = @($g | Where-Object Finding -EQ 'OverdueTriage').Count; ClosedWithoutClassification = @($g | Where-Object Finding -EQ 'ClosedWithoutClassification').Count }
    }
    Write-XdrCsv -Path (Join-Path $out 'by-severity.csv') -Rows @($bySev) -Columns Severity, Incidents, Open, OverdueTriage, ClosedWithoutClassification
    $sum = [ordered]@{ asOf = (ConvertTo-XdrUtc $AsOf); incidents = $rows.Count; open = @($rows | Where-Object { $_.Finding -in 'Triaged', 'Untriaged', 'OverdueTriage' }).Count; overdueTriage = @($rows | Where-Object Finding -EQ 'OverdueTriage').Count; closedWithoutClassification = @($rows | Where-Object Finding -EQ 'ClosedWithoutClassification').Count; untriaged = @($rows | Where-Object Finding -EQ 'Untriaged').Count }
    Write-XdrJson -Path (Join-Path $out 'summary.json') -Value $sum
    $null = Write-XdrManifest -OutputPath $out -Task incidents -AsOf $AsOf -Mode $Invoker.Mode -Environment $Settings.environment -CallIds @($Invoker.Calls) -Extra @{ result = $(if ($sum.overdueTriage -or $sum.closedWithoutClassification) { 'Fail' } else { 'Pass' }) }
    [pscustomobject]@{ Rows = $rows; Summary = $sum; OutputPath = $out }
}
