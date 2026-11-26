# Pester 5. Runs from the kit folder in PowerShell 7 or Windows PowerShell 5.1, on any platform: the check reads only
# snapshots. tests/fixtures/lab holds the snapshots the Platform host lab workflow took on Windows Server 2025
# (secrets already reduced to '<set>'); each test changes one fact in a copy and expects that check's finding.
BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/PlatformHost/PlatformHost.psm1') -Force
    $script:Kit = Split-Path -Parent $PSScriptRoot
    $script:Settings = Read-PhJson -Path (Join-Path $Kit 'config/settings.lab.json')
    $script:Manifest = Read-PhJson -Path (Join-Path $Kit 'manifest/release-manifest.json')
    $script:Fix = Join-Path $PSScriptRoot 'fixtures/lab'
    function Get-Fresh { , (Read-PhJson -Path (Join-Path $Fix 'snapshot-windows.json')), (Read-PhJson -Path (Join-Path $Fix 'snapshot-gitea.json')) }
    function Invoke-Check($w, $g, $s = $Settings, $asOf) {
        if (-not $asOf) { $asOf = $w.takenAt }
        Test-PhSnapshot -Settings $s -Windows $w -Gitea $g -Manifest $Manifest -AsOf $asOf
    }
    function Get-Row($rows, $id) { @($rows | Where-Object Check -EQ $id)[0] }
}

Describe 'The lab snapshots' {
    It 'pass every check except Arc, which the lab settings do not require' {
        $w, $g = Get-Fresh
        $rows = Invoke-Check $w $g
        @($rows).Count | Should -Be 12
        @($rows | Where-Object Status -EQ 'Finding' | ForEach-Object { "$($_.Check): $($_.Detail)" }) | Should -BeNullOrEmpty
        (Get-Row $rows 'PH-12').Status | Should -Be 'NotChecked'
    }
    It 'carry no secret values' {
        $text = Get-Content -Raw (Join-Path $Fix 'snapshot-windows.json')
        $text | Should -Match '"SECRET_KEY":\s*"<set>"'
        $text | Should -Match '"INTERNAL_TOKEN":\s*"<set>"'
        $text | Should -Not -Match 'eyJ'
    }
}

Describe 'Each check finds its drift' {
    It 'PH-01 when Gitea listens on every address' {
        $w, $g = Get-Fresh
        @($w.listeners | Where-Object { $_.process -eq 'gitea' -and $_.port -eq 3000 })[0].address = '0.0.0.0'
        (Get-Row (Invoke-Check $w $g) 'PH-01').Detail | Should -Match 'gitea listens on 0.0.0.0:3000'
    }
    It 'PH-01 when something answers on port 80' {
        $w, $g = Get-Fresh
        $w.listeners += [pscustomobject]@{ address = '0.0.0.0'; port = 80; pid = 4; process = 'System' }
        (Get-Row (Invoke-Check $w $g) 'PH-01').Detail | Should -Match 'port 80'
    }
    It 'PH-02 when a profile allows inbound by default' {
        $w, $g = Get-Fresh
        $w.firewallProfiles[0].defaultInboundAction = 'Allow'
        (Get-Row (Invoke-Check $w $g) 'PH-02').Status | Should -Be 'Finding'
    }
    It 'PH-03 when the certificate is close to expiry' {
        $w, $g = Get-Fresh
        $asOf = ([DateTime]::Parse($w.tls.notAfter).ToUniversalTime().AddDays(-10)).ToString('yyyy-MM-ddTHH:mm:ssZ')
        $w.backup.newestTime = $asOf; $g.mirrors | ForEach-Object { $_.mirrorUpdated = $asOf }
        (Get-Row (Invoke-Check $w $g $Settings $asOf) 'PH-03').Detail | Should -Match 'expires in 1\d days|expires in [0-9] days'
    }
    It 'PH-03 when TLS 1.1 is turned back on' {
        $w, $g = Get-Fresh
        $w.tls.protocols.'TLS 1.1' = 'enabled'
        (Get-Row (Invoke-Check $w $g) 'PH-03').Detail | Should -Match 'TLS 1.1 is enabled'
    }
    It 'PH-03 refuses a self-signed certificate under the production rule' {
        $w, $g = Get-Fresh
        $s = Read-PhJson -Path (Join-Path $Kit 'config/settings.lab.json'); $s.expected.allowSelfSigned = $false
        (Get-Row (Invoke-Check $w $g $s) 'PH-03').Detail | Should -Match 'self-signed'
    }
    It 'PH-04 when ARR rewrites the host in response headers' {
        $w, $g = Get-Fresh
        $w.iis.reverseRewriteHostInResponseHeaders = $true
        (Get-Row (Invoke-Check $w $g) 'PH-04').Detail | Should -Match 'rewrites the host'
    }
    It 'PH-04 when a second rewrite rule appears' {
        $w, $g = Get-Fresh
        $w.iis.rewriteRules = @($w.iis.rewriteRules) + [pscustomobject]@{ name = 'Static'; stopProcessing = $false; matchUrl = '^static/(.*)'; actionType = 'Rewrite'; actionUrl = 'http://10.0.0.5/{R:1}' }
        $d = (Get-Row (Invoke-Check $w $g) 'PH-04').Detail
        $d | Should -Match '2 rewrite rules'
        $d | Should -Match 'goes to http://10.0.0.5'
    }
    It 'PH-05 when the log rolls over daily' {
        $w, $g = Get-Fresh
        $w.iis.log.period = 'Daily'
        (Get-Row (Invoke-Check $w $g) 'PH-05').Detail | Should -Match 'rollover Daily'
    }
    It 'PH-06 when registration is opened' {
        $w, $g = Get-Fresh
        $w.appIni.service.DISABLE_REGISTRATION = 'false'
        (Get-Row (Invoke-Check $w $g) 'PH-06').Detail | Should -Match 'DISABLE_REGISTRATION = false'
    }
    It 'PH-06 when browser-edited Git hooks are allowed' {
        $w, $g = Get-Fresh
        $w.appIni.security.DISABLE_GIT_HOOKS = 'false'
        (Get-Row (Invoke-Check $w $g) 'PH-06').Status | Should -Be 'Finding'
    }
    It 'PH-07 when the service runs as a person''s account' {
        $w, $g = Get-Fresh
        $w.service.startName = 'CORP\jdoe'
        (Get-Row (Invoke-Check $w $g) 'PH-07').Detail | Should -Match 'runs as CORP\\jdoe'
    }
    It 'PH-07 when RUN_USER disagrees with the account' {
        $w, $g = Get-Fresh
        $w.appIni.''.RUN_USER = 'someone'
        (Get-Row (Invoke-Check $w $g) 'PH-07').Detail | Should -Match 'RUN_USER is someone'
    }
    It 'PH-08 when Users can modify the repositories' {
        $w, $g = Get-Fresh
        $repo = @($w.acls | Where-Object { $_.path -like '*GitRepos' })[0]
        $repo.access = @($repo.access) + [pscustomobject]@{ identity = 'BUILTIN\Users'; rights = 'Modify, Synchronize'; type = 'Allow'; inherited = $false }
        (Get-Row (Invoke-Check $w $g) 'PH-08').Detail | Should -Match 'gives BUILTIN\\Users Modify'
    }
    It 'PH-09 when gitea.exe is not the pinned build' {
        $w, $g = Get-Fresh
        $w.binaries.giteaSha256 = ('0' * 64)
        (Get-Row (Invoke-Check $w $g) 'PH-09').Status | Should -Be 'Finding'
    }
    It 'PH-10 when anonymous reads are allowed' {
        $w, $g = Get-Fresh
        $g.anonymousStatus = 200
        (Get-Row (Invoke-Check $w $g) 'PH-10').Detail | Should -Match 'anonymous API read answered 200'
    }
    It 'PH-10 when a webhook sends outside the listed receivers' {
        $w, $g = Get-Fresh
        $g.webhooks = @($g.webhooks) + [pscustomobject]@{ scope = 'fmp/canon'; id = 99; type = 'gitea'; url = 'https://hooks.example.net/x'; active = $true; events = @('push') }
        (Get-Row (Invoke-Check $w $g) 'PH-10').Detail | Should -Match 'sends to hooks.example.net'
    }
    It 'PH-10 when the mirror is more than 24 hours old' {
        $w, $g = Get-Fresh
        $asOf = ([DateTime]::Parse($g.mirrors[0].mirrorUpdated).ToUniversalTime().AddHours(30)).ToString('yyyy-MM-ddTHH:mm:ssZ')
        $w.backup.newestTime = $asOf
        (Get-Row (Invoke-Check $w $g $Settings $asOf) 'PH-10').Detail | Should -Match 'last synced 30.0 hours ago'
    }
    It 'PH-10 is NotChecked without a Gitea snapshot' {
        $w, $g = Get-Fresh
        (Get-Row (Invoke-Check $w $null) 'PH-10').Status | Should -Be 'NotChecked'
    }
    It 'PH-11 when the newest backup is older than the recovery point' {
        $w, $g = Get-Fresh
        $w.backup.newestTime = ([DateTime]::Parse($w.takenAt).ToUniversalTime().AddHours(-25)).ToString('yyyy-MM-ddTHH:mm:ssZ')
        (Get-Row (Invoke-Check $w $g) 'PH-11').Status | Should -Be 'Finding'
    }
    It 'PH-12 is a finding when the settings require Arc' {
        $w, $g = Get-Fresh
        (Get-Row (Invoke-Check $w $g (Read-PhJson -Path (Join-Path $Kit 'config/settings.template.json'))) 'PH-12').Detail | Should -Match 'not installed'
    }
}

Describe 'app.ini parsing' {
    It 'reduces secrets to <set> and keeps the rest' {
        $ini = ConvertFrom-PhIni -Text "RUN_USER = x`n[security]`nINSTALL_LOCK = true`nSECRET_KEY = abc`nINTERNAL_TOKEN =`n[database]`nPASSWD = `"p w`"`nHOST = pg01:5432"
        $ini[''].RUN_USER | Should -Be 'x'
        $ini.security.INSTALL_LOCK | Should -Be 'true'
        $ini.security.SECRET_KEY | Should -Be '<set>'
        $ini.security.INTERNAL_TOKEN | Should -Be '<empty>'
        $ini.database.PASSWD | Should -Be '<set>'
        $ini.database.HOST | Should -Be 'pg01:5432'
    }
}

Describe 'Webhook signatures' {
    It 'accepts Gitea''s hex HMAC-SHA256 of the raw body, with or without sha256=' {
        $body = '{"ref":"refs/heads/main"}'
        $hmac = New-Object Security.Cryptography.HMACSHA256 -ArgumentList (, [Text.Encoding]::UTF8.GetBytes('s3cret'))
        $sig = (($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($body)) | ForEach-Object { $_.ToString('x2') }) -join '')
        Test-PhWebhookSignature -Body $body -Secret 's3cret' -Signature $sig | Should -BeTrue
        Test-PhWebhookSignature -Body $body -Secret 's3cret' -Signature "sha256=$sig" | Should -BeTrue
    }
    It 'refuses a changed body, a wrong secret or an empty signature' {
        $body = '{"ref":"refs/heads/main"}'
        $hmac = New-Object Security.Cryptography.HMACSHA256 -ArgumentList (, [Text.Encoding]::UTF8.GetBytes('s3cret'))
        $sig = (($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($body)) | ForEach-Object { $_.ToString('x2') }) -join '')
        Test-PhWebhookSignature -Body ($body + ' ') -Secret 's3cret' -Signature $sig | Should -BeFalse
        Test-PhWebhookSignature -Body $body -Secret 'other' -Signature $sig | Should -BeFalse
        Test-PhWebhookSignature -Body $body -Secret 's3cret' -Signature '' | Should -BeFalse
    }
}

Describe 'Evidence' {
    It 'records a run with its controls and KSIs, hashed and chained, and detects a change' {
        $run = Join-Path ([IO.Path]::GetTempPath()) ("ph-run-" + [guid]::NewGuid().ToString('N'))
        $ev = Join-Path ([IO.Path]::GetTempPath()) ("ph-ev-" + [guid]::NewGuid().ToString('N'))
        New-Item -ItemType Directory -Path $run | Out-Null
        Copy-Item (Join-Path $Fix '*.json') $run
        $w, $g = Get-Fresh
        $rows = Invoke-Check $w $g
        Write-PhJson -Path (Join-Path $run 'results.json') -Value ([ordered]@{ schema = 'fmp-ph-results/1'; checkedAt = $w.takenAt; environment = 'lab'; computer = $w.computer; rows = $rows })
        $e1 = Write-PhEvidence -EvidencePath $ev -RunPath $run -AsOf $w.takenAt -Environment lab
        $e2 = Write-PhEvidence -EvidencePath $ev -RunPath $run -AsOf $w.takenAt -Environment lab
        $e2.Sequence | Should -Be 2
        $e1.Controls | Should -Contain 'SC-8'
        $e1.Ksis | Should -Contain 'KSI-SVC-SIN'
        @(Test-PhEvidence -EvidencePath $ev | Where-Object Status -NE 'Pass') | Should -BeNullOrEmpty
        Add-Content -Path (Join-Path $ev 'runs/0001-check/results.json') -Value ' '
        (@(Test-PhEvidence -EvidencePath $ev) | Where-Object Check -EQ 'SUMS').Status | Should -Be 'Finding'
        Remove-Item -Recurse -Force $run, $ev
    }
}
