# Verification — Learning path: DNS, DHCP and IPAM

Files: `docs/training/dns-dhcp-ipam/index.md` and its modules, `01-read-the-naming-plane.md` and `02-the-active-directory-dns-departure.md`.
Example code: `examples/start-kit` (the `FMPADAssessment` DNS and DHCP collectors, and the `FMPDdiReadiness` module this path added, with its tests and the fixture `tests/fixtures/ddi`).
Verified: 2026-11-24

Method:
- The path adds no new product or federal facts. Every fact a unit states is carried by link from Book 08 (Chapters 01 to 04 and 10, and Appendix B) and relies on that book's verification logs and footnotes. New writing is limited to the path, the module framing, objectives, unit glue, knowledge-check questions and time estimates.
- The departure register's targets, Azure-native equivalents, methods and risks are Chapter 10's "Where each component goes" table, word for word except for links; its findings name the Book 08 section that explains each. The tests check the rows against the chapter's components.
- Each knowledge-check answer links the section that teaches it; the answer was checked against that section's text.
- Every Lab 1 command was run on November 24, 2026, on Windows 11, in PowerShell 7.6 and in Windows PowerShell 5.1, from `examples/start-kit`, in the order the modules give them. The output shown is what they printed, with color codes and trailing blank lines removed; both editions printed the same values. A script compared each "Expected output" block with the printed output: no differences. Nothing contacted a server.
- The fixture is a fictional domain written in the shape `Get-FMPDNSAssessment` and `Get-FMPDHCPInventory` write. A test runs the real DNS collector under the kit's mocks and builds the register from its output, so the fixture and the collector can't drift apart unnoticed.
- The Start Kit's Pester suite (280 tests, the new `DdiReadiness.Tests.ps1` among them, and the safety tests that parse the new module for write commands) passed in PowerShell 7.6 and in Windows PowerShell 5.1 with Pester 5.9, on November 24, 2026.
- Lab 2's build commands are Microsoft Learn's: `Install-ADDSForest` (AddsDeployment module reference), `Add-DhcpServerSecurityGroup`, `Add-DhcpServerInDC` and `Add-DhcpServerv4Scope` (Deploy DHCP Using Windows PowerShell), the DnsServer module reference, and the Hyper-V module's `Checkpoint-VM`, `Copy-VMFile` and `Restore-VMSnapshot`. Each Learn page linked from the modules returned HTTP 200 on November 24, 2026; the `Get-DhcpServerv4DnsSetting` fields the lab names (`DynamicUpdates`, `DeleteDnsRROnLeaseExpiry`, `NameProtection`) were checked against `Set-DhcpServerv4DnsSetting`'s parameters on Learn the same day. The Lab 2 steps weren't run by the authors, as the pages say.
- Time estimates are the program's planning figures *(design guidance)*, not measurements.
- Claim wording: the outputs *support* the controls; the assessor decides them. KSIs are written as indicators for cloud service providers that the agency lines its evidence up with. Only control-to-KSI pairs already verified in the workbook appear: CM-8 to KSI-PIY-GIV (Book 10, Chapter 06; Book 13, Appendix A), CM-3 to KSI-CMT-LMC and KSI-CMT-RVP, and CP-2 to KSI-RPL-ARP (the provider notices guide's and Book 13's logs). SC-20, SC-21, SC-22 and CM-2 have no pairing in those mappings, and the tables say so rather than naming one.

## Review gate

`review-status: pending` on the index and both modules. Not approved here.
