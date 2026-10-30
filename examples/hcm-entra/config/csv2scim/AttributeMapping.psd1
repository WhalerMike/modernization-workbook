# CSV2SCIM attribute mapping for this example's HR extract (tests/fixtures/hcm_extract_sample.csv).
# Microsoft's CSV2SCIM sample reads this with Import-PowerShellDataFile: each value is a CSV column
# name, or a script block that computes the value from the row ($_). Same columns as
# config/mapping.json; see developer workbook Building the Attribute-Driven Migration, Chapter 01. Illustrative.
@{
    externalId   = 'PersonNumber'
    name         = @{
        familyName = 'LastName'
        givenName  = 'FirstName'
    }
    active       = { $_.'AssignmentStatusType' -ne 'INACTIVE' }
    userName     = 'UserName'
    displayName  = 'DisplayName'
    title        = 'JobName'
    addresses    = @(
        @{
            type    = { 'work' }
            country = 'WorkCountry'
        }
    )
    "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User" = @{
        employeeNumber = 'PersonNumber'
        costCenter     = 'CostCenter'
        organization   = 'LegalEmployer'
        division       = 'BusinessUnit'
        department     = 'DepartmentName'
        manager        = @{
            value = 'ManagerPersonNumber'
        }
    }
}
