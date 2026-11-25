#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 05. Sorts the Active Directory groups that reach SQL Server into Book 06, Chapter 16's four
    patterns and names each one's Microsoft Entra target (dynamic, assigned, mail-only or split), flagging
    nested groups and privileged roles on rule-based groups. Read-only.
.PARAMETER GroupsPath
    The groups JSON: each group's category, mail state, how its membership is kept, members and grants.
.PARAMETER OutputPath
    The folder for groups.csv, groups.json and manifest.json.
.EXAMPLE
    ./Invoke-SqlGroupMap.ps1 -GroupsPath tests/fixtures/groups/groups.json -OutputPath out/groups
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$GroupsPath, [Parameter(Mandatory)][string]$OutputPath)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/SqlIdentity/SqlIdentity.psd1') -Force
$g = Read-SqlJson $GroupsPath
$rows = @(Get-SqlGroupPattern -Groups $g.groups)
Complete-SqlRun -Rows $rows -Name groups -Step GROUPS -OutputPath $OutputPath -AsOf $g.asOf -Show Group, Pattern, Target, Flags
