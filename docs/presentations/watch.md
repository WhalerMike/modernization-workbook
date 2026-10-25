---
title: "Videos"
subtitle: "Every narrated briefing, deep dive and research deck, playable in the browser with captions"
description: "The Federal Modernization Workbook's video library: every narrated presentation, executive briefing, technical deep dive and research deck, playable in the browser with English captions, or downloadable as an MP4."
doc-type: section-landing
fmw-eyebrow: "Videos"
---

# Videos {.unnumbered}

```{=html}
<div id="fmw-player" style="margin-bottom:1.5rem">
  <h2 id="fmw-player-title" class="anchored" style="margin-top:0">Loading…</h2>
  <video id="fmw-player-video" controls preload="metadata" playsinline style="width:100%;max-width:960px;height:auto;border:1px solid #dfe5ec;border-radius:6px;background:#000">
    <track id="fmw-player-track" kind="captions" srclang="en" label="English">
  </video>
  <p id="fmw-player-links" style="font-size:.9rem;color:#475569"></p>
</div>
<noscript><p>The player needs JavaScript. Every video below can also be downloaded as an MP4.</p></noscript>
<script>
(function () {
  var params = new URLSearchParams(window.location.search);
  var wanted = params.get("v") || "Start_Here_Narrated";
  var title = document.getElementById("fmw-player-title");
  var video = document.getElementById("fmw-player-video");
  var track = document.getElementById("fmw-player-track");
  var links = document.getElementById("fmw-player-links");
  function link(href, text) {
    var a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    return a;
  }
  fetch("videos.json")
    .then(function (r) { return r.json(); })
    .then(function (list) {
      var v = list.filter(function (x) { return x.id === wanted; })[0];
      if (!v) {
        title.textContent = "That video isn't in the library";
        video.hidden = true;
        links.textContent = "Choose one from the list below.";
        return;
      }
      title.textContent = v.title;
      document.title = v.title + " – Federal Modernization Workbook";
      video.setAttribute("aria-label", v.title + ", a " + v.minutes + "-minute narrated video");
      video.src = v.mp4;
      track.src = "../../" + v.vtt;
      links.textContent = v.minutes + " minutes · captions from the player's CC button · ";
      links.appendChild(link(v.mp4, "Download MP4"));
      if (v.deck) { links.appendChild(document.createTextNode(" · ")); links.appendChild(link("../../" + v.deck, "Narrated deck")); }
      if (v.script) { links.appendChild(document.createTextNode(" · ")); links.appendChild(link(v.script, "Script")); }
      if (params.get("v")) { document.getElementById("fmw-player").scrollIntoView(); }
    })
    .catch(function () {
      title.textContent = "The player couldn't load";
      links.textContent = "Every video below can still be downloaded as an MP4.";
    });
})();
</script>
```

Choose any video below to play it here. Each one streams in the browser from the workbook's [video release](https://github.com/WhalerMike/modernization-workbook/releases/tag/videos-2026-10-23), with English captions from the player's CC button, and each can be downloaded as an MP4 to watch offline. The decks themselves, for presenting live, are on the [Presentations](index.md) page.

## The library

{{< include _video-library.md >}}
