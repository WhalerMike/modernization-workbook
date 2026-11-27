---
title: "Privacy"
subtitle: "What this site counts, what other services see when you visit, and how to opt out"
description: "The Federal Modernization Workbook's privacy notice: cookie-free page-view counting with GoatCounter, what is and isn't recorded, the other services a page load reaches (GitHub Pages, Google Fonts, YouTube's privacy-enhanced player), and a one-click opt-out that also honours Do Not Track and Global Privacy Control."
doc-type: section-landing
---

# Privacy {.unnumbered}

The workbook counts page views so its editor can tell which books people read and which they don't. It does this without cookies and without collecting anything that identifies you. This page says what is counted, what other services see when you load a page, and how to switch the counting off.

The site asks you for nothing. It has no accounts, no forms, and no comment boxes, so the only information it handles is what your browser sends when it loads a page.

## What the workbook counts {#counting}

Page views are counted with [GoatCounter](https://www.goatcounter.com/), an open-source analytics service that sets no cookies and keeps no personal data. For each page view it records:

- the page's address and title,
- the page that linked you here (the referrer), if your browser sends one,
- your browser and operating system family, and your screen size, in broad ranges,
- your country, worked out from your IP address. The address itself isn't stored.

GoatCounter doesn't track you from one site to another, and the workbook doesn't use the counts to tell visitors apart. The counts are used for one thing: deciding where the workbook's effort goes next.

This is the kind of measurement that Book 14's chapter on privacy describes as needing only a published explanation and an easy opt-out: [Privacy and PII Processing](../books/b14-compliance/08-privacy-pii-processing.md). This page is that explanation, and the button below is the opt-out.

## Opting out {#opt-out}

Nothing is counted if your browser sends **Do Not Track** or **Global Privacy Control**. You can also switch counting off for this browser here. The setting is kept in your browser's local storage, not in a cookie, and it stays until you switch counting back on or clear the site's data.

```{=html}
<div class="fmw-optout" style="border:1px solid #d6dbe1;border-radius:6px;padding:.9rem 1rem;margin:1rem 0;">
  <p id="fmw-optout-status" style="margin:0 0 .6rem 0;">Checking this browser's setting…</p>
  <button type="button" id="fmw-optout-button" class="btn btn-outline-primary btn-sm">Switch counting off</button>
</div>
<script>
  (function () {
    var KEY = "fmw-no-analytics";
    var status = document.getElementById("fmw-optout-status");
    var button = document.getElementById("fmw-optout-button");
    var signal = navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl === true;
    function off() { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } }
    function show() {
      if (signal) {
        status.textContent = "Your browser sends Do Not Track or Global Privacy Control, so this site doesn't count your page views.";
        button.style.display = "none";
        return;
      }
      if (off()) {
        status.textContent = "Counting is switched off in this browser.";
        button.textContent = "Switch counting back on";
      } else {
        status.textContent = "Counting is on in this browser.";
        button.textContent = "Switch counting off";
      }
    }
    button.addEventListener("click", function () {
      try {
        if (off()) { localStorage.removeItem(KEY); } else { localStorage.setItem(KEY, "1"); }
      } catch (e) {
        status.textContent = "This browser blocks local storage, so the setting can't be saved. Do Not Track or Global Privacy Control will work instead.";
        return;
      }
      show();
    });
    show();
  })();
</script>
```

## Other services a page load reaches {#third-parties}

Some requests leave your browser whether or not counting is on:

| Service | Why the page reaches it | What it sees |
|---|---|---|
| GitHub Pages | Hosts the site | Your IP address and the page requested, as in any web server's logs. See GitHub's [privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement). |
| Google Fonts | Serves the site's typefaces | Your IP address and browser details when the fonts are fetched. |
| YouTube, privacy-enhanced mode | Plays the narrated videos on pages that embed one | The player comes from `youtube-nocookie.com`, YouTube's privacy-enhanced mode, in which YouTube says it doesn't use what you view to personalise your experience unless you play the video. |

: Services a page load reaches {.striped}

The Word, PowerPoint and video downloads come from GitHub, under the same privacy statement.

## Questions {#questions}

To ask about this page, or to report something the site does that it doesn't describe, open an issue in the [workbook's repository](https://github.com/WhalerMike/modernization-workbook/issues).
