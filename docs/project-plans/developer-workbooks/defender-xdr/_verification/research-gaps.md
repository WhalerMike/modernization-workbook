# Research gaps — Building Defender XDR

Open questions found while writing the workbook on November 17, 2026. Each is a place the kit makes a choice Learn didn't settle; each says what the kit does meanwhile and how to close it.

| # | Question | Where | What the kit does meanwhile | How to close it |
|---|---|---|---|---|
| 1 | Does Learn name an API for Defender unified RBAC roles and assignments? | Chapter 01 | Reads a role export the operator files | Search Learn for a Graph or Defender API for unified RBAC; if one exists, add a declared read and a fixture |
| 2 | The exact `OnboardingStatus` and `SensorHealthState` strings advanced hunting returns | Chapter 02, `config/coverage.json` | Counts only listed values as protected; prints and flags any other | Read `raw/coverage-devices.json` in the test tenant (Chapter 02, Lab 2) and update the list with the date |
| 3 | That `Get-MpComputerStatus` reports active mode as `AMRunningMode` `Normal` | Chapter 03, `Get-XdrPreventionFinding` | Expects `Normal` | Read the cmdlet's Learn reference and a test device's value |
| 4 | The `VulnerabilitySeverityLevel` strings | Chapter 05, the guide's query | Uses the guide's `Critical` and `High` | Check `raw/tvm-high-critical.json` in the test tenant; the guide lists the same gap |
| 5 | GCC availability of the Graph `detectionRules` API | Chapters 06 and 09 | Deploys through Graph; `detections.deployVia: portal` writes a portal sheet from the same files | Watch the Learn pages for a national-cloud table; try `GET` in the test tenant and record the result |
| 6 | GCC availability of automatic attack disruption | Chapter 07 | Checks the settings either way | The guide lists the same gap; confirm in the tenant |
| 7 | The portal path to the Device groups page | Chapter 07, Lab 2 | Names **Settings** > **Endpoints** > **Device groups** | Re-read Learn's device groups page and correct the path |
| 8 | The detection test on Windows clients | Chapter 09, Step 4 | Uses a custom detection's known-bad replay as the smoke test | The guide lists the same gap |
