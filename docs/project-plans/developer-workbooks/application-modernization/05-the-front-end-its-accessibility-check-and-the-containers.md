---
title: "Chapter 05 — The Front End, Its Accessibility Check and the Containers"
description: "The React front end of the reference implementation: component tests against a fake service, an automated accessibility check that runs axe-core's WCAG 2.0 Level A and AA rules on each screen state and proves it can fail, the production build, and the containers that serve it with the API and PostgreSQL. What an automated check can't decide under Section 508 and OMB M-24-08, and what a trained tester still does. Lab 1 runs the tests, reads the accessibility report, builds the app and writes the step's evidence record; Lab 2 runs the containers on a test host and records the manual checks."
doc-type: workbook-chapter
audience: [Technical]
family: dw-application-modernization
part: How
series-order: 5
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
---
# Chapter 05 — The Front End, Its Accessibility Check and the Containers

*A rebuilt screen is an alteration under the Revised 508 Standards. An automated check in the pipeline catches what rules can catch, every build; a person still decides conformance.*

::: {.callout-note}
## In this chapter
The front end of [Book 18's target architecture](../../../books/b18-application-modernization/03-the-target-reference-architecture.md#front-ends-react) and the Section 508 gate of [Book 18, Chapter 06](../../../books/b18-application-modernization/06-compliance-by-design.md#section-508-gate). You start with what the law, the standards and OMB ask, then read the kit's component tests, the accessibility check this workbook added to it, and the containers. Lab 1 runs the tests and the check and builds the app; Lab 2 runs the containers on a test host and records a tester's manual checks.
:::

## Goal and audience

**Goal.** By the end of this chapter you can run an automated WCAG 2.0 A and AA rule check on every screen state in the pipeline, show that it can fail, and say what it leaves to a person.

**Audience.** Front-end developers, the accessibility tester, and the application's product manager, who [M-24-08](../../../books/b18-application-modernization/06-compliance-by-design.md#section-508-gate) makes responsible for conformance. You should be able to run `npm`.

## Start with the book and the standards

### What they give you

Section 508 requires that federal employees with disabilities have access to and use of information and data comparable to others, when an agency develops, procures, maintains or uses information and communication technology.[^am05-794d] The Revised 508 Standards require software and content to conform to WCAG 2.0 Level A and AA, and define an alteration as a change that affects the user interface, so a rebuilt front end is covered.[^am05-1194] OMB M-24-08 says to use automated tools together with targeted manual testing, because automated tools can't fully assess conformance.[^am05-m2408] axe-core is an open-source rules engine that tags each rule with the WCAG success criteria it tests.[^am05-axe]

### What they leave to you

Each row is pinned by a test in `web/src/a11y.test.jsx` or `App.test.jsx`.

| What the law and the tools give | Why it matters | What the kit adds |
|---|---|---|
| "Conform to WCAG 2.0 A and AA" | Nobody checks every screen state by hand on every build | axe-core's `wcag2a` and `wcag2aa` rules on each state: the case list, a case with the agent's result and a pending proposal, and the not-found message |
| A rules engine | A check that never fails proves nothing | A probe with an unnamed button and an unlabeled input, which must fail `button-name` and `label` |
| Rules that need a browser | jsdom doesn't lay out or paint | `color-contrast` turned off, with the reason written in the report; contrast is checked in a browser |
| "Automated tools can't decide conformance" | A clean scan is read as conformance | The report says which rules ran; Lab 2 records the manual checks beside it |
| Labeled controls and live regions | A screen reader user can't use an unlabeled form | The component tests find every control by its label or role, as assistive technology does |

**The verdict.** Use axe-core's rules as published, in the pipeline. Add the probe, the per-state report and the manual record; never call the scan a conformance result.

## The code

| Part | File | What it does |
|---|---|---|
| App | `web/src/App.jsx` | Case list with a status filter, case detail, **Run triage**, and the pending-proposals panel with **Approve** and **Reject** |
| Component tests | `web/src/App.test.jsx` | Six tests against a fake service (`fakeService.js`) |
| Accessibility check | `web/src/a11y.test.jsx` | Four tests: three screen states with no WCAG 2.0 A or AA rule violations, and the probe that must fail; writes `web/out/a11y-report.json` |
| Build | `web/vite.config.js` | Vite production build; the development server proxies `/api` to port 8080 |
| Containers | `docker-compose.yml`, `service/Dockerfile`, `web/Dockerfile`, `web/nginx.conf` | PostgreSQL 18, the API with the `demo` profile, and nginx serving the app on port 8081 |

The check pins axe-core 4.14.1, released November 16, 2026.[^am05-axe-version]

::: {.callout-important}
## Illustrative code
The tests use jsdom with `fetch` mocked; no browser runs. The containers have not been run by the authors: Lab 2 is their first run, and Docker wasn't available where the kit was built (Book 18, [Chapter 08](../../../books/b18-application-modernization/08-the-reference-implementation.md#what-was-verified-and-what-wasnt)).
:::

## Lab 1: fixtures, no tenant

You need Node.js 24, npm and PowerShell 7.4 or later; the packages download on the first run. Work in `examples/app-modernization`.

1. **Install the exact packages the lock file names:**

   ```powershell
   Set-Location web
   npm ci --no-audit --no-fund --silent
   ```

   <!-- capture:begin 05-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/05-1.txt))](captures/05-1.png){.lightbox fig-alt="Terminal window showing Set-Location web and what it printed"}

   <!-- capture:end -->

   Quiet means done: the first run downloads about a hundred packages and takes a few minutes.

2. **Run the component tests and the accessibility check:**

   ```powershell
   npx vitest run --reporter=json --outputFile=out/vitest.json
   Import-Module ../powershell/AppModernization/AppModernization.psm1
   Get-AmVitestResult -Path out/vitest.json | Format-Table
   ```

   <!-- capture:begin 05-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/05-2.txt))](captures/05-2.png){.lightbox fig-alt="Terminal window showing npx vitest run --reporter=json --outputFile=out/vitest.json and what it printed"}

   <!-- capture:end -->

   Ten tests in two files, none failed.

3. **Read the accessibility report:**

   ```powershell
   $a = Read-AmJson -Path out/a11y-report.json
   $a.standard; $a.engine; $a.rulesOff
   $a.states | ForEach-Object { [pscustomobject]@{ State = $_.state; Violations = (@($_.violations) | ForEach-Object { "$($_.rule) ($($_.wcag -join ' '))" }) -join ', ' } } | Format-Table -Wrap
   ```

   <!-- capture:begin 05-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/05-3.txt))](captures/05-3.png){.lightbox fig-alt="Terminal window showing $a = Read-AmJson -Path out/a11y-report.json and what it printed"}

   <!-- capture:end -->

   No violations on the three screen states; the probe fails `button-name` and `label`, both WCAG 4.1.2. Contrast is off, with the reason.

4. **Build the production bundle:**

   ```powershell
   npm run build --silent
   Get-ChildItem dist -Recurse -File | ForEach-Object { $_.FullName.Substring((Resolve-Path dist).Path.Length + 1) -replace '\\', '/' } | Sort-Object
   ```

   <!-- capture:begin 05-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/05-4.txt))](captures/05-4.png){.lightbox fig-alt="Terminal window showing npm run build --silent and what it printed"}

   <!-- capture:end -->

5. **Write the step's evidence record,** then go back to the kit's folder:

   ```powershell
   Set-Location ..
   Write-AmEvidenceRecord -Step A11Y -Path web/out/a11y-report.json, web/out/vitest.json, web/package-lock.json -OutputPath out/evidence -AsOf 2026-11-24T00:00:00Z | Format-List Record, Step, Files, Controls, KSIs, Other
   ```

   <!-- capture:begin 05-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/05-5.txt))](captures/05-5.png){.lightbox fig-alt="Terminal window showing Set-Location .. and what it printed"}

   <!-- capture:end -->

**Expected result:** ten passing tests, no violations on the three states, the probe caught, a built `dist` folder, and `record-001-A11Y.json`. Delete the outputs when you're done:

```powershell
Remove-Item -Recurse -Force out, web/out, web/dist
```

<!-- capture:begin 05-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/05-6.txt))](captures/05-6.png){.lightbox fig-alt="Terminal window showing Remove-Item -Recurse -Force out, web/out, web/dist and what it printed"}

<!-- capture:end -->

## Lab 2: a test host with Docker

Use a test host with Docker Engine and the Compose plugin, never production. You need PowerShell 7.4 or later and a browser with a screen reader, and a person trained to test against WCAG 2.0 AA, such as with the Trusted Tester process, for step 4. Work in `examples/app-modernization`. You'll replace `<db-password>` (a password for the test database) and `<tester-role>` (the tester's role, not their name).

1. **Set the test database's password,** in `.env`, which Git ignores:

   ```powershell
   (Get-Content .env.example) -replace '^POSTGRES_PASSWORD=.*', 'POSTGRES_PASSWORD=<db-password>' | Set-Content .env
   ```

2. **Build and start the three containers:**

   ```powershell
   docker compose up --build --detach
   do { Start-Sleep -Seconds 3 } until ((Invoke-RestMethod http://localhost:8081/api/cases -ErrorAction SilentlyContinue).Count -gt 0)
   docker compose ps --format 'table {{.Service}}\t{{.State}}\t{{.Ports}}'
   ```

   Three services running, the app on port 8081. This is the first run of the containers; record anything that fails as a finding against the kit.

3. **Call the API through nginx:**

   ```powershell
   Invoke-RestMethod 'http://localhost:8081/api/cases?status=OPEN' | Format-Table caseNumber, status, openedOn
   ```

4. **Test the screens by hand** at `http://localhost:8081`: keyboard only, a screen reader, magnification to 200 percent, contrast, and the not-found and decision error paths. Record the result:

   ```powershell
   [pscustomobject]@{ App = 'case-web'; Build = (git rev-parse --short HEAD); Checks = 'keyboard; screen reader; 200% zoom; contrast; error paths'; Expected = 'no WCAG 2.0 A or AA failure'; Observed = '<observed>'; Tester = '<tester-role>'; Date = (Get-Date -Format 'yyyy-MM-dd') } | Export-Csv manual-508-test.csv -NoTypeInformation
   ```

   Replace `<observed>` with each failure by success criterion and severity, or "none found".

5. **Back it out:** stop the containers and delete their volume and images, and `.env`:

   ```powershell
   docker compose down --volumes --rmi local
   Remove-Item .env
   ```

## Verified facts

| Item | Value | Source |
|---|---|---|
| Section 508 | Comparable access and use for federal employees with disabilities | [^am05-794d] |
| Revised 508 Standards | WCAG 2.0 Level A and AA for software and content; "alteration" includes a user interface change | [^am05-1194] |
| M-24-08 | Automated tools together with targeted manual testing | [^am05-m2408] |
| axe-core | Rules tagged with WCAG criteria; tags `wcag2a` and `wcag2aa` | [^am05-axe] |
| axe-core version | 4.14.1, published November 16, 2026 | [^am05-axe-version] |
| The kit's web tests | 10 pass (6 component, 4 accessibility) | Lab 1, November 24, 2026 |
| The containers | *Not verified* | Book 18, [Chapter 08](../../../books/b18-application-modernization/08-the-reference-implementation.md#what-was-verified-and-what-wasnt) |

## Federal requirements and evidence

The record's controls, KSIs and other requirements are the kit's `config/requirements.json`, step `A11Y`.[^am05-oscal] [^am05-ksi]

| What the output proves | Requirement it supports | KSI it aligns to | Who keeps it |
|---|---|---|---|
| Every build ran the component tests and the WCAG 2.0 A and AA rules on each screen state, and the rules can fail (Lab 1, steps 2 and 3) | CM-3(2), Testing, Validation, and Documentation of Changes | KSI-CMT-VTD | The front-end owner; the ISSO keeps the record |
| An automated result and a manual test record, kept together, as M-24-08 asks (Lab 1, step 3; Lab 2, step 4) | Section 508; the Revised 508 Standards; OMB M-24-08 | — | The product manager and the Section 508 program manager's delegate |

KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its evidence up with them and doesn't report them. A clean automated check supports, and never decides, Section 508 conformance *(design guidance)*.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A clean scan reported as conformance | Failures only a person can find ship | The report lists the rules that ran; the manual record sits beside it |
| A check that can't fail | It passes broken screens | The probe must fail |
| Contrast never checked | Low-contrast text ships | `color-contrast` off only in jsdom, with the reason; checked in Lab 2 |
| A screen state left out | A modal or an error isn't checked | One check per state; add a state with every new screen |
| `.env` committed | The database password leaks | `.gitignore`; Lab 2 deletes it |

## Checklist

- [ ] The accessibility check runs in the pipeline and fails the build on a violation.
- [ ] Every screen state has a check, and the probe still fails.
- [ ] A trained tester's manual record exists for the release.
- [ ] The containers started on the test host, or their failures are recorded.
- [ ] The test host's containers, volume and `.env` were removed.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 04 — An Agent That Only Proposes](04-an-agent-that-only-proposes.md) · [Workbook index](index.md) · [Next: Chapter 06 — The Application's Identity: Redirect URIs and Assignment →](06-the-applications-identity-redirect-uris-and-assignment.md)
:::

[^am05-794d]: 29 U.S.C. §794d, "Electronic and information technology," subsections (a)(1)(A) and (a)(1)(B), <https://www.law.cornell.edu/uscode/text/29/794d> (accessed Nov 2, 2026; carried from Book 18, Chapter 06).
[^am05-1194]: U.S. Access Board, *Information and Communication Technology: Revised 508 Standards and 255 Guidelines*, Appendix A to 36 CFR part 1194: E103.4 (definition of "alteration") and E207.2 (WCAG conformance for software), <https://www.access-board.gov/ict/> (accessed Nov 2, 2026; carried from Book 18, Chapter 06).
[^am05-m2408]: Office of Management and Budget, M-24-08, *Strengthening Digital Accessibility and the Management of Section 508 of the Rehabilitation Act*, December 21, 2023, §III.E and footnote 31, <https://www.whitehouse.gov/wp-content/uploads/2023/12/M-24-08-Strengthening-Digital-Accessibility-and-the-Management-of-Section-508-of-the-Rehabilitation-Act.pdf> (accessed Nov 2, 2026; carried from Book 18, Chapter 06).
[^am05-axe]: Deque Systems, axe-core, "Rule Descriptions" (rules and their WCAG tags), <https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md> (read November 24, 2026).
[^am05-axe-version]: npm registry, `axe-core` package, version 4.14.1, published 2026-11-16, <https://registry.npmjs.org/axe-core> (read November 24, 2026).
[^am05-oscal]: National Institute of Standards and Technology, SP 800-53 Rev. 5 OSCAL catalog, release 5.2.0, <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (accessed Nov 11, 2026; carried from Book 18, Appendix A).
[^am05-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/providers/20x/key-security-indicators/> (read November 9, 2026; carried from *Building Provider Notices*).
