# Exact module versions a build uses. Invoke-McBuild.ps1 stops if any is missing, and writes them
# into provenance.json. Change a version only in a reviewed pull request, with the tests rerun.
@{
    GuestConfiguration          = '4.12.0'
    PSDesiredStateConfiguration = '2.0.7'
    PSDscResources              = '2.12.0.0'
}
