// The Daily checks Azure Monitor workbook, one tab per daily check. Same resource as main.json, which the
// kit deploys (so no Bicep build is needed); keep the two equal (deploy/tests/Deploy.Tests.ps1 checks).
// Shape from Microsoft Learn's workbook ARM template sample and the Microsoft.Insights/workbooks 2023-06-01
// reference. The name is a deterministic GUID: what-if can't evaluate newGuid(), and a redeploy updates
// the same workbook.

@description('The workbook\'s name in the gallery; unique in the resource group and source.')
param workbookDisplayName string

@description('The Sentinel Log Analytics workspace\'s resource ID: the workbook shows under that workspace\'s Workbooks.')
param workbookSourceId string

@description('The gallery template with this environment\'s workspace and parameter values, as the kit\'s plan writes it.')
param serializedData string

@description('The workbook resource\'s region.')
param location string = resourceGroup().location

resource workbook 'Microsoft.Insights/workbooks@2023-06-01' = {
  name: guid(resourceGroup().id, workbookDisplayName)
  location: location
  kind: 'shared'
  properties: {
    displayName: workbookDisplayName
    serializedData: serializedData
    version: 'Notebook/1.0'
    sourceId: workbookSourceId
    category: 'workbook'
  }
}

output workbookId string = workbook.id
