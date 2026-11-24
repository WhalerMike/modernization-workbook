---
title: "Set Up for the Labs"
subtitle: "Git, Git Bash, Python and PowerShell on your machine: the commands to install each, check it, and run the learning paths' labs"
description: "What a laptop needs to run the learning paths' Lab 1s: Git and Git Bash, with a short Git Bash command guide; Python 3.10 or later in a virtual environment, with the packages the kits import; PowerShell 7, Pester 5 and the execution policy; and the official documentation and training for each."
doc-type: section-landing
fmw-eyebrow: "Training"
---

# Set Up for the Labs {.unnumbered}

Every learning path's Lab 1 runs on a laptop against the kit's fictional fixtures. This page sets up what those labs run on. Install only what your path needs. The [Training page's table](index.md#get-the-code) names each path's language, and [Labs](labs.md) lists what each chapter's lab needs.

| You need | For |
|---|---|
| [PowerShell 7](#powershell-7) with Pester 5 | Every path except HR-Driven Identity, which is Python only |
| [Python](#python) 3.10 or later | Microsoft Automation, Ticket-to-Machine, HR-Driven Identity and Attribute-Driven Migration, and the drift pipeline steps in Privileged Access and Non-Person Identity |
| [Git](#git), with Git Bash on Windows | A clone instead of a zip; the Attribute-Driven Migration path's Module 3; and a Bash shell on Windows for the labs written for Bash |
| Node.js | Ticket-to-Machine only: Module 1's ServiceNow script tests |

: What each tool is for {.striped .hover}

On Windows, the install commands use the Windows Package Manager, `winget`, in PowerShell. After installing anything, open a new terminal, so it finds the new command.

## PowerShell 7 {#powershell-7}

The kits' scripts say which PowerShell they need with `#Requires -Version`: 7.1 or later for most kits, 7.2 for Ticket-to-Machine and the HR-to-Entra middleware, and 7.5 for Microsoft Automation. Windows PowerShell 5.1, which comes with Windows, isn't enough. Install PowerShell 7 and Pester 5, in Windows PowerShell or PowerShell:

```powershell
winget install --id Microsoft.PowerShell -e --source winget
```

Then open **PowerShell 7** (`pwsh`), and install Pester 5 for your account:

```powershell
Install-Module Pester -MinimumVersion 5.5.0 -Scope CurrentUser -Force -SkipPublisherCheck
```

Check both:

```powershell
$PSVersionTable.PSVersion.ToString()
(Get-Module -ListAvailable Pester | Sort-Object Version -Descending | Select-Object -First 1).Version.ToString()
```

The first line prints 7.1 or later, and the second 5.5.0 or later. On macOS and Linux, Microsoft Learn's [Install PowerShell](https://learn.microsoft.com/powershell/scripting/install/install-powershell) page has the commands for each system.

**The execution policy, on Windows.** On a Windows client, PowerShell's default execution policy is **Restricted**, which runs no scripts at all; Windows Server's is **RemoteSigned**.[^setup-policy] The labs need RemoteSigned, set for your account only:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Under RemoteSigned, a script downloaded from the internet runs only once it's unblocked, which is why each path's **Get the code** steps run `Unblock-File` on the kit.[^setup-unblock] Check what applies with `Get-ExecutionPolicy -List`. Execution policies apply only on Windows.

## Python {#python}

The kits need Python 3.10 or later, and only a few packages. Install Python once, make one virtual environment for every path, and install the packages into it. In an active virtual environment the command is `python` on every system, as the labs write it.

**Install Python.** On Windows:

```powershell
winget install --id Python.Python.3.14 -e --source winget
```

On macOS, with Homebrew:

```bash
brew install python
```

On Debian or Ubuntu (the `venv` module is a separate package there):

```bash
sudo apt-get install python3 python3-venv
```

On Fedora:

```bash
sudo dnf install python3
```

The Python documentation also offers the Python install manager for Windows, from [python.org/downloads](https://www.python.org/downloads/); [Using Python on Windows](https://docs.python.org/3/using/windows.html) explains both.

**If `python` opens the Microsoft Store on Windows,** Windows' shortcut for Python is answering instead of the Python you installed. Microsoft's [Python on Windows for beginners](https://learn.microsoft.com/windows/python/beginners) says to turn it off: open **Start**, search for **Manage app execution aliases**, and turn off the two **App Installer** entries for Python.

**Make the virtual environment.** One environment, `fmw-venv` in your home folder, serves every path. In PowerShell (if `py` isn't found, use `python`):

```powershell
py -m venv $HOME\fmw-venv
& $HOME\fmw-venv\Scripts\Activate.ps1
```

In Git Bash on Windows (Windows keeps the activate script in `Scripts`):

```bash
python -m venv ~/fmw-venv
source ~/fmw-venv/Scripts/activate
```

On macOS or Linux:

```bash
python3 -m venv ~/fmw-venv
source ~/fmw-venv/bin/activate
```

The prompt starts with `(fmw-venv)` while it's active. Activate it again in each new terminal, with the second line of your block. In PowerShell, `Activate.ps1` needs the RemoteSigned policy [above](#powershell-7).[^setup-venv]

**Install the packages.** With the environment active, one line installs every package the Lab 1s import:

```bash
python -m pip install pytest requests cryptography PyYAML jsonschema regex
```

| Package | Used by |
|---|---|
| `pytest` | Every kit's Python tests |
| `requests`, `cryptography` | Ticket-to-Machine's ServiceNow and SailPoint clients; `cryptography` only for the certificate tests |
| `PyYAML`, `jsonschema`, `regex` | The drift pipeline (`drift-pipeline`), in the HR-Driven Identity, Privileged Access, Non-Person Identity and Attribute-Driven Migration paths; `jsonschema` and `regex` only to validate its OSCAL output |
| `azure-identity` | Microsoft Automation's Lab 2 only, which signs in to a test tenant: `python -m pip install azure-identity` |

: The Python packages the kits import {.striped .hover}

Every other Python script in the kits uses only the standard library. Check the setup from a kit's folder, for example Ticket-to-Machine's, with its Module 1, Lab 1, Step 1:

```bash
python -m pytest tests/python/test_finding_contract.py -q
```

It ends with `26 passed`. The packaging guide [Install packages in a virtual environment using pip and venv](https://packaging.python.org/en/latest/guides/installing-using-pip-and-virtual-environments/) explains virtual environments step by step.

**Node.js** (Ticket-to-Machine only), on Windows:

```powershell
winget install --id OpenJS.NodeJS.LTS -e --source winget
```

## Git {#git}

The zips don't need Git. Install it if you want a clone of the repository instead of a zip, for the Attribute-Driven Migration path's Module 3, or for a Bash shell on Windows. Git's own download page is [git-scm.com/install](https://git-scm.com/install/), with the installers for Windows, macOS and Linux. Its commands:

On Windows, in PowerShell:

```powershell
winget install --id Git.Git -e --source winget
```

On macOS, with Homebrew (or run `xcode-select --install` for Apple's Command Line Tools, which include Git):

```bash
brew install git
```

On Debian or Ubuntu:

```bash
sudo apt-get install git
```

On Fedora:

```bash
sudo dnf install git
```

Open a new terminal, then check it:

```bash
git --version
```

To clone the repository into your home folder, then go to a kit's folder (here Microsoft Automation's; the [Training page's table](index.md#get-the-code) names each path's kit, the last folder of its path), in PowerShell:

```powershell
git clone https://github.com/WhalerMike/modernization-workbook.git $HOME\modernization-workbook
Set-Location $HOME\modernization-workbook\examples\ms-automation
```

Or in Bash:

```bash
git clone https://github.com/WhalerMike/modernization-workbook.git ~/modernization-workbook
cd ~/modernization-workbook/examples/ms-automation
```

To bring a clone up to date later, run `git pull` in it.

## Git Bash {#git-bash}

[Git for Windows](https://gitforwindows.org/) includes Git Bash, a Bash shell for Windows. Open it from **Start** > **Git Bash**. The labs written for Bash (Microsoft Automation, Ticket-to-Machine, HR-Driven Identity, and some Attribute-Driven Migration and drift pipeline steps) run in it as written; the PowerShell labs run in PowerShell 7, not here.

| To | Type |
|---|---|
| See which folder you're in | `pwd` |
| List the files, with hidden ones | `ls -la` |
| Go to your Downloads folder | `cd ~/Downloads` |
| Go up one folder | `cd ..` |
| Go to a Windows path (`C:\Users` is `/c/Users`) | `cd /c/Users` |
| Make a folder | `mkdir out` |
| Copy a file | `cp config/settings.json settings-copy.json` |
| Show a file | `cat README.md` |
| Page through a long file (`q` quits) | `less README.md` |
| Show the first or last lines | `head -20 out/day1.csv` or `tail -20 out/day1.csv` |
| Find text in files | `grep -rn "finding" config` |
| Delete a folder and everything in it (the labs' clean-up step) | `rm -rf out` |
| See which `python` runs | `which python` |
| Open this folder in File Explorer | `explorer .` |
| Stop a running command | **Ctrl+C** |
| Finish a file or folder name | **Tab** |
| Run an earlier command again | **Up arrow**, or `history` |
| Paste | **Shift+Insert**, or right-click and choose **Paste** |
| Copy | Select the text, then **Ctrl+Insert** |

: Git Bash: the commands the labs use {.striped .hover}

`~` is your Windows home folder, `C:\Users\<you>`, so `~/Downloads` is the same folder as `$HOME\Downloads` in PowerShell. Paths use `/`, not `\`.

**Interactive programs.** Git Bash runs in the mintty terminal, and Git for Windows' [FAQ](https://gitforwindows.org/faq.html) says some interactive console programs don't work there; its fix is the `winpty` utility. If `python` with no script name shows no `>>>` prompt, start it with `winpty python`. The labs' commands aren't interactive, so they don't need it.

## Documentation and training {#learn-more}

| Topic | Documentation | Training |
|---|---|---|
| Git | [Git reference](https://git-scm.com/docs) and the free book [*Pro Git*](https://git-scm.com/book/en/v2) | Microsoft Learn: [Introduction to Git](https://learn.microsoft.com/training/modules/intro-to-git/), six units; [GitHub Learn](https://learn.github.com/skills) |
| Git Bash | [Git for Windows](https://gitforwindows.org/) and its [FAQ](https://gitforwindows.org/faq.html) | Git Bash runs Bash, so a Bash tutorial applies; the table above covers what the labs use |
| Python | [Using Python on Windows](https://docs.python.org/3/using/windows.html); [venv](https://docs.python.org/3/library/venv.html); [Install packages in a virtual environment](https://packaging.python.org/en/latest/guides/installing-using-pip-and-virtual-environments/) | Microsoft Learn: [Python on Windows for beginners](https://learn.microsoft.com/windows/python/beginners), and the video series [Python for Beginners](https://learn.microsoft.com/shows/intro-to-python-development/) |
| PowerShell | [Install PowerShell](https://learn.microsoft.com/powershell/scripting/install/install-powershell); [about_Execution_Policies](https://learn.microsoft.com/powershell/module/microsoft.powershell.core/about/about_execution_policies); [Unblock-File](https://learn.microsoft.com/powershell/module/microsoft.powershell.utility/unblock-file) | The [Microsoft Automation learning path](index.md#microsoft-automation-learning-path) uses PowerShell 7 with Microsoft Graph and Azure |

: Where to read more {.striped .hover}

[^setup-policy]: Microsoft Learn, "about_Execution_Policies": "the effective execution policy is Restricted for Windows clients and RemoteSigned for Windows Server"; "Enforcement of these policies only occurs on Windows platforms." <https://learn.microsoft.com/powershell/module/microsoft.powershell.core/about/about_execution_policies> (accessed Nov 24, 2026).

[^setup-unblock]: Microsoft Learn, "about_Execution_Policies" (RemoteSigned runs unsigned scripts downloaded from the internet "if the scripts are unblocked, such as by using the `Unblock-File` cmdlet") and "Unblock-File" ("lets you open files that were downloaded from the internet"), <https://learn.microsoft.com/powershell/module/microsoft.powershell.utility/unblock-file> (accessed Nov 24, 2026).

[^setup-venv]: Python documentation, "venv — Creation of virtual environments": "On Microsoft Windows, it may be required to enable the `Activate.ps1` script by setting the execution policy for the user." <https://docs.python.org/3/library/venv.html> (accessed Nov 24, 2026).
