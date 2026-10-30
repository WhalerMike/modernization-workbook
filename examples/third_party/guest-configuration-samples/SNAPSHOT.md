# Guest configuration package samples: a pinned copy of Microsoft's samples

This folder is an unmodified copy of part of Microsoft's machine configuration package samples, taken from [Azure/azure-policy](https://github.com/Azure/azure-policy/tree/ca85d6182e5a855bcdd1462421d5a1305c14c1df/samples/GuestConfiguration/package-samples) at commit `ca85d6182e5a855bcdd1462421d5a1305c14c1df` (August 4, 2021), retrieved October 30, 2026. Learn's machine configuration overview lists this repository's sample DSC resource modules under "Machine configuration samples" ([What is Azure Machine Configuration?](https://learn.microsoft.com/azure/governance/machine-configuration/overview/01-overview-concepts)). It is MIT-licensed; `LICENSE` is the repository's license file. The samples' own README says they are shared to help authors and are not the project that manages built-in content.

**Why a copy, not only a link.** A link to `master` changes under you. This copy is the exact version the [Developer Workbook, Chapter 07](../../../docs/books/b19-developer-workbook/07-machine-configuration-packages.md) was written and tested against. `examples/machine-configuration/tests/LearnBaseline.Tests.ps1` packages its example project with the current GuestConfiguration module and pins what has changed since it was written.

**How it stays honest.**

- `snapshot.json` records the upstream repository, path, commit, dates, license and the size and SHA-256 of every file here. `scripts/tests/test_third_party_snapshots.py` fails if any file is changed, added or removed.
- The weekly source watch follows commits to the upstream folder (`guest-configuration-samples-commits` in `data/source-watch/feeds.json`) and the GuestConfiguration module's own repository (`guestconfiguration-module-commits`), and reports each one in its issue under B19.
- To move to a newer upstream commit: review the upstream change, copy the files from that commit, regenerate `snapshot.json`, rerun the Chapter 07 labs and tests, and open a pull request. Never edit the files here; changes the program needs go in `examples/machine-configuration`.

**What was copied.** The samples' `README.md` and the worked example project in `.example-project/`: `createPackage.ps1`, the compiled `AdministratorsGroupMembers.mof`, and the `LocalGroup` DSC resource module it uses. Not copied: the 37 compiled configurations for built-in policies, the 21 resource modules (one of them carries about 1.7 MB of help files) and the Linux policy definition samples. They are listed in `snapshot.json`.

These files keep their upstream bytes, line endings included, so the hashes match the upstream commit.
