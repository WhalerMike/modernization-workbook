#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 13: workload identity across AWS GovCloud (US) and OCI, against a fictional GovCloud
# account's and OC2 tenancy's exports (tests/fixtures/ch13). No account, tenancy or network.
# The file sits outside tests/, as Chapter 11's deploy suite does, because Chapters 01 to 10's Lab 1
# runs `Invoke-Pester -Path tests` and prints the count; tests/test_cloud_workload.py runs it in CI.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/NpiCloudWorkload/NpiCloudWorkload.psm1') -Force
    $script:Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    $script:Fix = Join-Path $PSScriptRoot '../tests/fixtures/ch13'
    $script:AwsPath = Join-Path $script:Fix 'aws'
    $script:OciPath = Join-Path $script:Fix 'oci'
    $script:SettingsPath = Join-Path $script:Fix 'settings.json'
    $script:ExceptionsPath = Join-Path $script:Fix 'exceptions.csv'
    $script:AsOf = [datetime]'2026-11-24'
    $script:Tmp = Join-Path ([IO.Path]::GetTempPath()) ("npi-cw-{0}" -f [guid]::NewGuid())
    $script:S = Import-NpiCwSetting -Path $script:SettingsPath
    $script:In = Import-NpiCwInput -AwsPath $script:AwsPath -OciPath $script:OciPath -ExceptionsPath $script:ExceptionsPath
    $script:Run = Invoke-NpiCwRun -Inputs $script:In -Settings $script:S -AsOf $script:AsOf
    $script:OutA = Join-Path $script:Tmp 'a'; $script:OutB = Join-Path $script:Tmp 'b'
    Export-NpiCwRun -Run $script:Run -Inputs $script:In -Settings $script:S -OutputPath $script:OutA | Out-Null
    Export-NpiCwRun -Run (Invoke-NpiCwRun -Inputs $script:In -Settings $script:S -AsOf $script:AsOf) -Inputs $script:In -Settings $script:S -OutputPath $script:OutB | Out-Null
    $script:Manifest = Get-Content (Join-Path $script:OutA 'manifest.json') -Raw | ConvertFrom-Json -AsHashtable
    function Get-Rule([string]$Rule) { @($script:Run.Findings | Where-Object Rule -EQ $Rule) }
    function Get-Name($f) { @($f | ForEach-Object { ($_.Object -split ' \(')[0] } | Sort-Object -Unique) }
    function Copy-Fixture([string]$Sub) {
        # A copy of one cloud's fixture folder for one test to change.
        $d = Join-Path $script:Tmp ("{0}-{1}" -f $Sub, [guid]::NewGuid())
        New-Item -ItemType Directory -Force $d | Out-Null
        Copy-Item (Join-Path $script:Fix "$Sub/*") $d
        $d
    }
}
AfterAll { Remove-Item -Recurse -Force $script:Tmp -ErrorAction SilentlyContinue }

Describe 'The call list (config/calls-ch13.json), the requirements and the module''s own code' {
    It 'every command is a read an operator runs: generate or get the credential report, or a list' {
        $list = Get-NpiCwCallList
        $list.tasks.Keys | Should -Be @('cloud-workload')
        $list.tasks['cloud-workload'].mode | Should -Be 'read'
        foreach ($c in $list.calls) {
            $c.method | Should -Be 'READ'
            $c.runBy | Should -Be 'operator'
            foreach ($cmd in ($c.command -split ';')) {
                $cmd.Trim() | Should -Match '^(aws iam (generate-credential-report|get-credential-report|list-[a-z-]+)|aws rolesanywhere list-[a-z-]+|oci iam [a-z-]+( [a-z-]+)? list)(\s|$)' -Because $c.id
                $cmd | Should -Not -Match '\b(create|delete|update|put|attach|detach|tag-|untag|upload|enable|disable|import|reset|change|add|remove)\b' -Because $c.id
            }
            $c.source | Should -Match '^https://docs\.(aws\.amazon|oracle)\.com/'
        }
        @($list.calls | Where-Object { $_['optional'] } | ForEach-Object file) | Should -Be @('iam-tags.json', 'roles-anywhere-crls.json')
    }
    It 'its call and task ids collide with no other chapter''s call list' {
        $ours = Get-NpiCwCallList
        $mine = @($ours.calls.id) + @($ours.tasks.Keys)
        foreach ($file in Get-ChildItem (Join-Path $script:Root 'config') -Filter 'calls*.json' | Where-Object Name -NE 'calls-ch13.json') {
            $other = Get-Content $file.FullName -Raw | ConvertFrom-Json -AsHashtable
            $theirs = @($other.calls | ForEach-Object { $_.id }) + @($other.tasks.Keys)
            foreach ($id in $mine) { $theirs | Should -Not -Contain $id -Because $file.Name }
        }
    }
    It 'the module and its script never run the AWS CLI or the OCI CLI, and make no web request' {
        foreach ($p in (Join-Path $script:Root 'powershell/NpiCloudWorkload/NpiCloudWorkload.psm1'), (Join-Path $script:Root 'Invoke-NpiCloudWorkload.ps1')) {
            $code = Get-Content $p -Raw
            $code | Should -Not -MatchExactly '(?m)^\s*(&\s*)?(aws|oci)(\.exe)?\s+[a-z]' -Because $p   # a command line, not prose naming AWS or OCI
            $code | Should -Not -Match '(?i)Invoke-(RestMethod|WebRequest|Expression)|Start-Process|\[Net\.WebClient\]|HttpClient' -Because $p
        }
    }
    It 'every step names controls the catalog maps to KSIs, and evidence files the run writes' {
        $req = Get-NpiCwRequirement
        $req.source.url | Should -Be 'https://www.fedramp.gov/2026/reference/key-security-indicators/'
        $req.steps.Keys | Should -Be @('inventory', 'credentials', 'certificates', 'trust-and-privilege', 'lifecycle')
        foreach ($s in $req.steps.Keys) {
            foreach ($c in $req.steps[$s].controls) { $req.controls.ContainsKey($c) | Should -BeTrue -Because "$s $c"; foreach ($k in $req.controls[$c].ksis) { $k | Should -Match '^KSI-[A-Z]{3}-[A-Z]{3}$' } }
            foreach ($e in $req.steps[$s].evidence) { $script:Manifest.files.Keys | Should -Contain $e }
        }
        $req.controls['IA-5'].ksis | Should -Be @('KSI-IAM-APM')
        $req.controls['IA-5(2)'].ksis | Should -Be @('KSI-IAM-APM', 'KSI-IAM-ELP', 'KSI-IAM-SNU', 'KSI-SVC-ASM')
        # The same KSIs as Chapter 12 for the controls both chapters cite.
        $ch12 = Get-Content (Join-Path $script:Root 'config/requirements-ch12.json') -Raw | ConvertFrom-Json -AsHashtable
        foreach ($c in 'AC-2', 'AC-2(3)', 'AC-6', 'CM-8', 'IA-4') { @($req.controls[$c].ksis) | Should -Be @($ch12.controls[$c].ksis) -Because $c }
    }
}

Describe 'Reading the exports' {
    It 'reads field names whatever their case, hyphens or underscores' {
        Get-NpiCwValue @{ 'lifecycle-state' = 'ACTIVE' } 'lifecycleState' | Should -Be 'ACTIVE'
        Get-NpiCwValue @{ time_created = 'x' } 'time-created' | Should -Be 'x'
        Get-NpiCwValue ([pscustomobject]@{ TimeCreated = 'y' }) 'time-created' | Should -Be 'y'
        Get-NpiCwValue @{ a = 1 } 'b' 'none' | Should -Be 'none'
    }
    It 'treats the credential report''s N/A, no_information and not_supported as no date' {
        foreach ($t in 'N/A', 'no_information', 'not_supported', '') { ConvertTo-NpiCwDate $t | Should -BeNullOrEmpty }
        (ConvertTo-NpiCwDate '2026-06-15T10:00:00+00:00').ToString('o') | Should -Be '2026-06-15T10:00:00.0000000Z'
    }
    It 'reads a trust policy as JSON (the AWS CLI) or URL-encoded (the IAM API)' {
        $etl = @($script:In.Aws.Roles | Where-Object { $_.RoleName -eq 'app-etl-lambda' })[0]
        $etl.AssumeRolePolicyDocument | Should -BeOfType [string]
        (Get-NpiCwTrust $etl.AssumeRolePolicyDocument).Kind | Should -Be 'Lambda execution role'
        $kinds = @($script:Run.Identities | Where-Object Type -EQ 'IamRole' | ForEach-Object WorkloadKind | Sort-Object -Unique)
        foreach ($k in 'EC2 (instance profile)', 'ECS task role', 'EKS Pod Identity', 'EKS IRSA (OIDC)', 'IAM Roles Anywhere', 'OIDC federation') { $kinds | Should -Contain $k }
    }
    It 'reads OCI exports with camelCase field names the same as kebab-case ones' {
        $d = Copy-Fixture 'oci'
        foreach ($f in Get-ChildItem $d -Filter '*.json') {
            $t = Get-Content $f.FullName -Raw
            $t = [regex]::Replace($t, '"([a-z]+)-([a-z])([a-z-]*)":', { param($m) '"' + $m.Groups[1].Value + $m.Groups[2].Value.ToUpper() + ($m.Groups[3].Value -replace '-([a-z])', { $_.Groups[1].Value.ToUpper() }) + '":' })
            Set-Content -LiteralPath $f.FullName -Value $t -NoNewline
        }
        (Get-Content (Join-Path $d 'oci-users.json') -Raw) | Should -Match '"lifecycleState"'
        $r = Invoke-NpiCwRun -Inputs (Import-NpiCwInput -OciPath $d -ExceptionsPath $script:ExceptionsPath) -Settings $script:S -AsOf $script:AsOf
        @($r.Findings | ForEach-Object Id) | Should -Be @($script:Run.Findings | Where-Object { $_.Rule -like 'NPI-OCI-*' } | ForEach-Object Id)
    }
    It 'refuses a missing required file, and records a missing optional one' {
        $d = Copy-Fixture 'aws'; Remove-Item (Join-Path $d 'roles.json')
        { Import-NpiCwInput -AwsPath $d } | Should -Throw '*Missing input*roles.json*'
        $d = Copy-Fixture 'aws'; Remove-Item (Join-Path $d 'iam-tags.json'), (Join-Path $d 'roles-anywhere-crls.json')
        (Import-NpiCwInput -AwsPath $d).NotRead | Should -Be @('aws/iam-tags.json', 'aws/roles-anywhere-crls.json')
        { Import-NpiCwInput } | Should -Throw '*AwsPath*'
    }
    It 'refuses settings without a system ID tag, two owners and a sponsor' {
        $p = Join-Path $script:Tmp 'bad-settings.json'
        New-Item -ItemType Directory -Force $script:Tmp | Out-Null
        '{ "tags": { "systemId": "SystemId", "owners": ["Owner1"], "sponsor": "Sponsor" } }' | Set-Content $p
        { Import-NpiCwSetting -Path $p } | Should -Throw '*two owners*'
    }
}

Describe 'AWS GovCloud (US): long-lived credentials (NPI-AWS-01 to -07)' {
    It 'NPI-AWS-01: every active access key, a Finding without an exception and a Warn under a current one' {
        @((Get-Rule 'NPI-AWS-01') | ForEach-Object { "$($_.Severity) $(($_.ObjectKey -split '\|')[-1])" }) | Should -Be @(
            'Warn AKIAEXAMPLE000000006', 'Finding AKIAEXAMPLE000000001', 'Finding AKIAEXAMPLE000000002', 'Finding AKIAEXAMPLE000000003', 'Finding AKIAEXAMPLE000000004')
        (Get-Rule 'NPI-AWS-01')[0].Issue | Should -Match 'EXC-2026-031 until 2027-03-31'
        (Get-Rule 'NPI-AWS-01') | Where-Object ObjectKey -Like '*000000007' | Should -BeNullOrEmpty   # an Inactive key isn't counted
    }
    It 'NPI-AWS-01: an exception whose date has passed is a Finding again' {
        $v = Get-NpiCwExceptionVerdict -Exceptions $script:In.Exceptions -Cloud aws -CredentialId 'AKIAEXAMPLE000000006' -AsOf ([datetime]'2027-04-01')
        "$($v.Severity) $($v.Note)" | Should -Be 'Finding exception EXC-2026-031 ended 2027-03-31'
    }
    It 'joins each key to its credential report slot by creation date, for its last use' {
        $cred = @(Import-Csv (Join-Path $script:OutA 'credentials.csv'))
        @($cred | Where-Object CredentialId -EQ 'AKIAEXAMPLE000000001')[0].LastUsedOn | Should -Be '2026-11-22'
        @($cred | Where-Object CredentialId -EQ 'AKIAEXAMPLE000000004')[0].LastUsedOn | Should -Be ''
        (Get-Rule 'NPI-AWS-01' | Where-Object ObjectKey -Like '*000000004').Issue | Should -Match 'last used never'
    }
    It 'NPI-AWS-02 to -04: two active keys, a key unused for 90 days, a console password beside a key' {
        Get-Name (Get-Rule 'NPI-AWS-02') | Should -Be @('svc-report-export')
        Get-Name (Get-Rule 'NPI-AWS-03') | Should -Be @('svc-legacy-ftp')
        (Get-Rule 'NPI-AWS-03')[0].Issue | Should -Match 'not used for 357 days'
        Get-Name (Get-Rule 'NPI-AWS-04') | Should -Be @('svc-report-export')
    }
    It 'NPI-AWS-05 and -06: service-specific credentials (left out of the report) and signing certificates' {
        @((Get-Rule 'NPI-AWS-05') | ForEach-Object { "$($_.Severity) $(($_.Object -split ' ')[0])" }) | Should -Be @('Warn svc-bedrock-batch', 'Finding svc-git-mirror')
        (Get-Rule 'NPI-AWS-05')[0].Issue | Should -Match 'expires 2027-01-15'
        Get-Name (Get-Rule 'NPI-AWS-06') | Should -Be @('svc-legacy-ftp')
    }
    It 'NPI-AWS-07: an active access key on the root user' {
        (Get-Rule 'NPI-AWS-07').Count | Should -Be 0
        $d = Copy-Fixture 'aws'
        $p = Join-Path $d 'credential-report.csv'
        $rows = @(Import-Csv $p); $rows[0].access_key_1_active = 'true'
        ($rows | ConvertTo-Csv -NoTypeInformation) | Set-Content $p
        $r = Test-NpiCwAws -Aws (Import-NpiCwInput -AwsPath $d).Aws -Settings $script:S -AsOf $script:AsOf
        @($r.Findings | Where-Object Rule -EQ 'NPI-AWS-07').ObjectKey | Should -Be @('aws:111122223333|root|1')
    }
    It 'leaves out a console-only user (a person, or unknown) and the root user' {
        @($script:Run.Identities | Where-Object { $_.Name -eq 'ops.person' })[0].Joined | Should -Be 'out of scope'
        $script:Run.Findings | Where-Object Object -Like 'ops.person*' | Should -BeNullOrEmpty
    }
}

Describe 'AWS GovCloud (US): owners, trust and Roles Anywhere (NPI-AWS-08 to -16)' {
    It 'NPI-AWS-08: roles and workload users missing the system ID, two owners or the sponsor; never a service-linked role' {
        Get-Name (Get-Rule 'NPI-AWS-08') | Should -Be @('app-etl-lambda', 'legacy-open-role', 'svc-legacy-ftp', 'svc-report-export')
        (Get-Rule 'NPI-AWS-08' | Where-Object Object -Like 'svc-report-export*').Issue | Should -Match 'missing tag\(s\) Owner2, Sponsor'
        @($script:Run.Identities | Where-Object Name -EQ 'AWSServiceRoleForSupport')[0].Type | Should -Be 'ServiceLinkedRole'
    }
    It 'NPI-AWS-08: without iam-tags.json, one Warn says the owner tags weren''t checked' {
        $d = Copy-Fixture 'aws'; Remove-Item (Join-Path $d 'iam-tags.json')
        $r = Test-NpiCwAws -Aws (Import-NpiCwInput -AwsPath $d).Aws -Settings $script:S -AsOf $script:AsOf
        $w = @($r.Findings | Where-Object Rule -EQ 'NPI-AWS-08')
        "$($w.Count) $($w[0].Severity)" | Should -Be '1 Warn'
        $w[0].Issue | Should -Match 'iam-tags.json not read'
    }
    It 'NPI-AWS-09: an OIDC trust with no sub condition is a Finding, a wildcard sub a Warn, an exact sub nothing' {
        Get-Name (Get-Rule 'NPI-AWS-09') | Should -Be @('ci-pipeline-oidc')
        $doc = @{ Statement = @(@{ Effect = 'Allow'; Principal = @{ Federated = 'arn:aws-us-gov:iam::111122223333:oidc-provider/token.actions.githubusercontent.com' }; Action = 'sts:AssumeRoleWithWebIdentity'
                    Condition = @{ StringLike = @{ 'token.actions.githubusercontent.com:sub' = 'repo:contoso/*' } } }) }
        $aws = $script:In.Aws.PSObject.Copy()
        $aws.Roles = @(@{ RoleName = 'wild'; Arn = 'arn:aws-us-gov:iam::111122223333:role/wild'; Path = '/'; AssumeRolePolicyDocument = $doc })
        $r = Test-NpiCwAws -Aws $aws -Settings $script:S -AsOf $script:AsOf
        @($r.Findings | Where-Object Rule -EQ 'NPI-AWS-09')[0].Severity | Should -Be 'Warn'
        Get-Name (Get-Rule 'NPI-AWS-09') | Should -Not -Contain 'eks-irsa-reports'
    }
    It 'NPI-AWS-10 to -13: an unused issuer, an outside account, "*", and a commercial-partition principal' {
        Get-Name (Get-Rule 'NPI-AWS-10') | Should -Be @('gitlab.example.com')
        Get-Name (Get-Rule 'NPI-AWS-11') | Should -Be @('partner-audit-readonly')   # shared-logging-writer trusts a program account
        Get-Name (Get-Rule 'NPI-AWS-12') | Should -Be @('legacy-open-role')
        Get-Name (Get-Rule 'NPI-AWS-13') | Should -Be @('commercial-bridge')
        (Get-Rule 'NPI-AWS-13')[0].Issue | Should -Match 'partition aws:'
    }
    It 'NPI-AWS-14: an enabled trust anchor with no imported CRL; a Warn when the CRLs weren''t read' {
        Get-Name (Get-Rule 'NPI-AWS-14') | Should -Be @('ta-lab-ca')
        (Get-Rule 'NPI-AWS-14')[0].Severity | Should -Be 'Finding'
        $d = Copy-Fixture 'aws'; Remove-Item (Join-Path $d 'roles-anywhere-crls.json')
        $r = Test-NpiCwAws -Aws (Import-NpiCwInput -AwsPath $d).Aws -Settings $script:S -AsOf $script:AsOf
        @($r.Findings | Where-Object Rule -EQ 'NPI-AWS-14' | ForEach-Object Severity) | Should -Be @('Warn', 'Warn')
    }
    It 'NPI-AWS-15 and -16: a profile naming a missing role, an instance profile with none' {
        Get-Name (Get-Rule 'NPI-AWS-15') | Should -Be @('prof-retired-batch')
        Get-Name (Get-Rule 'NPI-AWS-16') | Should -Be @('old-batch-host')
        (Get-Rule 'NPI-AWS-16')[0].Severity | Should -Be 'Info'
    }
}

Describe 'OCI (OC2): credentials, dynamic groups and policies (NPI-OCI-01 to -10)' {
    It 'NPI-OCI-01 to -03: active API keys, one older than Oracle''s 90 days, two on one user' {
        @((Get-Rule 'NPI-OCI-01') | ForEach-Object { "$($_.Severity) $(($_.Object -split ' ')[0])" }) | Should -Be @('Finding hr-integration', 'Finding hr-integration', 'Warn hr-report-reader')
        Get-Name (Get-Rule 'NPI-OCI-02') | Should -Be @('hr-integration')
        (Get-Rule 'NPI-OCI-02')[0].Issue | Should -Match '295 days old.*90 days or less'
        Get-Name (Get-Rule 'NPI-OCI-03') | Should -Be @('hr-integration')
        (Get-Rule 'NPI-OCI-01') | Where-Object ObjectKey -Like '*:03' | Should -BeNullOrEmpty   # the INACTIVE key
    }
    It 'NPI-OCI-04 and -05: auth tokens and customer secret keys, which never expire' {
        Get-Name (Get-Rule 'NPI-OCI-04') | Should -Be @('hr-build-push')
        Get-Name (Get-Rule 'NPI-OCI-05') | Should -Be @('hr-object-sync')
        (Get-Rule 'NPI-OCI-04')[0].Issue | Should -Match 'don''t expire'
    }
    It 'NPI-OCI-06: users holding credentials and dynamic groups with missing tags; a person with no credentials is out of scope' {
        Get-Name (Get-Rule 'NPI-OCI-06') | Should -Be @('dg-everything', 'hr-build-push', 'hr-object-sync')
        (Get-Rule 'NPI-OCI-06' | Where-Object Object -Like 'hr-object-sync*').Issue | Should -Match 'missing tag\(s\) Sponsor'
        @($script:Run.Identities | Where-Object Name -EQ 'admin.person')[0].Joined | Should -Be 'out of scope'
    }
    It 'NPI-OCI-07 to -09: a dynamic group no policy names, one matching the whole tenancy, manage all-resources' {
        Get-Name (Get-Rule 'NPI-OCI-07') | Should -Be @('dg-everything')
        Get-Name (Get-Rule 'NPI-OCI-08') | Should -Be @('dg-everything')
        (Get-Rule 'NPI-OCI-09').ObjectKey | Should -Be @('oci:oc2|hr-batch-policy|2')
    }
    It 'NPI-OCI-10: OKE workload identity statements are listed for the inventory' {
        (Get-Rule 'NPI-OCI-10').ObjectKey | Should -Be @('oci:oc2|hr-oke-workload|1')
        (Get-Rule 'NPI-OCI-10')[0].Severity | Should -Be 'Info'
    }
    It 'reads a policy''s dynamic-group subjects, by name, domain-qualified name or OCID' {
        (Get-NpiCwPolicySubject "Allow dynamic-group 'Default'/'dg-a' to read buckets in tenancy").DynamicGroups | Should -Be @('dg-a')
        (Get-NpiCwPolicySubject 'Allow dynamic-group id ocid1.dynamicgroup.oc2..x to use keys in compartment c').DynamicGroups | Should -Be @('ocid1.dynamicgroup.oc2..x')
        (Get-NpiCwPolicySubject 'Allow group Admins to manage all-resources in tenancy').DynamicGroups | Should -BeNullOrEmpty
    }
}

Describe 'The run folder' {
    It 'writes every file, and the manifest records each output''s and each input''s SHA-256' {
        $names = @('credentials.csv', 'evidence.json', 'findings.json', 'identities.json', 'trust.json')
        @($script:Manifest.files.Keys | Sort-Object) | Should -Be $names
        foreach ($n in $names) { Get-NpiFileHash -Path (Join-Path $script:OutA $n) | Should -Be $script:Manifest.files[$n] -Because $n }
        $script:Manifest.inputs['aws/credential-report.csv'] | Should -Be (Get-NpiFileHash -Path (Join-Path $script:AwsPath 'credential-report.csv'))
        $script:Manifest.inputs['oci/oci-policies.json'] | Should -Be (Get-NpiFileHash -Path (Join-Path $script:OciPath 'oci-policies.json'))
        "$($script:Manifest.task) $($script:Manifest.asOf) $($script:Manifest.aws.partition) $($script:Manifest.oci.realm)" | Should -Be 'cloud-workload 2026-11-24 aws-us-gov oc2'
        @($script:Manifest.requests).Count | Should -Be 0
        @($script:Manifest.exportCommands).Count | Should -Be 14
    }
    It 'credentials.csv holds identifiers, never a secret, and every long-lived credential once' {
        $c = @(Import-Csv (Join-Path $script:OutA 'credentials.csv'))
        "$(@($c | Where-Object Cloud -EQ 'aws').Count) $(@($c | Where-Object Cloud -EQ 'oci').Count)" | Should -Be '7 5'
        @($c.CredentialId | Sort-Object -Unique).Count | Should -Be $c.Count
        (Get-Content (Join-Path $script:OutA 'credentials.csv') -Raw) | Should -Not -Match '(?i)secret_?access_?key|BEGIN (RSA )?PRIVATE KEY|"token":'
    }
    It 'evidence.json has one row per step, control and evidence file, with that file''s SHA-256 and the catalog''s KSIs' {
        $ev = (Get-Content (Join-Path $script:OutA 'evidence.json') -Raw | ConvertFrom-Json -AsHashtable).rows
        $req = Get-NpiCwRequirement
        $expected = 0; foreach ($s in $req.steps.Values) { $expected += @($s.controls).Count * @($s.evidence).Count }
        @($ev).Count | Should -Be $expected
        foreach ($r in $ev) { $r.sha256 | Should -Be $script:Manifest.files[$r.evidence]; @($r.ksi) | Should -Be @($req.controls[$r.control].ksis) }
    }
    It 'is deterministic: two runs with the same inputs and -AsOf write byte-identical files' {
        foreach ($f in Get-ChildItem $script:OutA -File) { Get-NpiFileHash -Path $f.FullName | Should -Be (Get-NpiFileHash -Path (Join-Path $script:OutB $f.Name)) -Because $f.Name }
    }
    It 'runs one cloud on its own' {
        $r = Invoke-NpiCwRun -Inputs (Import-NpiCwInput -AwsPath $script:AwsPath) -Settings $script:S -AsOf $script:AsOf
        @($r.Findings | Where-Object Rule -Like 'NPI-OCI-*').Count | Should -Be 0
        @($r.Findings | ForEach-Object Id) | Should -Be @($script:Run.Findings | Where-Object Rule -Like 'NPI-AWS-*' | ForEach-Object Id)
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-AWS-01' -and $_.Severity -eq 'Warn' }).Count | Should -Be 0   # no exception list: no exception
    }
}
